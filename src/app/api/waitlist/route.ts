/**
 * POST /api/waitlist
 *
 * Captures waitlist signups when the platform is at server capacity.
 * Sends an email notification to Jake via Resend so nothing falls through the cracks.
 */
import { NextResponse } from 'next/server';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFY_EMAIL = 'jake.giebel@gmail.com';
const FROM_EMAIL = 'waitlist@deepsignal.ai';

export async function POST(request: Request) {
  let body: { email: string; agentName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  const agentName = (body.agentName || 'Agent').trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email address required' }, { status: 400 });
  }

  // Send notification via Resend - best effort, don't block the response
  if (RESEND_API_KEY) {
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: NOTIFY_EMAIL,
        subject: `🎯 Waitlist signup: ${agentName} (${email})`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #0f172a; margin-bottom: 8px;">New Waitlist Signup</h2>
            <p style="color: #64748b; margin-bottom: 24px;">${timestamp} CST</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600; width: 140px;">Email</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600;">Agent Name</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0;">${agentName}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600;">Reason</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0;">Server capacity full at deploy time</td>
              </tr>
            </table>
            
            <p style="color: #64748b; font-size: 14px;">
              This person completed the full onboarding wizard but couldn't deploy because Hetzner quota was hit.
              They're a hot lead - reached the deploy step with a named agent.
            </p>
          </div>
        `,
      }),
    }).catch((e) => console.error('Resend error:', e));
  } else {
    console.log(`[waitlist] No RESEND_API_KEY - would have notified about: ${email} (${agentName})`);
  }

  return NextResponse.json({ success: true });
}
