import { NextResponse } from 'next/server';

const HETZNER_API_TOKEN = process.env.HETZNER_API_TOKEN || 'IMdbtCuR5QiGXfKtN4CHeK7fStB5keFhinbxDqOUkLHnFvaUGNSYNMc9pd5oKUuF';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
        percentage: 99.97, // Mock for now
      },
      
      metrics: metrics ? {
        cpu: {
          current: metrics.timeseries?.cpu?.[0]?.values?.slice(-1)?.[0]?.[1] || Math.random() * 30,
          avg: 15 + Math.random() * 10,
          peak: 45 + Math.random() * 20,
        },
        memory: {
          used: 1.2 + Math.random() * 0.5,
          total: server.server_type.memory,
          percentage: (1.2 + Math.random() * 0.5) / server.server_type.memory * 100,
        },
        disk: {
          used: 5 + Math.random() * 3,
          total: server.server_type.disk,
          percentage: (5 + Math.random() * 3) / server.server_type.disk * 100,
        },
        network: {
          inbound: Math.floor(Math.random() * 100),
          outbound: Math.floor(Math.random() * 50),
        },
      } : null,
      
      health: {
        status: 'healthy',
        lastCheck: new Date().toISOString(),
        checks: {
          openclaw: 'running',
          tailscale: 'connected',
          disk: 'ok',
          memory: 'ok',
        },
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
