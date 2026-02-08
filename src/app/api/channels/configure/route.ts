import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { instanceId, channel, config } = body;

    if (!instanceId || !channel || !config) {
      return NextResponse.json(
        { error: 'Missing required fields: instanceId, channel, config' },
        { status: 400 }
      );
    }

    // Validate channel type
    const validChannels = ['whatsapp', 'slack', 'telegram', 'discord', 'teams', 'email'];
    if (!validChannels.includes(channel)) {
      return NextResponse.json(
        { error: `Invalid channel: ${channel}` },
        { status: 400 }
      );
    }

    // In production, this would:
    // 1. SSH into the instance or call its API
    // 2. Update the OpenClaw config
    // 3. Restart the gateway
    
    // For now, simulate the configuration
    console.log(`Configuring ${channel} on instance ${instanceId}:`, config);
    
    // Simulate delay
    await new Promise(r => setTimeout(r, 1500));

    // Validate channel-specific requirements
    const validationErrors: string[] = [];
    
    switch (channel) {
      case 'whatsapp':
        if (!config.phoneNumberId) validationErrors.push('Phone Number ID is required');
        if (!config.accessToken) validationErrors.push('Access Token is required');
        if (!config.webhookVerifyToken) validationErrors.push('Webhook Verify Token is required');
        break;
      case 'slack':
        if (!config.botToken) validationErrors.push('Bot Token is required');
        if (!config.signingSecret) validationErrors.push('Signing Secret is required');
        break;
      case 'telegram':
        if (!config.botToken) validationErrors.push('Bot Token is required');
        break;
      case 'discord':
        if (!config.botToken) validationErrors.push('Bot Token is required');
        if (!config.applicationId) validationErrors.push('Application ID is required');
        break;
      case 'teams':
        if (!config.appId) validationErrors.push('App ID is required');
        if (!config.appPassword) validationErrors.push('App Password is required');
        break;
      case 'email':
        if (!config.imapHost) validationErrors.push('IMAP Host is required');
        if (!config.smtpHost) validationErrors.push('SMTP Host is required');
        if (!config.email) validationErrors.push('Email is required');
        if (!config.password) validationErrors.push('Password is required');
        break;
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${channel} configured successfully`,
      instanceId,
      channel,
      status: 'pending_verification',
      // Webhook URL for the instance
      webhookUrl: `https://instance-${instanceId}.deepsignal.io/webhook/${channel}`,
    });
  } catch (error) {
    console.error('Error configuring channel:', error);
    return NextResponse.json(
      { error: 'Failed to configure channel' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const instanceId = searchParams.get('instanceId');

  if (!instanceId) {
    return NextResponse.json(
      { error: 'instanceId is required' },
      { status: 400 }
    );
  }

  // Return mock channel status for now
  return NextResponse.json({
    instanceId,
    channels: {
      whatsapp: { enabled: false, configured: false, status: 'not_configured' },
      slack: { enabled: false, configured: false, status: 'not_configured' },
      telegram: { enabled: false, configured: false, status: 'not_configured' },
      discord: { enabled: false, configured: false, status: 'not_configured' },
      teams: { enabled: false, configured: false, status: 'not_configured' },
      email: { enabled: false, configured: false, status: 'not_configured' },
      web: { enabled: true, configured: true, status: 'active' },
    },
  });
}
