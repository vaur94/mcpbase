# Baslangic Rehberi

English version: [docs/en/user-guide/getting-started.md](../en/user-guide/getting-started.md)

## Depoyu calistirmak

Gereksinimler:

- Node.js `>=22.14.0`
- npm `>=10.0.0`

Onerilen kurulum akisi:

```bash
./scripts/install.sh
```

Elle kurulum:

```bash
npm install
npm run build
node dist/index.js --config examples/mcpbase.config.json
```

## Ilk kontrol listesi

- Host aracinizda stdio komutunu tanimlayin.
- `server_info` ile sunucu kimligini dogrulayin.
- `text_transform` ile `tools/call` akisinizin calistigini kontrol edin.

## Sonraki adimlar

- Kendi araclarinizi eklemek icin `src/application/example-tools.ts` dosyasini inceleyin.
- Yapilandirma ayrintilari icin `docs/configuration/configuration-reference.md` sayfasina bakin.
- Gelistirme akisi icin `docs/developer-guide/local-development.md` sayfasina gecin.

Son guncelleme: 2026-03-11
