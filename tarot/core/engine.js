// core/engine.js — Deterministic interpretation engine.
// Anti-Barnum design: a reading must be grounded in the specific cards, positions, and question,
// and must be willing to name friction — never a generic floating blurb.
//  1) POSITIONAL  : same card reads differently per spread slot (role lens).
//  2) COMBINATORIAL: cards modify each other via element relations + arcana ratio.
//  3) QUESTION    : interpretation branches on the querent's actual intent.
//  4) Honesty     : reversed cards and cross-element tension are surfaced as caution, not softened.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(
    require('./data/tarot-deck.js'),
    require('./elements.js'),
    require('./spreads.js'),
    require('./questions.js')
  ); }
  else { root.TarotEngine = factory(root.TarotDataDeck, root.TarotElements, root.TarotSpreads, root.TarotQuestions); }
})(typeof self !== 'undefined' ? self : this, function (DECK, Elements, Spreads, Questions) {
  const { cardElement, relation, describeElement, ELEMENTS } = Elements;
  const { getSpread } = Spreads;
  const { detectIntent, getIntent } = Questions;

  const ROLE_NOTE = {
    past:        '追溯它的根源与成因，看它如何铺垫了当下。',
    present:     '它是当下能量的核心，是你正在经历或最贴近的事物。',
    nearfuture:  '顺着这股趋势看短期走向——是倾向，不是断言。',
    future:      '顺着这股趋势看可能的走向——是倾向，不是宿命。',
    obstacle:    '它既是阻碍也是课题，关乎你要如何把它接住、转化。',
    subconscious:'留意隐蔽的惯性、根植的信念与未必察觉的因素。',
    conscious:   '对照你头脑中的目标，看两者是否一致。',
    self:        '映照你自己的立场、态度与看待自己的方式。',
    environment: '多为外界与他人之力，接纳其中不可控的部分。',
    hopesfears:  '渴望与恐惧在此交织，也往往藏着真实的动机。',
    outcome:     '综合当前能量后的一种取向，仍可被选择改变。',
    core:        '这是此刻最需要被看见的一张牌，是当前能量的焦点。'
  };

  const NUMEROLOGY = {
    1: '一，是开端与种子——新的开始、初始的火花。',
    2: '二，是平衡与选择——两股力量在此权衡、结合。',
    3: '三，是生长与展开——初具形态，开始向外生长。',
    4: '四，是稳固与结构——打下的地基，秩序与安顿。',
    5: '五，是冲突与变动——失衡带来的震荡与转折。',
    6: '六，是和谐与调和——恢复平衡、沟通与相融。',
    7: '七，是内省与评估——停顿、回望，重新校准。',
    8: '八，是力量与行动——推动、精进，把力使出去。',
    9: '九，是接近圆满——收获前的沉淀与最后审视。',
    10: '十，是完成与循环——一个周期的圆满，也孕育下一轮。'
  };
  const COURT = {
    Page: '侍从，是一段新旅程的信使或初学者——带着好奇去试探。',
    Knight: '骑士，是行动与追寻的过程——为某个目标而奔行。',
    Queen: '皇后，是内在的成熟与滋养——以沉淀的方式照看。',
    King: '国王，是掌控与权威——把经验化为稳定的力量。'
  };

  function elementLabel(el) { return el ? (describeElement(el).label) : null; }

  // Build the positional reading for one drawn card in one slot.
  function buildCardReading(item, intent, deck) {
    const { card, orientation, position, i } = item;
    const reversed = orientation === 'reversed';
    const geo = card.geo || {};
    const kw = reversed ? geo.keywordsReversed : geo.keywords;
    const text = reversed ? geo.reversed : geo.upright;
    const el = cardElement(card);
    const elInfo = describeElement(el);
    const roleNote = ROLE_NOTE[position.role] || position.framing;

    // Emphasis: which of the intent's focusAreas this card most speaks to
    // (heuristic: an element weighted by the intent raises the card's relevance).
    const emph = intent.emphasis || {};
    const raised = emph[el] ? emph[el] : 0;

    const ctx = [
      position.framing,
      roleNote,
      raised ? '此牌与你的问题高度相关，尤其值得细看。' : ''
    ].filter(Boolean);

    return {
      index: i,
      position: { key: position.key, label: position.label, role: position.role, framing: position.framing },
      card: { index: card.index, name: card.name, en: card.en, arcana: card.arcana, suit: card.suit },
      orientation, reversed,
      element: el, elementLabel: elementLabel(el),
      keywords: kw || [],
      meaning: text || '',
      depth: (function () {
        if (card.arcana === 'minor') {
          if (card.rank && COURT[card.rank]) return [COURT[card.rank]];
          const n = typeof card.number === 'number' ? card.number : (card.number === 'Ace' ? 1 : null);
          if (n && NUMEROLOGY[n]) return [NUMEROLOGY[n]];
        }
        return [];
      })(),
      focus: intent.focusAreas,
      relevance: raised,
      context: ctx,
      // 溯源: the authoritative Waite wording stays visible on the record.
      source: { waiteUpright: card.source && card.source.waiteUpright, waiteReversed: card.source && card.source.waiteReversed },
      sourceIds: (card.source && card.source.sourceIds) || []
    };
  }

  function buildSynthesis({ cards, dominantElements, interactions, majorCount, reversedCount, intent }) {
    const total = cards.length || 1;
    const parts = { arcana: [], elements: [], interplay: [], guidance: [], caution: [] };

    // 1) Arcana ratio
    const majorRatio = majorCount / total;
    if (majorCount) parts.arcana.push(
      majorRatio >= 0.5
        ? '本次共取出' + majorCount + '张/共' + total + '张为大阿尔卡纳，说明这是人生层面的重大课题，而非琐碎小事。'
        : '大阿尔卡纳占' + majorCount + '张，整体偏向现实层面的事件与过程。'
    );

    // 2) Dominant elements
    if (dominantElements.length) {
      const top = dominantElements[0];
      const elInfo = describeElement(top.element);
      parts.elements.push('主导元素为「' + (elInfo ? elInfo.label : top.element) + '」：' + (elInfo ? elInfo.domain : '') + '。');
      if (dominantElements.length > 1) {
        const second = dominantElements[1];
        const s2 = describeElement(second.element);
        parts.elements.push('它又受到「' + (s2 ? s2.label : second.element) + '」的补充。');
      }
    }

    // 3) Interplay (cross-card)
    if (interactions.length) {
      const supp = interactions.filter(x => x.rel.code === 'support').length;
      const chal = interactions.filter(x => x.rel.code === 'challenge').length;
      const crea = interactions.filter(x => x.rel.code === 'creative').length;
      if (supp) parts.interplay.push('牌与牌之间' + supp + '处相生，能量连贯、彼此助益。');
      if (crea) parts.interplay.push(crea + '处相赋能，需要转化而非硬碰。');
      if (chal) parts.interplay.push(chal + '处相克，存在需要调和的拉扯。');
    }

    // 4) Guidance — grounded in the drawn cards' keywords, filtered to the question's lens.
    const kwPool = [];
    for (const c of cards) {
      const el = c.element;
      if (el && (intent.emphasis || {})[el]) { kwPool.push(...(c.keywords || [])); }
    }
    for (const c of cards) { if (!kwPool.includes(c.card.name)) kwPool.push(c.card.name); }
    // 可行动的洞见：用主导元素 + 逆位，给一句方向（不再吐关键词堆）
    if (dominantElements.length) {
      const top = describeElement(dominantElements[0].element);
      parts.guidance.push('围绕你的「' + intent.label + '」问题，最该握住的方向，是把注意力放在「' + top.label + '」的领域——' + top.domain + '——上，让选择从这里生根。');
    }
    parts.guidance.push(intent.lens);

    // 5) Caution — honest angle, anti Barnum / anti positivity-bias.
    if (reversedCount) parts.caution.push('有' + reversedCount + '张处于逆位，能量可能内化、受阻或需要反向理解，值得认真对待而非回避。');
    if (interactions.some(x => x.rel.code === 'challenge')) parts.caution.push('存在元素相克的拉扯，某些进展可能是误解或假象；先厘清再行动。');
    if (!parts.caution.length) parts.caution.push('未见明显的逆位或相克信号，但请记住：牌面给出的是当前能量的倾向，选择权仍在你。');

    // 叙事弧：把牌位串成一条故事线（非并列清单）
    const story = [];
    for (const c of cards) {
      const essence = (c.keywords && c.keywords.length) ? c.keywords[0] : c.card.name;
      story.push('「' + c.position.label + '」的【' + c.card.name + (c.reversed ? '·逆位' : '') + '】带来「' + essence + '」');
    }
    const narrative = (story.length > 1)
      ? '这三张牌连起来，是一条路：' + story.join(' → ') + '。'
      : '此刻的核心，是' + story[0] + '。';

    // 一句话 takeaway：从动向 + 主导元素 + 逆位提炼
    let takeaway = '';
    const topEl = dominantElements.length ? dominantElements[0].element : null;
    const move = cards.map(function (c) { return (c.keywords && c.keywords.length) ? c.keywords[0] : c.card.name; }).join('、');
    takeaway = '把这段牌读成一个动向：' + move + '。' + (topEl ? ('而贯穿它的，是「' + (describeElement(topEl).label) + '」的能量。') : '');
    if (reversedCount) takeaway += ' 其中逆位的部分，是在提醒你：别急着硬来，先落地。';

    return {
      arcana: parts.arcana, elements: parts.elements, interplay: parts.interplay,
      guidance: parts.guidance, caution: parts.caution,
      narrative: narrative, takeaway: takeaway
    };
  }

  // Deterministic, self-documenting interpretation.
  function interpret(opts) {
    const { question = '', intentId, spread = 'single', draw = [], deck = DECK } = opts;
    const spreadDef = getSpread(spread);
    const positions = spreadDef.positions;
    const intent = intentId ? getIntent(intentId) : detectIntent(question);
    if (!draw || !draw.length) throw new Error('engine.interpret: draw is empty');
    if (draw.length > positions.length) throw new Error('engine.interpret: too many cards for spread "' + spread + '"');

    const cards = draw.map((item, i) => {
      const card = typeof item.card === 'number' ? deck[item.card] : item.card;
      if (!card) throw new Error('engine.interpret: card not found at draw[' + i + ']');
      return { card, orientation: item.orientation === 'reversed' ? 'reversed' : 'upright', position: positions[i], i };
    });

    const cardReadings = cards.map(c => buildCardReading(c, intent, deck));

    // Elements across the whole draw
    const elementCounts = {};
    for (const c of cards) { const el = cardElement(c.card); if (el) elementCounts[el] = (elementCounts[el] || 0) + 1; }
    const dominantElements = Object.keys(elementCounts).map(el => ({ element: el, count: elementCounts[el] }))
      .sort((a, b) => b.count - a.count);

    // Cross-card element interactions
    const interactions = [];
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        const rel = relation(cards[i].card, cards[j].card);
        if (rel.code !== 'neutral') {
          interactions.push({ i, j, cardA: cards[i].card.name, cardB: cards[j].card.name, rel });
        }
      }
    }

    const majorCount = cards.filter(c => c.card.arcana === 'major').length;
    const reversedCount = cards.filter(c => c.orientation === 'reversed').length;

    const synthesis = buildSynthesis({ cards: cardReadings, dominantElements, interactions, majorCount, reversedCount, intent });

    const methodology = {
      model: 'deterministic-core-v1',
      rules: [
        '牌位定位：同一张牌按落位角色（过去/挑战/结果…）读不同面向。',
        '牌间组合：以四元素关系（相生/相克/赋能）与大小阿卡纳占比做交叉解读。',
        '联问聚焦：解读随提问意图（情感/事业/抉择…）在强调重点上实质变化。',
        '诚实原则：逆位与相克的张力会进入「注意」栏，不回避、不粉饰。'
      ],
      source: '韦特《Pictorial Key》(1910) 牌意 + 金色黎明《Liber LXXVIII》(1912) 对应，见 core/data/tarot-deck.js。'
    };

    return {
      spread: spreadDef, question, intent: { id: intent.id, label: intent.label, lens: intent.lens },
      cards: cardReadings, interactions, synthesis, methodology
    };
  }

  return { interpret, ROLE_NOTE };
});
