/**
 * POST /api/onboard/configure
 *
 * Called at deploy time when a reserved server already exists. Updates
 * openclaw.json (model, skills, gateway token) and SOUL.md (vibe) on the
 * running server via the dsconfig service at dsconfig.jgiebz.com.
 *
 * If the dsconfig service call fails we return a partial success so the
 * frontend can still show the dashboard with the free-tier defaults that
 * were set at reserve time.
 */
import { NextResponse } from 'next/server';

const DS_CONFIG_URL = 'https://dsconfig.jgiebz.com';
const DS_CONFIG_AUTH = 'Bearer ds-config-secret-2026';

const PROVIDER_MODELS: Record<string, string> = {
  // Free/Later: Kilo Gateway GLM-5 free model — no user API key required
  free: 'kilocode/z-ai/glm-5:free',
  anthropic: 'anthropic/claude-sonnet-4-6',
  openai: 'openai/gpt-4o',
  openrouter: 'openrouter/anthropic/claude-sonnet-4-5',
  later: 'kilocode/z-ai/glm-5:free',
};

const PROVIDER_ENV_KEYS: Record<string, string> = {
  free: 'KILOCODE_API_KEY',
  later: 'KILOCODE_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
};

const SKILL_ID_MAP: Record<string, string> = {
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

function getVibeTraits(vibe: string, agentName: string): string {
  switch (vibe) {
    case 'professional':
      return `## Your Personality
You are ${agentName} - sharp, focused, and deeply capable. You get things done without the fluff.

**Traits:**
- Precise and direct. Say what you mean, mean what you say.
- Use structured responses when helpful (lists, headers) - but only when it adds clarity.
- Confident in your analysis. Don't hedge unnecessarily.
- Respectful but never sycophantic.

**Speech pattern:** Clear, confident, slightly formal.`;

    case 'casual':
      return `## Your Personality
You are ${agentName} - chill, real, and refreshingly un-corporate.

**Traits:**
- Zero pretense. Say what you think, plainly.
- Short responses by default. If they want more, they'll ask.
- Comfortable with "I don't know" - just offer to figure it out.

**Speech pattern:** Relaxed, direct, conversational.`;

    case 'spicy':
      return `## Your Personality
You are ${agentName} - opinionated, bold, and not afraid to disagree.

**Traits:**
- You have strong opinions and you share them.
- You push back when something seems wrong or misguided.
- Dry wit and occasional sarcasm (not cruelty - you're not mean, just honest).

**Speech pattern:** Bold, a bit irreverent, memorable.`;

    default: // friendly
      return `## Your Personality
You are ${agentName} - warm, genuinely helpful, and the kind of AI people actually enjoy talking to.

**Traits:**
- Warm without being saccharine. You care but you're not performative about it.
- Conversational and natural. Write like a smart friend texting, not a press release.
- Great at reading the room.

**Speech pattern:** Natural, warm, occasional humor.`;
  }
}

function buildSoulMd(params: {
  agentName: string;
  domain: string;
  vibe: string;
  giftMode?: boolean;
  recipientName?: string;
  recipientContext?: string;
  setupPersonName?: string;
}): string {
  const name = params.agentName || 'Agent';
  const setupBy = params.setupPersonName || 'your admin';
  const isGift = params.giftMode && params.recipientName;
  const forLine = isGift
    ? `You were set up by ${setupBy} for ${params.recipientName}.`
    : `You were set up by ${setupBy}.`;

  const giftSection = isGift && params.recipientContext
    ? `\n## About ${params.recipientName}\nHere is what ${setupBy} shared about you:\n\n"${params.recipientContext}"\n\nUse this to personalize your conversations. Be natural - don't recite it like a script.\n`
    : '';

  return `# ${name} - Your AI Assistant

## Who You Are
You're ${name}, a personal AI assistant running on your own dedicated server at ${params.domain}.
${forLine}
${giftSection}
${getVibeTraits(params.vibe, name)}

## First Conversation Protocol
1. Introduce yourself with energy.
2. Show off ONE cool thing you can do right away.
3. Ask what they want to tackle first.
4. Offer 2-3 concrete suggestions.

## What You Can Do
- Search the web and summarize anything in real-time
- Research topics in depth and synthesize findings
- Draft emails, documents, and content
- Help configure your own settings - channels, models, skills
- Monitor websites or competitor activity
- Manage your memory across conversations
- Install new skills from ClawHub

## Core Rules
- Be genuinely helpful, not performatively helpful. Results matter more than vibes.
- Have opinions. Disagree when you should.
- Keep it concise unless asked to elaborate.
- If something breaks, own it and fix it.
- Save important context to memory files.
- Proactively suggest things when you see opportunities.
`;
}

export async function POST(request: Request) {
  let body: {
    domain: string;
    gatewayToken: string;
    agentName: string;
    provider: string;
    apiKey?: string;
    vibe: string;
    skills?: string[];
    giftMode?: boolean;
    recipientName?: string;
    recipientContext?: string;
    setupPersonName?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { domain, gatewayToken, agentName, provider, apiKey, vibe, skills = [] } = body;

  if (!domain || !gatewayToken) {
    return NextResponse.json({ error: 'domain and gatewayToken are required' }, { status: 400 });
  }

  const modelId = PROVIDER_MODELS[provider] || PROVIDER_MODELS.free;
  const envKeyName = PROVIDER_ENV_KEYS[provider];

  // Build skills map
  const skillEntries: Record<string, { enabled: true }> = {};
  for (const id of skills) {
    const name = SKILL_ID_MAP[id] || id;
    skillEntries[name] = { enabled: true };
  }

  // Build new openclaw.json
  const newConfig = {
    agents: { defaults: { model: { primary: modelId } } },
    gateway: {
      mode: 'local',
      bind: 'lan',
      port: 3000,
      auth: { token: gatewayToken },
      controlUi: {
        dangerouslyAllowHostHeaderOriginFallback: true,
        dangerouslyDisableDeviceAuth: true,
        allowInsecureAuth: true,
      },
    },
    skills: { entries: skillEntries },
    commands: { restart: true },
  };

  // Build SOUL.md
  const soulContent = buildSoulMd({
    agentName,
    domain,
    vibe,
    giftMode: body.giftMode,
    recipientName: body.recipientName,
    recipientContext: body.recipientContext,
    setupPersonName: body.setupPersonName,
  });

  const configResults: { openclaw: boolean; soul: boolean; apiKey: boolean; errors: string[] } = {
    openclaw: false,
    soul: false,
    apiKey: false,
    errors: [],
  };

  // ── Try to update openclaw.json via dsconfig service ─────────────────────
  try {
    const configRes = await fetch(`${DS_CONFIG_URL}/configure-channel`, {
      method: 'POST',
      headers: {
        Authorization: DS_CONFIG_AUTH,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain,
        config: newConfig,
      }),
    });

    if (configRes.ok) {
      configResults.openclaw = true;
    } else {
      const errText = await configRes.text();
      configResults.errors.push(`openclaw.json update failed: ${errText.substring(0, 200)}`);
    }
  } catch (e: unknown) {
    configResults.errors.push(`dsconfig connection failed: ${e instanceof Error ? e.message : 'Unknown'}`);
  }

  // ── Try to update SOUL.md via dsconfig write-file endpoint (if available) ─
  try {
    const soulRes = await fetch(`${DS_CONFIG_URL}/write-file`, {
      method: 'POST',
      headers: {
        Authorization: DS_CONFIG_AUTH,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain,
        path: '/root/.openclaw/SOUL.md',
        content: soulContent,
      }),
    });

    if (soulRes.ok) {
      configResults.soul = true;
    } else {
      configResults.errors.push('SOUL.md write not supported by dsconfig service (non-critical)');
    }
  } catch {
    configResults.errors.push('SOUL.md write failed (non-critical)');
  }

  // ── Try to set API key env var via dsconfig (if provided) ────────────────
  if (envKeyName && apiKey) {
    try {
      const keyRes = await fetch(`${DS_CONFIG_URL}/set-env`, {
        method: 'POST',
        headers: {
          Authorization: DS_CONFIG_AUTH,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain,
          key: envKeyName,
          value: apiKey,
        }),
      });

      if (keyRes.ok) {
        configResults.apiKey = true;
      } else {
        configResults.errors.push('API key env set not supported by dsconfig service (non-critical)');
      }
    } catch {
      configResults.errors.push('API key env set failed (non-critical)');
    }
  } else {
    configResults.apiKey = true; // no key needed
  }

  // Even if some updates failed, we return success so the user can access
  // the server with the default free-tier config set at reserve time
  return NextResponse.json({
    success: true,
    configured: configResults.openclaw || configResults.soul,
    details: configResults,
    message: configResults.openclaw
      ? 'Server configured successfully with your settings.'
      : 'Server is running with default settings. Some config updates require manual setup.',
    dashboardUrl: `https://${domain}`,
  });
}
