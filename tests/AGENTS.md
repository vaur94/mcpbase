# TESTLER BILGI NOTU

## GENEL BAKIS

`tests/`, kutuphaneyi uc katmanda dogrular: birim davranis, runtime entegrasyonu ve derlenmis stdio protokolu.

## YAPI

```text
tests/
|- unit/         # Cekirdek davranis ve yardimcilar
|- integration/  # Runtime + generic extension senaryolari
|- protocol/     # Dist cikisina baglanan MCP istemcisi testi
`- fixtures/     # Ortak test config helper'lari
```

## NEREYE BAKMALI

| Gorev                               | Konum                                                                    | Not                                           |
| ----------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------- |
| Runtime degisikligi                 | `tests/unit/runtime.test.ts`, `tests/integration/runtime.test.ts`        | Hem local hem pipeline etkisini kontrol et    |
| Public bootstrap/export degisikligi | `tests/unit/bootstrap.test.ts`                                           | En buyuk kapsama merkezi                      |
| Capability degisikligi              | `tests/unit/capabilities-*.test.ts`                                      | Her capability ayri dosyada                   |
| Security degisikligi                | `tests/unit/security-guards.test.ts`, `tests/unit/security-tool.test.ts` | Permission akisini ayri dogrular              |
| HTTP/transport degisikligi          | `tests/unit/transport*.test.ts`                                          | Factory ve streamable-http ayrik testlenir    |
| Hub degisikligi                     | `tests/unit/hub-*.test.ts`, `tests/integration/hub-runtime.test.ts`      | manifest, settings, tool-state, introspection |
| Hub protokol kontrolu               | `tests/protocol/hub.protocol.test.ts`                                    | Build bagimli; `dist/hub/index.js` kullanir   |
| Gercek MCP istemci kontrolu         | `tests/protocol/stdio.protocol.test.ts`                                  | `dist/index.js` ile konusur                   |

## KONVANSIYONLAR

- Test adlari Turkce yazilir.
- Unit testler saf helper/sinif davranisini hedefler; integration runtime kompozisyonunu hedefler.
- Protocol testleri build bagimlidir; `npm run test:protocol` zaten once `npm run build` calistirir.
- Kritik akis degisirse sadece bir katmanda degil, gereken tum katmanlarda test ekle.
- Fixture mantigi `tests/fixtures/` altinda tutulur; kopya config kurulumundan kacin.

## ANTI-PATTERNLER

- Protocol kapsamini unit test ile ikame etmek.
- Runtime/config/security degisikliklerini yalnizca happy-path ile test etmek.
- Ingilizce test adi eklemek.
- `dist/` cikisina bagli testlerde build adimini atlamak.

## NOTLAR

- Coverage esikleri `vitest.config.ts` icinde: lines/functions/statements %90, branches %80.
- Coverage disi alanlar kasitlidir; yeni dosya eklerken otomatik olarak kapsama beklentisine girer.
