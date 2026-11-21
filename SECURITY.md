# Security

## Dependency and supply-chain policy

- Run `node scripts/check-dependencies.mjs` before installation. It has no third-party runtime dependency.
- Review changes to every package manifest, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, and `config/dependency-policy.json` together.
- Install with `pnpm install --frozen-lockfile --ignore-scripts`, then run `pnpm audit --audit-level high` and inspect `pnpm ignored-builds`.
- Never approve lifecycle scripts globally. The current allowlist contains only `better-sqlite3` and `esbuild`; any addition requires a documented need and source review.
- Reject `latest`, wildcard, Git, arbitrary URL, and local `file:` dependency specifiers. Require registry packages with lockfile SHA-512 integrity.
- Treat a clean vulnerability audit as one signal, not proof of safety. Check maintainer/package changes and remove abandoned dependencies when practical.

The preinstall policy also blocks indicators from the May 2026 TanStack Router/Start compromise (GHSA-g7cv-rxg3-hmpx): `@tanstack/setup`, the malicious Git ref, `router_init.js`, and `tanstack_runner.js`. `@tanstack/react-query` is pinned to the reviewed `5.108.2`; do not widen or upgrade it without checking advisory scope, registry integrity, package manifest, and lockfile changes.

See `docs/installation-and-usage.md` for the ordered safe-install procedure.

## Runtime controls

- Bind HTTP and WebSocket to loopback by default and require a local bearer token.
- Allow only the configured browser origin; validate every request with Zod.
- Resolve project paths before access and reject paths outside the selected project root.
- Never read, copy, log, or persist Codex `auth.json` or access tokens.
- Keep approval policy user-controlled. Never bypass the Codex sandbox or auto-approve destructive, network, deployment, or push operations.
- Redact secrets from logs and keep telemetry disabled. Model inference is still processed by OpenAI through the authenticated Codex installation.

Report vulnerabilities privately. Include affected version, reproduction, impact, and suggested mitigation without committing live secrets.
