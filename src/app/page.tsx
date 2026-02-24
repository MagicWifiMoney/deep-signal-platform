'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-x-hidden">
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        />
        <div
          className="absolute -bottom-40 right-1/3 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '2s' }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white">Deep Signal</span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="https://missioncontrol.jgiebz.com" className="text-slate-400 hover:text-white transition-colors">
            Mission Control
          </Link>
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link href="/support" className="text-slate-400 hover:text-white transition-colors">
            Support
          </Link>
          <Link
            href="/onboarding"
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity"
          >
            Deploy Now
          </Link>
        </nav>

        {/* Mobile nav */}
        <Link
          href="/onboarding"
          className="md:hidden px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-sm"
        >
          Deploy
        </Link>
      </header>

      {/* Hero */}
      <main className="relative z-10 px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <div
            className={`text-center pt-16 pb-20 transition-all duration-1000 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/60 border border-slate-700/60 mb-8 mx-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-slate-300">Your AI. Your server. No compromises.</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
              <span className="text-white">Your AI,</span>
              <br />
              <span className="gradient-text">Your Server,</span>
              <br />
              <span className="text-white">Your Rules.</span>
            </h1>

            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Deploy a personal AI agent on your own dedicated server in minutes.
              Private, powerful, and connected to everything you use.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/onboarding"
                className="group w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Deploy Your Agent
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/onboarding?mode=gift"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-300 font-medium text-lg hover:bg-slate-800 hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
              >
                🎁 Set up for someone else
              </Link>
            </div>

            {/* Trust line */}
            <p className="mt-6 text-sm text-slate-600">
              No credit card required to start - deploy in under 5 minutes
            </p>
          </div>

          {/* Feature Cards */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-3 gap-6 pb-24 transition-all duration-1000 delay-200 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            {[
              {
                icon: '🔒',
                title: 'Private',
                subtitle: 'Your own server',
                description:
                  'Your data never leaves your machine. Dedicated infrastructure, zero shared resources, full SSH access.',
                accent: 'from-cyan-500/20 to-cyan-500/5',
                border: 'border-cyan-500/20',
              },
              {
                icon: '⚡',
                title: 'Powerful',
                subtitle: 'Claude, GPT, Gemini',
                description:
                  'Plug in any AI model. Anthropic, OpenAI, OpenRouter - or start free with our included tier.',
                accent: 'from-blue-500/20 to-blue-500/5',
                border: 'border-blue-500/20',
              },
              {
                icon: '🔗',
                title: 'Connected',
                subtitle: 'Slack, Telegram, Discord',
                description:
                  'Meet your agent where you already are. Connects to every messaging platform you use.',
                accent: 'from-purple-500/20 to-purple-500/5',
                border: 'border-purple-500/20',
              },
            ].map((card, i) => (
              <div
                key={i}
                className={`glass rounded-2xl p-7 border ${card.border} bg-gradient-to-b ${card.accent} hover:scale-[1.02] transition-transform duration-200`}
              >
                <div className="text-4xl mb-4">{card.icon}</div>
                <h3 className="text-xl font-bold text-white mb-1">{card.title}</h3>
                <p className="text-sm text-cyan-400/80 font-medium mb-3">{card.subtitle}</p>
                <p className="text-slate-400 text-sm leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Stats bar */}
      <section className="relative z-10 border-t border-slate-800/60 py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-white mb-1">$10</div>
            <div className="text-slate-500 text-sm">per month</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white mb-1">&lt;5 min</div>
            <div className="text-slate-500 text-sm">to deploy</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white mb-1">100%</div>
            <div className="text-slate-500 text-sm">your data</div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 py-20 px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Ready to meet your agent?
        </h2>
        <p className="text-slate-400 mb-8 max-w-lg mx-auto">
          Takes 5 minutes. No technical skills needed. Your AI will help you set up everything else.
        </p>
        <Link
          href="/onboarding"
          className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg hover:shadow-xl hover:shadow-cyan-500/30 transition-all"
        >
          Get Started Free
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/60 px-6 py-8 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-slate-600 text-sm font-mono">
            Deep Signal Platform · {new Date().getFullYear()}
          </span>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/support" className="text-slate-500 hover:text-cyan-400 transition-colors">
              Support
            </Link>
            <Link href="/dashboard" className="text-slate-500 hover:text-white transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
