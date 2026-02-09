'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
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

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-6 text-center">
        <div className={`transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-slate-400">AI-powered • Enterprise-ready • Fully managed</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-white">Your AI Assistant,</span>
            <br />
            <span className="gradient-text">Deployed in Minutes</span>
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Enterprise-grade AI agents, dedicated to your business. 
            Private instances, zero shared infrastructure, 
            complete control.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/onboarding"
              className="group px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
            >
              Start Your Instance
              <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link 
              href="/mission-control"
              className="px-8 py-4 rounded-xl bg-slate-800/50 border border-slate-700 text-white font-semibold text-lg hover:bg-slate-800 transition-colors"
            >
              Mission Control
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-8 mt-20 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">$10</div>
            <div className="text-slate-500">per month / instance</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">5 min</div>
            <div className="text-slate-500">deployment time</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">99.9%</div>
            <div className="text-slate-500">uptime SLA</div>
          </div>
        </div>
      </main>

      {/* Features Preview */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '🛡️',
              title: 'Dedicated Instances',
              description: 'Your own server, your own data. No shared infrastructure, complete isolation.'
            },
            {
              icon: '⚡',
              title: 'Instant Deployment',
              description: 'From signup to live agent in under 5 minutes. Automated setup, zero DevOps required.'
            },
            {
              icon: '🔐',
              title: 'Enterprise Security',
              description: 'SOC 2 ready architecture, end-to-end encryption, audit logging included.'
            }
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

      {/* How It Works */}
      <section className="relative z-10 px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            How It Works
          </h2>
          <p className="text-slate-400 text-center max-w-2xl mx-auto mb-16">
            From zero to a fully deployed AI agent in four simple steps.
          </p>

          <div className="flex flex-col md:flex-row items-start gap-8 md:gap-4 relative">
            {/* Horizontal connector line (desktop only) */}
            <div className="hidden md:block absolute top-8 left-[calc(12.5%+16px)] right-[calc(12.5%+16px)] h-px bg-gradient-to-r from-cyan-500/40 via-blue-500/40 to-cyan-500/40" />

            {[
              {
                step: 1,
                title: 'Sign Up',
                description: 'Create your account and tell us about your business',
                icon: (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ),
              },
              {
                step: 2,
                title: 'Configure',
                description: 'Choose your AI model, communication channels, and personality',
                icon: (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
              },
              {
                step: 3,
                title: 'Deploy',
                description: 'We provision a dedicated server with your custom agent in under 5 minutes',
                icon: (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                ),
              },
              {
                step: 4,
                title: 'Connect',
                description: 'Link Slack, WhatsApp, or embed web chat — your agent is live',
                icon: (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                ),
              },
            ].map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center text-center relative">
                {/* Vertical connector line (mobile only) */}
                {i < 3 && (
                  <div className="md:hidden absolute top-16 left-1/2 -translate-x-px h-[calc(100%+2rem)] w-px bg-gradient-to-b from-cyan-500/40 to-blue-500/40" />
                )}

                {/* Step number circle */}
                <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/20">
                  <span className="text-white text-lg font-bold">{item.step}</span>
                </div>

                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-slate-800/80 border border-slate-700/50 flex items-center justify-center mb-3">
                  {item.icon}
                </div>

                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 max-w-[200px]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative z-10 px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-slate-400 text-center max-w-2xl mx-auto mb-16">
            Start small, scale when you need to. No hidden fees.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Starter Tier */}
            <div className="glass rounded-2xl p-8 flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-1">Starter</h3>
                <p className="text-sm text-slate-400">Everything you need to get started</p>
              </div>

              <div className="mb-8">
                <span className="text-5xl font-bold text-white">$10</span>
                <span className="text-slate-400 ml-2">/mo</span>
              </div>

              <ul className="space-y-4 mb-10 flex-1">
                {[
                  '1 dedicated instance',
                  '3 communication channels',
                  'Community support',
                  '10M tokens / month',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <svg className="w-5 h-5 text-cyan-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/onboarding"
                className="block w-full text-center px-6 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium hover:bg-slate-700 transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Enterprise Tier */}
            <div className="glass rounded-2xl p-8 flex flex-col border-cyan-500/50 shadow-lg shadow-cyan-500/10">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-3">
                  <span className="text-xs font-medium text-cyan-400">RECOMMENDED</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-1">Enterprise</h3>
                <p className="text-sm text-slate-400">For teams that need full control</p>
              </div>

              <div className="mb-8">
                <span className="text-5xl font-bold text-white">Custom</span>
              </div>

              <ul className="space-y-4 mb-10 flex-1">
                {[
                  'Unlimited instances',
                  'All communication channels',
                  'Dedicated support',
                  'Custom token limits',
                  'SSO & audit logs',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <svg className="w-5 h-5 text-cyan-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/onboarding"
                className="block w-full text-center px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/50 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: Logo + Copyright */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-sm text-slate-500">&copy; 2026 Deep Signal. All rights reserved.</span>
          </div>

          {/* Center: Links */}
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

          {/* Right: Built with */}
          <span className="text-sm text-slate-600">Built with OpenClaw</span>
        </div>
      </footer>
    </div>
  );
}
