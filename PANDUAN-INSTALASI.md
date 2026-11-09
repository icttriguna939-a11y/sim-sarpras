# 📋 PANDUAN INSTALASI — SIM-SARPRAS SMA TRIGUNA 1956 (v1.0.1)

Aplikasi web untuk mengelola inventaris sarana-prasarana sekolah serta peminjaman dan pengembalian barang dengan scan QR.

| Bagian | Isi | Tempat |
|---|---|---|
| **Backend** | `Kode.gs`, `Data.gs`, `Migrasi.gs`, `DocEngine.gs`, `QrLib.gs`, `appsscript.json` | Google Apps Script |
| **Frontend** | `sim-sarpras-frontend.zip` → `index.html` (kios), `admin.html` (panel admin), `verifikasi.html`, `css/`, `js/`, `assets/` | GitHub Pages **dan/atau** Vercel |
| **Database** | Dibuat otomatis oleh `setupAplikasi()` | Google Sheets + folder Google Drive |

> ⏱️ Instalasi pertama memakan waktu ±30–45 menit. Kerjakan berurutan dari Bagian A sampai E.

---

## A. Pasang backend (Google Apps Script)

> ⚠️ Gunakan **akun Google sekolah yang akan menjadi pemilik data** (misalnya `icttriguna939@gmail.com`). Semua spreadsheet, folder, dan dokumen terbit akan disimpan di Drive akun ini.

1. Buka **https://script.google.com** → **Proyek baru**. Ubah judulnya menjadi `SIM-SARPRAS API`.
2. Klik ⚙️ **Setelan proyek** → centang **"Tampilkan file manifes appsscript.json di editor"**.
3. Kembali ke **Editor**, lalu buat berkas berikut dan tempelkan isinya satu per satu (tombol **＋ → Skrip**):

   | Nama berkas di editor | Isi dari |
   |---|---|
   | `Kode` (ganti nama `Code.gs` bawaan) | `Kode.gs` |
   | `Data` | `Data.gs` |
   | `Migrasi` | `Migrasi.gs` |
   | `DocEngine` | `DocEngine.gs` |
   | `QrLib` | `QrLib.gs` |
   | `appsscript.json` (sudah ada) | ganti seluruh isinya dengan `appsscript.json` |

4. Klik 💾 **Simpan**.
5. *(Opsional)* Bila ingin menentukan sendiri password awal: ⚙️ **Setelan proyek → Properti skrip → Tambahkan properti**, isi `INITIAL_ADMIN_PASSWORD` dengan nilai minimal 8 karakter.
6. Di dropdown fungsi, pilih **`setupAplikasi`** → klik ▶ **Jalankan**.
   - Bila muncul **"Perlu otorisasi"**, klik **Tinjau izin** → pilih akun → **Lanjutan → Buka SIM-SARPRAS API (tidak aman)** → **Izinkan**. Peringatan ini muncul karena skrip buatan sendiri belum diverifikasi Google, dan aman diizinkan.
   - Buka **Log eksekusi**. Pastikan muncul ✅ dan baris berikut:
     ```
     👤 Akun awal  → username: superadmin   password: Triguna123456
     ```
     **Catat password ini.**
   - Di Google Drive akan muncul folder **📁 SIM-SARPRAS SMA Triguna** berisi spreadsheet database serta folder *Dokumen Terbit*, *Template Dokumen*, dan *Backup*.
   - `setupAplikasi` aman dijalankan ulang. Fungsi ini hanya melengkapi sheet atau kolom yang kurang, dan tidak membuat database ganda.
7. Jalankan fungsi **`ujiQr`** sekali. Log harus menampilkan `QR PNG OK: … byte`.
8. **Deploy** → **Deployment baru** → ⚙️ pilih jenis **Aplikasi web**:
   - Deskripsi: `v1.0.0`
   - Jalankan sebagai: **Saya**
   - Siapa yang memiliki akses: **Siapa saja**
   - Klik **Deploy**, lalu **salin URL Aplikasi web** (berakhiran `/exec`).
9. Uji cepat: buka URL `/exec` tersebut di browser. Harus tampil JSON seperti `{"success":true,"data":{"app":"SIM-SARPRAS SMA TRIGUNA","versi":"1.0.0",…}}`.

---

## B. Siapkan frontend

