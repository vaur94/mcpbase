# Migration Guide: mcpbase v1 to v2

Turkce surum: [docs/migration/v1-to-v2.md](../../migration/v1-to-v2.md)

This repository contains the current v2 source tree. Use this page as a source-backed summary of v2 expectations, and confirm any exact v1 behavior against legacy tags or branches before performing a production migration.

## Confirmed v2 expectations

- Package name: `@vaur94/mcpbase`
- Runtime entry point: `bootstrap(options?)`
- Config loading: `loadConfig(...)` with layered precedence and schema-based extension points
- Default transport: stdio
- Additional transport helper: Streamable HTTP
- Package subpaths: `./examples`, `./security`, and `./hub`
- Optional telemetry: `createInMemoryTelemetry`
- Capability helpers: resources, prompts, logging, sampling, and roots

## Migration checklist

1. Replace legacy package references with `@vaur94/mcpbase`.
2. Re-check your config shape against the exported runtime config helpers.
3. Move runtime construction to the v2 options-based surfaces documented in `src/index.ts`.
4. Review tool definitions for current requirements such as `name`, `title`, `description`, and Zod schemas.
5. Re-test any logging behavior to ensure protocol-safe stderr usage.
6. If you rely on security metadata or managed-server helpers, review the `./security` and `./hub` subpath docs before porting.

## Requires confirmation from legacy code

- Exact v1 constructor signatures
- Exact v1 return payload shapes
- Any v1-only configuration keys or migration scripts

## Related docs

- API reference: [`docs/en/api/v2-reference.md`](../api/v2-reference.md)
- Architecture overview: [`docs/en/architecture/overview.md`](../architecture/overview.md)

Last updated: 2026-03-11
