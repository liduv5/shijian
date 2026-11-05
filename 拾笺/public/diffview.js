/* ============================================================
   拾笺 · 历史版本对比（P2-1）
   在「历史版本」面板增加一个「对比版本」入口：选两个版本，
   弹窗显示行级差异（新增 / 删除）。算法为 LCS 行对比，无外部依赖。
   被 app.js 的 openVersion 调用 attach(note, versions, helpers)。
   ============================================================ */
(function () {
  'use strict';

  function attach(note, versions, h) {
    if (!note || !versions || !versions.length) return;
    var foot = document.querySelector('#histFoot'); // 历史面板底部
    if (!foot) return;
    if (document.getElementById('histDiffBtn')) return; // 只挂一次
    var btn = document.createElement('button');
    btn.className = 'btn';
    btn.id = 'histDiffBtn';
    btn.textContent = '对比版本';
    btn.style.marginRight = '8px';
    foot.insertBefore(btn, foot.querySelector('#histRestore'));

    btn.addEventListener('click', function () {
      openDiff(note, versions, h);
    });
  }

  async function openDiff(note, versions, h) {
    var opts = versions.map(function (v) {
      return '<option value="' + v.id + '">' + (h.fmtFull ? h.fmtFull(v.ts) : v.ts) + '</option>';
    }).join('');
    var m = (h.openModal || window.openModal)(`
      <div class="hist-head"><div><h3>对比历史版本</h3><p>选择两个版本，查看内容差异</p></div>
        <button class="icon-btn" data-act="close" title="关闭">${h.closeIcon || '✕'}</button></div>
      <div class="diff-controls">
        <label>版本 A（旧）<select id="diffA">${opts}</select></label>
        <label>版本 B（新）<select id="diffB">${versions.length > 1 ? opts.replace('value="' + versions[0].id + '"', 'value="' + versions[0].id + '" selected').replace('value="' + versions[1].id + '"', 'value="' + versions[1].id + '" selected') : ''}</select></label>
        <button class="btn primary" id="diffGo">对比</button>
      </div>
      <div class="diff-out markdown-body" id="diffOut">选择版本后点「对比」</div>`);
    m.classList.add('wide');
    m.querySelector('[data-act="close"]').addEventListener('click', h.closeModal || window.closeModal);
    m.querySelector('#diffGo').addEventListener('click', async function () {
      var out = m.querySelector('#diffOut');
      out.innerHTML = '载入中…';
      try {
        var aId = m.querySelector('#diffA').value;
        var bId = m.querySelector('#diffB').value;
        var api = h.api || window.api;
        var a = await api('/api/notes/' + note.id + '/versions/' + aId);
        var b = await api('/api/notes/' + note.id + '/versions/' + bId);
        out.innerHTML = renderDiff(a.content || '', b.content || '');
      } catch (e) {
        out.innerHTML = '<div class="hist-empty">对比失败：' + escapeHtml(e.message) + '</div>';
      }
    });
  }

  // 行级 LCS 差异
  function renderDiff(aText, bText) {
    var a = (aText || '').split('\n');
    var b = (bText || '').split('\n');
    var n = a.length, m = b.length;
    var dp = [];
    for (var i = 0; i <= n; i++) dp.push(new Array(m + 1).fill(0));
    for (i = n - 1; i >= 0; i--)
      for (var j = m - 1; j >= 0; j--)
        dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);

    var res = [];
    i = 0; j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) { res.push([' ', a[i]]); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { res.push(['-', a[i]]); i++; }
      else { res.push(['+', b[j]]); j++; }
    }
    while (i < n) { res.push(['-', a[i]]); i++; }
    while (j < m) { res.push(['+', b[j]]); j++; }

    var add = 0, del = 0;
    var html = res.map(function (r) {
      if (r[0] === '+') { add++; return '<div class="diff-add">+ ' + escapeHtml(r[1]) + '</div>'; }
      if (r[0] === '-') { del++; return '<div class="diff-del">- ' + escapeHtml(r[1]) + '</div>'; }
      return '<div class="diff-same">  ' + escapeHtml(r[1]) + '</div>';
    }).join('');
    return '<div class="diff-sum">新增 ' + add + ' 行，删除 ' + del + ' 行</div>' + html;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  window.SJDiff = { attach: attach };
})();