1. Ekstrak `sim-sarpras-frontend.zip` ke folder biasa, misalnya `C:\sim-sarpras`.
   Folder hasil ekstraksi **langsung** berisi `index.html`, `admin.html`, `css\`, `js\`, `assets\`. **Folder inilah yang nanti di-`git init`.**
2. Buka `js\config.js` dengan Notepad, lalu ganti URL-nya:
   ```js
   GAS_URL: 'https://script.google.com/macros/s/XXXXXXXX/exec',   // ← URL dari langkah A.8
   ```
   Simpan.

---

## C. Pasang di GitHub Pages (repo baru)

1. Di github.com: **＋ → New repository**. Nama: `sim-sarpras`, pilih **Public**, dan **jangan** centang README/.gitignore/license → **Create repository**.
2. Buka PowerShell **di folder `C:\sim-sarpras`**. Caranya: buka foldernya di File Explorer, klik address bar, ketik `powershell`, lalu Enter.
3. Pastikan Anda berada di folder yang benar:
   ```powershell
   dir
   ```
   Harus terlihat `index.html`, `admin.html`, `css`, `js`, `assets`. **Kalau tidak terlihat, jangan lanjut.**
4. Jalankan **satu per satu**:
   ```powershell
   git init
   git add .
   git commit -m "SIM-SARPRAS v1.0.0"
   git branch -M main
   git remote add origin https://github.com/USERNAME/sim-sarpras.git
   git push -u origin main
   ```
   - **Username:** username GitHub Anda.
   - **Password:** isi dengan **Personal Access Token** (`ghp_…`), bukan password akun. Saat token di-paste, layar memang tidak menampilkan apa pun; itu normal. Token dibuat di https://github.com/settings/tokens → *Generate new token (classic)* → centang **repo**.
5. Di repo GitHub: **Settings → Pages** → Source **Deploy from a branch** → Branch **main / (root)** → **Save**. Centang **Enforce HTTPS** (wajib, karena kamera hanya berfungsi lewat HTTPS).
6. Tunggu 1–2 menit. Situs tersedia di `https://USERNAME.github.io/sim-sarpras/`:
   - Kios: `…/sim-sarpras/` (untuk perangkat khusus di ruang sarpras, tambahkan `?kiosk=1` agar layar otomatis kembali ke awal)
   - Panel admin: `…/sim-sarpras/admin.html`
   - Verifikasi dokumen: `…/sim-sarpras/verifikasi.html`

## D. Pasang juga di Vercel (opsional, dari repo yang sama)

1. Masuk **vercel.com** dengan akun GitHub → **Add New → Project** → pilih repo `sim-sarpras` → **Import**.
2. Framework Preset: **Other**. Root Directory: `./`. Build Command: *(kosong)*. Output Directory: *(kosong)* → **Deploy**.
3. Setiap kali Anda menjalankan `git push`, GitHub Pages **dan** Vercel ikut memperbarui situs secara otomatis.

> Kedua alamat bisa dipakai bersamaan karena memakai server yang sama. Pilih **satu alamat utama** untuk diisi di *Pengaturan → Alamat aplikasi*, karena alamat itulah yang tercetak di QR verifikasi dokumen.

---

## E. Langkah pertama setelah online

1. Buka `admin.html` → masuk dengan `superadmin` dan password dari Log eksekusi.
2. **Akun Saya** → ganti password.
3. **Pengaturan** → periksa jam batas (default 15.00), nama dan alamat sekolah, serta **Alamat aplikasi** (otomatis terisi alamat yang sedang dibuka) → **Simpan**.
4. **Pengguna Admin** → tambahkan akun **Admin Sarpras** dan **Kepala Sekolah** (isi Jabatan dan NIP karena tercetak di dokumen).
   Minta Kepala Sekolah masuk sekali lalu mengatur **PIN tanda tangan** di menu *Akun Saya*.
5. **Kategori & Lokasi** → sesuaikan daftarnya (6 kategori dan 4 lokasi contoh sudah tersedia).
   - **Tambah Ruang**: satu per satu (nama ruang + gedung/lantai).
   - **Tambah Banyak Ruang**: ketik satu ruang per baris, misalnya `Lab Fisika ; Gedung B Lt. 2`. Nama yang sudah ada otomatis dilewati.
   - Ruang atau kategori juga bisa ditambahkan langsung dari form **Tambah Barang** (tombol ＋ di samping pilihan Lokasi/Kategori) dan dari dialog **Pindah Lokasi**.
