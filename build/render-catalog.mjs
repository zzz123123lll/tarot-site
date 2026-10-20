// 目录页渲染器：/ai/notes/ 与两个总系列页都从 content/tracks 生成。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ALL_TRACKS = ['neigong', 'rag', 'agents', 'llm', 'tools'];
const TOP_ORDER = ['neigong', 'tools'];
const SHORT = { neigong: '内功心法', tools: '神兵利器' };
const NEIGONG_TOTAL = 28;
const TOOLS_TOTAL = 8;
const BRAND = 'AI神功';

const NEIGONG_BOOKS = [
  { id: '01', title: '大语言模型底层运作原理', href: '/ai/notes/neigong/01', count: 1, desc: '分词、向量、注意力、采样与三阶段训练。' },
  { id: '02', title: '提示词工程科学', href: '/ai/notes/neigong/02', count: 1, desc: '用条件概率收窄空间：角色、XML 边界、少样本。' },
  { id: '03', title: '深度推理模型与思维链', href: '/ai/notes/neigong/03', count: 1, desc: 'Test-Time Compute、CoT、GRPO 与混合推理。' },
  { id: '04', title: '上下文工程与幻觉控制', href: '/ai/notes/neigong/04', count: 1, desc: '窗口、KV Cache、迷失中间与证据边界。' },
  { id: '05', title: 'RAG 检索增强生成', href: '/ai/notes/rag/', count: 8, desc: '从余弦相似度到 GraphRAG 与量化评估，8 个模块。' },
  { id: '06', title: 'AI Agent 智能体', href: '/ai/notes/agents/', count: 8, desc: 'ReAct、工具调用、规划、记忆与多智能体。' },
  { id: '07', title: '模型定制与算力量化', href: '/ai/notes/llm/', count: 8, desc: 'SFT、LoRA/QLoRA、DPO、量化与 vLLM。' },
];

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function readTrack(id) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'content/tracks', id + '.json'), 'utf8'));
}
function pdf(track) {
  return 'mailto:1336089899@qq.com?subject=' + encodeURIComponent('索取《' + track.title + '》完整 PDF');
}
function head(title, description, canonical, noindex = false) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex,follow">' : ''}
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="https://gongjuhe.top/og-knowledge.png?v=2"
<meta property="og:image:alt" content="AI神功：内功心法 × 神兵利器，15 册 36 关">>
<link rel="icon" href="/favicon.ico">
<link rel="stylesheet" href="/ai/notes/notes.css?v=12">
<script src="/ai/notes/notes.js?v=8" defer></script>
</head>`;
}
function shellHeader() {
  return `<a class="skip" href="#main">跳到主要内容</a>
<div class="read-progress"></div>
<header class="wrap top">
  <a class="brand" href="/">${BRAND} <small>KNOWLEDGE BASE</small></a>
  <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" data-nav-toggle>菜单</button>
  <nav class="nav" id="site-nav" aria-label="主导航">
    <a href="/ai/notes/">全部课程</a>
    <a class="hide-s" href="/ai/notes/search/">搜索</a>
    <a class="hide-s" href="/#guide">学习路线</a>
    <a class="hide-s" href="/ai/notes/review/">错题本</a>
    <a class="hide-s" href="/#practice">怎么练</a>
    <a class="cta" href="mailto:1336089899@qq.com?subject=%E7%B4%A2%E5%8F%96%20AI%E7%A5%9E%E5%8A%9F%20PDF&amp;body=%E6%88%91%E6%83%B3%E8%8E%B7%E5%8F%96%E5%AE%8C%E6%95%B4%20PDF%EF%BC%8C%E6%88%91%E7%9A%84%E9%82%AE%E7%AE%B1%E6%98%AF%EF%BC%9A">获取 PDF</a>
  </nav>
</header>`;
}
function footer() {
  return `<footer class="wrap">
  <span>${BRAND} · 2026</span>
  <span><a href="/ai/notes/privacy/">隐私说明</a> · 免费 · 不登录 · 不卖 API</span>
</footer>`;
}

function renderIndex() {
  const page = `${head('全部课程 — AI神功', '内功心法 7 册（28 讲）+ 神兵利器 8 册（8 讲），从底层原理到工具实战的完整 AI 学习路线。', 'https://gongjuhe.top/ai/notes/')}
