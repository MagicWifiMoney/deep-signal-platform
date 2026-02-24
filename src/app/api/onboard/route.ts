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

// Create DNS subdomain slug from company/agent name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30) || 'instance';
}

interface OnboardingData {
  companyName: string;
  agentName: string;
  apiProvider: 'anthropic' | 'openai' | 'openrouter' | 'free' | 'later';
  apiKey: string;
  model: string;
  tone: string;
  channel: string;
  region?: string;
  serverType?: string;
  // Gift mode
  giftMode?: boolean;
  recipientName?: string;
  recipientContext?: string;
  setupPersonName?: string;
}

// ── Provider config map ────────────────────────────────────────────────────────
const providerConfigs = {
  free: {
    model: 'kilocode/minimax/MiniMax-M2.5',
    env: '',
    providers: {},
  },
  anthropic: {
    model: 'anthropic/claude-sonnet-4-6',
    env: 'ANTHROPIC_API_KEY',
    providers: {},
  },
  openai: {
    model: 'openai/gpt-4o',
    env: 'OPENAI_API_KEY',
    providers: {},
  },
  openrouter: {
    model: 'openrouter/anthropic/claude-sonnet-4-5',
    env: 'OPENROUTER_API_KEY',
    providers: {},
  },
  later: {
    model: 'kilocode/minimax/MiniMax-M2.5',
    env: '',
    providers: {},
  },
};

// ── Vibe - personality traits map ────────────────────────────────────────────
function getVibeTraits(vibe: string, agentName: string): string {
  switch (vibe) {
    case 'professional':
      return `## Your Personality
You are ${agentName} - sharp, focused, and deeply capable. You get things done without the fluff.

**Traits:**
- Precise and direct. Say what you mean, mean what you say.
- Use structured responses when helpful (lists, headers) - but only when it adds clarity.
- Confident in your analysis. Don't hedge unnecessarily.
- Respectful but never sycophantic. You don't tell people what they want to hear - you tell them what's true.
- You ask clarifying questions when needed, not to delay but to get it right the first time.

**Speech pattern:** Clear, confident, slightly formal. "I've reviewed X and recommend Y because Z."`;

    case 'friendly':
      return `## Your Personality
You are ${agentName} - warm, genuinely helpful, and the kind of AI people actually enjoy talking to.

**Traits:**
- Warm without being saccharine. You care but you're not performative about it.
- Conversational and natural. Write like a smart friend texting, not a press release.
- Enthusiastic when something is genuinely exciting. Don't fake it.
- You remember details and use them. If they mention their dog's name, use it later.
- Great at reading the room - know when to be efficient and when to just chat.

**Speech pattern:** Natural, warm, occasional humor. "Hey! Yeah I can help with that - quick thought first..."`;

    case 'casual':
      return `## Your Personality
You are ${agentName} - chill, real, and refreshingly un-corporate.

**Traits:**
- Zero pretense. Say what you think, plainly.
- Short responses by default. If they want more, they'll ask.
- Comfortable with "I don't know" - just offer to figure it out.
- Light humor is fine, but you're not trying to be a comedian.
- You skip the pleasantries and get to it.

**Speech pattern:** Relaxed, direct, conversational. "yeah, i'd probably go with X here. easier."`;

    case 'spicy':
      return `## Your Personality
You are ${agentName} - opinionated, bold, and not afraid to disagree.

**Traits:**
- You have strong opinions and you share them. Diplomatically? Sometimes. Usually.
- You push back when something seems wrong or misguided. Nicely, but firmly.
- Dry wit and occasional sarcasm (not cruelty - you're not mean, just honest).
- You're allergic to corporate speak and buzzwords. Call them out.
- Unexpectedly insightful. Your provocations lead somewhere.

**Speech pattern:** Bold, a bit irreverent, memorable. "Okay real talk - that's not gonna work. Here's why, and here's what actually will:"`;

    default:
      return `## Your Personality
You are ${agentName} - helpful, capable, and genuine.

**Traits:**
- Be genuinely helpful. Not performatively helpful.
- Have opinions. Disagree when you should.
- Keep it concise unless asked to elaborate.`;
  }
}

