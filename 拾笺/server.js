/**
 * 拾笺 · 本地笔记库
 * 零依赖 Node 服务：静态资源 + JSON 持久化 + 附件存储
 * 启动：node server.js  然后访问 http://localhost:5173
 */
const http = require('http');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = process.env.SHIJIAN_DATA_DIR || path.join(ROOT, 'data');
const FILES_DIR = path.join(DATA_DIR, 'files');
const VERSIONS_DIR = path.join(DATA_DIR, 'versions');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const PORT = Number(process.env.PORT || 5173);
const HOST = process.env.SHIJIAN_HOST || '127.0.0.1';
// --lan / SHIJIAN_LAN=1：监听所有网卡，手机、平板可在同一 WiFi 下访问
const LAN = process.argv.includes('--lan') || process.env.SHIJIAN_LAN === '1' || HOST === '0.0.0.0';
const BIND_HOST = LAN ? '0.0.0.0' : HOST;
const MAX_BODY = 40 * 1024 * 1024; // 40MB

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

// ---------------------------------------------------------------- 数据层
let db = { categories: [], notes: [] };
let saveTimer = null;
let saving = false;

function uid() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}

function now() {
  return Date.now();
}

function seed() {
  const cStudy = { id: uid(), name: '学习素材', parentId: null, expanded: true, order: 0, createdAt: now() };
  const cFront = { id: uid(), name: '前端开发', parentId: cStudy.id, expanded: true, order: 0, createdAt: now() };
  const cAlgo = { id: uid(), name: '算法与数据结构', parentId: cStudy.id, expanded: false, order: 1, createdAt: now() };
  const cRead = { id: uid(), name: '读书笔记', parentId: null, expanded: true, order: 1, createdAt: now() };
  const cWork = { id: uid(), name: '工作记录', parentId: null, expanded: false, order: 2, createdAt: now() };

  const welcome = `这是一个跑在你电脑本地的笔记库，所有数据都保存在 \`data/\` 目录里，不经过任何服务器。

## 三个区域

- **左侧目录树**：支持无限层级，点箭头收起 / 展开
- **中间笔记列表**：显示当前类别下的笔记
- **右侧编辑器**：Markdown 与富文本随时切换

## 试试这些

1. 点目录旁的 \`+\` 新建子类别，拖不了也没关系，右键有菜单
2. 把一份 PDF 或图片直接拖进编辑器，会自动成为附件
3. 代码块支持高亮：

\`\`\`js
function fib(n) {
  let [a, b] = [0, 1];
  while (n-- > 0) [a, b] = [b, a + b];
  return a;
}
console.log(fib(10)); // 55
\`\`\`

> 引用块、表格、任务列表都支持。

| 格式 | 快捷键 |
| --- | --- |
| 加粗 | Ctrl / Cmd + B |
| 斜体 | Ctrl / Cmd + I |
| 保存 | 自动保存，无需操作 |

最后，按 \`Ctrl / Cmd + K\` 可以快速搜索全部笔记。

## 还可以这样用

- **标签**：标题下方点 \`+\` 添加，左侧会汇总所有标签，点一下就是筛选
- **历史版本**：点右上角时钟图标，可以看到过去的版本并一键恢复
- **导出**：点下载图标，可导出 Word、PDF 或 Markdown
- **粘贴图片**：直接 \`Ctrl / Cmd + V\` 截图，会自动上传并插入正文
`;
  const codeNote = `## Flex 常用组合

\`\`\`css
.center {
  display: flex;
  align-items: center;
  justify-content: center;
}
\`\`\`

## Grid 三栏自适应

\`\`\`css
.layout {
  display: grid;
  grid-template-columns: 240px 1fr 320px;
  gap: 16px;
}
\`\`\`

## 易错点

- \`min-width: 0\` 解决 flex 子项溢出
- 绝对定位元素不会撑开父容器高度

\`\`\`js
// 防抖
const debounce = (fn, wait = 300) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
};
\`\`\`
`;
  const richNote = `<h2>本周例会</h2><p><strong>时间</strong>：2025-11-03 14:00<br><strong>参会</strong>：全体成员</p><h3>议题</h3><ul><li>本周进度同步</li><li>下周排期确认</li></ul><h3>待办</h3><ul><li>整理需求文档（负责人：张三）</li><li>输出接口设计（负责人：李四）</li></ul><blockquote>下次会议定于周五上午十点。</blockquote>`;

  const notes = [
    {
      id: uid(), categoryId: cStudy.id, title: '欢迎使用拾笺',
      content: welcome, format: 'md', starred: true,
      tags: ['入门', '使用说明'],
      attachments: [], createdAt: now() - 3600_000, updatedAt: now() - 60_000,
    },
    {
      id: uid(), categoryId: cFront.id, title: 'CSS 布局速查',
      content: codeNote, format: 'md', starred: false,
      tags: ['前端', 'CSS'],
      attachments: [], createdAt: now() - 7200_000, updatedAt: now() - 3600_000,
    },
    {
      id: uid(), categoryId: cWork.id, title: '会议纪要模板',
      content: richNote, format: 'rich', starred: false,
      tags: ['工作', '模板'],
      attachments: [], createdAt: now() - 9000_000, updatedAt: now() - 5000_000,
    },
  ];

  return { categories: [cStudy, cFront, cAlgo, cRead, cWork], notes };
}

