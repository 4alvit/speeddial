# Alvit Speed Dial

[English](README.md) · [Русский](README.ru.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md)

Beide Versionen bleiben verfügbar: **Speedial** speichert ein persönliches Board je Browser, **selbst gehostetes Speed Dial** ein gemeinsames Board auf dem Server mit automatischen Screenshots. Speicherung und Wiederherstellung unterscheiden sich.

[App öffnen](https://speedial.alvit.here.now/) · [Browser-Sicherungen](docs/browser-backups.md) · [Node.js](README.md#local-development) · [Docker](README.md#docker) · [k3s / Kubernetes](README.md#k3s--kubernetes) · [CI-Runner](docs/CI.md) · [Organisationsprofil](docs/organization-profile.md)

## Öffentliche lokale Browser-Version: Speedial

[Speedial öffnen](https://speedial.alvit.here.now/) — die öffentliche App mit Daten im Browser. Dies ist die Hauptadresse für dein Board; speichere sie als Lesezeichen. [Anleitung zu Speicherung, Datenschutz und Übertragung](docs/local-speedial.md).

Jeder Besucher beginnt mit einem leeren Board. Links, Einstellungen und Bilddaten bleiben in diesem Browserprofil. Dieselbe Adresse oder eine kopierte lokale Board-ID zeigt sie auf einem anderen Computer nicht an. Es gibt keine gemeinsame Board-API, Cloud-Synchronisierung oder automatischen Website-Screenshots. Die fünf Sprachen und Kachelsteuerung bleiben erhalten.

Mit **Sicherung exportieren** und **Sicherung importieren** lässt sich das vollständige Board samt Bildern und Sprache gezielt übertragen. Nach Vorschau und Bestätigung ersetzt der Import das Zielboard. Andere Domains, Browser und Profile haben getrennten Speicher, selbst bei identischem App-Code. Halte die unverschlüsselte JSON-Sicherung privat; das Löschen von Browserdaten kann das lokale Board entfernen.

Build: `npm run build:local`; Prüfung: `npm run test:local`. Nur die freigegebenen Dateien in `dist/local` veröffentlichen. Die unten beschriebene Server-Version bleibt getrennt.

### Lokale Sicherung und Browserwechsel

Mit Node.js 24+ aus diesem Repository:

```sh
npm run backup:browser -- --browser chrome
npm run restore:browser -- backups/YOUR-BACKUP.json --browser firefox
```

Ersetze `YOUR-BACKUP.json` durch den Namen deiner Sicherung. Die interaktiven Skripte führen durch Export und Import des vollständigen Boards samt Bildern und Einstellungen. Sicherungen bleiben im von Git ausgeschlossenen Ordner `backups/`. Vor dem Ersetzen wird das Zielboard gesichert; danach wird ein neuer Export mit der Quelle verglichen. Unter macOS lassen sich Chrome, Firefox und weitere installierte Browser öffnen. Für einen bereits offenen Browser sowie Windows/Linux verwende `--no-open`. Die Skripte lesen keine internen Profildatenbanken und synchronisieren keine Browser. [Vollständige Anleitung auf Englisch](docs/browser-backups.md).

## Selbst gehostete Version

Eine selbst gehostete gemeinsame Lesezeichenseite mit kompakten Screenshot-Kacheln, direkter Bearbeitung, paarweisem Tauschen und gespeicherten Einstellungen. Die Oberfläche unterstützt Englisch, Russisch, Deutsch, Französisch und Spanisch.

Der Server liest Zugangsdaten aus externen Dateien und speichert Nutzerdaten außerhalb des Images. Das öffentliche Repository `speeddial` enthält den Anwendungscode und allgemeine Bereitstellungsbeispiele. `speeddial-private` bewahrt private Historie und Wiederherstellungsunterlagen und verwendet einen festgelegten Stand des öffentlichen Codes ohne Codekopie.

![Architektur mit externen Zugangsdaten, persistentem Speicher und eingeschränkten Screenshot-Verbindungen.](wiki/images/architecture.svg)

## Funktionen

Die Kopfzeile ist zunächst eingeklappt; der Pfeil rechts zeigt Einstellungen, Export und das Hinzufügen von Websites. Permanente Kachelbeschriftungen entfallen. Die gezogene Vorschau folgt dem Zeiger; nur Ausgangs- und Zielposition tauschen. Touch-Griffe und Tastatursteuerung sind verfügbar.

Jeweils 1–12 Zeilen und Spalten sind möglich, standardmäßig 4 × 5. Weitere Einträge bleiben auf Folgeseiten. Links öffnen standardmäßig im selben Fenster. Die Sprache wird lokal im Browser gespeichert; Raster und Linkverhalten gelten für die gemeinsame Seite.

Neue URLs lösen automatisch Screenshots aus. PNG, JPEG, WebP und GIF bis 5 MiB können hochgeladen werden. Der Serverbrowser erhält keine persönlichen Anmeldecookies. Eine neue Datenbank startet standardmäßig leer.

## Zugang und Entwicklung

Erforderlich sind Node.js 24+, installiertes Chromium und zwei externe Dateien:

- `ACCESS_TOKEN_FILE`: ein zufälliges URL-sicheres Token mit mindestens 32 Zeichen nach dem Entfernen äußerer Leerzeichen.
- `SESSION_KEY_FILE`: ein Signaturschlüssel mit mindestens 32 Rohbytes.

Die Adresse hat die Form `https://bookmarks.example.test/?access=<token>`. Dies ist nur ein Beispiel. Jeder Seitenaufruf benötigt das Token; das Sitzungscookie erlaubt Lesen und Bearbeiten. Ein separates Editorpasswort gibt es nicht. Änderungen an Token, Schlüssel oder `AUTH_EPOCH` widerrufen alte Sitzungen nach einem Neustart.

Zugangsdaten, vollständige Links, Datenbanken und private Bilder gehören weder in Git noch ins Image. Sichere lokale Einrichtung: [englische Anleitung](README.md#local-development).

```sh
npm ci
npm run check
CHROMIUM_PATH=/path/to/chromium npm run test:browser
```

`DATA_DIR` enthält SQLite, `images/` und migrierte `legacy-images/`. Das optionale `INITIAL_STATE_FILE` befüllt nur eine neue Datenbank aus einer externen Datei. Bestehende Datenbanken werden nicht neu initialisiert.

## Betrieb und Veröffentlichung

[Wiki](wiki/Home.md), [API](wiki/API.md), [Konfiguration](wiki/Configuration.md), [Umstellung und Wiederherstellung](deploy/README.md), [Sicherheit](SECURITY.md), [Status](wiki/Process-and-Results.md). Die technische Detaildokumentation ist Englisch.

Der **Server-JSON-Export** enthält keine Bildbytes und ist keine vollständige Sicherung. Wiederherstellung erfordert konsistente Daten und externe Schlüssel in geschützter, vom Knoten unabhängiger Sicherung. Die Browser-Sicherung verwendet ein anderes Format und enthält Bilder. Eine produktive Umstellung benötigt eine gesonderte Freigabe.

Der Betrieb mit [Docker](README.md#docker) und [k3s / Kubernetes](README.md#k3s--kubernetes) bleibt erhalten. Das Docker-Beispiel hält Daten und Zugangsdaten außerhalb des Images; k3s benötigt ein eigenes Overlay für Image, Speicher und Routing. Die Veröffentlichung der lokalen Version ändert keine Serverbereitstellung. Ein [Leitfaden mit README-Beispiel für das Organisationsprofil](docs/organization-profile.md) ist ebenfalls enthalten.

Dieses öffentliche Repository beginnt mit einer neuen Quellcode-Historie und synthetischen Beispielen. Die bisherige private Historie bleibt in `speeddial-private`. Sicherungen, Zugangsdaten und persönliche Inhalte gehören nicht in Git. Der Code ist öffentlich einsehbar, bleibt aber `UNLICENSED`; eine Open-Source-Lizenz zur Weiterverbreitung wird nicht erteilt.
