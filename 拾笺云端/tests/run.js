/* 拾笺 · 回归测试（纯 Node，无外部依赖）
   运行：node 拾笺云端/tests/run.js
   覆盖：① SW 版本/访问码白名单（防 v1.7.2 回归）；② 中文全文检索；
         ③ 同步冲突判定；④ 发布前静态校验（版本/旧码/语法/共享文件/VBS 编码）。
   来源：历史提交 a1882fe 的 tests/run.js，按当前 2026-11-21-139 基线重建。
   注意：版本号与访问码换版时必须同步改 BUILD / SC。 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const cp = require('child_process');
const crypto = require('crypto');

const CLOUD = path.join(__dirname, '..');
const DESKTOP = path.join(CLOUD, '..', '拾笺');
const BUILD = '2026-11-21-139';
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
  /\.sj-home-head, \.sj-fab, \.sj-tabbar, \.sj-detail-bar,[\s\S]{0,100}\.sj-cat-mgr, \.sj-manage-menu, \.sj-more-btn, \.sj-more-menu,[\s\S]{0,60}\.sj-cat-editor, \.sj-note-head, \.sj-edit-bar, \.sj-meta-cat \{ display: none; \}/.test(styleSrc) &&
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
ok('管理页点分类名不进编辑，只点横杠进弹窗（图一交互）',
  appSrc.indexOf('<span class="sj-mgr-main">') >= 0 &&
  appSrc.indexOf('data-act="mgr-rename"') < 0 &&
  !/else if \(a === 'mgr-rename'\)/.test(appSrc) &&
  appSrc.indexOf('点击编辑类别，拖动排序') >= 0);
ok('管理页支持拖动排序并回写 category.order',
  appSrc.indexOf('function saveCatOrder(parent)') >= 0 &&
  appSrc.indexOf('body: { order: i }') >= 0 &&
  appSrc.indexOf('pointermove') >= 0);
ok('分类管理页样式仅窄屏放开，桌面默认隐藏',
  /\.sj-cat-mgr, \.sj-manage-menu, \.sj-more-btn, \.sj-more-menu,[\s\S]{0,60}\.sj-cat-editor, \.sj-note-head, \.sj-edit-bar, \.sj-meta-cat \{ display: none; \}/.test(styleSrc) &&
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
  /\.sj-cat-editor, \.sj-note-head, \.sj-edit-bar, \.sj-meta-cat \{ display: none; \}/.test(styleSrc) &&
  styleSrc.indexOf('.sj-editor-sheet') >= 0 &&
  styleSrc.indexOf('.sj-editor-swatch.on::after') >= 0);
ok('编辑弹窗字体与布局按华为图二：标题 22px 粗、输入 17px、取消保存平分带竖线',
  /\.sj-editor-head h3 \{[\s\S]{0,120}font-size: 22px; font-weight: 700;/.test(styleSrc) &&
  /\.sj-editor-field input \{[\s\S]{0,180}font-size: 17px;/.test(styleSrc) &&
  /\.sj-editor-actions button \+ button \{\s*border-left: 1px solid var\(--border\);/.test(styleSrc) &&
  /\.sj-editor-actions button \{\s*flex: 1;/.test(styleSrc));
ok('横杠点击直达编辑弹窗：由 click 处理、拖拽不再吞点击',
  appSrc.indexOf("if (a === 'mgr-grip') { openCatEditor(act.dataset.id); return; }") >= 0 &&
  appSrc.indexOf('catDragJustMoved = true;') >= 0 &&
  !/if \(!d\.moved\) \{ openCatActions\(/.test(appSrc) &&
  !/if \(a === 'mgr-grip'\) return;/.test(appSrc));
ok('横杠拖拽改为超阈值后再接管指针，轻微滑动不会误判',
  /Math\.hypot\(e\.clientX - catDrag\.x, e\.clientY - catDrag\.y\) < 10/.test(appSrc) &&
  /catDrag\.grip\.setPointerCapture\(e\.pointerId\)/.test(appSrc) &&
  !/e\.preventDefault\(\);\s*try \{ grip\.setPointerCapture/.test(appSrc));
ok('管理页完全按图一：系统字体、标题22px、名称17/18px、行高62、圆角20、无折叠箭头',
  styleSrc.indexOf('--mgr-font: -apple-system') >= 0 &&
  /\.sj-mgr-head h2 \{[\s\S]{0,140}font-size: 22px; font-weight: 700;/.test(styleSrc) &&
  styleSrc.indexOf('.sj-mgr-root .sj-mgr-name { font-size: 18px; font-weight: 500; }') >= 0 &&
  /\.sj-mgr-name \{[\s\S]{0,160}font-size: 17px;/.test(styleSrc) &&
  /\.sj-mgr-row \{[\s\S]{0,140}min-height: 62px/.test(styleSrc) &&
  /\.sj-mgr-card \{[\s\S]{0,140}border-radius: 20px/.test(styleSrc) &&
  appSrc.indexOf("class=\"sj-mgr-caret") < 0);
ok('新建按钮只对文字有效：inline-block 且左对齐到子分类名称，不再整行热区',
  /\.sj-mgr-new \{\s*display: inline-block; width: auto;/.test(styleSrc) &&
  /\.sj-mgr-new \{[\s\S]{0,220}margin-left: 72px/.test(styleSrc) &&
  styleSrc.indexOf('.sj-mgr-new-card .sj-mgr-new { margin-left: 0; }') >= 0 &&
  !/\.sj-mgr-new \{\s*display: block; width: 100%/.test(styleSrc));

/* ---- 合并同名分类（2026-11-21-121）---- */
ok('按「同一父级 + 同名」分组识别重复分类（不误并不同父级同名）',
  appSrc.indexOf('function dupGroups(cats)') >= 0 &&
  appSrc.indexOf('c.parentId || null, String(c.name || \'\').trim().toLocaleLowerCase()') >= 0 &&
  appSrc.indexOf('.filter((g) => g.length > 1)') >= 0);
