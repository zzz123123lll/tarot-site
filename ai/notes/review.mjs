// 错题本：读取本机 gjh-mistakes，展示客观题错题。
const STORE_KEY = 'gjh-mistakes';
const box = document.querySelector('[data-mistakes]');
const countEl = document.querySelector('[data-mistake-count]');
const clearBtn = document.querySelector('[data-clear-mistakes]');

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function read() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {}; }
  catch (e) { return {}; }
}

function render() {
  const store = read();
  const items = Object.values(store).sort((a, b) => (b.at || 0) - (a.at || 0));
  if (countEl) countEl.textContent = items.length + ' 道错题';
  if (!items.length) {
    box.innerHTML = `<div class="review-empty"><p class="label">CLEAR / 暂无错题</p><h2>还没有做错的题。</h2><p>去任意一关做客观题；答错后会自动出现在这里，答对后会移出。</p><a class="btn" href="/ai/notes/">开始做题</a></div>`;
    return;
  }
  box.innerHTML = items.map((item) => {
    const options = (item.options || []).map((opt, i) => {
      const cls = i === item.answer ? 'is-correct' : (i === item.selected ? 'is-wrong' : '');
      return `<div class="mistake-option ${cls}"><b>${String.fromCharCode(65 + i)}</b> ${esc(opt)}${i === item.answer ? ' <small>正确答案</small>' : ''}${i === item.selected && i !== item.answer ? ' <small>你选的</small>' : ''}</div>`;
    }).join('');
    return `<article class="mistake-card">
      <div class="mistake-head"><span class="label">${esc(item.title || item.key)}</span><a href="${esc(item.href || item.key)}">回到这一关 →</a></div>
      <h3>${esc(item.question)}</h3>
      <div class="mistake-options">${options}</div>
      <p class="mistake-explain">${esc(item.explanation)}</p>
    </article>`;
  }).join('');
}

if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    if (!window.confirm('清空本机错题本？')) return;
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    render();
  });
}

if (box) render();
