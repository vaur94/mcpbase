# Arac Konvansiyonlari

## Adlandirma

- `snake_case` arac adlari kullanin
- ad, davranisi net tarif etsin

## Input schema kurallari

- tum araclar `zod` schema ile tanimlanir
- bos veya muğlak input alanlarindan kacinilir
- acik `description` kullanmak tercih edilir

## Output kurallari

- `content` alani en az bir metin blogu icermeli
- mumkunse `structuredContent` ile makinece okunabilir sonuc verilmeli
- hata durumlari normalize edilmeli ve sessizce yutulmamalidir

## Metadata kurallari

- title ve description doldurulmus olmali
- feature flag ihtiyaci varsa `security.requiredFeature` tanimlanmali
