/* ============================================================
   拾笺 · 手机端附件仓（IndexedDB）
   ------------------------------------------------------------
   为什么不放在 localStorage：
     localStorage 每个源只有约 5MB，一张手机照片转成 data URL
     就 3～8MB，第二张就写不进去，而且 writeFile 失败是静默的，
     重开应用后附件二进制全丢 —— 正文里的图片就只剩 alt（文件名）。

   所以：正文/目录/标签等小数据仍走 localStorage（够小、可同步读），
   图片、PDF 这类大块二进制放 IndexedDB（配额按磁盘剩余空间算，
   几百 MB 到几 G 都行），键就是附件 id。

   对外只暴露同步可用的 put/get/del/all，拿不到 IDB（隐私模式）时
   自动降级成内存 Map，功能不报错、只是关页面后丢。
   ============================================================ */
(function () {
  'use strict';

  const DB_NAME = 'sj_att_v1';
  const STORE = 'files';
  const mem = new Map();     // 内存缓存 + IDB 不可用时的降级仓
  const MEM_MAX = 60;        // 内存里最多留 60 份，多了按先后淘汰（避免越用越大）
  function trimMem() {
    while (mem.size > MEM_MAX) mem.delete(mem.keys().next().value);
  }
  let dbp = null;
  let usable = true;
  let warned = false;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        usable = false;
        return reject(new Error('IndexedDB 不可用'));
      }
      let req;
      try { req = indexedDB.open(DB_NAME, 1); } catch (e) { usable = false; return reject(e); }
      /* 部分手机浏览器（多标签 / 省电冻结 / 隐私模式）会让 open 既不 success、
         也不 error、也不 blocked，Promise 永远悬着。所有附件读写都会卡在
         store() 上，界面表现为「点了没反应」。4 秒拿不到就降级内存仓。 */
      const timer = setTimeout(() => {
        usable = false;
        reject(new Error('IndexedDB 打开超时'));
      }, 4000);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => { clearTimeout(timer); resolve(req.result); };
      req.onerror = () => { clearTimeout(timer); usable = false; reject(req.error); };
      req.onblocked = () => {
        clearTimeout(timer); usable = false;
        reject(new Error('IndexedDB 被其他标签页阻塞'));
      };
    }).catch((e) => {
      if (!warned) { warned = true; console.warn('附件仓不可用，改用内存暂存：', e && e.message); }
      usable = false;
      throw e;
    });
    return dbp;
  }

  function store(mode) {
    return open().then((db) => db.transaction(STORE, mode).objectStore(STORE));
  }
  function reqP(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  /* 写一份（data 是 data URL 字符串）。同步返回，内部异步落库。 */
  function put(id, data) {
    if (!id || !data) return Promise.resolve();
    mem.set(id, data);
    trimMem();
    if (!usable) return Promise.resolve();
    return store('readwrite')
      .then((s) => reqP(s.put(data, id)))
      .catch(() => { usable = false; });
  }

  function get(id) {
    if (!id) return Promise.resolve(null);
    if (mem.has(id)) return Promise.resolve(mem.get(id));
    if (!usable) return Promise.resolve(null);
    return store('readonly').then((s) => reqP(s.get(id))).then((v) => {
      if (v) { mem.set(id, v); trimMem(); }
      return v || null;
    }).catch(() => null);
  }

  /* 只问「有没有」，不把几 MB 的 data URL 读出来（拉取时用它跳过重复下载） */
  function has(id) {
    if (!id) return Promise.resolve(false);
    if (mem.has(id)) return Promise.resolve(true);
    if (!usable) return Promise.resolve(false);
    return store('readonly').then((s) => {
      if (typeof s.getKey === 'function') return reqP(s.getKey(id)).then((k) => k !== undefined);
      return reqP(s.get(id)).then((v) => v != null);
    }).catch(() => false);
  }

  function del(id) {
    mem.delete(id);
    if (!usable || !id) return Promise.resolve();
    return store('readwrite').then((s) => reqP(s.delete(id))).catch(() => {});
  }

  /* 全部读出：Map<attId, dataURL>。启动时一次性回填，之后全靠内存。 */
  function all() {
    if (!usable) return Promise.resolve(new Map(mem));
    return store('readonly').then((s) => new Promise((resolve) => {
      const out = new Map();
      const req = s.openCursor();
      req.onsuccess = () => {
        const cur = req.result;
        if (!cur) return resolve(out);
        out.set(String(cur.key), cur.value);
        cur.continue();
      };
      req.onerror = () => resolve(new Map(mem));
    })).catch(() => new Map(mem));
  }

  /* 清空（重置本地数据时用） */
  function clear() {
    mem.clear();
    if (!usable) return Promise.resolve();
    return store('readwrite').then((s) => reqP(s.clear())).catch(() => {});
  }

  /* 粗略统计已占多少（给「数据管理」用） */
  function usage() {
    let bytes = 0;
    mem.forEach((v) => { bytes += String(v).length; });
    return { count: mem.size, bytes };
  }

  window.SJAttStore = { put, get, has, del, clear, all, usage, get usable() { return usable; } };
})();
