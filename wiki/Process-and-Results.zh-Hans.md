# 源代码、部署与验证

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

[Wiki 首页](Home.md)

公共仓库 `speeddial` 包含应用的两个版本、测试、通用部署示例和文档。它使用新的 Git 历史与合成测试数据。私有运维档案保存历史资料及恢复记录，采用固定的公共源代码修订版或不可变镜像，而不重复应用代码。

[浏览器本地应用](https://speeddial.alvit.here.now/) 为每位访客提供空面板。发布代码不会把个人链接或截屏复制到其他浏览器。[备份脚本](../docs/browser-backups.zh-Hans.md) 引导有意执行的转移，先保留目标救援副本，再在恢复后精确比较内容。

## 部署流程

![源代码验证、隔离恢复演练、部署和验收是不同阶段。](images/release-process.svg)

服务器版本仍支持 Node.js、Docker 和 k3s。固定公共修订版，构建或选择经过验证的不可变镜像，并在仓库之外应用私有配置。将凭据及持久数据卷与应用镜像分开。迁移现有安装时使用[切换与回滚指南](../deploy/README.md)。

## 仓库与数据边界

![公共应用源代码支持私有部署；个人浏览器数据与服务器恢复记录保持私有。](images/release-results.svg)

公共源代码不包含个人初始面板。本地浏览器备份保留在 Git 忽略的 `backups/` 中；服务器恢复集包含 SQLite、引用的图像文件以及单独保护的凭据。两种格式服务不同版本，不能互换。

## 验证

本地和 CI 检查验证合成测试数据及其实际执行的场景。两个版本都保留五种语言、折叠控件、两两交换、跟随指针的预览、网格尺寸，以及默认同窗口导航。

服务器迁移演练比较 ID、顺序、标题、URL、设置、图像引用和 SQLite 完整性。轮换检查验证旧会话在重启后失效。实际部署验收还检查目标环境中的预期路由、凭据、图像可用性和数据保留。

源代码检查通过并不能证明部署或恢复已发生。真实部署回执和个人清单应保持私有。图表描述架构与流程，而非性能、可用性或恢复时间保证。公共源代码仍为 `UNLICENSED`。
