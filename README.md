# SIM-SARPRAS SMA TRIGUNA 1956

Sistem inventaris & peminjaman barang sarana-prasarana berbasis QR Code.

- `index.html` — Kios peminjaman/pengembalian (siswa & guru, tanpa login). Tambah `?kiosk=1` untuk perangkat kios.
- `admin.html` — Panel admin (Super Admin, Admin Sarpras, Kepala Sekolah).
- `verifikasi.html` — Cek keaslian dokumen ber-QR.
- `js/config.js` — **satu-satunya file yang perlu diubah**: isi `GAS_URL` dengan URL Web App Apps Script (`/exec`).

Backend: Google Apps Script (berkas `.gs` terpisah, tidak ada di repo ini). Panduan lengkap: `PANDUAN-INSTALASI.md`.

Pustaka pihak ketiga: QR Code for JavaScript (Kazuhiko Arase, MIT); html5-qrcode (Apache-2.0) & SheetJS CE (Apache-2.0) dimuat dari CDN saat diperlukan.