function loadDB() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    db = {
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
    };
    db.notes.forEach((n) => {
      if (!Array.isArray(n.tags)) n.tags = [];
      if (!Array.isArray(n.attachments)) n.attachments = [];
      if (n.deletedAt && !Number.isFinite(Number(n.deletedAt))) delete n.deletedAt;
    });
    purgeExpiredTrash();
    pruneBackups();
  } catch (e) {
    /* 解析失败有两种情况，必须分开处理：
       - 文件根本不存在：首次启动，直接用样例数据，没什么可救的
       - 文件存在但读不出来：多半是断电 / 写盘中断导致尾部截断，
         这时前 90% 的内容其实还能人工抢救。以前这里直接 seed + 覆盖，
         等于把最后一点希望也抹掉了。现在先把残骸改名留档。 */
    let hasBrokenFile = false;
    try { hasBrokenFile = fs.existsSync(DB_PATH) && fs.statSync(DB_PATH).size > 0; } catch (_) {}
    if (hasBrokenFile) {
      const bak = path.join(DATA_DIR, `db.corrupt-${stampNow()}.json`);
      try {
        fs.renameSync(DB_PATH, bak);
        console.error('');
        console.error('  ⚠ 数据文件无法解析，已原样备份到：');
        console.error('    ' + bak);
        console.error('  当前用样例数据启动，原笔记没有被删除，可人工修复后换回来。');
        console.error('');
      } catch (_) { /* 备份失败也不能拦住启动 */ }
    }
    db = seed();
    persistNow();
  }
}

/* 回收站：软删除的笔记 30 天后自动真删，避免 db.json 无限变大。 */
const TRASH_TTL = 30 * 24 * 3600 * 1000;
const BACKUP_KEEP = 30;
function purgeExpiredTrash() {
  const cut = Date.now() - TRASH_TTL;
  const doomed = db.notes.filter((n) => n.deletedAt && Number(n.deletedAt) < cut);
  if (!doomed.length) return;
  doomed.forEach(removeNoteFiles);
  db.notes = db.notes.filter((n) => !doomed.includes(n));
  persistNow();
  console.log(`  回收站：已自动清理 ${doomed.length} 篇超过 30 天的笔记`);
}
/* 每次导入都会留一份 backup-*.json，长期不清理会积出几百个，只保留最近 30 份。 */
function pruneBackups() {
  try {
    const list = fs.readdirSync(DATA_DIR)
      .filter((f) => /^backup-\d{8}-\d{6}-\d{3}\.json$/.test(f))
      .map((f) => ({ f, t: fs.statSync(path.join(DATA_DIR, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t);
    for (const x of list.slice(BACKUP_KEEP)) fs.unlink(path.join(DATA_DIR, x.f), () => {});
  } catch (_) { /* 清理失败不影响主流程 */ }
}

function persistNow() {
  const tmp = DB_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_PATH);
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    if (saving) return scheduleSave();
    saving = true;
    try {
      persistNow();
    } catch (e) {
      console.error('保存失败', e);
    } finally {
      saving = false;
    }
  }, 120);
}

// ---------------------------------------------------------------- 工具
function sendJSON(res, code, data) {
  const body = JSON.stringify(data);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function sendError(res, code, message) {
  sendJSON(res, code, { error: message });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error('请求体过大'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (e) {
        reject(new Error('JSON 解析失败'));
      }
    });
    req.on('error', reject);
  });
}

function safeJoin(base, target) {
  const p = path.normalize(path.join(base, target));
  /* 必须连分隔符一起比：只比 base 前缀的话，同级目录 public2/ 会被当成 public/ 放行 */
  if (p === base || p.startsWith(base + path.sep)) return p;
  return null;
}

// ---------------------------------------------------------------- 静态资源
/**
 * 会随开发改动的资源，用它们的 mtime 拼版本号写进 index.html 的引用里。
 * 不这么做的话：改完 app.js → 浏览器按 max-age 直接用旧副本 → 用户看到的还是旧界面
 * （踩过：修好富文本代码块回车，用户重开程序仍无效，实际加载的是缓存里的旧 app.js）。
 */
const VERSIONED = ['/app.js', '/style.css', '/export.js'];

function assetVersion(cb) {
  let latest = 0;
  let left = VERSIONED.length;
  VERSIONED.forEach((rel) => {
    const p = path.join(PUBLIC_DIR, rel);
    fs.stat(p, (e, st) => {
      if (!e && st.mtimeMs > latest) latest = st.mtimeMs;
      if (--left === 0) cb(Math.floor(latest).toString(36));
    });
  });
}

