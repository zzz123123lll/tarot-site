'use strict';

/* ============================================================
 * 星辉塔罗 · 核心逻辑
 * 严格遵循塔罗阅读流程：
 *   1. 提问/设定意图
 *   2. 选择牌阵（牌位有其独立含义）
 *   3. 洗牌（随机打乱）+ 切牌（随机分割点）
 *   4. 依牌阵依序抽牌，不重复
 *   5. 正/逆位自然出现
 *   6. 结合牌义、牌位、元素、大/小阿尔克纳综合解读
 * ============================================================ */

const SUIT_META = {
  wands:     { cn: '权杖', en: 'Wands', element: '火', elementCn: '火', symbol: '♣', theme: '行动、热情、创造力与事业' },
  cups:      { cn: '圣杯', en: 'Cups', element: '水', elementCn: '水', symbol: '♥', theme: '情感、关系、直觉与潜意识' },
  swords:    { cn: '宝剑', en: 'Swords', element: '风', elementCn: '风', symbol: '♠', theme: '思想、沟通、冲突与真相' },
  pentacles: { cn: '星币', en: 'Pentacles', element: '土', elementCn: '土', symbol: '♦', theme: '物质、工作、健康与务实' }
};

let currentReading = null;

const TAROT_SPREADS = [
  {
    id: 'single',
    name: '单张指引',
    icon: '✦',
    count: 1,
    positions: [
      { name: '当下核心', desc: '这张牌代表目前最需要被看见的能量、态度或课题。' }
    ]
  },
  {
    id: 'three',
    name: '三张牌阵 · 过去 / 现在 / 未来',
    icon: '☾',
    count: 3,
    positions: [
      { name: '过去', desc: '已经发生的背景、根源或造成现状的旧能量。' },
      { name: '现在', desc: '当下的处境、关键矛盾与正在运作的力量。' },
      { name: '未来', desc: '若延续当前方向，可能出现的趋势与结果。' }
    ]
  },
  {
    id: 'celtic',
    name: '凯尔特十字',
    icon: '✠',
    count: 10,
    positions: [
      { name: '现状', desc: '问题的核心，目前最直接的能量。' },
      { name: '挑战', desc: '横跨现状的阻碍或需要面对的对立力量。' },
      { name: '根基', desc: '潜意识中的基础、过去的影响或深层动机。' },
      { name: '过去', desc: '近期已经发生并逐渐淡出的事件。' },
      { name: '意识', desc: '你意识中的目标、期望或最佳可能性。' },
      { name: '未来', desc: '短期之内可能展开的趋势。' },
      { name: '自身', desc: '你对这件事的态度、角色与内在回应。' },
      { name: '环境', desc: '外界他人、环境或你无法控制的因素。' },
      { name: '希望与恐惧', desc: '内心深处既盼望又害怕的部分。' },
      { name: '结果', desc: '综合所有牌后指向的整体走向。' }
    ]
  }
];

