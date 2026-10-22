# ソース、配備、検証

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

[Wiki ホーム](Home.md)

公開リポジトリ `speeddial` はアプリの両エディション、テスト、一般的な配備例、文書を含みます。新しい Git 履歴と合成テストデータから始まります。非公開の運用アーカイブは過去の資料と復旧記録を保持し、固定した公開ソースのリビジョンまたは不変イメージを利用してアプリコードを重複させません。

[ブラウザーローカルアプリ](https://speeddial.alvit.here.now/) は訪問者ごとに空のボードから始まります。コード公開で個人のリンクやスクリーンショットが他のブラウザーにコピーされることはありません。[バックアップスクリプト](../docs/browser-backups.ja.md) は、移行先の救済コピーと復元後の厳密な内容比較を伴う、意図的な移行を案内します。

## 配備の流れ

![ソース検証、隔離した復元演習、配備、受入確認は別々の段階です。](images/release-process.svg)

サーバー版は引き続き Node.js、Docker、k3s に対応します。公開リビジョンを固定し、検証済み不変イメージを構築または選択して、非公開設定をリポジトリ外で適用します。認証情報と永続データボリュームはアプリイメージから分離します。既存環境の移行には[切替とロールバックの手順](../deploy/README.md)を使ってください。

## リポジトリとデータの境界

![公開アプリソースが非公開配備を支え、個人のブラウザーデータとサーバー復旧記録は非公開のままです。](images/release-results.svg)

公開ソースには個人の初期ボードを含みません。ローカルブラウザーバックアップは Git が無視する `backups/` に残り、サーバー復旧セットは SQLite、参照画像ファイル、別途保護した認証情報を含みます。異なるエディション向けの形式であり、相互交換できません。

## 検証

ローカルおよび CI の検査は合成テストデータと実行したシナリオを検証します。両版とも 5 言語、折り畳み操作、二つずつの入替、ポインターに追従するプレビュー、グリッド寸法、既定の同一ウィンドウ内ナビゲーションを維持します。

サーバー移行演習では ID、順序、タイトル、URL、設定、画像参照、SQLite 整合性を比較します。ローテーション検査では再起動後に旧セッションが失敗することを確認します。実際の配備受入では、対象環境の予定したルーティング、認証情報、画像の利用可能性、データ保持も確認します。

ソース検査の成功は配備や復元の実施を証明しません。実際の配備記録や個人の一覧は非公開にしてください。図はアーキテクチャと手順を説明するもので、性能、可用性、復旧時間の保証ではありません。公開ソースは `UNLICENSED` のままです。
