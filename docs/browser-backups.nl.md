# Scripts voor lokale browserback-ups en herstel

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

[Migratiehandleiding](browser-migration.md) · [Alle implementatieopties](../README.md#storage-and-deployment)

Deze scripts bewaren het **Speed Dial-bord**: geordende links, titels, volledige afbeeldingsbytes, rijen, kolommen, openingsvoorkeur en taal. Ze bewaren geen browsergeschiedenis, wachtwoorden, extensies of andere bladwijzers. Ze gebruiken het draagbare JSON-formaat `speedial-local-backup` van de app, niet de interne databases van Chrome of Firefox.

Ze werken met de browserlokale app op [speeddial.alvit.here.now](https://speeddial.alvit.here.now/). Ze vervangen geen [serverback-ups](../wiki/Operations.md#backup-and-restore) voor Node.js, Docker of k3s. De oudere JSON-export van de server geldt niet als volledige browserback-up; voor overdracht daarvan is de [procedure voor afbeeldingen verzamelen en omzetten](browser-migration.md) nodig.

Staat uw bord nog op `speedial.alvit.here.now`, exporteer dan eerst vanaf dat exacte adres; de scripts openen nu `speeddial.alvit.here.now`. Gebruik `--no-open` met het reeds geopende oude tabblad, of archiveer de opgeslagen export expliciet. Oude `speedial-local-backup`-bestanden en downloadnamen `speedial-backup-*.json` blijven ondersteund. Zie de [uitleg over adresmigratie](local-speedial.md#corrected-address-and-existing-backups).

## Vereisten en browserondersteuning

Voer Node.js 24+ uit vanuit deze Git-checkout. Extra pakketten installeren is niet nodig. Op macOS herkent de starter Chrome, Firefox, Safari, Edge, Brave, Arc, Opera, Vivaldi, Chromium, Orion, Zen, LibreWolf en Waterfox onder `/Applications`, `~/Applications` of `/System/Applications`. Dit betreft starten, niet de bewering dat iedere browser getest is. Automatische apptests gebruiken Chromium, Firefox en WebKit.

```sh
npm run backup:browser -- --list-browsers
```

Gebruik voor een andere macOS-browser `--app /absolute/path/Browser.app`. Gebruik voor een geopende browser, de ingebouwde Codex-browser, Windows of Linux `--no-open` en open zelf de website. Een debugpoort, extensie, toegankelijkheidstoestemming of directe toegang tot profielbestanden is niet nodig.

```sh
npm run backup:browser -- --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --app "/Applications/Brave Browser.app"
```

De start-URL ligt vast op het hoofdadres. Een bestaand bord op een andere oorsprong moet vanaf precies die oorsprong geëxporteerd worden; gebruik daar `--no-open` en controleer zelf het doeladres. Browseropslag volgt geen omleiding of wijziging van hostnaam.

**Deze scripts zijn interactief.** Ze openen de app en beheren lokale bestanden, maar u klikt op exporteren, kiest het importbestand en bevestigt vervanging. Een toepassing kan meerdere profielen hebben: kies het bedoelde profiel en gebruik [speeddial.alvit.here.now](https://speeddial.alvit.here.now/). Een leeg nieuw profiel is normaal. Het script kan niet bevestigen welk profiel een download heeft gemaakt.

## Chrome back-uppen

```sh
npm run backup:browser -- --browser chrome
```

1. Kies uw bestaande Chrome-profiel, klap de pijl rechtsboven open en klik op **Export backup**.
2. Bewaar met de voorgestelde naam `speedial-backup-YYYY-MM-DD.json` in `~/Downloads`. Achtervoegsels bij gelijke namen, zoals ` (1)`, worden ondersteund.
3. Het script wacht op een nieuwe volledige export, valideert die, kopieert naar `backups/`, leest de kopie terug en toont pad, aantallen en SHA-256. Het valt nooit terug op een oude export. Meerdere gelijktijdige exports geven een fout in plaats van een gok.

Gebruik `--downloads /absolute/local/folder` als de browser elders downloadt; kies in de browser dezelfde map. Kies lokale mappen buiten cloudsynchronisatie. De standaardwachttijd is tien minuten; `--timeout 1200` maakt daar twintig van. Een browservenster **Save As** kan bevestiging vereisen voordat het bestand bestaat. Voor een hernoemde of al gedownloade export:

```sh
npm run backup:browser -- --file /absolute/local/export.json
```

De expliciete bestandsmodus archiveert dat bestand; die haalt **geen** actuele browsergegevens op en bewijst niet dat ze actueel zijn. Originele downloads blijven bewaard. Door de bewaker verzamelde exports krijgen onder POSIX modus `0600`; expliciete invoerbestanden blijven ongewijzigd.

## Herstellen in een andere browser

Vervang `YOUR-BACKUP.json` door de getoonde back-upnaam:

```sh
npm run restore:browser -- backups/YOUR-BACKUP.json --browser firefox
npm run restore:browser -- backups/YOUR-BACKUP.json --browser chrome
npm run restore:browser -- backups/YOUR-BACKUP.json --browser safari
```

De herstelopdracht vereist een interactieve terminal en begeleidt één browser/profiel tegelijk:

1. Ze valideert en bewaart een aparte `restore-source`-kopie. Exporteer in het doelprofiel het huidige bord, ook als het leeg is. Het script bewaart dit als `before-restore`, zodat het herstelbaar blijft.
2. Bevestig in de terminal dat de export uit het juiste doelprofiel komt door `RESTORE` te typen.
3. Klik in diezelfde browser op **Import backup**, kies het getoonde `restore-source`-bestand, controleer het overzicht en klik op **Replace this board**. Druk op macOS in de bestandskiezer op **⌘⇧G** en plak het absolute pad.
4. Herlaad Speed Dial, controleer de afbeeldingen en exporteer opnieuw. Het script archiveert deze `after-restore`-export en vergelijkt geordende links, titels, afbeeldingsbytes, raster, openingsvoorkeur en taal met de bron. Opnieuw gegenereerde interne IDs en tijdstempels tellen niet mee. Oude back-ups zonder taal behouden de doeltaal.

Succes wordt pas gemeld als de inhoud overeenkomt. Een verschil of time-out is **geen** geverifieerd herstel. Alle kopieën blijven bewaard; er is geen automatische terugdraaiing. Herhaal om terug te draaien de opdracht met het bewaarde `before-restore`-bestand. Gelijke exports bewijzen inhoudsgelijkheid; profiel, oorsprong en zichtbare afbeeldingen moeten nog steeds gecontroleerd worden.

Gebruik om later terug te keren naar Chrome dezelfde herstelopdracht met `--browser chrome` en het gewenste bewaarde JSON-bestand. Het formaat is onafhankelijk van de bronbrowser. Elk herstel vervangt één doelbord, in plaats van links samen te voegen; bewaar de automatisch gemaakte doelkopie als beide versies nodig kunnen zijn.

Exporteer niet vanuit een ander tabblad of profiel terwijl een opdracht wacht. Gebruik afzonderlijke opdrachten voor verschillende browsers. Dit is een eenmalige overdracht; latere wijzigingen synchroniseren niet.

## Uitsluitend lokale opslag en validatie

Alle scriptuitvoer gaat naar de vaste map `backups/` in deze checkout. De opdracht controleert dat Git die negeert en dat er geen gevolgde bestanden zijn. Een uitvoermap die een symbolische koppeling is wordt geweigerd. Elke back-up krijgt een unieke naam, wordt opgeslagen zonder andere bestanden te overschrijven, teruggelezen en voorzien van een `.receipt.json` met aantallen en controlesommen, zonder titels of URLs. Ongeldige invoer maakt geen back-up. De CLI hergebruikt de schema-, base64- en rasterheadercontrole van de app; de doelapp decodeert afbeeldingen bovendien vóór de atomaire import.

Gebruik voor herstel het `.json`-bordbestand, niet de bijbehorende `.receipt.json`. Een ontvangstbewijs bevat verificatiemetagegevens en kan geen bord herstellen. Scripts verwijderen oude back-ups of originele downloads niet automatisch; bewaar benodigde kopieën en beheer de opslag lokaal.

Op macOS/Linux heeft de map modus `0700` en bestanden `0600`. Beperk op Windows toegang met bestandssysteem-ACLs voor het account; POSIX-modi garanderen geen ACLs. JSON-back-ups zijn onversleutelde tekst. De scripts bevatten geen upload- of synchronisatiecode. De map is uitgesloten van Git, Docker-bouwinvoer en de toegestane bestanden van de openbare frontend. `.gitignore` verhindert geen geforceerde Git-toevoegingen, handmatig delen, OS-back-ups of apart ingestelde synchronisatieclient. Houd voor uitsluitend lokale opslag checkout en downloadmap buiten gesynchroniseerde mappen.

Scripts, tests, documentatie en de openbare site bevatten geen bordgegevens. Zie [beperkingen van browseropslag](local-speedial.md#what-is-private-and-what-is-not) en [migratieacceptatie](browser-migration.md).
