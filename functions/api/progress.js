import { json, currentUser, kv } from "../_lib/auth.js";

const MAX_BYTES = 64 * 1024;

export async function onRequestGet({ request, env }) {
  const u = await currentUser(env, request);
  if (!u) return json({ error: "未登录" }, 401);
  const raw = await kv(env).get(`prog:${u}`);
  if (!raw) return json({ ok: true, username: u, progress: null });
  return json({ ok: true, username: u, ...JSON.parse(raw) });
}

export async function onRequestPut({ request, env }) {
  const u = await currentUser(env, request);
  if (!u) return json({ error: "未登录" }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: "请求体不是合法 JSON" }, 400); }

  const text = JSON.stringify(body?.items ?? body);
  if (text.length > MAX_BYTES) return json({ error: "进度数据过大" }, 413);

  const payload = JSON.stringify({ items: JSON.parse(text), at: new Date().toISOString() });
  await kv(env).put(`prog:${u}`, payload);
  return json({ ok: true, at: JSON.parse(payload).at });
}
