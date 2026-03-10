# Gecis Rehberi: mcpbase v1 -> v2

English version: [docs/en/migration/v1-to-v2.md](../en/migration/v1-to-v2.md)

Bu repo guncel v2 kaynak agacini icerir. Bu sayfayi v2 beklentilerinin kaynak-destekli ozeti olarak kullanin; ancak tam v1 davranisini uretim gecisinden once eski tag veya branch'lerden dogrulayin.

## Dogrulanan v2 beklentileri

- Paket adi: `@vaur94/mcpbase`
- Runtime giris noktasi: `bootstrap(options?)`
- Config yukleme: katmanli precedence ve schema-genisletme noktalariyla `loadConfig(...)`
- Varsayilan transport: stdio
- Ek transport yardimcisi: Streamable HTTP
- Paket subpath'leri: `./examples`, `./security` ve `./hub`
- Opsiyonel telemetri: `createInMemoryTelemetry`
- Capability yardimcilari: resources, prompts, logging, sampling ve roots

## Gecis kontrol listesi

1. Eski paket referanslarini `@vaur94/mcpbase` ile degistirin.
2. Config seklinizi export edilen runtime config yardimcilariyla yeniden karsilastirin.
3. Runtime kurulumunu `src/index.ts` icinde belgelenen v2 options tabanli yuzeye tasiyin.
4. `name`, `title`, `description` ve Zod schema gibi guncel beklentiler icin tool tanimlarini gozden gecirin.
5. Protokol-guvenli stderr kullanimini korumak icin logging davranisini yeniden test edin.
6. Security metadata veya managed-server yardimcilari kullaniyorsaniz port islemi once `./security` ve `./hub` belgelerini tekrar inceleyin.

## Eski koddan dogrulanmasi gereken kisimlar

- Tam v1 constructor imzalari
- Tam v1 donus payload sekilleri
- V1'e ozgu config anahtarlari veya migration script'leri

## Ilgili belgeler

- API referansi: [`docs/api/v2-reference.md`](../api/v2-reference.md)
- Mimari genel bakis: [`docs/architecture/overview.md`](../architecture/overview.md)

Son guncelleme: 2026-03-11
