'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AGENT_SWARM, RECENT_TASKS, generateSecurityScan, type Agent, type AgentTask, type SecurityScan } from '@/lib/agents';

export default function AgentOps() {
  const [agents, setAgents] = useState(AGENT_SWARM);
  const [tasks, setTasks] = useState(RECENT_TASKS);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [securityScans, setSecurityScans] = useState<SecurityScan[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  // Simulate agent activity
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prev => prev.map(agent => ({
        ...agent,
        status: Math.random() > 0.8 
          ? (['active', 'working', 'idle'] as const)[Math.floor(Math.random() * 3)]
          : agent.status,
        tasksToday: agent.tasksToday + (Math.random() > 0.9 ? 1 : 0),
      })));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Run security scan
  const runSecurityScan = async () => {
    setIsScanning(true);
    
    // Simulate scanning delay
    await new Promise(r => setTimeout(r, 2000));
    
    const scan = generateSecurityScan('deepsignal-01', 'deepsignal-01');
    setSecurityScans(prev => [scan, ...prev]);
    
    // Update SecurityBot status
    setAgents(prev => prev.map(a => 
      a.id === 'security-bot' 
        ? { ...a, status: 'active' as const, lastAction: `Completed scan on deepsignal-01 (Score: ${scan.score}/100)`, lastActionTime: new Date(), tasksToday: a.tasksToday + 1 }
        : a
    ));
    
    setIsScanning(false);
  };

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'active': return 'bg-emerald-500';
      case 'working': return 'bg-cyan-500 animate-pulse';
      case 'idle': return 'bg-slate-500';
      case 'error': return 'bg-rose-500';
    }
  };

  const formatTime = (date?: Date) => {
    if (!date) return 'Never';
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Link href="/mission-control" className="text-slate-400 hover:text-white transition-colors">
            ← Mission Control
          </Link>
          <h1 className="text-xl font-bold text-white">Agent Ops</h1>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm">
            {agents.filter(a => a.status !== 'error').length}/{agents.length} Online
          </span>
        </div>
        
        <button
          onClick={runSecurityScan}
          disabled={isScanning}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50"
        >
          {isScanning ? '🔍 Scanning...' : '🛡️ Run Security Scan'}
        </button>
      </header>

      <div className="p-6">
        {/* Agent Swarm Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Agent Swarm</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={`glass rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.02] ${
                  selectedAgent?.id === agent.id ? 'ring-2 ring-cyan-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{agent.icon}</span>
                    <div>
                      <h3 className="font-semibold text-white">{agent.name}</h3>
                      <p className="text-sm text-slate-400">{agent.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                    <span className="text-xs text-slate-400 capitalize">{agent.status}</span>
                  </div>
                </div>
                
                <p className="text-sm text-slate-400 mb-4 line-clamp-2">{agent.description}</p>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Today: {agent.tasksToday} tasks</span>
                  <span className="text-slate-500">Total: {agent.tasksCompleted.toLocaleString()}</span>
                </div>
                
                {agent.lastAction && (
                  <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <p className="text-xs text-cyan-400 truncate">{agent.lastAction}</p>
                    <p className="text-xs text-slate-500">{formatTime(agent.lastActionTime)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Tasks */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Tasks</h2>
            <div className="space-y-3">
              {tasks.map((task) => {
                const agent = agents.find(a => a.id === task.agentId);
                return (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50">
                    <span className="text-xl">{agent?.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white text-sm">{agent?.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          task.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                          task.status === 'running' ? 'bg-cyan-500/20 text-cyan-400' :
                          task.status === 'failed' ? 'bg-rose-500/20 text-rose-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 truncate">{task.description}</p>
                      {task.result && (
                        <p className="text-xs text-emerald-400 mt-1">{task.result}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {formatTime(task.startedAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Security Scans */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Security Scans</h2>
            {securityScans.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-5xl mb-4 block">🛡️</span>
                <p className="text-slate-400 mb-4">No scans yet</p>
                <button
                  onClick={runSecurityScan}
                  disabled={isScanning}
                  className="text-cyan-400 hover:underline"
                >
                  Run your first security scan →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {securityScans.slice(0, 3).map((scan) => (
                  <div key={scan.id} className="p-4 rounded-xl bg-slate-800/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          scan.status === 'passing' ? 'bg-emerald-500/20 text-emerald-400' :
                          scan.status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-rose-500/20 text-rose-400'
                        }`}>
                          {scan.status.toUpperCase()}
                        </span>
                        <span className="text-white font-medium">{scan.instanceName}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{scan.score}</div>
                        <div className="text-xs text-slate-400">/ 100</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-2">
                      {scan.checks.slice(0, 5).map((check) => (
                        <div
                          key={check.id}
                          className={`p-2 rounded-lg text-center ${
                            check.status === 'pass' ? 'bg-emerald-500/10' :
                            check.status === 'warn' ? 'bg-amber-500/10' :
                            'bg-rose-500/10'
                          }`}
                          title={check.message}
                        >
                          <span className="text-lg">
                            {check.status === 'pass' ? '✓' : check.status === 'warn' ? '!' : '✗'}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-3 text-xs text-slate-500">
                      {formatTime(scan.timestamp)} • {scan.checks.filter(c => c.status === 'pass').length}/{scan.checks.length} checks passed
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Agent Detail Modal */}
        {selectedAgent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedAgent(null)}>
            <div className="bg-slate-900 rounded-2xl p-6 max-w-lg w-full border border-slate-800" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <span className="text-5xl">{selectedAgent.icon}</span>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedAgent.name}</h2>
                    <p className="text-slate-400">{selectedAgent.role}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedAgent(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              
              <p className="text-slate-300 mb-6">{selectedAgent.description}</p>
              
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Capabilities</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.capabilities.map((cap, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-slate-800 text-sm text-slate-300">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-slate-800/50">
                  <div className="text-2xl font-bold text-white">{selectedAgent.tasksToday}</div>
                  <div className="text-sm text-slate-400">Tasks Today</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/50">
                  <div className="text-2xl font-bold text-white">{selectedAgent.tasksCompleted.toLocaleString()}</div>
                  <div className="text-sm text-slate-400">Total Completed</div>
                </div>
              </div>
              
              {selectedAgent.lastAction && (
                <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <div className="text-xs text-cyan-400 mb-1">Last Action</div>
                  <div className="text-white">{selectedAgent.lastAction}</div>
                  <div className="text-xs text-slate-400 mt-1">{formatTime(selectedAgent.lastActionTime)}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