ok('合并保留内容最多的一份：按子树笔记数与后代分类数打分',
  appSrc.indexOf('function mergeScore(cat, cats, notes)') >= 0 &&
  appSrc.indexOf('notes.filter((n) => ids.has(n.categoryId)).length') >= 0 &&
  /mergeScore\(b, cats, notes\) - mergeScore\(a, cats, notes\)/.test(appSrc));
ok('合并迁移笔记与子分类，笔记改 categoryId 并顶新 updatedAt 以便同步',
  /if \(dropIds\.has\(n\.categoryId\)\) \{ n\.categoryId = keep\.id; n\.updatedAt = Date\.now\(\); movedNotes \+= 1; \}/.test(appSrc) &&
  /if \(dropIds\.has\(c\.parentId\)\) c\.parentId = keep\.id;/.test(appSrc));
ok('合并迭代多轮，处理子分类上移后新产生的同级同名',
  /for \(let pass = 0; pass < 20; pass \+= 1\)/.test(appSrc) &&
  /const gs = dupGroups\(cats\);[\s\S]{0,80}if \(!gs\.length\) break;/.test(appSrc));
ok('合并前整库快照到 localStorage，失败即中止；落库用 setState 一次替换',
  appSrc.indexOf("const MERGE_UNDO_KEY = 'sj_merge_undo_v1'") >= 0 &&
  /localStorage\.setItem\(MERGE_UNDO_KEY, JSON\.stringify\(\{ at: Date\.now\(\), snap \}\)\)/.test(appSrc) &&
  /window\.SJLocal\.setState\(\{ categories: result\.categories, notes: result\.notes, versions: result\.versions \}\)/.test(appSrc));
ok('撤销合并恢复整库快照并清标记，合并后提示去同步',
  appSrc.indexOf('async function undoMergeDups()') >= 0 &&
  /window\.SJLocal\.setState\(backup\.snap\)/.test(appSrc) &&
  /localStorage\.removeItem\(MERGE_UNDO_KEY\)/.test(appSrc) &&
  appSrc.indexOf('合并后请到「设置 → 同步」上传一次') >= 0);
ok('管理页提供合并入口与撤销入口，预览列出每组合并计划',
  appSrc.indexOf('data-act="mgr-merge-dups"') >= 0 &&
  appSrc.indexOf('data-act="mgr-undo-merge"') >= 0 &&
  appSrc.indexOf('function previewMergeDups()') >= 0 &&
  appSrc.indexOf('class="sj-merge-list"') >= 0);
ok('合并相关样式仅窄屏、未在桌面放开（依托 .sj-cat-mgr 隐藏）',
  styleSrc.indexOf('.sj-mgr-fix-card {') >= 0 &&
  styleSrc.indexOf('.sj-merge-list {') >= 0 &&
  styleSrc.indexOf('.sj-merge-row b {') >= 0);

