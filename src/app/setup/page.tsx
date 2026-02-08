'use client';

import Link from 'next/link';

const CHANNELS = [
  { 
    id: 'whatsapp', 
    name: 'WhatsApp Business', 
    icon: '📱', 
    desc: 'Connect to WhatsApp Business API',
    difficulty: 'Medium',
    time: '15-20 min',
    popular: true,
  },
  { 
    id: 'slack', 
    name: 'Slack', 
    icon: '💼', 
    desc: 'Add as a Slack workspace app',
    difficulty: 'Easy',
    time: '10 min',
    popular: true,
  },
  { 
    id: 'discord', 
    name: 'Discord', 
    icon: '🎮', 
    desc: 'Create a Discord bot',
    difficulty: 'Easy',
    time: '10 min',
    popular: false,
  },
  { 
    id: 'teams', 
    name: 'Microsoft Teams', 
    icon: '🏢', 
    desc: 'Deploy as a Teams bot via Azure',
    difficulty: 'Advanced',
    time: '30 min',
    popular: false,
  },
  { 
    id: 'telegram', 
    name: 'Telegram', 
    icon: '✈️', 
    desc: 'Create a Telegram bot',
    difficulty: 'Easy',
    time: '5 min',
    popular: true,
  },
  { 
    id: 'email', 
    name: 'Email', 
    icon: '📧', 
    desc: 'Connect to an email inbox',
    difficulty: 'Medium',
    time: '15 min',
    popular: false,
  },
];

export default function ChannelSetupHome() {
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
        
        <Link 
          href="/dashboard"
          className="text-slate-400 hover:text-white transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">💬</div>
          <h1 className="text-3xl font-bold text-white mb-2">Connect a Channel</h1>
          <p className="text-slate-400">Choose how your users will interact with your AI agent</p>
        </div>

        {/* Popular Channels */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">🔥 Popular</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {CHANNELS.filter(c => c.popular).map((channel) => (
              <Link
                key={channel.id}
                href={`/setup/${channel.id}`}
                className="glass rounded-2xl p-6 hover:border-cyan-500/50 transition-all group"
              >
                <div className="text-4xl mb-4">{channel.icon}</div>
                <h3 className="font-semibold text-white mb-1 group-hover:text-cyan-400 transition-colors">
                  {channel.name}
                </h3>
                <p className="text-sm text-slate-400 mb-4">{channel.desc}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-2 py-1 rounded-full ${
                    channel.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' :
                    channel.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-rose-500/20 text-rose-400'
                  }`}>
                    {channel.difficulty}
                  </span>
                  <span className="text-slate-500">⏱️ {channel.time}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* All Channels */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">All Channels</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {CHANNELS.filter(c => !c.popular).map((channel) => (
              <Link
                key={channel.id}
                href={`/setup/${channel.id}`}
                className="glass rounded-xl p-4 hover:border-cyan-500/50 transition-all group flex items-center gap-4"
              >
                <div className="text-3xl">{channel.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                    {channel.name}
                  </h3>
                  <p className="text-sm text-slate-400">{channel.desc}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    channel.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' :
                    channel.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-rose-500/20 text-rose-400'
                  }`}>
                    {channel.difficulty}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Web Chat */}
        <div className="mt-12 glass rounded-2xl p-6 border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🌐</div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1">Web Chat Widget</h3>
              <p className="text-slate-400 mb-4">
                Already enabled! Your instance includes a web chat interface at your dashboard URL.
                Embed it on your website with a simple script tag.
              </p>
              <div className="bg-slate-900 rounded-xl p-4 font-mono text-sm text-cyan-400">
                {`<script src="http://YOUR_IP:3000/widget.js"></script>`}
              </div>
            </div>
          </div>
        </div>

        {/* Help */}
        <div className="text-center mt-12 text-slate-400">
          <p>Need a channel we don't support? <a href="mailto:support@deepsignal.ai" className="text-cyan-400 hover:underline">Let us know</a></p>
        </div>
      </div>
    </div>
  );
}
