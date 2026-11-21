import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import type { DomainEvent } from "@codex-office/shared";
import { JsonRpcClient } from "./json-rpc-client.js";
import {
  approvalMethods,
  type ApprovalRequest,
  type JsonRpcRequest,
  type ThreadListResponse,
  type ThreadStartParams,
  type ThreadStartResponse,
  type TurnStartResponse,
} from "./protocol.js";

export type AdapterState = "stopped" | "starting" | "ready" | "failed";

export class CodexAdapter extends EventEmitter {
  #process: ChildProcessWithoutNullStreams | undefined;
  #rpc: JsonRpcClient | undefined;
  #state: AdapterState = "stopped";
  constructor(private readonly binary = "codex") {
    super();
  }
  get state(): AdapterState {
    return this.#state;
  }

  async start(): Promise<void> {
    if (this.#state === "ready") return;
    this.#state = "starting";
    const child = spawn(this.binary, ["app-server", "--listen", "stdio://"], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
    });
    this.#process = child;
    const rpc = new JsonRpcClient(child.stdin);
    this.#rpc = rpc;
    child.stdout.on("data", (chunk) => rpc.ingest(chunk));
    child.stderr.on("data", (chunk) => this.emit("log", chunk.toString()));
    child.once("error", (error) => this.#fail(error));
    child.once("exit", (code, signal) =>
      this.#fail(
        new Error(`Codex App Server exited (${code ?? signal ?? "unknown"})`),
      ),
    );
    rpc.on("message", (message) => this.#onMessage(message));
    rpc.on("protocolError", (error) => this.emit("error", error));
    await rpc.request("initialize", {
      clientInfo: {
        name: "codex_agent_office",
        title: "Codex Agent Office",
        version: "0.1.0",
      },
      capabilities: { experimentalApi: false, requestAttestation: false },
    });
    rpc.notify("initialized");
    this.#state = "ready";
    this.emit("state", this.#state);
  }

  async stop(): Promise<void> {
    this.#rpc?.rejectAll(new Error("Adapter stopped"));
    this.#process?.kill("SIGTERM");
    this.#process = undefined;
    this.#rpc = undefined;
    this.#state = "stopped";
  }
  startThread(params: ThreadStartParams): Promise<ThreadStartResponse> {
    return this.#request("thread/start", params);
  }
  listThreads(cursor?: string): Promise<ThreadListResponse> {
    return this.#request("thread/list", {
      cursor: cursor ?? null,
      limit: 50,
      sortKey: "updated_at",
    });
  }
  resumeThread(threadId: string): Promise<ThreadStartResponse> {
    return this.#request("thread/resume", { threadId });
  }
  startTurn(
    threadId: string,
    prompt: string,
    options: { model?: string; effort?: string } = {},
  ): Promise<TurnStartResponse> {
    return this.#request("turn/start", {
      threadId,
      input: [{ type: "text", text: prompt, text_elements: [] }],
      ...options,
    });
  }
  steerTurn(threadId: string, prompt: string): Promise<{ turnId: string }> {
    return this.#request("turn/steer", {
      threadId,
      input: [{ type: "text", text: prompt, text_elements: [] }],
    });
  }
  interruptTurn(
    threadId: string,
    turnId: string,
  ): Promise<Record<string, never>> {
    return this.#request("turn/interrupt", { threadId, turnId });
  }
  resolveApproval(requestId: number, decision: unknown): void {
    this.#rpc?.respond(requestId, decision);
  }

  #request<T>(method: string, params?: unknown): Promise<T> {
    if (!this.#rpc || this.#state !== "ready")
      throw new Error("Codex adapter is not ready");
    return this.#rpc.request<T>(method, params);
  }
  #onMessage(message: unknown): void {
    if (!message || typeof message !== "object" || !("method" in message))
      return;
    const request = message as JsonRpcRequest;
    if ("id" in request && approvalMethods.has(request.method))
      this.emit("approval", {
        requestId: request.id,
        method: request.method,
        params: request.params,
      } satisfies ApprovalRequest);
    const params = request.params as { threadId?: string } | undefined;
    const event: DomainEvent = {
      id: randomUUID(),
      type: request.method,
      occurredAt: new Date().toISOString(),
      ...(params?.threadId ? { threadId: params.threadId } : {}),
      payload: request.params ?? null,
    };
    this.emit("event", event);
  }
  #fail(error: Error): void {
    if (this.#state === "stopped") return;
    this.#state = "failed";
    this.#rpc?.rejectAll(error);
    this.emit("state", this.#state);
    this.emit("adapterError", error);
  }
}
