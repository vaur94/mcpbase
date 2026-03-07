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
