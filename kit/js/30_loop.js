/* KIT.loop: requestAnimationFrame loop with a capped time step and auto-pause when the tab is hidden.
   const L = KIT.loop((dt, t) => update(dt), dt => draw());  L.start();  L.paused = true; */
(function () {
  KIT.loop = function (update, draw, maxDt) {
    maxDt = maxDt || 0.05; let last = 0, raf = 0, t = 0;
    const L = { paused: false, running: false,
      start() { if (L.running) return; L.running = true; last = performance.now(); raf = requestAnimationFrame(tick); },
      stop() { L.running = false; cancelAnimationFrame(raf); } };
    function tick(now) {
      if (!L.running) return;
      const dt = Math.min(maxDt, (now - last) / 1000); last = now;
      if (!L.paused) { t += dt; update && update(dt, t); }
      draw && draw(dt, t);
      raf = requestAnimationFrame(tick);
    }
    document.addEventListener('visibilitychange', () => { if (document.hidden) { L.paused = true; L.onHide && L.onHide(); } else last = performance.now(); });
    return L;
  };
})();
