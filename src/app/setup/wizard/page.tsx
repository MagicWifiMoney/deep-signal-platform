'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const CONFIG_SERVICE = 'https://dsconfig.jgiebz.com';
const CONFIG_API_SECRET = 'ds-config-secret-2026';

// ---- Types ----
interface WizardParams {
  domain: string;
  token: string;
  name: string;
  company: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ConnectedChannels {
  slack: boolean;
  telegram: boolean;
  webchat: boolean;
}

// ---- Step definitions ----
const STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'channels', label: 'Channels' },
  { id: 'test', label: 'Test Agent' },
  { id: 'done', label: 'All Set' },
];

// ---- Animated checkmark ----
function AnimatedCheck() {
  return (
    <div className="relative w-24 h-24 mx-auto">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center animate-[scale-in_0.5s_ease-out]">
        <svg
          className="w-12 h-12 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ animation: 'draw-check 0.5s 0.3s ease-out forwards', strokeDasharray: 30, strokeDashoffset: 30 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      {/* Sparkles */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-emerald-400"
          style={{
            top: '50%',
            left: '50%',
            transform: `rotate(${deg}deg) translateY(-44px) translate(-50%, -50%)`,
            opacity: 0,
            animation: `sparkle 0.6s ${0.3 + i * 0.05}s ease-out forwards`,
          }}
        />
      ))}
    </div>
  );
}

