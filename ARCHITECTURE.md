# Architecture

The browser talks to a localhost Fastify server using REST and WebSocket. The server owns authentication, validation, persistence, orchestration, and child-process lifecycle. It launches `codex app-server --listen stdio://` and exchanges newline-delimited JSON-RPC.

`packages/codex-adapter` is the only protocol boundary. It maps verified Codex notifications to stable application events and never exposes credentials. `packages/shared` owns Zod request/domain schemas. `packages/database` owns Drizzle tables and migrations. Orchestration and workflow packages remain independent of Fastify and React.

SQLite is authoritative for projects, task state, thread mappings, events, and audit records. Markdown synchronization is optimistic and must preserve unknown sections. WebSocket messages carry event IDs and timestamps so clients can deduplicate after reconnecting.
