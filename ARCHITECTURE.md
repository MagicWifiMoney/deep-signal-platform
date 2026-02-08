# Deep Signal Platform Architecture

## Overview
AI Agents as a Service — managed OpenClaw instances for businesses.
Dedicated instances per client (not multi-tenant), maximum security and customization.

---

## 🏗️ Platform Components

### 1. CLIENT ONBOARDING PORTAL
**Purpose:** Butter-smooth first experience for new clients

**Flow:**
```
Welcome → Company Info → API Keys → Model Selection → 
Channel Setup → Agent Personality → Test Message → 
Celebration → Dashboard
```

**Screens:**
1. **Welcome** - Hero animation, value prop, "Get Started"
2. **Company Profile** - Name, industry, use case
3. **API Configuration** - Guided key setup (Anthropic/OpenRouter)
4. **Model Selection** - Visual model picker with cost/speed comparison
5. **Channel Connect** - WhatsApp/Telegram/Slack/Email wizard
6. **Agent Personality** - Tone, name, avatar, custom instructions
7. **Test Drive** - Live chat test before going live
8. **Success** - Confetti, next steps, dashboard link

**Tech:** Next.js 14, Framer Motion, shadcn/ui

---

### 2. CLIENT DASHBOARD
**Purpose:** Daily command center for clients

**Sections:**
- **Hero Stats** - Messages today, response time, satisfaction
- **Agent Status** - Live indicator, model, uptime
- **Recent Conversations** - Stream with sentiment indicators
- **Usage & Billing** - Token usage, cost forecast, limits
- **Quick Actions** - Pause agent, change model, get help

**Features:**
- Real-time updates via WebSocket
- Mobile responsive
- Dark/light mode
- Export conversations

---

### 3. MISSION CONTROL (Admin)
**Purpose:** Jake's command center for all clients

**Views:**

#### 3.1 Fleet Overview
- Grid of all client instances
- Status indicators (green/yellow/red)
- Quick stats per client
- One-click SSH/console access

#### 3.2 System Monitor
- CPU/Memory/Disk across fleet
- API latency metrics
- Error rate tracking
- Cost per client

#### 3.3 Batch Operations
- Deploy new instance (one-click)
- Mass model updates
- Broadcast announcements
- Backup/restore

#### 3.4 Client Management
- Onboarding progress tracker
- Billing status
- Support tickets
- Usage alerts

---

### 4. AGENT OPS SYSTEM
**Purpose:** Autonomous fleet management

#### 4.1 Orchestrator Agent
- Monitors all client instances
- Auto-scales resources
- Handles failover
- Schedules maintenance windows

#### 4.2 Security Agent
- Continuous vulnerability scanning
- API key rotation reminders
- Access log analysis
- Anomaly detection

#### 4.3 Support Agent
- Triages incoming tickets
- Auto-resolves common issues
- Escalates to human when needed
- Knowledge base updates

#### 4.4 Billing Agent
- Usage tracking per client
- Invoice generation
- Payment reminders
- Cost optimization suggestions

#### 4.5 Onboarding Agent
- Guides new clients through setup
- Answers questions in real-time
- Troubleshoots connection issues
- Sends welcome sequences

#### 4.6 Learning Loop Agent
- Analyzes successful interactions
- Updates agent prompts
- A/B tests responses
- Reports insights weekly

---

## 🔐 Security Architecture

### Per-Client Isolation
- Dedicated VPS per client
- Separate Tailscale identity
- Unique encryption keys
- No shared resources

### Access Control
- Role-based permissions
- SSO integration ready
- Audit logging
- IP allowlisting option

### Compliance
- SOC 2 ready architecture
- GDPR data handling
- Data residency options
- Client-owned encryption keys

---

## 🛠️ Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Framer Motion
- Recharts for analytics
- Socket.io for real-time

### Backend
- Node.js API routes
- Prisma ORM
- PostgreSQL (Neon)
- Redis for caching
- Bull for job queues

### Infrastructure
- Hetzner VPS fleet
- Tailscale mesh network
- Cloudflare for CDN/DNS
- Vercel for frontend
- GitHub Actions for CI/CD

### Monitoring
- Prometheus metrics
- Grafana dashboards
- PagerDuty alerts
- Sentry error tracking

---

## 📊 Data Models

### Client
```typescript
interface Client {
  id: string
  name: string
  industry: string
  plan: 'starter' | 'growth' | 'enterprise'
  status: 'onboarding' | 'active' | 'paused' | 'churned'
  instance: Instance
  billing: BillingInfo
  createdAt: Date
}
```

### Instance
```typescript
interface Instance {
  id: string
  clientId: string
  hostname: string
  ip: string
  tailscaleIp: string
  provider: 'hetzner' | 'aws' | 'onprem'
  serverType: string
  region: string
  status: 'provisioning' | 'running' | 'stopped' | 'error'
  openclawVersion: string
  model: string
  channels: Channel[]
  metrics: InstanceMetrics
}
```

### InstanceMetrics
```typescript
interface InstanceMetrics {
  cpu: number
  memory: number
  disk: number
  messagesTotal: number
  messagesToday: number
  tokensUsed: number
  responseTimeAvg: number
  uptime: number
  lastSeen: Date
}
```

---

## 🚀 Deployment Plan

### Phase 1: MVP (This Week)
- [ ] Onboarding flow (all 8 screens)
- [ ] Basic client dashboard
- [ ] Mission Control overview

### Phase 2: Polish (Week 2)
- [ ] Real-time updates
- [ ] Batch deployment
- [ ] Billing integration

### Phase 3: Agent Ops (Week 3)
- [ ] Orchestrator agent
- [ ] Security agent
- [ ] Learning loops

### Phase 4: Scale (Week 4+)
- [ ] Multi-region support
- [ ] White-label option
- [ ] API for integrations

---

## 🎨 Design System

### Colors
- Primary: Deep blue (#1a365d)
- Accent: Electric cyan (#00d9ff)
- Success: Emerald (#10b981)
- Warning: Amber (#f59e0b)
- Error: Rose (#f43f5e)
- Background: Slate (#0f172a to #1e293b)

### Typography
- Headers: Inter (bold)
- Body: Inter (regular)
- Mono: JetBrains Mono

### Components
- Glass morphism cards
- Subtle gradients
- Smooth animations
- Micro-interactions

---

*Built for Deep Signal by Botti — Feb 2026*
