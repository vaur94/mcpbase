#!/usr/bin/env bash
set -euo pipefail

if ! command -v node >/dev/null 2>&1; then
  printf 'Hata: Node.js bulunamadi. Node.js LTS surumunu kurun.\n' >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  printf 'Hata: npm bulunamadi. Node.js ile birlikte npm kurulu olmali.\n' >&2
  exit 1
fi

printf 'mcpbase kurulumu basliyor...\n'
printf 'Node: %s\n' "$(node --version)"
printf 'npm: %s\n' "$(npm --version)"

npm install
npm run build

printf '\nKurulum tamamlandi.\n'
printf 'Sonraki adimlar:\n'
printf '  1. Ornek ayarlari incelemek icin examples/mcpbase.config.json dosyasina bakin.\n'
printf '  2. Gelistirme kalite kapilarini calistirmak icin: npm run ci:check\n'
printf '  3. Sunucuyu baslatmak icin: node dist/index.js\n'
