# 瀏覽器本地備份與恢復指令碼

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

[遷移操作手冊](browser-migration.md) · [所有部署方式](../README.md#storage-and-deployment)

這些指令碼儲存 **Speed Dial 面板**：有序連結、標題、完整影象位元組、行數、列數、開啟偏好和語言。它們不備份瀏覽歷史、密碼、擴充套件或其他書籤。使用的是應用可移植的 `speedial-local-backup` JSON 格式，而不是 Chrome 或 Firefox 的內部資料庫。

指令碼用於 [speeddial.alvit.here.now](https://speeddial.alvit.here.now/) 上的瀏覽器本地應用，不能替代 Node.js、Docker 或 k3s 部署的[伺服器備份](../wiki/Operations.md#backup-and-restore)。伺服器舊版 JSON 匯出不被視為完整瀏覽器備份；轉移這種面板需要執行[影象收集與轉換流程](browser-migration.md)。

如果面板仍在舊地址 `speedial.alvit.here.now`，請先從這個確切地址匯出；指令碼現在開啟的是 `speeddial.alvit.here.now`。對已開啟的舊標籤頁使用 `--no-open`，或明確歸檔其已儲存的匯出檔案。舊 `speedial-local-backup` 檔案和 `speedial-backup-*.json` 下載名稱仍受支援。參見[地址遷移說明](local-speedial.md#corrected-address-and-existing-backups)。

## 要求與瀏覽器支援

從此 Git 工作副本執行 Node.js 24+，無需安裝額外的軟體包。在 macOS 上，啟動器能識別 `/Applications`、`~/Applications` 或 `/System/Applications` 中的 Chrome、Firefox、Safari、Edge、Brave、Arc、Opera、Vivaldi、Chromium、Orion、Zen、LibreWolf 和 Waterfox。這表示支援啟動，並不聲稱每個列出的瀏覽器都經過測試。應用自動化測試使用 Chromium、Firefox 和 WebKit。

```sh
npm run backup:browser -- --list-browsers
```

其他 macOS 瀏覽器可使用 `--app /absolute/path/Browser.app`。對於已開啟的瀏覽器、Codex 內建瀏覽器、Windows 或 Linux，請使用 `--no-open` 並自行開啟網站。無需除錯埠、擴充套件、輔助功能許可權或直接訪問配置檔案。

```sh
npm run backup:browser -- --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --app "/Applications/Brave Browser.app"
```

啟動 URL 固定為主地址。其他源上的現有面板必須從該確切源匯出；在那裡操作時使用 `--no-open`，並自行檢查目標地址。瀏覽器儲存不會隨重定向或主機名變更而遷移。

**這些指令碼需要互動。** 它們開啟應用並管理本地檔案，但匯出按鈕、匯入檔案選擇和替換確認由您操作。一個應用可能有多個使用者配置檔案：請選擇預期配置檔案，並使用 [speeddial.alvit.here.now](https://speeddial.alvit.here.now/)。新配置檔案為空是正常現象。指令碼無法證明某次下載來自哪個配置檔案。

## 備份 Chrome

```sh
npm run backup:browser -- --browser chrome
```

1. 選擇現有 Chrome 配置檔案，展開右上角箭頭，點選 **Export backup**。
2. 使用建議的檔名 `speedial-backup-YYYY-MM-DD.json` 儲存到 `~/Downloads`。支援 ` (1)` 等重名字尾。
3. 指令碼等待一個新的完整匯出，驗證後複製到 `backups/`，重新讀取副本並輸出路徑、數量和 SHA-256。它絕不會退回使用舊匯出。出現多個同時匯出時會報錯，而不是猜測選擇。

如果瀏覽器下載到其他位置，請使用 `--downloads /absolute/local/folder`，並在瀏覽器中選擇相同資料夾。請選擇雲同步目錄以外的本地資料夾。預設等待十分鐘；`--timeout 1200` 將其改為二十分鐘。瀏覽器的 **Save As** 對話方塊可能需要確認後才會生成檔案。對於重新命名或已下載的匯出：

```sh
npm run backup:browser -- --file /absolute/local/export.json
```

明確指定檔案的模式僅歸檔該檔案；它**不會**獲取當前瀏覽器資料，也不能證明資料是最新的。下載原件會保留。監視器收集的匯出在 POSIX 上限制為 `0600`；明確指定的輸入檔案保持不變。

## 恢復到其他瀏覽器

將 `YOUR-BACKUP.json` 替換為輸出的備份檔名：

```sh
npm run restore:browser -- backups/YOUR-BACKUP.json --browser firefox
npm run restore:browser -- backups/YOUR-BACKUP.json --browser chrome
npm run restore:browser -- backups/YOUR-BACKUP.json --browser safari
```

恢復命令需要互動式終端，每次引導一個瀏覽器/配置檔案：

1. 它驗證並保留單獨的 `restore-source` 副本。在目標配置檔案中匯出當前面板，即使為空也要匯出。指令碼將其儲存為 `before-restore`，以便恢復該面板。
2. 在終端輸入 `RESTORE`，確認匯出來自正確的目標配置檔案。
3. 在同一瀏覽器中點選 **Import backup**，選擇輸出的 `restore-source` 檔案，檢查摘要後點選 **Replace this board**。在 macOS 檔案選擇器中可按 **⌘⇧G** 並貼上絕對路徑。
4. 重新載入 Speed Dial，檢查影象顯示，然後再次匯出。指令碼歸檔此次 `after-restore` 匯出，並將有序連結、標題、影象位元組、網格、開啟偏好和語言與原始檔比較。重新生成的內部 ID 和時間戳會被忽略。缺少語言欄位的舊備份保留目標原有語言。

只有內容匹配才報告成功。內容不一致或超時**不算**經過驗證的恢復。所有副本都會保留；沒有自動回滾。若要回滾，請用儲存的 `before-restore` 檔案重複命令。匯出一致證明內容相同，但仍需檢查配置檔案、來源和可見影像。

之後返回 Chrome 時，使用相同恢復命令，加上 `--browser chrome` 和所需的已儲存 JSON 檔案。格式不依賴源瀏覽器。每次恢復替換一個目標面板，而不是合併連結；如果可能需要兩種版本，請保留自動儲存的目標副本。

命令等待期間，不要從其他標籤頁或配置檔案匯出。不同瀏覽器分別執行命令。這是一次性轉移；之後的編輯不會同步。

## 僅本地儲存與驗證

所有指令碼輸出都進入此工作副本固定的 `backups/` 目錄。命令檢查 Git 是否忽略它，以及其中是否存在受跟蹤檔案。輸出目錄若是符號連結會被拒絕。每個備份名稱唯一，寫入時不覆蓋其他檔案，寫完重新讀取，並附有包含數量和摘要、但沒有標題或 URL 的 `.receipt.json`。無效輸入不會建立備份。CLI 複用應用的結構描述、base64 和點陣影象頭驗證；目標應用還會在不可分割匯入前解碼影象。

恢復請使用面板的 `.json` 檔案，而不是配套的 `.receipt.json`。回執只記錄驗證後設資料，無法恢復面板。指令碼不自動刪除舊備份或下載原件；請保留需要的副本，在本地管理儲存空間。

在 macOS/Linux 上，目錄許可權為 `0700`，檔案為 `0600`。在 Windows 上，請透過賬戶的檔案系統 ACL 限制訪問；POSIX 許可權不能保證 ACL。JSON 備份是明文。指令碼沒有上傳或同步程式碼。該資料夾被排除在 Git、Docker 建置輸入及公開前端允許列表之外。`.gitignore` 不能阻止強制加入 Git、手動分享、作業系統備份或另行配置的同步客戶端。若要求僅本地儲存，請把工作副本及下載資料夾放在同步目錄之外。

指令碼、測試、文件和公開網站均不內嵌面板資料。參見[瀏覽器儲存限制](local-speedial.md#what-is-private-and-what-is-not)和[遷移驗收](browser-migration.md)。
