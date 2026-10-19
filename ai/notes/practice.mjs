import { grade } from '/shared/grading-engine.mjs';

const practice = document.querySelector('.practice[data-engine="v2"]');
if (practice) init(practice);

function init(root) {
  const PREFIX = 'gjh-notes:';
  const key = root.dataset.key;
  const exerciseUrl = root.dataset.exercise;
  const answer = root.querySelector('[data-answer]');
  const countEl = root.querySelector('[data-count]');
  const scoreEl = root.querySelector('[data-score]');
  const doneEl = root.querySelector('[data-done]');
  const statusEl = root.querySelector('[data-status]');
  const feedback = root.querySelector('[data-feedback]');
  const criteriaBox = root.querySelector('[data-criteria]');
  const checkBtn = root.querySelector('[data-check]');
  const answerBox = document.querySelector('.answer');
  let exercise = null;
  let saveTimer = 0;
  let state = read();

  function read() {
    try { return JSON.parse(localStorage.getItem(PREFIX + key) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function write() {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(state)); } catch (e) {}
  }
  function setStatus(text) { if (statusEl) statusEl.textContent = text; }
  function count() { if (countEl) countEl.textContent = answer.value.length + ' 字'; }
  function save() {
    state.answer = answer.value;
    state.done = doneEl.checked;
    state.at = Date.now();
    write();
    setStatus('已保存');
  }
  function scheduleSave() {
    setStatus('保存中…');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 350);
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  if (!state.answer) state.answer = '';
  if (typeof state.done !== 'boolean') state.done = false;
  answer.value = state.answer;
  doneEl.checked = state.done;
  count();

  answer.addEventListener('input', () => {
    count();
    reset();
    setStatus('已修改，待保存');
    scheduleSave();
  });
  doneEl.addEventListener('change', () => {
    state.done = doneEl.checked;
    save();
    setStatus(doneEl.checked ? '已标记完成' : '已取消完成');
  });
  root.querySelector('[data-save]').addEventListener('click', save);
  root.querySelector('[data-clear]').addEventListener('click', () => {
    if (!window.confirm('清空本关答案？')) return;
    answer.value = '';
    doneEl.checked = false;
    state.done = false;
    count();
    reset();
    save();
  });
  const reveal = root.querySelector('[data-reveal]');
  if (reveal) {
    if (!answerBox) reveal.style.display = 'none';
    else reveal.addEventListener('click', () => {
      answerBox.open = true;
      answerBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function reset() {
    scoreEl.textContent = '—';
    feedback.textContent = '';
    criteriaBox.querySelectorAll('[data-criterion]').forEach((item) => {
      item.classList.remove('is-pass', 'is-partial', 'is-fail');
      const s = item.querySelector('[data-state]');
      if (s) s.textContent = '待检查';
    });
  }

  function renderCriteria() {
    criteriaBox.innerHTML = exercise.criteria.map((c) => (
      `<div class="check-item" data-criterion="${esc(c.id)}"><span class="check-state" data-state>待检查</span><span>${esc(c.label)}</span>` +
      `<span class="criterion-weight">${Number(c.weight)} 分</span></div>`
    )).join('');
  }

  function check() {
    if (!exercise) return;
    const result = grade(exercise, answer.value);
    const byId = new Map(result.criteria.map((c) => [c.id, c]));
    criteriaBox.querySelectorAll('[data-criterion]').forEach((item) => {
      const r = byId.get(item.dataset.criterion);
      if (!r) return;
      item.classList.remove('is-pass', 'is-partial', 'is-fail');
      let cls = 'is-fail';
      let label = '未通过';
      if (r.status === 'pass') { cls = 'is-pass'; label = '通过'; }
      else if (r.status === 'partial') { cls = 'is-partial'; label = '部分'; }
      else if (r.status === 'ungradable') { cls = 'is-partial'; label = '待人工判断'; }
      else if (r.status === 'not_checked') { cls = 'is-fail'; label = '未检查'; }
      item.classList.add(cls);
      const s = item.querySelector('[data-state]');
      if (s) s.textContent = label;
    });
    scoreEl.textContent = result.score;
    if (result.status === 'too_short') {
      feedback.textContent = `答案太短：至少 ${exercise.minLength} 字，写完再检查。`;
    } else if (result.status === 'needs_review') {
      feedback.textContent = '有评分项需要人工判断：' + (result.missing.join(' / ') || '未命名评分项');
    } else if (result.status === 'pass') {
      feedback.textContent = '评分项已全部覆盖。规则引擎只检查结构与关键词，最后仍要对照参考答案检查语义。';
    } else {
      feedback.textContent = '还缺：' + (result.missing.join(' / ') || '部分评分项') + '。补齐后再检查。';
    }
    setStatus('检查完成');
    save();
  }

  checkBtn.addEventListener('click', check);

  fetch(exerciseUrl, { cache: 'no-cache' })
    .then((r) => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then((data) => {
      exercise = data.exercise;
      renderCriteria();
      reset();
      setStatus(state.at ? '已从本机恢复' : '草稿保存在本机浏览器');
    })
    .catch((err) => {
      feedback.textContent = '评分数据加载失败：' + err.message;
    });
}
