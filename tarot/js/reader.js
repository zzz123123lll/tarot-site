// js/reader.js — 桥接前端牌组到确定性内核，并渲染「人味」解读。
// 主解读 = 平实、温暖、像人在对你说话；技术细节收进「为什么这么解」折叠层。
(function () {
  const core = window.TarotCore;
  if (!core) return;

  const coreByEn = {};
  for (const c of core.DECK) coreByEn[c.en] = c;
  const SUIT_CN = { wands: '权杖', cups: '圣杯', swords: '宝剑', pentacles: '星币' };

  function interpret(reading) {
    const draw = reading.cards.map(function (it) {
      return { card: coreByEn[it.card.en], orientation: it.reversed ? 'reversed' : 'upright' };
    });
    return core.interpret({ spread: reading.spread.id, question: reading.question, draw });
  }

  const esc = function (s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  // 人味：把牌连成一段大白话
  function warmNarrative(cards) {
    if (!cards || !cards.length) return '';
    if (cards.length === 1) {
      var c = cards[0];
      return '这一次的核心，是' + c.card.name + (c.reversed ? '（逆位）' : '') + '。' + (c.meaning || '');
    }
    var segs = cards.map(function (c, i) {
      var pre = (i === 0) ? '这一路看下来，' : (i === cards.length - 1) ? '而' : '接着';
      var m = (c.meaning || '').replace(/[。；，\s]+$/, '');
      return pre + '「' + c.position.label + '」是' + c.card.name + (c.reversed ? '（逆位）' : '') + '——' + m;
    });
    return segs.join('；') + '。';
  }

  // 人味：一句朴实的话收尾——必须来自抽出的牌，不用写死的套话
  function warmTakeaway(result) {
    var s = (result.synthesis && result.synthesis.takeaway) ? result.synthesis.takeaway : '';
    if (!s && result.cards && result.cards.length) {
      var moves = result.cards.map(function (c) { return (c.keywords && c.keywords.length) ? c.keywords[0] : c.card.name; });
      s = '这几张牌放在一起，焦点落在：' + moves.join('、') + '。';
    }
    return s;
  }

  function renderHTML(reading) {
    var result = interpret(reading);
    if (!result) return '';
    var h = [];

    // —— 主解读（人味） ——
    h.push('<div class="reading-summary">');
    h.push('<h3>✦ ' + esc(result.spread.name) + '</h3>');
    h.push('<p class="reading-lead">' + (reading.question ? ('关于你的问题——「' + esc(reading.question) + '」，这几张牌是这样说的：') : '这一次的牌，是这样说的：') + '</p>');
    h.push('<p class="reading-narrative">' + esc(warmNarrative(result.cards)) + '</p>');
    h.push('<p class="reading-takeaway">' + esc(warmTakeaway(result)) + '</p>');
    if (result.synthesis && result.synthesis.caution && result.synthesis.caution.length) {
      h.push('<p class="reading-caution">另外提醒一句：' + esc(result.synthesis.caution.join(' ')) + '</p>');
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