
/* ---------- draw ---------- */
const playerSkin = () => unlocked(skinOf(st.skin)) ? st.skin : 'classic';
function drawChicken(c) {
  if (c.dead && !c.hit) return;
  if (c.inv > 0 && !c.rival && Math.floor(s.time * 10) % 2) return;
  const x = (colfOf(c) + .5) * TS, y = rowY(rowfOf(c)) + TS / 2, dead = c.dead && c.hit, hh = c.hop ? Math.sin(Math.PI * Math.min(1, c.hop.t)) * 16 : 0;
  drawChickenG(ctx, x, y, { skin: c.rival ? c.skin : playerSkin(), face: c.face, hh, sq: c.sq > 0 ? 1 - c.sq * 2 : 1, dead, pal: c.rival ? PAL_RIVAL : null, t: s.time });
  if (dead) return;
  if (c.shield) { ctx.save(); ctx.strokeStyle = 'rgba(130,205,255,.95)'; ctx.lineWidth = 2.5; ctx.fillStyle = 'rgba(130,205,255,.18)'; ctx.beginPath(); ctx.ellipse(x, y - hh - 2, 26, 27, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore(); }
  if (c.magnet > 0) { ctx.save(); ctx.strokeStyle = 'rgba(255,130,110,' + (.5 + Math.sin(s.time * 8) * .3) + ')'; ctx.lineWidth = 2.5; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -s.time * 30; ctx.beginPath(); ctx.arc(x, y - hh, 36 + Math.sin(s.time * 6) * 3, 0, 7); ctx.stroke(); ctx.restore(); }
  if (c.rival) { ctx.save(); ctx.font = '900 11px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText('RIVAL', x, y - hh - 34); ctx.fillStyle = '#8fc1ff'; ctx.fillText('RIVAL', x, y - hh - 34); ctx.restore(); }
}
function drawCorn(x, y, gold) {
  const b = Math.sin(s.time * 4 + x) * 2.5;
  ctx.save(); ctx.translate(x, y + b); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(0, 16 - b, 9, 3, 0, 0, 7); ctx.fill();
  if (gold) { ctx.shadowColor = '#ffd54a'; ctx.shadowBlur = 14; }
  ctx.fillStyle = '#4caf50'; ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(-10, -2); ctx.lineTo(0, 6); ctx.fill(); ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(10, -2); ctx.lineTo(0, 6); ctx.fill();
  ctx.fillStyle = gold ? '#ffd700' : '#ffcf3a'; rr(ctx, -5, -14, 10, 24, 5); ctx.fill();
  ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(160,100,0,.35)'; for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) ctx.fillRect(-3.5 + j * 4.5, -11 + i * 5.5, 2.4, 3);
  if (gold) { ctx.fillStyle = '#fff'; ctx.fillRect(-1, -20, 2, 5); ctx.fillRect(-3, -18, 6, 1.5); }
  ctx.restore();
}
function draw() {
  if (!s) return;
  const n = nightAmt(), lights = [], p = s.p;
  ctx.save();
  if (s.shake > 0) ctx.translate((Math.random() - .5) * s.shake * 24, (Math.random() - .5) * s.shake * 24);
  ctx.fillStyle = '#4a8f3a'; ctx.fillRect(-20, -20, W + 40, H + 40);
  const r0 = Math.floor(s.cam) - 1, r1 = Math.ceil(s.cam + ROWS) + 1;
  const chs = [p]; if (s.v && !(s.v.dead && s.v.deadT > 2.5)) chs.unshift(s.v);
  for (let r = r1; r >= Math.max(0, r0); r--) {
    const lane = laneAt(r), y = rowY(r), up = laneAt(r + 1), dn = r > 0 ? laneAt(r - 1) : null;
    if (lane.type === 'grass') blit(grassSprite(r & 1), 0, y, W, TS);
    else if (lane.type === 'road') {
      blit(roadSprite(), 0, y, W, TS); ctx.fillStyle = '#d9d9d9';
      if (up.type === 'road') { for (let x = 6; x < W; x += 54) ctx.fillRect(x, y - 1.5, 30, 3); } else { ctx.fillStyle = '#c9ccd1'; ctx.fillRect(0, y, W, 4); }
      if (!dn || dn.type !== 'road') { ctx.fillStyle = '#c9ccd1'; ctx.fillRect(0, y + TS - 4, W, 4); }
    } else if (lane.type === 'river') {
      const off = (((s.time * lane.dir * lane.speed * 16) % 90) + 90) % 90 - 90; ctx.save(); ctx.beginPath(); ctx.rect(0, y, W, TS); ctx.clip(); blit(waterSprite(), off, y, W, TS); blit(waterSprite(), off + W, y, W, TS); ctx.restore();
      ctx.fillStyle = '#dccb94'; if (up.type !== 'river') ctx.fillRect(0, y, W, 5); if (!dn || dn.type !== 'river') ctx.fillRect(0, y + TS - 5, W, 5);
    } else blit(railSprite(), 0, y, W, TS);
    const here = chs.filter(c => Math.round(rowfOf(c)) === r), under = here.filter(c => c.dead && c.hit), over = here.filter(c => !(c.dead && c.hit));
    if (lane.type === 'grass') {
      if (lane.food && !lane.food.got) drawCorn((lane.food.c + .5) * TS, y + TS / 2, lane.food.gold);
      if (lane.pw && !lane.pw.got) drawPwG(ctx, lane.pw.kind, (lane.pw.c + .5) * TS, y + TS / 2 - 2 + Math.sin(s.time * 3 + lane.pw.c) * 3, 1);
      lane.obs.forEach(c => blit(((c + r) % 3 === 0 && lane.rock) ? rockSprite() : treeSprite(), c * TS, y - 6, TS, TS));
      here.forEach(drawChicken);
    } else if (lane.type === 'road') {
      under.forEach(drawChicken);
      for (const car of lane.cars) { const x = carX(lane, car, s.t) * TS, img = carSprite(car.kind, car.color), w = LEN[car.kind] * TS;
        if (x > W + 4 || x + w < -4) continue;
        if (lane.dir < 0) { ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1); blit(img, 0, 0, w, TS); ctx.restore(); } else blit(img, x, y, w, TS);
        lights.push({ x: lane.dir > 0 ? x + w : x, y: y + TS / 2, dir: lane.dir, off: 40, r: 80, a: .38 }); }
      over.forEach(drawChicken);
    } else if (lane.type === 'river') {
      for (const lg of lane.logs) { const x = logX(lane, lg, s.t) * TS, w = lg.len * TS; if (x > W + 4 || x + w < -4) continue; blit(logSprite(lg.len), x, y + Math.sin(s.time * 2.2 + lg.x0 * 3) * 1.4, w, TS); }
      here.forEach(drawChicken);
    } else {
      const ts = trainState(lane, s.t), flash = ts.warn && Math.floor(s.time * 6) % 2;
      [18, W - 18].forEach((x, i) => { ctx.fillStyle = '#2b2b2b'; ctx.fillRect(x - 2, y + 6, 4, TS - 12);
        [0, 1].forEach(k => { const on = ts.warn && ((flash ? 1 : 0) === (k ^ i ? 1 : 0)); ctx.fillStyle = on ? '#ff3b30' : '#5a1d1a'; ctx.beginPath(); ctx.arc(x, y + 20 + k * 20, 6, 0, 7); ctx.fill(); if (on) lights.push({ x, y: y + 20 + k * 20, dir: 0, off: 0, r: 46, col: '255,70,60' }); }); });
      under.forEach(drawChicken);
      if (ts.active) { const x = ts.x * TS, w = TL * TS; if (lane.dir < 0) { ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1); blit(trainSprite(), 0, 0, w, TS); ctx.restore(); } else blit(trainSprite(), x, y, w, TS);
        lights.push({ x: lane.dir > 0 ? x + w : x, y: y + TS / 2, dir: lane.dir, off: 60, r: 120 }); }
      over.forEach(drawChicken);
    }
  }
  s.parts.forEach(q => { ctx.save(); ctx.globalAlpha = Math.min(1, q.life * 2); ctx.translate(q.x, q.y); ctx.rotate(q.rot); ctx.fillStyle = q.col || '#fff'; ctx.beginPath(); ctx.ellipse(0, 0, q.r || 6, (q.r || 6) * .43, 0, 0, 7); ctx.fill(); ctx.restore(); });
  s.pops.forEach(q => { ctx.save(); ctx.globalAlpha = Math.min(1, q.life * 2); ctx.font = '900 20px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.5)'; const y = rowY(q.r) - (0.8 - q.life) * 40;
    ctx.strokeText(q.txt, (q.c + .5) * TS, y); ctx.fillStyle = q.rival ? '#8fc1ff' : '#ffe14d'; ctx.fillText(q.txt, (q.c + .5) * TS, y); ctx.restore(); });
  if (n > .015) {
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = Math.min(1, n * 1.1); ctx.fillStyle = '#4a5593'; ctx.fillRect(0, 0, W, H); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const k = Math.min(1, n / .4);
    chs.forEach(c => { if (c.dead) return; lights.push({ x: (colfOf(c) + .5) * TS, y: rowY(rowfOf(c)) + TS / 2, dir: 0, off: 0, r: 60, col: '255,255,255', a: .14 }); });
    lights.forEach(l => { const gx = l.x + l.dir * l.off, col = l.col || '255,236,170', g = ctx.createRadialGradient(gx, l.y, 4, gx, l.y, l.r); g.addColorStop(0, 'rgba(' + col + ',' + ((l.a || .5) * k) + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); ctx.fillStyle = g; ctx.fillRect(gx - l.r, l.y - l.r, l.r * 2, l.r * 2); });
    ctx.restore();
  }
  const fog = ctx.createLinearGradient(0, 0, 0, 170); fog.addColorStop(0, 'rgba(20,40,70,.5)'); fog.addColorStop(1, 'rgba(20,40,70,0)'); ctx.fillStyle = fog; ctx.fillRect(0, 0, W, 170);
  if (s.state === 'play' && s.moved && st.creep) { const d = rowfOf(p) - s.cam; if (d < 1.8) { const a = Math.min(.55, (1.8 - d) * .3); const g2 = ctx.createLinearGradient(0, H - 90, 0, H); g2.addColorStop(0, 'rgba(210,60,40,0)'); g2.addColorStop(1, 'rgba(210,60,40,' + a + ')'); ctx.fillStyle = g2; ctx.fillRect(0, H - 90, W, 90); } }
  if (s.state !== 'title') { let ix = 26; if (p.shield) { drawPwG(ctx, 'shield', ix, 28, .8); ix += 40; } if (p.magnet > 0) { drawPwG(ctx, 'magnet', ix, 28, .8); ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(ix - 16, 46, 32, 5); ctx.fillStyle = '#ff7a6b'; ctx.fillRect(ix - 16, 46, 32 * p.magnet / 10, 5); } }
  ctx.restore();
}

