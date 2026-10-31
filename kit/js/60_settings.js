/* KIT.settings: one schema describes the whole settings panel, the saved data and the Randomise button.
   schema item: {id, label, type:'range'|'check'|'select', min, max, step, options:[[value,label]], def, show:(st)=>bool}
   const P = KIT.settings(schema, S.st, $('panel'), () => { S.save(); apply(); });  P.randomise(); P.refresh(); */
(function () {
  KIT.settings = function (schema, st, host, onChange) {
    const rows = {};
    schema.forEach(s => { if (st[s.id] === undefined) st[s.id] = s.def; });
    /* clamp everything against the schema so bad saved data can't break the game */
    function sanitise() { schema.forEach(s => {
      if (s.type === 'range') st[s.id] = KIT.clamp(+st[s.id] || 0, s.min, s.max);
      else if (s.type === 'check') st[s.id] = !!st[s.id];
      else if (s.type === 'select' && !s.options.some(o => o[0] === st[s.id])) st[s.id] = s.def; }); }
    sanitise();
    schema.forEach(s => {
      const row = KIT.el('label', { class: 'set-row' }); let inp;
      row.appendChild(KIT.el('span', { class: 'set-name' }, s.label));
      if (s.type === 'range') { inp = KIT.el('input', { type: 'range', min: s.min, max: s.max, step: s.step || 1 }); }
      else if (s.type === 'check') { inp = KIT.el('input', { type: 'checkbox' }); }
      else { inp = KIT.el('select', {}, s.options.map(o => `<option value="${o[0]}">${o[1]}</option>`).join('')); }
      inp.addEventListener('input', () => { st[s.id] = s.type === 'check' ? inp.checked : s.type === 'range' ? +inp.value : inp.value; refresh(); onChange && onChange(s.id); });
      row.appendChild(inp); host.appendChild(row); rows[s.id] = { row, inp, s };
    });
    function refresh() { sanitise(); schema.forEach(s => { const r = rows[s.id]; if (s.type === 'check') r.inp.checked = st[s.id]; else r.inp.value = st[s.id];
      r.row.style.display = !s.show || s.show(st) ? '' : 'none'; }); }
    function randomise(r) { r = r || Math.random; schema.forEach(s => { if (s.noRandom) return;
      if (s.type === 'range') { const k = Math.round(r() * ((s.max - s.min) / (s.step || 1))); st[s.id] = s.min + k * (s.step || 1); }
      else if (s.type === 'check') st[s.id] = r() < .5; else st[s.id] = s.options[Math.floor(r() * s.options.length)][0]; }); refresh(); onChange && onChange('*'); }
    refresh();
    return { refresh, randomise, reset() { schema.forEach(s => st[s.id] = s.def); refresh(); onChange && onChange('*'); } };
  };
})();
