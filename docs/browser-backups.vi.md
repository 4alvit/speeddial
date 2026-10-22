# Tập lệnh sao lưu và khôi phục trình duyệt cục bộ

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

[Hướng dẫn di chuyển](browser-migration.md) · [Mọi cách triển khai](../README.md#storage-and-deployment)

Các tập lệnh giữ nguyên **bảng Speed Dial**: thứ tự liên kết, tiêu đề, toàn bộ byte ảnh, hàng, cột, cách mở và ngôn ngữ. Chúng không sao lưu lịch sử, mật khẩu, tiện ích mở rộng hay dấu trang khác của trình duyệt. Chúng dùng định dạng JSON di động `speedial-local-backup` của ứng dụng, không dùng cơ sở dữ liệu nội bộ Chrome hay Firefox.

Chúng làm việc với ứng dụng cục bộ trong trình duyệt tại [speeddial.alvit.here.now](https://speeddial.alvit.here.now/). Chúng không thay [bản sao lưu máy chủ](../wiki/Operations.md#backup-and-restore) cho Node.js, Docker hoặc k3s. JSON xuất theo kiểu cũ của máy chủ không được chấp nhận là bản sao lưu trình duyệt đầy đủ; muốn chuyển bảng đó phải [thu thập và chuyển đổi ảnh](browser-migration.md).

Nếu bảng còn ở `speedial.alvit.here.now`, hãy xuất từ đúng địa chỉ đó trước; hiện các tập lệnh mở `speeddial.alvit.here.now`. Dùng `--no-open` với thẻ cũ đang mở, hoặc chỉ định lưu trữ bản xuất đã lưu. Tệp `speedial-local-backup` cũ và tên tải xuống `speedial-backup-*.json` vẫn được hỗ trợ. Xem [ghi chú chuyển địa chỉ](local-speedial.md#corrected-address-and-existing-backups).

## Yêu cầu và hỗ trợ trình duyệt

Chạy Node.js 24+ từ bản checkout Git này. Không cần cài thêm gói. Trên macOS, bộ khởi chạy nhận diện Chrome, Firefox, Safari, Edge, Brave, Arc, Opera, Vivaldi, Chromium, Orion, Zen, LibreWolf và Waterfox tại `/Applications`, `~/Applications` hoặc `/System/Applications`. Đây là hỗ trợ khởi chạy, không khẳng định mọi trình duyệt đã được kiểm thử. Kiểm thử tự động dùng Chromium, Firefox và WebKit.

```sh
npm run backup:browser -- --list-browsers
```

Với trình duyệt macOS khác, dùng `--app /absolute/path/Browser.app`. Với trình duyệt đang mở, trình duyệt tích hợp Codex, Windows hoặc Linux, dùng `--no-open` rồi tự mở trang. Không cần cổng gỡ lỗi, tiện ích mở rộng, quyền Trợ năng hay truy cập trực tiếp tệp hồ sơ.

```sh
npm run backup:browser -- --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --app "/Applications/Brave Browser.app"
```

URL khởi chạy cố định ở địa chỉ chính. Bảng tại origin khác phải được xuất từ đúng origin đó; dùng `--no-open` khi làm việc ở đó và tự kiểm tra địa chỉ đích. Bộ nhớ trình duyệt không chuyển theo chuyển hướng hay thay tên máy chủ.

**Đây là các tập lệnh tương tác.** Chúng mở ứng dụng và quản lý tệp cục bộ, còn bạn bấm xuất, chọn tệp nhập và xác nhận thay thế. Ứng dụng có thể có nhiều hồ sơ: chọn hồ sơ cần dùng và truy cập [speeddial.alvit.here.now](https://speeddial.alvit.here.now/). Hồ sơ mới trống là bình thường. Tập lệnh không thể chứng nhận hồ sơ nào tạo ra tệp tải xuống.

## Sao lưu từ Chrome

```sh
npm run backup:browser -- --browser chrome
```

1. Chọn hồ sơ Chrome hiện có, mở mũi tên phía trên bên phải và bấm **Export backup**.
2. Lưu theo tên gợi ý `speedial-backup-YYYY-MM-DD.json` trong `~/Downloads`. Hậu tố khi trùng tên như ` (1)` được hỗ trợ.
3. Tập lệnh chờ bản xuất mới hoàn chỉnh, xác thực, chép vào `backups/`, đọc lại bản sao rồi in đường dẫn, số lượng và SHA-256. Nó không bao giờ dùng bản xuất cũ để thay thế. Nhiều bản xuất đồng thời gây lỗi thay vì đoán chọn.

Dùng `--downloads /absolute/local/folder` nếu trình duyệt tải về nơi khác; chọn cùng thư mục trong trình duyệt. Chọn thư mục cục bộ nằm ngoài đồng bộ đám mây. Thời gian chờ mặc định mười phút; `--timeout 1200` đổi thành hai mươi phút. Có thể cần xác nhận hộp thoại **Save As** trước khi tệp tồn tại. Với bản xuất đã đổi tên hoặc đã tải về:

```sh
npm run backup:browser -- --file /absolute/local/export.json
```

Chế độ chỉ định tệp lưu trữ chính tệp đó; nó **không** lấy dữ liệu trình duyệt hiện tại hay chứng minh tính mới. Bản tải xuống gốc được giữ lại. Bản xuất do trình theo dõi thu thập bị giới hạn ở chế độ `0600` trên POSIX; tệp đầu vào chỉ định rõ được giữ nguyên.

## Khôi phục sang trình duyệt khác

Thay `YOUR-BACKUP.json` bằng tên bản sao lưu đã in:

```sh
npm run restore:browser -- backups/YOUR-BACKUP.json --browser firefox
npm run restore:browser -- backups/YOUR-BACKUP.json --browser chrome
npm run restore:browser -- backups/YOUR-BACKUP.json --browser safari
```

Lệnh khôi phục cần thiết bị đầu cuối tương tác và hướng dẫn từng trình duyệt/hồ sơ một:

1. Nó xác thực và giữ bản sao riêng `restore-source`. Trong hồ sơ đích, xuất bảng hiện tại dù trống. Tập lệnh lưu thành `before-restore` để vẫn có thể phục hồi bảng này.
2. Xác nhận trong thiết bị đầu cuối rằng bản xuất đến từ đúng hồ sơ đích bằng cách gõ `RESTORE`.
3. Bấm **Import backup** trong cùng trình duyệt, chọn tệp `restore-source` được chỉ ra, kiểm tra tóm tắt rồi bấm **Replace this board**. Trên macOS, nhấn **⌘⇧G** trong hộp chọn tệp và dán đường dẫn tuyệt đối.
4. Tải lại Speed Dial, kiểm tra ảnh hiển thị rồi xuất lần nữa. Tập lệnh lưu bản xuất `after-restore` này và so sánh thứ tự liên kết, tiêu đề, byte ảnh, lưới, cách mở và ngôn ngữ với nguồn. ID nội bộ được tạo lại và dấu thời gian bị bỏ qua. Bản sao lưu cũ thiếu ngôn ngữ giữ nguyên ngôn ngữ đích.

Chỉ báo thành công sau khi nội dung khớp. Sai khác hay hết thời gian **không** phải khôi phục đã xác minh. Giữ mọi bản sao; không tự động hoàn tác. Để hoàn tác, lặp lệnh với tệp `before-restore` đã lưu. Các bản xuất khớp chứng minh nội dung bằng nhau; vẫn cần kiểm tra hồ sơ, origin và ảnh hiển thị.

Muốn quay lại Chrome sau đó, dùng cùng lệnh với `--browser chrome` và JSON đã lưu mong muốn. Định dạng không phụ thuộc trình duyệt nguồn. Mỗi lần khôi phục thay một bảng đích thay vì gộp liên kết; giữ bản sao đích tự động nếu có thể cần cả hai phiên bản.

Không xuất từ thẻ hoặc hồ sơ khác khi lệnh đang chờ. Chạy lệnh riêng cho các trình duyệt khác nhau. Đây là chuyển một lần; chỉnh sửa sau đó không đồng bộ.

## Chỉ lưu cục bộ và xác thực

Mọi đầu ra tập lệnh vào thư mục cố định `backups/` trong checkout này. Lệnh kiểm tra Git bỏ qua thư mục và không có tệp được theo dõi. Thư mục đầu ra là liên kết tượng trưng bị từ chối. Mỗi bản sao có tên riêng, được ghi không đè tệp khác, đọc lại và đi kèm `.receipt.json` chứa số lượng và mã băm, không chứa tiêu đề hay URL. Đầu vào không hợp lệ không tạo bản sao. CLI dùng lại kiểm tra lược đồ, base64 và tiêu đề ảnh raster của ứng dụng; ứng dụng đích còn giải mã ảnh trước khi nhập nguyên tử.

Dùng tệp bảng `.json` để khôi phục, không dùng `.receipt.json` đi kèm. Biên nhận chỉ ghi siêu dữ liệu xác minh và không thể khôi phục bảng. Tập lệnh không tự xóa bản sao cũ hay bản tải xuống gốc; giữ các bản cần thiết và quản lý dung lượng cục bộ.

Trên macOS/Linux, thư mục có chế độ `0700`, tệp `0600`. Trên Windows, hạn chế truy cập bằng ACL hệ thống tệp của tài khoản; chế độ POSIX không đảm bảo ACL. Bản sao JSON là văn bản không mã hóa. Tập lệnh không có mã tải lên hay đồng bộ. Thư mục bị loại khỏi Git, đầu vào xây dựng Docker và danh sách cho phép frontend công khai. `.gitignore` không ngăn ép thêm vào Git, chia sẻ thủ công, sao lưu hệ điều hành hay ứng dụng đồng bộ được cấu hình riêng. Để chỉ lưu cục bộ, đặt checkout và thư mục tải xuống ngoài các thư mục đồng bộ.

Không nhúng dữ liệu bảng vào tập lệnh, kiểm thử, tài liệu hoặc trang công khai. Xem [giới hạn bộ nhớ trình duyệt](local-speedial.md#what-is-private-and-what-is-not) và [nghiệm thu chuyển dữ liệu](browser-migration.md).
