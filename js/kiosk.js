/* =========================================================
   SIM-SARPRAS — kiosk.js  (halaman publik: Pinjam & Kembalikan)
   Instan: data barang, pinjaman aktif & nama peminjam disimpan di perangkat (SWR),
   validasi scan terjadi lokal (0 ms), server hanya dipanggil saat menyimpan.
   ========================================================= */
(function () {
  'use strict';
  var S = SAR, esc = S.esc, ic = S.ic, fmt = S.fmt, $ = S.$;
  var app = $('#app');
  var MODE_KIOS = /[?&]kiosk=1/.test(location.search);
  var K = {
    boot: null, pjm: [], ver: {}, idx: {}, loans: {}, screen: 'home',
    tipe: 'SISWA', person: null, cart: [], ret: null, cam: null, unwedge: null, timer: null, saving: false
  };

  // ---------------- Data ----------------
  function simpanLokal(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function bacaLokal(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }

  function indeks() {
    K.idx = {}; K.loans = {};
    if (!K.boot) return;
    K.boot.b.forEach(function (r) { K.idx[r[1]] = { id: r[0], kode: r[1], nama: r[2], tipe: r[3], lokasi: r[4], status: r[5], tersedia: r[6], total: r[7], boleh: !!r[8], kondisi: r[9], satuan: r[10] }; });
    K.boot.a.forEach(function (r) {
      (K.loans[r[2]] = K.loans[r[2]] || []).push({ detailId: r[0], trx: r[1], kode: r[2], nama: r[3], kelas: r[4], tipe: r[5], waktu: r[6], batas: r[7], sisa: r[8] });
    });
  }

  function muatBoot(paksa) {
    var have = !paksa && K.ver.boot;
    return S.api('public.boot', have ? { have: have } : (paksa ? { _fresh: true } : {})).then(function (r) {
      if (r.success && r.same) return true;
      if (r.success) { K.boot = r.data; K.ver.boot = r.ver; simpanLokal('k_boot', { ver: r.ver, data: r.data }); indeks(); statusOnline(true); return true; }
      statusOnline(false, r.message);
      return false;
    });
  }
  function muatPeminjam(paksa) {
    var have = !paksa && K.ver.pjm;
    return S.api('public.peminjam', have ? { have: have } : {}).then(function (r) {
      if (r.success && r.same) return true;
      if (r.success) { K.pjm = r.data.p; K.ver.pjm = r.ver; simpanLokal('k_pjm', { ver: r.ver, data: r.data.p }); if (K.screen === 'pinjam1') saranUlang(); return true; }
      return false;
    });
  }
  function statusOnline(on, msg) {
    K.online = on;
    var d = $('#kStatus');
    if (d) d.innerHTML = on ? '<span class="dot"></span> Sistem Kios Siap Digunakan' : '<span class="dot off"></span> ' + esc(msg || 'Server belum terhubung');
  }

  // ---------------- Navigasi ----------------
  function ke(screen, push) {
    stopKamera();
    clearTimeout(K.timer);
    K.screen = screen;
    if (push !== false) history.pushState({ s: screen }, '', '#' + screen);
    app.classList.toggle('wide', screen === 'home');
    RENDER[screen]();
    window.scrollTo(0, 0);
    sentuh();
  }
  window.addEventListener('popstate', function (e) {
    var s = (e.state && e.state.s) || 'home';
    if (s === 'pinjam2' && !K.person) s = 'pinjam1';
    if ((s === 'kembali2') && !K.ret) s = 'kembali1';
    if (/Ok$/.test(s)) s = 'home';
    ke(s, false);
  });
  function kembaliKeAwal() { K.person = null; K.cart = []; K.ret = null; history.replaceState({ s: 'home' }, '', '#home'); ke('home', false); }

  // Mode kios: kembali ke awal bila tidak ada sentuhan 2 menit
  var _idle = 0;
  function sentuh() { _idle = Date.now(); }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { document.addEventListener(ev, sentuh, { passive: true }); });
  setInterval(function () {
    if (MODE_KIOS && K.screen !== 'home' && Date.now() - _idle > 120000 && !K.saving) kembaliKeAwal();
    if (document.visibilityState === 'visible' && !K.saving && (K.screen === 'home' || K.screen === 'kembali1' || K.screen === 'pinjam1')) muatBoot();
  }, 30000);

  // ---------------- Komponen ----------------
  function topbar(judul, extra) {
    return '<div class="k-top"><button class="k-back" data-back aria-label="Kembali">' + ic('back') + '</button><h2>' + esc(judul) + '</h2>' +
      (extra || '<img class="k-logo-sm" src="assets/logo.png" alt="Logo Yayasan Triguna 1956">') + '</div>';
  }
  function steps(aktif, labels, ret) {
    return '<div class="steps' + (ret ? ' ret' : '') + '">' + labels.map(function (l, i) { return '<span class="' + (i + 1 === aktif ? 'on' : i + 1 < aktif ? 'done' : '') + '">' + (i + 1) + ' ' + esc(l) + '</span>'; }).join('') + '</div>';
  }
  function bindBack() { var b = $('[data-back]'); if (b) b.onclick = function () { history.back(); }; }
  function jamBatas() { return (K.boot && K.boot.s.jamBatas) || '15:00'; }
  function telatInfo(batas) { var b = new Date(batas), now = Date.now(); return now > b ? { telat: true, teks: 'Terlambat ' + fmt.durasi(now - b) } : { telat: false, teks: 'Tepat Waktu' }; }

  function kamera(boxSel, onCode) {
    var box = $(boxSel);
    K.cam = Scanner.start(box, onCode);
    var f = $('[data-flip]'), t = $('[data-torch]');
    if (f) f.onclick = function () { K.cam && K.cam.flip(); };
    if (t) t.onclick = function () { K.cam && K.cam.torch(); };
    K.unwedge = Scanner.wedge(onCode);
  }
  function stopKamera() { if (K.cam) { K.cam.stop(); K.cam = null; } if (K.unwedge) { K.unwedge(); K.unwedge = null; } }
  function camHtml(cap) {
    return '<div class="cam" id="camBox"><div id="reader"></div><i class="br tl"></i><i class="br tr"></i><i class="br bl"></i><i class="br bm"></i><i class="line"></i></div>' +
      '<p class="cam-cap">' + esc(cap) + '</p><div class="cam-tools"><button class="btn btn-round" data-flip aria-label="Ganti kamera">' + ic('flip') + '</button>' +
      '<button class="btn btn-round" data-torch aria-label="Senter">' + ic('flash') + '</button></div>' +
      '<div class="or">atau ketik / scanner USB</div><form class="scanrow" id="manual"><input class="input" data-scan id="kodeIn" placeholder="SAR-ELK-0001" autocomplete="off" autocapitalize="characters" aria-label="Kode barang">' +
      '<button class="btn btn-ink" type="submit">' + ic('plus', 'sm') + 'Tambah</button></form>';
  }
  function bindManual(onCode) {
    $('#manual').onsubmit = function (e) { e.preventDefault(); var v = $('#kodeIn').value; $('#kodeIn').value = ''; if (v.trim()) onCode(Scanner.normalisasi(v)); };
  }
  function kartuGalat(judul, pesan, aksi) {
    S.beep(false);
    var m = S.modal({ title: judul, body: '<div class="errbox">' + ic('alert') + '<span>' + pesan + '</span></div>', foot: '<button class="btn btn-ink" data-x2>' + esc(aksi || 'Mengerti') + '</button>' });
    m.el.querySelector('[data-x2]').onclick = m.close;
    m.el.querySelector('[data-x2]').focus();
  }
  function confetti() {
    var c = S.h('<div class="confetti"></div>'), warna = ['#FBC02D', '#A7D8F0', '#F9C6E8', '#BDE7C9', '#C9B8F5', '#FF8A65'];
    for (var i = 0; i < 26; i++) { var e = document.createElement('i'); e.style.left = Math.random() * 100 + '%'; e.style.background = warna[i % 6]; e.style.animationDelay = Math.random() * 0.5 + 's'; e.style.borderRadius = i % 2 ? '50%' : '2px'; c.appendChild(e); }
    document.body.appendChild(c); setTimeout(function () { c.remove(); }, 2400);
  }
  function hitungMundur(el, detik, selesai) {
    var n = detik;
    (function tick() { if (!el.isConnected) return; el.textContent = 'Kembali ke beranda dalam ' + n + ' detik…'; if (n-- <= 0) return selesai(); K.timer = setTimeout(tick, 1000); })();
  }

  // ---------------- Layar ----------------
  var RENDER = {};

  RENDER.home = function () {
    var nama = (K.boot && K.boot.s.nama) || S.CFG.NAMA_SEKOLAH || 'SMA Triguna 1956 Jakarta';
    app.innerHTML = '<div class="k-frame">' +
      '<div class="k-brand"><img class="k-logo" src="assets/logo.png" alt="Logo Yayasan Triguna 1956" width="64" height="64"><div><h1>SIM-SARPRAS</h1><p>' + esc(nama) + '</p></div></div>' +
      '<div class="k-clock" id="kClock">' + ic('cal', 'sm') + '<span></span></div>' +
      '<div class="infobox">' + ic('clock') + '<span>Semua barang wajib kembali <b>hari ini</b> sebelum pukul <u>' + esc(jamBatas()) + ' WIB</u>.</span></div>' +
      '<div class="tiles">' +
      '<button class="k-tile bg-yellow" data-go="pinjam1"><span class="chip" style="background:var(--ink);color:#fff;border-color:var(--ink)">Layanan Utama</span>' +
      '<span class="t-arrow" style="background:var(--ink);color:#fff">' + ic('arrowUR', 'lg') + '</span><div class="t-title">PINJAM BARANG</div><div class="t-sub">Scan QR barang yang mau dipinjam</div>' +
      '<div class="t-foot" id="kStatus"><span class="dot"></span> Memeriksa server…</div><span class="t-mascot">' + S.MASKOT.proyektor + '</span></button>' +
      '<button class="k-tile bg-sky" data-go="kembali1"><span class="chip">Pengembalian</span><span class="t-arrow" style="background:#fff">' + ic('arrowDL', 'lg') + '</span>' +
      '<div class="t-title">KEMBALIKAN BARANG</div><div class="t-sub">Scan QR barang yang dikembalikan</div><div class="t-foot">' + ic('checkc', 'sm') + ' Konfirmasi kondisi fisik &amp; kelengkapan</div>' +
      '<span class="t-mascot">' + S.MASKOT.kotak + '</span></button></div>' +
      '<div class="k-foot"><span>ID KIOS: #' + esc(S.CFG.ID_KIOS || 'K01') + '</span><a href="admin.html" style="color:var(--ink);text-decoration:none">Masuk Admin →</a></div></div>';
    S.$$('[data-go]').forEach(function (b) { b.onclick = function () { if (b.dataset.go === 'pinjam1') { K.person = null; K.cart = []; } K.ret = null; ke(b.dataset.go); }; });
    jam(); statusOnline(K.online !== false, K.online === false ? 'Server belum terhubung' : '');
    if (K.boot) statusOnline(true);
  };
  function jam() { var el = $('#kClock span'); if (!el) return; var d = new Date(); el.textContent = fmt.tglPanjang(d).replace(/^(\w+), (\d+) (\w+) /, function (m, h, t, b) { return h + ', ' + t + ' ' + b.slice(0, 3) + ' '; }) + ' · ' + fmt.jam(d); }
  setInterval(jam, 15000);

  // ---- PINJAM 1: pilih peminjam ----
  var _aktifSaran = -1;
  RENDER.pinjam1 = function () {
    app.innerHTML = '<div class="k-frame">' + topbar('Pinjam Barang') + steps(1, ['Peminjam', 'Scan Barang', 'Selesai']) +
      '<div class="seg" role="group" aria-label="Jenis peminjam"><button data-tipe="SISWA" aria-pressed="' + (K.tipe === 'SISWA') + '">Siswa</button><button data-tipe="GURU" aria-pressed="' + (K.tipe === 'GURU') + '">Guru / Staf</button></div>' +
      '<div class="field" style="margin-top:18px"><label for="namaIn">Ketik nama kamu</label><div class="input-wrap">' + ic('search') +
      '<input class="input input-lg" id="namaIn" placeholder="Minimal 2 huruf…" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="sugg"></div></div>' +
      '<div id="sugg" role="listbox"></div><div id="chosen"></div>' +
      '<p class="help" style="margin-top:14px">' + ic('info', 'sm') + ' Nama tidak ada? Hubungi petugas sarpras.</p></div>' +
      '<div class="k-actions"><div class="inner"><button class="btn btn-lg btn-navy btn-block" id="lanjut" disabled>Lanjut: Scan Barang ' + ic('arrowUR') + '</button></div></div>';
    bindBack();
    S.$$('[data-tipe]').forEach(function (b) { b.onclick = function () { K.tipe = b.dataset.tipe; K.person = null; S.$$('[data-tipe]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); pilihan(); saranUlang(); $('#namaIn').focus(); }; });
    var inp = $('#namaIn');
    inp.oninput = function () { _aktifSaran = -1; saranUlang(); };
    inp.onkeydown = function (e) {
      var items = S.$$('#sugg button');
      if (e.key === 'ArrowDown') { _aktifSaran = Math.min(items.length - 1, _aktifSaran + 1); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { _aktifSaran = Math.max(0, _aktifSaran - 1); e.preventDefault(); }
      else if (e.key === 'Enter') { e.preventDefault(); if (items[_aktifSaran > -1 ? _aktifSaran : 0]) items[_aktifSaran > -1 ? _aktifSaran : 0].click(); else if (K.person) $('#lanjut').click(); return; }
      items.forEach(function (b, i) { b.classList.toggle('act', i === _aktifSaran); });
    };
    $('#lanjut').onclick = function () { if (K.person) ke('pinjam2'); };
    pilihan();
    if (!K.person) setTimeout(function () { inp.focus(); }, 60);
    if (!K.pjm.length) $('#sugg').innerHTML = '<div class="help" style="padding:10px 4px">Memuat daftar nama…</div>';
  };
  function cocok(nama, q) {
    var n = nama.toLowerCase(), t = q.toLowerCase().split(/\s+/).filter(Boolean);
    for (var i = 0; i < t.length; i++) if (n.indexOf(t[i]) < 0) return -1;
    return n.indexOf(t[0]) === 0 ? 0 : (' ' + n).indexOf(' ' + t[0]) >= 0 ? 1 : 2;
  }
  function tandai(nama, q) {
    var out = esc(nama);
    q.toLowerCase().split(/\s+/).filter(Boolean).forEach(function (t) { out = out.replace(new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'i'), '<mark>$1</mark>'); });
    return out;
  }
  function saranUlang() {
    var box = $('#sugg'), inp = $('#namaIn');
    if (!box || !inp) return;
    var q = inp.value.trim();
    if (K.person || q.length < 2) { box.innerHTML = ''; inp.setAttribute('aria-expanded', 'false'); return; }
    var hasil = [];
    K.pjm.forEach(function (p) { if (p[1] !== K.tipe) return; var s = cocok(p[2], q); if (s >= 0) hasil.push({ p: p, s: s }); });
    hasil.sort(function (a, b) { return a.s - b.s || a.p[2].localeCompare(b.p[2]); });
    hasil = hasil.slice(0, 8);
    inp.setAttribute('aria-expanded', hasil.length ? 'true' : 'false');
    if (!hasil.length) { box.innerHTML = S.empty('Nama tidak ditemukan', 'cari', '<span>Periksa ejaan, atau pilih ' + (K.tipe === 'SISWA' ? 'Guru / Staf' : 'Siswa') + ' di atas.</span>'); return; }
    box.innerHTML = '<div class="sugg">' + hasil.map(function (x, i) {
      return '<button role="option" data-i="' + x.p[0] + '"><span>' + tandai(x.p[2], q) + '</span>' + (x.p[3] ? '<span class="chip" style="background:var(--mint)">' + esc(x.p[3]) + '</span>' : '<span class="chip" style="background:var(--lilac)">Guru/Staf</span>') + '</button>';
    }).join('') + '</div>';
    S.$$('#sugg button').forEach(function (b) { b.onclick = function () { K.person = K.pjm.filter(function (p) { return p[0] === b.dataset.i; })[0]; pilihan(); }; });
  }
  function pilihan() {
    var c = $('#chosen'), inp = $('#namaIn'), btn = $('#lanjut');
    if (!c) return;
    if (K.person) {
      c.innerHTML = '<div class="person"><span class="avatar">' + esc(fmt.inisial(K.person[2])) + '</span><div style="flex:1"><b>' + esc(K.person[2]) + '</b><div class="help" style="color:var(--ink)">' +
        esc(K.person[3] || 'Guru / Staf') + '</div></div><button class="btn btn-sm" data-ganti>Ganti</button></div>';
      $('[data-ganti]').onclick = function () { K.person = null; inp.value = ''; pilihan(); inp.focus(); };
      $('#sugg').innerHTML = ''; inp.value = K.person[2]; inp.disabled = true; btn.disabled = false; btn.focus();
    } else { c.innerHTML = ''; inp.disabled = false; btn.disabled = true; }
  }

  // ---- PINJAM 2: scan barang ----
  RENDER.pinjam2 = function () {
    if (!K.person) return ke('pinjam1', false);
    app.innerHTML = '<div class="k-frame">' + topbar('Pinjam', '<span class="chip pill" style="background:var(--mint)">' + esc(K.person[2].split(' ')[0]) + (K.person[3] ? ' · ' + esc(K.person[3]) : '') + '</span>') +
      steps(2, ['Peminjam', 'Scan Barang', 'Selesai']) + camHtml('Arahkan kamera ke QR barang') +
      '<div class="sect-title">Barang yang dipinjam <span class="count" id="cnt">0</span></div><div id="cart"></div></div>' +
      '<div class="k-actions"><div class="inner"><button class="btn btn-lg btn-yellow btn-block" id="simpan" disabled>' + ic('check') + 'Simpan Peminjaman</button>' +
      '<div class="cap">Wajib kembali hari ini sebelum ' + esc(jamBatas()) + '</div></div></div>';
    bindBack(); bindManual(tambahBarang); renderCart();
    kamera('#camBox', tambahBarang);
    $('#simpan').onclick = simpanPinjam;
  };
  function renderCart() {
    var c = $('#cart'); if (!c) return;
    $('#cnt').textContent = K.cart.length;
    $('#simpan').disabled = !K.cart.length;
    if (!K.cart.length) { c.innerHTML = '<div class="help" style="padding:12px 4px">Belum ada barang. Scan QR yang tertempel di barang.</div>'; return; }
    c.innerHTML = K.cart.map(function (it, i) {
      var b = K.idx[it.kode] || {};
      return '<div class="item" data-i="' + i + '"><span class="ic" style="background:' + (b.tipe === 'STOK' ? 'var(--pink)' : 'var(--sky)') + '">' + ic('box') + '</span><div class="body"><div class="nm">' + esc(b.nama || it.kode) + '</div>' +
        '<div class="meta"><span class="code">' + esc(it.kode) + '</span> · ' + esc(b.lokasi || '') + '</div><div style="margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">' + S.badge(b.tipe || 'UNIT') +
        (b.tipe === 'STOK' ? '<span class="stepper"><button data-m="-1" aria-label="Kurangi">−</button><input value="' + it.jumlah + '" inputmode="numeric" aria-label="Jumlah"><button data-m="1" aria-label="Tambah">+</button></span><span class="help">maks. ' + b.tersedia + '</span>' : '') +
        '</div></div><button class="rm" data-rm aria-label="Hapus">' + ic('x', 'sm') + '</button></div>';
    }).join('');
    S.$$('#cart .item').forEach(function (el) {
      var i = Number(el.dataset.i), it = K.cart[i], b = K.idx[it.kode] || {};
      el.querySelector('[data-rm]').onclick = function () { K.cart.splice(i, 1); renderCart(); };
      S.$$('[data-m]', el).forEach(function (bt) { bt.onclick = function () { it.jumlah = Math.max(1, Math.min(b.tersedia, it.jumlah + Number(bt.dataset.m))); renderCart(); }; });
      var q = el.querySelector('.stepper input');
      if (q) q.onchange = function () { it.jumlah = Math.max(1, Math.min(b.tersedia, Math.floor(Number(q.value) || 1))); renderCart(); };
    });
  }
  function cekBarang(kode, ulang) {
    var b = K.idx[kode];
    if (!b && !ulang) return muatBoot(true).then(function () { return cekBarang(kode, true); });
    return Promise.resolve(b || null);
  }
  function tambahBarang(kode) {
    if (K.cart.some(function (x) { return x.kode === kode; })) { S.beep(false); S.toast('Barang ' + kode + ' sudah ada di daftar.', 'warn', 1800); return; }
    cekBarang(kode).then(function (b) {
      if (!b) return kartuGalat('QR tidak terdaftar', 'Kode <b class="code">' + esc(kode) + '</b> tidak ada di inventaris. Hubungi petugas sarpras.', 'Coba Lagi');
      if (b.status === 'NONAKTIF' || !b.boleh) return kartuGalat('Tidak dapat dipinjam', esc(b.nama) + ' tidak tersedia untuk dipinjam.');
      if (b.status === 'RUSAK') return kartuGalat('Barang rusak', esc(b.nama) + ' sedang rusak dan belum bisa dipinjam.');
      if (b.tersedia < 1) {
        var l = (K.loans[kode] || [])[0];
        return kartuGalat('Barang sedang dipinjam', esc(b.nama) + (l ? ' sedang dipinjam oleh <b>' + esc(l.nama) + '</b>' + (l.kelas ? ' (' + esc(l.kelas) + ')' : '') + ' sejak ' + fmt.jam(l.waktu) + '.' : ' sedang dipinjam.'));
      }
      if (b.tipe === 'STOK') return mintaJumlah(b);
      K.cart.push({ kode: kode, jumlah: 1 }); S.beep(true); S.toast('Ditambahkan: ' + b.nama, '', 1500); renderCart();
    });
  }
  function mintaJumlah(b) {
    S.beep(true);
    var n = 1, sh = S.h('<div><div class="overlay" style="align-items:flex-end;padding:0"></div></div>').firstElementChild;
    sh.innerHTML = '<div class="sheet" role="dialog" aria-modal="true"><h3 class="h3">Berapa jumlah yang dipinjam?</h3><p class="help">' + esc(b.nama) + ' · tersedia <b>' + b.tersedia + ' ' + esc(b.satuan || '') + '</b></p>' +
      '<div style="display:flex;justify-content:center;margin:18px 0"><span class="stepper" style="transform:scale(1.25)"><button data-m="-1">−</button><input id="qn" value="1" inputmode="numeric"><button data-m="1">+</button></span></div>' +
      '<div class="grid-2"><button class="btn btn-lg" data-batal>Batal</button><button class="btn btn-lg btn-yellow" data-ok>Tambahkan</button></div></div>';
    document.body.appendChild(sh);
    var qn = sh.querySelector('#qn');
    function set(v) { n = Math.max(1, Math.min(b.tersedia, v)); qn.value = n; }
    S.$$('[data-m]', sh).forEach(function (x) { x.onclick = function () { set(n + Number(x.dataset.m)); }; });
    qn.onchange = function () { set(Math.floor(Number(qn.value) || 1)); };
    sh.querySelector('[data-batal]').onclick = function () { sh.remove(); };
    sh.querySelector('[data-ok]').onclick = function () { K.cart.push({ kode: b.kode, jumlah: n }); sh.remove(); S.toast('Ditambahkan: ' + n + ' ' + b.nama, '', 1500); renderCart(); };
    sh.addEventListener('mousedown', function (e) { if (e.target === sh) sh.remove(); });
    qn.select();
  }
  function simpanPinjam() {
    if (!K.cart.length || K.saving) return;
    K.saving = true;
    var btn = $('#simpan');
    S.busy(btn, S.api('public.pinjam', { peminjamId: K.person[0], items: K.cart, perangkat: MODE_KIOS ? 'KIOS' : 'HP' }), 'Menyimpan…').then(function (r) {
      K.saving = false;
      if (!r.success) {
        if (r.kode) { K.cart = K.cart.filter(function (x) { return x.kode !== r.kode; }); renderCart(); muatBoot(true); }
        return kartuGalat('Peminjaman belum tersimpan', esc(r.message));
      }
      // perbarui data lokal seketika
      r.data.items.forEach(function (it) {
        var b = K.idx[String(it.kode).toUpperCase()];
        if (b) { b.tersedia -= it.jumlah; if (b.tipe === 'UNIT' || b.tersedia <= 0) b.status = 'DIPINJAM'; }
        (K.loans[String(it.kode).toUpperCase()] = K.loans[String(it.kode).toUpperCase()] || []).push({ detailId: it.detailId, trx: r.data.transaksiId, kode: it.kode, nama: r.data.nama, kelas: r.data.kelas, waktu: r.data.waktu, batas: r.data.batas, sisa: it.jumlah });
      });
      K.hasil = r.data; K.cart = [];
      S.beep(true); ke('pinjamOk');
      setTimeout(function () { muatBoot(true); }, 1500);
    });
  }

  RENDER.pinjamOk = function () {
    var d = K.hasil;
    app.innerHTML = '<div class="k-frame ok-screen"><div class="big">' + S.MASKOT.sukses + '</div><h1 class="h1">Peminjaman Berhasil!</h1>' +
      '<div class="receipt"><div class="row"><span class="muted">No. Transaksi</span><b class="code">' + esc(d.transaksiId) + '</b></div>' +
      '<div class="row"><span class="muted">Peminjam</span><b>' + esc(d.nama) + (d.kelas ? ' · ' + esc(d.kelas) : '') + '</b></div>' +
      '<div class="row"><span class="muted">Waktu</span><b>' + fmt.jam(d.waktu) + ' WIB</b></div><hr>' +
      d.items.map(function (it) { return '<div class="row"><span>• ' + esc(it.nama) + '</span><b>' + it.jumlah + '</b></div>'; }).join('') + '</div>' +
      '<div class="strip">' + ic('clock') + '<span>Kembalikan hari ini sebelum pukul ' + fmt.jam(d.batas) + ' WIB</span></div>' +
      '<button class="btn btn-lg btn-ink btn-block" style="margin-top:20px" id="selesai">Selesai</button><p class="help" id="cd" style="margin-top:10px"></p></div>';
    confetti();
    $('#selesai').onclick = kembaliKeAwal;
    hitungMundur($('#cd'), MODE_KIOS ? 6 : 12, kembaliKeAwal);
  };

  // ---- KEMBALI 1: scan ----
  RENDER.kembali1 = function () {
    app.innerHTML = '<div class="k-frame ret-mode">' + topbar('Kembalikan Barang') + steps(1, ['Scan Barang', 'Kondisi', 'Selesai'], true) +
      camHtml('Scan QR barang yang dikembalikan') + '<div id="pilihPeminjam"></div></div>';
    bindBack(); bindManual(scanKembali);
    kamera('#camBox', scanKembali);
  };
  function scanKembali(kode) {
    var cari = function (ulang) {
      var l = K.loans[kode] || [];
      if (!l.length && !ulang) return muatBoot(true).then(function () { return cari(true); });
      return Promise.resolve(l);
    };
    cari().then(function (list) {
      if (!list.length) {
        var b = K.idx[kode];
        return kartuGalat(b ? 'Tidak tercatat dipinjam' : 'QR tidak terdaftar', b ? esc(b.nama) + ' tidak tercatat sedang dipinjam.' : 'Kode <b class="code">' + esc(kode) + '</b> tidak ada di inventaris.');
      }
      S.beep(true);
      if (list.length === 1) { K.ret = { loan: list[0], kondisi: '', lengkap: '', ket: '', qty: list[0].sisa }; return ke('kembali2'); }
      var b2 = K.idx[kode] || {};
      $('#pilihPeminjam').innerHTML = '<div class="sect-title">' + ic('users', 'sm') + ' Siapa yang mengembalikan ' + esc(b2.nama || kode) + '?</div>' +
        list.map(function (l, i) { return '<button class="item" style="width:100%;text-align:left;cursor:pointer" data-l="' + i + '"><span class="avatar">' + esc(fmt.inisial(l.nama)) + '</span><div class="body"><div class="nm">' + esc(l.nama) + '</div><div class="meta">' + esc(l.kelas || 'Guru/Staf') + ' · pinjam ' + fmt.jam(l.waktu) + ' · sisa ' + l.sisa + '</div></div>' + ic('arrowUR') + '</button>'; }).join('');
      S.$$('[data-l]').forEach(function (b) { b.onclick = function () { var l = list[Number(b.dataset.l)]; K.ret = { loan: l, kondisi: '', lengkap: '', ket: '', qty: l.sisa }; ke('kembali2'); }; });
      $('#pilihPeminjam').scrollIntoView({ behavior: 'smooth' });
    });
  }

  // ---- KEMBALI 2: kondisi ----
  RENDER.kembali2 = function () {
    var R = K.ret; if (!R) return ke('kembali1', false);
    var l = R.loan, b = K.idx[l.kode] || { nama: l.kode, tipe: 'UNIT' }, t = telatInfo(l.batas);
    app.innerHTML = '<div class="k-frame">' + topbar('Kembalikan Barang') + steps(2, ['Scan Barang', 'Kondisi', 'Selesai'], true) +
      '<div class="loaninfo"><b style="font-size:17px">' + esc(b.nama) + '</b><div class="code" style="margin:2px 0 8px">' + esc(l.kode) + '</div>' +
      '<div class="r"><span class="muted">Dipinjam oleh</span><b>' + esc(l.nama) + (l.kelas ? ' · ' + esc(l.kelas) : '') + '</b></div>' +
      '<div class="r"><span class="muted">Waktu pinjam</span><b>' + fmt.jam(l.waktu) + '</b></div><div class="r"><span class="muted">Status</span>' + S.badge(t.telat ? 'TERLAMBAT' : 'TEPAT', t.teks) + '</div></div>' +
      (b.tipe === 'STOK' && l.sisa > 1 ? '<div class="field" style="margin-top:18px"><span class="flabel">Jumlah dikembalikan</span><div style="display:flex;align-items:center;gap:12px"><span class="stepper"><button data-m="-1">−</button><input id="qn" value="' + R.qty + '" inputmode="numeric"><button data-m="1">+</button></span><span class="help">dari ' + l.sisa + ' dipinjam</span></div></div>' : '') +
      '<div class="flabel" style="margin:20px 0 8px">Kondisi barang</div><div class="grid-2"><button class="choice c-good" data-k="BAIK" aria-pressed="' + (R.kondisi === 'BAIK') + '">' + ic('thumb', 'lg') + 'Baik</button>' +
      '<button class="choice c-bad" data-k="RUSAK" aria-pressed="' + (R.kondisi === 'RUSAK') + '">' + ic('wrench', 'lg') + 'Rusak</button></div>' +
      '<div class="flabel" style="margin:20px 0 8px">Kelengkapan</div><div class="grid-2"><button class="choice c-good" data-l="LENGKAP" aria-pressed="' + (R.lengkap === 'LENGKAP') + '">' + ic('list', 'lg') + 'Lengkap</button>' +
      '<button class="choice c-pink" data-l="TIDAK_LENGKAP" aria-pressed="' + (R.lengkap === 'TIDAK_LENGKAP') + '">' + ic('puzzle', 'lg') + 'Tidak Lengkap</button></div>' +
      '<div class="field hidden" id="ketWrap" style="margin-top:18px"><label for="ket">Keterangan <span class="req">*</span></label><textarea class="textarea" id="ket" placeholder="Contoh: kabel HDMI tidak ada">' + esc(R.ket) + '</textarea><div class="ferr hidden" id="ketErr">' + ic('alert', 'sm') + 'Keterangan wajib diisi</div></div></div>' +
      '<div class="k-actions"><div class="inner"><button class="btn btn-lg btn-sky btn-block" id="konfirm" disabled>' + ic('check') + 'Konfirmasi Pengembalian</button></div></div>';
    bindBack();
    S.$$('[data-k]').forEach(function (x) { x.onclick = function () { R.kondisi = x.dataset.k; S.$$('[data-k]').forEach(function (y) { y.setAttribute('aria-pressed', y === x); }); segarK2(); }; });
    S.$$('[data-l]').forEach(function (x) { x.onclick = function () { R.lengkap = x.dataset.l; S.$$('[data-l]').forEach(function (y) { y.setAttribute('aria-pressed', y === x); }); segarK2(); }; });
    var qn = $('#qn');
    if (qn) {
      var set = function (v) { R.qty = Math.max(1, Math.min(l.sisa, v)); qn.value = R.qty; };
      S.$$('[data-m]').forEach(function (x) { x.onclick = function () { set(R.qty + Number(x.dataset.m)); }; });
      qn.onchange = function () { set(Math.floor(Number(qn.value) || 1)); };
    }
    $('#ket').oninput = function () { R.ket = this.value; segarK2(); };
    $('#konfirm').onclick = simpanKembali;
    segarK2();
  };
  function segarK2() {
    var R = K.ret, perlu = R.kondisi === 'RUSAK' || R.lengkap === 'TIDAK_LENGKAP';
    $('#ketWrap').classList.toggle('hidden', !perlu);
    var okKet = !perlu || R.ket.trim().length >= 3;
    $('#ketErr').classList.toggle('hidden', okKet || !R.ket.length);
    $('#konfirm').disabled = !(R.kondisi && R.lengkap && okKet);
  }
  function simpanKembali() {
    var R = K.ret; if (K.saving) return;
    K.saving = true;
    S.busy($('#konfirm'), S.api('public.kembali', { detailId: R.loan.detailId, kode: R.loan.kode, jumlah: R.qty, kondisi: R.kondisi, kelengkapan: R.lengkap, keterangan: R.ket }), 'Menyimpan…').then(function (r) {
      K.saving = false;
      if (!r.success) {
        if (r.code === 'TIDAK_DIPINJAM') muatBoot(true);
        if (r.code === 'PILIH' && r.pilihan) {        // data lokal belum lengkap → pakai pilihan dari server
          var p0 = r.pilihan.filter(function (x) { return x.nama === R.loan.nama; })[0];
          if (p0) { R.loan.detailId = p0.detailId; return simpanKembali(); }
        }
        return kartuGalat('Pengembalian belum tersimpan', esc(r.message));
      }
      var list = K.loans[R.loan.kode] || [], b = K.idx[R.loan.kode];
      list.forEach(function (x) { if (x.detailId === R.loan.detailId || (!R.loan.detailId && x === R.loan)) x.sisa -= r.data.jumlah; });
      K.loans[R.loan.kode] = list.filter(function (x) { return x.sisa > 0; });
      if (b) { if (b.tipe === 'UNIT') { b.tersedia = R.kondisi === 'RUSAK' ? 0 : 1; b.status = R.kondisi === 'RUSAK' ? 'RUSAK' : 'TERSEDIA'; } else if (R.kondisi !== 'RUSAK') { b.tersedia += r.data.jumlah; b.status = 'TERSEDIA'; } }
      K.hasil = r.data; S.beep(true); ke('kembaliOk');
      setTimeout(function () { muatBoot(true); }, 1500);
    });
  }

  RENDER.kembaliOk = function () {
    var d = K.hasil;
    app.innerHTML = '<div class="k-frame ok-screen"><div class="big">' + S.MASKOT.kotak + '</div><h1 class="h1">Barang Sudah Dikembalikan</h1>' +
      '<div class="receipt"><b style="font-size:17px">' + esc(d.nama) + '</b><div class="code">' + esc(d.kode) + '</div><hr>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' + S.badge(d.kondisi) + S.badge(d.kelengkapan) + S.badge(d.terlambat ? 'TERLAMBAT' : 'TEPAT', d.terlambat ? 'Terlambat' : 'Tepat Waktu') + '</div>' +
      '<div class="row" style="margin-top:10px"><span class="muted">Dikembalikan</span><b>' + fmt.jam(d.waktu) + ' WIB · ' + d.jumlah + ' ' + (d.jumlah > 1 ? 'buah' : 'unit') + '</b></div>' +
      '<div class="row"><span class="muted">Peminjam</span><b>' + esc(d.peminjam) + '</b></div></div>' +
      (d.kondisi !== 'BAIK' || d.kelengkapan !== 'LENGKAP' ? '<div class="strip" style="background:var(--pink)">' + ic('info') + '<span>Petugas sarpras akan menindaklanjuti kondisi barang ini.</span></div>' : '') +
      '<div class="grid-2" style="margin-top:20px"><button class="btn btn-lg" id="lagi">' + ic('scan') + 'Scan Lain</button><button class="btn btn-lg btn-ink" id="selesai">Selesai</button></div><p class="help" id="cd" style="margin-top:10px"></p></div>';
    $('#lagi').onclick = function () { K.ret = null; history.replaceState({ s: 'kembali1' }, '', '#kembali1'); ke('kembali1', false); };
    $('#selesai').onclick = kembaliKeAwal;
    hitungMundur($('#cd'), MODE_KIOS ? 8 : 15, kembaliKeAwal);
  };

  // ---------------- Mulai ----------------
  (function init() {
    var cb = bacaLokal('k_boot'), cp = bacaLokal('k_pjm');
    if (cb) { K.boot = cb.data; K.ver.boot = cb.ver; indeks(); }
    if (cp) { K.pjm = cp.data; K.ver.pjm = cp.ver; }
    S.warmUp('pub');
    history.replaceState({ s: 'home' }, '', '#home');
    ke('home', false);
    muatBoot().then(function (ok) { if (ok && K.screen === 'home') RENDER.home(); });
    muatPeminjam();
    window.addEventListener('online', function () { muatBoot(true); });
    window.addEventListener('offline', function () { statusOnline(false, 'Perangkat offline'); });
  })();
})();
