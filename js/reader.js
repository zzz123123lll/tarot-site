// js/reader.js — Bridges the front-end deck (js/deck.js) to the deterministic core (core/).
// Replaces the old keyword-blurb interpretation with TarotCore.interpret() rendered richly:
// positional framing, cross-card element interplay, question-conditioned guidance, and honest caution.
(function () {
  const core = window.TarotCore;
  if (!core) {
    // Core not present: keep the previous interpretation. No-op.
    return;
  }

  // Map front-end cards (by .en) to core cards (78/78 aligned).
  const coreByEn = {};
  for (const c of core.DECK) coreByEn[c.en] = c;

  const SUIT_CN = { wands: '权杖', cups: '圣杯', swords: '宝剑', pentacles: '星币' };

  function interpret(reading) {
    const draw = reading.cards.map(it => ({
      card: coreByEn[it.card.en],
      orientation: it.reversed ? 'reversed' : 'upright'
    }));
    return core.interpret({ spread: reading.spread.id, question: reading.question, draw });
  }

  // Render the structured core result to HTML.
  function renderHTML(reading) {
    const result = interpret(reading);
    if (!result) return '';
    const esc = (s) => String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const h = [];

    // 可选 LLM 文采总览（window.TAROT_LLM 存在则用，否则回退确定性散文）
    const proseLead = (function () {
      try {
        var prose = null;
        if (window && window.TAROT_LLM && core.synthesize) { return '\u3010\u5f85\u63a5\u5165\u3011'; }
      } catch (e) {}
      return null;
    })();
    if (proseLead) h.push('<p class="interpretation-lead">' + esc(proseLead) + '</p>');
    // 一封有分寸的回信：先一句总述，再展开
    (function () {
      var intent = result.intent ? result.intent.label : '一般指引';
      var openLine = '这次占卜，是关于「' + intent + '」的。';
      if (reading.question) openLine = '你把问题交给了牌——「' + reading.question + '」。这次占卜，是关于「' + intent + '」的。';
      var takeaway = (result.synthesis && result.synthesis.guidance && result.synthesis.guidance.length)
        ? result.synthesis.guidance[0] : '';
      // 去掉开头的 "围绕你的问题（xxx），最值得抓住的是：" 前缀，让语气更沉稳
      takeaway = takeaway.replace(/^围绕你的问题（[^）]*），/, '');
      h.push('<div class="interpretation-summary">');
      h.push('<h3>✦ ' + esc(result.spread.name) + '</h3>');
      h.push('<p class="interpretation-lead">' + esc(openLine) + '</p>');
      if (takeaway) h.push('<p class="interpretation-takeaway">' + esc(takeaway) + '</p>');
      h.push('</div>');
    })();

    // Per-card positional reading
    h.push('<div class="interpretation-cards">');
    for (const c of result.cards) {
      const meaning = c.meaning || '';
      const typeText = c.card.arcana === 'major' ? '大阿尔卡纳' : (SUIT_CN[c.card.suit] || '') + '牌';
      h.push('<div class="reading-card-block">');
      h.push('<h4><span class="position-tag">' + esc(c.position.label) + '</span> ' + esc(c.card.name) +
             ' <small>' + (c.reversed ? '逆位' : '正位') + ' · ' + esc(c.elementLabel || '') + '元素</small></h4>');
      h.push('<p class="reading-card-meta">' + esc(typeText) + ' · ' + esc(c.card.en) + '</p>');
      h.push('<p class="reading-keywords">关键词：' + (c.keywords || []).map(esc).join(' · ') + '</p>');
      h.push('<p class="reading-position-desc">' + (c.context || []).map(x => esc(x)).join('<br>') + '</p>');
      h.push('<p class="reading-meaning">' + esc(meaning) + '</p>');
      h.push('</div>');
    }
    h.push('</div>');

    const s = result.synthesis || {};

    // Cross-card interplay
    if (result.interactions && result.interactions.length) {
      h.push('<div class="interpretation-final"><h3>✦ 牌面互动</h3>');
      for (const it of result.interactions) {
        h.push('<p>· ' + esc(it.cardA) + ' ↔ ' + esc(it.cardB) + '：<strong>' + esc(it.rel.label) + '</strong>。' + esc(it.rel.desc) + '</p>');
      }
      h.push('</div>');
    }

    // Energy composition
    h.push('<div class="interpretation-final"><h3>✦ 能量构成</h3>');
    (s.arcana || []).forEach(a => h.push('<p>' + esc(a) + '</p>'));
    (s.elements || []).forEach(e => h.push('<p>' + esc(e) + '</p>'));
    h.push('</div>');

    // Guidance
    h.push('<div class="interpretation-final"><h3>✦ 方向与提示</h3>');
    (s.guidance || []).forEach(g => h.push('<p>· ' + esc(g) + '</p>'));
    h.push('</div>');

    // Caution (honesty)
    h.push('<div class="interpretation-final caution"><h3>✦ 值得留意</h3>');
    (s.caution || []).forEach(ct => h.push('<p>· ' + esc(ct) + '</p>'));
    h.push('</div>');

    // 为什么这么解（推理透明）
    (function () {
      h.push('<details class="reading-why"><summary>为什么这么解 · 推理过程</summary>');
      h.push('<p class="why-line"><strong>你的问题：</strong>' + esc(reading.question || '(未输入，按一般指引)') + ' → 判定为「' + esc(result.intent.label) + '」</p>');
      h.push('<ul class="why-list">');
      for (const c of result.cards) {
        h.push('<li><strong>' + esc(c.position.label) + '</strong> · ' + esc(c.card.name) + (c.reversed ? '（逆位）' : '（正位）') + (c.elementLabel ? ' · ' + esc(c.elementLabel) + '元素' : '') + ' —— ' + esc((c.context || []).slice(0,2).join('；')) + '</li>');
      }
      h.push('</ul>');
      if (result.interactions && result.interactions.length) {
        h.push('<p class="why-line">牌间互动：' + result.interactions.map(function (x) { return esc(x.cardA) + ' ↔ ' + esc(x.cardB) + '（' + esc(x.rel.label) + '）'; }).join('；') + '</p>');
      }
      h.push('<p class="why-line">组合规则：' + (result.methodology ? result.methodology.rules.join('；') : '定位 · 组合 · 联问') + '</p>');
      h.push('</details>');
    })();

    // 溯源 / 信任印记 / 诚实声明
    h.push('<div class="reading-trust">');
    h.push('<span class="trust-mark">『 韦特 1910 · 金色黎明 1912 』</span>');
    h.push('<p class="final-note">牌义溯源：韦特《Pictorial Key to the Tarot》(1910/1911) + 金色黎明《Liber LXXVIII》(1912)。解读由确定性规则「定位 · 组合 · 联问」生成——不是通用模板，而是把牌、牌位与你真正的问题对在一起。</p>');
    h.push('<p class="honesty-note">塔罗是自我探索与反思工具，不是宿命判决；结果仅供参考，选择权始终在你。</p>');
    h.push('</div>');

    return h.join('');
  }

  window.TarotReader = { interpret, renderHTML, mode: 'core' };
})();
