// 通用单关渲染器：页面只从 content/ 读取内容，HTML 是构建产物。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function fail(msg) {
  throw new Error('CONTENT VALIDATION FAILED: ' + msg);
}
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function assert(cond, msg) { if (!cond) fail(msg); }

function loadTrack(trackId) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'content/tracks', trackId + '.json'), 'utf8'));
}
function loadLevel(trackId, levelId) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'content/levels', levelId + '.json'), 'utf8'));
}

function validate(track, level) {
  assert(track.id === level.trackId, 'track id');
  assert(level.id === track.id + '-' + String(level.level).padStart(2, '0'), 'level id');
  assert(level.title && level.summary && level.lessonHtml && level.referenceAnswerHtml, 'required content');
  assert(Array.isArray(level.knowledgeChecks) && level.knowledgeChecks.length === 3, 'knowledgeChecks length');
  level.knowledgeChecks.forEach((q) => {
    assert(q.id && q.question && q.explanation, 'knowledgeCheck fields');
    assert(Array.isArray(q.options) && q.options.length === 4, 'knowledgeCheck options');
    assert(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4, 'knowledgeCheck answer');
  });
  if (level.explain) {
    assert(level.explain.summary && Array.isArray(level.explain.bullets), 'explain summary');
    assert(level.explain.example && level.explain.example.input && level.explain.example.walkthrough, 'explain example');
    assert(Array.isArray(level.explain.terms) && level.explain.terms.length >= 2, 'explain terms');
    assert(level.explain.why && level.explain.structure && level.explain.check, 'explain fields');
  }
  assert(level.reading && level.reading.quote && level.reading.guide && level.reading.example && level.reading.takeaway, 'reading fields');
  assert(Array.isArray(level.reading.points) && level.reading.points.length >= 3, 'reading points');
  assert(Array.isArray(level.reading.refs) && level.reading.refs.length >= 1, 'reading refs');
  assert(level.exercise && Array.isArray(level.exercise.criteria), 'exercise criteria');
  assert(level.exercise.minLength >= 0, 'minLength');
  assert(level.exercise.criteria.length > 0, 'criteria empty');
  let total = 0;
  level.exercise.criteria.forEach((c, i) => {
    assert(c.id && c.label, 'criterion ' + i + ' id/label');
    assert(Number(c.weight) > 0, 'criterion ' + i + ' weight');
    total += Number(c.weight);
    assert(c.type === 'term_groups', 'criterion ' + i + ' type');
    assert(Array.isArray(c.groups) && c.groups.length > 0, 'criterion ' + i + ' groups');
    c.groups.forEach((g, j) => {
      assert(g.label, 'criterion ' + i + ' group ' + j + ' label');
      assert(Array.isArray(g.terms) && g.terms.length > 0, 'criterion ' + i + ' group ' + j + ' terms');
    });
  });
  const expected = track.id === 'prompt' ? 10 : 12.5;
  assert(Math.abs(total - expected) < 0.01, 'rubric total ' + total + ' != ' + expected);
  const entry = track.levels.find((l) => l.id === level.id);
  assert(entry, 'level missing from track');
  assert(entry.href === '/ai/notes/' + track.id + '/' + String(level.level).padStart(2, '0'), 'level href');
}

