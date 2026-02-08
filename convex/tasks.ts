import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all tasks
export const list = query({
  args: {
    status: v.optional(v.string()),
    instanceId: v.optional(v.id("instances")),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("tasks");
    
    if (args.status) {
      q = q.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    const tasks = await q.order("desc").collect();
    
    if (args.instanceId) {
      return tasks.filter(t => t.instanceId === args.instanceId);
    }
    
    return tasks;
  },
});

// Get task by ID with messages
export const getWithMessages = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) return null;
    
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_task", (q) => q.eq("taskId", args.id))
      .collect();
    
    return { task, messages };
  },
});

// Create task
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    type: v.union(
      v.literal("security_scan"),
      v.literal("health_check"),
      v.literal("config_update"),
      v.literal("onboarding"),
      v.literal("support"),
      v.literal("billing"),
      v.literal("maintenance"),
      v.literal("custom")
    ),
    assigneeIds: v.optional(v.array(v.id("agents"))),
    instanceId: v.optional(v.id("instances")),
    dueAt: v.optional(v.number()),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      status: args.assigneeIds?.length ? "assigned" : "inbox",
      priority: args.priority,
      type: args.type,
      assigneeIds: args.assigneeIds || [],
      instanceId: args.instanceId,
      dueAt: args.dueAt,
      createdBy: args.createdBy,
      createdAt: Date.now(),
    });
    
    // Log activity
    await ctx.db.insert("activities", {
      type: "task_created",
      taskId,
      instanceId: args.instanceId,
      message: `New task: ${args.title}`,
      createdAt: Date.now(),
    });
    
    // Create notifications for assignees
    if (args.assigneeIds) {
      for (const agentId of args.assigneeIds) {
        await ctx.db.insert("notifications", {
          mentionedAgentId: agentId,
          taskId,
          content: `You've been assigned: ${args.title}`,
          delivered: false,
          createdAt: Date.now(),
        });
      }
    }
    
    return taskId;
  },
});

// Update task status
export const updateStatus = mutation({
  args: {
    id: v.id("tasks"),
    status: v.union(
      v.literal("inbox"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done"),
      v.literal("blocked")
    ),
    result: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");
    
    const updates: Record<string, unknown> = { status: args.status };
    
    if (args.status === "done") {
      updates.completedAt = Date.now();
      updates.result = args.result;
    }
    
    await ctx.db.patch(args.id, updates);
    
    // Log activity
    await ctx.db.insert("activities", {
      type: args.status === "done" ? "task_completed" : "task_updated",
      taskId: args.id,
      instanceId: task.instanceId,
      message: `Task "${task.title}" is now ${args.status}`,
      createdAt: Date.now(),
    });
  },
});

// Assign task to agents
export const assign = mutation({
  args: {
    id: v.id("tasks"),
    assigneeIds: v.array(v.id("agents")),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");
    
    await ctx.db.patch(args.id, {
      assigneeIds: args.assigneeIds,
      status: "assigned",
    });
    
    // Notify new assignees
    for (const agentId of args.assigneeIds) {
      if (!task.assigneeIds.includes(agentId)) {
        await ctx.db.insert("notifications", {
          mentionedAgentId: agentId,
          taskId: args.id,
          content: `You've been assigned: ${task.title}`,
          delivered: false,
          createdAt: Date.now(),
        });
      }
    }
  },
});

// Get tasks by status for kanban
export const byStatus = query({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").collect();
    
    return {
      inbox: tasks.filter(t => t.status === "inbox"),
      assigned: tasks.filter(t => t.status === "assigned"),
      in_progress: tasks.filter(t => t.status === "in_progress"),
      review: tasks.filter(t => t.status === "review"),
      done: tasks.filter(t => t.status === "done").slice(0, 10),
      blocked: tasks.filter(t => t.status === "blocked"),
    };
  },
});
