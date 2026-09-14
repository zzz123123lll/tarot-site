// tools/beat-toy.mjs — 节奏玩具:点开即玩,敲出声音与画面,还能导出分享图
// 为什么做:调研(抖音/B站 + HN)显示,这一波真正跑出来的是"点开即玩、能被分享"的轻作品,
// 而不是又一个工具页。这里完全用 Web Audio 合成 + Canvas 画,零采样、零版权、零上传。
export function mount(root, H) {
  H.injectCss(".bt-wrap{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:22px;align-items:start}"
    + "@media (max-width:900px){.bt-wrap{grid-template-columns:1fr}}"
    + ".bt-stage{position:relative;border-radius:18px;overflow:hidden;background:#0b0d12;box-shadow:var(--sh-3)}"
    + ".bt-stage canvas{display:block;width:100%;height:auto;touch-action:manipulation}"
    + ".bt-veil{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;background:rgba(8,10,16,.72);color:#fff;backdrop-filter:blur(6px)}"
    + ".bt-veil button{min-height:52px;padding:0 26px;border-radius:999px;border:none;background:#fff;color:#111;font-size:17px;font-weight:600;cursor:pointer}"
    + ".bt-veil p{margin:12px 0 0;font-size:14px;color:rgba(255,255,255,.72)}"
    + ".bt-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}"
    + ".bt-chip{min-height:44px;padding:0 16px;border-radius:999px;border:1px solid var(--c-line-strong);background:#fff;font-size:14px;cursor:pointer}"
    + ".bt-chip.active{background:var(--c-accent);border-color:var(--c-accent);color:#fff}"
    + ".bt-stats{margin-top:14px;background:var(--t-surface);border-radius:14px;padding:14px 16px;font-size:14px;line-height:1.8}"
    + ".bt-stats b{font-variant-numeric:tabular-nums}"
    + ".bt-kbd{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}"
    + ".bt-kbd span{min-width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;border-radius:8px;background:#f2f2f4;font-size:13px;color:#6e6e73}");

  root.innerHTML =
    '<h1 class="tool-h1">节奏玩具</h1>' +
    '<p class="tool-sub">点一下就开始:每次敲击都会发声、也会在画面上留下东西。<b>纯本地合成</b>——没有采样文件、没有上传、不用登录;玩完可以导出一张分享图。</p>' +
    '<div class="bt-wrap">' +
      '<div>' +
        '<div class="bt-stage"><canvas id="cv" width="960" height="600" aria-label="节奏玩具画布"></canvas>' +
          '<div class="bt-veil" id="veil"><div><button id="start">点一下开始</button><p>也可以按空格开始。之后用点击 / 触摸 / 键盘都能敲。</p></div></div>' +
        '</div>' +
        '<div class="bt-row">' +
          '<button class="bt-chip active" data-m="free">自由敲</button>' +
          '<button class="bt-chip" data-m="beat">跟拍(100 BPM)</button>' +
          '<button class="bt-chip" id="bpm">速度:100</button>' +
          '<button class="bt-chip" id="poster">导出分享图</button>' +
        '</div>' +
      '</div>' +
      '<div>' +
        '<div class="bt-stats" id="stats"></div>' +
        '<p class="idp-hint" style="margin-top:10px">键盘 A W S E D F T G Y H U J 对应不同音高;空格重敲当前音;Esc 停。</p>' +
        '<div class="bt-kbd" id="kbd"></div>' +
        '<p class="idp-hint" style="margin-top:10px">所有声音都是浏览器现场合成的正弦/三角波,没有任何音频文件;画面也是 Canvas 画的。</p>' +
      '</div>' +
    '</div>' +
    '<div id="out"></div>';

  var cv = root.querySelector('#cv'), g = cv.getContext('2d');
  var veil = root.querySelector('#veil'), statsEl = root.querySelector('#stats');
  var out = root.querySelector('#out');
  var W = cv.width, Hh = cv.height;

  // ---------- 声音:现场合成,零采样 ----------
  var ac = null, master = null;
  var SCALE = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24, 27]; // 五声音阶 + 小调色彩,怎么敲都不难听
  var KEYMAP = ['A', 'W', 'S', 'E', 'D', 'F', 'T', 'G', 'Y', 'H', 'U', 'J'];
  function ensureAudio() {
    if (!ac) {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) throw new Error('这个浏览器不支持 Web Audio');
      ac = new Ctx();
      master = ac.createGain(); master.gain.value = 0.22; master.connect(ac.destination);
    }
    if (ac.state === 'suspended' && ac.resume) ac.resume();
    return ac;
  }
  function freq(semi) { return 220 * Math.pow(2, semi / 12); }
  function playNote(i, gainMul) {
    ensureAudio();
    var t = ac.currentTime, base = freq(SCALE[i % SCALE.length]);
    var osc = ac.createOscillator(), gn = ac.createGain();
    osc.type = 'triangle'; osc.frequency.value = base;
    var vel = 0.85 * (gainMul || 1);
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(vel, t + 0.012);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);
    osc.connect(gn); gn.connect(master); osc.start(t); osc.stop(t + 0.8);
    // 一层柔和泛音,声音不至于太干
    var o2 = ac.createOscillator(), g2 = ac.createGain();
    o2.type = 'sine'; o2.frequency.value = base * 2;
    g2.gain.setValueAtTime(0.0001, t);
    g2.gain.exponentialRampToValueAtTime(vel * 0.22, t + 0.02);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o2.connect(g2); g2.connect(master); o2.start(t); o2.stop(t + 0.55);
  }
  function playKick(when) {
    var t = when || ac.currentTime;
    var o = ac.createOscillator(), gn = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.16);
    gn.gain.setValueAtTime(0.9, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(gn); gn.connect(master); o.start(t); o.stop(t + 0.25);
  }
  function playHat(when) {
    var t = when || ac.currentTime, len = 0.06;
    var buf = ac.createBuffer(1, Math.floor(ac.sampleRate * len), ac.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    var src = ac.createBufferSource(); src.buffer = buf;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6000;
    var gn = ac.createGain(); gn.gain.value = 0.25;
    src.connect(hp); hp.connect(gn); gn.connect(master); src.start(t);
  }

  // ---------- 画面 ----------
  var shapes = [], ripples = [], pulse = 0, hueBase = 205;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function addHit(i, x, y) {
    var hue = (hueBase + i * 24) % 360;
    var n = reduce ? 6 : 18;
    for (var k = 0; k < n; k++) {
      var a = Math.random() * Math.PI * 2, sp = 0.6 + Math.random() * 3.2;
      shapes.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.6, r: 3 + Math.random() * 9, life: 1, hue: hue, spin: (Math.random() - 0.5) * 0.2 });
    }
    ripples.push({ x: x, y: y, r: 6, life: 1, hue: hue });
    pulse = Math.min(1, pulse + (reduce ? 0.15 : 0.35));
  }
  function step() {
    // 背景:呼吸的深色渐变(rédu-motion 下不动)
    var breathe = reduce ? 0.5 : (0.5 + 0.5 * Math.sin(performance.now() / 2600));
    var grad = g.createLinearGradient(0, 0, W, Hh);
    grad.addColorStop(0, 'hsl(' + hueBase + ',42%,' + (9 + 5 * breathe) + '%)');
    grad.addColorStop(1, 'hsl(' + ((hueBase + 60) % 360) + ',46%,' + (7 + 4 * breathe) + '%)');
    g.fillStyle = grad; g.fillRect(0, 0, W, Hh);
    g.globalCompositeOperation = 'lighter';
    for (var i = shapes.length - 1; i >= 0; i--) {
      var s = shapes[i];
      s.x += s.vx; s.y += s.vy; s.vy += 0.045; s.vx *= 0.992; s.life -= 0.012;
      if (s.life <= 0) { shapes.splice(i, 1); continue; }
      g.beginPath();
      g.fillStyle = 'hsla(' + s.hue + ',85%,62%,' + (s.life * 0.75) + ')';
      g.arc(s.x, s.y, s.r * (0.6 + s.life * 0.6), 0, Math.PI * 2);
      g.fill();
    }
    for (var j = ripples.length - 1; j >= 0; j--) {
      var rp = ripples[j];
      rp.r += 4.2; rp.life -= 0.02;
      if (rp.life <= 0) { ripples.splice(j, 1); continue; }
      g.beginPath();
      g.strokeStyle = 'hsla(' + rp.hue + ',90%,70%,' + (rp.life * 0.6) + ')';
      g.lineWidth = 3 + 6 * rp.life;
      g.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
    if (pulse > 0.001) { pulse *= 0.94; g.fillStyle = 'rgba(255,255,255,' + (pulse * 0.05) + ')'; g.fillRect(0, 0, W, Hh); }
    requestAnimationFrame(step);
  }
  if (shapes.length === 0) requestAnimationFrame(step);

  // ---------- 交互 ----------
  var mode = 'free', started = false, hits = 0, combo = 0, bestCombo = 0, lastHitAt = 0, bpm = 100;
  var offsets = [];   // 跟拍模式下每次击打与最近拍点的偏差(毫秒)
  var lastBeat = 0, loopTimer = null, nextBeatAt = 0, noteIdx = 0;
  function timeNow() { return performance.now(); }
  function hitAt(clientX, clientY) {
    var rect = cv.getBoundingClientRect();
    var x = clientX == null ? W / 2 : (clientX - rect.left) / rect.width * W;
    var y = clientY == null ? Hh / 2 : (clientY - rect.top) / rect.height * Hh;
    var i = noteIdx++;
    playNote(i, 1);
    addHit(i, x, y);
    hits++;
    var now = timeNow();
    if (mode === 'beat') {
      var period = 60000 / bpm;
      var off = now - lastBeat;
      var err = Math.min(off % period, period - (off % period));
      offsets.push(err);
      if (err < 120) { combo++; if (combo > bestCombo) bestCombo = combo; } else { combo = 0; }
    }
    lastHitAt = now;
    paintStats();
  }
  function paintStats() {
    var n = offsets.length;
    var avg = n ? Math.round(offsets.reduce(function (a, b) { return a + b; }, 0) / n) : null;
    var lines = ['敲击次数 <b>' + hits + '</b>'];
    if (mode === 'beat') {
      lines.push('连击 <b>' + combo + '</b>(最长 <b>' + bestCombo + '</b>)');
      lines.push('平均偏差 <b>' + (avg === null ? '—' : avg + ' ms') + '</b>' + (avg !== null && avg < 60 ? '(稳)' : ''));
    } else {
      lines.push('模式:<b>自由敲</b>(怎么敲都不会难听)');
    }
    lines.push('<span style="color:#6e6e73">声音全部由浏览器现场合成,没有音频文件,也没有任何请求。</span>');
    statsEl.innerHTML = lines.map(function (l) { return '<div>' + l + '</div>'; }).join('');
  }
  root.querySelector('#kbd').innerHTML = KEYMAP.map(function (k) { return '<span>' + k + '</span>'; }).join('');

  function startLoop() {
    if (loopTimer) clearInterval(loopTimer);
    ensureAudio();
    var period = 60000 / bpm;
    nextBeatAt = timeNow();
    lastBeat = nextBeatAt;
    loopTimer = setInterval(function () {
      var now = timeNow();
      while (nextBeatAt <= now + 40) {
        var ahead = (nextBeatAt - now) / 1000;
        var when = ac.currentTime + Math.max(0, ahead);
        playKick(when);
        if (Math.round((nextBeatAt / period)) % 2 === 1) playHat(when);
        lastBeat = nextBeatAt;
        nextBeatAt += period;
      }
    }, 25);
  }
  function stopLoop() { if (loopTimer) { clearInterval(loopTimer); loopTimer = null; } }

  function start() {
    try { ensureAudio(); } catch (e) { out.innerHTML = '<div class="note err" style="display:block">' + H.esc(H.friendlyError(e, '音频初始化失败')) + '</div>'; return; }
    started = true;
    veil.style.display = 'none';
    if (mode === 'beat') startLoop();
    paintStats();
    hitAt(null, null);
  }
  root.querySelector('#start').addEventListener('click', start);
  cv.addEventListener('pointerdown', function (e) { if (!started) { start(); return; } hitAt(e.clientX, e.clientY); });
  cv.addEventListener('keydown', function (e) {
    if (KEYMAP.indexOf((e.key || '').toUpperCase()) >= 0) { e.preventDefault(); if (!started) start(); else hitAt(null, null); }
    else if (e.key === ' ') { e.preventDefault(); if (!started) start(); else hitAt(null, null); }
  });
  cv.setAttribute('tabindex', '0');
  cv.setAttribute('role', 'button');
  cv.setAttribute('aria-label', '节奏玩具:点一下开始,之后点击或按 A W S E D F T G Y H U J 演奏');
  document.addEventListener('keydown', function (e) {
    if (!started) return;
    if (e.key === 'Escape') { stopLoop(); veil.style.display = 'flex'; started = false; return; }
    if (document.activeElement === cv) return;
    if (KEYMAP.indexOf((e.key || '').toUpperCase()) >= 0) hitAt(null, null);
  });
  root.querySelectorAll('.bt-chip[data-m]').forEach(function (b) {
    b.addEventListener('click', function () {
      mode = b.dataset.m;
      root.querySelectorAll('.bt-chip[data-m]').forEach(function (x) { x.classList.toggle('active', x === b); });
      if (!started) { paintStats(); return; }
      if (mode === 'beat') startLoop(); else stopLoop();
      combo = 0; paintStats();
    });
  });
  root.querySelector('#bpm').addEventListener('click', function () {
    bpm = bpm === 100 ? 140 : (bpm === 140 ? 80 : 100);
    root.querySelector('#bpm').textContent = '速度:' + bpm;
    if (mode === 'beat' && started) startLoop();
  });

  // ---------- 导出分享图(把我们"能交付"的基因接上) ----------
  // 分享图上带二维码:产物本身就是拉新入口(调研结论:传播发生在外部分享)
  async function makeQr(text, size) {
    if (!window.qrcode) await H.loadScript('/vendor/qrcode.min.js?v=1');
    var qr = window.qrcode(0, 'M');
    qr.addData(text); qr.make();
    var n = qr.getModuleCount();
    var cell = Math.max(2, Math.floor(size / (n + 4)));
    var pad = 2 * cell;
    var c2 = document.createElement('canvas');
    c2.width = c2.height = n * cell + pad * 2;
    var g2 = c2.getContext('2d');
    g2.fillStyle = '#fff'; g2.fillRect(0, 0, c2.width, c2.height);
    g2.fillStyle = '#000';
    for (var r = 0; r < n; r++) for (var col = 0; col < n; col++) if (qr.isDark(r, col)) g2.fillRect(pad + col * cell, pad + r * cell, cell, cell);
    return c2;
  }
  root.querySelector('#poster').addEventListener('click', async function () {
    var qrImg = null;
    try { qrImg = await makeQr('https://gongjuhe.top/beat-toy/', 200); } catch (e) { qrImg = null; }
    var pw = 1080, ph = 1350;
    var c = document.createElement('canvas'); c.width = pw; c.height = ph;
    var pg = c.getContext('2d');
    var grad = pg.createLinearGradient(0, 0, pw, ph);
    grad.addColorStop(0, 'hsl(' + hueBase + ',45%,10%)'); grad.addColorStop(1, 'hsl(' + ((hueBase + 60) % 360) + ',50%,7%)');
    pg.fillStyle = grad; pg.fillRect(0, 0, pw, ph);
    // 波形:把敲击次数画成柱状节奏
    var bars = Math.max(12, Math.min(64, hits || 12));
    pg.globalCompositeOperation = 'lighter';
    for (var i = 0; i < bars; i++) {
      var h = 60 + 320 * Math.abs(Math.sin(i * 0.7 + hits * 0.11));
      pg.fillStyle = 'hsla(' + ((hueBase + i * 22) % 360) + ',85%,60%,.75)';
      var bw = (pw - 160) / bars;
      pg.fillRect(80 + i * bw, ph - 420 - h, Math.max(4, bw - 6), h);
    }
    pg.globalCompositeOperation = 'source-over';
    pg.fillStyle = '#fff'; pg.textBaseline = 'top';
    pg.font = '700 92px "Geist", -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    pg.fillText('我敲了 ' + hits + ' 下', 80, 150);
    pg.font = '500 40px "Geist", -apple-system, "PingFang SC", sans-serif';
    pg.fillStyle = 'rgba(255,255,255,.8)';
    pg.fillText(mode === 'beat' ? ('跟拍 ' + bpm + ' BPM · 最长连击 ' + bestCombo) : '自由敲 · 怎么敲都不会难听', 80, 280);
    pg.fillStyle = 'rgba(255,255,255,.55)';
    pg.font = '500 34px "Geist", -apple-system, "PingFang SC", sans-serif';
    pg.fillText('gongjuhe.top/beat-toy · 声音与画面全部在本机生成', 80, ph - 120);
    if (qrImg) {
      var qs = qrImg.width, qx = pw - qs - 88, qy = ph - qs - 150;
      pg.fillStyle = '#fff';
      pg.beginPath();
      var rr = 14, qw = qs + 24;
      pg.moveTo(qx - 12 + rr, qy - 12);
      pg.arcTo(qx - 12 + qw, qy - 12, qx - 12 + qw, qy - 12 + qw, rr);
      pg.arcTo(qx - 12 + qw, qy - 12 + qw, qx - 12, qy - 12 + qw, rr);
      pg.arcTo(qx - 12, qy - 12 + qw, qx - 12, qy - 12, rr);
      pg.arcTo(qx - 12, qy - 12, qx - 12 + qw, qy - 12, rr);
      pg.closePath(); pg.fill();
      pg.drawImage(qrImg, qx, qy);
      pg.fillStyle = 'rgba(255,255,255,.78)';
      pg.font = '500 24px "Geist", -apple-system, "PingFang SC", sans-serif';
      pg.textAlign = 'center';
      pg.fillText('扫码玩一个你的', qx + qs / 2, qy + qs + 20);
      pg.textAlign = 'left';
    }
    c.toBlob(async function (blob) {
      if (!blob) { out.innerHTML = '<div class="note err" style="display:block">导出失败,请重试。</div>'; return; }
      var chk = await H.checkImage(blob);
      if (chk.ok) H.downloadBlob(blob, '节奏玩具-' + hits + '下.png');
      out.innerHTML = '<div class="note ' + (chk.ok ? 'ok' : 'err') + '" style="display:block">'
        + (chk.ok ? '已导出 ' + chk.width + ' × ' + chk.height + ' · ' + H.fmt(chk.bytes) + '(自检 ✓)' : '自检没通过:' + H.esc(chk.error)) + '</div>';
    }, 'image/png');
  });

  paintStats();
  if (reduce) out.innerHTML = '<div class="note" style="display:block">检测到系统开启了「减少动态效果」:粒子数量已自动减少,背景不再呼吸。</div>';
}
