// 目录页渲染器：/ai/notes/ 与 /ai/notes/<track>/ 都从 content/tracks 生成。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TRACK_ORDER = ['prompt', 'rag', 'agents'];
const SHORT = { prompt: '提示词工程', rag: 'RAG 知识库', agents: 'AI Agent' };
const KICKER = { prompt: '01 / PROMPT ENGINEERING', rag: '02 / RAG / KNOWLEDGE BASE', agents: '03 / AI AGENTS' };

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function readTracks() {
  return TRACK_ORDER.map((id) => JSON.parse(fs.readFileSync(path.join(ROOT, 'content/tracks', id + '.json'), 'utf8')));
}
function pdf(track) {
  return 'mailto:1336089899@qq.com?subject=' + encodeURIComponent('索取《' + track.title + '》完整 PDF');
}
function head(title, description, canonical) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="/og-knowledge.png">
<link rel="icon" href="/favicon.ico">
<link rel="stylesheet" href="/ai/notes/notes.css?v=4">
<script src="/ai/notes/notes.js?v=5" defer></script>
</head>`;
}
function shellHeader() {
  return `<a class="skip" href="#main">跳到主要内容</a>
<div class="read-progress"></div>
<header class="wrap top">
  <a class="brand" href="/">AI 实战通关 <small>KNOWLEDGE BASE</small></a>
  <nav class="nav" aria-label="主导航">
    <a href="/ai/notes/">全部课程</a>
    <a class="hide-s" href="/#practice">怎么练</a>
    <a class="cta" href="mailto:1336089899@qq.com?subject=%E7%B4%A2%E5%8F%96%20AI%20%E5%AE%9E%E6%88%98%E9%80%9A%E5%85%B3%20PDF&amp;body=%E6%88%91%E6%83%B3%E8%8E%B7%E5%8F%96%E5%AE%8C%E6%95%B4%20PDF%EF%BC%8C%E6%88%91%E7%9A%84%E9%82%AE%E7%AE%B1%E6%98%AF%EF%BC%9A">获取 PDF</a>
  </nav>
</header>`;
}
function footer() {
  return `<footer class="wrap">
  <span>AI 实战通关 · 2026</span>
  <span>免费 · 不登录 · 不卖 API</span>
</footer>`;
}

function renderIndex(tracks) {
  const cards = tracks.map((t, i) => {
    const n = t.levels.length;
    return `<a class="series-card" href="/ai/notes/${esc(t.id)}/" data-series="${esc(t.id)}" data-total="${n}">
  <span class="num">${KICKER[t.id]}</span>
  <h3>${esc(SHORT[t.id])}</h3>
  <p>${esc(t.subtitle)}</p>
  <span class="meta-line"><span>${n} 关 · 免费</span><span data-series-progress>0 / ${n} 完成</span><span>开始阅读 ↗</span></span>
</a>`;
  }).join('');
  const total = tracks.reduce((s, t) => s + t.levels.length, 0);
  const page = `${head('AI 实战通关笔记 — 26 关免费练习', '提示词工程、RAG、AI Agent 三套实战练习册，26 关免费阅读与自动检查。', 'https://gongjuhe.top/ai/notes/')}
<body>
${shellHeader()}
<main id="main">
<section class="wrap hero">
  <p class="label">AI KNOWLEDGE BASE / 2026</p>
  <h1>三套练习册，<br>按关卡读。</h1>
  <p class="lead">提示词、RAG、Agent。每关一个具体问题，先读原理，再动手，最后对答案。网页免费；完整 PDF 留邮箱发。</p>
  <div class="hero-meta"><span>${total} 关</span><span>全部免费</span><span>可在站内做题</span><span data-overall>0 / ${total} 关完成</span></div>
</section>
<section class="wrap section">
  <div class="section-head"><div><p class="label">THE TRACKS / 三条通关线</p><h2>从哪一条开始？</h2></div><a href="/">回到知识库 →</a></div>
  <div class="series-grid">${cards}</div>
