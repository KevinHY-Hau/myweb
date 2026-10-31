/* KIT.input: keyboard table, swipe, and the test hook. */
(function () {
  KIT.input = {
    /* keys({ArrowLeft:0, a:0}, v => move(v))  - one table, arrows and WASD share code. Ignores Ctrl/Cmd/Alt combos. */
    keys(table, fn) {
      window.addEventListener('keydown', e => { if (e.ctrlKey || e.metaKey || e.altKey) return; const k = e.key in table ? e.key : e.key.toLowerCase();
        if (k in table) { e.preventDefault(); fn(table[k], e); } });
    },
    /* swipe(el, dir => ..., 24) - dir: 0 left, 1 up, 2 right, 3 down. Add CSS touch-action:none to el. */
    swipe(el, fn, min) {
      let sx = 0, sy = 0, down = false; min = min || 24;
      el.addEventListener('pointerdown', e => { down = true; sx = e.clientX; sy = e.clientY; });
      window.addEventListener('pointerup', e => { if (!down) return; down = false; const dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < min) return; fn(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 0 : 2) : (dy < 0 ? 1 : 3)); });
      el.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
    },
    /* pointer(el, {down(p,e), move(p,e), up(p,e)}) with positions in element pixels (or pass canvas helper C.pos) */
    pointer(el, h, toPos) {
      toPos = toPos || (e => { const r = el.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; });
      el.addEventListener('pointerdown', e => h.down && h.down(toPos(e), e));
      el.addEventListener('pointermove', e => h.move && h.move(toPos(e), e));
      window.addEventListener('pointerup', e => h.up && h.up(toPos(e), e));
    }
  };
  /* test hook: KIT.hook({move, newGame, get score(){...}}) -> window.__g  (bots and Playwright use this) */
  KIT.hook = obj => { window.__g = obj; return obj; };
})();
