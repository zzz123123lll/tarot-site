// 邮箱订阅：把原来的 mailto 换成表单，提交到 /api/subscribe
// 加载方式：<script type="module" src="/ai/notes/subscribe.mjs" defer></script>

const forms = document.querySelectorAll('form[data-subscribe]');
if (forms.length) init();

function init() {
  const DONE_KEY = 'gjh-pdf-subscribed';
  forms.forEach((form) => {
    const input = form.querySelector('input[type="email"]');
    const btn = form.querySelector('button[type="submit"]');
    const status = form.querySelector('[data-subscribe-status]');
    const trap = form.querySelector('input[name="website"]');

    try {
      if (localStorage.getItem(DONE_KEY)) {
        setStatus(status, '已经登记过了，PDF 会按顺序发到你的邮箱。', 'ok');
      }
    } catch (e) {}

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = String(input.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        setStatus(status, '邮箱格式好像不对，检查一下？', 'err');
        input.focus();
        return;
      }

      btn.disabled = true;
      const old = btn.textContent;
      btn.textContent = '提交中…';
      setStatus(status, '', '');

      try {
        const res = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, source: location.pathname, website: trap ? trap.value : '' }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.error) throw new Error(data.error || 'HTTP ' + res.status);

        setStatus(status, '记下了。PDF 整理好后会按顺序发到这个邮箱。', 'ok');
        try { localStorage.setItem(DONE_KEY, email); } catch (e) {}
        form.reset();
      } catch (err) {
        setStatus(status, '这次没提交成功：' + err.message + '。也可以直接发邮件到 1336089899@qq.com。', 'err');
        btn.disabled = false;
        btn.textContent = old;
      }
    });
  });
}

function setStatus(el, text, kind) {
  if (!el) return;
  el.textContent = text || '';
  el.className = 'pdf-form-status' + (kind ? ' is-' + kind : '');
}
