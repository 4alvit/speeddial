<div lang="he" dir="rtl">

# קוד מקור, פריסה ואימות

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

[דף הבית של הוויקי](Home.md)

המאגר הציבורי `speeddial` מכיל את שתי מהדורות היישום, בדיקות, דוגמאות פריסה כלליות ותיעוד. הוא מתחיל בהיסטוריית Git חדשה ובנתוני בדיקה סינתטיים. ארכיונים תפעוליים פרטיים שומרים חומר היסטורי ורישומי שחזור, תוך שימוש בגרסת מקור ציבורית מוצמדת או בתמונת מערכת בלתי משתנה ללא שכפול קוד היישום.

[היישום המקומי בדפדפן](https://speeddial.alvit.here.now/) מתחיל בלוח ריק לכל מבקר. פרסום קוד אינו מעתיק קישורים או צילומי מסך אישיים לדפדפן אחר. [סקריפטי הגיבוי](../docs/browser-backups.he.md) מנחים העברה מכוונת עם עותק הצלה של היעד והשוואת תוכן מדויקת אחרי השחזור.

## תהליך הפריסה

![אימות המקור, תרגול שחזור מבודד, פריסה וקבלה הם שלבים נפרדים.](images/release-process.svg)

מהדורת השרת ממשיכה לתמוך ב־Node.js, Docker ו־k3s. הצמידו את גרסת המקור הציבורית, בנו או בחרו תמונה בלתי משתנה שאומתה, והחילו תצורה פרטית מחוץ למאגר. הפרידו פרטי גישה ואמצעי אחסון מתמיד מהתמונה של היישום. להעברת התקנה קיימת השתמשו ב[מדריך המעבר והחזרה לאחור](../deploy/README.md).

## גבולות המאגר והנתונים

![קוד היישום הציבורי משמש פריסות פרטיות; נתוני דפדפן אישיים ורישומי שחזור השרת נשארים פרטיים.](images/release-results.svg)

המקור הציבורי אינו מכיל לוח אישי התחלתי. גיבויי דפדפן מקומיים נשארים ב־`backups/` ש־Git מתעלם ממנו; ערכות שחזור השרת כוללות SQLite, קובצי תמונות שאליהם מפנים ופרטי גישה המוגנים בנפרד. הפורמטים מיועדים למהדורות שונות ואינם ניתנים להחלפה.

## אימות

בדיקות מקומיות ו־CI מאמתות נתונים סינתטיים ואת התרחישים שהן מריצות. שתי המהדורות שומרות חמש שפות, פקדים מכווצים, החלפות בזוגות, תצוגות מקדימות העוקבות אחרי המצביע, ממדי רשת וניווט באותו חלון כברירת מחדל.

תרגול העברת שרת משווה מזהים, סדר, כותרות, כתובות URL, הגדרות, הפניות לתמונות ותקינות SQLite. בדיקות החלפת הרשאות מאמתות שמושבים ישנים נכשלים אחרי הפעלה מחדש. קבלת הפריסה בפועל בודקת גם ניתוב מיועד, פרטי גישה, זמינות תמונות ושימור נתונים בסביבת היעד.

בדיקת מקור שעברה אינה מוכיחה שפריסה או שחזור התרחשו. שמרו קבלות פריסה אמיתיות ורשימות אישיות כפרטיות. התרשימים מתארים ארכיטקטורה ותהליך, לא מבטיחים ביצועים, זמינות או זמן שחזור. הקוד הציבורי נשאר `UNLICENSED`.

</div>
