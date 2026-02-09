'use client';

import { useState } from 'react';
import Link from 'next/link';

// Mock conversation data
const CONVERSATIONS = [
  {
    id: '1',
    user: 'John Doe',
    channel: 'whatsapp',
    status: 'resolved',
    sentiment: 'positive',
    messages: 8,
    duration: '5 min',
    startedAt: '2 hours ago',
    summary: 'Password reset assistance - resolved successfully',
    messages_preview: [
      { role: 'user', content: 'Hi, I forgot my password' },
      { role: 'assistant', content: 'I can help you reset your password. What email is associated with your account?' },
      { role: 'user', content: 'john@example.com' },
      { role: 'assistant', content: 'I\'ve sent a password reset link to john@example.com. Please check your inbox.' },
    ]
  },
  {
    id: '2',
    user: 'Sarah Miller',
    channel: 'slack',
    status: 'escalated',
    sentiment: 'negative',
    messages: 12,
    duration: '15 min',
    startedAt: '3 hours ago',
    summary: 'Billing dispute - escalated to human support',
    messages_preview: [
      { role: 'user', content: 'I was charged twice for my subscription' },
      { role: 'assistant', content: 'I\'m sorry to hear about the duplicate charge. Let me look into this.' },
      { role: 'user', content: 'This is unacceptable, I want a refund immediately' },
      { role: 'assistant', content: 'I understand your frustration. I\'m escalating this to our billing team who can process refunds.' },
    ]
  },
  {
    id: '3',
    user: 'Mike Chen',
    channel: 'web',
    status: 'resolved',
    sentiment: 'neutral',
    messages: 4,
    duration: '2 min',
    startedAt: '5 hours ago',
    summary: 'Product information inquiry',
    messages_preview: [
      { role: 'user', content: 'What are your business hours?' },
      { role: 'assistant', content: 'We\'re open Monday-Friday, 9 AM to 6 PM EST. Is there anything else I can help with?' },
    ]
  },
  {
    id: '4',
    user: 'Emily Watson',
    channel: 'telegram',
    status: 'active',
    sentiment: 'positive',
    messages: 6,
    duration: '3 min',
    startedAt: 'Just now',
    summary: 'Currently chatting about product features',
    messages_preview: [
      { role: 'user', content: 'Can you tell me about the enterprise plan?' },
      { role: 'assistant', content: 'Our enterprise plan includes unlimited users, priority support, and custom integrations. Would you like more details?' },
    ]
  },
];

