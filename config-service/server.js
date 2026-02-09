/**
 * Deep Signal Config Service
 * Runs on EC2, handles SSH configuration of client instances
 * 
 * POST /configure-slack
 * {
 *   domain: "client.ds.jgiebz.com",
 *   botToken: ""SLACK_BOT_TOKEN"",
 *   signingSecret: "...",
 *   teamId: "T...",
 *   teamName: "..."
 * }
 */

const express = require('express');
const { NodeSSH } = require('node-ssh');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors({
  origin: [
    'https://deep-signal-platform.vercel.app',
    'https://deepsignal.ai',
    process.env.ALLOWED_ORIGIN,
  ].filter(Boolean),
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const rateLimit = {};
function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  if (!rateLimit[ip]) rateLimit[ip] = [];
  rateLimit[ip] = rateLimit[ip].filter(t => now - t < 60000);
  if (rateLimit[ip].length >= 30) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  rateLimit[ip].push(now);
  next();
}
app.use(rateLimitMiddleware);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

const PORT = process.env.PORT || 8891;
const SSH_KEY_PATH = process.env.SSH_KEY_PATH || path.join(process.env.HOME, '.ssh/hetzner_deepsignal');
const API_SECRET = process.env.CONFIG_API_SECRET;

// Shared Slack app credentials for all Deep Signal clients
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
const APP_TOKEN = process.env.SLACK_APP_TOKEN;

// Auth middleware
function authMiddleware(req, res, next) {
  if (!API_SECRET) {
    return res.status(503).json({ error: 'Service not configured' });
  }
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${API_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'deep-signal-config', timestamp: new Date().toISOString() });
});

// Configure Slack on an instance
app.post('/configure-slack', authMiddleware, async (req, res) => {
  const { domain, botToken, teamId, teamName } = req.body;
  
  if (!domain || !botToken) {
    return res.status(400).json({ error: 'Missing required fields: domain, botToken' });
  }

  // Validate domain is a known Deep Signal subdomain
  if (!domain.endsWith('.ds.jgiebz.com') && !domain.endsWith('.deepsignal.ai')) {
    return res.status(400).json({ error: 'Invalid domain: must be a Deep Signal subdomain' });
  }
  
  console.log(`Configuring Slack for ${domain} (team: ${teamName})`);
  
  const ssh = new NodeSSH();
  
  try {
    // Resolve domain to IP
    const dns = require('dns').promises;
    let ip;
    try {
      const result = await dns.resolve4(domain);
      ip = result[0];
    } catch (e) {
      return res.status(400).json({ error: `Could not resolve domain: ${domain}` });
    }
    
    console.log(`Resolved ${domain} to ${ip}`);
    
    // Check SSH key exists
    if (!fs.existsSync(SSH_KEY_PATH)) {
      return res.status(500).json({ error: 'SSH key not found' });
    }
    
    // Connect via SSH
    await ssh.connect({
      host: ip,
      username: 'root',
      privateKey: fs.readFileSync(SSH_KEY_PATH, 'utf8'),
      readyTimeout: 10000,
    });
    
    console.log(`SSH connected to ${ip}`);
    
    // Read current OpenClaw config (check both openclaw.json and config.json5)
    const configResult = await ssh.execCommand('cat /root/.openclaw/openclaw.json 2>/dev/null || cat /root/.openclaw/config.json5 2>/dev/null || cat /root/.openclaw/config.json 2>/dev/null || echo "{}"');
    let config;
    
    try {
      // Parse JSON5/JSON - handle comments
      const configStr = configResult.stdout.replace(/\/\/.*$/gm, '').replace(/,(\s*[}\]])/g, '$1');
      config = JSON.parse(configStr);
      console.log('Loaded existing config from instance');
    } catch (e) {
      console.log('Could not parse existing config, starting fresh');
      config = {};
    }
    
    // Update Slack configuration (Socket Mode - most reliable)
    if (!config.channels) config.channels = {};
    config.channels.slack = {
      enabled: true,
      appToken: APP_TOKEN,  // Shared across all Deep Signal clients
      botToken: botToken,   // Per-workspace from OAuth
    };
    
    console.log(`Configured Slack for team ${teamName} (${teamId})`);
    
    // Write updated config (use openclaw.json as primary)
    const newConfigStr = JSON.stringify(config, null, 2);
    await ssh.execCommand(`cat > /root/.openclaw/openclaw.json << 'EOFCONFIG'
${newConfigStr}
EOFCONFIG`);
    
    console.log('Wrote config to /root/.openclaw/openclaw.json');
    
    console.log('Config written, restarting OpenClaw...');
    
    // Restart OpenClaw to pick up new config
    const restartResult = await ssh.execCommand('systemctl restart openclaw || (pkill -f openclaw && sleep 2 && cd /root && openclaw gateway start -d)');
    console.log('Restart result:', restartResult.stdout, restartResult.stderr);
    
    // Wait a moment for restart
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Verify OpenClaw is running
    const statusResult = await ssh.execCommand('systemctl is-active openclaw 2>/dev/null || pgrep -f openclaw');
    const isRunning = statusResult.stdout.includes('active') || statusResult.stdout.trim().length > 0;
    
    ssh.dispose();
    
    console.log(`Configuration complete for ${domain}, running: ${isRunning}`);
    
    res.json({
      success: true,
      domain,
      teamId,
      teamName,
      isRunning,
      message: 'Slack configured successfully',
    });
    
  } catch (error) {
    console.error('SSH configuration failed:', error);
    ssh.dispose();
    res.status(500).json({ 
      error: 'Configuration failed', 
      details: error.message 
    });
  }
});

