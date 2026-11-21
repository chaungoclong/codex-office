# 002 — Codex vertical slice

Status: ready_for_review

## Acceptance criteria

- Start the installed Codex App Server through stdio and complete initialization.
- Start/list/resume threads, start/steer/interrupt turns, and stream notifications.
- Persist real thread IDs and events; surface approval requests without auto-approval.
- Test framing, request correlation, process failures, and event mapping.

## Test report

- PASS: JSON-RPC framing and notification unit tests.
- PASS: Codex CLI 0.171.0 `initialize`, `initialized`, and `thread/list` smoke test.
- PASS: application integration through `/api/codex/connect` and `/api/threads`.
- NOT RUN: live `thread/start` and `turn/start`; these can begin model work and modify a user-selected project.

Independent reviewer approval is still required before `done`.
