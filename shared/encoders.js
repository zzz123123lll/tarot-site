// shared/encoders.js — 图片编码入口(Worker 优先 / 主线程真编码器 / 画布兜底,三级降级)
// 说明:真实编码器(mozjpeg / libwebp / squoosh-png)放在 Web Worker 里跑,大图压缩时页面不会卡住;
// Worker 不可用时退回主线程同一份算法;连 wasm 都加载不了才用浏览器画布编码,并在结果里如实标注。
// 目标体积模式绝不产出比原图更大的文件:压不动或反而更大时返回 blob:null,由界面如实说明。
import { pickKind, encodeTarget, encodeQuality, codecLoads, codecBytes } from '/shared/encoder-core.js?v=3';

// 编码器真正下载过几次(主线程与 Worker 都算),用来如实告诉用户"首次使用下载了多少"
var _encLoads = 0;
var _encBytes = 0;
export function encoderLoads() { return _encLoads; }
export function encoderBytes() { return _encBytes; }

// ---------- 调试开关:只能由 URL 参数触发,用来验证"编码器加载失败"这条分支 ----------
// 真实用户几乎遇不到(编码器被 Service Worker 缓存),但这条分支必须可被自动化验证:
// 在页面上加 ?simfail=encoder 时,这个模块会拒绝加载,工具应当提示"压缩程序没加载成功(不是文件的问题)"。
if (typeof location !== 'undefined' && /(?:^|[?&])simfail=encoder(?:&|$)/.test(location.search)) {
  throw new Error('simulated encoder load failure (?simfail=encoder)');
}

// ---------- 把"编码器链路"自己也交给 Service Worker 缓存 ----------
// 为什么需要:编码器有一部分是在 dedicated Worker 里取的,/vendor/encoders/*.wasm 与 core 在部分浏览器
// 不会被页面级的 SW 拦截到(实测 Chromium 断网时缺 3 个条目 → 压缩时报"压缩程序没加载成功")。
// 这里在第一次编码成功后,把本模块、core 与 worker 的 URL 主动交给 SW 存下来,之后断网也能压。
var _warmed = false;
// 各编码器真正会去取的文件的完整清单(含 wasm)。Chromium 里这些有一部分由 Worker 取,
// 页面级 SW 拦不到,断网时就只剩 canvas 兜底 —— 主动列出来交给 SW 存,三引擎行为才一致。
var CODEC_FILES = {
  jpeg: ['/vendor/encoders/jpeg/encode.js', '/vendor/encoders/jpeg/meta.js', '/vendor/encoders/jpeg/utils.js', '/vendor/encoders/jpeg/codec/enc/mozjpeg_enc.js', '/vendor/encoders/jpeg/codec/enc/mozjpeg_enc.wasm'],
  webp: ['/vendor/encoders/webp/encode-local.js', '/vendor/encoders/webp/meta.js', '/vendor/encoders/webp/utils.js', '/vendor/encoders/webp/codec/enc/webp_enc.js', '/vendor/encoders/webp/codec/enc/webp_enc.wasm'],
  png: ['/vendor/encoders/png/encode.js', '/vendor/encoders/png/meta.js', '/vendor/encoders/png/codec/pkg/squoosh_png.js', '/vendor/encoders/png/codec/pkg/squoosh_png_bg.wasm']
};
function warmEncoderChain(kind) {
  if (_warmed) return;
  _warmed = true;
  try {
    if (typeof navigator === 'undefined' || !navigator.serviceWorker) return;
    var list = ['/shared/encoder-core.js?v=3', '/shared/encoder-worker.js?v=1'];
    var files = kind && CODEC_FILES[kind];
    if (files) { for (var i = 0; i < files.length; i++) list.push(files[i]); }
    try { if (import.meta && import.meta.url) list.push(import.meta.url); } catch (e) {}
    var send = function (sw) { try { if (sw) sw.postMessage({ type: 'warm', urls: list }); } catch (e) {} };
    if (navigator.serviceWorker.controller) send(navigator.serviceWorker.controller);
    navigator.serviceWorker.ready.then(function (reg) { send(reg.active || navigator.serviceWorker.controller); }).catch(function () {});
  } catch (e) { /* 暖缓存失败不影响功能 */ }
}

