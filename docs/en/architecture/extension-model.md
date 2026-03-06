# Extension Model

When deriving a new MCP project from `mcpbase`, follow this path:

1. Change the identity in `package.json`, README, and example config files.
2. Add your domain tool definitions in place of `src/application/example-tools.ts`.
3. Add new guard helpers next to `src/security/guards.ts` if there is risky behavior.
4. Update `src/contracts/runtime-config.ts` and `src/config/load-config.ts` together for new config needs.
5. Distribute tests across `tests/unit`, `tests/integration`, and `tests/protocol` layers.

## What to Preserve

- Layer boundaries
- Quality gate scripts
- Release and Dependabot structure
- Deny-by-default approach
- Documentation directory structure

## What to Change

- Package name
- README title and domain descriptions
- Example tools
- Security feature flag names
- Host examples in integration documentation
