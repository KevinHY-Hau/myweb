/* KIT.rng: seeded random numbers (mulberry32). Same seed = same sequence. */
(function () {
  const mulberry = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  KIT.rng = {
    mulberry, hash,
    fromString: s => mulberry(hash(String(s))),
    /* daily(): everyone gets the same generator on the same (UTC) date */
    dailySeed: (salt) => hash((salt || '') + new Date().toISOString().slice(0, 10)),
    daily: salt => mulberry(KIT.rng.dailySeed(salt)),
    int: (r, n) => Math.floor(r() * n),
    pick: (r, arr) => arr[Math.floor(r() * arr.length)],
    shuffle: (r, arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  };
})();
