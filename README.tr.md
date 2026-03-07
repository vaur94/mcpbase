# mcpbase

[English](./README.en.md) | [Turkce](./README.tr.md)

`mcpbase`, yeni MCP sunuculari icin stdio-first bir temel depodur. Amaci; tekrar kullanilabilir bir mimari, gercek kalite kapilari ve yayinlanabilir bir repo iskeletini tek yerde toplamak.

## Neden var

- yeni MCP depolarini sifirdan kurma maliyetini azaltir
- runtime, config, loglama ve guvenlik davranislarini tutarli hale getirir
- placeholder yerine gercek birim, entegrasyon ve protokol testleri sunar
- GitHub ve npm yayin akisi icin hazir bir temel verir

## Hizli Baslangic

En hizli kurulum yolu:

```bash
./scripts/install.sh
```

Sonra ornek ayarla sunucuyu baslat:

```bash
node dist/index.js --config examples/mcpbase.config.json
```

## Manuel Kurulum

```bash
npm install
npm run build
node dist/index.js --config examples/mcpbase.config.json
```

## One Cikan Ozellikler

- katmanli TypeScript kaynak kod yapisi
- `zod` ile giris ve cikis dogrulamasi
- deny-by-default guvenlik yardimcilari
- stderr uzerinden yapilandirilmis loglama
- `vitest` ile coverage, entegrasyon ve stdio protokol testi
- GitHub Actions, Dependabot ve semantic-release entegrasyonu

## Proje Haritasi

- `src/core` - hata ve sonuc modelleri
- `src/application` - runtime akisi ve arac kaydi
- `src/transport/mcp` - stdio MCP adaptoru
- `src/config` - varsayilan, dosya, env ve CLI precedence
- `src/security` - izin ve koruma guardlari
- `tests/` - unit, integration, protocol ve fixtures
- `docs/` - Turkce dokuman agaci
- `docs/en/` - Ingilizce dokuman agaci

## Dokumanlar

- Varsayilan English landing page: `README.md`
- English README: `README.en.md`
- English docs index: `docs/README.en.md`
- Turkce mimari dokumanlari: `docs/architecture/`
- Turkce gelistirici rehberi: `docs/developer-guide/`

## Ne zaman kullanilir

Yeni bir MCP sunucusu baslatirken config yukleme, validation, loglama, guvenlik guardlari, test duzeni ve release akisini tekrar kurmak istemiyorsan `mcpbase` dogru baslangic noktasidir.

## Lisans

MIT. Ayrinti icin `LICENSE` dosyasina bak.
