# Release Ozeti

[English](./RELEASE.md) | Turkce

## Dogrulanmis release akisi

1. Pull request ve push olaylari `.github/workflows/ci.yml` icindeki kalite workflow'unu calistirir.
2. `main` dalina gelen ve kalite kapilarini gecen push'lar `release` job'una devam eder.
3. Release job'u `npm run release` komutunu, dolayisiyla `semantic-release` akisini calistirir.
4. Repo yapilandirmasi bu job icin `contents`, `issues`, `pull-requests` ve `id-token` yazma izinleri verir.

## Dogrulanan kisimlar

- Release analizi conventional commit'lerle yonlenir.
- GitHub release otomasyonu workflow ve release config ile baglanmistir.
- `CHANGELOG.md` repoda bulunur; ancak `.releaserc.json` su anda `@semantic-release/changelog` veya `@semantic-release/git` eklentilerini yuklemedigi icin changelog dosyasinin otomatik bakimi konfige bagli kabul edilmelidir.

## Maintainer dogrulamasi gereken kisimlar

- Npm publish kimlik dogrulama yolunun tam hali repoda acikca belgelenmemistir.
- Workflow `GITHUB_TOKEN` degiskenini dogrudan gecirir ve `id-token: write` yetkisi verir; ancak uretimde npm trusted publishing mi yoksa baska bir npm auth yolu mu kullanildigini maintainer'lar dogrulamalidir.

## Ilgili belgeler

- English release guide: [`docs/en/developer-guide/release-process.md`](./docs/en/developer-guide/release-process.md)
- Turkce release guide: [`docs/developer-guide/release-process.md`](./docs/developer-guide/release-process.md)

Son guncelleme: 2026-03-11
