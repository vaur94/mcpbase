# MCPBASE - PROJE BILGI TABANI

**Olusturulma:** 2026-03-07
**Commit:** f55291c
**Dal:** main

## GENEL BAKIS

stdio-first, Turkish-first MCP sunucu referans mimarisi. TypeScript + Zod + ESM. Yeni MCP sunuculari bu depoyu temel alarak turetilir.

## YAPI

```
mcpbase/
├── src/
│   ├── index.ts                    # Barrel export + bootstrap() giris noktasi
│   ├── application/
│   │   ├── runtime.ts              # ApplicationRuntime — arac yonetimi ve yurutme
│   │   ├── tool-registry.ts        # ToolRegistry — ad→tanim eslestirme
│   │   └── example-tools.ts        # server_info + text_transform ornek araclar
│   ├── config/
│   │   ├── load-config.ts          # 4 katmanli config yukleme (varsayilan→dosya→env→cli)
│   │   └── default-config.ts       # Varsayilan yapilandirma degerleri
│   ├── contracts/
│   │   ├── runtime-config.ts       # RuntimeConfig Zod semasi
│   │   └── tool-contract.ts        # ToolDefinition arayuzu
│   ├── core/
│   │   ├── app-error.ts            # AppError sinifi + ensureAppError()
│   │   ├── execution-context.ts    # ToolExecutionContext arayuzu
│   │   └── result.ts               # SuccessResult/ErrorResult + createTextContent()
│   ├── infrastructure/
│   │   ├── cli-args.ts             # CLI arguman ayristica
│   │   └── json-file.ts            # JSON dosya okuyucu
│   ├── logging/
│   │   ├── logger.ts               # Logger arayuzu (soyut)
│   │   └── stderr-logger.ts        # StderrLogger uygulamasi (JSON → stderr)
│   ├── security/
│   │   └── guards.ts               # assertFeatureEnabled/AllowedCommand/AllowedPath
│   ├── shared/
│   │   ├── merge.ts                # deepMerge yardimcisi
│   │   ├── request-id.ts           # Benzersiz istek kimligi uretimi
│   │   └── text.ts                 # Metin donusturme yardimcilari
│   └── transport/
│       └── mcp/
│           └── server.ts           # createMcpServer() + startStdioServer()
├── tests/
│   ├── unit/                       # 9 birim test dosyasi
│   ├── integration/                # Calisma zamani entegrasyon testi
│   ├── protocol/                   # stdio uzerinden gercek MCP istemci testi
│   └── fixtures/                   # createFixtureConfig() fabrika fonksiyonu
├── docs/                           # Turkce dokumantasyon (mimari, guvenlik, rehberler)
├── bin/cli.js                      # CLI giris noktasi (bootstrap() cagirir)
└── examples/                       # Ornek config + turetilmis arac
```

## NEREYE BAKMALI

