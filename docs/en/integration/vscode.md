# VS Code Integration

Turkce surum: [docs/integration/vscode.md](../../integration/vscode.md)

In VS Code, define the stdio command directly when using an `mcpbase` derived server.

```json
{
  "mcp": {
    "servers": {
      "my-derived-server": {
        "command": "node",
        "args": ["/full/path/dist/index.js", "--config", "/full/path/mcpbase.config.json"]
      }
    }
  }
}
```

## Considerations

- stdout is for the protocol; do not produce extra logs
- Provide the config file explicitly
- In development mode, run via dist after `npm run build`

Last updated: 2026-03-11
