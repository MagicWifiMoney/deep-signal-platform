# Deep Signal Platform - Handoff Document

**Date:** February 8, 2026  
**Session:** Slack Integration + Auto-Configuration

---

## What We Built Today

### 1. Slack OAuth Flow
- Created `/setup/slack` page with official "Add to Slack" button
- OAuth callback exchanges code for bot token
- Bot token stored in instance registry

### 2. Config Service (EC2)
- Node.js service that SSHs into client instances
- Auto-configures OpenClaw with Slack credentials
- Running on port 8893, exposed via Cloudflare Tunnel at `dsconfig.jgiebz.com`
- PM2 managed: `ds-config-service`

### 3. Instance Registry
- Maps Slack team_id → instance domain
- Uses Hetzner labels as persistent backup
- In-memory cache for fast lookups

---

## Current Configuration

### Slack App (api.slack.com/apps)
```
App ID: A0ADHRRHKSP
Client ID: <your-slack-client-id>
Client Secret: <your-slack-client-secret>
Signing Secret: <your-slack-signing-secret>
App Token: <your-slack-app-token>
Socket Mode: ENABLED
```

### Test Instance (jgtest3)
```
Domain: jgtest3.ds.jgiebz.com
IP: 5.161.108.14
Gateway Token: <generated-at-deploy>
Bot Token: <per-workspace-from-oauth>
Status: OpenClaw running, Slack socket mode connected
```

### OpenClaw Config on Instance
```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-haiku-3-5"
      }
    }
  },
  "gateway": {
    "mode": "local",
    "bind": "lan",
    "port": 3000,
    "auth": {
      "token": "<generated-at-deploy>"
    }
  },
  "commands": {
    "restart": true
  },
  "channels": {
    "slack": {
      "enabled": true,
      "appToken": "<your-slack-app-token>",
      "botToken": "<per-workspace-bot-token>"
    }
  }
}
```

---

## Troubleshooting Done

### Issue 1: OAuth `bad_client_secret` Error
**Cause:** Vercel env vars not matching Slack app credentials  
**Fix:** Hardcoded credentials in callback route for testing, verified they work

### Issue 2: OpenClaw Config Validation Error
**Cause:** Added `metadata` key which OpenClaw doesn't recognize  
**Fix:** Removed metadata from config, only use valid OpenClaw config keys

### Issue 3: HTTP Mode Events Not Working
**Cause:** HTTP mode expects Slack to send events directly to instance; our proxy forwarding didn't work  
**Fix:** Switched to Socket Mode - instance connects outbound to Slack

### Issue 4: Socket Mode Warning
**Cause:** Socket Mode not enabled in Slack app dashboard  
**Fix:** Jake enabled Socket Mode in Slack app settings

---

## Current Status

**Working:**
- Slack OAuth flow (get bot token)
- Socket Mode connection established
- OpenClaw running on test instance
- Config service can SSH and update instances

**Not Yet Working:**
- Bot not responding to messages in Slack
- Need to debug why messages aren't being processed

---

## Next Steps

### Immediate (Debug Bot Responses)

1. **Check OpenClaw logs for incoming messages:**
   ```bash
   ssh -i ~/.ssh/hetzner_deepsignal root@5.161.108.14
   journalctl -u openclaw -f
   ```
   Then send a message to the bot in Slack and watch for logs.

2. **Verify bot is in channels:**
   - DM the bot directly (should always work)
   - Or invite bot to a channel: `/invite @Deep Signal`

3. **Check Slack app event subscriptions:**
   - Ensure these bot events are subscribed:
     - `app_mention`
     - `message.im` (for DMs)
     - `message.channels`
     - `message.groups`

4. **Test with OpenClaw CLI:**
   ```bash
   ssh -i ~/.ssh/hetzner_deepsignal root@5.161.108.14
   openclaw status
   ```

### After Bot Works

1. **Update config service to not add metadata:**
   - File: `config-service/server.js`
   - Remove the `config.metadata = {...}` lines

2. **Move hardcoded credentials to env vars:**
   - File: `src/app/api/slack/callback/route.ts`
   - Change back to `process.env.SLACK_CLIENT_ID` etc.

3. **Add App Token to automated flow:**
   - App Token is shared across all clients
   - Add to config service so instances get both tokens

4. **Test full automated flow:**
   - Deploy new instance via onboarding
   - Click "Add to Slack" 
   - Verify instance auto-configured
   - Verify bot responds

### Future Enhancements

1. **Web Chat channel:**
   - Embed code generator ready at `/setup/webchat`
   - Need to configure OpenClaw web channel

2. **Clerk auth enforcement:**
   - Currently disabled in middleware
   - Enable for production

3. **Billing integration:**
   - Stripe setup for $2K-3K/mo pricing

4. **Multi-model support:**
   - UI shows model selection
   - Need to pass to instance config

---

## Key Files Changed Today

```
src/app/setup/slack/page.tsx          # Slack OAuth UI
src/app/setup/slack/success/page.tsx  # Success page
src/app/api/slack/callback/route.ts   # OAuth callback (hardcoded creds)
src/app/api/slack/events/route.ts     # Events proxy (unused with Socket Mode)
src/lib/instance-registry.ts          # Team → Instance mapping
config-service/server.js              # SSH config service
config-service/package.json           # Dependencies
```

---

## Commands Reference

