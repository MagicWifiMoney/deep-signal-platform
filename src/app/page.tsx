'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';

/* ─── Scroll-reveal wrapper (Intersection Observer, no deps) ─── */
function RevealSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1, rootMargin: '-50px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}>
      {children}
    </div>
  );
}

/* ─── Section IDs for progress dots ─── */
const SECTIONS = [
  { id: 'hero', label: 'Hero' },
  { id: 'vision', label: 'Vision' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'agent-ops', label: 'Agent Ops' },
  { id: 'economics', label: 'Economics' },
  { id: 'faq', label: 'FAQ' },
];

/* ─── FAQ data ─── */
const FAQ_ITEMS = [
  {
    q: 'Why dedicated instances instead of multi-tenant?',
    a: 'Multi-tenant means rebuilding from scratch with an 18-month roadmap before feature parity. Dedicated instances let us ship to paying clients in weeks — leveraging OpenClaw as-is. The agent ops team scales management infinitely without headcount. We can always layer a multi-tenant portal on top later; the instances are the product, the portal is just the interface.',
  },
  {
    q: 'How is security handled?',
    a: 'Secrets pass-through — the portal never stores API keys. They\'re written directly to the client\'s instance and discarded. Per-client SSH keys are revocable. On-prem Mac Mini options mean data never leaves the client\'s building. Every access is audit-logged with full accountability.',
  },
  {
    q: 'What happens with OpenClaw updates?',
    a: 'The agent ops team detects new releases on GitHub, tests on staging first, rolls out to 10% of clients, monitors for 24 hours, and continues in waves — with automatic rollback if issues arise. Enterprise clients can version-pin to stable releases.',
  },
  {
    q: 'What\'s the competitive advantage?',
    a: 'Speed — we can be live with clients before competitors finish reading. Vertical expertise in law firm workflows, PE operations, and accounting practices. A self-managing agent ops infrastructure that\'s genuinely hard to replicate. And once we\'re running a client\'s operations, switching cost is enormous — we become infrastructure, not a vendor.',
  },
];

