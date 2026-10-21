/**
 * POST /api/subscribe —— 收邮箱（换取 PDF）
 *
 * 为什么要有它：现在首页是 mailto:，等于把个人 QQ 邮箱直接写在页面上，
 * 而且收不到结构化线索、没法统计、也没法群发。
 *
 * 存储策略（不绑任何服务也能跑）：
 *   - 配了 SUBS_KV 就写 KV（一年过期）
 *   - 没配就只打日志，Pages 的 Functions 日志里能查到 {evt:"subscribe", email}
 * 这样今天上线就有用，等你愿意在后台加个 KV 命名空间，数据就自动落库。
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "请求体不是合法 JSON" }, 400);
  }

  const email = String(body?.email || "").trim().toLowerCase();
  const source = String(body?.source || "unknown").slice(0, 60);
  const trap = String(body?.website || "").trim(); // 蜜罐字段，正常用户不会填

  if (trap) return json({ ok: true, stored: false }); // 机器人：静默成功
  if (!EMAIL_RE.test(email) || email.length > 200) {
    return json({ error: "邮箱格式不对" }, 400);
  }

  let stored = false;
  if (env.SUBS_KV) {
    try {
      const key = `sub:${Date.now()}:${email}`;
      await env.SUBS_KV.put(key, JSON.stringify({ email, source, at: new Date().toISOString() }), {
        expirationTtl: 60 * 60 * 24 * 365,
      });
      stored = true;
    } catch (e) {
      console.log(JSON.stringify({ evt: "subscribe_kv_error", msg: String(e && e.message) }));
    }
  }

  // 无论是否落库都记一条，方便没配 KV 时在日志里捞
  console.log(JSON.stringify({ evt: "subscribe", email, source, stored }));

  return json({ ok: true, stored });
}

export async function onRequestGet() {
  return json({ ok: true, usage: "POST /api/subscribe {email, source}" });
}
