'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Instance {
  id: number;
  hostname: string;
  ip: string;
  domain: string;
  status: string;
  gatewayToken: string;
  createdAt?: string;
}

interface Stats {
  totalInstances: number;
  onlineInstances: number;
  totalMonthlyCost: number;
}

// ─── Iframe view when domain+token are present ────────────────────────────────

function IframeView({ domain, token }: { domain: string; token: string }) {
  const dashUrl = `https://${domain}/#token=${token}`;

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      {/* Thin header bar */}
      <header className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-white">Deep Signal</span>
          <span className="text-slate-600">|</span>
          <span className="text-xs text-slate-400 font-mono truncate max-w-[200px] hidden sm:block">{domain}</span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={dashUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open Direct
          </a>
          <Link
            href="/dashboard"
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            ← Back to Platform
          </Link>
        </div>
      </header>

      {/* Full-page iframe */}
      <iframe
        src={dashUrl}
        className="flex-1 w-full border-0"
        title={`OpenClaw Dashboard - ${domain}`}
        allow="clipboard-write"
      />
    </div>
  );
}

// ─── Overview dashboard when no instance params ───────────────────────────────

function OverviewDashboard() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [stats, setStats] = useState<Stats>({ totalInstances: 0, onlineInstances: 0, totalMonthlyCost: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [instRes, billRes] = await Promise.all([
          fetch('/api/instances'),
          fetch('/api/billing'),
        ]);
        const instData = await instRes.json();
        const billData = await billRes.json();
        const list: Instance[] = instData.instances || [];
        const onlineCount = list.filter((i) => i.status === 'online' || i.status === 'running').length;
        setInstances(list);
        setStats({
          totalInstances: list.length,
          onlineInstances: onlineCount,
          totalMonthlyCost: billData.totalMonthlyCost || list.length * 10.59,
        });
      } catch {
        // Use empty state
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white">Deep Signal</span>
        </Link>

        <Link
          href="/onboarding"
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-sm hover:opacity-90 transition-opacity"
        >
          + Deploy Instance
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Total Instances', value: loading ? '...' : stats.totalInstances, icon: '🖥️', detail: `${stats.onlineInstances} online` },
            { label: 'Monthly Cost', value: loading ? '...' : `$${stats.totalMonthlyCost.toFixed(2)}`, icon: '💰', detail: 'Infrastructure' },
            { label: 'Status', value: stats.onlineInstances > 0 ? 'Online' : 'No Instances', icon: '🟢', detail: stats.totalInstances > 0 ? 'All systems operational' : 'Deploy your first agent' },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl bg-slate-800/50 border border-slate-700 p-6">
              <div className="text-3xl mb-3">{s.icon}</div>
              <div className="text-2xl font-bold text-white mb-1">{s.value}</div>
              <div className="text-sm text-slate-400">{s.label}</div>
              <div className="text-xs text-slate-500 mt-1">{s.detail}</div>
            </div>
          ))}
        </div>

        {/* Instances list */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Your Instances</h2>

          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && instances.length === 0 && (
            <div className="rounded-2xl border border-slate-700 bg-slate-800/30 p-12 text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-lg font-semibold text-white mb-2">No instances yet</h3>
              <p className="text-slate-400 mb-6">Deploy your first AI agent in under 5 minutes.</p>
              <Link
                href="/onboarding"
                className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity"
              >
                Deploy Instance →
              </Link>
            </div>
          )}

          {!loading && instances.length > 0 && (
            <div className="space-y-3">
              {instances.map((inst) => (
                <div
                  key={inst.id}
                  className="rounded-xl border border-slate-700 bg-slate-800/30 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-white truncate">{inst.hostname || inst.domain}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5 truncate">{inst.domain} · {inst.ip}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
                      inst.status === 'running' || inst.status === 'online'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-700 text-slate-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        inst.status === 'running' || inst.status === 'online'
                          ? 'bg-emerald-400 animate-pulse'
                          : 'bg-slate-500'
                      }`} />
                      {inst.status}
                    </span>

                    <a
                      href={inst.gatewayToken
                        ? `https://${inst.domain}/#token=${inst.gatewayToken}`
                        : `https://${inst.domain}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 min-h-[44px] flex items-center rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 transition-colors"
                    >
                      Open Dashboard →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help */}
        <div className="mt-10 p-6 rounded-xl border border-slate-700 bg-slate-800/20">
          <h3 className="font-semibold text-white mb-2">💡 How to access your dashboard</h3>
          <p className="text-sm text-slate-400">
            Each instance runs the OpenClaw web UI at its domain. Click "Open Dashboard" to access it directly.
            The URL format is: <code className="text-cyan-400 text-xs">https://your-instance.ds.jgiebz.com/#token=ds-xxxxx</code>
          </p>
        </div>
      </main>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

function DashboardContent() {
  const searchParams = useSearchParams();
  const domain = searchParams.get('domain') || '';
  const token = searchParams.get('token') || '';

  if (domain && token) {
    return <IframeView domain={domain} token={token} />;
  }

  return <OverviewDashboard />;
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
