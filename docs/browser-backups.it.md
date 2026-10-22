# Script di backup e ripristino locale del browser

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

[Guida alla migrazione](browser-migration.md) · [Opzioni di distribuzione](../README.md#storage-and-deployment)

Gli script preservano la **bacheca Speed Dial**: collegamenti ordinati, titoli, byte completi delle immagini, righe, colonne, preferenza di apertura e lingua. Non salvano cronologia, password, estensioni o altri segnalibri. Usano il formato JSON portabile dell'app `speedial-local-backup`, non i database interni di Chrome o Firefox.

Operano sull'app locale del browser su [speeddial.alvit.here.now](https://speeddial.alvit.here.now/). Non sostituiscono i [backup del server](../wiki/Operations.md#backup-and-restore) per Node.js, Docker o k3s. Il vecchio export JSON del server non è accettato come backup completo del browser; trasferirlo richiede la [raccolta e conversione delle immagini](browser-migration.md).

Se la bacheca è ancora su `speedial.alvit.here.now`, esportarla prima da quell'indirizzo esatto: ora gli script aprono `speeddial.alvit.here.now`. Usare `--no-open` con la vecchia scheda già aperta oppure archiviare esplicitamente l'export salvato. I vecchi file `speedial-local-backup` e nomi scaricati `speedial-backup-*.json` rimangono supportati. Vedere le [note sul cambio d'indirizzo](local-speedial.md#corrected-address-and-existing-backups).

## Requisiti e supporto browser

Eseguire Node.js 24+ da questo checkout Git. Non occorre installare altri pacchetti. Su macOS il launcher riconosce Chrome, Firefox, Safari, Edge, Brave, Arc, Opera, Vivaldi, Chromium, Orion, Zen, LibreWolf e Waterfox in `/Applications`, `~/Applications` o `/System/Applications`. È supporto all'avvio, non una dichiarazione di test su ogni browser. I test automatici dell'app usano Chromium, Firefox e WebKit.

```sh
npm run backup:browser -- --list-browsers
```

Per altri browser macOS usare `--app /absolute/path/Browser.app`. Per un browser già aperto, il browser integrato in Codex, Windows o Linux usare `--no-open` e aprire il sito manualmente. Non servono porte di debug, estensioni, autorizzazione Accessibilità o accesso diretto ai file del profilo.

```sh
npm run backup:browser -- --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --app "/Applications/Brave Browser.app"
```

L'URL di avvio è fissato all'indirizzo principale. Una bacheca su un'altra origine va esportata da quella stessa origine; usare lì `--no-open` e verificare personalmente l'indirizzo di destinazione. Lo storage del browser non segue reindirizzamenti o cambi del nome host.

**Gli script sono interattivi.** Aprono l'app e gestiscono file locali, ma l'utente avvia l'export, sceglie il file da importare e conferma la sostituzione. Un'app può avere più profili: scegliere quello desiderato e usare [speeddial.alvit.here.now](https://speeddial.alvit.here.now/). Un nuovo profilo vuoto è normale. Lo script non può attestare quale profilo abbia prodotto un download.

## Backup da Chrome

```sh
npm run backup:browser -- --browser chrome
```

1. Selezionare il profilo Chrome esistente, espandere la freccia in alto a destra e premere **Export backup**.
2. Salvare con il nome proposto `speedial-backup-YYYY-MM-DD.json` in `~/Downloads`. Sono supportati suffissi per nomi duplicati come ` (1)`.
3. Lo script attende un nuovo export completo, lo valida, lo copia in `backups/`, rilegge la copia e stampa percorso, conteggi e SHA-256. Non ripiega mai su un vecchio export. Più export simultanei causano un errore anziché una scelta arbitraria.

Usare `--downloads /absolute/local/folder` se il browser scarica altrove e scegliere la stessa cartella nel browser. Scegliere cartelle locali esterne alla sincronizzazione cloud. L'attesa predefinita è dieci minuti; `--timeout 1200` la porta a venti. La finestra **Save As** del browser può richiedere conferma prima che il file esista. Per un export rinominato o già scaricato:

```sh
npm run backup:browser -- --file /absolute/local/export.json
```

La modalità file esplicito archivia quel file; **non** acquisisce i dati correnti del browser né ne dimostra l'attualità. Gli originali scaricati restano. Gli export raccolti dall'osservatore sono limitati al modo `0600` su POSIX; i file di input espliciti non vengono modificati.

## Ripristino in un altro browser

Sostituire `YOUR-BACKUP.json` con il nome del backup stampato:

```sh
npm run restore:browser -- backups/YOUR-BACKUP.json --browser firefox
npm run restore:browser -- backups/YOUR-BACKUP.json --browser chrome
npm run restore:browser -- backups/YOUR-BACKUP.json --browser safari
```

Il ripristino richiede un terminale interattivo e guida un browser/profilo alla volta:

1. Valida e conserva una copia separata `restore-source`. Nel profilo di destinazione esportare la bacheca attuale, anche vuota. Lo script la salva come `before-restore` affinché resti recuperabile.
2. Confermare nel terminale che l'export proviene dal profilo di destinazione corretto digitando `RESTORE`.
3. Nello stesso browser premere **Import backup**, scegliere il file `restore-source` indicato, verificare il riepilogo e premere **Replace this board**. Su macOS premere **⌘⇧G** nella finestra di scelta e incollare il percorso assoluto.
4. Ricaricare Speed Dial, verificare le immagini ed esportare nuovamente. Lo script archivia questo export `after-restore` e confronta con l'origine collegamenti ordinati, titoli, byte delle immagini, griglia, preferenza di apertura e lingua. ID interni rigenerati e timestamp sono ignorati. I vecchi backup senza lingua mantengono quella della destinazione.

Il successo è segnalato solo dopo la corrispondenza dei contenuti. Una differenza o un timeout **non** costituisce ripristino verificato. Tutte le copie restano; non esiste rollback automatico. Per annullare, ripetere il comando con il file `before-restore` salvato. Export coincidenti dimostrano uguaglianza del contenuto; restano da controllare profilo, origine e immagini visibili.

Per tornare successivamente a Chrome usare lo stesso comando con `--browser chrome` e il JSON salvato desiderato. Il formato non dipende dal browser di origine. Ogni ripristino sostituisce una bacheca di destinazione, senza unire i collegamenti; conservare la copia automatica della destinazione se possono servire entrambe le versioni.

Non esportare da altre schede o profili mentre un comando attende. Usare comandi separati per browser diversi. È un trasferimento una tantum: le modifiche successive non si sincronizzano.

## Archiviazione esclusivamente locale e validazione

Tutto l'output degli script va nella cartella fissa `backups/` di questo checkout. Il comando verifica che Git la ignori e che non contenga file tracciati. Una cartella di output simbolicamente collegata viene rifiutata. Ogni backup ha nome univoco, viene scritto senza sovrascrivere altri file, riletto e corredato da `.receipt.json` con conteggi e digest, senza titoli o URL. Input non valido non crea backup. La CLI riusa la validazione di schema, base64 e intestazioni raster dell'app; l'app di destinazione decodifica inoltre le immagini prima dell'import atomico.

Per ripristinare usare il `.json` della bacheca, non il compagno `.receipt.json`. Una ricevuta contiene metadati di verifica e non ripristina una bacheca. Gli script non eliminano automaticamente vecchi backup o originali scaricati; conservare le copie utili e gestirne localmente lo spazio.

Su macOS/Linux la cartella ha modo `0700` e i file `0600`. Su Windows limitare l'accesso tramite ACL del filesystem per l'account; i modi POSIX non garantiscono ACL. I backup JSON sono in chiaro. Gli script non contengono codice di caricamento o sincronizzazione. La cartella è esclusa da Git, dall'input di build Docker e dall'elenco consentito del frontend pubblico. `.gitignore` non impedisce aggiunte forzate a Git, condivisioni manuali, backup del sistema o client di sincronizzazione configurati separatamente. Per uno storage solo locale, tenere checkout e download fuori da cartelle sincronizzate.

Nessun dato di bacheca è incorporato in script, test, documentazione o sito pubblico. Vedere [limiti dello storage browser](local-speedial.md#what-is-private-and-what-is-not) e [accettazione della migrazione](browser-migration.md).
