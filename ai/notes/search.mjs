const input = document.getElementById('search-input');
const results = document.querySelector('[data-search-results]');
const meta = document.querySelector('[data-search-meta]');
const trackSel = document.querySelector('[data-search-track]');
let index = [];

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function norm(s) {
  return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}
function render(query) {
  const q = norm(query);
  if (!q) {
    results.innerHTML = '';
    meta.textContent = '输入关键词开始搜索。';
    return;
  }
  const words = q.split(' ').filter(Boolean);
  const trackFilter = trackSel ? trackSel.value : '';
  const hits = index.filter((item) => !trackFilter || item.track === trackFilter).map((item) => {
    const title = norm(item.title);
    const body = norm(item.summary + ' ' + item.text);
    let score = 0;
    words.forEach((w) => {
      if (title.includes(w)) score += 5;
      if (body.includes(w)) score += 1;
    });
    return { item, score };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 30);
  meta.textContent = '找到 ' + hits.length + ' 条结果' + (hits.length === 30 ? '（只显示前 30 条）' : '');
  if (!hits.length) {
    results.innerHTML = '<div class="search-empty">没有找到。换一个更短的关键词试试。</div>';
    return;
  }
  results.innerHTML = hits.map(({ item, score }) => `<a class="search-hit" href="${esc(item.href)}">
    <span class="search-type">${item.type === 'book' ? '课程' : '关卡'}</span>
    <span class="search-hit-body"><h2>${esc(item.title)}</h2>
    <p>${esc(item.summary || '')}</p>
    <small>${esc(item.trackTitle || 'AI神功')} · 相关度 ${score}</small></span>
    <span class="search-arrow">→</span>
  </a>`).join('');
}

fetch('/ai/notes/search-index.json', { cache: 'no-cache' })
  .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
  .then((data) => {
    index = Array.isArray(data) ? data : [];
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    if (trackSel && params.get('track')) trackSel.value = params.get('track');
    if (input) input.value = q;
    render(q);
  })
  .catch((err) => {
    if (meta) meta.textContent = '搜索索引加载失败：' + err.message;
  });

let timer = 0;
if (trackSel) {
  trackSel.addEventListener('change', () => {
    const q = input ? input.value.trim() : '';
    const url = new URL(location.href);
    if (trackSel.value) url.searchParams.set('track', trackSel.value); else url.searchParams.delete('track');
    history.replaceState(null, '', url);
    render(q);
  });
}
if (input) {
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const q = input.value.trim();
      const url = new URL(location.href);
      if (q) url.searchParams.set('q', q); else url.searchParams.delete('q');
      history.replaceState(null, '', url);
      render(q);
    }, 120);
  });
}
