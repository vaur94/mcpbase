# Decisions — github-integration

## npm Auth Strategy
DECISION: OIDC Trusted Publishing (no NPM_TOKEN)
RATIONALE: Classic tokens deprecated Nov 2025; OIDC is GA since July 2025
IMPACT: Must upgrade @semantic-release/npm to v13+, remove .npmrc step from CI

## Package Name
DECISION: Keep `mcpbase` unscoped
RATIONALE: User confirmed

## Copyright Holder
DECISION: `vaur94` (not `mcpbase`)
RATIONALE: User confirmed

## Engines Node Version
DECISION: >=22.14.0 (up from >=20.11.0)
RATIONALE: OIDC requires Node 22.14.0+

## Branch Protection
DECISION: No PR review requirement (sole maintainer)
RATIONALE: Would block direct pushes to main
