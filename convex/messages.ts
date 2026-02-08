import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get messages for a task
export const listByTask = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .order("asc")
      .collect();
    
    // Enrich with agent data
    return await Promise.all(
      messages.map(async (msg) => {
        let agent = null;
        if (msg.fromAgentId) {
          agent = await ctx.db.get(msg.fromAgentId);
        }
        return { ...msg, agent };
      })
    );
  },
});

// Create message
export const create = mutation({
  args: {
    taskId: v.id("tasks"),
    content: v.string(),
    fromAgentId: v.optional(v.id("agents")),
    fromUserId: v.optional(v.string()),
    attachments: v.optional(v.array(v.id("documents"))),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    
    // Parse @mentions
    const mentionRegex = /@(\w+)/g;
    const mentionMatches = args.content.match(mentionRegex) || [];
    const agents = await ctx.db.query("agents").collect();
    const mentions: typeof agents[0]["_id"][] = [];
    
    for (const mention of mentionMatches) {
      const name = mention.slice(1).toLowerCase();
      const agent = agents.find(a => a.name.toLowerCase() === name);
      if (agent) {
        mentions.push(agent._id);
      }
    }
    
    // Create message
    const messageId = await ctx.db.insert("messages", {
      taskId: args.taskId,
      content: args.content,
      fromAgentId: args.fromAgentId,
      fromUserId: args.fromUserId,
      attachments: args.attachments,
      mentions,
      createdAt: Date.now(),
    });
    
    // Log activity
    let senderName = "Someone";
    if (args.fromAgentId) {
      const agent = await ctx.db.get(args.fromAgentId);
      senderName = agent?.name || "Agent";
    }
    
    await ctx.db.insert("activities", {
      type: "message_sent",
      agentId: args.fromAgentId,
      taskId: args.taskId,
      instanceId: task.instanceId,
      message: `${senderName} commented on "${task.title}"`,
      createdAt: Date.now(),
    });
    
    // Create notifications for mentions
    for (const agentId of mentions) {
      // Don't notify yourself
      if (agentId === args.fromAgentId) continue;
      
      await ctx.db.insert("notifications", {
        mentionedAgentId: agentId,
        fromAgentId: args.fromAgentId,
        fromUserId: args.fromUserId,
        taskId: args.taskId,
        content: args.content,
        delivered: false,
        createdAt: Date.now(),
      });
    }
    
    // Also notify all assignees (thread subscription)
    for (const assigneeId of task.assigneeIds) {
      // Skip if already mentioned or is sender
      if (mentions.includes(assigneeId) || assigneeId === args.fromAgentId) continue;
      
      await ctx.db.insert("notifications", {
        mentionedAgentId: assigneeId,
        fromAgentId: args.fromAgentId,
        fromUserId: args.fromUserId,
        taskId: args.taskId,
        content: `New comment on "${task.title}": ${args.content.slice(0, 100)}...`,
        delivered: false,
        createdAt: Date.now(),
      });
    }
    
    return messageId;
  },
});

// Get recent messages across all tasks
export const recent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .order("desc")
      .take(args.limit || 20);
    
    return await Promise.all(
      messages.map(async (msg) => {
        const task = await ctx.db.get(msg.taskId);
        let agent = null;
        if (msg.fromAgentId) {
          agent = await ctx.db.get(msg.fromAgentId);
        }
        return { ...msg, task, agent };
      })
    );
  },
});
