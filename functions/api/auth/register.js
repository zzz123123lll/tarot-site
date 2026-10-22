import {
  json, normalizeName, USERNAME_RE, newSalt, hashPassword, getUser, putUser,
  kv, createSession, sessionCookie, recoveryCode,
} from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  if (!kv(env)) return json({ error: "服务端未配置 KV，账号功能暂不可用" }, 503);

  let body;
  try { body = await request.json(); } catch { return json({ error: "请求体不是合法 JSON" }, 400); }

  const username = normalizeName(body?.username);
  const password = String(body?.password || "");

  if (!USERNAME_RE.test(username)) return json({ error: "用户名要 3–20 位，只能用小写字母、数字、下划线或短横线" }, 400);
  if (password.length < 8) return json({ error: "密码至少 8 位" }, 400);
  if (password.length > 200) return json({ error: "密码太长了" }, 400);

  if (await getUser(env, username)) return json({ error: "这个用户名已经有人用了" }, 409);

  const salt = newSalt();
  const hash = await hashPassword(password, salt);
  const rec = recoveryCode();
  const recHash = await hashPassword(rec, salt);

  await putUser(env, username, { u: username, salt, hash, rec: recHash, createdAt: new Date().toISOString() });

  const token = await createSession(env, username);
  return json(
    { ok: true, username, recoveryCode: rec, note: "这串恢复码只显示这一次。忘了密码时靠它找回，请自己存好。" },
    200,
    { "set-cookie": sessionCookie(token) }
  );
}

export async function onRequestGet() {
  return json({ ok: true, usage: "POST /api/auth/register {username, password}" });
}