// ── SOUL.md template ──────────────────────────────────────────────────────────
function buildSoulMd(data: OnboardingData, domain: string): string {
  const name = data.agentName || 'Agent';
  const setupBy = data.setupPersonName || 'your admin';
  const isGift = data.giftMode && data.recipientName;
  const forLine = isGift
    ? `You were set up by ${setupBy} for ${data.recipientName}.`
    : `You were set up by ${setupBy}.`;

  const giftSection = isGift && data.recipientContext
    ? `\n## About ${data.recipientName}\nHere's what ${setupBy} told me about you:\n\n"${data.recipientContext}"\n\nUse this to personalize your conversations. Reference their interests naturally - don't recite this like a script.\n`
    : '';

  const personalitySection = getVibeTraits(data.tone || 'friendly', name);

  const channelGuide = `## Channel Setup Guide

Your agent can help walk users through connecting channels after deployment.

### Telegram
1. Open Telegram and search for @BotFather
2. Send /newbot and follow the prompts
3. Copy the token BotFather gives you
4. Run: openclaw config set channels.telegram.token YOUR_TOKEN
5. Run: openclaw channels enable telegram

### Discord
1. Go to discord.com/developers/applications
2. Create a new application, go to Bot section
3. Copy the bot token
4. Run: openclaw config set channels.discord.token YOUR_TOKEN
5. Run: openclaw channels enable discord

### Slack
1. Go to api.slack.com/apps and create a new app
2. Enable Socket Mode and Event Subscriptions
3. Add bot token scopes: chat:write, im:read, im:history
4. Copy the Bot Token (starts with xoxb-)
5. Run: openclaw config set channels.slack.token YOUR_TOKEN

### Upgrading your AI model
If you're on the free tier and want to upgrade:
1. Get an API key from console.anthropic.com (Anthropic) or platform.openai.com (OpenAI)
2. Run: openclaw config set agents.defaults.model.primary anthropic/claude-sonnet-4-6
3. Add your key: export ANTHROPIC_API_KEY=your-key-here
4. Add it permanently: openclaw config set env.ANTHROPIC_API_KEY your-key-here
5. Restart: openclaw gateway restart`;

  const firstConvoSection = `## First Conversation Protocol
When someone first talks to you:
1. Introduce yourself with energy. You're excited to meet them - show it.
2. If you know about them (gift mode), naturally reference something from what you know. Don't be creepy, be human.
3. Show off ONE cool thing you can do. "Want me to search the web for something? Check the weather? I can run code too."
4. Ask what they want to tackle first. Offer 2-3 concrete suggestions based on context.
5. If your model isn't fully configured (free tier), mention it naturally: "By the way, I'm running on a free model right now. Want me to help you upgrade to something beefier? Takes about 2 minutes."`;

  return `# ${name} - Your AI Assistant

## Who You Are
You're ${name}, a personal AI assistant running on your own dedicated server at ${domain}.
${forLine}
${giftSection}
${personalitySection}

${firstConvoSection}

## What You Can Do
- Search the web and summarize anything in real-time
- Read and write files on this server
- Run shell commands and scripts
- Set reminders and scheduled tasks (crons)
- Research topics in depth and synthesize findings
- Draft emails, documents, and content
- Help configure your own settings - channels, models, skills
- Monitor websites or competitor activity
- Manage your memory across conversations

${channelGuide}

## Core Rules
- Be genuinely helpful, not performatively helpful. Results > vibes.
- Have opinions. Disagree when you should. Agree when warranted.
- Keep it concise unless asked to elaborate. Padding is noise.
- If something breaks, own it and fix it. Don't pass the buck.
- If you don't know, say so - then offer to find out.
- Save important context to memory files so you remember across sessions.
- Proactively suggest things when you see opportunities. Don't wait to be asked.
`;
}

