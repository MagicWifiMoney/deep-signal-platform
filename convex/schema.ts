import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Agent definitions and status
  agents: defineTable({
    name: v.string(),
    role: v.string(),
    icon: v.string(),
    description: v.string(),
    capabilities: v.array(v.string()),
    status: v.union(v.literal("active"), v.literal("idle"), v.literal("working"), v.literal("error"), v.literal("offline")),
    sessionKey: v.optional(v.string()),
    instanceId: v.optional(v.string()),
    currentTaskId: v.optional(v.id("tasks")),
    lastAction: v.optional(v.string()),
    lastActionTime: v.optional(v.number()),
    tasksCompleted: v.number(),
    tasksToday: v.number(),
    createdAt: v.number(),
  }).index("by_session", ["sessionKey"])
    .index("by_instance", ["instanceId"]),

  // Client instances
  instances: defineTable({
    name: v.string(),
    hostname: v.string(),
    publicIp: v.string(),
    tailscaleIp: v.optional(v.string()),
    status: v.union(v.literal("online"), v.literal("warning"), v.literal("offline"), v.literal("provisioning")),
    serverType: v.string(),
    datacenter: v.string(),
    hetznerServerId: v.optional(v.number()),
    model: v.optional(v.string()),
    version: v.optional(v.string()),
    metrics: v.optional(v.object({
      cpu: v.number(),
      memory: v.number(),
      disk: v.number(),
    })),
    messagesTotal: v.number(),
    messagesToday: v.number(),
    uptime: v.number(),
    lastSeen: v.optional(v.number()),
    ownerId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_status", ["status"])
    .index("by_owner", ["ownerId"]),

  // Tasks for agents and instances
  tasks: defineTable({
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("inbox"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done"),
      v.literal("blocked")
    ),
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
    assigneeIds: v.array(v.id("agents")),
    instanceId: v.optional(v.id("instances")),
    parentTaskId: v.optional(v.id("tasks")),
    dueAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    result: v.optional(v.string()),
    createdAt: v.number(),
    createdBy: v.optional(v.string()),
  }).index("by_status", ["status"])
    .index("by_instance", ["instanceId"])
    .index("by_assignee", ["assigneeIds"]),

  // Messages/comments on tasks
  messages: defineTable({
    taskId: v.id("tasks"),
    fromAgentId: v.optional(v.id("agents")),
    fromUserId: v.optional(v.string()),
    content: v.string(),
    attachments: v.optional(v.array(v.id("documents"))),
    mentions: v.optional(v.array(v.id("agents"))),
    createdAt: v.number(),
  }).index("by_task", ["taskId"]),

  // Activity feed
  activities: defineTable({
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
    agentId: v.optional(v.id("agents")),
    instanceId: v.optional(v.id("instances")),
    taskId: v.optional(v.id("tasks")),
    message: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_type", ["type"])
    .index("by_agent", ["agentId"])
    .index("by_instance", ["instanceId"])
    .index("by_time", ["createdAt"]),

  // Notifications for @mentions
  notifications: defineTable({
    mentionedAgentId: v.id("agents"),
    fromAgentId: v.optional(v.id("agents")),
    fromUserId: v.optional(v.string()),
    taskId: v.optional(v.id("tasks")),
    content: v.string(),
    delivered: v.boolean(),
    deliveredAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_agent", ["mentionedAgentId"])
    .index("by_undelivered", ["mentionedAgentId", "delivered"]),

  // Documents/deliverables
  documents: defineTable({
    title: v.string(),
    content: v.string(),
    type: v.union(
      v.literal("deliverable"),
      v.literal("research"),
      v.literal("protocol"),
      v.literal("report"),
      v.literal("config")
    ),
    taskId: v.optional(v.id("tasks")),
    instanceId: v.optional(v.id("instances")),
    createdBy: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_task", ["taskId"])
    .index("by_instance", ["instanceId"]),

  // Security scans
  securityScans: defineTable({
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
    createdAt: v.number(),
  }).index("by_instance", ["instanceId"])
    .index("by_status", ["status"]),
});
