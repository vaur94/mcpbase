# v2 API Genel Bakis

English version: [docs/en/api/v2-reference.md](../en/api/v2-reference.md)

Bu sayfa, `src/index.ts` icinden export edilen dogrulanmis public yuzeyin ve `package.json` icindeki paket subpath export'larinin kaynak-destekli, secilmis bir genel bakisini sunar.

## Paket giris noktalari

- `@vaur94/mcpbase`
- `@vaur94/mcpbase/examples`
- `@vaur94/mcpbase/security`
- `@vaur94/mcpbase/hub`

## Ana runtime export'lari

### `bootstrap(options?)`

Yuklenmis config, logger, runtime ornegi ve verilen ya da dahili ornek araclarla stdio MCP sunucusunu baslatir.

Dogrulanan opsiyon gruplari:

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

`src/application/runtime.ts` icindeki cekirdek runtime sinifi.

### `ToolRegistry`

`src/application/tool-registry.ts` icindeki bellek ici arac kayit ve lookup yuzeyi.

### `loadConfig`

`src/config/load-config.ts` icindeki config yukleyicisi. Repo belgeleri precedence sirasini defaults -> config file -> environment -> CLI olarak tanimlar.

## Config export'lari

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

## Sonuc, logging ve yardimci export'lar

- `AppError`
- `ensureAppError`
- `createTextContent`
- `isErrorResult`
- `StderrLogger`
- `deepMerge`
- `createRequestId`
- `sanitizeMessage`
- `createInMemoryTelemetry`
- `TextContentBlock`, `SuccessResult` ve `ErrorResult` dahil sonuc tipleri
- `TelemetryEvent`, `TelemetryRecorder`, `SerializableTelemetrySnapshot`, `TelemetrySnapshot`, `ToolMetricsSnapshot` ve `InMemoryTelemetryOptions` dahil telemetri tipleri

## Security export'lari

- `assertAllowedCommand`
- `assertAllowedPath`
- `assertFeatureEnabled`
- `createSecurityEnforcementHook`
- `SecureToolDefinition` ve `ToolSecurityDefinition` dahil security tipleri

## Capability export'lari

- Resources: `registerResources`, `registerResourceTemplates`
- Prompts: `registerPrompts`, `registerPromptTemplates`
- Logging bridge: `createMcpLoggingBridge`
- Sampling: `createSamplingHelper`
- Roots: `createRootsHandler`
- `ResourceDefinition`, `PromptDefinition`, `McpLogLevel`, `SamplingRequest` ve `Root` gibi ilgili capability tipleri

## Transport export'lari

- `createManagedMcpServer`
- `createMcpServer`
- `startStdioServer`
- `startStreamableHttpServer`
- `createTransport`
- `ManagedMcpServer`, `McpServerOptions`, `RegisteredToolHandle`, `TransportConfig`, `TransportResult` ve `TransportType` dahil ilgili transport tipleri

## Hub ve subpath export'lari

Kok entry point, `ToolStateManager` ve `IntrospectionOptions` gibi hub tiplerini de export eder. `@vaur94/mcpbase/hub` subpath'i managed-server yardimcilari, manifest olusturma, settings yardimcilari ve introspection araclarini tasir.

`@vaur94/mcpbase/examples` subpath'i referans ve test amacli ornek araclari sunar. `@vaur94/mcpbase/security` subpath'i ise guard yardimcilari ve guvenlik odakli tipleri export eder.

## Kaynak referanslari

- Public root export'lari: `src/index.ts`
- Paket giris noktalari: `package.json`
- Hub export'lari: `src/hub/index.ts`
- Examples export'lari: `src/examples/index.ts`
- Security export'lari: `src/security/index.ts`

Son guncelleme: 2026-03-11
