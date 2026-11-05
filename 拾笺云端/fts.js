/* ============================================================
   拾笺 · 全文检索（P2-2）
   轻量倒排索引：中文按字/二元、英文按词分词；支持多词 AND、tag: 前缀。
   不依赖任何外部库。被 app.js 的 notesInScope 在搜索时调用。
   默认开启；若本模块未加载，app.js 自动回退到原来的子串匹配。
   ============================================================ */
(function () {
  'use strict';

  // 把笔记内容转成可检索纯文本（去掉 HTML 标签与 Markdown 符号）
  function plain(src) {
    if (!src) return '';
    var s = String(src);
    s = s.replace(/<style[\s\S]*?<\/style>/gi, ' ');
    s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ');
    s = s.replace(/<[^>]+>/g, ' ');
    s = s.replace(/```[\s\S]*?```/g, ' ');
    s = s.replace(/`([^`]+)`/g, '$1');
    s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
    s = s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
    s = s.replace(/[#>*_~=\-]+/g, ' ');
    s = s.replace(/\s+/g, ' ');
    return s.trim();
  }

  // 分词：CJK 跑切成 uni+bigram，非 CJK 按词
  function tokenize(text) {
    var out = [];
    var t = plain(text).toLowerCase();
    var cjk = t.match(/[\u4e00-\u9fff\u3400-\u4dbf]+/g) || [];
    cjk.forEach(function (run) {
      for (var i = 0; i < run.length; i++) {
        out.push(run[i]);
        if (i + 1 < run.length) out.push(run.substr(i, 2));
      }
    });
    var latin = t.replace(/[\u4e00-\u9fff\u3400-\u4dbf]+/g, ' ');
    (latin.match(/[a-z0-9]+/g) || []).forEach(function (w) { out.push(w); });
    return out;
  }

  var index = new Map(); // token -> Map(noteId -> tf)
  var docText = new Map(); // noteId -> 纯文本（用于摘要）
  var ready = false;

  function build(notes) {
    index = new Map();
    docText = new Map();
    (notes || []).forEach(function (n) {
      var id = n.id;
      var blob = (n.title || '') + ' ' + (n.tags || []).join(' ') + ' ' + plain(n.content);
      docText.set(id, blob);
      var counted = new Set();
      tokenize(blob).forEach(function (tok) {
        if (!index.has(tok)) index.set(tok, new Map());
        var m = index.get(tok);
        m.set(id, (m.get(id) || 0) + 1);
        counted.add(id);
      });
    });
    ready = true;
  }

  // 生成一段高亮摘要
  function snippet(text, terms) {
    var t = plain(text);
    if (!t) return '';
    var pos = -1;
    for (var i = 0; i < terms.length; i++) {
      var p = t.toLowerCase().indexOf(terms[i].toLowerCase());
      if (p >= 0 && (pos < 0 || p < pos)) pos = p;
    }
    if (pos < 0) return t.slice(0, 80);
    var s = Math.max(0, pos - 30);
    return (s > 0 ? '…' : '') + t.slice(s, s + 100) + '…';
  }

  // 核心：返回按相关度排序的笔记 id 数组
  function rank(query, notes) {
    if (!ready || !notes) build(notes);
    var q = String(query || '').trim();
    var tagIdx = q.indexOf('tag:');
    if (tagIdx === 0) {
      var tag = q.slice(4).toLowerCase();
      return notes.filter(function (n) {
        return (n.tags || []).some(function (x) { return String(x).toLowerCase().indexOf(tag) >= 0; });
      }).map(function (n) { return n.id; });
    }
    var phrases = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!phrases.length) return notes.map(function (n) { return n.id; });

    // 每个短语切成子词（与索引同口径）；笔记只要命中某短语的任一子词即算匹配该短语，
    // 多个短语之间取「与」（AND），从而支持「多词共现」检索。
    var phraseSets = phrases.map(function (ph) {
      var toks = tokenize(ph);
      var s = new Set();
      toks.forEach(function (t) {
        var m = index.get(t);
        if (m) m.forEach(function (_, id) { s.add(id); });
      });
      return s;
    });

    var score = new Map();
    phrases.forEach(function (ph) {
      tokenize(ph).forEach(function (t) {
        var m = index.get(t);
        if (!m) return;
        m.forEach(function (tf, id) { score.set(id, (score.get(id) || 0) + tf); });
      });
    });

    var ids = [];
    notes.forEach(function (n) {
      for (var i = 0; i < phraseSets.length; i++) {
        if (!phraseSets[i].has(n.id)) return;
      }
      ids.push({ id: n.id, sc: score.get(n.id) || 0 });
    });
    ids.sort(function (a, b) { return b.sc - a.sc; });
    return ids.map(function (x) { return x.id; });
  }

  var SJFts = {
    build: build,
    rank: rank,
    plain: plain,
    tokenize: tokenize,
    snippet: snippet,
  };
  if (typeof window !== 'undefined') window.SJFts = SJFts;
  if (typeof module !== 'undefined' && module.exports) module.exports = SJFts;
})();
