# Repository Guidelines

## Project Structure & Module Organization

Codex Agent Office is a local-first TypeScript monorepo. Treat `DESIGN.md` as the requirements source:

- `apps/web`: React/Vite dashboard, React Flow view, and PixiJS office.
- `apps/server`: Fastify REST/WebSocket services.
- `packages/codex-adapter`: verified JSON-RPC integration with Codex App Server.
- `packages/orchestrator` and `packages/workflow-engine`: scheduling and workflows.
- `packages/database`, `packages/shared`, and `packages/ui`: persistence, contracts, and UI.
- `tests`: cross-package integration and Playwright tests.
- `docs`, `config`, `scripts`, and `tasks`: documentation, tooling, and feature records.

Create a numbered task such as `tasks/005-markdown-sync.md` for every significant feature. Keep generated output (`dist/`, coverage, databases) out of version control.

## Build, Test, and Development Commands

Use pnpm workspace commands from the root:

- `./scripts/bootstrap.sh` — safely install, configure, verify, build, and start a fresh clone (`--no-start` performs setup only).
- `pnpm security:preinstall` — validate manifests, lockfile integrity, dependency sources, and lifecycle-script allowlist.
- `pnpm security:audit` — query the registry for known high-severity vulnerabilities.
- `pnpm dev` — run web and server locally.
- `pnpm build` — type-check and build all workspaces.
- `pnpm lint` and `pnpm typecheck` — enforce formatting and strict TypeScript.
- `pnpm test` — run security, unit, persistence, and feature tests.
- `pnpm test:e2e` — run Playwright tests.

For a fresh install, follow `docs/installation-and-usage.md`: run the dependency policy first, install with `--frozen-lockfile --ignore-scripts`, inspect audit/ignored builds, then rebuild only allowlisted native packages. Never broaden `allowBuilds` merely to make installation pass.

## Coding Style & Naming Conventions

Use strict TypeScript, two-space indentation, and root-level formatter/linter configuration. Use `PascalCase` for components/types, `camelCase` for functions/variables, and `kebab-case` for feature files. Define shared schemas with Zod in `packages/shared`.

Never invent Codex JSON-RPC methods or payloads. Verify them against official App Server documentation and the installed CLI. Translate Codex events into domain events at the adapter boundary.

## Testing Guidelines

Use Vitest for TypeScript unit/feature tests, Node's test runner for preinstall security checks, and Playwright for browser flows. Name files `*.test.ts`, `*.test.mjs`, or `*.spec.ts`. Keep unit tests beside source; place cross-package and E2E suites under `tests/`.

Every behavior change needs a focused unit test plus a feature/integration test when it crosses API, database, process, or WebSocket boundaries. Test success, validation failure, authorization, and state-transition rejection. Use temporary databases/directories; never live user data. Mocks may test framing and failures but cannot replace a real Codex CLI smoke test. Report any skipped integration and its exact blocker.

Before handoff, run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`. Record exact results in the task file; do not say “tests pass” when only a subset ran.

## Task Execution Workflow

1. Read `DESIGN.md`, `AGENTS.md`, related architecture/security docs, and existing code before editing.
2. Create or update one numbered task file. Define scope, acceptance criteria, dependencies, security impact, and test plan before implementation.
3. Set the task to `analyzing`, then `planning`; document important assumptions. Do not skip workflow states to make progress appear faster.
4. Move to `in_progress` and implement the smallest real vertical slice. Do not use fake timers, hardcoded success data, guessed Codex methods, or mocks in production paths.
5. Self-review the diff for scope, secrets, path traversal, approval behavior, persistence, and backward compatibility.
6. Add/update unit and feature tests. Run the four quality gates and any relevant real CLI/runtime smoke test.
7. Append a test report listing PASS, FAIL, and NOT RUN items with reasons. Update docs and the task index when behavior or operations changed.
8. Move successful coder work to `ready_for_test`, then `ready_for_review` after test evidence exists. Coders never set `done`; independent tester and reviewer approval plus zero blockers are required.

If blocked, record the concrete error and attempted alternatives. Ask the user only for a material product decision or required permission, not for routine implementation choices.

## Commits & Pull Requests

Use focused Conventional Commits, for example `feat(adapter): persist thread mapping`. Pull requests must link a task, summarize impact, list verification commands, and include UI screenshots. Call out migrations, security implications, and unverified paths.

## Security & Agent Workflow

Keep data local, bind to localhost by default, validate inputs and origins, and prevent path traversal. Never store Codex tokens or `auth.json`, bypass the sandbox, deploy, push, resolve merge conflicts automatically, or run destructive actions without explicit approval. Preserve user-edited Markdown during synchronization. Review manifest and lockfile changes as security-sensitive code; reject unexpected lifecycle scripts, remote dependency sources, or integrity changes.

Coders cannot mark tasks `done`. Completion requires acceptance criteria, self-tests, tester approval, reviewer approval, and no blocking defects. Use isolated Git worktrees for parallel work; do not assign overlapping files without coordination.
