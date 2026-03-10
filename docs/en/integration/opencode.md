# OpenCode Integration

Turkce surum: [docs/integration/opencode.md](../../integration/opencode.md)

On the OpenCode side, stdio-based MCP servers are defined with command and argument pairs.

```json
{
  "mcpServers": {
    "my-derived-server": {
      "command": "node",
      "args": ["/full/path/dist/index.js", "--config", "/full/path/mcpbase.config.json"]
    }
  }
}
```

## Notes

- If using the release package, you can also use the `mcpbase` bin command instead of `node_modules/.bin/mcpbase`
- Logs are readable over stderr; stdout is not mixed

Last updated: 2026-03-11
