# Copilot Coding Instructions for mcpbase

This project follows specific conventions that Copilot should respect when generating code.

## TypeScript Strict Mode

- Always use strict TypeScript. Never use `as any`, `@ts-ignore`, or `@ts-expect-error`
- Enable `strict: true`, `noUncheckedIndexedAccess: true`, and `noImplicitOverride: true`
- Use `useUnknownInCatchVariables: true` — always type catch variables as `unknown` and handle appropriately

## ESM Modules Only

- This project uses ESM (ECMAScript Modules) only
- Import paths must include `.js` extension: `import { something } from './file.js'`
- Use `import type` for type-only imports (required due to `verbatimModuleSyntax: true`)
- Example: `import type { SomeType } from './types.js'`
- Never use CommonJS `require()`

## Turkish-First Convention

- All user-facing text (logs, messages, error descriptions) must be in Turkish
- Test names must be written in Turkish
- Example: `it('arac bulunamazsa hata dondurur', () => { ... })`

## Zod Validation

- Use Zod for all input and output validation
- Define schemas with `z.object()` and use `.parse()` for validation
- Example: `const InputSchema = z.object({ name: z.string() })`

## Testing with Vitest

- Use Vitest for all tests (NOT Jest or Mocha)
- Use `describe`/`it`/`expect` pattern
- Coverage thresholds: 90% lines, 90% functions, 80% branches, 90% statements

## MCP Protocol

- NEVER write to stdout — all output must go through stderr via StderrLogger
- The MCP protocol communicates over stdio; log output would corrupt the protocol

## Code Quality Rules

- Never leave empty catch blocks — always handle or re-throw errors
- Never use placeholder TODO comments
- Never commit code without tests for critical paths
- Use conventional commits format: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`

## Prettier Formatting

- Use single quotes for strings
- Use trailing commas everywhere
- Use 100 character line width

## Dependencies

- `@modelcontextprotocol/sdk` v1 for MCP server
- `zod` for validation
- `vitest` for testing
