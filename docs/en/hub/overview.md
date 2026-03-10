# Hub-Managed Servers Overview

[🇹🇷 Türkçe](../../hub/genel-bakis.md)

This document provides an overview of Hub-managed server support in `@vaur94/mcpbase`. Hub-managed servers are designed to be easily discovered, configured, and monitored by management tools (Hubs) while maintaining full compatibility with the Model Context Protocol (MCP).

## What is a Hub-Managed Server?

A Hub-managed server is an MCP server that exposes additional metadata and management capabilities. While a standard MCP server focuses on providing tools, resources, and prompts, a managed server provides:

1.  **Self-Introspection**: The ability to describe its own structure, capabilities, and health via a standard tool.
2.  **Manifest Generation**: A machine-readable description of how to launch and configure the server.
3.  **Dynamic Tool Management**: Support for enabling, disabling, or hiding tools at runtime without restarting the process.
4.  **Standardized Settings**: A clear schema for configuration fields that a Hub can use to generate a settings UI.

## Architectural Role

The `mcpbase` Hub layer acts as a bridge between the core `ApplicationRuntime` and management platforms. It uses the `ManagedMcpServer` wrapper to handle the complexity of SDK-level tool registration and state synchronization.

### Key Components

- **Introspection Tool**: A built-in tool (`_mcpbase_introspect` by default) that returns the current server state, including telemetry snapshots.
- **Tool State Manager**: Manages the lifecycle and visibility of tools, allowing for "soft" disabling or hiding of specific features.
- **Manifest Factory**: Generates a standardized hub manifest that includes package info, capabilities, and launch arguments.
- **Settings Registry**: Defines how configuration fields map to Hub-managed settings.

## Benefits

- **Better Observability**: Hubs can display real-time metrics (latency, error rates) captured by the built-in telemetry.
- **Simplified Configuration**: Automated settings UI generation means users don't have to edit JSON files manually.
- **Granular Control**: Hide experimental tools or disable problematic ones without process restarts.
- **Faster Integration**: Standard manifests make it easy for Hubs to "import" your server with zero manual setup.

Last updated: 2026-03-11
