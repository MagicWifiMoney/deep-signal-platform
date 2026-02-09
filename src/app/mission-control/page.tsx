'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { Instance } from '@/lib/api';

const AGENT_OPS = [
  { id: 'orchestrator', name: 'Orchestrator', status: 'active', lastAction: 'Dispatched SecurityBot to scan', time: '2m ago', icon: '🎯' },
  { id: 'security-bot', name: 'SecurityBot', status: 'working', lastAction: 'Scanning instances', time: 'now', icon: '🛡️' },
  { id: 'ops-bot', name: 'OpsBot', status: 'active', lastAction: 'All instances healthy', time: '5m ago', icon: '⚙️' },
  { id: 'support-bot', name: 'SupportBot', status: 'idle', lastAction: 'Awaiting tickets', time: '-', icon: '💬' },
  { id: 'billing-bot', name: 'BillingBot', status: 'active', lastAction: 'Usage report generated', time: '1h ago', icon: '💰' },
  { id: 'onboard-bot', name: 'OnboardBot', status: 'idle', lastAction: 'Ready for new clients', time: '-', icon: '🚀' },
];

export default function MissionControl() {
  const [activeView, setActiveView] = useState('fleet');
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deployForm, setDeployForm] = useState({ name: '', region: 'ash', serverType: 'cpx21' });
  const [isDeploying, setIsDeploying] = useState(false);

  // Fetch instances
  const fetchInstances = useCallback(async () => {
    try {
      const res = await fetch('/api/instances');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setInstances(data.instances || []);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to connect to Hetzner API');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstances();
    // Refresh every 30 seconds
    const interval = setInterval(fetchInstances, 30000);
    return () => clearInterval(interval);
  }, [fetchInstances]);

  // Deploy instance
  const handleDeploy = async () => {
    if (!deployForm.name) return;
    
    setIsDeploying(true);
    try {
      const res = await fetch('/api/instances/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deployForm),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setShowDeployModal(false);
        setDeployForm({ name: '', region: 'ash', serverType: 'cpx21' });
        // Refresh instances
        await fetchInstances();
      } else {
        alert(data.error || 'Deploy failed');
      }
    } catch (err) {
      console.error('Deploy error:', err);
      alert('Failed to deploy instance');
    } finally {
      setIsDeploying(false);
    }
  };

  // Calculate totals
  const totalMessages = instances.reduce((sum, i) => sum + (i.openclaw?.messagesToday || 0), 0);
  const onlineCount = instances.filter(i => i.status === 'online').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Top Bar */}
      <header className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <span className="text-xl font-bold text-white">Mission Control</span>
              <span className="ml-2 text-xs text-slate-500">Deep Signal Admin</span>
            </div>
          </Link>
          
          {/* View Tabs */}
          <nav className="flex items-center gap-1 p-1 rounded-xl bg-slate-800/50">
            {[
              { id: 'fleet', label: 'Fleet', icon: '🖥️' },
              { id: 'agents', label: 'Agent Ops', icon: '🤖' },
              { id: 'metrics', label: 'Metrics', icon: '📊' },
              { id: 'security', label: 'Security', icon: '🔐' },
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeView === view.id
                    ? 'bg-cyan-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="mr-2">{view.icon}</span>
                {view.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Global Status */}
          <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-slate-800/50">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${onlineCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
              <span className="text-sm text-slate-300">{onlineCount}/{instances.length} Online</span>
            </div>
            <div className="w-px h-4 bg-slate-700" />
            <div className="text-sm">
              <span className="text-slate-400">Instances: </span>
              <span className="text-cyan-400 font-mono">{instances.length}</span>
            </div>
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={fetchInstances}
            className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700 transition-colors"
            title="Refresh"
            aria-label="Refresh instances"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          {/* Deploy Button */}
          <button
            onClick={() => setShowDeployModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center gap-2"
          >
            <span>+</span>
            Deploy Instance
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin text-4xl mb-4">⚡</div>
                <p className="text-slate-400">Loading fleet data...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="glass rounded-2xl p-6 border-amber-500/30 bg-amber-500/5">
              <div className="flex items-center gap-3 text-amber-400 mb-2">
                <span>⚠️</span>
                <span className="font-medium">Connection Issue</span>
              </div>
              <p className="text-slate-400 text-sm">{error}</p>
              <p className="text-slate-500 text-xs mt-2">Make sure HETZNER_API_TOKEN is set in environment variables.</p>
            </div>
          )}

          {/* Fleet View */}
          {activeView === 'fleet' && !isLoading && (
            <div className="space-y-6">
              {/* Stats Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Instances', value: instances.length, icon: '🖥️', color: 'cyan' },
                  { label: 'Messages Today', value: totalMessages.toLocaleString(), icon: '💬', color: 'blue' },
                  { label: 'Online', value: onlineCount, icon: '🟢', color: 'emerald' },
                  { label: 'Avg CPU', value: instances.length > 0 ? Math.round(instances.reduce((sum, i) => sum + (i.metrics?.cpu || 0), 0) / instances.length) + '%' : '-', icon: '⚡', color: 'purple' },
                ].map((stat, i) => (
                  <div key={i} className="glass rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{stat.icon}</span>
                      <span className="text-2xl font-bold text-white">{stat.value}</span>
                    </div>
                    <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Instances Grid */}
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {instances.map((instance) => (
                  <div
                    key={instance.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Instance ${instance.name}, status: ${instance.status}`}
                    onClick={() => setSelectedInstance(instance)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedInstance(instance); } }}
                    className={`glass rounded-2xl p-6 cursor-pointer transition-all hover:border-cyan-500/50 ${
                      selectedInstance?.id === instance.id ? 'border-cyan-500 bg-cyan-500/5' : ''
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          instance.status === 'online' ? 'status-online' :
                          instance.status === 'warning' ? 'status-warning' : 'bg-slate-500'
                        }`} />
                        <h3 className="font-semibold text-white">{instance.name}</h3>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-700 text-slate-300">
                        {instance.serverType}
                      </span>
                    </div>
                    
                    {/* IPs */}
                    <div className="space-y-1 mb-4">
                      <div className="text-xs font-mono text-cyan-400">{instance.publicIp}</div>
                      <div className="text-xs text-slate-500">{instance.datacenter}</div>
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-2xl font-bold text-white">{instance.openclaw?.messagesToday || 0}</div>
                        <div className="text-xs text-slate-500">messages today</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">{instance.openclaw?.uptime || 0}%</div>
                        <div className="text-xs text-slate-500">uptime</div>
                      </div>
                    </div>
                    
                    {/* Resource Bars */}
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">CPU</span>
                          <span className={(instance.metrics?.cpu || 0) > 70 ? 'text-amber-400' : 'text-slate-400'}>
                            {instance.metrics?.cpu || 0}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${(instance.metrics?.cpu || 0) > 70 ? 'bg-amber-500' : 'bg-cyan-500'}`}
                            style={{ width: `${instance.metrics?.cpu || 0}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">Memory</span>
                          <span className={(instance.metrics?.memory || 0) > 70 ? 'text-amber-400' : 'text-slate-400'}>
                            {instance.metrics?.memory || 0}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${(instance.metrics?.memory || 0) > 70 ? 'bg-amber-500' : 'bg-blue-500'}`}
                            style={{ width: `${instance.metrics?.memory || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
                      <span className="text-xs text-slate-500">{instance.openclaw?.lastSeen || 'Unknown'}</span>
                      <span className="text-sm text-slate-400">{instance.openclaw?.model || 'No model'}</span>
                    </div>
                  </div>
                ))}
                
                {/* Add New Card */}
                <button 
                  onClick={() => setShowDeployModal(true)}
                  className="glass rounded-2xl p-6 border-dashed border-2 border-slate-700 hover:border-cyan-500 transition-colors flex flex-col items-center justify-center min-h-[280px] group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 group-hover:bg-cyan-500/20 flex items-center justify-center text-4xl mb-4 transition-colors">
                    ➕
                  </div>
                  <span className="text-slate-400 group-hover:text-cyan-400 transition-colors">Deploy New Instance</span>
                </button>
              </div>

              {/* Empty State */}
              {instances.length === 0 && !isLoading && !error && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🚀</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No instances yet</h3>
                  <p className="text-slate-400 mb-6">Deploy your first Deep Signal instance to get started</p>
                  <button
                    onClick={() => setShowDeployModal(true)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium"
                  >
                    Deploy First Instance
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Agent Ops View */}
          {activeView === 'agents' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Agent Ops Team</h2>
                  <p className="text-slate-400">Autonomous agents managing your fleet</p>
                </div>
                <div className="flex items-center gap-4">
                  <Link 
                    href="/mission-control/agents"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                  >
                    Open Full Agent Ops →
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-sm text-emerald-400">All systems operational</span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {AGENT_OPS.map((agent) => (
                  <div key={agent.id} className="glass rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{agent.icon}</span>
                        <div>
                          <h3 className="font-semibold text-white">{agent.name}</h3>
                          <span className={`text-xs ${
                            agent.status === 'running' ? 'text-emerald-400' : 'text-slate-400'
                          }`}>
                            {agent.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-xl bg-slate-800/30 mb-4">
                      <div className="text-sm text-slate-300">{agent.lastAction}</div>
                      <div className="text-xs text-slate-500 mt-1">{agent.time}</div>
                    </div>
                    
                    {/* Activity indicator */}
                    <div className="h-8 flex items-end gap-0.5">
                      {Array.from({ length: 20 }, (_, i) => (
                        <div 
                          key={i}
                          className={`flex-1 rounded-t ${
                            agent.status === 'running' 
                              ? 'bg-cyan-500/50' 
                              : 'bg-slate-700'
                          }`}
                          style={{ 
                            height: agent.status === 'running' 
                              ? `${20 + Math.random() * 80}%` 
                              : '10%' 
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metrics View */}
          {activeView === 'metrics' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">System Metrics</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* CPU Chart */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-semibold text-white mb-4">Fleet CPU Usage</h3>
                  <div className="h-48 flex items-end gap-2">
                    {instances.length > 0 ? instances.map((instance) => (
                      <div key={instance.id} className="flex-1 flex flex-col items-center">
                        <div 
                          className={`w-full rounded-t ${
                            (instance.metrics?.cpu || 0) > 70 ? 'bg-amber-500' : 'bg-cyan-500'
                          }`}
                          style={{ height: `${instance.metrics?.cpu || 10}%` }}
                        />
                        <div className="text-xs text-slate-500 mt-2 truncate w-full text-center">
                          {instance.name.split('-').pop()}
                        </div>
                      </div>
                    )) : (
                      <div className="flex-1 flex items-center justify-center text-slate-500">
                        No data
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Memory Chart */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-semibold text-white mb-4">Fleet Memory Usage</h3>
                  <div className="h-48 flex items-end gap-2">
                    {instances.length > 0 ? instances.map((instance) => (
                      <div key={instance.id} className="flex-1 flex flex-col items-center">
                        <div 
                          className={`w-full rounded-t ${
                            (instance.metrics?.memory || 0) > 70 ? 'bg-amber-500' : 'bg-blue-500'
                          }`}
                          style={{ height: `${instance.metrics?.memory || 10}%` }}
                        />
                        <div className="text-xs text-slate-500 mt-2 truncate w-full text-center">
                          {instance.name.split('-').pop()}
                        </div>
                      </div>
                    )) : (
                      <div className="flex-1 flex items-center justify-center text-slate-500">
                        No data
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security View */}
          {activeView === 'security' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Security Center</h2>
                  <p className="text-slate-400">Zero-trust architecture status</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-emerald-400 font-medium">All Clear</span>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { icon: '🔐', title: 'Encryption', status: 'AES-256', detail: 'All data encrypted at rest and in transit' },
                  { icon: '🔑', title: 'API Keys', status: 'Zero-knowledge', detail: 'Keys stored only on client instances' },
                  { icon: '🛡️', title: 'Firewall', status: 'Active', detail: 'Only Tailscale traffic allowed' },
                  { icon: '📝', title: 'Audit Logs', status: 'Enabled', detail: '30-day retention, immutable' },
                  { icon: '🔄', title: 'Backups', status: 'Daily', detail: 'Encrypted, cross-region' },
                  { icon: '🚨', title: 'Intrusion Detection', status: 'Monitoring', detail: 'Real-time threat analysis' },
                ].map((item, i) => (
                  <div key={i} className="glass rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{item.icon}</span>
                      <div>
                        <h3 className="font-semibold text-white">{item.title}</h3>
                        <span className="text-sm text-emerald-400">{item.status}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Instance Detail Panel */}
        {selectedInstance && (
          <aside className="w-80 border-l border-slate-800 bg-slate-900/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-white">Instance Details</h3>
              <button
                onClick={() => setSelectedInstance(null)}
                className="p-1 rounded-lg hover:bg-slate-800 transition-colors"
                aria-label="Close instance details"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${
                  selectedInstance.status === 'online' ? 'status-online' : 'bg-slate-500'
                }`} />
                <span className="text-white font-medium">{selectedInstance.name}</span>
              </div>
              
              {/* Details */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Public IP</span>
                  <span className="text-cyan-400 font-mono text-xs">{selectedInstance.publicIp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Server Type</span>
                  <span className="text-white">{selectedInstance.serverType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Region</span>
                  <span className="text-white">{selectedInstance.datacenter}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Model</span>
                  <span className="text-white">{selectedInstance.openclaw?.model || 'Not configured'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Version</span>
                  <span className="text-slate-300 font-mono text-xs">{selectedInstance.openclaw?.version || '-'}</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="space-y-2">
                <Link
                  href={`/mission-control/instance/${selectedInstance.id}`}
                  className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/25 transition-all text-sm text-center block font-medium"
                >
                  Full Details & Metrics →
                </Link>
                <a 
                  href={`http://${selectedInstance.publicIp}:3000`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors text-sm text-center block"
                >
                  Open Dashboard
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`ssh -i ~/.ssh/hetzner_deepsignal root@${selectedInstance.publicIp}`);
                    alert('SSH command copied to clipboard');
                  }}
                  className="w-full px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors text-sm"
                  aria-label={`Copy SSH command for ${selectedInstance.name}`}
                >
                  Copy SSH Command
                </button>
                <Link
                  href={`/mission-control/instance/${selectedInstance.id}?tab=logs`}
                  className="w-full px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors text-sm text-center block"
                  aria-label={`View logs for ${selectedInstance.name}`}
                >
                  View Logs
                </Link>
                <button
                  onClick={async () => {
                    if (!confirm(`Restart instance ${selectedInstance.name}?`)) return;
                    try {
                      const res = await fetch(`/api/instances/${selectedInstance.id}/restart`, { method: 'POST' });
                      const data = await res.json();
                      alert(data.success ? 'Instance restarting...' : `Error: ${data.error}`);
                    } catch (e) { alert('Failed to restart instance'); }
                  }}
                  className="w-full px-4 py-2 rounded-xl border border-amber-500/50 text-amber-400 hover:bg-amber-500/10 transition-colors text-sm"
                  aria-label={`Restart instance ${selectedInstance.name}`}
                >
                  Restart Instance
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Deploy Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="glass rounded-2xl p-8 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Deploy New Instance</h2>
              <button
                onClick={() => setShowDeployModal(false)}
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                aria-label="Close deploy modal"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Client Name</label>
                <input 
                  type="text"
                  value={deployForm.name}
                  onChange={(e) => setDeployForm({ ...deployForm, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Region</label>
                <select 
                  value={deployForm.region}
                  onChange={(e) => setDeployForm({ ...deployForm, region: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="ash">US East (Ashburn, VA)</option>
                  <option value="hil">US West (Hillsboro, OR)</option>
                  <option value="nbg1">EU (Nuremberg, DE)</option>
                  <option value="hel1">EU (Helsinki, FI)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Server Size</label>
                <select 
                  value={deployForm.serverType}
                  onChange={(e) => setDeployForm({ ...deployForm, serverType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="cpx11">CPX11 - 2 vCPU, 2GB RAM (~$5/mo)</option>
                  <option value="cpx21">CPX21 - 3 vCPU, 4GB RAM (~$10/mo)</option>
                  <option value="cpx31">CPX31 - 4 vCPU, 8GB RAM (~$18/mo)</option>
                  <option value="cpx41">CPX41 - 8 vCPU, 16GB RAM (~$33/mo)</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setShowDeployModal(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors"
                disabled={isDeploying}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeploy}
                disabled={!deployForm.name || isDeploying}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeploying ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Deploying...
                  </span>
                ) : (
                  'Deploy Instance'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
