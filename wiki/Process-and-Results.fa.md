<div lang="fa" dir="rtl">

# کد منبع، استقرار و تأیید

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

[صفحهٔ اصلی ویکی](Home.md)

مخزن عمومی `speeddial` هر دو نسخهٔ برنامه، آزمون‌ها، نمونه‌های عمومی استقرار و مستندات را در خود دارد. با تاریخچهٔ جدید Git و داده‌های آزمایشی ساختگی آغاز می‌شود. بایگانی‌های عملیاتی خصوصی، مطالب تاریخی و سوابق بازیابی استقرار را نگه می‌دارند و بدون تکثیر کد برنامه از نسخهٔ تثبیت‌شدهٔ منبع عمومی یا تصویر تغییرناپذیر استفاده می‌کنند.

[برنامهٔ محلی مرورگر](https://speeddial.alvit.here.now/) برای هر بازدیدکننده با صفحه‌ای خالی آغاز می‌شود. انتشار کد، پیوندها یا تصاویر صفحهٔ کسی را به مرورگر دیگری کپی نمی‌کند. [اسکریپت‌های پشتیبان‌گیری](../docs/browser-backups.fa.md) انتقالی آگاهانه را با کپی نجات مقصد و مقایسهٔ دقیق محتوا پس از بازیابی هدایت می‌کنند.

## فرایند استقرار

![اعتبارسنجی منبع، تمرین جداگانهٔ بازیابی، استقرار و پذیرش مراحل مجزا هستند.](images/release-process.svg)

Node.js، Docker و k3s برای نسخهٔ سرور همچنان پشتیبانی می‌شوند. نسخهٔ عمومی را تثبیت کنید، تصویر تغییرناپذیر تأییدشده‌ای بسازید یا انتخاب کنید و پیکربندی خصوصی را بیرون از این مخزن اعمال کنید. اطلاعات احراز هویت و حجم دادهٔ پایدار را از تصویر برنامه جدا نگه دارید. اگر نصب موجود به مهاجرت نیاز دارد، از [راهنمای جابه‌جایی و بازگشت](../deploy/README.md) استفاده کنید.

## مرزهای مخزن و داده‌ها

![کد منبع عمومی برنامه در استقرارهای خصوصی استفاده می‌شود؛ داده‌های شخصی مرورگر و سوابق بازیابی سرور خصوصی می‌مانند.](images/release-results.svg)

منبع عمومی هیچ صفحهٔ اولیهٔ شخصی ندارد. پشتیبان‌های محلی مرورگر در `backups/` که Git نادیده می‌گیرد می‌مانند؛ مجموعه‌های بازیابی سرور شامل SQLite، فایل‌های تصویر ارجاع‌شده و اطلاعات احراز هویت با حفاظت جداگانه هستند. این قالب‌ها برای نسخه‌های متفاوت‌اند و قابل‌جایگزینی با هم نیستند.

## تأیید

بررسی‌های محلی و CI، داده‌های آزمایشی ساختگی و سناریوهای اجراشده را اعتبارسنجی می‌کنند. هر دو نسخه، پنج زبان، کنترل‌های جمع‌شده، جابه‌جایی دوتایی، پیش‌نمایش دنبال‌کنندهٔ نشانگر، ابعاد شبکه و پیمایش در همان پنجره را به‌صورت پیش‌فرض حفظ می‌کنند.

تمرین مهاجرت سرور، شناسه‌ها، ترتیب، عنوان‌ها، URLها، تنظیمات، ارجاع تصاویر و یکپارچگی SQLite را مقایسه می‌کند. بررسی‌های چرخش احراز هویت تأیید می‌کنند که نشست‌های قدیمی پس از راه‌اندازی مجدد نامعتبر شوند. پذیرش استقرار واقعی علاوه بر این، مسیریابی موردنظر، اطلاعات احراز هویت، دسترس‌پذیری تصاویر و حفظ داده‌ها را در محیط مقصد بررسی می‌کند.

قبولی بررسی منبع اثبات نمی‌کند که استقرار یا بازیابی رخ داده است. رسیدهای استقرار واقعی و فهرست‌های شخصی را خصوصی نگه دارید. نمودارها معماری و فرایند را توصیف می‌کنند، نه تضمین عملکرد، دسترس‌پذیری یا زمان بازیابی را. منبع عمومی همچنان `UNLICENSED` باقی می‌ماند.

</div>