### SSH to Test Instance
```bash
ssh -i ~/.ssh/hetzner_deepsignal root@5.161.108.14
```

### Check OpenClaw Status
```bash
systemctl status openclaw
journalctl -u openclaw -n 50
```

### Restart OpenClaw
```bash
systemctl restart openclaw
```

### View OpenClaw Config
```bash
cat /root/.openclaw/openclaw.json
```

### Config Service Logs
```bash
pm2 logs ds-config-service
```

### Deploy to Vercel
```bash
cd /home/ec2-user/clawd/projects/deep-signal-platform
vercel --prod --yes
```

---

## Contact

- **Jake:** @giebz
- **Botti:** Always here

---

## Slack Binding / Allowlist Config

OpenClaw supports fine-grained control over who can interact with the bot.

### DM Policies
```json
{
  "channels": {
    "slack": {
      "dm": {
        "enabled": true,
        "policy": "pairing",        // "open" | "pairing" | "allowlist"
        "allowFrom": ["U123", "*"]  // User IDs or "*" for all
      }
    }
  }
}
```

- **open**: Anyone in workspace can DM
- **pairing**: Requires approval before responding
- **allowlist**: Only users in `allowFrom` can DM

### Channel Policies
```json
{
  "channels": {
    "slack": {
      "groupPolicy": "allowlist",   // Only respond in listed channels
      "channels": {
        "C123ABC": { 
          "allow": true, 
          "requireMention": true    // Only when @mentioned
        },
        "#support": {
          "allow": true,
          "requireMention": false,  // Respond to all messages
          "users": ["U123"],        // Only these users trigger bot
          "systemPrompt": "You are a support agent. Be helpful."
        }
      }
    }
  }
}
```

### Example: Restrictive Config (Client Deployment)
```json
{
  "channels": {
    "slack": {
      "enabled": true,
      "appToken": "<your-slack-app-token>",
      "botToken": "<per-workspace-bot-token>",
      "groupPolicy": "allowlist",
      "dm": {
        "enabled": true,
        "policy": "allowlist",
        "allowFrom": ["*"]          // All workspace members can DM
      },
      "channels": {
        "#ai-assistant": {
          "allow": true,
          "requireMention": false
        }
      }
    }
  }
}
```

This config:
- Allows DMs from anyone in workspace
- Only responds in #ai-assistant channel
- Responds to all messages (no @mention needed) in that channel

---

## Session 2: Model Auth Troubleshooting (Feb 8, 7:30am CST)

### Issue
Bot connects to Slack (socket mode works) but fails with: `Unknown model: anthropic/claude-3-5-haiku`

### What We Tried

1. **Fixed model name:** `claude-haiku-3-5` → `claude-3-5-haiku` (correct format)

2. **API Key in systemd service:**
   ```
   Environment=ANTHROPIC_API_KEY=sk-ant-...
   ```
   - Tried with and without quotes
   - Key shows in service file but model still "missing"

3. **API Key in .env file:**
   ```
   /root/.openclaw/.env
   ANTHROPIC_API_KEY=sk-ant-...
   ```

4. **API Key in auth-profiles.json:**
   ```json
   {"anthropic": {"apiKey": "sk-ant-..."}}
   ```
   Path: `/root/.openclaw/agents/main/agent/auth-profiles.json`

5. **Used `openclaw models auth paste-token --provider anthropic`**
   - Token pasted successfully but model still shows "missing"

6. **Tried different models:**
   - `anthropic/claude-3-5-haiku` - Unknown model error
   - `anthropic/claude-sonnet-4` - Same issue

7. **Tried fresh API key from Jake** - Same result

### Current State
- Slack: Socket mode connected ✅
- Messages: Received by OpenClaw ✅
- Model auth: Shows "missing" despite key being configured ❌
- Response: Fails before generating reply ❌

### Logs Location
```bash
ssh -i ~/.ssh/hetzner_deepsignal root@5.161.108.14
journalctl -u openclaw -f
```

### Files Modified on Instance
- `/root/.openclaw/openclaw.json` - Main config
- `/root/.openclaw/agents/main/agent/auth-profiles.json` - API key
- `/etc/systemd/system/openclaw.service` - Service with env vars

### Next Steps to Debug

1. **Check OpenClaw version compatibility:**
   ```bash
   openclaw --version
   openclaw models list --all
   ```

2. **Try OpenAI model instead:**
   - Add `OPENAI_API_KEY` and use `openai/gpt-4o`

3. **Check if auth-profiles.json format is correct:**
   - Run `openclaw configure --section model` interactively

4. **Check OpenClaw docs for auth setup:**
   - https://docs.openclaw.ai/models/authentication

5. **Try running OpenClaw manually (not via systemd):**
   ```bash
   systemctl stop openclaw
   ANTHROPIC_API_KEY=sk-ant-... openclaw gateway --port 3000 --bind lan
   ```
   This might show more detailed errors

### Current Instance Config
```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4"
      }
    }
  },
  "gateway": {
    "mode": "local",
    "bind": "lan",
    "port": 3000,
    "auth": {
      "token": "<generated-at-deploy>"
    }
  },
  "channels": {
    "slack": {
      "enabled": true,
      "appToken": "<your-slack-app-token>",
      "botToken": "<per-workspace-bot-token>",
      "dm": {
        "enabled": true,
        "policy": "open",
        "allowFrom": ["*"]
      },
      "groupPolicy": "open"
    }
  }
}
```
