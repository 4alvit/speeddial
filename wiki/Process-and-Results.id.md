# Sumber, penerapan, dan verifikasi

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

[Beranda wiki](Home.md)

Repositori publik `speeddial` memuat kedua edisi aplikasi, pengujian, contoh penerapan umum, dan dokumentasi. Repositori dimulai dengan riwayat Git baru dan data uji sintetis. Arsip operasional privat menyimpan bahan historis dan catatan pemulihan, menggunakan revisi sumber publik yang dipatok atau image tetap tanpa menggandakan kode aplikasi.

[Aplikasi lokal browser](https://speeddial.alvit.here.now/) memberi setiap pengunjung papan kosong. Penerbitan kode tidak menyalin tautan atau tangkapan layar pribadi ke browser lain. [Skrip pencadangan](../docs/browser-backups.id.md) memandu pemindahan yang disengaja dengan salinan penyelamatan tujuan dan perbandingan isi persis setelah pemulihan.

## Proses penerapan

![Validasi sumber, latihan pemulihan terisolasi, penerapan, dan penerimaan merupakan tahap terpisah.](images/release-process.svg)

Edisi server tetap mendukung Node.js, Docker, dan k3s. Patok revisi publik, buat atau pilih image tetap yang terverifikasi, lalu terapkan konfigurasi privat di luar repositori. Pisahkan kredensial dan volume data persisten dari image aplikasi. Gunakan [panduan peralihan dan pengembalian](../deploy/README.md) untuk migrasi instalasi yang sudah ada.

## Batas repositori dan data

![Kode aplikasi publik mendukung penerapan privat; data browser pribadi dan catatan pemulihan server tetap privat.](images/release-results.svg)

Sumber publik tidak memuat papan pribadi awal. Cadangan browser lokal berada di `backups/` yang diabaikan Git; set pemulihan server memuat SQLite, berkas gambar yang dirujuk, dan kredensial yang dilindungi terpisah. Format-format ini melayani edisi berbeda dan tidak saling menggantikan.

## Verifikasi

Pemeriksaan lokal dan CI memvalidasi data sintetis dan skenario yang dijalankan. Kedua edisi mempertahankan lima bahasa, kontrol terlipat, pertukaran berpasangan, pratinjau mengikuti penunjuk, dimensi kisi, dan navigasi di jendela yang sama secara bawaan.

Latihan migrasi server membandingkan ID, urutan, judul, URL, pengaturan, rujukan gambar, dan integritas SQLite. Pemeriksaan rotasi memastikan sesi lama gagal setelah mulai ulang. Penerimaan penerapan sesungguhnya juga memeriksa perutean yang dimaksud, kredensial, ketersediaan gambar, dan pelestarian data di lingkungan tujuan.

Pemeriksaan sumber yang lulus tidak membuktikan penerapan atau pemulihan pernah terjadi. Simpan bukti penerapan nyata dan inventaris pribadi secara privat. Diagram menjelaskan arsitektur dan proses, bukan jaminan kinerja, ketersediaan, atau waktu pemulihan. Sumber publik tetap `UNLICENSED`.
