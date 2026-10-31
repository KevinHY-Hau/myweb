/* Chicken Cross Road, drop 1: endless road, hop, cars, corn, fox creep. Built on KIT. */
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

