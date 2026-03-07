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
