/* 拾笺 · 回归测试（纯 Node，无外部依赖）
   运行：node 拾笺云端/tests/run.js
   覆盖：① SW 版本/访问码白名单（防 v1.7.2 回归）；② 中文全文检索；
         ③ 同步冲突判定；④ 发布前静态校验（版本/旧码/语法/共享文件/VBS 编码）。
   来源：历史提交 a1882fe 的 tests/run.js，按当前 2026-11-20-114 基线重建。
   注意：版本号与访问码换版时必须同步改 BUILD / SC。 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const cp = require('child_process');
const crypto = require('crypto');

const CLOUD = path.join(__dirname, '..');
const DESKTOP = path.join(CLOUD, '..', '拾笺');
const BUILD = '2026-11-20-114';
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
ok('华为桌面兼容：随手记打开拾笺走同窗口导航（无 window.open 新窗口）',
  quickSrc.indexOf('location.assign(url)') >= 0 &&
  appSrc.indexOf("location.href = quickUrl('app')") >= 0 &&
  quickSrc.indexOf("window.open(url, 'sj_main'") < 0 &&
  appSrc.indexOf("window.open(url, 'sj_quick'") < 0);

/* 华为风手机首页：DOM / 逻辑 / CSS 三处齐全，且入口不丢 */
const indexSrc = fs.readFileSync(path.join(CLOUD, 'index.html'), 'utf8');
const styleSrc = fs.readFileSync(path.join(CLOUD, 'style.css'), 'utf8');
for (const id of ['sjHomeHead', 'sjCatTitle', 'sjHomeSearch', 'sjCatSheet', 'sjFab', 'sjTabbar', 'sjTabNotes', 'sjTabQuick', 'sjDetailBar']) {
  ok('首页 DOM 节点存在：#' + id, indexSrc.indexOf('id="' + id + '"') >= 0);
}
ok('随手记页有底部「笔记」tab 且绑定 goMain（q 参数不丢）',
  quickSrc.indexOf('id="qTabNotes"') >= 0 && quickSrc.indexOf("bindGo('qTabNotes')") >= 0);
ok('底部「笔记」tab 走 closeEditor（保留 saveNow 落盘钩子）',
  appSrc.indexOf("if (currentNote()) closeEditor();") >= 0);
ok('分类面板复用现有伪节点 all/uncat/starred',
  appSrc.indexOf("catRow('all'") >= 0 && appSrc.indexOf("catRow('uncat'") >= 0 && appSrc.indexOf("catRow('starred'") >= 0);
ok('首页搜索与侧栏搜索共享 state.search',
  appSrc.indexOf('state.search = e.target.value;') >= 0);
ok('桌面端默认隐藏新增 UI（只在 ≤980px 放开）',
  /\.sj-home-head, \.sj-fab, \.sj-tabbar, \.sj-detail-bar,[\s\S]{0,100}\.sj-cat-mgr, \.sj-manage-menu, \.sj-more-btn, \.sj-more-menu,[\s\S]{0,60}\.sj-cat-editor \{ display: none; \}/.test(styleSrc) &&
  styleSrc.indexOf('@media (max-width: 980px)') >= 0);
ok('手机端顶栏收起、--m-bar-total 归零（顶端无菜单）',
  /@media \(max-width: 980px\)[\s\S]{0,400}\.m-bar \{ display: none !important; \}/.test(styleSrc) &&
  styleSrc.indexOf('--m-bar-total: 0px') >= 0);
ok('右上角四点菜单按钮与面板存在、面板在 body 直属',
  indexSrc.indexOf('id="sjMoreBtn"') > indexSrc.indexOf('</main>') &&
  indexSrc.indexOf('id="sjMoreMenu"') > indexSrc.indexOf('</main>') &&
  appSrc.indexOf("act === 'tree'") >= 0 && appSrc.indexOf("act === 'batch'") >= 0 &&
  appSrc.indexOf("act === 'sync'") >= 0 && appSrc.indexOf("act === 'theme'") >= 0);
