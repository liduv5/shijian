#!/usr/bin/env node
/* ============================================================
   共享文件同步：桌面 → 云端
   ------------------------------------------------------------
   拾笺是两个仓库，但有些文件两边必须逐字相同。以前靠手抄，
   改一处忘一处就漂了（mdconv 就漂成了 44/84 行相同）。
   现在真源放在桌面这边，跑一次这个脚本推过去：

       node scripts/sync-shared.js          # 只报告差异，不写
       node scripts/sync-shared.js --write  # 真写

   两端回归测试里有 md5 断言兜底，忘了同步会直接红。
   注意：只覆盖下面 SHARED 列表里的文件，别的什么都不碰。
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const CLOUD = path.join(ROOT, '..', '拾笺云端');

/* 真源 → 目标。两边路径都是相对各自仓库根目录。 */
const SHARED = [
  'public/richtext-core.js',
  'public/mdconv-core.js',
  /* 分类身份 / 去重判定：两端 + 同步必须用同一套规则，否则「算不算重复」
     各算一套，去重本身就会变成新的重复源。 */
  'public/cat-core.js',
];

const write = process.argv.includes('--write');

function md5(buf) {
  return crypto.createHash('md5').update(buf).digest('hex');
}

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join('/');
}

let same = 0, diff = 0, missing = 0;

for (const f of SHARED) {
  const src = path.join(ROOT, f);
  const dst = path.join(CLOUD, path.basename(f));
  if (!fs.existsSync(src)) {
    console.log('真源缺失  ' + rel(src));
    missing++;
    continue;
  }
  const a = fs.readFileSync(src);
  const hasDst = fs.existsSync(dst);
  const b = hasDst ? fs.readFileSync(dst) : null;
  if (hasDst && md5(a) === md5(b)) {
    console.log('已一致    ' + f);
    same++;
    continue;
  }
  diff++;
  if (!write) {
    console.log((hasDst ? '有差异    ' : '云端缺失  ') + f);
    continue;
  }
  fs.writeFileSync(dst, a);
  console.log('已同步    ' + f);
}

console.log(`\n共 ${SHARED.length} 个：一致 ${same}，待同步 ${diff}，真源缺失 ${missing}`);
if (!write && diff) {
  console.log('加 --write 实际写入。');
}
process.exit(missing ? 1 : 0);
