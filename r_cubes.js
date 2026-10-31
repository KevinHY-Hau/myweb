// Floating 3D cubes: p5.js (global mode) version of the R "NFT_cube" animation.
// R plot area is 100 wide x 120 tall (xlim 0-100, ylim -10-110), drawn into a square, so the cubes are slightly stretched; we do the same.

const FPS = 10                 // R used interval = 0.1 s per frame. Raise (e.g. 30) for smoother, faster motion
const BACKGROUND = null        // null = see-through (matches the page). For the R look use [139, 69, 19] (chocolate4)

const TRUE_CUBE = true        // true = proper equal-sided cube; false = the original (taller, narrower) R shape
const CUBE_SIZE = 0.95         // size of the cube when TRUE_CUBE is true (bigger number = bigger cubes)
const UNIT = 5                 // u0: cube size
const NB = 99                  // number of cubes
const COLOUR_CHOICE = ["Oranges", "Blues", "Greens", "Purples", "YlOrRd", "Reds", "OrRd", "Greys", "PuBuGn", "YlGnBu"]
const DIRECTIONS = ["N", "S", "NE", "SE", "NW", "SW"]

// RColorBrewer 9-class palettes, entries 8, 6 and 4 (the R code's [c(8,6,4)]) = right face, left face, top face
const PALETTE = {
  Oranges: ["#A63603", "#F16913", "#FDAE6B"],
  Blues:   ["#08519C", "#4292C6", "#9ECAE1"],
  Greens:  ["#006D2C", "#41AB5D", "#A1D99B"],
  Purples: ["#54278F", "#807DBA", "#BCBDDC"],
  YlOrRd:  ["#BD0026", "#FC4E2A", "#FEB24C"],
  Reds:    ["#A50F15", "#EF3B2C", "#FC9272"],
  OrRd:    ["#B30000", "#EF6548", "#FDBB84"],
  Greys:   ["#252525", "#737373", "#BDBDBD"],
  PuBuGn:  ["#016C59", "#3690C0", "#A6BDDB"],
  YlGnBu:  ["#253494", "#1D91C0", "#7FCDBB"]
}

// where a cube re-appears after leaving the box (the R data frames se / sw / ne / nw, 72 points each)
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i)
const repeatValue = (v, n) => Array(n).fill(v)
const edge = (xs, ys) => xs.map((x, i) => [x, ys[i]])
const SPAWN = {
  SE: edge([...repeatValue(5, 36), ...range(5, 40)],   [...range(60, 95), ...repeatValue(95, 36)]),
  SW: edge([...repeatValue(95, 36), ...range(60, 95)], [...range(60, 95), ...repeatValue(95, 36)]),
  NE: edge([...repeatValue(5, 36), ...range(5, 40)],   [...range(5, 40), ...repeatValue(5, 36)]),
  NW: edge([...repeatValue(95, 36), ...range(60, 95)], [...range(5, 40), ...repeatValue(5, 36)])
}

let cubes = []

const choose = arr => arr[Math.floor(random(arr.length))]

function newCube(x) {
  return {
    x: x,
    y: choose(range(2, 18)) * 5,
    col: choose(COLOUR_CHOICE),
    flow: choose(DIRECTIONS),
    alpha: choose(range(2, 20)) * 5 / 100,
    up: random() < 0.5,                 // alpdirec: is it fading in?
    speed: 3.5 + randomGaussian(0, 0.5)
  }
}

function setup() {
  createCanvas(500, 500)
  frameRate(FPS)
  // x is sorted so cubes are drawn left to right, as in the R code
  const xs = Array.from({ length: NB }, () => choose(range(2, 18)) * 5).sort((a, b) => a - b)
  cubes = xs.map(newCube)
}

// R coordinates -> pixels
const px = x => x / 100 * width
const py = y => height - (y + 10) / 120 * height

// points are in pixels
function polygon(points, fillHex, border, alp) {
  const c = color(fillHex)
  fill(red(c), green(c), blue(c), alp * 255)
  stroke(border[0], border[1], border[2], alp * 255)
  strokeWeight(1)
  beginShape()
  points.forEach(([x, y]) => vertex(x, y))
  endShape(CLOSE)
}

function drawCube(x, y, u, cols, alp) {
  const white = [255, 255, 255]
  const X = px(x), Y = py(y)
  if (TRUE_CUBE) {
    // equal-sided cube (isometric): edge a, half-width 0.866a, top diamond rises 0.5a
    const a = u * (height / 120) * CUBE_SIZE, hw = a * 0.866, r = a * 0.5
    polygon([[X, Y], [X, Y - a], [X + hw, Y - a - r], [X + hw, Y - r]], cols[0], white, alp)
    polygon([[X, Y], [X, Y - a], [X - hw, Y - a - r], [X - hw, Y - r]], cols[1], white, alp)
    polygon([[X, Y - a], [X - hw, Y - a - r], [X, Y - a - 2 * r], [X + hw, Y - a - r]], cols[2], white, alp)
  } else {
    // original R shape (tall and narrow)
    const P = (dx, dy) => [px(x + dx * u), py(y + dy * u)]
    polygon([P(0, 0), P(0, 1), P(0.5, 1.25), P(0.5, 0.25)], cols[0], white, alp)
    polygon([P(0, 0), P(0, 1), P(-0.5, 1.25), P(-0.5, 0.25)], cols[1], white, alp)
    polygon([P(0, 1), P(-0.5, 1.25), P(0, 1.5), P(0.5, 1.25)], cols[2], white, alp)
  }
}

function draw() {
  if (BACKGROUND) background(BACKGROUND[0], BACKGROUND[1], BACKGROUND[2]); else clear()

  // 1. draw
  cubes.forEach(c => drawCube(c.x, c.y, UNIT, PALETTE[c.col], c.alpha))

  // 2. move
  cubes.forEach(c => {
    if (c.flow.includes("N")) c.y += 0.125 * c.speed
    if (c.flow.includes("S")) c.y -= 0.125 * c.speed
    if (c.flow === "SE" || c.flow === "NE") c.x += 0.25 * c.speed
    if (c.flow === "SW" || c.flow === "NW") c.x -= 0.25 * c.speed
  })

  // 3. cubes that touched the border come back in: N / S jump to the opposite side, diagonals to a random spot on their entry edges
  const out = cubes.filter(c => c.y <= 5 || c.y >= 95 || c.x <= 5 || c.x >= 95)
  out.filter(c => c.flow === "N").forEach(c => { c.y = 5 })
  out.filter(c => c.flow === "S").forEach(c => { c.y = 95 })
  ;["SE", "SW", "NW", "NE"].forEach(f => {
    const group = out.filter(c => c.flow === f)
    const spots = SPAWN[f].slice()                        // sample without replacement, like R's sample(1:72, n)
    group.forEach(c => { const [x, y] = spots.splice(Math.floor(random(spots.length)), 1)[0]; c.x = x; c.y = y })
  })

  // 4. fade in / out
  cubes.forEach(c => {
    c.alpha += c.up ? 0.08 : -0.08
    if (c.alpha >= 1) c.alpha = 1
    if (c.alpha <= 0.05) c.alpha = 0.05
    if (c.alpha <= 0.05) { c.up = true; c.col = choose(COLOUR_CHOICE); c.flow = choose(DIRECTIONS) }   // invisible: new colour and direction
    if (c.alpha >= 1) c.up = random() < 0.8              // fully visible: 80% chance to stay 'fading in' (= stay solid a bit longer), 20% to start fading out, as in the R code
  })
}
