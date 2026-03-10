# Mimari Genel Bakis

English version: [docs/en/architecture/overview.md](../en/architecture/overview.md)

## Tasarim hedefleri

- ince transport, guclu uygulama kati
- acik giris/cikis sozlesmeleri
- deterministik arac yurutme
- guvenli varsayilanlar
- kolay kopyalanabilir proje yapisi

## Katmanli yapi

- `src/core`: hata, sonuc ve execution context gibi alan temelleri
- `src/application`: registry ve runtime ile arac akisini yonetir
- `src/transport`: stdio ve Streamable HTTP tasimalarini barindirir
- `src/infrastructure`: CLI ve dosya okuma gibi sistem baglantilarini toplar
- `src/config`: precedence mantigi ile runtime ayarini uretir

## Akis ozeti

1. `src/index.ts` config'i yukler.
2. Logger ve application runtime kurulumu yapilir.
3. MCP transport adaptoru arac tanimlarini SDK'ya kaydeder.
4. Varsayilan bootstrap akisinda `initialize`, `tools/list` ve `tools/call` MCP SDK tarafindan stdio uzerinden sunulur.
5. Tool cagrisi geldiginde runtime input'u dogrular, guard calistirir, handler'i yurutur ve sonucu normalize eder.

## Neden bu tasarim

- protokol ayrintisi her yere sizmaz
- yeni MCP projeleri yalnizca `src/application` ve `src/security` alanlarinda buyur
- test stratejisi katmanlara gore ayrilir

Son guncelleme: 2026-03-11
