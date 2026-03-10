# mcpbase

English | [Turkce](./README.tr.md)

`@vaur94/mcpbase` is an ESM-only TypeScript library for building MCP servers with a stdio-first runtime, optional Streamable HTTP transport, capability helpers, security guards, telemetry, and hub-oriented utilities.

## What it provides

- Generic runtime primitives such as `bootstrap`, `ApplicationRuntime`, `ToolRegistry`, and `loadConfig`
- MCP capability helpers for resources, prompts, logging, sampling, and roots
- Security helpers including `assertFeatureEnabled`, `assertAllowedPath`, `assertAllowedCommand`, and `createSecurityEnforcementHook`
- Optional in-memory telemetry via `createInMemoryTelemetry`
- Subpath exports for `@vaur94/mcpbase/examples`, `@vaur94/mcpbase/security`, and `@vaur94/mcpbase/hub`

## Installation

Requirements:

- Node.js `>=22.14.0`
- npm `>=10.0.0`

```bash
npm install @vaur94/mcpbase
npm install zod @modelcontextprotocol/sdk
```

## Quick start

```typescript
import { bootstrap } from '@vaur94/mcpbase';
import { z } from 'zod';

await bootstrap({
  tools: [
    {
      name: 'greet',
      title: 'Greet',
      description: 'Return a greeting',
      inputSchema: z.object({ name: z.string() }),
      async execute({ name }) {
        return {
          content: [{ type: 'text', text: `Hello, ${name}!` }],
        };
      },
    },
  ],
});
```

## Project development

Use the repository setup flow when working on `mcpbase` itself:

```bash
./scripts/install.sh
```

Manual equivalent:

```bash
npm install
npm run build
node dist/index.js --config examples/mcpbase.config.json
```

## Core commands

```bash
npm run build
npm run typecheck
npm run test
npm run test:protocol
npm run ci:check
```

## Documentation

- English docs index: [`docs/en/index.md`](./docs/en/index.md)
- Turkish docs index: [`docs/index.md`](./docs/index.md)
- API overview: [`docs/en/api/v2-reference.md`](./docs/en/api/v2-reference.md)
- Migration guide: [`docs/en/migration/v1-to-v2.md`](./docs/en/migration/v1-to-v2.md)
- Architecture overview: [`docs/en/architecture/overview.md`](./docs/en/architecture/overview.md)
- Local development guide: [`docs/en/developer-guide/local-development.md`](./docs/en/developer-guide/local-development.md)

## Contributing and support

- Contribution guide: [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- Security policy: [`SECURITY.md`](./SECURITY.md)
- Support paths: [`SUPPORT.md`](./SUPPORT.md)
- Release overview: [`RELEASE.md`](./RELEASE.md)

## License

MIT. See [`LICENSE`](./LICENSE).

Last updated: 2026-03-11
