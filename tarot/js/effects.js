// js/effects.js — Witchcore 抽牌能量反馈 (Magic-UI 风格)。
// 当牌面 .is-revealed 出现时，在牌心爆一圈金色能量环 + 星火粒子；(prefers-reduced-motion 降级)。
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Inject keyframes once
  const style = document.createElement('style');
  style.textContent = [
    '@keyframes fx-ring { 0% { transform: scale(0.2); opacity: 0.9; } 100% { transform: scale(1.7); opacity: 0; } }',
    '@keyframes fx-spark { 0% { transform: translate(0,0) scale(0.4); opacity: 1; } 100% { transform: translate(var(--dx), var(--dy)) scale(1); opacity: 0; } }',
    '@keyframes card-energy { 0%,100% { box-shadow: 0 18px 50px rgba(0,0,0,0.5), 0 0 10px rgba(201,167,78,0.12); } 50% { box-shadow: 0 18px 50px rgba(0,0,0,0.5), 0 0 26px rgba(201,167,78,0.42); } }'
  ].join(' ');
  document.head.appendChild(style);

  function burstAt(el) {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const host = document.createElement('div');
    host.className = 'fx-burst';
    host.style.cssText = 'position:fixed;left:' + cx + 'px;top:' + cy + 'px;z-index:999;pointer-events:none;';
    const ring = document.createElement('div');
    ring.className = 'fx-ring';
    ring.style.cssText = 'position:absolute;left:-42px;top:-42px;width:84px;height:84px;border-radius:50%;border:2px solid rgba(231,195,104,0.85);box-shadow:0 0 22px rgba(201,167,78,0.6);animation:fx-ring 0.9s ease-out forwards;';
    host.appendChild(ring);
    const colors = ['#f3d97f', '#c9a74e', '#7b68ae', '#e6c368'];
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('div');
      s.className = 'fx-spark';
      const ang = (Math.PI * 2 * i / 14) + (Math.random() * 0.4);
      const dist = 44 + Math.random() * 52;
      const dx = Math.cos(ang) * dist;
      const dy = Math.sin(ang) * dist;
      const size = 5 + Math.random() * 7;
      s.style.cssText = 'position:absolute;left:-' + (size/2) + 'px;top:-' + (size/2) + 'px;width:' + size + 'px;height:' + size + 'px;background:' + colors[i % colors.length] + ';box-shadow:0 0 10px ' + colors[i % colors.length] + ';clip-path:polygon(50% 0,62% 40%,100% 50%,62% 60%,50% 100%,38% 60%,0 50%,38% 40%);--dx:' + dx.toFixed(1) + 'px;--dy:' + dy.toFixed(1) + 'px;animation:fx-spark 0.85s ease-out forwards;animation-delay:' + (Math.random()*0.08).toFixed(2) + 's;';
      host.appendChild(s);
    }
    document.body.appendChild(host);
    setTimeout(function () { host.remove(); }, 1100);
  }

  function observeGrids() {
    const grids = document.querySelectorAll('.cards-grid, #ritualCards');
    grids.forEach(function (grid) {
      if (grid.__fx) return; grid.__fx = true;
      const mo = new MutationObserver(function (muts) {
        for (const m of muts) {
          if (m.type === 'attributes' && m.attributeName === 'class' && m.target.classList.contains('is-revealed')) {
            burstAt(m.target);
          }
        }
      });
      mo.observe(grid, { attributes: true, attributeFilter: ['class'], subtree: true });
    });
  }

  document.addEventListener('DOMContentLoaded', observeGrids);
})();
