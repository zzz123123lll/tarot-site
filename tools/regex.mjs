// tools/regex.mjs — 正则测试（匹配高亮/替换预览，Worker 防 ReDoS）
export function mount(root, H) {
  H.injectCss(".mode-tabs{display:inline-flex;background:#f5f5f7;border-radius:10px;padding:3px;margin-bottom:16px}.mode-tabs button{flex:1;padding:7px 16px;border:none;border-radius:8px;background:transparent;color:#6e6e73;font-size:13px;font-weight:500;font-family:inherit;cursor:pointer}.mode-tabs button.active{background:#fff;color:#1d1d1f;box-shadow:0 1px 3px rgba(0,0,0,.12)}.hl mark{background:rgba(0,113,227,.15);color:#1d1d1f;border-radius:2px;padding:0 1px}.cheat{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px}.cheat button{font-size:12px;color:#6e6e73;background:#f5f5f7;border:1px solid rgba(0,0,0,.06);border-radius:999px;padding:4px 10px;cursor:pointer;font-family:inherit}.cheat button:hover{color:#0071e3}.err-box{display:none;margin-top:10px;padding:10px 14px;border-radius:10px;background:rgba(215,0,21,.06);color:#d70015;font-size:13px}");

  root.innerHTML =
    '<h1 class="tool-h1">正则测试</h1>' +
    '<p class="tool-sub">匹配、替换、常用正则速查。全部本地。</p>' +
    '<div class="cheat" id="cheat"></div>' +
    '<div class="tool-field"><label>正则表达式</label><input type="text" class="tool-input" id="pat" placeholder="/表达式/标志，或直接写表达式"></div>' +
    '<div class="tool-row" style="margin-bottom:16px"><label style="font-size:13px;color:#6e6e73">模式</label><span class="mode-tabs" id="mt"><button data-m="match" class="active">匹配</button><button data-m="replace">替换</button></span></div>' +
    '<div class="tool-field" id="repwrap" style="display:none"><label>替换为（$1 等可用）</label><input type="text" class="tool-input" id="rep" placeholder="替换内容"></div>' +
    '<div class="tool-field"><label>测试文本</label><textarea id="txt" class="tool-textarea" placeholder="输入测试文本…"></textarea></div>' +
    '<p class="err-box" id="err"></p>' +
    '<div class="tool-output mono" id="out" style="min-height:60px;white-space:pre-wrap"></div>';

  var CHEATS = [
    ['邮箱', '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}'],
    ['手机号', '1[3-9]\\d{9}'],
    ['URL', 'https?://[^\\s]+'],
    ['身份证', '\\d{17}[\\dXx]'],
    ['日期', '\\d{4}-\\d{2}-\\d{2}'],
    ['IP 地址', '(\\d{1,3}\\.){3}\\d{1,3}'],
    ['中文', '[\\u4e00-\\u9fa5]+']
  ];
  var cheat = root.querySelector('#cheat');
  cheat.innerHTML = CHEATS.map(function (c) { return '<button data-p="' + c[1].replace(/"/g, '&quot;') + '">' + c[0] + '</button>'; }).join('');
  cheat.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    root.querySelector('#pat').value = b.dataset.p; run();
  });

  var mode = 'match';
  var pat = root.querySelector('#pat'), txt = root.querySelector('#txt'), rep = root.querySelector('#rep');
  var out = root.querySelector('#out'), err = root.querySelector('#err');
  root.querySelector('#mt').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    mode = b.dataset.m;
    root.querySelectorAll('#mt button').forEach(function (x) { x.classList.toggle('active', x === b); });
    root.querySelector('#repwrap').style.display = mode === 'replace' ? 'flex' : 'none';
    run();
  });

  var worker = null;
  function ensureWorker() {
    if (worker) return worker;
    var code = [
      'function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}',
      'self.onmessage=function(e){try{',
      'var re=new RegExp(e.data.p,e.data.f);',
      'if(e.data.mode==="replace"){var r=e.data.t.replace(re,e.data.r);self.postMessage({ok:true,result:r});}',
      'else{var out="",last=0,m,count=0;',
      'if(!/g/.test(e.data.f)){m=re.exec(e.data.t);if(m){count=1;out=esc(e.data.t.slice(0,m.index))+"<mark>"+esc(m[0])+"</mark>"+esc(e.data.t.slice(m.index+m[0].length));}else{out=esc(e.data.t);}}',
      'else{while((m=re.exec(e.data.t))!==null){count++;out+=esc(e.data.t.slice(last,m.index))+"<mark>"+esc(m[0])+"</mark>";last=m.index+m[0].length;if(m[0].length===0)re.lastIndex++;if(count>5000){count=-1;break;}}out+=esc(e.data.t.slice(last));}',
      'self.postMessage({ok:true,count:count,html:out});}',
      '}catch(err){self.postMessage({ok:false,error:err.message});}};'
    ].join('\n');
    var blob = new Blob([code], { type: 'application/javascript' });
    worker = new Worker(URL.createObjectURL(blob));
    return worker;
  }

  var timer = null;
  function run() {
    clearTimeout(timer);
    err.style.display = 'none';
    var t = txt.value;
    if (!pat.value.trim() || !t) { out.innerHTML = ''; return; }
    if (t.length > 100000) { err.textContent = '文本超过 10 万字符，已停止匹配（防止卡死）。'; err.style.display = 'block'; out.innerHTML = ''; return; }
    timer = setTimeout(function () {
      var p = pat.value.trim();
      var m = p.match(/^\/([\s\S]+)\/([gimsuy]*)$/);
      var flags = '';
      if (m) { p = m[1]; flags = m[2]; }
      var w = ensureWorker();
      var tid = setTimeout(function () { w.terminate(); worker = null; err.textContent = '正则太复杂，已中止。'; err.style.display = 'block'; out.innerHTML = ''; }, 2000);
      w.onmessage = function (e) {
        clearTimeout(tid);
        if (e.data.ok) {
          if (mode === 'replace') { out.textContent = e.data.result; }
          else if (e.data.count < 0) { out.innerHTML = '匹配超过 5000 处，已截断。'; }
          else { out.innerHTML = e.data.html + '<br><br>匹配 ' + e.data.count + ' 处'; }
        } else {
          err.textContent = '正则无效：' + e.data.error; err.style.display = 'block'; out.innerHTML = '';
        }
      };
      w.postMessage({ p: p, f: flags, t: t, r: rep.value, mode: mode });
    }, 150);
  }
  pat.addEventListener('input', run); txt.addEventListener('input', run); rep.addEventListener('input', run);
}
