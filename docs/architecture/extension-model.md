# Genisletme Modeli

Yeni bir MCP projesi `mcpbase` uzerinden turetilirken asagidaki yol izlenir:

1. `package.json`, README ve ornek config dosyalarindaki kimligi degistirin.
2. `src/application/example-tools.ts` yerine alaniniza ait tool tanimlarini ekleyin.
3. Riskli davranis varsa `src/security/guards.ts` yanina yeni guard yardimcilari ekleyin.
4. Yeni config ihtiyaclari icin `src/contracts/runtime-config.ts` ve `src/config/load-config.ts` dosyalarini birlikte guncelleyin.
5. Testleri `tests/unit`, `tests/integration` ve `tests/protocol` katmanlarina uygun dagitin.

## Neler korunmali

- katman sinirlari
- quality gate scriptleri
- release ve Dependabot yapisi
- deny-by-default yaklasimi
- dokuman dizin yapisi

## Neler degistirilmeli

- paket adi
- README basligi ve alan aciklamalari
- ornek araclar
- guvenlik feature flag isimleri
- integration dokumanlarindaki host ornekleri
