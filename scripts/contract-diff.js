/* ============================================================
   拾笺 · 两端接口差分测试
   ------------------------------------------------------------
   同一组请求打两遍：桌面 → 真实 Node 服务；云端 → vm 沙箱里的
   SJLocal（同一份 local.js）。只比返回体的「形状」——键集合与类型，
   不比随机 id、时间戳、正文这些本来就该不同的值。

   跑法：node scripts/contract-diff.js
   退出码 0 = 两端一致；1 = 发现漂移（会逐条列出路径）。

   这是独立命令，不塞进日常回归：它要起一个临时服务进程，比 600 多条
   静态断言重得多。发布前跑一次即可。
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const vm = require('vm');
const cp = require('child_process');

const ROOT = path.join(__dirname, '..');
const DESKTOP = path.join(ROOT, '拾笺');
const CLOUD = path.join(ROOT, '拾笺云端');
const TMP = path.join(ROOT, 'Local', 'Temp', 'contract-diff');
const CONTRACT = require(path.join(DESKTOP, 'public', 'api-contract.js'));

/* 桌面专有、云端不该有的字段 —— 平台差异，不算漂移。 */
const IGNORE_KEYS = new Set(['bootId']);

function makeShape(value) {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return value.length ? ['array', makeShape(value[0])] : 'array';
  if (typeof value === 'object') {
    const out = {};
    Object.keys(value).sort().forEach((k) => {
      if (!IGNORE_KEYS.has(k)) out[k] = makeShape(value[k]);
    });
    return out;
  }
  return typeof value;
}

/* ---------- 云端：把浏览器全局塞进 vm，直接跑真正的 local.js ---------- */
function loadCloud(seed) {
  const store = new Map();
  /* 桌面首次启动会塞样例数据，云端是新空库。不把起点对齐，
     「全量状态」这条永远会报漂移——那是测试污染，不是契约问题。 */
  if (seed) {
    store.set('sj_mobile_v1', JSON.stringify({
      categories: seed.categories || [],
      notes: seed.notes || [],
      versions: {},
    }));
  }
  const sandbox = {
    console,
    URL, URLSearchParams, TextEncoder, TextDecoder,
    JSON, Math, Date, Number, String, Array, Object, Set, Map, RegExp, Boolean, Error, Promise,
    setTimeout, clearTimeout,
    crypto: { getRandomValues: (a) => {
      for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256);
      return a;
    } },
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
    location: { origin: 'http://localhost' },
    document: { querySelectorAll: () => [], body: {}, dispatchEvent: () => {} },
    MutationObserver: class { observe() {} disconnect() {} },
    dispatchEvent: () => {},
    addEventListener: () => {},
    toast: () => {},
    SJCats: require(path.join(DESKTOP, 'public', 'cat-core.js')),
    SJMDConv: require(path.join(DESKTOP, 'public', 'mdconv-core.js')),
    SJAttStore: {
      put: async () => {}, get: async () => null, del: async () => {},
      urlFor: () => null, list: async () => [],
    },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(CLOUD, 'local.js'), 'utf8'), sandbox, { filename: 'local.js' });
  if (!sandbox.SJLocal) throw new Error('local.js 没有挂出 SJLocal');
  return sandbox.SJLocal;
}

/* ---------- 桌面：临时端口 + 独立数据目录，不碰真实 db.json ---------- */
function startDesktop() {
  /* 上一轮跑出来的数据会让首屏「全量状态」一边空一边非空，那是测试污染不是漂移。 */
  fs.rmSync(TMP, { recursive: true, force: true });
  fs.mkdirSync(TMP, { recursive: true });
  const port = 5300 + Math.floor(Math.random() * 400);
  const child = cp.spawn(process.execPath, ['server.js'], {
    cwd: DESKTOP,
    env: { ...process.env, SHIJIAN_DATA_DIR: TMP, PORT: String(port) },
    stdio: 'ignore',
  });
  return { port, child };
}

function waitReady(port) {
  const deadline = Date.now() + 10000;
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get({ host: '127.0.0.1', port, path: '/api/state', timeout: 1000 }, (res) => {
        res.resume();
        if (res.statusCode === 200) return resolve();
        retry();
      });
      req.on('error', retry);
      req.on('timeout', () => { req.destroy(); retry(); });
    };
    const retry = () => {
      if (Date.now() > deadline) return reject(new Error('桌面服务 10 秒内没起来'));
      setTimeout(tick, 120);
    };
    tick();
  });
}

