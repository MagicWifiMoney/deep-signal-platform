import { NextResponse } from 'next/server';

const HETZNER_API_TOKEN = process.env.HETZNER_API_TOKEN;
const HETZNER_API = 'https://api.hetzner.cloud/v1';

const CLOUD_INIT_SCRIPT = `#!/bin/bash
# Deep Signal Instance Bootstrap

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# Install OpenClaw
npm install -g openclaw

# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Create OpenClaw config directory
mkdir -p /root/.openclaw

# Create basic config
cat > /root/.openclaw/openclaw.json << 'EOF'
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
    "port": 3000
  },
  "commands": {
    "restart": true
  }
}
EOF

# Create systemd service
cat > /etc/systemd/system/openclaw.service << 'EOF'
[Unit]
Description=OpenClaw Gateway
After=network.target

[Service]
Type=simple
User=root
Environment=OPENCLAW_GATEWAY_TOKEN=ds-auto-generated
ExecStart=/usr/bin/openclaw gateway --port 3000 --bind lan
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable openclaw

echo "Deep Signal bootstrap complete"
`;

export async function POST(request: Request) {
  if (!HETZNER_API_TOKEN) {
    return NextResponse.json(
      { error: 'Hetzner API not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { name, region = 'ash', serverType = 'cpx21' } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Instance name is required' },
        { status: 400 }
      );
    }

    // Sanitize name for hostname
    const hostname = `deepsignal-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    // First, get or create SSH key
    const sshKeysRes = await fetch(`${HETZNER_API}/ssh_keys`, {
      headers: {
        'Authorization': `Bearer ${HETZNER_API_TOKEN}`,
      },
    });
    const sshKeysData = await sshKeysRes.json();
    const sshKeyId = sshKeysData.ssh_keys?.[0]?.id;

    if (!sshKeyId) {
      return NextResponse.json(
        { error: 'No SSH key found in Hetzner account' },
        { status: 400 }
      );
    }

    // Create the server
    const createRes = await fetch(`${HETZNER_API}/servers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HETZNER_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: hostname,
        server_type: serverType,
        location: region,
        image: 'ubuntu-24.04',
        ssh_keys: [sshKeyId],
        user_data: CLOUD_INIT_SCRIPT,
        start_after_create: true,
        labels: {
          'managed-by': 'deep-signal',
          'client': name,
        },
      }),
    });

    if (!createRes.ok) {
      const error = await createRes.json();
      return NextResponse.json(
        { error: error.error?.message || 'Failed to create server' },
        { status: createRes.status }
      );
    }

    const serverData = await createRes.json();

    return NextResponse.json({
      success: true,
      instance: {
        id: serverData.server.id,
        name: serverData.server.name,
        ip: serverData.server.public_net?.ipv4?.ip,
        status: 'provisioning',
        message: 'Instance created. OpenClaw will be ready in ~2 minutes.',
      },
    });
  } catch (error) {
    console.error('Deploy error:', error);
    return NextResponse.json(
      { error: 'Failed to deploy instance' },
      { status: 500 }
    );
  }
}
