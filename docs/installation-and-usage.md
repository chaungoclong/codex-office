# Installation and Usage

## Requirements

- Node.js 22 or newer.
- Corepack with pnpm 11.2.2 (the exact version is pinned in `package.json`).
- Codex CLI 0.171.0 or a protocol-compatible newer version.
- An existing ChatGPT login reported by `codex login status`.

The application stores projects, tasks, thread mappings, and events locally. Model inference still runs through OpenAI using the Codex login; no separate API key is required.

## Supply-chain checks before installation

### Automated setup

After cloning the repository on Linux or macOS:

```bash
git clone <repository-url> codex-office
cd codex-office
./scripts/bootstrap.sh
```

This performs the complete safe-install sequence, creates a mode-600 `.env` with a random token when needed, runs validation/tests/build, checks Codex authentication, prints the UI token, and starts both development servers. It never overwrites an existing `.env`. Pass `--no-start` to prepare the project without starting it.

### Manual setup

Never start with an unrestricted `pnpm install` on an unreviewed change. From the repository root:

```bash
node scripts/check-dependencies.mjs
git diff -- package.json pnpm-lock.yaml pnpm-workspace.yaml config/dependency-policy.json
pnpm install --frozen-lockfile --ignore-scripts
pnpm audit --audit-level high
pnpm ignored-builds
```

The policy command rejects unbounded versions, blocked packages, remote/VCS specifiers, missing lockfile integrity records, merge markers, and unauthorized build scripts. `--ignore-scripts` prevents dependency lifecycle code from executing during download. Review audit findings and every package reported by `pnpm ignored-builds` before proceeding.

Only `better-sqlite3` and `esbuild` are currently approved to run install scripts. Verify that `pnpm-workspace.yaml` and `config/dependency-policy.json` contain no unexpected additions, then build them:

```bash
pnpm --filter @codex-office/database rebuild
pnpm rebuild esbuild
pnpm security:preinstall
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Stop if the lockfile changes during a frozen install, integrity verification fails, an unfamiliar lifecycle package appears, or a high/critical audit finding has no documented mitigation. Registry audit results complement—rather than replace—manual review.

## Configure and run

### Installed command (recommended)

Install from a reviewed clone:

```bash
./scripts/install.sh
```

The installer runs the dependency-policy check before downloading packages, installs with scripts disabled, audits the lockfile, rebuilds only the approved native dependencies, and executes lint, typecheck, test, and build. It creates a symlink at `~/.local/bin/agent-office` without `sudo`; add that directory to `PATH` if prompted.

Examples:

```bash
agent-office ~/code/my-project          # register an existing project as the first floor
agent-office --password 'correct horse' # choose the local UI password
agent-office --port 4700                # choose the localhost port
agent-office --agent codex              # select the implemented agent adapter
agent-office --no-open                  # print the sign-in link
agent-office setup                      # rerun setup while the office is stopped
```

Configuration and the SQLite database live under `${XDG_CONFIG_HOME:-~/.config}/agent-office`. The configuration file is mode `600`. Passwords are not stored verbatim. Keep the terminal open while the office runs; press `Ctrl+C` to stop it.

Names `claude`, `opencode`, `grok`, `muse`, `dsh`, `pi`, and `cursor-agent` are reserved for future adapters. Selecting one currently exits with an actionable error; it never impersonates Codex behavior.

### Development mode

```bash
cp .env.example .env
openssl rand -hex 32
```

Put the generated value in `OFFICE_AUTH_TOKEN`. Keep `HOST=127.0.0.1`; do not expose the server to a LAN or public interface. Confirm Codex authentication, then start development mode:

```bash
codex login status
pnpm dev
```

Open `http://127.0.0.1:5173`, paste the local token into the token field, and select **Save locally**. Choose **Connect Codex** to start the local App Server. The Overview then displays actual Codex state, threads, pending approvals, and realtime activity.

## Typical workflow

1. Add an existing absolute project directory through the Projects API/UI.
2. Create tasks with explicit acceptance criteria and dependencies.
3. Create or resume a Codex thread for an agent working in that project.
4. Review command, file, permission, and network approval requests before deciding.
5. Move implementation through testing and independent review; coders cannot mark tasks `done`.

Useful checks:

```bash
curl http://127.0.0.1:4310/health
pnpm test
pnpm build
```

Authenticated API calls require `Authorization: Bearer <OFFICE_AUTH_TOKEN>` and the configured browser `Origin`. To stop development mode, press `Ctrl+C`. SQLite data defaults to `data/codex-office.db`; back it up only while the server is stopped.

## Troubleshooting

- **401 Unauthorized:** save the same token used by the server in the web UI.
- **Origin not allowed:** make `WEB_ORIGIN` match the exact Vite URL.
- **Codex connection failed:** run `codex login status` and `codex app-server --help`.
- **Missing SQLite binding:** review the allowlist, then run `pnpm --filter @codex-office/database rebuild`.
- **Protocol mismatch after upgrading Codex:** run `scripts/verify-protocol.sh` and review generated schema changes before editing the adapter.
