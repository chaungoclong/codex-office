import { existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import websocket from "@fastify/websocket";
import { eq } from "drizzle-orm";
import {
  CodexAdapter,
  type ApprovalRequest,
} from "@codex-office/codex-adapter";
import {
  agentEvents,
  agentSessions,
  approvalRequests,
  auditLogs,
  migrateDatabase,
  openDatabase,
  projects,
  tasks,
} from "@codex-office/database";
import {
  CreateProjectSchema,
  CreateTaskSchema,
  StartThreadSchema,
  StartTurnSchema,
  TaskStateSchema,
  type DomainEvent,
} from "@codex-office/shared";
import {
  assertTransition,
  type TaskState,
} from "@codex-office/workflow-engine";
import type { AppConfig } from "./config.js";

export function requiresAuthentication(url: string, serveWeb: boolean) {
  const pathname = url.split("?", 1)[0];
  if (pathname === "/health") return false;
  if (!serveWeb) return true;
  return pathname === "/events" || pathname?.startsWith("/api/") === true;
}

export async function buildApp(config: AppConfig) {
  mkdirSync(dirname(resolve(config.DATABASE_URL)), { recursive: true });
  const { db, sqlite } = openDatabase(config.DATABASE_URL);
  migrateDatabase(sqlite);
  const adapter = new CodexAdapter(config.CODEX_BIN);
  const app = Fastify({ logger: { redact: ["req.headers.authorization"] } });
  await app.register(cors, {
    origin: config.WEB_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
  });
  await app.register(websocket);
  const webRoot = resolve("apps/web/dist");
  if (config.SERVE_WEB && existsSync(webRoot)) {
    await app.register(fastifyStatic, {
      root: webRoot,
      prefix: "/",
      wildcard: false,
    });
  }

  app.addHook("onRequest", async (request, reply) => {
    if (!requiresAuthentication(request.url, config.SERVE_WEB)) return;
    if (request.headers.origin && request.headers.origin !== config.WEB_ORIGIN)
      return reply.code(403).send({ error: "Origin not allowed" });
    const protocol = request.headers["sec-websocket-protocol"];
    const websocketToken =
      typeof protocol === "string" && protocol.startsWith("office.")
        ? Buffer.from(protocol.slice(7), "base64url").toString()
        : undefined;
    if (
      request.headers.authorization !== `Bearer ${config.OFFICE_AUTH_TOKEN}` &&
      websocketToken !== config.OFFICE_AUTH_TOKEN
    )
      return reply.code(401).send({ error: "Unauthorized" });
  });

  const sockets = new Set<{ send(data: string): void; readyState: number }>();
  const broadcast = (event: DomainEvent) => {
    const body = JSON.stringify(event);
    for (const socket of sockets)
      if (socket.readyState === 1) socket.send(body);
  };
  adapter.on("event", (event: DomainEvent) => {
    db.insert(agentEvents)
      .values({
        id: event.id,
        threadId: event.threadId ?? null,
        type: event.type,
        payload: event.payload,
        occurredAt: event.occurredAt,
      })
      .run();
    broadcast(event);
  });
  adapter.on("approval", (approval: ApprovalRequest) => {
    const event: DomainEvent = {
      id: randomUUID(),
      type: "approval.requested",
      occurredAt: new Date().toISOString(),
      payload: approval,
    };
    db.insert(approvalRequests)
      .values({
        id: event.id,
        rpcRequestId: approval.requestId,
        method: approval.method,
        payload: approval.params,
        status: "pending",
        createdAt: event.occurredAt,
      })
      .run();
    broadcast(event);
  });

  app.get("/health", async () => ({
    status: adapter.state === "failed" ? "degraded" : "ok",
    codex: { state: adapter.state },
    database: "connected",
  }));
  app.post("/api/codex/connect", async (_request, reply) => {
    try {
      await adapter.start();
      return { state: adapter.state };
    } catch (error) {
      return reply.code(503).send({
        error:
          error instanceof Error ? error.message : "Codex connection failed",
      });
    }
  });
  app.get("/api/threads", async () => {
    await adapter.start();
    return adapter.listThreads();
  });
  app.post("/api/threads", async (request, reply) => {
    const parsed = StartThreadSchema.safeParse(request.body);
    if (!parsed.success)
      return reply.code(400).send({ error: parsed.error.flatten() });
    const cwd = resolve(parsed.data.cwd);
    try {
      if (!isAbsolute(parsed.data.cwd) || !statSync(cwd).isDirectory())
        throw new Error();
    } catch {
      return reply
        .code(400)
        .send({ error: "cwd must be an existing absolute directory" });
    }
    await adapter.start();
    const result = await adapter.startThread({
      cwd,
      approvalPolicy: parsed.data.approvalPolicy,
      sandbox: parsed.data.sandbox,
      ...(parsed.data.model ? { model: parsed.data.model } : {}),
      ...(parsed.data.instructions
        ? { baseInstructions: parsed.data.instructions }
        : {}),
    });
    db.insert(agentSessions)
      .values({
        id: randomUUID(),
        threadId: result.thread.id,
        status: "idle",
        startedAt: new Date().toISOString(),
      })
      .run();
    return reply.code(201).send(result);
  });
  app.post<{ Params: { threadId: string } }>(
    "/api/threads/:threadId/resume",
    async (request) => {
      await adapter.start();
      return adapter.resumeThread(request.params.threadId);
    },
  );
  app.post<{ Params: { threadId: string } }>(
    "/api/threads/:threadId/turns",
    async (request, reply) => {
      const parsed = StartTurnSchema.safeParse(request.body);
      if (!parsed.success)
        return reply.code(400).send({ error: parsed.error.flatten() });
      await adapter.start();
      return reply.code(201).send(
        await adapter.startTurn(request.params.threadId, parsed.data.prompt, {
          ...(parsed.data.model ? { model: parsed.data.model } : {}),
          ...(parsed.data.effort ? { effort: parsed.data.effort } : {}),
        }),
      );
    },
  );
  app.post<{ Params: { threadId: string; turnId: string } }>(
    "/api/threads/:threadId/turns/:turnId/interrupt",
    async (request) => {
      await adapter.start();
      return adapter.interruptTurn(
        request.params.threadId,
        request.params.turnId,
      );
    },
  );
  app.get("/api/approvals", async () =>
    db
      .select()
      .from(approvalRequests)
      .where(eq(approvalRequests.status, "pending"))
      .all(),
  );
  app.post<{ Params: { id: string }; Body: { decision: unknown } }>(
    "/api/approvals/:id/resolve",
    async (request, reply) => {
      const row = db
        .select()
        .from(approvalRequests)
        .where(eq(approvalRequests.id, request.params.id))
        .get();
      if (!row || row.status !== "pending")
        return reply.code(404).send({ error: "Pending approval not found" });
      if (!request.body || !("decision" in request.body))
        return reply.code(400).send({ error: "decision is required" });
      adapter.resolveApproval(row.rpcRequestId, request.body.decision);
      const now = new Date().toISOString();
      db.update(approvalRequests)
        .set({
          status: "resolved",
          decision: request.body.decision,
          resolvedAt: now,
        })
        .where(eq(approvalRequests.id, row.id))
        .run();
      return { id: row.id, status: "resolved" };
    },
  );
  app.get("/api/projects", async () => db.select().from(projects).all());
  app.post("/api/projects", async (request, reply) => {
    const parsed = CreateProjectSchema.safeParse(request.body);
    if (!parsed.success)
      return reply.code(400).send({ error: parsed.error.flatten() });
    if (!isAbsolute(parsed.data.path))
      return reply.code(400).send({ error: "Project path must be absolute" });
    const path = resolve(parsed.data.path);
    try {
      if (!statSync(path).isDirectory()) throw new Error();
    } catch {
      return reply
        .code(400)
        .send({ error: "Project path must be an existing directory" });
    }
    const now = new Date().toISOString();
    const project = {
      id: randomUUID(),
      name: parsed.data.name,
      path,
      createdAt: now,
      updatedAt: now,
    };
    db.insert(projects).values(project).run();
    return reply.code(201).send(project);
  });
  app.get<{ Params: { projectId: string } }>(
    "/api/projects/:projectId/tasks",
    async (request) =>
      db
        .select()
        .from(tasks)
        .where(eq(tasks.projectId, request.params.projectId))
        .all(),
  );
  app.post<{ Params: { projectId: string } }>(
    "/api/projects/:projectId/tasks",
    async (request, reply) => {
      const parsed = CreateTaskSchema.safeParse(request.body);
      if (!parsed.success)
        return reply.code(400).send({ error: parsed.error.flatten() });
      if (
        !db
          .select()
          .from(projects)
          .where(eq(projects.id, request.params.projectId))
          .get()
      )
        return reply.code(404).send({ error: "Project not found" });
      const now = new Date().toISOString();
      const task = {
        id: randomUUID(),
        projectId: request.params.projectId,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        priority: parsed.data.priority,
        status: "pending",
        acceptanceCriteria: parsed.data.acceptanceCriteria,
        createdAt: now,
        updatedAt: now,
      };
      db.insert(tasks).values(task).run();
      return reply.code(201).send(task);
    },
  );
  app.post<{ Params: { taskId: string }; Body: { status: string } }>(
    "/api/tasks/:taskId/transition",
    async (request, reply) => {
      const target = TaskStateSchema.safeParse(request.body?.status);
      if (!target.success)
        return reply.code(400).send({ error: "Invalid target status" });
      const task = db
        .select()
        .from(tasks)
        .where(eq(tasks.id, request.params.taskId))
        .get();
      if (!task) return reply.code(404).send({ error: "Task not found" });
      try {
        assertTransition(task.status as TaskState, target.data);
      } catch (error) {
        return reply.code(409).send({
          error: error instanceof Error ? error.message : "Transition rejected",
        });
      }
      const now = new Date().toISOString();
      db.update(tasks)
        .set({ status: target.data, updatedAt: now })
        .where(eq(tasks.id, task.id))
        .run();
      db.insert(auditLogs)
        .values({
          id: randomUUID(),
          actor: "local-user",
          action: "task.status_changed",
          targetType: "task",
          targetId: task.id,
          detail: { from: task.status, to: target.data },
          occurredAt: now,
        })
        .run();
      return { ...task, status: target.data, updatedAt: now };
    },
  );
  app.get("/events", { websocket: true }, (socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });
  if (config.SERVE_WEB) {
    app.setNotFoundHandler(async (request, reply) => {
      if (
        request.method === "GET" &&
        request.headers.accept?.includes("text/html")
      )
        return reply.sendFile("index.html");
      return reply.code(404).send({ error: "Not found" });
    });
  }
  app.addHook("onClose", async () => {
    await adapter.stop();
    sqlite.close();
  });
  return app;
}
