
/* ---------- world: lanes are generated on demand from a seed ---------- */
let s = null;
const mk = (row, col, rival) => ({ row, col, dx: 0, hop: null, q: null, face: 1, sq: 0, maxRow: row, bonus: 0, corn: 0, dead: false, hit: false, why: '', deadT: 0, rival: !!rival, think: .5, respawn: 0,
  lives: 1, inv: 0, shield: false, magnet: 0, skin: 'classic' });
function newWorld(seed, daily) {
  s = { seed, daily: !!daily, rnd: rng.mulberry(seed), lanes: [], state: 'title', t: 0, cam: 0, p: mk(1, 4), v: null, moved: false, parts: [], pops: [], shake: 0, deadT: 0, why: '', time: 0 };
  s.p.lives = st.lives; ensure(30);
}
function ensure(n) { while (s.lanes.length <= n) s.lanes.push(gen(s.lanes.length)); }
const laneAt = r => { ensure(r + 2); return s.lanes[Math.max(0, r)]; };
const ALL = Array.from({ length: COLS }, (_, i) => i);
function nextType(prevType, r, R) {
  if (prevType !== 'grass') return 'grass';
  const x = R(), wRiver = st.rivers && r >= 25 ? .26 : 0, wRail = st.rails && r >= 35 ? .2 : 0;
  return x < wRiver ? 'river' : x < wRiver + wRail ? 'rail' : 'road';
}
const segLen = (type, r, R) => type === 'grass' ? 1 + Math.floor(R() * 3) : type === 'road' ? 3 + Math.floor(R() * (r > 100 ? 4 : 3)) : type === 'river' ? 2 + Math.floor(R() * (r > 100 ? 3 : 2)) : 1 + Math.floor(R() * 2);
/* gen: roads come in runs of 3+; rivers 2+; trees thicken with distance but a path is always kept open */
function gen(r) {
  const R = s.rnd, prev = s.lanes[r - 1];
  if (r < 3) return { type: 'grass', r, run: r + 1, tgt: 3, obs: [], food: null, pw: null, reach: new Set(ALL) };
  let type, run, tgt;
  if (prev.run < prev.tgt) { type = prev.type; run = prev.run + 1; tgt = prev.tgt; } else { type = nextType(prev.type, r, R); run = 1; tgt = segLen(type, r, R); }
  if (type === 'grass') {
    const obs = [], n = Math.floor(R() * (2 + Math.min(5, r / 30)));
    for (let i = 0; i < n; i++) { const c = Math.floor(R() * COLS); if (!obs.includes(c)) obs.push(c); }
    const pr = prev.reach;
    const reachOf = o => { const nx = new Set(); pr.forEach(c => { if (!o.includes(c)) nx.add(c); });
      for (let ch = true; ch;) { ch = false; [...nx].forEach(c => [c - 1, c + 1].forEach(m => { if (m >= 0 && m < COLS && !o.includes(m) && !nx.has(m)) { nx.add(m); ch = true; } })); } return nx; };
    let reach = reachOf(obs); const minR = r < 60 ? 3 : 2;
    while (reach.size < minR && obs.length) { obs.pop(); reach = reachOf(obs); }
    const free = [...reach]; let food = null, pw = null;
    if (R() < .45) food = { c: free[Math.floor(R() * free.length)], gold: R() < .1, got: false };
    if (r >= 8 && R() < .09) { const cs = free.filter(c => !food || c !== food.c); if (cs.length) { const k = R(); pw = { c: cs[Math.floor(R() * cs.length)], kind: k < .4 ? 'shield' : k < .8 || r < 15 ? 'magnet' : 'heart', got: false }; } }
    return { type, r, run, tgt, obs, food, pw, reach, rock: R() < .4 };
  }
  if (type === 'road') {
    const dir = prev.type === 'road' ? (R() < .75 ? -prev.dir : prev.dir) : (R() < .5 ? 1 : -1);
    const speed = Math.min(5.6, (1.05 + R() * 1.35) * (1 + Math.min(r, 140) / 80));
    const n = 1 + Math.floor(R() * 3), cars = [], kinds = [];
    for (let i = 0; i < n; i++) { const k = R(); kinds.push(r > 14 && k < .22 ? 'truck' : r > 6 && k < .5 ? 'van' : 'car'); }
    const maxLen = Math.max(...kinds.map(k => LEN[k])), L = Math.max(COLS + 6, n * (maxLen + 2.9));
    for (let i = 0; i < n; i++) cars.push({ x0: i * (L / n) + R() * .8, kind: kinds[i], color: COLORS[Math.floor(R() * COLORS.length)] });
    return { type, r, run, tgt, dir, speed, L, cars, reach: new Set(ALL) };
  }
  if (type === 'river') {
    const dir = prev.type === 'river' ? (R() < .85 ? -prev.dir : prev.dir) : (R() < .5 ? 1 : -1);
    const speed = Math.min(2.6, (.9 + R() * 1.0) * (1 + Math.min(r, 150) / 200)), n = 2 + Math.floor(R() * 2), logs = []; let L = 0;
    for (let i = 0; i < n; i++) { const len = 2 + Math.floor(R() * 3), gap = 1.7 + R() * .9; logs.push({ x0: L + R() * .4, len }); L += len + gap; }
    L = Math.max(L, COLS + 6);
    return { type, r, run, tgt, dir, speed, L, logs, reach: new Set(ALL) };
  }
  const dir = R() < .5 ? 1 : -1, T = 7 + R() * 4, sp = 13;
  return { type: 'rail', r, run, tgt, dir, sp, T, off: R() * T, dur: (COLS + TL) / sp, reach: new Set(ALL) };
}
/* everything that moves is a pure function of time, so lanes behave the same off-screen */
function carX(lane, car, t) { const v = car.x0 + 3 + lane.dir * lane.speed * DIFF[st.diff] * t; return (((v % lane.L) + lane.L) % lane.L) - 3; }
function logX(lane, lg, t) { const v = lg.x0 + 5 + lane.dir * lane.speed * t; return (((v % lane.L) + lane.L) % lane.L) - 5; }
function supportAt(lane, cx, t) { for (const lg of lane.logs) { const x = logX(lane, lg, t); if (cx > x + .1 && cx < x + lg.len - .1) return lg; } return null; }
function trainState(l, t) { const u = (((t + l.off) % l.T) + l.T) % l.T, active = u < l.dur; return { u, active, warn: u >= l.T - 1.7, x: active ? (l.dir > 0 ? -TL + l.sp * u : COLS - l.sp * u) : 0 }; }
function trainHit(l, cx, t) { const ts = trainState(l, t); return ts.active && cx + .27 > ts.x && cx - .27 < ts.x + TL; }
/* hazard(col,row,t0,t1): would a chicken landing on that tile between t0 and t1 be in danger? (used by the rival and by bots) */
function hazard(col, row, t0, t1) {
  const l = laneAt(row);
  if (l.type === 'road') { for (let t = t0; t <= t1; t += .05) for (const car of l.cars) { const x = carX(l, car, t); if (col + .84 > x + .05 && col + .16 < x + LEN[car.kind] - .05) return true; } return false; }
  if (l.type === 'rail') { for (let t = t0; t <= t1 + 1.2; t += .1) { const ts = trainState(l, t); if (ts.active || ts.warn) return true; } return false; }
  if (l.type === 'river') return !supportAt(l, col + .5, t0 + .12);
  return false;
}
const blocked = (col, row) => { if (col < 0 || col >= COLS || row < 0) return true; const l = laneAt(row); return l.type === 'grass' && l.obs.includes(col); };
const rowY = r => H - (r - s.cam + 1) * TS;
const rowfOf = c => c.hop ? KIT.lerp(c.hop.fr, c.hop.tr, Math.min(1, c.hop.t)) : c.row;
const colfOf = c => c.hop ? KIT.lerp(c.hop.fc, c.hop.tc, Math.min(1, c.hop.t)) : c.col + c.dx;
const dailyDate = () => new Date().toISOString().slice(0, 10);
const cScore = c => c.maxRow - 1 + c.bonus, score = () => cScore(s.p);
const nightAmt = () => st.night && s ? .62 * (1 - Math.cos((s.t % 160) / 160 * 2 * Math.PI)) / 2 : 0;

