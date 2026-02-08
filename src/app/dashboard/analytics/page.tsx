'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('7d');

  // Generate mock chart data
  const generateChartData = (days: number) => {
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i - 1) * 86400000).toLocaleDateString('en-US', { weekday: 'short' }),
      messages: Math.floor(50 + Math.random() * 100),
      resolved: Math.floor(40 + Math.random() * 80),
      escalated: Math.floor(2 + Math.random() * 8),
    }));
  };

  const chartData = generateChartData(timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90);
  const maxMessages = Math.max(...chartData.map(d => d.messages));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
            ← Dashboard
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
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Messages', value: '3,247', change: '+12%', positive: true, icon: '💬' },
            { label: 'Avg Response Time', value: '1.2s', change: '-0.3s', positive: true, icon: '⚡' },
            { label: 'Resolution Rate', value: '94%', change: '+2%', positive: true, icon: '✅' },
            { label: 'Customer Satisfaction', value: '4.8/5', change: '+0.2', positive: true, icon: '⭐' },
          ].map((metric, i) => (
            <div key={i} className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{metric.icon}</span>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  metric.positive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {metric.change}
                </span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{metric.value}</div>
              <div className="text-sm text-slate-400">{metric.label}</div>
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
                  <div className="w-full flex flex-col gap-0.5" style={{ height: `${(d.messages / maxMessages) * 100}%` }}>
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
                { name: 'Web Chat', value: 45, icon: '🌐' },
                { name: 'WhatsApp', value: 30, icon: '📱' },
                { name: 'Slack', value: 15, icon: '💼' },
                { name: 'Telegram', value: 10, icon: '✈️' },
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
                const height = 20 + Math.sin(i * 0.5) * 30 + (i >= 9 && i <= 17 ? 40 : 0) + Math.random() * 20;
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
                <div className="text-3xl font-bold text-white">2.4M</div>
                <div className="text-sm text-slate-400">tokens used this period</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-400">$7.20</div>
                <div className="text-sm text-slate-400">estimated cost</div>
              </div>
            </div>
            <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full w-1/4 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full" />
            </div>
            <div className="flex justify-between mt-2 text-sm text-slate-500">
              <span>2.4M used</span>
              <span>10M limit</span>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-6">Response Quality</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-emerald-400">92%</div>
                <div className="text-sm text-slate-400">Helpful</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-cyan-400">88%</div>
                <div className="text-sm text-slate-400">Accurate</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-400">95%</div>
                <div className="text-sm text-slate-400">On-topic</div>
              </div>
            </div>
            <div className="mt-6 p-4 rounded-xl bg-slate-800/50">
              <div className="text-sm text-slate-400 mb-2">AI-generated insight:</div>
              <p className="text-sm text-white">
                Response quality is above baseline. Consider adding more product documentation to improve accuracy on technical questions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
