'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface InstanceMetrics {
  id: number;
  name: string;
  status: string;
  serverType: string;
  datacenter: string;
  publicIp: string;
  privateIp: string | null;
  resources: {
    cores: number;
    memory: number;
    disk: number;
  };
  uptime: {
    hours: number;
    days: number;
    since: string;
    percentage: number;
  };
  metrics: {
    cpu: { current: number; avg: number; peak: number };
    memory: { used: number; total: number; percentage: number };
    disk: { used: number; total: number; percentage: number };
    network: { inbound: number; outbound: number };
  } | null;
  health: {
    status: string;
    lastCheck: string;
    checks: Record<string, string>;
  };
}

export default function InstanceDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [metrics, setMetrics] = useState<InstanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);

  // Fetch metrics
  const fetchMetrics = async () => {
    try {
      const res = await fetch(`/api/instances/${resolvedParams.id}/metrics`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setMetrics(data);
      
      // Update CPU history
      if (data.metrics?.cpu) {
        setCpuHistory(prev => [...prev.slice(-29), data.metrics.cpu.current]);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch instance metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading instance metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-slate-400">{error || 'Instance not found'}</p>
          <Link href="/mission-control" className="text-cyan-400 hover:underline mt-4 inline-block">
            ← Back to Mission Control
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Link href="/mission-control" className="text-slate-400 hover:text-white transition-colors">
            ← Mission Control
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">{metrics.name}</h1>
            <p className="text-sm text-slate-400">{metrics.publicIp} • {metrics.datacenter}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm ${
            metrics.status === 'running' 
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-amber-500/20 text-amber-400'
          }`}>
            {metrics.status}
          </span>
          <button className="px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors">
            Restart
          </button>
          <button className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors">
            Stop
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-slate-800">
        <nav className="flex gap-1 p-2 px-6">
          {['overview', 'metrics', 'logs', 'config'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">⚡</span>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {metrics.metrics?.cpu.current.toFixed(1)}%
                    </div>
                    <div className="text-sm text-slate-400">CPU Usage</div>
                  </div>
                </div>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">💾</span>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {metrics.metrics?.memory.percentage.toFixed(0)}%
                    </div>
                    <div className="text-sm text-slate-400">Memory</div>
                  </div>
                </div>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">💿</span>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {metrics.metrics?.disk.percentage.toFixed(0)}%
                    </div>
                    <div className="text-sm text-slate-400">Disk</div>
                  </div>
                </div>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🟢</span>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {metrics.uptime.percentage}%
                    </div>
                    <div className="text-sm text-slate-400">Uptime</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Server Info */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold text-white mb-4">Server Info</h3>
                <div className="space-y-3">
                  {[
                    ['Server Type', metrics.serverType],
                    ['Datacenter', metrics.datacenter],
                    ['Public IP', metrics.publicIp],
                    ['Cores', `${metrics.resources.cores} vCPU`],
                    ['Memory', `${metrics.resources.memory} GB`],
                    ['Disk', `${metrics.resources.disk} GB`],
                    ['Uptime', `${metrics.uptime.days}d ${metrics.uptime.hours % 24}h`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-slate-400">{label}</span>
                      <span className="text-white font-mono">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Health Checks */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold text-white mb-4">Health Checks</h3>
                <div className="space-y-3">
                  {Object.entries(metrics.health.checks).map(([name, status]) => (
                    <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50">
                      <span className="text-white capitalize">{name.replace('_', ' ')}</span>
                      <span className={`px-2 py-1 rounded-lg text-xs ${
                        status === 'running' || status === 'connected' || status === 'ok'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-4">
                  Last check: {new Date(metrics.health.lastCheck).toLocaleTimeString()}
                </p>
              </div>
            </div>

            {/* CPU Chart */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">CPU Usage (Last 5 min)</h3>
              <div className="h-32 flex items-end gap-1">
                {cpuHistory.map((cpu, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-cyan-500/30 to-cyan-500/60 rounded-t transition-all"
                    style={{ height: `${Math.min(cpu, 100)}%` }}
                    title={`${cpu.toFixed(1)}%`}
                  />
                ))}
                {cpuHistory.length === 0 && (
                  <div className="w-full text-center text-slate-500 py-8">
                    Collecting data...
                  </div>
                )}
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>5 min ago</span>
                <span>Now</span>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Tab */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* CPU */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold text-white mb-4">CPU</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-400">Current</span>
                      <span className="text-white">{metrics.metrics?.cpu.current.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all"
                        style={{ width: `${metrics.metrics?.cpu.current}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Average: {metrics.metrics?.cpu.avg.toFixed(1)}%</span>
                    <span className="text-slate-400">Peak: {metrics.metrics?.cpu.peak.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Memory */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold text-white mb-4">Memory</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-400">Used</span>
                      <span className="text-white">
                        {metrics.metrics?.memory.used.toFixed(1)} / {metrics.metrics?.memory.total} GB
                      </span>
                    </div>
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all"
                        style={{ width: `${metrics.metrics?.memory.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Disk */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold text-white mb-4">Disk</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-400">Used</span>
                      <span className="text-white">
                        {metrics.metrics?.disk.used.toFixed(1)} / {metrics.metrics?.disk.total} GB
                      </span>
                    </div>
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all"
                        style={{ width: `${metrics.metrics?.disk.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Network */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold text-white mb-4">Network</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-800/50">
                    <div className="text-2xl font-bold text-white">
                      {metrics.metrics?.network.inbound} KB/s
                    </div>
                    <div className="text-sm text-slate-400">↓ Inbound</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/50">
                    <div className="text-2xl font-bold text-white">
                      {metrics.metrics?.network.outbound} KB/s
                    </div>
                    <div className="text-sm text-slate-400">↑ Outbound</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Recent Logs</h3>
              <button className="text-cyan-400 hover:underline text-sm">Stream Live</button>
            </div>
            <div className="bg-slate-950 rounded-xl p-4 font-mono text-sm h-96 overflow-auto">
              {[
                { time: '02:45:32', level: 'INFO', msg: 'Gateway heartbeat received' },
                { time: '02:45:30', level: 'INFO', msg: 'Session main: token usage 15.2k' },
                { time: '02:45:28', level: 'INFO', msg: 'WhatsApp message processed' },
                { time: '02:45:15', level: 'INFO', msg: 'Model response: 847 tokens' },
                { time: '02:45:12', level: 'INFO', msg: 'Incoming message from +1234567890' },
                { time: '02:44:58', level: 'DEBUG', msg: 'Memory check: 1.2GB/4GB used' },
                { time: '02:44:45', level: 'INFO', msg: 'Cron job completed: health_check' },
                { time: '02:44:30', level: 'INFO', msg: 'Gateway heartbeat received' },
              ].map((log, i) => (
                <div key={i} className="flex gap-4 py-1 hover:bg-slate-800/50 px-2 rounded">
                  <span className="text-slate-500">{log.time}</span>
                  <span className={
                    log.level === 'ERROR' ? 'text-rose-400' :
                    log.level === 'WARN' ? 'text-amber-400' :
                    log.level === 'DEBUG' ? 'text-slate-400' :
                    'text-emerald-400'
                  }>[{log.level}]</span>
                  <span className="text-slate-300">{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Config Tab */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">OpenClaw Configuration</h3>
              <div className="bg-slate-950 rounded-xl p-4 font-mono text-sm overflow-auto">
                <pre className="text-slate-300">{`# OpenClaw Gateway Config
model: anthropic/claude-3-5-haiku
provider: openrouter

channels:
  whatsapp:
    enabled: false
  slack:
    enabled: false
  telegram:
    enabled: false

features:
  memory: true
  tools: true
  cron: true

security:
  rate_limit: 60/min
  max_tokens: 4096
  logging: enabled`}</pre>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors">
                Edit Config
              </button>
              <button className="px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors">
                View Full Config
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
