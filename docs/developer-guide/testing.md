# Test Yaklasimi

English version: [docs/en/developer-guide/testing.md](../en/developer-guide/testing.md)

## Katmanlar

- `tests/unit`: saf yardimci ve kurallar
- `tests/integration`: runtime ve tool pipeline
- `tests/protocol`: stdio uzerinden MCP istemcisi ile dogrulama

## Beklenti

- kritik akislar dogrudan test edilir
- gecersiz girdi ve izin hatalari ayri testlenir
- protokol testi gercek build ciktisi ile calisir
- coverage esikleri `vitest.config.ts` icinde: lines/functions/statements %90, branches %80

## Komutlar

- `npm run test:unit`
- `npm run test:integration`
- `npm run test:protocol`
- `npm run test:coverage`
- `npm run ci:check`

Son guncelleme: 2026-03-11
