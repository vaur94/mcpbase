# Test Yaklasimi

## Katmanlar

- `tests/unit`: saf yardimci ve kurallar
- `tests/integration`: runtime ve tool pipeline
- `tests/protocol`: stdio uzerinden MCP istemcisi ile dogrulama

## Beklenti

- kritik akislar dogrudan test edilir
- gecersiz girdi ve izin hatalari ayri testlenir
- protokol testi gercek build ciktisi ile calisir

## Komutlar

- `npm run test:unit`
- `npm run test:integration`
- `npm run test:protocol`
- `npm run test:coverage`
