# Hub API Reference

[🇹🇷 Türkçe](../../hub/api-referans.md)

Detailed API reference for the `@vaur94/mcpbase/hub` subpath.

## Manifest Generation

### HubManifest

The Zod-validated structure representing a complete Hub-compatible server manifest.

### createHubManifest(options: HubManifestOptions)

Creates and validates a manifest object.

### createHubManifestFromBootstrap(options, config)

A helper that derives a manifest from your existing bootstrap options and loaded configuration.

## Tool State Management

### ToolStateManager

An interface for managing tool visibility and execution state.

```typescript
interface ToolStateManager {
  getState(toolName: string): ToolState;
  setState(toolName: string, state: ToolState, reason?: string): void;
  listStates(): readonly ToolStateEntry[];
  isCallable(toolName: string): boolean;
  isVisible(toolName: string): boolean;
  onChange(listener: (toolName: string, state: ToolState) => void): void;
}
```

### createToolStateManager(toolNames: string[])

Creates a standard in-memory state manager. Tools are initialized to `'enabled'` by default.

### ToolState

Possible states: `'enabled'`, `'disabled'`, or `'hidden'`.

## Settings Schema

### createSettingsSchema(fields: SettingsField[])

Creates a grouped and versioned settings schema for Hub UI generation.

### settingsFieldsFromBaseConfig()

Returns the default fields for `server.name`, `server.version`, `logging.level`, and `logging.includeTimestamp`.

### SettingsField

Metadata for a single configuration field.

- **type**: `'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'path'`
- **secret**: If true, the Hub should mask the value in UI.
- **group**: Used to categorize fields in the Hub UI.

## Introspection

### createIntrospectionTool(options, context)

Creates the `_mcpbase_introspect` tool. Usually invoked automatically via `bootstrap({ introspection: true })`.

### IntrospectionOptions

- **toolName**: Optional custom name (default: `_mcpbase_introspect`).
- **includeTelemetry**: Whether to include metrics snapshots in the output (default: `true`).

Last updated: 2026-03-11
