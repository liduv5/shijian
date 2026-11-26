/* ============================================================
   拾笺 · Markdown → 富文本 内核（两端共用）
   ------------------------------------------------------------
   这个文件在桌面端和云端各存一份，内容必须逐字相同：
     · 同步：拾笺/scripts/sync-shared.js 一键复制
     · 守卫：两端回归测试用 md5 比对，漂移会直接报错

   为什么需要它：
   存储层收敛为「只有富文本」之后，任何以 format:'md' 落库的入口
   （云端同步拉取、老备份导入、随手记导入）都必须先转成 HTML，
   否则库里就会重新长出第二种格式，分支点又回来了。

   为什么不用 DOMPurify（服务端那一侧）：
   DOMPurify 需要真实 DOM，Node 端拿不到 sanitize。
   所以这里用 marked 的 renderer 钩子自己净化。

   为什么做成「工厂」：
   两端拿 marked 的方式不同（桌面 require 本地 vendor，云端读全局），
   这里把 Marked 构造函数当参数收进来，自己不碰全局、不碰文件系统。
   桌面 lib/mdconv.js 与云端 mdconv.js 都只剩几行适配。

   marked v12 的 renderer 钩子签名是扁平的：
     html(token)   → token 是原始 HTML 字符串
     link(token)   → token 是 href
     image(token)  → token 是 src
   注意与 v13+ 的 {href,text} 对象形式不同。

   安全模型（分层纵深）：
     第 1 层 这里：marked + 本文件的钩子过滤，拦 script / 事件属性 /
              javascript: 协议
     第 2 层 渲染端：noteHtml() 里的 DOMPurify.sanitize()，
              进 DOM 前必过一遍
   第 2 层是最后一道闸，这层只负责不让危险内容进库。
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SJMDConvCore = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function escapeHtmlText(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escapeAttr(s) {
    return escapeHtmlText(s).replace(/"/g, '&quot;');
  }

  /* 危险协议：javascript: / vbscript: / data:text/html
     （data:image/* 是安全的图片内联，图片上传走的就是它） */
  function isDangerousUrl(url) {
    const s = String(url || '').trim().replace(/[\x00- ]/g, '').toLowerCase();
    if (s.startsWith('javascript:')) return true;
    if (s.startsWith('vbscript:')) return true;
    if (s.startsWith('data:text/html')) return true;
    return false;
  }

  /* 属性名黑名单：任何 on* 事件属性一律丢掉。
     合法属性白名单化比黑名单更稳，但 md 渲染本来就不产出
     复杂属性，这里用黑名单覆盖 marked 透传的原始 HTML。 */
  const DANGEROUS_ATTR = /\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
  const DANGEROUS_TAG = /<\s*\/?\s*(script|iframe|object|embed|form|style|link|meta|base)\b[^>]*>/gi;

  function stripDangerous(html) {
    let out = String(html || '');
    /* 先整块去掉危险标签及其内容（script/style 的正文也不该留） */
    out = out.replace(/<\s*(script|style|iframe|object|embed|form)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
    /* 自闭合/孤立形式的危险标签 */
    out = out.replace(DANGEROUS_TAG, '');
    /* 事件属性 */
    out = out.replace(DANGEROUS_ATTR, '');
    return out;
  }

  function makeRenderer() {
    return {
      /* 原始 HTML：marked 默认直通，这里过滤后再放行。
         注意 marked v12 的 html 钩子拿到的是字符串。 */
      html(token) {
        return stripDangerous(token);
      },
      link(href, title, text) {
        const u = String(href || '');
        /* 危险协议的链接：整个降级为纯文本，不留可点区域。
           也不能把 href 原样塞进文本里 —— 那会让 URL 出现在
           正文可见位置（比如 javascript:alert(1) 这种）。 */
        if (isDangerousUrl(u)) return escapeHtmlText(text);
        return '<a href="' + escapeAttr(u) + '">' + escapeHtmlText(text) + '</a>';
      },
      image(src, title, text) {
        const u = String(src || '');
        if (isDangerousUrl(u)) return '';
        return '<img src="' + escapeAttr(u) + '" alt="' + escapeAttr(text || '') + '">';
      }
    };
  }

  /* Marked：调用方注入构造函数。实例只建一次（marked.use 会改实例的
     内部 options/renderer，每篇都 new 一个纯属浪费）。 */
  function create(opts) {
    const Marked = opts && opts.Marked;
    if (typeof Marked !== 'function') {
      throw new Error('mdconv-core: 缺少 Marked 构造函数');
    }
    let md = null;
    function parser() {
      if (!md) {
        md = new Marked();
        md.use({ renderer: makeRenderer() });
      }
      return md;
    }

    /* Markdown 源码 → 富文本 HTML。
       返回的 HTML 已过净化，可安全落库；
       渲染端还会再过一遍 DOMPurify。 */
    function mdToRich(markdown) {
      if (!markdown) return '';
      try {
        return stripDangerous(parser().parse(String(markdown)));
      } catch (_) {
        /* 渲染失败绝不能让整条笔记写不进去：降级为纯文本段落 */
        return '<p>' + escapeHtmlText(markdown).replace(/\n/g, '<br>') + '</p>';
      }
    }

    /* 统一入口：把任意形态的笔记正文转成富文本 HTML。
       format 已经是 rich 的原样返回（但仍过一遍净化，
       保证库里不会躺着历史遗留的脏 HTML）。 */
    function toRichHtml(note) {
      if (!note) return '';
      const c = String(note.content || '');
      if (note.format === 'rich') return stripDangerous(c);
      return mdToRich(c);
    }

    return { mdToRich, toRichHtml, stripDangerous };
  }

  return { create, stripDangerous, isDangerousUrl, escapeHtmlText, escapeAttr };
}));
