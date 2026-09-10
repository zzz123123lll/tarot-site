工具盒 vendor/encoders —— 图片编码器(自托管,不依赖任何第三方 CDN 或运行时)
================================================================

用途:图片压缩 / 图片转换使用真实编码器(mozjpeg、libwebp、squoosh-png),全部在浏览器里
的 Web Worker 中运行,文件不经过任何服务器。

来源与版本(按文件字节数核对过,与下列 npm 发布版完全一致)
  jpeg/   @jsquash/jpeg 1.6.0   mozjpeg_enc.wasm 251,524 字节
  webp/   @jsquash/webp 1.5.0   webp_enc.wasm    281,261 字节
  png/    @jsquash/png  3.1.1   squoosh_png_bg.wasm 181,088 字节

上游项目
  Squoosh        https://github.com/GoogleChromeLabs/squoosh        Apache-2.0
  jSquash        https://github.com/jamsinclair/jSquash             Apache-2.0
  其中 mozjpeg  https://github.com/mozilla/mozjpeg                  BSD/IJG
       libwebp  https://chromium.googlesource.com/webm/libwebp      BSD
       png crate(Rust) https://github.com/image-rs/image-png        MIT/Apache-2.0
许可证全文见 https://www.apache.org/licenses/LICENSE-2.0

本地改动(仅一处,原文件保持原样)
  webp/encode-local.js
    @jsquash/webp 原版 encode.js 里 import { simd } from 'wasm-feature-detect' 是裸模块
    说明符,纯静态站没有打包器,浏览器无法解析;并且 SIMD 分支会加载我们未自托管的
    webp_enc_simd.wasm。因此新增了这个本地入口,去掉这两点,其余逻辑与上游一致。
    webp/encode.js 原文件保留未动,便于日后比对。

维护约定
  1. 升级编码器时先核对 wasm 字节数,并同步更新本文件的版本号;
  2. 新增或修改 shared/ 下的脚本时,记得同时调整引用处的 ?v=N(Service Worker 会缓存 /shared/);
  3. 不要引入 AGPL 组件(例如 Ghostscript),也不要引入任何需要联网的编码服务。
