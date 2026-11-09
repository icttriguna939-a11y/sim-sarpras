/* =========================================================
   SIM-SARPRAS — xlsx-template.js
   Penulis file Excel (.xlsx) mandiri, khusus template dengan DROPDOWN (validasi data).
   Tidak butuh pustaka luar: XML OpenXML + ZIP (metode "store") dibuat langsung di browser.
   Dropdown merujuk ke sheet tersembunyi "DAFTAR" lewat nama terdefinisi (Excel, Google Sheets, LibreOffice).
   ========================================================= */
(function (W) {
  'use strict';
  var enc = new TextEncoder();
  var CRC = (function () { var t = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function x(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ''); }
  function kol(i) { var s = ''; i++; while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }

  /** ZIP tanpa kompresi. files: [{name, data:string}] → Uint8Array */
  function zip(files) {
    var parts = [], central = [], off = 0;
    function u16(v) { return [v & 255, (v >>> 8) & 255]; }
    function u32(v) { return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = enc.encode(f.data), crc = crc32(data);
      var head = [].concat(u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0));
      parts.push(new Uint8Array(head), name, data);
      central.push(new Uint8Array([].concat(u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length),
        u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(off))), name);
      off += head.length + name.length + data.length;
    });
    var cdSize = central.reduce(function (s, p) { return s + p.length; }, 0);
    var end = new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(cdSize), u32(off), u16(0)));
    var all = parts.concat(central, [end]), total = all.reduce(function (s, p) { return s + p.length; }, 0), out = new Uint8Array(total), p = 0;
    all.forEach(function (a) { out.set(a, p); p += a.length; });
    return out;
  }

  /**
   * Bangun workbook.
   * sheets: [{ name, hidden?, widths:[], header:[], rows:[[...]], freeze?, textCols:[idx], validations:[{col, list:'NAMA'|null, type:'list'|'whole', min, max, judul, pesan, prompt}] , maxRow }]
   * lists : { NAMA: [nilai...] } → ditulis ke sheet tersembunyi DAFTAR + nama terdefinisi L_NAMA
   */
  function buat(sheets, lists) {
    lists = lists || {};
    var namaList = Object.keys(lists);
    if (namaList.length) {
      var maxLen = Math.max.apply(null, namaList.map(function (k) { return lists[k].length; }));
      var rowsDaftar = [];
      for (var r = 0; r < maxLen; r++) rowsDaftar.push(namaList.map(function (k) { return lists[k][r] === undefined ? '' : lists[k][r]; }));
      sheets = sheets.concat([{ name: 'DAFTAR', hidden: true, header: namaList, rows: rowsDaftar, widths: namaList.map(function () { return 28; }) }]);
    }
    function cell(ref, v, s) {
      if (v === '' || v == null) return s ? '<c r="' + ref + '" s="' + s + '"/>' : '';
      if (typeof v === 'number') return '<c r="' + ref + '"' + (s ? ' s="' + s + '"' : '') + '><v>' + v + '</v></c>';
      return '<c r="' + ref + '" t="inlineStr"' + (s ? ' s="' + s + '"' : '') + '><is><t xml:space="preserve">' + x(v) + '</t></is></c>';
    }
    var sheetXml = sheets.map(function (sh) {
      var tc = sh.textCols || [], maxRow = sh.maxRow || 1000;
      var cols = (sh.widths || []).map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"' + (tc.indexOf(i) >= 0 ? ' style="2"' : '') + '/>'; }).join('');
      var data = '<row r="1"' + (sh.header ? ' ht="30" customHeight="1"' : '') + '>' + (sh.header || []).map(function (h, i) { return cell(kol(i) + '1', h, 1); }).join('') + '</row>';
      (sh.rows || []).forEach(function (row, ri) {
        data += '<row r="' + (ri + 2) + '">' + row.map(function (v, ci) { return cell(kol(ci) + (ri + 2), v, tc.indexOf(ci) >= 0 ? 2 : (sh.wrap ? 3 : 0)); }).join('') + '</row>';
      });
      var dv = (sh.validations || []).map(function (v) {
        var ref = kol(v.col) + '2:' + kol(v.col) + maxRow, attr = ' allowBlank="1" showErrorMessage="1" showInputMessage="1" errorStyle="stop"' +
          ' errorTitle="' + x(v.judul || 'Isian tidak valid') + '" error="' + x(v.pesan || 'Pilih dari daftar.') + '"' + (v.prompt ? ' promptTitle="' + x((v.judulPrompt || '').slice(0, 32)) + '" prompt="' + x(v.prompt.slice(0, 250)) + '"' : '');
        if (v.list) return '<dataValidation type="list"' + attr + ' sqref="' + ref + '"><formula1>L_' + v.list + '</formula1></dataValidation>';
        if (v.type === 'whole') return '<dataValidation type="whole" operator="between"' + attr + ' sqref="' + ref + '"><formula1>' + v.min + '</formula1><formula2>' + v.max + '</formula2></dataValidation>';
        if (v.type === 'teks') return '<dataValidation type="textLength" operator="between"' + attr + ' sqref="' + ref + '"><formula1>' + v.min + '</formula1><formula2>' + v.max + '</formula2></dataValidation>';
        return '';
      }).join('');
      return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        '<sheetViews><sheetView workbookViewId="0"' + (sh.hidden ? '' : '') + '>' + (sh.freeze ? '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/>' : '') + '</sheetView></sheetViews>' +
        '<sheetFormatPr defaultRowHeight="15"/>' + (cols ? '<cols>' + cols + '</cols>' : '') + '<sheetData>' + data + '</sheetData>' +
        (dv ? '<dataValidations count="' + (sh.validations || []).length + '">' + dv + '</dataValidations>' : '') +
        '<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/></worksheet>';
    });
    var defNames = namaList.map(function (k, i) { var n = Math.max(1, lists[k].length); return '<definedName name="L_' + k + '">DAFTAR!$' + kol(i) + '$2:$' + kol(i) + '$' + (n + 1) + '</definedName>'; }).join('');
    var files = [
      { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        sheets.map(function (s, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') +
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>' },
      { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>' },
      { name: 'docProps/core.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Template SIM-SARPRAS</dc:title><dc:creator>SIM-SARPRAS SMA Triguna 1956</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">' + new Date().toISOString().slice(0, 19) + 'Z</dcterms:created></cp:coreProperties>' },
      { name: 'xl/workbook.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="0"/></bookViews><sheets>' +
        sheets.map(function (s, i) { return '<sheet name="' + x(s.name) + '" sheetId="' + (i + 1) + '"' + (s.hidden ? ' state="hidden"' : '') + ' r:id="rId' + (i + 1) + '"/>'; }).join('') + '</sheets>' + (defNames ? '<definedNames>' + defNames + '</definedNames>' : '') + '</workbook>' },
      { name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        sheets.map(function (s, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') +
        '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
      { name: 'xl/styles.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        '<fonts count="2"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font></fonts>' +
        '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1E3A8A"/><bgColor indexed="64"/></patternFill></fill></fills>' +
        '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FF111111"/></left><right style="thin"><color rgb="FF111111"/></right><top style="thin"><color rgb="FF111111"/></top><bottom style="thin"><color rgb="FF111111"/></bottom><diagonal/></border></borders>' +
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
        '<cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
        '<xf numFmtId="49" fontId="1" fillId="2" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' +
        '<xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
        '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs>' +
        '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>' }
    ];
    sheetXml.forEach(function (s, i) { files.push({ name: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: s }); });
    return zip(files);
  }

  function unduh(namaFile, sheets, lists) {
    var bytes = buat(sheets, lists);
    var url = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })), a = document.createElement('a');
    a.href = url; a.download = namaFile; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    return Promise.resolve(true);
  }

  // ---------------- PEMBACA .xlsx (tanpa pustaka luar) ----------------
  function inflate(bytes) {
    var ds = new DecompressionStream('deflate-raw'), w = ds.writable.getWriter();
    w.write(bytes); w.close();
    return new Response(ds.readable).arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }
  function unzip(buf) {
    var u = new Uint8Array(buf), dv = new DataView(buf), eocd = -1;
    for (var i = u.length - 22; i >= Math.max(0, u.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) return Promise.reject(new Error('Bukan file .xlsx yang valid.'));
    var n = dv.getUint16(eocd + 10, true), p = dv.getUint32(eocd + 16, true), dec = new TextDecoder(), jobs = [];
    for (var k = 0; k < n; k++) {
      var method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nlen = dv.getUint16(p + 28, true), elen = dv.getUint16(p + 30, true),
          clen = dv.getUint16(p + 32, true), loff = dv.getUint32(p + 42, true), name = dec.decode(u.subarray(p + 46, p + 46 + nlen));
      var start = loff + 30 + dv.getUint16(loff + 26, true) + dv.getUint16(loff + 28, true), data = u.subarray(start, start + csize);
      jobs.push((function (name, method, data) {
        var pr = method === 0 ? Promise.resolve(data) : method === 8 ? inflate(data) : Promise.reject(new Error('Kompresi tidak didukung'));
        return pr.then(function (b) { return [name, dec.decode(b)]; });
      })(name, method, data));
      p += 46 + nlen + elen + clen;
    }
    return Promise.all(jobs).then(function (arr) { var o = {}; arr.forEach(function (a) { o[a[0].replace(/^\//, '')] = a[1]; }); return o; });
  }
  function xmlDoc(s) { return new DOMParser().parseFromString(s, 'application/xml'); }
  function byTag(el, t) { return Array.prototype.slice.call(el.getElementsByTagNameNS('*', t)); }
  function idxKol(ref) { var m = String(ref).match(/^([A-Z]+)/), c = 0; if (!m) return -1; for (var i = 0; i < m[1].length; i++) c = c * 26 + (m[1].charCodeAt(i) - 64); return c - 1; }
  /** ArrayBuffer .xlsx → { namaSheet: [ {judulKolom: teks} ] } — semua nilai dikembalikan sebagai teks. */
  function baca(buf) {
    return unzip(buf).then(function (f) {
      var wb = xmlDoc(f['xl/workbook.xml'] || ''), rels = {}, ss = [];
      byTag(xmlDoc(f['xl/_rels/workbook.xml.rels'] || '<x/>'), 'Relationship').forEach(function (r) { rels[r.getAttribute('Id')] = r.getAttribute('Target'); });
      if (f['xl/sharedStrings.xml']) byTag(xmlDoc(f['xl/sharedStrings.xml']), 'si').forEach(function (si) { ss.push(byTag(si, 't').map(function (t) { return t.textContent; }).join('')); });
      var out = {};
      byTag(wb, 'sheet').forEach(function (sh) {
        var rid = sh.getAttribute('r:id') || sh.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
        var target = String(rels[rid] || '').replace(/^\/?(xl\/)?/, ''), doc = f['xl/' + target];
        if (!doc) return;
        var grid = [];
        byTag(xmlDoc(doc), 'row').forEach(function (row) {
          var ri = Number(row.getAttribute('r')) - 1, arr = [];
          byTag(row, 'c').forEach(function (c, ci) {
            var col = c.getAttribute('r') ? idxKol(c.getAttribute('r')) : ci, t = c.getAttribute('t'), v = byTag(c, 'v')[0], val = '';
            if (t === 's') val = v ? ss[Number(v.textContent)] || '' : '';
            else if (t === 'inlineStr') val = byTag(c, 't').map(function (x) { return x.textContent; }).join('');
            else if (t === 'b') val = v && v.textContent === '1' ? 'TRUE' : 'FALSE';
            else if (v) { val = v.textContent; if (t !== 'str' && t !== 'e' && /^-?\d+(\.\d+)?(E[-+]?\d+)?$/i.test(val)) val = String(Number(val)); }
            arr[col] = val;
          });
          grid[ri >= 0 ? ri : grid.length] = arr;
        });
        var hi = -1;
        for (var i = 0; i < grid.length; i++) if (grid[i] && grid[i].filter(function (x) { return String(x || '').trim(); }).length) { hi = i; break; }
        if (hi < 0) { out[sh.getAttribute('name')] = []; return; }
        var head = grid[hi].map(function (x) { return String(x || '').trim(); }), rows = [];
        for (var r = hi + 1; r < grid.length; r++) {
          var g = grid[r] || [];
          if (!g.some(function (x) { return String(x || '').trim(); })) continue;
          var o = {};
          head.forEach(function (h, k) { if (h) o[h] = g[k] == null ? '' : g[k]; });
          rows.push(o);
        }
        out[sh.getAttribute('name')] = rows;
      });
      return out;
    });
  }

  W.XlsxTemplate = { buat: buat, unduh: unduh, baca: baca };
})(typeof window !== 'undefined' ? window : globalThis);
