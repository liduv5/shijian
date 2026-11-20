/* 拾笺 · 回归测试（纯 Node，无外部依赖）
   运行：node 拾笺云端/tests/run.js
   覆盖：① SW 版本/访问码白名单（防 v1.7.2 回归）；② 中文全文检索；
         ③ 同步冲突判定；④ 发布前静态校验（版本/旧码/语法/共享文件/VBS 编码）。
   来源：历史提交 a1882fe 的 tests/run.js，按当前 2026-11-20-105 基线重建。
   注意：版本号与访问码换版时必须同步改 BUILD / SC。 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const cp = require('child_process');
const crypto = require('crypto');

const CLOUD = path.join(__dirname, '..');
const DESKTOP = path.join(CLOUD, '..', '拾笺');
const BUILD = '2026-11-20-105';
const SC = 'X4WPKTHLIN';
const SHARED = ['export.js', 'sjplus.js', 'sjplus.css', 'backlinks.js', 'conflict.js', 'diffview.js', 'fts.js'];

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name); }
}
function files(dir, ext) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === 'vendor' || name === 'tests') continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) out.push(...files(p, ext));
    else if (!ext || name.endsWith(ext)) out.push(p);
  }
  return out;
}
function md5(file) {
  return crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex');
}

console.log('\n[1] Service Worker：版本与访问码白名单');
/* sw.js 是浏览器脚本，以 vm 方式在假 self 下加载，避免把浏览器全局搬进 Node。 */
const swSrc = fs.readFileSync(path.join(CLOUD, 'sw.js'), 'utf8');
const swCtx = {
  self: {
    location: { origin: 'https://x.test', href: 'https://x.test/sw.js?sharecode=' + SC },
    addEventListener: function () {},
  },
  URL: URL,
  console: console,
};
vm.createContext(swCtx);
vm.runInContext(swSrc + '\n;globalThis.__SJTEST__ = { VERSION, ASSET_PATHS, ensureSC };',
  swCtx, { filename: 'sw.js' });
const sw = swCtx.__SJTEST__;
ok('VERSION 为 sj-' + BUILD, sw.VERSION === 'sj-' + BUILD);
ok('静态资源在白名单内 (/app.js)', sw.ASSET_PATHS.has('/app.js'));
ok('本地接口 /api/ 不在白名单（不补码、不丢鉴权头）', !sw.ASSET_PATHS.has('/api/notes'));
ok('云端 API /.cloud/ 不在白名单', !sw.ASSET_PATHS.has('/.cloud/database/rest/v1'));
const u1 = sw.ensureSC('https://x.test/app.js');
ok('同源静态资源自动补 ?sharecode', u1.indexOf('sharecode=' + SC) >= 0);
const u2 = sw.ensureSC('https://x.test/app.js?sharecode=' + SC);
ok('已有访问码不重复添加', (u2.match(/sharecode=/g) || []).length === 1);
ok('跨域请求不补码', sw.ensureSC('https://other.com/app.js').indexOf('sharecode=') < 0);

console.log('\n[2] 全文检索（中文二元分词 + 相关度 + tag:）');
const fts = require(path.join(CLOUD, 'fts.js'));
const notes = [
  { id: 'a', title: '会议纪要', content: '今天讨论了产品路线图和上线计划', tags: ['工作'], updatedAt: 3 },
  { id: 'b', title: '读书笔记', content: '关于人生意义的思考', tags: ['随笔'], updatedAt: 2 },
  { id: 'c', title: '路线图', content: 'roadmap 与季度目标', tags: ['工作'], updatedAt: 1 },
];
const r1 = fts.rank('路线图', notes);
ok('命中「路线图」返回相关笔记', r1.length >= 1 && r1.indexOf('a') >= 0 && r1.indexOf('c') >= 0);
const r2 = fts.rank('tag:工作', notes);
ok('tag: 前缀按标签筛选', r2.length === 2 && r2.indexOf('b') < 0);
const tok = fts.tokenize('产品路线图');
ok('中文切出二元（产品/路线）', tok.indexOf('路线') >= 0 && tok.indexOf('产品') >= 0);
ok('纯文本剥离 HTML/Markdown', fts.plain('# 标题 **粗** [link](u)') === '标题 粗 link');
ok('生成搜索摘要', typeof fts.snippet('今天讨论了产品路线图和上线计划', ['路线图']) === 'string');

console.log('\n[3] 同步冲突判定（两端都改过且正文不同才算真冲突）');
function detectConflicts(localNotes, cloudNotes, lastSyncMs) {
  const map = new Map(localNotes.map((n) => [n.id, n]));
  const conflicts = [];
  const editedAfter = (n) => Number(n.updatedAt) > Number(lastSyncMs) + 1000;
  const sig = (n) => (n ? (n.content || '').slice(0, 240) : '');
  for (const c of cloudNotes) {
    const ex = map.get(c.id);
    if (!ex) continue;
    if (editedAfter(c) && editedAfter(ex) && sig(c) !== sig(ex)) conflicts.push({ id: c.id });
  }
  return conflicts;
}
const last = 1000;
ok('两端都改且内容不同 → 冲突', detectConflicts(
  [{ id: 'a', updatedAt: 5000, content: 'x' }],
  [{ id: 'a', updatedAt: 6000, content: 'y' }], last).length === 1);
