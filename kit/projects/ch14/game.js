/* 2048 on the kit: only the game rules live here. Theme, storage, keys, swipe, overlays come from KIT. */
(() => {
const { $, store, ui, input } = KIT;
const S = store('kevinhyhau.ch14.v1', { dark: true, n: 4, best: { 4: 0, 5: 0, 6: 0 }, game: null }), st = S.st;
ui.theme($('themeBtn'), st, S.save);
const O = ui.overlays(['ovWin', 'ovLose']);

let N = st.n, tiles = [], score = 0, over = false, won = false, keepGoing = false, hist = [], uid = 1, busy = false;
const board = $('board'), tl = $('tiles');
const cls = v => 'tile v' + (v > 2048 ? 'big' : v);
function build() {
  board.style.setProperty('--n', N); board.style.setProperty('--gap', N === 4 ? '10px' : N === 5 ? '8px' : '6px');
  $('grid').innerHTML = '<i></i>'.repeat(N * N); tl.innerHTML = '';
  document.querySelectorAll('.sizes .btn').forEach(b => b.classList.toggle('on', +b.dataset.n === N));
}
function place(t) { t.el.style.setProperty('--r', t.r); t.el.style.setProperty('--c', t.c); }
function mkTile(v, r, c, isNew) {
  const t = { id: uid++, v, r, c, el: document.createElement('div') }; t.el.className = cls(v) + (isNew ? ' new' : ''); t.el.innerHTML = '<div>' + v + '</div>'; place(t); tl.appendChild(t.el); tiles.push(t); return t;
}
const grid = () => { const g = Array.from({ length: N }, () => Array(N).fill(null)); tiles.forEach(t => g[t.r][t.c] = t); return g; };
function addRandom() {
  const g = grid(), free = []; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!g[r][c]) free.push([r, c]);
  if (!free.length) return; const [r, c] = free[Math.floor(Math.random() * free.length)]; mkTile(Math.random() < .9 ? 2 : 4, r, c, true);
}
const snapshot = () => ({ t: tiles.map(t => [t.v, t.r, t.c]), score });
function restore(s) { tl.innerHTML = ''; tiles = []; s.t.forEach(([v, r, c]) => mkTile(v, r, c, false)); score = s.score; }
function persist() { st.game = { N, t: tiles.map(t => [t.v, t.r, t.c]), score, won, keepGoing, over }; S.save(); }
function updHud() { KIT.setText($('sc'), score); if (score > (st.best[N] || 0)) st.best[N] = score; KIT.setText($('best'), st.best[N] || 0); $('undo').disabled = !hist.length || over; }
function canMove() {
  const g = grid(); for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const t = g[r][c]; if (!t) return true; if (c < N - 1 && g[r][c + 1] && g[r][c + 1].v === t.v) return true; if (r < N - 1 && g[r + 1][c] && g[r + 1][c].v === t.v) return true; } return false;
}
function move(dir) { // 0 left, 1 up, 2 right, 3 down
  if (over || busy || O.open('ovWin')) return false;
  const before = snapshot(), g = grid(); let moved = false, gained = 0; const dead = [], pops = [];
  for (let i = 0; i < N; i++) {
    const line = []; for (let j = 0; j < N; j++) { const r = dir === 0 || dir === 2 ? i : dir === 1 ? j : N - 1 - j, c = dir === 1 || dir === 3 ? i : dir === 0 ? j : N - 1 - j; line.push([r, c, g[r][c]]); }
    let k = 0, last = null;
    for (let j = 0; j < N; j++) { const t = line[j][2]; if (!t) continue;
      if (last && last.v === t.v && !last.merged) { t.r = last.r; t.c = last.c; last.v *= 2; last.merged = true; gained += last.v; dead.push(t); pops.push(last); moved = true; last = null; continue; }
      const [tr, tc] = line[k]; if (t.r !== tr || t.c !== tc) moved = true; t.r = tr; t.c = tc; last = t; k++; }
  }
  if (!moved) { tiles.forEach(t => t.merged = false); return false; }
  hist.push(before); if (hist.length > 30) hist.shift(); score += gained;
  tiles.forEach(place); busy = true;
  if (gained) { const f = KIT.el('div', { class: 'pts' }, '+' + gained); $('sc').appendChild(f); setTimeout(() => f.remove(), 650); }
  setTimeout(() => {
    dead.forEach(t => { t.el.remove(); tiles = tiles.filter(x => x !== t); });
    pops.forEach(t => { t.el.className = cls(t.v) + ' pop'; t.el.firstChild.textContent = t.v; });
    tiles.forEach(t => t.merged = false); addRandom(); busy = false; updHud();
    if (!won && !keepGoing && tiles.some(t => t.v >= 2048)) { won = true; O.show('ovWin'); }
    if (!canMove()) { over = true; $('loseTxt').textContent = 'Score ' + score + ' · best tile ' + Math.max(...tiles.map(t => t.v)); O.show('ovLose'); }
    updHud(); persist();
  }, 140);
  return true;
}
function newGame(n) {
  if (n) { N = n; st.n = n; } over = false; won = false; keepGoing = false; hist = []; score = 0; tiles = []; uid = 1; busy = false;
  O.hideAll(); build(); addRandom(); addRandom(); updHud(); persist();
}
function undo() { if (busy || !hist.length) return; restore(hist.pop()); over = false; O.hide('ovLose'); updHud(); persist(); }

ui.actions(document.body, {
  new: () => newGame(), undo,
  keep: () => { keepGoing = true; O.hide('ovWin'); persist(); board.focus(); },
  size: b => newGame(+b.dataset.n)
});
input.keys({ ArrowLeft: 0, a: 0, ArrowUp: 1, w: 1, ArrowRight: 2, d: 2, ArrowDown: 3, s: 3 }, move);
window.addEventListener('keydown', e => { if (e.key === 'z' || e.key === 'Z') undo(); });
input.swipe(board, move, 24);

// start: resume the saved game if there is one
build();
const g0 = st.game;
if (g0 && g0.N === N && Array.isArray(g0.t) && g0.t.length && !g0.over) { score = g0.score || 0; won = !!g0.won; keepGoing = !!g0.keepGoing; g0.t.forEach(([v, r, c]) => mkTile(v, r, c, false)); updHud(); }
else newGame();

KIT.hook({ move, newGame, get tiles() { return tiles.map(t => [t.v, t.r, t.c]); }, set(arr) { tl.innerHTML = ''; tiles = []; arr.forEach(([v, r, c]) => mkTile(v, r, c, false)); }, get score() { return score; }, get over() { return over; } });
})();
