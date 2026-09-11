// tools/color.mjs — 颜色工具（HEX/RGB/HSL 双向、拾色、WCAG 对比度）
export function mount(root, H) {
  H.injectCss(".crow{display:flex;align-items:center;gap:8px;margin-bottom:12px}.crow label{font-size:14px;color:#6e6e73;min-width:34px}.cinput{width:64px}.swatch{width:100%;height:64px;border-radius:10px;border:1px solid rgba(0,0,0,.12);margin:8px 0 16px}.wcag-ok{color:#147a3a}.wcag-bad{color:#d70015}");

  root.innerHTML =
    '<h1 class="tool-h1">颜色工具</h1>' +
    '<p class="tool-sub">HEX / RGB / HSL 双向互转，对比度检查。全部本地。</p>' +
    '<div class="crow"><label>拾色</label><input type="color" id="pick" value="#0071e3"></div>' +
    '<div class="crow"><label>HEX</label><input type="text" class="tool-input cinput" id="hex" value="#0071e3" style="flex:1"></div>' +
    '<div class="crow"><label>RGB</label><input type="number" class="tool-input cinput" id="r" min="0" max="255"><input type="number" class="tool-input cinput" id="g" min="0" max="255"><input type="number" class="tool-input cinput" id="b" min="0" max="255"></div>' +
    '<div class="crow"><label>HSL</label><input type="number" class="tool-input cinput" id="h" min="0" max="360"><input type="number" class="tool-input cinput" id="s" min="0" max="100"><input type="number" class="tool-input cinput" id="l" min="0" max="100"></div>' +
    '<div class="swatch" id="sw"></div>' +
    '<div class="tool-row" style="margin-bottom:16px"><button class="tool-btn tool-btn--ghost" id="cp">复制 HEX</button></div>' +
    '<div class="tool-field"><label>对比度检查（第二个颜色）</label><div class="crow"><input type="text" class="tool-input cinput" id="hex2" value="#ffffff" style="flex:1"><span id="wcag" style="font-size:14px"></span></div></div>';

  var el = {
    pick: root.querySelector('#pick'), hex: root.querySelector('#hex'),
    r: root.querySelector('#r'), g: root.querySelector('#g'), b: root.querySelector('#b'),
    h: root.querySelector('#h'), s: root.querySelector('#s'), l: root.querySelector('#l'),
    sw: root.querySelector('#sw'), hex2: root.querySelector('#hex2'), wcag: root.querySelector('#wcag')
  };
  var lock = false;

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, h = 0, s = 0, l = (mx + mn) / 2;
    if (d) { s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      switch (mx) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; default: h = (r - g) / d + 4; }
      h /= 6; }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }
  function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    if (!s) { var g2 = Math.round(l * 255); return [g2, g2, g2]; }
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    function hue(t) { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; }
    return [Math.round(hue(h + 1 / 3) * 255), Math.round(hue(h) * 255), Math.round(hue(h - 1 / 3) * 255)];
  }
  function toHex(n) { return ('0' + n.toString(16)).slice(-2); }

  function sync(src) {
    if (lock) return;
    lock = true;
    var r, g, b;
    if (src === 'hex') {
      var v = el.hex.value.trim().replace('#', '');
      if (!/^[0-9a-fA-F]{6}$/.test(v)) { lock = false; return; }
      r = parseInt(v.slice(0, 2), 16); g = parseInt(v.slice(2, 4), 16); b = parseInt(v.slice(4, 6), 16);
    } else if (src === 'rgb') {
      r = Math.min(255, Math.max(0, parseInt(el.r.value) || 0));
      g = Math.min(255, Math.max(0, parseInt(el.g.value) || 0));
      b = Math.min(255, Math.max(0, parseInt(el.b.value) || 0));
    } else {
      var h2 = Math.min(360, Math.max(0, parseInt(el.h.value) || 0));
      var s2 = Math.min(100, Math.max(0, parseInt(el.s.value) || 0));
      var l2 = Math.min(100, Math.max(0, parseInt(el.l.value) || 0));
      var rgb = hslToRgb(h2, s2, l2); r = rgb[0]; g = rgb[1]; b = rgb[2];
    }
    var hsl = rgbToHsl(r, g, b);
    var hex = '#' + toHex(r) + toHex(g) + toHex(b);
    el.hex.value = hex; el.pick.value = hex;
    el.r.value = r; el.g.value = g; el.b.value = b;
    el.h.value = hsl[0]; el.s.value = hsl[1]; el.l.value = hsl[2];
    el.sw.style.background = hex;
    checkWcag(r, g, b);
    lock = false;
  }

  function checkWcag(r, g, b) {
    var v = el.hex2.value.trim().replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(v)) { el.wcag.textContent = ''; return; }
    var r2 = parseInt(v.slice(0, 2), 16), g2 = parseInt(v.slice(2, 4), 16), b2 = parseInt(v.slice(4, 6), 16);
    function lum(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
    function L(rc, gc, bc) { return 0.2126 * lum(rc) + 0.7152 * lum(gc) + 0.0722 * lum(bc); }
    var l1 = L(r, g, b), l2 = L(r2, g2, b2);
    var ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    el.wcag.innerHTML = '对比度 <strong>' + ratio.toFixed(2) + '</strong> ' + (ratio >= 4.5 ? '<span class="wcag-ok">AA ✓</span>' : '<span class="wcag-bad">未达 AA</span>');
  }

  el.hex.addEventListener('input', function () { sync('hex'); });
  el.pick.addEventListener('input', function () { el.hex.value = el.pick.value; sync('hex'); });
  ['r', 'g', 'b'].forEach(function (k) { el[k].addEventListener('input', function () { sync('rgb'); }); });
  ['h', 's', 'l'].forEach(function (k) { el[k].addEventListener('input', function () { sync('hsl'); }); });
  el.hex2.addEventListener('input', function () { var v = el.hex.value.trim().replace('#', ''); if (/^[0-9a-fA-F]{6}$/.test(v)) checkWcag(parseInt(v.slice(0,2),16), parseInt(v.slice(2,4),16), parseInt(v.slice(4,6),16)); });
  root.querySelector('#cp').addEventListener('click', function () { H.copyText(el.hex.value, this); });
  sync('hex');
}
