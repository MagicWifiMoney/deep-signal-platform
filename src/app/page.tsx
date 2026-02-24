'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import TerminalChat from '@/components/TerminalChat';

const AGENT_URL = process.env.NEXT_PUBLIC_ONBOARDING_AGENT_URL ?? '';
const AGENT_TOKEN = process.env.NEXT_PUBLIC_ONBOARDING_AGENT_TOKEN ?? '';

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

      {/* ── Header ──────────────────────────────────────────────────────── */}
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
            Need help?
          </Link>
          <Link
            href="/onboarding"
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <main className="relative z-10 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">

          {/* Condensed headline */}
          <div
            className={`text-center pt-8 pb-6 transition-all duration-1000 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 mb-5 w-fit mx-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-slate-400">AI-powered · Enterprise-ready · Fully managed</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-3 leading-tight">
              <span className="text-white">Your AI Assistant,</span>{' '}
              <span className="gradient-text">Deployed in Minutes</span>
            </h1>

            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-5">
              Enterprise-grade AI agents, dedicated to your business.
              Private instances, zero shared infrastructure, complete control.
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/onboarding"
                className="group px-7 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-base hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
              >
                Start Your Instance
                <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="https://missioncontrol.jgiebz.com"
                className="px-7 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white font-semibold text-base hover:bg-slate-800 transition-colors"
              >
                Mission Control
              </Link>
            </div>
          </div>

          {/* Full-width terminal - the hero experience */}
          <div
            className={`transition-all duration-1000 delay-200 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <div className="text-xs text-slate-600 font-mono mb-2 pl-1">
              // talk to Signal — no signup required
            </div>
            <TerminalChat
              mode="onboarding"
              agentUrl={AGENT_URL}
              agentToken={AGENT_TOKEN}
              className="w-full min-h-[60vh] sm:min-h-[520px]"
            />
          </div>

          {/* Stats row below terminal */}
          <div
            className={`grid grid-cols-3 gap-8 mt-8 mb-4 max-w-lg mx-auto transition-all duration-1000 delay-300 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">$10</div>
              <div className="text-slate-500 text-sm">per month / instance</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">5 min</div>
              <div className="text-slate-500 text-sm">deployment time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">99.9%</div>
              <div className="text-slate-500 text-sm">uptime SLA</div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '🛡️',
              title: 'Dedicated Instances',
              description: 'Your own server, your own data. No shared infrastructure, complete isolation.',
            },
            {
              icon: '⚡',
              title: 'Instant Deployment',
              description: 'From signup to live agent in under 5 minutes. Automated setup, zero DevOps required.',
            },
            {
              icon: '🔐',
              title: 'Enterprise Security',
              description: 'SOC 2 ready architecture, end-to-end encryption, audit logging included.',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="glass rounded-2xl p-6 hover:border-cyan-500/50 transition-colors group"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                {feature.title}
              </h3>
              <p className="text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-slate-800/60 px-6 py-8 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-slate-600 text-sm font-mono">
            Deep Signal Platform · © {new Date().getFullYear()}
          </span>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/support" className="text-slate-500 hover:text-cyan-400 transition-colors font-mono">
              support terminal →
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