</section>
<section class="wrap section">
  <div class="section-head"><div><p class="label">HOW TO USE / 怎么读</p><h2>先做，再对答案。</h2></div></div>
  <div class="series-grid">
    <div class="series-card"><span class="num">01 / READ</span><h3>读原理</h3><p>每关先讲清楚为什么，再给踩坑写法和更高手的写法。不要背模板，先理解结构。</p><span class="meta-line"><span>约 3–5 分钟</span></span></div>
    <div class="series-card"><span class="num">02 / DO</span><h3>动手改写</h3><p>每关有一道客观题和一道实操题。客观题即时判对错；实操题按评分项给部分分和缺项。</p><span class="meta-line"><span>答案存在本机浏览器</span></span></div>
    <div class="series-card"><span class="num">03 / REVIEW</span><h3>对答案</h3><p>客观题显示正确答案和解释；实操题打开参考答案，逐项对照评分项。</p><span class="meta-line"><span>${total} 关 · 全部免费</span></span></div>
  </div>
</section>
<section class="wrap section">
  <div class="section-head"><div><p class="label">PDF / 完整版</p><h2>网页免费，PDF 留邮箱。</h2></div></div>
  <div class="pdf-strip"><p>三套完整练习册 PDF，整理好后按顺序发。只用于个人学习，不转售。</p><a href="mailto:1336089899@qq.com?subject=%E7%B4%A2%E5%8F%96%20AI%20%E5%AE%9E%E6%88%98%E9%80%9A%E5%85%B3%20PDF&amp;body=%E6%88%91%E6%83%B3%E8%8E%B7%E5%8F%96%E5%AE%8C%E6%95%B4%20PDF%EF%BC%8C%E6%88%91%E7%9A%84%E9%82%AE%E7%AE%B1%E6%98%AF%EF%BC%9A">留邮箱获取 PDF ↗</a></div>
</section>
</main>
${footer()}
</body>
</html>
`;
  const out = path.join(ROOT, 'ai/notes/index.html');
  fs.writeFileSync(out, page, 'utf8');
  return out;
}

function renderTrack(t) {
  const n = t.levels.length;
  const rows = t.levels.map((l) => `<a class="level-row" href="${esc(l.href)}" data-url="${esc(l.href)}">
  <span class="num">${String(l.level).padStart(2, '0')}</span>
  <span><h3>${esc(l.title)}</h3><p>${esc(l.summary)}</p></span>
  <span class="time">${l.readMinutes} 分钟</span>
</a>`).join('');
  const page = `${head(t.title + ' — AI 实战通关', t.subtitle, 'https://gongjuhe.top/ai/notes/' + t.id + '/')}
<body>
${shellHeader()}
<main id="main">
<section class="wrap track-head">
  <p class="label">${esc(t.label)} / ${n} 关</p>
  <h1>${esc(t.title)}</h1>
  <p class="lead">${esc(t.subtitle)}</p>
  <p class="source">课程来源：${esc(t.source)}</p>
  <div class="track-progress" data-track="${esc(t.id)}" data-total="${n}"><span data-track-count>0 / ${n} 完成</span><span class="bar"><i></i></span></div>
</section>
<section class="wrap section">
  <div class="section-head"><div><p class="label">LEVELS / 关卡</p><h2>按顺序读，或先挑你需要的那关。</h2></div></div>
  <div class="level-list">${rows}</div>
  <div class="pdf-strip"><p>想一次拿走整套？网页免费，完整 PDF 留邮箱发。</p><a href="${pdf(t)}">留邮箱获取 PDF ↗</a></div>
</section>
</main>
${footer()}
</body>
</html>
`;
  const out = path.join(ROOT, 'ai/notes', t.id, 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, page, 'utf8');
  return out;
}

export function renderCatalog() {
  const tracks = readTracks();
  const index = renderIndex(tracks);
  const pages = tracks.map(renderTrack);
  return [index, ...pages];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(renderCatalog().map((p) => 'BUILT ' + path.relative(ROOT, p)).join('\n'));
}