function sendHtml(res, filePath) {
  assetVersion((v) => {
    fs.readFile(filePath, 'utf8', (err, html) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('404 Not Found');
      }
      const out = html.replace(
        /(src|href)="(\/(?:app\.js|style\.css|export\.js))"/g,
        (m, attr, url) => `${attr}="${url}?v=${v}"`
      );
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Content-Length': Buffer.byteLength(out),
      });
      res.end(out);
    });
  });
}

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/') rel = '/index.html';
  const filePath = safeJoin(PUBLIC_DIR, rel);
  if (!filePath) return sendError(res, 403, 'Forbidden');
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found');
    }
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.html') return sendHtml(res, filePath);

    // 其余静态资源：允许缓存，但每次必须回源校验（no-cache + ETag），
    // 改了文件立刻生效，没改则走 304，不浪费带宽。
    const etag = `W/"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, { ETag: etag, 'Cache-Control': 'no-cache' });
      return res.end();
    }
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'Content-Length': stat.size,
      ETag: etag,
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

// ---------------------------------------------------------------- 业务接口
/* ---------------- 历史版本 ---------------- */
const MAX_VERSIONS = 40;
const SNAPSHOT_GAP = Number(process.env.VERSION_GAP || 120000);

/* 笔记 id 只可能是 uid() 生成的 12 位十六进制，但导入的备份来自外部文件，
   必须自己校验一遍 —— 否则 `id: "../../x"` 会让版本文件名拼到数据目录外面去。 */
const ID_RE = /^[A-Za-z0-9_-]{4,40}$/;
/* 附件磁盘文件名一律是 att_<12位hex>[.<ext>]（见 POST /attachments），
   不允许任何路径分隔符，堵住「导入恶意备份 → 读任意文件」。 */
const DISK_RE = /^att_[0-9a-f]{12}(?:\.[A-Za-z0-9]{1,10})?$/;

function versionsPath(noteId) {
  if (!ID_RE.test(String(noteId))) return path.join(VERSIONS_DIR, '_invalid.json');
  return path.join(VERSIONS_DIR, `${noteId}.json`);
}

function readVersions(noteId) {
  try {
    const raw = fs.readFileSync(versionsPath(noteId), 'utf8');
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function writeVersions(noteId, list) {
  const file = versionsPath(noteId);
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(list));
  fs.renameSync(tmp, file);
}

function snapshotVersion(note, reason) {
  if (!note.content && !note.title) return;
  const list = readVersions(note.id);
  const last = list[0];
  if (last && last.content === note.content && last.title === note.title) return;
  const force = reason === 'format' || reason === 'restore' || reason === 'manual';
  if (!force && last && Date.now() - last.ts < SNAPSHOT_GAP) return;
  list.unshift({
    id: uid(),
    ts: Date.now(),
    title: note.title,
    content: note.content,
    format: note.format,
    reason: reason || 'auto',
  });
  writeVersions(note.id, list.slice(0, MAX_VERSIONS));
}

function findNote(id) {
  return db.notes.find((n) => n.id === id) || null;
}

function findCategory(id) {
  return db.categories.find((c) => c.id === id) || null;
}

function collectDescendants(id, acc = []) {
  for (const c of db.categories) {
    if (c.parentId === id) {
      acc.push(c.id);
      collectDescendants(c.id, acc);
    }
  }
  return acc;
}

async function handleApi(req, res, pathname, query) {
  const seg = pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);

  // GET /api/state —— 只返回未删除的笔记，回收站里的走 /api/trash
  if (req.method === 'GET' && seg[0] === 'state') {
    const live = db.notes.filter((n) => !n.deletedAt);
    return sendJSON(res, 200, {
      categories: db.categories,
      notes: live,
      meta: { version: 1, count: live.length },
    });
  }

  /* 回收站：软删除的笔记仍在 db.json 里，deletedAt 是删除时刻。
     只有「永久删除 / 清空 / 超过 30 天」才真的删附件和记录。 */
  if (seg[0] === 'trash') {
    const id = seg[1];
    if (req.method === 'GET' && !id) {
      const list = db.notes.filter((n) => n.deletedAt)
        .sort((a, b) => Number(b.deletedAt) - Number(a.deletedAt));
      return sendJSON(res, 200, { notes: list });
    }
    if (req.method === 'DELETE' && !id) {
      const doomed = db.notes.filter((n) => n.deletedAt);
      doomed.forEach(removeNoteFiles);
      db.notes = db.notes.filter((n) => !n.deletedAt);
      scheduleSave();
      return sendJSON(res, 200, { ok: true, removed: doomed.length });
    }
    const note = id ? findNote(id) : null;
    if (!note || !note.deletedAt) return sendError(res, 404, '回收站里没有这篇笔记');
    if (req.method === 'POST' && seg[2] === 'restore') {
      delete note.deletedAt;
      note.updatedAt = now();
      scheduleSave();
      return sendJSON(res, 200, note);
    }
    if (req.method === 'DELETE') {
      removeNoteFiles(note);
      db.notes = db.notes.filter((x) => x.id !== id);
      scheduleSave();
      return sendJSON(res, 200, { ok: true });
    }
    return sendError(res, 404, '未知接口');
  }

  // 类别
  if (seg[0] === 'categories') {
    const id = seg[1];

    if (req.method === 'POST' && !id) {
      const body = await readBody(req);
      const name = String(body.name || '').trim() || '未命名类别';
      if (body.parentId && !findCategory(body.parentId)) return sendError(res, 400, '父类别不存在');
      const siblings = db.categories.filter((c) => c.parentId === (body.parentId || null));
      const cat = {
        id: uid(),
        name,
        parentId: body.parentId || null,
        expanded: true,
        order: siblings.length,
        createdAt: now(),
      };
      db.categories.push(cat);
      const parent = cat.parentId ? findCategory(cat.parentId) : null;
      if (parent) parent.expanded = true;
      scheduleSave();
      return sendJSON(res, 200, cat);
    }

    if (!id) return sendError(res, 404, '未知接口');

    if (req.method === 'PATCH') {
      const cat = findCategory(id);
      if (!cat) return sendError(res, 404, '类别不存在');
      const body = await readBody(req);
      if (typeof body.name === 'string' && body.name.trim()) cat.name = body.name.trim();
      if (typeof body.expanded === 'boolean') cat.expanded = body.expanded;
      if (typeof body.order === 'number') cat.order = body.order;
      if (body.parentId !== undefined) {
        if (body.parentId && !findCategory(body.parentId)) return sendError(res, 400, '目标类别不存在');
        if (body.parentId === id) return sendError(res, 400, '不能移动到自身');
        if (body.parentId && collectDescendants(id).includes(body.parentId)) {
          return sendError(res, 400, '不能移动到自己的子类别下');
        }
        cat.parentId = body.parentId || null;
      }
      scheduleSave();
      return sendJSON(res, 200, cat);
    }

    if (req.method === 'DELETE') {
      const cat = findCategory(id);
      if (!cat) return sendError(res, 404, '类别不存在');
      const strategy = query.get('strategy') || 'delete';
      const ids = [id, ...collectDescendants(id)];
      const affected = db.notes.filter((n) => ids.includes(n.categoryId));

      if (strategy === 'move') {
        const parentId = cat.parentId || null;
        for (const n of affected) n.categoryId = parentId;
        for (const c of db.categories) {
          if (c.parentId === id) c.parentId = parentId;
        }
        db.categories = db.categories.filter((c) => c.id !== id);
      } else {
        // 删类别时笔记进回收站，而不是跟类别一起消失
        for (const n of affected) { n.deletedAt = now(); n.updatedAt = n.deletedAt; }
        db.categories = db.categories.filter((c) => !ids.includes(c.id));
      }
      scheduleSave();
      return sendJSON(res, 200, { ok: true, removedNotes: strategy === 'delete' ? affected.length : 0 });
    }
  }

  // 笔记
  if (seg[0] === 'notes' && seg.length <= 2) {
    const id = seg[1];

    if (req.method === 'POST' && !id) {
      const body = await readBody(req);
      const note = {
        id: uid(),
        categoryId: body.categoryId && findCategory(body.categoryId) ? body.categoryId : null,
        title: body.title || '',
        content: body.content || '',
        format: body.format === 'rich' ? 'rich' : 'md',
        starred: !!body.starred,
        tags: Array.isArray(body.tags)
          ? [...new Set(body.tags.map((t) => String(t).trim()).filter(Boolean))].slice(0, 10)
          : [],
        attachments: [],
        createdAt: now(),
        updatedAt: now(),
      };
      db.notes.push(note);
      scheduleSave();
      return sendJSON(res, 200, note);
    }

    if (!id) return sendError(res, 404, '未知接口');

    const note = findNote(id);
    if (!note) return sendError(res, 404, '笔记不存在');

    if (req.method === 'GET') return sendJSON(res, 200, note);

    if (req.method === 'PATCH') {
      const body = await readBody(req);

      const contentChanged = typeof body.content === 'string' && body.content !== note.content;
      const titleChanged = typeof body.title === 'string' && body.title !== note.title;
      const formatChanged = (body.format === 'md' || body.format === 'rich') && body.format !== note.format;
      if (contentChanged || titleChanged || formatChanged) {
        snapshotVersion(note, formatChanged ? 'format' : (body.forceVersion ? 'manual' : 'auto'));
      }

      if (typeof body.title === 'string') note.title = body.title;
      if (typeof body.content === 'string') note.content = body.content;
      if (body.format === 'md' || body.format === 'rich') note.format = body.format;
      if (body.categoryId !== undefined) {
        note.categoryId = body.categoryId && findCategory(body.categoryId) ? body.categoryId : null;
      }
      if (typeof body.starred === 'boolean') note.starred = body.starred;
      if (Array.isArray(body.tags)) {
        note.tags = [...new Set(body.tags.map((t) => String(t).trim()).filter(Boolean))].slice(0, 10);
      }
      note.updatedAt = now();
      scheduleSave();
      return sendJSON(res, 200, note);
    }

    if (req.method === 'DELETE') {
      // 软删除：附件与历史版本都留着，30 天后由 purgeExpiredTrash 真删
      note.deletedAt = now();
      note.updatedAt = note.deletedAt;
      scheduleSave();
      return sendJSON(res, 200, { ok: true, trashed: true });
    }
  }

  // 历史版本
  if (seg[0] === 'notes' && seg[2] === 'versions') {
    const note = findNote(seg[1]);
    if (!note) return sendError(res, 404, '笔记不存在');
    const vid = seg[3];

    if (req.method === 'GET' && !vid) {
      const list = readVersions(note.id);
      return sendJSON(res, 200, {
        versions: list.map((v) => ({
          id: v.id, ts: v.ts, title: v.title, format: v.format,
          reason: v.reason, size: (v.content || '').length,
        })),
      });
    }

    if (req.method === 'GET' && vid) {
      const v = readVersions(note.id).find((x) => x.id === vid);
      if (!v) return sendError(res, 404, '版本不存在');
      return sendJSON(res, 200, v);
    }

    if (req.method === 'POST' && vid && seg[4] === 'restore') {
      const v = readVersions(note.id).find((x) => x.id === vid);
      if (!v) return sendError(res, 404, '版本不存在');
      snapshotVersion(note, 'restore');
      note.title = v.title;
      note.content = v.content;
      note.format = v.format;
      note.updatedAt = now();
      scheduleSave();
      return sendJSON(res, 200, note);
    }

    if (req.method === 'DELETE' && vid) {
      const list = readVersions(note.id).filter((x) => x.id !== vid);
      writeVersions(note.id, list);
      return sendJSON(res, 200, { ok: true });
    }
  }

  // 附件
  if (seg[0] === 'notes' && seg[2] === 'attachments') {
    const note = findNote(seg[1]);
    if (!note) return sendError(res, 404, '笔记不存在');
    const attId = seg[3];

    if (req.method === 'POST' && !attId) {
      const body = await readBody(req);
      const name = String(body.name || 'file');
      const data = String(body.data || '');
      const b64 = data.includes(',') ? data.split(',').pop() : data;
      const buf = Buffer.from(b64, 'base64');
      if (!buf.length) return sendError(res, 400, '空文件');
      const ext = path.extname(name).slice(0, 10).replace(/[^\w.]/g, '') || '';
      const id2 = uid();
      const diskName = `att_${id2}${ext}`;
      await fsp.writeFile(path.join(FILES_DIR, diskName), buf);
      const att = {
        id: id2,
        name,
        size: buf.length,
        type: body.type || 'application/octet-stream',
        disk: diskName,
        createdAt: now(),
      };
      note.attachments.push(att);
      note.updatedAt = now();
      scheduleSave();
      return sendJSON(res, 200, att);
    }

    if (req.method === 'DELETE' && attId) {
      const att = note.attachments.find((a) => a.id === attId);
      if (!att) return sendError(res, 404, '附件不存在');
      await fsp.unlink(path.join(FILES_DIR, att.disk)).catch(() => {});
      note.attachments = note.attachments.filter((a) => a.id !== attId);
      note.updatedAt = now();
      scheduleSave();
      return sendJSON(res, 200, { ok: true });
    }
  }

  return sendError(res, 404, '未知接口');
}

function removeNoteFiles(note) {
  for (const a of note.attachments || []) {
    fs.unlink(path.join(FILES_DIR, a.disk), () => {});
  }
  fs.unlink(versionsPath(note.id), () => {});
}

/* 只允许浏览器内联显示「真正是图片/PDF/纯文本」的类型。
   附件的 type 来自上传方（也可能来自导入的备份），如果直接写进 Content-Type，
   一份 type 为 text/html 的附件就成了同源可执行页面 —— 能读取全部笔记再外传。
   其余类型一律 application/octet-stream + 附件下载。 */
const SAFE_ATT_TYPE = /^(image\/(png|jpeg|gif|webp|bmp|x-icon|svg\+xml)|application\/pdf|text\/plain)$/;

function serveFile(req, res, attId) {
  let att = null;
  for (const n of db.notes) {
    const f = (n.attachments || []).find((a) => a.id === attId);
    if (f) { att = f; break; }
  }
  if (!att) return sendError(res, 404, '文件不存在');
  /* db.json 可能被手工编辑过，路径再校验一次，保证只能落在 data/files 里 */
  const filePath = safeJoin(FILES_DIR, String(att.disk || ''));
  if (!filePath) return sendError(res, 403, '附件路径非法');
  fs.stat(filePath, (err, stat) => {
    if (err) return sendError(res, 404, '文件已丢失');
    const rawType = String(att.type || '').split(';')[0].trim().toLowerCase();
    const known = SAFE_ATT_TYPE.test(rawType);
    /* SVG 保留 image/svg+xml（正文里的 <img> 才画得出来），但直接打开时强制下载 */
    const inline = known && rawType !== 'image/svg+xml';
    res.writeHead(200, {
      'Content-Type': known ? rawType : 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Content-Length': stat.size,
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(att.name)}`,
      'Cache-Control': 'public, max-age=86400',
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

