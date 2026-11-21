# 006 — One-command Bootstrap

Status: ready_for_review

## Acceptance criteria

- A fresh Linux/macOS clone can be safely installed, configured, verified, and started with one script.
- Dependency lifecycle scripts stay disabled until the explicit allowlist rebuild step.
- Existing `.env` files are preserved; new tokens are generated cryptographically and stored mode 600.
- Server development and production scripts load the root `.env`.
- Bootstrap syntax and help behavior run in the standard test suite.

## Test report

- PASS: `./scripts/bootstrap.sh --no-start` completed frozen install, audit, allowlisted rebuilds, environment creation, Codex login check, tests, and production build.
- PASS: generated `.env` uses a cryptographically random token and mode 600; an existing file is preserved by design.
- PASS: `pnpm dev` loaded the root environment and served the web UI on port 5173 and authenticated API on port 4310.
- PASS: security policy, registry audit, lint, strict TypeScript typecheck, 29 test scenarios, and production build.

Independent reviewer approval is required before `done`.
