/* ============================================================
   拾笺 · 可选端到端加密（P2-5）
   透明加密本地存储需要把同步的 getState/save 改成异步，风险高。
   因此落地为「口令保护的加密备份（.vault）」：整库导出为一个
   必须输入口令才能解开的加密文件，可安全放到网盘 / 邮件。
   导入时本地用口令解密后还原为普通备份再汇入。不触碰任何实时数据，零风险。
   用法：点侧栏左侧图标栏的 🔒 按钮（导入 / 导出 / 同步下方）打开面板；
   笔记右上角导出菜单里也有同一入口。
   ============================================================ */
(function () {
  'use strict';

  function b64(buf) {
    var bytes = new Uint8Array(buf);
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function unb64(s) {
    var bin = atob(s);
    var u = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u;
  }
  function deriveKey(pass, salt) {
    return crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey'])
      .then(function (km) {
        return crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt: salt, iterations: 120000, hash: 'SHA-256' },
          km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
      });
  }
  async function encryptText(text, key, iv) {
    var ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(text));
    return b64(ct);
  }
  async function decryptText(token, key) {
    var parts = token.split(':');
    var iv = unb64(parts[0]);
    var ct = unb64(parts[1]);
    var pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, ct);
    return new TextDecoder().decode(pt);
  }

  async function exportVault(pass) {
    if (!window.SJLocal || !window.SJLocal.getState) throw new Error('本地存储未就绪');
    var state = window.SJLocal.getState();
    var salt = crypto.getRandomValues(new Uint8Array(16));
    var key = await deriveKey(pass, salt);
    var iv = crypto.getRandomValues(new Uint8Array(12));
    // 只加密笔记正文与标题，其他结构原样保留
    var notes = (state.notes || []).map(function (n) {
      return Object.assign({}, n);
    });
    for (var i = 0; i < notes.length; i++) {
      if (notes[i].content != null) notes[i].content = '__enc__:' + (await encryptText(String(notes[i].content), key, crypto.getRandomValues(new Uint8Array(12))));
      if (notes[i].title != null) notes[i].title = '__enc__:' + (await encryptText(String(notes[i].title), key, crypto.getRandomValues(new Uint8Array(12))));
    }
    var payload = {
      __vault: 1, kdf: 'PBKDF2-SHA256-120000', salt: b64(salt),
      createdAt: Date.now(),
      data: { categories: state.categories || [], notes: notes, versions: state.versions || {} },
    };
    var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    var a = document.createElement('a');
    var d = new Date();
    a.download = '拾笺加密备份-' + d.getFullYear() + ('' + (d.getMonth() + 1)).padStart(2, '0') + ('' + d.getDate()).padStart(2, '0') + '.vault';
    a.href = URL.createObjectURL(blob);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    return notes.length;
  }

  // 返回解密后的普通备份对象（{categories,notes,versions}）
  async function importVault(text, pass) {
    var payload = JSON.parse(text);
    if (!payload.__vault) throw new Error('这不是有效的加密备份文件');
    var salt = unb64(payload.salt);
    var key = await deriveKey(pass, salt);
    var notes = (payload.data.notes || []).map(function (n) { return Object.assign({}, n); });
    for (var i = 0; i < notes.length; i++) {
      if (typeof notes[i].content === 'string' && notes[i].content.indexOf('__enc__:') === 0)
        notes[i].content = await decryptText(notes[i].content.slice(7), key);
      if (typeof notes[i].title === 'string' && notes[i].title.indexOf('__enc__:') === 0)
        notes[i].title = await decryptText(notes[i].title.slice(7), key);
    }
    return { categories: payload.data.categories || [], notes: notes, versions: payload.data.versions || {} };
  }

  function openPanel() {
    var m = window.openModal(`
      <div class="hist-head"><div><h3>🔒 加密备份（端到端加密）</h3>
        <p>导出的 .vault 文件需口令才能解开，可安全存到网盘 / 邮件</p></div>
        <button class="icon-btn" data-act="close" title="关闭">✕</button></div>
      <div class="e2ee-body">
        <p class="e2ee-warn">⚠️ 口令不会被保存，忘记将无法恢复。建议先做一次普通备份再启用。</p>
        <div class="e2ee-row"><input type="password" id="e2eePass" class="tag-input" placeholder="设置加密口令" style="width:100%"></div>
        <div class="e2ee-row"><button class="btn primary block" id="e2eeExport">导出整库加密备份</button></div>
        <hr>
        <div class="e2ee-row"><label class="e2ee-file">选择 .vault 文件导入<input type="file" id="e2eeFile" accept=".vault" style="margin-top:6px"></label></div>
        <div class="e2ee-row"><input type="password" id="e2eePass2" class="tag-input" placeholder="输入口令解密" style="width:100%"></div>
        <div class="e2ee-row"><button class="btn block" id="e2eeImport">解密并汇入</button></div>
        <div id="e2eeMsg" class="e2ee-msg"></div>
      </div>`);
    m.classList.add('wide');
    m.querySelector('[data-act="close"]').addEventListener('click', window.closeModal);
    var msg = function (t, ok) { var e = m.querySelector('#e2eeMsg'); e.textContent = t; e.style.color = ok ? '#2f6f5e' : '#c0392b'; };

    m.querySelector('#e2eeExport').addEventListener('click', async function () {
      var p = m.querySelector('#e2eePass').value;
      if (p.length < 6) return msg('口令至少 6 位');
      try { var n = await exportVault(p); msg('已导出 ' + n + ' 篇笔记的加密备份', true); }
      catch (e) { msg('导出失败：' + e.message); }
    });
    m.querySelector('#e2eeImport').addEventListener('click', async function () {
      var f = m.querySelector('#e2eeFile').files[0];
      var p = m.querySelector('#e2eePass2').value;
      if (!f) return msg('请先选择 .vault 文件');
      if (!p) return msg('请输入口令');
      try {
        var text = await f.text();
        var backup = await importVault(text, p);
        if (window.SJLocal && window.SJLocal.importBackup) {
          await window.SJLocal.importBackup(backup);
          if (window.SJBoot) await window.SJBoot();
          msg('已解密并汇入 ' + backup.notes.length + ' 篇笔记', true);
        } else msg('本地存储不支持汇入，请稍后重试');
      } catch (e) { msg('导入失败：' + e.message); }
    });
  }

  /* 加密备份入口：优先挂进左侧图标栏，排在「同步」后面——
     导入 / 导出 / 加密备份 / 同步 本来就是同一组备份动作。
     图标栏不存在时才回落到品牌行右侧，老结构也能用。 */
  function mountButton() {
    if (document.getElementById('e2eeBtn')) return;
    var rail = document.querySelector('.sb-rail');
    var theme = document.getElementById('themeBtn');
    var b = document.createElement('button');
    b.id = 'e2eeBtn';
    b.innerHTML = '<svg viewBox="0 0 24 24" class="ico"><rect x="4.6" y="10.8" width="14.8" height="9.4" rx="2.5"/><path d="M7.9 10.8V7.9a4.1 4.1 0 0 1 8.2 0v2.9"/></svg>';
    if (rail) {
      b.className = 'rail-btn';
      /* 图标栏的提示统一走 data-tip（原生 title 是带边框白框，改不了样式） */
      b.dataset.tip = '加密备份';
      b.setAttribute('aria-label', '加密备份（端到端加密）');
      var sync = rail.querySelector('#syncBtn');
      if (sync) rail.insertBefore(b, sync.nextSibling);
      else rail.insertBefore(b, theme || null);
    } else {
      var brand = document.querySelector('.brand');
      if (!brand) return;
      b.className = 'icon-btn';
      b.title = '加密备份（端到端加密）';
      if (theme && theme.parentNode === brand) brand.insertBefore(b, theme);
      else brand.appendChild(b);
    }
    b.addEventListener('click', openPanel);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountButton);
  else mountButton();

  async function importVaultFile(file) {
    var text;
    try { text = await file.text(); } catch (_) { return toast && toast('无法读取文件'); }
    var m = window.openModal(
      '<div class="hist-head"><div><h3>导入加密备份</h3><p>' + escapeHtml(file.name) + '</p></div>' +
      '<button class="icon-btn" data-act="close" title="关闭">✕</button></div>' +
      '<div class="e2ee-body">' +
      '<div class="e2ee-row"><input type="password" id="ivPass" class="tag-input" placeholder="输入加密口令" style="width:100%"></div>' +
      '<div class="e2ee-row"><button class="btn primary block" id="ivGo">解密并汇入</button></div>' +
      '<div id="ivMsg" class="e2ee-msg"></div></div>');
    m.classList.add('wide');
    m.querySelector('[data-act="close"]').addEventListener('click', window.closeModal);
    var msg = function (t, ok) { var e = m.querySelector('#ivMsg'); e.textContent = t; e.style.color = ok ? '#2f6f5e' : '#c0392b'; };
    m.querySelector('#ivGo').addEventListener('click', async function () {
      var p = m.querySelector('#ivPass').value;
      if (!p) return msg('请输入口令');
      try {
        var backup = await importVault(text, p);
        if (window.SJLocal && window.SJLocal.importBackup) {
          await window.SJLocal.importBackup(backup);
          msg('已汇入 ' + backup.notes.length + ' 篇笔记', true);
          setTimeout(function () { window.closeModal(); }, 800);
        } else msg('本地存储不支持汇入');
      } catch (e) { msg('失败：' + e.message); }
    });
  }

  window.SJE2EE = { exportVault: exportVault, importVault: importVault, importVaultFile: importVaultFile, openPanel: openPanel };
})();