6. **Data Peminjam** → **Unduh Template** → isi sheet `SISWA` (NIS, Nama Lengkap, Kelas) dan `GURU` → **Unggah Excel** → periksa pratinjau → **Konfirmasi Impor**.
   Saat kenaikan kelas, unggah file terbaru lalu centang *"Nonaktifkan siswa yang tidak ada di file"*.
7. **Inventaris** → **Tambah Barang**, atau isi lewat Excel (lihat bagian *Template Excel Inventaris* di bawah), atau gunakan **Migrasi Data** (Bagian F).
8. Pilih barang → **Cetak Label QR** → cetak di kertas stiker A4 → tempel di setiap barang.
9. **Dokumen → Template** → **Buat 4 Template Contoh**. Lalu uji satu dokumen: buka *Transaksi* → ikon 🖨️ (Bukti Peminjaman).
10. Uji kios dari HP: Pinjam → pilih nama → scan QR → Simpan. Lalu Kembalikan → scan → pilih kondisi → Konfirmasi.

---

### Template Excel Inventaris

1. **Inventaris → Unduh Template**. Pilihan dropdown di file diambil dari data aplikasi **saat itu juga**. Jadi tambahkan dulu ruang/kategori yang kurang, baru unduh template.
2. Kolom template:

   | Kolom | Cara isi |
   |---|---|
   | Nama Barang \* | ketik |
   | Tipe \* | **dropdown**: UNIT / STOK |
   | Kategori \* | **dropdown** (daftar kategori di aplikasi) |
   | Lokasi / Ruang \* | **dropdown** (daftar ruang di aplikasi) |
   | Merek / Spesifikasi | ketik |
   | Satuan | **dropdown**: sama dengan form Tambah Barang (unit, buah, set, …) |
   | Jumlah \* | angka ≥ 1 |
   | Kondisi | **dropdown**: Baik / Rusak |
   | Sumber Perolehan | **dropdown**: BOS, BOP, Yayasan, Komite, Hibah, Swadaya, Lainnya |
   | Tahun Perolehan | angka 4 digit |
   | Keterangan | ketik |

   Kolom **Kode Barang, Tersedia, Status, Bisa Dipinjam, dan Dipinjam (kali) tidak ada** di template. **Kode barang dibuat otomatis saat file diunggah.** Tipe UNIT berjumlah 3 menghasilkan 3 kode (3 label QR). Tipe STOK menghasilkan 1 kode berisi jumlahnya.
3. **Inventaris → Impor Excel** → periksa pratinjau → **Konfirmasi Impor**.
   Bila ada nilai yang tidak sama dengan daftar di aplikasi (misalnya hasil copy-paste yang salah ketik), barisnya **ditolak dengan pesan jelas** dan tidak membuat kategori/ruang baru secara diam-diam.
4. Tombol **Unduh Data** menghasilkan *laporan* seluruh inventaris (berisi kode, status, dll.). Itu laporan, **bukan template isian**.

---

## F. Migrasi data dari spreadsheet lama

Menu **Migrasi Data** (khusus Super Admin):

1. Bila data lama berupa Excel: unggah ke Google Drive → buka → **File → Simpan sebagai Google Spreadsheet**. File harus bisa dibuka oleh akun pemilik Apps Script.
2. Tempel URL-nya → **Baca Struktur**. Sistem menebak tujuan tiap sheet (Inventaris/Siswa/Guru) dan pemetaan kolomnya (*Nama Barang*, *Ruangan → Lokasi*, *Rombel → Kelas*, dll.). Periksa lalu ubah bila perlu.
3. **Pindai (Dry-run)** → lihat berapa data yang akan *ditambah / diperbarui / dilewati*. Pada tahap ini **belum ada data yang ditulis**.
4. **Jalankan Import**.
   - Spreadsheet lama **tidak pernah diubah**.
   - Import aman diulang. Menjalankannya lagi tepat sebelum aplikasi lama ditinggalkan akan menangkap data baru (*delta sync*) tanpa membuat data ganda.
   - Kategori dan lokasi yang belum ada dibuat otomatis. NIS/NIP dibaca sebagai teks sehingga angka 0 di depan tidak hilang.

---

## G. Dokumen, tanda tangan & verifikasi

