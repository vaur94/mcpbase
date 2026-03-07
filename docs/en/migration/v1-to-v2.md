# Migration Guide: mcpbase v1 to v2

This guide covers all breaking changes when migrating from mcpbase v1 to v2. The v2 release introduces generic type parameters, a new options-based constructor pattern, MCP capabilities (resources, prompts, logging, sampling, roots), and Streamable HTTP transport.

## Quick Start (v2)

Before diving into the details, here is a minimal v2 setup:

```typescript
import { bootstrap, createRuntimeConfigSchema } from '@vaur94/mcpbase';
import { z } from 'zod';

const configSchema = createRuntimeConfigSchema(z.object({}));

await bootstrap({
  configSchema,
  tools: [
    {
      name: 'hello',
      title: 'Hello',
      description: 'Says hello',
      inputSchema: z.object({ name: z.string() }),
      execute: async (input) => ({ content: `Hello, ${input.name}!` }),
    },
  ],
});
```

## Breaking Changes

### 1. Package Name and Installation

The package name changed from the fork-template to the official name.

**Before (v1):**

```bash
npm install fork-template
```

**After (v2):**

```bash
npm install @vaur94/mcpbase
```

### 2. Peer Dependencies

The `zod` and `@modelcontextprotocol/sdk` packages are now peer dependencies and must be installed separately.

**Before (v1):**

```bash
npm install  # zod and @modelcontextprotocol/sdk were bundled
```

**After (v2):**

```bash
npm install @vaur94/mcpbase zod @modelcontextprotocol/sdk
```

### 3. RuntimeConfig to BaseRuntimeConfig

The base configuration type no longer includes the `security` field. Use `BaseRuntimeConfig<TExtras>` with a generic parameter to add custom fields, or use `RuntimeConfig` for the full schema with security.

**Before (v1):**

```typescript
import type { RuntimeConfig } from '@vaur94/mcpbase';

const config: RuntimeConfig = {
  server: { name: 'my-server', version: '1.0.0' },
  logging: { level: 'info', includeTimestamp: true },
  security: {
    features: { serverInfoTool: true, textTransformTool: true },
    commands: { allowed: ['ls', 'cat'] },
    paths: { allowed: ['/home'] },
  },
};
```

**After (v2):**

```typescript
import type { BaseRuntimeConfig, RuntimeConfig } from '@vaur94/mcpbase';

// Base config (no security)
const baseConfig: BaseRuntimeConfig = {
  server: { name: 'my-server', version: '1.0.0' },
  logging: { level: 'info', includeTimestamp: true },
};

// Full config with security
const fullConfig: RuntimeConfig = {
  ...baseConfig,
  security: {
    features: { serverInfoTool: true, textTransformTool: true },
    commands: { allowed: ['ls', 'cat'] },
    paths: { allowed: ['/home'] },
  },
};

// Custom config with extra fields
interface CustomConfig extends BaseRuntimeConfig<{ customField: string }> {
  customField: string;
}
```

### 4. AppError: PERMISSION_DENIED Included in Base

The `PERMISSION_DENIED` error code is included in the base `AppErrorCode` type, as it is a common requirement for secure tool execution.

**Before (v1):**

```typescript
import { AppError, type AppErrorCode } from '@vaur94/mcpbase';

const error = new AppError<AppErrorCode>('PERMISSION_DENIED', 'Access denied');
```

**After (v2):**

```typescript
import { AppError, type AppErrorCode } from '@vaur94/mcpbase';

// PERMISSION_DENIED remains available in AppErrorCode
const error = new AppError<AppErrorCode>('PERMISSION_DENIED', 'Access denied');
```

### 4.1. SecureToolDefinition for Feature Flags

Tool-level security metadata is now handled by `SecureToolDefinition`. The base `ToolDefinition` is lean and does not contain security fields.

**Before (v1):**

```typescript
const tool: ToolDefinition = {
  name: 'tool',
  security: { requiredFeature: 'feature' },
  // ...
};
```

**After (v2):**

```typescript
import { type SecureToolDefinition } from '@vaur94/mcpbase/security';

const tool: SecureToolDefinition = {
  name: 'tool',
  security: { requiredFeature: 'feature' },
  // ...
};
```

### 5. ApplicationRuntime Constructor: Positional to Options Object

The constructor changed from positional arguments to an options object.

**Before (v1):**

```typescript
import { ApplicationRuntime, StderrLogger } from '@vaur94/mcpbase';

const logger = new StderrLogger({ level: 'info', includeTimestamp: true });
const runtime = new ApplicationRuntime(config, logger, tools);
```

**After (v2):**

```typescript
import { ApplicationRuntime, StderrLogger } from '@vaur94/mcpbase';

const logger = new StderrLogger({ level: 'info', includeTimestamp: true });
const runtime = new ApplicationRuntime({
  config,
  logger,
  tools,
  contextFactory: (toolName, requestId, config) => ({
    requestId,
    toolName,
    config,
  }),
  hooks: [
    {
      beforeExecute: async (tool, input, context) => {
        console.log(`Executing ${tool.name}`);
      },
    },
  ],
});
```

### 6. bootstrap() Now Accepts BootstrapOptions

The `bootstrap()` function signature changed from accepting `argv` to accepting a full `BootstrapOptions` object.

**Before (v1):**

```typescript
import { bootstrap } from '@vaur94/mcpbase';

await bootstrap(process.argv);
```

