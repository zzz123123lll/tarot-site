// tools/exif-clean.mjs — 照片去信息(EXIF / GPS / 拍摄信息清理)
// 为什么做:调研里有一条原话 ——"去 EXIF 的在线工具大多要求上传图片,对隐私任务来说有点讽刺"。
// 这类工具的全部意义就是"别让别人拿到这张图",却要先把原图交出去。这里全程在本机做。
// 与同类不同的两点:
//   1) 默认无损 —— 只摘掉信息段,图像的压缩数据逐字节保留:不重新编码、不掉画质、不发白;
//   2) 方向标记(Orientation)单独留成一段最小 EXIF —— 否则竖拍照片会躺倒显示(很多工具在这儿翻车)。
// 删完不是"说一声就完了":输出会被再扫一遍(证明信息段确实没了)、图像数据与原图逐字节比对、
// 再解码一次确认还能打开且尺寸没变 —— 三条自检结果直接显示在卡片上。

// ---------- 基础工具 ----------
var TYPE_SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 };
var TAGS_IFD0 = { 0x010E: 'ImageDescription', 0x010F: 'Make', 0x0110: 'Model', 0x0112: 'Orientation', 0x0131: 'Software', 0x0132: 'DateTime', 0x013B: 'Artist', 0x8298: 'Copyright', 0x8769: '__exif', 0x8825: '__gps' };
var TAGS_EXIF = { 0x8827: 'ISOSpeedRatings', 0x9003: 'DateTimeOriginal', 0x9004: 'DateTimeDigitized', 0x9286: 'UserComment', 0xA002: 'PixelXDimension', 0xA003: 'PixelYDimension', 0xA420: 'ImageUniqueID', 0xA430: 'CameraOwnerName', 0xA431: 'BodySerialNumber', 0xA434: 'LensModel', 0xA435: 'LensSerialNumber' };
var TAGS_GPS = { 0x0001: 'GPSLatitudeRef', 0x0002: 'GPSLatitude', 0x0003: 'GPSLongitudeRef', 0x0004: 'GPSLongitude', 0x0005: 'GPSAltitudeRef', 0x0006: 'GPSAltitude', 0x0007: 'GPSTimeStamp', 0x001D: 'GPSDateStamp' };

function asciiAt(u8, off, len) {
  var s = '';
  for (var i = 0; i < len && off + i < u8.length; i++) {
    var c = u8[off + i];
    if (c === 0) break;
    s += String.fromCharCode(c);
  }
  return s.replace(/[\u0000-\u001f]+/g, ' ').trim();
}

// EXIF 里的文本字段名义上是 ASCII,但中文手机/软件常往里写 UTF-8(作者、机主、备注)。
// 只看字节当 Latin-1 会变成乱码,所以有高位字节时先按 UTF-8 试。
function textAt(u8, off, len) {
  var end = Math.min(off + len, u8.length), hi = false;
  for (var i = off; i < end; i++) { if (u8[i] >= 0x80) { hi = true; break; } }
  if (hi && typeof TextDecoder !== 'undefined') {
    try {
      var s = new TextDecoder('utf-8', { fatal: false }).decode(u8.subarray(off, end));
      if (s.indexOf('\uFFFD') < 0) return s.replace(/[\u0000-\u001f]+/g, ' ').trim();
    } catch (e) { /* 解不了就退回下面 */ }
  }
  return asciiAt(u8, off, len);
}

