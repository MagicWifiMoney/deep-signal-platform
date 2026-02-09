import { NextResponse } from 'next/server';

const HETZNER_API_TOKEN = process.env.HETZNER_API_TOKEN;
const HETZNER_API = 'https://api.hetzner.cloud/v1';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const DOMAIN_SUFFIX = 'ds.jgiebz.com';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!HETZNER_API_TOKEN) {
    return NextResponse.json({ error: 'Hetzner API not configured' }, { status: 500 });
  }

  try {
    const { id } = await params;

    // Get server details first (for DNS cleanup)
    const serverRes = await fetch(`${HETZNER_API}/servers/${id}`, {
      headers: { 'Authorization': `Bearer ${HETZNER_API_TOKEN}` },
    });

    if (!serverRes.ok) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    const serverData = await serverRes.json();
    const clientLabel = serverData.server?.labels?.client;

    // Delete the server
    const deleteRes = await fetch(`${HETZNER_API}/servers/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${HETZNER_API_TOKEN}` },
    });

    if (!deleteRes.ok) {
      const error = await deleteRes.text();
      return NextResponse.json({ error: `Failed to delete server: ${error}` }, { status: deleteRes.status });
    }

    // Clean up DNS record if possible
    let dnsDeleted = false;
    if (clientLabel && CLOUDFLARE_API_TOKEN && CLOUDFLARE_ZONE_ID) {
      const domain = `${clientLabel}.${DOMAIN_SUFFIX}`;
      try {
        const dnsRes = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records?name=${domain}`,
          { headers: { 'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}` } }
        );
        const dnsData = await dnsRes.json();
        if (dnsData.result?.length > 0) {
          await fetch(
            `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${dnsData.result[0].id}`,
            {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}` },
            }
          );
          dnsDeleted = true;
        }
      } catch (e) {
        console.error('DNS cleanup failed:', e);
      }
    }

    return NextResponse.json({
      success: true,
      deleted: id,
      dnsDeleted,
    });
  } catch (error: any) {
    console.error('Delete instance error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
