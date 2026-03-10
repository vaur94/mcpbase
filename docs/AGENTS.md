# DOKUMANTASYON BILGI NOTU

## GENEL BAKIS

`docs/`, Turkce ana kaynak ile buyuk olcude paralel ilerleyen `docs/en/` setini birlikte tasir; mimari, entegrasyon, guvenlik, konfigurasyon ve gelistirici rehberleri burada tutulur.

## YAPI

```text
docs/
|- architecture/
|- configuration/
|- developer-guide/
|- integration/
|- security/
|- tools/
|- user-guide/
|- decisions/
`- en/              # Cogu bolumun English karsiligi; birebir olmayan sayfalar da var
```

## NEREYE BAKMALI

| Gorev                      | Konum                                                                             | Not                                               |
| -------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------- |
| Mimari ozet guncelle       | `docs/architecture/overview.md`, `docs/en/architecture/overview.md`               | Katman ve akis anlatimi                           |
| Extension/generic kullanim | `docs/architecture/extension-model.md`, `docs/en/architecture/extension-model.md` | Turetilmis sunucu kalibi                          |
| Test beklentileri          | `docs/developer-guide/testing.md`, `docs/en/developer-guide/testing.md`           | Katman ve komutlar                                |
| Lokal gelistirme / release | `docs/developer-guide/` ve `docs/en/developer-guide/`                             | Surec degisikliklerinde ikisini birlikte guncelle |
| Tool kurallari             | `docs/tools/tool-conventions.md`, `docs/en/tools/tool-conventions.md`             | `snake_case`, Zod, output kurallari               |
| Editor/agent entegrasyonu  | `docs/integration/`, `docs/en/integration/`                                       | stdout/stderr notlari kritik                      |
| Hub (managed servers)      | `docs/hub/`, `docs/en/hub/`                                                       | Genel bakis, baslangic, API referans              |
| Tasarim karari             | `docs/decisions/0001-stdio-first.md`, `docs/en/decisions/0001-stdio-first.md`     | Varsayilan transport karari                       |

## KONVANSIYONLAR

- Turkce sayfa degisirse `docs/en/` tarafinda esdeger veya en yakin English sayfayi da kontrol et.
- Path, komut ve export ornekleri repo gercegiyle birebir uyumlu olmali.
- Public API degisikliginde README + API ref + ilgili rehber sayfalari birlikte guncellenir.
- `stdout`/`stderr`, test katmanlari ve tool naming kurallari birden fazla sayfada tekrarlandigi icin capraz kontrol yap.

## ANTI-PATTERNLER

- Esdeger English/Turkce sayfayi kontrol etmeden tek tarafta degisiklik birakmak.
- Eski stdio-only anlatimi koruyup kodda eklenen HTTP/capability/telemetry degisikliklerini atlamak.
- Komutlari `package.json` ile karsilastirmadan yazmak.
- Public API orneklerinde gercek export olmayan yol veya isim kullanmak.

## NOTLAR

- Mevcut belgelerin bir kismi stdio-first karar dilini koruyor; transport veya capability kapsaminda davranis degisirse karar dokusu, entegrasyon rehberleri ve API referansi birlikte gozden gecirilmeli.
- `docs/index.md` ve `docs/en/index.md` ana giris noktalaridir; `docs/README.en.md` geriye donuk uyumluluk sayfasi olarak korunur.
