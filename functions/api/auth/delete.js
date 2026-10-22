import { json, currentUser, hashPassword, getUser, delUser, sameHash, destroySession, clearCookie } from "../../_lib/auth.js";

// 注销：必须带密码确认。删掉用户记录和云端进度，会话一并作废。
export async function onRequestPost({ request, env }) {
  const u = await currentUser(env, request);
  if (!u) return json({ error: "未登录" }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: "请求体不是合法 JSON" }, 400); }
  const password = String(body?.password || "");

  const user = await getUser(env, u);
  if (!user) return json({ error: "账号不存在" }, 404);

  const hash = await hashPassword(password, user.salt);
  if (!sameHash(hash, user.hash)) return json({ error: "密码不对" }, 401);

  await delUser(env, u);
  await destroySession(env, request);
  return json({ ok: true }, 200, { "set-cookie": clearCookie() });
}
