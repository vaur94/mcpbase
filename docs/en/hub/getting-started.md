# Getting Started with Hub-Managed Servers

[🇹🇷 Türkçe](../../hub/baslangic.md)

This guide shows you how to set up a Hub-managed MCP server using `@vaur94/mcpbase`.

## Enabling Introspection

The easiest way to make your server "Hub-ready" is by enabling the built-in introspection tool during bootstrap.

```typescript
import { bootstrap } from '@vaur94/mcpbase';

await bootstrap({
  // Enables the _mcpbase_introspect tool
  introspection: true,
  // Example tools
  tools: myTools,
});
```

The introspection tool provides the Hub with:

- Server name and version.
- `mcpbase` version.
- List of registered tools and their current states.
- Telemetry snapshots (if a telemetry recorder is provided).

## Configuring the Hub Manifest

A Hub manifest describes how to launch and configure your server. You can generate one using your bootstrap options and current config.

```typescript
import { loadConfig, runtimeConfigSchema } from '@vaur94/mcpbase';
import { createHubManifestFromBootstrap } from '@vaur94/mcpbase/hub';

const config = await loadConfig(runtimeConfigSchema);
const manifest = createHubManifestFromBootstrap(
  {
    package: {
      name: 'my-mcp-server',
      version: '1.0.0',
      description: 'A managed MCP server example',
    },
    // launch options default to 'node' and './dist/index.js'
    launch: {
      command: 'node',
      args: ['./dist/index.js'],
      configFile: 'mcpbase.config.json',
      envPrefix: 'MCPBASE_',
    },
  },
  config,
);

process.stderr.write(`${JSON.stringify(manifest, null, 2)}\n`);
```

## Managing Tool States

If you need to dynamically control tool visibility or availability, use the `ToolStateManager`.

```typescript
import { bootstrap } from '@vaur94/mcpbase';
import { createToolStateManager } from '@vaur94/mcpbase/hub';

const stateManager = createToolStateManager(['experimental_tool', 'deprecated_tool']);

// Disable a tool (calls will fail with TOOL_EXECUTION_ERROR)
stateManager.setState('experimental_tool', 'disabled', 'Still in development');

// Hide a tool (disappears from listing, calls fail with TOOL_NOT_FOUND)
stateManager.setState('deprecated_tool', 'hidden');

await bootstrap({
  tools: myTools,
  stateManager,
  introspection: true,
});
```

## Defining Settings Schema

To provide the Hub with metadata for a settings UI, you can define a settings schema.

```typescript
import { createSettingsSchema, settingsFieldsFromBaseConfig } from '@vaur94/mcpbase/hub';

const settingsSchema = createSettingsSchema([
  ...settingsFieldsFromBaseConfig(), // Includes server name/version and logging
  {
    key: 'api.key',
    type: 'string',
    required: true,
    label: 'API Key',
    secret: true,
    group: 'Authentication',
  },
]);

// Include this in your manifest
const manifest = createHubManifestFromBootstrap(
  {
    package: { name: 'my-server', version: '1.0.0' },
    settingsSchema,
  },
  config,
);
```

Last updated: 2026-03-11
