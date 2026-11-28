/* 拾笺 · 回归测试（纯 Node，无外部依赖）
   运行：node 拾笺云端/tests/run.js
   覆盖：① SW 版本/访问码白名单（防 v1.7.2 回归）；② 中文全文检索；
         ③ 同步冲突判定；④ 发布前静态校验（版本/旧码/语法/共享文件/VBS 编码）。
   来源：历史提交 a1882fe 的 tests/run.js，按当前基线重建。
   注意：构建号只有 build.json 一份真源（node scripts/bump-build.js），
         换版本不要手改下面的 BUILD；访问码换版时改 SC。 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const cp = require('child_process');
const crypto = require('crypto');

const CLOUD = path.join(__dirname, '..');
const DESKTOP = path.join(CLOUD, '..', '拾笺');
const BUILD = '2026-11-28-203';
const SC = 'X4WPKTHLIN';
const SHARED = ['export.js', 'sjplus.js', 'sjplus.css', 'backlinks.js', 'conflict.js', 'diffview.js', 'fts.js',
  /* 2026-11-26：富文本⇄Markdown 的内核也收成两端一份，
     真源在 拾笺/public，由 拾笺/scripts/sync-shared.js 推过来。 */
  'mdconv-core.js', 'richtext-core.js',
  /* 2026-11-26：分类身份 / 去重判定也收成两端一份，
     否则「算不算重复」各算一套，去重本身会变成新的重复源。 */
  'cat-core.js',
  /* 2026-11-28：笔记层纯逻辑（转义 / 空判定 / 排序 / 高亮）收成两端一份。
     这四类以前在两端 app.js 里各写一遍，escapeHtml 少一处转义就是 XSS。 */
  'notes-core.js',
  /* 2026-11-28：两端接口契约（请求体字段白名单 + 差分端点表）。 */
  'api-contract.js'];

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
/* 构建号只有 build.json 一份真源（2026-11-28）。以前手工改 8 个文件，
   改漏一处就是「页面提示发现新版本、SW 还咬着旧壳」。这里逐文件扫日期串：
   任何一处与 build.json 不同、或某个文件一处都没有，都算漂移。 */
const buildSrc = fs.readFileSync(path.join(CLOUD, '..', 'build.json'), 'utf8');
const buildJson = JSON.parse(buildSrc);
ok('build.json 就是测试认的那个版本', buildJson.build === BUILD);
const bumpScript = path.join(CLOUD, '..', 'scripts', 'bump-build.js');
ok('构建号有唯一写入入口（scripts/bump-build.js，带 --check）',
  fs.existsSync(bumpScript) && /--check/.test(fs.readFileSync(bumpScript, 'utf8')));
const drift = [];
for (const f of ['app.js', 'dl.html', 'index.html', 'mobilesync.js', 'pwa.js', 'quick.html', 'sw.js', 'tests/run.js']) {
  const toks = (fs.readFileSync(path.join(CLOUD, f), 'utf8').match(/20\d\d-\d\d-\d\d-\d{3}/g) || []);
  if (!toks.length || toks.some((t) => t !== BUILD)) drift.push(f + '(' + toks.join('|') + ')');
}
ok('8 个文件的构建号全部等于 build.json，没有手改漏掉的', drift.length === 0);
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
/* 图片与 Markdown 渲染按功能拆到了 app-media.js；跨文件断言用合并源。 */
const mediaSrc = fs.readFileSync(path.join(CLOUD, 'app-media.js'), 'utf8');
const uiSrc = appSrc + '\n' + mediaSrc;
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
  appSrc.indexOf("act === 'batch'") >= 0 &&
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
/* 手机端真机反馈（构建 193）：分类页只给汇总数（学习素材干脆一个数都没有），
   和电脑端目录树的「本层 + 子分类」对不上。两边现在同一口径。 */
ok('手机分类页的计数也拆成「本层 + 子分类」，与电脑端目录树一致',
  /const \{ total, own, sub \} = SJCats\.catCounts\(state\.categories, state\.notes, cat\.id\);/.test(appSrc) &&
  /const countText = sub > 0 \? `\$\{own\} \+ \$\{sub\}` : String\(total\);/.test(appSrc) &&
  /title="本层 \$\{own\} 篇、子分类 \$\{sub\} 篇"/.test(appSrc));
