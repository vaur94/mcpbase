# HUB BILGI NOTU

## GENEL BAKIS

`src/hub/`, `@vaur94/mcpbase/hub` subpath export'u olarak dagitilan managed server moduludur; manifest olusturma, tool durum yonetimi, UI settings schemasi ve sunucu introspection aracini icerir.

## YAPI

```text
hub/
|- index.ts          # Subpath barrel; tum public API burada export edilir
|- manifest.ts       # HubManifest tipi, Zod schemasi, create fonksiyonlari
|- introspection.ts  # _mcpbase_introspect tool'u; registry + telemetry + state bilestirir
|- settings.ts       # SettingsSchema/Field/Group tipleri ve schema ureticisi
|- tool-state.ts     # ToolStateManager: enable/disable/hidden durum makinesi
`- version.ts        # MCPBASE_VERSION sabiti
```

## NEREYE BAKMALI

| Gorev                         | Konum              | Not                                                        |
| ----------------------------- | ------------------ | ---------------------------------------------------------- |
| Manifest yapisi degistir      | `manifest.ts`      | Zod schema + tip + her iki create fonksiyonu birlikte yuru |
| Yeni introspection alani ekle | `introspection.ts` | IntrospectionResult arayuzu + Zod schema esle              |
| Settings field tipi ekle      | `settings.ts`      | SettingsField.type enum'unu + manifest schema'yi guncelle  |
| Tool state davranisi degistir | `tool-state.ts`    | isCallable/isVisible mantigi introspection'i etkiler       |
| Versiyon guncelle             | `version.ts`       | semantic-release tarafindan otomatik guncellenebilir       |

## KONVANSIYONLAR

- Her public tip ve fonksiyon `index.ts` uzerinden export edilir; dogrudan dosya import'u yapilmaz.
- Manifest ve introspection Zod schema'lari strict moddadir; yeni alan eklerken `.strict()` korunur.
- `createHubManifestFromBootstrap`, `BootstrapOptions` ile uyumlu kalir; bootstrap arayuzu degisirse manifest factory'si de guncellenir.
- Introspection tool adi varsayilan `_mcpbase_introspect`; adindan once `_` kullanilarak ic arac olarak isaretlenir.
- Settings field'lari `order` ile siralanir; grup icinde cakisan order deger kullanimina dikkat et.

## ANTI-PATTERNLER

- `index.ts` barrel'ini atlayip dogrudan `./manifest.js` gibi import etmek.
- Manifest Zod schema'sina alan ekleyip HubManifest/HubManifestOptions tipini guncellememek.
- Introspection sonucuna alan eklerken introspectionResultSchema'yi eslemeden birakmak.
- ToolStateManager'da unbounded listener biriktirmek.

## NOTLAR

- `tsup.config.ts` ve `package.json` exports'unda `./hub` subpath kaydini kor; yol degisirse her ikisini birlikte guncelle.
- Hub testleri uc katmanda: `tests/unit/hub-*.test.ts`, `tests/integration/hub-runtime.test.ts`, `tests/protocol/hub.protocol.test.ts`.
- Dokumantasyon: `docs/hub/` (Turkce) ve `docs/en/hub/` (English).
