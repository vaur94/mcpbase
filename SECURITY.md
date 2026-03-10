# Security Policy

English | [Turkce](./SECURITY.tr.md)

## Scope

`mcpbase` is a stdio-first MCP base library. The codebase exposes security helpers, deny-by-default guards, and examples for derived servers, but each derived server remains responsible for its own threat model and deployment posture.

## Reporting a vulnerability

- Do not open a public GitHub issue for undisclosed vulnerabilities.
- Prefer a private maintainer contact path if you already have one.
- If no private contact is known, maintainer confirmation is required for the preferred reporting channel.
- Include impact, affected version, reproduction steps, and any relevant guard or config assumptions.

## Repository security model

- Risky behavior should be protected with feature flags, command allowlists, or path allowlists.
- MCP logging must stay on stderr so protocol traffic is not corrupted.
- New config fields should be documented together with code changes.
- New tools with filesystem or command execution behavior should ship with guards and tests.

## Supported versions

Formal version support windows are not documented in the repository. Unless maintainers state otherwise, treat the latest published release as the only confirmed security maintenance target.

## Related docs

- Security model: [`docs/en/security/security-model.md`](./docs/en/security/security-model.md)
- Support paths: [`SUPPORT.md`](./SUPPORT.md)

Last updated: 2026-03-11