function exportAll(res) {
  const body = JSON.stringify({ exportedAt: new Date().toISOString(), ...db }, null, 2);
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Disposition': `attachment; filename="shijian-backup-${new Date().toISOString().slice(0, 10)}.json"`,
  });
  res.end(body);
}


// ---------------------------------------------------------------- 导入
function stampNow() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}-${ms}`;
}

async function importAll(req, res, query) {
  /* mode=lww 只给「从云端拉取」用：同 id 比 updatedAt，后写覆盖先写。
     手动导入备份不带这个参数，仍是「已存在即跳过」，不覆盖用户本机内容。 */
  const lww = !!query && query.get('mode') === 'lww';
  const body = await readBody(req);
  const cats = Array.isArray(body.categories) ? body.categories : [];
  const notes = Array.isArray(body.notes) ? body.notes : [];
  if (!cats.length && !notes.length) return sendError(res, 400, '这个文件里没有可导入的内容');

  const backupName = `backup-${stampNow()}.json`;
  fs.writeFileSync(path.join(DATA_DIR, backupName), JSON.stringify(db, null, 2));
  pruneBackups();

  const catIds = new Set(db.categories.map((c) => c.id));
  let catAdded = 0;

  // 先处理父级已就位的，循环几轮把多层结构补齐
  let pending = cats.filter((c) => c && typeof c.id === 'string' && ID_RE.test(c.id) && !catIds.has(c.id));
  for (let round = 0; round < 20 && pending.length; round++) {
    const rest = [];
    for (const c of pending) {
      if (catIds.has(c.id)) continue;
      if (c.parentId && !catIds.has(c.parentId)) { rest.push(c); continue; }
      db.categories.push({
        id: c.id,
        name: String(c.name || '未命名类别').slice(0, 60),
        parentId: c.parentId || null,
        createdAt: c.createdAt || now(),
      });
      catIds.add(c.id);
      catAdded++;
    }
    if (rest.length === pending.length) break;
    pending = rest;
  }
  // 父级彻底找不到的，挂到顶层而不是丢弃
  for (const c of pending) {
    if (catIds.has(c.id)) continue;
    db.categories.push({
      id: c.id,
      name: String(c.name || '未命名类别').slice(0, 60),
      parentId: null,
      createdAt: c.createdAt || now(),
    });
    catIds.add(c.id);
    catAdded++;
  }

  let noteAdded = 0;
  let updated = 0;
  let skipped = 0;
  let lostFiles = 0;

  for (const n of notes) {
    if (!n || typeof n.id !== 'string' || !ID_RE.test(n.id)) continue;
    const incomingUpdated = Number(n.updatedAt) || 0;
    const incomingDeleted = Number(n.deletedAt) || 0;
    const exist = db.notes.find((x) => x.id === n.id);
    if (exist && (!lww || incomingUpdated <= (Number(exist.updatedAt) || 0))) {
      skipped++;
      continue;
    }
    const rawAtt = Array.isArray(n.attachments) ? n.attachments : [];
    const attachments = rawAtt.filter((a) => a && typeof a.disk === 'string'
      && DISK_RE.test(a.disk) && fs.existsSync(path.join(FILES_DIR, a.disk)));
    lostFiles += rawAtt.length - attachments.length;
    /* 云端行里的附件只有 path、没有本地 disk；覆盖时保留本地已有附件，
       否则手机上改过的笔记拉回电脑会把电脑上的原图覆盖成空。 */
    const finalAtt = exist && !attachments.length ? (exist.attachments || []) : attachments;
    const fields = {
      title: String(n.title || '无标题笔记').slice(0, 200),
      content: String(n.content || ''),
      format: n.format === 'rich' ? 'rich' : 'md',
      categoryId: catIds.has(n.categoryId) ? n.categoryId : null,
      starred: !!n.starred,
      tags: Array.isArray(n.tags) ? n.tags.map(String).slice(0, 10) : [],
      attachments: finalAtt,
      createdAt: n.createdAt || now(),
      updatedAt: incomingUpdated || now(),
    };
    if (incomingDeleted) fields.deletedAt = incomingDeleted;
    if (exist) {
      snapshotVersion(exist, 'auto'); // 覆盖前留一份旧内容，误同步还能找回
      Object.assign(exist, fields);
      if (!incomingDeleted) delete exist.deletedAt;
      updated++;
    } else {
      db.notes.push(Object.assign({ id: n.id }, fields));
      noteAdded++;
    }
  }

  persistNow();
  sendJSON(res, 200, { catAdded, noteAdded, updated, skipped, lostFiles, backup: backupName });
}

// ---------------------------------------------------------------- 局域网访问
/**
 * 开启 --lan 后，非本机（非回环地址）的请求必须携带正确访问码。
 * 访问码是 6 位数字，首次启动自动生成并写入 data/access-code.txt；
 * 删掉该文件重启即可换新码。本机访问不受任何影响。
 */
const PIN_FILE = path.join(DATA_DIR, 'access-code.txt');
const COOKIE_NAME = 'sj_key';
const COOKIE_MAX_AGE = 30 * 24 * 3600; // 30 天，手机不用反复输入
const FAIL_LIMIT = 8;                  // 连续错 8 次
const FAIL_LOCK_MS = 5 * 60 * 1000;    // 锁 5 分钟
const loginFails = new Map();          // ip -> { n, until }

let accessPin = '';
let accessKey = '';

function initAccess() {
  if (!LAN) return;
  try {
    accessPin = fs.readFileSync(PIN_FILE, 'utf8').trim();
  } catch (e) {
    accessPin = '';
  }
  if (!/^\d{6}$/.test(accessPin)) {
    accessPin = String(crypto.randomInt(100000, 1000000));
    const tmp = PIN_FILE + '.tmp';
    fs.writeFileSync(tmp, accessPin + '\n');
    fs.renameSync(tmp, PIN_FILE);
  }
  accessKey = crypto.createHash('sha256').update('shijian-access:' + accessPin).digest('hex').slice(0, 40);
}

function isLocalRequest(req) {
  const a = req.socket.remoteAddress || '';
  return a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1';
}

function getCookie(req, name) {
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return '';
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (!ba.length || ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/** 返回 true 表示请求已被拦截 */
function guardAccess(req, res, pathname) {
  if (!LAN || isLocalRequest(req)) return false;
  if (pathname === '/api/lan-login') return false;
  if (safeEqual(getCookie(req, COOKIE_NAME), accessKey)) return false;
  if (pathname.startsWith('/api/')) {
    sendError(res, 401, '需要访问码');
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(loginPage());
  }
  return true;
}

/** 手机登录页：单文件内联，不依赖 public 下的资源 */
function loginPage(msg = '') {
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>拾笺 · 输入访问码</title><style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
font:16px/1.6 -apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;
background:#f6f5f2;color:#2c2c2c}
.card{width:100%;max-width:340px;background:#fff;border-radius:18px;padding:32px 24px;
box-shadow:0 8px 32px rgba(0,0,0,.08);text-align:center}
.logo{width:56px;height:56px;margin:0 auto 18px;border-radius:16px;background:#2f6f5e;color:#fff;
font:600 28px/56px Georgia,serif}
h1{font-size:19px;font-weight:600;margin-bottom:6px}
p{font-size:13.5px;color:#8a8a86;margin-bottom:22px;line-height:1.55}
input{width:100%;padding:14px 16px;font-size:24px;letter-spacing:10px;text-align:center;
border:1.5px solid #e2e0db;border-radius:12px;outline:none;background:#fbfaf8;
font-variant-numeric:tabular-nums;font-weight:600;color:#2c2c2c}
input:focus{border-color:#2f6f5e;background:#fff}
input::placeholder{font-size:15px;letter-spacing:1px;color:#b9b5ac;font-weight:400}
button{width:100%;margin-top:14px;padding:14px;font-size:16px;font-weight:600;color:#fff;
background:#2f6f5e;border:0;border-radius:12px;cursor:pointer}
button:active{background:#245547}
button:disabled{opacity:.55}
.err{min-height:20px;margin-top:12px;font-size:13px;color:#c0392b}
@media (prefers-color-scheme:dark){
body{background:#1c1c1a;color:#e8e6e1}.card{background:#262624;box-shadow:0 8px 32px rgba(0,0,0,.4)}
h1{color:#e8e6e1}input{background:#1f1f1d;border-color:#3a3a37;color:#e8e6e1}
}
</style></head><body>
<form class="card" onsubmit="return false">
  <div class="logo">拾</div>
  <h1>拾笺 · 私有笔记库</h1>
  <p>请输入电脑上黑窗口里显示的 6 位访问码</p>
  <input id="pin" type="tel" inputmode="numeric" maxlength="6" autocomplete="one-time-code"
    placeholder="6 位数字" autofocus>
  <button id="go">进入</button>
  <div class="err" id="err">${msg}</div>
</form>
<script>
var pin = document.getElementById('pin'), go = document.getElementById('go'),
    err = document.getElementById('err');
pin.addEventListener('input', function () {
  this.value = this.value.replace(/\\D/g, '').slice(0, 6);
  if (this.value.length === 6) submit();
});
pin.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
function submit() {
  var v = pin.value;
  if (v.length !== 6) { err.textContent = '请输入 6 位数字'; return; }
  go.disabled = true; err.textContent = '';
  fetch('/api/lan-login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: v })
  }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
    .then(function (x) {
      if (x.ok) { location.replace('/'); return; }
      go.disabled = false; err.textContent = x.d.error || '访问码不对';
      pin.value = ''; pin.focus();
    })
    .catch(function () { go.disabled = false; err.textContent = '网络异常，请重试'; });
}
document.getElementById('go').onclick = submit;
</script></body></html>`;
}

