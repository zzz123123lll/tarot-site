/**
 * POST /api/judge  —— 关卡判分（在线、权威、必须可回放）
 *
 * v2 的核心变化：判定从「覆盖 / 部分 / 未覆盖」升级为
 *   ① 表现水平（0 未涉及 / 1 提及未展开 / 2 准确解释），每档有可观察描述符
 *   ② 误概念（独立维度，可与「准确解释」同时成立）
 *
 * 为什么误概念必须独立：v1 的 covered 是单值，表达不了
 * 「说对了要点但因果是错的」——而这是学员最容易犯、也最该被指出来的错。
 *
 * 其余工程约束（v1 已建立，不再改）：
 *  - 模型只取证，不打分；分数由代码算
 *  - 引用可校验，编造引用降级为 uncertain
 *  - 三元组溯源 schema / rubric / judge
 *  - 缓存键含 judge_version
 *  - 故障 ≠ 判定：故障返回 202 + pending，绝不返回 0 分
 */

import { getRubric, LEVEL_LABELS } from "../_lib/rubrics.js";

const SCHEMA_VERSION = 2;
const DEFAULT_BASE = "https://api.deepseek.com/v1";
const DEFAULT_MODEL = "deepseek-chat";
const MIN_ANSWER_LEN = 20;
const MAX_ANSWER_LEN = 4000;
const CACHE_MAX = 400;
const RATE_LIMIT = 30;
const REVIEW_RATIO = 0.3;

// 判分规则参与版本计算：改这段文字，judge_version 就变，历史结果指向旧版本
const SYSTEM_RULES = [
  "你是一个严格的阅卷老师，按给定的可观察描述符给答案定档。",
  "",
  "【铁律：只看内容】",
  "以下因素一律不得影响你的判定，出现即视为判错：",
  "  · 答案的长短、字数、是否分点排版",
  "  · 语气是否自信、是否使用专业术语、是否自称「我确定」",
  "  · 答案是否提到来源、链接、名人或权威",
  "长而空泛的答案，档位不得高于短而准确的答案。",
  "",
  "【定档规则】",
  "每个得分点给了 3 档描述符。三档是包含关系，不是三个互斥类别：",
  "  0 未涉及 —— 答案完全没有涉及这个得分点",
  "  1 涉及了 —— 提到了相关内容，但没有同时满足 2 档的两条条件。",
  "             包括「只做到一半」「做到了但缺一步」「有示例但只有一个」这类情况，",
  "             统统归 1 档。不要因为它不符合 1 档描述里举的例子就判 0。",
  "  2 准确   —— 同时满足 ①② 两条条件，缺一不可。",
  "",
  "【跑题与太短不是一回事】",
  "长度够、但完全没回答本题（例如只评价课程）→ 每一条都给 0，不要设 uncertain。",
  "长度不足（少于 20 字）、看不出是否理解 → uncertain 设为 true。",
  "区别在于：「没答」是一个判定，「读不出来」才是无法判断。",    "【同义表达算满足】",
    "学员用自己的话把同一个意思说清楚，等同于出现原词。",
    "不要因为没写出「Token」「Query」「Prefill」这些术语就降档。",
    "",
    "【报菜名不算满足】",
    "把相关术语罗列一遍、但不说明它们之间的关系，只能给 1 档。",
    "判定 2 档看的是「有没有建立因果或机制联系」，不是「出现了几个关键词」。",
    "",
  "【误概念：独立判定】",
  "每条得分点下面附了常见误概念清单。即使答案已经达到 2 档，",
  "只要其中出现了清单里描述的错误说法，也必须把它记入 error_ids。",
  "判断依据是「这个说法本身对不对」，不是「它有没有影响得分点」。",
  "**即使答案前后自相矛盾（先说对、后面又否定），档位仍按说对的那部分判，",
  "矛盾之处记入 error_ids，不要因此降档。** 档位和误概念是两个独立维度。",
  "没有命中就返回空数组。",
  "",
  "【取证】",
  "evidence 必须是答案原文的逐字片段（不要改写、不要拼接、不要补全），",
  "用来证明你的定档。达不到 1 档时可以填空字符串。",
  "",
  "严格输出 JSON，不要任何解释文字。格式：",
  '{"items":[{"id":"R1","level":2,"uncertain":false,"evidence":"原文片段","error_ids":[],"missing":""}]}',
  "items 必须包含全部得分点，顺序不变。",
].join("\n");

const cache = new Map();
const buckets = new Map();