- Template dibuat di Google Docs/Sheets/Slides dengan penanda seperti `{{NAMA_PEMINJAM}}`. Daftar lengkap penanda ada di **Dokumen → Template → Tambah Template → Panduan penanda**.
- Penanda yang tidak dikenali otomatis menjadi **kolom isian** di form, misalnya `{{TINDAK_LANJUT}}`.
- Baris tabel yang berisi `{{#ITEM}}` digandakan sesuai jumlah barang.
- Slot penanda tangan `{{TTD_n}}`: bila dicentang **Wajib setuju (PIN)**, dokumen menunggu persetujuan pejabat di menu **Persetujuan TTD**. Super Admin bisa melakukan *bypass* dengan alasan, dan bypass tercatat.
- Saat terbit, dokumen mendapat nomor otomatis, QR verifikasi, dan sidik jari (hash) PDF. Siapa pun bisa memindai QR untuk membuka `verifikasi.html`.
- **Status hukum:** QR + akun + PIN termasuk **TTE tidak tersertifikasi**. Ini cukup untuk dokumen internal seperti berita acara, rekap, dan bukti pinjam. Dokumen yang memerlukan kekuatan hukum penuh membutuhkan PSrE resmi (tte.komdigi.go.id).

---

## H. Kecepatan (gas-scale-turbo + instant UX)

| Pola | Dampak (diukur di simulator) |
|---|---|
| Data kios (barang, pinjaman aktif, nama peminjam) disimpan di perangkat; validasi scan dilakukan di HP | Scan → hasil **0 ms**, tanpa menunggu server |
| Satu peminjaman | **1** panggilan server, **4** operasi tulis Sheets (±45 sel) |
| Login + dashboard | **2** eksekusi server (beberapa permintaan digabung dalam 1 *batch*) |
| Pindah menu / buka ulang dashboard | **0** eksekusi: tampil seketika dari cache, lalu disegarkan di latar |
| Cache server berversi + dipecah (>100 KB) | Bacaan berulang tidak menyentuh Sheets; 4.000 nama tetap bisa di-cache |
| Klien mengirim versi data yang dimiliki | Server cukup menjawab `{same:true}` bila data tidak berubah |
| Pemanas server (`keepWarm`) | Trigger tiap 5 menit, **Senin–Sabtu pukul 06.00–17.00 WIB** saja |

- Di browser, buka Console (F12) lalu ketik `Perf.table()` untuk melihat waktu setiap panggilan.
- Kuota trigger akun @gmail ±90 menit/hari. `keepWarm` memakai sekitar 10–20 menit. Untuk mematikannya, jalankan `matikanKeepWarm()`.
- Pemanas menjaga cache tetap siap, tetapi tidak menjamin server Google selalu "hangat". Panggilan pertama di pagi hari bisa tetap butuh 1–3 detik.
- Di editor, jalankan `cekPerforma()` untuk melihat status cache, trigger, dan ukuran Script Properties.

---

## I. Cara memperbarui aplikasi

**Backend:** tempel kode baru → Simpan → **Deploy → Kelola deployment → ✏️ Edit → Versi: Versi baru → Deploy**.
Jangan pilih *Deployment baru*, karena URL `/exec` akan berubah dan `config.js` harus diubah lagi.

**Frontend:** salin berkas baru ke `C:\sim-sarpras` (jangan timpa `js\config.js`), lalu jalankan:
```powershell
git add .
git commit -m "Update"
git push
```
Tunggu 1–2 menit, lalu tekan **Ctrl+Shift+R**.

---

## J. Kendala umum

| Gejala | Penyebab & solusi |
|---|---|
| Kios menampilkan "URL server belum diatur" | `js/config.js` belum diisi URL `/exec` |
| "Server belum terhubung" | Deployment belum diatur *Siapa saja*, atau URL salah. Buka URL `/exec` di browser untuk mengecek |
| Kamera tidak menyala | Situs harus **HTTPS**, dan izin kamera di browser harus diizinkan. Sementara itu, ketik kode secara manual atau pakai scanner USB |
| Situs GitHub Pages 404 | `git init` dijalankan di folder yang salah. Di repo GitHub, `index.html` harus berada di root |
| Tampilan tanpa warna/CSS | Struktur folder rusak (berkas diunggah lewat web GitHub). Push ulang dari terminal |
| Dokumen gagal terbit | Template tidak bisa dibuka akun pemilik skrip, atau izin Drive/Docs belum diberikan. Jalankan `ujiQr` atau `setupAplikasi` sekali dari editor untuk memicu otorisasi, lalu klik **Terbitkan** di menu Dokumen |
| Lupa password superadmin | Isi Script Property `RESET_PASSWORD`, lalu jalankan `resetPasswordSuperadmin()` |
| Data diedit langsung di spreadsheet tidak langsung tampil | Cache server bertahan maksimal 10–30 menit. Klik 🔄 *Segarkan* di dashboard |

