# SRC BILGI NOTU

## GENEL BAKIS

`src/`, kutuphanenin public API'sini ve ic mimarisini tasiyan katmanli alandir; en yuksek sinyal `src/index.ts`, `application`, `capabilities`, `transport`, `security` ve `contracts` tarafindadir.

## YAPI

```text
src/
|- application/   # Runtime, registry, ornek tool'lar
|- capabilities/  # resources/prompts/logging/sampling/roots yardimcilari
|- config/        # varsayilanlar + precedence yukleyici
|- contracts/     # generic schema ve hook sozlesmeleri
|- core/          # AppError, result, execution context
|- hub/           # Managed server manifest, introspection, settings, tool state; yerel rehber var
|- infrastructure/# CLI argumanlari ve JSON dosya yardimcilari
|- logging/       # logger soyutlamasi + stderr uygulamasi
|- security/      # guard'lar ve security hook'lari
|- shared/        # merge, request-id, text yardimcilari
|- telemetry/     # bounded in-memory telemetry
`- transport/     # MCP server ve stdio/http transport katmani
```

## NEREYE BAKMALI

| Gorev                           | Konum                                                                                          | Not                                             |
| ------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Yeni public API ekle            | `src/index.ts`                                                                                 | Alt modulu export etmeden paket yuzeyine cikmaz |
| Tool execute akisini degistir   | `src/application/runtime.ts`                                                                   | Hook, telemetry, error result burada bulusur    |
| Yeni capability yardimcisi ekle | `src/capabilities/`                                                                            | Var olan register/create kalibini izle          |
| Yeni config alani ekle          | `src/contracts/runtime-config.ts`, `src/config/default-config.ts`, `src/config/load-config.ts` | Schema + default + mapper birlikte ilerler      |
| Security enforcement            | `src/security/guards.ts`, `src/security/tool-security.ts`                                      | Deny-by-default kalibi korunur                  |
| Ortak yardimci degisikligi      | `src/shared/`                                                                                  | Public re-export alanlarini da etkileyebilir    |
| Transport davranisi             | `src/transport/`                                                                               | Stdio varsayilan; HTTP opsiyonel                |
| Telemetry degisikligi           | `src/telemetry/telemetry.ts`                                                                   | Recorder bounded kalmali                        |
| Hub manifest/introspection      | `src/hub/`                                                                                     | Manifest, settings, tool state, introspection   |

## KONVANSIYONLAR

- Butun import yollarinda `.js` uzantisi kullan.
- Type-only importlari `import type` ile ayir.
- Tool tanimlarinda Zod schema + `title` + `description` zorunlu kabul edilir.
- Tool adlari `snake_case`; sonuc payload'lari `content: TextContentBlock[]` dondurur, makinece okunabilir sonuc icin `structuredContent` tercih edilir.
- `transport` katmani ince kalir; is kurallari `application` veya `security` tarafina kacirilir.
- Stdout protokol icin ayrilmistir; logger yalnizca stderr kullanir.

## ANTI-PATTERNLER

- `src/index.ts` icine uygulama mantigi yigmak.
- Transport dosyalarinda runtime kurallarini tekrar uygulamak.
- `security.requiredFeature` gereken tool'lari serbest birakmak.
- `telemetry` icinde unbounded sample biriktirmek.
- Mevcut dosyanin kullandigi dili goz ardi edip user-facing metni karistirmak.

## NOTLAR

- `src/examples/index.ts`, `src/security/index.ts` ve `src/hub/index.ts`, paket subpath export'lari icindir; yol degisirse `tsup.config.ts` ve `package.json` export'larini birlikte guncelle.
- `src/capabilities/`, `src/transport/` ve `src/hub/` docs tarafinda da anlatilir; davranis degisikliginde `docs/` aynasini guncelle.
