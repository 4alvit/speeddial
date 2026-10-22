# Skripty místní zálohy a obnovy prohlížeče

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

[Postup migrace](browser-migration.md) · [Všechny možnosti nasazení](../README.md#storage-and-deployment)

Skripty zachovají **panel Speed Dial**: pořadí odkazů, názvy, úplná obrazová data, řádky, sloupce, způsob otevírání a jazyk. Nezálohují historii, hesla, rozšíření ani ostatní záložky prohlížeče. Používají přenositelný JSON formát aplikace `speedial-local-backup`, nikoli vnitřní databáze Chrome nebo Firefoxu.

Pracují s místní aplikací prohlížeče na [speeddial.alvit.here.now](https://speeddial.alvit.here.now/). Nenahrazují [serverové zálohy](../wiki/Operations.md#backup-and-restore) pro Node.js, Docker či k3s. Starší JSON export serveru není přijat jako úplná záloha prohlížeče; přenos tohoto panelu vyžaduje [shromáždění a převod obrázků](browser-migration.md).

Pokud je panel stále na `speedial.alvit.here.now`, nejprve jej exportujte z této přesné adresy; skripty nyní otevírají `speeddial.alvit.here.now`. S již otevřeným starým panelem použijte `--no-open` nebo výslovně archivujte uložený export. Staré soubory `speedial-local-backup` i názvy stažených souborů `speedial-backup-*.json` zůstávají podporovány. Viz [poznámky ke změně adresy](local-speedial.md#corrected-address-and-existing-backups).

## Požadavky a podpora prohlížečů

Spouštějte Node.js 24+ z této pracovní kopie Git. Další balíčky nejsou potřeba. V macOS spouštěč rozpozná Chrome, Firefox, Safari, Edge, Brave, Arc, Opera, Vivaldi, Chromium, Orion, Zen, LibreWolf a Waterfox v `/Applications`, `~/Applications` nebo `/System/Applications`. Jde o podporu spuštění, ne tvrzení, že byl každý prohlížeč otestován. Automatické testy aplikace používají Chromium, Firefox a WebKit.

```sh
npm run backup:browser -- --list-browsers
```

Pro jiný prohlížeč macOS použijte `--app /absolute/path/Browser.app`. Pro již otevřený prohlížeč, vestavěný prohlížeč Codex, Windows nebo Linux použijte `--no-open` a stránku otevřete sami. Ladicí port, rozšíření, oprávnění Zpřístupnění ani přímý přístup k souborům profilu nejsou potřeba.

```sh
npm run backup:browser -- --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --app "/Applications/Brave Browser.app"
```

Spouštěcí URL je pevně nastavena na hlavní adresu. Panel na jiném originu je nutné exportovat právě odtud; použijte tam `--no-open` a sami ověřte cílovou adresu. Úložiště prohlížeče se nepřenáší přesměrováním ani změnou názvu hostitele.

**Skripty jsou interaktivní.** Otevírají aplikaci a spravují místní soubory, ale export, výběr importovaného souboru a potvrzení nahrazení provádíte vy. Aplikace může mít více profilů: vyberte zamýšlený profil a použijte [speeddial.alvit.here.now](https://speeddial.alvit.here.now/). Prázdný nový profil je očekávaný. Skript nemůže doložit, který profil vytvořil stažený soubor.

## Záloha z Chrome

```sh
npm run backup:browser -- --browser chrome
```

1. Vyberte existující profil Chrome, rozbalte šipku vpravo nahoře a klikněte na **Export backup**.
2. Uložte s navrženým názvem `speedial-backup-YYYY-MM-DD.json` do `~/Downloads`. Přípony při kolizi názvů, například ` (1)`, jsou podporovány.
3. Skript čeká na nový úplný export, ověří jej, zkopíruje do `backups/`, kopii znovu přečte a vypíše cestu, počty a SHA-256. Nikdy nepoužije starý export jako náhradu. Více současných exportů vede k chybě, nikoli k odhadování.

Stahuje-li prohlížeč jinam, použijte `--downloads /absolute/local/folder` a v prohlížeči vyberte stejnou složku. Volte místní složky mimo cloudovou synchronizaci. Výchozí čekání je deset minut; `--timeout 1200` je změní na dvacet. Dialog prohlížeče **Save As** může před vytvořením souboru vyžadovat potvrzení. Pro přejmenovaný nebo již stažený export:

```sh
npm run backup:browser -- --file /absolute/local/export.json
```

Režim explicitního souboru archivuje tento soubor; **nezískává** aktuální data prohlížeče ani nedokládá jejich čerstvost. Původní stažené soubory zůstávají zachovány. Exporty zachycené sledovačem dostávají na POSIX režim `0600`; explicitní vstupní soubory se nemění.

## Obnova v jiném prohlížeči

Nahraďte `YOUR-BACKUP.json` vypsaným názvem zálohy:

```sh
npm run restore:browser -- backups/YOUR-BACKUP.json --browser firefox
npm run restore:browser -- backups/YOUR-BACKUP.json --browser chrome
npm run restore:browser -- backups/YOUR-BACKUP.json --browser safari
```

Příkaz obnovy vyžaduje interaktivní terminál a provádí vás vždy jedním prohlížečem/profilem:

1. Ověří a zachová samostatnou kopii `restore-source`. V cílovém profilu exportujte současný panel, i když je prázdný. Skript jej uloží jako `before-restore`, aby jej bylo možné obnovit.
2. Zadáním `RESTORE` do terminálu potvrďte, že export pochází ze správného cílového profilu.
3. Ve stejném prohlížeči klikněte na **Import backup**, vyberte vypsaný soubor `restore-source`, zkontrolujte souhrn a klikněte na **Replace this board**. V macOS stiskněte ve výběru souboru **⌘⇧G** a vložte absolutní cestu.
4. Znovu načtěte Speed Dial, zkontrolujte obrázky a opět exportujte. Skript tento export `after-restore` archivuje a porovná se zdrojem pořadí odkazů, názvy, obrazové bajty, mřížku, způsob otevírání a jazyk. Nově vytvořená interní ID a časové značky ignoruje. Staré zálohy bez jazyka ponechají cílový jazyk beze změny.

Úspěch je oznámen až při shodě obsahu. Neshoda nebo vypršení času **není** ověřená obnova. Všechny kopie zůstávají; automatický návrat neexistuje. Pro návrat opakujte příkaz s uloženým souborem `before-restore`. Shodné exporty dokazují rovnost obsahu; profil, origin a zobrazení obrázků je stále nutné zkontrolovat.

Při pozdějším návratu do Chrome použijte stejný příkaz s `--browser chrome` a požadovaným uloženým JSON souborem. Formát nezávisí na zdrojovém prohlížeči. Každá obnova nahrazuje jeden cílový panel, neslučuje odkazy; ponechte automatickou kopii cíle, mohou-li být potřeba obě verze.

Během čekání příkazu neexportujte z jiné karty nebo profilu. Pro různé prohlížeče spouštějte samostatné příkazy. Jde o jednorázový přenos; další změny se nesynchronizují.

## Pouze místní úložiště a ověřování

Veškeré výstupy jdou do pevného adresáře `backups/` této pracovní kopie. Příkaz ověří, že jej Git ignoruje a že neobsahuje sledované soubory. Výstupní adresář ve formě symbolického odkazu odmítne. Každá záloha dostane jedinečný název, zapíše se bez přepsání jiného souboru, znovu přečte a má doprovodný `.receipt.json` s počty a otisky, bez názvů a URL. Neplatný vstup nevytvoří zálohu. CLI sdílí s aplikací validaci schématu, base64 a rastrových hlaviček; cílová aplikace navíc před atomickým importem obrázky dekóduje.

Pro obnovu použijte soubor panelu `.json`, nikoli doprovodný `.receipt.json`. Potvrzení obsahuje metadata ověření a panel obnovit nedokáže. Skripty automaticky nemažou staré zálohy ani původní stažené soubory; potřebné kopie ponechte a jejich úložiště spravujte místně.

V macOS/Linux má adresář režim `0700` a soubory `0600`. Ve Windows omezte přístup pomocí ACL souborového systému pro účet; režimy POSIX nezaručují ACL. JSON zálohy jsou nešifrované. Skripty nemají kód pro odesílání ani synchronizaci. Složka je vyloučena z Git, vstupu sestavení Docker a seznamu povolených veřejných frontendových souborů. `.gitignore` nebrání vynucenému přidání do Git, ručnímu sdílení, zálohám OS ani samostatně nastavenému synchronizačnímu klientovi. Pro výhradně místní ukládání držte pracovní kopii a složku stahování mimo synchronizované adresáře.

V skriptech, testech, dokumentaci ani veřejném webu nejsou vložena data panelů. Viz [omezení úložiště prohlížeče](local-speedial.md#what-is-private-and-what-is-not) a [přijetí migrace](browser-migration.md).