---

## K. Hasil pengujian sebelum diserahkan

- **Backend:** 101 skenario di simulator Apps Script (Node.js) — semua lulus.
  Mencakup: login & penguncian, token, peran, pinjam/kembali (termasuk stok sebagian dan barang dipinjam dua orang), penolakan peminjaman ganda, koreksi admin, impor Excel idempoten (NIS `00123` utuh), kenaikan kelas, migrasi dry-run/import/delta, alur PIN dokumen, pengembalian nomor saat terbit gagal, cache berversi, dan QR PNG (didekode ulang dengan OpenCV).
- **Browser:** 61 skenario di Chromium (HP 390 px, tablet 1280 px, desktop 1440 px) — semua lulus, tanpa galat JavaScript.
  Revisi v1.0.1 diuji ujung ke ujung: tambah banyak ruang → ＋ ruang dari form → unduh template → isi di Excel (openpyxl) → unggah → kode otomatis. File template juga dibuka di LibreOffice, dan ke-9 aturan dropdown/validasinya tetap terbaca.

**Yang belum bisa diuji di luar akun Google Anda** (wajib dicek sekali setelah instalasi):
1. Render dokumen sungguhan di Google Docs/Sheets (template contoh, ekspor PDF/DOCX/XLSX).
2. Kamera HP dan scanner USB di perangkat sekolah.
3. Dropdown template di Microsoft Excel di komputer sekolah (sudah diuji di LibreOffice dan dibaca openpyxl).
   Sejak v1.0.1, unduh/baca Excel `.xlsx` tidak lagi bergantung pada CDN. Hanya kamera (html5-qrcode) dan file lama `.xls/.csv` yang masih memuat pustaka dari internet.

## L. Perbedaan dari PRD (keputusan teknis)

- **Tanpa proxy Vercel.** Frontend memanggil Apps Script langsung (`fetch` POST `text/plain`), sehingga bisa dipasang sekaligus di GitHub Pages dan Vercel. Keamanan bergantung pada token login HMAC yang divalidasi di server untuk setiap aksi admin.
- **Daftar nama peminjam (nama + kelas, tanpa NIS/NIP) dikirim ke perangkat kios** agar saran nama muncul seketika. PRD semula membatasi maksimal 10 hasil per pencarian ke server.
- **Peminjaman setelah jam batas:** batas kembali menjadi pukul 23.59 hari itu, supaya tidak langsung ditandai terlambat.
- **Barang STOK yang dikembalikan rusak** tidak menambah stok tersedia. Admin menyesuaikan jumlah stok setelah barang diperiksa.

---

## M. Riwayat versi

| Versi | Perubahan |
|---|---|
| 1.0.1 | Tambah ruang manual (satu/banyak sekaligus, ＋ dari form barang & pindah lokasi) · Template Excel inventaris dengan dropdown Tipe/Kategori/Lokasi/Satuan/Kondisi/Sumber sesuai data aplikasi · Kolom Kode/Tersedia/Status/Bisa Dipinjam/Dipinjam dihapus dari template · Kode barang otomatis saat unggah · Impor template menolak salah ketik · Satuan & Sumber di form menjadi dropdown · Excel .xlsx dibaca/ditulis tanpa CDN |
| 1.0.0 | Rilis pertama |

**Cara memperbarui dari 1.0.0 ke 1.0.1** (data aman, tidak ada sheet/kolom yang berubah):
1. **Backend:** ganti isi `Kode.gs`, `Data.gs`, `Migrasi.gs` → Simpan → **Deploy → Kelola deployment → ✏️ Edit → Versi baru → Deploy**. `DocEngine.gs`, `QrLib.gs`, dan `appsscript.json` tidak berubah.
2. **Frontend:** ekstrak ZIP v1.0.1 lalu salin & timpa semua isinya ke `C:\sim-sarpras`. ZIP ini sengaja **tidak berisi `js\config.js`**, sehingga file Anda yang sudah berisi URL server tetap aman. Lalu jalankan `git add .` → `git commit -m "v1.0.1"` → `git push`, dan tekan Ctrl+Shift+R di browser.