export default function Conversations() {
  const [selectedConvo, setSelectedConvo] = useState<typeof CONVERSATIONS[0] | null>(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredConvos = CONVERSATIONS.filter(c => {
    if (filter === 'active') return c.status === 'active';
    if (filter === 'escalated') return c.status === 'escalated';
    if (filter === 'resolved') return c.status === 'resolved';
    return true;
  }).filter(c => 
    search === '' || 
    c.user.toLowerCase().includes(search.toLowerCase()) ||
    c.summary.toLowerCase().includes(search.toLowerCase())
  );

  const getChannelIcon = (channel: string) => {
    const icons: Record<string, string> = {
      whatsapp: '📱',
      slack: '💼',
      telegram: '✈️',
      web: '🌐',
      email: '📧',
    };
    return icons[channel] || '💬';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold text-white">Conversations</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none text-sm"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-label="Search" role="img">🔍</span>
          </div>
          
          <button className="px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors text-sm">
            Export CSV
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar - Conversation List */}
        <aside className="w-full md:w-96 border-r border-slate-800 flex flex-col">
          {/* Filters */}
          <div className="p-4 border-b border-slate-800">
            <div className="flex gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Active' },
                { id: 'escalated', label: 'Escalated' },
                { id: 'resolved', label: 'Resolved' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  aria-label={`Filter conversations: ${f.label}`}
                  aria-pressed={filter === f.id}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    filter === f.id
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConvos.map((convo) => (
              <div
                key={convo.id}
                role="button"
                tabIndex={0}
                aria-label={`Conversation with ${convo.user}: ${convo.summary}`}
                onClick={() => setSelectedConvo(convo)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedConvo(convo); } }}
                className={`p-4 border-b border-slate-800/50 cursor-pointer transition-colors ${
                  selectedConvo?.id === convo.id
                    ? 'bg-cyan-500/10 border-l-2 border-l-cyan-500'
                    : 'hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>{getChannelIcon(convo.channel)}</span>
                    <span className="font-medium text-white">{convo.user}</span>
                  </div>
                  <span className="text-xs text-slate-500">{convo.startedAt}</span>
                </div>
                <p className="text-sm text-slate-400 line-clamp-2 mb-2">{convo.summary}</p>
                <div className="flex items-center gap-3 text-xs">
                  <span className={`px-2 py-0.5 rounded-full ${
                    convo.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                    convo.status === 'escalated' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {convo.status}
                  </span>
                  <span className="text-slate-500">{convo.messages} messages</span>
                  <span className={`w-2 h-2 rounded-full ${
                    convo.sentiment === 'positive' ? 'bg-emerald-400' :
                    convo.sentiment === 'negative' ? 'bg-rose-400' :
                    'bg-slate-400'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main - Conversation Detail */}
        <main className="flex-1 flex flex-col">
          {selectedConvo ? (
            <>
              {/* Conversation Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getChannelIcon(selectedConvo.channel)}</span>
                    <div>
                      <h2 className="text-lg font-semibold text-white">{selectedConvo.user}</h2>
                      <p className="text-sm text-slate-400">{selectedConvo.summary}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    selectedConvo.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                    selectedConvo.status === 'escalated' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {selectedConvo.status}
                  </span>
                  <span className="text-sm text-slate-400">{selectedConvo.duration}</span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedConvo.messages_preview.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[70%] p-4 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-slate-800 text-white'
                        : 'bg-cyan-500/20 text-white border border-cyan-500/30'
                    }`}>
                      <div className="text-xs text-slate-400 mb-1">
                        {msg.role === 'user' ? selectedConvo.user : 'AI Assistant'}
                      </div>
                      <p>{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-slate-800 flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const text = selectedConvo.messages_preview.map((m) => `${m.role}: ${m.content}`).join('\n');
                      navigator.clipboard.writeText(text);
                      alert('Transcript copied to clipboard');
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors text-sm"
                  >
                    Copy Transcript
                  </button>
                  <button
                    onClick={() => {
                      const text = selectedConvo.messages_preview.map((m) => `"${m.role}","${m.content.replace(/"/g, '""')}"`).join('\n');
                      const blob = new Blob([`"Role","Content"\n${text}`], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `conversation-${selectedConvo.id}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors text-sm"
                  >
                    Export CSV
                  </button>
                </div>
                {selectedConvo.status === 'active' && (
                  <button
                    onClick={() => alert('Escalation feature requires Slack/email integration. Coming soon.')}
                    className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors text-sm"
                  >
                    Escalate to Human
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <p>Select a conversation to view details</p>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar - Analytics */}
        <aside className="w-80 border-l border-slate-800 p-6 hidden xl:block">
          <h3 className="font-semibold text-white mb-6">Today's Stats</h3>
          
          <div className="space-y-6">
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Total Conversations</span>
                <span className="text-2xl font-bold text-white">47</span>
              </div>
              <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-cyan-500 rounded-full" />
              </div>
            </div>

            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Resolved</span>
                <span className="text-xl font-bold text-emerald-400">42</span>
              </div>
              <div className="text-sm text-slate-500">89% resolution rate</div>
            </div>

            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Escalated</span>
                <span className="text-xl font-bold text-amber-400">3</span>
              </div>
              <div className="text-sm text-slate-500">6% escalation rate</div>
            </div>

            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Avg Response Time</span>
                <span className="text-xl font-bold text-white">1.2s</span>
              </div>
            </div>

            <div className="glass rounded-xl p-4">
              <div className="text-slate-400 mb-3">Sentiment Breakdown</div>
              <div className="flex gap-2">
                <div className="flex-1 text-center">
                  <div className="text-2xl">😊</div>
                  <div className="text-sm text-emerald-400">68%</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-2xl">😐</div>
                  <div className="text-sm text-slate-400">24%</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-2xl">😞</div>
                  <div className="text-sm text-rose-400">8%</div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
