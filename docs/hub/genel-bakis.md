# Hub Yönetimli Sunucular Genel Bakış

[🇬🇧 English](../../en/hub/overview.md)

Bu belge, `@vaur94/mcpbase` içindeki Hub yönetimli sunucu desteğine genel bir bakış sağlar. Hub yönetimli sunucular, Model Bağlam Protokolü (MCP) ile tam uyumluluğu korurken yönetim araçları (Hub'lar) tarafından kolayca keşfedilecek, yapılandırılacak ve izlenecek şekilde tasarlanmıştır.

## Hub Yönetimli Sunucu Nedir?

Hub yönetimli bir sunucu, ek meta veriler ve yönetim yetenekleri sunan bir MCP sunucusudur. Standart bir MCP sunucusu araçlar, kaynaklar ve istemler sağlamaya odaklanırken, yönetimli bir sunucu şunları sağlar:

1.  **Öz-İnceleme (Introspection)**: Kendi yapısını, yeteneklerini ve sağlığını standart bir araç üzerinden tanımlama yeteneği.
2.  **Manifest Üretimi**: Sunucunun nasıl başlatılacağını ve yapılandırılacağını açıklayan makinece okunabilir bir açıklama.
3.  **Dinamik Araç Yönetimi**: Süreci yeniden başlatmadan çalışma zamanında araçları etkinleştirme, devre dışı bırakma veya gizleme desteği.
4.  **Standartlaştırılmış Ayarlar**: Bir Hub'ın ayar arayüzü oluşturmak için kullanabileceği net bir yapılandırma alanı şeması.

## Mimari Rol

`mcpbase` Hub katmanı, çekirdek `ApplicationRuntime` ile yönetim platformları arasında bir köprü görevi görür. SDK düzeyinde araç kaydı ve durum senkronizasyonu karmaşıklığını yönetmek için `ManagedMcpServer` sarmalayıcısını kullanır.

### Temel Bileşenler

- **Introspection Aracı**: Sunucu durumunu ve telemetri anlık görüntülerini döndüren yerleşik bir araç (varsayılan olarak `_mcpbase_introspect`).
- **Araç Durum Yöneticisi**: Araçların yaşam döngüsünü ve görünürlüğünü yöneterek belirli özelliklerin "yumuşak" şekilde devre dışı bırakılmasına veya gizlenmesine olanak tanır.
- **Manifest Fabrikası**: Paket bilgilerini, yetenekleri ve başlatma argümanlarını içeren standart bir hub manifesti oluşturur.
- **Ayarlar Kaydı**: Yapılandırma alanlarının Hub tarafından yönetilen ayarlara nasıl eşlendiğini tanımlar.

## Faydalar

- **Daha İyi Gözlemlenebilirlik**: Hub'lar, yerleşik telemetri tarafından yakalanan gerçek zamanlı metrikleri (gecikme, hata oranları) görüntüleyebilir.
- **Basitleştirilmiş Yapılandırma**: Otomatik ayar arayüzü üretimi, kullanıcıların JSON dosyalarını manuel olarak düzenlemek zorunda kalmaması anlamına gelir.
- **Hassas Kontrol**: Deneysel araçları gizleyin veya sorunlu olanları süreç yeniden başlatmadan devre dışı bırakın.
- **Hızlı Entegrasyon**: Standart manifestler, Hub'ların sunucunuzu sıfır manuel kurulumla "içe aktarmasını" kolaylaştırır.

Son güncelleme: 2026-03-11
