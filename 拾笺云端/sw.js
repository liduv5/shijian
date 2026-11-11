/* ============================================================
   拾笺 · Service Worker
   目的：让手机端可以「添加到主屏幕」像 App 一样打开，并且断网也能看笔记。
   策略：
     · 页面导航  → 网络优先（2.5s 超时），失败回落缓存里的 index.html
     · 静态资源  → 先用缓存、同时后台更新（stale-while-revalidate）
     · 接口/跨域 → 不拦截（Supabase、云存储等一律直连）
   注意 1：改完前端文件要把 VERSION 加一，用户下次打开才会换掉旧缓存。
   注意 2：这个站点的裸静态路径一律 403，只有带 ?sharecode= 或带访问码 cookie 才放行。
           手机浏览器（尤其 iOS / 隐私模式）可能拒收 cookie，导致 HTML 加载了但
           所有 js/css 全部 403 —— 表现为「界面在、进度条卡住、按钮点不动」。
           所以每个同源请求都由 SW 主动补上访问码，不依赖 cookie。
   ============================================================ */
const VERSION = 'sj-2026-11-11-73';
const CACHE = 'shijian-' + VERSION;

const SC_KEY = 'sharecode';
/* 访问码会随「重新发布 / 换分享链接」变化，写死在代码里迟早过期：
   实测上一个写死的码现在裸请求已直接 403。
   所以优先取注册时 sw.js URL 上带的码（pwa.js / index.html 注册时会拼上
   当前页面链接里的码），页面每次打开还会 postMessage 同步一次最新码，
   连已经装好的旧 SW 也能跟着换。常量只作最后兜底。 */
let SC_VAL = '3J7BKHTGFD';
try {
  if (typeof self !== 'undefined' && self.location) {
    const v = new URL(self.location.href).searchParams.get(SC_KEY);
    if (v) SC_VAL = v;
  }
} catch (_) {}
function scSuffix() { return SC_VAL ? '?' + SC_KEY + '=' + encodeURIComponent(SC_VAL) : ''; }

/* 首屏必需资源：安装时预缓存。每一项都必须带访问码，否则预缓存会静默失败。 */
const RAW_SHELL = [
  '/index.html',
  '/quick.html',
  '/manifest.webmanifest',
  '/quick.webmanifest',
  '/style.css',
  /* 品牌字子集（只含「拾」「笺」两字）：手机没有系统楷体，
     不预缓存时离线会掉回宋体，与电脑版看不齐。 */
  '/sj-brand.woff2',
  '/sjplus.css',
  '/app.js',
  '/sjplus.js',
  '/local.js',
  '/attstore.js',
  '/mobilesync.js',
  '/export.js',
  '/pwa.js',
  '/fts.js',
  '/backlinks.js',
  '/diffview.js',
  '/conflict.js',
  '/e2ee.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon-32.png',
  /* 速记专用图标（绿色铅笔）：桌面快捷方式 / manifest 解析都要用，
     必须一起预缓存，否则离线或换版时又变回默认的红色「拾」图标。 */
  '/icons/icon-quick-192.png',
  '/icons/icon-quick-512.png',
  '/icons/icon-quick-maskable-192.png',
  '/icons/icon-quick-maskable-512.png',
  '/icons/apple-touch-icon-quick.png',
  '/icons/favicon-quick-32.png',
  '/vendor/workbuddy-cloud-sdk.js',
  '/vendor/docx.umd.js',
  '/vendor/marked.min.js',
  '/vendor/purify.min.js',
  '/vendor/turndown.js',
  '/vendor/turndown-plugin-gfm.js',
  '/vendor/highlight.min.js',
  '/vendor/github-dark.min.css',
];
/* 用函数而不是顶层常量：SC_VAL 可能刚被页面 postMessage 更新过。 */
function shellUrls() { return RAW_SHELL.map((p) => p + scSuffix()); }
/* 只拦截这些静态资源；其余同源请求（尤其是 /.cloud/database/rest/*）一律直连。
   云端 API 的 GET 带 Authorization 和 x-wb-webapp-access-key，一旦被当作静态资源
   重建 Request 就会丢光鉴权头，还会被补上 sharecode（PostgREST 当成过滤器 → 400）。
   表现就是「从云端拉取失败：操作失败，请稍后再试」。 */
