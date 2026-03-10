# VS Code Entegrasyonu

English version: [docs/en/integration/vscode.md](../en/integration/vscode.md)

VS Code tarafinda `mcpbase` turevi bir sunucu kullanirken stdio komutunu dogrudan tanimlayin.

```json
{
  "mcp": {
    "servers": {
      "my-derived-server": {
        "command": "node",
        "args": ["/tam/yol/dist/index.js", "--config", "/tam/yol/mcpbase.config.json"]
      }
    }
  }
}
```

## Dikkat edilmesi gerekenler

- stdout protokol icindir; ekstra log uretmeyin
- config dosyasini acikca verin
- gelistirme modunda `npm run build` sonrasinda dist uzerinden calisin

Son guncelleme: 2026-03-11
