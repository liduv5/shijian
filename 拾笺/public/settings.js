/* ============================================================
   拾笺 · 本地版 —— 设置（服务管理）
   ------------------------------------------------------------
   独立文件，不并入 app.js / sjplus.js：
   - app.js 是分叉文件（云端版没有本地服务），重启只对本地版有意义；
   - sjplus.js 会被 sync-shared.ps1 同步到手机端，带上重启按钮会误导用户。
   这里只在侧栏图标栏挂一个齿轮入口，弹出面板提供「重启本地服务」。
   ============================================================ */
(function () {
  'use strict';
  if (!document.querySelector('.sb-rail, .sidebar-foot')) return;

  const ICON = '<svg viewBox="0 0 24 24" class="ico">'
    + '<circle cx="12" cy="12" r="3.2"/>'
    + '<path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.14.37.37.7.7.9.3.2.66.3 1 .3H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'
    + '</svg>';

  function mount() {
    if (document.getElementById('settingsBtn')) return;
    const rail = document.querySelector('.sb-rail');
    const foot = document.querySelector('.sidebar-foot');
    const btn = document.createElement('button');
    btn.id = 'settingsBtn';
    btn.setAttribute('aria-label', '设置');
    if (rail) {
      btn.className = 'rail-btn';
      btn.dataset.tip = '设置';
      btn.innerHTML = ICON;
      // 排在主题按钮之前（与「更多工具」同一组，主题永远是最后一个）
      rail.insertBefore(btn, rail.querySelector('#themeBtn') || null);
    } else {
      btn.className = 'foot-tool';
      btn.innerHTML = ICON + '<span>设置</span>';
      foot.insertBefore(btn, foot.querySelector('#importInput') || null);
    }
    btn.addEventListener('click', openSettings);
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /** 取当前进程 bootId；失败返回空串（此时重启后用「能连通」作为成功判据） */
  async function currentBootId() {
    try {
      const r = await fetch('/api/state?t=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) return '';
      const j = await r.json();
      return (j.meta && j.meta.bootId) || '';
    } catch (_) { return ''; }
  }

  function setStatus(el, text, kind) {
    if (!el) return;
    el.textContent = text;
    el.className = 'settings-status' + (kind ? ' ' + kind : '');
  }

  function openSettings() {
    if (typeof window.openModal !== 'function') return;
    const m = window.openModal(
      '<h3>设置</h3>'
      + '<div class="settings-body">'
      + '  <p class="settings-hint">本地笔记库运行在这台电脑上。重启服务用于更新代码后让改动生效——'
      + '  重启期间笔记库会短暂不可用（约几秒），已保存的内容不会丢失。</p>'
      + '  <div class="settings-row" id="restartRow">'
      + '    <div class="settings-row-text"><b>重启本地服务</b><small>应用新代码 · 不影响笔记数据</small></div>'
      + '    <button class="btn danger sm" id="restartBtn">重启服务</button>'
      + '  </div>'
      + '  <div class="settings-status" id="restartStatus" aria-live="polite"></div>'
      + '</div>'
      + '<div class="modal-actions"><button class="btn ghost" id="settingsClose">关闭</button></div>'
    );
    const close = m.querySelector('#settingsClose');
    if (close) close.onclick = () => window.closeModal();
    const btn = m.querySelector('#restartBtn');
    const status = m.querySelector('#restartStatus');
    const row = m.querySelector('#restartRow');
    if (btn) btn.onclick = () => confirmRestart(m, btn, status, row);
  }

  function confirmRestart(m, btn, status, row) {
    // 二次确认，避免误触把正在编辑的窗口重启掉
    row.innerHTML = '<div class="settings-row-text"><b>确认重启本地服务？</b>'
      + '<small>请先停止编辑，未保存的输入不会保留</small></div>'
      + '<div class="settings-confirm">'
      + '<button class="btn ghost sm" id="restartCancel">取消</button>'
      + '<button class="btn danger sm" id="restartGo">确认重启</button></div>';
    row.querySelector('#restartCancel').onclick = () => {
      const back = document.createElement('div');
      back.className = 'settings-row-text';
      back.innerHTML = '<b>重启本地服务</b><small>应用新代码 · 不影响笔记数据</small>';
      row.innerHTML = '';
      row.appendChild(back);
      const b = document.createElement('button');
      b.className = 'btn danger sm';
      b.id = 'restartBtn';
      b.textContent = '重启服务';
      row.appendChild(b);
      b.onclick = () => confirmRestart(m, b, status, row);
      setStatus(status, '');
    };
    row.querySelector('#restartGo').onclick = () => doRestart(btn, status, row);
  }

  async function doRestart(_btn, status, row) {
    if (row) row.querySelector('#restartGo').disabled = true;
    setStatus(status, '正在保存当前笔记…');

    // 先把编辑器里防抖窗口中的内容落盘；服务端重启时还会再 persistNow() 一次兜底。
    try { if (window.SJLocal && window.SJLocal.saveNow) window.SJLocal.saveNow(); } catch (_) {}
    await sleep(450); // 留给 saveNow 的 PATCH 到达服务端

    const oldBoot = await currentBootId();
    setStatus(status, '正在重启服务，请稍候…');
    let res;
    try {
      res = await fetch('/api/restart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    } catch (e) {
      return setStatus(status, '重启请求发送失败：' + (e.message || e), 'err');
    }
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return setStatus(status, '重启失败：' + (j.error || ('HTTP ' + res.status)), 'err');

    // 轮询新进程：期间 fetch 失败（旧进程已退、新进程未起）是正常的，继续重试。
    const deadline = Date.now() + 75000;
    let n = 0;
    while (Date.now() < deadline) {
      await sleep(700);
      n++;
      setStatus(status, '正在等待新服务就绪…（' + n + '）');
      const boot = await currentBootId();
      const up = await (async () => {
        try { const r = await fetch('/api/state?t=' + Date.now(), { cache: 'no-store' }); return r.ok; }
        catch (_) { return false; }
      })();
      if (!up) continue;
      // oldBoot 为空说明重启前取不到，只要能连通就算起来；否则必须 bootId 变化
      if (!oldBoot || (boot && boot !== oldBoot)) {
        setStatus(status, '服务已重启成功，正在刷新页面…', 'ok');
        await sleep(700);
        location.reload();
        return;
      }
    }
    setStatus(status, '等待超时：服务可能未正常重启，请双击「停止.bat」后再双击「启动.bat」', 'err');
    if (row) {
      const hint = row.querySelector('#restartGo');
      if (hint) hint.disabled = false;
    }
  }

  function boot() {
    mount();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
