/* KIT.store: safe localStorage. Never throws. Merges saved data over defaults.
   const S = KIT.store('kevinhyhau.ch15.v1', {best:0});  S.st.best = 5;  S.save(); */
(function () {
  KIT.store = function (key, defaults) {
    const st = JSON.parse(JSON.stringify(defaults || {}));
    try { Object.assign(st, JSON.parse(localStorage.getItem(key) || '{}')); } catch (e) {}
    const save = () => { try { localStorage.setItem(key, JSON.stringify(st)); } catch (e) {} };
    const reset = () => { try { localStorage.removeItem(key); } catch (e) {} };
    return { st, save, reset };
  };
})();
