import { NextResponse } from 'next/server';

/**
 * @deprecated Use POST /api/onboard instead for full instance provisioning.
 * This route is kept for backwards compatibility but will be removed.
 */
export async function POST(request: Request) {
  return NextResponse.json(
    {
      error: 'This endpoint is deprecated. Use POST /api/onboard for instance provisioning.',
      redirect: '/api/onboard',
    },
    { status: 410 }
  );
}
