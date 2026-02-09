'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface UsageData {
  totalResources: {
    vcpu: number;
    ramGB: number;
    diskGB: number;
    instances: number;
  };
  instances: {
    id: number;
    name: string;
    serverType: string;
    resources: {
      vcpu: number;
      ramGB: number;
      diskGB: number;
    };
    status: string;
    uptime: {
      days: number;
      hours: number;
      percent: number;
    };
    datacenter: string;
    createdAt: string;
  }[];
  resourceDistribution: {
    serverType: string;
    count: number;
    totalVCPU: number;
    totalRAM: number;
    totalDisk: number;
  }[];
  timeline: {
    date: string;
    instancesCreated: number;
    instanceCount: number;
  }[];
}

export default function UsageDashboard() {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    try {
      const res = await fetch('/api/usage');
      if (!res.ok) throw new Error('Failed to fetch usage data');
      const data = await res.json();
      setUsageData(data);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load usage data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">📊</div>
          <p className="text-slate-400">Loading usage data...</p>
        </div>
      </div>
    );
  }

  if (error || !usageData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="glass rounded-2xl p-8 max-w-md">
          <div className="text-amber-400 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Connection Issue</h2>
          <p className="text-slate-400 mb-4">{error || 'Unknown error'}</p>
          <button
            onClick={fetchUsageData}
            className="px-4 py-2 rounded-xl bg-cyan-500 text-white hover:bg-cyan-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="https://missioncontrol.jgiebz.com" className="text-slate-400 hover:text-white transition-colors">
                ← Mission Control
              </Link>
              <div className="w-px h-6 bg-slate-700" />
              <h1 className="text-2xl font-bold text-white">Usage Dashboard</h1>
            </div>
            <button
              onClick={fetchUsageData}
              className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700 transition-colors"
              title="Refresh"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Total Resources */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">⚡</span>
              <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400">vCPU</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{usageData.totalResources.vcpu}</div>
            <div className="text-sm text-slate-400">Total vCPU Cores</div>
            <div className="text-xs text-slate-500 mt-2">
              ~{(usageData.totalResources.vcpu / usageData.totalResources.instances).toFixed(1)} avg/instance
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">💾</span>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">RAM</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{usageData.totalResources.ramGB} GB</div>
            <div className="text-sm text-slate-400">Total Memory</div>
            <div className="text-xs text-slate-500 mt-2">
              ~{(usageData.totalResources.ramGB / usageData.totalResources.instances).toFixed(1)} GB avg/instance
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">💿</span>
              <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400">Storage</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{usageData.totalResources.diskGB} GB</div>
            <div className="text-sm text-slate-400">Total Disk Space</div>
            <div className="text-xs text-slate-500 mt-2">
              ~{(usageData.totalResources.diskGB / usageData.totalResources.instances).toFixed(1)} GB avg/instance
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">🖥️</span>
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">Active</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{usageData.totalResources.instances}</div>
            <div className="text-sm text-slate-400">Total Instances</div>
            <div className="text-xs text-slate-500 mt-2">
              {usageData.instances.filter(i => i.status === 'running').length} running
            </div>
          </div>
        </div>

        {/* Resource Distribution by Server Type */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Resource Distribution by Server Type</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {usageData.resourceDistribution.map((dist) => (
              <div key={dist.serverType} className="p-4 rounded-xl bg-slate-800/30">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-lg text-white uppercase">{dist.serverType}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400">
                    {dist.count} instance{dist.count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">vCPU</span>
                    <span className="text-white font-medium">{dist.totalVCPU} cores</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">RAM</span>
                    <span className="text-white font-medium">{dist.totalRAM} GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Disk</span>
                    <span className="text-white font-medium">{dist.totalDisk} GB</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instance Timeline */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Instance Timeline</h2>
          <div className="h-64 flex items-end gap-2">
            {usageData.timeline.map((point, idx) => {
              const maxCount = Math.max(...usageData.timeline.map(p => p.instanceCount));
              const height = (point.instanceCount / maxCount) * 100;
              
              return (
                <div key={idx} className="flex-1 flex flex-col items-center group">
                  <div className="relative w-full">
                    <div
                      className="w-full bg-gradient-to-t from-cyan-500 to-blue-600 rounded-t hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
                      style={{ height: `${height * 2}px` }}
                      title={`${point.date}: ${point.instanceCount} instances (${point.instancesCreated} created)`}
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none">
                      {point.instanceCount} total
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 mt-2 rotate-45 origin-left">
                    {point.date.split('-')[1]}/{point.date.split('-')[2]}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="text-sm text-slate-400 mt-4 text-center">
            Instance count over time (by creation date)
          </div>
        </div>

        {/* Per-Instance Resources */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Per-Instance Resources</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Instance</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">vCPU</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">RAM</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Disk</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Uptime</th>
                </tr>
              </thead>
              <tbody>
                {usageData.instances.map((instance) => (
                  <tr key={instance.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{instance.name}</div>
                      <div className="text-xs text-slate-500">{instance.datacenter}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm text-cyan-400 uppercase">{instance.serverType}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                        instance.status === 'running'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          instance.status === 'running' ? 'bg-emerald-400' : 'bg-slate-400'
                        }`} />
                        {instance.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-white font-medium">{instance.resources.vcpu}</span>
                      <span className="text-xs text-slate-500 ml-1">cores</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-white font-medium">{instance.resources.ramGB}</span>
                      <span className="text-xs text-slate-500 ml-1">GB</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-white font-medium">{instance.resources.diskGB}</span>
                      <span className="text-xs text-slate-500 ml-1">GB</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="text-white font-medium">{instance.uptime.days}d {instance.uptime.hours}h</div>
                      <div className="text-xs text-emerald-400">{instance.uptime.percent}%</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resource Allocation Chart */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Resource Allocation Overview</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* vCPU Distribution */}
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-4">vCPU by Instance</h3>
              <div className="space-y-2">
                {usageData.instances.map((instance) => {
                  const percentage = (instance.resources.vcpu / usageData.totalResources.vcpu) * 100;
                  return (
                    <div key={`cpu-${instance.id}`}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400 truncate">{instance.name}</span>
                        <span className="text-white">{instance.resources.vcpu}</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RAM Distribution */}
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-4">RAM by Instance</h3>
              <div className="space-y-2">
                {usageData.instances.map((instance) => {
                  const percentage = (instance.resources.ramGB / usageData.totalResources.ramGB) * 100;
                  return (
                    <div key={`ram-${instance.id}`}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400 truncate">{instance.name}</span>
                        <span className="text-white">{instance.resources.ramGB} GB</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Disk Distribution */}
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-4">Disk by Instance</h3>
              <div className="space-y-2">
                {usageData.instances.map((instance) => {
                  const percentage = (instance.resources.diskGB / usageData.totalResources.diskGB) * 100;
                  return (
                    <div key={`disk-${instance.id}`}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400 truncate">{instance.name}</span>
                        <span className="text-white">{instance.resources.diskGB} GB</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
