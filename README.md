# mcpbase

🇬🇧 English | [🇹🇷 Türkçe](./README.tr.md)

> **`@vaur94/mcpbase`** — A production-ready base library for building MCP servers in TypeScript. Generic types, 6 MCP capabilities, Streamable HTTP transport, and an execution hook system — all in one installable package.

---

## ✨ Why mcpbase

- 📦 **Install, don't fork** — `npm install @vaur94/mcpbase` and extend
- 🧬 **Fully generic** — `BaseRuntimeConfig<TExtras>`, `AppError<TCode>`, `ToolDefinition<I,O,TContext>` — type-safe by default
- 🔌 **All 6 MCP capabilities** — Tools, Resources, Prompts, Logging, Sampling, Roots
- 🌐 **Dual transport** — stdio + Streamable HTTP out of the box
- 🪝 **Hook system** — `beforeExecute`, `afterExecute`, `onError` for cross-cutting concerns
- 🧪 **TDD test suite** — 200+ tests, 90%+ coverage, protocol tests included
- 🚀 **CI-ready** — GitHub Actions, semantic-release, Dependabot wired up

---

## 📦 Installation

```bash
npm install @vaur94/mcpbase
# peer dependencies
npm install zod @modelcontextprotocol/sdk
```

---

## ⚡ Quick Start

### Minimal — zero config

```typescript
import { bootstrap } from '@vaur94/mcpbase';

await bootstrap(); // starts stdio MCP server with example tools
```

### With your own tools

```typescript
import { bootstrap } from '@vaur94/mcpbase';
import { z } from 'zod';

await bootstrap({
  tools: [
    {
      name: 'greet',
      description: 'Greet someone',
      inputSchema: z.object({ name: z.string() }),
      execute: async ({ name }) => ({
        content: [{ type: 'text', text: `Hello, ${name}!` }],
      }),
    },
  ],
});
```

### With custom config schema

```typescript
import { bootstrap, createRuntimeConfigSchema } from '@vaur94/mcpbase';
import { z } from 'zod';

const configSchema = createRuntimeConfigSchema(
  z.object({
    storage: z.object({ path: z.string() }),
  }),
);

await bootstrap({
  configSchema,
  tools: myTools,
  hooks: {
    beforeExecute: async (tool, input, ctx) => {
      console.error(`[${ctx.requestId}] → ${tool.name}`);
    },
  },
});
```

### Streamable HTTP transport

```typescript
import { createMcpServer, startStreamableHttpServer, loadConfig } from '@vaur94/mcpbase';
import { createServer } from 'node:http';

const config = await loadConfig(baseRuntimeConfigSchema);
const runtime = new ApplicationRuntime({ config, logger, tools });
const server = createMcpServer(runtime, { enableLogging: true });

createServer(async (req, res) => {
  await startStreamableHttpServer(server, { req, res });
}).listen(3000);
```

---

## 🏗️ Project Shape

```
src/
├── contracts/          # Generic type definitions
│   ├── runtime-config.ts   # BaseRuntimeConfig<TExtras>, createRuntimeConfigSchema
│   ├── tool-contract.ts    # ToolDefinition<I,O,TContext>, ToolAnnotations
│   └── hooks.ts            # ExecutionHooks<TContext>
├── core/               # Error + context
│   ├── app-error.ts        # AppError<TCode>, BaseAppErrorCode
│   └── execution-context.ts # BaseToolExecutionContext<TConfig>
├── application/        # Runtime + registry
│   ├── runtime.ts          # ApplicationRuntime<TConfig,TContext>
│   └── tool-registry.ts    # ToolRegistry<TContext>
├── config/             # Config loading
│   └── load-config.ts      # loadConfig<TConfig>(schema, options?)
├── capabilities/       # MCP capability modules
│   ├── resources.ts        # registerResources, registerResourceTemplates
│   ├── prompts.ts          # registerPrompts, registerPromptTemplates
│   ├── logging.ts          # createMcpLoggingBridge
│   ├── sampling.ts         # createSamplingHelper
│   └── roots.ts            # createRootsHandler
├── transport/          # Transport adapters
│   ├── mcp/server.ts       # createMcpServer, startStdioServer
│   ├── mcp/streamable-http.ts # startStreamableHttpServer
│   └── transport-factory.ts   # createTransport (stdio | streamable-http)
├── examples/index.ts   # @vaur94/mcpbase/examples subpath
└── security/index.ts   # @vaur94/mcpbase/security subpath
```

---

## 🔁 Renaming for Your Project

When building a new MCP server on top of mcpbase, here's what to update:

### 1. `package.json`

```json
{
  "name": "@yourscope/your-mcp-server",
  "version": "1.0.0",
  "description": "Your MCP server description"
}
```

### 2. Server identity (in your config or bootstrap)

```typescript
// mcpbase.config.json
{
  "server": {
    "name": "your-mcp-server",
    "version": "1.0.0"
  }
}
```

### 3. Extend the config schema

```typescript
import { createRuntimeConfigSchema } from '@vaur94/mcpbase';
import { z } from 'zod';

// Add your domain-specific config fields
export const myConfigSchema = createRuntimeConfigSchema(
  z.object({
    storage: z.object({ rootPath: z.string() }),
    limits: z.object({ maxFileSize: z.number().default(10_000_000) }),
  }),
);
```

### 4. Extend the error codes

```typescript
import type { BaseAppErrorCode } from '@vaur94/mcpbase';

export type MyErrorCode = BaseAppErrorCode | 'STORAGE_ERROR' | 'QUOTA_EXCEEDED';
```

### 5. Extend the execution context

```typescript
import type { BaseToolExecutionContext } from '@vaur94/mcpbase';
import type { MyConfig } from './config.js';

export interface MyContext extends BaseToolExecutionContext<MyConfig> {
  storage: StorageManager;
}
```

### 6. Wire it all together

```typescript
import { bootstrap } from '@vaur94/mcpbase';
import { myConfigSchema } from './config.js';
import { myTools } from './tools/index.js';

await bootstrap<MyConfig, MyContext>({
  configSchema: myConfigSchema,
  tools: myTools,
  contextFactory: (toolName, requestId, config) => ({
    requestId,
    toolName,
    config,
    storage: new StorageManager(config.storage.rootPath),
  }),
});
```

### 7. Subpath imports

```typescript
// Example tools (for reference / testing)
import { createExampleTools } from '@vaur94/mcpbase/examples';

// Security guards + PERMISSION_DENIED error code
import {
  assertFeatureEnabled,
  assertAllowedPath,
  PERMISSION_DENIED,
} from '@vaur94/mcpbase/security';
```

---

## 📚 Documentation

- 🗺️ [v1 → v2 Migration Guide](./docs/en/migration/v1-to-v2.md)
- 📖 [API Reference](./docs/en/api/v2-reference.md)
- 🏛️ [Architecture Overview](./docs/en/architecture/overview.md)
- 🔧 [Developer Guide](./docs/en/developer-guide/local-development.md)
- 🇹🇷 [Türkçe Dokümantasyon](./docs/)

---

## 🧪 Quality Gates

```bash
npm run ci:check      # format + lint + typecheck + coverage + build
npm run test          # unit tests (202 tests, 25 files)
npm run test:protocol # stdio protocol tests (4 tests)
npm run test:coverage # coverage report (90%+ thresholds)
npm run build         # produces dist/ with 3 entry points
```

---

## 📄 License

MIT. See [`LICENSE`](./LICENSE).
