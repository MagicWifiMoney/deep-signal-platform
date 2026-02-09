'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface BillingData {
  totalMonthlyCost: number;
  currency: string;
  instances: {
    id: number;
    name: string;
    serverType: string;
    monthlyCost: number;
    hourlyRate: number;
    client: string;
    datacenter: string;
    createdAt: string;
    daysRunning: number;
    projectedMonthlyCost: number;
  }[];
  byClient: {
    client: string;
    instanceCount: number;
    monthlyCost: number;
  }[];
  summary: {
    totalInstances: number;
    totalMonthlyCost: number;
    avgCostPerInstance: number;
    mostExpensiveInstance: string;
    cheapestInstance: string;
  };
}

export default function BillingDashboard() {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const res = await fetch('/api/billing');
      if (!res.ok) throw new Error('Failed to fetch billing data');
      const data = await res.json();
      setBillingData(data);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load billing data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">💰</div>
          <p className="text-slate-400">Loading billing data...</p>
        </div>
      </div>
    );
  }

  if (error || !billingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="glass rounded-2xl p-8 max-w-md">
          <div className="text-amber-400 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Connection Issue</h2>
          <p className="text-slate-400 mb-4">{error || 'Unknown error'}</p>
          <button
            onClick={fetchBillingData}
            className="px-4 py-2 rounded-xl bg-cyan-500 text-white hover:bg-cyan-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const projectedAnnualCost = billingData.totalMonthlyCost * 12;
  const avgDailyCost = billingData.totalMonthlyCost / 30;

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
              <h1 className="text-2xl font-bold text-white">Billing Dashboard</h1>
            </div>
            <button
              onClick={fetchBillingData}
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
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">💰</span>
              <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400">Monthly</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              ${billingData.totalMonthlyCost.toFixed(2)}
            </div>
            <div className="text-sm text-slate-400">Total Monthly Cost</div>
            <div className="text-xs text-slate-500 mt-2">≈ ${avgDailyCost.toFixed(2)}/day</div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">📅</span>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">Annual</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              ${projectedAnnualCost.toFixed(2)}
            </div>
            <div className="text-sm text-slate-400">Projected Annual Cost</div>
            <div className="text-xs text-slate-500 mt-2">Based on current fleet</div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">🖥️</span>
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">Active</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {billingData.summary.totalInstances}
            </div>
            <div className="text-sm text-slate-400">Total Instances</div>
            <div className="text-xs text-slate-500 mt-2">
              ${billingData.summary.avgCostPerInstance.toFixed(2)} avg/instance
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">📊</span>
              <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400">Range</span>
            </div>
            <div className="text-lg font-bold text-white mb-1">
              ${Math.min(...billingData.instances.map(i => i.monthlyCost)).toFixed(2)} - ${Math.max(...billingData.instances.map(i => i.monthlyCost)).toFixed(2)}
            </div>
            <div className="text-sm text-slate-400">Cost Range</div>
            <div className="text-xs text-slate-500 mt-2">Per instance</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Per-Client Costs */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Cost by Client</h2>
              <span className="text-sm text-slate-400">{billingData.byClient.length} clients</span>
            </div>
            <div className="space-y-4">
              {billingData.byClient.map((client) => (
                <div key={client.client} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30">
                  <div>
                    <div className="font-medium text-white">{client.client}</div>
                    <div className="text-sm text-slate-400">{client.instanceCount} instance{client.instanceCount !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-cyan-400">${client.monthlyCost.toFixed(2)}</div>
                    <div className="text-xs text-slate-500">/month</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Server Type Distribution */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Server Type Distribution</h2>
            <div className="space-y-4">
              {Array.from(new Set(billingData.instances.map(i => i.serverType))).map((serverType) => {
                const instances = billingData.instances.filter(i => i.serverType === serverType);
                const totalCost = instances.reduce((sum, i) => sum + i.monthlyCost, 0);
                const percentage = (instances.length / billingData.instances.length) * 100;

                return (
                  <div key={serverType}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-white uppercase">{serverType}</span>
                        <span className="text-xs text-slate-500">
                          {instances.length} instance{instances.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-cyan-400">${totalCost.toFixed(2)}/mo</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Instance Details Table */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Instance Details</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Instance</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Client</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Datacenter</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Days Running</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Monthly Cost</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Hourly Rate</th>
                </tr>
              </thead>
              <tbody>
                {billingData.instances.map((instance) => (
                  <tr key={instance.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{instance.name}</div>
                      <div className="text-xs text-slate-500">ID: {instance.id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-slate-300">{instance.client}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm text-cyan-400 uppercase">{instance.serverType}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-slate-400">{instance.datacenter}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm text-slate-300">{instance.daysRunning}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-semibold text-white">${instance.monthlyCost.toFixed(2)}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm text-slate-400">${instance.hourlyRate.toFixed(3)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cost Projections */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Cost Projections</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-slate-800/30">
              <div className="text-sm text-slate-400 mb-2">Next 30 Days</div>
              <div className="text-2xl font-bold text-white">${billingData.totalMonthlyCost.toFixed(2)}</div>
              <div className="text-xs text-slate-500 mt-1">Based on current fleet</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/30">
              <div className="text-sm text-slate-400 mb-2">Next 90 Days</div>
              <div className="text-2xl font-bold text-white">${(billingData.totalMonthlyCost * 3).toFixed(2)}</div>
              <div className="text-xs text-slate-500 mt-1">Quarterly estimate</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/30">
              <div className="text-sm text-slate-400 mb-2">Next 12 Months</div>
              <div className="text-2xl font-bold text-white">${projectedAnnualCost.toFixed(2)}</div>
              <div className="text-xs text-slate-500 mt-1">Annual estimate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
