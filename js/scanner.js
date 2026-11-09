/* =========================================================
   SIM-SARPRAS — scanner.js
   Kamera HP/laptop: BarcodeDetector bawaan (cepat) → cadangan html5-qrcode (dimuat saat perlu)
   Scanner USB/Bluetooth: dibaca sebagai ketikan cepat + Enter
   ========================================================= */
(function (W) {
  'use strict';
  var LIB = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
  var XLSX_LIB = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';

  function normalisasi(teks) {
    var s = String(teks || '').trim();
    var m = s.match(/[?&]k(?:ode)?=([^&#]+)/i);            // QR berisi URL → ambil parameter kode
    if (m) s = decodeURIComponent(m[1]);
    return s.toUpperCase();
  }

  var Scanner = {
    /** Mulai kamera di elemen box. onCode(kode). Mengembalikan kontrol { stop, flip, torch }. */
    start: function (box, onCode) {
      var stopped = false, last = '', lastAt = 0, stream = null, raf = null, h5 = null, facing = 'environment', track = null, torchOn = false;
      function emit(raw) {
        var k = normalisasi(raw), now = Date.now();
        if (!k || (k === last && now - lastAt < 2500)) return;
        last = k; lastAt = now; onCode(k);
      }
      function pesan(html) { var m = box.querySelector('.cam-msg'); if (m) m.innerHTML = html; else box.insertAdjacentHTML('beforeend', '<div class="cam-msg">' + html + '</div>'); }
      function bersihPesan() { var m = box.querySelector('.cam-msg'); if (m) m.remove(); }
      function gagal(err) {
        var txt = /Permission|NotAllowed|denied/i.test(String(err && (err.name || err.message || err))) ? 'Izin kamera ditolak. Izinkan kamera di pengaturan browser, atau ketik kode di bawah.'
          : /NotFound|Overconstrained|Requested device/i.test(String(err && (err.name || err))) ? 'Kamera tidak ditemukan di perangkat ini. Gunakan scanner USB atau ketik kode.'
          : !W.isSecureContext ? 'Kamera hanya bisa dipakai lewat HTTPS.' : 'Kamera belum bisa dibuka. Ketik kode barang di bawah.';
        pesan(SAR.ic('camera', 'lg') + '<span>' + txt + '</span><button class="btn btn-sm btn-yellow" data-retry>Coba lagi</button>');
        var b = box.querySelector('[data-retry]'); if (b) b.onclick = function () { ctl.stop(); stopped = false; mulai(); };
      }
      function mulaiNative() {
        var det = new W.BarcodeDetector({ formats: ['qr_code', 'code_128', 'code_39', 'ean_13'] });
        return navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }).then(function (s) {
          if (stopped) { s.getTracks().forEach(function (t) { t.stop(); }); return; }
          stream = s; track = s.getVideoTracks()[0];
          var v = document.createElement('video'); v.setAttribute('playsinline', ''); v.muted = true; v.srcObject = s;
          v.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;inset:0';
          box.querySelector('#reader').innerHTML = ''; box.querySelector('#reader').appendChild(v);
          return v.play().then(function () {
            bersihPesan();
            var sibuk = false, tAkhir = 0;
            function loop(t) {
              if (stopped) return;
              raf = requestAnimationFrame(loop);
              if (sibuk || t - tAkhir < 120 || v.readyState < 2) return;
              sibuk = true; tAkhir = t;
              det.detect(v).then(function (codes) { sibuk = false; if (codes && codes.length) emit(codes[0].rawValue); }, function () { sibuk = false; });
            }
            raf = requestAnimationFrame(loop);
          });
        });
      }
      function mulaiLib() {
        return SAR.loadScript(LIB).then(function () {
          if (stopped) return;
          h5 = new W.Html5Qrcode('reader', { verbose: false });
          return h5.start({ facingMode: facing }, { fps: 12, qrbox: function (w, hh) { var m = Math.floor(Math.min(w, hh) * 0.7); return { width: m, height: m }; }, aspectRatio: 1 },
            function (txt) { emit(txt); }, function () {}).then(function () { bersihPesan(); });
        });
      }
      function mulai() {
        pesan('<span class="spin" style="width:28px;height:28px;border-width:4px"></span><span>Menyalakan kamera…</span>');
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { gagal({ name: 'NotFound' }); return; }
        var p;
        if (W.BarcodeDetector) {
          p = W.BarcodeDetector.getSupportedFormats().then(function (f) { return f.indexOf('qr_code') >= 0 ? mulaiNative() : mulaiLib(); }).catch(mulaiLib);
        } else p = mulaiLib();
        p.catch(gagal);
      }
      var ctl = {
        stop: function () {
          stopped = true;
          if (raf) cancelAnimationFrame(raf);
          if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
          stream = null;
          if (h5) { try { h5.stop().then(function () { h5.clear(); }).catch(function () {}); } catch (e) {} h5 = null; }
        },
        flip: function () { facing = facing === 'environment' ? 'user' : 'environment'; ctl.stop(); stopped = false; mulai(); },
        torch: function () {
          if (!track || !track.getCapabilities || !track.getCapabilities().torch) { SAR.toast('Senter tidak didukung kamera ini.', 'info'); return; }
          torchOn = !torchOn; track.applyConstraints({ advanced: [{ torch: torchOn }] }).catch(function () {});
        }
      };
      mulai();
      return ctl;
    },

    /** Scanner USB/Bluetooth (keyboard wedge) di luar kolom isian. */
    wedge: function (onCode) {
      var buf = '', t = 0;
      function onKey(e) {
        var tag = (e.target && e.target.tagName) || '';
        if ((tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') && !e.target.hasAttribute('data-scan')) return;
        if (e.target.hasAttribute && e.target.hasAttribute('data-scan')) return;     // kolom scan menangani sendiri
        var now = Date.now();
        if (now - t > 80) buf = '';
        t = now;
        if (e.key === 'Enter') { if (buf.length >= 3) { onCode(normalisasi(buf)); e.preventDefault(); } buf = ''; return; }
        if (e.key.length === 1) buf += e.key;
      }
      document.addEventListener('keydown', onKey);
      return function () { document.removeEventListener('keydown', onKey); };
    },
    normalisasi: normalisasi
  };

  /* ---------- Excel (SheetJS dimuat saat dibutuhkan) ---------- */
  var Excel = {
    lib: function () { return SAR.loadScript(XLSX_LIB); },
    /** sheets: [{ name, rows:[{kolom:nilai}] | aoa:[[...]], widths:[], textCols:[] }] — ditulis tanpa pustaka luar (XlsxTemplate). */
    unduh: function (namaFile, sheets) {
      return Promise.resolve().then(function () {
        var conv = sheets.map(function (s) {
          var header, rows;
          if (s.aoa) { header = s.aoa[0] || []; rows = s.aoa.slice(1); }
          else { var list = s.rows || []; header = list.length ? Object.keys(list[0]) : ['(kosong)']; rows = list.map(function (r) { return header.map(function (h) { return r[h] == null ? '' : r[h]; }); }); }
          return { name: String(s.name).slice(0, 31), header: header, rows: rows, widths: s.widths || header.map(function () { return 16; }), textCols: s.textCols || [], freeze: true, wrap: s.wrap };
        });
        return W.XlsxTemplate.unduh(namaFile, conv);
      });
    },
    /** Baca file → { namaSheet: [ {header:nilai} ] } (nilai teks → 0 di depan tetap).
        .xlsx dibaca langsung di browser; .xls/.csv memakai SheetJS (dimuat dari CDN). */
    baca: function (file) {
      return file.arrayBuffer().then(function (buf) {
        if (/\.xlsx$/i.test(file.name) && W.DecompressionStream && W.XlsxTemplate) {
          return W.XlsxTemplate.baca(buf).catch(function () { return bacaSheetJS(buf); });
        }
        return bacaSheetJS(buf);
      });
      function bacaSheetJS(buf) {
        return Excel.lib().then(function () {
          var X = W.XLSX, wb = X.read(buf, { type: 'array', cellDates: true }), out = {};
          wb.SheetNames.forEach(function (n) { out[n] = X.utils.sheet_to_json(wb.Sheets[n], { defval: '', raw: false }); });
          return out;
        });
      }
    }
  };

  W.Scanner = Scanner;
  W.Excel = Excel;
})(window);
