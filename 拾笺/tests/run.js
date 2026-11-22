/* 本地桌面版（拾笺/public）回归测试
   ------------------------------------------------------------
   只测「结构与关键约定」这一层：DOM 节点在不在、关键 class 有没有、
   关键函数在不在。交互行为靠 CDP 实拍验证，不在这里模拟。

   跑法：node 拾笺/tests/run.js */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'public');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

const html = read('index.html');
const js = read('app.js');
const css = read('style.css');
const syncJs = read('sync.js');
const sjplusJs = read('sjplus.js');

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name); }
}

/* ---------- 1. 阅读态 / 编辑态双形态的 DOM 骨架 ---------- */
console.log('\n双形态 DOM 骨架');
ok('阅读态大标题容器存在', /id="sjReadHero"/.test(html));
ok('大标题文本节点存在', /id="sjReadTitle"/.test(html));
ok('大标题下的元信息容器存在', /id="sjRhMeta"/.test(html));
ok('底部编辑工具条存在', /id="sjEditBar"/.test(html));
ok('格式面板存在', /id="sjStylePanel"/.test(html));
ok('格式面板内容容器存在', /id="sjStyleBody"/.test(html));
ok('格式面板遮罩存在', /id="sjStyleMask"/.test(html));
ok('顶栏撤销 / 重做 / 完成三个按钮存在',
  /id="sjUndoBtn"/.test(html) && /id="sjRedoBtn"/.test(html) && /id="sjDoneBtn"/.test(html));
ok('工具条五个按钮齐（格式/插图/附件/收藏/更多）', (() => {
  const bar = html.match(/id="sjEditBar"[\s\S]*?<\/div>\s*\n/);
  if (!bar) return false;
  return ['fmt', 'img', 'attach', 'star', 'more'].every(a => bar[0].includes(`data-act="${a}"`));
})());

