# 007 — Usable UI Vertical Slice

Status: ready_for_review

## Acceptance criteria

- Navigation changes visible screens instead of rendering inert buttons.
- Every async action shows pending, success, or error feedback.
- Users can save the local token, connect Codex, list/create projects, create tasks, and perform allowed task transitions.
- Users can list/start/resume Codex threads, submit a prompt, inspect pending approvals, and approve or reject supported requests.
- Realtime activity and connection status are visible.
- Interaction tests cover navigation, token feedback, and API failure feedback.

## Test plan

- React interaction tests with mocked fetch/WebSocket.
- Existing Fastify feature tests for the backing APIs.
- Security policy, audit, lint, typecheck, complete tests, and production build.

## Test report

- PASS: five React interaction tests for navigation, token persistence, visible connection success/errors, and project creation feedback.
- PASS: API header regression tests ensure bodyless POST requests do not send an invalid JSON content type.
- PASS: project/task/thread/approval screens compile against strict TypeScript and build with Vite.
- PASS: TanStack Query 5.108.2 is pinned; package manifest and lockfile contain none of the GHSA-g7cv-rxg3-hmpx indicators.
- PASS: Testing Library/jsdom metadata and SHA-512 integrity were checked before install; lifecycle scripts were disabled.
- PASS: registry audit reports no known vulnerabilities.
- PASS: security policy, lint, typecheck, complete tests, and production build.

Independent reviewer approval is required before `done`.
