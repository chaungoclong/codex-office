import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api.js";

beforeEach(() => localStorage.setItem("codex-office-token", "local-token"));
afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("api request headers", () => {
  it("does not mark a bodyless POST as JSON", async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(JSON.stringify({ state: "ready" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await api("/api/codex/connect", { method: "POST" });
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get("content-type")).toBeNull();
    expect(headers.get("authorization")).toBe("Bearer local-token");
  });

  it("adds JSON content type when a body is present", async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(JSON.stringify({ id: "p1" }), { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await api("/api/projects", {
      method: "POST",
      body: JSON.stringify({ name: "Demo" }),
    });
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(new Headers(init.headers).get("content-type")).toBe(
      "application/json",
    );
  });
});