/* ---------- 2. 形态切换的 JS 逻辑 ---------- */
console.log('\n形态切换逻辑');
ok('定义了阅读态 class 常量', /const NOTE_READ = 'sj-note-read'/.test(js));
ok('定义了编辑态 class 常量', /const NOTE_EDIT = 'sj-note-edit'/.test(js));
ok('有 setNoteMode 切换函数', /function setNoteMode\(/.test(js));
ok('有 syncNoteMode 同步函数', /function syncNoteMode\(/.test(js));
ok('阅读态把富文本设为不可编辑', /setAttribute\('contenteditable', 'false'\)/.test(js));
ok('编辑态把富文本设为可编辑', /setAttribute\('contenteditable', 'true'\)/.test(js));
ok('标题框在阅读态只读、编辑态可写', /ti\.readOnly = true/.test(js) && /ti\.readOnly = false/.test(js));
ok('打开笔记时会同步形态', /syncNoteMode\(note\)/.test(js));
ok('新建草稿直接进编辑态', /setNoteMode\(true, \{ focus: false \}\)/.test(js));
ok('点正文进编辑态', /function enterEditAt\(/.test(js) && /enterEditAt\(e\.clientX, e\.clientY\)/.test(js));
ok('完成按钮回阅读态', /sjDoneBtn[\s\S]{0,200}setNoteMode\(false\)/.test(js));

/* ---------- 3. 顶栏小标题接管 ---------- */
console.log('\n顶栏小标题接管');
ok('有 placeReadTitle 函数', /function placeReadTitle\(/.test(js));
ok('按滚动位置算接管进度', /const p = Math\.min\(1, Math\.max\(0, \(headBottom - hero\.bottom\)/.test(js));
ok('滚动时重新计算', /addEventListener\('scroll'[\s\S]{0,120}placeReadTitle\(\)/.test(js));

/* ---------- 4. 格式面板 ---------- */
console.log('\n格式面板');
ok('有 renderStylePanel 渲染函数', /function renderStylePanel\(/.test(js));
ok('有 openStylePanel / closeStylePanel', /function openStylePanel\(/.test(js) && /function closeStylePanel\(/.test(js));
ok('面板只有一套（不再按格式分叉）', !/if \(viewFormat === 'md'\)/.test(js));
ok('富文本面板有文字组', /group\('文字'\)/.test(js));
ok('富文本面板有段落组', /group\('段落'\)/.test(js));
ok('富文本面板有对齐组', /group\('对齐'\)/.test(js));
ok('富文本面板有列表组', /group\('列表'\)/.test(js));
ok('富文本面板有字号组', /sj-sp-sizes/.test(js) && /textContent = '字号'/.test(js));
ok('面板会自己存一份选区（面板是浮层，正文会失焦）',
  /function capturePanelRange\(/.test(js) && /function restorePanelRange\(/.test(js));
ok('点格式按钮前先恢复选区', /restorePanelRange\(\);\s*\n\s*fn\(\);/.test(js));
ok('对齐类命令用 styleWithCSS=true（否则净化会把样式抹掉）',
  /function cssCmd\([\s\S]{0,300}styleWithCSS', false, true/.test(js));

/* ---------- 5. 两种形态的 CSS ---------- */
console.log('\n两种形态的样式');
ok('阅读态隐藏常驻格式工具条', /body\.sj-note-read \.toolbar \{ display: none; \}/.test(css));
ok('阅读态隐藏标签行', /body\.sj-note-read \.tag-row \{ display: none; \}/.test(css));
ok('阅读态隐藏顶栏元信息行（分类已在正文大标题下）', /body\.sj-note-read \.meta-row \{ display: none; \}/.test(css));
ok('阅读态正文区整块滚动（大标题才跟得动）',
  /body\.sj-note-read \.editor-body \{[\s\S]{0,220}display: block;[\s\S]{0,220}overflow-y: auto;/.test(css));
ok('编辑态把布局还给 flex（否则源码和预览会上下叠一起）',
  /body\.sj-note-edit \.editor-body \{[\s\S]{0,120}display: flex;/.test(css));
ok('编辑态隐藏常驻格式工具条', /body\.sj-note-edit \.toolbar \{ display: none; \}/.test(css));
ok('编辑态把插图/附件/收藏收进底部工具条',
  /body\.sj-note-edit #imgBtn,[\s\S]{0,120}#attachBtn,[\s\S]{0,120}#starBtn \{ display: none; \}/.test(css));
ok('顶栏小标题默认透明', /body\.sj-note-read \.title-input \{[\s\S]{0,160}opacity: 0;/.test(css));
ok('接管后恢复不透明', /body\.sj-note-read\.sj-head-solid \.title-input \{ opacity: 1;/.test(css));
ok('阅读态正文保持适眼行宽', /body\.sj-note-read \.rich-pane \{[\s\S]{0,120}max-width: 760px;/.test(css));
ok('底部工具条样式存在', /\.sj-edit-bar \{[\s\S]{0,400}border-radius: 999px;/.test(css));
ok('格式面板从右侧滑出', /\.sj-style-panel \{[\s\S]{0,300}right: 0;/.test(css));
ok('格式面板不遮顶栏（top 用变量）', /top: var\(--sj-sp-top/.test(css));

/* ---------- 6. 数据格式没被动过（回归保护） ---------- */
console.log('\n数据格式与保存链路未受影响');
ok('富文本仍存 innerHTML', /note\.content = \$\('#richPane'\)\.innerHTML;/.test(js));
ok('存储层单一化：正文恒为富文本，无 md 渲染分支',
  /function noteHtml\(/.test(js)
  && /return DOMPurify\.sanitize\(note\.content \? String\(note\.content\) : ''\);/.test(js)
  && !/note\.format === 'rich'/.test(js));
ok('富文本仍经 DOMPurify 净化', /DOMPurify\.sanitize\(note\.content \|\| ''\)/.test(js));
ok('标脏 / 落盘链路没变', /function markDirty\(\)/.test(js) && /function saveNow\(\)/.test(js));
ok('顶栏不再有格式分段开关', !/data-format="md"/.test(html) && !/id="formatSwitch"/.test(html));
ok('源码降级为二级入口', /function showMarkdownSource\(/.test(js) && /Markdown 源码/.test(js));
ok('历史版本按钮仍在', /id="historyBtn"/.test(html));
ok('导出按钮仍在', /id="exportBtn2"/.test(html));
ok('删除按钮仍在', /id="deleteNoteBtn"/.test(html));

/* ---------- 6b. 编辑面收敛：正文只有富文本一个编辑面 ---------- */
console.log('\n编辑面收敛（Markdown / 富文本双模式已下线）');
ok('Markdown 源码框已从 DOM 移除', !/id="mdPane"/.test(html) && !/id="mdInput"/.test(html));
ok('编辑面只有 richPane 一个', !/id="mdPane"/.test(html) && !/id="previewPane"/.test(html)
  && /id="richPane"/.test(html) && !/\$\('#mdPane'\)/.test(js));
ok('Markdown 笔记一被编辑即升级为富文本', /note\.content = \$\('#richPane'\)\.innerHTML;[\s\S]{0,80}note\.format = 'rich';/.test(js));
ok('新建笔记默认富文本', /categoryId: target, title: '', content: '', format: 'rich'/.test(js));
ok('旧的 textarea 事件已摘掉', !/addEventListener\('input', onMdInput\)/.test(js)
  && !/function onMdInput\(/.test(js));
ok('旧的格式切换函数已摘掉', !/function switchFormat\(/.test(js));
ok('md 专属的插入助手已摘掉', !/function prefixLine\(/.test(js) && !/function wrapSel\(/.test(js));
ok('富文本补上了表格插入', /function insertRichTable\(/.test(js));
ok('正文只经富文本容器写回', !/note\.content = \$\('#mdInput'\)\.value;/.test(js)
  && /note\.content = \$\('#richPane'\)\.innerHTML;/.test(js));

/* ---------- 7. 与手机端同源的视觉约定 ---------- */
console.log('\n与手机端一致的约定');
ok('编辑态有撤销 / 重做（与手机端同一套）', /id="sjUndoBtn"/.test(html) && /id="sjRedoBtn"/.test(html));
ok('撤销用 execCommand undo', /execCommand\('undo'\)/.test(js));
ok('重做用 execCommand redo', /execCommand\('redo'\)/.test(js));
ok('工具条用胶囊圆角（与手机端一致）', /border-radius: 999px/.test(css));

/* ---------- 8. 存储层单一化（格式收敛） ---------- */
console.log('\n存储层收敛为单一富文本');
const serverJs = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const mdconvJs = fs.readFileSync(path.join(__dirname, '..', 'lib', 'mdconv.js'), 'utf8');
ok('客户端不再有 format 分支',
  !/format === 'rich'/.test(js) && !/format === 'md'/.test(js)
  && !/format !== 'rich'/.test(js) && !/format !== 'md'/.test(js));
ok('viewFormat 状态变量已删除', !/viewFormat/.test(js));
ok('格式嗅探函数已删除', !/looksRichContent/.test(js));
ok('服务端有 md→rich 转换层', /require\('.\/lib\/mdconv\.js'\)/.test(serverJs)
  && /function mdToRich\(/.test(mdconvJs) && /function toRichHtml\(/.test(mdconvJs));
ok('服务端写入路径一律转成富文本',
  /content: toRichHtml\(\{ content: body\.content/.test(serverJs)
  && /note\.content = toRichHtml\(\{ content: body\.content/.test(serverJs)
  && /content: toRichHtml\(\{ content: String\(n\.content/.test(serverJs));
ok('服务端落库格式恒为 rich',
  /format: 'rich',/.test(serverJs) && !/format: body\.format === 'rich' \? 'rich' : 'md'/.test(serverJs));
ok('服务端种子笔记已是富文本',
  /content: mdToRich\(welcome\), format: 'rich'/.test(serverJs)
  && /content: mdToRich\(codeNote\), format: 'rich'/.test(serverJs));
ok('服务端转换层拦住了危险协议',
  /isDangerousUrl/.test(mdconvJs) && /javascript:/.test(mdconvJs)
  && /DANGEROUS_ATTR/.test(mdconvJs));
ok('客户端保留 Markdown 出口：源码查看', /function showMarkdownSource\(/.test(js)
  && /td\.turndown/.test(js));
ok('客户端保留 Markdown 出口：导出 .md', /NoteExport\.toMarkdown/.test(js));
ok('保险箱导出仍是 Markdown', /function noteMd\(/.test(sjplusJs) && /function htmlToMd\(/.test(sjplusJs));
ok('粘贴 Markdown 会自动识别成排版', /function looksLikeMarkdown\(/.test(js)
  && /renderMarkdown\(text\)/.test(js));
ok('云端旧 md 行拉回本地时转成富文本', /SJRenderMarkdown/.test(js) && /SJRenderMarkdown/.test(syncJs));
ok('renderMarkdown 已导出到全局供 sync.js 用',
  /window\.SJRenderMarkdown = renderMarkdown/.test(js));
ok('迁移脚本存在且可执行', fs.existsSync(path.join(__dirname, '..', 'scripts', 'migrate-to-rich.js')));

console.log(`\n结果：${pass} 通过，${fail} 失败`);
process.exit(fail ? 1 : 0);
