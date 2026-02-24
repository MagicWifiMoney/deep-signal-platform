import { NextResponse } from 'next/server';

const CONFIG_SERVICE = 'https://dsconfig.jgiebz.com';
const CONFIG_AUTH = 'Bearer ds-config-secret-2026';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { domain, gatewayToken, channel, config } = body;

    if (!domain || !channel || !config) {
      return NextResponse.json(
        { error: 'Missing required fields: domain, channel, config' },
        { status: 400 }
      );
    }

    const validChannels = ['whatsapp', 'slack', 'telegram', 'discord', 'teams', 'email'];
    if (!validChannels.includes(channel)) {
      return NextResponse.json({ error: `Invalid channel: ${channel}` }, { status: 400 });
    }

    // Route to the appropriate config service endpoint
    if (channel === 'telegram') {
      const botToken = config.botToken || config.token;
      if (!botToken) {
        return NextResponse.json({ error: 'Bot token is required' }, { status: 400 });
      }

      const res = await fetch(`${CONFIG_SERVICE}/configure-telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': CONFIG_AUTH,
        },
        body: JSON.stringify({
          domain,
          gatewayToken,
          telegramToken: botToken,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: `Config service error: ${err}` }, { status: 502 });
      }

      return NextResponse.json({
        success: true,
        message: 'Telegram connected! Send a message to your bot to start chatting.',
        channel: 'telegram',
      });
    }

    if (channel === 'slack') {
      if (!config.botToken) {
        return NextResponse.json({ error: 'Bot token is required' }, { status: 400 });
      }

      const res = await fetch(`${CONFIG_SERVICE}/configure-slack`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': CONFIG_AUTH,
        },
        body: JSON.stringify({
          domain,
          gatewayToken,
          slackBotToken: config.botToken,
          slackAppToken: config.appToken || '',
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: `Config service error: ${err}` }, { status: 502 });
      }

      return NextResponse.json({
        success: true,
        message: 'Slack connected!',
        channel: 'slack',
      });
    }

    if (channel === 'discord') {
      if (!config.botToken) {
        return NextResponse.json({ error: 'Bot token is required' }, { status: 400 });
      }

      const res = await fetch(`${CONFIG_SERVICE}/configure-channel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': CONFIG_AUTH,
        },
        body: JSON.stringify({
          domain,
          gatewayToken,
          channel: 'discord',
          channelConfig: { token: config.botToken },
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: `Config service error: ${err}` }, { status: 502 });
      }

      return NextResponse.json({
        success: true,
        message: 'Discord connected!',
        channel: 'discord',
      });
    }

    // Generic fallback
    return NextResponse.json({ error: `${channel} setup not yet automated. Configure manually via SSH.` }, { status: 501 });
  } catch (error) {
    console.error('Error configuring channel:', error);
    return NextResponse.json({ error: 'Failed to configure channel' }, { status: 500 });
  }
}
