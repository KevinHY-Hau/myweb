
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
