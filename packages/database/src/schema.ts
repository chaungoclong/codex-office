import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
};
export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    path: text("path").notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("projects_path_uq").on(t.path)],
);
export const departments = sqliteTable("departments", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ...timestamps,
});
export const agents = sqliteTable("agents", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  departmentId: text("department_id").references(() => departments.id),
  role: text("role").notNull(),
  model: text("model"),
  workingDirectory: text("working_directory"),
  status: text("status").notNull().default("offline"),
  configuration: text("configuration", { mode: "json" }),
  ...timestamps,
});
export const agentSessions = sqliteTable(
  "agent_sessions",
  {
    id: text("id").primaryKey(),
    agentId: text("agent_id").references(() => agents.id),
    projectId: text("project_id").references(() => projects.id),
    threadId: text("thread_id").notNull(),
    status: text("status").notNull(),
    startedAt: text("started_at").notNull(),
    endedAt: text("ended_at"),
  },
  (t) => [uniqueIndex("agent_sessions_thread_uq").on(t.threadId)],
);
export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id),
    title: text("title").notNull(),
    description: text("description"),
    priority: integer("priority").notNull().default(0),
    status: text("status").notNull().default("pending"),
    assignedAgentId: text("assigned_agent_id").references(() => agents.id),
    acceptanceCriteria: text("acceptance_criteria", { mode: "json" }),
    result: text("result"),
    ...timestamps,
  },
  (t) => [index("tasks_project_status_idx").on(t.projectId, t.status)],
);
export const taskDependencies = sqliteTable("task_dependencies", {
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id),
  dependsOnTaskId: text("depends_on_task_id")
    .notNull()
    .references(() => tasks.id),
});
export const taskAssignments = sqliteTable("task_assignments", {
  id: text("id").primaryKey(),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id),
  agentId: text("agent_id")
    .notNull()
    .references(() => agents.id),
  assignedAt: text("assigned_at").notNull(),
  unassignedAt: text("unassigned_at"),
});
export const approvalRequests = sqliteTable("approval_requests", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").references(() => agentSessions.id),
  rpcRequestId: integer("rpc_request_id").notNull(),
  method: text("method").notNull(),
  payload: text("payload", { mode: "json" }).notNull(),
  status: text("status").notNull().default("pending"),
  decision: text("decision", { mode: "json" }),
  createdAt: text("created_at").notNull(),
  resolvedAt: text("resolved_at"),
});
export const agentEvents = sqliteTable(
  "agent_events",
  {
    id: text("id").primaryKey(),
    threadId: text("thread_id"),
    type: text("type").notNull(),
    payload: text("payload", { mode: "json" }).notNull(),
    occurredAt: text("occurred_at").notNull(),
  },
  (t) => [index("agent_events_thread_time_idx").on(t.threadId, t.occurredAt)],
);
export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id"),
  detail: text("detail", { mode: "json" }),
  occurredAt: text("occurred_at").notNull(),
});
export const workflowRuns = sqliteTable("workflow_runs", {
  id: text("id").primaryKey(),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id),
  status: text("status").notNull(),
  currentStep: text("current_step"),
  ...timestamps,
});
export const workflows = sqliteTable("workflows", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  definition: text("definition", { mode: "json" }).notNull(),
  ...timestamps,
});
export const workflowSteps = sqliteTable("workflow_steps", {
  id: text("id").primaryKey(),
  workflowId: text("workflow_id")
    .notNull()
    .references(() => workflows.id),
  name: text("name").notNull(),
  position: integer("position").notNull(),
  configuration: text("configuration", { mode: "json" }),
});
export const testReports = sqliteTable("test_reports", {
  id: text("id").primaryKey(),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id),
  passed: integer("passed", { mode: "boolean" }).notNull(),
  report: text("report").notNull(),
  createdAt: text("created_at").notNull(),
});
export const reviewReports = sqliteTable("review_reports", {
  id: text("id").primaryKey(),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id),
  passed: integer("passed", { mode: "boolean" }).notNull(),
  report: text("report").notNull(),
  createdAt: text("created_at").notNull(),
});
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }).notNull(),
  updatedAt: text("updated_at").notNull(),
});
