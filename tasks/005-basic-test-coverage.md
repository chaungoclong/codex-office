# 005 — Basic Unit and Feature Coverage

Status: ready_for_review

## Acceptance criteria

- Unit tests cover shared schemas, workflow transitions, concurrency, and JSON-RPC failures.
- Persistence tests verify SQLite security pragmas and idempotent migrations.
- Feature tests exercise authentication, Origin checks, project import, task creation, and valid/invalid transitions.
- `AGENTS.md` documents the task lifecycle and required verification gates.

## Test report

- PASS: 25 Vitest unit/feature cases across schemas, workflow, concurrency, JSON-RPC, SQLite, and Fastify APIs.
- PASS: 5 dependency-policy cases using Node's test runner, including TanStack compromise IOC detection.
- PASS: lint, strict TypeScript typecheck, complete test suite, and production build.

Independent reviewer approval is required before `done`.
