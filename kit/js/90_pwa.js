/* KIT.pwa: make a page behave like an installed app.
   KIT.pwa.register('sw.js')   offline support (needs https or localhost)
   KIT.pwa.hint(el)            shows el on iPhone/iPad Safari when not installed ("Share, Add to Home Screen")
   KIT.pwa.installButton(btn)  shows btn on Android/Chrome when the browser offers to install
   When opened from the home screen the <html> gets class "app" (CSS hides the site header there). */
(function () {
  const ua = navigator.userAgent || '';
  const ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = !!(navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches));
  if (standalone) document.documentElement.classList.add('app');
  let deferred = null;
  KIT.pwa = {
    ios, app: standalone,
    register(url) { if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) window.addEventListener('load', () => navigator.serviceWorker.register(url || 'sw.js').catch(() => {})); },
    hint(el) { if (el && ios && !standalone) el.style.display = ''; },
    installButton(btn) {
      if (!btn) return;
      window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; btn.style.display = ''; });
      btn.addEventListener('click', () => { if (!deferred) return; deferred.prompt(); deferred = null; btn.style.display = 'none'; });
      window.addEventListener('appinstalled', () => { btn.style.display = 'none'; });
    }
  };
})();
