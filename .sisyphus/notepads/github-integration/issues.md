# Issues — github-integration

## Ghost Tag v1.0.1
STATUS: Known
DETAIL: v1.0.1 tag exists remotely but package was never published to npm
FIX: `fix:` commit after v1.0.1 triggers v1.0.2 release

## Trusted Publisher Prerequisite
STATUS: User action required BEFORE Task 8 push
DETAIL: User must configure Trusted Publisher at npmjs.com/package/mcpbase/access
WITHOUT THIS: OIDC auth fails, npm publish fails

## Peer Dep Risk
STATUS: Must verify during Task 2
DETAIL: semantic-release@^24.2.9 ↔ @semantic-release/npm@^13.1.5 compatibility
FIX: Run `npm install` and check for ERESOLVE/peer warnings

## Final Audit Findings (2026-03-07)
STATUS: Non-compliant
DETAIL: Deliverables are mostly present, but `.prettierignore` was modified even though the plan guardrail says it must not be changed; diff from `aabcd11..HEAD` adds `.sisyphus/`.
DETAIL: Commit history since `v1.0.1` contains `fix(ci): ...` and an extra follow-up commit `fix(deps): force @semantic-release/npm v13 via overrides to enable OIDC`.