// ---------- 画布像素 ----------
export async function toImageData(file, flatten) {
  var bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  var c = document.createElement('canvas');
  c.width = bmp.width; c.height = bmp.height;
  var ctx = c.getContext('2d', { willReadFrequently: true });
  if (flatten) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
  ctx.drawImage(bmp, 0, 0);
  var data = ctx.getImageData(0, 0, c.width, c.height);
  bmp.close();
  return { data: data, width: c.width, height: c.height, canvas: c };
}

function canvasEncode(canvas, mime, quality) {
  return new Promise(function (resolve) {
    canvas.toBlob(function (b) { resolve(b); }, mime, quality);
  });
}

function reExtract(img) {
  return img.canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, img.width, img.height).data.buffer;
}

// ---------- Worker ----------
var _worker = null, _wdead = false, _wid = 0, _pending = {};

function ensureWorker() {
  if (_wdead) return Promise.reject(new Error('worker unavailable'));
  if (typeof Worker === 'undefined' || (typeof window !== 'undefined' && window.__ENC_NO_WORKER)) {
    _wdead = true;
    return Promise.reject(new Error('worker disabled'));
  }
  if (_worker) return _worker;
  _worker = new Promise(function (resolve, reject) {
    var w;
    try { w = new Worker('/shared/encoder-worker.js?v=1', { type: 'module' }); }
    catch (e) { reject(e); return; }
    var settled = false;
    var timer = setTimeout(function () {
      if (settled) return;
      settled = true;
      _wdead = true;
      try { w.terminate(); } catch (e) {}
      reject(new Error('worker timeout'));
    }, 8000);
    w.onmessage = function (ev) {
      var m = ev.data || {};
      if (m.ready) { if (!settled) { settled = true; clearTimeout(timer); resolve(w); } return; }
      var cb = _pending[m.id];
      if (cb) { delete _pending[m.id]; cb(m); }
    };
    w.onerror = function () {
      _wdead = true;
      if (!settled) { settled = true; clearTimeout(timer); reject(new Error('worker error')); }
      Object.keys(_pending).forEach(function (k) {
        var cb = _pending[k]; delete _pending[k];
        cb({ ok: false, reason: 'worker-error' });
      });
    };
  }).catch(function (e) { _wdead = true; throw e; });
  return _worker;
}

function askWorker(buf, width, height, mime, mode, param) {
  return ensureWorker().then(function (w) {
    return new Promise(function (resolve, reject) {
      var id = ++_wid;
      _pending[id] = function (m) {
        if (m.loads) _encLoads = Math.max(_encLoads, m.loads);
        if (m.bytes) _encBytes = Math.max(_encBytes, m.bytes);
        if (m.ok) resolve(m); else reject(new Error(m.reason || 'worker-fail'));
      };
      try {
        w.postMessage({ id: id, buf: buf, width: width, height: height, mime: mime, mode: mode, param: param }, [buf]);
      } catch (e) {
        delete _pending[id];
        reject(e);
      }
    });
  });
}

function blobOf(buf, mime) { return buf ? new Blob([buf], { type: mime }) : null; }

// PNG 特例:真编码器(squoosh-png)与浏览器内建画布编码各出一份,取更小的那份。
// 原因:独立验收实测 squoosh-png 在部分图上的输出比浏览器内建 PNG 编码大近一倍,取小者才对用户有利。
async function pngCandidates(img, mime, mode, param) {
  var out = [];
  try {
    var r = await askWorker(img.data.data.buffer, img.width, img.height, mime, mode, param);
    if (r.buf) out.push({ blob: blobOf(r.buf, mime), real: true, codec: true });
  } catch (e) { /* Worker 不可用就只比画布 */ }
  _encLoads = Math.max(_encLoads, codecLoads());
  var cb = await canvasEncode(img.canvas, mime, undefined);
  if (cb) out.push({ blob: cb, real: false, codec: false });
  return out;
}

// ---------- 画布二分兜底(连 wasm 都不可用时) ----------
async function canvasTarget(img, mime, targetBytes, origSize) {
  var c = img.canvas;
  async function run(q) { try { return await canvasEncode(c, mime, q / 100); } catch (e) { return null; } }
  var top = await run(95);
  if (!top) return { blob: null, met: false, reason: 'fail' };
  if (top.size <= targetBytes) return { blob: top, met: true, reason: 'ok' };
  var guess = Math.round(95 * Math.sqrt(targetBytes / top.size));
  var lo = Math.max(5, Math.min(guess - 18, 94));
  var hi = Math.max(5, Math.min(guess + 12, 94));
  if (lo > hi) { var t = lo; lo = hi; hi = t; }
  var best = null, tries = 0;
  while (lo <= hi && tries < 5) {
    tries++;
    var mid = Math.round((lo + hi) / 2);
    var b = await run(mid);
    if (b && b.size <= targetBytes) { best = { blob: b, q: mid }; lo = mid + 1; }
    else { hi = mid - 1; }
  }
  if (best) return { blob: best.blob, met: true, quality: best.q, reason: 'ok' };
  var lowest = await run(5);
  if (!lowest) return { blob: null, met: false, reason: 'fail' };
  if (lowest.size >= origSize) return { blob: null, met: false, reason: 'no-gain' };
  return { blob: lowest, met: lowest.size <= targetBytes, quality: 5, reason: lowest.size <= targetBytes ? 'ok' : 'too-big' };
}

