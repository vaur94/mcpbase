# Getting Started

Turkce surum: [docs/user-guide/getting-started.md](../../user-guide/getting-started.md)

## Run the repository locally

Requirements:

- Node.js `>=22.14.0`
- npm `>=10.0.0`

Preferred setup flow:

```bash
./scripts/install.sh
```

Manual setup:

```bash
npm install
npm run build
node dist/index.js --config examples/mcpbase.config.json
```

## First checks

- Register the stdio command in your host tool.
- Verify server identity with `server_info`.
- Verify the `tools/call` flow with `text_transform`.

## Next steps

- Inspect `src/application/example-tools.ts` before replacing the example tools.
- See `docs/en/configuration/configuration-reference.md` for config details.
- Continue with `docs/en/developer-guide/local-development.md` for contributor workflow.

Last updated: 2026-03-11
