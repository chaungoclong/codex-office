import { PassThrough } from "node:stream";
import { describe, expect, it } from "vitest";
import { JsonRpcClient } from "./json-rpc-client.js";

describe("JsonRpcClient", () => {
  it("frames split newline-delimited responses", async () => {
    const output = new PassThrough();
    const client = new JsonRpcClient(output, 1000);
    const request = client.request<{ ok: boolean }>("ping");
    client.ingest('{"id":1,"result":{"ok":');
    client.ingest("true}}\n");
    await expect(request).resolves.toEqual({ ok: true });
  });
  it("emits server notifications", async () => {
    const client = new JsonRpcClient(new PassThrough());
    const received = new Promise((resolve) => client.once("message", resolve));
    client.ingest('{"method":"turn/started","params":{"threadId":"t1"}}\n');
    await expect(received).resolves.toMatchObject({ method: "turn/started" });
  });
  it("rejects JSON-RPC error responses", async () => {
    const client = new JsonRpcClient(new PassThrough(), 1000);
    const request = client.request("failing/method");
    client.ingest('{"id":1,"error":{"code":-32601,"message":"not found"}}\n');
    await expect(request).rejects.toThrow("-32601: not found");
  });
  it("times out unanswered requests", async () => {
    const client = new JsonRpcClient(new PassThrough(), 5);
    await expect(client.request("slow/method")).rejects.toThrow(
      "JSON-RPC timeout: slow/method",
    );
  });
  it("reports malformed messages without losing the next frame", async () => {
    const client = new JsonRpcClient(new PassThrough());
    const malformed = new Promise((resolve) =>
      client.once("protocolError", resolve),
    );
    const notification = new Promise((resolve) =>
      client.once("message", resolve),
    );
    client.ingest('not-json\n{"method":"thread/started","params":{}}\n');
    await expect(malformed).resolves.toBeInstanceOf(SyntaxError);
    await expect(notification).resolves.toMatchObject({
      method: "thread/started",
    });
  });
});
