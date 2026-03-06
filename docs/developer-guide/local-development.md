# Lokal Gelistirme

## Kurulum

```bash
npm install
npm run build
```

veya:

```bash
./scripts/install.sh
```

## Gunluk akis

1. degisikligi yapin
2. ilgili test katmanini calistirin
3. `npm run ci:check` ile tum kalite kapilarini gecin

## Onemli dosyalar neden var

- `package.json`: script, paket kimligi ve yayin ayarlari
- `tsconfig.json`: strict TS kurallari
- `tsup.config.ts`: ESM cikti ve tip uretimi
- `vitest.config.ts`: test ve coverage standardi
- `.releaserc.json`: semver ve release davranisi
