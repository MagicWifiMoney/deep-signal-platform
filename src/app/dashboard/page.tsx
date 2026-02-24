'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getSettings, saveSettings } from '@/lib/store';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Stats {
  messagesTotal: number;
  messagesToday: number;
  avgResponseTime: number;
  satisfaction: number;
  tokensUsed: number;
  tokenLimit: number;
  status: 'online' | 'warning' | 'offline';
  uptime: number;
  totalInstances: number;
  totalMonthlyCost: number;
  onlineInstances: number;
}

const INSTANCE_STORAGE_KEY = 'deep-signal-instance';

function loadStoredInstance(): { domain: string; token: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(INSTANCE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveInstance(domain: string, token: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(INSTANCE_STORAGE_KEY, JSON.stringify({ domain, token }));
  } catch { /* ignore */ }
}

// ─────────────────────────────────────────────────────────────────────────────

function DashboardContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [settings, setSettings] = useState(getSettings());
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Instance connection
  const [instanceDomain, setInstanceDomain] = useState('');
  const [instanceToken, setInstanceToken] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'online' | 'offline' | 'unknown'>('unknown');

  const [stats, setStats] = useState<Stats>({
    messagesTotal: 0,
    messagesToday: 0,
    avgResponseTime: 0,
    satisfaction: 0,
    tokensUsed: 0,
    tokenLimit: 10,
    status: 'offline',
    uptime: 0,
    totalInstances: 0,
    totalMonthlyCost: 0,
    onlineInstances: 0,
  });

  // ── Init: read domain + token from URL params or localStorage ──────────────
  useEffect(() => {
    const urlDomain = searchParams.get('domain') || '';
    const urlToken = searchParams.get('token') || '';

    if (urlDomain && urlToken) {
      setInstanceDomain(urlDomain);
      setInstanceToken(urlToken);
      saveInstance(urlDomain, urlToken);
    } else {
      const stored = loadStoredInstance();
      if (stored) {
        setInstanceDomain(stored.domain);
        setInstanceToken(stored.token);
      }
    }
  }, [searchParams]);

  // ── Health check on mount / when instance changes ─────────────────────────
  useEffect(() => {
    if (!instanceDomain || !instanceToken) return;

    const check = async () => {
      setConnectionStatus('checking');
      try {
        const res = await fetch(`https://${instanceDomain}/health`, {
          headers: { 'Authorization': `Bearer ${instanceToken}` },
          signal: AbortSignal.timeout(5000),
        });
        setConnectionStatus(res.ok ? 'online' : 'offline');
      } catch {
        // Try /v1/models as fallback health check
        try {
          const res2 = await fetch(`https://${instanceDomain}/v1/models`, {
            headers: { 'Authorization': `Bearer ${instanceToken}` },
            signal: AbortSignal.timeout(5000),
          });
          setConnectionStatus(res2.ok ? 'online' : 'offline');
        } catch {
          setConnectionStatus('offline');
        }
      }
    };

    check();
  }, [instanceDomain, instanceToken]);

  // ── Fetch real stats ───────────────────────────────────────────────────────
  useEffect(() => {
    const fetchRealStats = async () => {
      try {
        const instancesRes = await fetch('/api/instances');
        const instancesData = await instancesRes.json();
        const instances = instancesData.instances || [];

        const billingRes = await fetch('/api/billing');
        const billingData = await billingRes.json();

        const totalMessages = instances.reduce((sum: number, i: any) => sum + (i.openclaw?.messagesToday || 0), 0);
        const totalMessagesTotal = instances.reduce((sum: number, i: any) => sum + (i.openclaw?.messagesTotal || 0), 0);
        const onlineCount = instances.filter((i: any) => i.status === 'online').length;
        const avgUptime = instances.length > 0
          ? instances.reduce((sum: number, i: any) => sum + (i.openclaw?.uptime || 0), 0) / instances.length
          : 0;

        setStats({
          messagesTotal: totalMessagesTotal,
          messagesToday: totalMessages,
          avgResponseTime: 1.2,
          satisfaction: 94,
          tokensUsed: 2.4,
          tokenLimit: 10,
          status: onlineCount > 0 ? 'online' : 'offline',
          uptime: avgUptime,
          totalInstances: instances.length,
          totalMonthlyCost: billingData.totalMonthlyCost || 0,
          onlineInstances: onlineCount,
        });
      } catch (error) {
        console.error('Failed to fetch real stats:', error);
      }
    };

    fetchRealStats();
    const interval = setInterval(fetchRealStats, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message with SSE streaming ───────────────────────────────────────
  const sendMessage = async () => {
    const text = inputMessage.trim();
    if (!text || isStreaming) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsStreaming(true);

    const assistantId = (Date.now() + 1).toString();
    // Add placeholder assistant message
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }]);

    // Build conversation history for context
    const history = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));

    if (instanceDomain && instanceToken) {
      // Real instance via SSE streaming
      try {
        const res = await fetch(`https://${instanceDomain}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${instanceToken}`,
          },
          body: JSON.stringify({
            model: 'default',
            messages: [...history, { role: 'user', content: text }],
            stream: true,
          }),
        });

        if (!res.ok || !res.body) {
          const errText = await res.text().catch(() => 'Unknown error');
          throw new Error(`Agent returned ${res.status}: ${errText.substring(0, 100)}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content ?? '';
              if (delta) {
                setMessages(prev => prev.map(m =>
                  m.id === assistantId ? { ...m, content: m.content + delta } : m
                ));
              }
            } catch { /* skip malformed chunks */ }
          }
        }

        // If no streaming content came back, try non-streaming fallback
        setMessages(prev => {
          const assistant = prev.find(m => m.id === assistantId);
          if (assistant && !assistant.content) {
            return prev.map(m =>
              m.id === assistantId
                ? { ...m, content: '(No response received. The agent may still be starting up.)' }
                : m
            );
          }
          return prev;
        });

      } catch (err: any) {
        console.error('Chat error:', err);
        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? { ...m, content: `Connection error: ${err.message}. Make sure the instance is online and the token is correct.` }
            : m
        ));
      }
    } else {
      // No instance configured - show helpful message
      await new Promise(r => setTimeout(r, 500));
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: 'No instance connected. Please complete onboarding first or provide a domain + token in the URL: /dashboard?domain=your-instance.ds.jgiebz.com&token=ds-xxxxx' }
          : m
      ));
    }

    setIsStreaming(false);
    setStats(prev => ({ ...prev, messagesToday: prev.messagesToday + 1 }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const statusColor = {
    online: 'text-emerald-400',
    offline: 'text-rose-400',
    checking: 'text-yellow-400',
    unknown: 'text-slate-400',
  }[connectionStatus];

  const statusLabel = {
    online: 'Online',
    offline: 'Offline',
    checking: 'Connecting...',
    unknown: instanceDomain ? 'Unknown' : 'No Instance',
  }[connectionStatus];

  const statusBg = {
    online: 'bg-emerald-500/10 border-emerald-500/30',
    offline: 'bg-rose-500/10 border-rose-500/30',
    checking: 'bg-yellow-500/10 border-yellow-500/30',
    unknown: 'bg-slate-500/10 border-slate-500/30',
  }[connectionStatus];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900/50 border-r border-slate-800 p-6 hidden lg:flex flex-col">
        <Link href="/" className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white">Deep Signal</span>
        </Link>

        <nav className="space-y-2 flex-1">
          {[
            { id: 'overview', icon: '📊', label: 'Overview' },
            { id: 'chat', icon: '💬', label: 'Live Chat' },
            { id: 'conversations', icon: '📝', label: 'History', href: '/dashboard/conversations' },
            { id: 'analytics', icon: '📈', label: 'Analytics' },
            { id: 'settings', icon: '⚙️', label: 'Settings', href: '/dashboard/settings' },
          ].map((item) => (
            item.href ? (
              <Link
                key={item.id}
                href={item.href}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ) : (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === item.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          ))}
        </nav>

        {/* Instance info */}
        {instanceDomain && (
          <div className="glass rounded-xl p-4 mb-3">
            <div className="text-xs text-slate-500 mb-1">Connected Instance</div>
            <div className="text-xs text-cyan-400 font-mono truncate">{instanceDomain}</div>
          </div>
        )}

        {/* Token Usage */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Token Usage</span>
            <span className="text-sm text-cyan-400">{stats.tokensUsed}M / {stats.tokenLimit}M</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${(stats.tokensUsed / stats.tokenLimit) * 100}%` }}
            />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64">
        {/* Header */}
        <header className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {activeTab === 'overview' && 'Dashboard'}
              {activeTab === 'chat' && 'Live Chat'}
              {activeTab === 'analytics' && 'Analytics'}
            </h1>
            <p className="text-slate-400 text-sm">
              {settings.agentName} · {instanceDomain || 'No instance connected'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${statusBg}`}>
              <span className={`w-2 h-2 rounded-full ${connectionStatus === 'online' ? 'bg-emerald-400 animate-pulse' : connectionStatus === 'checking' ? 'bg-yellow-400 animate-pulse' : 'bg-rose-400'}`} />
              <span className={`font-medium text-sm ${statusColor}`}>{statusLabel}</span>
            </div>

            <Link
              href="https://missioncontrol.jgiebz.com"
              className="px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              Mission Control
            </Link>

            {!instanceDomain && (
              <Link
                href="/onboarding"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-sm hover:opacity-90 transition-opacity"
              >
                Get Started
              </Link>
            )}
          </div>
        </header>

        {/* No instance banner */}
        {!instanceDomain && (
          <div className="mx-6 mt-6 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
            <div className="flex items-center gap-3">
              <span className="text-cyan-400 text-lg">💡</span>
              <div>
                <p className="text-sm font-medium text-white">No instance connected</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete onboarding to deploy your AI agent, or add <code className="text-cyan-400">?domain=...&token=...</code> to the URL to connect an existing instance.
                </p>
              </div>
              <Link href="/onboarding" className="ml-auto px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 transition-colors whitespace-nowrap">
                Deploy Instance →
              </Link>
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Instances', value: stats.totalInstances, detail: `${stats.onlineInstances} online`, icon: '🖥️' },
                { label: 'Messages Today', value: stats.messagesToday, detail: `${stats.messagesTotal.toLocaleString()} total`, icon: '💬' },
                { label: 'Monthly Cost', value: `$${stats.totalMonthlyCost.toFixed(2)}`, detail: 'Infrastructure', icon: '💰' },
                { label: 'Uptime', value: `${stats.uptime.toFixed(1)}%`, detail: connectionStatus === 'online' ? 'All systems operational' : 'System offline', icon: '🟢' },
              ].map((stat, i) => (
                <div key={i} className="glass rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">{stat.icon}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      connectionStatus === 'online' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {connectionStatus}
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                  <div className="text-xs text-slate-500 mt-2">{stat.detail}</div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: '💬', label: 'Test Chat', action: () => setActiveTab('chat') },
                    { icon: '⚙️', label: 'Settings', href: '/dashboard/settings' },
                    { icon: '💰', label: 'Billing', href: '/dashboard/billing' },
                    { icon: '📊', label: 'Usage', href: '/dashboard/usage' },
                    { icon: '🖥️', label: 'Mission Control', href: 'https://missioncontrol.jgiebz.com' },
                    { icon: '📝', label: 'History', href: '/dashboard/conversations' },
                  ].map((action, i) => (
                    action.href ? (
                      <Link
                        key={i}
                        href={action.href}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
                      >
                        <span className="text-2xl">{action.icon}</span>
                        <span className="text-xs text-slate-400">{action.label}</span>
                      </Link>
                    ) : (
                      <button
                        key={i}
                        onClick={action.action}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
                      >
                        <span className="text-2xl">{action.icon}</span>
                        <span className="text-xs text-slate-400">{action.label}</span>
                      </button>
                    )
                  ))}
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-2xl">
                    🤖
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{settings.agentName}</h3>
                    <p className="text-sm text-slate-400">{settings.model.split('/').pop()}</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tone</span>
                    <span className="text-white capitalize">{settings.tone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Temperature</span>
                    <span className="text-white">{settings.temperature}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Max Tokens</span>
                    <span className="text-white">{settings.maxTokens}</span>
                  </div>
                  {instanceDomain && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Instance</span>
                      <span className="text-cyan-400 font-mono text-xs truncate max-w-[140px]">{instanceDomain}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold text-white mb-4">Messages (24h)</h3>
                <div className="h-32 flex items-end gap-1">
                  {Array.from({ length: 24 }, (_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-cyan-500/20 to-cyan-500/50 rounded-t transition-all hover:from-cyan-500/30 hover:to-cyan-500/60"
                      style={{ height: `${20 + Math.random() * 80}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-500">
                  <span>12am</span>
                  <span>Now</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-[calc(100vh-80px)]">
            {/* Connection warning */}
            {connectionStatus === 'offline' && instanceDomain && (
              <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-sm text-rose-400">
                Instance appears offline. Messages will show connection errors. Wait a moment and try again.
              </div>
            )}
            {connectionStatus === 'checking' && (
              <div className="mx-4 mt-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-sm text-yellow-400">
                Connecting to instance...
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Start a conversation</h3>
                  <p className="text-slate-400">
                    {instanceDomain
                      ? `Chatting live with ${instanceDomain}`
                      : 'No instance connected - complete onboarding first'}
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] p-4 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-cyan-500/20 text-white border border-cyan-500/30'
                      : 'bg-slate-800 text-white'
                  }`}>
                    <div className="text-xs text-slate-400 mb-1">
                      {msg.role === 'user' ? 'You' : settings.agentName}
                    </div>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.role === 'assistant' && isStreaming && !msg.content && (
                      <div className="flex gap-1 mt-1">
                        <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    )}
                    {msg.role === 'assistant' && isStreaming && msg.content && (
                      <span className="inline-block w-2 h-4 bg-cyan-400 ml-0.5 align-text-bottom animate-[blink_1s_step-end_infinite]" />
                    )}
                    <div className="text-xs text-slate-500 mt-2">
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-800">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={instanceDomain ? 'Type a message...' : 'No instance connected...'}
                  disabled={!instanceDomain}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isStreaming || !instanceDomain}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                >
                  {isStreaming ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : 'Send'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Messages', value: stats.messagesTotal.toLocaleString(), icon: '💬' },
                { label: 'Avg Session Length', value: '4.2 min', icon: '⏱️' },
                { label: 'Resolution Rate', value: '89%', icon: '✅' },
                { label: 'Escalation Rate', value: '6%', icon: '🚨' },
              ].map((stat, i) => (
                <div key={i} className="glass rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{stat.icon}</span>
                    <div>
                      <div className="text-2xl font-bold text-white">{stat.value}</div>
                      <div className="text-sm text-slate-400">{stat.label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold text-white mb-4">Messages by Day</h3>
                <div className="h-48 flex items-end gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <div key={day} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-gradient-to-t from-cyan-500/30 to-cyan-500/60 rounded-t"
                        style={{ height: `${30 + Math.random() * 70}%` }}
                      />
                      <span className="text-xs text-slate-500 mt-2">{day}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold text-white mb-4">Sentiment Distribution</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Positive', percent: 68, color: 'bg-emerald-500' },
                    { label: 'Neutral', percent: 24, color: 'bg-slate-500' },
                    { label: 'Negative', percent: 8, color: 'bg-rose-500' },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">{item.label}</span>
                        <span className="text-white">{item.percent}%</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full`}
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
