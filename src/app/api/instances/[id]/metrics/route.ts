import { NextResponse } from 'next/server';

const HETZNER_API_TOKEN = process.env.HETZNER_API_TOKEN;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!HETZNER_API_TOKEN) {
    return NextResponse.json({ error: 'Hetzner API not configured' }, { status: 500 });
  }

  try {
    const { id } = await params;

    // Get server details from Hetzner
    const serverRes = await fetch(`https://api.hetzner.cloud/v1/servers/${id}`, {
      headers: { 'Authorization': `Bearer ${HETZNER_API_TOKEN}` },
    });
    
    if (!serverRes.ok) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }
    
    const serverData = await serverRes.json();
    const server = serverData.server;
    
    // Get metrics from Hetzner (last hour)
    const endTime = new Date().toISOString();
    const startTime = new Date(Date.now() - 3600000).toISOString();
    
    const metricsRes = await fetch(
      `https://api.hetzner.cloud/v1/servers/${id}/metrics?type=cpu,disk,network&start=${startTime}&end=${endTime}`,
      { headers: { 'Authorization': `Bearer ${HETZNER_API_TOKEN}` } }
    );
    
    let metrics = null;
    if (metricsRes.ok) {
      const metricsData = await metricsRes.json();
      metrics = metricsData.metrics;
    }
    
    // Calculate uptime from server creation
    const createdAt = new Date(server.created);
    const uptimeMs = Date.now() - createdAt.getTime();
    const uptimeHours = Math.floor(uptimeMs / 3600000);
    const uptimeDays = Math.floor(uptimeHours / 24);
    
    return NextResponse.json({
      id: server.id,
      name: server.name,
      status: server.status,
      serverType: server.server_type.name,
      datacenter: server.datacenter.name,
      publicIp: server.public_net.ipv4.ip,
      privateIp: server.private_net?.[0]?.ip || null,
      
      resources: {
        cores: server.server_type.cores,
        memory: server.server_type.memory,
        disk: server.server_type.disk,
      },
      
      uptime: {
        hours: uptimeHours,
        days: uptimeDays,
        since: createdAt.toISOString(),
      },

      metrics: metrics ? (() => {
        // Parse real CPU data from Hetzner timeseries
        const cpuTimeseries = metrics.timeseries?.cpu;
        const cpuValues = cpuTimeseries?.[0]?.values || [];
        const cpuNumbers = cpuValues.map((v: [number, string]) => parseFloat(v[1])).filter((n: number) => !isNaN(n));
        const cpuCurrent = cpuNumbers.length > 0 ? cpuNumbers[cpuNumbers.length - 1] : null;
        const cpuAvg = cpuNumbers.length > 0 ? cpuNumbers.reduce((a: number, b: number) => a + b, 0) / cpuNumbers.length : null;
        const cpuPeak = cpuNumbers.length > 0 ? Math.max(...cpuNumbers) : null;

        // Parse network data
        const netIn = metrics.timeseries?.network?.find((t: any) => t.name?.includes('in'));
        const netOut = metrics.timeseries?.network?.find((t: any) => t.name?.includes('out'));
        const netInValues = netIn?.values || [];
        const netOutValues = netOut?.values || [];
        const lastNetIn = netInValues.length > 0 ? parseFloat(netInValues[netInValues.length - 1][1]) : null;
        const lastNetOut = netOutValues.length > 0 ? parseFloat(netOutValues[netOutValues.length - 1][1]) : null;

        return {
          cpu: {
            current: cpuCurrent != null ? Math.round(cpuCurrent * 100) / 100 : null,
            avg: cpuAvg != null ? Math.round(cpuAvg * 100) / 100 : null,
            peak: cpuPeak != null ? Math.round(cpuPeak * 100) / 100 : null,
          },
          memory: {
            total: server.server_type.memory,
            // Note: Hetzner API doesn't provide memory usage — requires node_exporter or SSH
            used: null,
            percentage: null,
          },
          disk: {
            total: server.server_type.disk,
            // Note: Hetzner API doesn't provide disk usage — requires node_exporter or SSH
            used: null,
            percentage: null,
          },
          network: {
            inbound: lastNetIn != null ? Math.round(lastNetIn) : null,
            outbound: lastNetOut != null ? Math.round(lastNetOut) : null,
          },
        };
      })() : null,

      health: {
        status: server.status === 'running' ? 'unknown' : 'offline',
        lastCheck: new Date().toISOString(),
        note: 'Health checks require SSH or agent endpoint — not yet implemented',
      },
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
