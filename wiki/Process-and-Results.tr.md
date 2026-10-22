# Kaynak, dağıtım ve doğrulama

<!-- language-navigation:start -->
<p dir="ltr">
<a href="Process-and-Results.md" lang="en" dir="ltr">English</a>
<a href="Process-and-Results.ar.md" lang="ar" dir="rtl">العربية</a>
<a href="Process-and-Results.bn.md" lang="bn" dir="ltr">বাংলা</a>
<a href="Process-and-Results.cs.md" lang="cs" dir="ltr">Čeština</a>
<a href="Process-and-Results.de.md" lang="de" dir="ltr">Deutsch</a>
<a href="Process-and-Results.es.md" lang="es" dir="ltr">Español</a>
<a href="Process-and-Results.fa.md" lang="fa" dir="rtl">فارسی</a>
<a href="Process-and-Results.fr.md" lang="fr" dir="ltr">Français</a>
<a href="Process-and-Results.he.md" lang="he" dir="rtl">עברית</a>
<a href="Process-and-Results.hi.md" lang="hi" dir="ltr">हिन्दी</a>
<a href="Process-and-Results.id.md" lang="id" dir="ltr">Bahasa Indonesia</a>
<a href="Process-and-Results.it.md" lang="it" dir="ltr">Italiano</a>
<a href="Process-and-Results.ja.md" lang="ja" dir="ltr">日本語</a>
<a href="Process-and-Results.ko.md" lang="ko" dir="ltr">한국어</a>
<a href="Process-and-Results.nl.md" lang="nl" dir="ltr">Nederlands</a>
<a href="Process-and-Results.pl.md" lang="pl" dir="ltr">Polski</a>
<a href="Process-and-Results.pt.md" lang="pt" dir="ltr">Português</a>
<a href="Process-and-Results.ru.md" lang="ru" dir="ltr">Русский</a>
<a href="Process-and-Results.th.md" lang="th" dir="ltr">ไทย</a>
<a href="Process-and-Results.tr.md" lang="tr" dir="ltr">Türkçe</a>
<a href="Process-and-Results.uk.md" lang="uk" dir="ltr">Українська</a>
<a href="Process-and-Results.vi.md" lang="vi" dir="ltr">Tiếng Việt</a>
<a href="Process-and-Results.zh-Hans.md" lang="zh-Hans" dir="ltr">简体中文</a>
<a href="Process-and-Results.zh-Hant.md" lang="zh-Hant" dir="ltr">繁體中文</a>
</p>
<!-- language-navigation:end -->

[Wiki ana sayfası](Home.md)

Herkese açık `speeddial` deposu uygulamanın iki sürümünü, testleri, genel dağıtım örneklerini ve belgeleri içerir. Yeni Git geçmişi ve sentetik test verileriyle başlar. Özel işletim arşivleri tarihsel malzeme ve kurtarma kayıtlarını tutar; uygulama kodunu çoğaltmadan sabitlenmiş herkese açık kaynak kodu revizyonunu veya değişmez görüntüyü kullanır.

[Tarayıcıda yerel çalışan uygulama](https://speeddial.alvit.here.now/) her ziyaretçiye boş pano verir. Kod yayımlamak kişisel bağlantıları veya ekran görüntülerini başka tarayıcıya kopyalamaz. [Yedekleme betikleri](../docs/browser-backups.tr.md), hedefin kurtarma kopyası ve geri yüklemeden sonra tam içerik karşılaştırmasıyla bilinçli aktarımı yönlendirir.

## Dağıtım süreci

![Kaynak doğrulama, yalıtılmış kurtarma provası, dağıtım ve kabul ayrı aşamalardır.](images/release-process.svg)

Sunucu sürümü Node.js, Docker ve k3s desteğini korur. Herkese açık kaynak kodu revizyonunu sabitleyin, doğrulanmış değişmez görüntü oluşturun veya seçin ve özel yapılandırmayı depo dışında uygulayın. Kimlik bilgilerini ve kalıcı veri birimini uygulama görüntüsünden ayırın. Mevcut kurulumu taşımak için [geçiş ve geri alma kılavuzunu](../deploy/README.md) kullanın.

## Depo ve veri sınırları

![Açık uygulama kaynağı özel dağıtımları besler; kişisel tarayıcı verileri ve sunucu kurtarma kayıtları özel kalır.](images/release-results.svg)

Herkese açık kaynak kodunda kişisel başlangıç panosu yoktur. Yerel tarayıcı yedekleri Git'in yok saydığı `backups/` içinde kalır; sunucu kurtarma kümeleri SQLite, başvurulan görüntü dosyaları ve ayrı korunan kimlik bilgilerini içerir. Biçimler farklı sürümlere aittir ve birbirinin yerine kullanılamaz.

## Doğrulama

Yerel ve CI kontrolleri sentetik verileri ve çalıştırılan senaryoları doğrular. İki sürüm de beş dili, daraltılmış kontrolleri, ikili değişimi, işaretçiyi izleyen önizlemeleri, ızgara boyutlarını ve varsayılan olarak aynı pencerede gezinmeyi korur.

Sunucu geçiş provası ID'leri, sırayı, başlıkları, URL'leri, ayarları, görüntü başvurularını ve SQLite bütünlüğünü karşılaştırır. Döndürme kontrolleri yeniden başlatmadan sonra eski oturumların reddedildiğini doğrular. Gerçek dağıtım kabulü hedef ortamda beklenen yönlendirmeyi, kimlik bilgilerini, görüntü kullanılabilirliğini ve verilerin korunmasını ayrıca denetler.

Başarılı kaynak kontrolü dağıtım veya geri yükleme gerçekleştiğini kanıtlamaz. Gerçek dağıtım makbuzlarını ve kişisel envanterleri özel tutun. Diyagramlar mimariyi ve süreci açıklar; performans, kullanılabilirlik veya kurtarma süresi garantisi vermez. Herkese açık kaynak kodu `UNLICENSED` olarak kalır.
