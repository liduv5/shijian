/* ============================================================
   Markdown → 富文本（浏览器适配层）
   ------------------------------------------------------------
   真正的转换逻辑与净化逻辑在 mdconv-core.js，那份文件与桌面端
   lib/mdconv.js 背后的内核逐字相同（md5 校验）。
   这里只负责两件浏览器侧的事：
     ① 拿到全局 marked 的构造函数（Node 那边是 require 本地 vendor）
     ② 按全局对象形状暴露，mobilesync.js 等脚本按 SJMDConv 调用

   为什么单独成文件：
   mobilesync.js 负责云端行的读写，它的加载顺序在 app.js 之前，
   拿不到 app.js 内部的函数，所以渲染能力必须挂在全局。

   改逻辑请改内核；改这里等于只改云端，两端会立刻漂移。
   ============================================================ */
(function (global) {
  'use strict';

  if (!global.SJMDConvCore || !global.marked) {
    /* 内核或 marked 没加载成功时不抛出，只留个标记：各调用点都写着
       `window.SJMDConv ? … : 原文`，会退回纯文本，
       总比整页脚本中断、界面全白要好。 */
    global.SJMDConv = null;
    return;
  }

  global.SJMDConv = global.SJMDConvCore.create({ Marked: global.marked.Marked });
})(typeof window !== 'undefined' ? window : globalThis);
