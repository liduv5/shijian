/* 一次性迁移：把库里的 Markdown 笔记转成富文本。
   用法：node scripts/migrate-to-rich.js [--dry]

   备份：脚本自己会先写 data/db.json.bak-<时间戳>。
   幂等：已经是 rich 的笔记跳过，重复跑安全。 */
const fs = require('fs');
const path = require('path');
const { toRichHtml } = require('../lib/mdconv.js');

const DATA_DIR = process.env.SHIJIAN_DATA_DIR || path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const VERSIONS_DIR = path.join(DATA_DIR, 'versions');
const dry = process.argv.includes('--dry');

function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.log('找不到 db.json：' + DB_PATH);
    process.exit(1);
  }
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  const notes = db.notes || [];

  let convNotes = 0, convVers = 0, skipped = 0, dedupTitle = 0;
  const changed = [];

  for (const n of notes) {
    if ((n.format || 'md') === 'rich') { skipped++; continue; }
    const before = String(n.content || '');
    const after = toRichHtml({ content: before, format: n.format });
    /* 空笔记转换后内容不变，但 format 字段仍要统一 ——
       否则库里还留着 'md' 这个值，等于没收敛干净。 */
    if (after === before && before === '') {
      n.format = 'rich';
      convNotes++;
      continue;
    }
    if (after === before) { skipped++; continue; }
    changed.push({ title: n.title || '(无题)', before: before.length, after: after.length });
    n.content = after;
    n.format = 'rich';
    convNotes++;
  }

  /* 历史版本：还原时服务端会再转一次，这里也一并转掉，
     免得版本列表里混着两种格式。 */
  /* 正文首标题与笔记标题重复时去掉正文里的那份。
     Markdown 时代正文首行写标题是常见习惯（# 将进酒），
     但阅读态的大标题已经显示了标题，正文里再写一遍是噪音。
     富文本时代标题在标题栏输入，正文不该再重复。 */
  function stripDupTitle(content, title) {
    const t = String(title || '').trim();
    if (!t) return content;
    const m = String(content || '').match(/^\s*<(h[1-6])[^>]*>([\s\S]*?)<\/\1>\s*/i);
    if (!m) return content;
    const firstH = m[2].replace(/<[^>]+>/g, '').trim();
    if (!firstH) return content;
    /* 只在首标题与笔记标题高度一致时才删：完全相等，或互为子串
       （「将进酒」 vs 「将进酒·其二」这种）。 */
    const same = firstH === t || t.includes(firstH) || firstH.includes(t);
    if (!same) return content;
    return String(content).slice(m[0].length);
  }

  for (const n of notes) {
    if (n.format !== 'rich') continue;
    const after = stripDupTitle(n.content, n.title);
    if (after !== n.content) {
      n.content = after;
      dedupTitle++;
    }
  }

  if (fs.existsSync(VERSIONS_DIR)) {
    for (const f of fs.readdirSync(VERSIONS_DIR)) {
      if (!f.endsWith('.json')) continue;
      const p = path.join(VERSIONS_DIR, f);
      let list;
      try { list = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) { continue; }
      if (!Array.isArray(list)) continue;
      let dirty = false;
      for (const v of list) {
        if (!v || (v.format || 'md') === 'rich') continue;
        v.content = toRichHtml({ content: v.content || '', format: v.format });
        v.format = 'rich';
        dirty = true;
        convVers++;
      }
      if (dirty && !dry) fs.writeFileSync(p, JSON.stringify(list, null, 2));
    }
  }

  console.log('笔记总数：' + notes.length);
  console.log('已转换：' + convNotes + ' 篇（历史版本 ' + convVers + ' 条）');
  console.log('无需转换：' + skipped + ' 篇');
  console.log('去掉与标题重复的首行标题：' + dedupTitle + ' 篇');
  if (changed.length) {
    console.log('\n逐篇明细：');
    for (const c of changed) {
      console.log('  ' + c.title.padEnd(22) + ' ' + c.before + ' → ' + c.after + ' 字符');
    }
  }
  const size = JSON.stringify(db).length;
  console.log('\n库体积：' + (size / 1024).toFixed(1) + ' KB');

  if (dry) {
    console.log('\n[dry-run] 未写入任何文件');
    return;
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const bak = DB_PATH + '.bak-' + stamp;
  fs.copyFileSync(DB_PATH, bak);
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  console.log('\n✓ 已写入 ' + DB_PATH);
  console.log('✓ 备份 ' + bak);
  console.log('  （data/ 不受 git 版本控制，迁移前备份是唯一的回滚路径，');
  console.log('    确认无误后再手动删除）');
}

main();
