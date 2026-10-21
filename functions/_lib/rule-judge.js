/**
 * 规则判分器：零成本、零延迟、完全确定、可逐条解释。
 *
 * 它输出的是「覆盖信号」，不是「分数」。这个区别是刻意的：
 *   规则能判断「你有没有谈到这个方向」
 *   规则判断不了「你说的因果对不对」
 * 把后者假装成前者，就是现在那个关键词引擎被人骂的原因。
 *
 * 能做的三件事：
 *   1. 结构门槛：太短、只有口号、没有机制表述 → 直接告诉学员补什么
 *   2. 概念覆盖：每个得分点给一组词，命中几个算几个（分组命中，不是单词匹配）
 *   3. 逐条对照：没覆盖的条目，直接把「2 档该说什么」摊给学员看
 *
 * 不能做的：判断因果对错、判断是不是抄了参考答案、判断深度。
 * 这些写在返回值的 limits 里，对学员明说。
 */

import { getRubric, LEVEL_LABELS } from "./rubrics.js";
import { getCues, STRUCTURE_MARKERS } from "./cues.js";
import { getLiteRubric } from "./rubrics-lite.js";
import { getGeneratedRubric } from "./rubrics-generated.js";

const MIN_ANSWER_LEN = 20;
const SHORT_OK = 80;

// 两种标准来源统一成同一个形状：{title, version, items:[{id,title,need,cues}]}
// 01–03 关用完整量表（从 levels[2] 和 cues.js 取），04 关往后用轻量标准（自带 cues）。
function loadLesson(lessonId) {
  const full = getRubric(lessonId);
  if (full) {
    return {
      title: full.title,
      version: full.version,
      items: full.items.map((it) => ({
        id: it.id,
        title: it.title,
        need: it.levels[2].desc,
        cues: getCues(lessonId, it.id),
      })),
    };
  }
  const lite = getLiteRubric(lessonId);
  if (lite) {
    return { title: lite.title, version: lite.version, items: lite.items };
  }
  // 兜底：从站点 content/levels 生成的 36 关标准
  const gen = getGeneratedRubric(lessonId);
  if (gen) {
    return { title: gen.title, version: gen.version, items: gen.items };
  }
  return null;
}

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[\s\u3000"'“”‘’`、，,。.;；:：!！?？()（）[\]【】<>《》~～\-—_/\\|*]/g, "");
}

export function judgeByRules(lessonId, rawAnswer) {
  const lesson = loadLesson(lessonId);
  if (!lesson) return { error: `没有找到关卡 ${lessonId} 的得分点`, status: 404 };

  const answer = String(rawAnswer || "").trim();
  const norm = normalize(answer);
  const maxItems = lesson.items.length;

  // ---- 门槛：太短就直说，不打分也不装作判过 ----
  if (answer.length < MIN_ANSWER_LEN) {
    return {
      mode: "rule",
      lesson: lessonId,
      rubric_version: lesson.version,
      verdict: "insufficient",
      coverage: { hit: 0, total: maxItems, ratio: 0 },
      structure: { length: answer.length, has_mechanism: false, paragraphs: 0 },
      items: lesson.items.map((it) => ({
        id: it.id,
        title: it.title,
        signal: "none",
        hits: [],
        level2: it.need,
      })),
      next_actions: ["先写满三句话：结论是什么、为什么会这样、举一个反例或例子。"],
      limits: LIMITS,
    };
  }

  // ---- 结构信号 ----
  const paragraphs = answer.split(/\n+/).filter((p) => p.trim().length > 8).length;
  const hasMechanism = STRUCTURE_MARKERS.some((m) => answer.includes(m));
  const structure = { length: answer.length, has_mechanism: hasMechanism, paragraphs };

  // ---- 逐条查覆盖 ----
  const items = lesson.items.map((it) => {
    const hits = it.cues.filter((c) => norm.includes(normalize(c)));
    const signal = hits.length === 0 ? "none" : hits.length >= 2 ? "strong" : "weak";
    return { id: it.id, title: it.title, signal, hits, level2: it.need };
  });

  const hit = items.filter((x) => x.signal !== "none").length;
  const ratio = Math.round((hit / maxItems) * 100) / 100;

  // ---- 建议：只针对「没谈到」的条目，并且给出下一档该说什么 ----
  const next_actions = [];
  const missing = items.filter((x) => x.signal === "none");
  for (const m of missing.slice(0, 3)) {
    next_actions.push(`【${m.id} ${m.title}】没检测到相关内容。这一条要说到：${m.level2}`);
  }
  if (!hasMechanism && answer.length > SHORT_OK) {
    next_actions.push("全文没看到「因为 / 所以 / 因此 / 本质」这类因果表述，像是在给结论而不是讲机制。");
  }
  if (missing.length === maxItems) {
    next_actions.unshift("这一段和本关的得分点基本对不上，先确认题目问的是什么。");
  }

  // ---- 报菜名护栏：名词全中但没有任何因果表述，不能算「覆盖」 ----
  // 这是规则判分最容易被骗的地方，也是必须防的一处。
  // 只抓「大量名词堆砌」这一种：命中词 ≥8 个且没有任何因果表述。
  // 门槛太低会误伤正常的短答案（比如只讲选型、天然没有因果词）。
  const totalHits = items.reduce((n, x) => n + x.hits.length, 0);
  const keywordOnly = ratio >= 0.8 && !hasMechanism && totalHits >= 8;
  if (keywordOnly) {
    next_actions.unshift(
      "六个方向的名词基本都出现了，但全文没有「因为 / 所以 / 因此」这类因果表述。检查一下：你是在解释机制，还是只把名词抄了一遍？"
    );
  }

  // ---- 结论措辞：不叫「分数」，叫覆盖度 ----
  const verdict = keywordOnly
    ? "keyword_only"
    : hit === maxItems
    ? "covered"
    : hit >= maxItems * 0.6
    ? "partial"
    : "low";

  return {
    mode: "rule",
    lesson: lessonId,
    rubric_version: lesson.version,
    verdict,
    coverage: { hit, total: maxItems, ratio },
    structure,
    items,
    next_actions: next_actions.length ? next_actions : ["六个方向都谈到了。现在自己对照参考答案，看因果说对没有。"],
    limits: LIMITS,
  };
}

export const LIMITS = [
  "规则只判断「有没有谈到这个方向」，不判断「说得对不对」。",
  "术语用对了但因果讲错（比如把幻觉归因为记忆力差），这里检测不出来。",
  "所以这里给的是覆盖度，不是分数。分数要等语义判定。",
];

export { LEVEL_LABELS };
