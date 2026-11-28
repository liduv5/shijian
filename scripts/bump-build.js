/* 构建号唯一真源：build.json → 8 个文件
   ------------------------------------------------------------
   以前每次发布要手工改 8 个文件里的日期串，改漏一处就是「页面提示新版本、
   SW 还咬着旧壳」，或者「tests 里的 BUILD 对不上 sw.js 的 VERSION」。
   现在只有 build.json 一份，脚本负责写，测试负责守。

   跑法（在仓库根目录）：
     node scripts/bump-build.js --next     进位一位（196 → 197）并写入
     node scripts/bump-build.js            按 build.json 当前值写入（回填用）
     node scripts/bump-build.js --check    只校验，有漂移退出码 1
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BUILD_FILE = path.join(ROOT, 'build.json');

/* 只认这 8 个文件：构建号只允许出现在这里，别处出现就是新漂移点。 */
const FILES = [
  '拾笺云端/app.js',
  '拾笺云端/dl.html',
  '拾笺云端/index.html',
  '拾笺云端/quick.html',
  '拾笺云端/mobilesync.js',
  '拾笺云端/pwa.js',
  '拾笺云端/sw.js',
  '拾笺云端/tests/run.js',
];

const TOKEN = /20\d\d-\d\d-\d\d-\d{3}/g;

function readBuild() {
  const raw = JSON.parse(fs.readFileSync(BUILD_FILE, 'utf8'));
  if (!/^20\d\d-\d\d-\d\d-\d{3}$/.test(raw.build || '')) {
    throw new Error('build.json 里的 build 不是 YYYY-MM-DD-NNN：' + raw.build);
  }
  return raw;
}

function nextBuild(cur) {
  const m = /^(20\d\d-\d\d-\d\d)-(\d{3})$/.exec(cur);
  if (!m) throw new Error('当前构建号格式不对：' + cur);
  const day = new Date().toISOString().slice(0, 10);
  /* 同一天就在末位进位；换了一天从 001 起，日期也跟着走。 */
  if (m[1] === day) return m[1] + '-' + String(Number(m[2]) + 1).padStart(3, '0');
  return day + '-001';
}

function tokensIn(text) {
  return text.match(TOKEN) || [];
}

function check(build) {
  const bad = [];
  for (const rel of FILES) {
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) { bad.push(rel + '：文件不存在'); continue; }
    const hits = tokensIn(fs.readFileSync(file, 'utf8'));
    const wrong = hits.filter((t) => t !== build);
    if (!hits.length) bad.push(rel + '：一处构建号都没有（锚点丢了）');
    else if (wrong.length) bad.push(rel + '：' + Array.from(new Set(wrong)).join('、') + ' 与 build.json 的 ' + build + ' 不一致');
  }
  return bad;
}

function write(build, prev) {
  const report = [];
  for (const rel of FILES) {
    const file = path.join(ROOT, rel);
    const before = fs.readFileSync(file, 'utf8');
    /* 按字面替换上一版构建号：只动版本串，不碰其他日期（比如笔记时间戳）。 */
    const after = before.split(prev).join(build);
    if (after !== before) {
      fs.writeFileSync(file, after, 'utf8');
      report.push(rel + '：' + (before.split(prev).length - 1) + ' 处');
    } else {
      report.push(rel + '：已是最新');
    }
  }
  return report;
}

function main() {
  const args = process.argv.slice(2);
  const cur = readBuild();
  if (args.includes('--check')) {
    const bad = check(cur.build);
    if (bad.length) {
      console.error('构建号漂移 ' + bad.length + ' 处：');
      bad.forEach((b) => console.error('  · ' + b));
      process.exit(1);
    }
    console.log('构建号一致：' + cur.build + '（' + FILES.length + ' 个文件）');
    return;
  }
  const next = args.includes('--next') ? nextBuild(cur.build) : cur.build;
  const report = write(next, cur.build);
  if (next !== cur.build) {
    cur.build = next;
    fs.writeFileSync(BUILD_FILE, JSON.stringify(cur, null, 2) + '\n', 'utf8');
    console.log('构建号 ' + next);
  }
  report.forEach((r) => console.log('  ' + r));
  const bad = check(next);
  if (bad.length) {
    console.error('写入后仍有漂移，检查锚点：');
    bad.forEach((b) => console.error('  · ' + b));
    process.exit(1);
  }
}

main();
