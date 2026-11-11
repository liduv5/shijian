/* ============================================================
   拾笺 · 手机端同步到云端模块
   ------------------------------------------------------------
   本地优先：日常完全离线，只有手动点「同步」才登录并交换数据。
   登录用 QQ 邮箱验证码（无需密码），新邮箱首次验证即自动注册。
   同步仅交换文本/分类/附件元数据，附件文件在本地(data URL)与
   云端(签名存储)之间自动转换，保证两端都能正常显示。
   ============================================================ */
(function () {
  'use strict';

  if (!window.WorkBuddyCloud) { console.warn('[同步] 云服务组件未加载'); return; }
  const cloud = window.WorkBuddyCloud.createWorkBuddyCloud({
    endpoint: 'https://shijian-notes-46125.app.workbuddy.host',
    oauthRelayBaseUrl: 'https://www.workbuddy.cn/v2/as/genie-baas/oauth',
    publishableKey: 'wbpk_dI8FNrfPPUj38F8big7tnc_ppkTgPWXNyg4hg2VzRPCDCwMgQT2Qft7',
  });

  const $ = (s, r) => (r || document).querySelector(s);
  const LS_EMAIL = 'sj_cloud_session_email';
  const LS_LAST = 'sj_last_sync';
  /* 发布版本标记：与 index.html 的 SWV 等六处同步，供维护核对。 */
  const BUILD = '2026-11-10-71';
  let session = null;
  let pendingOtp = null;
  let cooldownTimer = null;

  /* 直接灌进界面数据源（window.SJState 是 app.js 内 state 的同一引用），
     调 SJRefresh 更新统计/树/列表，不依赖可能被 IndexedDB 就绪卡住的 boot()。 */
  function refreshFromLocal(cats, notes) {
    try {
      if (!window.SJState || !window.SJRefresh) return false;
      window.SJState.categories = cats;
      window.SJState.notes = notes;
      window.SJRefresh();
      return true;
    } catch (_) { return false; }
  }

  function normSession(r) {
    if (!r) return null;
    const s = r.data || r;
    return (s && s.user) ? s : null;
  }

  /* ---------------------------------------------------------- 小工具 */
  function toast(msg) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'toast show';
    clearTimeout(t._t);
    t._t = setTimeout(() => (t.className = 'toast'), 2000);
  }
  function lastSyncAt() { return Number(localStorage.getItem(LS_LAST) || 0); }
  function fmtTime(ms) {
    if (!ms) return '从未';
    const d = new Date(ms);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  function friendly(error) {
    if (!error) return '操作失败，请稍后再试';
    if (typeof error === 'string') return error;
    /* 云端 API 返回 { error, error_description }，没有 message 字段。 */
    const kind = error.kind || error.code || error.error || '';
    if (kind === 'network') return '网络连接失败，请检查网络';
    if (kind === 'too_many_requests') return '操作太频繁，请稍后再试';
    if (kind === 'invalid_client' || kind === 'unauthenticated') return '登录状态已失效，请退出后重新登录';
    if (kind === 'invalid_grant') return '验证码不对，或登录已过期（请退出后重新登录一次）';
    const desc = error.message || error.error_description || error.description || error.hint || error.details;
    const status = error.status ? '（错误 ' + error.status + '）' : '';
    if (desc) return String(desc) + status;
    if (kind) return '云端返回错误：' + kind + status;
    return '操作失败，请稍后再试';
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  /* 手机弱网、浏览器切后台、IndexedDB 被别的标签页堵住时，fetch / IDB 都可能
     永远不 settle。同步里任何一处 await 没有超时，整场拉取就会永久停在
     「拉取中…」（用户看到的就是进度不动、按钮一直禁用）。
     统一约定：超时或报错都按「失败」处理，返回 fallback，绝不阻塞后续步骤。
     p 可以是 Promise，也可以是无参函数（函数形式能连同步抛错一起兜住）。 */
  function withTimeout(p, ms, fallback) {
    return new Promise((resolve) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        resolve(fallback);
      }, ms);
      Promise.resolve()
        .then(() => (typeof p === 'function' ? p() : p))
        .then(
          (v) => { if (!settled) { settled = true; clearTimeout(timer); resolve(v); } },
          () => { if (!settled) { settled = true; clearTimeout(timer); resolve(fallback); } }
        );
    });
  }

  /* ---------------------------------------------------------- 云端读取（直连优先）
     用浏览器原生 AbortSignal.timeout 计时（不依赖可能被手机冻结的 JS 定时器），
     老浏览器退回 AbortController；直连失败才回退 SDK。
     走页面同源可省掉跨域预检，重新发布换域名也不用改代码。 */
  const REST_BASE = (typeof location !== 'undefined' && location.origin) ? location.origin : '';
  const REST_PK = 'wbpk_dI8FNrfPPUj38F8big7tnc_ppkTgPWXNyg4hg2VzRPCDCwMgQT2Qft7';
  async function restRead(table, owner) {
    const token = await withTimeout(() => gcToken(), 4000, '');
    let signal, kill = null;
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
      signal = AbortSignal.timeout(8000);
    } else {
      const ctrl = new AbortController();
      signal = ctrl.signal;
      kill = setTimeout(() => ctrl.abort(), 8000);
    }
    try {
      const url = REST_BASE + '/.cloud/database/rest/' + table
        + '?select=*&owner_id=eq.' + encodeURIComponent(owner);
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer ' + token,
          'x-wb-webapp-access-key': REST_PK,
        },
        signal,
      });
      if (!res || !res.ok) throw new Error('HTTP ' + (res ? res.status : '未知'));
      const rows = await res.json();
      if (!Array.isArray(rows)) throw new Error('云端返回格式不对');
      return { data: rows, error: null };
    } finally {
      if (kill) clearTimeout(kill);
    }
  }

  /* ---------------------------------------------------------- 行转换（云端 schema） */
  function catToRow(c, owner) {
    return {
      id: c.id,
      name: c.name || '未命名类别',
      parent_key: c.parentId || null,
      expanded: c.expanded !== false,
      sort_order: typeof c.order === 'number' ? c.order : 0,
      created_at: new Date(Number(c.createdAt) || Date.now()).toISOString(),
      owner_id: owner,
    };
  }
  function noteToRow(n, owner) {
    return {
      id: n.id,
      category_key: n.categoryId || null,
      title: n.title || '',
      content: n.content || '',
      format: n.format === 'rich' ? 'rich' : 'md',
      starred: !!n.starred,
      tags: Array.isArray(n.tags) ? n.tags : [],
      created_at: new Date(Number(n.createdAt) || Date.now()).toISOString(),
      updated_at: new Date(Number(n.updatedAt) || Date.now()).toISOString(),
      // 删除墓碑：软删也要上传，否则另一台设备下次拉取会把删掉的笔记"复活"
      deleted_at: n.deletedAt ? new Date(Number(n.deletedAt)).toISOString() : null,
      owner_id: owner,
    };
  }
  function rowToCat(r) {
    return {
      id: r.id, name: r.name, parentId: r.parent_key || null,
      expanded: r.expanded !== false, order: r.sort_order || 0,
      createdAt: r.created_at ? Date.parse(r.created_at) : Date.now(),
    };
  }
  /* attachments 是 jsonb：可能是数组，也可能是 JSON 字符串，两种都要吃下。
     只按字符串 JSON.parse 会把数组解析失败，附件整个丢掉。 */
  function parseAtts(v) {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') {
      try { const a = JSON.parse(v); return Array.isArray(a) ? a : []; } catch (_) { return []; }
    }
    return [];
  }
  /* 早期云端数据漏列 format 时，富文本正文会在 Markdown 编辑器里显示成源码。
     这个特征只在 format 缺失时兜底 —— Markdown 里内联 <img> 是合法写法，
     不能再凭它推翻明确的 format 字段。 */
  function looksRichContent(content) {
    return typeof content === 'string'
      && /<img\s[^>]*src=["'](?:\/api\/files\/|data:image\/)/i.test(content);
  }
  function rowToNote(r) {
    const att = parseAtts(r.attachments);
    /* format 明确时以字段为准：用户主动「富文本 → Markdown」后正文会合法
       保留内联 <img>，不能再按内容把这类笔记判回 rich。只有旧数据漏列
       （format 缺失）时才按内容兜底。 */
    const fmt = (r.format === 'rich' || r.format === 'md')
      ? r.format
      : (looksRichContent(r.content) ? 'rich' : 'md');
    return {
      id: r.id, title: r.title, content: r.content,
      format: fmt,
      categoryId: r.category_key || null, starred: !!r.starred,
      tags: Array.isArray(r.tags) ? r.tags : [], attachments: att,
      createdAt: r.created_at ? Date.parse(r.created_at) : Date.now(),
      updatedAt: r.updated_at ? Date.parse(r.updated_at) : Date.now(),
      deletedAt: r.deleted_at ? Date.parse(r.deleted_at) : 0,
    };
  }

  /* ---------------------------------------------------------- 附件：本地 <-> 云端 */
  /* 上传前读一次云端已有的「附件 id → 存储路径」索引。
     历史缺陷：手机端某些附件的本地记录只剩 {id,name,size,type}（没有 path），
     本地附件仓里又可能已经取不到字节 —— 旧代码会把这份**不含 path 的元信息**
     upsert 回云端，用整段 JSON 覆盖掉云端原本正确的 path。后果不可逆：云端没有
     历史版本，附件从此手机和电脑都下不动（attPathFor 的查回逻辑也是事后补救，
     行已被覆盖就查不回来了）。
     现在：push 之前先拿云端那份 path；本地缺 path 时优先沿用云端的，绝不因为
     本地拿不到字节就把云端记录抹平。 */
  async function cloudAttPaths(owner) {
    const map = new Map();
    const put = (rows) => {
      for (const r of rows || []) {
        for (const a of parseAtts(r && r.attachments)) {
          if (a && a.id && a.path && !map.has(a.id)) map.set(a.id, a.path);
        }
      }
    };
    let ok = false;
    try {
      const r = await withTimeout(() => restRead('sj_notes', owner), 8000, null);
      if (r && !r.error && Array.isArray(r.data)) { put(r.data); ok = true; }
    } catch (_) {}
    if (!ok) {
      try {
        const r2 = await withTimeout(
          () => cloud.database.from('sj_notes').select('*').eq('owner_id', owner), 8000, null);
        if (r2 && !r2.error && Array.isArray(r2.data)) { put(r2.data); ok = true; }
      } catch (_) {}
    }
    return { map, ok };
  }

  async function pushAttachments(note, owner, knownPaths) {
    const atts = Array.isArray(note.attachments) ? note.attachments : [];
    const out = [];
    const keep = (knownPaths instanceof Map) ? knownPaths : null;
    let missing = 0;
    for (const a of atts) {
      if (!a || !a.id) continue;
      const meta = { id: a.id, name: a.name, size: a.size || 0, type: a.type };
      /* 本地记录自己有 path 就用它；没有但云端有，沿用云端那份（不重传、不丢）。 */
      const known = a.path || (keep && keep.get(a.id)) || '';
      if (known) { meta.path = known; out.push(meta); continue; }
      /* 本地数据层把附件二进制放在附件仓（IndexedDB），note.attachments
         里通常已经没有 data 字段，所以这里回查一次。 */
      const dataUrl = a.data || (window.SJLocal && window.SJLocal.fileUrl(a.id)) || '';
      if (!dataUrl) {
        // 拿不到二进制就只同步元信息，至少别让附件从列表里消失
        missing++; out.push(meta); continue;
      }
      try {
        const b64 = String(dataUrl).split(',')[1] || '';
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const ext = (a.name.match(/\.[A-Za-z0-9]{1,10}$/) || [''])[0];
        const path = cloud.storage.userPath(owner, `notes/${a.id}${ext}`);
        await attUploadRaw(path,
          new Blob([bytes], { type: a.type || 'application/octet-stream' }), a.type);
        meta.path = path;
        out.push(meta);
        if (keep) keep.set(a.id, path);
      } catch (e) {
        // 单个附件失败不影响整篇笔记，但要记数，最后告诉用户
        missing++; out.push(meta);
      }
    }
    return { list: out, missing };
  }
  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  }
  function signedUrlOf(r) {
    if (!r) return '';
    if (typeof r === 'string') return r;
    const d = (r.data !== undefined ? r.data : r) || {};
    return d.signedUrl || d.signedURL || d.url || '';
  }

  /* 附件下载取址：分两步。
     ① cloudRows / attPathFor：定位对象路径 —— 附件自带 path 就直接用；没带
        （早期同步把 path 覆盖掉留下的数据缺陷）则从云端笔记行里查回来。
     ② attSignUrl：拿路径换签名地址，两条路径：
        A = SDK createSignedUrl（跨域 endpoint，仅作兜底尝试）
        B = 页面同源存储网关 /.cloud/storage/object/sign/runtime/<path>（主路径）
     只借用本模块已登录的 cloud 实例，同步主流程不受影响。 */
  let rowsP = null;
  function cloudRows() {
    if (rowsP) return rowsP;
    const owner = session && session.user && session.user.id;
    /* 登录态是异步恢复的，这里绝不缓存「未登录」，否则后面再也不查。 */
    if (!owner) return Promise.resolve({ rows: [], info: '未登录' });
    rowsP = (async () => {
      let r = null;
      try { r = await withTimeout(() => restRead('sj_notes', owner), 8000, null); } catch (_) {}
      if (r && !r.error && Array.isArray(r.data)) return { rows: r.data, info: '直连ok' };
      let r2 = null;
      try {
        r2 = await withTimeout(
          () => cloud.database.from('sj_notes').select('*').eq('owner_id', owner), 8000, null);
      } catch (_) {}
      if (r2 && !r2.error && Array.isArray(r2.data)) return { rows: r2.data, info: '直连失败→组件ok' };
      return { rows: [], info: '直连失败→组件无数据' };
    })().catch(() => ({ rows: [], info: '查库异常' }));
    return rowsP;
  }
  async function attPathFor(att) {
    if (att && att.path) return { path: att.path, from: 'local' };
    if (!att || !att.id) return { path: '', from: '' };
    const r = await cloudRows();
    for (const row of r.rows || []) {
      const hit = parseAtts(row && row.attachments).find((x) => x && x.id === att.id && x.path);
      if (hit) return { path: hit.path, from: 'cloud' };
    }
    return { path: '', from: '' };
  }
  async function attSignUrl(p) {
    /* A：SDK 跨域签名，超时放宽到 8s，避免误杀。 */
    try {
      const signed = await withTimeout(
        () => cloud.storage.createSignedUrl(p, 3600), 8000, null);
      const url = signedUrlOf(signed);
      if (url) return { url, via: 'A' };
    } catch (_) {}
    /* B：项目同源网关签名端点，与上传 / 下载同一套鉴权。 */
    let token = '';
    try { token = await withTimeout(() => gcToken(), 5000, ''); } catch (_) {}
    if (!token) return { url: '', via: '' };
    try {
      /* 不用 AbortSignal.timeout：带 SW 的页面里同源 POST 挂 signal 会被拖到超时；
         改用项目统一的 withTimeout 只放弃等待，请求本身不受影响。 */
      const res = await withTimeout(() => fetch(
        REST_BASE + '/.cloud/storage/object/sign/runtime/' + p, {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + token,
            'x-wb-webapp-access-key': REST_PK,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ expiresIn: 3600 }),
        }), 8000, null);
      if (!res || !res.ok) return { url: '', via: '' };
      const rel = signedUrlOf(await res.json());
      if (!rel) return { url: '', via: '' };
      /* 签名网关返回的相对地址形如 /object/sign/runtime/...，必须补上
         /.cloud/storage 前缀才是真正可取的文件路由。实测：缺前缀
         PWA/object/... → 404 text/html（静态兜底）；补前缀
         PWA/.cloud/storage/object/sign/runtime/... → 200 application/pdf。
         且保持同源（PWA 主机）：/.cloud/storage/ 在 sw.js 放行名单内可直连；
         跨源 shijian-notes-46125 对无 header 的 GET 会 403，故不换 host。 */
      const abs = /^https?:/i.test(rel) ? rel
        : location.origin + '/.cloud/storage/' + rel.replace(/^\/+/, '');
      return { url: abs, via: 'B' };
    } catch (_) { return { url: '', via: '' }; }
  }
  /* 取附件的可下载地址；取不到时 url 为空字符串。 */
  window.SJSignedUrl = function (att) {
    return attPathFor(att).then(async (r) => {
      if (!r.path) return { url: '', from: '', via: '' };
      const s = await attSignUrl(r.path);
      return { url: s.url, from: r.from, via: s.via };
    }).catch(() => ({
      url: '', from: '', via: '',
    }));
  };

  /* 网络超时优先用浏览器原生的 AbortSignal.timeout：手机切后台时 JS 定时器
     会被冻结，只有原生 signal 能真的把请求断掉。老浏览器退回 AbortController。 */
  function timeoutSignal(ms) {
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
      return AbortSignal.timeout(ms);
    }
    if (typeof AbortController !== 'undefined') {
      const c = new AbortController();
      setTimeout(() => { try { c.abort(); } catch (_) {} }, ms);
      return c.signal;
    }
    return undefined;
  }
  /* 上传 / 下载都走页面同源的存储网关：与文字读取同一套鉴权、同一域名，
     不经过 SDK 的跨域请求，也就不会撞上 CORS 白名单不放行的自定义头。 */
  async function restDownload(att) {
    const token = await withTimeout(() => gcToken(), 4000, '');
    if (!token) return { why: '登录状态已失效' };
    let res;
    try {
      res = await fetch(REST_BASE + '/.cloud/storage/object/runtime/' + att.path, {
        headers: { Authorization: 'Bearer ' + token, 'x-wb-webapp-access-key': REST_PK },
        signal: timeoutSignal(10000),
      });
    } catch (e) { return { why: (e && (e.name || e.message)) || '网络错误' }; }
    if (!res.ok) return { why: 'HTTP ' + res.status };
    try {
      const blob = await res.blob();
      if (!blob || !blob.size) return { why: '空文件' };
      const data = await blobToDataUrl(blob);
      return data ? { data } : { why: '转码失败' };
    } catch (e) { return { why: (e && (e.name || e.message)) || '读取中断' }; }
  }
  /* 附件不可变（id 唯一），不需要 upsert；SDK 的 upload 会带 x-upsert，
     存储网关的 CORS 预检不放行这个头，所以按对象路径自己发。 */
  async function attUploadRaw(path, blob, type) {
    const token = await withTimeout(() => gcToken(), 4000, '');
    if (!token) throw new Error('登录状态已失效');
    const url = REST_BASE + '/.cloud/storage/object/runtime/' + path;
    const base = { Authorization: 'Bearer ' + token, 'x-wb-webapp-access-key': REST_PK };
    let last = '';
    try {
      const fd = new FormData();
      fd.append('', blob, String(path).split('/').pop() || 'file');
      const r = await fetch(url, {
        method: 'POST', headers: base, body: fd, signal: timeoutSignal(15000),
      });
      if (r.ok) return true;
      const txt = await r.text().catch(() => '');
      if (/exist|duplicate|already/i.test(txt)) return true;
      last = 'POST ' + r.status + ' ' + txt.slice(0, 80);
    } catch (e) { last = 'POST ' + ((e && e.message) || '网络错误'); }
    const r2 = await fetch(url, {
      method: 'PUT',
      headers: Object.assign({ 'Content-Type': type || 'application/octet-stream' }, base),
      body: blob, signal: timeoutSignal(15000),
    });
    if (r2.ok) return true;
    throw new Error(last + ' / PUT ' + r2.status);
  }

  /* 取云端一份附件，四条路依次退：
     ① 同源 REST 直连 GET；② SDK download；③ 签名地址 + fetch；
     ④ 只剩签名地址（<img src> 不校验 CORS，至少能显示）。
     每步各自限时；外层不再用比内部累计更短的硬超时把成功结果丢掉。 */
  const ATT_MS = 8000;
  const SIGN_MS = 3000;
  async function pullAttachment(att) {
    if (!att || !att.path) return { why: '缺少云端路径' };
    const why = [];

    const d = await restDownload(att);
    if (d.data) return { data: d.data, via: '直连' };
    why.push('直连 ' + d.why);

    try {
      const r = await withTimeout(() => cloud.storage.download(att.path), ATT_MS, null);
      if (r && r.data && r.data.size) {
        const data = await withTimeout(() => blobToDataUrl(r.data), ATT_MS, '');
        if (data) return { data, via: '组件' };
      }
      why.push('组件 ' + ((r && r.error && r.error.message) || '无数据'));
    } catch (e) { why.push('组件 ' + ((e && e.message) || '异常')); }

    let url = '';
    try {
      const signed = await withTimeout(
        () => cloud.storage.createSignedUrl(att.path, 3600), SIGN_MS, null);
      url = signedUrlOf(signed);
    } catch (e) { why.push('签名 ' + ((e && e.message) || '异常')); }
    if (!url) return { why: why.join(' / ') };

    try {
      const res = await fetch(url, { signal: timeoutSignal(ATT_MS) });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const blob = await res.blob();
      if (!blob || !blob.size) throw new Error('空文件');
      const data = await blobToDataUrl(blob);
      if (!data) throw new Error('转码失败');
      return { data, via: '签名直取' };
    } catch (e) {
      return {
        remoteUrl: url, via: '签名地址',
        why: why.join(' / ') + ' / 签名取图 ' + ((e && (e.name || e.message)) || '失败'),
      };
    }
  }

  /* ---------------------------------------------------------- 面板 */
  /* 结果写进面板，成功 2 秒 / 失败 3.5 秒后自动收起；触摸面板即取消收起。 */
  let panelTimer = null;
  let lastMsg = '';
  let lastKind = '';
  function cancelAutoClose() { clearTimeout(panelTimer); panelTimer = null; }
  function scheduleClose(ms) {
    cancelAutoClose();
    panelTimer = setTimeout(() => { closePanel(); lastMsg = ''; lastKind = ''; }, ms);
  }
  function ensurePanel() {
    let el = $('#syncPanel');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'syncPanel';
    el.className = 'sync-panel hidden';
    el.addEventListener('pointerdown', cancelAutoClose);
    document.body.appendChild(el);
    return el;
  }
  function openPanel() {
    cancelAutoClose();
    lastMsg = ''; lastKind = '';
    ensurePanel().classList.remove('hidden');
    renderPanel();
  }
  function closePanel() {
    cancelAutoClose();
    const p = $('#syncPanel'); if (p) p.classList.add('hidden');
  }

  async function renderPanel() {
    const panel = ensurePanel();
    const loggedIn = !!(session && session.user);
    const email = loggedIn ? (session.user.email || localStorage.getItem(LS_EMAIL) || '') : '';
    const last = fmtTime(lastSyncAt());
    const gcN = window.SJAttGC ? window.SJAttGC.count() : 0;

    panel.innerHTML =
      '<div class="sync-head"><strong>同步到云端</strong>' +
        '<button class="icon-btn sm" id="syncClose" title="关闭">✕</button></div>' +
      '<div class="sync-sub">本地优先：不点不同步，数据始终留在你手机上</div>' +
      (loggedIn
        ? '<div class="sync-info">已登录：<b>' + escapeHtml(email) + '</b><br>上次同步：' + last + '</div>' +
          '<p class="auth-msg" id="syncMsg"></p>' +
          '<button class="auth-btn" id="syncPush">上传本地笔记到云端</button>' +
          '<button class="auth-btn ghost" id="syncPull">从云端拉取到本地</button>' +
          (gcN ? '<button class="auth-btn ghost" id="syncGc">清理云端无用附件（' + gcN + '）</button>' : '') +
          '<button class="auth-btn ghost" id="syncSetPwd">设置 / 修改同步口令</button>' +
          '<button class="auth-btn ghost" id="syncLogout">退出登录</button>'
        : '<div class="sync-info">用 QQ 邮箱登录后，手机和电脑共用同一份笔记。</div>' +
          '<div class="auth-tabs">' +
          '  <button type="button" class="auth-tab active" data-tab="otp">验证码登录</button>' +
          '  <button type="button" class="auth-tab" data-tab="pwd">口令登录</button>' +
          '</div>' +
          '  <p class="auth-hint">还没有同步口令？点 <a href="javascript:void(0)" id="openSetPwd">设置同步口令</a>。</p>' +
          '<form id="syncLoginForm" novalidate>' +
          '  <label class="auth-label">QQ 邮箱</label>' +
          '  <div class="auth-row">' +
          '    <input class="auth-input" id="syncEmail" type="email" inputmode="email" autocomplete="username" placeholder="123456@qq.com">' +
          '    <button class="auth-btn ghost" type="button" id="syncCodeBtn">获取验证码</button>' +
          '  </div>' +
          '  <label class="auth-label">验证码</label>' +
          '  <input class="auth-input" id="syncCode" type="text" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="6 位数字">' +
          '  <p class="auth-msg" id="syncMsg"></p>' +
          '  <button class="auth-btn" type="submit" id="syncLoginBtn">登录 / 注册</button>' +
          '</form>' +
          '<div id="pwdBox" class="hidden">' +
          '  <form id="syncPwdForm" novalidate>' +
          '    <label class="auth-label">QQ 邮箱</label>' +
          '    <input class="auth-input" id="syncEmail2" type="email" inputmode="email" autocomplete="username" placeholder="123456@qq.com">' +
          '    <label class="auth-label">同步口令</label>' +
          '    <input class="auth-input" id="syncPwd" type="password" autocomplete="current-password" placeholder="设置过的同步口令">' +
          '    <p class="auth-msg" id="syncMsg2"></p>' +
          '    <button class="auth-btn" type="submit" id="syncPwdBtn">邮箱 + 口令登录</button>' +
          '  </form>' +
          '</div>');

    const close = $('#syncClose'); if (close) close.onclick = closePanel;
    // renderPanel 会重建 innerHTML，上一次的结果提示要按缓存补回来
    const msgEl = $('#syncMsg');
    if (msgEl && lastMsg) {
      msgEl.textContent = lastMsg;
      msgEl.className = 'auth-msg' + (lastKind ? ' ' + lastKind : ' err');
    }
    if (loggedIn) {
      const push = $('#syncPush'); if (push) push.onclick = () => doPush();
      const pull = $('#syncPull'); if (pull) pull.onclick = () => doPull();
      const out = $('#syncLogout'); if (out) out.onclick = () => doLogout();
      const gc = $('#syncGc'); if (gc) gc.onclick = () => doGc();
      const setPwd = $('#syncSetPwd'); if (setPwd) setPwd.onclick = () => openSetPwd();
    } else {
      const codeBtn = $('#syncCodeBtn'); if (codeBtn) codeBtn.onclick = () => sendCode($('#syncEmail').value.trim(), codeBtn);
      const form = $('#syncLoginForm'); if (form) form.onsubmit = (e) => { e.preventDefault(); doLogin(); };
      const tabBtns = panel.querySelectorAll('.auth-tab');
      tabBtns.forEach((t) => {
        t.onclick = () => {
          tabBtns.forEach((x) => x.classList.remove('active'));
          t.classList.add('active');
          const tab = t.dataset.tab;
          const f = $('#syncLoginForm'); if (f) f.classList.toggle('hidden', tab !== 'otp');
          const p = $('#pwdBox'); if (p) p.classList.toggle('hidden', tab !== 'pwd');
        };
      });
      const pwdForm = $('#syncPwdForm'); if (pwdForm) pwdForm.onsubmit = (e) => { e.preventDefault(); doLoginPwd(); };
      const setBtn = $('#openSetPwd'); if (setBtn) setBtn.onclick = () => openSetPwd();
    }
  }

  function syncMsg(text, kind) {
    lastMsg = text || '';
    lastKind = kind || '';
    const el = $('#syncMsg');
    if (!el) return;
    el.textContent = lastMsg;
    el.className = 'auth-msg' + (lastKind ? ' ' + lastKind : ' err');
  }

  /* ---------------------------------------------------------- 登录 OTP */
  async function sendCode(email, btn) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return syncMsg('请填写正确的邮箱');
    btn.disabled = true; btn.textContent = '发送中…';
    const r = await cloud.auth.sendOtp({ email });
    if (r.error) { btn.disabled = false; btn.textContent = '获取验证码'; return syncMsg(friendly(r.error)); }
    pendingOtp = { email, verificationId: r.data.verificationId, isExistingUser: !!r.data.isExistingUser };
    syncMsg('验证码已发到邮箱，10 分钟内有效', 'ok');
    startCooldown(btn);
  }
  function startCooldown(btn) {
    let left = 60; clearInterval(cooldownTimer);
    btn.disabled = true; btn.textContent = left + ' 秒后重发';
    cooldownTimer = setInterval(() => {
      left--;
      if (left <= 0) { clearInterval(cooldownTimer); btn.disabled = false; btn.textContent = '重新获取'; }
      else btn.textContent = left + ' 秒后重发';
    }, 1000);
  }
  async function doLogin() {
    const email = $('#syncEmail').value.trim();
    const code = $('#syncCode').value.trim();
    if (!pendingOtp || pendingOtp.email !== email) return syncMsg('请先获取验证码');
    if (!/^\d{4,8}$/.test(code)) return syncMsg('请填写收到的验证码');
    const btn = $('#syncLoginBtn'); btn.disabled = true; btn.textContent = '验证中…';
    const r = await cloud.auth.verifyOtp({
      email: pendingOtp.email, verificationId: pendingOtp.verificationId,
      isExistingUser: pendingOtp.isExistingUser, token: code,
    });
    btn.disabled = false; btn.textContent = '登录 / 注册';
    if (r.error) return syncMsg(friendly(r.error));
    pendingOtp = null;
    session = normSession(await cloud.auth.getSession());
    localStorage.setItem(LS_EMAIL, email);
    lastMsg = ''; lastKind = '';   // 登录成功，把「验证码已发」这类过程提示清掉
    await renderPanel();
    toast('登录成功，可以同步了');
  }
  async function doLogout() {
    await cloud.auth.signOut();
    session = null; localStorage.removeItem(LS_EMAIL);
    lastMsg = ''; lastKind = '';
    await renderPanel();
    toast('已退出登录');
  }

  /* ---------------------------------------------------------- 登录：口令直登 / 设置口令
     桌面端已跑通这套流程，手机端复用同一份 SDK 接口，不改数据结构。 */
  function syncMsgTo(elId, text, kind) {
    const el = $('#' + elId);
    if (!el) return;
    el.textContent = text || '';
    el.className = 'auth-msg' + (kind ? ' ' + kind : ' err');
  }
  async function doLoginPwd() {
    const email = $('#syncEmail2').value.trim();
    const pwd = $('#syncPwd').value;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return syncMsgTo('syncMsg2', '请填写正确的邮箱');
    if (!pwd) return syncMsgTo('syncMsg2', '请输入同步口令');
    const btn = $('#syncPwdBtn'); btn.disabled = true; btn.textContent = '登录中…';
    const r = await cloud.auth.signInWithPassword({ email, password: pwd });
    btn.disabled = false; btn.textContent = '邮箱 + 口令登录';
    if (r.error) return syncMsgTo('syncMsg2', friendly(r.error));
    session = normSession(await cloud.auth.getSession());
    localStorage.setItem(LS_EMAIL, email);
    lastMsg = ''; lastKind = '';
    await renderPanel();
    toast('登录成功，可以同步了');
  }
  function openSetPwd() {
    // 同步面板层级高于弹层，先收起面板，否则弹窗会被面板压住
    const email0 = (session && session.user && session.user.email) ||
      (($('#syncEmail2') || {}).value || ($('#syncEmail') || {}).value || '').trim();
    closePanel();
    const m = window.openModal(
      '<div class="hist-head"><div><h3>设置同步口令</h3><p>设置后可用「邮箱 + 口令」登录，免收验证码</p></div>' +
      '<button class="icon-btn" data-act="close" title="关闭">✕</button></div>' +
      '<div class="e2ee-body">' +
      '<div class="e2ee-row"><label class="auth-label">QQ 邮箱</label>' +
      '<input class="auth-input" id="spEmail" type="email" inputmode="email" value="' + escapeHtml(email0) + '" placeholder="123456@qq.com"></div>' +
      '<div class="e2ee-row"><button class="auth-btn ghost" id="spCode" type="button">获取验证码</button></div>' +
      '<div class="e2ee-row"><label class="auth-label">邮箱验证码</label>' +
      '<input class="auth-input" id="spOtp" inputmode="numeric" maxlength="6" placeholder="6 位数字"></div>' +
      '<div class="e2ee-row"><label class="auth-label">新同步口令（至少 6 位）</label>' +
      '<input class="auth-input" id="spPwd" type="password" placeholder="设置口令"></div>' +
      '<div class="e2ee-row"><button class="auth-btn" id="spSave">设置口令</button></div>' +
      '<div id="spMsg" class="e2ee-msg"></div></div>');
    m.classList.add('pwd-box');
    const close = () => { window.closeModal(); openPanel(); };
    m.querySelector('[data-act="close"]').addEventListener('click', close);
    const msg = (t, ok) => { const e = m.querySelector('#spMsg'); e.textContent = t; e.style.color = ok ? '#2f6f5e' : '#c0392b'; };
    m.querySelector('#spCode').addEventListener('click', async () => {
      const em = m.querySelector('#spEmail').value.trim();
      if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return msg('请填写正确的邮箱');
      const b = m.querySelector('#spCode'); b.disabled = true; b.textContent = '发送中…';
      const r = await cloud.auth.resetPasswordForEmail({ email: em });
      b.disabled = false; b.textContent = '重新获取';
      if (r.error) return msg('发送失败：' + friendly(r.error));
      m._updateUser = r.data && r.data.updateUser;
      msg('验证码已发送到邮箱', true);
    });
    m.querySelector('#spSave').addEventListener('click', async () => {
      const em = m.querySelector('#spEmail').value.trim();
      const otp = m.querySelector('#spOtp').value.trim();
      const pwd = m.querySelector('#spPwd').value;
      if (!m._updateUser) return msg('请先获取验证码');
      if (!/^\d{4,8}$/.test(otp)) return msg('请填写验证码');
      if (pwd.length < 6) return msg('口令至少 6 位');
      const b = m.querySelector('#spSave'); b.disabled = true; b.textContent = '设置中…';
      try {
        const r = await m._updateUser({ nonce: otp, password: pwd });
        if (r.error) return msg('失败：' + friendly(r.error));
        session = normSession(await cloud.auth.getSession());
        localStorage.setItem(LS_EMAIL, em);
        lastMsg = ''; lastKind = '';
        window.closeModal();
        openPanel();
        toast('同步口令已设置');
      } catch (e) { msg('失败：' + (e.message || e)); }
      finally { b.disabled = false; b.textContent = '设置口令'; }
    });
  }

  /* ---------------------------------------------------------- 上传：本地 → 云端 */
  async function doPush() {
    if (!session || !session.user) return;
    cancelAutoClose(); lastMsg = ''; lastKind = '';
    const owner = session.user.id;
    if (!markBusy('push', '#syncPush', '上传中…（可再点重试）')) return;
    try {
      if (window.SJSaveNow) window.SJSaveNow();
      const local = window.SJLocal.getState();

      const catRows = local.categories.map((c) => catToRow(c, owner));
      if (catRows.length) {
        const r = await withTimeout(() => cloud.database.from('sj_categories').upsert(catRows), 20000, null);
        if (!r) throw new Error('上传类别超时，请检查网络后重试');
        if (r.error) throw new Error(friendly(r.error));
      }

      let missing = 0;
      /* 先拿云端已有的附件路径：本地缺 path 时用它兜住，避免把云端记录覆盖成
         没有 path 的残缺元信息（不可逆的附件丢失）。读不到就整轮停下——宁可不
         传，也不能写坏云端那份唯一正确的 path。 */
      const known = await cloudAttPaths(owner);
      if (!known.ok && local.notes.some((n) => (n.attachments || []).some((a) => a && a.id && !a.path))) {
        throw new Error('读不到云端已有的附件记录，为避免覆盖附件路径已停止上传，请检查网络后重试');
      }
      for (const n of local.notes) {
        // 回收站里的笔记只同步墓碑和已有路径，不再重传文件本体
        const atts = n.deletedAt
          ? { list: (n.attachments || []).filter((a) => a && a.id).map((a) => {
              const m = { id: a.id, name: a.name, size: a.size || 0, type: a.type };
              const p = a.path || known.map.get(a.id);
              if (p) m.path = p;
              return m;
            }), missing: 0 }
          : await pushAttachments(n, owner, known.map);
        missing += atts.missing;
        const row = noteToRow(n, owner);
        row.attachments = atts.list;
        const r = await withTimeout(() => cloud.database.from('sj_notes').upsert([row]), 20000, null);
        if (!r) throw new Error('上传笔记超时，请检查网络后重试');
        if (r.error) throw new Error(friendly(r.error));
      }

      localStorage.setItem(LS_LAST, String(Date.now()));
      if (missing) {
        syncMsg(`已上传 ${local.categories.length} 个类别 + ${local.notes.length} 篇笔记；有 ${missing} 个附件没能上传（本机找不到原文件），请重新插入后再传`, '');
        toast('笔记已上传，但有附件没传上去');
        scheduleClose(3500);
      } else {
        syncMsg(`已上传 ${local.categories.length} 个类别 + ${local.notes.length} 篇笔记`, 'ok');
        toast('已同步到云端，电脑端登录同一账号即可查看');
        scheduleClose(2000);
      }
    } catch (e) {
      syncMsg('上传失败：' + e.message);
      toast('上传失败：' + e.message);
      scheduleClose(3500);
    } finally {
      clearBusy('push', '#syncPush', '上传本地笔记到云端');
      renderPanel();
    }
  }

  /* 云端附件清理：彻底删除笔记时记下的路径，用直连 DELETE 清掉。 */
  async function gcToken() {
    try { const t = await cloud.auth.getAccessToken(); if (t) return t; } catch (_) {}
    try {
      const r = await cloud.auth.getSession();
      const s = (r && (r.data || r)) || {};
      return (s.session && s.session.access_token) || s.access_token || '';
    } catch (_) { return ''; }
  }
  async function gcDelete(path, token) {
    const r = await withTimeout(() => fetch(REST_BASE + '/.cloud/storage/object/runtime/' + path, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token, 'x-wb-webapp-access-key': REST_PK },
    }), 12000, null);
    return !!(r && (r.ok || r.status === 404));
  }
  async function doGc() {
    if (!session || !session.user) return;
    cancelAutoClose(); lastMsg = ''; lastKind = '';
    const queue = window.SJAttGC ? window.SJAttGC.list() : {};
    const paths = Object.keys(queue);
    if (!paths.length) { syncMsg('没有需要清理的云端附件', 'ok'); scheduleClose(2000); return; }
    if (!markBusy('gc', '#syncGc', '清理中…（可再点重试）')) return;
    try {
      const token = await gcToken();
      if (!token) throw new Error('登录状态已失效，请退出后重新登录');
      let ok = 0; const failed = [];
      for (const p of paths) {
        try { if (await gcDelete(p, token)) ok++; else failed.push(p); }
        catch (_) { failed.push(p); }
      }
      if (window.SJAttGC) window.SJAttGC.drop(paths.filter((p) => failed.indexOf(p) < 0));
      syncMsg(`已清理 ${ok} 个云端附件${failed.length ? '，' + failed.length + ' 个失败，可稍后重试' : ''}`,
        failed.length ? '' : 'ok');
      toast(failed.length ? '部分附件清理失败' : '云端附件已清理');
      scheduleClose(failed.length ? 3500 : 2000);
    } catch (e) {
      syncMsg('清理失败：' + e.message);
      toast('清理失败：' + e.message);
      scheduleClose(3500);
    } finally {
      clearBusy('gc', '#syncGc');   // 文字由 renderPanel 按最新数量重建
      renderPanel();
    }
  }

  /* ---------------------------------------------------------- 下载：云端 → 本地
     主流程只做「读云端 → 合并文字 → 落盘 → 交付」，不 await 图片 / IndexedDB /
     重渲染；图片一律放后台补。三个同步按钮只换文字、全程可点，busy 集合防重复。 */
  const busy = new Set();
  function markBusy(key, sel, text) {
    if (busy.has(key)) return false;
    busy.add(key);
    const b = $(sel);
    if (b) { b.disabled = false; b.textContent = text; }
    return true;
  }
  function clearBusy(key, sel, text) {
    busy.delete(key);
    const b = $(sel);
    if (b) {
      b.disabled = false;
      if (text) b.textContent = text;
    }
  }

  let pulling = false;
  let pullSeq = 0;

  /* seq 有值时，只有本次拉取仍是「当前那次」才恢复按钮：用户中途重试或
     硬恢复作废本次后，旧流程的 finally 不会把新流程的按钮状态冲掉。 */
  function restorePullBtn(seq) {
    if (seq !== undefined && seq !== pullSeq) return;
    pulling = false;
    const b = $('#syncPull');
    if (b) { b.disabled = false; b.textContent = '从云端拉取到本地'; }
  }
  /* 同步按钮永不 disabled：异步链路挂起时用户仍可重试。
     再点一次 = 停止上一次。 */
  function markPullBusy() {
    pulling = true;
    const b = $('#syncPull');
    if (b) { b.disabled = false; b.textContent = '正在拉取…（再点重试）'; }
  }
  /* 等网络之前先把本机已有的笔记渲染出来，不让用户对着「0 篇」空白干等。 */
  function paintLocalNow() {
    try {
      if (!window.SJLocal || !window.SJLocal.getState) return;
      const st = window.SJLocal.getState();
      if (st && st.notes) refreshFromLocal(st.categories || [], st.notes);
    } catch (_) {}
  }

  /* 后台补图：与主流程完全解耦。失败 / 超时都不影响已经交付的
     笔记文字，也不会把按钮锁住。 */
  async function backfillAttachments(cloudNotes, keepId, seq) {
    const got = new Map();
    const deadline = Date.now() + 90000;
    for (const n of cloudNotes) {
      for (const a of (n.attachments || [])) {
        if (seq !== pullSeq) return;              // 用户又发起了一次拉取，旧的停手
        if (!a || !a.id || !a.path) continue;
        if (Date.now() > deadline) break;
        const hasLocal = window.SJAttStore
          ? await withTimeout(() => window.SJAttStore.has(a.id), 2000, false) : false;
        if (hasLocal) continue;
        /* 外层必须比内部四步的累计上限长，否则会把已经成功的下载判成失败。 */
        const r = await withTimeout(() => pullAttachment(a), 32000, { why: '整体超时' });
        if (r && (r.data || r.remoteUrl)) got.set(a.id, r);
      }
      if (Date.now() > deadline) break;
    }
    if (!got.size) return;
    /* 只补附件、不动正文：以当前 state 为准，用户期间编辑过的内容不会被覆盖。
       setState 内部会自动把 data URL 交给附件仓并从 localStorage 摘掉。 */
    try {
      const st = window.SJLocal.getState();
      st.notes.forEach((n) => {
        n.attachments = (n.attachments || []).map((a) => {
          if (!a || !a.id || !got.has(a.id)) return a;
          const g = got.get(a.id);
          return Object.assign({}, a, g.data ? { data: g.data } : { remoteUrl: g.remoteUrl });
        });
      });
      window.SJLocal.setState({ categories: st.categories, notes: st.notes, versions: st.versions });
      if (window.SJLocal.flushAtt) await withTimeout(() => window.SJLocal.flushAtt(), 5000, null);
      if (window.SJBoot) await withTimeout(() => window.SJBoot(keepId), 5000, null);
      if (window.SJLocal.watchFiles) window.SJLocal.watchFiles();
    } catch (_) {}
  }

  async function doPull() {
    if (!session || !session.user) return;
    if (pulling) {
      /* 再点一次 = 停止上一次，不让用户只能干等 */
      pullSeq++;
      restorePullBtn();
      syncMsg('已停止上一次拉取，请再点一次重新开始');
      return;
    }
    const seq = ++pullSeq;
    cancelAutoClose(); lastMsg = ''; lastKind = '';
    markPullBusy();
    syncMsg('正在连接云端…（按钮一直可点，随时可重试）');
    /* 硬恢复：5 秒还没拿到云端数据就把按钮文字还给用户。
       即使这个定时器也被浏览器冻结，按钮本来就没被禁用，用户照样能操作。 */
    const hardTimer = setTimeout(() => {
      if (seq === pullSeq && pulling) {
        /* 作废本次：否则弱网时旧流程仍会在稍后完成，覆盖用户随后重试的
           按钮状态与面板（hardTimer 5s < 直连 8s + SDK 兜底 6s，弱网必触发）。 */
        pullSeq++;
        restorePullBtn();
        syncMsg('云端响应较慢，已停止等待，请直接重试。');
      }
    }, 5000);
    const owner = session.user.id;
    try {
      /* 先把当前正在编辑的内容落盘：拉取结束后界面要重新渲染，
         不先保存的话刚敲的字会被冲掉。保存失败也不能挡住同步。 */
      if (window.SJSaveNow) { try { window.SJSaveNow(); } catch (_) {} }
      paintLocalNow();

      /* 两段读取并行，走浏览器原生超时；SDK 只在直连失败时兜底。
         直连失败时才用同步组件兜底。 */
      const pair = await Promise.all([
        restRead('sj_categories', owner).catch(() => null),
        restRead('sj_notes', owner).catch(() => null),
      ]);
      let catsRes = pair[0], notesRes = pair[1];
      if (!catsRes || !notesRes) {
        catsRes = catsRes || await withTimeout(
          () => cloud.database.from('sj_categories').select('*').eq('owner_id', owner), 6000, null);
        notesRes = notesRes || await withTimeout(
          () => cloud.database.from('sj_notes').select('*').eq('owner_id', owner), 6000, null);
      }
      if (seq !== pullSeq) return;
      if (!catsRes || !notesRes) throw new Error('云端读取超时，请检查网络后重试');
      if (catsRes.error) { console.error('[同步] 读取云端类别失败', catsRes.error); throw new Error(friendly(catsRes.error)); }
      if (notesRes.error) { console.error('[同步] 读取云端笔记失败', notesRes.error); throw new Error(friendly(notesRes.error)); }

      /* 只做行转换，不碰任何图片请求 —— 主流程到交付为止最多两次网络等待。 */
      const cloudCats = (catsRes.data || []).map(rowToCat);
      const cloudNotes = (notesRes.data || []).map(rowToNote);
      let attCount = 0, noPath = 0;
      cloudNotes.forEach((n) => (n.attachments || []).forEach((a) => {
        if (!a || !a.id) return;
        if (a.path) attCount++;
        else if (!a.data) noPath++;
      }));

      const local = window.SJLocal.getState();

      /* 笔记正文按时间取胜，但附件要单独补：老版本同步过的笔记本机只有
         附件元信息、没有二进制，正文里的图就会一直空着。这里是「谁有图用谁的」。
         等级：0 只有元信息、1 只有路径或签名地址（会过期）、2 有二进制。
         path 也算 1 档：本地一旦把 path 弄丢，往后每次 push 都会把云端那份
         覆盖成空（附件从此谁都下不动），所以云端有 path 的必须优先拿回来。 */
      const rank = (a) => (!a ? 0 : a.data ? 2 : (a.path || a.remoteUrl) ? 1 : 0);
      /* 两边的 path 谁有就留谁：即使挑中了本地那份，也要把云端的 path 补进来。 */
      const keepPath = (chosen, other) => {
        if (!chosen || !other || chosen.path || !other.path) return chosen;
        return Object.assign({}, chosen, { path: other.path });
      };
      const withAtts = (mine, theirs) => {
        const list = Array.isArray(theirs.attachments) ? theirs.attachments : [];
        if (!list.length) return mine;
        const byId = new Map((mine.attachments || []).map((a) => [a.id, a]));
        let changed = false;
        for (const theirItem of list) {
          if (!theirItem || !theirItem.id) continue;
          const mineItem = byId.get(theirItem.id);
          if (!mineItem) { byId.set(theirItem.id, theirItem); changed = true; continue; }
          if (rank(theirItem) > rank(mineItem)) { byId.set(theirItem.id, theirItem); changed = true; continue; }
          const fixed = keepPath(mineItem, theirItem);
          if (fixed !== mineItem) { byId.set(theirItem.id, fixed); changed = true; }
        }
        return changed ? Object.assign({}, mine, { attachments: [...byId.values()] }) : mine;
      };
      const conflicts = [];
      const merge = (arr, cloudArr) => {
        const map = new Map(arr.map((x) => [x.id, x]));
        const last = lastSyncAt();
        const editedAfter = (n) => Number(n.updatedAt) > Number(last) + 1000;
        const sig = (n) => (n ? (n.content || '').slice(0, 240) : '');
        for (const c of cloudArr) {
          const ex = map.get(c.id);
          if (!ex) { map.set(c.id, c); continue; }
          if (editedAfter(c) && editedAfter(ex) && sig(c) !== sig(ex)) {
            conflicts.push({ id: c.id, title: ex.title || c.title || '无标题笔记', local: ex, cloud: c });
          }
          if (Number(c.updatedAt) > Number(ex.updatedAt)) map.set(c.id, withAtts(c, ex));
          else map.set(c.id, withAtts(ex, c));
        }
        return Array.from(map.values());
      };
      const finalCats = merge(local.categories, cloudCats);
      const finalNotes = merge(local.notes, cloudNotes);
      window.SJLocal.setState({
        categories: finalCats,
        notes: finalNotes,
        versions: local.versions,
      });
      localStorage.setItem(LS_LAST, String(Date.now()));

      /* 关键：立刻把结果灌进界面数据源，不等后台 boot。
         boot() 要走 IndexedDB 就绪等待 + api('/api/state') + 全量重绘，
         任何一环没跑通，用户就会看到「同步成功但仍 0 篇」。 */
      const uiOk = refreshFromLocal(finalCats, finalNotes);

      /* 落盘校验：localStorage 写失败（配额满）会被 local.js 静默吞掉，
         表现是「同步成功、重开又没了」。读回来核一次篇数。 */
      let savedCount = -1;
      try {
        const raw = localStorage.getItem('sj_mobile_v1');
        if (raw) savedCount = (JSON.parse(raw).notes || []).length;
      } catch (_) {}
      const saveOk = savedCount === finalNotes.length;

      const keepId = window.SJCurrentNoteId ? window.SJCurrentNoteId() : '';

      /* ======= 结果先交付：到这里主流程就结束了，后面全是后台任务 ======= */
      let extra = '';
      if (noPath) extra += `；其中 ${noPath} 个附件云端只有文件名，需在电脑端重新上传一次`;
      if (attCount) extra += `；${attCount} 张图片正在后台补充，不影响文字`;
      if (!uiOk) extra += '；界面未自动刷新，请重开页面确认';
      if (!saveOk) extra += '；本机保存校验未通过（可能存储已满），请重开页面确认笔记还在';
      syncMsg(`已从云端拉取最新内容（类别 ${cloudCats.length}，笔记 ${cloudNotes.length}，本机 ${finalNotes.length} 篇）${extra}`, 'ok');
      toast('已从云端同步到本地');
      clearTimeout(hardTimer);
      restorePullBtn(seq);
      scheduleClose((noPath || attCount) ? 6000 : 2000);

      /* 写盘 / 重渲染 / 冲突弹窗放下一个宏任务，且互不等待。 */
      setTimeout(() => {
        try {
          /* 界面没刷出来就再试一次（此时 app.js 可能才刚加载完） */
          if (!uiOk) refreshFromLocal(finalCats, finalNotes);
          if (window.SJLocal.flushAtt) withTimeout(() => window.SJLocal.flushAtt(), 5000, null);
          if (window.SJBoot) withTimeout(() => window.SJBoot(keepId), 5000, null);
          if (window.SJLocal.watchFiles) window.SJLocal.watchFiles();
          if (conflicts.length && window.SJConflict) {
            window.SJConflict.show(conflicts, function (res) {
              const st = window.SJLocal.getState();
              const m2 = new Map(st.notes.map((x) => [x.id, x]));
              conflicts.forEach(function (cf) {
                const target = m2.get(cf.id);
                if (!target) return;
                if (res[cf.id] === 'cloud') {
                  target.content = cf.cloud.content; target.title = cf.cloud.title; target.updatedAt = cf.cloud.updatedAt;
                } else if (res[cf.id] === 'mine') {
                  target.content = cf.local.content; target.title = cf.local.title; target.updatedAt = cf.local.updatedAt;
                } else if (res[cf.id] === 'both') {
                  st.notes.push(Object.assign({}, cf.cloud, {
                    id: 'cpy_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
                    title: (cf.cloud.title || '无标题') + '（副本）',
                  }));
                }
              });
              window.SJLocal.setState({ categories: st.categories, notes: st.notes, versions: st.versions });
              if (window.SJBoot) window.SJBoot(window.SJCurrentNoteId ? window.SJCurrentNoteId() : '');
            });
          }
        } catch (_) {}
      }, 0);
      /* 图片最后才补，且完全独立于同步收尾 */
      if (attCount) {
        setTimeout(() => backfillAttachments(cloudNotes, keepId, seq), 1200);
      }
    } catch (e) {
      syncMsg('拉取失败：' + e.message);
      toast('拉取失败：' + e.message);
      scheduleClose(3500);
    } finally {
      clearTimeout(hardTimer);
      /* 已被重试 / 硬恢复作废的旧流程，不要再动按钮和面板 */
      if (seq === pullSeq) {
        restorePullBtn(seq);
        renderPanel();
      }
    }
  }

  /* ---------------------------------------------------------- 初始化 */
  (async function init() {
    try { session = normSession(await cloud.auth.getSession()); } catch (e) { session = null; }
    cloud.auth.onAuthStateChange((e) => {
      if (e === 'SIGNED_OUT') { session = null; localStorage.removeItem(LS_EMAIL); renderPanel(); }
    });
  })();

  window.SJSync = { open: openPanel, close: closePanel, getSession: () => session };
})();
