// js/reader.js — 桥接前端牌组到确定性内核，渲染成熟解读。
// 主解读 = 把牌面读成"你此刻的处境"，第二人称、和问题绑定、不甩关键词；技术细节收进折叠层。
(function () {
  const core = window.TarotCore;
  if (!core) return;

  const coreByEn = {};
  for (const c of core.DECK) coreByEn[c.en] = c;

  function interpret(reading) {
    const draw = reading.cards.map(function (it) {
      return { card: coreByEn[it.card.en], orientation: it.reversed ? 'reversed' : 'upright' };
    });
    return core.interpret({ spread: reading.spread.id, question: reading.question, draw });
  }

  const esc = function (s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  function renderHTML(reading) {
    var result = interpret(reading);
    if (!result) return '';
    var h = [];

    // —— 主解读（成熟：读画面 → 放进你的处境） ——
    var prose = (core.assembleProse ? core.assembleProse(result) : '') || '';
    var blocks = prose.split('\n\n').map(function (s) { return s.trim(); }).filter(Boolean);
    window.TarotReader.lastSummary = blocks[0] || '';
    h.push('<div class="reading-summary">');
    if (blocks.length) {
      h.push('<h3>✦ ' + esc(blocks[0]) + '</h3>');
      for (var i = 1; i < blocks.length; i++) h.push('<p>' + esc(blocks[i]) + '</p>');
    }
    h.push('</div>');

    // —— 为什么这么解（技术细节，折叠） ——
    h.push('<details class="reading-why"><summary>为什么这么解</summary>');
    h.push('<p class="why-line"><strong>你的问题：</strong>' + esc(reading.question || '(未输入，按一般指引)') + ' → 判定为「' + esc(result.intent.label) + '」</p>');
    h.push('<ul class="why-list">');
    for (var i = 0; i < result.cards.length; i++) {
      var c = result.cards[i];
      var depth = (c.depth && c.depth.length) ? ' · ' + c.depth.join(' ') : '';
      h.push('<li><strong>' + esc(c.position.label) + '</strong> · ' + esc(c.card.name) + (c.reversed ? '（逆位）' : '（正位）') + (c.elementLabel ? ' · ' + esc(c.elementLabel) + '元素' : '') + ' —— ' + esc((c.context || []).join('；')) + esc(depth) + '</li>');
    }
    h.push('</ul>');
    if (result.interactions && result.interactions.length) {
      h.push('<p class="why-line">牌间互动：' + result.interactions.map(function (x) { return esc(x.cardA) + ' ↔ ' + esc(x.cardB) + '（' + esc(x.rel.label) + '）'; }).join('；') + '</p>');
    }
    if (result.synthesis && result.synthesis.arcana) h.push('<p class="why-line">' + result.synthesis.arcana.map(esc).join('') + '</p>');
    if (result.synthesis && result.synthesis.elements) h.push('<p class="why-line">' + result.synthesis.elements.map(esc).join('') + '</p>');
    h.push('</details>');

    // —— 溯源 / 信任 ——
    h.push('<div class="reading-trust">');
    h.push('<span class="trust-mark">『 韦特 1910 · 金色黎明 1912 』</span>');
    h.push('<p class="final-note">牌义溯源：韦特《Pictorial Key to the Tarot》(1910) + 金色黎明《Liber LXXVIII》(1912)。</p>');
    h.push('<p class="honesty-note">塔罗是自我探索与反思工具，不是宿命判决；选择权始终在你。</p>');
    h.push('</div>');

    return h.join('');
  }

  window.TarotReader = { interpret: interpret, renderHTML: renderHTML, mode: 'core' };
})();