async function handleLanLogin(req, res) {
  const ip = req.socket.remoteAddress || '?';
  const rec = loginFails.get(ip);
  if (rec && rec.until > Date.now()) {
    const min = Math.ceil((rec.until - Date.now()) / 60000);
    return sendError(res, 429, '尝试次数过多，请 ' + min + ' 分钟后再试');
  }
  const body = await readBody(req);
  const pin = String(body.pin || '').replace(/\D/g, '');
  if (!safeEqual(pin, accessPin)) {
    const n = (rec ? rec.n : 0) + 1;
    const lock = n >= FAIL_LIMIT;
    loginFails.set(ip, { n: lock ? 0 : n, until: lock ? Date.now() + FAIL_LOCK_MS : 0 });
    return sendError(res, 401, lock ? '错误次数过多，已锁定 5 分钟' : '访问码不对');
  }
  loginFails.delete(ip);
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Set-Cookie': COOKIE_NAME + '=' + accessKey + '; Path=/; Max-Age=' + COOKIE_MAX_AGE + '; HttpOnly; SameSite=Lax',
  });
  res.end(JSON.stringify({ ok: true }));
}

// ---------------------------------------------------------------- 服务
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  try {
    if (guardAccess(req, res, pathname)) return;
    if (pathname === '/api/lan-login' && req.method === 'POST') return await handleLanLogin(req, res);
    if (pathname === '/api/export') return exportAll(res);
    if (pathname === '/api/import' && req.method === 'POST') return await importAll(req, res, url.searchParams);
    if (pathname.startsWith('/api/files/')) return serveFile(req, res, pathname.split('/').pop());
    if (pathname.startsWith('/api/')) return await handleApi(req, res, pathname, url.searchParams);
    return serveStatic(req, res, pathname);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) sendError(res, 500, e.message || '服务器内部错误');
    else res.end();
  }
});

