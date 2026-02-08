import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get scans for an instance
export const listByInstance = query({
  args: {
    instanceId: v.id("instances"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("securityScans")
      .withIndex("by_instance", (q) => q.eq("instanceId", args.instanceId))
      .order("desc")
      .take(args.limit || 10);
  },
});

// Get latest scan for each instance
export const latestByInstance = query({
  args: {},
  handler: async (ctx) => {
    const instances = await ctx.db.query("instances").collect();
    const results: Record<string, unknown> = {};
    
    for (const instance of instances) {
      const scan = await ctx.db
        .query("securityScans")
        .withIndex("by_instance", (q) => q.eq("instanceId", instance._id))
        .order("desc")
        .first();
      
      if (scan) {
        results[instance._id] = scan;
      }
    }
    
    return results;
  },
});

// Create security scan
export const create = mutation({
  args: {
    instanceId: v.id("instances"),
    status: v.union(v.literal("passing"), v.literal("warning"), v.literal("critical")),
    score: v.number(),
    checks: v.array(v.object({
      id: v.string(),
      name: v.string(),
      category: v.string(),
      status: v.union(v.literal("pass"), v.literal("warn"), v.literal("fail")),
      message: v.string(),
      recommendation: v.optional(v.string()),
    })),
    scannedBy: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance) throw new Error("Instance not found");
    
    const scanId = await ctx.db.insert("securityScans", {
      ...args,
      createdAt: Date.now(),
    });
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "security_scan",
      instanceId: args.instanceId,
      agentId: args.scannedBy,
      message: `Security scan on ${instance.name}: ${args.status} (${args.score}/100)`,
      metadata: { score: args.score, status: args.status },
      createdAt: Date.now(),
    });
    
    // If critical, create alert
    if (args.status === "critical") {
      await ctx.db.insert("activities", {
        type: "alert",
        instanceId: args.instanceId,
        message: `🚨 Critical security issue on ${instance.name}`,
        metadata: { scanId },
        createdAt: Date.now(),
      });
    }
    
    return scanId;
  },
});

// Get security overview
export const overview = query({
  args: {},
  handler: async (ctx) => {
    const scans = await ctx.db.query("securityScans").order("desc").take(100);
    
    // Get latest scan per instance
    const latestScans = new Map<string, typeof scans[0]>();
    for (const scan of scans) {
      if (!latestScans.has(scan.instanceId)) {
        latestScans.set(scan.instanceId, scan);
      }
    }
    
    const latest = Array.from(latestScans.values());
    
    const passing = latest.filter(s => s.status === "passing").length;
    const warning = latest.filter(s => s.status === "warning").length;
    const critical = latest.filter(s => s.status === "critical").length;
    const avgScore = latest.length > 0
      ? Math.round(latest.reduce((sum, s) => sum + s.score, 0) / latest.length)
      : 0;
    
    return {
      total: latest.length,
      passing,
      warning,
      critical,
      avgScore,
    };
  },
});
