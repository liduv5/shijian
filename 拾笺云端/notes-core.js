/* ============================================================
   拾笺 · 笔记层纯逻辑内核（两端共用）
   ------------------------------------------------------------
   这里只放「给定输入就有唯一输出」的东西：转义、空判定、排序、高亮。
   不碰 DOM、不碰 localStorage、不碰全局 state —— 所以桌面端（浏览器
   里跑前端）和云端（同样浏览器，但存储是 IndexedDB）能共用同一份，
   Node 里也能 require 来测。

   为什么不并进 cat-core：
   cat-core 管的是「分类这个实体」的身份与归属，server.js 也要用；
   这里管的是「一篇笔记」的呈现规则，只有前端用。两个关心点分开，
   server.js 的依赖面不会因为加了个排序函数而变宽。

   为什么值得单独一个文件：
   2026-11-28 扫两端 app.js，184 个同名函数里 122 个逐字相同。其中
   转义、空判定、排序、高亮这四类被复制得最厉害，也最危险 ——
   escapeHtml 少一处转义就是一次 XSS，排序规则漂了就是两台设备顺序不同。
   它们没有任何平台差异，纯粹是复制过去以后各改各的。

   同步：node 拾笺/scripts/sync-shared.js --write
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SJNotesCore = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* 渲染前唯一的一道转义。所有把用户文本拼进 innerHTML 的地方都必须先过它；
     少一处就是一次 XSS（导入的备份、云端拉下来的数据都算不可信输入）。 */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* 内容看起来是不是空的：去掉标签、<br>、&nbsp; 之后没有字。
     新建笔记不做成空白卡片、判重时不算「有内容」，都靠这个。 */
  function blankContent(s) {
    const t = String(s || '');
    return !t.replace(/<br\s*\/?>/gi, '').replace(/<[^>]+>/g, '')
      .replace(/&nbsp;|\u00a0/gi, ' ').trim();
  }

  /* 整篇笔记是不是空白：标题、正文、标签、附件、收藏，有一个就不算。
     用途是「点开又关掉不该留下一条空笔记」。 */
  function isBlankNote(n) {
    if (!n) return true;
    if (String(n.title || '').trim()) return false;
    if (!blankContent(n.content)) return false;
    if (n.tags && n.tags.length) return false;
    if (n.attachments && n.attachments.length) return false;
    if (n.starred) return false;
    return true;
  }

  /* 列表排序。mode 与置顶集合由调用方注入，内核不读存储 ——
     这样同一份规则在桌面、手机、测试里跑出来的顺序必然一致。
       mode: 'updated'（默认）/ 'created' / 'title'
       pins: Set<id>，置顶恒在最前
     规则本身：置顶 > 时间/标题。时间比的是数字，坏数据按 0 算。 */
  const SORT_MODES = ['updated', 'created', 'title'];
  function sortNotes(list, mode, pins) {
    const m = SORT_MODES.indexOf(mode) >= 0 ? mode : 'updated';
    const pin = pins instanceof Set ? pins : new Set(pins || []);
    return (list || []).slice().sort((a, b) => {
      const pa = pin.has(a.id) ? 1 : 0, pb = pin.has(b.id) ? 1 : 0;
      if (pa !== pb) return pb - pa;
      if (m === 'created') return (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0);
      if (m === 'title') return String(a.title || '').localeCompare(String(b.title || ''), 'zh');
      return (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0);
    });
  }

  /* 把命中的词包成 <mark>，返回的是**已转义**的 HTML，调用方直接赋给
     innerHTML 也不会被标题里的尖括号带跑。
     先转义再拼正则：用户搜「<」时既不会打断标签，也不会把正则搞崩。 */
  function highlightText(text, term) {
    const html = escapeHtml(text);
    if (!term) return html;
    const safe = escapeHtml(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try {
      return html.replace(new RegExp('(' + safe + ')', 'ig'), '<mark>$1</mark>');
    } catch (_) {
      return html;
    }
  }

  return { escapeHtml, blankContent, isBlankNote, sortNotes, highlightText, SORT_MODES };
}));