ok('详情页底栏有返回出口（顶栏收起后唯一返回）',
  indexSrc.indexOf('data-act="back"') >= 0 &&
  appSrc.indexOf("b.dataset.act === 'back'") >= 0 &&
  appSrc.indexOf("closeEditor(); return;") >= 0);
ok('新 UI 颜色全部走 CSS 变量（双主题）',
  !/sj-(?:home-head|tabbar|detail-bar|cat-sheet)[^{]*\{[^}]*#(?:fff|f4f3ef|22201c)/.test(styleSrc));
/* 分类面板必须在 .app 外、body 直属：否则手机端会被 z-index:67 的动态遮罩盖住，
   展开后只剩灰蒙蒙一层（2026-11-20 反馈）。用「面板声明出现在 </main> 之后」判定。 */
ok('分类面板在 .app 外（body 直属），不被动态遮罩盖住',
  indexSrc.indexOf('id="sjCatSheet"') > indexSrc.indexOf('</main>') &&
  indexSrc.indexOf('id="sjCatSheet"') > indexSrc.indexOf('id="sjTabbar"'));

/* 分类管理页：从分类面板「管理」进入，按华为备忘录「编辑」页还原。 */
for (const id of ['sjCatMgr', 'sjCatMgrBack', 'sjCatMgrBody']) {
  ok('分类管理页 DOM 节点存在：#' + id, indexSrc.indexOf('id="' + id + '"') >= 0);
}
ok('分类面板「管理」最终进入全屏编辑页（不再打开桌面目录抽屉）',
  appSrc.indexOf("a === 'manage'") >= 0 &&
  appSrc.indexOf('openCatManager();') >= 0 &&
  !/a === 'manage'[\s\S]{0,200}openDrawer\('tree'\)/.test(appSrc));
ok('管理页复用分类新建/改名/删除与变更事件',
  appSrc.indexOf('askCreateCategory(') >= 0 &&
  appSrc.indexOf('renameCategory(cat)') >= 0 &&
  appSrc.indexOf('deleteCategory(cat)') >= 0 &&
  appSrc.indexOf("'sj-categories-changed'") >= 0);
ok('管理页支持拖动排序并回写 category.order',
  appSrc.indexOf('function saveCatOrder(parent)') >= 0 &&
  appSrc.indexOf('body: { order: i }') >= 0 &&
  appSrc.indexOf('pointermove') >= 0);
ok('分类管理页样式仅窄屏放开，桌面默认隐藏',
  /\.sj-cat-mgr, \.sj-manage-menu, \.sj-more-btn, \.sj-more-menu,[\s\S]{0,60}\.sj-cat-editor \{ display: none; \}/.test(styleSrc) &&
  styleSrc.indexOf('.sj-cat-mgr {') >= 0 &&
  styleSrc.indexOf('.sj-mgr-card') >= 0 &&
  styleSrc.indexOf('body.sj-cat-mgr-open .pwd-tip') >= 0);
ok('分类面板按截图分卡排列、子分类缩进、带展开箭头',
  appSrc.indexOf('ICON_FOLDER') >= 0 &&
  appSrc.indexOf('sj-cat-chip') >= 0 &&
  appSrc.indexOf('sj-cat-card') >= 0 &&
  appSrc.indexOf('sj-cat-toggle') >= 0 &&
  appSrc.indexOf('24 + depth * 20') >= 0);
ok('分类管理页 DOM 节点存在：#sjManageMenu', indexSrc.indexOf('id="sjManageMenu"') >= 0);
ok('点「管理」先弹「新建文件夹 / 编辑」两步菜单（不直接进编辑页）',
  appSrc.indexOf('showManageMenu(r.right - 180, r.bottom + 6)') >= 0 &&
  indexSrc.indexOf('data-act="new-root"') >= 0 &&
  indexSrc.indexOf('data-act="edit"') >= 0 &&
  !/act\.dataset\.act === 'manage'[\s\S]{0,160}openCatManager\(\)/.test(appSrc));
ok('两步菜单样式按截图：白卡圆角、两行、点按反馈',
  styleSrc.indexOf('.sj-manage-menu {') >= 0 &&
  styleSrc.indexOf('.sj-manage-menu.hidden') >= 0 &&
  styleSrc.indexOf('min-height: 48px') >= 0 &&
  styleSrc.indexOf('.sj-manage-menu button + button') >= 0);

/* 华为备忘录配色：只在窄屏媒体查询里覆盖变量，桌面端米色+墨绿主题不动 */
ok('华为配色仅在 ≤980px 覆盖，桌面端主题不受影响',
  /@media \(max-width: 980px\)[\s\S]{0,300}html\[data-theme="light"\] \{[\s\S]{0,400}--accent: #0a59f7;/.test(styleSrc) &&
  styleSrc.indexOf('--bg: #f5f5f7') >= 0 &&
  styleSrc.indexOf('--surface: #ffffff') >= 0);
ok('深色主题手机端主色同步为亮蓝',
  /html\[data-theme="dark"\] \{\s*--accent: #4d8fff;/.test(styleSrc));
ok('标题小三角随正文色、选中分类篇数变蓝',
  /\.sj-home-title \.sj-caret \{[\s\S]{0,120}color: var\(--text\);/.test(styleSrc) &&
  styleSrc.indexOf('.sj-cat-row.on .sj-cat-n { color: var(--accent); }') >= 0);

/* 编辑笔记本底部弹窗：点分类管理页右侧双横杠弹出，可选色/改名/删除 */
const serverSrc = fs.readFileSync(path.join(DESKTOP, 'server.js'), 'utf8');
const localSrc = fs.readFileSync(path.join(CLOUD, 'local.js'), 'utf8');
for (const id of ['sjCatEditor', 'sjEditorSwatches', 'sjEditorName', 'sjEditorChip', 'sjEditorSave', 'sjEditorDel']) {
  ok('编辑笔记本弹窗 DOM 节点存在：#' + id, indexSrc.indexOf('id="' + id + '"') >= 0);
}
ok('点子分类双横杠打开编辑弹窗（不再弹右键操作菜单）',
  appSrc.indexOf('function openCatActions(id, grip)') >= 0 &&
  /function openCatActions\(id, grip\) \{\s*openCatEditor\(id\);\s*\}/.test(appSrc) &&
  appSrc.indexOf('function openCatEditor(id)') >= 0);
ok('编辑弹窗保存走 PATCH 写 name+color 并刷新分类',
  /body: \{ name, color: edColor \}/.test(appSrc) &&
  appSrc.indexOf('Object.assign(edCat, updated)') >= 0 &&
  appSrc.indexOf("new Event('sj-categories-changed')") >= 0);
ok('编辑弹窗删除复用 deleteCategory、取消关闭弹窗',
  appSrc.indexOf('deleteCategory(cat);') >= 0 &&
  appSrc.indexOf('function closeCatEditor()') >= 0 &&
  indexSrc.indexOf('data-act="editor-close"') >= 0);
ok('8 色板定义齐全，老分类回退黄/青/绿/红不跳色',
  appSrc.indexOf('const CAT_PALETTE = [') >= 0 &&
  (appSrc.match(/'#[0-9a-f]{6}'/g) || []).length >= 8 &&
  /return \[2, 4, 3, 0\]\[Math\.max\(0, i\) % 4\];/.test(appSrc));
ok('后端两个分类 PATCH 都保存 color 字段（含 null 清除）',
  appSrc.indexOf('color: edColor') >= 0 &&
  /body\.color === null\) delete cat\.color;/.test(localSrc) &&
  /Number\.isInteger\(body\.color\)/.test(serverSrc) &&
  localSrc.indexOf('c.color } : {}') >= 0 &&
  serverSrc.indexOf('c.color } : {}') >= 0);
ok('编辑弹窗样式仅窄屏放开、桌面默认隐藏',
  /\.sj-cat-editor \{ display: none; \}/.test(styleSrc) &&
  styleSrc.indexOf('.sj-editor-sheet') >= 0 &&
  styleSrc.indexOf('.sj-editor-swatch.on::after') >= 0);

console.log('\n结果：' + pass + ' 通过，' + fail + ' 失败');
process.exit(fail ? 1 : 0);
