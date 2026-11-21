#!/usr/bin/env bash
set -euo pipefail
output_dir="${1:-/tmp/codex-office-protocol}"
mkdir -p "$output_dir/types" "$output_dir/schema"
codex app-server generate-ts --out "$output_dir/types" --experimental
codex app-server generate-json-schema --out "$output_dir/schema" --experimental
echo "Protocol artifacts written to $output_dir"
