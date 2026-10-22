# Skrypty lokalnej kopii i odtwarzania danych przeglądarki

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

[Instrukcja migracji](browser-migration.md) · [Wszystkie sposoby wdrożenia](../README.md#storage-and-deployment)

Skrypty zachowują **tablicę Speed Dial**: uporządkowane odnośniki, tytuły, pełne bajty obrazów, wiersze, kolumny, preferencję otwierania i język. Nie kopiują historii, haseł, rozszerzeń ani innych zakładek przeglądarki. Używają przenośnego formatu JSON aplikacji `speedial-local-backup`, a nie wewnętrznych baz Chrome lub Firefox.

Działają z lokalną aplikacją przeglądarkową pod [speeddial.alvit.here.now](https://speeddial.alvit.here.now/). Nie zastępują [kopii serwera](../wiki/Operations.md#backup-and-restore) dla Node.js, Docker ani k3s. Starszy eksport JSON serwera nie jest pełną kopią przeglądarki; przeniesienie takiej tablicy wymaga [zebrania i konwersji obrazów](browser-migration.md).

Jeśli tablica nadal jest pod `speedial.alvit.here.now`, najpierw wyeksportuj ją dokładnie stamtąd; skrypty otwierają teraz `speeddial.alvit.here.now`. Użyj `--no-open` z już otwartą starą kartą albo jawnie zarchiwizuj zapisany eksport. Starsze pliki `speedial-local-backup` i nazwy pobieranych plików `speedial-backup-*.json` pozostają obsługiwane. Zobacz [uwagi o zmianie adresu](local-speedial.md#corrected-address-and-existing-backups).

## Wymagania i obsługa przeglądarek

Uruchamiaj Node.js 24+ z tej kopii Git. Nie trzeba instalować dodatkowych pakietów. W macOS program uruchamiający rozpoznaje Chrome, Firefox, Safari, Edge, Brave, Arc, Opera, Vivaldi, Chromium, Orion, Zen, LibreWolf i Waterfox w `/Applications`, `~/Applications` lub `/System/Applications`. To obsługa uruchamiania, nie zapewnienie, że każdą przeglądarkę przetestowano. Testy automatyczne aplikacji używają Chromium, Firefox i WebKit.

```sh
npm run backup:browser -- --list-browsers
```

Dla innej przeglądarki macOS użyj `--app /absolute/path/Browser.app`. Dla już otwartej przeglądarki, przeglądarki w Codex, Windows lub Linux użyj `--no-open` i otwórz stronę samodzielnie. Nie potrzeba portu debugowania, rozszerzenia, uprawnień Dostępności ani bezpośredniego dostępu do plików profilu.

```sh
npm run backup:browser -- --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --app "/Applications/Brave Browser.app"
```

Adres uruchamiania jest przypisany do głównej lokalizacji. Tablicę z innego origin należy wyeksportować dokładnie z niego; użyj tam `--no-open` i osobiście sprawdź adres docelowy. Pamięć przeglądarki nie podąża za przekierowaniem ani zmianą nazwy hosta.

**Skrypty są interaktywne.** Otwierają aplikację i zarządzają plikami lokalnymi, ale to użytkownik uruchamia eksport, wybiera plik importu i potwierdza zastąpienie. Aplikacja może mieć kilka profili: wybierz właściwy i użyj [speeddial.alvit.here.now](https://speeddial.alvit.here.now/). Pusty nowy profil jest normalny. Skrypt nie potwierdzi, który profil utworzył pobrany plik.

## Kopia z Chrome

```sh
npm run backup:browser -- --browser chrome
```

1. Wybierz istniejący profil Chrome, rozwiń strzałkę w prawym górnym rogu i kliknij **Export backup**.
2. Zapisz z proponowaną nazwą `speedial-backup-YYYY-MM-DD.json` w `~/Downloads`. Przyrostki dla kolizji nazw, np. ` (1)`, są obsługiwane.
3. Skrypt czeka na nowy kompletny eksport, sprawdza go, kopiuje do `backups/`, ponownie odczytuje kopię i wypisuje ścieżkę, liczby elementów oraz SHA-256. Nigdy nie sięga po stary eksport. Kilka jednoczesnych eksportów powoduje błąd zamiast zgadywania.

Użyj `--downloads /absolute/local/folder`, jeśli przeglądarka pobiera gdzie indziej; wybierz w niej ten sam folder. Wybieraj foldery lokalne poza synchronizacją chmurową. Domyślny czas oczekiwania to dziesięć minut; `--timeout 1200` zmienia go na dwadzieścia. Okno **Save As** może wymagać potwierdzenia przed powstaniem pliku. Dla eksportu przemianowanego lub już pobranego:

```sh
npm run backup:browser -- --file /absolute/local/export.json
```

Tryb jawnego pliku archiwizuje ten plik; **nie** pobiera bieżących danych przeglądarki ani nie dowodzi ich aktualności. Oryginalne pobrania pozostają. Eksporty zebrane przez obserwatora otrzymują w POSIX tryb `0600`; jawnie wskazane pliki wejściowe nie zmieniają się.

## Odtwarzanie w innej przeglądarce

Zastąp `YOUR-BACKUP.json` wypisaną nazwą kopii:

```sh
npm run restore:browser -- backups/YOUR-BACKUP.json --browser firefox
npm run restore:browser -- backups/YOUR-BACKUP.json --browser chrome
npm run restore:browser -- backups/YOUR-BACKUP.json --browser safari
```

Polecenie odtwarzania wymaga interaktywnego terminala i prowadzi przez jedną przeglądarkę/profil naraz:

1. Sprawdza i zachowuje osobną kopię `restore-source`. W profilu docelowym wyeksportuj bieżącą tablicę, nawet pustą. Skrypt zachowa ją jako `before-restore`, aby można ją było odzyskać.
2. W terminalu potwierdź, że eksport pochodzi z właściwego profilu docelowego, wpisując `RESTORE`.
3. W tej samej przeglądarce kliknij **Import backup**, wybierz wskazany plik `restore-source`, sprawdź podsumowanie i kliknij **Replace this board**. W macOS naciśnij w wyborze pliku **⌘⇧G** i wklej ścieżkę absolutną.
4. Przeładuj Speed Dial, sprawdź obrazy i ponownie wyeksportuj. Skrypt archiwizuje eksport `after-restore` i porównuje ze źródłem kolejność odnośników, tytuły, bajty obrazów, siatkę, preferencję otwierania i język. Nowe wewnętrzne ID i znaczniki czasu są pomijane. Starsze kopie bez języka zachowują język celu.

Sukces jest zgłaszany dopiero po zgodności treści. Niezgodność lub przekroczenie czasu **nie** oznacza zweryfikowanego odtworzenia. Wszystkie kopie pozostają; nie ma automatycznego cofania. Aby cofnąć, powtórz polecenie z zapisanym plikiem `before-restore`. Zgodność eksportów dowodzi równości treści; nadal trzeba sprawdzić profil, origin i widoczność obrazów.

Późniejszy powrót do Chrome używa tego samego polecenia z `--browser chrome` i wybranym zapisanym JSON. Format nie zależy od przeglądarki źródłowej. Każde odtworzenie zastępuje jedną tablicę docelową, nie łączy odnośników; zachowaj automatyczną kopię celu, jeśli obie wersje mogą być potrzebne.

Nie eksportuj z innej karty lub profilu, gdy polecenie czeka. Dla różnych przeglądarek uruchamiaj osobne polecenia. To jednorazowy transfer; późniejsze zmiany nie synchronizują się.

## Wyłącznie lokalne przechowywanie i walidacja

Wszystkie wyniki skryptów trafiają do stałego katalogu `backups/` tej kopii Git. Polecenie sprawdza, że Git go ignoruje i nie ma w nim śledzonych plików. Katalog wyjściowy będący dowiązaniem symbolicznym jest odrzucany. Każda kopia ma unikatową nazwę, jest zapisywana bez nadpisania innego pliku, ponownie odczytywana i otrzymuje `.receipt.json` z licznikami i skrótami, bez tytułów i URL. Nieprawidłowe dane nie tworzą kopii. CLI korzysta z walidacji schematu, base64 i nagłówków rastrowych aplikacji; aplikacja docelowa dodatkowo dekoduje obrazy przed atomowym importem.

Do odtwarzania użyj pliku tablicy `.json`, nie towarzyszącego `.receipt.json`. Potwierdzenie zawiera metadane weryfikacji i nie odtwarza tablicy. Skrypty nie kasują automatycznie starych kopii ani oryginalnych pobrań; zachowaj potrzebne kopie i lokalnie zarządzaj ich miejscem.

W macOS/Linux katalog ma tryb `0700`, a pliki `0600`. W Windows ogranicz dostęp przez ACL systemu plików dla konta; tryby POSIX nie gwarantują ACL. Kopie JSON są jawnym tekstem. Skrypty nie mają kodu wysyłania ani synchronizacji. Folder jest wyłączony z Git, wejścia budowania Docker i listy dozwolonych plików publicznego frontendu. `.gitignore` nie blokuje wymuszonego dodania do Git, ręcznego udostępnienia, kopii systemowych ani osobno skonfigurowanego klienta synchronizacji. Dla wyłącznie lokalnego przechowywania trzymaj kopię Git i folder pobrań poza synchronizowanymi katalogami.

Danych tablic nie ma w skryptach, testach, dokumentacji ani publicznej stronie. Zobacz [ograniczenia pamięci przeglądarki](local-speedial.md#what-is-private-and-what-is-not) i [odbiór migracji](browser-migration.md).
