# Learnings — mcpbase-v2-generic-refactor

## Project Conventions
- TypeScript strict mode: `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`
- `verbatimModuleSyntax: true` — type-only imports MUST use `import type`
- `moduleResolution: NodeNext` — import paths MUST include `.js` extension
- ESM only (no CJS), target: ES2022
- Test names in Turkish (Vitest)
- User-facing text in Turkish
- No `as any`, `@ts-ignore`, empty catch blocks, TODO comments
- Prettier: singleQuote, trailingComma: "all", printWidth: 100

## Build System
- tsup for building (ESM only)
- Entry: `src/index.ts` (currently single entry)
- Output: `dist/`
- Build command: `npm run build`
- CI check: `npm run ci:check` (format + lint + typecheck + test:coverage + build)

## Current State (v1)
- Version: 1.0.1
- Single entry point: `src/index.ts`
- No subpath exports yet
- zod in dependencies (not peer deps)
- Security features hardcoded in base config
- ApplicationRuntime uses positional constructor
- bootstrap() is a black box

## Key Architecture Notes
- `@modelcontextprotocol/sdk` v1 monolithic package (v2 split packages not on npm yet)
- `skipLibCheck: true` — zod v4 and SDK type incompatibility
- Config file default: `mcpbase.config.json`
- Env prefix: `MCPBASE_` (to be made configurable)
- Commit format: conventional commits (semantic-release)

## Task 1 Learnings

- Zod v4 removed `.deepPartial()` — need manual recursive `deepPartialShape()` helper
- Zod v4 `ZodRawShape` is `Readonly<...>` — use `Record<string, z.ZodTypeAny>` for mutable shapes
- `BaseRuntimeConfig<TExtras = Record<string, never>>` creates impossible intersection — use `unknown` as default instead
- Dynamic schema via `z.object(record)` loses `z.infer` type info — backward-compat `partialRuntimeConfigSchema` must be manually typed
- `z.ZodObject` exists in Zod v4 and `instanceof` works correctly
- `.extend()` preserves types properly via generic inference
- `as unknown as Record<string, z.ZodTypeAny>` needed for the `.shape` cast (not `as any`)
- `.partial()` and `.optional()` work identically in Zod v4 as v3

## Task 14 Learnings

- MCP logging bridge can stay as a thin capability wrapper: keep its own RFC 5424 severity table and forward with `server.server.sendLoggingMessage(...)`
- `McpServer` logging send API is async, but a bridge with `void` logger surface can safely fire-and-forget via `void server.server.sendLoggingMessage(...)`

## Task 16 Learnings (Roots Handler)

- `server.server.listRoots()` returns `{ roots: { uri: string, name?: string }[] }` 
- Use `RootsListChangedNotificationSchema` from `@modelcontextprotocol/sdk/types.js` for notification handler
- `setNotificationHandler(schema, callback)` registers notification handlers
- Single notification handler can dispatch to multiple registered callbacks (design pattern)
- Roots are lightweight — no caching or complex state needed
- Logging bridge tests should mock `sendLoggingMessage()` with a resolved promise, because the SDK method is async and rejection handling is part of the bridge contract
- MCP prompt registration callbacks in the SDK must accept the extra handler context parameter even when unused, otherwise `server.prompt(...)` overload resolution fails under `tsc`

## Task 13: Prompt Registration Abstraction

- MCP SDK `server.prompt()` has 4 overloads: (name, cb), (name, desc, cb), (name, argsSchema, cb), (name, desc, argsSchema, cb)
- SDK uses `ZodRawShapeCompat = Record<string, AnySchema>` which is different from zod v4's `z.ZodRawShape`
- SDK's `ShapeOutput<Shape>` type is NOT the same as `z.infer<z.ZodObject<Shape>>` — they're structurally equivalent but TS can't prove it
- Solution: make `registerPromptTemplates` non-generic (matching resources.ts pattern), let SDK infer types at call site
- `PromptCallback` type is exported from `@modelcontextprotocol/sdk/server/mcp.js` — useful for typing static prompt callbacks
- For template callbacks, inline the callback in the `server.prompt()` call so SDK can infer the `Args` generic from `argsSchema`
- `PromptTemplateDefinition` interface keeps generic `TArgs` for type safety at definition sites, but register function uses default `z.ZodRawShape`

## Task 15 Learnings (Sampling Client Helper)

- MCP sampling allows server to request LLM completions from the client
- `server.server.createMessage(params)` is the SDK method for sampling
- Use `CreateMessageResult` type from `@modelcontextprotocol/sdk/types.js` for response typing
- The result's `content` is a discriminated union (text/image/audio) — check `content.type === 'text'` before accessing `.text`
- `maxTokens` is required by the SDK — provide default (e.g., 1024) if not specified
- `SamplingRequest` interface uses readonly arrays to match SDK conventions
- Lightweight helper pattern: wrap SDK call, map request/response types, no retry logic

## Task 19 Learnings (Subpath Exports)

