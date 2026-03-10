# Configuration Reference

Turkce surum: [docs/configuration/configuration-reference.md](../../configuration/configuration-reference.md)

## Precedence Order

1. Defaults in code
2. JSON config file
3. Environment variables
4. CLI arguments

## Fields

### `server.name`

- Short definition: Server identity
- Purpose: Server name shown during MCP initialization

### `server.version`

- Short definition: Version info
- Purpose: Standard version for release and host visibility

### `logging.level`

- Values: `debug`, `info`, `warn`, `error`
- Purpose: Control stderr log verbosity

### `logging.includeTimestamp`

- Type: boolean
- Purpose: Add ISO timestamp to log entries

### `security.features.serverInfoTool`

- Type: boolean
- Purpose: Enable or disable the `server_info` tool

### `security.features.textTransformTool`

- Type: boolean
- Purpose: Enable or disable the `text_transform` tool

### `security.commands.allowed`

- Type: string array
- Purpose: Allowlist for command-executing tools

### `security.paths.allowed`

- Type: string array
- Purpose: Root restrictions for file/path-based tools

## Examples

- File-based: `examples/mcpbase.config.json`
- Environment variable: `MCPBASE_LOG_LEVEL=debug`
- CLI: `node dist/index.js --config examples/mcpbase.config.json --server-name example-mcp-server --log-level debug`

## Note

The built-in CLI parser directly supports `--config`, `--server-name`, `--server-version`, `--log-level`, and `--logging-timestamp`. Fields such as `security.commands.allowed` and `security.paths.allowed` should be supplied through JSON config, environment variables, or a custom `cliMapper`.

Last updated: 2026-03-11
