/**
 * AI 实战通关 · 判分引擎 v1
 *
 * 设计目标：
 * - 与页面解耦：Node 测试和浏览器共用同一份逻辑。
 * - 只做可解释的规则判断，不假装语义判分。
 * - 每个评分项独立给分，支持 partial / needs_review。
 * - 返回 missing 列表，便于 UI 指出具体不足。
 */
export const ENGINE_VERSION = '1.1.0';

export function normalize(value) {
  return String(value == null ? '' : value)
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function roundScore(n) {
  return Math.round(n * 10) / 10;
}


function parseJsonAnswer(text) {
  const raw = String(text == null ? '' : text).trim();
  const candidates = [];
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) candidates.push(fenced[1].trim());
  candidates.push(raw);
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) candidates.push(raw.slice(firstBrace, lastBrace + 1));
  const firstBracket = raw.indexOf('[');
  const lastBracket = raw.lastIndexOf(']');
  if (firstBracket >= 0 && lastBracket > firstBracket) candidates.push(raw.slice(firstBracket, lastBracket + 1));
  for (const c of candidates) {
    try { return JSON.parse(c); } catch (e) {}
  }
  return undefined;
}

function getPath(obj, path) {
  let cur = obj;
  for (const part of String(path).split('.')) {
    if (cur == null) return undefined;
    if (Array.isArray(cur) && /^\d+$/.test(part)) cur = cur[Number(part)];
    else cur = cur[part];
  }
  return cur;
}

function missingValue(v) {
  return v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
}

