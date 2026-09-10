// 全站页面渲染审计清单
const fs = require('fs');
const pages = [
  ['home', '工具盒 - 免费在线工具箱', 'apps', '搜索工具'],
  ['tarot', '星辉塔罗 · 免费在线塔罗占卜', 'heroCta', '开始一次占卜'],
  ['img-compress', '图片压缩', 'tool-h1', '预设'],
  ['image-convert', '图片转换', 'tool-h1', '输出格式'],
  ['images-to-pdf', '图片合成 PDF', 'tool-h1', '适应图片'],
  ['pdf-merge', 'PDF 合并', 'tool-h1', '合并并下载'],
  ['pdf-split', 'PDF 拆分/旋转', 'tool-h1', '页面范围'],
  ['pdf-render', 'PDF 转图片', 'tool-h1', 'DPI'],
  ['pdf-compress', 'PDF 压缩', 'tool-h1', '预设'],
  ['json', 'JSON 格式化', 'tool-h1', '格式化'],
  ['base64', 'Base64 编解码', 'tool-h1', '编码'],
  ['regex', '正则测试', 'tool-h1', '正则'],
  ['color', '颜色工具', 'tool-h1', 'HEX'],
  ['qr', '二维码生成', 'tool-h1', '二维码'],
  ['jwt', 'JWT 解码', 'tool-h1', '解码'],
  ['hash', 'Hash 摘要', 'tool-h1', '计算'],
  ['url', 'URL 编解码', 'tool-h1', '编码'],
  ['uuid', 'UUID / 密码', 'tool-h1', '生成 1 个'],
  ['date', '日期 & 时间戳', 'tool-h1', '时间戳'],
];
let pass = 0, fail = 0;
for (const [slug, titleKw, markerId, contentKw] of pages) {
  const file = __dirname + '/_a-' + slug + '.html';
  if (!fs.existsSync(file)) { console.log('MISS', slug, '(无 dump 文件)'); fail++; continue; }
  const html = fs.readFileSync(file, 'utf8');
  const problems = [];
  const title = (html.match(/<title>([^<]+)<\/title>/) || [])[1] || '';
  if (!title.includes(titleKw)) problems.push('标题不符: ' + title.slice(0, 40));
  if (!html.includes('id="' + markerId + '"') && !html.includes(markerId)) problems.push('缺少元素: ' + markerId);
  if (!html.includes(contentKw)) problems.push('缺少文案: ' + contentKw);
  if (html.includes('工具加载失败') || html.includes('工具未找到')) problems.push('挂载失败标志');
  if (problems.length) { fail++; console.log('FAIL', slug, '|', problems.join(' | ')); }
  else { pass++; console.log('PASS', slug, '|', title.slice(0, 42)); }
}
console.log('\n结果:', pass, '通过 /', fail, '失败 /', pages.length, '总计');
