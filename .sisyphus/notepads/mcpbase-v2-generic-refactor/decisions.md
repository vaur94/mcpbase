# Decisions — mcpbase-v2-generic-refactor

## Architectural Decisions

### Generic Type Defaults
- ALL generic parameters MUST have default types (no breaking change for simple case)
- `BaseRuntimeConfig<TExtras = Record<string, never>>`
- `AppError<TCode extends string = BaseAppErrorCode>`
- `BaseToolExecutionContext<TConfig extends BaseRuntimeConfig = BaseRuntimeConfig>`
- `ToolDefinition<TInput, TOutput, TContext extends BaseToolExecutionContext = BaseToolExecutionContext>`
- `ToolRegistry<TContext extends BaseToolExecutionContext = BaseToolExecutionContext>`

### Security Separation
- `PERMISSION_DENIED` error code → security subpath only (not in base)
- `assertFeatureEnabled/AllowedCommand/AllowedPath` → `src/security/index.ts` subpath
- `ToolSecurityDefinition` → security subpath
- Security config schema → security subpath

### Config Schema
- `security` section removed from base schema
- `baseRuntimeConfigSchema` = only `server` + `logging`
- `createRuntimeConfigSchema(extensionSchema)` factory for merging
- `security.features` → `Record<string, boolean>` (not typed)

### Hook Behavior (Metis guardrail)
- `beforeExecute` throw → tool NOT executed, error returned to caller
- `afterExecute` throw → result still returned, hook error logged only
- `onError` throw → original error returned, hook error logged only
- Multiple hooks: array support, serial async execution

### Transport
- Stdio: existing, preserved
- Streamable HTTP: new adapter (NOT built-in server)
- SSE: deprecated, NOT included
- Default transport: stdio

### Subpath Exports (max 3)
- `.` → main barrel
- `./examples` → example tools
- `./security` → security guards

### zod as Peer Dependency
- `"zod": ">=3.23.0 || >=4.0.0"` in peerDependencies
- `@modelcontextprotocol/sdk` also as peer dep

## Task 1 Decisions

- `BaseRuntimeConfig<TExtras = unknown>` chosen over `Record<string, never>` — `unknown` is the identity for intersection types (`T & unknown = T`)
- `partialRuntimeConfigSchema` kept manually typed (not via factory) for backward compat with cli-args.ts type inference
- `securityExtensionSchema` kept in runtime-config.ts as private const — will move to security subpath in Task 19
- `createPartialRuntimeConfigSchema` factory uses `deepPartialShape()` recursive helper for runtime correctness (type inference is loose)
- `baseDefaultConfig` added alongside existing `defaultConfig` in default-config.ts — uses spread to avoid duplication
- `createBaseFixtureConfig` added to fixtures alongside `createFixtureConfig` for generic testing pattern
