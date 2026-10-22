<div lang="ar" dir="rtl">

# المصدر والنشر والتحقق

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

[صفحة Wiki الرئيسية](Home.md)

يحتوي المستودع العام `speeddial` على إصداري التطبيق والاختبارات وأمثلة النشر العامة والوثائق. يبدأ بتاريخ Git جديد وبيانات اختبار اصطناعية. تحتفظ أرشيفات التشغيل الخاصة بالمواد التاريخية وسجلات الاسترداد، وتستخدم مراجعة عامة مثبتة أو صورة غير قابلة للتغيير دون تكرار شيفرة التطبيق.

يبدأ [التطبيق المحلي داخل المتصفح](https://speeddial.alvit.here.now/) بلوحة فارغة لكل زائر. نشر الشيفرة لا ينسخ الروابط أو لقطات الشاشة الشخصية إلى متصفح آخر. ترشد [نصوص النسخ الاحتياطي](../docs/browser-backups.ar.md) إلى نقل مقصود مع نسخة إنقاذ للهدف ومقارنة دقيقة للمحتوى بعد الاستعادة.

## عملية النشر

![التحقق من المصدر وتجربة الاستعادة المعزولة والنشر والقبول مراحل منفصلة.](images/release-process.svg)

يظل إصدار الخادم يدعم Node.js وDocker وk3s. ثبّت المراجعة العامة، وابنِ أو اختر صورة ثابتة متحقّقًا منها، وطبّق الإعدادات الخاصة خارج المستودع. افصل بيانات الاعتماد ووحدة البيانات الدائمة عن صورة التطبيق. استخدم [دليل التحويل والتراجع](../deploy/README.md) عند ترحيل تثبيت موجود.

## حدود المستودع والبيانات

![مصدر التطبيق العام يخدم النشر الخاص؛ وتبقى بيانات المتصفح الشخصية وسجلات استرداد الخادم خاصة.](images/release-results.svg)

لا يحتوي المصدر العام لوحة شخصية أولية. تبقى نسخ المتصفح المحلية في `backups/` الذي يتجاهله Git؛ وتضم مجموعات استرداد الخادم SQLite وملفات الصور المشار إليها وبيانات اعتماد محمية منفصلة. تخدم الصيغ إصدارات مختلفة وليست قابلة للتبادل.

## التحقق

تتحقق الاختبارات المحلية وCI من البيانات الاصطناعية والسيناريوهات التي تنفذها. يحتفظ الإصداران بخمس لغات وعناصر تحكم مطوية وتبديل زوجي ومعاينات تتبع المؤشر وأبعاد الشبكة والتنقل في النافذة نفسها افتراضيًا.

تقارن تجربة ترحيل الخادم المعرّفات والترتيب والعناوين وروابط URL والإعدادات ومراجع الصور وسلامة SQLite. تتحقق اختبارات التدوير من فشل الجلسات القديمة بعد إعادة التشغيل. ويتحقق قبول النشر الفعلي أيضًا من التوجيه المقصود وبيانات الاعتماد وتوفر الصور وحفظ البيانات في البيئة الهدف.

اجتياز فحص المصدر لا يثبت حدوث نشر أو استعادة. احتفظ بإيصالات النشر الحقيقية والقوائم الشخصية خاصة. تصف المخططات البنية والعملية، ولا تضمن الأداء أو التوفر أو وقت الاسترداد. يظل المصدر العام `UNLICENSED`.

</div>