- `src/examples/index.ts` re-exports `createExampleTools` from `../application/example-tools.js`
- `src/security/index.ts` re-exports guards from `../security/guards.js` + exports `PERMISSION_DENIED` const
- Build produces `dist/examples/index.js` and `dist/security/index.js` as expected
- Tests pass (5 pre-existing streamable-http test failures unrelated to this task)

## Task 17 Learnings (Streamable HTTP Transport)

- `StreamableHTTPServerTransport` from `@modelcontextprotocol/sdk/server/streamableHttp.js` wraps `WebStandardStreamableHTTPServerTransport` with Node.js HTTP compatibility
- Constructor options: `{ sessionIdGenerator?: () => string }` — undefined for stateless, function for stateful
- `handleRequest(req: IncomingMessage, res: ServerResponse, parsedBody?: unknown)` — 3 params, parsedBody is optional for pre-parsed body from body-parser middleware
- The transport uses `@hono/node-server` internally to convert Node.js HTTP to Web Standard APIs — this means unit tests with fake `{}` req/res objects fail on `outgoing.writeHead`
- Solution: mock the entire SDK module with `vi.mock()` to avoid hitting real HTTP internals in unit tests
- The adapter is intentionally thin — no built-in HTTP server, consumer provides their own req/res from Express/Fastify/etc.

## Task 21 Learnings (Generic Type Tests)

- A dedicated `tests/unit/generic-types.test.ts` file is a good place to verify compile-time generic contracts with real object assignments and small runtime assertions, instead of relying only on conditional types.
- Importing generic APIs from `src/index.ts` in type-level tests verifies both the generic signatures and the public barrel exports in one place.
- `bootstrap<TConfig, TContext>` is easiest to exercise with explicit generics inside `tests/unit/bootstrap.test.ts`, because that file already mocks transport and config loading side effects.
- Replacing loose casts in tests (for example `ToolExecutionContext` fixtures) exposes generic regressions earlier and keeps `tsc --noEmit` meaningful for refactor validation.
- `ToolRegistry<TContext>` coverage is stronger when the test registers a truly custom `ToolDefinition<..., TContext>` instead of relying only on default example tools.

## Task 18 Learnings (Transport Factory)

- `src/transport/transport-factory.ts` should stay as a pure routing layer: discriminated union in, existing transport starter out
- Unit tests can mock `../../src/transport/mcp/server.js` and `../../src/transport/mcp/streamable-http.js` directly, which keeps the factory test focused on delegation instead of MCP SDK internals
- Exporting the factory through `src/index.ts` is enough to make the new API available without changing bootstrap behavior yet

## Task 24 Learnings (API Reference Documentation)

- Package name is `@vaur94/mcpbase` version `2.0.0`
- Two subpath exports: `@vaur94/mcpbase/examples` and `@vaur94/mcpbase/security`
- `PERMISSION_DENIED` error code is in security subpath, not main export
- All generic parameters have defaults: `BaseRuntimeConfig = BaseRuntimeConfig`, `ToolExecutionContext = BaseToolExecutionContext<RuntimeConfig>`
- Core types: `BaseRuntimeConfig`, `RuntimeConfig`, `AppError`, `ToolDefinition`, `ToolAnnotations`, `ExecutionHooks`
- Config functions: `createRuntimeConfigSchema`, `createPartialRuntimeConfigSchema`, `loadConfig`
- Default configs: `baseDefaultConfig` (without security), `defaultConfig` (full with security)
- Bootstrap: `bootstrap()` function takes `BootstrapOptions` with generic config and context
- Capabilities: Resources, Prompts, Logging (McpLoggingBridge), Sampling (SamplingHelper), Roots (RootsHandler)
- Transport: `startStdioServer`, `startStreamableHttpServer`, `createMcpServer`
- Utilities: `deepMerge`, `createRequestId`, `createTextContent`, `sanitizeMessage`, `ensureAppError`, `StderrLogger`
- Error codes: `CONFIG_ERROR`, `VALIDATION_ERROR`, `TOOL_NOT_FOUND`, `TOOL_EXECUTION_ERROR`, `PERMISSION_DENIED`
- Main entry point exports everything except security guards (via subpath)

## Task 23 Learnings (Migration Guide v1 to v2)

- Migration guide created at `docs/en/migration/v1-to-v2.md`
- All 10 breaking changes documented with before/after code examples:
  1. Package name: `fork-template` → `@vaur94/mcpbase`
  2. Peer dependencies: zod and @modelcontextprotocol/sdk now must be installed separately
  3. RuntimeConfig → BaseRuntimeConfig<TExtras>: security removed from base
  4. AppError: PERMISSION_DENIED moved to security subpath
  5. ApplicationRuntime constructor: positional args → options object
  6. bootstrap(): now accepts BootstrapOptions object
  7. loadConfig(): now generic, accepts schema parameter
  8. New capabilities: Resources, Prompts, Logging, Sampling, Roots
  9. New transport: Streamable HTTP
  10. Subpath exports: @vaur94/mcpbase/examples and @vaur94/mcpbase/security
- Quick Start section shows minimal v2 usage pattern
- Summary table maps v1 APIs to v2 equivalents
