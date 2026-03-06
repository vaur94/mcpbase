# Security Policy

## Scope

`mcpbase` is a stdio-first reference base. Its security model follows deny-by-default rules, and derived servers are expected to keep the same posture.

## Reporting process

- If you find a security issue, prefer private contact over a public issue.
- Include impact, reproduction steps, and the likely blast radius.
- Maintainers validate the issue first, then prepare the fix and disclosure plan.

## Core principles

- risky features are never enabled without explicit permission
- stdout is not used for logging
- config fields are never left undocumented
- new tools require guards and tests

For the detailed model, see `docs/security/security-model.md` and `docs/en/security/security-model.md`.
