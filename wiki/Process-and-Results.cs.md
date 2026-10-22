# Zdroje, nasazení a ověření

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

[Úvod wiki](Home.md)

Veřejný repozitář `speeddial` obsahuje obě vydání aplikace, testy, obecné příklady nasazení a dokumentaci. Začíná novou historií Git a syntetickými testovacími daty. Soukromé provozní archivy uchovávají historické materiály a záznamy obnovy; používají připnutou veřejnou revizi nebo neměnný obraz bez duplikace kódu aplikace.

[Místní aplikace prohlížeče](https://speeddial.alvit.here.now/) dává každému návštěvníkovi prázdný panel. Zveřejnění kódu nekopíruje osobní odkazy ani snímky do jiného prohlížeče. [Zálohovací skripty](../docs/browser-backups.cs.md) vedou řízeným přenosem se záchrannou kopií cíle a přesným porovnáním obsahu po obnově.

## Proces nasazení

![Ověření zdrojů, izolovaná zkouška obnovy, nasazení a přijetí jsou samostatné fáze.](images/release-process.svg)

Serverová verze nadále podporuje Node.js, Docker a k3s. Připněte veřejnou revizi, sestavte nebo vyberte ověřený neměnný obraz a použijte soukromou konfiguraci mimo tento repozitář. Přihlašovací údaje a trvalý datový svazek oddělte od obrazu aplikace. Při migraci existující instalace použijte [postup přechodu a návratu](../deploy/README.md).

## Hranice repozitáře a dat

![Veřejné zdroje slouží soukromým nasazením; osobní data prohlížeče a záznamy obnovy serveru zůstávají soukromé.](images/release-results.svg)

Veřejné zdroje neobsahují osobní počáteční panel. Místní zálohy prohlížeče zůstávají v Git-ignorovaném `backups/`; serverové sady obnovy zahrnují SQLite, odkazované obrázky a samostatně chráněné přihlašovací údaje. Formáty slouží různým verzím a nelze je zaměňovat.

## Ověření

Místní a CI kontroly ověřují syntetická data a scénáře, které provádějí. Obě verze zachovávají pět jazyků, sbalené ovládání, párové výměny, náhledy sledující ukazatel, rozměry mřížky a výchozí navigaci ve stejném okně.

Zkouška migrace serveru porovnává ID, pořadí, názvy, URL, nastavení, odkazy obrázků a integritu SQLite. Kontroly rotace ověřují odmítnutí starých relací po restartu. Skutečné přijetí nasazení navíc ověřuje zamýšlené směrování, přihlašovací údaje, dostupnost obrázků a zachování dat v cílovém prostředí.

Úspěšná kontrola zdrojů nedokazuje provedené nasazení ani obnovu. Skutečná potvrzení o nasazení a osobní inventáře ponechte soukromé. Diagramy popisují architekturu a proces, nezaručují výkon, dostupnost ani dobu obnovy. Veřejný kód zůstává `UNLICENSED`.