ok('详情页抬高主区给固定底栏让位，附件面板不再被遮挡',
  /body\.sj-note-open \.app \{[\s\S]{0,140}bottom: calc\(56px \+ env\(safe-area-inset-bottom, 0px\)\);/.test(styleSrc) &&
  styleSrc.indexOf('.attach-panel {') >= 0 &&
  styleSrc.indexOf('position: fixed; z-index: 61;') >= 0);

ok('分类面板按华为截图做整页展开：页头带▲、浅灰底不压暗、tab 浮在面板上',
  appSrc.indexOf('function catHero()') >= 0 &&
  appSrc.indexOf('class="sj-caret">▲') >= 0 &&
  appSrc.indexOf("document.body.classList.add('sj-cat-open')") >= 0 &&
  appSrc.indexOf("document.body.classList.remove('sj-cat-open')") >= 0 &&
  /body\.sj-cat-open \.sj-cat-mask \{[\s\S]{0,80}background: var\(--bg\)/.test(styleSrc) &&
  /body\.sj-cat-open \.sj-tabbar \{ z-index: 70; \}/.test(styleSrc) &&
  styleSrc.indexOf('body.sj-cat-open .sj-more-btn,') >= 0);

ok('分类面板字号/行高/图标/系统字体按截图放大，分隔线从各行文字(--dl)起',
  /\.sj-cat-hero \.sj-home-title \{[\s\S]{0,220}font-size: 26px; font-weight: 700/.test(styleSrc) &&
  /\.sj-cat-row \{[\s\S]{0,320}min-height: 62px; padding: 0 2px;/.test(styleSrc) &&
  /\.sj-cat-row \{[\s\S]{0,320}font-family: var\(--mgr-font, var\(--font-ui\)\); font-size: 17px/.test(styleSrc) &&
  /\.sj-cat-row \.ico \{ width: 23px; height: 23px/.test(styleSrc) &&
  styleSrc.indexOf('.sj-cat-sheet {\n    position: fixed; z-index: 68;') >= 0 &&
  styleSrc.indexOf('--mgr-font: -apple-system, BlinkMacSystemFont, "HarmonyOS Sans SC"') >= 0 &&
  styleSrc.indexOf('left: var(--dl, 52px); right: 18px; top: 0;') >= 0 &&
  appSrc.indexOf('--dl:${dl}px') >= 0 &&
  appSrc.indexOf("data-act=\"cat-close\"") >= 0);

ok('展开后标题行与首页完全一致：同字体/同字号/同字重/同间距/同缩进，只换三角方向',
  // 首页基准：18px 左 + 18px+safe 顶，26px/700，gap 7，条数 12px
  /\.sj-home-title \{[\s\S]{0,200}font-size: 26px; font-weight: 700;/.test(styleSrc) &&
  styleSrc.indexOf('.sj-home-head { padding-top: calc(18px + env(safe-area-inset-top, 0px)); }') >= 0 &&
  // 展开态：容器 padding 与首页同值（面板自带 16px 横向留白，2px 补足 18px 左缩进）
  /\.sj-cat-hero \{\s*padding: calc\(18px \+ env\(safe-area-inset-top, 0px\)\) 2px 12px;/.test(styleSrc) &&
  /\.sj-cat-hero \.sj-home-title \{[\s\S]{0,200}gap: 7px;[\s\S]{0,140}font-family: var\(--font-ui\);[\s\S]{0,80}font-size: 26px; font-weight: 700; line-height: 1\.3;/.test(styleSrc) &&
  /\.sj-cat-hero \.sj-home-title \.sj-caret \{[^}]*font-size: 14px; font-weight: 500/.test(styleSrc) &&
  /\.sj-cat-hero \.sj-home-count \{\s*margin: 3px 0 14px;[\s\S]{0,90}font-size: 12px/.test(styleSrc) &&
  // 文字直接取首页节点，避免两处口径不一
  appSrc.indexOf("const nameEl = $('#sjCatTitleText'), cntEl = $('#sjHomeCount');") >= 0 &&
  appSrc.indexOf('<span>${escapeHtml(name)}</span><span class="sj-caret">▲</span></button>') >= 0 &&
  !/\.sj-cat-hero \.sj-home-title \{[\s\S]{0,200}font-size: 30px/.test(styleSrc));

ok('手机详情页有阅读/编辑两态的结构：返回头部、分类胶囊、编辑工具条',
  indexSrc.indexOf('id="sjNoteHead"') >= 0 &&
  indexSrc.indexOf('sj-nh-acts') >= 0 &&
  indexSrc.indexOf('data-act="nh-done"') >= 0 &&
  indexSrc.indexOf('data-act="nh-undo"') >= 0 &&
  indexSrc.indexOf('id="sjMetaCat"') >= 0 &&
  indexSrc.indexOf('id="sjEditBar"') >= 0 &&
  indexSrc.indexOf('data-act="fmt"') >= 0);

ok('打开笔记默认阅读态、点正文才进编辑态（draft 直接进编辑）',
  appSrc.indexOf('function setNoteMode(mode, point') >= 0 &&
  appSrc.indexOf("document.body.classList.toggle('sj-note-edit', edit)") >= 0 &&
  appSrc.indexOf("setNoteMode(note === draftNote || id === String(DRAFT_ID) ? 'edit' : 'read'") >= 0 &&
  appSrc.indexOf('caretRangeFromPoint') >= 0 &&
  /BODY_BOX\.addEventListener\('click'[\s\S]{0,2000}setNoteMode\('edit'/.test(appSrc) &&
  appSrc.indexOf("if (a === 'nh-done') { setNoteMode('read'); return; }") >= 0);

ok('手机端不再有 Markdown / 富文本切换，标题与返回箭头同一行、大字正文按截图',
  styleSrc.indexOf('#formatSwitch { display: none; }') >= 0 &&
  appSrc.indexOf("format: NARROW() ? 'rich' : 'md'") >= 0 &&
  // 阅读态标题不再单独占一大行：搬进顶栏和返回箭头同行（20px/700 单行省略）
  /body\.sj-note-open:not\(\.sj-note-edit\) \.sj-note-head \.title-input \{[\s\S]{0,120}font-size: 20px; font-weight: 700/.test(styleSrc) &&
  /body\.sj-note-open:not\(\.sj-note-edit\) \.editor-head \{ display: none; \}/.test(styleSrc) &&
  !/body\.sj-note-open:not\(\.sj-note-edit\) \.title-input \{[\s\S]{0,140}font-size: 27px/.test(styleSrc) &&
  /body\.sj-note-open:not\(\.sj-note-edit\) \.rich-pane,[\s\S]{0,120}font-size: 19px; line-height: 1\.78/.test(styleSrc) &&
  /body\.sj-note-open:not\(\.sj-note-edit\) \.sj-detail-bar button\[data-act="back"\] \{ display: none; \}/.test(styleSrc) &&
  styleSrc.indexOf('.sj-meta-cat {') >= 0);

ok('标题下面只留一份分类且可点：分类胶囊可点换类、右边不再重复一颗',
  indexSrc.indexOf('id="sjMetaDate"') >= 0 &&
  indexSrc.indexOf('<button type="button" class="sj-meta-cat hidden" id="sjMetaCat"') >= 0 &&
  appSrc.indexOf('META_CAT.addEventListener') >= 0 &&
  appSrc.indexOf('openCategoryPicker(note)') >= 0 &&
  appSrc.indexOf("d.textContent = note ? '创建于 ' + fmtDate(note.createdAt) : ''") >= 0 &&
  /#metaInfo \{ display: none; \}/.test(styleSrc) &&
  /\.sj-meta-cat::after \{ content: '▾'/.test(styleSrc) &&
  appSrc.indexOf("window.addEventListener('sj-categories-changed', () => { refreshNoteMetaLine(); })") >= 0);

ok('写正文时图片保持图片：手机端进编辑先转富文本，不再露出 data URI 长串',
  appSrc.indexOf('function toRichEditor()') >= 0 &&
  /function toRichEditor\(\)[\s\S]{0,420}renderMarkdown/.test(appSrc) &&
  /setNoteMode[\s\S]{0,700}toRichEditor\(\);/.test(appSrc) &&
  appSrc.indexOf('if (NARROW()) return;') >= 0 &&
  indexSrc.indexOf('id="sjImgBar"') >= 0 &&
  appSrc.indexOf('function selectImg(img)') >= 0 &&
  appSrc.indexOf('function moveImg(dir)') >= 0 &&
  appSrc.indexOf('function deleteImg()') >= 0 &&
  /#richPane img\.sj-img-sel \{ outline: 2px solid var\(--accent\)/.test(styleSrc) &&
  /\.sj-img-bar \{[\s\S]{0,180}position: fixed; z-index: 63/.test(styleSrc));

ok('编辑态：紧凑头部、隐藏四宫格底栏、露出编辑工具条',
  /body\.sj-note-edit \.editor-head \{ display: none; \}/.test(styleSrc) &&
  /body\.sj-note-edit \.sj-detail-bar \{ display: none !important; \}/.test(styleSrc) &&
  /body\.sj-note-edit \.sj-edit-bar:not\(\.hidden\) \{ display: flex; \}/.test(styleSrc) &&
  // 手机端不再借桌面那条窄工具条：A 按钮改成弹底部「样式」面板
  !/body\.sj-note-edit\.sj-note-fmt \.toolbar \{ display: flex; \}/.test(styleSrc) &&
  /body\.sj-note-edit \.sj-note-head \.title-input \{[\s\S]{0,220}font-size: 17px; font-weight: 600/.test(styleSrc) &&
  appSrc.indexOf('function mountTitle()') >= 0 &&
  appSrc.indexOf('NOTE_HEAD.insertBefore(ti, NOTE_ACTIONS)') >= 0);

ok('点底栏 A 按钮弹出「样式」面板：B/I/U、三种对齐、增减缩进、四种列表、字号滑杆',
  indexSrc.indexOf('id="sjStyleSheet"') >= 0 &&
  indexSrc.indexOf('class="sj-ss-title">样式<') >= 0 &&
  // 三种对齐 + 增减缩进 + 四种列表，一个都不能少
  ['al-left', 'al-center', 'al-right', 'outdent', 'indent',
    'list-num', 'list-alpha', 'list-ul', 'list-task', 'bold', 'italic', 'underline']
    .every((a) => indexSrc.indexOf('data-act="' + a + '"') >= 0) &&
  indexSrc.indexOf('id="sjStyleSize"') >= 0 &&
  // styleWithCSS=true 才不会被 DOMPurify 抹掉：对齐落 style、颜色落 span
  /function cssCmd\(cmd, val\)[\s\S]{0,320}styleWithCSS', false, true/.test(appSrc) &&
  appSrc.indexOf("if (styleSheetOpen()) closeStyleSheet();") >= 0 &&
  /a === 'fmt'[\s\S]{0,700}openStyleSheet\(\);/.test(appSrc) &&
  appSrc.indexOf('function styleList(kind)') >= 0 &&
  appSrc.indexOf("node.style.listStyleType = kind === 'list-alpha' ? 'lower-alpha' : ''") >= 0 &&
  appSrc.indexOf("if (kind === 'list-task') node.classList.add('sj-task')") >= 0 &&
  // 点方框打勾
  /ul\.sj-task > li[\s\S]{0,220}classList\.toggle\('done'\)/.test(appSrc));

ok('「样式」面板的颜色与纸张：7 颗色点、5 张纸、纸张记在本机',
  indexSrc.indexOf('data-color="#d13b32"') >= 0 &&
  indexSrc.indexOf('data-color="default"') >= 0 &&
  (indexSrc.match(/class="sj-ss-dot/g) || []).length >= 7 &&
  (indexSrc.match(/class="sj-ss-paper/g) || []).length >= 5 &&
  appSrc.indexOf("const PAPER_KEY = 'sj_paper_v1';") >= 0 &&
  /function applyPaper\(idx\)[\s\S]{0,220}document\.body\.dataset\.paper = v/.test(appSrc) &&
  /html\[data-theme="light"\] body\.sj-note-open\[data-paper="2"\] \.editor-pane \{ background: #e9e1cd; \}/.test(styleSrc) &&
  /\.sj-ss-range \{[\s\S]{0,260}appearance: none/.test(styleSrc) &&
  /\.sj-style-sheet \{[\s\S]{0,220}position: fixed; z-index: 92/.test(styleSrc));

ok('输入法：格式操作静默聚焦不弹键盘，点正文才唤起输入法',
  appSrc.indexOf("const KB_POLICY = 'virtualkeyboardpolicy';") >= 0 &&
  /function setKbManual\(on\) \{[\s\S]{0,520}pane\.setAttribute\(KB_POLICY, 'manual'\)/.test(appSrc) &&
  /* 第二道保险：不认 manual 的内核靠 inputmode=none 压住输入法 */
  /pane\.setAttribute\('inputmode', 'none'\)/.test(appSrc) &&
  /pane\.removeAttribute\('inputmode'\)/.test(appSrc) &&
  /function focusQuiet\(pane\) \{[\s\S]{0,220}setKbManual\(true\)/.test(appSrc) &&
  /function hideSoftKeyboard\(\) \{[\s\S]{0,700}\.blur\(\)/.test(appSrc) &&
  /function focusTyping\(el\) \{[\s\S]{0,260}if \(wasManual && document\.activeElement === t\) t\.blur\(\)/.test(appSrc) &&
  /* 面板按钮走的四条命令链都用静默聚焦 */
  (appSrc.match(/focusQuiet\(pane\);/g) || []).length >= 5 &&
  /function openStyleSheet\(\) \{[\s\S]{0,420}hideSoftKeyboard\(\)/.test(appSrc) &&
  /* 收起面板不立刻放开键盘策略：一撤属性输入法就弹，和高度回落叠起来就是闪屏 */
  !/function closeStyleSheet\(\) \{[\s\S]{0,600}setKbManual\(false\)/.test(appSrc) &&
  /function closeStyleSheet\(\) \{[\s\S]{0,1100}cmSettle\(\)/.test(appSrc) &&
  /* 收起时面板淡出再隐藏，别在编辑区回落时留一块空白 */
  /\.sj-style-sheet\.sj-ss-closing \{[\s\S]{0,160}opacity: 0/.test(styleSrc) &&
  /clearTimeout\(ssCloseTimer\)/.test(appSrc) &&
  /STYLE_SHEET\.classList\.add\('sj-ss-closing'\)/.test(appSrc) &&
  /* 编辑态点正文（非图片、非待办框）才唤起输入法 */
  /function typingFocus\(point\) \{[\s\S]{0,200}focusTyping\(rp\)/.test(appSrc) &&
  /typingFocus\(\{ x: e\.clientX, y: e\.clientY \}\)/.test(appSrc) &&
  appSrc.indexOf('pane.focus();\n      restoreRange();') < 0);

ok('样式面板不再遮挡正文：编辑区抬到面板上方、调完格式自动滚进视野',
  /body\.sj-note-open\.sj-style-open \.app \{[\s\S]{0,120}bottom: var\(--ss-h,/.test(styleSrc) &&
  /* 面板开着时不再改正文底部留白：一改就是 132px 的瞬变，打开面板会跟着抖 */
  !/body\.sj-note-edit\.sj-style-open \.rich-pane \{/.test(styleSrc) &&
  /function syncSheetHeight\(\) \{[\s\S]{0,300}getBoundingClientRect\(\)\.height/.test(appSrc) &&
  /function syncSheetHeight\(\)[\s\S]{0,320}setProperty\('--ss-h'/.test(appSrc) &&
  /function openSheetNow\(\) \{[\s\S]{0,700}classList\.add\('sj-style-open'\)/.test(appSrc) &&
  /function closeStyleSheet\(\) \{[\s\S]{0,300}classList\.remove\('sj-style-open'\)/.test(appSrc) &&
  /function revealSelectionDelta\(\) \{[\s\S]{0,700}getClientRects\(\)/.test(appSrc) &&
  /function revealSelection\(\) \{[\s\S]{0,240}revealSelectionDelta\(\)/.test(appSrc) &&
  (appSrc.match(/revealSelection\(\);/g) || []).length >= 5 &&
  /body\.sj-style-open \.pwd-tip \{ display: none; \}/.test(styleSrc) &&
  /max-height: min\(88vh, 470px\)/.test(styleSrc) &&
  appSrc.indexOf("window.addEventListener('resize', () => {") >= 0 &&
  /if \(!styleSheetOpen\(\)\) return;\s*syncSheetHeight\(\);\s*scheduleSheetReveal\(160\);/.test(appSrc));

ok('光标常驻 + 面板不误关：收键盘后焦点仍在正文，点正文只挪光标不收起面板',
  /* 收键盘不能连光标一起收：blur 前记下选区、blur 后当场还回去（不再延迟回焦，
     回焦会让部分内核再滚一次页面，和面板上滑叠成闪屏） */
  /function hideSoftKeyboard\(\) \{[\s\S]{0,400}keep = s0\.getRangeAt\(0\)\.cloneRange\(\)/.test(appSrc) &&
  /function hideSoftKeyboard\(\) \{[\s\S]{0,900}savedRange = keep/.test(appSrc) &&
  !/function hideSoftKeyboard\(\) \{[\s\S]{0,900}setTimeout\(/.test(appSrc) &&
  /function focusQuiet\(pane\) \{[\s\S]{0,220}setKbManual\(true\)[\s\S]{0,120}activeElement === el/.test(appSrc) &&
  /* 面板开着点正文：定位光标 + 滚进视野，直接 return，不走 typingFocus */
  /if \(styleSheetOpen\(\)\) \{[\s\S]{0,240}caretTo\(e\.clientX, e\.clientY\)[\s\S]{0,200}revealSelection\(\)[\s\S]{0,80}return;/.test(appSrc) &&
  /* 外部点击的自动收起要放过整块编辑区，只留 A / × */
  /t\.closest\('\.editor-pane'\)/.test(appSrc) &&
  /t\.closest\('#richPane'\)/.test(appSrc) &&
  /* 只有一根光标时点 B/I/U 也要有反馈：先选中所在段落再套格式 */
  /if \(NARROW\(\) && \/\^\(bold\|italic\|underline\)\$\//.test(appSrc) &&
  (appSrc.match(/function ensureBlockSel\(/g) || []).length === 1 &&
  /* 自绘光标：手机内核不保证聚焦时一直画原生光标，面板开着就自己画一根 */
  /\.sj-caret-mark \{[\s\S]{0,220}position: fixed/.test(styleSrc) &&
  /body\.sj-caret-drawn \.rich-pane \{ caret-color: transparent; \}/.test(styleSrc) &&
  /function cmHide\(\) \{[\s\S]{0,220}classList\.remove\('sj-caret-drawn'\)/.test(appSrc) &&
  /document\.body\.classList\.add\('sj-caret-drawn'\)/.test(appSrc) &&
  /function cmPaint\(\) \{[\s\S]{0,2200}classList\.remove\('hidden'\)/.test(appSrc) &&
  /caretRefresh = cmSync/.test(appSrc) &&
  (appSrc.match(/refreshCaret\(\)/g) || []).length >= 6 &&
  /pane\.addEventListener\('scroll'[\s\S]{0,200}cmPaint\(\)/.test(appSrc) &&
  /* 兜底对位改成全局定时（cmPaint 自己判断该不该画） */
  /setInterval\(cmPaint, 250\)/.test(appSrc) &&
  /* 窄屏编辑态就一直画，不是只在面板打开时：收起那一刻光标要连续；
     「正在等键盘收完」也算在调格式，否则等待那几百毫秒里一根光标都没有 */
  /!NARROW\(\) \|\| !editing \|\| !\(focused \|\| styleSheetOpen\(\) \|\| styleSheetPending\(\)\)/.test(appSrc) &&
  /document\.addEventListener\('selectionchange', cmPaint\)/.test(appSrc));

ok('收起样式面板不闪屏：高度回落有过渡、键盘不抢着弹、光标不断',
  /* 过渡写在基础规则上，收起时才不会从 378 瞬跳到 56 */
  /body\.sj-note-open \.app \{[\s\S]{0,300}transition: bottom \.18s/.test(styleSrc) &&
  /function cmSettle\(\) \{[\s\S]{0,200}forEach\(\(t\) => setTimeout\(cmPaint, t\)\)/.test(appSrc) &&
  /function closeStyleSheet\(\) \{[\s\S]{0,1100}cmSettle\(\)/.test(appSrc) &&
  /* 收起时面板淡出再隐藏，别在编辑区回落时留一块空白 */
  /\.sj-style-sheet\.sj-ss-closing \{[\s\S]{0,160}opacity: 0/.test(styleSrc) &&
  /clearTimeout\(ssCloseTimer\)/.test(appSrc) &&
  /STYLE_SHEET\.classList\.add\('sj-ss-closing'\)/.test(appSrc) &&
  /function openSheetNow\(\) \{[\s\S]{0,900}cmSettle\(\)/.test(appSrc));

ok('列表：数字/字母/圆点/待办可互相换类型，数字列表真的是 <ol>',
  /* 数字列表必须走 insertOrderedList，之前只判了 alpha，点数字出来是圆点 */
  /const ordered = kind === 'list-num' \|\| kind === 'list-alpha';/.test(appSrc) &&
  /cssCmd\(ordered \? 'insertOrderedList' : 'insertUnorderedList'\)/.test(appSrc) &&
  /* 已在列表里时只换外层标签，不再 execCommand，否则会套成嵌套列表 */
  /function retagList\(list, tag\) \{[\s\S]{0,1600}replaceChild\(nu, list\)/.test(appSrc) &&
  /function paintListKind\(el, kind\) \{[\s\S]{0,420}listStyleType/.test(appSrc) &&
  /* 换标签会摘掉旧节点、选区悬空，得按路径搬回新树 */
  /function rangePathOf\(root, r\) \{[\s\S]{0,520}offset: r\.startOffset/.test(appSrc) &&
  /function rangeFromPath\(root, p\) \{[\s\S]{0,600}createRange\(\)/.test(appSrc) &&
  /if \(cur && listKindOf\(cur\) === kind\) \{[\s\S]{0,200}unwrapList\(cur\)/.test(appSrc) &&
  /function unwrapList\(list\) \{[\s\S]{0,1600}replaceChild\(out, list\)/.test(appSrc) &&
  /* Chrome 会把列表塞进 <p> 里，存盘后能多出一个空段落 */
  /function liftList\(list\) \{[\s\S]{0,760}replaceChild\(list, p\)/.test(appSrc) &&
  (appSrc.match(/function retagList\(/g) || []).length === 1 &&
  (appSrc.match(/function unwrapList\(/g) || []).length === 1);

ok('自绘光标跟着字色变：改成紫字，光标就是紫的',
  /function cmColorAt\(r\) \{[\s\S]{0,420}getComputedStyle\(n\)\.color/.test(appSrc) &&
  /const col = cmColorAt\(r\);[\s\S]{0,80}el\.style\.background = col/.test(appSrc) &&
  /\.sj-caret-mark \{[\s\S]{0,220}background: var\(--text\)/.test(styleSrc));

ok('点 A 打开面板不闪屏：等键盘收完再弹、面板不透明上滑、高度只量一次、光标行滑过去而不是跳过去',
  /* 面板要占 378px 底边：可视区只剩「键盘那么点高」时先别弹，
     否则正文被压成一条、键盘收完又长回来（首次点 A 闪屏的真正根因） */
  /function sheetRoom\(\) \{[\s\S]{0,420}--ss-h/.test(appSrc) &&
  /function openStyleSheet\(\) \{[\s\S]{0,900}if \(sheetRoom\(\) < 300\) \{ whenViewportQuiet\(openSheetNow\); return; \}/.test(appSrc) &&
  /* 静默判定：可视高度连三拍不变才动手，另有 640ms 上限兜底 */
  /function whenViewportQuiet\([\s\S]{0,700}vqSame >= 3/.test(appSrc) &&
  /function whenViewportQuiet\([\s\S]{0,900}> 640/.test(appSrc) &&
  /* 等着的时候再点一下 A 算取消；收起面板也把等待掐掉 */
  /if \(styleSheetPending\(\)\) \{[\s\S]{0,200}stopViewportQuiet\(\)/.test(appSrc) &&
  /* 等待期间正文已经 blur，系统不画光标；自绘这根要顶上，不能跟着消失 */
  /function cmPaint\(\)[\s\S]{0,700}focused \|\| styleSheetOpen\(\) \|\| styleSheetPending\(\)/.test(appSrc) &&
  /function closeStyleSheet\(\) \{[\s\S]{0,200}stopViewportQuiet\(\)/.test(appSrc) &&
  /* 面板出场只滑不淡：opacity 从 .4 起步时，下面上抬的正文会透出来 */
  /animation: sj-sheet-up \.18s/.test(styleSrc) &&
  /@keyframes sj-sheet-up \{[\s\S]{0,90}translateY\(18px\)[\s\S]{0,90}translateY\(0\)/.test(styleSrc) &&
  !/\.sj-style-sheet \{[\s\S]{0,900}animation: sj-editor-up/.test(styleSrc) &&
  /* 先量高度再挂类：否则 .app 会先用 360px 默认值起步，下一帧再跳到实测值 */
  /function openSheetNow\(\) \{[\s\S]{0,700}classList\.remove\('hidden'\)[\s\S]{0,200}syncSheetHeight\(\)[\s\S]{0,200}classList\.add\('sj-style-open'\)/.test(appSrc) &&
  /* 光标行不是「动画一结束就一把滚过去」：等视口安静，再缓动滑到位（首次点 A 闪屏的根因） */
  /function openSheetNow\(\) \{[\s\S]{0,1400}scheduleSheetReveal\(\)/.test(appSrc) &&
  !/function openSheetNow\(\) \{[\s\S]{0,1400}setTimeout\(\(\) => \{[\s\S]{0,140}revealSelection\(\)/.test(appSrc) &&
  /function glideRevealSelection\([\s\S]{0,500}setInterval\(/.test(appSrc) &&
  /function glideRevealSelection\([\s\S]{0,800}Math\.pow\(1 - k, 3\)/.test(appSrc) &&
  /function scheduleSheetReveal\([\s\S]{0,260}glideRevealSelection\(200\)/.test(appSrc) &&
  /* 收起面板时掐掉还没跑完的滑动，别在面板走了以后又滚一下 */
  /function closeStyleSheet\(\) \{[\s\S]{0,200}stopSheetReveal\(\)/.test(appSrc) &&
  /* 正文区的 scroll-anchor 会趁改高度顺手挪 scrollTop，位置由我们自己算 */
  /body\.sj-note-open \.rich-pane \{ overflow-anchor: none; \}/.test(styleSrc) &&
  /* 桌面安装提示条原本和面板同层、排在后面，会盖住面板最后两行 */
  /\.pwa-tip \{[\s\S]{0,260}z-index: 89/.test(styleSrc));

ok('插入图片先问「拍照 / 从相册选择 / 取消」：系统选择器没有取消，别把人困在里面',
  /id="sjImgSheet"/.test(indexSrc) &&
  /data-act="pk-camera"/.test(indexSrc) &&
  /data-act="pk-gallery"/.test(indexSrc) &&
  /class="sj-pick-cancel" data-act="pk-close">取消</.test(indexSrc) &&
  /* 弹面板先收键盘，免得选择条被输入法顶掉半截 */
  /function openImgSheet\(\) \{[\s\S]{0,160}hideSoftKeyboard\(\)/.test(appSrc) &&
  /* 点了拍照/相册才真正去点 input，且必须在同一次手势里同步触发 */
  /function pickImage\(mode\) \{[\s\S]{0,400}fi\.dataset\.insert = '1'[\s\S]{0,140}fi\.click\(\)/.test(appSrc) &&
  /if \(NARROW\(\) && IMG_SHEET\)/.test(appSrc) &&
  /IMG_MASK\) IMG_MASK\.addEventListener\('click', closeImgSheet\)/.test(appSrc) &&
  /* 首次访问的绿色提示条在 z-index 9000，会正好盖住「从相册选择」 */
  /document\.body\.classList\.add\('sj-pick-open'\)/.test(appSrc) &&
  /body\.sj-pick-open \.pwd-tip \{ display: none; \}/.test(styleSrc) &&
  /e\.key !== 'Escape'/.test(appSrc) &&
  /e\.target\.removeAttribute\('capture'\)/.test(appSrc) &&
  /\.sj-pick-sheet \{[\s\S]{0,300}position: fixed; z-index: 94/.test(styleSrc) &&
  /\.sj-pick-cancel:active \{ background: var\(--surface-3\); \}/.test(styleSrc) &&
  /* 系统相册页插不进按钮，至少把「用返回手势退出」写在面板里 */
  /class="sj-pick-hint">系统相册页没有返回键时，用手机的返回手势退出</.test(indexSrc) &&
  /\.sj-pick-hint \{[\s\S]{0,200}color: var\(--text-3\)/.test(styleSrc));

ok('点正文弹键盘后，正文跟着滚到光标那一行（键盘底下那一截不算可视区）',
  /function revealTypingCaret\(\) \{[\s\S]{0,1800}line\.bottom > visBottom - pad[\s\S]{0,160}pane\.scrollTop \+=/.test(appSrc) &&
  /* 用 visualViewport 算键盘遮住的高度，iOS 不认 interactive-widget 也不吃亏 */
  /vv \? vv\.offsetTop \+ vv\.height : window\.innerHeight/.test(appSrc) &&
  /* 已经在可视区内就不动，别抢用户手动滚的那一下 */
  /else if \(line\.top < visTop \+ pad\) pane\.scrollTop -=/.test(appSrc) &&
  /\[0, 90, 220, 400, 650\]\.forEach/.test(appSrc) &&
  /t\.focus\(\{ preventScroll: true \}\);[\s\S]{0,220}scheduleTypingReveal\(\)/.test(appSrc) &&
  /window\.addEventListener\('resize', \(\) => \{ revealTypingCaret\(\); \}\)/.test(appSrc) &&
  /visualViewport\.addEventListener\('resize', \(\) => \{ revealTypingCaret\(\); \}\)/.test(appSrc) &&
  /interactive-widget=resizes-content/.test(indexSrc));

ok('底栏「更多」点了有反应：菜单不被同一次点击关掉，锚点用真按钮',
  /* showCtx 是在 click 里弹的，事件会继续冒泡到「点别处关菜单」的 document 监听，
     旧写法等于自己关自己——用户看着就是点了没效果 */
  /let ctxJustOpened = false;/.test(appSrc) &&
  /ctxJustOpened = true;\s*setTimeout\(\(\) => \{ ctxJustOpened = false; \}, 0\);/.test(appSrc) &&
  /document\.addEventListener\('click', \(e\) => \{\s*if \(ctxJustOpened\) return;/.test(appSrc) &&
  /* 编辑态详情底栏是 display:none，拿它的 rect 全是 0，菜单会被钳到屏幕左上角 */
  /function openNoteMore\(anchor, note\) \{[\s\S]{0,300}anchor\.getBoundingClientRect\(\)[\s\S]{0,700}同步到云端[\s\S]{0,200}\{ above: true \}/.test(appSrc) &&
  /* above：y 当菜单底边算，整个菜单落在工具条上方，不压住那排图标 */
  /function showCtx\(x, y, items, opts\) \{[\s\S]{0,900}opts && opts\.above \? y - rect\.height : y/.test(appSrc) &&
  /else if \(act === 'more'\) openNoteMore\(b, note\);/.test(appSrc) &&
  /if \(a === 'more'\) \{ openNoteMore\(b, currentNote\(\)\); return; \}/.test(appSrc) &&
  (appSrc.match(/openNoteMore\(/g) || []).length === 3 &&
  /* 首次打开没装 PWA 时的提示条压着工具条（89 > 61），详情页里让它躲开 */
  /body\.sj-note-open \.pwa-tip \{/.test(styleSrc) &&
  /* 编辑工具条的收藏仍走隐藏底栏那颗按钮的既有逻辑 */
  /if \(a === 'more'\) \{ openNoteMore\(b, currentNote\(\)\); return; \}[\s\S]{0,220}const proxy = DETAIL/.test(appSrc));

ok('手机端历史版本改上下结构：列表在上、预览在下，不再被挤成一条竖排字',
  /* 原来是 232px 固定列表 + 右侧预览，390 宽弹窗里预览只剩 100px，一个字一行 */
  /@media \(max-width: 720px\) \{[\s\S]{0,900}\.hist-body \{[\s\S]{0,240}grid-template-columns: 1fr;[\s\S]{0,140}grid-template-rows: minmax\(92px, 44%\) 1fr/.test(styleSrc) &&
  /\.hist-list \{[\s\S]{0,180}border-right: 0;[\s\S]{0,90}border-bottom: 1px solid var\(--border\)/.test(styleSrc) &&
  /* 列表项压成一行：时间 · 来源 · 字数，7 条一屏数得完 */
  /\.hist-item \{[\s\S]{0,140}display: flex;[\s\S]{0,90}align-items: baseline/.test(styleSrc) &&
  /* 窄屏弹窗贴边留 10px、最高 84vh，按钮靠右不挤说明文字 */
  /\.modal\.wide \{\s*width: calc\(100vw - 20px\);\s*max-height: min\(84vh, 700px\)/.test(styleSrc) &&
  /\.hist-foot \.btn \{ margin-left: auto; \}/.test(styleSrc) &&
  /* 桌面端仍是左右两栏，别被顺手改掉 */
  /\.hist-body \{\s*display: grid;\s*grid-template-columns: 232px 1fr;/.test(styleSrc));

/* 图标：只读 PNG 头（宽高 + color type），不引第三方图像库。
   color type 6 = RGBA（any 版要留透明圆角），2 = RGB（maskable/apple 必须满版不透明）。 */
function pngInfo(file) {
  const b = fs.readFileSync(file);
  if (b.toString('ascii', 1, 4) !== 'PNG') return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), color: b[25] };
}
const ICON_SET = [
  ['icon-512.png', 512, 6], ['icon-192.png', 192, 6],
  ['icon-maskable-512.png', 512, 2], ['icon-maskable-192.png', 192, 2],
  ['icon-quick-512.png', 512, 6], ['icon-quick-192.png', 192, 6],
  ['icon-quick-maskable-512.png', 512, 2], ['icon-quick-maskable-192.png', 192, 2],
  ['apple-touch-icon.png', 180, 2], ['apple-touch-icon-quick.png', 180, 2],
  ['favicon-32.png', 32, 6], ['favicon-quick-32.png', 32, 6],
];
const manifestSrc = fs.readFileSync(path.join(CLOUD, 'manifest.webmanifest'), 'utf8');
const quickManifestSrc = fs.readFileSync(path.join(CLOUD, 'quick.webmanifest'), 'utf8');
ok('图标换新：暖橙「笔记」+ 墨绿「随手记」，12 个尺寸齐全且透明/满版各就各位',
  ICON_SET.every(([n, w, c]) => {
    const p = path.join(CLOUD, 'icons', n);
    if (!fs.existsSync(p)) return false;
    const i = pngInfo(p);
    return !!i && i.w === w && i.h === w && i.color === c;
  }) &&
  /"purpose": "any"/.test(manifestSrc) && /"purpose": "maskable"/.test(manifestSrc) &&
  /"purpose": "any"/.test(quickManifestSrc) && /"purpose": "maskable"/.test(quickManifestSrc) &&
  /'\/icons\/icon-192\.png'/.test(swSrc) && /'\/icons\/icon-512\.png'/.test(swSrc));

console.log('\n结果：' + pass + ' 通过，' + fail + ' 失败');
process.exit(fail ? 1 : 0);
