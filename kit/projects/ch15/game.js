/* Chicken Road, drop 1: endless road, hop, cars, corn, fox creep. Built on KIT. */
(() => {
const { $, store, ui, canvas, loop, sfx, settings, rng, input } = KIT;
const S = store('kevinhyhau.ch15.v1', { dark: true, sound: true, diff: 'normal', creep: true, rival: true, lives: 3, rivers: true, rails: true, night: true, skin: 'classic', totalCorn: 0, unlockAll: false, best: 0, daily: { d: '', v: 0 } }), st = S.st;
ui.theme($('themeBtn'), st, S.save);
const A = sfx(() => st.sound), O = ui.overlays(['ovTitle', 'ovOver', 'ovPause', 'ovSkin']);
const TS = 60, COLS = 9, W = COLS * TS, H = 720, ROWS = H / TS;
const C = canvas($('cv'), W, H), ctx = C.ctx;
const DIFF = { easy: .78, normal: 1, hard: 1.3 };
const LEN = { car: 1.4, van: 1.75, truck: 2.7 };
const COLORS = ['#e74c3c', '#3498db', '#f1c40f', '#9b59b6', '#2ecc71', '#e67e22', '#ecf0f1', '#1abc9c'];
const P = settings([
  { id: 'sound', label: 'Sound', type: 'check', def: true },
  { id: 'lives', label: 'Lives (1 to 9)', type: 'range', min: 1, max: 9, def: 3 },
  { id: 'diff', label: 'Traffic speed', type: 'select', options: [['easy', 'Easy'], ['normal', 'Normal'], ['hard', 'Hard']], def: 'normal' },
  { id: 'creep', label: 'Fox chases you', type: 'check', def: true },
  { id: 'rival', label: 'Rival chicken', type: 'check', def: true },
  { id: 'rivers', label: 'Rivers (from row 25)', type: 'check', def: true },
  { id: 'rails', label: 'Trains (from row 35)', type: 'check', def: true },
  { id: 'night', label: 'Day and night', type: 'check', def: true },
  { id: 'unlockAll', label: 'Unlock all chickens', type: 'check', def: false, noRandom: true }
], st, $('panel'), () => { S.save(); syncLives(); });

/* ---------- small drawing helpers ---------- */
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
const spr = {};
const sprite = (key, w, h, fn) => spr[key] || (spr[key] = KIT.cache(w * 2, h * 2, g => { g.scale(2, 2); fn(g, w, h); }));
const blit = (img, x, y, w, h) => ctx.drawImage(img, x, y, w, h);

function grassSprite(v) { return sprite('grass' + v, W, TS, (g, w, h) => {
  g.fillStyle = v ? '#5aa844' : '#64b24c'; g.fillRect(0, 0, w, h);
  const r = rng.fromString('grass' + v);
  for (let i = 0; i < 26; i++) { const x = r() * w, y = r() * h; g.strokeStyle = 'rgba(30,90,30,.35)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y - 6); g.moveTo(x, y); g.lineTo(x + 2, y - 6); g.stroke(); }
  for (let i = 0; i < 5; i++) { g.fillStyle = ['#fff', '#ffd34d', '#ff8fa3'][i % 3]; g.beginPath(); g.arc(r() * w, r() * h, 2, 0, 7); g.fill(); }
}); }
const roadSprite = () => sprite('road', W, TS, (g, w, h) => {
  g.fillStyle = '#3b3f46'; g.fillRect(0, 0, w, h); const r = rng.fromString('road');
  for (let i = 0; i < 90; i++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.12)'; g.fillRect(r() * w, r() * h, 2 + r() * 3, 1.5); }
});
const treeSprite = () => sprite('tree', TS, TS, (g, w, h) => {
  g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(30, 50, 20, 7, 0, 0, 7); g.fill();
  g.fillStyle = '#7a4b25'; g.fillRect(26, 30, 8, 20);
  g.fillStyle = '#2f7d32'; g.beginPath(); g.arc(30, 24, 20, 0, 7); g.fill();
  g.fillStyle = '#3f9b43'; g.beginPath(); g.arc(24, 18, 12, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.arc(22, 14, 6, 0, 7); g.fill();
});
const rockSprite = () => sprite('rock', TS, TS, (g, w, h) => {
  g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(30, 46, 20, 7, 0, 0, 7); g.fill();
  g.fillStyle = '#8c9199'; g.beginPath(); g.ellipse(30, 36, 19, 14, 0, 0, 7); g.fill();
  g.fillStyle = '#aab0b8'; g.beginPath(); g.ellipse(25, 31, 10, 7, -.3, 0, 7); g.fill();
});
function carSprite(kind, color) { const len = LEN[kind]; return sprite('car|' + kind + color, len * TS, TS, (g, w, h) => {
  g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, 4, h * .3 + 5, w - 8, h * .5, 10); g.fill();
  g.fillStyle = '#15171b'; [[w * .16], [w * .62]].forEach(([x]) => { rr(g, x, h * .14, 15, 8, 3); g.fill(); rr(g, x, h * .78, 15, 8, 3); g.fill(); });
  if (kind === 'truck') {
    const cw = w * .27;
    g.fillStyle = '#e9edf0'; rr(g, 2, h * .2, w - cw - 4, h * .58, 6); g.fill();
    g.fillStyle = color; g.fillRect(2, h * .2 + h * .58 * .42, w - cw - 4, h * .12);
    g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(2, h * .2 + h * .58 * .8, w - cw - 4, h * .12);
    g.fillStyle = color; rr(g, w - cw - 2, h * .25, cw, h * .5, 8); g.fill();
    g.fillStyle = '#bfe3ff'; rr(g, w - cw * .52, h * .31, cw * .38, h * .38, 4); g.fill();
  } else {
    g.fillStyle = color; rr(g, 2, h * .2, w - 4, h * .58, 11); g.fill();
    g.fillStyle = 'rgba(0,0,0,.16)'; rr(g, 2, h * .6, w - 4, h * .18, 8); g.fill();
    g.fillStyle = 'rgba(255,255,255,.28)'; rr(g, w * (kind === 'van' ? .12 : .2), h * .27, w * (kind === 'van' ? .66 : .46), h * .42, 8); g.fill();
    g.fillStyle = '#bfe3ff'; rr(g, w * (kind === 'van' ? .68 : .6), h * .3, w * .13, h * .36, 4); g.fill();
    g.fillStyle = '#23303d'; rr(g, w * (kind === 'van' ? .09 : .17), h * .3, w * .1, h * .36, 3); g.fill();
  }
  g.fillStyle = '#ffe9a0'; g.fillRect(w - 5, h * .28, 4, 8); g.fillRect(w - 5, h * .56, 4, 8);
  g.fillStyle = '#ff3b3b'; g.fillRect(1, h * .28, 3, 8); g.fillRect(1, h * .56, 3, 8);
}); }


/* ---------- more art: water, logs, rails, train ---------- */
const TL = 14; // train length in tiles
const waterSprite = () => sprite('water', W, TS, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3a97df'); gr.addColorStop(1, '#2c7dc6'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  [[14, 0], [32, 40], [48, 70]].forEach(([y, off]) => { g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 2; g.beginPath();
    for (let x = -90 + off; x <= w + 90; x += 90) { g.moveTo(x, y); g.quadraticCurveTo(x + 22, y - 5, x + 45, y); g.quadraticCurveTo(x + 68, y + 5, x + 90, y); } g.stroke(); });
});
const logSprite = len => sprite('log' + len, len * TS, TS, (g, w, h) => {
  g.fillStyle = 'rgba(8,40,80,.28)'; rr(g, 4, h * .36, w - 8, h * .5, 14); g.fill();
  g.fillStyle = '#7d5128'; rr(g, 2, h * .17, w - 4, h * .6, 16); g.fill();
  g.fillStyle = '#9a6a38'; rr(g, 6, h * .2, w - 12, h * .22, 10); g.fill();
  const r = rng.fromString('log' + len); g.strokeStyle = 'rgba(60,30,10,.45)'; g.lineWidth = 1.5;
  for (let i = 0; i < len * 5; i++) { const x = 20 + r() * (w - 40), y = h * .3 + r() * h * .34; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 8 + r() * 10, y); g.stroke(); }
  g.fillStyle = '#5f9f45'; for (let i = 0; i < len; i++) { g.beginPath(); g.ellipse(30 + r() * (w - 60), h * .22, 6, 2.5, 0, 0, 7); g.fill(); }
  [14, w - 14].forEach(x => { g.fillStyle = '#d2a366'; g.beginPath(); g.ellipse(x, h * .47, 8, h * .28, 0, 0, 7); g.fill(); g.strokeStyle = '#8a5a2b'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(x, h * .47, 4.5, h * .16, 0, 0, 7); g.stroke(); });
});
const railSprite = () => sprite('rail', W, TS, (g, w, h) => {
  g.fillStyle = '#756c62'; g.fillRect(0, 0, w, h); const r = rng.fromString('rail');
  for (let i = 0; i < 110; i++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.14)'; g.fillRect(r() * w, r() * h, 2 + r() * 3, 2); }
  g.fillStyle = '#4e3b2a'; for (let x = 6; x < w; x += 26) g.fillRect(x, 10, 9, 40);
  [21, 37].forEach(y => { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, y + 2, w, 4); g.fillStyle = '#c3c8cf'; g.fillRect(0, y, w, 3.5); });
});
const trainSprite = () => sprite('train', TL * TS, TS, (g, w, h) => {
  g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, 4, h * .34, w - 8, h * .52, 10); g.fill();
  const car = 160, gap = 8; let x = 2;
  for (let i = 0; i < 4; i++) {
    g.fillStyle = '#d3d7dd'; rr(g, x, h * .14, car, h * .64, 9); g.fill();
    g.fillStyle = '#e0483a'; g.fillRect(x, h * .5, car, h * .1);
    g.fillStyle = 'rgba(255,255,255,.4)'; rr(g, x + 3, h * .17, car - 6, h * .1, 5); g.fill();
    g.fillStyle = '#2b4a6b'; for (let k = 0; k < 4; k++) rr(g, x + 12 + k * 36, h * .29, 26, h * .17, 3), g.fill();
    x += car + gap;
  }
  g.fillStyle = '#1f5fb4'; rr(g, x, h * .12, w - x - 2, h * .68, 14); g.fill();
  g.fillStyle = '#fff'; g.fillRect(x, h * .5, w - x - 2, h * .09);
  g.fillStyle = '#bfe3ff'; rr(g, w - 62, h * .24, 30, h * .2, 4); g.fill();
  g.fillStyle = '#ffe9a0'; g.fillRect(w - 7, h * .22, 5, 9); g.fillRect(w - 7, h * .52, 5, 9);
});

