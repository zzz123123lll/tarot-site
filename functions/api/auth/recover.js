import {
  json, normalizeName, hashPassword, getUser, putUser,
  createSession, sessionCookie, sameHash, recoveryCode, newSalt, kv,
} from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  if (!kv(env)) return json({ error: "服务端未配置 KV" }, 503);

  let body;
  try { body = await request.json(); } catch { return json({ error: "请求体不是合法 JSON" }, 400); }

  const username = normalizeName(body?.username);
  const code = String(body?.recoveryCode || "").trim().toLowerCase();
  const password = String(body?.newPassword || "");

  if (password.length < 8) return json({ error: "新密码至少 8 位" }, 400);

  const user = await getUser(env, username);
  if (!user) return json({ error: "用户名或恢复码不对" }, 401);

  const codeHash = await hashPassword(code, user.salt);
  if (!sameHash(codeHash, user.rec)) return json({ error: "用户名或恢复码不对" }, 401);

  const salt = newSalt();
  const hash = await hashPassword(password, salt);
  const next = recoveryCode();
  const recHash = await hashPassword(next, salt);
  await putUser(env, username, { ...user, salt, hash, rec: recHash });

  const token = await createSession(env, username);
  return json({ ok: true, username, recoveryCode: next, note: "密码已重置，这是新的恢复码，旧的作废。" }, 200, {
    "set-cookie": sessionCookie(token),
  });
}
