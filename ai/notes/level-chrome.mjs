// 关卡页的"产品外壳"：位置行、侧栏打勾、底部动作条
// 数据来源与练习页完全一致：localStorage['gjh-notes:' + 路径] = { done: true, ... }

const PREFIX = 'gjh-notes:';
const locator = document.querySelector('[data-locator]');
const bar = document.querySelector('[data-actionbar]');
const sideItems = Array.from(document.querySelectorAll('[data-side-key]'));

function doneOf(path) {
  try {
    const j = JSON.parse(localStorage.getItem(PREFIX + path) || '{}');
    return !!(j && j.done);
  } catch (e) { return false; }
}

function totalDone() {
  let n = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(PREFIX)) continue;
      try {
        const j = JSON.parse(localStorage.getItem(k));
        if (j && j.done) n++;
      } catch (e) {}
    }
  } catch (e) {}
  return n;
}

function practiceCheckbox() {
  return document.querySelector('.practice [data-done]');
}

function paint() {
  // 侧栏：打完勾、当前关高亮由模板负责
  let sideDone = 0;
  sideItems.forEach((li) => {
    const d = doneOf(li.dataset.sideKey);
    li.classList.toggle('is-done', d);
    if (d) sideDone++;
  });

  // 位置行：已完成 N 关
  const chip = locator && locator.querySelector('[data-done-count]');
  if (chip) {
    const n = totalDone();
    chip.hidden = n <= 0;
    chip.textContent = '已完成 ' + n + ' 关';
  }

  // 动作条：本册进度 + 完成按钮状态
  const stateEl = bar && bar.querySelector('[data-side-progress]');
  if (stateEl && sideItems.length) stateEl.textContent = '本册 ' + sideDone + ' / ' + sideItems.length;

  const cb = practiceCheckbox();
  const text = bar && bar.querySelector('[data-done-text]');
  const btn = bar && bar.querySelector('[data-done-toggle]');
  if (cb && text) text.textContent = cb.checked ? '已完成' : '标记本关完成';
  if (cb && btn) {
    btn.setAttribute('aria-pressed', cb.checked ? 'true' : 'false');
    btn.classList.toggle('is-on', cb.checked);
  }
  // 没有练习区的页面（极少数）就隐藏动作条里的完成按钮，避免点了没反应
  if (!cb && btn) btn.hidden = true;
}

if (bar) {
  const btn = bar.querySelector('[data-done-toggle]');
  if (btn) {
    btn.addEventListener('click', () => {
      const cb = practiceCheckbox();
      if (!cb) return;
      cb.checked = !cb.checked;
      cb.dispatchEvent(new Event('change', { bubbles: true }));
      paint();
    });
  }
}

document.addEventListener('change', (e) => {
  if (e.target && e.target.matches && e.target.matches('[data-done]')) paint();
});

// 练习区是异步加载的（先 fetch 题目再渲染），所以分几个时间点补画一次
paint();
[120, 400, 1000].forEach((t) => setTimeout(paint, t));
