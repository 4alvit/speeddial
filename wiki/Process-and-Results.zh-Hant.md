# 原始碼、部署與驗證

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

[Wiki 首頁](Home.md)

公開儲存庫 `speeddial` 包含應用的兩個版本、測試、通用部署示例和文件。它使用新的 Git 歷史與合成測試資料。私有維運檔案儲存歷史資料及恢復記錄，採用固定的公開原始碼修訂版或不可變映象，而不重複應用程式碼。

[瀏覽器本地應用](https://speeddial.alvit.here.now/) 為每位訪客提供空面板。釋出程式碼不會把個人連結或截圖複製到其他瀏覽器。[備份指令碼](../docs/browser-backups.zh-Hant.md) 引導有意執行的轉移，先保留目標救援副本，再在恢復後精確比較內容。

## 部署流程

![原始碼驗證、隔離恢復演練、部署和驗收是不同階段。](images/release-process.svg)

伺服器版本仍支援 Node.js、Docker 和 k3s。固定公開修訂版，建置或選擇經過驗證的不可變映象，並在儲存庫之外應用私有配置。將憑據及持久資料卷與應用映象分開。遷移現有安裝時使用[切換與回滾指南](../deploy/README.md)。

## 儲存庫與資料邊界

![公開應用原始碼支援私有部署；個人瀏覽器資料與伺服器恢復記錄保持私有。](images/release-results.svg)

公開原始碼不包含個人初始面板。本地瀏覽器備份保留在 Git 忽略的 `backups/` 中；伺服器恢復集包含 SQLite、引用的影象檔案以及單獨保護的憑據。兩種格式服務不同版本，不能互換。

## 驗證

本地和 CI 檢查驗證合成測試資料及其實際執行的場景。兩個版本都保留五種語言、摺疊控制元件、兩兩交換、跟隨指標的預覽、網格尺寸，以及預設同視窗導航。

伺服器遷移演練比較 ID、順序、標題、URL、設定、影象引用和 SQLite 完整性。輪換檢查驗證舊會話在重啟後失效。實際部署驗收還檢查目標環境中的預期路由、憑據、影象可用性和資料保留。

原始碼檢查透過並不能證明部署或恢復已發生。真實部署回執和個人清單應保持私有。圖表描述架構與流程，而非效能、可用性或恢復時間保證。公開原始碼仍為 `UNLICENSED`。
