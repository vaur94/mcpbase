# mcpbase

[English](./README.en.md) | [Turkce](./README.tr.md)

`mcpbase` is the English project guide for the stdio-first MCP base repository. `README.md` is the default English landing page, while this file provides the same guidance as a dedicated language-specific entrypoint.

## Quick Start

Preferred bootstrap path:

```bash
./scripts/install.sh
```

Manual path:

```bash
npm install
npm run build
node dist/index.js --config examples/mcpbase.config.json
```

## What You Get

- a reusable TypeScript MCP server foundation
- a clear runtime pipeline for `initialize`, `tools/list`, and `tools/call`
- strict validation with `zod`
- structured stderr logging
- deny-by-default security helpers
- public-repository hygiene for GitHub and npm workflows

## Architecture Map

- `src/core` - result and error primitives
- `src/application` - runtime orchestration and tool registration
- `src/transport/mcp` - stdio server integration
- `src/config` - default, file, env, and CLI configuration loading
- `src/logging` - structured logger implementations
- `src/security` - permission guards
- `tests/` - unit, integration, and protocol verification

## Documentation

- Default English landing page: `README.md`
- Turkish README: `README.tr.md`
- English docs index: `docs/README.en.md`
- English architecture docs: `docs/en/architecture/`
- English developer docs: `docs/en/developer-guide/`
- Turkish docs tree: `docs/`

## When To Use It

Use `mcpbase` when you want to start a new MCP server without rebuilding config loading, logging, validation, security guards, test layout, and release wiring from scratch.

## License

MIT. See `LICENSE`.
