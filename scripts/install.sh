#!/usr/bin/env bash
set -Eeuo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd -- "$script_dir/.." && pwd)"
bin_dir="${AGENT_OFFICE_BIN_DIR:-${HOME}/.local/bin}"

cd "$project_root"
./scripts/bootstrap.sh --no-start
mkdir -p "$bin_dir"
ln -sfn "$project_root/scripts/agent-office" "$bin_dir/agent-office"

printf 'Installed command: %s/agent-office\n' "$bin_dir"
case ":$PATH:" in
  *":$bin_dir:"*) ;;
  *) printf 'Add this directory to PATH:\n  export PATH="%s:$PATH"\n' "$bin_dir" ;;
esac

if [[ -t 0 ]]; then
  printf '\nStarting first-time setup. Press Ctrl+C to skip.\n'
  "$bin_dir/agent-office" setup
else
  printf 'Run "agent-office setup" in an interactive terminal before first use.\n'
fi
