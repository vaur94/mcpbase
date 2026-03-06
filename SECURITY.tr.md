# Guvenlik Politikasi

## Kapsam

`mcpbase`, stdio-first bir referans tabandir. Guvenlik modeli deny-by-default mantigi uzerine kuruludur ve gelecekteki turetilmis sunucularin da ayni anlayisi korumasini bekler.

## Bildirim sureci

- Guvenlik acigi bulursaniz halka acik issue yerine ozel iletisim tercih edin.
- Uretim ortamina etkisi, tekrar uretim adimlari ve olasi etki alanini acik yazin.
- Bakimci tarafi once sorunu dogrular, sonra duzeltme ve duyuru planini olusturur.

## Temel ilkeler

- riskli ozellikler acik izin olmadan etkinlesmez
- stdout log icin kullanilmaz
- config alanlari belgesiz birakilmaz
- yeni araclar guard ve test olmadan eklenmez

Detay model icin `docs/security/security-model.md` dosyasina bakin.
