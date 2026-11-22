/* ============================================================
   拾笺 · 导出模块（Word / PDF / Markdown）
   ============================================================ */
(() => {
  'use strict';

  const D = window.docx || {};
  const MONO = 'Consolas';
  const BODY_FONT = 'Microsoft YaHei';

  /* ---------------------------------------------- 工具 */
  function safeName(name, ext) {
    const base = (name || '无标题笔记').replace(/[\\/:*?"<>|]/g, '_').slice(0, 60);
    return `${base}.${ext}`;
  }

  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  /* ---------------------------------------------- 存文件：先问位置
     用户 2026-11-22 提：导出备份一点就静默落到下载目录，找不到存哪儿了。
     改成先弹系统的「另存为」。
     注意顺序：showSaveFilePicker 必须落在用户点下去那一下的调用栈里，
     等 fetch 回来再问，浏览器会以 NotAllowedError 拒掉。所以拆成两步——
     pickSaveHandle() 先要位置，writeHandle() 再灌数据。
     不支持这套 API 的浏览器（Firefox / Safari）和 Electron 返回 null，
     调用方退回 <a download>（Electron 自己会弹保存框）。 */
  function pickSaveHandle(filename, opts = {}) {
    if (typeof window.showSaveFilePicker !== 'function') return Promise.resolve(null);
    return window.showSaveFilePicker({
      suggestedName: filename,
      types: opts.types || undefined,
    }).catch((e) => {
      if (e && e.name === 'AbortError') return 'canceled';   // 用户点了取消
      return null;                                          // 没手势 / 不支持 → 走老路
    });
  }

  async function writeHandle(handle, blob) {
    const w = await handle.createWritable();
    await w.write(blob);
    await w.close();
  }

  /* 桌面版（Electron）没有 showSaveFilePicker，走主进程的 dialog.showSaveDialog。
     这条通道没有「必须在点击手势里」的限制，所以可以先取数据再弹框。 */
  async function saveViaDesktop(blob, filename) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const r = await window.SJDesktop.saveFile(filename, bytes);
    if (r === 'canceled') return 'canceled';
    if (r === 'saved') return 'saved';
    throw new Error(String(r || '保存失败').replace(/^error:/, ''));
  }

  /* 数据已经在手上时的一步式入口（加密备份用；桌面版直接弹系统框） */
  async function saveBlob(blob, filename, opts = {}) {
    if (window.SJDesktop && typeof window.SJDesktop.saveFile === 'function') {
      return saveViaDesktop(blob, filename);
    }
    const handle = await pickSaveHandle(filename, opts);
    if (handle === 'canceled') return 'canceled';
    if (handle) {
      await writeHandle(handle, blob);
      return 'saved';
    }
    download(blob, filename);
    return 'fallback';
  }

  function metaLine(tags, updatedAt) {
    const d = new Date(updatedAt || Date.now());
    const p = (n) => String(n).padStart(2, '0');
    const time = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
    return [time, tags && tags.length ? `标签：${tags.join(' / ')}` : ''].filter(Boolean).join('　·　');
  }

  /* ---------------------------------------------- 图片预处理 */
  /* data: URL 不能用 fetch 取 —— Chrome 直接抛 "TypeError: Failed to fetch"，
     粘贴进来的图（正文里就是 data:image/png;base64,…）会全部变成「［图片］」
     占位文字。所以自己按 base64 解；附件图（/api/files/…）和 blob: 仍走 fetch。 */
  function dataUrlToBytes(src) {
    const m = /^data:([^;,]*)(;base64)?,([\s\S]*)$/i.exec(src);
    if (!m) return null;
    if (!m[2]) {
      try { return new TextEncoder().encode(decodeURIComponent(m[3])); } catch (_) { return null; }
    }
    let b64 = m[3].replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    try {
      const bin = atob(b64);
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    } catch (_) {
      return null;
    }
  }

  function imageSize(src) {
    return new Promise((resolve) => {
      const probe = new Image();
      probe.onload = () => resolve({ w: probe.naturalWidth || 420, h: probe.naturalHeight || 280 });
      probe.onerror = () => resolve({ w: 420, h: 280 });
      probe.src = src;
    });
  }

  async function prepareImages(root) {
    const imgs = Array.from(root.querySelectorAll('img'));
    for (const img of imgs) {
      try {
        /* currentSrc 优先：srcset / 懒加载换过图的元素，src 属性可能还是占位 */
        const src = img.currentSrc || img.getAttribute('src');
        if (!src) continue;
        let bytes = null;
        if (/^data:/i.test(src)) {
          bytes = dataUrlToBytes(src);
        } else {
          const res = await fetch(src);
          if (res.ok) bytes = new Uint8Array(await res.arrayBuffer());
        }
        if (!bytes || !bytes.length) continue;
        const dim = await imageSize(src);
        img.__docx = { data: bytes, w: dim.w, h: dim.h };
      } catch (e) {
        img.__docx = null;
      }
    }
  }

  function stripLeadingTitle(html, title) {
    const box = document.createElement('div');
    box.innerHTML = html || '';
    const first = box.firstElementChild;
    if (first && first.tagName === 'H1' && first.textContent.trim() === String(title || '').trim()) {
      first.remove();
    }
    return box;
  }

  /* ---------------------------------------------- HTML → docx 元素 */
  function inlineRuns(node, style = {}) {
    const runs = [];
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === 3) {
        const text = child.textContent.replace(/\s+/g, ' ');
        if (text) runs.push(new D.TextRun({ text, ...style }));
        return;
      }
      if (child.nodeType !== 1) return;
      const tag = child.tagName;
      if (tag === 'BR') {
        runs.push(new D.TextRun({ break: 1 }));
      } else if (tag === 'STRONG' || tag === 'B') {
        runs.push(...inlineRuns(child, { ...style, bold: true }));
      } else if (tag === 'EM' || tag === 'I') {
        runs.push(...inlineRuns(child, { ...style, italics: true }));
      } else if (tag === 'U') {
        runs.push(...inlineRuns(child, { ...style, underline: {} }));
      } else if (tag === 'S' || tag === 'DEL' || tag === 'STRIKE') {
        runs.push(...inlineRuns(child, { ...style, strike: true }));
      } else if (tag === 'CODE') {
        runs.push(new D.TextRun({
          text: child.textContent,
          font: MONO,
          size: 19,
          color: '8A4B2A',
          ...style,
          ...(style.bold ? { bold: true } : {}),
        }));
      } else if (tag === 'A') {
        runs.push(...inlineRuns(child, { ...style, color: '2F6F5E', underline: {} }));
      } else if (tag === 'IMG') {
        runs.push(new D.TextRun({ text: `［图片：${child.getAttribute('alt') || '未命名'}］`, color: '888888', ...style }));
      } else {
        runs.push(...inlineRuns(child, style));
      }
    });
    return runs.length ? runs : [new D.TextRun({ text: '', ...style })];
  }

  function paragraphFrom(el, extra = {}) {
    return new D.Paragraph({
      spacing: { after: 120, line: 320 },
      ...extra,
      children: inlineRuns(el),
    });
  }

  /* 图片实际显示宽度占比：优先 style.width 百分比，其次 px 折算，默认整幅。
     正文里点图调过宽度后，导出的 Word 才能跟着变窄。 */
  function imgWidthFactor(img) {
    const raw = (img.style && img.style.width) || img.getAttribute('width') || '';
    const pm = /([\d.]+)\s*%/.exec(raw);
    if (pm) return Math.min(1, Math.max(0.1, parseFloat(pm[1]) / 100));
    const px = /([\d.]+)\s*px/.exec(raw);
    if (px) {
      const host = img.parentElement;
      const base = host ? host.clientWidth : 0;
      if (base > 0) return Math.min(1, Math.max(0.1, parseFloat(px[1]) / base));
    }
    return 1;
  }

  function imageParagraph(img) {
    const info = img.__docx;
    if (!info) {
      return new D.Paragraph({
        children: [new D.TextRun({ text: `［图片：${img.getAttribute('alt') || '未能加载'}］`, color: '999999' })],
      });
    }
    const maxW = 460;
    const target = maxW * imgWidthFactor(img);
    const scale = Math.min(1, target / info.w);
    const width = Math.round(info.w * scale);
    const height = Math.round(info.h * scale);
    return new D.Paragraph({
      alignment: D.AlignmentType.CENTER,
      spacing: { before: 120, after: 160 },
      children: [new D.ImageRun({ data: info.data, transformation: { width, height } })],
    });
  }

  function tableFrom(el) {
    const rows = Array.from(el.querySelectorAll('tr'));
    if (!rows.length) return [];
    const docRows = rows.map((tr) => {
      const cells = Array.from(tr.children).filter((c) => c.tagName === 'TH' || c.tagName === 'TD');
      const isHead = tr.parentElement.tagName === 'THEAD' || cells.every((c) => c.tagName === 'TH');
      return new D.TableRow({
        tableHeader: isHead,
        children: cells.map((cell) => new D.TableCell({
          shading: isHead ? { type: D.ShadingType.CLEAR, color: 'auto', fill: 'F2F1EC' } : undefined,
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [new D.Paragraph({
            spacing: { after: 0, line: 280 },
            children: inlineRuns(cell, isHead ? { bold: true } : {}),
          })],
        })),
      });
    });
    return [new D.Table({
      width: { size: 100, type: D.WidthType.PERCENTAGE },
      borders: {
        top: { style: D.BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
        bottom: { style: D.BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
        left: { style: D.BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
        right: { style: D.BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
        insideHorizontal: { style: D.BorderStyle.SINGLE, size: 4, color: 'DDDDDD' },
        insideVertical: { style: D.BorderStyle.SINGLE, size: 4, color: 'DDDDDD' },
      },
      rows: docRows,
    })];
  }

  const HEADINGS = {
    H1: D.HeadingLevel ? D.HeadingLevel.HEADING_1 : 'Heading1',
    H2: D.HeadingLevel ? D.HeadingLevel.HEADING_2 : 'Heading2',
    H3: D.HeadingLevel ? D.HeadingLevel.HEADING_3 : 'Heading3',
    H4: D.HeadingLevel ? D.HeadingLevel.HEADING_4 : 'Heading4',
  };

  function blocksFrom(el, depth = 0) {
    const out = [];
    Array.from(el.children).forEach((child) => {
      const tag = child.tagName;
      if (HEADINGS[tag]) {
        out.push(new D.Paragraph({
          heading: HEADINGS[tag],
          spacing: { before: 260, after: 120 },
          children: inlineRuns(child),
        }));
      } else if (tag === 'P') {
        const imgs = Array.from(child.querySelectorAll('img'));
        if (imgs.length) {
          const textOnly = child.cloneNode(true);
          textOnly.querySelectorAll('img').forEach((i) => i.remove());
          if (textOnly.textContent.trim()) out.push(paragraphFrom(textOnly));
          imgs.forEach((img) => out.push(imageParagraph(img)));
        } else {
          out.push(paragraphFrom(child));
        }
      } else if (tag === 'UL' || tag === 'OL') {
        Array.from(child.children).forEach((li, idx) => {
          const checkbox = li.querySelector('input[type="checkbox"]');
          let prefix = tag === 'OL' ? `${idx + 1}.  ` : '•  ';
          if (checkbox) prefix = checkbox.checked ? '☑  ' : '☐  ';
          out.push(new D.Paragraph({
            spacing: { after: 60, line: 320 },
            indent: { left: 420, hanging: 220 },
            children: [new D.TextRun({ text: prefix }), ...inlineRuns(li)],
          }));
        });
      } else if (tag === 'BLOCKQUOTE') {
        out.push(new D.Paragraph({
          spacing: { before: 120, after: 140, line: 320 },
          indent: { left: 400 },
          border: { left: { style: D.BorderStyle.SINGLE, size: 12, color: '2F6F5E', space: 10 } },
          children: inlineRuns(child, { italics: true, color: '4A4A4A' }),
        }));
      } else if (tag === 'PRE') {
        const code = child.querySelector('code') || child;
        const text = code.innerText.replace(/\n+$/, '');
        const lines = text.split('\n');
        const runs = [];
        lines.forEach((line, i) => {
          runs.push(new D.TextRun({
            text: line,
            font: MONO,
            size: 18,
            color: '333333',
            break: i === 0 ? 0 : 1,
          }));
        });
        out.push(new D.Paragraph({
          spacing: { before: 120, after: 160, line: 260 },
          shading: { type: D.ShadingType.CLEAR, color: 'auto', fill: 'F5F5F3' },
          border: {
            top: { style: D.BorderStyle.SINGLE, size: 4, color: 'E6E3DA' },
            bottom: { style: D.BorderStyle.SINGLE, size: 4, color: 'E6E3DA' },
            left: { style: D.BorderStyle.SINGLE, size: 4, color: 'E6E3DA' },
            right: { style: D.BorderStyle.SINGLE, size: 4, color: 'E6E3DA' },
          },
          children: runs.length ? runs : [new D.TextRun({ text: '' })],
        }));
      } else if (tag === 'TABLE') {
        out.push(...tableFrom(child));
        out.push(new D.Paragraph({ spacing: { after: 120 }, children: [new D.TextRun({ text: '' })] }));
      } else if (tag === 'HR') {
        out.push(new D.Paragraph({
          spacing: { before: 160, after: 160 },
          border: { bottom: { style: D.BorderStyle.SINGLE, size: 6, color: 'DDDDDD', space: 1 } },
          children: [new D.TextRun({ text: '' })],
        }));
      } else if (tag === 'IMG') {
        out.push(imageParagraph(child));
      } else if (tag === 'DIV' || tag === 'SECTION' || tag === 'ARTICLE') {
        const hasBlockChild = Array.from(child.children).some((c) =>
          ['P', 'DIV', 'UL', 'OL', 'PRE', 'TABLE', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4'].includes(c.tagName));
        if (hasBlockChild) {
          out.push(...blocksFrom(child, depth + 1));
        } else {
          /* 这里原来只判断「有没有文字」，于是 <div><img></div>（粘贴图片后
             编辑器给出的常见结构）会走 paragraphFrom —— 而 inlineRuns 遇到
             IMG 只吐一行「［图片：…］」占位文字，图片就丢了。现在和 <p>
             一样拆成「文字段 + 图片段」。 */
          const imgs = Array.from(child.querySelectorAll('img'));
          const textOnly = child.cloneNode(true);
          textOnly.querySelectorAll('img').forEach((i) => i.remove());
          if (textOnly.textContent.trim()) out.push(paragraphFrom(textOnly));
          imgs.forEach((img) => out.push(imageParagraph(img)));
        }
      } else if (tag === 'FIGURE') {
        out.push(...blocksFrom(child, depth + 1));
      } else if (child.textContent.trim()) {
        out.push(paragraphFrom(child));
      }
    });
    return out;
  }

  /* ---------------------------------------------- Word */
  async function toWord({ title, html, tags, updatedAt }) {
    if (!D.Document || !window.docx.Packer) {
      throw new Error('Word 导出组件未加载');
    }
    const box = stripLeadingTitle(html, title);
    box.className = 'markdown-body';
    await prepareImages(box);

    const children = [];
    children.push(new D.Paragraph({
      spacing: { after: 60 },
      children: [new D.TextRun({ text: title || '无标题笔记', bold: true, size: 36, font: BODY_FONT })],
    }));
    children.push(new D.Paragraph({
      spacing: { after: 260 },
      children: [new D.TextRun({ text: metaLine(tags, updatedAt), color: '8A8A8A', size: 18 })],
    }));
    children.push(...blocksFrom(box));

    const doc = new D.Document({
      styles: {
        default: {
          document: {
            run: { font: BODY_FONT, size: 22, color: '222222' },
            paragraph: { spacing: { line: 320 } },
          },
        },
      },
      sections: [{
        properties: {
          page: {
            margin: { top: 1440, right: 1300, bottom: 1440, left: 1300 },
          },
        },
        children: children.length ? children : [new D.Paragraph({ children: [new D.TextRun({ text: '（空笔记）' })] })],
      }],
    });

    const blob = await D.Packer.toBlob(doc);
    download(blob, safeName(title, 'docx'));
  }

  /* ---------------------------------------------- PDF */
  function toPdf({ title, html, tags, updatedAt }) {
    const area = document.getElementById('printArea');
    const oldTitle = document.title;
    document.title = title || '无标题笔记';
    area.innerHTML = `
      <div class="print-head">
        <h1>${escapeHtml(title || '无标题笔记')}</h1>
        <div class="print-meta">${escapeHtml(metaLine(tags, updatedAt))}</div>
      </div>
      <div class="markdown-body">${stripLeadingTitle(html, title).innerHTML}</div>
      <div class="print-foot">拾笺</div>`;
    document.body.classList.add('printing');
    const cleanup = () => {
      document.body.classList.remove('printing');
      document.title = oldTitle;
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => window.print(), 60);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* ---------------------------------------------- Markdown */
  /* Markdown 导出：正文如果还是 HTML（富文本笔记直传的情况），
     先转成 Markdown 源码，别把标签原样写进 .md 文件。 */
  function toMarkdown({ title, content }) {
    let body = content || '';
    if (/<[a-z][\s\S]*>/i.test(body) && typeof window.TurndownService === 'function') {
      try {
        const t = new window.TurndownService();
        body = t.turndown(body);
      } catch (_) { /* 转不了就按原样导出 */ }
    }
    const md = `# ${title || '无标题笔记'}\n\n${body}`;
    download(new Blob([md], { type: 'text/markdown;charset=utf-8' }), safeName(title, 'md'));
  }

  window.NoteExport = {
    toWord, toPdf, toMarkdown, metaLine,
    /* 备份这类「整库落在磁盘上」的动作要自己问位置，见上面注释 */
    pickSaveHandle, writeHandle, saveBlob, saveViaDesktop,
  };
})();
