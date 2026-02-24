'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-700/60 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-800/30 transition-colors"
      >
        <span className="font-semibold text-white pr-4">{question}</span>
        <span
          className={`flex-shrink-0 w-6 h-6 rounded-full border border-slate-600 flex items-center justify-center text-slate-400 transition-transform duration-200 ${
            open ? 'rotate-45' : ''
          }`}
        >
          +
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5 text-slate-400 text-sm leading-relaxed border-t border-slate-700/40 pt-4">
          {answer}
        </div>
      )}
    </div>
  );
}

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

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 lg:px-12 py-20 border-t border-slate-800/40">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Up and running in 3 steps
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto">
              No server experience needed. Your agent walks you through the rest.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                emoji: '🧠',
                title: 'Pick your brain',
                description:
                  'Choose your AI model - Claude, GPT-4o, or any OpenRouter model. Or start free with our included tier and upgrade later.',
                color: 'from-cyan-500/20 to-cyan-500/5',
                border: 'border-cyan-500/20',
                dot: 'bg-cyan-400',
              },
              {
                step: '02',
                emoji: '✨',
                title: 'Make it yours',
                description:
                  'Name your agent, pick a personality vibe, add skills, and choose which messaging apps to connect.',
                color: 'from-blue-500/20 to-blue-500/5',
                border: 'border-blue-500/20',
                dot: 'bg-blue-400',
              },
              {
                step: '03',
                emoji: '🚀',
                title: 'Go live',
                description:
                  'Your agent deploys to its own dedicated server in about 2 minutes. You get a unique URL and it is ready to chat.',
                color: 'from-purple-500/20 to-purple-500/5',
                border: 'border-purple-500/20',
                dot: 'bg-purple-400',
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`relative rounded-2xl p-7 border ${item.border} bg-gradient-to-b ${item.color}`}
              >
                <div className={`w-2 h-2 rounded-full ${item.dot} mb-4`} />
                <div className="text-xs font-bold text-slate-600 tracking-widest mb-2">STEP {item.step}</div>
                <div className="text-3xl mb-3">{item.emoji}</div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/onboarding"
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
            >
              Start now - it is free
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── What can your agent do? ─────────────────────────────────────── */}
      <section className="relative z-10 px-6 lg:px-12 py-20 border-t border-slate-800/40">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              What can your agent do?
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto">
              A lot more than answer questions. It acts - and gets better as you teach it.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { emoji: '🔍', title: 'Research anything', desc: 'Searches the web and summarizes results in real-time' },
              { emoji: '📧', title: 'Draft and send emails', desc: 'Composes, proofreads, and sends on your behalf' },
              { emoji: '💻', title: 'Write and run code', desc: 'Generates scripts, runs them, fixes bugs automatically' },
              { emoji: '📊', title: 'Analyze documents', desc: 'Reads PDFs, spreadsheets, and pastes - pulls out what matters' },
              { emoji: '⏰', title: 'Set reminders', desc: 'Scheduled tasks and automations that run while you sleep' },
              { emoji: '🔗', title: 'Connect your apps', desc: 'Slack, Telegram, Discord, WhatsApp - chat where you live' },
              { emoji: '🧠', title: 'Remember context', desc: 'Saves notes and memory across every conversation' },
              { emoji: '🛠️', title: 'Install new skills', desc: 'Add GitHub, Notion, SEO tools, image gen, and 200+ more' },
            ].map((item, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 hover:border-slate-600 hover:bg-slate-800/60 transition-all group"
              >
                <div className="text-2xl mb-3 group-hover:scale-110 transition-transform duration-200">
                  {item.emoji}
                </div>
                <div className="font-semibold text-white text-sm mb-1.5">{item.title}</div>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 lg:px-12 py-20 border-t border-slate-800/40">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Frequently asked
            </h2>
            <p className="text-slate-400">Everything you want to know.</p>
          </div>

          <div className="space-y-3">
            <FAQItem
              question="Is my data private?"
              answer="Yes - completely. Your agent runs on a server that belongs to you. No data is stored on Deep Signal servers. We provision the server and hand you the keys. What you do with it is entirely your business."
            />
            <FAQItem
              question="What AI models can I use?"
              answer="Any of them. Claude (Anthropic), GPT-4o (OpenAI), Gemini (Google), or any of the 290+ models available through OpenRouter. You plug in your own API key so you always pay the provider directly - no markups. You can also start completely free with our included tier and upgrade later from inside your agent."
            />
            <FAQItem
              question="Can I cancel anytime?"
              answer="Yes. There is no Deep Signal subscription. You pay Hetzner directly for the server - about $10 per month. To cancel, just delete the server from the Hetzner console. Done. Your agent will even help you do it if you ask."
            />
            <FAQItem
              question="Do I need technical skills?"
              answer="No. The wizard handles everything - server creation, DNS, SSL, software install. After deploy your agent is live at its own URL and ready to chat. If you want to connect Telegram or Discord, your agent walks you through it step by step."
            />
            <FAQItem
              question="How is this different from ChatGPT or Claude.ai?"
              answer="Three big differences. First, your data stays on your server - not stored in someone else's cloud. Second, your agent can take actions - browse the web, run code, send emails, set reminders. Third, it is programmable - you can give it a personality, add skills, and connect it to your tools."
            />
            <FAQItem
              question="What happens after the 2-minute deploy?"
              answer="Your agent is live at a URL like yourname.ds.jgiebz.com. Open it in any browser, start chatting. Your agent will introduce itself and offer to help you connect channels like Telegram. You can also give it tasks right away - it already knows how to search the web and do research."
            />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 py-20 px-6 text-center border-t border-slate-800/40">
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
