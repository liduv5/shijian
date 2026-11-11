/* ============================================================
   拾笺 · 手机端本地数据层（localStorage）
   ------------------------------------------------------------
   本地优先：所有日常读写都在本机，完全离线、不联网、不登录也能用。
   只有在 mobilesync.js 里点「同步」才会与云端交换数据。
   接口形状与原「纯云端」数据层完全一致，app.js 一行都不用改。
   ============================================================ */
(function () {
  'use strict';

  const LS_KEY = 'sj_mobile_v1';
  const MAX_VERSIONS = 40;
  /* -72：与桌面 server.js 的 SNAPSHOT_GAP 对齐。以前手机端每次 PATCH 都留一条
     版本，写几个字离开一次就刷一条，40 个槽很快被挤满；localStorage 一紧张
     还会把每篇裁到 5 条，等于真正想回退的旧版本被静默丢掉。 */
  const SNAPSHOT_GAP = 120000;

  /* ---------------------------------------------------------- 内存库 */
  let db = { categories: [], notes: [], versions: {} };

  function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        db = {
          categories: Array.isArray(d.categories) ? d.categories : [],
          notes: Array.isArray(d.notes) ? d.notes : [],
          versions: (d.versions && typeof d.versions === 'object') ? d.versions : {},
        };
      }
    } catch (e) {
      console.warn('读取本地数据失败', e);
    }
    /* 旧云端数据漏写 format，富文本正文才会被当成 Markdown 显示成源码。
       只在 format 缺失/非法时兜底；format 已是 md 的笔记（含用户主动从
       富文本转过来、正文合法保留内联 <img> 的）必须尊重字段，否则会把
       用户刚做的格式转换又改回去。 */
    let healed = 0;
    db.notes.forEach((n) => {
      if (n && n.format !== 'rich' && n.format !== 'md' && looksRichContent(n.content)) {
        n.format = 'rich'; healed++;
      }
    });
    if (healed) save();
    purgeExpiredTrash();
    /* 标记「本分区跑过主程序」。quick.html 靠它区分「sj_mobile_v1 就是
       主库」与「旧版独立速记图标遗留的库」：前者绝不能当待迁移速记
       灌进链接参数，后者仍要能带回。清站点数据后下次启动自动重建。 */
    try { localStorage.setItem('sj_main_lib', '1'); } catch (_) {}
  }

  /* 富文本编辑器插入的图片固定写成 <img src="/api/files/…> 或 data:image/…。
     只在 format 缺失/非法时用它兜底，不推翻明确的 format 字段。 */
  function looksRichContent(content) {
    return typeof content === 'string'
      && /<img\s[^>]*src=["'](?:\/api\/files\/|data:image\/)/i.test(content);
  }
  /* 二进制进 IndexedDB，localStorage 只留附件元信息：
     data 单张 3～8MB，写进 LS 必爆 5MB 配额且失败静默。 */
  const stored = new Set();   // 已确认写进附件仓的 id，避免每次 save 重复落库
  const pending = new Map();  // 正在写附件仓的数据，flushAtt / 上传时等它
  function stash(id, data) {
    if (!window.SJAttStore || stored.has(id)) return Promise.resolve();
    if (pending.has(id)) return pending.get(id);
    const p = window.SJAttStore.put(id, data)
      .then(() => { stored.add(id); })
      .catch(() => {})
      .then(() => { pending.delete(id); });
    pending.set(id, p);
    return p;
  }
  /* 等所有在途的附件写入结束（同步拉取后调用，防止没落库就被关掉） */
  function flushAtt() {
    return Promise.all([...pending.values()]).catch(() => {});
  }
  function stripAtt(note) {
    const list = note.attachments;
    if (!Array.isArray(list) || !list.length) return note;
    let touched = false;
    const atts = list.map((a) => {
      if (!a || (!a.data && !a.remoteUrl)) return a;
      touched = true;
      if (a.data) stash(a.id, a.data);
      const c = {};
      /* remoteUrl 是 1 小时有效的签名地址，落盘毫无意义，还容易在下次打开时
         变成一张破图（甚至挡住附件仓里的真图），所以一并摘掉。 */
      for (const k in a) if (k !== 'data' && k !== 'remoteUrl') c[k] = a[k];
      return c;
    });
    if (!touched) return note;
    const out = {};
    for (const k in note) out[k] = k === 'attachments' ? atts : note[k];
    return out;
  }

  function save() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        categories: db.categories,
        notes: db.notes.map(stripAtt),
        versions: db.versions,
      }));
    } catch (e) {
      console.error('保存本地数据失败', e);
      /* 极端情况：连剥离后的结构都写不下（历史版本太长）。丢掉最老的版本再试一次。 */
      try {
        let freed = false;
        Object.keys(db.versions).forEach((k) => {
          const list = db.versions[k];
          if (Array.isArray(list) && list.length > 5) { list.length = 5; freed = true; }
        });
        localStorage.setItem(LS_KEY, JSON.stringify({
          categories: db.categories, notes: db.notes.map(stripAtt), versions: freed ? db.versions : {},
        }));
        if (typeof toast === 'function') toast('本地空间紧张，已清理较早的历史版本');
        else if (window.toast) window.toast('本地空间紧张，已清理较早的历史版本');
      } catch (e2) {
        console.error('再次保存失败', e2);
        if (typeof toast === 'function') toast('本地存储空间不足，部分内容可能未保存');
        else if (window.toast) window.toast('本地存储空间不足，部分内容可能未保存');
      }
    }
  }
  /* 回收站：软删除的笔记 30 天后真删，别让 localStorage 无限膨胀。 */
  const TRASH_TTL = 30 * 24 * 3600 * 1000;
  function purgeExpiredTrash() {
    const cut = Date.now() - TRASH_TTL;
    const doomed = db.notes.filter((n) => n.deletedAt && Number(n.deletedAt) < cut);
    if (!doomed.length) return;
    db.notes = db.notes.filter((n) => !doomed.includes(n));
    doomed.forEach((n) => {
      delete db.versions[n.id];
      (n.attachments || []).forEach((a) => {
        if (a && a.id && window.SJAttStore) window.SJAttStore.del(a.id);
      });
    });
    save();
  }
  load();

  /* 另一个标签 / 独立窗口改了本地库时，本窗口的 db 还是旧的内存快照，
     app.js 再怎么刷新界面也会读到旧数据。这里只替换 db，不做 heal、
     purge、写盘，避免再触发对端的 storage 形成自激环。 */
  window.addEventListener('storage', (e) => {
    if (!e || e.key !== LS_KEY || e.newValue == null) return;
    try {
      const d = JSON.parse(e.newValue);
      if (!d || !Array.isArray(d.notes)) return;
      db.categories = Array.isArray(d.categories) ? d.categories : [];
      db.notes = d.notes;
      db.versions = (d.versions && typeof d.versions === 'object') ? d.versions : {};
    } catch (_) {}
  });

  const uid = () => {
    const b = new Uint8Array(6);
    crypto.getRandomValues(b);
    return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  };
  const clone = (x) => JSON.parse(JSON.stringify(x));

  /* ---------------------------------------------------------- 附件索引
     正文用 /api/files/<附件id> 引用，这里把 id 映射到本地 data URL，
     由 watchFiles 在渲染时按需替换，app.js 完全不用改。 */
  const filePath = new Map();   // attId -> { url }  本地二进制（附件仓）
  const remotePath = new Map(); // attId -> 云端签名地址，仅作兜底（1 小时有效）
  function indexNote(note) {
    (note.attachments || []).forEach((a) => {
      if (!a || !a.id) return;
      if (a.data) {
        filePath.set(a.id, { url: a.data });
        stash(a.id, a.data);
      }
      if (a.remoteUrl) remotePath.set(a.id, a.remoteUrl);
    });
  }
  db.notes.forEach(indexNote);

  function fileUrl(attId) {
    const hit = filePath.get(attId);
    if (hit && hit.url) return hit.url;
    return remotePath.get(attId) || '';
  }

  /* 启动迁移：老版本把图片 data 存在 LS 里，这里搬到附件仓并从 LS 摘掉。
     不再把附件仓整个读进内存（图多了会有几百 MB），改成渲染时按需取。 */
  const ready = (async () => {
    if (!window.SJAttStore) return;
    let dirty = false;
    db.notes.forEach((n) => (n.attachments || []).forEach((a) => {
      if (!a || !a.id || !a.data) return;
      if (!filePath.get(a.id)) filePath.set(a.id, { url: a.data });
      stash(a.id, a.data);
      delete a.data;      // 从 LS 结构里摘掉，腾出配额
      dirty = true;
    }));
    if (dirty) { save(); await flushAtt(); }
  })();

  const FP_MAX = 60;   // 地址映射也设上限，防止翻很多篇后内存一直涨
  function remember(id, url) {
    filePath.set(id, { url });
    while (filePath.size > FP_MAX) filePath.delete(filePath.keys().next().value);
  }

  const loading = new Set();
  const noLocal = new Set();   // 确认本机没有二进制，别每次渲染都去翻一遍附件仓
  /* 取一张图的地址：内存 → 附件仓 → 云端签名地址。
     顺序很重要：签名地址 1 小时就失效，如果排在附件仓前面，上次拉取留下的
     死链会一直盖住这次真正下载到的图 —— 表现就是「拉取成功但图还是不出来」。 */
  async function ensureUrl(id) {
    const hit = filePath.get(id);
    if (hit && hit.url) return hit.url;
    if (window.SJAttStore && !noLocal.has(id) && !loading.has(id)) {
      loading.add(id);
      try {
        const data = await window.SJAttStore.get(id);
        if (data) { remember(id, data); return data; }
        noLocal.add(id);
      } catch (_) {
        /* 读不出来就按缺失处理 */
      } finally {
        loading.delete(id);
      }
    }
    return remotePath.get(id) || '';
  }

  /* 附件仓读取兜底：Open 事件被手机浏览器吞掉时 ensureUrl 会一直挂着。
     2.5 秒读不到就当本机没有这份图；读到后立刻清掉定时器，别让每次渲染
     都在事件循环里留一个 2.5s 的尾巴。 */
  function ensureUrlQuick(id) {
    return new Promise((resolve) => {
      let done = false;
      const finish = (v) => {
        if (done) return;
        done = true; clearTimeout(timer); resolve(v || '');
      };
      const timer = setTimeout(() => finish(''), 2500);
      Promise.resolve().then(() => ensureUrl(id)).then(finish, () => finish(''));
    });
  }

  /* 附件「下载」专用取址：内存 → 附件仓 → 云端签名地址。
     与 ensureUrl 分开，不共用 noLocal 缓存 —— 首屏渲染时附件仓可能还没
     就绪，那一次判定的「没有」不能让用户以后永远下载不到这份附件。 */
  function attachmentUrl(id) {
    return new Promise((resolve) => {
      let done = false;
      const finish = (v) => {
        if (done) return;
        done = true; clearTimeout(timer); resolve(v || '');
      };
      const fallback = remotePath.get(id) || '';
      const timer = setTimeout(() => finish(fallback), 2500);
      const hit = filePath.get(id);
      if (hit && hit.url) { finish(hit.url); return; }
      let p = null;
      try { p = window.SJAttStore && window.SJAttStore.get(id); } catch (_) {}
      Promise.resolve(p).then((d) => {
        if (d) { remember(id, d); finish(d); }
        else finish(fallback);
      }, () => finish(fallback));
    });
  }

  let paintTimer = 0;
  let painting = false;
  /* throttle 而不是 debounce：页面渲染 DOM 变动密集，debounce 会被一直重置。
     painting 闸门要覆盖整段异步流程 —— paintTimer 在回调开始就清零，
     不加锁的话 await 期间每次 DOM 变动都会再堆一个补图任务。 */
  function paintFiles() {
    if (paintTimer || painting) return;
    paintTimer = setTimeout(async () => {
      paintTimer = 0;
      if (painting) return;
      painting = true;
      try { await doPaint(); } finally { painting = false; }
    }, 60);
  }

  async function doPaint() {
    const els = [...document.querySelectorAll('[src^="/api/files/"], [href^="/api/files/"]')];
    for (const el of els) {
      if (el.tagName === 'IMG' && !el.dataset.imgBound) {
        /* 签名地址过期 / 二进制丢了时浏览器只会显示一个破图图标，
           这里换成一句人话，用户才知道点哪里。 */
        el.dataset.imgBound = '1';
        el.addEventListener('error', () => {
          el.classList.add('img-missing');
          el.setAttribute('alt', '图片没有加载成功，点右上「同步」→「从云端拉取」');
        });
        el.addEventListener('load', () => el.classList.remove('img-missing'));
      }
      const raw = el.getAttribute('src') || el.getAttribute('href');
      const id = raw.split('/').pop();
      const url = await ensureUrlQuick(id);
      if (!url) {
        /* 本机没有这份二进制（老旧数据 / 上次同步没拉下来）：
           别让浏览器只显示一串文件名，给一句能看懂的话。
           打标记只处理一次 —— src 仍是 /api/files/，选择器每次都会命中它，
           不去重的话每次 DOM 变动都要再查一遍附件仓。 */
        if (el.dataset.attMissing === '1') continue;
        el.dataset.attMissing = '1';
        if (el.tagName === 'IMG') {
          el.setAttribute('alt', '图片暂未下载，点右上「同步」→「从云端拉取」');
          el.classList.add('img-missing');
        }
        continue;
      }
      delete el.dataset.attMissing;
      /* 只有地址真的变了才写回，避免无谓的 DOM 操作和重复加载图片。 */
      if (el.hasAttribute('src')) {
        if (el.getAttribute('src') !== url) el.setAttribute('src', url);
      } else if (el.getAttribute('href') !== url) {
        el.setAttribute('href', url);
        /* 只有「正文里插入的附件链接」才该开新标签。带 download 的链接是
           保存文件，加 target=_blank 会让部分手机浏览器忽略下载、改成开标签。 */
        if (!el.hasAttribute('download')) {
          el.setAttribute('target', '_blank');
          el.setAttribute('rel', 'noopener');
        }
      }
    }
    /* 补图完成：通知 app.js 把附件下载链接武装成可直接点的原生下载。
       移动浏览器的下载必须由用户手势同步触发，不能等点击后再异步取二进制，
       所以这个地址得在用户点下去之前就准备好。 */
    try { document.dispatchEvent(new CustomEvent('sj:files-painted')); } catch (_) {}
  }
  let watching = false;
  function watchFiles() {
    paintFiles();
    if (watching || !window.MutationObserver) return;
    watching = true;
    /* 只认「新插入的节点」。doPaint 自己会 setAttribute('src', 地址)，
       若同时监听 attributes，等于自己改完自己再触发一次 → 无限自激：
       手机端表现为格式切换后主线程冻结、一直「保存中…」。 */
    new MutationObserver((records) => {
      if (records.some((r) => r.type === 'childList' && r.addedNodes.length)) paintFiles();
    }).observe(document.body, { childList: true, subtree: true });
  }

  function descendants(cats, id) {
    const acc = [];
    const walk = (pid) => cats.filter((c) => c.parentId === pid)
      .forEach((c) => { acc.push(c.id); walk(c.id); });
    walk(id);
    return acc;
  }

  /* 干净化一份 note（保留落库字段） */
  function cleanNote(n) {
    return {
      id: n.id,
      categoryId: n.categoryId || null,
      title: n.title || '',
      content: n.content || '',
      format: n.format === 'rich' ? 'rich' : 'md',
      starred: !!n.starred,
      tags: Array.isArray(n.tags) ? n.tags.slice(0, 10) : [],
      attachments: Array.isArray(n.attachments) ? clone(n.attachments) : [],
      createdAt: Number(n.createdAt) || Date.now(),
      updatedAt: Number(n.updatedAt) || Date.now(),
      ...(n.deletedAt ? { deletedAt: Number(n.deletedAt) } : {}),
    };
  }

  /* ---------------------------------------------------------- 历史版本
     -72：与桌面 server.js snapshotVersion() 同语义：
       · 空笔记不留版本；
       · 2 分钟内不重复留自动版本（auto）；同内容也不重复留；
       · format / restore / manual 是用户明确动作，绕过去重。
     PATCH 的调用时机与写盘时机一个字没改，只改「要不要真的留一条」。 */
  function snapshot(note, reason) {
    if (!note.content && !note.title) return;
    const force = reason === 'format' || reason === 'restore' || reason === 'manual';
    const list = db.versions[note.id] || (db.versions[note.id] = []);
    const last = list[0];
    if (!force && last && last.content === note.content && last.title === note.title) return;
    if (!force && last && Date.now() - last.ts < SNAPSHOT_GAP) return;
    list.unshift({
      id: uid(),
      ts: Date.now(),
      title: note.title || '',
      content: note.content || '',
      format: note.format === 'rich' ? 'rich' : 'md',
      reason: reason || 'auto',
    });
    if (list.length > MAX_VERSIONS) list.length = MAX_VERSIONS;
    save();
  }

  /* ---------------------------------------------------------- 接口适配 */
  async function api(path, opts) {
    const { method = 'GET', body = null } = opts || {};
    const url = new URL(path, location.origin);
    const seg = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
    const q = url.searchParams;

    /* ---------- 全量状态 ---------- */
    if (method === 'GET' && seg[0] === 'state') {
      const live = db.notes.filter((n) => !n.deletedAt);
      return {
        categories: clone(db.categories),
        notes: clone(live),
        meta: { version: 1, count: live.length },
      };
    }

    /* ---------- 回收站（与电脑端 /api/trash 同形） ---------- */
    if (seg[0] === 'trash') {
      const id = seg[1];
      if (method === 'GET' && !id) {
        return { notes: clone(db.notes.filter((n) => n.deletedAt)
          .sort((a, b) => Number(b.deletedAt) - Number(a.deletedAt))) };
      }
      if (method === 'DELETE' && !id) {
        const doomed = db.notes.filter((n) => n.deletedAt);
        doomed.forEach((n) => {
          delete db.versions[n.id];
          (n.attachments || []).forEach((a) => {
            if (a && a.id && window.SJAttStore) window.SJAttStore.del(a.id);
          });
        });
        db.notes = db.notes.filter((n) => !n.deletedAt);
        save();
        return { ok: true, removed: doomed.length };
      }
      const note = id ? db.notes.find((n) => n.id === id) : null;
      if (!note || !note.deletedAt) throw new Error('回收站里没有这篇笔记');
      if (method === 'POST' && seg[2] === 'restore') {
        delete note.deletedAt;
        note.updatedAt = Date.now();
        save();
        return clone(note);
      }
      if (method === 'DELETE') {
        delete db.versions[note.id];
        (note.attachments || []).forEach((a) => {
          if (a && a.id && window.SJAttStore) window.SJAttStore.del(a.id);
        });
        db.notes = db.notes.filter((n) => n.id !== id);
        save();
        return { ok: true };
      }
      throw new Error('未知接口');
    }

    /* ---------- 类别 ---------- */
    if (seg[0] === 'categories') {
      const id = seg[1];

      if (method === 'POST' && !id) {
        const cats = db.categories;
        if (body.parentId && !cats.some((c) => c.id === body.parentId)) throw new Error('父类别不存在');
        const siblings = cats.filter((c) => c.parentId === (body.parentId || null));
        const cat = {
          id: uid(),
          name: String(body.name || '').trim() || '未命名类别',
          parentId: body.parentId || null,
          expanded: true,
          order: siblings.length,
          createdAt: Date.now(),
        };
        db.categories.push(cat);
        if (cat.parentId) {
          const p = db.categories.find((c) => c.id === cat.parentId);
          if (p) p.expanded = true;
        }
        save();
        return clone(cat);
      }

      if (method === 'PATCH' && id) {
        const cat = db.categories.find((c) => c.id === id);
        if (!cat) throw new Error('类别不存在');
        if (typeof body.name === 'string' && body.name.trim()) cat.name = body.name.trim();
        if (typeof body.expanded === 'boolean') cat.expanded = body.expanded;
        if (typeof body.order === 'number') cat.order = body.order;
        if (body.parentId !== undefined) {
          if (body.parentId && !db.categories.some((c) => c.id === body.parentId)) throw new Error('目标类别不存在');
          if (body.parentId === id) throw new Error('不能移动到自身');
          if (body.parentId && descendants(db.categories, id).includes(body.parentId)) {
            throw new Error('不能移动到自己的子类别下');
          }
          cat.parentId = body.parentId || null;
        }
        save();
        return clone(cat);
      }

      if (method === 'DELETE' && id) {
        const cat = db.categories.find((c) => c.id === id);
        if (!cat) throw new Error('类别不存在');
        const ids = [id, ...descendants(db.categories, id)];
        const affected = db.notes.filter((n) => ids.includes(n.categoryId));
        const strategy = q.get('strategy') || 'delete';
        if (strategy === 'move') {
          const parentId = cat.parentId || null;
          affected.forEach((n) => (n.categoryId = parentId));
          db.categories.filter((c) => c.parentId === id).forEach((c) => (c.parentId = parentId));
          db.categories = db.categories.filter((c) => c.id !== id);
        } else {
          affected.forEach((n) => { n.deletedAt = Date.now(); n.updatedAt = n.deletedAt; });
          db.categories = db.categories.filter((c) => c.id !== id);
        }
        save();
        return { ok: true };
      }
    }

    /* ---------- 笔记 ---------- */
    if (seg[0] === 'notes' && seg.length <= 2) {
      const id = seg[1];

      if (method === 'POST' && !id) {
        const note = cleanNote({
          id: uid(),
          categoryId: body.categoryId || null,
          title: body.title || '',
          content: body.content || '',
          format: body.format === 'rich' ? 'rich' : 'md',
          starred: !!body.starred,
          tags: Array.isArray(body.tags)
            ? [...new Set(body.tags.map((t) => String(t).trim()).filter(Boolean))].slice(0, 10)
            : [],
          attachments: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        if (note.categoryId && !db.categories.some((c) => c.id === note.categoryId)) note.categoryId = null;
        db.notes.push(note);
        save();
        return clone(note);
      }

      if (!id) throw new Error('未知接口');

      if (method === 'GET') {
        const note = db.notes.find((n) => n.id === id);
        if (!note) throw new Error('笔记不存在');
        return clone(note);
      }

      if (method === 'PATCH') {
        const note = db.notes.find((n) => n.id === id);
        if (!note) throw new Error('笔记不存在');
        const contentChanged = typeof body.content === 'string' && body.content !== note.content;
        const titleChanged = typeof body.title === 'string' && body.title !== note.title;
        const formatChanged = (body.format === 'md' || body.format === 'rich') && body.format !== note.format;
        if (contentChanged || titleChanged || formatChanged) {
          snapshot(note, formatChanged ? 'format' : 'auto');
        }
        if (typeof body.title === 'string') note.title = body.title;
        if (typeof body.content === 'string') note.content = body.content;
        if (body.format === 'md' || body.format === 'rich') note.format = body.format;
        if (body.categoryId !== undefined) note.categoryId = body.categoryId || null;
        if (typeof body.starred === 'boolean') note.starred = body.starred;
        if (Array.isArray(body.tags)) {
          note.tags = [...new Set(body.tags.map((t) => String(t).trim()).filter(Boolean))].slice(0, 10);
        }
        note.updatedAt = Date.now();
        save();
        return clone(note);
      }

      if (method === 'DELETE') {
        const note = db.notes.find((n) => n.id === id);
        if (!note) throw new Error('笔记不存在');
        note.deletedAt = Date.now();
        note.updatedAt = note.deletedAt;
        save();
        return { ok: true, trashed: true };
      }
    }

    /* ---------- 历史版本 ---------- */
    if (seg[0] === 'notes' && seg[2] === 'versions') {
      const noteId = seg[1];
      const vid = seg[3];

      /* -72「存为版本」：专门端点，不借 PATCH 触发。
         这样不会把 updatedAt 顶新（否则会扰乱同步 LWW 和列表排序），
         也不会覆盖正文；空笔记与桌面端一样不留版本。 */
      if (method === 'POST' && !vid) {
        const n = db.notes.find((x) => x.id === noteId);
        if (!n) throw new Error('笔记不存在');
        snapshot(n, 'manual');
        save();
        return { ok: true, count: (db.versions[noteId] || []).length };
      }

      if (method === 'GET' && !vid) {
        const list = db.versions[noteId] || [];
        return {
          versions: list.map((v) => ({
            id: v.id, ts: v.ts, title: v.title, format: v.format, reason: v.reason,
            size: (v.content || '').length,
          })),
        };
      }
      if (method === 'GET' && vid) {
        const list = db.versions[noteId] || [];
        const v = list.find((x) => x.id === vid);
        if (!v) throw new Error('版本不存在');
        return v;
      }
      if (method === 'POST' && vid && seg[4] === 'restore') {
        const note = db.notes.find((n) => n.id === noteId);
        const v = (db.versions[noteId] || []).find((x) => x.id === vid);
        if (!note || !v) throw new Error('版本不存在');
        snapshot(note, 'restore');
        note.title = v.title;
        note.content = v.content;
        note.format = v.format;
        note.updatedAt = Date.now();
        save();
        return clone(note);
      }
      if (method === 'DELETE' && vid) {
        db.versions[noteId] = (db.versions[noteId] || []).filter((x) => x.id !== vid);
        save();
        return { ok: true };
      }
    }

    /* ---------- 附件 ---------- */
    if (seg[0] === 'notes' && seg[2] === 'attachments') {
      const noteId = seg[1];
      const attId = seg[3];
      const note = db.notes.find((n) => n.id === noteId);
      if (!note) throw new Error('笔记不存在');

      if (method === 'POST' && !attId) {
        const name = String(body.name || 'file');
        const type = body.type || 'application/octet-stream';
        const data = String(body.data || '');
        if (!data) throw new Error('空文件');
        let size = body.size;
        if (!size) {
          try { size = Math.round((data.split(',')[1] || '').length * 0.75); } catch (_) { size = 0; }
        }
        const att = { id: uid(), name, size: size || 0, type, data };
        note.attachments = note.attachments.concat([att]);
        note.updatedAt = Date.now();
        filePath.set(att.id, { url: data });
        /* 先把二进制写进附件仓再返回：否则「上传完立刻关页面」会把图弄丢 */
        await stash(att.id, data);
        save();
        return clone(att);
      }
      if (method === 'DELETE' && attId) {
        note.attachments = (note.attachments || []).filter((a) => a.id !== attId);
        note.updatedAt = Date.now();
        filePath.delete(attId);
        remotePath.delete(attId);
        stored.delete(attId);
        if (window.SJAttStore) window.SJAttStore.del(attId);
        save();
        return { ok: true };
      }
    }

    /* ---------- 导入备份（合并，已存在的不覆盖） ---------- */
    if (method === 'POST' && seg[0] === 'import') {
      const cats = Array.isArray(body.categories) ? body.categories : [];
      const notes = Array.isArray(body.notes) ? body.notes : [];
      let noteAdded = 0, catAdded = 0, skipped = 0;

      const catIds = new Set(db.categories.map((c) => c.id));
      for (const c of cats) {
        if (!c || !c.id || catIds.has(c.id)) continue;
        db.categories.push({
          id: c.id, name: String(c.name || '未命名类别').slice(0, 60),
          parentId: c.parentId || null, expanded: true, order: 0,
          createdAt: Number(c.createdAt) || Date.now(),
        });
        catIds.add(c.id); catAdded++;
      }

      const noteIds = new Set(db.notes.map((n) => n.id));
      for (const n of notes) {
        if (!n || !n.id || noteIds.has(n.id)) { skipped++; continue; }
        db.notes.push(cleanNote({
          id: n.id,
          categoryId: catIds.has(n.categoryId) ? n.categoryId : null,
          title: n.title || '', content: String(n.content || ''),
          format: n.format === 'rich' ? 'rich' : 'md',
          starred: !!n.starred,
          tags: Array.isArray(n.tags) ? n.tags : [],
          attachments: Array.isArray(n.attachments) ? clone(n.attachments.filter((a) => a && a.id)) : [],
          createdAt: Number(n.createdAt) || Date.now(),
          updatedAt: Number(n.updatedAt) || Date.now(),
          ...(n.deletedAt ? { deletedAt: Number(n.deletedAt) } : {}),
        }));
        noteIds.add(n.id); noteAdded++;
      }
      save();
      return { catAdded, noteAdded, skipped, lostFiles: 0 };
    }

    throw new Error('未知接口');
  }

  /* ---------------------------------------------------------- 备份 / 同步辅助 */
  function exportBackup() {
    return { version: 1, exportedAt: Date.now(), categories: clone(db.categories), notes: clone(db.notes) };
  }
  function getState() {
    return { categories: clone(db.categories), notes: clone(db.notes), versions: clone(db.versions) };
  }
  function setState(data) {
    db.categories = Array.isArray(data.categories) ? clone(data.categories) : [];
    db.notes = Array.isArray(data.notes) ? clone(data.notes) : [];
    db.versions = (data.versions && typeof data.versions === 'object') ? clone(data.versions) : {};
    db.notes.forEach(indexNote);
    /* 二进制已经交给附件仓（indexNote 里 stash 了），内存里不必再留一份：
       十来张手机照片就是几十上百 MB，手机上很容易被系统回收掉整个页面。
       只有附件仓不可用时才保留，否则图会彻底找不回来。 */
    if (window.SJAttStore) {
      db.notes.forEach((n) => (n.attachments || []).forEach((a) => { if (a && a.data) delete a.data; }));
    }
    save();
  }
  function reset() {
    db = { categories: [], notes: [], versions: {} };
    filePath.clear();
    remotePath.clear();
    stored.clear();
    if (window.SJAttStore) window.SJAttStore.clear();
    save();
  }

  /* -72：桌面 SJLocal 早有 importBackup，云端这份漏了 —— e2ee.js 的
     「解密并汇入」会调到它，缺了就必然报「本地存储不支持汇入」。
     补齐后加密备份在手机端也能真正闭环（导出 + 导入）。 */
  async function importBackup(backup) {
    return api('/api/import', { method: 'POST', body: backup });
  }

  window.SJLocal = { api, fileUrl, attachmentUrl, watchFiles, indexNote, exportBackup, importBackup, getState, setState, reset, uid, ready, flushAtt };
})();