ok('根文件夹既有数字又有展开箭头（以前一颗 ⌄ 顶掉了数字）',
  /countHtml \+ `<button type="button" class="sj-cat-toggle/.test(appSrc));
ok('数字与箭头之间的间距收窄，长名字仍可省略',
  styleSrc.indexOf('.sj-cat-row .sj-cat-n {') >= 0 &&
  /\.sj-cat-row \.sj-cat-n \{[^}]*white-space: nowrap/.test(styleSrc) &&
  /\.sj-cat-row \.sj-cat-n \+ \.sj-cat-toggle \{ margin-left: -8px; \}/.test(styleSrc));
/* 真机反馈（构建 194）：文字「⌄」在 20px 字号下又粗又飘，和 15px 的数字不搭。
   换成 15px 线性小箭头，收起时只转 svg 本身。 */
ok('展开箭头改成线性小图标，不再是 20px 的文字「⌄」',
  /class="sj-cat-toggle\$\{sheetCollapsed\.has\(cat\.id\) \? ' closed' : ''\}"[\s\S]{0,120}?<svg viewBox="0 0 24 24"/.test(appSrc) &&
  !/aria-label="展开或收起">⌄</.test(appSrc) &&
  /\.sj-cat-toggle svg \{[^}]*width: 15px; height: 15px/.test(styleSrc) &&
  /\.sj-cat-toggle\.closed svg \{ transform: rotate\(-90deg\); \}/.test(styleSrc));
/* 「1 + 3」本身不自明：读书笔记本层还有一篇「第二条随手记」，用户会以为算错。
   分隔行里补一行淡色图例，把口径写在界面上。 */
ok('文件夹标题旁给出「本层篇数 + 子分类篇数」图例，顺序固定',
  appSrc.indexOf('sj-cat-legend') >= 0 &&
  appSrc.indexOf('（本层篇数 + 子分类篇数）') >= 0 &&
  /\.sj-cat-legend \{[^}]*font-size: 12px/.test(styleSrc));
/* 用户 2026-11-28 定：加号前后都是「篇数」，不是「子分类个数」，顺序固定为本层在前。
   这层意思必须写在界面上，否则 1 + 2 / 1 + 3 会被读成「1 个文件夹 + N 篇」。 */
ok('帮助里写死口径：加号前后都是篇数，不是子分类个数',
  appSrc.indexOf('加号前后都是笔记篇数，不是子分类个数') >= 0 &&
  appSrc.indexOf('本层篇数 + 子分类篇数') >= 0);
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
/* 2026-11-28：从「只拒绝」升级为「给出明确出口」——
   整枝进回收站，或只拆这一层把内容并到父级；两条都要用户点选。 */
ok('分类下有内容时给出两条明确的删除路径，而不是只弹一句拒绝',
  /function openChoice\(/.test(appSrc)
  && /onClick: \(\) => applyDeleteCat\(cat, 'delete'/.test(appSrc)
  && /onClick: \(\) => applyDeleteCat\(cat, 'move'/.test(appSrc));
ok('整枝删除走 strategy=delete（笔记进回收站），只拆一层走 strategy=move',
  /api\(`\/api\/categories\/\$\{cat\.id\}\?strategy=\$\{strategy\}`/.test(appSrc)
  && /const destName = parent \? parent\.name : '未分类'/.test(appSrc));
ok('提示里的数字和实际删除范围同源（整棵子树）',
  /state\.notes\.filter\(\(n\) => ids\.has\(n\.categoryId\)\)/.test(appSrc)
  && /本层 \$\{own\} 篇、子分类 \$\{subNotes\} 篇/.test(appSrc));
ok('空分类仍然直接删，不多问一遍',
  /if \(!affected\.length && !subs\) \{/.test(appSrc) && /toast\('类别已删除'\)/.test(appSrc));
/* 树上的数字拆成「本层 + 子分类」，只给总数会被当成算错。 */
ok('树上计数显示「本层 + 子分类」',
  /const countText = subCnt > 0 \? `\$\{ownCnt\} \+ \$\{subCnt\}` : String\(total\)/.test(appSrc));
/* 分类改父级：本地接口早支持 parentId，界面现在补上了入口。 */
ok('分类可以「移动到…」，候选排除自身与后代',
  /function moveCategory\(cat\)/.test(appSrc)
  && /const block = SJCats\.subtreeIds\(state\.categories, cat\.id\)/.test(appSrc)
  && /parentId = sel\.value \|\| null/.test(appSrc));
/* 2026-11-28：同一条口径以前在桌面树、手机树、手机分类面板、删除提示各算一遍，
   193 那次漏的就是手机面板。现在算法只有内核一处，界面不再自己遍历子树。 */
ok('手机分类面板的计数也取内核，不再自己算一遍',
  /const \{ total, own, sub \} = SJCats\.catCounts\(state\.categories, state\.notes, cat\.id\)/.test(appSrc));
ok('app.js 里已无内联子树遍历（`ids.has(c.parentId)` 这种循环清零）',
  !/ids\.has\(c\.parentId\)/.test(appSrc) && !/block\.has\(c\.parentId\)/.test(appSrc)
  && /const ids = SJCats\.subtreeIds\(state\.categories, cat\.id\)/.test(appSrc));
/* 口径写进应用内说明，手机端也能随手查。 */
ok('目录旁有「分类与归属说明」入口（手机端同样）',
  /id="helpBtn"/.test(indexSrc) && /function openHelp\(/.test(appSrc)
  && /一篇笔记只属于一个分类/.test(appSrc) && /\.help-list \{/.test(styleSrc));
/* 父分类列表汇总子分类的笔记。2026-11-27 用户定：一份列表里要统一，
   直接属于当前分类的那篇也要标层级路径（学习素材 / 前端开发），
   否则同一屏有的带路径有的不带，看不出这篇在哪一层。 */
ok('平铺列表每篇都标出完整层级路径（含当前分类直属的，手机端同样）',
  /const fromCat = \(n\) => \{[\s\S]{0,220}?catPath\(n\.categoryId\)/.test(appSrc)
  && /\$\{fromCat\(n\)\}/.test(appSrc)
  && appSrc.indexOf('const scopeCat') < 0
  && /\.note-card-foot \.sj-from \{/.test(styleSrc));
ok('没有分类的笔记写「未分类」', /escapeHtml\(path\) \|\| '未分类'/.test(appSrc));
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
/* 一级分类（学习素材 / 工作记录 …）以前这块位置是一个 aria-hidden 的空白占位，
   于是这一页里根文件夹既不能改名也不能删除，只有子分类有把手。 */
ok('一级分类也有把手：与子分类同一颗 mgr-grip，不再留空白占位',
  appSrc.indexOf('sj-mgr-grip-space') < 0 &&
  /isRoot \? '点击编辑文件夹，拖动排序' : '点击编辑类别，拖动排序'/.test(appSrc) &&
  appSrc.indexOf("if (a === 'mgr-grip') { openCatEditor(act.dataset.id); return; }") >= 0);
ok('根文件夹拖动整张卡片挪位（卡片即一棵子树），不靠 elementFromPoint',
  /isRoot: row\.classList\.contains\('sj-mgr-root'\)/.test(appSrc) &&
  /card: row\.closest\('\.sj-mgr-card\[data-root\]'\)/.test(appSrc) &&
  /MGR_BODY\.insertBefore\(catDrag\.card, ref \|\| MGR_BODY\.querySelector\('\.sj-mgr-new-card'\)\)/.test(appSrc) &&
  /\.sj-mgr-card\.sj-mgr-dragging \{/.test(styleSrc));
ok('根文件夹的编辑弹窗不摆色板：色条只对子分类有意义',
  /ED_SW\.style\.display = cat\.parentId \? 'flex' : 'none'/.test(appSrc) &&
  /ED_CHIP\.style\.display = cat\.parentId \? '' : 'none'/.test(appSrc));

/* ---- 分类去重：已改为全自动（2026-11-26）----
   重复应当被拦在源头（建类查重 / 同步合并 / 启动自愈），
   而不是让用户去管理页点「合并同名分类」。手动入口及相关逻辑已删除。 */
ok('管理页不再有手动合并 / 撤销入口',
  appSrc.indexOf('mgr-merge-dups') < 0 && appSrc.indexOf('mgr-undo-merge') < 0
  && appSrc.indexOf('previewMergeDups') < 0 && appSrc.indexOf('MERGE_UNDO_KEY') < 0
  && appSrc.indexOf('合并同名分类') < 0);
ok('去重判定已收进共享内核，界面不再自带一套 dupGroups / mergeScore',
  appSrc.indexOf('function dupGroups(cats)') < 0 && appSrc.indexOf('function mergeScore(') < 0);
ok('建类 / 改名在提交前先判重名（同一父级 + 同名）',
  appSrc.indexOf('function dupCatError(name, parentId, excludeId)') >= 0
  && /window\.SJCats\.siblingOf\(state\.categories, name, parentId \|\| null, excludeId\)/.test(appSrc));
ok('手动合并的样式一并清掉，不留死代码',
  styleSrc.indexOf('.sj-mgr-fix-card') < 0 && styleSrc.indexOf('.sj-merge-list') < 0);


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
  /data-act="nh-edit" aria-label="编辑"/.test(indexSrc)
  && /if \(a === 'nh-edit'\) \{ setNoteMode\('edit'\); return; \}/.test(appSrc)
  && !/setNoteMode\('edit', \{ x: e\.clientX, y: e\.clientY \}\)/.test(appSrc)
  && !/阅读态点图片：同样进编辑/.test(appSrc)
  && /\.sj-nh-edit \{[\s\S]{0,500}body\.sj-note-open:not\(\.sj-note-edit\) \.sj-nh-edit \{ display: flex; \}/.test(styleSrc)
  /* 阅读态顶栏右侧要让开固定的四点按钮（52 + 12 间隙）；110px 会把标题挤掉近 50px */
  && /body\.sj-note-open:not\(\.sj-note-edit\) \.sj-note-head \{ padding-right: 64px; \}/.test(styleSrc));

/* 同一个动作两端必须是同一个符号：以前手机端是一颗写着「编辑」的胶囊，
   电脑端是一枚铅笔，同一件事给人两种视觉信号。现在统一成铅笔。 */
ok('手机端「编辑」用与电脑端同一枚铅笔图标，不再是文字胶囊', (() => {
  const mine = (indexSrc.match(/data-act="nh-edit"[\s\S]{0,260}?<\/button>/) || [''])[0];
  const deskSrc = fs.readFileSync(path.join(DESKTOP, 'public', 'index.html'), 'utf8');
  const desk = (deskSrc.match(/id="readEditBtn"[\s\S]{0,260}?<\/button>/) || [''])[0];
  const paths = (s) => (s.match(/<path d="[^"]+"/g) || []).join('|');
  return paths(mine).length > 20 && paths(mine) === paths(desk) && !/编辑</.test(mine);
})());
ok('手机端「编辑」按钮形状与同排图标一致（40px 圆形幽灵按钮）',
  /\.sj-nh-edit \{[\s\S]{0,400}width: 40px; height: 40px;[\s\S]{0,120}border-radius: 50%/.test(styleSrc)
  && !/\.sj-nh-edit \{[\s\S]{0,400}font-size: 13px/.test(styleSrc));

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
  uiSrc.indexOf('function toRichEditor()') >= 0 &&
  /function toRichEditor\(\)[\s\S]{0,420}noteHtml/.test(appSrc) &&
  /setNoteMode[\s\S]{0,2200}toRichEditor\(\);/.test(appSrc) &&
  uiSrc.indexOf('if (isNarrow()) return;') >= 0 &&
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

ok('「样式」面板的颜色与纸张：7 颗色点、5 张纸',
  indexSrc.indexOf('data-color="#d13b32"') >= 0 &&
  indexSrc.indexOf('data-color="default"') >= 0 &&
  (indexSrc.match(/class="sj-ss-dot/g) || []).length >= 7 &&
  (indexSrc.match(/class="sj-ss-paper/g) || []).length >= 5 &&
  /html\[data-theme="light"\] body\.sj-note-open\[data-paper="2"\] \.editor-pane \{ background: #e9e1cd; \}/.test(styleSrc) &&
  /\.sj-ss-range \{[\s\S]{0,260}appearance: none/.test(styleSrc) &&
  /\.sj-style-sheet \{[\s\S]{0,220}position: fixed; z-index: 92/.test(styleSrc));

ok('纸张底色单篇设置：按笔记 id 存本机映射，切笔记各自恢复（2026-11-23）',
  appSrc.indexOf("const PAPER_MAP_KEY = 'sj_paper_by_note_v1';") >= 0 &&
  appSrc.indexOf("const PAPER_DEFAULT_KEY = 'sj_paper_v1';") >= 0 &&
  /function paperOf\(note\)[\s\S]{0,220}paperMap\(\)\[note\.id\]/.test(appSrc) &&
  /function setPaperOf\(note, idx\)[\s\S]{0,200}m\[note\.id\] = String\(idx\)/.test(appSrc) &&
  /function applyPaperTo\(note, idx\)[\s\S]{0,120}document\.body\.dataset\.paper = String\(idx\)/.test(appSrc) &&
  /setAttachState\(note\.attachments && note\.attachments\.length \? 'open' : 'hidden'\);\s*\n\s*\/\* 换笔记：纸张底色[\s\S]{0,80}document\.body\.dataset\.paper = paperOf\(note\);/.test(appSrc) &&
  /function applyPaper\(idx\)[\s\S]{0,120}applyPaperTo\(currentNote\(\), v\)/.test(appSrc) &&
  !/const PAPER_KEY = 'sj_paper_v1';/.test(appSrc));

ok('底栏格式按钮用「A≡」文本样式图标，粗描边 2.2',
  /data-act="fmt"[\s\S]{0,200}ico-format-text/.test(indexSrc) &&
  /class="ico ico-format-text"[\s\S]{0,260}M3\.2 15\.8L7\.4 5\.2l4\.2 10\.6/.test(indexSrc) &&
  /M14 7h6\.6[\s\S]{0,120}M3 20h17\.6/.test(indexSrc) &&
  /\.sj-edit-bar button \.ico-format-text \{ stroke-width: 2\.2; \}/.test(styleSrc));

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

ok('自绘光标不再闪到全透明：原生被藏时不能出现「一根光标都没有」',
  /* 不再用 CSS animation 把 opacity 打到 0——内核卡在透明帧时原生又被藏 */
  !/animation:\s*sj-caret-blink/.test(styleSrc) &&
  !/@keyframes\s+sj-caret-blink/.test(styleSrc) &&
  /* 最暗只到 .38，且由 JS 定时器切 .blink-off（卡住也看得见） */
  /\.sj-caret-mark\.blink-off \{ opacity: \.38; \}/.test(styleSrc) &&
  /setInterval\(\(\) => \{[\s\S]{0,180}classList\.toggle\('blink-off'\)[\s\S]{0,40}\}, 530\)/.test(appSrc) &&
  /!m\.classList\.contains\('hidden'\)/.test(appSrc));

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
  /* 分类编辑弹窗是同一个毛病的漏网之鱼（构建 196）：opacity 从 .4 起步，
     底下那层分类管理页会透出来，看着就是「闪一下」。现在只滑不淡，
     位移、时长与样式面板对齐；遮罩也改成跟着一起淡入，不再瞬间铺满。 */
  /@keyframes sj-editor-up \{[\s\S]{0,80}translateY\(18px\)[\s\S]{0,80}translateY\(0\)/.test(styleSrc) &&
  !/@keyframes sj-editor-up \{[\s\S]{0,130}opacity/.test(styleSrc) &&
  /\.sj-editor-mask \{[\s\S]{0,170}animation: sj-editor-fade/.test(styleSrc) &&
  /@keyframes sj-editor-fade \{ to \{ opacity: 1; \} \}/.test(styleSrc) &&
  /* 手机上不能自动聚焦：软键盘一弹，贴底的弹窗被整个顶上去，和入场动画叠成「闪」 */
  /window\.matchMedia\('\(pointer: fine\)'\)\.matches/.test(appSrc) &&
  !/\{ ED_NAME\.focus\(\); ED_NAME\.select\(\); \} \}, 40\)/.test(appSrc) &&
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
ok('列表首页全局菜单不再放「目录分类」（分类切换走首页大标题 ▾）',
  !/act: 'tree'/.test(appSrc) && !/label: '目录分类'/.test(appSrc) && /MORE_ROWS/.test(appSrc));
ok('导入/导出、分享/导出的子菜单点空白能收起，再点菜单按钮不会叠在一起',
  /* 菜单按钮 stopPropagation，document 的 click 关 ctx 收不到；
     改在 capture 阶段的 pointerdown 里两层一起收，按钮自己 click 也主动 hideCtx */
  /document\.addEventListener\('pointerdown', \(e\) => \{[\s\S]{0,420}e\.target\.closest\('#ctxMenu'\)/.test(appSrc) &&
  /if \(MENU && !MENU\.classList\.contains\('hidden'\)\) hideMoreMenu\(\);[\s\S]{0,180}if \(typeof hideCtx/.test(appSrc) &&
  /MORE\.addEventListener\('click', \(e\) => \{[\s\S]{0,280}if \(typeof hideCtx === 'function'\) hideCtx\(\);/.test(appSrc));
ok('笔记卡片 ⋯ 再点一次能收起（同篇 toggle、异篇切换、capture 不抢关）',
  /let ctxNoteId = null;/.test(appSrc)
  && /function noteMenu\(x, y, note\) \{\s*ctxNoteId = note\.id;/.test(appSrc)
  && /function hideCtx\(\) \{[\s\S]{0,120}ctxNoteId = null;/.test(appSrc)
  && /e\.target\.closest\('\[data-more\]'\)\) return;\s*if \(typeof hideCtx/.test(appSrc)
  && /const more = e\.target\.closest\('\[data-more\]'\);[\s\S]{0,320}!ctx\.classList\.contains\('hidden'\) && ctxNoteId === note\.id\) \{\s*hideCtx\(\);\s*return;/.test(appSrc));
ok('点 ⋯ 时卡片不闪淡绿（tap 高亮收掉、触屏 hover 残留收回、常驻态保留）',
  /\.note-card, \.note-more \{ -webkit-tap-highlight-color: transparent; \}/.test(styleSrc)
  && /@media \(hover: none\) \{\s*\.note-card:hover:not\(\.active\):not\(\.selected\) \{ background: var\(--surface\); \}/.test(styleSrc));
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
      && /宽度跟内容走/.test(appSrc)
      && /s\.options\[s\.selectedIndex >= 0 \? s\.selectedIndex : 0\]/.test(appSrc)
      && /white-space:pre/.test(appSrc)
      /* 悬停高亮画在 select 上：块宽 = 框宽 */
      && /\.tb-pick:hover \.tb-select,/.test(styleSrc)
      && /\.tb-pick:focus-within \.tb-select \{ background-color: var\(--surface-2\); color: var\(--text\); \}/.test(styleSrc)
      && !/\.tb-pick:hover \{ background-color/.test(styleSrc);
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
ok('Markdown 笔记一被编辑即升级为富文本', /note\.content = html;[\s\S]{0,80}note\.format = 'rich';/.test(appSrc));
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

console.log('\n图片裁剪（2026-11-23）');
ok('图片宽度条有「裁剪」按钮', /data-w="crop"[^>]*>裁剪</.test(uiSrc));
ok('裁剪按钮接到 openImgCrop', /if \(v === 'crop'\) return openImgCrop\(\)/.test(uiSrc));
ok('裁剪层支持自由 + 原图 + 1:1 / 4:3 / 16:9 比例',
  /key: 'free'/.test(uiSrc) && /key: 'origin'/.test(uiSrc)
  && /key: '1', label: '1:1'/.test(uiSrc) && /key: '43', label: '4:3'/.test(uiSrc)
  && /key: '169', label: '16:9'/.test(uiSrc));
ok('裁剪层有 8 个缩放把手与九宫格线',
  /data-h="nw"/.test(uiSrc) && /data-h="se"/.test(uiSrc)
  && /crop-third-v/.test(uiSrc) && /crop-third-h/.test(uiSrc));
ok('裁剪结果用 canvas 重绘并按原图类型导出',
  /ctx\.drawImage\(s\.img, sx, sy, sw, sh, 0, 0, cv\.width, cv\.height\)/.test(uiSrc)
  && /cv\.toDataURL\(keepPng \? 'image\/png' : 'image\/jpeg', 0\.92\)/.test(uiSrc));
ok('裁剪后替换 img.src 并按原模式落盘',
  /target\.src = out/.test(uiSrc) && /if \(s\.mode === 'rich'\) onRichInput\(\)/.test(uiSrc));
ok('跨域图拉不到时明确提示，不破坏原图',
  /这张图来自外部站点，无法裁剪/.test(uiSrc) && /catch \(_\) \{ return ''; \}/.test(uiSrc));
ok('裁剪层内点击不冒泡，避免误关宽度条清空 imgMode',
  /el\.addEventListener\('click', \(e\) => \{\s*e\.stopPropagation\(\);/.test(uiSrc));
ok('裁剪样式两端一致（z-index 高于宽度条、把手、比例按钮）',
  /\.crop-ui \{[\s\S]{0,80}z-index: 9100/.test(styleSrc)
  && /\.crop-h\[data-h="nw"\]/.test(styleSrc) && /\.crop-bar button\.on/.test(styleSrc));
ok('裁剪逻辑与样式两端逐字节一致', (() => {
  const localApp = fs.readFileSync(path.join(DESKTOP, 'public', 'app-media.js'), 'utf8');
  const localCss = fs.readFileSync(path.join(DESKTOP, 'public', 'style.css'), 'utf8');
  const cut = (s, from, to) => { const a = s.indexOf(from), b = s.indexOf(to, a); return a >= 0 && b > a ? s.slice(a, b) : ''; };
  const a1 = cut(uiSrc, '  /* ---------------------------------------------------------- 图片裁剪', '  function bindImgResize(container, mode) {');
  const a2 = cut(localApp, '  /* ---------------------------------------------------------- 图片裁剪', '  function bindImgResize(container, mode) {');
  const c1 = cut(styleSrc, '/* ============================================================ 图片裁剪 */', '/* ============================================================ 标签管理 */');
  const c2 = cut(localCss, '/* ============================================================ 图片裁剪 */', '/* ============================================================ 标签管理 */');
  return !!a1 && a1 === a2 && !!c1 && c1 === c2;
})());

console.log('\n正文撤销栈（2026-11-23）');
ok('撤销不再依赖原生 execCommand undo',
  !/execCommand\(\s*['"]undo['"]\s*\)/.test(appSrc)
  && !/execCommand\(\s*['"]redo['"]\s*\)/.test(appSrc));
ok('有应用级 HTML 快照栈与 richUndo/richRedo',
  /let richHist = \[\], richHistIdx = -1/.test(appSrc)
  && /function richUndo\(\)/.test(appSrc) && /function richRedo\(\)/.test(appSrc)
  && /function richHistRestore\(idx\)/.test(appSrc));
ok('onRichInput 统一记录快照（覆盖裁剪/宽度/格式等程序化改动）',
  /richHistRecord\(html\);/.test(appSrc) && /const html = \$\('#richPane'\)\.innerHTML/.test(appSrc));
ok('打字合并窗口 500ms，避免一字一撤',
  /richHistTyping/.test(appSrc) && /\}, 500\);/.test(appSrc));
ok('进编辑态重建撤销栈（干净起点）',
  /function toRichEditor\(\)/.test(appSrc) && /richHistReset\(pane\.innerHTML\)/.test(appSrc));
ok('两端按钮接新撤销栈，且桌面端两处初始化',
  /if \(a === 'nh-undo'\) richUndo\(\)/.test(appSrc)
  && /if \(a === 'nh-redo'\) richRedo\(\)/.test(appSrc)
  && (() => {
    const la = fs.readFileSync(path.join(DESKTOP, 'public', 'app.js'), 'utf8');
    return /\$\('#sjUndoBtn'\).*richUndo\(\)/s.test(la)
      && /\$\('#sjRedoBtn'\).*richRedo\(\)/s.test(la)
      && (la.match(/richHistReset\(/g) || []).length >= 3;
  })());
ok('撤销栈还原后重新 decorate 并落盘',
  /pane\.innerHTML = html;\s*decorate\(pane\);/.test(appSrc)
  && /note\.content = html; note\.format = 'rich'/.test(appSrc));
ok('按钮禁用态随历史指针同步',
  /function richHistSyncBtns\(\)[\s\S]{0,400}b\.disabled = !canU[\s\S]{0,200}b\.disabled = !canR/.test(appSrc));
ok('无可撤销/重做步骤时按钮初始禁用且置灰（两端一致）',
  (() => {
    const ci = fs.readFileSync(path.join(CLOUD, 'index.html'), 'utf8');
    const li = fs.readFileSync(path.join(DESKTOP, 'public', 'index.html'), 'utf8');
    const cc = fs.readFileSync(path.join(CLOUD, 'style.css'), 'utf8');
    const lc = fs.readFileSync(path.join(DESKTOP, 'public', 'style.css'), 'utf8');
    return /data-act="nh-undo"[^>]*\sdisabled/.test(ci)
      && /data-act="nh-redo"[^>]*\sdisabled/.test(ci)
      && /id="sjUndoBtn"[^>]*\sdisabled/.test(li)
      && /id="sjRedoBtn"[^>]*\sdisabled/.test(li)
      && /\.sj-nh-btn:disabled\s*\{[^}]*opacity:\s*\.32/.test(cc)
      && /\.sj-ea-btn:disabled\s*\{[^}]*opacity:\s*\.32/.test(lc)
      && /\.sj-nh-btn:disabled:hover[^{]*\{[^}]*transparent/.test(cc)
      && /\.sj-ea-btn:disabled:hover[^{]*\{[^}]*transparent/.test(lc);
  })());

ok('发现新版本：三层探测 + 顶部更新按钮 + 清缓存重开（手机端）',
  indexSrc.indexOf('发现新版本') >= 0
  && indexSrc.indexOf("box.id = 'sjUpdateTip'") >= 0
  && indexSrc.indexOf('点此更新') >= 0
  && /window\.__SJ_APP_BUILD__/.test(indexSrc)
  && /searchParams\.get\('v'\)/.test(indexSrc)
  && indexSrc.indexOf("const\\s+VERSION\\s*=\\s*'sj-") >= 0
  && /fetch\(probe, \{ cache: 'no-store' \}\)/.test(indexSrc)
  && /m\[1\] > SWV/.test(indexSrc)
  && /t\.searchParams\.set\(param \|\| 'sjup'/.test(indexSrc)
  && /getRegistrations\(\)/.test(indexSrc)
  && /caches\.delete\(k\)/.test(indexSrc)
  && /setInterval\(checkUpdate, 60000\)/.test(indexSrc)
  && /visibilitychange/.test(indexSrc)
  && /setTimeout\(finish, 4000\)/.test(indexSrc));

/* 「划掉重进，每次都有发现新版本」：去重标记原本存在 sessionStorage，手机上把
   应用从最近任务划掉，sessionStorage 就没了，于是每次冷启动都重新弹一遍。
   标记必须放 localStorage —— 同一个版本最多提示一次，跨会话有效。 */
ok('更新提示去重标记在 localStorage，划掉重进不会重复弹',
  /localStorage\.getItem\(UPDATE_SEEN \+ SWV\)/.test(indexSrc)
  && /localStorage\.setItem\(UPDATE_SEEN \+ SWV, '1'\)/.test(indexSrc)
  && !/sessionStorage\.(get|set)Item\(UPDATE_SEEN/.test(indexSrc));

/* 探测命中后先自己修（注销 SW + 清缓存 + 重开），不必让用户每次去点按钮。
   自愈只在刚启动的一分钟内、页面在前台、且没停在输入框里时动手，防止把正在
   写的内容刷掉；每个目标版本只自动试一次，失败回落成顶部提示。 */
ok('探测到本页落后会先自动修一次，不必用户每次点按钮',
  /function autoHeal\(target\) \{/.test(indexSrc)
  && /Date\.now\(\) - BOOT_AT > 60000/.test(indexSrc)
  && /document\.visibilityState !== 'visible'/.test(indexSrc)
  && /isContentEditable/.test(indexSrc)
  && /localStorage\.getItem\(HEAL_KEY \+ target\) === '1'/.test(indexSrc)
  && /if \(!autoHeal\(SWV\)\) showUpdateTip\(\)/.test(indexSrc)
  && /if \(!autoHeal\(m\[1\]\)\) showUpdateTip\(\)/.test(indexSrc)
  && /refreshNow\('sjfix'\)/.test(indexSrc));

/* 自愈/更新都要清缓存重开，但下载中转缓存里是正在下载的文件字节，不能一起删。 */
ok('清缓存时保留下载中转缓存 sjdl-v1',
  /ks\.filter\(function \(k\) \{ return k !== 'sjdl-v1'; \}\)/.test(indexSrc));

/* 新 SW 装好会 skipWaiting + claim，接管是毫秒级；此刻已有 installing / waiting
   说明正在换，静默等它。否则每次发版后的第一次冷启动都会误报一条提示。 */
ok('新 SW 正在安装/等待接管时不误报',
  /if \(r && \(r\.installing \|\| r\.waiting\)\) return;/.test(indexSrc));

/* 同一个版本第二次报「有新版」，说明上次更新没换过来（多半是网络慢、页面又被
   浏览器缓存的旧副本顶替）。这时再彻底重来一次，之后彻底闭嘴，不再反复弹。 */
ok('同一版本第二次仍报新版：再彻底重来一次，之后闭嘴',
  /var HARD_KEY = 'sj_hard_';/.test(indexSrc)
  && /function hardReset\(\)/.test(indexSrc)
  && /if \(seen\) \{\s*if \(!typingNow\(\) && hardReset\(\)\) return;/.test(indexSrc.replace(/\n/g, ' '))
  && /localStorage\.getItem\(HARD_KEY \+ SWV\) === '1'/.test(indexSrc)
  && /refreshNow\('sjfix'\)/.test(indexSrc));

/* 站点 HTML / JS 的响应没有 Cache-Control（网关不发），不主动绕开的话浏览器会
   按启发式新鲜度自己留一份旧副本 —— 那就是「手机上永远换不过来」的根源：
   网络请求压根没发出去。SW 里所有代码类请求都必须带 no-store。 */
ok('导航与代码资源一律绕开浏览器 HTTP 缓存（no-store）',
  /function netRequest\(req, forceNoStore\)/.test(swSrc)
  && /fetch\(netRequest\(req, true\)\)/.test(swSrc)
  && /fetch\(netRequest\(req, true\)\)\.catch\(\(\) => null\)/.test(swSrc)
  && /const recovery = \/\[\?&\]\(\?:sjfix\|sjup\)=\/\.test\(req\.url\)/.test(swSrc)
  && /recovery \? 15000 : 6000/.test(swSrc)
  /* 恢复性导航这一次宁可等，也不能拿旧页面顶替 */
  && /if \(recovery\) return offlinePage\(\);/.test(swSrc));

/* 点「点此更新」后按钮文案变成「正在更新…」，比原来长。flex 默认允许收缩，
   窄屏上会被挤成两行、文字顶出圆角墨灰底。三块都锁 nowrap + 不收缩，
   按钮再给固定最小宽度，两种文案切换时外框不忽宽忽窄。 */
ok('更新提示在窄屏不换行、不收缩：点完变「正在更新…」也撑不破外框',
  /max-width:calc\(100vw - 24px\);flex-wrap:nowrap;/.test(indexSrc)
  && /white-space:nowrap;flex:none;min-width:100px/.test(indexSrc)
  && (indexSrc.match(/white-space:nowrap;flex:none/g) || []).length >= 3
  && /<span style="white-space:nowrap;flex:none">发现新版本<\/span>/.test(indexSrc));
ok('版本探测正则能从 sw.js 提取当前构建号',
  (() => {
    const m = /const\s+VERSION\s*=\s*'sj-([^']+)'/.exec(swSrc);
    return !!m && m[1] === BUILD;
  })());
ok('app.js 暴露构建号供内联守卫比对',
  /window\.__SJ_APP_BUILD__ = APP_BUILD;/.test(appSrc));
/* 兜底页与更新提示条是内联写死的（必须不依赖 style.css），但颜色不能停在旧墨绿：
   界面早已是宽屏石墨灰 / 窄屏华为蓝，墨绿只在两者之间的灰色地带出现。
   2026-11-24 用户嫌兜底页那颗深石墨按钮不好看，改成淡蓝底 + 深蓝字。 */
ok('内联兜底 UI 不再写死旧墨绿 #2f6f5e',
  indexSrc.indexOf('#2f6f5e') < 0
  && /id="sjBootRetry"[^>]*background:#e3eeff/.test(indexSrc)
  && /border-radius:14px;background:#43403a/.test(indexSrc));
ok('慢网首屏不误报「没能加载完」（10s 重载 / 18s 才提示 / 脚本报错立即提示）',
  /if \(tries === 10 && !reloaded\)/.test(indexSrc)
  && /if \(tries >= 18 && !panel\)/.test(indexSrc)
  && /window\.__SJ_LOAD_ERR && !panel/.test(indexSrc)
  && /src="\/app\.js\?sharecode=[^"]+" onerror="window\.__SJ_LOAD_ERR=1"/.test(indexSrc)
  && (indexSrc.match(/onerror="window\.__SJ_LOAD_ERR=1"/g) || []).length >= 3);
/* 返回手势：系统侧滑/返回键都是 history.back()，不接 popstate 就等于「退出应用」。
   约定：只接管窄屏、只压「可返回的层」、层被按钮关掉时把记录收回来。 */
ok('手机端返回手势：接入浏览器历史栈，逐层退回',
  /let backN = 0;/.test(appSrc)
  && /window\.addEventListener\('popstate'/.test(appSrc)
  && /if \(backSilent > 0\) \{ backSilent--; return; \}/.test(appSrc)
  && /if \(backN <= 0\) return;/.test(appSrc)
  && /setInterval\(backSync, 300\)/.test(appSrc)
  && /window\.SJBackSync = backSync;/.test(appSrc));
ok('返回手势只接管窄屏，宽屏保持浏览器原义',
  /function backLayers\(\) \{\s*if \(!NARROW\(\)\) return 0;/.test(appSrc)
  && /if \(!NARROW\(\)\) \{\s*if \(backN > 0\) \{/.test(appSrc));
ok('返回层级顺序与 Escape 一致：大图 → Aa → 菜单 → 弹窗 → 样式面板 → 四点菜单',
  (() => {
    const i = appSrc.indexOf('function backTop()');
    const seg = appSrc.slice(i, i + 900);
    const order = ['sjLightbox', 'sjAaSheet', 'ctxMenu', 'modalRoot', 'sj-style-open', 'sjMoreMenu'];
    let at = -1;
    for (const k of order) {
      const p = seg.indexOf(k);
      if (p < 0 || p < at) return false;
      at = p;
    }
    return true;
  })());
ok('抽屉与笔记详情各算一层，关层后回收多余的 history 记录',
  /function closeDrawer\(\) \{[\s\S]{0,160}window\.SJBackSync/.test(appSrc)
  && /function closeEditor\(\) \{[\s\S]{0,900}window\.SJBackSync/.test(appSrc)
  && /function openDrawer\(kind\) \{[\s\S]{0,400}window\.SJBackSync/.test(appSrc)
  && /else if \(need < backN\) \{[\s\S]{0,120}history\.go\(-d\)/.test(appSrc)
  && /if \(window\.SJBackSync\) window\.SJBackSync\(\);\s*\}\s*$/m.test(appSrc.slice(appSrc.indexOf('    try { localStorage.removeItem(\'sj_opening_note\')'), appSrc.indexOf('    try { localStorage.removeItem(\'sj_opening_note\')') + 400)));
ok('样式面板暴露 window 桥，供返回手势先收面板',
  /window\.SJCloseStyleSheet = closeStyleSheet;/.test(appSrc));
ok('口令提示条跟随强调色，不再硬编码旧墨绿',
  /\.pwd-tip \{[^}]*background: var\(--accent\)/.test(styleSrc)
  && /html\[data-theme="dark"\] \.pwd-tip,[\s\S]{0,180}color: #1c1a17/.test(styleSrc));

console.log('\n换块摘内联字号 / 标题层级（2026-11-25）');
ok('换标题会清掉块内的内联 font-size，级别才看得出变化',
  /function dropBlockFontSize\(\) \{/.test(appSrc)
  && /el\.style\.removeProperty\('font-size'\)/.test(appSrc)
  && /if \(cmd === 'formatBlock' && \/\^<\(h\[1-6\]\|p\)>\$\/i\.test\(String\(value\)\)\) dropBlockFontSize\(\);/.test(appSrc));
ok('有选区时按 intersectsNode 找交集的块，引用块不误清',
  /range\.intersectsNode\(el\)/.test(appSrc)
  && /cmd === 'formatBlock'[\s\S]{0,120}dropBlockFontSize/.test(appSrc)
  && /'<blockquote>'/.test(appSrc));
ok('H5/H6 也有样式，导入的 Markdown 不掉回 0.83em',
  /\.markdown-body h5 \{ font-size: \.92em; color: var\(--text-3\); \}/.test(styleSrc)
  && /\.markdown-body h6 \{ font-size: \.9em; color: var\(--text-3\); font-weight: 500; \}/.test(styleSrc)
  && /BLOCK_TAGS = \/\^\(P\|DIV\|LI\|BLOCKQUOTE\|PRE\|H1\|H2\|H3\|H4\|H5\|H6\)\$\//.test(appSrc));

console.log('两端共享内核（2026-11-26）');
const cloudMdconv = fs.readFileSync(path.join(CLOUD, 'mdconv.js'), 'utf8');
ok('页面按 richtext-core → mdconv-core → mdconv.js 的顺序加载',
  indexSrc.indexOf('/richtext-core.js') > 0
  && indexSrc.indexOf('/richtext-core.js') < indexSrc.indexOf('/mdconv-core.js')
  && indexSrc.indexOf('/mdconv-core.js') < indexSrc.indexOf('/mdconv.js')
  && indexSrc.indexOf('/mdconv.js') < indexSrc.indexOf('/app.js'));
ok('两个内核都进了离线预缓存清单',
  /'\/richtext-core\.js'/.test(swSrc) && /'\/mdconv-core\.js'/.test(swSrc));
ok('云端 mdconv.js 只剩适配层，不再自带一份净化实现',
  /SJMDConvCore\.create\(/.test(cloudMdconv) && !/function stripDangerous/.test(cloudMdconv));
ok('云端 app.js 不再内联 turndown 配置',
  !/new TurndownService\(/.test(appSrc) && /SJRTCore\.createTurndown/.test(appSrc));

console.log('分类自动去重（2026-11-26：全自动，无手动入口）');
const mobileSrc = fs.readFileSync(path.join(CLOUD, 'mobilesync.js'), 'utf8');

/* 判定逻辑已经收进共享内核 cat-core.js（与桌面端逐字相同），直接 require
   真跑，而不是从 IIFE 里切字符串。 */
const cloudCat = require(path.join(CLOUD, 'cat-core.js'));
const { mergeCats, resolveId, pickDuplicateCatIds, dedupeCats, siblingOf, uniqueName } = cloudCat;
ok('云端分类内核可独立加载（UMD，Node 与浏览器同一份）', typeof mergeCats === 'function');

/* 计数与全路径：2026-11-28 从两端 app.js 收进内核。以前同一口径四处各算一遍，
   手机上「学习素材 1 + 3」和电脑上对不上账就是这么来的。 */
const cntCats = [
  { id: 'r', name: '学习素材', parentId: null },
  { id: 'f', name: '前端开发', parentId: 'r' },
  { id: 'p', name: '页面布局', parentId: 'f' },
  { id: 'w', name: '工作', parentId: null },
];
const cntNotes = [
  { id: '1', categoryId: 'r' }, { id: '2', categoryId: 'f' },
  { id: '3', categoryId: 'p' }, { id: '4', categoryId: 'p' },
  { id: '5', categoryId: 'w' }, { id: '6', categoryId: null },
];
ok('计数口径一处算：子树汇总 / 本层 / 子分类',
  JSON.stringify(cloudCat.catCounts(cntCats, cntNotes, 'r')) === JSON.stringify({ total: 4, own: 1, sub: 3 })
  && JSON.stringify(cloudCat.catCounts(cntCats, cntNotes, 'p')) === JSON.stringify({ total: 2, own: 2, sub: 0 }));
ok('手机上「1 + 3」加得回总数 4',
  (() => { const c = cloudCat.catCounts(cntCats, cntNotes, 'r'); return c.own + c.sub === c.total; })());
ok('全路径「学习素材 / 前端开发 / 页面布局」只有一份实现',
  cloudCat.catPathOf(cntCats, 'p') === '学习素材 / 前端开发 / 页面布局'
  && cloudCat.catPathOf(cntCats, 'nope') === '');

/* 复刻 11-22 的真实数据：本地 6 个分类，云端同一个分类躺着三套 id。 */
const LOCAL_CATS = [
  { id: 'L1', name: '学习素材', parentId: null, createdAt: 1 },
  { id: 'L2', name: '前端开发', parentId: 'L1', createdAt: 2 },
  { id: 'L3', name: '算法与数据结构', parentId: 'L1', createdAt: 3 },
  { id: 'L4', name: '读书笔记', parentId: null, createdAt: 4 },
  { id: 'L5', name: '工作记录', parentId: null, createdAt: 5 },
  { id: 'L6', name: '页面布局', parentId: 'L2', createdAt: 6 },
];
const CLOUD_CATS = [
  { id: 'C1', name: '学习素材', parentId: null, createdAt: 1 },
  { id: 'C2', name: '前端开发', parentId: 'C1', createdAt: 2 },
  { id: 'C3', name: '算法与数据结构', parentId: 'C1', createdAt: 3 },
  { id: 'C4', name: '读书笔记', parentId: null, createdAt: 4 },
  { id: 'C5', name: '工作记录', parentId: null, createdAt: 5 },
  { id: 'D1', name: '学习素材', parentId: null, createdAt: 11 },
  { id: 'D2', name: '前端开发', parentId: 'D1', createdAt: 12 },
  { id: 'D3', name: '算法与数据结构', parentId: 'D1', createdAt: 13 },
  { id: 'D4', name: '读书笔记', parentId: null, createdAt: 14 },
  { id: 'D5', name: '工作记录', parentId: null, createdAt: 15 },
  { id: 'L6', name: '页面布局', parentId: 'D2', createdAt: 6 },
];
const merged = mergeCats(LOCAL_CATS, CLOUD_CATS, []);
const keptId = (name) => merged.list.filter((c) => c.name === name).map((c) => c.id);
ok('三套同名分类并成一套（11 条云端 + 本地 → 6 条）',
  merged.list.length === 6);
ok('每组同名只剩一条',
  ['学习素材', '前端开发', '算法与数据结构', '读书笔记', '工作记录', '页面布局']
    .every((n) => keptId(n).length === 1));
ok('10 条重复 id 被并掉，重映射指向保留下来的那条',
  merged.remap.size === 10
  && resolveId(merged.remap, 'D2') === keptId('前端开发')[0]
  && resolveId(merged.remap, 'C4') === keptId('读书笔记')[0]);
const mergedAgain = mergeCats(merged.list, [], []);
ok('对合并结果再去一次重不会再有变化（幂等）',
  mergedAgain.list.length === merged.list.length && mergedAgain.remap.size === 0);
ok('并掉父级后，子分类挂到保留下来的父级上',
  merged.list.find((c) => c.id === 'L6').parentId === keptId('前端开发')[0]);
ok('层级树不会因父被并掉而断裂',
  merged.list.filter((c) => c.parentId && !merged.list.some((x) => x.id === c.parentId)).length === 0);

const remapped = { categoryId: 'D3' };
remapped.categoryId = resolveId(merged.remap, remapped.categoryId);
ok('笔记的 categoryId 跟着重映射到保留的分类',
  remapped.categoryId === keptId('算法与数据结构')[0]);
ok('重映射能一路走到底（链式 A→B→C），不死循环',
  resolveId(new Map([['a', 'b'], ['b', 'c']]), 'a') === 'c');

/* 本地库自愈：旧版同步留下的同父同名，在进界面之前就该被合掉，
   而且保留内容多的那份（笔记跟着走，不丢）。 */
const DUP_LOCAL = [
  { id: 'X1', name: '工作记录', parentId: null, createdAt: 1 },
  { id: 'X2', name: '工作记录', parentId: null, createdAt: 2 },
  { id: 'X3', name: '  工作记录 ', parentId: null, createdAt: 3 },
];
const DUP_NOTES = [{ id: 'n1', categoryId: 'X2' }, { id: 'n2', categoryId: 'X2' }];
const healed = dedupeCats(DUP_LOCAL, DUP_NOTES);
const healedNotes = DUP_NOTES.map((n) => Object.assign({}, n));
cloudCat.remapAll(healed.list, healedNotes, healed.remap);
ok('本地自愈只留内容最多的一份（同名大小写 / 空格都算同一个）',
  healed.list.length === 1 && healed.list[0].id === 'X2');
ok('笔记指向跟着并到保留下来的分类',
  healedNotes.every((n) => n.categoryId === 'X2'));

ok('建类查重：同父同名判为重复，不同父级不算',
  !!siblingOf(DUP_LOCAL, '工作记录', null, 'X1')
  && !siblingOf(DUP_LOCAL, '工作记录', 'someParent', null));
ok('没填名字时自动取一个没被占用的默认名，不偷偷改用户填的名字',
  uniqueName([{ id: 'a', name: '未命名类别', parentId: null }], '未命名类别', null) === '未命名类别 2');


ok('拉取时分类走共享内核 mergeCats，笔记 categoryId 跟着重映射',
  /const catMerge = C\.mergeCats\(local\.categories, cloudCats/.test(mobileSrc)
  && /const nc = C\.resolveId\(catMerge\.remap, n\.categoryId\)/.test(mobileSrc)
  && !/const finalCats = merge\(local\.categories, cloudCats\)/.test(mobileSrc));
ok('上传前按同名同父对齐云端 id，不再插新行',
  /const a = await alignCatsToCloud\(local, owner\)/.test(mobileSrc)
  && /const target = list\.find\(\(x\) => x\.id === c\.id\) \|\| list\[0\]/.test(mobileSrc)
  && /idRemap\.set\(c\.id, target\.id\)/.test(mobileSrc));
ok('上传前先理一遍本机分类，脏行不会再被推上去',
  /const ded = C\.dedupeCats\(local\.categories, local\.notes\)/.test(mobileSrc)
  && /C\.remapAll\(local\.categories, local\.notes, ded\.remap\)/.test(mobileSrc));
ok('本机合并的数量会如实报给用户（不是静默改数据）',
  mobileSrc.indexOf('把本机 ${localDeduped} 个重复分类并掉') > 0);
ok('笔记传完之后才清云端重复分类（顺序反了会因引用而删不掉）',
  (() => {
    const notesUp = mobileSrc.indexOf('for (const n of local.notes) {');
    const clean = mobileSrc.indexOf("cleanupDupCats(owner, local.categories)");
    return notesUp > 0 && clean > notesUp;
  })());
ok('拉取后把合并结果回写云端，云端不会下次又长回来',
  /reconcileCloudCats\(owner, finalCats, catMerge\.remap\)/.test(mobileSrc)
  && /await restPatch\('sj_notes', q, \{ category_key: target \}\)/.test(mobileSrc));
ok('清理是直连 DELETE，不是只在前端过滤',
  /method: 'DELETE'/.test(mobileSrc) && /restDelete\('sj_categories', q\)/.test(mobileSrc));
ok('删除分类会同步删云端行，并先把云端笔记挪到父级',
  /window\.SJSync\.catDeleted\(\[cat\.id\], cat\.parentId \|\| null\)/.test(appSrc)
  && /await restPatch\('sj_notes', nq, \{ category_key: parentId \|\| null \}\)/.test(mobileSrc)
  && /restDelete\('sj_categories', cq\)/.test(mobileSrc));
ok('离线时删除只影响本机，不抛错挡住操作',
  /if \(!session \|\| !session\.user\) return 0;/.test(mobileSrc));
ok('不再有「清理云端重复分类」手动按钮', !/syncFixCat/.test(mobileSrc) && !/doFixCats/.test(mobileSrc));
ok('分类管理页不再有「合并同名分类」手动入口',
  !/合并同名分类/.test(appSrc) && !/mgr-merge-dups/.test(appSrc) && !/previewMergeDups/.test(appSrc));

/* 建类 / 改名必须在数据层就拦住重名，不能只靠界面提示。 */
const cloudLocal = fs.readFileSync(path.join(CLOUD, 'local.js'), 'utf8');
ok('云端建类走同父同名校验，重名直接报错',
  /siblingOf\(cats, name, parentId\)/.test(cloudLocal)
  && /同一级下已有同名类别/.test(cloudLocal));
ok('云端改名 / 移动按「目标父级 + 最终名字」校验',
  /const dup = window\.SJCats \? window\.SJCats\.siblingOf\(db\.categories, nextName, targetParent, cat\.id\)/.test(cloudLocal));
ok('云端启动、整库写入、导入三处都会自动去重',
  /const dupCat = healCategories\(\)/.test(cloudLocal)
  && /healCategories\(\);\s*\n\s*db\.notes\.forEach\(indexNote\)/.test(cloudLocal)
  && /healCategories\(\);\s*\n\s*save\(\);\s*\n\s*return \{ catAdded/.test(cloudLocal));
ok('云端界面在提交前先判重名，反馈不用等一次请求（重名不关弹窗）',
  /function dupCatError\(name, parentId, excludeId\)/.test(appSrc)
  && /validate: \(v\) => dupCatError\(v, parentId, null\)/.test(appSrc)
  && /validate: \(v\) => dupCatError\(v, cat\.parentId, cat\.id\)/.test(appSrc)
  && /if \(bad\) \{ toast\(bad\.message \|\| String\(bad\)\)/.test(appSrc));
ok('分类内核在 local.js 之前加载（启动就要用）',
  indexSrc.indexOf('src="/cat-core.js') > 0
  && indexSrc.indexOf('src="/cat-core.js') < indexSrc.indexOf('src="/local.js'));
ok('分类内核进了离线预缓存清单', /'\/cat-core\.js'/.test(swSrc));


/* 真删云端数据前必须验的三件事：只删多余副本、有笔记引用的不碰、
   父被删时无引用的子分类跟着删（否则子分类变孤儿，界面上直接消失）。 */
const CLOUD_ROWS = [
  { id: 'A1', name: '学习素材', parentId: null },
  { id: 'A2', name: '学习素材', parentId: null },
  { id: 'A3', name: '学习素材', parentId: null },
  { id: 'A2a', name: '前端开发', parentId: 'A2' },
  { id: 'A3a', name: '前端开发', parentId: 'A3' },
  { id: 'B1', name: '工作记录', parentId: null },
  { id: 'X1', name: '页面布局', parentId: 'A1' },
  { id: 'Y1', name: '页面布局', parentId: 'B1' },
];
const kill = pickDuplicateCatIds(CLOUD_ROWS, new Set(['A3a']), new Set(['A1']));
ok('只删同父同名里多出来的副本（A2），保留本地那份与独占分类',
  kill.length === 2 && kill.indexOf('A2') >= 0 && kill.indexOf('A1') < 0 && kill.indexOf('B1') < 0);
ok('父被删时无引用的子分类一起删，不留孤儿',
  kill.indexOf('A2a') >= 0);
ok('子分支里有笔记引用时，父分类不删（A3 留下来）',
  kill.indexOf('A3') < 0 && kill.indexOf('A3a') < 0);
ok('同名但父级不同的分类不算重复，都不动',
  kill.indexOf('X1') < 0 && kill.indexOf('Y1') < 0);

console.log('\n删除文件夹 / 数据体检 / 自动同步（2026-11-27）');
const attSrc = fs.readFileSync(path.join(CLOUD, 'attstore.js'), 'utf8');

/* P0：删文件夹只删自身会留下 parentId 悬空的孤儿分类 —— 树上不渲染、
   刷新后又从数据里冒出来，而它下面的笔记已经进了回收站。 */
ok('云端删除文件夹时连整棵子树一起删，与桌面端行为一致',
  /db\.categories = db\.categories\.filter\(\(c\) => !ids\.includes\(c\.id\)\);/.test(localSrc)
  && localSrc.indexOf('affected.forEach((n) => { n.deletedAt = Date.now(); n.updatedAt = n.deletedAt; });') >= 0);
ok('「移到父级」策略仍然只删自身（子分类改挂，不能连带删）',
  /db\.categories\.filter\(\(c\) => c\.parentId === id\)\.forEach\(\(c\) => \(c\.parentId = parentId\)\);/.test(localSrc));

/* 数据体检：悬空引用 / 环 / order / 标签，进库时统一修 */
ok('云端每次进库都做体检，不只去重',
  /const st = window\.SJCats\.healIntegrity\(db\.categories, db\.notes\)/.test(localSrc)
  && /changed \+= st\.orphanCats \+ st\.cycleCats \+ st\.orphanNotes \+ st\.orderFixed \+ st\.tagFixed \+ st\.notesMerged/.test(localSrc));
ok('新建分类用「同级最大 order + 1」，删一个再建不会撞号',
  /order: siblings\.length \? Math\.max\(\.\.\.siblings\.map\(\(c\) => Number\(c\.order\) \|\| 0\)\) \+ 1 : 0/.test(localSrc));

/* 重复笔记合并：手机端与电脑端共用同一份判定，否则「算不算重复」两端各算一套。 */
const cDup = [
  {
    id: 'm1', title: '会议纪要模板', categoryId: 'c1', tags: ['工作', '模板'],
    content: '<h2>本周例会</h2><p>时间：周一 14:00，参会：全体成员</p>',
    createdAt: 10, updatedAt: 500,
  },
  {
    id: 'm2', title: '会议纪要模板', categoryId: 'c1', tags: ['工作', '模板'],
    content: '<h2>本周例会</h2><p>时间：周一 14:00，参会：全体成员！</p><p>旧稿残留的一段测试文字</p>',
    createdAt: 5, updatedAt: 300,
  },
  {
    /* 同一篇被复制进另一个文件夹：父分类列表里本来就看得见子分类那篇，
       这是层级关系，不是重复，不合并。 */
    id: 'm3', title: '会议纪要模板', categoryId: 'c2', tags: ['工作'],
    content: '<h2>本周例会</h2><p>时间：周一 14:00，参会：全体成员</p>',
    createdAt: 6, updatedAt: 400,
  },
  {
    /* 同题不同文件夹、但正文有差别：可能真是两份要分开维护的 */
    id: 'm4', title: '会议纪要模板', categoryId: 'c3', tags: ['工作'],
    content: '<h2>本周例会</h2><p>时间：周一 14:00，参会：全体成员与记录人</p>',
    createdAt: 7, updatedAt: 350,
  },
  {
    /* 同一个文件夹里的老备份复制品：正文一字不差 */
    id: 'm5', title: '会议纪要模板', categoryId: 'c1', tags: ['工作', '模板'],
    content: '<h2>本周例会</h2><p>时间：周一 14:00，参会：全体成员</p>',
    createdAt: 4, updatedAt: 450,
  },
];
const cDupStat = cloudCat.dedupeNotes(cDup, 9000);
const cKeep = cDup.find((n) => n.id === 'm1');
ok('同标题 + 同分类 + 正文高度相似的两份合并，留 updatedAt 最新那份',
  cDupStat.count === 2
  && !!cDupStat.pairs.find((p) => p.keep === 'm1' && p.drop === 'm2'));
ok('被合并的一份进回收站（软删，30 天内可恢复），不硬删',
  Number(cDup.find((n) => n.id === 'm2').deletedAt) === 9000
  && cDup.find((n) => n.id === 'm2').mergedInto === 'm1');
/* 真机复盘（2026-11-27）：那篇重复笔记其实是子分类里的同一篇，
   父分类列表汇总时看得见。判重就此收回「同一个文件夹」以内。 */
ok('同一文件夹里一字不差的复制品 → 合并',
  Number(cDup.find((n) => n.id === 'm5').deletedAt) === 9000
  && cDup.find((n) => n.id === 'm5').mergedInto === 'm1');
ok('跨文件夹且正文相同 → 不合并（层级汇总不是重复）',
  !cDup.find((n) => n.id === 'm3').deletedAt);
ok('跨文件夹且正文有差别 → 不合并，避免把两份真东西合成一份',
  !cDup.find((n) => n.id === 'm4').deletedAt);
ok('合并后标签并集去重，最多 10 个', cKeep.tags.join(',') === '工作,模板');

/* 手机端真机反馈：『页面布局』里有一篇「无标题笔记」，父分类『前端开发』
   的列表会把它一起列出来 —— 那是层级汇总，不是两份。所以判重限定同文件夹。 */
const cUn = [
  { id: 'u1', title: '无标题笔记', categoryId: 'c1', tags: [], content: '<p>同一段字</p>', createdAt: 1, updatedAt: 20 },
  { id: 'u2', title: '', categoryId: 'c1', tags: [], content: '<p>同一段字</p>', createdAt: 2, updatedAt: 10 },
  { id: 'u3', title: '无标题笔记', categoryId: 'c2', tags: [], content: '<p>完全不同的字</p>', createdAt: 3, updatedAt: 30 },
  { id: 'u4', title: '无标题笔记', categoryId: 'c1', tags: [], content: '<p><br></p>', createdAt: 4, updatedAt: 40 },
  { id: 'u5', title: '', categoryId: 'c1', tags: [], content: '', createdAt: 5, updatedAt: 50 },
  { id: 'u6', title: '无标题笔记', categoryId: 'c1', tags: [], content: '', attachments: [{ id: 'p' }], createdAt: 6, updatedAt: 60 },
  { id: 'u7', title: '', categoryId: 'c2', tags: [], content: '<p>同一段字</p>', createdAt: 7, updatedAt: 55 },
];
const cUnStat = cloudCat.dedupeNotes(cUn, 9100);
ok('无标题笔记按正文判同一篇：同一文件夹内文字相同才合并',
  cUnStat.count === 2 && !!cUn.find((n) => n.id === 'u2').deletedAt
  && cUn.find((n) => n.id === 'u2').mergedInto === 'u1'
  && !cUn.find((n) => n.id === 'u3').deletedAt);
ok('无标题笔记跨文件夹即使文字相同也不合并',
  !cUn.find((n) => n.id === 'u7').deletedAt);
ok('空稿只留一份；有附件的空稿不当空稿合并（附件就是内容）',
  !!cUn.find((n) => n.id === 'u4' || n.id === 'u5').deletedAt
  && !cUn.find((n) => n.id === 'u6').deletedAt);
ok('手机端进库时同样会自动合并（setState 走 healCategories）',
  /healCategories\(\);\s*\n\s*db\.notes\.forEach\(indexNote\);/.test(localSrc));
ok('合并结果只在界面提示一次（meta.heal + reported），不写成库里的状态',
  /const heal = lastHeal && lastHeal\.notesMerged && !lastHeal\.reported/.test(localSrc)
  && /if \(heal\.notesMerged\) lastHeal\.reported = true;/.test(localSrc)
  && /已自动合并 \$\{heal\.notesMerged\} 篇重复笔记/.test(appSrc));
ok('合并内核与桌面端逐字相同（共享文件校验会兜底）',
  crypto.createHash('md5').update(fs.readFileSync(path.join(CLOUD, 'cat-core.js'))).digest('hex')
  === crypto.createHash('md5').update(fs.readFileSync(path.join(DESKTOP, 'public', 'cat-core.js'))).digest('hex'));
ok('标签写入口按内核归一（忽略大小写与空白去重、去空、最多 10 个）',
  /const k = window\.SJCats \? window\.SJCats\.normTag\(t\) : t\.toLowerCase\(\)/.test(appSrc)
  && /const next = clean\.slice\(0, 10\);/.test(appSrc));
ok('加标签时先判重，已有同名（大小写 / 空格不同）直接提示',
  /const dup = tags\.find\(\(t\) => norm\(t\) === norm\(value\)\)/.test(appSrc));

/* 自动同步：本机变更 → 去抖上传；打开 / 回前台 → 拉取 */
ok('本机落盘后才广播变更（启动自愈不触发自动上传）',
  /let saveReady = false;/.test(localSrc)
  && /if \(saveReady\) \{\s*try \{ window\.dispatchEvent\(new Event\('sj-local-saved'\)\); \} catch \(_\) \{\}/.test(localSrc));
ok('同步层监听本机变更，45 秒去抖后自动上传',
  /const AUTO_PUSH_DELAY = 45000;/.test(mobileSrc)
  && /window\.addEventListener\('sj-local-saved', scheduleAutoPush\);/.test(mobileSrc));
ok('自动上传要求：已登录、开关开、可见、不在编辑、距上次同步 3 分钟以上',
  /const AUTO_PUSH_GAP = 3 \* 60 \* 1000;/.test(mobileSrc)
  && /if \(document\.hidden \|\| editingNow\(\)\) return;/.test(mobileSrc)
  && /Date\.now\(\) - lastSyncAt\(\) < AUTO_PUSH_GAP/.test(mobileSrc));
ok('回到前台自动拉取，10 分钟内不重复拉',
  /const AUTO_PULL_GAP = 10 \* 60 \* 1000;/.test(mobileSrc)
  && /document\.addEventListener\('visibilitychange', \(\) => \{/.test(mobileSrc)
  && /Date\.now\(\) - lastPullAt\(\) < AUTO_PULL_GAP/.test(mobileSrc));
ok('自动上传 / 拉取都走静默模式：不动按钮、不弹 toast',
  /await doPush\(\{ auto: true \}\)/.test(mobileSrc) && /await doPull\(\{ auto: true \}\)/.test(mobileSrc)
  && /if \(!auto\) \{ cancelAutoClose\(\); lastMsg = ''; lastKind = ''; \}/.test(mobileSrc));
ok('自动流程遇到冲突整轮放弃，绝不静默替用户挑一边',
  /if \(conflicts\.length && auto\) \{[\s\S]{0,120}throw new Error/.test(mobileSrc));
ok('自动同步有开关，默认开启；关闭后不再自动触发',
  /const AUTO_KEY = 'sj_auto_sync_v1';/.test(mobileSrc)
  && /localStorage\.getItem\(AUTO_KEY\) !== '0'/.test(mobileSrc)
  && /if \(!on && autoPushTimer\) \{ clearTimeout\(autoPushTimer\); autoPushTimer = null; \}/.test(mobileSrc));
ok('同步面板展示自动同步开关与最近一次自动结果（不弹窗打扰）',
  /id="syncAuto"/.test(mobileSrc) && /class="sync-auto-note"/.test(mobileSrc)
  && /autoNote = `自动上传完成/.test(mobileSrc));

