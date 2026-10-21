/**
 * 前端调用片段：把这一关的练习区从「规则引擎」切到 /api/judge
 *
 * 用法（放进你现有的关卡页面脚本里，替换原来的 checkAnswer）：
 *   import { checkAnswer, renderReport } from "/js/judge-client.js";
 *   const report = await checkAnswer("neigong-01", textarea.value);
 *   renderReport(document.getElementById("result"), report);
 *
 * v2 展示变化：每条不再只是「过/不过」，而是
 *   档位（未涉及 / 提及未展开 / 准确解释）+ 命中的误概念 + 下一档还差什么
 * 这一点是刻意的：把判断依据摊开给学员看，比给一个分数更有说服力。
 */

const DRAFT_PREFIX = "gjh:draft:";
const KEY_STORE = "gjh:user-key";
const ENDPOINT_RULE = "/api/check"; // 免费，确定性
const ENDPOINT_AI = "/api/judge"; // 调模型，按次计费

// ---- 自带 key（可选）----
// 学员填了自己的 key 就用自己的额度；没填就用站长的免费额度。
// key 存在本机 localStorage，只在请求头里带一次，服务端用完即弃，不落库。
export function setUserKey(key) {
  try {
    const k = String(key || "").trim();
    if (k) localStorage.setItem(KEY_STORE, k);
    else localStorage.removeItem(KEY_STORE);
    return true;
  } catch {
    return false;
  }
}

export function getUserKey() {
  try {
    return localStorage.getItem(KEY_STORE) || "";
  } catch {
    return "";
  }
}

export function hasUserKey() {
  return getUserKey().length > 0;
}

export function saveDraft(lessonId, text) {
  try {
    localStorage.setItem(DRAFT_PREFIX + lessonId, text);
  } catch {}
}

export function loadDraft(lessonId) {
  try {
    return localStorage.getItem(DRAFT_PREFIX + lessonId) || "";
  } catch {
    return "";
  }
}

export async function checkAnswer(lessonId, answer, mode = "rule") {
  const headers = { "content-type": "application/json" };
  const key = getUserKey();
  if (key) headers["x-user-key"] = key;

  const url = mode === "ai" ? ENDPOINT_AI : ENDPOINT_RULE;
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ lesson: lessonId, answer }),
  });
  const data = await res.json().catch(() => ({ error: "返回内容无法解析" }));
  if (!res.ok && res.status !== 202) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

const VERDICT = { pass: "通过", partial: "接近了", fail: "还没到", insufficient: "写得太短", pending: "待判定" };

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const SIG = {
  strong: { mark: "●", text: "谈到了" },
  weak: { mark: "◐", text: "好像提到" },
  none: { mark: "○", text: "没检测到" },
};
const RULE_VERDICT = {
  covered: "六个方向都谈到了",
  partial: "谈到了大部分",
  low: "大部分没谈到",
  keyword_only: "名词齐了，但没讲机制",
  insufficient: "太短了",
};

function renderRuleReport(el, r) {
  if (r.verdict === "pending") {
    el.innerHTML = `<div class="judge-head"><strong>—</strong>
      <span class="judge-verdict">检查服务暂时不可用</span></div>
      <p class="judge-pending-note">不是你的答案有问题，稍后再点一次。</p>`;
    return;
  }

  const head = `
    <div class="judge-head">
      <strong>${r.coverage.hit} / ${r.coverage.total}</strong>
      <span class="judge-verdict judge-${r.verdict}">${RULE_VERDICT[r.verdict] || r.verdict}</span>
    </div>
    <p class="judge-subnote">这是「谈到了几个方向」，不是分数。</p>`;

  const rows = r.items
    .map((it) => {
      const s = SIG[it.signal];
      const hits = it.hits?.length ? `<span class="judge-hits">命中：${esc(it.hits.join("、"))}</span>` : "";
      const need =
        it.signal === "none"
          ? `<p class="judge-missing">这一条要说到：${esc(it.level2)}</p>`
          : "";
      return `
      <li class="judge-item judge-${it.signal}">
        <span class="judge-tag judge-tag-${it.signal}">${s.mark} ${s.text}</span>
        <span class="judge-title">${esc(it.title)}</span>
        ${hits}
        ${need}
      </li>`;
    })
    .join("");

  const acts = r.next_actions?.length
    ? `<ol class="judge-next">${r.next_actions.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>`
    : "";

  const limits = r.limits?.length
    ? `<p class="judge-limits">${r.limits.map(esc).join("<br>")}</p>`
    : "";

  el.innerHTML = `${head}<ul class="judge-list">${rows}</ul>${acts}${limits}`;
}

export function renderReport(el, r) {
  if (!el) return;
  return r.mode === "rule" ? renderRuleReport(el, r) : renderAiReport(el, r);
}

export function renderAiReport(el, r) {
  if (r.verdict === "pending") {
    el.innerHTML = `
      <div class="judge-head">
        <strong>—</strong>
        <span class="judge-verdict judge-pending">${VERDICT.pending}</span>
      </div>
      <p class="judge-pending-note">判分服务这次没响应，不是你的答案有问题。答案还在这台设备上，稍后再点一次即可。</p>`;
    return;
  }

  const head = `
    <div class="judge-head">
      <strong>${r.total} / ${r.max}</strong>
      <span class="judge-verdict judge-${r.verdict}">${VERDICT[r.verdict] || r.verdict}</span>
      ${r.needs_review ? '<span class="judge-review">这份判定把握不大，建议自己再核对一遍</span>' : ""}
    </div>`;

  const rows = r.items
    .map((it) => {
      const quote = it.evidence
        ? `<blockquote>${esc(it.evidence)}${
            it.evidence_verified === false ? '<em class="judge-warn">（此引用未在答案中找到）</em>' : ""
          }</blockquote>`
        : "";
      const errs = it.errors?.length
        ? `<ul class="judge-errors">${it.errors
            .map((e) => `<li>说法有误：${esc(e.desc)}（−${e.penalty}）</li>`)
            .join("")}</ul>`
        : "";
      return `
      <li class="judge-item judge-lv${it.level}${it.uncertain ? " judge-uncertain" : ""}">
        <span class="judge-tag">${esc(it.level_label)}${it.uncertain ? "？" : ""}</span>
        <span class="judge-title">${esc(it.title)}</span>
        <span class="judge-score">${it.score} / ${it.max}</span>
        ${quote}
        ${errs}
        ${it.missing && it.level < 2 ? `<p class="judge-missing">${esc(it.missing)}</p>` : ""}
      </li>`;
    })
    .join("");

  const next = r.next_actions?.length
    ? `<ol class="judge-next">${r.next_actions.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>`
    : `<p class="judge-done">这一关的要点都覆盖了，可以进下一关。</p>`;

  el.innerHTML = `${head}<ul class="judge-list">${rows}</ul><div class="judge-actions-box">${next}</div>`;
}
