import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get undelivered notifications for an agent
export const getUndelivered = query({
  args: {
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_undelivered", (q) => 
        q.eq("mentionedAgentId", args.agentId).eq("delivered", false)
      )
      .collect();
  },
});

// Get all notifications for an agent
export const listForAgent = query({
  args: {
    agentId: v.id("agents"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_agent", (q) => q.eq("mentionedAgentId", args.agentId))
      .order("desc")
      .take(args.limit || 20);
  },
});

// Create notification (for @mentions)
export const create = mutation({
  args: {
    mentionedAgentId: v.id("agents"),
    fromAgentId: v.optional(v.id("agents")),
    fromUserId: v.optional(v.string()),
    taskId: v.optional(v.id("tasks")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      ...args,
      delivered: false,
      createdAt: Date.now(),
    });
  },
});

// Mark notification as delivered
export const markDelivered = mutation({
  args: {
    id: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      delivered: true,
      deliveredAt: Date.now(),
    });
  },
});

// Mark all notifications as delivered for an agent
export const markAllDelivered = mutation({
  args: {
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_undelivered", (q) => 
        q.eq("mentionedAgentId", args.agentId).eq("delivered", false)
      )
      .collect();
    
    for (const notification of notifications) {
      await ctx.db.patch(notification._id, {
        delivered: true,
        deliveredAt: Date.now(),
      });
    }
    
    return notifications.length;
  },
});

// Create @mention from message content
export const parseAndNotify = mutation({
  args: {
    content: v.string(),
    taskId: v.optional(v.id("tasks")),
    fromAgentId: v.optional(v.id("agents")),
    fromUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Parse @mentions from content
    const mentionRegex = /@(\w+)/g;
    const mentions = args.content.match(mentionRegex) || [];
    
    const agents = await ctx.db.query("agents").collect();
    const notified: string[] = [];
    
    for (const mention of mentions) {
      const name = mention.slice(1).toLowerCase();
      
      // Check for @all
      if (name === "all") {
        for (const agent of agents) {
          await ctx.db.insert("notifications", {
            mentionedAgentId: agent._id,
            fromAgentId: args.fromAgentId,
            fromUserId: args.fromUserId,
            taskId: args.taskId,
            content: args.content,
            delivered: false,
            createdAt: Date.now(),
          });
          notified.push(agent.name);
        }
      } else {
        // Find agent by name
        const agent = agents.find(a => a.name.toLowerCase() === name);
        if (agent && !notified.includes(agent.name)) {
          await ctx.db.insert("notifications", {
            mentionedAgentId: agent._id,
            fromAgentId: args.fromAgentId,
            fromUserId: args.fromUserId,
            taskId: args.taskId,
            content: args.content,
            delivered: false,
            createdAt: Date.now(),
          });
          notified.push(agent.name);
        }
      }
    }
    
    return notified;
  },
});
