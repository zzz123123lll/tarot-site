// tools/bmi.mjs
export function mount(root, H) {
  root.innerHTML = '<h1 class="tool-h1">BMI 计算器</h1><p class="tool-sub">身体质量指数。</p>'
    + '<div class="tool-row" style="margin-bottom:16px"><label style="font-size:13px;color:#6e6e73">身高</label><input type="number" class="tool-input" id="h" value="170" min="50" max="250" style="width:100px"><span style="color:#6e6e73;font-size:13px">cm</span>'
    + '<label style="font-size:13px;color:#6e6e73;margin-left:16px">体重</label><input type="number" class="tool-input" id="w" value="65" min="10" max="300" style="width:100px"><span style="color:#6e6e73;font-size:13px">kg</span></div>'
    + '<div class="tool-output" id="out" style="font-size:20px"></div>';
  var out=root.querySelector('#out');
  function run(){
    var h=parseFloat(root.querySelector('#h').value)/100, w=parseFloat(root.querySelector('#w').value);
    if(!h||!w){ out.textContent=''; return; }
    var bmi=w/(h*h), cat;
    if(bmi<18.5) cat='偏瘦'; else if(bmi<24) cat='正常'; else if(bmi<28) cat='超重'; else cat='肥胖';
    out.innerHTML='BMI = <strong>'+bmi.toFixed(1)+'</strong> · '+cat;
  }
  root.querySelector('#h').addEventListener('input', run); root.querySelector('#w').addEventListener('input', run); run();
}