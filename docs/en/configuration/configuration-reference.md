# Configuration Reference

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
- Purpose: Allowlist for future command-based tools

### `security.paths.allowed`

- Type: string array
- Purpose: Root restrictions for future file/path-based tools

## Examples

- File-based: `examples/mcpbase.config.json`
- Environment variable: `MCPBASE_LOG_LEVEL=debug`
- CLI: `node dist/index.js --log-level debug --allow-command=git`
