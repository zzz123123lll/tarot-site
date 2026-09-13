// shared/heic.js — HEIC/HEIF 本地解码(按需加载 libheif-js,约 1.44MB,只在使用时下载)
// 为什么单独一个模块:多数浏览器(Chrome/Edge/Firefox/安卓)没有 HEIC 解码能力,只有 Safari 有;
// 而"iPhone 照片在 Windows 打不开"是真实高频痛点。解码器体积大,所以做成用户点确认才加载。
//
// 第三方组件:libheif-js 1.23.2(https://github.com/catdad-experiments/libheif-js, LGPL-3.0)
// 对应源码:https://registry.npmjs.org/libheif-js/-/libheif-js-1.23.2.tgz
// 许可与出处:本站 /licenses/ · 完整许可文本:vendor/heic/LICENSE-libheif.txt
// 供应链:该 tarball 的 sha1/sha512 与 npm registry 公布值逐位核对一致(见内部文档)。

var _loading = null;
var _lib = null;

// 只加载一次;加载失败要把状态清掉,否则用户点第二次会撞同一个失败的 promise
export function loadHeicDecoder(onProgress) {
  if (_lib) return Promise.resolve(_lib);
  if (_loading) return _loading;
  _loading = new Promise(function (resolve, reject) {
    var script = document.createElement('script');
    // 用 bundle 变体:wasm 以 base64 内嵌在同一文件里。
    // 拆开的 libheif.js + libheif.wasm 在这套构建里会尝试**同步**取 wasm,浏览器里直接报
    // "sync fetching of the wasm failed" —— 所以按上游给的浏览器用法走 bundle。
    script.src = '/vendor/heic/libheif-bundle.js';
    script.async = true;
    var settled = false;
    var timer = setTimeout(function () {
      if (settled) return;
      settled = true; _loading = null;
      reject(new Error('解码器加载超时'));
    }, 30000);
    script.onload = function () {
      if (settled) return;
      clearTimeout(timer); settled = true;
      var g = window.libheif;
      if (!g) { _loading = null; reject(new Error('解码器加载后没有暴露接口')); return; }
      // 这个 UMD 的默认导出是 Emscripten 的模块工厂函数:要调用一次(返回 Promise)才拿到带 HeifDecoder 的实例
      if (typeof g === 'function') {
        Promise.resolve(g()).then(function (m) {
          if (!m || !m.HeifDecoder) { _loading = null; reject(new Error('解码器初始化后没有 HeifDecoder')); return; }
          _lib = m; resolve(m);
        }, function (e) { _loading = null; reject(e); });
        return;
      }
      if (!g.HeifDecoder) { _loading = null; reject(new Error('解码器没有 HeifDecoder')); return; }
      _lib = g;
      resolve(g);
    };
    script.onerror = function () {
      if (settled) return;
      clearTimeout(timer); settled = true; _loading = null;
      reject(new Error('解码器下载失败(可能是断网或脚本被拦)'));
    };
    if (onProgress) onProgress('正在下载本地解码器(约 1.4MB)…');
    document.head.appendChild(script);
  });
  return _loading;
}

// HEIC/HEIF 字节 → RGBA 像素
function decodeWith(lib, bytes) {
  var decoder = new lib.HeifDecoder();
  var images = decoder.decode(bytes);
  if (!images || !images.length) throw new Error('这个 HEIC 解不开(可能是不支持的编码)');
  var image = images[0];
  var width = image.get_width(), height = image.get_height();
  var data = new Uint8ClampedArray(width * height * 4);
  return new Promise(function (resolve, reject) {
    try {
      image.display({ data: data, width: width, height: height }, function (out) {
        if (!out) { reject(new Error('解码失败')); return; }
        resolve({ data: data, width: width, height: height });
      });
    } catch (e) { reject(e); }
  });
}

// 对外:File → JPEG File(文件名换成 .jpg),交给各工具现有流程
export async function heicToJpeg(file, onProgress) {
  var lib = await loadHeicDecoder(onProgress);
  if (onProgress) onProgress('正在本地解码(不上传)…');
  var buf = new Uint8Array(await file.arrayBuffer());
  var img = await decodeWith(lib, buf);
  var c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  var g = c.getContext('2d');
  var id = new ImageData(img.data, img.width, img.height);
  g.putImageData(id, 0, 0);
  var blob = await new Promise(function (r) { c.toBlob(r, 'image/jpeg', 0.95); });
  if (!blob) throw new Error('转成 JPG 失败');
  var name = String(file.name || 'photo.heic').replace(/\.(heic|heif)$/i, '') + '.jpg';
  return { file: new File([blob], name, { type: 'image/jpeg' }), width: img.width, height: img.height, bytes: blob.size };
}

export function heicDecoderAvailable() { return !!_lib; }
