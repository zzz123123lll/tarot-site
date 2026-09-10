/**
 * 本文件是 @jsquash/webp 的 encode.js 的自托管改写版(原文件保留未动)。
 * 改写原因(仅此两处):
 *   1. 原版 import { simd } from 'wasm-feature-detect' 是裸模块说明符,纯静态站没有打包器,浏览器无法解析;
 *   2. 原版在 SIMD 可用时会加载 codec/enc/webp_enc_simd.js/.wasm,我们只自托管了非 SIMD 的 webp_enc.wasm。
 * 其余逻辑与上游一致。许可证:Apache-2.0(与上游 @jsquash/webp、Squoosh 相同)。
 */
import { defaultOptions } from './meta.js';
import { initEmscriptenModule } from './utils.js';
import webpEncoder from './codec/enc/webp_enc.js';
let emscriptenModule;
export async function init(module, moduleOptionOverrides) {
    let actualModule = module;
    let actualOptions = moduleOptionOverrides;
    if (arguments.length === 1 && !(module instanceof WebAssembly.Module)) {
        actualModule = undefined;
        actualOptions = module;
    }
    emscriptenModule = initEmscriptenModule(webpEncoder, actualModule, actualOptions);
    return emscriptenModule;
}
export default async function encode(data, options = {}) {
    if (!emscriptenModule)
        emscriptenModule = init();
    const _options = { ...defaultOptions, ...options };
    const module = await emscriptenModule;
    const result = module.encode(data.data, data.width, data.height, _options);
    if (!result)
        throw new Error('Encoding error.');
    return result.buffer;
}
