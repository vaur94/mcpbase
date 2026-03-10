# mcpbase

[English](./README.md) | Turkce

`@vaur94/mcpbase`, stdio-first calisma modelini koruyan; opsiyonel Streamable HTTP transport, capability yardimcilari, security guard'lari, telemetri ve hub yardimcilari sunan ESM-only TypeScript kutuphanesidir.

## Ne saglar

- `bootstrap`, `ApplicationRuntime`, `ToolRegistry` ve `loadConfig` gibi generic runtime yuzeyi
- Resources, prompts, logging, sampling ve roots icin MCP capability yardimcilari
- `assertFeatureEnabled`, `assertAllowedPath`, `assertAllowedCommand` ve `createSecurityEnforcementHook` ile guvenlik denetimleri
- `createInMemoryTelemetry` ile opsiyonel in-memory telemetri
- `@vaur94/mcpbase/examples`, `@vaur94/mcpbase/security` ve `@vaur94/mcpbase/hub` subpath export'lari

## Kurulum

Gereksinimler:

- Node.js `>=22.14.0`
- npm `>=10.0.0`

```bash
npm install @vaur94/mcpbase
npm install zod @modelcontextprotocol/sdk
```

## Hizli baslangic

```typescript
import { bootstrap } from '@vaur94/mcpbase';
import { z } from 'zod';

await bootstrap({
  tools: [
    {
      name: 'selamla',
      title: 'Selamla',
      description: 'Bir selamlama dondurur',
      inputSchema: z.object({ isim: z.string() }),
      async execute({ isim }) {
        return {
          content: [{ type: 'text', text: `Merhaba, ${isim}!` }],
        };
      },
    },
  ],
});
```

## Depo uzerinde gelistirme

`mcpbase` deposunun kurulumu icin onerilen akis:

```bash
./scripts/install.sh
```

Elle karsiligi:

```bash
npm install
npm run build
node dist/index.js --config examples/mcpbase.config.json
```

## Temel komutlar

```bash
npm run build
npm run typecheck
npm run test
npm run test:protocol
npm run ci:check
```

## Dokumantasyon

- Turkce dokumantasyon indeksi: [`docs/index.md`](./docs/index.md)
- English docs index: [`docs/en/index.md`](./docs/en/index.md)
- API genel bakis: [`docs/api/v2-reference.md`](./docs/api/v2-reference.md)
- Gecis rehberi: [`docs/migration/v1-to-v2.md`](./docs/migration/v1-to-v2.md)
- Mimari genel bakis: [`docs/architecture/overview.md`](./docs/architecture/overview.md)
- Lokal gelistirme rehberi: [`docs/developer-guide/local-development.md`](./docs/developer-guide/local-development.md)

## Katki ve destek

- Katki rehberi: [`CONTRIBUTING.tr.md`](./CONTRIBUTING.tr.md)
- Guvenlik politikasi: [`SECURITY.tr.md`](./SECURITY.tr.md)
- Destek yollari: [`SUPPORT.tr.md`](./SUPPORT.tr.md)
- Release ozeti: [`RELEASE.tr.md`](./RELEASE.tr.md)

## Lisans

MIT. Bkz. [`LICENSE`](./LICENSE).

Son guncelleme: 2026-03-11