export function renderLevel(trackId, levelId) {
  const track = loadTrack(trackId);
  const level = loadLevel(trackId, levelId);
  validate(track, level);

  const currentIndex = track.levels.findIndex((l) => l.id === level.id);
  const prev = currentIndex > 0 ? track.levels[currentIndex - 1] : null;
  const next = currentIndex + 1 < track.levels.length ? track.levels[currentIndex + 1] : null;
  const total = level.exercise.criteria.reduce((s, c) => s + Number(c.weight), 0);
  const side = track.levels.map((l) => {
    const current = l.id === level.id ? ' class="current"' : '';
    return `<li><a href="${esc(l.href)}"${current}><span class="num">${String(l.level).padStart(2, '0')}</span><span>${esc(l.title)}</span></a></li>`;
  }).join('');
  const prevLink = prev
    ? `<a href="${esc(prev.href)}"><small>上一关</small>${esc(prev.title)}</a>`
    : `<a href="/ai/notes/${esc(track.id)}/"><small>返回系列</small>${esc(track.title)}</a>`;
  const nextLink = next
    ? `<a class="right" href="${esc(next.href)}"><small>下一关</small>${esc(next.title)}</a>`
    : `<a class="right" href="/ai/notes/"><small>读完这一套</small>全部笔记 →</a>`;
  const pdf = 'mailto:1336089899@qq.com?subject=' + encodeURIComponent('索取《' + track.title + '》完整 PDF');
  const outPath = path.join(ROOT, 'ai', 'notes', track.id, String(level.level).padStart(2, '0') + '.html');

  const rd = level.reading;
  const sourceLinks = rd.refs.map((ref) => ref[1]
    ? `<a href="${esc(ref[1])}" target="_blank" rel="noopener">${esc(ref[0])} ↗</a>`
    : `<span>${esc(ref[0])}</span>`).join('');
  const reading = `<section class="source-reading" id="reading">
    <p class="label">SOURCE READING / 来源精读</p>
    <p class="reading-quote">${esc(rd.quote)}</p>
    <div class="reading-grid">
      <div><h3>逐点读懂</h3><ol class="reading-points">${rd.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ol></div>
      <div>
        <h3>怎么对应本关练习</h3><p>${esc(rd.guide)}</p>
        <h3>例子在哪</h3><p>${esc(rd.example)}</p>
      </div>
    </div>
    <p class="reading-takeaway">${esc(rd.takeaway)}</p>
    <div class="reading-refs"><span class="label">SOURCES</span>${sourceLinks}</div>
  </section>`;

  const explain = level.explain ? `<section class="explain" id="understand">
    <div class="explain-fast">
      <p class="label">30 SECONDS / 30 秒看懂</p>
      <p class="explain-summary">${esc(level.explain.summary)}</p>
      <ul class="explain-bullets">${level.explain.bullets.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    </div>
    <div class="explain-deep">
      <p class="label">3 MINUTES / 3 分钟拆解</p>
      <p class="explain-example-title">先看来源里的例子：${esc(level.explain.example.label)}</p>
      <div class="explain-example">
        <div class="explain-code"><span>输入</span><pre>${esc(level.explain.example.input)}</pre></div>
        <div class="explain-walk"><h3>发生了什么</h3><p>${esc(level.explain.example.walkthrough)}</p><h3>输出</h3><p>${esc(level.explain.example.output)}</p></div>
      </div>
      <div class="explain-two">
        <div><h3>术语拆开</h3><dl class="explain-terms">${level.explain.terms.map((x) => `<div><dt>${esc(x.term)}</dt><dd>${esc(x.plain)}</dd></div>`).join('')}</dl></div>
        <div><h3>为什么有效</h3><p>${esc(level.explain.why)}</p><h3>结构长什么样</h3><pre class="explain-structure">${esc(level.explain.structure)}</pre></div>
      </div>
      <p class="explain-check">${esc(level.explain.check)}</p>
    </div>
  </section>` : '';

  const page = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(level.title)} · 第 ${String(level.level).padStart(2, '0')} 关 — ${esc(track.title)}</title>
<meta name="description" content="${esc(level.summary)}">
<link rel="canonical" href="https://gongjuhe.top/ai/notes/${esc(track.id)}/${String(level.level).padStart(2, '0')}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(level.title)} — ${esc(track.title)}">
<meta property="og:description" content="${esc(level.summary)}">
<meta property="og:image" content="/og-knowledge.png">
<link rel="icon" href="/favicon.ico">
<link rel="stylesheet" href="/ai/notes/notes.css?v=8">
<script src="/ai/notes/notes.js?v=6" defer></script>
<script type="module" src="/ai/notes/practice.mjs?v=4"></script>
</head>
<body>
<a class="skip" href="#main">跳到主要内容</a>
<div class="read-progress"></div>
<header class="wrap top">
  <a class="brand" href="/">AI 实战通关 <small>KNOWLEDGE BASE</small></a>
  <nav class="nav" aria-label="主导航">
    <a href="/ai/notes/">全部课程</a>
    <a class="hide-s" href="/ai/notes/review/">错题本</a>
    <a href="/">知识库首页</a>
    <a class="cta" href="${pdf}">获取 PDF</a>
  </nav>