export function clearCache() {
  cache.clear();
  buckets.clear();
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

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[\s\u3000"'“”‘’`、，,。.;；:：!！?？()（）[\]【】<>《》~～\-—_/\\|*]/g, "");
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function tooMany(ip, now) {
  const b = buckets.get(ip);
  if (!b || now - b.ts > 60_000) {
    buckets.set(ip, { n: 1, ts: now });
    if (buckets.size > 2000) buckets.clear();
    return false;
  }
  b.n += 1;
  return b.n > RATE_LIMIT;
}

async function judgeVersionFor(model, lesson) {
  const seed = `${SCHEMA_VERSION}::${model}::${lesson.version}::${SYSTEM_RULES}`;
  return (await sha256Hex(seed)).slice(0, 10);
}

function buildPrompt(lesson, answer) {
  const items = lesson.items.map((it) => ({
    id: it.id,
    levels: it.levels,
    misconceptions: it.misconceptions.map((m) => ({ id: m.id, desc: m.desc })),
  }));

  return [
    { role: "system", content: SYSTEM_RULES },
    {
      role: "user",
      content: JSON.stringify({ 任务: "按描述符给下列答案的每个得分点定档，并标出命中的误概念", 得分点: items, 学生答案: answer }, null, 2),
    },
  ];
}

async function callLLM(env, messages, apiKey, model) {
  const base = (env.LLM_BASE_URL || DEFAULT_BASE).replace(/\/+$/, "");

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0,
      max_tokens: 1400,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`LLM ${res.status}: ${detail.slice(0, 300)}`);
  }
  const data = await res.json();
  return { text: data?.choices?.[0]?.message?.content || "", usage: data?.usage || null, model };
}

function parseJudgement(text, lesson) {
  const cleaned = String(text).replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  let obj;
  try {
    obj = JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("模型没有返回 JSON");
    obj = JSON.parse(m[0]);
  }
  const list = Array.isArray(obj?.items) ? obj.items : [];
  const byId = new Map(list.map((x) => [String(x?.id || ""), x]));

  // 以 rubric 为准重新对齐：模型漏条、乱序、多返回都不影响结果
  return lesson.items.map((it) => {
    const got = byId.get(it.id) || {};
    const level = [0, 1, 2].includes(got.level) ? got.level : 0;
    const validErrors = it.misconceptions.map((m) => m.id);
    return {
      id: it.id,
      level,
      uncertain: got.uncertain === true || ![0, 1, 2].includes(got.level),
      evidence: String(got.evidence || "").trim().slice(0, 300),
      error_ids: Array.isArray(got.error_ids) ? got.error_ids.filter((e) => validErrors.includes(e)) : [],
      missing: String(got.missing || "").trim().slice(0, 200),
    };
  });
}

function assemble(lesson, judgements, answer) {
  const normAnswer = normalize(answer);

  const items = lesson.items.map((it) => {
    const j = judgements.find((x) => x.id === it.id) || { level: 0, uncertain: true, evidence: "", error_ids: [], missing: "" };
    let level = j.level;
    let uncertain = j.uncertain;
    let verified = null;
    let note = "";

    if (j.evidence) {
      const q = normalize(j.evidence);
      if (q.length >= 4) {
        verified = normAnswer.includes(q);
        if (!verified) {
          // 模型引用了学生没写过的原文 —— 最危险的失败模式，直接降档
          level = 0;
          uncertain = true;
          note = "模型引用的原文在答案中找不到，已降级为待人工确认";
        }
      }
    }

    const base = (it.points * level) / 2;
    const hitErrors = it.misconceptions.filter((m) => j.error_ids.includes(m.id));
    const penalty = hitErrors.reduce((s, m) => s + m.penalty, 0);
    const score = uncertain ? 0 : Math.max(0, Math.round((base - penalty) * 10) / 10);

    const nextLevel = level < 2 ? it.levels[level + 1] : null;

    return {
      id: it.id,
      title: it.title,
      level,
      level_label: LEVEL_LABELS[level],
      uncertain,
      score,
      max: it.points,
      evidence: j.evidence,
      evidence_verified: verified,
      errors: hitErrors.map((m) => ({ id: m.id, desc: m.desc, penalty: m.penalty })),
      penalty,
      // 缺什么优先用模型的话；没有就用「下一档描述符」，保证建议和标准是同一套语言
      missing: nextLevel
        ? j.missing || `要达到「${nextLevel.label}」：${nextLevel.desc}`
        : j.missing || "",
      note,
    };
  });

  const max = items.reduce((s, x) => s + x.max, 0);
  const total = Math.round(items.reduce((s, x) => s + x.score, 0) * 100) / 100;
  const ratio = max ? total / max : 0;
  const verdict = ratio >= (lesson.passRatio ?? 0.8) ? "pass" : ratio >= 0.5 ? "partial" : "fail";
  const uncertainCount = items.filter((x) => x.uncertain).length;

  // 建议完全由代码生成：每条都能对应到一个档位缺口或一个误概念，不让模型自由发挥
  const next_actions = [];
  for (const x of items) {
    if (x.errors.length) {
      next_actions.push(`【${x.id} ${x.title}】有个说法要改：${x.errors.map((e) => e.desc).join("；")}`);
    }
    if (x.level < 2 && !x.uncertain) {
      next_actions.push(`【${x.id} ${x.title}】${x.missing || "补齐下一档的条件"}`);
    }
  }

  return {
    total,
    max,
    ratio: Math.round(ratio * 100) / 100,
    verdict,
    items,
    next_actions: next_actions.slice(0, 4),
    needs_review: uncertainCount / items.length > REVIEW_RATIO,
  };
}

