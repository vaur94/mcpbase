# Hub API Referansı

[🇬🇧 English](../../en/hub/api-reference.md)

`@vaur94/mcpbase/hub` alt yolu için ayrıntılı API referansı.

## Manifest Üretimi

### HubManifest

Tam bir Hub uyumlu sunucu manifestini temsil eden Zod tarafından doğrulanmış yapı.

### createHubManifest(options: HubManifestOptions)

Bir manifest nesnesi oluşturur ve doğrular.

### createHubManifestFromBootstrap(options, config)

Mevcut başlatma seçeneklerinizden ve yüklenen yapılandırmanızdan bir manifest türeten bir yardımcıdır.

## Araç Durum Yönetimi

### ToolStateManager

Araç görünürlüğünü ve yürütme durumunu yönetmek için bir arayüz.

```typescript
interface ToolStateManager {
  getState(toolName: string): ToolState;
  setState(toolName: string, state: ToolState, reason?: string): void;
  listStates(): readonly ToolStateEntry[];
  isCallable(toolName: string): boolean;
  isVisible(toolName: string): boolean;
  onChange(listener: (toolName: string, state: ToolState) => void): void;
}
```

### createToolStateManager(toolNames: string[])

Standart bir bellek içi durum yöneticisi oluşturur. Araçlar varsayılan olarak `'enabled'` (etkin) olarak başlatılır.

### ToolState

Olası durumlar: `'enabled'`, `'disabled'` (devre dışı) veya `'hidden'` (gizli).

## Ayarlar Şeması

### createSettingsSchema(fields: SettingsField[])

Hub arayüzü üretimi için gruplandırılmış ve sürümlendirilmiş bir ayarlar şeması oluşturur.

### settingsFieldsFromBaseConfig()

`server.name`, `server.version`, `logging.level` ve `logging.includeTimestamp` için varsayılan alanları döndürür.

### SettingsField

Tek bir yapılandırma alanı için meta veriler.

- **type**: `'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'path'`
- **secret**: Doğruysa, Hub değeri arayüzde maskelemelidir.
- **group**: Hub arayüzündeki alanları kategorize etmek için kullanılır.

## Öz-İnceleme (Introspection)

### createIntrospectionTool(options, context)

`_mcpbase_introspect` aracını oluşturur. Genellikle `bootstrap({ introspection: true })` aracılığıyla otomatik olarak çağrılır.

### IntrospectionOptions

- **toolName**: İsteğe bağlı özel ad (varsayılan: `_mcpbase_introspect`).
- **includeTelemetry**: Çıktıya metrik anlık görüntülerini dahil edip etmeyeceği (varsayılan: `true`).

Son güncelleme: 2026-03-11
