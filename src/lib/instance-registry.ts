/**
 * Instance Registry
 * Maps Slack team_id to instance domain
 * 
 * Storage: In-memory + Hetzner labels (KV can be added later)
 */

const HETZNER_API_TOKEN = process.env.HETZNER_API_TOKEN;
const HETZNER_API = 'https://api.hetzner.cloud/v1';
const DOMAIN_SUFFIX = 'ds.jgiebz.com';

interface InstanceMapping {
  teamId: string;
  teamName: string;
  domain: string;
  instanceId: number;
  botToken: string;
  installedAt: string;
}

// In-memory cache (persists across warm serverless invocations)
const memoryCache = new Map<string, InstanceMapping>();

// Secondary cache: domain → teamId (for reverse lookup)
const domainToTeam = new Map<string, string>();

/**
 * Save instance mapping after OAuth
 */
export async function saveInstanceMapping(mapping: InstanceMapping): Promise<void> {
  // Save to memory cache
  memoryCache.set(mapping.teamId, mapping);
  domainToTeam.set(mapping.domain, mapping.teamId);
  
  console.log(`Saved mapping: ${mapping.teamId} (${mapping.teamName}) → ${mapping.domain}`);
  
  // Also update Hetzner server labels as persistent backup
  if (mapping.instanceId && HETZNER_API_TOKEN) {
    try {
      // Get current server to preserve existing labels
      const getRes = await fetch(`${HETZNER_API}/servers/${mapping.instanceId}`, {
        headers: { 'Authorization': `Bearer ${HETZNER_API_TOKEN}` },
      });
      
      if (getRes.ok) {
        const serverData = await getRes.json();
        const currentLabels = serverData.server?.labels || {};
        
        // Update with Slack info
        const updatedLabels = {
          ...currentLabels,
          'slack-team-id': mapping.teamId,
          'slack-team-name': mapping.teamName.toLowerCase().replace(/[^a-z0-9-]/g, '-').substring(0, 63),
        };
        
        await fetch(`${HETZNER_API}/servers/${mapping.instanceId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${HETZNER_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ labels: updatedLabels }),
        });
        
        console.log(`Updated Hetzner labels for instance ${mapping.instanceId}`);
      }
    } catch (error) {
      console.error('Failed to update Hetzner labels:', error);
    }
  }
}

/**
 * Get instance by Slack team_id
 */
export async function getInstanceByTeamId(teamId: string): Promise<InstanceMapping | null> {
  // 1. Check memory cache first (fastest)
  const cached = memoryCache.get(teamId);
  if (cached) {
    console.log(`Cache hit: ${teamId} → ${cached.domain}`);
    return cached;
  }
  
  // 2. Fallback: Search Hetzner servers by label
  if (HETZNER_API_TOKEN) {
    try {
      console.log(`Cache miss, searching Hetzner for team: ${teamId}`);
      
      const res = await fetch(
        `${HETZNER_API}/servers?label_selector=slack-team-id=${teamId}`,
        {
          headers: { 'Authorization': `Bearer ${HETZNER_API_TOKEN}` },
        }
      );
      
      if (res.ok) {
        const data = await res.json();
        const server = data.servers?.[0];
        
        if (server) {
          const clientSlug = server.labels?.client || server.name.replace('deepsignal-', '');
          const domain = `${clientSlug}.${DOMAIN_SUFFIX}`;
          
          const mapping: InstanceMapping = {
            teamId,
            teamName: server.labels?.['slack-team-name'] || 'Unknown',
            domain,
            instanceId: server.id,
            botToken: '', // Not stored in Hetzner for security
            installedAt: server.created,
          };
          
          console.log(`Found in Hetzner: ${teamId} → ${domain}`);
          
          // Cache for next time
          memoryCache.set(teamId, mapping);
          domainToTeam.set(domain, teamId);
          
          return mapping;
        }
      }
    } catch (error) {
      console.error('Hetzner lookup failed:', error);
    }
  }
  
  console.warn(`No instance found for team: ${teamId}`);
  return null;
}

/**
 * Get instance by domain (reverse lookup)
 */
export async function getInstanceByDomain(domain: string): Promise<InstanceMapping | null> {
  // Check reverse lookup cache
  const teamId = domainToTeam.get(domain);
  if (teamId) {
    return memoryCache.get(teamId) || null;
  }
  
  // Search Hetzner by domain
  if (HETZNER_API_TOKEN) {
    try {
      const clientSlug = domain.replace(`.${DOMAIN_SUFFIX}`, '');
      
      const res = await fetch(
        `${HETZNER_API}/servers?label_selector=client=${clientSlug}`,
        {
          headers: { 'Authorization': `Bearer ${HETZNER_API_TOKEN}` },
        }
      );
      
      if (res.ok) {
        const data = await res.json();
        const server = data.servers?.[0];
        
        if (server && server.labels?.['slack-team-id']) {
          const mapping: InstanceMapping = {
            teamId: server.labels['slack-team-id'],
            teamName: server.labels['slack-team-name'] || 'Unknown',
            domain,
            instanceId: server.id,
            botToken: '',
            installedAt: server.created,
          };
          
          memoryCache.set(mapping.teamId, mapping);
          domainToTeam.set(domain, mapping.teamId);
          
          return mapping;
        }
      }
    } catch (error) {
      console.error('Hetzner domain lookup failed:', error);
    }
  }
  
  return null;
}

/**
 * Get all registered instances (from cache only - for debugging)
 */
export function getAllCachedInstances(): InstanceMapping[] {
  return Array.from(memoryCache.values());
}

/**
 * Delete instance mapping
 */
export async function deleteInstanceMapping(teamId: string): Promise<void> {
  const mapping = memoryCache.get(teamId);
  if (mapping) {
    domainToTeam.delete(mapping.domain);
  }
  memoryCache.delete(teamId);
}

/**
 * Preload instances from Hetzner (call on startup)
 */
export async function preloadInstances(): Promise<number> {
  if (!HETZNER_API_TOKEN) return 0;
  
  try {
    const res = await fetch(
      `${HETZNER_API}/servers?label_selector=managed-by=deep-signal`,
      {
        headers: { 'Authorization': `Bearer ${HETZNER_API_TOKEN}` },
      }
    );
    
    if (res.ok) {
      const data = await res.json();
      let count = 0;
      
      for (const server of data.servers || []) {
        if (server.labels?.['slack-team-id']) {
          const clientSlug = server.labels?.client || server.name.replace('deepsignal-', '');
          const domain = `${clientSlug}.${DOMAIN_SUFFIX}`;
          
          const mapping: InstanceMapping = {
            teamId: server.labels['slack-team-id'],
            teamName: server.labels['slack-team-name'] || 'Unknown',
            domain,
            instanceId: server.id,
            botToken: '',
            installedAt: server.created,
          };
          
          memoryCache.set(mapping.teamId, mapping);
          domainToTeam.set(domain, mapping.teamId);
          count++;
        }
      }
      
      console.log(`Preloaded ${count} instances from Hetzner`);
      return count;
    }
  } catch (error) {
    console.error('Failed to preload instances:', error);
  }
  
  return 0;
}
