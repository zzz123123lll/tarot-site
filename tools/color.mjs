// tools/color.mjs
export function mount(root, H) {
  root.innerHTML = '<h1 class="tool-h1">颜色工具</h1><p class="tool-sub">HEX / RGB / HSL 互转。</p>'
    + '<div class="tool-field"><label>HEX</label><input type="text" class="tool-input" id="hex" value="#0071e3" placeholder="#RRGGBB"></div>'
    + '<div class="swatch" id="sw"></div>'
    + '<div class="tool-output mono" id="out"></div>';
  var hex = root.querySelector('#hex'), sw = root.querySelector('#sw'), out = root.querySelector('#out');
  function rgbToHsl(r,g,b){ r/=255;g/=255;b/=255; var mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn,h=0,l=(mx+mn)/2,s=0; if(d){s=l>0.5?d/(2-mx-mn):d/(mx+mn); switch(mx){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;default:h=(r-g)/d+4;} h/=6;} return [Math.round(h*360), Math.round(s*100), Math.round(l*100)]; }
  function run(){
    var v = hex.value.trim().replace('#','');
    if (!/^[0-9a-fA-F]{6}$/.test(v)) { out.textContent='请输入 6 位 HEX'; sw.style.background='#f5f5f7'; return; }
    var r=parseInt(v.slice(0,2),16), g=parseInt(v.slice(2,4),16), b=parseInt(v.slice(4,6),16);
    sw.style.background='#'+v;
    var hsl=rgbToHsl(r,g,b);
    out.innerHTML = 'RGB('+r+', '+g+', '+b+')<br>HSL('+hsl[0]+'°, '+hsl[1]+'%, '+hsl[2]+'%)';
  }
  hex.addEventListener('input', run); run();
}