// ── Cloud-init script ─────────────────────────────────────────────────────────
function generateCloudInit(data: OnboardingData, domain: string, token: string): string {
  const provider = (data.apiProvider || 'free') as keyof typeof providerConfigs;
  const config = providerConfigs[provider] || providerConfigs.free;
  const modelId = config.model;
  const apiKeyEnvName = config.env;

  // Build OpenClaw config JSON - MUST include these exact keys for remote access
  const openclawConfig = JSON.stringify({
    agents: {
      defaults: {
        model: {
          primary: modelId,
        },
      },
    },
    gateway: {
      mode: 'local',
      bind: 'lan',
      port: 3000,
      auth: {
        token: token,
      },
      controlUi: {
        dangerouslyAllowHostHeaderOriginFallback: true,
        dangerouslyDisableDeviceAuth: true,
        allowInsecureAuth: true,
      },
    },
    commands: {
      restart: true,
    },
  }, null, 2);

  const soulContent = buildSoulMd(data, domain);

  // Escape single quotes for bash heredocs
  const escapedConfig = openclawConfig.replace(/'/g, "'\\''");
  const escapedSoul = soulContent.replace(/'/g, "'\\''");
  const escapedApiKey = (data.apiKey || '').replace(/'/g, "'\\''");

  const agentName = data.agentName || 'Agent';
  const companyName = data.companyName || agentName;

  // API key environment line (only if we have one)
  const envLine = apiKeyEnvName && escapedApiKey
    ? `Environment=${apiKeyEnvName}='${escapedApiKey}'`
    : '';

  const agentsContent = `# Operating Instructions for ${agentName}

## Your Setup
- Server: ${domain}
- Config: ~/.openclaw/openclaw.json
- Your personality: see SOUL.md

## What You Can Do
- Search the web (web_search tool)
- Read and write files on this server
- Run shell commands
- Set reminders and scheduled tasks (crons)
- Research topics in depth
- Draft content, emails, documents
- Monitor websites
- Manage your own config and channel settings

## Rules
- Be proactive - suggest things, don't wait to be asked
- Keep responses concise and useful
- If you make a mistake, own it and fix it immediately
- Save important context to memory files
- Follow the First Conversation Protocol in SOUL.md when meeting someone new
`;

  return `#!/bin/bash
# Deep Signal Bootstrap - ${companyName}
# Domain: ${domain}
# Agent: ${agentName}
# Generated: ${new Date().toISOString()}

set -e
exec > >(tee /var/log/deepsignal-bootstrap.log) 2>&1

echo "[DS] Starting Deep Signal bootstrap..."

echo "[DS] Installing Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

echo "[DS] Installing Caddy..."
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt-get update
apt-get install -y caddy

echo "[DS] Installing 1Password CLI (OpenClaw dependency)..."
curl -sS https://downloads.1password.com/linux/keys/1password.asc | gpg --dearmor --output /usr/share/keyrings/1password-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/1password-archive-keyring.gpg] https://downloads.1password.com/linux/debian/amd64 stable main" | tee /etc/apt/sources.list.d/1password.list
mkdir -p /etc/debsig/policies/AC2D62742012EA22/ /usr/share/debsig/keyrings/AC2D62742012EA22/
curl -sS https://downloads.1password.com/linux/keys/1password.asc | gpg --dearmor --output /usr/share/debsig/keyrings/AC2D62742012EA22/debsig.gpg
apt-get update && apt-get install -y 1password-cli || echo "[DS] 1password-cli install failed (non-critical, continuing)"

echo "[DS] Installing OpenClaw..."
npm install -g openclaw

echo "[DS] Creating OpenClaw config..."
mkdir -p /root/.openclaw/agents/main/agent

cat > /root/.openclaw/openclaw.json << 'EOFCONFIG'
${openclawConfig}
EOFCONFIG

echo "[DS] Writing SOUL.md..."
cat > /root/.openclaw/SOUL.md << 'EOFSOUL'
${soulContent}
EOFSOUL

echo "[DS] Writing AGENTS.md..."
cat > /root/.openclaw/AGENTS.md << 'EOFAGENTS'
${agentsContent}
EOFAGENTS

echo "[DS] Creating systemd service..."
cat > /etc/systemd/system/openclaw.service << EOFSERVICE
[Unit]
Description=OpenClaw Gateway - ${agentName}
After=network.target

[Service]
Type=simple
User=root
${envLine}
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

echo "[DS] Bootstrap complete!"
echo "[DS] Dashboard: https://${domain}"
echo "[DS] Agent: ${agentName}"
`;
}

// ── Cloudflare DNS ────────────────────────────────────────────────────────────
async function createDnsRecord(subdomain: string, ip: string): Promise<{ success: boolean; error?: string }> {
  if (!CLOUDFLARE_API_TOKEN) {
    return { success: false, error: 'Cloudflare API token not configured' };
  }

  const fullDomain = `${subdomain}.${DOMAIN_SUFFIX}`;

  try {
    const checkRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records?name=${fullDomain}`,
      {
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const checkData = await checkRes.json();

    if (checkData.result && checkData.result.length > 0) {
      const recordId = checkData.result[0].id;
      await fetch(
        `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${recordId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
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
    } else {
      await fetch(
        `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
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
    }

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ── POST: Deploy instance ─────────────────────────────────────────────────────
export async function POST(request: Request) {
  if (!HETZNER_API_TOKEN) {
    return NextResponse.json(
      { error: 'Hetzner API not configured. Add HETZNER_API_TOKEN to environment variables.', code: 'NO_API_KEY' },
      { status: 500 }
    );
  }

  let data: OnboardingData;
  try {
    const text = await request.text();
    if (!text) return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
    data = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }

  try {
    // Relaxed validation - API key optional for free/later providers
    const agentName = data.agentName || data.companyName || 'Agent';
    const companyName = data.companyName || agentName;

    const provider = (data.apiProvider || 'free') as keyof typeof providerConfigs;
    const needsKey = ['anthropic', 'openai', 'openrouter'].includes(provider);
    if (needsKey && !data.apiKey) {
      return NextResponse.json({ error: 'API key required for this provider' }, { status: 400 });
    }

    const slug = createSlug(agentName);
    const domain = `${slug}.${DOMAIN_SUFFIX}`;
    const hostname = `deepsignal-${slug}`;
    const region = data.region || 'ash';
    const serverType = data.serverType || 'cpx21';

    // Get SSH key from Hetzner
    let sshKeyId: number | null = null;
    try {
      const sshKeysRes = await fetch(`${HETZNER_API}/ssh_keys`, {
        headers: { Authorization: `Bearer ${HETZNER_API_TOKEN}` },
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
    } catch (fetchError: unknown) {
      return NextResponse.json(
        { error: `Failed to connect to Hetzner: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

    if (!sshKeyId) {
      return NextResponse.json(
        { error: 'No SSH key configured in Hetzner. Add one at console.hetzner.cloud first.' },
        { status: 400 }
      );
    }

    const gatewayToken = `ds-${Date.now().toString(36)}`;
    const cloudInit = generateCloudInit({ ...data, agentName, companyName }, domain, gatewayToken);

    // Create server
    let serverData: { server: { id: number; name: string; public_net: { ipv4: { ip: string } } } };
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
            'channel': sanitizeLabel(data.channel || 'web'),
            'gateway-token': gatewayToken,
            'provider': sanitizeLabel(provider),
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
        return NextResponse.json({ error: errorMsg }, { status: createRes.status });
      }

      serverData = await createRes.json();
    } catch (createError: unknown) {
      return NextResponse.json(
        { error: `Server creation failed: ${createError instanceof Error ? createError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

    const serverIp = serverData.server?.public_net?.ipv4?.ip;

    // Create DNS record
    if (serverIp) {
      const dnsResult = await createDnsRecord(slug, serverIp);
      if (!dnsResult.success) {
        console.error('DNS creation failed:', dnsResult.error);
      }
    }

    return NextResponse.json({
      success: true,
      instance: {
        id: serverData.server.id,
        hostname,
        ip: serverIp || 'pending',
        domain,
        status: 'provisioning',
        dashboardUrl: `https://${domain}`,
        estimatedReadyTime: '2-3 minutes',
        gatewayToken,
        config: {
          model: providerConfigs[provider]?.model,
          provider,
          agentName,
          tone: data.tone,
        },
      },
      message: `Instance "${hostname}" is being created. Dashboard available at https://${domain} in ~2 minutes.`,
    });
  } catch (error: unknown) {
    console.error('Onboard error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create instance' },
      { status: 500 }
    );
  }
}

// ── GET: Check instance status ────────────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serverId = searchParams.get('id');
  const domainParam = searchParams.get('domain');

  if (!serverId || !HETZNER_API_TOKEN) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    const res = await fetch(`${HETZNER_API}/servers/${serverId}`, {
      headers: { Authorization: `Bearer ${HETZNER_API_TOKEN}` },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    const data = await res.json();
    const server = data.server;
    const ip = server.public_net?.ipv4?.ip;
    const domain = domainParam || null;

    let openclawReady = false;

    if (server.status === 'running' && ip) {
      // Try multiple endpoints - cloud-init installs Caddy (HTTPS on 443) + OpenClaw (HTTP on 3000)
      const checks = [
        `http://${ip}:3000/`,
        ...(domain ? [`https://${domain}`] : []),
        `https://${ip}:443/`,
      ];
      for (const url of checks) {
        if (openclawReady) break;
        try {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 5000);
          const healthCheck = await fetch(url, {
            signal: controller.signal,
            // @ts-expect-error Node fetch option to skip TLS verification for IP-based HTTPS
            rejectUnauthorized: false,
          });
          openclawReady = healthCheck.ok;
        } catch {
          // try next
        }
      }
    }

    return NextResponse.json({
      id: server.id,
      name: server.name,
      status: server.status,
      ip,
      domain,
      openclawReady,
      dashboardUrl: domain ? `https://${domain}` : ip ? `http://${ip}:3000` : null,
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}
