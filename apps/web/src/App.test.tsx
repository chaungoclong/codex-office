import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App.js";

class MockWebSocket {
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn();
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function defaultFetch(input: RequestInfo | URL, init?: RequestInit) {
  const url = String(input);
  if (url === "/health")
    return Promise.resolve(
      json({
        status: "ok",
        codex: { state: "stopped" },
        database: "connected",
      }),
    );
  if (url === "/api/projects" && init?.method === "POST")
    return Promise.resolve(
      json(
        {
          id: "p1",
          name: "Demo",
          path: "/tmp/demo",
          createdAt: new Date().toISOString(),
        },
        201,
      ),
    );
  if (url === "/api/projects") return Promise.resolve(json([]));
  if (url === "/api/threads") return Promise.resolve(json({ data: [] }));
  if (url === "/api/approvals") return Promise.resolve(json([]));
  return Promise.resolve(
    json({ error: `Unhandled test request: ${url}` }, 500),
  );
}

function renderApp() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("fetch", vi.fn(defaultFetch));
  vi.stubGlobal("WebSocket", MockWebSocket);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("usable UI interactions", () => {
  it("navigates to Projects instead of leaving sidebar buttons inert", async () => {
    localStorage.setItem("codex-office-token", "test-token");
    renderApp();
    await userEvent.click(screen.getByRole("button", { name: "Projects" }));
    expect(
      screen.getByRole("heading", { name: "Add local project" }),
    ).toBeVisible();
  });

  it("saves the local token and gives visible feedback", async () => {
    renderApp();
    await userEvent.click(
      screen.getByRole("button", { name: "Open Settings" }),
    );
    await userEvent.type(
      screen.getByPlaceholderText("Token from .env"),
      "local-test-token",
    );
    await userEvent.click(screen.getByRole("button", { name: "Save locally" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Token saved");
    expect(localStorage.getItem("codex-office-token")).toBe("local-test-token");
  });

  it("shows an API failure when Codex connection fails", async () => {
    localStorage.setItem("codex-office-token", "test-token");
    vi.mocked(fetch).mockImplementation((input, init) =>
      String(input) === "/api/codex/connect"
        ? Promise.resolve(json({ error: "Codex unavailable" }, 503))
        : defaultFetch(input, init),
    );
    renderApp();
    await userEvent.click(
      screen.getAllByRole("button", { name: "Connect Codex" })[0]!,
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Codex unavailable",
    );
  });

  it("connects Codex and shows ready feedback", async () => {
    localStorage.setItem("codex-office-token", "test-token");
    vi.mocked(fetch).mockImplementation((input, init) =>
      String(input) === "/api/codex/connect"
        ? Promise.resolve(json({ state: "ready" }))
        : defaultFetch(input, init),
    );
    renderApp();
    await userEvent.click(
      screen.getAllByRole("button", { name: "Connect Codex" })[0]!,
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Codex is ready",
    );
    const connectCall = vi
      .mocked(fetch)
      .mock.calls.find(([input]) => String(input) === "/api/codex/connect");
    expect(new Headers(connectCall?.[1]?.headers).has("content-type")).toBe(
      false,
    );
  });

  it("creates a project and confirms the action", async () => {
    localStorage.setItem("codex-office-token", "test-token");
    renderApp();
    await userEvent.click(screen.getByRole("button", { name: "Projects" }));
    await userEvent.type(screen.getByLabelText("Project name"), "Demo");
    await userEvent.type(
      screen.getByLabelText("Absolute directory"),
      "/tmp/demo",
    );
    await userEvent.click(screen.getByRole("button", { name: "Add project" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Project added"),
    );
  });
});
