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
ok('面板内容随 Markdown / 富文本切换', /if \(viewFormat === 'md'\)/.test(js));
ok('富文本面板有文字组', /group\('文字'\)/.test(js));
ok('富文本面板有段落组', /group\('段落'\)/.test(js));
ok('富文本面板有对齐组', /group\('对齐'\)/.test(js));
ok('富文本面板有列表组', /group\('列表'\)/.test(js));
ok('富文本面板有字号组', /group\('字号'\)/.test(js));
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
ok('阅读态正文保持适眼行宽', /body\.sj-note-read \.rich-pane,[\s\S]{0,120}max-width: 760px;/.test(css));
ok('底部工具条样式存在', /\.sj-edit-bar \{[\s\S]{0,400}border-radius: 999px;/.test(css));
ok('格式面板从右侧滑出', /\.sj-style-panel \{[\s\S]{0,300}right: 0;/.test(css));
ok('格式面板不遮顶栏（top 用变量）', /top: var\(--sj-sp-top/.test(css));

/* ---------- 6. 数据格式没被动过（回归保护） ---------- */
console.log('\n数据格式与保存链路未受影响');
ok('富文本仍存 innerHTML', /note\.content = \$\('#richPane'\)\.innerHTML;/.test(js));
ok('Markdown 仍存 textarea 的 value', /note\.content = \$\('#mdInput'\)\.value;/.test(js));
ok('富文本仍经 DOMPurify 净化', /DOMPurify\.sanitize\(note\.content \|\| ''\)/.test(js));
ok('标脏 / 落盘链路没变', /function markDirty\(\)/.test(js) && /function saveNow\(\)/.test(js));
ok('Markdown / 富文本切换仍保留', /data-format="md"/.test(html) && /data-format="rich"/.test(html));
ok('历史版本按钮仍在', /id="historyBtn"/.test(html));
ok('导出按钮仍在', /id="exportBtn2"/.test(html));
ok('删除按钮仍在', /id="deleteNoteBtn"/.test(html));

/* ---------- 7. 与手机端同源的视觉约定 ---------- */
console.log('\n与手机端一致的约定');
ok('编辑态有撤销 / 重做（与手机端同一套）', /id="sjUndoBtn"/.test(html) && /id="sjRedoBtn"/.test(html));
ok('撤销用 execCommand undo', /execCommand\('undo'\)/.test(js));
ok('重做用 execCommand redo', /execCommand\('redo'\)/.test(js));
ok('工具条用胶囊圆角（与手机端一致）', /border-radius: 999px/.test(css));

console.log(`\n结果：${pass} 通过，${fail} 失败`);
process.exit(fail ? 1 : 0);
