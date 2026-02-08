// Agent Ops Swarm - Autonomous Fleet Management

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'working' | 'error';
  icon: string;
  description: string;
  capabilities: string[];
  lastAction?: string;
  lastActionTime?: Date;
  tasksCompleted: number;
  tasksToday: number;
}

export interface AgentTask {
  id: string;
  agentId: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  description: string;
  startedAt: Date;
  completedAt?: Date;
  result?: string;
  instanceId?: string;
}

export interface SecurityScan {
  id: string;
  instanceId: string;
  instanceName: string;
  timestamp: Date;
  status: 'passing' | 'warning' | 'critical';
  checks: SecurityCheck[];
  score: number;
}

export interface SecurityCheck {
  id: string;
  name: string;
  category: 'auth' | 'network' | 'config' | 'secrets' | 'updates';
  status: 'pass' | 'warn' | 'fail';
  message: string;
  recommendation?: string;
}

export const AGENT_SWARM: Agent[] = [
  {
    id: 'orchestrator',
    name: 'Orchestrator',
    role: 'Fleet Commander',
    status: 'active',
    icon: '🎯',
    description: 'Coordinates all agent operations and prioritizes tasks across the fleet.',
    capabilities: ['Task prioritization', 'Agent coordination', 'Escalation handling', 'Resource allocation'],
    lastAction: 'Dispatched SecurityBot to scan 3 instances',
    lastActionTime: new Date(Date.now() - 5 * 60 * 1000),
    tasksCompleted: 1247,
    tasksToday: 34,
  },
  {
    id: 'security-bot',
    name: 'SecurityBot',
    role: 'Security Analyst',
    status: 'working',
    icon: '🛡️',
    description: 'Continuously scans instances for vulnerabilities and configuration issues.',
    capabilities: ['Config auditing', 'Secret detection', 'Vulnerability scanning', 'Compliance checks'],
    lastAction: 'Scanning deepsignal-01 for misconfigurations',
    lastActionTime: new Date(Date.now() - 2 * 60 * 1000),
    tasksCompleted: 892,
    tasksToday: 12,
  },
  {
    id: 'ops-bot',
    name: 'OpsBot',
    role: 'Operations Manager',
    status: 'active',
    icon: '⚙️',
    description: 'Monitors instance health and automatically resolves common issues.',
    capabilities: ['Health monitoring', 'Auto-restart', 'Log analysis', 'Performance tuning'],
    lastAction: 'Verified all instances healthy',
    lastActionTime: new Date(Date.now() - 10 * 60 * 1000),
    tasksCompleted: 2156,
    tasksToday: 45,
  },
  {
    id: 'support-bot',
    name: 'SupportBot',
    role: 'Client Success',
    status: 'idle',
    icon: '💬',
    description: 'Handles client support tickets and provides self-service solutions.',
    capabilities: ['Ticket triage', 'Knowledge base', 'Escalation', 'Client updates'],
    lastAction: 'Resolved ticket #1247 - API key rotation',
    lastActionTime: new Date(Date.now() - 30 * 60 * 1000),
    tasksCompleted: 456,
    tasksToday: 8,
  },
  {
    id: 'onboard-bot',
    name: 'OnboardBot',
    role: 'Setup Specialist',
    status: 'idle',
    icon: '🚀',
    description: 'Guides new clients through setup and ensures successful deployment.',
    capabilities: ['Instance provisioning', 'Channel setup', 'Config validation', 'Training'],
    lastAction: 'Completed onboarding for Acme Corp',
    lastActionTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    tasksCompleted: 89,
    tasksToday: 2,
  },
  {
    id: 'billing-bot',
    name: 'BillingBot',
    role: 'Revenue Operations',
    status: 'active',
    icon: '💰',
    description: 'Tracks usage, generates invoices, and manages subscriptions.',
    capabilities: ['Usage metering', 'Invoice generation', 'Payment processing', 'Churn prediction'],
    lastAction: 'Generated 3 monthly invoices',
    lastActionTime: new Date(Date.now() - 60 * 60 * 1000),
    tasksCompleted: 234,
    tasksToday: 5,
  },
];

