# 008 — Installable Agent Office CLI

Status: ready_for_review

## Acceptance criteria

- `scripts/install.sh` performs safe setup and installs `agent-office` into the user's local bin directory without sudo.
- `agent-office [project]`, `--password`, `--port`, `--agent`, `--no-open`, and `setup` are parsed and documented.
- Production mode serves UI and API from one localhost port.
- A project argument is registered as the first project and the sign-in link configures the browser token without putting it in the HTTP request.
- Existing user configuration is preserved unless `setup` is explicitly run.
- Unsupported agent engines fail explicitly; no fake adapter behavior is presented.
- Shell syntax, help, validation, security policy, tests, and build pass.
