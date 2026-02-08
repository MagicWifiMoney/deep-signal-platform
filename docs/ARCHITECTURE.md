# Deep Signal Architecture

## Overview

Each client gets a **dedicated, isolated VPS** with:
- OpenClaw gateway (AI agent runtime)
- Caddy (HTTPS reverse proxy)
- Their own subdomain: `{company}.ds.jgiebz.com`

## Security Model

### Instance Isolation
- **One VPS per client** - No shared infrastructure
- **API keys stored only on client's instance** - We never see them
- **SSH access** - Jake has admin access, clients can request audit access

### HTTPS by Default
- Caddy auto-provisions Let's Encrypt certificates
- All traffic encrypted in transit
- WebSocket connections work (secure context)

### Access Control
- Gateway auth token (random, per-instance)
- SSH key authentication only
- No passwords

## Channel Integration

### Web Chat (Simplest - MVP)

**How it works:**
1. After deployment, client gets embed code
2. They paste `<script>` tag into their website
3. Chat widget connects to their instance via secure WebSocket

**Implementation:**
```html
<script src="https://acme.ds.jgiebz.com/widget.js"></script>
```

OpenClaw needs a web widget endpoint. Options:
- Use existing OpenClaw web UI
- Build custom chat widget that connects to gateway

### Slack (OAuth Flow)

**Architecture Decision: Single Deep Signal Slack App**

Why: Users click one button, no manual token copying.

**Flow:**
1. We create ONE Slack app: "Deep Signal Agent"
2. User clicks "Add to Slack" on their setup page
3. OAuth redirects to `https://deep-signal-platform.vercel.app/api/slack/callback`
4. We receive:
   - `access_token` (bot token)
   - `team_id` (workspace ID)
   - `team_name`
5. We securely transfer token to their instance via SSH
6. Configure OpenClaw's Slack channel on their instance
7. Redirect user to success page

**Required Scopes:**
- `chat:write` - Send messages
- `channels:history` - Read channel messages (for context)
- `channels:read` - List channels
- `users:read` - Get user info
- `app_mentions:read` - Respond to @mentions
- `im:history` - Read DMs
- `im:write` - Send DMs

**Security:**
- Bot token stored only on client's instance
- We don't store tokens on Deep Signal platform
- Token transmitted via SSH to instance

### Slack Setup Steps

1. **Create Slack App** at api.slack.com/apps
   - App Name: "Deep Signal Agent"
   - Request above scopes
   - Set redirect URL: `https://deep-signal-platform.vercel.app/api/slack/callback`
   - Enable Events API if needed

2. **User Flow:**
   ```
   Setup Page → "Add to Slack" button → Slack OAuth → 
   Callback (save token to instance) → Success
   ```

3. **Instance Configuration:**
   ```bash
   # Via SSH after OAuth
   cat >> /root/.openclaw/openclaw.json << EOF
   {
     "channels": {
       "slack": {
         "enabled": true,
         "token": "xoxb-...",
         "signingSecret": "..."
       }
     }
   }
   EOF
   systemctl restart openclaw
   ```

## Deployment Flow

```
1. User completes onboarding
2. API creates Hetzner VPS
3. API creates DNS record ({company}.ds.jgiebz.com)
4. Cloud-init runs:
   - Install Node.js, Caddy, OpenClaw
   - Configure HTTPS
   - Start services
5. User gets working HTTPS URL in ~2 min
6. User configures channels (Slack, Web Chat)
```

## Long-term Considerations

### Scaling
- Each instance is independent
- No single point of failure
- Can distribute across regions

### Billing
- Hetzner VPS: ~$10/month per client
- DNS: Free (Cloudflare)
- SSL: Free (Let's Encrypt)

### Monitoring
- Health checks via Mission Control
- Instance status API
- Alerts on downtime

### Multi-Workspace Slack
- If client needs agent in multiple Slack workspaces
- Re-run OAuth for each workspace
- Store multiple tokens on instance
