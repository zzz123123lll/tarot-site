// shared/encoder-core.js — 纯编码核心(不碰 DOM,主线程与 Worker 共用同一份实现)
// 依赖:vendor/encoders/*(@jsquash,mozjpeg / libwebp / squoosh-png,Apache-2.0,已自托管)
// 约定:输入是 RGBA 像素缓冲,输出是编码后的 ArrayBuffer;拿不到真编码器时返回 reason:'no-codec',由调用方决定兜底方式。

var _cache = {};
var _loads = 0; // 真正发起过几次"取编码器文件"的请求(缓存命中不算),用于如实告诉用户首次使用下载了多少

export function codecLoads() { return _loads; }

function loadCodec(kind) {
  if (_cache[kind]) return _cache[kind];
  _loads++;
  var path = kind === 'jpeg' ? '/vendor/encoders/jpeg/encode.js'
    : kind === 'webp' ? '/vendor/encoders/webp/encode-local.js'
    : '/vendor/encoders/png/encode.js';
  _cache[kind] = import(path).then(function (mod) { return mod.default || mod.encode; });
  return _cache[kind];
}

export function pickKind(mime) {
  if (mime === 'image/jpeg') return 'jpeg';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/png') return 'png';
  return null;
}

function toImageData(buf, width, height) {
  var view = buf instanceof Uint8ClampedArray ? buf : new Uint8ClampedArray(buf);
  return new ImageData(view, width, height);
}

// 单次编码
async function once(img, kind, q, extra) {
  var encode = await loadCodec(kind);
  var opt = kind === 'png' ? {} : Object.assign({ quality: q }, extra || {});
  var out = await encode(img, opt);
  return out ? out.buffer ? out.buffer : out : null;
}

// 目标体积:JPEG 用"预测质量 + 小范围二分"、WebP 用 libwebp 原生 target_size、PNG 只做无损重压
export async function encodeTarget(buf, width, height, mime, targetBytes, origSize) {
  var kind = pickKind(mime);
  if (!kind) return { buf: null, met: false, reason: 'unsupported' };
  if (origSize > 0 && origSize <= targetBytes) return { buf: null, met: true, reason: 'already' };
  var img = toImageData(buf, width, height);
  try { await loadCodec(kind); } catch (e) { return { buf: null, met: false, reason: 'no-codec' }; }

  async function run(q, extra) {
    try { return await once(img, kind, q, extra); } catch (e) { return null; }
  }

  if (kind === 'png') {
    // PNG 无损:只做一次重压,更小就给,否则保留原图
    var pngBuf = await run(100);
    if (!pngBuf || pngBuf.byteLength >= origSize) return { buf: null, met: false, reason: 'png-lossless' };
    return { buf: pngBuf, met: pngBuf.byteLength <= targetBytes, quality: 100, reason: pngBuf.byteLength <= targetBytes ? 'ok' : 'png-lossless' };
  }

  if (kind === 'webp') {
    var wb = await run(75, { target_size: targetBytes });
    if (wb && wb.byteLength <= targetBytes) return { buf: wb, met: true, reason: 'ok' };
  }

  var top = await run(95);
  if (!top) return { buf: null, met: false, reason: 'fail' };
  if (top.byteLength <= targetBytes) return { buf: top, met: true, quality: 95, reason: 'ok' };

  var guess = Math.round(95 * Math.sqrt(targetBytes / top.byteLength));
  var lo = Math.max(5, Math.min(guess - 18, 94));
  var hi = Math.max(5, Math.min(guess + 12, 94));
  if (lo > hi) { var t = lo; lo = hi; hi = t; }
  var best = null, tries = 0;
  while (lo <= hi && tries < 5) {
    tries++;
    var mid = Math.round((lo + hi) / 2);
    var b = await run(mid);
    if (b && b.byteLength <= targetBytes) { best = { buf: b, q: mid }; lo = mid + 1; }
    else { hi = mid - 1; }
  }
  if (best) return { buf: best.buf, met: true, quality: best.q, reason: 'ok' };

  var lowest = await run(5);
  if (!lowest) return { buf: null, met: false, reason: 'fail' };
  if (lowest.byteLength >= origSize) return { buf: null, met: false, reason: 'no-gain' };
  return { buf: lowest, met: lowest.byteLength <= targetBytes, quality: 5, reason: lowest.byteLength <= targetBytes ? 'ok' : 'too-big' };
}

// 按质量档位编码
export async function encodeQuality(buf, width, height, mime, qualityPercent) {
  var kind = pickKind(mime);
  if (!kind) return { buf: null, real: false, reason: 'unsupported' };
  var img = toImageData(buf, width, height);
  try {
    var out = await once(img, kind, qualityPercent);
    if (out) return { buf: out, real: true };
  } catch (e) { /* 交给调用方兜底 */ }
  return { buf: null, real: false, reason: 'no-codec' };
}
