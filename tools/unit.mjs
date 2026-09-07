// tools/unit.mjs
export function mount(root, H) {
  var CATS = {
    length: { name:'长度', base:'m', units:{ mm:0.001, cm:0.01, m:1, km:1000, inch:0.0254, ft:0.3048, mile:1609.344 } },
    weight: { name:'重量', base:'kg', units:{ g:0.001, kg:1, t:1000, lb:0.45359237, oz:0.028349523 } },
    area: { name:'面积', base:'m2', units:{ 'm2':1, 'km2':1e6, hectare:1e4, mu:666.6667 } }
  };
  root.innerHTML = '<h1 class="tool-h1">单位换算</h1><p class="tool-sub">长度、重量、面积。</p>'
    + '<div class="tool-row" style="margin-bottom:16px"><span class="seg" id="cat"><button data-c="length" class="active">长度</button><button data-c="weight">重量</button><button data-c="area">面积</button></span></div>'
    + '<div class="tool-row" style="margin-bottom:16px"><input type="number" class="tool-input" id="v" value="1" style="width:120px">'
    + '<select class="tool-select" id="from"></select><span style="color:#86868b">→</span><select class="tool-select" id="to"></select></div>'
    + '<div class="tool-output" id="out" style="font-size:18px"></div>';
  var cat='length', fromSel=root.querySelector('#from'), toSel=root.querySelector('#to'), out=root.querySelector('#out');
  function fillUnits(){
    var u=CATS[cat].units, names=Object.keys(u);
    fromSel.innerHTML=''; toSel.innerHTML='';
    names.forEach(function(n){ fromSel.add(new Option(n,n)); toSel.add(new Option(n,n)); });
    if (names.indexOf('m')>=0){ fromSel.value='m'; toSel.value='cm'; } else { fromSel.value=names[0]; toSel.value=names[1]; }
  }
  function run(){
    var v=parseFloat(root.querySelector('#v').value); if(isNaN(v)){ out.textContent=''; return; }
    var f=CATS[cat].units[fromSel.value], t=CATS[cat].units[toSel.value];
    var r=v*f/t;
    out.textContent = v+' '+fromSel.value+' = '+r.toFixed(6).replace(/\.?0+$/,'')+' '+toSel.value;
  }
  root.querySelector('#cat').addEventListener('click', function(e){ var b=e.target.closest('button'); if(!b)return; cat=b.dataset.c; root.querySelectorAll('#cat button').forEach(function(x){x.classList.toggle('active',x===b);}); fillUnits(); run(); });
  fromSel.addEventListener('change', run); toSel.addEventListener('change', run); root.querySelector('#v').addEventListener('input', run);
  fillUnits(); run();
}