// 32 位 FNV-1a:用来证明"这段字节没被动过"
function fnv1a(u8, from, to) {
  var h = 0x811c9dc5;
  for (var i = from; i < to; i++) { h ^= u8[i]; h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}

// ---------- EXIF(TIFF)解析 ----------
function parseTiff(u8, base) {
  var out = { fields: {}, gps: null, hasThumb: false };
  if (!u8 || base < 0 || base + 8 > u8.length) return out;
  var bo = (u8[base] << 8) | u8[base + 1];
  if (bo !== 0x4949 && bo !== 0x4D4D) return out;
  var le = bo === 0x4949;
  var dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  function u16(o) { return dv.getUint16(o, le); }
  function u32(o) { return dv.getUint32(o, le); }
  if (u16(base + 2) !== 42) return out;
  var visited = {};
  function readIfd(off, tags, target, depth) {
    if (!off || depth > 2 || visited[off]) return 0;
    visited[off] = 1;
    var at = base + off;
    if (at + 2 > u8.length) return 0;
    var n = u16(at);
    if (n < 1 || n > 400 || at + 2 + n * 12 + 4 > u8.length) return 0;
    for (var k = 0; k < n; k++) {
      var e = at + 2 + k * 12;
      var tag = u16(e), type = u16(e + 2), cnt = u32(e + 4);
      var ts = TYPE_SIZE[type] || 0;
      if (!ts || cnt > 200000) continue;
      var name = tags[tag];
      if (!name) continue;
      var size = ts * cnt;
      var dOff = size > 4 ? base + u32(e + 8) : e + 8;
      if (name === '__exif') { readIfd(type === 3 ? u16(e + 8) : u32(e + 8), TAGS_EXIF, out.fields, depth + 1); continue; }
      if (name === '__gps') { var g = {}; readIfd(type === 3 ? u16(e + 8) : u32(e + 8), TAGS_GPS, g, depth + 1); out.gps = g; continue; }
      if (dOff + size > u8.length) continue;
      if (type === 2) { target[name] = textAt(u8, dOff, cnt); }
      else if (type === 5 || type === 10) {
        var rats = [];
        for (var i2 = 0; i2 < cnt && i2 < 8; i2++) {
          var num = type === 5 ? u32(dOff + i2 * 8) : dv.getInt32(dOff + i2 * 8, le);
          var den = type === 5 ? u32(dOff + i2 * 8 + 4) : dv.getInt32(dOff + i2 * 8 + 4, le);
          rats.push([num, den]);
        }
        target[name] = cnt === 1 ? rats[0] : rats;
      }
      else if (type === 7) { target[name] = { off: dOff, raw: cnt }; }
      else {
        var vals = [];
        for (var j = 0; j < cnt && j < 8; j++) {
          vals.push(type === 3 || type === 8 ? u16(dOff + j * 2) : (type === 4 || type === 11 ? u32(dOff + j * 4) : (type === 1 || type === 6 ? u8[dOff + j] : dv.getInt32(dOff + j * 4, le))));
        }
        target[name] = cnt === 1 ? vals[0] : vals;
      }
    }
    return u32(at + 2 + n * 12);
  }
  var next = readIfd(u32(base + 4), TAGS_IFD0, out.fields, 0);
  if (next) out.hasThumb = true;
  return out;
}

function rat(v) {
  if (!v || !v.length) return null;
  var den = v[1] || 0;
  if (!den) return null;
  return v[0] / den;
}

function dms(v) {
  if (!v || v.length < 3) return null;
  var d = rat(v[0]), m = rat(v[1]), s = rat(v[2]);
  if (d == null || m == null || s == null) return null;
  return d + m / 60 + s / 3600;
}

function gpsCoords(g) {
  if (!g) return null;
  var lat = dms(g.GPSLatitude), lon = dms(g.GPSLongitude);
  if (lat == null || lon == null) return null;
  var ns = String(g.GPSLatitudeRef || 'N').toUpperCase().charAt(0);
  var ew = String(g.GPSLongitudeRef || 'E').toUpperCase().charAt(0);
  if (ns === 'S') lat = -lat;
  if (ew === 'W') lon = -lon;
  var alt = rat(g.GPSAltitude);
  return { lat: lat, lon: lon, alt: alt, text: lat.toFixed(5) + ', ' + lon.toFixed(5) + (alt != null ? '(海拔约 ' + Math.round(alt) + ' 米)' : '') };
}

function userComment(u8, v) {
  if (!v || typeof v.off !== 'number') return '';
  var head = asciiAt(u8, v.off, Math.min(8, v.raw));
  if (/^UNICODE/i.test(head)) {
    var s = '';
    for (var i = 8; i + 1 < v.raw; i += 2) {
      var c = (u8[v.off + i] << 8) | u8[v.off + i + 1];
      if (!c) break;
      s += String.fromCharCode(c);
    }
    return s.trim().slice(0, 200);
  }
  return asciiAt(u8, v.off + (head.length ? 8 : 0), v.raw).slice(0, 200);
}

// EXIF 字段 → 用户看得懂的清单
function exifItems(u8, t, info) {
  var items = [];
  var g = gpsCoords(t.gps);
  if (g) items.push({ label: 'GPS 位置', value: g.text, risk: 'high', copy: g.lat + ',' + g.lon });
  else if (t.gps && Object.keys(t.gps).length) items.push({ label: 'GPS 信息', value: '存在(坐标读不出完整数值)', risk: 'high' });
  if (t.fields.DateTimeOriginal) items.push({ label: '拍摄时间', value: t.fields.DateTimeOriginal, risk: 'mid' });
  else if (t.fields.DateTime) items.push({ label: '文件时间', value: t.fields.DateTime, risk: 'mid' });
  var dev = [t.fields.Make, t.fields.Model].filter(Boolean).join(' ');
  if (dev) items.push({ label: '拍摄设备', value: dev, risk: 'mid' });
  if (t.fields.BodySerialNumber) items.push({ label: '机身序列号', value: String(t.fields.BodySerialNumber), risk: 'high' });
  if (t.fields.LensModel) items.push({ label: '镜头', value: String(t.fields.LensModel), risk: 'low' });
  if (t.fields.LensSerialNumber) items.push({ label: '镜头序列号', value: String(t.fields.LensSerialNumber), risk: 'high' });
  if (t.fields.CameraOwnerName) items.push({ label: '相机机主', value: String(t.fields.CameraOwnerName), risk: 'high' });
  if (t.fields.Software) items.push({ label: '处理软件', value: String(t.fields.Software), risk: 'low' });
  if (t.fields.Artist) items.push({ label: '作者', value: String(t.fields.Artist), risk: 'mid' });
  if (t.fields.Copyright) items.push({ label: '版权', value: String(t.fields.Copyright), risk: 'low' });
  if (t.fields.ImageUniqueID) items.push({ label: '图像唯一编号', value: String(t.fields.ImageUniqueID), risk: 'mid' });
  var uc = userComment(u8, t.fields.UserComment);
  if (uc) items.push({ label: '用户备注', value: uc, risk: 'mid' });
  if (t.fields.ImageDescription) items.push({ label: '图像说明', value: String(t.fields.ImageDescription), risk: 'low' });
  if (t.hasThumb) items.push({ label: '内嵌缩略图', value: 'EXIF 里还存着一张小图', risk: 'low' });
  return items;
}

// ---------- JPEG ----------
function scanJpeg(u8) {
  if (u8.length < 4 || u8[0] !== 0xFF || u8[1] !== 0xD8) return null;
  var segs = [], i = 2, sawEoi = false;
  while (i + 1 < u8.length) {
    if (u8[i] !== 0xFF) return null;
    var m = u8[i + 1];
    if (m === 0xFF) { i++; continue; }
    if (m === 0x00 || m === 0x01 || (m >= 0xD0 && m <= 0xD7)) { segs.push({ marker: m, start: i, end: i + 2 }); i += 2; continue; }
    if (m === 0xD9) { segs.push({ marker: m, start: i, end: i + 2 }); i += 2; sawEoi = true; break; }
    if (i + 3 >= u8.length) return null;
    var len = (u8[i + 2] << 8) | u8[i + 3];
    if (len < 2 || i + 2 + len > u8.length) return null;
    var seg = { marker: m, start: i, end: i + 2 + len, payload: [i + 4, i + 2 + len] };
    segs.push(seg);
    i += 2 + len;
    if (m === 0xDA) {
      while (i + 1 < u8.length) {
        if (u8[i] === 0xFF) {
          var n = u8[i + 1];
          if (n === 0x00 || n === 0xFF || (n >= 0xD0 && n <= 0xD7)) { i += 2; continue; }
          break;
        }
        i++;
      }
      seg.entropyEnd = i;
    }
  }
  if (!sawEoi) return null;
  segs.__eoi = i;
  return segs;
}

function segKind(u8, s) {
  if (!s.payload) return null;
  var m = s.marker;
  if (m === 0xE0) return { kind: 'jfif', drop: false };
  if (m === 0xE1) {
    var h = asciiAt(u8, s.payload[0], Math.min(40, s.payload[1] - s.payload[0]));
    if (h.indexOf('Exif') === 0) return { kind: 'exif', drop: true };
    if (h.indexOf('http://ns.adobe.com/xap/1.0/') === 0) return { kind: 'xmp', drop: true };
    if (h.indexOf('http://ns.adobe.com/xmp/extension/') === 0) return { kind: 'xmpext', drop: true };
    return { kind: 'app1', drop: true };
  }
  if (m === 0xE2) {
    var h2 = asciiAt(u8, s.payload[0], Math.min(16, s.payload[1] - s.payload[0]));
    if (h2.indexOf('ICC_PROFILE') === 0) return { kind: 'icc', drop: false };
    return { kind: 'app2', drop: true };
  }
  if (m === 0xEB) return { kind: 'c2pa', drop: true };
  if (m === 0xED) return { kind: 'iptc', drop: true };
  if (m === 0xEE) {
    var h3 = asciiAt(u8, s.payload[0], Math.min(8, s.payload[1] - s.payload[0]));
    if (h3.indexOf('Adobe') === 0) return { kind: 'adobe', drop: false };
    return { kind: 'app14', drop: true };
  }
  if (m === 0xFE) return { kind: 'comment', drop: true };
  if (m >= 0xE3 && m <= 0xEF) return { kind: 'appn' + (m - 0xE0), drop: true };
  return null;
}

function shouldDropJpeg(u8, s, opts) {
  var k = segKind(u8, s);
  if (!k) return false;
  if (k.kind === 'icc') return !opts.icc;
  if (k.kind === 'c2pa') return !opts.c2pa;
  return !!k.drop;
}

function inspectJpeg(u8, segs) {
  var info = { kind: 'jpeg', mime: 'image/jpeg', ext: '.jpg', items: [], orientation: 0, hadExif: false, removable: 0, dims: null, notes: [] };
  var flags = { icc: 0, c2pa: 0, xmp: 0, iptc: 0, comment: 0, other: 0 };
  var exifData = null;
  segs.forEach(function (s) {
    if (!s.payload) return;
    var k = segKind(u8, s);
    if (!k) {
      var m = s.marker;
      if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
        info.dims = [(u8[s.payload[0] + 3] << 8) | u8[s.payload[0] + 4], (u8[s.payload[0] + 1] << 8) | u8[s.payload[0] + 2]];
      }
      return;
    }
    if (k.kind === 'exif') {
      info.hadExif = true;
      exifData = parseTiff(u8, s.payload[0] + 6);
      var o = exifData.fields.Orientation;
      info.orientation = typeof o === 'number' ? o : 0;
      info.items = info.items.concat(exifItems(u8, exifData, info));
      info.removable++;
    } else if (k.kind === 'xmp' || k.kind === 'xmpext') { flags.xmp++; info.removable++; }
    else if (k.kind === 'iptc') { flags.iptc++; info.removable++; }
    else if (k.kind === 'comment') {
      var t = asciiAt(u8, s.payload[0], Math.min(s.payload[1] - s.payload[0], 160));
      info.items.push({ label: '文件注释', value: t, risk: 'mid' });
      flags.comment++; info.removable++;
    } else if (k.kind === 'app2') {
      info.items.push({ label: 'APP2 附加数据(常见于手机的多帧/景深信息)', value: '', risk: 'low' });
      flags.other++; info.removable++;
    } else if (k.kind === 'app1') {
      info.items.push({ label: 'APP1 附加数据', value: '', risk: 'low' });
      flags.other++; info.removable++;
    } else if (k.kind === 'c2pa') { flags.c2pa++; }
    else if (k.kind === 'icc') { flags.icc++; }
    else if (k.kind === 'app14' || (k.kind || '').indexOf('appn') === 0) {
      info.items.push({ label: 'APP' + (s.marker - 0xE0) + ' 附加数据', value: '', risk: 'low' });
      flags.other++; info.removable++;
    }
  });
  if (flags.xmp) info.items.push({ label: 'XMP(编辑记录、标签、可能是作者名)', value: '', risk: 'mid' });
  if (flags.iptc) info.items.push({ label: 'IPTC / Photoshop 信息(作者、版权、原始路径)', value: '', risk: 'mid' });
  if (info.orientation > 1) info.items.push({ label: '方向标记 Orientation=' + info.orientation, value: '会作为一小段最小 EXIF 保留,否则照片会躺倒显示', risk: 'keep' });
  if (flags.icc) info.items.push({ label: '颜色配置(ICC)', value: '默认保留 —— 删了可能变色', risk: 'keep' });
  if (flags.c2pa) info.items.push({ label: '内容凭证(C2PA)', value: '标注"这张图由谁 / 什么工具生成",默认保留', risk: 'keep' });
  return info;
}

