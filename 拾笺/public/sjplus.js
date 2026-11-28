/* sjplus.js — 拾笺增强：回收站 / 搜索高亮 / 图片压缩
   电脑端走 fetch('/api/...')，手机端走 SJLocal.api；同一份代码两端通用。
   2026-11-28：移除「翻一条旧笔记」与「整库 Markdown 导出」（用户确认不需要），
   并把「最近删除」改成直达回收站，不再经过「更多工具」中转。 */
(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const LOCAL = !!(window.SJLocal && typeof window.SJLocal.api === 'function');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function escRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function fmt(ts) {
    const d = new Date(Number(ts) || Date.now());
    const p = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function toast(msg) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._sjT);
    t._sjT = setTimeout(() => t.classList.remove('show'), 2200);
  }

  async function sjReq(path, method, body) {
    if (LOCAL) return window.SJLocal.api(path, { method: method || 'GET', body: body || null });
    const r = await fetch(path, {
      method: method || 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || '请求失败');
    return j;
  }
  function sjRefresh() {
    if (window.SJRefresh) window.SJRefresh();
    else if (window.SJBoot) window.SJBoot();
  }

  /* ---------------------------------------------------------- 通用弹层 */
  function dialog(html, onAct) {
    const mask = document.createElement('div');
    mask.className = 'sjplus-mask';
    mask.innerHTML = '<div class="sjplus-dialog" role="dialog">' + html + '</div>';
    document.body.appendChild(mask);
    const box = mask.firstElementChild;
    const close = () => mask.remove();
    mask.addEventListener('click', (e) => { if (e.target === mask) close(); });
    box.addEventListener('click', (e) => {
      const el = e.target.closest('[data-act]');
      if (!el || !box.contains(el)) return;
      const act = el.dataset.act;
      if (act === 'close') return close();
      Promise.resolve(onAct && onAct(act, el, { box, close }))
        .catch((err) => toast(err.message || '操作失败'));
    });
    return { box, close };
  }

  /* ---------------------------------------------------------- 回收站 */
  async function openTrash() {
    let list;
    try { list = (await sjReq('/api/trash', 'GET')).notes || []; }
    catch (e) { return toast(e.message); }
    const rows = list.length ? list.map((n) =>
      '<div class="sjplus-row">' +
      '<div class="sjplus-row-main"><b>' + esc(n.title || '无标题笔记') + '</b>' +
      '<small>' + fmt(n.deletedAt) + ' 删除 · ' + (n.attachments || []).length + ' 个附件</small></div>' +
      '<button class="btn ghost sm" data-act="restore" data-id="' + esc(n.id) + '">恢复</button>' +
      '<button class="btn ghost sm danger" data-act="purge" data-id="' + esc(n.id) + '">彻底删除</button>' +
      '</div>').join('') : '<p class="sjplus-empty">回收站是空的。删除的笔记会在这里保留 30 天，之后自动清理。</p>';
    dialog('<h3>回收站</h3><div class="sjplus-list">' + rows + '</div>' +
      '<div class="modal-actions">' +
      '<button class="btn ghost danger" data-act="empty"' + (list.length ? '' : ' disabled') + '>清空回收站</button>' +
      '<button class="btn primary" data-act="close">完成</button></div>',
      async (act, el, ctx) => {
        const id = el.dataset.id;
        if (act === 'restore') {
          await sjReq('/api/trash/' + encodeURIComponent(id) + '/restore', 'POST');
          sjRefresh(); ctx.close(); openTrash(); toast('已恢复到笔记列表');
        } else if (act === 'purge' || act === 'empty') {
          const targets = act === 'empty' ? list : list.filter((n) => n.id === id);
          if (!window.confirm(act === 'empty'
            ? '清空回收站？这 ' + targets.length + ' 篇笔记将被永久删除，无法恢复。'
            : '彻底删除这篇笔记？无法恢复。')) return;
          if (window.SJAttGC) targets.forEach((n) => window.SJAttGC.collect(n));
          if (act === 'empty') await sjReq('/api/trash', 'DELETE');
          else await sjReq('/api/trash/' + encodeURIComponent(id), 'DELETE');
          sjRefresh(); ctx.close(); openTrash(); toast('已永久删除');
        }
      });
  }

  /* ---------------------------------------------------------- 搜索结果高亮 */
  function highlight() {
    const input = $('#searchInput');
    const q = input ? input.value.trim() : '';
    const terms = q.split(/\s+/).filter((t) => t && !/^tag:/i.test(t)).map(escRe);
    const re = terms.length ? new RegExp('(' + terms.join('|') + ')', 'gi') : null;
    document.querySelectorAll('.note-card-title span, .note-card-snippet').forEach((el) => {
      const raw = el.getAttribute('data-sjraw') || el.textContent;
      if (!el.getAttribute('data-sjraw')) el.setAttribute('data-sjraw', raw);
      const html = re ? esc(raw).replace(re, '<mark>$1</mark>') : esc(raw);
      /* 按「上次写入的内容」比较，不能用 el.innerHTML：浏览器序列化后的
         字符串和这里拼的不一定逐字节相同（实体、引号），会判成永远不等，
         于是每轮都重写 innerHTML → 触发自己的观察器 → 无限自激。 */
      if (el.getAttribute('data-sjhtml') !== html) {
        el.setAttribute('data-sjhtml', html);
        el.innerHTML = html;
      }
    });
  }
  function bindHighlight() {
    const list = $('#noteList');
    const input = $('#searchInput');
    if (!list) return;
    const OPTS = { childList: true, subtree: true, characterData: true };
    let mo;
    const run = () => {
      if (!mo) return;
      /* 写入期间断开订阅：高亮自己插入的 <mark> 不该再唤醒自己。
         原来的 busy 标志挡不住 —— 观察器回调是下一个任务，那时 busy 已复位。 */
      mo.disconnect();
      try { highlight(); } finally { mo.observe(list, OPTS); }
    };
    mo = new MutationObserver(run);
    mo.observe(list, OPTS);
    if (input) input.addEventListener('input', () => setTimeout(run, 0));
    run();
  }

  /* ---------------------------------------------------------- 图片压缩 */
  window.SJCompress = async function (file) {
    try {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file; // GIF 动图、SVG 不动
      if (file.size < 400 * 1024) return file;
      const bmp = await createImageBitmap(file);
      const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
      const w = Math.max(1, Math.round(bmp.width * scale));
      const h = Math.max(1, Math.round(bmp.height * scale));
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); // 透明 PNG 转 JPEG 时补白底
      ctx.drawImage(bmp, 0, 0, w, h);
      if (bmp.close) bmp.close();
      const blob = await new Promise((res) => cv.toBlob(res, 'image/jpeg', 0.82));
      if (!blob || blob.size >= file.size) return file;
      return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
    } catch (_) { return file; }
  };

  /* ---------------------------------------------------------- 云端附件待清理队列 */
  const GC_KEY = 'sj_att_gc_v1';
  function gcQueue() { try { return JSON.parse(localStorage.getItem(GC_KEY) || '{}'); } catch (_) { return {}; } }
  function gcSave(q) { try { localStorage.setItem(GC_KEY, JSON.stringify(q)); } catch (_) {} }
  window.SJAttGC = {
    collect(note) {
      const q = gcQueue();
      let paths = {};
      try { paths = JSON.parse(localStorage.getItem('sj_att_up_v1') || '{}'); } catch (_) {}
      for (const a of (note.attachments || [])) {
        const p = a.path || paths[a.id];
        if (p) q[p] = { name: a.name || '', id: a.id, at: Date.now() };
      }
      gcSave(q);
    },
    list() { return gcQueue(); },
    count() { return Object.keys(gcQueue()).length; },
    drop(paths) { const q = gcQueue(); paths.forEach((p) => delete q[p]); gcSave(q); }
  };

  /* 给 app.js 的「最近删除」用：直达回收站，不再借工具按钮中转。
     工具按钮本身也保留（桌面侧栏 rail），点它同样是打开回收站。 */
  window.SJPlusTrash = openTrash;

  /* ---------------------------------------------------------- 入口 */
  /* 侧栏工具行已并入 .sb-rail（竖排图标栏），现在是回收站图标，
     排在主题按钮之前。老结构仍兼容。 */
  function mount() {
    const rail = document.querySelector('.sb-rail');
    const foot = document.querySelector('.sidebar-foot');
    if ((!rail && !foot) || $('#sjPlusToolsBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'sjPlusToolsBtn';
    /* 2026-11-28：原来这颗是「更多工具」，里面塞了回收站 / 翻旧笔记 / 导出 Markdown。
       用户确认后两项不需要，且手机「最近删除」弹出工具菜单文不对题 —— 现在
       这颗按钮就是回收站本身，点一下直达，不再多一层中转。 */
    const tipLong = '回收站：删除的笔记保留 30 天';
    btn.setAttribute('aria-label', tipLong);
    const ico = '<svg viewBox="0 0 24 24" class="ico"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>';
    if (rail) {
      btn.className = 'rail-btn';
      btn.dataset.tip = '回收站';
      btn.innerHTML = ico;
      rail.insertBefore(btn, rail.querySelector('#themeBtn') || null);
    } else {
      btn.className = 'foot-tool';
      btn.title = tipLong;
      btn.innerHTML = ico + '<span>回收站</span>';
      foot.insertBefore(btn, foot.querySelector('#importInput') || null);
    }
    btn.onclick = openTrash;
    bindHighlight();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