// ---- Step 1: Welcome ----
function WelcomeStep({ params, onNext }: { params: WizardParams; onNext: () => void }) {
  return (
    <div className="text-center max-w-xl mx-auto">
      <div className="mb-8">
        <AnimatedCheck />
      </div>
      <h1 className="text-4xl font-bold text-white mb-3">{params.name} is Live!</h1>
      <p className="text-xl text-slate-400 mb-2">
        AI agent for <span className="text-cyan-400 font-semibold">{params.company}</span>
      </p>
      <p className="text-sm text-slate-500 font-mono mb-10">{params.domain}</p>

      <div className="grid grid-cols-3 gap-4 text-left mb-10">
        {[
          { icon: '🔒', title: 'Private Instance', text: 'Dedicated VPS, your data stays yours' },
          { icon: '⚡', title: 'Ready Now', text: 'Agent is live and accepting connections' },
          { icon: '🌐', title: 'HTTPS Enabled', text: 'SSL certificate auto-provisioned' },
        ].map((item, i) => (
          <div key={i} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="text-2xl mb-2">{item.icon}</div>
            <div className="text-sm font-medium text-white mb-1">{item.title}</div>
            <div className="text-xs text-slate-400">{item.text}</div>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
      >
        Let's set up your channels →
      </button>
    </div>
  );
}

// ---- Step 2: Channels ----
function ChannelsStep({
  params,
  connected,
  onConnected,
  onNext,
}: {
  params: WizardParams;
  connected: ConnectedChannels;
  onConnected: (ch: keyof ConnectedChannels) => void;
  onNext: () => void;
}) {
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramError, setTelegramError] = useState<string | null>(null);
  const [telegramExpanded, setTelegramExpanded] = useState(false);

  const embedCode = `<script src="https://${params.domain}/webchat.js" data-token="${params.token}"></script>`;
  const [embedCopied, setEmbedCopied] = useState(false);

  const copyEmbed = async () => {
    await navigator.clipboard.writeText(embedCode);
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 2000);
    onConnected('webchat');
  };

  const configureTelegram = async () => {
    if (!telegramToken.trim()) return;
    setTelegramLoading(true);
    setTelegramError(null);
    try {
      const res = await fetch(`${CONFIG_SERVICE}/configure-telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG_API_SECRET}`,
        },
        body: JSON.stringify({
          domain: params.domain,
          gatewayToken: params.token,
          telegramBotToken: telegramToken.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Configuration failed');
      onConnected('telegram');
      setTelegramExpanded(false);
    } catch (err: any) {
      setTelegramError(err.message);
    } finally {
      setTelegramLoading(false);
    }
  };

  const channelCount = Object.values(connected).filter(Boolean).length;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-2">Connect a Channel</h2>
      <p className="text-slate-400 mb-8">
        Choose how users will talk to {params.name}. You can connect multiple channels.
      </p>

      <div className="space-y-4">
        {/* Slack */}
        <div className="rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#4A154B] flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                </svg>
              </div>
              <div>
                <div className="font-semibold text-white">Slack</div>
                <div className="text-sm text-slate-400">Add {params.name} to your Slack workspace</div>
              </div>
            </div>
            {connected.slack ? (
              <span className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Connected
              </span>
            ) : (
              <Link
                href={`/setup/slack?domain=${params.domain}&token=${params.token}`}
                className="px-4 py-2 rounded-lg bg-[#4A154B] text-white text-sm font-medium hover:bg-[#611f69] transition-colors flex items-center gap-2"
              >
                <svg viewBox="0 0 122.8 122.8" className="w-4 h-4" fill="currentColor">
                  <path d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z" fill="#E01E5A"/>
                  <path d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z" fill="#36C5F0"/>
                  <path d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z" fill="#2EB67D"/>
                  <path d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z" fill="#ECB22E"/>
                </svg>
                Add to Slack
              </Link>
            )}
          </div>
        </div>

        {/* Telegram */}
        <div className="rounded-xl border border-slate-700 overflow-hidden">
          <button
            onClick={() => setTelegramExpanded(!telegramExpanded)}
            className="w-full p-5 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#229ED9] flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="font-semibold text-white">Telegram</div>
                <div className="text-sm text-slate-400">Create a bot via @BotFather and connect it</div>
              </div>
            </div>
            {connected.telegram ? (
              <span className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Connected
              </span>
            ) : (
              <svg className={`w-5 h-5 text-slate-400 transition-transform ${telegramExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>

          {telegramExpanded && !connected.telegram && (
            <div className="px-5 pb-5 border-t border-slate-700 pt-4">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-800/50">
                  <p className="text-sm font-medium text-white mb-2">Setup instructions:</p>
                  <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
                    <li>Open Telegram and message <span className="text-cyan-400 font-mono">@BotFather</span></li>
                    <li>Send <span className="text-cyan-400 font-mono">/newbot</span> and follow the prompts</li>
                    <li>Copy the bot token BotFather gives you</li>
                    <li>Paste it below and click Connect</li>
                  </ol>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Bot Token</label>
                  <input
                    type="text"
                    value={telegramToken}
                    onChange={(e) => setTelegramToken(e.target.value)}
                    placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors font-mono text-sm"
                  />
                </div>

                {telegramError && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-sm text-rose-400">
                    {telegramError}
                  </div>
                )}

                <button
                  onClick={configureTelegram}
                  disabled={!telegramToken.trim() || telegramLoading}
                  className="w-full py-3 rounded-xl bg-[#229ED9] text-white font-medium hover:bg-[#1a8bc4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {telegramLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Connecting...
                    </span>
                  ) : 'Connect Telegram'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Web Chat */}
        <div className="rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-white">Web Chat</div>
                  <div className="text-sm text-slate-400">Embed a chat widget on your website</div>
                </div>
              </div>
              {connected.webchat && (
                <span className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied
                </span>
              )}
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-700 font-mono text-xs text-slate-300 mb-3 overflow-x-auto">
              {embedCode}
            </div>
            <button
              onClick={copyEmbed}
              className="w-full py-2.5 rounded-lg border border-slate-600 text-slate-300 text-sm hover:border-cyan-500/50 hover:text-cyan-400 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {embedCopied ? 'Copied!' : 'Copy Embed Code'}
            </button>
          </div>
        </div>

        {/* Email - Coming Soon */}
        <div className="rounded-xl border border-slate-700/50 overflow-hidden opacity-60">
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-white">Email</div>
                <div className="text-sm text-slate-400">Inbox assistant for customer emails</div>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-400">
              Coming Soon
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {channelCount > 0 ? `${channelCount} channel${channelCount > 1 ? 's' : ''} connected` : 'Connect at least one channel or skip'}
        </p>
        <button
          onClick={onNext}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity"
        >
          {channelCount > 0 ? 'Next: Test Your Agent →' : 'Skip for now →'}
        </button>
      </div>
    </div>
  );
}

// ---- Step 3: Test Agent ----
function TestStep({ params, onNext }: { params: WizardParams; onNext: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [agentWorking, setAgentWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setError(null);
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const res = await fetch(`https://${params.domain}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${params.token}`,
        },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Agent returned ${res.status}: ${err.substring(0, 100)}`);
      }

      const data = await res.json();
      const reply = data.response || data.message || data.content || JSON.stringify(data);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      setAgentWorking(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-2">Test Your Agent</h2>
      <p className="text-slate-400 mb-6">
        Send a message to {params.name} and verify everything is working.
      </p>

      {/* Chat interface */}
      <div className="rounded-xl border border-slate-700 overflow-hidden mb-6">
        {/* Chat header */}
        <div className="px-5 py-4 bg-slate-800/50 border-b border-slate-700 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-white text-sm">{params.name}</div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-400">Online</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="h-72 overflow-y-auto p-4 space-y-3 bg-slate-900/50">
          {messages.length === 0 && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="bg-slate-800 rounded-2xl rounded-tl-none px-4 py-3 max-w-sm">
                <p className="text-sm text-white">
                  Hi! I'm {params.name}, the AI assistant for {params.company}. How can I help you today?
                </p>
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              )}
              <div className={`px-4 py-3 rounded-2xl max-w-sm text-sm ${
                msg.role === 'user'
                  ? 'bg-cyan-600 text-white rounded-tr-none'
                  : 'bg-slate-800 text-white rounded-tl-none'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="bg-slate-800 rounded-2xl rounded-tl-none px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/30 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-600 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors text-sm"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 text-white hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
          <p className="text-sm text-rose-400 font-medium mb-1">Connection Error</p>
          <p className="text-xs text-slate-400">{error}</p>
          <p className="text-xs text-slate-500 mt-1">The instance may still be starting up. Wait 30 seconds and try again.</p>
        </div>
      )}

      {agentWorking && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
          <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm text-emerald-400 font-medium">Your agent is working!</p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity"
        >
          {agentWorking ? "All done! See summary →" : "Skip test →"}
        </button>
      </div>
    </div>
  );
}

// ---- Step 4: Done ----
function DoneStep({ params, connected }: { params: WizardParams; connected: ConnectedChannels }) {
  const dashboardUrl = `/dashboard?domain=${params.domain}&token=${params.token}`;
  const channelCount = Object.values(connected).filter(Boolean).length;

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <h2 className="text-4xl font-bold text-white mb-3">You're All Set!</h2>
      <p className="text-lg text-slate-400 mb-10">
        {params.name} is configured and ready to serve {params.company} customers.
      </p>

      {/* Summary */}
      <div className="rounded-xl border border-slate-700 overflow-hidden mb-8 text-left">
        <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-700">
          <h3 className="font-semibold text-white">Configuration Summary</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Agent Name</span>
            <span className="text-white font-medium">{params.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Company</span>
            <span className="text-white">{params.company}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Domain</span>
            <span className="text-cyan-400 font-mono text-xs">{params.domain}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Channels Connected</span>
            <span className="text-white">
              {channelCount === 0 ? 'None yet' : [
                connected.slack && 'Slack',
                connected.telegram && 'Telegram',
                connected.webchat && 'Web Chat',
              ].filter(Boolean).join(', ')}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Status</span>
            <span className="text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {connected.webchat && (
          <Link
            href={`/setup/webchat?domain=${params.domain}`}
            className="p-4 rounded-xl border border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-left"
          >
            <div className="font-medium text-white mb-1">Embed Code</div>
            <div className="text-sm text-slate-400">Add chat widget to your site</div>
          </Link>
        )}
        {connected.slack && (
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-left">
            <div className="flex items-center gap-2 font-medium text-emerald-400 mb-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Slack Connected
            </div>
            <div className="text-sm text-slate-400">Workspace bot is live</div>
          </div>
        )}
        {connected.telegram && (
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-left">
            <div className="flex items-center gap-2 font-medium text-emerald-400 mb-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Telegram Connected
            </div>
            <div className="text-sm text-slate-400">Bot is live and responding</div>
          </div>
        )}
      </div>

      <Link
        href={dashboardUrl}
        className="inline-block px-10 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
      >
        Go to Dashboard →
      </Link>
    </div>
  );
}

// ---- Main Wizard ----
function WizardContent() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [connected, setConnected] = useState<ConnectedChannels>({
    slack: false,
    telegram: false,
    webchat: false,
  });

  const params: WizardParams = {
    domain: searchParams.get('domain') || 'your-instance.ds.jgiebz.com',
    token: searchParams.get('token') || '',
    name: searchParams.get('name') || 'AI Assistant',
    company: searchParams.get('company') || 'Your Company',
  };

  const handleConnected = (ch: keyof ConnectedChannels) => {
    setConnected(prev => ({ ...prev, [ch]: true }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white">Deep Signal</span>
        </div>

        {/* Step progress */}
        <div className="hidden md:flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                  i < step
                    ? 'bg-emerald-500 text-white'
                    : i === step
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-700 text-slate-400'
                }`}
              >
                {i < step ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (i + 1)}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${i < step ? 'bg-emerald-500' : 'bg-slate-700'}`} />
              )}
            </div>
          ))}
        </div>

        <Link
          href={`/dashboard?domain=${params.domain}&token=${params.token}`}
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          Skip to Dashboard
        </Link>
      </header>

      {/* Step labels */}
      <div className="flex justify-center gap-8 mb-2">
        {STEPS.map((s, i) => (
          <span key={s.id} className={`text-xs ${i === step ? 'text-cyan-400' : 'text-slate-600'}`}>
            {s.label}
          </span>
        ))}
      </div>

      {/* Main content */}
      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-180px)] px-6 py-8">
        {step === 0 && <WelcomeStep params={params} onNext={() => setStep(1)} />}
        {step === 1 && (
          <ChannelsStep
            params={params}
            connected={connected}
            onConnected={handleConnected}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && <TestStep params={params} onNext={() => setStep(3)} />}
        {step === 3 && <DoneStep params={params} connected={connected} />}
      </main>

      <style jsx global>{`
        @keyframes scale-in {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes draw-check {
          to { stroke-dashoffset: 0; }
        }
        @keyframes sparkle {
          0% { opacity: 0; transform: rotate(var(--rot)) translateY(-44px) translate(-50%, -50%) scale(0); }
          50% { opacity: 1; }
          100% { opacity: 0; transform: rotate(var(--rot)) translateY(-60px) translate(-50%, -50%) scale(1.5); }
        }
      `}</style>
    </div>
  );
}

export default function SetupWizard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <WizardContent />
    </Suspense>
  );
}
