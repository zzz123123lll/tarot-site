// shared/encoder-worker.js — 把真实编码器放进 Worker,避免大图压缩时卡住页面
// 由 shared/encoders.js 以 { type: 'module' } 创建;编码算法在 shared/encoder-core.js(与主线程兜底共用同一份)。
import { encodeTarget, encodeQuality } from '/shared/encoder-core.js?v=1';

self.postMessage({ ready: true });

self.onmessage = async function (e) {
  var m = e.data || {};
  try {
    if (m.mode === 'target') {
      var r = await encodeTarget(m.buf, m.width, m.height, m.mime, m.param.targetBytes, m.param.origSize);
      if (r.reason === 'no-codec') { self.postMessage({ id: m.id, ok: false, reason: 'no-codec' }); return; }
      if (r.buf) self.postMessage({ id: m.id, ok: true, buf: r.buf, met: r.met, reason: r.reason, quality: r.quality }, [r.buf]);
      else self.postMessage({ id: m.id, ok: true, buf: null, met: r.met, reason: r.reason });
      return;
    }
    var q = await encodeQuality(m.buf, m.width, m.height, m.mime, m.param);
    if (q.reason === 'no-codec' || !q.buf) { self.postMessage({ id: m.id, ok: false, reason: 'no-codec' }); return; }
    self.postMessage({ id: m.id, ok: true, buf: q.buf, real: true }, [q.buf]);
  } catch (err) {
    self.postMessage({ id: m.id, ok: false, reason: 'error', error: String((err && err.message) || err) });
  }
};