/* ---------- actions (same rules for the player and the rival) ---------- */
function startGame(seed, daily) { newWorld(seed, daily); s.state = 'play'; O.hideAll(); hud(); L.paused = false; L.start(); }
function hud() {
  KIT.setText($('sc'), score()); KIT.setText($('best'), s.daily ? (st.daily.d === dailyDate() ? st.daily.v : 0) : st.best); KIT.setText($('corn'), s.p.corn);
  KIT.setText($('lives'), s.p.lives > 0 ? '♥'.repeat(s.p.lives) : '–');
  $('rvbox').style.display = s.v ? '' : 'none'; if (s.v) KIT.setText($('rv'), cScore(s.v));
}
function hopC(c, dir) {
  if (c.dead) return false;
  if (c.hop) { if (!c.rival) c.q = dir; return false; }
  const fcol = c.col + c.dx, base = Math.round(fcol); let col = base, row = c.row; if (dir === 0) col--; else if (dir === 2) col++; else if (dir === 1) row++; else row--;
  if (col < 0 || col >= COLS || row < Math.floor(s.cam) || row < 0) return false;
  if (blocked(col, row)) { if (!c.rival) { A.beep(120, .06, 'square', .08); s.shake = Math.max(s.shake, .08); } return false; }
  if (dir === 0) c.face = -1; if (dir === 2) c.face = 1;
  c.hop = { t: 0, fc: fcol, fr: c.row, tc: col, tr: row }; c.sq = 0; if (!c.rival) { s.moved = true; A.beep(520 + Math.random() * 60, .07, 'square', .06); }
  return true;
}
const hop = dir => (s && s.state === 'play') ? hopC(s.p, dir) : false;
function eat(c, lane) {
  const f = lane.food; f.got = true; const pts = f.gold ? 25 : 5; c.bonus += pts; c.corn++;
  s.pops.push({ c: f.c, r: lane.r, txt: (c.rival ? 'Rival +' : '+') + pts, life: .8, rival: c.rival });
  if (c.rival) { A.beep(300, .05, 'triangle', .05); return; }
  A.beep(f.gold ? 990 : 760, .09, 'triangle', .12); A.beep(f.gold ? 1320 : 1010, .12, 'triangle', .1, .07);
  const before = st.totalCorn; st.totalCorn++;
  SKINS.forEach(k => { if (k.need > before && k.need <= st.totalCorn) { ui.toast('🐔 New chicken unlocked: ' + k.name + '!', 2800); S.save(); } });
}
function grab(c, lane) {
  const pw = lane.pw; pw.got = true; A.beep(660, .08, 'square', .08); A.beep(990, .1, 'square', .08, .08);
  if (pw.kind === 'shield') { c.shield = true; s.pops.push({ c: pw.c, r: lane.r, txt: 'Shield!', life: 1, rival: false }); }
  else if (pw.kind === 'magnet') { c.magnet = 10; s.pops.push({ c: pw.c, r: lane.r, txt: 'Magnet!', life: 1, rival: false }); }
  else if (c.lives < 9) { c.lives++; s.pops.push({ c: pw.c, r: lane.r, txt: '+1 life', life: 1, rival: false }); } else { c.bonus += 10; s.pops.push({ c: pw.c, r: lane.r, txt: '+10', life: 1, rival: false }); }
  hud();
}
function landC(c) {
  const h = c.hop; c.hop = null; c.col = h.tc; c.dx = 0; c.row = h.tr; c.sq = .09;
  if (c.row > c.maxRow) { c.maxRow = c.row; ensure(c.maxRow + ROWS + 4); }
  const lane = laneAt(c.row);
  if (lane.type === 'river' && !supportAt(lane, c.col + .5, s.t)) return killC(c, 'Splash! Fell in the river.', 'water');
  if (lane.type === 'grass') {
    if (lane.food && !lane.food.got && lane.food.c === c.col) eat(c, lane);
    if (!c.rival && lane.pw && !lane.pw.got && lane.pw.c === c.col) grab(c, lane);
  }
  hud();
  if (c.q != null) { const d = c.q; c.q = null; hopC(c, d); }
}
function feathers(c, water) { const x = (colfOf(c) + .5) * TS, y = rowY(rowfOf(c)) + TS / 2;
  for (let i = 0; i < (water ? 22 : 16); i++) s.parts.push({ x, y, vx: (Math.random() - .5) * 260, vy: -80 - Math.random() * 220, rot: Math.random() * 6, vr: (Math.random() - .5) * 12, life: .9 + Math.random() * .6, col: water ? '#bfe3ff' : '#fff', r: water ? 3 : 6 }); }
