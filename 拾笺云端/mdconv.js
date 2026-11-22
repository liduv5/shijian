/* ============================================================
   Markdown → 富文本 转换（浏览器版）
   ------------------------------------------------------------
   为什么需要它：
   存储层收敛为「只有富文本」之后，任何以 format:'md' 落到云端库的
   入口（老设备推上去的旧行、老备份导入）都必须先转成 HTML，
   否则库里就会重新长出第二种格式，分支点又回来了。

   为什么单独成文件：
   mobilesync.js 负责云端行的读写，它的加载顺序在 app.js 之前，
   拿不到 app.js 内部的函数。所以渲染能力放在这里，
   由 index.html 在 marked/purify 之后、业务脚本之前加载。

   安全模型（分层纵深）：
     第 1 层 这里：marked + DOMPurify.sanitize，拦 script/事件属性/
              javascript: 协议
     第 2 层 渲染端：noteHtml() 里的 DOMPurify.sanitize，
              正文进 DOM 前必过一遍
   第 2 层是最后一道闸，这里负责不让危险内容进库。
   ============================================================ */
(function (global) {
  'use strict';

  /* marked v12 的 renderer 钩子签名是扁平的：
       html(token)  → token 是原始 HTML 字符串
       link(href, title, text)
       image(src, title, text)
     注意与 v13+ 的 {href,text} 对象形式不同。 */

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

  function stripDangerous(html) {
    let out = String(html || '');
    /* 先整块去掉危险标签及其内容（script/style 的正文也不该留） */
    out = out.replace(/<\s*(script|style|iframe|object|embed|form)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
    /* 自闭合/孤立形式的危险标签 */
    out = out.replace(/<\s*\/?\s*(script|iframe|object|embed|form|style|link|meta|base)\b[^>]*>/gi, '');
    /* 事件属性 */
    out = out.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    return out;
  }

  function makeRenderer() {
    return {
      html(token) {
        return stripDangerous(token);
      },
      link(href, title, text) {
        const u = String(href || '');
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

  /* Markdown 源码 → 富文本 HTML。
     返回的 HTML 已过净化，可安全落库；
     客户端渲染时还会再过一遍 DOMPurify。 */
  function mdToRich(markdown) {
    if (!markdown) return '';
    try {
      const md = new marked.Marked();
      md.use({ renderer: makeRenderer() });
      return stripDangerous(md.parse(String(markdown)));
    } catch (_) {
      /* 渲染失败绝不能让整条笔记写不进去：降级为纯文本段落 */
      return '<p>' + escapeHtmlText(markdown).replace(/\n/g, '<br>') + '</p>';
    }
  }

  /* 统一入口：把任意形态的笔记正文转成富文本 HTML */
  function toRichHtml(note) {
    if (!note) return '';
    const c = String(note.content || '');
    if (note.format === 'rich') return stripDangerous(c);
    return mdToRich(c);
  }

  global.SJMDConv = { mdToRich, toRichHtml, stripDangerous };
})(typeof window !== 'undefined' ? window : globalThis);
