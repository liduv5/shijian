/* 本地桌面版（拾笺/public）回归测试
   ------------------------------------------------------------
   只测「结构与关键约定」这一层：DOM 节点在不在、关键 class 有没有、
   关键函数在不在。交互行为靠 CDP 实拍验证，不在这里模拟。

   跑法：node 拾笺/tests/run.js */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..', 'public');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

const html = read('index.html');
const js = read('app.js');
const css = read('style.css');
const exportJs = read('export.js');
const e2eeJs = read('e2ee.js');
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
/* 编辑功能菜单改为「标题 + 分类下面常驻一条」，不再有底部胶囊和右侧弹出面板 */
ok('编辑工具条常驻（不再有底部胶囊 sjEditBar）', !/id="sjEditBar"/.test(html));
ok('不再有右侧格式面板（sjStylePanel / sjStyleBody / sjStyleMask 全移除）',
  !/id="sjStylePanel"/.test(html) && !/id="sjStyleBody"/.test(html) && !/id="sjStyleMask"/.test(html));
ok('常驻工具条位于标题、分类、标签全都下方、正文之前', (() => {
  const meta = html.indexOf('class="meta-row"');
  const tag = html.indexOf('class="tag-row"');
  const bar = html.indexOf('id="toolbar"');
  const body = html.indexOf('id="editorBody"');
  return meta > 0 && tag > meta && bar > tag && body > bar;
})());
ok('顶栏撤销 / 重做 / 完成三个按钮存在',
  /id="sjUndoBtn"/.test(html) && /id="sjRedoBtn"/.test(html) && /id="sjDoneBtn"/.test(html));

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
/* 进编辑态只走顶栏那颗铅笔（2026-11-22：阅读就只是阅读）。
   原来「点正文 → 进编辑」配了位移 4px / 有选区 / 点链接三道守卫，
   改成显式入口后整条拆掉：阅读态点正文只剩原生行为（拖选、复制、点链接）。 */
