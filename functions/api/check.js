/**
 * POST /api/check  —— 规则版检查（不调模型，零成本，零延迟）
 *
 * 和 /api/judge 的区别：
 *   /api/check  完全确定性，输出「覆盖度 + 缺什么」，免费
 *   /api/judge  调模型做语义判定，输出「档位 + 误概念」，按 token 计费
 *
 * 前端默认走 /api/check。等有收入了，把默认切到 /api/judge 即可，接口形状不用改。
 */

import { judgeByRules } from "../_lib/rule-judge.js";

const RATE_LIMIT = 60; // 每 IP 每分钟。规则版不花钱，但要防止被打满 Functions 配额
const buckets = new Map();

function tooMany(ip, now) {
  const b = buckets.get(ip);
  if (!b || now - b.ts > 60_000) {
    buckets.set(ip, { n: 1, ts: now });
    if (buckets.size > 5000) buckets.clear();
    return false;
  }
  b.n += 1;
  return b.n > RATE_LIMIT;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

export async function onRequestPost({ request }) {
  if (tooMany(request.headers.get("cf-connecting-ip") || "local", Date.now())) {
    return json({ error: "请求太频繁，休息一分钟再来" }, 429);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "请求体不是合法 JSON" }, 400);
  }

  const lessonId = String(body?.lesson || "").trim();
  const answer = String(body?.answer || "");
  if (answer.length > 8000) return json({ error: "答案超过 8000 字" }, 413);

  const result = judgeByRules(lessonId, answer);
  if (result.error) return json({ error: result.error }, result.status || 400);
  return json(result);
}

export async function onRequestGet() {
  return json({
    ok: true,
    mode: "rule",
    usage: "POST /api/check  {lesson:'neigong-01', answer:'...'}",
  });
}
