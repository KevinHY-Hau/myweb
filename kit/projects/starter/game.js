(() => {
const { $, store, ui, canvas, loop, sfx, settings, rng, input } = KIT;
const S = store('kevinhyhau.ch15.v1', { dark: true, sound: true, speed: 5, size: 14, shape: 'circle' }), st = S.st;
ui.theme($('themeBtn'), st, S.save);
const A = sfx(() => st.sound), O = ui.overlays(['ovTitle']);
const C = canvas($('cv'), 960, 540), ctx = C.ctx;
const bg = KIT.cache(960, 540, g => { const gr = g.createLinearGradient(0, 0, 0, 540); gr.addColorStop(0, '#1b2a41'); gr.addColorStop(1, '#0d1117'); g.fillStyle = gr; g.fillRect(0, 0, 960, 540); });
let ball = { x: 480, y: 100, vy: 0 }, rnd = Math.random, hits = 0;
const P = settings([
  { id: 'sound', label: 'Sound', type: 'check', def: true },
  { id: 'speed', label: 'Gravity', type: 'range', min: 1, max: 10, def: 5 },
  { id: 'size', label: 'Ball size', type: 'range', min: 6, max: 30, def: 14 },
  { id: 'shape', label: 'Shape', type: 'select', options: [['circle', 'Circle'], ['square', 'Square']], def: 'circle' }
], st, $('panel'), () => S.save());
const L = loop(dt => { ball.vy += st.speed * 120 * dt; ball.y += ball.vy * dt; if (ball.y > 520 - st.size) { ball.y = 520 - st.size; ball.vy = -Math.abs(ball.vy) * .8; A.beep(220 + rnd() * 200, .08, 'square', .1); hits++; } },
  () => { ctx.drawImage(bg, 0, 0, 960, 540); ctx.fillStyle = '#f59e0b'; if (st.shape === 'circle') { ctx.beginPath(); ctx.arc(ball.x, ball.y, st.size, 0, 7); ctx.fill(); } else ctx.fillRect(ball.x - st.size, ball.y - st.size, st.size * 2, st.size * 2); });
L.onHide = () => { O.show('ovTitle'); };
input.pointer($('cv'), { down(p) { ball.x = p.x; ball.y = p.y; ball.vy = -300; A.slide(400, 800, .1, 'sine'); } }, C.pos);
ui.actions(document.body, {
  play: () => { O.hide('ovTitle'); L.paused = false; L.start(); },
  rand: () => P.randomise(rnd),
  daily: () => { rnd = rng.daily('starter'); P.randomise(rnd); ui.toast('Daily settings loaded'); }
});
KIT.hook({ L, ball, st, get hits() { return hits; }, P });
})();
