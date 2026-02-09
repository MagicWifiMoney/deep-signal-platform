import { NextResponse } from 'next/server';

const HETZNER_API_TOKEN = process.env.HETZNER_API_TOKEN;
const HETZNER_API = 'https://api.hetzner.cloud/v1';

// Server type resources
const SERVER_RESOURCES: Record<string, { vcpu: number; ram: number; disk: number }> = {
  cpx11: { vcpu: 2, ram: 2, disk: 40 },
  cpx21: { vcpu: 3, ram: 4, disk: 80 },
  cpx31: { vcpu: 4, ram: 8, disk: 160 },
  cpx41: { vcpu: 8, ram: 16, disk: 240 },
  cpx51: { vcpu: 16, ram: 32, disk: 360 },
  cx11: { vcpu: 1, ram: 1, disk: 20 },
  cx21: { vcpu: 2, ram: 4, disk: 40 },
  cx31: { vcpu: 2, ram: 8, disk: 80 },
  cx41: { vcpu: 4, ram: 16, disk: 160 },
  cx51: { vcpu: 8, ram: 32, disk: 240 },
};

interface UsageData {
  totalResources: {
    vcpu: number;
    ramGB: number;
    diskGB: number;
    instances: number;
  };
  instances: {
    id: number;
    name: string;
    serverType: string;
    resources: {
      vcpu: number;
      ramGB: number;
      diskGB: number;
    };
    status: string;
    uptime: {
      days: number;
      hours: number;
      percent: number;
    };
    datacenter: string;
    createdAt: string;
  }[];
  resourceDistribution: {
    serverType: string;
    count: number;
    totalVCPU: number;
    totalRAM: number;
    totalDisk: number;
  }[];
  timeline: {
    date: string;
    instancesCreated: number;
    instanceCount: number;
  }[];
}

async function getHetznerServers(): Promise<any[]> {
  if (!HETZNER_API_TOKEN) {
    console.error('HETZNER_API_TOKEN not set');
    return [];
  }

  try {
    const res = await fetch(`${HETZNER_API}/servers`, {
      headers: {
        'Authorization': `Bearer ${HETZNER_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Hetzner API error:', res.status);
      return [];
    }

    const data = await res.json();
    return data.servers || [];
  } catch (error) {
    console.error('Failed to fetch Hetzner servers:', error);
    return [];
  }
}

function calculateUptime(createdDate: string, status: string): { days: number; hours: number; percent: number } {
  const created = new Date(createdDate);
  const now = new Date();
  const diffTime = now.getTime() - created.getTime();
  const totalHours = diffTime / (1000 * 60 * 60);
  const days = Math.floor(totalHours / 24);
  const hours = Math.floor(totalHours % 24);
  
  // If running, assume 99.9% uptime; if not, calculate based on status
  const percent = status === 'running' ? 99.9 : 0;
  
  return { days, hours, percent };
}

function generateTimeline(servers: any[]): { date: string; instancesCreated: number; instanceCount: number }[] {
  // Group servers by creation date
  const dateMap = new Map<string, number>();
  
  servers.forEach((server) => {
    const date = server.created.split('T')[0]; // YYYY-MM-DD
    dateMap.set(date, (dateMap.get(date) || 0) + 1);
  });
  
  // Sort by date and calculate cumulative count
  const sortedDates = Array.from(dateMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  let cumulative = 0;
  
  return sortedDates.map(([date, count]) => {
    cumulative += count;
    return {
      date,
      instancesCreated: count,
      instanceCount: cumulative,
    };
  });
}

export async function GET() {
  try {
    const servers = await getHetznerServers();
    
    if (servers.length === 0) {
      return NextResponse.json({
        error: 'No servers found or API token not configured',
        totalResources: { vcpu: 0, ramGB: 0, diskGB: 0, instances: 0 },
        instances: [],
        resourceDistribution: [],
        timeline: [],
      });
    }

    const instances = servers.map((server: any) => {
      const serverType = server.server_type?.name || 'unknown';
      const resources = SERVER_RESOURCES[serverType] || { vcpu: 0, ram: 0, disk: 0 };
      const uptime = calculateUptime(server.created, server.status);

      return {
        id: server.id,
        name: server.name,
        serverType,
        resources: {
          vcpu: resources.vcpu,
          ramGB: resources.ram,
          diskGB: resources.disk,
        },
        status: server.status,
        uptime,
        datacenter: server.datacenter?.name || 'unknown',
        createdAt: server.created,
      };
    });

    // Calculate total resources
    const totalResources = instances.reduce(
      (acc, instance) => ({
        vcpu: acc.vcpu + instance.resources.vcpu,
        ramGB: acc.ramGB + instance.resources.ramGB,
        diskGB: acc.diskGB + instance.resources.diskGB,
        instances: acc.instances + 1,
      }),
      { vcpu: 0, ramGB: 0, diskGB: 0, instances: 0 }
    );

    // Calculate resource distribution by server type
    const typeMap = new Map<string, { count: number; vcpu: number; ram: number; disk: number }>();
    instances.forEach((instance) => {
      const existing = typeMap.get(instance.serverType) || { count: 0, vcpu: 0, ram: 0, disk: 0 };
      typeMap.set(instance.serverType, {
        count: existing.count + 1,
        vcpu: existing.vcpu + instance.resources.vcpu,
        ram: existing.ram + instance.resources.ramGB,
        disk: existing.disk + instance.resources.diskGB,
      });
    });

    const resourceDistribution = Array.from(typeMap.entries()).map(([serverType, data]) => ({
      serverType,
      count: data.count,
      totalVCPU: data.vcpu,
      totalRAM: data.ram,
      totalDisk: data.disk,
    }));

    const timeline = generateTimeline(servers);

    const usageData: UsageData = {
      totalResources,
      instances,
      resourceDistribution,
      timeline,
    };

    return NextResponse.json(usageData);
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate usage' },
      { status: 500 }
    );
  }
}
