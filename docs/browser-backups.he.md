<div lang="he" dir="rtl">

# סקריפטים לגיבוי ולשחזור מקומי בדפדפן

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

[מדריך העברה](browser-migration.md) · [כל אפשרויות הפריסה](../README.md#storage-and-deployment)

הסקריפטים שומרים את **לוח Speed Dial**: סדר הקישורים, כותרות, כל בתי התמונות, שורות, עמודות, העדפת פתיחה ושפה. הם אינם מגבים היסטוריית גלישה, סיסמאות, הרחבות או סימניות אחרות. הם משתמשים בפורמט JSON הנייד של היישום `speedial-local-backup`, ולא במסדי הנתונים הפנימיים של Chrome או Firefox.

הם פועלים על היישום המקומי בדפדפן בכתובת [speeddial.alvit.here.now](https://speeddial.alvit.here.now/). הם אינם מחליפים [גיבויי שרת](../wiki/Operations.md#backup-and-restore) לפריסות Node.js, Docker או k3s. יצוא JSON הישן של השרת אינו מתקבל כגיבוי דפדפן מלא; העברת לוח כזה דורשת את [תהליך איסוף התמונות והמרתן](browser-migration.md).

אם הלוח עדיין בכתובת הישנה `speedial.alvit.here.now`, ייצאו אותו תחילה מאותה כתובת בדיוק; הסקריפטים פותחים כעת את `speeddial.alvit.here.now`. השתמשו ב־`--no-open` עם הלשונית הישנה הפתוחה, או שמרו במפורש את קובץ היצוא שלה בארכיון. קובצי `speedial-local-backup` הישנים ושמות ההורדה `speedial-backup-*.json` עדיין נתמכים. ראו [הערות על שינוי הכתובת](local-speedial.md#corrected-address-and-existing-backups).

## דרישות ותמיכה בדפדפנים

הריצו Node.js 24+ מתוך עותק Git זה. אין צורך בהתקנת חבילות נוספות. ב־macOS המשגר מזהה את Chrome, Firefox, Safari, Edge, Brave, Arc, Opera, Vivaldi, Chromium, Orion, Zen, LibreWolf ו־Waterfox תחת `/Applications`, `~/Applications` או `/System/Applications`. זוהי תמיכה בהפעלה, לא טענה שכל דפדפן נבדק. בדיקות היישום האוטומטיות משתמשות ב־Chromium, Firefox ו־WebKit.

<div dir="ltr">

```sh
npm run backup:browser -- --list-browsers
```

</div>

לדפדפן macOS אחר השתמשו ב־`--app /absolute/path/Browser.app`. לדפדפן שכבר פתוח, לדפדפן המובנה ב־Codex, ל־Windows או ל־Linux, השתמשו ב־`--no-open` ופתחו את האתר בעצמכם. אין צורך ביציאת ניפוי, הרחבה, הרשאת נגישות או גישה ישירה לקובצי הפרופיל.

<div dir="ltr">

```sh
npm run backup:browser -- --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --app "/Applications/Brave Browser.app"
```

</div>

כתובת ההפעלה קבועה לכתובת הראשית. לוח קיים במקור אחר חייב להיות מיוצא מאותו מקור בדיוק; השתמשו שם ב־`--no-open` ובדקו בעצמכם את כתובת היעד. אחסון הדפדפן אינו עובר עם הפניה או שינוי שם מארח.

**הסקריפטים אינטראקטיביים.** הם פותחים את היישום ומנהלים קבצים מקומיים, אך אתם לוחצים על יצוא, בוחרים קובץ יבוא ומאשרים החלפה. ליישום יכולים להיות כמה פרופילים: בחרו את הפרופיל המיועד והשתמשו ב־[speeddial.alvit.here.now](https://speeddial.alvit.here.now/). פרופיל חדש וריק הוא מצב צפוי. הסקריפט אינו יכול לאשר איזה פרופיל יצר הורדה.

## גיבוי Chrome

<div dir="ltr">

```sh
npm run backup:browser -- --browser chrome
```

</div>

1. בחרו בפרופיל Chrome הקיים, הרחיבו את החץ בפינה הימנית העליונה ולחצו על **Export backup**.
2. שמרו בשם המוצע `speedial-backup-YYYY-MM-DD.json` בתוך `~/Downloads`. סיומות למניעת התנגשות שמות, כמו ` (1)`, נתמכות.
3. הסקריפט ממתין ליצוא חדש ומלא, מאמת אותו, מעתיק ל־`backups/`, קורא שוב את העותק ומדפיס נתיב, ספירות ו־SHA-256. הוא לעולם אינו חוזר ליצוא ישן. כמה יצואים בו־זמנית גורמים לשגיאה במקום לניחוש.

השתמשו ב־`--downloads /absolute/local/folder` אם הדפדפן מוריד למקום אחר; בחרו באותה תיקייה גם בדפדפן. בחרו תיקיות מקומיות מחוץ לסנכרון ענן. ההמתנה הרגילה היא עשר דקות; `--timeout 1200` משנה אותה לעשרים. ייתכן שצריך לאשר את חלון **Save As** בדפדפן לפני שהקובץ ייווצר. ליצוא ששמו שונה או שכבר הורד:

<div dir="ltr">

```sh
npm run backup:browser -- --file /absolute/local/export.json
```

</div>

מצב קובץ מפורש שומר את הקובץ הזה בארכיון; הוא **אינו** מביא נתוני דפדפן עכשוויים ואינו מעיד על עדכניות. ההורדות המקוריות נשמרות. יצואים שנאספו בידי המעקב מוגבלים למצב `0600` ב־POSIX; קובצי קלט שצוינו במפורש אינם משתנים.

## שחזור בדפדפן אחר

החליפו את `YOUR-BACKUP.json` בשם הגיבוי שהודפס:

<div dir="ltr">

```sh
npm run restore:browser -- backups/YOUR-BACKUP.json --browser firefox
npm run restore:browser -- backups/YOUR-BACKUP.json --browser chrome
npm run restore:browser -- backups/YOUR-BACKUP.json --browser safari
```

</div>

פקודת השחזור דורשת מסוף אינטראקטיבי ומדריכה דרך דפדפן/פרופיל אחד בכל פעם:

1. היא מאמתת ושומרת עותק נפרד `restore-source`. בפרופיל היעד ייצאו את הלוח הנוכחי, גם אם הוא ריק. הסקריפט שומר אותו כ־`before-restore` כדי שאפשר יהיה לשחזרו.
2. אשרו במסוף שהיצוא הגיע מפרופיל היעד הנכון באמצעות הקלדת `RESTORE`.
3. לחצו על **Import backup** באותו דפדפן, בחרו בקובץ `restore-source` שהודפס, בדקו את הסיכום ולחצו על **Replace this board**. ב־macOS לחצו **⌘⇧G** בבורר הקבצים והדביקו נתיב מוחלט.
4. טענו מחדש את Speed Dial, בדקו שהתמונות מוצגות וייצאו שוב. הסקריפט שומר את היצוא `after-restore` ומשווה למקור את סדר הקישורים, הכותרות, בתי התמונות, הרשת, העדפת הפתיחה והשפה. מזהים פנימיים שנוצרו מחדש וחותמות זמן אינם נכללים בהשוואה. גיבויים ישנים ללא שפה משאירים את שפת היעד ללא שינוי.

הצלחה מדווחת רק לאחר התאמת התוכן. אי־התאמה או פסק זמן **אינם** שחזור מאומת. כל העותקים נשמרים; אין חזרה אוטומטית לאחור. כדי לחזור, הריצו שוב את הפקודה עם הקובץ `before-restore` שנשמר. יצואים תואמים מוכיחים שוויון תוכן; עדיין יש לבדוק פרופיל, מקור ותמונות נראות.

כדי לחזור ל־Chrome בהמשך, השתמשו באותה פקודת שחזור עם `--browser chrome` ובקובץ JSON השמור הרצוי. הפורמט אינו תלוי בדפדפן המקור. כל שחזור מחליף לוח יעד אחד במקום למזג קישורים; שמרו את עותק היעד האוטומטי אם ייתכן שתזדקקו לשתי הגרסאות.

אל תייצאו מלשונית או מפרופיל אחרים בזמן שהפקודה ממתינה. הריצו פקודות נפרדות לדפדפנים שונים. זו העברה חד־פעמית; שינויים מאוחרים אינם מסתנכרנים.

## אחסון מקומי בלבד ואימות

כל פלטי הסקריפטים נכנסים לתיקייה הקבועה `backups/` בעותק זה. הפקודה בודקת ש־Git מתעלם ממנה ושאין בה קבצים במעקב. תיקיית פלט שהיא קישור סמלי נדחית. לכל גיבוי שם ייחודי; הוא נשמר ללא דריסה של קובץ אחר, נקרא שוב ומקבל `.receipt.json` עם ספירות ותקצירים אך ללא כותרות או כתובות URL. קלט לא תקין אינו יוצר גיבוי. ה־CLI משתמש באימות הסכמה, base64 וכותרות תמונות הרסטר של היישום; יישום היעד גם מפענח תמונות לפני היבוא האטומי.

לשחזור השתמשו בקובץ הלוח `.json`, לא בקובץ `.receipt.json` הנלווה. קבלה שומרת מטא־נתוני אימות ואינה יכולה לשחזר לוח. הסקריפטים אינם מוחקים אוטומטית גיבויים ישנים או הורדות מקוריות; שמרו עותקים נחוצים ונהלו את אחסונם מקומית.

ב־macOS/Linux מצב התיקייה הוא `0700` ושל הקבצים `0600`. ב־Windows הגבילו גישה באמצעות ACL של מערכת הקבצים לחשבון; מצבי POSIX אינם מבטיחים ACL. גיבויי JSON הם טקסט גלוי. בסקריפטים אין קוד העלאה או סנכרון. התיקייה מוחרגת מ־Git, מקלט בניית Docker ומרשימת ההרשאה של הממשק הציבורי. `.gitignore` אינו מונע הוספה כפויה ל־Git, שיתוף ידני, גיבויי מערכת או לקוח סנכרון שהוגדר בנפרד. לאחסון מקומי בלבד שמרו את עותק Git ותיקיית ההורדות מחוץ לתיקיות מסונכרנות.

נתוני לוחות אינם משולבים בסקריפטים, בדיקות, תיעוד או האתר הציבורי. ראו [מגבלות אחסון הדפדפן](local-speedial.md#what-is-private-and-what-is-not) ו[קבלת ההעברה](browser-migration.md).

</div>