/* kind: 'car' | 'train' | 'water' | 'fox' */
function killC(c, why, kind) {
  if (c.dead) return;
  if (!c.rival) {
    if (c.inv > 0 && kind !== 'fox') return;
    if (c.shield && (kind === 'car' || kind === 'train')) { c.shield = false; c.inv = 1.3; s.shake = .2; s.pops.push({ c: Math.round(colfOf(c)), r: c.row, txt: 'Shield saved you!', life: 1.1, rival: false }); A.slide(900, 300, .25, 'triangle', .12); hud(); return; }
  }
  c.dead = true; c.hit = kind === 'car' || kind === 'train'; c.why = kind; c.deadT = 0; c.hop = null; c.q = null; feathers(c, kind === 'water');
  if (c.rival) { c.respawn = 3.2; s.pops.push({ c: Math.round(colfOf(c)), r: c.row, txt: kind === 'water' ? 'Rival splash!' : c.hit ? 'Rival splat!' : 'Rival caught!', life: 1.1, rival: true }); A.noise(.12, .12); hud(); return; }
  c.lives--; s.shake = .45; A.noise(.25, .3); A.slide(320, 50, .45, 'sawtooth', .12); c.shield = false; c.magnet = 0;
  if (c.lives > 0) { c.respawn = 1.1; hud(); return; }
  s.state = 'dead'; s.why = why; s.deadT = 0;
  const sc = score(); let isBest = false;
  if (s.daily) { if (st.daily.d !== dailyDate() || sc > st.daily.v) { st.daily = { d: dailyDate(), v: sc }; isBest = true; } }
  else if (sc > st.best) { st.best = sc; isBest = true; }
  S.save(); s.isBest = isBest; hud();
}
const die = (why, car) => { s.p.lives = 1; s.p.inv = 0; s.p.shield = false; killC(s.p, why, car ? 'car' : 'fox'); };
/* put a chicken back on a safe grass lane just ahead of the fox */
function placeC(c) {
  let r = Math.ceil(s.cam) + (c.rival ? 2 : 1); ensure(r + 16); const other = c.rival ? s.p : s.v;
  for (let k = 0; k < 14; k++, r++) { const l = laneAt(r); if (l.type !== 'grass') continue;
    const free = [...l.reach].filter(cc => !(other && !other.dead && other.row === r && Math.round(other.col + other.dx) === cc)); if (!free.length) continue;
    free.sort((a, b) => Math.abs(a - (c.col || 4)) - Math.abs(b - (c.col || 4)));
    c.row = r; c.col = c.rival ? free[Math.floor(Math.random() * free.length)] : free[0]; c.dx = 0; c.dead = false; c.hop = null; c.q = null; c.think = .6;
    if (c.rival) c.maxRow = Math.max(c.maxRow, r); else c.inv = 2.2; return true; }
  return false;
}