// ---------- 对外 API ----------
export async function encodeToTarget(file, mime, targetBytes) {
  var kind = pickKind(mime);
  if (!kind) return { blob: null, met: false, reason: 'unsupported' };
  var origSize = file.size || 0;
  if (origSize > 0 && origSize <= targetBytes) return { blob: null, met: true, reason: 'already' };

  var img = await toImageData(file, mime === 'image/jpeg');
  var param = { targetBytes: targetBytes, origSize: origSize };

  if (kind === 'png') {
    var cands = await pngCandidates(img, mime, 'target', param);
    var best = null;
    cands.forEach(function (c) { if (c.blob && c.blob.size < origSize && (!best || c.blob.size < best.blob.size)) best = c; });
    if (!best) return { blob: null, met: false, reason: 'png-lossless', codec: cands.some(function (c) { return c.codec; }) };
    return { blob: best.blob, met: best.blob.size <= targetBytes, real: best.real, codec: cands.some(function (c) { return c.codec; }), reason: best.blob.size <= targetBytes ? 'ok' : 'png-lossless' };
  }

  // 1) Worker 里的真编码器
  try {
    var r = await askWorker(img.data.data.buffer, img.width, img.height, mime, 'target', param);
    if (r.buf) warmEncoderChain(kind);
    return { blob: blobOf(r.buf, mime), met: !!r.met, reason: r.reason, quality: r.quality, real: true, codec: true };
  } catch (e) { /* 降级 */ }

  // 2) 主线程跑同一份真编码器
  try {
    var rr = await encodeTarget(reExtract(img), img.width, img.height, mime, targetBytes, origSize);
    _encLoads = Math.max(_encLoads, codecLoads());
    if (rr.reason !== 'no-codec') return { blob: blobOf(rr.buf, mime), met: !!rr.met, reason: rr.reason, quality: rr.quality, real: true, codec: true };
  } catch (e) { /* 降级 */ }

  // 3) 画布编码:到这里说明真编码器没能出结果
  var t = await canvasTarget(img, mime, targetBytes, origSize);
  t.real = false; t.codec = false;
  return t;
}

export async function encodeWithQuality(file, mime, qualityPercent) {
  var img = await toImageData(file, mime === 'image/jpeg');
  if (pickKind(mime) === 'png') {
    var cands = await pngCandidates(img, mime, 'quality', qualityPercent);
    var best = null;
    cands.forEach(function (c) { if (c.blob && (!best || c.blob.size < best.blob.size)) best = c; });
    // codec = 真实编码器这次到底有没有出东西(和 real 区分开:
    // real 说的是"被选中的这份是谁",codec 说的是"真编码器是否可用/已就绪"。
    // 之前把两者混为一谈,导致 PNG 上画布更小、选了画布时,界面错误地说"压缩程序没加载成功"。)
    return best
      ? { blob: best.blob, real: best.real, codec: cands.some(function (c) { return c.codec; }) }
      : { blob: null, real: false, codec: false };
  }
  try {
    var r = await askWorker(img.data.data.buffer, img.width, img.height, mime, 'quality', qualityPercent);
    if (r.buf) { warmEncoderChain(pickKind(mime)); return { blob: blobOf(r.buf, mime), real: true, codec: true }; }
  } catch (e) { /* 降级 */ }
  try {
    var rr = await encodeQuality(reExtract(img), img.width, img.height, mime, qualityPercent);
    _encLoads = Math.max(_encLoads, codecLoads());
    if (rr.buf) return { blob: blobOf(rr.buf, mime), real: true, codec: true };
  } catch (e) { /* 降级 */ }
  var b = await canvasEncode(img.canvas, mime, qualityPercent / 100);
  return { blob: b, real: false, codec: false };
}
