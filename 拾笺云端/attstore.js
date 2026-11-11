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
  /* -72：独立的快照仓，与附件二进制分开存。all() 只遍历 files，
     所以快照不会被当成附件灌回内存；也不占 localStorage 配额。 */
  const SNAP_STORE = 'snapshots';
  const mem = new Map();     // 内存缓存 + IDB 不可用时的降级仓
  const MEM_MAX = 60;        // 内存里最多留 60 份，多了按先后淘汰（避免越用越大）
  function trimMem() {
    while (mem.size > MEM_MAX) mem.delete(mem.keys().next().value);
  }
  let dbp = null;
  let usable = true;
  let warned = false;
  let coolUntil = 0;      // 超时后的退避截止时间，到点重新尝试打开

  function open() {
    if (dbp) return dbp;
    /* 超时不是「这台机器没有 IndexedDB」，只是「这次没打开」。
       以前这里把 usable 置 false 且 dbp 永久留着 rejected promise，
       于是**一次打开超时 = 整个会话所有附件都读不出来**：用户看到的就是
       「图片能显示（走远程地址）、PDF 点下载没反应（仓里明明有数据却读不到）」。
       现在超时只退避 15 秒，过后重试；只有明确不支持 / 明确报错才判死。 */
    if (Date.now() < coolUntil) return Promise.reject(new Error('附件仓冷却中'));
    dbp = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        usable = false;
        return reject(new Error('IndexedDB 不可用'));
      }
      let req;
      /* 版本 2 只新增 snapshots 仓；已装到桌面的旧库会走一次 upgrade，
         files 仓原样保留，不需要迁移任何附件数据。 */
      try { req = indexedDB.open(DB_NAME, 2); } catch (e) { usable = false; return reject(e); }
      /* 部分手机浏览器（多标签 / 省电冻结 / 隐私模式）会让 open 既不 success、
         也不 error、也不 blocked，Promise 永远悬着。所有附件读写都会卡在
         store() 上，界面表现为「点了没反应」。 */
      const timer = setTimeout(() => {
        reject(new Error('IndexedDB 打开超时'));
      }, 8000);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
        if (!db.objectStoreNames.contains(SNAP_STORE)) db.createObjectStore(SNAP_STORE);
      };
      req.onsuccess = () => { clearTimeout(timer); resolve(req.result); };
      req.onerror = () => { clearTimeout(timer); usable = false; reject(req.error); };
      req.onblocked = () => {
        clearTimeout(timer); reject(new Error('IndexedDB 被其他标签页阻塞'));
      };
    }).catch((e) => {
      const msg = (e && e.message) || '';
      const soft = /超时|阻塞/.test(msg);
      if (!soft) usable = false;
      else coolUntil = Date.now() + 15000;
      /* 必须清掉这个失败的 promise，否则后续每次调用都直接拿到同一个 reject，
         永远没有重试的机会。 */
      dbp = null;
      if (!warned) { warned = true; console.warn('附件仓暂时读不到：', msg); }
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

  /* 写一份（data 是 data URL 字符串）。同步返回，内部异步落库。
     写失败**不能**把 usable 置 false：写失败多半是配额满 / 事务被中断，
     读仍然完全可用。以前这里 catch 里置 false，一次写失败就会让整个会话
     的附件都读不出来（下载表现为「点了没反应」）。 */
  function put(id, data) {
    if (!id || !data) return Promise.resolve();
    mem.set(id, data);
    trimMem();
    if (!usable) return Promise.resolve();
    return store('readwrite')
      .then((s) => reqP(s.put(data, id)))
      .catch(() => {});
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

  /* 同步前快照（-72）：只留最近一份，键固定为 'before'。 */
  function snapStore(mode) {
    return open().then((db) => db.transaction(SNAP_STORE, mode).objectStore(SNAP_STORE));
  }
  function putSnap(data) {
    if (!usable) return Promise.resolve(false);
    return snapStore('readwrite').then((s) => reqP(s.put(data, 'before')))
      .then(() => true).catch(() => false);
  }
  function getSnap() {
    if (!usable) return Promise.resolve(null);
    return snapStore('readonly').then((s) => reqP(s.get('before'))).catch(() => null);
  }

  /* 清空（重置本地数据时用）：附件与快照一起清，避免重置后还能恢复出旧库。 */
  function clear() {
    mem.clear();
    if (!usable) return Promise.resolve();
    return Promise.all([
      store('readwrite').then((s) => reqP(s.clear())).catch(() => {}),
      snapStore('readwrite').then((s) => reqP(s.clear())).catch(() => {}),
    ]).then(() => {});
  }

  /* 粗略统计已占多少（给「数据管理」用） */
  function usage() {
    let bytes = 0;
    mem.forEach((v) => { bytes += String(v).length; });
    return { count: mem.size, bytes };
  }

  window.SJAttStore = { put, get, has, del, clear, all, usage, putSnap, getSnap, get usable() { return usable; } };
})();