</header>
<main id="main">
<nav class="breadcrumb wrap" aria-label="面包屑">
  <a href="/">AI 实战通关</a><span class="sep">/</span><a href="/ai/notes/">全部课程</a><span class="sep">/</span><a href="/ai/notes/${esc(track.id)}/">${esc(track.title)}</a><span class="sep">/</span><span>第 ${String(level.level).padStart(2, '0')} 关</span>
</nav>
<div class="wrap article-shell">
  <aside class="side">
    <p class="side-label">${esc(track.title.split('：')[0])}</p>
    <ol class="level-nav">${side}</ol>
    <div class="side-cta">完整 PDF 留邮箱发。<br><a href="${pdf}">获取 PDF ↗</a></div>
  </aside>
  <article class="article">
    <p class="kicker">${esc(track.label)} / ${String(level.level).padStart(2, '0')} · ENGINE v1</p>
    <h1>${esc(level.title)}</h1>
    <p class="lede">${esc(level.summary)}</p>
    <div class="meta"><span>约 ${level.readMinutes} 分钟</span><span class="dot">·</span><span>免费阅读</span><span class="dot">·</span><span>整理自 ${esc(level.source)}</span><span class="dot">·</span><span><a class="meta-jump" href="#reading">来源精读 ↓</a><span class="dot">·</span><a class="meta-jump" href="#practice">直接做题 ↓</a></span></div>
    ${explain}
    ${reading}
    <section class="lesson">${level.lessonHtml}</section>
    <section class="practice" id="practice" data-engine="v2" data-key="/ai/notes/${esc(track.id)}/${String(level.level).padStart(2, '0')}" data-exercise="/content/levels/${esc(level.id)}.json">
      <div class="practice-head">
        <p class="label">PRACTICE / 本关练习 · 规则引擎 v1</p>
        <h2>${esc(level.exercise.title)}</h2>
        <p>答案只保存在这台设备的浏览器里，不上传；系统按本关评分项检查，支持部分分和“无法判断”。</p>
      </div>
      <div class="knowledge-check" data-objective></div>
      <div class="practice-grid">
        <div class="practice-write">
          <label for="practice-answer">我的答案</label>
          <textarea id="practice-answer" data-answer spellcheck="false" placeholder="把你的 Prompt / 方案写在这里…"></textarea>
          <div class="practice-meta"><span data-count>0 字</span><button type="button" data-save>保存草稿</button><button type="button" data-clear>清空</button><span class="save-state" data-status>未保存</span></div>
        </div>
        <div class="practice-check">
          <p class="practice-label">评分项</p>
          <div class="check-list" data-criteria></div>
          <button type="button" class="check-answer" data-check>检查我的答案</button>
          <div class="practice-feedback" data-feedback></div>
          <p class="practice-score">结构分 <b data-score>—</b> / ${total} 分</p>
        </div>
      </div>
      <div class="practice-actions">
        <button type="button" data-reveal>对照参考答案 ↓</button>
        <label class="done-check"><input type="checkbox" data-done> 标记本关完成</label>
      </div>
    </section>
    <details class="answer">
      <summary><span>查看参考答案与得分点 <span class="hint">先自己写，再打开</span></span><span class="plus">＋</span></summary>
      <div class="answer-body">${level.referenceAnswerHtml}</div>
    </details>
    <div class="pdf-box"><p>网页永久免费。三套完整 PDF 会按顺序发给留邮箱的读者，不转售、不群发广告。</p><a href="${pdf}">留邮箱，获取完整 PDF ↗</a></div>
    <div class="nextprev">${prevLink}${nextLink}</div>
  </article>
</div>
</main>
<footer class="wrap">
  <span>AI 实战通关 · 2026</span>
  <span>免费 · 不登录 · 不卖 API</span>
</footer>
</body>
</html>
`;
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, page, 'utf8');
  return { level: level.id, out: path.relative(ROOT, outPath), total };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const trackId = process.argv[2] || 'prompt';
  const levelId = process.argv[3] || (trackId + '-01');
  const result = renderLevel(trackId, levelId);
  console.log('BUILT', result.level, '->', result.out, 'rubricTotal=', result.total);
}
