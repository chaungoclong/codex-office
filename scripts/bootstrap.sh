#!/usr/bin/env bash
set -Eeuo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd -- "$script_dir/.." && pwd)"
start_app=true

usage() {
  printf '%s\n' \
    "Codex Agent Office bootstrap" \
    "" \
    "Usage: ./scripts/bootstrap.sh [--no-start]" \
    "" \
    "  --no-start  Install, verify, and build without starting development servers." \
    "  --help      Show this help message."
}

for argument in "$@"; do
  case "$argument" in
    --no-start) start_app=false ;;
    --help|-h) usage; exit 0 ;;
    *) printf 'Unknown option: %s\n' "$argument" >&2; usage >&2; exit 2 ;;
  esac
done

cd "$project_root"

command -v node >/dev/null 2>&1 || { printf 'Node.js 22+ is required.\n' >&2; exit 1; }
node_major="$(node -p 'Number(process.versions.node.split(".")[0])')"
if (( node_major < 22 )); then
  printf 'Node.js 22+ is required; found %s.\n' "$(node --version)" >&2
  exit 1
fi
command -v corepack >/dev/null 2>&1 || { printf 'Corepack is required. Install it with Node.js 22+.\n' >&2; exit 1; }
command -v codex >/dev/null 2>&1 || { printf 'Codex CLI is required: https://developers.openai.com/codex/cli\n' >&2; exit 1; }

printf '[1/7] Checking dependency policy before installation...\n'
node scripts/check-dependencies.mjs

printf '[2/7] Installing the frozen lockfile with lifecycle scripts disabled...\n'
corepack pnpm install --frozen-lockfile --ignore-scripts

printf '[3/7] Auditing dependencies for known high-severity vulnerabilities...\n'
corepack pnpm audit --audit-level high

printf '[4/7] Building only approved native dependencies...\n'
corepack pnpm --filter @codex-office/database rebuild
corepack pnpm rebuild esbuild

if [[ ! -f .env ]]; then
  token="$(node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("hex"))')"
  sed "s|replace-with-a-random-local-token|$token|" .env.example > .env
  chmod 600 .env
  printf 'Created .env with a random local token.\n'
else
  printf 'Keeping existing .env unchanged.\n'
fi

printf '[5/7] Running security and type checks...\n'
corepack pnpm security:preinstall
corepack pnpm typecheck

printf '[6/7] Running tests and production build...\n'
corepack pnpm test
corepack pnpm build

printf '[7/7] Checking Codex authentication...\n'
if ! codex login status; then
  printf 'Codex is not authenticated. Run "codex login", then rerun this script.\n' >&2
  exit 1
fi

token_value="$(sed -n 's/^OFFICE_AUTH_TOKEN=//p' .env | tail -n 1)"
printf '\nSetup complete. Local UI token:\n%s\n\n' "$token_value"

if [[ "$start_app" == true ]]; then
  printf 'Starting Codex Agent Office. Open http://127.0.0.1:5173 and paste the token above.\n'
  printf 'Press Ctrl+C to stop both development servers.\n\n'
  exec corepack pnpm dev
else
  printf 'Start later with: corepack pnpm dev\n'
fi
