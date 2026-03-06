#!/usr/bin/env bash
set -euo pipefail

if ! command -v node >/dev/null 2>&1; then
  printf 'Error: Node.js was not found. Install a Node.js LTS release.\n' >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  printf 'Error: npm was not found. npm must be installed with Node.js.\n' >&2
  exit 1
fi

printf 'Starting mcpbase installation...\n'
printf 'Node: %s\n' "$(node --version)"
printf 'npm: %s\n' "$(npm --version)"

npm install
npm run build

printf '\nInstallation complete.\n'
printf 'Next steps:\n'
printf '  1. Review the sample settings in examples/mcpbase.config.json.\n'
printf '  2. Run the full quality gate: npm run ci:check\n'
printf '  3. Start the server: node dist/index.js\n'
