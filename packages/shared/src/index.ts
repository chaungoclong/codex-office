import { z } from "zod";

export const agentStates = [
  "offline",
  "idle",
  "starting",
  "planning",
  "working",
  "running_tool",
  "waiting_approval",
  "waiting_dependency",
  "testing",
  "reviewing",
  "paused",
  "completed",
  "failed",
  "stopped",
] as const;
export const taskStates = [
  "pending",
  "analyzing",
  "planning",
  "in_progress",
  "ready_for_test",
  "testing",
  "ready_for_review",
  "reviewing",
  "done",
  "blocked",
] as const;
export const AgentStateSchema = z.enum(agentStates);
export const TaskStateSchema = z.enum(taskStates);

export const StartThreadSchema = z.object({
  cwd: z.string().min(1),
  model: z.string().min(1).optional(),
  instructions: z.string().optional(),
  approvalPolicy: z
    .enum(["untrusted", "on-request", "never"])
    .default("on-request"),
  sandbox: z
    .enum(["read-only", "workspace-write", "danger-full-access"])
    .default("workspace-write"),
});

export const StartTurnSchema = z.object({
  prompt: z.string().min(1).max(100_000),
  model: z.string().min(1).optional(),
  effort: z
    .enum(["minimal", "low", "medium", "high", "xhigh", "max", "ultra"])
    .optional(),
});

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(120),
  path: z.string().min(1),
});
export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(240),
  description: z.string().max(20_000).optional(),
  priority: z.number().int().min(0).max(100).default(0),
  acceptanceCriteria: z.array(z.string().min(1)).default([]),
});

export interface DomainEvent {
  id: string;
  type: string;
  occurredAt: string;
  threadId?: string;
  payload: unknown;
}

export interface HealthStatus {
  status: "ok" | "degraded";
  codex: { state: string; version?: string };
  database: "connected" | "unavailable";
}
