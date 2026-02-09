import { NextResponse } from 'next/server';

const CONFIG_SERVICE_URL = process.env.CONFIG_SERVICE_URL || 'https://dsconfig.jgiebz.com';
const CONFIG_API_SECRET = process.env.CONFIG_API_SECRET;
const HETZNER_API_TOKEN = process.env.HETZNER_API_TOKEN;
const DOMAIN_SUFFIX = 'ds.jgiebz.com';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!CONFIG_API_SECRET) {
    return NextResponse.json({ error: 'Config service not configured' }, { status: 500 });
  }

  try {
    const { id } = await params;

    // Look up the instance domain from Hetzner
    if (!HETZNER_API_TOKEN) {
      return NextResponse.json({ error: 'Hetzner API not configured' }, { status: 500 });
    }

    const serverRes = await fetch(`https://api.hetzner.cloud/v1/servers/${id}`, {
      headers: { 'Authorization': `Bearer ${HETZNER_API_TOKEN}` },
    });

    if (!serverRes.ok) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    const serverData = await serverRes.json();
    const clientLabel = serverData.server?.labels?.client;

    if (!clientLabel) {
      return NextResponse.json({ error: 'Instance has no client label' }, { status: 400 });
    }

    const domain = `${clientLabel}.${DOMAIN_SUFFIX}`;

    // Call config service to restart OpenClaw via SSH
    const res = await fetch(`${CONFIG_SERVICE_URL}/restart-instance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG_API_SECRET}`,
      },
      body: JSON.stringify({ domain }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json({ error: error.error || 'Restart failed' }, { status: res.status });
    }

    const result = await res.json();

    return NextResponse.json({
      success: true,
      domain,
      message: result.message || 'Instance restart initiated',
    });
  } catch (error: any) {
    console.error('Restart instance error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