function callDesktop(port, method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const payload = body === null || body === undefined ? null : JSON.stringify(body);
    const req = http.request({
      host: '127.0.0.1', port, method, path: urlPath,
      headers: payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {},
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let parsed = null;
        try { parsed = text ? JSON.parse(text) : null; } catch (_) { parsed = text; }
        if (res.statusCode >= 400) return reject(new Error(res.statusCode + ' ' + (parsed && parsed.error || text)));
        resolve(parsed);
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

/* 场景返回的是 [方法, 路径, body, 从响应里取哪个值给后续用] 的序列。
   两次运行各自取自己的 id，所以形状里不会出现交叉污染。 */
async function runSequence(call) {
  const ctx = {};
  const out = [];
  const step = async (label, method, p, body, saveAs) => {
    if (!CONTRACT.find(method, p)) throw new Error('这一步没有契约：' + method + ' ' + p);
    const res = await call(method, p, body);
    out.push([label, method + ' ' + p, makeShape(res)]);
    if (saveAs) ctx[saveAs] = res;
    return res;
  };

  await step('全量状态', 'GET', '/api/state', null, 'state');
  await step('回收站列表', 'GET', '/api/trash', null);
  const cat = await step('建分类', 'POST', '/api/categories', { name: '差分分类', parentId: null }, 'cat');
  const catId = cat.id;
  await step('改分类', 'PATCH', '/api/categories/' + catId, { name: '差分分类2', expanded: true, color: 2 });
  const note = await step('建笔记', 'POST', '/api/notes', {
    title: '差分笔记', content: '<p>正文</p>', format: 'rich',
    categoryId: catId, starred: false, tags: ['差分'],
  }, 'note');
  const noteId = note.id;
  await step('改笔记', 'PATCH', '/api/notes/' + noteId, {
    title: '差分笔记2', content: '<p>改过</p>', format: 'rich',
    categoryId: catId, starred: true, tags: ['标签'],
  });
  await step('读笔记', 'GET', '/api/notes/' + noteId, null);
  await step('手动存版本', 'POST', '/api/notes/' + noteId + '/versions', null);
  const vlist = await step('版本列表', 'GET', '/api/notes/' + noteId + '/versions', null);
  const vid = vlist.versions && vlist.versions[0] && vlist.versions[0].id;
  if (vid) {
    await step('读单个版本', 'GET', '/api/notes/' + noteId + '/versions/' + vid, null);
    await step('恢复版本', 'POST', '/api/notes/' + noteId + '/versions/' + vid + '/restore', null);
    await step('删版本', 'DELETE', '/api/notes/' + noteId + '/versions/' + vid, null);
  }
  await step('软删笔记', 'DELETE', '/api/notes/' + noteId, null);
  await step('恢复笔记', 'POST', '/api/trash/' + noteId + '/restore', null);
  await step('删分类（并入父级）', 'DELETE', '/api/categories/' + catId + '?strategy=move', null);
  await step('清空回收站', 'DELETE', '/api/trash', null);
  return out;
}

async function main() {
  const srv = startDesktop();
  let desktop, local;
  try {
    await waitReady(srv.port);
    desktop = (m, p, b) => callDesktop(srv.port, m, p, b);
    local = loadCloud(await desktop('GET', '/api/state', null));
    const cloud = (m, p, b) => local.api(p, { method: m, body: b });
    const a = await runSequence(desktop);
    const b = await runSequence(cloud);
    let drift = 0;
    for (let i = 0; i < a.length; i++) {
      const left = JSON.stringify(a[i][2]);
      const right = JSON.stringify(b[i][2]);
      if (left === right) {
        console.log('  ✓ ' + a[i][0] + '  ' + a[i][1]);
      } else {
        drift++;
        console.log('  ✗ ' + a[i][0] + '  ' + a[i][1]);
        console.log('      桌面 ' + left);
        console.log('      云端 ' + right);
      }
    }
    console.log('\n差分：' + a.length + ' 步，' + drift + ' 处漂移');
    process.exitCode = drift ? 1 : 0;
  } catch (e) {
    console.error('差分测试中断：' + (e && e.message || e));
    process.exitCode = 1;
  } finally {
    srv.child.kill();
  }
}

main();
