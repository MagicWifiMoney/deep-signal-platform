'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSettings, saveSettings, getOnboardingState } from '@/lib/store';

interface Stats {
  messagesTotal: number;
  messagesToday: number;
  avgResponseTime: number;
  satisfaction: number;
  tokensUsed: number;
  tokenLimit: number;
  status: 'online' | 'warning' | 'offline';
  uptime: number;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [settings, setSettings] = useState(getSettings());
  const [deployment, setDeployment] = useState<{ domain: string; status: string } | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  
  const [stats, setStats] = useState<Stats>({
    messagesTotal: 1247,
    messagesToday: 89,
    avgResponseTime: 1.2,
    satisfaction: 94,
    tokensUsed: 2.4,
    tokenLimit: 10,
    status: 'online',
    uptime: 99.97,
  });

  // Load settings and deployment state on mount
  useEffect(() => {
    setSettings(getSettings());
    const state = getOnboardingState();
    if (state.deployment?.domain) {
      setDeployment({ domain: state.deployment.domain, status: state.deployment.status });
    }
  }, []);

  // Simulate real-time stats updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        messagesToday: prev.messagesToday + Math.floor(Math.random() * 2),
        avgResponseTime: +(1 + Math.random() * 0.5).toFixed(1),
      }));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Mobile Nav Bar */}
      <div className="lg:hidden flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-white">Deep Signal</span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto" role="tablist" aria-label="Dashboard navigation">
          {[
            { id: 'overview', icon: '📊', label: 'Overview' },
            { id: 'chat', icon: '💬', label: 'Chat' },
            { id: 'analytics', icon: '📈', label: 'Analytics' },
          ].map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                activeTab === item.id
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          <Link href="/dashboard/settings" className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white whitespace-nowrap">
            <span>⚙️</span>
            <span>Settings</span>
          </Link>
        </nav>
      </div>

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
            <p className="text-slate-400">
              {settings.agentName} • {settings.model.split('/').pop()}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-medium">Online</span>
            </div>
            
            <Link 
              href="/mission-control"
              className="px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              Mission Control
            </Link>
            
            <Link href="/sign-in" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
              <span className="text-slate-400">👤</span>
            </Link>
          </div>
        </header>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="p-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Messages Today', value: stats.messagesToday, change: '+12%', positive: true, icon: '💬' },
                { label: 'Avg Response Time', value: `${stats.avgResponseTime}s`, change: '-0.3s', positive: true, icon: '⚡' },
                { label: 'Satisfaction', value: `${stats.satisfaction}%`, change: '+2%', positive: true, icon: '😊' },
                { label: 'Uptime', value: `${stats.uptime}%`, change: 'No incidents', positive: true, icon: '🟢' },
              ].map((stat, i) => (
                <div key={i} className="glass rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">{stat.icon}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      stat.positive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Quick Actions + Agent Info */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: '💬', label: 'Test Chat', action: () => setActiveTab('chat') },
                    { icon: '⚙️', label: 'Settings', href: '/dashboard/settings' },
                    { icon: '📊', label: 'Analytics', action: () => setActiveTab('analytics') },
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

              {/* Agent Card */}
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
                </div>
              </div>

              {/* Activity Chart */}
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
            {/* No deployment — prompt to onboard */}
            {!deployment && (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-800 flex items-center justify-center">
                    <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No Instance Deployed</h3>
                  <p className="text-slate-400 mb-6">Complete onboarding to deploy your AI agent, then chat with it live here.</p>
                  <Link
                    href="/onboarding"
                    className="inline-flex px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                  >
                    Start Onboarding
                  </Link>
                </div>
              </div>
            )}

            {/* Provisioning / not ready */}
            {deployment && deployment.status !== 'ready' && !iframeError && (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center animate-pulse">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Instance Starting Up</h3>
                  <p className="text-slate-400 mb-4">Your agent is being provisioned. This usually takes 1-2 minutes.</p>
                  <div className="text-sm font-mono text-cyan-400 mb-6">{deployment.domain}</div>
                  <button
                    onClick={() => {
                      const state = getOnboardingState();
                      if (state.deployment?.domain) {
                        setDeployment({ domain: state.deployment.domain, status: state.deployment.status });
                      }
                    }}
                    className="px-6 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white font-medium hover:bg-slate-800 transition-colors"
                  >
                    Check Status
                  </button>
                </div>
              </div>
            )}

            {/* Deployed — show iframe */}
            {deployment && (deployment.status === 'ready' || deployment.status === 'timeout') && !iframeError && (
              <div className="flex-1 relative">
                {!iframeLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-sm text-slate-400">Loading chat interface...</p>
                    </div>
                  </div>
                )}
                <iframe
                  src={`https://${deployment.domain}/chat`}
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                  onLoad={() => setIframeLoaded(true)}
                  onError={() => setIframeError(true)}
                  title="Live Chat"
                />
              </div>
            )}

            {/* Error fallback */}
            {deployment && iframeError && (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-rose-500/20 flex items-center justify-center">
                    <svg className="w-10 h-10 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Could Not Load Chat</h3>
                  <p className="text-slate-400 mb-6">The chat interface failed to load. Your instance may still be starting up.</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setIframeError(false);
                        setIframeLoaded(false);
                      }}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                    >
                      Retry
                    </button>
                    <a
                      href={`https://${deployment.domain}/chat`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white font-medium hover:bg-slate-800 transition-colors"
                    >
                      Open in New Tab
                    </a>
                  </div>
                </div>
              </div>
            )}
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
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
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

            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">Top Topics</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { topic: 'Password Reset', count: 156, trend: '+12%' },
                  { topic: 'Billing Questions', count: 98, trend: '+5%' },
                  { topic: 'Product Info', count: 87, trend: '-3%' },
                  { topic: 'Technical Support', count: 76, trend: '+8%' },
                  { topic: 'Account Settings', count: 54, trend: '+2%' },
                  { topic: 'Shipping Status', count: 43, trend: '-1%' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50">
                    <div>
                      <div className="text-white font-medium">{item.topic}</div>
                      <div className="text-sm text-slate-400">{item.count} conversations</div>
                    </div>
                    <span className={`text-sm ${item.trend.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {item.trend}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
