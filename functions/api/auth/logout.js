import { json, destroySession, clearCookie } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  try { await destroySession(env, request); } catch {}
  return json({ ok: true }, 200, { "set-cookie": clearCookie() });
}
