// core/spreads.js — Spread definitions with per-position role semantics.
// 溯源: position roles follow the classic RWS spread conventions (single / past-present-future /
// Celtic Cross). Each position carries a "framing" lens used by the engine for positional reading,
// so the SAME card reads differently depending on which slot it lands in.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.TarotSpreads = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  const SPREADS = {
    single: {
      id: 'single', name: '单张指引', positions: [
        { key: 'core', label: '核心指引', role: 'core', framing: '这是当前最需要被看见的一张牌。把它视为此刻能量的焦点。' }
      ]
    },
    three: {
      id: 'three', name: '三张牌阵', positions: [
        { key: 'past',  label: '过去', role: 'past',  framing: '这张牌是已发生或正在收尾的背景——它如何塑造了当下。' },
        { key: 'present', label: '现在', role: 'present', framing: '这张牌是当前的能量中心，是你此刻最真实的状态或正在处理的事。' },
        { key: 'future', label: '未来', role: 'future', framing: '这张牌是若保持现状、最可能浮现的方向——它是倾向而非宿命。' }
      ]
    },
    celtic: {
      id: 'celtic', name: '凯尔特十字', positions: [
        { key: 'now',      label: '现状',   role: 'present',   framing: '当前局面的核心——你身处的位置与正在面对的主线。' },
        { key: 'challenge',label: '挑战',   role: 'obstacle',  framing: '阻碍你的力量，或需要被接住、被转化的课题。' },
        { key: 'root',     label: '根基',   role: 'subconscious', framing: '潜意识或根基层面的运作，常常不易察觉却深具影响。' },
        { key: 'past',     label: '过去',   role: 'past',      framing: '已消逝或正在退场的因素，它塑造了今日的起点。' },
        { key: 'conscious',label: '意识',   role: 'conscious', framing: '你头脑中清晰的意图、目标，或你以为自己所追求的东西。' },
        { key: 'future',   label: '未来',   role: 'nearfuture',framing: '近期将浮现的趋势，是当下的自然延伸。' },
        { key: 'self',     label: '自身',   role: 'self',      framing: '你所持的立场与态度，或你如何看待自己在局中的位置。' },
        { key: 'others',   label: '环境',   role: 'environment', framing: '来自外界与他人影响的力量，是环境而非个人能控的部分。' },
        { key: 'hopes',    label: '希望与恐惧', role: 'hopesfears', framing: '你最深处的渴望与最不敢面对的恐惧，二者在此交织。' },
        { key: 'outcome',  label: '结果',   role: 'outcome',   framing: '综合当前能量后，最可能呈现的结果走向。' }
      ]
    }
  };

  function getSpread(id) {
    if (id === 'celtic-cross' || id === 'celticcross') return SPREADS.celtic;
    return SPREADS[id] || SPREADS.single;
  }

  function listSpreadIds() { return Object.keys(SPREADS); }

  return { SPREADS, getSpread, listSpreadIds };
});
