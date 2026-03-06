# OpenCode Entegrasyonu

OpenCode tarafinda stdio tabanli MCP sunucular komut ve arguman ciftleriyle tanimlanir.

```json
{
  "mcpServers": {
    "my-derived-server": {
      "command": "node",
      "args": ["/tam/yol/dist/index.js", "--config", "/tam/yol/mcpbase.config.json"]
    }
  }
}
```

## Notlar

- release paketini kullaniyorsaniz `node_modules/.bin/mcpbase` yerine `mcpbase` bin komutunu da kullanabilirsiniz
- loglar stderr uzerinden okunabilir; stdout karistirilmaz
