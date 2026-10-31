#!/usr/bin/env python3
"""Turn any finished single-file chapter into an installable app (PWA).
usage: python3 tools/pwaify.py chapter12.html out/chap12 --name "Three Kingdoms Battle" --short "3K Battle" --icons projects/ch12/pwa [--theme #0d1117] [--orientation any]
Writes out/chap12/index.html (+ manifest.json, sw.js, icons/). Copy the whole folder to your site."""
import argparse, pathlib, re, json, hashlib, shutil, sys
ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('outdir')
ap.add_argument('--name', required=True); ap.add_argument('--short', required=True); ap.add_argument('--icons', required=True)
ap.add_argument('--theme', default='#0d1117'); ap.add_argument('--orientation', default='any'); ap.add_argument('--desc', default='')
a = ap.parse_args()
build = (pathlib.Path(__file__).parent.parent / 'build.py').read_text()
SW = re.search(r'SW = r"""(.*?)"""', build, re.S).group(1)
page = pathlib.Path(a.src).read_text(encoding='utf8')
head = '\n'.join(['<link rel="manifest" href="manifest.json">', '<meta name="theme-color" content="%s">' % a.theme,
  '<meta name="mobile-web-app-capable" content="yes">', '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">', '<meta name="apple-mobile-web-app-title" content="%s">' % a.short,
  '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">', '<link rel="icon" type="image/png" href="icons/icon-192.png">'])
css = """<style id="pwaCss">
html.app{overscroll-behavior:none}
html.app body{padding-top:calc(.5rem + env(safe-area-inset-top));padding-bottom:calc(.6rem + env(safe-area-inset-bottom));padding-left:calc(.6rem + env(safe-area-inset-left));padding-right:calc(.6rem + env(safe-area-inset-right))}
html.app header{margin-bottom:.5rem}
html.app header h1,html.app header p,html.app header br,html.app .tools{display:none}
html.app header h2.ch{font-size:1.1rem;margin:0}
html.app .fab{bottom:calc(14px + env(safe-area-inset-bottom))}
html.app body.hasfab .cmdwin{bottom:calc(68px + env(safe-area-inset-bottom))!important}
html{-webkit-tap-highlight-color:transparent}
#pwaHint{position:fixed;left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));z-index:200;display:none;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:#161b22;color:#e6edf3;border:1px solid rgba(255,255,255,.15);box-shadow:0 8px 28px rgba(0,0,0,.5);font:14px/1.35 system-ui,sans-serif}
#pwaHint button{margin-left:auto;border:0;border-radius:8px;padding:6px 10px;font:inherit;font-weight:700;background:#f59e0b;color:#111}
</style>"""
js = """<div id="pwaHint" role="status"><span>📲 To install: tap <b>Share</b> ⬆ then <b>Add to Home Screen</b></span><button type="button" id="pwaHintX">OK</button></div>
<script>
(function(){
  var ua=navigator.userAgent, ios=/iP(hone|ad|od)/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  var app=(window.navigator.standalone===true)||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches);
  if(app) document.documentElement.classList.add('app');
  if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})});
  var h=document.getElementById('pwaHint'),x=document.getElementById('pwaHintX'),seen=false;
  try{seen=localStorage.getItem('pwaHint.seen')==='1'}catch(e){}
  if(h&&ios&&!app&&!seen){setTimeout(function(){h.style.display='flex'},2500)}
  if(x)x.onclick=function(){h.style.display='none';try{localStorage.setItem('pwaHint.seen','1')}catch(e){}};
})();
</script>"""
marker = '<link rel="stylesheet" href="../style.css">'
assert page.count(marker) == 1, 'style link marker not found'
page = page.replace(marker, head + '\n' + marker)
assert page.count('</head>') == 1 and page.count('</body>') == 1
page = page.replace('</head>', css + '\n</head>').replace('</body>', js + '\n</body>')
out = pathlib.Path(a.outdir); (out / 'icons').mkdir(parents=True, exist_ok=True)
(out / 'index.html').write_text(page, encoding='utf8')
ver = hashlib.sha1(page.encode('utf8')).hexdigest()[:10]
man = {'name': a.name, 'short_name': a.short, 'description': a.desc, 'start_url': './', 'scope': './', 'display': 'standalone', 'orientation': a.orientation,
  'background_color': a.theme, 'theme_color': a.theme, 'icons': [
  {'src': 'icons/icon-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any'}, {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'},
  {'src': 'icons/maskable-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'}]}
(out / 'manifest.json').write_text(json.dumps(man, indent=2))
slug = re.sub(r'[^a-z0-9]+', '', a.short.lower())
(out / 'sw.js').write_text(SW.replace('__SLUG__', slug).replace('__VERSION__', ver).replace('__NAME__', 'index.html'))
for f in pathlib.Path(a.icons).glob('*.png'): shutil.copy(f, out / 'icons' / f.name)
print('built', out, 'version', ver)
