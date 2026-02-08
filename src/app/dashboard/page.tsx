'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
// import { UserButton } from '@clerk/nextjs';
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
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [settings, setSettings] = useState(getSettings());
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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

  // Load settings on mount
  useEffect(() => {
    setSettings(getSettings());
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

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
    
    const responses = [
      `I understand you're asking about "${inputMessage.slice(0, 30)}...". Let me help you with that!`,
      `Great question! Based on your input, here's what I can tell you...`,
      `Thanks for reaching out. I'd be happy to assist with your inquiry.`,
      `I've analyzed your request. Here's my recommendation...`,
    ];

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: responses[Math.floor(Math.random() * responses.length)],
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
    setStats(prev => ({ ...prev, messagesToday: prev.messagesToday + 1 }));
  };

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
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Start a conversation</h3>
                  <p className="text-slate-400">Test your AI agent by sending a message</p>
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
                    <p>{msg.content}</p>
                    <div className="text-xs text-slate-500 mt-2">
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 rounded-2xl p-4">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-800">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                >
                  Send
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
