/* =========================================================
   SIM-SARPRAS — admin.js : login, kerangka panel, router, dashboard, transaksi, inventaris, label QR
   (halaman lain di admin-pages.js)
   ========================================================= */
(function (W) {
  'use strict';
  var S = SAR, esc = S.esc, ic = S.ic, fmt = S.fmt, $ = S.$, $$ = S.$$;
  var root = $('#root');
  var A = W.ADM = { user: null, settings: {}, pages: {}, cleanup: [], badge: {} };
  var ROLE_ADM = ['SUPER_ADMIN', 'ADMIN_SARPRAS'];
  A.isAdm = function () { return A.user && ROLE_ADM.indexOf(A.user.role) >= 0; };
  A.isSup = function () { return A.user && A.user.role === 'SUPER_ADMIN'; };

  var NAV = [
    { id: 'dashboard', label: 'Dashboard', ic: 'dash' },
    { id: 'transaksi', label: 'Transaksi', ic: 'swap', badge: 'telat' },
    { id: 'inventaris', label: 'Inventaris', ic: 'box' },
    { id: 'label', label: 'Cetak Label QR', ic: 'qr', roles: ROLE_ADM },
    { id: 'master', label: 'Kategori & Lokasi', ic: 'map', roles: ROLE_ADM },
    { id: 'peminjam', label: 'Data Peminjam', ic: 'users', roles: ROLE_ADM },
    { id: 'dokumen', label: 'Dokumen', ic: 'file' },
    { id: 'persetujuan', label: 'Persetujuan TTD', ic: 'pen', badge: 'ttd' },
    { sec: 'Sistem' },
    { id: 'pengguna', label: 'Pengguna Admin', ic: 'shield', roles: ['SUPER_ADMIN'] },
    { id: 'migrasi', label: 'Migrasi Data', ic: 'db', roles: ['SUPER_ADMIN'] },
    { id: 'pengaturan', label: 'Pengaturan', ic: 'settings', roles: ['SUPER_ADMIN'] },
    { id: 'akun', label: 'Akun Saya', ic: 'user' }
  ];
  function bolehNav(n) { return !n.roles || (A.user && n.roles.indexOf(A.user.role) >= 0); }

  // ============ SESI ============
  function simpanSesi(token, user, settings) {
    S.Auth.token = token; A.user = user; A.settings = settings || {};
    try { localStorage.setItem('sar_token', token); localStorage.setItem('sar_user', JSON.stringify({ user: user, settings: settings })); } catch (e) {}
  }
  function hapusSesi() {
    S.Auth.token = ''; A.user = null;
    try { localStorage.removeItem('sar_token'); localStorage.removeItem('sar_user'); } catch (e) {}
    S.Store.clear();
  }
  S.Auth.onExpired = function (msg) { if (!A.user) return; hapusSesi(); halamanLogin(); S.toast(msg || 'Sesi berakhir. Silakan masuk lagi.', 'warn'); };
  A.logout = function () {
    S.ask('Keluar dari panel?', 'Anda perlu masuk lagi untuk mengelola data.', { ok: 'Keluar', danger: true }).then(function (ya) {
      if (!ya) return;
      S.api('auth.logout', {}); hapusSesi(); halamanLogin(); S.toast('Anda telah keluar.', 'info');
    });
  };

  // ============ LOGIN ============
  function halamanLogin() {
    root.className = '';
    var nama = S.CFG.NAMA_SEKOLAH || 'SMA Triguna 1956 Jakarta';
    root.innerHTML = '<div class="a-login"><div class="l-frame">' +
      '<div class="l-head"><img src="assets/logo.png" alt="Logo Yayasan Triguna 1956"><div style="flex:1;min-width:220px"><h1 class="h1">SIM-SARPRAS SMA TRIGUNA</h1>' +
      '<div class="muted">Sistem Inventaris &amp; Sirkulasi Sarana Prasarana Sekolah Berbasis QR Code</div></div>' +
      '<span class="chip pill" id="srv">' + ic('wifi', 'sm') + ' Memeriksa server…</span></div>' +
      '<div class="l-grid"><div class="l-hero"><span class="chip pill">' + ic('spark', 'sm') + ' Portal Sirkulasi Cepat</span><h2>Kelola Sarpras, Lebih Mudah &amp; Terpantau.</h2>' +
      '<div class="card" style="padding:16px;background:#FFF0B8;box-shadow:none">Sistem informasi manajemen inventaris &amp; peminjaman barang berbasis QR Code ' + esc(nama) + '.</div>' +
      '<div class="feat"><div class="bg-sky">' + ic('qr') + 'Auto QR Code</div><div style="background:#FFB4B4">' + ic('clock') + 'Batas Jam Kembali</div>' +
      '<div class="bg-mint">' + ic('excel') + 'Rekap Excel</div><div class="bg-lilac">' + ic('shield') + 'Hak Akses 3 Level</div></div></div>' +
      '<div class="l-card"><div style="display:flex;gap:14px;align-items:center;border-bottom:2.5px solid var(--ink);padding-bottom:16px;margin-bottom:18px">' +
      '<span class="ib-btn" style="width:48px;height:48px;background:var(--yellow)">' + ic('key') + '</span><div><h2 class="h2">MASUK PANEL ADMIN</h2><div class="help">Super Admin · Admin Sarpras · Kepala Sekolah</div></div></div>' +
      '<form id="fLogin" novalidate><div class="field"><label for="u">Username</label><div class="input-wrap">' + ic('user') + '<input class="input" id="u" autocomplete="username" autocapitalize="none" required></div></div>' +
      '<div class="field"><label for="p">Kata sandi</label><div class="input-wrap">' + ic('lock') + '<input class="input" id="p" type="password" autocomplete="current-password" required style="padding-right:52px">' +
      '<button type="button" class="ib-btn" id="eye" style="position:absolute;right:6px;top:50%;transform:translateY(-50%);border:0" aria-label="Tampilkan kata sandi">' + ic('eye', 'sm') + '</button></div></div>' +
      '<div id="lErr"></div><button class="btn btn-lg btn-navy btn-block" style="margin-top:6px" type="submit">Masuk Panel Admin ' + ic('arrowUR') + '</button></form>' +
      '<p style="text-align:center;margin:20px 0 0"><a href="index.html" style="color:var(--ink);font-weight:700">← Buka Mode Kios (Siswa &amp; Guru)</a></p></div></div>' +
      '<div class="tbl-foot" style="margin-top:22px;border-top:2.5px solid var(--ink);padding-top:14px"><span class="mono">© 1956–' + new Date().getFullYear() + ' Yayasan Pendidikan Triguna</span><span class="mono">Google Apps Script · GitHub Pages / Vercel</span></div></div></div>';
    S.warmUp('admin');
    S.api('auth.me', {}).then(function (r) {
      var el = $('#srv'); if (!el) return;
      var ok = r.code === 'AUTH' || r.success;
      el.className = 'chip pill ' + (ok ? 'bg-mint' : 'bg-red');
      el.innerHTML = ic('wifi', 'sm') + (ok ? ' Online · Server GAS Siap' : ' ' + esc(r.code === 'CONFIG' ? 'URL server belum diatur' : 'Server belum terhubung'));
    });
    $('#eye').onclick = function () { var p = $('#p'); p.type = p.type === 'password' ? 'text' : 'password'; };
    $('#fLogin').onsubmit = function (e) {
      e.preventDefault();
      var u = $('#u').value.trim(), p = $('#p').value, err = $('#lErr');
      if (!u || !p) { err.innerHTML = '<div class="errbox" style="margin-bottom:12px">' + ic('alert') + 'Username dan kata sandi wajib diisi.</div>'; return; }
      S.busy(e.submitter || $('#fLogin button[type=submit]'), S.api('auth.login', { username: u, password: p }), 'Memeriksa…').then(function (r) {
        if (!r.success) { err.innerHTML = '<div class="' + (r.code === 'LOCKED' ? 'warnbox' : 'errbox') + '" style="margin-bottom:12px">' + ic('alert') + '<span>' + esc(r.message) + '</span></div>'; $('#p').select(); return; }
        simpanSesi(r.data.token, r.data.user, r.data.settings);
        S.toast(r.message);
        if (location.hash.length < 3) location.hash = '#/dashboard';
        kerangka(); route();
      });
    };
    setTimeout(function () { var u = $('#u'); if (u) u.focus(); }, 50);
  }

  // ============ KERANGKA ============
  function kerangka() {
    root.className = 'a-shell';
    var u = A.user;
    root.innerHTML = '<aside class="a-side"><div class="a-brand"><img src="assets/logo.png" alt=""><div><b>SIM-SARPRAS</b><small>SMA Triguna 1956</small></div></div>' +
      '<nav class="a-nav" aria-label="Menu utama">' + NAV.filter(function (n) { return n.sec || bolehNav(n); }).map(function (n) {
        return n.sec ? '<div class="sec">' + esc(n.sec) + '</div>' : '<a href="#/' + n.id + '" data-nav="' + n.id + '">' + ic(n.ic) + '<span>' + esc(n.label) + '</span>' + (n.badge ? '<span class="nb hidden" data-badge="' + n.badge + '"></span>' : '') + '</a>';
      }).join('') + '</nav><div class="a-side-foot"><button class="btn btn-block" id="out">' + ic('logout') + 'Keluar</button></div></aside>' +
      '<div class="a-main"><header class="a-top"><form class="search" id="gSearch"><div class="input-wrap">' + ic('search') + '<input class="input" id="gq" placeholder="Cari kode aset, nama barang…" aria-label="Cari"></div></form>' +
      '<span style="flex:1"></span><a class="btn btn-icon" href="#/persetujuan" aria-label="Persetujuan" style="position:relative">' + ic('bell') + '<span class="nb hidden" data-badge="ttd" style="position:absolute;top:-8px;right:-8px;min-width:20px;height:20px;border-radius:10px;background:var(--red);color:#fff;font-size:11px;display:grid;place-items:center;border:2px solid var(--ink)"></span></a>' +
      '<a class="who" href="#/akun" style="text-decoration:none;color:inherit"><span class="avatar">' + esc(fmt.inisial(u.nama)) + '</span><span><b>' + esc(u.nama) + '</b><small>' + esc(S.badge(u.role).replace(/<[^>]+>/g, '')) + '</small></span></a></header>' +
      '<div class="a-frame" id="page"></div></div>' +
      '<nav class="bnav" aria-label="Menu bawah"><a href="#/dashboard" data-nav="dashboard">' + ic('dash') + 'Dashboard</a><a href="#/transaksi" data-nav="transaksi">' + ic('swap') + 'Transaksi</a>' +
      '<a href="#/inventaris" data-nav="inventaris">' + ic('box') + 'Inventaris</a><a href="#/menu" data-nav="menu">' + ic('menu') + 'Lainnya</a></nav>';
    $('#out').onclick = A.logout;
    $('#gSearch').onsubmit = function (e) { e.preventDefault(); var q = $('#gq').value.trim(); location.hash = '#/inventaris?q=' + encodeURIComponent(q); };
    A.segarBadge();
  }

  /** Lencana jumlah: terlambat & menunggu tanda tangan saya. */
  A.segarBadge = function () {
    S.Store.load('dashboard.summary', {}, { maxAge: 60000, onData: function (d) {
      var telat = (d.belum || []).filter(function (x) { return new Date(x.batas) < new Date(); }).length; setBadge('telat', telat);
    } });
    S.Store.load('doc.list', {}, { maxAge: 60000, onData: function (d) { setBadge('ttd', A.menungguSaya(d.rows).length); } });
  };
  function setBadge(k, n) { $$('[data-badge="' + k + '"]').forEach(function (el) { el.textContent = n; el.classList.toggle('hidden', !n); }); }
  A.menungguSaya = function (rows) {
    return (rows || []).filter(function (d) {
      if (d.status !== 'MENUNGGU_TTD') return false;
      if (A.isSup()) return true;
      var p = d.penandatangan, mine = p.filter(function (s) { return s.userId === A.user.userId && s.status === 'MENUNGGU'; })[0];
      return mine && !p.some(function (s) { return s.status !== 'SETUJU' && s.urutan < mine.urutan; });
    });
  };

  // ============ ROUTER ============
  function parseHash() {
    var h = location.hash.replace(/^#\/?/, ''), q = {}, i = h.indexOf('?');
    if (i >= 0) { h.slice(i + 1).split('&').forEach(function (kv) { var p = kv.split('='); if (p[0]) q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); }); h = h.slice(0, i); }
    var parts = h.split('/');
    return { page: parts[0] || 'dashboard', id: parts[1] || '', q: q };
  }
  function route() {
    if (!A.user) return halamanLogin();
    A.cleanup.forEach(function (f) { try { f(); } catch (e) {} }); A.cleanup = [];
    var r = parseHash(), nav = NAV.filter(function (n) { return n.id === r.page; })[0];
    if (r.page === 'barang') nav = { id: 'inventaris' };
    if (r.page === 'menu') nav = { id: 'menu' };
    if (!nav || (nav.roles && !bolehNav(nav)) || !A.pages[r.page]) { location.hash = '#/dashboard'; return; }
    $$('[data-nav]').forEach(function (a) { a.classList.toggle('on', a.dataset.nav === nav.id); });
    // Wadah baru per navigasi: respons lama yang datang terlambat menulis ke wadah yang sudah dilepas (aman)
    var page = $('#page'), host = document.createElement('div');
    page.innerHTML = ''; page.appendChild(host);
    host.innerHTML = S.skeleton(5);
    A.route = r;
    A.pages[r.page](host, r);
    W.scrollTo(0, 0);
    document.title = (nav.label || 'Panel') + ' · SIM-SARPRAS';
  }
  W.addEventListener('hashchange', route);
  A.go = function (h) { if (location.hash === h) route(); else location.hash = h; };

  // ============ KOMPONEN BERSAMA ============
  A.head = function (judul, sub, aksi) {
    return '<div class="a-head"><div><h1 class="h1">' + esc(judul) + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div><div class="acts">' + (aksi || '') + '</div></div>';
  };
  /** Tabel berhalaman. cols: [{t:judul, f:fn(row)→html, cls}] */
  A.tabel = function (el, rows, cols, opt) {
    opt = opt || {};
    var per = opt.per || 25, hal = opt.hal || 1, n = rows.length, maks = Math.max(1, Math.ceil(n / per));
    if (hal > maks) hal = maks;
    function gambar() {
      var awal = (hal - 1) * per, isi = rows.slice(awal, awal + per);
      el.innerHTML = (n ? '<div class="tbl-wrap"><table class="tbl"><thead><tr>' + cols.map(function (c) { return '<th class="' + (c.cls || '') + '">' + c.t + '</th>'; }).join('') + '</tr></thead><tbody>' +
        isi.map(function (r, i) { return '<tr data-r="' + (awal + i) + '">' + cols.map(function (c) { return '<td class="' + (c.cls || '') + '">' + c.f(r) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' +
        '<div class="tbl-foot"><span>Menampilkan ' + (awal + 1) + '–' + Math.min(n, awal + per) + ' dari ' + fmt.angka(n) + '</span>' + (maks > 1 ? '<div class="pager">' + pager() + '</div>' : '') + '</div>'
        : S.empty(opt.kosong || 'Belum ada data', opt.maskot || 'cari', opt.ctaKosong || ''));
      $$('.pager button', el).forEach(function (b) { b.onclick = function () { hal = Number(b.dataset.p); gambar(); el.scrollIntoView({ block: 'start', behavior: 'smooth' }); }; });
      if (opt.bind) opt.bind(el, rows);
    }
    function pager() {
      var s = '<button data-p="' + (hal - 1) + '" ' + (hal === 1 ? 'disabled' : '') + ' aria-label="Sebelumnya">‹</button>', set = {};
      [1, hal - 1, hal, hal + 1, maks].forEach(function (p) { if (p >= 1 && p <= maks) set[p] = 1; });
      var ps = Object.keys(set).map(Number).sort(function (a, b) { return a - b; }), prev = 0;
      ps.forEach(function (p) { if (p - prev > 1) s += '<button disabled>…</button>'; s += '<button data-p="' + p + '" aria-current="' + (p === hal) + '">' + p + '</button>'; prev = p; });
      return s + '<button data-p="' + (hal + 1) + '" ' + (hal === maks ? 'disabled' : '') + ' aria-label="Berikutnya">›</button>';
    }
    gambar();
  };
  A.opsi = function (arr, pilih, kosong) {
    return (kosong !== undefined ? '<option value="">' + esc(kosong) + '</option>' : '') + arr.map(function (o) {
      var v = typeof o === 'object' ? o.v : o, l = typeof o === 'object' ? o.l : o;
      return '<option value="' + esc(v) + '"' + (String(v) === String(pilih) ? ' selected' : '') + '>' + esc(l) + '</option>';
    }).join('');
  };
  A.cocok = function (teks, q) { if (!q) return true; teks = String(teks).toLowerCase(); return q.toLowerCase().split(/\s+/).every(function (t) { return teks.indexOf(t) >= 0; }); };
  A.telat = function (batas, kembali) { var b = new Date(batas), k = kembali ? new Date(kembali) : new Date(); return k > b ? k - b : 0; };
  A.simpanLalu = function (aksi, data, btn, stalePrefix, label) {
    return S.busy(btn, S.api(aksi, data), label || 'Menyimpan…').then(function (r) {
      if (r.success) { S.Store.stale(stalePrefix || null); if (r.message) S.toast(r.message); }
      else S.toast(r.message || 'Gagal menyimpan.', 'error');
      return r;
    });
  };

  // ============ GRAFIK SVG ============
  var WARNA = ['#C9B8F5', '#A7D8F0', '#FBC02D', '#BDE7C9', '#F9C6E8', '#FF8A65', '#1E3A8A', '#D7263D'];
  A.grafikGaris = function (titik, label) {
    var w = 640, hgt = 230, pl = 30, pr = 10, pt = 16, pb = 30, max = Math.max(4, Math.max.apply(null, titik.map(function (t) { return t[1]; })));
    var sx = function (i) { return pl + i * (w - pl - pr) / Math.max(1, titik.length - 1); }, sy = function (v) { return pt + (hgt - pt - pb) * (1 - v / max); };
    var d = titik.map(function (t, i) { return (i ? 'L' : 'M') + sx(i).toFixed(1) + ' ' + sy(t[1]).toFixed(1); }).join(' ');
    var area = d + ' L' + sx(titik.length - 1) + ' ' + (hgt - pb) + ' L' + pl + ' ' + (hgt - pb) + 'Z', grid = '', xl = '';
    for (var g = 0; g <= 4; g++) { var v = Math.round(max * g / 4), y = sy(v); grid += '<line x1="' + pl + '" x2="' + (w - pr) + '" y1="' + y + '" y2="' + y + '" stroke="#111" stroke-opacity=".12" stroke-dasharray="4 4"/><text x="' + (pl - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + v + '</text>'; }
    var step = Math.ceil(titik.length / 6);
    titik.forEach(function (t, i) { if (i % step === 0 || i === titik.length - 1) xl += '<text x="' + sx(i) + '" y="' + (hgt - 8) + '" text-anchor="middle">' + esc(label(t[0], i)) + '</text>'; });
    var pk = 0; titik.forEach(function (t, i) { if (t[1] > titik[pk][1]) pk = i; });
    return '<svg class="chart" viewBox="0 0 ' + w + ' ' + hgt + '" role="img" aria-label="Grafik tren peminjaman">' + grid + '<path d="' + area + '" fill="#A7D8F0" fill-opacity=".45"/><path d="' + d + '" fill="none" stroke="#1E3A8A" stroke-width="3" stroke-linejoin="round"/>' +
      titik.map(function (t, i) { return '<circle cx="' + sx(i) + '" cy="' + sy(t[1]) + '" r="' + (i === pk ? 6 : 3) + '" fill="' + (i === pk ? '#D7263D' : '#FBC02D') + '" stroke="#111" stroke-width="2"><title>' + esc(label(t[0], i, true)) + ': ' + t[1] + '</title></circle>'; }).join('') +
      (titik[pk][1] ? '<g transform="translate(' + Math.min(w - 150, Math.max(pl, sx(pk) - 70)) + ',' + Math.max(2, sy(titik[pk][1]) - 34) + ')"><rect width="140" height="22" rx="6" fill="#111"/><text x="70" y="15" text-anchor="middle" fill="#fff" style="fill:#fff">Puncak: ' + titik[pk][1] + ' peminjaman</text></g>' : '') +
      xl + '</svg>';
  };
  A.grafikBatang = function (data) {
    if (!data.length) return S.empty('Belum ada data', 'cari');
    var w = 520, hgt = 220, pb = 34, pt = 22, max = Math.max(1, Math.max.apply(null, data.map(function (d) { return d[1]; }))), bw = (w - 20) / data.length;
    return '<svg class="chart" viewBox="0 0 ' + w + ' ' + hgt + '" role="img" aria-label="Grafik batang">' + data.map(function (d, i) {
      var bh = (hgt - pb - pt) * d[1] / max, x = 10 + i * bw + bw * 0.12, y = hgt - pb - bh;
      return '<rect x="' + x + '" y="' + y + '" width="' + bw * 0.76 + '" height="' + Math.max(2, bh) + '" rx="6" fill="' + WARNA[i % 5] + '" stroke="#111" stroke-width="2.5"><title>' + esc(d[0]) + ': ' + d[1] + '</title></rect>' +
        '<text x="' + (x + bw * 0.38) + '" y="' + (y - 6) + '" text-anchor="middle" font-weight="700">' + d[1] + '</text><text x="' + (x + bw * 0.38) + '" y="' + (hgt - 14) + '" text-anchor="middle">' + esc(String(d[0]).slice(0, 10)) + '</text>';
    }).join('') + '<line x1="6" x2="' + (w - 6) + '" y1="' + (hgt - pb) + '" y2="' + (hgt - pb) + '" stroke="#111" stroke-width="2"/></svg>';
  };
  A.donat = function (baik, rusak) {
    var tot = baik + rusak || 1, pb = baik / tot, r = 52, c = 2 * Math.PI * r;
    return '<svg viewBox="0 0 140 140" style="width:150px;flex:none" role="img" aria-label="Kondisi barang"><circle cx="70" cy="70" r="' + r + '" fill="none" stroke="#D7263D" stroke-width="20"/>' +
      '<circle cx="70" cy="70" r="' + r + '" fill="none" stroke="#BDE7C9" stroke-width="20" stroke-dasharray="' + (c * pb) + ' ' + c + '" transform="rotate(-90 70 70)"/>' +
      '<circle cx="70" cy="70" r="' + (r + 11) + '" fill="none" stroke="#111" stroke-width="2.5"/><circle cx="70" cy="70" r="' + (r - 11) + '" fill="#fff" stroke="#111" stroke-width="2.5"/>' +
      '<text x="70" y="70" text-anchor="middle" style="font-family:var(--f-mono);font-size:20px;font-weight:700">' + Math.round(pb * 100) + '%</text><text x="70" y="88" text-anchor="middle" style="font-size:9px">KONDISI BAIK</text></svg>';
  };
  var wave = '<svg class="wave" viewBox="0 0 100 14"><path d="M0 8 Q12 0 25 8 T50 8 T75 8 T100 8" fill="none" stroke="#111" stroke-width="2.5"/></svg>';

  // ============ DASHBOARD ============
  A.pages.dashboard = function (el) {
    var bisaUbah = A.isAdm(), now = new Date();
    el.innerHTML = A.head('Dashboard Ringkasan', 'Sistem Informasi Manajemen Sarana &amp; Prasarana ' + esc(A.settings.NAMA_SEKOLAH || 'SMA Triguna 1956'),
      '<span class="datechip">' + ic('cal', 'sm') + fmt.tglPanjang(now) + ' <span class="chip">Batas: ' + esc(A.settings.JAM_BATAS_KEMBALI || '15:00') + ' WIB</span></span>' +
      '<button class="btn btn-icon" id="seg" aria-label="Segarkan" title="Segarkan">' + ic('refresh') + '</button>') +
      (A.user.role === 'KEPALA_SEKOLAH' ? '<div class="infobox" style="margin-bottom:16px;background:var(--lilac)">' + ic('eye') + '<span>Mode Kepala Sekolah (lihat saja). Persetujuan dokumen ada di menu <a href="#/persetujuan">Persetujuan TTD</a>.</span></div>' : '') +
      '<div id="dash">' + S.skeleton(6) + '</div>';
    var data = null;
    function gambar(d) {
      data = d;
      var k = d.kartu, telat = d.belum.filter(function (x) { return A.telat(x.batas) > 0; });
      var mode = el._mode || 'harian';
      var seri = mode === 'harian' ? d.harian : d.bulanan.map(function (n, i) { return [i, n]; });
      $('#dash', el).innerHTML = '<div class="stats">' +
        stat('Total Aset (unit)', k.totalUnit, 'box', 'bg-white', 'inventaris') + stat('Siap / Tersedia', k.tersedia, 'checkc', 'bg-mint', 'inventaris?status=TERSEDIA') +
        stat('Sedang Dipinjam', k.dipinjam, 'clock', 'bg-sky', 'transaksi?status=AKTIF') + stat('Terlambat Kembali', telat.length, 'alert', 'bg-red', 'transaksi?status=TERLAMBAT') +
        stat('Rusak / Perlu Cek', k.rusak + ' / ' + k.perluCek, 'wrench', 'bg-pink', 'inventaris?status=RUSAK') + '</div>' +
        '<div class="card"><div class="card-head bg-yellow"><h3>' + ic('alert', 'sm') + ' BELUM KEMBALI HARI INI (' + d.belum.length + ')</h3><a href="#/transaksi?status=AKTIF" style="color:var(--ink);font-weight:700">Lihat semua</a></div>' +
        '<div id="belum" style="padding:0"></div></div>' +
        '<div class="cols-2"><div class="card card-pad"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><h3 class="h3">Tren Peminjaman</h3>' +
        '<div class="tabs" style="margin:0"><button data-mode="harian" aria-selected="' + (mode === 'harian') + '">30 hari</button><button data-mode="bulanan" aria-selected="' + (mode === 'bulanan') + '">Bulanan</button></div></div>' +
        A.grafikGaris(seri, function (x, i, panjang) { return mode === 'harian' ? (panjang ? fmt.tgl(x) : String(x).slice(8) + ' ' + fmt.BLS[Number(String(x).slice(5, 7)) - 1]) : fmt.BLS[x]; }) + '</div>' +
        '<div class="card card-pad"><h3 class="h3">Paling Sering Dipinjam</h3>' + (d.top10.length ? d.top10.slice(0, 6).map(function (t, i) {
          var pct = Math.round(t.n / d.top10[0].n * 100);
          return '<div class="hbar"><div class="t"><span>' + esc(t.nama) + '</span><span>' + t.n + ' kali</span></div><div class="b"><i style="width:' + pct + '%;background:' + WARNA[i % 5] + '"></i></div></div>';
        }).join('') : S.empty('Belum ada peminjaman tahun ini', 'cari')) + '</div></div>' +
        '<div class="cols-2e"><div class="card card-pad"><h3 class="h3">Peminjaman per Kelas</h3><p class="help" style="margin-top:2px">Tahun ' + now.getFullYear() + '</p>' + A.grafikBatang(d.perKelas) + '</div>' +
        '<div class="card card-pad"><h3 class="h3">Kesehatan Fisik Barang</h3><div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-top:12px">' + A.donat(d.kondisi.baik, d.kondisi.rusak) +
        '<div class="legend" style="flex:1;min-width:180px"><div><span><i style="background:var(--mint)"></i>Baik</span><b class="mono">' + fmt.angka(d.kondisi.baik) + ' unit</b></div>' +
        '<div><span><i style="background:var(--red)"></i>Rusak</span><b class="mono">' + fmt.angka(d.kondisi.rusak) + ' unit</b></div></div></div>' +
        '<div id="cek" style="margin-top:14px"></div></div></div>';
      $$('[data-mode]', el).forEach(function (b) { b.onclick = function () { el._mode = b.dataset.mode; gambar(data); }; });
      $$('.stat', el).forEach(function (s) { s.onclick = function () { location.hash = '#/' + s.dataset.go; }; });
      tabelBelum(); daftarCek();
    }
    function stat(l, n, i, bg, go) { return '<div class="stat ' + bg + '" data-go="' + go + '" role="link" tabindex="0"><div class="top"><span class="ib">' + ic(i) + '</span><span class="n">' + (typeof n === 'number' ? fmt.angka(n) : n) + '</span></div><div><div class="l">' + esc(l) + '</div>' + wave + '</div></div>'; }
    function tabelBelum() {
      var box = $('#belum', el); if (!box || !data) return;
      var rows = data.belum.slice(0, 8);
      if (!rows.length) { box.innerHTML = S.empty('Semua barang sudah kembali', 'sukses'); return; }
      box.innerHTML = '<div style="overflow:auto"><table class="tbl" style="min-width:720px"><thead><tr><th>Peminjam</th><th>Kelas</th><th>Barang &amp; Kode</th><th>Jam Pinjam</th><th>Status</th>' + (bisaUbah ? '<th>Aksi</th>' : '') + '</tr></thead><tbody>' +
        rows.map(function (x) {
          var t = A.telat(x.batas);
          return '<tr><td><span style="display:flex;align-items:center;gap:8px"><span class="avatar">' + esc(fmt.inisial(x.nama)) + '</span>' + esc(x.nama) + '</span></td><td><span class="chip">' + esc(x.kelas || 'Guru') + '</span></td>' +
            '<td><b>' + esc(x.barang) + '</b><div class="sub">' + esc(x.kode) + (x.jumlah > 1 ? ' · ' + x.jumlah + ' buah' : '') + '</div></td><td class="mono">' + fmt.jam(x.waktu) + '</td>' +
            '<td>' + (t ? S.badge('TERLAMBAT', 'Terlambat ' + fmt.durasi(t)) : S.badge('DIPINJAM', 'Sedang dipinjam')) + '</td>' +
            (bisaUbah ? '<td><button class="btn btn-sm btn-sky" data-kembali="' + esc(x.detailId) + '">Tandai Kembali</button></td>' : '') + '</tr>';
        }).join('') + '</tbody></table></div>';
      $$('[data-kembali]', box).forEach(function (b) { b.onclick = function () { var x = data.belum.filter(function (y) { return y.detailId === b.dataset.kembali; })[0]; A.koreksiKembali(x, function () { muat(true); }); }; });
    }
    function daftarCek() {
      var box = $('#cek', el); if (!box || !data) return;
      if (!data.perluCek.length) { box.innerHTML = '<div class="infobox bg-mint">' + ic('checkc') + 'Tidak ada barang yang perlu dicek.</div>'; return; }
      box.innerHTML = '<div class="flabel" style="margin-bottom:8px;color:var(--red)">Perlu dicek (' + data.perluCek.length + ')</div>' + data.perluCek.slice(0, 4).map(function (c) {
        return '<div class="legend" style="margin-bottom:8px"><div style="flex-wrap:wrap"><span><b>' + esc(c.nama || c.kode) + '</b><br><span class="help">' + esc(c.keterangan || '') + '</span></span><span style="display:flex;gap:6px;flex-wrap:wrap">' +
          (c.kondisi === 'RUSAK' ? S.badge('RUSAK') : '') + (c.kelengkapan === 'TIDAK_LENGKAP' ? S.badge('TIDAK_LENGKAP') : '') +
          (bisaUbah ? '<button class="btn btn-sm" data-ba="' + esc(c.kembaliId) + '">' + ic('file', 'sm') + 'Berita Acara</button><button class="btn btn-sm btn-mint" data-tl="' + esc(c.kembaliId) + '">Selesai</button>' : '') + '</span></div></div>';
      }).join('');
      $$('[data-tl]', box).forEach(function (b) { b.onclick = function () {
        S.ask('Tandai sudah ditindaklanjuti?', 'Barang ini akan hilang dari daftar perlu dicek.', { input: 'Catatan tindak lanjut (opsional)', ok: 'Tandai selesai' }).then(function (v) {
          if (v === null) return; A.simpanLalu('transaksi.tindaklanjut', { kembaliId: b.dataset.tl, catatan: v }, b, ['dashboard', 'transaksi']).then(function (r) { if (r.success) muat(true); });
        }); }; });
      $$('[data-ba]', box).forEach(function (b) { b.onclick = function () { A.buatDokumen({ jenis: 'BERITA_ACARA', refId: b.dataset.ba }); }; });
    }
    function muat(paksa) { S.Store.load('dashboard.summary', {}, { maxAge: 30000, force: paksa, onData: gambar }); }
    $('#seg', el).onclick = function () { muat(true); A.segarBadge(); };
    muat();
    // Polling adaptif: status terlambat dihitung ulang tiap 30 dtk (lokal), data server dicek tiap 2 menit saat tab terlihat
    var t = setInterval(function () { if (document.visibilityState === 'visible') tabelBelum(); }, 30000);
    var t2 = setInterval(function () { if (document.visibilityState === 'visible') muat(); }, 120000);
    A.cleanup.push(function () { clearInterval(t); clearInterval(t2); });
  };

  /** Modal koreksi pengembalian manual (admin). */
  A.koreksiKembali = function (x, done) {
    var st = { kondisi: 'BAIK', lengkap: 'LENGKAP' };
    var m = S.modal({ title: 'Tandai Kembali Manual', body: '<div class="infobox" style="margin-bottom:14px">' + ic('box') + '<span><b>' + esc(x.barang) + '</b> · ' + esc(x.kode) + '<br>' + esc(x.nama) + (x.kelas ? ' (' + esc(x.kelas) + ')' : '') + ' · pinjam ' + fmt.tglJam(x.waktu) + '</span></div>' +
      (x.jumlah > 1 ? '<div class="field"><label>Jumlah dikembalikan</label><input class="input" type="number" id="kj" min="1" max="' + x.jumlah + '" value="' + x.jumlah + '"></div>' : '') +
      '<div class="flabel" style="margin:6px 0 8px">Kondisi</div><div class="grid-2"><button class="choice c-good" data-k="BAIK" aria-pressed="true" style="min-height:70px">Baik</button><button class="choice c-bad" data-k="RUSAK" aria-pressed="false" style="min-height:70px">Rusak</button></div>' +
      '<div class="flabel" style="margin:14px 0 8px">Kelengkapan</div><div class="grid-2"><button class="choice c-good" data-l="LENGKAP" aria-pressed="true" style="min-height:70px">Lengkap</button><button class="choice c-pink" data-l="TIDAK_LENGKAP" aria-pressed="false" style="min-height:70px">Tidak Lengkap</button></div>' +
      '<div class="field" style="margin-top:14px"><label>Keterangan kondisi</label><textarea class="textarea" id="kk" placeholder="Wajib bila rusak / tidak lengkap"></textarea></div>' +
      '<div class="field"><label>Alasan koreksi <span class="req">*</span></label><input class="input" id="ka" placeholder="Mis. peminjam lupa scan saat mengembalikan"></div>',
      foot: '<button class="btn" data-b>Batal</button><button class="btn btn-navy" data-s>' + ic('check', 'sm') + 'Simpan Koreksi</button>' });
    $$('[data-k]', m.el).forEach(function (b) { b.onclick = function () { st.kondisi = b.dataset.k; $$('[data-k]', m.el).forEach(function (y) { y.setAttribute('aria-pressed', y === b); }); }; });
    $$('[data-l]', m.el).forEach(function (b) { b.onclick = function () { st.lengkap = b.dataset.l; $$('[data-l]', m.el).forEach(function (y) { y.setAttribute('aria-pressed', y === b); }); }; });
    m.el.querySelector('[data-b]').onclick = m.close;
    m.el.querySelector('[data-s]').onclick = function () {
      var j = $('#kj', m.el);
      A.simpanLalu('transaksi.koreksi', { detailId: x.detailId, jumlah: j ? Number(j.value) : undefined, kondisi: st.kondisi, kelengkapan: st.lengkap, keterangan: $('#kk', m.el).value, alasan: $('#ka', m.el).value },
        this, ['dashboard', 'transaksi', 'inventaris']).then(function (r) { if (r.success) { m.close(); if (done) done(); A.segarBadge(); } });
    };
  };

  // ============ TRANSAKSI ============
  A.pages.transaksi = function (el, r) {
    var now = new Date(), st = { dari: r.q.dari || fmt.iso(new Date(now.getFullYear(), now.getMonth(), 1)), sampai: r.q.sampai || fmt.iso(now), tab: r.q.status || 'SEMUA', q: '', tipe: '', kelas: '', kat: '', kond: '' };
    el.innerHTML = A.head('Transaksi & Pengembalian', 'Riwayat peminjaman dan pengembalian barang.', '<button class="btn" id="xls">' + ic('excel') + 'Unduh Excel</button>') +
      '<div class="filters"><input class="input" type="date" id="fd" value="' + st.dari + '" aria-label="Dari tanggal"><input class="input" type="date" id="fs" value="' + st.sampai + '" aria-label="Sampai tanggal">' +
      '<select class="select" id="ft" aria-label="Tipe"><option value="">Semua peminjam</option><option value="SISWA">Siswa</option><option value="GURU">Guru/Staf</option></select>' +
      '<select class="select" id="fk" aria-label="Kelas"><option value="">Semua kelas</option></select><select class="select" id="fc" aria-label="Kategori"><option value="">Semua kategori</option></select>' +
      '<select class="select" id="fo" aria-label="Kondisi kembali"><option value="">Semua kondisi</option><option value="RUSAK">Kembali rusak</option><option value="TIDAK_LENGKAP">Tidak lengkap</option></select>' +
      '<input class="input" id="fq" placeholder="Cari nama / kode / no. transaksi" style="flex:2 1 220px"></div>' +
      '<div class="tabs" id="tabs"></div><div id="tbl">' + S.skeleton(6) + '</div>';
    var data = null;
    function filter() {
      if (!data) return [];
      return data.rows.filter(function (x) {
        var tl = x.status === 'DIPINJAM' ? A.telat(x.batas) > 0 : x.terlambat;
        if (st.tab === 'AKTIF' && x.status !== 'DIPINJAM') return false;
        if (st.tab === 'TERLAMBAT' && !tl) return false;
        if (st.tab === 'SELESAI' && x.status === 'DIPINJAM') return false;
        if (st.tipe && x.tipe !== st.tipe) return false;
        if (st.kelas && x.kelas !== st.kelas) return false;
        if (st.kat && x.kategori !== st.kat) return false;
        if (st.kond === 'RUSAK' && x.kondisi !== 'RUSAK') return false;
        if (st.kond === 'TIDAK_LENGKAP' && x.kelengkapan !== 'TIDAK_LENGKAP') return false;
        return A.cocok(x.nama + ' ' + x.kode + ' ' + x.barang + ' ' + x.trx, st.q);
      });
    }
    function gambar() {
      var semua = data.rows, n = { SEMUA: semua.length, AKTIF: 0, TERLAMBAT: 0, SELESAI: 0 };
      semua.forEach(function (x) { if (x.status === 'DIPINJAM') { n.AKTIF++; if (A.telat(x.batas)) n.TERLAMBAT++; } else { n.SELESAI++; if (x.terlambat) n.TERLAMBAT++; } });
      $('#tabs', el).innerHTML = [['SEMUA', 'Semua'], ['AKTIF', 'Aktif'], ['TERLAMBAT', 'Terlambat'], ['SELESAI', 'Selesai']].map(function (t) {
        return '<button data-t="' + t[0] + '" aria-selected="' + (st.tab === t[0]) + '">' + t[1] + '<span class="count">' + n[t[0]] + '</span></button>'; }).join('');
      $$('[data-t]', el).forEach(function (b) { b.onclick = function () { st.tab = b.dataset.t; gambar(); }; });
      var rows = filter();
      A.tabel($('#tbl', el), rows, [
        { t: 'No. Transaksi', f: function (x) { return '<span class="code" style="font-size:12px">' + esc(x.trx) + '</span><div class="sub">' + fmt.tglJam(x.waktu) + '</div>'; } },
        { t: 'Peminjam', f: function (x) { return '<b>' + esc(x.nama) + '</b><div class="sub">' + esc(x.kelas || 'Guru/Staf') + '</div>'; } },
        { t: 'Barang', f: function (x) { return esc(x.barang) + '<div class="sub">' + esc(x.kode) + (x.jumlah > 1 ? ' · ' + x.jumlah + ' bh' : '') + '</div>'; } },
        { t: 'Kembali', f: function (x) { return x.kembali ? fmt.tglJam(x.kembali) + (x.oleh && x.oleh !== 'PUBLIK' ? '<div class="sub">koreksi ' + esc(x.oleh) + '</div>' : '') : '<span class="muted">—</span>'; } },
        { t: 'Kondisi', f: function (x) { return x.kondisi ? S.badge(x.kondisi) + ' ' + (x.kelengkapan === 'TIDAK_LENGKAP' ? S.badge('TIDAK_LENGKAP') : '') + (x.keterangan ? '<div class="sub" title="' + esc(x.keterangan) + '">' + esc(x.keterangan.slice(0, 40)) + '</div>' : '') : '—'; } },
        { t: 'Status', f: function (x) { var t = x.status === 'DIPINJAM' ? A.telat(x.batas) : 0; return x.status === 'DIPINJAM' ? (t ? S.badge('TERLAMBAT', 'Terlambat ' + fmt.durasi(t)) : S.badge('DIPINJAM')) : (x.terlambat ? S.badge('TERLAMBAT', 'Selesai · terlambat') : S.badge('SELESAI')); } },
        { t: '', cls: 'num', f: function (x) {
          return '<div class="row-acts">' + (A.isAdm() && x.status === 'DIPINJAM' ? '<button class="ib-btn" data-kb="' + esc(x.detailId) + '" title="Tandai kembali" aria-label="Tandai kembali">' + ic('check', 'sm') + '</button>' : '') +
            (A.isAdm() ? '<button class="ib-btn" data-bk="' + esc(x.trx) + '" title="Cetak bukti peminjaman" aria-label="Cetak bukti">' + ic('print', 'sm') + '</button>' : '') +
            (A.isAdm() && x.kembaliId && (x.kondisi === 'RUSAK' || x.kelengkapan === 'TIDAK_LENGKAP') ? '<button class="ib-btn danger" data-ba="' + esc(x.kembaliId) + '" title="Berita acara" aria-label="Berita acara">' + ic('file', 'sm') + '</button>' : '') + '</div>';
        } }
      ], { kosong: 'Tidak ada transaksi pada filter ini', bind: function (box) {
        $$('[data-kb]', box).forEach(function (b) { b.onclick = function () { var x = data.rows.filter(function (y) { return y.detailId === b.dataset.kb; })[0]; A.koreksiKembali({ detailId: x.detailId, barang: x.barang, kode: x.kode, nama: x.nama, kelas: x.kelas, waktu: x.waktu, jumlah: x.jumlah - x.kembaliJml }, function () { muat(true); }); }; });
        $$('[data-bk]', box).forEach(function (b) { b.onclick = function () { A.buatDokumen({ jenis: 'BUKTI_PINJAM', refId: b.dataset.bk }); }; });
        $$('[data-ba]', box).forEach(function (b) { b.onclick = function () { A.buatDokumen({ jenis: 'BERITA_ACARA', refId: b.dataset.ba }); }; });
      } });
    }
    function isiFilter() {
      var kelas = {}, kat = {};
      data.rows.forEach(function (x) { if (x.kelas) kelas[x.kelas] = 1; if (x.kategori) kat[x.kategori] = 1; });
      $('#fk', el).innerHTML = A.opsi(Object.keys(kelas).sort(), st.kelas, 'Semua kelas');
      $('#fc', el).innerHTML = A.opsi(Object.keys(kat).sort(), st.kat, 'Semua kategori');
    }
    function muat(paksa) {
      S.Store.load('transaksi.list', { dari: st.dari, sampai: st.sampai }, { maxAge: 30000, force: paksa, onData: function (d) { data = d; isiFilter(); gambar(); } });
    }
    $('#fd', el).onchange = function () { st.dari = this.value; muat(); };
    $('#fs', el).onchange = function () { st.sampai = this.value; muat(); };
    [['#ft', 'tipe'], ['#fk', 'kelas'], ['#fc', 'kat'], ['#fo', 'kond']].forEach(function (p) { $(p[0], el).onchange = function () { st[p[1]] = this.value; gambar(); }; });
    var deb; $('#fq', el).oninput = function () { var v = this.value; clearTimeout(deb); deb = setTimeout(function () { st.q = v; gambar(); }, 120); };
    $('#xls', el).onclick = function () {
      var rows = filter().map(function (x) { return { 'No. Transaksi': x.trx, 'Waktu Pinjam': fmt.tglJam(x.waktu), 'Peminjam': x.nama, 'Tipe': x.tipe, 'Kelas': x.kelas, 'Kode Barang': x.kode, 'Nama Barang': x.barang,
        'Kategori': x.kategori, 'Jumlah': x.jumlah, 'Status': x.status === 'DIPINJAM' ? (A.telat(x.batas) ? 'Terlambat (belum kembali)' : 'Dipinjam') : 'Selesai', 'Waktu Kembali': x.kembali ? fmt.tglJam(x.kembali) : '',
        'Terlambat': x.terlambat || (x.status === 'DIPINJAM' && A.telat(x.batas) > 0) ? 'Ya' : 'Tidak', 'Kondisi': x.kondisi, 'Kelengkapan': x.kelengkapan, 'Keterangan': x.keterangan }; });
      S.busy(this, Excel.unduh('Rekap_Peminjaman_' + st.dari + '_sd_' + st.sampai + '.xlsx', [{ name: 'Transaksi', rows: rows, widths: [20, 14, 24, 8, 10, 14, 28, 14, 7, 18, 14, 9, 8, 13, 30] }]), 'Menyiapkan…');
    };
    muat();
  };

  // ============ INVENTARIS ============
  A.master = function (cb) { return S.Store.load('master.list', {}, { maxAge: 120000, onData: cb }); };
  A.pages.inventaris = function (el, r) {
    var st = { q: r.q.q || '', kat: '', lok: '', status: r.q.status || '', tipe: '', sel: {} }, data = null, master = null, adm = A.isAdm();
    el.innerHTML = A.head('Inventaris Barang', 'Seluruh aset &amp; perlengkapan sekolah.', adm ? '<button class="btn" id="imp">' + ic('upload') + 'Impor Excel</button><button class="btn" id="xls">' + ic('excel') + 'Unduh Excel</button><button class="btn btn-yellow" id="add">' + ic('plus') + 'Tambah Barang</button>' : '<button class="btn" id="xls">' + ic('excel') + 'Unduh Excel</button>') +
      '<div id="chips" class="mini-stats"></div><div class="filters"><input class="input" id="fq" placeholder="Cari nama / kode / merek" value="' + esc(st.q) + '" style="flex:2 1 220px">' +
      '<select class="select" id="fc"><option value="">Semua kategori</option></select><select class="select" id="fl"><option value="">Semua lokasi</option></select>' +
      '<select class="select" id="fs">' + A.opsi([{ v: '', l: 'Semua status' }, { v: 'TERSEDIA', l: 'Tersedia' }, { v: 'DIPINJAM', l: 'Dipinjam' }, { v: 'RUSAK', l: 'Rusak' }, { v: 'NONAKTIF', l: 'Nonaktif' }], st.status) + '</select>' +
      '<select class="select" id="ft"><option value="">Semua tipe</option><option value="UNIT">Unit</option><option value="STOK">Stok</option></select></div><div id="tbl">' + S.skeleton(8) + '</div><div id="bulk"></div>';
    function filter() {
      return data.rows.filter(function (x) {
        if (st.kat && x.kategoriId !== st.kat) return false;
        if (st.lok && x.lokasiId !== st.lok) return false;
        if (st.tipe && x.tipe !== st.tipe) return false;
        if (st.status === 'RUSAK' ? (x.status !== 'RUSAK' && x.kondisi !== 'RUSAK') : st.status && x.status !== st.status) return false;
        if (!st.status && x.status === 'NONAKTIF') return false;
        return A.cocok(x.kode + ' ' + x.nama + ' ' + x.merek + ' ' + x.lokasi, st.q);
      });
    }
    function gambar() {
      var n = { UNIT: 0, STOK: 0, RUSAK: 0, NONAKTIF: 0 };
      data.rows.forEach(function (x) { if (x.status === 'NONAKTIF') n.NONAKTIF++; else { n[x.tipe]++; if (x.status === 'RUSAK' || x.kondisi === 'RUSAK') n.RUSAK++; } });
      $('#chips', el).innerHTML = '<div class="bg-sky">UNIT ' + n.UNIT + '</div><div class="bg-pink">STOK ' + n.STOK + ' jenis</div><div style="background:var(--red-t)">Rusak ' + n.RUSAK + '</div><div style="background:#E5E5E5">Nonaktif ' + n.NONAKTIF + '</div>';
      var rows = filter();
      A.tabel($('#tbl', el), rows, [
        adm ? { t: '<input type="checkbox" id="all" aria-label="Pilih semua">', f: function (x) { return '<label class="check"><input type="checkbox" data-sel="' + esc(x.barangId) + '"' + (st.sel[x.barangId] ? ' checked' : '') + ' aria-label="Pilih"></label>'; } } : null,
        { t: 'Kode', f: function (x) { return '<a class="code" href="#/barang/' + esc(x.barangId) + '" style="color:var(--navy)">' + esc(x.kode) + '</a>'; } },
        { t: 'Nama Barang', f: function (x) { return '<b>' + esc(x.nama) + '</b><div class="sub">' + esc(x.merek || '') + '</div>'; } },
        { t: 'Tipe', f: function (x) { return S.badge(x.tipe); } },
        { t: 'Kategori', f: function (x) { return esc(x.kategori); } },
        { t: 'Lokasi', f: function (x) { return esc(x.lokasi); } },
        { t: 'Tersedia', cls: 'num', f: function (x) { return x.tersedia + '/' + x.total; } },
        { t: 'Kondisi', f: function (x) { return S.badge(x.kondisi); } },
        { t: 'Status', f: function (x) { return S.badge(x.status) + (!x.bisaDipinjam && x.status !== 'NONAKTIF' ? '<div class="sub">tidak dipinjamkan</div>' : ''); } },
        { t: '', cls: 'num', f: function (x) { return '<div class="row-acts"><a class="ib-btn" href="#/barang/' + esc(x.barangId) + '" aria-label="Detail">' + ic('eye', 'sm') + '</a>' + (adm ? '<button class="ib-btn" data-ed="' + esc(x.barangId) + '" aria-label="Ubah">' + ic('edit', 'sm') + '</button>' : '') + '</div>'; } }
      ].filter(Boolean), { kosong: st.q ? 'Barang "' + st.q + '" tidak ditemukan' : 'Belum ada barang', maskot: 'kotak', ctaKosong: adm ? '<button class="btn btn-yellow" onclick="document.getElementById(\'add\').click()">' + ic('plus') + 'Tambah Barang</button>' : '', bind: function (box) {
        $$('[data-sel]', box).forEach(function (c) { c.onchange = function () { if (c.checked) st.sel[c.dataset.sel] = 1; else delete st.sel[c.dataset.sel]; bulk(); }; });
        var all = $('#all', box);
        if (all) all.onchange = function () { $$('[data-sel]', box).forEach(function (c) { c.checked = all.checked; if (all.checked) st.sel[c.dataset.sel] = 1; else delete st.sel[c.dataset.sel]; }); bulk(); };
        $$('[data-ed]', box).forEach(function (b) { b.onclick = function () { A.formBarang(data.rows.filter(function (x) { return x.barangId === b.dataset.ed; })[0], function () { muat(true); }); }; });
      } });
      bulk();
    }
    function bulk() {
      var ids = Object.keys(st.sel), box = $('#bulk', el);
      if (!adm || !ids.length) { box.innerHTML = ''; return; }
      box.innerHTML = '<div class="bulk"><b>' + ids.length + ' dipilih</b><span style="flex:1"></span><button class="btn btn-sm btn-yellow" data-b="label">' + ic('qr', 'sm') + 'Cetak Label QR</button>' +
        '<button class="btn btn-sm" data-b="PINDAH">' + ic('move', 'sm') + 'Pindah Lokasi</button><button class="btn btn-sm" data-b="BAIK">Tandai Baik</button><button class="btn btn-sm" data-b="RUSAK">Tandai Rusak</button>' +
        '<button class="btn btn-sm btn-danger-o" data-b="NONAKTIF">Nonaktifkan</button><button class="btn btn-sm btn-mint" data-b="AKTIFKAN">Aktifkan</button><button class="btn btn-sm btn-ghost" style="color:#fff" data-b="x">Batal</button></div>';
      $$('[data-b]', box).forEach(function (b) { b.onclick = function () {
        var a = b.dataset.b;
        if (a === 'x') { st.sel = {}; gambar(); return; }
        if (a === 'label') { try { sessionStorage.setItem('label_sel', JSON.stringify(ids)); } catch (e) {} location.hash = '#/label'; return; }
        if (a === 'PINDAH') {
          var m = S.modal({ title: 'Pindah ' + ids.length + ' barang', body: '<div class="field"><label>Lokasi tujuan</label><select class="select" id="tuj">' + A.opsi(master.lokasi.filter(function (l) { return l.aktif; }).map(function (l) { return { v: l.id, l: l.nama }; })) + '</select></div>',
            foot: '<button class="btn" data-c>Batal</button><button class="btn btn-navy" data-o>Pindahkan</button>' });
          m.el.querySelector('[data-c]').onclick = m.close;
          m.el.querySelector('[data-o]').onclick = function () { A.simpanLalu('inventaris.setStatus', { barangIds: ids, aksi: 'PINDAH', lokasiId: $('#tuj', m.el).value }, this, ['inventaris', 'master', 'public', 'dashboard']).then(function (r) { if (r.success) { m.close(); st.sel = {}; muat(true); } }); };
          return;
        }
        S.ask('Ubah ' + ids.length + ' barang?', { BAIK: 'Kondisi ditandai <b>Baik</b> dan barang bisa dipinjam lagi.', RUSAK: 'Barang ditandai <b>Rusak</b> dan tidak bisa dipinjam.', NONAKTIF: 'Barang <b>dinonaktifkan</b> (tidak tampil di kios). Barang yang sedang dipinjam dilewati.', AKTIFKAN: 'Barang diaktifkan kembali.' }[a], { danger: a === 'NONAKTIF' || a === 'RUSAK' }).then(function (ya) {
          if (!ya) return;
          A.simpanLalu('inventaris.setStatus', { barangIds: ids, aksi: a }, b, ['inventaris', 'master', 'dashboard']).then(function (r) { if (r.success) { st.sel = {}; muat(true); } });
        });
      }; });
    }
    function isiFilter() {
      if (!master) return;
      $('#fc', el).innerHTML = A.opsi(master.kategori.map(function (k) { return { v: k.id, l: k.nama }; }), st.kat, 'Semua kategori');
      $('#fl', el).innerHTML = A.opsi(master.lokasi.map(function (k) { return { v: k.id, l: k.nama }; }), st.lok, 'Semua lokasi');
    }
    function muat(paksa) { S.Store.load('inventaris.list', {}, { maxAge: 60000, force: paksa, onData: function (d) { data = d; gambar(); } }); }
    A.master(function (m) { master = m; isiFilter(); });
    var deb; $('#fq', el).oninput = function () { var v = this.value; clearTimeout(deb); deb = setTimeout(function () { st.q = v; gambar(); }, 120); };
    [['#fc', 'kat'], ['#fl', 'lok'], ['#fs', 'status'], ['#ft', 'tipe']].forEach(function (p) { $(p[0], el).onchange = function () { st[p[1]] = this.value; gambar(); }; });
    if ($('#add', el)) $('#add', el).onclick = function () { A.formBarang(null, function () { muat(true); }); };
    if ($('#imp', el)) $('#imp', el).onclick = function () { A.imporExcel('INVENTARIS', function () { muat(true); }); };
    $('#xls', el).onclick = function () {
      var rows = (data ? filter() : []).map(function (x) { return { 'Kode Barang': x.kode, 'Nama Barang': x.nama, 'Tipe': x.tipe, 'Kategori': x.kategori, 'Lokasi': x.lokasi, 'Merek/Spesifikasi': x.merek, 'Satuan': x.satuan,
        'Jumlah': x.total, 'Tersedia': x.tersedia, 'Kondisi': x.kondisi, 'Status': x.status, 'Bisa Dipinjam': x.bisaDipinjam ? 'Ya' : 'Tidak', 'Sumber Perolehan': x.sumber, 'Tahun': x.tahun, 'Keterangan': x.keterangan, 'Dipinjam (kali)': x.dipinjamKali }; });
      S.busy(this, Excel.unduh('Inventaris_SIM-SARPRAS_' + fmt.iso() + '.xlsx', [{ name: 'Inventaris', rows: rows, widths: [16, 30, 7, 16, 18, 22, 8, 8, 8, 9, 10, 10, 14, 7, 24, 10] }]), 'Menyiapkan…');
    };
    muat();
  };

  /** Form tambah/ubah barang. */
  A.formBarang = function (x, done) {
    A.master(function (m) {
      if (!m || A._formOpen) return;
      A._formOpen = true;
      var ubah = !!x, tipe = x ? x.tipe : 'UNIT';
      var md = S.modal({ title: ubah ? 'Ubah Barang · ' + x.kode : 'Tambah Barang', wide: true, onClose: function () { A._formOpen = false; }, body:
        '<div class="grid-2" style="grid-template-columns:2fr 1fr;align-items:start"><div>' +
        '<div class="card" style="box-shadow:none;margin-bottom:16px"><div class="card-head bg-sky"><h3>Identitas Barang</h3></div><div class="card-pad">' +
        '<div class="field"><label>Nama barang <span class="req">*</span></label><input class="input" id="nm" value="' + esc(x ? x.nama : '') + '" placeholder="Mis. Proyektor Epson EB-X51"></div>' +
        (ubah ? '' : '<div class="flabel" style="margin-bottom:8px">Tipe pencatatan</div><div class="grid-2" style="margin-bottom:14px"><button class="choice" style="min-height:80px" data-tp="UNIT" aria-pressed="' + (tipe === 'UNIT') + '">' + ic('box') + 'UNIT · per buah<span class="help">1 QR per barang (laptop, proyektor)</span></button>' +
          '<button class="choice c-pink" style="min-height:80px" data-tp="STOK" aria-pressed="' + (tipe === 'STOK') + '">' + ic('layers') + 'STOK · jumlah banyak<span class="help">1 QR per jenis (bola, kursi)</span></button></div>') +
        '<div class="grid-2"><div class="field"><label>Kategori <span class="req">*</span></label><select class="select" id="kt">' + A.opsi(m.kategori.filter(function (k) { return k.aktif || (x && x.kategoriId === k.id); }).map(function (k) { return { v: k.id, l: k.nama + ' (' + k.kode + ')' }; }), x ? x.kategoriId : '') + '</select></div>' +
        '<div class="field"><label>Lokasi <span class="req">*</span></label><select class="select" id="lk">' + A.opsi(m.lokasi.filter(function (k) { return k.aktif || (x && x.lokasiId === k.id); }).map(function (k) { return { v: k.id, l: k.nama }; }), x ? x.lokasiId : '') + '</select></div></div>' +
        '<div class="grid-2"><div class="field"><label>Merek / spesifikasi</label><input class="input" id="mr" value="' + esc(x ? x.merek : '') + '"></div><div class="field"><label>Satuan</label><input class="input" id="st" value="' + esc(x ? x.satuan : 'unit') + '" list="satuanList"><datalist id="satuanList"><option>unit</option><option>buah</option><option>set</option><option>pasang</option><option>lembar</option></datalist></div></div></div></div>' +
        '<div class="card" style="box-shadow:none;margin-bottom:16px"><div class="card-head bg-yellow"><h3>Jumlah</h3></div><div class="card-pad"><div class="field"><label id="jlLbl">' + (ubah ? (tipe === 'STOK' ? 'Jumlah stok' : 'Jumlah') : 'Jumlah unit yang ditambahkan') + '</label>' +
        '<input class="input" type="number" min="1" id="jl" value="' + (x ? x.total : 1) + '"' + (ubah && tipe === 'UNIT' ? ' disabled' : '') + '></div><div class="help" id="jlHelp"></div></div></div>' +
        '<div class="card" style="box-shadow:none"><div class="card-head bg-mint"><h3>Status &amp; Perolehan</h3></div><div class="card-pad"><div class="grid-2"><div class="field"><label>Kondisi</label><select class="select" id="kd">' + A.opsi([{ v: 'BAIK', l: 'Baik' }, { v: 'RUSAK', l: 'Rusak' }], x ? x.kondisi : 'BAIK') + '</select></div>' +
        '<div class="field"><label>Bisa dipinjam</label><select class="select" id="bd">' + A.opsi([{ v: '1', l: 'Ya, tampil di kios' }, { v: '0', l: 'Tidak (aset tetap)' }], x && !x.bisaDipinjam ? '0' : '1') + '</select></div></div>' +
        '<div class="grid-2"><div class="field"><label>Sumber perolehan</label><input class="input" id="sb" list="sumberList" value="' + esc(x ? x.sumber : '') + '"><datalist id="sumberList"><option>BOS</option><option>Yayasan</option><option>Hibah</option><option>Komite</option><option>Lainnya</option></datalist></div>' +
        '<div class="field"><label>Tahun</label><input class="input" id="th" inputmode="numeric" maxlength="4" value="' + esc(x ? x.tahun : '') + '"></div></div>' +
        '<div class="field"><label>Keterangan</label><textarea class="textarea" id="ke">' + esc(x ? x.keterangan : '') + '</textarea></div></div></div></div>' +
        '<div class="card card-pad" style="position:sticky;top:0"><div class="flabel">Pratinjau kode</div><div class="qrbox" style="margin:12px 0" id="qrPrev"></div><div class="code" id="kdPrev" style="text-align:center"></div><p class="help" style="text-align:center">Kode dibuat otomatis dan tidak berubah walau lokasi dipindah.</p></div></div>',
        foot: '<button class="btn" data-c>Batal</button>' + (ubah ? '' : '<button class="btn" data-s="label">' + ic('qr', 'sm') + 'Simpan &amp; Cetak Label</button>') + '<button class="btn btn-navy" data-s="1">' + ic('check', 'sm') + 'Simpan</button>' });
      var e = md.el;
      function prev() {
        var kat = m.kategori.filter(function (k) { return k.id === $('#kt', e).value; })[0], kode = x ? x.kode : (A.settings.PREFIX_KODE || 'SAR') + '-' + (kat ? kat.kode : 'XXX') + '-####';
        $('#kdPrev', e).textContent = kode; $('#qrPrev', e).innerHTML = qrSvg(x ? x.kode : kode.replace('####', '0001'));
        var j = Number($('#jl', e).value) || 1;
        $('#jlHelp', e).textContent = ubah ? (tipe === 'UNIT' ? 'Barang UNIT selalu berjumlah 1 per kode.' : 'Tersedia sekarang: ' + x.tersedia) : tipe === 'UNIT' ? (j > 1 ? 'Akan dibuat ' + j + ' kode berurutan.' : 'Akan dibuat 1 kode.') : '1 kode untuk ' + j + ' ' + ($('#st', e).value || 'buah') + '.';
      }
      $$('[data-tp]', e).forEach(function (b) { b.onclick = function () { tipe = b.dataset.tp; $$('[data-tp]', e).forEach(function (y) { y.setAttribute('aria-pressed', y === b); }); $('#jlLbl', e).textContent = tipe === 'UNIT' ? 'Jumlah unit yang ditambahkan' : 'Jumlah stok'; if (tipe === 'STOK' && $('#st', e).value === 'unit') $('#st', e).value = 'buah'; prev(); }; });
      ['#kt', '#jl', '#st'].forEach(function (s) { $(s, e).addEventListener('input', prev); });
      prev();
      e.querySelector('[data-c]').onclick = md.close;
      $$('[data-s]', e).forEach(function (btn) { btn.onclick = function () {
        var d = { barangId: x ? x.barangId : undefined, namaBarang: $('#nm', e).value, tipe: tipe, kategoriId: $('#kt', e).value, lokasiId: $('#lk', e).value, merekSpesifikasi: $('#mr', e).value,
          satuan: $('#st', e).value, jumlah: $('#jl', e).value, kondisi: $('#kd', e).value, bisaDipinjam: $('#bd', e).value === '1', sumberPerolehan: $('#sb', e).value, tahunPerolehan: $('#th', e).value, keterangan: $('#ke', e).value };
        if (!d.namaBarang.trim()) { $('#nm', e).classList.add('err'); $('#nm', e).focus(); S.toast('Nama barang wajib diisi.', 'error'); return; }
        A.simpanLalu('inventaris.save', d, btn, ['inventaris', 'master', 'public', 'dashboard']).then(function (r) {
          if (!r.success) return;
          md.close(); if (done) done();
          if (btn.dataset.s === 'label') { try { sessionStorage.setItem('label_sel', JSON.stringify(r.data.dibuat.map(function (z) { return z.barangId; }))); } catch (er) {} location.hash = '#/label'; }
        });
      }; });
    });
  };

  // ============ DETAIL BARANG ============
  A.pages.barang = function (el, r) {
    var adm = A.isAdm();
    S.Store.load('inventaris.list', {}, { maxAge: 60000, onData: function (d) {
      var x = d.rows.filter(function (y) { return y.barangId === r.id; })[0];
      if (!x) { el.innerHTML = S.empty('Barang tidak ditemukan', 'cari', '<a class="btn" href="#/inventaris">Kembali ke inventaris</a>'); return; }
      el.innerHTML = '<a href="#/inventaris" class="btn btn-sm" style="margin-bottom:16px">' + ic('back', 'sm') + 'Inventaris</a>' +
        '<div class="hero-y"><div class="qrbox">' + qrSvg(x.kode) + '</div><div><div style="display:flex;gap:8px;flex-wrap:wrap">' + S.badge(x.status) + S.badge(x.tipe) + S.badge(x.kondisi) + '</div>' +
        '<h1 class="h1" style="margin:10px 0 2px">' + esc(x.nama) + '</h1><div class="code">' + esc(x.kode) + '</div>' +
        '<div class="mini-stats"><div>' + x.dipinjamKali + '× dipinjam</div><div>' + x.tersedia + '/' + x.total + ' ' + esc(x.satuan) + '</div><div>' + esc(x.lokasi) + '</div><div>' + esc(x.kategori) + '</div></div>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap">' + (adm ? '<button class="btn btn-ink" id="lbl">' + ic('qr', 'sm') + 'Cetak Label</button><button class="btn" id="ed">' + ic('edit', 'sm') + 'Ubah</button><button class="btn" id="kib">' + ic('file', 'sm') + 'Kartu Inventaris</button>' : '') + '</div></div></div>' +
        '<div class="cols-2"><div><h2 class="h2" style="margin-bottom:12px">Riwayat Peminjaman</h2><div id="his">' + S.skeleton(4) + '</div></div>' +
        '<div class="card card-pad"><h3 class="h3" style="margin-bottom:12px">Informasi</h3><dl class="kv"><dt>Merek</dt><dd>' + esc(x.merek || '-') + '</dd><dt>Sumber</dt><dd>' + esc(x.sumber || '-') + '</dd>' +
        '<dt>Tahun</dt><dd>' + esc(x.tahun || '-') + '</dd><dt>Bisa dipinjam</dt><dd>' + (x.bisaDipinjam ? 'Ya' : 'Tidak') + '</dd><dt>Keterangan</dt><dd>' + esc(x.keterangan || '-') + '</dd><dt>Diubah</dt><dd>' + fmt.tglJam(x.diubah) + '</dd></dl></div></div>';
      if (adm) {
        $('#lbl', el).onclick = function () { try { sessionStorage.setItem('label_sel', JSON.stringify([x.barangId])); } catch (e) {} location.hash = '#/label'; };
        $('#ed', el).onclick = function () { A.formBarang(x, function () { A.go('#/barang/' + x.barangId); }); };
        $('#kib', el).onclick = function () { A.buatDokumen({ jenis: 'KARTU_INVENTARIS', refId: x.barangId }); };
      }
      S.Store.load('inventaris.history', { barangId: x.barangId }, { maxAge: 30000, onData: function (h) {
        A.tabel($('#his', el), h.rows, [
          { t: 'Tanggal', f: function (y) { return fmt.tglJam(y.waktu); } }, { t: 'Peminjam', f: function (y) { return '<b>' + esc(y.nama) + '</b><div class="sub">' + esc(y.kelas || 'Guru/Staf') + '</div>'; } },
          { t: 'Kembali', f: function (y) { return y.kembali ? fmt.tglJam(y.kembali) : S.badge('DIPINJAM'); } },
          { t: 'Kondisi', f: function (y) { return y.kondisi ? S.badge(y.kondisi) + (y.kelengkapan === 'TIDAK_LENGKAP' ? ' ' + S.badge('TIDAK_LENGKAP') : '') + (y.terlambat ? ' ' + S.badge('TERLAMBAT') : '') : '—'; } }
        ], { per: 10, kosong: 'Belum pernah dipinjam', maskot: 'kotak' });
      } });
    } });
  };

  // ============ CETAK LABEL QR ============
  A.pages.label = function (el) {
    var sel = []; try { sel = JSON.parse(sessionStorage.getItem('label_sel') || '[]'); } catch (e) {}
    var st = { ukuran: 'sedang', logo: true, lokasi: true }, data = null;
    var UK = { kecil: { kol: 4, baris: 10, qr: 20 }, sedang: { kol: 3, baris: 8, qr: 26 }, besar: { kol: 2, baris: 5, qr: 42 } };
    el.innerHTML = A.head('Cetak Label QR', 'Tempel label di barang. QR hanya berisi kode barang.', '<button class="btn btn-lg btn-navy" id="pr">' + ic('print') + 'Cetak</button>') +
      '<div class="grid-2" style="grid-template-columns:minmax(260px,320px) 1fr;align-items:start"><div class="card card-pad bg-lilac" style="background:var(--lilac-t)">' +
      '<div class="field"><label>Tambah barang</label><input class="input" id="cari" placeholder="Ketik kode / nama lalu Enter" list="brgList"><datalist id="brgList"></datalist></div>' +
      '<div class="flabel" style="margin:6px 0 8px">Ukuran label</div><div class="tabs">' + ['kecil', 'sedang', 'besar'].map(function (u) { return '<button data-u="' + u + '" aria-selected="' + (st.ukuran === u) + '">' + u[0].toUpperCase() + u.slice(1) + '</button>'; }).join('') + '</div>' +
      '<label class="check" style="margin:6px 0"><input type="checkbox" id="lg" checked>Tampilkan logo &amp; nama sekolah</label><br><label class="check" style="margin:6px 0"><input type="checkbox" id="lk" checked>Tampilkan lokasi</label>' +
      '<div class="flabel" style="margin:14px 0 8px">Barang dipilih (<span id="nsel">0</span>)</div><div id="selList" style="max-height:340px;overflow:auto"></div>' +
      '<button class="btn btn-sm btn-ghost" id="clr" style="margin-top:8px">Kosongkan</button></div><div style="overflow:auto"><div id="prev"></div></div></div>';
    function lembar() {
      var u = UK[st.ukuran], per = u.kol * u.baris, items = sel.map(function (id) { return data.rows.filter(function (x) { return x.barangId === id; })[0]; }).filter(Boolean), html = '';
      $('#nsel', el).textContent = items.length;
      $('#selList', el).innerHTML = items.length ? items.map(function (x) { return '<div class="legend" style="margin-bottom:6px"><div><span><b class="code" style="font-size:12px">' + esc(x.kode) + '</b><br><span class="help">' + esc(x.nama) + '</span></span><button class="ib-btn" data-rm="' + esc(x.barangId) + '" aria-label="Hapus">' + ic('x', 'sm') + '</button></div></div>'; }).join('') : '<p class="help">Pilih barang di menu Inventaris (centang → Cetak Label QR), atau ketik kode di atas.</p>';
      $$('[data-rm]', el).forEach(function (b) { b.onclick = function () { sel = sel.filter(function (id) { return id !== b.dataset.rm; }); simpan(); lembar(); }; });
      for (var p = 0; p < Math.max(1, Math.ceil(items.length / per)); p++) {
        html += '<div class="sheet-a4" style="grid-template-columns:repeat(' + u.kol + ',1fr);margin-bottom:16px">' + items.slice(p * per, p * per + per).map(function (x) {
          return '<div class="lbl" style="height:' + Math.floor(277 / u.baris) + 'mm"><div class="q" style="width:' + u.qr + 'mm;height:' + u.qr + 'mm">' + qrSvg(x.kode, { margin: 1 }) + '</div><div class="tx">' +
            (st.logo ? '<div class="sch"><img src="assets/logo.png" alt="">SMA TRIGUNA 1956</div>' : '') + '<b style="font-size:' + (st.ukuran === 'kecil' ? 7 : st.ukuran === 'sedang' ? 9 : 12) + 'pt">' + esc(x.kode) + '</b>' +
            '<span style="font-size:' + (st.ukuran === 'kecil' ? 6 : st.ukuran === 'sedang' ? 7.5 : 10) + 'pt">' + esc(x.nama) + '</span>' + (st.lokasi ? '<div style="font-size:6.5pt;color:#555">' + esc(x.lokasi) + '</div>' : '') + '</div></div>';
        }).join('') + '</div>';
      }
      $('#prev', el).innerHTML = items.length ? html : S.empty('Belum ada barang dipilih', 'kotak');
    }
    function simpan() { try { sessionStorage.setItem('label_sel', JSON.stringify(sel)); } catch (e) {} }
    S.Store.load('inventaris.list', {}, { maxAge: 60000, onData: function (d) {
      data = d;
      $('#brgList', el).innerHTML = d.rows.filter(function (x) { return x.status !== 'NONAKTIF'; }).map(function (x) { return '<option value="' + esc(x.kode) + '">' + esc(x.nama) + '</option>'; }).join('');
      lembar();
    } });
    $('#cari', el).onkeydown = function (e) {
      if (e.key !== 'Enter') return; e.preventDefault();
      var q = this.value.trim().toUpperCase(), x = data && data.rows.filter(function (y) { return y.kode.toUpperCase() === q; })[0];
      if (!x && data) x = data.rows.filter(function (y) { return A.cocok(y.kode + ' ' + y.nama, q); })[0];
      if (!x) { S.toast('Barang tidak ditemukan.', 'warn'); return; }
      if (sel.indexOf(x.barangId) < 0) sel.push(x.barangId);
      this.value = ''; simpan(); lembar();
    };
    $$('[data-u]', el).forEach(function (b) { b.onclick = function () { st.ukuran = b.dataset.u; $$('[data-u]', el).forEach(function (y) { y.setAttribute('aria-selected', y === b); }); lembar(); }; });
    $('#lg', el).onchange = function () { st.logo = this.checked; lembar(); };
    $('#lk', el).onchange = function () { st.lokasi = this.checked; lembar(); };
    $('#clr', el).onclick = function () { sel = []; simpan(); lembar(); };
    $('#pr', el).onclick = function () {
      if (!sel.length) { S.toast('Pilih barang terlebih dahulu.', 'warn'); return; }
      $('#printArea').innerHTML = $('#prev', el).innerHTML;
      setTimeout(function () { W.print(); $('#printArea').innerHTML = ''; }, 80);
    };
  };

  // ============ MENU LAINNYA (HP) ============
  A.pages.menu = function (el) {
    el.innerHTML = A.head('Menu', '') + '<div class="grid-2">' + NAV.filter(function (n) { return !n.sec && bolehNav(n) && ['dashboard', 'transaksi', 'inventaris'].indexOf(n.id) < 0; }).map(function (n) {
      return '<a class="choice" style="min-height:96px;text-decoration:none;color:var(--ink)" href="#/' + n.id + '">' + ic(n.ic, 'lg') + esc(n.label) + '</a>';
    }).join('') + '<button class="choice c-bad" style="min-height:96px" id="out2">' + ic('logout', 'lg') + 'Keluar</button></div>';
    $('#out2', el).onclick = A.logout;
  };

  // ============ MULAI ============
  A.start = function () {
    var cache = null; try { cache = JSON.parse(localStorage.getItem('sar_user') || 'null'); } catch (e) {}
    if (S.Auth.token && cache) {
      A.user = cache.user; A.settings = cache.settings || {};
      kerangka(); route();
      S.api('auth.me', {}).then(function (r) {                       // validasi sesi di latar
        if (r.success) { A.user = r.data.user; A.settings = r.data.settings || {}; try { localStorage.setItem('sar_user', JSON.stringify(r.data)); } catch (e) {} }
      });
      S.warmUp('admin');
    } else halamanLogin();
  };
})(window);
