/* k-Bit Recurrence Model: three small animations (p5.js, instance mode so it never clashes with circles.js).
   IMPORTANT: the numbers are ILLUSTRATIVE. The one place that says "how likely is the next bit to be 1,
   given the last k bits" is the function P1() below. Replace its body with the real rule of the model. */
(function () {
  var S = { scene: 0, k: 3, steps: 8, stick: 0.6, playing: true };
  var BG = [13, 17, 23], FG = [230, 237, 243], ACC = [245, 158, 11], ACC2 = [251, 191, 36], MUT = [139, 152, 169], BLUE = [96, 165, 250];

  function ones(s) { var c = 0; while (s) { c += s & 1; s >>= 1; } return c; }
  // ---- the model rule (illustrative): more recent 1s in the window => next 1 more likely, "stick" = strength of memory
  function P1(s, k) {
    var v = 0.4 + S.stick * 1.2 * (ones(s) / k - 0.5);
    return Math.max(0.03, Math.min(0.97, v));
  }
  function bin(s, k) { var t = s.toString(2); while (t.length < k) t = '0' + t; return t; }

  // expected population in every state, step by step (expected-value propagation)
  function forward() {
    var k = S.k, n = 1 << k, N = 1000, d = [], ev = [], cur = [], i, t;
    for (i = 0; i < n; i++) cur.push(N / n);
    for (t = 0; t <= S.steps; t++) {
      d.push(cur.slice()); var e = 0, nxt = []; for (i = 0; i < n; i++) nxt.push(0);
      for (i = 0; i < n; i++) {
        var p = P1(i, k); e += cur[i] * p;
        nxt[((i << 1) | 1) & (n - 1)] += cur[i] * p;
        nxt[(i << 1) & (n - 1)] += cur[i] * (1 - p);
      }
      ev.push(e); cur = nxt;
    }
    return { d: d, ev: ev };
  }


  // grid[t][j] = chance of j payments after t steps (all histories that end there are ADDED together)
  // f0/f1 = how much probability flows along the "no payment"/"payment" edge out of node (t,j)
  var G_key = '', G = null;
  function grid() {
    var key = [S.k, S.steps, S.stick].join(); if (key === G_key) return G;
    var k = S.k, n = 1 << k, T = S.steps, P = [], f0 = [], f1 = [], t, s, j, m = [];
    for (s = 0; s < n; s++) { m.push([]); for (j = 0; j <= T + 1; j++) m[s].push(0); m[s][0] = 1 / n; }
    for (t = 0; t <= T; t++) {
      var row = [], r0 = [], r1 = [], nm = [];
      for (s = 0; s < n; s++) { nm.push([]); for (j = 0; j <= T + 1; j++) nm[s].push(0); }
      for (j = 0; j <= t; j++) {
        var tot = 0, a0 = 0, a1 = 0;
        for (s = 0; s < n; s++) {
          var mass = m[s][j]; if (!mass) continue; tot += mass;
          var p = P1(s, k); a1 += mass * p; a0 += mass * (1 - p);
          nm[((s << 1) | 1) & (n - 1)][j + 1] += mass * p; nm[(s << 1) & (n - 1)][j] += mass * (1 - p);
        }
        row.push(tot); r0.push(a0); r1.push(a1);
      }
      P.push(row); f0.push(r0); f1.push(r1); m = nm;
    }
    G_key = key; G = { P: P, f0: f0, f1: f1 }; return G;
  }
  function binom(n, r) { var c = 1; for (var i = 1; i <= r; i++) c = c * (n - r + i) / i; return c; }

  var sketch = function (p) {
    var box, hist = [], lastTick = 0, shift = 0, sceneStart = 0, F = null, fKey = '';
    function W() { return p.width; }
    p.setup = function () {
      box = document.getElementById('kbrm-canvas');
      var c = p.createCanvas(Math.min(box.clientWidth || 640, 700), 380); c.parent(box);
      p.textFont('Segoe UI, Inter, sans-serif'); resetMemory(); sceneStart = p.millis();
    };
    p.windowResized = function () { p.resizeCanvas(Math.min(box.clientWidth || 640, 700), 380); };
    function resetMemory() { hist = []; for (var i = 0; i < 14; i++) hist.push(Math.random() < 0.5 ? 1 : 0); lastTick = p.millis(); shift = 0; }
    window.KBRM = { set: function (o) { for (var q in o) S[q] = o[q]; resetMemory(); sceneStart = p.millis(); F = null; },
                    restart: function () { resetMemory(); sceneStart = p.millis(); }, S: S };
    function col(c, a) { p.fill(c[0], c[1], c[2], a === undefined ? 255 : a); }
    function stk(c, a, w) { p.stroke(c[0], c[1], c[2], a === undefined ? 255 : a); p.strokeWeight(w || 1); }
    function ease(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }

    p.draw = function () {
      p.clear();
      var now = S.playing ? p.millis() : (S._frozen = S._frozen || p.millis());
      if (S.playing) S._frozen = 0;
      [tree, combine, memory, forwardScene][S.scene](now);
    };

    // ---------- scene 0: tree that remembers ----------
    function tree(now) {
      var L = Math.min(S.steps, 5), k = S.k, w = W(), top = 40, gap = (p.height - 110) / L;
      var T = (now - sceneStart) % (L * 700 + 3500), shown = T / 700;
      p.textAlign(p.CENTER, p.CENTER); p.noStroke(); col(MUT); p.textSize(13);
      p.text('Every branch is a 0 or a 1. Thicker line = more likely. The odds depend on the last ' + k + ' bits.', w / 2, 14);
      (function walk(lvl, idx, st, prob, px, py) {
        if (lvl >= L) { return; }
        var n = 1 << (lvl + 1);
        for (var b = 0; b <= 1; b++) {
          var ci = idx * 2 + b, cx = w * (ci + 0.5) / n, cy = top + (lvl + 1) * gap;
          var pr1 = P1(st & ((1 << k) - 1), k), pb = b ? pr1 : 1 - pr1;
          var vis = ease(shown - lvl);
          if (vis <= 0) continue;
          var ex = px + (cx - px) * vis, ey = py + (cy - py) * vis;
          stk(b ? ACC : BLUE, 200, 1 + pb * 5); p.line(px, py, ex, ey);
          if (vis >= 1) {
            var np = prob * pb;
            if (lvl + 1 === L) {
              p.noStroke(); col(b ? ACC : BLUE, 230); p.circle(cx, cy, 4 + Math.sqrt(np) * 18);
              if (L <= 4) { col(FG); p.textSize(11); p.text((np * 100).toFixed(1) + '%', cx, cy + 16 + Math.sqrt(np) * 10); }
            } else { p.noStroke(); col(FG, 200); p.circle(cx, cy, 8); }
            if (L <= 4) { p.noStroke(); col(b ? ACC2 : BLUE); p.textSize(11); p.text(b, (px + cx) / 2 + (b ? 9 : -9), (py + cy) / 2 - 4); }
            walk(lvl + 1, ci, ((st << 1) | b), np, cx, cy);
          }
        }
      })(0, 0, 0, 1, w / 2, top);
      p.noStroke(); col(FG); p.circle(w / 2, top, 12);
      col(MUT); p.textSize(12); p.text('Circle size = chance of that exact 0/1 history.', w / 2, p.height - 34);
      p.text('Memory strength 0 = plain binomial tree (same pattern everywhere).', w / 2, p.height - 16);
    }


    // ---------- scene 1: left to right, paths merge into (step, payments) ----------
    function combine(now) {
      var g = grid(), w = W(), n = S.steps, H = p.height, left = 46, right = 24, top = 46, by = H - 78;
      var cg = (w - left - right) / n, rg = (by - top) / n, maxR = Math.min(cg, rg) * 0.45;
      var T = (now - sceneStart) % (n * 800 + 400 + (n + 1) * 1300), shown = T / 800, hl = -1;
      if (T > n * 800 + 400) hl = Math.floor((T - n * 800 - 400) / 1300) % (n + 1);
      var X = function (t) { return left + t * cg; }, Y = function (j) { return by - j * rg; };
      p.textAlign(p.CENTER, p.CENTER); p.noStroke(); col(MUT); p.textSize(12.5);
      p.text('Read left to right. Across = steps. Up = payments so far. Paths that land on the same spot are added together.', w / 2, 16);
      p.textSize(11); p.text('step →', w - 28, by + 24); p.text('payments ↑', 30, top - 14);
      var t, j, mx;
      for (t = 0; t <= n; t++) { col(MUT, t <= shown ? 255 : 80); p.text(t, X(t), by + 24); }
      for (j = 0; j <= n; j++) { col(MUT, 150); p.text(j, 18, Y(j)); }
      var last = hl >= 0;
      for (t = 0; t < n; t++) {
        var prog = ease(shown - t); if (prog <= 0) continue;
        for (j = 0; j <= t; j++) {
          var x0 = X(t), y0 = Y(j), mxFlow = 0.0001; for (var q = 0; q <= n; q++) mxFlow = Math.max(mxFlow, g.f0[t][q] || 0, g.f1[t][q] || 0);
          [[0, g.f0[t][j], BLUE], [1, g.f1[t][j], ACC]].forEach(function (e) {
            var x1 = X(t + 1), y1 = Y(j + e[0]);
            stk(e[2], last ? 90 : 200, 0.8 + Math.sqrt(e[1] / mxFlow) * 6);
            p.line(x0, y0, x0 + (x1 - x0) * prog, y0 + (y1 - y0) * prog); p.noStroke();
            if (prog < 1 && prog > 0.02) { col(e[2], 255); p.circle(x0 + (x1 - x0) * prog, y0 + (y1 - y0) * prog, 5); }
          });
        }
      }
      for (t = 0; t <= n; t++) {
        var vis = t === 0 ? 1 : ease(shown - t + 1); if (vis <= 0.02) continue;
        mx = Math.max.apply(null, g.P[t]);
        for (j = 0; j <= t; j++) {
          var pr = g.P[t][j], r = 2 + Math.sqrt(pr / mx) * (maxR - 2) * vis, dim = last && t === n && j !== hl;
          var ref = binom(t, j) * Math.pow(0.4, j) * Math.pow(0.6, t - j);
          p.noStroke(); col(FG, dim ? 70 : 235); p.circle(X(t), Y(j), r * 2);
          if (n <= 8 && vis > 0.9) { col(dim ? [60, 70, 85] : BG); p.textSize(Math.max(8, Math.min(10, r * 0.8))); if (r > 9) p.text(Math.round(pr * 100), X(t), Y(j)); }
        }
      }
      if (last) {
        var pr2 = g.P[n][hl], refp = binom(n, hl) * Math.pow(0.4, hl) * Math.pow(0.6, n - hl);
        stk(ACC, 255, 3); p.noFill(); p.circle(X(n), Y(hl), maxR * 2 + 6); p.noStroke();
        col(FG); p.textSize(13);
        p.text(hl + ' payment' + (hl === 1 ? '' : 's') + ' in ' + n + ' steps:  ' + Math.round(binom(n, hl)) + ' different paths end here', w / 2, H - 28);
        col(ACC2); p.text('added together = ' + (pr2 * 100).toFixed(1) + '%   (without memory it would be ' + (refp * 100).toFixed(1) + '%)', w / 2, H - 10);
      } else { col(MUT); p.textSize(12); p.text('Circle size = chance of being there. Thick line = most of the probability flows along it.', w / 2, H - 22); }
    }

    // ---------- scene 2: sliding memory window ----------
    function memory(now) {
      var k = S.k, w = W(), n = 1 << k, cell = Math.min(36, (w - 40) / 14);
      if (now - lastTick > 1400) {
        var st = 0; for (var i = hist.length - k; i < hist.length; i++) st = (st << 1) | hist[i];
        hist.push(Math.random() < P1(st, k) ? 1 : 0); if (hist.length > 40) hist.shift(); lastTick = now; shift = 1;
      }
      shift = Math.max(0, shift - 0.04);
      var off = ease(shift) * cell, y0 = 64, x0 = w - 20 - cell * 13 - cell * 0.5;
      p.textAlign(p.CENTER, p.CENTER); p.noStroke(); col(MUT); p.textSize(13);
      p.text('History slides left. The model only looks at the last ' + k + ' bits (the window).', w / 2, 16);
      var shownBits = hist.slice(-14);
      for (var j = 0; j < shownBits.length; j++) {
        var cx = x0 + j * cell + off + cell / 2, inWin = j >= shownBits.length - k;
        stk(inWin ? ACC : MUT, inWin ? 255 : 90, inWin ? 2 : 1); col(shownBits[j] ? ACC : BLUE, inWin ? 230 : 80);
        p.rect(cx - cell / 2 + 2, y0, cell - 4, cell - 4, 6);
        p.noStroke(); col(BG); p.textSize(cell * 0.5); p.text(shownBits[j], cx, y0 + cell / 2 - 2);
      }
      var cur = 0; for (var q = hist.length - k; q < hist.length; q++) cur = (cur << 1) | hist[q];
      var r = Math.min(18, (w - 40) / n / 2 - 2), sy = 220;
      for (var s = 0; s < n; s++) {
        var sx = 20 + (s + 0.5) * (w - 40) / n, on = s === cur;
        stk(on ? ACC : MUT, on ? 255 : 120, on ? 3 : 1); col(on ? ACC : [30, 36, 46], on ? 255 : 255); p.circle(sx, sy, r * 2);
        p.noStroke(); col(on ? ACC2 : MUT); p.textSize(Math.max(8, r * 0.7)); p.text(bin(s, k), sx, sy + r + 12);
        if (on) { stk(ACC, 180, 2); p.line(w - 20 - cell * 0.5 - cell * (k / 2), y0 + cell, sx, sy - r); p.noStroke(); }
      }
      col(MUT); p.textSize(12); p.text('Each pattern of the last ' + k + ' bits is a "state" (' + n + ' states). The lit circle is where we are now.', w / 2, sy + r + 32);
      var pr = P1(cur, k), bx = w / 2 - 150;
      col(FG); p.textSize(14); p.text('Window ' + bin(cur, k) + '  →  chance next bit is 1:  ' + (pr * 100).toFixed(0) + '%', w / 2, 300);
      stk(MUT, 150, 1); col([30, 36, 46]); p.rect(bx, 318, 300, 14, 7); p.noStroke(); col(ACC); p.rect(bx, 318, 300 * pr, 14, 7);
    }

    // ---------- scene 3: expected values forward ----------
    function forwardScene(now) {
      var key = [S.k, S.steps, S.stick].join(); if (key !== fKey) { F = forward(); fKey = key; }
      var w = W(), k = S.k, n = 1 << k, steps = S.steps, T = (now - sceneStart) % ((steps + 1) * 900 + 3000);
      var t = Math.min(steps, Math.floor(T / 900)), frac = Math.min(1, (T - t * 900) / 700);
      p.textAlign(p.CENTER, p.CENTER); p.noStroke(); col(MUT); p.textSize(13);
      p.text('Instead of random paths, push the expected number of people through every state, step by step.', w / 2, 14);
      p.textSize(14); col(FG); p.text('Step ' + t + ' of ' + steps, w / 2, 40);
      var d = F.d[t], dn = F.d[Math.min(steps, t + 1)], mx = 1000 / n * 3, base = 190, bw = Math.min(30, (w - 40) / n - 4);
      for (var s = 0; s < n; s++) {
        var v = d[s] + (dn[s] - d[s]) * ease(frac) * (t < steps ? 1 : 0), h = Math.min(120, v / mx * 120), x = 20 + (s + 0.5) * (w - 40) / n;
        p.noStroke(); col(ACC, 230); p.rect(x - bw / 2, base - h, bw, h, 3);
        col(MUT); p.textSize(Math.max(8, Math.min(11, bw * 0.45))); p.text(bin(s, k), x, base + 12);
      }
      col(MUT); p.textSize(12); p.text('Bars: expected number of people (out of 1000) in each state', w / 2, base + 30);
      var cw = (w - 60) / (steps + 1), cmax = 0; for (var i = 0; i <= steps; i++) cmax = Math.max(cmax, F.ev[i]);
      var by = 350;
      for (var j = 0; j <= t; j++) {
        var hh = F.ev[j] / (cmax || 1) * 80 * (j === t ? ease(frac) : 1);
        col(BLUE, 230); p.rect(30 + j * cw + 3, by - hh, cw - 6, hh, 3);
        col(FG); p.textSize(10); if (cw > 26 && (j < t || frac > 0.6)) p.text(F.ev[j].toFixed(0), 30 + j * cw + cw / 2, by - hh - 8);
      }
      col(MUT); p.textSize(12); p.text('Blue: expected number of events (1s) at each step', w / 2, 372);
    }
  };
  new p5(sketch);
})();
