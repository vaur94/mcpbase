# Guvenlik Politikasi

[English](./SECURITY.md) | Turkce

## Kapsam

`mcpbase`, stdio-first bir MCP temel kutuphanesidir. Kod tabani security helper'lari, deny-by-default guard'lari ve turetilmis sunucular icin ornekler sunar; ancak her turetilmis sunucu kendi tehdit modelinden ve yayin ortamindan sorumludur.

## Acik bildirme yolu

- Henuz duyurulmamis guvenlik aciklari icin herkese acik GitHub issue acmayin.
- Elinizde varsa once ozel maintainer iletisim kanalini tercih edin.
- Ozel kanal bilinmiyorsa tercih edilen bildirim yolu icin maintainer dogrulamasi gerekir.
- Etki, etkilenen surum, tekrar uretim adimlari ve ilgili guard/config varsayimlarini ekleyin.

## Repo guvenlik modeli

- Riskli davranislar feature flag, command allowlist veya path allowlist ile korunmalidir.
- Protokol akisinin bozulmamasi icin MCP loglari stderr uzerinden kalmalidir.
- Yeni config alanlari kod degisikligiyle birlikte dokumante edilmelidir.
- Dosya sistemi veya komut calistiran yeni araclar guard ve test ile gelmelidir.

## Desteklenen surumler

Resmi surum destek penceresi repoda belgelenmemistir. Maintainer farkli belirtmedikce yalnizca en son yayinlanan surumu dogrulanmis guvenlik bakim hedefi olarak kabul edin.

## Ilgili belgeler

- Guvenlik modeli: [`docs/security/security-model.md`](./docs/security/security-model.md)
- Destek yollari: [`SUPPORT.tr.md`](./SUPPORT.tr.md)

Son guncelleme: 2026-03-11
