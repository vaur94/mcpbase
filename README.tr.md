# mcpbase

[🇬🇧 English](./README.md) | 🇹🇷 Türkçe

> **`@vaur94/mcpbase`** — TypeScript ile MCP sunucusu geliştirmek için production-ready temel kütüphane. Generic tipler, 6 MCP capability, Streamable HTTP transport ve execution hook sistemi — tek bir kurulabilir pakette.

---

## ✨ Neden mcpbase

- 📦 **Fork değil, kur** — `npm install @vaur94/mcpbase` ile başla, genişlet
- 🧬 **Tamamen generic** — `BaseRuntimeConfig<TExtras>`, `AppError<TCode>`, `ToolDefinition<I,O,TContext>` — varsayılan olarak tip güvenli
- 🔌 **6 MCP capability** — Tools, Resources, Prompts, Logging, Sampling, Roots
- 🌐 **Çift transport** — stdio + Streamable HTTP hazır
- 🪝 **Hook sistemi** — `beforeExecute`, `afterExecute`, `onError` ile cross-cutting concerns
- 🧪 **TDD test paketi** — 200+ test, %90+ coverage, protokol testleri dahil
- 🚀 **CI hazır** — GitHub Actions, semantic-release, Dependabot kurulu

---

## 📦 Kurulum

```bash
npm install @vaur94/mcpbase
# peer dependency'ler
npm install zod @modelcontextprotocol/sdk
```

---

## ⚡ Hızlı Başlangıç

### Minimal — sıfır config

```typescript
import { bootstrap } from '@vaur94/mcpbase';

await bootstrap(); // örnek araçlarla stdio MCP sunucusu başlatır
```

### Kendi araçlarınla

```typescript
import { bootstrap } from '@vaur94/mcpbase';
import { z } from 'zod';

await bootstrap({
  tools: [
    {
      name: 'selamla',
      description: 'Birini selamla',
      inputSchema: z.object({ isim: z.string() }),
      execute: async ({ isim }) => ({
        content: [{ type: 'text', text: `Merhaba, ${isim}!` }],
      }),
    },
  ],
});
```

### Özel config şemasıyla

```typescript
import { bootstrap, createRuntimeConfigSchema } from '@vaur94/mcpbase';
import { z } from 'zod';

const configSchema = createRuntimeConfigSchema(
  z.object({
    depolama: z.object({ yol: z.string() }),
  }),
);

await bootstrap({
  configSchema,
  tools: araçlarım,
  hooks: {
    beforeExecute: async (tool, input, ctx) => {
      console.error(`[${ctx.requestId}] → ${tool.name}`);
    },
  },
});
```

### Dahili telemetri ile

```typescript
import { bootstrap, createInMemoryTelemetry } from '@vaur94/mcpbase';

const telemetry = createInMemoryTelemetry({
  maxSamplesPerTool: 500,
});

await bootstrap({
  tools: araçlarım,
  telemetry,
});

setInterval(() => {
  const snapshot = telemetry.snapshot();
  const transformMetrics = snapshot.tools.get('text_transform');

  console.error({
    totalCalls: snapshot.totalCalls,
    totalErrors: snapshot.totalErrors,
    overallErrorRate: snapshot.overallErrorRate,
    overallP95LatencyMs: snapshot.overallP95LatencyMs,
    textTransformP95LatencyMs: transformMetrics?.p95LatencyMs ?? 0,
  });
}, 30_000);
```

Bu yaklaşım OpenTelemetry, veritabanı veya arka plan exporter eklemeden hafif gözlemlenebilirlik sağlar. Telemetri tamamen opsiyoneldir: `telemetry` vermezsen mevcut davranış aynen korunur.

### Streamable HTTP transport

```typescript
import { createMcpServer, startStreamableHttpServer, loadConfig } from '@vaur94/mcpbase';
import { createServer } from 'node:http';

const config = await loadConfig(baseRuntimeConfigSchema);
const runtime = new ApplicationRuntime({ config, logger, tools });
const server = createMcpServer(runtime, { enableLogging: true });

createServer(async (req, res) => {
  await startStreamableHttpServer(server, { req, res });
}).listen(3000);
```

---

## 🏗️ Proje Yapısı

```
src/
├── contracts/          # Generic tip tanımları
│   ├── runtime-config.ts   # BaseRuntimeConfig<TExtras>, createRuntimeConfigSchema
│   ├── tool-contract.ts    # ToolDefinition<I,O,TContext>, ToolAnnotations
│   └── hooks.ts            # ExecutionHooks<TContext>
├── core/               # Hata + context
│   ├── app-error.ts        # AppError<TCode>, BaseAppErrorCode
│   └── execution-context.ts # BaseToolExecutionContext<TConfig>
├── application/        # Runtime + registry
│   ├── runtime.ts          # ApplicationRuntime<TConfig,TContext>
│   └── tool-registry.ts    # ToolRegistry<TContext>
├── telemetry/          # Opsiyonel in-memory metrikler
│   └── telemetry.ts        # createInMemoryTelemetry, TelemetryRecorder
├── config/             # Config yükleme
│   └── load-config.ts      # loadConfig<TConfig>(schema, options?)
├── capabilities/       # MCP capability modülleri
│   ├── resources.ts        # registerResources, registerResourceTemplates
│   ├── prompts.ts          # registerPrompts, registerPromptTemplates
│   ├── logging.ts          # createMcpLoggingBridge
│   ├── sampling.ts         # createSamplingHelper
│   └── roots.ts            # createRootsHandler
├── transport/          # Transport adaptörleri
│   ├── mcp/server.ts       # createMcpServer, startStdioServer
│   ├── mcp/streamable-http.ts # startStreamableHttpServer
│   └── transport-factory.ts   # createTransport (stdio | streamable-http)
├── examples/index.ts   # @vaur94/mcpbase/examples subpath
└── security/index.ts   # @vaur94/mcpbase/security subpath
```

