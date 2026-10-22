# Skrip pencadangan dan pemulihan browser lokal

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

[Panduan migrasi](browser-migration.md) · [Semua opsi penerapan](../README.md#storage-and-deployment)

Skrip ini mempertahankan **papan Speed Dial**: urutan tautan, judul, seluruh byte gambar, baris, kolom, preferensi pembukaan, dan bahasa. Skrip tidak mencadangkan riwayat browser, kata sandi, ekstensi, atau markah lain. Format yang digunakan ialah JSON portabel aplikasi `speedial-local-backup`, bukan basis data internal Chrome atau Firefox.

Skrip bekerja pada aplikasi lokal browser di [speeddial.alvit.here.now](https://speeddial.alvit.here.now/). Skrip bukan pengganti [cadangan server](../wiki/Operations.md#backup-and-restore) untuk Node.js, Docker, atau k3s. Ekspor JSON server versi lama tidak diterima sebagai cadangan browser lengkap; memindahkan papan itu memerlukan [pengumpulan dan konversi gambar](browser-migration.md).

Jika papan masih berada di `speedial.alvit.here.now`, ekspor dahulu dari alamat yang persis itu; skrip kini membuka `speeddial.alvit.here.now`. Gunakan `--no-open` dengan tab lama yang sudah terbuka, atau arsipkan ekspor tersimpannya secara eksplisit. Berkas `speedial-local-backup` lama dan nama unduhan `speedial-backup-*.json` tetap didukung. Lihat [catatan migrasi alamat](local-speedial.md#corrected-address-and-existing-backups).

## Persyaratan dan dukungan browser

Jalankan Node.js 24+ dari checkout Git ini. Tidak perlu memasang paket tambahan. Di macOS, peluncur mengenali Chrome, Firefox, Safari, Edge, Brave, Arc, Opera, Vivaldi, Chromium, Orion, Zen, LibreWolf, dan Waterfox di `/Applications`, `~/Applications`, atau `/System/Applications`. Ini dukungan peluncur, bukan klaim bahwa setiap browser sudah diuji. Pengujian aplikasi otomatis menggunakan Chromium, Firefox, dan WebKit.

```sh
npm run backup:browser -- --list-browsers
```

Untuk browser macOS lain, gunakan `--app /absolute/path/Browser.app`. Untuk browser yang sudah terbuka, browser bawaan Codex, Windows, atau Linux, gunakan `--no-open` dan buka situs sendiri. Tidak diperlukan port debug, ekstensi, izin Aksesibilitas, atau akses langsung ke berkas profil.

```sh
npm run backup:browser -- --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --app "/Applications/Brave Browser.app"
```

URL peluncuran ditetapkan pada alamat utama. Papan pada origin lain harus diekspor dari origin yang sama persis; gunakan `--no-open` saat bekerja di sana dan periksa sendiri alamat tujuan. Penyimpanan browser tidak ikut berpindah karena pengalihan atau perubahan nama host.

**Skrip ini interaktif.** Skrip membuka aplikasi dan mengelola berkas lokal, tetapi Anda mengeklik ekspor, memilih berkas impor, dan menyetujui penggantian. Aplikasi bisa memiliki beberapa profil: pilih profil yang dimaksud dan gunakan [speeddial.alvit.here.now](https://speeddial.alvit.here.now/). Profil baru yang kosong adalah hal wajar. Skrip tidak dapat memastikan profil mana yang menghasilkan unduhan.

## Mencadangkan Chrome

```sh
npm run backup:browser -- --browser chrome
```

1. Pilih profil Chrome yang sudah ada, buka panah kanan atas, lalu klik **Export backup**.
2. Simpan dengan nama yang disarankan `speedial-backup-YYYY-MM-DD.json` di `~/Downloads`. Akhiran benturan nama seperti ` (1)` didukung.
3. Skrip menunggu ekspor baru yang lengkap, memvalidasi, menyalin ke `backups/`, membaca ulang salinan, lalu mencetak jalur, jumlah, dan SHA-256. Skrip tidak pernah memakai ekspor lama sebagai pengganti. Beberapa ekspor sekaligus menghasilkan kesalahan, bukan tebakan.

Gunakan `--downloads /absolute/local/folder` bila unduhan browser disimpan di tempat lain; pilih folder yang sama di browser. Pilih folder lokal di luar direktori sinkronisasi cloud. Waktu tunggu bawaan sepuluh menit; `--timeout 1200` mengubahnya menjadi dua puluh. Dialog browser **Save As** mungkin harus dikonfirmasi sebelum berkas terbentuk. Untuk ekspor yang diganti nama atau sudah diunduh:

```sh
npm run backup:browser -- --file /absolute/local/export.json
```

Mode berkas eksplisit mengarsipkan berkas tersebut; mode ini **tidak** mengambil data browser saat ini atau memastikan kebaruannya. Unduhan asli tetap disimpan. Ekspor yang dikumpulkan pemantau dibatasi ke mode `0600` di POSIX; berkas masukan eksplisit tidak berubah.

## Memulihkan ke browser lain

Ganti `YOUR-BACKUP.json` dengan nama cadangan yang dicetak:

```sh
npm run restore:browser -- backups/YOUR-BACKUP.json --browser firefox
npm run restore:browser -- backups/YOUR-BACKUP.json --browser chrome
npm run restore:browser -- backups/YOUR-BACKUP.json --browser safari
```

Perintah pemulihan memerlukan terminal interaktif dan memandu satu browser/profil setiap kali:

1. Perintah memvalidasi dan menyimpan salinan terpisah `restore-source`. Di profil tujuan, ekspor papan saat ini meski kosong. Skrip menyimpannya sebagai `before-restore` agar tetap dapat dipulihkan.
2. Konfirmasikan di terminal bahwa ekspor berasal dari profil tujuan yang benar dengan mengetik `RESTORE`.
3. Klik **Import backup** di browser yang sama, pilih berkas `restore-source` yang dicetak, periksa ringkasan, lalu klik **Replace this board**. Di pemilih berkas macOS, tekan **⌘⇧G** dan tempel jalur absolut.
4. Muat ulang Speed Dial, periksa gambar tampil, lalu ekspor lagi. Skrip mengarsipkan ekspor `after-restore` ini dan membandingkan urutan tautan, judul, byte gambar, kisi, preferensi pembukaan, dan bahasa dengan sumber. ID internal yang dibuat ulang serta stempel waktu diabaikan. Cadangan lama tanpa bahasa membiarkan bahasa tujuan tetap sama.

Keberhasilan hanya dilaporkan setelah isi cocok. Ketidakcocokan atau kehabisan waktu **bukan** pemulihan terverifikasi. Semua salinan disimpan; tidak ada pengembalian otomatis. Untuk mengembalikan, ulangi perintah dengan berkas `before-restore` tersimpan. Ekspor yang cocok membuktikan kesamaan isi; profil, origin, dan gambar yang terlihat tetap harus diperiksa.

Untuk kembali ke Chrome kemudian, gunakan perintah pemulihan yang sama dengan `--browser chrome` dan JSON tersimpan yang diinginkan. Format tidak bergantung pada browser sumber. Setiap pemulihan mengganti satu papan tujuan, bukan menggabungkan tautan; simpan salinan tujuan yang dilindungi otomatis bila kedua versi mungkin dibutuhkan.

Jangan mengekspor dari tab atau profil lain saat perintah sedang menunggu. Jalankan perintah terpisah untuk browser berbeda. Ini pemindahan satu kali; perubahan berikutnya tidak disinkronkan.

## Penyimpanan hanya lokal dan validasi

Semua keluaran skrip masuk ke direktori tetap `backups/` dalam checkout ini. Perintah memeriksa bahwa Git mengabaikannya dan tidak ada berkas terlacak. Direktori keluaran berupa tautan simbolis ditolak. Setiap cadangan memiliki nama unik, disimpan tanpa menimpa berkas lain, dibaca ulang, dan dilengkapi `.receipt.json` berisi jumlah serta digest, tanpa judul atau URL. Masukan tidak valid tidak membuat cadangan. CLI memakai kembali validasi skema, base64, dan header raster aplikasi; aplikasi tujuan juga mendekode gambar sebelum impor atomik.

Gunakan berkas papan `.json` untuk pemulihan, bukan pasangan `.receipt.json`. Bukti hanya mencatat metadata verifikasi dan tidak dapat memulihkan papan. Skrip tidak menghapus cadangan lama atau unduhan asli secara otomatis; simpan salinan yang dibutuhkan dan kelola penyimpanannya secara lokal.

Di macOS/Linux, direktori bermode `0700` dan berkas `0600`. Di Windows, batasi akses dengan ACL sistem berkas akun; mode POSIX tidak menjamin ACL. Cadangan JSON berupa teks tanpa enkripsi. Skrip tidak memiliki kode unggah atau sinkronisasi. Folder dikecualikan dari Git, masukan build Docker, dan daftar izin frontend publik. `.gitignore` tidak mencegah penambahan paksa ke Git, berbagi manual, cadangan OS, atau klien sinkronisasi yang dikonfigurasi terpisah. Untuk penyimpanan hanya lokal, letakkan checkout serta folder unduhan di luar direktori tersinkron.

Data papan tidak tertanam dalam skrip, pengujian, dokumentasi, atau situs publik. Lihat [batas penyimpanan browser](local-speedial.md#what-is-private-and-what-is-not) dan [penerimaan migrasi](browser-migration.md).