export const generateSecurityScan = (instanceId: string, instanceName: string): SecurityScan => {
  const checks: SecurityCheck[] = [
    {
      id: 'ssh-keys',
      name: 'SSH Key Authentication',
      category: 'auth',
      status: 'pass',
      message: 'Password authentication disabled, key-only access',
    },
    {
      id: 'api-keys',
      name: 'API Key Storage',
      category: 'secrets',
      status: 'pass',
      message: 'API keys stored in encrypted environment variables',
    },
    {
      id: 'tailscale',
      name: 'Network Isolation',
      category: 'network',
      status: 'pass',
      message: 'Instance accessible only via Tailscale mesh',
    },
    {
      id: 'firewall',
      name: 'Firewall Rules',
      category: 'network',
      status: 'pass',
      message: 'Only ports 22 (SSH) and 41641 (Tailscale) open',
    },
    {
      id: 'updates',
      name: 'System Updates',
      category: 'updates',
      status: Math.random() > 0.7 ? 'warn' : 'pass',
      message: Math.random() > 0.7 ? '3 packages have available updates' : 'All packages up to date',
      recommendation: Math.random() > 0.7 ? 'Run apt update && apt upgrade' : undefined,
    },
    {
      id: 'openclaw-version',
      name: 'OpenClaw Version',
      category: 'updates',
      status: 'pass',
      message: 'Running latest version (2026.2.6-3)',
    },
    {
      id: 'config-validation',
      name: 'Configuration Validation',
      category: 'config',
      status: 'pass',
      message: 'All required configuration present and valid',
    },
    {
      id: 'rate-limiting',
      name: 'Rate Limiting',
      category: 'config',
      status: 'pass',
      message: 'Rate limiting enabled (60 req/min)',
    },
    {
      id: 'logging',
      name: 'Audit Logging',
      category: 'config',
      status: 'pass',
      message: 'All actions logged with timestamps',
    },
    {
      id: 'backup',
      name: 'Backup Status',
      category: 'config',
      status: Math.random() > 0.8 ? 'warn' : 'pass',
      message: Math.random() > 0.8 ? 'Last backup 25 hours ago' : 'Backup completed 2 hours ago',
      recommendation: Math.random() > 0.8 ? 'Configure automated daily backups' : undefined,
    },
  ];

  const passCount = checks.filter(c => c.status === 'pass').length;
  const warnCount = checks.filter(c => c.status === 'warn').length;
  const failCount = checks.filter(c => c.status === 'fail').length;
  
  const score = Math.round((passCount * 10 + warnCount * 5) / checks.length * 10);

  return {
    id: `scan-${Date.now()}`,
    instanceId,
    instanceName,
    timestamp: new Date(),
    status: failCount > 0 ? 'critical' : warnCount > 0 ? 'warning' : 'passing',
    checks,
    score,
  };
};

export const RECENT_TASKS: AgentTask[] = [
  {
    id: 't1',
    agentId: 'security-bot',
    type: 'security_scan',
    status: 'completed',
    description: 'Full security scan on deepsignal-01',
    startedAt: new Date(Date.now() - 15 * 60 * 1000),
    completedAt: new Date(Date.now() - 12 * 60 * 1000),
    result: 'Score: 98/100 - All checks passed',
    instanceId: 'deepsignal-01',
  },
  {
    id: 't2',
    agentId: 'ops-bot',
    type: 'health_check',
    status: 'completed',
    description: 'Hourly health check on all instances',
    startedAt: new Date(Date.now() - 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 59 * 60 * 1000),
    result: '1/1 instances healthy',
  },
  {
    id: 't3',
    agentId: 'orchestrator',
    type: 'task_dispatch',
    status: 'completed',
    description: 'Morning task prioritization',
    startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000 + 30000),
    result: 'Dispatched 12 tasks to 4 agents',
  },
  {
    id: 't4',
    agentId: 'billing-bot',
    type: 'usage_report',
    status: 'running',
    description: 'Generating daily usage report',
    startedAt: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: 't5',
    agentId: 'security-bot',
    type: 'config_audit',
    status: 'pending',
    description: 'Scheduled config audit for new instance',
    startedAt: new Date(Date.now() + 30 * 60 * 1000),
  },
];