/* ---------- 工具 ---------- */
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(d) {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${h}:${m}`;
}

function getCardSymbol(card) {
  if (card.arcana === 'major') return '✶';
  return SUIT_META[card.suit] ? SUIT_META[card.suit].symbol : '?';
}

function getCardArt(card) {
  if (!card) return null;
  const suitMap = { wands: 'Wands', cups: 'Cups', swords: 'Swords', pentacles: 'Pents' };
  const rankMap = { Ace: 1, Page: 11, Knight: 12, Queen: 13, King: 14 };
  let prefix, num;
  if (card.arcana === 'major') {
    prefix = 'major';
    num = typeof card.number === 'number' ? card.number : 0;
  } else {
    prefix = suitMap[card.suit] || 'Wands';
    if (typeof card.number === 'number') num = card.number;
    else if (rankMap[card.number] != null) num = rankMap[card.number];
    else num = 1;
  }
  const nn = String(num).padStart(2, '0');
  return 'images/cards/' + prefix + '_' + nn + '.jpg';
}


/* ---------- 每日一牌 ---------- */
function toRoman(n) {
    n = Math.max(0, Math.floor(Number(n) || 0));
    if (n <= 0) return '0';
    var k = [[21,'XXI'],[20,'XX'],[19,'XIX'],[18,'XVIII'],[17,'XVII'],[16,'XVI'],[15,'XV'],[14,'XIV'],[13,'XIII'],[12,'XII'],[11,'XI'],[10,'X'],[9,'IX'],[8,'VIII'],[7,'VII'],[6,'VI'],[5,'V'],[4,'IV'],[3,'III'],[2,'II'],[1,'I']];
    for (var i=0;i<k.length;i++){ if (n >= k[i][0]) return k[i][1]; }
    return String(n);
  }

function getDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

let lastDaily = null; // 今日牌缓存,供分享图使用

function getDailyCard() {
  const key = getDateKey(new Date());
  const h = hashString(key);
  const card = TAROT_DECK[h % TAROT_DECK.length];
  const reversed = h % 5 === 0;
  return { card, reversed, dateKey: key };
}

function renderDailyCard() {
  const box = document.getElementById('dailyResult');
  const { card, reversed } = getDailyCard();
  const meaning = reversed ? card.reversed : card.upright;
  const keywords = reversed ? card.keywordsReversed : card.keywords;
  const suitLabel = card.arcana === 'major'
    ? `大阿尔卡纳 · ${card.element}元素`
    : `${card.suitName}牌 · ${card.element}元素`;

  document.getElementById('dailyBtn').innerHTML = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>' + '重新查看今日牌';
  lastDaily = { card: card, reversed: reversed };
  box.classList.remove('hidden');
  box.innerHTML = `
    <div class="daily-card-flip suit-${card.suit || 'major'} ${reversed ? 'is-reversed' : ''}" data-id="${card.id}">
      <div class="daily-card-inner">
        <div class="daily-card-back">
          <div class="daily-symbol">✦</div>
          <div class="daily-name">星辉塔罗</div>
          <div class="daily-orientation">今日之牌</div>
        </div>
        <div class="daily-card-front">
          <div class="daily-symbol">${getCardSymbol(card)}</div>
          <div class="daily-name">${escapeHtml(card.name)}</div>
          <div class="daily-en">${escapeHtml(card.en)}</div>
          <div class="daily-orientation">${reversed ? '逆位' : '正位'}</div>
        </div>
      </div>
    </div>
    <div class="daily-text">
      <h3>${escapeHtml(card.name)} · ${reversed ? '逆位' : '正位'}</h3>
      <p class="daily-meta">${suitLabel}</p>
      <p class="daily-keywords">关键词：${keywords.map(escapeHtml).join(' · ')}</p>
      <p class="daily-meaning">${escapeHtml(meaning)}</p>
      <p class="daily-date">${getDateKey(new Date())} · 每日一牌</p>
      <button class="btn-share btn-share--daily" id="dailyShareBtn" type="button">✦ 分享今日牌</button>
    </div>
  `;
  const __artPath = getCardArt(card);
  const __df = box.querySelector('.daily-card-front');
  if (__artPath && __df) {
    __df.style.backgroundImage = "url('" + __artPath + "')";
    __df.style.backgroundSize = 'cover';
    __df.style.backgroundPosition = 'center';
    __df.classList.add('has-art');
  }
  const mini = box.querySelector('.daily-card-flip');
  mini.classList.add('is-flipped');   // 直接翻过来：默认显示牌面
  mini.addEventListener('click', () => openCardModal(card));
  const _dsb = box.querySelector('#dailyShareBtn');
  if (_dsb) _dsb.addEventListener('click', () => {
    if (!window.ShareCard || !lastDaily) return;
    window.ShareCard.open({
      cards: [{ card: lastDaily.card, reversed: lastDaily.reversed, position: { label: '今日之牌' } }],
      spread: { name: '每日一牌' },
      time: Date.now()
    }, meaning);
  });
}

/* ---------- 抽牌 ---------- */
function drawReading(spreadId, question, allowReversed, cutChoice) {
  const spread = TAROT_SPREADS.find(s => s.id === spreadId) || TAROT_SPREADS[0];

  // 洗牌：对完整 78 张牌做 Fisher-Yates 随机打乱
  const shuffled = shuffleArray(TAROT_DECK);

  // 切牌：用户选择左/中/右会影响切入点，同时保留随机感
  let cutPoint;
  if (typeof cutChoice === 'number') {
    const base = Math.floor(shuffled.length * (cutChoice + 1) / 4);
    cutPoint = Math.min(shuffled.length - 1, Math.max(0, base + Math.floor(Math.random() * 7) - 3));
  } else {
    cutPoint = Math.floor(Math.random() * shuffled.length);
  }
  const cutDeck = shuffled.slice(cutPoint).concat(shuffled.slice(0, cutPoint));

  // 依牌阵顺序抽牌，不重复
  const drawn = [];
  for (let i = 0; i < spread.count; i++) {
    const card = cutDeck[i];
    // 逆位：在真实占卜中由洗牌时的牌面方向决定；这里以约 30% 机率自然出现
    const reversed = allowReversed && Math.random() < 0.3;
    drawn.push({
      card,
      reversed,
      position: spread.positions[i],
      index: i
    });
  }

  return {
    spread,
    question: (question || '').trim(),
    time: new Date(),
    cards: drawn
  };
}

/* ---------- 解读文本 ---------- */
function buildElementSummary(cards) {
  const counts = { 火: 0, 水: 0, 风: 0, 土: 0 };
  let majorCount = 0;
  cards.forEach(({ card }) => {
    if (card.arcana === 'major') majorCount++;
    else if (counts[card.element] !== undefined) counts[card.element]++;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0][1] > 0 ? sorted[0][0] : null;
  const elementText = dominant
    ? `牌面元素以「${dominant}」元素为主，提示你从${dominant === '火' ? '行动与热情' : dominant === '水' ? '情感与直觉' : dominant === '风' ? '思考与沟通' : '务实与物质'}的角度切入。`
    : '本组牌没有明显的小阿尔克纳元素倾向，以人生课题与原型能量为主。';
  const majorText = majorCount > 0
    ? `出现 ${majorCount} 张大阿尔克纳，说明这不仅是日常琐事，更可能涉及重要的人生阶段或心灵课题。`
    : '没有出现大阿尔克纳，事件较偏向日常事务、具体行动或当下情境。';
  return { majorCount, elementText, majorText };
}

function buildInterpretation(reading) {
  const { cards, spread, question } = reading;
  const reversedCount = cards.filter(c => c.reversed).length;
  const { elementText, majorText } = buildElementSummary(cards);

  let html = '<div class="interpretation-summary">';
  html += '<h3>✦ 总体基调</h3>';
  html += `<p>${majorText}</p>`;
  html += `<p>${elementText}</p>`;
  if (reversedCount === cards.length) {
    html += '<p>所有牌都以逆位出现：此刻更适合<strong>暂停、反思、换位</strong>，而不是急着推进。</p>';
  } else if (reversedCount > 0) {
    html += `<p>有 ${reversedCount} 张逆位牌：那些位置的能量正在受阻或需要你从反面看待。</p>`;
  } else {
    html += '<p>全部正位：能量相对顺畅，但仍需结合牌位与具体行动来落实。</p>';
  }
  if (question) {
    html += `<blockquote>你的问题：${escapeHtml(question)}</blockquote>`;
  }
  html += '</div>';

  html += '<div class="interpretation-cards">';
  cards.forEach(({ card, reversed, position, index }) => {
    const keywords = reversed ? card.keywordsReversed : card.keywords;
    const meaning = reversed ? card.reversed : card.upright;
    const orientationText = reversed ? '逆位' : '正位';
    const suitText = card.arcana === 'major'
      ? `大阿尔卡纳 · ${card.element}元素`
      : `${card.suitName}牌 · ${card.element}元素 · ${SUIT_META[card.suit].theme}`;

    html += `<div class="reading-card-block" data-index="${index}">`;
    html += `<h4><span class="position-tag">${index + 1}. ${position.name}</span> ${escapeHtml(card.name)} <small>${orientationText}</small></h4>`;
    html += `<p class="reading-card-meta">${suitText} · ${escapeHtml(card.en)}</p>`;
    html += `<p class="reading-position-desc">牌位含义：${escapeHtml(position.desc)}</p>`;
    html += `<p class="reading-meaning">${escapeHtml(meaning)}</p>`;
    html += `<p class="reading-keywords">关键词：${keywords.map(escapeHtml).join(' · ')}</p>`;
    html += `<p class="reading-advice">建议：在「${escapeHtml(position.name)}」的位置上，把这张牌当作一个观察角度，问自己：<em>这个能量如何正在我的生活中出现？我可以用什么行动回应？</em></p>`;
    html += '</div>';
  });
  html += '</div>';

  // 综合启示：根据牌阵结构给出收束
  html += '<div class="interpretation-final">';
  html += '<h3>✦ 综合启示</h3>';
  if (spread.id === 'single') {
    html += '<p>单张牌不是全部答案，而是你此刻最需要聚焦的一个主题。带着这张牌的关键词观察今天的生活。</p>';
  } else if (spread.id === 'three') {
    html += '<p>过去提供根源，现在提供行动支点，未来则呈现趋势。改变现在的选择，未来也会随之流动。</p>';
  } else {
    html += '<p>凯尔特十字把问题放到更大的脉络中：看清根基、挑战、环境与希望恐惧后，结果牌不是终点，而是当前能量整合后的方向。</p>';
  }
  html += '<p class="final-note">塔罗揭示的是“在此时此地、以当前状态延续下去”的倾向；你有自由意志去调整、选择与创造。</p>';
  html += '</div>';

  return html;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ---------- 牌意查询 / 弹窗 ---------- */
function cardTypeText(card) {
  if (card.arcana === 'major') return '大阿尔卡纳';
  return `${card.suitName} · ${card.element}元素`;
}

function buildCardModalHTML(card) {
  const suitLabel = card.arcana === 'major'
    ? `大阿尔卡纳 · ${card.element}元素`
    : `${card.suitName}牌 · ${card.element}元素 · ${SUIT_META[card.suit].theme}`;
  return `
    <div class="modal-head">
      <div class="modal-symbol suit-${card.suit || 'major'}">${getCardSymbol(card)}</div>
      <div>
        <h3 id="modalTitle">${escapeHtml(card.name)}</h3>
        <p class="modal-en">${escapeHtml(card.en)}</p>
        <p class="modal-meta">${suitLabel}</p>
      </div>
    </div>
    <div class="modal-section">
      <h4>正位</h4>
      <p class="modal-keywords">${card.keywords.map(escapeHtml).join(' · ')}</p>
      <p>${escapeHtml(card.upright)}</p>
    </div>
    <div class="modal-section">
      <h4>逆位</h4>
      <p class="modal-keywords">${card.keywordsReversed.map(escapeHtml).join(' · ')}</p>
      <p>${escapeHtml(card.reversed)}</p>
    </div>
  `;
}

function openCardModal(card) {
  const modal = document.getElementById('cardModal');
  const content = document.getElementById('modalContent');
  content.innerHTML = buildCardModalHTML(card);
  const __art = getCardArt(card);
  if (__art) {
    const sym = content.querySelector('.modal-symbol');
    if (sym) sym.style.backgroundImage = "url('" + __art + "')";
  }

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeCardModal() {
  const modal = document.getElementById('cardModal');
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

function renderDictionary() {
  const grid = document.getElementById('dictionaryGrid');
  const search = document.getElementById('dictionarySearch');
  const render = () => {
    const q = search.value.trim().toLowerCase();
    const cards = TAROT_DECK.filter(c => {
      if (!q) return true;
      const haystack = [
        c.name, c.en, c.arcana, c.suitName || '', c.suitEn || '', c.element,
        ...(c.keywords || []), ...(c.keywordsReversed || []),
        c.upright, c.reversed
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
    grid.innerHTML = cards.map(c => `
      <button type="button" class="dictionary-card suit-${c.suit || 'major'}" data-id="${c.id}">
        <img class="dict-art" src="${getCardArt(c) || ''}" alt="" loading="lazy">
        <span class="dict-name">${escapeHtml(c.name)}</span>
        <span class="dict-en">${escapeHtml(c.en)}</span>
        <span class="dict-type">${cardTypeText(c)}</span>
      </button>
    `).join('');
    grid.querySelectorAll('.dictionary-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = TAROT_DECK.find(c => c.id === btn.dataset.id);
        openCardModal(card);
      });
    });
  };
  search.addEventListener('input', render);
  render();
}

/* ---------- DOM 渲染 ---------- */
function initSpreadSelect() {
  const select = document.getElementById('spreadSelect');
  const desc = document.getElementById('spreadDesc');
  select.innerHTML = TAROT_SPREADS.map(s =>
    `<option value="${s.id}">${s.icon} ${s.name}（${s.count} 张）</option>`
  ).join('');
  select.value = TAROT_SPREADS[0].id;
  const updateDesc = () => {
    const spread = TAROT_SPREADS.find(s => s.id === select.value);
    desc.innerHTML = `<strong>${escapeHtml(spread.name)}：</strong>${spread.positions.map((p, i) => `${i + 1}. ${escapeHtml(p.name)}`).join(' → ')}<br><small>${spread.positions.map(p => escapeHtml(p.desc)).join('；')}</small>`;
  };
  select.addEventListener('change', updateDesc);
  updateDesc();
}

function createCardElement(item) {
  const { card, reversed, position, index } = item;
  const art = document.createElement('article');
  art.className = `tarot-card flip-card ${card.arcana} suit-${card.suit || 'major'} ${reversed ? 'is-reversed' : ''}`;
  art.dataset.cardId = card.id;
  art.style.animationDelay = `${index * 0.12}s`;
  art.innerHTML = `
    <div class="position-badge">
      <span class="position-number">${index + 1}</span>
      <span class="position-name">${escapeHtml(position.name)}</span>
    </div>
    <div class="card-inner">
      <div class="card-back">
        <div class="back-sun">✦</div>
        <div class="back-text">星辉塔罗</div>
      </div>
      <div class="card-front">
        <div class="card-corner top-left"><span>${escapeHtml(card.roman || card.number)}</span></div>
        <div class="card-corner bottom-right"><span>${escapeHtml(card.roman || card.number)}</span></div>
        <div class="card-center">
          <span class="suit-symbol">${getCardSymbol(card)}</span>
          <span class="arcana-mark">${card.arcana === 'major' ? '大阿尔卡纳' : SUIT_META[card.suit] ? SUIT_META[card.suit].elementCn + '元素' : ''}</span>
        </div>
        <div class="card-name">${escapeHtml(card.name)}</div>
        <div class="card-en">${escapeHtml(card.en)}</div>
        <div class="card-orientation">${reversed ? '逆位' : '正位'}</div>
      </div>
    </div>
  `;
  const artPath = getCardArt(card);
  if (artPath) {
    art.classList.add('has-art');
    const front = art.querySelector('.card-front');
    if (front) {
      const img = document.createElement('img');
      img.className = 'card-art';
      img.src = artPath;
      img.alt = '';
      img.decoding = 'async';
      front.insertBefore(img, front.firstChild);
    }
  }
  return art;
}

function renderReading(reading, options = {}) {
  const panel = document.getElementById('readingPanel');
  const title = document.getElementById('readingTitle');
  const meta = document.getElementById('readingMeta');
  const grid = document.getElementById('cardsGrid');
  const interp = document.getElementById('interpretation');
  const animate = options.animate !== false;

  currentReading = reading;
  if (window.Journal && window.Journal.add) { window.Journal.add(reading); }
  var _copy = document.getElementById('copyBtn');
  if (_copy) _copy.disabled = false;
  var _share = document.getElementById('shareBtn');
  if (_share) _share.disabled = false;
  panel.classList.remove('hidden');
  title.textContent = `${reading.spread.icon} ${reading.spread.name} · 解读`;
  meta.innerHTML = `<span>${formatTime(reading.time)}</span><span>${reading.cards.length} 张牌</span><span>${reading.cards.filter(c => c.reversed).length} 张逆位</span>`;

  grid.className = 'cards-grid';
  if (reading.spread.id === 'celtic') {
    grid.classList.add('celtic-layout');
  }

  grid.innerHTML = '';
  const elements = [];
  reading.cards.forEach((item) => {
    const el = createCardElement(item);
    elements.push(el);
    grid.appendChild(el);
  });

  elements.forEach((el, i) => {
    if (animate) {
      setTimeout(() => {
        el.classList.add('is-revealed');
      }, 260 + i * 180);
    } else {
      el.classList.add('is-revealed');
    }
    el.addEventListener('click', () => {
      const card = TAROT_DECK.find(c => c.id === el.dataset.cardId);
      if (card) openCardModal(card);
    });
  });

  interp.innerHTML = (window.TarotReader && window.TarotReader.renderHTML)
    ? window.TarotReader.renderHTML(reading)
    : buildInterpretation(reading);

  setTimeout(() => {
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, animate ? 350 : 0);
}

function buildDeckSummary() {
  const container = document.getElementById('deckSummary');
  if (!container) return;
  const groups = [
    { title: '大阿尔卡纳（22）', cards: TAROT_DECK.filter(c => c.arcana === 'major') },
    { title: '权杖 · 火（14）', cards: TAROT_DECK.filter(c => c.suit === 'wands') },
    { title: '圣杯 · 水（14）', cards: TAROT_DECK.filter(c => c.suit === 'cups') },
    { title: '宝剑 · 风（14）', cards: TAROT_DECK.filter(c => c.suit === 'swords') },
    { title: '星币 · 土（14）', cards: TAROT_DECK.filter(c => c.suit === 'pentacles') }
  ];
  groups.forEach(group => {
    const div = document.createElement('div');
    div.className = 'deck-group';
    div.innerHTML = `<h4>${group.title}</h4><p>${group.cards.map(c => escapeHtml(c.name)).join('、')}</p>`;
    container.appendChild(div);
  });
}

/* ---------- 复制 / 分享 ---------- */
function buildPlainTextReading(reading) {
  if (!reading) return '';
  const lines = [];
  lines.push(`【星辉塔罗 · ${reading.spread.name}】`);
  lines.push(`时间：${formatTime(reading.time)}`);
  if (reading.question) lines.push(`问题：${reading.question}`);
  lines.push('');
  reading.cards.forEach(({ card, reversed, position, index }) => {
    const orientation = reversed ? '逆位' : '正位';
    const meaning = reversed ? card.reversed : card.upright;
    const keywords = reversed ? card.keywordsReversed : card.keywords;
    lines.push(`${index + 1}. ${position.name}｜${card.name}（${orientation}）`);
    lines.push(`   牌义：${meaning}`);
    lines.push(`   关键词：${keywords.join('、')}`);
    lines.push('');
  });
  lines.push('— 塔罗是自我探索与反思工具，结果仅供参考，不代表不可更改的命运。');
  return lines.join('\n');
}

function copyCurrentReading() {
  const text = buildPlainTextReading(currentReading);
  if (!text) return;
  const done = () => {
    const btn = document.getElementById('copyBtn');
    const oldText = btn.textContent;
    btn.textContent = '✓ 已复制';
    setTimeout(() => { btn.textContent = oldText; }, 1600);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
}

function fallbackCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
  } catch (e) {
    window.prompt('请手动复制以下内容：', text);
  }
  document.body.removeChild(ta);
  done();
}

/* ---------- 交互式占卜仪式：洗牌 → 切牌 → 抽牌 ---------- */
let ritualState = {
  reading: null,
  revealedCount: 0
};

function setRitualStep(step) {
  document.querySelectorAll('.ritual-step').forEach(el => {
    el.classList.toggle('active', el.dataset.step === step);
  });
}

function showRitualStage(stageId) {
  ['ritualFocus', 'ritualShuffle', 'ritualCut', 'ritualDraw'].forEach(id => {
    document.getElementById(id).classList.toggle('hidden', id !== stageId);
  });
}

function startRitual() {
  const spreadId = document.getElementById('spreadSelect').value;
  const question = document.getElementById('questionInput').value.trim();
  // 入口=问题：必填校验
  const _qi = document.getElementById('questionInput');
  const _qh = document.getElementById('questionHint');
  if (!question) {
    if (_qh) _qh.classList.remove('hidden');
    if (_qi) { _qi.focus(); _qi.style.borderColor = 'var(--warn)'; }
    return;
  }
  if (_qh) _qh.classList.add('hidden');
  if (_qi) _qi.style.borderColor = '';
  const allowReversed = document.getElementById('reversedToggle').checked;
  const btn = document.getElementById('startRitualBtn');
  const againBtn = document.getElementById('againBtn');
  const ritualPanel = document.getElementById('ritualPanel');
  const readingPanel = document.getElementById('readingPanel');

  ritualState.reading = null;
  ritualState.revealedCount = 0;

  btn.disabled = true;
  againBtn.disabled = false;
  readingPanel.classList.add('hidden');
  ritualPanel.classList.remove('hidden');

  // 静心定念：呼吸停顿后进入洗牌
  setRitualStep('focus');
  showRitualStage('ritualFocus');
  setTimeout(function () {
    setRitualStep('shuffle');
    showRitualStage('ritualShuffle');
    setupShuffle(spreadId, question, allowReversed);
  }, 2600);

  ritualPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setupShuffle(spreadId, question, allowReversed) {
  const deck = document.getElementById('ritualDeck');
  const hint = document.getElementById('ritualHint');
  deck.classList.remove('shuffling');
  hint.textContent = '点击牌堆，开始洗牌';
  deck.onclick = function () {
    if (deck.classList.contains('shuffling')) return;
    deck.classList.add('shuffling');
    hint.textContent = '正在洗牌 ⋯';
    setTimeout(function () {
      deck.classList.remove('shuffling');
      hint.textContent = '洗牌完成，开始抽牌';
      ritualState.reading = drawReading(spreadId, question, allowReversed, 1);
      showDraw();
    }, 1200);
  };
}

function showCut(spreadId, question, allowReversed) {
  setRitualStep('cut');
  showRitualStage('ritualCut');

  document.querySelectorAll('.cut-pile').forEach(pile => {
    pile.style.pointerEvents = '';
    pile.classList.remove('selected');
    pile.onclick = () => {
      if (pile.classList.contains('selected')) return;
      pile.classList.add('selected');
      document.querySelectorAll('.cut-pile').forEach(other => {
        if (other !== pile) other.style.pointerEvents = 'none';
      });
      const cutChoice = parseInt(pile.dataset.pile, 10);
      // 用户的切牌选择会参与决定牌堆从哪里切开
      ritualState.reading = drawReading(spreadId, question, allowReversed, cutChoice);
      setTimeout(() => {
        showDraw();
      }, 550);
    };
  });
}

function showDraw() {
  setRitualStep('draw');
  showRitualStage('ritualDraw');
  const container = document.getElementById('ritualCards');
  const hint = document.getElementById('drawHint');
  const reading = ritualState.reading;
  ritualState.revealedCount = 0;
  container.innerHTML = '';
  hint.textContent = '牌已展开，正在揭示 ⋯';

  reading.cards.forEach(function (item, i) {
    const el = createCardElement(item);
    el.classList.add('ritual-pick-card');
    const dealDelay = 150 + i * 130;               // 进场错峰
    const revealDelay = 900 + i * 300;             // 逐张揭示错峰
    el.style.animationDelay = dealDelay + 'ms';
    el.classList.add('deal-in');
    container.appendChild(el);
    setTimeout(function () {
      el.classList.add('is-revealed');
      ritualState.revealedCount++;
      hint.textContent = '第 ' + (i + 1) + ' 张 · ' + (item.position.name || '');
      if (ritualState.revealedCount === reading.cards.length) {
        hint.textContent = '解读生成中 ⋯';
        setTimeout(function () { finishRitual(); }, 1000);
      }
    }, revealDelay);
  });
}

function finishRitual() {
  const ritualPanel = document.getElementById('ritualPanel');
  const btn = document.getElementById('startRitualBtn');

  try {
    ritualPanel.classList.add('hidden');
    renderReading(ritualState.reading, { animate: false });
  } catch (e) {
    console.error('[星辉塔罗] 解读渲染出错：', e);
  } finally {
    btn.disabled = false;
  }
}

function init() {
  initSpreadSelect();
  buildDeckSummary();
  renderDailyCard();
  renderDictionary();

  document.getElementById('dailyBtn').addEventListener('click', renderDailyCard);
  // ③ 随每日牌变化的巨数字 + 月相
  try {
    const hd = getDailyCard();
    const n = document.getElementById('heroNumeral');
    if (n) n.textContent = toRoman(hd.card.arcana === 'major' ? (hd.card.roman ? (parseInt(String(hd.card.roman).replace(/[^0-9]/g,'')) || hd.card.number) : hd.card.number) : hd.card.number) || '0';
    const m = document.getElementById('heroMoon');
    if (m) { const phase = (Math.floor(Date.now() / 86400000) % 4); m.textContent = ['●','◐','○','◑'][phase]; }
  } catch (e) {}
  document.getElementById('spreadSelect').addEventListener('change', function () {
  // 切换牌阵：收起旧解读/仪式，复位开始按钮，避免误以为“没换成功”
  document.getElementById('readingPanel').classList.add('hidden');
  var _rp = document.getElementById('ritualPanel');
  if (_rp) _rp.classList.add('hidden');
  document.getElementById('startRitualBtn').disabled = false;
});
document.getElementById('startRitualBtn').addEventListener('click', startRitual);
  document.getElementById('againBtn').addEventListener('click', () => {
    document.getElementById('readingPanel').classList.add('hidden');
    startRitual();
  });
  document.getElementById('copyBtn').disabled = true;
document.getElementById('copyBtn').addEventListener('click', copyCurrentReading);
  const shareBtn = document.getElementById('shareBtn');
  shareBtn.addEventListener('click', () => {
    if (!currentReading) return;
    const summary = (window.TarotReader && window.TarotReader.lastSummary) || '';
    if (window.ShareCard) window.ShareCard.open(currentReading, summary);
  });
  document.getElementById('modalClose').addEventListener('click', closeCardModal);
  document.getElementById('cardModal').addEventListener('click', (e) => {
    if (e.target.id === 'cardModal') closeCardModal();
  });
  document.getElementById('noticeClose').addEventListener('click', () => {
    document.getElementById('noticeBar').classList.add('hidden');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCardModal();
  });
}

document.addEventListener('DOMContentLoaded', init);
