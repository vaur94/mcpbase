# Security Model

Turkce surum: [docs/security/security-model.md](../../security/security-model.md)

## Deny-by-default approach

`mcpbase` aims to keep risky behavior unavailable without explicit permission. The security helpers therefore combine feature flags, command allowlists, and path allowlists.

## Direct helpers

- `assertFeatureEnabled`
- `assertAllowedCommand`
- `assertAllowedPath`
- `createSecurityEnforcementHook`

## Safe development rules

- Tools that touch the filesystem or execute commands should be guarded.
- New config fields should not land without docs and tests.
- MCP logging should stay on stderr.
- Runtime and security changes should review both unit and integration coverage.

## Related sources

- `src/security/guards.ts`
- `src/security/tool-security.ts`
- `SECURITY.md`

Last updated: 2026-03-11
