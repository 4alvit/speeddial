# Джерела, розгортання та перевірка

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

[Початок Wiki](Home.md)

Публічний репозиторій `speeddial` містить обидві версії застосунку, тести, загальні приклади розгортання й документацію. Він починається з нової історії Git і синтетичних тестових даних. Закриті експлуатаційні архіви зберігають історичні матеріали та записи відновлення, використовуючи закріплену публічну ревізію або незмінний образ без дублювання коду застосунку.

[Локальний браузерний застосунок](https://speeddial.alvit.here.now/) починає для кожного відвідувача з порожньої панелі. Публікація коду не копіює особисті посилання чи знімки до іншого браузера. [Скрипти резервного копіювання](../docs/browser-backups.uk.md) проводять свідоме перенесення з рятувальною копією призначення й точним порівнянням вмісту після відновлення.

## Процес розгортання

![Перевірка джерел, ізольована репетиція відновлення, розгортання й приймання — окремі етапи.](images/release-process.svg)

Серверна версія підтримує Node.js, Docker і k3s. Закріпіть публічну ревізію, зберіть або виберіть перевірений незмінний образ і застосуйте приватну конфігурацію поза репозиторієм. Тримайте облікові дані й постійний том даних окремо від образу застосунку. Для міграції наявної інсталяції використовуйте [посібник перемикання й відкоту](../deploy/README.md).

## Межі репозиторію та даних

![Публічний код забезпечує приватні розгортання; особисті дані браузера та записи відновлення сервера залишаються приватними.](images/release-results.svg)

Публічні джерела не містять особистої початкової панелі. Локальні копії браузера залишаються в ігнорованому Git каталозі `backups/`; серверні набори відновлення містять SQLite, пов'язані зображення та окремо захищені облікові дані. Ці формати призначені для різних версій і не взаємозамінні.

## Перевірка

Локальні тести й CI перевіряють синтетичні дані та виконувані сценарії. Обидві версії зберігають п'ять мов, згорнуті елементи керування, попарний обмін, попередній перегляд за вказівником, розміри сітки та типову навігацію в тому самому вікні.

Репетиція серверної міграції порівнює ID, порядок, назви, URL, налаштування, посилання на зображення й цілісність SQLite. Перевірки ротації підтверджують відмову старих сеансів після перезапуску. Фактичне приймання розгортання додатково перевіряє потрібну маршрутизацію, облікові дані, доступність зображень і збереження даних у цільовому середовищі.

Успішна перевірка джерел не доводить виконання розгортання чи відновлення. Тримайте фактичні звіти й особисті переліки приватними. Діаграми описують архітектуру й процес, а не гарантують продуктивність, доступність чи час відновлення. Публічний код залишається `UNLICENSED`.
