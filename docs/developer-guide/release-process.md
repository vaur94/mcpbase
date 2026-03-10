# Release Sureci

English version: [docs/en/developer-guide/release-process.md](../en/developer-guide/release-process.md)

## Dogrulanmis akis

1. Pull request ve push olaylari `.github/workflows/ci.yml` icindeki kalite job'unu calistirir.
2. `main` dalina gelen push'lar kalite kapilarini gectikten sonra `release` job'una ilerler.
3. Release job'u `npm run release` komutunu calistirir.
4. Bu komut `semantic-release` zincirini kullanarak surum analizini ve GitHub release adimlarini yonetir.

## Dogrulanmis girdiler

- Conventional commit gecmisi release analizine girer.
- Workflow, release job'u icin `GITHUB_TOKEN` ortam degiskenini saglar.
- Workflow izinleri `contents`, `issues`, `pull-requests` ve `id-token` yazma haklarini icerir.

## Maintainer dogrulamasi gereken kisim

Repo, npm publish kimlik dogrulama ayrintisini acikca anlatmiyor. `id-token: write` yetkisi mevcut olsa da uretimde npm trusted publishing mi yoksa farkli bir auth yolu mu kullanildigi maintainer tarafinda dogrulanmalidir.

## Ilgili dosyalar

- `.github/workflows/ci.yml`
- `.releaserc.json`
- `package.json`
- `CHANGELOG.md`

Son guncelleme: 2026-03-11