// 只含必要字段的最小 APP1。EXIF 规范要求 IFD 条目按 tag 升序。
function buildMinimalApp1(orientation) {
  var o = orientation & 0xFFFF;
  var tiff = [0x4D, 0x4D, 0x00, 0x2A, 0x00, 0x00, 0x00, 0x08,
    0x00, 0x01,
    0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, (o >> 8) & 0xFF, o & 0xFF, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00];
  var body = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00].concat(tiff);
  var len = body.length + 2;
  return new Uint8Array([0xFF, 0xE1, (len >> 8) & 0xFF, len & 0xFF].concat(body));
}

// 一个 JPEG 段"真正占到"哪里结束:SOS 段后面跟着的是熵编码的图像数据,它不属于任何段头,
// 但必须原样搬过去(踩过坑:只搬段头会把图像数据丢掉,输出变成打不开的残图)。
function segEndOf(s) { return (s.marker === 0xDA && s.entropyEnd) ? s.entropyEnd : s.end; }

function cleanJpeg(u8, segs, opts, info) {
  var kept = [], removedBytes = 0, removedCount = 0;
  segs.forEach(function (s) {
    if (s.marker === 0xD8) return;
    if (shouldDropJpeg(u8, s, opts)) { removedBytes += s.end - s.start; removedCount++; return; }
    kept.push(s);
  });
  var keepOrient = opts.orient && info.orientation > 1 && info.hadExif;
  var orientSeg = keepOrient ? buildMinimalApp1(info.orientation) : null;
  var total = 2 + (orientSeg ? orientSeg.length : 0);
  kept.forEach(function (s) { total += segEndOf(s) - s.start; });
  var out = new Uint8Array(total);
  out[0] = 0xFF; out[1] = 0xD8;
  var o = 2;
  if (orientSeg) { out.set(orientSeg, o); o += orientSeg.length; }
  kept.forEach(function (s) { var b = u8.subarray(s.start, segEndOf(s)); out.set(b, o); o += b.length; });
  return { out: out, removedBytes: removedBytes, removedCount: removedCount, keptOrientation: keepOrient };
}

function jpegScanRange(segs) {
  var first = null, last = 0;
  segs.forEach(function (s) {
    if (s.marker === 0xDA) { if (first === null) first = s.start; last = s.entropyEnd || s.end; }
  });
  return first === null ? null : [first, last];
}

