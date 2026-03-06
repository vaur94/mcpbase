# mcpbase

`mcpbase`, gelecekteki MCP sunuculari icin stdio-first bir temel ve referans mimarisidir. Bu depo yeni bir MCP projesine hizli, kontrollu ve tekrar kullanilabilir bir baslangic vermek icin tasarlanmistir.

## Proje amaci

- ortak klasor yapisi saglamak
- arac kaydi, validasyon ve hata modelini standartlastirmak
- konfigrasyon, loglama ve guvenlik davranislarini bir cizgiye getirmek
- test, CI/CD ve release akisini tekrar kullanilabilir yapmak

## Bu proje nedir

- TypeScript tabanli bir MCP sunucu referans sistemi
- stdio uzerinden calisan resmi MCP SDK entegrasyonu
- gelecekte turetilecek MCP depolari icin kopyalanabilir veya template olarak kullanilabilir bir temel

## Bu proje ne degildir

- dosya sistemi, git veya shell gibi alan-ozel bir MCP urunu degil
- HTTP transport, dashboard veya plugin mega-framework degil
- deneysel soyutlama vitrini degil

## One cikan ozellikler

- katmanli kaynak kod yapisi
- `zod` ile giris ve cikis sema dogrulamasi
- deny-by-default guvenlik yardimcilari
- stderr uzerinden yapilandirilmis loglama
- Vitest ile birim, entegrasyon ve protokol testleri
- GitHub Actions, Dependabot ve semantic-release ile yayin hazirligi

## Teknoloji secimi

- Dil: TypeScript
- Calisma zamani: Node.js LTS
- Paket yoneticisi: npm
- MCP SDK: `@modelcontextprotocol/sdk`
- Dogrulama: `zod`
- Test: `vitest`
- Build: `tsup`
- Lint/Format: `eslint`, `prettier`

## Mimari ozet

- `src/core`: alan kurallari, hata ve sonuc modelleri
- `src/application`: arac yurutme akisi, kayit ve orchestration
- `src/transport/mcp`: resmi MCP stdio adaptoru
- `src/config`: varsayilanlar, dosya/env/CLI precedence
- `src/logging`: stderr tabanli yapilandirilmis loglama
- `src/security`: ozellik, komut ve yol korumalari

Detaylar icin `docs/architecture/overview.md` ve `docs/architecture/extension-model.md` dosyalarina bakin.

## Klasor yapisi

| Yol                    | Kisa aciklama               | Ne icin var                                       | Buraya ne konmaz                      |
| ---------------------- | --------------------------- | ------------------------------------------------- | ------------------------------------- |
| `src/core`             | alan kurallari temeli       | hata tipleri, sonuc modelleri, execution context  | transport veya CLI kodu               |
| `src/application`      | arac yurutme mantigi        | registry, runtime, use-case seviyesi orkestrasyon | process ve stdio baglanti ayrintilari |
| `src/transport/mcp`    | MCP protokol adaptoru       | MCP server olusturma ve stdio baglama             | is kurallari                          |
| `src/infrastructure`   | sistem bagimlilik kati      | CLI arg ayrisma, JSON dosya okuma                 | alan kararlari                        |
| `src/contracts`        | sema ve sozlesmeler         | runtime config ve tool contract tipleri           | gercek handler implementasyonlari     |
| `src/config`           | konfigurasyon sistemi       | varsayilanlar, precedence ve yukleme              | loglama veya transport                |
| `src/logging`          | yapilandirilmis loglama     | stderr logger ve log arayuzu                      | business logic                        |
| `src/security`         | izin ve koruma yardimcilari | feature flag, command/path guard                  | MCP adaptoru                          |
| `src/shared`           | ortak yardimcilar           | merge, request id, text sanitization              | domain-spesifik mantik                |
| `tests/unit`           | izole mantik testleri       | saf yardimcilar, config, security, registry       | stdio surec testleri                  |
| `tests/integration`    | bilesen birlikte calisma    | runtime ve tool pipeline                          | detayli JSON-RPC isleme               |
| `tests/protocol`       | MCP akis testleri           | connect, tools/list, tools/call                   | soyut birim testleri                  |
| `tests/fixtures`       | test destek varliklari      | ortak config fixturelari                          | production kodu                       |
| `docs/architecture`    | sistem tasarim dokumanlari  | katman sinirlari ve extension modeli              | komut referansi                       |
| `docs/tools`           | arac modeli dokumanlari     | arac adlandirma ve sema kurallari                 | CI detayi                             |
| `docs/security`        | guvenlik davranisi          | deny-by-default ve guvenli extension rehberi      | UI tarifi                             |
| `docs/configuration`   | runtime ayar dokumanlari    | tum config alanlari ve oncelik                    | release adimlari                      |
| `docs/integration`     | host entegrasyon rehberi    | VS Code ve OpenCode kullanimlari                  | gelistirici script ayrintisi          |
| `docs/developer-guide` | bakimci rehberi             | lokal gelistirme, test, release sureci            | son kullanici rehberi                 |
| `docs/user-guide`      | tuketici rehberi            | kurulum, ilk calistirma, sorun giderme            | ADR kaydi                             |
| `docs/decisions`       | mimari karar kayitlari      | kararlar ve tavizler                              | tekrar eden README metni              |
| `scripts`              | otomasyon betikleri         | kurulum ve yardimci scriptler                     | uygulama modulleri                    |
| `examples`             | referans ornekler           | config ve turetilmis arac ornekleri               | alan urunu kodu                       |
| `bin`                  | calistirilabilir girisler   | npm bin wrapper                                   | uygulama mantigi                      |

## Hizli baslangic

```bash
npm install
npm run build
node dist/index.js --config examples/mcpbase.config.json
```

## Kurulum

```bash
./scripts/install.sh
```

## Gelistirme komutlari

- `npm run build`
- `npm run lint`
- `npm run format:check`
- `npm run typecheck`
- `npm run dev`

## Test komutlari

- `npm run test`
- `npm run test:unit`
- `npm run test:integration`
- `npm run test:protocol`
- `npm run test:coverage`

## Release yaklasimi

- Conventional commit mesajlari semantic-release tarafindan analiz edilir.
- `main` dalina gelen uygun commitler yeni semver surumu olusturur.
- `CHANGELOG.md`, Git etiketi, GitHub release ve npm publish ayni akista yonetilir.

Detaylar icin `RELEASE.md` ve `docs/developer-guide/release-process.md` dosyalarina bakin.

## Gelecekte bu base nasil referans alinir

1. Bu depoyu kopyalayin, fork edin veya template olarak kullanin.
2. `package.json`, README ve `examples/` altindaki kimlikleri kendi alaniniza gore degistirin.
3. `src/application/example-tools.ts` yerine alaninizin gercek araclarini ekleyin.
4. Yeni riskli araclar icin `src/security` yardimcilari ile guard ekleyin.
5. Dokuman ve kalite kapilarini aynen koruyun.

## Lisans

MIT. Ayrinti icin `LICENSE` dosyasina bakin.

## Katki rehberleri

- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