---

## 🔁 Yeni Proje İçin Yeniden Adlandırma

mcpbase üzerine yeni bir MCP sunucusu geliştirirken şunları güncelle:

### 1. `package.json`

```json
{
  "name": "@kapsamın/mcp-sunucun",
  "version": "1.0.0",
  "description": "MCP sunucunun açıklaması"
}
```

### 2. Sunucu kimliği (config veya bootstrap içinde)

```typescript
// mcpbase.config.json
{
  "server": {
    "name": "mcp-sunucun",
    "version": "1.0.0"
  }
}
```

### 3. Config şemasını genişlet

```typescript
import { createRuntimeConfigSchema } from '@vaur94/mcpbase';
import { z } from 'zod';

// Kendi domain'ine özgü config alanlarını ekle
export const benimConfigSchema = createRuntimeConfigSchema(
  z.object({
    depolama: z.object({ kokYol: z.string() }),
    limitler: z.object({ maxDosyaBoyutu: z.number().default(10_000_000) }),
  }),
);
```

### 4. Hata kodlarını genişlet

```typescript
import type { BaseAppErrorCode } from '@vaur94/mcpbase';

export type BenimHataKodum = BaseAppErrorCode | 'DEPOLAMA_HATASI' | 'KOTA_ASILDI';
```

### 5. Execution context'i genişlet

```typescript
import type { BaseToolExecutionContext } from '@vaur94/mcpbase';
import type { BenimConfigum } from './config.js';

export interface BenimContextim extends BaseToolExecutionContext<BenimConfigum> {
  depolama: DepolamaYoneticisi;
}
```

### 6. Hepsini birleştir

```typescript
import { bootstrap } from '@vaur94/mcpbase';
import { benimConfigSchema } from './config.js';
import { araçlarım } from './tools/index.js';

await bootstrap<BenimConfigum, BenimContextim>({
  configSchema: benimConfigSchema,
  tools: araçlarım,
  contextFactory: (toolName, requestId, config) => ({
    requestId,
    toolName,
    config,
    depolama: new DepolamaYoneticisi(config.depolama.kokYol),
  }),
});
```

### 7. Subpath import'lar

```typescript
// Örnek araçlar (referans / test için)
import { createExampleTools } from '@vaur94/mcpbase/examples';

// Güvenlik guard'ları + PERMISSION_DENIED hata kodu
import {
  assertFeatureEnabled,
  assertAllowedPath,
  PERMISSION_DENIED,
} from '@vaur94/mcpbase/security';
```

### 8. Gerekirse telemetri ekle

```typescript
import { bootstrap, createInMemoryTelemetry, type TelemetryRecorder } from '@vaur94/mcpbase';

const telemetry: TelemetryRecorder = createInMemoryTelemetry({
  maxSamplesPerTool: 1000,
});

await bootstrap<BenimConfigum, BenimContextim>({
  configSchema: benimConfigSchema,
  tools: araçlarım,
  telemetry,
  contextFactory: (toolName, requestId, config) => ({
    requestId,
    toolName,
    config,
    depolama: new DepolamaYoneticisi(config.depolama.kokYol),
  }),
});

const snapshot = telemetry.snapshot();
console.error('Güncel hata oranı:', snapshot.overallErrorRate);
console.error('Güncel p95 gecikme:', snapshot.overallP95LatencyMs);
```

Bu sayede telemetri tool mantığının dışında kalır. Config migration gerekmez, transport değişmez, opt-in olmayan kullanıcılar etkilenmez.

---

## 📚 Dokümantasyon

- 🗺️ [v1 → v2 Geçiş Rehberi](./docs/en/migration/v1-to-v2.md)
- 📖 [API Referansı](./docs/en/api/v2-reference.md)
- 🏛️ [Mimari Genel Bakış](./docs/en/architecture/overview.md)
- 🔧 [Geliştirici Rehberi](./docs/en/developer-guide/local-development.md)
- 🇬🇧 [English Documentation](./docs/en/)

---

## 🧪 Kalite Kapıları

```bash
npm run ci:check      # format + lint + typecheck + coverage + build
npm run test          # birim testler (225 test, 26 dosya)
npm run test:protocol # stdio protokol testleri (4 test)
npm run test:coverage # coverage raporu (%90+ eşikler)
npm run build         # dist/ üretir (3 entry point)
```

---

## 📄 Lisans

MIT. Bkz. [`LICENSE`](./LICENSE).
