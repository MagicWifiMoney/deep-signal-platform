# Convex Setup for Deep Signal

## Quick Setup

1. **Create Convex Account**
   - Go to https://convex.dev
   - Sign up (free tier = 1M function calls/month)

2. **Initialize Convex Project**
   ```bash
   cd /home/ec2-user/clawd/projects/deep-signal-platform
   npx convex dev
   ```
   - Choose "create a new project"
   - Name it `deep-signal`
   - Copy the deployment URL

3. **Add to Vercel**
   ```bash
   vercel env add NEXT_PUBLIC_CONVEX_URL production
   # Paste: https://your-project.convex.cloud
   ```

4. **Deploy Schema**
   ```bash
   npx convex deploy
   ```

5. **Seed Initial Agents**
   ```bash
   npx convex run agents:create '{
     "name": "Orchestrator",
     "role": "Fleet Commander",
     "icon": "🎯",
     "description": "Coordinates all agent operations",
     "capabilities": ["Task prioritization", "Agent coordination", "Escalation handling"]
   }'
   ```

## Schema Overview

```
agents          - Agent definitions and status
instances       - Client VPS instances  
tasks           - Work items with status
messages        - Comments on tasks
activities      - Real-time activity feed
notifications   - @mention notifications
documents       - Deliverables and docs
securityScans   - Security scan results
```

## Key Functions

### Agents
- `agents:list` - Get all agents
- `agents:updateStatus` - Update agent status
- `agents:heartbeat` - Agent check-in

### Tasks
- `tasks:create` - Create new task
- `tasks:updateStatus` - Change task status
- `tasks:byStatus` - Get tasks by status (kanban)

### Activities
- `activities:list` - Get activity feed
- `activities:log` - Log new activity

### Notifications
- `notifications:parseAndNotify` - Parse @mentions and notify

## Real-time Updates

Convex provides automatic real-time updates. When any agent updates status:
1. Convex mutation runs
2. All connected clients get update instantly
3. No polling needed

## Agent Heartbeat Pattern

Each agent runs this on cron:
```javascript
// Check in with Convex
await convex.mutation("agents:heartbeat", {
  sessionKey: "agent:security-bot:main",
  status: "active",
  lastAction: "Completed security scan"
});

// Check for notifications
const notifications = await convex.query("notifications:getUndelivered", {
  agentId: myAgentId
});
```
