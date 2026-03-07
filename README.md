# mcpbase

[English](./README.md) | [Turkce](./README.tr.md)

`mcpbase` is a polished, stdio-first reference repository for building future MCP servers with a predictable architecture, real quality gates, and publish-ready automation.

## Why mcpbase

- starts new MCP repositories from a clean, reusable baseline
- keeps runtime, config, logging, and security behavior consistent
- ships with unit, integration, and protocol tests instead of placeholder coverage
- provides GitHub-ready project hygiene and npm release wiring

## Highlights

- layered TypeScript architecture under `src/`
- `zod` input and output validation
- deny-by-default security guards for features, commands, and paths
- structured stderr logging for MCP-safe observability
- `vitest` coverage, integration, and stdio protocol verification
- GitHub Actions, Dependabot, and semantic-release integration

## Quick Start

Use the install script for the fastest local bootstrap:

```bash
./scripts/install.sh
```

Then run the server with the sample config:

```bash
node dist/index.js --config examples/mcpbase.config.json
```

## Manual Setup

```bash
npm install
npm run build
node dist/index.js --config examples/mcpbase.config.json
```

## Project Shape

- `src/core` - errors, results, execution context contracts
- `src/application` - runtime flow, tool registry, example tools
- `src/transport/mcp` - official MCP stdio adapter
- `src/config` - defaults plus file, env, and CLI precedence
- `src/security` - feature, command, and path guards
- `tests/` - unit, integration, protocol, and fixtures
- `docs/` - Turkish docs tree
- `docs/en/` - English docs tree

## Read Next

- English docs index: `docs/README.en.md`
- Turkish docs tree: `docs/`
- Architecture overview: `docs/en/architecture/overview.md`
- Extension model: `docs/en/architecture/extension-model.md`
- Developer guide: `docs/en/developer-guide/local-development.md`
- Release process: `docs/en/developer-guide/release-process.md`

## Use It As a Base

1. Copy or fork this repository.
2. Rename the package, server identity, and docs.
3. Replace the example tools with your real domain tools.
4. Keep the testing, security, and release gates intact.

## License

MIT. See `LICENSE`.
