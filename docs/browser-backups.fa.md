<div lang="fa" dir="rtl">

# اسکریپت‌های محلی پشتیبان‌گیری و بازیابی مرورگر

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

[راهنمای عملیاتی مهاجرت](browser-migration.md) · [همهٔ گزینه‌های استقرار](../README.md#storage-and-deployment)

این اسکریپت‌ها **صفحهٔ Speed Dial** را حفظ می‌کنند: پیوندها با ترتیبشان، عنوان‌ها، تمام بایت‌های تصاویر، ردیف‌ها، ستون‌ها، تنظیم بازکردن و زبان. تاریخچهٔ مرورگر، گذرواژه‌ها، افزونه‌ها یا نشانک‌های نامرتبط پشتیبان‌گیری نمی‌شوند. اسکریپت‌ها از قالب JSON قابل‌انتقال `speedial-local-backup` برنامه استفاده می‌کنند، نه از پایگاه‌های دادهٔ داخلی Chrome یا Firefox.

آن‌ها روی برنامهٔ محلی مرورگر در [speeddial.alvit.here.now](https://speeddial.alvit.here.now/) کار می‌کنند. جایگزین [پشتیبان‌های سرور](../wiki/Operations.md#backup-and-restore) برای استقرارهای Node.js، Docker یا k3s نیستند. خروجی JSON قدیمی سرور به‌عنوان پشتیبان کامل مرورگر پذیرفته نمی‌شود؛ انتقال آن صفحه به [روش گردآوری و تبدیل تصاویر](browser-migration.md) نیاز دارد.

اگر صفحهٔ شما هنوز در نشانی قدیمی `speedial.alvit.here.now` است، ابتدا دقیقاً از همان نشانی خروجی بگیرید؛ این اسکریپت‌ها اکنون `speeddial.alvit.here.now` را باز می‌کنند. از `--no-open` همراه برگهٔ قدیمیِ ازپیش‌بازشده استفاده کنید، یا خروجی ذخیره‌شدهٔ آن را صریحاً بایگانی کنید. فایل‌های قدیمی `speedial-local-backup` و نام‌های دانلود `speedial-backup-*.json` همچنان پشتیبانی می‌شوند. [یادداشت‌های مهاجرت نشانی](local-speedial.md#corrected-address-and-existing-backups) را ببینید.

## پیش‌نیازها و پشتیبانی مرورگر

Node.js 24+ را از همین نسخهٔ کاری Git اجرا کنید. نصب بستهٔ اضافی لازم نیست. در macOS، راه‌انداز Chrome، Firefox، Safari، Edge، Brave، Arc، Opera، Vivaldi، Chromium، Orion، Zen، LibreWolf و Waterfox را در `/Applications`، `~/Applications` یا `/System/Applications` شناسایی می‌کند. این پشتیبانیِ راه‌انداز است و به معنی آزمایش‌شدن تک‌تک این مرورگرها نیست. پوشش خودکار برنامه از Chromium، Firefox و WebKit استفاده می‌کند.

<div dir="ltr">

```sh
npm run backup:browser -- --list-browsers
```

</div>

برای مرورگر دیگری در macOS از `--app /absolute/path/Browser.app` استفاده کنید. برای مرورگر ازپیش‌بازشده، مرورگر درون‌برنامه‌ای Codex، Windows یا Linux، از `--no-open` استفاده کنید و خودتان سایت را باز کنید. به درگاه اشکال‌زدایی، افزونه، مجوز Accessibility یا دسترسی مستقیم به فایل‌های پروفایل نیازی نیست.

<div dir="ltr">

```sh
npm run backup:browser -- --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --app "/Applications/Brave Browser.app"
```

</div>

URL راه‌اندازی روی نشانی اصلی ثابت است. صفحهٔ موجود در مبدأی دیگر باید دقیقاً از همان مبدأ صادر شود؛ هنگام کار در آنجا از `--no-open` استفاده کنید و نشانی مقصد موردنظر را خودتان بررسی کنید. حافظهٔ مرورگر با تغییر مسیر یا تغییر نام میزبان منتقل نمی‌شود.

**این اسکریپت‌ها تعاملی هستند.** برنامه را باز می‌کنند و فایل‌های محلی را مدیریت می‌کنند، اما شما روی صدور کلیک می‌کنید، فایل ورود را انتخاب می‌کنید و جایگزینی را تأیید می‌کنید. یک برنامه ممکن است چند پروفایل داشته باشد: پروفایل موردنظر را انتخاب کنید و از [speeddial.alvit.here.now](https://speeddial.alvit.here.now/) استفاده کنید. خالی‌بودن پروفایل جدید طبیعی است. اسکریپت نمی‌تواند تأیید کند کدام پروفایل دانلود را تولید کرده است.

## پشتیبان‌گیری از Chrome

<div dir="ltr">

```sh
npm run backup:browser -- --browser chrome
```

</div>

1. پروفایل موجود Chrome را انتخاب کنید، پیکان بالا سمت راست را باز کنید و روی **Export backup** کلیک کنید.
2. با نام پیشنهادی `speedial-backup-YYYY-MM-DD.json` در `~/Downloads` ذخیره کنید. پسوندهای رفع تداخل مانند ` (1)` پشتیبانی می‌شوند.
3. اسکریپت منتظر خروجی جدید و کامل می‌ماند، آن را اعتبارسنجی می‌کند، در `backups/` کپی می‌کند، کپی را دوباره می‌خواند و مسیر، تعدادها و SHA-256 آن را چاپ می‌کند. هرگز به خروجی قدیمی رجوع نمی‌کند. چند خروجی هم‌زمان به‌جای حدس‌زدن باعث خطا می‌شوند.

اگر مرورگر جای دیگری دانلود می‌کند از `--downloads /absolute/local/folder` استفاده کنید؛ همان پوشه را در مرورگر انتخاب کنید. پوشه‌های محلی بیرون از مسیرهای همگام‌سازی ابری را برگزینید. انتظار پیش‌فرض ده دقیقه است؛ `--timeout 1200` آن را به بیست دقیقه تغییر می‌دهد. ممکن است پیش از ایجاد فایل، تأیید پنجرهٔ **Save As** مرورگر لازم باشد. برای خروجی تغییرنام‌یافته یا ازپیش‌دانلودشده:

<div dir="ltr">

```sh
npm run backup:browser -- --file /absolute/local/export.json
```

</div>

حالت تعیین صریح فایل همان فایل را بایگانی می‌کند؛ داده‌های فعلی مرورگر را دریافت **نمی‌کند** و تازگی آن‌ها را اثبات نمی‌کند. دانلودهای اصلی حفظ می‌شوند. خروجی‌های گردآوری‌شده توسط پایشگر در POSIX به حالت `0600` محدود می‌شوند؛ فایل‌های ورودی صریح بدون تغییر باقی می‌مانند.

## بازیابی در مرورگری دیگر

`YOUR-BACKUP.json` را با نام فایل پشتیبان چاپ‌شده جایگزین کنید:

<div dir="ltr">

```sh
npm run restore:browser -- backups/YOUR-BACKUP.json --browser firefox
npm run restore:browser -- backups/YOUR-BACKUP.json --browser chrome
npm run restore:browser -- backups/YOUR-BACKUP.json --browser safari
```

</div>

فرمان بازیابی به ترمینال تعاملی نیاز دارد و هر بار یک مرورگر/پروفایل را هدایت می‌کند:

1. یک کپی جداگانهٔ `restore-source` را اعتبارسنجی و حفظ می‌کند. در پروفایل مقصد، از صفحهٔ فعلی حتی اگر خالی است خروجی بگیرید. اسکریپت آن را با نام `before-restore` ذخیره می‌کند تا صفحه همچنان قابل‌بازیابی باشد.
2. با نوشتن `RESTORE` در ترمینال تأیید کنید که خروجی از پروفایل مقصد درست گرفته شده است.
3. در همان مرورگر روی **Import backup** کلیک کنید، فایل `restore-source` چاپ‌شده را انتخاب کنید، خلاصه را بررسی کنید و سپس روی **Replace this board** کلیک کنید. در macOS، در انتخابگر فایل **⌘⇧G** را فشار دهید و مسیر مطلق فایل را بچسبانید.
4. Speed Dial را دوباره بارگیری کنید، نمایش تصاویر را بررسی کنید و دوباره خروجی بگیرید. اسکریپت این خروجی `after-restore` را بایگانی می‌کند و پیوندهای مرتب، عنوان‌ها، بایت‌های تصاویر، شبکه، تنظیم بازکردن و زبان را با منبع مقایسه می‌کند. شناسه‌های داخلی و زمان‌های دوباره‌تولیدشده نادیده گرفته می‌شوند. پشتیبان‌های قدیمیِ بدون زبان، زبان مقصد را تغییر نمی‌دهند.

موفقیت فقط پس از تطبیق محتوا گزارش می‌شود. عدم تطابق یا پایان مهلت، بازیابی تأییدشده **نیست**. همهٔ کپی‌ها نگهداری می‌شوند؛ بازگشت خودکار وجود ندارد. برای بازگشت، فرمان را با فایل ذخیره‌شدهٔ `before-restore` تکرار کنید. خروجی‌های یکسان برابری محتوا را اثبات می‌کنند؛ بررسی پروفایل، مبدأ و تصاویر قابل‌مشاهده همچنان ضروری است.

برای بازگشت بعدی به Chrome از همان فرمان بازیابی با `--browser chrome` و فایل JSON ذخیره‌شدهٔ موردنظر استفاده کنید. قالب به مرورگر مبدأ وابسته نیست. هر بازیابی یک صفحهٔ مقصد را جایگزین می‌کند، نه اینکه پیوندهایش را ادغام کند؛ اگر ممکن است هر دو نسخه لازم شوند، کپی مقصد را که خودکار حفظ شده نگه دارید.

هنگامی که فرمانی منتظر است، از برگه یا پروفایل دیگری خروجی نگیرید. برای مرورگرهای جدا فرمان‌های جدا اجرا کنید. این انتقال یک‌باره است؛ ویرایش‌های بعدی همگام نمی‌شوند.

## ذخیره‌سازی صرفاً محلی و اعتبارسنجی

تمام خروجی اسکریپت‌ها به پوشهٔ ثابت `backups/` در همین نسخهٔ کاری می‌رود. فرمان بررسی می‌کند که Git آن را نادیده بگیرد و فایل ردیابی‌شده‌ای در آن نباشد. پوشهٔ خروجیِ پیوند نمادین رد می‌شود. هر پشتیبان نام یکتا دارد، بدون بازنویسی فایل دیگری ثبت می‌شود، دوباره خوانده می‌شود و یک `.receipt.json` با تعدادها و چکیده‌ها، اما بدون عنوان یا URL دارد. ورودی نامعتبر پشتیبان ایجاد نمی‌کند. CLI از اعتبارسنجی طرح‌واره، base64 و سرآیند تصویر رستریِ برنامه استفادهٔ مجدد می‌کند؛ برنامهٔ مقصد پیش از ورود اتمی، تصاویر را نیز رمزگشایی می‌کند.

برای بازیابی از فایل `.json` صفحه استفاده کنید، نه فایل همراه `.receipt.json`. رسید، فرادادهٔ اعتبارسنجی را ثبت می‌کند و نمی‌تواند صفحه را بازیابی کند. اسکریپت‌ها پشتیبان‌های قدیمی یا دانلودهای اصلی را خودکار حذف نمی‌کنند؛ کپی‌های لازم را نگه دارید و فضای ذخیرهٔ آن‌ها را محلی مدیریت کنید.

در macOS/Linux، حالت پوشه `0700` و فایل‌ها `0600` است. در Windows، دسترسی را با ACLهای فایل‌سیستم حساب محدود کنید؛ حالت‌های POSIX تضمین ACL نیستند. پشتیبان‌های JSON متن ساده هستند. اسکریپت‌ها کد بارگذاری یا همگام‌سازی ندارند. پوشه از Git، ورودی ساخت Docker و فهرست مجاز فرانت‌اند عمومی خارج شده است. `.gitignore` مانع افزودن اجباری به Git، اشتراک‌گذاری دستی، پشتیبان‌گیری سیستم‌عامل یا سرویس همگام‌سازی مستقل نمی‌شود. برای ذخیره‌سازی صرفاً محلی، نسخهٔ کاری و پوشهٔ دانلود را بیرون از مسیرهای همگام‌شده نگه دارید.

هیچ دادهٔ صفحه‌ای در اسکریپت‌ها، آزمون‌ها، مستندات یا سایت عمومی جاسازی نشده است. [محدودیت‌های ذخیره‌سازی مرورگر](local-speedial.md#what-is-private-and-what-is-not) و [پذیرش مهاجرت](browser-migration.md) را ببینید.

</div>