fs.mkdirSync(FILES_DIR, { recursive: true });
fs.mkdirSync(VERSIONS_DIR, { recursive: true });
loadDB();
initAccess();

function openBrowser(url) {
  const { spawn } = require('child_process');
  try {
    if (process.platform === 'darwin') spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    else if (process.platform === 'win32') spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
    else spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
  } catch (e) { /* 打不开浏览器也不影响服务 */ }
}

/**
 * 端口上的服务是不是另一个「拾笺」实例？
 * 用来防止双击两次启动.bat 起两个进程 —— 两个进程各持一份内存数据，
 * 保存时整份写盘，后写的那个会把前一个的改动整片覆盖掉（实测会丢笔记）。
 * 只认「200 + application/json」两个特征，不读响应体，避免大库时被 1MB+ 的 state 拖住。
 */
function probeShijian(port) {
  return new Promise((resolve) => {
    const req = http.get(
      { host: '127.0.0.1', port, path: '/api/state', timeout: 900 },
      (res) => {
        const ct = String(res.headers['content-type'] || '');
        res.resume();
        resolve(res.statusCode === 200 && ct.indexOf('application/json') >= 0);
      }
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

/**
 * 启动服务；端口被占用时先判断是不是重复启动，是则报 ALREADY_RUNNING，
 * 是别的程序占用才向上顺延端口，最多试 12 次。
 * @returns {Promise<import('http').Server>} 已监听的 server 实例
 */
function start(port = PORT, host = BIND_HOST, tries = 12) {
  return new Promise((resolve, reject) => {
    const tryListen = (p, left) => {
      server.removeAllListeners('listening');
      const onError = (e) => {
        server.removeListener('error', onError);
        server.removeAllListeners('listening');
        if (e.code !== 'EADDRINUSE') return reject(e);
        probeShijian(p).then((isOurs) => {
          if (isOurs) {
            const err = new Error('拾笺已经在运行');
            err.code = 'ALREADY_RUNNING';
            err.port = p;
            return reject(err);
          }
          if (left > 0) tryListen(p + 1, left - 1);
          else reject(e);
        });
      };
      server.once('error', onError);
      server.once('listening', () => {
        server.removeListener('error', onError);
        const realPort = server.address().port;
        console.log('');
        console.log('  拾笺 · 本地笔记库已启动');
        console.log('  http://localhost:' + realPort);
        console.log('  数据目录：' + DATA_DIR);
        if (LAN) {
          console.log('');
          console.log('  ────────────────────────────────────────');
          console.log('   手机访问（需与电脑连同一个 WiFi）');
          Object.values(require('os').networkInterfaces()).flat().forEach((n) => {
            if (n && n.family === 'IPv4' && !n.internal) {
              console.log('   地址：http://' + n.address + ':' + realPort);
            }
          });
          console.log('   访问码：' + accessPin);
          console.log('  ────────────────────────────────────────');
          console.log('   换访问码：删除 data/access-code.txt 后重启');
          console.log('   注意：别在公共 WiFi 下开启手机访问');
          console.log('');
        }
        console.log('  关闭这个窗口即可退出\n');
        resolve(server);
      });
      server.listen(p, host);
    };
    tryListen(port, tries);
  });
}

if (require.main === module) {
  const wantOpen = process.argv.includes('--open') || process.env.SHIJIAN_OPEN === '1';
  start(PORT)
    .then((srv) => {
      if (wantOpen) openBrowser(`http://localhost:${srv.address().port}`);
    })
    .catch((e) => {
      /* 重复启动：不新开进程，直接把已经跑着的那个窗口调到前面 */
      if (e.code === 'ALREADY_RUNNING') {
        const url = `http://localhost:${e.port}`;
        console.log('');
        console.log('  拾笺已经在运行了：' + url);
        console.log('  为避免两个窗口同时改同一份数据造成覆盖，这次不重复启动。');
        if (wantOpen) {
          console.log('  正在为你打开已经运行的那个窗口…');
          openBrowser(url);
        }
        console.log('');
        setTimeout(() => process.exit(0), wantOpen ? 1200 : 200);
        return;
      }
      console.error('\n  启动失败：' + e.message);
      if (e.code === 'EADDRINUSE') console.error('  端口被占用，请关闭占用程序或设置环境变量 PORT=8080 后重试。');
      console.error('');
      setTimeout(() => process.exit(1), 3000);
    });
}

module.exports = { start, server, PORT };