export async function onRequestPost({ request, env }) {
  const started = Date.now();

  // 两档密钥：请求带 x-user-key 就用学员自己的，不带就用站长配置的免费额度
  const userKey = (request.headers.get("x-user-key") || "").trim();
  const apiKey = userKey || (env.LLM_API_KEY || "").trim();
  const model = (request.headers.get("x-user-model") || env.LLM_MODEL || DEFAULT_MODEL).trim();

  if (!apiKey) return json({ error: "服务端未配置 LLM_API_KEY，请求也没带 x-user-key" }, 500);
  if (env.JUDGE_SECRET && request.headers.get("x-judge-secret") !== env.JUDGE_SECRET) {
    return json({ error: "unauthorized" }, 401);
  }
  // 自带 key 的不占站长额度：花的是他自己的钱，不设站点级限流
  if (!userKey && tooMany(request.headers.get("cf-connecting-ip") || "local", Date.now())) {
    return json({ error: "免费额度用得有点快，休息一分钟，或填自己的 key 解除限制" }, 429);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "请求体不是合法 JSON" }, 400);
  }

  const lessonId = String(body?.lesson || "").trim();
  const answer = String(body?.answer || "").trim();
  const lesson = getRubric(lessonId);
  if (!lesson) return json({ error: `没有找到关卡 ${lessonId} 的得分点` }, 404);
  if (answer.length > MAX_ANSWER_LEN) return json({ error: `答案超过 ${MAX_ANSWER_LEN} 字` }, 413);

  const judgeVersion = await judgeVersionFor(model, lesson);
  const base = { lesson: lessonId, schema_version: SCHEMA_VERSION, rubric_version: lesson.version, judge_version: judgeVersion };

  // 太短 = 判定，不是故障：200 + insufficient
  if (answer.length < MIN_ANSWER_LEN) {
    return json({
      ...base,
      total: 0,
      max: lesson.items.reduce((s, x) => s + x.points, 0),
      ratio: 0,
      verdict: "insufficient",
      items: lesson.items.map((it) => ({
        id: it.id, title: it.title, level: 0, level_label: LEVEL_LABELS[0], uncertain: true,
        score: 0, max: it.points, evidence: "", evidence_verified: null, errors: [], penalty: 0,
        missing: "答案太短，无法定档", note: "",
      })),
      next_actions: ["先把你的理解写完整（至少三句话），再来检查"],
      needs_review: false,
      meta: { model, cached: false, ms: Date.now() - started },
    });
  }

  const key = await sha256Hex(`${judgeVersion}::${lessonId}::${normalize(answer)}`);
  if (cache.has(key)) {
    return json({ ...cache.get(key), meta: { ...cache.get(key).meta, cached: true, ms: Date.now() - started } });
  }

  let result;
  let usage = null;

  try {
    let out = await callLLM(env, buildPrompt(lesson, answer), apiKey, model);
    usage = out.usage;
    let judgements;
    try {
      judgements = parseJudgement(out.text, lesson);
    } catch {
      out = await callLLM(env, [...buildPrompt(lesson, answer), { role: "user", content: "只输出 JSON，不要任何其他文字。" }], apiKey, model);
      usage = out.usage;
      judgements = parseJudgement(out.text, lesson);
    }
    result = assemble(lesson, judgements, answer);
  } catch (err) {
    // 故障不是结论：202 + pending，绝不写 0 分
    console.log(JSON.stringify({ evt: "judge_error", lesson: lessonId, judge_version: judgeVersion, msg: String(err?.message || err).slice(0, 200) }));
    return json(
      {
        ...base,
        verdict: "pending",
        retryable: true,
        total: null,
        max: null,
        ratio: null,
        items: [],
        next_actions: ["这次没判定成功，你的答案还在这台设备上，稍后重试即可"],
        needs_review: false,
        meta: { model, ms: Date.now() - started },
      },
      202
    );
  }

  const payload = { ...base, ...result, meta: { model, cached: false, ms: Date.now() - started, usage } };
  if (cache.size >= CACHE_MAX) cache.clear();
  cache.set(key, payload);

  console.log(JSON.stringify({
    evt: "judge",
    lesson: lessonId,
    judge_version: judgeVersion,
    hash: key.slice(0, 8),
    len: answer.length,
    ratio: payload.ratio,
    levels: payload.items.map((x) => `${x.id}:${x.level}`).join(","),
    errors: payload.items.flatMap((x) => x.errors.map((e) => e.id)),
    review: payload.needs_review,
  }));

  return json(payload);
}

export async function onRequestGet() {
  return json({ ok: true, schema_version: SCHEMA_VERSION, usage: "POST /api/judge  {lesson:'neigong-01', answer:'...'}" });
}
