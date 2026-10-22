# Skripte für lokale Browser-Sicherung und Wiederherstellung

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

[Migrationsanleitung](browser-migration.md) · [Alle Bereitstellungsarten](../README.md#storage-and-deployment)

Diese Skripte sichern das **Speed-Dial-Board**: geordnete Links, Titel, vollständige Bilddaten, Zeilen, Spalten, Öffnungsverhalten und Sprache. Browserverlauf, Passwörter, Erweiterungen und andere Lesezeichen werden nicht gesichert. Sie verwenden das portable JSON-Format `speedial-local-backup` der App, nicht die internen Datenbanken von Chrome oder Firefox.

Sie arbeiten mit der browserlokalen App unter [speeddial.alvit.here.now](https://speeddial.alvit.here.now/). Sie ersetzen keine [Serversicherungen](../wiki/Operations.md#backup-and-restore) für Node.js, Docker oder k3s. Der ältere JSON-Export des Servers gilt nicht als vollständige Browsersicherung; für dessen Übertragung ist das [Sammeln und Konvertieren der Bilder](browser-migration.md) erforderlich.

Liegt Ihr Board noch unter `speedial.alvit.here.now`, exportieren Sie zuerst genau dort; die Skripte öffnen jetzt `speeddial.alvit.here.now`. Verwenden Sie `--no-open` mit dem bereits geöffneten alten Tab oder archivieren Sie dessen gespeicherten Export ausdrücklich. Alte `speedial-local-backup`-Dateien und Downloadnamen `speedial-backup-*.json` bleiben unterstützt. Siehe [Hinweise zum Adresswechsel](local-speedial.md#corrected-address-and-existing-backups).

## Voraussetzungen und Browserunterstützung

Führen Sie Node.js 24+ aus diesem Git-Checkout aus. Zusätzliche Pakete sind nicht erforderlich. Unter macOS erkennt der Starter Chrome, Firefox, Safari, Edge, Brave, Arc, Opera, Vivaldi, Chromium, Orion, Zen, LibreWolf und Waterfox in `/Applications`, `~/Applications` oder `/System/Applications`. Das beschreibt die Startunterstützung, nicht die Prüfung jedes Browsers. Automatisierte App-Tests verwenden Chromium, Firefox und WebKit.

```sh
npm run backup:browser -- --list-browsers
```

Für andere macOS-Browser verwenden Sie `--app /absolute/path/Browser.app`. Für einen bereits geöffneten Browser, den integrierten Codex-Browser, Windows oder Linux verwenden Sie `--no-open` und öffnen die Website selbst. Weder Debugging-Port noch Erweiterung, Bedienungshilfen-Freigabe oder direkter Zugriff auf Profildateien sind nötig.

```sh
npm run backup:browser -- --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --app "/Applications/Brave Browser.app"
```

Die Start-URL ist auf die Hauptadresse festgelegt. Ein Board auf einem anderen Origin muss genau dort exportiert werden; verwenden Sie dabei `--no-open` und prüfen Sie selbst die Zieladresse. Browserspeicher folgt weder Weiterleitungen noch Änderungen des Hostnamens.

**Die Skripte sind interaktiv.** Sie öffnen die App und verwalten lokale Dateien, aber Sie klicken auf Export, wählen die Importdatei und bestätigen das Ersetzen. Eine App kann mehrere Profile haben: Wählen Sie das gewünschte Profil und verwenden Sie [speeddial.alvit.here.now](https://speeddial.alvit.here.now/). Ein leeres neues Profil ist normal. Das Skript kann nicht bestätigen, welches Profil einen Download erzeugt hat.

## Chrome sichern

```sh
npm run backup:browser -- --browser chrome
```

1. Wählen Sie Ihr bestehendes Chrome-Profil, öffnen Sie den Pfeil oben rechts und klicken Sie auf **Export backup**.
2. Speichern Sie mit dem vorgeschlagenen Namen `speedial-backup-YYYY-MM-DD.json` in `~/Downloads`. Namenszusätze bei Kollisionen wie ` (1)` sind unterstützt.
3. Das Skript wartet auf einen neuen vollständigen Export, validiert ihn, kopiert ihn nach `backups/`, liest die Kopie erneut und zeigt Pfad, Anzahlen und SHA-256 an. Es greift niemals auf einen alten Export zurück. Mehrere gleichzeitige Exporte führen zu einem Fehler statt zu einer geratenen Auswahl.

Lädt der Browser anderswo herunter, verwenden Sie `--downloads /absolute/local/folder` und wählen im Browser denselben Ordner. Wählen Sie lokale Ordner außerhalb der Cloud-Synchronisierung. Die Wartezeit beträgt standardmäßig zehn Minuten; `--timeout 1200` erhöht sie auf zwanzig. Ein Browserdialog **Save As** muss gegebenenfalls bestätigt werden, bevor die Datei existiert. Für einen umbenannten oder bereits heruntergeladenen Export:

```sh
npm run backup:browser -- --file /absolute/local/export.json
```

Der explizite Dateimodus archiviert diese Datei; er ruft **keine** aktuellen Browserdaten ab und weist keine Aktualität nach. Downloadoriginale bleiben erhalten. Vom Beobachter erfasste Exporte erhalten unter POSIX Modus `0600`; explizite Eingabedateien bleiben unverändert.

## In einem anderen Browser wiederherstellen

Ersetzen Sie `YOUR-BACKUP.json` durch den ausgegebenen Sicherungsnamen:

```sh
npm run restore:browser -- backups/YOUR-BACKUP.json --browser firefox
npm run restore:browser -- backups/YOUR-BACKUP.json --browser chrome
npm run restore:browser -- backups/YOUR-BACKUP.json --browser safari
```

Die Wiederherstellung benötigt ein interaktives Terminal und führt jeweils durch einen Browser beziehungsweise ein Profil:

1. Sie validiert und bewahrt eine separate Kopie `restore-source`. Exportieren Sie im Zielprofil das aktuelle Board, auch wenn es leer ist. Das Skript speichert es als `before-restore`, damit es wiederherstellbar bleibt.
2. Bestätigen Sie im Terminal durch Eingabe von `RESTORE`, dass der Export aus dem richtigen Zielprofil stammt.
3. Klicken Sie im selben Browser auf **Import backup**, wählen Sie die ausgegebene Datei `restore-source`, prüfen Sie die Zusammenfassung und klicken Sie auf **Replace this board**. Unter macOS können Sie im Dateidialog **⌘⇧G** drücken und den absoluten Pfad einfügen.
4. Laden Sie Speed Dial neu, prüfen Sie die Bildanzeige und exportieren Sie erneut. Das Skript archiviert diesen Export als `after-restore` und vergleicht geordnete Links, Titel, Bildbytes, Raster, Öffnungsverhalten und Sprache mit der Quelle. Neu erzeugte interne IDs und Zeitstempel werden ignoriert. Ältere Sicherungen ohne Sprachfeld lassen die Zielsprache unverändert.

Erfolg wird erst bei übereinstimmendem Inhalt gemeldet. Eine Abweichung oder Zeitüberschreitung ist **keine** verifizierte Wiederherstellung. Alle Kopien bleiben erhalten; es gibt kein automatisches Rollback. Wiederholen Sie zum Zurücksetzen den Befehl mit der gespeicherten Datei `before-restore`. Übereinstimmende Exporte beweisen Inhaltsgleichheit; Profil, Origin und sichtbare Bilder müssen weiterhin geprüft werden.

Für eine spätere Rückkehr zu Chrome verwenden Sie denselben Wiederherstellungsbefehl mit `--browser chrome` und der gewünschten gespeicherten JSON-Datei. Das Format ist vom Quellbrowser unabhängig. Jede Wiederherstellung ersetzt ein Zielboard, statt Links zusammenzuführen; behalten Sie die automatisch gesicherte Zielkopie, falls beide Versionen benötigt werden.

Exportieren Sie nicht aus einem anderen Tab oder Profil, während ein Befehl wartet. Verwenden Sie für verschiedene Browser getrennte Befehle. Dies ist eine einmalige Übertragung; spätere Änderungen werden nicht synchronisiert.

## Ausschließlich lokale Speicherung und Validierung

Alle Skriptausgaben landen im festen Verzeichnis `backups/` dieses Checkouts. Der Befehl prüft, dass Git es ignoriert und keine Dateien darin verfolgt. Ein symbolisch verknüpftes Ausgabeverzeichnis wird abgelehnt. Jede Sicherung erhält einen eindeutigen Namen, wird ohne Überschreiben anderer Dateien gespeichert, erneut gelesen und von einer `.receipt.json` mit Anzahlen und Prüfsummen, aber ohne Titel oder URLs begleitet. Ungültige Eingaben erzeugen keine Sicherung. Die CLI verwendet die Schema-, Base64- und Rasterheader-Prüfung der App; die Ziel-App dekodiert Bilder zusätzlich vor dem atomaren Import.

Verwenden Sie zur Wiederherstellung die Board-Datei `.json`, nicht deren Begleitdatei `.receipt.json`. Ein Beleg speichert Prüfmetadaten und kann kein Board wiederherstellen. Alte Sicherungen und Downloadoriginale werden nicht automatisch gelöscht; behalten Sie nötige Kopien und verwalten Sie den Speicher lokal.

Unter macOS/Linux hat das Verzeichnis Modus `0700`, Dateien `0600`. Beschränken Sie unter Windows den Zugriff mit Dateisystem-ACLs des Kontos; POSIX-Modi garantieren keine ACL. JSON-Sicherungen sind Klartext. Die Skripte enthalten keinen Upload- oder Synchronisierungscode. Der Ordner ist von Git, dem Docker-Build-Kontext und der öffentlichen Frontend-Freigabeliste ausgeschlossen. `.gitignore` verhindert weder erzwungenes Hinzufügen zu Git noch manuelles Teilen, Betriebssystem-Sicherungen oder separat konfigurierte Synchronisierungsclients. Für rein lokale Speicherung müssen Checkout und Downloadordner außerhalb synchronisierter Verzeichnisse liegen.

Skripte, Tests, Dokumentation und öffentliche Website enthalten keine Boarddaten. Siehe [Grenzen des Browserspeichers](local-speedial.md#what-is-private-and-what-is-not) und [Migrationsabnahme](browser-migration.md).
