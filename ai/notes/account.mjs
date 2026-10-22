// 账号与进度同步：注册 / 登录 / 上传 / 下载 / 注销
// 挂在进度页的 [data-account] 容器里。

const PREFIX = 'gjh-notes:';
const box = document.querySelector('[data-account]');
if (box) init();

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function localItems() {
  const out = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(PREFIX)) continue;
      const raw = localStorage.getItem(k);
      try { out[k.slice(PREFIX.length)] = JSON.parse(raw); } catch (e) { out[k.slice(PREFIX.length)] = raw; }
    }
  } catch (e) {}
  return out;
}

function writeItems(items) {
  Object.keys(items || {}).forEach((k) => {
    try { localStorage.setItem(PREFIX + k, JSON.stringify(items[k])); } catch (e) {}
  });
}

async function api(path, opts) {
  const res = await fetch(path, Object.assign({ headers: { 'content-type': 'application/json' } }, opts));
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);
  return data;
}

function note(text, kind) {
  const el = box.querySelector('[data-acc-note]');
  if (!el) return;
  el.innerHTML = text ? '<p class="acc-note ' + (kind === 'err' ? 'is-err' : kind === 'ok' ? 'is-ok' : '') + '">' + esc(text) + '</p>' : '';
}

function renderGuest() {
  box.innerHTML = [
    '<div class="section-head"><div><p class="label">ACCOUNT / 账号</p><h2>换设备也能接着学。</h2></div></div>',
    '<p class="acc-lead">不登录也能用，进度只存在这台设备。登录后可以把进度存到云端，换手机或换电脑再拉回来。</p>',
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
      const pw = box.querySelector('input[name="password"]');
      pw.setAttribute('autocomplete', mode === 'login' ? 'current-password' : 'new-password');
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
      if (data.recoveryCode) {
        box.innerHTML = [
          '<div class="section-head"><div><p class="label">ACCOUNT / 账号</p><h2>账号建好了，先把这串码存下来。</h2></div></div>',
          '<p class="acc-code">' + esc(data.recoveryCode) + '</p>',
          '<p class="acc-lead">这串恢复码<b>只显示这一次</b>。忘记密码时靠它找回，请存到备忘录或微信收藏。</p>',
          '<button type="button" data-copied>我存好了</button>'
        ].join('');
        box.querySelector('[data-copied]').addEventListener('click', () => renderLogged(data.username));
        return;
      }
      renderLogged(data.username);
    } catch (err) {
      note(err.message, 'err');
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
      box.querySelector('[data-acc-note]').innerHTML =
        '<p class="acc-code">' + esc(data.recoveryCode) + '</p><p class="acc-lead">密码已重置。这是<b>新的恢复码</b>，旧的作废，存好它。</p>';
    } catch (err) {
      note(err.message, 'err');
    }
  });
}

function renderLogged(username) {
  const n = Object.keys(localItems()).length;
  box.innerHTML = [
    '<div class="section-head"><div><p class="label">ACCOUNT / 账号</p><h2>已登录：' + esc(username) + '</h2></div></div>',
    '<p class="acc-lead">本机有 ' + n + ' 条进度记录。上传会用本机覆盖云端，下载会用云端覆盖本机——两边不一致时先想清楚要哪一份。</p>',
    '<div class="acc-actions">',
    '<button type="button" data-up>把本机进度存到云端</button>',
    '<button type="button" data-down>把云端进度拉到本机</button>',
    '<button type="button" class="ghost" data-logout>退出登录</button>',
    '</div>',
    '<div data-acc-note></div>',
    '<details class="acc-details"><summary>不再需要这个账号</summary>',
    '<p>注销会删掉账号和云端进度，不可恢复。本机进度保留。</p>',
    '<form data-del class="acc-form"><label>输入密码确认<input name="password" type="password" required /></label>',
    '<button type="submit" class="danger">永久注销</button></form></details>'
  ].join('');

  box.querySelector('[data-up]').addEventListener('click', async () => {
    note('正在上传…');
    try {
      const items = localItems();
      const data = await api('/api/progress', { method: 'PUT', body: JSON.stringify({ items }) });
      note('已存到云端（' + Object.keys(items).length + ' 条，' + new Date(data.at).toLocaleString() + '）', 'ok');
    } catch (err) { note(err.message, 'err'); }
  });

  box.querySelector('[data-down]').addEventListener('click', async () => {
    note('正在读取云端…');
    try {
      const data = await api('/api/progress');
      if (!data.items) { note('云端还没有进度，先上传一次吧。', 'err'); return; }
      writeItems(data.items);
      note('已拉取 ' + Object.keys(data.items).length + ' 条，正在刷新…', 'ok');
      setTimeout(() => location.reload(), 800);
    } catch (err) { note(err.message, 'err'); }
  });

  box.querySelector('[data-logout]').addEventListener('click', async () => {
    try { await api('/api/auth/logout', { method: 'POST', body: '{}' }); } catch (e) {}
    renderGuest();
  });

  const df = box.querySelector('[data-del]');
  if (df) df.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!confirm('确定注销？账号和云端进度都会被删掉，无法恢复。')) return;
    note('正在注销…');
    try {
      await api('/api/auth/delete', { method: 'POST', body: JSON.stringify({ password: e.target.password.value }) });
      renderGuest();
      note('账号已注销。', 'ok');
    } catch (err) { note(err.message, 'err'); }
  });
}

async function init() {
  box.innerHTML = '<p class="acc-lead">正在检查登录状态…</p>';
  try {
    const data = await api('/api/auth/me');
    data.username ? renderLogged(data.username) : renderGuest();
  } catch (e) {
    renderGuest();
  }
}
