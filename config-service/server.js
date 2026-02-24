/**
 * Deep Signal Config Service
 * Runs on EC2, handles SSH configuration of client instances
 * 
 * POST /configure-slack
 * {
 *   domain: "client.ds.jgiebz.com",
 *   botToken: "xoxb-...",
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
app.use(cors());

const PORT = process.env.PORT || 8891;
const SSH_KEY_PATH = process.env.SSH_KEY_PATH || path.join(process.env.HOME, '.ssh/hetzner_deepsignal');
const API_SECRET = process.env.CONFIG_API_SECRET || 'ds-config-secret-2026';

// Shared Slack app credentials for all Deep Signal clients
const SLACK_SIGNING_SECRET = '9732b3681b946a54a59aaafa67cd4ae9';
const APP_TOKEN = process.env.SLACK_APP_TOKEN || '';

// Auth middleware
function authMiddleware(req, res, next) {
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

// Configure Telegram on an instance
app.post('/configure-telegram', authMiddleware, async (req, res) => {
  const { domain, gatewayToken, telegramBotToken } = req.body;
  
  if (!domain || !telegramBotToken) {
    return res.status(400).json({ error: 'Missing required fields: domain, telegramBotToken' });
  }
  
  console.log(`Configuring Telegram for ${domain}`);
  
  const ssh = new NodeSSH();
  
  try {
    const dns = require('dns').promises;
    let ip;
    try {
      const result = await dns.resolve4(domain);
      ip = result[0];
    } catch (e) {
      return res.status(400).json({ error: `Could not resolve domain: ${domain}` });
    }
    
    if (!fs.existsSync(SSH_KEY_PATH)) {
      return res.status(500).json({ error: 'SSH key not found' });
    }
    
    await ssh.connect({
      host: ip,
      username: 'root',
      privateKey: fs.readFileSync(SSH_KEY_PATH, 'utf8'),
      readyTimeout: 10000,
    });
    
    // Read current config
    const configResult = await ssh.execCommand('cat /root/.openclaw/openclaw.json 2>/dev/null || echo "{}"');
    let config;
    try {
      const configStr = configResult.stdout.replace(/\/\/.*$/gm, '').replace(/,(\s*[}\]])/g, '$1');
      config = JSON.parse(configStr);
    } catch (e) {
      config = {};
    }
    
    // Add Telegram channel
    if (!config.channels) config.channels = {};
    config.channels.telegram = {
      enabled: true,
      botToken: telegramBotToken,
    };
    
    const newConfigStr = JSON.stringify(config, null, 2);
    await ssh.execCommand(`cat > /root/.openclaw/openclaw.json << 'EOFCONFIG'
${newConfigStr}
EOFCONFIG`);
    
    // Restart OpenClaw
    await ssh.execCommand('systemctl restart openclaw');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const statusResult = await ssh.execCommand('systemctl is-active openclaw 2>/dev/null');
    const isRunning = statusResult.stdout.includes('active');
    
    ssh.dispose();
    
    res.json({
      success: true,
      domain,
      isRunning,
      message: 'Telegram configured successfully',
    });
    
  } catch (error) {
    console.error('Telegram configuration failed:', error);
    ssh.dispose();
    res.status(500).json({ error: 'Configuration failed', details: error.message });
  }
});

// Configure any channel generically
app.post('/configure-channel', authMiddleware, async (req, res) => {
  const { domain, channelType, channelConfig } = req.body;
  
  if (!domain || !channelType || !channelConfig) {
    return res.status(400).json({ error: 'Missing required fields: domain, channelType, channelConfig' });
  }
  
  console.log(`Configuring ${channelType} for ${domain}`);
  
  const ssh = new NodeSSH();
  
  try {
    const dns = require('dns').promises;
    const result = await dns.resolve4(domain);
    const ip = result[0];
    
    if (!fs.existsSync(SSH_KEY_PATH)) {
      return res.status(500).json({ error: 'SSH key not found' });
    }
    
    await ssh.connect({
      host: ip,
      username: 'root',
      privateKey: fs.readFileSync(SSH_KEY_PATH, 'utf8'),
      readyTimeout: 10000,
    });
    
    const configResult = await ssh.execCommand('cat /root/.openclaw/openclaw.json 2>/dev/null || echo "{}"');
    let config;
    try {
      config = JSON.parse(configResult.stdout.replace(/\/\/.*$/gm, '').replace(/,(\s*[}\]])/g, '$1'));
    } catch (e) {
      config = {};
    }
    
    if (!config.channels) config.channels = {};
    config.channels[channelType] = { enabled: true, ...channelConfig };
    
    const newConfigStr = JSON.stringify(config, null, 2);
    await ssh.execCommand(`cat > /root/.openclaw/openclaw.json << 'EOFCONFIG'
${newConfigStr}
EOFCONFIG`);
    
    await ssh.execCommand('systemctl restart openclaw');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const statusResult = await ssh.execCommand('systemctl is-active openclaw 2>/dev/null');
    
    ssh.dispose();
    
    res.json({
      success: true,
      domain,
      channelType,
      isRunning: statusResult.stdout.includes('active'),
      message: `${channelType} configured successfully`,
    });
    
  } catch (error) {
    console.error(`${channelType} configuration failed:`, error);
    ssh.dispose();
    res.status(500).json({ error: 'Configuration failed', details: error.message });
  }
});

// Read instance config
app.get('/instance-config/:domain', authMiddleware, async (req, res) => {
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
    
    const configResult = await ssh.execCommand('cat /root/.openclaw/openclaw.json 2>/dev/null || echo "{}"');
    const soulResult = await ssh.execCommand('cat /root/.openclaw/SOUL.md 2>/dev/null || echo ""');
    
    ssh.dispose();
    
    let config = {};
    try { config = JSON.parse(configResult.stdout); } catch (e) {}
    
    res.json({
      domain,
      config,
      soul: soulResult.stdout,
      channels: config.channels || {},
    });
    
  } catch (error) {
    ssh.dispose();
    res.status(500).json({ error: error.message });
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

app.listen(PORT, () => {
  console.log(`Deep Signal Config Service running on port ${PORT}`);
});
