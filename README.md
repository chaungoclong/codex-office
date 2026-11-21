# Codex Agent Office

Local-first workspace for organizing projects, tasks, and Codex agents. The server launches the installed Codex App Server over stdio; it does not use Codex Cloud or store Codex credentials.

## Prerequisites

- Node.js 22+
- pnpm 11+
- Codex CLI, already authenticated (`codex login status`)

## Development

For a fresh clone on Linux or macOS, run:

```bash
./scripts/bootstrap.sh
```

The script performs supply-chain checks, installs without dependency lifecycle scripts, audits vulnerabilities, rebuilds only approved native packages, creates `.env`, runs tests/build, verifies Codex login, and starts the app. Use `./scripts/bootstrap.sh --no-start` for setup only.

Manual equivalent:

```bash
node scripts/check-dependencies.mjs
pnpm install --frozen-lockfile --ignore-scripts
pnpm audit --audit-level high
pnpm --filter @codex-office/database rebuild
pnpm rebuild esbuild
cp .env.example .env
pnpm dev
```

Open `http://127.0.0.1:5173`. API requests require `Authorization: Bearer <OFFICE_AUTH_TOKEN>`. Follow the complete [installation and usage guide](docs/installation-and-usage.md), review [SECURITY.md](SECURITY.md), and see [PLAN.md](PLAN.md) for implementation status.

## Install the command

After cloning, run the security-aware installer once:

```bash
./scripts/install.sh
```

It verifies dependency policy, installs with lifecycle scripts disabled, audits packages, rebuilds only approved packages, runs the test/build gates, and links `agent-office` into `~/.local/bin`. Then start an office with an existing project:

```bash
agent-office ~/code/my-project
agent-office --password 'correct horse' --port 4700
agent-office --no-open
agent-office setup
```

Only the `codex` adapter is currently implemented. Other recognized agent names fail explicitly instead of silently using the wrong engine.
