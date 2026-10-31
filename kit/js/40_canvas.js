/* KIT.canvas: fixed logical size on any screen + sharp on retina. KIT.cache: paint once, draw many times. */
(function () {
  /* const C = KIT.canvas(el, 960, 540);  C.ctx draws in 960x540 units whatever the real size is. Call C.fit() on resize. */
  KIT.canvas = function (cv, W, H, maxDpr) {
    const ctx = cv.getContext('2d'), C = { ctx, W, H, dpr: 1, fit };
    function fit() {
      const r = cv.getBoundingClientRect(); C.dpr = Math.min(maxDpr || 2, window.devicePixelRatio || 1);
      cv.width = Math.round(r.width * C.dpr); cv.height = Math.round(r.height * C.dpr);
      ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
    }
    fit(); window.addEventListener('resize', fit);
    /* convert a pointer event to logical coordinates */
    C.pos = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; };
    return C;
  };
  /* const bg = KIT.cache(960, 540, ctx => paintBackground(ctx));  then ctx.drawImage(bg, 0, 0) each frame */
  KIT.cache = function (w, h, paint) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h); return c;
  };
})();