/* ---------- chickens: 8 looks, all drawn by code ---------- */
const SKINS = [
  { id: 'classic', name: 'Classic', need: 0 }, { id: 'pirate', name: 'Eye Patch', need: 0 }, { id: 'nerd', name: 'Big Specs', need: 0 },
  { id: 'slim', name: 'Slim Jim', need: 25 }, { id: 'shades', name: 'Cool Shades', need: 60 }, { id: 'chonky', name: 'Chonky', need: 120 },
  { id: 'ninja', name: 'Ninja', need: 250 }, { id: 'golden', name: 'Golden Hen', need: 500 }
];
const skinOf = id => SKINS.find(k => k.id === id) || SKINS[0];
const unlocked = k => st.unlockAll || st.totalCorn >= k.need;
const PAL_YOU = { body: '#fff', edge: '#d8dde2', wing: '#eef1f4', wedge: '#cfd5db', band: null };
const PAL_RIVAL = { body: '#d99a5b', edge: '#a9692f', wing: '#c0793a', wedge: '#8f5622', band: '#2f6fdb' };
const PAL_GOLD = { body: '#ffd54a', edge: '#c99a00', wing: '#f5c62a', wedge: '#b58900', band: null };
function drawChickenG(g, x, y, o) {
  const sk = o.skin || 'classic', dead = !!o.dead, hh = o.hh || 0, face = o.face || 1, k = o.k || 1, t = o.t || 0;
  const sxy = sk === 'slim' ? [.74, 1.1] : sk === 'chonky' ? [1.22, 1.1] : [1, 1], pal = o.pal || (sk === 'golden' ? PAL_GOLD : PAL_YOU), sq = o.sq == null ? 1 : o.sq;
  g.save();
  g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(x, y + 18 * k, (17 * sxy[0] - hh * .25) * k, (6 - hh * .1) * k, 0, 0, 7); g.fill();
  g.translate(x, y - hh * k); g.scale(face * (dead ? 1.5 : sxy[0]) * k, (dead ? .28 : sq * (1 + (1 - sq) * .5) * sxy[1]) * k);
  if (dead) g.translate(0, 38);
  g.strokeStyle = '#f08a24'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(-5, 10); g.lineTo(-6, 19); g.moveTo(5, 10); g.lineTo(6, 19); g.stroke();
  g.fillStyle = '#f08a24'; g.fillRect(-9, 18, 7, 3); g.fillRect(3, 18, 7, 3);
  g.fillStyle = pal.body; g.beginPath(); g.ellipse(-12, -2, 7, 5, -.6, 0, 7); g.fill(); g.beginPath(); g.ellipse(-8, -8, 6, 4, -.9, 0, 7); g.fill();
  g.strokeStyle = pal.edge; g.lineWidth = 1.5; g.beginPath(); g.ellipse(0, 2, 16, 13, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = pal.wing; g.beginPath(); g.ellipse(-3, 4, 9, 6, -.25, 0, 7); g.fill(); g.strokeStyle = pal.wedge; g.stroke();
  g.fillStyle = pal.body; g.strokeStyle = pal.edge; g.beginPath(); g.arc(9, -10, 8, 0, 7); g.fill(); g.stroke();
  if (pal.band) { g.fillStyle = pal.band; g.beginPath(); g.ellipse(6, -3, 6, 2.6, .5, 0, 7); g.fill(); }
  if (sk === 'chonky') { g.fillStyle = 'rgba(255,120,150,.45)'; g.beginPath(); g.arc(9, -6, 2.6, 0, 7); g.fill(); }
  g.fillStyle = '#e53935'; [[7, -19, 3.5], [11, -18, 3.2], [4, -17, 3]].forEach(([a, b, r]) => { g.beginPath(); g.arc(a, b, r, 0, 7); g.fill(); });
  g.beginPath(); g.ellipse(15, -4, 2.5, 3.5, 0, 0, 7); g.fill();
  g.fillStyle = '#ffb300'; g.beginPath(); g.moveTo(15, -12); g.lineTo(22, -9); g.lineTo(15, -7); g.closePath(); g.fill();
  if (dead) { g.strokeStyle = '#222'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(8, -14); g.lineTo(12, -10); g.moveTo(12, -14); g.lineTo(8, -10); g.stroke(); }
  else if (sk !== 'pirate') { const big = sk === 'nerd'; g.fillStyle = big ? '#fff' : '#111'; g.beginPath(); g.arc(11, -11, big ? 3.6 : 1.9, 0, 7); g.fill();
    if (big) { g.fillStyle = '#111'; g.beginPath(); g.arc(11.6, -11, 2.2, 0, 7); g.fill(); } g.fillStyle = '#fff'; g.beginPath(); g.arc(11.6, -11.7, .6, 0, 7); g.fill(); }
  if (sk === 'pirate') {
    g.strokeStyle = '#111'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(3.5, -16.5); g.lineTo(16.5, -6.5); g.stroke();
    g.fillStyle = '#111'; g.beginPath(); g.ellipse(11, -11, 4.2, 3.8, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.arc(10, -12.2, 1, 0, 7); g.fill();
  } else if (sk === 'nerd') {
    g.fillStyle = 'rgba(190,225,255,.5)'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 3.6; g.beginPath(); g.arc(11, -11, 6.8, 0, 7); g.fill(); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.moveTo(4.4, -11.5); g.lineTo(-.5, -12.5); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1.4; g.beginPath(); g.arc(11, -11, 4.4, 3.6, 4.5); g.stroke();
  } else if (sk === 'shades') {
    g.fillStyle = '#111'; rr(g, 5, -15.5, 12.5, 7, 2.5); g.fill(); g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(8, -14.5, 3.2, 1.6);
    g.strokeStyle = '#111'; g.lineWidth = 2; g.beginPath(); g.moveTo(5, -12.5); g.lineTo(-.5, -12.8); g.stroke();
  } else if (sk === 'ninja') {
    const f = Math.sin(t * 9) * 2; g.strokeStyle = '#1f2a5a'; g.lineWidth = 3.6; g.lineCap = 'butt'; g.beginPath(); g.moveTo(1.6, -14); g.lineTo(16.8, -8.6); g.stroke();
    g.fillStyle = '#1f2a5a'; g.beginPath(); g.moveTo(2, -14); g.lineTo(-9, -17 + f); g.lineTo(-6, -13 + f); g.lineTo(-10, -10 + f * 1.5); g.lineTo(2, -11); g.closePath(); g.fill();
    g.strokeStyle = '#222'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(8, -16); g.lineTo(14.5, -14); g.stroke();
  } else if (sk === 'golden') {
    g.fillStyle = '#ffd54a'; g.strokeStyle = '#b58900'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(3, -20); g.lineTo(4, -27); g.lineTo(7, -23); g.lineTo(9.5, -28); g.lineTo(12, -23); g.lineTo(15, -27); g.lineTo(15.5, -20); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#fff'; [[-14, -6, 0], [14, 8, 2], [-2, -16, 4]].forEach(([a, b, ph]) => { const s2 = 1.5 + Math.sin(t * 5 + ph) * 1.1; g.fillRect(a - s2, b - .6, s2 * 2, 1.2); g.fillRect(a - .6, b - s2, 1.2, s2 * 2); });
  }
  g.restore();
}
function drawPwG(g, kind, x, y, k) {
  g.save(); g.translate(x, y); g.scale(k || 1, k || 1);
  const col = kind === 'shield' ? '120,200,255' : kind === 'magnet' ? '255,120,120' : '255,120,170';
  const gl = g.createRadialGradient(0, 0, 2, 0, 0, 24); gl.addColorStop(0, 'rgba(' + col + ',.55)'); gl.addColorStop(1, 'rgba(' + col + ',0)'); g.fillStyle = gl; g.beginPath(); g.arc(0, 0, 24, 0, 7); g.fill();
  if (kind === 'shield') { g.fillStyle = '#3d8bff'; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -13); g.lineTo(11, -8); g.quadraticCurveTo(11, 7, 0, 14); g.quadraticCurveTo(-11, 7, -11, -8); g.closePath(); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(-1.5, -8, 3, 16); }
  else if (kind === 'magnet') { g.lineWidth = 6; g.lineCap = 'butt'; g.strokeStyle = '#e53935'; g.beginPath(); g.arc(0, 0, 8, Math.PI, 0); g.lineTo(8, 9); g.moveTo(-8, 0); g.lineTo(-8, 9); g.stroke(); g.fillStyle = '#fff'; g.fillRect(-11, 8, 6, 5); g.fillRect(5, 8, 6, 5); }
  else { g.fillStyle = '#ff4d79'; g.beginPath(); g.moveTo(0, 11); g.bezierCurveTo(-17, -2, -8, -15, 0, -6); g.bezierCurveTo(8, -15, 17, -2, 0, 11); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(-6, -6, 3, 2, -.6, 0, 7); g.fill(); }
  g.restore();
}

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

buildSkins(); newWorld(rng.dailySeed('title'), false); s.state = 'title'; syncLives(); L.start(); hud();
KIT.hook({ start: startGame, hop, update, die, carX, logX, laneAt, hazard, hitsIn: hazard, supportAt, trainState, blocked, spawnRival, placeC, killC, st, SKINS, unlocked, get s() { return s; }, get score() { return score(); }, DIFF, COLS, LEN });
})();
