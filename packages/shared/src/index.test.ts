import { describe, expect, it } from "vitest";
import {
  CreateTaskSchema,
  StartThreadSchema,
  StartTurnSchema,
} from "./index.js";

describe("shared request schemas", () => {
  it("applies safe thread defaults", () => {
    expect(StartThreadSchema.parse({ cwd: "/workspace" })).toMatchObject({
      approvalPolicy: "on-request",
      sandbox: "workspace-write",
    });
  });

  it("rejects empty and oversized turn prompts", () => {
    expect(StartTurnSchema.safeParse({ prompt: "" }).success).toBe(false);
    expect(
      StartTurnSchema.safeParse({ prompt: "x".repeat(100_001) }).success,
    ).toBe(false);
  });

  it("defaults task priority and acceptance criteria", () => {
    expect(CreateTaskSchema.parse({ title: "Implement adapter" })).toEqual({
      title: "Implement adapter",
      priority: 0,
      acceptanceCriteria: [],
    });
  });

  it("rejects invalid task priorities and blank criteria", () => {
    expect(
      CreateTaskSchema.safeParse({ title: "Task", priority: 101 }).success,
    ).toBe(false);
    expect(
      CreateTaskSchema.safeParse({ title: "Task", acceptanceCriteria: [""] })
        .success,
    ).toBe(false);
  });
});
