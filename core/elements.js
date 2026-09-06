// core/elements.js — Elemental system (Golden Dawn) for combinatorial reading.
// 溯源: element assignments follow the Rider-Waite/Golden Dawn scheme (suit element for minors;
// for majors, derive from the Golden Dawn correspondence's element or zodiac sign).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.TarotElements = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  const ELEMENTS = {
    fire:   { id: 'fire',   label: '火', en: 'Fire',   domain: '行动·热情·事业·创造力·意志',   suit: 'wands' },
    water:  { id: 'water',  label: '水', en: 'Water',  domain: '情感·关系·直觉·潜意识·滋养',    suit: 'cups' },
    air:    { id: 'air',    label: '风', en: 'Air',    domain: '思想·沟通·冲突·真相·判断',      suit: 'swords' },
    earth:  { id: 'earth',  label: '土', en: 'Earth',  domain: '物质·工作·健康·务实·稳定',      suit: 'pentacles' }
  };

  const ZODIAC_ELEMENT = {
    aries:'fire', leo:'fire', sagittarius:'fire',
    taurus:'earth', virgo:'earth', capricorn:'earth',
    gemini:'air', libra:'air', aquarius:'air',
    cancer:'water', scorpio:'water', pisces:'water'
  };

  function zodiacElement(zodiac) {
    if (!zodiac) return null;
    return ZODIAC_ELEMENT[String(zodiac).toLowerCase()] || null;
  }

  // Classical element-by-planet (Golden Dawn / astrology).
  const PLANET_ELEMENT = {
    mars:'fire', sun:'fire', jupiter:'fire',
    venus:'earth', saturn:'earth',
    moon:'water',
    mercury:'air'
  };

  function planetElement(planet) {
    if (!planet) return null;
    return PLANET_ELEMENT[String(planet).toLowerCase()] || null;
  }


  // Resolve a card's governing element.
  //  Minor: explicit suit element. Major: prefer an explicit element, else the zodiac sign's element.
  function cardElement(card) {
    if (!card) return null;
    const a = card.astro || {};
    const s = a.element ? String(a.element).toLowerCase() : '';
    // explicit element
    if (s === 'fire' || s === 'water' || s === 'air' || s === 'earth') return s;
    // a.value may be a zodiac sign (e.g. "Aries") or a planet (e.g. "Mars") or an element root
    const z = zodiacElement(a.zodiac) || zodiacElement(s);
    if (z) return z;
    const pl = planetElement(a.planet) || planetElement(s);
    if (pl) return pl;
    // suit fallback for minors
    const suitEl = { wands:'fire', cups:'water', swords:'air', pentacles:'earth' }[card.suit];
    return suitEl || null;
  }

  // Elemental relationship model (classic air/fire, water/earth grouping).
  // support  = compatible, mutually reinforcing
  // challenge = oppositional, generates friction
  // creative = productive but requires work (productive tension)
  const REL = {
    support:   { code: 'support',   label: '相生',     desc: '同频共振，彼此助燃、相互滋养。' },
    challenge: { code: 'challenge', label: '相克',     desc: '势能相冲，形成张力，需要调和。' },
    creative:  { code: 'creative',  label: '赋能',     desc: '不同频但能产出，靠转化而非对抗。' }
  };

  function relation(a, b) {
    const ea = typeof a === 'string' ? a : cardElement(a);
    const eb = typeof b === 'string' ? b : cardElement(b);
    if (!ea || !eb) return { code: 'neutral', label: '中性', desc: '元素倾向不明确。' };
    const p = [ea, eb].sort();
    const key = p.join('-');
    // map element -> category for relation lookup
    const cat = { fire:'active', air:'active', water:'receptive', earth:'receptive' };
    if (cat[ea] === cat[eb]) {
      // same category (both active or both receptive) => compatible
      return Object.assign({ code: 'support', label: '相生', desc: REL.support.desc + ' ' + ELEMENTS[ea].domain + ' ↔ ' + ELEMENTS[eb].domain + '。' }, { a: ea, b: eb });
    }
    // cross-category
    if ((ea==='fire'&&eb==='water') || (ea==='water'&&eb==='fire') || (ea==='air'&&eb==='earth') || (ea==='earth'&&eb==='air')) {
      return Object.assign({ code: 'challenge', label: '相克', desc: REL.challenge.desc + ' ' + ELEMENTS[ea].label + ELEMENTS[eb].label + '之间需要调停。' }, { a: ea, b: eb });
    }
    return Object.assign({ code: 'creative', label: '赋能', desc: REL.creative.desc + ' ' + ELEMENTS[ea].label + ELEMENTS[eb].label + '之间是转化而非硬碰。' }, { a: ea, b: eb });
  }

  function describeElement(el) {
    return el ? ELEMENTS[el] : null;
  }

  return { ELEMENTS, ZODIAC_ELEMENT, PLANET_ELEMENT, zodiacElement, planetElement, cardElement, relation, REL, describeElement };
});
