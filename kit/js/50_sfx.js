/* KIT.sfx: synthesised sounds, no files. AudioContext starts on the first tap (browsers require that).
   const A = KIT.sfx(() => S.st.sound);   A.beep(440, .1, 'square', .15);  A.noise(.2, .2);  A.slide(800, 200, .3) */
(function () {
  KIT.sfx = function (isOn) {
    let ac = null; const on = () => (isOn ? isOn() : true);
    const get = () => { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (ac && ac.state === 'suspended') ac.resume(); return ac; };
    ['pointerdown', 'keydown'].forEach(ev => window.addEventListener(ev, get, { once: true }));
    const A = {
      get ctx() { return ac; },
      beep(f, d, type, vol, when) { if (!on()) return; const c = get(); if (!c) return; const t = c.currentTime + (when || 0), o = c.createOscillator(), g = c.createGain();
        o.type = type || 'sine'; o.frequency.value = f; g.gain.setValueAtTime(vol == null ? .15 : vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + .02); },
      slide(f1, f2, d, type, vol) { if (!on()) return; const c = get(); if (!c) return; const t = c.currentTime, o = c.createOscillator(), g = c.createGain();
        o.type = type || 'sawtooth'; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + d); g.gain.setValueAtTime(vol == null ? .12 : vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + .02); },
      noise(d, vol) { if (!on()) return; const c = get(); if (!c) return; const n = Math.floor(c.sampleRate * d), b = c.createBuffer(1, n, c.sampleRate), x = b.getChannelData(0);
        for (let i = 0; i < n; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / n); const s = c.createBufferSource(), g = c.createGain(); s.buffer = b; g.gain.value = vol == null ? .2 : vol; s.connect(g).connect(c.destination); s.start(); }
    };
    return A;
  };
})();
