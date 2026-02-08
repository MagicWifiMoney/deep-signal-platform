import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get recent activities
export const list = query({
  args: {
    limit: v.optional(v.number()),
    instanceId: v.optional(v.id("instances")),
  },
  handler: async (ctx, args) => {
    let activities = await ctx.db
      .query("activities")
      .order("desc")
      .take(args.limit || 50);
    
    if (args.instanceId) {
      activities = activities.filter(a => a.instanceId === args.instanceId);
    }
    
    // Enrich with agent/instance data
    const enriched = await Promise.all(
      activities.map(async (activity) => {
        let agent = null;
        let instance = null;
        let task = null;
        
        if (activity.agentId) {
          agent = await ctx.db.get(activity.agentId);
        }
        if (activity.instanceId) {
          instance = await ctx.db.get(activity.instanceId);
        }
        if (activity.taskId) {
          task = await ctx.db.get(activity.taskId);
        }
        
        return { ...activity, agent, instance, task };
      })
    );
    
    return enriched;
  },
});

// Log activity
export const log = mutation({
  args: {
    type: v.union(
      v.literal("task_created"),
      v.literal("task_updated"),
      v.literal("task_completed"),
      v.literal("message_sent"),
      v.literal("agent_status_changed"),
      v.literal("instance_created"),
      v.literal("instance_status_changed"),
      v.literal("security_scan"),
      v.literal("alert"),
      v.literal("system")
    ),
    message: v.string(),
    agentId: v.optional(v.id("agents")),
    instanceId: v.optional(v.id("instances")),
    taskId: v.optional(v.id("tasks")),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activities", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Get activity stats
export const stats = query({
  args: {
    hours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const since = Date.now() - (args.hours || 24) * 60 * 60 * 1000;
    const activities = await ctx.db
      .query("activities")
      .filter((q) => q.gte(q.field("createdAt"), since))
      .collect();
    
    const byType: Record<string, number> = {};
    for (const activity of activities) {
      byType[activity.type] = (byType[activity.type] || 0) + 1;
    }
    
    return {
      total: activities.length,
      byType,
      tasksCreated: byType.task_created || 0,
      tasksCompleted: byType.task_completed || 0,
      securityScans: byType.security_scan || 0,
      alerts: byType.alert || 0,
    };
  },
});
