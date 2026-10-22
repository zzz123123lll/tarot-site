/**
 * 进度同步的核心逻辑，供练习页、进度页、导航共用。
 *
 * 设计依据（调研结论，2026-10）：
 *  1. 注册不该是「开墙」，而是「存进度」——登录成功的那一刻自动把本机进度并进云端，
 *     用户感知是「我的东西还在」，而不是「注册了一个新号」。
 *     （Firebase/Supabase/Better Auth 的 anonymous→account 模式全是这个思路）
 *  2. 同步要自动。Anki 的教训：逼用户在「上传/下载」里二选一，选错就丢数据。
 *     我们的数据结构是「一关一个键、键之间互不依赖」，所以可以做并集合并：
 *     云端有本机没有的 → 拉下来；本机有云端没有的 → 推上去；两边都有的 → 本机为准（用户正在这台设备上）。
 *  3. 写入要省着用（KV 免费额度每天 1000 次）：只在「关卡被标记完成」时推一次，
 *     草稿的每次输入都不推。
 */

const PREFIX = 'gjh-notes:';
const AUTH_KEY = 'gjh-auth-state';
const NUDGE_KEY = 'gjh-sync-nudged';

export function localItems() {
  const out = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(PREFIX)) continue;
      try { out[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k)); } catch (e) {}
    }
  } catch (e) {}
  return out;
}

export function writeLocalItems(items) {
  Object.keys(items || {}).forEach((k) => {
    try { localStorage.setItem(PREFIX + k, JSON.stringify(items[k])); } catch (e) {}
  });
}

export function countLocal() {
  return Object.keys(localItems()).length;
}

// 登录状态：5 分钟内用缓存，避免每页都打 /api/auth/me
export async function authState(force) {
  let cached = null;
  try {
    const raw = sessionStorage.getItem(AUTH_KEY);
    if (raw) { const j = JSON.parse(raw); if (Date.now() - j.at < 5 * 60 * 1000) cached = j; }
  } catch (e) {}
  if (cached && !force) return cached;
  let state = { username: null };
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    state = { username: data.username || null };
  } catch (e) {}
  try { sessionStorage.setItem(AUTH_KEY, JSON.stringify({ ...state, at: Date.now() })); } catch (e) {}
  return state;
}

export function clearAuthCache() {
  try { sessionStorage.removeItem(AUTH_KEY); } catch (e) {}
}

export async function pushProgress() {
  const items = localItems();
  if (!Object.keys(items).length) return { ok: true, empty: true };
  const res = await fetch('/api/progress', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);
  return { ok: true, count: Object.keys(items).length, at: data.at };
}

export async function pullProgress() {
  const res = await fetch('/api/progress');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);
  if (!data.items) return { ok: true, empty: true };
  writeLocalItems(data.items);
  return { ok: true, count: Object.keys(data.items).length };
}

/**
 * 合并：以「键」为单位做并集。
 *   两边都有的键 → 本机为准（用户此刻在这台设备上，本机大概率是最新的）
 *   只有云端有的 → 拉下来；只有本机有的 → 保留并推上去
 * 返回 { local, cloud, pulled, pushed } 供页面提示「拉下来 X 条、推上去 Y 条」。
 */
export async function mergeOnLogin() {
  const local = localItems();
  const res = await fetch('/api/progress');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);
  const cloud = data.items || {};

  let pulled = 0;
  Object.keys(cloud).forEach((k) => {
    if (!(k in local)) { local[k] = cloud[k]; pulled++; }
  });

  let pushed = 0;
  const toPush = {};
  Object.keys(local).forEach((k) => {
    if (!(k in cloud)) { toPush[k] = local[k]; pushed++; }
  });
  if (Object.keys(toPush).length) {
    await fetch('/api/progress', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: toPush }),
    });
  }
  writeLocalItems(local);
  return { local: Object.keys(local).length, pulled, pushed };
}

// 未登录时，只在用户「真正完成一关」之后提示一次，别一进来就弹
export function shouldNudgeSignup() {
  let nudged = false;
  try { nudged = !!localStorage.getItem(NUDGE_KEY); } catch (e) {}
  return !nudged;
}

export function markNudged() {
  try { localStorage.setItem(NUDGE_KEY, '1'); } catch (e) {}
}
