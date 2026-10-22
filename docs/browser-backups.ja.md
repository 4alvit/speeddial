# ブラウザーのローカルバックアップと復元スクリプト

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

[移行手順](browser-migration.md) · [すべての配備方法](../README.md#storage-and-deployment)

これらのスクリプトは **Speed Dial ボード**を保存します。対象はリンクの順序、タイトル、画像の全バイト、行数、列数、開き方の設定、言語です。閲覧履歴、パスワード、拡張機能、その他のブックマークは保存しません。Chrome や Firefox の内部データベースではなく、アプリの移植可能な `speedial-local-backup` JSON 形式を使います。

対象は [speeddial.alvit.here.now](https://speeddial.alvit.here.now/) のブラウザーローカル版です。Node.js、Docker、k3s 配備の[サーバーバックアップ](../wiki/Operations.md#backup-and-restore)を置き換えません。サーバーの旧 JSON エクスポートは完全なブラウザーバックアップとして受理されません。そのボードの移行には[画像の収集と変換手順](browser-migration.md)が必要です。

ボードが旧アドレス `speedial.alvit.here.now` に残っている場合、最初にその正確なアドレスからエクスポートしてください。現在スクリプトが開くのは `speeddial.alvit.here.now` です。開いてある旧タブで `--no-open` を使うか、保存済みエクスポートを明示的にアーカイブします。旧 `speedial-local-backup` ファイルと `speedial-backup-*.json` というダウンロード名も引き続き使えます。[アドレス移行の注意](local-speedial.md#corrected-address-and-existing-backups)を参照してください。

## 要件とブラウザー対応

この Git チェックアウトから Node.js 24+ を実行します。追加パッケージのインストールは不要です。macOS のランチャーは `/Applications`、`~/Applications`、`/System/Applications` 内の Chrome、Firefox、Safari、Edge、Brave、Arc、Opera、Vivaldi、Chromium、Orion、Zen、LibreWolf、Waterfox を認識します。これは起動対応であり、各ブラウザーの動作確認済みという意味ではありません。アプリの自動テストは Chromium、Firefox、WebKit を使います。

```sh
npm run backup:browser -- --list-browsers
```

別の macOS ブラウザーには `--app /absolute/path/Browser.app` を使います。既に開いているブラウザー、Codex 内蔵ブラウザー、Windows、Linux では `--no-open` を指定して自分でサイトを開きます。デバッグポート、拡張機能、アクセシビリティ権限、プロファイルファイルへの直接アクセスは不要です。

```sh
npm run backup:browser -- --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --app "/Applications/Brave Browser.app"
```

起動 URL は主アドレスに固定されています。別オリジンの既存ボードは必ずそのオリジンからエクスポートしてください。そこで `--no-open` を使い、移行先アドレスも自分で確認します。ブラウザーの保存領域はリダイレクトやホスト名変更に追従しません。

**対話操作が必要なスクリプトです。** アプリを開き、ローカルファイルを管理しますが、エクスポートのクリック、インポートファイルの選択、置換の確認は利用者が行います。アプリには複数プロファイルがあり得ます。目的のプロファイルを選び、[speeddial.alvit.here.now](https://speeddial.alvit.here.now/) を使ってください。新規プロファイルが空なのは正常です。スクリプトはダウンロード元のプロファイルを証明できません。

## Chrome をバックアップする

```sh
npm run backup:browser -- --browser chrome
```

1. 既存の Chrome プロファイルを選び、右上の矢印を展開して **Export backup** をクリックします。
2. 推奨名 `speedial-backup-YYYY-MM-DD.json` で `~/Downloads` に保存します。` (1)` などの同名回避用接尾辞も使えます。
3. スクリプトは新しい完全なエクスポートを待ち、検証して `backups/` にコピーし、コピーを再読込してパス、件数、SHA-256 を表示します。旧エクスポートで代用することはありません。同時に複数のエクスポートがあれば、推測せずエラーになります。

ダウンロード先が別なら `--downloads /absolute/local/folder` を指定し、ブラウザーでも同じフォルダーを選びます。クラウド同期対象外のローカルフォルダーを選んでください。既定の待機時間は 10 分です。`--timeout 1200` で 20 分に変わります。ファイルが作成される前にブラウザーの **Save As** ダイアログで確認が必要な場合があります。名前変更済み、または既にダウンロードしたエクスポートには次を使います。

```sh
npm run backup:browser -- --file /absolute/local/export.json
```

明示的なファイル指定モードはそのファイルをアーカイブします。現在のブラウザーデータを取得したり、新しさを証明したりは**しません**。ダウンロード元ファイルは残ります。監視処理が集めたエクスポートは POSIX で `0600` に制限されますが、明示指定した入力ファイルは変更しません。

## 別のブラウザーへ復元する

`YOUR-BACKUP.json` を表示されたバックアップ名に置き換えます。

```sh
npm run restore:browser -- backups/YOUR-BACKUP.json --browser firefox
npm run restore:browser -- backups/YOUR-BACKUP.json --browser chrome
npm run restore:browser -- backups/YOUR-BACKUP.json --browser safari
```

復元コマンドは対話型ターミナルを必要とし、一度に一つのブラウザー／プロファイルを案内します。

1. 入力を検証し、別の `restore-source` コピーを保存します。移行先プロファイルで現在のボードを、空でもエクスポートしてください。スクリプトは復旧用に `before-restore` として保存します。
2. エクスポートが正しい移行先プロファイルのものだと確認し、ターミナルで `RESTORE` を入力します。
3. 同じブラウザーで **Import backup** をクリックし、表示された `restore-source` ファイルを選び、概要を確認して **Replace this board** をクリックします。macOS ではファイル選択中に **⌘⇧G** を押し、絶対パスを貼り付けます。
4. Speed Dial を再読込し、画像の表示を確認して再びエクスポートします。スクリプトはこの `after-restore` を保存し、リンク順、タイトル、画像バイト、グリッド、開き方、言語を元データと比較します。再生成された内部 ID とタイムスタンプは無視します。言語を含まない旧バックアップは移行先の言語を維持します。

内容が一致して初めて成功を報告します。不一致やタイムアウトは検証済み復元では**ありません**。すべてのコピーを保持し、自動ロールバックはしません。戻すには保存された `before-restore` を指定して同じコマンドを実行します。エクスポートの一致は内容の同一性を示しますが、プロファイル、オリジン、画像表示の確認も必要です。

後で Chrome に戻す場合も `--browser chrome` と希望する保存済み JSON を指定して同じ復元コマンドを使います。形式は元ブラウザーに依存しません。復元はリンクを結合せず、一つの移行先ボードを置き換えます。両方の版が必要になりそうなら自動保存された移行先コピーを保持してください。

コマンドの待機中は他のタブやプロファイルからエクスポートしないでください。ブラウザーごとに別々のコマンドを実行します。これは一度限りの移行であり、後の編集は同期されません。

## ローカル限定の保存と検証

出力先はこのチェックアウト内の固定ディレクトリ `backups/` です。コマンドは Git の無視対象で、追跡中ファイルがないことを確認します。出力ディレクトリがシンボリックリンクなら拒否します。バックアップごとに固有の名前で他のファイルを上書きせず保存し、再読込します。件数とダイジェストを含み、タイトルや URL は含まない `.receipt.json` も作成します。不正な入力ではバックアップを作りません。CLI はアプリのスキーマ、base64、ラスター画像ヘッダーの検証を再利用します。移行先アプリはアトミックなインポート前に画像のデコードも行います。

復元にはボードの `.json` を使い、付随する `.receipt.json` は使わないでください。レシートは検証メタデータだけで、ボードを復元できません。旧バックアップやダウンロード原本を自動削除することはありません。必要なコピーを残し、保存領域はローカルで管理してください。

macOS/Linux のディレクトリは `0700`、ファイルは `0600` です。Windows はアカウントのファイルシステム ACL でアクセスを制限してください。POSIX モードは ACL を保証しません。JSON バックアップは平文です。スクリプトにアップロードや同期のコードはありません。フォルダーは Git、Docker ビルド入力、公開フロントエンドの許可リストから除外されます。`.gitignore` は Git への強制追加、手動共有、OS バックアップ、別途設定した同期クライアントを防ぎません。ローカル限定にするにはチェックアウトとダウンロード先を同期対象外に置いてください。

スクリプト、テスト、文書、公開サイトにボードデータは埋め込まれません。[ブラウザー保存領域の制約](local-speedial.md#what-is-private-and-what-is-not)と[移行の受入確認](browser-migration.md)を参照してください。
