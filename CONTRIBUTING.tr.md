# Katki Rehberi

[English](./CONTRIBUTING.md) | Turkce

## Akis

1. Bagimliliklari `./scripts/install.sh` ile kurun veya `npm install` ve `npm run build` calistirin.
2. Degisiklikleri kucuk, odakli ve repo kalibina uygun tutun.
3. Once ilgili dar test komutunu, en sonda `npm run ci:check` komutunu calistirin.
4. Davranis, komut veya public API degistiginde Turkce ve English belgeleri birlikte guncelleyin.
5. Conventional commit gecmisi ve net bir dogrulama ozeti ile pull request acin.

## Beklentiler

- Uygun yerlerde `.js` uzantili ESM importlarini koruyun.
- MCP loglari icin stdout kullanmayin.
- Kritik runtime, transport, security veya config davranislarinda test ekleyin ya da guncelleyin.
- Kok belgeleri, docs sayfalari ve ornekleri `package.json`, workflow'lar ve source export'lariyla uyumlu tutun.

## Inceleme sinyalleri

- `CODEOWNERS`, repo sahipligini su anda `@vaur94` kullanicisina yonlendiriyor.
- Kalite kapilari `.github/workflows/ci.yml` ve `package.json` icinde tanimlidir.
- Dokumantasyon degisiklikleri pull request icinde etkilenen sayfalari acikca belirtmelidir.

Son guncelleme: 2026-03-11
