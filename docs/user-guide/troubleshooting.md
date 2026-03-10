# Sorun Giderme

English version: [docs/en/user-guide/troubleshooting.md](../en/user-guide/troubleshooting.md)

## Sunucu acilmiyor

- `npm run build` basarili mi kontrol edin
- Node.js surumunuzun `>=22.14.0`, npm surumunuzun `>=10.0.0` oldugunu kontrol edin

## Tool list bos geliyor

- ilgili feature flag'ler kapatilmis olabilir
- host stdio komutunda dogru `dist/index.js` yolunu kullandiginizi dogrulayin

## Loglar bozuk gorunuyor

- stdout yerine stderr izlediginizden emin olun
- kendi turetilmis projenizde `console.log` kullanmayin

Son guncelleme: 2026-03-11
