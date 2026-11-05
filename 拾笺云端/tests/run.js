/* 拾笺 · 最小测试（P1-2）
   运行：node tests/run.js
   覆盖：① SW 访问码补码白名单（防 v1.7.2 回归）；② 全文检索分词/排序；③ 同步冲突检测。
   纯 Node，无外部依赖。 */
'use strict';
const path = require('path');
const assert = require('assert');

// 让 sw.js 的 ensureSC 在 Node 下可测试（浏览器里 self.location 真实存在）
global.self = { location: { origin: 'https://x.test' }, addEventListener: function () {} };

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name); }
}

console.log('\n[1] SW 访问码补码白名单（防回归）');
const sw = require(path.join(__dirname, '..', 'sw.js'));
ok('VERSION 为 sj-2026-11-05-3', sw.VERSION === 'sj-2026-11-05-3');
ok('静态资源在白名单内 (/app.js)', sw.ASSET_PATHS.has('/app.js'));
ok('本地接口 /api/ 不在白名单（不补码、不丢鉴权头）', !sw.ASSET_PATHS.has('/api/notes'));
ok('云端 API /.cloud/ 不在白名单', !sw.ASSET_PATHS.has('/.cloud/database/rest/v1'));
const u1 = sw.ensureSC('https://x.test/app.js');
ok('同源静态资源自动补 ?sharecode', u1.indexOf('sharecode=') >= 0);
const u2 = sw.ensureSC('https://x.test/app.js?sharecode=FKSO3QK6B4');
ok('已有访问码不重复添加', (u2.match(/sharecode=/g) || []).length === 1);
const u3 = sw.ensureSC('https://other.com/app.js');
ok('跨域请求不补码', u3.indexOf('sharecode=') < 0);

console.log('\n[2] 全文检索（中文分词 + 相关度）');
const fts = require(path.join(__dirname, '..', 'fts.js'));
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
ok('中文切出二元 (产品/品路/路线/线图)', tok.indexOf('路线') >= 0 && tok.indexOf('产品') >= 0);
ok('纯文本剥离 HTML/Markdown', fts.plain('# 标题 **粗** [link](u)') === '标题 粗 link');
const sn = fts.snippet('今天讨论了产品路线图和上线计划', ['路线图']);
ok('生成搜索摘要', typeof sn === 'string' && sn.length > 0);

console.log('\n[3] 同步冲突检测（两端都改过 = 真冲突）');
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
ok('两端同步后都改过且内容不同 → 冲突', detectConflicts(
  [{ id: 'a', updatedAt: 5000, content: 'x' }],
  [{ id: 'a', updatedAt: 6000, content: 'y' }], last).length === 1);
ok('仅云端改过 → 非冲突（正常 LWW）', detectConflicts(
  [{ id: 'a', updatedAt: 500, content: 'x' }],
  [{ id: 'a', updatedAt: 3000, content: 'y' }], last).length === 0);
ok('两端都改但内容相同 → 非冲突', detectConflicts(
  [{ id: 'a', updatedAt: 2000, content: 'same' }],
  [{ id: 'a', updatedAt: 3000, content: 'same' }], last).length === 0);
ok('云端新增笔记 → 非冲突', detectConflicts(
  [{ id: 'a', updatedAt: 2000, content: 'x' }],
  [{ id: 'b', updatedAt: 3000, content: 'y' }], last).length === 0);

console.log('\n结果：' + pass + ' 通过，' + fail + ' 失败');
process.exit(fail ? 1 : 0);
