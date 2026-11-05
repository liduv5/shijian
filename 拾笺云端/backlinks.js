/* ============================================================
   拾笺 · 双向链接（P2-4）
   解析正文里的 [[笔记名]]：
     1) 当前笔记里出现的 [[名称]] 渲染成可点击链接（跳转到同名笔记）；
     2) 在编辑器下方展示「反向链接」：哪些笔记引用了当前这篇。
   纯前端，不引入图数据库。被 app.js 的 openNote 调用 refresh(note)。
   ============================================================ */
(function () {
  'use strict';

  var RE = /\[\[([^\]]+)\]\]/g;

  function findByTitle(title) {
    var notes = (window.SJNotes && window.SJNotes()) || [];
    var t = String(title || '').trim().toLowerCase();
    for (var i = 0; i < notes.length; i++) {
      if (String(notes[i].title || '').trim().toLowerCase() === t) return notes[i];
    }
    return null;
  }

  // 把预览/富文本里的 [[名称]] 变成可点链接
  function linkify(container) {
    if (!container) return;
    var nodes = container.querySelectorAll('p,li,div,h1,h2,h3,span,code,blockquote');
    // 直接处理容器内文本节点更简单稳妥：递归扫描
    walk(container);
  }

  function walk(root) {
    var kids = root.childNodes;
    for (var i = 0; i < kids.length; i++) {
      var node = kids[i];
      if (node.nodeType === 3) { // 文本节点
        var txt = node.nodeValue;
        if (txt && txt.indexOf('[[') >= 0) {
          var frag = document.createDocumentFragment();
          var last = 0, m;
          RE.lastIndex = 0;
          while ((m = RE.exec(txt)) !== null) {
            if (m.index > last) frag.appendChild(document.createTextNode(txt.slice(last, m.index)));
            var name = m[1].trim();
            var target = findByTitle(name);
            var a = document.createElement('a');
            a.className = 'bj-link' + (target ? '' : ' bj-missing');
            a.textContent = name;
            a.setAttribute('data-bj', name);
            if (target) {
              a.href = 'javascript:void(0)';
              a.addEventListener('click', (function (id) {
                return function (e) { e.preventDefault(); if (window.SJOpenNote) window.SJOpenNote(id); };
              })(target.id));
            }
            frag.appendChild(a);
            last = m.index + m[0].length;
          }
          if (last < txt.length) frag.appendChild(document.createTextNode(txt.slice(last)));
          root.replaceChild(frag, node);
          i--; // 重新处理替换后的节点
        }
      } else if (node.nodeType === 1 && !/^(A|IMG|SCRIPT|STYLE)$/.test(node.tagName)) {
        walk(node);
      }
    }
  }

  function ensurePanel() {
    var wrap = document.getElementById('editorWrap');
    if (!wrap) return null;
    var p = document.getElementById('bjPanel');
    if (!p) {
      p = document.createElement('div');
      p.id = 'bjPanel';
      p.className = 'bj-panel hidden';
      wrap.appendChild(p);
    }
    return p;
  }

  function refresh(note) {
    var panel = ensurePanel();
    if (!panel || !note) return;
    var notes = (window.SJNotes && window.SJNotes()) || [];

    // 反向链接：引用了当前标题的笔记
    var back = [];
    var curTitle = String(note.title || '').trim().toLowerCase();
    if (curTitle) {
      notes.forEach(function (n) {
        if (n.id === note.id) return;
        var c = window.SJFts ? window.SJFts.plain(n.content) : String(n.content || '');
        if (c.toLowerCase().indexOf('[[' + curTitle + ']]') >= 0) back.push(n);
      });
    }

    if (!back.length) { panel.classList.add('hidden'); panel.innerHTML = ''; return; }
    panel.classList.remove('hidden');
    panel.innerHTML = '<div class="bj-head">反向链接 · ' + back.length + '</div>';
    var ul = document.createElement('div');
    ul.className = 'bj-list';
    back.forEach(function (n) {
      var item = document.createElement('div');
      item.className = 'bj-item';
      item.innerHTML = '<span class="bj-item-title">' + escapeHtml(n.title || '无标题') + '</span>'
        + '<span class="bj-item-sub">' + escapeHtml(window.SJFts ? window.SJFts.snippet(n.content, [curTitle]) : (n.content || '').slice(0, 60)) + '</span>';
      item.addEventListener('click', function () { if (window.SJOpenNote) window.SJOpenNote(n.id); });
      ul.appendChild(item);
    });
    panel.appendChild(ul);

    // 当前笔记里的 [[链接]] 变可点
    linkify(document.getElementById('previewPane'));
    linkify(document.getElementById('richPane'));
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  window.SJBacklinks = { refresh: refresh };
})();
