# Release Sureci

## Akis

1. Conventional commit mesajlari `semantic-release` tarafindan analiz edilir.
2. `main` dalina push oldugunda kalite isi tamamlanir.
3. Release isi yeni surumu hesaplar.
4. `CHANGELOG.md`, Git etiketi ve GitHub release olusturulur.
5. `NPM_TOKEN` tanimliysa paket npm'e yayinlanir.

## Gerekli sirlar

- `GITHUB_TOKEN`
- `NPM_TOKEN`

## Neden otomatik

- manuel surum kaymasini azaltir
- changelog ve yayin kaydini tek akista tutar
- turetilmis MCP projelerinde ayni yaklasim tekrar kullanilir
