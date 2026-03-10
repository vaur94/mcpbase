# Lokal Gelistirme

English version: [docs/en/developer-guide/local-development.md](../en/developer-guide/local-development.md)

## Kurulum

Gereksinimler:

- Node.js `>=22.14.0`
- npm `>=10.0.0`

```bash
./scripts/install.sh
```

veya:

```bash
npm install
npm run build
```

## Gunluk akis

1. Degisikligi yapin.
2. Once ilgili test katmanini (`npm run test:unit`, `npm run test:integration` veya `npm run test:protocol`) calistirin.
3. Gerekirse `npm run typecheck` ve `npm run build` ile dogrulayin.
4. Son kontrol olarak `npm run ci:check` calistirin.

## Onemli dosyalar

- `package.json`: script'ler, export'lar, engine sinirlari ve publish ayarlari
- `tsconfig.json`: NodeNext ve strict TypeScript ayarlari
- `tsup.config.ts`: ESM cikti, d.ts uretimi ve subpath build girisleri
- `vitest.config.ts`: test kapsamasi ve coverage esikleri
- `.releaserc.json`: semantic-release eklenti zinciri
- `.github/workflows/ci.yml`: kalite ve release otomasyonu

## Dokumantasyon notu

Davranis, komut veya public API degistiginde Turkce ve English belgeleri birlikte guncelleyin.

Son guncelleme: 2026-03-11
