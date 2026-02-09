import { NextResponse } from 'next/server';
import { saveInstanceMapping } from '@/lib/instance-registry';

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
const DOMAIN_SUFFIX = 'ds.jgiebz.com';

export async function GET(request: Request) {
  if (!SLACK_CLIENT_ID || !SLACK_CLIENT_SECRET) {
    console.error('Slack OAuth credentials not configured');
    return NextResponse.redirect(
      new URL('/setup/slack?error=server_configuration', request.url)
    );
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    console.error('Slack OAuth error:', error);
    return NextResponse.redirect(
      new URL(`/setup/slack?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/setup/slack?error=missing_code', request.url)
    );
  }

  // Decode state to get instance info
  let instanceInfo = { domain: '', instanceId: '' };
  try {
    if (state) {
      instanceInfo = JSON.parse(Buffer.from(state, 'base64').toString());
    }
  } catch (e) {
    console.error('Failed to decode state:', e);
  }

  // Exchange code for access token
  try {
    console.log('Slack OAuth exchange attempt:', {
      hasClientId: !!SLACK_CLIENT_ID,
      clientIdLength: SLACK_CLIENT_ID?.length,
      hasClientSecret: !!SLACK_CLIENT_SECRET,
      clientSecretLength: SLACK_CLIENT_SECRET?.length,
      codeLength: code?.length,
    });

    const tokenRes = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: SLACK_CLIENT_ID || '',
        client_secret: SLACK_CLIENT_SECRET || '',
        code,
        redirect_uri: 'https://deep-signal-platform.vercel.app/api/slack/callback',
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.ok) {
      console.error('Slack token exchange failed:', tokenData.error);
      return NextResponse.redirect(
        new URL(`/setup/slack?error=${encodeURIComponent(tokenData.error)}`, request.url)
      );
    }

    // Extract token and team info
    const {
      access_token,
      team,
      bot_user_id,
    } = tokenData;

    console.log('Slack OAuth success:', {
      team_id: team?.id,
      team_name: team?.name,
      bot_user_id,
      domain: instanceInfo.domain,
    });

    // Save the team → instance mapping
    if (team?.id && instanceInfo.domain) {
      await saveInstanceMapping({
        teamId: team.id,
        teamName: team.name || 'Unknown',
        domain: instanceInfo.domain,
        instanceId: parseInt(instanceInfo.instanceId) || 0,
        botToken: access_token, // Stored securely in KV
        installedAt: new Date().toISOString(),
      });

      // Also configure the instance with the bot token
      // This sends the token to the instance so it can make Slack API calls
      await configureInstanceSlack(instanceInfo.domain, {
        botToken: access_token,
        teamId: team.id,
        teamName: team.name,
        botUserId: bot_user_id,
      });
    }

    // Redirect to success page
    const successUrl = new URL('/setup/slack/success', request.url);
    successUrl.searchParams.set('team', team?.name || 'Unknown');
    successUrl.searchParams.set('domain', instanceInfo.domain);

    return NextResponse.redirect(successUrl);
  } catch (error: any) {
    console.error('Slack OAuth error:', error);
    return NextResponse.redirect(
      new URL(`/setup/slack?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}

/**
 * Configure Slack on the instance via SSH config service
 */
async function configureInstanceSlack(
  domain: string,
  config: {
    botToken: string;
    teamId: string;
    teamName: string;
    botUserId: string;
  }
): Promise<boolean> {
  if (!domain) return false;

  const configServiceUrl = 'https://dsconfig.jgiebz.com/configure-slack';
  const configApiSecret = process.env.CONFIG_API_SECRET;
  if (!configApiSecret) {
    console.error('CONFIG_API_SECRET not configured');
    return false;
  }
  
  try {
    console.log(`Configuring Slack on ${domain} via config service...`);
    
    const res = await fetch(configServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${configApiSecret}`,
      },
      body: JSON.stringify({
        domain,
        botToken: config.botToken,
        teamId: config.teamId,
        teamName: config.teamName,
      }),
    });

    const result = await res.json();
    
    if (res.ok && result.success) {
      console.log(`Slack configured on ${domain}: ${result.message}`);
      return true;
    } else {
      console.error(`Config service error for ${domain}:`, result.error || result);
      return false;
    }
  } catch (error: any) {
    console.error(`Failed to configure ${domain}:`, error.message);
    return false;
  }
}
