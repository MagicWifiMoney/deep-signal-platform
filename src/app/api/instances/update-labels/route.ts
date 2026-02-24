import { NextResponse } from 'next/server';

const HETZNER_API_TOKEN = process.env.HETZNER_API_TOKEN;
const HETZNER_API = 'https://api.hetzner.cloud/v1';
const ADMIN_SECRET = process.env.CONFIG_API_SECRET || 'ds-config-secret-2026';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!HETZNER_API_TOKEN) {
    return NextResponse.json({ error: 'Hetzner API not configured' }, { status: 500 });
  }

  const { serverId, labels } = await request.json();
  if (!serverId || !labels) {
    return NextResponse.json({ error: 'Missing serverId or labels' }, { status: 400 });
  }

  try {
    const getRes = await fetch(`${HETZNER_API}/servers/${serverId}`, {
      headers: { 'Authorization': `Bearer ${HETZNER_API_TOKEN}` },
    });
    if (!getRes.ok) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }
    const serverData = await getRes.json();
    const currentLabels = serverData.server?.labels || {};
    const updatedLabels = { ...currentLabels, ...labels };

    const updateRes = await fetch(`${HETZNER_API}/servers/${serverId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${HETZNER_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ labels: updatedLabels }),
    });

    if (!updateRes.ok) {
      const err = await updateRes.json();
      return NextResponse.json({ error: err.error?.message || 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ success: true, labels: updatedLabels });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
