// js/motion.js — 轻量站点动效
// 1) Hero 主 CTA 平滑滚动到「开始占卜」区
// 2) 区块滚动渐入（IntersectionObserver，respect prefers-reduced-motion）
(function () {
  // Hero CTA scroll
  document.addEventListener('DOMContentLoaded', function () {
    var cta = document.getElementById('heroCta');
    if (cta) cta.addEventListener('click', function () {
      var s = document.getElementById('setup');
      if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Scroll reveal
  document.addEventListener('DOMContentLoaded', function () {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.reveal').forEach(function (e) { e.classList.add('in-view'); });
      return;
    }
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || !els.length) { els.forEach(function (e){ e.classList.add('in-view'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in-view'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    els.forEach(function (e) { io.observe(e); });
  });
})();
