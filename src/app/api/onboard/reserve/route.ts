/**
 * POST /api/onboard/reserve
 *
 * Creates a Hetzner server in the background immediately after the user
 * enters their agent name (step 1). The server boots with free-tier
 * defaults while the user completes the rest of the wizard. By the time
 * they hit Deploy, the 2-minute boot is already done or nearly done.
 *
 * The /api/onboard/configure endpoint is called at deploy time to apply
 * final settings (model, API key, skills, vibe).
 */
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const HETZNER_API_TOKEN = process.env.HETZNER_API_TOKEN;
const HETZNER_API = 'https://api.hetzner.cloud/v1';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID || '1af99eb0c0c30a67f2f272d4dff24cc8';
const DOMAIN_SUFFIX = 'ds.jgiebz.com';

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30) || 'instance';
}

function sanitizeLabel(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 63) || 'unknown';
}

async function createDnsRecord(subdomain: string, ip: string): Promise<void> {
  if (!CLOUDFLARE_API_TOKEN) return;
  const fullDomain = `${subdomain}.${DOMAIN_SUFFIX}`;
  try {
    const checkRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records?name=${fullDomain}`,
      { headers: { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' } }
    );
    const checkData = await checkRes.json();
    const method = checkData.result?.length > 0 ? 'PUT' : 'POST';
    const url = checkData.result?.length > 0
      ? `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${checkData.result[0].id}`
      : `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records`;
    await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'A', name: fullDomain, content: ip, ttl: 300, proxied: false }),
    });
  } catch (e) {
    console.error('DNS error:', e);
  }
}

function buildDefaultCloudInit(agentName: string, domain: string, token: string): string {
  const anthropicKey = process.env.ANTHROPIC_API_KEY || '';
  const openclawConfig = JSON.stringify({
    agents: { defaults: { model: { primary: 'anthropic/claude-sonnet-4-6' } } },
    gateway: {
      mode: 'local',
      bind: 'lan',
      port: 3000,
      auth: { token },
      controlUi: {
        dangerouslyAllowHostHeaderOriginFallback: true,
        dangerouslyDisableDeviceAuth: true,
        allowInsecureAuth: true,
      },
    },
    env: anthropicKey ? { ANTHROPIC_API_KEY: anthropicKey } : {},
    skills: {
      entries: {
        weather: { enabled: true },
        'web-search': { enabled: true },
        research: { enabled: true },
      },
    },
    commands: { restart: true },
  }, null, 2);

  const soulContent = `# ${agentName} - Your AI Assistant

## Who You Are
You're ${agentName}, a personal AI assistant running on your own dedicated server at ${domain}.

## Your Personality
You are ${agentName} - warm, genuinely helpful, and the kind of AI people actually enjoy talking to.

## First Conversation Protocol
When someone first talks to you:
1. Introduce yourself with energy. You're excited to meet them.
2. Show off ONE cool thing you can do right away.
3. Ask what they want to tackle first.
4. If you're on the free tier, offer to help upgrade the AI model.

## What You Can Do
- Search the web and summarize anything in real-time
- Research topics in depth
- Draft content, emails, documents
- Help configure your own settings and channels
- Install new skills from ClawHub

## Core Rules
- Be genuinely helpful, not performatively helpful.
- Keep it concise unless asked to elaborate.
- Save important context to memory files.
`;

  return `#!/bin/bash
# Deep Signal Bootstrap (reserve) - ${agentName}
# Domain: ${domain}
# Generated: ${new Date().toISOString()}

set -e
exec > >(tee /var/log/deepsignal-bootstrap.log) 2>&1

echo "[DS] Starting Deep Signal bootstrap (reserve mode)..."

echo "[DS] Installing Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

echo "[DS] Installing Caddy..."
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt-get update
apt-get install -y caddy

echo "[DS] Installing OpenClaw..."
npm install -g openclaw

echo "[DS] Creating OpenClaw config..."
mkdir -p /root/.openclaw/agents/main/agent

cat > /root/.openclaw/openclaw.json << 'EOFCONFIG'
${openclawConfig}
EOFCONFIG

cat > /root/.openclaw/SOUL.md << 'EOFSOUL'
${soulContent}
EOFSOUL

echo "[DS] Creating systemd service..."
cat > /etc/systemd/system/openclaw.service << EOFSERVICE
[Unit]
Description=OpenClaw Gateway - ${agentName}
After=network.target

[Service]
Type=simple
User=root
Environment=OPENCLAW_GATEWAY_TOKEN=${token}
ExecStart=/usr/bin/openclaw gateway --port 3000 --bind lan
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOFSERVICE

echo "[DS] Configuring Caddy..."
cat > /etc/caddy/Caddyfile << 'EOFCADDY'
${domain} {
    reverse_proxy localhost:3000
}
EOFCADDY

echo "[DS] Starting services..."
systemctl daemon-reload
systemctl enable openclaw
systemctl start openclaw
systemctl enable caddy
systemctl restart caddy

echo "[DS] Reserve bootstrap complete!"
echo "[DS] Dashboard: https://${domain}"
`;
}

export async function POST(request: Request) {
  if (!HETZNER_API_TOKEN) {
    return NextResponse.json({ error: 'Hetzner API not configured', code: 'NO_API_KEY' }, { status: 500 });
  }

  let body: { agentName: string; region?: string; serverType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const agentName = (body.agentName || 'Agent').trim();
  if (!agentName) {
    return NextResponse.json({ error: 'agentName is required' }, { status: 400 });
  }

  const slug = createSlug(agentName);
  const domain = `${slug}.${DOMAIN_SUFFIX}`;
  const hostname = `deepsignal-${slug}`;
  const region = body.region || 'ash';
  const serverType = body.serverType || 'cpx21';

  // Get SSH key
  let sshKeyId: number | null = null;
  try {
    const sshRes = await fetch(`${HETZNER_API}/ssh_keys`, {
      headers: { Authorization: `Bearer ${HETZNER_API_TOKEN}` },
    });
    if (!sshRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch SSH keys from Hetzner' }, { status: 500 });
    }
    const sshData = await sshRes.json();
    sshKeyId = sshData.ssh_keys?.[0]?.id ?? null;
  } catch (e) {
    return NextResponse.json({ error: 'Hetzner connection failed' }, { status: 500 });
  }

  if (!sshKeyId) {
    return NextResponse.json({ error: 'No SSH key in Hetzner. Add one first.' }, { status: 400 });
  }

  // Generate cryptographically secure token
  const gatewayToken = crypto.randomBytes(24).toString('hex');
  const cloudInit = buildDefaultCloudInit(agentName, domain, gatewayToken);

  let serverData: { server: { id: number; public_net: { ipv4: { ip: string } } } };
  try {
    const createRes = await fetch(`${HETZNER_API}/servers`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HETZNER_API_TOKEN}`,
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
          'agent': sanitizeLabel(agentName),
          'mode': 'reserved',
        },
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      let msg = 'Failed to create server';
      try { msg = JSON.parse(errText).error?.message || msg; } catch {}
      return NextResponse.json({ error: msg }, { status: createRes.status });
    }

    serverData = await createRes.json();
  } catch (e: unknown) {
    return NextResponse.json(
      { error: `Server creation failed: ${e instanceof Error ? e.message : 'Unknown'}` },
      { status: 500 }
    );
  }

  const ip = serverData.server?.public_net?.ipv4?.ip;

  // Create DNS record in background (don't block)
  if (ip) {
    createDnsRecord(slug, ip).catch(() => {});
  }

  return NextResponse.json({
    success: true,
    server: {
      id: serverData.server.id,
      hostname,
      ip: ip || 'pending',
      domain,
      gatewayToken,
      status: 'provisioning',
      dashboardUrl: `https://${domain}`,
    },
  });
}
