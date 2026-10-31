/* KIT.ui: theme switch, toast, overlay cards, delegated button actions. */
(function () {
  const $ = KIT.$;
  KIT.ui = {
    /* theme(btn, st, save): st.dark true/false, toggled by a button */
    theme(btn, st, save) {
      const apply = () => { document.documentElement.dataset.theme = st.dark === false ? 'light' : 'dark'; btn.textContent = st.dark === false ? '☀️ Light' : '🌙 Dark'; };
      btn.onclick = () => { st.dark = st.dark === false; apply(); save && save(); }; apply();
    },
    /* toast('Saved') - small message that fades away */
    toast(msg, ms) {
      let t = $('kitToast'); if (!t) { t = KIT.el('div', { id: 'kitToast', class: 'kit-toast' }); document.body.appendChild(t); }
      t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), ms || 1800);
    },
    /* overlays(ids): show/hide cards that use class .ov  ->  O.show('ovWin'), O.hide('ovWin'), O.hideAll(), O.open('ovWin') */
    overlays(ids) {
      const O = { show(id) { $(id).classList.add('show'); }, hide(id) { $(id).classList.remove('show'); }, open: id => $(id).classList.contains('show'),
        hideAll() { ids.forEach(i => $(i).classList.remove('show')); } };
      return O;
    },
    /* actions(root, {again(){...}, home(){...}}): one click handler for every [data-act] button */
    actions(root, table) {
      root.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && table[b.dataset.act]) table[b.dataset.act](b, e); });
    }
  };
})();
