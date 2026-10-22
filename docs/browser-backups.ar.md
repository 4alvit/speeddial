<div lang="ar" dir="rtl">

# نصوص النسخ الاحتياطي والاستعادة المحلية للمتصفح

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

[دليل الترحيل](browser-migration.md) · [جميع خيارات النشر](../README.md#storage-and-deployment)

تحفظ هذه النصوص **لوحة Speed Dial**: ترتيب الروابط والعناوين وجميع بايتات الصور والصفوف والأعمدة وتفضيل الفتح واللغة. لا تنسخ سجل المتصفح أو كلمات المرور أو الإضافات أو العلامات المرجعية الأخرى. تستخدم صيغة JSON المحمولة للتطبيق `speedial-local-backup`، لا قواعد بيانات Chrome أو Firefox الداخلية.

تعمل مع التطبيق المحلي داخل المتصفح في [speeddial.alvit.here.now](https://speeddial.alvit.here.now/). لا تحل محل [نسخ الخادم الاحتياطية](../wiki/Operations.md#backup-and-restore) لنشر Node.js أو Docker أو k3s. لا يُقبل تصدير JSON القديم للخادم نسخةً كاملة للمتصفح؛ ويتطلب نقل تلك اللوحة [جمع الصور وتحويلها](browser-migration.md).

إذا بقيت اللوحة في العنوان القديم `speedial.alvit.here.now` فصدّرها من ذلك العنوان تحديدًا أولًا؛ تفتح النصوص الآن `speeddial.alvit.here.now`. استخدم `--no-open` مع علامة التبويب القديمة المفتوحة، أو أرشف ملف تصديرها المحفوظ صراحةً. تبقى ملفات `speedial-local-backup` القديمة وأسماء التنزيل `speedial-backup-*.json` مدعومة. راجع [ملاحظات نقل العنوان](local-speedial.md#corrected-address-and-existing-backups).

## المتطلبات ودعم المتصفحات

شغّل Node.js 24+ من نسخة Git هذه. لا يلزم تثبيت حزم إضافية. على macOS يتعرف المشغّل على Chrome وFirefox وSafari وEdge وBrave وArc وOpera وVivaldi وChromium وOrion وZen وLibreWolf وWaterfox في `/Applications` أو `~/Applications` أو `/System/Applications`. هذا دعم للتشغيل، وليس ادعاءً باختبار كل متصفح. تستخدم الاختبارات الآلية للتطبيق Chromium وFirefox وWebKit.

<div dir="ltr">

```sh
npm run backup:browser -- --list-browsers
```

</div>

لمتصفح macOS آخر استخدم `--app /absolute/path/Browser.app`. ولمتصفح مفتوح مسبقًا أو المتصفح المدمج في Codex أو Windows أو Linux، استخدم `--no-open` وافتح الموقع بنفسك. لا يلزم منفذ تصحيح أو إضافة أو إذن تسهيلات الاستخدام أو وصول مباشر لملفات ملف التعريف.

<div dir="ltr">

```sh
npm run backup:browser -- --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --app "/Applications/Brave Browser.app"
```

</div>

عنوان التشغيل مثبت على العنوان الرئيسي. يجب تصدير لوحة موجودة على أصل آخر من ذلك الأصل نفسه؛ استخدم `--no-open` أثناء العمل هناك وتحقق بنفسك من عنوان الوجهة. لا ينتقل تخزين المتصفح مع إعادة التوجيه أو تغيير اسم المضيف.

**هذه النصوص تفاعلية.** تفتح التطبيق وتدير الملفات المحلية، لكنك تنقر التصدير وتختار ملف الاستيراد وتؤكد الاستبدال. قد يملك التطبيق عدة ملفات تعريف: اختر المقصود واستخدم [speeddial.alvit.here.now](https://speeddial.alvit.here.now/). من الطبيعي أن يكون ملف التعريف الجديد فارغًا. لا يستطيع النص إثبات ملف التعريف الذي أنتج التنزيل.

## النسخ الاحتياطي من Chrome

<div dir="ltr">

```sh
npm run backup:browser -- --browser chrome
```

</div>

1. اختر ملف تعريف Chrome الموجود، ووسّع السهم أعلى اليمين، ثم انقر **Export backup**.
2. احفظ بالاسم المقترح `speedial-backup-YYYY-MM-DD.json` في `~/Downloads`. تُدعم لاحقات تعارض الأسماء مثل ` (1)`.
3. ينتظر النص تصديرًا جديدًا مكتملًا، ويتحقق منه وينسخه إلى `backups/`، ثم يعيد قراءة النسخة ويطبع المسار والأعداد وSHA-256. لا يعود مطلقًا إلى تصدير قديم. تسبب التصديرات المتزامنة المتعددة خطأً بدل التخمين.

استخدم `--downloads /absolute/local/folder` إذا كان المتصفح ينزّل في مكان آخر، واختر المجلد نفسه في المتصفح. اختر مجلدات محلية خارج أدلة المزامنة السحابية. الانتظار الافتراضي عشر دقائق؛ ويغيّره `--timeout 1200` إلى عشرين دقيقة. قد يحتاج مربع **Save As** إلى تأكيد قبل وجود الملف. لتصدير أُعيدت تسميته أو نُزّل مسبقًا:

<div dir="ltr">

```sh
npm run backup:browser -- --file /absolute/local/export.json
```

</div>

وضع الملف الصريح يؤرشف ذلك الملف؛ وهو **لا** يجلب بيانات المتصفح الحالية ولا يثبت حداثتها. تبقى التنزيلات الأصلية محفوظة. تُقيّد التصديرات التي يجمعها المراقب بالوضع `0600` على POSIX، بينما لا تتغير ملفات الإدخال الصريحة.

## الاستعادة إلى متصفح آخر

استبدل `YOUR-BACKUP.json` باسم النسخة الاحتياطية المطبوع:

<div dir="ltr">

```sh
npm run restore:browser -- backups/YOUR-BACKUP.json --browser firefox
npm run restore:browser -- backups/YOUR-BACKUP.json --browser chrome
npm run restore:browser -- backups/YOUR-BACKUP.json --browser safari
```

</div>

يتطلب أمر الاستعادة طرفية تفاعلية ويرشد إلى متصفح/ملف تعريف واحد في كل مرة:

1. يتحقق من المصدر ويحفظ نسخة منفصلة `restore-source`. في ملف التعريف الهدف صدّر اللوحة الحالية حتى إن كانت فارغة. يحفظها النص باسم `before-restore` لتبقى قابلة للاسترداد.
2. أكّد في الطرفية أن التصدير من ملف التعريف الهدف الصحيح بكتابة `RESTORE`.
3. انقر **Import backup** في المتصفح نفسه، واختر ملف `restore-source` المشار إليه، وراجع الملخص، ثم انقر **Replace this board**. على macOS اضغط **⌘⇧G** في منتقي الملفات والصق المسار المطلق.
4. أعد تحميل Speed Dial، وتحقق من ظهور الصور ثم صدّر مجددًا. يؤرشف النص تصدير `after-restore` هذا ويقارن ترتيب الروابط والعناوين وبايتات الصور والشبكة وتفضيل الفتح واللغة بالمصدر. يتجاهل المعرّفات الداخلية المعاد إنشاؤها والطوابع الزمنية. تترك النسخ القديمة التي لا تحوي لغةً لغةَ الهدف دون تغيير.

لا يُعلن النجاح إلا عند تطابق المحتوى. الاختلاف أو انتهاء المهلة **ليس** استعادةً متحقّقًا منها. تُحفظ كل النسخ؛ ولا يوجد تراجع تلقائي. للتراجع، كرر الأمر باستخدام ملف `before-restore` المحفوظ. يثبت تطابق التصديرات تساوي المحتوى، لكن يبقى التحقق من ملف التعريف والأصل والصور الظاهرة ضروريًا.

للعودة إلى Chrome لاحقًا استخدم أمر الاستعادة نفسه مع `--browser chrome` وملف JSON المحفوظ المطلوب. لا تعتمد الصيغة على متصفح المصدر. تستبدل كل استعادة لوحة هدف واحدة ولا تدمج الروابط؛ احتفظ بنسخة الهدف التلقائية إن كنت قد تحتاج النسختين.

لا تصدّر من علامة تبويب أو ملف تعريف آخر أثناء انتظار أمر. شغّل أوامر منفصلة للمتصفحات المختلفة. هذا نقل لمرة واحدة؛ ولا تتزامن التعديلات اللاحقة.

## التخزين المحلي فقط والتحقق

تذهب جميع مخرجات النصوص إلى الدليل الثابت `backups/` في نسخة Git هذه. يتحقق الأمر من تجاهل Git له وعدم وجود ملفات متتبعة فيه. يُرفض دليل المخرجات إذا كان رابطًا رمزيًا. لكل نسخة اسم فريد، وتُكتب دون استبدال ملف آخر، وتُقرأ مجددًا، ويصحبها `.receipt.json` يحوي الأعداد والبصمات دون عناوين أو روابط URL. لا ينشئ الإدخال غير الصالح نسخة احتياطية. تعيد CLI استخدام تحقق التطبيق من المخطط وbase64 وترويسات الصور النقطية؛ ويفك التطبيق الهدف الصور أيضًا قبل الاستيراد الذري.

استخدم ملف اللوحة `.json` للاستعادة، لا الملف المصاحب `.receipt.json`. يسجل الإيصال بيانات التحقق الوصفية ولا يستطيع استعادة لوحة. لا تحذف النصوص النسخ القديمة أو التنزيلات الأصلية تلقائيًا؛ احتفظ بما تحتاجه وأدر تخزينه محليًا.

على macOS/Linux يكون وضع الدليل `0700` والملفات `0600`. على Windows قيّد الوصول بقوائم ACL لنظام الملفات الخاصة بالحساب؛ فأوضاع POSIX لا تضمن ACL. نسخ JSON نصوص غير مشفرة. لا تحوي النصوص شيفرة رفع أو مزامنة. يُستبعد المجلد من Git ومدخلات بناء Docker وقائمة الملفات المسموح بها للواجهة العامة. لا يمنع `.gitignore` الإضافة القسرية إلى Git أو المشاركة اليدوية أو نسخ نظام التشغيل أو عميل مزامنة مهيأ بصورة مستقلة. لإبقاء التخزين محليًا فقط ضع نسخة Git ومجلد التنزيل خارج الأدلة المتزامنة.

لا تُضمّن بيانات اللوحات في النصوص أو الاختبارات أو الوثائق أو الموقع العام. راجع [حدود تخزين المتصفح](local-speedial.md#what-is-private-and-what-is-not) و[قبول الترحيل](browser-migration.md).

</div>
