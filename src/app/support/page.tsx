'use client';

import Link from 'next/link';
import TerminalChat from '@/components/TerminalChat';

const AGENT_URL = process.env.NEXT_PUBLIC_ONBOARDING_AGENT_URL ?? '';
const AGENT_TOKEN = process.env.NEXT_PUBLIC_ONBOARDING_AGENT_TOKEN ?? '';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 lg:px-12 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <span className="text-white font-semibold">Deep Signal Support</span>
            <span className="hidden sm:inline text-slate-600 font-mono text-xs ml-3">
              support@deep-signal:~
            </span>
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm font-mono"
        >
          <span className="text-slate-600">←</span> back to home
        </Link>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-start px-6 py-10 lg:py-16">
        <div className="w-full max-w-3xl flex flex-col gap-4">
          {/* Eyebrow */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-500 text-sm font-mono">connected to knowledge base</span>
          </div>

          {/* Terminal */}
          <TerminalChat
            mode="support"
            agentUrl={AGENT_URL}
            agentToken={AGENT_TOKEN}
            className="h-[600px] lg:h-[680px]"
          />

          {/* Helper links */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 font-mono pt-2">
            <span>having trouble?</span>
            <Link href="mailto:support@deep-signal.app" className="text-cyan-700 hover:text-cyan-400 transition-colors">
              email support →
            </Link>
            <Link href="/onboarding" className="text-cyan-700 hover:text-cyan-400 transition-colors">
              start onboarding →
            </Link>
            <Link href="/dashboard" className="text-cyan-700 hover:text-cyan-400 transition-colors">
              dashboard →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
