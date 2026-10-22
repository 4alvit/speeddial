# Quellcode, Bereitstellung und Verifizierung

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

[Wiki-Startseite](Home.md)

Das öffentliche Repository `speeddial` enthält beide App-Ausgaben, Tests, allgemeine Bereitstellungsbeispiele und Dokumentation. Es beginnt mit einer neuen Git-Historie und synthetischen Testdaten. Private Betriebsarchive bewahren historische Unterlagen und Wiederherstellungsnachweise auf und verwenden eine festgelegte öffentliche Quellrevision oder ein unveränderliches Image, ohne App-Code zu duplizieren.

Die [browserlokale App](https://speeddial.alvit.here.now/) beginnt für jeden Besucher mit einem leeren Board. Quellcode zu veröffentlichen kopiert keine persönlichen Links oder Bildschirmfotos in andere Browser. Die [Sicherungsskripte](../docs/browser-backups.de.md) begleiten eine bewusste Übertragung mit Rettungskopie des Ziels und exaktem Inhaltsvergleich nach der Wiederherstellung.

## Bereitstellungsprozess

![Quellprüfung, isolierte Wiederherstellungsprobe, Bereitstellung und Abnahme sind getrennte Schritte.](images/release-process.svg)

Die Serverausgabe unterstützt weiterhin Node.js, Docker und k3s. Fixieren Sie die öffentliche Revision, erstellen oder wählen Sie ein geprüftes unveränderliches Image und wenden Sie private Konfiguration außerhalb dieses Repositorys an. Halten Sie Zugangsdaten und dauerhaftes Datenvolume vom App-Image getrennt. Bei Migration einer bestehenden Installation verwenden Sie die [Umstellungs- und Rollback-Anleitung](../deploy/README.md).

## Grenzen von Repository und Daten

![Öffentlicher App-Code versorgt private Installationen; persönliche Browserdaten und Server-Wiederherstellungsnachweise bleiben privat.](images/release-results.svg)

Öffentlicher Quellcode enthält kein persönliches Startboard. Lokale Browsersicherungen bleiben unter dem von Git ignorierten `backups/`; Server-Wiederherstellungssätze enthalten SQLite, referenzierte Bilddateien und separat geschützte Zugangsdaten. Die Formate gehören zu verschiedenen Ausgaben und sind nicht austauschbar.

## Verifizierung

Lokale und CI-Prüfungen validieren synthetische Testdaten und die ausgeführten Szenarien. Beide Ausgaben behalten fünf Sprachen, eingeklappte Bedienelemente, paarweises Tauschen, zeigerfolgende Vorschauen, Rastermaße und standardmäßige Navigation im selben Fenster.

Eine Server-Migrationsprobe vergleicht IDs, Reihenfolge, Titel, URLs, Einstellungen, Bildreferenzen und SQLite-Integrität. Rotationsprüfungen bestätigen, dass alte Sitzungen nach Neustart abgewiesen werden. Die tatsächliche Bereitstellungsabnahme prüft zusätzlich vorgesehenes Routing, Zugangsdaten, Bildverfügbarkeit und Datenerhalt in der Zielumgebung.

Eine bestandene Quellprüfung beweist keine ausgeführte Bereitstellung oder Wiederherstellung. Halten Sie echte Bereitstellungsbelege und persönliche Inventare privat. Die Diagramme beschreiben Architektur und Prozess, keine Leistungs-, Verfügbarkeits- oder Wiederherstellungszeitgarantien. Der öffentliche Quellcode bleibt `UNLICENSED`.
