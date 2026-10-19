/* /tools/ search + filter (no dependencies) */
(function () {
  "use strict";

  var input = document.getElementById("toolSearch");
  var cards = Array.prototype.slice.call(document.querySelectorAll(".tool-card"));
  var groups = Array.prototype.slice.call(document.querySelectorAll(".tool-group"));
  var count = document.getElementById("toolCount");
  var empty = document.getElementById("toolEmpty");

  if (!input || !cards.length) return;

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function apply() {
    var query = normalize(input.value);
    var visible = 0;

    cards.forEach(function (card) {
      var haystack = normalize(card.getAttribute("data-search"));
      var hit = !query || haystack.indexOf(query) !== -1;
      card.hidden = !hit;
      if (hit) visible += 1;
    });

    groups.forEach(function (group) {
      var hasVisible = Array.prototype.some.call(
        group.querySelectorAll(".tool-card"),
        function (card) { return !card.hidden; }
      );
      group.hidden = !hasVisible;
    });

    if (count) count.textContent = visible + " 个工具";
    if (empty) empty.hidden = visible !== 0;
  }

  input.addEventListener("input", apply);

  document.addEventListener("keydown", function (event) {
    if (event.key === "/" && document.activeElement !== input) {
      event.preventDefault();
      input.focus();
      return;
    }
    if (event.key === "Escape" && document.activeElement === input) {
      input.value = "";
      apply();
      input.blur();
    }
  });

  apply();
})();