const ASSET_PATHS = new Set(RAW_SHELL);

function indexKey() { return '/index.html' + scSuffix(); }

/* 给同源 URL 补访问码；已有则原样返回 */
function ensureSC(raw) {
  try {
    const u = new URL(raw);
    if (u.origin !== self.location.origin) return raw;
    if (!u.searchParams.has(SC_KEY)) u.searchParams.set(SC_KEY, SC_VAL);
    return u.toString();
  } catch (_) { return raw; }
}

/* 用带访问码的 URL 发请求，但缓存键仍用原始 req，避免污染缓存命名空间 */
function netRequest(req) {
  const url = ensureSC(req.url);
  if (url === req.url) return req;
  return new Request(url, {
    method: req.method,
    headers: req.headers,
    credentials: req.credentials,
    cache: 'no-store',
    mode: req.mode,
    redirect: req.redirect,
  });
}

if (typeof self !== 'undefined') self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    /* 逐个缓存 + 容错：任何一项失败都不阻断安装 */
    await Promise.all(shellUrls().map(async (url) => {
      try {
        /* 每项 6 秒超时：任一项挂住都不能拖住 install，否则新版永不接管。 */
        const res = await withTimeout(
          fetch(new Request(url, { cache: 'reload', credentials: 'same-origin' })), 6000);
        if (res && (res.ok || res.type === 'opaque')) await cache.put(url, res);
      } catch (_) { /* 忽略单个失败 */ }
    }));
    await self.skipWaiting();
  })());
});

