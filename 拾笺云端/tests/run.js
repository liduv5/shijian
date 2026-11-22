/* 拾笺 · 回归测试（纯 Node，无外部依赖）
   运行：node 拾笺云端/tests/run.js
   覆盖：① SW 版本/访问码白名单（防 v1.7.2 回归）；② 中文全文检索；
         ③ 同步冲突判定；④ 发布前静态校验（版本/旧码/语法/共享文件/VBS 编码）。
   来源：历史提交 a1882fe 的 tests/run.js，按当前 2026-11-22-163 基线重建。
   注意：版本号与访问码换版时必须同步改 BUILD / SC。 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const cp = require('child_process');
const crypto = require('crypto');

const CLOUD = path.join(__dirname, '..');
const DESKTOP = path.join(CLOUD, '..', '拾笺');
const BUILD = '2026-11-22-163';
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
const pwaSrc = fs.readFileSync(path.join(CLOUD, 'pwa.js'), 'utf8');
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
for (const id of ['sjHomeHead', 'sjCatTitle', 'sjHomeSearch', 'sjCatSheet', 'sjFab', 'sjFabMenu', 'sjDetailBar']) {
  ok('首页 DOM 节点存在：#' + id, indexSrc.indexOf('id="' + id + '"') >= 0);
}
ok('底部双 tab 已移除（随手记并入加号菜单）',
  indexSrc.indexOf('id="sjTabbar"') < 0 &&
  indexSrc.indexOf('id="sjTabNotes"') < 0 &&
  indexSrc.indexOf('id="sjTabQuick"') < 0);
ok('随手记页有底部「笔记」tab 且绑定 goMain（q 参数不丢）',
  quickSrc.indexOf('id="qTabNotes"') >= 0 && quickSrc.indexOf("bindGo('qTabNotes')") >= 0);
ok('随手记页配色/字体/主题与拾笺主程序统一',
  /* 同一套本地字体（SJText 正文） */
  /@font-face \{\s*font-family: "SJBrand";/.test(quickSrc) &&
  /@font-face \{\s*font-family: "SJText";/.test(quickSrc) &&
  /--font-ui: "SJText"/.test(quickSrc) &&
  /* 明暗两套色卡与主程序同色值 */
  /html\[data-theme="light"\] \{[\s\S]{0,200}--bg: #f4f3ef;[\s\S]{0,300}--accent: #2f6f5e;/.test(quickSrc) &&
  /html\[data-theme="dark"\] \{[\s\S]{0,200}--bg: #141618;[\s\S]{0,300}--accent: #63b79d;/.test(quickSrc) &&
  /* 组件全部走变量，不再硬编码主色 */
  /background: var\(--accent\); color: #fff;/.test(quickSrc) &&
  /background: var\(--bg\); color: var\(--text\);/.test(quickSrc) &&
  /* 品牌行已整体移除（图标+拾笺+朱点+随手记标签都不显示） */
  quickSrc.indexOf('class="brand"') < 0 &&
  quickSrc.indexOf('brand-logo') < 0 &&
  /* 主题跟随：读 sj_theme + storage 同步 + 系统偏好兜底 */
  /<html lang="zh-CN" data-theme="light">/.test(quickSrc) &&
  /content="light dark"/.test(quickSrc) &&
  /localStorage\.getItem\('sj_theme'\)/.test(quickSrc) &&
  /prefers-color-scheme: dark/.test(quickSrc) &&
  /e\.key === 'sj_theme'/.test(quickSrc) &&
  /* 电脑宽屏底栏收进卡片宽度，不再横贯全屏 */
  /@media \(max-width: 600px\)/.test(quickSrc) &&
  /width: min\(520px, calc\(100% - 36px\)\);/.test(quickSrc));
ok('随手记电脑端（≥981px）中性简约风：去印章朱点/行楷/墨绿，强调色改石墨灰，不污染手机端',
  /* 整块限定 min-width:981px */
  /@media \(min-width: 981px\) \{[\s\S]{0,900}html\[data-theme="light"\] \{[\s\S]{0,300}--accent: #43403a;/.test(quickSrc) &&
  /@media \(min-width: 981px\) \{[\s\S]{0,900}html\[data-theme="dark"\] \{[\s\S]{0,300}--accent: #d5d0c7;/.test(quickSrc) &&
  /* 品牌行 DOM 已移除，桌面无需再隐藏印章（全局无 brand 元素） */
  quickSrc.indexOf('class="brand"') < 0 &&
  /* 深色实心按钮换深色字 */
  /@media \(min-width: 981px\) \{[\s\S]{0,1500}html\[data-theme="dark"\] \.primary \{ color: #1c1a17; \}/.test(quickSrc) &&
  /* 桌面绿色提示条也中性化 */
  /--desk-bg: #f1efeb;/.test(quickSrc) &&
  /* 全局色卡仍是墨绿（供桌面基准与降级），手机端由下方 ≤980px 块覆盖成蓝 */
  /html\[data-theme="light"\] \{[\s\S]{0,200}--accent: #2f6f5e;/.test(quickSrc));
ok('随手记手机端（≤980px）配色与主程序手机端一致：冷灰白+华为蓝，桌面不受影响',
  /* 整块限定 max-width:980px */
  /@media \(max-width: 980px\) \{[\s\S]{0,900}html\[data-theme="light"\] \{[\s\S]{0,300}--bg: #f5f5f7;[\s\S]{0,300}--accent: #0a59f7;/.test(quickSrc) &&
  /@media \(max-width: 980px\) \{[\s\S]{0,900}html\[data-theme="dark"\] \{[\s\S]{0,300}--accent: #4d8fff;/.test(quickSrc) &&
  /* 品牌行（含朱砂印章）已整体移除，页面从标题直接开始 */
  quickSrc.indexOf('class="brand"') < 0 &&
  quickSrc.indexOf('<div id="view"></div>') < quickSrc.indexOf('<div class="card">') + 60 &&
  /* 桌面端 ≥981px 石墨灰块仍在，未被手机端块覆盖 */
  /@media \(min-width: 981px\) \{[\s\S]{0,900}html\[data-theme="light"\] \{[\s\S]{0,300}--accent: #43403a;/.test(quickSrc));
ok('随手记手机端卡片默认固定在偏上位置（一进入即在键盘上方，不依赖键盘事件）',
  /* 手机端 body 从居中改为顶部对齐 + 固定上边距 */
  /@media \(max-width: 980px\) \{[\s\S]{0,80}body \{ justify-content: flex-start; padding-top: clamp\(20px, 9vh, 84px\); \}/.test(quickSrc) &&
  /* 桌面端仍是 base body 规则居中（未被手机端块的顶部对齐污染） */
  /body \{\s*margin: 0; min-height: 100dvh; padding: 24px 18px;[\s\S]{0,300}justify-content: center;/.test(quickSrc) &&
  /* 旧的键盘检测方案已移除，避免残留 */
  quickSrc.indexOf('kb-open') < 0 &&
  quickSrc.indexOf('base - vv.height') < 0);
ok('详情页返回顶栏走 closeEditor（替代原底部笔记 tab）',
  appSrc.indexOf("a === 'nh-back'") >= 0 && appSrc.indexOf('closeEditor(); return;') >= 0);
ok('分类面板复用现有伪节点 all/uncat/starred',
  appSrc.indexOf("catRow('all'") >= 0 && appSrc.indexOf("catRow('uncat'") >= 0 && appSrc.indexOf("catRow('starred'") >= 0);
ok('首页搜索与侧栏搜索共享 state.search',
  appSrc.indexOf('state.search = e.target.value;') >= 0);
ok('桌面端默认隐藏新增 UI（只在 ≤980px 放开）',
  /\.sj-home-head, \.sj-fab, \.sj-fab-menu, \.sj-detail-bar,[\s\S]{0,100}\.sj-cat-mgr, \.sj-manage-menu, \.sj-more-btn, \.sj-more-menu,[\s\S]{0,60}\.sj-cat-editor, \.sj-note-head, \.sj-edit-bar, \.sj-meta-cat,[\s\S]{0,80}\{ display: none; \}/.test(styleSrc) &&
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
  indexSrc.indexOf('id="sjCatSheet"') > indexSrc.indexOf('</main>'));

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
  /\.sj-cat-mgr, \.sj-manage-menu, \.sj-more-btn, \.sj-more-menu,[\s\S]{0,60}\.sj-cat-editor, \.sj-note-head, \.sj-edit-bar, \.sj-meta-cat,[\s\S]{0,80}\{ display: none; \}/.test(styleSrc) &&
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
ok('电脑端（≥981px）中性简约风：去印章朱点/行楷/绿底，强调色改石墨灰，不污染手机端',
  /* 整块限定在 min-width:981px，手机端用独立的蓝色变量作用域 */
  /@media \(min-width: 981px\) \{[\s\S]{0,900}html\[data-theme="light"\] \{[\s\S]{0,200}--accent: #43403a;/.test(styleSrc) &&
  /@media \(min-width: 981px\) \{[\s\S]{0,900}html\[data-theme="dark"\] \{[\s\S]{0,200}--accent: #d5d0c7;/.test(styleSrc) &&
  /* 去朱砂印章与朱点、行楷改无衬线 */
  /@media \(min-width: 981px\) \{[\s\S]{0,1400}\.brand \.logo,[\s\S]{0,120}\.brand-text h1 \.seal \{ display: none; \}/.test(styleSrc) &&
  /@media \(min-width: 981px\) \{[\s\S]{0,1400}\.brand-text h1 \{[\s\S]{0,120}font-family: var\(--font-ui\);/.test(styleSrc) &&
  /* 绿底加号改透明线性 */
  /@media \(min-width: 981px\) \{[\s\S]{0,1700}\.rail-new \{[\s\S]{0,120}background: transparent;/.test(styleSrc) &&
  /* 深色实心按钮换深色字，保证对比度 */
  /html\[data-theme="dark"\] \.btn\.primary,/.test(styleSrc) &&
  /* 手机端蓝色仍旧健在（没被误覆盖） */
  styleSrc.indexOf('--accent: #0a59f7') >= 0);
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
  /\.sj-cat-editor, \.sj-note-head, \.sj-edit-bar, \.sj-meta-cat,[\s\S]{0,80}\{ display: none; \}/.test(styleSrc) &&
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

ok('底栏下线后主区铺到底；编辑态抬到 52px 工具条上方，附件面板仍不被遮挡',
  /body\.sj-note-open\.sj-note-edit \.app \{[\s\S]{0,140}bottom: calc\(52px \+ env\(safe-area-inset-bottom, 0px\)\);/.test(styleSrc) &&
  !/body\.sj-note-open \.app \{[\s\S]{0,140}bottom: calc\(56px/.test(styleSrc) &&
  styleSrc.indexOf('.attach-panel {') >= 0 &&
  styleSrc.indexOf('position: fixed; z-index: 61;') >= 0);

ok('分类面板按华为截图做整页展开：页头带▲、浅灰底不压暗、tab 浮在面板上',
  appSrc.indexOf('function catHero()') >= 0 &&
  appSrc.indexOf('class="sj-caret">▲') >= 0 &&
  appSrc.indexOf("document.body.classList.add('sj-cat-open')") >= 0 &&
  appSrc.indexOf("document.body.classList.remove('sj-cat-open')") >= 0 &&
  /body\.sj-cat-open \.sj-cat-mask \{[\s\S]{0,80}background: var\(--bg\)/.test(styleSrc) &&
  styleSrc.indexOf('body.sj-cat-open .sj-more-btn,') >= 0);

ok('分类面板字号/行高/图标/系统字体按截图放大，分隔线从各行文字(--dl)起',
  /\.sj-cat-hero \.sj-home-title \{[\s\S]{0,220}font-size: 26px; font-weight: 700/.test(styleSrc) &&
  /\.sj-cat-row \{[\s\S]{0,600}min-height: 62px; padding: 0 2px;/.test(styleSrc) &&
  /\.sj-cat-row \{[\s\S]{0,600}font-family: var\(--mgr-font, var\(--font-ui\)\); font-size: 17px/.test(styleSrc) &&
  /\.sj-cat-row \.ico \{ width: 23px; height: 23px/.test(styleSrc) &&
  /\.sj-cat-sheet \{\s*position: fixed; z-index: 68;/.test(styleSrc) &&
  styleSrc.indexOf('--mgr-font: -apple-system, BlinkMacSystemFont, "HarmonyOS Sans SC"') >= 0 &&
  styleSrc.indexOf('left: var(--dl, 52px); right: 18px; top: 0;') >= 0 &&
  appSrc.indexOf('--dl:${dl}px') >= 0 &&
  appSrc.indexOf("data-act=\"cat-close\"") >= 0);

ok('展开后标题行与首页完全一致：同字体/同字号/同字重/同间距/同缩进，只换三角方向',
  // 首页基准：18px 左 + 18px+safe 顶，26px/700，gap 7，条数 12px
  /\.sj-home-title \{[\s\S]{0,200}font-size: 26px; font-weight: 700;/.test(styleSrc) &&
  /* 首页基准（18px 左 + 18px+safe 顶）现在长在 sticky 顶栏上 */
  /body:not\(\.sj-note-open\) \.sj-home-bar \{[\s\S]{0,300}padding: calc\(18px \+ env\(safe-area-inset-top, 0px\)\) 18px 0;/.test(styleSrc) &&
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
  !/formatSwitch/.test(styleSrc) && !/formatSwitch/.test(indexSrc) &&
  appSrc.indexOf("format: 'rich'") >= 0 &&
  // 顶栏小标题：默认隐藏（opacity:0），等正文大标题滚过去才淡入接管
  /body\.sj-note-open:not\(\.sj-note-edit\) \.sj-note-head \.title-input \{[\s\S]{0,200}font-size: 20px; font-weight: 700[\s\S]{0,120}opacity: 0/.test(styleSrc) &&
  /body\.sj-note-open:not\(\.sj-note-edit\) \.editor-head \{ display: none; \}/.test(styleSrc) &&
  /\.sj-rh-title \{[\s\S]{0,160}font-size: 27px/.test(styleSrc) &&
  /body\.sj-note-open:not\(\.sj-note-edit\) \.rich-pane \{[\s\S]{0,180}font-size: var\(--sj-rich-fs, 19px\); line-height: max\(var\(--sj-rich-lh, 28px\), 1\.1em\)/.test(styleSrc) &&
  /* 详情底栏整条下线，动作搬进右上角四点菜单 */
  !/body\.sj-note-open \.sj-detail-bar:not\(\.hidden\) \{ display: flex; \}/.test(styleSrc) &&
  styleSrc.indexOf('.sj-meta-cat {') >= 0);

/* 阅读态只读：进编辑只走顶栏那颗「编辑」（用户 2026-11-22 定：阅读就只是阅读）。
   原来「点正文进编辑」没拦 a[href]，点正文里的链接会一边跳转一边切形态；
   而且轻触就进可写状态、退出时还会 saveNow() 白落一次盘。 */
ok('阅读态进编辑只有顶栏一颗按钮，点正文不再跳进编辑',
  /data-act="nh-edit">编辑</.test(indexSrc)
  && /if \(a === 'nh-edit'\) \{ setNoteMode\('edit'\); return; \}/.test(appSrc)
  && !/setNoteMode\('edit', \{ x: e\.clientX, y: e\.clientY \}\)/.test(appSrc)
  && !/阅读态点图片：同样进编辑/.test(appSrc)
  && /\.sj-nh-edit \{[\s\S]{0,500}body\.sj-note-open:not\(\.sj-note-edit\) \.sj-nh-edit \{ display: flex; \}/.test(styleSrc)
  /* 阅读态顶栏右侧要让开固定的四点按钮（52 + 12 间隙）；110px 会把标题挤掉近 50px */
  && /body\.sj-note-open:not\(\.sj-note-edit\) \.sj-note-head \{ padding-right: 64px; \}/.test(styleSrc));

ok('标题下面只留一份分类且可点：分类胶囊可点换类、右边不再重复一颗',
  indexSrc.indexOf('id="sjMetaDate"') >= 0 &&
  indexSrc.indexOf('<button type="button" class="sj-meta-cat hidden" id="sjMetaCat"') >= 0 &&
  appSrc.indexOf('META_CAT.addEventListener') >= 0 &&
  appSrc.indexOf('openCategoryPicker(note)') >= 0 &&
  appSrc.indexOf("d.textContent = note ? '创建于 ' + fmtDate(note.createdAt) : ''") >= 0 &&
  /#metaInfo \{ display: none; \}/.test(styleSrc) &&
  /\.sj-meta-cat::after \{ content: '▾'/.test(styleSrc) &&
  appSrc.indexOf("window.addEventListener('sj-categories-changed', () => { refreshNoteMetaLine(); })") >= 0);

ok('桌面端第二行也只有分类名是热区（点日期不弹分类框）',
  appSrc.indexOf('function metaInfoHTML') >= 0 &&
  /data-meta-cat="1"/.test(appSrc) &&
  /#metaInfo'\)\.addEventListener\('click', \(e\) => \{[\s\S]{0,220}closest\('\[data-meta-cat\]'\)/.test(appSrc) &&
  appSrc.indexOf('metaInfoText') < 0 &&
  /\.meta-cat:hover \{ color: var\(--accent\); background: var\(--accent-soft\); \}/.test(styleSrc));

ok('写正文时图片保持图片：手机端进编辑先转富文本，不再露出 data URI 长串',
  appSrc.indexOf('function toRichEditor()') >= 0 &&
  /function toRichEditor\(\)[\s\S]{0,420}noteHtml/.test(appSrc) &&
  /setNoteMode[\s\S]{0,2200}toRichEditor\(\);/.test(appSrc) &&
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

ok('底栏那排按钮点了有反应：菜单不被同一次点击关掉，锚点用真按钮',
  /* showCtx 是在 click 里弹的，事件会继续冒泡到「点别处关菜单」的 document 监听，
     旧写法等于自己关自己——用户看着就是点了没效果 */
  /let ctxJustOpened = false;/.test(appSrc) &&
  /ctxJustOpened = true;\s*setTimeout\(\(\) => \{ ctxJustOpened = false; \}, 0\);/.test(appSrc) &&
  /document\.addEventListener\('click', \(e\) => \{\s*if \(ctxJustOpened\) return;/.test(appSrc) &&
  /* 编辑态详情底栏是 display:none，拿它的 rect 全是 0，菜单会被钳到屏幕左上角 */
  /function openNoteMore\(anchor, note\) \{[\s\S]{0,300}anchor\.getBoundingClientRect\(\)[\s\S]{0,700}移动到分类[\s\S]{0,200}\{ above: true, anchor \}/.test(appSrc) &&
  /* above：ay 当菜单底边算，整个菜单落在工具条上方，不压住那排图标；
     锚点在就每次按它的实时位置重算（输入法收起后底栏挪了，菜单得跟） */
  /function placeCtx\(x, y, opts\) \{[\s\S]{0,1100}ctxAnchor && ctxAnchor\.isConnected[\s\S]{0,420}o\.above \? ay - ch : ay/.test(appSrc) &&
  /else if \(act === 'more'\) openNoteMore\(b, note\);/.test(appSrc) &&
  /* 编辑工具条的收藏走既有逻辑；移动分类不再放底栏 —— 标题下方那颗胶囊
     本来就可点，两个入口同一件事（用户 2026-11-22 反馈重复） */
  /const proxy = DETAIL/.test(appSrc) &&
  !/a === 'move-cat'/.test(appSrc) &&
  /* 首次打开没装 PWA 时的提示条压着工具条（89 > 61），详情页里让它躲开 */
  /body\.sj-note-open \.pwa-tip \{/.test(styleSrc));

/* 编辑态底栏只留四颗常用动作。「移动到分类」曾经提到底栏替掉 ⋯，
   但标题下方那颗分类胶囊本来就点得动，两个入口同一件事 —— 2026-11-22 撤掉。 */
ok('编辑态底栏只留四颗，不再重复「移动到分类」',
  (function () {
    const a = indexSrc.indexOf('id="sjEditBar"');
    const b = a >= 0 ? indexSrc.indexOf('<div class="sj-img-bar', a) : -1;
    const bar = a >= 0 && b > a ? indexSrc.slice(a, b) : '';
    const acts = (bar.match(/data-act="[^"]+"/g) || []).map((s) => s.slice(10, -1));
    return acts.join(',') === 'fmt,img,attach,star'
      && !/data-act="more"/.test(bar);
  })());

ok('输入法收起后菜单跟着底栏回到底部，不再悬在半空',
  /* 点「更多」会失焦、输入法收起，底栏整排往下挪；菜单是 fixed，只在弹出时算一次位置，
     不重算就一直钉在半空中，离按钮几百像素 */
  /let ctxAnchor = null;/.test(appSrc) &&
  /function placeCtx\(x, y, opts\) \{[\s\S]{0,600}ctxAnchor && ctxAnchor\.isConnected[\s\S]{0,300}ax = r\.right - cw/.test(appSrc) &&
  /function ctxFollowOn\(\) \{[\s\S]{0,400}window\.addEventListener\('resize', ctxFollowSoon\)[\s\S]{0,300}visualViewport\.addEventListener\('resize', ctxFollowSoon\)/.test(appSrc) &&
  /function hideCtx\(\) \{[\s\S]{0,260}ctxFollowOff\(\);/.test(appSrc) &&
  /* 输入法收起有时不派发 resize，补几拍兜底重贴 */
  /\[120, 320, 700\]\.forEach/.test(appSrc) &&
  /移动到分类[\s\S]{0,160}\{ above: true, anchor \}/.test(appSrc));

ok('菜单弹出不横跳：定位用布局尺寸 offsetWidth，不受 pop 缩放动画影响',
  /* .ctx-menu 有 animation:pop .13s（scale .96→1），动画期间 getBoundingClientRect()
     拿到的宽度只有 178.6px，首帧按它算位置偏右 7px，120ms 兜底重贴时才跳回 196px。
     offsetWidth/Height 是布局尺寸，缩放动画中恒定，每拍算出的位置一致。 */
  /function placeCtx\(x, y, opts\) \{[\s\S]{0,260}const cw = ctx\.offsetWidth;[\s\S]{0,90}const ch = ctx\.offsetHeight;/.test(appSrc) &&
  /vp\.w - cw - 8/.test(appSrc) &&
  /vp\.h - ch - 8/.test(appSrc) &&
  /r\.right - cw/.test(appSrc) &&
  /o\.above \? ay - ch : ay/.test(appSrc) &&
  !/const rect = ctx\.getBoundingClientRect\(\);/.test(appSrc) &&
  /animation: pop \.13s var\(--ease\)/.test(styleSrc));

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

ok('首页大标题原地缩小并钉在顶部：不再「先飞出屏幕再由细栏接管」',
  /* 大标题就在 sticky 顶栏里，是唯一的标题来源；条数/搜索框是后面一段，
     跟着内容上滚、被顶栏盖住。没有第二份「收起态标题」需要淡入 */
  /id="sjHomeBar"/.test(indexSrc) &&
  /<div class="sj-home-bar" id="sjHomeBar">\s*<button type="button" class="sj-home-title" id="sjCatTitle"/.test(indexSrc) &&
  !/id="sjHomeBarText"/.test(indexSrc) &&
  /id="sjHomeCount"/.test(indexSrc) &&
  /body:not\(\.sj-note-open\) \.list-pane \{[\s\S]{0,200}overflow-y: auto/.test(styleSrc) &&
  /body:not\(\.sj-note-open\) \.note-list \{[\s\S]{0,120}overflow: visible/.test(styleSrc) &&
  /* 顶栏实心钉在最上方，自带高度：缩到最终字号时正好合身 */
  /body:not\(\.sj-note-open\) \.sj-home-bar \{[\s\S]{0,240}position: sticky; top: 0;/.test(styleSrc) &&
  /body:not\(\.sj-note-open\) \.sj-home-bar \{[\s\S]{0,400}background: var\(--surface\)/.test(styleSrc) &&
  /* 大标题原地缩（只动 transform，不改高度、不改位置，滚动里不会抖） */
  /\.sj-home-title \{ transform-origin: left top/.test(styleSrc) &&
  /* 缩到位的距离 = 条数+搜索那段的高度；到头才出细线；滚动时补软过渡 */
  /function placeHome\(\)[\s\S]{0,900}head\.offsetHeight[\s\S]{0,300}scale\([\s\S]{0,400}classList\.toggle\('scrolled', p > 0\.02\)[\s\S]{0,200}classList\.toggle\('show', p > 0\.9\)/.test(appSrc));

ok('阅读态大标题随正文滚出、顶栏小标题淡入接管（华为备忘录方式，见视频）',
  /* 正文顶部保留大标题节点，跟着 editor-body 一起滚走 */
  /id="sjReadHero"/.test(indexSrc) &&
  /id="sjReadTitle"/.test(indexSrc) &&
  /\.sj-rh-title \{[\s\S]{0,160}font-size: 27px/.test(styleSrc) &&
  /body\.sj-note-open:not\(\.sj-note-edit\) \.editor-body \{[\s\S]{0,220}overflow-y: auto/.test(styleSrc) &&
  /body\.sj-note-open:not\(\.sj-note-edit\) \.sj-read-hero \{[\s\S]{0,80}display: block/.test(styleSrc) &&
  /* 静止时顶栏小标题藏起来，大标题滚过去后浮现（透明度由脚本按滚动位置写） */
  /body\.sj-note-open:not\(\.sj-note-edit\) \.sj-note-head \.title-input \{[\s\S]{0,140}opacity: 0/.test(styleSrc) &&
  /* 大标题填充仍在；两种形态滚动容器不同，切换时换算位置避免跳回顶部 */
  /function mountMeta\(\)[\s\S]{0,700}READ_META\.appendChild\(META_CAT\)/.test(appSrc) &&
  /rpEl\.scrollTop = Math\.max\(0, bodyY - heroH\)/.test(appSrc) &&
  /BODY_BOX\.scrollTop = rpY \+ heroH/.test(appSrc) &&
  /* placeRead 用「大标题底边离顶栏底边多远」算透明度，滚过去后淡入接管 */
  /function placeRead\(\)[\s\S]{0,1100}READ_TITLE\.getBoundingClientRect\(\)\.bottom - NOTE_HEAD\.getBoundingClientRect\(\)\.bottom/.test(appSrc) &&
  /function placeRead\(\)[\s\S]{0,1200}ti\.style\.opacity = p > 0\.02 \? p\.toFixed\(2\)/.test(appSrc) &&
  /function placeRead\(\)[\s\S]{0,1300}classList\.toggle\('sj-head-solid', p > 0\.95\)/.test(appSrc));

ok('顶栏不出现标题框下边框线（首页和笔记页都去掉）',
  /* 首页：show 到位不再给 .sj-home-bar::after 上边框 */
  !/\.sj-home-bar\.show::after\s*\{/.test(styleSrc) &&
  !/body:not\(\.sj-note-open\) \.sj-home-bar::after\s*\{/.test(styleSrc) &&
  /* 笔记页：sj-head-solid 不再给 .sj-note-head::after 上边框 */
  !/sj-head-solid \.sj-note-head::after\s*\{/.test(styleSrc) &&
  /* 首页顶栏实心背景与软过渡仍在；笔记页顶栏保持普通定位，正文滚走后露出底色 */
  /body:not\(\.sj-note-open\) \.sj-home-bar\.scrolled::before\s*\{ opacity: 1; \}/.test(styleSrc) &&
  /body\.sj-note-open:not\(\.sj-note-edit\) \.sj-note-head \{ position: relative; \}/.test(styleSrc));

ok('右下加号径向散开「新建笔记 / 随手记」菜单，替代底部 tab',
  /* 独立径向菜单 DOM：两项圆形按钮 */
  /id="sjFabMenu"/.test(indexSrc) &&
  /class="sj-fab-item" data-act="new"/.test(indexSrc) &&
  /class="sj-fab-item" data-act="quick"/.test(indexSrc) &&
  /class="sj-fab-item-txt">新建笔记</.test(indexSrc) &&
  /class="sj-fab-item-txt">随手记</.test(indexSrc) &&
  /* 从加号中心沿圆弧散开的 transform 动画（--dx/--dy 分别定义两个角度） */
  /\.sj-fab-item \{[\s\S]{0,260}transform: translate\(-50%, -50%\) scale\(\.35\)/.test(styleSrc) &&
  /body\.sj-fab-open \.sj-fab-item \{[\s\S]{0,200}translate\(calc\(-50% \+ var\(--dx\)\), calc\(-50% \+ var\(--dy\)\)\)/.test(styleSrc) &&
  /\.sj-fab-item\[data-act="new"\] \{ --dx: -\d+px; --dy: -\d+px;/.test(styleSrc) &&
  /\.sj-fab-item\[data-act="quick"\] \{ --dx: -\d+px; --dy: -\d+px;/.test(styleSrc) &&
  /body\.sj-fab-open \.sj-fab \.ico \{ transform: rotate\(45deg\); \}/.test(styleSrc) &&
  /* 锚到加号中心 + 三项点击行为 */
  /FABMENU\.style\.left = \(r\.left \+ r\.width \/ 2\)/.test(appSrc) &&
  /function toggleFabMenu\(\) \{ if \(fabOpen\) hideFabMenu\(\); else openFabMenu\(\); \}/.test(appSrc) &&
  /FAB\.addEventListener\('click', toggleFabMenu\)/.test(appSrc) &&
  /if \(!fabOpen \|\| fabJustOpened\) return;/.test(appSrc) &&
  /if \(FABMENU && FABMENU\.contains\(e\.target\)\) return;/.test(appSrc) &&
  /const act = el\.dataset\.act;[\s\S]{0,120}if \(act === 'new'\) createNote\(\);[\s\S]{0,80}act === 'quick'/.test(appSrc) &&
  /* guard 用加号而非已删的 tabbar，否则整块首页逻辑不执行 */
  /const FAB = \$\('#sjFab'\), DETAIL = \$\('#sjDetailBar'\);[\s\S]{0,80}if \(!FAB\) return;/.test(appSrc));

ok('加号落到底部且与首次安装提示条避让',
  /right: 18px; bottom: calc\(18px \+ env\(safe-area-inset-bottom, 0px\)\);/.test(styleSrc) &&
  /body\.sj-tip-open:not\(\.sj-note-open\) \.sj-fab \{[\s\S]{0,80}bottom: calc\(78px/.test(styleSrc) &&
  /classList\.add\('sj-tip-open'\)/.test(pwaSrc) &&
  /classList\.remove\('sj-tip-open'\)/.test(pwaSrc));

console.log('\n阅读态底栏收进右上角菜单');
ok('详情底栏不再显示（56px 屏高还给正文）',
  /\.sj-detail-bar \{\s+display: none;/.test(styleSrc)
  && !/sj-detail-bar:not\(\.hidden\) \{ display: flex/.test(styleSrc));
ok('打开笔记时菜单换成笔记动作：分享 / 收藏 / 源码 / 历史 / 删除',
  /function noteMoreRows\(note\) \{/.test(appSrc)
  && /act: 'n-share'/.test(appSrc) && /act: 'n-star'/.test(appSrc)
  && /act: 'n-delete'/.test(appSrc) && /act: 'n-md'/.test(appSrc)
  && /act: 'n-history'/.test(appSrc)
  && /const rows = note \? noteMoreRows\(note\) : MORE_ROWS;/.test(appSrc));
ok('笔记菜单不再有「移动到分类」「同步到云端」（换类在编辑态，同步只留首页）',
  !/n-move/.test(appSrc) && !/n-sync/.test(appSrc)
  && !/label: '移动到分类'/.test(appSrc.slice(appSrc.indexOf('function noteMoreRows'),
                                             appSrc.indexOf('function renderMoreMenu')))
  && /act: 'sync', label: '同步到云端'/.test(appSrc));
ok('阅读态是纯阅读：分类胶囊不响应点击，也不给 ▾ 暗示',
  /if \(!document\.body\.classList\.contains\('sj-note-edit'\)\) return;/.test(appSrc)
  && /body\.sj-note-open:not\(\.sj-note-edit\) \.sj-meta-cat \{[\s\S]{0,160}pointer-events: none/.test(styleSrc)
  && /body\.sj-note-open:not\(\.sj-note-edit\) \.sj-meta-cat::after \{ content: none; \}/.test(styleSrc));
ok('编辑态点胶囊仍能换类',
  /META_CAT\.addEventListener\('click'/.test(appSrc)
  && /if \(note\) openCategoryPicker\(note\);/.test(appSrc));
ok('编辑态底栏「⋯」只留「移动到分类」',
  (function () {
    const a = appSrc.indexOf('function openNoteMore(anchor, note)');
    const b = appSrc.indexOf('function openNoteMore(anchor, note)') >= 0
      ? appSrc.indexOf('\n    }', a) : -1;
    const body = a >= 0 && b > a ? appSrc.slice(a, b) : '';
    return /移动到分类/.test(body) && !/Markdown 源码/.test(body)
      && !/历史版本/.test(body) && !/同步到云端/.test(body);
  })());
ok('阅读态大标题下有只读标签容器（阅读态原来整行藏掉了标签）',
  /id="sjRhTags"/.test(indexSrc)
  && /const RH_TAGS = \$\('#sjRhTags'\)/.test(appSrc)
  && /RH_TAGS\.innerHTML = tags\.map\(\(t\) => `<span class="tag-chip is-ro">/.test(appSrc)
  && /RH_TAGS\.classList\.toggle\('hidden', !tags\.length\)/.test(appSrc));
ok('阅读态标签只读：不渲染移除按钮，改完标签跟着刷新',
  !/RH_TAGS[\s\S]{0,200}tag-x/.test(appSrc)
  && /if \(window\.SJRefreshNoteMeta\) window\.SJRefreshNoteMeta\(\);/.test(appSrc)
  && /\.sj-rh-tags \{[\s\S]{0,120}display: flex; flex-wrap: wrap;/.test(styleSrc));
ok('列表首页仍是原来那套全局菜单（两套内容按有没有打开笔记切）',
  /act: 'tree', label: '目录分类'/.test(appSrc) && /MORE_ROWS/.test(appSrc));
ok('笔记菜单的动作全转手给现有按钮，不另写一套',
  /if \(act === 'n-share'\) \{ const el = \$\('#exportBtn2'\);/.test(appSrc)
  && /if \(act === 'n-star'\) \{ const el = \$\('#starBtn'\);/.test(appSrc)
  && /if \(act === 'n-delete'\) \{ const el = \$\('#deleteNoteBtn'\);/.test(appSrc)
  && /if \(act === 'n-md'\) \{ showMarkdownSource\(\);/.test(appSrc));
ok('菜单分隔线与红字「删除笔记」有样式',
  /\.sj-more-menu \.sj-more-sep \{/.test(styleSrc)
  && /\.sj-more-menu \.sj-more-row\.is-danger/.test(styleSrc));

console.log('\n附件面板：阅读态可折成窄条 + 与样式面板互斥');
ok('附件面板三态（open / collapsed / hidden）有统一读写函数',
  /function attachStateOf\(\) \{/.test(appSrc) && /function setAttachState\(state\) \{/.test(appSrc));
ok('阅读态点 ⌄ 压成窄条、箭头翻上来；编辑态仍是整块收起',
  /classList\.toggle\('is-collapsed'\)/.test(appSrc)
  && /body\.sj-note-open:not\(\.sj-note-edit\) \.attach-panel\.is-collapsed \{/.test(styleSrc)
  && /\.attach-panel\.is-collapsed #closeAttachBtn \.ico \{[\s\S]{0,120}rotate\(180deg\)/.test(styleSrc));
ok('窄条整条是抓手（按钮铺满 + 点面板也能展开）',
  /#closeAttachBtn \{\s+width: 100%; height: 26px/.test(styleSrc)
  && /\$\('#attachPanel'\)\.addEventListener\('click'/.test(appSrc));
ok('阅读态默认摊开（有附件时）',
  /setAttachState\(note\.attachments && note\.attachments\.length \? 'open' : 'hidden'\)/.test(appSrc));
ok('点 A 先收附件面板，关掉样式面板原样还原',
  /function openStyleSheet\(\) \{[\s\S]{0,400}collapseAttachForSheet\(\)/.test(appSrc)
  && /function closeStyleSheet\(\) \{[\s\S]{0,1600}restoreAttachAfterSheet\(\)/.test(appSrc)
  && /let ssAttachPrev = null;/.test(appSrc));
/* 手机点 ⌄ / + 会先闪一块淡蓝：窄屏那套配色里 --accent 是华为蓝，
   系统点击高亮压上去就成一块蓝底；折叠成窄条后按钮铺满整条，更明显。 */
ok('附件面板与表头按钮吃掉系统点击高亮',
  /\.attach-panel, \.attach-panel \* \{\s*-webkit-tap-highlight-color: transparent;/.test(styleSrc));
ok('触屏上不再留 :hover 底色（表头两颗按钮）',
  /@media \(hover: none\) \{[\s\S]{0,160}\.attach-head \.icon-btn:hover,[\s\S]{0,80}\.attach-head \.icon-btn:focus \{ background: transparent; \}/.test(styleSrc));

console.log('\n收藏星标用金色');
ok('--star-gold 在手机端与电脑端四套主题里都有',
  (styleSrc.match(/--star-gold: #(?:c8892a|d8a44a|e8a317);/g) || []).length >= 4);
ok('收藏按钮 / 列表卡 / 侧栏树三处星标都用金色',
  /#starBtn\.on \{ color: var\(--star-gold\); \}/.test(styleSrc)
  && /#starBtn\.on svg \{ fill: var\(--star-gold\); stroke: var\(--star-gold\); \}/.test(styleSrc)
  && /\.note-card-title svg \{[\s\S]{0,160}var\(--star-gold\)/.test(styleSrc)
  && /\.tree-note-title svg \{[\s\S]{0,160}var\(--star-gold\)/.test(styleSrc));
ok('电脑端（≥981px）中性风里星标仍然是金（功能色不跟着变灰）',
  /@media \(min-width: 981px\)[\s\S]*--star-gold: #c8892a;[\s\S]*--star-gold: #d8a44a;/.test(styleSrc));

console.log('\n编辑面收敛（Markdown / 富文本双模式已下线）');ok('顶栏不再有格式分段开关', !/id="formatSwitch"/.test(indexSrc) && !/data-format="md"/.test(indexSrc));
ok('Markdown 源码框已从 DOM 移除', !/id="mdPane"/.test(indexSrc) && !/id="mdInput"/.test(indexSrc));
ok('预览栏已从 DOM 移除', !/id="previewPane"/.test(indexSrc));
ok('编辑面只有 richPane 一个', !/id="mdPane"/.test(indexSrc) && !/id="previewPane"/.test(indexSrc)
  && /id="richPane"/.test(indexSrc) && !/\$\('#mdPane'\)/.test(appSrc));
ok('存储层单一化：正文恒为富文本，无 md 渲染分支',
  /function noteHtml\(/.test(appSrc)
  && /normalizeRich\(DOMPurify\.sanitize\(c\)\)/.test(appSrc)
  && !/note\.format === 'rich'/.test(appSrc));
/* 手机端上色时 Chrome 会把 caret-color 一起写进 span；桌面端没有自绘光标，
   这条样式同步过去就是「光标隐形」。载入即抹掉，别再往外带。 */
ok('正文载入体检：抹掉内联 caret-color、清掉列表里的野段落',
  /function normalizeRich[\s\S]{0,900}caret-color/.test(appSrc)
  && /querySelectorAll\('ol, ul'\)/.test(appSrc));

/* 原生 select 的宽度按「最长的选项」算，显示「默认」「16」这种短内容时右侧空一大截。
   现在宽度由 fitSel() 量当前显示文字写死（field-sizing 按最长选项算、且 iOS Safari
   不认，2026-11-22 换成自己量），CSS 里只留自绘箭头与内边距。 */
ok('字体/字号下拉的宽度自己量，箭头紧贴文字',
  (function () {
    // 行首要锚住：`.tb-pick .tb-select { ... }` 里也含 `.tb-select {`
    const a = styleSrc.search(/^\.tb-select \{/m);
    const b = a >= 0 ? styleSrc.indexOf('}', a) : -1;
    const block = a >= 0 && b > a ? styleSrc.slice(a, b) : '';
    return !/field-sizing\s*:/.test(block)
      && /appearance: none/.test(block)
      && /background-image: url\("data:image\/svg\+xml/.test(block)
      && /padding: 0 18px 0 8px/.test(block)
      && /function fitSel\(s\)/.test(appSrc)
      && /function measureSel\(s\)/.test(appSrc)
      && /white-space:pre/.test(appSrc);
  })());
ok('下拉有保底宽度、点开不描黑框',
  /\.tb-select \{[\s\S]{0,300}min-width: 52px/.test(styleSrc)
  && /\.tb-select\.is-size \{ min-width: 40px; \}/.test(styleSrc)
  && /s\.className = 'tb-select' \+ \(cls \? ' ' \+ cls : ''\)/.test(appSrc)
  && /execFontSize\(v\), 'is-size', 'Z'\)/.test(appSrc)
  && /\.tb-select:focus-visible \{ outline: none;/.test(styleSrc));
/* 字号和行距都只显示一个数字，光看「28 + 箭头」分不出谁是谁 → 前面挂字母标。 */
ok('字体/字号/行距各自带标签 T / Z / 行',
  /execFont\('fontName', v\), '', 'T'\)/.test(appSrc)
  && /'is-size', 'Z'\)/.test(appSrc) && /'is-lh', '行'\)/.test(appSrc)
  && /const wrap = document\.createElement\('label'\);[\s\S]{0,200}wrap\.className = 'tb-pick'/.test(appSrc)
  && /\.tb-pick-tag \{[\s\S]{0,300}font-size: 11\.5px/.test(styleSrc));
ok('深色主题下下拉箭头换一套颜色（不至于黑底看不见）',
  /html\[data-theme="dark"\] \.tb-select \{\s*background-image: url\("data:image\/svg\+xml/.test(styleSrc));
/* 行距原来三档点击循环，改成像素下拉（和字号同一套控件）。
   档位下界不能写死 16：手机正文 19px 时 16–22 四档会被 line-height 的
   1.1em 兜底整体吃掉，选了没反应 —— 2026-11-22 复查后改由 lhSteps() 生成。 */
ok('行距是像素下拉，档位按当前设备正文基准字号生成',
  /const LH_PX = lhSteps\(\)/.test(appSrc)
  && /function lhSteps\(\) \{[\s\S]{0,260}v \+= 2/.test(appSrc)
  && /function lhBounds\(\) \{[\s\S]{0,120}Math\.ceil\(lhBasePx\(\) \* 1\.2 \/ 2\) \* 2/.test(appSrc)
  && /state\.richLh = clampLh\(state\.richLh\);/.test(appSrc)
  && /state\.richLh = px;/.test(appSrc)
  && !/LH_STEPS/.test(appSrc) && !/LH_LABELS/.test(appSrc)
  && /setProperty\('--sj-rich-lh', state\.richLh \+ 'px'\)/.test(appSrc)
  && /if \(v < 3\) return Math\.min\(64, Math\.max\(14, Math\.round\(v \* 16 \/ 2\) \* 2\)\)/.test(appSrc)
  && /line-height: max\(var\(--sj-rich-lh, 28px\), 1\.1em\)/.test(styleSrc));
/* 阅读态原来固定 1.78 不吃这个设置，用户要求跟着走。手机端编辑态也统一。 */
ok('阅读态正文也吃同一套像素行距',
  /body\.sj-note-open:not\(\.sj-note-edit\) \.rich-pane \{[\s\S]{0,220}line-height: max\(var\(--sj-rich-lh, 28px\), 1\.1em\)/.test(styleSrc)
  && !/line-height: 1\.78/.test(styleSrc) && !/line-height: 1\.86/.test(styleSrc));
ok('行距下拉回显当前值（不在预设档就临时补一档）',
  /function syncLhPicker\(\)[\s\S]{0,700}data-temp/.test(appSrc)
  && /tbLhSel\.value = v;/.test(appSrc)
  && /\.tb-select\.is-lh \{ min-width: 42px; \}/.test(styleSrc));
ok('Markdown 笔记一被编辑即升级为富文本', /note\.content = \$\('#richPane'\)\.innerHTML;[\s\S]{0,80}note\.format = 'rich';/.test(appSrc));
ok('新建笔记默认富文本', /categoryId: target, title: '', content: '',[\s\S]{0,120}format: 'rich'/.test(appSrc));
ok('旧的 textarea 事件已摘掉', !/addEventListener\('input', onMdInput\)/.test(appSrc)
  && !/function onMdInput\(/.test(appSrc));
ok('旧的格式切换函数已摘掉', !/function switchFormat\(/.test(appSrc));
ok('md 专属的插入助手已摘掉', !/function prefixLine\(/.test(appSrc) && !/function wrapSel\(/.test(appSrc));
ok('富文本补上了表格插入', /function insertRichTable\(/.test(appSrc));
ok('源码降级为二级入口', /function showMarkdownSource\(/.test(appSrc) && /Markdown 源码/.test(appSrc));
ok('Markdown 笔记没被编辑就不改写数据', !/note\.content = \$\('#mdInput'\)\.value;/.test(appSrc));

console.log('\n阅读态舒适度（P1：Aa 面板 / 看大图 / 下拉量宽）');
/* 字号、行距都是本机显示偏好：只改 CSS 变量，不动笔记内容一个字节。
   所以它在纯阅读态也能开 —— 觉得字小了不必先切进编辑。 */
ok('阅读态顶栏有 Aa，和编辑并排且只在阅读态出现',
  /data-act="nh-aa" aria-label="字体与行距"/.test(indexSrc)
  && /if \(a === 'nh-aa'\) \{ aaToggle\(\); return; \}/.test(appSrc)
  && /\.sj-nh-aa \{[\s\S]{0,600}body\.sj-note-open:not\(\.sj-note-edit\) \.sj-nh-aa \{ display: flex; \}/.test(styleSrc));
ok('Aa 面板只有字号、行距两行滑杆 + 恢复默认',
  /id="sjAaFs"/.test(indexSrc) && /id="sjAaLh"/.test(indexSrc)
  && /data-act="aa-reset"/.test(indexSrc)
  && /function aaSync\(\)/.test(appSrc) && /function aaOpen\(\)/.test(appSrc));
ok('Aa 只改显示偏好：写 --sj-rich-fs，不标脏、不写笔记',
  /state\.richFs = clampFs\(AA_FS\.value\);[\s\S]{0,260}localStorage\.setItem\('sj_rich_fs'/.test(appSrc)
  && /setProperty\('--sj-rich-fs', state\.richFs \+ 'px'\)/.test(appSrc)
  && !/state\.richFs[\s\S]{0,120}markDirty\(\)/.test(appSrc));
ok('正文字号吃 --sj-rich-fs（宽屏 16 / 手机 19 兜底）',
  /\.rich-pane\.markdown-body \{[\s\S]{0,120}font-size: var\(--sj-rich-fs, 16px\)/.test(styleSrc)
  && /body\.sj-note-edit \.rich-pane \{[\s\S]{0,120}font-size: var\(--sj-rich-fs, 19px\)/.test(styleSrc));
ok('字号改了行距下界跟着改，档位重排',
  /function lhBasePx\(\) \{ return state\.richFs \|\| \(NARROW\(\) \? 19 : 17\); \}/.test(appSrc)
  && /function rebuildLhOptions\(\)/.test(appSrc)
  && /applyRichFs\(\);[\s\S]{0,80}applyRichLh\(\);/.test(appSrc));
/* 阅读态纯只读之后点图片彻底静默了，补一层看大图；编辑态仍是「选中并弹图片条」。 */
ok('阅读态点图片开大图，编辑态点图片仍是选中',
  /function lightboxOpen\(src, alt\)/.test(appSrc)
  && /if \(img\) \{ e\.preventDefault\(\); lightboxOpen\(img\.currentSrc \|\| img\.src, img\.alt\); \}/.test(appSrc)
  && /if \(inRich\) \{ e\.preventDefault\(\); selectImg\(inRich\); return; \}/.test(appSrc)
  && /id="sjLightbox"/.test(indexSrc)
  && /\.sj-lightbox\.hidden \{ display: none; \}/.test(styleSrc));
ok('大图层点任意处关闭，Esc 也能关',
  /LB\.addEventListener\('click', lightboxClose\)/.test(appSrc)
  && /if \(LB && !LB\.classList\.contains\('hidden'\)\) \{ lightboxClose\(\); return; \}/.test(appSrc));

console.log('\n标题 / 分类三角 / 导出 Word 图片（2026-11-22）');
ok('页面标题就是「拾笺」', /<title>拾笺<\/title>/.test(indexSrc));
ok('PWA 名称就是「拾笺」', (() => {
  try { return JSON.parse(fs.readFileSync(path.join(CLOUD, 'manifest.webmanifest'), 'utf8')).name === '拾笺'; }
  catch (_) { return false; }
})());
ok('分类名旁的小三角改成 12px SVG 箭头（原来是 9px 的 ▾ 字符）',
  /<svg class="meta-caret"/.test(appSrc)
  && /\.meta-caret \{[\s\S]{0,120}width: 12px; height: 12px/.test(styleSrc)
  && !/\.meta-caret \{ font-style: normal; font-size: 9px/.test(styleSrc));
ok('侧栏分类树的展开箭头放大到 13px',
  /\.caret svg \{ width: 13px; height: 13px; \}/.test(styleSrc));

console.log('\n结果：' + pass + ' 通过，' + fail + ' 失败');
process.exit(fail ? 1 : 0);
