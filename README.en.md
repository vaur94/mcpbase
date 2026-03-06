# mcpbase

`mcpbase` is a stdio-first reference architecture for future MCP servers. It is meant to be copied, forked, or used as a template when starting a new MCP repository.

## Purpose

- standardize MCP server structure
- provide a reusable tool execution model
- keep configuration, logging, and security predictable
- ship with real quality gates for public GitHub and npm publishing

## What this is

- a TypeScript MCP base repository
- a reference implementation for `initialize`, `tools/list`, and `tools/call`
- a public-ready foundation for future stdio MCP servers

## What this is not

- not a domain-specific filesystem, git, or shell server
- not an HTTP transport implementation
- not a plugin mega-framework

## Highlights

- layered `src/`, `tests/`, and `docs/` structure
- `zod` validation for inputs and outputs
- deny-by-default security helpers
- structured stderr logging
- Vitest unit, integration, and protocol tests
- GitHub Actions, Dependabot, and semantic-release automation

## Quick start

```bash
npm install
npm run build
node dist/index.js --config examples/mcpbase.config.json
```

## Core docs

- Turkish landing documentation: `README.tr.md`
- Architecture overview: `docs/architecture/overview.md`
- Extension model: `docs/architecture/extension-model.md`
- Developer guide: `docs/developer-guide/local-development.md`
- Release process: `docs/developer-guide/release-process.md`

## Reference usage

1. Copy or fork this repository.
2. Rename package identity and documentation.
3. Replace example tools with real domain tools.
4. Keep the security, testing, CI, and release gates intact.

## License

MIT.
