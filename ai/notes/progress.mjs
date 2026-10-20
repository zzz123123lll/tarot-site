const PREFIX = 'gjh-notes:';
const books = [
  { label: '内功01', href: '/ai/notes/neigong/01', prefix: '/ai/notes/neigong/01', total: 1 },
  { label: '内功02', href: '/ai/notes/neigong/02', prefix: '/ai/notes/neigong/02', total: 1 },
  { label: '内功03', href: '/ai/notes/neigong/03', prefix: '/ai/notes/neigong/03', total: 1 },
  { label: '内功04', href: '/ai/notes/neigong/04', prefix: '/ai/notes/neigong/04', total: 1 },
  { label: '内功05 RAG', href: '/ai/notes/rag/', prefix: '/ai/notes/rag/', total: 8 },
  { label: '内功06 Agent', href: '/ai/notes/agents/', prefix: '/ai/notes/agents/', total: 8 },
  { label: '内功07 模型定制', href: '/ai/notes/llm/', prefix: '/ai/notes/llm/', total: 8 },
  { label: '神兵利器', href: '/ai/notes/tools/', prefix: '/ai/notes/tools/', total: 8 }
];
const total = books.reduce((sum, b) => sum + b.total, 0);
const line = document.querySelector('[data-progress-count]');
const bar = document.querySelector('[data-progress-line] .bar i');
const booksEl = document.querySelector('[data-progress-books]');
const queueEl = document.querySelector('[data-review-queue]');
const statusEl = document.querySelector('[data-progress-status]');
const exportBtn = document.querySelector('[data-export-progress]');
const importInput = document.querySelector('[data-import-progress]');
const clearBtn = document.querySelector('[data-clear-local]');

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch (e) { return fallback; }
}
function countDone(prefix) {
  let n = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || k.indexOf(PREFIX + prefix) !== 0) continue;
      const v = read(k, {});
      if (v && v.done) n++;
    }
  } catch (e) {}
  return n;
}
function allProgressKeys() {
  const out = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf(PREFIX) === 0) out.push(k);
    }
  } catch (e) {}
  return out;
}
function render() {
  let done = 0;
  if (booksEl) {
    booksEl.innerHTML = books.map((b) => {
      const n = countDone(b.prefix);
      done += n;
      const pct = b.total ? Math.round((n / b.total) * 100) : 0;
      return `<a class="progress-book" href="${esc(b.href)}">
        <span><b>${esc(b.label)}</b><small>${n} / ${b.total} 完成</small></span>
        <i><em style="width:${pct}%"></em></i>
        <span class="progress-pct">${pct}%</span>
      </a>`;
    }).join('');
  }
  if (line) line.textContent = done + ' / ' + total + ' 完成';
  if (bar) bar.style.width = (done / total * 100).toFixed(1) + '%';
  const mistakes = read('gjh-mistakes', {});
  const last = read('gjh-last-read', null);
  if (queueEl) {
    const items = Object.values(mistakes).sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, 5);
    const lastHtml = last && last.href ? `<a class="queue-card" href="${esc(last.href)}"><span class="queue-label">继续阅读</span><strong>${esc(last.title || last.href)}</strong><small>上次读到这里</small></a>` : '';
    const mistakesHtml = items.map((m) => `<a class="queue-card" href="${esc(m.href || '/ai/notes/review/')}"><span class="queue-label">错题</span><strong>${esc(m.question || '客观题')}</strong><small>${esc(m.title || '')}</small></a>`).join('');
    queueEl.innerHTML = lastHtml + mistakesHtml || '<div class="review-empty"><h2>还没有复习记录。</h2><p>做错一道客观题，或读过任意一关，这里就会出现。</p></div>';
  }
}
function setStatus(text) { if (statusEl) statusEl.textContent = text; }
function exportProgress() {
  const items = {};
  allProgressKeys().forEach((k) => { items[k] = read(k, null); });
  items['gjh-mistakes'] = read('gjh-mistakes', {});
  items['gjh-last-read'] = read('gjh-last-read', null);
  const payload = { schema: 'ai-shengong-progress-v1', exportedAt: new Date().toISOString(), items };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ai-shengong-progress-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  setStatus('已导出 ' + allProgressKeys().length + ' 条本机数据。');
}
function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(reader.result);
      const items = payload && payload.items ? payload.items : payload;
      if (!items || typeof items !== 'object') throw new Error('文件里没有 items 对象');
      let count = 0;
      Object.entries(items).forEach(([k, v]) => {
        const allowed = k === 'gjh-mistakes' || k === 'gjh-last-read' || /^gjh-notes:\/ai\/notes\//.test(k);
        if (!allowed) return;
        localStorage.setItem(k, JSON.stringify(v));
        count++;
      });
      setStatus('已导入 ' + count + ' 条数据，刷新后生效。');
      setTimeout(() => location.reload(), 800);
    } catch (e) {
      setStatus('导入失败：' + e.message);
    }
  };
  reader.readAsText(file);
}
if (exportBtn) exportBtn.addEventListener('click', exportProgress);
if (importInput) importInput.addEventListener('change', () => {
  const file = importInput.files && importInput.files[0];
  if (file) importProgress(file);
});
if (clearBtn) clearBtn.addEventListener('click', () => {
  if (!confirm('清空本机所有学习进度、错题和草稿？此操作不可恢复。')) return;
  allProgressKeys().forEach((k) => localStorage.removeItem(k));
  localStorage.removeItem('gjh-mistakes');
  localStorage.removeItem('gjh-last-read');
  setStatus('已清空本站数据。');
  render();
});
render();
