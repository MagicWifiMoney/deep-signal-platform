'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function SlackSuccessContent() {
  const searchParams = useSearchParams();
  const team = searchParams.get('team') || 'your workspace';
  const domain = searchParams.get('domain') || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="flex items-center justify-between p-6 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white">Deep Signal</span>
        </Link>
      </header>

      <main className="max-w-xl mx-auto px-6 py-16 text-center">
        <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-emerald-500 flex items-center justify-center">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">Slack Connected</h1>
        <p className="text-xl text-slate-400 mb-8">
          Your AI agent is now live in <span className="text-white">{team}</span>
        </p>

        <div className="p-6 rounded-xl border border-slate-700 bg-slate-800/30 text-left mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Try it now</h2>
          <p className="text-slate-300 mb-4">
            Mention your agent in any channel where it's been added:
          </p>
          <div className="p-4 rounded-lg bg-slate-900 font-mono text-cyan-400">
            @Deep Signal Agent Hello, how can you help me?
          </div>
        </div>

        <div className="p-6 rounded-xl border border-slate-700 bg-slate-800/30 text-left mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Next steps</h2>
          <ul className="space-y-3 text-slate-300">
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Invite the bot to channels where you want it active</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Customize the agent's personality in your dashboard</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add knowledge bases for domain-specific responses</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="https://slack.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-lg bg-[#4A154B] text-white font-medium hover:bg-[#611f69] transition-colors"
          >
            Open Slack
          </a>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-lg border border-slate-600 text-slate-300 font-medium hover:bg-slate-800 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}


export default function SlackSuccess() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <SlackSuccessContent />
    </Suspense>
  );
}
