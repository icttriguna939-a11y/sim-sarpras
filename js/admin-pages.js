/* =========================================================
   SIM-SARPRAS — admin-pages.js
   Kategori & Lokasi · Data Peminjam · Impor Excel · Dokumen & Template · Persetujuan TTD
   Pengguna · Migrasi · Pengaturan · Akun Saya
   ========================================================= */
(function (W) {
  'use strict';
  var S = SAR, A = W.ADM, esc = S.esc, ic = S.ic, fmt = S.fmt, $ = S.$, $$ = S.$$;

  // ============ KATEGORI & LOKASI ============
  A.pages.master = function (el, r) {
    var tab = r.q.tab || 'kategori';
    el.innerHTML = A.head('Kategori & Lokasi', 'Kode singkat kategori dipakai di kode barang (mis. SAR-<b>ELK</b>-0001).', '<button class="btn btn-yellow" id="add">' + ic('plus') + 'Tambah</button>') +
      '<div class="tabs"><button data-tab="kategori" aria-selected="' + (tab === 'kategori') + '">Kategori</button><button data-tab="lokasi" aria-selected="' + (tab === 'lokasi') + '">Lokasi / Ruangan</button></div><div id="tbl">' + S.skeleton(5) + '</div>' +
      '<p class="help" style="margin-top:12px">' + ic('info', 'sm') + ' Kategori/lokasi yang dipakai barang hanya bisa dinonaktifkan, tidak dihapus.</p>';
    var data = null;
    function gambar() {
      if (tab === 'kategori') A.tabel($('#tbl', el), data.kategori, [
        { t: 'Kode', f: function (x) { return '<span class="chip">' + esc(x.kode) + '</span>'; } }, { t: 'Nama Kategori', f: function (x) { return '<b>' + esc(x.nama) + '</b>'; } },
        { t: 'Jumlah Barang', cls: 'num', f: function (x) { return x.jumlah; } }, { t: 'Status', f: function (x) { return S.badge(x.aktif ? 'TERSEDIA' : 'NONAKTIF', x.aktif ? 'Aktif' : 'Nonaktif'); } },
        { t: '', cls: 'num', f: function (x) { return '<button class="ib-btn" data-ed="' + esc(x.id) + '" aria-label="Ubah">' + ic('edit', 'sm') + '</button>'; } }
      ], { bind: bind });
      else A.tabel($('#tbl', el), data.lokasi, [
        { t: 'ID', f: function (x) { return '<span class="code" style="font-size:12px">' + esc(x.id) + '</span>'; } }, { t: 'Nama Lokasi', f: function (x) { return '<b>' + esc(x.nama) + '</b>'; } },
        { t: 'Gedung', f: function (x) { return esc(x.gedung || '-'); } }, { t: 'Jumlah Barang', cls: 'num', f: function (x) { return x.jumlah; } },
        { t: 'Status', f: function (x) { return S.badge(x.aktif ? 'TERSEDIA' : 'NONAKTIF', x.aktif ? 'Aktif' : 'Nonaktif'); } },
        { t: '', cls: 'num', f: function (x) { return '<button class="ib-btn" data-ed="' + esc(x.id) + '" aria-label="Ubah">' + ic('edit', 'sm') + '</button>'; } }
      ], { bind: bind });
    }
    function bind(box) { $$('[data-ed]', box).forEach(function (b) { b.onclick = function () { form(data[tab].filter(function (x) { return x.id === b.dataset.ed; })[0]); }; }); }
    function form(x) {
      var kat = tab === 'kategori';
      var m = S.modal({ drawer: true, title: (x ? 'Ubah ' : 'Tambah ') + (kat ? 'Kategori' : 'Lokasi'), body:
        (kat ? '<div class="field"><label>Kode singkat <span class="req">*</span></label><input class="input" id="kd" maxlength="4" style="text-transform:uppercase" value="' + esc(x ? x.kode : '') + '" placeholder="2–4 huruf, mis. ELK"><div class="help">Mengubah kode tidak mengubah kode barang yang sudah ada.</div></div>' : '') +
        '<div class="field"><label>Nama ' + (kat ? 'kategori' : 'lokasi') + ' <span class="req">*</span></label><input class="input" id="nm" value="' + esc(x ? x.nama : '') + '"></div>' +
        (kat ? '' : '<div class="field"><label>Gedung</label><input class="input" id="gd" value="' + esc(x ? x.gedung : '') + '"></div>') +
        '<label class="check"><input type="checkbox" id="ak"' + (!x || x.aktif ? ' checked' : '') + '>Aktif</label>',
        foot: '<button class="btn" data-c>Batal</button><button class="btn btn-navy" data-s>Simpan</button>' });
      m.el.querySelector('[data-c]').onclick = m.close;
      m.el.querySelector('[data-s]').onclick = function () {
        A.simpanLalu('master.save', { jenis: tab, id: x ? x.id : undefined, kode: kat ? $('#kd', m.el).value : undefined, nama: $('#nm', m.el).value, gedung: kat ? undefined : $('#gd', m.el).value, aktif: $('#ak', m.el).checked },
          this, ['master', 'inventaris', 'public']).then(function (r) { if (r.success) { m.close(); muat(true); } });
      };
    }
    function muat(f) { S.Store.load('master.list', {}, { maxAge: 60000, force: f, onData: function (d) { data = d; gambar(); } }); }
    $$('[data-tab]', el).forEach(function (b) { b.onclick = function () { tab = b.dataset.tab; $$('[data-tab]', el).forEach(function (y) { y.setAttribute('aria-selected', y === b); }); if (data) gambar(); }; });
    $('#add', el).onclick = function () { form(null); };
    muat();
  };

  // ============ DATA PEMINJAM ============
  A.pages.peminjam = function (el, r) {
    var st = { tab: r.q.tab || 'SISWA', q: '', kelas: '', aktif: '1' }, data = null;
    el.innerHTML = A.head('Data Peminjam', 'Daftar siswa &amp; guru yang muncul di saran nama kios.',
      '<button class="btn" id="tpl">' + ic('download') + 'Unduh Template</button><button class="btn" id="imp">' + ic('upload') + 'Unggah Excel</button><button class="btn btn-yellow" id="add">' + ic('plus') + 'Tambah Manual</button>') +
      '<div class="tabs" id="tabs"></div><div class="filters"><input class="input" id="fq" placeholder="Cari nama / NIS / NIP" style="flex:2 1 220px"><select class="select" id="fk"><option value="">Semua kelas</option></select>' +
      '<select class="select" id="fa"><option value="1">Aktif</option><option value="0">Nonaktif</option><option value="">Semua</option></select></div><div id="tbl">' + S.skeleton(6) + '</div>';
    function gambar() {
      var n = { SISWA: 0, GURU: 0 }; data.rows.forEach(function (x) { if (x.aktif) n[x.tipe]++; });
      $('#tabs', el).innerHTML = '<button data-t="SISWA" aria-selected="' + (st.tab === 'SISWA') + '">Siswa<span class="count">' + fmt.angka(n.SISWA) + '</span></button><button data-t="GURU" aria-selected="' + (st.tab === 'GURU') + '">Guru / Staf<span class="count">' + fmt.angka(n.GURU) + '</span></button>';
      $$('[data-t]', el).forEach(function (b) { b.onclick = function () { st.tab = b.dataset.t; st.kelas = ''; isiKelas(); gambar(); }; });
      $('#fk', el).style.display = st.tab === 'SISWA' ? '' : 'none';
      var rows = data.rows.filter(function (x) { return x.tipe === st.tab && (st.aktif === '' || String(Number(x.aktif)) === st.aktif) && (!st.kelas || x.kelas === st.kelas) && A.cocok(x.nama + ' ' + x.nomorInduk + ' ' + x.kelas, st.q); })
        .sort(function (a, b) { return (a.kelas || '').localeCompare(b.kelas || '') || a.nama.localeCompare(b.nama); });
      A.tabel($('#tbl', el), rows, [
        { t: st.tab === 'SISWA' ? 'NIS' : 'NIP / Kode', f: function (x) { return '<span class="code" style="font-size:12px">' + esc(x.nomorInduk || '—') + '</span>'; } },
        { t: 'Nama Lengkap', f: function (x) { return '<span style="display:flex;gap:8px;align-items:center"><span class="avatar">' + esc(fmt.inisial(x.nama)) + '</span><b>' + esc(x.nama) + '</b></span>'; } },
        st.tab === 'SISWA' ? { t: 'Kelas', f: function (x) { return '<span class="chip">' + esc(x.kelas) + '</span>'; } } : null,
        { t: 'Total Pinjam', cls: 'num', f: function (x) { return x.pinjam; } }, { t: 'Status', f: function (x) { return S.badge(x.aktif ? 'TERSEDIA' : 'NONAKTIF', x.aktif ? 'Aktif' : 'Nonaktif'); } },
        { t: '', cls: 'num', f: function (x) { return '<button class="ib-btn" data-ed="' + esc(x.id) + '" aria-label="Ubah">' + ic('edit', 'sm') + '</button>'; } }
      ].filter(Boolean), { kosong: 'Belum ada data ' + (st.tab === 'SISWA' ? 'siswa' : 'guru') + '. Unggah dari Excel.', maskot: 'cari', bind: function (box) {
        $$('[data-ed]', box).forEach(function (b) { b.onclick = function () { form(data.rows.filter(function (x) { return x.id === b.dataset.ed; })[0]); }; });
      } });
    }
    function isiKelas() { var k = {}; data.rows.forEach(function (x) { if (x.tipe === 'SISWA' && x.kelas) k[x.kelas] = 1; }); $('#fk', el).innerHTML = A.opsi(Object.keys(k).sort(), st.kelas, 'Semua kelas'); }
    function form(x) {
      var tipe = x ? x.tipe : st.tab;
      var m = S.modal({ drawer: true, title: (x ? 'Ubah ' : 'Tambah ') + (tipe === 'SISWA' ? 'Siswa' : 'Guru/Staf'), body:
        '<div class="field"><label>Jenis</label><select class="select" id="tp">' + A.opsi([{ v: 'SISWA', l: 'Siswa' }, { v: 'GURU', l: 'Guru / Staf' }], tipe) + '</select></div>' +
        '<div class="field"><label>Nama lengkap <span class="req">*</span></label><input class="input" id="nm" value="' + esc(x ? x.nama : '') + '"></div>' +
        '<div class="field" id="klW"><label>Kelas <span class="req">*</span></label><input class="input" id="kl" value="' + esc(x ? x.kelas : '') + '" placeholder="Mis. XI IPA 2" style="text-transform:uppercase"></div>' +
        '<div class="field"><label>NIS / NIP</label><input class="input" id="ni" value="' + esc(x ? x.nomorInduk : '') + '" inputmode="numeric"></div>' +
        '<label class="check"><input type="checkbox" id="ak"' + (!x || x.aktif ? ' checked' : '') + '>Aktif (muncul di kios)</label>',
        foot: '<button class="btn" data-c>Batal</button><button class="btn btn-navy" data-s>Simpan</button>' });
      var tp = $('#tp', m.el); function sk() { $('#klW', m.el).style.display = tp.value === 'SISWA' ? '' : 'none'; } tp.onchange = sk; sk();
      m.el.querySelector('[data-c]').onclick = m.close;
      m.el.querySelector('[data-s]').onclick = function () {
        A.simpanLalu('peminjam.save', { id: x ? x.id : undefined, tipe: tp.value, nama: $('#nm', m.el).value, kelas: $('#kl', m.el).value.toUpperCase(), nomorInduk: $('#ni', m.el).value, aktif: $('#ak', m.el).checked },
          this, ['peminjam', 'public']).then(function (r) { if (r.success) { m.close(); muat(true); } });
      };
    }
    function muat(f) { S.Store.load('peminjam.list', {}, { maxAge: 60000, force: f, onData: function (d) { data = d; isiKelas(); gambar(); } }); }
    var deb; $('#fq', el).oninput = function () { var v = this.value; clearTimeout(deb); deb = setTimeout(function () { st.q = v; gambar(); }, 120); };
    $('#fk', el).onchange = function () { st.kelas = this.value; gambar(); };
    $('#fa', el).onchange = function () { st.aktif = this.value; gambar(); };
    $('#add', el).onclick = function () { form(null); };
    $('#tpl', el).onclick = function () { S.busy(this, A.unduhTemplate('PEMINJAM'), 'Menyiapkan…'); };
    $('#imp', el).onclick = function () { A.imporExcel('PEMINJAM', function () { muat(true); }); };
    muat();
  };

  // ============ IMPOR EXCEL (template) ============
  var TPL = {
    SISWA: { kolom: ['NIS', 'Nama Lengkap', 'Kelas'], contoh: [['00123', 'Ahmad Fauzi', 'XI IPA 2'], ['00124', 'Rina Wulandari', 'X IPA 1']], peta: { nomorInduk: ['nis', 'nisn', 'nomor induk'], nama: ['nama lengkap', 'nama'], kelas: ['kelas', 'rombel'] } },
    GURU: { kolom: ['NIP / Kode Guru', 'Nama Lengkap'], contoh: [['G-001', 'Siti Rahmawati, S.Pd.'], ['196501011990031001', 'Drs. Supriyanto']], peta: { nomorInduk: ['nip / kode guru', 'nip', 'kode guru', 'nuptk'], nama: ['nama lengkap', 'nama'] } },
    INVENTARIS: { kolom: ['Kode Barang (opsional)', 'Nama Barang', 'Tipe (UNIT/STOK)', 'Kategori', 'Lokasi', 'Merek/Spesifikasi', 'Satuan', 'Jumlah', 'Kondisi (Baik/Rusak)', 'Sumber Perolehan', 'Tahun', 'Keterangan', 'Bisa Dipinjam (Ya/Tidak)'],
      contoh: [['', 'Proyektor Epson EB-X51', 'UNIT', 'Elektronik', 'Ruang Sarpras', 'Epson EB-X51', 'unit', '2', 'Baik', 'BOS', '2024', '', 'Ya'], ['', 'Bola Voli Mikasa', 'STOK', 'Olahraga', 'Gudang Olahraga', 'Mikasa MVA200', 'buah', '12', 'Baik', 'Yayasan', '2025', '', 'Ya']],
      peta: { kodeBarang: ['kode barang (opsional)', 'kode barang', 'kode'], namaBarang: ['nama barang', 'nama'], tipe: ['tipe (unit/stok)', 'tipe'], kategori: ['kategori'], lokasi: ['lokasi', 'ruangan'],
        merekSpesifikasi: ['merek/spesifikasi', 'merek', 'merk'], satuan: ['satuan'], jumlah: ['jumlah'], kondisi: ['kondisi (baik/rusak)', 'kondisi'], sumberPerolehan: ['sumber perolehan', 'sumber'], tahunPerolehan: ['tahun'], keterangan: ['keterangan'], bisaDipinjam: ['bisa dipinjam (ya/tidak)', 'bisa dipinjam'] } }
  };
  A.unduhTemplate = function (jenis) {
    var petunjuk = [['PETUNJUK PENGISIAN — SIM-SARPRAS SMA TRIGUNA'], [''], ['1. Isi data mulai baris ke-2 (baris 1 = judul kolom, jangan diubah).'], ['2. Kolom bertanda wajib: Nama Lengkap (dan Kelas untuk siswa) / Nama Barang.'],
      ['3. NIS/NIP diformat teks agar angka 0 di depan tidak hilang.'], ['4. Data yang sama (NIS/NIP sama) akan DIPERBARUI, bukan digandakan.'], ['5. Simpan sebagai .xlsx lalu unggah lewat tombol "Unggah Excel".']];
    if (jenis === 'PEMINJAM') return Excel.unduh('Template_Data_Peminjam_SIM-SARPRAS.xlsx', [
      { name: 'SISWA', aoa: [TPL.SISWA.kolom].concat(TPL.SISWA.contoh), widths: [14, 32, 12], textCols: [0] },
      { name: 'GURU', aoa: [TPL.GURU.kolom].concat(TPL.GURU.contoh), widths: [22, 34], textCols: [0] }, { name: 'PETUNJUK', aoa: petunjuk, widths: [90] }]);
    return Excel.unduh('Template_Inventaris_SIM-SARPRAS.xlsx', [{ name: 'INVENTARIS', aoa: [TPL.INVENTARIS.kolom].concat(TPL.INVENTARIS.contoh), widths: [18, 30, 14, 16, 18, 22, 8, 8, 16, 16, 7, 20, 18], textCols: [0, 10] },
      { name: 'PETUNJUK', aoa: petunjuk.concat([['6. Tipe UNIT dengan Jumlah 3 → dibuat 3 kode terpisah. Tipe STOK → 1 kode berisi jumlah.'], ['7. Kategori/lokasi yang belum ada akan dibuat otomatis.']]), widths: [90] }]);
  };
  function petakan(rows, peta) {
    return rows.map(function (r) {
      var o = {}, keys = Object.keys(r);
      Object.keys(peta).forEach(function (f) {
        for (var i = 0; i < peta[f].length; i++) { var k = keys.filter(function (x) { return x.trim().toLowerCase() === peta[f][i]; })[0]; if (k !== undefined) { o[f] = String(r[k]).trim(); break; } }
      });
      return o;
    }).filter(function (o) { return Object.keys(o).some(function (k) { return o[k]; }); });
  }
  /** jenis: 'PEMINJAM' (sheet SISWA & GURU) atau 'INVENTARIS'. */
  A.imporExcel = function (jenis, done) {
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.xlsx,.xls,.csv';
    inp.onchange = function () {
      var f = inp.files[0]; if (!f) return;
      S.toast('Membaca ' + f.name + '…', 'info', 1500);
      Excel.baca(f).then(function (wb) {
        var jobs = [];
        Object.keys(wb).forEach(function (nama) {
          var n = nama.toUpperCase(), rows = wb[nama];
          if (!rows.length || n === 'PETUNJUK') return;
          var hdr = Object.keys(rows[0]).join('|').toLowerCase();
          var target = jenis === 'INVENTARIS' ? 'INVENTARIS' : (n.indexOf('GURU') >= 0 || /nip|kode guru/.test(hdr) ? 'GURU' : 'SISWA');
          var data = petakan(rows, TPL[target].peta);
          if (data.length) jobs.push({ sheet: nama, target: target, rows: data });
        });
        if (!jobs.length) { S.toast('Tidak ada data yang cocok dengan template. Unduh template dulu.', 'error'); return; }
        pratinjau(jobs);
      }).catch(function (e) { S.toast('File tidak bisa dibaca: ' + e.message, 'error'); });
    };
    inp.click();
    function pratinjau(jobs) {
      var m = S.modal({ title: 'Impor Excel', wide: true, sticky: true, body: '<div class="stepbar"><span class="on"><i>1</i>Unggah</span><span class="on"><i>2</i>Pratinjau</span><span><i>3</i>Selesai</span></div><div id="hasil">' + S.skeleton(4) + '</div>',
        foot: '<button class="btn" data-c>Batal</button><button class="btn btn-navy" data-ok disabled>' + ic('check', 'sm') + 'Konfirmasi Impor</button>' });
      m.el.querySelector('[data-c]').onclick = m.close;
      Promise.all(jobs.map(function (j) { return S.api('import.rows', { target: j.target, rows: j.rows, dryRun: true }); })).then(function (res) {
        var gagal = res.filter(function (r) { return !r.success; });
        if (gagal.length) { $('#hasil', m.el).innerHTML = '<div class="errbox">' + ic('alert') + esc(gagal[0].message) + '</div>'; return; }
        $('#hasil', m.el).innerHTML = jobs.map(function (j, i) {
          var r = res[i].data;
          return '<h3 class="h3" style="margin:6px 0 4px">' + esc(j.sheet) + ' → ' + esc({ SISWA: 'Siswa', GURU: 'Guru/Staf', INVENTARIS: 'Inventaris' }[j.target]) + ' (' + j.rows.length + ' baris)</h3>' +
            '<div class="res-cards"><div class="bg-mint">Baru<b>' + r.inserted + '</b></div><div class="bg-sky">Diperbarui<b>' + r.updated + '</b></div><div style="background:var(--red-t)">Error / dilewati<b>' + (r.errors.length) + ' / ' + (r.skipped - r.errors.length) + '</b></div></div>' +
            (r.errors.length ? '<div class="tbl-wrap" style="max-height:200px;margin-bottom:10px"><table class="tbl" style="min-width:0"><thead><tr><th>Baris</th><th>Masalah</th></tr></thead><tbody>' + r.errors.slice(0, 30).map(function (e) { return '<tr><td class="mono">' + e.baris + '</td><td>' + esc(e.pesan) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '') +
            (r.warnings.length ? '<div class="warnbox" style="margin-bottom:10px">' + ic('info') + '<div>' + r.warnings.slice(0, 8).map(esc).join('<br>') + '</div></div>' : '') +
            (j.target !== 'INVENTARIS' ? '<label class="check" style="margin-bottom:12px"><input type="checkbox" data-non="' + i + '">Nonaktifkan ' + (j.target === 'SISWA' ? 'siswa' : 'guru') + ' yang TIDAK ada di file (kenaikan kelas / alumni)</label>' : '');
        }).join('');
        var ok = m.el.querySelector('[data-ok]'); ok.disabled = false;
        ok.onclick = function () {
          S.busy(ok, Promise.all(jobs.map(function (j, i) { var c = $('[data-non="' + i + '"]', m.el); return S.api('import.rows', { target: j.target, rows: j.rows, nonaktifkanTidakAda: !!(c && c.checked) }); })), 'Mengimpor…').then(function (rs) {
            var e = rs.filter(function (r) { return !r.success; });
            if (e.length) { S.toast(e[0].message, 'error'); return; }
            S.Store.stale(['peminjam', 'inventaris', 'master', 'public', 'dashboard']);
            m.close(); S.toast(rs.map(function (r) { return r.message; }).join(' ')); if (done) done();
          });
        };
      });
    }
  };

  // ============ DOKUMEN ============
  var STATUS_DOK = { DRAF: 'Draf', MENUNGGU_TTD: 'Menunggu TTD', TERBIT: 'Terbit', DITARIK: 'Ditarik', DITOLAK: 'Ditolak' };
  A.pages.dokumen = function (el, r) {
    var tab = r.q.tab || 'dokumen', st = { q: '', status: '' };
    el.innerHTML = A.head('Dokumen', 'Bukti peminjaman, berita acara, kartu inventaris &amp; rekap — dari template Google Docs/Sheets/Slides.',
      (A.isAdm() ? '<button class="btn" id="rekap">' + ic('chart') + 'Rekap Bulanan</button><button class="btn btn-yellow" id="buat">' + ic('plus') + 'Buat Dokumen</button>' : '')) +
      '<div class="tabs"><button data-tab="dokumen" aria-selected="' + (tab === 'dokumen') + '">Dokumen</button>' + (A.isAdm() ? '<button data-tab="template" aria-selected="' + (tab === 'template') + '">Template</button>' : '') + '</div><div id="isi">' + S.skeleton(6) + '</div>';
    $$('[data-tab]', el).forEach(function (b) { b.onclick = function () { tab = b.dataset.tab; $$('[data-tab]', el).forEach(function (y) { y.setAttribute('aria-selected', y === b); }); gambar(); }; });
    if ($('#buat', el)) $('#buat', el).onclick = function () { A.buatDokumen({ jenis: 'UMUM' }); };
    if ($('#rekap', el)) $('#rekap', el).onclick = function () { A.buatDokumen({ jenis: 'REKAP_BULANAN' }); };
    function gambar() { if (tab === 'template') tabTemplate($('#isi', el)); else tabDokumen($('#isi', el)); }
    function tabDokumen(box) {
      box.innerHTML = '<div class="filters"><input class="input" id="fq" placeholder="Cari nomor / perihal" style="flex:2 1 220px"><select class="select" id="fs">' + A.opsi([{ v: '', l: 'Semua status' }].concat(Object.keys(STATUS_DOK).map(function (k) { return { v: k, l: STATUS_DOK[k] }; })), st.status) + '</select></div><div id="tbl">' + S.skeleton(5) + '</div>';
      var data = null;
      function isi() {
        var rows = data.rows.filter(function (x) { return (!st.status || x.status === st.status) && A.cocok(x.nomor + ' ' + x.perihal + ' ' + x.template, st.q); });
        A.tabel($('#tbl', box), rows, [
          { t: 'Nomor', f: function (x) { return x.nomor ? '<span class="code" style="font-size:12px">' + esc(x.nomor) + '</span>' : '<span class="muted">—</span>'; } },
          { t: 'Perihal', f: function (x) { return '<b>' + esc(x.perihal) + '</b><div class="sub">' + esc(x.template) + (x.catatan ? ' · ' + esc(x.catatan.slice(0, 60)) : '') + '</div>'; } },
          { t: 'Penanda Tangan', f: function (x) { return x.penandatangan.map(function (p) { return '<span class="chip" style="margin:2px;background:' + (p.status === 'SETUJU' ? 'var(--mint)' : p.status === 'DITOLAK' ? 'var(--red-t)' : 'var(--yellow)') + '" title="' + esc(p.label) + '">' + esc(p.nama.split(',')[0]) + '</span>'; }).join(''); } },
          { t: 'Status', f: function (x) { return S.badge(x.status, STATUS_DOK[x.status]); } },
          { t: 'Tanggal', f: function (x) { return fmt.tglJam(x.terbit || x.dibuat); } },
          { t: '', cls: 'num', f: function (x) {
            var s = '<div class="row-acts">';
            x.berkas.forEach(function (f) { s += '<button class="btn btn-sm" data-dl="' + esc(x.id) + '" data-f="' + f + '">' + ic('download', 'sm') + f.toUpperCase() + '</button>'; });
            if (x.status === 'TERBIT') s += '<button class="ib-btn" data-vf="' + esc(x.kodeVerifikasi) + '" title="Salin tautan verifikasi" aria-label="Salin tautan verifikasi">' + ic('shield', 'sm') + '</button>';
            if (A.isAdm() && x.status === 'TERBIT') s += '<button class="ib-btn danger" data-tr="' + esc(x.id) + '" title="Tarik kembali" aria-label="Tarik kembali">' + ic('x', 'sm') + '</button>';
            if (A.isAdm() && (x.status === 'DRAF' || (x.status === 'MENUNGGU_TTD' && x.penandatangan.every(function (p) { return p.status === 'SETUJU'; })))) s += '<button class="btn btn-sm btn-yellow" data-ul="' + esc(x.id) + '">Terbitkan</button>';
            return s + '</div>';
          } }
        ], { kosong: 'Belum ada dokumen', maskot: 'dokumen', bind: function (b2) {
          $$('[data-dl]', b2).forEach(function (b) { b.onclick = function () { S.busy(b, S.api('doc.download', { id: b.dataset.dl, format: b.dataset.f }), '…').then(function (r) { if (r.success) S.downloadB64(r.data.base64, r.data.nama, r.data.mime); else S.toast(r.message, 'error'); }); }; });
          $$('[data-vf]', b2).forEach(function (b) { b.onclick = function () { var u = location.href.replace(/admin\.html.*$/, '') + 'verifikasi.html?k=' + b.dataset.vf; (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { S.toast('Tautan verifikasi disalin.'); }, function () { S.ask('Tautan verifikasi', '<span class="code" style="word-break:break-all">' + esc(u) + '</span>', { ok: 'Tutup' }); }); }; });
          $$('[data-tr]', b2).forEach(function (b) { b.onclick = function () {
            S.ask('Tarik kembali dokumen?', 'Halaman verifikasi akan menampilkan status <b>DITARIK</b>. Tindakan ini tidak bisa dibatalkan.', { input: 'Alasan penarikan', required: true, min: 5, minMsg: 'Alasan minimal 5 karakter.', danger: true, ok: 'Tarik Dokumen' }).then(function (v) {
              if (v) A.simpanLalu('doc.tarik', { id: b.dataset.tr, alasan: v }, b, ['doc']).then(function (r) { if (r.success) muat(true); });
            }); }; });
          $$('[data-ul]', b2).forEach(function (b) { b.onclick = function () { A.simpanLalu('doc.ulangTerbit', { id: b.dataset.ul }, b, ['doc'], 'Menerbitkan…').then(function (r) { if (r.success) muat(true); }); }; });
        } });
      }
      function muat(f) { S.Store.load('doc.list', {}, { maxAge: 20000, force: f, onData: function (d) { data = d; isi(); } }); }
      var deb; $('#fq', box).oninput = function () { var v = this.value; clearTimeout(deb); deb = setTimeout(function () { st.q = v; if (data) isi(); }, 120); };
      $('#fs', box).onchange = function () { st.status = this.value; if (data) isi(); };
      muat();
    }
    function tabTemplate(box) {
      box.innerHTML = S.skeleton(4);
      S.Store.load('doc.templates', {}, { maxAge: 30000, onData: function (d) {
        box.innerHTML = '<div class="infobox" style="margin-bottom:16px">' + ic('info') + '<span>Desain template di Google Docs/Sheets/Slides memakai penanda <span class="code">{{NAMA_PEMINJAM}}</span>, lalu tempel URL-nya di sini. ' +
          (d.folderTemplate ? '<a href="' + esc(d.folderTemplate) + '" target="_blank" rel="noopener">Buka folder Template di Drive</a>.' : '') + '</span></div>' +
          '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px"><button class="btn btn-yellow" id="tAdd">' + ic('plus') + 'Tambah Template</button>' + (A.isSup() ? '<button class="btn" id="tContoh">' + ic('spark') + 'Buat 4 Template Contoh</button>' : '') + '</div>' +
          (d.templates.length ? '<div class="grid-2">' + d.templates.map(function (t) {
            return '<div class="card card-pad"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><div><span class="chip">' + esc(t.kode) + '</span> ' + S.badge(t.aktif ? 'TERSEDIA' : 'NONAKTIF', t.aktif ? 'Aktif' : 'Nonaktif') +
              '<h3 class="h3" style="margin-top:8px">' + esc(t.nama) + '</h3><div class="help">' + esc((d.jenis[t.jenis] || {}).label || t.jenis) + ' · ' + esc(t.engine.toUpperCase()) + ' · v' + t.versi + ' · keluaran ' + esc(t.keluaran.join(', ').toUpperCase()) + '</div></div>' +
              '<a class="ib-btn" href="https://drive.google.com/open?id=' + esc(t.fileId) + '" target="_blank" rel="noopener" aria-label="Buka template">' + ic('arrowUR', 'sm') + '</a></div>' +
              '<div style="margin:10px 0;display:flex;gap:6px;flex-wrap:wrap">' + t.slot.map(function (s) { var u = d.pejabat.filter(function (p) { return p.userId === s.userId; })[0]; return '<span class="chip" style="background:' + (s.wajibSetuju ? 'var(--lilac)' : '#fff') + '">' + ic('pen', 'sm') + esc(s.label) + ': ' + esc(u ? u.nama : '?') + (s.wajibSetuju ? ' · PIN' : '') + '</span>'; }).join('') + '</div>' +
              '<button class="btn btn-sm" data-te="' + esc(t.id) + '">' + ic('edit', 'sm') + 'Atur</button></div>';
          }).join('') + '</div>' : S.empty('Belum ada template', 'dokumen', A.isSup() ? '<span>Klik "Buat 4 Template Contoh" untuk mulai cepat.</span>' : ''));
        $('#tAdd', box).onclick = function () { A.editorTemplate(null, d); };
        if ($('#tContoh', box)) $('#tContoh', box).onclick = function () {
          var b = this;
          S.ask('Buat template contoh?', 'Dibuat di folder <b>Template Dokumen</b> Google Drive: Bukti Peminjaman, Berita Acara Kerusakan, Kartu Inventaris, dan Rekap Bulanan. Proses ±30 detik.', { ok: 'Buat sekarang' }).then(function (ya) {
            if (ya) A.simpanLalu('doc.buatContoh', {}, b, ['doc'], 'Membuat template…').then(function (r) { if (r.success) tabTemplate(box); });
          });
        };
        $$('[data-te]', box).forEach(function (b) { b.onclick = function () { A.editorTemplate(d.templates.filter(function (t) { return t.id === b.dataset.te; })[0], d); }; });
      } });
    }
    gambar();
  };

  /** Editor template: pindai URL → atur kolom isian, penanda tangan, keluaran. */
  A.editorTemplate = function (t, ctx) {
    var st = { fileId: t ? t.fileId : '', engine: t ? t.engine : 'docs', bidang: t ? JSON.parse(JSON.stringify(t.bidang)) : [], slot: t ? JSON.parse(JSON.stringify(t.slot)) : [], otomatis: [] };
    var jenisOps = Object.keys(ctx.jenis).map(function (k) { return { v: k, l: ctx.jenis[k].label }; });
    var m = S.modal({ title: t ? 'Atur Template · ' + t.kode : 'Tambah Template', wide: true, sticky: true, body:
      '<div class="grid-3"><div class="field"><label>Kode <span class="req">*</span></label><input class="input" id="kd" value="' + esc(t ? t.kode : '') + '" placeholder="BAK" style="text-transform:uppercase"></div>' +
      '<div class="field" style="grid-column:span 2"><label>Nama template <span class="req">*</span></label><input class="input" id="nm" value="' + esc(t ? t.nama : '') + '"></div></div>' +
      '<div class="grid-2"><div class="field"><label>Jenis dokumen (sumber data otomatis)</label><select class="select" id="jn">' + A.opsi(jenisOps, t ? t.jenis : 'UMUM') + '</select></div>' +
      '<div class="field"><label>Format nomor</label><input class="input" id="fn" value="' + esc(t ? t.formatNomor : '') + '" placeholder="{URUT}/{KODE}/SARPRAS/{BULAN}/{TAHUN}"></div></div>' +
      '<div class="field"><label>URL Google Docs / Sheets / Slides <span class="req">*</span></label><div class="scanrow"><input class="input" id="url" value="' + (t ? 'https://drive.google.com/open?id=' + esc(t.fileId) : '') + '" placeholder="https://docs.google.com/document/d/…"><button class="btn btn-ink" id="pindai">' + ic('scan', 'sm') + 'Pindai</button></div><div class="help" id="pInfo"></div></div>' +
      '<details style="margin-bottom:14px"><summary class="flabel" style="cursor:pointer">Panduan penanda yang tersedia</summary><div id="panduan" class="help" style="margin-top:8px;line-height:1.9"></div></details>' +
      '<div id="bidangBox"></div><div id="slotBox"></div>' +
      '<div class="grid-2" style="margin-top:12px"><div><div class="flabel" style="margin-bottom:8px">Keluaran berkas</div><div id="klr" style="display:flex;gap:14px;flex-wrap:wrap"></div></div>' +
      '<div><label class="check" style="margin-top:22px"><input type="checkbox" id="qp"' + (t && t.qrPer ? ' checked' : '') + '>QR eTTD per penanda tangan (menggantikan {{TTD_n}})</label><br><label class="check" style="margin-top:8px"><input type="checkbox" id="ak"' + (!t || t.aktif ? ' checked' : '') + '>Template aktif</label></div></div>',
      foot: '<button class="btn" data-c>Batal</button><button class="btn btn-navy" data-s>' + ic('check', 'sm') + 'Simpan Template</button>' });
    var e = m.el;
    function panduan() {
      var j = ctx.jenis[$('#jn', e).value] || {}, chip = function (k) { return '<span class="chip" style="margin:2px;text-transform:none">{{' + esc(k) + '}}</span>'; };
      $('#panduan', e).innerHTML = '<b>Otomatis (' + esc(j.label || '') + '):</b> ' + (j.kunci || []).filter(function (k) { return !(j.blok || {})[k]; }).map(chip).join('') +
        Object.keys(j.blok || {}).map(function (b) { return '<br><b>Baris berulang ' + b + ':</b> taruh ' + chip('#' + b) + ' di baris tabel, kolom: ' + j.blok[b].map(function (k) { return chip(b + '.' + k); }).join('') + chip('NO'); }).join('') +
        '<br><b>Sistem:</b> ' + ['NOMOR', 'TANGGAL', 'HARI', 'BULAN_ROMAWI', 'TAHUN', 'INSTITUSI_NAMA', 'INSTITUSI_ALAMAT', 'INSTITUSI_KOTA', 'QR', 'KODE_VERIFIKASI', 'URL_VERIFIKASI'].map(chip).join('') +
        '<br><b>Penanda tangan (n = 1,2,…):</b> ' + ['NAMA_PEJABAT_1', 'JABATAN_1', 'NIP_1', 'TTD_1', 'TGL_TTD_1'].map(chip).join('') +
        '<br><b>Pengubah:</b> ' + ['NAMA|kapital', 'TOTAL|rupiah', 'TOTAL|terbilang', 'CATATAN|bawaan:-'].map(chip).join('') + ' · <b>Kolom lain</b> otomatis menjadi isian form.';
    }
    function keluaran() {
      var ops = { docs: ['pdf', 'docx'], sheets: ['pdf', 'xlsx'], slides: ['pdf', 'png', 'pptx'] }[st.engine] || ['pdf'], cur = t ? t.keluaran : ['pdf'];
      $('#klr', e).innerHTML = ops.map(function (o) { return '<label class="check"><input type="checkbox" data-k="' + o + '"' + (o === 'pdf' || cur.indexOf(o) >= 0 ? ' checked' : '') + (o === 'pdf' ? ' disabled' : '') + '>' + o.toUpperCase() + '</label>'; }).join('');
    }
    function gambarBidang() {
      $('#bidangBox', e).innerHTML = '<div class="flabel" style="margin:6px 0 8px">Kolom isian operator (' + st.bidang.length + ')</div>' + (st.bidang.length ? '<div class="tbl-wrap" style="box-shadow:none;margin-bottom:14px"><table class="tbl" style="min-width:560px"><thead><tr><th>Penanda</th><th>Label di form</th><th>Tipe</th><th>Wajib</th></tr></thead><tbody>' +
        st.bidang.map(function (b, i) { return '<tr><td class="code" style="font-size:12px">{{' + esc(b.kunci) + '}}</td><td><input class="input" style="min-height:38px;padding:6px 12px" data-bl="' + i + '" value="' + esc(b.label) + '"></td>' +
          '<td><select class="select" style="min-height:38px;padding:6px 32px 6px 12px" data-bt="' + i + '">' + A.opsi(['teks', 'area', 'naskah', 'tanggal', 'angka', 'pilihan', 'daftar'], b.tipe) + '</select>' + (b.tipe === 'pilihan' ? '<input class="input" style="min-height:36px;margin-top:6px;padding:6px 12px" data-bo="' + i + '" placeholder="Opsi dipisah koma" value="' + esc((b.opsi || []).join(', ')) + '">' : '') + '</td>' +
          '<td><label class="check"><input type="checkbox" data-bw="' + i + '"' + (b.wajib ? ' checked' : '') + '></label></td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="help">Tidak ada kolom isian tambahan — semua data diisi otomatis.</p>');
      $$('[data-bl]', e).forEach(function (x) { x.oninput = function () { st.bidang[x.dataset.bl].label = x.value; }; });
      $$('[data-bt]', e).forEach(function (x) { x.onchange = function () { st.bidang[x.dataset.bt].tipe = x.value; gambarBidang(); }; });
      $$('[data-bo]', e).forEach(function (x) { x.oninput = function () { st.bidang[x.dataset.bo].opsi = x.value.split(',').map(function (s) { return s.trim(); }).filter(String); }; });
      $$('[data-bw]', e).forEach(function (x) { x.onchange = function () { st.bidang[x.dataset.bw].wajib = x.checked; }; });
    }
    function gambarSlot() {
      var pj = ctx.pejabat.map(function (p) { return { v: p.userId, l: p.nama + (p.jabatan ? ' — ' + p.jabatan : '') + (p.punyaPin ? '' : ' (belum atur PIN)') }; });
      $('#slotBox', e).innerHTML = '<div class="flabel" style="margin:6px 0 8px">Penanda tangan (' + st.slot.length + ')</div>' + (st.slot.length ? st.slot.map(function (s, i) {
        return '<div class="card" style="box-shadow:none;padding:12px;margin-bottom:10px;background:#fff"><div class="grid-3" style="align-items:end"><div class="field" style="margin:0"><label>Slot ' + s.slot + ' — label</label><input class="input" data-sl="' + i + '" value="' + esc(s.label) + '"></div>' +
          '<div class="field" style="margin:0"><label>Pejabat</label><select class="select" data-su="' + i + '">' + A.opsi(pj, s.userId, '— pilih —') + '</select></div>' +
          '<div><label class="check"><input type="checkbox" data-sw="' + i + '"' + (s.wajibSetuju ? ' checked' : '') + '>Wajib setuju (PIN)</label><div class="help">Urutan: <input type="number" min="1" data-so="' + i + '" value="' + (s.urutan || s.slot) + '" style="width:50px;border:2px solid #111;border-radius:6px;padding:2px 6px"></div></div></div></div>';
      }).join('') : '<p class="help">Template tidak memakai penanda {{TTD_n}} / {{NAMA_PEJABAT_n}}.</p>');
      $$('[data-sl]', e).forEach(function (x) { x.oninput = function () { st.slot[x.dataset.sl].label = x.value; }; });
      $$('[data-su]', e).forEach(function (x) { x.onchange = function () { st.slot[x.dataset.su].userId = x.value; }; });
      $$('[data-sw]', e).forEach(function (x) { x.onchange = function () { st.slot[x.dataset.sw].wajibSetuju = x.checked; }; });
      $$('[data-so]', e).forEach(function (x) { x.onchange = function () { st.slot[x.dataset.so].urutan = Number(x.value) || 1; }; });
    }
    $('#jn', e).onchange = panduan;
    $('#pindai', e).onclick = function () {
      var b = this;
      S.busy(b, S.api('doc.scan', { url: $('#url', e).value, jenis: $('#jn', e).value, templateId: t ? t.id : undefined }), 'Memindai…').then(function (r) {
        if (!r.success) { $('#pInfo', e).innerHTML = '<span style="color:var(--red)">' + esc(r.message) + '</span>'; return; }
        st.fileId = r.data.fileId; st.engine = r.data.engine; st.bidang = r.data.skema.bidang;
        var lama = {}; st.slot.forEach(function (s) { lama[s.slot] = s; });
        st.slot = r.data.skema.slot.map(function (s) { var l = lama[s.slot]; return l ? Object.assign(s, { label: l.label, userId: l.userId, wajibSetuju: l.wajibSetuju, urutan: l.urutan }) : s; });
        if (!$('#nm', e).value) $('#nm', e).value = r.data.nama.replace(/^TEMPLATE\s*[—-]\s*/i, '');
        $('#pInfo', e).innerHTML = '✅ ' + esc(r.data.engine.toUpperCase()) + ' · ' + r.data.jumlahPenanda + ' penanda ditemukan · ' + r.data.skema.otomatis.length + ' diisi otomatis' + (r.data.skema.hilang.length ? ' · <b style="color:var(--red)">tidak lagi ada: ' + esc(r.data.skema.hilang.join(', ')) + '</b>' : '');
        keluaran(); gambarBidang(); gambarSlot();
      });
    };
    e.querySelector('[data-c]').onclick = m.close;
    e.querySelector('[data-s]').onclick = function () {
      if (!st.fileId) { S.toast('Tempel URL template lalu klik Pindai.', 'warn'); return; }
      var klr = $$('[data-k]', e).filter(function (x) { return x.checked; }).map(function (x) { return x.dataset.k; });
      A.simpanLalu('doc.templateSave', { id: t ? t.id : undefined, kode: $('#kd', e).value, nama: $('#nm', e).value, jenis: $('#jn', e).value, fileId: st.fileId, engine: st.engine, bidang: st.bidang, slot: st.slot,
        keluaran: klr, qrPer: $('#qp', e).checked, formatNomor: $('#fn', e).value, aktif: $('#ak', e).checked }, this, ['doc']).then(function (r) { if (r.success) { m.close(); A.go('#/dokumen?tab=template'); } });
    };
    panduan(); keluaran(); gambarBidang(); gambarSlot();
  };

  /** Form isian dari skema bidang. */
  function formBidang(bidang) {
    return bidang.map(function (b) {
      var id = 'de_' + b.kunci, lbl = '<label for="' + id + '">' + esc(b.label) + (b.wajib ? ' <span class="req">*</span>' : '') + '</label>', inp;
      if (b.tipe === 'area') inp = '<textarea class="textarea" id="' + id + '"></textarea>';
      else if (b.tipe === 'naskah') inp = '<div class="textarea" id="' + id + '" contenteditable="true" style="min-height:120px;overflow:auto"></div><div class="help">Mendukung tebal/miring (Ctrl+B / Ctrl+I) dan daftar.</div>';
      else if (b.tipe === 'pilihan') inp = '<select class="select" id="' + id + '">' + A.opsi(b.opsi || [], '', '— pilih —') + '</select>';
      else if (b.tipe === 'daftar') inp = '<div class="tbl-wrap" style="box-shadow:none"><table class="tbl" style="min-width:0" id="' + id + '"><thead><tr>' + (b.kolom || []).map(function (k) { return '<th>' + esc(k.label) + '</th>'; }).join('') + '<th></th></tr></thead><tbody></tbody></table></div><button type="button" class="btn btn-sm" data-row="' + b.kunci + '" style="margin-top:8px">' + ic('plus', 'sm') + 'Tambah baris</button>';
      else if (b.tipe === 'gambar') inp = '<div class="help">Kolom gambar belum didukung dari form — sisipkan gambar langsung di template.</div>';
      else inp = '<input class="input" id="' + id + '" type="' + ({ tanggal: 'date', angka: 'number' }[b.tipe] || 'text') + '">';
      return '<div class="field" data-k="' + esc(b.kunci) + '">' + lbl + inp + '</div>';
    }).join('');
  }
  function bindDaftar(box, bidang) {
    bidang.filter(function (b) { return b.tipe === 'daftar'; }).forEach(function (b) {
      var tb = $('#de_' + b.kunci + ' tbody', box);
      function baris() { var tr = S.h('<table><tr>' + (b.kolom || []).map(function (k) { return '<td><input class="input" style="min-height:36px;padding:6px 10px" data-c="' + esc(k.kunci) + '"></td>'; }).join('') + '<td><button type="button" class="ib-btn" aria-label="Hapus baris">' + ic('x', 'sm') + '</button></td></tr></table>').querySelector('tr'); tr.querySelector('button').onclick = function () { tr.remove(); }; tb.appendChild(tr); }
      $('[data-row="' + b.kunci + '"]', box).onclick = baris; baris();
    });
  }
  function kumpulkan(box, bidang) {
    var o = {};
    bidang.forEach(function (b) {
      var el = $('#de_' + b.kunci, box); if (!el) return;
      if (b.tipe === 'naskah') o[b.kunci] = el.innerHTML;
      else if (b.tipe === 'angka') o[b.kunci] = el.value === '' ? '' : Number(el.value);
      else if (b.tipe === 'daftar') o[b.kunci] = $$('tbody tr', el).map(function (tr) { var r = {}; $$('[data-c]', tr).forEach(function (i) { r[i.dataset.c] = i.value.trim(); }); return r; }).filter(function (r) { return Object.keys(r).some(function (k) { return r[k]; }); });
      else if (b.tipe !== 'gambar') o[b.kunci] = el.value.trim();
    });
    return o;
  }

  /** Buat dokumen dari konteks (jenis + refId). */
  A.buatDokumen = function (opt) {
    S.Store.load('doc.templates', {}, { maxAge: 60000 }).then(function (d) {
      if (!d) return;
      var semua = d.templates.filter(function (t) { return t.aktif && (opt.jenis === 'UMUM' ? true : t.jenis === opt.jenis); });
      if (!semua.length) {
        S.ask('Belum ada template', 'Belum ada template aktif untuk <b>' + esc((d.jenis[opt.jenis] || {}).label || opt.jenis) + '</b>. Tambahkan di menu Dokumen → Template' + (A.isSup() ? ', atau buat template contoh sekali klik.' : '.'), { ok: 'Buka Template' }).then(function (ya) { if (ya) A.go('#/dokumen?tab=template'); });
        return;
      }
      var tpl = semua[0], bulanIni = fmt.iso().slice(0, 7);
      var m = S.modal({ title: 'Buat Dokumen', wide: true, body:
        '<div class="grid-2"><div class="field"><label>Template</label><select class="select" id="tp">' + A.opsi(semua.map(function (t) { return { v: t.id, l: t.nama + ' (' + t.kode + ')' }; }), tpl.id) + '</select></div>' +
        '<div class="field" id="refW"></div></div><div class="field"><label>Perihal (opsional)</label><input class="input" id="ph" placeholder="Dibuat otomatis bila kosong"></div><div id="fb"></div><div id="ttdInfo"></div>',
        foot: '<button class="btn" data-c>Batal</button><button class="btn" data-pv>' + ic('eye', 'sm') + 'Pratinjau PDF</button><button class="btn btn-navy" data-s>' + ic('check', 'sm') + 'Terbitkan</button>' });
      var e = m.el;
      function render() {
        tpl = semua.filter(function (t) { return t.id === $('#tp', e).value; })[0];
        var ref = (d.jenis[tpl.jenis] || {}).ref;
        $('#refW', e).innerHTML = tpl.jenis === 'REKAP_BULANAN' ? '<label>Bulan rekap</label><input class="input" type="month" id="ref" value="' + esc(opt.refId || bulanIni) + '">'
          : ref ? '<label>' + esc(ref) + '</label><input class="input" id="ref" value="' + esc(opt.refId || '') + '" ' + (opt.refId ? 'readonly' : 'placeholder="ID ' + esc(ref) + '"') + '>' : '<label>Referensi</label><input class="input" value="—" disabled>';
        $('#fb', e).innerHTML = formBidang(tpl.bidang); bindDaftar($('#fb', e), tpl.bidang);
        var butuh = tpl.slot.filter(function (s) { return s.wajibSetuju; });
        $('#ttdInfo', e).innerHTML = butuh.length ? '<div class="warnbox">' + ic('pen') + '<span>Dokumen ini perlu persetujuan: ' + butuh.map(function (s) { var u = d.pejabat.filter(function (p) { return p.userId === s.userId; })[0]; return '<b>' + esc(s.label) + '</b> (' + esc(u ? u.nama : '?') + ')'; }).join(', ') + '. Nomor terbit setelah disetujui.</span></div>' : '';
        e.querySelector('[data-s]').innerHTML = ic('check', 'sm') + (butuh.length ? 'Ajukan Persetujuan' : 'Terbitkan');
      }
      function payload() { var r = $('#ref', e); return { templateId: tpl.id, refId: r ? r.value : '', perihal: $('#ph', e).value, isian: kumpulkan($('#fb', e), tpl.bidang) }; }
      $('#tp', e).onchange = render; render();
      e.querySelector('[data-c]').onclick = m.close;
      e.querySelector('[data-pv]').onclick = function () { S.busy(this, S.api('doc.preview', payload(), { timeout: 90000 }), 'Membuat pratinjau…').then(function (r) { if (r.success) S.openB64(r.data.base64, r.data.mime); else S.toast(r.message, 'error'); }); };
      e.querySelector('[data-s]').onclick = function () {
        S.busy(this, S.api('doc.create', payload(), { timeout: 120000 }), 'Memproses dokumen…').then(function (r) {
          if (!r.success) { S.toast(r.message, 'error'); return; }
          S.Store.stale(['doc']); m.close(); S.toast(r.message); A.segarBadge();
          if (r.data.status === 'TERBIT') S.api('doc.download', { id: r.data.id, format: 'pdf' }).then(function (x) { if (x.success) S.downloadB64(x.data.base64, x.data.nama, x.data.mime); });
        });
      };
    });
  };

  // ============ PERSETUJUAN TTD ============
  A.pages.persetujuan = function (el) {
    el.innerHTML = A.head('Persetujuan Tanda Tangan', 'Dokumen yang menunggu persetujuan Anda.', '<button class="btn btn-icon" id="seg" aria-label="Segarkan">' + ic('refresh') + '</button>') +
      (A.user.punyaPin ? '' : '<div class="warnbox" style="margin-bottom:16px">' + ic('key') + '<span>Anda belum mengatur <b>PIN tanda tangan</b>. <a href="#/akun">Atur PIN di Akun Saya</a> sebelum menyetujui dokumen.</span></div>') +
      '<div id="list">' + S.skeleton(4) + '</div>';
    function gambar(d) {
      var rows = A.menungguSaya(d.rows), box = $('#list', el);
      if (!rows.length) { box.innerHTML = S.empty('Tidak ada dokumen yang menunggu persetujuan', 'sukses'); return; }
      box.innerHTML = rows.map(function (x) {
        var slotSaya = x.penandatangan.filter(function (s) { return s.userId === A.user.userId && s.status === 'MENUNGGU'; })[0];
        var slotBypass = x.penandatangan.filter(function (s) { return s.status === 'MENUNGGU'; }).sort(function (a, b) { return a.urutan - b.urutan; })[0];
        return '<div class="card" style="margin-bottom:16px"><div class="card-head bg-lilac"><h3>' + ic('file', 'sm') + ' ' + esc(x.perihal) + '</h3>' + S.badge('MENUNGGU_TTD', 'Menunggu TTD') + '</div><div class="card-pad">' +
          '<div class="help">' + esc(x.template) + ' · diajukan ' + esc(x.oleh) + ' · ' + fmt.tglJam(x.dibuat) + '</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0">' +
          x.penandatangan.map(function (p) { return '<span class="chip" style="background:' + (p.status === 'SETUJU' ? 'var(--mint)' : 'var(--yellow)') + '">' + (p.status === 'SETUJU' ? ic('check', 'sm') : ic('clock', 'sm')) + esc(p.label) + ': ' + esc(p.nama) + '</span>'; }).join('') + '</div>' +
          '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" data-dt="' + esc(x.id) + '">' + ic('list', 'sm') + 'Lihat Data</button><button class="btn" data-pv="' + esc(x.id) + '">' + ic('eye', 'sm') + 'Pratinjau PDF</button>' +
          (slotSaya ? '<button class="btn btn-navy" data-ok="' + esc(x.id) + '" data-slot="' + slotSaya.slot + '">' + ic('pen', 'sm') + 'Setujui dengan PIN</button><button class="btn btn-danger-o" data-no="' + esc(x.id) + '" data-slot="' + slotSaya.slot + '">Tolak</button>' : '') +
          (A.isSup() && slotBypass && (!slotSaya || slotSaya.slot !== slotBypass.slot) ? '<button class="btn btn-yellow" data-bp="' + esc(x.id) + '" data-slot="' + slotBypass.slot + '" data-nama="' + esc(slotBypass.nama) + '">' + ic('shield', 'sm') + 'Bypass ' + esc(slotBypass.label) + '</button>' : '') +
          '</div></div></div>';
      }).join('');
      $$('[data-dt]', box).forEach(function (b) { b.onclick = function () { S.busy(b, S.api('doc.detail', { id: b.dataset.dt }), '…').then(function (r) {
        if (!r.success) return S.toast(r.message, 'error');
        S.modal({ title: r.data.perihal, body: '<dl class="kv">' + Object.keys(r.data.data).map(function (k) { return '<dt>' + esc(k.replace(/_/g, ' ')) + '</dt><dd>' + esc(String(r.data.data[k]).replace(/<[^>]+>/g, ' ')) + '</dd>'; }).join('') + '</dl>' });
      }); }; });
      $$('[data-pv]', box).forEach(function (b) { b.onclick = function () { S.busy(b, S.api('doc.preview', { id: b.dataset.pv }, { timeout: 90000 }), 'Membuat…').then(function (r) { if (r.success) S.openB64(r.data.base64, r.data.mime); else S.toast(r.message, 'error'); }); }; });
      $$('[data-ok]', box).forEach(function (b) { b.onclick = function () {
        S.ask('Setujui dokumen', 'Masukkan <b>PIN tanda tangan</b> 6 digit Anda. Setelah semua penanda tangan setuju, dokumen langsung terbit dengan QR verifikasi.', { input: 'PIN 6 digit', type: 'password', attrs: 'inputmode="numeric" maxlength="6" autocomplete="one-time-code"', required: true, min: 6, minMsg: 'PIN harus 6 angka.', ok: 'Setujui' }).then(function (pin) {
          if (!pin) return;
          S.busy(b, S.api('doc.setujui', { id: b.dataset.ok, slot: Number(b.dataset.slot), pin: pin }, { timeout: 120000 }), 'Menerbitkan…').then(function (r) { S.toast(r.message, r.success ? '' : 'error'); if (r.success) { S.Store.stale(['doc']); muat(true); A.segarBadge(); } });
        }); }; });
      $$('[data-no]', box).forEach(function (b) { b.onclick = function () {
        S.ask('Tolak dokumen?', 'Dokumen akan dikembalikan ke operator.', { input: 'Alasan penolakan', required: true, min: 3, multiline: true, danger: true, ok: 'Tolak' }).then(function (v) {
          if (v) A.simpanLalu('doc.tolak', { id: b.dataset.no, slot: Number(b.dataset.slot), catatan: v }, b, ['doc']).then(function (r) { if (r.success) { muat(true); A.segarBadge(); } });
        }); }; });
      $$('[data-bp]', box).forEach(function (b) { b.onclick = function () {
        S.ask('Bypass persetujuan', 'Anda menyetujui atas nama <b>' + esc(b.dataset.nama) + '</b>. Tercatat sebagai <b>BYPASS</b> di log dan halaman verifikasi.', { input: 'Alasan bypass', required: true, min: 5, minMsg: 'Alasan minimal 5 karakter.', ok: 'Bypass & Setujui' }).then(function (v) {
          if (v) S.busy(b, S.api('doc.setujui', { id: b.dataset.bp, slot: Number(b.dataset.slot), bypass: true, catatan: v }, { timeout: 120000 }), 'Memproses…').then(function (r) { S.toast(r.message, r.success ? '' : 'error'); if (r.success) { S.Store.stale(['doc']); muat(true); A.segarBadge(); } });
        }); }; });
    }
    function muat(f) { S.Store.load('doc.list', {}, { maxAge: 15000, force: f, onData: gambar }); }
    $('#seg', el).onclick = function () { muat(true); };
    muat();
  };

  // ============ PENGGUNA ============
  A.pages.pengguna = function (el) {
    el.innerHTML = A.head('Pengguna Admin', 'Akun yang bisa masuk panel. Kepala Sekolah hanya melihat &amp; menyetujui dokumen.', '<button class="btn btn-yellow" id="add">' + ic('plus') + 'Tambah Pengguna</button>') + '<div id="tbl">' + S.skeleton(4) + '</div>';
    var data = null;
    function gambar() {
      A.tabel($('#tbl', el), data.rows, [
        { t: 'Nama', f: function (x) { return '<span style="display:flex;gap:8px;align-items:center"><span class="avatar">' + esc(fmt.inisial(x.nama)) + '</span><span><b>' + esc(x.nama) + '</b><div class="sub">' + esc(x.jabatan || '') + '</div></span></span>'; } },
        { t: 'Username', f: function (x) { return '<span class="code" style="font-size:13px">' + esc(x.username) + '</span>'; } },
        { t: 'Peran', f: function (x) { return S.badge(x.role); } }, { t: 'PIN', f: function (x) { return x.punyaPin ? S.badge('TERSEDIA', 'Sudah') : '<span class="muted">Belum</span>'; } },
        { t: 'Status', f: function (x) { return S.badge(x.aktif ? 'TERSEDIA' : 'NONAKTIF', x.aktif ? 'Aktif' : 'Nonaktif'); } },
        { t: 'Login Terakhir', f: function (x) { return x.loginTerakhir ? fmt.tglJam(x.loginTerakhir) : '—'; } },
        { t: '', cls: 'num', f: function (x) { return '<div class="row-acts"><button class="ib-btn" data-ed="' + esc(x.userId) + '" aria-label="Ubah">' + ic('edit', 'sm') + '</button><button class="ib-btn" data-rs="' + esc(x.userId) + '" title="Reset password" aria-label="Reset password">' + ic('key', 'sm') + '</button></div>'; } }
      ], { bind: function (box) {
        $$('[data-ed]', box).forEach(function (b) { b.onclick = function () { form(data.rows.filter(function (x) { return x.userId === b.dataset.ed; })[0]); }; });
        $$('[data-rs]', box).forEach(function (b) { b.onclick = function () {
          var x = data.rows.filter(function (y) { return y.userId === b.dataset.rs; })[0];
          var m = S.modal({ title: 'Reset password · ' + x.nama, body: '<div class="field"><label>Password baru (min. 8)</label><input class="input" id="pw" type="text" value="Triguna' + Math.floor(1000 + Math.random() * 8999) + '"></div><label class="check"><input type="checkbox" id="rp">Reset PIN tanda tangan juga</label>',
            foot: '<button class="btn" data-c>Batal</button><button class="btn btn-danger" data-s>Reset</button>' });
          m.el.querySelector('[data-c]').onclick = m.close;
          m.el.querySelector('[data-s]').onclick = function () { A.simpanLalu('users.resetPassword', { userId: x.userId, password: $('#pw', m.el).value, resetPin: $('#rp', m.el).checked }, this, ['users']).then(function (r) { if (r.success) { m.close(); muat(true); } }); };
        }; });
      } });
    }
    function form(x) {
      var m = S.modal({ drawer: true, title: x ? 'Ubah Pengguna' : 'Tambah Pengguna', body:
        '<div class="field"><label>Nama lengkap <span class="req">*</span></label><input class="input" id="nm" value="' + esc(x ? x.nama : '') + '"></div>' +
        '<div class="field"><label>Username <span class="req">*</span></label><input class="input" id="un" autocapitalize="none" value="' + esc(x ? x.username : '') + '"></div>' +
        '<div class="field"><label>Peran</label><select class="select" id="rl">' + A.opsi([{ v: 'ADMIN_SARPRAS', l: 'Admin Sarpras' }, { v: 'KEPALA_SEKOLAH', l: 'Kepala Sekolah (lihat + setujui)' }, { v: 'SUPER_ADMIN', l: 'Super Admin' }], x ? x.role : 'ADMIN_SARPRAS') + '</select></div>' +
        '<div class="field"><label>Jabatan (untuk dokumen)</label><input class="input" id="jb" value="' + esc(x ? x.jabatan : '') + '" placeholder="Kepala Sekolah / Wakasek Sarpras"></div>' +
        '<div class="field"><label>NIP</label><input class="input" id="np" value="' + esc(x ? x.nip : '') + '" inputmode="numeric"></div>' +
        (x ? '<label class="check"><input type="checkbox" id="ak"' + (x.aktif ? ' checked' : '') + '>Aktif</label>' : '<div class="field"><label>Password awal (min. 8)</label><input class="input" id="pw" value="Triguna' + Math.floor(1000 + Math.random() * 8999) + '"></div>'),
        foot: '<button class="btn" data-c>Batal</button><button class="btn btn-navy" data-s>Simpan</button>' });
      m.el.querySelector('[data-c]').onclick = m.close;
      m.el.querySelector('[data-s]').onclick = function () {
        A.simpanLalu('users.save', { userId: x ? x.userId : undefined, nama: $('#nm', m.el).value, username: $('#un', m.el).value, role: $('#rl', m.el).value, jabatan: $('#jb', m.el).value, nip: $('#np', m.el).value,
          aktif: x ? $('#ak', m.el).checked : true, password: x ? undefined : $('#pw', m.el).value }, this, ['users', 'doc.templates']).then(function (r) { if (r.success) { m.close(); muat(true); } });
      };
    }
    function muat(f) { S.Store.load('users.list', {}, { maxAge: 60000, force: f, onData: function (d) { data = d; gambar(); } }); }
    $('#add', el).onclick = function () { form(null); };
    muat();
  };

  // ============ MIGRASI DATA ============
  A.pages.migrasi = function (el) {
    var st = { scan: null, cfg: {}, overwrite: false };
    el.innerHTML = A.head('Migrasi Data', 'Pindahkan data dari spreadsheet lama (inventaris, siswa, guru). Spreadsheet lama <b>hanya dibaca</b>.') +
      '<div class="stepbar"><span class="on" id="s1"><i>1</i>Sumber</span><span id="s2"><i>2</i>Petakan kolom</span><span id="s3"><i>3</i>Pindai &amp; Import</span></div>' +
      '<div class="card card-pad" style="margin-bottom:18px"><div class="field"><label>URL atau ID Google Spreadsheet lama</label><div class="scanrow"><input class="input" id="src" placeholder="https://docs.google.com/spreadsheets/d/…">' +
      '<button class="btn btn-ink" id="scan">' + ic('scan', 'sm') + 'Baca Struktur</button></div><div class="help">File Excel? Buka di Google Drive → <b>File → Simpan sebagai Google Spreadsheet</b>, lalu tempel URL-nya. Harus bisa dibuka oleh akun pemilik Apps Script.</div></div></div>' +
      '<div id="sheets"></div><div id="hasil"></div>';
    var TARGET_OPS = [{ v: '', l: '— Lewati sheet ini —' }, { v: 'INVENTARIS', l: 'Inventaris Barang' }, { v: 'SISWA', l: 'Data Siswa' }, { v: 'GURU', l: 'Data Guru/Staf' }, { v: 'KATEGORI', l: 'Kategori' }, { v: 'LOKASI', l: 'Lokasi' }];
    $('#scan', el).onclick = function () {
      S.busy(this, S.api('migrasi.scan', { source: $('#src', el).value }, { timeout: 90000 }), 'Membaca…').then(function (r) {
        if (!r.success) { S.toast(r.message, 'error'); return; }
        st.scan = r.data; st.cfg = {};
        r.data.sheets.forEach(function (s) { st.cfg[s.nama] = { target: s.target, peta: Object.assign({}, s.peta), tipeDefault: 'AUTO' }; });
        $('#s2', el).classList.add('on'); gambarSheets(); $('#hasil', el).innerHTML = '';
      });
    };
    function gambarSheets() {
      var d = st.scan;
      $('#sheets', el).innerHTML = '<h2 class="h2" style="margin-bottom:12px">' + ic('db') + ' ' + esc(d.source.nama) + '</h2>' + d.sheets.map(function (s) {
        var c = st.cfg[s.nama], fields = c.target ? d.targets[c.target].fields : {};
        return '<div class="card" style="margin-bottom:16px"><div class="card-head ' + (c.target ? 'bg-mint' : 'bg-cream') + '"><h3>' + esc(s.nama) + ' <span class="help">(' + s.baris + ' baris)</span></h3>' +
          '<select class="select" data-tg="' + esc(s.nama) + '" style="width:auto;min-height:40px">' + A.opsi(TARGET_OPS, c.target) + '</select></div>' +
          (c.target ? '<div class="card-pad"><div class="grid-3">' + Object.keys(fields).map(function (f) {
            return '<div class="field" style="margin-bottom:8px"><label style="font-size:11px">' + esc(fields[f]) + '</label><select class="select" style="min-height:40px" data-mp="' + esc(s.nama) + '" data-f="' + f + '">' + A.opsi(s.headers, c.peta[f] || '', '— tidak ada —') + '</select></div>';
          }).join('') + '</div>' + (c.target === 'INVENTARIS' ? '<div class="field" style="max-width:340px"><label>Tipe bila kolom Tipe kosong</label><select class="select" data-td="' + esc(s.nama) + '">' + A.opsi([{ v: 'AUTO', l: 'Otomatis (jumlah >1 = STOK)' }, { v: 'UNIT', l: 'Semua UNIT (1 kode per buah)' }, { v: 'STOK', l: 'Semua STOK' }], c.tipeDefault) + '</select></div>' : '') +
          '<details><summary class="help" style="cursor:pointer">Contoh data</summary><div style="overflow:auto;margin-top:8px"><table class="tbl" style="min-width:0"><thead><tr>' + s.headers.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          s.contoh.map(function (r) { return '<tr>' + s.headers.map(function (h) { return '<td>' + esc(r[h]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div></details></div>' : '') + '</div>';
      }).join('') + '<div class="card card-pad"><label class="check"><input type="checkbox" id="ow"' + (st.overwrite ? ' checked' : '') + '>Timpa data yang sudah ada (kelas, lokasi, merek, dll. diperbarui dari sumber)</label>' +
        '<p class="help">Tanpa centang: data yang sudah ada dilewati, hanya data baru yang ditambahkan. Aman diulang untuk menangkap data baru sebelum pindah total.</p>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px"><button class="btn btn-lg" id="dry">' + ic('eye') + 'Pindai (Dry-run)</button><button class="btn btn-lg btn-navy" id="run">' + ic('upload') + 'Jalankan Import</button></div></div>';
      $$('[data-tg]', el).forEach(function (x) { x.onchange = function () { var c = st.cfg[x.dataset.tg], s = st.scan.sheets.filter(function (y) { return y.nama === x.dataset.tg; })[0]; c.target = x.value; c.peta = {}; if (x.value) tebak(s, c); else gambarSheets(); }; });
      $$('[data-mp]', el).forEach(function (x) { x.onchange = function () { st.cfg[x.dataset.mp].peta[x.dataset.f] = x.value; }; });
      $$('[data-td]', el).forEach(function (x) { x.onchange = function () { st.cfg[x.dataset.td].tipeDefault = x.value; }; });
      $('#ow', el).onchange = function () { st.overwrite = this.checked; };
      $('#dry', el).onclick = function () { jalankan(true, this); };
      $('#run', el).onclick = function () { var b = this; S.ask('Jalankan import?', 'Data akan ditulis ke database SIM-SARPRAS. Spreadsheet lama tidak diubah. Import aman diulang (tidak membuat data ganda).', { ok: 'Jalankan Import' }).then(function (ya) { if (ya) jalankan(false, b); }); };
    }
    function tebak(s, c) {   // tebakan sederhana di browser saat tujuan diganti manual
      var fields = st.scan.targets[c.target].fields;
      Object.keys(fields).forEach(function (f) { var lbl = fields[f].replace(/[*()]/g, '').toLowerCase(); var h = s.headers.filter(function (x) { return x.toLowerCase().indexOf(lbl.split(' ')[0]) >= 0; })[0]; if (h) c.peta[f] = h; });
      gambarSheets();
    }
    function jalankan(dry, btn) {
      var jobs = Object.keys(st.cfg).filter(function (n) { return st.cfg[n].target; }).map(function (n) { return { sheet: n, target: st.cfg[n].target, peta: st.cfg[n].peta, tipeDefault: st.cfg[n].tipeDefault }; });
      if (!jobs.length) { S.toast('Pilih minimal satu sheet beserta tujuannya.', 'warn'); return; }
      S.busy(btn, S.api('migrasi.run', { source: st.scan.source.id, jobs: jobs, dryRun: dry, overwrite: st.overwrite }, { timeout: 300000 }), dry ? 'Memindai…' : 'Mengimpor…').then(function (r) {
        if (!r.success) { S.toast(r.message, 'error'); return; }
        $('#s3', el).classList.add('on');
        if (!dry) S.Store.stale(null);
        $('#hasil', el).innerHTML = '<div class="card" style="margin-top:18px"><div class="card-head ' + (dry ? 'bg-yellow' : 'bg-mint') + '"><h3>' + (dry ? 'Hasil Pindai — belum ada yang ditulis' : 'Import selesai') + '</h3></div><div class="card-pad">' +
          '<div class="tbl-wrap" style="box-shadow:none"><table class="tbl"><thead><tr><th>Sheet</th><th>Tujuan</th><th class="num">Di sumber</th><th class="num">Ditambah</th><th class="num">Diperbarui</th><th class="num">Dilewati</th><th class="num">Error</th></tr></thead><tbody>' +
          r.data.laporan.map(function (x) { return '<tr><td>' + esc(x.sheet) + '</td><td>' + esc(x.label) + '</td><td class="num">' + x.source + '</td><td class="num"><b>' + x.inserted + '</b></td><td class="num">' + x.updated + '</td><td class="num">' + x.skipped + '</td><td class="num">' + x.errors.length + '</td></tr>'; }).join('') + '</tbody></table></div>' +
          (r.data.peringatan.length ? '<div class="warnbox" style="margin-top:12px">' + ic('info') + '<div>' + r.data.peringatan.slice(0, 20).map(esc).join('<br>') + '</div></div>' : '') +
          r.data.laporan.filter(function (x) { return x.errors.length; }).map(function (x) { return '<details style="margin-top:10px"><summary class="help">Error di ' + esc(x.sheet) + '</summary>' + x.errors.slice(0, 50).map(function (e) { return '<div class="help">Baris ' + e.baris + ': ' + esc(e.pesan) + '</div>'; }).join('') + '</details>'; }).join('') +
          '</div></div>';
        $('#hasil', el).scrollIntoView({ behavior: 'smooth' });
      });
    }
  };

  // ============ PENGATURAN ============
  A.pages.pengaturan = function (el) {
    el.innerHTML = A.head('Pengaturan', 'Identitas sekolah, aturan peminjaman, status sistem &amp; log.') + '<div class="cols-2" style="margin-top:0"><div id="kiri">' + S.skeleton(5) + '</div><div id="kanan">' + S.skeleton(5) + '</div></div><div id="log" style="margin-top:22px"></div>';
    S.Store.load('settings.get', {}, { maxAge: 0, force: true, batch: false, onData: function (s) {
      $('#kiri', el).innerHTML = '<div class="card set-card"><div class="card-head bg-yellow"><h3>' + ic('clock', 'sm') + ' Peminjaman</h3></div><div class="card-pad"><div class="field"><label>Jam batas pengembalian (HH:MM)</label><input class="input mono" id="JAM_BATAS_KEMBALI" value="' + esc(s.JAM_BATAS_KEMBALI) + '" style="font-size:22px;max-width:160px"><div class="help">Berlaku untuk peminjaman baru.</div></div>' +
        '<div class="field"><label>Prefix kode barang</label><input class="input mono" id="PREFIX_KODE" value="' + esc(s.PREFIX_KODE) + '" style="max-width:160px;text-transform:uppercase"></div></div></div>' +
        '<div class="card set-card"><div class="card-head bg-sky"><h3>' + ic('home', 'sm') + ' Identitas Sekolah</h3></div><div class="card-pad"><div class="field"><label>Nama sekolah</label><input class="input" id="NAMA_SEKOLAH" value="' + esc(s.NAMA_SEKOLAH) + '"></div>' +
        '<div class="field"><label>Alamat</label><input class="input" id="ALAMAT_SEKOLAH" value="' + esc(s.ALAMAT_SEKOLAH) + '"></div><div class="field"><label>Kota (untuk tanggal dokumen)</label><input class="input" id="KOTA" value="' + esc(s.KOTA) + '"></div>' +
        '<div class="field"><label>Alamat aplikasi (untuk QR verifikasi dokumen)</label><input class="input" id="URL_APLIKASI" value="' + esc(s.URL_APLIKASI) + '" placeholder="https://username.github.io/sim-sarpras"><div class="help">Diisi otomatis dari alamat yang sedang Anda buka bila kosong.</div></div>' +
        '<button class="btn btn-navy" id="simpan">' + ic('check', 'sm') + 'Simpan Pengaturan</button></div></div>';
      if (!s.URL_APLIKASI) $('#URL_APLIKASI', el).value = location.href.replace(/\/admin\.html.*$/, '').replace(/\/$/, '');
      $('#simpan', el).onclick = function () {
        var d = {}; ['JAM_BATAS_KEMBALI', 'PREFIX_KODE', 'NAMA_SEKOLAH', 'ALAMAT_SEKOLAH', 'KOTA', 'URL_APLIKASI'].forEach(function (k) { d[k] = $('#' + k, el).value.trim(); });
        d.PREFIX_KODE = d.PREFIX_KODE.toUpperCase();
        A.simpanLalu('settings.save', d, this, null).then(function (r) { if (r.success) { A.settings = Object.assign(A.settings, d); try { var c = JSON.parse(localStorage.getItem('sar_user')); c.settings = A.settings; localStorage.setItem('sar_user', JSON.stringify(c)); } catch (e) {} } });
      };
    } });
    S.api('system.status', {}).then(function (r) {
      if (!r.success) { $('#kanan', el).innerHTML = '<div class="errbox">' + esc(r.message) + '</div>'; return; }
      var s = r.data;
      $('#kanan', el).innerHTML = '<div class="card set-card"><div class="card-head bg-mint"><h3>' + ic('db', 'sm') + ' Status Sistem</h3><span class="chip">v' + esc(s.versi) + '</span></div><div class="card-pad"><dl class="kv">' +
        '<dt>Database</dt><dd><a href="' + esc(s.spreadsheetUrl) + '" target="_blank" rel="noopener">Buka spreadsheet</a></dd>' +
        '<dt>Data</dt><dd>' + ['INVENTARIS', 'PEMINJAM', 'PEMINJAMAN', 'DETAIL_PINJAM', 'DE_Dokumen'].map(function (k) { return esc(k) + ': ' + fmt.angka(s.sheets[k] || 0); }).join('<br>') + '</dd>' +
        '<dt>Pemanas server</dt><dd>' + (s.keepWarm ? 'Aktif (Sen–Sab 06–17 WIB, tiap 5 menit)' : 'Dimatikan') + '<br><span class="help">Terakhir: ' + (s.warm ? fmt.tglJam(s.warm.at) + ' · ' + esc(s.warm.scope) : '—') + '</span></dd>' +
        '<dt>Trigger</dt><dd>' + (s.trigger.length ? esc(s.trigger.join(', ')) : '<span style="color:var(--red)">Belum ada — jalankan pasangTrigger() di editor</span>') + '</dd>' +
        '<dt>Script Properties</dt><dd>' + fmt.angka(s.propsByte) + ' byte dari 500.000</dd></dl></div></div>' +
        '<div class="card set-card"><div class="card-head bg-lilac"><h3>' + ic('layers', 'sm') + ' Cadangan Data</h3><button class="btn btn-sm" id="bak">Backup Sekarang</button></div><div class="card-pad">' +
        (s.backup.length ? s.backup.map(function (b) { return '<div class="help">' + ic('file', 'sm') + ' ' + esc(b.nama) + '</div>'; }).join('') : '<p class="help">Belum ada cadangan. Backup otomatis tiap Senin dini hari.</p>') + '</div></div>';
      $('#bak', el).onclick = function () { S.busy(this, S.api('system.backup', {}, { timeout: 120000 }), 'Mencadangkan…').then(function (r2) { S.toast(r2.message, r2.success ? '' : 'error'); }); };
    });
    S.api('log.list', {}).then(function (r) {
      if (!r.success) return;
      var box = $('#log', el), q = '';
      box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px"><h2 class="h2">Log Aktivitas</h2><input class="input" id="lq" placeholder="Cari aktor / aksi" style="max-width:300px"></div><div id="lt"></div>';
      function isi() { A.tabel($('#lt', box), r.data.rows.filter(function (x) { return A.cocok(x.aktor + ' ' + x.aksi + ' ' + x.id + ' ' + x.detail, q); }), [
        { t: 'Waktu', f: function (x) { return fmt.tglJam(x.waktu); } }, { t: 'Aktor', f: function (x) { return '<b>' + esc(x.aktor) + '</b>'; } }, { t: 'Aksi', f: function (x) { return '<span class="chip">' + esc(x.aksi) + '</span>'; } },
        { t: 'Data', f: function (x) { return '<span class="code" style="font-size:12px">' + esc(x.id) + '</span>'; } }, { t: 'Detail', f: function (x) { return '<span class="help">' + esc(x.detail) + '</span>'; } }], { per: 15 }); }
      $('#lq', box).oninput = function () { q = this.value; isi(); };
      isi();
    });
  };

  // ============ AKUN SAYA ============
  A.pages.akun = function (el) {
    var u = A.user;
    el.innerHTML = A.head('Akun Saya', esc(u.nama) + ' · ' + S.badge(u.role)) + '<div class="cols-2e" style="margin-top:0">' +
      '<div class="card"><div class="card-head bg-sky"><h3>' + ic('lock', 'sm') + ' Ganti Password</h3></div><div class="card-pad"><div class="field"><label>Password lama</label><input class="input" type="password" id="pl" autocomplete="current-password"></div>' +
      '<div class="field"><label>Password baru (min. 8 karakter)</label><input class="input" type="password" id="pb" autocomplete="new-password"></div><button class="btn btn-navy" id="gp">Simpan Password</button></div></div>' +
      '<div class="card"><div class="card-head bg-lilac"><h3>' + ic('pen', 'sm') + ' PIN Tanda Tangan</h3>' + (u.punyaPin ? S.badge('TERSEDIA', 'Sudah diatur') : S.badge('DIPINJAM', 'Belum diatur')) + '</div><div class="card-pad">' +
      '<p class="help" style="margin-top:0">PIN 6 digit dipakai saat menyetujui dokumen (berita acara, rekap). Jangan beritahukan ke siapa pun.</p>' +
      '<div class="field"><label>Password akun (konfirmasi)</label><input class="input" type="password" id="pp" autocomplete="current-password"></div>' +
      '<div class="field"><label>PIN baru (6 angka)</label><input class="input mono" type="password" id="pn" inputmode="numeric" maxlength="6" autocomplete="one-time-code" style="letter-spacing:.4em;font-size:20px;max-width:200px"></div>' +
      '<button class="btn btn-navy" id="sp">Simpan PIN</button></div></div></div>' +
      '<div class="card card-pad" style="margin-top:20px"><h3 class="h3">Info Akun</h3><dl class="kv" style="margin-top:10px"><dt>Username</dt><dd class="mono">' + esc(u.username) + '</dd><dt>Jabatan</dt><dd>' + esc(u.jabatan || '-') + '</dd><dt>NIP</dt><dd>' + esc(u.nip || '-') + '</dd></dl>' +
      '<button class="btn btn-danger-o" id="out3" style="margin-top:14px">' + ic('logout', 'sm') + 'Keluar</button></div>';
    $('#gp', el).onclick = function () { A.simpanLalu('auth.changePassword', { lama: $('#pl', el).value, baru: $('#pb', el).value }, this, null).then(function (r) { if (r.success) { $('#pl', el).value = ''; $('#pb', el).value = ''; } }); };
    $('#sp', el).onclick = function () {
      var pin = $('#pn', el).value;
      if (!/^\d{6}$/.test(pin)) { S.toast('PIN harus 6 angka.', 'error'); return; }
      A.simpanLalu('auth.setPin', { password: $('#pp', el).value, pin: pin }, this, ['doc.templates', 'users']).then(function (r) {
        if (r.success) { A.user.punyaPin = true; try { var c = JSON.parse(localStorage.getItem('sar_user')); c.user.punyaPin = true; localStorage.setItem('sar_user', JSON.stringify(c)); } catch (e) {} A.go('#/akun'); }
      });
    };
    $('#out3', el).onclick = A.logout;
  };

  A.start();
})(window);
