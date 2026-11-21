# 001 — Foundation

Status: ready_for_review

## Acceptance criteria

- pnpm TypeScript workspace contains web, server, and domain packages.
- SQLite schema covers core durable entities.
- Server validates authentication and exposes health/status APIs.
- Build and unit tests pass when dependencies are available.

## Test report

- PASS: lint, strict TypeScript typecheck, Vitest suites, and production build.
- PASS: Fastify injection tests for health, authentication, and project path validation.
- PASS: production server smoke test on localhost with SQLite persistence.

Independent reviewer approval is still required before `done`.
