/* ============================================================
   拾笺 · 两端接口契约（共用）
   ------------------------------------------------------------
   这个文件在桌面端和云端各存一份，内容必须逐字相同：
     · 同步：拾笺/scripts/sync-shared.js --write
     · 守卫：两端回归测试用 md5 比对，漂移会直接报错

   为什么要有这一个文件：
   桌面端 api() 发 HTTP 给 server.js，云端 api() 转给 SJLocal.api()。
   两边的前端只写 /api/notes/xxx，看不到对面是文件还是 IndexedDB。
   这个「同一套路径 + 同一套字段」以前只活在注释和代码里 —— 两端
   PATCH 的字段恰好一致，但没有任何断言在检查，属于「还没漂」而不是
   「漂不了」。这里把它写成数据：

     · 运行时：未知字段直接 400，不再静默忽略（两端都接）
     · 测试时：同一份 ENDPOINTS 表跑两端差分，比键集合与类型

   注意：只收两端都实现的共享端点。桌面专有的 lan-login / export /
   restart / files 不进表 —— 它们是平台能力，不是约定。
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SJContract = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const NOTE_FIELDS = ['categoryId', 'title', 'content', 'format', 'starred', 'tags'];
  const CAT_PATCH_FIELDS = ['name', 'parentId', 'expanded', 'order', 'color'];

  /* m = 方法，p = 路径模式（:id 匹配任意非空段），body = 允许字段
     body 为 null 表示无字段，'*' 表示整包自由（导入备份）。 */
  const ENDPOINTS = [
    { m: 'GET',    p: '/api/state',                              body: null },
    { m: 'GET',    p: '/api/trash',                              body: null },
    { m: 'DELETE', p: '/api/trash',                              body: null },
    { m: 'POST',   p: '/api/trash/:id/restore',                  body: null },
    { m: 'DELETE', p: '/api/trash/:id',                          body: null },
    { m: 'POST',   p: '/api/categories',                         body: ['name', 'parentId'] },
    { m: 'PATCH',  p: '/api/categories/:id',                     body: CAT_PATCH_FIELDS },
    { m: 'DELETE', p: '/api/categories/:id',                     body: null },
    { m: 'POST',   p: '/api/notes',                              body: NOTE_FIELDS },
    { m: 'GET',    p: '/api/notes/:id',                          body: null },
    { m: 'PATCH',  p: '/api/notes/:id',                          body: NOTE_FIELDS },
    { m: 'DELETE', p: '/api/notes/:id',                          body: null },
    { m: 'POST',   p: '/api/notes/:id/versions',                 body: null },
    { m: 'GET',    p: '/api/notes/:id/versions',                 body: null },
    { m: 'GET',    p: '/api/notes/:id/versions/:vid',            body: null },
    { m: 'POST',   p: '/api/notes/:id/versions/:vid/restore',    body: null },
    { m: 'DELETE', p: '/api/notes/:id/versions/:vid',            body: null },
    { m: 'POST',   p: '/api/notes/:id/attachments',              body: ['name', 'type', 'data', 'size'] },
    { m: 'DELETE', p: '/api/notes/:id/attachments/:aid',         body: null },
    { m: 'POST',   p: '/api/import',                             body: '*' },
  ];

  /* 按方法 + 实际路径找契约条目；/:xxx 只匹配一段，不会把
     /api/notes/a/versions 误匹配成 /api/notes/:id。 */
  function find(method, pathname) {
    const segs = String(pathname || '').split('?')[0].split('/').filter(Boolean);
    const m = String(method || 'GET').toUpperCase();
    for (const ep of ENDPOINTS) {
      if (ep.m !== m) continue;
      const parts = ep.p.split('/').filter(Boolean);
      if (parts.length !== segs.length) continue;
      let hit = true;
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].charAt(0) === ':') continue;
        if (parts[i] !== segs[i]) { hit = false; break; }
      }
      if (hit) return ep;
    }
    return null;
  }

  /* 返回不在白名单里的字段名。未知端点、自由 body、无 body 都返回空数组。 */
  function unknownFields(method, pathname, body) {
    const ep = find(method, pathname);
    if (!ep || !ep.body || ep.body === '*') return [];
    if (!body || typeof body !== 'object' || Array.isArray(body)) return [];
    return Object.keys(body).filter((k) => ep.body.indexOf(k) < 0);
  }

  /* 差分测试用：只比「形状」，不比具体值。
     日期、随机 id、正文内容本来就会不同，键集合和类型才该一致。 */
  function shapeOf(v) {
    if (v === null) return 'null';
    if (Array.isArray(v)) return v.length ? ['array', shapeOf(v[0])] : 'array';
    if (typeof v === 'object') {
      const out = {};
      Object.keys(v).sort().forEach((k) => { out[k] = shapeOf(v[k]); });
      return out;
    }
    return typeof v;
  }

  return { ENDPOINTS, find, unknownFields, shapeOf };
}));
