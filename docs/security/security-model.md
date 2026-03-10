# Guvenlik Modeli

English version: [docs/en/security/security-model.md](../en/security/security-model.md)

## Deny-by-default yaklasimi

`mcpbase`, riskli davranislari acik izin olmadan kullanmamayi hedefler. Bu nedenle security yardimcilari feature flag, command allowlist ve path allowlist kalibini birlikte sunar.

## Dogrudan yardimcilar

- `assertFeatureEnabled`
- `assertAllowedCommand`
- `assertAllowedPath`
- `createSecurityEnforcementHook`

## Guvenli gelistirme kurallari

- Dosya sistemi veya komut calistiran araclar guard ile korunmalidir.
- Yeni config alanlari belge ve test olmadan eklenmemelidir.
- MCP loglari stderr uzerinden kalmalidir.
- Runtime ve security davranisi degistiginde unit ve integration testleri birlikte gozden gecirilmelidir.

## Ilgili kaynaklar

- `src/security/guards.ts`
- `src/security/tool-security.ts`
- `SECURITY.tr.md`

Son guncelleme: 2026-03-11
