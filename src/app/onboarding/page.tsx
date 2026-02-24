'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CONFIGS, type AgentConfig } from '@/lib/configs';

// ── Types ──────────────────────────────────────────────────────────────────────

interface FormData {
  // Step 0: Who
  forSelf: boolean;
  recipientName: string;
  recipientContext: string;
  setupPersonName: string;
  // Step 1: Name
  agentName: string;
  projectName: string;
  // Step 2: Model
  provider: 'free' | 'anthropic' | 'openai' | 'openrouter' | 'later';
  apiKey: string;
  // Step 3: Vibe
  vibe: 'professional' | 'friendly' | 'casual' | 'spicy';
  // Step 4: Channels
  channels: string[];
  // Step 5: Skills
  skills: string[];
  // Config template
  config: string | null;
}

interface DeploymentStatus {
  id: number;
  hostname: string;
  ip: string;
  domain: string;
  gatewayToken: string;
  dashboardUrl: string | null;
}

interface ReservedServer {
  id: number;
  hostname: string;
  ip: string;
  domain: string;
  gatewayToken: string;
  dashboardUrl: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const AGENT_NAME_SUGGESTIONS = [
  'Aria', 'Max', 'Nova', 'Sage', 'Echo',
  'Zara', 'Orion', 'Luna', 'Atlas', 'Iris',
  'Pixel', 'Juno', 'Rex', 'Vega', 'Clio',
];

const PROVIDERS = [
  {
    id: 'free',
    emoji: '🆓',
    name: 'Start Free',
    subtitle: 'Kilo Gateway (GLM-5 / MiniMax M2.5)',
    description: 'Perfect for trying things out. No API key needed.',
    price: 'Free',
    priceColor: 'text-emerald-400',
    needsKey: false,
  },
  {
    id: 'anthropic',
    emoji: '⚡',
    name: 'Anthropic Claude',
    subtitle: 'claude-sonnet-4-6',
    description: 'The gold standard. Best reasoning, most capable.',
    price: '$$',
    priceColor: 'text-yellow-400',
    needsKey: true,
    keyPlaceholder: 'sk-ant-...',
    keyHint: 'Get your key at console.anthropic.com',
  },
  {
    id: 'openai',
    emoji: '🧠',
    name: 'OpenAI',
    subtitle: 'GPT-4o and friends',
    description: 'GPT-5 and the full OpenAI lineup.',
    price: '$$',
    priceColor: 'text-yellow-400',
    needsKey: true,
    keyPlaceholder: 'sk-...',
    keyHint: 'Get your key at platform.openai.com',
  },
  {
    id: 'openrouter',
    emoji: '🌐',
    name: 'OpenRouter',
    subtitle: 'Single key, 290+ models',
    description: 'Maximum flexibility. Switch models anytime.',
    price: '$',
    priceColor: 'text-green-400',
    needsKey: true,
    keyPlaceholder: 'sk-or-v1-...',
    keyHint: 'Get your key at openrouter.ai/keys',
  },
  {
    id: 'later',
    emoji: '🔧',
    name: 'Configure Later',
    subtitle: 'Start free, upgrade anytime',
    description: 'Your agent will help you set this up after deploy.',
    price: 'Free now',
    priceColor: 'text-slate-400',
    needsKey: false,
  },
] as const;

const VIBES = [
  {
    id: 'professional',
    emoji: '💼',
    name: 'Professional',
    tagline: 'Sharp, focused, no fluff',
    preview: "Good morning. I've reviewed your request and have three actionable options ready. Which direction would you like to explore?",
  },
  {
    id: 'friendly',
    emoji: '😊',
    name: 'Friendly',
    tagline: 'Warm, helpful, genuinely cares',
    preview: "Hey! Happy to help with that. I took a look and I think I've got a solid approach - want me to walk you through it?",
  },
  {
    id: 'casual',
    emoji: '😎',
    name: 'Casual',
    tagline: 'Chill, real talk, no corporate speak',
    preview: "Yeah, I got you. Here's what I'm thinking... it's not perfect but it'll get the job done. What do you think?",
  },
  {
    id: 'spicy',
    emoji: '🌶️',
    name: 'Spicy',
    tagline: 'Bold opinions, a little chaotic',
    preview: "Okay, real talk - that approach is gonna bite you later. Here's what you should actually do (don't @ me):",
  },
] as const;

const CHANNEL_OPTIONS = [
  {
    id: 'telegram',
    emoji: '✈️',
    name: 'Telegram',
    description: 'Best mobile experience. Bot setup in 2 min.',
  },
  {
    id: 'discord',
    emoji: '🎮',
    name: 'Discord',
    description: 'Great for communities and teams.',
  },
  {
    id: 'slack',
    emoji: '💬',
    name: 'Slack',
    description: 'For work. Drops right into your workspace.',
  },
  {
    id: 'whatsapp',
    emoji: '📱',
    name: 'WhatsApp',
    description: 'Chat from your phone. Link with QR code.',
  },
  {
    id: 'web',
    emoji: '🌐',
    name: 'Web Only',
    description: 'Browser chat - no setup needed.',
  },
];

const SKILL_CATEGORIES = [
  {
    category: 'Productivity',
    skills: [
      { id: 'weather', emoji: '🌤️', name: 'Weather', description: 'Current weather and forecasts', popular: true },
      { id: 'web-search', emoji: '🔍', name: 'Web Search', description: 'Search the internet with Brave Search', popular: true },
      { id: 'notion', emoji: '📝', name: 'Notion', description: 'Read and write Notion pages and databases' },
      { id: 'google-workspace', emoji: '📧', name: 'Google Workspace', description: 'Gmail, Calendar, Drive, Docs, Sheets' },
      { id: 'apple-notes', emoji: '🍎', name: 'Apple Notes', description: 'Create and manage Apple Notes (macOS)' },
      { id: 'apple-reminders', emoji: '⏰', name: 'Apple Reminders', description: 'Manage reminders and lists (macOS)' },
    ],
  },
  {
    category: 'Development',
    skills: [
      { id: 'github', emoji: '🐙', name: 'GitHub', description: 'Issues, PRs, repos, and CI/CD', popular: true },
      { id: 'coding-agent', emoji: '🧩', name: 'Coding Agent', description: 'Delegate coding tasks to sub-agents', popular: true },
      { id: 'healthcheck', emoji: '🛡️', name: 'Health Check', description: 'Security audits and system monitoring' },
    ],
  },
  {
    category: 'Creative',
    skills: [
      { id: 'image-gen', emoji: '🎨', name: 'Image Generation', description: 'Create images with AI (Gemini, OpenAI, Grok)', popular: true },
      { id: 'video-gen', emoji: '🎬', name: 'Video Generation', description: 'Generate video clips with Google Veo' },
      { id: 'tts', emoji: '🗣️', name: 'Text to Speech', description: 'Convert text to natural speech (ElevenLabs)' },
    ],
  },
  {
    category: 'Social & Marketing',
    skills: [
      { id: 'twitter', emoji: '🐦', name: 'Twitter/X', description: 'Read timelines, search, engage on X', popular: true },
      { id: 'typefully', emoji: '✍️', name: 'Typefully', description: 'Draft and schedule social media posts' },
      { id: 'reddit', emoji: '🟠', name: 'Reddit', description: 'Search Reddit posts and discussions' },
      { id: 'seo', emoji: '📊', name: 'SEO Tools', description: 'Keyword research and search analytics' },
      { id: 'google-trends', emoji: '📈', name: 'Google Trends', description: 'Track trending topics and keywords' },
    ],
  },
  {
    category: 'Research',
    skills: [
      { id: 'deep-research', emoji: '🔬', name: 'Deep Research', description: 'Multi-source research via Gemini (cheap)', popular: true },
      { id: 'perplexity', emoji: '🧠', name: 'Perplexity', description: 'Research with citations using Perplexity AI' },
      { id: 'arxiv', emoji: '📄', name: 'arXiv', description: 'Search and browse academic papers' },
      { id: 'youtube-transcript', emoji: '📺', name: 'YouTube Transcripts', description: 'Summarize YouTube videos' },
    ],
  },
  {
    category: 'Crypto & Finance',
    skills: [
      { id: 'wallet', emoji: '💰', name: 'Crypto Wallet', description: 'Send USDC, trade tokens on Base' },
      { id: 'polymarket', emoji: '🎯', name: 'Polymarket', description: 'Check prediction market odds' },
      { id: 'x402', emoji: '💳', name: 'x402 Payments', description: 'Pay for and sell API services' },
    ],
  },
];

const DEPLOY_STEPS = [
  { emoji: '🔧', text: 'Building your server...' },
  { emoji: '📦', text: 'Installing OpenClaw...' },
  { emoji: '🧠', text: 'Loading the brain...' },
  { emoji: '✨', text: 'Adding personality...' },
  { emoji: '🚀', text: 'Going live...' },
];

// ── Confetti Component ─────────────────────────────────────────────────────────

function Confetti() {
  const colors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    size: 6 + Math.random() * 8,
    rotate: Math.random() * 360,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 animate-bounce"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `rotate(${p.rotate}deg)`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            animation: `confettiFall ${p.duration}s ${p.delay}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ── Step Progress ──────────────────────────────────────────────────────────────

function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i < current
              ? 'bg-emerald-400 w-6'
              : i === current
              ? 'bg-cyan-400 w-8'
              : 'bg-slate-700 w-4'
          }`}
        />
      ))}
    </div>
  );
}

// ── Config Picker Step ────────────────────────────────────────────────────────

function ConfigPickerStep({
  form,
  setForm,
}: {
  form: Pick<FormData, 'config' | 'skills'>;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const selectConfig = (cfg: AgentConfig) => {
    setForm((prev) => ({
      ...prev,
      config: cfg.id,
      skills: [...cfg.skills],
    }));
  };

  const skipConfig = () => {
    setForm((prev) => ({ ...prev, config: null }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-2">Start with a template</h2>
      <p className="text-slate-400 mb-8">
        Pre-built configs to get you running fast. Or skip and build your own.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {CONFIGS.map((cfg) => {
          const isSelected = form.config === cfg.id;
          const isOpen = expanded === cfg.id;

          return (
            <div
              key={cfg.id}
              className={`rounded-2xl border-2 transition-all overflow-hidden ${
                isSelected
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <button
                onClick={() => selectConfig(cfg)}
                className="w-full p-5 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl flex-shrink-0">{cfg.emoji}</span>
                    <div>
                      <div className="font-semibold text-white">{cfg.name}</div>
                      <div className="text-sm text-slate-400 mt-0.5">{cfg.tagline}</div>
                      <div className="mt-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                          {cfg.skills.length} skills
                        </span>
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>

              <button
                onClick={() => setExpanded(isOpen ? null : cfg.id)}
                className="w-full px-5 pb-3 flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {"What's included"}
              </button>

              {isOpen && (
                <div className="px-5 pb-4 border-t border-slate-700/50 pt-3">
                  <ul className="space-y-1.5">
                    {cfg.cronDescriptions.map((desc, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                        <span className="text-cyan-500 mt-0.5 flex-shrink-0">•</span>
                        {desc}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <button
          onClick={skipConfig}
          className={`text-sm transition-colors ${
            form.config === null
              ? 'text-slate-300 underline'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Skip - build my own
        </button>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

function OnboardingContent() {
  const searchParams = useSearchParams();
  const isGiftMode = searchParams.get('mode') === 'gift';

  const TOTAL_STEPS = 8;
  const STORAGE_KEY = 'deep-signal-onboarding';

  // Restore saved progress from localStorage
  const getSavedState = () => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const saved = JSON.parse(raw);
      // Don't restore if deploy was already in progress or done
      if (saved.step >= TOTAL_STEPS - 1) return null;
      return saved as { step: number; form: FormData };
    } catch {
      return null;
    }
  };

  const saved = getSavedState();
  const [step, setStep] = useState(saved?.step ?? 0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStepIndex, setDeployStepIndex] = useState(0);
  const [deployProgress, setDeployProgress] = useState(0);
  const [deployment, setDeployment] = useState<DeploymentStatus | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deployDone, setDeployDone] = useState(false);
  const deployStepRef = useRef(0);
  const [showResumedBanner, setShowResumedBanner] = useState(!!saved);

  // Background provisioning state
  const [reservedServer, setReservedServer] = useState<ReservedServer | null>(null);
  const [reserveAttempted, setReserveAttempted] = useState(false);

  const defaultForm: FormData = {
    forSelf: !isGiftMode,
    recipientName: '',
    recipientContext: '',
    setupPersonName: 'Jake',
    agentName: '',
    projectName: '',
    provider: 'free',
    apiKey: '',
    vibe: 'friendly',
    channels: ['web'],
    skills: ['weather', 'web-search', 'deep-research'],
    config: null,
  };

  const [form, setForm] = useState<FormData>(saved?.form ?? defaultForm);

  // Persist progress to localStorage on every change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Don't save deploy/success steps
    if (step >= TOTAL_STEPS - 1 || isDeploying || deployDone) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, form }));
    } catch {
      // Storage full or blocked - no big deal
    }
  }, [step, form, isDeploying, deployDone]);

  // Auto-dismiss the resumed banner
  useEffect(() => {
    if (showResumedBanner) {
      const t = setTimeout(() => setShowResumedBanner(false), 4000);
      return () => clearTimeout(t);
    }
  }, [showResumedBanner]);

  const update = (key: keyof FormData, value: FormData[keyof FormData]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleChannel = (id: string) => {
    setForm((prev) => ({
      ...prev,
      channels: prev.channels.includes(id)
        ? prev.channels.filter((c) => c !== id)
        : [...prev.channels, id],
    }));
  };

  const toggleSkill = (id: string) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(id)
        ? prev.skills.filter((s) => s !== id)
        : [...prev.skills, id],
    }));
  };

  const getRandomName = () => {
    const unused = AGENT_NAME_SUGGESTIONS.filter((n) => n !== form.agentName);
    return unused[Math.floor(Math.random() * unused.length)];
  };

  // ── Background provisioning: fire when user moves from step 1 → 2 ────────
  // We create the server early so it is already booting while the user
  // finishes steps 2-5. Expected boot time is ~2 min; steps take ~1-2 min.

  const fireReserve = async (agentName: string) => {
    if (reserveAttempted || !agentName.trim()) return;
    setReserveAttempted(true);
    try {
      const res = await fetch('/api/onboard/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentName }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.server) {
          setReservedServer(data.server);
        }
      }
    } catch {
      // Silent fail - deploy flow will fall back to normal onboard endpoint
    }
  };

  // ── Deploy ────────────────────────────────────────────────────────────────

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeployError(null);
    setDeployStepIndex(0);
    setDeployProgress(5);
    deployStepRef.current = 0;

    // Animate through steps
    const animateSteps = () => {
      const interval = setInterval(() => {
        deployStepRef.current += 1;
        setDeployStepIndex(deployStepRef.current);
        setDeployProgress(Math.min(85, 10 + deployStepRef.current * 18));
        if (deployStepRef.current >= DEPLOY_STEPS.length - 1) {
          clearInterval(interval);
        }
      }, 1800);
      return interval;
    };

    const animInterval = animateSteps();

    try {
      let instanceData: {
        id: number;
        hostname: string;
        ip: string;
        domain: string;
        gatewayToken: string;
        dashboardUrl: string | null;
      };

      if (reservedServer) {
        // Fast path: server already booting from step 1 reserve
        // Apply final config via configure endpoint
        try {
          const configRes = await fetch('/api/onboard/configure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              domain: reservedServer.domain,
              gatewayToken: reservedServer.gatewayToken,
              agentName: form.agentName || 'Agent',
              provider: form.provider,
              apiKey: form.apiKey || '',
              vibe: form.vibe,
              skills: form.skills,
              giftMode: !form.forSelf,
              recipientName: form.recipientName,
              recipientContext: form.recipientContext,
              setupPersonName: form.setupPersonName,
            }),
          });

          // configure is best-effort - even if it fails, use reserved server
          if (!configRes.ok) {
            console.warn('Configure failed, using reserved server with defaults');
          }
        } catch {
          console.warn('Configure request failed, using reserved server with defaults');
        }

        instanceData = {
          id: reservedServer.id,
          hostname: reservedServer.hostname,
          ip: reservedServer.ip,
          domain: reservedServer.domain,
          gatewayToken: reservedServer.gatewayToken,
          dashboardUrl: reservedServer.dashboardUrl,
        };
      } else {
        // Fallback: full onboard (user was fast, no reserved server yet)
        const res = await fetch('/api/onboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName: form.projectName || form.agentName || 'Personal Agent',
            agentName: form.agentName || 'Agent',
            apiProvider: form.provider === 'anthropic' ? 'anthropic' : form.provider === 'openai' ? 'openai' : form.provider === 'openrouter' ? 'openrouter' : 'free',
            apiKey: form.apiKey || '',
            model: form.provider,
            tone: form.vibe,
            channel: form.channels[0] || 'web',
            giftMode: !form.forSelf,
            recipientName: form.recipientName,
            recipientContext: form.recipientContext,
            setupPersonName: form.setupPersonName,
            skills: form.skills,
            configId: form.config || undefined,
          }),
        });

        const text = await res.text();
        if (!text) throw new Error('Server returned empty response');
        const data = JSON.parse(text);
        if (!res.ok) throw new Error(data.error || 'Deployment failed');

        instanceData = {
          id: data.instance.id,
          hostname: data.instance.hostname,
          ip: data.instance.ip,
          domain: data.instance.domain,
          gatewayToken: data.instance.gatewayToken,
          dashboardUrl: data.instance.dashboardUrl,
        };
      }

      clearInterval(animInterval);
      setDeployProgress(95);
      setDeployStepIndex(DEPLOY_STEPS.length - 1);

      setDeployment(instanceData);

      // Poll until ready
      pollStatus(instanceData.id, instanceData.domain);
    } catch (err: unknown) {
      clearInterval(animInterval);
      setDeployError(err instanceof Error ? err.message : 'Deployment failed');
      setIsDeploying(false);
    }
  };

  const retryDeploy = () => {
    setDeployError(null);
    handleDeploy();
  };

  const switchToFreeTier = () => {
    setDeployError(null);
    update('provider', 'free');
    update('apiKey', '');
    // Give state a tick to update then deploy
    setTimeout(() => handleDeploy(), 100);
  };

  const pollStatus = async (serverId: number, domain: string) => {
    let attempts = 0;
    const max = 90;

    const poll = async () => {
      attempts++;
      try {
        const res = await fetch(`/api/onboard?id=${serverId}&domain=${encodeURIComponent(domain)}`);
        const data = await res.json();

        if (data.openclawReady || attempts >= max) {
          setDeployProgress(100);
          setDeployDone(true);
          setIsDeploying(false);
          setTimeout(() => setShowConfetti(true), 200);
          setTimeout(() => setShowConfetti(false), 5000);
        } else {
          setTimeout(poll, 3000);
        }
      } catch {
        if (attempts < max) setTimeout(poll, 3000);
        else {
          setDeployProgress(100);
          setDeployDone(true);
          setIsDeploying(false);
          setTimeout(() => setShowConfetti(true), 200);
          setTimeout(() => setShowConfetti(false), 5000);
        }
      }
    };

    poll();
  };

  // ── Render Steps ──────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {
      // ─ Step 0: Who is this for? ─────────────────────────────────────────
      case 0:
        return (
          <div className="max-w-lg mx-auto">
            <h2 className="text-3xl font-bold text-white mb-2">Who is this for?</h2>
            <p className="text-slate-400 mb-8">
              Set up a personal agent, or gift one to a friend.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => update('forSelf', true)}
                className={`p-6 rounded-2xl border-2 text-left transition-all ${
                  form.forSelf
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <div className="text-3xl mb-3">🙋</div>
                <div className="font-semibold text-white mb-1">Setting up for myself</div>
                <div className="text-sm text-slate-400">Your own personal AI agent</div>
              </button>

              <button
                onClick={() => update('forSelf', false)}
                className={`p-6 rounded-2xl border-2 text-left transition-all ${
                  !form.forSelf
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <div className="text-3xl mb-3">🎁</div>
                <div className="font-semibold text-white mb-1">Setting up for someone else</div>
                <div className="text-sm text-slate-400">Gift an agent to a friend</div>
              </button>
            </div>

            {!form.forSelf && (
              <div className="space-y-5 p-6 rounded-2xl bg-slate-800/40 border border-slate-700">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Your name (so they know who set this up)
                  </label>
                  <input
                    type="text"
                    value={form.setupPersonName}
                    onChange={(e) => update('setupPersonName', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors text-base"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Their name
                  </label>
                  <input
                    type="text"
                    value={form.recipientName}
                    onChange={(e) => update('recipientName', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors text-base"
                    placeholder="Friend's name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tell the agent about them{' '}
                    <span className="text-slate-500 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={form.recipientContext}
                    onChange={(e) => update('recipientContext', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors resize-none text-base"
                    placeholder="e.g. She's a designer who loves coffee, runs a small Etsy shop, and is always looking for ways to save time. She's not super technical but picks things up fast."
                  />
                  <p className="text-xs text-slate-600 mt-2">
                    The agent will use this to personalize their first conversation.
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      // ─ Step 1: Start with a template ────────────────────────────────────
      case 1:
        return <ConfigPickerStep form={form} setForm={setForm} />;

      // ─ Step 2: Name your agent ──────────────────────────────────────────
      case 2:
        return (
          <div className="max-w-lg mx-auto">
            <h2 className="text-3xl font-bold text-white mb-2">Name your agent</h2>
            <p className="text-slate-400 mb-8">
              This is what they will call themselves. Make it personal.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Agent name
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={form.agentName}
                    onChange={(e) => update('agentName', e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors text-base"
                    placeholder="e.g. Aria, Max, Nova..."
                  />
                  <button
                    onClick={() => update('agentName', getRandomName())}
                    className="px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors text-sm font-medium whitespace-nowrap"
                    title="Suggest a name"
                  >
                    🎲 Random
                  </button>
                </div>
              </div>

              {/* Suggestions */}
              <div>
                <p className="text-xs text-slate-500 mb-3">Popular picks:</p>
                <div className="flex flex-wrap gap-2">
                  {AGENT_NAME_SUGGESTIONS.slice(0, 10).map((name) => (
                    <button
                      key={name}
                      onClick={() => update('agentName', name)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        form.agentName === name
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {form.agentName && (
                <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      {form.agentName[0]}
                    </div>
                    <div>
                      <div className="text-white font-medium">{form.agentName}</div>
                      <div className="text-xs text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                        Online
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-900/60 rounded-xl p-3 text-sm text-slate-300">
                    Hey! I&apos;m {form.agentName}, your new AI assistant. Ready to dive in - what do you want to tackle first?
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Project or company name{' '}
                  <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.projectName}
                  onChange={(e) => update('projectName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors text-base"
                  placeholder="e.g. Acme Inc, Side Project..."
                />
              </div>

              {/* Background provisioning hint */}
              {reservedServer && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                  <p className="text-xs text-emerald-300">
                    Server reserved and booting for {form.agentName}. Deploy will be faster!
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      // ─ Step 3: Pick your brain ──────────────────────────────────────────
      case 3:
        return (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-2">Pick your brain</h2>
            <p className="text-slate-400 mb-8">
              Which AI model should power your agent? You can switch anytime.
            </p>

            <div className="space-y-3">
              {PROVIDERS.map((provider) => (
                <div key={provider.id}>
                  <button
                    onClick={() => update('provider', provider.id as FormData['provider'])}
                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                      form.provider === provider.id
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <span className="text-2xl mt-0.5">{provider.emoji}</span>
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-semibold text-white">{provider.name}</span>
                            <span className={`text-xs font-bold ${provider.priceColor}`}>
                              {provider.price}
                            </span>
                          </div>
                          <div className="text-xs text-cyan-400/80 mt-0.5">{provider.subtitle}</div>
                          <p className="text-sm text-slate-400 mt-1">{provider.description}</p>
                        </div>
                      </div>
                      {form.provider === provider.id && (
                        <div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0 mt-1">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>

                  {/* API key input - shown inline when selected */}
                  {form.provider === provider.id && 'needsKey' in provider && provider.needsKey && (
                    <div className="mt-2 p-4 rounded-xl bg-slate-800/60 border border-slate-600 ml-2">
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        API Key
                      </label>
                      <input
                        type="password"
                        value={form.apiKey}
                        onChange={(e) => update('apiKey', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors font-mono text-base"
                        placeholder={provider.keyPlaceholder}
                        autoComplete="off"
                      />
                      <p className="text-xs text-slate-500 mt-2">{provider.keyHint}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 flex items-start gap-3">
              <span className="text-lg">🔒</span>
              <p className="text-xs text-slate-400">
                Your API key is stored only on your private server instance. Deep Signal never sees it.
              </p>
            </div>
          </div>
        );

      // ─ Step 4: Pick a vibe ──────────────────────────────────────────────
      case 4:
        return (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-2">Pick a vibe</h2>
            <p className="text-slate-400 mb-8">
              How should {form.agentName || 'your agent'} talk? See the previews.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {VIBES.map((vibe) => (
                <button
                  key={vibe.id}
                  onClick={() => update('vibe', vibe.id as FormData['vibe'])}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${
                    form.vibe === vibe.id
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{vibe.emoji}</span>
                    <div>
                      <div className="font-semibold text-white">{vibe.name}</div>
                      <div className="text-xs text-slate-400">{vibe.tagline}</div>
                    </div>
                  </div>
                  <div className="bg-slate-900/60 rounded-xl p-3 text-xs text-slate-300 leading-relaxed italic">
                    &ldquo;{vibe.preview}&rdquo;
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      // ─ Step 5: Connect channels ─────────────────────────────────────────
      case 5:
        return (
          <div className="max-w-xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-2">Connect channels</h2>
            <p className="text-slate-400 mb-2">
              Where do you want to chat with {form.agentName || 'your agent'}?
            </p>
            <p className="text-sm text-slate-500 mb-8">
              Select all that sound good - your agent will walk you through setup after deploy.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {CHANNEL_OPTIONS.map((channel) => {
                const selected = form.channels.includes(channel.id);
                return (
                  <button
                    key={channel.id}
                    onClick={() => toggleChannel(channel.id)}
                    className={`p-5 rounded-2xl border-2 text-left transition-all ${
                      selected
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{channel.emoji}</span>
                          <span className="font-semibold text-white">{channel.name}</span>
                        </div>
                        <p className="text-sm text-slate-400">{channel.description}</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-colors ${
                          selected ? 'bg-cyan-500 border-cyan-500' : 'border-slate-600'
                        }`}
                      >
                        {selected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 text-sm text-slate-400">
              Don&apos;t worry - none of these block your deployment. Your agent will guide you through connecting each one.
            </div>
          </div>
        );

      // ─ Step 6: Pick your skills ──────────────────────────────────────────
      case 6:
        return (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-2">Pick your skills</h2>
            <p className="text-slate-400 mb-2">
              Skills teach {form.agentName || 'your agent'} how to use tools. Select what sounds useful.
            </p>
            {form.config && (() => {
              const activeConfig = CONFIGS.find(c => c.id === form.config);
              return activeConfig ? (
                <div className="mb-6 flex items-center gap-3 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <span className="text-lg">{activeConfig.emoji}</span>
                  <p className="text-sm text-cyan-300">
                    Pre-loaded from <span className="font-semibold">{activeConfig.name}</span> template. Customize below.
                  </p>
                </div>
              ) : null;
            })()}
            <p className="text-sm text-slate-500 mb-8">
              You can always add more later from{' '}
              <a href="https://clawhub.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                ClawHub
              </a>{' '}
              or by telling your agent to install one.
            </p>

            <div className="space-y-8">
              {SKILL_CATEGORIES.map((cat) => (
                <div key={cat.category}>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    {cat.category}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cat.skills.map((skill) => {
                      const selected = form.skills.includes(skill.id);
                      return (
                        <button
                          key={skill.id}
                          onClick={() => toggleSkill(skill.id)}
                          className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                            selected
                              ? 'border-cyan-500 bg-cyan-500/10'
                              : 'border-slate-700/60 bg-slate-800/30 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span className="text-lg flex-shrink-0">{skill.emoji}</span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-white text-sm">{skill.name}</span>
                                  {'popular' in skill && skill.popular && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-medium">
                                      popular
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">{skill.description}</p>
                              </div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                                selected ? 'bg-cyan-500 border-cyan-500' : 'border-slate-600'
                              }`}
                            >
                              {selected && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
              <span className="text-sm text-slate-400">
                {form.skills.length} skill{form.skills.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => {
                  const allIds = SKILL_CATEGORIES.flatMap(c =>
                    c.skills.filter(s => 'popular' in s && s.popular).map(s => s.id)
                  );
                  update('skills', allIds);
                }}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                Reset to recommended
              </button>
            </div>
          </div>
        );

      // ─ Step 7: Deploy ───────────────────────────────────────────────────
      case 7:
        if (deployDone && deployment) {
          const agentUrl = `https://${deployment.domain}/#token=${deployment.gatewayToken}`;
          const shareUrl = `https://deep-signal-platform.vercel.app/share?name=${encodeURIComponent(form.agentName)}&from=${encodeURIComponent(form.setupPersonName)}&url=${encodeURIComponent(agentUrl)}`;

          return (
            <div className="max-w-xl mx-auto text-center">
              {showConfetti && <Confetti />}

              {/* Success icon */}
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="text-4xl font-bold text-white mb-3">
                {form.agentName || 'Your agent'} is live!
              </h2>
              <p className="text-slate-400 text-lg mb-8">
                {!form.forSelf
                  ? `Ready to share with ${form.recipientName || 'your friend'}.`
                  : 'Your personal AI is up and running.'}
              </p>

              {/* Primary CTA */}
              <a
                href={agentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group w-full inline-flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-xl hover:shadow-2xl hover:shadow-emerald-500/30 transition-all mb-4"
              >
                Chat with {form.agentName || 'your agent'}
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </a>

              {/* Gift mode share link */}
              {!form.forSelf && (
                <div className="mb-8 p-5 rounded-2xl bg-slate-800/50 border border-slate-700">
                  <p className="text-sm text-slate-300 mb-3 font-medium">
                    Share this link with {form.recipientName || 'your friend'}:
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <code className="flex-1 text-xs bg-slate-900/60 px-3 py-2 rounded-lg text-cyan-400 font-mono truncate">
                      {shareUrl}
                    </code>
                    <button
                      onClick={() => navigator.clipboard?.writeText(shareUrl)}
                      className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    They&apos;ll see a welcome page and go straight to their agent.
                  </p>
                </div>
              )}

              {/* Instance details */}
              <div className="text-left p-5 rounded-2xl bg-slate-800/40 border border-slate-700 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Domain</span>
                  <a
                    href={agentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 font-mono text-xs hover:underline"
                  >
                    {deployment.domain}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">IP Address</span>
                  <span className="text-white font-mono text-xs">{deployment.ip}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className="text-emerald-400 flex items-center gap-1.5 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    Live
                  </span>
                </div>
              </div>

              {/* Share buttons */}
              <div className="flex gap-3 mt-6">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Just deployed my own AI agent${form.agentName ? ` named ${form.agentName}` : ''} with Deep Signal - it took like 2 minutes 🤯`)}&url=${encodeURIComponent(`https://${deployment.domain}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium text-sm transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Share on X
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(agentUrl);
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                  }}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-medium text-sm transition-all ${
                    linkCopied
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
                  }`}
                >
                  {linkCopied ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  )}
                  {linkCopied ? 'Copied!' : 'Copy link'}
                </button>
              </div>

              {/* Save credentials */}
              <button
                onClick={() => {
                  const credsText = [
                    `# ${form.agentName || 'My Agent'} - Access Credentials`,
                    `# Generated: ${new Date().toISOString()}`,
                    `# Keep this file private - it contains your gateway token!`,
                    ``,
                    `Agent Name:    ${form.agentName || 'My Agent'}`,
                    `Dashboard URL: https://${deployment.domain}`,
                    `IP Address:    ${deployment.ip}`,
                    `Gateway Token: ${deployment.gatewayToken}`,
                    ``,
                    `# Your access link (includes token for auto-login):`,
                    `${agentUrl}`,
                    ``,
                    `# To reconnect later:`,
                    `# 1. Open the Dashboard URL above`,
                    `# 2. Enter your Gateway Token when prompted`,
                    `# Or just bookmark your access link above.`,
                  ].join('\n');
                  const blob = new Blob([credsText], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${(form.agentName || 'agent').toLowerCase().replace(/\s+/g, '-')}-credentials.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full mt-3 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-medium text-sm transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Save credentials (don&apos;t lose your token)
              </button>
            </div>
          );
        }

        if (isDeploying) {
          const currentStep = DEPLOY_STEPS[Math.min(deployStepIndex, DEPLOY_STEPS.length - 1)];
          return (
            <div className="max-w-lg mx-auto text-center">
              {/* Animated logo */}
              <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30 animate-pulse">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>

              <h2 className="text-3xl font-bold text-white mb-3">
                {reservedServer ? 'Configuring your agent...' : 'Launching...'}
              </h2>
              <p className="text-slate-400 mb-10 text-lg">
                {reservedServer
                  ? 'Your server was already booting - almost there.'
                  : 'Grab a coffee - this takes about 2 minutes.'}
              </p>

              {/* Current step */}
              <div className="mb-8 h-12 flex items-center justify-center">
                <div className="text-xl font-medium text-white animate-pulse">
                  {currentStep.emoji} {currentStep.text}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-8">
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-1000"
                    style={{ width: `${deployProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-600 mt-2">
                  <span>Starting</span>
                  <span>{deployProgress}%</span>
                  <span>Live</span>
                </div>
              </div>

              {/* Step checklist */}
              <div className="space-y-2 text-left max-w-xs mx-auto">
                {DEPLOY_STEPS.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 transition-all ${
                        i < deployStepIndex
                          ? 'bg-emerald-500 text-white'
                          : i === deployStepIndex
                          ? 'bg-cyan-500/30 border-2 border-cyan-500 text-cyan-400'
                          : 'bg-slate-800 text-slate-600'
                      }`}
                    >
                      {i < deployStepIndex ? (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        s.emoji
                      )}
                    </div>
                    <span className={i <= deployStepIndex ? 'text-white' : 'text-slate-500'}>
                      {s.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // Pre-deploy: review screen
        const isApiKeyError = deployError && (
          deployError.toLowerCase().includes('api key') ||
          deployError.toLowerCase().includes('key required') ||
          deployError.toLowerCase().includes('unauthorized')
        );

        return (
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                <span className="text-4xl">🚀</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Ready to launch</h2>
              <p className="text-slate-400">Here&apos;s what&apos;s getting deployed:</p>
            </div>

            {/* Summary cards */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <span className="text-slate-400">Agent</span>
                <span className="text-white font-medium">{form.agentName || 'Unnamed'}</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <span className="text-slate-400">Model</span>
                <span className="text-white font-medium">
                  {PROVIDERS.find((p) => p.id === form.provider)?.name}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <span className="text-slate-400">Vibe</span>
                <span className="text-white font-medium capitalize">
                  {VIBES.find((v) => v.id === form.vibe)?.name} {VIBES.find((v) => v.id === form.vibe)?.emoji}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <span className="text-slate-400">Channels</span>
                <span className="text-white font-medium">{form.channels.join(', ')}</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <span className="text-slate-400">Skills</span>
                <span className="text-white font-medium">{form.skills.length} selected</span>
              </div>
              {(() => {
                const activeConfig = form.config ? CONFIGS.find(c => c.id === form.config) : null;
                return (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                    <span className="text-slate-400">Template</span>
                    <span className="text-white font-medium">
                      {activeConfig ? `${activeConfig.name} ${activeConfig.emoji}` : 'Custom'}
                    </span>
                  </div>
                );
              })()}
              {!form.forSelf && (
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-cyan-500/30">
                  <span className="text-slate-400">Gift for</span>
                  <span className="text-cyan-300 font-medium">{form.recipientName || 'friend'} 🎁</span>
                </div>
              )}
              {reservedServer && (
                <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-slate-400">Server</span>
                  <span className="text-emerald-400 text-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    Already booting
                  </span>
                </div>
              )}
            </div>

            {/* Server spec */}
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700 mb-6 text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-slate-400">Server</span>
                <span className="text-white">Hetzner CPX21 (3 vCPU, 4GB RAM)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cost</span>
                <span className="text-emerald-400">$10.59/mo + API usage</span>
              </div>
            </div>

            {/* Error recovery */}
            {deployError && (
              <div className="p-5 rounded-xl bg-rose-500/10 border border-rose-500/30 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-rose-400 text-xl flex-shrink-0">⚠️</span>
                  <div>
                    <div className="text-rose-400 font-semibold mb-1">Deployment failed</div>
                    <p className="text-sm text-slate-300 leading-relaxed">{deployError}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={retryDeploy}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-medium text-sm transition-colors"
                  >
                    Try Again
                  </button>
                  {isApiKeyError && (
                    <button
                      onClick={switchToFreeTier}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 font-medium text-sm transition-colors"
                    >
                      Start with Free Tier
                    </button>
                  )}
                </div>
                <div className="mt-3 text-center">
                  <a
                    href="mailto:support@deepsignal.ai"
                    className="text-xs text-slate-500 hover:text-cyan-400 transition-colors"
                  >
                    Need help? Contact support
                  </a>
                </div>
              </div>
            )}

            {!deployError && (
              <button
                onClick={handleDeploy}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xl hover:shadow-2xl hover:shadow-cyan-500/25 transition-all"
              >
                {reservedServer ? 'Configure and Go Live 🚀' : 'Deploy My Agent 🚀'}
              </button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // ── Can proceed? ────────────────────────────────────────────────────────

  const canProceed = (): boolean => {
    switch (step) {
      case 0:
        if (!form.forSelf) {
          return form.recipientName.trim() !== '' && form.setupPersonName.trim() !== '';
        }
        return true;
      case 1:
        // Config template step - always optional, always can proceed
        return true;
      case 2:
        return form.agentName.trim() !== '';
      case 3:
        if (['anthropic', 'openai', 'openrouter'].includes(form.provider)) {
          return form.apiKey.trim() !== '';
        }
        return true;
      default:
        return true;
    }
  };

  const isLastStep = step === TOTAL_STEPS - 1;

  const handleNext = () => {
    // Fire background reserve when leaving step 2 (name entry, new numbering)
    if (step === 2 && form.agentName.trim()) {
      fireReserve(form.agentName.trim());
    }
    setStep((s) => s + 1);
  };

  // Keyboard shortcuts: Enter = next, Escape = back
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Skip when user is typing in an input or textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      // Skip during deploy or after deploy
      if (isDeploying || deployDone) return;

      if (e.key === 'Enter' && !isLastStep && canProceed()) {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Escape' && step > 0) {
        e.preventDefault();
        setStep((s) => s - 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, isDeploying, deployDone, form]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Step transition keyframes */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .step-enter {
          animation: fadeSlideIn 0.3s ease-out;
        }
      `}</style>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-slate-800/60">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-white">Deep Signal</span>
        </Link>

        <StepProgress current={step} total={TOTAL_STEPS} />

        <div className="text-sm text-slate-500">
          {step + 1} / {TOTAL_STEPS}
        </div>
      </header>

      {/* Resumed banner */}
      {showResumedBanner && (
        <div className="relative z-20 mx-auto max-w-xl mt-4 px-4 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center text-sm text-cyan-300 animate-pulse">
          Picked up where you left off ✨
          <button
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              setStep(0);
              setForm(defaultForm);
              setShowResumedBanner(false);
            }}
            className="ml-3 text-cyan-400 underline hover:text-cyan-200"
          >
            Start over
          </button>
        </div>
      )}

      {/* Content - key changes with step to trigger fade-in animation */}
      <main className="relative z-10 px-6 py-12 min-h-[calc(100vh-80px-88px)]">
        <div key={step} className="step-enter">
          {renderStep()}
        </div>
      </main>

      {/* Navigation footer - hidden during deploy */}
      {!isDeploying && !deployDone && (
        <footer className="fixed bottom-0 left-0 right-0 z-20 px-6 py-6 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
            {step > 0 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="px-6 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-white font-medium hover:bg-slate-800 transition-colors min-h-[48px]"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {!isLastStep && (
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px]"
                >
                  Continue
                </button>
                <span className="text-[11px] text-slate-600 hidden sm:block">
                  press Enter ↵
                </span>
              </div>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}

// ── Export with Suspense ───────────────────────────────────────────────────────

export default function Onboarding() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
