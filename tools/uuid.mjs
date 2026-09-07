// tools/uuid.mjs
export function mount(root, H) {
  root.innerHTML = '<h1 class="tool-h1">UUID / 密码</h1><p class="tool-sub">生成 UUID 和随机密码。</p>'
    + '<div class="tool-row"><button class="tool-btn" id="u1">生成 1 个 UUID</button><button class="tool-btn" id="u10">生成 10 个</button></div>'
    + '<div class="tool-output mono" id="ulist" style="min-height:24px"></div>'
    + '<div class="tool-field" style="margin-top:20px"><label>密码长度</label><input type="number" class="tool-input" id="len" value="16" min="4" max="128" style="width:100px"></div>'
    + '<div class="tool-row"><button class="tool-btn" id="pw">生成密码</button></div>'
    + '<div class="tool-output mono" id="pout" style="min-height:24px"></div>';
  function uuid(){ if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c){ var r=Math.random()*16|0, v=c==='x'?r:(r&0x3|0x8); return v.toString(16); }); }
  function genPw(n){ var ch='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+=?'; var a=new Uint32Array(n); crypto.getRandomValues(a); var s=''; for(var i=0;i<n;i++) s+=ch[a[i]%ch.length]; return s; }
  root.querySelector('#u1').addEventListener('click', function(){ root.querySelector('#ulist').textContent = uuid(); });
  root.querySelector('#u10').addEventListener('click', function(){ var a=[]; for(var i=0;i<10;i++) a.push(uuid()); root.querySelector('#ulist').textContent = a.join('\n'); });
  root.querySelector('#pw').addEventListener('click', function(){ var n=parseInt(root.querySelector('#len').value,10)||16; root.querySelector('#pout').textContent = genPw(n); });
}