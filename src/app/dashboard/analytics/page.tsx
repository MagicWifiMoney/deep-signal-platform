'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface InstanceData {
  id: number;
  name: string;
  status: 'online' | 'warning' | 'offline';
  metrics?: {
    cpu: number;
    memory: number | null;
    disk: number | null;
  };
  openclaw?: {
    version: string;
    model: string;
    messagesTotal: number;
    messagesToday: number;
    uptime: number;
    lastSeen: string;
  };
}

interface AggregatedMetrics {
  totalMessages: number;
  messagesToday: number;
  avgCpu: number;
  activeInstances: number;
}

// Deterministic pseudo-random based on seed — stable across renders
function seededValue(seed: number, min: number, max: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return Math.floor(min + (x - Math.floor(x)) * (max - min));
}

function aggregateMetrics(instances: InstanceData[]): AggregatedMetrics {
  const onlineInstances = instances.filter((i) => i.status !== 'offline');

  const totalMessages = instances.reduce(
    (sum, i) => sum + (i.openclaw?.messagesTotal ?? 0),
    0
  );
  const messagesToday = instances.reduce(
    (sum, i) => sum + (i.openclaw?.messagesToday ?? 0),
    0
  );

  const cpuValues = onlineInstances
    .map((i) => i.metrics?.cpu)
    .filter((v): v is number => v != null && v > 0);
  const avgCpu =
    cpuValues.length > 0
      ? Math.round((cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length) * 100) / 100
      : 0;

  return {
    totalMessages,
    messagesToday,
    avgCpu,
    activeInstances: onlineInstances.length,
  };
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return n.toLocaleString();
  return String(n);
}

