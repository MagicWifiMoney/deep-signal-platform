'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import TerminalChat from '@/components/TerminalChat';

const AGENT_URL = process.env.NEXT_PUBLIC_ONBOARDING_AGENT_URL ?? '';
const AGENT_TOKEN = process.env.NEXT_PUBLIC_ONBOARDING_AGENT_TOKEN ?? '';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  function scrollToChat() {
    chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

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

      {/* ── Hero + Terminal split ────────────────────────────────────────── */}
      <main className="relative z-10 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-16 min-h-[calc(100vh-120px)]">

            {/* Left: marketing copy */}
            <div
              className={`flex flex-col justify-center flex-1 pt-12 lg:pt-24 transition-all duration-1000 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 mb-8 w-fit">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm text-slate-400">AI-powered · Enterprise-ready · Fully managed</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                <span className="text-white">Your AI Assistant,</span>
                <br />
                <span className="gradient-text">Deployed in Minutes</span>
              </h1>

              <p className="text-xl text-slate-400 max-w-xl mb-10">
                Enterprise-grade AI agents, dedicated to your business.
                Private instances, zero shared infrastructure, complete control.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Link
                  href="/onboarding"
                  className="group px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
                >
                  Start Your Instance
                  <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
                </Link>
                <Link
                  href="https://missioncontrol.jgiebz.com"
                  className="px-8 py-4 rounded-xl bg-slate-800/50 border border-slate-700 text-white font-semibold text-lg hover:bg-slate-800 transition-colors"
                >
                  Mission Control
                </Link>
              </div>

              {/* Stats */}
              <div
                className={`grid grid-cols-3 gap-8 mt-16 transition-all duration-1000 delay-300 ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
              >
                <div>
                  <div className="text-4xl font-bold text-white mb-1">$10</div>
                  <div className="text-slate-500 text-sm">per month / instance</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-white mb-1">5 min</div>
                  <div className="text-slate-500 text-sm">deployment time</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-white mb-1">99.9%</div>
                  <div className="text-slate-500 text-sm">uptime SLA</div>
                </div>
              </div>

              {/* Mobile: scroll-to-chat CTA */}
              <button
                onClick={scrollToChat}
                className="mt-8 lg:hidden flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-mono text-sm"
              >
                <span className="text-emerald-400">&gt;</span> Talk to Signal →
              </button>
            </div>

            {/* Right: Terminal widget (desktop) */}
            <div
              className={`hidden lg:flex flex-col w-[420px] xl:w-[480px] shrink-0 pt-12 transition-all duration-1000 delay-200 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ minHeight: 560 }}
            >
              <div className="text-xs text-slate-600 font-mono mb-2 pl-1">
                // talk to Signal — no signup required
              </div>
              <TerminalChat
                mode="onboarding"
                agentUrl={AGENT_URL}
                agentToken={AGENT_TOKEN}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </main>

      {/* ── Mobile terminal (below fold) ────────────────────────────────── */}
      <div ref={chatRef} className="lg:hidden relative z-10 px-6 pb-16 pt-4">
        <div className="text-xs text-slate-600 font-mono mb-2 pl-1">
          // talk to Signal — no signup required
        </div>
        <TerminalChat
          mode="onboarding"
          agentUrl={AGENT_URL}
          agentToken={AGENT_TOKEN}
          className="h-[520px]"
        />
      </div>

      {/* ── Sticky mobile CTA ───────────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={scrollToChat}
          className="px-5 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-cyan-500/30 hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <span className="font-mono text-emerald-200">&gt;</span>
          Talk to Signal →
        </button>
      </div>

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
