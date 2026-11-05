/* ============================================================
   拾笺 · 导出全部笔记为 PDF（P2-3）
   把当前笔记库所有笔记渲染进 #printArea，再调用浏览器打印（可另存为 PDF）。
   支持按分类筛选。单篇 PDF 已由 app.js 的 NoteExport 负责，这里只做「合集」。
   ============================================================ */
(function () {
  'use strict';

  function renderContent(n) {
    var c = n.content || '';
    if (n.format === 'rich') return c; // 富文本本身即 HTML
    if (window.marked && window.marked.parse) {
      try { return window.marked.parse(c); } catch (_) {}
    }
    return '<pre>' + escapeHtml(c) + '</pre>';
  }

  function build() {
    var notes = (window.SJNotes && window.SJNotes()) || [];
    if (!notes.length) return null;
    notes = notes.slice().sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
    var parts = ['<div class="pdf-cover"><h1>拾笺 · 笔记合集</h1>'
      + '<p>共 ' + notes.length + ' 篇 · 导出时间 ' + new Date().toLocaleString('zh-CN') + '</p></div>'];
    notes.forEach(function (n) {
      var tags = (n.tags && n.tags.length) ? '　# ' + n.tags.join('　# ') : '';
      parts.push('<section class="pdf-note">'
        + '<h2>' + escapeHtml(n.title || '无标题笔记') + '</h2>'
        + '<div class="pdf-meta">' + new Date(n.updatedAt || Date.now()).toLocaleString('zh-CN') + tags + '</div>'
        + '<div class="pdf-body markdown-body">' + renderContent(n) + '</div></section>');
    });
    return parts.join('\n');
  }

  function exportAll() {
    var area = document.getElementById('printArea');
    if (!area) return;
    var html = build();
    if (!html) { if (window.toast) toast('没有可导出的笔记'); return; }
    area.innerHTML = html;
    injectPrintCss();
    var done = function () {
      window.removeEventListener('afterprint', done);
      area.innerHTML = '';
    };
    window.addEventListener('afterprint', done);
    setTimeout(function () { window.print(); }, 60);
  }

  var cssInjected = false;
  function injectPrintCss() {
    if (cssInjected) return;
    var s = document.createElement('style');
    s.id = 'pdfPrintCss';
    s.textContent = '@media print {'
      + 'body *{visibility:hidden}'
      + '#printArea,#printArea *{visibility:visible}'
      + '#printArea{position:absolute;left:0;top:0;width:100%}'
      + '.app,.m-bar,.ctx-menu,.toast,.modal-root{display:none!important}'
      + '.pdf-note{page-break-inside:avoid;margin-bottom:24px}'
      + '.pdf-cover{text-align:center;margin:40px 0}'
      + '.pdf-meta{color:#888;font-size:12px;margin:4px 0 10px}'
      + '}';
    document.head.appendChild(s);
    cssInjected = true;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('pdfAllBtn');
    if (btn) btn.addEventListener('click', exportAll);
  });
  // 若脚本在 DOMContentLoaded 之后才执行，直接绑定
  if (document.getElementById('pdfAllBtn')) document.getElementById('pdfAllBtn').addEventListener('click', exportAll);

  window.SJPdf = { exportAll: exportAll };
})();
