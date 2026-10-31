# Chapter kit

A small shared toolbox (about 12 KB) for single-file chapters. Not a framework: pick what you need.

## Use it
1. `cp -r projects/starter projects/ch16`
2. Edit `meta.json`, `body.html`, `game.css`, `game.js`
3. `python3 build.py projects/ch16` -> `out/chapter16.html` (one file, kit inlined, JS syntax-checked)

## Modules (js/, all under `window.KIT`)
| Module | What it gives you |
|---|---|
| core | `$`, `clamp`, `lerp`, `el`, `setText` |
| store | safe localStorage that never throws |
| rng | seeded random, `daily()`, `shuffle`, `pick` |
| loop | animation loop, capped dt, pauses when tab hidden |
| canvas | fixed logical size, retina sharp, `cache()` paint-once |
| sfx | synthesised beep, slide, noise; starts on first tap |
| settings | panel + saved data + Randomise from one schema |
| ui | theme toggle, toast, overlays, one `data-act` click handler |
| input | key table, swipe, pointer, test hook `window.__g` |

`css/base.css` has the fallback site variables, buttons, overlay card, settings rows, toast and the opacity-only fade fix.

## Rules
- Extract new code into the kit only after it appears in 3 games.
- Never edit an old chapter just to use the kit.
- Change the kit = rebuild only the chapters you are touching.
