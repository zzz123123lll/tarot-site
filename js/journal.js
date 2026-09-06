// js/journal.js — 占卜日志：记住每次抽牌，重复出现的牌会被点出。
(function () {
  var KEY = 'tarot_history';
  var MAX = 50;

  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch(e){ return []; } }
  function saveList(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch(e){} }

  function add(reading) {
    if (!reading || !reading.cards) return;
    var list = load();
    var entry = {
      t: new Date().toISOString(),
      spread: reading.spread ? (reading.spread.name || '占卜') : '占卜',
      question: reading.question || '',
      cards: reading.cards.map(function (c) { return { en: c.card.en, name: c.card.name, rev: !!c.reversed }; })
    };
    list.unshift(entry);
    if (list.length > MAX) list.length = MAX;
    saveList(list);
    render();
  }

  // count how many times each card has appeared (by en)
  function counts(list) {
    var m = {};
    list.forEach(function (e) { e.cards.forEach(function (c) { m[c.en] = (m[c.en] || 0) + 1; }); });
    return m;
  }

  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function render() {
    var box = document.getElementById('journalList');
    if (!box) return;
    var list = load();
    if (!list.length) { box.innerHTML = '<p class="journal-empty">还没有记录。完成一次占卜后，它会留在这里，成为你回望自己的线索。</p>'; return; }
    var freq = counts(list);
    var h = [];
    list.forEach(function (e, i) {
      var d = new Date(e.t);
      var ds = (d.getMonth()+1) + '月' + d.getDate() + '日';
      h.push('<div class="journal-entry">');
      h.push('<div class="journal-meta"><span>' + ds + '</span><span>' + esc(e.spread) + '</span></div>');
      if (e.question) h.push('<p class="journal-q">' + esc(e.question) + '</p>');
      h.push('<div class="journal-cards">');
      e.cards.forEach(function (c) {
        var repeat = freq[c.en] > 1;
        h.push('<span class="journal-card' + (c.rev ? ' rev' : '') + (repeat ? ' recurring' : '') + '" title="' + esc(c.name) + '">' + esc(c.name) + (c.rev ? '·逆' : '') + (repeat ? ' ★' : '') + '</span>');
      });
      h.push('</div></div>');
    });
    var recurring = [];
    Object.keys(freq).forEach(function (en) { if (freq[en] > 1) recurring.push(en + ' ×' + freq[en]); });
    if (recurring.length) {
      h.push('<div class="journal-note">✦ 重复出现的牌：' + recurring.join('、') + ' —— 它可能正是你反复面对的课题。</div>');
    }
    box.innerHTML = h.join('');
  }

  window.Journal = { add: add, render: render };
  document.addEventListener('DOMContentLoaded', render);
})();
