# Source, deployment and verification

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

[Wiki home](Home.md)

The public `speeddial` repository owns both application editions, tests, generic deployment examples and documentation. It starts with a new Git history and synthetic fixtures. Private operational archives retain historical material and deployment recovery records, consuming a pinned public source revision or immutable image without duplicating application code.

The [browser-local app](https://speeddial.alvit.here.now/) starts each visitor with an empty board. Publishing code does not copy anyone's links or screenshots into another browser. The [backup scripts](../docs/browser-backups.md) guide a deliberate transfer with a destination rescue copy and an exact content comparison after restoration.

## Deployment process

![Source validation, isolated restore rehearsal, deployment and acceptance are separate stages.](images/release-process.svg)

Node.js, Docker and k3s remain supported for the server edition. Pin the public revision, build or select a verified immutable image, and apply private configuration outside this repository. Keep credentials and the persistent data volume separate from the application image. Use the [cutover and rollback guide](../deploy/README.md) when an existing installation needs migration.

## Repository and data boundaries

![Public application source supplies private deployments; personal browser data and server recovery records remain private.](images/release-results.svg)

Public source contains no personal initial board. Local browser backups stay under Git-ignored `backups/`; server recovery sets include SQLite, referenced image files and separately protected credentials. These formats serve different editions and are not interchangeable.

## Verification

Local and CI checks validate synthetic fixtures and the scenarios they execute. Both editions retain five languages, collapsed controls, pairwise swaps, pointer-following previews, grid dimensions and same-window navigation by default.

A server migration rehearsal compares IDs, order, titles, URLs, settings, image references and SQLite integrity. Rotation checks verify that old sessions fail after restart. Actual deployment acceptance additionally checks the intended routing, credentials, image availability and data preservation in the target environment.

A passing source check does not prove a deployment or restore occurred. Keep real deployment receipts and personal inventories private. The diagrams describe architecture and process, not performance, availability or recovery-time guarantees. Public source remains `UNLICENSED`.