<body>
${shellHeader()}
<main id="main">
<section class="wrap hero">
  <p class="label">AI 现代必修课 / 2026</p>
  <h1>两套功夫，<br>把 AI 练成自己的。</h1>
  <p class="lead">先修内功心法：原理、提示词、推理、上下文、RAG、Agent、模型定制；再拿神兵利器：8 个主流 AI 工具。每关先读原理，再动手，最后自动检查。</p>
  <div class="hero-meta"><span>2 大系列</span><span>15 册</span><span>36 关</span><span>全部免费</span><span data-overall>0 / 36 关完成</span></div>
</section>
<section class="wrap section">
  <div class="section-head"><div><p class="label">THE SERIES / 两大系列</p><h2>先内功，后利器。</h2></div><a href="/">回到总目录 →</a></div>
  <div class="series-grid">
    <a class="series-card" href="/ai/notes/neigong/" data-series="neigong" data-prefixes="/ai/notes/neigong/,/ai/notes/rag/,/ai/notes/agents/,/ai/notes/llm/" data-total="28">
      <span class="num">01 / 内功心法</span>
      <h3>内功心法</h3>
      <p>7 册：LLM 底层、提示词、深度推理、上下文工程、RAG、Agent、模型定制。共 28 讲。</p>
      <span class="meta-line"><span>7 册 · 28 关</span><span data-series-progress>0 / 28 完成</span><span>展开 ↗</span></span>
    </a>
    <a class="series-card" href="/ai/notes/tools/" data-series="tools" data-total="8">
      <span class="num">02 / 神兵利器</span>
      <h3>神兵利器</h3>
      <p>8 册：云端模型、Deep Research、Cursor、终端 Agent、MCP、Dify、n8n、本地 RAG。</p>
      <span class="meta-line"><span>8 册 · 8 关</span><span data-series-progress>0 / 8 完成</span><span>展开 ↗</span></span>
    </a>
  </div>
</section>
<section class="wrap section">
  <div class="section-head"><div><p class="label">HOW TO USE / 怎么读</p><h2>先做，再对答案。</h2></div></div>
  <div class="series-grid">
    <div class="series-card"><span class="num">01 / READ</span><h3>读原理</h3><p>每关先讲清楚为什么，再给来源任务和拆解。不要背模板，先理解结构。</p><span class="meta-line"><span>约 3–5 分钟</span></span></div>
    <div class="series-card"><span class="num">02 / DO</span><h3>动手改写</h3><p>每关有客观题和实操题。客观题即时判对错；实操题按评分项给部分分和缺项。</p><span class="meta-line"><span>答案存在本机浏览器</span></span></div>
    <div class="series-card"><span class="num">03 / REVIEW</span><h3>对答案</h3><p>客观题显示正确答案和解释；实操题打开参考答案，逐项对照评分项。</p><span class="meta-line"><span>36 关 · 全部免费</span></span></div>
  </div>
</section>
<section class="wrap section">
  <div class="section-head"><div><p class="label">PDF / 完整版</p><h2>网页免费，PDF 留邮箱。</h2></div></div>
  <div class="pdf-strip"><p>十五册完整 PDF，整理好后按顺序发。只用于个人学习，不转售。</p><a href="mailto:1336089899@qq.com?subject=%E7%B4%A2%E5%8F%96%20AI%E7%A5%9E%E5%8A%9F%20PDF&amp;body=%E6%88%91%E6%83%B3%E8%8E%B7%E5%8F%96%E5%AE%8C%E6%95%B4%20PDF%EF%BC%8C%E6%88%91%E7%9A%84%E9%82%AE%E7%AE%B1%E6%98%AF%EF%BC%9A">留邮箱获取 PDF ↗</a></div>
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

