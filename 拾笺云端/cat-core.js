/* ============================================================
   拾笺 · 分类身份与去重内核（两端共用）
   ------------------------------------------------------------
   这个文件在桌面端和云端各存一份，内容必须逐字相同：
     · 同步：拾笺/scripts/sync-shared.js 一键复制
     · 守卫：两端回归测试用 md5 比对，漂移会直接报错
   改逻辑只改桌面这一份，然后跑一次同步脚本。

   为什么要有这一个文件：
   分类 id 是两端各自随机生成的，同一个分类在电脑和手机上可能是两个 id。
   以前同步只认 id，于是「同名同父」的两份都会被留下，树上越来越多；
   手建的分类也不拦重名，重复只会源源不断产生。现在把「是不是同一个分类」
   「该留哪一个」「哪些能安全删掉」这三件事收进内核，两端 + 同步共用
   同一套判定，才不会各算一套。
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SJCats = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SEP = '\u0000';
  const MAX_DEPTH = 64;

  /* 名字归一：全角空格、连续空白都折成一个半角空格，大小写不敏感。
     只用于「是不是重名」的判断，不改用户填的名字本身。 */
  function normName(name) {
    return String(name == null ? '' : name).replace(/[\s\u3000]+/g, ' ').trim().toLowerCase();
  }

  /* 显示用清理：折叠空白、去首尾，保留大小写。 */
  function cleanName(name) {
    return String(name == null ? '' : name).replace(/[\s\u3000]+/g, ' ').trim();
  }

  function catKey(name, parentId) {
    return String(parentId || '') + SEP + normName(name);
  }

  /* 同一父级下是否已有同名分类。excludeId 用于改名 / 移动时排除自己。 */
  function siblingOf(cats, name, parentId, excludeId) {
    const k = catKey(name, parentId || null);
    const list = cats || [];
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      if (!c || !c.id) continue;
      if (excludeId && c.id === excludeId) continue;
      if (catKey(c.name, c.parentId || null) === k) return c;
    }
    return null;
  }

  /* 名字被占用时依次试「名字 2」「名字 3」……只给「没填名字」的兜底用，
     用户自己填的名字重名一律报错，不偷偷改名。 */
  function uniqueName(cats, base, parentId) {
    const root = cleanName(base) || '未命名类别';
    if (!siblingOf(cats, root, parentId)) return root;
    for (let i = 2; i < 999; i++) {
      const name = root + ' ' + i;
      if (!siblingOf(cats, name, parentId)) return name;
    }
    return root + ' ' + Date.now().toString(36).slice(-4);
  }

  /* 一个分类连同它整棵子树的 id。 */
  function subtreeIds(cats, id) {
    const ids = new Set([id]);
    let grown = true;
    let guard = 0;
    while (grown && guard++ < MAX_DEPTH) {
      grown = false;
      for (const c of (cats || [])) {
        if (c && c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
          ids.add(c.id);
          grown = true;
        }
      }
    }
    return ids;
  }

  /* 内容权重：直属笔记优先（×1000），再看子树规模。合并时保留内容多的
     那一份，树不会因此变浅、笔记看起来也不会「换了个篮子」。 */
  function richness(cat, cats, notes) {
    const ids = subtreeIds(cats, cat.id);
    let n = 0;
    for (const note of (notes || [])) {
      if (note && ids.has(note.categoryId)) n++;
    }
    return n * 1000 + ids.size;
  }

  function cmpText(a, b) {
    const x = String(a), y = String(b);
    return x < y ? -1 : x > y ? 1 : 0;
  }

  /* 组内保留谁：内容多 → 创建早 → id 字典序。
     三条依据两端都拿得到，所以电脑和手机算出的是同一个赢家，
     不会「各留各的」，也就不会越同步越多。 */
  function pickKeep(list, cats, notes) {
    let best = list[0];
    let bestScore = richness(best, cats, notes);
    for (let i = 1; i < list.length; i++) {
      const c = list[i];
      const s = richness(c, cats, notes);
      if (s !== bestScore) { if (s > bestScore) { best = c; bestScore = s; } continue; }
      const d = (Number(c.createdAt) || 0) - (Number(best.createdAt) || 0);
      if (d < 0) { best = c; continue; }
      if (d === 0 && cmpText(c.id, best.id) < 0) best = c;
    }
    return best;
  }

  /* 合并两份分类（本地 + 云端，或同一份里的重复项）：
     按「父级 id + 名字」归并，返回合并后的列表与
     被并掉的 id → 保留 id 的重映射（笔记 categoryId、子分类 parentId 都要跟着改）。
     父级本身被并掉时子分类的 key 也在变，所以要多轮收敛。 */
  function mergeCats(localCats, cloudCats, notes) {
    const map = new Map();
    const add = (c) => {
      if (!c || !c.id || map.has(c.id)) return;
      map.set(c.id, Object.assign({}, c));
    };
    for (const c of (localCats || [])) add(c);
    for (const c of (cloudCats || [])) add(c);

    const remap = new Map();
    for (let round = 0; round < 20; round++) {
      const all = Array.from(map.values());
      const groups = new Map();
      for (const c of all) {
        const pid = c.parentId && map.has(c.parentId) ? c.parentId : null;
        const k = catKey(c.name, pid);
        const g = groups.get(k);
        if (g) g.push(c); else groups.set(k, [c]);
      }
      let merged = 0;
      for (const list of groups.values()) {
        if (list.length < 2) continue;
        const keep = pickKeep(list, all, notes);
        for (const c of list) {
          if (c.id === keep.id) continue;
          remap.set(c.id, keep.id);
          map.delete(c.id);
          merged++;
        }
      }
      for (const c of map.values()) {
        if (c.parentId && remap.has(c.parentId)) c.parentId = remap.get(c.parentId);
      }
      if (!merged) break;
    }
    return { list: Array.from(map.values()), remap };
  }

  /* 单库自愈：本地库里「同父同名」只留一份。
     返回的 list 是去重后的分类（新对象），remap 用来改笔记指向。 */
  function dedupeCats(cats, notes) {
    return mergeCats(cats, [], notes);
  }

  /* 重映射可能是一条链（A→B→C），一路走到头。 */
  function resolveId(remap, id) {
    let cur = id, guard = 0;
    while (cur && remap.has(cur) && guard++ < MAX_DEPTH) cur = remap.get(cur);
    return cur;
  }

  /* 把重映射落到分类树与笔记上（原地改）。 */
  function remapAll(cats, notes, remap) {
    if (!remap || !remap.size) return 0;
    let changed = 0;
    for (const c of (cats || [])) {
      const nid = resolveId(remap, c.id);
      if (nid && nid !== c.id) { c.id = nid; changed++; }
      if (c.parentId) {
        const np = resolveId(remap, c.parentId);
        if (np && np !== c.parentId) { c.parentId = np; changed++; }
      }
    }
    for (const n of (notes || [])) {
      if (!n || !n.categoryId) continue;
      const nc = resolveId(remap, n.categoryId);
      if (nc && nc !== n.categoryId) { n.categoryId = nc; changed++; }
    }
    return changed;
  }

  /* 标签归一：标签是从笔记的 tags 派生出来的（没有独立标签表），所以
     「同一个标签」只能靠名字判。以前这里用 includes 严格比较，
     「工作」「工作 」「Work」在侧栏会变成三个 —— 跟分类重名是同一类问题。
     归一只合并「忽略大小写与空白后完全相同」的写法，不碰语义。 */
  function normTag(tag) {
    return normName(tag);
  }

  /* 全库统一标签写法：同名的取「出现次数最多的那个写法」（并列取字典序小的），
     再按篇去重、去掉空标签。返回被改动的笔记篇数。 */
  function healTags(notes) {
    const forms = new Map();
    for (const n of (notes || [])) {
      for (const t of (n && n.tags) || []) {
        const key = normTag(t);
        if (!key) continue;
        const form = cleanName(t);
        let m = forms.get(key);
        if (!m) { m = new Map(); forms.set(key, m); }
        m.set(form, (m.get(form) || 0) + 1);
      }
    }
    const canon = new Map();
    for (const [key, m] of forms) {
      let best = '';
      let bestN = -1;
      for (const [form, cnt] of m) {
        if (cnt > bestN || (cnt === bestN && cmpText(form, best) < 0)) { best = form; bestN = cnt; }
      }
      canon.set(key, best);
    }
    let changed = 0;
    for (const n of (notes || [])) {
      if (!n) continue;
      const before = Array.isArray(n.tags) ? n.tags : [];
      if (!before.length) { if (n.tags !== undefined && !Array.isArray(n.tags)) { n.tags = []; changed++; } continue; }
      const out = [];
      const seen = new Set();
      for (const t of before) {
        const key = normTag(t);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(canon.get(key) || cleanName(t));
      }
      const same = out.length === before.length && out.every((x, i) => x === before[i]);
      if (!same) { n.tags = out; changed++; }
    }
    return changed;
  }

  /* 正文取纯文本：判重只看「写了什么」，不看加粗、高亮、代码块这些外壳。
     两端存的是 HTML，同一段话在两次保存里标记可能不同（比如代码高亮），
     直接比 HTML 会把同一篇算成两篇。 */
  function plainText(html) {
    return String(html == null ? '' : html)
      .replace(/<(style|script)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/[\s\u3000]+/g, '')
      .toLowerCase();
  }

  /* 6-gram 重合度（Dice）。比编辑距离稳：多打一段废话不会让整篇判成不同，
     也不会因为顺序调换就归零。短文本退化成「互相包含」。 */
  function diceSim(a, b) {
    if (!a || !b) return 0;
    if (a === b) return 1;
    const N = 6;
    if (a.length < N || b.length < N) return (a.includes(b) || b.includes(a)) ? 0.9 : 0;
    const grams = (s) => {
      const m = new Map();
      for (let i = 0; i + N <= s.length; i++) {
        const g = s.slice(i, i + N);
        m.set(g, (m.get(g) || 0) + 1);
      }
      return m;
    };
    const A = grams(a);
    const B = grams(b);
    let inter = 0;
    let total = 0;
    for (const [g, c] of A) {
      total += c;
      const d = B.get(g);
      if (d) inter += Math.min(c, d);
    }
    for (const c of B.values()) total += c;
    return total ? (2 * inter) / total : 0;
  }

  function tagKeySet(tags) {
    const set = new Set();
    for (const t of (tags || [])) {
      const k = normTag(t);
      if (k) set.add(k);
    }
    return set;
  }

  function sameTagSet(a, b) {
    const A = tagKeySet(a);
    const B = tagKeySet(b);
    if (!A.size || A.size !== B.size) return false;
    for (const x of A) if (!B.has(x)) return false;
    return true;
  }

  /* 重复笔记合并：同一篇在两台设备 / 老备份里各存了一份，id 不同、标题一样，
     界面上就是两条。以前只能人工比对删一条，现在进出库时自动认。
     判定保守到只碰「几乎肯定是同一篇」的：
       · 标题归一后相同、分类相同，且都不是「无标题笔记」这种默认名
       · 正文纯文本重合度 ≥ 0.85，或 ≥ 0.6 且标签完全一致
     保留 updatedAt 最新的一份（用户最后一次改的那份），其余的软删进回收站
     （30 天内可恢复），标签 / 星标 / 附件并到保留的那份。绝不硬删。 */
  function dedupeNotes(notes, nowTs) {
    const list = Array.isArray(notes) ? notes : [];
    const now = Number(nowTs) || Date.now();
    const groups = new Map();
    for (const n of list) {
      if (!n || !n.id || n.deletedAt) continue;
      const title = String(n.title == null ? '' : n.title).trim();
      if (title.length < 2) continue;
      if (/^(无标题笔记|无标题|untitled)$/i.test(title)) continue;
      const k = normName(title) + SEP + (n.categoryId || '');
      const g = groups.get(k);
      if (g) g.push(n); else groups.set(k, [n]);
    }
    const pairs = [];
    for (const g of groups.values()) {
      if (g.length < 2) continue;
      g.sort((a, b) => {
        const d = (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0);
        if (d) return d;
        return cmpText(String(a.id), String(b.id));
      });
      const keep = g[0];
      const keepText = plainText(keep.content);
      if (!keepText) continue;
      for (let i = 1; i < g.length; i++) {
        const drop = g[i];
        if (drop.mergedInto) continue;
        const dropText = plainText(drop.content);
        if (!dropText) continue;
        const sim = diceSim(keepText, dropText);
        if (!(sim >= 0.85 || (sim >= 0.6 && sameTagSet(keep.tags, drop.tags)))) continue;

        /* 合并到保留项：标签并集（最多 10 个）、星标取或、附件并集、创建时间取更早。 */
        const tags = [];
        const seen = new Set();
        for (const t of [].concat(keep.tags || [], drop.tags || [])) {
          const k = normTag(t);
          if (!k || seen.has(k) || tags.length >= 10) continue;
          seen.add(k);
          tags.push(cleanName(t));
        }
        keep.tags = tags;
        if (drop.starred) keep.starred = true;
        const atts = Array.isArray(keep.attachments) ? keep.attachments.slice() : [];
        const attKeys = new Set(atts.map((a) => (a && (a.id || a.disk || a.path || a.name)) || ''));
        for (const a of (drop.attachments || [])) {
          const key = (a && (a.id || a.disk || a.path || a.name)) || '';
          if (!key || attKeys.has(key)) continue;
          attKeys.add(key);
          atts.push(a);
        }
        keep.attachments = atts;
        const a1 = Number(keep.createdAt) || 0;
        const a2 = Number(drop.createdAt) || 0;
        if (a2 && (!a1 || a2 < a1)) keep.createdAt = a2;

        drop.deletedAt = now;
        drop.updatedAt = now;
        drop.mergedInto = keep.id;
        pairs.push({ keep: keep.id, drop: drop.id, title: String(keep.title || ''), sim: Math.round(sim * 100) / 100 });
      }
    }
    return { count: pairs.length, pairs };
  }

  /* 数据体检：把「指向已不存在的对象」和「排序 / 标签的重复写法」一次理顺。
     只做安全修正 —— 悬空分类提升为根、悬空笔记归未分类，绝不删用户数据。
     这些脏数据是「删文件夹不删后代」「同步只认 id」等历史问题留下的，
     与其等它们以「笔记莫名消失」的形式暴露，不如每次进出库时顺手理掉。 */
  function healIntegrity(cats, notes) {
    const stats = { orphanCats: 0, cycleCats: 0, orphanNotes: 0, orderFixed: 0, tagFixed: 0, notesMerged: 0, mergedPairs: [] };
    const list = Array.isArray(cats) ? cats : [];
    const byId = new Map();
    for (const c of list) if (c && c.id) byId.set(c.id, c);

    /* 1. 父级悬空 / 自己指向自己：提升为根。删掉会连带丢笔记，提升最安全。 */
    for (const c of list) {
      if (!c || !c.parentId) continue;
      if (c.parentId === c.id || !byId.has(c.parentId)) {
        c.parentId = null;
        stats.orphanCats++;
      }
    }

    /* 2. 环（A 的父是 B、B 的父是 A）：沿父链上溯，撞回自己就断开。
       不断开的话树渲染会无限递归，整页白屏。 */
    for (const c of list) {
      if (!c || !c.parentId) continue;
      const seen = new Set([c.id]);
      let cur = c.parentId;
      let guard = 0;
      let bad = false;
      while (cur && guard++ < MAX_DEPTH) {
        if (seen.has(cur)) { bad = true; break; }
        seen.add(cur);
        const p = byId.get(cur);
        if (!p) break;
        cur = p.parentId;
      }
      if (bad) { c.parentId = null; stats.cycleCats++; }
    }

    /* 3. 笔记挂在已删分类上：归未分类。界面本来就显示「未分类」，
       但 id 留着会让它在移动、搜索、重新归类时露馅。 */
    for (const n of (notes || [])) {
      if (!n || !n.categoryId) continue;
      if (!byId.has(n.categoryId)) { n.categoryId = null; stats.orphanNotes++; }
    }

    /* 4. order 归一：同一父级下重排 0..n-1。新建用「同级数量」当 order，
       删一个就会撞号；撞号后拖动排序的结果取决于数组顺序，刷新就可能变。 */
    const groups = new Map();
    list.forEach((c, i) => {
      if (!c || !c.id) return;
      const k = c.parentId || '';
      const g = groups.get(k);
      if (g) g.push({ c, i }); else groups.set(k, [{ c, i }]);
    });
    for (const arr of groups.values()) {
      arr.sort((a, b) => {
        const d = (Number(a.c.order) || 0) - (Number(b.c.order) || 0);
        if (d) return d;
        const t = cmpText(cleanName(a.c.name), cleanName(b.c.name));
        if (t) return t;
        return a.i - b.i;
      });
      arr.forEach((x, idx) => {
        if (Number(x.c.order) !== idx) { x.c.order = idx; stats.orderFixed++; }
      });
    }

    /* 5. 重复笔记合并：同标题 + 同分类 + 正文几乎一样的两份，留最新那份，
       旧的那份软删进回收站（30 天后由维护任务清掉，期间随时可恢复）。 */
    const dd = dedupeNotes(notes);
    stats.notesMerged = dd.count;
    stats.mergedPairs = dd.pairs;

    /* 6. 标签归一（跨篇统一写法 + 篇内去重 + 去空）。合并后的并集也在这里理顺。 */
    stats.tagFixed = healTags(notes);
    return stats;
  }

  /* 纯筛选：给定云端分类、被笔记引用的 id、本地 id，算出「可以安全删掉」的重复项。
     规则只有三条：同父同名成组、组内留本地那份、被笔记引用的不动。
     这里判断错会删掉用户的分类，所以两端都用同一份实现，且可单测。 */
  function pickDuplicateCatIds(cloudCats, usedIds, localIds) {
    const catById = new Map((cloudCats || []).map((c) => [c.id, c]));
    const groups = new Map();
    (cloudCats || []).forEach((c) => {
      const pid = c.parentId && catById.has(c.parentId) ? c.parentId : null;
      const k = catKey(c.name, pid);
      const g = groups.get(k);
      if (g) g.push(c); else groups.set(k, [c]);
    });
    const kill = new Set();
    for (const list of groups.values()) {
      if (list.length < 2) continue;
      const keep = list.find((c) => localIds.has(c.id)) || list[0];
      list.forEach((c) => { if (c.id !== keep.id && !usedIds.has(c.id)) kill.add(c.id); });
    }
    if (!kill.size) return [];

    /* 删掉的分类如果还挂着子分类，子分类会变成「父 id 不存在」的孤儿，
       界面上直接消失。所以父被删时，无引用的后代跟着删掉。 */
    const children = new Map();
    (cloudCats || []).forEach((c) => {
      if (!c.parentId) return;
      const g = children.get(c.parentId);
      if (g) g.push(c); else children.set(c.parentId, [c]);
    });
    let grown = true;
    while (grown) {
      grown = false;
      for (const c of (cloudCats || [])) {
        if (kill.has(c.id) || !c.parentId || !kill.has(c.parentId)) continue;
        if (usedIds.has(c.id)) continue;
        kill.add(c.id);
        grown = true;
      }
    }

    /* 反过来：整棵子树里有任何一条被笔记引用，就不能删它的祖先 —— 否则
       云端笔记会指向不存在的分类，下次拉取全掉到「未分类」。宁可留脏行。 */
    const hasUsedDesc = (id, base, depth) => {
      if (depth > 32) return true;
      for (const k of (children.get(id) || [])) {
        if (k.id === base || usedIds.has(k.id)) return true;
        if (hasUsedDesc(k.id, base, depth + 1)) return true;
      }
      return false;
    };
    let shrunk = true;
    while (shrunk) {
      shrunk = false;
      for (const id of Array.from(kill)) {
        if (hasUsedDesc(id, id, 0)) { kill.delete(id); shrunk = true; }
      }
    }
    return Array.from(kill);
  }

  return {
    normName, cleanName, catKey, siblingOf, uniqueName,
    subtreeIds, mergeCats, dedupeCats, resolveId, remapAll, pickDuplicateCatIds,
    normTag, healTags, healIntegrity, dedupeNotes, plainText, diceSim,
  };
}));