ok('阅读态顶栏有「编辑」按钮，点了进编辑态',
  /id="readEditBtn"/.test(html) && /READ_EDIT_BTN[\s\S]{0,220}setNoteMode\(true\)/.test(js)
  && /body\.sj-note-read #readEditBtn \{ display: grid;/.test(css));
ok('点正文不再进编辑态（enterEditAt / downPoint / enterTimer 全拆）',
  !/function enterEditAt\(/.test(js) && !/downPoint/.test(js)
  && !/enterTimer/.test(js) && !/hasRealSelection\(\)/.test(js)
  && !/cancelEnterEdit/.test(js));
ok('完成按钮回阅读态', /sjDoneBtn[\s\S]{0,200}setNoteMode\(false\)/.test(js));

/* 编辑区第二行只有分类名是热区，日期不可点 */
ok('分类名是独立按钮（带 data-meta-cat）', /metaInfoHTML\(/.test(js) && /data-meta-cat="1"/.test(js));
ok('点这行时只认分类按钮（点日期不弹分类框）',
  /#metaInfo'\)\.addEventListener\('click', \(e\) => \{[\s\S]{0,220}closest\('\[data-meta-cat\]'\)/.test(js));
ok('整行不再直接绑 openCategoryPicker',
  !/\$\('#metaInfo'\)\.addEventListener\('click', \(\) => openCategoryPicker/.test(js));

/* ---------- 3. 顶栏小标题接管 ---------- */
console.log('\n顶栏小标题接管');
ok('有 placeReadTitle 函数', /function placeReadTitle\(/.test(js));
ok('按滚动位置算接管进度', /const p = Math\.min\(1, Math\.max\(0, \(headBottom - hero\.bottom\)/.test(js));
ok('滚动时重新计算', /addEventListener\('scroll'[\s\S]{0,120}placeReadTitle\(\)/.test(js));

/* ---------- 4. 常驻编辑工具条（取代原弹出式格式面板） ---------- */
console.log('\n常驻编辑工具条');
ok('弹出式面板的整套函数已下线',
  !/function renderStylePanel\(/.test(js) && !/function openStylePanel\(/.test(js)
  && !/function closeStylePanel\(/.test(js) && !/function toggleStylePanel\(/.test(js));
ok('面板专用的选区暂存已下线（工具条常驻不抢焦点）',
  !/panelRange/.test(js) && !/function capturePanelRange\(/.test(js));
ok('工具条渲染函数仍在', /function renderToolbar\(/.test(js));
ok('工具条只有一套（不再按格式分叉）', !/if \(viewFormat === 'md'\)/.test(js));
ok('工具条有下划线', /btn\(I\.underline, '下划线'/.test(js));
ok('对齐收成一个下拉（左/右/居中/两端），按钮挂 tb-align',
  /tbAlignBtn = btn\([\s\S]{0,200}'对齐方式', \(\) => toggleAlignPop\(tbAlignBtn\), 'tb-align'/.test(js)
  && /'justifyFull'/.test(js));
ok('工具条能插入表格', /btn\(I\.table, '插入表格', insertRichTable\)/.test(js));
ok('对齐类命令用 styleWithCSS=true（否则净化会把样式抹掉）',
  /function cssCmd\([\s\S]{0,300}styleWithCSS', false, true/.test(js));

/* ---------- 4b. 文字颜色 / 清除格式 ---------- */
console.log('\n文字颜色与清除格式');
ok('工具条有文字颜色按钮', /'文字颜色', \(\) => toggleColorPop\(colorBtn\)/.test(js));
ok('色板和手机端同一套 6 色 + 默认',
  /const TEXT_COLORS = \[/.test(js) && /#d13b32/.test(js) && /#a554cd/.test(js)
  && /data-color="default"/.test(js));
ok('上色走 foreColor（styleWithCSS=true 才留得住内联 color）',
  /execCommand\('foreColor', false, color\)/.test(js)
  && /function applyTextColor[\s\S]{0,600}styleWithCSS', false, true/.test(js));
ok('只有光标时先选中整段再上色（和手机端一个规矩）',
  /const block = collapsed \? selectBlockAtCaret\(\) : null;/.test(js)
  && /function selectBlockAtCaret\(/.test(js));
ok('「默认颜色」是抹掉内联 color，不是写死一个色值',
  /stripCharStyles\(range, \['color'\]\)/.test(js) && !/color === 'default' \? getComputedStyle/.test(js));
ok('颜色横线读的是光标前一个字符的颜色（不是上次用过的颜色）',
  /function caretTextColor\(\)[\s\S]{0,260}getComputedStyle\(el\)\.color/.test(js)
  && /function paintColorMark\(\)[\s\S]{0,320}caretTextColor\(\)/.test(js)
  && !/lastTextColor/.test(js));
ok('光标一动颜色横线就跟着刷（和字体/字号下拉同一趟）',
  /function syncFontPickers\(\) \{[\s\S]{0,200}?syncUI\(\);/.test(js)
  && /function syncUI\(\) \{[\s\S]{0,200}?paintColorMark\(\);/.test(js));
ok('光标同步不吊死在 rAF 上（后台标签页一帧都不给也有 setTimeout 兜底）',
  /fontPickTimer = setTimeout\(run, 32\)/.test(js)
  && /cancelAnimationFrame\(fontPickTick\)/.test(js));
ok('清除格式有自己的实现（不再是一句 exec(removeFormat)）',
  /function clearFormat\(\)/.test(js) && !/'清除格式', \(\) => exec\('removeFormat'\)/.test(js));
ok('清除格式会自己扫内联 style（removeFormat 只管它认识的那几个命令）',
  /stripCharStyles\(after\)/.test(js) && /'caret-color'/.test(js));
ok('清除格式后把光标放回段末（不会留着整段选中被覆盖）',
  /function caretToBlockEnd\(block\)/.test(js) && /if \(collapsed\) caretToBlockEnd\(block\);/.test(js));
ok('色板挂在 body 上（工具条换行也裁不到）',
  /document\.body\.appendChild\(pop\)/.test(js) && /\.tb-color-pop \{[\s\S]{0,80}position: fixed/.test(css));

/* ---------- 4c. 字体 / 字号下拉回显当前值 ---------- */
console.log('\n字体 / 字号下拉回显当前值');
ok('下拉选完不再复位到占位文字', !/s\.value = ''; if \(v\) onChange\(v\);/.test(js));
ok('有回显函数，并挂在 selectionchange / onRichInput 上',
  /function syncFontPickers\(/.test(js) && /scheduleSyncFontPickers\(\);/.test(js)
  && (js.match(/scheduleSyncFontPickers\(\);/g) || []).length >= 2);
ok('字号不在预设档里就临时补一档（21px 也能选中）',
  /option\[data-temp\]/.test(js) && /insertBefore\(opt, next \|\| null\)/.test(js));
ok('字体只认正文里写过的 font-family（不拿兜底字体栈误报）',
  /function inlineFontFamily\(/.test(js) && /matchFontOption\(inlineFontFamily\(el\)\)/.test(js));
ok('只有光标时选字体/字号先整段选中（否则浏览器只记一笔 typing style）',
  /function blockAwareRange\(/.test(js)
  && /const \{ collapsed, block \} = blockAwareRange\(\);/.test(js));
ok('下拉宽度跟内容走（默认按「默认」量、选微软雅黑按「微软雅黑」量）',
  !/\.tb-select \{[\s\S]{0,400}field-sizing/.test(css)
  && /宽度跟内容走/.test(js)
  && /s\.options\[s\.selectedIndex >= 0 \? s\.selectedIndex : 0\]/.test(js)
  && !/fitSelPair/.test(js)
  && !/\.tb-select \{[\s\S]{0,400}min-width: 58px/.test(css));
ok('下拉吞掉原生箭头留白，改自绘小箭头（箭头紧贴文字）',
  (function () {
    // 行首要锚住：`.tb-pick .tb-select { ... }` 里也含 `.tb-select {`
    const a = css.search(/^\.tb-select \{/m);
    const b = a >= 0 ? css.indexOf('}', a) : -1;
    const block = a >= 0 && b > a ? css.slice(a, b) : '';
    return /appearance: none/.test(block) && /-webkit-appearance: none/.test(block)
      && /background-image: url\("data:image\/svg\+xml/.test(block)
      && /padding: 0 18px 0 8px/.test(block);
  })());
ok('下拉有保底宽度，不至于窄成一行裸文字',
  /\.tb-select \{[\s\S]{0,300}min-width: 52px/.test(css)
  && /\.tb-select\.is-size \{ min-width: 40px; \}/.test(css)
  && /s\.className = 'tb-select' \+ \(cls \? ' ' \+ cls : ''\)/.test(js)
  && /execFontSize\(v\), 'is-size', 'Z'\)/.test(js));
/* 字号和行距都只显示一个数字，光看「28 + 箭头」分不出谁是谁 → 前面挂字母标。 */
ok('字体/字号/行距各自带标签 T / Z / 行',
  /execFont\('fontName', v\), '', 'T'\)/.test(js)
  && /'is-size', 'Z'\)/.test(js) && /'is-lh', '行'\)/.test(js)
  && /\.tb-pick-tag \{[\s\S]{0,300}font-size: 11\.5px/.test(css)
  /* 悬停高亮画在 select 上：块宽 = 框宽，不再把 T 字母和内边距包进去 */
  && /\.tb-pick:hover \.tb-select,/.test(css)
  && /\.tb-pick:focus-within \.tb-select \{ background-color: var\(--surface-2\); color: var\(--text\); \}/.test(css)
  && !/\.tb-pick:hover \{ background-color/.test(css));
ok('点开下拉不描黑框（键盘聚焦改用底色提示）',
  /\.tb-select:focus \{ outline: none; \}/.test(css)
  && /\.tb-select:focus-visible \{ outline: none;/.test(css)
  && !/\.tb-select:focus-visible \{ outline: 2px solid/.test(css));

/* 行距原来是「标准/适中/紧凑」三档点击循环，实际不够用（用户反馈），
   改成和字号一样的像素下拉。老值存的是倍数，载入时按 16px 正文字号换算。 */
ok('行距是像素下拉，档位按正文基准字号生成',
  /const LH_PX = lhSteps\(\);/.test(js)
  && /function lhSteps\(\) \{[\s\S]{0,200}v \+= 2/.test(js)
  && /function clampLh\(v\)/.test(js)
  && /setState\(\{ richLh: clampLh\(state\.richLh\) \}\);/.test(js)
  && /setState\(\{ richLh: px \}\);/.test(js)
  && !/LH_STEPS/.test(js) && !/LH_LABELS/.test(js));
ok('行距写进 CSS 变量时带 px，老倍数自动换算成像素',
  /setProperty\('--sj-rich-lh', state\.richLh \+ 'px'\)/.test(js)
  && /if \(v < 3\) return Math\.min\(64, Math\.max\(14, Math\.round\(v \* 16 \/ 2\) \* 2\)\)/.test(js)
  && /line-height: max\(var\(--sj-rich-lh, 28px\), 1\.1em\)/.test(css));
/* 阅读态原来固定 1.85 不吃这个设置，用户要求跟着走。
   1.1em 只防「正文里被放大到 28–32px 的段落」叠字；原来 1.2em 会把
   16–20 三档在 17px 正文下整体吃掉，看着像选了没反应。 */
ok('阅读态正文也吃同一套像素行距',
  /body\.sj-note-read \.rich-pane \{[\s\S]{0,200}line-height: max\(var\(--sj-rich-lh, 28px\), 1\.1em\)/.test(css)
  && !/body\.sj-note-read \.rich-pane \{[\s\S]{0,160}line-height: 1\.85/.test(css));
ok('行距下拉回显当前值（不在预设档就临时补一档）',
  /function syncLhPicker\(\)[\s\S]{0,700}data-temp/.test(js)
  && /tbLhSel\.value = v;/.test(js));

/* ---------- 4d. 正文载入体检 ---------- */
console.log('\n正文载入体检（caret-color / 列表野段落）');
ok('noteHtml 先净化再过体检', /return normalizeRich\(DOMPurify\.sanitize\(/.test(js));
ok('抹掉内联 caret-color（手机端上色留下的透明光标）',
  /function normalizeRich[\s\S]{0,700}caret-color/.test(js));
ok('列表里混进来的段落会被清理', /querySelectorAll\('ol, ul'\)/.test(js));

/* ---------- 5. 两种形态的 CSS ---------- */
console.log('\n两种形态的样式');
ok('阅读态隐藏常驻格式工具条', /body\.sj-note-read \.toolbar \{ display: none; \}/.test(css));
ok('阅读态隐藏标签行', /body\.sj-note-read \.tag-row \{ display: none; \}/.test(css));
ok('阅读态隐藏顶栏元信息行（分类已在正文大标题下）', /body\.sj-note-read \.meta-row \{ display: none; \}/.test(css));
ok('阅读态正文区整块滚动（大标题才跟得动）',
  /body\.sj-note-read \.editor-body \{[\s\S]{0,220}display: block;[\s\S]{0,220}overflow-y: auto;/.test(css));
ok('编辑态把布局还给 flex（否则源码和预览会上下叠一起）',
  /body\.sj-note-edit \.editor-body \{[\s\S]{0,120}display: flex;/.test(css));
ok('编辑态照常显示工具条（不再隐藏）', !/body\.sj-note-edit \.toolbar \{ display: none; \}/.test(css));
ok('编辑态顶栏的插图/附件/收藏不再被收起',
  !/body\.sj-note-edit #imgBtn,[\s\S]{0,120}#attachBtn,[\s\S]{0,120}#starBtn \{ display: none; \}/.test(css));
/* 阅读态正文 contenteditable=false，插入图片/添加附件属于「写」，点了没意义 */
ok('阅读态隐藏插入图片与添加附件',
  /body\.sj-note-read #imgBtn,\s*body\.sj-note-read #attachBtn \{ display: none; \}/.test(css)
  && !/body\.sj-note-edit #imgBtn/.test(css));
ok('阅读态仍留着收藏、历史版本、导出、删除',
  !/body\.sj-note-read #starBtn/.test(css)
  && !/body\.sj-note-read #historyBtn/.test(css)
  && !/body\.sj-note-read #exportBtn2/.test(css)
  && !/body\.sj-note-read #deleteNoteBtn/.test(css));
ok('顶栏小标题默认透明', /body\.sj-note-read \.title-input \{[\s\S]{0,160}opacity: 0;/.test(css));
ok('接管后恢复不透明', /body\.sj-note-read\.sj-head-solid \.title-input \{ opacity: 1;/.test(css));
ok('阅读态正文保持适眼行宽', /body\.sj-note-read \.rich-pane \{[\s\S]{0,120}max-width: 760px;/.test(css));
ok('底部胶囊与右侧面板的样式已清除',
  !/\.sj-edit-bar \{/.test(css) && !/\.sj-style-panel \{/.test(css) && !/\.sj-sp-btn \{/.test(css));

/* ---------- 5.5 阅读态只读：分类当标签、标签只展示 ---------- */
console.log('\n阅读态只读（电脑端）');
ok('阅读态分类是纯标签：span 而非按钮，不绑点击',
  /const catEl = document\.createElement\('span'\);/.test(js)
  && /catEl\.className = 'sj-rh-cat is-label'/.test(js)
  && !/catBtn\.addEventListener\('click'/.test(js));
ok('阅读态在大标题下渲染只读标签胶囊（不带 ×）',
  /\(note\.tags \|\| \[\]\)\.forEach\(\(t\) => \{[\s\S]{0,220}chip\.className = 'tag-chip is-ro'/.test(js));
ok('只有编辑态才响应点分类改名',
  /#metaInfo'\)\.addEventListener\('click', \(e\) => \{[\s\S]{0,240}classList\.contains\(NOTE_EDIT\)\) return;/.test(js));
ok('阅读态分类不回手型、不给 ▾',
  /body\.sj-note-read \.meta-cat \{ cursor: default; pointer-events: none; \}/.test(css)
  && /body\.sj-note-read \.meta-cat \.meta-caret \{ display: none; \}/.test(css)
  && /\.sj-rh-cat\.is-label \{ background: transparent;/.test(css)
  && !/\.sj-rh-cat::after \{/.test(css));

/* ---------- 6. 数据格式没被动过（回归保护） ---------- */
console.log('\n数据格式与保存链路未受影响');
ok('富文本仍存 innerHTML', /const html = \$\('#richPane'\)\.innerHTML;[\s\S]{0,80}note\.content = html;/.test(js));
ok('存储层单一化：正文恒为富文本，无 md 渲染分支',
  /function noteHtml\(/.test(js)
  && /DOMPurify\.sanitize\(note\.content \? String\(note\.content\) : ''\)/.test(js)
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
ok('Markdown 笔记一被编辑即升级为富文本', /note\.content = html;[\s\S]{0,80}note\.format = 'rich';/.test(js));
ok('新建笔记默认富文本', /categoryId: target, title: '', content: '', format: 'rich'/.test(js));
ok('旧的 textarea 事件已摘掉', !/addEventListener\('input', onMdInput\)/.test(js)
  && !/function onMdInput\(/.test(js));
ok('旧的格式切换函数已摘掉', !/function switchFormat\(/.test(js));
ok('md 专属的插入助手已摘掉', !/function prefixLine\(/.test(js) && !/function wrapSel\(/.test(js));
ok('富文本补上了表格插入', /function insertRichTable\(/.test(js));
ok('正文只经富文本容器写回', !/note\.content = \$\('#mdInput'\)\.value;/.test(js)
  && /const html = \$\('#richPane'\)\.innerHTML;/.test(js));

/* ---------- 7. 与手机端同源的视觉约定 ---------- */
console.log('\n与手机端一致的约定');
ok('编辑态有撤销 / 重做（与手机端同一套）', /id="sjUndoBtn"/.test(html) && /id="sjRedoBtn"/.test(html));
ok('撤销走自建 HTML 快照栈，无可撤销时置灰禁用',
  /richUndo\(\)/.test(js) && /b\.disabled = !canU/.test(js)
  && /id="sjUndoBtn"[^>]*\sdisabled/.test(html)
  && /\.sj-ea-btn:disabled\s*\{[^}]*opacity:\s*\.32/.test(css));
ok('重做走自建 HTML 快照栈，无可重做时置灰禁用',
  /richRedo\(\)/.test(js) && /b\.disabled = !canR/.test(js)
  && /id="sjRedoBtn"[^>]*\sdisabled/.test(html)
  && /\.sj-ea-btn:disabled:hover[^{]*\{[^}]*transparent/.test(css));
ok('常驻工具条样式在（横排、可换行、有最小高度）',
  /\.toolbar \{[\s\S]{0,300}display: flex;[\s\S]{0,300}flex-wrap: wrap;/.test(css));

/* ---------- 7b. 收藏星标：金色 ---------- */
console.log('\n收藏星标用金色');
ok('两个主题都定义了 --star-gold',
  /--star-gold: #c8892a;/.test(css) && /--star-gold: #d8a44a;/.test(css));
ok('收藏按钮 on 态用金色（填充 + 描边）',
  /#starBtn\.on \{ color: var\(--star-gold\); \}/.test(css)
  && /#starBtn\.on svg \{ fill: var\(--star-gold\); stroke: var\(--star-gold\); \}/.test(css));
ok('列表卡 / 侧栏树 / 首页卡三处星标都跟着变金',
  /\.note-card-title svg \{[\s\S]{0,160}var\(--star-gold\)/.test(css)
  && /\.tree-note-title svg \{[\s\S]{0,160}var\(--star-gold\)/.test(css)
  && /\.home-card-title svg\.star \{[\s\S]{0,120}var\(--star-gold\)/.test(css)
  && /<svg class="ico star"/.test(js));
ok('保存状态的小圆点仍是中性色（没被染成金）',
  /\.save-state\.saving::before \{ background: var\(--star\); opacity: 1; \}/.test(css));

/* ---------- 8. 存储层单一化（格式收敛） ---------- */
console.log('\n存储层收敛为单一富文本');
const serverJs = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const mdconvJs = fs.readFileSync(path.join(__dirname, '..', 'lib', 'mdconv.js'), 'utf8');
/* 转换与净化逻辑已搬到两端共用的内核里，lib/mdconv.js 只是 Node 侧适配层。
   这里读内核，同时校验它和云端那份逐字相同。 */
const mdconvCore = read('mdconv-core.js');
const rtCore = read('richtext-core.js');
ok('客户端不再有 format 分支',
  !/format === 'rich'/.test(js) && !/format === 'md'/.test(js)
  && !/format !== 'rich'/.test(js) && !/format !== 'md'/.test(js));
ok('viewFormat 状态变量已删除', !/viewFormat/.test(js));
ok('格式嗅探函数已删除', !/looksRichContent/.test(js));
ok('服务端有 md→rich 转换层', /require\('.\/lib\/mdconv\.js'\)/.test(serverJs)
  && /function mdToRich\(/.test(mdconvCore) && /function toRichHtml\(/.test(mdconvCore));
ok('适配层只做装配，不再自带一份转换逻辑',
  /require\('\.\.\/public\/mdconv-core\.js'\)/.test(mdconvJs)
  && !/function stripDangerous/.test(mdconvJs));
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
  /isDangerousUrl/.test(mdconvCore) && /javascript:/.test(mdconvCore)
  && /DANGEROUS_ATTR/.test(mdconvCore));
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

console.log('\n阅读态舒适度（P1：Aa 浮层 / 看大图 / 下拉量宽）');
/* 字号、行距都是本机显示偏好：只改 CSS 变量，不动笔记内容。 */
ok('阅读态顶栏有 Aa，只在阅读态出现',
  /id="readAaBtn"/.test(html)
  && /body\.sj-note-read \.read-aa-btn \{ display: grid;/.test(css)
  && /\.read-aa-btn \{ display: none; \}/.test(css));
ok('Aa 浮层只有字号、行距两行滑杆 + 恢复默认',
  /id="readAaFs"/.test(html) && /id="readAaLh"/.test(html) && /id="readAaReset"/.test(html)
  && /function aaSync\(\)/.test(js) && /function aaToggle\(\)/.test(js));
ok('Aa 只改显示偏好：写 --sj-rich-fs、存本机、不标脏',
  /setState\(\{ richFs: clampFs\(AA_FS\.value\) \}\)/.test(js)
  && /setProperty\('--sj-rich-fs', state\.richFs \+ 'px'\)/.test(js)
  && /localStorage\.setItem\('sj_rich_fs'/.test(js)
  && !/state\.richFs[\s\S]{0,120}markDirty\(\)/.test(js));
ok('正文字号吃 --sj-rich-fs（编辑面 16 / 阅读态 17 兜底）',
  /\.rich-pane\.markdown-body \{[\s\S]{0,120}font-size: var\(--sj-rich-fs, 16px\)/.test(css)
  && /body\.sj-note-read \.rich-pane \{[\s\S]{0,120}font-size: var\(--sj-rich-fs, 17px\)/.test(css));
ok('行距下界跟着字号走（24px 正文配 22px 行距会叠字）',
  /function lhMin\(\) \{ return Math\.ceil\(lhBasePx\(\) \* 1\.2 \/ 2\) \* 2; \}/.test(js)
  && /for \(let v = lhMin\(\); v <= 48; v \+= 2\)/.test(js)
  && /Math\.max\(lhMin\(\), n\)/.test(js)
  && /function rebuildLhOptions\(\)/.test(js));
ok('阅读态点图片开大图，复用附件查看器；编辑态不受影响',
  /function openSrcLightbox|openAttLightbox\(\{ type: 'image\/png', data:/.test(js)
  && /if \(noteMode !== 'read'\) return;/.test(js)
  && /function openAttLightbox\(a\)/.test(js));
/* 点图只该发生一件事：阅读态看大图，编辑态调宽度。
   两边同时触发时，尺寸条会被遮在预览层后面露半截（2026-11-22 用户报的）。 */
ok('阅读态点图不再弹出图片宽度条（尺寸条是写操作）',
  /if \(noteMode === 'read'\) return;\s*\n\s*const img = e\.target\.closest/.test(js));
ok('切回阅读态时自动收起图片宽度条',
  /closeImgSizer\(\);\s*\n\s*placeReadTitle\(\);/.test(js));
/* noteMode 之前是个「声明了但从不赋值」的死变量，永远停在 'read'：
   结果编辑态点图也会开大图，⌘B 加粗也永远进不了分支。 */
ok('形态变量 noteMode 跟着 setNoteMode 走',
  /noteMode = edit \? 'edit' : 'read';/.test(js)
  && /noteMode = 'read';/.test(js));
ok('下拉宽度自己量（不依赖 field-sizing）',
  /function fitSel\(s\)/.test(js) && /function measureSel\(s\)/.test(js)
  && /white-space:pre/.test(js)
  && /fitSel\(tbLhSel\)/.test(js));

console.log('\n导出、标题与平台提示（2026-11-22）');
ok('窗口标题就是「拾笺」', /<title>拾笺<\/title>/.test(html));
/* 图片在 Word 里丢掉的两个原因：data: 图 fetch 不出来、<div> 里单独一张图
   走了 paragraphFrom（只吐一行「［图片］」文字）。 */
ok('导出 Word：data: 图片自己解 base64，不走 fetch',
  /function dataUrlToBytes\(/.test(exportJs) && /\/\^data:\/i\.test\(src\)/.test(exportJs)
  && /img\.__docx = \{ data: bytes/.test(exportJs));
ok('导出 Word：<div> 里单独一张图也插进正文',
  /const imgs = Array\.from\(child\.querySelectorAll\('img'\)\);[\s\S]{0,220}imgs\.forEach\(\(img\) => out\.push\(imageParagraph\(img\)\)\)/.test(exportJs));
ok('导出备份先问保存位置，没有 showSaveFilePicker 才回退下载',
  /function pickSaveHandle\(/.test(exportJs) && /showSaveFilePicker/.test(exportJs)
  && /pickSaveHandle\(name, \{ types: \[\{ description: '拾笺备份'/.test(js)
  && /if \(!handle\) \{ window\.location\.href = '\/api\/export'; return; \}/.test(js));
ok('加密备份也走同一套「先问位置」', /NoteExport\.saveBlob\(blob, name/.test(e2eeJs));
ok('快捷键提示按平台显示（非 Mac 写 Ctrl K）',
  /function applyPlatformKeyLabels\(/.test(js) && /'Ctrl K'/.test(js) && /id="searchKbd"/.test(html));
ok('分类名旁的小三角改成 12px SVG 箭头（原来是 9px 的 ▾ 字符）',
  /<svg class="meta-caret"/.test(js)
  && /\.meta-caret \{[\s\S]{0,120}width: 12px; height: 12px/.test(css)
  && !/\.meta-caret \{ font-style: normal; font-size: 9px/.test(css));
ok('侧栏分类树的展开箭头放大到 13px',
  /\.caret svg \{ width: 13px; height: 13px; \}/.test(css));

ok('收起侧栏/列表用面板图标，与编辑器返回箭头区分（2026-11-23）',
  /function svgCollapse\(\)/.test(js)
  && /<rect x="3\.5" y="4\.5"/.test(js)
  && !/svgChevron/.test(js)
  && /sbBtn\.innerHTML = svgCollapse\(\)/.test(js)
  && /listBtn\.innerHTML = svgCollapse\(\)/.test(js)
  && /id="editorBack"[\s\S]{0,220}M20 12H5[\s\S]{0,80}M11 6l-6 6 6 6/.test(html));

console.log('\n附件面板三态折叠（电脑端，与手机端一致 2026-11-23）');
ok('附件面板三态（open / collapsed / hidden）有统一读写函数',
  /function attachStateOf\(\) \{/.test(js) && /function setAttachState\(state\) \{/.test(js)
  && /function attachHasAny\(\) \{/.test(js));
ok('阅读态点 ⌄ 压成窄条、箭头翻上来；编辑态仍是整块收起',
  /noteMode === 'read'[\s\S]{0,160}classList\.toggle\('is-collapsed'\)/.test(js)
  && /body\.sj-note-read \.attach-panel\.is-collapsed \{/.test(css)
  && /\.attach-panel\.is-collapsed #closeAttachBtn \.ico \{[\s\S]{0,120}rotate\(180deg\)/.test(css));
ok('窄条整条是抓手（按钮铺满 + 点面板也能展开）',
  /#closeAttachBtn \{\s+(?:flex: 1 1 auto; )?width: 100%; height: 26px/.test(css)
  && /\$\('#attachPanel'\)\.addEventListener\('click'/.test(js));
ok('换笔记重置为摊开、上传附件后展开、切形态同步附件态',
  /setAttachState\(note\.attachments && note\.attachments\.length \? 'open' : 'hidden'\)/.test(js)
  && /setAttachState\('open'\);[\s\S]{0,60}toast\(`已添加/.test(js)
  && /if \(edit\) \{[\s\S]{0,160}attachStateOf\(\) === 'collapsed'[\s\S]{0,120}setAttachState\(attachHasAny\(\)/.test(js));


console.log('\n目录悬停信息改成跟随行的浮层（2026-11-23）');
ok('浮层是不透明卡片，不再用底部渐变条压在目录文字上',
  /\.tree-meta \{[\s\S]{0,120}position: fixed/.test(css)
  && /\.tree-meta \{[\s\S]{0,600}background: var\(--surface\)/.test(css)
  && !/\.tree-meta \{[\s\S]{0,300}linear-gradient\(to bottom, transparent/.test(css));
ok('浮层贴着被悬停那一行定位，并夹在目录滚动区内',
  /const r = row\.getBoundingClientRect\(\);/.test(js)
  && /meta\.offsetWidth/.test(js)
  && /r\.top - h - 5/.test(js)
  && /c\.right - w - 8/.test(js));
ok('扫过目录不闪卡片，也不再叠一层原生 title',
  /setTimeout\(\(\) => showTreeMeta\(row\), 120\)/.test(js)
  && !/row\.title = n\.title/.test(js)
  && /tree-meta-title/.test(js));

/* ---------- 4d. 段落格式合并 + 文字背景色（2026-11-25） ---------- */
console.log('\n段落格式下拉与文字背景色');
ok('H1/H2/H3/正文 不再各占一个按钮，合成一个下拉',
  !/'<span class="tb-text">H1<\/span>'/.test(js)
  && /'<span class="tb-block-label">正文<\/span><span class="tb-caret"><\/span>'/.test(js)
  && /function toggleBlockPop\(/.test(js));
ok('菜单里有 H1~H5 和正文，并且只标当前那一条',
  /const BLOCK_OPTS = \[\['h1', 'H1'\], \['h2', 'H2'\], \['h3', 'H3'\], \['h4', 'H4'\], \['h5', 'H5'\], \['p', '正文'\]\]/.test(js)
  && /tb-block-chk/.test(js)
  && /function blockTagAtCaret\(/.test(js));
ok('按钮上写的是光标所在的块名，光标一动就跟着换',
  /function paintBlockLabel\(\)[\s\S]{0,320}blockTagAtCaret\(\)/.test(js)
  && /function syncUI\(\) \{[\s\S]{0,200}?paintBlockLabel\(\);/.test(js));
ok('换块后光标落到新块末尾（旧节点换掉后 caretToBlockEnd 会空转）',
  /function applyBlockTag\([\s\S]{0,700}const now = window\.getSelection\(\);[\s\S]{0,260}caretToBlockEnd\(closestBlock\(r\.startContainer\)\)/.test(js));
ok('有文字背景色按钮，走 hiliteColor（styleWithCSS=true）',
  /'文字背景色', \(\) => toggleColorPop\(bgBtn, 'bg'\)/.test(js)
  && /execCommand\('hiliteColor', false, color\)/.test(js)
  && /function applyBgColor\(/.test(js));
ok('背景色是半透明调子（深色主题下不会浅底浅字）',
  /const BG_COLORS = \[/.test(js) && /rgba\(209,59,50,\.20\)/.test(js)
  && !/const BG_COLORS = \[[\s\S]{0,400}#f/i.test(js));
ok('「无背景」是抹掉内联 background，不是盖一块白底',
  /stripCharStyles\(range, \['background-color', 'background'\]\)/.test(js));
ok('方框里的 A 回显光标处的背景色',
  /function paintBgMark\(\)[\s\S]{0,300}caretBgColor\(\)/.test(js)
  && /function syncUI\(\) \{[\s\S]{0,200}?paintBgMark\(\);/.test(js));
ok('色板和段落菜单都不吃点击焦点（mousedown 被拦）',
  /function toggleBlockPop\([\s\S]{0,900}pop\.addEventListener\('mousedown', \(e\) => e\.preventDefault\(\)\)/.test(js)
  && /\.tb-block-pop \{[\s\S]{0,60}position: fixed/.test(css));

console.log('行内代码（2026-11-25）');
ok('工具栏有独立的「行内代码」按钮，图标与代码块不重样',
  /const inlineCodeBtn = btn\(I\.codeInline, '行内代码 \(Ctrl\+E\)', toggleInlineCode/.test(js)
  && /codeInline: '<svg viewBox="0 0 24 24" class="ico"><rect/.test(js)
  && /code: '<svg viewBox="0 0 24 24" class="ico"><path d="M9 8l-4 4 4 4M15 8l4 4-4 4"\/><\/svg>'/.test(js));
ok('按文本节点逐个包 code，不用 surroundContents 硬套整段',
  /function wrapInlineCode\([\s\S]{0,900}r\.extractContents\(\)/.test(js)
  && !/\.surroundContents\(/.test(js)
  && /if \(t === range\.startContainer\) r\.setStart\(t, range\.startOffset\)/.test(js));
ok('光标已在行内代码里再按一次就脱掉（不是又包一层）',
  /function toggleInlineCode\(\)[\s\S]{0,600}const code = inlineCodeAt\(range\.startContainer\)/.test(js)
  && /unwrapInlineCode\(code\)/.test(js)
  && /function unwrapInlineCode\([\s\S]{0,320}parent\.replaceChild\(frag, code\)/.test(js));
ok('代码块里的 code 不算行内代码（不参与切换）',
  /function inlineCodeAt\([\s\S]{0,300}el\.closest\('pre'\) \? null : el/.test(js));
ok('没选中时插一对占位并全选，可直接打字替换',
  /fresh\.textContent = '代码'[\s\S]{0,260}r\.selectNodeContents\(fresh\)/.test(js));
ok('Ctrl / ⌘ + E 是行内代码快捷键，只在编辑态接管',
  /if \(mod && e\.key\.toLowerCase\(\) === 'e' && !e\.shiftKey\)[\s\S]{0,220}toggleInlineCode\(\)/.test(js));
ok('光标在行内代码里按钮亮着',
  /function paintInlineCodeMark\(\)[\s\S]{0,320}\[data-act="inline-code"\]/.test(js)
  && /function syncUI\(\) \{[\s\S]{0,200}?paintInlineCodeMark\(\);/.test(js));

console.log('标题层级（2026-11-25）');
ok('H5/H6 有自己的样式，不会掉回浏览器默认的 0.83em / 1.67em',
  /\.markdown-body h5 \{ font-size: \.92em; color: var\(--text-3\); \}/.test(css)
  && /\.markdown-body h6 \{ font-size: \.9em; color: var\(--text-3\); font-weight: 500; \}/.test(css));
ok('H1~H6 共用同一套行高与上下留白',
  /\.markdown-body h1,\s*\.markdown-body h2,\s*\.markdown-body h3,\s*\.markdown-body h4,\s*\.markdown-body h5,\s*\.markdown-body h6 \{[\s\S]{0,260}margin: 1\.6em 0 \.6em/.test(css));
ok('打印样式跟着覆盖到 H5/H6',
  /\.print-area \.markdown-body h4,\s*\.print-area \.markdown-body h5,\s*\.print-area \.markdown-body h6 \{/.test(css));

console.log('换块时摘掉内联字号（2026-11-25）');
ok('换标题会清掉块内的内联 font-size，级别才看得出变化',
  /function dropBlockFontSize\(range\) \{/.test(js)
  && /el\.style\.removeProperty\('font-size'\)/.test(js)
  && /el\.removeAttribute\('style'\);/.test(js));
ok('formatBlock 之后立刻清，清理范围跟着当前选区',
  /document\.execCommand\('formatBlock', false, '<' \+ tag \+ '>'\);[\s\S]{0,420}dropBlockFontSize\(r\);/.test(js)
  && /range\.intersectsNode\(el\)/.test(js));

console.log('收起侧栏后放宽正文列宽（2026-11-25）');
ok('编辑列宽走 --doc-col：展开 880、收起 980，只在 ≥981px 生效',
  /@media \(min-width: 981px\) \{[\s\S]{0,600}body\.sj-note-edit \{ --doc-col: 880px; \}[\s\S]{0,200}body\.sj-note-edit\.nav-sb-collapse \{ --doc-col: 980px; \}/.test(css));
ok('标题行/meta/标签/工具条与正文同列同宽，不再各有各的左边界',
  /body\.sj-note-edit \.editor-head,\s*body\.sj-note-edit \.meta-row,\s*body\.sj-note-edit \.tag-row,\s*body\.sj-note-edit \.toolbar \{[\s\S]{0,200}max-width: var\(--doc-col\)/.test(css)
  && /body\.sj-note-edit \.rich-pane \{ max-width: var\(--doc-col\); \}/.test(css));
ok('工具条与标题行补到 32px 内边距，文字左界跟正文齐；间距收紧避免折行',
  /body\.sj-note-edit \.toolbar \{ padding-left: 32px; padding-right: 32px; \}/.test(css)
  && /body\.sj-note-edit \.editor-head \{ padding-right: 32px; \}/.test(css)
  && /body\.sj-note-edit \.toolbar \{ column-gap: 1px; \}/.test(css)
  && /body\.sj-note-edit \.tb-sep \{ margin: 0 3px; \}/.test(css));
ok('阅读收起后正文与大标题一起放到 860',
  /body\.nav-sb-collapse\.sj-note-read \.rich-pane,\s*body\.nav-sb-collapse\.sj-note-read \.sj-read-hero \{ max-width: 860px; \}/.test(css));
ok('没收起时仍是原来的 760 / 880，默认视图不受影响',
  /body\.sj-note-read \.rich-pane \{\s*overflow: visible;\s*max-width: 760px;/.test(css)
  && /^\.rich-pane \{[\s\S]{0,120}max-width: 880px;/m.test(css));

console.log('对齐合并 + 缩进（2026-11-25）');
ok('三个平铺的对齐按钮已收成一个下拉',
  !/btn\(I\.alignLeft, '左对齐'/.test(js)
  && !/btn\(I\.alignCenter, '居中'/.test(js)
  && !/btn\(I\.alignRight, '右对齐'/.test(js));
ok('下拉里有左/右/居中/两端四种，两端走 justifyFull',
  /const ALIGN_OPTS = \[[\s\S]{0,320}'justifyFull'/.test(js)
  && /'左对齐', 'justifyLeft'/.test(js) && /'右对齐', 'justifyRight'/.test(js) && /'居中', 'justifyCenter'/.test(js));
ok('按钮图标跟着光标所在块的对齐方式换',
  /function paintAlignIcon\(\)/.test(js) && /paintAlignIcon\(\);/.test(js)
  && /function alignAtCaret\(\)/.test(js) && /getComputedStyle\(blk\)\.textAlign/.test(js));
ok('缩进是块级 margin-left，不用 execCommand(indent)，免得变成引用',
  /function stepIndent\(dir\)/.test(js) && /el\.style\.marginLeft = \(lv \* INDENT_STEP_EM\) \+ 'em'/.test(js)
  && !/execCommand\('indent', false/.test(js));
ok('缩进有上下限，不会一路缩到底',
  /INDENT_STEP_EM = 2/.test(js) && /INDENT_MAX_EM = 8/.test(js)
  && /Math\.min\(INDENT_MAX_EM \/ INDENT_STEP_EM, lv\)/.test(js));
ok('选中多段时每段都缩，嵌套块不叠加两份',
  /function blocksForRange\(range\)/.test(js) && /el\.contains\(o\)/.test(js));
ok('缩进改完主动走一遍 onRichInput，否则不标脏、自动保存不跑',
  /if \(blocks\.length\) onRichInput\(\);/.test(js));

console.log('首次启动的欢迎笔记（2026-11-25）');
const serverSrc = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const welcomeSrc = (serverSrc.match(/const welcome = `([\s\S]*?)`;\n/) || [])[1] || '';
ok('欢迎笔记还在种子里，且没被拆成多段', welcomeSrc.length > 400);
ok('不再写「三个区域 / 底部工具条」那套老布局',
  !/三个区域/.test(welcomeSrc) && !/底部工具条/.test(welcomeSrc));
ok('改成现在的两栏：左边导航 + 右边正文',
  /## 界面就两块/.test(welcomeSrc) && /左边导航/.test(welcomeSrc) && /右边正文/.test(welcomeSrc));
ok('带上侧栏收起 / 展开导航', /收起侧栏/.test(welcomeSrc) && /展开导航/.test(welcomeSrc));
ok('带上标题级别下拉与行内代码 Ctrl+E',
  /H1~H5/.test(welcomeSrc) && /Ctrl\+E/.test(welcomeSrc));
ok('带上同步到云端与手机端', /同步到云端/.test(welcomeSrc) && /拾笺云端/.test(welcomeSrc));

console.log('两端共享内核（2026-11-26）');
/* 真源在桌面 public/，同步脚本推到云端；这里用 md5 卡住漂移。
   以前 mdconv 两边各抄一份，已经漂成 44/84 行相同。 */
const CLOUD_DIR = path.join(__dirname, '..', '..', '拾笺云端');
const md5 = (p) => crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex');
for (const f of ['mdconv-core.js', 'richtext-core.js', 'cat-core.js']) {
  const a = path.join(ROOT, f);
  const b = path.join(CLOUD_DIR, f);
  ok('共享内核两端逐字相同：' + f,
    fs.existsSync(a) && fs.existsSync(b) && md5(a) === md5(b));
}
ok('桌面页面在内核之后才加载 app.js',
  html.indexOf('/richtext-core.js') > 0
  && html.indexOf('/richtext-core.js') < html.indexOf('/app.js'));
ok('app.js 不再内联一份 turndown 配置',
  !/new TurndownService\(/.test(js) && /SJRTCore\.createTurndown/.test(js));
ok('内核支持 Node 与浏览器两种加载方式',
  /module\.exports = factory\(\)/.test(rtCore) && /root\.SJRTCore = factory\(\)/.test(rtCore)
  && /root\.SJMDConvCore = factory\(\)/.test(mdconvCore)
  && /root\.SJCats = factory\(\)/.test(read('cat-core.js')));

console.log('只有空的叶子分类能删（2026-11-27）');
/* 用户定：分类只是容器，笔记才是内容，子分类是结构本身。
   两样还在时静默删掉，等于替用户做了一次看不见的整理，所以只给提示。 */
ok('子树里有笔记就拒绝删除，只弹提示',
  /if \(count > 0\) \{[\s\S]{0,320}?toast\(`此分类下有 \$\{count\} 篇笔记\$\{detail\}，无法删除/.test(js) &&
  js.indexOf('连同笔记一起删除') < 0);
/* 只报一个总数，用户拿分类树一数就对不上账（真机上问过「4 是怎么算的」）。 */
ok('提示里带明细：本层几篇、子分类几篇，数字能对上',
  /const own = state\.notes\.filter\(\(n\) => n\.categoryId === cat\.id\)\.length/.test(js) &&
  /const detail = sub > 0 \? `（本层 \$\{own\} 篇、子分类 \$\{sub\} 篇）` : ''/.test(js));
ok('有子分类也拒绝删除，同样只提示',
  /if \(subs\.length\) \{\s*toast\(`此分类下还有 \$\{subs\.length\} 个子分类，无法删除/.test(js) &&
  js.indexOf('modal-choices') < 0 &&
  !/strategy=\$\{mode\}/.test(js));
/* 真机复盘：父分类的列表本来就会汇总子分类的笔记，同一篇在两层各出现一次。
   行上标出它真正归属的子分类，不用再靠猜「这算不算重复」。 */
ok('父分类列表里来自子分类的笔记，行上标出所属分类',
  /const scopeCat = state\.selCat && state\.selCat !== 'all'/.test(js)
  && /const fromCat = \(n\) =>/.test(js)
  && /<span class="sj-from"/.test(js)
  && /\$\{fromCat\(n\)\}/.test(js) && js.indexOf('fromCat') >= 0);
ok('只在选中具体分类时标注（全部 / 收藏 / 未分类 / 标签伪类别不标）',
  /state\.selCat !== 'starred' && state\.selCat !== 'uncat'/.test(js)
  && /!String\(state\.selCat\)\.startsWith\('tag:'\)/.test(js));
ok('标注样式细描边不填色，和标签区分开',
  /\.note-card-foot \.sj-from \{/.test(css) && /border-radius: 999px/.test(css));

console.log('分类自动去重（2026-11-26）');
/* 重复分类的根治：建类时就不许重名 + 启动 / 导入 / 同步时自动合并。
   判定逻辑在 public/cat-core.js（与云端逐字相同），这里直接 require 真跑。 */
const SJCats = require('../public/cat-core.js');

const dupCats = [
  { id: 'a', name: '工作记录', parentId: null, createdAt: 1 },
  { id: 'b', name: ' 工作记录 ', parentId: null, createdAt: 2 },
  { id: 'c', name: '工作记录', parentId: 'p1', createdAt: 3 },
];
ok('同一父级下同名（空格 / 大小写不敏感）判为重复，不同父级不算',
  !!SJCats.siblingOf(dupCats, '工作记录', null, 'a')
  && !SJCats.siblingOf(dupCats, '工作记录', 'p1', 'c'));
ok('没填名字时自动取没被占用的默认名，不偷偷改用户填的名字',
  SJCats.uniqueName([{ id: 'x', name: '未命名类别', parentId: null }], '未命名类别', null) === '未命名类别 2');

const dupNotes = [{ id: 'n1', categoryId: 'a' }, { id: 'n2', categoryId: 'a' }];
const healed = SJCats.dedupeCats(dupCats.filter((c) => c.parentId === null), dupNotes);
const healedNotes = dupNotes.map((n) => Object.assign({}, n));
SJCats.remapAll(healed.list, healedNotes, healed.remap);
ok('本地自愈只留内容最多的一份，笔记跟着改指向',
  healed.list.length === 1 && healed.list[0].id === 'a'
  && healedNotes.every((n) => n.categoryId === 'a'));

ok('服务端启动时自愈一次，库里的旧重复不会露到界面上',
  /function healCategories\(\)/.test(serverSrc) && /if \(healCategories\(\)\) persistNow\(\);/.test(serverSrc));
ok('建类接口拒绝同级重名（返回 409，不是静默改名）',
  /const dup = SJCats\.siblingOf\(db\.categories, name, parentId\)/.test(serverSrc)
  && /sendError\(res, 409, `同一级下已有同名类别/.test(serverSrc));
ok('改名 / 移动接口按「目标父级 + 最终名字」判重',
  /let targetParent = cat\.parentId \|\| null;/.test(serverSrc)
  && /SJCats\.siblingOf\(db\.categories, nextName, targetParent, cat\.id\)/.test(serverSrc));
ok('导入备份后也去一次重（备份里可能自带同名）',
  /const catFixed = healCategories\(\);/.test(serverSrc));
ok('界面提交前先判重名，反馈不用等一次请求（重名不关弹窗）',
  /function dupCatError\(name, parentId, excludeId\)/.test(js)
  && /validate: \(v\) => dupCatError\(v, parentId, null\)/.test(js)
  && /validate: \(v\) => dupCatError\(v, cat\.parentId, cat\.id\)/.test(js)
  && /if \(bad\) \{ toast\(bad\.message \|\| String\(bad\)\)/.test(js));
ok('分类内核在 app.js 之前加载',
  html.indexOf('src="/cat-core.js"') > 0
  && html.indexOf('src="/cat-core.js"') < html.indexOf('src="/app.js"'));


console.log('状态与刷新收口（2026-11-26）');
/* 以前 state 有 50 处直接赋值、工具条高亮有 8 处零散调用，
   「缩进改完没标脏」「换了块对齐图标不动」都是这么来的。 */
const stateAssign = (js.match(/(?:^|[^.\w])state\.[a-zA-Z]+\s*=(?!=)[^\n;]*/gm) || [])
  .filter((s) => !/!!on/.test(s));
ok('state 只有一个赋值入口：全文件没有裸赋值（helper 内部除外）',
  stateAssign.length === 0 && /function setState\(patch\)/.test(js));
ok('setState 返回真正变化的字段，便于调用方决定要不要重绘',
  /if \(state\[k\] !== patch\[k\]\) changed\.push\(k\)/.test(js));
ok('dirty 开关收进 setDirty，业务 markDirty 仍是那套快照判定',
  /function setDirty\(on = true\)/.test(js) && /function markDirty\(\)/.test(js)
  && /if \(snapshot\(note\) === savedSnapshot\)/.test(js));
ok('工具条高亮有唯一刷新入口 syncUI',
  /function syncUI\(\) \{[\s\S]{0,220}paintInlineCodeMark\(\);/.test(js));
for (const fn of ['paintColorMark', 'paintBgMark', 'paintBlockLabel', 'paintAlignIcon', 'paintInlineCodeMark']) {
  const hits = js.split(fn + '();').length - 1;
  ok('只有 syncUI 调用 ' + fn + '（其余调用点都已合并）', hits === 1);
}

console.log('数据体检、自动维护与自动同步（2026-11-27）');
/* 删文件夹留下悬空父级、同步只留 id 留下悬空分类、order 撞号、标签大小写
   重复 —— 这些以前都要等用户发现「笔记不见了」才暴露。现在统一在进库时修。 */

/* 内核是真跑一遍，不是只匹配源码文字：这里判断错会动到用户数据。 */
const hCats = [
  { id: 'r', name: '根', parentId: null, order: 7 },
  { id: 'o', name: '父已删', parentId: 'gone', order: 0 },
  { id: 'k1', name: '子甲', parentId: 'r', order: 3 },
  { id: 'k2', name: '子乙', parentId: 'r', order: 3 },
  { id: 'cy1', name: '环一', parentId: 'cy2', order: 0 },
  { id: 'cy2', name: '环二', parentId: 'cy1', order: 0 },
];
const hNotes = [
  { id: 'hn1', categoryId: 'gone', tags: ['工作', '工作 ', 'Work'] },
  { id: 'hn2', tags: ['work', ''] },
];
const hStat = SJCats.healIntegrity(hCats, hNotes);
ok('悬空的父级提升为根，而不是删掉分类（删了会连带丢笔记）',
  hStat.orphanCats === 1 && hCats.find((c) => c.id === 'o').parentId === null);
ok('分类成环时断开一处（断一个环就没了），树渲染不会无限递归',
  hStat.cycleCats === 1 && hCats.find((c) => c.id === 'cy1').parentId === null
  && hCats.find((c) => c.id === 'cy2').parentId === 'cy1');
ok('挂在已删分类上的笔记归到未分类',
  hStat.orphanNotes === 1 && hNotes[0].categoryId === null);
ok('同一父级下 order 重排成 0..n-1，不再撞号',
  hStat.orderFixed > 0
  && hCats.filter((c) => c.parentId === 'r').map((c) => c.order).sort().join(',') === '0,1');
ok('标签按「忽略大小写与空白」归一：篇内去重、去空、跨篇统一写法',
  hNotes[0].tags.length === 2 && hNotes[0].tags[0] === '工作'
  && hNotes[1].tags.length === 1 && hNotes[1].tags[0] === hNotes[0].tags[1]);
const hAgain = SJCats.healIntegrity(hCats, hNotes);
ok('体检是幂等的：再跑一次没有任何改动',
  hAgain.orphanCats === 0 && hAgain.cycleCats === 0 && hAgain.orphanNotes === 0
  && hAgain.orderFixed === 0 && hAgain.tagFixed === 0 && hAgain.notesMerged === 0);

/* 重复笔记：同一篇在两台设备 / 老备份里各存一份，id 不同标题一样。
   以前只能人工比对删一条；现在进库自动合并，旧稿进回收站（可恢复）。 */
const dNotes = [
  {
    id: 'keep1', title: 'CSS 布局速查', categoryId: 'c1', starred: false, tags: ['前端', 'CSS'],
    content: '<h2>Flex 常用组合</h2><p>display:flex 居中</p><p>min-width:0 解决溢出</p>',
    createdAt: 100, updatedAt: 900,
  },
  {
    id: 'drop1', title: ' CSS   布局速查 ', categoryId: 'c1', starred: true, tags: ['前端', 'CSS', '速查'],
    content: '<h2>Flex 常用组合</h2><p>display:flex 居中</p><p>min-width: 0 解决溢出</p><p>旧稿多一段</p>',
    attachments: [{ id: 'a1', disk: 'f1.png' }],
    createdAt: 50, updatedAt: 400,
  },
  {
    id: 'other1', title: '会议纪要模板', categoryId: 'c1', tags: ['工作'],
    content: '<p>本周例会：进度同步、排期确认</p>', createdAt: 10, updatedAt: 20,
  },
  {
    id: 'other2', title: '会议纪要模板', categoryId: 'c1', tags: ['工作'],
    content: '<p>完全不同的另一份内容：预算评审、采购流程、人员调动</p>', createdAt: 30, updatedAt: 40,
  },
  {
    /* 无标题笔记没有名字可认，只能按正文判：同一个文件夹里两篇正文完全一样
       就是同一篇（同一份草稿被两台设备各存一次）。 */
    id: 'un1', title: '无标题笔记', categoryId: 'c1', tags: [], content: '<p>同样的字</p>', createdAt: 1, updatedAt: 20,
  },
  {
    id: 'un2', title: '', categoryId: 'c1', tags: [], content: '<p>同样的字</p>', createdAt: 3, updatedAt: 10,
  },
  {
    /* 文本一样但落在另一个文件夹：父分类列表里本来就看得见子分类那篇，
       这不是重复，绝不能合。 */
    id: 'un4', title: '', categoryId: 'c2', tags: [], content: '<p>同样的字</p>', createdAt: 4, updatedAt: 8,
  },
  {
    id: 'un3', title: '无标题笔记', categoryId: 'c1', tags: [], content: '<p>另外一段完全不同的字</p>', createdAt: 5, updatedAt: 30,
  },
  {
    /* 空稿（正文为空、没有附件）：彼此等价，旧版本「点了新建没写」的残留 */
    id: 'bl1', title: '无标题笔记', categoryId: 'c1', tags: [], content: '<p><br></p>', createdAt: 7, updatedAt: 40,
  },
  {
    id: 'bl2', title: '', categoryId: 'c1', tags: [], content: '', createdAt: 8, updatedAt: 50,
  },
  {
    /* 有附件没正文：附件就是内容 —— 附件清单一不一样决定合不合 */
    id: 'bl3', title: '无标题笔记', categoryId: 'c2', tags: [], content: '',
    attachments: [{ id: 'p1' }], createdAt: 9, updatedAt: 60,
  },
  {
    id: 'bl4', title: '', categoryId: 'c2', tags: [], content: '',
    attachments: [{ id: 'p1' }], createdAt: 11, updatedAt: 30,
  },
  {
    id: 'bl5', title: '无标题笔记', categoryId: 'c2', tags: [], content: '',
    attachments: [{ id: 'q9' }], createdAt: 12, updatedAt: 25,
  },
  {
    /* 同一张图被两台设备各存一份：id / 磁盘名都换了，文件名和大小一样 */
    id: 'bl6', title: '无标题笔记', categoryId: 'c7', tags: [], content: '',
    attachments: [{ id: 'x1', disk: 'att_aaa.jpg', name: 'img1.jpg', size: 100 }],
    createdAt: 13, updatedAt: 70,
  },
  {
    id: 'bl7', title: '', categoryId: 'c7', tags: [], content: '',
    attachments: [{ id: 'y2', disk: 'att_bbb.jpg', name: 'img1.jpg', size: 100 }],
    createdAt: 14, updatedAt: 65,
  },
  {
    /* 同一个附件、但放在另一个文件夹：跨文件夹不判 */
    id: 'bl8', title: '', categoryId: 'c8', tags: [], content: '',
    attachments: [{ id: 'z3', disk: 'att_ccc.jpg', name: 'img1.jpg', size: 100 }],
    createdAt: 15, updatedAt: 66,
  },
  {
    /* 同一个文件夹里、标题正文一字不差：老备份留下的复制品 */
    id: 'copy2', title: 'CSS 布局速查', categoryId: 'c1', tags: [],
    content: '<h2>Flex 常用组合</h2><p>display:flex 居中</p><p>min-width:0 解决溢出</p>',
    createdAt: 60, updatedAt: 200,
  },
  {
    /* 同一篇出现在另一个文件夹：那是层级汇总，不动 */
    id: 'copy4', title: 'CSS 布局速查', categoryId: 'c3', tags: [],
    content: '<h2>Flex 常用组合</h2><p>display:flex 居中</p><p>min-width:0 解决溢出</p>',
    createdAt: 62, updatedAt: 210,
  },
  {
    /* 同题不同文件夹、内容有差别：可能真是两份要分开维护的，不动 */
    id: 'copy3', title: '会议纪要模板', categoryId: 'c3', tags: ['工作'],
    content: '<p>本周例会：进度同步、排期确认、下周安排</p>', createdAt: 61, updatedAt: 45,
  },
];
const dStat = SJCats.dedupeNotes(dNotes, 1000);
const keepNote = dNotes.find((n) => n.id === 'keep1');
const dropNote = dNotes.find((n) => n.id === 'drop1');
ok('同标题 + 同分类 + 正文几乎一样的两份合并成一份（留最新那份）',
  dStat.count === 6
  && !!dStat.pairs.find((p) => p.keep === 'keep1' && p.drop === 'drop1'));
ok('被合并的那份软删进回收站，不硬删；并留下 mergedInto 指向保留项',
  Number(dropNote.deletedAt) === 1000 && dropNote.mergedInto === 'keep1');
ok('合并时标签取并集、星标取或、附件跟着过来、创建时间取更早',
  keepNote.tags.join(',') === '前端,CSS,速查' && keepNote.starred === true
  && keepNote.attachments.length === 1 && keepNote.createdAt === 50);
ok('标题只差空格 / 大小写也认作同一篇',
  (dStat.pairs.find((p) => p.keep === 'keep1') || {}).title === 'CSS 布局速查');
ok('同标题但内容不同（相似度低）不合并，避免误删另一篇同题笔记',
  !dNotes.find((n) => n.id === 'other2').deletedAt);
/* 真机现场（2026-11-27 复盘）：那篇「无标题笔记」只在「页面布局」里一份，
   「前端开发」列表里看到的第 3 篇是子分类汇总上来的，本来就同一篇。
   所以判重必须限定同一个分类：跨文件夹的一律不动。 */
ok('同一个文件夹里标题正文一字不差的复制品 → 合并',
  !!dNotes.find((n) => n.id === 'copy2').deletedAt
  && dNotes.find((n) => n.id === 'copy2').mergedInto === 'keep1');
ok('同一篇出现在另一个文件夹（层级汇总看得见）→ 不合并',
  !dNotes.find((n) => n.id === 'copy4').deletedAt);
ok('同题不同文件夹但内容有差别 → 不合并（可能真是两份要分开维护的）',
  !dNotes.find((n) => n.id === 'copy3').deletedAt);
/* 无标题笔记没有名字可认，只能按正文判；同样限定同文件夹。 */
ok('无标题笔记按正文判重：同一文件夹内文字相同才合并成一篇',
  !!dNotes.find((n) => n.id === 'un2').deletedAt
  && dNotes.find((n) => n.id === 'un2').mergedInto === 'un1'
  && !dNotes.find((n) => n.id === 'un1').deletedAt
  && !dNotes.find((n) => n.id === 'un3').deletedAt);
ok('无标题笔记跨文件夹即使文字相同也不合并',
  !dNotes.find((n) => n.id === 'un4').deletedAt);
ok('空稿（无正文无附件）只留最新一份；附件清单不同则不合并、绝不丢图',
  dNotes.filter((n) => n.id === 'bl1' || n.id === 'bl2').filter((n) => n.deletedAt).length === 1
  && !dNotes.find((n) => n.id === 'bl3').deletedAt
  && dNotes.filter((n) => n.id === 'bl3' || n.id === 'bl4').filter((n) => n.deletedAt).length === 1
  && !dNotes.find((n) => n.id === 'bl5').deletedAt);
/* 真机那两篇空稿：同一张图，两台设备各自存了一次 —— id 不同，文件名和大小相同。
   以前拿 id 判身份，就永远认不出是同一份。 */
ok('附件按「文件名 + 大小」认身份：id 不同也能认出是同一张图，合并后不留重复附件',
  !!dNotes.find((n) => n.id === 'bl7').deletedAt
  && dNotes.find((n) => n.id === 'bl7').mergedInto === 'bl6'
  && dNotes.find((n) => n.id === 'bl6').attachments.length === 1);
ok('同一张图放在另一个文件夹 → 不合并（跨文件夹一律不动）',
  !dNotes.find((n) => n.id === 'bl8').deletedAt);
ok('合并是幂等的：再跑一次不会重复处理',
  SJCats.dedupeNotes(dNotes, 2000).count === 0 && Number(dropNote.deletedAt) === 1000);
ok('体检入口也带上了重复笔记合并（一个入口管所有脏数据）',
  /const dd = dedupeNotes\(notes\);/.test(fs.readFileSync(path.join(ROOT, 'cat-core.js'), 'utf8')));
ok('桌面端把合并结果告诉前端，且只提示一次（meta.heal + reported 标记）',
  /const heal = hr && hr\.notesMerged && !hr\.reported/.test(serverSrc)
  && /if \(heal\.notesMerged\) hr\.reported = true;/.test(serverSrc)
  && /已自动合并 \$\{heal\.notesMerged\} 篇重复笔记/.test(js));
ok('服务端启动 / 导入都走同一套体检（去重 + 体检合并在 healCategories 里）',
  /const st = SJCats\.healIntegrity\(db\.categories, db\.notes\)/.test(serverSrc)
  && /changed \+= st\.orphanCats \+ st\.cycleCats \+ st\.orphanNotes \+ st\.orderFixed \+ st\.tagFixed \+ st\.notesMerged/.test(serverSrc));

/* 维护不再只挂在启动上：开机自启的机器可能连跑几周 */
ok('常驻进程每 6 小时跑一次维护（回收站 / 孤儿附件 / 备份裁剪 / 当日备份）',
  /const MAINT_MS = 6 \* 3600 \* 1000/.test(serverSrc)
  && /setInterval\(runMaintenance, MAINT_MS\)\.unref\(\)/.test(serverSrc)
  && /try \{ cleanOrphanFiles\(\); \} catch \(_\) \{\}/.test(serverSrc)
  && /try \{ autoBackup\(\); \} catch \(_\) \{\}/.test(serverSrc));
ok('有未落盘改动时跳过本轮维护，避免和防抖写盘抢同一份文件',
  /if \(saving \|\| saveTimer\) return;/.test(serverSrc));
ok('备份裁剪覆盖 db.json.bak-* 与每日 auto-*（不只 backup-*）',
  /\^db\\\.json\\\.bak-\[\\w-\]\+\$/.test(serverSrc)
  && /\^auto-\\d\{8\}\\\.json\$/.test(serverSrc));
ok('孤儿附件清扫放过「刚上传、笔记还没保存」的 24 小时窗口',
  /const cut = Date\.now\(\) - 24 \* 3600 \* 1000;/.test(serverSrc)
  && /if \(!st\.isFile\(\) \|\| st\.mtimeMs > cut\) continue;/.test(serverSrc));
ok('新建分类用「同级最大 order + 1」，删一个再建不会撞号',
  /order: siblings\.length \? Math\.max\(\.\.\.siblings\.map\(\(c\) => Number\(c\.order\) \|\| 0\)\) \+ 1 : 0/.test(serverSrc));

/* 标签：所有写入口共用内核的归一规则 */
ok('加标签时先按内核判重，已有同名（大小写 / 空格不同）就直接提示',
  /const dup = tags\.find\(\(t\) => norm\(t\) === norm\(value\)\)/.test(js)
  && /已经有标签「/.test(js));
ok('批量写标签（含合并）也走同一套归一：去空、忽略大小写去重、最多 10 个',
  /const k = window\.SJCats \? window\.SJCats\.normTag\(t\) : t\.toLowerCase\(\)/.test(js)
  && /note\.tags = next\.slice\(0, 10\);/.test(js));

/* 自动同步：桌面只自动「收」，不自动「传」 */
ok('桌面拉取支持静默模式（自动流程不动按钮、不弹 toast）',
  /async function doPull\(opts\)/.test(syncJs) && /const auto = !!\(opts && opts\.auto\)/.test(syncJs)
  && /if \(!auto && btn\) \{ btn\.disabled = true;/.test(syncJs));
ok('自动拉取遇到冲突整轮放弃，绝不静默替用户挑一边',
  /if \(conflicts\.length && auto\) \{\s*throw new Error/.test(syncJs));
ok('打开页面与回到前台时自动拉取，且距上次同步 10 分钟内不重复拉',
  /const AUTO_PULL_GAP = 10 \* 60 \* 1000/.test(syncJs)
  && /addEventListener\('visibilitychange'/.test(syncJs)
  && /Date\.now\(\) - lastSyncAt\(\) < AUTO_PULL_GAP/.test(syncJs));
ok('自动拉取有开关，默认开启（存 localStorage）',
  /localStorage\.getItem\('sj_auto_pull_v1'\) !== '0'/.test(syncJs)
  && /id="syncAuto"/.test(syncJs));
ok('上传收尾自动清理云端无用附件，不用再点按钮',
  /let gcDone = 0;\s*try \{ gcDone = await gcQueued\(true\); \} catch \(_\) \{\}/.test(syncJs));

console.log(`\n结果：${pass} 通过，${fail} 失败`);
process.exit(fail ? 1 : 0);
