# ADR 0001 - Stdio-first tasarim

English version: [docs/en/decisions/0001-stdio-first.md](../en/decisions/0001-stdio-first.md)

## Karar

Bu temel depo stdio-first varsayimi ile tasarlanir. Varsayilan bootstrap akisinda stdio kullanilir; ek transport yardimcilari ise opsiyonel ve daha dusuk seviyeli entegrasyon noktasi olarak sunulur.

## Gerekce

- kapsam kontrollu kalir
- yerel host entegrasyonlari icin en dogrudan baslangic budur
- yuksek seviyeli kurulum akisinda tek varsayilan davranis korunur

## Sonuc

Streamable HTTP gibi ek tasima yardimcilari mevcut olsa da depo genelinde temel karar stdio'yu varsayilan tutmaktir.

Son guncelleme: 2026-03-11