// Get instance status
app.get('/instance-status/:domain', authMiddleware, async (req, res) => {
  const { domain } = req.params;
  
  const ssh = new NodeSSH();
  
  try {
    const dns = require('dns').promises;
    const result = await dns.resolve4(domain);
    const ip = result[0];
    
    await ssh.connect({
      host: ip,
      username: 'root',
      privateKey: fs.readFileSync(SSH_KEY_PATH, 'utf8'),
      readyTimeout: 10000,
    });
    
    // Get OpenClaw status
    const statusResult = await ssh.execCommand('openclaw status 2>&1 || systemctl status openclaw 2>&1');
    const configResult = await ssh.execCommand('cat /root/.openclaw/config.json 2>/dev/null | jq -r ".channels.slack.enabled // false"');
    
    ssh.dispose();
    
    res.json({
      domain,
      ip,
      status: statusResult.stdout,
      slackEnabled: configResult.stdout.trim() === 'true',
    });
    
  } catch (error) {
    ssh.dispose();
    res.status(500).json({ error: error.message });
  }
});

// Restart OpenClaw on an instance
app.post('/restart-instance', authMiddleware, async (req, res) => {
  const { domain } = req.body;

  if (!domain) {
    return res.status(400).json({ error: 'Missing required field: domain' });
  }

  if (!domain.endsWith('.ds.jgiebz.com') && !domain.endsWith('.deepsignal.ai')) {
    return res.status(400).json({ error: 'Invalid domain: must be a Deep Signal subdomain' });
  }

  const ssh = new NodeSSH();

  try {
    const dns = require('dns').promises;
    const result = await dns.resolve4(domain);
    const ip = result[0];

    await ssh.connect({
      host: ip,
      username: 'root',
      privateKey: fs.readFileSync(SSH_KEY_PATH, 'utf8'),
      readyTimeout: 10000,
    });

    const restartResult = await ssh.execCommand('systemctl restart openclaw');
    await new Promise(resolve => setTimeout(resolve, 3000));
    const statusResult = await ssh.execCommand('systemctl is-active openclaw');
    const isRunning = statusResult.stdout.trim() === 'active';

    ssh.dispose();

    res.json({
      success: true,
      domain,
      isRunning,
      message: isRunning ? 'OpenClaw restarted successfully' : 'Restart attempted but service may not be running',
    });
  } catch (error) {
    ssh.dispose();
    res.status(500).json({ error: 'Restart failed', details: error.message });
  }
});

// Validate required env vars at startup
if (!API_SECRET) {
  console.error('FATAL: CONFIG_API_SECRET environment variable is required');
  process.exit(1);
}
if (!APP_TOKEN) {
  console.warn('WARNING: SLACK_APP_TOKEN not set - Slack configuration will be incomplete');
}

app.listen(PORT, () => {
  console.log(`Deep Signal Config Service running on port ${PORT}`);
});
