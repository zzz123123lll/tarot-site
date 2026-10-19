// tools/beat-toy.mjs — 节奏标本:上传自己的歌,本地测速/找点,自动生成四轨谱面。
// 纯本地:音频不离开浏览器;无后端、无版权曲库;可换皮肤、可导出标本卡。
export function mount(root, H) {
  H.injectCss(`
    .tool-container{max-width:1080px}
    .bs-wrap{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:22px;align-items:start}
    .bs-wrap [hidden]{display:none !important}
    @media (max-width:980px){.bs-wrap{grid-template-columns:1fr}}
    .bs-stage{position:relative;border-radius:18px;overflow:hidden;background:#0b0d12;box-shadow:var(--sh-3);aspect-ratio:3/2}
    .bs-stage canvas{display:block;width:100%;height:100%;touch-action:none}
    .bs-hud{position:absolute;left:0;right:0;top:0;display:flex;gap:18px;align-items:center;padding:12px 16px;color:#fff;font-size:13px;background:rgba(0,0,0,.28);backdrop-filter:blur(4px);pointer-events:none}
    .bs-hud b{font-variant-numeric:tabular-nums;font-size:18px;font-weight:700}
    .bs-hud .bs-combo{color:#ffd447}
    .bs-hud .bs-right{margin-left:auto;opacity:.8}
    .bs-veil{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;background:rgba(8,10,16,.74);color:#fff;backdrop-filter:blur(6px);z-index:2}
    .bs-veil[hidden]{display:none}
    .bs-veil-inner{max-width:440px}
    .bs-veil h2{margin:0 0 10px;font-size:clamp(22px,3vw,34px);letter-spacing:-.02em}
    .bs-veil p{margin:0 0 18px;color:rgba(255,255,255,.74);font-size:14px;line-height:1.7}
    .bs-veil .bs-big{min-height:52px;padding:0 26px;border:0;border-radius:999px;background:#fff;color:#111;font-size:16px;font-weight:700;cursor:pointer}
    .bs-count{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:4;pointer-events:none;color:#fff;font-size:clamp(72px,12vw,150px);font-weight:800;letter-spacing:-.06em;text-shadow:0 8px 40px rgba(0,0,0,.55)}
    .bs-count[hidden]{display:none}
    .bs-settings{display:grid;gap:10px;margin-top:14px;padding:12px 14px;background:#fff;border:1px solid var(--c-hairline);border-radius:12px}
    .bs-setrow{display:grid;grid-template-columns:64px minmax(0,1fr) 48px;gap:8px;align-items:center;font-size:12px;color:#6e6e73}
    .bs-setrow input[type=range]{width:100%;accent-color:var(--c-accent)}
    .bs-setrow b{text-align:right;font-variant-numeric:tabular-nums;color:#1d1d1f}
    .bs-best{margin-top:10px;font-size:12px;color:#6e6e73;line-height:1.6}
    .bs-best b{color:var(--c-accent)}
    .bs-side{background:var(--t-surface);border-radius:16px;padding:16px}
    .bs-side h3{margin:0 0 8px;font-size:16px}
    .bs-side p{margin:0 0 10px;color:#6e6e73;font-size:13px;line-height:1.65}
    .bs-drop{border:1.5px dashed var(--c-line-strong);border-radius:14px;padding:18px 14px;text-align:center;background:#fff}
    .bs-drop strong{display:block;font-size:15px;margin-bottom:6px}
    .bs-drop span{display:block;color:#86868b;font-size:12px;line-height:1.6}
    .bs-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
    .bs-chip{min-height:40px;padding:0 13px;border-radius:999px;border:1px solid var(--c-line-strong);background:#fff;color:#1d1d1f;font-size:13px;cursor:pointer}
    .bs-chip.active{background:var(--c-accent);border-color:var(--c-accent);color:#fff}
    .bs-chip:disabled{opacity:.45;cursor:not-allowed}
    .bs-btn{min-height:46px;padding:0 18px;border:0;border-radius:10px;background:var(--c-accent);color:#fff;font-size:15px;font-weight:600;cursor:pointer}
    .bs-btn--ghost{background:#fff;color:#1d1d1f;border:1px solid var(--c-line-strong)}
    .bs-btn:disabled{opacity:.45;cursor:not-allowed}
    .bs-meta{margin-top:12px;padding:12px 14px;border-radius:12px;background:#fff;border:1px solid var(--c-hairline);font-size:13px;line-height:1.85}
    .bs-meta b{font-variant-numeric:tabular-nums}
    .bs-label{display:block;font-size:12px;color:#86868b;margin:10px 0 6px}
    .bs-file{display:none}
    .bs-status{font-size:12px;color:#6e6e73;margin-top:8px;line-height:1.6;min-height:16px}
    .bs-result{text-align:center}
    .bs-grade{font-size:64px;line-height:1;font-weight:800;letter-spacing:-.06em;color:var(--c-accent);margin:6px 0 8px}
    .bs-stat{display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;margin:12px 0;font-size:13px;text-align:left}
    .bs-stat span{color:#6e6e73}
    .bs-stat b{float:right;font-variant-numeric:tabular-nums}
    .bs-tip{font-size:12px;color:#86868b;line-height:1.7;margin-top:10px}
    .bs-keys{display:flex;gap:6px;justify-content:center;margin-top:10px}
    .bs-keys kbd{min-width:40px;min-height:40px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--c-line-strong);border-radius:8px;background:#fff;font-size:13px;color:#6e6e73}
    .bs-keys kbd.on{background:var(--c-accent);border-color:var(--c-accent);color:#fff}
  `);

  root.innerHTML = `
    <h1 class="tool-h1">节奏标本</h1>
    <p class="tool-sub">上传自己的歌，浏览器本地测速、找节拍点，自动生成四轨谱面；也可以先用示例节拍试玩。音频不离开这台电脑，不上传、不用版权曲库。</p>
    <div class="bs-wrap">
      <div>
        <div class="bs-stage">
          <canvas id="bsCv" width="960" height="640" aria-label="节奏标本游戏画面"></canvas>
          <div class="bs-count" id="bsCount" hidden>3</div>
          <div class="bs-hud" id="bsHud" hidden>
            <span>分数 <b id="bsScore">0</b></span>
            <span class="bs-combo">连击 <b id="bsCombo">0</b></span>
            <span>准确率 <b id="bsAcc">--</b></span>
            <span class="bs-right" id="bsProgress"></span>
          </div>
          <div class="bs-veil" id="bsVeil">
            <div class="bs-veil-inner">
              <h2 id="bsVeilTitle">先把一首歌放进来</h2>
              <p id="bsVeilText">拖入 MP3 / WAV / M4A / OGG，或先用示例节拍。文件只在你的浏览器里解码，不会上传。</p>
              <button class="bs-big" id="bsVeilBtn" type="button">选择音乐</button>
            </div>
          </div>
        </div>
        <div class="bs-row" id="bsPlayRow" hidden>
          <button class="bs-chip" id="bsPause" type="button">暂停</button>
          <button class="bs-chip" id="bsQuit" type="button">退出本局</button>
          <span class="bs-tip" style="align-self:center">键盘 D F J K / 触摸左右四区；先点击画面再开始。</span>
        </div>
      </div>
      <aside class="bs-side">
        <div id="bsPanelUpload">
          <h3>上传一首歌</h3>
          <p>本地解码与分析，音频不上传。建议 8 分钟内、30MB 以内；分析大约 1–3 秒。</p>
          <div class="bs-drop">
            <strong>拖入音频文件</strong>
            <span>MP3 / WAV / M4A / OGG</span>
            <div class="bs-row" style="justify-content:center">
              <button class="bs-btn" id="bsPick" type="button">选择文件</button>
              <button class="bs-btn bs-btn--ghost" id="bsDemo" type="button">示例节拍</button>
            </div>
          </div>
          <input class="bs-file" id="bsFile" type="file" accept="audio/*">
          <div class="bs-status" id="bsStatus"></div>
        </div>

        <div id="bsPanelConfig" hidden>
          <h3 id="bsSongName">—</h3>
          <div class="bs-meta" id="bsMeta"></div>
          <span class="bs-label">难度</span>
          <div class="bs-row" id="bsDiff">
            <button class="bs-chip" data-diff="easy" type="button">Easy</button>
            <button class="bs-chip active" data-diff="normal" type="button">Normal</button>
            <button class="bs-chip" data-diff="hard" type="button">Hard</button>
          </div>
          <span class="bs-label">美术皮肤</span>
          <div class="bs-row" id="bsSkins">
            <button class="bs-chip active" data-skin="herbarium" type="button">标本室</button>
            <button class="bs-chip" data-skin="nocturne" type="button">夜航</button>
            <button class="bs-chip" data-skin="papercut" type="button">剪纸</button>
            <button class="bs-chip" data-skin="custom" type="button">自定义</button>
          </div>
          <input class="bs-file" id="bsSkinFile" type="file" accept="image/*">
          <div class="bs-row" id="bsSkinTools" hidden>
            <button class="bs-chip" id="bsCustomPick" type="button">选择底图</button>
            <button class="bs-chip" id="bsCustomClear" type="button">清除底图</button>
          </div>
          <span class="bs-label">BPM（自动检测，可手动改显示）</span>
          <input class="bs-input" id="bsBpm" type="number" min="60" max="200" step="0.5" style="width:100%;min-height:42px;border:1px solid var(--c-line-strong);border-radius:10px;padding:0 12px;font-size:15px">
          <div class="bs-settings">
            <div class="bs-setrow"><span>速度</span><input id="bsSpeed" type="range" min="0.7" max="1.5" step="0.05" value="1"><b id="bsSpeedVal">1.0×</b></div>
            <div class="bs-setrow"><span>谱面密度</span><input id="bsDensity" type="range" min="0.6" max="1.4" step="0.05" value="1"><b id="bsDensityVal">100%</b></div>
            <div class="bs-setrow"><span>延迟补偿</span><input id="bsOffset" type="range" min="-150" max="150" step="5" value="0"><b id="bsOffsetVal">0ms</b></div>
            <div class="bs-setrow"><span>音量</span><input id="bsVolume" type="range" min="0" max="1" step="0.05" value="0.9"><b id="bsVolumeVal">90%</b></div>
          </div>
          <p class="bs-best" id="bsBest"></p>
          <p class="bs-tip" style="margin-top:8px">延迟补偿：如果总觉得音符比鼓点早，就往右调；设置会自动记住，先试一局再微调。</p>
          <div class="bs-row" style="margin-top:14px">
            <button class="bs-btn" id="bsStart" type="button">开始</button>
            <button class="bs-btn bs-btn--ghost" id="bsBack" type="button">换一首</button>
          </div>
          <p class="bs-tip">自动谱面是启发式生成的：副歌会更密，长音会变成可点的点。觉得太密就选 Easy。</p>
        </div>

        <div id="bsPanelResult" hidden>
          <h3>本局标本</h3>
          <div class="bs-result">
            <div class="bs-grade" id="bsGrade">A</div>
            <div class="bs-stat" id="bsStat"></div>
          </div>
          <div class="bs-row">
            <button class="bs-btn" id="bsExport" type="button">导出标本卡</button>
            <button class="bs-btn bs-btn--ghost" id="bsReplay" type="button">再玩一次</button>
          </div>
          <div class="bs-row">
            <button class="bs-chip" id="bsNew" type="button">换一首歌</button>
          </div>
        </div>

        <div id="bsPanelPlay" hidden>
          <h3>正在游玩</h3>
          <div class="bs-meta" id="bsPlayMeta"></div>
          <p>键盘 D F J K / 触摸四区。副歌会更密；觉得太难，下一局选 Easy。</p>
        </div>
      </aside>
    </div>
  `;

  var cv = root.querySelector('#bsCv'), g = cv.getContext('2d');
  var W = cv.width, Hh = cv.height;
  var veil = root.querySelector('#bsVeil'), veilTitle = root.querySelector('#bsVeilTitle'), veilText = root.querySelector('#bsVeilText'), veilBtn = root.querySelector('#bsVeilBtn');
  var hud = root.querySelector('#bsHud'), scoreEl = root.querySelector('#bsScore'), comboEl = root.querySelector('#bsCombo'), accEl = root.querySelector('#bsAcc'), progressEl = root.querySelector('#bsProgress');
  var panelUpload = root.querySelector('#bsPanelUpload'), panelConfig = root.querySelector('#bsPanelConfig'), panelResult = root.querySelector('#bsPanelResult'), panelPlay = root.querySelector('#bsPanelPlay');
  var countEl = root.querySelector('#bsCount');
  var speedEl = root.querySelector('#bsSpeed'), offsetEl = root.querySelector('#bsOffset'), volumeEl = root.querySelector('#bsVolume'), densityEl = root.querySelector('#bsDensity');
  var speedVal = root.querySelector('#bsSpeedVal'), offsetVal = root.querySelector('#bsOffsetVal'), volumeVal = root.querySelector('#bsVolumeVal'), densityVal = root.querySelector('#bsDensityVal');
  var bestEl = root.querySelector('#bsBest');
  var statusEl = root.querySelector('#bsStatus');
  var fileEl = root.querySelector('#bsFile'), skinFileEl = root.querySelector('#bsSkinFile');

  var ac = null, master = null;
  var S = {
    buffer: null, fileName: '', duration: 0, bpm: 120, peaks: [], notes: [],
    difficulty: 'normal', skin: 'herbarium',
    customImage: null, palette: null,
    playing: false, paused: false, startAt: 0, source: null, raf: 0,
    score: 0, combo: 0, maxCombo: 0, accSum: 0, total: 0,
    hits: { perfect: 0, great: 0, good: 0, miss: 0 }, hitFx: [],
    songsPlayed: 0,
    speed: 1, offset: 0, volume: 0.9, density: 1,
    countdownTimer: 0, newBest: false
  };
  var SKIN_NAMES = { herbarium: '标本室', nocturne: '夜航', papercut: '剪纸', custom: '自定义' };
  var DIFF_MIN = { easy: 0.24, normal: 0.14, hard: 0.085 };
  var DIFF_KEEP = { easy: 0.55, normal: 0.8, hard: 1 };

  function ensureAudio() {
    if (!ac) {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) throw new Error('这个浏览器不支持 Web Audio');
      ac = new Ctx();
      master = ac.createGain(); master.gain.value = S.volume; master.connect(ac.destination);
    }
    if (ac.state === 'suspended' && ac.resume) ac.resume();
    return ac;
  }

  function loadSettings() {
    try {
      var raw = localStorage.getItem('gjh-beat-settings-v1');
      if (!raw) return;
      var d = JSON.parse(raw);
      if (d.speed >= 0.7 && d.speed <= 1.5) S.speed = d.speed;
      if (d.offset >= -150 && d.offset <= 150) S.offset = d.offset;
      if (d.volume >= 0 && d.volume <= 1) S.volume = d.volume;
      if (d.density >= 0.6 && d.density <= 1.4) S.density = d.density;
    } catch (e) {}
  }
  function saveSettings() {
    try { localStorage.setItem('gjh-beat-settings-v1', JSON.stringify({ speed: S.speed, offset: S.offset, volume: S.volume, density: S.density })); } catch (e) {}
  }
  function syncSettingsUI() {
    speedEl.value = S.speed; offsetEl.value = S.offset; volumeEl.value = S.volume; densityEl.value = S.density;
    speedVal.textContent = S.speed.toFixed(2).replace(/0$/, '') + '×';
    offsetVal.textContent = (S.offset > 0 ? '+' : '') + S.offset + 'ms';
    volumeVal.textContent = Math.round(S.volume * 100) + '%';
    densityVal.textContent = Math.round(S.density * 100) + '%';
    if (master) master.gain.value = S.volume;
  }

  function bestStore() {
    try { return JSON.parse(localStorage.getItem('gjh-beat-best-v1') || '{}') || {}; } catch (e) { return {}; }
  }
  function bestKey() {
    return hashStr((S.fileName || '') + '|' + S.total + '|' + Math.round(S.bpm)) + '|' + S.difficulty;
  }
  function showBest() {
    if (!S.total) { bestEl.textContent = ''; return; }
    var b = bestStore()[bestKey()];
    bestEl.innerHTML = b
      ? '本曲最佳：<b>' + b.grade + '</b> · ' + b.acc.toFixed(1) + '% · 最大连击 ' + b.combo
      : '本曲暂无记录。打完一局会自动存在这台设备上（不上传）。';
  }
  function saveBest(acc, grade) {
    var store = bestStore(), key = bestKey(), old = store[key];
    if (!old || acc > old.acc) {
      store[key] = { acc: acc, grade: grade, combo: S.maxCombo, at: Date.now() };
      try { localStorage.setItem('gjh-beat-best-v1', JSON.stringify(store)); } catch (e) {}
      S.newBest = true;
    }
    showBest();
  }

  function hashStr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function fmtTime(s) {
    s = Math.max(0, s || 0);
    var m = Math.floor(s / 60), ss = Math.floor(s % 60);
    return m + ':' + String(ss).padStart(2, '0');
  }

  /* ---------- analysis ---------- */
  function analyze(buffer) {
    var sr = buffer.sampleRate;
    var ch = buffer.numberOfChannels;
    var maxLen = Math.min(buffer.length, Math.floor(sr * 480));
    var mono = new Float32Array(maxLen);
    for (var c = 0; c < ch; c++) {
      var data = buffer.getChannelData(c);
      for (var i = 0; i < maxLen; i++) mono[i] += data[i] / ch;
    }
    var step = Math.max(1, Math.floor(sr / 22050));
    var dsr = sr / step;
    var frame = Math.round(dsr * 0.046);
    var hop = Math.max(128, Math.round(frame / 2));
    var frames = Math.max(1, Math.floor((maxLen / step - frame) / hop));
    var nrg = new Float32Array(frames), low = new Float32Array(frames), high = new Float32Array(frames);
    var rc = 1 / (2 * Math.PI * 180);
    var a = 1 / (1 + rc * dsr);
    var lp = 0;
    for (var f = 0; f < frames; f++) {
      var start = f * hop;
      var e = 0, l = 0, h = 0;
      for (var j = 0; j < frame; j += 2) {
        var x = mono[(start + j) * step];
        lp += a * (x - lp);
        var hx = x - lp;
        e += x * x; l += lp * lp; h += hx * hx;
      }
      nrg[f] = e; low[f] = l; high[f] = h;
    }
    var onset = new Float32Array(frames);
    var maxO = 0;
    for (var k = 1; k < frames; k++) {
      var v = Math.max(0, nrg[k] - nrg[k - 1]) + 0.6 * Math.max(0, low[k] - low[k - 1]) + 0.6 * Math.max(0, high[k] - high[k - 1]);
      onset[k] = v;
      if (v > maxO) maxO = v;
    }
    if (maxO <= 0) return { peaks: [], bpm: 120, duration: maxLen / sr };
    var peaks = [];
    var lastT = -9;
    for (var q = 2; q < frames - 2; q++) {
      if (onset[q] <= onset[q - 1] || onset[q] < onset[q + 1]) continue;
      var local = 0, n = 0;
      for (var w = -10; w <= 10; w++) { var idx = q + w; if (idx >= 0 && idx < frames) { local += onset[idx]; n++; } }
      local /= Math.max(1, n);
      if (onset[q] < local * 1.35 + maxO * 0.035) continue;
      var t = (q * hop + frame / 2) / dsr;
      if (t - lastT < 0.085) continue;
      var totalBand = low[q] + high[q] + 1e-9;
      peaks.push({ t: t, strength: onset[q] / maxO, lowRatio: low[q] / totalBand });
      lastT = t;
    }
    var bpm = estimateBpm(onset, dsr, hop);
    return { peaks: peaks, bpm: bpm, duration: maxLen / sr };
  }

  function estimateBpm(onset, dsr, hop) {
    var hopT = hop / dsr;
    var best = 0, bestBpm = 120;
    for (var bpm = 70; bpm <= 190; bpm += 0.5) {
      var lag = 60 / bpm / hopT;
      var score = 0;
      for (var k = 1; k <= 8; k++) {
        var idx = Math.round(lag * k);
        if (idx > 0 && idx < onset.length) score += onset[idx] * (1 - k * 0.035);
      }
      if (score > best) { best = score; bestBpm = bpm; }
    }
    // 倾向于 80–170 的常见区间,避免半速/倍速误判
    var candidates = [bestBpm, bestBpm * 2, bestBpm / 2].filter(function (b) { return b >= 70 && b <= 190; });
    var final = bestBpm;
    var bestScore = -1;
    candidates.forEach(function (b) {
      var lag = 60 / b / hopT;
      var score = 0;
      for (var k = 1; k <= 8; k++) {
        var idx = Math.round(lag * k);
        if (idx > 0 && idx < onset.length) score += onset[idx];
      }
      if (score > bestScore) { bestScore = score; final = b; }
    });
    return Math.round(final * 10) / 10;
  }

  function buildChart() {
    var keep = Math.min(1, Math.max(0.25, DIFF_KEEP[S.difficulty] * S.density));
    var minGap = DIFF_MIN[S.difficulty];
    var src = S.peaks.slice().sort(function (a, b) { return b.strength - a.strength; });
    src = src.slice(0, Math.max(12, Math.round(src.length * keep))).sort(function (a, b) { return a.t - b.t; });
    var notes = [], lastT = -9, lastLane = -1, streak = 0;
    src.forEach(function (p, i) {
      if (p.t - lastT < minGap) return;
      var lane;
      if (p.lowRatio > 0.62) lane = 0;
      else if (p.lowRatio < 0.38) lane = 3;
      else lane = i % 2 === 0 ? 1 : 2;
      if (lane === lastLane) streak++; else streak = 0;
      if (streak >= 2) { lane = (lane + 1) % 4; streak = 0; }
      notes.push({ t: p.t, lane: lane, judged: false, hit: false, grade: '' });
      lastT = p.t; lastLane = lane;
    });
    if (notes.length < 8) {
      notes = S.peaks.slice(0, 120).map(function (p, i) {
        return { t: p.t, lane: i % 4, judged: false, hit: false, grade: '' };
      });
    }
    S.notes = notes;
    S.total = notes.length;
  }

  function makeDemoBuffer() {
    ensureAudio();
    var sr = 44100, dur = 24;
    var buf = ac.createBuffer(1, sr * dur, sr);
    var d = buf.getChannelData(0);
    var rnd = rng(1234567);
    for (var i = 0; i < d.length; i++) {
      var t = i / sr;
      var beat = t % 0.5;
      var eighth = t % 0.25;
      var kick = Math.exp(-beat * 26) * Math.sin(2 * Math.PI * 55 * beat);
      var hat = eighth < 0.025 ? (rnd() * 2 - 1) * Math.exp(-eighth * 90) * 0.35 : 0;
      var snare = (t % 2 > 0.95 && t % 2 < 1.02) ? (rnd() * 2 - 1) * Math.exp(-(t % 2 - 0.95) * 40) * 0.3 : 0;
      var bass = Math.sin(2 * Math.PI * 110 * beat) * Math.exp(-beat * 10) * 0.18;
      d[i] = Math.max(-1, Math.min(1, kick * 0.8 + hat + snare + bass));
    }
    return buf;
  }

  /* ---------- game ---------- */
  function now() { return ac ? ac.currentTime - S.startAt - (S.offset / 1000) : 0; }

  function drawBackground() {
    var skin = S.skin;
    if (skin === 'custom' && S.customImage) {
      var img = S.customImage;
      var scale = Math.max(W / img.width, Hh / img.height);
      var iw = img.width * scale, ih = img.height * scale;
      g.save();
      g.filter = 'blur(2px) brightness(.55) saturate(.9)';
      g.drawImage(img, (W - iw) / 2, (Hh - ih) / 2, iw, ih);
      g.restore();
      g.fillStyle = 'rgba(8,10,16,.28)';
      g.fillRect(0, 0, W, Hh);
      return;
    }
    if (skin === 'nocturne') {
      var grad = g.createLinearGradient(0, 0, 0, Hh);
      grad.addColorStop(0, '#070A18');
      grad.addColorStop(1, '#0B1220');
      g.fillStyle = grad; g.fillRect(0, 0, W, Hh);
      var r = rng(99);
      for (var i = 0; i < 80; i++) {
        g.fillStyle = 'rgba(255,255,255,' + (0.12 + r() * 0.4) + ')';
        g.beginPath(); g.arc(r() * W, r() * Hh * 0.8, r() * 1.4 + 0.4, 0, Math.PI * 2); g.fill();
      }
      return;
    }
    if (skin === 'papercut') {
      g.fillStyle = '#F1EEE4'; g.fillRect(0, 0, W, Hh);
      return;
    }
    g.fillStyle = '#E7EBE1'; g.fillRect(0, 0, W, Hh);
    g.strokeStyle = 'rgba(30,42,34,.08)'; g.lineWidth = 1;
    for (var x = 0; x < W; x += 34) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, Hh); g.stroke(); }
    for (var y = 0; y < Hh; y += 34) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  }

  function laneX(lane) {
    var left = 110, right = W - 110;
    var w = (right - left) / 4;
    return left + w * lane + w / 2;
  }
  function laneColor(lane) {
    if (S.skin === 'nocturne') return ['#D7FF3F', '#7EEBFF', '#FF8BE0', '#FFD447'][lane];
    if (S.skin === 'papercut') return ['#D8232A', '#1F4FA0', '#D9A441', '#1E2A22'][lane];
    if (S.skin === 'custom' && S.palette && S.palette[lane]) return S.palette[lane];
    return ['#2F4B7C', '#B4552D', '#5F6B5F', '#D9A441'][lane];
  }

  function drawIdle() {
    drawBackground();
    g.fillStyle = S.skin === 'nocturne' ? 'rgba(255,255,255,.9)' : 'rgba(30,42,34,.72)';
    g.font = '600 34px Georgia,"Songti SC","SimSun",serif';
    g.textAlign = 'center';
    g.fillText('节奏标本', W / 2, Hh / 2 - 8);
    g.font = '14px "Segoe UI","PingFang SC","Microsoft YaHei",sans-serif';
    g.fillText('上传一首歌，把它的节拍做成一张谱', W / 2, Hh / 2 + 26);
    g.textAlign = 'left';
  }

  function drawGame() {
    drawBackground();
    var t = now();
    var approach = 2.0 / S.speed;
    var judgeY = Hh * 0.76;
    var topY = -40;
    var left = 110, right = W - 110;
    var laneW = (right - left) / 4;

    // lanes
    for (var i = 0; i < 4; i++) {
      var x = left + i * laneW;
      if (S.skin === 'herbarium') {
        g.fillStyle = i % 2 ? 'rgba(247,246,239,.42)' : 'rgba(247,246,239,.62)';
      } else if (S.skin === 'papercut') {
        g.fillStyle = i % 2 ? 'rgba(216,35,42,.10)' : 'rgba(31,79,160,.10)';
      } else {
        g.fillStyle = i % 2 ? 'rgba(255,255,255,.035)' : 'rgba(255,255,255,.06)';
      }
      g.fillRect(x, 0, laneW, Hh);
      g.strokeStyle = S.skin === 'nocturne' ? 'rgba(255,255,255,.08)' : 'rgba(30,42,34,.10)';
      g.lineWidth = 1;
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x, Hh); g.stroke();
    }

    // judgment line
    g.strokeStyle = S.skin === 'nocturne' ? '#D7FF3F' : S.skin === 'papercut' ? '#111' : '#2F4B7C';
    g.lineWidth = 3;
    g.beginPath(); g.moveTo(left, judgeY); g.lineTo(right, judgeY); g.stroke();

    // notes
    S.notes.forEach(function (n) {
      if (n.judged) return;
      var dt = n.t - t;
      if (dt > approach || dt < -0.22) return;
      var y = judgeY - (dt / approach) * (judgeY - topY);
      var x = laneX(n.lane);
      var color = laneColor(n.lane);
      if (S.skin === 'nocturne') {
        var grd = g.createRadialGradient(x, y, 0, x, y, 26);
        grd.addColorStop(0, color);
        grd.addColorStop(0.25, color + '99');
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grd;
        g.beginPath(); g.arc(x, y, 26, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#fff';
        g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill();
      } else if (S.skin === 'papercut') {
        g.fillStyle = 'rgba(0,0,0,.25)';
        g.fillRect(x - 44, y - 10, 88, 22);
        g.fillStyle = color;
        g.fillRect(x - 46, y - 12, 88, 22);
      } else {
        g.fillStyle = color;
        g.beginPath();
        if (g.roundRect) g.roundRect(x - 44, y - 11, 88, 22, 11);
        else g.rect(x - 44, y - 11, 88, 22);
        g.fill();
        g.fillStyle = 'rgba(255,255,255,.8)';
        g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill();
      }
    });

    // hit effects
    S.hitFx = S.hitFx.filter(function (fx) { return t - fx.t < 0.35; });
    g.textAlign = 'center';
    S.hitFx.forEach(function (fx) {
      var age = (t - fx.t) / 0.35;
      g.strokeStyle = 'rgba(217,164,65,' + (1 - age) + ')';
      g.lineWidth = 3;
      g.beginPath(); g.arc(laneX(fx.lane), judgeY, 18 + age * 42, 0, Math.PI * 2); g.stroke();
      g.fillStyle = fx.grade === 'perfect' ? '#D9A441' : fx.grade === 'great' ? '#2F4B7C' : '#5F6B5F';
      g.globalAlpha = 1 - age;
      g.font = '600 15px "Segoe UI","PingFang SC",sans-serif';
      g.fillText(fx.grade === 'perfect' ? 'PERFECT' : fx.grade === 'great' ? 'GREAT' : 'GOOD', laneX(fx.lane), judgeY - 34 - age * 22);
      g.globalAlpha = 1;
    });
    g.textAlign = 'left';

    // key labels
    g.textAlign = 'center';
    g.font = '13px "Segoe UI","PingFang SC","Microsoft YaHei",sans-serif';
    for (var k = 0; k < 4; k++) {
      g.fillStyle = S.skin === 'nocturne' ? 'rgba(255,255,255,.45)' : 'rgba(30,42,34,.42)';
      g.fillText(['D', 'F', 'J', 'K'][k], laneX(k), Hh - 24);
    }
    g.textAlign = 'left';

    // progress
    if (S.total) {
      var done = S.hits.perfect + S.hits.great + S.hits.good + S.hits.miss;
      var pct = Math.min(100, Math.round(done / S.total * 100));
      progressEl.textContent = pct + '%';
    }
  }

  function render() {
    if (S.playing || S.paused) drawGame();
    else if (S.buffer) drawIdle();
    else drawIdle();
    S.raf = requestAnimationFrame(render);
  }

  function updateHud() {
    scoreEl.textContent = S.score;
    comboEl.textContent = S.combo;
    if (S.total) {
      var acc = (S.accSum / S.total) * 100;
      accEl.textContent = (acc >= 100 ? 100 : acc).toFixed(1) + '%';
    } else {
      accEl.textContent = '--';
    }
  }

  function judge(lane) {
    if (!S.playing || S.paused) return;
    var t = now();
    var best = null, bestD = 1;
    S.notes.forEach(function (n) {
      if (n.judged || n.lane !== lane) return;
      var d = Math.abs(n.t - t);
      if (d < 0.16 && d < bestD) { best = n; bestD = d; }
    });
    if (!best) return;
    best.judged = true;
    best.hit = true;
    var grade, weight;
    if (bestD <= 0.045) { grade = 'perfect'; weight = 1; }
    else if (bestD <= 0.09) { grade = 'great'; weight = 0.72; }
    else { grade = 'good'; weight = 0.4; }
    best.grade = grade;
    S.hits[grade]++;
    S.combo++; if (S.combo > S.maxCombo) S.maxCombo = S.combo;
    S.score += Math.round(weight * 1000 + Math.max(0, S.combo - 1) * 8);
    S.accSum += weight;
    S.hitFx.push({ lane: lane, t: t, grade: grade });
    updateHud();
  }

  function checkMiss(t) {
    var changed = false;
    S.notes.forEach(function (n) {
      if (!n.judged && n.t < t - 0.16) {
        n.judged = true; n.hit = false; n.grade = 'miss';
        S.hits.miss++; S.combo = 0; changed = true;
      }
    });
    if (changed) updateHud();
  }

  function finishGame() {
    if (!S.playing) return;
    if (S.countdownTimer) { clearInterval(S.countdownTimer); S.countdownTimer = 0; }
    countEl.hidden = true;
    S.notes.forEach(function (n) { if (!n.judged) { n.judged = true; S.hits.miss++; } });
    S.playing = false; S.paused = false;
    if (S.source) { try { S.source.stop(); } catch (e) {} S.source = null; }
    S.hitFx = [];
    var acc = S.total ? (S.accSum / S.total) * 100 : 0;
    var grade = acc >= 95 ? 'S' : acc >= 85 ? 'A' : acc >= 70 ? 'B' : 'C';
    root.querySelector('#bsGrade').textContent = grade;
    root.querySelector('#bsStat').innerHTML =
      '<div><span>准确率</span><b>' + acc.toFixed(1) + '%</b></div>'
      + '<div><span>最大连击</span><b>' + S.maxCombo + '</b></div>'
      + '<div><span>Perfect</span><b>' + S.hits.perfect + '</b></div>'
      + '<div><span>Great</span><b>' + S.hits.great + '</b></div>'
      + '<div><span>Good</span><b>' + S.hits.good + '</b></div>'
      + '<div><span>Miss</span><b>' + S.hits.miss + '</b></div>';
    panelResult.hidden = false;
    panelConfig.hidden = true;
    panelPlay.hidden = true;
    root.querySelector('#bsPanelUpload').hidden = true;
    root.querySelector('#bsPlayRow').hidden = true;
    hud.hidden = false;
    updateHud();
    S.final = { grade: grade, acc: acc };
    saveBest(acc, grade);
    if (S.newBest) {
      root.querySelector('#bsStat').insertAdjacentHTML('beforeend', '<div><span>记录</span><b>NEW BEST</b></div>');
    }
    drawIdle();
  }

  function startGame() {
    if (!S.buffer || !S.notes.length) return;
    ensureAudio();
    if (ac.state === 'suspended') ac.resume();
    buildChart();
    S.score = 0; S.combo = 0; S.maxCombo = 0; S.accSum = 0;
    S.hits = { perfect: 0, great: 0, good: 0, miss: 0 };
    S.hitFx = []; S.final = null; S.playing = true; S.paused = false;
    S.source = ac.createBufferSource();
    S.source.buffer = S.buffer;
    S.source.connect(master);
    var startDelay = 3.0;
    S.startAt = ac.currentTime + startDelay;
    S.source.start(S.startAt);
    S.source.onended = function () { if (S.playing) finishGame(); };
    S.newBest = false;
    if (S.countdownTimer) clearInterval(S.countdownTimer);
    var count = 3;
    countEl.hidden = false;
    countEl.textContent = String(count);
    S.countdownTimer = setInterval(function () {
      count--;
      if (count > 0) {
        countEl.textContent = String(count);
      } else {
        countEl.textContent = 'GO';
        clearInterval(S.countdownTimer);
        S.countdownTimer = 0;
        setTimeout(function () { countEl.hidden = true; }, 420);
      }
    }, 1000);
    veil.hidden = true;
    hud.hidden = false;
    panelConfig.hidden = true;
    panelResult.hidden = true;
    panelUpload.hidden = true;
    panelPlay.hidden = false;
    root.querySelector('#bsPlayMeta').innerHTML =
      '<div>曲目 <b>' + (S.fileName || '未命名').replace(/\.[^.]+$/, '').slice(0, 26) + '</b></div>'
      + '<div>BPM <b>' + Math.round(S.bpm) + '</b> · 难度 <b>' + S.difficulty.toUpperCase() + '</b></div>'
      + '<div>皮肤 <b>' + SKIN_NAMES[S.skin] + '</b> · 音符 <b>' + S.total + '</b></div>';
    root.querySelector('#bsPlayRow').hidden = false;
    updateHud();
  }

  function stopGame(showUpload) {
    S.playing = false; S.paused = false;
    if (S.countdownTimer) { clearInterval(S.countdownTimer); S.countdownTimer = 0; }
    countEl.hidden = true;
    if (S.source) { try { S.source.stop(); } catch (e) {} S.source = null; }
    hud.hidden = true;
    root.querySelector('#bsPlayRow').hidden = true;
    panelResult.hidden = true;
    panelPlay.hidden = true;
    panelConfig.hidden = false;
    root.querySelector('#bsPanelUpload').hidden = true;
    veil.hidden = true;
    if (ac && ac.state === 'suspended') ac.resume();
    drawIdle();
    veilBtn.textContent = '选择音乐';
    veilHandler = function () { file.click(); };
    if (showUpload) { panelConfig.hidden = true; veil.hidden = false; veilTitle.textContent = '再放一首歌'; veilText.textContent = '拖入音频，或先用示例节拍。'; }
  }

  function updateMeta() {
    root.querySelector('#bsSongName').textContent = S.fileName || '未命名';
    var bpm = Math.round(S.bpm * 10) / 10;
    root.querySelector('#bsMeta').innerHTML =
      '<div>时长 <b>' + fmtTime(S.duration) + '</b></div>'
      + '<div>估计 BPM <b>' + bpm + '</b></div>'
      + '<div>节拍点 <b>' + S.peaks.length + '</b></div>'
      + '<div>谱面音符 <b>' + S.notes.length + '</b></div>'
      + '<div>分析范围 <b>' + fmtTime(Math.min(S.duration, 480)) + '</b></div>';
    root.querySelector('#bsBpm').value = bpm;
    showBest();
  }

  function loadBuffer(buffer, name) {
    S.buffer = buffer;
    S.fileName = name;
    S.duration = buffer.duration;
    statusEl.textContent = '正在分析节拍点…';
    return new Promise(function (resolve) {
      setTimeout(function () {
        var analysis = analyze(buffer);
        if (!analysis.peaks.length) {
          statusEl.textContent = '这段音频里没找到足够的节拍点；换一首鼓点更清楚的歌试试。';
          H.toast('没有找到足够节拍点');
          resolve(false);
          return;
        }
        S.peaks = analysis.peaks;
        S.bpm = analysis.bpm;
        buildChart();
        updateMeta();
        panelUpload.hidden = true;
        panelConfig.hidden = false;
        panelResult.hidden = true;
        panelPlay.hidden = true;
        root.querySelector('#bsPanelUpload').hidden = true;
        veil.hidden = true;
        hud.hidden = true;
        statusEl.textContent = '';
        drawIdle();
        H.toast('分析完成：' + S.notes.length + ' 个音符');
        resolve(true);
      }, 40);
    });
  }

  function openFile(file) {
    if (!file) return;
    if (!/^audio\//.test(file.type) && !/\.(mp3|wav|m4a|ogg|aac|flac)$/i.test(file.name)) {
      statusEl.textContent = '这个文件看起来不是音频，换一个 MP3 / WAV / M4A / OGG 试试。';
      return;
    }
    if (file.size > 40 * 1024 * 1024) {
      statusEl.textContent = '文件超过 40MB 了；先用 8 分钟以内的版本试试。';
      return;
    }
    statusEl.textContent = '正在解码…（文件不会离开浏览器）';
    ensureAudio();
    file.arrayBuffer().then(function (ab) {
      return ac.decodeAudioData(ab);
    }).then(function (buf) {
      if (buf.duration > 600) {
        statusEl.textContent = '这首歌超过 10 分钟；先做 10 分钟以内的版本。';
        return;
      }
      return loadBuffer(buf, file.name);
    }).catch(function () {
      statusEl.textContent = '解码失败：这个格式浏览器可能不支持，换 WAV / MP3 试试。';
    });
  }

  /* ---------- specimen card ---------- */
  function exportCard() {
    var c = document.createElement('canvas');
    c.width = 1080; c.height = 1350;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#F7F6EF'; ctx.fillRect(0, 0, 1080, 1350);
    ctx.strokeStyle = 'rgba(30,42,34,.18)'; ctx.lineWidth = 2;
    ctx.strokeRect(54, 54, 972, 1242);
    ctx.fillStyle = '#2F4B7C'; ctx.font = '600 20px Georgia,serif';
    ctx.fillText('BEAT SPECIMEN / 节奏标本', 84, 100);
    ctx.fillStyle = '#1E2A22'; ctx.font = '600 54px Georgia,"Songti SC","SimSun",serif';
    ctx.fillText((S.fileName || '未命名').replace(/\.[^.]+$/, '').slice(0, 22), 84, 170);
    ctx.fillStyle = '#5F6B5F'; ctx.font = '16px "Segoe UI","PingFang SC",sans-serif';
    ctx.fillText((S.final ? S.final.grade : '—') + ' · ' + Math.round(S.bpm) + ' BPM · ' + (DIFF_MIN[S.difficulty] ? S.difficulty.toUpperCase() : ''), 84, 206);

    // song constellation
    var panelY = 240, panelH = 620;
    ctx.fillStyle = '#070A18'; ctx.fillRect(84, panelY, 912, panelH);
    var rnd = rng(hashStr(S.fileName + S.notes.length + S.bpm));
    var pts = [];
    ctx.strokeStyle = 'rgba(217,164,65,.4)'; ctx.lineWidth = 1.4;
    for (var i = 0; i < Math.min(S.notes.length, 80); i++) {
      pts.push({ x: 120 + rnd() * 840, y: panelY + 40 + rnd() * (panelH - 80) });
    }
    pts.forEach(function (p, i) {
      if (i === 0) return;
      ctx.beginPath(); ctx.moveTo(pts[i - 1].x, pts[i - 1].y); ctx.lineTo(p.x, p.y); ctx.stroke();
    });
    pts.forEach(function (p, i) {
      var r = 2 + (i % 3);
      var grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 5);
      grd.addColorStop(0, 'rgba(243,233,216,.95)');
      grd.addColorStop(1, 'rgba(243,233,216,0)');
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(p.x, p.y, r * 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#F3E9D8'; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = 'rgba(243,233,216,.65)'; ctx.font = '14px Georgia,serif';
    ctx.fillText('这首歌的星座 · 同一首歌永远同一片星空', 108, panelY + panelH - 26);

    // stats
    ctx.fillStyle = '#1E2A22'; ctx.font = '600 26px Georgia,serif';
    ctx.fillText('本局成绩', 84, 920);
    var stats = [
      ['准确率', (S.total ? (S.accSum / S.total * 100) : 0).toFixed(1) + '%'],
      ['最大连击', S.maxCombo],
      ['Perfect', S.hits.perfect],
      ['Miss', S.hits.miss]
    ];
    ctx.font = '16px "Segoe UI","PingFang SC",sans-serif';
    stats.forEach(function (s, i) {
      var y = 960 + i * 30;
      ctx.fillStyle = '#5F6B5F'; ctx.fillText(s[0], 84, y);
      ctx.fillStyle = '#1E2A22'; ctx.fillText(String(s[1]), 300, y);
    });
    ctx.fillStyle = '#5F6B5F'; ctx.font = '14px "Segoe UI","PingFang SC",sans-serif';
    ctx.fillText('gongjuhe.top · 本卡在本地生成 · 音频没有上传', 84, 1260);
    c.toBlob(function (blob) { if (blob) H.downloadBlob(blob, '节奏标本-' + (S.fileName || '未命名').replace(/\.[^.]+$/, '') + '.png'); }, 'image/png');
    H.toast('正在导出标本卡');
  }

  /* ---------- wiring ---------- */
  var pickBtn = root.querySelector('#bsPick');
  var demoBtn = root.querySelector('#bsDemo');
  var startBtn = root.querySelector('#bsStart');
  var backBtn = root.querySelector('#bsBack');
  var file = root.querySelector('#bsFile');
  var skinFile = root.querySelector('#bsSkinFile');

  pickBtn.addEventListener('click', function () { file.click(); });
  file.addEventListener('change', function () { if (file.files[0]) openFile(file.files[0]); file.value = ''; });
  var dropZone = root.querySelector('#bsPanelUpload .bs-drop');
  ['dragenter', 'dragover'].forEach(function (ev) {
    dropZone.addEventListener(ev, function (e) { e.preventDefault(); dropZone.style.borderColor = 'var(--c-accent)'; });
  });
  ['dragleave', 'dragend'].forEach(function (ev) {
    dropZone.addEventListener(ev, function () { dropZone.style.borderColor = ''; });
  });
  dropZone.addEventListener('drop', function (e) {
    e.preventDefault();
    dropZone.style.borderColor = '';
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) openFile(e.dataTransfer.files[0]);
  });
  demoBtn.addEventListener('click', function () {
    statusEl.textContent = '正在生成示例节拍…';
    setTimeout(function () {
      loadBuffer(makeDemoBuffer(), '示例节拍 · 120 BPM');
    }, 20);
  });

  root.querySelector('#bsDiff').addEventListener('click', function (e) {
    var b = e.target.closest('.bs-chip'); if (!b) return;
    S.difficulty = b.dataset.diff;
    root.querySelectorAll('#bsDiff .bs-chip').forEach(function (x) { x.classList.toggle('active', x === b); });
    buildChart(); updateMeta(); drawIdle();
  });
  root.querySelector('#bsSkins').addEventListener('click', function (e) {
    var b = e.target.closest('.bs-chip'); if (!b) return;
    S.skin = b.dataset.skin;
    root.querySelectorAll('#bsSkins .bs-chip').forEach(function (x) { x.classList.toggle('active', x === b); });
    root.querySelector('#bsSkinTools').hidden = S.skin !== 'custom';
    if (S.skin === 'custom' && !S.customImage) skinFile.click();
    drawIdle();
  });
  root.querySelector('#bsBpm').addEventListener('change', function () {
    var v = parseFloat(this.value);
    if (v >= 60 && v <= 200) { S.bpm = v; updateMeta(); drawIdle(); }
  });
  speedEl.addEventListener('input', function () { S.speed = parseFloat(this.value) || 1; syncSettingsUI(); saveSettings(); drawIdle(); });
  offsetEl.addEventListener('input', function () { S.offset = parseInt(this.value, 10) || 0; syncSettingsUI(); saveSettings(); drawIdle(); });
  volumeEl.addEventListener('input', function () { S.volume = parseFloat(this.value); syncSettingsUI(); saveSettings(); });
  densityEl.addEventListener('input', function () {
    S.density = parseFloat(this.value) || 1;
    syncSettingsUI(); saveSettings();
    if (S.peaks.length) { buildChart(); updateMeta(); drawIdle(); }
  });
  root.querySelector('#bsCustomPick').addEventListener('click', function () { skinFile.click(); });
  root.querySelector('#bsCustomClear').addEventListener('click', function () {
    S.customImage = null; S.palette = null;
    H.toast('已清除自定义底图');
  });
  skinFile.addEventListener('change', function () {
    var f = skinFile.files[0]; if (!f) return;
    var img = new Image();
    img.onload = function () {
      S.customImage = img;
      var c = document.createElement('canvas'); c.width = 32; c.height = 32;
      var cx = c.getContext('2d'); cx.drawImage(img, 0, 0, 32, 32);
      var d = cx.getImageData(0, 0, 32, 32).data;
      var colors = [];
      for (var i = 0; i < d.length; i += 4 * 64) {
        colors.push('rgb(' + d[i] + ',' + d[i + 1] + ',' + d[i + 2] + ')');
      }
      S.palette = colors.slice(0, 4);
      S.skin = 'custom';
      root.querySelectorAll('#bsSkins .bs-chip').forEach(function (x) { x.classList.toggle('active', x.dataset.skin === 'custom'); });
      H.toast('已应用自定义底图（只在本地）');
      drawIdle();
    };
    img.src = URL.createObjectURL(f);
    skinFile.value = '';
  });

  startBtn.addEventListener('click', startGame);
  backBtn.addEventListener('click', function () { stopGame(true); });
  root.querySelector('#bsPause').addEventListener('click', function () {
    if (!S.playing || S.paused || now() < 0) return;
    if (!S.paused) {
      ac.suspend(); S.paused = true; this.textContent = '继续';
      veil.hidden = false; veilTitle.textContent = '暂停'; veilText.textContent = '点击继续，或退出本局。'; veilBtn.textContent = '继续';
      veilHandler = function () { ac.resume(); S.paused = false; veil.hidden = true; root.querySelector('#bsPause').textContent = '暂停'; };
    }
  });
  root.querySelector('#bsQuit').addEventListener('click', function () { stopGame(false); });
  root.querySelector('#bsReplay').addEventListener('click', function () { panelResult.hidden = true; startGame(); });
  root.querySelector('#bsExport').addEventListener('click', exportCard);
  root.querySelector('#bsNew').addEventListener('click', function () { stopGame(true); });
  var veilHandler = function () { file.click(); };
  veilBtn.addEventListener('click', function () { veilHandler(); });

  document.addEventListener('keydown', function (e) {
    if (!S.playing || S.paused) return;
    var k = e.key.toLowerCase();
    var lane = k === 'd' ? 0 : k === 'f' ? 1 : k === 'j' ? 2 : k === 'k' ? 3 : -1;
    if (lane >= 0) { e.preventDefault(); judge(lane); }
  });
  cv.addEventListener('pointerdown', function (e) {
    if (!S.playing || S.paused) return;
    var r = cv.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width * W;
    var left = 110, right = W - 110;
    var lane = Math.floor((x - left) / ((right - left) / 4));
    if (lane >= 0 && lane < 4) judge(lane);
  });

  // main loop
  loadSettings();
  syncSettingsUI();
  var lastCheck = 0;
  function loop() {
    if (S.playing && !S.paused) {
      var t = now();
      checkMiss(t);
      if (t > S.duration + 1 || (S.notes.length && t > S.notes[S.notes.length - 1].t + 2.2)) finishGame();
    }
    drawGameOrIdle();
    S.raf = requestAnimationFrame(loop);
  }
  function drawGameOrIdle() {
    if (S.playing || S.paused) drawGame(); else drawIdle();
  }
  loop();

  drawIdle();
}
