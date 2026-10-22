import { grade, gradeObjective } from '/shared/grading-engine.mjs';
import { authState, pushProgress, shouldNudgeSignup, markNudged } from '/ai/notes/progress-sync.mjs';

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
  const objectiveBox = root.querySelector('[data-objective]');
  const checkBtn = root.querySelector('[data-check]');
  const answerBox = document.querySelector('.answer');
  let exercise = null;
  let knowledgeChecks = [];
  let loaded = false;
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
  function collectObjectives() {
    var out = {};
    if (!objectiveBox) return out;
    objectiveBox.querySelectorAll('.objective-card').forEach(function (card) {
      var checked = card.querySelector('input[type="radio"]:checked');
      if (checked) out[card.dataset.checkId] = Number(checked.value);
    });
    return out;
  }
  function save() {
    state.answer = answer.value;
    state.done = doneEl.checked;
    state.objectives = collectObjectives();
    state.at = Date.now();
    write();
    setStatus('已保存');
  }
  function scheduleSave() {
    setStatus('保存中…');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 350);
  }
  function validatorHint(v) {
    if (!v) return '';
    if (v.type === 'json') return '结构校验：可解析 JSON，且包含 ' + (v.required || []).join('、');
    if (v.type === 'numeric') return '结构校验：答案需出现数值 ' + v.expected + (v.tolerance ? ' ± ' + v.tolerance : '');
    if (v.type === 'regex') return '结构校验：' + (v.patterns || []).map((x) => x.label || x.pattern).join('、');
    if (v.type === 'code_static') return '结构校验：代码需包含 ' + (v.required || []).join('、') + (v.forbidden && v.forbidden.length ? '，且不能含 ' + v.forbidden.join('、') : '');
    return '结构校验：' + v.type;
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  if (!state.answer) state.answer = '';
  if (typeof state.done !== 'boolean') state.done = false;
  if (!state.objectives || typeof state.objectives !== 'object') {
    state.objectives = {};
    if (typeof state.objective === 'number') state.objectives.q1 = state.objective;
  }
  answer.value = state.answer;
  doneEl.checked = state.done;
  if (feedback) feedback.textContent = '评分项加载中…';
  if (checkBtn) checkBtn.disabled = true;
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
    // 完成一关 → 登录用户自动把进度推到云端（低频写，符合 KV 免费额度）
    if (doneEl.checked) autoSync();
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

  function renderObjective() {
    if (!objectiveBox || !knowledgeChecks.length) {
      if (objectiveBox) objectiveBox.hidden = true;
      return;
    }
    objectiveBox.innerHTML = `<p class="label">KNOWLEDGE CHECK / 客观题 · ${knowledgeChecks.length} 题</p>` +
      knowledgeChecks.map((q, index) => {
        const selected = state.objectives[q.id];
        const options = q.options.map((opt, i) => (
          `<label class="objective-option"><input type="radio" name="objective-${esc(q.id)}-${index}" value="${i}"${selected === i ? ' checked' : ''}><span><b>${String.fromCharCode(65 + i)}</b> ${esc(opt)}</span></label>`
        )).join('');
        return `<div class="objective-card" data-check-id="${esc(q.id)}">
          <p class="objective-index">0${index + 1} / ${esc(q.question)}</p>
          <div class="objective-options">${options}</div>
          <div class="objective-actions"><button type="button" class="check-answer" data-objective-check>检查这道题</button><span class="objective-result" data-objective-result role="status" aria-live="polite"></span></div>
          <p class="objective-explanation" data-objective-explanation></p>
        </div>`;
      }).join('');
    objectiveBox.querySelectorAll('.objective-card').forEach((card) => {
      card.querySelectorAll('input[type="radio"]').forEach((input) => {
        input.addEventListener('change', () => {
          state.objectives[card.dataset.checkId] = Number(input.value);
          write();
          setStatus('已保存');
          card.querySelectorAll('.objective-option').forEach((el) => el.classList.remove('is-correct', 'is-wrong'));
          const resultEl = card.querySelector('[data-objective-result]');
          const explanationEl = card.querySelector('[data-objective-explanation]');
          if (resultEl) resultEl.textContent = '';
          if (explanationEl) explanationEl.textContent = '';
        });
      });
      card.querySelector('[data-objective-check]').addEventListener('click', () => checkObjective(card));
    });
  }

  function recordMistake(q, selected, result) {
    var storeKey = 'gjh-mistakes';
    var store = {};
    try { store = JSON.parse(localStorage.getItem(storeKey) || '{}') || {}; } catch (e) { store = {}; }
    var mk = key + '::' + q.id;
    if (result.correct) {
      delete store[mk];
      delete store[key];
    } else {
      var titleEl = document.querySelector('h1');
      store[mk] = {
        key: mk,
        title: titleEl ? titleEl.textContent.trim() : key,
        href: location.pathname.replace(/\.html$/, ''),
        question: q.question,
        options: q.options,
        selected: selected,
        answer: result.answer,
        explanation: q.explanation,
        at: Date.now()
      };
    }
    try { localStorage.setItem(storeKey, JSON.stringify(store)); } catch (e) {}
  }

  function checkObjective(card) {
    var q = knowledgeChecks.find((item) => item.id === card.dataset.checkId);
    if (!q) return;
    var checked = card.querySelector('input[type="radio"]:checked');
    var selected = checked ? Number(checked.value) : null;
    var resultEl = card.querySelector('[data-objective-result]');
    var explanationEl = card.querySelector('[data-objective-explanation]');
    if (selected === null) {
      if (resultEl) resultEl.textContent = '先选一个答案。';
      return;
    }
    var result = gradeObjective(q, selected);
    state.objectives[q.id] = selected;
    save();
    recordMistake(q, selected, result);
    card.querySelectorAll('.objective-option').forEach((el) => {
      var input = el.querySelector('input');
      el.classList.remove('is-correct', 'is-wrong');
      if (input && Number(input.value) === result.answer) el.classList.add('is-correct');
      if (input && Number(input.value) === selected && !result.correct) el.classList.add('is-wrong');
    });
    if (resultEl) resultEl.textContent = result.correct ? '回答正确' : '回答错误';
    if (explanationEl) {
      explanationEl.textContent = (result.correct ? '' : '正确答案：' + String.fromCharCode(65 + result.answer) + '. ' + q.options[result.answer] + '。') + q.explanation + (q.sourceRef ? ' 来源定位：' + q.sourceRef + '。' : '');
    }
  }

  // content 里部分关卡的 label 被切碎了（出现 "5 分);" 这种碎片），
  // 渲染时兜一层：哪边像完整句子就用哪边，别把碎片显示给学员。
  function criteriaLabel(c) {
    const label = String(c.label || '').trim();
    const quote = String(c.sourceQuote || '').trim();
    const unbalanced = (label.match(/[（(]/g) || []).length !== (label.match(/[）)]/g) || []).length;
    const broken = !label || label.length < 6 || /^[\d.]+\s*分/.test(label) || /[（(=,，;；:]$/.test(label) || unbalanced || /\d\s*$/.test(label);
    let t = broken && quote && quote.length > label.length ? quote : label;
    t = t.replace(/[（(]\s*[\d.]+\s*分\s*[）)]\s*;?/g, '').replace(/[;；]\s*$/, '').trim();
    return t || '评分项';
  }

  function renderCriteria() {
    criteriaBox.innerHTML = exercise.criteria.map((c) => (
      `<div class="check-item" data-criterion="${esc(c.id)}"><span class="check-state" data-state>待检查</span>` +
      `<span>${esc(criteriaLabel(c))}${c.validator ? '<small class="validator-hint">' + esc(validatorHint(c.validator)) + '</small>' : ''}</span>` +
      `<span class="criterion-weight">${Number(c.weight)} 分</span></div>`
    )).join('');
  }

  function check() {
    if (!exercise || !loaded) return;
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
      feedback.textContent = '评分项已全部覆盖（含结构/数值/JSON 校验）。规则引擎仍不判断语义，最后要对照参考答案读一遍。';
    } else {
      feedback.textContent = '还缺：' + (result.missing.join(' / ') || '部分评分项') + '。补齐后再检查。';
    }
    setStatus('检查完成');
    save();
    enhance(answer.value).catch(function (e) { console.warn("[enhance]", e && e.message); });
  }

  // ---- 登录用户的自动进度同步 + 未登录的一次性提示 ----
  async function autoSync() {
    try {
      const st = await authState();
      if (st.username) {
        await pushProgress();
        setStatus('已标记完成，进度已同步到云端');
      } else if (shouldNudgeSignup()) {
        markNudged();
        if (feedback) {
          feedback.insertAdjacentHTML('beforeend',
            '<p class="practice-feedback" style="margin-top:8px">这一关完成得不错。' +
            '<a href="/ai/notes/progress/">注册一个账号（免费，30 秒）</a>，' +
            '进度会自动存到云端，换设备也能接着学。</p>');
        }
      }
    } catch (e) { console.warn('[sync]', e && e.message); }
  }

  // ---- 增强检查：服务端 /api/check，给出「谈到了几个方向 + 缺什么」 ----
  // 纯附加：本地规则照旧先跑，这里只多一块报告；接口挂了也不影响原有体验。
  function exerciseId() {
    const m = String(exerciseUrl || '').match(/levels\/([^.]+)\.json/);
    if (m) return m[1];
    return String(root.dataset.key || '').split('/').filter(Boolean).slice(-2).join('-');
  }

  let enhanceBox = null;
  function getEnhanceBox() {
    if (enhanceBox && enhanceBox.isConnected) return enhanceBox;
    enhanceBox = root.querySelector('[data-enhance]');
    if (!enhanceBox) {
      enhanceBox = document.createElement('div');
      enhanceBox.className = 'gjh-enhance';
      enhanceBox.setAttribute('data-enhance', '');
      if (feedback) feedback.insertAdjacentElement('afterend', enhanceBox);
      else root.appendChild(enhanceBox);
    }
    ensureEnhanceStyle();
    return enhanceBox;
  }

  function ensureEnhanceStyle() {
    if (document.getElementById('gjh-enhance-style')) return;
    const st = document.createElement('style');
    st.id = 'gjh-enhance-style';
    st.textContent = [
      '.gjh-enhance{margin:18px 0;padding:16px 18px;border:1px solid rgba(0,0,0,.12);border-radius:12px;font-size:14px;line-height:1.7}',
      '.gjh-enhance h4{margin:0 0 4px;font-size:14px;font-weight:600}',
      '.gjh-enhance .gjh-sub{margin:0 0 12px;opacity:.6;font-size:12px}',
      '.gjh-enhance ul{list-style:none;margin:0;padding:0}',
      '.gjh-enhance li{padding:8px 0;border-top:1px solid rgba(0,0,0,.08);display:flex;gap:8px;flex-wrap:wrap;align-items:baseline}',
      '.gjh-enhance li:first-child{border-top:0}',
      '.gjh-enhance .gjh-tag{flex:none;font-size:12px;padding:1px 8px;border-radius:999px;border:1px solid currentColor;opacity:.8}',
      '.gjh-enhance .gjh-tag-none{opacity:.45}',
      '.gjh-enhance .gjh-title{flex:1;min-width:180px}',
      '.gjh-enhance .gjh-hits{width:100%;font-size:12px;opacity:.55}',
      '.gjh-enhance .gjh-need{width:100%;font-size:13px;opacity:.8}',
      '.gjh-enhance ol{margin:12px 0 0 20px;padding:0;font-size:13px}',
      '.gjh-enhance .gjh-limits{margin:12px 0 0;font-size:12px;opacity:.5}',
    ].join('');
    document.head.appendChild(st);
  }

  // 页面承诺「答案只存在浏览器里」，所以上传前必须本人同意，且只问一次。
  const CONSENT_KEY = 'gjh-enhance-consent';
  function ensureConsent(box) {
    let saved = null;
    try { saved = localStorage.getItem(CONSENT_KEY); } catch (e) {}
    if (saved === 'yes') return Promise.resolve(true);
    if (saved === 'no') return Promise.resolve(false);

    return new Promise(function (resolve) {
      box.innerHTML =
        '<h4>要做一次覆盖检查吗？</h4>' +
        '<p class="gjh-sub">覆盖检查需要把这段答案发到服务器算一次，算完即弃、不存档。' +
        '不点「允许」的话，它不会离开这台设备，原来的本地检查照常可用。</p>' +
        '<p style="margin:10px 0 0"><button type="button" data-allow>允许，发一次</button> ' +
        '<button type="button" data-deny>不用了</button></p>';
      const allow = box.querySelector('[data-allow]');
      const deny = box.querySelector('[data-deny]');
      if (allow) allow.addEventListener('click', function () {
        try { localStorage.setItem(CONSENT_KEY, 'yes'); } catch (e) {}
        resolve(true);
      });
      if (deny) deny.addEventListener('click', function () {
        try { localStorage.setItem(CONSENT_KEY, 'no'); } catch (e) {}
        box.innerHTML = '<p class="gjh-sub">已跳过，答案没有离开这台设备。</p>';
        resolve(false);
      });
    });
  }

  async function enhance(text) {
    const body = String(text || '').trim();
    if (!body || body.length < (exercise.minLength || 20)) return;
    const box = getEnhanceBox();

    const agreed = await ensureConsent(box);
    if (!agreed) return;

    box.innerHTML = '<p class="gjh-sub">正在做覆盖检查…</p>';

    let data;
    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lesson: exerciseId(), answer: body }),
      });
      if (res.status === 401) {
        box.innerHTML = '<h4>覆盖检查需要登录</h4>' +
          '<p class="gjh-sub">注册免费，30 秒。到「学习进度」页建个账号，登录后这里会告诉你每个方向漏了什么。' +
          '<a href="/ai/notes/progress/">去注册 →</a></p>';
        return;
      }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      data = await res.json();
      if (data.error) throw new Error(data.error);
    } catch (err) {
      box.innerHTML = '';
      console.warn('[enhance] 覆盖检查不可用：', err.message);
      return;
    }

    const SIG = { strong: '● 谈到了', weak: '◐ 好像提到', none: '○ 没检测到' };
    const HEAD = {
      covered: '方向都谈到了',
      partial: '谈到了大部分',
      low: '大部分没谈到',
      keyword_only: '名词齐了，但没讲机制',
      insufficient: '写得太短',
    };

    box.innerHTML =
      '<h4>覆盖检查：' + data.coverage.hit + ' / ' + data.coverage.total + '　' + (HEAD[data.verdict] || '') + '</h4>' +
      '<p class="gjh-sub">这是「谈到了几个方向」，不是分数。规则判断不了因果对错，最后要对照参考答案读一遍。</p>' +
      '<ul>' + data.items.map(function (it) {
        const hits = it.hits && it.hits.length ? '<span class="gjh-hits">命中：' + esc(it.hits.join('、')) + '</span>' : '';
        const need = it.signal === 'none' ? '<span class="gjh-need">这一条要说到：' + esc(it.level2) + '</span>' : '';
        return '<li><span class="gjh-tag ' + (it.signal === 'none' ? 'gjh-tag-none' : '') + '">' +
          SIG[it.signal] + '</span><span class="gjh-title">' + esc(it.title) + '</span>' + hits + need + '</li>';
      }).join('') + '</ul>' +
      (data.next_actions && data.next_actions.length
        ? '<ol>' + data.next_actions.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ol>'
        : '') +
      '<p class="gjh-limits">' + (data.limits || []).map(esc).join('<br>') + '</p>';
  }

  checkBtn.addEventListener('click', check);

  fetch(exerciseUrl, { cache: 'no-cache' })
    .then((r) => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then((data) => {
      exercise = data.exercise;
      knowledgeChecks = Array.isArray(data.knowledgeChecks) ? data.knowledgeChecks : [];
      loaded = true;
      if (checkBtn) { checkBtn.disabled = false; checkBtn.removeAttribute('aria-busy'); }
      if (feedback) feedback.textContent = '';
      renderCriteria();
      renderObjective();
      reset();
      setStatus(state.at ? '已从本机恢复' : '草稿保存在本机浏览器');
    })
    .catch((err) => {
      if (feedback) feedback.textContent = '评分数据加载失败：' + err.message + '。请刷新重试。';
      if (checkBtn) checkBtn.disabled = true;
    });
}