ok('仅云端改过 → 非冲突（LWW）', detectConflicts(
  [{ id: 'a', updatedAt: 500, content: 'x' }],
  [{ id: 'a', updatedAt: 3000, content: 'y' }], last).length === 0);
ok('两端都改但内容相同 → 非冲突', detectConflicts(
  [{ id: 'a', updatedAt: 2000, content: 'same' }],
  [{ id: 'a', updatedAt: 3000, content: 'same' }], last).length === 0);
ok('云端新增 → 非冲突', detectConflicts(
  [{ id: 'a', updatedAt: 2000, content: 'x' }],
  [{ id: 'b', updatedAt: 3000, content: 'y' }], last).length === 0);

console.log('\n[4] 发布前静态校验');
const verFiles = ['app.js', 'dl.html', 'index.html', 'mobilesync.js', 'pwa.js', 'quick.html', 'sw.js'];
for (const f of verFiles) {
  const s = fs.readFileSync(path.join(CLOUD, f), 'utf8');
  ok(f + ' 版本为 ' + BUILD, s.indexOf(f === 'sw.js' ? 'sj-' + BUILD : BUILD) >= 0);
}
const stale = files(CLOUD).filter((f) => !/\.(png|ico|woff2?|json)$/i.test(f))
  .filter((f) => /SSYXUMSNMI|2120533470581252096/.test(fs.readFileSync(f, 'utf8')));
ok('云端旧链接/旧码零残留', stale.length === 0);
let manifestOk = true;
try { JSON.parse(fs.readFileSync(path.join(CLOUD, 'manifest.webmanifest'), 'utf8')); }
catch (_) { manifestOk = false; }
ok('manifest.webmanifest 是合法 JSON', manifestOk);
let syntaxOk = true, syntaxBad = '';
for (const dir of [CLOUD, path.join(DESKTOP, 'public')]) {
  for (const f of files(dir, '.js')) {
    try { cp.execFileSync(process.execPath, ['--check', f], { stdio: 'ignore' }); }
    catch (_) { syntaxOk = false; syntaxBad = f; }
  }
}
try { cp.execFileSync(process.execPath, ['--check', path.join(DESKTOP, 'server.js')], { stdio: 'ignore' }); }
catch (_) { syntaxOk = false; syntaxBad = 'server.js'; }
ok('两端所有 JS 通过 node --check' + (syntaxBad ? '（失败：' + syntaxBad + '）' : ''), syntaxOk);
for (const f of SHARED) {
  const a = path.join(DESKTOP, 'public', f);
  const b = path.join(CLOUD, f);
  ok('共享文件一致：' + f, fs.existsSync(a) && fs.existsSync(b) && md5(a) === md5(b));
}
/* WSH 按系统 ANSI 解析无 BOM 的 .vbs；UTF-8 中文全角冒号后的引号会被吞掉，
   报 800A0409「未结束的字符串常量」。脚本必须是纯 ASCII 或 UTF-16 LE BOM。 */
const vbsFiles = files(DESKTOP, '.vbs');
ok('桌面端 .vbs 编码兼容 WSH（纯 ASCII 或 UTF-16 LE BOM）', vbsFiles.length > 0 && vbsFiles.every((f) => {
  const b = fs.readFileSync(f);
  if (b[0] === 0xff && b[1] === 0xfe) return true;
  if (b[0] === 0xfe && b[1] === 0xff) return false;
  return b.every((x) => x < 0x80);
}));
const vbsBuf = fs.readFileSync(path.join(DESKTOP, '启动.vbs'));
const vbsText = (vbsBuf[0] === 0xff && vbsBuf[1] === 0xfe)
  ? vbsBuf.slice(2).toString('utf16le') : vbsBuf.toString('utf8');
const iClear = vbsText.indexOf('Err.Clear');
const iRun = vbsText.indexOf('WshShell.Run runLine');
ok('启动.vbs 在 WshShell.Run 前清空 Err（避免空错误描述误报）', iClear >= 0 && iRun >= 0 && iClear < iRun);

const appSrc = fs.readFileSync(path.join(CLOUD, 'app.js'), 'utf8');
const quickSrc = fs.readFileSync(path.join(CLOUD, 'quick.html'), 'utf8');
ok('随手记/拾笺无自动弹回标记（防双 PWA 串页）',
  quickSrc.indexOf("setItem('sj_quick_return'") < 0 &&
  appSrc.indexOf("getItem('sj_quick_return'") < 0 &&
  appSrc.indexOf("location.replace(quickUrl('desk'))") < 0);
ok('两个 PWA 互开独立窗口（随手记不被主程序接管）',
  quickSrc.indexOf("window.open(url, 'sj_main'") >= 0 &&
  appSrc.indexOf("window.open(url, 'sj_quick'") >= 0);

console.log('\n结果：' + pass + ' 通过，' + fail + ' 失败');
process.exit(fail ? 1 : 0);