function verifyJpeg(out, opts, info) {
  var lines = [], ok = true;
  var segs = scanJpeg(out);
  if (!segs) return { ok: false, lines: ['输出读不回来(构建异常,请把这个文件反馈给我们)'] };
  var bad = [];
  segs.forEach(function (s) {
    var k = segKind(out, s);
    if (!k) return;
    if (k.kind === 'exif') {
      var t = parseTiff(out, s.payload[0] + 6);
      var names = Object.keys(t.fields);
      if (t.gps || names.length > 1 || (names.length === 1 && names[0] !== 'Orientation')) bad.push('EXIF 里还有别的字段:' + names.join('/'));
      return;
    }
    if (k.kind === 'icc' && !opts.icc) { bad.push('ICC'); return; }
    if (k.kind === 'c2pa' && opts.c2pa) return;
    if (k.kind === 'icc' || k.kind === 'jfif' || k.kind === 'adobe') return;
    bad.push(k.kind);
  });
  if (bad.length) { ok = false; lines.push('再扫一遍:还发现 ' + bad.join('、') + ' —— 没删干净,请不要使用这个文件'); }
  else {
    lines.push('再扫一遍:EXIF / GPS / XMP / IPTC / 注释' + (opts.icc ? ' 都' : ' 和 ICC ') + '已经不在文件里了');
    if (opts.c2pa && info.items.some(function (x) { return x.label.indexOf('C2PA') >= 0; })) lines.push('按你的选择,内容凭证(C2PA)被保留了');
  }
  return { ok: ok, lines: lines };
}

// ---------- PNG ----------
function scanPng(u8) {
  if (u8.length < 16 || u8[0] !== 0x89 || u8[1] !== 0x50 || u8[2] !== 0x4E || u8[3] !== 0x47) return null;
  var chunks = [], i = 8;
  while (i + 8 <= u8.length) {
    var len = ((u8[i] << 24) | (u8[i + 1] << 16) | (u8[i + 2] << 8) | u8[i + 3]) >>> 0;
    var type = String.fromCharCode(u8[i + 4], u8[i + 5], u8[i + 6], u8[i + 7]);
    var end = i + 12 + len;
    if (len > 0x7FFFFFFF || end > u8.length) return null;
    chunks.push({ type: type, start: i, end: end, dataStart: i + 8, dataEnd: i + 8 + len, len: len });
    i = end;
    if (type === 'IEND') break;
  }
  return chunks.length ? chunks : null;
}

var PNG_META = { tEXt: 1, zTXt: 1, iTXt: 1, eXIf: 1, tIME: 1 };
var PNG_HOT = /gps|location|latitude|longitude|author|artist|copyright|owner|camera|make|model|software|date|time|comment|creat/i;

function inspectPng(u8, chunks) {
  var info = { kind: 'png', mime: 'image/png', ext: '.png', items: [], orientation: 0, hadExif: false, removable: 0, dims: null, notes: [] };
  var flags = { icc: 0, exif: 0 };
  chunks.forEach(function (c) {
    if (c.type === 'IHDR') {
      info.dims = [((u8[c.dataStart] << 24) | (u8[c.dataStart + 1] << 16) | (u8[c.dataStart + 2] << 8) | u8[c.dataStart + 3]) >>> 0,
        ((u8[c.dataStart + 4] << 24) | (u8[c.dataStart + 5] << 16) | (u8[c.dataStart + 6] << 8) | u8[c.dataStart + 7]) >>> 0];
      return;
    }
    if (c.type === 'iCCP') { flags.icc++; return; }
    if (c.type === 'eXIf') {
      flags.exif++;
      var t = parseTiff(u8, c.dataStart);
      info.hadExif = true;
      info.items = info.items.concat(exifItems(u8, t, info));
      info.removable++;
      return;
    }
    if (c.type === 'tEXt' || c.type === 'zTXt' || c.type === 'iTXt') {
      var kw = asciiAt(u8, c.dataStart, Math.min(79, c.len));
      var val = '';
      if (c.type === 'tEXt') val = textAt(u8, c.dataStart + kw.length + 1, Math.max(0, c.len - kw.length - 1));
      else if (c.type === 'zTXt') val = '(压缩存放)';
      else val = '(多语言块)';
      info.items.push({ label: '文字信息:' + (kw || '(无关键字)'), value: val.slice(0, 160), risk: PNG_HOT.test(kw) ? 'mid' : 'low' });
      info.removable++;
      return;
    }
    if (c.type === 'tIME') {
      var y = (u8[c.dataStart] << 8) | u8[c.dataStart + 1];
      info.items.push({ label: '文件修改时间', value: y + '-' + u8[c.dataStart + 2] + '-' + u8[c.dataStart + 3] + ' ' + u8[c.dataStart + 4] + ':' + u8[c.dataStart + 5], risk: 'mid' });
      info.removable++;
      return;
    }
  });
  if (flags.icc) info.items.push({ label: '颜色配置(ICC)', value: '默认保留 —— 删了可能变色', risk: 'keep' });
  if (flags.exif) info.items.push({ label: 'PNG 内嵌 EXIF 段', value: '已按 EXIF 内容逐项列出', risk: 'low' });
  return info;
}

function cleanPng(u8, chunks, opts) {
  var parts = [u8.subarray(0, 8)], removedBytes = 0, removedCount = 0;
  chunks.forEach(function (c) {
    var drop = PNG_META[c.type] === 1;
    if (c.type === 'iCCP' && !opts.icc) drop = true;
    if (drop) { removedBytes += c.end - c.start; removedCount++; return; }
    parts.push(u8.subarray(c.start, c.end));
  });
  return { out: concatParts(parts), removedBytes: removedBytes, removedCount: removedCount };
}

function verifyPng(out, opts, info) {
  var lines = [], ok = true;
  var chunks = scanPng(out);
  if (!chunks) return { ok: false, lines: ['输出读不回来(构建异常)'] };
  var bad = [];
  chunks.forEach(function (c) {
    if (PNG_META[c.type] === 1) bad.push(c.type);
    if (c.type === 'iCCP' && !opts.icc) bad.push('iCCP');
  });
  if (bad.length) { ok = false; lines.push('再扫一遍:还发现 ' + bad.join('、') + ' —— 没删干净'); }
  else lines.push('再扫一遍:tEXt / zTXt / iTXt / eXIf / tIME 这些信息块已经不在文件里了');
  return { ok: ok, lines: lines };
}

