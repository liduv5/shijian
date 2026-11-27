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
    /* 行内代码：小胶囊包住一对尖括号 —— 和上面「裸尖括号」的代码块图标区分开 */
    codeInline: '<svg viewBox="0 0 24 24" class="ico"><rect x="2.6" y="6" width="18.8" height="12" rx="3.4"/><path d="M10.2 10.2l-1.9 1.9L10.2 14M13.8 10.2l1.9 1.9L13.8 14"/></svg>',
    bold: '<svg viewBox="0 0 24 24" class="ico"><path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"/></svg>',
    italic: '<svg viewBox="0 0 24 24" class="ico"><path d="M10 4h8M6 20h8M14.5 4l-3 16"/></svg>',
    strike: '<svg viewBox="0 0 24 24" class="ico"><path d="M4 12h16M8 8a4 3 0 0 1 8 0M8 16a4 3 0 0 0 8 0"/></svg>',
    underline: '<svg viewBox="0 0 24 24" class="ico"><path d="M7 4v6a5 5 0 0 0 10 0V4M6 20h12"/></svg>',
    alignLeft: '<svg viewBox="0 0 24 24" class="ico"><path d="M4 6h16M4 11h10M4 16h13"/></svg>',
    alignCenter: '<svg viewBox="0 0 24 24" class="ico"><path d="M4 6h16M7 11h10M5.5 16h13"/></svg>',
    alignRight: '<svg viewBox="0 0 24 24" class="ico"><path d="M4 6h16M10 11h10M7 16h13"/></svg>',
    alignJustify: '<svg viewBox="0 0 24 24" class="ico"><path d="M4 6h16M4 11h16M4 16h16"/></svg>',
    indentInc: '<svg viewBox="0 0 24 24" class="ico"><path d="M10 7h10M10 12h10M10 17h10"/><path d="M3 9l4.5 3-4.5 3z"/></svg>',
    indentDec: '<svg viewBox="0 0 24 24" class="ico"><path d="M10 7h10M10 12h10M10 17h10"/><path d="M7.5 9l-4.5 3 4.5 3z"/></svg>',
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
    /* 正文行距，单位 px（原来存倍数 1.8/1.5/1.3，老值乘 16px 换算过来） */
    richLh: (function () {
      const v = parseFloat(localStorage.getItem('sj_rich_lh'));
      if (!isFinite(v)) return 28;
      if (v < 3) return Math.min(64, Math.max(14, Math.round(v * 16 / 2) * 2));
      return Math.min(64, Math.max(14, Math.round(v / 2) * 2));
    })(),
    /* 正文基准字号，单位 px。0 = 跟随默认（编辑面 16、阅读态 17，见 CSS 兜底）。
       阅读态那颗 Aa 写的就是这个值，所以手机上定过的习惯不会带过来——
       两台设备各存各的（localStorage 本来就不互通）。 */
    richFs: (function () {
      const v = parseFloat(localStorage.getItem('sj_rich_fs'));
      return isFinite(v) && v >= 10 ? Math.round(v) : 0;
    })(),
    dirty: false,
  };

  /* ---------------------------------------------------------- 状态收口
     2026-11-26：以前 state 有 50 处直接赋值，散在几十个事件处理里，
     谁改了什么、改完要不要重绘全靠人记 —— 「缩进改完没标脏」「换了块
     工具条不刷新」都是这么来的。现在统一走 setState：
       · 只有一个赋值入口，改哪几个字段一眼可见
       · 返回值是「真的变了」的字段名，调用方可以据此决定重绘
     只做赋值，不隐式触发渲染：重绘时机差异太大（有的要整页、有的
     只刷列表），隐式重绘会让时序更难猜。要刷工具条就显式调 syncUI()。 */
  function setState(patch) {
    const changed = [];
    for (const k of Object.keys(patch)) {
      if (state[k] !== patch[k]) changed.push(k);
      state[k] = patch[k];
    }
    return changed;
  }

  /* 翻「有未保存改动」这个开关。别和下面那个同名的业务函数搞混：
     markDirty() 是「按内容快照判定到底改没改」的重逻辑（会写草稿副本、
     改保存状态文案），本函数只动 flag。之所以必须收口：state.dirty 牵动
     自动保存、离开提醒和标题前的圆点，散着写最容易漏。 */
  function setDirty(on = true) {
    state.dirty = !!on;
  }

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
    setState({ selNote: null });
    setDirty(false);
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
          setState({ selNote: d.id });
          setDirty(false);
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
          setDirty(true);
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

  /* ---------------------------------------------------------- API */
  async function api(path, { method = 'GET', body } = {}) {
    path = await guardDraftPath(path, method);
    const res = await fetch(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      let msg = '请求失败';
      try { msg = (await res.json()).error || msg; } catch (_) {}
      throw new Error(msg);
    }
    return res.status === 204 ? null : res.json();
  }

  /* ---------------------------------------------------------- Toast */
  let toastTimer;
  function toast(msg, ms) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms || 2000);
  }

  /* ---------------------------------------------------------- Markdown */
  marked.setOptions({ gfm: true, breaks: false, headerIds: false, mangle: false });

  /* Turndown 的配置（标题 atx / 列表用 - / 围栏代码 / * 作斜体）和
     「保留图片宽度」那条规则都在 richtext-core.js 里，与云端同一份。
     这里只做装配：缺插件时内核会退回基础转换，不会让整页挂掉。 */
  const td = window.SJRTCore.createTurndown(
    window.TurndownService,
    window.turndownPluginGfm
  );

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function renderMarkdown(md) {
    let html = marked.parse(md || '');
    html = DOMPurify.sanitize(html, { ADD_ATTR: ['target', 'rel'] });
    return html;
  }
  /* sync.js 在本文件之后加载，需要用到 Markdown 渲染（云端旧 md 行
     拉回本地时要转成富文本），这里挂到全局供它调用。 */
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
      <button type="button" data-w="crop" class="is-ghost" title="裁剪图片">裁剪</button>
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
      if (v === 'crop') return openImgCrop();
      if (v === 'reset') { applyImgWidth(null); range.value = 100; pctText.textContent = '100%'; return; }
      const n = parseInt(v, 10);
      range.value = n; pctText.textContent = n + '%';
      applyImgWidth(n);
    });
    range.addEventListener('input', () => {
      pctText.textContent = range.value + '%';
      liveImgWidth(parseInt(range.value, 10));   // 拖动时只改视觉
    });
    range.addEventListener('change', () => {
      applyImgWidth(parseInt(range.value, 10));  // 松手才落盘
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

  /* ---------------------------------------------------------- 图片裁剪
     从宽度条的「裁剪」进入：拖选区 → canvas 重绘 → 新 data URL 替换 <img src>，
     再按当前模式落盘。选区坐标按「显示矩形」存，导出时乘 natural/display 换回原始像素；
     跨域图 fetch 不到就明确提示，绝不把污染画布导出成坏图。 */
  let cropUI = null, cropSt = null;
  const CROP_RATIOS = [
    { key: 'free', label: '自由', r: 0 },
    { key: 'origin', label: '原图', r: 0 },
    { key: '1', label: '1:1', r: 1 },
    { key: '43', label: '4:3', r: 4 / 3 },
    { key: '169', label: '16:9', r: 16 / 9 },
  ];

  function cropEnsureUI() {
    if (cropUI) return cropUI;
    const el = document.createElement('div');
    el.className = 'crop-ui hidden';
    el.innerHTML = `
      <div class="crop-mask"></div>
      <div class="crop-dialog">
        <div class="crop-head"><span>裁剪图片</span><button type="button" class="crop-x" data-act="cancel" aria-label="关闭">×</button></div>
        <div class="crop-stage"><img class="crop-img" alt=""><div class="crop-sel">
          <i class="crop-third crop-third-v" style="left:33.333%"></i><i class="crop-third crop-third-h" style="top:33.333%"></i>
          <i class="crop-third crop-third-v" style="left:66.666%"></i><i class="crop-third crop-third-h" style="top:66.666%"></i>
          <i class="crop-h" data-h="nw"></i><i class="crop-h" data-h="n"></i><i class="crop-h" data-h="ne"></i>
          <i class="crop-h" data-h="e"></i><i class="crop-h" data-h="se"></i><i class="crop-h" data-h="s"></i>
          <i class="crop-h" data-h="sw"></i><i class="crop-h" data-h="w"></i>
        </div></div>
        <div class="crop-bar">
          <div class="crop-ratios">${CROP_RATIOS.map((x) => `<button type="button" data-ratio="${x.key}"${x.key === 'free' ? ' class="on"' : ''}>${x.label}</button>`).join('')}</div>
          <span class="crop-size"></span>
        </div>
        <div class="crop-foot">
          <button type="button" data-act="reset">重置</button>
          <button type="button" data-act="cancel">取消</button>
          <button type="button" class="primary" data-act="done">完成</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    cropUI = el;

    /* 裁剪层内的点击不冒泡到 document —— 否则会触发「点空白关宽度条」，
       把 imgEl/imgMode 清空，完成时就没法按原模式落盘。 */
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const r = e.target.closest('[data-ratio]');
      if (r) { cropApplyRatio(r.dataset.ratio); return; }
      const a = e.target.closest('[data-act]');
      if (!a) return;
      if (a.dataset.act === 'cancel') cropClose();
      else if (a.dataset.act === 'reset') cropReset();
      else if (a.dataset.act === 'done') cropDone();
    });
    el.querySelector('.crop-mask').addEventListener('click', cropClose);
    const sel = el.querySelector('.crop-sel');
    sel.addEventListener('pointerdown', (e) => {
      if (!cropSt) return;
      const h = e.target.closest('.crop-h');
      cropSt.drag = { dir: h ? h.dataset.h : 'move', sx: e.clientX, sy: e.clientY, orig: { ...cropSt.sel } };
      try { sel.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
      e.stopPropagation();
    });
    sel.addEventListener('pointermove', (e) => {
      if (!cropSt || !cropSt.drag) return;
      cropDrag(e);
      e.preventDefault();
    });
    sel.addEventListener('pointerup', () => { if (cropSt) cropSt.drag = null; });
    sel.addEventListener('pointercancel', () => { if (cropSt) cropSt.drag = null; });
    document.addEventListener('keydown', (e) => {
      if (cropUI && !cropUI.classList.contains('hidden') && e.key === 'Escape') { e.stopPropagation(); cropClose(); }
    }, true);
    return el;
  }

  async function cropFetchDataUrl(src) {
    if (/^(data|blob):/i.test(src)) return src;
    try {
      const r = await fetch(src, { credentials: 'include' });
      if (!r.ok) return '';
      const b = await r.blob();
      return await new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result);
        fr.onerror = rej;
        fr.readAsDataURL(b);
      });
    } catch (_) { return ''; }
  }

  function cropClose() {
    if (cropUI) cropUI.classList.add('hidden');
    document.body.classList.remove('crop-open');
    cropSt = null;
  }

  function cropPaint() {
    if (!cropSt) return;
    const s = cropSt, el = cropUI.querySelector('.crop-sel');
    el.style.left = s.sel.x + 'px'; el.style.top = s.sel.y + 'px';
    el.style.width = s.sel.w + 'px'; el.style.height = s.sel.h + 'px';
    const f = s.nat.w / s.disp.w;
    cropUI.querySelector('.crop-size').textContent =
      Math.max(1, Math.round(s.sel.w * f)) + ' × ' + Math.max(1, Math.round(s.sel.h * f)) + ' px';
  }

  function cropClamp() {
    if (!cropSt) return;
    const d = cropSt.disp, s = cropSt.sel;
    s.w = Math.max(24, Math.min(d.w, s.w));
    s.h = Math.max(24, Math.min(d.h, s.h));
    s.x = Math.max(0, Math.min(d.w - s.w, s.x));
    s.y = Math.max(0, Math.min(d.h - s.h, s.y));
  }

  function cropRatioOf(key) {
    if (key === 'free') return 0;
    if (key === 'origin') return cropSt.nat.w / cropSt.nat.h || 0;
    const hit = CROP_RATIOS.find((x) => x.key === key);
    return hit ? hit.r : 0;
  }

  function cropApplyRatio(key) {
    if (!cropSt) return;
    cropSt.ratioKey = key;
    cropSt.ratio = cropRatioOf(key);
    cropUI.querySelectorAll('[data-ratio]').forEach((b) => b.classList.toggle('on', b.dataset.ratio === key));
    if (cropSt.ratio) {
      const c = { x: cropSt.sel.x + cropSt.sel.w / 2, y: cropSt.sel.y + cropSt.sel.h / 2 };
      let w = cropSt.sel.w, h = w / cropSt.ratio;
      if (h > cropSt.disp.h) { h = cropSt.disp.h; w = h * cropSt.ratio; }
      if (w > cropSt.disp.w) { w = cropSt.disp.w; h = w / cropSt.ratio; }
      cropSt.sel = { x: c.x - w / 2, y: c.y - h / 2, w, h };
      cropClamp();
    }
    cropPaint();
  }

  function cropReset() {
    if (!cropSt) return;
    const d = cropSt.disp;
    cropSt.sel = { x: d.w * 0.1, y: d.h * 0.1, w: d.w * 0.8, h: d.h * 0.8 };
    cropSt.ratio = 0; cropSt.ratioKey = 'free';
    cropUI.querySelectorAll('[data-ratio]').forEach((b) => b.classList.toggle('on', b.dataset.ratio === 'free'));
    cropPaint();
  }

  function cropDrag(e) {
    const t = cropSt.drag, o = t.orig, dir = t.dir;
    const dx = e.clientX - t.sx, dy = e.clientY - t.sy;
    let { x, y, w, h } = o;
    const min = 24;
    if (dir === 'move') {
      x = o.x + dx; y = o.y + dy;
    } else {
      if (dir.includes('w')) { x = o.x + dx; w = o.w - dx; }
      if (dir.includes('e')) { w = o.w + dx; }
      if (dir.includes('n')) { y = o.y + dy; h = o.h - dy; }
      if (dir.includes('s')) { h = o.h + dy; }
      if (w < min) { if (dir.includes('w')) x = o.x + o.w - min; w = min; }
      if (h < min) { if (dir.includes('n')) y = o.y + o.h - min; h = min; }
      if (cropSt.ratio) {
        if (dir.length === 2) {
          h = w / cropSt.ratio;
          if (dir.includes('n')) y = o.y + o.h - h;
        } else if (dir === 'e' || dir === 'w') {
          const cy = o.y + o.h / 2; h = w / cropSt.ratio; y = cy - h / 2;
        } else {
          const cx = o.x + o.w / 2; w = h * cropSt.ratio; x = cx - w / 2;
        }
      }
    }
    cropSt.sel = { x, y, w, h };
    cropClamp(); cropPaint();
  }

  function cropDone() {
    if (!cropSt) return;
    try {
      const s = cropSt, f = s.nat.w / s.disp.w;
      const sx = s.sel.x * f, sy = s.sel.y * f, sw = s.sel.w * f, sh = s.sel.h * f;
      const cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.round(sw)); cv.height = Math.max(1, Math.round(sh));
      const ctx = cv.getContext('2d');
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(s.img, sx, sy, sw, sh, 0, 0, cv.width, cv.height);
      const keepPng = /^data:image\/(png|webp)/i.test(s.src);
      const out = cv.toDataURL(keepPng ? 'image/png' : 'image/jpeg', 0.92);
      const target = s.target;
      target.src = out;
      if (s.mode === 'rich') onRichInput();
      cropClose();
      closeImgSizer();
      toast('图片已裁剪');
    } catch (err) {
      cropClose();
      toast('裁剪失败：' + (err && err.message ? err.message : '这张图不允许裁剪'));
    }
  }

  async function openImgCrop() {
    if (!imgEl) return;
    const src = imgEl.currentSrc || imgEl.src || imgEl.getAttribute('src') || '';
    if (!src) { toast('这张图还没有可用的地址'); return; }
    const ui = cropEnsureUI();
    cropClose();
    ui.classList.remove('hidden');
    document.body.classList.add('crop-open');
    const img = ui.querySelector('.crop-img');
    const usable = await cropFetchDataUrl(src);
    if (!usable && !/^(data|blob):/i.test(src)) {
      cropClose();
      toast('这张图来自外部站点，无法裁剪（可先下载到本地再插入）');
      return;
    }
    const finalSrc = usable || src;
    await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; img.src = finalSrc; });
    if (!img.naturalWidth) { cropClose(); toast('图片加载失败，无法裁剪'); return; }
    const dw = img.clientWidth || img.naturalWidth, dh = img.clientHeight || img.naturalHeight;
    cropSt = {
      target: imgEl, mode: imgMode, src: finalSrc, img,
      nat: { w: img.naturalWidth, h: img.naturalHeight },
      disp: { w: dw, h: dh }, sel: { x: dw * 0.1, y: dh * 0.1, w: dw * 0.8, h: dh * 0.8 },
      ratio: 0, ratioKey: 'free', drag: null,
    };
    ui.querySelectorAll('[data-ratio]').forEach((b) => b.classList.toggle('on', b.dataset.ratio === 'free'));
    cropPaint();
  }

  function bindImgResize(container, mode) {
    if (!container) return;
    container.addEventListener('click', (e) => {
      /* 阅读态点图是「看大图」，尺寸条是写操作（改 width 百分比）：
         这里直接放行，交给下面那条阅读态监听去开预览层。
         不这么分，一张图会同时弹出尺寸条和预览层，尺寸条被压在预览层下面
         只露半截（用户 2026-11-22 报的问题）。 */
      if (noteMode === 'read') return;
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
    /* 不再挂原生 title：浏览器那套黑框白底提示会在 1 秒后冒出来，跟我们自己
       的悬停卡片同时出现、互相压着。标题被裁掉时由卡片补全（见 showTreeMeta）。 */
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
        setState({ notes: state.notes.filter((n) => !doomed.has(n.id)) });
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
      /* 优先走全文检索（中文分词 + 相关度排序，支持 tag: 过滤、多词共现）。
         若 fts.js 未加载，回退到原来的子串匹配。 */
      if (window.SJFts) {
        const ids = window.SJFts.rank(state.search, state.notes);
        const map = new Map(state.notes.map((n) => [n.id, n]));
        const ranked = ids.map((id) => map.get(id)).filter(Boolean);
        /* 无命中就返回空，不再回退显示全库：与云端 notesInScope、以及目录树
           renderSearchResults 的「没有找到相关笔记」保持一致（原来只有这个分支会
           在搜不到时把全部笔记摊出来，且绕过了 sortNotes）。 */
        return ranked;
      }
      const terms = state.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
      list = list.filter((n) => {
        const hay = (n.title + ' ' + (n.tags || []).join(' ') + ' ' + plainText(n)).toLowerCase();
        return terms.every((t) => t.indexOf('tag:') === 0
          ? (n.tags || []).some((x) => String(x).toLowerCase().includes(t.slice(4)))
          : hay.includes(t));
      });
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
     点日期也弹分类选择器 —— 范围太大了。抽成函数是因为改完分类要就地重写这一行。
     三角用 SVG 不用 ▾ 字符：字符大小跟着字体走、9px 显得又小又飘，
     SVG 能按像素定尺寸，跟旁边的字对齐也更稳。 */
  const META_CARET = '<svg class="meta-caret" viewBox="0 0 24 24" aria-hidden="true">'
    + '<path d="M6 9.5l6 6 6-6"/></svg>';
  function metaInfoHTML(note) {
    const cat = catMap().get(note.categoryId);
    const name = escapeHtml(cat ? cat.name : '未分类');
    return `<button type="button" class="meta-cat${cat ? '' : ' is-empty'}" data-meta-cat="1" aria-label="修改分类">${name}${META_CARET}</button>`
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
        <div class="home-card-title">${n.starred ? I.starFill.replace('<svg', '<svg class="ico star"') : I.doc}<span>${escapeHtml(n.title || '无标题笔记')}</span></div>
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
        setState({ selCat: state.selCat === 'tag:' + tag ? 'all' : 'tag:' + tag });
        setState({ search: '' });
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
      /* 标签没有独立表，同名判定只能靠名字：忽略大小写与空白后相同就算
         同一个标签，直接复用已有写法，别让「工作 / 工作  / Work」在侧栏
         长成三个。归一规则与分类共用内核（cat-core.js 的 normTag）。 */
      const norm = (t) => (window.SJCats ? window.SJCats.normTag(t) : String(t).trim().toLowerCase());
      const dup = tags.find((t) => norm(t) === norm(value));
      if (dup) {
        toast(`已经有标签「${dup}」`);
      } else if (tags.length >= 10) {
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
      setState({ selCat: 'all' });
      renderTree();
      renderList();
    }
  }

  /* ---------------------------------------------------------- 标签管理
     标签本身是从笔记的 tags 派生出来的（没有独立的标签表），所以「改名 / 删除 /
     合并」本质都是批量修改相关笔记的 tags。改 tags 不写历史版本（服务端只在
     content/title/format 变化时才快照），不会污染版本记录。 */
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

  /* 只发 tags 字段，绝不覆盖正文（避免刚编辑但未保存的内容被服务端的旧值冲掉）。
     顺便按内核规整一遍：忽略大小写与空白去重、去空、最多 10 个 ——
     所有标签写入口（含批量合并）都走这里，规则只有一份。 */
  async function patchNoteTags(note, tags) {
    const seen = new Set();
    const next = [];
    for (const raw of tags) {
      const t = String(raw).trim();
      if (!t) continue;
      const k = window.SJCats ? window.SJCats.normTag(t) : t.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      next.push(t);
    }
    note.tags = next.slice(0, 10);
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
      setState({ selCat: 'tag:' + target });
    }
    return hit.length;
  }

  async function removeTagEverywhere(tag) {
    const hit = notesWithTag(tag);
    for (const n of hit) {
      await patchNoteTags(n, (n.tags || []).filter((t) => t !== tag));
    }
    if (state.selCat === 'tag:' + tag) setState({ selCat: 'all' });
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
      setState({ search: '' });
      const si = $('#searchInput');
      if (si) si.value = '';
      setState({ selCat: 'tag:' + t.name });
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
        id: DRAFT_ID, title: '', content: '', format: 'rich',
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

  /* ============================================================
     华为风笔记编辑：阅读态 / 编辑态双形态
     ------------------------------------------------------------
     电脑端之前打开笔记就是编辑器：顶栏一排图标 + 常驻工具条 +
     源码/预览/分屏三态。手机端是两态（先读后写），这一段把电脑端
     也改成同一套交互，交互外壳换了，数据格式（Markdown 源码 /
     富文本 HTML）和保存链路一个字没动。
       阅读态 —— 正文渲染出来读，大标题在正文顶部随内容上滚，
                 滚过顶栏后顶栏的小标题淡入接管；
       编辑态 —— 点正文进入，顶栏出现撤销/重做/完成，
                 格式工具条常驻在标题和分类下面（不再弹出）。
     ============================================================ */
  const NOTE_READ = 'sj-note-read';
  const NOTE_EDIT = 'sj-note-edit';
  const READ_HERO = $('#sjReadHero');
  const READ_TITLE = $('#sjReadTitle');
  const READ_META = $('#sjRhMeta');
  let noteMode = 'read';          /* read | edit */
  let noteModeId = null;           /* 当前处于哪种形态的是哪篇笔记 */

  /* 阅读态正文顶部的分类 + 日期。分类可点 → 沿用现有分类选择器 */
  function renderReadMeta(note) {
    if (!READ_META) return;
    if (!note) { READ_META.innerHTML = ''; return; }
    const cat = note.categoryId ? catMap().get(note.categoryId) : null;
    /* 阅读态只读：分类只是标签，不是按钮（用户 2026-11-22 要求）。
       换分类去编辑态点标题下那颗胶囊，这里不给 ▾、不绑点击。 */
    const catEl = document.createElement('span');
    catEl.className = 'sj-rh-cat is-label' + (cat ? '' : ' is-empty');
    catEl.textContent = cat ? cat.name : '未分类';
    const date = document.createElement('span');
    date.className = 'sj-rh-date';
    date.textContent = '创建于 ' + fmtDate(note.createdAt);
    READ_META.innerHTML = '';
    READ_META.appendChild(catEl);
    READ_META.appendChild(date);
    /* 阅读态原来把标签整行藏了（body.sj-note-read .tag-row 隐藏），
       大标题下面跟着一串只读标签，不做 × 也不给添加入口。 */
    (note.tags || []).forEach((t) => {
      const chip = document.createElement('span');
      chip.className = 'tag-chip is-ro';
      chip.textContent = t;
      READ_META.appendChild(chip);
    });
  }

  /* 顶栏小标题的接管：正文大标题滚到顶栏下方时淡入。
     进度按「大标题底边离顶栏还有多远」算，和手机端同一套算法：
     大标题还露着时小标题是透明的，大标题整个滚过去才淡入接管。 */
  function placeReadTitle() {
    const ti = $('#titleInput');
    if (!ti || !READ_HERO) return;
    if (noteMode !== 'read') { ti.style.opacity = ''; document.body.classList.remove('sj-head-solid'); return; }
    const hero = READ_HERO.getBoundingClientRect();
    const head = document.querySelector('.editor-head');
    const headBottom = head ? head.getBoundingClientRect().bottom : 0;
    const heroH = hero.height || 1;
    const p = Math.min(1, Math.max(0, (headBottom - hero.bottom) / Math.max(40, heroH)));
    ti.style.opacity = p > 0.05 ? p.toFixed(2) : '0';
    document.body.classList.toggle('sj-head-solid', p > 0.9);
  }

  /* 切形态。edit=true 进编辑态，false 回阅读态。
     两种形态共用同一套 DOM，只切 body 上的 class 和 contenteditable。
     noteMode 这个变量要跟着走：点图开大图、⌘B 加粗都靠它判形态，
     长期不赋值的话它就永远停在 'read'（2026-11-22 查出来的老坑）。 */
  function setNoteMode(edit, opts = {}) {
    const note = currentNote();
    if (!note) return;
    noteMode = edit ? 'edit' : 'read';
    if (edit) {
      document.body.classList.remove(NOTE_READ);
      document.body.classList.add(NOTE_EDIT);
      const rp = $('#richPane');
      if (rp) {
        rp.setAttribute('contenteditable', 'true');
        /* 进编辑态以当前正文为干净起点重建撤销栈 */
        richHistReset(rp.innerHTML);
      }
      /* 标题框在编辑态才可写；阅读态是只读的展示 */
      const ti = $('#titleInput');
      if (ti) { ti.readOnly = false; ti.style.opacity = ''; }
      document.body.classList.remove('sj-head-solid');
      if (opts.focus !== false) {
        setTimeout(() => {
          const t = $('#richPane');
          if (t) t.focus();
        }, 0);
      }
    } else {
      document.body.classList.remove(NOTE_EDIT);
      document.body.classList.add(NOTE_READ);
      const rp = $('#richPane');
      if (rp) rp.setAttribute('contenteditable', 'false');
      const ti = $('#titleInput');
      if (ti) ti.readOnly = true;
      /* 回阅读态时图片尺寸条不该留着：它是写操作的面板，
         留着会浮在正文上，再点图还会跟大图预览撞在一起 */
      closeImgSizer();
      placeReadTitle();
    }
    /* 附件面板跟着形态走：编辑态不留窄条，阅读态默认整块摊开。
       与手机端同一约定（用户要求阅读态能看到附件、点 ⌄ 才折成窄条）。 */
    if (edit) {
      if (attachStateOf() === 'collapsed') setAttachState('open');
    } else {
      setAttachState(attachHasAny() ? 'open' : 'hidden');
    }
  }

  /* 打开一篇笔记时同步形态：换笔记就重置成阅读态。 */
  function syncNoteMode(note) {
    const id = note ? String(note.id) : null;
    if (id !== noteModeId) {
      noteModeId = id;
      /* 换了一篇：先回到阅读态，滚动位置归零 */
      noteMode = 'read';
      document.body.classList.remove(NOTE_EDIT);
      document.body.classList.add(NOTE_READ);
      const ti = $('#titleInput');
      if (ti) ti.readOnly = true;
      const rp = $('#richPane');
      if (rp) rp.setAttribute('contenteditable', 'false');
      if (note) {
        const body = $('#editorBody');
        if (body) body.scrollTop = 0;
      }
    }
    if (READ_TITLE) READ_TITLE.textContent = note ? (String(note.title || '').trim() || '无标题笔记') : '';
    renderReadMeta(note);
    placeReadTitle();
  }


  /* 富文本插入表格：3×3 空表，占位符用不换行空格撑开单元格 */
  function insertRichTable() {
    const row = '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>';
    const html = '<table class="sj-table"><tbody>' + row + row + row + '</tbody></table><p><br></p>';
    exec('insertHTML', html);
  }

  /* 富文本下对齐/缩进必须 styleWithCSS=true，否则浏览器生成 align 属性
     或 <font color>，这些在净化那关会被抹掉，重开笔记就白调了。 */
  function cssCmd(cmd, val) {
    const pane = $('#richPane');
    if (!pane) return;
    prepareRange();
    try { document.execCommand('styleWithCSS', false, true); } catch (_) {}
    try { document.execCommand(cmd, false, val); } catch (_) {}
    onRichInput();
  }

  function openNote(id, { focusTitle = false } = {}) {
    /* 离开当前笔记：先把脏数据落盘，再切换选中项。所有打开笔记的路径
       （列表、搜索、双链、外部调用）都会经过这里，不用逐个补钩子。 */
    if (state.selNote && state.selNote !== id) void saveNow();
    /* -70：草稿只存在于内存，按哨兵取，别去 state.notes 里找。 */
    const note = id === DRAFT_ID ? draftNote : noteById(id);
    if (!note) return;
    setState({ selNote: id });
    /* 打开笔记时让左侧分类树定位到该笔记所在分类：展开其分类与祖先链，
       高亮由 renderTree 内的 treeActiveCat() 统一驱动（笔记只在自己的分类下高亮，
       而不在「全部笔记」伪节点下）。未分类笔记则展开「未分类」容器。 */
    if (id !== DRAFT_ID) {
      if (note.categoryId) expandChain(note.categoryId);
      else setOpen('uncat', true);
    }
    setDirty(false);
    savedSnapshot = snapshot(note);

    $('#emptyState').classList.add('hidden');
    $('#editorWrap').classList.remove('hidden');

    $('#titleInput').value = note.title || '';
    $('#starBtn').classList.toggle('on', !!note.starred);

    $('#richPane').innerHTML = noteHtml(note);
    decorate($('#richPane'));
    $('#richPane').classList.remove('hidden');
    richHistReset($('#richPane').innerHTML);

    $('#metaInfo').innerHTML = metaInfoHTML(note);
    setSaveState('', `已保存 ${new Date(note.updatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`);

    applyFormat();
    renderToolbar();
    renderAttachments();
    renderNoteTags();
    renderList();
    renderTree();
    if (window.SJBacklinks) window.SJBacklinks.refresh(note);
    updateAttachBadge();
    wordCount();

    /* 换笔记：附件面板回到整块摊开，折叠状态不带到下一篇 */
    setAttachState(note.attachments && note.attachments.length ? 'open' : 'hidden');

    /* 形态同步：已有笔记进阅读态（先读后写），新建草稿直接进编辑态。
       正文只有富文本一个编辑面，Markdown 笔记进来时已经是渲染好的 HTML。 */
    syncNoteMode(note);
    if (id === DRAFT_ID) {
      setNoteMode(true, { focus: false });
    } else {
      setNoteMode(false);
    }

    if (focusTitle) {
      $('#titleInput').focus();
      $('#titleInput').select();
    }
  }

  /* ---- 双形态的事件绑定 ---- */

  /* 进编辑态只走顶栏那颗铅笔（用户 2026-11-22 定：阅读就只是阅读）。
     原来这里是「点正文 → 进编辑」，配了位移 4px / 有选区 / 点链接三道守卫；
     改成显式入口后整条拆掉 —— 阅读态点正文只剩原生行为：拖选、复制、
     点链接都不会把页面拉进可写状态，也不会退出时白落一次盘。 */
  const READ_EDIT_BTN = $('#readEditBtn');
  if (READ_EDIT_BTN) {
    READ_EDIT_BTN.addEventListener('click', () => {
      if (!currentNote()) return;
      setNoteMode(true);
    });
  }

  /* ---- 阅读态「Aa」：字号 + 行距 ----
     只写本机显示偏好（--sj-rich-fs / --sj-rich-lh），笔记内容一个字节都不动，
     所以纯阅读态也能开。工具条里那颗行距下拉改的是同一个值，两边永远一致。 */
  const AA_BTN = $('#readAaBtn'), AA_POP = $('#readAaPop');
  function aaSync() {
    const fs = $('#readAaFs'), lh = $('#readAaLh');
    if (fs) { fs.value = curFs(); }
    if (lh) { lh.min = lhMin(); lh.value = clampLh(state.richLh); }
    const fv = $('#readAaFsVal'), lv = $('#readAaLhVal');
    if (fv) fv.textContent = String(curFs());
    if (lv) lv.textContent = String(clampLh(state.richLh));
  }
  function aaClose() {
    if (!AA_POP) return;
    AA_POP.classList.add('hidden');
    if (AA_BTN) AA_BTN.classList.remove('on');
  }
  function aaToggle() {
    if (!AA_POP) return;
    if (AA_POP.classList.contains('hidden')) {
      aaSync();
      AA_POP.classList.remove('hidden');
      if (AA_BTN) AA_BTN.classList.add('on');
    } else aaClose();
  }
  if (AA_BTN) AA_BTN.addEventListener('click', (e) => { e.stopPropagation(); aaToggle(); });
  if (AA_POP) AA_POP.addEventListener('click', (e) => e.stopPropagation());
  document.addEventListener('click', () => aaClose());
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') aaClose(); });
  const AA_FS = $('#readAaFs'), AA_LH = $('#readAaLh');
  if (AA_FS) AA_FS.addEventListener('input', () => {
    setState({ richFs: clampFs(AA_FS.value) });
    applyRichFs();
    try { localStorage.setItem('sj_rich_fs', String(state.richFs)); } catch (_) {}
    aaSync();
  });
  if (AA_LH) AA_LH.addEventListener('input', () => {
    setState({ richLh: clampLh(AA_LH.value) });
    applyRichLh();
    try { localStorage.setItem('sj_rich_lh', String(state.richLh)); } catch (_) {}
    syncLhPicker();
    aaSync();
  });
  const AA_RESET = $('#readAaReset');
  if (AA_RESET) AA_RESET.addEventListener('click', () => {
    setState({ richFs: 0 });
    try { localStorage.removeItem('sj_rich_fs'); } catch (_) {}
    applyRichFs();
    setState({ richLh: 28 });
    try { localStorage.setItem('sj_rich_lh', '28'); } catch (_) {}
    applyRichLh();
    syncLhPicker();
    aaSync();
  });

  /* 阅读态点正文里的图片 → 开大图。
     附件那套查看器（滚轮缩放、双击复位、拖拽、下载原图）已经很完整，
     正文图片直接借它：给一个 data 地址就能显示，不必走附件仓。 */
  const RICH_PANE_EL = $('#richPane');
  if (RICH_PANE_EL) RICH_PANE_EL.addEventListener('click', (e) => {
    if (noteMode !== 'read') return;
    const img = e.target && e.target.closest ? e.target.closest('img') : null;
    if (!img || !img.closest('#richPane')) return;
    e.preventDefault();
    /* 兜一道：尺寸条要是还开着（编辑态点了图再切回阅读），先收掉再开大图，
       否则它会躲在预览层后面露半截 */
    closeImgSizer();
    openAttLightbox({ type: 'image/png', data: img.currentSrc || img.src, name: img.alt || '图片' });
  });

  /* 阅读态滚动：正文大标题滚过顶栏后，顶栏小标题淡入接管 */
  $('#editorBody').addEventListener('scroll', () => {
    if (noteMode === 'read') placeReadTitle();
  }, { passive: true });


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
  /* 正文 HTML 进编辑面前先过一遍体检。两件事必须在这里做，
     不然会一路带到下一次保存：
       ① 内联 caret-color —— 手机端用 styleWithCSS 上色时，Chrome 会把当时
          计算出来的 caret-color 一起写进 span（那边是自绘光标，body 上有
          sj-caret-drawn，所以无所谓）。桌面端没有自绘光标，这个样式留在正文里
          就等于「点进去看不见光标」，看着像光标落不下去。
       ② 列表里混进来的段落 —— <ol><li>…</li><p><br></p><li>…</li></ol>
          不是合法结构，列表项之间会多出一大段空档，点进去光标停在空段落里，
          上下两项的编号也会错乱。空的直接删，有内容的挪到列表后面。 */
  function normalizeRich(html) {
    if (!html) return '';
    const box = document.createElement('div');
    box.innerHTML = html;
    box.querySelectorAll('[style]').forEach((el) => {
      if (el.style.getPropertyValue('caret-color')) el.style.removeProperty('caret-color');
      if (!(el.getAttribute('style') || '').replace(/;\s*$/, '').trim()) el.removeAttribute('style');
    });
    box.querySelectorAll('ol, ul').forEach((list) => {
      let anchor = list;
      Array.from(list.children).forEach((ch) => {
        if (ch.tagName === 'LI' || ch.tagName === 'OL' || ch.tagName === 'UL') return;
        if (!ch.textContent.replace(/[\s\u00a0\u200b]+/g, '') && !ch.querySelector('img,pre,table,hr')) {
          ch.remove();
          return;
        }
        anchor.after(ch);
        anchor = ch;
      });
    });
    return box.innerHTML;
  }

  function noteHtml(note) {
    if (!note) return '';
    return normalizeRich(DOMPurify.sanitize(note.content ? String(note.content) : ''));
  }

  /* 保存：编辑期间只标脏、不写盘；离开编辑页时统一落盘。
     快照用来识别「改完又改回原样」——内容和已存版本一致就不写盘。
     编辑模式属于视图状态：切换只改显示，不写回笔记、不标脏。 */
  let savedSnapshot = '';
  function snapshot(n) {
    return JSON.stringify([n.title || '', n.content || '',
      n.categoryId || null, !!n.starred, n.tags || []]);
  }
  function markDirty() {
    const note = currentNote();
    if (!note) return;
    if (snapshot(note) === savedSnapshot) {
      setDirty(false);
      /* 改回原样 = 没有未保存内容，草稿副本也该清掉，别下次启动误报。 */
      clearEditDraft(state.selNote === DRAFT_ID ? DRAFT_ID : note.id);
      setSaveState('saved');
      return;
    }
    setDirty(true);
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
    setDirty(false);
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
      setDirty(true);
      setSaveState('error', '保存失败，请重试');
      toast(e.message);
    }
  }

  /* 正文输入：内容写回笔记。存储层只有富文本一种格式。 */
  function onRichInput() {
    const note = currentNote();
    if (!note) return;
    const html = $('#richPane').innerHTML;
    note.content = html;
    note.format = 'rich';
    note.updatedAt = Date.now();
    wordCount();
    markDirty();
    /* 字体 / 字号下拉跟着更新（命令执行完光标处的样式已经变了） */
    scheduleSyncFontPickers();
    richHistRecord(html);
  }

  let richHist = [], richHistIdx = -1, richHistTyping = false, richHistActive = false, richHistTimer = null;
  const RICH_HIST_MAX = 80;

  function richHistReset(html) {
    richHist = [html == null ? '' : html];
    richHistIdx = 0;
    richHistTyping = false;
    richHistActive = false;
    clearTimeout(richHistTimer);
    richHistTimer = null;
    richHistSyncBtns();
  }

  function richHistCommit(html) {
    /* 丢掉 redo 分支，压入新状态 */
    richHist = richHist.slice(0, richHistIdx + 1);
    richHist.push(html);
    if (richHist.length > RICH_HIST_MAX) richHist.shift();
    richHistIdx = richHist.length - 1;
    richHistSyncBtns();
  }

  function richHistRecord(html) {
    if (!richHist.length) return;
    if (html === richHist[richHistIdx]) return;
    const fromTyping = richHistTyping;
    richHistTyping = false;   // 本次已消费；每次 input 事件会重新置位
    if (fromTyping && richHistActive) {
      /* 同一打字段的后续字节：只把栈顶更新成最新内容，不新增历史项。
         撤销一次退回整段输入之前，而不是退一个字。 */
      richHist[richHistIdx] = html;
      clearTimeout(richHistTimer);
      richHistTimer = setTimeout(() => { richHistActive = false; }, 500);
      return;
    }
    clearTimeout(richHistTimer);
    if (fromTyping) {
      /* 打字段第一条：压入新栈，并开启 500ms 合并窗口 */
      richHistCommit(html);
      richHistActive = true;
      richHistTimer = setTimeout(() => { richHistActive = false; }, 500);
    } else {
      /* 离散操作（裁剪/格式/宽度/插图）：关掉可能未结束的打字段，独立记一步 */
      richHistActive = false;
      richHistCommit(html);
    }
  }

  function richHistSyncBtns() {
    const canU = richHistIdx > 0;
    const canR = richHistIdx >= 0 && richHistIdx < richHist.length - 1;
    document.querySelectorAll('[data-act="nh-undo"]').forEach((b) => { b.disabled = !canU; });
    document.querySelectorAll('[data-act="nh-redo"]').forEach((b) => { b.disabled = !canR; });
    document.querySelectorAll('#sjUndoBtn').forEach((b) => { b.disabled = !canU; });
    document.querySelectorAll('#sjRedoBtn').forEach((b) => { b.disabled = !canR; });
  }

  function richHistRestore(idx) {
    const pane = $('#richPane');
    if (!pane || idx < 0 || idx >= richHist.length) return false;
    richHistIdx = idx;
    richHistTyping = false;
    richHistActive = false;
    clearTimeout(richHistTimer);
    richHistTimer = null;
    const html = richHist[idx];
    pane.innerHTML = html;
    decorate(pane);
    const note = currentNote();
    if (note) { note.content = html; note.format = 'rich'; note.updatedAt = Date.now(); }
    wordCount();
    markDirty();
    richHistSyncBtns();
    /* 撤销/重做会把整块 innerHTML 换掉，工具条上的块名、对齐、颜色都停在
       撤销前那一段上。这里补一次刷新 —— 正是「改了没刷新」那类毛病。 */
    syncUI();
    return true;
  }

  function richUndo() { return richHistIdx > 0 ? richHistRestore(richHistIdx - 1) : false; }
  function richRedo() {
    return richHistIdx >= 0 && richHistIdx < richHist.length - 1 ? richHistRestore(richHistIdx + 1) : false;
  }


  /* 富文本里的图片保持原生，无需额外处理。 */

  /* ---------------------------------------------------------- 工具栏 */
  function renderToolbar() {
    const note = currentNote();
    const bar = $('#toolbar');
    /* 换笔记会重建工具条：色板跟着收掉，别浮在下一篇笔记上 */
    closeColorPop();
    closeBlockPop();
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
    /* 字体 / 字号下拉：选完不回占位文字 —— syncFontPickers 会把光标处
       真实的字体和大小重新算出来显示，下拉里「选中的那条」就是当前值。 */
    /* 下拉左侧挂一个小标签（T 字体 / Z 字号 / 行=行距）：字号和行距都只显示
       一个数字，没标分不出哪个是哪个。用 label 包住，点字母也能展开下拉。 */
    const sel = (title, opts, onChange, cls, tag) => {
      const wrap = document.createElement('label');
      wrap.className = 'tb-pick';
      const tg = document.createElement('span');
      tg.className = 'tb-pick-tag';
      tg.textContent = tag || '';
      const s = document.createElement('select');
      s.className = 'tb-select' + (cls ? ' ' + cls : '');
      s.title = title;
      s.innerHTML = opts.map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
      s.addEventListener('change', () => {
        const v = s.value;
        if (v) onChange(v);
        else syncFontPickers();
        fitSel(s);
      });
      wrap.appendChild(tg);
      wrap.appendChild(s);
      bar.appendChild(wrap);
      fitSel(s);
      return s;
    };

    // 富文本：正文只有这一套工具条，就常驻在标题和分类下面
    btn(I.bold, '加粗', () => exec('bold'));
    btn(I.italic, '斜体', () => exec('italic'));
    btn(I.underline, '下划线', () => exec('underline'));
    btn(I.strike, '删除线', () => exec('strikeThrough'));
    sep();
    tbFontSel = sel('字体', [
      ['', '默认'],
      ['SimSun', '宋体'],
      ['SimHei', '黑体'],
      ['Microsoft YaHei', '微软雅黑'],
      ['KaiTi', '楷体'],
      ['Arial', 'Arial'],
      ['Georgia', 'Georgia'],
      ['Courier New', '等宽'],
    ], (v) => execFont('fontName', v), '', 'T');
    tbSizeSel = sel('字号', [
      ['', '默认'],
      ['12', '12'],
      ['14', '14'],
      ['16', '16'],
      ['18', '18'],
      ['20', '20'],
      ['24', '24'],
      ['28', '28'],
      ['32', '32'],
    ], (v) => execFontSize(v), 'is-size', 'Z');
    /* 文字颜色：和手机端同一套 6 色 + 默认。按钮下面那道小横线是
       上一次用的颜色，点开才出色板（色板挂在 body 上，滚出工具条也看得见）。 */
    const colorBtn = btn(
      '<span class="tb-color"><b>A</b><i id="tbColorMark"></i></span>',
      '文字颜色', () => toggleColorPop(colorBtn)
    );
    /* 文字背景色：和文字颜色并排，方框里那个 A 的底色就是光标处的背景色 */
    const bgBtn = btn(
      '<span class="tb-color tb-color-bg"><b class="tb-bg-box" id="tbBgMark">A</b></span>',
      '文字背景色', () => toggleColorPop(bgBtn, 'bg')
    );
    sep();
    /* 2026-11-25：H1/H2/H3/¶ 四个按钮合并成一个下拉 —— 省一排位置，
       顺带把 H4/H5 也放出来（原来没有入口）。按钮上显示光标所在的块名。 */
    tbBlockBtn = btn(
      '<span class="tb-block-label">正文</span><span class="tb-caret"></span>',
      '段落格式', () => toggleBlockPop(tbBlockBtn), 'tb-block'
    );
    sep();
    btn(I.list, '无序列表', () => exec('insertUnorderedList'));
    btn(I.listOrdered, '有序列表', () => exec('insertOrderedList'));
    btn(I.quote, '引用', () => exec('formatBlock', '<blockquote>'));
    sep();
    /* 对齐四种合并成一个下拉（左 / 右 / 居中 / 两端），旁边再补一个缩进下拉。
       原来三个对齐按钮平铺，加上缩进就太挤；按钮上显示光标当前的对齐方式。 */
    tbAlignBtn = btn(
      `<span class="tb-align-ico">${I.alignLeft}</span><span class="tb-caret"></span>`,
      '对齐方式', () => toggleAlignPop(tbAlignBtn), 'tb-align'
    );
    tbIndentBtn = btn(
      `<span class="tb-align-ico">${I.indentInc}</span><span class="tb-caret"></span>`,
      '缩进', () => toggleIndentPop(tbIndentBtn), 'tb-indent'
    );
    sep();
    btn(I.code, '代码块', richCodeBlock);
    /* 行内代码：选中文字一键套 <code>，再按一次脱掉；快捷键见 keydown */
    const inlineCodeBtn = btn(I.codeInline, '行内代码 (Ctrl+E)', toggleInlineCode, 'tb-inline-code');
    inlineCodeBtn.dataset.act = 'inline-code';
    btn(I.link, '插入链接', () => {
      const url = prompt('请输入链接地址', 'https://');
      if (url) exec('createLink', url);
    });
    btn(I.table, '插入表格', insertRichTable);
    btn(I.hr, '分隔线', () => exec('insertHorizontalRule'));
    sep();
    /* 正文行距：直接给像素值（原来只有标准/适中/紧凑三档，不够用）。
       和字号一样是个下拉，选完立刻生效，值记在本机。
       档位下界见 lhSteps()：写死 16 起会让低几档被 1.1em 兜底吃掉。 */
    const LH_PX = lhSteps();
    tbLhSel = sel('正文行距（像素）', LH_PX.map((v) => [String(v), String(v)]), (v) => {
      const px = parseFloat(v);
      if (!isFinite(px)) return;
      setState({ richLh: px });
      applyRichLh();
      try { localStorage.setItem('sj_rich_lh', String(px)); } catch (_) {}
      syncLhPicker();
    }, 'is-lh', '行');
    syncLhPicker();
    const clearBtn = btn('<span class="tb-text" style="font-weight:600">Tx</span>', '清除格式', clearFormat, '');
    clearBtn.style.marginLeft = 'auto';
    syncFontPickers();
    /* 工具条折行时不要再把「清除格式」顶到最右：第二行常常只剩行距下拉，
       最右边却单独飘一个 Tx，看着像排坏了。只在一行时保留靠右。
       窗口宽度一变（侧栏拖宽拖窄）行数会变，所以盯高度而不是只判一次。 */
    watchBarWrap(bar);
  }

  /* 工具条一折行（第二行只剩行距下拉），就把「清除格式」的靠右取消掉，
     免得 Tx 孤零零悬在最右边；回到一行时再顶回去。 */
  let barWrapRO = null;
  function watchBarWrap(bar) {
    if (!bar || typeof ResizeObserver !== 'function') return;
    if (barWrapRO) barWrapRO.disconnect();
    barWrapRO = new ResizeObserver(() => {
      const b = bar.querySelector('button[title="清除格式"]');
      if (!b) return;
      const want = bar.offsetHeight > 46 ? '' : 'auto';
      if (b.style.marginLeft !== want) b.style.marginLeft = want;
    });
    barWrapRO.observe(bar);
  }

  /* ---- 字体 / 字号下拉的「当前值」 ----     光标的字体和字号从 startContainer 的计算样式里算：内联 span 上写的、
     标题自带的都如实反映。字号不在预设那几档里（手机端拖出来的 21px）
     就临时补一档 -- 否则下拉只能停在占位文字上，等于没信息。 */
  let tbFontSel = null;
  let tbSizeSel = null;
  let tbLhSel = null;
  let fontPickTick = 0;
  let fontPickTimer = 0;

  /* 行距下拉回显：值不在预设档里（老数据换算出来的奇数）就临时补一档 */
  function syncLhPicker() {
    if (!tbLhSel) return;
    const v = String(state.richLh);
    if (!Array.from(tbLhSel.options).some((o) => o.value === v)) {
      Array.from(tbLhSel.querySelectorAll('option[data-temp]')).forEach((o) => o.remove());
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      opt.setAttribute('data-temp', '1');
      tbLhSel.appendChild(opt);
    }
    tbLhSel.value = v;
    tbLhSel.title = '正文行距 ' + v + 'px';
    fitSel(tbLhSel);
  }

  /* 字号一改，行距下界跟着变（24px 正文配 22px 行距会叠字），档位重排一次 */
  function rebuildLhOptions() {
    if (!tbLhSel) return;
    tbLhSel.innerHTML = lhSteps().map((v) => `<option value="${v}">${v}</option>`).join('');
    syncLhPicker();
  }

  /* ---- 下拉宽度自己量 ----
     原生 select 点开的列表按「最长选项」撑，收起框若只按当前值量就会比
     列表窄一截。让收起框也按最宽选项量（见 measureSel），框和列表一样宽；
     每次回显仍重量一次，选项集变化（如行距重排）后能跟上。 */
  let selMeter = null;
  function measureSel(s) {
    if (!selMeter) {
      selMeter = document.createElement('span');
      selMeter.setAttribute('aria-hidden', 'true');
      selMeter.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre;';
      document.body.appendChild(selMeter);
    }
    const cs = getComputedStyle(s);
    selMeter.style.fontFamily = cs.fontFamily;
    selMeter.style.fontSize = cs.fontSize;
    selMeter.style.fontWeight = cs.fontWeight;
    selMeter.style.letterSpacing = cs.letterSpacing;
    /* 宽度跟内容走：没选字体/选了「默认」就按「默认」两个字量，
       选了微软雅黑就按「微软雅黑」量。按最宽选项量会让文字和箭头
       之间空一大截（2026-11-23 用户反馈）。 */
    const opt = s.options[s.selectedIndex >= 0 ? s.selectedIndex : 0];
    selMeter.textContent = opt ? opt.textContent : '';
    return Math.ceil(selMeter.getBoundingClientRect().width);
  }
  function fitSel(s) {
    if (!s || !document.body.contains(s)) return s;
    s.style.width = Math.max(0, measureSel(s) + 8 + 18) + 'px';
    return s;
  }

  /* 光标一动就刷字体 / 字号 / 颜色那一排。原来只挂 rAF 合帧，但 rAF 并不
     保证会有：窗口被遮挡、最小化、或后台标签页里浏览器一帧都不给
     （Safari 切走直接暂停），回来时工具条还停在旧值。所以再挂一个 32ms
     的 setTimeout 兜底，谁先到谁跑，run 自己把两边都撤掉，不会刷两次。 */
  function scheduleSyncFontPickers() {
    if (fontPickTick || fontPickTimer) return;
    const run = () => {
      if (fontPickTick) { cancelAnimationFrame(fontPickTick); fontPickTick = 0; }
      if (fontPickTimer) { clearTimeout(fontPickTimer); fontPickTimer = 0; }
      syncFontPickers();
    };
    fontPickTick = requestAnimationFrame(run);
    fontPickTimer = setTimeout(run, 32);
  }

  function caretStyleHost() {
    const pane = $('#richPane');
    if (!pane) return null;
    let r = null;
    const sel = window.getSelection();
    if (sel && sel.rangeCount && pane.contains(sel.getRangeAt(0).startContainer)) r = sel.getRangeAt(0);
    if (!r && savedRange && pane.contains(savedRange.startContainer)) r = savedRange;
    if (!r) return null;
    const el = probeNodeOf(r);
    return el && pane.contains(el) ? el : null;
  }

  /* 光标落在哪个节点上取样式。两层坑：
     ① 段落末尾的光标容器是 <p> 本身（offset 指到末尾），直接拿它算
        样式会读到段落默认值 —— 明明刚把这段设成 18px，下拉却回显 16px；
     ② 上色/字号叠起来时结构是 <p><span 字体><span 字号>文字</span></span></p>
        命中的最外层 span 上并没有字号，还得往里钻到真正包着文字的那层。
     所以：元素级光标先取紧邻的那半边（先看前一个子节点），再一路钻到
     最深的一层，直到下一个子节点是文字。 */
  function probeNodeOf(range) {
    const c = range.startContainer;
    if (c.nodeType === 3) return c.parentElement;
    const usePrev = range.startOffset > 0;
    let node = c.childNodes[usePrev ? range.startOffset - 1 : range.startOffset] || c;
    while (node && node.nodeType === 1) {
      const next = usePrev ? node.lastChild : node.firstChild;
      if (!next || next.nodeType === 3) break;
      node = next;
    }
    if (!node) return c;
    return node.nodeType === 1 ? node : node.parentElement;
  }

  /* 字体只认正文里真写过的 font-family。计算样式里挂着一长串兜底栈
     （-apple-system、Segoe UI…），拿它去比对会把「没设过字体」误报成
     列表里的某一项 —— 明明没选过字体，下拉却显示「微软雅黑」。 */
  function inlineFontFamily(el) {
    const pane = $('#richPane');
    let n = el;
    while (n && n !== pane) {
      if (n.style && n.style.fontFamily) return n.style.fontFamily;
      n = n.parentElement;
    }
    return '';
  }

  function matchFontOption(family) {
    if (!tbFontSel || !family) return '';
    const stack = String(family).split(',')
      .map((s) => s.trim().replace(/^["']|["']$/g, '').toLowerCase());
    for (const opt of tbFontSel.options) {
      if (!opt.value) continue;
      if (stack.includes(opt.value.toLowerCase())) return opt.value;
    }
    return '';
  }

  function matchSizeOption(px) {
    if (!tbSizeSel || !isFinite(px) || px <= 0) return '';
    Array.from(tbSizeSel.querySelectorAll('option[data-temp]')).forEach((o) => o.remove());
    const v = String(Math.round(px));
    if (Array.from(tbSizeSel.options).some((o) => o.value === v)) return v;
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    opt.dataset.temp = '1';
    const next = Array.from(tbSizeSel.options).find((o) => o.value && Number(o.value) > Number(v));
    tbSizeSel.insertBefore(opt, next || null);
    return v;
  }

  /* 工具条状态的唯一刷新入口：文字颜色、文字底色、块名、对齐、行内代码
     五处高亮都跟着光标走。以前各调用点只刷自己认得的那一处，别处就停在
     旧状态（换了标题级别对齐图标不动、套了行内代码颜色横线不动）。
     五个 paint 内部都有空值保护，没有工具条时（阅读态、无笔记）直接返回。 */
  function syncUI() {
    paintColorMark();
    paintBgMark();
    paintBlockLabel();
    paintAlignIcon();
    paintInlineCodeMark();
  }

  function syncFontPickers() {
    /* 颜色横线和字体/字号下拉一伙的：都跟着光标走，所以一起刷
       （放在最前面，下面两个 early return 也照样能刷到） */
    syncUI();
    if (!tbFontSel || !tbSizeSel) return;
    const el = caretStyleHost();
    if (!el) {
      tbFontSel.value = '';
      tbSizeSel.value = '';
      fitSel(tbFontSel); fitSel(tbSizeSel);
      return;
    }
    const cs = getComputedStyle(el);
    tbFontSel.value = matchFontOption(inlineFontFamily(el));
    tbSizeSel.value = matchSizeOption(parseFloat(cs.fontSize));
    /* 显示的内容变了，宽度跟着重量（「默认」与「微软雅黑」差一截） */
    fitSel(tbFontSel); fitSel(tbSizeSel);
  }

  /* ---- 文字颜色 ---- */
  const TEXT_COLORS = [
    ['#d13b32', '红色'], ['#f2c53d', '黄色'], ['#63a95c', '绿色'],
    ['#61b0d9', '蓝色'], ['#4b46d8', '靛蓝'], ['#a554cd', '紫色'],
  ];
  /* 文字背景色（荧光笔）：用半透明调子，而不是实色浅底。
     实色浅底在深色主题下会变成「浅底 + 浅字」，字直接糊掉；
     半透明叠在什么底色上都跟着那层底色走，两套主题都能读。 */
  const BG_COLORS = [
    ['rgba(209,59,50,.20)', '红色'], ['rgba(242,197,61,.34)', '黄色'], ['rgba(99,169,92,.24)', '绿色'],
    ['rgba(97,176,217,.28)', '蓝色'], ['rgba(75,70,216,.18)', '靛蓝'], ['rgba(165,84,205,.22)', '紫色'],
  ];
  let colorPop = null;
  let colorPopAnchor = null;
  let colorPopMode = 'text';

  /* 按钮 A 下面那道小横线 = 光标左边那个字真正是什么颜色。
     不是「上次用过的颜色」：光标移到一行红字里，横线就该是红的；
     移到没上过色的正文里，横线回到主题字色。
     caretStyleHost() 已经处理掉两个坑（段落末尾的光标容器是 <p>、
     字体/字号/颜色层层套 span），probeNodeOf() 又优先取「前一个子节点」，
     所以拿到的元素就是光标前一个字符的容器，读它的计算色即可。
     光标在段首（左边什么都没有）时取后一个字符，整段空着就是主题色。 */
  function caretTextColor() {
    const el = caretStyleHost();
    if (!el) return '';
    return getComputedStyle(el).color || '';
  }

  function paintColorMark() {
    const mark = document.getElementById('tbColorMark');
    if (!mark) return;
    /* 和元素上的现值比，不用外部变量：工具条重建后 element 是新的，这里必须重刷 */
    const c = caretTextColor();
    if (mark.style.background === c) return;
    mark.style.background = c;
  }

  function closeColorPop() {
    if (!colorPop) return;
    colorPop.remove();
    colorPop = null;
    document.removeEventListener('mousedown', onDocDownColorPop, true);
    document.removeEventListener('keydown', onKeyColorPop);
    if (colorPopAnchor) {
      colorPopAnchor.classList.remove('active');
      colorPopAnchor = null;
    }
  }

  function onKeyColorPop(e) {
    if (e.key === 'Escape') closeColorPop();
  }

  function onDocDownColorPop(e) {
    if (!colorPop) return;
    if (colorPop.contains(e.target)) return;
    if (colorPopAnchor && colorPopAnchor.contains(e.target)) return;
    closeColorPop();
  }

  /* 浮层贴在按钮下沿；右边或下边放不下就往回收（色板、段落菜单共用） */
  function placeFixedPop(pop, anchor) {
    const r = anchor.getBoundingClientRect();
    const w = pop.offsetWidth;
    const h = pop.offsetHeight;
    const left = Math.min(r.left, window.innerWidth - w - 10);
    let top = r.bottom + 6;
    if (top + h > window.innerHeight - 10) top = r.top - h - 6;
    pop.style.left = Math.max(8, left) + 'px';
    pop.style.top = Math.max(8, top) + 'px';
  }

  function toggleColorPop(anchor, mode) {
    if (colorPop) { closeColorPop(); return; }
    const m = mode === 'bg' ? 'bg' : 'text';
    const list = m === 'bg' ? BG_COLORS : TEXT_COLORS;
    const pop = document.createElement('div');
    pop.className = 'tb-color-pop' + (m === 'bg' ? ' is-bg' : '');
    pop.innerHTML = list.map(([c, name]) =>
      `<button type="button" class="tb-color-dot" data-color="${c}" title="${name}" style="--c:${c}"></button>`
    ).join('') + `<button type="button" class="tb-color-dot ring" data-color="default" title="${m === 'bg' ? '无背景' : '默认颜色'}"></button>`;
    /* 色板在正文外面：mousedown 不拦下来的话，点一下焦点就从正文跑走，
       选区变灰，颜色落不到刚选中的字上。 */
    pop.addEventListener('mousedown', (e) => e.preventDefault());
    pop.addEventListener('click', (e) => {
      const dot = e.target.closest('[data-color]');
      if (!dot) return;
      if (m === 'bg') applyBgColor(dot.dataset.color);
      else applyTextColor(dot.dataset.color);
      closeColorPop();
    });
    document.body.appendChild(pop);
    placeFixedPop(pop, anchor);
    colorPop = pop;
    colorPopAnchor = anchor;
    colorPopMode = m;
    anchor.classList.add('active');
    /* 下一拍再挂全局监听，否则这次点击自己就把色板关了 */
    setTimeout(() => {
      document.addEventListener('mousedown', onDocDownColorPop, true);
      document.addEventListener('keydown', onKeyColorPop);
    }, 0);
  }

  /* ---- 文字背景色（高亮） ----
     和文字颜色同一套交互，只是落到 background-color 上。
     「无背景」不是盖一块白底，而是把内联 background 抹掉：深色主题下
     白底会把那一行糊成白条，抹掉才能回到主题底色。 */
  function applyBgColor(color) {
    const pane = $('#richPane');
    if (!pane) return;
    prepareRange();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const collapsed = sel.getRangeAt(0).collapsed;
    const block = collapsed ? selectBlockAtCaret() : null;
    const range = sel.getRangeAt(0);
    if (color === 'default') {
      stripCharStyles(range, ['background-color', 'background']);
      /* 抹完只剩一个没属性的空 span（越用越深），拆掉 */
      dropBareSpans();
    } else {
      try { document.execCommand('styleWithCSS', false, true); } catch (_) {}
      let ok = false;
      try { ok = document.execCommand('hiliteColor', false, color); } catch (_) { ok = false; }
      /* 个别实现不认 rgba 的 hiliteColor，退到同一个命令的旧名字 */
      if (!ok) { try { document.execCommand('backColor', false, color); } catch (_) {} }
    }
    if (collapsed) caretToBlockEnd(block);
    syncUI();
    onRichInput();
  }

  function caretBgColor() {    const el = caretStyleHost();
    if (!el) return '';
    const bg = getComputedStyle(el).backgroundColor || '';
    if (!bg || bg === 'transparent' || /^rgba\(0,\s*0,\s*0,\s*0\)$/.test(bg)) return '';
    return bg;
  }

  /* 方框里的 A 用底色当底：光标停在带背景的字里，框就跟着变色 */
  function paintBgMark() {
    const box = document.getElementById('tbBgMark');
    if (!box) return;
    const c = caretBgColor();
    box.style.background = c || 'transparent';
    box.classList.toggle('has-bg', !!c);
  }

  /* ---- 段落格式：正文 / H1~H5 ----
     原来 H1、H2、H3、¶ 是四个并排按钮，既占位置又只到 H3。收成一个
     「当前块名 ▾」的下拉：按钮上直接写着光标现在是什么（正文 / H2…），
     点开才是菜单，当前那一条带 ✓。 */
  let tbBlockBtn = null;
  let blockPop = null;
  let blockPopAnchor = null;
  const BLOCK_OPTS = [['h1', 'H1'], ['h2', 'H2'], ['h3', 'H3'], ['h4', 'H4'], ['h5', 'H5'], ['p', '正文']];

  /* 光标落在哪个块上：标题直接回报 h1~h5，其余（段落、列表、引用）
     都算正文 —— 菜单里没有列表/引用，按钮上就不该冒出它们。 */
  function blockTagAtCaret() {
    const pane = $('#richPane');
    if (!pane) return 'p';
    const sel = window.getSelection();
    let node = null;
    if (sel && sel.rangeCount && pane.contains(sel.getRangeAt(0).startContainer)) node = sel.getRangeAt(0).startContainer;
    else if (savedRange && pane.contains(savedRange.startContainer)) node = savedRange.startContainer;
    if (!node) return 'p';
    let el = node.nodeType === 1 ? node : node.parentElement;
    while (el && el !== pane) {
      const t = el.tagName;
      if (/^H[1-5]$/.test(t)) return t.toLowerCase();
      if (/^(P|LI|BLOCKQUOTE|PRE|DIV)$/.test(t)) return 'p';
      el = el.parentElement;
    }
    return 'p';
  }

  function paintBlockLabel() {
    const lab = tbBlockBtn && tbBlockBtn.querySelector('.tb-block-label');
    if (!lab) return;
    const tag = blockTagAtCaret();
    const opt = BLOCK_OPTS.find(([v]) => v === tag) || BLOCK_OPTS[5];
    if (lab.textContent !== opt[1]) lab.textContent = opt[1];
  }

  function closeBlockPop() {
    if (!blockPop) return;
    blockPop.remove();
    blockPop = null;
    document.removeEventListener('mousedown', onDocDownBlockPop, true);
    document.removeEventListener('keydown', onKeyBlockPop);
    if (blockPopAnchor) {
      blockPopAnchor.classList.remove('active');
      blockPopAnchor = null;
    }
  }

  function onKeyBlockPop(e) {
    if (e.key === 'Escape') closeBlockPop();
  }

  function onDocDownBlockPop(e) {
    if (!blockPop) return;
    if (blockPop.contains(e.target)) return;
    if (blockPopAnchor && blockPopAnchor.contains(e.target)) return;
    closeBlockPop();
  }

  function toggleBlockPop(anchor) {
    if (blockPop) { closeBlockPop(); return; }
    const cur = blockTagAtCaret();
    const pop = document.createElement('div');
    pop.className = 'tb-block-pop';
    pop.innerHTML = BLOCK_OPTS.map(([tag, label]) => {
      const on = tag === cur;
      if (tag === 'p') return '<div class="tb-block-sep"></div>';
      return `<button type="button" class="tb-block-item${on ? ' on' : ''}" data-block="${tag}">`
        + `<span class="tb-block-chk">${on ? '✓' : ''}</span>`
        + `<span class="tb-block-h tb-block-${tag}">${label}</span></button>`;
    }).join('') + `<button type="button" class="tb-block-item tb-block-p${cur === 'p' ? ' on' : ''}" data-block="p">`
      + `<span class="tb-block-chk">${cur === 'p' ? '✓' : ''}</span>`
      + '<span class="tb-block-h">正文</span></button>';
    /* 菜单在正文外面，mousedown 必须拦下：否则点一下就丢焦点、选区变灰，
       格式落不到刚才选中的那段字上。 */
    pop.addEventListener('mousedown', (e) => e.preventDefault());
    pop.addEventListener('click', (e) => {
      const it = e.target.closest('[data-block]');
      if (!it) return;
      applyBlockTag(it.dataset.block);
      closeBlockPop();
    });
    document.body.appendChild(pop);
    placeFixedPop(pop, anchor);
    blockPop = pop;
    blockPopAnchor = anchor;
    anchor.classList.add('active');
    setTimeout(() => {
      document.addEventListener('mousedown', onDocDownBlockPop, true);
      document.addEventListener('keydown', onKeyBlockPop);
    }, 0);
  }

  /* ---------- 对齐方式 / 缩进：两个「图标 + 文字」的小菜单 ---------- */
  let tbAlignBtn = null;
  let tbIndentBtn = null;
  let tbMenuPop = null;
  let tbMenuAnchor = null;

  const ALIGN_OPTS = [
    ['left', '左对齐', 'justifyLeft', 'alignLeft'],
    ['right', '右对齐', 'justifyRight', 'alignRight'],
    ['center', '居中', 'justifyCenter', 'alignCenter'],
    ['justify', '两端对齐', 'justifyFull', 'alignJustify'],
  ];
  const INDENT_STEP_EM = 2;
  const INDENT_MAX_EM = 8;

  /* 光标所在块的对齐方式。getComputedStyle 而不是 queryCommandState：
     后者对「没显式设过」的段落回 false，四个里挑不出一个，按钮图标会乱跳。 */
  function alignAtCaret() {
    const host = caretStyleHost();
    const blk = host ? closestBlock(host) : null;
    if (!blk) return 'left';
    const ta = getComputedStyle(blk).textAlign;
    if (ta === 'center') return 'center';
    if (ta === 'right' || ta === 'end') return 'right';
    if (ta === 'justify') return 'justify';
    return 'left';
  }

  function paintAlignIcon() {
    if (!tbAlignBtn) return;
    const box = tbAlignBtn.querySelector('.tb-align-ico');
    if (!box) return;
    const cur = alignAtCaret();
    if (box.dataset.cur === cur) return;
    const opt = ALIGN_OPTS.find(([v]) => v === cur) || ALIGN_OPTS[0];
    box.innerHTML = I[opt[3]];
    box.dataset.cur = cur;
  }

  function closeTbMenu() {
    if (!tbMenuPop) return;
    tbMenuPop.remove();
    tbMenuPop = null;
    document.removeEventListener('mousedown', onDocDownTbMenu, true);
    document.removeEventListener('keydown', onKeyTbMenu);
    if (tbMenuAnchor) { tbMenuAnchor.classList.remove('active'); tbMenuAnchor = null; }
  }
  function onKeyTbMenu(e) { if (e.key === 'Escape') closeTbMenu(); }
  function onDocDownTbMenu(e) {
    if (!tbMenuPop) return;
    if (tbMenuPop.contains(e.target)) return;
    if (tbMenuAnchor && tbMenuAnchor.contains(e.target)) return;
    closeTbMenu();
  }

  /* items: [{ icon, label, on, run }] */
  function openTbMenu(anchor, items) {
    closeTbMenu();
    closeBlockPop();
    const pop = document.createElement('div');
    pop.className = 'tb-block-pop tb-menu-pop';
    pop.innerHTML = items.map((it, i) => {
      if (it.sep) return '<div class="tb-block-sep"></div>';
      return `<button type="button" class="tb-block-item${it.on ? ' on' : ''}" data-i="${i}">`
        + `<span class="tb-menu-ico">${it.icon || ''}</span><span>${it.label}</span></button>`;
    }).join('');
    /* 菜单在正文外面，mousedown 必须拦下，否则焦点一走选区就没了 */
    pop.addEventListener('mousedown', (e) => e.preventDefault());
    pop.addEventListener('click', (e) => {
      const b = e.target.closest('[data-i]');
      if (!b) return;
      const it = items[Number(b.dataset.i)];
      closeTbMenu();
      if (it && it.run) it.run();
    });
    document.body.appendChild(pop);
    placeFixedPop(pop, anchor);
    tbMenuPop = pop;
    tbMenuAnchor = anchor;
    anchor.classList.add('active');
    setTimeout(() => {
      document.addEventListener('mousedown', onDocDownTbMenu, true);
      document.addEventListener('keydown', onKeyTbMenu);
    }, 0);
  }

  function toggleAlignPop(anchor) {
    if (tbMenuPop && tbMenuAnchor === anchor) { closeTbMenu(); return; }
    const cur = alignAtCaret();
    openTbMenu(anchor, ALIGN_OPTS.map(([v, label, cmd, ico]) => ({
      icon: I[ico], label, on: v === cur, run: () => cssCmd(cmd),
    })));
  }

  /* 缩进作用在块上（margin-left），不是 execCommand('indent')：
     后者在 Chrome 里会把段落包进 <blockquote>，看着跟「引用」一模一样。 */
  function blocksForRange(range) {
    const pane = $('#richPane');
    const out = [];
    if (!pane || !range) return out;
    if (range.collapsed) {
      const blk = closestBlock(range.startContainer);
      if (blk) out.push(blk);
      return out;
    }
    const hits = [];
    pane.querySelectorAll('p,h1,h2,h3,h4,h5,li,blockquote,pre').forEach((el) => {
      let hit = false;
      try { hit = range.intersectsNode(el); } catch (_) { hit = false; }
      if (hit) hits.push(el);
    });
    /* 容器的子块都在命中列表里时只留最外层，避免嵌套块叠加两份缩进 */
    return hits.filter((el) => !hits.some((o) => o !== el && el.contains(o)));
  }

  function stepIndent(dir) {
    const pane = $('#richPane');
    if (!pane) return;
    prepareRange();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const blocks = blocksForRange(sel.getRangeAt(0));
    blocks.forEach((el) => {
      const em = parseFloat(getComputedStyle(el).fontSize) || 16;
      const cur = parseFloat(getComputedStyle(el).marginLeft) || 0;
      /* 归到整档：粘贴或手改过的 37px 之类不该成为新的基准 */
      let lv = Math.round(cur / em / INDENT_STEP_EM) + dir;
      lv = Math.max(0, Math.min(INDENT_MAX_EM / INDENT_STEP_EM, lv));
      if (lv <= 0) el.style.removeProperty('margin-left');
      else el.style.marginLeft = (lv * INDENT_STEP_EM) + 'em';
      if (!(el.getAttribute('style') || '').replace(/[;\s]/g, '')) el.removeAttribute('style');
    });
    /* 直接改 style 不会触发 input 事件，不手动走一遍的话这篇笔记不会被标脏，
       自动保存也不会跑 —— 切走或重开，缩进就白调了。 */
    if (blocks.length) onRichInput();
  }

  function toggleIndentPop(anchor) {
    if (tbMenuPop && tbMenuAnchor === anchor) { closeTbMenu(); return; }
    openTbMenu(anchor, [
      { icon: I.indentInc, label: '增加缩进', run: () => stepIndent(1) },
      { icon: I.indentDec, label: '减少缩进', run: () => stepIndent(-1) },
    ]);
  }

  /* 换块后必须摘掉块内的内联 font-size：字号下拉落的是
     <span style="font-size:18px">，它比 h1~h6 的 em 更硬 —— 块已经是 H1 了，
     里面那截字还卡在 18px，换级别看着毫无变化。粘贴来的内容几乎都带这个。 */
  function dropBlockFontSize(range) {
    const pane = $('#richPane');
    if (!pane || !range) return;
    const blocks = new Set();
    if (range.collapsed) {
      const blk = closestBlock(range.startContainer);
      if (blk) blocks.add(blk);
    } else {
      /* 有选区时 formatBlock 会连中间几块一起改，交集的都要清 */
      pane.querySelectorAll('[style]').forEach((el) => {
        let hit = false;
        try { hit = range.intersectsNode(el); } catch (_) { hit = false; }
        if (!hit) return;
        const blk = closestBlock(el);
        if (blk) blocks.add(blk);
      });
      [range.startContainer, range.endContainer].forEach((n) => {
        const blk = closestBlock(n);
        if (blk) blocks.add(blk);
      });
    }
    blocks.forEach((blk) => {
      [blk, ...blk.querySelectorAll('[style]')].forEach((el) => {
        if (!el.style || !el.style.getPropertyValue('font-size')) return;
        el.style.removeProperty('font-size');
        if (!(el.getAttribute('style') || '').replace(/[;\s]/g, '')) el.removeAttribute('style');
      });
    });
  }

  function applyBlockTag(tag) {
    const pane = $('#richPane');
    if (!pane) return;
    prepareRange();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const collapsed = sel.getRangeAt(0).collapsed;
    try { document.execCommand('styleWithCSS', false, false); } catch (_) {}
    document.execCommand('formatBlock', false, '<' + tag + '>');
    /* 换块会把原来的 p 整个换掉：光标要重新落到「新的那个块」的末尾，
       还拿着旧节点的话 caretToBlockEnd 直接什么都不做。 */
    const now = window.getSelection();
    if (now && now.rangeCount) {
      const r = now.getRangeAt(0);
      dropBlockFontSize(r);
      if (collapsed) caretToBlockEnd(closestBlock(r.startContainer));
    }
    syncUI();
    onRichInput();
  }

  /* 只有光标没有选区时，先选中光标所在那一段再上色 —— 和手机端、
     字号一个规矩：不选就点，浏览器只会给「下一次输入」记个颜色，
     现有文字一点变化都没有，用户以为按钮坏了。 */
  function applyTextColor(color) {
    const pane = $('#richPane');
    if (!pane) return;
    prepareRange();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const collapsed = sel.getRangeAt(0).collapsed;
    const block = collapsed ? selectBlockAtCaret() : null;
    const range = sel.getRangeAt(0);
    if (color === 'default') {
      /* 「默认」不是写死一个颜色：直接把内联 color 抹掉，回到主题色，
         深色主题下才不会留下一行黑字。 */
      stripCharStyles(range, ['color']);
      dropBareSpans();
    } else {
      try { document.execCommand('styleWithCSS', false, true); } catch (_) {}
      try { document.execCommand('foreColor', false, color); } catch (_) {}
    }
    /* 只是光标、整段是自动选上的：上完色把光标放回段末。
       留着整段选中，用户接着打字就会把这一行整段覆盖掉。 */
    if (collapsed) caretToBlockEnd(block);
    /* 光标摆好之后再取色，横线读的就是刚落下的这个颜色 */
    syncUI();
    onRichInput();
  }

  /* 清除格式：只清「字上的」东西（粗斜下划线、颜色、字号、字体、底色），
     结构（标题、列表、对齐）留着。浏览器自带的 removeFormat 有两个坑：
       ① 只有光标没有选区时它什么也不做，点了毫无反应；
       ② 它只认自己那几个命令，内联 style 里的 color / font-size
          / caret-color 会原样留着，看起来像「清了个寂寞」。 */
  const CHAR_STYLE_PROPS = ['color', 'background-color', 'background', 'font-size', 'font-family', 'caret-color', 'text-shadow'];

  /* 抹完样式常常剩下一个没有任何属性的 span：不动它，以后每上一次色
     就往里套一层，越攒越深。直接拆掉，文字回到父节点里。 */
  function dropBareSpans() {
    const pane = $('#richPane');
    if (!pane) return;
    Array.from(pane.querySelectorAll('span:not([class]):not([id])')).forEach((sp) => {
      if (!sp.attributes.length) sp.replaceWith(...Array.from(sp.childNodes));
    });
  }

  function stripCharStyles(range, props = CHAR_STYLE_PROPS) {
    const pane = $('#richPane');
    if (!pane || !range) return;
    Array.from(pane.querySelectorAll('[style]')).forEach((el) => {
      let hit = false;
      try { hit = range.intersectsNode(el); } catch (_) { return; }
      if (!hit) return;
      props.forEach((p) => el.style.removeProperty(p));
      if (!(el.getAttribute('style') || '').replace(/;\s*$/, '').trim()) el.removeAttribute('style');
    });
  }

  function clearFormat() {
    const pane = $('#richPane');
    if (!pane) return;
    prepareRange();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const collapsed = sel.getRangeAt(0).collapsed;
    const block = collapsed ? selectBlockAtCaret() : null;
    try { document.execCommand('styleWithCSS', false, false); } catch (_) {}
    try { document.execCommand('removeFormat'); } catch (_) {}
    const after = sel.rangeCount ? sel.getRangeAt(0) : null;
    if (after) stripCharStyles(after);
    /* 清空的 span 一并拆掉，不然以后再加格式会越套越深 */
    Array.from(pane.querySelectorAll('span:not([class]):not([id])')).forEach((sp) => {
      if (!sp.attributes.length) sp.replaceWith(...Array.from(sp.childNodes));
    });
    /* 只有光标时整段被选中了：清完把光标放回段末，接着打字不会覆盖整段 */
    if (collapsed) caretToBlockEnd(block);
    onRichInput();
  }

  /* 把光标所在的那一段（P / LI / 标题 / 引用）整段选中 */
  function selectBlockAtCaret() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    const el = closestBlock(sel.getRangeAt(0).startContainer);
    if (!el) return null;
    const nr = document.createRange();
    nr.selectNodeContents(el);
    sel.removeAllRanges();
    sel.addRange(nr);
    savedRange = nr.cloneRange();
    return el;
  }

  /* 富文本辅助 */
  let savedRange = null;

  document.addEventListener('selectionchange', () => {
    const pane = $('#richPane');
    const sel = window.getSelection();
    if (!pane || !sel || !sel.rangeCount) return;
    const r = sel.getRangeAt(0);
    if (pane.contains(r.commonAncestorContainer)) savedRange = r.cloneRange();
    /* 光标换到别处：字体 / 字号下拉跟着换成那一处的实际值 */
    scheduleSyncFontPickers();
  });

  /* 执行格式命令前把选区摆好。两件事必须按这个顺序来：
       ① 先把「用户此刻真的选中的那段」抓下来 —— 刚选完就点按钮时
          selectionchange 还没跑，savedRange 仍停在上一次的光标位置，
          直接用它会让格式落到别的地方；
       ② 再 focus —— focus 有时会把选区塌回元素开头，所以恢复必须先存后放。 */
  function prepareRange() {
    const pane = $('#richPane');
    if (!pane) return;
    const sel = window.getSelection();
    let fresh = null;
    if (sel && sel.rangeCount) {
      const r = sel.getRangeAt(0);
      if (!r.collapsed && pane.contains(r.commonAncestorContainer)) fresh = r.cloneRange();
    }
    pane.focus();
    const target = fresh || savedRange;
    if (!target) return;
    sel.removeAllRanges();
    sel.addRange(target);
  }

  /* 字体 / 字号这类「点了应该看得见」的命令：只有光标没有选区时，
     浏览器只会给「下一次输入」记一笔，现有文字纹丝不动 —— 用户点了
     半天没反应，以为下拉坏了。所以先把光标所在那一段整段选中再做。 */
  function blockAwareRange() {
    prepareRange();
    const sel = window.getSelection();
    const collapsed = !!sel && sel.rangeCount > 0 && sel.getRangeAt(0).collapsed;
    return { collapsed, block: collapsed ? selectBlockAtCaret() : null };
  }

  function caretToBlockEnd(block) {
    if (!block || !block.isConnected) return;
    const sel = window.getSelection();
    if (!sel) return;
    const r = document.createRange();
    r.selectNodeContents(block);
    r.collapse(false);
    sel.removeAllRanges();
    sel.addRange(r);
    savedRange = r.cloneRange();
  }

  function exec(cmd, value) {
    const pane = $('#richPane');
    prepareRange();
    try { document.execCommand('styleWithCSS', false, false); } catch (_) {}
    document.execCommand(cmd, false, value);
    onRichInput();
  }

  // 字体：styleWithCSS=true 让 fontName 生成 <span style="font-family:…">，
  // 而不是会被 DOMPurify 清掉 face 属性的旧 <font> 标签。
  function execFont(cmd, value) {
    const pane = $('#richPane');
    if (!pane) return;
    const { collapsed, block } = blockAwareRange();
    try { document.execCommand('styleWithCSS', false, true); } catch (_) {}
    document.execCommand(cmd, false, value);
    if (collapsed) caretToBlockEnd(block);
    onRichInput();
  }

  // 字号：execCommand('fontSize') 只认 1~7 档，直接用会落 <font size>，
  // 其 size 属性会被净化丢弃。做法是先用第 7 档打出可定位的 <font>，
  // 再把本次产生的那些 <font> 换成带精确 px 的 <span style="font-size">。
  function execFontSize(px) {
    const pane = $('#richPane');
    if (!pane) return;
    const { collapsed, block } = blockAwareRange();
    try { document.execCommand('styleWithCSS', false, false); } catch (_) {}
    // 记录执行前已有的 font 节点，避免误改正文里别处的内容
    const before = new Set(Array.from(pane.querySelectorAll('font')));
    document.execCommand('fontSize', false, '7');
    const made = Array.from(pane.querySelectorAll('font')).filter((f) => !before.has(f));
    if (!made.length) { onRichInput(); return; }
    const newSpans = [];
    made.forEach((f) => {
      const span = document.createElement('span');
      span.style.fontSize = px + 'px';
      while (f.firstChild) span.appendChild(f.firstChild);
      f.replaceWith(span);
      newSpans.push(span);
    });
    /* 只有光标的情况：整段是自动选上的，改完把光标放回段末，
       不然接着打字会把这一段整段覆盖掉 */
    if (collapsed) { caretToBlockEnd(block); onRichInput(); return; }
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
    prepareRange();
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

  /* ---- 行内代码（2026-11-25） ----
     选中文字一键套 <code>，再点一次脱掉；没选中就插一对并全选占位字。
     execCommand 没有「行内代码」这个命令，所以自己包：按选区里的文本节点
     逐个包，而不是 range.surroundContents 整段套 —— 后者在跨段（p→p）或跨
     加粗时不是抛错，就是把块级元素塞进 code 里，转 Markdown 立刻变形。
     pre 里的 code 不算：那是代码块，归「代码块」按钮管。 */
  function inlineCodeAt(node) {
    const pane = $('#richPane');
    if (!pane || !node) return null;
    let el = node.nodeType === 1 ? node : node.parentElement;
    while (el && el !== pane) {
      if (el.tagName === 'CODE') return el.closest('pre') ? null : el;
      el = el.parentElement;
    }
    return null;
  }

  /* 选区覆盖到的非空文本节点（部分相交也算） */
  function rangeTextNodes(range, pane) {
    const root = range.commonAncestorContainer;
    const host = root.nodeType === 3 ? root.parentNode : root;
    if (!host || !pane.contains(host)) return [];
    const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    const out = [];
    while (walker.nextNode()) {
      const t = walker.currentNode;
      if (!t.nodeValue || !/\S/.test(t.nodeValue)) continue;  // 纯空白不包，免得 md 里多出 ` `
      if (range.intersectsNode(t)) out.push(t);
    }
    return out;
  }

  /* 相邻的 <code> 合并成一个：选「abc」跨了加粗时会被拆成两段，
     留着两个挨着的胶囊看着像两个词。 */
  function mergeInlineCodes(pane) {
    pane.querySelectorAll('code').forEach((c) => {
      if (c.closest('pre')) return;
      const prev = c.previousSibling;
      if (prev && prev.nodeType === 1 && prev.tagName === 'CODE') {
        while (c.firstChild) prev.appendChild(c.firstChild);
        c.remove();
      }
    });
  }

  function unwrapInlineCode(code) {
    const parent = code && code.parentNode;
    if (!parent) return;
    const frag = document.createDocumentFragment();
    while (code.firstChild) frag.appendChild(code.firstChild);
    parent.replaceChild(frag, code);
    parent.normalize();
  }

  function wrapInlineCode(range) {
    const pane = $('#richPane');
    const targets = rangeTextNodes(range, pane).filter((t) => !inlineCodeAt(t));
    const made = [];
    targets.forEach((t) => {
      const r = document.createRange();
      r.selectNodeContents(t);
      if (t === range.startContainer) r.setStart(t, range.startOffset);
      if (t === range.endContainer) r.setEnd(t, range.endOffset);
      if (r.collapsed) return;
      const code = document.createElement('code');
      code.appendChild(r.extractContents());
      if (!/\S/.test(code.textContent)) return;
      r.insertNode(code);
      made.push(code);
    });
    if (!made.length) return false;
    mergeInlineCodes(pane);
    /* 合并会把后面的 code 吃掉，选区只认还活着的那些 */
    const alive = made.filter((c) => c.isConnected);
    const sel = window.getSelection();
    if (sel && alive.length) {
      const r = document.createRange();
      r.setStartBefore(alive[0]);
      r.setEndAfter(alive[alive.length - 1]);
      sel.removeAllRanges();
      sel.addRange(r);
      savedRange = r.cloneRange();
    }
    return true;
  }

  function toggleInlineCode() {
    const pane = $('#richPane');
    if (!pane) return;
    prepareRange();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    let changed = false;

    if (range.collapsed) {
      const code = inlineCodeAt(range.startContainer);
      if (code) {
        unwrapInlineCode(code);
        changed = true;
      } else {
        const fresh = document.createElement('code');
        fresh.textContent = '代码';
        range.insertNode(fresh);
        const r = document.createRange();
        r.selectNodeContents(fresh);
        sel.removeAllRanges();
        sel.addRange(r);
        savedRange = r.cloneRange();
        changed = true;
      }
    } else {
      const nodes = rangeTextNodes(range, pane);
      const allInside = nodes.length > 0 && nodes.every((t) => inlineCodeAt(t));
      if (allInside) {
        /* 整段都在行内代码里 → 脱掉（选区碰到的每个胶囊都拆） */
        const codes = Array.from(pane.querySelectorAll('code'))
          .filter((c) => !c.closest('pre') && range.intersectsNode(c));
        codes.forEach(unwrapInlineCode);
        changed = codes.length > 0;
      } else {
        changed = wrapInlineCode(range);
      }
    }
    if (changed) onRichInput();
    syncUI();
  }

  /* 光标在行内代码里时按钮亮着（能不能再点一次脱掉，看一眼就知道） */
  function caretTextNodeOf(range) {
    let n = range.startContainer;
    if (n.nodeType === 3) return n;
    const kids = n.childNodes;
    return kids[Math.max(0, Math.min(kids.length - 1, range.startOffset - 1))] || n;
  }

  function paintInlineCodeMark() {
    const b = document.querySelector('#toolbar .tb-btn[data-act="inline-code"]');
    if (!b) return;
    const pane = $('#richPane');
    const sel = window.getSelection();
    let on = false;
    if (pane && sel && sel.rangeCount) {
      const r = sel.getRangeAt(0);
      if (r.collapsed) {
        on = !!inlineCodeAt(caretTextNodeOf(r));
      } else {
        /* 选区起点常常落在元素节点里（setStartBefore 之类），拿文本节点更准 */
        const nodes = rangeTextNodes(r, pane);
        on = nodes.length > 0 && nodes.every((t) => inlineCodeAt(t));
      }
    }
    b.classList.toggle('active', on);
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

  /* 粘贴纯文本时判断它是不是 Markdown 语法。
     存储层收敛为富文本后，用户从别处复制的 md 源码（# 标题、- 列表、
     ``` 代码块 等）如果原样插进去就只是一堆符号。这里识别出来转成
     排版后的 HTML —— Markdown 速记的能力保住了，只是不再占用一种
     存储格式。判断不靠「像不像」，而是看有没有明确的 md 标记。 */
  function looksLikeMarkdown(text) {
    const t = String(text || '');
    if (!t.trim() || t.length > 20000) return false;
    /* 有任一明确的 md 标记才认；普通段落（含句号、逗号）不认。 */
    return /(^|\n)\s{0,3}#{1,6}\s+\S/.test(t)          /* 标题 */
      || /(^|\n)\s{0,3}([-*+]|\d+\.)\s+\S/.test(t)    /* 列表 */
      || /(^|\n)\s{0,3}>\s+\S/.test(t)                 /* 引用 */
      || /```/.test(t)                                    /* 代码块 */
      || /\*\*[^*\n]+\*\*/.test(t)                     /* 加粗 */
      || /(^|\n)\s{0,3}\|[^\n]+\|\s*\n/.test(t)     /* 表格 */
      || /!\[[^\]]*\]\([^)]+\)/.test(t)               /* 图片 */
      || /\[[^\]]+\]\([^)]+\)/.test(t);               /* 链接 */
  }

  /* 粘贴净化 + 图片上传 + Markdown 识别 */
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

  /* -------------------------------------------- 图片附件预览（桌面端专属）
     服务端 /api/files/<id> 对常见位图返回 Content-Disposition: inline，
     缩略图用的本来就是原图地址，所以预览不需要再拉一次数据。
     触屏端（云端 app.js）另有一套基于 blob/data URL 的 openAttView，
     那里要解决「手机浏览器拦截下载」，与这里的鼠标交互不是一回事。 */
  let attHoverEl = null;
  let attHoverTimer = 0;

  function hideAttHover() {
    clearTimeout(attHoverTimer);
    attHoverTimer = 0;
    if (attHoverEl) { attHoverEl.remove(); attHoverEl = null; }
  }

  function showAttHover(thumb, a) {
    hideAttHover();
    /* 只有真有鼠标的设备才浮；触屏/混合设备会把浮层卡在屏幕上 */
    try { if (!window.matchMedia('(hover: hover)').matches) return; } catch (_) { return; }
    attHoverTimer = setTimeout(() => {
      attHoverTimer = 0;
      if (!thumb.isConnected) return;
      const box = document.createElement('div');
      box.className = 'att-hover';
      const img = document.createElement('img');
      img.src = attDisplaySrc(a);      // 悬停才加载，不拖慢附件面板渲染
      img.alt = a.name || '';
      box.appendChild(img);
      document.body.appendChild(box);
      const r = thumb.getBoundingClientRect();
      const W = 300, H = 220, gap = 12, pad = 8;
      /* 右侧优先、垂直居中于缩略图。原先是 top = r.top - 8，缩略图贴着屏幕底时
         会被 clamp 顶到视口下缘，浮窗看上去"跳"到缩略图远上方；
         改成以缩略图中心对齐后，只有真的放不下才会移动，且移动量最小。 */
      let left = r.right + gap;
      if (left + W > window.innerWidth - pad) {
        const alt = r.left - gap - W;                 // 右侧放不下改左侧
        left = alt >= pad ? alt : Math.max(pad, Math.min(r.right + gap, window.innerWidth - W - pad));
      }
      let top = r.top + r.height / 2 - H / 2;
      top = Math.min(Math.max(pad, top), Math.max(pad, window.innerHeight - H - pad));
      box.style.left = Math.round(left) + 'px';
      box.style.top = Math.round(top) + 'px';
      attHoverEl = box;
    }, 180);
  }

  function closeAttLightbox() {
    const old = document.getElementById('attLightbox');
    if (old) old.remove();
  }

  function openAttLightbox(a) {
    if (!a || !/^image\//.test(a.type || '')) return;
    /* 服务端对 SVG 强制 attachment（避免正文里执行脚本），不能当图片直接显示 */
    if (/^image\/svg\+xml/i.test(a.type || '')) { toast('SVG 请用下载按钮打开'); return; }
    hideAttHover();
    closeAttLightbox();
    const src = attDisplaySrc(a);
    const box = document.createElement('div');
    box.className = 'att-lightbox';
    box.id = 'attLightbox';
    const img = document.createElement('img');
    img.src = src;
    img.alt = a.name || '';
    const dl = document.createElement('a');
    dl.className = 'att-lightbox-dl';
    dl.href = src;
    dl.download = a.name || '附件';
    dl.textContent = '下载原图';
    dl.addEventListener('click', (e) => e.stopPropagation());   // 别冒泡关掉大图
    const tip = document.createElement('div');
    tip.className = 'att-lightbox-tip';
    tip.textContent = '滚轮缩放 · 双击复位 · 点空白处或按 ESC 关闭';
    box.append(img, dl, tip);

    /* 大图缩放：fit 状态下 s=1 就是 CSS contain 的结果，不再额外算尺寸。
       滚轮以光标为中心缩放（放大时光标下的那一点不动），双击在 fit 与 2x 之间切换，
       放大后可拖拽平移。所有平移都走 transform，不改布局，所以不会把大图撑出视口。 */
    let s = 1, tx = 0, ty = 0;
    const MIN_S = 1, MAX_S = 6;
    const apply = (animate) => {
      img.style.transition = animate ? '' : 'none';
      img.style.transform = 'translate(' + tx + 'px, ' + ty + 'px) scale(' + s + ')';
      img.classList.toggle('zoomed', s > 1.001);
    };
    const zoomAt = (next, cx, cy) => {
      next = Math.min(MAX_S, Math.max(MIN_S, next));
      if (Math.abs(next - s) < 1e-4) return;
      const rect = box.getBoundingClientRect();
      const ox = cx - (rect.left + rect.width / 2);
      const oy = cy - (rect.top + rect.height / 2);
      const k = next / s;
      tx = ox - (ox - tx) * k;
      ty = oy - (oy - ty) * k;
      s = next;
      if (s <= 1.001) { tx = 0; ty = 0; }      // 回到 fit 就归位，不留残余偏移
      apply(false);
    };

    box.addEventListener('wheel', (e) => {
      e.preventDefault();
      zoomAt(s * (e.deltaY < 0 ? 1.18 : 1 / 1.18), e.clientX, e.clientY);
    }, { passive: false });

    let drag = null;
    img.addEventListener('pointerdown', (e) => {
      if (s <= 1.001) return;                   // 未放大时拖拽无意义，也避免误吞点击
      drag = { x: e.clientX, y: e.clientY, tx, ty };
      img.classList.add('dragging');
      try { img.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
    });
    img.addEventListener('pointermove', (e) => {
      if (!drag) return;
      tx = drag.tx + (e.clientX - drag.x);
      ty = drag.ty + (e.clientY - drag.y);
      apply(false);
    });
    const endDrag = () => { drag = null; img.classList.remove('dragging'); };
    img.addEventListener('pointerup', endDrag);
    img.addEventListener('pointercancel', endDrag);

    img.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      if (s > 1.001) { s = 1; tx = 0; ty = 0; apply(true); }
      else zoomAt(2, e.clientX, e.clientY);
    });

    /* 只有点背景才关：点图在放大态是拖拽，误关会很烦；下载按钮自己 stopPropagation */
    box.addEventListener('click', (e) => { if (e.target === box) closeAttLightbox(); });
    document.body.appendChild(box);
  }

  /* 大图按 ESC 关闭；页面滚动时收掉悬停浮层，别留下一个跟着页面跑的框。
     用捕获阶段 + stopImmediatePropagation：大图打开时 ESC 只用来关大图，
     否则会顺带触发已有的 closeImgSizer / closeDrawer / 全局快捷键的 ESC 分支。 */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !document.getElementById('attLightbox')) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    closeAttLightbox();
  }, true);
  window.addEventListener('scroll', hideAttHover, true);

  /* 附件显示地址：手机端附件自带 data URL 直接内嵌；桌面端由服务端 /api/files/<id> 提供。 */
  function attDisplaySrc(a) {
    return (a && a.data) ? a.data : '/api/files/' + (a && a.id);
  }

  function renderAttachments() {
    hideAttHover();            // 附件面板重渲染时清掉可能残留的悬停浮层
    const note = currentNote();
    const box = $('#attachList');
    box.innerHTML = '';
    if (!note) return;
    const list = note.attachments || [];
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
          <a class="att-act" href="${attDisplaySrc(a)}" download="${escapeHtml(a.name)}" data-tip="下载">${I.download}</a>
          <button class="att-act del" data-act="del" data-tip="删除附件">${I.x}</button>
        </div>`;
      el.querySelector('[data-act="insert"]').addEventListener('click', () => insertAttachment(a));
      el.querySelector('[data-act="del"]').addEventListener('click', () => deleteAttachment(a));
      /* 图片缩略图：悬停快看、点击看全屏。SVG 只走下载（服务端强制 attachment）。 */
      if (isImg && !/^image\/svg\+xml/i.test(a.type || '')) {
        const thumb = el.querySelector('.att-thumb');
        if (thumb) {
          thumb.classList.add('clickable');
          thumb.dataset.tip = '点击查看原图';
          thumb.addEventListener('click', () => openAttLightbox(a));
          thumb.addEventListener('mouseenter', () => showAttHover(thumb, a));
          thumb.addEventListener('mouseleave', hideAttHover);
        }
      }
      box.appendChild(el);
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
      setAttachState('open');
      toast(`已添加 ${ok} 个附件`);
      inserted.forEach((att) => insertAttachment(att));
    }
  }

  function insertAttachment(a) {
    const note = currentNote();
    if (!note) return;
    const isImg = /^image\//.test(a.type);
    const pane = $('#richPane');
    pane.focus();
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
    // 右下角同步面板开着时，弹层右移让位，免得弹窗与面板叠在一起（窄屏由 CSS 媒体查询自动取消）
    const panel = $('#syncPanel');
    const panelOpen = !!panel && !panel.classList.contains('hidden');
    root.classList.toggle('with-side-panel', panelOpen);
    root.classList.remove('hidden');
    return root.querySelector('.modal');
  }

  function closeModal() {
    $('#modalRoot').classList.add('hidden');
    $('#modalRoot').classList.remove('with-side-panel');
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

  function openPrompt({ title, message = '', value = '', placeholder = '', confirmText = '确定', validate, onConfirm }) {
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
      /* validate 返回错误时不关弹窗：用户填的名字还在，改一下就能重试，
         不用重新点一遍「新建」再从头输入。 */
      if (typeof validate === 'function') {
        const bad = validate(v);
        if (bad) { toast(bad.message || String(bad)); input.focus(); input.select(); return; }
      }
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
  /* 重名不让建：同一级下已经有一模一样的名字就当场提示，不必等一次请求。
     服务端也有同一道校验（并且是最终裁判），这里只是让反馈快一点。 */
  function dupCatError(name, parentId, excludeId) {
    const hit = window.SJCats ? window.SJCats.siblingOf(state.categories, name, parentId || null, excludeId) : null;
    return hit ? new Error(`同一级下已有同名类别「${hit.name}」，换个名字吧`) : null;
  }

  function createCategory(parentId, name) {
    const dup = dupCatError(name, parentId, null);
    if (dup) return Promise.reject(dup);
    return api('/api/categories', { method: 'POST', body: { name, parentId: parentId || null } })
      .then((cat) => {
        state.categories.push(cat);
        if (parentId) {
          const p = state.categories.find((c) => c.id === parentId);
          if (p) p.expanded = true;
        }
        renderTree();
        toast(`已新建类别「${cat.name}」`);
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
      validate: (v) => dupCatError(v, parentId, null),
      onConfirm: (v) => createCategory(parentId, v),
    });
  }

  function renameCategory(cat) {
    openPrompt({
      title: '重命名类别',
      value: cat.name,
      confirmText: '保存',
      validate: (v) => dupCatError(v, cat.parentId, cat.id),
      onConfirm: async (v) => {
        const dup = dupCatError(v, cat.parentId, cat.id);
        if (dup) throw dup;
        const updated = await api(`/api/categories/${cat.id}`, { method: 'PATCH', body: { name: v } });
        Object.assign(cat, updated);
        renderTree();
        renderList();
        if (state.selNote) openNote(state.selNote);
        toast('已重命名');
      },
    });
  }

  async function deleteCategory(cat) {
    const count = subtreeCount(cat.id, state.notes);
    /* 只有「空的叶子分类」才允许删（用户 2026-11-27 定）。
       分类只是容器，笔记才是内容；子分类则是结构本身。这两样还在时，
       静默删掉等于替用户做了一次看不见的整理，所以一律拦下，只给一句提示。 */
    if (count > 0) {
      /* 数字要能对上账：用户数分类树时看到的是「本层几篇 + 子分类几篇」，
         只报一个总数会让人以为算错了（真机上就这样问过一次）。 */
      const own = state.notes.filter((n) => n.categoryId === cat.id).length;
      const sub = count - own;
      const detail = sub > 0 ? `（本层 ${own} 篇、子分类 ${sub} 篇）` : '';
      toast(`此分类下有 ${count} 篇笔记${detail}，无法删除。请先把笔记移到别处再试。`, 3600);
      return;
    }
    const subs = state.categories.filter((c) => c.parentId === cat.id);
    if (subs.length) {
      toast(`此分类下还有 ${subs.length} 个子分类，无法删除。请先处理子分类。`, 3200);
      return;
    }
    try {
      await api(`/api/categories/${cat.id}`, { method: 'DELETE' });
      setState({ categories: state.categories.filter((c) => c.id !== cat.id) });
      if (cat.id === state.selCat) setState({ selCat: 'all' });
      renderTree();
      renderList();
      toast('类别已删除');
    } catch (e) { toast(e.message); }
  }

  /* 移动笔记到分类。云端是手机端没有拖拽才加的；桌面端虽然能拖树里的笔记行，
     但那个入口藏在侧栏、要先把笔记展开出来才拖得到，实际几乎没人发现。
     用户反馈「笔记页面没有调整分类的选项」，所以两端统一：点编辑区那行分类名即可换。 */
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
      categoryId: target, title: '', content: '', format: 'rich',
      starred: false, tags: [], attachments: [],
      createdAt: t, updatedAt: t,
    };
    if (state.selCat !== 'all' && state.selCat !== 'starred' && state.selCat !== 'uncat') {
      // 保持当前类别视图
    } else {
      setState({ selCat: 'all' });
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
    setState({ selNote: null });
    setDirty(false);
    savedSnapshot = '';
    closeTagInput();
    const tl = $('#tagList');
    if (tl) tl.innerHTML = '';
    $('#editorWrap').classList.add('hidden');
    $('#emptyState').classList.remove('hidden');
    renderList();
  }

  function deleteNote(note) {
    /* -70：空白草稿还没进库，直接丢弃，不必创建再移进回收站。 */
    if (note === draftNote) { discardDraft(); return; }
    const attCount = (note.attachments || []).length;
    openConfirm({
      title: '删除笔记',
      /* -68：原文案写「永久删除…无法恢复」，但服务端 DELETE /api/notes/:id 是软删除
         （只写 deletedAt，附件与历史版本都留着，30 天后才真删，回收站里可恢复）。
         文案必须与行为一致，否则用户会以为删掉就找不回了。 */
      message: `「${escapeHtml(note.title || '无标题笔记')}」将移到回收站${attCount ? `，${attCount} 个附件一并保留` : ''}，30 天内可恢复。`,
      confirmText: '删除',
      danger: true,
      onConfirm: async () => {
        await api(`/api/notes/${note.id}`, { method: 'DELETE' });
        setState({ notes: state.notes.filter((n) => n.id !== note.id) });
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
    if (window.SJDiff) window.SJDiff.attach(note, versions, { openModal, closeModal, api, fmtFull, closeIcon: I.x });
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
      { label: '导出为 PDF（打印）', icon: I.eye, onClick: () => doExport('pdf') },
      { label: '导出为 Markdown (.md)', icon: I.download, onClick: () => doExport('md') },
      { label: '查看 / 复制 Markdown 源码', icon: I.code, onClick: () => showMarkdownSource() },
      { label: '存为版本（手动快照）', icon: I.doc, onClick: () => saveAsVersion() },
      { label: '🔒 加密备份（.vault）', icon: I.lock || I.doc, onClick: () => { if (window.SJE2EE) window.SJE2EE.openPanel(); } },
    ]);
  }

  /* 查看 Markdown 源码：正文统一用富文本编辑，源码退到这里来。
     富文本转成 Markdown，可直接复制走。 */
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
  function showCtx(x, y, items) {
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
    const rect = ctx.getBoundingClientRect();
    const px = Math.max(8, Math.min(x, window.innerWidth - rect.width - 8));
    const py = Math.max(8, Math.min(y, window.innerHeight - rect.height - 8));
    ctx.style.left = px + 'px';
    ctx.style.top = py + 'px';
  }
  function hideCtx() { ctx.classList.add('hidden'); }

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
      setState({ selCat: k });
      setState({ search: '' });
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
      setState({ selCat: id });
      renderTree();
      renderList();
      afterPickCategory();
    }
  });

  /* -------- 拖动到「有子分类的收起行」上，停留一下自动展开 --------
     用户 21:54 反馈：把笔记拖到另一个分类时，如果目标在它的子分类下，就得先松手、
     再点开箭头、再拖一次 —— 拖动过程中子分类根本不出现。

     关键约束：**不能在这里调 renderTree()**。整棵树重渲染会把 dragstart 的源行
     （正在被拖的那一行）从 DOM 里删掉，Chrome 会因此直接取消这次拖拽 ——
     表现成「展开一下就拖不动了」。所以这里只往该行后面插入它自己的子树，
     其余 DOM 一动不动；state 里同步设 expanded=true，后续任何一次正常重渲染
     都不会出现「DOM 展开了、数据没展开」的错位。 */
  let dragExpandTimer = 0;
  let dragExpandRow = null;
  function clearDragExpand() {
    if (dragExpandTimer) { clearTimeout(dragExpandTimer); dragExpandTimer = 0; }
    dragExpandRow = null;
  }
  function expandRowForDrag(row) {
    const id = row.dataset.id;
    const cat = state.categories.find((c) => c.id === id);
    if (!cat || cat.expanded) return false;
    const kids = state.categories.filter((c) => c.parentId === id).sort(byOrder);
    if (!kids.length) return false;
    cat.expanded = true;
    const depth = Number(row.dataset.depth) || 0;
    const box = document.createElement('div');
    box.className = 'tree-children';
    /* 与 catNode() 完全同构：先子分类（各自可能还带自己的子树），再本级笔记 */
    kids.forEach((k) => box.appendChild(catNode(k, depth + 1)));
    notesUnder(id).forEach((n) => box.appendChild(noteRow(n, depth)));
    row.classList.remove('collapsed');
    row.after(box);
    return true;
  }
  function scheduleDragExpand(row) {
    if (!row || dragExpandRow === row) return;   // 同一行持续 dragover，别重置计时
    clearDragExpand();
    dragExpandRow = row;
    const cat = state.categories.find((c) => c.id === row.dataset.id);
    if (!cat || cat.expanded) return;
    if (!state.categories.some((c) => c.parentId === row.dataset.id)) return;
    dragExpandTimer = setTimeout(() => {
      dragExpandTimer = 0;
      const again = state.categories.find((c) => c.id === row.dataset.id);
      if (!again || again.expanded) return;
      if (expandRowForDrag(row)) row.classList.add('dragover');
    }, 550);
  }

  $('#tree').addEventListener('dragover', (e) => {
    const row = e.target.closest('.tree-row[data-id]');
    if (!row) { clearDragExpand(); return; }
    e.preventDefault();
    row.classList.add('dragover');
    scheduleDragExpand(row);
  });
  $('#tree').addEventListener('dragleave', (e) => {
    const row = e.target.closest('.tree-row[data-id]');
    if (!row) return;
    /* 在同一行内部的子元素之间移动也会冒 dragleave，那不是「离开这行」，
       否则计时器被反复重置，停在行上也不会展开。 */
    if (e.relatedTarget && row.contains(e.relatedTarget)) return;
    row.classList.remove('dragover');
    if (dragExpandRow === row) clearDragExpand();
  });
  /* 拖拽在树以外结束（松手、按 Esc）时兜底清计时器 */
  document.addEventListener('dragend', clearDragExpand);
  document.addEventListener('drop', clearDragExpand);
  $('#tree').addEventListener('drop', async (e) => {
    const row = e.target.closest('.tree-row[data-id]');
    if (!row) return;
    e.preventDefault();
    clearDragExpand();
    row.classList.remove('dragover');
    const noteId = e.dataTransfer.getData('text/note-id');
    if (!noteId) return;
    const note = noteById(noteId);
    if (!note || note.categoryId === row.dataset.id) return;
    note.categoryId = row.dataset.id;
    note.updatedAt = Date.now();
    renderTree();
    renderList();
    /* 拖的这篇如果正好开着，编辑区上面那句「分类名」也要跟着变（22:0x 用户反馈）。 */
    refreshMetaFor(note);
    /* 拖拽是「一次明确的操作」，不是打字：必须立刻落盘。
       只标脏是不够的 —— markDirty() 只对「当前打开的这篇」生效，而拖的往往
       不是打开中的那篇，结果界面上移走了、刷新后又回到原分类（静默丢失）。 */
    if (state.selNote === note.id) markDirty();
    api(`/api/notes/${note.id}`, { method: 'PATCH', body: { categoryId: note.categoryId } })
      .catch(() => toast('移动失败，请重试'));
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
    setState({ search: e.target.value });
    renderTree();
    renderList();
  });

  /* ---------------------------------------------------------- 手机端抽屉 */
  const NARROW = () => window.matchMedia('(max-width: 980px)').matches;

  let drawerOpenedAt = 0;
  let lastDrawerTap = { kind: '', at: -1 };
  function openDrawer(kind) {
    document.body.classList.remove('m-tree', 'm-list');
    document.body.classList.add(kind === 'tree' ? 'm-tree' : 'm-list');
    drawerOpenedAt = Date.now();
  }
  function closeDrawer() {
    document.body.classList.remove('m-tree', 'm-list');
  }
  /* 部分安卓浏览器会把一次轻触派发成两次 click。原来是 toggle 写法，
     第二次 click 会把刚打开的抽屉立刻收回去（「闪一下又回到笔记」）。
     同一按钮 500ms 内的重复 click 忽略；切不同按钮不受影响。 */
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
    if (NARROW()) openDrawer('list');
  }
  /** 顶栏标题：有选中笔记显示标题，否则显示当前列表名 */
  function syncBarTitle() {
    const el = $('#mBarTitle');
    if (!el) return;
    const note = currentNote();
    el.textContent = note ? (note.title || '无标题笔记') : ($('#listTitle').textContent || '拾笺');
  }

  /* 返回菜单 / 打开列表 = 离开编辑页，脏数据在这里落盘。 */
  $('#mTreeBtn').addEventListener('click', (e) => toggleDrawer('tree', e));
  $('#mListBtn').addEventListener('click', (e) => toggleDrawer('list', e));
  $('#mMask').addEventListener('click', () => {
    /* 刚打开的一瞬间忽略遮罩穿透点击 */
    if (Date.now() - drawerOpenedAt < 400) return;
    closeDrawer();
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
        setState({ selCat: id });
        setState({ search: '' });
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

  $('#richPane').addEventListener('input', () => { richHistTyping = true; onRichInput(); });

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

  /* 编辑区那行只有「分类名」本身可点 → 改分类（与云端同一入口）。
     日期不属于可点范围：整行绑 click 会让鼠标移到「创建于…」上也高亮、
     点日期也弹分类框（用户反馈）。
     只在编辑态响应：阅读态是纯阅读，不做任何编辑动作（用户 2026-11-22 要求）。 */
  $('#metaInfo').addEventListener('click', (e) => {
    if (!e.target.closest || !e.target.closest('[data-meta-cat]')) return;
    if (!document.body.classList.contains(NOTE_EDIT)) return;
    const note = currentNote();
    if (note) openCategoryPicker(note);
  });

  /* 华为风编辑态顶栏：撤销 / 重做 / 完成
     走自建 HTML 快照栈，覆盖裁剪 / 宽度 / 格式等程序化改动（原生 undo 不认） */
  $('#sjUndoBtn').addEventListener('click', () => {
    const pane = $('#richPane');
    if (!pane) return;
    pane.focus();
    richUndo();
  });
  $('#sjRedoBtn').addEventListener('click', () => {
    const pane = $('#richPane');
    if (!pane) return;
    pane.focus();
    richRedo();
  });
  $('#sjDoneBtn').addEventListener('click', () => {
    setNoteMode(false);
    void saveNow();
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

  /* 插入图片：专门入口，选中图片后自动插入正文 */
  $('#imgBtn').addEventListener('click', () => {
    if (!currentNote()) { toast('请先新建或选择一篇笔记'); return; }
    const fi = $('#fileInput');
    fi.accept = 'image/*';
    fi.dataset.insert = '1';
    fi.click();
  });
  /* 点正文里的图片 → 弹尺寸工具条 */
  bindImgResize($('#richPane'), 'rich');

  /* ---- 附件面板三态：open / collapsed / hidden（与手机端一致）----
     · open      整块摊开
     · collapsed 阅读态专用：压成一条窄条，只留一个向上箭头
     · hidden    整块收起
     阅读态点 ⌄ 走 collapsed（腾出正文空间又留抓手，点一下就展开）；
     编辑态仍是整块 hidden。三个入口（顶栏附件键 / 表头 ⌄ / 窄条）共用这套状态。 */
  function attachHasAny() {
    const note = currentNote();
    return !!(note && note.attachments && note.attachments.length);
  }
  function attachStateOf() {
    const el = $('#attachPanel');
    if (!el || el.classList.contains('hidden')) return 'hidden';
    return el.classList.contains('is-collapsed') ? 'collapsed' : 'open';
  }
  function setAttachState(state) {
    const el = $('#attachPanel');
    if (!el) return;
    if (state !== 'hidden' && !attachHasAny()) state = 'hidden';
    el.classList.toggle('hidden', state === 'hidden');
    el.classList.toggle('is-collapsed', state === 'collapsed');
  }

  $('#attachBtn').addEventListener('click', () => {
    const note = currentNote();
    if (!note) return;
    if (note.attachments && note.attachments.length) {
      setAttachState(attachStateOf() === 'hidden' ? 'open' : 'hidden');
    } else {
      const fi = $('#fileInput');
      fi.accept = '';
      fi.dataset.insert = '';
      fi.click();
    }
  });
  /* 阅读态：⌄ 压成窄条、箭头翻上来；再点窄条（含箭头）展开。
     编辑态：维持原样，点了整块收起。 */
  $('#closeAttachBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    if (noteMode === 'read') {
      const el = $('#attachPanel');
      if (!el) return;
      el.classList.toggle('is-collapsed');
      return;
    }
    setAttachState('hidden');
  });
  /* 窄条整条都是抓手（按钮铺满，这里兜住内边距那几像素） */
  $('#attachPanel').addEventListener('click', (e) => {
    const el = $('#attachPanel');
    if (!el || !el.classList.contains('is-collapsed')) return;
    if (e.target.closest && e.target.closest('#closeAttachBtn')) return;
    el.classList.remove('is-collapsed');
  });
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

  /* 导出备份（整库 JSON）。
     桌面版没有 showSaveFilePicker，改走主进程的 dialog.showSaveDialog ——
     那条通道不挑手势，所以顺序是「先取数据，再弹框」。
     浏览器里反过来：先弹「另存为」再取数据，因为 showSaveFilePicker 必须
     落在点击那一拍的调用栈里，等 fetch 回来再问会被 NotAllowedError 拒掉。
     两样都没有（Firefox / Safari）就退回原来的直接下载。 */
  $('#exportBtn').addEventListener('click', async () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    const stamp = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    const name = `拾笺备份-${stamp}.json`;
    const NE = window.NoteExport;

    if (window.SJDesktop && typeof window.SJDesktop.saveFile === 'function' && NE && NE.saveViaDesktop) {
      toast('正在导出备份…');
      try {
        const res = await fetch('/api/export');
        if (!res.ok) throw new Error('导出失败（HTTP ' + res.status + '）');
        const r = await NE.saveViaDesktop(await res.blob(), name);
        if (r === 'canceled') return;
        toast('已导出：' + name);
      } catch (e) {
        toast('导出失败：' + (e && e.message ? e.message : e));
      }
      return;
    }

    const handle = NE && NE.pickSaveHandle
      ? await NE.pickSaveHandle(name, { types: [{ description: '拾笺备份', accept: { 'application/json': ['.json'] } }] })
      : null;
    if (handle === 'canceled') return;
    toast('正在导出备份…');
    if (!handle) { window.location.href = '/api/export'; return; }
    try {
      const res = await fetch('/api/export');
      if (!res.ok) throw new Error('导出失败（HTTP ' + res.status + '）');
      await NE.writeHandle(handle, await res.blob());
      toast('已导出：' + name);
    } catch (e) {
      toast('导出失败：' + (e && e.message ? e.message : e));
    }
  });

  $('#importBtn').addEventListener('click', () => $('#importInput').click());

  $('#importInput').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 40 * 1024 * 1024) return toast('备份文件超过 40MB，无法导入');
    if (file.name.toLowerCase().endsWith('.vault')) {
      if (window.SJE2EE && window.SJE2EE.importVaultFile) return window.SJE2EE.importVaultFile(file);
      return toast('加密备份模块未加载');
    }

    openConfirm({
      title: '导入备份',
      message: `将把「${escapeHtml(file.name)}」里的类别与笔记合并进来。<br>`
        + `已存在的笔记会跳过，不会覆盖现有内容；导入前会自动备份当前数据。`,
      confirmText: '开始导入',
      onConfirm: async () => {
        toast('正在导入…');
        try {
          let data;
          try { data = JSON.parse(await file.text()); } catch (_) { return toast('不是有效的 JSON 备份文件'); }
          const r = await api('/api/import', { method: 'POST', body: data });
          const s2 = await api('/api/state');
          setState({ categories: s2.categories });
          setState({ notes: s2.notes });
          setState({ selCat: 'all' });
          setState({ selNote: null });
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

  /* 富文本正文行距（显示偏好，存本机）。值是像素，直接写进 line-height。
     ------------------------------------------------------------
     档位下界必须大于「正文基准字号 × 1.1」，否则 CSS 里那条 1.1em 的
     防重叠兜底会把设置值吃掉（原来 1.2em 时，16/18/20 三档在 17px 正文下
     全被 20.4px 盖掉，选了没反应）。
     字号可调之后（阅读态那颗 Aa），下界不能写死 22：24px 正文配 22px 行距
     必然叠字，所以下界一律按当前字号算 —— 桌面 16→20、24→30。 */
  function fsBounds() { return { min: 14, max: 24 }; }
  function fsDefault() { return 16; }
  function clampFs(v) {
    const b = fsBounds();
    const n = Math.round(Number(v) || 0);
    return Math.min(b.max, Math.max(b.min, n));
  }
  function curFs() { return clampFs(state.richFs || fsDefault()); }
  function lhBasePx() { return state.richFs || 16; }
  function lhMin() { return Math.ceil(lhBasePx() * 1.2 / 2) * 2; }
  function lhSteps() {
    const out = [];
    for (let v = lhMin(); v <= 48; v += 2) out.push(v);
    return out;
  }
  function clampLh(v) {
    const n = Math.round(Number(v) || 0);
    return Math.min(48, Math.max(lhMin(), n));
  }
  function applyRichLh() {
    /* 手机端存下来的 16/18/20 拿到电脑上用，一律夹回档内，
       不然下拉框显示一个渲染不出来的值，等于骗人。 */
    setState({ richLh: clampLh(state.richLh) });
    document.documentElement.style.setProperty('--sj-rich-lh', state.richLh + 'px');
  }
  function applyRichFs() {
    if (state.richFs) document.documentElement.style.setProperty('--sj-rich-fs', state.richFs + 'px');
    else document.documentElement.style.removeProperty('--sj-rich-fs');
    applyRichLh();
    rebuildLhOptions();
  }

  /* 主题 */
  function applyTheme(t) {
    setState({ theme: t });
    document.documentElement.dataset.theme = t;
    localStorage.setItem('sj_theme', t);
  }
  $('#themeBtn').addEventListener('click', () => applyTheme(state.theme === 'light' ? 'dark' : 'light'));

  /* 快捷键提示按平台显示。
     Windows / Linux 键盘上没有 ⌘ 这颗键，界面上写着 ⌘K 等于让用户去按一个
     不存在的键（用户 2026-11-22 问「⌘ 是否有效」）。功能本身没问题：下面
     keydown 里判断的都是 e.metaKey || e.ctrlKey，Windows 上用 Ctrl 全通。 */
  const IS_MAC = /Mac|iPhone|iPad|iPod/i.test(
    (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent || ''
  );
  function applyPlatformKeyLabels() {
    const kbd = document.getElementById('searchKbd');
    if (kbd) kbd.textContent = IS_MAC ? '⌘K' : 'Ctrl K';
    const undo = document.getElementById('sjUndoBtn');
    if (undo) undo.title = IS_MAC ? '撤销 (⌘Z)' : '撤销 (Ctrl+Z)';
    const redo = document.getElementById('sjRedoBtn');
    if (redo) redo.title = IS_MAC ? '重做 (⌘⇧Z)' : '重做 (Ctrl+Shift+Z)';
  }
  applyPlatformKeyLabels();

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
      if (noteMode === 'edit') {
        e.preventDefault();
        exec(e.key === 'b' ? 'bold' : 'italic');
      }
      return;
    }
    /* Ctrl/⌘ + E：行内代码。和上面一组一样，只在编辑态接管。 */
    if (mod && e.key.toLowerCase() === 'e' && !e.shiftKey) {
      const note = currentNote();
      if (!note) return;
      if (noteMode === 'edit') {
        e.preventDefault();
        toggleInlineCode();
      }
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
  });

  $('#modalRoot').addEventListener('click', (e) => {
    if (e.target.id === 'modalRoot') closeModal();
  });

  /* ---------------------------------------------------------- 启动 */
  /** 冷启动回到上次所在的类别；类别/标签已删就退回「全部笔记」。
      只恢复类别，不恢复上次打开的那篇笔记。 */
  function restoreLastCat() {
    let v = '';
    try { v = localStorage.getItem(SJ_LAST_CAT) || ''; } catch (_) {}
    if (!v || v === 'all') return;
    let ok = v === 'starred' || v === 'uncat';
    if (!ok && String(v).startsWith('tag:')) {
      ok = state.notes.some((n) => (n.tags || []).includes(v.slice(4)));
    }
    if (!ok) ok = state.categories.some((c) => c.id === v);
    if (ok) setState({ selCat: v });
  }

  async function boot() {
    applyTheme(state.theme);
    applyRichFs();
    applyRichLh();
    try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (_) {}
    try {
      const data = await api('/api/state');
      setState({ categories: data.categories || [] });
      setState({ notes: data.notes || [] });
      /* 启动时体检合并了重复笔记：说一声，别让笔记「凭空少一条」让人以为丢了。 */
      const heal = data.meta && data.meta.heal;
      if (heal && heal.notesMerged) {
        const first = (heal.titles || []).filter(Boolean)[0];
        setTimeout(() => toast(
          `已自动合并 ${heal.notesMerged} 篇重复笔记${first ? `（如「${first}」）` : ''}，旧稿在回收站 30 天内可恢复`,
        ), 900);
      }
    } catch (e) {
      toast('加载数据失败：' + e.message);
    }

    restoreLastCat();
    applyRecentState();
    $('#statText').textContent = `${state.notes.length} 篇 · ${state.categories.length} 个类别`;
    renderTree();
    renderList();

    /* 深链：?note=<id> 直接打开目标笔记；读完删参数，避免刷新重复。 */
    let deepId = '';
    try {
      const u = new URL(location.href);
      deepId = u.searchParams.get('note') || '';
      if (deepId) {
        u.searchParams.delete('note');
        history.replaceState(null, '', u.toString());
      }
    } catch (_) {}

    if (deepId && state.notes.some((n) => n.id === deepId)) {
      openNote(deepId);
    } else if (state.selNote && state.notes.some((n) => n.id === state.selNote)) {
      /* ?action=new 等快捷方式可能已先建好笔记，保持当前这篇。 */
      openNote(state.selNote);
    } else {
      /* 冷启动：列表开场。宽屏三栏里列表常驻，只需收起编辑器；窄屏把
         列表抽屉滑出来。保存时机一律不动。 */
      closeEditor();
      if (NARROW()) openDrawer('list');
      else closeDrawer();
    }
  }

  boot();

  // 供增强模块（fts/backlinks/diffview/conflict/e2ee）与同步模块调用
  window.SJNotes = () => state.notes;
  window.SJState = state;
  window.SJApi = api;
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.SJLocal = {
    refresh() { renderTree(); renderList(); },
    saveNow() { if (typeof saveNow === 'function') saveNow(); },
    getState() { return state; },
    async importBackup(backup) {
      await api('/api/import', { method: 'POST', body: backup });
      const s2 = await api('/api/state');
      setState({ categories: s2.categories || [] });
      setState({ notes: s2.notes || [] });
      setState({ selCat: 'all' });
      setState({ selNote: null });
      closeEditor();
      renderTree(); renderList(); renderTags();
    },
  };
  /* 供 sjplus.js（回收站 / 回顾 / 整库导出）调用 */
  window.SJRefresh = () => { renderTree(); renderList(); };
  window.SJOpenNote = (id) => openNote(id);
  /* -72：崩溃恢复提示排到首屏之后，不与启动渲染抢 DOM。 */
  setTimeout(offerEditDraft, 600);

  /* ============================================================
     A+B：三栏可收起 + 栏间可拖拽（桌面端 only）
     - 不进两端共有函数集，t69 漂移守卫不会触发
     - 仅写 localStorage 布局偏好，绝不碰 state / 保存时机
     - 窄屏（NARROW）完全不注入分隔条、不触发收起，交回抽屉逻辑
  ============================================================ */
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  const NAV_K = 'sj_nav', W_SB_K = 'sj_sidebar_w', W_LIST_K = 'sj_list_w';
  /* 侧栏最小 232 = 图标栏 52 + 原来 180 的内容区，保证目录别被压到没法看 */
  const SB_MIN = 232, SB_MAX = 460, LIST_MIN = 220, LIST_MAX = 560;

  function navLoad() {
    let c = { sb: false, list: false };
    try { c = Object.assign(c, JSON.parse(localStorage.getItem(NAV_K) || '{}')); } catch (_) {}
    const app = document.querySelector('.app');
    let sbW = clamp(parseInt(localStorage.getItem(W_SB_K)) || 320, SB_MIN, SB_MAX);
    /* 侧栏加图标栏后，旧存档里的宽度（多半是 268 这个老默认）会让内容区凭空
       窄掉 52px。只迁移一次：把窄于 320 的旧值抬到 320，之后尊重用户自己拖的值。 */
    try {
      if (!localStorage.getItem('sj_rail_v1')) {
        localStorage.setItem('sj_rail_v1', '1');
        if (sbW < 320) sbW = 320;
      }
    } catch (_) {}
    const lw = clamp(parseInt(localStorage.getItem(W_LIST_K)) || 312, LIST_MIN, LIST_MAX);
    app.style.setProperty('--sidebar-w', sbW + 'px');
    app.style.setProperty('--list-w', lw + 'px');
    document.body.classList.toggle('nav-sb-collapse', !!c.sb);
    document.body.classList.toggle('nav-list-collapse', !!c.list);
    return c;
  }
  function navSave(c) { try { localStorage.setItem(NAV_K, JSON.stringify(c)); } catch (_) {} }
  function navInVar(which) { return which === 'sb' ? '--sidebar-w' : '--list-w'; }
  function navWKey(which) { return which === 'sb' ? W_SB_K : W_LIST_K; }
  function navBounds(which) { return which === 'sb' ? [SB_MIN, SB_MAX] : [LIST_MIN, LIST_MAX]; }

  function toggleNav(which, c) {
    if (NARROW()) return;
    const key = which === 'sb' ? 'nav-sb-collapse' : 'nav-list-collapse';
    const on = document.body.classList.toggle(key);
    c[which] = on; navSave(c);
  }
  function expandNav(c) {
    if (document.body.classList.contains('nav-sb-collapse')) toggleNav('sb', c);
    if (document.body.classList.contains('nav-list-collapse')) toggleNav('list', c);
  }
  function bindDrag(el, which, c) {
    el.addEventListener('pointerdown', (e) => {
      if (NARROW()) return;
      e.preventDefault();
      const app = document.querySelector('.app');
      const varn = navInVar(which), wkey = navWKey(which);
      const [min, max] = navBounds(which);
      const startX = e.clientX;
      const startW = clamp(
        parseInt(getComputedStyle(app).getPropertyValue(varn)) || (which === 'sb' ? 320 : 312),
        min, max
      );
      app.classList.add('nav-dragging');
      const move = (ev) => {
        const w = clamp(startW + (ev.clientX - startX), min, max);
        app.style.setProperty(varn, w + 'px');
      };
      const up = () => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        app.classList.remove('nav-dragging');
        const w = parseInt(getComputedStyle(app).getPropertyValue(varn)) || (which === 'sb' ? 320 : 312);
        try { localStorage.setItem(wkey, String(w)); } catch (_) {}
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    });
  }
  function initDividers(c) {
    const app = document.querySelector('.app');
    if (app.querySelector('.divider')) return;
    const sb = app.querySelector('.sidebar'), lp = app.querySelector('.list-pane');
    const d1 = document.createElement('div'); d1.className = 'divider div1';
    const d2 = document.createElement('div'); d2.className = 'divider div2';
    sb.after(d1); lp.after(d2);
    bindDrag(d1, 'sb', c); bindDrag(d2, 'list', c);
  }
  /* 收起侧栏/列表用「面板折叠」图标（方框 + 竖线 + 左箭头），
     和编辑区返回的单箭头区分开，避免两个箭头长得一样。 */
  function svgCollapse() {
    return '<svg viewBox="0 0 24 24" class="ico"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M9 4.5v15"/><path d="M16.5 9.5l-3 2.5 3 2.5"/></svg>';
  }
  function initNavUI(c) {
    const sbBtn = document.createElement('button');
    sbBtn.className = 'icon-btn nav-collapse-sb';
    sbBtn.title = '收起侧栏'; sbBtn.setAttribute('aria-label', '收起侧栏');
    sbBtn.innerHTML = svgCollapse();
    sbBtn.addEventListener('click', () => toggleNav('sb', c));
    const brand = document.querySelector('.brand'); if (brand) brand.appendChild(sbBtn);

    const listBtn = document.createElement('button');
    listBtn.className = 'icon-btn nav-collapse-list';
    listBtn.title = '收起列表'; listBtn.setAttribute('aria-label', '收起列表');
    listBtn.innerHTML = svgCollapse();
    listBtn.addEventListener('click', () => toggleNav('list', c));
    const lh = document.querySelector('.list-head'); if (lh) lh.appendChild(listBtn);

    const resume = document.createElement('div');
    resume.className = 'nav-resume'; resume.textContent = '展开导航';
    resume.addEventListener('click', () => expandNav(c));
    const ep = document.querySelector('.editor-pane'); if (ep) ep.appendChild(resume);

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault(); toggleNav('sb', c); toggleNav('list', c);
      }
    });
  }
  /* 悬停信息浮层：合并掉列表栏后树里的笔记行只剩标题。悬停哪行，就在那行下方
     弹一张小卡片补回日期与标签——不写死贴在侧栏底部（早年那版把文字压在目录
     最后几行上，读不清也没法判断属于哪一篇）。浮层不占布局高度、不推挤目录，
     空间不够时自动翻到行的上方，坐标夹在目录滚动区内。仅桌面端挂载（触屏无 hover）。 */
  function showTreeMeta(row) {
    const meta = $('#treeMeta');
    if (!meta) return;
    const n = row ? state.notes.find((x) => x.id === row.dataset.nid) : null;
    if (!n) { meta.classList.remove('on'); return; }
    const tags = (n.tags || []).slice(0, 3).map((t) => '#' + t).join(' ');
    /* 标题在行里被省略号截断时，卡片第一行补全——原生 title 已经摘掉了，
       这里得接住「看不全标题」的需求。 */
    const nameEl = row.querySelector('.tree-note-name');
    const cut = !!nameEl && nameEl.scrollWidth > nameEl.clientWidth + 1;
    meta.innerHTML = (cut ? `<span class="tree-meta-title">${escapeHtml(n.title || '无标题笔记')}</span>` : '')
      + '<span class="tree-meta-line">'
      + `<span class="tree-meta-date">${fmtDate(n.updatedAt)}</span>`
      + (tags ? `<span class="tree-meta-tags">${escapeHtml(tags)}</span>` : '')
      + '</span>';
    /* 夹在目录自己的滚动区里，而不是整个视口：挨着底部的行宁可翻到上方，
       也不要盖住下面的「标签」区或顶上的搜索框。 */
    const scEl = $('#sideScroll');
    const c = scEl ? scEl.getBoundingClientRect()
      : { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
    /* 侧栏被拖窄时卡片跟着收，别越过分隔条压到列表上 */
    meta.style.maxWidth = Math.max(120, Math.min(300, c.width - 16)) + 'px';
    /* 先归零再量：浮层是 fixed，尺寸不依赖位置，量完才能算夹取后的坐标 */
    meta.style.left = '0px';
    meta.style.top = '0px';
    meta.classList.add('on');
    const r = row.getBoundingClientRect();
    const w = meta.offsetWidth, h = meta.offsetHeight;
    const maxLeft = Math.max(c.left + 8, c.right - w - 8);
    const left = Math.max(c.left + 8, Math.min(r.left + 10, maxLeft));
    let top = r.bottom + 5;
    if (top + h > c.bottom - 4) top = r.top - h - 5;      // 下面放不下就翻到行上方
    top = Math.max(c.top + 4, Math.min(top, c.bottom - h - 4));
    meta.style.left = left + 'px';
    meta.style.top = top + 'px';
  }
  function bindTreeMeta() {
    const tree = $('#tree');
    if (!tree || tree.dataset.meta) return;
    tree.dataset.meta = '1';
    /* 稍等一下再弹：鼠标扫过目录时不该每行都闪一张卡片，停住不动才给它看详情 */
    let metaTimer = null;
    const hideSoon = () => { clearTimeout(metaTimer); showTreeMeta(null); };
    tree.addEventListener('pointerover', (e) => {
      const row = e.target.closest('.tree-note');
      clearTimeout(metaTimer);
      if (!row) return showTreeMeta(null);
      metaTimer = setTimeout(() => showTreeMeta(row), 120);
    });
    tree.addEventListener('pointerleave', hideSoon);
    /* 滚动发生在 .side-scroll 上（最近笔记与目录共用一个滚动区），不是 #tree */
    const sc = $('#sideScroll');
    if (sc) sc.addEventListener('scroll', hideSoon, { passive: true });
    window.addEventListener('resize', hideSoon);
  }
  function initNavLayout() {
    if (NARROW()) return;            // 窄屏走抽屉，不注入分隔条 / 不收起
    const c = navLoad();
    initDividers(c);
    initNavUI(c);
    bindTreeMeta();
  }
  initNavLayout();

})();