if (typeof self !== 'undefined') self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('shijian-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

function offlinePage() {
  const url = self.location.origin + '/' + scSuffix();
  return new Response(
    '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>拾笺</title><body style="margin:0;background:#f5f6fa;color:#1f2329;'
    + 'font:15px/1.7 -apple-system,BlinkMacSystemFont,\'PingFang SC\',sans-serif;display:flex;'
    + 'align-items:center;justify-content:center;min-height:100vh;padding:24px;box-sizing:border-box">'
    + '<div style="max-width:340px;background:#fff;border-radius:16px;padding:32px 26px;text-align:center;'
    + 'box-shadow:0 8px 32px rgba(0,0,0,.08)">'
    + '<div style="font-size:19px;font-weight:600;margin-bottom:10px">暂时打不开拾笺</div>'
    + '<div style="font-size:13px;color:#4e5969;margin-bottom:20px">请检查网络，或用完整访问链接重新打开。</div>'
    + '<a href="' + url + '" style="display:block;padding:12px;border-radius:10px;background:#2f6f5e;'
    + 'color:#fff;text-decoration:none;font-size:15px">用完整链接打开</a></div></body>',
    { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 200 }
  );
}

/* ---------------------------------------------------------- 声明式下载中转
   页面内保存下载时，app.js 先把文件字节写进这个独立缓存（键是
   /__sjdl/<文件名>?t=…），再用隐藏 iframe 指向同一个地址，由本 SW 把字节带
   响应头回给浏览器。为什么要绕这一圈：华为内核会忽略 <a download>，改用
   blob: 地址里的 UUID 当文件名；而 Content-Disposition 是内核唯一不会绕过
   的文件名来源。缓存名刻意不用 shijian- 前缀，避免 activate 清旧缓存时误删
   正在下载的字节；页面侧 120 秒后自行删除条目。 */
const DL_CACHE = 'sjdl-v1';
async function handleDownload(req) {
  try {
    const cache = await caches.open(DL_CACHE);
    const hit = await cache.match(req.url, { ignoreSearch: true });
    if (hit) return hit;
  } catch (_) {}
  return new Response('文件已过期，请回到拾笺重新点一次下载。', {
    status: 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

/* 页面导航：网络优先；裸链接也会自动补访问码 */
async function handleNavigate(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await withTimeout(fetch(netRequest(req)), 2500);
    if (res && res.ok) {
      /* 只有首页导航才写首页缓存；否则 share_target 打开 quick.html 会把
         速记页覆盖进 /index.html 的离线缓存里。 */
      try {
        const p = new URL(req.url).pathname;
        if (p === '/' || p === '/index.html') await cache.put(indexKey(), res.clone());
      } catch (_) {}
      return res;
    }
    throw new Error('bad status');
  } catch (_) {
    const cached = (await cache.match(indexKey()))
      || (await cache.match(req))
      || (await cache.match('/index.html'));
    return cached || offlinePage();
  }
}

/* 静态资源：代码走网络优先，图片走缓存优先；网络请求一律补访问码。
   ignoreSearch:true 很关键：预缓存的键是 /app.js?sharecode=xxx，而页面
   发来的 req 往往是 /app.js（无参数），精确匹配永远打不中预缓存。 */
const CODE_RE = /\.(?:js|css|html|webmanifest)$/i;
async function handleAsset(req) {
  const cache = await caches.open(CACHE);
  const path = new URL(req.url).pathname;
  const hitP = cache.match(req, { ignoreSearch: true });

  if (CODE_RE.test(path)) {
    /* 代码类网络优先，但慢网络绝不能返回空响应（脚本缺失会让界面组件全无）：
       2 秒内回 → 用网络；超时有缓存 → 先给缓存并后台补写；
       无缓存 → 一直等网络，只有网络真失败才 504。 */
    const netP = fetch(netRequest(req)).catch(() => null);
    const fast = await Promise.race([
      netP,
      new Promise((r) => setTimeout(() => r(null), 2000)),
    ]);
    if (fast && fast.ok && fast.type === 'basic') {
      cache.put(req, fast.clone()).catch(() => {});
      return fast;
    }
    const hit = await hitP;
    netP.then((res) => {
      if (res && res.ok && res.type === 'basic') cache.put(req, res.clone()).catch(() => {});
    }).catch(() => {});
    if (hit) return hit;
    const late = await netP;
    if (late && late.ok) {
      cache.put(req, late.clone()).catch(() => {});
      return late;
    }
    return new Response('', { status: 504, statusText: 'Offline' });
  }

  /* 图片 / 图标：缓存优先 + 后台悄悄更新 */
  const hit = await hitP;
  const network = fetch(netRequest(req)).then((res) => {
    if (res && res.ok && res.type === 'basic') {
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  }).catch(() => null);

  if (hit) {
    network.catch(() => {});
    return hit;
  }
  const res = await network;
  return res || new Response('', { status: 504, statusText: 'Offline' });
}

if (typeof self !== 'undefined') self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (_) { return; }

  /* 跨域（云端数据库 / 存储 / OTP）直连，不参与缓存 */
  if (url.origin !== self.location.origin) return;

  /* 存储对象路由（签名短链 /objects/s/… 与网关 /.cloud/storage/…）一律直连，
     不参与缓存、也绝不当页面导航处理。否则 SW 会把文件跳转当 navigate 拦截，
     跟随其跨域 302 拿到 opaque 响应后回退成「暂时打不开拾笺」离线页——这会让
     附件在手机端（WebAPK 或已注册本 PWA SW 的系统浏览器）永远下不了。放行后
     由浏览器原生跟随 302 把文件下载 / 预览。（sign 端点是 POST，上层 method
     过滤已跳过；这里再兜底 GET 也不拦。） */
  if (/^\/(?:objects\/|\.cloud\/storage\/)/.test(url.pathname)) return;

  /* 声明式下载：必须排在 navigate 之前处理，否则会被当成页面导航，跟随一个
     不存在的服务端路由 → 落进离线页，文件永远下不来。 */
  if (url.pathname.indexOf('/__sjdl/') === 0) {
    event.respondWith(handleDownload(req));
    return;
  }

  if (req.mode === 'navigate') {
    event.respondWith(handleNavigate(req));
    return;
  }
  /* 白名单之外一律直连：/.cloud/ 云端 API、/api/ 本地接口、将来新增的任何接口。
     绝不能让这些请求经过 netRequest 重建，鉴权头会全部丢失。 */
  if (!ASSET_PATHS.has(url.pathname)) return;
  event.respondWith(handleAsset(req));
});

if (typeof self !== 'undefined') self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
  /* 页面每次打开都把当前链接里的访问码同步过来，重新发布换码后不用手动清缓存 */
  if (event.data && event.data.type === 'sharecode') {
    const v = String(event.data.value || '');
    if (v && /^[A-Za-z0-9_-]{4,64}$/.test(v)) SC_VAL = v;
  }
});
