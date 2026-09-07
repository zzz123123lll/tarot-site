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

  // 成熟解读：把牌面读成"你此刻的处境"，第二人称、和问题绑定，不甩关键词列表。
  function cardPara(c, i, n) {
    const name = c.card.name;
    const rev = c.reversed ? '·逆位' : '';
    const label = c.position.label;
    const img = c.img || '';
    const meaning = c.meaning || '';

    let lead;
    if (n === 1) lead = '落在「' + label + '」的是【' + name + '】' + rev + '。';
    else if (i === 0) lead = '先看「' + label + '」——【' + name + '】' + rev + '。';
    else if (i === n - 1) lead = '往「' + label + '」看，是【' + name + '】' + rev + '。';
    else lead = '接着是「' + label + '」——【' + name + '】' + rev + '。';

    const bridge = c.reversed
      ? ' 它逆位落在这里，是在提醒：'
      : (n === 1 ? ' 放进你这件事里，它在说：'
        : (i === 0 ? ' 放进你这件事里，它是在说：'
          : (i === n - 1 ? ' 顺着这个趋势，它指向的是：'
            : ' 回到你此刻的处境，它是说：')));

    let body = lead;
    if (img) body += ' 牌面上，' + img;
    if (meaning) body += bridge + meaning;
    return body;
  }

  function assembleProse(result) {
    if (!result || !result.cards) return '';
    const cards = result.cards;
    const n = cards.length;
    const q = (result.question || '').trim();
    const s = result.synthesis || {};
    const out = [];

    out.push(result.spread.name + ' · ' + (result.intent ? result.intent.label : '一般指引'));

    // 开场：问、人话、诚实框架
    let open = q ? '你问的是「' + q + '」' : '这是此刻的你';
    if (n === 1) open += '。我为你抽到一张牌，它是这样说的：';
    else if (n === 3) open += '。这三张牌连起来，是这样一条路：';
    else open += '。这 ' + n + ' 张牌把这件事铺开，是这样说的：';
    out.push(open);

    // 逐张：读画面 → 放进处境
    for (let i = 0; i < n; i++) out.push(cardPara(cards[i], i, n));

    // 收束：能量与格局，连成一句
    const synth = [];
    if (s.elements && s.elements.length) synth.push(s.elements.join(' '));
    if (s.arcana && s.arcana.length) synth.push(s.arcana.join(' '));
    if (synth.length) out.push(synth.join(' '));

    // 一句话
    if (s.takeaway) out.push(s.takeaway);

    // 诚实提醒
    if (s.caution && s.caution.length) out.push(s.caution.join(' '));

    out.push('—— 牌面与牌义溯源韦特《Pictorial Key》(1910) 与金色黎明对应；这是当下能量的倾向，不是宿命判决，选择权始终在你。');

    return out.join('\n\n');
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