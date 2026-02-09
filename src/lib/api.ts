// API client for Deep Signal platform

export interface Instance {
  id: number;
  name: string;
  hostname: string;
  publicIp: string;
  tailscaleIp: string;
  status: 'online' | 'warning' | 'offline';
  serverType: string;
  datacenter: string;
  created: string;
  metrics?: {
    cpu: number;
    memory: number | null;
    disk: number | null;
  };
  openclaw?: {
    version: string;
    model: string;
    messagesTotal: number;
    messagesToday: number;
    uptime: number;
    lastSeen: string;
  };
}

export async function fetchInstances(): Promise<Instance[]> {
  try {
    const res = await fetch('/api/instances', {
      cache: 'no-store',
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch instances');
    }
    
    const data = await res.json();
    return data.instances || [];
  } catch (error) {
    console.error('Error fetching instances:', error);
    return [];
  }
}

export async function deployInstance(name: string, region: string, serverType: string): Promise<{
  success: boolean;
  instance?: any;
  error?: string;
}> {
  try {
    const res = await fetch('/api/instances/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, region, serverType }),
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      return { success: false, error: data.error };
    }
    
    return { success: true, instance: data.instance };
  } catch (error) {
    console.error('Error deploying instance:', error);
    return { success: false, error: 'Failed to deploy instance' };
  }
}

export async function deleteInstance(serverId: number): Promise<boolean> {
  try {
    const res = await fetch(`/api/instances/${serverId}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (error) {
    console.error('Error deleting instance:', error);
    return false;
  }
}

export async function restartInstance(serverId: number): Promise<boolean> {
  try {
    const res = await fetch(`/api/instances/${serverId}/restart`, {
      method: 'POST',
    });
    return res.ok;
  } catch (error) {
    console.error('Error restarting instance:', error);
    return false;
  }
}
