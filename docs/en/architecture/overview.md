# Architecture Overview

## Design Goals

- Thin transport, powerful application layer
- Explicit input/output contracts
- Deterministic tool execution
- Secure defaults
- Easy-to-copy project structure

## Layered Structure

- `src/core`: Domain foundations like errors, results, and execution context
- `src/application`: Manages tool flow with registry and runtime
- `src/transport/mcp`: Provides the official MCP stdio adapter
- `src/infrastructure`: Aggregates system connections like CLI and file reading
- `src/config`: Generates runtime configuration with precedence logic

## Flow Summary

1. `src/index.ts` loads configuration.
2. Logger and application runtime are initialized.
3. MCP transport adapter registers tool definitions with the SDK.
4. `initialize`, `tools/list`, and `tools/call` are served by the MCP SDK over stdio.
5. When a tool call arrives, the runtime validates input, runs guards, executes the handler, and normalizes the result.

## Why This Design

- Protocol details do not leak everywhere
- New MCP projects only grow in `src/application` and `src/security`
- Test strategy is divided by layers