// ---------- WebP ----------
function scanWebp(u8) {
  if (u8.length < 16) return null;
  if (asciiAt(u8, 0, 4) !== 'RIFF' || asciiAt(u8, 8, 4) !== 'WEBP') return null;
  var chunks = [], i = 12;
  while (i + 8 <= u8.length) {
    var id = asciiAt(u8, i, 4);
    var len = (u8[i + 4] | (u8[i + 5] << 8) | (u8[i + 6] << 16) | (u8[i + 7] << 24)) >>> 0;
    var end = i + 8 + len + (len & 1);
    if (end > u8.length) end = u8.length;
    chunks.push({ id: id, start: i, end: end, dataStart: i + 8, dataEnd: i + 8 + len, len: len });
    if (end <= i) break;
    i = end;
  }
  return chunks.length ? chunks : null;
}

function read24(u8, o) { return (u8[o] | (u8[o + 1] << 8) | (u8[o + 2] << 16)) >>> 0; }

function inspectWebp(u8, chunks) {
  var info = { kind: 'webp', mime: 'image/webp', ext: '.webp', items: [], orientation: 0, hadExif: false, removable: 0, dims: null, notes: [] };
  var flags = { icc: 0 };
  chunks.forEach(function (c) {
    if (c.id === 'VP8X' && c.dataStart + 10 <= u8.length) {
      info.dims = [read24(u8, c.dataStart + 4) + 1, read24(u8, c.dataStart + 7) + 1];
      return;
    }
    if (c.id === 'ICCP') { flags.icc++; return; }
    if (c.id === 'EXIF') {
      var base = c.dataStart;
      if (asciiAt(u8, c.dataStart, 6) === 'Exif') base = c.dataStart + 6;
      var t = parseTiff(u8, base);
      info.hadExif = true;
      info.items = info.items.concat(exifItems(u8, t, info));
      info.removable++;
      return;
    }
    if (c.id === 'XMP ') {
      info.items.push({ label: 'XMP(编辑记录、标签、可能是作者名)', value: '', risk: 'mid' });
      info.removable++;
    }
  });
  if (flags.icc) info.items.push({ label: '颜色配置(ICC)', value: '默认保留 —— 删了可能变色', risk: 'keep' });
  return info;
}

function cleanWebp(u8, chunks, opts) {
  var removedBytes = 0, removedCount = 0;
  var kept = [];
  chunks.forEach(function (c) {
    var drop = c.id === 'EXIF' || c.id === 'XMP ';
    if (c.id === 'ICCP' && !opts.icc) drop = true;
    if (drop) { removedBytes += c.end - c.start; removedCount++; return; }
    kept.push(c);
  });
  var total = 12;
  var pieces = [];
  kept.forEach(function (c) {
    var bytes = u8.subarray(c.start, c.end);
    if (c.id === 'VP8X') {
      bytes = new Uint8Array(bytes);
      var f = bytes[8];
      if (!opts.icc) f = f & ~0x20;
      bytes[8] = f & ~0x08 & ~0x04; // 清掉 EXIF / XMP 标志位
    }
    pieces.push(bytes);
    total += bytes.length;
  });
  var out = new Uint8Array(total);
  out.set([0x52, 0x49, 0x46, 0x46], 0);
  var size = total - 8;
  out[4] = size & 0xFF; out[5] = (size >> 8) & 0xFF; out[6] = (size >> 16) & 0xFF; out[7] = (size >> 24) & 0xFF;
  out.set([0x57, 0x45, 0x42, 0x50], 8);
  var o = 12;
  pieces.forEach(function (b) { out.set(b, o); o += b.length; });
  return { out: out, removedBytes: removedBytes, removedCount: removedCount };
}

function verifyWebp(out, opts, info) {
  var lines = [], ok = true;
  var chunks = scanWebp(out);
  if (!chunks) return { ok: false, lines: ['输出读不回来(构建异常)'] };
  var bad = [];
  chunks.forEach(function (c) {
    if (c.id === 'EXIF' || c.id === 'XMP ') bad.push(c.id.trim());
    if (c.id === 'ICCP' && !opts.icc) bad.push('ICCP');
  });
  var vp8x = chunks.filter(function (c) { return c.id === 'VP8X'; })[0];
  if (vp8x && (out[vp8x.dataStart] & 0x0C)) bad.push('VP8X 标志位没清干净');
  if (bad.length) { ok = false; lines.push('再扫一遍:还发现 ' + bad.join('、') + ' —— 没删干净'); }
  else lines.push('再扫一遍:EXIF / XMP 这些信息块已经不在文件里了');
  return { ok: ok, lines: lines };
}

// ---------- 公共 ----------
// 解码一次拿宽高(解不开返回 null)。注意:浏览器会按 Orientation 自动转正宽高可能对调,
// 调用方比对时要把"对调也算一致"。
async function pixelDims(blob) {
  var tries = [{ imageOrientation: 'none' }, undefined];
  for (var i = 0; i < tries.length; i++) {
    try {
      var b = await createImageBitmap(blob, tries[i]);
      var d = [b.width, b.height];
      if (b.close) b.close();
      return d;
    } catch (e) { /* 换一种再试 */ }
  }
  return null;
}

function concatParts(parts) {
  var total = 0;
  parts.forEach(function (p) { total += p.length; });
  var out = new Uint8Array(total), o = 0;
  parts.forEach(function (p) { out.set(p, o); o += p.length; });
  return out;
}

function detectFormat(u8) {
  if (u8.length > 4 && u8[0] === 0xFF && u8[1] === 0xD8) return 'jpeg';
  if (u8.length > 8 && u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4E && u8[3] === 0x47) return 'png';
  if (u8.length > 12 && asciiAt(u8, 0, 4) === 'RIFF' && asciiAt(u8, 8, 4) === 'WEBP') return 'webp';
  return null;
}

