import { NextRequest, NextResponse } from 'next/server';

const HETZNER_API = 'https://api.hetzner.cloud/v1';
const HETZNER_API_TOKEN = process.env.HETZNER_API_TOKEN;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID || '1af99eb0c0c30a67f2f272d4dff24cc8';
const DOMAIN_SUFFIX = 'ds.jgiebz.com';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!HETZNER_API_TOKEN) {
    return NextResponse.json({ error: 'Hetzner API not configured' }, { status: 500 });
  }

  // Get server info first (for DNS cleanup)
  const serverRes = await fetch(`${HETZNER_API}/servers/${id}`, {
    headers: { Authorization: `Bearer ${HETZNER_API_TOKEN}` },
  });

  if (!serverRes.ok) {
    return NextResponse.json({ error: 'Server not found' }, { status: 404 });
  }

  const { server } = await serverRes.json();
  const serverName = server.name as string; // e.g. "deepsignal-testbot"
  const slug = serverName.replace(/^deepsignal-/, '');

  // Delete server
  const deleteRes = await fetch(`${HETZNER_API}/servers/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${HETZNER_API_TOKEN}` },
  });

  if (!deleteRes.ok) {
    const err = await deleteRes.text();
    return NextResponse.json({ error: `Failed to delete server: ${err}` }, { status: deleteRes.status });
  }

  // Clean up DNS records (both slug and full hostname variants)
  const dnsCleanup: string[] = [];
  if (CLOUDFLARE_API_TOKEN) {
    for (const name of [`${slug}.${DOMAIN_SUFFIX}`, `${serverName}.${DOMAIN_SUFFIX}`]) {
      try {
        const dnsRes = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records?name=${name}`,
          { headers: { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}` } }
        );
        const dnsData = await dnsRes.json();
        for (const record of dnsData.result || []) {
          await fetch(
            `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${record.id}`,
            { method: 'DELETE', headers: { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}` } }
          );
          dnsCleanup.push(name);
        }
      } catch { /* best effort */ }
    }
  }

  return NextResponse.json({
    success: true,
    deleted: { server: server.name, id: server.id },
    dnsCleanup,
  });
}
