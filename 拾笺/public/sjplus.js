/* sjplus.js — 拾笺增强：回收站 / 旧笔记回顾 / 整库 Markdown 导出 / 搜索高亮 / 图片压缩
   电脑端走 fetch('/api/...')，手机端走 SJLocal.api；同一份代码两端通用。 */
(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const LOCAL = !!(window.SJLocal && typeof window.SJLocal.api === 'function');
  const enc = new TextEncoder();
  const DAY = 24 * 3600 * 1000;

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
  function plain(s) {
    return String(s || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' [图片] ')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[#>*_`~|-]/g, ' ')
      .replace(/\s+/g, ' ').trim().slice(0, 260);
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
  async function sjState() {
    if (LOCAL) return window.SJLocal.api('/api/state', { method: 'GET' });
    const r = await fetch('/api/state');
    return r.json();
  }
  function sjRefresh() {
    if (window.SJRefresh) window.SJRefresh();
    else if (window.SJBoot) window.SJBoot();
  }
  function sjOpen(id) {
    if (window.SJOpenNote) return window.SJOpenNote(id);
    const card = document.querySelector('.note-card[data-id="' + id + '"]');
    if (card) card.click();
  }
  function download(blob, name) {
    const a = document.createElement('a');
    const u = URL.createObjectURL(blob);
    a.href = u; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 3000);
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

  /* ---------------------------------------------------------- 工具菜单 */
  async function openMenu() {
    let count = 0;
    try { count = ((await sjReq('/api/trash', 'GET')).notes || []).length; } catch (_) {}
    dialog('<h3>更多工具</h3>' +
      '<div class="sjplus-menu">' +
      '<button data-act="trash"><b>回收站</b><span>删除的笔记保留 30 天' + (count ? ' · ' + count + ' 篇' : '') + '</span></button>' +
      '<button data-act="review"><b>翻一条旧笔记</b><span>随机重看一篇以前写的</span></button>' +
      '<button data-act="md"><b>导出整本 Markdown</b><span>每篇一个 .md，图片放 files/，打包 zip</span></button>' +
      '</div>' +
      '<div class="modal-actions"><button class="btn ghost" data-act="close">关闭</button></div>',
      (act, el, ctx) => {
        ctx.close();
        if (act === 'trash') openTrash();
        else if (act === 'review') openReview();
        else if (act === 'md') exportMd();
      });
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

  /* ---------------------------------------------------------- 旧笔记回顾 */
  async function openReview() {
    let st;
    try { st = await sjState(); } catch (e) { return toast(e.message); }
    const all = (st.notes || []).filter((n) => !n.deletedAt && String(n.content || '').trim());
    const old = all.filter((n) => Date.now() - (Number(n.updatedAt) || 0) > 7 * DAY);
    const pool = old.length ? old : all;
    if (!pool.length) return toast('还没有可以回顾的笔记');
    let idx = Math.floor(Math.random() * pool.length);
    const d = dialog('<h3>翻一条旧笔记</h3><div class="sjplus-review"></div>' +
      '<div class="modal-actions">' +
      '<button class="btn ghost" data-act="again">换一条</button>' +
      '<button class="btn primary" data-act="open">打开这篇</button></div>',
      (act, el, ctx) => {
        if (act === 'again') {
          idx = (idx + 1 + Math.floor(Math.random() * Math.max(1, pool.length - 1))) % pool.length;
          paint();
        } else if (act === 'open') { ctx.close(); sjOpen(pool[idx].id); }
      });
    function paint() {
      const n = pool[idx];
      d.box.querySelector('.sjplus-review').innerHTML =
        '<div class="sjplus-rew-title">' + esc(n.title || '无标题笔记') + '</div>' +
        '<div class="sjplus-rew-meta">' + fmt(n.updatedAt) + ' · ' + esc((n.tags || []).join(' / ') || '无标签') + '</div>' +
        '<div class="sjplus-rew-body">' + esc(plain(n.content)) + '</div>';
    }
    paint();
  }

  /* ---------------------------------------------------------- ZIP（store 模式，零依赖） */
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(buf) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function zipStore(files) {
    const chunks = [], central = [];
    let offset = 0;
    const DOS_DATE = 0x5821; // 2024-01-01，避免 0 日期被部分解压器拒绝
    for (const f of files) {
      const name = enc.encode(f.name);
      const crc = crc32(f.data), size = f.data.length;
      const local = new Uint8Array(30 + name.length);
      const lv = new DataView(local.buffer);
      lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true);
      lv.setUint16(6, 0x0800, true); lv.setUint16(8, 0, true);
      lv.setUint16(10, 0, true); lv.setUint16(12, DOS_DATE, true);
      lv.setUint32(14, crc, true); lv.setUint32(18, size, true); lv.setUint32(22, size, true);
      lv.setUint16(26, name.length, true); lv.setUint16(28, 0, true);
      local.set(name, 30);
      chunks.push(local, f.data);
      const cd = new Uint8Array(46 + name.length);
      const cv = new DataView(cd.buffer);
      cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x0800, true); cv.setUint16(10, 0, true);
      cv.setUint16(12, 0, true); cv.setUint16(14, DOS_DATE, true);
      cv.setUint32(16, crc, true); cv.setUint32(20, size, true); cv.setUint32(24, size, true);
      cv.setUint16(28, name.length, true);
      cv.setUint32(42, offset, true);
      cd.set(name, 46);
      central.push(cd);
      offset += local.length + size;
    }
    const cdSize = central.reduce((a, b) => a + b.length, 0);
    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true);
    ev.setUint32(12, cdSize, true); ev.setUint32(16, offset, true);
    return new Blob(chunks.concat(central, [eocd]), { type: 'application/zip' });
  }

  /* ---------------------------------------------------------- 整库 Markdown 导出 */
  function attFile(a) {
    const ext = (String(a.name || '').match(/\.[A-Za-z0-9]{1,8}$/) || [''])[0].toLowerCase();
    return String(a.id) + ext;
  }
  function safeTitle(n) {
    const t = String(n.title || '无标题笔记')
      .replace(/[\\/:*?"<>|\r\n\t]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 60) || '无标题笔记';
    return t + '-' + String(n.id).slice(0, 8);
  }
  function htmlToMd(html, note) {
    const byName = {}, attById = {};
    (note.attachments || []).forEach((a) => {
      byName[String(a.name || '')] = a.id;
      attById[a.id] = attFile(a);
    });
    const resolve = (src, alt) => {
      const m = String(src || '').match(/\/api\/files\/([A-Za-z0-9_-]+)/);
      const id = (m && m[1]) || byName[alt] || '';
      return attById[id] ? 'files/' + attById[id] : '';
    };
    if (window.TurndownService) {
      const td = new window.TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
      try { if (window.turndownPluginGfm && window.turndownPluginGfm.gfm) td.use(window.turndownPluginGfm.gfm); } catch (_) {}
      td.addRule('sjImg', {
        filter: 'img',
        replacement: (_c, node) => {
          const alt = node.getAttribute('alt') || '';
          const url = resolve(node.getAttribute('src'), alt);
          return url ? '\n![' + alt + '](' + url + ')\n' : (alt ? '![' + alt + ']' : '');
        }
      });
      td.addRule('sjFileLink', {
        filter: (node) => node.nodeName === 'A' && /\/api\/files\//.test(node.getAttribute('href') || ''),
        replacement: (content, node) => {
          const url = resolve(node.getAttribute('href'), content);
          return url ? '[' + content + '](' + url + ')' : content;
        }
      });
      return td.turndown(String(html || ''));
    }
    return String(html || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
  }
  function noteMd(n, catName) {
    const attById = {};
    (n.attachments || []).forEach((a) => { attById[a.id] = attFile(a); });
    let body = String(n.content || '');
    if (n.format === 'rich') body = htmlToMd(body, n);
    body = body.replace(/\/api\/files\/([A-Za-z0-9_-]+)/g,
      (m, id) => attById[id] ? 'files/' + attById[id] : m);
    const title = String(n.title || '无标题笔记');
    const q = (s) => '"' + String(s).replace(/"/g, '\\"') + '"';
    const fm = ['---', 'title: ' + q(title), 'category: ' + q(catName || ''),
      'tags: [' + (n.tags || []).map(q).join(', ') + ']',
      'created: ' + new Date(Number(n.createdAt) || Date.now()).toISOString(),
      'updated: ' + new Date(Number(n.updatedAt) || Date.now()).toISOString(),
      '---', ''].join('\n');
    return fm + '\n# ' + title + '\n\n' + body.trim() + '\n';
  }
  async function attBytes(a) {
    try {
      let url;
      if (LOCAL) url = await window.SJLocal.fileUrl(a.id);
      else url = '/api/files/' + encodeURIComponent(a.id);
      if (!url) return null;
      const r = await fetch(url);
      if (!r.ok) return null;
      return new Uint8Array(await r.arrayBuffer());
    } catch (_) { return null; }
  }
  async function exportMd() {
    toast('正在整理 Markdown…');
    try {
      const st = await sjState();
      const notes = (st.notes || []).filter((n) => !n.deletedAt);
      if (!notes.length) return toast('还没有笔记可导出');
      const cats = {};
      (st.categories || []).forEach((c) => { cats[c.id] = c.name; });
      const byCat = {};
      notes.slice().sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0))
        .forEach((n) => {
          const c = cats[n.categoryId] || '未分类';
          (byCat[c] = byCat[c] || []).push(n);
        });
      const files = [], used = new Set();
      const index = ['# 拾笺 · 笔记导出', '',
        '导出时间：' + new Date().toLocaleString('zh-CN'), '',
        '共 ' + notes.length + ' 篇。每篇一个 Markdown 文件，图片与非图片附件都在 `files/`。', ''];
      for (const c of Object.keys(byCat)) {
        index.push('## ' + c, '');
        for (const n of byCat[c]) {
          const name = safeTitle(n) + '.md';
          index.push('- [' + (n.title || '无标题笔记') + '](' + encodeURIComponent(name) + ')');
          files.push({ name, data: enc.encode(noteMd(n, c)) });
          for (const a of (n.attachments || [])) {
            const fn = attFile(a);
            if (used.has(fn)) continue;
            used.add(fn);
            const bytes = await attBytes(a);
            if (bytes) files.push({ name: 'files/' + fn, data: bytes });
          }
        }
        index.push('');
      }
      files.unshift({ name: 'README.md', data: enc.encode(index.join('\n')) });
      download(zipStore(files), '拾笺-Markdown-' + new Date().toISOString().slice(0, 10) + '.zip');
      toast('已导出 ' + notes.length + ' 篇 Markdown');
    } catch (e) { toast('导出失败：' + e.message); }
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

  /* ---------------------------------------------------------- 入口 */
  function mount() {
    const foot = document.querySelector('.sidebar-foot');
    if (!foot || $('#sjPlusToolsBtn')) return;
    const btn = document.createElement('button');
    btn.className = 'foot-tool';
    btn.id = 'sjPlusToolsBtn';
    btn.title = '更多工具：回收站 / 翻旧笔记 / 导出 Markdown';
    btn.setAttribute('aria-label', btn.title);
    btn.innerHTML = '<svg viewBox="0 0 24 24" class="ico"><circle cx="8.5" cy="8.5" r="1.6"/><circle cx="15.5" cy="8.5" r="1.6"/><circle cx="8.5" cy="15.5" r="1.6"/><circle cx="15.5" cy="15.5" r="1.6"/></svg><span>更多</span>';
    btn.onclick = openMenu;
    foot.insertBefore(btn, foot.querySelector('#importInput') || null);
    bindHighlight();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
