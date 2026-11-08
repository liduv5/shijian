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

  /* ---------------------------------------------------------- 状态 */
  const state = {
    categories: [],
    notes: [],
    selCat: 'all',
    selNote: null,
    search: '',
    viewMode: localStorage.getItem('sj_view') || 'split',
    theme: localStorage.getItem('sj_theme') || 'light',
    dirty: false,
  };

  const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name, 'zh');
  const catMap = () => new Map(state.categories.map((c) => [c.id, c]));
  const noteById = (id) => state.notes.find((n) => n.id === id) || null;

  /* ---------------------------------------------------------- API */
  async function api(path, { method = 'GET', body } = {}) {
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
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2000);
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
    } else {
      commitMdImgWidth(pct);
      const pane = $('#previewPane');
      const again = pane ? pane.querySelectorAll('img')[imgIdx] : null;
      if (again) {
        imgEl = again;
        again.classList.add('sj-img-picked');
      }
    }
  }

  function resetStyleWidth(tag, pct) {
    const m = tag.match(/\sstyle\s*=\s*("([^"]*)"|'([^']*)')/i);
    const cur = m ? (m[2] != null ? m[2] : m[3]) || '' : '';
    const kept = cur.split(';').map((s) => s.trim())
      .filter((s) => s && !/^width\s*:/i.test(s));
    if (pct != null) kept.push(`width:${pct}%`);
    const attr = kept.length ? ` style="${kept.join(';')}"` : '';
    if (m) return tag.replace(m[0], attr);
    return attr ? tag.replace(/\s*\/?>$/, (s) => `${attr}${s}`) : tag;
  }

  /* 按出现顺序收集正文里的图片标记，跳过围栏代码块与行内 code
     （marked 不会把代码块里的 ![]() 渲染成图，若计入索引会整体错位） */
  function mdImageTokens(md) {
    const holes = [];
    const fenceRe = /```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`/g;
    let f;
    while ((f = fenceRe.exec(md))) holes.push([f.index, f.index + f[0].length]);
    const re = /<img\b[^>]*>|!\[[^\]]*\]\(\s*[^)\s]+(?:\s+"[^"]*")?\s*\)/gi;
    const out = [];
    let m;
    while ((m = re.exec(md))) {
      const s = m.index, e = s + m[0].length;
      let inside = false;
      for (let i = 0; i < holes.length; i++) {
        if (s >= holes[i][0] && e <= holes[i][1]) { inside = true; break; }
      }
      if (!inside) out.push({ start: s, end: e, text: m[0] });
    }
    return out;
  }

  function commitMdImgWidth(pct) {
    const ta = $('#mdInput');
    if (!ta || imgIdx < 0) return;
    const toks = mdImageTokens(ta.value);
    const tok = toks[imgIdx];
    if (!tok) return;
    let out;
    if (tok.text.charAt(0) === '<') {
      out = resetStyleWidth(tok.text, pct);
    } else {
      if (pct == null) return;
      const m = tok.text.match(/^!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)$/);
      if (!m) return;
      const alt = (m[1] || '').replace(/"/g, '&quot;');
      out = `<img src="${m[2]}" alt="${alt}" style="width:${pct}%">`;
    }
    const md = ta.value;
    ta.value = md.slice(0, tok.start) + out + md.slice(tok.end);
    onMdInput();
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

  function pseudoRow(key, label, icon, count) {
    const row = document.createElement('div');
    row.className = 'tree-row' + (state.selCat === key ? ' active' : '');
    row.dataset.pseudo = key;
    row.innerHTML = `
      <span class="caret leaf"></span>
      <span class="tree-label" style="padding-left:2px">${label}</span>
      <span class="tree-count">${count}</span>`;
    row.querySelector('.tree-label').insertAdjacentHTML('afterbegin', icon.replace('class="ico"', 'class="ico" style="width:14px;height:14px;margin-right:7px;vertical-align:-2px"'));
    return row;
  }

  function renderTree() {
    const tree = $('#tree');
    tree.innerHTML = '';
    $('#statText').textContent = `${state.notes.length} 篇 · ${state.categories.length} 个类别`;

    tree.appendChild(pseudoRow('all', '全部笔记', I.grid, state.notes.length));
    tree.appendChild(pseudoRow('starred', '收藏', I.star, state.notes.filter((n) => n.starred).length));
    tree.appendChild(pseudoRow('uncat', '未分类', I.inbox, state.notes.filter((n) => !n.categoryId).length));

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

    const row = document.createElement('div');
    row.className = 'tree-row' + (state.selCat === cat.id ? ' active' : '') + (collapsed ? ' collapsed' : '');
    row.dataset.id = cat.id;
    row.dataset.depth = depth;
    row.style.paddingLeft = 4 + depth * 14 + 'px';
    row.innerHTML = `
      <span class="caret${kids.length ? '' : ' leaf'}" data-act="toggle">${I.chevron}</span>
      <span class="tree-label">${escapeHtml(cat.name)}</span>
      <span class="tree-count">${subtreeCount(cat.id, state.notes)}</span>
      <span class="tree-acts">
        <button class="tree-act" data-act="add" title="新建子类别">${I.plus}</button>
        <button class="tree-act" data-act="more" title="更多">${I.dots}</button>
      </span>`;
    frag.appendChild(row);

    if (kids.length) {
      const box = document.createElement('div');
      box.className = 'tree-children' + (collapsed ? ' collapsed' : '');
      kids.forEach((k) => box.appendChild(catNode(k, depth + 1)));
      frag.appendChild(box);
    }
    return frag;
  }

  function toggleCat(id) {
    const cat = state.categories.find((c) => c.id === id);
    if (!cat) return;
    cat.expanded = !cat.expanded;
    api(`/api/categories/${id}`, { method: 'PATCH', body: { expanded: cat.expanded } }).catch(() => {});
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
    let t = note.content || '';
    if (note.format === 'rich') {
      /* 用 DOMParser 取纯文本：不挂载节点、不加载资源、不触发 onerror。
         直接 innerHTML 会让 <img onerror> 在游离节点里也发起加载并执行，
         恶意备份/云端数据可借此窃取全部笔记（存储型 XSS）。 */
      t = new DOMParser().parseFromString(String(t), 'text/html').body.textContent || '';
    } else {
      t = t
        .replace(/```[\s\S]*?```/g, ' [代码] ')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' [图片] ')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/[#>*_`~|-]/g, ' ')
        .replace(/\n+/g, ' ');
    }
    return t.replace(/\s+/g, ' ').trim();
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
        return ranked.length ? ranked : state.notes.slice();
      }
      const terms = state.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
      list = list.filter((n) => {
        const hay = (n.title + ' ' + (n.tags || []).join(' ') + ' ' + plainText(n)).toLowerCase();
        return terms.every((t) => t.indexOf('tag:') === 0
          ? (n.tags || []).some((x) => String(x).toLowerCase().includes(t.slice(4)))
          : hay.includes(t));
      });
      return list.slice().sort((a, b) => b.updatedAt - a.updatedAt);
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
    return list.slice().sort((a, b) => b.updatedAt - a.updatedAt);
  }

  function renderList() {
    const box = $('#noteList');
    const list = notesInScope();
    box.innerHTML = '';

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
    for (const n of list) {
      const card = document.createElement('div');
      card.className = 'note-card' + (state.selNote === n.id ? ' active' : '');
      card.dataset.id = n.id;
      card.draggable = true;
      const snippet = plainText(n).slice(0, 90);
      card.innerHTML = `
        <button class="note-more" data-more="1" aria-label="更多操作" title="更多操作">${I.dots}</button>
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

  /* 只发 tags 字段，绝不覆盖正文（避免刚编辑但未保存的内容被服务端的旧值冲掉） */
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
  if (tagManageBtn) tagManageBtn.addEventListener('click', openTagManager);

  /* ---------------------------------------------------------- 编辑器 */
  const currentNote = () => noteById(state.selNote);

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

  /* 旧云端数据漏写 format 时，富文本正文会在 Markdown 编辑器里显示成源码。
     打开时只在 format 缺失/非法时兜底改回 rich 并持久化，与手机端保持一致；
     format 明确为 md 的笔记（含用户主动转换、正文带内联 <img>）不动。 */
  function looksRichContent(content) {
    return typeof content === 'string'
      && /<img\s[^>]*src=["'](?:\/api\/files\/|data:image\/)/i.test(content);
  }

  function openNote(id, { focusTitle = false } = {}) {
    /* 离开当前笔记：先把脏数据落盘，再切换选中项。所有打开笔记的路径
       （列表、搜索、双链、外部调用）都会经过这里，不用逐个补钩子。 */
    if (state.selNote && state.selNote !== id) void saveNow();
    const note = noteById(id);
    if (!note) return;
    if (note.format !== 'rich' && note.format !== 'md' && looksRichContent(note.content)) {
      note.format = 'rich';
      api(`/api/notes/${note.id}`, { method: 'PATCH', body: { format: 'rich' } }).catch(() => {});
    }
    state.selNote = id;
    state.dirty = false;
    savedSnapshot = snapshot(note);
    viewFormat = note.format === 'rich' ? 'rich' : 'md';

    $('#emptyState').classList.add('hidden');
    $('#editorWrap').classList.remove('hidden');

    $('#titleInput').value = note.title || '';
    $('#starBtn').classList.toggle('on', !!note.starred);

    $('#mdInput').value = viewFormat === 'rich' ? '' : note.content || '';
    $('#richPane').innerHTML = viewFormat === 'rich' ? DOMPurify.sanitize(note.content || '') : '';
    $('#richPane').classList.toggle('hidden', viewFormat !== 'rich');
    $('#mdPane').classList.toggle('hidden', viewFormat !== 'md');

    const cat = catMap().get(note.categoryId);
    $('#metaInfo').textContent = `${cat ? cat.name : '未分类'} · 创建于 ${fmtDate(note.createdAt)}`;
    setSaveState('', `已保存 ${new Date(note.updatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`);

    applyFormat(viewFormat);
    if (viewFormat === 'md') refreshPreview();
    renderToolbar();
    renderAttachments();
    renderNoteTags();
    renderList();
    if (window.SJBacklinks) window.SJBacklinks.refresh(note);
    updateAttachBadge();
    wordCount();

    $('#attachPanel').classList.toggle('hidden', !(note.attachments && note.attachments.length));

    if (focusTitle) {
      $('#titleInput').focus();
      $('#titleInput').select();
    }
  }

  function applyFormat(format) {
    const note = currentNote();
    if (!note) return;
    const isMd = format !== 'rich';
    $$('#formatSwitch button').forEach((b) => b.classList.toggle('on', (b.dataset.format === 'md') === isMd));
    $('#mdPane').classList.toggle('hidden', !isMd);
    $('#richPane').classList.toggle('hidden', isMd);
    $('#editorBody').classList.toggle('is-rich', !isMd);
    // 窄屏放不下分屏，自动按「仅编辑」处理（用户手动切到预览仍然有效）
    const mode = NARROW() && state.viewMode === 'split' ? 'edit' : state.viewMode;
    $('#editorBody').classList.toggle('mode-edit', isMd && mode === 'edit');
    $('#editorBody').classList.toggle('mode-preview', isMd && mode === 'preview');
  }

  function refreshPreview() {
    const note = currentNote();
    if (!note || viewFormat !== 'md') return;
    const html = renderMarkdown($('#mdInput').value);
    const pane = $('#previewPane');
    pane.innerHTML = html;
    decorate(pane);
  }

  /* 保存：编辑期间只标脏、不写盘；离开编辑页时统一落盘。
     快照用来识别「改完又改回原样」——内容和已存版本一致就不写盘。
     编辑模式属于视图状态：切换只改显示，不写回笔记、不标脏。 */
  let savedSnapshot = '';
  /* 编辑器当前显示的模式，可能与笔记数据里的 format 不同。
     只有在新模式下真正输入，内容与模式才一起写回笔记。 */
  let viewFormat = 'md';
  function snapshot(n) {
    return JSON.stringify([n.title || '', n.content || '', n.format || 'md',
      n.categoryId || null, !!n.starred, n.tags || []]);
  }
  function markDirty() {
    const note = currentNote();
    if (!note) return;
    if (snapshot(note) === savedSnapshot) {
      state.dirty = false;
      setSaveState('saved');
      return;
    }
    state.dirty = true;
    setSaveState('dirty', '未保存 · 离开时保存');
  }

  async function saveNow() {
    const note = currentNote();
    if (!note || !state.dirty) return;
    const savingId = note.id;
    state.dirty = false;
    try {
      const updated = await api(`/api/notes/${note.id}`, {
        method: 'PATCH',
        body: {
          title: note.title, content: note.content, format: note.format,
          categoryId: note.categoryId, starred: note.starred, tags: note.tags || [],
        },
      });
      Object.assign(note, updated);
      /* 已经切到别的笔记时，别用旧笔记的快照覆盖新笔记的。 */
      if (state.selNote === savingId) {
        savedSnapshot = snapshot(note);
        setSaveState('saved');
      }
      renderList();
    } catch (e) {
      state.dirty = true;
      setSaveState('error', '保存失败，请重试');
      toast(e.message);
    }
  }

  /* 正文输入：只有真正输入才把编辑器内容与该编辑器对应的模式写回笔记。
     用字面格式而非 viewFormat：内容来自哪个编辑器，数据格式就必须是哪个，
     即使有外部代码误触了隐藏编辑器的 input 事件也不会产生格式错配。 */
  function onMdInput() {
    const note = currentNote();
    if (!note) return;
    note.content = $('#mdInput').value;
    note.format = 'md';
    note.updatedAt = Date.now();
    refreshPreview();
    wordCount();
    markDirty();
  }

  function onRichInput() {
    const note = currentNote();
    if (!note) return;
    note.content = $('#richPane').innerHTML;
    note.format = 'rich';
    note.updatedAt = Date.now();
    wordCount();
    markDirty();
  }

  /* 编辑模式是视图状态，不是内容修改：切换时只在编辑器 DOM 里转换显示，
     不写回 note、不标脏、不改 updatedAt。只有在新模式下真正输入，
     onMdInput / onRichInput 才把内容与模式一起写回并标脏。
     因此单纯切模式（含来回切）离开时不会产生保存 / 同步 / 时间戳变化。 */
  async function switchFormat(target) {
    if (!currentNote() || viewFormat === target) return;
    if (target === 'rich') {
      $('#richPane').innerHTML = DOMPurify.sanitize(renderMarkdown($('#mdInput').value));
      $('#mdPane').classList.add('hidden');
      $('#richPane').classList.remove('hidden');
    } else {
      $('#mdInput').value = td.turndown($('#richPane').innerHTML)
        .replace(/- {3}\[([ xX])\]/g, '- [$1]')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      $('#richPane').classList.add('hidden');
      $('#mdPane').classList.remove('hidden');
    }
    viewFormat = target;
    applyFormat(viewFormat);
    renderToolbar();
    if (viewFormat === 'md') refreshPreview();
    else decorateRichAttachments();
    toast(viewFormat === 'md' ? '已转为 Markdown，可查看源码' : '已转为富文本，可所见即所得编辑');
  }

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

    if (viewFormat === 'md') {
      // 视图切换（窄屏不提供分屏，两栏放不下）
      const narrow = NARROW();
      const cur = narrow && state.viewMode === 'split' ? 'edit' : state.viewMode;
      const views = [
        { k: 'edit', icon: I.pen, t: '仅编辑' },
        { k: 'split', icon: I.columns, t: '分屏' },
        { k: 'preview', icon: I.eye, t: '仅预览' },
      ].filter((v) => !narrow || v.k !== 'split');
      views.forEach((v) => {
        btn(v.icon, v.t, () => {
          state.viewMode = v.k;
          localStorage.setItem('sj_view', v.k);
          applyFormat(viewFormat);
          renderToolbar();
        }, cur === v.k ? 'active' : '');
      });
      sep();
      btn('<span class="tb-text">H1</span>', '一级标题', () => prefixLine('# '));
      btn('<span class="tb-text">H2</span>', '二级标题', () => prefixLine('## '));
      btn('<span class="tb-text">H3</span>', '三级标题', () => prefixLine('### '));
      sep();
      btn(I.bold, '加粗  ⌘B', () => wrapSel('**', '**', '粗体'));
      btn(I.italic, '斜体  ⌘I', () => wrapSel('*', '*', '斜体'));
      btn(I.strike, '删除线', () => wrapSel('~~', '~~', '删除线'));
      btn(I.code, '行内代码', () => wrapSel('`', '`', 'code'));
      sep();
      btn(I.quote, '引用', () => prefixLine('> '));
      btn(I.list, '无序列表', () => prefixLine('- '));
      btn(I.listOrdered, '有序列表', () => prefixLine('1. '));
      btn(I.check, '任务列表', () => prefixLine('- [ ] '));
      sep();
      btn(I.code, '代码块', insertCodeBlock);
      btn(I.link, '链接  ⌘K', insertLink);
      btn(I.table, '表格', insertTable);
      btn(I.hr, '分隔线', () => insertAtCursor('\n---\n'));
      return;
    }

    // 富文本
    btn(I.bold, '加粗', () => exec('bold'));
    btn(I.italic, '斜体', () => exec('italic'));
    btn(I.strike, '删除线', () => exec('strikeThrough'));
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
    btn(I.hr, '分隔线', () => exec('insertHorizontalRule'));
    const clearBtn = btn('<span class="tb-text" style="font-weight:600">Tx</span>', '清除格式', () => exec('removeFormat'), '');
    clearBtn.style.marginLeft = 'auto';
  }

  /* markdown 编辑辅助 */
  function insertAtCursor(text) {
    const ta = $('#mdInput');
    const s = ta.selectionStart, e = ta.selectionEnd;
    const val = ta.value;
    ta.value = val.slice(0, s) + text + val.slice(e);
    ta.selectionStart = ta.selectionEnd = s + text.length;
    ta.focus();
    onMdInput();
  }

  function wrapSel(before, after, placeholder) {
    const ta = $('#mdInput');
    const s = ta.selectionStart, e = ta.selectionEnd;
    const val = ta.value;
    const sel = val.slice(s, e) || placeholder;
    ta.value = val.slice(0, s) + before + sel + after + val.slice(e);
    ta.selectionStart = s + before.length;
    ta.selectionEnd = s + before.length + sel.length;
    ta.focus();
    onMdInput();
  }

  function prefixLine(prefix) {
    const ta = $('#mdInput');
    const val = ta.value;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const lineStart = val.lastIndexOf('\n', s - 1) + 1;
    let lineEnd = val.indexOf('\n', e);
    if (lineEnd === -1) lineEnd = val.length;
    const block = val.slice(lineStart, lineEnd);
    const changed = block
      .split('\n')
      .map((l) => (l.startsWith(prefix) ? l.slice(prefix.length) : prefix + l))
      .join('\n');
    ta.value = val.slice(0, lineStart) + changed + val.slice(lineEnd);
    ta.selectionStart = lineStart;
    ta.selectionEnd = lineStart + changed.length;
    ta.focus();
    onMdInput();
  }

  function insertCodeBlock() {
    const ta = $('#mdInput');
    const s = ta.selectionStart, e = ta.selectionEnd;
    const val = ta.value;
    const sel = val.slice(s, e) || '在这里写代码';
    const text = `\n\`\`\`js\n${sel}\n\`\`\`\n`;
    ta.value = val.slice(0, s) + text + val.slice(e);
    const pos = s + 7;
    ta.selectionStart = pos;
    ta.selectionEnd = pos + sel.length;
    ta.focus();
    onMdInput();
  }

  function insertLink() {
    const ta = $('#mdInput');
    const s = ta.selectionStart, e = ta.selectionEnd;
    const val = ta.value;
    const sel = val.slice(s, e) || '链接文字';
    const text = `[${sel}](https://)`;
    ta.value = val.slice(0, s) + text + val.slice(e);
    ta.selectionStart = s + text.length - 1;
    ta.selectionEnd = s + text.length - 1;
    ta.focus();
    onMdInput();
  }

  function insertTable() {
    const text = `\n| 列一 | 列二 | 列三 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |\n`;
    insertAtCursor(text);
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

  function exec(cmd, value) {
    const pane = $('#richPane');
    pane.focus();
    restoreRange();
    try { document.execCommand('styleWithCSS', false, false); } catch (_) {}
    document.execCommand(cmd, false, value);
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
    pane.focus();
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
    } else {
      document.execCommand('insertText', false, text);
    }
    onRichInput();
  });

  /* ---------------------------------------------------------- 附件 */
  function updateAttachBadge() {
    const note = currentNote();
    const n = note ? (note.attachments || []).length : 0;
    $('#attCount').textContent = n;
    $('#attachBtn').classList.toggle('has', n > 0);
  }

  /* 附件显示地址：手机端附件自带 data URL 直接内嵌；桌面端由服务端 /api/files/<id> 提供。 */
  function attDisplaySrc(a) {
    return (a && a.data) ? a.data : '/api/files/' + (a && a.id);
  }

  function renderAttachments() {
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
          <div class="att-name" title="${escapeHtml(a.name)}">${escapeHtml(a.name)}</div>
          <div class="att-size">${size}</div>
        </div>
        <div class="att-acts">
          <button class="att-act" data-act="insert" title="插入到正文">${I.plus}</button>
          <a class="att-act" href="${attDisplaySrc(a)}" download="${escapeHtml(a.name)}" title="下载">${I.download}</a>
          <button class="att-act del" data-act="del" title="删除附件">${I.x}</button>
        </div>`;
      el.querySelector('[data-act="insert"]').addEventListener('click', () => insertAttachment(a));
      el.querySelector('[data-act="del"]').addEventListener('click', () => deleteAttachment(a));
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
      $('#attachPanel').classList.remove('hidden');
      toast(`已添加 ${ok} 个附件`);
      inserted.forEach((att) => insertAttachment(att));
    }
  }

  function insertAttachment(a) {
    const note = currentNote();
    if (!note) return;
    const isImg = /^image\//.test(a.type);
    if (viewFormat === 'rich') {
      const pane = $('#richPane');
      pane.focus();
      const html = isImg
        ? `<img src="${attDisplaySrc(a)}" alt="${escapeHtml(a.name)}" style="max-width:100%;height:auto;border-radius:8px;display:block;margin:8px 0">`
        : `<a href="${attDisplaySrc(a)}" target="_blank">${escapeHtml(a.name)}</a>`;
      document.execCommand('insertHTML', false, html);
      onRichInput();
    } else {
      const ta = $('#mdInput');
      const s = ta.selectionStart;
      const md = isImg ? `\n![${a.name}](/api/files/${a.id})\n` : `\n[${a.name}](/api/files/${a.id})\n`;
      ta.value = ta.value.slice(0, s) + md + ta.value.slice(ta.selectionEnd);
      ta.selectionStart = ta.selectionEnd = s + md.length;
      ta.focus();
      onMdInput();
    }
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
          <span><b>连同笔记一起删除</b><span>笔记与附件将被永久删除，无法恢复</span></span>
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
      } catch (e) { toast(e.message); }
    };
  }

  /* 笔记操作 */
  async function createNote(categoryId) {
    await saveNow();
    let target = categoryId;
    if (target === undefined) {
      target = state.categories.some((c) => c.id === state.selCat) ? state.selCat : null;
    }
    try {
      const note = await api('/api/notes', {
        method: 'POST',
        body: { categoryId: target, title: '', content: '', format: 'md' },
      });
      state.notes.push(note);
      if (state.selCat !== 'all' && state.selCat !== 'starred' && state.selCat !== 'uncat') {
        // 保持当前类别视图
      } else {
        state.selCat = 'all';
      }
      renderTree();
      openNote(note.id, { focusTitle: true });
      renderList();
      closeDrawer(); // 手机上建完立刻回到编辑区
    } catch (e) { toast(e.message); }
  }

  function closeEditor() {
    /* 收起编辑器也是「离开」：先落盘。删除笔记时该篇已从 state 移除，
       saveNow 会因找不到当前笔记直接返回，不会对已删记录发 PATCH。 */
    void saveNow();
    state.selNote = null;
    state.dirty = false;
    savedSnapshot = '';
    viewFormat = 'md';
    closeTagInput();
    const tl = $('#tagList');
    if (tl) tl.innerHTML = '';
    $('#editorWrap').classList.add('hidden');
    $('#emptyState').classList.remove('hidden');
    renderList();
  }

  function deleteNote(note) {
    const attCount = (note.attachments || []).length;
    openConfirm({
      title: '删除笔记',
      message: `「${escapeHtml(note.title || '无标题笔记')}」将被永久删除${attCount ? `，同时删除 ${attCount} 个附件` : ''}，无法恢复。`,
      confirmText: '删除',
      danger: true,
      onConfirm: async () => {
        await api(`/api/notes/${note.id}`, { method: 'DELETE' });
        state.notes = state.notes.filter((n) => n.id !== note.id);
        closeEditor();
        renderTree();
        renderList();
        toast('笔记已删除');
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
        prevEl.innerHTML = full.format === 'rich'
          ? DOMPurify.sanitize(full.content || '')
          : renderMarkdown(full.content || '');
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

  /* ---------------------------------------------------------- 导出 */
  async function openExportMenu(anchor) {
    const note = currentNote();
    if (!note) return;
    const r = anchor.getBoundingClientRect();
    showCtx(r.right - 208, r.bottom + 6, [
      { label: '导出为 Word (.docx)', icon: I.doc, onClick: () => doExport('docx') },
      { label: '导出为 PDF（打印）', icon: I.eye, onClick: () => doExport('pdf') },
      { label: '导出为 Markdown (.md)', icon: I.code, onClick: () => doExport('md') },
      { label: '🔒 加密备份（.vault）', icon: I.lock || I.doc, onClick: () => { if (window.SJE2EE) window.SJE2EE.openPanel(); } },
    ]);
  }

  async function doExport(kind) {
    const note = currentNote();
    if (!note) return;
    await saveNow();
    const html = note.format === 'rich'
      ? DOMPurify.sanitize(note.content || '')
      : renderMarkdown(note.content || '');
    try {
      if (kind === 'docx') {
        toast('正在生成 Word 文档…');
        await NoteExport.toWord({ title: note.title, html, tags: note.tags, updatedAt: note.updatedAt });
        toast('Word 文档已导出');
      } else if (kind === 'pdf') {
        NoteExport.toPdf({ title: note.title, html, tags: note.tags, updatedAt: note.updatedAt });
      } else {
        const md = note.format === 'md' ? note.content : td.turndown(html);
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
    const row = e.target.closest('.tree-row');
    if (!row) return;
    const act = e.target.closest('[data-act]');
    if (act) {
      e.stopPropagation();
      const id = row.dataset.id;
      const cat = id ? state.categories.find((c) => c.id === id) : null;
      if (act.dataset.act === 'toggle') { toggleCat(id); return; }
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
      state.selCat = row.dataset.pseudo;
      state.search = '';
      $('#searchInput').value = '';
      renderTree();
      renderList();
      afterPickCategory();
      return;
    }
    if (row.dataset.id) {
      state.selCat = row.dataset.id;
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

  $('#noteList').addEventListener('click', (e) => {
    const card = e.target.closest('.note-card');
    if (!card) return;
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
    const card = e.target.closest('.note-card');
    if (!card) return;
    e.dataTransfer.setData('text/note-id', card.dataset.id);
    e.dataTransfer.effectAllowed = 'move';
  });

  $('#searchInput').addEventListener('input', (e) => {
    state.search = e.target.value;
    renderList();
  });

  /* ---------------------------------------------------------- 手机端抽屉 */
  const NARROW = () => window.matchMedia('(max-width: 980px)').matches;

  function openDrawer(kind) {
    document.body.classList.remove('m-tree', 'm-list');
    document.body.classList.add(kind === 'tree' ? 'm-tree' : 'm-list');
  }
  function closeDrawer() {
    document.body.classList.remove('m-tree', 'm-list');
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
  $('#mTreeBtn').addEventListener('click', () => {
    void saveNow();
    if (document.body.classList.contains('m-tree')) closeDrawer();
    else openDrawer('tree');
  });
  $('#mListBtn').addEventListener('click', () => {
    void saveNow();
    if (document.body.classList.contains('m-list')) closeDrawer();
    else openDrawer('list');
  });
  $('#mMask').addEventListener('click', closeDrawer);
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
      if (note) { applyFormat(viewFormat); renderToolbar(); }
    }
  });

  $('#newNoteBtn').addEventListener('click', () => createNote());
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
      if (currentNote() && viewFormat === 'md') $('#mdInput').focus();
      else $('#richPane').focus();
    }
  });

  $('#mdInput').addEventListener('input', onMdInput);
  $('#richPane').addEventListener('input', onRichInput);

  $('#formatSwitch').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) switchFormat(b.dataset.format);
  });

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

  $('#mdInput').addEventListener('paste', async (e) => {
    const files = Array.from(e.clipboardData.files || []);
    if (files.length) {
      e.preventDefault();
      await uploadFiles(files, { insert: true });
    }
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
  bindImgResize($('#previewPane'), 'md');
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

  $('#exportBtn').addEventListener('click', () => {
    toast('正在导出备份…');
    window.location.href = '/api/export';
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
      if (viewFormat === 'md') {
        e.preventDefault();
        wrapSel(e.key === 'b' ? '**' : '*', e.key === 'b' ? '**' : '*', e.key === 'b' ? '粗体' : '斜体');
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
  async function boot() {
    applyTheme(state.theme);
    try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (_) {}
    try {
      const data = await api('/api/state');
      state.categories = data.categories || [];
      state.notes = data.notes || [];
    } catch (e) {
      toast('加载数据失败：' + e.message);
    }

    $('#statText').textContent = `${state.notes.length} 篇 · ${state.categories.length} 个类别`;
    renderTree();
    renderList();

    const first = state.notes.slice().sort((a, b) => b.updatedAt - a.updatedAt)[0];
    if (first) openNote(first.id);
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
      state.categories = s2.categories || [];
      state.notes = s2.notes || [];
      state.selCat = 'all';
      state.selNote = null;
      closeEditor();
      renderTree(); renderList(); renderTags();
    },
  };
  /* 供 sjplus.js（回收站 / 回顾 / 整库导出）调用 */
  window.SJRefresh = () => { renderTree(); renderList(); };
  window.SJOpenNote = (id) => openNote(id);

})();
