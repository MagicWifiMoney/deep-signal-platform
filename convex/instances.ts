import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all instances
export const list = query({
  args: {
    status: v.optional(v.string()),
    ownerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let instances = await ctx.db.query("instances").collect();
    
    if (args.status) {
      instances = instances.filter(i => i.status === args.status);
    }
    if (args.ownerId) {
      instances = instances.filter(i => i.ownerId === args.ownerId);
    }
    
    return instances;
  },
});

// Get instance by ID
export const get = query({
  args: { id: v.id("instances") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create instance
export const create = mutation({
  args: {
    name: v.string(),
    hostname: v.string(),
    publicIp: v.string(),
    tailscaleIp: v.optional(v.string()),
    serverType: v.string(),
    datacenter: v.string(),
    hetznerServerId: v.optional(v.number()),
    model: v.optional(v.string()),
    ownerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const instanceId = await ctx.db.insert("instances", {
      ...args,
      status: "provisioning",
      messagesTotal: 0,
      messagesToday: 0,
      uptime: 0,
      createdAt: Date.now(),
    });
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "instance_created",
      instanceId,
      message: `New instance deployed: ${args.name}`,
      createdAt: Date.now(),
    });
    
    return instanceId;
  },
});

// Update instance status
export const updateStatus = mutation({
  args: {
    id: v.id("instances"),
    status: v.union(
      v.literal("online"),
      v.literal("warning"),
      v.literal("offline"),
      v.literal("provisioning")
    ),
  },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.id);
    if (!instance) throw new Error("Instance not found");
    
    await ctx.db.patch(args.id, {
      status: args.status,
      lastSeen: Date.now(),
    });
    
    // Log if status changed
    if (instance.status !== args.status) {
      await ctx.db.insert("activities", {
        type: "instance_status_changed",
        instanceId: args.id,
        message: `${instance.name} is now ${args.status}`,
        createdAt: Date.now(),
      });
    }
  },
});

// Update instance metrics
export const updateMetrics = mutation({
  args: {
    id: v.id("instances"),
    metrics: v.object({
      cpu: v.number(),
      memory: v.number(),
      disk: v.number(),
    }),
    messagesTotal: v.optional(v.number()),
    messagesToday: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      metrics: args.metrics,
      lastSeen: Date.now(),
    };
    
    if (args.messagesTotal !== undefined) {
      updates.messagesTotal = args.messagesTotal;
    }
    if (args.messagesToday !== undefined) {
      updates.messagesToday = args.messagesToday;
    }
    
    // Check for warning conditions
    if (args.metrics.cpu > 80 || args.metrics.memory > 85) {
      updates.status = "warning";
    }
    
    await ctx.db.patch(args.id, updates);
  },
});

// Heartbeat from instance
export const heartbeat = mutation({
  args: {
    hetznerServerId: v.number(),
    version: v.optional(v.string()),
    model: v.optional(v.string()),
    metrics: v.optional(v.object({
      cpu: v.number(),
      memory: v.number(),
      disk: v.number(),
    })),
    messagesToday: v.optional(v.number()),
    messagesTotal: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Find instance by Hetzner server ID
    const instances = await ctx.db.query("instances").collect();
    const instance = instances.find(i => i.hetznerServerId === args.hetznerServerId);
    
    if (!instance) return null;
    
    const updates: Record<string, unknown> = {
      status: "online",
      lastSeen: Date.now(),
    };
    
    if (args.version) updates.version = args.version;
    if (args.model) updates.model = args.model;
    if (args.metrics) updates.metrics = args.metrics;
    if (args.messagesToday !== undefined) updates.messagesToday = args.messagesToday;
    if (args.messagesTotal !== undefined) updates.messagesTotal = args.messagesTotal;
    
    await ctx.db.patch(instance._id, updates);
    
    return instance._id;
  },
});

// Get fleet stats
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const instances = await ctx.db.query("instances").collect();
    
    const online = instances.filter(i => i.status === "online").length;
    const warning = instances.filter(i => i.status === "warning").length;
    const offline = instances.filter(i => i.status === "offline").length;
    
    const totalMessages = instances.reduce((sum, i) => sum + i.messagesTotal, 0);
    const todayMessages = instances.reduce((sum, i) => sum + i.messagesToday, 0);
    
    const avgCpu = instances.length > 0
      ? instances.reduce((sum, i) => sum + (i.metrics?.cpu || 0), 0) / instances.length
      : 0;
    
    return {
      total: instances.length,
      online,
      warning,
      offline,
      totalMessages,
      todayMessages,
      avgCpu: Math.round(avgCpu),
    };
  },
});
