// assets/pointer-fx.js — 指针特效(纯增强,无依赖)
// 来源与做法(参考站点):
//   · SpotlightCard(reactbits.dev):mousemove 里把 --mouse-x/--mouse-y 写到元素上,
//     CSS 用 radial-gradient(circle at var(--mouse-x) var(--mouse-y), ...) 画光斑,opacity 由 hover 控制。
//   · TiltedCard(reactbits.dev):按指针相对中心的偏移归一化后乘幅度得到 rotateX/rotateY(它用 14° + 弹簧),
//     我们收敛到 ≤5° 并把弹簧换成一次性 rAF 缓动(省一个依赖,也不会持续占用帧)。
//   · GlareHover / StarBorder(reactbits.dev)、Card Spotlight(ui.aceternity.com):光扫/聚光都是"渐变 + transform/opacity"。
// 约束:只在"细指针 + 允许动效"时启用;不隐藏任何内容(纯增强);不产生常驻动画。
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduce || !fine) return;

  var MAX_TILT = 5;      // 度;TiltedCard 原值 14°,工具站要更克制
  var LERP = 0.14;       // 一次性缓动系数(替代弹簧)

  // ---------- 1) 聚光跟随:事件委托,一个监听器管所有卡片 ----------
  var spotEl = null;
  var spotRaf = 0;
  var last = null;
  function onMove(e) {
    var card = e.target && e.target.closest ? e.target.closest('[data-fx~="spotlight"]') : null;
    if (!card) { if (spotEl) { spotEl.classList.remove('fx-spot-on'); spotEl = null; } return; }
    if (card !== spotEl) {
      if (spotEl) spotEl.classList.remove('fx-spot-on');
      spotEl = card;
      card.classList.add('fx-spot-on');
    }
    last = { x: e.clientX, y: e.clientY };
    if (!spotRaf) {
      spotRaf = requestAnimationFrame(function () {
        spotRaf = 0;
        if (!spotEl || !last) return;
        var r = spotEl.getBoundingClientRect();
        spotEl.style.setProperty('--mx', (last.x - r.left) + 'px');
        spotEl.style.setProperty('--my', (last.y - r.top) + 'px');
      });
    }
  }
  // pointermove 是主事件(鼠标/触控笔统一);mousemove 作为兜底(某些自动化/老环境只派发 mouse 事件)。
  // 两个监听器只写同一组 CSS 变量,重复触发无副作用,且都被 rAF 合并。
  document.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('mousemove', onMove, { passive: true });
  function reset() { if (spotEl) { spotEl.classList.remove('fx-spot-on'); spotEl = null; } }
  document.addEventListener('pointerleave', reset, { passive: true });
  document.addEventListener('mouseleave', reset, { passive: true });

  // ---------- 2) 3D 倾斜:进入才开始 rAF,离开就归零并停掉 ----------
  function attachTilt(el) {
    var raf = 0, running = false;
    var cur = { rx: 0, ry: 0 }, target = { rx: 0, ry: 0 };
    function step() {
      cur.rx += (target.rx - cur.rx) * LERP;
      cur.ry += (target.ry - cur.ry) * LERP;
      el.style.setProperty('--rx', cur.rx.toFixed(2) + 'deg');
      el.style.setProperty('--ry', cur.ry.toFixed(2) + 'deg');
      var settled = Math.abs(target.rx - cur.rx) < 0.05 && Math.abs(target.ry - cur.ry) < 0.05;
      if (settled) {
        cur.rx = target.rx; cur.ry = target.ry;
        el.style.setProperty('--rx', cur.rx.toFixed(2) + 'deg');
        el.style.setProperty('--ry', cur.ry.toFixed(2) + 'deg');
        if (!running) { raf = 0; return; }
      }
      raf = requestAnimationFrame(step);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(step); }
    el.addEventListener('pointerenter', function () { running = true; el.classList.add('fx-tilt-on'); kick(); }, { passive: true });
    el.addEventListener('mouseenter', function () { running = true; el.classList.add('fx-tilt-on'); kick(); }, { passive: true });
    var follow = function (e) {
      var r = el.getBoundingClientRect();
      var ox = (e.clientX - r.left - r.width / 2) / (r.width / 2);
      var oy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
      target.rx = -oy * MAX_TILT;
      target.ry = ox * MAX_TILT;
      kick();
    };
    el.addEventListener('pointermove', follow, { passive: true });
    el.addEventListener('mousemove', follow, { passive: true });
    el.addEventListener('pointerleave', function () {
      running = false;
      target.rx = 0; target.ry = 0;
      el.classList.remove('fx-tilt-on');
      kick();
    }, { passive: true });
    el.addEventListener('mouseleave', function () {
      running = false;
      target.rx = 0; target.ry = 0;
      el.classList.remove('fx-tilt-on');
      kick();
    }, { passive: true });
  }
  var tiltEls = document.querySelectorAll('[data-fx~="tilt"]');
  for (var i = 0; i < tiltEls.length; i++) attachTilt(tiltEls[i]);
})();
