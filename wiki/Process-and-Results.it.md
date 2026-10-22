# Sorgenti, distribuzione e verifica

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

[Pagina iniziale del wiki](Home.md)

Il repository pubblico `speeddial` contiene entrambe le edizioni dell'app, test, esempi generici di distribuzione e documentazione. Parte con una nuova cronologia Git e dati di prova sintetici. Gli archivi operativi privati conservano materiale storico e documentazione di ripristino, usando una revisione pubblica fissata o un'immagine immutabile senza duplicare il codice applicativo.

L'[app locale del browser](https://speeddial.alvit.here.now/) offre a ogni visitatore una bacheca vuota. Pubblicare codice non copia collegamenti o schermate personali in altri browser. Gli [script di backup](../docs/browser-backups.it.md) guidano un trasferimento deliberato con copia di salvataggio della destinazione e confronto esatto dei contenuti dopo il ripristino.

## Processo di distribuzione

![Validazione dei sorgenti, prova isolata di ripristino, distribuzione e accettazione sono fasi distinte.](images/release-process.svg)

L'edizione server supporta Node.js, Docker e k3s. Fissare la revisione pubblica, costruire o scegliere un'immagine immutabile verificata e applicare la configurazione privata fuori dal repository. Separare credenziali e volume dati persistente dall'immagine dell'app. Per migrare un'installazione esistente usare la [guida al passaggio e al rollback](../deploy/README.md).

## Confini dei repository e dei dati

![Il codice pubblico alimenta distribuzioni private; dati personali del browser e documenti di ripristino server restano privati.](images/release-results.svg)

I sorgenti pubblici non contengono una bacheca personale iniziale. I backup browser locali restano in `backups/`, ignorato da Git; i set di ripristino server comprendono SQLite, immagini referenziate e credenziali protette separatamente. I formati servono edizioni diverse e non sono intercambiabili.

## Verifica

I controlli locali e CI validano dati sintetici e gli scenari eseguiti. Entrambe le edizioni mantengono cinque lingue, comandi compressi, scambi a coppie, anteprime che seguono il puntatore, dimensioni della griglia e navigazione nella stessa finestra per impostazione predefinita.

Una prova di migrazione server confronta ID, ordine, titoli, URL, impostazioni, riferimenti alle immagini e integrità SQLite. I controlli di rotazione verificano che le vecchie sessioni falliscano dopo il riavvio. L'accettazione effettiva controlla inoltre instradamento previsto, credenziali, disponibilità delle immagini e conservazione dei dati nell'ambiente di destinazione.

Un controllo dei sorgenti riuscito non dimostra che siano avvenuti distribuzione o ripristino. Tenere privati i verbali reali di distribuzione e gli inventari personali. I diagrammi descrivono architettura e processo, non garantiscono prestazioni, disponibilità o tempi di ripristino. Il codice pubblico resta `UNLICENSED`.
