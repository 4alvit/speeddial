# Yerel tarayıcı yedekleme ve geri yükleme betikleri

<!-- language-navigation:start -->
<p dir="ltr">
<a href="browser-backups.md" lang="en" dir="ltr">English</a>
<a href="browser-backups.ar.md" lang="ar" dir="rtl">العربية</a>
<a href="browser-backups.bn.md" lang="bn" dir="ltr">বাংলা</a>
<a href="browser-backups.cs.md" lang="cs" dir="ltr">Čeština</a>
<a href="browser-backups.de.md" lang="de" dir="ltr">Deutsch</a>
<a href="browser-backups.es.md" lang="es" dir="ltr">Español</a>
<a href="browser-backups.fa.md" lang="fa" dir="rtl">فارسی</a>
<a href="browser-backups.fr.md" lang="fr" dir="ltr">Français</a>
<a href="browser-backups.he.md" lang="he" dir="rtl">עברית</a>
<a href="browser-backups.hi.md" lang="hi" dir="ltr">हिन्दी</a>
<a href="browser-backups.id.md" lang="id" dir="ltr">Bahasa Indonesia</a>
<a href="browser-backups.it.md" lang="it" dir="ltr">Italiano</a>
<a href="browser-backups.ja.md" lang="ja" dir="ltr">日本語</a>
<a href="browser-backups.ko.md" lang="ko" dir="ltr">한국어</a>
<a href="browser-backups.nl.md" lang="nl" dir="ltr">Nederlands</a>
<a href="browser-backups.pl.md" lang="pl" dir="ltr">Polski</a>
<a href="browser-backups.pt.md" lang="pt" dir="ltr">Português</a>
<a href="browser-backups.ru.md" lang="ru" dir="ltr">Русский</a>
<a href="browser-backups.th.md" lang="th" dir="ltr">ไทย</a>
<a href="browser-backups.tr.md" lang="tr" dir="ltr">Türkçe</a>
<a href="browser-backups.uk.md" lang="uk" dir="ltr">Українська</a>
<a href="browser-backups.vi.md" lang="vi" dir="ltr">Tiếng Việt</a>
<a href="browser-backups.zh-Hans.md" lang="zh-Hans" dir="ltr">简体中文</a>
<a href="browser-backups.zh-Hant.md" lang="zh-Hant" dir="ltr">繁體中文</a>
</p>
<!-- language-navigation:end -->