/* ---------- chicken picker ---------- */
let prevOv = 'ovTitle';
function buildSkins() {
  const grid = $('skinGrid'); grid.innerHTML = '';
  SKINS.forEach(k => { const b = KIT.el('button', { class: 'skin', type: 'button', 'data-act': 'pick', 'data-id': k.id }), cv = KIT.el('canvas', { width: 112, height: 112 });
    b.appendChild(cv); b.appendChild(KIT.el('span', { class: 'sn' }, k.name)); b.appendChild(KIT.el('span', { class: 'sl' }, '')); grid.appendChild(b);
    drawChickenG(cv.getContext('2d'), 56, 62, { skin: k.id, k: 2, t: .4 }); k._el = b; });
}
function refreshSkins() {
  SKINS.forEach(k => { const b = k._el, open = unlocked(k), sel = open && playerSkin() === k.id; b.classList.toggle('locked', !open); b.classList.toggle('sel', sel); b.lastChild.textContent = open ? (sel ? 'Selected' : '') : '🔒 ' + k.need + ' corn'; });
  $('skinInfo').textContent = 'Corn collected so far: ' + st.totalCorn + ' · tick "Unlock all chickens" in Settings to preview them all';
}
function syncLives() { KIT.setText($('livesT'), st.lives); KIT.setText($('livesT2'), st.lives); if (s && s.state === 'title') { s.p.lives = st.lives; hud(); } }
function stepLives(d) { st.lives = KIT.clamp(st.lives + d, 1, 9); S.save(); P.refresh(); syncLives(); }

