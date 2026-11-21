# 004 — Supply-chain Security

Status: ready_for_review

## Acceptance criteria

- Installation documentation starts with a no-lifecycle-script dependency review.
- A dependency policy rejects unsafe sources, unbounded versions, lockfile integrity failures, and unauthorized build scripts.
- Security policy tests run as part of `pnpm test`.
- High-severity registry audit findings are resolved or explicitly documented.

## Test report

- PASS: dependency-policy fixtures and repository policy validation.
- PASS: npm registry audit reports no known vulnerabilities after upgrading Drizzle ORM to 0.45.4.
- PASS: lint, strict TypeScript typecheck, Vitest/Node tests, and production build.

Independent reviewer approval is still required before `done`.
