import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getInstanceByTeamId } from '@/lib/instance-registry';

// Hardcoded for now - shared across all Deep Signal Slack app installations
const SLACK_SIGNING_SECRET = '9732b3681b946a54a59aaafa67cd4ae9';

/**
 * Verify Slack request signature
 */
function verifySlackSignature(
  signature: string,
  timestamp: string,
  body: string
): boolean {
  if (!SLACK_SIGNING_SECRET) {
    console.warn('No SLACK_SIGNING_SECRET configured');
    return false;
  }

  // Check timestamp is within 5 minutes
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
    console.warn('Slack request timestamp too old');
    return false;
  }

  // Compute signature
  const sigBasestring = `v0:${timestamp}:${body}`;
  const mySignature = 'v0=' + crypto
    .createHmac('sha256', SLACK_SIGNING_SECRET)
    .update(sigBasestring)
    .digest('hex');

  // Compare signatures
  try {
    return crypto.timingSafeEqual(
      Buffer.from(mySignature),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

/**
 * Forward event to instance
 */
async function forwardToInstance(
  domain: string,
  event: any,
  headers: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  const instanceUrl = `https://${domain}/slack/events`;
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(instanceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-From': 'deep-signal-platform',
        'X-Slack-Request-Timestamp': headers['x-slack-request-timestamp'] || '',
        'X-Slack-Signature': headers['x-slack-signature'] || '',
      },
      body: JSON.stringify(event),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (res.ok) {
      console.log(`Event forwarded to ${domain}`);
      return { success: true };
    } else {
      const text = await res.text();
      console.error(`Instance returned ${res.status}: ${text}`);
      return { success: false, error: `Instance returned ${res.status}` };
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(`Timeout forwarding to ${domain}`);
      return { success: false, error: 'Timeout' };
    }
    console.error(`Failed to forward to ${domain}:`, error.message);
    return { success: false, error: error.message };
  }
}

export async function POST(request: Request) {
  // Get raw body for signature verification
  const body = await request.text();
  
  // Parse event first to check for URL verification
  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Handle URL verification challenge (no signature check needed)
  if (event.type === 'url_verification') {
    console.log('Slack URL verification challenge received');
    return NextResponse.json({ challenge: event.challenge });
  }

  // Get headers for signature verification
  const signature = request.headers.get('x-slack-signature') || '';
  const timestamp = request.headers.get('x-slack-request-timestamp') || '';
  
  // Verify signature for all other events
  if (!verifySlackSignature(signature, timestamp, body)) {
    console.error('Invalid Slack signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Get team_id from event
  const teamId = event.team_id || event.team?.id;
  
  if (!teamId) {
    console.error('No team_id in event:', event.type);
    // Still return 200 to acknowledge receipt
    return NextResponse.json({ ok: true, warning: 'No team_id' });
  }

  // Look up instance for this team
  const instance = await getInstanceByTeamId(teamId);
  
  if (!instance) {
    console.error(`No instance found for team: ${teamId}`);
    // Return 200 to prevent Slack from retrying
    return NextResponse.json({ ok: true, warning: 'Unknown team' });
  }

  // Forward event to instance (async, don't wait)
  // Slack expects response within 3 seconds
  const headers = {
    'x-slack-request-timestamp': timestamp,
    'x-slack-signature': signature,
  };

  // Fire and forget - respond immediately
  forwardToInstance(instance.domain, event, headers).then(result => {
    if (!result.success) {
      console.error(`Failed to forward event to ${instance.domain}: ${result.error}`);
      // Could implement retry logic here
    }
  });

  // Acknowledge receipt immediately
  return NextResponse.json({ ok: true });
}

// Also handle GET for Slack's URL verification
export async function GET(request: Request) {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Slack events endpoint',
    timestamp: new Date().toISOString(),
  });
}