/* ---------- loop, input, buttons ---------- */
const L = loop(update, draw);
L.onHide = () => { if (s && s.state === 'play') { s.state = 'paused'; O.show('ovPause'); } };
function pause() { if (s && s.state === 'play') { s.state = 'paused'; O.show('ovPause'); } else if (s && s.state === 'paused') resume(); }
function resume() { if (s && s.state === 'paused') { s.state = 'play'; O.hide('ovPause'); L.paused = false; } }
const seed0 = () => (Math.random() * 4294967296) >>> 0;
ui.actions(document.body, {
  play: () => startGame(seed0(), false), again: () => startGame(seed0(), false), daily: () => startGame(rng.dailySeed('chickenroad'), true), resume,
  skins: () => { prevOv = O.open('ovOver') ? 'ovOver' : 'ovTitle'; O.hideAll(); refreshSkins(); O.show('ovSkin'); },
  skinBack: () => { O.hide('ovSkin'); O.show(prevOv); },
  pick: b => { const k = skinOf(b.dataset.id); if (!unlocked(k)) { ui.toast('Collect ' + (k.need - st.totalCorn) + ' more corn to unlock ' + k.name, 2200); return; } st.skin = k.id; S.save(); refreshSkins(); },
  lm: () => stepLives(-1), lp: () => stepLives(1)
});
input.keys({ ArrowLeft: 0, a: 0, ArrowUp: 1, w: 1, ArrowRight: 2, d: 2, ArrowDown: 3, s: 3, ' ': 1 }, d => hop(d));
window.addEventListener('keydown', e => { if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') pause(); });
let px = 0, py = 0, pd = false;
$('cv').addEventListener('pointerdown', e => { pd = true; px = e.clientX; py = e.clientY; });
window.addEventListener('pointerup', e => { if (!pd) return; pd = false; const dx = e.clientX - px, dy = e.clientY - py;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) hop(1); else hop(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 0 : 2) : (dy < 0 ? 1 : 3)); });
$('cv').addEventListener('touchmove', e => e.preventDefault(), { passive: false });

KIT.pwa.register('sw.js'); KIT.pwa.hint($('iosHint')); KIT.pwa.installButton($('installBtn'));
buildSkins(); newWorld(rng.dailySeed('title'), false); s.state = 'title'; syncLives(); L.start(); hud();
KIT.hook({ start: startGame, hop, update, die, carX, logX, laneAt, hazard, hitsIn: hazard, supportAt, trainState, blocked, spawnRival, placeC, killC, st, SKINS, unlocked, get s() { return s; }, get score() { return score(); }, DIFF, COLS, LEN });
})();
