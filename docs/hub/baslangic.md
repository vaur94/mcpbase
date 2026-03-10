# Hub Yönetimli Sunuculara Başlangıç

[🇬🇧 English](../../en/hub/getting-started.md)

Bu kılavuz, `@vaur94/mcpbase` kullanarak Hub yönetimli bir MCP sunucusunun nasıl kurulacağını gösterir.

## Öz-İncelemeyi (Introspection) Etkinleştirme

Sunucunuzu "Hub'a hazır" hale getirmenin en kolay yolu, başlatma (bootstrap) sırasında yerleşik öz-inceleme aracını etkinleştirmektir.

```typescript
import { bootstrap } from '@vaur94/mcpbase';

await bootstrap({
  // _mcpbase_introspect aracını etkinleştirir
  introspection: true,
  // Örnek araçlar
  tools: myTools,
});
```

Öz-inceleme aracı Hub'a şunları sağlar:

- Sunucu adı ve sürümü.
- `mcpbase` sürümü.
- Kayıtlı araçların listesi ve mevcut durumları.
- Telemetri anlık görüntüleri (eğer bir telemetri kaydedici sağlanmışsa).

## Hub Manifestini Yapılandırma

Bir Hub manifesti, sunucunuzun nasıl başlatılacağını ve yapılandırılacağını açıklar. Başlatma seçeneklerinizi ve mevcut yapılandırmanızı kullanarak bir tane oluşturabilirsiniz.

```typescript
import { loadConfig, runtimeConfigSchema } from '@vaur94/mcpbase';
import { createHubManifestFromBootstrap } from '@vaur94/mcpbase/hub';

const config = await loadConfig(runtimeConfigSchema);
const manifest = createHubManifestFromBootstrap(
  {
    package: {
      name: 'my-mcp-server',
      version: '1.0.0',
      description: 'Yönetimli bir MCP sunucusu örneği',
    },
    // başlatma seçenekleri varsayılan olarak 'node' ve './dist/index.js' şeklindedir
    launch: {
      command: 'node',
      args: ['./dist/index.js'],
      configFile: 'mcpbase.config.json',
      envPrefix: 'MCPBASE_',
    },
  },
  config,
);

process.stderr.write(`${JSON.stringify(manifest, null, 2)}\n`);
```

## Araç Durumlarını Yönetme

Araç görünürlüğünü veya kullanılabilirliğini dinamik olarak kontrol etmeniz gerekiyorsa, `ToolStateManager` kullanın.

```typescript
import { bootstrap } from '@vaur94/mcpbase';
import { createToolStateManager } from '@vaur94/mcpbase/hub';

const stateManager = createToolStateManager(['deneysel_arac', 'eski_arac']);

// Bir aracı devre dışı bırak (çağrılar TOOL_EXECUTION_ERROR ile başarısız olur)
stateManager.setState('deneysel_arac', 'disabled', 'Hala geliştirme aşamasında');

// Bir aracı gizle (listelemede görünmez, çağrılar TOOL_NOT_FOUND ile başarısız olur)
stateManager.setState('eski_arac', 'hidden');

await bootstrap({
  tools: myTools,
  stateManager,
  introspection: true,
});
```

## Ayarlar Şemasını Tanımlama

Hub'a bir ayar arayüzü için meta veri sağlamak amacıyla bir ayar şeması tanımlayabilirsiniz.

```typescript
import { createSettingsSchema, settingsFieldsFromBaseConfig } from '@vaur94/mcpbase/hub';

const settingsSchema = createSettingsSchema([
  ...settingsFieldsFromBaseConfig(), // Sunucu adı/sürümü ve günlük kaydını içerir
  {
    key: 'api.key',
    type: 'string',
    required: true,
    label: 'API Anahtarı',
    secret: true,
    group: 'Kimlik Doğrulama',
  },
]);

// Bunu manifestinize dahil edin
const manifest = createHubManifestFromBootstrap(
  {
    package: { name: 'my-server', version: '1.0.0' },
    settingsSchema,
  },
  config,
);
```

Son güncelleme: 2026-03-11