| Gorev                  | Konum                                                              | Notlar                                                  |
| ---------------------- | ------------------------------------------------------------------ | ------------------------------------------------------- |
| Yeni arac ekle         | `src/application/example-tools.ts`                                 | ToolDefinition arayuzunu uygula, ToolRegistry'ye kaydet |
| Config genislet        | `src/contracts/runtime-config.ts` + `src/config/default-config.ts` | Zod semasini ve varsayilani birlikte guncelle           |
| Guvenlik korumasi ekle | `src/security/guards.ts`                                           | Deny-by-default: her sey yasakli, acikca izin ver       |
| MCP transport degistir | `src/transport/mcp/server.ts`                                      | Ince katman — runtime'a delege eder                     |
| Hata islemleri         | `src/core/app-error.ts`                                            | AppErrorCode enum'a yeni kod ekle                       |
| Test yaz               | `tests/unit/`                                                      | Vitest, describe/it/expect, Turkce test adlari          |
| CI pipeline            | `.github/workflows/ci.yml`                                         | quality → release (main dalina push'ta)                 |

## KOD HARITASI

### Baslangic Akisi

```
bin/cli.js → bootstrap(argv)
  → loadConfig(argv)           # varsayilan → JSON dosya → env → CLI override
  → new StderrLogger(config)
  → createExampleTools()       # ToolDefinition[] uretir
  → new ApplicationRuntime(config, logger, tools)
    → ToolRegistry.register()  # Her arac kaydedilir
  → createMcpServer(runtime)   # McpServer araci → runtime.executeTool'a baglar
  → startStdioServer(server)   # StdioServerTransport baslatir
  → SIGINT/SIGTERM dinle
```

### Arac Yurutme Akisi

```
MCP istegi gelir → runtime.executeTool(name, rawInput)
  1. ToolRegistry.get(name)       # Araci bul (yoksa TOOL_NOT_FOUND)
  2. assertFeatureEnabled()       # Guvenlik kontrolu (PERMISSION_DENIED)
  3. inputSchema.parse(rawInput)  # Zod giris dogrulamasi (VALIDATION_ERROR)
  4. tool.execute(input, context) # Arac mantigi calisir
  5. outputSchema?.parse()        # Opsiyonel cikis dogrulamasi
  6. SuccessResult veya ErrorResult don
```

### Kritik Tip Imzalari

```typescript
interface ToolDefinition<TInput, TOutput> {
  name: string;
  title: string;
  description: string;
  inputSchema: ZodObject<TInput>;
  outputSchema?: ZodObject<TOutput>;
  security?: { requiredFeature?: keyof RuntimeConfig['security']['features'] };
  execute(input, context: ToolExecutionContext): Promise<ToolSuccessPayload>;
}

interface RuntimeConfig {
  server: { name: string; version: string };
  logging: { level: 'debug' | 'info' | 'warn' | 'error'; includeTimestamp: boolean };
  security: {
    features: Record<string, boolean>;
    commands: { allowed: string[] };
    paths: { allowed: string[] };
  };
}

type AppErrorCode =
  | 'CONFIG_ERROR'
  | 'VALIDATION_ERROR'
  | 'TOOL_NOT_FOUND'
  | 'TOOL_EXECUTION_ERROR'
  | 'PERMISSION_DENIED';
```

## KURALLAR

### TypeScript Ayarlari (tsconfig.json)

- `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`
- `verbatimModuleSyntax: true` — type-only importlarda `type` zorunlu
- `moduleResolution: NodeNext` — import yollarinda `.js` uzantisi zorunlu
- `target: ES2022`, `lib: ["ES2022", "DOM"]`

### ESLint

- `@typescript-eslint/consistent-type-imports: error` — `import type` kullan
- `@typescript-eslint/require-await: off` — await'siz async fonksiyonlara izin var

### Prettier

- `singleQuote: true`, `trailingComma: "all"`, `printWidth: 100`

### Build (tsup)

- Yalnizca ESM ciktisi (CJS yok)
- `target: node20`, `splitting: false`, `sourcemap: true`, `dts: true`
- Giris noktasi: `src/index.ts`

### Test (Vitest)

- Kapsama esikleri: lines %90, functions %90, branches %80, statements %90
- Kapsama disinda: `src/index.ts`, `tool-contract.ts`, `execution-context.ts`, `logger.ts`
- Test adlari Turkce yazilir
- Protocol testleri build gerektirir: `npm run test:protocol`

## YASAKLAR (BU PROJEDE)

- `as any`, `@ts-ignore`, `@ts-expect-error` — ASLA
- Bos catch bloklari `catch(e) {}` — ASLA
- stdout'a MCP protokolu disinda yazma — ASLA (loglama stderr'e gider)
- Placeholder kod veya TODO yorumlari — ASLA
- Test olmadan kritik akis degisikligi — ASLA
- CJS ciktisi — KASITLI OLARAK DEVRE DISI (top-level await uyumsuzlugu)

## KOMUTLAR

```bash
npm run ci:check          # Tam kalite kapisi: format + lint + typecheck + test:coverage + build
npm run dev               # Izleme modunda gelistirme
npm run test              # Tum testleri calistir
npm run test:unit         # Yalnizca birim testleri
npm run test:protocol     # Protokol testleri (once build gerekir)
npm run test:coverage     # Kapsama raporuyla test
npm run lint:fix          # Lint hatalarini otomatik duzelt
npm run format            # Kodu formatla
npm run typecheck         # Tip kontrolu
npm run build             # Uretim derlemesi (dist/)
npm run release           # semantic-release (yalnizca CI'da)
```

## NOTLAR

- `@modelcontextprotocol/sdk` v1 monolitik paket kullanilir (v2 split paketleri henuz npm'de yok)
- `skipLibCheck: true` — zod v4 ve SDK arasindaki tip uyumsuzlugu icin zorunlu
- `allowSyntheticDefaultImports: true` — SDK'nin default import kaliplari icin
- Config dosyasi varsayilan yol: `mcpbase.config.json` (proje kokunde)
- Env degiskenleri `MCPBASE_` on ekiyle baslar (ornek: `MCPBASE_LOG_LEVEL=debug`)
- Commit mesajlari conventional commits formatinda (semantic-release tetikler)
- Tum kullaniciya yonelik metinler Turkce olmali
- Bu depo bir urun degil; turetilecek MCP sunuculari icin temel alinir
