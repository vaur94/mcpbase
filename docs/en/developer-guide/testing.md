# Testing Approach

Turkce surum: [docs/developer-guide/testing.md](../../developer-guide/testing.md)

## Layers

- `tests/unit`: Pure helpers and rules
- `tests/integration`: Runtime and tool pipeline
- `tests/protocol`: Validation via MCP client over stdio

## Expectations

- Critical flows are tested directly
- Invalid input and permission errors are tested separately
- Protocol test runs against the actual build output
- Coverage thresholds in `vitest.config.ts` are 90% for lines/functions/statements and 80% for branches

## Commands

- `npm run test:unit`
- `npm run test:integration`
- `npm run test:protocol`
- `npm run test:coverage`
- `npm run ci:check`

Last updated: 2026-03-11
