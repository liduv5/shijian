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
  let session = null;
  let pendingOtp = null;
  let cooldownTimer = null;

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
    /* 云端 API 出错时返回的是 { error, error_description }，没有 message 字段。
       以前一律吞成「操作失败，请稍后再试」，用户和开发者都看不出原因。 */
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
  function rowToNote(r) {
    const att = parseAtts(r.attachments);
    return {
      id: r.id, title: r.title, content: r.content,
      format: r.format === 'rich' ? 'rich' : 'md',
      categoryId: r.category_key || null, starred: !!r.starred,
      tags: Array.isArray(r.tags) ? r.tags : [], attachments: att,
      createdAt: r.created_at ? Date.parse(r.created_at) : Date.now(),
      updatedAt: r.updated_at ? Date.parse(r.updated_at) : Date.now(),
      deletedAt: r.deleted_at ? Date.parse(r.deleted_at) : 0,
    };
  }

  /* ---------------------------------------------------------- 附件：本地 <-> 云端 */
  async function pushAttachments(note, owner) {
    const atts = Array.isArray(note.attachments) ? note.attachments : [];
    const out = [];
    let missing = 0;
    for (const a of atts) {
      if (!a || !a.id) continue;
      const meta = { id: a.id, name: a.name, size: a.size || 0, type: a.type };
      if (a.path) { meta.path = a.path; out.push(meta); continue; }
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
        const up = await cloud.storage.upload(path, new Blob([bytes], { type: a.type || 'application/octet-stream' }), { contentType: a.type, upsert: true });
        if (up && up.error) throw new Error(up.error.message || '上传失败');
        meta.path = path;
        out.push(meta);
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

  /* 取云端一份附件，三条路依次退：
     ① SDK 的 download(path)：带鉴权、同源 API，不受存储桶 CORS 与签名过期影响；
     ② 签名地址 + fetch；
     ③ 只剩签名地址（<img src> 不校验 CORS，至少能显示）。 */
  async function pullAttachment(att) {
    if (!att || !att.path) return att;

    try {
      const r = await cloud.storage.download(att.path);
      if (r && r.data && r.data.size) {
        return Object.assign({}, att, { data: await blobToDataUrl(r.data) });
      }
    } catch (e) { /* 换签名地址 */ }

    let url = '';
    try {
      url = signedUrlOf(await cloud.storage.createSignedUrl(att.path, 3600));
    } catch (e) {
      return att;
    }
    if (!url) return att;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const blob = await res.blob();
      if (!blob.size) throw new Error('空文件');
      return Object.assign({}, att, { data: await blobToDataUrl(blob) });
    } catch (e) {
      return Object.assign({}, att, { remoteUrl: url });
    }
  }

  /* ---------------------------------------------------------- 面板 */
  /* 面板自动收起：以前同步完只在底部闪一下 toast，同步面板一直开着，
     看起来就是「结果弹窗不消失」。现在结果写进面板里，成功后 2 秒、
     失败后 3.5 秒自动收起；这期间用户只要碰一下面板就取消收起。 */
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
          '<button class="auth-btn ghost" id="syncLogout">退出登录</button>'
        : '<div class="sync-info">用 QQ 邮箱登录后，手机和电脑共用同一份笔记。</div>' +
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
          '</form>');

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
    } else {
      const codeBtn = $('#syncCodeBtn'); if (codeBtn) codeBtn.onclick = () => sendCode($('#syncEmail').value.trim(), codeBtn);
      const form = $('#syncLoginForm'); if (form) form.onsubmit = (e) => { e.preventDefault(); doLogin(); };
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

  /* ---------------------------------------------------------- 上传：本地 → 云端 */
  async function doPush() {
    if (!session || !session.user) return;
    cancelAutoClose(); lastMsg = ''; lastKind = '';
    const owner = session.user.id;
    const btn = $('#syncPush'); if (btn) { btn.disabled = true; btn.textContent = '上传中…'; }
    try {
      if (window.SJSaveNow) window.SJSaveNow();
      const local = window.SJLocal.getState();

      const catRows = local.categories.map((c) => catToRow(c, owner));
      if (catRows.length) {
        const r = await cloud.database.from('sj_categories').upsert(catRows);
        if (r.error) throw new Error(friendly(r.error));
      }

      let missing = 0;
      for (const n of local.notes) {
        // 回收站里的笔记只同步墓碑和已有路径，不再重传文件本体
        const atts = n.deletedAt
          ? { list: (n.attachments || []).filter((a) => a && a.id).map((a) => {
              const m = { id: a.id, name: a.name, size: a.size || 0, type: a.type };
              if (a.path) m.path = a.path;
              return m;
            }), missing: 0 }
          : await pushAttachments(n, owner);
        missing += atts.missing;
        const row = noteToRow(n, owner);
        row.attachments = atts.list;
        const r = await cloud.database.from('sj_notes').upsert([row]);
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
      const b = $('#syncPush'); if (b) { b.disabled = false; b.textContent = '上传本地笔记到云端'; }
      renderPanel();
    }
  }

  /* 云端附件清理：彻底删除笔记时记下的路径，用直连 DELETE 清掉。 */
  const GC_ENDPOINT = 'https://shijian-notes-46125.app.workbuddy.host';
  const GC_PK = 'wbpk_dI8FNrfPPUj38F8big7tnc_ppkTgPWXNyg4hg2VzRPCDCwMgQT2Qft7';
  async function gcToken() {
    try { const t = await cloud.auth.getAccessToken(); if (t) return t; } catch (_) {}
    try {
      const r = await cloud.auth.getSession();
      const s = (r && (r.data || r)) || {};
      return (s.session && s.session.access_token) || s.access_token || '';
    } catch (_) { return ''; }
  }
  async function gcDelete(path, token) {
    const r = await fetch(GC_ENDPOINT + '/.cloud/storage/object/runtime/' + path, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token, 'x-wb-webapp-access-key': GC_PK },
    });
    return r.ok || r.status === 404;
  }
  async function doGc() {
    if (!session || !session.user) return;
    cancelAutoClose(); lastMsg = ''; lastKind = '';
    const queue = window.SJAttGC ? window.SJAttGC.list() : {};
    const paths = Object.keys(queue);
    if (!paths.length) { syncMsg('没有需要清理的云端附件', 'ok'); scheduleClose(2000); return; }
    const btn = $('#syncGc'); if (btn) { btn.disabled = true; btn.textContent = '清理中…'; }
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
    } finally { renderPanel(); }
  }

  /* ---------------------------------------------------------- 下载：云端 → 本地 */
  async function doPull() {
    if (!session || !session.user) return;
    cancelAutoClose(); lastMsg = ''; lastKind = '';
    const owner = session.user.id;
    const btn = $('#syncPull'); if (btn) { btn.disabled = true; btn.textContent = '拉取中…'; }
    try {
      /* 先把当前正在编辑的内容落盘：拉取结束后界面要重新渲染，
         不先保存的话刚敲的字会被冲掉。 */
      if (window.SJSaveNow) window.SJSaveNow();

      const catsRes = await cloud.database.from('sj_categories').select('*').eq('owner_id', owner);
      const notesRes = await cloud.database.from('sj_notes').select('*').eq('owner_id', owner);
      if (catsRes.error) { console.error('[同步] 读取云端类别失败', catsRes.error); throw new Error(friendly(catsRes.error)); }
      if (notesRes.error) { console.error('[同步] 读取云端笔记失败', notesRes.error); throw new Error(friendly(notesRes.error)); }

      const cloudCats = (catsRes.data || []).map(rowToCat);
      const cloudNotes = [];
      let noPath = 0, dlFail = 0;
      let done = 0, total = 0;
      for (const r of (notesRes.data || [])) {
        const base = rowToNote(r);
        total += (base.attachments || []).length;
      }
      for (const r of (notesRes.data || [])) {
        const base = rowToNote(r);
        const pulled = [];
        for (const a of (base.attachments || [])) {
          if (!a || !a.id) continue;
          if (a.path) {
            /* 本机附件仓已经有这份二进制（附件 id 唯一、内容不会变），别再下一遍，
               否则每次拉取都要把几十 MB 照片重传一次，手机上很费流量。 */
            if (window.SJAttStore && await window.SJAttStore.has(a.id)) {
              pulled.push(a); done++; continue;
            }
            const got = await pullAttachment(a);
            if (!got.data && !got.remoteUrl) dlFail++;
            pulled.push(got);
          } else if (a.data) {
            pulled.push(a);
          } else {
            /* 云端只有文件名、没有原文件（老版本桌面端只传了元信息）。
               以前这里直接丢弃，导致这条附件记录永远补不回来。 */
            noPath++;
            pulled.push(a);
          }
          done++;
          if (done % 3 === 0 && total) syncMsg(`正在下载图片… ${done}/${total}`);
        }
        base.attachments = pulled;
        cloudNotes.push(base);
      }

      // 合并：同一 id 以 updatedAt 较大的一方为准（last-write-wins）
      const local = window.SJLocal.getState();

      /* 笔记正文按时间取胜，但附件要单独补：老版本同步过的笔记本机只有
         附件元信息、没有二进制，正文里的图就会一直空着。这里是「谁有图用谁的」。 */
      /* 等级：0 只有元信息、1 只有签名地址（1 小时过期，不算真正有图）、2 有二进制。
         以前把 remoteUrl 也算成「有图」，于是上次拉取留下的死链会把这次
         真正下载到的图挡在外面 —— 反复点拉取也永远是空的。 */
      const rank = (a) => (!a ? 0 : a.data ? 2 : a.remoteUrl ? 1 : 0);
      const withAtts = (mine, theirs) => {
        const list = Array.isArray(theirs.attachments) ? theirs.attachments : [];
        if (!list.length) return mine;
        const byId = new Map((mine.attachments || []).map((a) => [a.id, a]));
        let changed = false;
        for (const theirItem of list) {
          if (!theirItem || !theirItem.id) continue;
          const mineItem = byId.get(theirItem.id);
          if (!mineItem) { byId.set(theirItem.id, theirItem); changed = true; continue; }
          if (rank(theirItem) > rank(mineItem)) { byId.set(theirItem.id, theirItem); changed = true; }
        }
        return changed ? Object.assign({}, mine, { attachments: [...byId.values()] }) : mine;
      };

      const merge = (arr, cloudArr) => {
        const map = new Map(arr.map((x) => [x.id, x]));
        const last = lastSyncAt();                 // 上次同步的时刻（合并前读取）
        const editedAfter = (n) => Number(n.updatedAt) > Number(last) + 1000;
        const sig = (n) => (n ? (n.content || '').slice(0, 240) : '');
        for (const c of cloudArr) {
          const ex = map.get(c.id);
          if (!ex) { map.set(c.id, c); continue; }
          // v1.8.0：两端都在「上次同步之后」改过、且正文不同 → 真实冲突，记录下来
          if (editedAfter(c) && editedAfter(ex) && sig(c) !== sig(ex)) {
            conflicts.push({ id: c.id, title: ex.title || c.title || '无标题笔记', local: ex, cloud: c });
          }
          if (Number(c.updatedAt) > Number(ex.updatedAt)) map.set(c.id, withAtts(c, ex));
          else map.set(c.id, withAtts(ex, c));
        }
        return Array.from(map.values());
      };
      const conflicts = [];
      window.SJLocal.setState({
        categories: merge(local.categories, cloudCats),
        notes: merge(local.notes, cloudNotes),
        versions: local.versions,
      });
      // 等图片/附件真的写进本机附件仓，再刷新界面
      if (window.SJLocal.flushAtt) await window.SJLocal.flushAtt();

      localStorage.setItem(LS_LAST, String(Date.now()));
      /* 记住当前打开的笔记，重渲染后原地不动（以前一律跳到最近修改那篇，
         用户会以为「点了同步就被切走了」）。 */
      const keepId = window.SJCurrentNoteId ? window.SJCurrentNoteId() : '';
      if (window.SJBoot) await window.SJBoot(keepId);
      if (window.SJLocal.watchFiles) window.SJLocal.watchFiles();

      /* v1.8.0：若检测到真实冲突，弹出选择，让用户决定保留哪一侧 */
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

      let extra = '';
      if (noPath) extra += `；其中 ${noPath} 个附件云端只有文件名、没有原文件，需在电脑端重新上传一次`;
      if (dlFail) extra += `；${dlFail} 个附件下载失败，请检查网络后重试`;
      syncMsg(`已从云端拉取最新内容（类别 ${cloudCats.length}，笔记 ${cloudNotes.length}）${extra}`,
        (noPath || dlFail) ? '' : 'ok');
      if (noPath || dlFail) toast('同步完成，但有附件没能下载，请看提示');
      else toast('已从云端同步到本地');
      scheduleClose((noPath || dlFail) ? 3500 : 2000);
    } catch (e) {
      syncMsg('拉取失败：' + e.message);
      toast('拉取失败：' + e.message);
      scheduleClose(3500);
    } finally {
      const b = $('#syncPull'); if (b) { b.disabled = false; b.textContent = '从云端拉取到本地'; }
      renderPanel();
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
