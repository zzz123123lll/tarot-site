/* gongjuhe.top personal site — interactions (HERBARIUM) */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var menuBtn = document.querySelector(".menu-toggle");
  var nav = document.getElementById("site-nav");

  function closeMenu() {
    document.body.classList.remove("nav-open");
    if (menuBtn) {
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.textContent = "菜单";
    }
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.textContent = open ? "关闭" : "菜单";
    });
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu();
    });
  }

  var items = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (!reduceMotion && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    items.forEach(function (el) { observer.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }

  var year = String(new Date().getFullYear());
  Array.prototype.forEach.call(document.querySelectorAll(".js-year"), function (el) {
    el.textContent = year;
  });
})();
