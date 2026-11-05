/* ============================================================
   拾笺 · 本地版 —— 同步到云端模块
   ------------------------------------------------------------
   本地优先：日常使用完全离线、不登录也能完整工作。
   只有点「同步到云端」才会登录，并把本地笔记上传 / 从云端下载。
   登录用 QQ 邮箱验证码（无需密码）；新邮箱首次验证即自动注册。
   ============================================================ */
(function () {
  'use strict';

  // 来自 workbuddy_cloud_service 的 publicConfig（可公开的客户端标识）
  const CONFIG = {
    endpoint: 'https://shijian-notes-46125.app.workbuddy.host',
    oauthRelayBaseUrl: 'https://www.workbuddy.cn/v2/as/genie-baas/oauth',
    publishableKey: 'wbpk_dI8FNrfPPUj38F8big7tnc_ppkTgPWXNyg4hg2VzRPCDCwMgQT2Qft7',
  };
  if (!window.WorkBuddyCloud) { console.warn('[同步] 云服务组件未加载'); return; }
  const cloud = window.WorkBuddyCloud.createWorkBuddyCloud(CONFIG);

  const $ = (s, r) => (r || document).querySelector(s);
  const LS_KEY = 'sj_cloud_session_email';
  let session = null;
  let pendingOtp = null;
  let cooldownTimer = null;

  /* SDK 的 getSession() 返回 { data: { user, email } }，这里统一成 { user, email }，
     未登录（或无 user）时返回 null。之前忘了拆 .data，导致 session.user 为 undefined，
     面板一直以为没登录（反复弹登录框），且上传/下载的 user.id 守卫直接 return（不同步）。 */
  function normSession(r) {
    if (!r) return null;
    const s = r.data || r;
    return (s && s.user) ? s : null;
  }

  /* ---------------------------------------------------------- 小工具 */
  function toast(msg, kind) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'toast show' + (kind ? ' ' + kind : '');
    clearTimeout(t._t);
    t._t = setTimeout(() => (t.className = 'toast'), 2000);
  }
  function lastSyncAt() { return Number(localStorage.getItem('sj_last_sync') || 0); }
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

  /* ---------------------------------------------------------- 数据转换 */
  function noteToRow(n) {
    return {
      id: n.id,
      title: n.title || '',
      content: n.content || '',
      format: n.format === 'rich' ? 'rich' : 'md',
      category_key: n.categoryId || null,
      tags: Array.isArray(n.tags) ? n.tags : [],
      starred: !!n.starred,
      // 数组直接存 jsonb；文件本体由 doPush 里的 uploadOneAtt 先传到存储桶，path 写在这里
      attachments: Array.isArray(n.attachments) ? n.attachments : [],
      created_at: new Date(Number(n.createdAt) || Date.now()).toISOString(),
      updated_at: new Date(Number(n.updatedAt) || Date.now()).toISOString(),
      // 删除墓碑：软删也要上传，否则另一台设备下次拉取会把删掉的笔记"复活"
      deleted_at: n.deletedAt ? new Date(Number(n.deletedAt)).toISOString() : null,
    };
  }
  function catToRow(c) {
    return {
      id: c.id,
      name: c.name || '未命名类别',
      parent_key: c.parentId || null,
      expanded: c.expanded !== false,
      sort_order: typeof c.order === 'number' ? c.order : 0,
      created_at: new Date(Number(c.createdAt) || Date.now()).toISOString(),
    };
  }
  function rowToCat(r) {
    return {
      id: r.id, name: r.name, parentId: r.parent_key || null,
      expanded: r.expanded !== false, order: r.sort_order || 0,
      createdAt: r.created_at ? Date.parse(r.created_at) : Date.now(),
    };
  }
  /* attachments 是 jsonb：有的客户端拿到的是数组，有的是 JSON 字符串，
     以前只按字符串 JSON.parse，遇到数组会抛错被吞掉，附件整个丢掉。 */
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

  /* ---------------------------------------------------------- 面板 */
  /* 面板自动收起：以前传完只在底部闪一下 toast，同步面板一直开着，
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
  async function openPanel() {
    cancelAutoClose();
    lastMsg = ''; lastKind = '';
    ensurePanel().classList.remove('hidden');
    await renderPanel();
  }
  function closePanel() {
    cancelAutoClose();
    const p = $('#syncPanel'); if (p) p.classList.add('hidden');
  }

  async function renderPanel() {
    const panel = ensurePanel();
    const loggedIn = !!(session && session.user);
    const email = loggedIn ? (session.user.email || localStorage.getItem(LS_KEY) || '') : '';
    const last = fmtTime(lastSyncAt());
    const gcN = window.SJAttGC ? window.SJAttGC.count() : 0;

    panel.innerHTML =
      '<div class="sync-head"><strong>同步到云端</strong>' +
        '<button class="icon-btn sm" id="syncClose" title="关闭">✕</button></div>' +
      '<div class="sync-sub">本地优先：不点不同步，数据始终留在你电脑上</div>' +
      (loggedIn
        ? '<div class="sync-info">已登录：<b>' + escapeHtml(email) + '</b><br>上次同步：' + last + '</div>' +
          '<p class="auth-msg" id="syncMsg"></p>' +
          '<button class="auth-btn" id="syncPush">上传本地笔记到云端</button>' +
          '<button class="auth-btn ghost" id="syncPull">从云端拉取到本地</button>' +
          (gcN ? '<button class="auth-btn ghost" id="syncGc">清理云端无用附件（' + gcN + '）</button>' : '') +
          '<button class="auth-btn ghost" id="syncLogout">退出登录</button>'
        : '<div class="sync-info">用 QQ 邮箱登录后，电脑和手机共用同一份笔记。</div>' +
          '<div class="auth-tabs">' +
          '  <button type="button" class="auth-tab active" data-tab="otp">验证码登录</button>' +
          '  <button type="button" class="auth-tab" data-tab="pwd">口令登录</button>' +
          '</div>' +
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
          '  <p class="auth-hint">还没有口令？先完成一次验证码登录，再点 <a href="javascript:void(0)" id="openSetPwd">设置同步口令</a>。</p>' +
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
    } else {
      const codeBtn = $('#syncCodeBtn'); if (codeBtn) codeBtn.onclick = () => sendCode($('#syncEmail').value.trim(), codeBtn);
      const form = $('#syncLoginForm'); if (form) form.onsubmit = (e) => { e.preventDefault(); doLogin(); };
      document.querySelectorAll('.auth-tab').forEach((t) => {
        t.onclick = () => {
          document.querySelectorAll('.auth-tab').forEach((x) => x.classList.remove('active'));
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
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
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
    localStorage.setItem(LS_KEY, email);
    lastMsg = ''; lastKind = '';   // 登录成功，把「验证码已发」这类过程提示清掉
    await renderPanel();
    toast('登录成功，可以同步了');
  }
  async function doLogout() {
    await cloud.auth.signOut();
    session = null; localStorage.removeItem(LS_KEY);
    lastMsg = ''; lastKind = '';
    await renderPanel();
    toast('已退出登录');
  }

  /* ---------------------------------------------------------- 登录：口令直登 */
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
    localStorage.setItem(LS_KEY, email);
    lastMsg = ''; lastKind = '';
    await renderPanel();
    toast('登录成功，可以同步了');
  }
  function openSetPwd() {
    const email0 = (($('#syncEmail2') || {}).value || ($('#syncEmail') || {}).value || '').trim();
    const m = window.openModal(
      '<div class="hist-head"><div><h3>设置同步口令</h3><p>设置后可用「邮箱 + 口令」登录，免收验证码</p></div>' +
      '<button class="icon-btn" data-act="close" title="关闭">✕</button></div>' +
      '<div class="e2ee-body">' +
      '<div class="e2ee-row"><label class="auth-label">QQ 邮箱</label>' +
      '<input class="auth-input" id="spEmail" type="email" value="' + escapeHtml(email0) + '" placeholder="123456@qq.com"></div>' +
      '<div class="e2ee-row"><button class="btn ghost block" id="spCode" type="button">获取验证码</button></div>' +
      '<div class="e2ee-row"><label class="auth-label">邮箱验证码</label>' +
      '<input class="auth-input" id="spOtp" inputmode="numeric" maxlength="6" placeholder="6 位数字"></div>' +
      '<div class="e2ee-row"><label class="auth-label">新同步口令（至少 6 位）</label>' +
      '<input class="auth-input" id="spPwd" type="password" placeholder="设置口令"></div>' +
      '<div class="e2ee-row"><button class="btn primary block" id="spSave">设置口令</button></div>' +
      '<div id="spMsg" class="e2ee-msg"></div></div>');
    m.classList.add('wide');
    m.querySelector('[data-act="close"]').addEventListener('click', window.closeModal);
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
        localStorage.setItem(LS_KEY, em);
        lastMsg = ''; lastKind = '';
        window.closeModal();
        await renderPanel();
        toast('同步口令已设置，已自动登录');
      } catch (e) { msg('失败：' + (e.message || e)); }
      finally { b.disabled = false; b.textContent = '设置口令'; }
    });
  }

  /* ---------------------------------------------------------- 上传：本地 → 云端 */
  /* ---------------------------------------------------------- 附件：本地文件 → 云端存储
     以前 noteToRow 只同步了附件「名字/大小」这些元信息，文件本体从没上传过，
     手机端拉取后自然只剩「图片暂未下载」。这里补上真正的文件上传：
     附件是不可变的（id 换一个就是新文件），所以上传路径可以缓存，第二次同步直接复用。 */
  const ATT_UP_KEY = 'sj_att_up_v1';
  function attUpCache() {
    try { return JSON.parse(localStorage.getItem(ATT_UP_KEY) || '{}') || {}; } catch (_) { return {}; }
  }
  function saveAttUpCache(m) {
    try { localStorage.setItem(ATT_UP_KEY, JSON.stringify(m)); } catch (_) { /* 存不下就算了，下次重传 */ }
  }
  /* 平台存储网关的 CORS 白名单里没有 x-upsert，而 SDK 的 storage.upload() 会无条件带上
     这个头（upsert 传 false 也带），浏览器预检直接把它挡掉，fetch 抛 TypeError: Failed to
     fetch——之前被 catch 一吞，表现就是「附件上传不成功」且重试多少次都一样。
     附件是不可变的（id 唯一、内容不变），压根不需要 upsert 语义，所以这里按同一个对象
     路径自己发请求：先 POST 创建（不带 x-upsert），不行再 PUT 覆盖；真实状态码收集上报。 */
  async function accessToken() {
    try { const t = await cloud.auth.getAccessToken(); if (t) return t; } catch (_) {}
    try {
      const r = await cloud.auth.getSession();
      const s = (r && (r.data || r)) || {};
      return (s.session && s.session.access_token) || s.access_token || '';
    } catch (_) { return ''; }
  }
  async function attUploadRaw(path, blob, type) {
    const token = await accessToken();
    if (!token) throw new Error('登录状态已失效，请退出后重新登录');
    // 存储网关的真实路径是 /.cloud/storage/object/runtime/...（没有 v1 段）
    const url = CONFIG.endpoint + '/.cloud/storage/object/runtime/' + path;
    const base = {
      Authorization: 'Bearer ' + token,
      'x-wb-webapp-access-key': CONFIG.publishableKey,
    };
    const errs = [];
    try {
      const fd = new FormData();
      fd.append('', blob, String(path).split('/').pop() || 'file');
      const r = await fetch(url, { method: 'POST', headers: base, body: fd });
      const txt = await r.text().catch(() => '');
      if (r.ok) return true;
      // 同一个 id 已经传过（附件不可变，内容一致），视为成功
      if (/exist|duplicate|already/i.test(txt)) return true;
      errs.push('POST ' + r.status + ' ' + txt.slice(0, 100));
    } catch (e) { errs.push('POST ' + ((e && e.message) || '网络错误')); }
    try {
      const r = await fetch(url, {
        method: 'PUT',
        headers: Object.assign({ 'Content-Type': type }, base),
        body: blob,
      });
      const txt = await r.text().catch(() => '');
      if (r.ok) return true;
      errs.push('PUT ' + r.status + ' ' + txt.slice(0, 100));
    } catch (e) { errs.push('PUT ' + ((e && e.message) || '网络错误')); }
    throw new Error(errs.join(' / '));
  }
  async function uploadOneAtt(a, owner, cache) {
    if (cache[a.id]) return cache[a.id];
    const res = await fetch('/api/files/' + encodeURIComponent(a.id));
    if (!res.ok) throw new Error('本地读取失败 HTTP ' + res.status);
    const blob = await res.blob();
    if (!blob.size) throw new Error('本地文件是空的');
    const ext = (String(a.name || '').match(/\.[A-Za-z0-9]{1,10}$/) || [''])[0];
    const path = cloud.storage.userPath(owner, `notes/${a.id}${ext}`);
    const type = a.type || blob.type || 'application/octet-stream';
    await attUploadRaw(path, new Blob([blob], { type }), type);
    cache[a.id] = path;
    return path;
  }

  async function doPush() {
    if (!session || !session.user) return;
    cancelAutoClose(); lastMsg = ''; lastKind = '';
    const btn = $('#syncPush'); btn.disabled = true; btn.textContent = '上传中…';
    try {
      if (window.SJLocal && window.SJLocal.saveNow) window.SJLocal.saveNow();
      const data = await (await fetch('/api/export')).json();
      const owner = session.user.id;
      const cats = (data.categories || []).map((c) => Object.assign(catToRow(c), { owner_id: owner }));

      const cache = attUpCache();
      const notes = [];
      const attErrs = [];
      let attOk = 0, attFail = 0;
      for (const n of (data.notes || [])) {
        const row = Object.assign(noteToRow(n), { owner_id: owner });
        const meta = [];
        for (const a of (Array.isArray(n.attachments) ? n.attachments : [])) {
          if (!a || !a.id) continue;
          const item = { id: a.id, name: a.name, size: a.size || 0, type: a.type };
          if (n.deletedAt) {
            // 回收站里的笔记不再重传文件本体，但保留已上传过的路径，恢复后仍能显示图
            if (cache[a.id]) item.path = cache[a.id];
            meta.push(item);
            continue;
          }
          let p = '';
          try { p = await uploadOneAtt(a, owner, cache); } catch (e) {
            p = '';
            attErrs.push((a.name || a.id) + ' → ' + ((e && e.message) || '未知错误'));
          }
          if (p) { item.path = p; attOk++; } else { attFail++; }
          meta.push(item);
        }
        row.attachments = meta;
        notes.push(row);
        if (notes.length % 5 === 0) syncMsg(`正在上传附件…（已上传 ${attOk} 个）`);
      }
      saveAttUpCache(cache);

      if (cats.length) {
        const r = await cloud.database.from('sj_categories').upsert(cats);
        if (r.error) throw new Error(friendly(r.error));
      }
      let pushed = 0;
      const B = 50;
      for (let i = 0; i < notes.length; i += B) {
        const r = await cloud.database.from('sj_notes').upsert(notes.slice(i, i + B));
        if (r.error) throw new Error(friendly(r.error));
        pushed += notes.slice(i, i + B).length;
      }
      localStorage.setItem('sj_last_sync', String(Date.now()));
      if (attFail) {
        try { console.warn('[同步] 附件上传失败明细：', attErrs); } catch (_) {}
        syncMsg(`已上传 ${cats.length} 个类别 + ${pushed} 篇笔记；${attFail} 个附件没传上去：${attErrs.slice(0, 2).join('；')}`);
      } else {
        syncMsg(`已上传 ${cats.length} 个类别 + ${pushed} 篇笔记${attOk ? `、${attOk} 个附件` : ''}`, 'ok');
      }
      toast(attFail ? `笔记已上传，${attFail} 个附件失败（原因见面板）` : '已上传到云端，手机端登录同一账号即可查看');
      // 结果留在面板里 2 秒（附件失败多给一点时间），然后自动收起
      scheduleClose(attFail ? 3500 : 2000);
    } catch (e) {
      syncMsg('上传失败：' + e.message);
      toast('上传失败：' + e.message);
      scheduleClose(3500);
    } finally {
      const b = $('#syncPush'); if (b) { b.disabled = false; b.textContent = '上传本地笔记到云端'; }
      renderPanel();
    }
  }

  /* ---------------------------------------------------------- 同步冲突检测 */
  function computeConflicts(cloudNotes) {
    const st = (window.SJLocal && window.SJLocal.getState && window.SJLocal.getState()) || null;
    if (!st || !st.notes) return [];
    const last = lastSyncAt();
    if (!last) return []; // 首次同步无法判定「上次同步后修改」，不做冲突提示，走 LWW
    const localMap = {};
    st.notes.forEach((n) => { localMap[n.id] = n; });
    const out = [];
    cloudNotes.forEach((c) => {
      const l = localMap[c.id];
      if (!l) return;
      const localEdited = Number(l.updatedAt) > last;
      const cloudEdited = Number(c.updatedAt) > last;
      const changed = (l.content || '').toString() !== (c.content || '').toString()
        || (l.title || '').toString() !== (c.title || '').toString();
      if (localEdited && cloudEdited && changed) {
        out.push({ id: c.id, title: c.title || l.title || '无标题' });
      }
    });
    return out;
  }

  /* ---------------------------------------------------------- 下载：云端 → 本地 */
  /* 彻底删除笔记时，sjplus.js 会把对应的云端附件路径记进待清理队列。
     这里用直连 DELETE 清掉（和上传一样绕开 SDK 的 CORS 限制），
     避免云端存储只增不减。删不掉的路径会留在队列里下次再试。 */
  async function gcDelete(path, token) {
    const url = CONFIG.endpoint + '/.cloud/storage/object/runtime/' + path;
    const r = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token, 'x-wb-webapp-access-key': CONFIG.publishableKey },
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
      const token = await accessToken();
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

  async function doPull() {
    if (!session || !session.user) return;
    cancelAutoClose(); lastMsg = ''; lastKind = '';
    const btn = $('#syncPull'); btn.disabled = true; btn.textContent = '拉取中…';
    try {
      const owner = session.user.id;
      const catsRes = await cloud.database.from('sj_categories').select('*').eq('owner_id', owner);
      const notesRes = await cloud.database.from('sj_notes').select('*').eq('owner_id', owner);
      if (catsRes.error) throw new Error(friendly(catsRes.error));
      if (notesRes.error) throw new Error(friendly(notesRes.error));
      const cats = (catsRes.data || []).map(rowToCat);
      const notes = (notesRes.data || []).map(rowToNote);

      /* 同步冲突预检：同一篇在「上次同步后两端都改过且内容不同」则不再静默覆盖，
         交给 window.SJConflict 让用户选择保留哪一侧。 */
      const conflicts = computeConflicts(notes);
      if (conflicts.length && window.SJConflict) {
        await new Promise((resolve) => {
          window.SJConflict.show(conflicts, (res) => {
            res = res || {};
            for (let i = conflicts.length - 1; i >= 0; i--) {
              const c = conflicts[i];
              const choice = res[c.id] || 'mine';
              const idx = notes.findIndex((x) => x.id === c.id);
              if (choice === 'mine') {
                if (idx >= 0) notes.splice(idx, 1); // 保留本地：移除云端该条，导入不会覆盖
              } else if (choice === 'both') {
                const copy = Object.assign({}, notes[idx]);
                copy.id = c.id + '-conflict-' + Date.now();
                copy.title = (copy.title || '无标题') + '（冲突副本）';
                notes.push(copy); // 云端版本另存副本，本地版本保留
              }
              // 'cloud' 保持原样
            }
            resolve();
          });
        });
      }

      const payload = { categories: cats, notes };
      const r = await fetch('/api/import?mode=lww', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || '导入失败');
      localStorage.setItem('sj_last_sync', String(Date.now()));
      if (window.SJLocal && window.SJLocal.refresh) window.SJLocal.refresh();
      syncMsg(`已拉取：新增 ${j.noteAdded} 篇、更新 ${j.updated || 0} 篇、跳过 ${j.skipped} 篇（按最后修改时间合并）`, 'ok');
      toast('已从云端拉取笔记');
      scheduleClose(2000);
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
  async function init() {
    const btn = $('#syncBtn');
    if (btn) btn.addEventListener('click', openPanel);
    try { session = normSession(await cloud.auth.getSession()); } catch (e) { session = null; }
    cloud.auth.onAuthStateChange((e) => {
      if (e === 'SIGNED_OUT') { session = null; localStorage.removeItem(LS_KEY); renderPanel(); }
    });
  }
  init();
})();