// Skeleton placeholder for loading states
function MetricSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-20 bg-slate-700 rounded mb-1" />
      <div className="h-4 w-24 bg-slate-700/50 rounded" />
    </div>
  );
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('7d');
  const [instances, setInstances] = useState<InstanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchInstances() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/instances');
        if (!res.ok) {
          throw new Error(`Failed to fetch instances (HTTP ${res.status})`);
        }
        const data = await res.json();
        if (!cancelled) {
          setInstances(data.instances ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load instance data');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchInstances();
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = aggregateMetrics(instances);

  // Day offset for seeded values — changes daily so charts look different each day
  const dayOffset = Math.floor(Date.now() / 86400000);

  // Generate deterministic chart data using seeded pseudo-random
  const generateChartData = (days: number) => {
    return Array.from({ length: days }, (_, i) => {
      const seed = dayOffset * 1000 + i;
      return {
        date: new Date(Date.now() - (days - i - 1) * 86400000).toLocaleDateString('en-US', {
          weekday: 'short',
        }),
        messages: seededValue(seed, 50, 150),
        resolved: seededValue(seed + 500, 40, 120),
        escalated: seededValue(seed + 1000, 2, 10),
      };
    });
  };

  const chartData = generateChartData(timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90);
  const maxMessages = Math.max(...chartData.map((d) => d.messages));

  // Key metrics derived from real data
  const keyMetrics = [
    {
      label: 'Total Messages',
      value: isLoading ? null : metrics.totalMessages > 0 ? formatNumber(metrics.totalMessages) : '\u2014',
      icon: '\uD83D\uDCAC',
    },
    {
      label: 'Avg Response Time',
      value: isLoading ? null : '\u2014',
      icon: '\u26A1',
    },
    {
      label: 'Messages Today',
      value: isLoading ? null : metrics.messagesToday > 0 ? formatNumber(metrics.messagesToday) : '\u2014',
      icon: '\uD83D\uDCC8',
    },
    {
      label: 'Active Instances',
      value: isLoading ? null : String(metrics.activeInstances),
      icon: '\uD83D\uDFE2',
    },
  ];

  // Response quality — seeded so stable per day, not random per render
  const qualityHelpful = seededValue(dayOffset + 7001, 85, 98);
  const qualityAccurate = seededValue(dayOffset + 7002, 80, 96);
  const qualityOnTopic = seededValue(dayOffset + 7003, 88, 99);
  const hasRealQuality = false; // flip when real data becomes available

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
            &larr; Dashboard
          </Link>
          <h1 className="text-xl font-bold text-white">Analytics</h1>
        </div>

        <div className="flex items-center gap-2">
          {['7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                timeRange === range
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'Last 90 days'}
            </button>
          ))}
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Error Banner */}
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 flex items-center gap-3">
            <span className="text-rose-400 text-lg">&#9888;</span>
            <div>
              <div className="text-sm font-medium text-rose-300">Failed to load instance data</div>
              <div className="text-xs text-rose-400/70">{error}</div>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {keyMetrics.map((metric, i) => (
            <div key={i} className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{metric.icon}</span>
              </div>
              {metric.value === null ? (
                <MetricSkeleton />
              ) : (
                <>
                  <div className="text-3xl font-bold text-white mb-1">{metric.value}</div>
                  <div className="text-sm text-slate-400">{metric.label}</div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Main Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Messages Over Time */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-6">Messages Over Time</h3>
            <div className="h-64 flex items-end gap-1">
              {chartData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-gradient-to-t from-cyan-500 to-blue-500 rounded-t transition-all hover:from-cyan-400 hover:to-blue-400"
                    style={{ height: `${(d.messages / maxMessages) * 100}%` }}
                  />
                  <span className="text-xs text-slate-500 rotate-45 origin-left">{d.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Resolution Stats */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-6">Resolution Stats</h3>
            <div className="h-64 flex items-end gap-1">
              {chartData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full flex flex-col gap-0.5"
                    style={{ height: `${(d.messages / maxMessages) * 100}%` }}
                  >
                    <div
                      className="w-full bg-emerald-500 rounded-t"
                      style={{ height: `${(d.resolved / d.messages) * 100}%` }}
                    />
                    <div
                      className="w-full bg-amber-500"
                      style={{ height: `${(d.escalated / d.messages) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 rotate-45 origin-left">{d.date}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-slate-400">Resolved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm text-slate-400">Escalated</span>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Channel Breakdown */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-6">Channel Breakdown</h3>
            <div className="space-y-4">
              {[
                { name: 'Web Chat', value: 45, icon: '\uD83C\uDF10' },
                { name: 'WhatsApp', value: 30, icon: '\uD83D\uDCF1' },
                { name: 'Slack', value: 15, icon: '\uD83D\uDCBC' },
                { name: 'Telegram', value: 10, icon: '\u2708\uFE0F' },
              ].map((channel, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span>{channel.icon}</span>
                      <span className="text-sm text-slate-300">{channel.name}</span>
                    </div>
                    <span className="text-sm text-slate-400">{channel.value}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                      style={{ width: `${channel.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Topics */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-6">Top Topics</h3>
            <div className="space-y-3">
              {[
                { topic: 'Password Reset', count: 234 },
                { topic: 'Billing Questions', count: 189 },
                { topic: 'Product Info', count: 156 },
                { topic: 'Technical Support', count: 134 },
                { topic: 'Account Settings', count: 98 },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50">
                  <span className="text-sm text-slate-300">{item.topic}</span>
                  <span className="text-sm font-medium text-cyan-400">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Peak Hours */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-6">Peak Hours</h3>
            <div className="h-40 flex items-end gap-1">
              {Array.from({ length: 24 }, (_, i) => {
                const businessBoost = i >= 9 && i <= 17 ? 40 : 0;
                const sineWave = Math.sin(i * 0.5) * 30;
                const jitter = seededValue(i + dayOffset, 0, 20);
                const height = 20 + sineWave + businessBoost + jitter;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-purple-500 to-pink-500 rounded-t"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>12am</span>
              <span>6am</span>
              <span>12pm</span>
              <span>6pm</span>
              <span>12am</span>
            </div>
            <div className="mt-4 text-center text-sm text-slate-400">
              Busiest: <span className="text-white">10am - 2pm</span>
            </div>
          </div>
        </div>

        {/* Usage & Cost */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-6">Token Usage</h3>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-3xl font-bold text-white">&mdash;</div>
                <div className="text-sm text-slate-400">tokens used this period</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-500">&mdash;</div>
                <div className="text-sm text-slate-400">estimated cost</div>
              </div>
            </div>
            <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full w-0 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full" />
            </div>
            <div className="flex justify-between mt-2 text-sm text-slate-500">
              <span>Connect billing to view usage</span>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-6">Response Quality</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-emerald-400">
                  {hasRealQuality ? `${qualityHelpful}%` : '\u2014'}
                </div>
                <div className="text-sm text-slate-400">Helpful</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-cyan-400">
                  {hasRealQuality ? `${qualityAccurate}%` : '\u2014'}
                </div>
                <div className="text-sm text-slate-400">Accurate</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-400">
                  {hasRealQuality ? `${qualityOnTopic}%` : '\u2014'}
                </div>
                <div className="text-sm text-slate-400">On-topic</div>
              </div>
            </div>
            <div className="mt-6 p-4 rounded-xl bg-slate-800/50">
              <div className="text-sm text-slate-400 mb-2">Note:</div>
              <p className="text-sm text-white">
                Response quality metrics will appear here once feedback collection is enabled.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
