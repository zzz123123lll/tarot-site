// 本地链接检查：验证生成的 HTML 页面内部链接、脚本和资源都存在。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const pages = [
  'index.html', '404.html', 'offline.html',
  'ai/notes/index.html', 'ai/notes/guide/index.html', 'ai/notes/search/index.html',
  'ai/notes/review/index.html', 'ai/notes/privacy/index.html', 'ai/notes/progress/index.html',
  'ai/notes/neigong/index.html', 'ai/notes/rag/index.html',
  'ai/notes/agents/index.html', 'ai/notes/llm/index.html', 'ai/notes/tools/index.html',
  'ai/notes/rag/01.html', 'ai/notes/neigong/01.html', 'ai/notes/tools/01.html'
];
const skip = /^(#|mailto:|tel:|javascript:|https?:\/\/)/i;
const missing = [];

function localPath(url) {
  if (!url.startsWith('/')) return null;
  if (url.startsWith('/cdn-cgi/')) return null;
  const clean = url.split('#')[0].split('?')[0];
  const candidates = [];
  if (clean.endsWith('/')) candidates.push(clean + 'index.html');
  else {
    candidates.push(clean);
    if (!path.extname(clean)) { candidates.push(clean + '.html'); candidates.push(clean + '/index.html'); }
  }
  return candidates.map((x) => path.join(ROOT, x));
}

for (const rel of pages) {
  const file = path.join(ROOT, rel);
  assert(fs.existsSync(file), 'missing page ' + rel);
  const html = fs.readFileSync(file, 'utf8');
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = m[1];
    if (skip.test(url)) continue;
    const candidates = localPath(url);
    if (!candidates) continue;
    if (!candidates.some((p) => fs.existsSync(p))) missing.push(rel + ' -> ' + url);
  }
}
assert.equal(missing.length, 0, 'missing internal targets:\n' + missing.join('\n'));
console.log('PASS internal links/assets', pages.length, 'pages');