function runValidator(spec, answerText) {
  if (!spec || !spec.type) return null;
  const missing = [];
  if (spec.type === 'json') {
    const parsed = parseJsonAnswer(answerText);
    if (parsed === undefined) return { type: 'json', pass: false, missing: ['答案中必须包含可解析的 JSON'] };
    const required = Array.isArray(spec.required) ? spec.required : [];
    for (const path of required) {
      if (missingValue(getPath(parsed, path))) missing.push('JSON 缺少字段：' + path);
    }
    return { type: 'json', pass: missing.length === 0, missing };
  }
  if (spec.type === 'numeric') {
    const expected = Number(spec.expected);
    const tolerance = Number.isFinite(Number(spec.tolerance)) ? Math.abs(Number(spec.tolerance)) : 0;
    const nums = (String(answerText).match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
    const found = nums.some((n) => Math.abs(n - expected) <= tolerance);
    return {
      type: 'numeric',
      pass: found,
      missing: found ? [] : ['数值需为 ' + expected + (tolerance ? ' ± ' + tolerance : '')],
      expected,
      tolerance
    };
  }
  if (spec.type === 'regex') {
    const patterns = Array.isArray(spec.patterns) ? spec.patterns : [];
    for (const p of patterns) {
      let re;
      let pattern = String(p.pattern || '');
      let flags = String(p.flags || '');
      if (pattern.startsWith('(?i)')) { pattern = pattern.slice(4); flags += 'i'; }
      try { re = new RegExp(pattern, flags); } catch (e) { missing.push('校验规则无效：' + (p.label || p.pattern)); continue; }
      if (!re.test(String(answerText))) missing.push(p.label || ('缺少结构：' + p.pattern));
    }
    return { type: 'regex', pass: missing.length === 0, missing };
  }
  if (spec.type === 'code_static') {
    const req = Array.isArray(spec.required) ? spec.required : [];
    const forb = Array.isArray(spec.forbidden) ? spec.forbidden : [];
    for (const x of req) if (!String(answerText).includes(x)) missing.push('代码缺少：' + x);
    for (const x of forb) if (String(answerText).includes(x)) missing.push('代码不应包含：' + x);
    return { type: 'code_static', pass: missing.length === 0, missing };
  }
  return { type: spec.type, pass: false, missing: ['未知结构校验类型：' + spec.type] };
}

function evaluateCriterion(criterion, answerText) {
  const id = criterion.id;
  const label = criterion.label || id;
  const weight = Number(criterion.weight) || 0;
  const base = { id, label, weight, type: criterion.type, status: 'fail', score: 0, missing: [] };

  if (criterion.type === 'manual') {
    return {
      ...base,
      status: 'ungradable',
      gradable: false,
      missing: [label],
      note: '需要人工判断'
    };
  }

  if (criterion.type === 'term_groups') {
    const groups = Array.isArray(criterion.groups) ? criterion.groups : [];
    if (!groups.length) {
      return { ...base, status: 'ungradable', gradable: false, missing: [label], note: '评分项没有定义关键词组' };
    }
    const groupResults = groups.map((group) => {
      const terms = Array.isArray(group.terms) ? group.terms : [];
      const hit = terms.some((term) => normalize(answerText).includes(normalize(term)));
      return { label: group.label || terms[0] || '未命名', terms, hit };
    });
    const matched = groupResults.filter((g) => g.hit).length;
    const missing = groupResults.filter((g) => !g.hit).map((g) => g.label);
    let score = weight * (matched / groups.length);
    let status = 'fail';
    if (matched === groups.length) status = 'pass';
    else if (matched > 0) status = 'partial';
    const validation = runValidator(criterion.validator, answerText);
    if (validation && !validation.pass) {
      if (status === 'pass') status = 'partial';
      score = roundScore(score * 0.5);
      for (const m of validation.missing) if (!missing.includes(m)) missing.push(m);
    }
    return {
      ...base,
      status,
      score: roundScore(score),
      max: weight,
      matched,
      total: groups.length,
      groups: groupResults,
      validator: validation || undefined,
      missing
    };
  }

  if (criterion.type === 'min_length') {
    const min = Number(criterion.min) || 0;
    const actual = String(answerText || '').length;
    const pass = actual >= min;
    return {
      ...base,
      status: pass ? 'pass' : 'fail',
      score: pass ? weight : 0,
      max: weight,
      actualLength: actual,
      minLength: min,
      missing: pass ? [] : ['至少 ' + min + ' 字']
    };
  }

  return { ...base, status: 'ungradable', gradable: false, missing: [label], note: '未知评分项类型' };
}

/**
 * @param {{minLength?:number, criteria:Array}} exercise
 * @param {string} answer
 * @returns {{
 *   engineVersion:string, score:number, max:number, percent:number,
 *   status:'pass'|'partial'|'fail'|'too_short'|'needs_review',
 *   criteria:Array, missing:string[], gradable:boolean
 * }}
 */
export function grade(exercise, answer) {
  const criteria = Array.isArray(exercise && exercise.criteria) ? exercise.criteria : [];
  const text = String(answer == null ? '' : answer).trim();
  const minLength = Number(exercise && exercise.minLength) || 0;
  const max = criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);

  if (text.length < minLength) {
    return {
      engineVersion: ENGINE_VERSION,
      score: 0,
      max,
      percent: 0,
      status: 'too_short',
      criteria: criteria.map((c) => ({
        id: c.id,
        label: c.label || c.id,
        weight: Number(c.weight) || 0,
        type: c.type,
        status: 'not_checked',
        score: 0,
        missing: [],
        note: '答案未达到最低长度'
      })),
      missing: [],
      gradable: true
    };
  }

  const results = criteria.map((c) => evaluateCriterion(c, text));
  const score = roundScore(results.reduce((sum, r) => sum + (Number(r.score) || 0), 0));
  const hasUngradable = results.some((r) => r.status === 'ungradable');
  const allPass = results.length > 0 && results.every((r) => r.status === 'pass');
  let status = 'fail';
  if (hasUngradable) status = 'needs_review';
  else if (allPass) status = 'pass';
  else if (score > 0) status = 'partial';

  const missing = [];
  results.forEach((r) => (r.missing || []).forEach((m) => { if (!missing.includes(m)) missing.push(m); }));

  return {
    engineVersion: ENGINE_VERSION,
    score,
    max,
    percent: max ? Math.round((score / max) * 1000) / 10 : 0,
    status,
    criteria: results,
    missing,
    gradable: !hasUngradable
  };
}

/**
 * 客观题判分：有唯一答案，直接判断对错。
 * @param {{options:string[], answer:number, explanation?:string}} question
 * @param {number|null} selected
 */
export function gradeObjective(question, selected) {
  const answer = Number(question && question.answer);
  const picked = selected == null || selected === '' ? null : Number(selected);
  const correct = picked !== null && picked === answer;
  return {
    status: picked === null ? 'unanswered' : (correct ? 'correct' : 'incorrect'),
    correct,
    selected: picked,
    answer,
    explanation: (question && question.explanation) || '',
    optionCount: Array.isArray(question && question.options) ? question.options.length : 0
  };
}
