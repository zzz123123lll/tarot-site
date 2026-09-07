// tools/date.mjs
export function mount(root, H) {
  root.innerHTML = '<h1 class="tool-h1">日期计算</h1><p class="tool-sub">日期差、加减天数、年龄。</p>'
    + '<div class="tool-field"><label>起始日期</label><input type="date" class="tool-input" id="d1"></div>'
    + '<div class="tool-field"><label>结束日期</label><input type="date" class="tool-input" id="d2"></div>'
    + '<div class="tool-row" style="margin-bottom:16px"><button class="tool-btn" id="diff">算相差天数</button>'
    + '<label style="font-size:13px;color:#6e6e73;margin-left:16px">加减</label><input type="number" class="tool-input" id="n" value="30" style="width:80px"><span style="color:#6e6e73;font-size:13px">天</span>'
    + '<button class="tool-btn tool-btn--ghost" id="add">加</button><button class="tool-btn tool-btn--ghost" id="sub">减</button></div>'
    + '<div class="tool-output" id="out"></div>';
  var out=root.querySelector('#out');
  function dstr(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function getD(id){ var v=root.querySelector(id).value; if(!v) return null; var p=v.split('-'); return new Date(+p[0],+p[1]-1,+p[2]); }
  root.querySelector('#diff').addEventListener('click', function(){ var a=getD('#d1'), b=getD('#d2'); if(!a||!b){out.textContent='请选日期';return;} out.textContent='相差 '+(Math.round((b-a)/86400000))+' 天'; });
  root.querySelector('#add').addEventListener('click', function(){ var a=getD('#d1'); if(!a){out.textContent='请选起始日期';return;} var n=parseInt(root.querySelector('#n').value,10)||0; var d=new Date(a); d.setDate(d.getDate()+n); out.textContent=dstr(d); });
  root.querySelector('#sub').addEventListener('click', function(){ var a=getD('#d1'); if(!a){out.textContent='请选起始日期';return;} var n=parseInt(root.querySelector('#n').value,10)||0; var d=new Date(a); d.setDate(d.getDate()-n); out.textContent=dstr(d); });
}