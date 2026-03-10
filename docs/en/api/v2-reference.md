# v2 API Overview

Turkce surum: [docs/api/v2-reference.md](../../api/v2-reference.md)

This page is a curated, source-backed overview of the verified public surface exported from `src/index.ts` and the package subpath exports declared in `package.json`.

## Package entry points

- `@vaur94/mcpbase`
- `@vaur94/mcpbase/examples`
- `@vaur94/mcpbase/security`
- `@vaur94/mcpbase/hub`

## Main runtime exports

### `bootstrap(options?)`

Starts the stdio MCP server using loaded config, a logger, a runtime instance, and either supplied tools or built-in example tools.

Verified option groups:

- `configSchema`
- `tools`
- `loggerFactory`
- `contextFactory`
- `hooks`
- `lifecycle`
- `telemetry`
- `stateManager`
- `introspection`
- `transport` (`'stdio'`)
- `argv`

### `ApplicationRuntime`

Core runtime class from `src/application/runtime.ts`.

### `ToolRegistry`

In-memory tool registration and lookup surface from `src/application/tool-registry.ts`.

### `loadConfig`

Config loader from `src/config/load-config.ts`. The repository documents layered precedence of defaults -> config file -> environment -> CLI.

## Configuration exports

- `baseRuntimeConfigSchema`
- `baseServerSchema`
- `baseLoggingSchema`
- `baseSecuritySchema`
- `runtimeConfigSchema`
- `createRuntimeConfigSchema`
- `createPartialRuntimeConfigSchema`
- `createSecurityConfigSchema`
- `createSecuredRuntimeConfigSchema`
- `baseDefaultConfig`
- `baseSecurityDefaults`
- `defaultConfig`
- `envName`
- `envBoolean`
- `envList`
- `logLevelSchema`

## Result, logging, and utility exports

- `AppError`
- `ensureAppError`
- `createTextContent`
- `isErrorResult`
- `StderrLogger`
- `deepMerge`
- `createRequestId`
- `sanitizeMessage`
- `createInMemoryTelemetry`
- result types including `TextContentBlock`, `SuccessResult`, and `ErrorResult`
- telemetry types including `TelemetryEvent`, `TelemetryRecorder`, `SerializableTelemetrySnapshot`, `TelemetrySnapshot`, `ToolMetricsSnapshot`, and `InMemoryTelemetryOptions`

## Security exports

- `assertAllowedCommand`
- `assertAllowedPath`
- `assertFeatureEnabled`
- `createSecurityEnforcementHook`
- security types including `SecureToolDefinition` and `ToolSecurityDefinition`

## Capability exports

- Resources: `registerResources`, `registerResourceTemplates`
- Prompts: `registerPrompts`, `registerPromptTemplates`
- Logging bridge: `createMcpLoggingBridge`
- Sampling: `createSamplingHelper`
- Roots: `createRootsHandler`
- related capability types such as `ResourceDefinition`, `PromptDefinition`, `McpLogLevel`, `SamplingRequest`, and `Root`

## Transport exports

- `createManagedMcpServer`
- `createMcpServer`
- `startStdioServer`
- `startStreamableHttpServer`
- `createTransport`
- related transport types including `ManagedMcpServer`, `McpServerOptions`, `RegisteredToolHandle`, `TransportConfig`, `TransportResult`, and `TransportType`

## Hub and subpath exports

The root entry point re-exports hub types such as `ToolStateManager` and `IntrospectionOptions`, while the `@vaur94/mcpbase/hub` subpath contains managed-server utilities, manifest helpers, settings helpers, and introspection tooling.

The `@vaur94/mcpbase/examples` subpath exposes example tools for reference and testing. The `@vaur94/mcpbase/security` subpath exposes guard helpers and security-oriented types.

## Source of truth

- Public root exports: `src/index.ts`
- Package entry points: `package.json`
- Hub exports: `src/hub/index.ts`
- Examples exports: `src/examples/index.ts`
- Security exports: `src/security/index.ts`

Last updated: 2026-03-11
