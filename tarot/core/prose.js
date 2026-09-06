// core/prose.js — Prose assembly + optional LLM polish.
// Deterministic assembly is the always-available, offline, grounded output (no hallucinated meanings).
// The LLM path is OPTIONAL: it receives the fully-structured engine result and a strict contract to
// only refine wording and flow — never to invent card meanings, never to detach from the drawn cards,
// and never to drop the honest "caution" section.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(require('./engine.js')); }
  else { root.TarotProse = factory(root.TarotEngine); }
})(typeof self !== 'undefined' ? self : this, function (Engine) {
  const orientationText = (c) => c.reversed ? '（逆位）' : '（正位）';

  function assembleProse(result) {
    if (!result || !result.cards) return '';
    const lines = [];
    const spread = result.spread;
    lines.push(spread.name + ' · ' + (result.intent ? result.intent.label : '一般指引'));
    lines.push('');
    lines.push('宛如在静夜里抽出一张牌——牌面在星光下展开，此刻的能量，正静静与你的问题对望。');
    lines.push('');

    // Card-by-card
    for (const c of result.cards) {
      const head = '【' + c.position.label + ' · ' + c.card.name + orientationText(c) + '】';
      const kw = (c.keywords && c.keywords.length) ? '关键词：' + c.keywords.join(' / ') + '。' : '';
      lines.push(head);
      if (kw) lines.push(kw);
      if (c.elementLabel) lines.push('（元素：' + c.elementLabel + '）');
      // Framework context (role + intent lens), then grounded meaning.
      if (c.context && c.context.length) lines.push(c.context.join(' '));
      if (c.meaning) lines.push('牌义：' + c.meaning);
      lines.push('');
    }

    // Interplay
    const s = result.synthesis || {};
    const interplay = (s.interplay || []).join('');
    if (interplay) { lines.push('牌面互动'); lines.push(interplay); lines.push(''); }

    // Elements
    if (s.elements && s.elements.length) { lines.push('能量构成'); lines.push(s.elements.join('')); lines.push(''); }
    if (s.arcana && s.arcana.length) { lines.push(s.arcana.join('')); lines.push(''); }

    // Guidance
    lines.push('方向与提示');
    for (const g of s.guidance || []) lines.push('· ' + g);
    lines.push('');

    // Caution (honesty)
    lines.push('值得留意');
    for (const ct of s.caution || []) lines.push('· ' + ct);
    lines.push('');

    lines.push('—— 本法牌义源自韦特《Pictorial Key》与金色黎明对应；解读由确定性规则定位、组合、联问生成，不是通用模板。');
    return lines.join('\n');
  }

  // Strict LLM polish prompt: feed structured facts, forbid invention & detachment.
  function buildLLMPrompt(result) {
    const facts = {
      spread: result.spread.name,
      intent: result.intent,
      positions: result.cards.map(c => ({
        slot: c.position.label, card: c.card.name, orientation: c.orientation,
        element: c.elementLabel, keywords: c.keywords, context: c.context
      })),
      interactions: result.interactions.map(x => ({ a: x.cardA, b: x.cardB, relation: x.rel.label })),
      arcana: result.synthesis.arcana,
      elements: result.synthesis.elements,
      guidance: result.synthesis.guidance,
      caution: result.synthesis.caution
    };
    return [
      '你是一位严谨、克制、尊重塔罗传统的解读写作者。请根据下面的结构化占卜结果，写一段把事实连成通顺中文的解读。',
      '',
      '硬性规则：',
      '1. 只改写措辞与衔接，不得增删、篡改任何牌意、位置、元素或结论。',
      '2. 每一句都必须能追溯回上面给出的具体牌、具体位置、具体结论。',
      '3. 必须完整保留「值得留意」部分——不能因为不好听就弱化或删除。',
      '4. 不添加结构化结果中不存在的牌、牌义或预测。',
      '5. 输出为人话、有温度，但保持神秘而不轻浮；不要用套话开头（如"每个人心中都有…"）。',
      '6. 用中文，控制篇幅，自然分段。',
      '',
      '结构化占卜结果：',
      JSON.stringify(facts, null, 2),
      '',
      '请只输出解读正文。'
    ].join('\n');
  }

  // synthesize: deterministic by default; optional llm (async ctx => string) for polish.
  async function synthesize(result, opts) {
    const { llm, model } = opts || {};
    if (typeof llm === 'function') {
      try {
        const prompt = buildLLMPrompt(result);
        const text = await llm(prompt, result);
        if (text && typeof text === 'string' && text.trim()) {
          return { prose: text.trim(), engine: 'llm', model: model || 'llm-provided', grounded: true };
        }
      } catch (e) {
        // fall through to deterministic on any LLM failure
      }
    }
    return { prose: assembleProse(result), engine: 'deterministic', model: 'deterministic-core-v1' };
  }

  return { assembleProse, buildLLMPrompt, synthesize };
});
