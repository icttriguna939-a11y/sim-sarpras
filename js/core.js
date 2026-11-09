/* =========================================================
   SIM-SARPRAS — core.js
   API ke GAS (fetch text/plain) + dedupe + batch + cache lokal (SWR) + pengukur kinerja
   + ikon SVG + toast + modal + format tanggal
   ========================================================= */
(function (W) {
  'use strict';
  var CFG = W.SARPRAS_CONFIG || {};
  var GAS_URL = CFG.GAS_URL || '';
  var D = document;

  // ---------------- Utilitas ----------------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(sel, root) { return (root || D).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || D).querySelectorAll(sel)); }
  function h(html) { var t = D.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  var HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  var BLN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var BLS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  function dt(v) { if (!v) return null; var d = v instanceof Date ? v : new Date(v); return isNaN(d) ? null : d; }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  var fmt = {
    jam: function (v) { var d = dt(v); return d ? p2(d.getHours()) + '.' + p2(d.getMinutes()) : '-'; },
    tgl: function (v) { var d = dt(v); return d ? d.getDate() + ' ' + BLS[d.getMonth()] + ' ' + d.getFullYear() : '-'; },
    tglPanjang: function (v) { var d = dt(v); return d ? HARI[d.getDay()] + ', ' + d.getDate() + ' ' + BLN[d.getMonth()] + ' ' + d.getFullYear() : '-'; },
    tglJam: function (v) { var d = dt(v); return d ? d.getDate() + ' ' + BLS[d.getMonth()] + ' ' + p2(d.getHours()) + '.' + p2(d.getMinutes()) : '-'; },
    iso: function (d) { d = d || new Date(); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); },
    durasi: function (ms) { var m = Math.max(0, Math.round(ms / 60000)); if (m < 60) return m + 'm'; var j = Math.floor(m / 60); return j + 'j ' + (m % 60) + 'm'; },
    angka: function (n) { return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); },
    inisial: function (s) { return String(s || '?').replace(/^(drs?|dr|ir|hj?|prof)\.?\s+/i, '').split(/\s+/).slice(0, 2).map(function (w) { return w[0] || ''; }).join('').toUpperCase(); },
    BLN: BLN, BLS: BLS
  };

  // ---------------- Ikon (SVG garis, 24×24) ----------------
  var P = {
    home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
    dash: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
    swap: 'M7 7h13l-4-4M17 17H4l4 4',
    box: 'M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8',
    qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2M14 18h2v2M18 18h2v2h-2zM6.5 6.5h1M16.5 6.5h1M6.5 16.5h1',
    tag: 'M20 12 12 20 3 11V3h8zM7.5 7.5h.01',
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
    user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
    search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
    bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
    back: 'M19 12H5M12 19l-7-7 7-7',
    arrowUR: 'M7 17 17 7M7 7h10v10',
    arrowDL: 'M17 7 7 17M17 17H7V7',
    clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
    cal: 'M3 5h18v16H3zM16 3v4M8 3v4M3 10h18',
    check: 'M20 6 9 17l-5-5',
    checkc: 'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3',
    x: 'M18 6 6 18M6 6l12 12',
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
    eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    eyeoff: 'M17.9 17.9A10 10 0 0 1 12 20c-7 0-11-8-11-8a18 18 0 0 1 5.1-5.9M9.9 4.2A9 9 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.2 3.2M1 1l22 22M14.1 14.1a3 3 0 1 1-4.2-4.2',
    trash: 'M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2',
    print: 'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
    download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
    upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
    file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
    key: 'M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4',
    camera: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    flash: 'M13 2 3 14h9l-1 8 10-12h-9z',
    flip: 'M3 7h13a4 4 0 0 1 4 4M21 17H8a4 4 0 0 1-4-4M17 3l4 4-4 4M7 21l-4-4 4-4',
    alert: 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01',
    info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
    refresh: 'M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15',
    chart: 'M3 3v18h18M7 15l4-4 3 3 6-6',
    db: 'M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3zM4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
    map: 'M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    pen: 'M12 19l7-7 3 3-7 7zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18zM2 2l7.6 7.6M11 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    menu: 'M3 12h18M3 6h18M3 18h18',
    more: 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
    wrench: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z',
    thumb: 'M7 10v12M15 5.9 14 10h5.8a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 18.4 22H7V10l4-8a3 3 0 0 1 3 3.1z',
    puzzle: 'M19.4 14.6a2.5 2.5 0 1 0 0-5H18V6a2 2 0 0 0-2-2h-3.5v-.5a2.5 2.5 0 1 0-5 0V4H4a2 2 0 0 0-2 2v3.5h.5a2.5 2.5 0 1 1 0 5H2V18a2 2 0 0 0 2 2h3.5v-.5a2.5 2.5 0 1 1 5 0v.5H16a2 2 0 0 0 2-2v-3.4z',
    list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
    layers: 'M12 2 2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8',
    wifi: 'M5 12.6a10 10 0 0 1 14 0M8.5 16.1a5 5 0 0 1 7 0M2 8.8a15 15 0 0 1 20 0M12 20h.01',
    lock: 'M5 11h14v10H5zM8 11V7a4 4 0 1 1 8 0v4',
    scan: 'M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10',
    excel: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 12l4 6M12 12l-4 6',
    move: 'M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20'
  };
  function ic(name, cls) { return '<svg class="ico ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (P[name] || P.info) + '"/></svg>'; }

  /** Maskot kartun orisinal (barang sekolah berwajah) untuk tile & empty state. */
  var MASKOT = {
    proyektor: '<svg viewBox="0 0 120 100" class="mascot"><rect x="10" y="22" width="92" height="56" rx="16" fill="#fff" stroke="#111" stroke-width="5"/><circle cx="78" cy="50" r="17" fill="#A7D8F0" stroke="#111" stroke-width="5"/><circle cx="78" cy="50" r="7" fill="#1E3A8A"/><circle cx="32" cy="44" r="5" fill="#111"/><circle cx="50" cy="44" r="5" fill="#111"/><path d="M32 58q9 8 18 0" stroke="#111" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="24" cy="56" r="4" fill="#F9C6E8"/><rect x="24" y="78" width="12" height="12" rx="3" fill="#111"/><rect x="76" y="78" width="12" height="12" rx="3" fill="#111"/></svg>',
    kotak: '<svg viewBox="0 0 120 100" class="mascot"><path d="M14 34q0-10 10-10h72q10 0 10 10v42q0 10-10 10H24q-10 0-10-10z" fill="#FFF8E7" stroke="#111" stroke-width="5"/><path d="M14 36l46 22 46-22" fill="none" stroke="#111" stroke-width="5"/><path d="M40 24l20-14 20 14" fill="#FBC02D" stroke="#111" stroke-width="5" stroke-linejoin="round"/><circle cx="46" cy="66" r="5" fill="#111"/><circle cx="74" cy="66" r="5" fill="#111"/><path d="M52 76q8 6 16 0" stroke="#111" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M8 50q-6 6 0 14M112 50q6 6 0 14" stroke="#111" stroke-width="5" fill="none" stroke-linecap="round"/></svg>',
    cari: '<svg viewBox="0 0 120 100" class="mascot"><circle cx="50" cy="44" r="30" fill="#A7D8F0" stroke="#111" stroke-width="5"/><path d="M72 66l26 26" stroke="#111" stroke-width="9" stroke-linecap="round"/><circle cx="40" cy="40" r="4.5" fill="#111"/><circle cx="60" cy="40" r="4.5" fill="#111"/><path d="M42 56q8-6 16 0" stroke="#111" stroke-width="4" fill="none" stroke-linecap="round"/></svg>',
    sukses: '<svg viewBox="0 0 120 120" class="mascot"><circle cx="60" cy="60" r="50" fill="#BDE7C9" stroke="#111" stroke-width="6"/><path d="M36 62l16 16 32-34" stroke="#111" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="28" cy="36" r="5" fill="#FBC02D" stroke="#111" stroke-width="3"/><circle cx="96" cy="88" r="6" fill="#F9C6E8" stroke="#111" stroke-width="3"/></svg>',
    dokumen: '<svg viewBox="0 0 120 100" class="mascot"><path d="M30 8h44l20 20v62a4 4 0 0 1-4 4H30a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z" fill="#fff" stroke="#111" stroke-width="5"/><path d="M74 8v20h20" fill="#FBC02D" stroke="#111" stroke-width="5" stroke-linejoin="round"/><circle cx="50" cy="52" r="4.5" fill="#111"/><circle cx="70" cy="52" r="4.5" fill="#111"/><path d="M52 66q8 6 16 0" stroke="#111" stroke-width="4" fill="none" stroke-linecap="round"/></svg>'
  };

  // ---------------- Pengukur kinerja (console: Perf.table()) ----------------
  var Perf = {
    log: [],
    add: function (a, total, server, cached) { this.log.push({ aksi: a, total: total, server: server || 0, net: Math.max(0, total - (server || 0)), cache: cached ? '✓' : '' }); if (this.log.length > 200) this.log.shift(); },
    table: function () { console.table(this.log.slice(-40)); },
    summary: function () { var m = {}; this.log.forEach(function (x) { var s = m[x.aksi] || (m[x.aksi] = { n: 0, total: 0, server: 0 }); s.n++; s.total += x.total; s.server += x.server; });
      Object.keys(m).forEach(function (k) { m[k].rata = Math.round(m[k].total / m[k].n) + ' ms'; m[k].server = Math.round(m[k].server / m[k].n) + ' ms'; delete m[k].total; }); console.table(m); }
  };

  // ---------------- API ----------------
  var READ = /^(public\.(boot|peminjam|verifikasi)|dashboard\.|transaksi\.list|inventaris\.(list|history)|master\.list|peminjam\.list|users\.list|settings\.get|doc\.(templates|list|detail)|log\.list|system\.status|auth\.me|batch)$/;
  var _inflight = {}, _epoch = 0, Auth = { token: '', onExpired: null };
  try { Auth.token = localStorage.getItem('sar_token') || ''; } catch (e) {}

  function apiRaw(action, data, opt) {
    opt = opt || {};
    if (!GAS_URL || GAS_URL.indexOf('GANTI_') >= 0) return Promise.resolve({ success: false, code: 'CONFIG', message: 'URL server belum diatur di js/config.js.' });
    var t0 = performance.now(), ctl = W.AbortController ? new AbortController() : null;
    var to = setTimeout(function () { if (ctl) ctl.abort(); }, opt.timeout || 45000);
    var body = JSON.stringify({ action: action, data: data || {}, token: Auth.token || undefined });
    function once() {
      return fetch(GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: body, redirect: 'follow', signal: ctl ? ctl.signal : undefined })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
    }
    var p = once().catch(function (err) {
      if (!READ.test(action) || (err && err.name === 'AbortError')) throw err;
      return new Promise(function (res) { setTimeout(res, 700); }).then(once);   // baca: coba ulang 1×
    });
    return p.then(function (res) {
      clearTimeout(to);
      Perf.add(action, Math.round(performance.now() - t0), res.ms, res.cached);
      if (res && res.code === 'AUTH' && Auth.onExpired) Auth.onExpired(res.message);
      return res;
    }, function (err) {
      clearTimeout(to);
      var off = !navigator.onLine;
      return { success: false, code: 'NET', message: off ? 'Perangkat sedang offline. Periksa koneksi internet.' : (err && err.name === 'AbortError' ? 'Server terlalu lama merespons. Coba lagi.' : 'Tidak dapat terhubung ke server. Coba lagi.') };
    });
  }

  /** Baca identik yang sedang berjalan menumpang; tulis menaikkan epoch (agar baca setelah simpan tidak memakai hasil lama). */
  function api(action, data, opt) {
    if (!READ.test(action)) { _epoch++; return apiRaw(action, data, opt); }
    var k = _epoch + '|' + action + '|' + JSON.stringify(data || {});
    if (_inflight[k]) return _inflight[k];
    var p = apiRaw(action, data, opt);
    _inflight[k] = p;
    p.then(function () { delete _inflight[k]; }, function () { delete _inflight[k]; });
    return p;
  }

  /** Penggabung batch: beberapa baca di tik yang sama → 1 eksekusi server. */
  var Batcher = {
    q: null,
    add: function (action, data) {
      var self = this;
      return new Promise(function (res) {
        if (!self.q) { self.q = []; setTimeout(function () { self.flush(); }, 0); }
        self.q.push({ action: action, data: data || {}, res: res });
      });
    },
    flush: function () {
      var q = this.q || []; this.q = null;
      if (!q.length) return;
      if (q.length === 1) { api(q[0].action, q[0].data).then(q[0].res); return; }
      for (var i = 0; i < q.length; i += 10) (function (chunk) {
        api('batch', { calls: chunk.map(function (c) { return { action: c.action, data: c.data }; }) }).then(function (r) {
          chunk.forEach(function (c, j) { c.res(r.success && r.data ? r.data[j] : r); });
        });
      })(q.slice(i, i + 10));
    }
  };
  function apiQ(action, data) { return Auth.token ? Batcher.add(action, data) : api(action, data); }

  // ---------------- Cache lokal SWR ----------------
  var Store = {
    key: function (a, d) { return 'sw:' + a + ':' + JSON.stringify(d || {}); },
    read: function (k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    write: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { try { Store.clear(); localStorage.setItem(k, JSON.stringify(v)); } catch (e2) {} } },
    clear: function () { try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf('sw:') === 0) localStorage.removeItem(k); }); } catch (e) {} },
    /** Render dari cache dulu, lalu segarkan bila lebih tua dari maxAge (ms). onData(data, dariCache). */
    load: function (action, data, opt) {
      opt = opt || {};
      var k = Store.key(action, data), c = Store.read(k), now = Date.now();
      if (c && opt.onData) opt.onData(c.data, true);
      if (c && !opt.force && !c.stale && now - c.t < (opt.maxAge || 30000)) return Promise.resolve(c.data);
      var payload = Object.assign({}, data || {});
      if (c && c.ver && !opt.force) payload.have = c.ver;
      if (opt.force) payload._fresh = true;
      var call = opt.batch === false ? api(action, payload) : apiQ(action, payload);
      return call.then(function (r) {
        if (r && r.success && r.same && c) { c.t = Date.now(); c.stale = false; Store.write(k, c); return c.data; }
        if (r && r.success) {
          var berubah = !c || JSON.stringify(c.data) !== JSON.stringify(r.data);
          Store.write(k, { t: Date.now(), ver: r.ver || '', data: r.data });
          if (opt.onData && berubah) opt.onData(r.data, false);
          return r.data;
        }
        if (opt.onError) opt.onError(r);
        else if (!c) toast(r.message || 'Gagal memuat data.', 'error');
        return c ? c.data : null;
      });
    },
    /** Tandai cache basi (setelah menyimpan). prefixes: daftar nama aksi. */
    stale: function (prefixes) {
      try { Object.keys(localStorage).forEach(function (k) {
        if (k.indexOf('sw:') !== 0) return;
        if (!prefixes || prefixes.some(function (p) { return k.indexOf('sw:' + p) === 0; })) { var c = Store.read(k); if (c) { c.stale = true; Store.write(k, c); } }
      }); } catch (e) {}
    }
  };

  /** Pemanas server: GET ?w=… mode no-cors, maks 1×/4 menit per lingkup. */
  function warmUp(scope) {
    if (!GAS_URL || GAS_URL.indexOf('GANTI_') >= 0) return;
    var k = 'warm_' + scope, last = Number(sessionStorage.getItem(k) || 0);
    if (Date.now() - last < 240000) return;
    sessionStorage.setItem(k, String(Date.now()));
    try { fetch(GAS_URL + '?w=' + encodeURIComponent(scope), { mode: 'no-cors' }).catch(function () {}); } catch (e) {}
  }

  // ---------------- UI: toast, modal, konfirmasi ----------------
  function toast(msg, type, ms) {
    var box = $('.toasts') || D.body.appendChild(h('<div class="toasts" role="status" aria-live="polite"></div>'));
    var t = h('<div class="toast ' + (type || '') + '">' + ic(type === 'error' ? 'alert' : type === 'warn' ? 'alert' : type === 'info' ? 'info' : 'checkc') + '<span>' + esc(msg) + '</span></div>');
    box.appendChild(t);
    setTimeout(function () { t.style.transition = 'opacity .25s, transform .25s'; t.style.opacity = '0'; t.style.transform = 'translateY(-8px)'; setTimeout(function () { t.remove(); }, 260); }, ms || (type === 'error' ? 5000 : 3000));
  }

  var _modalStack = [];
  function modal(opt) {
    var ov = h('<div class="overlay" role="dialog" aria-modal="true"></div>');
    var cls = opt.drawer ? 'drawer' : 'modal' + (opt.wide ? ' wide' : '');
    var box = h('<div class="' + cls + '"><div class="modal-head"><h3 class="h3">' + esc(opt.title || '') + '</h3><button class="ib-btn" data-x aria-label="Tutup">' + ic('x', 'sm') + '</button></div>' +
      '<div class="modal-body">' + (opt.body || '') + '</div>' + (opt.foot ? '<div class="modal-foot">' + opt.foot + '</div>' : '') + '</div>');
    if (opt.drawer) { ov.style.justifyContent = 'flex-end'; ov.style.padding = '0'; }
    ov.appendChild(box); D.body.appendChild(ov);
    var api_ = { el: box, ov: ov, close: function () { ov.remove(); _modalStack = _modalStack.filter(function (m) { return m !== api_; }); D.removeEventListener('keydown', onKey); if (opt.onClose) opt.onClose(); } };
    function onKey(e) { if (e.key === 'Escape' && _modalStack[_modalStack.length - 1] === api_) api_.close(); }
    D.addEventListener('keydown', onKey);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov && !opt.sticky) api_.close(); });
    box.querySelector('[data-x]').onclick = api_.close;
    _modalStack.push(api_);
    setTimeout(function () {                         // fokus awal — jangan merebut fokus bila pengguna sudah mengetik di kolom lain
      if (opt.noFocus || box.contains(document.activeElement)) return;
      var f = box.querySelector('[autofocus],input:not([type=hidden]),select,textarea'); if (f) f.focus();
    }, 30);
    return api_;
  }

  /** Konfirmasi (opsional dengan isian). Mengembalikan Promise<string|true|null>. */
  function ask(title, msg, o) {
    o = o || {};
    return new Promise(function (res) {
      var inp = o.input ? '<div class="field" style="margin-top:14px"><label>' + esc(o.input) + (o.required ? ' <span class="req">*</span>' : '') + '</label>' +
        (o.multiline ? '<textarea class="textarea" id="askIn" placeholder="' + esc(o.placeholder || '') + '"></textarea>' : '<input class="input" id="askIn" type="' + (o.type || 'text') + '" placeholder="' + esc(o.placeholder || '') + '" ' + (o.attrs || '') + '>') + '<div class="ferr hidden" id="askErr"></div></div>' : '';
      var m = modal({ title: title, body: '<p style="margin:0">' + msg + '</p>' + inp,
        foot: '<button class="btn" data-no>Batal</button><button class="btn ' + (o.danger ? 'btn-danger' : 'btn-navy') + '" data-ok>' + esc(o.ok || 'Ya, lanjutkan') + '</button>', onClose: function () { res(null); } });
      m.el.querySelector('[data-no]').onclick = function () { m.close(); };
      m.el.querySelector('[data-ok]').onclick = function () {
        if (o.input) {
          var v = m.el.querySelector('#askIn').value.trim(), err = m.el.querySelector('#askErr');
          if (o.required && v.length < (o.min || 1)) { err.textContent = o.minMsg || 'Wajib diisi.'; err.classList.remove('hidden'); return; }
          var rr = res; res = function () {}; m.close(); rr(v); return;
        }
        var r2 = res; res = function () {}; m.close(); r2(true);
      };
      if (o.input) m.el.querySelector('#askIn').addEventListener('keydown', function (e) { if (e.key === 'Enter' && !o.multiline) m.el.querySelector('[data-ok]').click(); });
    });
  }

  /** Tombol jadi status memuat selama promise berjalan. */
  function busy(btn, promise, label) {
    if (!btn) return promise;
    var old = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spin"></span>' + esc(label || 'Memproses…');
    return Promise.resolve(promise).then(function (r) { btn.disabled = false; btn.innerHTML = old; return r; }, function (e) { btn.disabled = false; btn.innerHTML = old; throw e; });
  }

  function badge(st, label) { return '<span class="badge st-' + esc(st) + '">' + esc(label || ({ TERSEDIA: 'Tersedia', DIPINJAM: 'Dipinjam', RUSAK: 'Rusak', NONAKTIF: 'Nonaktif', TERLAMBAT: 'Terlambat', AKTIF: 'Aktif', SELESAI: 'Selesai', BAIK: 'Baik', LENGKAP: 'Lengkap', TIDAK_LENGKAP: 'Tdk Lengkap', UNIT: 'Unit', STOK: 'Stok', SISWA: 'Siswa', GURU: 'Guru', TERBIT: 'Terbit', DRAF: 'Draf', MENUNGGU_TTD: 'Menunggu TTD', DITARIK: 'Ditarik', DITOLAK: 'Ditolak', SUPER_ADMIN: 'Super Admin', ADMIN_SARPRAS: 'Admin Sarpras', KEPALA_SEKOLAH: 'Kepala Sekolah' })[st] || st) + '</span>'; }

  function skeleton(rows) { var s = ''; for (var i = 0; i < (rows || 4); i++) s += '<div class="skel" style="height:' + (i ? 44 : 18) + 'px;margin:10px 0;width:' + (i ? 100 : 40) + '%"></div>'; return s; }
  function empty(msg, mascot, cta) { return '<div class="empty">' + (MASKOT[mascot || 'cari'] || '') + '<b style="color:var(--ink)">' + esc(msg) + '</b>' + (cta || '') + '</div>'; }

  /** Unduh base64 sebagai berkas. */
  function downloadB64(b64, nama, mime) {
    var bin = atob(b64), arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    var url = URL.createObjectURL(new Blob([arr], { type: mime || 'application/octet-stream' })), a = D.createElement('a');
    a.href = url; a.download = nama || 'berkas'; D.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  function openB64(b64, mime) {
    var bin = atob(b64), arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    var url = URL.createObjectURL(new Blob([arr], { type: mime || 'application/pdf' }));
    var w = W.open(url, '_blank'); if (!w) downloadB64(b64, 'pratinjau.pdf', mime);
  }

  /** Muat skrip eksternal sekali (pustaka CDN dipakai hanya saat dibutuhkan). */
  var _scripts = {};
  function loadScript(src) {
    if (_scripts[src]) return _scripts[src];
    _scripts[src] = new Promise(function (res, rej) { var s = D.createElement('script'); s.src = src; s.async = true; s.onload = res; s.onerror = function () { delete _scripts[src]; rej(new Error('Gagal memuat ' + src)); }; D.head.appendChild(s); });
    return _scripts[src];
  }

  /** Bunyi & getar umpan balik scan. */
  var _ac = null;
  function beep(ok) {
    try {
      _ac = _ac || new (W.AudioContext || W.webkitAudioContext)();
      var o = _ac.createOscillator(), g = _ac.createGain();
      o.type = 'square'; o.frequency.value = ok ? 1250 : 220; g.gain.value = 0.06;
      o.connect(g); g.connect(_ac.destination); o.start(); o.stop(_ac.currentTime + (ok ? 0.09 : 0.25));
    } catch (e) {}
    try { if (navigator.vibrate) navigator.vibrate(ok ? 60 : [80, 60, 80]); } catch (e) {}
  }

  W.SAR = { CFG: CFG, esc: esc, $: $, $$: $$, h: h, fmt: fmt, ic: ic, MASKOT: MASKOT, api: api, apiQ: apiQ, Auth: Auth, Store: Store, Perf: Perf,
            warmUp: warmUp, toast: toast, modal: modal, ask: ask, busy: busy, badge: badge, skeleton: skeleton, empty: empty,
            downloadB64: downloadB64, openB64: openB64, loadScript: loadScript, beep: beep };
  W.Perf = Perf;
})(window);
