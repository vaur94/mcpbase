# Testing Approach

## Layers

- `tests/unit`: Pure helpers and rules
- `tests/integration`: Runtime and tool pipeline
- `tests/protocol`: Validation via MCP client over stdio

## Expectations

- Critical flows are tested directly
- Invalid input and permission errors are tested separately
- Protocol test runs against the actual build output

## Commands

- `npm run test:unit`
- `npm run test:integration`
- `npm run test:protocol`
- `npm run test:coverage`
