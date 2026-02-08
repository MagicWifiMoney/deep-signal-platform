import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all agents
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("agents").collect();
  },
});

// Get agent by ID
export const get = query({
  args: { id: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get agent by session key
export const getBySession = query({
  args: { sessionKey: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_session", (q) => q.eq("sessionKey", args.sessionKey))
      .first();
  },
});

// Create agent
export const create = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    icon: v.string(),
    description: v.string(),
    capabilities: v.array(v.string()),
    sessionKey: v.optional(v.string()),
    instanceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("agents", {
      ...args,
      status: "idle",
      tasksCompleted: 0,
      tasksToday: 0,
      createdAt: Date.now(),
    });
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "system",
      agentId: id,
      message: `Agent ${args.name} joined the team`,
      createdAt: Date.now(),
    });
    
    return id;
  },
});

// Update agent status
export const updateStatus = mutation({
  args: {
    id: v.id("agents"),
    status: v.union(v.literal("active"), v.literal("idle"), v.literal("working"), v.literal("error"), v.literal("offline")),
    lastAction: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.id);
    if (!agent) throw new Error("Agent not found");
    
    await ctx.db.patch(args.id, {
      status: args.status,
      lastAction: args.lastAction,
      lastActionTime: Date.now(),
    });
    
    // Log status change
    await ctx.db.insert("activities", {
      type: "agent_status_changed",
      agentId: args.id,
      message: `${agent.name} is now ${args.status}${args.lastAction ? `: ${args.lastAction}` : ''}`,
      createdAt: Date.now(),
    });
  },
});

// Assign task to agent
export const assignTask = mutation({
  args: {
    agentId: v.id("agents"),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.agentId, {
      currentTaskId: args.taskId,
      status: "working",
      lastActionTime: Date.now(),
    });
  },
});

// Complete task
export const completeTask = mutation({
  args: {
    agentId: v.id("agents"),
    result: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) throw new Error("Agent not found");
    
    await ctx.db.patch(args.agentId, {
      currentTaskId: undefined,
      status: "active",
      tasksCompleted: agent.tasksCompleted + 1,
      tasksToday: agent.tasksToday + 1,
      lastAction: args.result || "Task completed",
      lastActionTime: Date.now(),
    });
  },
});

// Heartbeat - agent checking in
export const heartbeat = mutation({
  args: {
    sessionKey: v.string(),
    status: v.optional(v.union(v.literal("active"), v.literal("idle"), v.literal("working"))),
    lastAction: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_session", (q) => q.eq("sessionKey", args.sessionKey))
      .first();
    
    if (!agent) return null;
    
    await ctx.db.patch(agent._id, {
      status: args.status || "active",
      lastAction: args.lastAction || "Heartbeat",
      lastActionTime: Date.now(),
    });
    
    return agent._id;
  },
});

// Reset daily counters (run at midnight)
export const resetDailyCounters = mutation({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db.query("agents").collect();
    for (const agent of agents) {
      await ctx.db.patch(agent._id, {
        tasksToday: 0,
      });
    }
  },
});
