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
const VERSION = 'sj-2026-11-05-3';
const CACHE = 'shijian-' + VERSION;

const SC_KEY = 'sharecode';
const SC_VAL = 'FKSO3QK6B4';
const SC = '?' + SC_KEY + '=' + SC_VAL;

/* 首屏必需资源：安装时预缓存。每一项都必须带访问码，否则预缓存会静默失败。 */
const RAW_SHELL = [
  '/index.html',
  '/quick.html',
  '/manifest.webmanifest',
  '/quick.webmanifest',
  '/style.css',
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
  '/pdfexport.js',
  '/conflict.js',
  '/e2ee.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon-32.png',
  '/vendor/workbuddy-cloud-sdk.js',
  '/vendor/docx.umd.js',
  '/vendor/marked.min.js',
  '/vendor/purify.min.js',
  '/vendor/turndown.js',
  '/vendor/turndown-plugin-gfm.js',
  '/vendor/highlight.min.js',
  '/vendor/github-dark.min.css',
];
const SHELL = RAW_SHELL.map((p) => p + SC);
/* 只拦截这些静态资源；其余同源请求（尤其是 /.cloud/database/rest/*）一律直连。
   云端 API 的 GET 带 Authorization 和 x-wb-webapp-access-key，一旦被当作静态资源
   重建 Request 就会丢光鉴权头，还会被补上 sharecode（PostgREST 当成过滤器 → 400）。
   表现就是「从云端拉取失败：操作失败，请稍后再试」。 */
const ASSET_PATHS = new Set(RAW_SHELL);

const INDEX_KEY = '/index.html' + SC;

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
    await Promise.all(SHELL.map(async (url) => {
      try {
        const res = await fetch(new Request(url, { cache: 'reload', credentials: 'same-origin' }));
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
  const url = self.location.origin + '/?sharecode=' + SC_VAL;
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
        if (p === '/' || p === '/index.html') await cache.put(INDEX_KEY, res.clone());
      } catch (_) {}
      return res;
    }
    throw new Error('bad status');
  } catch (_) {
    const cached = (await cache.match(INDEX_KEY))
      || (await cache.match(req))
      || (await cache.match('/index.html'));
    return cached || offlinePage();
  }
}

/* 静态资源：先给缓存，后台悄悄更新；网络请求一律补访问码 */
async function handleAsset(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req, { ignoreSearch: false });
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

  if (req.mode === 'navigate') {
    event.respondWith(handleNavigate(req));
    return;
  }
  /* 白名单之外一律直连：/.cloud/ 云端 API、/api/ 本地接口、将来新增的任何接口。
     绝不能让这些请求经过 netRequest 重建，鉴权头会全部丢失。 */
  if (!ASSET_PATHS.has(url.pathname)) return;
  event.respondWith(handleAsset(req));
});

/* 让页面可以主动问「有新版本吗」 */
if (typeof self !== 'undefined') self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
  if (event.data === 'version' && event.source) {
    event.source.postMessage({ type: 'version', version: VERSION });
  }
});

/* 测试钩子：供 Node 单测复用，不影响浏览器运行 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VERSION, ASSET_PATHS, ensureSC, SC_VAL };
}