function pixelSignature(u8, fmt, segsOrChunks) {
  if (fmt === 'jpeg') {
    var r = jpegScanRange(segsOrChunks);
    if (!r) return null;
    return { from: r[0], to: r[1], len: r[1] - r[0], hash: fnv1a(u8, r[0], r[1]) };
  }
  if (fmt === 'png') {
    var from = -1, to = -1, len = 0, h = 0x811c9dc5;
    segsOrChunks.forEach(function (c) {
      if (c.type !== 'IDAT' && c.type !== 'fdAT') return;
      if (from < 0) from = c.dataStart;
      to = c.dataEnd; len += c.dataEnd - c.dataStart;
      h = (h ^ fnv1a(u8, c.dataStart, c.dataEnd)) >>> 0;
    });
    return from < 0 ? null : { from: from, to: to, len: len, hash: h };
  }
  if (fmt === 'webp') {
    var len2 = 0, h2 = 0x811c9dc5, from2 = -1, to2 = -1;
    segsOrChunks.forEach(function (c) {
      if (['VP8 ', 'VP8L', 'ALPH', 'ANMF'].indexOf(c.id) < 0) return;
      if (from2 < 0) from2 = c.dataStart;
      to2 = c.dataEnd; len2 += c.dataEnd - c.dataStart;
      h2 = (h2 ^ fnv1a(u8, c.dataStart, c.dataEnd)) >>> 0;
    });
    return from2 < 0 ? null : { from: from2, to: to2, len: len2, hash: h2 };
  }
  return null;
}

export const _bytes = {
  scanJpeg: scanJpeg, parseTiff: parseTiff, inspectJpeg: inspectJpeg, cleanJpeg: cleanJpeg,
  verifyJpeg: verifyJpeg, scanPng: scanPng, inspectPng: inspectPng, cleanPng: cleanPng, verifyPng: verifyPng,
  scanWebp: scanWebp, inspectWebp: inspectWebp, cleanWebp: cleanWebp, verifyWebp: verifyWebp,
  detectFormat: detectFormat, pixelSignature: pixelSignature, fnv1a: fnv1a
};

