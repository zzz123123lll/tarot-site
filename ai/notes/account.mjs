// 账号与进度同步 v2：登录即自动合并，同步自动发生
// 调研结论见 docs/repair-plan.md：注册 = 「保存进度」，不是「开墙」；
// 同步逻辑（并集合并、本机为准）在 progress-sync.mjs，这里只管界面。

import {
  authState, clearAuthCache, countLocal, mergeOnLogin,
} from './progress-sync.mjs';

const box = document.querySelector('[data-account]');
if (box) init();

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function note(text, kind) {
  const el = box.querySelector('[data-acc-note]');
  if (!el) return;
  el.innerHTML = text ? '<p class="acc-note ' + (kind === 'err' ? 'is-err' : kind === 'ok' ? 'is-ok' : '') + '">' + text + '</p>' : '';
}

async function init() {
  box.innerHTML = '<p class="acc-lead">正在检查登录状态…</p>';
  const state = await authState(true);
  state.username ? renderLogged(state.username) : renderGuest();
}

/* ---------------- 未登录 ---------------- */

function renderGuest() {
  const n = countLocal();
  box.innerHTML = [
    '<div class="section-head"><div><p class="label">ACCOUNT / 账号</p><h2>把进度存到云端，换设备接着学。</h2></div></div>',
    '<p class="acc-lead">' +
    (n ? '这台设备上已有 <b>' + n + ' 条进度</b>。注册或登录后，它们会被自动并进云端账号，一条都不丢。'
       : '还没开始学也没关系。登录后做的每一关都会自动存到云端。') +
    '</p>',
    '<div class="acc-tabs"><button type="button" data-tab="login" class="on">登录</button><button type="button" data-tab="reg">注册</button></div>',
    '<form data-form class="acc-form" novalidate>',
    '<label>用户名<input name="username" autocomplete="username" required /></label>',
    '<label>密码<input name="password" type="password" autocomplete="current-password" required minlength="8" /></label>',
    '<button type="submit" data-submit>登录</button>',
    '</form>',
    '<div data-acc-note></div>',
    '<details class="acc-details"><summary>忘记密码了？</summary>',
    '<p>用注册时给你的恢复码重置。恢复码只在注册那一次显示，当时没存就只能换个账号了——这是不验证邮箱的代价。</p>',
    '<form data-recover class="acc-form"><label>用户名<input name="username" required /></label>',
    '<label>恢复码<input name="recoveryCode" placeholder="xxxx-xxxx-xxxx" required /></label>',
    '<label>新密码<input name="password" type="password" required minlength="8" /></label>',
    '<button type="submit">重置密码</button></form></details>'
  ].join('');

  let mode = 'login';
  box.querySelectorAll('[data-tab]').forEach((b) => {
    b.addEventListener('click', () => {
      mode = b.dataset.tab;
      box.querySelectorAll('[data-tab]').forEach((x) => x.classList.toggle('on', x === b));
      box.querySelector('input[name="password"]').setAttribute('autocomplete', mode === 'login' ? 'current-password' : 'new-password');
      box.querySelector('[data-submit]').textContent = mode === 'login' ? '登录' : '注册';
      note('');
    });
  });

  box.querySelector('[data-form]').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const payload = { username: f.username.value.trim(), password: f.password.value };
    const btn = box.querySelector('[data-submit]');
    btn.disabled = true;
    note(mode === 'login' ? '正在登录…' : '正在创建…');
    try {
      const data = await api(mode === 'login' ? '/api/auth/login' : '/api/auth/register', {
        method: 'POST', body: JSON.stringify(payload),
      });
      clearAuthCache();

      if (data.recoveryCode) {
        // 注册：先给恢复码，这一步不能跳过
        box.innerHTML = [
          '<div class="section-head"><div><p class="label">ACCOUNT / 账号</p><h2>先把这串恢复码存下来。</h2></div></div>',
          '<p class="acc-code">' + esc(data.recoveryCode) + '</p>',
          '<p class="acc-lead">忘记密码时靠它找回，<b>只显示这一次</b>。存到备忘录或微信收藏，然后点下面的按钮，本机进度会自动并进云端。</p>',
          '<button type="button" data-saved>存好了，合并我的进度 →</button>'
        ].join('');
        box.querySelector('[data-saved]').addEventListener('click', async () => {
          const r = await doMerge('欢迎。');
          if (r) renderLogged(payload.username.toLowerCase(), r);
        });
        return;
      }
      const r = await doMerge('欢迎回来。');
      if (r) renderLogged(data.username, r);
    } catch (err) {
      note(esc(err.message), 'err');
      btn.disabled = false;
    }
  });

  const rf = box.querySelector('[data-recover]');
  if (rf) rf.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    note('正在重置…');
    try {
      const data = await api('/api/auth/recover', {
        method: 'POST',
        body: JSON.stringify({ username: f.username.value.trim(), recoveryCode: f.recoveryCode.value.trim(), newPassword: f.password.value }),
      });
      clearAuthCache();
      await doMerge('密码已重置。');
      renderLogged(data.username);
    } catch (err) {
      note(esc(err.message), 'err');
    }
  });
}

