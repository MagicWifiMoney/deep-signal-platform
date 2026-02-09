# Deep Signal Platform

AI Agents as a Service - Managed OpenClaw instances for businesses.

## Live URLs

- **Platform:** https://deep-signal-platform.vercel.app
- **Pitch Site:** https://deep-signal-pitch.vercel.app

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Deep Signal Platform                          │
│                  (Vercel - Next.js 16)                           │
├─────────────────────────────────────────────────────────────────┤
│  /onboarding     - Client signup + instance provisioning         │
│  /dashboard      - Client dashboard (conversations, analytics)   │
│  /mission-control - Admin fleet management                       │
│  /setup/slack    - Slack OAuth + auto-configuration              │
│  /setup/webchat  - Web chat embed code generator                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Config Service (EC2)                          │
│                  dsconfig.jgiebz.com:8893                        │
├─────────────────────────────────────────────────────────────────┤
│  POST /configure-slack  - SSH into instance, configure OpenClaw  │
│  GET  /instance-status  - Check instance health                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Client Instances (Hetzner VPS)                   │
│              {client}.ds.jgiebz.com                              │
├─────────────────────────────────────────────────────────────────┤
│  - Dedicated OpenClaw instance per client                        │
│  - Auto-HTTPS via Caddy + Let's Encrypt                          │
│  - Slack integration via Socket Mode                             │
│  - Claude Haiku 3.5 default model                                │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Frontend:** Next.js 16, Tailwind CSS, TypeScript
- **Auth:** Clerk (ready but not enforced)
- **Infrastructure:** Hetzner Cloud API, Cloudflare DNS
- **Instances:** Ubuntu 24.04, OpenClaw, Caddy, Tailscale
- **Config Service:** Node.js + Express + node-ssh (PM2)

## Key Features

### Onboarding Flow
1. Company name + URL input
2. Gemini-powered company analysis (ICPs, tone suggestions)
3. Personality selection with example responses
4. Channel selection (Slack, Web Chat)
5. One-click instance deployment to Hetzner
6. Auto DNS setup ({company}.ds.jgiebz.com)
7. Auto HTTPS via Caddy

### Slack Integration
- Single Deep Signal Slack app for all clients
- OAuth flow captures bot token per workspace
- Socket Mode for reliable message delivery
- Config service auto-configures instances via SSH

### Mission Control (Admin)
- Fleet overview with health metrics
- Per-instance drill-down
- Real-time status monitoring

## Environment Variables (Vercel)

```
HETZNER_API_TOKEN=...
CLOUDFLARE_API_TOKEN=...
GEMINI_API_KEY=...
OPENAI_API_KEY=...
SLACK_CLIENT_ID=<your-slack-client-id>
SLACK_CLIENT_SECRET=<your-slack-client-secret>
SLACK_SIGNING_SECRET=<your-slack-signing-secret>
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
```

## Local Development

```bash
cd projects/deep-signal-platform
npm install
npm run dev
```

## Deployment

```bash
vercel --prod --yes
```

## Config Service (EC2)

Located at `/home/ec2-user/clawd/projects/deep-signal-platform/config-service/`

```bash
# Start
PORT=8893 pm2 start server.js --name ds-config-service

# Logs
pm2 logs ds-config-service
```

Exposed via Cloudflare Tunnel at `dsconfig.jgiebz.com`

## Test Instance

- **Domain:** jgtest3.ds.jgiebz.com
- **IP:** 5.161.108.14
- **Gateway Token:** <generated-at-deploy>
- **SSH:** `ssh -i ~/.ssh/hetzner_deepsignal root@5.161.108.14`

## Slack App Configuration

App ID: `A0ADHRRHKSP`

### Required Settings
- **Socket Mode:** ON
- **App-Level Token:** Created with `connections:write` scope
- **Bot Token Scopes:** chat:write, channels:history, channels:read, groups:history, groups:read, im:history, im:read, im:write, mpim:history, mpim:read, mpim:write, app_mentions:read
- **Event Subscriptions:** app_mention, message.channels, message.groups, message.im, message.mpim

### OAuth Redirect URL
`https://deep-signal-platform.vercel.app/api/slack/callback`

## File Structure

```
deep-signal-platform/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── onboard/          # Instance provisioning
│   │   │   ├── slack/
│   │   │   │   ├── callback/     # OAuth callback
│   │   │   │   └── events/       # Events proxy (unused with Socket Mode)
│   │   │   └── analyze-company/  # Gemini company analysis
│   │   ├── onboarding/           # Client signup flow
│   │   ├── dashboard/            # Client dashboard
│   │   ├── mission-control/      # Admin fleet management
│   │   └── setup/
│   │       ├── slack/            # Slack OAuth UI
│   │       └── webchat/          # Web chat embed UI
│   └── lib/
│       ├── instance-registry.ts  # Team → Instance mapping
│       └── cloud-init.ts         # Instance provisioning scripts
├── config-service/               # EC2 SSH config service
│   ├── server.js
│   └── package.json
└── docs/
    └── ARCHITECTURE.md
```

## License

Proprietary - Deep Signal / Giebz.OS
