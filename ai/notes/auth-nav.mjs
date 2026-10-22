// 导航栏的登录状态：未登录显示「登录」，已登录显示用户名（链接到进度页）
// 挂载点：<span data-auth-slot></span>，需要页面引入本脚本

const slot = document.querySelector('[data-auth-slot]');
if (slot) render();

async function render() {
  slot.innerHTML = '<a href="/ai/notes/progress/">登录 / 注册</a>';
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (data.username) {
      slot.innerHTML = '<a href="/ai/notes/progress/" title="进度与账号">' + esc(data.username) + '</a>';
    }
  } catch (e) {}
}

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
