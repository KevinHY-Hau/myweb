/* KIT core: namespace + tiny helpers. Everything else hangs off window.KIT. */
(function (g) {
  const KIT = g.KIT = g.KIT || {};
  KIT.$ = id => document.getElementById(id);
  KIT.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  KIT.lerp = (a, b, t) => a + (b - a) * t;
  /* setText: touch the DOM only when the text really changed */
  KIT.setText = (el, v) => { v = String(v); if (el._t !== v) { el._t = v; el.textContent = v; } };
  /* el('div', {class:'x'}, 'text') */
  KIT.el = (tag, attrs, html) => { const e = document.createElement(tag); for (const k in (attrs || {})) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; };
})(window);
