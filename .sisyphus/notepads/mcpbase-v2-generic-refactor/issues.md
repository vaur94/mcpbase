# Issues — mcpbase-v2-generic-refactor

## Known Issues / Gotchas

### LSP Errors in /tmp/typescript-sdk
- External SDK files in /tmp have type errors — IGNORE these
- They are not part of our project

### Wave 1 Parallelization Risk
- Tasks 1-7 can run in parallel BUT they modify different files
- Task 6 (barrel export) depends on what Tasks 1-5 export — run AFTER Wave 1 completes
- Task 7 (package.json) is independent

### Zod Schema Composition
- Use `z.object().extend()` or `z.intersection()` for schema merging
- Zod v4 may have different API than v3 — check installed version
- `createRuntimeConfigSchema` must return a ZodObject (not ZodIntersection) for .parse() to work cleanly

### Import Path Convention
- ALL imports must use `.js` extension (NodeNext resolution)
- `import type` for type-only imports (verbatimModuleSyntax)

### Test File Naming
- New test files should follow pattern: `tests/unit/{module-name}.test.ts`
- Protocol tests require build first: `npm run build && npm run test:protocol`
