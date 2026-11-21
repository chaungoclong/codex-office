import { EventEmitter } from "node:events";
import type { Writable } from "node:stream";
import type { JsonRpcMessage, JsonRpcResponse, RequestId } from "./protocol.js";

interface Pending {
  resolve(value: unknown): void;
  reject(reason: Error): void;
  timer: NodeJS.Timeout;
}

export class JsonRpcClient extends EventEmitter {
  #buffer = "";
  #nextId = 1;
  readonly #pending = new Map<RequestId, Pending>();
  constructor(
    private readonly output: Writable,
    private readonly timeoutMs = 30_000,
  ) {
    super();
  }

  ingest(chunk: Buffer | string): void {
    this.#buffer += chunk.toString();
    for (;;) {
      const newline = this.#buffer.indexOf("\n");
      if (newline < 0) return;
      const line = this.#buffer.slice(0, newline).trim();
      this.#buffer = this.#buffer.slice(newline + 1);
      if (!line) continue;
      try {
        this.#handle(JSON.parse(line) as JsonRpcMessage);
      } catch (error) {
        this.emit("protocolError", error);
      }
    }
  }

  request<T>(method: string, params?: unknown): Promise<T> {
    const id = this.#nextId++;
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.#pending.delete(id);
        reject(new Error(`JSON-RPC timeout: ${method}`));
      }, this.timeoutMs);
      this.#pending.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timer,
      });
      this.#write({ method, id, ...(params === undefined ? {} : { params }) });
    });
  }

  notify(method: string, params?: unknown): void {
    this.#write({ method, ...(params === undefined ? {} : { params }) });
  }
  respond(id: RequestId, result: unknown): void {
    this.#write({ id, result });
  }
  rejectAll(reason: Error): void {
    for (const pending of this.#pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(reason);
    }
    this.#pending.clear();
  }

  #write(message: JsonRpcMessage): void {
    this.output.write(`${JSON.stringify(message)}\n`);
  }
  #handle(message: JsonRpcMessage): void {
    if (
      "id" in message &&
      ("result" in message || "error" in message) &&
      !("method" in message)
    ) {
      const response = message as JsonRpcResponse;
      const pending = this.#pending.get(response.id);
      if (!pending) return;
      clearTimeout(pending.timer);
      this.#pending.delete(response.id);
      if (response.error)
        pending.reject(
          new Error(`${response.error.code}: ${response.error.message}`),
        );
      else pending.resolve(response.result);
      return;
    }
    this.emit("message", message);
  }
}