function renderNeigong() {
  const cards = NEIGONG_BOOKS.map((b) => `<a class="series-card" href="${esc(b.href)}" data-book-prefix="${esc(b.href)}" data-book-total="${b.count}">
  <span class="num">内功${b.id}</span>
  <h3>${esc(b.title)}</h3>
  <p>${esc(b.desc)}</p>
  <span class="meta-line"><span>${b.count === 1 ? '单册 · 1 讲' : b.count + ' 关'}</span><span data-book-progress>0 / ${b.count} 完成</span><span>开始阅读 ↗</span></span>
</a>`).join('');
  const page = `${head('内功心法 — AI神功', '内功心法 7 册：LLM 底层、提示词、深度推理、上下文工程、RAG、Agent、模型定制。', 'https://gongjuhe.top/ai/notes/neigong/')}
<body>
${shellHeader()}
<main id="main">
<section class="wrap track-head">
  <p class="label">INNER CRAFT / 7 BOOKS / 28 讲</p>
  <h1>内功心法</h1>
  <p class="lead">先修底层原理，再进入 RAG、Agent 与模型定制。7 册不是 7 个孤立的课，而是一条从“看懂模型”到“改造模型”的线。</p>
  <p class="source">课程来源：AI 现代必修课 · 内功心法篇（7 册）</p>
  <div class="track-progress" data-track="neigong" data-total="28"><span data-track-count>0 / 28 完成</span><span class="bar"><i></i></span></div>
  <div class="resume" data-resume hidden></div>
</section>
<section class="wrap section">
  <div class="section-head"><div><p class="label">BOOKS / 七册</p><h2>按顺序读，或先挑你需要的那一册。</h2></div><a href="/#guide">完整学习路线 →</a></div>
  <div class="series-grid">${cards}</div>
</section>
<section class="wrap section">
  <div class="pdf-strip"><p>内功心法 7 册，网页免费；完整 PDF 留邮箱发。</p><a href="mailto:1336089899@qq.com?subject=%E7%B4%A2%E5%8F%96%20AI%E7%A5%9E%E5%8A%9F%20%E5%86%85%E5%8A%9F%E5%BF%83%E6%B3%95%20PDF">留邮箱获取 PDF ↗</a></div>
</section>
</main>
${footer()}
</body>
</html>
`;
  const out = path.join(ROOT, 'ai/notes/neigong/index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
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
  const page = `${head(t.title + ' — AI神功', t.subtitle, 'https://gongjuhe.top/ai/notes/' + t.id + '/')}
<body>
${shellHeader()}
<main id="main">
<section class="wrap track-head">
  <p class="label">${esc(t.label)} / ${n} 关</p>
  <h1>${esc(t.title)}</h1>
  <p class="lead">${esc(t.subtitle)}</p>
  <p class="source">课程来源：${esc(t.source)}</p>
  <p class="source"><a href="${t.id === 'tools' ? '/ai/notes/' : '/ai/notes/neigong/'}">${t.id === 'tools' ? '← 回到全部课程' : '← 回到内功心法'}</a></p>
  <div class="track-progress" data-track="${esc(t.id)}" data-total="${n}"><span data-track-count>0 / ${n} 完成</span><span class="bar"><i></i></span></div>
</section>
${t.introHtml ? `<section class="wrap section"><div class="book-intro"><details><summary>本册导读 · 顿悟时刻</summary><div class="book-intro-body">${t.introHtml}</div></details></div></section>` : ''}
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


function renderSearch() {
  const page = `${head('搜索 — AI神功', '搜索 AI神功 的 15 册、36 关课程；按标题、摘要和来源精读关键词查找。', 'https://gongjuhe.top/ai/notes/search/', true)}
<body>
${shellHeader()}
<main id="main">
<section class="wrap track-head">
  <p class="label">SEARCH / 藏经阁</p>
  <h1>搜索课程</h1>
  <p class="lead">输入关键词，搜 15 册 / 36 关的标题、摘要与来源精读。</p>
</section>
<section class="wrap section">
  <div class="search-panel">
    <label class="search-label" for="search-input">SEARCH</label>
    <input id="search-input" class="search-input" type="search" placeholder="例如：余弦相似度 / DPO / MCP / 量化" autocomplete="off" autofocus>
    <p class="search-meta" data-search-meta role="status" aria-live="polite">输入关键词开始搜索。</p>
    <div class="search-results" data-search-results aria-live="polite"></div>
  </div>
</section>
</main>
${footer()}
<script type="module" src="/ai/notes/search.mjs?v=1"></script>
</body>
</html>
`;
  const out = path.join(ROOT, 'ai/notes/search/index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, page, 'utf8');
  return out;
}

function renderSearchIndex() {
  const entries = [];
  const strip = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  for (const id of ALL_TRACKS) {
    const t = readTrack(id);
    entries.push({
      type: 'book', title: t.title, track: id, href: '/ai/notes/' + id + '/',
      summary: t.subtitle || '', text: strip(t.subtitle || '')
    });
    for (const l of t.levels) {
      const level = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/levels', l.id + '.json'), 'utf8'));
      const explain = level.explain || {};
      const reading = level.reading || {};
      entries.push({
        type: 'lesson', title: level.title, track: id, trackTitle: t.title, href: l.href,
        summary: level.summary || '',
        text: [level.summary, explain.summary, explain.why, reading.quote, (reading.points || []).join(' ')].filter(Boolean).join(' ')
      });
    }
  }
  const out = path.join(ROOT, 'ai/notes/search-index.json');
  fs.writeFileSync(out, JSON.stringify(entries), 'utf8');
  return out;
}


function renderPrivacy() {
  const body = `
<section class="wrap track-head">
  <p class="label">PRIVACY / 隐私说明</p>
  <h1>隐私说明</h1>
  <p class="lead">本站是静态学习站，不要求账号，不在服务器保存你的练习答案。</p>
  <p class="source">最后更新：2026-10-20</p>
</section>
<section class="wrap section">
  <div class="article">
    <h2>1. 存在你浏览器里的数据</h2>
    <p>练习草稿、完成状态、客观题错题和“继续上次阅读”使用浏览器 localStorage 保存在本机。它们不会自动上传到服务器；清除本站浏览器数据后会删除。</p>
    <h2>2. 页面分析</h2>
    <p>本站页面可能加载 Cloudflare Web Analytics 的统计脚本，用于了解页面访问情况。具体是否启用、采集范围和保留周期取决于 Cloudflare 账户配置；本站代码不接入广告平台，也不出售用户数据。</p>
    <h2>3. 搜索</h2>
    <p>搜索在浏览器内对静态索引进行匹配，搜索词不会由本站服务端接收或保存。</p>
    <h2>4. 邮件联系</h2>
    <p>页面上的“获取 PDF”是邮件链接。只有你主动点击并发送邮件时，你的邮箱地址和邮件内容才会发送到页面标注的联系邮箱。</p>
    <h2>5. 不收集什么</h2>
    <p>本站没有注册、登录、支付、文件上传、评论或用户画像功能，不主动收集姓名、电话、身份证号等信息。</p>
    <h2>6. 你的控制</h2>
    <p>你可以通过浏览器的“清除站点数据”删除本机保存的进度和草稿；也可以不点击邮件链接、不使用搜索和练习功能。</p>
    <p class="privacy-note">本页是技术说明，不构成法律意见；如面向特定地区正式运营，请由合规人员根据适用法律复核。</p>
  </div>
</section>`;
  const page = `${head('隐私说明 — AI神功', 'AI神功隐私说明：本机存储、Cloudflare 分析、搜索和邮件联系说明。', 'https://gongjuhe.top/ai/notes/privacy/')}
<body>
${shellHeader()}
<main id="main">${body}</main>
${footer()}
</body>
</html>
`;
  const out = path.join(ROOT, 'ai/notes/privacy/index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, page, 'utf8');
  return out;
}

function renderReview() {
  const page = `${head('错题本 — AI神功', '本机保存的客观题错题，答对后自动移除。', 'https://gongjuhe.top/ai/notes/review/', true)}
<body>
${shellHeader()}
<main id="main">
<section class="wrap hero">
  <p class="label">REVIEW / 错题本</p>
  <h1>做错的题，<br>回来再看一遍。</h1>
  <p class="lead">客观题答错会自动记在这台设备的浏览器里；之后答对会自动移出。只保存在本机，不上传。</p>
  <div class="hero-meta"><span data-mistake-count>0 道错题</span><span>本机保存</span><button type="button" class="clear-mistakes" data-clear-mistakes>清空错题本</button></div>
</section>
<section class="wrap section">
  <div class="section-head"><div><p class="label">MISTAKES / 需要回看</p><h2>先重做，再看解释。</h2></div><a href="/ai/notes/">回到全部课程 →</a></div>
  <div class="mistake-list" data-mistakes></div>
</section>
</main>
${footer()}
<script src="/ai/notes/notes.js?v=8" defer></script>
<script type="module" src="/ai/notes/review.mjs?v=1"></script>
</body>
</html>
`;
  const out = path.join(ROOT, 'ai/notes/review/index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, page, 'utf8');
  return out;
}

export function renderCatalog() {
  const pages = [renderIndex(), renderNeigong(), renderSearch(), renderSearchIndex(), renderPrivacy()];
  for (const id of ['rag', 'agents', 'llm', 'tools']) pages.push(renderTrack(readTrack(id)));
  pages.push(renderReview());
  return pages;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(renderCatalog().map((p) => 'BUILT ' + path.relative(ROOT, p)).join('\n'));
}
