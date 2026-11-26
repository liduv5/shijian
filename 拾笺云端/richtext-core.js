/* ============================================================
   拾笺 · 富文本 ⇄ Markdown 内核（两端共用）
   ------------------------------------------------------------
   这个文件在桌面端和云端各存一份，内容必须逐字相同：
     · 同步：拾笺/scripts/sync-shared.js 一键复制
     · 守卫：两端回归测试用 md5 比对，漂移会直接报错
   改配置只改桌面这一份，然后跑一次同步脚本。

   为什么做成「工厂」而不是直接 new 一个 td：
   两端拿依赖的方式不同（桌面 require 本地 vendor，云端读全局），
   这里把依赖当参数收进来，自己不碰全局、不碰文件系统。
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SJRTCore = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* 图片尺寸规则：富文本里调过宽度的图片，转 Markdown 时保留为 <img>，
     否则宽度会丢（turndown 默认把 img 变成 ![](url)，style 无从带上）。 */
  function imgWithWidthRule() {
    return {
      filter: (node) => node.nodeName === 'IMG' && /(^|;)\s*width\s*:/i.test(node.getAttribute('style') || ''),
      replacement: (content, node) => {
        const src = node.getAttribute('src') || '';
        const alt = node.getAttribute('alt') || '';
        const w = ((/width\s*:\s*([^;]+)/i.exec(node.getAttribute('style') || '') || [])[1] || '').trim();
        return `<img src="${src}" alt="${alt}" style="width:${w}">`;
      },
    };
  }

  /* TurndownService 与 gfm 插件都由调用方传入：
       桌面/云端 app.js 里都有全局 TurndownService / turndownPluginGfm
     gfmPlugin 可以为空（缺插件时退回基础转换，不让整页挂掉）。 */
  function createTurndown(TurndownService, gfmPlugin) {
    if (typeof TurndownService !== 'function') {
      throw new Error('richtext-core: 缺少 TurndownService');
    }
    const td = new TurndownService({
      headingStyle: 'atx',
      hr: '---',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
      emDelimiter: '*',
    });
    if (gfmPlugin && gfmPlugin.gfm) td.use(gfmPlugin.gfm);
    td.addRule('imgWithWidth', imgWithWidthRule());
    return td;
  }

  return { createTurndown, imgWithWidthRule };
}));
