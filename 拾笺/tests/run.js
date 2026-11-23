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
ok('工具条有三档对齐（左/中/右）',
  /btn\(I\.alignLeft, '左对齐', \(\) => cssCmd\('justifyLeft'\)\)/.test(js)
  && /btn\(I\.alignCenter, '居中', \(\) => cssCmd\('justifyCenter'\)\)/.test(js)
  && /btn\(I\.alignRight, '右对齐', \(\) => cssCmd\('justifyRight'\)\)/.test(js));
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
  /function syncFontPickers\(\) \{[\s\S]{0,240}?paintColorMark\(\);/.test(js));
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
ok('字体/字号两颗下拉同宽（按下高亮一样宽）',
  /function fitSelPair\(a, b\)/.test(js)
  && /fitSelPair\(tbFontSel, tbSizeSel\)/.test(js));
ok('下拉宽度按最宽选项量，收起框和点开的列表一样宽',
  !/\.tb-select \{[\s\S]{0,400}field-sizing/.test(css)
  && /量最宽的选项/.test(js)
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
  && /\.tb-pick:hover \{ background-color: var\(--surface-2\); \}/.test(css));
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
  && /state\.richLh = clampLh\(state\.richLh\);/.test(js)
  && /state\.richLh = px;/.test(js)
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
ok('富文本仍存 innerHTML', /note\.content = \$\('#richPane'\)\.innerHTML;/.test(js));
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
  /state\.richFs = clampFs\(AA_FS\.value\)/.test(js)
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

console.log(`\n结果：${pass} 通过，${fail} 失败`);
process.exit(fail ? 1 : 0);
