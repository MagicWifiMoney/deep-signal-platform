'use client';

import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState, Suspense } from 'react';

const CHANNEL_GUIDES: Record<string, {
  name: string;
  icon: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
  time: string;
  steps: Array<{
    title: string;
    description: string;
    action?: string;
    link?: string;
    code?: string;
    image?: string;
  }>;
  requirements: string[];
  configFields: Array<{
    key: string;
    label: string;
    placeholder: string;
    type: 'text' | 'password';
    help?: string;
  }>;
}> = {
  whatsapp: {
    name: 'WhatsApp Business',
    icon: '📱',
    description: 'Connect your agent to WhatsApp Business API for customer messaging.',
    difficulty: 'Medium',
    time: '15-20 min',
    requirements: [
      'WhatsApp Business Account',
      'Meta Business Suite access',
      'Phone number for WhatsApp',
      'Business verification (for production)',
    ],
    steps: [
      {
        title: 'Create Meta Developer Account',
        description: 'Go to Meta for Developers and create an account or log in with your Facebook credentials.',
        action: 'Open Meta Developers',
        link: 'https://developers.facebook.com/',
      },
      {
        title: 'Create a New App',
        description: 'Click "Create App" → Select "Business" → Name it (e.g., "Company AI Assistant") → Create.',
      },
      {
        title: 'Add WhatsApp Product',
        description: 'In your app dashboard, scroll to "Add Products" and click "Set Up" on WhatsApp.',
      },
      {
        title: 'Get API Credentials',
        description: 'Go to WhatsApp → API Setup. Copy your Phone Number ID and Access Token.',
        code: `WHATSAPP_PHONE_ID=your_phone_number_id
WHATSAPP_TOKEN=your_access_token`,
      },
      {
        title: 'Configure Webhook',
        description: 'Set the webhook URL to your Deep Signal instance. Use the verify token shown below.',
        code: `Webhook URL: http://YOUR_INSTANCE_IP:3000/webhook/whatsapp
Verify Token: deepsignal-verify-token`,
      },
      {
        title: 'Subscribe to Messages',
        description: 'In Webhook fields, subscribe to: messages, message_deliveries, message_reads',
      },
      {
        title: 'Add Config to Deep Signal',
        description: 'Add these values to your instance configuration (fields below).',
      },
    ],
    configFields: [
      { key: 'phoneId', label: 'Phone Number ID', placeholder: '1234567890', type: 'text' },
      { key: 'token', label: 'Access Token', placeholder: 'EAAG...', type: 'password', help: 'Permanent token from System Users' },
      { key: 'verifyToken', label: 'Webhook Verify Token', placeholder: 'deepsignal-verify-token', type: 'text' },
    ],
  },
  slack: {
    name: 'Slack',
    icon: '💼',
    description: 'Add your AI agent as a Slack app in your workspace.',
    difficulty: 'Easy',
    time: '10 min',
    requirements: [
      'Slack workspace admin access',
      'Slack account',
    ],
    steps: [
      {
        title: 'Create Slack App',
        description: 'Go to Slack API and create a new app from scratch.',
        action: 'Open Slack API',
        link: 'https://api.slack.com/apps',
      },
      {
        title: 'Configure Bot',
        description: 'Go to "OAuth & Permissions" → Add Bot Token Scopes: chat:write, app_mentions:read, im:history, im:read, im:write',
      },
      {
        title: 'Enable Events',
        description: 'Go to "Event Subscriptions" → Enable Events → Set Request URL to your instance webhook.',
        code: `Request URL: http://YOUR_INSTANCE_IP:3000/webhook/slack`,
      },
      {
        title: 'Subscribe to Bot Events',
        description: 'Add these bot events: app_mention, message.im',
      },
      {
        title: 'Install to Workspace',
        description: 'Go to "Install App" → Install to your workspace → Copy the Bot Token.',
      },
      {
        title: 'Get Signing Secret',
        description: 'Go to "Basic Information" → Copy the Signing Secret.',
      },
      {
        title: 'Configure Deep Signal',
        description: 'Add your Slack credentials to your instance.',
      },
    ],
    configFields: [
      { key: 'botToken', label: 'Bot Token', placeholder: 'xoxb-...', type: 'password' },
      { key: 'signingSecret', label: 'Signing Secret', placeholder: 'abc123...', type: 'password' },
      { key: 'appToken', label: 'App Token (optional)', placeholder: 'xapp-...', type: 'password', help: 'For Socket Mode' },
    ],
  },
  discord: {
    name: 'Discord',
    icon: '🎮',
    description: 'Add your AI agent as a Discord bot to your server.',
    difficulty: 'Easy',
    time: '10 min',
    requirements: [
      'Discord account',
      'Server admin permissions',
    ],
    steps: [
      {
        title: 'Create Discord Application',
        description: 'Go to Discord Developer Portal and create a new application.',
        action: 'Open Discord Developers',
        link: 'https://discord.com/developers/applications',
      },
      {
        title: 'Create Bot',
        description: 'Go to "Bot" tab → "Add Bot" → Confirm.',
      },
      {
        title: 'Configure Intents',
        description: 'Enable these Privileged Gateway Intents: Message Content Intent, Server Members Intent',
      },
      {
        title: 'Get Bot Token',
        description: 'Click "Reset Token" → Copy and save the token securely.',
      },
      {
        title: 'Generate Invite URL',
        description: 'Go to OAuth2 → URL Generator → Select: bot, applications.commands → Select permissions: Send Messages, Read Messages, etc.',
      },
      {
        title: 'Invite Bot to Server',
        description: 'Open the generated URL and add the bot to your server.',
      },
      {
        title: 'Configure Deep Signal',
        description: 'Add your Discord bot token to your instance.',
      },
    ],
    configFields: [
      { key: 'botToken', label: 'Bot Token', placeholder: 'MTIz...', type: 'password' },
      { key: 'applicationId', label: 'Application ID', placeholder: '123456789', type: 'text' },
    ],
  },
  teams: {
    name: 'Microsoft Teams',
    icon: '🏢',
    description: 'Deploy your AI agent as a Microsoft Teams bot.',
    difficulty: 'Advanced',
    time: '30 min',
    requirements: [
      'Microsoft 365 admin access',
      'Azure account',
      'Teams admin permissions',
    ],
    steps: [
      {
        title: 'Create Azure Bot',
        description: 'Go to Azure Portal → Create "Azure Bot" resource.',
        action: 'Open Azure Portal',
        link: 'https://portal.azure.com/#create/Microsoft.AzureBot',
      },
      {
        title: 'Configure Bot Handle',
        description: 'Set a unique bot handle, select your subscription and resource group.',
      },
      {
        title: 'Get App ID and Password',
        description: 'After creation, go to Configuration → Copy Microsoft App ID → Create and copy password.',
      },
      {
        title: 'Configure Messaging Endpoint',
        description: 'Set the messaging endpoint to your Deep Signal instance.',
        code: `Messaging endpoint: https://YOUR_DOMAIN/api/messages`,
      },
      {
        title: 'Enable Teams Channel',
        description: 'Go to Channels → Add "Microsoft Teams" channel.',
      },
      {
        title: 'Create Teams App Package',
        description: 'Download the Teams app manifest and customize it with your bot details.',
      },
      {
        title: 'Upload to Teams Admin',
        description: 'Go to Teams Admin Center → Manage Apps → Upload your app package.',
      },
      {
        title: 'Configure Deep Signal',
        description: 'Add your Azure Bot credentials to your instance.',
      },
    ],
    configFields: [
      { key: 'appId', label: 'Microsoft App ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', type: 'text' },
      { key: 'appPassword', label: 'App Password', placeholder: '~xxx...', type: 'password' },
      { key: 'tenantId', label: 'Tenant ID (optional)', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', type: 'text' },
    ],
  },
  telegram: {
    name: 'Telegram',
    icon: '✈️',
    description: 'Create a Telegram bot for your AI agent.',
    difficulty: 'Easy',
    time: '5 min',
    requirements: [
      'Telegram account',
    ],
    steps: [
      {
        title: 'Message BotFather',
        description: 'Open Telegram and search for @BotFather. Start a chat.',
        action: 'Open BotFather',
        link: 'https://t.me/BotFather',
      },
      {
        title: 'Create New Bot',
        description: 'Send /newbot and follow the prompts. Choose a name and username for your bot.',
      },
      {
        title: 'Get Bot Token',
        description: 'BotFather will give you an API token. Copy it securely.',
      },
      {
        title: 'Set Webhook',
        description: 'Set the webhook URL to your Deep Signal instance using the Telegram API.',
        code: `curl -X POST "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook" \\
  -d "url=http://YOUR_INSTANCE_IP:3000/webhook/telegram"`,
      },
      {
        title: 'Configure Deep Signal',
        description: 'Add your Telegram bot token to your instance.',
      },
    ],
    configFields: [
      { key: 'botToken', label: 'Bot Token', placeholder: '123456:ABC-DEF...', type: 'password' },
    ],
  },
  email: {
    name: 'Email',
    icon: '📧',
    description: 'Connect your AI agent to an email inbox.',
    difficulty: 'Medium',
    time: '15 min',
    requirements: [
      'Email account with IMAP/SMTP access',
      'App password (for Gmail/Outlook)',
    ],
    steps: [
      {
        title: 'Enable IMAP Access',
        description: 'In your email settings, enable IMAP access for receiving emails.',
      },
      {
        title: 'Create App Password',
        description: 'For Gmail: Go to Google Account → Security → App Passwords → Generate. For Outlook: Similar process in Microsoft account.',
      },
      {
        title: 'Get SMTP Settings',
        description: 'Note your email provider\'s SMTP settings.',
        code: `# Gmail
SMTP: smtp.gmail.com:587
IMAP: imap.gmail.com:993

# Outlook
SMTP: smtp.office365.com:587
IMAP: outlook.office365.com:993`,
      },
      {
        title: 'Configure Deep Signal',
        description: 'Add your email credentials to your instance.',
      },
    ],
    configFields: [
      { key: 'email', label: 'Email Address', placeholder: 'support@company.com', type: 'text' },
      { key: 'password', label: 'App Password', placeholder: 'xxxx xxxx xxxx xxxx', type: 'password' },
      { key: 'imapHost', label: 'IMAP Host', placeholder: 'imap.gmail.com', type: 'text' },
      { key: 'smtpHost', label: 'SMTP Host', placeholder: 'smtp.gmail.com', type: 'text' },
    ],
  },
};

function ChannelSetupInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const channelId = params.channel as string;
  const guide = CHANNEL_GUIDES[channelId];
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Get instance details from URL params
  const domain = searchParams.get('domain') || '';
  const token = searchParams.get('token') || '';
  const agentName = searchParams.get('name') || 'your agent';

  const handleSave = async () => {
    if (!domain) {
      setSaveResult({ ok: false, message: 'Missing instance domain. Go back to onboarding and try again.' });
      return;
    }
    setSaving(true);
    setSaveResult(null);
    try {
      const endpoint = channelId === 'telegram' ? '/api/channels/configure' : '/api/channels/configure';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          gatewayToken: token,
          channel: channelId,
          config: config,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveResult({ ok: true, message: `${guide.name} connected! Open your agent to start chatting.` });
      } else {
        setSaveResult({ ok: false, message: data.error || 'Failed to save configuration' });
      }
    } catch {
      setSaveResult({ ok: false, message: 'Network error - check your connection and try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (!guide) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❓</div>
          <h1 className="text-2xl font-bold text-white mb-2">Channel not found</h1>
          <Link href="/dashboard" className="text-cyan-400 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white">Deep Signal</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            guide.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' :
            guide.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
            'bg-rose-500/20 text-rose-400'
          }`}>
            {guide.difficulty}
          </span>
          <span className="text-sm text-slate-400">⏱️ {guide.time}</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">{guide.icon}</div>
          <h1 className="text-3xl font-bold text-white mb-2">Set up {guide.name}</h1>
          <p className="text-slate-400">{guide.description}</p>
        </div>

        {/* Requirements */}
        <div className="glass rounded-2xl p-6 mb-8">
          <h2 className="font-semibold text-white mb-4">📋 Requirements</h2>
          <ul className="grid md:grid-cols-2 gap-2">
            {guide.requirements.map((req, i) => (
              <li key={i} className="flex items-center gap-2 text-slate-300">
                <span className="text-cyan-400">•</span>
                {req}
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-12">
          {guide.steps.map((step, i) => (
            <div 
              key={i}
              className={`glass rounded-2xl p-6 transition-all ${
                i === currentStep ? 'border-cyan-500 bg-cyan-500/5' : ''
              }`}
            >
              <div 
                className="flex items-start gap-4 cursor-pointer"
                onClick={() => setCurrentStep(i)}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  i < currentStep ? 'bg-emerald-500 text-white' :
                  i === currentStep ? 'bg-cyan-500 text-white' :
                  'bg-slate-700 text-slate-400'
                }`}>
                  {i < currentStep ? '✓' : i + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">{step.title}</h3>
                  <p className="text-slate-400 text-sm">{step.description}</p>
                  
                  {i === currentStep && step.code && (
                    <div className="mt-4 relative">
                      <pre className="bg-slate-900 rounded-xl p-4 text-sm font-mono text-cyan-400 overflow-x-auto">
                        {step.code}
                      </pre>
                      <button
                        onClick={() => copyToClipboard(step.code!, `code-${i}`)}
                        className="absolute top-2 right-2 px-2 py-1 rounded bg-slate-800 text-xs text-slate-400 hover:text-white"
                      >
                        {copied === `code-${i}` ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  )}
                  
                  {i === currentStep && step.link && (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                    >
                      {step.action || 'Open Link'} →
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Configuration Form */}
        <div className="glass rounded-2xl p-6 mb-8">
          <h2 className="font-semibold text-white mb-6">⚙️ Configuration</h2>
          <div className="space-y-4">
            {guide.configFields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm text-slate-300 mb-2">{field.label}</label>
                <input
                  type={field.type}
                  value={config[field.key] || ''}
                  onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none font-mono text-sm"
                />
                {field.help && (
                  <p className="text-xs text-slate-500 mt-1">{field.help}</p>
                )}
              </div>
            ))}
          </div>
          
          {saveResult && (
            <div className={`mt-4 p-4 rounded-xl border text-sm ${
              saveResult.ok
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              {saveResult.ok ? '✅' : '⚠️'} {saveResult.message}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !Object.values(config).some(v => v.trim())}
            className="w-full mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Connecting...' : saveResult?.ok ? '✅ Connected!' : 'Connect ' + guide.name}
          </button>
        </div>

        {/* Help */}
        <div className="text-center text-slate-400">
          <p>Need help? <a href="mailto:support@deepsignal.ai" className="text-cyan-400 hover:underline">Contact Support</a></p>
        </div>
      </div>
    </div>
  );
}

export default function ChannelSetup() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ChannelSetupInner />
    </Suspense>
  );
}