/* 附件 GC：队列没变，只是不再需要用户点按钮 */
ok('上传收尾自动清理云端无用附件（失败不影响本轮上传）',
  /let gcDone = 0;\s*try \{ gcDone = await gcQueued\(owner, true\); \} catch \(_\) \{\}/.test(mobileSrc));
ok('手动「清理云端无用附件」仍保留，用于失败后重试',
  /id="syncGc"/.test(mobileSrc) && /async function doGc\(\)/.test(mobileSrc));

/* 同步前快照轮转：只留一份时，连同步两次就把更早那个没问题的版本挤掉了 */
ok('同步前快照保留最近 3 份并自动轮转',
  /const SNAP_KEEP = 3;/.test(attSrc)
  && /const drop = list\.slice\(0, Math\.max\(0, list\.length - SNAP_KEEP\)\);/.test(attSrc));
ok('恢复入口列出多份快照供选择，而不是只能回到「上一次」',
  /function getSnaps\(\)/.test(attSrc) && /name="sjSnapPick"/.test(mobileSrc)
  && /class="sj-snap-list"/.test(mobileSrc));
ok('快照选择与自动同步样式只增不改旧类名（窄屏不串版）',
  /\.sync-auto \{/.test(styleSrc) && /\.sj-snap-row \{/.test(styleSrc));

/* 存储写满：以前只弹一句 toast，用户下次打开才发现「少了几篇」 */
ok('本机存储写满时逐级自动瘦身：裁版本 → 清过期回收站 → 放弃版本历史',
  /const freedTrash = kept\.length !== db\.notes\.length;/.test(localSrc)
  && /notes: db\.notes\.map\(stripAtt\), versions: \{\},/.test(localSrc));

console.log('\n[8] 笔记层纯逻辑内核（2026-11-28）');
/* 两端 app.js 里 184 个同名函数，122 个逐字相同。转义 / 空判定 / 排序 / 高亮
   是其中最危险的四类：escapeHtml 少一处就是 XSS，排序规则漂了两台设备顺序不同。
   收进 notes-core.js 后，内核一份，app.js 只留同名壳。 */
const notesCore = require(path.join(CLOUD, 'notes-core.js'));
const SAMPLE = [
  { id: 'a', title: 'B', updatedAt: 300, createdAt: 100 },
  { id: 'b', title: 'A', updatedAt: 200, createdAt: 300 },
  { id: 'c', title: 'C', updatedAt: 100, createdAt: 200 },
];
const ids = (list) => list.map((n) => n.id).join('');
ok('排序内核可独立加载（UMD，Node 与浏览器同一份）', /root\.SJNotesCore = factory\(\)/.test(fs.readFileSync(path.join(CLOUD, 'notes-core.js'), 'utf8')));
ok('默认按更新时间倒序', ids(notesCore.sortNotes(SAMPLE, 'updated')) === 'abc');
ok('可按创建时间 / 标题排序，未知模式回落到更新时间',
  ids(notesCore.sortNotes(SAMPLE, 'created')) === 'bca'
  && ids(notesCore.sortNotes(SAMPLE, 'title')) === 'bac'
  && ids(notesCore.sortNotes(SAMPLE, 'nonsense')) === 'abc');
ok('置顶恒在最前，且不改动传入的数组',
  ids(notesCore.sortNotes(SAMPLE, 'updated', new Set(['c']))) === 'cab'
  && ids(SAMPLE) === 'abc');
ok('空判定：只有 <br> / &nbsp; 的正文算空，有标题 / 标签 / 附件都不算',
  notesCore.blankContent('<p><br></p>') === true
  && notesCore.blankContent('<p>&nbsp;</p>') === true
  && notesCore.blankContent('<p>字</p>') === false
  && notesCore.isBlankNote({ title: ' ', content: '<p><br></p>' }) === true
  && notesCore.isBlankNote({ content: '<p><br></p>', tags: ['a'] }) === false
  && notesCore.isBlankNote({ content: '<p><br></p>', starred: true }) === false);
ok('高亮先转义再包 <mark>，搜索词里的尖括号不会打断标签',
  notesCore.escapeHtml('<img src=x onerror=1>') === '&lt;img src=x onerror=1&gt;'
  && notesCore.highlightText('a<b', '<b') === 'a<mark>&lt;b</mark>'
  && !/<b>/.test(notesCore.highlightText('a<b', '<b')));
ok('两端的 app.js 里不再留自己的转义表 / 排序比较函数',
  !/'&': '&amp;'/.test(appSrc) && !/return list\.slice\(\)\.sort\(/.test(appSrc)
  && /function escapeHtml\(s\) \{\s*return SJNotesCore\.escapeHtml\(s\);/.test(appSrc)
  && /return SJNotesCore\.sortNotes\(list, mode, new Set\(pinnedIds\(\)\)\)/.test(appSrc));
ok('notes-core 在 app.js 之前加载（云端 / 桌面同一顺序）',
  indexSrc.indexOf('notes-core.js') > 0 && indexSrc.indexOf('notes-core.js') < indexSrc.indexOf('/app.js')
  && fs.readFileSync(path.join(DESKTOP, 'public', 'index.html'), 'utf8').indexOf('notes-core.js')
     < fs.readFileSync(path.join(DESKTOP, 'public', 'index.html'), 'utf8').indexOf('/app.js'));
ok('离线预缓存里有 notes-core（漏了就是首屏白屏）',
  /'\/notes-core\.js'/.test(swSrc) && sw.ASSET_PATHS.has('/notes-core.js'));

console.log('\n接口契约');
const contract = require(path.join(CLOUD, 'api-contract.js'));
ok('云端 local.js 用同一份契约拒绝未知字段',
  /window\.SJContract\.unknownFields\(method, url\.pathname, body\)/.test(cloudLocal)
  && /throw new Error\('未知字段：'/.test(cloudLocal));
ok('契约在 app.js 与 local.js 之前加载，且离线预缓存里有它',
  indexSrc.indexOf('api-contract.js') > 0
  && indexSrc.indexOf('api-contract.js') < indexSrc.indexOf('<script src="/local.js')
  && /'\/api-contract\.js'/.test(swSrc) && sw.ASSET_PATHS.has('/api-contract.js'));
ok('两端契约逐字相同，字段规则与桌面端一致',
  fs.readFileSync(path.join(CLOUD, 'api-contract.js'), 'utf8')
    === fs.readFileSync(path.join(DESKTOP, 'public', 'api-contract.js'), 'utf8')
  && contract.find('PATCH', '/api/categories/x').p === '/api/categories/:id'
  && contract.unknownFields('POST', '/api/notes/x/attachments', { name: '', type: '', data: '', size: 0 }).length === 0);
ok('shapeOf 只描述结构不描述值（差分测试靠它避开随机 id 与时间戳）',
  JSON.stringify(contract.shapeOf({ id: 'a1', tags: ['x'], meta: { n: 1 } }))
    === JSON.stringify({ id: 'string', meta: { n: 'number' }, tags: ['array', 'string'] }));
ok('云端媒体块也已拆到 app-media.js，工厂注入后调用点不变',
  /const media = window\.SJAppMedia\(\{ \$, \$\$, I, toast, onRichInput, exec, isNarrow: \(\) => NARROW\(\) \}\)/.test(appSrc)
  && !/function bindImgResize\(/.test(appSrc) && /function bindImgResize\(/.test(mediaSrc)
  && indexSrc.indexOf('app-media.js') > 0 && indexSrc.indexOf('app-media.js') < indexSrc.indexOf('/app.js')
  && sw.ASSET_PATHS.has('/app-media.js'));
const diffSrc = fs.readFileSync(path.join(CLOUD, '..', 'scripts', 'contract-diff.js'), 'utf8');
ok('差分脚本覆盖云端存储层，且把桌面样例库作为共同起点',
  /local\.api\(p, \{ method: m, body: b \}\)/.test(diffSrc)
  && /loadCloud\(await desktop\('GET', '\/api\/state', null\)\)/.test(diffSrc)
  && /IGNORE_KEYS/.test(diffSrc));

/* 2026-11-28：最近删除直达回收站；「翻旧笔记 / 整库 Markdown 包」按用户确认移除。 */
const plusSrc = fs.readFileSync(path.join(CLOUD, 'sjplus.js'), 'utf8');
ok('手机「最近删除」直达回收站，不再借工具按钮中转',
  /if \(a === 'trash' && window\.SJPlusTrash\) window\.SJPlusTrash\(\)/.test(appSrc)
  && !/const b = \$('#sjPlusToolsBtn'); if \(b\) b\.click\(\)/.test(appSrc));
ok('云端「导入/导出」子菜单不再有「导出 Markdown」中转项',
  !/\{ label: '导出 Markdown', icon: I\.download, onClick: \(\) => \{ const el = \$('#sjPlusToolsBtn')/.test(appSrc));
ok('工具按钮自身就是回收站，不再弹「更多工具」三项菜单',
  /btn\.onclick = openTrash;/.test(plusSrc)
  && !/function openMenu\(/.test(plusSrc)
  && !/更多工具/.test(plusSrc.replace(/\/\*[\s\S]*?\*\//g, '')));
ok('翻旧笔记与整库 Markdown 导出的代码与样式已彻底移除',
  !/function openReview\(|function exportMd\(|function zipStore\(|function crc32\(|function noteMd\(|function htmlToMd\(/.test(plusSrc)
  && !/sjplus-menu|sjplus-review|sjplus-rew/.test(fs.readFileSync(path.join(CLOUD, 'sjplus.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''))
  && !/翻一条旧笔记|导出 Markdown 包/.test(plusSrc.replace(/\/\*[\s\S]*?\*\//g, '')));
ok('单篇 Markdown 导出仍在（NoteExport），未受整库包移除影响',
  /NoteExport\.toMarkdown/.test(appSrc));

/* 2026-11-28：永久删除改走应用内确认弹层。原生 confirm 在手机上把域名当标题，
   字号、按钮都跟拾笺自己的弹层不搭；云端 modal-root 原来比 sjplus-mask 低，
   不抬上来会确认框藏在回收站后面。 */
const modalZ = Number((/\.modal-root \{[^}]*?z-index:\s*(\d+)/.exec(styleSrc) || [])[1] || 0);
const plusZ = Number((/\.sjplus-mask \{[^}]*?z-index:\s*(\d+)/.exec(
  fs.readFileSync(path.join(CLOUD, 'sjplus.css'), 'utf8')) || [])[1] || 0);
ok('回收站永久删除走应用内确认弹层，不再用浏览器原生 confirm',
  /window\.SJConfirm = openConfirm;/.test(appSrc)
  && !/window\.confirm\(/.test(plusSrc)
  && /window\.SJConfirm\(\{/.test(plusSrc)
  && /title: isEmpty \? '清空回收站' : '彻底删除笔记'/.test(plusSrc)
  && /confirmText: '永久删除'/.test(plusSrc)
  && /danger: true/.test(plusSrc)
  && modalZ > plusZ);

/* 2026-11-28 实跑抓到的拆分遗留：imgSizer 留在 app-media.js 作用域，
   app.js 的点击监听却直接引用它 —— 每次点击都抛 ReferenceError。 */
ok('媒体模块的模块内状态不泄漏到 app.js：点空白收起尺寸条走导出函数',
  /media\.hideImgSizerOnOutside\(e\)/.test(appSrc)
  && !/if \(!imgSizer \|\| imgSizer\.classList/.test(appSrc)
  && /function hideImgSizerOnOutside\(e\)/.test(mediaSrc)
  && /hideImgSizerOnOutside,/.test(mediaSrc));

/* 构建 201 后用户反馈：新建笔记点正文无效。实跑抓到云端 app-media.js 的
   bindImgResize 直接用了 app.js 作用域的 NARROW —— 每次点 #richPane 都抛
   ReferenceError；而且云端把 bindImgResize 绑了两次，一次点击抛两遍。
   NARROW 在 app.js 后面才用 const 定义，必须惰性传壳，不能传值。 */
ok('媒体块不直接引用 app.js 私有 NARROW，正文图片尺寸只绑一次',
  !/\bNARROW\s*\(/.test(mediaSrc)
  && /isNarrow\(\)/.test(mediaSrc)
  && /isNarrow: \(\) => NARROW\(\)/.test(appSrc)
  && (appSrc.match(/bindImgResize\(\$\('#richPane'\), 'rich'\)/g) || []).length === 1);

console.log('\n结果：' + pass + ' 通过，' + fail + ' 失败');
process.exit(fail ? 1 : 0);