[Geçiş kılavuzu](browser-migration.md) · [Tüm dağıtım seçenekleri](../README.md#storage-and-deployment)

Bu betikler **Speed Dial panosunu** korur: sıralı bağlantılar, başlıklar, görüntülerin tüm baytları, satırlar, sütunlar, açma tercihi ve dil. Tarayıcı geçmişini, parolaları, uzantıları veya diğer yer imlerini yedeklemez. Chrome veya Firefox'un dahili veritabanlarını değil, uygulamanın taşınabilir `speedial-local-backup` JSON biçimini kullanır.

[speeddial.alvit.here.now](https://speeddial.alvit.here.now/) adresindeki tarayıcıda yerel çalışan uygulama içindir. Node.js, Docker veya k3s dağıtımlarının [sunucu yedeklerinin](../wiki/Operations.md#backup-and-restore) yerini almaz. Sunucunun eski JSON dışa aktarımı tam tarayıcı yedeği kabul edilmez; o panoyu taşımak [görüntü toplama ve dönüştürme işlemini](browser-migration.md) gerektirir.

Panonuz eski `speedial.alvit.here.now` adresindeyse önce tam o adresten dışa aktarın; betikler artık `speeddial.alvit.here.now` açar. Açık eski sekmeyle `--no-open` kullanın veya kaydedilmiş dışa aktarımı açıkça arşivleyin. Eski `speedial-local-backup` dosyaları ve `speedial-backup-*.json` indirme adları desteklenir. [Adres geçişi notlarına](local-speedial.md#corrected-address-and-existing-backups) bakın.

## Gereksinimler ve tarayıcı desteği

Bu Git çalışma kopyasından Node.js 24+ çalıştırın. Ek paket kurulumu gerekmez. macOS'ta başlatıcı `/Applications`, `~/Applications` veya `/System/Applications` altında Chrome, Firefox, Safari, Edge, Brave, Arc, Opera, Vivaldi, Chromium, Orion, Zen, LibreWolf ve Waterfox'u tanır. Bu başlatma desteğidir; her tarayıcının test edildiği iddiası değildir. Otomatik uygulama testleri Chromium, Firefox ve WebKit kullanır.

```sh
npm run backup:browser -- --list-browsers
```

Başka bir macOS tarayıcısı için `--app /absolute/path/Browser.app` kullanın. Açık bir tarayıcı, Codex'in dahili tarayıcısı, Windows veya Linux için `--no-open` kullanıp siteyi kendiniz açın. Hata ayıklama portu, uzantı, Erişilebilirlik izni veya profil dosyalarına doğrudan erişim gerekmez.

```sh
npm run backup:browser -- --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --app "/Applications/Brave Browser.app"
```

Başlatma URL'si ana adrese sabittir. Başka kökendeki pano tam o kökenden dışa aktarılmalıdır; orada `--no-open` kullanın ve hedef adresi kendiniz denetleyin. Tarayıcı depolaması yönlendirme veya ana makine adı değişimini takip etmez.

**Betikler etkileşimlidir.** Uygulamayı açıp yerel dosyaları yönetirler; dışa aktarmayı tıklayan, içe aktarılacak dosyayı seçen ve değiştirmeyi onaylayan sizsiniz. Uygulamanın birden çok profili olabilir: istenen profili seçip [speeddial.alvit.here.now](https://speeddial.alvit.here.now/) kullanın. Yeni profilin boş olması normaldir. Betik bir indirmenin hangi profilden geldiğini doğrulayamaz.

## Chrome'u yedekleme

```sh
npm run backup:browser -- --browser chrome
```

1. Mevcut Chrome profilinizi seçin, sağ üstteki oku açın ve **Export backup** tıklayın.
2. Önerilen `speedial-backup-YYYY-MM-DD.json` adıyla `~/Downloads` içine kaydedin. ` (1)` gibi ad çakışması ekleri desteklenir.
3. Betik yeni ve tamamlanmış dışa aktarımı bekler, doğrular, `backups/` içine kopyalar, kopyayı geri okur ve yolunu, sayımları, SHA-256 değerini yazdırır. Asla eski dışa aktarıma dönmez. Eşzamanlı birden çok dışa aktarım tahmin yerine hata üretir.

Tarayıcı başka yere indiriyorsa `--downloads /absolute/local/folder` kullanın; tarayıcıda aynı klasörü seçin. Bulut eşitlemesi dışında yerel klasörler seçin. Varsayılan bekleme on dakikadır; `--timeout 1200` bunu yirmiye çıkarır. Dosyanın oluşması için tarayıcının **Save As** iletişim kutusunu onaylamak gerekebilir. Yeniden adlandırılmış veya indirilmiş dışa aktarım için:

```sh
npm run backup:browser -- --file /absolute/local/export.json
```

Açıkça dosya belirtme modu o dosyayı arşivler; güncel tarayıcı verisini **almaz** ve güncelliğini kanıtlamaz. İndirme asılları tutulur. İzleyicinin topladığı dışa aktarımlar POSIX'te `0600` moduyla sınırlanır; açıkça belirtilen giriş dosyaları değiştirilmez.

## Başka tarayıcıya geri yükleme

`YOUR-BACKUP.json` yerine yazdırılan yedek dosya adını koyun:

```sh
npm run restore:browser -- backups/YOUR-BACKUP.json --browser firefox
npm run restore:browser -- backups/YOUR-BACKUP.json --browser chrome
npm run restore:browser -- backups/YOUR-BACKUP.json --browser safari
```

Geri yükleme komutu etkileşimli terminal ister ve bir seferde tek tarayıcı/profil için yol gösterir:

1. Kaynağı doğrulayıp ayrı `restore-source` kopyasını korur. Hedef profilde mevcut panoyu boş bile olsa dışa aktarın. Betik kurtarılabilir kalması için bunu `before-restore` olarak saklar.
2. Terminalde `RESTORE` yazarak dışa aktarımın doğru hedef profilden geldiğini onaylayın.
3. Aynı tarayıcıda **Import backup** tıklayın, belirtilen `restore-source` dosyasını seçin, özeti denetleyin ve **Replace this board** tıklayın. macOS dosya seçicisinde **⌘⇧G** basıp mutlak yolu yapıştırın.
4. Speed Dial'ı yeniden yükleyin, görüntüleri kontrol edin ve tekrar dışa aktarın. Betik bu `after-restore` dışa aktarımını arşivleyip sıralı bağlantıları, başlıkları, görüntü baytlarını, ızgarayı, açma tercihini ve dili kaynakla karşılaştırır. Yeniden üretilen dahili ID'ler ve zaman damgaları yok sayılır. Dil içermeyen eski yedekler hedef dili değiştirmez.

Başarı yalnızca içerik eşleşince bildirilir. Uyumsuzluk veya zaman aşımı doğrulanmış geri yükleme **değildir**. Tüm kopyalar saklanır; otomatik geri alma yoktur. Geri almak için komutu kayıtlı `before-restore` dosyasıyla tekrarlayın. Eşleşen dışa aktarımlar içerik eşitliğini kanıtlar; profil, köken ve görünür görüntülerin kontrolü yine gereklidir.

Daha sonra Chrome'a dönmek için aynı komutu `--browser chrome` ve istediğiniz kayıtlı JSON dosyasıyla kullanın. Biçim kaynak tarayıcıdan bağımsızdır. Her geri yükleme bağlantıları birleştirmek yerine tek hedef panoyu değiştirir; iki sürüm de gerekebilecekse otomatik korunan hedef kopyasını saklayın.

Komut beklerken başka sekme veya profilden dışa aktarmayın. Farklı tarayıcılar için ayrı komutlar çalıştırın. Bu tek seferlik aktarımdır; sonraki düzenlemeler eşitlenmez.

## Yalnızca yerel depolama ve doğrulama

Tüm betik çıktıları bu çalışma kopyasındaki sabit `backups/` dizinine gider. Komut Git'in dizini yok saydığını ve izlenen dosya olmadığını denetler. Sembolik bağlantı olan çıktı dizini reddedilir. Her yedek benzersiz ad alır, başka dosyayı üzerine yazmadan kaydedilir, geri okunur ve başlık veya URL içermeyen, sayımlar ve özetler taşıyan `.receipt.json` ile eşleşir. Geçersiz giriş yedek oluşturmaz. CLI uygulamanın şema, base64 ve raster başlığı doğrulamasını kullanır; hedef uygulama atomik içe aktarmadan önce görüntüleri ayrıca çözer.

Geri yüklemek için panonun `.json` dosyasını kullanın, yanındaki `.receipt.json` dosyasını değil. Makbuz doğrulama üstverisi tutar; pano geri yükleyemez. Betikler eski yedekleri veya indirme asıllarını otomatik silmez; gerekli kopyaları tutup depolamayı yerel yönetin.

macOS/Linux'ta dizin modu `0700`, dosyalar `0600` olur. Windows'ta hesabın dosya sistemi ACL'leriyle erişimi sınırlayın; POSIX modları ACL garantisi değildir. JSON yedekleri düz metindir. Betiklerde yükleme veya eşitleme kodu yoktur. Klasör Git, Docker derleme girdisi ve herkese açık ön yüz izin listesinden hariçtir. `.gitignore` zorunlu Git eklemelerini, elle paylaşmayı, OS yedeklerini veya ayrı ayarlanmış eşitleme istemcisini engellemez. Yalnızca yerel depolama için çalışma kopyasını ve indirme klasörünü eşitlenen dizinlerin dışında tutun.

Betiklere, testlere, belgelere veya herkese açık siteye pano verisi gömülmez. [Tarayıcı depolama sınırlarına](local-speedial.md#what-is-private-and-what-is-not) ve [geçiş kabulüne](browser-migration.md) bakın.
