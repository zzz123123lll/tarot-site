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
    + ".bt-kbd span.on{background:var(--c-accent);border-color:var(--c-accent);color:#fff;transform:translateY(1px)}"
    + ".bt-grade{margin-top:8px;border-top:1px solid var(--c-hairline);padding-top:8px}"
    + ".bt-grade .g{font-size:22px;font-weight:700;letter-spacing:1px;color:var(--c-accent)}"
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
          '<button class="bt-chip" data-m="beat">跟拍</button>' +
          '<button class="bt-chip" id="tmpl">伴奏:简单四拍</button>' +
          '<button class="bt-chip" id="duo">双人模式:关</button>' +
          '<button class="bt-chip" id="poster">导出分享图</button>' +
      '<button class="bt-chip" id="daily">今日挑战</button>' +
        '</div>' +
      '</div>' +
      '<div>' +
        '<div class="bt-stats" id="stats"></div>' +
        '<p class="idp-hint" style="margin-top:10px">不用先点开始:直接敲 <b>A W S E D F T G Y H U J</b> 任意一个键就进入(键位会跟着亮);空格重敲当前音;Esc 停。打拍子模式下会给<b>准确率与评级</b>(准确率 = 偏差 ≤120ms 的敲击占比)。</p>' +
        '<div class="bt-kbd" id="kbd"></div>' +
        '<p class="idp-hint" style="margin-top:10px">想每天来一次就点「今日挑战」:当天模板固定,打满 20 下给评级,连续来练的天数只存在你自己的浏览器里(localStorage),不上传。</p>' +
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

  function playSnare(when) {
    var t = when || ac.currentTime, len = 0.12;
    var buf = ac.createBuffer(1, Math.floor(ac.sampleRate * len), ac.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    var src = ac.createBufferSource(); src.buffer = buf;
    var bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 0.9;
    var gn = ac.createGain(); gn.gain.value = 0.32;
    src.connect(bp); bp.connect(gn); gn.connect(master); src.start(t);
  }

  // ---------- 画面 ----------
  var shapes = [], ripples = [], pulse = 0, hueBase = 205;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function addHit(i, x, y, who) {
    // 左边偏冷、右边偏暖:双人模式下谁在敲一眼能看出来
    var hue = (hueBase + i * 24 + (who ? 130 : 0)) % 360;
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
  var mode = 'free', started = false, bpm = 100, duo = false;
  // 每日挑战:当天固定模板 + 打满 20 下出评级,记录存在本机(localStorage),算"连续来练几天"。
  // 依据:Wordle 的"每日同题"(内部文档/计划-作品线成熟化.md 第 8 节)+ Monkeytype 的"秒重开"。
  var dailyOn = false, DAILY_GOAL = 20;
  function todayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function dailyIdx() {
    var d = new Date();
    var days = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
    return ((days % TEMPLATES.length) + TEMPLATES.length) % TEMPLATES.length;
  }
  function dailyRead() { try { return JSON.parse(localStorage.getItem('tb-daily') || 'null'); } catch (e) { return null; } }
  function dailyStreak(st) {
    if (!st || !st.days) return 0;
    var n = 0, d = new Date();
    for (var i = 0; i < 400; i++) {
      if (st.days.indexOf(todayKey(d)) < 0) break;
      n++; d.setDate(d.getDate() - 1);
    }
    return n;
  }
  function dailyRecord(g, acc) {
    var st = dailyRead() || { days: [] };
    if (!st.days) st.days = [];
    var k = todayKey();
    if (st.days.indexOf(k) < 0) st.days.push(k);
    if (st.days.length > 90) st.days = st.days.slice(-90);
    try { localStorage.setItem('tb-daily', JSON.stringify(st)); } catch (e) { /* 隐私模式下写不了就只当次有效 */ }
    return dailyStreak(st);
  }
  // 两位玩家各自计数:双人模式下左右半区各算各的
  var P = [{ hits: 0, combo: 0, best: 0, offsets: [] }, { hits: 0, combo: 0, best: 0, offsets: [] }];
  var lastBeat = 0, loopTimer = null, nextBeatAt = 0, noteIdx = 0, lastHitAt = 0;
  var KEYMAP_L = ['A', 'S', 'D', 'F'], KEYMAP_R = ['J', 'K', 'L', ';'];
  function timeNow() { return performance.now(); }
  function hitAt(clientX, clientY, forced) {
    var rect = cv.getBoundingClientRect();
    var x = clientX == null ? W / 2 : (clientX - rect.left) / rect.width * W;
    var y = clientY == null ? Hh / 2 : (clientY - rect.top) / rect.height * Hh;
    var who = forced !== undefined ? forced : (duo ? (x < W / 2 ? 0 : 1) : 0);
    var st = P[who];
    var i = noteIdx++;
    playNote(i + who * 3, 1);   // 右边比左边高几个音级,两个人听起来不打架
    addHit(i, x, y, who);
    st.hits++;
    var now = timeNow();
    if (mode === 'beat') {
      var period = 60000 / bpm;
      var off = now - lastBeat;
      var err = Math.min(off % period, period - (off % period));
      st.offsets.push(err);
      if (err < 120) { st.combo++; if (st.combo > st.best) st.best = st.combo; } else { st.combo = 0; }
    }
    lastHitAt = now;
    paintStats();
  }
  function resetStats() { P = [{ hits: 0, combo: 0, best: 0, offsets: [] }, { hits: 0, combo: 0, best: 0, offsets: [] }]; noteIdx = 0; }
  function avgOf(st) { return st.offsets.length ? Math.round(st.offsets.reduce(function (a, b) { return a + b; }, 0) / st.offsets.length) : null; }
  // 准确率与评级:全部本地算、口径写在界面上("偏差 ≤120ms 的敲击占比"),不做玄学分数。
  // 依据:NN/g 游戏化"先反馈再计分"+ ZType/Monkeytype 那种"立刻给结果、马上能再来一次"的做法。
  function accOf(st) {
    if (!st.offsets.length) return null;
    var ok = st.offsets.filter(function (o) { return Math.abs(o) <= 120; }).length;
    return Math.round(ok / st.offsets.length * 100);
  }
  function gradeOf(st) {
    var acc = accOf(st);
    if (acc === null) return null;
    if (acc >= 95 && st.best >= 20) return { g: 'S', t: '和节拍锁死了' };
    if (acc >= 88 && st.best >= 12) return { g: 'A', t: '很稳' };
    if (acc >= 75) return { g: 'B', t: '跟上了' };
    return { g: 'C', t: '再听两轮' };
  }
  function gradeLine(st, who) {
    var gr = gradeOf(st), acc = accOf(st);
    if (!gr) return '';
    var color = who === 1 ? '#e0894f' : '#5b8def';
    return '<div class="bt-grade"><span class="g" style="color:' + color + '">' + gr.g + '</span> · ' + H.esc(gr.t)
      + ' · 准确率 <b>' + acc + '%</b><span style="color:#6e6e73">(偏差 ≤120ms 的敲击占比)</span>'
      + ' · 最长连击 <b>' + st.best + '</b></div>';
  }
  function flashKey(k) {
    if (!k) return;
    var el = root.querySelector('.bt-kbd span[data-k="' + k.toUpperCase() + '"]');
    if (!el) return;
    el.classList.add('on');
    setTimeout(function () { el.classList.remove('on'); }, 140);
  }
  function paintStats() {
    var lines = [];
    var t = TEMPLATES[tmplIdx];
    if (duo) {
      lines.push('<div style="display:flex;gap:18px"><div style="flex:1"><div style="color:#5b8def">左边(玩家 1)</div>敲 <b>' + P[0].hits + '</b> 下'
        + (mode === 'beat' ? '<br>连击 <b>' + P[0].combo + '</b>(最长 <b>' + P[0].best + '</b>)<br>偏差 <b>' + (avgOf(P[0]) === null ? '—' : avgOf(P[0]) + ' ms') + '</b>' : '') + '</div>'
        + '<div style="flex:1"><div style="color:#e0894f">右边(玩家 2)</div>敲 <b>' + P[1].hits + '</b> 下'
        + (mode === 'beat' ? '<br>连击 <b>' + P[1].combo + '</b>(最长 <b>' + P[1].best + '</b>)<br>偏差 <b>' + (avgOf(P[1]) === null ? '—' : avgOf(P[1]) + ' ms') + '</b>' : '') + '</div></div>');
    } else {
      lines.push('敲击次数 <b>' + P[0].hits + '</b>');
      if (mode === 'beat') {
        lines.push('连击 <b>' + P[0].combo + '</b>(最长 <b>' + P[0].best + '</b>)');
        lines.push('平均偏差 <b>' + (avgOf(P[0]) === null ? '—' : avgOf(P[0]) + ' ms') + '</b>' + (avgOf(P[0]) !== null && avgOf(P[0]) < 60 ? '(稳)' : ''));
        var gl = gradeLine(P[0], 0); if (gl) lines.push(gl);
      } else {
        lines.push('模式:<b>自由敲</b>(怎么敲都不会难听)');
      }
    }
    if (duo && mode === 'beat') {
      var g0 = gradeOf(P[0]), g1 = gradeOf(P[1]);
      if (g0 && g1) {
        lines.push('<div class="bt-grade">左边 <span class="g" style="color:#5b8def">' + g0.g + '</span> 准确率 <b>' + accOf(P[0]) + '%</b>'
          + ' · 右边 <span class="g" style="color:#e0894f">' + g1.g + '</span> 准确率 <b>' + accOf(P[1]) + '%</b>'
          + ' · ' + (accOf(P[0]) === accOf(P[1]) ? '平手' : (accOf(P[0]) > accOf(P[1]) ? '左边更稳' : '右边更稳')) + '</div>');
      }
    }
    // 常驻显示(不只点了才显示):用户一进页面就该看到"今天有挑战、我连了几天" ——
    // 第一版只在 dailyOn 时显示,于是没点过的人完全不知道有这回事(端到端测试抓到的)。
    lines.push(paintDailyLine());
    lines.push('伴奏:<b>' + t.name + '</b> · ' + bpm + ' BPM' + (t.id === 'none' ? '(可以自己敲节奏)' : ''));
    lines.push('<span style="color:#6e6e73">声音全部由浏览器现场合成,没有音频文件,也没有任何请求。</span>');
    statsEl.innerHTML = lines.map(function (l) { return '<div>' + l + '</div>'; }).join('');
    // 打满目标就结算一次,并把"今天来过了"记在本机;结果卡给"再来一次"
    if (dailyOn && mode === 'beat' && P[0].hits === DAILY_GOAL) {
      var gr = gradeOf(P[0]), acc = accOf(P[0]);
      if (gr) {
        var streak = dailyRecord(gr, acc);
        out.innerHTML = '<div class="note ok" style="display:block"><b>今日挑战完成</b> · 评级 <b>' + gr.g + '</b>(' + H.esc(gr.t) + ')'
          + ' · 准确率 <b>' + acc + '%</b> · 最长连击 <b>' + P[0].best + '</b>'
          + (streak > 1 ? ' · 已连续来练 <b>' + streak + '</b> 天' : '')
          + '</div><div class="tool-row"><button class="tool-btn" id="againD">再来一次(当日最高分不会覆盖记录)</button></div>';
        var ab = root.querySelector('#againD');
        if (ab) ab.addEventListener('click', function () { out.innerHTML = ''; resetStats(); paintStats(); });
      }
    }
  }
  function paintKbd() {
    var keys = duo ? KEYMAP_L.concat(['|']).concat(KEYMAP_R) : KEYMAP;
    root.querySelector('#kbd').innerHTML = keys.map(function (k) {
      return '<span' + (k === '|' ? '' : ' data-k="' + k + '"') + '>' + (k === '|' ? '·' : k) + '</span>';
    }).join('');
  }
  paintKbd();

  // 节拍模板:每个模板用 16 分音符的字符串谱表示(1 = 这一格打一下)
  var TEMPLATES = [
    { id: 'simple', name: '简单四拍', bpm: 100, kick: '1000100010001000', hat: '0010001000100010' },
    { id: 'four', name: '四拍舞曲', bpm: 120, kick: '1000100010001000', hat: '1010101010101010', clap: '0000100000001000' },
    { id: 'bossa', name: '轻巴萨', bpm: 96, kick: '1000001010000010', hat: '0010101000101010' },
    { id: 'none', name: '无伴奏', bpm: 100, kick: '', hat: '' }
  ];
  var tmplIdx = 0;
  function startLoop() {
    stopLoop();
    ensureAudio();
    var t = TEMPLATES[tmplIdx];
    bpm = t.bpm;
    var stepMs = (60000 / bpm) / 4;   // 十六分音符
    var stepIdx = 0;
    nextBeatAt = timeNow();
    lastBeat = nextBeatAt;
    loopTimer = setInterval(function () {
      var now = timeNow();
      while (nextBeatAt <= now + 45) {
        var when = ac.currentTime + Math.max(0, (nextBeatAt - now) / 1000);
        if (t.kick.charAt(stepIdx % 16) === '1') playKick(when);
        if (t.hat.charAt(stepIdx % 16) === '1') playHat(when);
        if (t.clap && t.clap.charAt(stepIdx % 16) === '1') playSnare(when);
        if (stepIdx % 4 === 0) lastBeat = nextBeatAt;   // 四分音符拍点,跟拍判定用它
        stepIdx++;
        nextBeatAt += stepMs;
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
  var dailyBtn = root.querySelector('#daily');
  function startDaily() {
    var t = TEMPLATES[dailyIdx()];
    var ti = TEMPLATES.indexOf(t);
    if (ti >= 0) { tmplIdx = ti; bpm = t.bpm; var tb = root.querySelector('#tmpl'); if (tb) tb.textContent = '伴奏:' + t.name; }
    mode = 'beat'; dailyOn = true; duo = false;
    root.querySelectorAll('.bt-chip[data-m]').forEach(function (x) { x.classList.toggle('active', x.dataset.m === 'beat'); });
    resetStats(); paintStats(); paintKbd();
    if (!started) start();
    H.toast('今日挑战:' + t.name + ' · ' + bpm + ' BPM —— 打满 ' + DAILY_GOAL + ' 下看评级', { ms: 5200 });
  }
  if (dailyBtn) dailyBtn.addEventListener('click', startDaily);
  function paintDailyLine() {
    var st = dailyRead();
    var n = dailyStreak(st);
    var t = TEMPLATES[dailyIdx()];
    return '<span style="color:#6e6e73">今日挑战模板:<b>' + H.esc(t.name) + '</b> · ' + t.bpm + ' BPM · 打满 ' + DAILY_GOAL + ' 下出评级'
      + (n ? ' · 已连续来练 <b>' + n + '</b> 天' : '') + '</span>';
  }
  cv.addEventListener('pointerdown', function (e) { if (!started) { start(); return; } hitAt(e.clientX, e.clientY); });
  // 键盘:单人时 A W S E D F T G Y H U J;双人时左边 A S D F、右边 J K L ; 各管一半画面
  function keyPlayer(k) {
    k = (k || '').toUpperCase();
    if (duo) {
      if (KEYMAP_L.indexOf(k) >= 0) return 0;
      if (KEYMAP_R.indexOf(k) >= 0) return 1;
      return -1;
    }
    return KEYMAP.indexOf(k) >= 0 ? 0 : -1;
  }
  cv.addEventListener('keydown', function (e) {
    var p = keyPlayer(e.key);
    if (p >= 0) { e.preventDefault(); flashKey(e.key); if (!started) start(); else hitAt(p === 0 ? W / 4 : W * 3 / 4, Hh / 2, p); }
    else if (e.key === ' ') { e.preventDefault(); if (!started) start(); else hitAt(null, null); }
  });
  cv.setAttribute('tabindex', '0');
  cv.setAttribute('role', 'button');
  cv.setAttribute('aria-label', '节奏玩具:点一下开始;单人按 A W S E D F T G Y H U J,双人左边 A S D F、右边 J K L 分号');
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && started) { stopLoop(); veil.style.display = 'flex'; started = false; return; }
    var pk = keyPlayer(e.key);
    // 之前这里"没开始就直接 return",于是遮罩还在时敲键毫无反应 —— 而 NN/g 的判据是"首屏可试"。
    // 现在敲任意音符键就等于开始(并敲下第一下),不用先点一下遮罩。
    if (!started) { if (pk >= 0 || e.key === ' ') { e.preventDefault(); if (pk >= 0) flashKey(e.key); start(); } return; }
    if (document.activeElement === cv) return;   // 画布自己那份 keydown 已经处理过了,避免敲一下算两下
    if (pk >= 0) { flashKey(e.key); hitAt(pk === 0 ? W / 4 : W * 3 / 4, Hh / 2, pk); }
  });
  root.querySelectorAll('.bt-chip[data-m]').forEach(function (b) {
    b.addEventListener('click', function () {
      mode = b.dataset.m;
      root.querySelectorAll('.bt-chip[data-m]').forEach(function (x) { x.classList.toggle('active', x === b); });
      if (!started) { paintStats(); return; }
      if (mode === 'beat') startLoop(); else stopLoop();
      resetStats(); paintStats();
    });
  });
  root.querySelector('#tmpl').addEventListener('click', function () {
    tmplIdx = (tmplIdx + 1) % TEMPLATES.length;
    root.querySelector('#tmpl').textContent = '伴奏:' + TEMPLATES[tmplIdx].name;
    resetStats();
    if (mode === 'beat' && started) startLoop();
    paintStats();
  });
  root.querySelector('#duo').addEventListener('click', function () {
    duo = !duo;
    root.querySelector('#duo').textContent = '双人模式:' + (duo ? '开' : '关');
    resetStats(); paintKbd(); paintStats();
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
    var totalHits = P[0].hits + P[1].hits;
    var bars = Math.max(12, Math.min(64, totalHits || 12));
    pg.globalCompositeOperation = 'lighter';
    for (var i = 0; i < bars; i++) {
      var h = 60 + 320 * Math.abs(Math.sin(i * 0.7 + totalHits * 0.11));
      pg.fillStyle = 'hsla(' + ((hueBase + i * 22) % 360) + ',85%,60%,.75)';
      var bw = (pw - 160) / bars;
      pg.fillRect(80 + i * bw, ph - 420 - h, Math.max(4, bw - 6), h);
    }
    pg.globalCompositeOperation = 'source-over';
    pg.fillStyle = '#fff'; pg.textBaseline = 'top';
    pg.font = '700 92px "Geist", -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    pg.fillText(duo ? ('左边 ' + P[0].hits + ' 下 · 右边 ' + P[1].hits + ' 下') : ('我敲了 ' + P[0].hits + ' 下'), 80, 150);
    pg.font = '500 40px "Geist", -apple-system, "PingFang SC", sans-serif';
    pg.fillStyle = 'rgba(255,255,255,.8)';
    var subLine = mode === 'beat'
      ? ('跟拍 · ' + TEMPLATES[tmplIdx].name + ' ' + bpm + ' BPM · 最长连击 ' + (duo ? (P[0].best + ' / ' + P[1].best) : P[0].best))
      : ('自由敲 · ' + TEMPLATES[tmplIdx].name + ' · 怎么敲都不会难听');
    pg.fillText(subLine, 80, 280);
    // 双人打拍子:分享图上给"左右对比 + 胜负",而不只是两个连击数字(调研:分享要能讲故事、能炫)
    if (duo && mode === 'beat') {
      var a0 = accOf(P[0]), a1 = accOf(P[1]);
      if (a0 !== null && a1 !== null) {
        var gg0 = gradeOf(P[0]), gg1 = gradeOf(P[1]);
        pg.font = '600 46px "Geist", -apple-system, "PingFang SC", sans-serif';
        pg.fillStyle = '#8cc0ff';
        pg.fillText('左手 ' + (gg0 ? gg0.g : '—') + ' · 准确率 ' + a0 + '%', 80, 352);
        pg.fillStyle = '#e8a06a';
        pg.fillText('右手 ' + (gg1 ? gg1.g : '—') + ' · 准确率 ' + a1 + '%', 80, 414);
        pg.fillStyle = 'rgba(255,255,255,.92)';
        pg.font = '700 44px "Geist", -apple-system, "PingFang SC", sans-serif';
        pg.fillText(a0 === a1 ? '打平' : (a0 > a1 ? '左边更稳' : '右边更稳'), 80, 486);
      }
    }
    pg.fillStyle = 'rgba(255,255,255,.55)';
    pg.font = '500 34px "Geist", -apple-system, "PingFang SC", sans-serif';
    pg.fillText('gongjuhe.top/beat-toy · 声音与画面全部在本机生成', 80, ph - 120);
    if (qrImg) {
      // 二维码往上挪 60px:原来它和底部落款在同一水平线上,"扫码玩一个你的"和落款挤在一起/相互压字
      // (导出图里一眼看出来的排版缺陷 —— 分享图是拉新入口,不能糊)
      var qs = qrImg.width, qx = pw - qs - 88, qy = ph - qs - 210;
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
      if (chk.ok) H.downloadBlob(blob, '节奏玩具-' + totalHits + '下' + (duo ? '-双人' : '') + '.png');
      out.innerHTML = '<div class="note ' + (chk.ok ? 'ok' : 'err') + '" style="display:block">'
        + (chk.ok ? '已导出 ' + chk.width + ' × ' + chk.height + ' · ' + H.fmt(chk.bytes) + '(自检 ✓)' : '自检没通过:' + H.esc(chk.error)) + '</div>';
    }, 'image/png');
  });

  paintStats();
  if (reduce) out.innerHTML = '<div class="note" style="display:block">检测到系统开启了「减少动态效果」:粒子数量已自动减少,背景不再呼吸。</div>';
}
