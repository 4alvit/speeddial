# 浏览器本地备份与恢复脚本

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

[迁移操作手册](browser-migration.md) · [所有部署方式](../README.md#storage-and-deployment)

这些脚本保存 **Speed Dial 面板**：有序链接、标题、完整图像字节、行数、列数、打开偏好和语言。它们不备份浏览历史、密码、扩展或其他书签。使用的是应用可移植的 `speedial-local-backup` JSON 格式，而不是 Chrome 或 Firefox 的内部数据库。

脚本用于 [speeddial.alvit.here.now](https://speeddial.alvit.here.now/) 上的浏览器本地应用，不能替代 Node.js、Docker 或 k3s 部署的[服务器备份](../wiki/Operations.md#backup-and-restore)。服务器旧版 JSON 导出不被视为完整浏览器备份；转移这种面板需要执行[图像收集与转换流程](browser-migration.md)。

如果面板仍在旧地址 `speedial.alvit.here.now`，请先从这个确切地址导出；脚本现在打开的是 `speeddial.alvit.here.now`。对已打开的旧标签页使用 `--no-open`，或明确归档其已保存的导出文件。旧 `speedial-local-backup` 文件和 `speedial-backup-*.json` 下载名称仍受支持。参见[地址迁移说明](local-speedial.md#corrected-address-and-existing-backups)。

## 要求与浏览器支持

从此 Git 工作副本运行 Node.js 24+，无需安装额外的软件包。在 macOS 上，启动器能识别 `/Applications`、`~/Applications` 或 `/System/Applications` 中的 Chrome、Firefox、Safari、Edge、Brave、Arc、Opera、Vivaldi、Chromium、Orion、Zen、LibreWolf 和 Waterfox。这表示支持启动，并不声称每个列出的浏览器都经过测试。应用自动化测试使用 Chromium、Firefox 和 WebKit。

```sh
npm run backup:browser -- --list-browsers
```

其他 macOS 浏览器可使用 `--app /absolute/path/Browser.app`。对于已打开的浏览器、Codex 内置浏览器、Windows 或 Linux，请使用 `--no-open` 并自行打开网站。无需调试端口、扩展、辅助功能权限或直接访问配置文件。

```sh
npm run backup:browser -- --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --app "/Applications/Brave Browser.app"
```

启动 URL 固定为主地址。其他源上的现有面板必须从该确切源导出；在那里操作时使用 `--no-open`，并自行检查目标地址。浏览器存储不会随重定向或主机名变更而迁移。

**这些脚本需要交互。** 它们打开应用并管理本地文件，但导出按钮、导入文件选择和替换确认由您操作。一个应用可能有多个用户配置文件：请选择预期配置文件，并使用 [speeddial.alvit.here.now](https://speeddial.alvit.here.now/)。新配置文件为空是正常现象。脚本无法证明某次下载来自哪个配置文件。

## 备份 Chrome

```sh
npm run backup:browser -- --browser chrome
```

1. 选择现有 Chrome 配置文件，展开右上角箭头，点击 **Export backup**。
2. 使用建议的文件名 `speedial-backup-YYYY-MM-DD.json` 保存到 `~/Downloads`。支持 ` (1)` 等重名后缀。
3. 脚本等待一个新的完整导出，验证后复制到 `backups/`，重新读取副本并输出路径、数量和 SHA-256。它绝不会退回使用旧导出。出现多个同时导出时会报错，而不是猜测选择。

如果浏览器下载到其他位置，请使用 `--downloads /absolute/local/folder`，并在浏览器中选择相同文件夹。请选择云同步目录以外的本地文件夹。默认等待十分钟；`--timeout 1200` 将其改为二十分钟。浏览器的 **Save As** 对话框可能需要确认后才会生成文件。对于重命名或已下载的导出：

```sh
npm run backup:browser -- --file /absolute/local/export.json
```

明确指定文件的模式仅归档该文件；它**不会**获取当前浏览器数据，也不能证明数据是最新的。下载原件会保留。监视器收集的导出在 POSIX 上限制为 `0600`；明确指定的输入文件保持不变。

## 恢复到其他浏览器

将 `YOUR-BACKUP.json` 替换为输出的备份文件名：

```sh
npm run restore:browser -- backups/YOUR-BACKUP.json --browser firefox
npm run restore:browser -- backups/YOUR-BACKUP.json --browser chrome
npm run restore:browser -- backups/YOUR-BACKUP.json --browser safari
```

恢复命令需要交互式终端，每次引导一个浏览器/配置文件：

1. 它验证并保留单独的 `restore-source` 副本。在目标配置文件中导出当前面板，即使为空也要导出。脚本将其保存为 `before-restore`，以便恢复该面板。
2. 在终端输入 `RESTORE`，确认导出来自正确的目标配置文件。
3. 在同一浏览器中点击 **Import backup**，选择输出的 `restore-source` 文件，检查摘要后点击 **Replace this board**。在 macOS 文件选择器中可按 **⌘⇧G** 并粘贴绝对路径。
4. 重新加载 Speed Dial，检查图像显示，然后再次导出。脚本归档此次 `after-restore` 导出，并将有序链接、标题、图像字节、网格、打开偏好和语言与源文件比较。重新生成的内部 ID 和时间戳会被忽略。缺少语言字段的旧备份保留目标原有语言。

只有内容匹配才报告成功。内容不一致或超时**不算**经过验证的恢复。所有副本都会保留；没有自动回滚。若要回滚，请用保存的 `before-restore` 文件重复命令。导出一致证明内容相同，但仍需检查配置文件、源和可见图像。

之后返回 Chrome 时，使用相同恢复命令，加上 `--browser chrome` 和所需的已保存 JSON 文件。格式不依赖源浏览器。每次恢复替换一个目标面板，而不是合并链接；如果可能需要两种版本，请保留自动保存的目标副本。

命令等待期间，不要从其他标签页或配置文件导出。不同浏览器分别执行命令。这是一次性转移；之后的编辑不会同步。

## 仅本地存储与验证

所有脚本输出都进入此工作副本固定的 `backups/` 目录。命令检查 Git 是否忽略它，以及其中是否存在受跟踪文件。输出目录若是符号链接会被拒绝。每个备份名称唯一，写入时不覆盖其他文件，写完重新读取，并附有包含数量和摘要、但没有标题或 URL 的 `.receipt.json`。无效输入不会创建备份。CLI 复用应用的模式、base64 和光栅图像头验证；目标应用还会在原子导入前解码图像。

恢复请使用面板的 `.json` 文件，而不是配套的 `.receipt.json`。回执只记录验证元数据，无法恢复面板。脚本不自动删除旧备份或下载原件；请保留需要的副本，在本地管理存储空间。

在 macOS/Linux 上，目录权限为 `0700`，文件为 `0600`。在 Windows 上，请通过账户的文件系统 ACL 限制访问；POSIX 权限不能保证 ACL。JSON 备份是明文。脚本没有上传或同步代码。该文件夹被排除在 Git、Docker 构建输入及公共前端允许列表之外。`.gitignore` 不能阻止强制加入 Git、手动分享、操作系统备份或另行配置的同步客户端。若要求仅本地存储，请把工作副本及下载文件夹放在同步目录之外。

脚本、测试、文档和公共网站均不内嵌面板数据。参见[浏览器存储限制](local-speedial.md#what-is-private-and-what-is-not)和[迁移验收](browser-migration.md)。
