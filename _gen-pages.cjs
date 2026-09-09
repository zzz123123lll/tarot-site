// 一次性生成器：为 17 个工具生成独立静态页(SEO 用)。跑完删除。
const fs = require('fs');
const path = require('path');
const base = __dirname + '/';
const T = [
  ['img-compress', 'img-compress/index.html', '图片压缩 - 在线批量瘦身图片 · 工具盒', '批量瘦身图片，三档预设，没压更小就跳过。免费在线，纯本地运行，数据不出你的浏览器。', 'https://gongjuhe.top/img-compress/'],
  ['image-convert', 'image-convert/index.html', '图片转换 - 在线缩放与格式互转 · 工具盒', '缩放尺寸 + PNG/JPG/WebP 格式互转。免费在线，纯本地运行，数据不出你的浏览器。', 'https://gongjuhe.top/image-convert/'],
  ['images-to-pdf', 'images-to-pdf/index.html', '图片合成 PDF - 多图合并成一个 PDF · 工具盒', '多张图片合成一个 PDF，免费在线，纯本地运行，数据不出你的浏览器。', 'https://gongjuhe.top/images-to-pdf/'],
  ['pdf-merge', 'pdf-merge/index.html', 'PDF 合并 - 多个文件合成一个 · 工具盒', '多个 PDF 按顺序合成一个。免费在线，纯本地运行，数据不出你的浏览器。', 'https://gongjuhe.top/pdf-merge/'],
  ['pdf-split', 'pdf-split/index.html', 'PDF 拆分/旋转 - 提取页面 · 工具盒', '提取页面、拆分、旋转 PDF。免费在线，纯本地运行，数据不出你的浏览器。', 'https://gongjuhe.top/pdf-split/'],
  ['pdf-render', 'pdf-render/index.html', 'PDF 转图片 - JPG/PNG 可调 DPI · 工具盒', 'PDF 转 JPG/PNG（可调 DPI）。免费在线，纯本地运行，数据不出你的浏览器。', 'https://gongjuhe.top/pdf-render/'],
  ['pdf-compress', 'pdf-compress/index.html', 'PDF 压缩 - 在线瘦身扫描件 · 工具盒', '扫描件/图片型 PDF 瘦身。免费在线，纯本地运行，数据不出你的浏览器。', 'https://gongjuhe.top/pdf-compress/'],
  ['json', 'tools/json/index.html', 'JSON 格式化 - 美化校验压缩 · 工具盒', '美化、校验、压缩 JSON。免费在线，纯本地运行，数据不出你的浏览器。', 'https://gongjuhe.top/tools/json/'],
  ['base64', 'tools/base64/index.html', 'Base64 编解码 - 文本在线互转 · 工具盒', '文本与 Base64 互转。免费在线，纯本地运行，数据不出你的浏览器。', 'https://gongjuhe.top/tools/base64/'],
  ['regex', 'tools/regex/index.html', '正则测试 - 在线正则匹配 · 工具盒', '正则表达式实时匹配。免费在线，纯本地运行，数据不出你的浏览器。', 'https://gongjuhe.top/tools/regex/'],
  ['color', 'tools/color/index.html', '颜色工具 - RGB/HEX/HSL 互转 · 工具盒', 'RGB / HEX / HSL 互转。免费在线，纯本地运行，数据不出你的浏览器。', 'https://gongjuhe.top/tools/color/'],
  ['qr', 'tools/qr/index.html', '二维码生成 - 文字链接转二维码 · 工具盒', '文字/链接生成二维码。免费在线，纯本地运行，数据不出你的浏览器。', 'https://gongjuhe.top/tools/qr/'],
  ['jwt', 'tools/jwt/index.html', 'JWT 解码 - 在线解析检查过期 · 工具盒', '解码 JWT、检查过期。免费在线，纯本地运行，数据不出你的浏览器。', 'https://gongjuhe.top/tools/jwt/'],
  ['hash', 'tools/hash/index.html', 'Hash 摘要 - SHA/MD5 文本与文件 · 工具盒', 'SHA / MD5，文本与文件。免费在线，纯本地运行，数据不出你的浏览器。', 'https://gongjuhe.top/tools/hash/'],
  ['url', 'tools/url/index.html', 'URL 编解码 - 在线解析 query · 工具盒', '编解码、query 解析。免费在线，纯本地运行，数据不出你的浏览器。', 'https://gongjuhe.top/tools/url/'],
  ['uuid', 'tools/uuid/index.html', 'UUID / 密码生成 - 随机批量 · 工具盒', '生成 UUID 和随机密码。免费在线，纯本地运行，数据不出你的浏览器。', 'https://gongjuhe.top/tools/uuid/'],
  ['date', 'tools/date/index.html', '日期 & 时间戳 - 计算与互转 · 工具盒', '日期差、加减、时间戳互转。免费在线，纯本地运行，数据不出你的浏览器。', 'https://gongjuhe.top/tools/date/'],
];
const page = (title, desc, canon) => '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<meta name="theme-color" content="#ffffff">\n<title>' + title + '</title>\n<meta name="description" content="' + desc + '">\n<link rel="canonical" href="' + canon + '">\n<meta property="og:title" content="' + title + '">\n<meta property="og:description" content="' + desc + '">\n<meta property="og:type" content="website">\n<meta property="og:image" content="https://gongjuhe.top/og.png">\n<meta property="og:url" content="' + canon + '">\n<link rel="manifest" href="/manifest.webmanifest">\n<link rel="apple-touch-icon" href="/icons/icon-192.png">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-title" content="工具盒">\n<link rel="stylesheet" href="/fonts.css?v=1">\n<link rel="stylesheet" href="/tool.css?v=5">\n</head>\n<body>\n<nav class="tool-nav">\n  <a href="/">&#8592; 工具盒</a>\n  <span class="tool-nav-title" id="toolTitle"></span>\n</nav>\n<div class="tool-container" id="toolRoot"></div>\n<script type="module">\nimport { mountTool } from \'/shared/toolkit.js?v=5\';\nfunction slugFromPath() {\n  var p = (location.pathname || \'\').replace(/^\\/+|\\/+$/g, \'\');\n  if (p.indexOf(\'tools/\') === 0) p = p.slice(6);\n  return p;\n}\nmountTool(slugFromPath(), document.getElementById(\'toolRoot\'), document.getElementById(\'toolTitle\'));\n</script>\n<script>\nif (\'serviceWorker\' in navigator && location.protocol === \'https:\') {\n  window.addEventListener(\'load\', function () { navigator.serviceWorker.register(\'/sw.js\'); });\n}\n</script>\n</body>\n</html>\n';
let n = 0;
for (const [slug, rel, title, desc, canon] of T) {
  const dir = path.dirname(base + rel);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(base + rel, page(title, desc, canon), 'utf8');
  n++;
}
console.log('生成页面:', n);

