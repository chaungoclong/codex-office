import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp, requiresAuthentication } from "./app.js";

const directories: string[] = [];
afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

async function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "codex-office-server-"));
  directories.push(directory);
  const token = "test-token-at-least-sixteen-characters";
  const app = await buildApp({
    HOST: "127.0.0.1",
    PORT: 4310,
    DATABASE_URL: join(directory, "office.db"),
    CODEX_BIN: "codex",
    OFFICE_AUTH_TOKEN: token,
    WEB_ORIGIN: "http://127.0.0.1:5173",
    SERVE_WEB: false,
  });
  return { app, token, directory };
}

describe("server security and project API", () => {
  it("serves production UI assets before browser token authentication", () => {
    expect(requiresAuthentication("/", true)).toBe(false);
    expect(requiresAuthentication("/assets/index.js", true)).toBe(false);
    expect(requiresAuthentication("/projects?tab=active", true)).toBe(false);
    expect(requiresAuthentication("/api/projects", true)).toBe(true);
    expect(requiresAuthentication("/events", true)).toBe(true);
  });
  it("exposes health without authentication", async () => {
    const { app } = await fixture();
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "ok",
      database: "connected",
    });
    await app.close();
  });
  it("rejects unauthenticated API calls", async () => {
    const { app } = await fixture();
    const response = await app.inject({ method: "GET", url: "/api/projects" });
    expect(response.statusCode).toBe(401);
    await app.close();
  });
  it("rejects requests from an unexpected browser origin", async () => {
    const { app, token } = await fixture();
    const response = await app.inject({
      method: "GET",
      url: "/api/projects",
      headers: {
        authorization: `Bearer ${token}`,
        origin: "https://attacker.example",
      },
    });
    expect(response.statusCode).toBe(403);
    await app.close();
  });
  it("imports only existing absolute project directories", async () => {
    const { app, token, directory } = await fixture();
    const headers = {
      authorization: `Bearer ${token}`,
      origin: "http://127.0.0.1:5173",
    };
    const invalid = await app.inject({
      method: "POST",
      url: "/api/projects",
      headers,
      payload: { name: "bad", path: "relative" },
    });
    expect(invalid.statusCode).toBe(400);
    const valid = await app.inject({
      method: "POST",
      url: "/api/projects",
      headers,
      payload: { name: "fixture", path: directory },
    });
    expect(valid.statusCode).toBe(201);
    expect(valid.json()).toMatchObject({ name: "fixture", path: directory });
    await app.close();
  });

  it("runs the basic project and task workflow", async () => {
    const { app, token, directory } = await fixture();
    const headers = {
      authorization: `Bearer ${token}`,
      origin: "http://127.0.0.1:5173",
    };
    const projectResponse = await app.inject({
      method: "POST",
      url: "/api/projects",
      headers,
      payload: { name: "Feature project", path: directory },
    });
    const project = projectResponse.json<{ id: string }>();

    const invalidTask = await app.inject({
      method: "POST",
      url: `/api/projects/${project.id}/tasks`,
      headers,
      payload: { title: "", priority: 101 },
    });
    expect(invalidTask.statusCode).toBe(400);

    const taskResponse = await app.inject({
      method: "POST",
      url: `/api/projects/${project.id}/tasks`,
      headers,
      payload: {
        title: "Implement feature",
        acceptanceCriteria: ["Feature is tested"],
      },
    });
    expect(taskResponse.statusCode).toBe(201);
    const task = taskResponse.json<{ id: string; status: string }>();
    expect(task.status).toBe("pending");

    const skipped = await app.inject({
      method: "POST",
      url: `/api/tasks/${task.id}/transition`,
      headers,
      payload: { status: "in_progress" },
    });
    expect(skipped.statusCode).toBe(409);
    const analyzed = await app.inject({
      method: "POST",
      url: `/api/tasks/${task.id}/transition`,
      headers,
      payload: { status: "analyzing" },
    });
    expect(analyzed.statusCode).toBe(200);
    expect(analyzed.json()).toMatchObject({ id: task.id, status: "analyzing" });

    const list = await app.inject({
      method: "GET",
      url: `/api/projects/${project.id}/tasks`,
      headers,
    });
    expect(list.statusCode).toBe(200);
    expect(list.json()).toEqual([
      expect.objectContaining({ id: task.id, status: "analyzing" }),
    ]);
    await app.close();
  });

  it("does not create a task for an unknown project", async () => {
    const { app, token } = await fixture();
    const response = await app.inject({
      method: "POST",
      url: "/api/projects/missing/tasks",
      headers: { authorization: `Bearer ${token}` },
      payload: { title: "Orphan" },
    });
    expect(response.statusCode).toBe(404);
    await app.close();
  });
});
