import { NextResponse } from 'next/server';

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

export async function GET() {
  // Test actual Cloudflare API connectivity
  let cfTest = 'not tested';
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}`, {
      headers: { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    cfTest = data.success ? 'OK' : JSON.stringify(data.errors);
  } catch (e: unknown) {
    cfTest = `fetch error: ${e instanceof Error ? e.message : 'unknown'}`;
  }

  return NextResponse.json({
    hasToken: !!CLOUDFLARE_API_TOKEN,
    tokenPrefix: CLOUDFLARE_API_TOKEN?.slice(0, 8) || 'missing',
    hasZoneId: !!CLOUDFLARE_ZONE_ID,
    zoneId: CLOUDFLARE_ZONE_ID || 'missing',
    cfApiTest: cfTest,
  });
}
