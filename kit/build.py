#!/usr/bin/env python3
"""Build one chapter from the kit.
usage: python3 build.py projects/ch14 [out.html]
A project folder holds: meta.json, body.html, game.css, game.js
Optional: extra.json {"files":[...]} to inline more scripts (for example an engine) before game.js.
The kit (js/*.js, css/base.css, template.html) is inlined, so the result is ONE file."""
import json, sys, pathlib, subprocess, re, hashlib, shutil
SW = r"""/* Service worker: lets the game open offline. Version changes on every build so updates reach players. */
const VERSION = '__VERSION__', PREFIX = '__SLUG__-', CACHE = PREFIX + VERSION;
const CORE = ['./', '__NAME__', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', '../style.css'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  if (req.mode === 'navigate') {   // pages: try the network first so updates show, fall back to the saved copy offline
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; }).catch(() => caches.match(req, { ignoreSearch: true }).then(m => m || caches.match('__NAME__') || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(req).then(m => m || fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; }).catch(() => m)));
});
"""
root = pathlib.Path(__file__).parent
proj = pathlib.Path(sys.argv[1])
meta = json.loads((proj / 'meta.json').read_text())
read = lambda p: p.read_text() if p.exists() else ''
kit_js = '\n'.join(f.read_text() for f in sorted((root / 'js').glob('*.js')))
extra = ''
ex = proj / 'extra.json'
if ex.exists():
    for f in json.loads(ex.read_text())['files']:
        extra += (proj / f).read_text() + '\n'
# if the project has a parts/ folder, join its files in name order (a_, b_, c_, d_) instead of using game.js
parts = proj / 'parts'
game_js = '\n'.join(f.read_text() for f in sorted(parts.glob('*.js'))) if parts.exists() else read(proj / 'game.js')
page = (root / 'template.html').read_text()
vals = {
    'NUM': str(meta['num']), 'TITLE': meta['title'], 'SUBTITLE': meta['subtitle'], 'CREDIT': meta.get('credit', ''),
    'BASE_CSS': read(root / 'css' / 'base.css'), 'GAME_CSS': read(proj / 'game.css'),
    'HEAD_EXTRA': '',
    'BODY': read(proj / 'body.html'), 'KIT_JS': kit_js, 'GAME_JS': extra + game_js,
}
pwa = meta.get('pwa')
if pwa:
    vals['HEAD_EXTRA'] = '\n'.join([
        '<link rel="manifest" href="manifest.json">',
        '<meta name="theme-color" content="%s">' % pwa.get('theme', '#0d1117'),
        '<meta name="mobile-web-app-capable" content="yes">',
        '<meta name="apple-mobile-web-app-capable" content="yes">',
        '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
        '<meta name="apple-mobile-web-app-title" content="%s">' % pwa['short_name'],
        '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">',
        '<link rel="icon" type="image/png" href="icons/icon-192.png">'])
for k, v in vals.items():
    page = page.replace('{{' + k + '}}', v.replace('\\', '\\\\') if False else v)
left = re.findall(r'\{\{[A-Z_]+\}\}', page)
if left: sys.exit('unfilled placeholders: ' + ', '.join(left))
out = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else root / 'out' / f"chapter{meta['num']}.html")
out.write_text(page)
if pwa:
    odir = out.parent; ver = hashlib.sha1(page.encode()).hexdigest()[:10]
    manifest = {'name': pwa['name'], 'short_name': pwa['short_name'], 'description': meta.get('subtitle', ''), 'start_url': './', 'scope': './', 'display': 'standalone',
        'orientation': pwa.get('orientation', 'portrait'), 'background_color': pwa.get('bg', '#0d1117'), 'theme_color': pwa.get('theme', '#0d1117'),
        'icons': [{'src': 'icons/icon-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any'}, {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'},
                  {'src': 'icons/maskable-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'}]}
    (odir / 'manifest.json').write_text(json.dumps(manifest, indent=2))
    slug = re.sub(r'[^a-z0-9]+', '', pwa['short_name'].lower())
    (odir / 'sw.js').write_text(SW.replace('__SLUG__', slug).replace('__VERSION__', ver).replace('__NAME__', out.name))
    (odir / 'icons').mkdir(exist_ok=True)
    for f in (proj / pwa.get('icons_dir', 'pwa')).glob('*.png'): shutil.copy(f, odir / 'icons' / f.name)
    print('  + manifest.json, sw.js (version %s), icons/ in %s' % (ver, odir))
# syntax-check all the JS that went in (a syntax error = blank page)
tmp = root / 'out' / '_check.js'
tmp.write_text(kit_js + '\n' + vals['GAME_JS'])
import shutil
if shutil.which('node'):
    r = subprocess.run(['node', '--check', str(tmp)], capture_output=True, text=True)
    if r.returncode: tmp.unlink(); sys.exit('JS syntax error:\n' + r.stderr)
else:
    print('(node not installed: skipped the JS syntax check. Open the page and look at the browser console instead)')
tmp.unlink()
print(f'built {out}  ({out.stat().st_size/1024:.1f} KB, kit {len(kit_js)/1024:.1f} KB)')
