# ADR 0001 - Stdio-first Design

## Decision

This base repository ships with stdio transport only.

## Rationale

- Scope stays controlled
- Most direct starting point for local host integrations
- Transport diversity creates unnecessary complexity in the base repository

## Consequences

HTTP and remote distribution are left to derived repositories.
