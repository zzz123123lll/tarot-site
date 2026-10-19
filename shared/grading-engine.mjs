/**
 * AI 实战通关 · 判分引擎 v1
 *
 * 设计目标：
 * - 与页面解耦：Node 测试和浏览器共用同一份逻辑。
 * - 只做可解释的规则判断，不假装语义判分。
 * - 每个评分项独立给分，支持 partial / needs_review。
 * - 返回 missing 列表，便于 UI 指出具体不足。
 */
export const ENGINE_VERSION = '1.0.0';

export function normalize(value) {
  return String(value == null ? '' : value)
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function roundScore(n) {
  return Math.round(n * 10) / 10;
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
    const score = weight * (matched / groups.length);
    let status = 'fail';
    if (matched === groups.length) status = 'pass';
    else if (matched > 0) status = 'partial';
    return {
      ...base,
      status,
      score: roundScore(score),
      max: weight,
      matched,
      total: groups.length,
      groups: groupResults,
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
