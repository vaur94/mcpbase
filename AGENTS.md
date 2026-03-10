# MCPBASE - PROJE BILGI TABANI

**Olusturulma:** 2026-03-11 01:01 UTC
**Commit:** a1756e0
**Dal:** main

## GENEL BAKIS

`@vaur94/mcpbase`, TypeScript ile MCP sunuculari kurmak icin dagitilan temel kutuphane. Stdio varsayilan akistir; v2 yapisi capability modulleri, telemetry ve Streamable HTTP tasimasini da icerir.

## YAPI

```text
mcpbase/
|- src/                 # Kutuphane kaynak kodu; ayrintili yerel rehber var
|- tests/               # Unit + integration + protocol katmanlari; yerel rehber var
|- docs/                # Turkce ana dokumantasyon + docs/en aynasi; yerel rehber var
|- bin/cli.js           # Dagitilan CLI girisi
|- examples/            # Turetilmis sunucu icin ornek config ve arac
|- scripts/             # Kurulum yardimcilari
|- tsup.config.ts       # 4 giris noktasini ESM olarak derler
|- vitest.config.ts     # Test kapsama ve katman ayarlari
`- package.json         # Paket kimligi, engine siniri, kalite komutlari
```

## NEREYE BAKMALI

| Gorev                      | Konum                                                                | Not                                                             |
| -------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------- |
| Bootstrap ve export yuzeyi | `src/index.ts`                                                       | Paket API'sinin merkezi; en cok export burada                   |
| Tool yurutme akisi         | `src/application/runtime.ts`                                         | Hook, telemetry ve hata normallestirme buradan gecer            |
| Tool kaydi                 | `src/application/tool-registry.ts`                                   | Ad cakismasi ve lookup kurallari                                |
| Config yukleme             | `src/config/load-config.ts`                                          | defaults -> dosya -> env -> CLI precedence                      |
| Runtime schema             | `src/contracts/runtime-config.ts`                                    | Generic runtime config ve schema ureticileri                    |
| Capability yardimcilari    | `src/capabilities/`                                                  | resources, prompts, logging, sampling, roots                    |
| Transport adaptoru         | `src/transport/`                                                     | stdio varsayilan, streamable-http opsiyonel                     |
| Guvenlik                   | `src/security/`                                                      | deny-by-default guard'lar ve enforcement hook                   |
| Telemetry                  | `src/telemetry/telemetry.ts`                                         | In-memory recorder ve snapshot hesaplari                        |
| Hub (managed servers)      | `src/hub/`                                                           | Manifest, introspection, settings, tool state; yerel rehber var |
| Paket alt exportlari       | `src/examples/index.ts`, `src/security/index.ts`, `src/hub/index.ts` | `./examples`, `./security`, `./hub` subpath'lari                |
| Test stratejisi            | `tests/AGENTS.md`                                                    | Katman secimi ve build bagimliliklari                           |
| Dokumantasyon guncellemesi | `docs/AGENTS.md`                                                     | Turkce + English ayna yapisi                                    |

## KOD HARITASI

| Sembol                           | Tur      | Konum                                  | Rol                                                 |
| -------------------------------- | -------- | -------------------------------------- | --------------------------------------------------- |
| `bootstrap`                      | function | `src/index.ts`                         | Config yukler, runtime kurar, stdio server baslatir |
| `ApplicationRuntime`             | class    | `src/application/runtime.ts`           | Tool execute pipeline'inin merkezi                  |
| `ToolRegistry`                   | class    | `src/application/tool-registry.ts`     | ToolDefinition kayit/lookup katmani                 |
| `loadConfig`                     | function | `src/config/load-config.ts`            | 4 katmanli config birlestirme                       |
| `createRuntimeConfigSchema`      | function | `src/contracts/runtime-config.ts`      | Generic config schema genisletme noktasi            |
| `createMcpServer`                | function | `src/transport/mcp/server.ts`          | SDK server kayit katmani                            |
| `startStreamableHttpServer`      | function | `src/transport/mcp/streamable-http.ts` | HTTP streaming tasimasi                             |
| `createTransport`                | function | `src/transport/transport-factory.ts`   | stdio/http secimi                                   |
| `createInMemoryTelemetry`        | function | `src/telemetry/telemetry.ts`           | Bounded telemetry recorder                          |
| `createSecurityEnforcementHook`  | function | `src/security/tool-security.ts`        | Feature gate enforcement                            |
| `createHubManifest`              | function | `src/hub/manifest.ts`                  | Hub manifest olusturma ve dogrulama                 |
| `createHubManifestFromBootstrap` | function | `src/hub/manifest.ts`                  | Bootstrap opsiyonlarindan manifest uretimi          |
| `createToolStateManager`         | function | `src/hub/tool-state.ts`                | Tool enable/disable/hidden durum yonetimi           |
| `createSettingsSchema`           | function | `src/hub/settings.ts`                  | UI settings schema ureticisi                        |
| `createIntrospectionTool`        | function | `src/hub/introspection.ts`             | Sunucu introspection tool'u olusturma               |

## KONVANSIYONLAR

- ESM-only: `type: module`, `moduleResolution: NodeNext`, import yollarinda `.js` uzantisi zorunlu.
- `verbatimModuleSyntax: true`: type-only importlarda `import type` kullan.
- `useUnknownInCatchVariables: true`: `catch` degiskenleri `unknown` olarak ele alinmali.
- Tool adlari `snake_case`; input/output dogrulamasi Zod ile yapilir.
- Test adlari agirlikla Turkce; runtime/tool metinleri ise repo genelinde Turkce + English karisik olabilir, mevcut dili koru.
- `src/index.ts` paket API'si icin barrel gorevi gorur; yeni public API eklerken export yuzeyini burada ve README/API dokumunda birlikte guncelle.

## ANTI-PATTERNLER (BU PROJEDE)

- `as any`, `@ts-ignore`, `@ts-expect-error` kullanma.
- Bos catch blogu birakma; hata normalize et veya yeniden firlat.
- Stdout'a protokol disi log yazma; loglar stderr uzerinden gider.
- Kritik akis degisikligini testsiz birakma.
- Placeholder/TODO yorumu ekleme.
- CJS cikti veya `require()` geri getirme.

## BENZERSIZ NOKTALAR

- Eski kok rehber stdio-only template'i anlatiyordu; mevcut repo capability modulleri, telemetry, `./examples`, `./security` ve streamable HTTP export eder.
- `docs/decisions/0001-stdio-first.md` stdio'yu varsayilan tasarim olarak anlatir; transport davranisini degistirirsen hem karar dokusunu hem API/reference sayfalarini yeniden eslestir.
- `tests/protocol/stdio.protocol.test.ts` dogrudan `dist/index.js` ile konusur; protocol degisikliginde build-calisan yolu bozma.

## KOMUTLAR

```bash
npm run dev
npm run build
npm run typecheck
npm run test
npm run test:integration
npm run test:protocol
npm run test:coverage
npm run ci:check
```

## NOTLAR

- Node >= 22.14.0, npm >= 10.0.0 beklenir.
- `tsup.config.ts` su an `src/index.ts`, `src/examples/index.ts`, `src/security/index.ts`, `src/hub/index.ts` girislerini paketler.
- `docs/` Turkce ana kaynaktir; `docs/en/` buyuk olcude paralel ilerler ama birebir ayna olmayan sayfalar da vardir.
