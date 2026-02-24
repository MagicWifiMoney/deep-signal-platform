'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ShareContent() {
  const searchParams = useSearchParams();
  const agentName = searchParams.get('name') || 'Your AI Agent';
  const fromPerson = searchParams.get('from') || 'Someone';
  const agentUrl = searchParams.get('url') || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-6">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-lg w-full text-center">
        {/* Gift icon */}
        <div className="text-6xl mb-6 animate-bounce">🎁</div>

        {/* Headline */}
        <h1 className="text-4xl font-bold text-white mb-4">
          {fromPerson} set up an AI agent for you!
        </h1>
        <p className="text-xl text-slate-400 mb-8">
          Meet <span className="text-cyan-400 font-semibold">{agentName}</span> - your personal AI, running on a dedicated server, ready to help with anything.
        </p>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { emoji: '🔒', text: 'Private server' },
            { emoji: '⚡', text: 'Powered by Claude' },
            { emoji: '🤖', text: 'Always available' },
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700">
              <div className="text-2xl mb-2">{item.emoji}</div>
              <div className="text-sm text-slate-300">{item.text}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        {agentUrl ? (
          <a
            href={agentUrl}
            className="group w-full inline-flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xl hover:shadow-2xl hover:shadow-cyan-500/30 transition-all mb-4"
          >
            Meet {agentName}
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </a>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700 text-slate-400">
            Agent link not found. Ask {fromPerson} to share the correct link.
          </div>
        )}

        <p className="text-sm text-slate-600 mt-4">
          Powered by Deep Signal - deploy your own AI agent at{' '}
          <a href="/" className="text-cyan-600 hover:text-cyan-400 transition-colors">
            deep-signal-platform.vercel.app
          </a>
        </p>
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ShareContent />
    </Suspense>
  );
}
