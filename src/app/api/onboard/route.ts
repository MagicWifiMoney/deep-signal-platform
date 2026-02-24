import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { CONFIGS } from '@/lib/configs';

const HETZNER_API_TOKEN = process.env.HETZNER_API_TOKEN;
const HETZNER_API = 'https://api.hetzner.cloud/v1';

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID || '1af99eb0c0c30a67f2f272d4dff24cc8';
const DOMAIN_SUFFIX = 'ds.jgiebz.com';

// ── Rate Limiting ─────────────────────────────────────────────────────────────
// Simple in-memory rate limiter: max 3 deploys per IP per hour
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxRequests = 3;

  const timestamps = (rateLimitMap.get(ip) || []).filter(
    (t) => now - t < windowMs
  );

  if (timestamps.length >= maxRequests) {
    return false; // rate limited
  }

  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return true;
}

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
  skills?: string[];
  configId?: string;
}

// ── Provider config map ────────────────────────────────────────────────────────
const providerConfigs = {
  free: {
    model: 'anthropic/claude-sonnet-4-6',
    env: 'ANTHROPIC_API_KEY',
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
    model: 'anthropic/claude-sonnet-4-6',
    env: 'ANTHROPIC_API_KEY',
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

### WhatsApp
1. Your agent will generate a QR code on first request
2. Open WhatsApp on your phone
3. Go to Settings - Linked Devices - Link a Device
4. Scan the QR code shown by your agent
5. Run: openclaw channels enable whatsapp

### Upgrading your AI model
If you're on the free tier and want to upgrade:
1. Get an API key from console.anthropic.com (Anthropic) or platform.openai.com (OpenAI)
2. Run: openclaw config set agents.defaults.model.primary anthropic/claude-sonnet-4-6
3. Add your key: export ANTHROPIC_API_KEY=your-key-here
4. Add it permanently: openclaw config set env.ANTHROPIC_API_KEY your-key-here
5. Restart: openclaw gateway restart`;

  const firstConvoSection = `## First Conversation Protocol
When someone first talks to you:
1. Greet them with genuine energy - you're excited to exist!
2. Immediately DO something useful without being asked. Pick one:
   - Check the weather for their area and mention it casually
   - Search for something relevant to their project/company name and share a quick insight
   - Create your first memory file with impressions and goals
3. Offer 3 Quick Actions as concrete next steps. Present them like clickable suggestions inline:

   **Quick Actions - try one of these:**
   - 📰 **Set up a daily news briefing** - tell me what topics you care about and I'll schedule a morning digest for you
   - 🔍 **Research something for me** - give me any topic and I'll do a deep multi-source web search right now
   - ⏰ **Set a reminder** - tell me what to remind you about and when, and I'll schedule it (great way to see what I can do)

4. If on free tier, mention the upgrade path naturally (not pushy)

The goal: within 60 seconds of first contact, they should think 'holy shit, this thing is SMART.'
Don't just say hi and wait. ACT. Show them what you can do by doing it.

### Quick Actions Detail
When a user picks one of the Quick Actions:

**📰 Daily News Briefing:**
Ask: "What topics interest you? (e.g. AI, crypto, local news, sports, your industry)" and "What time do you want it? (e.g. 8am)" - then create a cron that runs a web search digest on those topics each morning and delivers it via their connected channel.

**🔍 Research:**
Ask what topic they want researched. Then immediately fire off 3-5 web searches, synthesize findings, and return a clear 200-400 word summary with key takeaways. Show them the research is real and current.

**⏰ Set a Reminder:**
Ask what they want reminded about and when. Create a one-time cron for that time. When it fires, send them the reminder message. Confirm the cron was created with the scheduled time.`;

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
export function generateCloudInit(data: OnboardingData, domain: string, token: string): string {
  const provider = (data.apiProvider || 'free') as keyof typeof providerConfigs;
  const config = providerConfigs[provider] || providerConfigs.free;
  const modelId = config.model;
  const apiKeyEnvName = config.env;

  // Map frontend skill IDs to OpenClaw skill config entries
  const skillMap: Record<string, { enabled: true }> = {};
  const selectedSkills = data.skills || [];
  // Map frontend IDs to OpenClaw bundled skill names
  const skillIdToName: Record<string, string> = {
    'weather': 'weather',
    'web-search': 'web-search',
    'notion': 'notion',
    'google-workspace': 'gog',
    'apple-notes': 'apple-notes',
    'apple-reminders': 'apple-reminders',
    'github': 'github',
    'coding-agent': 'coding-agent',
    'healthcheck': 'healthcheck',
    'image-gen': 'nano-banana-pro',
    'video-gen': 'veo',
    'tts': 'sag',
    'twitter': 'bird',
    'typefully': 'typefully',
    'reddit': 'reddit-search',
    'seo': 'seo-dataforseo',
    'google-trends': 'google-trends',
    'deep-research': 'research',
    'perplexity': 'perplexity',
    'arxiv': 'arxiv',
    'youtube-transcript': 'youtube-transcript',
    'wallet': 'send-usdc',
    'polymarket': 'polymarket',
    'x402': 'x402',
  };
  for (const id of selectedSkills) {
    const name = skillIdToName[id] || id;
    skillMap[name] = { enabled: true };
  }

  // Determine the effective API key for config injection
  const effectiveApiKeyForConfig = data.apiKey || (provider === 'free' || provider === 'later' ? process.env.ANTHROPIC_API_KEY || '' : '');

  // Build env object for openclaw.json
  const envConfig: Record<string, string> = {};
  if (apiKeyEnvName && effectiveApiKeyForConfig) {
    envConfig[apiKeyEnvName] = effectiveApiKeyForConfig;
  }

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
      trustedProxies: ['127.0.0.1', '::1'],
    },
    env: envConfig,
    skills: {
      entries: skillMap,
    },
    commands: {
      restart: true,
    },
  }, null, 2);

  const soulContent = buildSoulMd(data, domain);

  // Inject config template if provided
  const selectedConfig = data.configId ? CONFIGS.find(c => c.id === data.configId) : null;

  // Escape single quotes for bash heredocs
  const escapedConfig = openclawConfig.replace(/'/g, "'\\''");
  const finalSoulContent = selectedConfig
    ? soulContent + selectedConfig.soulAddendum
    : soulContent;
  const escapedSoul = finalSoulContent.replace(/'/g, "'\\''");

  const agentName = data.agentName || 'Agent';
  const companyName = data.companyName || agentName;

  // API key: use user-provided key, or server-side Gemini key for free tier
  const effectiveApiKey = data.apiKey || (provider === 'free' || provider === 'later' ? process.env.ANTHROPIC_API_KEY || '' : '');

  // API key environment line (only if we have one)
  // NOTE: kept only in systemd service file - NOT written to the log
  const envLine = apiKeyEnvName && effectiveApiKey
    ? `Environment=${apiKeyEnvName}=__DS_API_KEY__`
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
- Install new skills by running: \`openclaw config set skills.entries.<skill-name> '{"enabled":true}' --json\` then restart with \`openclaw gateway restart\`
- Browse available skills at https://clawhub.com
- Common skills: weather, web-search, github, google-workspace (gog), nano-banana-pro (image gen), perplexity (research)
- To list what's already installed: \`openclaw config get skills\`
${selectedSkills.length > 0 ? `\n## Pre-installed Skills\n${selectedSkills.map(id => `- ${skillIdToName[id] || id}`).join('\\n')}\n` : ''}
## Rules
- Be proactive - suggest things, don't wait to be asked
- Keep responses concise and useful
- If you make a mistake, own it and fix it immediately
- Save important context to memory files
- Follow the First Conversation Protocol in SOUL.md when meeting someone new
`;

  const finalAgentsContent = selectedConfig
    ? agentsContent + '\n\n' + selectedConfig.agentInstructions
    : agentsContent;
  const escapedAgents = finalAgentsContent.replace(/'/g, "'\\''");

  // Build the API key injection line for systemd
  // Security: we redirect output to /dev/null for this section so the key
  // never appears in /var/log/deepsignal-bootstrap.log
  const apiKeyInjection = apiKeyEnvName && effectiveApiKey
    ? `
# ── Inject API key into systemd service (output suppressed for security) ──────
# Redirect output to /dev/null so the key is NOT written to the bootstrap log.
# The key is only stored in the systemd service file, readable by root only.
{
  set +x
  # Replace placeholder with actual key
  sed -i 's|Environment=${apiKeyEnvName}=__DS_API_KEY__|Environment=${apiKeyEnvName}=${effectiveApiKey.replace(/'/g, "'\\''").replace(/\//g, '\\/')}|g' /etc/systemd/system/openclaw.service
} > /dev/null 2>&1
set -x
systemctl daemon-reload
`
    : '';

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
${escapedSoul}
EOFSOUL

echo "[DS] Writing AGENTS.md..."
cat > /root/.openclaw/AGENTS.md << 'EOFAGENTS'
${escapedAgents}
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
${apiKeyInjection}
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
export async function createDnsRecord(subdomain: string, ip: string): Promise<{ success: boolean; error?: string }> {
  console.log(`[DNS] Creating record: ${subdomain}.${DOMAIN_SUFFIX} → ${ip}`);
  console.log(`[DNS] CF token present: ${!!CLOUDFLARE_API_TOKEN}, length: ${CLOUDFLARE_API_TOKEN?.length}, zone: ${CLOUDFLARE_ZONE_ID}`);
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

// ── Shared: get SSH key from Hetzner ─────────────────────────────────────────
export async function getHetznerSshKeyId(): Promise<{ id: number | null; error?: string }> {
  try {
    const sshKeysRes = await fetch(`${HETZNER_API}/ssh_keys`, {
      headers: { Authorization: `Bearer ${HETZNER_API_TOKEN}` },
    });

    if (!sshKeysRes.ok) {
      const errorText = await sshKeysRes.text();
      console.error('Hetzner SSH keys error:', sshKeysRes.status, errorText);
      return { id: null, error: `Hetzner API error: ${sshKeysRes.status}. Check API token.` };
    }

    const sshKeysData = await sshKeysRes.json();
    const id = sshKeysData.ssh_keys?.[0]?.id ?? null;
    return { id };
  } catch (fetchError: unknown) {
    return {
      id: null,
      error: `Failed to connect to Hetzner: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
    };
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

  // Rate limiting
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many deployments. Maximum 3 per hour per IP address. Please try again later.', code: 'RATE_LIMITED' },
      { status: 429 }
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
    // Validation - require at least an agent name or company name (must be non-empty strings)
    if (!data.agentName?.trim() && !data.companyName?.trim()) {
      return NextResponse.json(
        { error: 'Missing required field: agentName or companyName must be provided' },
        { status: 400 }
      );
    }

    // Validate channel if provided
    const validChannels = ['web', 'telegram', 'discord', 'slack', 'whatsapp'];
    if (data.channel && !validChannels.includes(data.channel)) {
      return NextResponse.json(
        { error: `Invalid channel: ${data.channel}. Must be one of: ${validChannels.join(', ')}` },
        { status: 400 }
      );
    }

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
    const { id: sshKeyId, error: sshError } = await getHetznerSshKeyId();
    if (sshError) {
      return NextResponse.json({ error: sshError }, { status: 500 });
    }

    if (!sshKeyId) {
      return NextResponse.json(
        { error: 'No SSH key configured in Hetzner. Add one at console.hetzner.cloud first.' },
        { status: 400 }
      );
    }

    // Generate cryptographically secure gateway token
    const gatewayToken = crypto.randomBytes(24).toString('hex');

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
            // Store token hash in label (not the token itself)
            'gateway-token-hash': crypto.createHash('sha256').update(gatewayToken).digest('hex').substring(0, 16),
            'provider': sanitizeLabel(provider),
          },
        }),
      });

      if (!createRes.ok) {
        const errorText = await createRes.text();
        let errorMsg = 'Failed to create server';
        let errorCode: string | undefined;
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.error?.message || errorMsg;
          errorCode = errorJson.error?.code;
        } catch {
          errorMsg = errorText || errorMsg;
        }
        // Detect Hetzner quota/capacity errors and surface a friendly code
        const isCapacityError =
          errorCode === 'resource_limit_exceeded' ||
          errorCode === 'servers_limit_reached' ||
          errorCode === 'project_limit_reached' ||
          /limit.*reached|servers.*limit|maximum.*server|server.*quota/i.test(errorMsg);
        if (isCapacityError) {
          return NextResponse.json(
            { error: "We've hit our server capacity limit. Join the waitlist and we'll notify you the moment a slot opens.", code: 'SERVER_CAPACITY' },
            { status: 503 }
          );
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
