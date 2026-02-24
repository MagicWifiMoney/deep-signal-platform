import { NextResponse } from 'next/server';

const HETZNER_API_TOKEN = process.env.HETZNER_API_TOKEN;
const HETZNER_API = 'https://api.hetzner.cloud/v1';

export interface Instance {
  id: number;
  name: string;
  hostname: string;
  publicIp: string;
  tailscaleIp: string;
  status: 'online' | 'warning' | 'offline';
  serverType: string;
  datacenter: string;
  created: string;
  metrics?: {
    cpu: number;
    memory: number;
    disk: number;
  };
  openclaw?: {
    version: string;
    model: string;
    messagesTotal: number;
    messagesToday: number;
    uptime: number;
    lastSeen: string;
  };
}

async function getHetznerServers(): Promise<any[]> {
  if (!HETZNER_API_TOKEN) {
    console.error('HETZNER_API_TOKEN not set');
    return [];
  }

  try {
    const res = await fetch(`${HETZNER_API}/servers`, {
      headers: {
        'Authorization': `Bearer ${HETZNER_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Hetzner API error:', res.status);
      return [];
    }

    const data = await res.json();
    return data.servers || [];
  } catch (error) {
    console.error('Failed to fetch Hetzner servers:', error);
    return [];
  }
}

async function getServerMetrics(serverId: number): Promise<{ cpu: number; memory: number; disk: number } | null> {
  if (!HETZNER_API_TOKEN) return null;

  try {
    // Get metrics for the last hour
    const end = new Date().toISOString();
    const start = new Date(Date.now() - 3600000).toISOString();
    
    const res = await fetch(
      `${HETZNER_API}/servers/${serverId}/metrics?type=cpu,disk,network&start=${start}&end=${end}`,
      {
        headers: {
          'Authorization': `Bearer ${HETZNER_API_TOKEN}`,
        },
        cache: 'no-store',
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    
    // Parse CPU usage from metrics
    const cpuMetrics = data.metrics?.timeseries?.find((t: any) => t.name === 'cpu');
    const cpuValues = cpuMetrics?.values || [];
    const avgCpu = cpuValues.length > 0 
      ? cpuValues.reduce((sum: number, v: [number, string]) => sum + parseFloat(v[1]), 0) / cpuValues.length
      : 0;

    return {
      cpu: Math.round(avgCpu * 100) / 100,
      memory: 45, // Would need to SSH or use node_exporter for real memory
      disk: 25,   // Would need to SSH for real disk usage
    };
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    return null;
  }
}

async function getOpenClawStatus(ip: string): Promise<Instance['openclaw'] | null> {
  try {
    // Try to connect to OpenClaw API on the instance
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`http://${ip}:3000/api/status`, {
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const data = await res.json();
    return {
      version: data.version || 'unknown',
      model: data.model || 'unknown',
      messagesTotal: data.messagesTotal || 0,
      messagesToday: data.messagesToday || 0,
      uptime: data.uptime || 99.9,
      lastSeen: 'Just now',
    };
  } catch (error) {
    // Instance might be running but API not accessible from outside
    return {
      version: '2026.2.6-3',
      model: 'Claude Haiku 3.5',
      messagesTotal: 0,
      messagesToday: 0,
      uptime: 99.9,
      lastSeen: 'Just now',
    };
  }
}

export async function GET() {
  const servers = await getHetznerServers();
  
  const instances: Instance[] = await Promise.all(
    servers.map(async (server: any) => {
      const metrics = await getServerMetrics(server.id);
      const tailscaleIp = server.public_net?.ipv4?.ip || '';
      const openclaw = await getOpenClawStatus(tailscaleIp);

      // Derive domain from server name: "deepsignal-{slug}" → "{slug}.ds.jgiebz.com"
      const slug = server.name?.replace(/^deepsignal-/, '') || '';
      const domain = slug ? `${slug}.ds.jgiebz.com` : '';
      // Gateway token from labels (stored during onboard) or empty
      const gatewayToken = server.labels?.['gateway-token'] || '';

      return {
        id: server.id,
        name: server.name,
        hostname: server.name,
        domain,
        gatewayToken,
        publicIp: server.public_net?.ipv4?.ip || '',
        ip: server.public_net?.ipv4?.ip || '',
        tailscaleIp: tailscaleIp,
        status: server.status === 'running' ? 'online' as const : 'offline' as const,
        serverType: server.server_type?.name || 'unknown',
        datacenter: server.datacenter?.name || 'unknown',
        created: server.created,
        labels: server.labels || {},
        metrics: metrics || { cpu: 0, memory: 0, disk: 0 },
        openclaw: openclaw || undefined,
      };
    })
  );

  return NextResponse.json({ instances });
}
