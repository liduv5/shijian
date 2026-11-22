/* ============================================================
   拾笺 · 本地笔记库  —  前端逻辑
   ============================================================ */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------------------------------------------------------- 图标 */
  const I = {
    chevron: '<svg viewBox="0 0 24 24" class="ico"><path d="M6 9l6 6 6-6"/></svg>',
    plus: '<svg viewBox="0 0 24 24" class="ico"><path d="M12 5v14M5 12h14"/></svg>',
    dots: '<svg viewBox="0 0 24 24" class="ico"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" class="ico"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" class="ico"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>',
    grid: '<svg viewBox="0 0 24 24" class="ico"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    star: '<svg viewBox="0 0 24 24" class="ico"><path d="M12 3.6l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.8l5.9-.8z"/></svg>',
    starFill: '<svg viewBox="0 0 24 24"><path d="M12 3.6l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.8l5.9-.8z"/></svg>',
    inbox: '<svg viewBox="0 0 24 24" class="ico"><path d="M4 13h4l1.5 2.5h5L16 13h4"/><path d="M5.5 5h13l1.5 8v5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18v-5z"/></svg>',
    doc: '<svg viewBox="0 0 24 24" class="ico"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',
    folder: '<svg viewBox="0 0 24 24" class="ico"><path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2.5h8A1.5 1.5 0 0 1 20 10v7.5a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3 17.5z"/></svg>',
    paperclip: '<svg viewBox="0 0 24 24" class="ico"><path d="M21 11l-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 6"/></svg>',
    download: '<svg viewBox="0 0 24 24" class="ico"><path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></svg>',
    x: '<svg viewBox="0 0 24 24" class="ico"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    code: '<svg viewBox="0 0 24 24" class="ico"><path d="M9 8l-4 4 4 4M15 8l4 4-4 4"/></svg>',
    bold: '<svg viewBox="0 0 24 24" class="ico"><path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"/></svg>',
    italic: '<svg viewBox="0 0 24 24" class="ico"><path d="M10 4h8M6 20h8M14.5 4l-3 16"/></svg>',
    strike: '<svg viewBox="0 0 24 24" class="ico"><path d="M4 12h16M8 8a4 3 0 0 1 8 0M8 16a4 3 0 0 0 8 0"/></svg>',
    quote: '<svg viewBox="0 0 24 24" class="ico"><path d="M9 7H5v5h4v5H5M19 7h-4v5h4v5h-4"/></svg>',
    list: '<svg viewBox="0 0 24 24" class="ico"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="18" r="1.2"/></svg>',
    listOrdered: '<svg viewBox="0 0 24 24" class="ico"><path d="M10 6h10M10 12h10M10 18h10"/><path d="M4 5h1v4M3 9h3"/><path d="M3.5 14h1.5a1 1 0 0 1 0 2H3.5h1.5a1 1 0 0 1 0 2H3.5"/></svg>',
    check: '<svg viewBox="0 0 24 24" class="ico"><path d="M4 12l5 5L20 6"/></svg>',
    link: '<svg viewBox="0 0 24 24" class="ico"><path d="M10 13a4.5 4.5 0 0 0 6.4 0l2.6-2.6a4.5 4.5 0 0 0-6.4-6.4L11.4 5.3"/><path d="M14 11a4.5 4.5 0 0 0-6.4 0L5 13.6a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/></svg>',
    table: '<svg viewBox="0 0 24 24" class="ico"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10M15 10v10"/></svg>',
    hr: '<svg viewBox="0 0 24 24" class="ico"><path d="M4 12h16"/></svg>',
    columns: '<svg viewBox="0 0 24 24" class="ico"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/></svg>',
    eye: '<svg viewBox="0 0 24 24" class="ico"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/></svg>',
    pen: '<svg viewBox="0 0 24 24" class="ico"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg>',
    image: '<svg viewBox="0 0 24 24" class="ico"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.4"/><path d="M4 17l5-5 4 4 3-3 4 4"/></svg>',
  };

  /* 只记「上次所在类别」，不记上次打开的那篇笔记：知识片段按类收集，
     冷启动回到类别/列表，别把人直接塞回某一条正文里继续写。 */
  const SJ_LAST_CAT = 'sj_last_cat';

  /* ---------------------------------------------------------- 状态 */
  const state = {
    categories: [],
    notes: [],
    selCat: 'all',
    selNote: null,
    search: '',
    tree: {},
    viewMode: localStorage.getItem('sj_view') || 'split',
    theme: localStorage.getItem('sj_theme') || 'light',
    richLh: (function () { const v = parseFloat(localStorage.getItem('sj_rich_lh')); return [1.8, 1.5, 1.3].includes(v) ? v : 1.8; })(),
    dirty: false,
  };

  const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name, 'zh');
  const catMap = () => new Map(state.categories.map((c) => [c.id, c]));
  const noteById = (id) => state.notes.find((n) => n.id === id) || null;

  /* ---------------------------------------------------------- 空白新建草稿
     -70：以前点「+」立刻 POST /api/notes，哪怕一个字没写也会落一条空白记录，
     切回列表 / 目录时就看见一篇「无标题笔记」。现改为先只在内存里放一篇草稿：
     离开编辑器时若仍全空就同步丢弃（一个请求都不发），有内容才落库。
     草稿不进 state.notes，因此不会被同步刷新 / 导入 / 整库导出当成真笔记。 */
  const DRAFT_ID = '__sj_draft__';
  let draftNote = null;      // 仅在编辑中的那篇空白草稿；落库或丢弃后即清空
  let draftSaving = null;    // 落库 Promise，防止并发重复创建两篇

  const draftFields = (n) => ({
    categoryId: n.categoryId || null,
    title: n.title || '', content: n.content || '',
    format: 'rich',
    starred: !!n.starred, tags: (n.tags || []).slice(),
  });

  /* 富文本编辑器空聚焦会留下 <p><br></p>，判空时要剥掉标签只剩文本。 */
  function blankContent(s) {
    const t = String(s || '');
    return !t.replace(/<br\s*\/?>/gi, '').replace(/<[^>]+>/g, '')
      .replace(/&nbsp;|\u00a0/gi, ' ').trim();
  }

  function isBlankNote(n) {
    if (!n) return true;
    if (String(n.title || '').trim()) return false;
    if (!blankContent(n.content)) return false;
    if (n.tags && n.tags.length) return false;
    if (n.attachments && n.attachments.length) return false;
    if (n.starred) return false;
    return true;
  }

  function discardDraft() {
    if (!draftNote) return;
    draftNote = null;
    state.selNote = null;
    state.dirty = false;
    savedSnapshot = '';
    clearEditDraft(DRAFT_ID);
    /* 空白草稿从未进过 state.notes，这里只需收起编辑器并重绘列表。 */
    closeEditor();
  }

  async function settleDraft(force) {
    if (!draftNote) return null;
    if (draftSaving) return draftSaving;
    const d = draftNote;
    if (!force && isBlankNote(d)) { discardDraft(); return null; }
    const sent = draftFields(d);
    const sentSig = JSON.stringify(sent);
    draftSaving = (async () => {
      try {
        const real = await api('/api/notes', { method: 'POST', body: sent });
        /* POST 往返期间可能又敲了字：把最新字段补回同一个对象，再 PATCH 写盘。
           保持对象身份，uploadFiles 等持有旧引用的代码不会写到已丢弃的草稿上。 */
        const cur = draftFields(d);
        Object.assign(d, real);
        state.notes.push(d);
        draftNote = null;
        if (state.selNote === DRAFT_ID) {
          state.selNote = d.id;
          state.dirty = false;
          savedSnapshot = snapshot(d);
          setSaveState('saved');
          clearEditDraft(DRAFT_ID);
        }
        if (JSON.stringify(cur) !== sentSig) {
          Object.assign(d, cur);
          const upd = await api(`/api/notes/${d.id}`, { method: 'PATCH', body: cur });
          Object.assign(d, upd);
          if (state.selNote === d.id) {
            savedSnapshot = snapshot(d);
            setSaveState('saved');
          }
        }
        renderList();
        renderTree();
        return d.id;
      } catch (e) {
        /* 落库失败不能丢内容：保留草稿并标脏，下次离开再试。 */
        if (state.selNote === DRAFT_ID) {
          state.dirty = true;
          setSaveState('error', '保存失败，请重试');
        }
        toast(e.message);
        return null;
      } finally { draftSaving = null; }
    })();
    return draftSaving;
  }

  async function guardDraftPath(path, method) {
    const prefix = '/api/notes/' + DRAFT_ID;
    if (!draftNote || path.indexOf(prefix) !== 0) return path;
    /* 读操作不为了一次查询凭空建笔记；写操作是用户明确动作，必须落库。 */
    const realId = await settleDraft(method !== 'GET');
    return realId ? '/api/notes/' + realId + path.slice(prefix.length) : path;
  }

  /* ---------------------------------------------------------- API
     云端版：路径与参数保持和本地版一致，实际读写走 SJCloud.api，
     由它映射到云端数据库。界面层完全感知不到差异。            */
  async function api(path, { method = 'GET', body } = {}) {
    path = await guardDraftPath(path, method);
    if (!window.SJLocal) throw new Error('本地存储未就绪');
    return window.SJLocal.api(path, { method, body });
  }

  /* ---------------------------------------------------------- Toast */
  let toastTimer;
  /* -66：加可选时长。页内下载「成功」时页面没有任何别的变化（没有窗口、没有跳页），
     两秒的 toast 常常看不到 —— 那正是 -64 让用户以为没下成的原因。关键结论给 4 秒。 */
  function toast(msg, ms) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms || 2000);
  }

  /* ---------------------------------------------------------- Markdown */
  marked.setOptions({ gfm: true, breaks: false, headerIds: false, mangle: false });

  const td = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
  });
  if (window.turndownPluginGfm) td.use(turndownPluginGfm.gfm);
  /* 富文本里调过宽度的图片，转 Markdown 时保留为 <img>，否则宽度会丢 */
  td.addRule('imgWithWidth', {
    filter: (node) => node.nodeName === 'IMG' && /(^|;)\s*width\s*:/i.test(node.getAttribute('style') || ''),
    replacement: (content, node) => {
      const src = node.getAttribute('src') || '';
      const alt = node.getAttribute('alt') || '';
      const w = ((/width\s*:\s*([^;]+)/i.exec(node.getAttribute('style') || '') || [])[1] || '').trim();
      return `<img src="${src}" alt="${alt}" style="width:${w}">`;
    },
  });

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function renderMarkdown(md) {
    let html = marked.parse(md || '');
    html = DOMPurify.sanitize(html, { ADD_ATTR: ['target', 'rel'] });
    return html;
  }
  /* mdconv.js 已在业务脚本之前加载（mobilesync.js 要用它转换云端旧行），
     这里复用同一套渲染入口，避免两处实现漂移。 */
  window.SJRenderMarkdown = renderMarkdown;

  function decorate(container) {
    container.querySelectorAll('pre').forEach((pre) => {
      const code = pre.querySelector('code');
      if (code && window.hljs) {
        try { hljs.highlightElement(code); } catch (_) {}
      }
      if (!pre.querySelector('.copy-code')) {
        const btn = document.createElement('button');
        btn.className = 'copy-code';
        btn.textContent = '复制';
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(code ? code.innerText : '').then(() => {
            btn.textContent = '已复制';
            setTimeout(() => (btn.textContent = '复制'), 1200);
          });
        });
        pre.appendChild(btn);
      }
    });
    container.querySelectorAll('a').forEach((a) => {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    });
    container.querySelectorAll('img').forEach((im, i) => { im.dataset.imgIdx = i; });
  }

  /* ---------------------------------------------------------- 图片尺寸
     两模式共用一条底部工具条：
       · 富文本：改 #richPane 内 img 的 style.width，随 onRichInput 落盘
       · Markdown：定位 md 源里第 N 个图片 token，把 ![](url) 换成
         <img src="url" style="width:50%">（marked 原样输出，DOMPurify 保留 style）
     宽度统一存 style.width，导出也能带上。 */
  let imgSizer = null, imgEl = null, imgIdx = -1, imgMode = '';

  function ensureImgSizer() {
    if (imgSizer) return imgSizer;
    const el = document.createElement('div');
    el.className = 'img-sizer hidden';
    el.innerHTML = `
      <span class="img-sizer-label">图片宽度</span>
      <button type="button" data-w="25">25%</button>
      <button type="button" data-w="50">50%</button>
      <button type="button" data-w="75">75%</button>
      <button type="button" data-w="100">100%</button>
      <button type="button" data-w="reset" class="is-ghost">原始</button>
      <input type="range" min="10" max="100" step="5" value="100" aria-label="图片宽度">
      <span class="img-sizer-pct">100%</span>
      <button type="button" data-w="close" class="is-ghost is-close" aria-label="关闭">×</button>`;
    document.body.appendChild(el);
    imgSizer = el;

    const range = el.querySelector('input[type=range]');
    const pctText = el.querySelector('.img-sizer-pct');
    el.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-w]');
      if (!btn) return;
      const v = btn.dataset.w;
      if (v === 'close') return closeImgSizer();
      if (v === 'reset') { applyImgWidth(null); range.value = 100; pctText.textContent = '100%'; return; }
      const n = parseInt(v, 10);
      range.value = n; pctText.textContent = n + '%';
      applyImgWidth(n);
    });
    range.addEventListener('input', () => {
      pctText.textContent = range.value + '%';
      liveImgWidth(parseInt(range.value, 10));
    });
    range.addEventListener('change', () => {
      applyImgWidth(parseInt(range.value, 10));
    });
    return el;
  }

  function readImgPct(img) {
    const w = img.style.width || img.getAttribute('width') || '';
    const pm = /([\d.]+)\s*%/.exec(w);
    if (pm) return Math.round(parseFloat(pm[1]));
    const px = /([\d.]+)\s*px/.exec(w);
    if (px) {
      const host = img.parentElement;
      const base = host ? host.clientWidth : 0;
      if (base) return Math.min(100, Math.max(10, Math.round(parseFloat(px[1]) / base * 100)));
    }
    return 100;
  }

  function liveImgWidth(pct) {
    if (!imgEl) return;
    imgEl.style.width = pct + '%';
  }

  function applyImgWidth(pct) {
    if (!imgEl) return;
    if (pct == null) {
      imgEl.style.removeProperty('width');
      imgEl.removeAttribute('width');
    } else {
      imgEl.style.width = pct + '%';
      imgEl.setAttribute('width', pct + '%');
    }
    if (imgMode === 'rich') {
      onRichInput();
    }
  }

  function openImgSizer(img, mode, idx) {
    ensureImgSizer();
    $$('img.sj-img-picked').forEach((x) => x.classList.remove('sj-img-picked'));
    imgEl = img;
    imgMode = mode;
    imgIdx = idx;
    img.classList.add('sj-img-picked');
    const pct = readImgPct(img);
    imgSizer.querySelector('input[type=range]').value = pct;
    imgSizer.querySelector('.img-sizer-pct').textContent = pct + '%';
    imgSizer.classList.remove('hidden');
  }

  function closeImgSizer() {
    if (imgSizer) imgSizer.classList.add('hidden');
    $$('img.sj-img-picked').forEach((x) => x.classList.remove('sj-img-picked'));
    imgEl = null; imgIdx = -1; imgMode = '';
  }

  function bindImgResize(container, mode) {
    if (!container) return;
    container.addEventListener('click', (e) => {
      /* 手机端走详情页自己的图片操作条（上移/下移/删除），不开桌面这条宽度条；
         这里直接放行，别 stopPropagation，否则点正文进编辑会被它吃掉。 */
      if (NARROW()) return;
      const img = e.target.closest ? e.target.closest('img') : null;
      if (!img || !container.contains(img)) return;
      e.preventDefault();
      e.stopPropagation();
      const idx = mode === 'md'
        ? Array.prototype.indexOf.call(container.querySelectorAll('img'), img)
        : parseInt(img.dataset.imgIdx || '0', 10);
      openImgSizer(img, mode, idx);
    });
  }

  document.addEventListener('click', (e) => {
    if (!imgSizer || imgSizer.classList.contains('hidden')) return;
    if (imgSizer.contains(e.target)) return;
    if (e.target.closest && e.target.closest('img')) return;
    closeImgSizer();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeImgSizer();
  });

  /* ---------------------------------------------------------- 渲染：目录树 */
  function subtreeCount(catId, notes) {
    const ids = new Set([catId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const c of state.categories) {
        if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
          ids.add(c.id);
          changed = true;
        }
      }
    }
    return notes.filter((n) => ids.has(n.categoryId)).length;
  }

  /* —— 合并导航树：分类/伪节点下直接嵌套笔记行；伪节点可展开列出笔记 —— */
  function isOpen(key) {
    if (key === 'all' || key === 'starred' || key === 'uncat') return !!state.tree[key];
    return false;
  }
  function setOpen(key, val) {
    if (key === 'all' || key === 'starred' || key === 'uncat') state.tree[key] = val;
  }
  function togglePseudo(key) { setOpen(key, !isOpen(key)); }

  function notesUnder(catId) {
    return state.notes.filter((n) => n.categoryId === catId);
  }

  /* 一次只展开一层：目标分类的父链保持展开，目标展开后只露出「子分类 + 本级笔记」；
     目标之下的子分类一律收起（不往下自动展开），其余旁支分类也收起。 */
  function openOnly(targetId, open) {
    const target = state.categories.find((c) => c.id === targetId);
    if (!target) return;
    ['all', 'starred', 'uncat'].forEach((k) => setOpen(k, false));
    const chain = new Set();
    for (let cur = target; cur;) {
      chain.add(cur.id);
      cur = cur.parentId ? state.categories.find((c) => c.id === cur.parentId) : null;
    }
    const desc = new Set();
    (function walk(pid) {
      state.categories.forEach((c) => {
        if (c.parentId === pid && !desc.has(c.id)) { desc.add(c.id); walk(c.id); }
      });
    })(targetId);
    /* 若正打开某篇笔记，保持其所在分类链始终展开，避免点击别的分类时把高亮项折起来看不见。 */
    const noteOpen = state.selNote && state.selNote !== DRAFT_ID;
    const tacChain = new Set();
    if (noteOpen) {
      let cur = state.categories.find((c) => c.id === treeActiveCat());
      while (cur) { tacChain.add(cur.id); cur = cur.parentId ? state.categories.find((c) => c.id === cur.parentId) : null; }
    }
    const patch = [];
    state.categories.forEach((c) => {
      let want = desc.has(c.id) ? false : (c.id === targetId ? !!open : chain.has(c.id));
      if (tacChain.has(c.id)) want = true;
      if (!!c.expanded !== want) { c.expanded = want; patch.push(c.id); }
    });
    patch.forEach((cid) => {
      const c = state.categories.find((x) => x.id === cid);
      api(`/api/categories/${cid}`, { method: 'PATCH', body: { expanded: !!c.expanded } }).catch(() => {});
    });
  }

  /* 点伪节点（全部笔记 / 收藏 / 未分类）时收起所有分类，保持「一次只亮一个」。 */
  function accordion(except) {
    ['all', 'starred', 'uncat'].forEach((k) => { if (k !== except) setOpen(k, false); });
    /* 正打开笔记时保留其分类不收起，否则高亮项会被折起来看不见。 */
    const noteOpen = state.selNote && state.selNote !== DRAFT_ID;
    const keep = noteOpen ? treeActiveCat() : null;
    state.categories.filter((c) => c.expanded && c.id !== keep)
      .forEach((c) => {
        c.expanded = false;
        api(`/api/categories/${c.id}`, { method: 'PATCH', body: { expanded: false } }).catch(() => {});
      });
  }

  /* 树的高亮归属：有笔记打开时跟随该笔记的分类；否则跟随当前筛选分类。
     这样「右侧打开哪篇，左侧就高亮并展开哪篇的分类」，而不是停在之前选的筛选分类。 */
  function treeActiveCat() {
    if (state.selNote && state.selNote !== DRAFT_ID) {
      const n = noteById(state.selNote);
      if (n) return n.categoryId || 'uncat';
    }
    return state.selCat;
  }
  /* 只保证目标分类及其祖先链展开，不收起其它已展开分类（与 openOnly 的「只亮一个」不同）。
     用于打开笔记时把左侧树定位到该笔记所在分类。 */
  function expandChain(catId) {
    let cur = state.categories.find((c) => c.id === catId);
    while (cur) {
      if (!cur.expanded) {
        cur.expanded = true;
        api(`/api/categories/${cur.id}`, { method: 'PATCH', body: { expanded: true } }).catch(() => {});
      }
      cur = cur.parentId ? state.categories.find((c) => c.id === cur.parentId) : null;
    }
  }

  /* depth = 所属分类的层级；笔记在分类标签下方再缩进一级，且只显示标题（不带标签/日期）。
     行内 padding-left 直接算出来，不依赖嵌套 .tree-children 累积缩进。 */
  /* scope = 该笔记被渲染时所处容器的键：'all' / 'starred' / 'uncat' 或分类 id。
     只有渲染在「自己的归属容器」里时才算 active，这样打开一篇笔记时它只会在
     其真实分类下高亮，而不会在「全部笔记」等伪节点下也跟着高亮。 */
  function noteRow(n, depth, scope) {
    const d = depth || 0;
    const home = n.categoryId || 'uncat';
    const active = state.selNote === n.id && scope === home;
    const row = document.createElement('div');
    row.className = 'tree-note' + (active ? ' active' : '') + (batchSel.has(n.id) ? ' selected' : '');
    row.dataset.nid = n.id;
    row.draggable = true;
    row.style.paddingLeft = 28 + d * 18 + 'px';
    row.title = n.title || '无标题笔记';
    /* 批量子集不换 DOM 结构：勾选框常驻，只在 .tree.batch-mode 时显形，
       这样进出多选不必重建整棵树，行高也不会跳。 */
    row.innerHTML = `
      <input type="checkbox" class="tree-note-check"${batchSel.has(n.id) ? ' checked' : ''} aria-label="选择这篇笔记">
      <span class="tree-note-dot"></span>
      <span class="tree-note-title">${n.starred ? I.starFill.replace('<svg', '<svg fill="currentColor"') : ''}<span class="tree-note-name">${escapeHtml(n.title || '无标题笔记')}</span></span>`;
    return row;
  }

  function highlightTitle(row, term) {
    if (!term) return;
    const el = row.querySelector('.tree-note-name');
    if (!el) return;
    const safe = escapeHtml(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try {
      el.innerHTML = escapeHtml(el.textContent).replace(new RegExp('(' + safe + ')', 'ig'), '<mark>$1</mark>');
    } catch (_) {}
  }

  function renderSearchResults(tree) {
    const q = state.search.trim();
    let list;
    if (window.SJFts) {
      const ids = window.SJFts.rank(q, state.notes);
      const map = new Map(state.notes.map((n) => [n.id, n]));
      list = ids.map((id) => map.get(id)).filter(Boolean);
    } else {
      const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
      list = state.notes.filter((n) => {
        const hay = (n.title + ' ' + (n.tags || []).join(' ') + ' ' + plainText(n)).toLowerCase();
        return terms.every((t) => t.indexOf('tag:') === 0
          ? (n.tags || []).some((x) => String(x).toLowerCase().includes(t.slice(4)))
          : hay.includes(t));
      });
    }
    const head = document.createElement('div');
    head.className = 'tree-row static';
    head.innerHTML = `<span class="caret leaf"></span><span class="tree-label">搜索结果 · ${list.length}</span>`;
    tree.appendChild(head);
    const box = document.createElement('div');
    box.className = 'tree-children';
    if (!list.length) {
      const tip = document.createElement('div');
      tip.className = 'tree-empty';
      tip.textContent = '没有找到相关笔记';
      box.appendChild(tip);
    } else {
      list.forEach((n) => {
        const r = noteRow(n, 0, n.categoryId || 'uncat');
        highlightTitle(r, q.trim().split(/\s+/).filter(Boolean)[0]);
        box.appendChild(r);
      });
    }
    tree.appendChild(box);
  }

  function pseudoRow(key, label, icon, count) {
    const open = isOpen(key);
    const row = document.createElement('div');
    row.className = 'tree-row' + (treeActiveCat() === key ? ' active' : '') + (open ? '' : ' collapsed');
    row.dataset.pseudo = key;
    row.innerHTML = `
      <span class="caret" data-act="toggle">${I.chevron}</span>
      <span class="tree-label" style="padding-left:2px">${label}</span>
      <span class="tree-count">${count}</span>`;
    row.querySelector('.tree-label').insertAdjacentHTML('afterbegin', icon.replace('class="ico"', 'class="ico" style="width:14px;height:14px;margin-right:7px;vertical-align:-2px"'));
    return row;
  }

  function renderTree() {
    const tree = $('#tree');
    if (!tree) return;
    tree.innerHTML = '';
    if (state.search.trim()) { renderSearchResults(tree); return; }

    $('#statText').textContent = `${state.notes.length} 篇 · ${state.categories.length} 个类别`;

    const nodes = [
      { key: 'all', label: '全部笔记', icon: I.grid, list: state.notes },
      { key: 'starred', label: '收藏', icon: I.star, list: state.notes.filter((n) => n.starred) },
      { key: 'uncat', label: '未分类', icon: I.inbox, list: state.notes.filter((n) => !n.categoryId) },
    ];
    nodes.forEach((node) => {
      const wrap = document.createElement('div');
      wrap.className = 'tree-node';
      wrap.appendChild(pseudoRow(node.key, node.label, node.icon, node.list.length));
      if (isOpen(node.key)) {
        const box = document.createElement('div');
        box.className = 'tree-children';
        node.list.forEach((n) => box.appendChild(noteRow(n, 0, node.key)));
        wrap.appendChild(box);
      }
      tree.appendChild(wrap);
    });

    const divider = document.createElement('div');
    divider.style.cssText = 'height:1px;background:var(--border);margin:7px 10px';
    tree.appendChild(divider);

    const roots = state.categories.filter((c) => !c.parentId).sort(byOrder);
    if (!roots.length) {
      const tip = document.createElement('div');
      tip.className = 'tree-empty';
      tip.textContent = '还没有类别。点右上角 + 建立第一个类别，比如「业务学习」。';
      tree.appendChild(tip);
      renderTags();
      return;
    }
    roots.forEach((c) => tree.appendChild(catNode(c, 0)));
    renderTags();
  }

  function catNode(cat, depth) {
    const frag = document.createDocumentFragment();
    const kids = state.categories.filter((c) => c.parentId === cat.id).sort(byOrder);
    const collapsed = !cat.expanded;
    const open = !collapsed;

    const row = document.createElement('div');
    row.className = 'tree-row' + (treeActiveCat() === cat.id ? ' active' : '') + (open ? '' : ' collapsed');
    row.dataset.id = cat.id;
    row.dataset.depth = depth;
    row.style.paddingLeft = 4 + depth * 18 + 'px';
    row.innerHTML = `
      <span class="caret${kids.length ? '' : ' leaf'}" data-act="toggle">${I.chevron}</span>
      <span class="tree-label">${I.folder.replace('class="ico"', 'class="ico tree-folder"')}${escapeHtml(cat.name)}</span>
      <span class="tree-count">${subtreeCount(cat.id, state.notes)}</span>
      <span class="tree-acts">
        <button class="tree-act" data-act="add" title="新建子类别">${I.plus}</button>
        <button class="tree-act" data-act="more" title="更多">${I.dots}</button>
      </span>`;
    frag.appendChild(row);

    if (open) {
      const box = document.createElement('div');
      box.className = 'tree-children';
      kids.forEach((k) => box.appendChild(catNode(k, depth + 1)));
      notesUnder(cat.id).forEach((n) => box.appendChild(noteRow(n, depth, cat.id)));
      frag.appendChild(box);
    }
    return frag;
  }

  function toggleCat(id) {
    const cat = state.categories.find((c) => c.id === id);
    if (!cat) return;
    /* 展开时把子分类一并收起，保证每点一次只多露一层 */
    openOnly(id, !cat.expanded);
    renderTree();
  }

  /* ---------------------------------------------------------- 渲染：笔记列表 */
  const fmtDate = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const yest = new Date(now);
    yest.setDate(now.getDate() - 1);
    const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    if (sameDay) return `今天 ${hm}`;
    if (d.toDateString() === yest.toDateString()) return `昨天 ${hm}`;
    if (d.getFullYear() === now.getFullYear()) return `${d.getMonth() + 1}月${d.getDate()}日`;
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  };

  function plainText(note) {
    /* 用 DOMParser 取纯文本：不挂载节点、不加载资源、不触发 onerror。
       直接 innerHTML 会让 <img onerror> 在游离节点里也发起加载并执行，
       恶意备份/云端数据可借此窃取全部笔记（存储型 XSS）。 */
    const t = new DOMParser()
      .parseFromString(String(note.content || ''), 'text/html').body.textContent || '';
    return t.replace(/\s+/g, ' ').trim();
  }

  /* ---------------------------------------------------------- 列表批量整理（-72）
     排序与置顶是「本机视图偏好」，存 localStorage，不写进笔记数据：
     不动数据格式、不动服务端 / 同步 / 导出 / 旧库；换设备不跟随（已知取舍）。 */
  const SORT_KEY = 'sj_sort_v1';
  const PIN_KEY = 'sj_pinned_v1';
  let batchMode = false;
  const batchSel = new Set();

  function pinnedIds() {
    try { const v = JSON.parse(localStorage.getItem(PIN_KEY) || '[]'); return Array.isArray(v) ? v : []; }
    catch (_) { return []; }
  }
  function setPinnedIds(ids) {
    try { localStorage.setItem(PIN_KEY, JSON.stringify(ids.slice(0, 200))); } catch (_) {}
  }
  function sortNotes(list) {
    let mode = 'updated';
    try { mode = localStorage.getItem(SORT_KEY) || 'updated'; } catch (_) {}
    const pins = new Set(pinnedIds());
    return list.slice().sort((a, b) => {
      const pa = pins.has(a.id) ? 1 : 0, pb = pins.has(b.id) ? 1 : 0;
      if (pa !== pb) return pb - pa;                       // 置顶恒在最前
      if (mode === 'created') return (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0);
      if (mode === 'title') return String(a.title || '').localeCompare(String(b.title || ''), 'zh');
      return (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0);
    });
  }
  function batchNotes() { return state.notes.filter((n) => batchSel.has(n.id)); }
  function exitBatch() { batchMode = false; batchSel.clear(); renderList(); renderTree(); }
  function toggleBatch(id) {
    if (!id) return;
    if (batchSel.has(id)) batchSel.delete(id); else batchSel.add(id);
    renderList();
    renderTree();
  }
  function renderBatchBar() {
    const bar = $('#sjBatchBar');
    if (bar) { bar.classList.toggle('hidden', !batchMode); placeBatchBar(bar); }
    const cnt = $('#sjBatchCount');
    if (cnt) cnt.textContent = batchMode ? `已选 ${batchSel.size} 篇` : '';
    /* 入口按钮双落位：宽屏挂到目录树头（桌面端列表栏整栏隐藏，原位置看不见），
       窄屏仍旧留在列表头。窗口跨界时靠这里重新落位，无需额外监听。 */
    const btn = $('#sjBatchBtn');
    if (btn) {
      btn.classList.toggle('on', batchMode);
      const want = (!NARROW() && $('.tree-head:not(.tag-head) .tree-head-actions'))
        || $('.list-head .list-head-actions');
      if (want && btn.parentElement !== want) want.insertBefore(btn, want.firstChild);
    }
    const list = $('#noteList');
    if (list) list.classList.toggle('batch-mode', batchMode);
    const tree = $('#tree');
    if (tree) tree.classList.toggle('batch-mode', batchMode);
  }
  /* 批量整理条落位。宽屏没有列表栏可挂，改浮在编辑区底部（.editor-pane 已是
     position:relative），只在这种临时模式下出现，不占文档高度、不动既有布局；
     窄屏保持原样：列表栏内、笔记列表上方。 */
  function placeBatchBar(bar) {
    if (!bar) return;
    const wide = !NARROW();
    const host = wide ? $('.editor-pane') : $('.list-pane');
    if (!host) return;
    bar.classList.toggle('float', wide);
    if (bar.parentElement === host) return;
    const list = $('#noteList');
    if (!wide && list && list.parentElement === host) host.insertBefore(bar, list);
    else host.appendChild(bar);
  }
  /* 跨 980px 边界时把入口按钮与整理条重新落位：不监听的话，宽屏切窄屏后
     按钮会留在已被抽屉化的树头里，列表头反而找不到多选入口。 */
  window.addEventListener('resize', () => renderBatchBar());
  function batchUI() {
    const head = $('.list-head');
    if (!head) return;
    let acts = head.querySelector('.list-head-actions');
    if (!acts) {
      /* 桌面版 index.html 没有 .list-head-actions 容器，动态补一个并把
         原有「新建」按钮移进去，两端结构就一致了（不改 HTML）。 */
      acts = document.createElement('div');
      acts.className = 'list-head-actions';
      const nb = $('#newNoteBtn2');
      if (nb) acts.appendChild(nb);
      head.appendChild(acts);
    }
    if (!$('#sjBatchBtn')) {
      const btn = document.createElement('button');
      btn.className = 'icon-btn sm'; btn.id = 'sjBatchBtn';
      btn.title = '多选整理'; btn.setAttribute('aria-label', '多选整理');
      /* 与目录头其它按钮同一套线性图标，避免 ☑ 字形被系统字体画成实心方块 */
      btn.innerHTML = '<svg viewBox="0 0 24 24" class="ico"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.4 12.4l2.6 2.6 4.6-5.2"/></svg>';
      btn.addEventListener('click', () => {
        batchMode = !batchMode;
        if (!batchMode) batchSel.clear();
        renderList();
      });
      acts.insertBefore(btn, acts.firstChild);
      const sel = document.createElement('select');
      sel.id = 'sjSortSel'; sel.className = 'sj-sort-sel';
      sel.innerHTML = '<option value="updated">按更新时间</option>'
        + '<option value="created">按创建时间</option>'
        + '<option value="title">按标题</option>';
      try { sel.value = localStorage.getItem(SORT_KEY) || 'updated'; } catch (_) {}
      sel.addEventListener('change', () => {
        try { localStorage.setItem(SORT_KEY, sel.value); } catch (_) {}
        renderList();
      });
      acts.appendChild(sel);
    }
    if (!$('#sjBatchBar')) {
      const bar = document.createElement('div');
      bar.id = 'sjBatchBar'; bar.className = 'sj-batch-bar hidden';
      bar.innerHTML = '<span id="sjBatchCount"></span>'
        + '<button class="btn ghost" data-batch="move">移动类别</button>'
        + '<button class="btn ghost" data-batch="pin">置顶/取消</button>'
        + '<button class="btn ghost" data-batch="export">导出 Markdown</button>'
        + '<button class="btn ghost danger" data-batch="del">移到回收站</button>'
        + '<button class="btn ghost" data-batch="exit">退出多选</button>';
      bar.addEventListener('click', (e) => {
        const b = e.target.closest('[data-batch]');
        if (!b) return;
        const act = b.dataset.batch;
        if (act === 'move') batchMove();
        else if (act === 'pin') batchPin();
        else if (act === 'export') batchExport();
        else if (act === 'del') batchDelete();
        else if (act === 'exit') exitBatch();
      });
      const pane = $('.list-pane');
      if (pane) pane.insertBefore(bar, $('#noteList'));
    }
    renderBatchBar();
  }
  function batchMove() {
    const ids = [...batchSel];
    if (!ids.length) { toast('先勾选笔记'); return; }
    const opts = ['<option value="">未分类</option>']
      .concat(state.categories.map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`)).join('');
    const m = window.openModal(
      '<div class="hist-head"><div><h3>批量移动类别</h3><p>已选 ' + ids.length + ' 篇</p></div>'
      + '<button class="icon-btn" data-act="close" title="关闭">✕</button></div>'
      + '<div class="sj-batch-form"><select id="sjBatchCat" class="tag-input" style="width:100%">' + opts + '</select>'
      + '<div class="modal-actions"><button class="btn ghost" data-act="close">取消</button>'
      + '<button class="btn primary" id="sjBatchGo">移动</button></div></div>');
    m.querySelectorAll('[data-act="close"]').forEach((b) => b.addEventListener('click', window.closeModal));
    m.querySelector('#sjBatchGo').addEventListener('click', async () => {
      const cat = m.querySelector('#sjBatchCat').value || null;
      let ok = 0;
      /* 只发 categoryId，绝不整篇覆盖（与标签 PATCH 同一条约束）。 */
      for (const id of ids) {
        try {
          await api(`/api/notes/${id}`, { method: 'PATCH', body: { categoryId: cat } });
          /* 服务端改完，内存里那份也要改：树和列表都拿 state.notes 渲染，
             不改就会「界面仍在原分类、刷新后才跳过去」（本地没有实时推送）。
             顺手修的是同一类「改完不刷新」的毛病，不是新功能。 */
          const n = noteById(id);
          if (n) { n.categoryId = cat; n.updatedAt = Date.now(); }
          ok++;
        } catch (_) {}
      }
      window.closeModal();
      exitBatch();
      toast(`已移动 ${ok} 篇到${cat ? '所选类别' : '未分类'}`);
      if (window.SJRefresh) window.SJRefresh();
      /* 当前打开的那篇若在被移动之列，编辑区那句分类名也要跟着变。 */
      refreshMetaFor(noteById(state.selNote));
    });
  }
  function batchPin() {
    const ids = [...batchSel];
    if (!ids.length) { toast('先勾选笔记'); return; }
    const pins = new Set(pinnedIds());
    const allPinned = ids.every((id) => pins.has(id));
    ids.forEach((id) => { if (allPinned) pins.delete(id); else pins.add(id); });
    setPinnedIds([...pins]);
    renderList();
    toast(allPinned ? `已取消置顶 ${ids.length} 篇` : `已置顶 ${ids.length} 篇`);
  }
  function batchExport() {
    const list = batchNotes();
    if (!list.length) { toast('先勾选笔记'); return; }
    const parts = list.map((n) => {
      let body = n.content || '';
      if (typeof td !== 'undefined' && td && td.turndown) {
        try { body = td.turndown(body); } catch (_) {}
      }
      return `# ${n.title || '无标题笔记'}\n\n${body}\n`;
    });
    const text = parts.join('\n---\n\n');
    const name = `拾笺批量导出-${new Date().toISOString().slice(0, 10)}.md`;
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    /* 云端走 -67 已验证的页内下载通道；桌面用标准锚点下载。 */
    if (window.SJSaveBlobFile) { window.SJSaveBlobFile(blob, name); }
    else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.download = name; a.href = url; a.style.display = 'none';
      document.body.appendChild(a); a.click();
      setTimeout(() => { try { URL.revokeObjectURL(url); a.remove(); } catch (_) {} }, 60000);
    }
    toast(`已导出 ${list.length} 篇（合并为一个 Markdown 文件）`);
  }
  function batchDelete() {
    const ids = [...batchSel];
    if (!ids.length) { toast('先勾选笔记'); return; }
    openConfirm({
      title: '批量移到回收站',
      /* -68：DELETE 是软删除，文案必须与行为一致。 */
      message: `选中的 ${ids.length} 篇笔记将移到回收站，附件一并保留，30 天内可恢复。`,
      confirmText: '移到回收站',
      danger: true,
      onConfirm: async () => {
        let ok = 0;
        for (const id of ids) {
          try { await api(`/api/notes/${id}`, { method: 'DELETE' }); ok++; } catch (_) {}
        }
        const doomed = new Set(ids);
        state.notes = state.notes.filter((n) => !doomed.has(n.id));
        if (state.selNote && doomed.has(state.selNote)) closeEditor();
        exitBatch();
        toast(`已移到回收站 ${ok} 篇，30 天内可恢复`);
        if (window.SJRefresh) window.SJRefresh();
      },
    });
  }

  function notesInScope() {
    let list = state.notes;
    if (state.search.trim()) {
      /* v1.8.0：优先用全文检索索引（中文分词 + 相关度排序）；模块未加载时回退到原来的子串匹配 */
      const q = state.search.trim();
      if (window.SJFts) {
        const ids = new Set(window.SJFts.rank(q, state.notes));
        list = state.notes.filter((n) => ids.has(n.id));
      } else {
        const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
        list = state.notes.filter((n) => {
          const hay = (n.title + ' ' + (n.tags || []).join(' ') + ' ' + plainText(n)).toLowerCase();
          return terms.every((t) => t.indexOf('tag:') === 0
            ? (n.tags || []).some((x) => String(x).toLowerCase().includes(t.slice(4)))
            : hay.includes(t));
        });
      }
      return sortNotes(list);
    }
    if (state.selCat === 'starred') list = list.filter((n) => n.starred);
    else if (state.selCat === 'uncat') list = list.filter((n) => !n.categoryId);
    else if (String(state.selCat).startsWith('tag:')) {
      const tag = state.selCat.slice(4);
      list = list.filter((n) => (n.tags || []).includes(tag));
    }
    else if (state.selCat !== 'all') {
      const ids = new Set([state.selCat]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const c of state.categories) {
          if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) { ids.add(c.id); changed = true; }
        }
      }
      list = list.filter((n) => ids.has(n.categoryId));
    }
    return sortNotes(list);
  }

  function renderList() {
    /* 每次切换类别都会重绘列表，顺手把当前类别记下来（值不变就不写盘）。
       比逐个给 selCat 赋值点加钩子可靠，也不会漏掉标签/收藏等伪类别。 */
    try {
      const v = String(state.selCat || 'all');
      if (localStorage.getItem(SJ_LAST_CAT) !== v) localStorage.setItem(SJ_LAST_CAT, v);
    } catch (_) {}
    const box = $('#noteList');
    const list = notesInScope();
    box.innerHTML = '';
    batchUI();
    /* 首页网格与「最近笔记」跟列表同一份数据，这里统一刷一次：
       所有会改 state 的入口最终都会走到 renderList，不必到处埋钩子。 */
    renderHome();
    renderRecent();

    let title = '全部笔记';
    if (state.search.trim()) title = '搜索结果';
    else if (state.selCat === 'starred') title = '收藏';
    else if (state.selCat === 'uncat') title = '未分类';
    else if (String(state.selCat).startsWith('tag:')) title = '#' + state.selCat.slice(4);
    else if (state.selCat !== 'all') title = (state.categories.find((c) => c.id === state.selCat) || {}).name || '笔记';
    $('#listTitle').textContent = title;
    $('#listCount').textContent = list.length ? `${list.length} 篇` : '';
    syncBarTitle();
    if (window.SJSyncHomeHead) window.SJSyncHomeHead();
    /* 首页整条列表栏现在是滚动容器（大标题要跟着内容滚），
       换类别 / 搜索后回到顶部，和以前清空 innerHTML 的效果一致 */
    if (NARROW() && !document.body.classList.contains('sj-note-open')) {
      const pane = document.querySelector('.list-pane');
      if (pane && pane.scrollTop) pane.scrollTop = 0;
    }
    if (window.SJSyncHome) window.SJSyncHome();

    if (!list.length) {
      const tip = document.createElement('div');
      tip.className = 'list-empty';
      tip.innerHTML = state.search.trim()
        ? `<strong>没有找到相关笔记</strong>换个关键词试试`
        : `<strong>这里还是空的</strong>点右上角 + 写第一篇笔记`;
      box.appendChild(tip);
      return;
    }

    const frag = document.createDocumentFragment();
    const pins = new Set(pinnedIds());
    for (const n of list) {
      const card = document.createElement('div');
      card.className = 'note-card' + (state.selNote === n.id ? ' active' : '') + (batchSel.has(n.id) ? ' selected' : '');
      card.dataset.id = n.id;
      card.draggable = !batchMode;
      const snippet = plainText(n).slice(0, 90);
      card.innerHTML = `
        <input type="checkbox" class="sj-sel" ${batchSel.has(n.id) ? 'checked' : ''} aria-label="选择这篇笔记">
        <button class="note-more" data-more="1" aria-label="更多操作" title="更多操作">${I.dots}</button>
        ${pins.has(n.id) ? '<span class="sj-pin">置顶</span>' : ''}
        <div class="note-card-title">
          ${n.starred ? I.starFill.replace('<svg', '<svg fill="currentColor"') : ''}
          <span>${escapeHtml(n.title || '无标题笔记')}</span>
        </div>
        ${n.tags && n.tags.length ? `<div class="note-card-tags">${n.tags.slice(0, 3).map((t) => `<span class="tag-chip">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
        <div class="note-card-snippet">${escapeHtml(snippet) || '空笔记'}</div>
        <div class="note-card-foot">
          <span>${fmtDate(n.updatedAt)}</span>
          ${n.attachments && n.attachments.length ? `<span class="dot"></span><span class="att-badge">${I.paperclip}${n.attachments.length}</span>` : ''}
        </div>`;
      frag.appendChild(card);
    }
    box.appendChild(frag);
  }

  /* ---------------------------------------------------------- 最近笔记 */
  /* 侧栏顶部「最近笔记」：按更新时间取前 6 条，平铺显示，点它直接进编辑。
     默认收起（目录高度优先），展开/收起状态存本地。 */
  const RECENT_KEY = 'sj_recent_collapsed';
  const RECENT_N = 6;
  function recentNotes() {
    return state.notes.slice()
      .sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0))
      .slice(0, RECENT_N);
  }
  function renderRecent() {
    const list = $('#recentList');
    if (!list) return;
    list.innerHTML = recentNotes().map((n) => `
      <div class="recent-item${state.selNote === n.id ? ' active' : ''}" data-nid="${n.id}" title="${escapeHtml(n.title || '无标题笔记')}">
        ${I.doc.replace('class="ico"', 'class="ico recent-ico"')}
        <span class="recent-title">${escapeHtml(n.title || '无标题笔记')}</span>
        <span class="recent-date">${fmtDate(n.updatedAt)}</span>
      </div>`).join('');
  }
  function applyRecentState() {
    const sec = $('#recentSection');
    if (!sec) return;
    let collapsed = true;
    try { collapsed = localStorage.getItem(RECENT_KEY) !== '0'; } catch (_) {}
    sec.classList.toggle('collapsed', collapsed);
    const head = $('#recentHead');
    if (head) head.setAttribute('aria-expanded', String(!collapsed));
  }
  function toggleRecent() {
    const sec = $('#recentSection');
    if (!sec) return;
    const collapsed = !sec.classList.contains('collapsed');
    sec.classList.toggle('collapsed', collapsed);
    try { localStorage.setItem(RECENT_KEY, collapsed ? '1' : '0'); } catch (_) {}
    const head = $('#recentHead');
    if (head) head.setAttribute('aria-expanded', String(!collapsed));
  }

  /* ---------------------------------------------------------- 首页卡片网格 */
  /* 没打开笔记时主区显示的东西：两个视图（笔记 / 文件夹）。
     笔记卡 = 图标 + 标题 + 摘要 + 分类路径 + 日期，把合并掉列表栏后
     丢掉的卡片信息补回来；文件夹卡 = 名字 + 子文件夹数 + 笔记数 + 最后更新。 */
  let homeTab = 'notes';
  function catPath(id) {
    const parts = [];
    let c = state.categories.find((x) => x.id === id);
    let guard = 0;
    while (c && guard++ < 12) {
      parts.unshift(c.name);
      const pid = c.parentId;
      c = pid ? state.categories.find((x) => x.id === pid) : null;
    }
    return parts.join(' / ');
  }
  /* 编辑区第二行那句「分类名 ▾ · 创建于 …」。
     分类单独做成按钮：之前整行是一个可点元素，鼠标移到日期上也会高亮，
     点日期也弹分类选择器 —— 范围太大了。抽成函数是因为改完分类要就地重写这一行。 */
  function metaInfoHTML(note) {
    const cat = catMap().get(note.categoryId);
    const name = escapeHtml(cat ? cat.name : '未分类');
    return `<button type="button" class="meta-cat${cat ? '' : ' is-empty'}" data-meta-cat="1" aria-label="修改分类">${name}<i class="meta-caret" aria-hidden="true">▾</i></button>`
      + '<span class="meta-dot">·</span>'
      + `<span class="meta-date">创建于 ${escapeHtml(fmtDate(note.createdAt))}</span>`;
  }
  /* 改完分类后，把编辑区第二行这句就地重写。
     编辑区显示的永远是「当前打开的那篇」，所以别的笔记改了分类不该动这一行。
     在 -73 之前只有分类弹层那条路径会刷新它，拖拽（用户 22:0x 反馈）与批量
     移动都没刷 → 右下角这篇明明已经换类了，上面还写着原分类名字。
     两个场景都调这一个函数，以后再加第二条改分类的路径也不会再漏。 */
  function refreshMetaFor(note) {
    if (!note || state.selNote !== note.id) return;
    const el = $('#metaInfo');
    if (el) el.innerHTML = metaInfoHTML(note);
    if (window.SJRefreshNoteMeta) window.SJRefreshNoteMeta();
  }
  function scopeName(scope) {
    if (state.search.trim()) return '搜索结果';
    if (scope === 'starred') return '收藏';
    if (scope === 'uncat') return '未分类';
    if (String(scope).startsWith('tag:')) return '#' + scope.slice(4);
    if (scope && scope !== 'all') {
      const c = state.categories.find((x) => x.id === scope);
      if (c) return c.name;
    }
    return '全部笔记';
  }
  function renderHome() {
    const grid = $('#homeGrid');
    if (!grid) return;                       // 没有首页网格的端（云端旧空态）直接跳过
    const scope = state.selCat || 'all';
    const notes = notesInScope();
    /* 多选态：网格卡也要能看出「勾了哪几篇」。跟列表卡一致，靠 class 表达，
       每次 renderList 都会重跑本函数，勾选后自然重绘，不需要额外钩子。 */
    grid.classList.toggle('batch-mode', batchMode);
    const tn = $('#homeTabNotes'), tf = $('#homeTabFolders');
    if (tn) {
      tn.textContent = `${scopeName(scope)} ${notes.length}`;
      tn.classList.toggle('on', homeTab === 'notes');
      tn.setAttribute('aria-selected', String(homeTab === 'notes'));
    }
    if (tf) {
      tf.classList.toggle('on', homeTab === 'folders');
      tf.setAttribute('aria-selected', String(homeTab === 'folders'));
    }

    if (homeTab === 'folders') {
      const isCat = scope && scope !== 'all' && !String(scope).startsWith('tag:')
        && scope !== 'starred' && scope !== 'uncat';
      const pid = isCat ? scope : null;
      const folds = state.categories.filter((c) => (c.parentId || null) === pid).sort(byOrder);
      if (tf) tf.textContent = `文件夹 ${folds.length}`;
      if (!folds.length) {
        grid.innerHTML = '<div class="home-empty">这一层还没有文件夹。点右上角「+ 新建文件夹」建一个，比如「工作」「学习」。</div>';
        return;
      }
      grid.innerHTML = folds.map((c) => {
        const subs = state.categories.filter((k) => k.parentId === c.id).length;
        const cnt = subtreeCount(c.id, state.notes);
        const ns = notesUnder(c.id);
        const last = ns.length ? Math.max(...ns.map((n) => Number(n.updatedAt) || 0)) : 0;
        return `<article class="home-card folder" data-cid="${c.id}">
          <div class="home-card-title">${I.folder}<span>${escapeHtml(c.name)}</span></div>
          <p class="home-card-snippet">${subs ? `${subs} 个文件夹 · ` : ''}${cnt} 篇笔记</p>
          <div class="home-card-foot"><span class="home-card-path"></span><span class="home-card-date">${last ? fmtDate(last) : ''}</span></div>
        </article>`;
      }).join('');
      return;
    }

    if (!notes.length) {
      grid.innerHTML = '<div class="home-empty">这里还没有笔记。点右上角「+ 新建笔记」写第一条，或先在侧栏建一个文件夹。</div>';
      return;
    }
    grid.innerHTML = notes.map((n) => {
      const snippet = plainText(n).slice(0, 90);
      return `<article class="home-card${batchSel.has(n.id) ? ' selected' : ''}" data-nid="${n.id}">
        <span class="home-card-sel" aria-hidden="true"></span>
        <div class="home-card-title">${n.starred ? I.starFill.replace('<svg', '<svg class="ico"') : I.doc}<span>${escapeHtml(n.title || '无标题笔记')}</span></div>
        <p class="home-card-snippet">${escapeHtml(snippet) || '空笔记'}</p>
        <div class="home-card-foot">
          <span class="home-card-path">${escapeHtml(catPath(n.categoryId)) || '未分类'}</span>
          <span class="home-card-date">${fmtDate(n.updatedAt)}</span>
        </div>
      </article>`;
    }).join('');
  }

  /* ---------------------------------------------------------- 标签 */
  function allTags() {
    const map = new Map();
    state.notes.forEach((n) => (n.tags || []).forEach((t) => map.set(t, (map.get(t) || 0) + 1)));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh'));
  }

  function renderTags() {
    const cloud = $('#tagCloud');
    if (!cloud) return;
    const tags = allTags();
    $('#tagTotal').textContent = tags.length ? `${tags.length}` : '';
    cloud.innerHTML = '';
    if (!tags.length) {
      const empty = document.createElement('div');
      empty.className = 'tag-empty';
      empty.textContent = '还没有标签。在笔记标题下方点 + 添加，之后可在这里快速筛选。';
      cloud.appendChild(empty);
      return;
    }
    tags.forEach(([tag, count]) => {
      const el = document.createElement('span');
      el.className = 'tag-chip' + (state.selCat === 'tag:' + tag ? ' active' : '');
      el.innerHTML = `<span class="tag-text">${escapeHtml(tag)}</span><span class="tag-count">${count}</span>`;
      el.title = `筛选含「${tag}」的笔记`;
      el.addEventListener('click', () => {
        state.selCat = state.selCat === 'tag:' + tag ? 'all' : 'tag:' + tag;
        state.search = '';
        $('#searchInput').value = '';
        renderTree();
        renderList();
        afterPickCategory();
      });
      cloud.appendChild(el);
    });
  }

  function renderNoteTags() {
    const note = currentNote();
    const list = $('#tagList');
    if (!note || !list) return;
    list.innerHTML = '';
    (note.tags || []).forEach((tag) => {
      const chip = document.createElement('span');
      chip.className = 'tag-chip';
      chip.innerHTML = `<span class="tag-text">${escapeHtml(tag)}</span><button class="tag-x" title="移除标签">×</button>`;
      chip.querySelector('.tag-x').addEventListener('click', () => removeTag(tag));
      list.appendChild(chip);
    });
    const dl = $('#tagOptions');
    dl.innerHTML = '';
    allTags().forEach(([tag]) => {
      const opt = document.createElement('option');
      opt.value = tag;
      dl.appendChild(opt);
    });
  }

  function showTagInput() {
    $('#tagAddBtn').classList.add('hidden');
    const input = $('#tagInput');
    input.classList.remove('hidden');
    input.value = '';
    input.focus();
  }

  function closeTagInput() {
    const input = $('#tagInput');
    input.classList.add('hidden');
    input.value = '';
    $('#tagAddBtn').classList.remove('hidden');
  }

  function commitTag() {
    const note = currentNote();
    const input = $('#tagInput');
    const value = input.value.trim().replace(/^#/, '');
    if (note && value) {
      const tags = note.tags || [];
      if (!tags.includes(value)) {
        if (tags.length >= 10) {
          toast('每条笔记最多 10 个标签');
        } else {
          note.tags = [...tags, value];
          note.updatedAt = Date.now();
          markDirty();
          renderNoteTags();
          renderTags();
          renderList();
        }
      }
    }
    closeTagInput();
  }

  function removeTag(tag) {
    const note = currentNote();
    if (!note) return;
    note.tags = (note.tags || []).filter((t) => t !== tag);
    note.updatedAt = Date.now();
    markDirty();
    renderNoteTags();
    renderTags();
    renderList();
    if (state.selCat === 'tag:' + tag) {
      state.selCat = 'all';
      renderTree();
      renderList();
    }
  }

  /* ---------------------------------------------------------- 标签管理
     标签是从笔记的 tags 派生出来的（没有独立的标签表），所以「改名 / 删除 /
     合并」本质都是批量修改相关笔记的 tags。改 tags 不会产生历史版本。 */
  const TAG_SORTERS = {
    count: (a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh'),
    name: (a, b) => a.name.localeCompare(b.name, 'zh'),
    recent: (a, b) => b.last - a.last || b.count - a.count,
  };
  const tagMgr = { q: '', sort: 'count', sel: new Set() };

  function tagUsage() {
    const map = new Map();
    for (const n of state.notes) {
      for (const t of (n.tags || [])) {
        const cur = map.get(t);
        if (cur) {
          cur.count++;
          if ((n.updatedAt || 0) > cur.last) cur.last = n.updatedAt || 0;
        } else {
          map.set(t, { name: t, count: 1, last: n.updatedAt || 0 });
        }
      }
    }
    return Array.from(map.values());
  }

  function notesWithTag(tag) {
    return state.notes.filter((n) => (n.tags || []).includes(tag));
  }

  /* 只发 tags 字段，绝不覆盖正文（避免刚编辑但未保存的内容被旧值冲掉） */
  async function patchNoteTags(note, tags) {
    const next = [...new Set(tags.map((t) => String(t).trim()).filter(Boolean))].slice(0, 10);
    note.tags = next;
    note.updatedAt = Date.now();
    try {
      const r = await api(`/api/notes/${note.id}`, { method: 'PATCH', body: { tags: next } });
      if (r && r.updatedAt) note.updatedAt = r.updatedAt;
    } catch (e) {
      toast(`「${note.title || '无标题笔记'}」标签更新失败：${e.message || '未知错误'}`);
    }
  }

  /* 把 sources 里的标签统一换成 target（target 已存在时即为合并） */
  async function mergeTags(sources, target) {
    const src = new Set(sources);
    const hit = state.notes.filter((n) => (n.tags || []).some((t) => src.has(t)));
    for (const n of hit) {
      let next = (n.tags || []).filter((t) => !src.has(t) || t === target);
      next = [target, ...next.filter((t) => t !== target)];
      await patchNoteTags(n, next);
    }
    const sel = String(state.selCat || '');
    if (sel.startsWith('tag:') && src.has(sel.slice(4)) && sel.slice(4) !== target) {
      state.selCat = 'tag:' + target;
    }
    return hit.length;
  }

  async function removeTagEverywhere(tag) {
    const hit = notesWithTag(tag);
    for (const n of hit) {
      await patchNoteTags(n, (n.tags || []).filter((t) => t !== tag));
    }
    if (state.selCat === 'tag:' + tag) state.selCat = 'all';
    return hit.length;
  }

  function refreshAfterTagChange() {
    renderTags();
    renderList();
    renderNoteTags();
    syncBarTitle();
  }

  function syncMergeBtn() {
    const b = $('#tmMergeBtn');
    if (!b) return;
    const n = tagMgr.sel.size;
    b.disabled = n < 2;
    b.textContent = n >= 2 ? `合并所选（${n}）` : '合并所选';
  }

  function openTagManager() {
    tagMgr.q = '';
    tagMgr.sel = new Set();
    const m = openModal(`
      <div class="tm-head">
        <h3>标签管理</h3>
        <button class="tm-x" data-act="close" title="关闭" aria-label="关闭">×</button>
      </div>
      <div class="tm-sub" id="tmSub"></div>
      <div class="tm-tools">
        <input type="text" id="tmSearch" placeholder="搜索标签…" autocomplete="off" maxlength="20">
        <select id="tmSort" title="排序方式">
          <option value="count">按使用次数</option>
          <option value="name">按名称</option>
          <option value="recent">按最近使用</option>
        </select>
      </div>
      <div class="tm-list" id="tmList"></div>
      <div class="tm-foot">
        <button class="btn ghost" id="tmMergeBtn" disabled>合并所选</button>
        <button class="btn primary" data-act="close">完成</button>
      </div>`);
    m.classList.add('tag-mgr');
    m.querySelectorAll('[data-act="close"]').forEach((b) => { b.onclick = closeModal; });
    const search = m.querySelector('#tmSearch');
    search.addEventListener('input', () => { tagMgr.q = search.value; renderTagMgrList(); });
    const sortSel = m.querySelector('#tmSort');
    sortSel.addEventListener('change', () => { tagMgr.sort = sortSel.value; renderTagMgrList(); });
    m.querySelector('#tmMergeBtn').onclick = openTagMerge;
    renderTagMgrList();
  }

  function renderTagMgrList() {
    const box = $('#tmList');
    if (!box) return;
    const all = tagUsage();
    const total = all.reduce((s, t) => s + t.count, 0);
    const sub = $('#tmSub');
    if (sub) {
      sub.textContent = all.length
        ? `共 ${all.length} 个标签 · 被 ${total} 篇笔记引用`
        : '还没有标签。在笔记标题下方点「+」就能加第一个。';
    }
    const q = tagMgr.q.trim().toLowerCase();
    const rows = (q ? all.filter((t) => t.name.toLowerCase().includes(q)) : all.slice())
      .sort(TAG_SORTERS[tagMgr.sort] || TAG_SORTERS.count);
    box.innerHTML = '';
    if (!rows.length) {
      const e = document.createElement('div');
      e.className = 'tm-empty';
      e.textContent = q ? '没有匹配的标签' : '还没有标签';
      box.appendChild(e);
    }
    const frag = document.createDocumentFragment();
    rows.forEach((t) => frag.appendChild(tagMgrRow(t)));
    box.appendChild(frag);
    syncMergeBtn();
  }

  function tagMgrRow(t) {
    const row = document.createElement('div');
    row.className = 'tm-row';
    row.dataset.tag = t.name;
    row.innerHTML = `
      <input type="checkbox" class="tm-chk"${tagMgr.sel.has(t.name) ? ' checked' : ''} aria-label="选择标签">
      <span class="tm-name" title="点击筛选含「${escapeHtml(t.name)}」的笔记">#${escapeHtml(t.name)}</span>
      <span class="tm-n">${t.count} 篇</span>
      <span class="tm-btns">
        <button class="tm-btn" data-act="rename">改名</button>
        <button class="tm-btn danger" data-act="del">删除</button>
      </span>
      <div class="tm-confirm hidden">
        <span>将从 <b>${t.count}</b> 篇笔记移除该标签，笔记本身不受影响。</span>
        <span class="tm-confirm-acts">
          <button class="tm-btn" data-act="del-no">取消</button>
          <button class="tm-btn danger solid" data-act="del-yes">移除</button>
        </span>
      </div>`;

    row.querySelector('.tm-chk').addEventListener('change', (e) => {
      if (e.target.checked) tagMgr.sel.add(t.name); else tagMgr.sel.delete(t.name);
      syncMergeBtn();
    });

    row.querySelector('.tm-name').addEventListener('click', () => {
      closeModal();
      state.search = '';
      const si = $('#searchInput');
      if (si) si.value = '';
      state.selCat = 'tag:' + t.name;
      renderTree();
      renderList();
      renderTags();
      afterPickCategory();
    });

    row.querySelector('[data-act="rename"]').addEventListener('click', () => beginTagRename(row, t.name));

    row.querySelector('[data-act="del"]').addEventListener('click', () => {
      row.classList.add('confirming');
      row.querySelector('.tm-confirm').classList.remove('hidden');
    });
    row.querySelector('[data-act="del-no"]').addEventListener('click', () => {
      row.classList.remove('confirming');
      row.querySelector('.tm-confirm').classList.add('hidden');
    });
    row.querySelector('[data-act="del-yes"]').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = '移除中…';
      const cnt = await removeTagEverywhere(t.name);
      tagMgr.sel.delete(t.name);
      refreshAfterTagChange();
      renderTagMgrList();
      toast(`已从 ${cnt} 篇笔记移除「${t.name}」`);
    });

    return row;
  }

  function beginTagRename(row, from) {
    if (row.querySelector('.tm-edit')) return;
    const nameEl = row.querySelector('.tm-name');
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.className = 'tm-edit';
    inp.maxLength = 20;
    inp.value = from;
    nameEl.replaceWith(inp);
    inp.focus();
    inp.select();
    let done = false;
    const finish = (commit) => {
      if (done) return;
      done = true;
      const val = inp.value.trim().replace(/^#/, '');
      if (!commit || !val || val === from) { renderTagMgrList(); return; }
      doTagRename(from, val);
    };
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); finish(true); }
      else if (e.key === 'Escape') { e.preventDefault(); finish(false); }
    });
    inp.addEventListener('blur', () => finish(false));
  }

  async function doTagRename(from, to) {
    const existed = tagUsage().some((t) => t.name === to);
    const cnt = notesWithTag(from).length;
    await mergeTags([from], to);
    tagMgr.sel.delete(from);
    refreshAfterTagChange();
    renderTagMgrList();
    toast(existed
      ? `已把「${from}」合并进「${to}」（影响 ${cnt} 篇）`
      : `已把「${from}」改名为「${to}」（影响 ${cnt} 篇）`);
  }

  function openTagMerge() {
    const sel = Array.from(tagMgr.sel);
    if (sel.length < 2) return;
    const box = $('#tmList');
    if (!box) return;
    const touched = new Set();
    sel.forEach((t) => notesWithTag(t).forEach((n) => touched.add(n.id)));
    box.innerHTML = `
      <div class="tm-merge">
        <div class="tm-merge-hint">把下面 ${sel.length} 个标签合并成一个，共涉及 <b>${touched.size}</b> 篇笔记：</div>
        <div class="tm-merge-src">${sel.map((t) => `<span class="tag-chip">${escapeHtml(t)}</span>`).join('')}</div>
        <label class="tm-merge-label" for="tmMergeName">合并后的标签名</label>
        <input type="text" class="tm-edit tm-merge-input" id="tmMergeName" maxlength="20" value="${escapeHtml(sel[0])}">
        <div class="tm-merge-acts">
          <button class="btn ghost" id="tmMergeCancel">返回</button>
          <button class="btn primary" id="tmMergeOk">合并</button>
        </div>
      </div>`;
    const inp = box.querySelector('#tmMergeName');
    inp.focus();
    inp.select();
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); box.querySelector('#tmMergeOk').click(); }
      else if (e.key === 'Escape') { e.preventDefault(); renderTagMgrList(); }
    });
    box.querySelector('#tmMergeCancel').onclick = () => renderTagMgrList();
    box.querySelector('#tmMergeOk').onclick = async () => {
      const target = inp.value.trim().replace(/^#/, '');
      if (!target) { toast('请填写合并后的标签名'); return; }
      const btn = box.querySelector('#tmMergeOk');
      btn.disabled = true;
      btn.textContent = '合并中…';
      await mergeTags(sel, target);
      tagMgr.sel = new Set();
      refreshAfterTagChange();
      renderTagMgrList();
      toast(`已把 ${sel.length} 个标签合并为「${target}」`);
    };
  }

  const tagManageBtn = $('#tagManageBtn');
  if (tagManageBtn) tagManageBtn.addEventListener('click', (e) => { e.stopPropagation(); openTagManager(); });
  /* 标签区可折叠：目录树是主区、标签是辅助筛选。收起状态记本机，默认收起把高度让给目录。 */
  const tagHead = $('#tagHead');
  const tagSection = $('#tagSection');
  if (tagHead && tagSection) {
    const applyTagCollapsed = (collapsed) => {
      tagSection.classList.toggle('collapsed', collapsed);
      tagHead.setAttribute('aria-expanded', String(!collapsed));
    };
    applyTagCollapsed(localStorage.getItem('sj_tag_collapsed') !== '0');
    tagHead.addEventListener('click', () => {
      const next = !tagSection.classList.contains('collapsed');
      applyTagCollapsed(next);
      try { localStorage.setItem('sj_tag_collapsed', next ? '1' : '0'); } catch (_) {}
    });
    tagHead.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tagHead.click(); }
    });
  }

  /* ---------------------------------------------------------- 编辑器 */
  /* -70：空白新建草稿不在 state.notes 里，编辑期间由 currentNote 直接返回。 */
  /* ---------------------------------------------------------- 编辑草稿崩溃恢复（-72）
     以前「编辑期只标脏」的内容只在内存里：进程被强杀且 pagehide / visibilitychange
     都没触发时，整段编辑会丢（代码审查报告 P1-4 一直挂着）。这里只把当前正在
     编辑的那一份内容存进 localStorage 做崩溃恢复，不新增任何 PATCH、定时器或
     写盘时机 —— 保存时机红线一字未动。空白新建草稿不暂存，避免 -70 语义回退。 */
  const EDIT_DRAFT_KEY = 'sj_edit_draft_v1';
  const EDIT_DRAFT_MAX = 200 * 1024;

  function readEditDraft() {
    try {
      const raw = localStorage.getItem(EDIT_DRAFT_KEY);
      if (!raw) return null;
      const d = JSON.parse(raw);
      return (d && typeof d.content === 'string') ? d : null;
    } catch (_) { return null; }
  }
  function clearEditDraft(savedId) {
    try {
      if (savedId) {
        const cur = readEditDraft();
        /* 已经切到别的笔记时，别用旧笔记的保存完成清掉新笔记的草稿。 */
        if (cur && (cur.draft ? DRAFT_ID : cur.id) !== savedId) return;
      }
      localStorage.removeItem(EDIT_DRAFT_KEY);
    } catch (_) {}
  }
  function saveEditDraft(note) {
    try {
      if (!note) return;
      if (state.selNote === DRAFT_ID && isBlankNote(note)) { clearEditDraft(DRAFT_ID); return; }
      const raw = JSON.stringify({
        id: note.id || '', draft: state.selNote === DRAFT_ID,
        title: note.title || '', content: note.content || '',
        format: 'rich',
        categoryId: note.categoryId || null, starred: !!note.starred,
        tags: (note.tags || []).slice(), at: Date.now(),
      });
      if (raw.length > EDIT_DRAFT_MAX) return;  // 超大正文不冒 localStorage 配额风险
      localStorage.setItem(EDIT_DRAFT_KEY, raw);
    } catch (_) { /* 配额满 / 隐私模式：静默忽略，绝不影响编辑 */ }
  }
  function offerEditDraft() {
    const d = readEditDraft();
    const pane = $('.editor-pane');
    if (!d || !pane || $('#sjDraftBar')) return;
    const bar = document.createElement('div');
    bar.id = 'sjDraftBar';
    bar.className = 'sj-draft-bar';
    const t = new Date(d.at || Date.now());
    bar.innerHTML = `<span>检测到上次未保存的内容（${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}）</span>`
      + `<button class="btn primary" data-draft="restore">恢复</button>`
      + `<button class="btn ghost" data-draft="drop">丢弃</button>`;
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('[data-draft]');
      if (!b) return;
      if (b.dataset.draft === 'drop') { clearEditDraft(); bar.remove(); return; }
      try { if (restoreEditDraft(d)) bar.remove(); }
      catch (err) { toast('恢复失败：' + err.message); }
    });
    pane.prepend(bar);
  }
  function restoreEditDraft(d) {
    if (d.draft && !draftNote) {
      draftNote = {
        id: DRAFT_ID, title: '', content: '', format: 'md',
        categoryId: d.categoryId || null, starred: false, tags: [],
        attachments: [], createdAt: Date.now(), updatedAt: Date.now(),
      };
    }
    const id = d.draft ? DRAFT_ID : d.id;
    /* 笔记还没从本地库读回来时，保留草稿副本让用户稍后再点，绝不静默清掉。 */
    if (!d.draft && !noteById(id)) { toast('原笔记暂未找到（数据可能还在加载），请稍后再点恢复'); return false; }
    /* 先按库里的旧内容打开（savedSnapshot 记的是旧值），再把草稿字段覆盖上去，
       markDirty() 才会判定为「有未保存改动」，离开时正常走 PATCH。 */
    openNote(id);
    const n = currentNote();
    if (!n) return false;
    Object.assign(n, {
      title: d.title || '', content: d.content || '',
      format: 'rich',
      starred: !!d.starred, tags: Array.isArray(d.tags) ? d.tags.slice() : [],
    });
    $('#titleInput').value = n.title || '';
    $('#richPane').innerHTML = noteHtml(n);
    applyFormat();
    renderNoteTags(); renderList(); wordCount();
    markDirty();
    toast('已恢复上次未保存的内容，离开时会保存');
    return true;
  }

  const currentNote = () => (state.selNote === DRAFT_ID ? draftNote : noteById(state.selNote));

  function setSaveState(kind, text) {
    const el = $('#saveState');
    el.className = 'save-state ' + (kind || '');
    if (!text) {
      const t = new Date();
      text = `已保存 ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
    }
    el.textContent = kind === 'saving' ? '保存中…' : text;
  }

  function wordCount() {
    const n = currentNote();
    if (!n) return;
    const t = plainText(n);
    $('#wordCount').textContent = `${t.length} 字`;
  }

  function openNote(id, { focusTitle = false } = {}) {
    /* 离开当前笔记：先把脏数据落盘，再切换选中项。所有打开笔记的路径
       （列表、搜索、双链、外部调用）都会经过这里，不用逐个补钩子。 */
    if (state.selNote && state.selNote !== id) void saveNow();
    /* -70：草稿只存在于内存，按哨兵取，别去 state.notes 里找。 */
    const note = id === DRAFT_ID ? draftNote : noteById(id);
    if (!note) return;
    /* 崩溃恢复标记：正常跑完会在函数末尾清掉。若上次打开这篇时
       渲染卡死 / 抛异常，标记会留下，下次启动就跳过它，保证能进应用。 */
    try { localStorage.setItem('sj_opening_note', String(id)); } catch (_) {}
    /* 运行时兜底：local.js 已在读取入口批量修过，这里再兜一层
       （同步 setState 灌进来的数据不经过 load）。只处理 format 缺失的旧数据，
       并把修正持久化。 */
    state.selNote = id;
    /* 打开笔记时让左侧分类树定位到该笔记所在分类：展开其分类与祖先链，
       高亮由 renderTree 内的 treeActiveCat() 统一驱动（笔记只在自己的分类下高亮，
       而不在「全部笔记」伪节点下）。未分类笔记则展开「未分类」容器。 */
    if (id !== DRAFT_ID) {
      if (note.categoryId) expandChain(note.categoryId);
      else setOpen('uncat', true);
    }
    state.dirty = false;
    savedSnapshot = snapshot(note);

    $('#emptyState').classList.add('hidden');
    $('#editorWrap').classList.remove('hidden');

    $('#titleInput').value = note.title || '';
    $('#starBtn').classList.toggle('on', !!note.starred);

    /* 正文统一进富文本容器：存储层只有富文本一种格式，
       读出来直接就是 HTML，不需要任何渲染分支。 */
    $('#richPane').innerHTML = noteHtml(note);
    decorate($('#richPane'));
    $('#richPane').classList.remove('hidden');

    $('#metaInfo').innerHTML = metaInfoHTML(note);
    setSaveState('', `已保存 ${new Date(note.updatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`);

    applyFormat();
    renderToolbar();
    renderAttachments();
    renderNoteTags();
    if (window.SJBacklinks) window.SJBacklinks.refresh(note);
    renderList();
    renderTree();
    updateAttachBadge();
    wordCount();

    $('#attachPanel').classList.toggle('hidden', !(note.attachments && note.attachments.length));

    if (focusTitle) {
      $('#titleInput').focus();
      $('#titleInput').select();
    }
    try { localStorage.removeItem('sj_opening_note'); } catch (_) {}
  }

  /* 正文只有富文本一个编辑面：Markdown 笔记读时渲染成 HTML，
     写时自动升级为富文本存储。这个函数只负责把编辑面的显隐摆平。 */
  function applyFormat() {
    const note = currentNote();
    if (!note) return;
    $('#richPane').classList.remove('hidden');
    $('#editorBody').classList.add('is-rich');
  }

  /* 笔记正文 → 可直接放进富文本容器的 HTML。
     存储层只有富文本一种格式，这里只做一次净化。 */
  function noteHtml(note) {
    if (!note) return '';
    const c = note.content ? String(note.content) : '';
    return DOMPurify.sanitize(c);
  }

  /* 保存：编辑期间只标脏、不写盘；离开编辑页时统一落盘。
     快照用来识别「改完又改回原样」——内容和已存版本一致就不写盘。
     编辑模式属于视图状态：切换只改显示，不写回笔记、不标脏。 */
  let savedSnapshot = '';
  /* 编辑器当前显示的存储格式。内容统一在富文本容器里编辑，
     Markdown 笔记一被输入就由 onRichInput 升级为 rich。 */
  function snapshot(n) {
    return JSON.stringify([n.title || '', n.content || '',
      n.categoryId || null, !!n.starred, n.tags || []]);
  }
  function markDirty() {
    const note = currentNote();
    if (!note) return;
    if (snapshot(note) === savedSnapshot) {
      state.dirty = false;
      /* 改回原样 = 没有未保存内容，草稿副本也该清掉，别下次启动误报。 */
      clearEditDraft(state.selNote === DRAFT_ID ? DRAFT_ID : note.id);
      setSaveState('saved');
      return;
    }
    state.dirty = true;
    saveEditDraft(note);
    setSaveState('dirty', '未保存 · 离开时保存');
  }

  async function saveNow() {
    /* -70：空白新建草稿：全空就同步丢弃（一个请求都不发），有内容才落库。
       已有笔记的「输入只标脏、离开时 PATCH」链路保持原样。 */
    if (draftNote && state.selNote === DRAFT_ID) {
      if (isBlankNote(draftNote)) { discardDraft(); return; }
      setSaveState('saving');
      await settleDraft(false);
      return;
    }
    const note = currentNote();
    if (!note || !state.dirty) return;
    const savingId = note.id;
    state.dirty = false;
    setSaveState('saving');
    try {
      const updated = await api(`/api/notes/${note.id}`, {
        method: 'PATCH',
        body: {
          title: note.title, content: note.content, format: 'rich',
          categoryId: note.categoryId, starred: note.starred, tags: note.tags || [],
        },
      });
      Object.assign(note, updated);
      /* 已经切到别的笔记时，别用旧笔记的快照覆盖新笔记的。 */
      if (state.selNote === savingId) {
        savedSnapshot = snapshot(note);
        setSaveState('saved');
      }
      clearEditDraft(savingId);
      renderList();
    } catch (e) {
      state.dirty = true;
      setSaveState('error', '保存失败，请重试');
      toast(e.message);
    }
  }

  /* 正文输入：内容与格式一起写回笔记。
     正文只有富文本一个编辑面，所以写回时格式恒为 rich ——
     Markdown 笔记被编辑一次，就自动升级成富文本存储。 */
  function onRichInput() {
    const note = currentNote();
    if (!note) return;
    note.content = $('#richPane').innerHTML;
    note.format = 'rich';
    note.updatedAt = Date.now();
    wordCount();
    markDirty();
  }

  /* 富文本里的图片保持原生，无需额外处理。 */
  function decorateRichAttachments() {
    // 富文本中的图片保持原生，无需额外处理
  }

  /* ---------------------------------------------------------- 工具栏 */
  function renderToolbar() {
    const note = currentNote();
    const bar = $('#toolbar');
    bar.innerHTML = '';
    if (!note) return;

    const btn = (html, title, fn, cls = '') => {
      const b = document.createElement('button');
      b.className = 'tb-btn ' + cls;
      b.title = title;
      b.innerHTML = html;
      b.addEventListener('mousedown', (e) => e.preventDefault());
      b.addEventListener('click', (e) => { e.preventDefault(); fn(); });
      bar.appendChild(b);
      return b;
    };
    const sep = () => {
      const s = document.createElement('span');
      s.className = 'tb-sep';
      bar.appendChild(s);
    };
    // 富文本字体/字号下拉：原生 select，选后即复位到占位文字
    const sel = (title, opts, onChange) => {
      const s = document.createElement('select');
      s.className = 'tb-select';
      s.title = title;
      s.innerHTML = opts.map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
      s.addEventListener('change', () => { const v = s.value; s.value = ''; if (v) onChange(v); });
      bar.appendChild(s);
      return s;
    };

    // 富文本：正文只有这一套工具条。
    // Markdown 笔记打开时就渲染成 HTML 放进了 richPane，一视同仁。
    btn(I.bold, '加粗', () => exec('bold'));
    btn(I.italic, '斜体', () => exec('italic'));
    btn(I.strike, '删除线', () => exec('strikeThrough'));
    sep();
    sel('字体', [
      ['', '字体'],
      ['SimSun', '宋体'],
      ['SimHei', '黑体'],
      ['Microsoft YaHei', '微软雅黑'],
      ['KaiTi', '楷体'],
      ['Arial', 'Arial'],
      ['Georgia', 'Georgia'],
      ['Courier New', '等宽'],
    ], (v) => execFont('fontName', v));
    sel('字号', [
      ['', '字号'],
      ['12', '12'],
      ['14', '14'],
      ['16', '16'],
      ['18', '18'],
      ['20', '20'],
      ['24', '24'],
      ['28', '28'],
      ['32', '32'],
    ], (v) => execFontSize(v));
    sep();
    btn('<span class="tb-text">H1</span>', '一级标题', () => exec('formatBlock', '<h1>'));
    btn('<span class="tb-text">H2</span>', '二级标题', () => exec('formatBlock', '<h2>'));
    btn('<span class="tb-text">H3</span>', '三级标题', () => exec('formatBlock', '<h3>'));
    btn('<span class="tb-text">¶</span>', '正文', () => exec('formatBlock', '<p>'));
    sep();
    btn(I.list, '无序列表', () => exec('insertUnorderedList'));
    btn(I.listOrdered, '有序列表', () => exec('insertOrderedList'));
    btn(I.quote, '引用', () => exec('formatBlock', '<blockquote>'));
    sep();
    btn(I.code, '代码块', richCodeBlock);
    btn(I.link, '插入链接', () => {
      const url = prompt('请输入链接地址', 'https://');
      if (url) exec('createLink', url);
    });
    btn(I.table, '表格', () => insertRichTable());
    btn(I.hr, '分隔线', () => exec('insertHorizontalRule'));
    sep();
    const LH_STEPS = [1.8, 1.5, 1.3];
    const LH_LABELS = ['标准', '适中', '紧凑'];
    const lhBtn = btn('<span class="tb-text" id="lhBtnText">行距</span>', '切换正文行距', () => {
      const i = (LH_STEPS.indexOf(state.richLh) + 1) % LH_STEPS.length;
      state.richLh = LH_STEPS[i];
      applyRichLh();
      try { localStorage.setItem('sj_rich_lh', String(state.richLh)); } catch (_) {}
      const label = LH_LABELS[i];
      const txt = lhBtn.querySelector('#lhBtnText');
      if (txt) txt.textContent = '行距' + label;
      lhBtn.title = '正文行距：' + label + '（点击切换）';
    });
    lhBtn.title = '正文行距：' + LH_LABELS[LH_STEPS.indexOf(state.richLh)] + '（点击切换）';
    const lhTxt = lhBtn.querySelector('#lhBtnText');
    if (lhTxt) lhTxt.textContent = '行距' + LH_LABELS[LH_STEPS.indexOf(state.richLh)];
    const clearBtn = btn('<span class="tb-text" style="font-weight:600">Tx</span>', '清除格式', () => exec('removeFormat'), '');
    clearBtn.style.marginLeft = 'auto';
  }

  /* 富文本插入表格：3×3 空表，占位符用不换行空格撑开单元格 */
  function insertRichTable() {
    const row = '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>';
    const html = '<table class="sj-table"><tbody>' + row + row + row + '</tbody></table><p><br></p>';
    exec('insertHTML', html);
  }

  /* 富文本辅助 */
  let savedRange = null;

  document.addEventListener('selectionchange', () => {
    const pane = $('#richPane');
    const sel = window.getSelection();
    if (!pane || !sel || !sel.rangeCount) return;
    const r = sel.getRangeAt(0);
    if (pane.contains(r.commonAncestorContainer)) savedRange = r.cloneRange();
  });

  function restoreRange() {
    if (!savedRange) return false;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRange);
    return true;
  }

  /* ---- 软件键盘：格式操作不弹输入法，点正文才弹 ----
     手机上点「加粗 / 对齐 / 字号」只需要编辑焦点，不需要输入法；可 execCommand
     又必须有焦点，两者本来是冲突的。Chromium 的 virtualkeyboardpolicy="manual"
     正好能把这两件事拆开：拿得到焦点，但不唤起软键盘。
     不认这个属性的浏览器会直接忽略它，行为退化成改造前的样子，不会更糟。 */
  const KB_POLICY = 'virtualkeyboardpolicy';
  let kbManual = false;
  /* 自绘光标的刷新钩子：由 mobileHomeUI 里的实现挂上来（那里能摸到面板状态）。
     格式命令改完选区后调一下，光标位置立刻跟上。 */
  let caretRefresh = null;
  function refreshCaret() {
    if (!caretRefresh) return;
    try { caretRefresh(); } catch (_) {}
  }

  /* 两道保险：
     ① virtualkeyboardpolicy=manual —— 认这个属性的内核（Chrome 94+）聚焦不弹键盘；
     ② inputmode=none —— 不认①的华为/国产内核靠它压住输入法（Android Chrome、
        WebView、iOS 12.2+ 都认）。
     用户 2026-11-21 反馈：只靠①，在手机上弹面板后点正文仍会冒出输入法、把面板顶到
     半屏，所以②必须一起上。 */
  function setKbManual(on) {
    /* 桌面端没有软键盘这回事，一律保持 auto，别留下状态 */
    if (!NARROW()) { kbManual = false; return; }
    kbManual = !!on;
    const pane = $('#richPane');
    if (!pane) return;
    try {
      if (on) {
        pane.setAttribute(KB_POLICY, 'manual');
        pane.setAttribute('inputmode', 'none');
      } else {
        pane.removeAttribute(KB_POLICY);
        pane.removeAttribute('inputmode');
      }
    } catch (_) {}
  }

  /* 静默聚焦：拿到编辑焦点，但不弹输入法（面板按钮、撤销重做都走这条）。
     已经有焦点就直接用——说明键盘本来就在，别去动它的策略。 */
  function focusQuiet(pane) {
    const el = pane || $('#richPane');
    if (!el) return null;
    /* 每次都确认 manual 策略：先点正文唤起过键盘的话，kbManual 已经被
       focusTyping 关掉了，这里不补回来，下一次聚焦又会弹键盘。 */
    setKbManual(true);
    if (document.activeElement === el) return el;
    el.focus({ preventScroll: true });
    return el;
  }

  /* 收起输入法但保住选区（打开样式面板时用，面板不该被键盘顶到半屏）。
     2026-11-21 补：光 blur 会让正文失焦，光标那根竖线随之消失，
     用户看不出自己在编辑哪一行。所以收完键盘要把焦点放回正文——
     此时 manual + inputmode=none 都在，聚焦只画光标、不弹键盘（正好是用户
     要的「面板一弹就不出现输入法，但光标还在原处」）。 */
  function hideSoftKeyboard() {
    setKbManual(true);
    const ae = document.activeElement;
    const hadPane = !!(ae && ae.id === 'richPane');
    /* 先记住当前选区：blur 之后有的内核对折叠光标处理不一样，得原样还回去 */
    let keep = null;
    if (hadPane) {
      const s0 = window.getSelection();
      if (s0 && s0.rangeCount) {
        try { keep = s0.getRangeAt(0).cloneRange(); } catch (_) {}
      }
    }
    if (ae && ae !== document.body && ae.blur) ae.blur();
    /* 返回「刚才键盘是不是开着」：开面板要据此决定是立刻弹还是等键盘收完 */
    if (!keep) return hadPane;
    /* 不再延迟回焦：blur 过一会儿又 focus，即便不弹键盘，个别内核也会顺手把
       页面/正文再滚一次，和面板上滑叠在一起就是「闪一下」（用户 2026-11-21 反馈）。
       光标交给自绘那根，选区在这里当场恢复就够。 */
    try {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(keep);
      savedRange = keep;
    } catch (_) {}
    return hadPane;
  }

  /* 真要打字了：先撤掉 manual 再重新聚焦。已经聚焦的元素不会再触发
     focus 事件，所以必须先 blur 一次，否则键盘不会重新出现。 */
  function focusTyping(el) {
    const t = el || $('#richPane');
    if (!t) return null;
    const wasManual = kbManual;
    setKbManual(false);
    if (wasManual && document.activeElement === t) t.blur();
    t.focus({ preventScroll: true });
    /* 键盘起来后把那行留出来（真打字才会走这里，静默聚焦不受影响） */
    scheduleTypingReveal();
    return t;
  }

  /* 把当前选区滚进正文的可视范围。
     样式面板打开后正文区被压缩，调完字号/颜色如果不滚一下，
     被调的那一行可能正好在视口外，看着像「没生效」。 */
  /* 光标那一行还差多少才露出来（正数 = 正文要往上滚，负数 = 往下滚）。
     只算差值不改 scrollTop，好让调用方决定「立刻滚」还是「滑过去」。 */
  function revealSelectionDelta() {
    const pane = $('#richPane');
    if (!pane) return 0;
    let r = null;
    const sel = window.getSelection();
    if (sel && sel.rangeCount) r = sel.getRangeAt(0);
    if ((!r || !pane.contains(r.startContainer)) && savedRange && pane.contains(savedRange.startContainer)) {
      r = savedRange;
    }
    if (!r) return 0;
    let first = null, last = null;
    try {
      const rects = r.getClientRects();
      if (rects && rects.length) { first = rects[0]; last = rects[rects.length - 1]; }
    } catch (_) {}
    if (!first) {
      let el = r.startContainer;
      if (el.nodeType !== 1) el = el.parentElement;
      if (!el || !pane.contains(el)) return 0;
      first = last = el.getBoundingClientRect();
    }
    const pr = pane.getBoundingClientRect();
    if (!pr.height) return 0;
    const pad = 20;
    /* 选区在视口上方 → 顶上对齐首行；否则把末行顶到可视区底部，
       整段（哪怕换了好几行）都能看全，不会只露第一行。 */
    if (first.top < pr.top + pad) return first.top - (pr.top + pad);
    if (last.bottom > pr.bottom - pad) return last.bottom - (pr.bottom - pad);
    return 0;
  }
  function revealSelection() {
    const pane = $('#richPane');
    if (!pane) return;
    const d = revealSelectionDelta();
    if (d) pane.scrollTop += d;
  }

  /* 面板开合时不能瞬跳着滚：一次 scrollTop 改动就是一百多像素的位移，
     看着就是「闪一下」。这里按 16ms 补一小步、缓动到位。
     用户 2026-11-21 反馈「首次点 A 会闪屏」——根子就是打开面板后 200ms
     直接 revealSelection()，正文在面板停稳的瞬间跳了一大截；之后再打开
     时光标行已经在可视区内，所以只有第一次看得到。 */
  let glideRevealTimer = 0;
  function stopGlideReveal() {
    clearInterval(glideRevealTimer);
    glideRevealTimer = 0;
  }
  function glideRevealSelection(ms) {
    const pane = $('#richPane');
    if (!pane) return;
    const d = revealSelectionDelta();
    if (!d || Math.abs(d) < 1) return;
    const from = pane.scrollTop;
    const to = Math.max(0, from + d);
    if (Math.abs(to - from) < 1) return;
    const dur = ms || 180;
    const t0 = Date.now();
    stopGlideReveal();
    let set = from;
    glideRevealTimer = setInterval(() => {
      /* 用户自己滚了（手指一拨 scrollTop 就跑到我们没设过的位置）→ 立刻让位 */
      if (Math.abs(pane.scrollTop - set) > 2) { stopGlideReveal(); return; }
      const k = Math.min(1, (Date.now() - t0) / dur);
      set = from + (to - from) * (1 - Math.pow(1 - k, 3));
      pane.scrollTop = set;
      refreshCaret();
      if (k >= 1) stopGlideReveal();
    }, 16);
  }

  /* 键盘弹起后，把光标那一行留出来。
     手机点正文会立刻弹出输入法，可视区被压掉一半，而正文区自己的高度
     (interactive-widget=resizes-content) 跟着缩，原先那一行就可能落到
     「看得见的底边」以下——用户看到的是键盘盖住了正在写的那一行。
     这里按当前选区的最后一行算：超出可视区就把它顶到留白之上，已经在
     里面就不动（不抢用户的手动滚动）。 */
  function revealTypingCaret() {
    const pane = $('#richPane');
    if (!pane) return;
    if (!window.matchMedia('(max-width: 980px)').matches) return;
    if (!document.body.classList.contains('sj-note-edit')) return;
    if (document.activeElement !== pane) return;
    let r = null;
    try {
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const rr = sel.getRangeAt(0);
        if (rr.collapsed && pane.contains(rr.startContainer)) r = rr;
      }
    } catch (_) {}
    if (!r) return;
    let line = null;
    try {
      const rects = r.getClientRects();
      if (rects && rects.length) line = rects[rects.length - 1];
    } catch (_) {}
    if (!line || (!line.height && !line.width)) {
      let n = r.startContainer;
      if (n.nodeType !== 1) n = n.parentElement;
      line = n && pane.contains(n) ? n.getBoundingClientRect() : null;
    }
    if (!line) return;
    const pr = pane.getBoundingClientRect();
    if (!pr.height) return;
    const vv = window.visualViewport;
    const visTop = Math.max(pr.top, vv ? vv.offsetTop : 0);
    const visBottom = Math.min(pr.bottom, vv ? vv.offsetTop + vv.height : window.innerHeight);
    const pad = 28;
    /* 键盘底下那一截不算数：宁可多滚 28px，也别让字贴着键盘边 */
    if (line.bottom > visBottom - pad) pane.scrollTop += line.bottom - (visBottom - pad);
    else if (line.top < visTop + pad) pane.scrollTop -= (visTop + pad) - line.top;
  }
  /* 输入法不是一瞬间弹出来的（各家动画 200~400ms），只在 focus 后补几次；
     期间每次 resize（含 visualViewport）也可以再校一次，都是「不越界就不动」。 */
  function scheduleTypingReveal() {
    [0, 90, 220, 400, 650].forEach((t) => setTimeout(revealTypingCaret, t));
  }
  window.addEventListener('resize', () => { revealTypingCaret(); });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', () => { revealTypingCaret(); });

  /* 光标只是一根竖线时，先把整段选中再套格式，否则字号/颜色看不见效果。
     选区优先取正文里当前的，取不到就退回 savedRange（点按钮后焦点会跑）。
     放在模块作用域：样式面板（mobileHomeUI）和 exec 系列都要用。 */
  function ensureBlockSel() {
    const pane = $('#richPane');
    if (!pane) return;
    const sel = window.getSelection();
    let r = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
    if (!r || !pane.contains(r.startContainer)) r = savedRange;
    if (!r || !pane.contains(r.startContainer) || !r.collapsed) return;
    let el = r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentElement;
    while (el && el !== pane && !/^(P|DIV|LI|H1|H2|H3|BLOCKQUOTE|PRE)$/.test(el.tagName)) el = el.parentElement;
    if (!el || el === pane) return;
    const nr = document.createRange();
    nr.selectNodeContents(el);
    sel.removeAllRanges();
    sel.addRange(nr);
    savedRange = nr.cloneRange();
  }

  function exec(cmd, value) {
    const pane = $('#richPane');
    focusQuiet(pane);
    restoreRange();
    /* 手机上只有光标时点 B/I/U，浏览器只会给「下一次输入」记个状态，
       现有文字一点变化都看不见，用户以为按钮坏了。窄屏下没有选区就先
       选中光标所在那一段再套格式——和字号/颜色一个规矩，点了就有反馈。 */
    if (NARROW() && /^(bold|italic|underline)$/.test(cmd)) ensureBlockSel();
    try { document.execCommand('styleWithCSS', false, false); } catch (_) {}
    document.execCommand(cmd, false, value);
    onRichInput();
    revealSelection(); refreshCaret();
  }

  // 字体：styleWithCSS=true 让 fontName 生成 <span style="font-family:…">，
  // 而不是会被 DOMPurify 清掉 face 属性的旧 <font> 标签。
  function execFont(cmd, value) {
    const pane = $('#richPane');
    focusQuiet(pane);
    restoreRange();
    try { document.execCommand('styleWithCSS', false, true); } catch (_) {}
    document.execCommand(cmd, false, value);
    onRichInput();
  }

  // 字号：execCommand('fontSize') 只认 1~7 档，直接用会落 <font size>，
  // 其 size 属性会被净化丢弃。做法是先用第 7 档打出可定位的 <font>，
  // 再把本次产生的那些 <font> 换成带精确 px 的 <span style="font-size">。
  function execFontSize(px) {
    const pane = $('#richPane');
    focusQuiet(pane);
    restoreRange();
    try { document.execCommand('styleWithCSS', false, false); } catch (_) {}
    // 记录执行前已有的 font 节点，避免误改正文里别处的内容
    const before = new Set(Array.from(pane.querySelectorAll('font')));
    document.execCommand('fontSize', false, '7');
    const made = Array.from(pane.querySelectorAll('font')).filter((f) => !before.has(f));
    if (!made.length) { onRichInput(); revealSelection(); refreshCaret(); return; }
    const newSpans = [];
    made.forEach((f) => {
      const span = document.createElement('span');
      span.style.fontSize = px + 'px';
      while (f.firstChild) span.appendChild(f.firstChild);
      f.replaceWith(span);
      newSpans.push(span);
    });
    // 用替换后的新 span 重建选区，保证字号变更后选中内容仍被选中
    const sel = window.getSelection();
    if (sel && newSpans.length) {
      const first = newSpans[0], last = newSpans[newSpans.length - 1];
      try {
        const r = document.createRange();
        r.setStartBefore(first);
        r.setEndAfter(last);
        sel.removeAllRanges();
        sel.addRange(r);
        savedRange = r.cloneRange();
      } catch (_) {}
    }
    onRichInput();
    revealSelection(); refreshCaret();
  }

  const BLOCK_TAGS = /^(P|DIV|LI|BLOCKQUOTE|PRE|H1|H2|H3|H4)$/;

  function closestBlock(node) {
    const pane = $('#richPane');
    let el = node && node.nodeType === 1 ? node : node && node.parentElement;
    while (el && el !== pane && !BLOCK_TAGS.test(el.tagName)) el = el.parentElement;
    return el && el !== pane ? el : null;
  }

  function richCodeBlock() {
    const pane = $('#richPane');
    focusQuiet(pane);
    restoreRange();
    const sel = window.getSelection();
    const text = sel ? sel.toString() : '';
    if (text) document.execCommand('delete');

    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = text || '在这里写代码';
    pre.appendChild(code);
    const p = document.createElement('p');
    p.appendChild(document.createElement('br'));

    const anchor = window.getSelection().anchorNode;
    const block = closestBlock(anchor);
    if (block) {
      block.after(pre);
      pre.after(p);
      if (!block.textContent.trim() && !block.querySelector('img,hr')) block.remove();
    } else {
      pane.appendChild(pre);
      pane.appendChild(p);
    }

    const r = document.createRange();
    r.selectNodeContents(code);
    if (!text) {
      r.setStart(code.firstChild, 0);
      r.setEnd(code.firstChild, code.firstChild.length);
    } else {
      r.collapse(false);
    }
    sel.removeAllRanges();
    sel.addRange(r);
    onRichInput();
  }

  /* 代码块内回车 —— 跳出与换行
     坑（8.2 的后续）：contenteditable 在 <pre> 内回车会插入 <div> 或 <br>，
     光标始终留在 code 里，用户无法结束代码块；且 <br> 不带文本，
     turndown 转 Markdown 时换行会全部丢失。这里自己接管回车：
       Enter            普通换行；位于代码块末尾时跳出并新建段落
       Shift + Enter    一律换行（末尾也能加空行）
       Ctrl / Cmd+Enter 任意位置立即跳出
     换行统一插入真实 "\n" 文本节点（pre code 是 white-space: pre-wrap，能正常显示），
     保证代码块的换行能原样保存并转成 Markdown。 */

  /** 光标是否在代码块内，返回所在的 pre */
  function caretInPre() {
    const pane = $('#richPane');
    const sel = window.getSelection();
    if (!pane || !sel || !sel.rangeCount) return null;
    const node = sel.anchorNode;
    const el = node && node.nodeType === 1 ? node : node && node.parentElement;
    if (!el || !pane.contains(el)) return null;
    const pre = el.closest('pre');
    return pre && pane.contains(pre) ? pre : null;
  }

  /** 光标之后到代码块结尾是否只剩空白（即停在最后一行末尾） */
  function atPreEnd(pre, range) {
    const probe = document.createRange();
    probe.selectNodeContents(pre);
    try {
      probe.setStart(range.endContainer, range.endOffset);
    } catch (_) {
      return false;
    }
    return !probe.toString().replace(/[\s\u00a0\u200b]+/g, '');
  }

  /** 在光标处插入真实换行符，而不是让浏览器塞 <div>/<br> */
  function insertCodeNewline(pre, range) {
    // 代码壳被删掉时补回来，保证 turndown 仍识别为围栏代码块
    let code = pre.querySelector('code');
    if (!code) {
      code = document.createElement('code');
      code.textContent = pre.textContent;
      pre.textContent = '';
      pre.appendChild(code);
      const fix = document.createRange();
      fix.selectNodeContents(code);
      fix.collapse(false);
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(fix);
      range = fix;
    }
    range.deleteContents();
    const tn = document.createTextNode('\n');
    range.insertNode(tn);
    const caret = document.createRange();
    caret.setStart(tn, tn.length);
    caret.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(caret);
  }

  /** 把光标放到元素内容最前面 */
  function placeCaret(el) {
    if (!el) return;
    const r = document.createRange();
    r.setStart(el, 0);
    r.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
  }

  /** 是否没有任何可见内容（空段落、只剩一个 <br>） */
  function isEmptyBlock(el) {
    if (!el || el.nodeType !== 1) return false;
    return !el.textContent.replace(/[\s\u00a0\u200b]+/g, '') && !el.querySelector('img,pre,table,hr');
  }

  /** 在容器后面取一个可输入的段落：紧邻的空段落能复用就复用，否则新建 */
  function paragraphAfter(el) {
    let next = el.nextElementSibling;
    if (!next || next.tagName !== 'P' || !isEmptyBlock(next)) {
      next = document.createElement('p');
      next.appendChild(document.createElement('br'));
      el.after(next);
    }
    return next;
  }

  /** 在代码块之后放一个可输入的段落并聚焦；嵌在引用里且已到末尾时跳到引用外 */
  function focusAfterPre(pre) {
    let target = pre;
    const holder = pre.parentElement;
    if (holder && holder.tagName === 'BLOCKQUOTE' && !pre.nextElementSibling) {
      target = outermostQuote(holder); // 别继续困在引用框里
    }
    placeCaret(paragraphAfter(target));
  }

  /* ---------------- 引用块（blockquote）的退出 ----------------
     同样是 contenteditable 的老问题：在 <blockquote> 内回车，浏览器只会
     在引用里再开一段，光标永远出不来。这里接管 Enter：
       Enter            引用内换行；停在引用末尾时结束引用并把光标放到引用外
       Shift + Enter    引用内软换行（<br>），不退出
       Ctrl / Cmd+Enter 任意位置立即结束引用
     引用里已经没有任何内容时整块删掉，不留空框。 */

  /** 光标所在的引用块（最内层） */
  function caretInQuote() {
    const pane = $('#richPane');
    const sel = window.getSelection();
    if (!pane || !sel || !sel.rangeCount) return null;
    const node = sel.anchorNode;
    const el = node && node.nodeType === 1 ? node : node && node.parentElement;
    if (!el || !pane.contains(el)) return null;
    const q = el.closest('blockquote');
    return q && pane.contains(q) ? q : null;
  }

  /** 一路向外找最外层的引用，一次跳到底 */
  function outermostQuote(q) {
    let outer = q;
    let up = outer.parentElement && outer.parentElement.closest('blockquote');
    while (up) {
      outer = up;
      up = outer.parentElement && outer.parentElement.closest('blockquote');
    }
    return outer;
  }

  /** 光标之后到引用结尾是否只剩空白（即停在引用最后一段的末尾） */
  function atQuoteEnd(q, range) {
    const probe = document.createRange();
    probe.selectNodeContents(q);
    try {
      probe.setStart(range.endContainer, range.endOffset);
    } catch (_) {
      return false;
    }
    return !probe.toString().replace(/[\s\u00a0\u200b]+/g, '');
  }

  /** 结束引用：清掉尾部空行，引用已空则整块删除，光标落到引用后的段落 */
  function leaveQuote(q) {
    const outer = outermostQuote(q);
    while (outer.lastElementChild && isEmptyBlock(outer.lastElementChild)) {
      outer.lastElementChild.remove();
    }
    const next = paragraphAfter(outer);
    if (isEmptyBlock(outer)) outer.remove();
    placeCaret(next);
  }

  /** 引用内软换行，插入 <br> 而不是新段落 */
  function softBreak(range) {
    const sel = window.getSelection();
    range.deleteContents();
    const br = document.createElement('br');
    range.insertNode(br);
    const after = document.createRange();
    after.setStartAfter(br);
    after.collapse(true);
    sel.removeAllRanges();
    sel.addRange(after);
  }

  /**
   * 引用内分段：把光标后的内容切到新段落，新段落仍留在**同一个引用块**里。
   * 不接管的话，浏览器会拆成两个相邻 blockquote，转 Markdown 会多出 "> " 空行。
   * 注意顺序：必须先按 Range 切片，再去包装文本——移动节点会让 Range 边界被
   * 浏览器重置到父级，先包装就会切错范围（会把整段 p 切进新段落里，多套一层）。
   */
  function splitInQuote(q, range) {
    if (!range.collapsed) return false;
    if (range.startContainer.nodeType !== 3) return false;
    if (!q.contains(range.startContainer)) return false;

    const block = closestBlock(range.startContainer);

    // 情况一：引用里已有段落，直接在段落边界切片
    if (block && block !== q) {
      if (block.parentNode !== q) return false; // 段落嵌在列表等结构里，交给浏览器
      const tail = document.createRange();
      tail.setStart(range.startContainer, range.startOffset);
      tail.setEnd(block, block.childNodes.length);
      const frag = tail.extractContents();
      const np = document.createElement('p');
      if (frag.textContent || frag.querySelector('img,br')) np.appendChild(frag);
      if (!np.firstChild) np.appendChild(document.createElement('br'));
      block.after(np);
      if (isEmptyBlock(block)) block.remove(); // 光标在段首，原段落被切空就走掉
      placeCaret(np);
      return true;
    }

    // 情况二：文字直挂引用（工具条「引用」的产物），先把光标后的内容切出来
    const hasBlockChild = Array.from(q.children).some((el) =>
      /^(P|DIV|H[1-6]|UL|OL|PRE|BLOCKQUOTE|TABLE|FIGURE)$/.test(el.tagName));
    if (hasBlockChild) return false;

    const tail = document.createRange();
    tail.setStart(range.startContainer, range.startOffset);
    tail.setEnd(q, q.childNodes.length);
    const frag = tail.extractContents();

    // 光标之前的内容仍留在 q 里，包成第一段
    const head = document.createElement('p');
    while (q.firstChild) head.appendChild(q.firstChild);

    // 光标之后的内容包成第二段
    const np = document.createElement('p');
    if (frag.textContent || frag.querySelector('img,br')) np.appendChild(frag);
    if (!np.firstChild) np.appendChild(document.createElement('br'));

    if (head.textContent.replace(/[\s\u00a0\u200b]+/g, '') || head.querySelector('img,br')) {
      q.appendChild(head);
      head.after(np);
      placeCaret(np);
    } else {
      // 光标就在开头：在内容上方新起一个空段（就是这次回车换行），光标留在空段里
      const blank = document.createElement('p');
      blank.appendChild(document.createElement('br'));
      q.appendChild(blank);
      blank.after(np);
      placeCaret(blank);
    }
    return true;
  }

  /* 代码块内的 Enter（返回 true 表示已接管） */
  function handleInCodeBlock(e) {
    const pre = caretInPre();
    if (!pre) return false;
    const sel = window.getSelection();
    if (!sel.rangeCount) return false;
    const range = sel.getRangeAt(0);

    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      focusAfterPre(pre);
      onRichInput();
      return true;
    }
    if (!e.shiftKey && atPreEnd(pre, range)) {
      e.preventDefault();
      focusAfterPre(pre);
      onRichInput();
      return true;
    }
    e.preventDefault();
    insertCodeNewline(pre, range);
    onRichInput();
    return true;
  }

  /* 引用块内的 Enter（返回 true 表示已接管） */
  function handleInQuote(e) {
    const q = caretInQuote();
    if (!q) return false;
    const sel = window.getSelection();
    if (!sel.rangeCount) return false;
    const range = sel.getRangeAt(0);
    const outer = outermostQuote(q);

    if (e.shiftKey) {
      e.preventDefault();
      softBreak(range);
      onRichInput();
      return true;
    }
    if (e.ctrlKey || e.metaKey || atQuoteEnd(outer, range)) {
      e.preventDefault();
      leaveQuote(q);
      onRichInput();
      return true;
    }
    // 停在引用中间：在同一个引用块里另起一段，别让浏览器拆成两个引用
    if (splitInQuote(q, range)) {
      e.preventDefault();
      onRichInput();
      return true;
    }
    return false;
  }

  $('#richPane').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    if (e.isComposing || e.keyCode === 229) return; // 输入法选词中，交给浏览器
    if (handleInCodeBlock(e)) return;
    handleInQuote(e);
  });

  /* 粘贴净化 + 图片上传 */
  $('#richPane').addEventListener('paste', async (e) => {
    const files = Array.from(e.clipboardData.files || []);
    if (files.length) {
      e.preventDefault();
      await uploadFiles(files, { insert: true });
      return;
    }
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');
    e.preventDefault();
    if (html) {
      const clean = DOMPurify.sanitize(html, { FORBID_TAGS: ['style', 'script', 'meta', 'link'] });
      document.execCommand('insertHTML', false, clean);
    } else if (looksLikeMarkdown(text)) {
      /* 识别为 Markdown：渲染成 HTML 再插入，保留排版 */
      document.execCommand('insertHTML', false, renderMarkdown(text));
    } else {
      document.execCommand('insertText', false, text);
    }
    onRichInput();
  });

  /* 粘贴纯文本时判断它是不是 Markdown 语法。
     存储层收敛为富文本后，用户从别处复制的 md 源码（# 标题、- 列表、
     ``` 代码块 等）如果原样插进去就只是一堆符号。这里识别出来转成
     排版后的 HTML —— Markdown 速记的能力保住了，只是不再占用一种
     存储格式。判断不靠「像不像」，而是看有没有明确的 md 标记。 */
  function looksLikeMarkdown(text) {
    const t = String(text || '');
    if (!t.trim() || t.length > 20000) return false;
    return /(^|\n)\s{0,3}#{1,6}\s+\S/.test(t)          /* 标题 */
      || /(^|\n)\s{0,3}([-*+]|\d+\.)\s+\S/.test(t)    /* 列表 */
      || /(^|\n)\s{0,3}>\s+\S/.test(t)                 /* 引用 */
      || /```/.test(t)                                    /* 代码块 */
      || /\*\*[^*\n]+\*\*/.test(t)                     /* 加粗 */
      || /(^|\n)\s{0,3}\|[^\n]+\|\s*\n/.test(t)     /* 表格 */
      || /!\[[^\]]*\]\([^)]+\)/.test(t)               /* 图片 */
      || /\[[^\]]+\]\([^)]+\)/.test(t);               /* 链接 */
  }

  /* ---------------------------------------------------------- 悬停提示
     原生 title 是系统画的带黑框白底方块：样式一处都改不了，出现在附件卡片上
     还会把旁边的卡片整个盖住。这里换成一个自绘浮层，视觉与图标栏的 data-tip
     一致（深色半透明、圆角、无边框）。
     为什么用挂在 body 上的浮层、而不是 data-tip + 伪元素：附件面板是
     overflow-y:auto 的，伪元素一旦超出面板就被裁掉，而卡片恰恰贴着面板底边。 */
  let sjTipEl = null;
  let sjTipTimer = 0;

  function ensureSjTip() {
    if (!sjTipEl) {
      sjTipEl = document.createElement('div');
      sjTipEl.className = 'sj-tip';
      document.body.appendChild(sjTipEl);
    }
    return sjTipEl;
  }

  function hideSjTip() {
    clearTimeout(sjTipTimer);
    sjTipTimer = 0;
    if (sjTipEl) sjTipEl.classList.remove('on');
  }

  function showSjTip(target) {
    const text = target.getAttribute('data-tip');
    if (!text) return;
    /* 文件名平时被省略号截断才有必要提示；完整显示时再弹一遍等于重复正文 */
    if (target.classList.contains('att-name') && target.scrollWidth <= target.clientWidth + 1) return;
    clearTimeout(sjTipTimer);
    sjTipTimer = setTimeout(() => {
      sjTipTimer = 0;
      if (!target.isConnected) return;
      const el = ensureSjTip();
      el.textContent = text;                 // 文件名可能带 < >，只用 textContent
      const r = target.getBoundingClientRect();
      const W = el.offsetWidth, H = el.offsetHeight, pad = 8, gap = 7;
      let left = r.left + r.width / 2 - W / 2;
      left = Math.min(Math.max(pad, left), Math.max(pad, window.innerWidth - W - pad));
      let top = r.bottom + gap;
      if (top + H > window.innerHeight - pad) top = r.top - gap - H;   // 下方放不下就翻到上方
      el.style.left = Math.round(left) + 'px';
      el.style.top = Math.round(Math.max(pad, top)) + 'px';
      el.classList.add('on');
    }, 260);
  }

  /* 触屏没有 hover，装上了反而会卡在屏幕上（与图片悬停预览同一条判断）。
     图标栏的 .rail-btn 仍由 CSS 伪元素负责，这里跳过，别弹两份。 */
  if (window.matchMedia && window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('pointerover', (e) => {
      const t = e.target && e.target.closest ? e.target.closest('[data-tip]') : null;
      if (!t || t.classList.contains('rail-btn')) return;
      showSjTip(t);
    });
    document.addEventListener('pointerout', (e) => {
      const t = e.target && e.target.closest ? e.target.closest('[data-tip]') : null;
      if (!t) return;
      /* 在同一个元素内部换子元素也会冒 pointerout，不判断 relatedTarget 会把
         刚亮起的提示立刻打灭 */
      if (e.relatedTarget && t.contains(e.relatedTarget)) return;
      hideSjTip();
    });
    document.addEventListener('pointerdown', hideSjTip, true);
    window.addEventListener('scroll', hideSjTip, true);
  }

  /* ---------------------------------------------------------- 附件 */
  function updateAttachBadge() {
    const note = currentNote();
    const n = note ? (note.attachments || []).length : 0;
    $('#attCount').textContent = n;
    $('#attachBtn').classList.toggle('has', n > 0);
  }

  /* 附件显示地址：手机端（本地优先）附件自带 data URL，直接内嵌显示；
     桌面端附件由服务端按 /api/files/<id> 提供。两者都能在正文正确渲染。 */
  function attDisplaySrc(a) {
    if (!a) return '';
    if (a.data) return a.data;                                  // 刚上传，还在内存里
    if (window.SJLocal && window.SJLocal.fileUrl) {
      const u = window.SJLocal.fileUrl(a.id);                   // 附件仓 / 云端签名地址
      if (u) return u;
    }
    if (a.remoteUrl) return a.remoteUrl;
    return '/api/files/' + a.id;                                // 桌面端走服务端
  }

  /* 把 data URL 还原成 Blob。手写解码而不是 fetch(data:)，
     部分手机浏览器不支持 fetch data: 协议，且大文件多一次拷贝。 */
  function dataUrlToBlob(u) {
    try {
      const m = /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(u);
      if (!m) return null;
      const mime = m[1] || 'application/octet-stream';
      if (m[2]) {
        const bin = atob(m[3]);
        const buf = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
        return new Blob([buf], { type: mime });
      }
      return new Blob([decodeURIComponent(m[3])], { type: mime });
    } catch (_) { return null; }
  }

  /* 附件下载：把本机二进制交给浏览器保存。
     渲染 / 预览时先把二进制备进内存，点击那一刻同步造 blob: URL 并新建
     隐藏 <a download> 触发；本机没有时再按需从附件仓 / 云端取。
     URL 必须在用户点击的调用栈里新建 —— 预建的旧 URL 可能已失效。 */
  const dlRaw = new Map();     // attId -> Blob（点击当场用它现造 URL）
  const dlData = new Map();    // attId -> data URL（同步可交付）
  const dlBusy = new Set();

  /* 只认内存里现成的 data URL —— 这是唯一能在手势同一次调用栈里拿到的东西。
     云端签名地址（http）必然要发网络请求，一定丢手势，不能算「就绪」。 */
  function localDataUrlOf(a) {
    if (!a) return '';
    if (a.data) return a.data;
    if (window.SJLocal && window.SJLocal.fileUrl) {
      const u = window.SJLocal.fileUrl(a.id) || '';
      if (/^data:/i.test(u)) return u;
    }
    return '';
  }

  /* 直连附件仓读一次：SJAttStore 包装层偶尔拿不到时，这是兜底的一路。
     自带超时，拿不到就返回空，绝不把界面挂在这里。 */
  function directStoreGet(id, ms) {
    return new Promise((resolve) => {
      let done = false;
      const finish = (v) => { if (!done) { done = true; resolve(typeof v === 'string' ? v : ''); } };
      if (!id || !window.indexedDB) return finish('');
      const timer = setTimeout(() => finish(''), ms || 5000);
      let req;
      try { req = indexedDB.open('sj_att_v1', 1); } catch (_) { clearTimeout(timer); return finish(''); }
      req.onupgradeneeded = () => { try { req.result.createObjectStore('files'); } catch (_) {} };
      req.onerror = () => { clearTimeout(timer); finish(''); };
      req.onsuccess = () => {
        const db = req.result;
        try {
          const tx = db.transaction('files', 'readonly');
          const r = tx.objectStore('files').get(id);
          r.onsuccess = () => { clearTimeout(timer); finish(r.result); };
          r.onerror = () => { clearTimeout(timer); finish(''); };
          tx.onabort = () => { clearTimeout(timer); finish(''); };
        } catch (_) { clearTimeout(timer); finish(''); }
      };
    });
  }

  /* 取附件二进制（data URL）：内存 → SJAttStore → **直连附件仓**。
     三条都试，任何一条给出数据就够 —— 下载只需要一次成功。 */
  async function attBinaryGet(a) {
    if (!a || !a.id) return '';
    const mem = localDataUrlOf(a);
    if (mem) return mem;
    if (dlData.has(a.id)) return dlData.get(a.id);
    let d = '';
    try { if (window.SJAttStore) d = (await attStoreGet(a.id, 5000)) || ''; } catch (_) {}
    if (!d) d = await directStoreGet(a.id, 5000);
    if (d) dlData.set(a.id, d);
    return d;
  }

  /* 发布版本标记：与 index.html 的 SWV 等六处同步，供维护核对，
     不参与界面，也不影响运行。 */
  const APP_BUILD = '2026-11-22-157';

  /* 把二进制是否已备好标到按钮上，供点击时同步交付；
     真正的交付动作在 deliverNow()。 */
  function markReady(el, a) {
    if (!a || !a.id) return false;
    const ready = !!(dlRaw.get(a.id) || dlData.get(a.id) || localDataUrlOf(a));
    if (el && el.isConnected) {
      el.dataset.ready = ready ? '1' : '';
      el.setAttribute('title', '下载 ' + (a.name || '附件') + (ready ? '' : '（本机还没有这份文件）'));
    }
    return ready;
  }

  /* 取本机二进制：内存 → 附件仓。都取不到返回空。
     附件仓一定要带超时：华为浏览器在省电 / 多标签时 IDB 打开会悬着不返回，
     不带超时这里就永远等下去，链接永远武装不上。 */
  function attStoreGet(id, ms) {
    return new Promise((resolve) => {
      let done = false;
      const timer = setTimeout(() => { if (!done) { done = true; resolve(null); } }, ms || 6000);
      Promise.resolve()
        .then(() => (window.SJAttStore ? window.SJAttStore.get(id) : null))
        .then((v) => { if (!done) { done = true; clearTimeout(timer); resolve(v || null); } },
              () => { if (!done) { done = true; clearTimeout(timer); resolve(null); } });
    });
  }

  /* 渲染时 / 打开大图前把二进制备进内存。只备 Blob 与 data URL，
     不预建 blob: URL —— 预建的旧 URL 可能被回收，是个不报错的死链。 */
  async function ensureBlob(a) {
    if (!a || !a.id) return null;
    const hit = dlRaw.get(a.id);
    if (hit) return hit;
    const data = await attBinaryGet(a);
    if (!data) return null;
    if (/^data:/i.test(data)) dlData.set(a.id, data);
    const blob = dataUrlToBlob(data);
    if (!blob) return null;
    dlRaw.set(a.id, blob);
    return blob;
  }

  /* 准备顺序：同步内存 → 附件仓。没有第三档。 */
  async function prepareWhenReady(el, a) {
    if (!el || !a || !a.id) return false;
    if (!localDataUrlOf(a) && !dlRaw.has(a.id)) await ensureBlob(a);
    if (!el.isConnected) return false;
    return markReady(el, a);
  }

  /* 补图结束后把二进制再备一次，保证点击那一刻数据是同步可得的。 */
  function refreshDownloadLinks() {
    const note = currentNote();
    if (!note) return;
    const byId = new Map((note.attachments || []).map((x) => [x.id, x]));
    $$('#attachList [data-act="dl"]').forEach((el) => {
      const a = byId.get(el.dataset.att || '');
      if (!a) return;
      /* 图片的卡片按钮是「看大图」，不是下载，别把 href 抢过去 */
      if (/^image\//.test(a.type || '')) return;
      void prepareWhenReady(el, a).then((ok) => {
        if (!ok) void prefetchDownload(a, el);
      });
    });
  }
  document.addEventListener('sj:files-painted', refreshDownloadLinks);

  /* 附件不在本机（只在云端签名地址）时，取二进制必然要发网络请求，等用户点了
     再取就已经离开手势。渲染后顺手预取一次，等真点下去二进制已在内存，
     就能同步交付。取不到就保持未就绪，点击时如实说「还没存到本机」。 */
  const dlFetching = new Set();
  async function prefetchDownload(a, el) {
    if (!a || !a.id || dlRaw.has(a.id) || dlFetching.has(a.id)) return;
    dlFetching.add(a.id);
    let ctl = null;
    try {
      /* ① 本机（内存 / 附件仓）。PDF 这类不渲染缩略图的附件，二进制只在仓里，
         localDataUrlOf() 同步取不到 —— 少了这一档，它就永远准备不上。 */
      if (await ensureBlob(a)) {
        if (el && el.isConnected) markReady(el, a);
        return;
      }
      /* ② 云端签名地址。local.js 的 attachmentUrl 已经按「内存 → 仓 → 签名地址」
         兜过一遍，比只看 a.remoteUrl 更可靠 —— stripAtt 保存时会摘掉 remoteUrl，
         只留 a.path，重开页面后就只能靠它自己的 remotePath 映射。 */
      let src = '';
      try {
        if (window.SJLocal && window.SJLocal.attachmentUrl) src = (await window.SJLocal.attachmentUrl(a.id)) || '';
      } catch (_) {}
      if (!src) src = a.remoteUrl || '';
      if (!/^https?:/i.test(src)) return;
      /* 非图片且偏大就别为下载偷偷吃流量，留给用户点击时再取 */
      if (!/^image\//.test(a.type || '') && (a.size || 0) > 2 * 1024 * 1024) return;
      ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = ctl ? setTimeout(() => ctl.abort(), 15000) : 0;
      try {
        const r = await fetch(src, ctl ? { signal: ctl.signal } : {});
        const b = r && r.ok ? await r.blob() : null;
        if (b && b.size) {
          dlRaw.set(a.id, b);
          /* 落到附件仓，下次离线也能下载 */
          try { await saveToStore(a.id, b); } catch (_) {}
          if (el && el.isConnected) markReady(el, a);
        }
      } finally { if (timer) clearTimeout(timer); }
    } catch (_) {
      /* 取不到就保持未就绪，点击时如实提示 */
    } finally {
      dlFetching.delete(a.id);
    }
  }

  /* Blob → data URL → 附件仓。以后 SW 读到、离线也能下载。 */
  function saveToStore(id, blob) {
    return new Promise((resolve) => {
      if (!window.SJAttStore || !blob) return resolve(false);
      try {
        const fr = new FileReader();
        fr.onload = () => {
          const d = typeof fr.result === 'string' ? fr.result : '';
          if (!d) return resolve(false);
          Promise.resolve(window.SJAttStore.put(id, d)).then(() => resolve(true), () => resolve(false));
        };
        fr.onerror = () => resolve(false);
        fr.readAsDataURL(blob);
      } catch (_) { resolve(false); }
    });
  }

  function triggerSave(obj, name) {
    const link = document.createElement('a');
    link.href = obj;
    link.download = name;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => { link.remove(); }, 60000);
  }

  /* 交付（同步）：新建隐藏 <a download>，点击当场造 blob: URL 并触发。 */
  function deliverNow(a) {
    if (!a || !a.id) return false;
    const name = a.name || ('附件-' + a.id);
    const dataUrl = dlData.get(a.id) || localDataUrlOf(a) || '';
    let blob = dlRaw.get(a.id) || null;
    if (!blob && dataUrl) { blob = dataUrlToBlob(dataUrl); if (blob) dlRaw.set(a.id, blob); }
    if (blob) {
      const u = URL.createObjectURL(blob);
      triggerSave(u, name);
      return true;
    }
    if (dataUrl) {
      triggerSave(dataUrl, name);
      return true;
    }
    return false;
  }

  /* 本机三处都没有时，去云端取一次，取到就落回附件仓（下次离线也能下载）。 */
  async function fetchRemoteData(a) {
    if (!a || !a.id) return '';
    let src = '';
    try {
      if (window.SJLocal && window.SJLocal.attachmentUrl) src = (await window.SJLocal.attachmentUrl(a.id)) || '';
    } catch (_) {}
    if (!src) src = a.remoteUrl || '';
    if (!/^https?:/i.test(src) && !/^data:/i.test(src)) return '';
    if (/^data:/i.test(src)) return src;
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), 15000) : 0;
    try {
      const r = await fetch(src, ctl ? { signal: ctl.signal } : {});
      if (!r || !r.ok) return '';
      const blob = await r.blob();
      if (!blob || !blob.size) return '';
      dlRaw.set(a.id, blob);
      void saveToStore(a.id, blob);
      const dataUrl = await new Promise((res) => {
        try {
          const fr = new FileReader();
          fr.onload = () => res(typeof fr.result === 'string' ? fr.result : '');
          fr.onerror = () => res('');
          fr.readAsDataURL(blob);
        } catch (_) { res(''); }
      });
      if (dataUrl) dlData.set(a.id, dataUrl);
      return dataUrl;
    } catch (_) {
      return '';
    } finally { if (timer) clearTimeout(timer); }
  }

  /* 是否处于「已添加到主屏幕 / WebAPK」的独立 Android 环境：这类环境会静默丢弃
     脚本合成的 blob 下载（连 <a download> 也无效），同域文件跳转又被本 PWA 的
     Service Worker 拦成离线页。只能把签名地址用 intent:// 交给系统浏览器下载。 */
  /* 是否走「intent 唤起系统浏览器」下载：以 Android 为准。
     背景：华为 WebAPK 常不报 display-mode（standalone/minimal-ui/fullscreen 都可能
     为 false），而「内外高度差」又无法可靠区分状态栏与浏览器工具栏。与其赌某个
     启发式命中导致漏判（之前就是漏判走了 blob 分支、被静默丢弃），不如只要确认是
     Android（即手机端）就走 intent——桌面 / iOS 仍走原 blob 流程（不受此影响）。
     Android 普通 Chrome 走 intent 也无害（同样能下载）。下方各子值仍记入日志，
     供下一步结合真机数据做更精细的环境判定。 */
  function isStandaloneAndroid() {
    try {
      /* 唯一可靠的判据就是 UA 里的 Android：华为 WebAPK 往往不报
         display-mode: standalone，用 matchMedia 判定会漏。 */
      return /Android/i.test(navigator.userAgent || '');
    } catch (_) { return false; }
  }
  /* ------------------------------------------- Chromium 系判定（-63 / -66 恢复）
     为什么要把 Chromium 系单独拎出来：
       Chrome / Edge 这类浏览器在 standalone 下**能页内落盘** —— blob 锚点、SW 返回的
       attachment 响应都能走通，下载留在本页完成：不多开窗口、没有中转页、也不需要
       用户再去点右上角那个 ✗。
       而华为 / 小米 / vivo 这些自带浏览器会**静默丢弃**页内下载（-20 / -50 / -58 三次
       真机证实），只能把请求交给另一个应用，代价是多一个窗口。
     这段来回走过一次，两点都记下来免得再绕：
       · -63 引入 → 真机能下成（证据：系统弹出「打开 PDF 文件？」；再点一次还问
         「是否重新下载」—— 说明文件已经在「下载」里了），但用户看不见它发生，于是
         重复点击，同一份文件下两遍；
       · -64 为此在卡片下方加了一行常驻说明 → 与「第二次点击」的绿框叠在一起，用户
         明确反感那两片绿；
       · -65 于是整条撤掉、统一走 intent → 用户又明确说「不想看到那个中转页」；
       · -66 恢复页内通道，但**一个字都不往页面上加**：成功只给一句 toast。
     结论：在能页内落盘的内核上，「没有页面」本身就是最强的信号 —— 系统会自己把文件
     放进「下载」并在通知栏显示进度。判错的方向必须是安全的一侧：认不出来就返回 false，
     退回 intent 那条已验证的路，不拿不可检测的动作去赌。 */
  function isChromiumLikeAndroid() {
    try {
      const ua = navigator.userAgent || '';
      if (!/Android/i.test(ua)) return false;
      if (!/Chrome\/\d+/i.test(ua)) return false;
      /* Android WebView（各家 App 内嵌）的下载交给宿主决定，策略又不一样，一律不认。 */
      if (/;\s*wv\)|WebView/i.test(ua)) return false;
      /* 已知 OEM / 国产内核：真机上页内下载会被吞。 */
      if (/HuaweiBrowser|HBPC|HONORBrowser|HonorBrowser|MiuiBrowser|XiaoMi\/|VivoBrowser|HeyTap|OppoBrowser|SamsungBrowser|UCBrowser|MQQBrowser|QQBrowser|Quark|baidubrowser|BaiduBoxApp|SogouMobileBrowser|QihooBrowser|360SE|MicroMessenger|Weibo/i.test(ua)) return false;
      return true;
    } catch (_) { return false; }
  }
  /* 当前链接里的访问码（供下载中转页 dl.html 复用，保证非首页打开也能带码）。 */
  function currentShareCode() {
    try {
      return new URLSearchParams(location.search).get('sharecode')
        || localStorage.getItem('sj_sharecode') || 'X4WPKTHLIN';
    } catch (_) { return 'X4WPKTHLIN'; }
  }
  /* 早期版本这里还有一个 buildIntentUrl()：直接把签名地址包成裸 intent 交给系统。
     它已被下面的 buildDlIntent() 完全取代 —— 后者先经同源 dl.html 中转页，能顺手把
     旧 SW 换成带「存储路径放行」的新版。留着两份 intent 构造只会让人改错那一份
     （-68 体检时确认它 0 调用，删除）。 */

  /* 真正用于下载的 intent：先经过同源的 dl.html 中转页（它在系统浏览器里把 SW 升级到
     带「存储路径放行」的新版，再重定向到文件地址），从而自愈「旧 SW 把文件拦成离线页」
     的问题。dl.html 与文件地址同主机，intent 仍由系统解析器弹出「打开」选择。 */
  function buildDlIntent(storageUrl, name) {
    try {
      const target = new URL(storageUrl);
      const sc = currentShareCode();
      const dlPath = '/dl.html?sharecode=' + encodeURIComponent(sc)
        + '&url=' + encodeURIComponent(target.toString())
        + '&name=' + encodeURIComponent(name || '')
        /* b= 让 dl.html 的日志带上本端 build，用来判定手机跑的是哪一版 app.js；
           仅作诊断，不影响下载。 */
        + '&b=' + encodeURIComponent(APP_BUILD);
      const dlUrl = target.origin + dlPath;
      return 'intent://' + target.host + dlPath
        + '#Intent;scheme=https;action=android.intent.action.VIEW;'
        + 'category=android.intent.category.BROWSABLE;'
        + 'S.browser_fallback_url=' + encodeURIComponent(dlUrl) + ';end';
    } catch (_) { return ''; }
  }
  /* 传入的必须是已构建好的 intent 字符串（buildDlIntent 的返回值）。
     注意：绝不能再对入参调用 buildDlIntent —— 那会把 url= 变成整条 intent，
     导致 dl.html 拿到的是 intent:// 而非真实文件地址，文件永远不落地（-39 的坑）。 */
  function openViaSystemBrowser(intent) {
    if (!intent) return false;
    try {
      const a = document.createElement('a');
      a.href = intent;
      a.target = '_blank';
      a.rel = 'noopener';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { a.remove(); }, 60000);
      return true;
    } catch (_) { return false; }
  }
  /* 注意入参 el 是**那张附件卡片里的下载按钮**，不是卡片本身（startDownload 的调用点
     传的是 dlEl）。按钮又在 .att-acts 这个 position:absolute 的浮层里：
       · 往按钮里 append 任何节点 → 溢出到卡片右下角外面，真机看到的「右下角一片
         混乱」就是这么来的；
       · 插进卡片内部也不行：卡片变高后那排绝对定位的按钮会压在文字上。
     所以统一插在**卡片正下方**一条独立说明行里，谁都不挡。 */
  function attCardOf(el) {
    try { return el && el.closest ? el.closest('.att') : null; } catch (_) { return null; }
  }
  /* 取（或建）卡片下方那条说明行。卡片重渲染时会被整块替换掉，不需要额外清理。 */
  function attNote(card) {
    let n = card.__sjNote;
    if (n && n.isConnected) return n;
    n = document.createElement('div');
    n.className = 'sj-dl-note';
    n.style.cssText = 'margin:-2px 2px 1px;font-size:12px;line-height:1.5;'
      + 'color:var(--accent);word-break:break-word;';
    try { card.parentNode.insertBefore(n, card.nextSibling); } catch (_) { return null; }
    card.__sjNote = n;
    return n;
  }
  /* await 之后已脱离用户手势，程序化 click 可能被内核静默吞掉；这时给一条真实可点的
     <a>，由用户亲手再点一下即可（这才是被真机验证可行的机制）。 */
  function ensureBrowserDlLink(el, intent, name) {
    if (!intent) return;
    const card = attCardOf(el);
    if (!card) return;
    const note = attNote(card);
    if (!note) return;
    let a = note.querySelector('.sj-browser-dl');
    if (!a) {
      a = document.createElement('a');
      a.className = 'sj-browser-dl';
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = '用系统浏览器下载「' + (name || '附件') + '」（点此）';
      note.appendChild(a);
    }
    a.href = intent;
  }

  /* 关于卡片下方那行常驻提示（hintDl，-59 ~ -64 用过，已删）：
     它当初是为了交代「系统弹了个确认框，去点打开」，因为 toast 两秒就消失、用户来不及看。
     但 -65 真机截图证明它反过来添乱：页内下载「成功」后留下的那行字（「已交给浏览器下载：
     进度见通知栏……」）与随后第二次点击产生的绿框叠在一起，卡片下方一片绿，用户根本分不清
     哪句是状态、哪个能点。而正常情况下（点一次 → 进 dl.html）这些字一句都不需要：
     中转页本身就是最清楚的反馈。故整条删除，卡片下方只在「真的失败了、需要你亲手点一下」
     时才出现东西 —— 也就是下面那个绿框。 */

  /* 预签结果按「附件 id」缓存，而不是只挂在卡片 el 上。
     两个原因：①附件列表会重渲染，旧的 el 被换掉后挂在上面的预签就丢了
     （预签回调里原本先判 el.isConnected，结果直接把结果丢弃）；
     ②用户可能在预签还没回来时就点下载，命中这里才谈得上「同步唤起」。
     值：{ signed, intent } */
  const dlSignCache = new Map();

  /* 「这个附件在本机下载过没有」——按文件名持久化，用于决定这次点击要不要出声。
     起因（用户 18:44 反馈）：同一份附件再点一次下载，Chrome 会先弹原生
     「是否重新下载文件？」询问框，用户还没做选择，页面底部就跳出
     「已开始下载…，进度见通知栏」——话说早了。第一次下载不会有那个询问框，
     所以只在「下过」时闭嘴，由浏览器自己的询问框 / 通知栏承担反馈。
     19:31 补充：只挡「已开始下载」是不够的 —— tryInPageDownload 里还有一句
     「正在保存…」，它发得更早，于是询问框还开着、底部已经在说「正在保存」。
     现在这个判断同时管住整条页内链路（见 tryInPageDownload 的 quiet 参数）。
     存的是文件名而不是 id：用户看到的就是文件名，改 id 不影响判断。 */
  const DL_SEEN_KEY = 'sj_dl_seen_v1';
  function dlSeenBefore(name) {
    try {
      const m = JSON.parse(localStorage.getItem(DL_SEEN_KEY) || '{}');
      return !!m[name];
    } catch (_) { return false; }
  }
  function dlMarkSeen(name) {
    try {
      const m = JSON.parse(localStorage.getItem(DL_SEEN_KEY) || '{}');
      m[name] = Date.now();
      const ks = Object.keys(m);
      /* 只留最近 200 条，别让这条记录无限膨胀把 localStorage 塞满 */
      if (ks.length > 200) {
        ks.sort((a, b) => m[a] - m[b]).slice(0, ks.length - 200).forEach((k) => { delete m[k]; });
      }
      localStorage.setItem(DL_SEEN_KEY, JSON.stringify(m));
    } catch (_) {}
  }

  /* 点击下载的总入口：本机已有二进制就同步交付；没有则按需取
     （内存 → 附件仓 → 云端），取到后立刻交付。失败如实提示，不假装成功。 */
  /* 应用内保存（手机独立 Android 首选路径）：把文件字节交给系统「保存 / 分享」面板，
     由用户选「保存到文件管理」。全程留在笔记页，不跳浏览器、没有地址栏，也绕开
     华为浏览器「禁止网页随意跳转」的拦截。
     实测依据：WebAPK 内 blob / dataURL 的 <a download> 会被内核静默丢弃（-37 真机
     验证过），所以不能走「应用内直接落盘」；而 Web Share（带 files）是系统级面板，
     由系统完成保存动作，不受容器限制。
     返回：'ok' 已交给系统面板 / 'cancel' 用户自己关掉面板 / '' 环境不支持需回退 */
  /* 应用内保存的前置判定：本机是否支持「带文件」的系统分享面板。
     华为内核不支持（真机验证：长按/分享均无可用的保存入口），先把这层挡掉，
     免得为了一个注定失败的分享白白多下一次文件字节。 */
  function canShareFiles() {
    try {
      if (!navigator.canShare) return false;
      const probe = new File([new Blob(['x'], { type: 'text/plain' })], 'x.txt', { type: 'text/plain' });
      return !!navigator.canShare({ files: [probe] });
    } catch (_) { return false; }
  }

  /* 取字节：页面内保存的公共前置。签名失效时网关可能返回网页，别把它当文件存。
     -56 起带 15 秒上限：慢网 / 登录态异常时，没有上限的 await 就是一个永久挂住
     的入口 —— -54 的「点了没有任何反应」已经证明这类挂起在真机上真的会发生。 */
  async function fetchSaveBlob(url) {
    let ac = null;
    let timer = null;
    try {
      const opt = { credentials: 'include' };
      if (typeof AbortController === 'function') {
        ac = new AbortController();
        opt.signal = ac.signal;
        timer = setTimeout(() => { try { ac.abort(); } catch (_) {} }, 15000);
      }
      const r = await fetch(url, opt);
      if (!r || !r.ok) return null;
      const ct = (r.headers.get('content-type') || '').toLowerCase();
      if (ct.indexOf('text/html') >= 0) return null;
      const b = await r.blob();
      return (b && b.size) ? b : null;
    } catch (_) { return null; }
    finally { if (timer) clearTimeout(timer); }
  }

  /* 关于「用 SW 中转、靠 Content-Disposition 保住文件名」那条路（/__sjdl/）：
     -50 首次用整页导航引入，真机无声无息失败；-56 换 location.href 仍失败，而且会把
     正在看的笔记顶走。**-58 按真机反馈改回 iframe 导航**，并且换了判定方式：
     不再看「页面是否失焦」（iframe 静默下载时系统根本不弹界面），改看「iframe 有没有
     真的产生文档」——没产生就说明响应被当成下载接手了。实现见 fireIframeDl。 */

  /* ------------------------------------- SW 代理下载（iframe 式，-58）
     把字节写进独立缓存 → 用**隐藏 iframe** 导航到 /__sjdl/<文件名>，sw.js 命中缓存后
     返回带 Content-Disposition 的标准 HTTP 响应。
     为什么不让脚本自己拼下载：
       ArkWeb 把「脚本用 a[download] 写 blob」判成越权下载直接丢弃；而「浏览器跟着一个
       HTTP 响应走完下载流程」是浏览器自己的行为，不归脚本管。这是本质差别。
     为什么用 iframe 而不是 location.href：
       整页导航会把用户正在看的笔记顶掉（-50「停在下载页」的根因），iframe 页面不动。
     三条必须同时满足才敢发（否则就是给用户一个 404 页面或空下载）：
       ① 接管页面的 SW 必须是本版（旧版没有 /__sjdl/ 路由）；
       ② 写完必须能立刻从缓存里读回来；
       ③ 导航后要能判定这次响应是否真的被当下载接手（fireIframeDl 的返回值）。 */
  const SW_DL_CACHE = 'sjdl-v1';
  /* -58 新增：用隐藏 iframe 触发下载，替代原来的 location.href 整页导航。
     为什么要换：整页导航会把正在看的笔记顶走（-50「停在下载页」就是这么来的），
     而 iframe 是更底层的下载触发路径，页面完全不动。
     判定方式（比「页面失焦」可靠，也不依赖用户手势）：
       - 响应被内核按附件接手 → 不产生文档 → onload 永不触发 → 返回 true
       - 响应被当网页渲染 / 缓存没命中 404 / 出错 → onload 立刻来 → 返回 false */
  function fireIframeDl(url, ms) {
    return new Promise((resolve) => {
      let fr = null;
      let settled = false;
      const done = (ok) => { if (settled) return; settled = true; resolve(ok); };
      try {
        fr = document.createElement('iframe');
        fr.setAttribute('aria-hidden', 'true');
        fr.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;border:0;opacity:0;';
        fr.onload = () => done(false);
        fr.onerror = () => done(false);
        fr.src = url;
        document.body.appendChild(fr);
      } catch (_) { done(false); return; }
      /* 一直到窗口结束都没有 onload：说明下载被接手了。 */
      setTimeout(() => done(true), ms || 2500);
      /* 清理给足 30 秒：一旦内核真的开始下载，iframe 可能仍是这次下载的载体，
         过早移除有中断大文件的风险；留着也只是个 1px 的空框。 */
      setTimeout(() => { try { if (fr && fr.parentNode) fr.parentNode.removeChild(fr); } catch (_) {} }, 30000);
    });
  }

  function asciiName(name) {
    const s = String(name || 'file').replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_').trim();
    return s || 'file';
  }
  async function saveViaSwProxy(blob, name) {
    let url = '';
    try {
      if (!blob || !blob.size) return '';
      if (!navigator.serviceWorker || !navigator.serviceWorker.controller) return '';
      const ctl = navigator.serviceWorker.controller.scriptURL || '';
      if (ctl.indexOf(APP_BUILD) < 0) return '';
      if (typeof caches === 'undefined') return '';
      const safe = name || 'file';
      url = '/__sjdl/' + encodeURIComponent(safe)
        + '?t=' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const cache = await caches.open(SW_DL_CACHE);
      await cache.put(url, new Response(blob, {
        headers: {
          'Content-Type': blob.type || 'application/octet-stream',
          'Content-Disposition': 'attachment; filename="' + asciiName(safe)
            + "\"; filename*=UTF-8''" + encodeURIComponent(safe),
        },
      }));
      if (!(await cache.match(url))) return '';
      /* -58：改用隐藏 iframe 导航（不再 location.href）。由 fireIframeDl 自己
         判定这次响应有没有被当成下载接手，返回 'ok' 才代表「确实进入了下载流程」。 */
      const taken = await fireIframeDl(url, 2500);
      return taken ? 'ok' : '';
    } catch (_) { return ''; }
  }

  /* 关于「观察窗 + blur 判定」（watchAfter，-56 ~ -58 用过，-59 删除）：
     它假设「有系统界面弹出 → 页面失焦」，据此提前认定下载已交给系统。真机证明
     这个假设不成立 —— intent 弹出的「此网站请求打开APP」是系统浮层，页面不失焦，
     于是把**成功的唤起**判成失败，进而去串后面那些必然失败的路径，反过来把系统
     确认框顶掉。判据撒谎的代价比没有判据更大，故整条删除。 */

  /* blob 直存（保底）：真实 <a download>，页面不动、不跳浏览器。
     已真机验证在浏览器普通标签页里可原地落盘；WebAPK 容器会静默丢弃。
     文件名用 File 而不是裸 Blob：Chromium 系在 download 属性被忽略时，会退而
     采用 blob 记录里的 File.name（裸 Blob 没有名字，只能拿 UUID 顶替）。 */
  function saveBlobAnchor(blob, name) {
    let objUrl = '';
    try {
      let body = blob;
      if (typeof File === 'function') {
        try { body = new File([blob], name, { type: blob.type || 'application/octet-stream' }); } catch (_) { body = blob; }
      }
      objUrl = URL.createObjectURL(body);
      const a = document.createElement('a');
      /* 先写 download 再写 href：部分国产浏览器只在解析 href 时读一次文件名。 */
      a.download = name;
      a.setAttribute('download', name);
      a.href = objUrl;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try { URL.revokeObjectURL(objUrl); a.remove(); } catch (_) {}
      }, 60000);
      return 'ok';
    } catch (_) {
      if (objUrl) { try { URL.revokeObjectURL(objUrl); } catch (_) {} }
      return '';
    }
  }

  /* 页面内保存的几个落点各自独立触发（见 startDownload 的顺序说明）。 */

  /* ---------------------------------------------- 直链下载（-58 起已撤下）
     原来这里有个 saveViaDirectHref：同源 URL + a[download] + target=_blank。
     理论上它最标准（blob 是「脚本在内存里拼字节」，直链只是一个普通资源下载请求），
     但真机上是另一回事：
       · ArkWeb 忽略 a[download] → 退化成把 PDF 当网页导航过去；
       · 于是 target=_blank 多开一个标签，并弹出「打开下载」询问；
       · 它从来没有真正落盘过 —— 反而每次都多弹一次窗（本轮反馈的那一弹就是它）。
     结论：删掉实现。直链导航改由 ② 的 iframe 通道（fireIframeDl + SW 的 attachment
     响应）承担：同样不取内存 blob、不拼地址，但页面不动、也不会弹询问。 */

  /* 关于「系统另存为」（showSaveFilePicker）：-54 / -55 两次真机尝试均失败 ——
     一次是它的 promise 永不 settle，整条下载链被锁死、界面毫无反应；一次加了
     blur 守卫仍无反应（blur 被误触发，守卫误以为真弹框而继续等）。
     结论：这条路由的代价（一次挂起 = 用户什么都做不了）远大于收益，已从主路径
     撤下并删除实现。若将来 ArkWeb 真支持，重写时务必给 await 一个硬上限，
     且判据不能只依赖 blur 这种会被误触发的信号。 */

  async function saveInApp(url, name, type) {
    if (!url || !canShareFiles()) return '';
    const blob = await fetchSaveBlob(url);
    if (!blob) return '';
    let file = null;
    try {
      file = new File([blob], name, { type: blob.type || type || 'application/octet-stream' });
    } catch (_) { return ''; }
    try {
      if (!navigator.canShare({ files: [file] })) return '';
    } catch (_) { return ''; }
    try {
      await navigator.share({ files: [file], title: name });
      return 'ok';
    } catch (e) {
      /* 用户主动关掉面板不算失败，不要再强行跳浏览器。 */
      if (e && e.name === 'AbortError') return 'cancel';
      return '';
    }
  }

  /* ------------------------------------------- 页内下载（-63 / -66 恢复）
     和 startDownload 里那套「交给系统浏览器」的分工：
       · Chromium 系：本页就能下，下载留在本页完成 → 一步点完，不出现中转页；
       · 其余 Android：页内下载会被内核吞掉，只能跳出去（见 startDownload 的 ⓪①②③）。
     顺序沿用已验证的偏好：SW 代理 + 隐藏 iframe（带 Content-Disposition，落盘名不会被
     内核改写）→ blob 锚点（保底）。
     返回 'ok' 只代表「下载动作已经发出去」，不代表内核真的写了文件 —— 浏览器不给这种
     回调。所以调用方要给一句可执行的后路（再点一次改走系统浏览器），不能报成功就完事。
     -67：成功时**不许**写 __sjDlTried。那是给 intent 通道记「上次唤起过了」用的时间戳，
     页内成功也写进去的话，第二次点击就会被判成 retry → 直接跳中转页（真机现象：第一次
     下成功，再点一次就弹「是否重新下载文件」的中转页）。改为成功时清 __sjInPageFailed、
     写 __sjDoneAt（只用于 10 秒内防重复下载）。 */
  async function tryInPageDownload(a, el, name, quiet) {
    let signed = (el && el.__sjSigned) || '';
    if (!signed && window.SJSignedUrl) {
      /* quiet：这个附件以前下过，Chrome 会先弹原生「是否重新下载文件？」。
         用户还没做选择，页面就报「正在准备 / 正在保存」等于替他下了结论
         （用户 19:31 反馈）。重复下载整条链路都不出声，把选择权留给系统框。 */
      if (!quiet) toast('正在准备文件…');
      try { const r = await window.SJSignedUrl(a); signed = (r && r.url) || ''; } catch (_) {}
      if (signed && el) el.__sjSigned = signed;
    }
    if (!signed || !/^https?:/i.test(signed)) return '';
    const blob = await fetchSaveBlob(signed);
    if (!blob) return '';
    if (!quiet) toast('正在保存「' + name + '」…');
    if ((await saveViaSwProxy(blob, name)) === 'ok') {
      if (el) { el.__sjDoneAt = Date.now(); el.__sjInPageFailed = 0; }
      return 'ok';
    }
    if (saveBlobAnchor(blob, name) === 'ok') {
      if (el) { el.__sjDoneAt = Date.now(); el.__sjInPageFailed = 0; }
      return 'ok';
    }
    return '';
  }

  async function startDownload(a, el) {
    if (!a || !a.id) return;
    const name = a.name || ('附件-' + a.id);
    /* 先自检：index.html 每次都是从网络取的、一定是新的，而 app.js 可能被旧 SW
       塞了缓存。版本不一致时，下面跑的全是旧逻辑 —— 界面上却完全看不出来，用户
       只会觉得「又没反应」。这种情况必须明说，而不是继续演一遍旧行为。 */
    const pageBuild = window.__SJ_SWV__ || '';
    if (pageBuild && pageBuild !== APP_BUILD) {
      toast('脚本还是旧版（' + APP_BUILD + '，页面已是 ' + pageBuild + '）：请完全关闭拾笺再重新打开');
      return;
    }
    /* 手机 Android 的下载顺序（-59 定稿，-66 收敛）。历史：-54/-55 的「系统另存为」会
       永久挂起，已删；-56 的「直链 href」真机从来没落盘过、还每次多弹一个「打开下载」
       询问，也已删；-63 的页内下载 -65 曾撤掉、-66 恢复（用户不愿看到中转页）。
       现在的顺序：
       ⓐ Chromium 系（Chrome / Edge 及同等内核）点击即页内下载（SW 代理 + 隐藏 iframe →
          blob 锚点），下完就结束 —— 没有中转页、没有窗口、不用点 ✗。**点多少次都一样**：
          -67 起判据是「页内有没有失败过」，而不是「这是第几次点击」（旧判据会把「下成了
          但用户没看见、于是又点一下」误判成失败，直接跳页）。10 秒内重复点击只重播提示，
          不再下第二份。只有页内真的发不出下载动作时，下一次点击才改走 ⓪。
       ⓪ 预签 intent 同步唤起 —— 渲染时就把签名地址和 intent 备好，点击瞬间（任何 await
          之前）同步唤起，进 dl.html 中转页，那一页上明写「下载已开始」，点左上角 ✗ 即回。
          真机证据：系统会弹「此网站请求打开APP」，说明这条通路是活的；但它必须由用户点
          「打开」，所以唤起后只做一件事 —— 返回，绝不再做任何会顶掉那个系统确认框的动作。
       ① SW 代理 + **隐藏 iframe** 导航 —— 仅在拿不到 intent（未预签成功）时尝试；
       ② blob 直存 —— 同上，最后再试一次；
       ③ 现签 intent + 绿色链接 —— 拿不到预签或唤起本身抛错时的兜底。
       任何一条都不要用「页面失焦」当判据：系统浮层不会触发 blur，那个假设已经不成立。 */
    if (isStandaloneAndroid() && !/^image\//.test(a.type || '')) {
      /* 快速路径（-58）：渲染时就预签好的 intent，必须在**任何 await 之前**同步唤起。
         之前它排在 ①②③ 之后（老的 ④），那时已经 await 了 3 秒多，用户手势早失效，
         内核把唤起静默吞掉 → 每次都退到绿色兜底框。挪到最前面，单击一次就能直接
         把下载交给系统浏览器，中间不弹任何东西、也不停留。
         注意：这里不能改成先 await 再唤起，一旦 await 就又会丢手势。 */
      /* retry 必须在使用之前算好：第二次点击（15 秒内）意味着上一次唤起没成，
         这时才给「亲手可点的链接」，第一次绝不给 —— 用户明确反感那个绿框。 */
      const retry = !!(el && el.__sjDlTried && Date.now() - el.__sjDlTried < 20000);
      /* -67：页内通道「要不要跳过」不再看 retry。
         retry 的判据是「20 秒内又点了一次」，它默认「又点一次 = 上次没成」——这个假设在
         intent 时代成立，在页内时代不成立：页内是**默默下完了**（-64 已真机证实），用户
         看不见又点一次，于是被判成失败、直接跳中转页，还弹「是否重新下载文件」。
         真机反馈（23:43）：第一次点下载成功，第二次点就跳页 —— 就是这么来的。
         改成看「页内是不是真的失败过」：__sjInPageFailed 只在两条路都没发出下载动作时写，
         成功会清掉；60 秒后自动失效，偶发失败不会把页内通道永久关死。 */
      const inPageBroken = !!(el && el.__sjInPageFailed
        && Date.now() - el.__sjInPageFailed < 60000);
      /* -67：10 秒内重复点同一个附件，不再下第二份 —— 用户真实行为就是「看不见反馈再点
         一下」（-64 因此把同一份文件下了两遍，系统还追问「是否重新下载」）。这里只重播
         提示，不发任何新请求，也就不可能跳页。超过 10 秒视为真的要再下一次。 */
      const justDone = !!(el && el.__sjDoneAt && Date.now() - el.__sjDoneAt < 10000);
      if (isChromiumLikeAndroid() && justDone) {
        toast('「' + name + '」正在下载，进度见通知栏；同一文件不用再点', 4000);
        return;
      }
      /* -66：Chromium 系第一次点击直接在页内下完 —— 不产生中转页，也就不需要有人去点 ✗
         （用户 23:36 的诉求：「可以不出现这个页面吗」）。真机已证明这条能落盘：-64 那轮
         系统弹出「打开 PDF 文件？」，再点一次还问「是否重新下载」。
         -67：判据从「第几次点击」改成「页内是否失败过」—— 只要没失败过，点多少次都在
         页内完成（用户 23:43 的诉求：「无论点多少次都不跳转」）。
         注意这里**不许插任何常驻文字**：-64 加过一行说明，与第二次点击的绿框叠成一团，
         用户明确反感。成功只给一句 toast。 */
      if (isChromiumLikeAndroid() && !inPageBroken) {
        /* 先读「以前下过没有」，再在成功时写。重复下载时 Chrome 会先弹原生
           「是否重新下载文件？」询问框，此时报「已开始下载」是抢在用户选择之前
           下结论（用户 18:44 反馈的就是这个）。第一次下载没有那个框，照常给 toast。
           'ok' 只代表请求已发出、拿不到「用户点了取消」的回调，所以这里只能用
           「以前下过」当作闭嘴的依据。
           19:31：这个依据同时传给 tryInPageDownload —— 那一层原本无条件报
           「正在保存…」，询问框还开着底部就先说了，用户以为已经在下（见下图）。
           重复下载现在从头到尾不出声，反馈交给系统的询问框和通知栏。 */
        const seenBefore = dlSeenBefore(name);
        if ((await tryInPageDownload(a, el, name, seenBefore)) === 'ok') {
          dlMarkSeen(name);
          if (!seenBefore) toast('已开始下载「' + name + '」，进度见通知栏', 4000);
          return;
        }
        /* 页内没发出去：记下「这条路在这台机器上不通」，同时按老语义写 __sjDlTried，
           让下一次点击能拿到绿链兜底。然后停在这里 —— await 之后手势已失效，
           接着唤起 intent 只会把界面搞乱。 */
        if (el) { el.__sjInPageFailed = Date.now(); el.__sjDlTried = Date.now(); }
        toast('没开始下载？再点一次按钮，改用系统浏览器');
        return;
      }
      const fastIntent = (el && el.__sjIntent)
        || ((dlSignCache.get(a.id) || {}).intent) || '';
      if (fastIntent && openViaSystemBrowser(fastIntent)) {
        /* -59：唤起之后**必须立刻收手**，这是本轮真机反馈定位到的根因。
           真机表现：intent 确实把请求交给了系统，弹出「此网站请求打开APP」——
           说明这条通路是活的。但这个确认框是**系统浮层，页面不会 blur**，老代码
           据此判成「唤起没生效」，接着去开应用内分享面板、iframe、blob，最后再
           唤起第二次并渲染绿色兜底框。这些动作在 1.5 秒内把系统确认框顶掉了，
           用户根本没机会点「允许」，看到的就只剩「弹窗一闪 + 绿框」。
           所以：唤起成功即返回，后续任何路径都不许再动界面。 */
        if (el) el.__sjDlTried = Date.now();
        if (!retry) {
          /* 只留一句 toast（两秒自动消失，不占版面）。卡片下方不再挂常驻说明：
             -65 真机截图证明那行绿字会和「第二次点击」的绿框叠在一起，用户分不清
             哪句是状态、哪个能点。中转页本身就是最清楚的反馈。 */
          toast('请点系统提示里的「打开」');
          return;
        }
        /* 第二次点击 = 上一次没走通（用户取消 / 没弹窗）。仍先唤起，同时补一条
           亲手可点的链接，不让人卡死在这里。 */
        ensureBrowserDlLink(el, fastIntent, name);
        toast('若没弹出浏览器，请点卡片里的「用系统浏览器下载」');
        return;
      }
      /* 渲染时已预签好地址，直接复用；没有才现签。 */
      let signed = (el && el.__sjSigned) || '';
      if (!signed && window.SJSignedUrl) {
        toast('正在准备文件…');
        try { const r = await window.SJSignedUrl(a); signed = (r && r.url) || ''; } catch (_) {}
        if (signed && el) el.__sjSigned = signed;
      }
      if (!retry && signed && /^https?:/i.test(signed)) {
        const st = await saveInApp(signed, name, a.type);
        /* 分享面板 resolve 只代表用户走完了面板，保存位置是他自己选的，算「交给系统」，
           不能说成「已保存」——文件名和落点都还没被确认。 */
        if (st === 'ok') { toast('已交给系统保存「' + name + '」'); return; }
        if (st === 'cancel') return;
        /* 先给一句反馈：下面几条是「试了才知道」的路径，要花两三秒，不给提示的话
           用户会以为又没反应 —— 那正是这两轮反复踩的坑。 */
        toast('正在准备下载「' + name + '」…');
        /* ①（原「直链 href + target=_blank」）已移除。真机上它只会多开一个标签、
           弹出「打开下载」询问，从来没有真正落盘过（本轮用户反馈的那一弹就是它）。
           它的活交给下面 ② 的 iframe 通道做：同样是直链导航，但不跳页、不弹询问。 */
        /* ② SW 代理 + iframe 导航：让下载成为浏览器自己的 HTTP 下载流程。
           不再用「页面失焦」判定 —— iframe 静默下载时系统未必弹界面，用失焦会误判
           成失败。改由 fireIframeDl 看这次响应有没有真的被当下载接手。 */
        const blob = await fetchSaveBlob(signed);
        if (blob) {
          if ((await saveViaSwProxy(blob, name)) === 'ok') {
            if (el) el.__sjDlTried = Date.now();
            toast('已开始下载「' + name + '」；请到手机的「下载」里查看');
            return;
          }
          /* ③ blob 直存：标签页里验证过能原地落盘。 */
          if (saveBlobAnchor(blob, name) === 'ok') {
            if (el) el.__sjDlTried = Date.now();
            toast('已交给系统下载「' + name + '」；请到手机的「下载」里查看');
            return;
          }
        }
        /* 取字节本身就失败了（网络 / 登录态），下面交给浏览器再试一次。 */
      }
      /* ④ 第二击，或 ①②③ 都没成功：直接落到 intent，不再重试不可检测的路径。 */
      if (retry) toast('改用浏览器下载…');
      /* 渲染时已预签好：在本次点击手势内同步唤起，单次点击即可弹出系统选择。 */
      if (el && el.__sjIntent && openViaSystemBrowser(el.__sjIntent)) return;
      toast('正在准备下载链接…');
      try {
        const r = signed ? { url: signed } : (window.SJSignedUrl ? await window.SJSignedUrl(a) : null);
        const s = r && r.url;
        if (s && /^https?:/i.test(s)) {
          const intent = buildDlIntent(s, name);
          if (el) { el.__sjSigned = s; el.__sjIntent = intent; }
          /* 写进 id 级缓存：用户「再点一下」时能命中上面的快速路径，
             不必依赖绿色框里那条手动链接。 */
          dlSignCache.set(a.id, { signed: s, intent });
          /* await 后手势已失效，程序化 click 可能无效 —— 无论同步是否成功，
             都补一条真实可点的链接，保证用户再点一下必能唤起系统浏览器。 */
          openViaSystemBrowser(intent);
          ensureBrowserDlLink(el, intent, name);
          return;
        }
      } catch (_) {}
      toast('无法生成下载链接：请连网并在「同步」里确认已登录后再试');
      return;
    }
    if (deliverNow(a)) {
      toast('已开始下载「' + name + '」');
      return;
    }
    if (dlBusy.has(a.id)) return;
    dlBusy.add(a.id);
    toast('正在把这个文件准备到手机上…');
    try {
      let data = await attBinaryGet(a);
      if (!data) data = await fetchRemoteData(a);
      if (!data) {
        toast('这份文件还没存到手机里：连网后点右上「同步」→「从云端拉取」，回来再点下载');
        return;
      }
      dlData.set(a.id, data);
      if (!dlRaw.has(a.id)) {
        const blob = dataUrlToBlob(data);
        if (blob) dlRaw.set(a.id, blob);
      }
      if (el && el.isConnected) markReady(el, a);
      if (deliverNow(a)) {
        toast('已开始下载「' + name + '」；若没出现下载，再点一下按钮');
      } else {
        toast('文件已取到手机，但这次没能交给浏览器：请再点一下下载按钮');
      }
    } finally {
      dlBusy.delete(a.id);
    }
  }

  /* 附件大图：手机浏览器若仍拦截下载，这是保底出口 —— 全屏看图后长按保存，
     所有国产手机浏览器都支持。点任意位置关闭。 */
  function closeAttView() {
    const old = document.getElementById('attView');
    if (old) old.remove();
    try { document.body.classList.remove('att-view-open'); } catch (_) {}
  }
  function openAttView(src, name, att) {
    if (!src) return;
    closeAttView();
    const box = document.createElement('div');
    box.className = 'att-view';
    box.id = 'attView';
    const img = document.createElement('img');
    img.src = src;
    img.alt = name || '';
    const tip = document.createElement('div');
    tip.className = 'att-view-tip';
    /* 底部只留一句「点空白关闭」。
       触屏端曾额外做一个胶囊写「长按图片保存 · 点空白关闭」，但上方就有可点的
       「下载原图」，两条都在教怎么存文件：语义重复，且胶囊与按钮在底部压在一起
       （用户 18:41 反馈）。长按这条保底路径挪到下载发起失败时的 toast 里说。 */
    tip.textContent = '点空白处关闭';
    box.appendChild(img);
    /* 「下载原图」与附件卡片走同一条 startDownload()。 */
    const href = /^\/api\/files\//.test(src) ? '' : src;
    if (href || att) {
      const dl = document.createElement('button');
      dl.className = 'att-view-dl';
      dl.type = 'button';
      dl.textContent = '下载原图';
      dl.addEventListener('click', (e) => {
        e.stopPropagation();                 // 别让点击冒泡去关掉大图
        if (att) { startDownload(att, dl); return; }
        if (/^(data|blob):/i.test(href)) {
          triggerSave(href, name || '附件');
          toast('已开始下载「' + (name || '附件') + '」；没出现下载就长按图片保存');
        }
      });
      box.appendChild(dl);
    }
    box.appendChild(tip);
    box.addEventListener('click', closeAttView);
    document.body.appendChild(box);
    /* 让提示条在大图打开时上移，别压住「下载原图」和长按提示 */
    try { document.body.classList.add('att-view-open'); } catch (_) {}
  }

  /* 打开图片大图。地址要的是「能显示」的 data:/blob:。
     开大图前先把二进制备进内存，点「下载原图」时才能同步现造 URL 交付。 */
  async function openImagePreview(a) {
    if (!a || !a.id) return;
    let src = localDataUrlOf(a) || attDisplaySrc(a);
    if (!src || /^\/api\/files\//.test(src)) {
      try {
        if (window.SJLocal && window.SJLocal.attachmentUrl) src = await window.SJLocal.attachmentUrl(a.id);
      } catch (_) {}
    }
    if (!src || /^\/api\/files\//.test(src)) {
      toast('图片还没存到本机，点右上「同步」→「从云端拉取」后再看');
      return;
    }
    /* 先把二进制备进内存，点「下载原图」时才能在同一个调用栈里现造 URL 交付 */
    await ensureBlob(a);
    openAttView(src, a.name, a);
  }

  function renderAttachments() {
    const note = currentNote();
    const box = $('#attachList');
    box.innerHTML = '';
    if (!note) return;
    const list = note.attachments || [];
    /* 回收不再属于当前笔记的二进制缓存，避免翻很多篇后内存一直涨。
       现在缓存的是 Blob 本身，不是 blob: URL —— URL 点击现造、用完即弃。 */
    const keepDl = new Set(list.map((x) => x.id));
    for (const id of dlRaw.keys()) if (!keepDl.has(id)) dlRaw.delete(id);
    for (const id of dlData.keys()) if (!keepDl.has(id)) dlData.delete(id);
    $('#attCount').textContent = list.length;

    if (!list.length) {
      const p = document.createElement('div');
      p.className = 'attach-empty';
      p.textContent = '还没有附件。点击右上角回形针，或把文件拖进编辑区。';
      box.appendChild(p);
      return;
    }

    for (const a of list) {
      const el = document.createElement('div');
      el.className = 'att';
      const isImg = /^image\//.test(a.type);
      const ext = (a.name.split('.').pop() || 'file').slice(0, 4);
      const size = a.size > 1024 * 1024 ? (a.size / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(a.size / 1024)) + ' KB';
      el.innerHTML = `
        ${isImg
          ? `<img class="att-thumb" src="${attDisplaySrc(a)}" alt="">`
          : `<div class="att-ext">${escapeHtml(ext)}</div>`}
        <div class="att-meta">
          <div class="att-name" data-tip="${escapeHtml(a.name)}">${escapeHtml(a.name)}</div>
          <div class="att-size">${size}</div>
        </div>
        <div class="att-acts">
          <button class="att-act" data-act="insert" data-tip="插入到正文">${I.plus}</button>
          <button class="att-act" data-act="dl" data-att="${escapeHtml(a.id)}" data-tip="下载">${I.download}</button>
          <button class="att-act del" data-act="del" data-tip="删除附件">${I.x}</button>
        </div>`;
      el.querySelector('[data-act="insert"]').addEventListener('click', () => insertAttachment(a));
      /* 附件卡片按钮：图片先给大图（可长按保存），其余附件直接下载。 */
      const dlEl = el.querySelector('[data-act="dl"]');
      if (isImg) {
        /* 图片的大图里另有「下载原图」；不看二进制是否就绪，
           图坏了但地址在的时候，用户照样需要能存下这张图。 */
        dlEl.dataset.tip = '查看大图（可长按保存）';
        dlEl.addEventListener('click', (e) => {
          e.preventDefault();
          void openImagePreview(a);
        });
      } else {
        /* 下载按钮用 <button>，回调里直接交付，不消耗本次点击手势。 */
        dlEl.addEventListener('click', () => { startDownload(a, dlEl); });
        /* 手机独立 Android：渲染时就异步预签下载链接并缓存到卡片上，用户点击
           下载时即可在手势内同步唤起系统浏览器（避免 await 后手势失效被静默吞）。 */
        if (isStandaloneAndroid() && window.SJSignedUrl) {
          void Promise.resolve(window.SJSignedUrl(a)).then((r) => {
            const signed = r && r.url;
            if (!signed || !/^https?:/i.test(signed)) return;
            const intent = buildDlIntent(signed, a.name);
            /* 先写 id 级缓存：卡片就算已经被重渲染换掉，这次预签也不算白做。 */
            dlSignCache.set(a.id, { signed, intent });
            if (!el.isConnected) return;
            el.__sjSigned = signed;
            el.__sjIntent = intent;
          }).catch(() => {});
        }
      }
      el.querySelector('[data-act="del"]').addEventListener('click', () => deleteAttachment(a));
      if (isImg) {
        const thumb = el.querySelector('.att-thumb');
        if (thumb) thumb.addEventListener('click', () => { void openImagePreview(a); });
      }
      box.appendChild(el);
      /* 非图片先预取二进制，点下去才能在同一个调用栈里同步交付。
         图片的卡片按钮是「看大图」，打开大图前另有一次 ensureBlob()。 */
      if (!isImg) {
        void prepareWhenReady(dlEl, a).then((ok) => {
          /* 本机附件仓里没有、同步来源也拿不到 → 试一次云端 */
          if (!ok) void prefetchDownload(a, dlEl);
        });
      }
    }
  }

  async function uploadFiles(files, opts = {}) {
    const note = currentNote();
    if (!note) return;
    let ok = 0;
    const inserted = [];
    for (const raw of files) {
      const f = window.SJCompress ? await window.SJCompress(raw) : raw;
      if (f.size > 20 * 1024 * 1024) {
        toast(`「${f.name}」超过 20MB，未上传`);
        continue;
      }
      try {
        const data = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result);
          r.onerror = rej;
          r.readAsDataURL(f);
        });
        const att = await api(`/api/notes/${note.id}/attachments`, {
          method: 'POST',
          body: { name: f.name, type: f.type || 'application/octet-stream', data },
        });
        note.attachments.push(att);
        if (opts.insert && /^image\//.test(att.type)) inserted.push(att);
        ok++;
      } catch (e) {
        toast(`上传失败：${e.message}`);
      }
    }
    if (ok) {
      renderAttachments();
      updateAttachBadge();
      renderList();
      $('#attachPanel').classList.remove('hidden');
      toast(`已添加 ${ok} 个附件`);
      inserted.forEach((att) => insertAttachment(att));
    }
  }

  function insertAttachment(a) {
    const note = currentNote();
    if (!note) return;
    const isImg = /^image\//.test(a.type);
    const pane = $('#richPane');
    /* 插图不是打字：静默聚焦，别把输入法顶出来，也别丢原来的光标位置 */
    focusQuiet(pane);
    restoreRange();
    const html = isImg
      ? `<img src="${attDisplaySrc(a)}" alt="${escapeHtml(a.name)}" style="max-width:100%;height:auto;border-radius:8px;display:block;margin:8px 0">`
      : `<a href="${attDisplaySrc(a)}" target="_blank">${escapeHtml(a.name)}</a>`;
    document.execCommand('insertHTML', false, html);
    onRichInput();
    toast('已插入正文');
  }

  async function deleteAttachment(a) {
    const note = currentNote();
    if (!note) return;
    openConfirm({
      title: '删除附件',
      message: `「${escapeHtml(a.name)}」将从这条笔记中移除，磁盘上的文件也会一并删除，无法恢复。`,
      confirmText: '删除',
      danger: true,
      onConfirm: async () => {
        await api(`/api/notes/${note.id}/attachments/${a.id}`, { method: 'DELETE' });
        note.attachments = note.attachments.filter((x) => x.id !== a.id);
        renderAttachments();
        updateAttachBadge();
        renderList();
        toast('附件已删除');
      },
    });
  }

  /* ---------------------------------------------------------- 弹层 */
  function openModal(html) {
    const root = $('#modalRoot');
    root.innerHTML = `<div class="modal">${html}</div>`;
    root.classList.remove('hidden');
    return root.querySelector('.modal');
  }

  function closeModal() {
    $('#modalRoot').classList.add('hidden');
    $('#modalRoot').innerHTML = '';
  }

  function openConfirm({ title, message, confirmText = '确定', danger = false, onConfirm }) {
    const m = openModal(`
      <h3>${escapeHtml(title)}</h3>
      <p>${message}</p>
      <div class="modal-actions">
        <button class="btn ghost" data-act="cancel">取消</button>
        <button class="btn ${danger ? 'danger' : 'primary'}" data-act="ok">${escapeHtml(confirmText)}</button>
      </div>`);
    m.querySelector('[data-act="cancel"]').onclick = closeModal;
    m.querySelector('[data-act="ok"]').onclick = async () => {
      closeModal();
      try { await onConfirm(); } catch (e) { toast(e.message); }
    };
    m.querySelector('[data-act="ok"]').focus();
  }

  function openPrompt({ title, message = '', value = '', placeholder = '', confirmText = '确定', onConfirm }) {
    const m = openModal(`
      <h3>${escapeHtml(title)}</h3>
      ${message ? `<p>${message}</p>` : ''}
      <input type="text" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" maxlength="60">
      <div class="modal-actions">
        <button class="btn ghost" data-act="cancel">取消</button>
        <button class="btn primary" data-act="ok">${escapeHtml(confirmText)}</button>
      </div>`);
    const input = m.querySelector('input');
    const submit = async () => {
      const v = input.value.trim();
      if (!v) { input.focus(); return; }
      closeModal();
      try { await onConfirm(v); } catch (e) { toast(e.message); }
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); submit(); }
    });
    m.querySelector('[data-act="cancel"]').onclick = closeModal;
    m.querySelector('[data-act="ok"]').onclick = submit;
    setTimeout(() => { input.focus(); input.select(); }, 30);
  }

  /* 类别操作 */
  function createCategory(parentId, name) {
    return api('/api/categories', { method: 'POST', body: { name, parentId: parentId || null } })
      .then((cat) => {
        state.categories.push(cat);
        if (parentId) {
          const p = state.categories.find((c) => c.id === parentId);
          if (p) p.expanded = true;
        }
        renderTree();
        toast(`已新建类别「${cat.name}」`);
        window.dispatchEvent(new Event('sj-categories-changed'));
        return cat;
      });
  }

  function askCreateCategory(parentId) {
    const parent = parentId ? state.categories.find((c) => c.id === parentId) : null;
    openPrompt({
      title: parent ? `在「${parent.name}」下新建子类别` : '新建类别',
      message: '类别可以无限层级嵌套，之后随时可改名或移动。',
      placeholder: '例如：业务学习 / 党纪法规',
      confirmText: '创建',
      onConfirm: (v) => createCategory(parentId, v),
    });
  }

  function renameCategory(cat) {
    openPrompt({
      title: '重命名类别',
      value: cat.name,
      confirmText: '保存',
      onConfirm: async (v) => {
        const updated = await api(`/api/categories/${cat.id}`, { method: 'PATCH', body: { name: v } });
        Object.assign(cat, updated);
        renderTree();
        renderList();
        if (state.selNote) openNote(state.selNote);
        toast('已重命名');
        window.dispatchEvent(new Event('sj-categories-changed'));
      },
    });
  }

  function deleteCategory(cat) {
    const count = subtreeCount(cat.id, state.notes);
    const m = openModal(`
      <h3>删除类别「${escapeHtml(cat.name)}」</h3>
      <p>该类别下共有 ${count} 篇笔记（含子类别）。请选择处理方式：</p>
      <div class="modal-choices">
        <label class="choice sel" data-mode="move">
          <span class="radio"></span>
          <span><b>保留笔记，移到上一级</b><span>笔记不会丢失，子类别一并上移</span></span>
        </label>
        <label class="choice" data-mode="delete">
          <span class="radio"></span>
          <span><b>连同笔记一起删除</b><span>类别直接删除；笔记连同附件移到回收站，30 天内可恢复</span></span>
        </label>
      </div>
      <div class="modal-actions">
        <button class="btn ghost" data-act="cancel">取消</button>
        <button class="btn danger" data-act="ok">删除类别</button>
      </div>`);
    let mode = 'move';
    $$('.choice', m).forEach((c) => {
      c.addEventListener('click', () => {
        $$('.choice', m).forEach((x) => x.classList.remove('sel'));
        c.classList.add('sel');
        mode = c.dataset.mode;
      });
    });
    m.querySelector('[data-act="cancel"]').onclick = closeModal;
    m.querySelector('[data-act="ok"]').onclick = async () => {
      closeModal();
      const ids = new Set([cat.id]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const c of state.categories) {
          if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) { ids.add(c.id); changed = true; }
        }
      }
      try {
        await api(`/api/categories/${cat.id}?strategy=${mode}`, { method: 'DELETE' });
        if (mode === 'move') {
          state.notes.forEach((n) => { if (ids.has(n.categoryId)) n.categoryId = cat.parentId || null; });
          state.categories.forEach((c) => { if (c.parentId === cat.id) c.parentId = cat.parentId || null; });
        } else {
          state.notes = state.notes.filter((n) => !ids.has(n.categoryId));
        }
        state.categories = state.categories.filter((c) => !ids.has(c.id));
        if (!noteById(state.selNote)) closeEditor();
        if (ids.has(state.selCat)) state.selCat = 'all';
        renderTree();
        renderList();
        toast('类别已删除');
        window.dispatchEvent(new Event('sj-categories-changed'));
      } catch (e) { toast(e.message); }
    };
  }

  /* 移动笔记到分类（手机端没有拖拽，用弹层选择） */
  function openCategoryPicker(note) {
    if (!note) return;
    const opts = [{ id: '', name: '未分类', depth: -1 }];
    function walk(list, depth) {
      list.forEach((c) => {
        opts.push({ id: c.id, name: c.name, depth });
        walk(state.categories.filter((x) => x.parentId === c.id), depth + 1);
      });
    }
    walk(state.categories.filter((c) => !c.parentId), 0);

    const items = opts.map((o) => {
      const pad = o.depth < 0 ? 10 : 10 + o.depth * 16;
      const tick = (note.categoryId || '') === o.id ? '<span class="picker-tick">✓</span>' : '';
      return `<button class="picker-opt" data-id="${o.id}" style="padding-left:${pad}px">${tick}${escapeHtml(o.name)}</button>`;
    }).join('');

    const m = openModal(`<h3>移动到分类</h3><div class="picker-list">${items}</div>`);
    m.querySelectorAll('.picker-opt').forEach((b) => {
      b.addEventListener('click', () => {
        const id = b.dataset.id || null;
        closeModal();
        note.categoryId = id;
        note.updatedAt = Date.now();
        markDirty();
        renderTree();
        renderList();
        const cat = catMap().get(id);
        const el = $('#metaInfo');
        if (el) el.innerHTML = metaInfoHTML(note);
        /* 手机端标题下面那一行也要跟着换，否则分类还停在上一个 */
        if (window.SJRefreshNoteMeta) window.SJRefreshNoteMeta();
        toast('已移动到「' + (cat ? cat.name : '未分类') + '」');
      });
    });
  }

  /* 笔记操作 */
  async function createNote(categoryId) {
    await saveNow();
    if (draftSaving) await draftSaving;
    let target = categoryId;
    if (target === undefined) {
      target = state.categories.some((c) => c.id === state.selCat) ? state.selCat : null;
    }
    /* -70：不再立刻 POST。空白草稿只在内存里；离开时按是否有内容决定
       落库或丢弃，所以「点了 + 没写就回列表」不会留下无标题笔记。 */
    const t = Date.now();
    draftNote = {
      id: DRAFT_ID,
      categoryId: target, title: '', content: '',
      /* 新建就走富文本，所见即所得。 */
      format: 'rich',
      starred: false, tags: [], attachments: [],
      createdAt: t, updatedAt: t,
    };
    if (state.selCat !== 'all' && state.selCat !== 'starred' && state.selCat !== 'uncat') {
      // 保持当前类别视图
    } else {
      state.selCat = 'all';
    }
    renderTree();
    openNote(DRAFT_ID, { focusTitle: true });
    renderList();
    closeDrawer(); // 手机上建完立刻回到编辑区
  }

  function closeEditor() {
    /* 收起编辑器也是「离开」：先落盘。删除笔记时该篇已从 state 移除，
       saveNow 会因找不到当前笔记直接返回，不会对已删记录发 PATCH。 */
    void saveNow();
    state.selNote = null;
    state.dirty = false;
    savedSnapshot = '';
    closeTagInput();
    const tl = $('#tagList');
    if (tl) tl.innerHTML = '';
    $('#editorWrap').classList.add('hidden');
    $('#emptyState').classList.remove('hidden');
    /* 阅读态的「顶栏加线 + 小标题」是滚动状态，离开详情时一并复位 */
    if (window.SJSyncCollapse) window.SJSyncCollapse();
    document.body.classList.remove('sj-head-solid');
    renderList();
  }

  function deleteNote(note) {
    /* -70：空白草稿还没进库，直接丢弃，不必创建再移进回收站。 */
    if (note === draftNote) { discardDraft(); return; }
    const attCount = (note.attachments || []).length;
    openConfirm({
      title: '删除笔记',
      /* -68：原文案写「永久删除…无法恢复」，但 local.js 的 DELETE /notes/:id 是软删除
         （只写 deletedAt，附件与历史版本都留着，30 天后才真删，回收站里可恢复）。
         文案必须与行为一致，否则用户会以为删掉就找不回了。 */
      message: `「${escapeHtml(note.title || '无标题笔记')}」将移到回收站${attCount ? `，${attCount} 个附件一并保留` : ''}，30 天内可恢复。`,
      confirmText: '删除',
      danger: true,
      onConfirm: async () => {
        await api(`/api/notes/${note.id}`, { method: 'DELETE' });
        state.notes = state.notes.filter((n) => n.id !== note.id);
        closeEditor();
        renderTree();
        renderList();
        toast('已移到回收站，30 天内可恢复');
      },
    });
  }

  /* ---------------------------------------------------------- 历史版本 */
  const REASON_LABEL = { auto: '自动留存', format: '格式转换前', restore: '恢复前状态', manual: '手动留存' };

  function fmtFull(ts) {
    const d = new Date(ts);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getMonth() + 1}月${d.getDate()}日 ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  async function openHistory() {
    const note = currentNote();
    if (!note) return;
    await saveNow();
    /* -70：空白草稿可能已被丢弃；此时不该再拿临时 id 去查版本接口。 */
    if (!currentNote()) return;
    let versions = [];
    try {
      versions = (await api(`/api/notes/${note.id}/versions`)).versions || [];
    } catch (e) {
      return toast(e.message);
    }

    const m = openModal(`
      <div class="hist-head">
        <div>
          <h3>历史版本</h3>
          <p>${versions.length ? `共 ${versions.length} 个版本，选中后可预览与恢复` : '还没有历史版本'}</p>
        </div>
        <button class="icon-btn" data-act="close" title="关闭">${I.x}</button>
      </div>
      <div class="hist-body" id="histBody"></div>
      <div class="hist-foot">
        <span id="histHint">自动保存时留存，最多保留 40 个版本</span>
        <button class="btn primary" id="histRestore" disabled>恢复此版本</button>
      </div>`);
    m.classList.add('wide');
    m.querySelector('[data-act="close"]').addEventListener('click', closeModal);

    const body = m.querySelector('#histBody');
    if (!versions.length) {
      body.innerHTML = `<div class="hist-empty"><div>这条笔记还没有历史版本<br><span style="opacity:.65">继续编辑并保存，系统会自动记录</span></div></div>`;
      return;
    }

    body.innerHTML = `
      <div class="hist-list" id="histList"></div>
      <div class="hist-preview markdown-body" id="histPreview"></div>`;
    const listEl = body.querySelector('#histList');
    const prevEl = body.querySelector('#histPreview');
    const restoreBtn = m.querySelector('#histRestore');
    const hint = m.querySelector('#histHint');
    let picked = null;
    let pickedEl = null;

    async function pick(v, el) {
      if (pickedEl) pickedEl.classList.remove('active');
      pickedEl = el;
      el.classList.add('active');
      prevEl.innerHTML = '<div class="hist-empty" style="height:100%">载入中…</div>';
      try {
        const full = await api(`/api/notes/${note.id}/versions/${v.id}`);
        picked = full;
        prevEl.innerHTML = DOMPurify.sanitize(full.content || '');
        restoreBtn.disabled = false;
        hint.textContent = `版本时间：${fmtFull(full.ts)}　·　${(full.content || '').length} 字`;
      } catch (e) {
        prevEl.innerHTML = `<div class="hist-empty" style="height:100%">载入失败：${escapeHtml(e.message)}</div>`;
      }
    }

    versions.forEach((v, idx) => {
      const el = document.createElement('div');
      el.className = 'hist-item';
      const size = v.size > 1000 ? `${(v.size / 1000).toFixed(1)} 千字` : `${v.size} 字`;
      el.innerHTML = `
        <div class="hist-time">${fmtFull(v.ts)}</div>
        <div class="hist-sub"><span>${REASON_LABEL[v.reason] || '自动留存'}</span><span>·</span><span>${size}</span></div>`;
      el.addEventListener('click', () => pick(v, el));
      listEl.appendChild(el);
      if (idx === 0) pick(v, el);
    });

    restoreBtn.addEventListener('click', async () => {
      if (!picked) return;
      restoreBtn.disabled = true;
      restoreBtn.textContent = '恢复中…';
      try {
        const updated = await api(`/api/notes/${note.id}/versions/${picked.id}/restore`, { method: 'POST' });
        Object.assign(note, updated);
        closeModal();
        openNote(note.id);
        renderTree();
        renderTags();
        renderList();
        toast('已恢复到所选版本');
      } catch (e) {
        toast(e.message);
        restoreBtn.disabled = false;
        restoreBtn.textContent = '恢复此版本';
      }
    });

    /* v1.8.0：挂上「历史版本对比」入口 */
    if (window.SJDiff) {
      window.SJDiff.attach(note, versions, {
        api, openModal, closeModal, fmtFull, renderMarkdown, DOMPurify, toast, escapeHtml,
        closeIcon: I ? I.x : '✕',
      });
    }
  }

  /* ---------------------------------------------------------- 存为版本（-72）
     服务端与本地库各有一个专门端点，不借 PATCH 触发 —— PATCH 会把 updatedAt
     顶新、扰乱同步 LWW 与列表排序，而且没改内容时根本不会产生快照。 */
  async function saveAsVersion() {
    if (!currentNote()) { toast('请先打开一篇笔记'); return; }
    await saveNow();
    const note = currentNote();
    if (!note || state.selNote === DRAFT_ID) { toast('请先写完并保存这篇笔记'); return; }
    try {
      const r = await api(`/api/notes/${note.id}/versions`, { method: 'POST', body: {} });
      toast(`已存为版本（共 ${r && r.count ? r.count : '若干'} 个）`);
    } catch (e) { toast('存为版本失败：' + e.message); }
  }

  /* ---------------------------------------------------------- 导出 */
  async function openExportMenu(anchor) {
    const note = currentNote();
    if (!note) return;
    const r = anchor.getBoundingClientRect();
    showCtx(r.right - 208, r.bottom + 6, [
      { label: '导出为 Word (.docx)', icon: I.doc, onClick: () => doExport('docx') },
      /* -72：手机浏览器普遍不支持「另存为 PDF」，打印入口点了没结果。
         项目 8.28 已因同一理由彻底移除 PDF 合集导出，这里只收掉云端入口，
         桌面办公场景仍保留。export.js 的 toPdf() 代码不删，桌面还在用。 */
      { label: '导出为 Markdown (.md)', icon: I.code, onClick: () => doExport('md') },
      { label: '查看 / 复制 Markdown 源码', icon: I.code, onClick: () => showMarkdownSource() },
      { label: '存为版本（手动快照）', icon: I.doc, onClick: () => saveAsVersion() },
      { label: '🔒 加密备份（.vault）', icon: I.lock || I.doc, onClick: () => { if (window.SJE2EE) window.SJE2EE.openPanel(); } },
    ]);
  }

  /* 查看 Markdown 源码：正文统一用富文本编辑，源码退到这里来。
     富文本笔记转成 Markdown，Markdown 笔记给原文，可直接复制走。 */
  function showMarkdownSource() {
    const note = currentNote();
    if (!note) return;
    let src = '';
    try { src = td.turndown(note.content || ''); }
    catch (_) { src = note.content || ''; }
    const m = openModal(`
      <h3>Markdown 源码</h3>
      <textarea class="sj-src-box" readonly spellcheck="false"></textarea>
      <div class="modal-actions">
        <button class="btn ghost" data-act="cancel">关闭</button>
        <button class="btn primary" data-act="copy">复制源码</button>
      </div>`);
    const box = m.querySelector('.sj-src-box');
    box.value = src;
    m.querySelector('[data-act="cancel"]').onclick = closeModal;
    m.querySelector('[data-act="copy"]').onclick = async () => {
      closeModal();
      try {
        await navigator.clipboard.writeText(src);
        toast('源码已复制');
      } catch (_) {
        toast('复制失败，请手动选中复制');
      }
    };
    box.focus();
  }

  async function doExport(kind) {
    const note = currentNote();
    if (!note) return;
    await saveNow();
    const html = DOMPurify.sanitize(note.content || '');
    try {
      if (kind === 'docx') {
        toast('正在生成 Word 文档…');
        await NoteExport.toWord({ title: note.title, html, tags: note.tags, updatedAt: note.updatedAt });
        toast('Word 文档已导出');
      } else if (kind === 'pdf') {
        NoteExport.toPdf({ title: note.title, html, tags: note.tags, updatedAt: note.updatedAt });
      } else {
        const md = td.turndown(html);
        NoteExport.toMarkdown({ title: note.title, content: md });
        toast('Markdown 已导出');
      }
    } catch (e) {
      toast('导出失败：' + e.message);
    }
  }

  /* ---------------------------------------------------------- 右键菜单 */
  const ctx = $('#ctxMenu');
  /* 菜单常常是在一次 click 里弹出的（底栏「更多」这类），事件紧接着冒泡到下面那个
     「点别处关菜单」的 document 监听，会把刚弹出的菜单立刻关掉——表现就是点了没反应。
     这里立一个只活到本任务结束的守卫，把这一次冒泡挡掉；下次点击是新任务，守卫已清。 */
  let ctxJustOpened = false;
  /* 菜单是 fixed 定位，位置只在弹出那一刻算一次。可手机上的「更多」常常是在输入法
     开着的时候点的：这一点正文失焦、输入法开始收起，底栏和按钮整个往下挪，
     菜单却钉在原来的位置不动——悬在半空中，离按钮几百像素。
     所以记住锚点，视口每次变化就按锚点重新贴一遍。 */
  let ctxAnchor = null;
  let ctxPoint = null;
  let ctxOpts = null;
  let ctxRaf = 0;

  function ctxViewport() {
    const vv = window.visualViewport;
    const w = vv ? Math.min(window.innerWidth, vv.width) : window.innerWidth;
    const h = vv ? Math.min(window.innerHeight, vv.height + vv.offsetTop) : window.innerHeight;
    return { w: w, h: h };
  }

  function placeCtx(x, y, opts) {
    const o = opts || ctxOpts || {};
    /* 菜单弹出带 .13s 的 scale(.96) 动画，getBoundingClientRect() 会把缩放后的
       宽度算进去（178.6 而非 186），弹出瞬间位置偏右，等 120ms 兜底重贴时又
       跳回正确位置——看着就是「横跳一下」。offsetWidth/Height 是布局尺寸，
       不受 transform 影响，每拍算出来的位置都一样。 */
    const cw = ctx.offsetWidth;
    const ch = ctx.offsetHeight;
    let ax = typeof x === 'number' ? x : (ctxPoint ? ctxPoint.x : 0);
    let ay = typeof y === 'number' ? y : (ctxPoint ? ctxPoint.y : 0);
    /* 有锚点就用锚点的实时位置：视口一变（输入法收起、旋转、分屏）按钮就挪了，
       菜单跟着走才不会悬空。锚点不在了/被隐藏（rect 全 0）才退回调用方给的点。 */
    if (ctxAnchor && ctxAnchor.isConnected) {
      const r = ctxAnchor.getBoundingClientRect();
      if (r.width || r.height) {
        ax = r.right - cw;
        ay = o.above ? r.top - 8 : r.bottom + 4;
      }
    }
    const vp = ctxViewport();
    const px = Math.max(8, Math.min(ax, vp.w - cw - 8));
    /* above：ay 当作「菜单底边」看待，让菜单整个落在锚点上方（底栏/工具条那颗「更多」） */
    const top = o.above ? ay - ch : ay;
    const py = Math.max(8, Math.min(top, vp.h - ch - 8));
    ctx.style.left = px + 'px';
    ctx.style.top = py + 'px';
  }

  function ctxFollowSoon() {
    if (ctxRaf) return;
    ctxRaf = requestAnimationFrame(() => {
      ctxRaf = 0;
      if (!ctx.classList.contains('hidden')) placeCtx();
    });
  }
  function ctxFollowOff() {
    window.removeEventListener('resize', ctxFollowSoon);
    window.removeEventListener('orientationchange', ctxFollowSoon);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', ctxFollowSoon);
      window.visualViewport.removeEventListener('scroll', ctxFollowSoon);
    }
    if (ctxRaf) { cancelAnimationFrame(ctxRaf); ctxRaf = 0; }
  }
  function ctxFollowOn() {
    ctxFollowOff();
    window.addEventListener('resize', ctxFollowSoon);
    window.addEventListener('orientationchange', ctxFollowSoon);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', ctxFollowSoon);
      window.visualViewport.addEventListener('scroll', ctxFollowSoon);
    }
  }

  function showCtx(x, y, items, opts) {
    ctx.innerHTML = '';
    items.forEach((it) => {
      if (it.sep) {
        ctx.appendChild(Object.assign(document.createElement('div'), { className: 'ctx-sep' }));
        return;
      }
      const el = document.createElement('div');
      el.className = 'ctx-item' + (it.danger ? ' danger' : '');
      el.innerHTML = (it.icon || '') + `<span>${escapeHtml(it.label)}</span>`;
      el.addEventListener('click', () => { hideCtx(); it.onClick(); });
      ctx.appendChild(el);
    });
    ctx.classList.remove('hidden');
    ctxOpts = opts || null;
    ctxAnchor = (opts && opts.anchor) || null;
    ctxPoint = { x: x, y: y };
    placeCtx(x, y, opts);
    ctxFollowOn();
    /* 输入法收起偶尔是「一步到位」而且不派发 resize，补几拍兜底重贴 */
    [120, 320, 700].forEach((ms) => {
      setTimeout(() => { if (!ctx.classList.contains('hidden')) placeCtx(); }, ms);
    });
    ctxJustOpened = true;
    setTimeout(() => { ctxJustOpened = false; }, 0);
  }
  function hideCtx() {
    ctx.classList.add('hidden');
    ctxJustOpened = false;
    ctxAnchor = null;
    ctxPoint = null;
    ctxOpts = null;
    ctxFollowOff();
  }

  /* ---------------------------------------------------------- 笔记卡片操作菜单
     手机上没有 hover 也没有右键，编辑器那排按钮又会被横向裁掉，
     「删除」因此很难找到。这里统一提供入口：卡片右上角 ⋯、长按、电脑右键。 */
  async function starNote(note) {
    try {
      const updated = await api(`/api/notes/${note.id}`, { method: 'PATCH', body: { starred: !note.starred } });
      Object.assign(note, updated);
    } catch (e) { return toast(e.message); }
    renderTree();
    renderList();
    if (state.selNote === note.id) $('#starBtn').classList.toggle('on', !!note.starred);
    toast(note.starred ? '已加入收藏' : '已取消收藏');
  }

  function renameNote(note) {
    if (state.selNote === note.id) saveNow();
    openPrompt({
      title: '重命名笔记',
      value: note.title || '',
      placeholder: '输入笔记标题',
      confirmText: '保存',
      onConfirm: async (v) => {
        const updated = await api(`/api/notes/${note.id}`, { method: 'PATCH', body: { title: v } });
        Object.assign(note, updated);
        renderList();
        if (state.selNote === note.id) {
          $('#titleInput').value = note.title;
          syncBarTitle();
        }
        toast('已重命名');
      },
    });
  }

  function noteMenu(x, y, note) {
    showCtx(x, y, [
      { label: '打开', icon: I.doc, onClick: () => { openNote(note.id); closeDrawer(); } },
      { label: note.starred ? '取消收藏' : '加入收藏', icon: I.star, onClick: () => starNote(note) },
      { label: '重命名', icon: I.pencil, onClick: () => renameNote(note) },
      { sep: true },
      { label: '删除笔记', icon: I.trash, danger: true, onClick: () => deleteNote(note) },
    ]);
  }

  /* 触屏长按（460ms）唤起同一个菜单；鼠标不参与，用右键 */
  const LP_MS = 460;
  let lpTimer = 0;
  let lpPoint = null;
  let lpSuppress = false;
  function cancelLongPress() {
    clearTimeout(lpTimer);
    lpTimer = 0;
    lpPoint = null;
  }

  document.addEventListener('click', (e) => {
    if (ctxJustOpened) return;
    if (!ctx.contains(e.target)) hideCtx();
  });
  document.addEventListener('contextmenu', (e) => {
    const card = e.target.closest('.note-card');
    if (card) {
      const note = noteById(card.dataset.id);
      if (note) {
        e.preventDefault();
        return noteMenu(e.clientX, e.clientY, note);
      }
    }
    const tnote = e.target.closest('.tree-note');
    if (tnote) {
      const note = noteById(tnote.dataset.nid);
      if (note) {
        e.preventDefault();
        return noteMenu(e.clientX, e.clientY, note);
      }
    }
    const row = e.target.closest('.tree-row[data-id]');
    if (!row) return;
    e.preventDefault();
    const cat = state.categories.find((c) => c.id === row.dataset.id);
    if (!cat) return;
    showCtx(e.clientX, e.clientY, [
      { label: '新建子类别', icon: I.plus, onClick: () => askCreateCategory(cat.id) },
      { label: '在此新建笔记', icon: I.doc, onClick: () => createNote(cat.id) },
      { sep: true },
      { label: '重命名', icon: I.pencil, onClick: () => renameCategory(cat) },
      { label: '删除类别', icon: I.trash, danger: true, onClick: () => deleteCategory(cat) },
    ]);
  });

  /* ---------------------------------------------------------- 事件绑定 */
  $('#tree').addEventListener('click', (e) => {
    const note = e.target.closest('.tree-note');
    if (note) {
      if (lpSuppress) { lpSuppress = false; e.preventDefault(); e.stopPropagation(); return; }
      e.preventDefault();
      /* 多选态下点行 = 勾选，不打开笔记（与列表卡片的多选行为一致） */
      if (batchMode) { toggleBatch(note.dataset.nid); return; }
      saveNow();
      openNote(note.dataset.nid);
      if (NARROW()) closeDrawer();
      return;
    }
    const row = e.target.closest('.tree-row');
    if (!row) return;
    const act = e.target.closest('[data-act]');
    if (act) {
      e.stopPropagation();
      const id = row.dataset.id;
      const cat = id ? state.categories.find((c) => c.id === id) : null;
      if (act.dataset.act === 'toggle') {
        if (id) { toggleCat(id); return; }
        if (row.dataset.pseudo) { togglePseudo(row.dataset.pseudo); renderTree(); renderList(); return; }
      }
      if (!cat) return;
      if (act.dataset.act === 'add') return askCreateCategory(id);
      if (act.dataset.act === 'more') {
        const r = act.getBoundingClientRect();
        return showCtx(r.left, r.bottom + 4, [
          { label: '重命名', icon: I.pencil, onClick: () => renameCategory(cat) },
          { label: '新建子类别', icon: I.plus, onClick: () => askCreateCategory(cat.id) },
          { sep: true },
          { label: '删除类别', icon: I.trash, danger: true, onClick: () => deleteCategory(cat) },
        ]);
      }
      return;
    }
    if (row.dataset.pseudo) {
      const k = row.dataset.pseudo;
      setOpen(k, true);
      accordion(k);
      state.selCat = k;
      state.search = '';
      $('#searchInput').value = '';
      renderTree();
      renderList();
      afterPickCategory();
      return;
    }
    if (row.dataset.id) {
      const id = row.dataset.id;
      const cat = state.categories.find((c) => c.id === id);
      /* 单击分类：只展开这一层——露出它的子分类与本级笔记，子分类不自动展开 */
      if (cat) openOnly(id, true);
      state.selCat = id;
      renderTree();
      renderList();
      afterPickCategory();
    }
  });

  $('#tree').addEventListener('dragover', (e) => {
    const row = e.target.closest('.tree-row[data-id]');
    if (!row) return;
    e.preventDefault();
    row.classList.add('dragover');
  });
  $('#tree').addEventListener('dragleave', (e) => {
    const row = e.target.closest('.tree-row[data-id]');
    if (row) row.classList.remove('dragover');
  });
  $('#tree').addEventListener('drop', async (e) => {
    const row = e.target.closest('.tree-row[data-id]');
    if (!row) return;
    e.preventDefault();
    row.classList.remove('dragover');
    const noteId = e.dataTransfer.getData('text/note-id');
    if (!noteId) return;
    const note = noteById(noteId);
    if (!note || note.categoryId === row.dataset.id) return;
    note.categoryId = row.dataset.id;
    note.updatedAt = Date.now();
    renderTree();
    renderList();
    markDirty();
    toast('已移动到该类别');
  });

  /* 笔记行（嵌套在分类下）作为拖拽源：拖到分类行即移动。 */
  $('#tree').addEventListener('dragstart', (e) => {
    const tnote = e.target.closest('.tree-note');
    if (!tnote) return;
    e.dataTransfer.setData('text/note-id', tnote.dataset.nid);
    e.dataTransfer.effectAllowed = 'move';
  });

  /* 手机端点笔记行长按唤起菜单（与 #noteList 行为一致） */
  $('#tree').addEventListener('pointerdown', (e) => {
    const tnote = e.target.closest('.tree-note');
    if (!tnote || e.target.closest('[data-act]')) return;
    if (e.pointerType === 'mouse') return;
    lpSuppress = false;
    cancelLongPress();
    lpPoint = { x: e.clientX, y: e.clientY };
    lpTimer = setTimeout(() => {
      lpTimer = 0;
      const note = noteById(tnote.dataset.nid);
      if (!note) return;
      lpSuppress = true;
      tnote.classList.add('pressed');
      setTimeout(() => tnote.classList.remove('pressed'), 200);
      try { if (navigator.vibrate) navigator.vibrate(10); } catch (_) {}
      noteMenu(lpPoint.x - 76, lpPoint.y - 16, note);
    }, LP_MS);
  });
  $('#tree').addEventListener('pointermove', (e) => {
    if (!lpTimer || !lpPoint) return;
    if (Math.abs(e.clientX - lpPoint.x) > 12 || Math.abs(e.clientY - lpPoint.y) > 12) cancelLongPress();
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => {
    $('#tree').addEventListener(ev, cancelLongPress);
  });

  $('#noteList').addEventListener('click', (e) => {
    const card = e.target.closest('.note-card');
    if (!card) return;
    /* -72 多选模式：点卡片只切换勾选，不打开笔记、不弹菜单。 */
    if (batchMode && !e.target.closest('[data-more]')) {
      e.preventDefault();
      toggleBatch(card.dataset.id);
      return;
    }
    const note = noteById(card.dataset.id);
    if (!note) return;

    const more = e.target.closest('[data-more]');
    if (more) {
      e.preventDefault();
      e.stopPropagation();
      const r = more.getBoundingClientRect();
      return noteMenu(r.right - 152, r.bottom + 6, note);
    }
    /* 长按已经弹过菜单，这次抬手不要再打开笔记（同时阻止外层关闭菜单） */
    if (lpSuppress) {
      lpSuppress = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    saveNow();
    openNote(card.dataset.id);
    closeDrawer();
  });

  /* 长按唤起笔记菜单 */
  $('#noteList').addEventListener('pointerdown', (e) => {
    if (batchMode) return;
    const card = e.target.closest('.note-card');
    if (!card || e.target.closest('[data-more]')) return;
    if (e.pointerType === 'mouse') return;
    lpSuppress = false;
    cancelLongPress();
    lpPoint = { x: e.clientX, y: e.clientY };
    lpTimer = setTimeout(() => {
      lpTimer = 0;
      const note = noteById(card.dataset.id);
      if (!note) return;
      lpSuppress = true;
      card.classList.add('pressed');
      setTimeout(() => card.classList.remove('pressed'), 200);
      try { if (navigator.vibrate) navigator.vibrate(10); } catch (_) {}
      noteMenu(lpPoint.x - 76, lpPoint.y - 16, note);
    }, LP_MS);
  });
  $('#noteList').addEventListener('pointermove', (e) => {
    if (!lpTimer || !lpPoint) return;
    if (Math.abs(e.clientX - lpPoint.x) > 12 || Math.abs(e.clientY - lpPoint.y) > 12) cancelLongPress();
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => {
    $('#noteList').addEventListener(ev, cancelLongPress);
  });

  $('#noteList').addEventListener('dragstart', (e) => {
    if (batchMode) { e.preventDefault(); return; }
    const card = e.target.closest('.note-card');
    if (!card) return;
    e.dataTransfer.setData('text/note-id', card.dataset.id);
    e.dataTransfer.effectAllowed = 'move';
  });

  $('#searchInput').addEventListener('input', (e) => {
    state.search = e.target.value;
    renderTree();
    renderList();
    /* 手机端搜索框在左侧抽屉里，输入后列表已更新但被抽屉挡住看不见。
       这里自动切到列表抽屉，让用户直接看到搜索结果。 */
    if (NARROW()) openDrawer('list');
  });

  /* ---------------------------------------------------------- 手机端抽屉 */
  const NARROW = () => window.matchMedia('(max-width: 980px)').matches;

  let drawerOpenedAt = 0;
  let lastDrawerTap = { kind: '', at: -1 };
  function openDrawer(kind) {
    /* 华为风首页：列表已是全屏主视图，再开 m-list 抽屉只会让遮罩盖黑整屏。
       首页态下所有 list 抽屉请求一律忽略；tree 抽屉照常（目录/工具还在里面）。 */
    if (kind === 'list' && !document.body.classList.contains('sj-note-open')) {
      closeDrawer();
      return;
    }
    document.body.classList.remove('m-tree', 'm-list');
    document.body.classList.add(kind === 'tree' ? 'm-tree' : 'm-list');
    drawerOpenedAt = Date.now();
  }
  function closeDrawer() {
    document.body.classList.remove('m-tree', 'm-list');
  }
  /* 部分安卓浏览器（含华为自带浏览器）会把一次轻触派发成两次 click。
     原来按钮是 toggle 写法，第二次 click 会把刚打开的抽屉立刻收回去，
     用户看到的就是「列表闪一下又回到笔记」。同一个按钮 500ms 内的
     重复 click 一律忽略；切不同按钮（目录→列表）不受影响。 */
  function toggleDrawer(kind, e) {
    const now = (e && e.timeStamp) || Date.now();
    if (lastDrawerTap.kind === kind && now - lastDrawerTap.at < 500) return;
    lastDrawerTap = { kind, at: now };
    void saveNow();
    const cls = kind === 'tree' ? 'm-tree' : 'm-list';
    if (document.body.classList.contains(cls)) closeDrawer();
    else openDrawer(kind);
  }
  /** 手机端点完分类/标签直接进列表，少点一次 */
  function afterPickCategory() {
    if (!NARROW()) return;
    /* 华为风：在详情页从目录选了分类，就回列表首页看结果，而不是在正文上盖个抽屉 */
    if (document.body.classList.contains('sj-note-open')) {
      closeEditor();
      closeDrawer();
      return;
    }
    openDrawer('list');
  }
  /** 顶栏固定展示品牌区（朱砂方块 + 书法体拾笺 + 朱点），与电脑版一致。
      原本这里写的是「当前笔记名 / 列表名」，改成品牌后不再覆盖可见文字；
      位置信息仍由列表页头部 #listTitle 与编辑器标题框呈现，
      这里只把它写进 aria-label 供读屏使用，避免导航信息彻底丢失。 */
  function syncBarTitle() {
    const el = $('#mBarTitle');
    if (!el) return;
    const note = currentNote();
    el.textContent = note ? (note.title || '无标题笔记') : ($('#listTitle').textContent || '拾笺');
  }

  /* 返回菜单 / 打开列表 = 离开编辑页，脏数据在这里落盘。 */
  $('#mTreeBtn').addEventListener('click', (e) => toggleDrawer('tree', e));
  /* 「笔记列表」是打开笔记后的返回出口：手机端三栏收成抽屉，
     没有这个按钮用户会被困在编辑页，只能靠目录里的分类绕回去。
     华为风首页下，详情页点它直接回列表首页；宽屏仍走抽屉 toggle。 */
  $('#mListBtn').addEventListener('click', (e) => {
    if (NARROW() && document.body.classList.contains('sj-note-open')) {
      closeEditor();
      return;
    }
    toggleDrawer('list', e);
  });
  $('#mNewBtn').addEventListener('click', () => createNote());
  /* 「随手记」入口：华为 / EMUI 自带浏览器不读 manifest 的 shortcuts，
     长按桌面图标没有快捷菜单，所以入口必须做在 App 里。
     用同标签跳转（不 window.open）：速记随 q 参数带过来，不依赖两套
     PWA 是否共享 localStorage，独立安装也能导入。 */
  function quickUrl(from) {
    let sc = '';
    try {
      sc = new URLSearchParams(location.search).get('sharecode')
        || localStorage.getItem('sj_sharecode') || '';
    } catch (_) {}
    const u = new URL('/quick.html', location.origin);
    u.searchParams.set('sharecode', sc || 'X4WPKTHLIN');
    u.searchParams.set('from', from || 'app');
    return u.toString();
  }
  function openQuick() {
    void saveNow();                    // 离开编辑页前把脏数据落盘
    /* 2026-11-20：华为桌面把两个图标当成同一任务，window.open 不生效，
       必须同窗口跳转。速记随 q 参数带过去，不依赖共享 localStorage。 */
    location.href = quickUrl('app');
  }
  /* 2026-11-20：移除原来的 armQuickReturn()「切回前台自动弹回随手记」逻辑。
     Chrome 同时安装「拾笺」和「随手记」两个 PWA 时，那段逻辑会把刚从随手记
     跳进主程序的窗口一直记着，用户再打开「拾笺」应用（或把窗口切回前台）
     就被 location.replace 弹回随手记页面。速记数据本来就随 q 参数导入，
     不需要靠跳转 hack；回随手记请用主程序里的「随手记」按钮。 */
  ['#mQuickBtn', '#quickNoteBtn'].forEach((sel) => {
    const b = $(sel); if (b) b.addEventListener('click', openQuick);
  });
  $('#mMask').addEventListener('click', () => {
    /* 抽屉刚打开的一瞬间不响应遮罩点击，避免同一次轻触的「幽灵 click」
       穿透到遮罩把列表关掉。400ms 之后照常点遮罩关闭。 */
    if (Date.now() - drawerOpenedAt < 400) return;
    closeDrawer();
  });

  /* 同步按钮：本地优先，只有手动点才登录并上传 / 拉取 */
  $('#mSyncBtn').addEventListener('click', () => { if (window.SJSync) window.SJSync.open(); });
  const sb = $('#syncBtn'); if (sb) sb.addEventListener('click', () => { if (window.SJSync) window.SJSync.open(); });
  /* 编辑器里只有「分类名」本身可点，打开「移动到分类」。
     整行绑 click 会让鼠标移到「创建于…」上也高亮、点日期也弹分类框（用户反馈）。 */
  $('#metaInfo').addEventListener('click', (e) => {
    if (!e.target.closest || !e.target.closest('[data-meta-cat]')) return;
    const n = currentNote();
    if (n) openCategoryPicker(n);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });
  let wasNarrow = NARROW();
  window.addEventListener('resize', () => {
    const now = NARROW();
    if (!now) closeDrawer();
    if (now !== wasNarrow) {
      wasNarrow = now;
      if (window.SJRemount) window.SJRemount();
      const note = currentNote();
      if (note) { applyFormat(); renderToolbar(); }
    }
  });

  $('#newNoteBtn').addEventListener('click', () => createNote());

  /* 最近笔记：标题行折叠开关 + 条目点击（事件委托，重绘后不必重绑） */
  if ($('#recentHead')) {
    $('#recentHead').addEventListener('click', toggleRecent);
    $('#recentHead').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleRecent(); }
    });
  }
  if ($('#recentList')) {
    $('#recentList').addEventListener('click', (e) => {
      const it = e.target.closest('.recent-item');
      if (!it) return;
      saveNow();
      openNote(it.dataset.nid);
      if (NARROW()) closeDrawer();
    });
  }

  /* 首页卡片网格：视图切换、卡片点击（笔记→打开，文件夹→进去）、两个新建按钮 */
  if ($('#homeTabNotes')) $('#homeTabNotes').addEventListener('click', () => { homeTab = 'notes'; renderHome(); });
  if ($('#homeTabFolders')) $('#homeTabFolders').addEventListener('click', () => { homeTab = 'folders'; renderHome(); });
  if ($('#homeGrid')) {
    $('#homeGrid').addEventListener('click', (e) => {
      const card = e.target.closest('.home-card');
      if (!card) return;
      if (card.dataset.cid) {
        const id = card.dataset.cid;
        state.selCat = id;
        state.search = '';
        const si = $('#searchInput'); if (si) si.value = '';
        openOnly(id, true);
        renderTree(); renderList(); afterPickCategory();
        return;
      }
      /* 多选态下点卡片 = 勾选，和树里的行为保持一致 */
      if (card.dataset.nid) {
        if (batchMode) { toggleBatch(card.dataset.nid); return; }
        saveNow(); openNote(card.dataset.nid);
      }
    });
  }
  if ($('#homeNewNote')) $('#homeNewNote').addEventListener('click', () => createNote());
  if ($('#homeNewFolder')) $('#homeNewFolder').addEventListener('click', () => askCreateCategory(null));
  if ($('#editorBack')) $('#editorBack').addEventListener('click', () => closeEditor());
  $('#newNoteBtn2').addEventListener('click', () => createNote());
  $('#addRootCatBtn').addEventListener('click', () => askCreateCategory(null));
  $('#collapseAllBtn').addEventListener('click', async () => {
    const anyOpen = state.categories.some((c) => c.expanded);
    state.categories.forEach((c) => (c.expanded = !anyOpen));
    renderTree();
    await Promise.all(state.categories.map((c) =>
      api(`/api/categories/${c.id}`, { method: 'PATCH', body: { expanded: c.expanded } }).catch(() => {})
    ));
    toast(anyOpen ? '已全部收起' : '已全部展开');
  });

  $('#titleInput').addEventListener('input', (e) => {
    const note = currentNote();
    if (!note) return;
    note.title = e.target.value;
    note.updatedAt = Date.now();
    markDirty();
    renderList();
  });

  $('#titleInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      $('#richPane').focus();
    }
  });

  $('#richPane').addEventListener('input', onRichInput);

  $('#starBtn').addEventListener('click', () => {
    const note = currentNote();
    if (!note) return;
    note.starred = !note.starred;
    $('#starBtn').classList.toggle('on', note.starred);
    markDirty();
    renderTree();
    renderList();
    toast(note.starred ? '已加入收藏' : '已取消收藏');
  });

  $('#deleteNoteBtn').addEventListener('click', () => {
    const note = currentNote();
    if (note) deleteNote(note);
  });

  $('#historyBtn').addEventListener('click', openHistory);
  $('#exportBtn2').addEventListener('click', (e) => {
    e.stopPropagation();
    openExportMenu(e.currentTarget);
  });

  $('#tagAddBtn').addEventListener('click', showTagInput);
  $('#tagInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commitTag(); }
    else if (e.key === 'Escape') { e.preventDefault(); closeTagInput(); }
  });
  $('#tagInput').addEventListener('blur', () => {
    if (!$('#tagInput').classList.contains('hidden')) commitTag();
  });

  /* 插入图片：手机端先弹本应用的「拍照 / 从相册选择 / 取消」。
     以前点图片按钮直接跳系统选择器，那个页面只有「完成」、没有取消或返回，
     选不到图就出不来（用户 2026-11-21 反馈）。桌面端的文件框自带取消，照旧直开。 */
  const IMG_SHEET = $('#sjImgSheet'), IMG_MASK = $('#sjImgMask');
  function closeImgSheet() {
    if (IMG_SHEET) IMG_SHEET.classList.add('hidden');
    if (IMG_MASK) IMG_MASK.classList.add('hidden');
    document.body.classList.remove('sj-pick-open');
  }
  function openImgSheet() {
    if (!IMG_SHEET) return;
    hideSoftKeyboard();
    if (IMG_MASK) IMG_MASK.classList.remove('hidden');
    IMG_SHEET.classList.remove('hidden');
    /* 首次访问的绿色提示条（z-index 9000）会正好压住「从相册选择」，先让它让位 */
    document.body.classList.add('sj-pick-open');
  }
  function pickImage(mode) {
    closeImgSheet();
    const fi = $('#fileInput');
    if (!fi) return;
    fi.accept = 'image/*';
    if (mode === 'camera') fi.setAttribute('capture', 'environment');
    else fi.removeAttribute('capture');
    fi.dataset.insert = '1';
    /* 必须在这一下点击的手势里同步触发，晚一拍会被内核当成「非用户操作」拦掉 */
    fi.click();
  }
  if (IMG_SHEET) IMG_SHEET.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    e.preventDefault();
    const a = b.dataset.act;
    if (a === 'pk-close') closeImgSheet();
    else if (a === 'pk-camera') pickImage('camera');
    else if (a === 'pk-gallery') pickImage('gallery');
  });
  if (IMG_MASK) IMG_MASK.addEventListener('click', closeImgSheet);
  /* Esc 也能退（桌面端顺手） */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !IMG_SHEET || IMG_SHEET.classList.contains('hidden')) return;
    e.preventDefault();
    closeImgSheet();
  });
  $('#imgBtn').addEventListener('click', (e) => {
    if (!currentNote()) { toast('请先新建或选择一篇笔记'); return; }
    if (NARROW() && IMG_SHEET) { e.preventDefault(); openImgSheet(); return; }
    pickImage('gallery');
  });
  /* 点正文里的图片 → 弹尺寸工具条 */
  bindImgResize($('#richPane'), 'rich');
  bindImgResize($('#richPane'), 'rich');
  $('#attachBtn').addEventListener('click', () => {
    const note = currentNote();
    if (!note) return;
    if (note.attachments && note.attachments.length) {
      $('#attachPanel').classList.toggle('hidden');
    } else {
      const fi = $('#fileInput');
      fi.accept = '';
      fi.dataset.insert = '';
      fi.click();
    }
  });
  $('#closeAttachBtn').addEventListener('click', () => $('#attachPanel').classList.add('hidden'));

  $('#attachAddBtn').addEventListener('click', () => {
    const fi = $('#fileInput');
    fi.accept = '';
    fi.dataset.insert = '';
    fi.click();
  });
  $('#fileInput').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    const doInsert = e.target.dataset.insert === '1';
    e.target.value = '';
    e.target.dataset.insert = '';
    e.target.accept = '';
    e.target.removeAttribute('capture');
    if (files.length) await uploadFiles(files, { insert: doInsert });
  });

  /* 拖放上传 */
  const body = $('#editorBody');
  let dragDepth = 0;
  body.addEventListener('dragenter', (e) => {
    if (!currentNote()) return;
    if (e.dataTransfer.types.includes('Files')) {
      dragDepth++;
      $('#dropMask').classList.add('show');
    }
  });
  body.addEventListener('dragover', (e) => {
    if (e.dataTransfer.types.includes('Files')) e.preventDefault();
  });
  body.addEventListener('dragleave', () => {
    dragDepth = Math.max(0, dragDepth - 1);
    if (!dragDepth) $('#dropMask').classList.remove('show');
  });
  body.addEventListener('drop', async (e) => {
    if (!e.dataTransfer.files.length) return;
    e.preventDefault();
    dragDepth = 0;
    $('#dropMask').classList.remove('show');
    await uploadFiles(Array.from(e.dataTransfer.files));
  });

  $('#exportBtn').addEventListener('click', async () => {
    toast('正在导出备份…');
    try {
      const data = await window.SJLocal.exportBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      const d = new Date();
      const p = (n) => String(n).padStart(2, '0');
      a.href = URL.createObjectURL(blob);
      a.download = `拾笺备份-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch (err) {
      toast('导出失败：' + err.message);
    }
  });

  $('#importBtn').addEventListener('click', () => $('#importInput').click());

  /* v1.8.0：解密并汇入 .vault 加密备份 */
  async function importVaultFile(file) {
    if (!window.SJE2EE) return toast('加密模块未就绪');
    openPrompt({
      title: '输入加密备份口令',
      placeholder: '导出时设置的口令',
      confirmText: '解密并汇入',
      onConfirm: async (v) => {
        if (!v) return toast('请输入口令');
        toast('正在解密…');
        try {
          const text = await file.text();
          const data = await window.SJE2EE.importVault(text, v);
          await api('/api/import', { method: 'POST', body: data });
          const s2 = await api('/api/state');
          state.categories = s2.categories;
          state.notes = s2.notes;
          state.selCat = 'all';
          state.selNote = null;
          closeEditor();
          renderTree();
          renderList();
          renderTags();
          toast('已从加密备份汇入 ' + data.notes.length + ' 篇笔记');
        } catch (err) {
          toast('解密/导入失败：' + err.message);
        }
      },
    });
  }

  $('#importInput').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 40 * 1024 * 1024) return toast('备份文件超过 40MB，无法导入');

    /* v1.8.0：.vault 是口令加密备份，先解密再汇入 */
    if (file.name.toLowerCase().endsWith('.vault')) return importVaultFile(file);

    openConfirm({
      title: '导入备份',
      message: `将把「${escapeHtml(file.name)}」里的类别与笔记合并进来。<br>`
        + `已存在的笔记会跳过，不会覆盖现有内容。备份里的附件无法随文件搬迁，导入后需要重新上传。`,
      confirmText: '开始导入',
      onConfirm: async () => {
        toast('正在导入…');
        try {
          let data;
          try { data = JSON.parse(await file.text()); } catch (_) { return toast('不是有效的 JSON 备份文件'); }
          const r = await api('/api/import', { method: 'POST', body: data });
          const s2 = await api('/api/state');
          state.categories = s2.categories;
          state.notes = s2.notes;
          state.selCat = 'all';
          state.selNote = null;
          closeEditor();
          renderTree();
          renderList();
          renderTags();
          let msg = `导入完成：新增 ${r.noteAdded} 条笔记、${r.catAdded} 个类别`;
          if (r.skipped) msg += `，${r.skipped} 条已存在跳过`;
          if (r.lostFiles) msg += `，${r.lostFiles} 个附件缺失已忽略`;
          toast(msg);
        } catch (err) {
          toast('导入失败：' + err.message);
        }
      },
    });
  });

  /* 富文本正文行距（显示偏好，存本机） */
  function applyRichLh() {
    document.documentElement.style.setProperty('--sj-rich-lh', String(state.richLh));
  }

  /* 主题 */
  function applyTheme(t) {
    state.theme = t;
    document.documentElement.dataset.theme = t;
    localStorage.setItem('sj_theme', t);
  }
  $('#themeBtn').addEventListener('click', () => applyTheme(state.theme === 'light' ? 'dark' : 'light'));

  /* 快捷键 */
  document.addEventListener('keydown', (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      $('#searchInput').focus();
      $('#searchInput').select();
      return;
    }
    if (mod && e.key.toLowerCase() === 's') {
      e.preventDefault();
      saveNow();
      return;
    }
    if (mod && e.key.toLowerCase() === 'n' && !e.shiftKey) {
      e.preventDefault();
      createNote();
      return;
    }
    if (mod && (e.key === 'b' || e.key === 'i')) {
      const note = currentNote();
      if (!note) return;
      e.preventDefault();
      exec(e.key === 'b' ? 'bold' : 'italic');
      return;
    }
    if (e.key === 'Escape') {
      hideCtx();
      if (!$('#modalRoot').classList.contains('hidden')) closeModal();
    }
  });

  /* 关页 / 切后台兜底：编辑期间没有定时写盘，这几个事件是最后的落盘机会。
     手机端 beforeunload 常不触发，pagehide 与 visibilitychange 必须都挂；
     不再弹原生确认框——内容已经自动存了，弹框只会挡住用户。 */
  const saveOnHide = () => { if (state.dirty) void saveNow(); };
  window.addEventListener('beforeunload', saveOnHide);
  window.addEventListener('pagehide', saveOnHide);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveOnHide();
    else scheduleRefresh();
  });

  $('#modalRoot').addEventListener('click', (e) => {
    if (e.target.id === 'modalRoot') closeModal();
  });

  /* ---------------------------------------------------------- 启动
     本地优先：脚本加载完直接启动，不需要登录；只有点「同步」时才走 mobilesync.js。 */
  /* 随手记（quick.html）不持有本地库：速记存在共享队列 sj_quick_pending，
     也允许随链接 q 带过来。只有在主程序这边真正落盘成功，才写
     sj_quick_imported 并把该条从队列移除 —— 点过「打开拾笺」但另一个
     窗口没收到时，速记还能再补发一次，不会因为提前标记已发送而丢掉。 */
  const Q_PENDING = 'sj_quick_pending';
  const Q_IMPORTED = 'sj_quick_imported';
  /* 桌面速记图标存在与否：quick.html 从桌面入口跳回主程序时在链接上带
     deskInstalled=1。被独立安装的速记窗口可能有一套隔离的 localStorage，
     只有链接参数一定送得到；收到后写进主程序自己的分区（cookie 再给同
     origin 的普通标签兜底），速记页据此不再重复显示安装引导。 */
  const Q_DESK = 'sj_quick_desk_installed';
  function rememberDeskInstalled() {
    try { localStorage.setItem(Q_DESK, '1'); } catch (_) {}
    try { document.cookie = Q_DESK + '=1; path=/; max-age=31536000; SameSite=Lax'; }
    catch (_) {}
  }
  let draining = false;
  async function drainQuick() {
    if (draining) return 0;
    draining = true;
    try {
      const u = new URL(location.href);
      const raw = u.searchParams.get('q');   // URLSearchParams 已解码过一次
      const deskSeen = u.searchParams.get('deskInstalled') === '1';
      if (raw || deskSeen) {
        try {
          u.searchParams.delete('q');
          u.searchParams.delete('deskInstalled');
          history.replaceState(null, '', u.toString());
        } catch (_) {}
      }
      if (deskSeen) rememberDeskInstalled();
      let urlItems = [];
      try { const v = JSON.parse(raw); if (Array.isArray(v)) urlItems = v; } catch (_) {}
      let queue = [];
      try {
        const v = JSON.parse(localStorage.getItem(Q_PENDING) || '[]');
        if (Array.isArray(v)) queue = v;
      } catch (_) {}
      const items = urlItems.concat(queue);
      if (!items.length) return 0;

      let existing = [];
      try { existing = (await api('/api/state')).notes || []; } catch (_) {}
      const have = new Set(existing.map((n) => (n.title || '') + '|' + (n.content || '')));
      let seen = [];
      try { seen = JSON.parse(localStorage.getItem(Q_IMPORTED) || '[]'); } catch (_) {}
      if (!Array.isArray(seen)) seen = [];

      const done = new Set();
      let added = 0, cut = 0;
      for (const it of items) {
        if (!it || typeof it.sig !== 'string') continue;
        /* 已导入过 / 内容无效的条目也要从队列清掉，否则会永远占位 */
        if (seen.includes(it.sig) || typeof it.content !== 'string' || !it.content.trim()) {
          done.add(it.sig); continue;
        }
        const title = it.title || '随手记';
        if (have.has(title + '|' + it.content)) { seen.push(it.sig); done.add(it.sig); continue; }
        try {
          await api('/api/notes', { method: 'POST', body: {
            /* 随手记是纯文本（quick.html 的用户输入），不是 Markdown。
               存储层只有富文本一种格式：内容按纯文本处理，
               由服务端的 mdconv 层转成 HTML 再落库。 */
            title, content: it.content, format: 'rich',
          } });
          seen.push(it.sig); done.add(it.sig); added++;
          if (it.cut) cut++;
        } catch (_) {}
      }
      if (seen.length) {
        try { localStorage.setItem(Q_IMPORTED, JSON.stringify(seen.slice(-300))); } catch (_) {}
      }
      /* 只清确实被消费的条目。两个窗口数据分区隔离时，本窗口读不到那个
         队列，速记页会一直留着，用户再点一次仍能补发；这边靠 seen 去重。 */
      if (done.size && queue.length) {
        const rest = queue.filter((x) => !x || !x.sig || !done.has(x.sig));
        if (rest.length !== queue.length) {
          try { localStorage.setItem(Q_PENDING, JSON.stringify(rest)); } catch (_) {}
        }
      }
      if (added) toast('已从随手记带入 ' + added + ' 条笔记，见「全部笔记」顶部'
        + (cut ? '（有长文被截断，长文请直接在主程序里写）' : ''));
      return added;
    } finally { draining = false; }
  }

  /* 另一个窗口写入本地库后，已经打开的主程序窗口不会自动重绘：boot 只在
     启动时读一次 /api/state，手机浏览器还常把后台的 PWA 窗口直接切回前台、
     根本不重新加载。所以 storage 事件 / 回到前台 / pageshow / focus 都重读
     一次；正在编辑时先落盘，绝不用外部数据盖掉用户刚敲的字。 */
  let refreshing = false;
  let booted = false;
  let refreshTimer = 0;
  const storeSig = (arr) => arr.map((n) => n.id + ':' + (n.updatedAt || 0)).join('|');
  async function refreshFromStore() {
    /* 页面刚加载时 focus / pageshow 也会触发，别和 boot() 抢着渲染 */
    if (refreshing || !booted) return;
    refreshing = true;
    try {
      if (state.dirty) { try { await saveNow(); } catch (_) {} }
      const added = await drainQuick();
      let data;
      try { data = await api('/api/state'); } catch (_) { return; }
      const cats = data.categories || [], list = data.notes || [];
      const oldSig = storeSig(state.notes) + '#' + storeSig(state.categories);
      const newSig = storeSig(list) + '#' + storeSig(cats);
      if (!added && oldSig === newSig) return;
      /* 随手记刚带进来一条时，用户可能正停在某个具体类别：新笔记默认未分类，
         会被筛选掉，看起来又像「没同步进来」。回到「全部笔记」让它置顶可见；
         只换左侧筛选，不动 selNote，正在编辑的那篇不受影响。 */
      if (added && state.selCat !== 'all') state.selCat = 'all';
      const prev = state.notes.find((n) => n.id === state.selNote);
      state.categories = cats;
      state.notes = list;
      renderTree();
      renderList();
      $('#statText').textContent = `${state.notes.length} 篇 · ${state.categories.length} 个类别`;
      const cur = state.notes.find((n) => n.id === state.selNote);
      if (cur && !state.dirty && prev && (prev.content !== cur.content || prev.title !== cur.title)) {
        openNote(cur.id);
      }
    } finally { refreshing = false; }
  }
  function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => { void refreshFromStore(); }, 120);
  }
  window.addEventListener('storage', (e) => {
    if (!e || (e.key !== 'sj_mobile_v1' && e.key !== Q_PENDING)) return;
    scheduleRefresh();
  });
  window.addEventListener('pageshow', scheduleRefresh);
  window.addEventListener('focus', scheduleRefresh);

  /** 冷启动回到上次所在的类别；类别/标签若已被删就退回「全部笔记」。
      只恢复类别，绝不恢复上次打开的那篇笔记。 */
  function restoreLastCat() {
    let v = '';
    try { v = localStorage.getItem(SJ_LAST_CAT) || ''; } catch (_) {}
    if (!v || v === 'all') return;
    let ok = v === 'starred' || v === 'uncat';
    if (!ok && String(v).startsWith('tag:')) {
      ok = state.notes.some((n) => (n.tags || []).includes(v.slice(4)));
    }
    if (!ok) ok = state.categories.some((c) => c.id === v);
    if (ok) state.selCat = v;
  }

  /* v-53 曾在这里试过「进入时把内部滚动容器下推 1px 以收起地址栏」，真机确认
     **无效**：华为浏览器的工具栏只跟随根滚动（root scroller），内部容器滚动不算数，
     脚本滚动更是被当作「非用户滚动」，内核直接忽略。地址栏归浏览器所有，网页没有
     任何 API 可以隐藏它（防钓鱼的平台边界）。想要进入即满屏，只能走 standalone
     容器（桌面图标 / 添加到主屏幕）——那条路由 manifest 的 display 决定，与本文件无关。
     这段代码已按「无效即删」移除，不再每次启动白跑一次。 */

  async function boot(keepId) {
    /* boot() 不只冷启动会调：同步拉取、解密、回收站恢复也会用它重渲染。
       只有冷启动改落点；会话内重载必须留在用户正在看的那篇。 */
    const cold = !booted;
    applyTheme(state.theme);
    applyRichLh();
    const quickAdded = await drainQuick();
    try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (_) {}
    /* 手机端附件二进制存在 IndexedDB，先把索引读进内存再渲染，
       否则首屏的图片拿不到地址、只会显示文件名。 */
    if (window.SJLocal && window.SJLocal.ready) {
      /* ready 可能永不 resolve（其他标签页 / 升级事务），最多等 1.5 秒，
         附件仓随后按需补读，界面必须先出来。 */
      try {
        await Promise.race([
          window.SJLocal.ready,
          new Promise((r) => setTimeout(r, 1500)),
        ]);
      } catch (_) {}
    }
    try {
      const data = await api('/api/state');
      state.categories = data.categories || [];
      state.notes = data.notes || [];
    } catch (e) {
      toast('加载数据失败：' + e.message);
    }

    /* 随手记带进来的新笔记默认未分类：若上次停在某个具体类别，用户会
       以为又没同步进来。有新速记时强制回到「全部笔记」，让它置顶可见。 */
    if (cold && !quickAdded) restoreLastCat();

    applyRecentState();
    $('#statText').textContent = `${state.notes.length} 篇 · ${state.categories.length} 个类别`;
    renderTree();
    renderList();

    /* 深链：?note=<id> 直接打开目标笔记。读完就删参数，避免刷新或后续
       会话内重载又把用户拽回这一篇。 */
    let deepId = '';
    if (cold) {
      try {
        const u = new URL(location.href);
        deepId = u.searchParams.get('note') || '';
        if (deepId) {
          u.searchParams.delete('note');
          history.replaceState(null, '', u.toString());
        }
      } catch (_) {}
    }

    /* 上次某篇笔记没打开完（渲染中断）会留下标记。列表开场本来就能进应用，
       这个守卫只负责提示一下，不再决定启动落点、也不再自动跳过笔记。 */
    let stuck = '';
    try {
      stuck = localStorage.getItem('sj_opening_note') || '';
      localStorage.removeItem('sj_opening_note');
    } catch (_) {}
    if (cold && stuck) {
      const bad = state.notes.find((n) => n.id === stuck);
      toast('上次编辑「' + ((bad && bad.title) || '一篇笔记') + '」未结束，已停在列表；若打不开可在列表里删除');
    }

    const want = keepId || state.selNote;
    if (deepId && state.notes.some((n) => n.id === deepId)) {
      openNote(deepId);
    } else if (want && state.notes.some((n) => n.id === want)) {
      /* 会话内重载（同步拉取 / 解密 / 回收站恢复），或 ?action=new 等快捷
         方式已经先建好笔记：保持当前这篇，不把用户踢回列表。 */
      openNote(want);
    } else if (cold) {
      /* 冷启动：列表开场。宽屏三栏里列表本就常驻，只需收起编辑器；
         窄屏把列表抽屉滑出来，点一条即进入编辑。保存时机一律不动。 */
      closeEditor();
      if (NARROW()) openDrawer('list');
      else closeDrawer();
    } else {
      closeEditor();
    }
    if (window.SJLocal) window.SJLocal.watchFiles();
    booted = true;
  }

  /* ============================================================
     华为备忘录风手机首页（仅窄屏；桌面端这些节点全隐藏，逻辑仍安全）
     - 用 body.sj-note-open 区分「列表首页 / 笔记详情」，不新增第二套 state；
       打开笔记 = 加 class，closeEditor = 去 class，与保存钩子完全解耦。
     - 首页右下悬浮 + 单击弹「新建笔记 / 随手记」；分类面板 / 详情底栏都复用已有函数，
       不造数据链路。底部双 tab 已移除（2026-11-21 合并进加号）。
     ============================================================ */
  (function mobileHomeUI() {
    /* 存在性 guard 用加号按钮：底部 tab 已删，用它会在新页面上直接 return，
       导致分类面板、详情页切换整块逻辑都不跑。 */
    const FAB = $('#sjFab'), DETAIL = $('#sjDetailBar');
    if (!FAB) return;                       // 老页面结构兜底
    const SHEET = $('#sjCatSheet'), TITLE = $('#sjCatTitle'), SEARCH = $('#sjHomeSearch');
    const MMENU = $('#sjManageMenu');
    let catMask = null;

    /* 首页 / 详情切换：只同步 UI class，不动 selNote / dirty / saveNow。 */
    function syncHome() {
      const inNote = !!currentNote();
      document.body.classList.toggle('sj-note-open', inNote);
      if (inNote) hideCatSheet();
      if (FAB) FAB.classList.toggle('hidden', inNote);
      if (DETAIL) DETAIL.classList.toggle('hidden', !inNote);
      const more = $('#sjMoreBtn');
      if (more) more.classList.toggle('hidden', false);
      hideFabMenu();
      /* 详情页再细分「阅读 / 编辑」两态：打开笔记默认阅读，点正文才编辑 */
      syncNoteMode();
    }
    window.SJSyncHome = syncHome;

    /* boot() 结尾与所有打开/关闭笔记的路径都会经过 renderList 或 openNote，
       在 renderList 里挂一次同步最省事：列表页、详情页、同步重载都覆盖。 */
    const origRenderList = window.__sjRenderListHook;
    void origRenderList;
    /* 用事件驱动更稳：openNote 成功、closeEditor、boot 后各调一次。 */
    /* 用事件驱动更稳：openNote 成功、closeEditor、boot 后各调一次。 */
    ['#mListBtn'].forEach((sel) => {
      const el = $(sel); if (el) el.addEventListener('click', () => setTimeout(syncHome, 0));
    });

    /* 右下角加号：径向菜单——两项从加号中心沿圆弧平滑散开，替代原底部双 tab。
       再点加号收起、点空白也收起；加号位置会随提示条/旋转变化，菜单实时贴中心。 */
    const FABMENU = $('#sjFabMenu');
    let fabOpen = false;
    let fabJustOpened = false;

    function placeFabMenu() {
      if (!FABMENU || !FAB) return;
      const r = FAB.getBoundingClientRect();
      FABMENU.style.left = (r.left + r.width / 2) + 'px';
      FABMENU.style.top = (r.top + r.height / 2) + 'px';
    }
    function openFabMenu() {
      if (!FAB || FAB.classList.contains('hidden') || fabOpen) return;
      placeFabMenu();
      fabOpen = true;
      document.body.classList.add('sj-fab-open');
      if (FAB) FAB.setAttribute('aria-expanded', 'true');
      if (FABMENU) FABMENU.setAttribute('aria-hidden', 'false');
      /* 打开时这一次 click 会冒泡到下面的「点空白收起」，挡掉它，否则刚开就关 */
      fabJustOpened = true;
      setTimeout(() => { fabJustOpened = false; }, 0);
    }
    function hideFabMenu() {
      if (!fabOpen) return;
      fabOpen = false;
      document.body.classList.remove('sj-fab-open');
      if (FAB) FAB.setAttribute('aria-expanded', 'false');
      if (FABMENU) FABMENU.setAttribute('aria-hidden', 'true');
    }
    function toggleFabMenu() { if (fabOpen) hideFabMenu(); else openFabMenu(); }
    if (FAB) FAB.addEventListener('click', toggleFabMenu);

    /* 点空白收起：同一次打开的 click 有守卫；点菜单项/加号本身不算空白 */
    document.addEventListener('click', (e) => {
      if (!fabOpen || fabJustOpened) return;
      if (FABMENU && FABMENU.contains(e.target)) return;
      if (FAB && FAB.contains(e.target)) return;
      hideFabMenu();
    });
    /* 加号位置会随首次安装提示条上移、旋转、分屏而变，菜单跟着重新贴中心 */
    ['resize', 'orientationchange'].forEach((t) => {
      window.addEventListener(t, () => { if (fabOpen) placeFabMenu(); });
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => { if (fabOpen) placeFabMenu(); });
    }

    /* 菜单项：新建笔记 / 随手记，执行动作后收起 */
    if (FABMENU) FABMENU.querySelectorAll('.sj-fab-item').forEach((el) => {
      el.addEventListener('click', () => {
        const act = el.dataset.act;
        hideFabMenu();
        if (act === 'new') createNote();
        else if (act === 'quick') { hideCatSheet(); openQuick(); }
      });
    });

    /* ---- 分类面板 ---- */
    function folderCount(id) {
      const ids = new Set([id]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const c of state.categories) {
          if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) { ids.add(c.id); changed = true; }
        }
      }
      return state.notes.filter((n) => ids.has(n.categoryId)).length;
    }
    function catRow(key, label, icon, count, indent) {
      return `<button type="button" class="sj-cat-row${String(state.selCat) === String(key) ? ' on' : ''}${indent ? ' sj-cat-indent' : ''}" data-cat="${escapeHtml(key)}" style="--dl:52px">`
        + `${icon}<span class="sj-cat-name">${escapeHtml(label)}</span><span class="sj-cat-n">${count}</span></button>`;
    }
    /* 华为风展开态的页头：必须和首页那一行**完全一致**（同一个名字、同一个条数、
       同样字号与位置），只把三角从 ▼ 换成 ▲。所以文字直接取首页标题节点的当前值，
       不在渲染期另算一套，避免两处口径不一致。 */
    function catHero() {
      const nameEl = $('#sjCatTitleText'), cntEl = $('#sjHomeCount');
      const name = (nameEl && nameEl.textContent.trim()) || '全部笔记';
      const count = (cntEl && cntEl.textContent.trim()) || (state.notes.length + ' 条笔记');
      return '<div class="sj-cat-hero">'
        + '<button type="button" class="sj-home-title" data-act="cat-close">'
        + `<span>${escapeHtml(name)}</span><span class="sj-caret">▲</span></button>`
        + `<div class="sj-home-count">${escapeHtml(count)}</div>`
        + '</div>';
    }
    const ICON_ALL = '<svg viewBox="0 0 24 24" class="ico"><path d="M4 5h16M4 12h16M4 19h16"/></svg>';
    const ICON_STAR = '<svg viewBox="0 0 24 24" class="ico"><path d="M12 3.6l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.8l5.9-.8z"/></svg>';
    const ICON_BOX = '<svg viewBox="0 0 24 24" class="ico"><path d="M4 7h16v13H4zM4 7l2-3h12l2 3M9 11h6"/></svg>';
    const ICON_FOLDER = '<svg viewBox="0 0 24 24" class="ico"><path d="M3 7h6l2 2h10v10H3z"/></svg>';
    const ICON_TRASH = '<svg viewBox="0 0 24 24" class="ico"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>';
    const ICON_GRIP = '<svg viewBox="0 0 24 24" class="ico"><path d="M4 8h16M4 16h16"/></svg>';
    /* 华为备忘录 8 色：红/橙/黄/绿/青/蓝/紫/靛。分类把 color 存成 0-7 索引；
       没存过 color 的老分类继续按同级顺序取色，界面不跳色。 */
    const CAT_PALETTE = [
      '#ea5455', '#f58b3c', '#f2c531', '#5cb85c',
      '#3fc1c9', '#4a90e2', '#9b6dd6', '#5b5fc7',
    ];
    function chipIndex(cat) {
      if (Number.isInteger(cat.color) && cat.color >= 0 && cat.color <= CAT_PALETTE.length - 1) return cat.color;
      const sibs = state.categories
        .filter((c) => (c.parentId || null) === (cat.parentId || null))
        .sort(byOrder);
      const i = sibs.findIndex((c) => c.id === cat.id);
      /* 未设色的老分类沿用截图里的黄/青/绿/红，映射到调色板 2/4/3/0。 */
      return [2, 4, 3, 0][Math.max(0, i) % 4];
    }
    function folderRow(cat, depth) {
      const isRoot = !cat.parentId;
      const kids = state.categories.filter((c) => c.parentId === cat.id);
      const active = String(state.selCat) === String(cat.id);
      const id = escapeHtml(cat.id);
      const lead = isRoot
        ? ICON_FOLDER
        : `<span class="sj-cat-chip c${chipIndex(cat)}"></span>`;
      const tail = isRoot && kids.length
        ? `<button type="button" class="sj-cat-toggle${sheetCollapsed.has(cat.id) ? ' closed' : ''}" data-act="cat-toggle" data-id="${id}" aria-label="展开或收起">⌄</button>`
        : `<span class="sj-cat-n">${folderCount(cat.id)}</span>`;
      /* 截图里子分类比根节点明显右移：根节点 12px，一级 44px，每深一层再 +20px。 */
      const pad = isRoot ? 12 : 24 + depth * 20;
      const dl = isRoot ? 52 : pad + 26;
      return `<div class="sj-cat-row sj-cat-folder${isRoot ? ' sj-cat-root' : ''}${active ? ' on' : ''}" data-cat="${id}" style="padding-left:${pad}px;--dl:${dl}px">`
        + `${lead}<span class="sj-cat-name">${escapeHtml(cat.name)}</span>${tail}</div>`;
    }
    function renderCatSheet() {
      if (!SHEET) return;
      const all = state.notes.length;
      const star = state.notes.filter((n) => n.starred).length;
      const uncat = state.notes.filter((n) => !n.categoryId).length;
      let html = catHero() + '<div class="sj-cat-card">'
        + catRow('all', '全部笔记', ICON_ALL, all, false)
        + catRow('uncat', '未分类', ICON_BOX, uncat, false)
        + catRow('starred', '我的收藏', ICON_STAR, star, false)
        + `<button type="button" class="sj-cat-row" data-act="trash">${ICON_TRASH}<span class="sj-cat-name">最近删除</span><span class="sj-cat-n"></span></button>`
        + '</div>'
        + '<div class="sj-cat-sep"><span>文件夹</span><button type="button" data-act="manage">管理</button></div>';
      const roots = state.categories.filter((c) => !c.parentId).sort(byOrder);
      if (!roots.length) html += '<div class="sj-cat-card sj-cat-empty">还没有文件夹</div>';
      /* 每个顶层文件夹单独一张卡：根行 + 缩进子分类 + 卡内「新建」，与截图一致。 */
      for (const root of roots) {
        html += '<div class="sj-cat-card sj-cat-folder-card">';
        html += folderRow(root, 0);
        if (!sheetCollapsed.has(root.id)) {
          const walk = (parentId, depth) => {
            for (const c of state.categories.filter((x) => (x.parentId || null) === parentId).sort(byOrder)) {
              html += folderRow(c, depth);
              if (!sheetCollapsed.has(c.id)) walk(c.id, depth + 1);
            }
          };
          walk(root.id, 1);
        }
        html += `<button type="button" class="sj-cat-new" data-act="sheet-add-sub" data-parent="${escapeHtml(root.id)}" style="--dl:52px">新建</button>`;
        html += '</div>';
      }
      SHEET.innerHTML = html;
    }
    function hideCatSheet() {
      if (SHEET) SHEET.classList.add('hidden');
      document.body.classList.remove('sj-cat-open');
      if (MMENU) MMENU.classList.add('hidden');
      if (catMask) { catMask.remove(); catMask = null; }
    }
    function showCatSheet() {
      if (!SHEET) return;
      renderCatSheet();
      document.body.classList.add('sj-cat-open');
      if (!catMask) {
        catMask = document.createElement('div');
        catMask.className = 'sj-cat-mask';
        document.body.appendChild(catMask);
        catMask.addEventListener('click', hideCatSheet);
      }
      SHEET.classList.remove('hidden');
    }

    /* ---- 分类管理页：分类面板「管理」进入的全屏编辑页 ----
       只做界面与手势，所有增删改都复用上面的 createCategory / renameCategory /
       deleteCategory；排序走后端已有的 PATCH order，不新建数据格式。 */
    const MGR = $('#sjCatMgr'), MGR_BODY = $('#sjCatMgrBody'), MGR_BACK = $('#sjCatMgrBack');
    const mgrCollapsed = new Set();
    const sheetCollapsed = new Set();
    let catDrag = null, catDragJustMoved = false;

    /* ---- 合并同名分类：按「同一父级 + 同名」分组，保留内容最多的一份 ----
       成因：手机端与桌面端各自建类、ID 不同，同步按 ID 去重，同名项被同时保留。
       合并前用 SJLocal.getState() 拍整库快照存 localStorage，提供一键撤销。
       落库用 SJLocal.setState() 一次性替换，避免逐个 PATCH 中途失败留半截数据。 */
    const MERGE_UNDO_KEY = 'sj_merge_undo_v1';

    function dupGroups(cats) {
      const map = new Map();
      (cats || []).forEach((c) => {
        const key = JSON.stringify([c.parentId || null, String(c.name || '').trim().toLocaleLowerCase()]);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(c);
      });
      return Array.from(map.values()).filter((g) => g.length > 1);
    }
    function mergeScore(cat, cats, notes) {
      const ids = new Set([cat.id]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const c of cats) {
          if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) { ids.add(c.id); changed = true; }
        }
      }
      const noteN = notes.filter((n) => ids.has(n.categoryId)).length;
      return noteN * 1000 + ids.size;
    }
    /* 计算一次合并的结果：返回新的 categories/notes 与统计。不直接落库。 */
    function buildMergeResult(snap) {
      const cats = (snap.categories || []).map((c) => ({ ...c }));
      const notes = (snap.notes || []).map((n) => ({ ...n }));
      const groups = dupGroups(cats);
      const stats = [];
      let mergedGroups = 0;
      let movedNotes = 0;
      /* 迭代：合并后可能让原本不同父级的同名项变成同级（子分类上移），再扫一轮。 */
      for (let pass = 0; pass < 20; pass += 1) {
        const gs = dupGroups(cats);
        if (!gs.length) break;
        for (const g of gs) {
          const keep = g.slice().sort((a, b) =>
            mergeScore(b, cats, notes) - mergeScore(a, cats, notes)
            || (a.createdAt || 0) - (b.createdAt || 0))[0];
          const dropIds = new Set(g.filter((c) => c.id !== keep.id).map((c) => c.id));
          if (!dropIds.size) continue;
          /* 被并分类的直属笔记迁到保留项；被并分类的子分类改挂到保留项。 */
          for (const n of notes) {
            if (dropIds.has(n.categoryId)) { n.categoryId = keep.id; n.updatedAt = Date.now(); movedNotes += 1; }
          }
          for (const c of cats) {
            if (dropIds.has(c.parentId)) c.parentId = keep.id;
          }
          const removed = cats.filter((c) => dropIds.has(c.id));
          for (let i = cats.length - 1; i >= 0; i -= 1) if (dropIds.has(cats[i].id)) cats.splice(i, 1);
          stats.push({ name: keep.name, keepId: keep.id, kept: 1, removed: removed.length });
          mergedGroups += 1;
        }
      }
      return { categories: cats, notes, versions: snap.versions || {}, stats, mergedGroups, movedNotes };
    }
    function previewMergeDups() {
      if (!window.SJLocal || !window.SJLocal.getState) { toast('本地存储未就绪'); return; }
      const snap = window.SJLocal.getState();
      const groups = dupGroups(snap.categories);
      if (!groups.length) { toast('没有发现同名分类'); return; }
      const rows = groups.map((g) => {
        const keep = g.slice().sort((a, b) =>
          mergeScore(b, snap.categories, snap.notes) - mergeScore(a, snap.categories, snap.notes)
          || (a.createdAt || 0) - (b.createdAt || 0))[0];
        const drop = g.filter((c) => c.id !== keep.id);
        const noteN = snap.notes.filter((n) => drop.some((d) => d.id === n.categoryId)).length;
        const childN = snap.categories.filter((c) => drop.some((d) => d.id === c.parentId)).length;
        return `<div class="sj-merge-row"><b>${escapeHtml(keep.name)}</b>`
          + `<span>合并 ${drop.length} 个同名 · 迁移 ${noteN} 篇笔记${childN ? '、' + childN + ' 个子分类' : ''}</span></div>`;
      }).join('');
      const m = openModal(`
        <h3>合并同名分类</h3>
        <p>发现 <b>${groups.length}</b> 组同名分类。每组会保留内容最多的一份，其余分类下的笔记与子分类自动迁入，不会删除笔记。</p>
        <div class="sj-merge-list">${rows}</div>
        <p class="sj-merge-tip">合并前会自动备份，随时可一键撤销。合并后请到「设置 → 同步」上传一次，云端才会同步更新。</p>
        <div class="modal-actions">
          <button class="btn ghost" data-act="cancel">取消</button>
          <button class="btn primary" id="sjMergeDupsGo">确认合并</button>
        </div>`);
      m.querySelector('[data-act="cancel"]').onclick = closeModal;
      m.querySelector('#sjMergeDupsGo').onclick = async () => {
        closeModal();
        await executeMergeDups();
      };
    }
    async function executeMergeDups() {
      try {
        if (window.SJSaveNow) window.SJSaveNow();
        const snap = window.SJLocal.getState();
        /* 合并前整库备份；写不下就中止，绝不无备份地动数据。 */
        try {
          localStorage.setItem(MERGE_UNDO_KEY, JSON.stringify({ at: Date.now(), snap }));
        } catch (e) {
          toast('备份失败，已取消合并：' + e.message);
          return;
        }
        const result = buildMergeResult(snap);
        if (!result.mergedGroups) { localStorage.removeItem(MERGE_UNDO_KEY); toast('没有可合并的分类'); return; }
        window.SJLocal.setState({ categories: result.categories, notes: result.notes, versions: result.versions });
        await (window.SJBoot ? window.SJBoot() : boot());
        renderCatSheet();
        if (MGR && !MGR.classList.contains('hidden')) renderCatManager();
        window.dispatchEvent(new Event('sj-categories-changed'));
        toast(`已合并 ${result.mergedGroups} 组，迁移 ${result.movedNotes} 篇笔记（可在页面底部撤销）`);
      } catch (e) {
        toast('合并失败：' + e.message);
      }
    }
    async function undoMergeDups() {
      try {
        const raw = localStorage.getItem(MERGE_UNDO_KEY);
        if (!raw) { toast('没有可撤销的合并'); return; }
        const backup = JSON.parse(raw);
        if (!backup || !backup.snap) { toast('备份数据无效'); return; }
        window.SJLocal.setState(backup.snap);
        await (window.SJBoot ? window.SJBoot() : boot());
        localStorage.removeItem(MERGE_UNDO_KEY);
        renderCatSheet();
        if (MGR && !MGR.classList.contains('hidden')) renderCatManager();
        window.dispatchEvent(new Event('sj-categories-changed'));
        toast('已撤销合并，恢复合并前的分类');
      } catch (e) {
        toast('撤销失败：' + e.message);
      }
    }

    function mgrChildren(parent) {
      return state.categories
        .filter((c) => (c.parentId || null) === parent)
        .sort(byOrder);
    }
    function mgrRow(cat, depth, isRoot) {
      const id = escapeHtml(cat.id);
      const parent = escapeHtml(cat.parentId || '');
      const pad = isRoot ? 4 : 28 + depth * 20;
      const lead = isRoot
        ? ICON_FOLDER
        : `<span class="sj-mgr-chip c${chipIndex(cat)}"></span>`;
      const grip = isRoot
        ? '<span class="sj-mgr-grip-space" aria-hidden="true"></span>'
        : `<button type="button" class="sj-mgr-grip" data-act="mgr-grip" data-id="${id}" aria-label="点击编辑类别，拖动排序">${ICON_GRIP}</button>`;
      /* 图一（华为备忘录）文件夹行没有折叠箭头，子分类一律平铺，故不再输出 caret。 */
      return `<div class="sj-mgr-row${isRoot ? ' sj-mgr-root' : ''}" data-cat-id="${id}" data-parent="${parent}" data-depth="${depth}" style="--row-pad:${pad}px; padding-left:${pad}px">`
        + `<span class="sj-mgr-main">${lead}<span class="sj-mgr-name">${escapeHtml(cat.name)}</span></span>`
        + grip + '</div>';
    }
    function renderCatManager() {
      if (!MGR_BODY) return;
      let html = '';
      const roots = mgrChildren(null);
      if (!roots.length) {
        html += '<div class="sj-mgr-card sj-mgr-empty">还没有文件夹，点下面的「新建文件夹」开始整理。</div>';
      }
      for (const root of roots) {
        html += `<div class="sj-mgr-card" data-root="${escapeHtml(root.id)}">`;
        html += mgrRow(root, 0, true);
        if (!mgrCollapsed.has(root.id)) {
          const walk = (parentId, depth) => {
            for (const c of mgrChildren(parentId)) {
              html += mgrRow(c, depth, false);
              if (!mgrCollapsed.has(c.id)) walk(c.id, depth + 1);
            }
          };
          walk(root.id, 1);
        }
        html += `<button type="button" class="sj-mgr-new" data-act="mgr-add-sub" data-parent="${escapeHtml(root.id)}">新建</button>`;
        html += '</div>';
      }
      html += '<div class="sj-mgr-card sj-mgr-new-card">'
        + '<button type="button" class="sj-mgr-new" data-act="mgr-add-root">新建文件夹</button></div>';
      /* 合并同名分类：重复分类的修复入口，仅在本地存储可用时显示。 */
      if (window.SJLocal && window.SJLocal.setState) {
        const dupN = dupGroups(state.categories).length;
        const canUndo = !!localStorage.getItem(MERGE_UNDO_KEY);
        html += '<div class="sj-mgr-card sj-mgr-fix-card">'
          + '<button type="button" class="sj-mgr-fix" data-act="mgr-merge-dups">'
          + '合并同名分类' + (dupN ? `<em>${dupN} 组</em>` : '') + '</button>'
          + (canUndo ? '<button type="button" class="sj-mgr-fix undo" data-act="mgr-undo-merge">撤销上次合并</button>' : '')
          + '</div>';
      }
      MGR_BODY.innerHTML = html;
    }
    function closeCatManager(backToSheet) {
      if (MGR) MGR.classList.add('hidden');
      document.body.classList.remove('sj-cat-mgr-open');
      if (backToSheet) showCatSheet(); else hideCatSheet();
    }
    function openCatManager() {
      if (!MGR) return;
      hideCatSheet();
      if (typeof hideMoreMenu === 'function') hideMoreMenu();
      mgrCollapsed.clear();
      renderCatManager();
      MGR.classList.remove('hidden');
      document.body.classList.add('sj-cat-mgr-open');
    }
    async function saveCatOrder(parent) {
      const key = parent || '';
      const rows = Array.from(MGR_BODY.querySelectorAll('.sj-mgr-row[data-cat-id]'))
        .filter((r) => (r.dataset.parent || '') === key);
      const jobs = [];
      rows.forEach((r, i) => {
        const cat = state.categories.find((c) => c.id === r.dataset.catId);
        if (!cat || cat.order === i) return;
        cat.order = i;
        jobs.push(api(`/api/categories/${cat.id}`, { method: 'PATCH', body: { order: i } }));
      });
      try {
        await Promise.all(jobs);
        renderTree();
        renderCatManager();
        renderCatSheet();
        toast('文件夹顺序已保存');
      } catch (e) {
        toast(e.message);
        renderCatManager();
      }
    }
    /* ---- 编辑笔记本底部弹窗：点子分类双横杠弹出，改色/改名/删除 ---- */
    const EDITOR = $('#sjCatEditor'), ED_NAME = $('#sjEditorName'),
      ED_SW = $('#sjEditorSwatches'), ED_CHIP = $('#sjEditorChip'),
      ED_SAVE = $('#sjEditorSave'), ED_DEL = $('#sjEditorDel');
    let edCat = null, edColor = 2;

    function closeCatEditor() {
      if (EDITOR) EDITOR.classList.add('hidden');
      edCat = null;
    }
    function paintEditorSwatches() {
      if (!ED_SW) return;
      ED_SW.innerHTML = CAT_PALETTE.map((hex, i) =>
        `<button type="button" class="sj-editor-swatch${i === edColor ? ' on' : ''}" data-c="${i}" aria-label="颜色 ${i + 1}" style="background:${hex}"></button>`
      ).join('');
    }
    function paintEditorChip() {
      if (!ED_CHIP) return;
      ED_CHIP.className = 'sj-editor-chip c' + edColor;
    }
    function openCatEditor(id) {
      const cat = state.categories.find((c) => c.id === id);
      if (!cat || !EDITOR) return;
      edCat = cat;
      edColor = chipIndex(cat);
      if (ED_NAME) ED_NAME.value = cat.name;
      paintEditorSwatches();
      paintEditorChip();
      EDITOR.classList.remove('hidden');
      if (typeof hideCtx === 'function') hideCtx();
      setTimeout(() => { if (ED_NAME) { ED_NAME.focus(); ED_NAME.select(); } }, 40);
    }
    if (ED_SW) ED_SW.addEventListener('click', (e) => {
      const b = e.target.closest('[data-c]');
      if (!b) return;
      edColor = Number(b.dataset.c);
      paintEditorSwatches();
      paintEditorChip();
    });
    if (EDITOR) EDITOR.addEventListener('click', (e) => {
      const el = e.target.closest('[data-act]');
      if (el && el.dataset.act === 'editor-close') closeCatEditor();
    });
    if (ED_SAVE) ED_SAVE.addEventListener('click', async () => {
      if (!edCat) return;
      const name = (ED_NAME && ED_NAME.value.trim()) || edCat.name;
      ED_SAVE.disabled = true;
      try {
        const updated = await api(`/api/categories/${edCat.id}`, {
          method: 'PATCH', body: { name, color: edColor },
        });
        Object.assign(edCat, updated);
        closeCatEditor();
        renderTree();
        renderCatSheet();
        if (MGR && !MGR.classList.contains('hidden')) renderCatManager();
        window.dispatchEvent(new Event('sj-categories-changed'));
        toast('已保存');
      } catch (e) {
        toast(e.message);
      } finally {
        ED_SAVE.disabled = false;
      }
    });
    if (ED_DEL) ED_DEL.addEventListener('click', () => {
      if (!edCat) return;
      const cat = edCat;
      closeCatEditor();
      deleteCategory(cat);
    });

    function openCatActions(id, grip) {
      openCatEditor(id);
    }
    if (MGR_BACK) MGR_BACK.addEventListener('click', () => closeCatManager(true));
    if (MMENU) {
      MMENU.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act]');
        if (!b) return;
        hideManageMenu();
        hideCatSheet();
        if (b.dataset.act === 'new-root') askCreateCategory(null);
        else if (b.dataset.act === 'edit') openCatManager();
      });
    }
    document.addEventListener('pointerdown', (e) => {
      if (!MMENU || MMENU.classList.contains('hidden')) return;
      if (e.target.closest('#sjManageMenu') || e.target.closest('[data-act="manage"]')) return;
      hideManageMenu();
    }, true);
    if (MGR_BODY) {
      MGR_BODY.addEventListener('click', (e) => {
        const act = e.target.closest('[data-act]');
        if (!act) return;
        const a = act.dataset.act;
        if (a === 'mgr-grip') { openCatEditor(act.dataset.id); return; }  // 点击直接进编辑弹窗
        if (a === 'mgr-toggle') {
          const id = act.dataset.id;
          if (mgrCollapsed.has(id)) mgrCollapsed.delete(id); else mgrCollapsed.add(id);
          renderCatManager();
        } else if (a === 'mgr-add-root') {
          askCreateCategory(null);
        } else if (a === 'mgr-add-sub') {
          askCreateCategory(act.dataset.parent || null);
        } else if (a === 'mgr-merge-dups') {
          previewMergeDups();
        } else if (a === 'mgr-undo-merge') {
          undoMergeDups();
        }
      });
      MGR_BODY.addEventListener('pointerdown', (e) => {
        const grip = e.target.closest('[data-act="mgr-grip"]');
        if (!grip) return;
        const row = grip.closest('.sj-mgr-row[data-cat-id]');
        if (!row) return;
        catDrag = {
          grip, row,
          parent: row.dataset.parent || '',
          x: e.clientX, y: e.clientY, moved: false,
        };
      });
      MGR_BODY.addEventListener('pointermove', (e) => {
        if (!catDrag) return;
        if (!catDrag.moved && Math.hypot(e.clientX - catDrag.x, e.clientY - catDrag.y) < 10) return;
        if (!catDrag.moved) {
          catDrag.moved = true;
          catDrag.row.classList.add('sj-mgr-dragging');
          try { catDrag.grip.setPointerCapture(e.pointerId); } catch (_) {}
        }
        const under = document.elementFromPoint(e.clientX, e.clientY);
        const target = under && under.closest('.sj-mgr-row[data-cat-id]');
        if (!target || target === catDrag.row || (target.dataset.parent || '') !== catDrag.parent) return;
        const box = target.getBoundingClientRect();
        catDrag.row.parentNode.insertBefore(catDrag.row, e.clientY < box.top + box.height / 2 ? target : target.nextSibling);
      });
      const finishDrag = async (e) => {
        if (!catDrag) return;
        const d = catDrag;
        catDrag = null;
        try { d.grip.releasePointerCapture(e.pointerId); } catch (_) {}
        d.row.classList.remove('sj-mgr-dragging');
        if (!d.moved) return;                 // 纯点击：由 click 事件打开编辑弹窗
        catDragJustMoved = true;              // 拖拽后抑制紧随的 click，避免误弹编辑框
        await saveCatOrder(d.parent);
      };
      MGR_BODY.addEventListener('pointerup', finishDrag);
      MGR_BODY.addEventListener('pointercancel', (e) => {
        if (!catDrag) return;
        catDrag.row.classList.remove('sj-mgr-dragging');
        catDrag = null;
      });
    }
    window.addEventListener('sj-categories-changed', () => {
      mgrCollapsed.clear();
      sheetCollapsed.clear();
      renderCatSheet();
      if (MGR && !MGR.classList.contains('hidden')) renderCatManager();
    });

    function hideManageMenu() {
      if (MMENU) MMENU.classList.add('hidden');
    }
    function showManageMenu(x, y) {
      if (!MMENU) return;
      MMENU.classList.remove('hidden');
      const r = MMENU.getBoundingClientRect();
      MMENU.style.left = Math.max(8, Math.min(x, window.innerWidth - r.width - 8)) + 'px';
      MMENU.style.top = Math.max(8, Math.min(y, window.innerHeight - r.height - 8)) + 'px';
    }
    if (TITLE) TITLE.addEventListener('click', () => {
      if (SHEET && SHEET.classList.contains('hidden')) showCatSheet(); else hideCatSheet();
    });
    if (SHEET) SHEET.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]');
      if (act) {
        const a = act.dataset.act;
        if (a === 'cat-close') { hideCatSheet(); return; }
        if (a === 'manage') {
          /* 参考华为备忘录：先弹「新建文件夹 / 编辑」，不立刻关掉分类面板。 */
          const r = act.getBoundingClientRect();
          showManageMenu(r.right - 180, r.bottom + 6);
          return;
        }
        if (a === 'cat-toggle') {
          const id = act.dataset.id;
          if (sheetCollapsed.has(id)) sheetCollapsed.delete(id); else sheetCollapsed.add(id);
          renderCatSheet();
          return;
        }
        if (a === 'sheet-add-sub') {
          hideCatSheet();
          askCreateCategory(act.dataset.parent || null);
          return;
        }
        hideCatSheet();
        if (a === 'trash') {
          const b = $('#sjPlusToolsBtn'); if (b) b.click();
        }
        return;
      }
      const row = e.target.closest('[data-cat]');
      if (!row) return;
      const key = row.dataset.cat;
      state.selCat = key;
      state.search = '';
      const si = $('#searchInput'); if (si) si.value = '';
      if (SEARCH) SEARCH.value = '';
      renderTree();
      renderList();
      hideCatSheet();
      closeDrawer();
    });

    /* 首页搜索框：与侧栏搜索框同一份 state.search，同步两边输入值 */
    if (SEARCH) SEARCH.addEventListener('input', (e) => {
      state.search = e.target.value;
      const si = $('#searchInput'); if (si) si.value = e.target.value;
      renderTree();
      renderList();
    });

    /* 详情页「更多」菜单：锚点一定要用真正被点到的那个按钮。
       编辑态下详情底栏是 display:none，拿它的 rect 会得到全 0，
       菜单就被钳到屏幕左上角——看着像没反应。所以两处入口各传自己的按钮。 */
    function openNoteMore(anchor, note) {
      if (!anchor || !note) return;
      const r = anchor.getBoundingClientRect();
      showCtx(r.right - 120, r.top - 8, [
        { label: 'Markdown 源码', icon: ICON_ALL, onClick: () => showMarkdownSource() },
        { label: '历史版本', icon: ICON_ALL, onClick: () => { const el = $('#historyBtn'); if (el) el.click(); } },
        { label: '移动到分类', icon: I.folder, onClick: () => openCategoryPicker(note) },
        { sep: true },
        { label: '同步到云端', icon: I.download, onClick: () => { if (window.SJSync) window.SJSync.open(); } },
      ], { above: true, anchor });
    }

    /* 详情页操作：全部指向现有按钮/菜单，不重复实现 */
    if (DETAIL) DETAIL.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      /* 返回列表：顶栏收起后是详情页唯一返回出口，必须走 closeEditor 落盘 */
      if (b.dataset.act === 'back') { hideMoreMenu(); closeEditor(); return; }
      const note = currentNote();
      if (!note) return;
      const act = b.dataset.act;
      if (act === 'share') { const el = $('#exportBtn2'); if (el) el.click(); }
      else if (act === 'star') { const el = $('#starBtn'); if (el) el.click(); }
      else if (act === 'delete') { const el = $('#deleteNoteBtn'); if (el) el.click(); }
      else if (act === 'more') openNoteMore(b, note);
    });

    /* ---- 华为风详情页：阅读态（默认）/ 编辑态（点正文进入） ----
       共用一套 DOM，只切 body 上的 sj-note-edit 与 contenteditable：
       阅读态 = 返回箭头 + 大标题 + 日期/分类 + 大字正文 + 四项底栏；
       编辑态 = 返回/标题/撤销/重做/完成 + 编辑工具条。
       不改任何数据格式，桌面端完全不受影响（样式都在 ≤980px 内）。 */
    const NOTE_HEAD = $('#sjNoteHead'), NOTE_ACTIONS = NOTE_HEAD && NOTE_HEAD.querySelector('.sj-nh-acts');
    const META_CAT = $('#sjMetaCat'), EDIT_BAR = $('#sjEditBar'), BODY_BOX = $('#editorBody');
    const META_ROW = META_CAT && META_CAT.parentElement;
    const READ_HERO = $('#sjReadHero'), READ_TITLE = $('#sjReadTitle'), READ_META = $('#sjRhMeta');
    let lastReadHeroH = 0;   /* 阅读态 hero 高度：编辑态它是 display:none，换算滚动位置时得用缓存 */
    const IMG_BAR = $('#sjImgBar');
    const HEAD_BAR = document.querySelector('.editor-head');
    let noteModeId = null;

    /* 标题输入框：手机端两种形态都待在顶栏，和返回箭头同一行（阅读态只是不可编辑）；
       桌面端仍放在正文上方的 .editor-head 里。
       事件监听挂在元素本身，搬动节点不会失效。 */
    function mountTitle() {
      const ti = $('#titleInput');
      if (!ti) return;
      if (NARROW()) {
        if (NOTE_HEAD && NOTE_ACTIONS && ti.parentElement !== NOTE_HEAD) {
          NOTE_HEAD.insertBefore(ti, NOTE_ACTIONS);
        }
      } else if (HEAD_BAR && ti.parentElement !== HEAD_BAR) {
        HEAD_BAR.insertBefore(ti, HEAD_BAR.firstChild);
      }
    }
    /* 标题下方那一行：分类（可点改名/换类）+ 创建日期。
       分类不再重复出现在右边胶囊里（用户 2026-11-21 反馈「分类出现两次」）。 */
    function updateMetaCat(note) {
      if (!META_CAT) return;
      const cat = note && note.categoryId ? state.categories.find((c) => c.id === note.categoryId) : null;
      META_CAT.textContent = cat ? cat.name : '未分类';
      META_CAT.classList.toggle('hidden', !note);
      META_CAT.classList.toggle('is-empty', !cat);
      const d = $('#sjMetaDate');
      if (d) {
        d.textContent = note ? '创建于 ' + fmtDate(note.createdAt) : '';
        d.classList.toggle('hidden', !note);
      }
      /* 正文顶部的大标题（阅读态）跟着同一条笔记走 */
      if (READ_TITLE) {
        const t = note ? String(note.title || '').trim() : '';
        READ_TITLE.textContent = t || '无标题笔记';
      }
    }
    /* 分类 + 日期：阅读态搬进正文大标题下方（跟着正文一起上滚），
       编辑态搬回顶栏下那一行。节点搬动不会丢事件监听。 */
    function mountMeta() {
      if (!META_CAT || !META_ROW) return;
      const d = $('#sjMetaDate');
      const toHero = NARROW() && READ_META
        && document.body.classList.contains('sj-note-open')
        && !document.body.classList.contains('sj-note-edit');
      if (toHero) {
        if (META_CAT.parentElement !== READ_META) { READ_META.appendChild(META_CAT); if (d) READ_META.appendChild(d); }
        return;
      }
      if (META_CAT.parentElement === META_ROW) return;
      const dot = META_ROW.querySelector('.meta-dot');
      META_ROW.insertBefore(META_CAT, dot || META_ROW.firstChild);
      if (d) META_ROW.insertBefore(d, dot || META_ROW.firstChild);
    }
    /* 别处改了分类（管理页改名、换类、合并）后，把这一行刷新回来 */
    function refreshNoteMetaLine() {
      const n = currentNote();
      if (n) updateMetaCat(n);
    }
    window.SJRefreshNoteMeta = refreshNoteMetaLine;

    /* ---- 正文图片：点一下选中，浮动条里上移 / 下移 / 删除 ----
       富文本里的图片本来就是 <img> 节点，这里只补「选中 + 换位置」，
       改完调 onRichInput() 落脏，和正常打字走同一条保存链路。 */
    let imgSel = null;
    function imgBlockOf(img) {
      const pane = $('#richPane');
      if (!pane || !img) return img;
      let el = img;
      while (el && el.parentElement && el.parentElement !== pane) el = el.parentElement;
      return el && el.parentElement === pane ? el : img;
    }
    function clearImgSel() {
      if (imgSel) imgSel.classList.remove('sj-img-sel');
      imgSel = null;
      if (IMG_BAR) IMG_BAR.classList.add('hidden');
    }
    function selectImg(img) {
      clearImgSel();
      if (!img) return;
      imgSel = img;
      img.classList.add('sj-img-sel');
      if (IMG_BAR) IMG_BAR.classList.remove('hidden');
    }
    function moveImg(dir) {
      if (!imgSel) return;
      const blk = imgBlockOf(imgSel);
      const sib = dir < 0 ? blk.previousElementSibling : blk.nextElementSibling;
      if (!sib) { toast(dir < 0 ? '已经是最前面' : '已经是最后面'); return; }
      if (dir < 0) blk.parentElement.insertBefore(blk, sib);
      else blk.parentElement.insertBefore(sib, blk);
      onRichInput();
      selectImg(imgSel);
    }
    function deleteImg() {
      if (!imgSel) return;
      const blk = imgBlockOf(imgSel);
      /* 整个块里只有这张图就整块删掉，别留下一个空的占位段落 */
      const onlyImg = blk === imgSel || (blk.querySelectorAll('img').length === 1 && !blk.textContent.trim());
      (onlyImg ? blk : imgSel).remove();
      clearImgSel();
      onRichInput();
      toast('已删除图片');
    }
    if (IMG_BAR) IMG_BAR.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      e.preventDefault();
      const a = b.dataset.act;
      if (a === 'img-up') moveImg(-1);
      else if (a === 'img-down') moveImg(1);
      else if (a === 'img-del') deleteImg();
    });
    /* 点别处收起图片操作条（点图片本身由正文点击处理） */
    document.addEventListener('click', (e) => {
      if (!imgSel) return;
      if (IMG_BAR && IMG_BAR.contains(e.target)) return;
      if (e.target.closest && e.target.closest('#richPane img')) return;
      clearImgSel();
    });
    /* 标题下方的分类：点一下就换类（复用原有的分类选择弹层） */
    if (META_CAT) META_CAT.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const note = currentNote();
      if (note) openCategoryPicker(note);
    });
    /* 分类改名 / 合并后，标题下面这一行跟着变 */
    window.addEventListener('sj-categories-changed', () => { refreshNoteMetaLine(); });

    /* ================= 「样式」面板（华为备忘录那一套文字格式） =================
       编辑态点底栏最左边那个 A 按钮弹出：B/I/U、三种对齐、增减缩进、四种列表、
       字号滑杆、文字颜色、纸张底色。全部只改正文富文本本身，不新增数据字段。
       所有按钮都在 mousedown 时阻止默认，保住正文里的选区（savedRange 由
       selectionchange 维护），点完面板还能接着在原来的位置调格式。 */
    const STYLE_SHEET = $('#sjStyleSheet');
    const SS_SIZE = $('#sjStyleSize');
    const PAPER_KEY = 'sj_paper_v1';

    function styleSheetOpen() {
      return !!(STYLE_SHEET && !STYLE_SHEET.classList.contains('hidden')
        && !STYLE_SHEET.classList.contains('sj-ss-closing'));
    }
    let ssCloseTimer = 0;
    function closeStyleSheet() {
      if (!STYLE_SHEET) return;
      /* 还在等键盘收完的那种「半开」状态，一并撤掉 */
      stopViewportQuiet();
      /* 收起时把还没跑完的「滑到光标行」掐掉：面板已经走了，再滚一下就是多余的跳动 */
      stopSheetReveal();
      /* 面板先淡出、编辑区同时回落，两个动作叠在一起，中间不会露出空白 */
      STYLE_SHEET.classList.add('sj-ss-closing');
      document.body.classList.remove('sj-style-open');
      document.documentElement.style.removeProperty('--ss-h');
      const b = EDIT_BAR && EDIT_BAR.querySelector('[data-act="fmt"]');
      if (b) b.classList.remove('on');
      /* 这里不再立刻放开键盘策略：正文还有焦点，属性一撤输入法会自己弹起来，
         视口再被压一次，和上面的高度回落叠在一起就是「闪一下」。
         留给下一次点正文的 focusTyping 去撤——那时弹键盘才是用户的本意。
         自绘光标也不藏：窄屏编辑态一直画着，收起面板时位置连续，不会断一下。 */
      clearTimeout(ssCloseTimer);
      ssCloseTimer = setTimeout(() => {
        STYLE_SHEET.classList.add('hidden');
        STYLE_SHEET.classList.remove('sj-ss-closing');
      }, 180);
      cmSettle();
      /* 收起后正文要是没焦点了（开面板收键盘时 blur 过），把焦点静默放回去：
         没有焦点，系统连光标都不画，用户会觉得「光标没了」。 */
      const rp = $('#richPane');
      if (rp && document.activeElement !== rp) focusQuiet(rp);
    }
    /* 面板升降有 180ms 的高度过渡，期间布局一直在变，光标得多跟几帧 */
    function cmSettle() {
      [0, 60, 130, 220, 340].forEach((t) => setTimeout(cmPaint, t));
    }

    /* ---------------- 自绘光标 ----------------
       手机内核在「正文有焦点、但键盘被压住」这种状态里，不保证一直画那根竖线：
       面板开着上翻正文，原生光标就没了，得再点一次正文才回来（用户 2026-11-21 反馈）。
       与其跟各家的聚焦/失焦行为较劲，不如自己画一根：位置每帧按选区算，
       跟着正文滚、跟着格式变，只要面板开着就在。原生光标在面板开着时设成透明，
       免得和自绘的两根打架。 */
    let cmEl = null, cmRange = null;
    function cmEnsure() {
      if (cmEl) return cmEl;
      cmEl = document.createElement('div');
      cmEl.className = 'sj-caret-mark hidden';
      cmEl.setAttribute('aria-hidden', 'true');
      document.body.appendChild(cmEl);
      return cmEl;
    }
    function cmLiveRange() {
      const pane = $('#richPane');
      if (!pane) return null;
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const r = sel.getRangeAt(0);
        if (r && pane.contains(r.startContainer)) return r;
      }
      if (cmRange && pane.contains(cmRange.startContainer)) return cmRange;
      if (savedRange && pane.contains(savedRange.startContainer)) return savedRange;
      return null;
    }
    function cmHide() {
      if (cmEl) cmEl.classList.add('hidden');
      /* 自绘光标一收，原生光标就得回来，否则正文里一根都没有 */
      document.body.classList.remove('sj-caret-drawn');
    }
    /* 光标跟着字色走：改成紫字，光标就该是紫的，不然在彩色行里找不到它在哪 */
    function cmColorAt(r) {
      try {
        let n = r.startContainer;
        if (n && n.nodeType === 1) {
          const kids = n.childNodes;
          n = kids[Math.min(r.startOffset, kids.length - 1)] || n;
        }
        if (n && n.nodeType !== 1) n = n.parentElement;
        if (!n) return '';
        return window.getComputedStyle(n).color || '';
      } catch (_) { return ''; }
    }
    function cmPaint() {
      const pane = $('#richPane');
      if (!pane) return;
      /* 窄屏编辑态就一直画（不再只在面板打开时）：这样收起面板那一刻光标是连续的，
         不会「先藏掉再等原生重绘」中间空一拍。宽屏仍用系统原生光标。 */
      const editing = document.body.classList.contains('sj-note-edit');
      const focused = document.activeElement === pane;
      /* 面板「已经弹出来」或「正在等键盘收完」都算在调格式：光标不能断。
         等键盘的那 200~600ms 里正文刚 blur 过，系统不画光标，只能靠自绘这根顶上，
         否则键盘往下走、光标也没了，看着同样像闪一下（用户 2026-11-21 反馈）。 */
      if (!NARROW() || !editing || !(focused || styleSheetOpen() || styleSheetPending())) { cmHide(); return; }
      const r = cmLiveRange();
      if (!r || !r.collapsed) { cmHide(); return; }
      let box = null;
      try { const rs = r.getClientRects(); if (rs && rs.length) box = rs[rs.length - 1]; } catch (_) {}
      if (!box) {
        let el = r.startContainer;
        if (el && el.nodeType !== 1) el = el.parentElement;
        if (!el || !el.getBoundingClientRect) { cmHide(); return; }
        const b = el.getBoundingClientRect();
        box = { left: b.left, top: b.top, height: Math.min(b.height, 32) };
      }
      const pr = pane.getBoundingClientRect();
      const el = cmEnsure();
      const lh = parseFloat(window.getComputedStyle(pane).lineHeight) || 22;
      const h = Math.round(box.height || lh);
      const y = Math.round(box.top);
      /* 滚出正文可视区就收起来（原生光标这时也不在可视区，不会两根打架）。
         面板开着时只看上边界：正文底边被抬起的过程中，光标行会短暂落到
         「看不见的底边」以下，那时它其实躲在面板后面（面板 z-index 更高），
         照样画着——不然这一百多毫秒里两根光标都没有，看着就是闪一下。 */
      const sheetUp = styleSheetOpen();
      if (y + h < pr.top || (!sheetUp && y > pr.bottom)) { cmHide(); return; }
      el.style.left = Math.round(box.left) + 'px';
      el.style.top = y + 'px';
      el.style.height = h + 'px';
      const col = cmColorAt(r);
      if (col) el.style.background = col;
      el.classList.remove('hidden');
      /* 确实画出来了才把原生光标藏掉，避免出现「一根光标都没有」 */
      document.body.classList.add('sj-caret-drawn');
    }
    /* 选区变了、滚动了、调完格式都走这里：位置重算一遍 */
    function cmSync() {
      const r = cmLiveRange();
      cmRange = r ? r.cloneRange() : null;
      cmPaint();
    }
    window.SJCaretRefresh = cmSync;
    caretRefresh = cmSync;
    (function () {
      const pane = $('#richPane');
      if (!pane) return;
      /* 滚动时直接重画（按 16ms 节流）：不用 rAF——部分内核/后台标签页里 rAF
         会被节流甚至不跑，光标就会停在旧位置，用户看到的就是「又没了」。
         cmPaint 自己判断该不该画，这里不用再套条件。 */
      let last = 0;
      pane.addEventListener('scroll', () => {
        const now = Date.now();
        if (now - last < 16) return;
        last = now;
        cmPaint();
      }, { passive: true });
      /* 打字、挪光标：选区一变就重画（自绘光标是唯一的可见光标） */
      document.addEventListener('selectionchange', cmPaint);
      pane.addEventListener('input', cmPaint);
      pane.addEventListener('keyup', cmPaint);
      window.addEventListener('resize', cmPaint);
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', cmPaint);
        window.visualViewport.addEventListener('scroll', cmPaint);
      }
      /* 兜底：个别内核滚动时不派发 scroll（或被节流得很厉害），
         每 250ms 对一次位置，代价只有一次 getClientRects。 */
      setInterval(cmPaint, 250);
    })();
    /* 面板是 fixed 定位，量出真实高度交给 CSS，把编辑区整体抬到它上方 */
    function syncSheetHeight() {
      if (!STYLE_SHEET || STYLE_SHEET.classList.contains('hidden')) return;
      const h = Math.round(STYLE_SHEET.getBoundingClientRect().height);
      if (h > 0) document.documentElement.style.setProperty('--ss-h', h + 'px');
    }
    /* 打开面板时键盘也在收，可视区还要再变一次；这时候算出来的「要不要滚」
       不作数。每次视口变化就把这件事往后顺延，等它安静下来再滑过去。 */
    let ssRevealTimer = 0;
    function scheduleSheetReveal(delay) {
      clearTimeout(ssRevealTimer);
      ssRevealTimer = setTimeout(() => {
        ssRevealTimer = 0;
        if (!styleSheetOpen()) return;
        glideRevealSelection(200);
      }, delay || 240);
    }
    function stopSheetReveal() {
      clearTimeout(ssRevealTimer);
      ssRevealTimer = 0;
      stopGlideReveal();
    }
    /* 键盘往下收的这 200~300ms 里，可视区是从「键盘高度」长回全屏的。
       这会儿就把面板弹出来，面板会先按自己的 378px 占掉底边，而可视区还只有
       键盘那么点高 —— 正文被压成一条，等键盘收完再长回来，看着就是「首次点 A
       闪一下」（用户 2026-11-21 反馈）。所以先等可视高度连续几拍不再变化，
       再量高度、再弹面板：那时 844-378 正好够正文用，一点都不用挤。 */
    let vqTimer = 0, vqLast = -1, vqSame = 0, vqCb = null, vqT0 = 0;
    function whenViewportQuiet(cb) {
      stopViewportQuiet();
      vqCb = cb; vqLast = -1; vqSame = 0; vqT0 = Date.now();
      const tick = () => {
        if (!vqCb) return;
        const h = Math.round((window.visualViewport && window.visualViewport.height) || window.innerHeight || 0);
        vqSame = (h === vqLast) ? vqSame + 1 : 0;
        vqLast = h;
        /* 连三拍（≈120ms）不变就算安静；个别内核 resize 一直不断，最多等 640ms */
        if (vqSame >= 3 || Date.now() - vqT0 > 640) {
          const f = vqCb;
          stopViewportQuiet();
          if (f) f();
          return;
        }
        vqTimer = setTimeout(tick, 40);
      };
      vqTimer = setTimeout(tick, 40);
    }
    function stopViewportQuiet() {
      clearTimeout(vqTimer);
      vqTimer = 0;
      vqCb = null;
      vqSame = 0;
      vqLast = -1;
    }
    function styleSheetPending() { return !!vqCb; }

    /* 面板要占掉约 378px 底边。要是这会儿可视区只剩「键盘顶起来那么点高」，
       立刻弹面板会把正文压成一条，等键盘收完又长回来 —— 看着就是「闪一下」
       （用户 2026-11-21 反馈）。所以按「剩下的高度够不够正文用」来判断：
       够就立刻弹，不够就等可视高度安静下来（键盘收完）再弹。 */
    function sheetRoom() {
      const h0 = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ss-h'));
      const sh = h0 > 0 ? h0 : 380;
      const vh = (window.visualViewport && window.visualViewport.height) || window.innerHeight || 0;
      return Math.round(vh - sh);
    }
    function openStyleSheet() {
      if (!STYLE_SHEET) return;
      clearImgSel();
      /* 调格式不需要输入法：面板弹起时顺手把键盘收掉，
         否则键盘会把面板顶到半屏（用户 2026-11-21 反馈） */
      hideSoftKeyboard();
      /* 按钮先亮，别让这一下点击「没反应」等在那儿 */
      const fb = EDIT_BAR && EDIT_BAR.querySelector('[data-act="fmt"]');
      if (fb) fb.classList.add('on');
      if (sheetRoom() < 300) { whenViewportQuiet(openSheetNow); return; }
      stopViewportQuiet();
      openSheetNow();
    }

    function openSheetNow() {
      if (!STYLE_SHEET) return;
      clearTimeout(ssCloseTimer);
      STYLE_SHEET.classList.remove('sj-ss-closing');
      STYLE_SHEET.classList.remove('hidden');
      /* 先量高度、再挂类：反过来会先用 var(--ss-h, 360px) 的默认值起步，
         下一帧再改成实测值（≈378），两段跳看着就是抖一下（用户 2026-11-21 反馈）。 */
      syncSheetHeight();
      document.body.classList.add('sj-style-open');
      const b = EDIT_BAR && EDIT_BAR.querySelector('[data-act="fmt"]');
      if (b) b.classList.add('on');
      syncStyleStates();
      requestAnimationFrame(() => { syncSheetHeight(); refreshCaret(); });
      /* 把正在调的那一行带进视野：以前等 180ms 动画走完就一把 scrollTop 过去，
         正文会在面板停稳的瞬间跳一大截（用户 2026-11-21 反馈「首次点 A 闪屏」）。
         现在改成等视口也安静下来（键盘收完）再滑过去，自绘光标跟着走。 */
      scheduleSheetReveal();
      cmSettle();
    }

    /* 对齐 / 缩进 / 颜色必须 styleWithCSS=true：否则浏览器会生成 align 属性或
       <font color>，这两种写法在 DOMPurify 那一关会被抹掉，重开笔记就白调了。 */
    function cssCmd(cmd, val) {
      const pane = $('#richPane');
      if (!pane) return false;
      focusQuiet(pane);
      restoreRange();
      try { document.execCommand('styleWithCSS', false, true); } catch (_) {}
      let ok = false;
      try { ok = document.execCommand(cmd, false, val); } catch (_) {}
      onRichInput();
      syncStyleStates();
      revealSelection(); refreshCaret();
      return ok;
    }

    /* 光标只是一根竖线时，先把整段选中再套格式（ensureBlockSel 在模块作用域，
       和 exec 系列共用一份） */
    /* 列表：先插普通列表，再把符号换成字母或方框 */
    /* 找光标所在的那一层列表（就近的 UL/OL），没有就返回 null */
    function listOf(node, pane) {
      let el = node && node.nodeType === 1 ? node : (node && node.parentElement);
      while (el && el !== pane) {
        if (el.tagName === 'UL' || el.tagName === 'OL') return el;
        el = el.parentElement;
      }
      return null;
    }
    function listKindOf(el) {
      if (!el) return '';
      if (el.classList.contains('sj-task')) return 'list-task';
      if (el.tagName === 'OL') return el.style.listStyleType === 'lower-alpha' ? 'list-alpha' : 'list-num';
      return 'list-ul';
    }
    /* 换列表类型只换外层标签，不重新 execCommand——那会把新列表套进旧列表里，
       序号从 1 重新数，看着就像「没反应」。
       换标签会把旧节点摘出文档，选区跟着悬空（下一次点格式就没反应了），
       所以按子节点路径把光标原样搬到新树的同一位置。 */
    function rangePathOf(root, r) {
      const path = [];
      let n = r.startContainer;
      while (n && n !== root) {
        path.unshift(Array.prototype.indexOf.call(n.parentNode.childNodes, n));
        n = n.parentNode;
      }
      return n === root ? { path: path, offset: r.startOffset } : null;
    }
    function rangeFromPath(root, p) {
      let n = root;
      for (let i = 0; i < p.path.length; i++) {
        n = n.childNodes[p.path[i]];
        if (!n) return null;
      }
      const r = document.createRange();
      const max = n.nodeType === 3 ? n.length : n.childNodes.length;
      try { r.setStart(n, Math.min(p.offset, max)); } catch (_) { r.selectNodeContents(n); r.collapse(true); return r; }
      r.collapse(true);
      return r;
    }
    function retagList(list, tag) {
      if (list.tagName === tag) return list;
      const sel = window.getSelection();
      const live = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
      const saved = live && list.contains(live.startContainer) ? rangePathOf(list, live) : null;
      const nu = document.createElement(tag);
      for (let i = 0; i < list.attributes.length; i++) {
        const a = list.attributes[i];
        try { nu.setAttribute(a.name, a.value); } catch (_) {}
      }
      while (list.firstChild) nu.appendChild(list.firstChild);
      list.parentNode.replaceChild(nu, list);
      if (saved) {
        const nr = rangeFromPath(nu, saved);
        if (nr) {
          sel.removeAllRanges();
          sel.addRange(nr);
          savedRange = nr.cloneRange();
        }
      }
      return nu;
    }
    /* 再点一次同一个列表按钮 = 取消列表：li 拆回段落，子列表留在原处不丢内容 */
    function unwrapList(list) {
      const sel = window.getSelection();
      const live = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
      let liIdx = -1;
      if (live && list.contains(live.startContainer)) {
        let n = live.startContainer;
        while (n && n.parentNode && n.parentNode !== list) n = n.parentNode;
        liIdx = n && n.parentNode === list ? Array.prototype.indexOf.call(list.children, n) : -1;
      }
      const out = document.createDocumentFragment();
      const made = [];
      Array.prototype.slice.call(list.children).forEach((li) => {
        const p = document.createElement('p');
        const nested = [];
        Array.prototype.slice.call(li.children).forEach((c) => {
          if (c.tagName === 'UL' || c.tagName === 'OL') nested.push(c);
        });
        while (li.firstChild) p.appendChild(li.firstChild);
        out.appendChild(p);
        nested.forEach((n) => out.appendChild(n));
        made.push(p);
      });
      list.parentNode.replaceChild(out, list);
      /* 拆完把光标放回原来那一行的段尾，别让它悬空 */
      if (liIdx >= 0 && made[liIdx] && sel) {
        const nr = document.createRange();
        nr.selectNodeContents(made[liIdx]);
        nr.collapse(false);
        sel.removeAllRanges();
        sel.addRange(nr);
        savedRange = nr.cloneRange();
      }
    }
    /* Chrome 有时会把新列表塞进原来的 <p> 里（<p><ol>…</ol></p>），
       存成 HTML 再读回来，浏览器会在列表前补一个空段落——把列表提出来 */
    function liftList(list) {
      const p = list.parentElement;
      const pane = $('#richPane');
      if (!p || !pane || p === pane) return;
      if (!/^(P|DIV|H1|H2|H3|BLOCKQUOTE)$/.test(p.tagName)) return;
      const extra = Array.prototype.filter.call(p.childNodes, (n) => {
        if (n === list) return false;
        if (n.nodeType === 3 && !n.textContent.trim()) return false;
        return true;
      });
      if (!extra.length) p.parentNode.replaceChild(list, p);
      else p.parentNode.insertBefore(list, p.nextSibling);
    }
    function paintListKind(el, kind) {
      const ordered = kind === 'list-num' || kind === 'list-alpha';
      const node = retagList(el, ordered ? 'OL' : 'UL');
      node.classList.remove('sj-task');
      node.style.listStyleType = kind === 'list-alpha' ? 'lower-alpha' : '';
      if (kind === 'list-task') node.classList.add('sj-task');
      liftList(node);
      return node;
    }
    function styleList(kind) {
      const pane = $('#richPane');
      if (!pane) return;
      const ordered = kind === 'list-num' || kind === 'list-alpha';
      const sel = window.getSelection();
      let node = sel && sel.rangeCount ? sel.getRangeAt(0).startContainer : null;
      /* 选区万一悬空（节点被替换过），退回上次记下的范围，别误判成「不在列表里」 */
      if ((!node || !pane.contains(node)) && savedRange && pane.contains(savedRange.startContainer)) {
        node = savedRange.startContainer;
      }
      const cur = listOf(node, pane);
      if (cur && listKindOf(cur) === kind) {
        /* 同一个按钮再点一次：取消列表 */
        unwrapList(cur);
        onRichInput();
        revealSelection(); refreshCaret();
        return;
      }
      if (cur) {
        /* 已经在列表里：原地换类型（圆点 ↔ 1.2.3. ↔ a.b.c. ↔ 方框） */
        paintListKind(cur, kind);
        onRichInput();
        revealSelection(); refreshCaret();
        return;
      }
      /* 记下光标所在的整块文字，建好列表后把光标放回同一行（execCommand
         建完列表时选区常常还挂在被替换掉的段落上，下一次点按钮就失灵） */
      const startText = (function () {
        let n = node && node.nodeType === 1 ? node : (node && node.parentElement);
        while (n && n !== pane && !/^(P|DIV|LI|H1|H2|H3|BLOCKQUOTE)$/.test(n.tagName)) n = n.parentElement;
        return n && n !== pane ? n.textContent.trim() : '';
      })();
      const before = Array.prototype.slice.call(pane.querySelectorAll('ul, ol'));
      cssCmd(ordered ? 'insertOrderedList' : 'insertUnorderedList');
      let made = null;
      const sel2 = window.getSelection();
      const n2 = sel2 && sel2.rangeCount ? sel2.getRangeAt(0).startContainer : null;
      if (n2 && pane.contains(n2)) made = listOf(n2, pane);
      if (!made) {
        /* 选区跑丢了就按「新出现的那个列表」认 */
        const fresh = Array.prototype.slice.call(pane.querySelectorAll('ul, ol'))
          .filter((l) => before.indexOf(l) < 0);
        made = fresh[0] || null;
      }
      if (!made) { onRichInput(); revealSelection(); refreshCaret(); return; }
      made = paintListKind(made, kind);
      const s3 = window.getSelection();
      if (!(s3 && s3.rangeCount && made.contains(s3.getRangeAt(0).startContainer))) {
        let li = null;
        Array.prototype.some.call(made.querySelectorAll('li'), (x) => {
          if (startText && x.textContent.trim() === startText) { li = x; return true; }
          return false;
        });
        if (!li) li = made.querySelector('li');
        if (li) {
          const nr = document.createRange();
          nr.selectNodeContents(li);
          nr.collapse(false);
          s3.removeAllRanges();
          s3.addRange(nr);
          savedRange = nr.cloneRange();
        }
      }
      onRichInput();
      revealSelection(); refreshCaret();
    }

    /* 面板上的开关量与正文里的真实状态对齐（加粗的字段一点开就应该是蓝的） */
    function syncStyleStates() {
      if (!STYLE_SHEET || STYLE_SHEET.classList.contains('hidden')) return;
      const map = {
        bold: 'bold', italic: 'italic', underline: 'underline',
        'al-left': 'justifyLeft', 'al-center': 'justifyCenter', 'al-right': 'justifyRight',
      };
      Object.keys(map).forEach((k) => {
        const b = STYLE_SHEET.querySelector('[data-act="' + k + '"]');
        if (!b) return;
        let on = false;
        try { on = document.queryCommandState(map[k]); } catch (_) {}
        b.classList.toggle('on', on);
      });
    }
    let ssTick = 0;
    document.addEventListener('selectionchange', () => {
      if (!styleSheetOpen() || ssTick) return;
      ssTick = window.requestAnimationFrame(() => { ssTick = 0; syncStyleStates(); });
    });

    function applyTextColor(c) {
      const pane = $('#richPane');
      if (!pane) return;
      ensureBlockSel();
      /* 「默认」这颗不是写死黑色：取当前正文的实际文字色，深色主题下才不会变黑块 */
      const color = c === 'default' ? getComputedStyle(pane).color : c;
      cssCmd('foreColor', color);
    }
    function applyPaper(idx) {
      const v = String(idx);
      document.body.dataset.paper = v;
      try { localStorage.setItem(PAPER_KEY, v); } catch (_) {}
      if (STYLE_SHEET) STYLE_SHEET.querySelectorAll('[data-paper]').forEach((el) => {
        el.classList.toggle('on', el.dataset.paper === v);
      });
    }
    /* 纸张是外观偏好（和行距一样记在本机），打开应用时恢复上次选的那张 */
    (function initPaper() {
      let v = '0';
      try { v = localStorage.getItem(PAPER_KEY) || '0'; } catch (_) {}
      document.body.dataset.paper = v;
      if (STYLE_SHEET) STYLE_SHEET.querySelectorAll('[data-paper]').forEach((el) => {
        el.classList.toggle('on', el.dataset.paper === v);
      });
    })();

    if (SS_SIZE) {
      const paintSize = () => {
        const min = Number(SS_SIZE.min) || 13;
        const max = Number(SS_SIZE.max) || 30;
        const p = ((Number(SS_SIZE.value) - min) / (max - min)) * 100;
        SS_SIZE.style.setProperty('--p', p.toFixed(2) + '%');
      };
      SS_SIZE.addEventListener('input', paintSize);
      /* 拖动过程中不改字（会碎成一堆 span），松手才落一次 */
      SS_SIZE.addEventListener('change', () => {
        ensureBlockSel();
        execFontSize(SS_SIZE.value);
      });
      paintSize();
    }

    if (STYLE_SHEET) {
      STYLE_SHEET.addEventListener('mousedown', (e) => {
        if (e.target.closest('button')) e.preventDefault();
      });
      STYLE_SHEET.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act], [data-color], [data-paper]');
        if (!b) return;
        e.preventDefault();
        const act = b.dataset.act;
        if (act === 'ss-close') { closeStyleSheet(); return; }
        if (act === 'bold') { exec('bold'); syncStyleStates(); return; }
        if (act === 'italic') { exec('italic'); syncStyleStates(); return; }
        if (act === 'underline') { exec('underline'); syncStyleStates(); return; }
        if (act === 'al-left') { cssCmd('justifyLeft'); return; }
        if (act === 'al-center') { cssCmd('justifyCenter'); return; }
        if (act === 'al-right') { cssCmd('justifyRight'); return; }
        if (act === 'outdent') { cssCmd('outdent'); return; }
        if (act === 'indent') { cssCmd('indent'); return; }
        if (act === 'list-num' || act === 'list-alpha' || act === 'list-ul' || act === 'list-task') {
          styleList(act);
          return;
        }
        if (b.dataset.color) { applyTextColor(b.dataset.color); return; }
        if (b.dataset.paper != null) { applyPaper(b.dataset.paper); }
      });
    }
    /* 点别处收回面板；点正文 / 标题行 / 面板自己都不收回。
       2026-11-21：以前点一下正文面板就消失，用户没法「点一行、立刻调这行」，
       所以把整块编辑区都排除掉，只有点 A 按钮或 × 才收起。 */
    document.addEventListener('click', (e) => {
      if (!styleSheetOpen()) return;
      if (STYLE_SHEET.contains(e.target)) return;
      const t = e.target;
      if (t.closest && (t.closest('[data-act="fmt"]') || t.closest('.editor-pane')
        || t.closest('#richPane') || t.closest('.sj-note-head'))) return;
      closeStyleSheet();
    });
    /* 转屏、键盘收起都会改变可视高度：面板高度重算一次，光标行的位置也跟着重算；
       视口一变就把「滑到光标行」往后顺延，别在视口还在动的时候抢着滚。 */
    window.addEventListener('resize', () => {
      if (!styleSheetOpen()) return;
      syncSheetHeight();
      scheduleSheetReveal(160);
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        if (!styleSheetOpen()) return;
        syncSheetHeight();
        scheduleSheetReveal(160);
      });
    }

    /* 点正文进入编辑时，把光标落到手指点的那个字后面，而不是跳回开头 */
    function caretTo(x, y) {
      const pane = $('#richPane');
      if (!pane) return;
      try {
        if (document.caretRangeFromPoint) {
          const r = document.caretRangeFromPoint(x, y);
          if (r) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(r);
            return;
          }
        }
        if (document.caretPositionFromPoint) {
          const pos = document.caretPositionFromPoint(x, y);
          if (pos) {
            const r = document.createRange();
            r.setStart(pos.offsetNode, pos.offset);
            r.collapse(true);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(r);
          }
        }
      } catch (_) {}
    }
    /* 正文只有富文本一个编辑面：存储层已经是富文本，
       打开笔记时就已经是 HTML 放进 richPane 了，
       进编辑态不需要再转一次。 */
    function toRichEditor() {
      const note = currentNote();
      const pane = $('#richPane');
      if (pane && note) {
        pane.innerHTML = noteHtml(note);
        decorate(pane);
      }
      applyFormat();
      renderToolbar();
      decorateRichAttachments();
    }
    function setNoteMode(mode, point, opts) {
      const note = currentNote();
      if (!note) return;
      const edit = mode === 'edit';
      const doFocus = !opts || opts.focus !== false;
      /* 两种形态的滚动容器不是同一个：阅读态滚 .editor-body（大标题 + 正文一起），
         编辑态滚 .rich-pane。切之前先把位置量下来，切完换算过去，
         否则点一下正文，正文会跳回顶部（大标题正好顶上 90 多像素）。 */
      const wasEdit = document.body.classList.contains('sj-note-edit');
      const rpEl = $('#richPane');
      const heroEl = $('#sjReadHero');
      const heroH = (heroEl && heroEl.offsetHeight ? heroEl.offsetHeight : lastReadHeroH) || 0;
      const bodyY = BODY_BOX ? BODY_BOX.scrollTop : 0;
      const rpY = rpEl ? rpEl.scrollTop : 0;
      document.body.classList.toggle('sj-note-edit', edit);
      if (edit && !wasEdit && rpEl) rpEl.scrollTop = Math.max(0, bodyY - heroH);
      if (!edit && wasEdit) {
        document.body.classList.remove('sj-head-solid');
        if (BODY_BOX) BODY_BOX.scrollTop = rpY + heroH;
      }
      if (!edit) { document.body.classList.remove('sj-note-fmt'); closeStyleSheet(); }
      const ti = $('#titleInput');
      if (ti) {
        ti.readOnly = !edit;
        /* 阅读态由滚动位置决定标题缩放，编辑态一律恢复原字号 */
        if (edit) { ti.style.transform = ''; ti.style.opacity = ''; }
      }
      const rp = $('#richPane');
      if (rp) rp.setAttribute('contenteditable', edit ? 'true' : 'false');
      if (EDIT_BAR) EDIT_BAR.classList.toggle('hidden', !edit);
      /* 分类/日期：阅读态搬进正文大标题下方，编辑态搬回原来那一行 */
      mountMeta();
      syncCollapse();
      if (edit) {
        toRichEditor();
        mountTitle();
        /* 打开已有笔记不抢焦点：手机上会自动弹键盘，很打扰 */
        if (!doFocus) { setKbManual(false); return; }
        setTimeout(() => {
          const target = $('#richPane');
          if (!target) return;
          /* 点了正文里某个位置 = 用户要写字，这时才唤起输入法。
             其它入口（新建草稿）也走 focusTyping，保证键盘策略是 auto。 */
          focusTyping(target);
          if (point) caretTo(point.x, point.y);
        }, 0);
      } else {
        setKbManual(false);
        clearImgSel();
        mountTitle();
        const ae = document.activeElement;
        if (ae && ae.blur && ae.tagName && ae.tagName !== 'BODY') ae.blur();
        void saveNow();
      }
    }
    function syncNoteMode() {
      const note = currentNote();
      if (!note) {
        document.body.classList.remove('sj-note-edit', 'sj-note-fmt');
        closeStyleSheet();
        noteModeId = null;
        if (EDIT_BAR) EDIT_BAR.classList.add('hidden');
        mountTitle();
        return;
      }
      updateMetaCat(note);
      mountMeta();
      const ebStar = EDIT_BAR && EDIT_BAR.querySelector('[data-act="star"]');
      if (ebStar) ebStar.classList.toggle('on', !!note.starred);
      /* 桌面端沿用原来的双栏编辑界面，不进这套形态 */
      if (!NARROW()) {
        setKbManual(false);
        document.body.classList.remove('sj-note-edit', 'sj-note-fmt');
        const ti = $('#titleInput'); if (ti) { ti.readOnly = false; ti.style.opacity = ''; }
        const rp = $('#richPane'); if (rp) rp.setAttribute('contenteditable', 'true');
        if (EDIT_BAR) EDIT_BAR.classList.add('hidden');
        mountTitle();
        noteModeId = String(note.id);
        return;
      }
      const id = String(note.id);
      if (id !== noteModeId) {
        noteModeId = id;
        /* 换了一条笔记：阅读态正文回到顶部，大标题重新露出来 */
        document.body.classList.remove('sj-head-solid');
        if (BODY_BOX) BODY_BOX.scrollTop = 0;
        const ti0 = $('#titleInput');
        if (ti0) ti0.style.opacity = '';
        /* 新建的草稿直接进编辑（要马上写字，标题由 openNote 聚焦）；
           已有笔记先进阅读态，不主动抢焦点。 */
        setNoteMode(note === draftNote || id === String(DRAFT_ID) ? 'edit' : 'read', null, { focus: false });
      }
      syncCollapse();
    }
    if (NOTE_HEAD) NOTE_HEAD.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const a = b.dataset.act;
      if (a === 'nh-back') { hideMoreMenu(); closeEditor(); return; }
      if (a === 'nh-done') { setNoteMode('read'); return; }
      /* 撤销 / 重做：正文只有富文本一个编辑面，统一走 execCommand。
         用静默聚焦，撤销一下不该把输入法顶出来。 */
      const target = $('#richPane');
      if (!target) return;
      focusQuiet(target);
      try { document.execCommand(a === 'nh-undo' ? 'undo' : 'redo'); } catch (_) {}
    });
    if (EDIT_BAR) EDIT_BAR.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const a = b.dataset.act;
      if (a === 'fmt') {
        /* 最左边那个 A：开关底部「样式」面板（原来是切桌面那条窄工具条，
           手机端那条太挤，照华为备忘录换成整块面板） */
        /* 还在等键盘收完（面板还没露头）：再点一下按取消算，别让它待会儿自己冒出来 */
        if (styleSheetPending()) {
          stopViewportQuiet();
          const fbtn = EDIT_BAR && EDIT_BAR.querySelector('[data-act="fmt"]');
          if (fbtn) fbtn.classList.remove('on');
          return;
        }
        if (styleSheetOpen()) closeStyleSheet();
        else openStyleSheet();
        return;
      }
      if (a === 'img') { const el = $('#imgBtn'); if (el) el.click(); return; }
      if (a === 'attach') { const el = $('#attachBtn'); if (el) el.click(); return; }
      /* 更多：用工具条自己那颗按钮当锚点（详情底栏这时候是隐藏的，不能用） */
      if (a === 'more') { openNoteMore(b, currentNote()); return; }
      /* 收藏：复用详情底栏那颗按钮的既有逻辑，不另写一份 */
      const proxy = DETAIL && DETAIL.querySelector(`[data-act="${a}"]`);
      if (proxy) { proxy.click(); setTimeout(syncNoteMode, 0); }
    });
    /* 点正文 = 要写字：这时才唤起输入法。面板里调格式永远不唤起。
       （manual 策略下已聚焦的元素不会再触发 focus，必须先 blur 一次） */
    function typingFocus(point) {
      const rp = $('#richPane');
      if (!rp) return;
      focusTyping(rp);
      if (point) caretTo(point.x, point.y);
    }
    /* 阅读态点正文任意位置 → 进编辑态，并把光标落到点击处；
       编辑态点图片 → 选中并弹出图片操作条，点别处收起。 */
    if (BODY_BOX) BODY_BOX.addEventListener('click', (e) => {
      if (!NARROW() || !currentNote()) return;
      const img = e.target.closest ? e.target.closest('#richPane img') : null;
      if (document.body.classList.contains('sj-note-edit')) {
        /* 待办列表：点左边那个方框打勾 / 取消勾，点文字仍然是正常放光标 */
        const li = e.target.closest ? e.target.closest('#richPane ul.sj-task > li') : null;
        if (li) {
          const dx = e.clientX - li.getBoundingClientRect().left;
          if (dx >= 0 && dx <= 26) {
            e.preventDefault();
            li.classList.toggle('done');
            onRichInput();
            return;
          }
        }
        const inRich = img && img.closest('#richPane') ? img : null;
        if (inRich) { e.preventDefault(); selectImg(inRich); return; }
        clearImgSel();
        /* Markdown 源码框自带原生键盘行为，交给它自己处理 */
        /* 样式面板开着时点正文 = 只挪光标、不弹输入法：
           面板留着继续调格式，光标竖线看得见，能确认自己在改哪一行。
           想打字就先点 A 或 × 收起面板（收起后才唤起键盘）。 */
        if (styleSheetOpen()) {
          const rp = $('#richPane');
          if (rp) {
            focusQuiet(rp);
            caretTo(e.clientX, e.clientY);
            revealSelection(); refreshCaret();
          }
          return;
        }
        typingFocus({ x: e.clientX, y: e.clientY });
        return;
      }
      /* 阅读态点图片：同样进编辑，并把同一张图选中，省得再点一次 */
      let idx = -1;
      if (img) {
        const pane = img.closest('#richPane');
        if (pane) idx = Array.prototype.indexOf.call(pane.querySelectorAll('img'), img);
      }
      setNoteMode('edit', { x: e.clientX, y: e.clientY });
      if (idx >= 0) setTimeout(() => {
        const again = BODY_BOX.querySelectorAll('#richPane img')[idx];
        if (again) selectImg(again);
      }, 0);
    });
    /* 阅读态点标题 → 进编辑态并聚焦标题 */
    const TI = $('#titleInput');
    if (TI) {
      TI.addEventListener('click', () => {
        if (!NARROW() || !currentNote()) return;
        if (document.body.classList.contains('sj-note-edit')) return;
        setNoteMode('edit');
        setTimeout(() => TI.focus(), 0);
      });
    }

    /* ---- 右上角四点菜单：顶栏收起后的设置/工具入口 ----
       全部 click 现有按钮，不新建数据链路；开关时清自动弹回标记无关，
       只管自己这一层的显示。 */
    const MORE = $('#sjMoreBtn'), MENU = $('#sjMoreMenu');
    function hideMoreMenu() {
      if (MENU) MENU.classList.add('hidden');
      if (MORE) MORE.classList.remove('on');
    }
    window.SJHideMoreMenu = hideMoreMenu;
    const MORE_ROWS = [
      { act: 'tree', label: '目录分类', icon: '<svg viewBox="0 0 24 24" class="ico"><path d="M4 6h16M4 12h16M4 18h16"/></svg>' },
      { act: 'batch', label: '批量整理', icon: '<svg viewBox="0 0 24 24" class="ico"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.4 12.4l2.6 2.6 4.6-5.2"/></svg>' },
      { act: 'sort', label: '排序方式', icon: '<svg viewBox="0 0 24 24" class="ico"><path d="M4 7h10M4 12h7M4 17h4M17 6v12M14 15l3 3 3-3"/></svg>', hint: '点开选' },
      { act: 'sync', label: '同步到云端', icon: '<svg viewBox="0 0 24 24" class="ico"><path d="M20 12a8 8 0 0 0-13.7-5.7"/><path d="M4 12a8 8 0 0 0 13.7 5.7"/></svg>' },
      { act: 'io', label: '导入 / 导出', icon: '<svg viewBox="0 0 24 24" class="ico"><path d="M12 3v12M8.5 9.5 12 13l3.5-3.5M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>' },
      { act: 'theme', label: '切换主题', icon: '<svg viewBox="0 0 24 24" class="ico"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>' },
    ];
    function renderMoreMenu() {
      if (!MENU) return;
      MENU.innerHTML = MORE_ROWS.map((r) =>
        `<button type="button" class="sj-more-row" data-act="${r.act}">${r.icon}<span>${r.label}</span>`
        + (r.hint ? `<span class="sj-more-n">${r.hint}</span>` : '') + '</button>').join('');
    }
    function doMore(act) {
      hideMoreMenu();
      if (act === 'tree') { hideCatSheet(); openDrawer('tree'); }
      else if (act === 'batch') {
        hideCatSheet();
        const b = $('#sjBatchBtn'); if (b) b.click();
      } else if (act === 'sort') {
        hideCatSheet();
        let cur = 'updated';
        try { cur = localStorage.getItem('sj_sort_v1') || 'updated'; } catch (_) {}
        showCtx((MORE ? MORE.getBoundingClientRect().left : 180) - 150,
                (MORE ? MORE.getBoundingClientRect().bottom : 56) + 4, [
          { label: '按更新时间' + (cur === 'updated' ? ' ✓' : ''), icon: I.clock,
            onClick: () => { try { localStorage.setItem('sj_sort_v1', 'updated'); } catch (_) {} const s = $('#sjSortSel'); if (s) s.value = 'updated'; renderList(); } },
          { label: '按创建时间' + (cur === 'created' ? ' ✓' : ''), icon: I.clock,
            onClick: () => { try { localStorage.setItem('sj_sort_v1', 'created'); } catch (_) {} const s = $('#sjSortSel'); if (s) s.value = 'created'; renderList(); } },
          { label: '按标题' + (cur === 'title' ? ' ✓' : ''), icon: I.fileText || I.folder,
            onClick: () => { try { localStorage.setItem('sj_sort_v1', 'title'); } catch (_) {} const s = $('#sjSortSel'); if (s) s.value = 'title'; renderList(); } },
        ]);
      } else if (act === 'sync') { if (window.SJSync) window.SJSync.open(); }
      else if (act === 'io') {
        const r = { right: (MORE ? MORE.getBoundingClientRect().right : 120),
                    top: (MORE ? MORE.getBoundingClientRect().bottom : 56) };
        showCtx(r.right - 168, r.top + 4, [
          { label: '导入备份', icon: I.download, onClick: () => { const el = $('#importBtn'); if (el) el.click(); } },
          { label: '导出备份', icon: I.download, onClick: () => { const el = $('#exportBtn'); if (el) el.click(); } },
          { label: '导出 Markdown', icon: I.download, onClick: () => { const el = $('#sjPlusToolsBtn'); if (el) el.click(); } },
        ]);
      } else if (act === 'theme') { const el = $('#themeBtn'); if (el) el.click(); }
    }
    if (MORE) MORE.addEventListener('click', (e) => {
      e.stopPropagation();
      if (MENU && MENU.classList.contains('hidden')) { renderMoreMenu(); MENU.classList.remove('hidden'); MORE.classList.add('on'); }
      else hideMoreMenu();
    });
    if (MENU) MENU.addEventListener('click', (e) => {
      const row = e.target.closest('[data-act]');
      if (row) doMore(row.dataset.act);
    });
    document.addEventListener('pointerdown', (e) => {
      if (!MENU || MENU.classList.contains('hidden')) return;
      if (e.target.closest('#sjMoreMenu') || e.target.closest('#sjMoreBtn')) return;
      hideMoreMenu();
    }, true);

    /* ---- 大标题随内容上滚收起（首页 + 阅读态） ----
       首页：整条列表栏是滚动容器，大标题/条数/搜索框跟着列表一起滚走；
       滚到顶之后那条 52px 的细栏淡入接管，标题顺带缩一点（scale，纯合成不动布局）。
       阅读态：正文顶部的大标题滚过去以后，顶栏的小标题淡入、下面补一条细线。
       两处都只改 transform / opacity，滚动里不会有任何重排。 */
    let homeRaf = 0, readRaf = 0;
    function placeHome() {
      homeRaf = 0;
      const pane = document.querySelector('.list-pane');
      const bar = $('#sjHomeBar'), title = $('#sjCatTitle'), head = $('#sjHomeHead');
      if (!pane || !bar || !NARROW() || document.body.classList.contains('sj-note-open')) return;
      /* 回到列表就说明详情已经关了：把阅读态那条细线一并撤掉 */
      document.body.classList.remove('sj-head-solid');
      /* 标题自己钉在顶部（CSS sticky），这里只负责「原地缩小」。
         缩到位的距离 = 条数 / 搜索框那一整段的高度：等它们全滑到顶栏背后，
         标题正好收到最终字号，之后一直贴着顶部不动。 */
      const hh = head ? head.offsetHeight : 85;
      const y = pane.scrollTop;
      const p = Math.min(1, Math.max(0, y / Math.max(56, hh)));
      if (title) title.style.transform = p > 0 ? 'scale(' + (1 - 0.34 * p).toFixed(3) + ')' : '';
      /* 一开始滚动就给顶栏下沿补一条软过渡，切掉的残边不会变成一条硬灰线 */
      bar.classList.toggle('scrolled', p > 0.02);
      /* 收起到位才出底边细线 */
      bar.classList.toggle('show', p > 0.9);
    }
    function placeRead() {
      readRaf = 0;
      const read = NARROW() && BODY_BOX
        && document.body.classList.contains('sj-note-open')
        && !document.body.classList.contains('sj-note-edit');
      const ti = $('#titleInput');
      if (!read) {
        document.body.classList.remove('sj-head-solid');
        if (ti) { ti.style.transform = ''; ti.style.opacity = ''; }
        return;
      }
      /* 阅读态持续缓存 hero 高度：进编辑态后 hero 变 display:none 读不到高度，
         回阅读态换算滚动位置要靠它，否则正文会跳一下。 */
      if (READ_HERO && READ_HERO.offsetHeight) lastReadHeroH = READ_HERO.offsetHeight;
      /* 华为备忘录的方式：正文顶部的大标题跟着正文一起滚出屏幕，等它快到顶栏时，
         顶栏返回箭头旁的小标题才淡入接管。按「大标题底边离顶栏底边还有多远」算，
         标题一两行还是三行都对得上，两份标题也不会同时叠在屏幕上。 */
      if (!NOTE_HEAD || !READ_TITLE) return;
      const gap = READ_TITLE.getBoundingClientRect().bottom - NOTE_HEAD.getBoundingClientRect().bottom;
      const p = Math.min(1, Math.max(0, (4 - gap) / 24));
      if (ti) ti.style.opacity = p > 0.02 ? p.toFixed(2) : '';
      /* 大标题滚过去后才给顶栏补实心背景遮住滚过的正文 */
      document.body.classList.toggle('sj-head-solid', p > 0.95);
    }
    /* 形态切换、开新笔记、改分类之后由脚本主动调一次，不必等滚动事件 */
    function syncCollapse() { placeHome(); placeRead(); }
    function initCollapse() {
      window.SJSyncCollapse = syncCollapse;
      /* 跨 980px 边界时把只在窄屏存在的东西重新归位：
         标题输入框、分类/日期、大标题收起状态、阅读态顶栏细线 */
      window.SJRemount = () => {
        mountTitle();
        mountMeta();
        document.body.classList.remove('sj-head-solid');
        const ti = $('#titleInput');
        if (ti && !NARROW()) { ti.style.opacity = ''; ti.style.transform = ''; }
        syncCollapse();
      };
      const pane = document.querySelector('.list-pane');
      if (pane) pane.addEventListener('scroll', () => { if (!homeRaf) homeRaf = requestAnimationFrame(placeHome); }, { passive: true });
      if (BODY_BOX) BODY_BOX.addEventListener('scroll', () => { if (!readRaf) readRaf = requestAnimationFrame(placeRead); }, { passive: true });
      window.addEventListener('resize', () => { placeHome(); placeRead(); });
    }

    /* 首页大标题跟随列表标题与条数 */
    function syncHomeHead() {
      const t = $('#sjCatTitleText'), c = $('#sjHomeCount');
      if (t) t.textContent = ($('#listTitle').textContent || '全部笔记');
      if (c) c.textContent = $('#listCount').textContent ? ($('#listCount').textContent + '笔记') : '暂无笔记';
      const star = $('#starBtn');
      if (DETAIL && star) {
        const sb = DETAIL.querySelector('[data-act="star"]');
        if (sb) sb.classList.toggle('on', !!(currentNote() && currentNote().starred));
      }
    }
    window.SJSyncHomeHead = syncHomeHead;
    initCollapse();
    syncHome();
  })();

  /* 手机端为本地优先：不自动与云端通信，只有在「同步」面板里手动点
     上传 / 拉取才会联网，避免任何动作都打云、费流量。 */

  window.SJBoot = boot;
  window.SJSaveNow = saveNow;
  /* 供 sjplus.js（回收站 / 回顾 / 整库导出）调用 */
  window.SJRefresh = () => { renderTree(); renderList(); };
  window.SJOpenNote = (id) => openNote(id);
  /* -70：草稿没有真实 id，不能把它当 keepId 交给同步 / 重载流程。 */
  window.SJCurrentNoteId = () => (state.selNote === DRAFT_ID ? '' : (state.selNote || ''));
  /* v1.8.0：暴露给增强模块（全文检索 / 反向链接 / 冲突 / 加密） */
  window.SJState = state;
  window.SJNotes = () => state.notes;
  window.SJPlain = plainText;
  /* -72：给 .vault 加密备份与批量导出用的通用文件交付口。
     完全复用 -67 已真机验证的三级通道，不新造下载链路：
     系统分享面板（WebAPK 首选）→ SW 代理隐藏 iframe（Chromium 页内）→ blob 锚点。
     返回 'ok' / 'share' / 'cancel' / ''，调用方据此给如实反馈。 */
  window.SJSaveBlobFile = async (blob, name) => {
    if (!blob || !blob.size) return '';
    let obj = '';
    try { obj = URL.createObjectURL(blob); } catch (_) {}
    const revoke = () => { if (obj) setTimeout(() => { try { URL.revokeObjectURL(obj); } catch (_) {} }, 60000); };
    try {
      if (obj) {
        const st = await saveInApp(obj, name, blob.type || 'application/octet-stream');
        if (st) { revoke(); return st; }
      }
      if ((await saveViaSwProxy(blob, name)) === 'ok') { revoke(); return 'ok'; }
      const r = saveBlobAnchor(blob, name);
      revoke();
      return r;
    } catch (_) { revoke(); return ''; }
  };
  /* v1.8.0：增强模块（冲突 / 加密）用到的弹窗助手 */
  window.openModal = openModal;
  window.closeModal = closeModal;
  /* -72：崩溃恢复提示排到首屏之后，不与启动渲染抢 DOM。 */
  setTimeout(offerEditDraft, 600);
  boot().catch((e) => console.error('启动失败', e));
})();