/* ---------- the rival chicken: same rules, simple brain ---------- */
function spawnRival() {
  s.v = mk(0, 0, true); const pool = SKINS.filter(k => k.id !== st.skin && k.id !== 'golden'); s.v.skin = pool[Math.floor(Math.random() * pool.length)].id;
  if (!placeC(s.v)) { s.v.dead = true; s.v.respawn = .5; } ui.toast('🐔 A rival chicken joined the road!'); hud();
}
function aiThink(c, dt) {
  const urgent = c.row - s.cam < 3;
  c.think -= dt; if (c.think > 0 || c.hop) return; c.think = urgent ? .05 + Math.random() * .07 : .14 + Math.random() * .22;
  const t = s.t, row = c.row, col = Math.round(c.col + c.dx), here = laneAt(row), win = urgent ? .38 : .5;
  const go = d => { const nc = col + (d === 0 ? -1 : d === 2 ? 1 : 0), nr = row + (d === 1 ? 1 : d === 3 ? -1 : 0);
    if (blocked(nc, nr) || nr < Math.floor(s.cam) || hazard(nc, nr, t, t + win)) return false; return hopC(c, d); };
  let danger = false, order = urgent ? [1, 0, 2, 3] : [1, 3, 0, 2];
  if (here.type === 'road') danger = hazard(col, row, t, t + .42);
  else if (here.type === 'rail') { const ts = trainState(here, t), n = trainState(here, t + 1); danger = ts.warn || ts.active || n.active; }
  else if (here.type === 'river') { const cx = c.col + c.dx + .5; if (cx < 1.3 || cx > COLS - 1.3) { danger = true; order = [1, cx < COLS / 2 ? 2 : 0, 3]; } }
  if (danger) { for (const d of order) if (go(d)) return; return; }
  let want = null, bestD = 99; for (let k = 0; k <= 5; k++) { const l = laneAt(row + k); if (l.type === 'grass' && l.food && !l.food.got) { const d = Math.abs(l.food.c - col) + k; if (d < bestD && Math.abs(l.food.c - col) <= k + 2) { bestD = d; want = l.food.c; } } }
  if (!urgent && here.type === 'grass' && want != null && want !== col && go(want < col ? 0 : 2)) return;
  const room = urgent || (row < s.p.row + 5 && row < Math.floor(s.cam) + ROWS - 2);
  if (room && (urgent || Math.random() > .07)) { if (Math.random() < .012 ? hopC(c, 1) : go(1)) return; }
  const nl = laneAt(row + 1);
  if (room && here.type === 'grass' && nl.type === 'grass' && nl.obs.includes(col)) {
    for (let o = 1; o < COLS; o++) for (const nc of [col - o, col + o]) if (nc >= 0 && nc < COLS && !nl.obs.includes(nc) && !here.obs.includes(nc)) { if (go(nc < col ? 0 : 2)) return; }
  }
}

