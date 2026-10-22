# Mã nguồn, triển khai và xác minh

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

[Trang đầu wiki](Home.md)

Kho công khai `speeddial` chứa cả hai phiên bản ứng dụng, kiểm thử, ví dụ triển khai chung và tài liệu. Kho bắt đầu bằng lịch sử Git mới và dữ liệu thử tổng hợp. Kho lưu trữ vận hành riêng tư giữ tài liệu lịch sử và hồ sơ phục hồi, dùng bản sửa đổi mã công khai được ghim hoặc ảnh bất biến mà không nhân đôi mã ứng dụng.

[Ứng dụng cục bộ trong trình duyệt](https://speeddial.alvit.here.now/) cho mỗi khách bảng trống. Công khai mã không chép liên kết hay ảnh chụp cá nhân sang trình duyệt khác. [Tập lệnh sao lưu](../docs/browser-backups.vi.md) hướng dẫn chuyển có chủ đích, giữ bản cứu hộ của đích và so sánh nội dung chính xác sau khôi phục.

## Quy trình triển khai

![Xác thực nguồn, diễn tập khôi phục tách biệt, triển khai và nghiệm thu là các bước riêng.](images/release-process.svg)

Phiên bản máy chủ tiếp tục hỗ trợ Node.js, Docker và k3s. Ghim bản sửa đổi công khai, xây dựng hoặc chọn ảnh bất biến đã xác minh và áp dụng cấu hình riêng ngoài kho. Tách thông tin xác thực và ổ dữ liệu bền vững khỏi ảnh ứng dụng. Dùng [hướng dẫn chuyển đổi và hoàn tác](../deploy/README.md) khi di chuyển cài đặt hiện có.

## Ranh giới kho và dữ liệu

![Mã ứng dụng công khai phục vụ triển khai riêng; dữ liệu trình duyệt cá nhân và hồ sơ phục hồi máy chủ vẫn riêng tư.](images/release-results.svg)

Mã công khai không chứa bảng cá nhân ban đầu. Bản sao trình duyệt cục bộ nằm trong `backups/` được Git bỏ qua; bộ phục hồi máy chủ gồm SQLite, tệp ảnh được tham chiếu và thông tin xác thực bảo vệ riêng. Các định dạng phục vụ phiên bản khác nhau, không thay thế lẫn nhau.

## Xác minh

Kiểm tra cục bộ và CI xác thực dữ liệu tổng hợp và các kịch bản được chạy. Cả hai phiên bản giữ năm ngôn ngữ, điều khiển thu gọn, đổi chỗ từng cặp, xem trước theo con trỏ, kích thước lưới và mặc định điều hướng trong cùng cửa sổ.

Diễn tập chuyển máy chủ so sánh ID, thứ tự, tiêu đề, URL, thiết lập, tham chiếu ảnh và tính toàn vẹn SQLite. Kiểm tra xoay vòng xác nhận phiên cũ bị từ chối sau khởi động lại. Nghiệm thu thực tế còn kiểm tra định tuyến dự kiến, thông tin xác thực, ảnh khả dụng và bảo toàn dữ liệu trong môi trường đích.

Kiểm tra mã nguồn đạt không chứng minh đã triển khai hay khôi phục. Giữ riêng biên nhận triển khai thực tế và danh mục cá nhân. Sơ đồ mô tả kiến trúc và quy trình, không bảo đảm hiệu năng, khả dụng hoặc thời gian phục hồi. Mã công khai vẫn là `UNLICENSED`.
