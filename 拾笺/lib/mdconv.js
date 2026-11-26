/* ============================================================
   Markdown → 富文本（服务端适配层）
   ------------------------------------------------------------
   真正的转换逻辑与净化逻辑在 public/mdconv-core.js，那份文件与
   云端 mdconv.js 共用同一个内核（逐字相同，md5 校验）。
   这里只负责两件 Node 侧的事：
     ① 从本地 vendor 取 marked 构造函数（浏览器那边读的是全局 marked）
     ② 按 CommonJS 形状导出，server.js 用 require('./lib/mdconv.js')

   改逻辑请改内核；改这里等于只改桌面端，两端会立刻漂移。
   ============================================================ */

const markedMod = require('../public/vendor/marked.min.js');
const core = require('../public/mdconv-core.js');

const conv = core.create({ Marked: markedMod.Marked });

module.exports = {
  mdToRich: conv.mdToRich,
  toRichHtml: conv.toRichHtml,
  stripDangerous: conv.stripDangerous,
};
