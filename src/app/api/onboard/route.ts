import { NextResponse } from 'next/server';

const HETZNER_API_TOKEN = process.env.HETZNER_API_TOKEN;
const HETZNER_API = 'https://api.hetzner.cloud/v1';

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID || '1af99eb0c0c30a67f2f272d4dff24cc8';
const DOMAIN_SUFFIX = 'ds.jgiebz.com';

// Sanitize string for Hetzner labels and DNS (lowercase alphanumeric + hyphens, max 63 chars)
function sanitizeLabel(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 63) || 'unknown';
}

// Create DNS subdomain slug from company name
function createSlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30) || 'instance';
}

interface OnboardingData {
  companyName: string;
  industry: string;
  useCase: string;
  apiProvider: 'anthropic' | 'openrouter';
  apiKey: string;
  model: string;
  channel: string;
  agentName: string;
  tone: string;
  region?: string;
  serverType?: string;
}

// Cloud-init script that sets up everything with Caddy for HTTPS
function generateCloudInit(data: OnboardingData, domain: string, token: string): string {
  const modelMap: Record<string, string> = {
    haiku: 'anthropic/claude-haiku-3-5',
    sonnet: 'anthropic/claude-sonnet-4',
    opus: 'anthropic/claude-opus-4',
  };
  const modelId = modelMap[data.model] || 'anthropic/claude-haiku-3-5';
  
  const apiKeyEnvName = data.apiProvider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENROUTER_API_KEY';
  
  const toneDescription = 
    data.tone === 'professional' ? 'Maintain a professional, courteous demeanor. Be helpful and efficient.' :
    data.tone === 'friendly' ? 'Be warm, approachable, and conversational. Use a friendly tone.' :
    data.tone === 'casual' ? 'Keep it relaxed and casual. Be personable and easy-going.' :
    'Maintain formal business communication standards.';

  // Build config JSON
  const openclawConfig = JSON.stringify({
    agents: {
      defaults: {
        model: {
          primary: modelId
        }
      }
    },
    gateway: {
      mode: 'local',
      bind: 'lan',
      port: 3000,
      auth: {
        token: token
      },
      deviceAuth: 'open'
    },
    commands: {
      restart: true
    }
  }, null, 2);

  // Build SOUL.md content
  const soulContent = `# ${data.agentName} - AI Assistant for ${data.companyName}

## Identity
- Name: ${data.agentName}
- Company: ${data.companyName}
- Industry: ${data.industry || 'General'}
- Tone: ${data.tone}

## Purpose
${data.useCase || 'Assist customers with inquiries and support.'}

## Communication Style
${toneDescription}

## Guidelines
- Always represent ${data.companyName} professionally
- Be helpful and solve problems
- Ask clarifying questions when needed
- Escalate complex issues to human support when appropriate`;

  // Escape single quotes for bash
  const escapedSoul = soulContent.replace(/'/g, "'\\''");
  const escapedApiKey = data.apiKey.replace(/'/g, "'\\''");

  return `#!/bin/bash
# Deep Signal Instance Bootstrap - ${data.companyName}
# Domain: ${domain}
# Generated: ${new Date().toISOString()}

set -e

echo ">>> Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

echo ">>> Installing Caddy..."
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt-get update
apt-get install -y caddy

echo ">>> Installing OpenClaw..."
npm install -g openclaw

echo ">>> Creating OpenClaw config..."
mkdir -p /root/.openclaw/agents/main/agent

# Main config
cat > /root/.openclaw/openclaw.json << 'EOFCONFIG'
${openclawConfig}
EOFCONFIG

# Agent personality
cat > /root/.openclaw/SOUL.md << 'EOFSOUL'
${escapedSoul}
EOFSOUL

echo ">>> Creating OpenClaw systemd service..."
cat > /etc/systemd/system/openclaw.service << EOFSERVICE
[Unit]
Description=OpenClaw Gateway - ${data.companyName}
After=network.target

[Service]
Type=simple
User=root
Environment=${apiKeyEnvName}='${escapedApiKey}'
Environment=OPENCLAW_GATEWAY_TOKEN=${token}
ExecStart=/usr/bin/openclaw gateway --port 3000 --bind lan
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOFSERVICE

echo ">>> Configuring Caddy for HTTPS..."
cat > /etc/caddy/Caddyfile << 'EOFCADDY'
${domain} {
    reverse_proxy localhost:3000
}
EOFCADDY

echo ">>> Starting services..."
systemctl daemon-reload
systemctl enable openclaw
systemctl start openclaw
systemctl restart caddy

echo ">>> Deep Signal bootstrap complete"
echo ">>> Dashboard: https://${domain}"
`;
}

// Create Cloudflare DNS record
async function createDnsRecord(subdomain: string, ip: string): Promise<{ success: boolean; error?: string }> {
  if (!CLOUDFLARE_API_TOKEN) {
    return { success: false, error: 'Cloudflare API token not configured' };
  }

  const fullDomain = `${subdomain}.${DOMAIN_SUFFIX}`;
  
  try {
    // Check if record already exists
    const checkRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records?name=${fullDomain}`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const checkData = await checkRes.json();
    
    if (checkData.result && checkData.result.length > 0) {
      // Update existing record
      const recordId = checkData.result[0].id;
      const updateRes = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${recordId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'A',
            name: fullDomain,
            content: ip,
            ttl: 300,
            proxied: false, // Direct connection for WebSocket support
          }),
        }
      );
      
      if (!updateRes.ok) {
        const error = await updateRes.json();
        return { success: false, error: error.errors?.[0]?.message || 'Failed to update DNS' };
      }
    } else {
      // Create new record
      const createRes = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'A',
            name: fullDomain,
            content: ip,
            ttl: 300,
            proxied: false,
          }),
        }
      );
      
      if (!createRes.ok) {
        const error = await createRes.json();
        return { success: false, error: error.errors?.[0]?.message || 'Failed to create DNS' };
      }
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function POST(request: Request) {
  if (!HETZNER_API_TOKEN) {
    return NextResponse.json(
      { error: 'Hetzner API not configured. Please add HETZNER_API_TOKEN to environment variables.', code: 'NO_API_KEY' },
      { status: 500 }
    );
  }

  let data: OnboardingData;
  try {
    const text = await request.text();
    if (!text) {
      return NextResponse.json(
        { error: 'Empty request body' },
        { status: 400 }
      );
    }
    data = JSON.parse(text);
  } catch (parseError) {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  try {
    // Validate required fields
    if (!data.companyName || !data.apiKey) {
      return NextResponse.json(
        { error: 'Company name and API key are required' },
        { status: 400 }
      );
    }

    const slug = createSlug(data.companyName);
    const domain = `${slug}.${DOMAIN_SUFFIX}`;
    const hostname = `deepsignal-${slug}`;
    const region = data.region || 'ash';
    const serverType = data.serverType || 'cpx21';

    // Get SSH key
    let sshKeyId: number | null = null;
    try {
      const sshKeysRes = await fetch(`${HETZNER_API}/ssh_keys`, {
        headers: { 'Authorization': `Bearer ${HETZNER_API_TOKEN}` },
      });
      
      if (!sshKeysRes.ok) {
        const errorText = await sshKeysRes.text();
        console.error('Hetzner SSH keys error:', sshKeysRes.status, errorText);
        return NextResponse.json(
          { error: `Hetzner API error: ${sshKeysRes.status}. Check API token.` },
          { status: 500 }
        );
      }
      
      const sshKeysData = await sshKeysRes.json();
      sshKeyId = sshKeysData.ssh_keys?.[0]?.id;
    } catch (fetchError: any) {
      console.error('Failed to fetch SSH keys:', fetchError);
      return NextResponse.json(
        { error: `Failed to connect to Hetzner: ${fetchError.message}` },
        { status: 500 }
      );
    }

    if (!sshKeyId) {
      return NextResponse.json(
        { error: 'No SSH key configured in Hetzner. Add an SSH key at console.hetzner.cloud first.' },
        { status: 400 }
      );
    }

    // Generate gateway token and cloud-init script
    const gatewayToken = `ds-${Date.now().toString(36)}`;
    const cloudInit = generateCloudInit(data, domain, gatewayToken);

    // Create the server
    let serverData: any;
    try {
      const createRes = await fetch(`${HETZNER_API}/servers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HETZNER_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: hostname,
          server_type: serverType,
          location: region,
          image: 'ubuntu-24.04',
          ssh_keys: [sshKeyId],
          user_data: cloudInit,
          start_after_create: true,
          labels: {
            'managed-by': 'deep-signal',
            'client': sanitizeLabel(data.companyName),
            'industry': sanitizeLabel(data.industry || 'unknown'),
            'channel': sanitizeLabel(data.channel || 'web'),
          },
        }),
      });

      if (!createRes.ok) {
        const errorText = await createRes.text();
        let errorMsg = 'Failed to create server';
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.error?.message || errorMsg;
        } catch {
          errorMsg = errorText || errorMsg;
        }
        console.error('Hetzner create server error:', createRes.status, errorText);
        return NextResponse.json(
          { error: errorMsg },
          { status: createRes.status }
        );
      }

      serverData = await createRes.json();
    } catch (createError: any) {
      console.error('Failed to create server:', createError);
      return NextResponse.json(
        { error: `Server creation failed: ${createError.message}` },
        { status: 500 }
      );
    }

    const serverIp = serverData.server?.public_net?.ipv4?.ip;

    // Create DNS record
    let dnsResult: { success: boolean; error?: string } = { success: false, error: 'No IP assigned yet' };
    if (serverIp) {
      dnsResult = await createDnsRecord(slug, serverIp);
      if (!dnsResult.success) {
        console.error('DNS creation failed:', dnsResult.error);
        // Don't fail deployment, just note it
      }
    }

    return NextResponse.json({
      success: true,
      instance: {
        id: serverData.server.id,
        hostname,
        ip: serverIp || 'pending',
        domain: domain,
        status: 'provisioning',
        dashboardUrl: `https://${domain}`,
        fallbackUrl: serverIp ? `http://${serverIp}:3000` : null,
        estimatedReadyTime: '2-3 minutes',
        dnsConfigured: dnsResult.success,
        gatewayToken: gatewayToken,
        config: {
          model: data.model,
          channel: data.channel,
          agentName: data.agentName,
          tone: data.tone,
        }
      },
      message: `Instance "${hostname}" is being created. Dashboard will be available at https://${domain} in ~2 minutes.`,
    });
  } catch (error: any) {
    console.error('Onboard error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create instance' },
      { status: 500 }
    );
  }
}

// Check instance status
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serverId = searchParams.get('id');

  if (!serverId || !HETZNER_API_TOKEN) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    const res = await fetch(`${HETZNER_API}/servers/${serverId}`, {
      headers: { 'Authorization': `Bearer ${HETZNER_API_TOKEN}` },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    const data = await res.json();
    const server = data.server;

    // Try to check if OpenClaw is responding (check the HTTPS URL)
    let openclawReady = false;
    const clientLabel = server.labels?.client;
    const domain = clientLabel ? `${clientLabel}.${DOMAIN_SUFFIX}` : null;
    
    if (server.status === 'running' && domain) {
      try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 5000);
        const healthCheck = await fetch(`https://${domain}`, {
          signal: controller.signal,
        });
        openclawReady = healthCheck.ok;
      } catch {
        openclawReady = false;
      }
    }

    return NextResponse.json({
      id: server.id,
      name: server.name,
      status: server.status,
      ip: server.public_net?.ipv4?.ip,
      domain: domain,
      openclawReady,
      dashboardUrl: openclawReady ? `https://${domain}` : null,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}
