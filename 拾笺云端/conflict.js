/* ============================================================
   拾笺 · 同步冲突解决（P1-1）
   当「手机端和电脑端在同一篇笔记上各自改过」时，不再静默后写覆盖，
   而是弹出选择：保留我的 / 保留云端 / 两者都留（复制为副本）。
   由 mobilesync.js 的合并逻辑在检测到真实冲突时调用 window.SJConflict.show。
   ============================================================ */
(function () {
  'use strict';

  function show(conflicts, apply) {
    if (!conflicts || !conflicts.length) return;
    var items = conflicts.map(function (c, i) {
      return '<div class="cf-item">'
        + '<div class="cf-title">' + escapeHtml(c.title || '无标题笔记') + '</div>'
        + '<div class="cf-opts">'
        + opt(i, 'mine', '保留我的', true)
        + opt(i, 'cloud', '保留云端', false)
        + opt(i, 'both', '两者都留（复制副本）', false)
        + '</div></div>';
    }).join('');

    var html = '<div class="hist-head"><div><h3>发现 ' + conflicts.length + ' 处同步冲突</h3>'
      + '<p>同一篇笔记在两端都被修改过，请选择保留哪一侧</p></div>'
      + '<button class="icon-btn" data-act="close" title="关闭">✕</button></div>'
      + '<div class="cf-list">' + items + '</div>'
      + '<div class="hist-foot"><span id="cfHint">未选择将以「保留我的」处理</span>'
      + '<button class="btn primary" id="cfOk">应用</button></div>';

    var m = window.openModal(html);
    m.classList.add('wide');
    m.querySelector('[data-act="close"]').addEventListener('click', window.closeModal);

    m.querySelector('#cfOk').addEventListener('click', function () {
      var res = {};
      conflicts.forEach(function (c, i) {
        var sel = m.querySelector('input[name="cf' + i + '"]:checked');
        res[c.id] = sel ? sel.value : 'mine';
      });
      window.closeModal();
      if (apply) apply(res);
    });
  }

  function opt(i, val, label, def) {
    return '<label class="cf-opt"><input type="radio" name="cf' + i + '" value="' + val + '"'
      + (def ? ' checked' : '') + '> ' + label + '</label>';
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  window.SJConflict = { show: show };
})();