**After (v2):**

```typescript
import { bootstrap, createRuntimeConfigSchema } from '@vaur94/mcpbase';
import { z } from 'zod';

const configSchema = createRuntimeConfigSchema(z.object({}));

await bootstrap({
  configSchema,
  tools: myTools,
  loggerFactory: (config) => new CustomLogger(config),
  contextFactory: (toolName, requestId, config) => ({
    requestId,
    toolName,
    config,
  }),
  hooks: myHooks,
  transport: 'stdio',
  argv: process.argv,
});
```

### 7. loadConfig() Now Generic

The `loadConfig()` function now accepts a generic schema parameter.

**Before (v1):**

```typescript
import { loadConfig } from '@vaur94/mcpbase';

const config = await loadConfig(process.argv);
```

**After (v2):**

```typescript
import { loadConfig, createRuntimeConfigSchema } from '@vaur94/mcpbase';
import { z } from 'zod';

const customSchema = createRuntimeConfigSchema(
  z.object({
    custom: z.string(),
  }),
);

const config = await loadConfig(customSchema, {
  envPrefix: 'MCP_',
  defaultConfigFile: 'my-config.json',
  argv: process.argv,
});

// Or use the default schema
const defaultConfig = await loadConfig();
```

### 8. New Capabilities: Resources, Prompts, Logging, Sampling, Roots

v2 introduces six new MCP capabilities that can be registered on the MCP server.

**Resources:**

```typescript
import { registerResources, registerResourceTemplates } from '@vaur94/mcpbase';

const resources = [
  {
    uri: 'file:///data/config.json',
    name: 'config',
    description: 'Application configuration',
    mimeType: 'application/json',
    handler: async () => ({
      contents: [{ uri: 'file:///data/config.json', mimeType: 'application/json', text: '{}' }],
    }),
  },
];

registerResources(server, resources);
```

**Prompts:**

```typescript
import { registerPrompts, registerPromptTemplates } from '@vaur94/mcpbase';

const prompts = [
  {
    name: 'analyze-code',
    description: 'Analyze code for issues',
    messages: [{ role: 'user', content: { type: 'text', text: 'Analyze this code: {{code}}' } }],
  },
];

registerPrompts(server, prompts);
```

**Logging Bridge:**

```typescript
import { createMcpLoggingBridge } from '@vaur94/mcpbase';

const loggingBridge = createMcpLoggingBridge(server);
loggingBridge.log('info', 'my-app', { message: 'Hello from MCP' });
loggingBridge.setLevel('warn');
```

**Sampling:**

```typescript
import { createSamplingHelper } from '@vaur94/mcpbase';

const sampling = createSamplingHelper(server);
const response = await sampling.requestSampling({
  messages: [{ role: 'user', content: { type: 'text', text: 'Hello' } }],
  maxTokens: 1024,
});
```

**Roots:**

```typescript
import { createRootsHandler } from '@vaur94/mcpbase';

const roots = createRootsHandler(server);
roots.onRootsChanged((newRoots) => {
  console.log('Roots changed:', newRoots);
});

const currentRoots = await roots.listRoots();
```

### 9. New Transport: Streamable HTTP

v2 adds support for Streamable HTTP transport in addition to stdio.

**Stdio (unchanged):**

```typescript
import { createMcpServer, startStdioServer } from '@vaur94/mcpbase';

const server = createMcpServer(runtime);
await startStdioServer(server);
```

**Streamable HTTP (new):**

```typescript
import { createMcpServer, startStreamableHttpServer } from '@vaur94/mcpbase';
import http from 'node:http';

const server = createMcpServer(runtime);

const httpServer = http.createServer(async (req, res) => {
  await startStreamableHttpServer(server, { req, res });
});

httpServer.listen(3000);
```

### 10. Subpath Exports

New subpath exports are available for specific modules.

**Security functions:**

```typescript
import {
  assertFeatureEnabled,
  assertAllowedCommand,
  assertAllowedPath,
} from '@vaur94/mcpbase/security';
```

**Examples:**

```typescript
import { createExampleTools } from '@vaur94/mcpbase/examples';
```

## Summary of API Changes

| v1 (Old)                                        | v2 (New)                                                                                                       |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `npm install fork-template`                     | `npm install @vaur94/mcpbase`                                                                                  |
| `RuntimeConfig`                                 | `BaseRuntimeConfig<TExtras>` or `RuntimeConfig`                                                                |
| `AppErrorCode`                                  | `AppErrorCode` (includes `PERMISSION_DENIED`); `BaseAppErrorCode` (excludes it)                                |
| `new ApplicationRuntime(config, logger, tools)` | `new ApplicationRuntime({ config, logger, tools, contextFactory?, hooks? })`                                   |
| `bootstrap(argv?)`                              | `bootstrap({ configSchema?, tools?, loggerFactory?, contextFactory?, hooks?, lifecycle?, transport?, argv? })` |
| `loadConfig(argv?)`                             | `loadConfig(schema?, { envPrefix?, defaultConfigFile?, argv?, defaults?, envMapper?, cliMapper? })`            |
| Stdio only                                      | Stdio + Streamable HTTP                                                                                        |
| No capabilities                                 | Resources, Prompts, Logging, Sampling, Roots                                                                   |
| Bundled dependencies                            | Peer dependencies (`zod`, `@modelcontextprotocol/sdk`)                                                         |
