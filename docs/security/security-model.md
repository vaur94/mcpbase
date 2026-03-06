# Guvenlik Modeli

## Deny-by-default

`mcpbase`, risk tasiyan davranislarin acik izin olmadan kullanilmamasini hedefler. Bu nedenle feature flag, command allowlist ve path allowlist yardimcilari birlikte sunulur.

## Guard felsefesi

- feature flag: bir arac veya yetenek acik mi
- command restriction: hangi komutlara izin veriliyor
- path restriction: hangi kok altinda calisilabilir

## Guvenli extension kurallari

- shell veya dosya araclari ekleniyorsa guard zorunludur
- yeni config alanlari dokumansiz eklenmez
- hata durumlarinda sessizce devam edilmez
- log'lar yalnizca stderr uzerinden akar
