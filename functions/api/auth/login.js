import { json, normalizeName, hashPassword, getUser, kv, createSession, sessionCookie, sameHash } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  if (!kv(env)) return json({ error: "服务端未配置 KV，账号功能暂不可用" }, 503);

  let body;
  try { body = await request.json(); } catch { return json({ error: "请求体不是合法 JSON" }, 400); }

  const username = normalizeName(body?.username);
  const password = String(body?.password || "");
  if (!username || !password) return json({ error: "用户名和密码都要填" }, 400);

  const user = await getUser(env, username);
  // 用户名不存在和密码错误给同一个提示，避免被用来探测账号
  if (!user) return json({ error: "用户名或密码不对" }, 401);

  const hash = await hashPassword(password, user.salt);
  if (!sameHash(hash, user.hash)) return json({ error: "用户名或密码不对" }, 401);

  const token = await createSession(env, username);
  return json({ ok: true, username }, 200, { "set-cookie": sessionCookie(token) });
}