/* ─── Agent Ops Team data ─── */
const AGENTS = [
  { name: 'Orchestrator', desc: 'Routes, escalates, and tracks everything across the fleet', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' },
  { name: 'OnboardBot', desc: 'Provisions new client instances end-to-end', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
  { name: 'OpsBot', desc: 'Monitors health, auto-heals, restarts downed gateways', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { name: 'SupportBot', desc: 'Answers client questions, makes config changes directly', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { name: 'BillingBot', desc: 'Tracks usage, generates invoices, sends reminders', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
  { name: 'SecurityBot', desc: 'Anomaly detection, vulnerability scanning, access monitoring', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => { setMounted(true); }, []);

  /* ─── Track active section for progress dots ─── */
  const sectionRefs = useRef<Map<string, IntersectionObserverEntry>>(new Map());

  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      sectionRefs.current.set(entry.target.id, entry);
    });
    // Find the topmost visible section
    let best: string | null = null;
    let bestTop = Infinity;
    sectionRefs.current.forEach((entry, id) => {
      if (entry.isIntersecting && entry.boundingClientRect.top < bestTop) {
        bestTop = entry.boundingClientRect.top;
        best = id;
      }
    });
    if (best) setActiveSection(best);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersect, { threshold: 0.15, rootMargin: '-10% 0px -60% 0px' });
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [handleIntersect]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* ─── Progress dots (desktop only) ─── */}
      <div className="hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 z-50 flex-col gap-3">
        {SECTIONS.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            title={label}
            className={`progress-dot ${activeSection === id ? 'active' : ''}`}
          />
        ))}
      </div>

      {/* ─── Header ─── */}
      <header className="relative z-10 flex items-center justify-between p-6 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white">Deep Signal</span>
        </div>
        <nav className="flex flex-wrap items-center gap-4 md:gap-8">
          <Link href="/mission-control" className="text-sm md:text-base text-slate-400 hover:text-white transition-colors">
            Mission Control
          </Link>
          <Link href="/dashboard" className="text-sm md:text-base text-slate-400 hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link href="/onboarding" className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm md:text-base font-medium hover:opacity-90 transition-opacity">
            Get Started
          </Link>
        </nav>
      </header>

      {/* ════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════ */}
      <section id="hero" className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-6 text-center">
        <div className={`transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-slate-400">AI-powered &bull; Enterprise-ready &bull; Fully managed</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-white">AI Agents That</span>
            <br />
            <span className="gradient-text">Run Themselves</span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            A managed service where autonomous AI agents handle your operations &mdash; email, calendar, docs, comms &mdash; while you focus on growth.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/onboarding"
              className="group px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
            >
              Start Your Instance
              <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">&rarr;</span>
            </Link>
            <Link
              href="/mission-control"
              className="px-8 py-4 rounded-xl bg-slate-800/50 border border-slate-700 text-white font-semibold text-lg hover:bg-slate-800 transition-colors"
            >
              Mission Control
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-8 mt-20 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {[
            { value: '$10', label: 'per month / instance' },
            { value: '5 min', label: 'deployment time' },
            { value: '99.9%', label: 'uptime SLA' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl font-bold text-white mb-2">{s.value}</div>
              <div className="text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          01 — THE VISION
      ════════════════════════════════════════════════ */}
      <section id="vision" className="relative z-10 px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <RevealSection>
            <div className="flex items-start gap-6 mb-6">
              <span className="section-number hidden md:block select-none">01</span>
              <div>
                <p className="text-sm font-mono text-cyan-400 tracking-widest uppercase mb-3">The Vision</p>
                <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                  What if you had an employee who never sleeps?
                </h2>
              </div>
            </div>
          </RevealSection>

          <RevealSection>
            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              Not a chatbot. Not a workflow. An actual AI agent that handles <span className="text-white font-medium">email triage, calendar management, document processing, and client communications</span> &mdash; autonomously.
            </p>
            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              The agent learns your preferences. Remembers context from three weeks ago. Messages you first with morning briefings and action items. Handles the 80% of operational work that&rsquo;s predictable, so you can focus on the 20% that actually requires human judgment.
            </p>
          </RevealSection>

          <RevealSection>
            <div className="mind-reader">
              <p className="text-slate-400 italic mb-2">&ldquo;This sounds great, but why wouldn&rsquo;t I just use ChatGPT directly?&rdquo;</p>
              <p className="text-slate-300">
                Because a chat window doesn&rsquo;t <em>do</em> things. It doesn&rsquo;t monitor your inbox at 3 AM, send follow-ups on your behalf, or brief you before your 9 AM meeting. The gap between &ldquo;this AI is amazing&rdquo; and &ldquo;this AI is running my ops&rdquo; is exactly what Deep Signal bridges.
              </p>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          02 — HOW IT WORKS
      ════════════════════════════════════════════════ */}
      <section id="how-it-works" className="relative z-10 px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <RevealSection>
            <div className="flex items-start gap-6 mb-12">
              <span className="section-number hidden md:block select-none">02</span>
              <div>
                <p className="text-sm font-mono text-cyan-400 tracking-widest uppercase mb-3">How It Works</p>
                <h2 className="text-3xl md:text-4xl font-bold text-white">The Architecture</h2>
              </div>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              {
                title: 'Customer Portal',
                desc: 'A simple web dashboard where you manage your agent — personality settings, skills, API keys, usage stats. No technical knowledge required. Log in, see your agent, stay in control.',
                icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
              },
              {
                title: 'Dedicated Infrastructure',
                desc: 'Each client gets their own OpenClaw instance. Not multi-tenant. Not shared resources. Your server, your data, your agent. Full isolation.',
                icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01',
              },
              {
                title: 'Self-Managing Agents',
                desc: 'Behind the scenes, our own AI agents monitor every client instance. Health checks, auto-healing, usage tracking, support — all handled autonomously.',
                icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
              },
            ].map((card, i) => (
              <RevealSection key={i}>
                <div className="glass rounded-2xl p-6 h-full hover:border-cyan-500/50 transition-colors group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={card.icon} />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">{card.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>

          <RevealSection className="text-center">
            <Link href="/onboarding" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity">
              Start Your Instance <span>&rarr;</span>
            </Link>
          </RevealSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          03 — INFRASTRUCTURE OPTIONS
      ════════════════════════════════════════════════ */}
      <section id="infrastructure" className="relative z-10 px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <RevealSection>
            <div className="flex items-start gap-6 mb-12">
              <span className="section-number hidden md:block select-none">03</span>
              <div>
                <p className="text-sm font-mono text-cyan-400 tracking-widest uppercase mb-3">Infrastructure</p>
                <h2 className="text-3xl md:text-4xl font-bold text-white">Hardware Options</h2>
              </div>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                title: 'Mac Mini',
                tag: 'RECOMMENDED',
                price: 'From $3,000/mo',
                points: ['Data never leaves your building', 'Run local AI models (Ollama)', 'Ultimate compliance story', 'Apple Silicon performance'],
                best: 'Law firms, PE shops, healthcare — strict data compliance',
                icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7',
              },
              {
                title: 'Cloud VPS',
                tag: null,
                price: 'From $2,000/mo',
                points: ['Instant provisioning', 'No hardware logistics', 'Easy to scale resources', 'Automatic backups'],
                best: 'SMBs, agencies, startups — convenience over on-prem',
                icon: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z',
              },
              {
                title: 'Raspberry Pi',
                tag: null,
                price: 'From $1,500/mo',
                points: ['Extremely low hardware cost', 'Tiny physical footprint', 'Still dedicated hardware', 'Great for simple use cases'],
                best: 'Budget-conscious with straightforward needs',
                icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
              },
            ].map((card, i) => (
              <RevealSection key={i}>
                <div className={`glass rounded-2xl p-6 h-full flex flex-col ${card.tag ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/10' : ''}`}>
                  {card.tag && (
                    <div className="inline-flex self-start items-center px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-3">
                      <span className="text-xs font-medium text-cyan-400">{card.tag}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-1">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={card.icon} />
                    </svg>
                    <h3 className="text-xl font-semibold text-white">{card.title}</h3>
                  </div>
                  <p className="text-2xl font-bold text-white mb-4">{card.price}</p>
                  <ul className="space-y-2 mb-6 flex-1">
                    {card.points.map((p, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-slate-300">
                        <svg className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {p}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-slate-500 border-t border-slate-800 pt-3">Best for: {card.best}</p>
                </div>
              </RevealSection>
            ))}
          </div>

          {/* Comparison table */}
          <RevealSection>
            <div className="glass rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left p-4 text-slate-400 font-medium">Feature</th>
                      <th className="text-center p-4 text-white font-medium">Mac Mini</th>
                      <th className="text-center p-4 text-white font-medium">Cloud VPS</th>
                      <th className="text-center p-4 text-white font-medium">Raspberry Pi</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    {[
                      { feature: 'Local AI Models', mac: true, cloud: false, pi: false },
                      { feature: 'Data Location', mac: 'Client building', cloud: 'Cloud (your choice)', pi: 'Client building' },
                      { feature: 'Setup Time', mac: '1-2 weeks', cloud: 'Same day', pi: '2-3 days' },
                      { feature: 'Monthly Infra Cost', mac: '$0 (owned)', cloud: '$10-50', pi: '$0 (owned)' },
                      { feature: 'Target Price Point', mac: '$3,000/mo', cloud: '$2,000/mo', pi: '$1,500/mo' },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-slate-800/50">
                        <td className="p-4 text-slate-400">{row.feature}</td>
                        {(['mac', 'cloud', 'pi'] as const).map((key) => {
                          const val = row[key];
                          return (
                            <td key={key} className="text-center p-4">
                              {typeof val === 'boolean'
                                ? val
                                  ? <span className="text-cyan-400">&#10003;</span>
                                  : <span className="text-slate-600">&mdash;</span>
                                : val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          04 — AGENT OPS TEAM
      ════════════════════════════════════════════════ */}
      <section id="agent-ops" className="relative z-10 px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <RevealSection>
            <div className="flex items-start gap-6 mb-4">
              <span className="section-number hidden md:block select-none">04</span>
              <div>
                <p className="text-sm font-mono text-cyan-400 tracking-widest uppercase mb-3">The Secret Weapon</p>
                <h2 className="text-3xl md:text-4xl font-bold text-white">The Agent Ops Team</h2>
              </div>
            </div>
            <p className="text-lg text-slate-300 max-w-3xl mb-12">
              The product we sell to clients &mdash; autonomous AI agents that handle operations &mdash; is the same thing we use to run the business. We built an agent team that manages all client agents.
            </p>
          </RevealSection>

          {/* 6-card grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {AGENTS.map((agent, i) => (
              <RevealSection key={i}>
                <div className="glass rounded-xl p-5 hover:border-cyan-500/30 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={agent.icon} />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-white">{agent.name}</h3>
                  </div>
                  <p className="text-sm text-slate-400">{agent.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>

          {/* What they handle / When humans step in */}
          <div className="grid md:grid-cols-2 gap-6">
            <RevealSection>
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  What They Handle (~95%)
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  {[
                    'Health checks every 5 minutes across all instances',
                    'Automatic restart when a gateway goes down',
                    'Client questions answered or config changes made directly',
                    'Usage tracking and automatic invoice generation',
                    'Anomaly detection and security monitoring',
                    'Staged rollout of OpenClaw updates across fleet',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">&#8226;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealSection>

            <RevealSection>
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  When Humans Step In (~5%)
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  {[
                    '3 restart attempts failed — needs investigation',
                    'Client requests custom skill development',
                    'Payment 14+ days overdue after automated reminders',
                    'Security breach detected',
                    'Breaking change requires client notification',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-400 mt-1">&#8226;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          05 — THE ECONOMICS
      ════════════════════════════════════════════════ */}
      <section id="economics" className="relative z-10 px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <RevealSection>
            <div className="flex items-start gap-6 mb-12">
              <span className="section-number hidden md:block select-none">05</span>
              <div>
                <p className="text-sm font-mono text-cyan-400 tracking-widest uppercase mb-3">The Economics</p>
                <h2 className="text-3xl md:text-4xl font-bold text-white">Unit Economics at Scale</h2>
                <p className="text-slate-400 mt-2">Conservative estimates. Real numbers. Verified costs.</p>
              </div>
            </div>
          </RevealSection>

          {/* Key metrics */}
          <RevealSection>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { value: '15', label: 'Clients' },
                { value: '$35K', label: 'Monthly Revenue' },
                { value: '96.6%', label: 'Gross Margin' },
                { value: '$410K', label: 'Annual Profit' },
              ].map((m, i) => (
                <div key={i} className="glass rounded-xl p-4 text-center">
                  <div className="text-2xl md:text-3xl font-bold text-white">{m.value}</div>
                  <div className="text-xs text-slate-500 mt-1">{m.label}</div>
                </div>
              ))}
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Revenue */}
            <RevealSection>
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Revenue (Monthly)</h3>
                <div className="space-y-0">
                  <div className="cost-row">
                    <span className="text-slate-300 text-sm">5&times; Enterprise @ $3,000</span>
                    <span className="text-white font-mono">$15,000</span>
                  </div>
                  <div className="cost-row">
                    <span className="text-slate-300 text-sm">10&times; SMB @ $2,000</span>
                    <span className="text-white font-mono">$20,000</span>
                  </div>
                  <div className="flex justify-between items-center pt-3">
                    <span className="text-white font-semibold">Total</span>
                    <span className="text-cyan-400 font-mono font-bold text-lg">$35,000</span>
                  </div>
                </div>
              </div>
            </RevealSection>

            {/* Costs */}
            <RevealSection>
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Costs (Monthly)</h3>
                <div className="space-y-0">
                  {[
                    { label: 'VPS Hosting (10 × $15 avg)', amount: '$150' },
                    { label: 'Claude API (~$65/client)', amount: '$1,000' },
                    { label: 'Agent Ops Team', amount: '$25' },
                    { label: 'Monitoring (Uptime)', amount: '$10' },
                  ].map((row, i) => (
                    <div key={i} className="cost-row">
                      <span className="text-slate-300 text-sm">{row.label}</span>
                      <span className="text-white font-mono">{row.amount}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-3">
                    <span className="text-white font-semibold">Total</span>
                    <span className="text-emerald-400 font-mono font-bold text-lg">$1,185</span>
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>

          {/* Bottom-line */}
          <RevealSection className="mt-6">
            <div className="glass rounded-2xl p-6 text-center border-cyan-500/30">
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">$33,815 <span className="text-slate-500 text-lg font-normal">/ month profit</span></div>
              <p className="text-cyan-400 font-mono">96.6% gross margin &bull; $405K annual run rate</p>
            </div>
          </RevealSection>

          <RevealSection>
            <div className="mind-reader mt-8">
              <p className="text-slate-400 italic mb-2">&ldquo;What about implementation fees?&rdquo;</p>
              <p className="text-slate-300 text-sm">
                Not included above: $10-20K one-time implementation fees per client (pure profit), hardware markup on Mac Mini purchases, custom skill development (hourly/project), and enterprise SLA upgrades.
              </p>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          06 — COMMON QUESTIONS (FAQ)
      ════════════════════════════════════════════════ */}
      <section id="faq" className="relative z-10 px-6 py-24">
        <div className="max-w-3xl mx-auto">
          <RevealSection>
            <div className="flex items-start gap-6 mb-12">
              <span className="section-number hidden md:block select-none">06</span>
              <div>
                <p className="text-sm font-mono text-cyan-400 tracking-widest uppercase mb-3">Common Questions</p>
                <h2 className="text-3xl md:text-4xl font-bold text-white">Everything You Need to Know</h2>
              </div>
            </div>
          </RevealSection>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <RevealSection key={i}>
                <div className="glass rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="text-white font-medium pr-4">{item.q}</span>
                    <svg
                      className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-96' : 'max-h-0'}`}
                  >
                    <p className="px-5 pb-5 text-sm text-slate-400 leading-relaxed">{item.a}</p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════════════ */}
      <section className="relative z-10 px-6 py-24">
        <RevealSection className="text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Ready to Deploy Your Agent?
            </h2>
            <p className="text-lg text-slate-400 mb-10">
              The market is ready. The tech exists. The economics work. Get your dedicated AI agent running in under 5 minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/onboarding"
                className="group px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
              >
                Start Your Instance
                <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">&rarr;</span>
              </Link>
              <Link
                href="/mission-control"
                className="px-8 py-4 rounded-xl bg-slate-800/50 border border-slate-700 text-white font-semibold text-lg hover:bg-slate-800 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </RevealSection>
      </section>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 border-t border-slate-800/50 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-sm text-slate-500">&copy; 2026 Deep Signal. All rights reserved.</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/mission-control" className="text-sm text-slate-400 hover:text-white transition-colors">
              Mission Control
            </Link>
            <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/docs" className="text-sm text-slate-400 hover:text-white transition-colors">
              Documentation
            </Link>
          </nav>
          <span className="text-sm text-slate-600">Built with OpenClaw</span>
        </div>
      </footer>
    </div>
  );
}
