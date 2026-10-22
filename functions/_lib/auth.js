/**
 * 账号系统的公共部分：口令散列、会话、Cookie。
 *
 * 存储用已经绑定的 KV（变量名 SUBS_KV），键前缀：
 *   user:<用户名>   {u, salt, hash, rec, createdAt}
 *   sess:<token>    {u, exp}
 *   prog:<用户名>   {items, at}      进度快照
 *
 * 为什么不做邮箱验证：发信需要第三方服务（要钱、会进垃圾邮件），
 * 而本站不需要邮箱也能用。忘记密码靠「恢复码」，注册时给一次，让用户自己存。
 */

const PBKDF2_ITER = 100000;
const SESSION_TTL = 60 * 60 * 24 * 30; // 30 天
const KV = "SUBS_KV";

export const USERNAME_RE = /^[a-z0-9][a-z0-9_-]{2,19}$/;

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}

export function normalizeName(s) {
  return String(s || "").trim().toLowerCase();
}

function b64(buf) {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

export function randomToken(bytes = 32) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return b64(a).replace(/[+/=]/g, "").slice(0, 43);
}

// 恢复码：去掉容易看错的 0/o/1/l/i
const REC_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
export function recoveryCode(len = 12) {
  const a = new Uint8Array(len);
  crypto.getRandomValues(a);
  let s = "";
  for (const b of a) s += REC_ALPHABET[b % REC_ALPHABET.length];
  return s.slice(0, 4) + "-" + s.slice(4, 8) + "-" + s.slice(8, 12);
}

export async function hashPassword(password, saltB64) {
  const raw = new TextEncoder().encode(password);
  const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", raw, "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: PBKDF2_ITER, hash: "SHA-256" }, key, 256);
  return b64(bits);
}

export function newSalt() {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return b64(a);
}

export function kv(env) {
  return env && env[KV] ? env[KV] : null;
}

export async function getUser(env, username) {
  const store = kv(env);
  if (!store) return null;
  const raw = await store.get(`user:${username}`);
  return raw ? JSON.parse(raw) : null;
}

export async function putUser(env, username, rec) {
  await kv(env).put(`user:${username}`, JSON.stringify(rec));
}

export async function delUser(env, username) {
  const store = kv(env);
  await store.delete(`user:${username}`);
  await store.delete(`prog:${username}`);
}

export async function createSession(env, username) {
  const token = randomToken(32);
  await kv(env).put(`sess:${token}`, JSON.stringify({ u: username, exp: Date.now() + SESSION_TTL * 1000 }), {
    expirationTtl: SESSION_TTL,
  });
  return token;
}

export async function destroySession(env, request) {
  const token = readCookie(request, "gjh_sess");
  if (token) await kv(env).delete(`sess:${token}`);
}

export function readCookie(request, name) {
  const raw = request.headers.get("Cookie") || "";
  for (const part of raw.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return "";
}

export function sessionCookie(token, maxAge = SESSION_TTL) {
  return `gjh_sess=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearCookie() {
  return "gjh_sess=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
}

// 读当前登录用户，返回用户名或 null
export async function currentUser(env, request) {
  const token = readCookie(request, "gjh_sess");
  if (!token) return null;
  const store = kv(env);
  if (!store) return null;
  const raw = await store.get(`sess:${token}`);
  if (!raw) return null;
  const s = JSON.parse(raw);
  if (!s.exp || s.exp < Date.now()) return null;
  return s.u;
}

export function sameHash(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
