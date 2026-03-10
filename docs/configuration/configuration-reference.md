# Konfigurasyon Referansi

English version: [docs/en/configuration/configuration-reference.md](../en/configuration/configuration-reference.md)

## Oncelik sirasi

1. kod icindeki varsayilanlar
2. JSON config dosyasi
3. ortam degiskenleri
4. CLI argumanlari

## Alanlar

### `server.name`

- Kisa tanim: sunucu kimligi
- Amac: MCP initialize sirasinda gorunen sunucu adi

### `server.version`

- Kisa tanim: surum bilgisi
- Amac: release ve host gorunurlugu icin standart surum

### `logging.level`

- Degerler: `debug`, `info`, `warn`, `error`
- Amac: stderr log yogunlugunu kontrol etmek

### `logging.includeTimestamp`

- Tur: boolean
- Amac: log kaydina ISO zaman damgasi eklemek

### `security.features.serverInfoTool`

- Tur: boolean
- Amac: `server_info` aracini acip kapatmak

### `security.features.textTransformTool`

- Tur: boolean
- Amac: `text_transform` aracini acip kapatmak

### `security.commands.allowed`

- Tur: string dizisi
- Amac: komut calistiran araclar icin allowlist

### `security.paths.allowed`

- Tur: string dizisi
- Amac: dosya/yol tabanli araclar icin kok kisitlari

## Ornekler

- Dosya tabanli: `examples/mcpbase.config.json`
- Ortam degiskeni: `MCPBASE_LOG_LEVEL=debug`
- CLI: `node dist/index.js --config examples/mcpbase.config.json --server-name example-mcp-server --log-level debug`

## Not

Yerlesik CLI parser, `--config`, `--server-name`, `--server-version`, `--log-level` ve `--logging-timestamp` bayraklarini dogrudan destekler. `security.commands.allowed` ve `security.paths.allowed` gibi alanlar JSON config, ortam degiskenleri veya ozel `cliMapper` ile tasinmalidir.

Son guncelleme: 2026-03-11