export function mount(root, H) {
  H.injectCss(
    '.ec-opts{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin:16px 0}'
    + '.ec-opt{display:flex;flex-wrap:wrap;align-items:baseline;border:1px solid var(--c-hairline);border-radius:12px;padding:10px 12px;font-size:14px;background:#fff;cursor:pointer}'
    + '.ec-opt input{margin-right:6px}'
    + '.ec-opt-t{font-weight:500}'
    + '.ec-opt-sub{flex:0 0 100%;color:#6e6e73;font-size:13px;line-height:1.6;margin-top:5px;padding-left:22px}'
    + '.ec-sum{margin:14px 0 4px;font-size:14px;color:#3a3a3c}'
    + '.ec-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:14px;margin-top:12px}'
    + '.ec-card{background:#fff;border:1px solid var(--c-hairline);border-radius:14px;padding:14px}'
    + '.ec-head{display:flex;gap:10px;align-items:flex-start}'
    + '.ec-thumb{width:56px;height:56px;object-fit:cover;border-radius:10px;background:#f2f2f4;flex:none}'
    + '.ec-name{font-size:14px;word-break:break-all;line-height:1.45}'
    + '.ec-meta{font-size:13px;color:#6e6e73;line-height:1.6;margin-top:2px}'
    + '.ec-list{margin-top:10px;border-top:1px solid var(--c-hairline);padding-top:8px}'
    + '.ec-line{font-size:14px;line-height:1.7;color:#1d1d1f;margin-top:4px}'
    + '.ec-line b{font-weight:600}'
    + '.ec-line span{margin-left:6px}'
    + '.ec-chip{display:inline-block;font-size:14px;line-height:20px;padding:1px 7px;border-radius:7px;margin-right:6px;vertical-align:1px}'
    + '.ec-chip--high{background:#fdeaea;color:#a3000f}'
    + '.ec-chip--mid{background:#fdf3e3;color:#7a4a00}'
    + '.ec-chip--low{background:#eef1f5;color:#3f4247}'
    + '.ec-chip--keep{background:#eaf3ec;color:#1d5c2b}'
    + '.ec-copy{display:inline-block;font-size:14px;border:1px solid var(--c-line-strong);background:#fff;border-radius:8px;padding:2px 9px;margin-left:4px;cursor:pointer;color:#3a3a3c;vertical-align:1px}'
    + '.ec-chk{margin-top:10px;border-top:1px solid var(--c-hairline);padding-top:8px;font-size:14px;color:#1d5c2b;line-height:1.7}'
    + '.ec-chk.bad{color:#a3000f}'
    + '.ec-none{font-size:14px;color:#6e6e73;line-height:1.6}'
    + '.ec-badge{display:inline-block;font-size:14px;line-height:20px;padding:1px 8px;border-radius:7px;background:#eaf3ec;color:#1d5c2b}'
    + '.ec-badge--warn{background:#fdf3e3;color:#7a4a00}'
  );

  root.innerHTML =
    '<h1 class="tool-h1">照片去信息</h1>'
    + '<p class="tool-sub">删掉照片里带的拍摄时间、设备型号、机身序列号和 GPS 位置。默认走无损路线:只摘掉信息段,图像的压缩数据逐字节保留 —— 不重新编码、不掉画质。删完会当场再扫一遍、逐字节比对、再解码一次,三条自检结果都摆在卡片上。</p>'
    + '<div class="tool-drop" id="dz"><div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9.5 12l1.8 1.8 3.4-3.6"/></svg></div><div class="title">点击选择照片,或拖拽到此处</div><div class="hint">JPG / PNG / WebP 可批量;iPhone 的 HEIC 会提示你下载本地解码器再转</div></div>'
    + '<div id="heicBox"></div>'
    + '<div class="ec-opts">'
    +   '<label class="ec-opt"><input type="checkbox" id="oOrient" checked><span class="ec-opt-t">保留方向标记</span><span class="ec-opt-sub">竖着拍的照片靠它才不躺倒。会单独留一小段只含方向的最小标记,其他信息照删。</span></label>'
    +   '<label class="ec-opt"><input type="checkbox" id="oIcc" checked><span class="ec-opt-t">保留颜色配置(ICC)</span><span class="ec-opt-sub">不勾的话文件更小,但个别图片的颜色可能变淡或偏色。</span></label>'
    +   '<label class="ec-opt"><input type="checkbox" id="oC2pa" checked><span class="ec-opt-t">保留内容凭证(C2PA)</span><span class="ec-opt-sub">图里如果有"由 XX 生成 / AI 生成"的标注,勾上就留着。有些平台要求 AI 图片保留它。</span></label>'
    + '</div>'
    + '<div class="progress-bar" id="pg"><div class="fill" style="width:0%"></div></div>'
    + '<p class="progress-note" id="pgt" role="status" aria-live="polite" style="display:none"></p>'
    + '<div class="tool-row" style="margin-top:12px"><button class="tool-btn" id="dlAll">打包下载(ZIP)</button><button class="tool-btn tool-btn--ghost" id="clr">清空</button></div>'
    + '<div class="ec-sum" id="sum"></div>'
    + '<div class="ec-cards" id="out"></div>'
    + '<div class="idp-hint" style="margin-top:16px">'
    +   '<b>几句实话:</b><br>'
    +   '· 只删"文件里带的"信息。截图、或者已经被微信/微博压缩过的图,信息本来就不在里面 —— 卡片会直接写"没找到"。<br>'
    +   '· 不做"半删"。有些工具说"只删位置、保留时间",那种做法往往只是把坐标指针抹掉,坐标字节还躺在文件里、能被捞出来;我们宁可整段去掉。<br>'
    +   '· 画面本身、水印、画面里能看到的门牌号,这个工具管不了。<br>'
    +   '· 发『原图』时,对方 App 可能另外记录你的账号信息 —— 那部分不在照片文件里,也不归这个工具管。'
    + '</div>';

  var items = [], urls = [];
  var out = root.querySelector('#out');
  var dz = root.querySelector('#dz');
  var pg = root.querySelector('#pg'), fill = pg.querySelector('.fill'), pgt = root.querySelector('#pgt');

  function urlFor(blob) { var u = URL.createObjectURL(blob); urls.push(u); return u; }
  function releaseUrls() { urls.forEach(function (u) { URL.revokeObjectURL(u); }); urls = []; }
  function opts() {
    return {
      orient: root.querySelector('#oOrient').checked,
      icc: root.querySelector('#oIcc').checked,
      c2pa: root.querySelector('#oC2pa').checked
    };
  }

  function chip(risk) {
    var map = { high: ['危险', 'high'], mid: ['要注意', 'mid'], low: ['低', 'low'], keep: ['保留', 'keep'], none: ['无所谓', 'low'] };
    var m = map[risk] || map.low;
    return '<span class="ec-chip ec-chip--' + m[1] + '">' + m[0] + '</span>';
  }

  function render() {
    if (!items.length) { out.innerHTML = ''; root.querySelector('#sum').innerHTML = ''; return; }
    var html = '', removedTotal = 0, withGps = 0, done = 0;
    items.forEach(function (it, i) {
      html += '<div class="ec-card">';
      html += '<div class="ec-head">';
      // 缩略图按需生成:清空会释放所有 object URL,"撤销"之后必须能重建(存字符串就会留下一张裂图)
      if (it.file) { if (!it.thumb) it.thumb = urlFor(it.file); html += '<img class="ec-thumb" src="' + it.thumb + '" alt="">'; }
      html += '<div><div class="ec-name">' + H.esc(it.name) + '</div>';
      if (it.status === 'ok') {
        done++; removedTotal += it.removedBytes || 0;
        html += '<div class="ec-meta">' + it.dims + ' · ' + H.fmt(it.inBytes) + ' → ' + H.fmt(it.blob.size) + (it.removedBytes ? ' · 删掉 ' + H.fmt(it.removedBytes) + ' 信息' : ' · 没有可删的信息') + '</div>';
      } else if (it.status === 'fail') {
        html += '<div class="ec-meta" style="color:var(--c-err)">这一张没处理成功:' + H.esc(it.why) + '</div>';
      } else {
        html += '<div class="ec-meta">处理中…</div>';
      }
      html += '</div></div>';

      if (it.status === 'ok') {
        var found = it.info.items || [];
        var real = found.filter(function (x) { return x.risk !== 'keep'; });
        var hasGps = found.some(function (x) { return x.label.indexOf('GPS') === 0; });
        if (hasGps) withGps++;
        html += '<div class="ec-list">';
        if (!real.length) {
          html += '<div class="ec-none">没找到可删的信息。这张图可能是截图、或者已经被平台压缩过一遍了。</div>';
        } else {
          real.forEach(function (x) {
            html += '<div class="ec-line">' + chip(x.risk) + '<b>' + H.esc(x.label) + '</b>';
            if (x.value) html += '<span>' + H.esc(x.value) + '</span>';
            if (x.copy) html += '<button class="ec-copy" data-copy="' + H.esc(x.copy) + '">复制坐标</button>';
            html += '</div>';
          });
        }
        var kept = found.filter(function (x) { return x.risk === 'keep'; });
        kept.forEach(function (x) {
          html += '<div class="ec-line">' + chip('keep') + '<b>' + H.esc(x.label) + '</b><span>' + H.esc(x.value) + '</span></div>';
        });
        html += '</div>';
        html += '<div class="ec-chk' + (it.ok ? '' : ' bad') + '">';
        it.checks.forEach(function (c) { html += '<div>' + (it.ok ? '✓ ' : '✗ ') + H.esc(c) + '</div>'; });
        html += '</div>';
        if (it.note) html += '<div class="ec-meta">' + H.esc(it.note) + '</div>';
        html += '<div class="tool-row" style="margin-top:10px"><button class="tool-btn" data-dl="' + i + '">下载这张</button></div>';
      }
      html += '</div>';
    });
    out.innerHTML = html;
    var sum = root.querySelector('#sum');
    if (!done) sum.innerHTML = '';
    else {
      sum.innerHTML = '共处理 ' + done + ' 张 · 合计删掉 <b>' + H.fmt(removedTotal) + '</b> 的拍摄信息'
        + (withGps ? ' · 其中 <b>' + withGps + ' 张带 GPS 位置</b>' : ' · 这些图里没有 GPS 位置');
    }
  }

  async function processOne(file, o) {
    var buf = new Uint8Array(await file.arrayBuffer());
    var fmt = detectFormat(buf);
    if (!fmt) throw new Error('认不出这是什么图片格式(这个工具做 JPG / PNG / WebP)');
    var info, cleaned, ver, sigBefore, sigAfter, segsOrChunks;
    if (fmt === 'jpeg') {
      segsOrChunks = scanJpeg(buf);
      if (!segsOrChunks) throw new Error('这个 JPEG 的结构读不出来,可能文件不完整');
      info = inspectJpeg(buf, segsOrChunks);
      sigBefore = pixelSignature(buf, fmt, segsOrChunks);
      cleaned = cleanJpeg(buf, segsOrChunks, o, info);
      ver = verifyJpeg(cleaned.out, o, info);
      var segs2 = scanJpeg(cleaned.out);
      sigAfter = pixelSignature(cleaned.out, fmt, segs2);
    } else if (fmt === 'png') {
      segsOrChunks = scanPng(buf);
      if (!segsOrChunks) throw new Error('这个 PNG 的结构读不出来,可能文件不完整');
      info = inspectPng(buf, segsOrChunks);
      sigBefore = pixelSignature(buf, fmt, segsOrChunks);
      cleaned = cleanPng(buf, segsOrChunks, o);
      ver = verifyPng(cleaned.out, o, info);
      sigAfter = pixelSignature(cleaned.out, fmt, scanPng(cleaned.out));
    } else {
      segsOrChunks = scanWebp(buf);
      if (!segsOrChunks) throw new Error('这个 WebP 的结构读不出来,可能文件不完整');
      info = inspectWebp(buf, segsOrChunks);
      sigBefore = pixelSignature(buf, fmt, segsOrChunks);
      cleaned = cleanWebp(buf, segsOrChunks, o);
      ver = verifyWebp(cleaned.out, o, info);
      sigAfter = pixelSignature(cleaned.out, fmt, scanWebp(cleaned.out));
    }
    var blob = new Blob([cleaned.out], { type: info.mime });
    var chk = await H.checkImage(blob, {});
    var checks = ver.lines.slice();
    var ok = ver.ok;
    if (sigBefore && sigAfter && sigBefore.len === sigAfter.len && sigBefore.hash === sigAfter.hash) {
      checks.push('图像数据 ' + sigBefore.len.toLocaleString('en-US') + ' 字节与原图逐字节一致(没有重新编码)');
    } else {
      ok = false;
      checks.push('图像数据与原图对不上 —— 请不要使用这个文件');
    }
    // 尺寸要按"文件里真实的像素"比:带 Orientation 的照片被解码器转正后宽高会对调,
    // 拿转正后的尺寸去比会误报(实测踩到),所以这里显式要求不做方向变换。
    var px = await pixelDims(blob);
    if (chk && chk.ok && px) {
      // 浏览器解码时会按 Orientation 自动转正(实测:Chromium 连 imageOrientation:'none' 也照转),
      // 所以宽高可能对调 —— 只要"两个数还是那两个数",就说明没有裁掉也没有缩放。
      var same = !info.dims
        || (px[0] === info.dims[0] && px[1] === info.dims[1])
        || (px[0] === info.dims[1] && px[1] === info.dims[0]);
      if (!same) {
        ok = false;
        checks.push('像素尺寸变成了 ' + px.join('×') + ',原图是 ' + info.dims.join('×') + ' —— 请不要使用这个文件');
      } else {
        checks.push('重新解码成功:' + (info.dims ? info.dims.join('×') : px.join('×')) + ' 像素,和原图一致(没有裁掉、没有缩放)');
      }
    } else {
      ok = false;
      checks.push('输出打不开:' + ((chk && chk.error) || '解码失败'));
    }
    if (info.orientation > 1 && o.orient && info.hadExif) {
      checks.push('方向标记 Orientation=' + info.orientation + ' 保留着:手机和浏览器打开时会自动把它摆正(像素尺寸按文件里的算)');
    }
    var base = file.name.replace(/.[^.]+$/, '');
    return {
      name: file.name, status: 'ok', ok: ok, blob: blob, info: info, checks: checks,
      removedBytes: cleaned.removedBytes, inBytes: buf.length, dims: (info.dims ? info.dims[0] + '×' + info.dims[1] : ((px && px.join('×')) || (chk.width + '×' + chk.height))),
      file: file, thumb: null, outName: base + '-clean' + info.ext
    };
  }

  async function processList(list, append) {
    if (!append) { releaseUrls(); items = []; render(); }
    if (!list.length) return;
    pg.style.display = 'block'; pgt.style.display = 'block'; fill.style.width = '0%';
    for (var i = 0; i < list.length; i++) {
      var f = list[i];
      pgt.textContent = '正在处理:第 ' + (i + 1) + ' / ' + list.length + ' 张 · ' + f.name;
      fill.style.width = Math.round(i / list.length * 100) + '%';
      try {
        items.push(await processOne(f, opts()));
      } catch (e) {
        items.push({ name: f.name, status: 'fail', why: H.friendlyError(e, '处理失败') });
      }
      render();
    }
    fill.style.width = '100%';
    pg.style.display = 'none'; pgt.style.display = 'none';
    render();
    var bad = items.filter(function (x) { return x.status === 'ok' && !x.ok; }).length;
    H.warnBelow(dz, bad ? ('有 ' + bad + ' 张自检没通过,卡片上用红字标了 —— 那几张请不要用。') : '处理完成。原图没有被改动,结果只在你本机。');
  }

  async function handle(files) {
    var list = [], skipped = [], heic = null;
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      if (await H.sniffHeic(f)) { heic = f; continue; }
      if (/^image\/(jpeg|jpg|png|webp)$/i.test(f.type || '') || /\.(jpe?g|png|webp)$/i.test(f.name || '')) list.push(f);
      else skipped.push(f.name);
    }
    if (heic) {
      root.querySelector('#heicBox').innerHTML = H.heicNotice(heic, function (decoded) {
        processList([decoded], true);
      });
    }
    if (skipped.length) H.warnBelow(dz, '跳过 ' + skipped.length + ' 个不是图片的文件:' + skipped.slice(0, 3).join('、'));
    if (list.length) await processList(list, false);
    else if (!heic && !skipped.length) H.warnBelow(dz, '请拖入照片(JPG / PNG / WebP)。');
  }

  H.makeDropZone(dz, handle, 'image/*');
  out.addEventListener('click', function (e) {
    var c = e.target.closest('[data-copy]');
    if (c) { H.copyText(c.getAttribute('data-copy'), c); return; }
    var b = e.target.closest('[data-dl]');
    if (b) {
      var it = items[parseInt(b.dataset.dl, 10)];
      if (it && it.blob) H.downloadBlob(it.blob, it.outName);
    }
  });
  root.querySelector('#dlAll').addEventListener('click', function () {
    var list = items.filter(function (x) { return x.status === 'ok' && x.ok; }).map(function (x) { return { name: x.outName, blob: x.blob }; });
    if (list.length) H.downloadZip(list, 'clean-photos.zip');
    else H.warnBelow(dz, '还没有通过自检的结果可以打包。');
  });
  root.querySelector('#clr').addEventListener('click', function () {
    var snap = items.slice();
    releaseUrls();
    snap.forEach(function (it) { it.thumb = null; }); // 释放后旧 URL 不能再用,清掉让 render 重建
    items = []; render();
    root.querySelector('#heicBox').innerHTML = '';
    H.clearWarn(dz);
    if (snap.length) H.toast('已清空 ' + snap.length + ' 张', { action: '撤销', onAction: function () { items = snap; render(); } });
  });
}
