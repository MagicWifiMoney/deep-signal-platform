import { NextResponse } from 'next/server';
import { getAllCachedInstances, preloadInstances } from '@/lib/instance-registry';

/**
 * Check Slack integration status
 * GET /api/slack/status - Get cached instances
 * POST /api/slack/status - Preload instances from Hetzner
 */

export async function GET() {
  const instances = getAllCachedInstances();
  
  return NextResponse.json({
    status: 'ok',
    cachedInstances: instances.length,
    instances: instances.map(i => ({
      teamId: i.teamId,
      teamName: i.teamName,
      domain: i.domain,
      installedAt: i.installedAt,
    })),
    timestamp: new Date().toISOString(),
  });
}

export async function POST() {
  const count = await preloadInstances();
  const instances = getAllCachedInstances();
  
  return NextResponse.json({
    status: 'ok',
    preloaded: count,
    cachedInstances: instances.length,
    instances: instances.map(i => ({
      teamId: i.teamId,
      teamName: i.teamName,
      domain: i.domain,
    })),
    timestamp: new Date().toISOString(),
  });
}
