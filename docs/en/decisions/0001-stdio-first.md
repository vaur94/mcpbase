# ADR 0001 - Stdio-first Design

Turkce surum: [docs/decisions/0001-stdio-first.md](../../decisions/0001-stdio-first.md)

## Decision

This base repository is designed around a stdio-first default. The high-level bootstrap flow uses stdio by default, while additional transport helpers are exposed as lower-level opt-in integration points.

## Rationale

- Scope stays controlled
- Most direct starting point for local host integrations
- The default setup path keeps one predictable transport choice

## Consequences

Even though helpers such as Streamable HTTP are available, the repository-level design decision is to keep stdio as the default operating model.

Last updated: 2026-03-11
