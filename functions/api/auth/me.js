import { json, currentUser } from "../../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const username = await currentUser(env, request);
  return json({ ok: true, username: username || null });
}
