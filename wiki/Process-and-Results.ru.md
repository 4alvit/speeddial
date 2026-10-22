# Исходники, развёртывание и проверки

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

[Начало Wiki](Home.md)

Публичный `speeddial` содержит обе версии приложения, тесты, общие примеры развёртывания и документацию. У него новая история Git и синтетические примеры. Закрытые эксплуатационные архивы хранят прежнюю историю и материалы восстановления, используя закреплённую ревизию публичных исходников или неизменяемый образ без дублирования кода приложения.

[Браузерная версия](https://speeddial.alvit.here.now/) создаёт пустую панель для нового посетителя. Публикация кода не переносит личные ссылки или скриншоты в чужой браузер. [Скрипты резервного копирования](../docs/browser-backups.ru.md) помогают явно перенести данные: сохраняют исходную панель назначения и сравнивают содержимое после восстановления.

## Процесс развёртывания

![Проверки исходников, репетиция восстановления, развёртывание и приёмка выполняются отдельно.](images/release-process.svg)

Серверная версия поддерживает Node.js, Docker и k3s. Закрепите публичную ревизию, соберите или выберите проверенный неизменяемый образ и примените приватную конфигурацию вне этого репозитория. Секреты и постоянный том данных хранятся отдельно от образа. Для миграции существующей установки используйте [инструкцию переключения и отката](../deploy/README.md).

## Границы репозиториев и данных

![Приватные развёртывания используют публичный код; личные данные браузера и материалы восстановления сервера остаются приватными.](images/release-results.svg)

В публичных исходниках нет личной стартовой панели. Бэкапы браузера остаются в исключённой из Git папке `backups/`. Комплект восстановления сервера включает SQLite, связанные файлы изображений и отдельно защищённые секреты. Эти форматы относятся к разным версиям и не взаимозаменяемы.

## Проверки

Локальные тесты и CI подтверждают проверяемые сценарии на синтетических данных. Обе версии сохраняют пять языков, свёрнутые элементы управления, обмен ровно двух плиток, превью под указателем, размеры сетки и открытие ссылок в том же окне по умолчанию.

Репетиция миграции сервера проверяет идентификаторы, порядок, названия, адреса, настройки, изображения и целостность SQLite. Проверка ротации подтверждает отказ старых сессий после перезапуска. Приёмка конкретного развёртывания дополнительно проверяет маршрутизацию, доступ, доступность изображений и сохранность данных.

Успешный тест исходников не доказывает, что развёртывание или восстановление выполнено. Реальные отчёты и личные данные остаются приватными. Диаграммы описывают архитектуру и процесс, а не гарантии производительности, доступности или времени восстановления. Статус лицензирования исходников остаётся `UNLICENSED`.
