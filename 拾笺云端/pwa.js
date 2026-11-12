/* ============================================================
   拾笺 · 添加到手机桌面（PWA）
   ------------------------------------------------------------
   作用：
     1. 注册 Service Worker（Chrome 判定「可安装」的必要条件，同时带来离线可读）
     2. 在合适的时候提示用户「添加到桌面」，并给出当前浏览器的具体步骤
     3. 处理桌面图标长按「新建笔记」快捷方式（?action=new）
   只在手机端页面（拾笺云端）加载，桌面本地版不需要。
   ============================================================ */
(() => {
  'use strict';

  const UA = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(UA);
  const isWeChat = /MicroMessenger/i.test(UA);
  const isQQ = /\bQQ\/|QQBrowser/i.test(UA);
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(UA);

  const standalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.navigator.standalone === true;

  const LS_DISMISS = 'sj_pwa_tip_dismissed';
  const LS_INSTALLED = 'sj_pwa_installed';

  let deferredPrompt = null;
  let installed = standalone() || localStorage.getItem(LS_INSTALLED) === '1';

  if (installed) document.documentElement.classList.add('pwa-standalone');

  const $ = (s, r = document) => r.querySelector(s);

  /* ---------------------------------------------------------- 1. Service Worker */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      /* 访问码从当前链接取，并同步给已装好的 SW：重新发布换码后不会 403。 */
      let sc = new URLSearchParams(location.search).get('sharecode') || '';
      try { sc = sc || localStorage.getItem('sj_sharecode') || ''; } catch (_) {}
      sc = sc || 'SSYXUMSNMI';
      const pushCode = (reg) => {
        const sw = reg && (reg.active || reg.waiting || reg.installing);
        try {
          if (sw) sw.postMessage({ type: 'sharecode', value: sc });
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'sharecode', value: sc });
          }
        } catch (_) {}
      };
      /* 注册 URL 带版本号：部分手机浏览器会长期缓存 sw.js 本身，脚本 URL
         不变就根本不检查更新。每次发布改这个号，浏览器必然当成新脚本
         重新 install → 换掉旧缓存。
         发布清单五处同步改：index.html 的 SWV、sw.js 的 VERSION、
         mobilesync.js 的 BUILD、quick.html 末尾注册脚本的 SWV、这里的兜底值。
         优先读内联脚本给的 SWV，保证各处 register() 用同一个脚本 URL。 */
      const SW_BUILD = window.__SJ_SWV__ || '2026-11-12-75';
      navigator.serviceWorker.register('/sw.js?sharecode=' + encodeURIComponent(sc) + '&v=' + SW_BUILD, { scope: '/' })
        .then((reg) => {
          pushCode(reg);
          /* 主动查一次更新：部分手机浏览器不会按时检查 sw.js，
             不主动 update 就会一直跑几个月前缓存的旧代码。 */
          try { if (reg.update) reg.update().catch(() => {}); } catch (_) {}
          if (reg.waiting) { try { reg.waiting.postMessage('skip-waiting'); } catch (_) {} }
          return navigator.serviceWorker.ready;
        })
        .then((reg) => { pushCode(reg); })
        .catch((e) => {
          console.warn('[拾笺] Service Worker 注册失败：', e && e.message);
        });
    });

    /* 只在「真的换了版本」时刷新一次。
       页面加载时本来没有 controller（首次安装 / claim 接管）不算换版：
       这时页面用的已是最新资源，刷新只会把用户刚点开的列表抽屉刷没，
       表现就是「点列表闪一下又回到笔记」。另外用户刚操作过、抽屉开着、
       正在输入、页面在后台时一律不刷，等下次打开自然用上新版本。 */
    const hadController = !!navigator.serviceWorker.controller;
    let lastActionAt = 0;
    ['pointerdown', 'touchstart', 'keydown'].forEach((ev) => {
      window.addEventListener(ev, () => { lastActionAt = Date.now(); }, { passive: true, capture: true });
    });
    const RELOAD_KEY = 'sj_sw_reloaded_at';
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      try {
        if (!hadController || !navigator.serviceWorker.controller) return;
        const ae = document.activeElement;
        if (ae && /^(INPUT|TEXTAREA)$/.test(ae.tagName)) return;
        if (document.visibilityState !== 'visible') return;
        if (Date.now() - lastActionAt < 5000) return;
        if (document.body.classList.contains('m-list') || document.body.classList.contains('m-tree')) return;
        const t = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
        if (Date.now() - t < 15000) return;
        sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
        if (window.SJSaveNow) { try { window.SJSaveNow(); } catch (_) {} }
        location.reload();
      } catch (_) {}
    });
  }

  /* ---------------------------------------------------------- 2. 安装提示 UI */
  const ICON_SHARE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M6 12H5a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-1"/></svg>';
  const ICON_PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M12 8v8M8 12h8"/></svg>';
  const ICON_DOTS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="19" cy="12" r="1.2" fill="currentColor"/></svg>';

  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  /* 底部提示条 */
  let tipEl = null;
  function showTip() {
    if (installed || tipEl) return;
    tipEl = el(`
      <div class="pwa-tip" role="dialog" aria-label="添加到桌面">
        <div class="pwa-ico">拾</div>
        <div class="pwa-txt">
          <strong>把拾笺放到桌面</strong>
          <span>像 App 一样全屏打开，点一下就到</span>
        </div>
        <button class="pwa-go" type="button">添加</button>
        <button class="pwa-close" type="button" aria-label="以后再说">${'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'}</button>
      </div>`);
    document.body.appendChild(tipEl);
    requestAnimationFrame(() => tipEl.classList.add('show'));

    $('.pwa-go', tipEl).addEventListener('click', onAddClick);
    $('.pwa-close', tipEl).addEventListener('click', () => {
      hideTip();
      localStorage.setItem(LS_DISMISS, String(Date.now()));
    });
  }

  function hideTip() {
    if (!tipEl) return;
    tipEl.classList.remove('show');
    const node = tipEl;
    tipEl = null;
    setTimeout(() => node.remove(), 420);
  }

  async function onAddClick() {
    if (deferredPrompt) {
      const dp = deferredPrompt;
      deferredPrompt = null;
      try {
        /* prompt() 在部分环境里返回 rejected promise，且 userChoice 会一直挂着，
           所以这里加一个超时兜底，超时就走手动引导，不至于点了没反应。 */
        const ret = dp.prompt();
        if (ret && typeof ret.catch === 'function') ret.catch(() => {});
        const choice = await Promise.race([
          dp.userChoice.catch(() => ({ outcome: 'timeout' })),
          new Promise((r) => setTimeout(() => r({ outcome: 'timeout' }), 1500)),
        ]);
        if (choice.outcome === 'accepted') {
          markInstalled();
          hideTip();
          return;
        }
        if (choice.outcome === 'dismissed') return; // 用户自己点了取消，不再打扰
      } catch (_) { /* 落到下面的手动引导 */ }
    }
    openGuide();
  }

  function markInstalled() {
    installed = true;
    localStorage.setItem(LS_INSTALLED, '1');
    document.documentElement.classList.add('pwa-standalone');
    hideTip();
    const entry = $('#pwaEntry');
    if (entry) entry.remove();
  }

  /* ---------------------------------------------------------- 3. 手动引导弹层 */
  function guideSteps() {
    if (isWeChat) {
      return {
        title: '微信里无法直接添加',
        sub: '微信内置浏览器不支持「添加到主屏幕」，换个浏览器打开就行。',
        steps: [
          { icon: ICON_DOTS, text: '点屏幕右上角的 <b>···</b> 按钮' },
          { icon: ICON_SHARE, text: '选择 <b>在浏览器打开</b>' },
          { icon: ICON_PLUS, text: '浏览器里再点 <b>添加到主屏幕</b>' },
        ],
      };
    }
    if (isIOS) {
      return {
        title: '添加到 iPhone 主屏幕',
        sub: '用 Safari 打开本页（微信/QQ 里需先「在浏览器打开」）。',
        steps: [
          { icon: ICON_SHARE, text: '点屏幕底部（或顶部）的 <b>分享</b> 按钮' },
          { icon: ICON_PLUS, text: '在菜单里选 <b>添加到主屏幕</b>' },
          { icon: '<span class="pwa-badge">添加</span>', text: '右上角点 <b>添加</b>，图标就出现在桌面了' },
        ],
      };
    }
    if (isAndroid) {
      return {
        title: '添加到安卓桌面',
        sub: '手机自带浏览器即可；长按没有「随手记」时，用 App 内的按钮或绿色铅笔图标。',
        steps: [
          { icon: ICON_DOTS, text: '点右上角的 <b>⋮</b> 菜单' },
          { icon: ICON_PLUS, text: '选择 <b>添加到主屏幕</b> 或 <b>安装应用</b>' },
          { icon: ICON_SHARE, text: '确认后桌面会出现「拾笺」图标' },
        ],
      };
    }
    return {
      title: '添加到桌面',
      sub: '在浏览器菜单里找到「安装」或「添加到主屏幕」。',
      steps: [
        { icon: ICON_DOTS, text: '打开浏览器菜单' },
        { icon: ICON_PLUS, text: '选择 <b>安装拾笺</b> / <b>添加到主屏幕</b>' },
      ],
    };
  }

  function openGuide() {
    if ($('#pwaSheet')) return;
    const g = guideSteps();
    const sheet = el(`
      <div class="pwa-sheet" id="pwaSheet">
        <div class="pwa-sheet-card">
          <div class="pwa-sheet-head">
            <div>
              <h3>${g.title}</h3>
              <p>${g.sub}</p>
            </div>
            <button class="pwa-sheet-x" type="button" aria-label="关闭">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
          </div>
          <ol class="pwa-steps">
            ${g.steps.map((s, i) => `
              <li>
                <span class="pwa-step-n">${i + 1}</span>
                <span class="pwa-step-ico">${s.icon}</span>
                <span class="pwa-step-t">${s.text}</span>
              </li>`).join('')}
          </ol>
          <div class="pwa-sheet-foot">
            <span class="pwa-hint">装好后从桌面图标打开，笔记和同步都在。</span>
            <button class="btn primary" type="button" id="pwaSheetOk">知道了</button>
          </div>
        </div>
      </div>`);
    document.body.appendChild(sheet);
    requestAnimationFrame(() => sheet.classList.add('show'));

    const close = () => {
      sheet.classList.remove('show');
      setTimeout(() => sheet.remove(), 260);
    };
    $('.pwa-sheet-x', sheet).addEventListener('click', close);
    $('#pwaSheetOk', sheet).addEventListener('click', close);
    sheet.addEventListener('click', (e) => { if (e.target === sheet) close(); });
    if (isSafari || isIOS) localStorage.setItem(LS_DISMISS, String(Date.now()));
  }

  /* ---------------------------------------------------------- 4. 侧栏常驻入口 */
  function mountSideEntry() {
    if (installed || $('#pwaEntry')) return;
    const foot = $('.sidebar-foot');
    if (!foot) return;
    const row = el(`
      <button class="pwa-entry" id="pwaEntry" type="button">
        <span class="pwa-entry-ico">${ICON_PLUS}</span>
        <span>添加到手机桌面</span>
      </button>`);
    foot.parentNode.insertBefore(row, foot);
    row.addEventListener('click', () => {
      // 侧栏打开时先收起抽屉，避免弹层被压在下面
      document.body.classList.remove('m-tree', 'm-list');
      setTimeout(onAddClick, 180);
    });
  }

  /* ---------------------------------------------------------- 5. 浏览器事件 */
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (!installed) {
      mountSideEntry();
      if (!localStorage.getItem(LS_DISMISS)) setTimeout(showTip, 1800);
    }
  });

  window.addEventListener('appinstalled', () => {
    markInstalled();
  });

  /* ---------------------------------------------------------- 6. 启动 */
  function boot() {
    if (installed) return;

    if (isIOS) {
      // iOS 永远不会触发 beforeinstallprompt，直接给入口 + 提示
      mountSideEntry();
      if (!localStorage.getItem(LS_DISMISS)) setTimeout(showTip, 2200);
    } else if (!deferredPrompt) {
      // 桌面浏览器 / 不支持的浏览器：只保留侧栏入口
      mountSideEntry();
      if (!localStorage.getItem(LS_DISMISS) && (isAndroid || isWeChat)) {
        setTimeout(showTip, 2200);
      }
    }

    // 桌面图标「新建笔记」快捷方式
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new') {
      let tries = 0;
      const tick = setInterval(() => {
        const btn = $('#mNewBtn') || $('#newNoteBtn');
        if (btn) {
          clearInterval(tick);
          btn.click();
          // 清掉 action 参数，避免刷新时又新建一篇
          params.delete('action');
          const q = params.toString();
          history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash);
        } else if (++tries > 40) {
          clearInterval(tick);
        }
      }, 100);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
