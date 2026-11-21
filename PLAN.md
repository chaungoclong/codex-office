# Implementation Plan

## Current milestone: real Codex vertical slice

1. **Foundation** — workspace, shared contracts, SQLite schema, Fastify server, React shell, documentation.
2. **Codex integration** — stdio JSON-RPC lifecycle, initialize handshake, thread start/list/resume, turns, streaming events, interrupts, approval capture.
3. **Agent and task management** — persisted departments, agents, task state machine, dependencies, Markdown import.
4. **Orchestration** — concurrency queue, retries, approval pauses, tester/reviewer gates, worktree isolation.
5. **Office experience** — realtime dashboard, organization graph, PixiJS office, terminal/log views.
6. **Hardening** — integration/E2E coverage, reconnect recovery, security review, packaging.

The project prioritizes a functioning App Server path before decorative UI. Each phase requires build, test, and documentation updates. Git worktree support is deferred until this directory is a valid Git repository.

## Verification status

- `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` pass on Node.js 22.20.0 with pnpm 11.2.2.
- HTTP runtime smoke tests pass for health, bearer authentication, and project import.
- Codex CLI 0.171.0 integration passes `initialize`, `initialized`, `thread/list`, `POST /api/codex/connect`, and `GET /api/threads` using the existing ChatGPT login.
- Creating a live thread/turn is intentionally not part of the smoke suite because it starts model work and may modify the selected project. Approval, reconnect, persistence, Markdown synchronization, and worktree integration still need dedicated end-to-end coverage.
