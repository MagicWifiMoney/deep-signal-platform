import { NextResponse } from 'next/server';

const HETZNER_API_TOKEN = process.env.HETZNER_API_TOKEN;
const HETZNER_API = 'https://api.hetzner.cloud/v1';

// Server type pricing in USD per month (Hetzner prices converted from EUR)
const SERVER_PRICING: Record<string, number> = {
  cpx11: 4.49,
  cpx21: 10.79,
  cpx31: 18.74,
  cpx41: 35.63,
  cpx51: 69.10,
  cx11: 3.55,
  cx21: 6.47,
  cx31: 12.95,
  cx41: 25.91,
  cx51: 51.82,
};

interface BillingData {
  totalMonthlyCost: number;
  currency: string;
  instances: {
    id: number;
    name: string;
    serverType: string;
    monthlyCost: number;
    hourlyRate: number;
    client: string;
    datacenter: string;
    createdAt: string;
    daysRunning: number;
    projectedMonthlyCost: number;
  }[];
  byClient: {
    client: string;
    instanceCount: number;
    monthlyCost: number;
  }[];
  summary: {
    totalInstances: number;
    totalMonthlyCost: number;
    avgCostPerInstance: number;
    mostExpensiveInstance: string;
    cheapestInstance: string;
  };
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

function extractClientFromName(serverName: string): string {
  // Extract client from server name pattern: deepsignal-{client}
  const parts = serverName.split('-');
  if (parts.length > 1) {
    return parts.slice(1).join('-');
  }
  return 'unknown';
}

function calculateDaysRunning(createdDate: string): number {
  const created = new Date(createdDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export async function GET() {
  try {
    const servers = await getHetznerServers();
    
    if (servers.length === 0) {
      return NextResponse.json({
        error: 'No servers found or API token not configured',
        totalMonthlyCost: 0,
        instances: [],
        byClient: [],
        summary: {
          totalInstances: 0,
          totalMonthlyCost: 0,
          avgCostPerInstance: 0,
          mostExpensiveInstance: 'N/A',
          cheapestInstance: 'N/A',
        },
      });
    }

    const instances = servers.map((server: any) => {
      const serverType = server.server_type?.name || 'unknown';
      const monthlyCost = SERVER_PRICING[serverType] || 0;
      const hourlyRate = monthlyCost / 730; // Approximate hours per month
      const client = extractClientFromName(server.name);
      const daysRunning = calculateDaysRunning(server.created);
      const projectedMonthlyCost = (daysRunning / 30) * monthlyCost;

      return {
        id: server.id,
        name: server.name,
        serverType,
        monthlyCost,
        hourlyRate: Math.round(hourlyRate * 1000) / 1000,
        client,
        datacenter: server.datacenter?.name || 'unknown',
        createdAt: server.created,
        daysRunning,
        projectedMonthlyCost: Math.round(projectedMonthlyCost * 100) / 100,
      };
    });

    const totalMonthlyCost = instances.reduce((sum, i) => sum + i.monthlyCost, 0);

    // Group by client
    const clientMap = new Map<string, { count: number; cost: number }>();
    instances.forEach((instance) => {
      const existing = clientMap.get(instance.client) || { count: 0, cost: 0 };
      clientMap.set(instance.client, {
        count: existing.count + 1,
        cost: existing.cost + instance.monthlyCost,
      });
    });

    const byClient = Array.from(clientMap.entries()).map(([client, data]) => ({
      client,
      instanceCount: data.count,
      monthlyCost: Math.round(data.cost * 100) / 100,
    }));

    // Find most/least expensive
    const sortedByCost = [...instances].sort((a, b) => b.monthlyCost - a.monthlyCost);
    const mostExpensive = sortedByCost[0];
    const cheapest = sortedByCost[sortedByCost.length - 1];

    const billingData: BillingData = {
      totalMonthlyCost: Math.round(totalMonthlyCost * 100) / 100,
      currency: 'USD',
      instances,
      byClient,
      summary: {
        totalInstances: instances.length,
        totalMonthlyCost: Math.round(totalMonthlyCost * 100) / 100,
        avgCostPerInstance: instances.length > 0 ? Math.round((totalMonthlyCost / instances.length) * 100) / 100 : 0,
        mostExpensiveInstance: mostExpensive ? `${mostExpensive.name} ($${mostExpensive.monthlyCost})` : 'N/A',
        cheapestInstance: cheapest ? `${cheapest.name} ($${cheapest.monthlyCost})` : 'N/A',
      },
    };

    return NextResponse.json(billingData);
  } catch (error) {
    console.error('Billing API error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate billing' },
      { status: 500 }
    );
  }
}
