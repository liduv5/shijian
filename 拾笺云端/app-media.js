/* ============================================================
   拾笺 · 图片与 Markdown 渲染（按功能从 app.js 拆出）
   ------------------------------------------------------------
   这一块有独立的模块级状态（imgSizer / imgEl / imgIdx / imgMode），
   对外的依赖只有 $、$$、I、toast、onRichInput、exec 六个，
   所以在 app.js 顶部用工厂注入即可，调用点一行都不用改。

   两端各存一份：图片尺寸工具条在桌面和手机上不是同一套 UI，
   这属于平台差异，不进 sync-shared.js 的共享清单。
   ============================================================ */
window.SJAppMedia = function (ctx) {
  'use strict';
  const { $, $$, I, toast, onRichInput, exec } = ctx;

  function renderMarkdown(md) {
    let html = marked.parse(md || '');
    html = DOMPurify.sanitize(html, { ADD_ATTR: ['target', 'rel'] });
    return html;
  }
  /* mdconv.js 已在业务脚本之前加载（mobilesync.js 要用它转换云端旧行），
     这里复用同一套渲染入口，避免两处实现漂移。 */
  window.SJRenderMarkdown = renderMarkdown;

  function decorate(container) {
    container.querySelectorAll('pre').forEach((pre) => {
      const code = pre.querySelector('code');
      if (code && window.hljs) {
        try { hljs.highlightElement(code); } catch (_) {}
      }
      if (!pre.querySelector('.copy-code')) {
        const btn = document.createElement('button');
        btn.className = 'copy-code';
        btn.textContent = '复制';
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(code ? code.innerText : '').then(() => {
            btn.textContent = '已复制';
            setTimeout(() => (btn.textContent = '复制'), 1200);
          });
        });
        pre.appendChild(btn);
      }
    });
    container.querySelectorAll('a').forEach((a) => {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    });
    container.querySelectorAll('img').forEach((im, i) => { im.dataset.imgIdx = i; });
  }

  /* ---------------------------------------------------------- 图片尺寸
     两模式共用一条底部工具条：
       · 富文本：改 #richPane 内 img 的 style.width，随 onRichInput 落盘
       · Markdown：定位 md 源里第 N 个图片 token，把 ![](url) 换成
         <img src="url" style="width:50%">（marked 原样输出，DOMPurify 保留 style）
     宽度统一存 style.width，导出也能带上。 */
  let imgSizer = null, imgEl = null, imgIdx = -1, imgMode = '';

  function ensureImgSizer() {
    if (imgSizer) return imgSizer;
    const el = document.createElement('div');
    el.className = 'img-sizer hidden';
    el.innerHTML = `
      <span class="img-sizer-label">图片宽度</span>
      <button type="button" data-w="25">25%</button>
      <button type="button" data-w="50">50%</button>
      <button type="button" data-w="75">75%</button>
      <button type="button" data-w="100">100%</button>
      <button type="button" data-w="reset" class="is-ghost">原始</button>
      <button type="button" data-w="crop" class="is-ghost" title="裁剪图片">裁剪</button>
      <input type="range" min="10" max="100" step="5" value="100" aria-label="图片宽度">
      <span class="img-sizer-pct">100%</span>
      <button type="button" data-w="close" class="is-ghost is-close" aria-label="关闭">×</button>`;
    document.body.appendChild(el);
    imgSizer = el;

    const range = el.querySelector('input[type=range]');
    const pctText = el.querySelector('.img-sizer-pct');
    el.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-w]');
      if (!btn) return;
      const v = btn.dataset.w;
      if (v === 'close') return closeImgSizer();
      if (v === 'crop') return openImgCrop();
      if (v === 'reset') { applyImgWidth(null); range.value = 100; pctText.textContent = '100%'; return; }
      const n = parseInt(v, 10);
      range.value = n; pctText.textContent = n + '%';
      applyImgWidth(n);
    });
    range.addEventListener('input', () => {
      pctText.textContent = range.value + '%';
      liveImgWidth(parseInt(range.value, 10));
    });
    range.addEventListener('change', () => {
      applyImgWidth(parseInt(range.value, 10));
    });
    return el;
  }

  function readImgPct(img) {
    const w = img.style.width || img.getAttribute('width') || '';
    const pm = /([\d.]+)\s*%/.exec(w);
    if (pm) return Math.round(parseFloat(pm[1]));
    const px = /([\d.]+)\s*px/.exec(w);
    if (px) {
      const host = img.parentElement;
      const base = host ? host.clientWidth : 0;
      if (base) return Math.min(100, Math.max(10, Math.round(parseFloat(px[1]) / base * 100)));
    }
    return 100;
  }

  function liveImgWidth(pct) {
    if (!imgEl) return;
    imgEl.style.width = pct + '%';
  }

  function applyImgWidth(pct) {
    if (!imgEl) return;
    if (pct == null) {
      imgEl.style.removeProperty('width');
      imgEl.removeAttribute('width');
    } else {
      imgEl.style.width = pct + '%';
      imgEl.setAttribute('width', pct + '%');
    }
    if (imgMode === 'rich') {
      onRichInput();
    }
  }

  function openImgSizer(img, mode, idx) {
    ensureImgSizer();
    $$('img.sj-img-picked').forEach((x) => x.classList.remove('sj-img-picked'));
    imgEl = img;
    imgMode = mode;
    imgIdx = idx;
    img.classList.add('sj-img-picked');
    const pct = readImgPct(img);
    imgSizer.querySelector('input[type=range]').value = pct;
    imgSizer.querySelector('.img-sizer-pct').textContent = pct + '%';
    imgSizer.classList.remove('hidden');
  }

  function closeImgSizer() {
    if (imgSizer) imgSizer.classList.add('hidden');
    $$('img.sj-img-picked').forEach((x) => x.classList.remove('sj-img-picked'));
    imgEl = null; imgIdx = -1; imgMode = '';
  }

  /* ---------------------------------------------------------- 图片裁剪
     从宽度条的「裁剪」进入：拖选区 → canvas 重绘 → 新 data URL 替换 <img src>，
     再按当前模式落盘。选区坐标按「显示矩形」存，导出时乘 natural/display 换回原始像素；
     跨域图 fetch 不到就明确提示，绝不把污染画布导出成坏图。 */
  let cropUI = null, cropSt = null;
  const CROP_RATIOS = [
    { key: 'free', label: '自由', r: 0 },
    { key: 'origin', label: '原图', r: 0 },
    { key: '1', label: '1:1', r: 1 },
    { key: '43', label: '4:3', r: 4 / 3 },
    { key: '169', label: '16:9', r: 16 / 9 },
  ];

  function cropEnsureUI() {
    if (cropUI) return cropUI;
    const el = document.createElement('div');
    el.className = 'crop-ui hidden';
    el.innerHTML = `
      <div class="crop-mask"></div>
      <div class="crop-dialog">
        <div class="crop-head"><span>裁剪图片</span><button type="button" class="crop-x" data-act="cancel" aria-label="关闭">×</button></div>
        <div class="crop-stage"><img class="crop-img" alt=""><div class="crop-sel">
          <i class="crop-third crop-third-v" style="left:33.333%"></i><i class="crop-third crop-third-h" style="top:33.333%"></i>
          <i class="crop-third crop-third-v" style="left:66.666%"></i><i class="crop-third crop-third-h" style="top:66.666%"></i>
          <i class="crop-h" data-h="nw"></i><i class="crop-h" data-h="n"></i><i class="crop-h" data-h="ne"></i>
          <i class="crop-h" data-h="e"></i><i class="crop-h" data-h="se"></i><i class="crop-h" data-h="s"></i>
          <i class="crop-h" data-h="sw"></i><i class="crop-h" data-h="w"></i>
        </div></div>
        <div class="crop-bar">
          <div class="crop-ratios">${CROP_RATIOS.map((x) => `<button type="button" data-ratio="${x.key}"${x.key === 'free' ? ' class="on"' : ''}>${x.label}</button>`).join('')}</div>
          <span class="crop-size"></span>
        </div>
        <div class="crop-foot">
          <button type="button" data-act="reset">重置</button>
          <button type="button" data-act="cancel">取消</button>
          <button type="button" class="primary" data-act="done">完成</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    cropUI = el;

    /* 裁剪层内的点击不冒泡到 document —— 否则会触发「点空白关宽度条」，
       把 imgEl/imgMode 清空，完成时就没法按原模式落盘。 */
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const r = e.target.closest('[data-ratio]');
      if (r) { cropApplyRatio(r.dataset.ratio); return; }
      const a = e.target.closest('[data-act]');
      if (!a) return;
      if (a.dataset.act === 'cancel') cropClose();
      else if (a.dataset.act === 'reset') cropReset();
      else if (a.dataset.act === 'done') cropDone();
    });
    el.querySelector('.crop-mask').addEventListener('click', cropClose);
    const sel = el.querySelector('.crop-sel');
    sel.addEventListener('pointerdown', (e) => {
      if (!cropSt) return;
      const h = e.target.closest('.crop-h');
      cropSt.drag = { dir: h ? h.dataset.h : 'move', sx: e.clientX, sy: e.clientY, orig: { ...cropSt.sel } };
      try { sel.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
      e.stopPropagation();
    });
    sel.addEventListener('pointermove', (e) => {
      if (!cropSt || !cropSt.drag) return;
      cropDrag(e);
      e.preventDefault();
    });
    sel.addEventListener('pointerup', () => { if (cropSt) cropSt.drag = null; });
    sel.addEventListener('pointercancel', () => { if (cropSt) cropSt.drag = null; });
    document.addEventListener('keydown', (e) => {
      if (cropUI && !cropUI.classList.contains('hidden') && e.key === 'Escape') { e.stopPropagation(); cropClose(); }
    }, true);
    return el;
  }

  async function cropFetchDataUrl(src) {
    if (/^(data|blob):/i.test(src)) return src;
    try {
      const r = await fetch(src, { credentials: 'include' });
      if (!r.ok) return '';
      const b = await r.blob();
      return await new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result);
        fr.onerror = rej;
        fr.readAsDataURL(b);
      });
    } catch (_) { return ''; }
  }

  function cropClose() {
    if (cropUI) cropUI.classList.add('hidden');
    document.body.classList.remove('crop-open');
    cropSt = null;
  }

  function cropPaint() {
    if (!cropSt) return;
    const s = cropSt, el = cropUI.querySelector('.crop-sel');
    el.style.left = s.sel.x + 'px'; el.style.top = s.sel.y + 'px';
    el.style.width = s.sel.w + 'px'; el.style.height = s.sel.h + 'px';
    const f = s.nat.w / s.disp.w;
    cropUI.querySelector('.crop-size').textContent =
      Math.max(1, Math.round(s.sel.w * f)) + ' × ' + Math.max(1, Math.round(s.sel.h * f)) + ' px';
  }

  function cropClamp() {
    if (!cropSt) return;
    const d = cropSt.disp, s = cropSt.sel;
    s.w = Math.max(24, Math.min(d.w, s.w));
    s.h = Math.max(24, Math.min(d.h, s.h));
    s.x = Math.max(0, Math.min(d.w - s.w, s.x));
    s.y = Math.max(0, Math.min(d.h - s.h, s.y));
  }

  function cropRatioOf(key) {
    if (key === 'free') return 0;
    if (key === 'origin') return cropSt.nat.w / cropSt.nat.h || 0;
    const hit = CROP_RATIOS.find((x) => x.key === key);
    return hit ? hit.r : 0;
  }

  function cropApplyRatio(key) {
    if (!cropSt) return;
    cropSt.ratioKey = key;
    cropSt.ratio = cropRatioOf(key);
    cropUI.querySelectorAll('[data-ratio]').forEach((b) => b.classList.toggle('on', b.dataset.ratio === key));
    if (cropSt.ratio) {
      const c = { x: cropSt.sel.x + cropSt.sel.w / 2, y: cropSt.sel.y + cropSt.sel.h / 2 };
      let w = cropSt.sel.w, h = w / cropSt.ratio;
      if (h > cropSt.disp.h) { h = cropSt.disp.h; w = h * cropSt.ratio; }
      if (w > cropSt.disp.w) { w = cropSt.disp.w; h = w / cropSt.ratio; }
      cropSt.sel = { x: c.x - w / 2, y: c.y - h / 2, w, h };
      cropClamp();
    }
    cropPaint();
  }

  function cropReset() {
    if (!cropSt) return;
    const d = cropSt.disp;
    cropSt.sel = { x: d.w * 0.1, y: d.h * 0.1, w: d.w * 0.8, h: d.h * 0.8 };
    cropSt.ratio = 0; cropSt.ratioKey = 'free';
    cropUI.querySelectorAll('[data-ratio]').forEach((b) => b.classList.toggle('on', b.dataset.ratio === 'free'));
    cropPaint();
  }

  function cropDrag(e) {
    const t = cropSt.drag, o = t.orig, dir = t.dir;
    const dx = e.clientX - t.sx, dy = e.clientY - t.sy;
    let { x, y, w, h } = o;
    const min = 24;
    if (dir === 'move') {
      x = o.x + dx; y = o.y + dy;
    } else {
      if (dir.includes('w')) { x = o.x + dx; w = o.w - dx; }
      if (dir.includes('e')) { w = o.w + dx; }
      if (dir.includes('n')) { y = o.y + dy; h = o.h - dy; }
      if (dir.includes('s')) { h = o.h + dy; }
      if (w < min) { if (dir.includes('w')) x = o.x + o.w - min; w = min; }
      if (h < min) { if (dir.includes('n')) y = o.y + o.h - min; h = min; }
      if (cropSt.ratio) {
        if (dir.length === 2) {
          h = w / cropSt.ratio;
          if (dir.includes('n')) y = o.y + o.h - h;
        } else if (dir === 'e' || dir === 'w') {
          const cy = o.y + o.h / 2; h = w / cropSt.ratio; y = cy - h / 2;
        } else {
          const cx = o.x + o.w / 2; w = h * cropSt.ratio; x = cx - w / 2;
        }
      }
    }
    cropSt.sel = { x, y, w, h };
    cropClamp(); cropPaint();
  }

  function cropDone() {
    if (!cropSt) return;
    try {
      const s = cropSt, f = s.nat.w / s.disp.w;
      const sx = s.sel.x * f, sy = s.sel.y * f, sw = s.sel.w * f, sh = s.sel.h * f;
      const cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.round(sw)); cv.height = Math.max(1, Math.round(sh));
      const ctx = cv.getContext('2d');
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(s.img, sx, sy, sw, sh, 0, 0, cv.width, cv.height);
      const keepPng = /^data:image\/(png|webp)/i.test(s.src);
      const out = cv.toDataURL(keepPng ? 'image/png' : 'image/jpeg', 0.92);
      const target = s.target;
      target.src = out;
      if (s.mode === 'rich') onRichInput();
      cropClose();
      closeImgSizer();
      toast('图片已裁剪');
    } catch (err) {
      cropClose();
      toast('裁剪失败：' + (err && err.message ? err.message : '这张图不允许裁剪'));
    }
  }

  async function openImgCrop() {
    if (!imgEl) return;
    const src = imgEl.currentSrc || imgEl.src || imgEl.getAttribute('src') || '';
    if (!src) { toast('这张图还没有可用的地址'); return; }
    const ui = cropEnsureUI();
    cropClose();
    ui.classList.remove('hidden');
    document.body.classList.add('crop-open');
    const img = ui.querySelector('.crop-img');
    const usable = await cropFetchDataUrl(src);
    if (!usable && !/^(data|blob):/i.test(src)) {
      cropClose();
      toast('这张图来自外部站点，无法裁剪（可先下载到本地再插入）');
      return;
    }
    const finalSrc = usable || src;
    await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; img.src = finalSrc; });
    if (!img.naturalWidth) { cropClose(); toast('图片加载失败，无法裁剪'); return; }
    const dw = img.clientWidth || img.naturalWidth, dh = img.clientHeight || img.naturalHeight;
    cropSt = {
      target: imgEl, mode: imgMode, src: finalSrc, img,
      nat: { w: img.naturalWidth, h: img.naturalHeight },
      disp: { w: dw, h: dh }, sel: { x: dw * 0.1, y: dh * 0.1, w: dw * 0.8, h: dh * 0.8 },
      ratio: 0, ratioKey: 'free', drag: null,
    };
    ui.querySelectorAll('[data-ratio]').forEach((b) => b.classList.toggle('on', b.dataset.ratio === 'free'));
    cropPaint();
  }

  function bindImgResize(container, mode) {
    if (!container) return;
    container.addEventListener('click', (e) => {
      /* 手机端走详情页自己的图片操作条（上移/下移/删除），不开桌面这条宽度条；
         这里直接放行，别 stopPropagation，否则点正文进编辑会被它吃掉。 */
      if (NARROW()) return;
      const img = e.target.closest ? e.target.closest('img') : null;
      if (!img || !container.contains(img)) return;
      e.preventDefault();
      e.stopPropagation();
      const idx = mode === 'md'
        ? Array.prototype.indexOf.call(container.querySelectorAll('img'), img)
        : parseInt(img.dataset.imgIdx || '0', 10);
      openImgSizer(img, mode, idx);
    });
  }

  return { renderMarkdown, decorate, ensureImgSizer, readImgPct, liveImgWidth, applyImgWidth, openImgSizer, closeImgSizer, cropEnsureUI, cropFetchDataUrl, cropClose, cropPaint, cropClamp, cropRatioOf, cropApplyRatio, cropReset, cropDrag, cropDone, openImgCrop, bindImgResize };
};