/* ---------- update ---------- */
function updC(c, dt) {
  c.sq = Math.max(0, c.sq - dt); c.inv = Math.max(0, c.inv - dt);
  if (c.dead) { c.deadT += dt; c.respawn -= dt;
    if (c.respawn <= 0 && s.state === 'play') { if (placeC(c)) hud(); else c.respawn = .5; } return; }
  if (!c.rival) c.magnet = Math.max(0, c.magnet - dt);
  if (c.hop) { c.hop.t += dt / .11; if (c.hop.t >= 1) landC(c); if (c.dead) return; }
  const rowf = rowfOf(c);
  if (rowf < s.cam - .35) return killC(c, 'Too slow! The fox got you.', 'fox');
  const lr = c.hop ? (c.hop.t > .5 ? c.hop.tr : c.hop.fr) : c.row, lane = laneAt(lr), cx = colfOf(c) + .5;
  if (lane.type === 'road') { for (const car of lane.cars) { const x = carX(lane, car, s.t); if (cx + .27 > x + .05 && cx - .27 < x + LEN[car.kind] - .05) return killC(c, 'Splat! Hit by a ' + car.kind + '.', 'car'); } }
  else if (lane.type === 'rail') { if (trainHit(lane, cx, s.t)) return killC(c, 'Splat! Hit by the train.', 'train'); }
  else if (lane.type === 'river' && !c.hop) {
    if (!supportAt(lane, cx, s.t)) return killC(c, 'Splash! Fell in the river.', 'water');
    c.dx += lane.dir * lane.speed * dt; while (c.dx >= .5) { c.col++; c.dx -= 1; } while (c.dx < -.5) { c.col--; c.dx += 1; }
    if (c.col + c.dx + .5 < 0 || c.col + c.dx + .5 > COLS) return killC(c, 'Swept away by the river!', 'water');
  }
}
function railSounds() {
  for (let r = Math.max(0, Math.floor(s.cam) - 1); r <= Math.ceil(s.cam + ROWS); r++) { const l = laneAt(r); if (l.type !== 'rail') continue; const ts = trainState(l, s.t);
    if (ts.warn && !(s.time < (l.bell || 0))) { A.beep(1250, .06, 'square', .04); A.beep(950, .06, 'square', .04, .13); l.bell = s.time + .55; }
    if (ts.active && !l.horn) { l.horn = true; A.slide(190, 150, .5, 'sawtooth', .07); } if (!ts.active) l.horn = false; }
}
function update(dt) {
  if (!s) return;
  s.time += dt; s.t += dt; s.shake = Math.max(0, s.shake - dt);
  s.parts.forEach(p => { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 520 * dt; p.rot += p.vr * dt; }); s.parts = s.parts.filter(p => p.life > 0);
  s.pops.forEach(p => p.life -= dt); s.pops = s.pops.filter(p => p.life > 0);
  if (s.state === 'dead') { s.p.sq = Math.max(0, s.p.sq - dt); s.deadT += dt; if (s.v) updC(s.v, dt); if (s.deadT > .85 && !O.open('ovOver')) showOver(); return; }
  if (s.state !== 'play') return;
  updC(s.p, dt); if (s.state !== 'play') return;
  const p = s.p, rowf = rowfOf(p), target = Math.max(s.cam, rowf - 4.2); s.cam += (target - s.cam) * Math.min(1, dt * 6);
  if (st.creep && s.moved) s.cam += Math.min(.62, .2 + p.maxRow * .003) * dt;
  ensure(Math.ceil(s.cam) + ROWS + 4);
  if (p.magnet > 0 && !p.dead) for (let r = p.row - 2; r <= p.row + 3; r++) { if (r < 0) continue; const l = laneAt(r); if (l.type === 'grass' && l.food && !l.food.got && Math.abs(l.food.c - (p.col + p.dx)) <= 2.2) eat(p, l); }
  if (st.rival && !s.v && p.maxRow >= 12) spawnRival();
  if (s.v) { updC(s.v, dt); if (!s.v.dead) aiThink(s.v, dt); }
  railSounds(); hud();
}
function showOver() {
  const sc = score(), rv = s.v ? cScore(s.v) : null;
  $('overH').textContent = s.p.why === 'water' ? 'Splash!' : s.p.hit ? 'Splat!' : 'Caught!';
  $('overTxt').innerHTML = s.why + '<br>Score <b>' + sc + '</b> · corn ' + s.p.corn + (rv != null ? '<br>🐔 Rival ' + rv + (sc > rv ? ' · you win!' : sc < rv ? ' · rival wins' : ' · tie') : '') + (s.isBest ? '<br>🏆 New best!' : '') + (s.daily ? '<br><small>Daily road ' + dailyDate() + '</small>' : '');
  O.show('ovOver'); hud();
}