/* ---------------- 登录成功 → 自动合并 ---------------- */

async function doMerge(prefixMsg) {
  note(prefixMsg + ' 正在合并本机与云端进度…');
  try {
    const r = await mergeOnLogin();
    note('合并完成：云端拉来 ' + r.pulled + ' 条，推上去 ' + r.pushed + ' 条，共 ' + r.local + ' 条。', 'ok');
    return r;
  } catch (err) {
    note('合并失败：' + esc(err.message) + '。本机进度还在，稍后可在本页再试。', 'err');
    return null;
  }
}

/* ---------------- 已登录 ---------------- */

function renderLogged(username, mergeInfo) {
  const n = countLocal();
  box.innerHTML = [
    '<div class="section-head"><div><p class="label">ACCOUNT / 账号</p><h2>已登录：' + esc(username) + '</h2></div></div>',
    mergeInfo
      ? '<p class="acc-lead">刚才合并了：云端拉来 ' + mergeInfo.pulled + ' 条，推上去 ' + mergeInfo.pushed + ' 条。现在共 ' + mergeInfo.local + ' 条。</p>'
      : '<p class="acc-lead">本机有 ' + n + ' 条进度。完成一关时会自动存到云端，不用手动点。</p>',
    '<div class="acc-actions">',
    '<button type="button" data-sync>立即同步</button>',
    '<button type="button" class="ghost" data-logout>退出登录</button>',
    '</div>',
    '<div data-acc-note></div>',
    '<details class="acc-details"><summary>换设备登录后，云端和本机对不上？</summary>',
    '<p>点「立即同步」会做并集合并：两边都有的以这台设备为准，只在一侧有的自动补齐。</p>',
    '<p>实在想以云端为准整体覆盖本机（一般用不到）：</p>',
    '<button type="button" class="ghost" data-restore>用云端整体覆盖本机</button>',
    '</details>',
    '<details class="acc-details"><summary>不再需要这个账号</summary>',
    '<p>注销会删掉账号和云端进度，不可恢复。本机进度保留。</p>',
    '<form data-del class="acc-form"><label>输入密码确认<input name="password" type="password" required /></label>',
    '<button type="submit" class="danger">永久注销</button></form></details>'
  ].join('');

  box.querySelector('[data-sync]').addEventListener('click', async () => {
    const btn = box.querySelector('[data-sync]');
    btn.disabled = true;
    note('正在同步…');
    try {
      const r = await doMerge('');
      if (r) note('同步完成：拉来 ' + r.pulled + ' 条、推上 ' + r.pushed + ' 条，共 ' + r.local + ' 条。', 'ok');
    } finally {
      btn.disabled = false;
    }
  });

  const restore = box.querySelector('[data-restore]');
  if (restore) restore.addEventListener('click', async () => {
    if (!confirm('确定用云端整体覆盖本机？本机独有的改动会丢。')) return;
    try {
      const r = await pullProgress();
      note(r.empty ? '云端还没有进度。' : '已用云端覆盖本机（' + r.count + ' 条），刷新后生效。', 'ok');
    } catch (err) { note(esc(err.message), 'err'); }
  });

  box.querySelector('[data-logout]').addEventListener('click', async () => {
    try { await api('/api/auth/logout', { method: 'POST', body: '{}' }); } catch (e) {}
    clearAuthCache();
    renderGuest();
  });

  const df = box.querySelector('[data-del]');
  if (df) df.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!confirm('确定注销？账号和云端进度都会被删掉，无法恢复。')) return;
    note('正在注销…');
    try {
      await api('/api/auth/delete', { method: 'POST', body: JSON.stringify({ password: e.target.password.value }) });
      clearAuthCache();
      renderGuest();
      note('账号已注销。', 'ok');
    } catch (err) { note(esc(err.message), 'err'); }
  });
}

/* ---------------- 公共 ---------------- */

async function api(path, opts) {
  const res = await fetch(path, Object.assign({ headers: { 'content-type': 'application/json' } }, opts));
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);
  return data;
}

async function pullProgress() {
  const res = await fetch('/api/progress');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);
  if (!data.items) return { empty: true };
  Object.keys(data.items).forEach((k) => {
    try { localStorage.setItem('gjh-notes:' + k, JSON.stringify(data.items[k])); } catch (e) {}
  });
  return { count: Object.keys(data.items).length };
}
