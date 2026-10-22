# Źródła, wdrażanie i weryfikacja

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

[Strona główna wiki](Home.md)

Publiczne repozytorium `speeddial` zawiera obie edycje aplikacji, testy, ogólne przykłady wdrożenia i dokumentację. Rozpoczyna nową historię Git z syntetycznymi danymi testowymi. Prywatne archiwa operacyjne zachowują materiały historyczne i zapisy odzyskiwania, używając przypiętej publicznej rewizji lub niezmiennego obrazu bez duplikacji kodu aplikacji.

[Lokalna aplikacja przeglądarkowa](https://speeddial.alvit.here.now/) zaczyna dla każdego gościa od pustej tablicy. Publikacja kodu nie kopiuje osobistych odnośników ani zrzutów do innej przeglądarki. [Skrypty kopii](../docs/browser-backups.pl.md) prowadzą świadomy transfer z kopią ratunkową celu i dokładnym porównaniem zawartości po odtworzeniu.

## Proces wdrażania

![Walidacja źródeł, izolowana próba odtworzenia, wdrożenie i odbiór to osobne etapy.](images/release-process.svg)

Edycja serwerowa nadal obsługuje Node.js, Docker i k3s. Przypnij publiczną rewizję, zbuduj lub wybierz sprawdzony niezmienny obraz i zastosuj prywatną konfigurację poza repozytorium. Trzymaj dane uwierzytelniające i trwały wolumen danych osobno od obrazu. Przy migracji istniejącej instalacji użyj [instrukcji przełączenia i cofnięcia](../deploy/README.md).

## Granice repozytorium i danych

![Publiczny kod zasila prywatne wdrożenia; osobiste dane przeglądarki i zapisy odzyskiwania serwera pozostają prywatne.](images/release-results.svg)

Publiczne źródła nie zawierają osobistej tablicy początkowej. Lokalne kopie pozostają w ignorowanym przez Git `backups/`; zestawy odtwarzania serwera obejmują SQLite, wskazane pliki obrazów i osobno chronione dane dostępowe. Formaty służą różnym edycjom i nie są zamienne.

## Weryfikacja

Testy lokalne i CI sprawdzają syntetyczne dane i wykonywane scenariusze. Obie edycje zachowują pięć języków, zwinięte kontrolki, zamiany parami, podglądy podążające za wskaźnikiem, wymiary siatki i domyślną nawigację w tym samym oknie.

Próba migracji serwera porównuje ID, kolejność, tytuły, URL, ustawienia, odwołania do obrazów i integralność SQLite. Kontrole rotacji potwierdzają odrzucanie starych sesji po restarcie. Faktyczny odbiór wdrożenia sprawdza też planowane trasowanie, dane dostępowe, dostępność obrazów i zachowanie danych w środowisku docelowym.

Pomyślny test źródeł nie dowodzi wykonania wdrożenia ani odtworzenia. Rzeczywiste potwierdzenia wdrożeń i osobiste inwentarze zachowaj prywatnie. Diagramy opisują architekturę i proces, nie gwarantują wydajności, dostępności ani czasu odzyskiwania. Publiczny kod pozostaje `UNLICENSED`.