// sitemap
const today = new Date().toISOString().slice(0, 10);
const urls = ['https://gongjuhe.top/', 'https://gongjuhe.top/tarot/', ...T.map(t => t[4])];
fs.writeFileSync(base + 'sitemap.xml',
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  + urls.map(u => '  <url><loc>' + u + '</loc><lastmod>' + today + '</lastmod><changefreq>weekly</changefreq><priority>' + (u === 'https://gongjuhe.top/' ? '1.0' : '0.7') + '</priority></url>').join('\n')
  + '\n</urlset>\n', 'utf8');
console.log('sitemap 条目:', urls.length);

fs.writeFileSync(base + 'robots.txt', 'User-agent: *\nAllow: /\n\nSitemap: https://gongjuhe.top/sitemap.xml\n', 'utf8');
console.log('robots.txt 已写');

fs.writeFileSync(base + '404.html', '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>页面未找到 · 工具盒</title>\n<link rel="stylesheet" href="/fonts.css?v=1">\n<style>body{margin:0;font-family:"Geist",-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;color:#1d1d1f;background:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center}main{text-align:center;padding:24px}h1{font-size:22px;margin:0 0 8px}p{color:#6e6e73;font-size:14px;margin:0 0 24px}a{display:inline-block;background:#0071e3;color:#fff;text-decoration:none;font-size:14px;padding:10px 20px;border-radius:10px}</style>\n</head>\n<body>\n<main>\n<h1>页面未找到</h1>\n<p>这个工具不在盒子里,回首页看看吧。</p>\n<a href="/">← 回到工具盒</a>\n</main>\n</body>\n</html>\n', 'utf8');
console.log('404.html 已写');
