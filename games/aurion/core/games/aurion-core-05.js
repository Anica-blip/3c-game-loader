// Repo path: games/aurion/core/games/aurion-core-05.js

// ============================================================
// PER-GAME CODE INDEPENDENCE — read before adding or reusing a mechanic
// ============================================================
// Each individual game (core-01 ... core-05, ...) keeps its own "kitchen
// space". This file only contains what core-05's own JSON calls. Anything
// borrowed from a sibling game (the envelope reveal, the loading screen,
// the button plumbing, the sparkles) was CLONED in here, never referenced
// from another file.
//
// core-05 mechanics (all built for this game):
//   curtain-leaf, leaf-book, select-item, leaf-fireplace, gather-basket,
//   find-animals, find-diamond, bluebird, cherry-pie, cup-pyramid,
//   envelope-reveal
//
// STANDING IMAGE RULE: every scene image is 1080 x 1080 (1:1). Every scene
// frame is therefore aspect-ratio 1/1 with the image filling it, so a
// percentage position on the frame IS a percentage position on the artwork.
//
// POSITIONS: every spot a mechanic needs (where the leaf lands, where the
// six animals hide, where the diamond is, the cup slots ...) lives in that
// scene's "mechanicData" in core-05.json, in percent of the picture. Change
// a number there, no code change needed.
//
// CALIBRATION: add ?calibrate=1 to the game URL. Every scene frame then
// shows a click readout (left/top %) and keeps a running list of every
// click as {"left":..,"top":..} so the numbers can be copied straight into
// the JSON. Inert otherwise.
// ============================================================

// Card content for the envelope reveal. Keys match the item keys in
// core-05.json (scene "Choose Your Favourite") AND the envelope keys.
// Theme: HANDS ON. One theme, four expressions, none better than another.
const CARD_MESSAGES = {
  armchair: {
    title: '🟠 Steadfast',
    words: ['Composure', 'Reliability', 'Resolve', 'Teamwork', 'Readiness', 'Resilience'],
    line: "Strength isn't always loud, sometimes it's simply steady hands that show up."
  },
  boxchocolate: {
    title: '🟣 Kinship',
    words: ['Empathy', 'Loyalty', 'Gentleness', 'Trust', 'Companionship', 'Tenderness'],
    line: 'A gentle hand and a patient heart can say more to an animal than words ever could.'
  },
  catonblanket: {
    title: '🔵 Discovery',
    words: ['Evidence', 'Precision', 'Rigour', 'Innovation', 'Honesty', 'Persistence'],
    line: 'Careful hands, honest questions and one more try, that is how breakthroughs begin.'
  },
  book2: {
    title: '🟢 Stewardship',
    words: ['Respect', 'Conservation', 'Sustainability', 'Patience', 'Responsibility', 'Harmony'],
    line: 'Planting, tending, protecting, the Earth has always been looked after by willing hands.'
  }
};

const CALIBRATE = typeof location !== 'undefined' && /[?&]calibrate=1/.test(location.search);

// A bare filename lives in this game's own assets/ folder; anything with a
// "/" (full URL, ../assets/...) is used exactly as given.
// Version tag added to every picture URL. Changing "assetVersion" in the
// JSON makes browsers (and Cloudflare, which caches by full URL including the
// query string) fetch the picture fresh, so a replaced image shows up
// straight away without renaming the file or purging any cache.
let ASSET_VERSION = '';

function resolveAssetUrl(url) {
  if (!url) return url;
  let out = url;
  if (!(/^https?:\/\//i.test(url) || url.startsWith('/') || url.includes('/'))) {
    out = 'assets/' + url;
  }
  if (ASSET_VERSION && !/^data:/i.test(out) && !/[?&]v=/.test(out)) {
    out += (out.includes('?') ? '&' : '?') + 'v=' + encodeURIComponent(ASSET_VERSION);
  }
  return out;
}

function applyStyledText(el, obj, prefix) {
  if (obj[prefix + 'Font']) el.style.fontFamily = `'${obj[prefix + 'Font']}', Luckiest Guy`;
  if (obj[prefix + 'Color']) el.style.color = obj[prefix + 'Color'];
  if (obj[prefix + 'Size']) el.style.fontSize = obj[prefix + 'Size'] + 'px';
  if (obj[prefix + 'Bold']) el.style.fontWeight = '700';
}

// Some sprite PNGs arrive with a solid dark background instead of a
// transparent one, which shows up as a visible box. This removes any
// background that is connected to the picture edge and has the same colour
// as the top-left corner, with a one pixel soft edge. It only works when the
// image host allows cross-origin pixel reads (CORS); if it does not, or the
// picture is already transparent, the original is used untouched.
function cutoutImage(url) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (u) => { if (!settled) { settled = true; resolve(u); } };
    setTimeout(() => finish(url), 6000);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onerror = () => finish(url);
    img.onload = () => {
      try {
        const scale = Math.min(1, 512 / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h);
        const px = data.data;
        if (px[3] < 250) { finish(url); return; }   // corner already transparent
        const br = px[0], bg = px[1], bb = px[2];
        const diff = (i) => Math.max(Math.abs(px[i] - br), Math.abs(px[i + 1] - bg), Math.abs(px[i + 2] - bb));
        const TOL = 28, SOFT = 60;
        const removed = new Uint8Array(w * h);
        const stack = [];
        const push = (x, y) => {
          if (x < 0 || y < 0 || x >= w || y >= h) return;
          const p = y * w + x;
          if (removed[p] || diff(p * 4) > TOL) return;
          removed[p] = 1;
          stack.push(p);
        };
        for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
        for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
        while (stack.length) {
          const p = stack.pop();
          const x = p % w, y = (p - x) / w;
          push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
        }
        for (let p = 0; p < w * h; p++) {
          if (removed[p]) { px[p * 4 + 3] = 0; continue; }
          const x = p % w, y = (p - x) / w;
          const nearGone = (x > 0 && removed[p - 1]) || (x < w - 1 && removed[p + 1]) ||
                           (y > 0 && removed[p - w]) || (y < h - 1 && removed[p + w]);
          if (nearGone) {
            const d = diff(p * 4);
            if (d < SOFT) px[p * 4 + 3] = Math.round(255 * Math.max(0, (d - TOL)) / (SOFT - TOL));
          }
        }
        ctx.putImageData(data, 0, 0);
        finish(canvas.toDataURL('image/png'));
      } catch (_) {
        finish(url);
      }
    };
    img.src = url;
  });
}

// Puts a (cut out) sprite picture on an element as its background.
function setSprite(el, url) {
  if (!url) return;
  el.style.visibility = 'hidden';
  cutoutImage(resolveAssetUrl(url)).then((u) => {
    el.style.backgroundImage = `url('${u}')`;
    el.style.visibility = '';
  });
}

// Flags button labels that wrap to 2 lines so the CSS can nudge them.
function markWrappedButtonLabels(row) {
  row.querySelectorAll('.aurion-btn-label').forEach((label) => {
    const range = document.createRange();
    range.selectNodeContents(label);
    const lineCount = range.getClientRects().length;
    label.classList.toggle('aurion-btn-label-wrapped', lineCount > 1);
  });
}

// Warms every still image any scene could show while the hourglass is up.
// Walks each scene's mechanicData and picks up anything that looks like an
// image, so a new image field never needs a new line here.
function preloadAssets(config, preloadedVideos) {
  const urls = new Set();
  const add = (url) => { if (url) urls.add(resolveAssetUrl(url)); };
  const videoUrls = new Set();
  const IMG = /\.(png|jpe?g|gif|webp|svg)(\?|$)/i;

  function walk(value) {
    if (typeof value === 'string') { if (IMG.test(value)) add(value); }
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  }

  if (config.background && config.background.url && config.background.type !== 'video') {
    add(config.background.url);
  }
  (config.decisions || []).forEach(d => {
    if (d.background && d.background.url && d.background.type !== 'video') add(d.background.url);
    if (d.image && d.image.url) add(d.image.url);
    if (d.overlayImage && d.overlayImage.url) add(d.overlayImage.url);
    if (d.video) videoUrls.add(d.video);
    (d.buttons || []).forEach(btn => { if (btn.image) add(btn.image); });
    walk(d.mechanicData);
  });
  (config.characterImages || []).forEach(img => { if (img.url) add(img.url); });
  add('../assets/goal.01-exitsymbol.png');

  const loadPromises = Array.from(urls).map(url => new Promise(resolve => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = resolve;
    img.src = url;
  }));

  const videoPromises = Array.from(videoUrls).map(url => new Promise(resolve => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.setAttribute('playsinline', '');
    video.style.position = 'fixed';
    video.style.left = '-9999px';
    video.style.top = '0';
    video.style.opacity = '0';
    video.addEventListener('canplaythrough', resolve, { once: true });
    video.addEventListener('error', resolve, { once: true });
    video.src = url;
    document.body.appendChild(video);
    if (preloadedVideos) preloadedVideos.set(url, video);
  }));

  const timeout = new Promise(resolve => setTimeout(resolve, videoUrls.size ? 45000 : 8000));
  return Promise.race([Promise.all([...loadPromises, ...videoPromises]), timeout]);
}

// ------------------------------------------------------------------
// Shared helpers (pure, no game state)
// ------------------------------------------------------------------

// A scene frame: always 1:1, same width everywhere, position:relative so
// every percentage inside it maps straight onto the 1080x1080 artwork.
function makeStage(extraClass) {
  const stage = document.createElement('div');
  stage.className = 'aurion-stage' + (extraClass ? ' ' + extraClass : '');
  if (CALIBRATE) {
    const readout = document.createElement('div');
    readout.className = 'aurion-calibrate-readout';
    readout.textContent = 'Click anywhere to read left/top %';
    stage.appendChild(readout);
    const list = document.createElement('textarea');
    list.className = 'aurion-calibrate-list';
    list.readOnly = true;
    list.rows = 3;
    list.value = '';
    stage.appendChild(list);
    const clicks = [];
    stage.addEventListener('click', (e) => {
      if (e.target === list) return;
      const rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const left = +(((e.clientX - rect.left) / rect.width) * 100).toFixed(1);
      const top = +(((e.clientY - rect.top) / rect.height) * 100).toFixed(1);
      readout.textContent = `left: ${left}%   top: ${top}%`;
      clicks.push({ left, top });
      list.value = JSON.stringify(clicks);
      const dot = document.createElement('div');
      dot.className = 'aurion-calibrate-click-dot';
      dot.style.left = left + '%';
      dot.style.top = top + '%';
      stage.appendChild(dot);
    });
  }
  return stage;
}

function makeFillImage(url) {
  const img = document.createElement('img');
  img.className = 'aurion-fill';
  img.alt = '';
  img.draggable = false;
  if (url) img.src = resolveAssetUrl(url);
  return img;
}

// One little star that drifts outwards and fades. Appended to `parent`
// (must be position:relative), positioned in percent of that parent.
function spawnSpark(parent, left, top, spread, size) {
  const s = document.createElement('span');
  s.className = 'aurion-spark';
  s.textContent = '✦';
  s.style.left = left + '%';
  s.style.top = top + '%';
  const ang = Math.random() * Math.PI * 2;
  const dist = spread * (0.5 + Math.random() * 0.7);
  s.style.setProperty('--dx', (Math.cos(ang) * dist).toFixed(1) + 'px');
  s.style.setProperty('--dy', (Math.sin(ang) * dist).toFixed(1) + 'px');
  s.style.setProperty('--rot', (Math.random() * 180 - 90).toFixed(0) + 'deg');
  s.style.setProperty('--s', size + 'px');
  s.addEventListener('animationend', () => s.remove());
  parent.appendChild(s);
}

function burstSparks(parent, left, top, count, spread) {
  for (let i = 0; i < count; i++) {
    spawnSpark(parent, left, top, spread, 9 + Math.random() * 10);
  }
}

// Position of a pointer inside a stage, in percent.
function pointerPercent(stage, clientX, clientY) {
  const rect = stage.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  return {
    left: Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100)),
    top: Math.max(2, Math.min(98, ((clientY - rect.top) / rect.height) * 100))
  };
}


// ------------------------------------------------------------------
// Sound, synthesised so no extra audio file is needed
// ------------------------------------------------------------------
let AUDIO_CTX = null;
function audioCtx() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!AUDIO_CTX) AUDIO_CTX = new Ctx();
    if (AUDIO_CTX.state === 'suspended') AUDIO_CTX.resume();
    return AUDIO_CTX;
  } catch (_) { return null; }
}

// One short note: pitch glides from `f0` to `f1` over `dur` seconds.
function tone(ctx, when, f0, f1, dur, vol, type) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const t0 = ctx.currentTime + when;
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(f0, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.02, dur / 3));
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

// A little bird: quick bright sweeps in groups, like "tweet, tweet-tweet".
function playTweet(kind) {
  const ctx = audioCtx();
  if (!ctx) return;
  const patterns = {
    flight: [[0, 2600, 3900, 0.09], [0.13, 2900, 4200, 0.08], [0.34, 2500, 3700, 0.1]],
    landing: [[0, 2800, 4300, 0.1], [0.16, 3300, 2500, 0.1], [0.38, 2700, 4000, 0.08], [0.5, 3000, 4400, 0.08], [0.62, 2600, 3600, 0.12]],
    happy: [[0, 3100, 4500, 0.07], [0.1, 3400, 2700, 0.07], [0.22, 3000, 4600, 0.07], [0.32, 3500, 2800, 0.09]]
  };
  (patterns[kind] || patterns.happy).forEach(([t, a, b, d]) => {
    tone(ctx, t, a, b, d, 0.16, 'sine');
    tone(ctx, t, a * 2, b * 2, d, 0.03, 'sine');
  });
}

// A soft rising chime for "found it" moments. step 0..5 climbs the scale.
function playChime(step) {
  const ctx = audioCtx();
  if (!ctx) return;
  const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
  const f = scale[Math.min(scale.length - 1, Math.max(0, step || 0))];
  tone(ctx, 0, f, f, 0.5, 0.18, 'sine');
  tone(ctx, 0.07, f * 1.5, f * 1.5, 0.45, 0.09, 'sine');
}

// A small wooden "plop" for dropping something into place.
function playPlop() {
  const ctx = audioCtx();
  if (!ctx) return;
  tone(ctx, 0, 380, 150, 0.14, 0.3, 'triangle');
}

// Paper-soft rustle (curtains, leaves): a quick burst of filtered noise.
function playRustle() {
  const ctx = audioCtx();
  if (!ctx) return;
  const len = Math.floor(ctx.sampleRate * 0.5);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1800;
  filter.Q.value = 0.7;
  const gain = ctx.createGain();
  gain.gain.value = 0.22;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start();
}

// ------------------------------------------------------------------
// Leaf flight: builds a fluttering, twirling path from one spot to another
// (percent of the stage) and plays it with the Web Animations API.
//   opts.swings  how many side to side sways
//   opts.amp     sway width in percent
//   opts.tilt    tilt in degrees
//   opts.lift    how much it rides up before it drops (percent)
//   opts.endRot  rotation it settles at
//   opts.scaleFrom / scaleTo  size change along the way
//   opts.noTwirl  keep the picture flat (a bird, not a leaf)
// Returns the Animation (listen for "finish").
// ------------------------------------------------------------------
function flutterAlong(el, from, to, ms, opts) {
  const o = Object.assign({ swings: 3, amp: 9, tilt: 38, lift: 0, endRot: 0, scaleFrom: 1, scaleTo: 1, steps: 44 }, opts || {});
  const frames = [];
  for (let i = 0; i <= o.steps; i++) {
    const t = i / o.steps;
    const e = t * t * (3 - 2 * t);
    const calm = 1 - t * 0.85;
    const sway = Math.sin(t * Math.PI * 2 * o.swings * 0.5) * o.amp * calm;
    const x = from.left + (to.left - from.left) * (0.35 * t + 0.65 * e) + sway;
    const y = from.top + (to.top - from.top) * (0.5 * t + 0.5 * e) - Math.sin(t * Math.PI) * o.lift;
    let rot = Math.sin(t * Math.PI * 2 * o.swings * 0.5 + 0.9) * o.tilt * calm;
    let sx = o.noTwirl ? 1 : Math.max(0.3, Math.abs(Math.cos(t * Math.PI * o.swings * 1.1)));
    const w = t > 0.86 ? (t - 0.86) / 0.14 : 0;
    rot = rot * (1 - w) + o.endRot * w;
    sx = sx * (1 - w) + w;
    const sc = o.scaleFrom + (o.scaleTo - o.scaleFrom) * e;
    frames.push({
      offset: t,
      left: x.toFixed(2) + '%',
      top: y.toFixed(2) + '%',
      transform: `translate(-50%, -50%) rotate(${rot.toFixed(1)}deg) scale(${(sc * sx).toFixed(3)}, ${sc.toFixed(3)})`
    });
  }
  return el.animate(frames, { duration: ms, easing: 'linear', fill: 'forwards' });
}

// Small glass counter pill that sits in the corner of a stage.
function makeCountPill(stage, text) {
  const pill = document.createElement('div');
  pill.className = 'aurion-count-pill';
  pill.textContent = text;
  stage.appendChild(pill);
  return pill;
}

// Expanding ring where a player tapped (neutral, never a "wrong" signal).
function tapRipple(stage, left, top) {
  const r = document.createElement('span');
  r.className = 'aurion-ripple';
  r.style.left = left + '%';
  r.style.top = top + '%';
  r.addEventListener('animationend', () => r.remove());
  stage.appendChild(r);
}

// A sprite element (a div with a transparent picture as its background).
// "size" is the width in percent of the stage; the box is square, the
// picture is contained inside it.
function makeSpriteEl(className, url, size, tag) {
  const el = document.createElement(tag || 'div');
  el.className = className;
  if (size) el.style.width = size + '%';
  setSprite(el, url);
  return el;
}


export function startGame(config, container) {
  ASSET_VERSION = config.assetVersion ? String(config.assetVersion) : '';
  let sceneIndex = 0;
  let ambientAudio = null;
  const preloadedVideos = new Map();

  // The item picked on "Choose Your Favourite" decides which envelope opens
  // and which card it shows (same idea as core-03). Not scored, no wrong pick.
  let chosenItem = null;

  // Voice + timers belong to the scene that started them. Both are cleared
  // the moment the scene changes so nothing from an old scene leaks into
  // the next one.
  let currentVoice = null;
  let cleanups = [];
  function onSceneExit(fn) { cleanups.push(fn); }
  function stopVoice() {
    if (currentVoice) { try { currentVoice.pause(); } catch (_) {} currentVoice = null; }
  }
  function playVoice(url, done) {
    stopVoice();
    if (!url) { if (done) done(); return; }
    let finished = false;
    const fin = () => { if (finished) return; finished = true; if (done) done(); };
    const a = new Audio(url);
    currentVoice = a;
    a.addEventListener('ended', fin);
    a.addEventListener('error', fin);
    a.play().catch(fin);
  }
  function later(fn, ms) {
    const id = setTimeout(fn, ms);
    onSceneExit(() => clearTimeout(id));
    return id;
  }
  // Drops sparkles behind a moving element for a while.
  function trailSparks(stage, el, ms) {
    const id = setInterval(() => {
      const r = el.getBoundingClientRect();
      const sr = stage.getBoundingClientRect();
      if (!sr.width) return;
      spawnSpark(stage,
        ((r.left + r.width / 2 - sr.left) / sr.width) * 100,
        ((r.top + r.height / 2 - sr.top) / sr.height) * 100,
        26, 8 + Math.random() * 7);
    }, 90);
    const stop = setTimeout(() => clearInterval(id), ms);
    onSceneExit(() => { clearInterval(id); clearTimeout(stop); });
  }

  container.classList.add('aurion-game');
  container.innerHTML = '';

  const bgLayer = document.createElement('div');
  bgLayer.className = 'aurion-bg-layer';
  container.appendChild(bgLayer);

  // Autumn leaves drifting down the page behind the scene. Purely
  // decorative, never catches a tap, switched off for reduced motion.
  const driftLayer = document.createElement('div');
  driftLayer.className = 'aurion-drift-layer';
  container.appendChild(driftLayer);

  function startDrift() {
    driftLayer.innerHTML = '';
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const GLYPHS = ['🍂', '🍁', '🍂', '🍃', '🍁'];
    const spawn = () => {
      if (driftLayer.childElementCount >= 7) return;
      const leaf = document.createElement('span');
      leaf.className = 'aurion-drift';
      leaf.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      leaf.style.left = (Math.random() * 100).toFixed(1) + '%';
      leaf.style.setProperty('--dur', (10 + Math.random() * 7).toFixed(1) + 's');
      leaf.style.setProperty('--sway', (30 + Math.random() * 60).toFixed(0) + 'px');
      leaf.style.setProperty('--size', (14 + Math.random() * 12).toFixed(0) + 'px');
      leaf.style.setProperty('--spin', (180 + Math.random() * 360).toFixed(0) + 'deg');
      leaf.addEventListener('animationend', () => leaf.remove());
      driftLayer.appendChild(leaf);
    };
    spawn();
    const id = setInterval(spawn, 1800);
    onSceneExit(() => { clearInterval(id); driftLayer.innerHTML = ''; });
  }

  const content = document.createElement('div');
  content.className = 'aurion-content';
  container.appendChild(content);

  // Exit symbol: on every scene except the last. Closes in place.
  const exitBtn = document.createElement('button');
  exitBtn.className = 'aurion-exit-btn';
  exitBtn.style.backgroundImage = `url('${resolveAssetUrl('../assets/goal.01-exitsymbol.png')}')`;
  exitBtn.setAttribute('aria-label', 'Exit');
  exitBtn.addEventListener('click', () => {
    if (ambientAudio) { ambientAudio.pause(); ambientAudio = null; }
    stopVoice();
    renderGoodbye();
    window.close();
  });

  // Standard credit watermark, consent page only.
  const watermark = document.createElement('div');
  watermark.className = 'aurion-watermark';
  watermark.textContent = 'Designed and Built with ❤️ by Claude (Anthropic) × Chef Anica · 3C Thread To Success™ Cooking Lab  🧪👨‍🍳';
  watermark.style.display = 'none';
  container.appendChild(watermark);

  renderLoading();
  preloadAssets(config, preloadedVideos).then(() => {
    startAmbient();
    renderScene(0);
  });

  function renderLoading() {
    content.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'aurion-screen aurion-loading';

    const hourglass = document.createElement('div');
    hourglass.className = 'aurion-hourglass-illustration';
    hourglass.innerHTML = `
      <svg width="100%" height="100%" viewBox="0 0 380 260" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="aurionGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#3b2a5e"/>
            <stop offset="100%" stop-color="#1a0f2e"/>
          </linearGradient>
          <linearGradient id="aurionSandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ffe9b3"/>
            <stop offset="100%" stop-color="#f0b429"/>
          </linearGradient>
        </defs>
        <circle cx="70" cy="40" r="2" fill="#ffe9b3" opacity="0.8">
          <animate attributeName="opacity" values="0.2;0.9;0.2" dur="2.4s" repeatCount="indefinite"/>
        </circle>
        <circle cx="300" cy="60" r="2.5" fill="#ffe9b3" opacity="0.6">
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="3.1s" repeatCount="indefinite"/>
        </circle>
        <circle cx="320" cy="180" r="1.8" fill="#ffe9b3" opacity="0.7">
          <animate attributeName="opacity" values="0.3;0.9;0.3" dur="2.7s" repeatCount="indefinite"/>
        </circle>
        <g transform="translate(190,130)">
          <g>
            <animateTransform attributeName="transform" type="rotate" values="0;0;180;180;360" keyTimes="0;0.4;0.5;0.9;1" dur="6s" repeatCount="indefinite"/>
            <path d="M -55 -85 Q -55 -95 -45 -95 L 45 -95 Q 55 -95 55 -85 Q 55 -55 15 -8 Q 8 0 15 8 Q 55 55 55 85 Q 55 95 45 95 L -45 95 Q -55 95 -55 85 Q -55 55 -15 8 Q -8 0 -15 -8 Q -55 -55 -55 -85 Z" fill="url(#aurionGlassGrad)" stroke="#f0b429" stroke-width="3" stroke-linejoin="round"/>
            <path d="M -47 -82 Q -47 -88 -40 -88 L 40 -88 Q 47 -88 47 -82 Q 47 -56 12 -10 Q 12 -6 -12 -10 Q -47 -56 -47 -82 Z" fill="url(#aurionSandGrad)" opacity="0.9"/>
            <path d="M -8 40 Q -8 70 -30 82 Q -35 85 -35 88 L 35 88 Q 35 85 30 82 Q 8 70 8 40 Q 8 55 0 60 Q -8 55 -8 40 Z" fill="url(#aurionSandGrad)" opacity="0.9"/>
            <rect x="-1.5" y="-8" width="3" height="16" fill="#ffe9b3">
              <animate attributeName="height" values="16;4;16" dur="1.2s" repeatCount="indefinite"/>
            </rect>
          </g>
        </g>
        <circle cx="190" cy="122" r="3" fill="#ffe9b3">
          <animate attributeName="cy" values="105;150;105" dur="1.4s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0;1;1;0" dur="1.4s" repeatCount="indefinite"/>
        </circle>
      </svg>
    `;

    const greeting = document.createElement('p');
    greeting.className = 'aurion-loading-greeting';
    greeting.textContent = 'Hey Champ!';

    const msg = document.createElement('p');
    msg.className = 'aurion-body-text';
    msg.textContent = "I'm getting everything ready for you. The first visit can take a little longer while your browser gets everything organised. Hang in there, it'll be worth the wait!";

    const earphones = document.createElement('p');
    earphones.className = 'aurion-body-text';
    earphones.textContent = "🎧 Grab your earphones, I'll be joining you on the journey.";

    wrap.append(hourglass, greeting, msg, earphones);
    content.appendChild(wrap);
  }

  function startAmbient() {
    if (config.ambientSound && !ambientAudio) {
      ambientAudio = new Audio(config.ambientSound);
      ambientAudio.loop = true;
      const vol = typeof config.ambientVolume === 'number' ? config.ambientVolume : 3;
      ambientAudio.volume = Math.max(0, Math.min(5, vol)) / 5;
      ambientAudio.play().catch(() => {});
    }
  }

  function setBackground(sceneBackground) {
    bgLayer.innerHTML = '';
    bgLayer.style.backgroundImage = '';
    bgLayer.style.backgroundColor = '';

    const effective = (sceneBackground && sceneBackground.url) ? sceneBackground : config.background;
    if (!effective || !effective.url) return;

    if (effective.type === 'video') {
      const video = document.createElement('video');
      video.src = effective.url;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.className = 'aurion-bg-video';
      bgLayer.appendChild(video);
      video.play().catch(() => {});
    } else {
      bgLayer.style.backgroundImage = `url('${resolveAssetUrl(effective.url)}')`;
      bgLayer.style.backgroundSize = 'cover';
      bgLayer.style.backgroundPosition = 'center';
      bgLayer.style.backgroundRepeat = 'no-repeat';
    }
  }

  function renderScene(index) {
    // Whatever the previous scene started (voice, timers, sweeps) stops here.
    cleanups.forEach((fn) => { try { fn(); } catch (_) {} });
    cleanups = [];
    stopVoice();

    sceneIndex = index;
    const scene = config.decisions[index];
    if (!scene) return;

    const isLastScene = index === config.decisions.length - 1;
    exitBtn.style.display = isLastScene ? 'none' : 'flex';
    if (!container.contains(exitBtn)) container.appendChild(exitBtn);

    watermark.style.display = scene.adminLabel === 'consent page' ? 'block' : 'none';

    setBackground(scene.background);
    content.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'aurion-scene-wrap';
    if ((!scene.mechanic || scene.mechanic === 'none') && !scene.video) {
      wrap.classList.add('aurion-no-mechanic');
    }
    if (scene.mechanic === 'select-item' || scene.mechanic === 'envelope-reveal') {
      wrap.classList.add('aurion-has-side-panel');
    }
    // These two sit in the vertical middle of the free space instead of
    // hugging the subtitle.
    if (scene.mechanic === 'select-item' || scene.mechanic === 'envelope-reveal') {
      wrap.classList.add('aurion-center-mechanic');
    }
    if (scene.mechanic && scene.mechanic !== 'none') startDrift();
    if (scene.adminLabel === 'landing page' || scene.adminLabel === 'consent page') {
      wrap.classList.add('aurion-intro-scene');
    }
    if (scene.adminLabel === 'landing page' || scene.adminLabel === 'consent page' || scene.adminLabel === 'final page') {
      wrap.classList.add('aurion-mobile-hero-image');
    }

    // Only the four bookend pages carry an overlay image in core-05.
    let introOverlayImg = null;
    if (scene.overlayImage && scene.overlayImage.url) {
      const img = document.createElement('img');
      img.src = resolveAssetUrl(scene.overlayImage.url);
      img.alt = '';
      img.className = 'aurion-overlay-img aurion-overlay-' + (scene.overlayImage.position || 'center');
      introOverlayImg = img;
    }

    if (scene.titleText) {
      const title = document.createElement('h1');
      title.className = 'aurion-scene-title';
      title.textContent = scene.titleText;
      applyStyledText(title, scene, 'title');
      wrap.appendChild(title);
    }

    const textBlock = document.createElement('div');
    textBlock.className = 'aurion-scene-textblock';
    wrap.appendChild(textBlock);

    if (scene.subtitleText) {
      const subtitle = document.createElement('p');
      subtitle.className = 'aurion-scene-subtitle';
      subtitle.textContent = scene.subtitleText;
      applyStyledText(subtitle, scene, 'subtitle');
      textBlock.appendChild(subtitle);
    }

    if (scene.descText) {
      const desc = document.createElement('p');
      desc.className = 'aurion-scene-desc';
      desc.textContent = scene.descText;
      applyStyledText(desc, scene, 'desc');
      textBlock.appendChild(desc);
    }

    if (introOverlayImg) textBlock.appendChild(introOverlayImg);

    const mechanicSlot = document.createElement('div');
    mechanicSlot.className = 'aurion-mechanic-slot';
    wrap.appendChild(mechanicSlot);

    let mechanicGatesButton = false;

    const MECHANICS = {
      'curtain-leaf': buildCurtainLeafMechanic,
      'leaf-book': buildLeafBookMechanic,
      'select-item': buildSelectItemMechanic,
      'leaf-fireplace': buildLeafFireplaceMechanic,
      'gather-basket': buildGatherBasketMechanic,
      'find-animals': buildFindAnimalsMechanic,
      'find-diamond': buildFindDiamondMechanic,
      'bluebird': buildBluebirdMechanic,
      'cherry-pie': buildCherryPieMechanic,
      'cup-pyramid': buildCupPyramidMechanic,
      'envelope-reveal': buildEnvelopeMechanic
    };
    const builder = MECHANICS[scene.mechanic];
    if (builder) {
      mechanicGatesButton = true;
      builder(mechanicSlot, scene, revealButtons);
    }

    if (scene.video) {
      let video = preloadedVideos.get(scene.video);
      if (video) {
        video.style.position = '';
        video.style.left = '';
        video.style.top = '';
        video.style.opacity = '';
      } else {
        video = document.createElement('video');
        video.src = scene.video;
      }
      video.className = 'aurion-scene-video';
      video.autoplay = true;
      video.setAttribute('playsinline', '');
      video.playsInline = true;
      video.disablePictureInPicture = true;
      video.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback');
      video.oncontextmenu = (e) => e.preventDefault();
      video.play().catch(() => { video.muted = true; video.play().catch(() => {}); });
      mechanicSlot.appendChild(video);
    }

    const buttonRow = document.createElement('div');
    buttonRow.className = 'aurion-button-row';
    buttonRow.style.visibility = 'hidden';
    (scene.buttons || []).forEach((btn, btnIndex) => {
      const b = document.createElement('button');
      b.className = 'aurion-btn';
      if (btn.image) {
        b.style.backgroundImage = `url('${resolveAssetUrl(btn.image)}')`;
        b.classList.add('aurion-btn-imaged');
      }
      const label = document.createElement('span');
      label.className = 'aurion-btn-label';
      label.textContent = btn.text || 'Continue';
      if (typeof btn.textNudge === 'number') {
        label.style.marginTop = btn.textNudge + 'px';
      }
      b.appendChild(label);
      if (btn.font) b.style.fontFamily = `'${btn.font}', Poppins`;
      if (btn.color) b.style.color = btn.color;
      if (btn.size) b.style.fontSize = btn.size + 'px';

      if (isLastScene) {
        // Finale: Another Round (restart), The Team (credits), Over & Out (end)
        if (btnIndex === 0) {
          b.addEventListener('click', () => renderScene(0));
        } else if (btnIndex === 1) {
          b.addEventListener('click', renderCredits);
        } else {
          b.addEventListener('click', () => {
            renderGoodbye();
            window.close();
          });
        }
      } else {
        b.addEventListener('click', () => renderScene(sceneIndex + 1));
      }

      buttonRow.appendChild(b);
    });
    wrap.appendChild(buttonRow);

    content.appendChild(wrap);
    markWrappedButtonLabels(buttonRow);

    function revealButtons() {
      buttonRow.style.visibility = 'visible';
      buttonRow.classList.add('aurion-button-row-in');
    }

    if (mechanicGatesButton) {
      // the active mechanic calls revealButtons itself
    } else if (scene.soundEffect) {
      later(() => {
        playVoice(scene.soundEffect, revealButtons);
      }, 2000);
    } else {
      revealButtons();
    }
  }

  // ==================================================================
  // Shared: a leaf flutters in from off the picture, twirls and lands on
  // the spot given in the scene's JSON ("land"). Used by the book scene and
  // the fireplace scene. Aurion's voice (if the scene has one) starts a
  // moment after it lands; the button comes when the voice ends.
  // ==================================================================
  function buildLeafLanding(slot, scene, onComplete, cfg) {
    const md = scene.mechanicData || {};
    const stage = makeStage(cfg.stageClass);
    const art = makeFillImage(md[cfg.imageKey]);
    art.classList.add('aurion-art-in');
    stage.appendChild(art);
    if (cfg.decorate) cfg.decorate(stage, md);

    const land = md.land || { left: 50, top: 60 };
    const start = md.start || { left: -10, top: -8 };
    const endRot = typeof md.landRot === 'number' ? md.landRot : -14;

    const leaf = makeSpriteEl('aurion-leaf aurion-leaf-hidden', md.leaf, md.leafSize || 14);
    leaf.style.left = start.left + '%';
    leaf.style.top = start.top + '%';
    leaf.style.setProperty('--end-rot', endRot + 'deg');
    stage.appendChild(leaf);
    slot.appendChild(stage);

    later(() => {
      leaf.classList.remove('aurion-leaf-hidden');
      playRustle();
      const anim = flutterAlong(leaf, start, land, 4600, {
        swings: 4, amp: 11, tilt: 46, lift: 6, endRot, scaleFrom: 1.15, scaleTo: 1
      });
      onSceneExit(() => anim.cancel());
      trailSparks(stage, leaf, 4600);
      later(() => playRustle(), 2200);
      anim.onfinish = () => {
        leaf.style.left = land.left + '%';
        leaf.style.top = land.top + '%';
        anim.cancel();
        leaf.classList.add('landed');
        const ring = document.createElement('span');
        ring.className = 'aurion-land-ring';
        ring.style.left = land.left + '%';
        ring.style.top = land.top + '%';
        ring.addEventListener('animationend', () => ring.remove());
        stage.appendChild(ring);
        burstSparks(stage, land.left, land.top, 16, 60);
        playChime(3);
        later(() => playVoice(scene.soundEffect, onComplete), cfg.pause);
      };
    }, 900);
  }

  // ==================================================================
  // Scene 3: "Where Will Your Journey Take You?" (curtain)
  // Two curtain halves hang with a slow sway. Tap either one and they sweep
  // apart with a trail of stars. A warm light comes up and the autumn leaf
  // appears, glows, then twirls away off the top corner. Button comes once
  // it has gone.
  // ==================================================================
  function buildCurtainLeafMechanic(slot, scene, onComplete) {
    const md = scene.mechanicData || {};
    const stage = makeStage('aurion-curtain-stage');
    const at = md.leafAt || { left: 50, top: 50 };

    const glow = document.createElement('div');
    glow.className = 'aurion-curtain-glow';
    stage.appendChild(glow);

    const leaf = makeSpriteEl('aurion-leaf aurion-leaf-hidden', md.leaf, md.leafSize || 26);
    leaf.style.left = at.left + '%';
    leaf.style.top = at.top + '%';
    stage.appendChild(leaf);

    const halves = ['left', 'right'].map((side) => {
      const h = document.createElement('button');
      h.className = 'aurion-curtain aurion-curtain-' + side;
      h.setAttribute('aria-label', 'Pull the curtain');
      if (md.curtain) h.style.backgroundImage = `url('${resolveAssetUrl(md.curtain)}')`;
      stage.appendChild(h);
      return h;
    });
    slot.appendChild(stage);

    let opened = false;
    later(() => { if (!opened) stage.classList.add('hint'); }, 5000);

    function open() {
      if (opened) return;
      opened = true;
      stage.classList.remove('hint');
      stage.classList.add('opened');
      playRustle();
      halves.forEach((h) => h.classList.add('open'));
      for (let i = 0; i < 9; i++) {
        later(() => burstSparks(stage, 50, 10 + i * 10, 2, 60), i * 90);
      }
      later(() => {
        leaf.classList.remove('aurion-leaf-hidden');
        leaf.classList.add('appear');
        burstSparks(stage, at.left, at.top, 24, 130);
        playChime(2);
      }, 1300);
      later(() => {
        leaf.classList.remove('appear');
        playRustle();
        const anim = flutterAlong(leaf, at, { left: 118, top: -20 }, 4400, {
          swings: 5, amp: 9, tilt: 55, lift: 16, endRot: 20, scaleFrom: 1, scaleTo: 0.55
        });
        onSceneExit(() => anim.cancel());
        trailSparks(stage, leaf, 4400);
        later(() => playRustle(), 2000);
        anim.onfinish = () => {
          leaf.style.visibility = 'hidden';
          later(onComplete, 300);
        };
      }, 3100);
    }
    halves.forEach((h) => h.addEventListener('click', open));
  }

  // ==================================================================
  // Scene 4: "The Changing Season" (leaf lands on the book)
  // ==================================================================
  function buildLeafBookMechanic(slot, scene, onComplete) {
    buildLeafLanding(slot, scene, onComplete, {
      stageClass: 'aurion-book-stage',
      imageKey: 'book',
      pause: 600,
      decorate(stage, md) {
        // A warm glow on the candle flame and a light twinkle over the hot tea.
        const candle = md.candle || { left: 12, top: 40, size: 10 };
        const cg = document.createElement('div');
        cg.className = 'aurion-candle-glow';
        cg.style.left = candle.left + '%';
        cg.style.top = candle.top + '%';
        cg.style.width = candle.size + '%';
        stage.appendChild(cg);
        const tea = md.tea || { left: 49, top: 12 };
        const id = setInterval(() => {
          spawnSpark(stage, tea.left + (Math.random() - 0.5) * 10, tea.top + (Math.random() - 0.5) * 4, 26, 7 + Math.random() * 6);
          if (Math.random() < 0.6) {
            spawnSpark(stage, candle.left + (Math.random() - 0.5) * 3, candle.top - 1 + (Math.random() - 0.5) * 3, 18, 6 + Math.random() * 5);
          }
        }, 420);
        onSceneExit(() => clearInterval(id));
      }
    });
  }

  // ==================================================================
  // Scene 5: "Choose Your Favourite" (four items)
  // Four things float and glow. Pick one: it shines and sparkles, the rest
  // dim. The pick is remembered and decides which envelope opens and which
  // card it shows. Not scored, no right answer.
  // ==================================================================
  function buildSelectItemMechanic(slot, scene, onComplete) {
    const items = (scene.mechanicData && scene.mechanicData.items) || {};
    let chosen = false;

    const stage = document.createElement('div');
    stage.className = 'aurion-item-stage';
    const board = document.createElement('div');
    board.className = 'aurion-item-board';

    Object.entries(items).forEach(([key, imageUrl]) => {
      const tile = document.createElement('button');
      tile.className = 'aurion-item-tile';
      tile.setAttribute('aria-label', 'Choose this one');
      tile.dataset.key = key;
      if (imageUrl) tile.style.backgroundImage = `url('${resolveAssetUrl(imageUrl)}')`;
      tile.addEventListener('click', () => {
        if (chosen) return;
        chosen = true;
        chosenItem = key;
        tile.classList.add('opened');
        board.querySelectorAll('.aurion-item-tile').forEach((t) => { if (t !== tile) t.classList.add('dim'); });
        const sr = stage.getBoundingClientRect();
        const tr = tile.getBoundingClientRect();
        if (sr.width) {
          burstSparks(stage,
            ((tr.left + tr.width / 2 - sr.left) / sr.width) * 100,
            ((tr.top + tr.height / 2 - sr.top) / sr.height) * 100,
            18, 90);
        }
        playChime(3);
        later(onComplete, 800);
      });
      board.appendChild(tile);
    });

    stage.appendChild(board);
    slot.appendChild(stage);
  }

  // ==================================================================
  // Scene 6: "Firstly, Stay Warm" (leaf lands on the fireplace book)
  // The fire flickers and breathes, embers float up, the candle glows. A
  // leaf drifts in and lands on the open book on the floor, just below the
  // two leaves already there.
  // ==================================================================
  function buildLeafFireplaceMechanic(slot, scene, onComplete) {
    buildLeafLanding(slot, scene, onComplete, {
      stageClass: 'aurion-fire-stage',
      imageKey: 'fireplace',
      pause: 500,
      decorate(stage, md) {
        const fire = md.fire || { left: 50.5, top: 46, size: 30 };
        const glow = document.createElement('div');
        glow.className = 'aurion-fire-glow';
        glow.style.left = fire.left + '%';
        glow.style.top = fire.top + '%';
        glow.style.width = fire.size + '%';
        stage.appendChild(glow);

        const candle = md.candle || { left: 64.2, top: 13, size: 9 };
        const cg = document.createElement('div');
        cg.className = 'aurion-candle-glow';
        cg.style.left = candle.left + '%';
        cg.style.top = candle.top + '%';
        cg.style.width = candle.size + '%';
        stage.appendChild(cg);

        const spawnEmber = () => {
          const e = document.createElement('span');
          e.className = 'aurion-ember';
          e.style.left = (fire.left + (Math.random() - 0.5) * fire.size * 0.55).toFixed(1) + '%';
          e.style.top = (fire.top + fire.size * 0.1 + Math.random() * 3).toFixed(1) + '%';
          e.style.setProperty('--dx', ((Math.random() - 0.5) * 60).toFixed(0) + 'px');
          e.style.setProperty('--rise', (70 + Math.random() * 90).toFixed(0) + 'px');
          e.style.setProperty('--d', (2.2 + Math.random() * 1.8).toFixed(1) + 's');
          e.addEventListener('animationend', () => e.remove());
          stage.appendChild(e);
        };
        const id = setInterval(spawnEmber, 260);
        onSceneExit(() => clearInterval(id));
      }
    });
  }

  // ==================================================================
  // Scene 7: "Time To Gather Some Food" (basket)
  // Four foods float about. Drag each one into the basket (or just tap it
  // and it hops in by itself). When all four are in, the basket glows: tap
  // it and it is lifted away with a burst of stars.
  // ==================================================================
  function buildGatherBasketMechanic(slot, scene, onComplete) {
    const md = scene.mechanicData || {};
    const items = md.items || {};
    const keys = Object.keys(items);
    const basketAt = md.basketAt || { left: 50, top: 74 };
    const basketSize = md.basketSize || 36;
    const itemSize = md.itemSize || 22;
    const spots = md.itemSpots || [
      { left: 20, top: 20 }, { left: 42, top: 14 }, { left: 64, top: 20 }, { left: 84, top: 14 }
    ];
    const stage = makeStage('aurion-basket-stage');
    const pill = makeCountPill(stage, '0 / ' + keys.length);

    const basket = makeSpriteEl('aurion-basket', md.basket, basketSize, 'button');
    basket.setAttribute('aria-label', 'The basket');
    basket.style.left = basketAt.left + '%';
    basket.style.top = basketAt.top + '%';
    stage.appendChild(basket);

    let collected = 0;
    let ready = false;
    let finished = false;

    function popBasket() {
      basket.classList.remove('pop');
      void basket.offsetWidth;
      basket.classList.add('pop');
    }

    function collect(el) {
      if (el.dataset.done) return;
      el.dataset.done = '1';
      el.classList.remove('dragging');
      el.classList.add('flying');
      el.style.left = basketAt.left + '%';
      el.style.top = (basketAt.top - 3) + '%';
      later(() => {
        el.remove();
        collected += 1;
        pill.textContent = collected + ' / ' + keys.length;
        popBasket();
        burstSparks(stage, basketAt.left, basketAt.top - 6, 10, 60);
        playPlop();
        playChime(collected - 1);
        if (collected === keys.length) {
          ready = true;
          basket.classList.add('ready');
          pill.textContent = 'Now tap the basket';
          pill.classList.add('go');
          burstSparks(stage, basketAt.left, basketAt.top, 20, 100);
        }
      }, 520);
    }

    keys.forEach((key, i) => {
      const spot = spots[i % spots.length];
      const el = makeSpriteEl('aurion-fruit', items[key], itemSize, 'button');
      el.setAttribute('aria-label', 'Pick it up');
      el.dataset.key = key;
      el.style.left = spot.left + '%';
      el.style.top = spot.top + '%';
      el.style.animationDelay = (-i * 0.7) + 's';
      stage.appendChild(el);

      let dragging = false;
      let moved = false;
      let sx = 0, sy = 0;
      let lastSpark = 0;
      el.addEventListener('pointerdown', (e) => {
        if (el.dataset.done) return;
        e.preventDefault();
        dragging = true;
        moved = false;
        sx = e.clientX; sy = e.clientY;
        el.classList.add('dragging');
        try { el.setPointerCapture(e.pointerId); } catch (_) {}
      });
      el.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        e.preventDefault();
        if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) > 6) moved = true;
        const pos = pointerPercent(stage, e.clientX, e.clientY);
        if (!pos) return;
        el.style.left = pos.left + '%';
        el.style.top = pos.top + '%';
        const now = Date.now();
        if (moved && now - lastSpark > 70) {
          lastSpark = now;
          spawnSpark(stage, pos.left, pos.top, 22, 7 + Math.random() * 6);
        }
      });
      const release = (e) => {
        if (!dragging) return;
        dragging = false;
        el.classList.remove('dragging');
        const pos = pointerPercent(stage, e.clientX, e.clientY);
        const near = pos && Math.hypot(pos.left - basketAt.left, pos.top - basketAt.top) <= basketSize * 0.55;
        if (!moved || near) collect(el);
      };
      el.addEventListener('pointerup', release);
      el.addEventListener('pointercancel', () => { dragging = false; el.classList.remove('dragging'); });
    });

    basket.addEventListener('click', () => {
      if (finished) return;
      if (!ready) {
        basket.classList.remove('nudge');
        void basket.offsetWidth;
        basket.classList.add('nudge');
        return;
      }
      finished = true;
      basket.classList.remove('ready');
      basket.classList.add('lift');
      burstSparks(stage, basketAt.left, basketAt.top, 30, 140);
      playChime(5);
      later(onComplete, 1100);
    });

    slot.appendChild(stage);
  }

  // ==================================================================
  // Scene 8: "What Do We Have Here" (six animals)
  // Tap the six animals hiding in the forest. Each one found glows, chimes
  // and counts. Tapping anywhere else only makes a quiet ripple, never a
  // wrong answer. If it takes a while, a soft glow hints at one left.
  // ==================================================================
  function buildFindAnimalsMechanic(slot, scene, onComplete) {
    const md = scene.mechanicData || {};
    const animals = md.animals || [];
    const stage = makeStage('aurion-forest-stage');
    if (CALIBRATE) stage.classList.add('aurion-calibrating');

    // Everything that belongs to the picture lives in one layer so the
    // picture, the hotspots and the sparkles zoom and pan together.
    const layer = document.createElement('div');
    layer.className = 'aurion-zoom-layer';
    stage.appendChild(layer);
    const art = makeFillImage(md.forest);
    art.classList.add('aurion-art-in');
    layer.appendChild(art);
    const pill = makeCountPill(stage, '0 / ' + animals.length);

    // Zoom: one button toggles in and out, drag to move around when zoomed.
    const ZOOM = md.zoom || 2.2;
    let z = 1, tx = 0, ty = 0;
    function clampPan() {
      const w = stage.clientWidth, h = stage.clientHeight;
      tx = Math.min(0, Math.max(-(z - 1) * w, tx));
      ty = Math.min(0, Math.max(-(z - 1) * h, ty));
    }
    function applyZoom() {
      clampPan();
      layer.style.transform = `translate(${tx}px, ${ty}px) scale(${z})`;
      stage.classList.toggle('zoomed', z > 1);
      zoomBtn.textContent = z > 1 ? 'Zoom Out' : 'Zoom In';
    }
    const zoomBtn = document.createElement('button');
    zoomBtn.className = 'aurion-zoom-btn';
    zoomBtn.setAttribute('aria-label', 'Zoom the picture');
    zoomBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
    zoomBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const w = stage.clientWidth, h = stage.clientHeight;
      if (z === 1) { z = ZOOM; tx = -(z - 1) * w / 2; ty = -(z - 1) * h / 2; }
      else { z = 1; tx = 0; ty = 0; }
      applyZoom();
    });
    stage.appendChild(zoomBtn);
    zoomBtn.textContent = 'Zoom In';

    let panning = false, panMoved = false, px = 0, py = 0, suppressClick = false;
    stage.addEventListener('pointerdown', (e) => {
      if (z === 1) return;
      panning = true; panMoved = false; px = e.clientX; py = e.clientY;
    });
    stage.addEventListener('pointermove', (e) => {
      if (!panning) return;
      const dx = e.clientX - px, dy = e.clientY - py;
      if (!panMoved && Math.abs(dx) + Math.abs(dy) < 7) return;
      if (!panMoved) { panMoved = true; try { stage.setPointerCapture(e.pointerId); } catch (_) {} }
      tx += dx; ty += dy; px = e.clientX; py = e.clientY;
      applyZoom();
    });
    const endPan = () => {
      if (panning && panMoved) suppressClick = true;
      panning = false;
    };
    stage.addEventListener('pointerup', endPan);
    stage.addEventListener('pointercancel', endPan);
    // A drag to move the picture must never count as a tap on an animal.
    stage.addEventListener('click', (e) => {
      if (suppressClick) { e.stopPropagation(); e.preventDefault(); suppressClick = false; }
    }, true);

    let found = 0;
    let hintTimer = null;
    const spots = [];

    function scheduleHint() {
      clearTimeout(hintTimer);
      hintTimer = setTimeout(() => {
        const left = spots.filter((s) => !s.found);
        if (!left.length) return;
        const pick = left[Math.floor(Math.random() * left.length)];
        pick.el.classList.add('hint');
        setTimeout(() => pick.el.classList.remove('hint'), 3600);
        scheduleHint();
      }, md.hintAfter || 14000);
    }
    onSceneExit(() => clearTimeout(hintTimer));

    animals.forEach((a) => {
      const el = document.createElement('button');
      el.className = 'aurion-hotspot';
      el.setAttribute('aria-label', 'Something is hiding here');
      el.style.left = a.left + '%';
      el.style.top = a.top + '%';
      el.style.width = ((a.r || 6) * 2) + '%';
      const spot = { el, found: false };
      spots.push(spot);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (spot.found) return;
        spot.found = true;
        found += 1;
        el.classList.remove('hint');
        el.classList.add('found');
        burstSparks(layer, a.left, a.top, 18, 80 / z);
        playChime(found - 1);
        pill.textContent = found + ' / ' + animals.length;
        pill.classList.add('bump');
        setTimeout(() => pill.classList.remove('bump'), 400);
        scheduleHint();
        if (found === animals.length) {
          pill.textContent = 'All found';
          pill.classList.add('go');
          clearTimeout(hintTimer);
          later(onComplete, 1100);
        }
      });
      layer.appendChild(el);
    });

    stage.addEventListener('click', (e) => {
      if (e.target.closest && (e.target.closest('.aurion-hotspot') || e.target.closest('.aurion-zoom-btn'))) return;
      const pos = pointerPercent(layer, e.clientX, e.clientY);
      if (pos) tapRipple(layer, pos.left, pos.top);
    });

    slot.appendChild(stage);
    scheduleHint();
  }

  // ==================================================================
  // Scene 9: "Going Home" (find the 3C diamond)
  // One tiny diamond hides among the pumpkins. Tap it and it blazes. A soft
  // glow nudges the eye if it takes a while.
  // ==================================================================
  function buildFindDiamondMechanic(slot, scene, onComplete) {
    const md = scene.mechanicData || {};
    const spot = md.diamond || { left: 50, top: 50 };
    const stage = makeStage('aurion-diamond-stage');
    if (CALIBRATE) stage.classList.add('aurion-calibrating');
    const art = makeFillImage(md.oaktree);
    art.classList.add('aurion-art-in');
    stage.appendChild(art);

    const hotspot = document.createElement('button');
    hotspot.className = 'aurion-diamond-hotspot';
    hotspot.setAttribute('aria-label', 'Tap the 3C diamond');
    hotspot.style.left = spot.left + '%';
    hotspot.style.top = spot.top + '%';
    hotspot.style.width = (md.size || 9) + '%';
    stage.appendChild(hotspot);

    let found = false;
    later(() => { if (!found) hotspot.classList.add('hint'); }, 12000);

    hotspot.addEventListener('click', (e) => {
      e.stopPropagation();
      if (found) return;
      found = true;
      hotspot.classList.remove('hint');
      hotspot.classList.add('found');
      burstSparks(stage, spot.left, spot.top, 26, 120);
      playChime(5);
      later(() => burstSparks(stage, spot.left, spot.top, 14, 80), 400);
      later(onComplete, 1200);
    });

    stage.addEventListener('click', (e) => {
      if (found || (e.target.closest && e.target.closest('.aurion-diamond-hotspot'))) return;
      const pos = pointerPercent(stage, e.clientX, e.clientY);
      if (pos) tapRipple(stage, pos.left, pos.top);
    });

    slot.appendChild(stage);
  }

  // ==================================================================
  // Scene 10: "Time To Enjoy The View" (the bluebird)
  // A quiet moment under the tree. The bluebird swoops in across the
  // picture, tweeting, and settles on the branch. Tap the bird afterwards
  // for another tweet. Sound is synthesised, no audio file needed.
  // ==================================================================
  function buildBluebirdMechanic(slot, scene, onComplete) {
    const md = scene.mechanicData || {};
    const stage = makeStage('aurion-bird-stage');
    const art = makeFillImage(md.bench);
    art.classList.add('aurion-art-in');
    stage.appendChild(art);

    const perch = md.perch || { left: 62, top: 47 };
    const start = md.start || { left: -14, top: 14 };
    const size = md.birdSize || 12;

    const bird = makeSpriteEl('aurion-bird aurion-bird-hidden', null, size, 'button');
    bird.setAttribute('aria-label', 'The bluebird');
    const dir = document.createElement('span');
    dir.className = 'aurion-bird-dir' + (md.flip ? ' flip' : '');
    const flap = document.createElement('span');
    flap.className = 'aurion-bird-flap';
    setSprite(flap, md.bluebird);
    dir.appendChild(flap);
    bird.appendChild(dir);
    bird.style.left = start.left + '%';
    bird.style.top = start.top + '%';
    stage.appendChild(bird);
    slot.appendChild(stage);

    let landed = false;
    later(() => {
      bird.classList.remove('aurion-bird-hidden');
      bird.classList.add('flying');
      playTweet('flight');
      const anim = flutterAlong(bird, start, perch, 4200, {
        swings: 2, amp: 4, tilt: 9, lift: 12, endRot: 0, scaleFrom: 0.8, scaleTo: 1, noTwirl: true
      });
      onSceneExit(() => anim.cancel());
      trailSparks(stage, bird, 4200);
      later(() => playTweet('flight'), 1700);
      later(() => playTweet('flight'), 3000);
      anim.onfinish = () => {
        bird.style.left = perch.left + '%';
        bird.style.top = perch.top + '%';
        anim.cancel();
        bird.classList.remove('flying');
        bird.classList.add('perched');
        landed = true;
        burstSparks(stage, perch.left, perch.top, 16, 60);
        playTweet('landing');
        later(() => playTweet('happy'), 2300);
        later(onComplete, 4200);
      };
    }, 900);

    bird.addEventListener('click', () => {
      if (!landed) return;
      playTweet('happy');
      bird.classList.remove('hop');
      void bird.offsetWidth;
      bird.classList.add('hop');
      burstSparks(stage, perch.left, perch.top - 4, 8, 50);
    });
  }

  // ==================================================================
  // Scene 11: "The House Smells Wonderful" (cherry pie)
  // Just a view. The pie breathes out warm steam, a golden glow pulses and
  // little stars drift up while Aurion speaks. Button comes when the voice
  // ends.
  // ==================================================================
  function buildCherryPieMechanic(slot, scene, onComplete) {
    const md = scene.mechanicData || {};
    const stage = makeStage('aurion-pie-stage');
    const steam = md.steam || { left: 50, top: 46 };

    const glow = document.createElement('div');
    glow.className = 'aurion-pie-glow';
    glow.style.left = (md.glow ? md.glow.left : steam.left) + '%';
    glow.style.top = (md.glow ? md.glow.top : steam.top + 12) + '%';
    stage.appendChild(glow);

    const art = makeFillImage(md.pie);
    art.classList.add('aurion-art-in');
    stage.appendChild(art);

    for (let i = 0; i < 6; i++) {
      const w = document.createElement('span');
      w.className = 'aurion-steam';
      w.style.left = (steam.left + (i - 2.5) * 3.4) + '%';
      w.style.top = steam.top + '%';
      w.style.setProperty('--sway', ((i % 2 ? 1 : -1) * (10 + i * 3)) + 'px');
      w.style.animationDelay = (-i * 0.95) + 's';
      stage.appendChild(w);
    }

    const id = setInterval(() => {
      spawnSpark(stage, steam.left + (Math.random() - 0.5) * 36, steam.top + 6 + Math.random() * 14, 40, 8 + Math.random() * 7);
    }, 520);
    onSceneExit(() => clearInterval(id));

    slot.appendChild(stage);
    later(() => playVoice(scene.soundEffect, onComplete), 900);
  }

  // ==================================================================
  // Scene 12: "Your Journey Continues" (cup pyramid)
  // Ten cups wait down both sides. Drag them into the triangle, or tap a
  // cup and it takes the next free place. The bottom row of four comes
  // first, then three, then two, then the top cup: a row only opens once
  // the row under it is full. Dropping on a closed row just sends the cup
  // home again. Complete triangle: cups cheer, stars burst.
  // ==================================================================
  function buildCupPyramidMechanic(slot, scene, onComplete) {
    const md = scene.mechanicData || {};
    const rows = md.rows || [4, 3, 2, 1];
    const size = md.cupSize || 20;
    const base = md.base || { left: 50, top: 80 };
    const stepX = size * (md.spacingX || 0.7);
    const stepY = size * (md.spacingY || 0.8);
    const total = rows.reduce((a, b) => a + b, 0);
    const stage = makeStage('aurion-cups-stage aurion-glass-stage');
    const pill = makeCountPill(stage, '0 / ' + total);

    // Slots, bottom row first.
    const slots = [];
    const rowFilled = rows.map(() => 0);
    rows.forEach((count, r) => {
      for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.className = 'aurion-cup-slot';
        el.style.width = (size * 0.7) + '%';
        const left = base.left + (i - (count - 1) / 2) * stepX;
        const top = base.top - r * stepY;
        el.style.left = left + '%';
        el.style.top = top + '%';
        stage.appendChild(el);
        slots.push({ el, row: r, left, top, filled: false });
      }
    });

    function unlocked(s) { return s.row === 0 || rowFilled[s.row - 1] === rows[s.row - 1]; }
    function refreshLocks() {
      slots.forEach((s) => s.el.classList.toggle('locked', !s.filled && !unlocked(s)));
    }
    refreshLocks();

    // Cups wait in two columns, one each side of the triangle.
    const trayX = md.trayX || [9, 91];
    const trayTop = md.trayTop || 14;
    const trayStep = md.trayStep || 18;
    const perSide = Math.ceil(total / 2);
    const cups = [];
    let placed = 0;
    let finished = false;

    for (let k = 0; k < total; k++) {
      const side = k < perSide ? 0 : 1;
      const idx = side === 0 ? k : k - perSide;
      const home = { left: trayX[side], top: trayTop + idx * trayStep };
      const el = makeSpriteEl('aurion-cup', md.cup, size, 'button');
      el.setAttribute('aria-label', 'A cup');
      el.style.left = home.left + '%';
      el.style.top = home.top + '%';
      el.style.animationDelay = (-k * 0.45) + 's';
      stage.appendChild(el);
      cups.push(el);

      let dragging = false, moved = false, sx = 0, sy = 0, lastSpark = 0;

      function goHome() {
        el.style.left = home.left + '%';
        el.style.top = home.top + '%';
      }
      function shake() {
        el.classList.remove('shake');
        void el.offsetWidth;
        el.classList.add('shake');
      }
      function place(s) {
        s.filled = true;
        s.el.classList.add('filled');
        el.dataset.done = '1';
        el.classList.add('placed');
        el.style.left = s.left + '%';
        el.style.top = s.top + '%';
        el.style.zIndex = String(10 + s.row);
        el.style.setProperty('--row', s.row);
        el.dataset.row = String(s.row);
        placed += 1;
        pill.textContent = placed + ' / ' + total;
        rowFilled[s.row] += 1;
        playPlop();
        later(() => burstSparks(stage, s.left, s.top, 8, 46), 200);
        if (rowFilled[s.row] === rows[s.row]) {
          playChime(s.row + 1);
          later(() => {
            for (let n = 0; n < rows[s.row]; n++) {
              burstSparks(stage, base.left + (n - (rows[s.row] - 1) / 2) * stepX, s.top, 5, 50);
            }
          }, 250);
        }
        refreshLocks();
        if (placed === total) finish();
      }
      function nextFree() {
        return slots.find((s) => !s.filled && unlocked(s));
      }

      el.addEventListener('pointerdown', (e) => {
        if (el.dataset.done || finished) return;
        e.preventDefault();
        dragging = true; moved = false;
        sx = e.clientX; sy = e.clientY;
        el.classList.add('dragging');
        try { el.setPointerCapture(e.pointerId); } catch (_) {}
      });
      el.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        e.preventDefault();
        if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) > 6) moved = true;
        const pos = pointerPercent(stage, e.clientX, e.clientY);
        if (!pos) return;
        el.style.left = pos.left + '%';
        el.style.top = pos.top + '%';
        const now = Date.now();
        if (moved && now - lastSpark > 80) {
          lastSpark = now;
          spawnSpark(stage, pos.left, pos.top, 18, 6 + Math.random() * 5);
        }
      });
      el.addEventListener('pointerup', (e) => {
        if (!dragging) return;
        dragging = false;
        el.classList.remove('dragging');
        if (!moved) {
          const s = nextFree();
          if (s) place(s); else goHome();
          return;
        }
        const pos = pointerPercent(stage, e.clientX, e.clientY);
        let best = null, bestD = Infinity;
        if (pos) {
          slots.forEach((s) => {
            if (s.filled) return;
            const d = Math.hypot(pos.left - s.left, pos.top - s.top);
            if (d < bestD) { bestD = d; best = s; }
          });
        }
        if (best && bestD <= size * 0.75) {
          if (unlocked(best)) place(best);
          else { goHome(); shake(); }
        } else {
          goHome();
        }
      });
      el.addEventListener('pointercancel', () => { dragging = false; el.classList.remove('dragging'); goHome(); });
    }

    function finish() {
      if (finished) return;
      finished = true;
      pill.textContent = 'All sorted';
      pill.classList.add('go');
      for (let n = 0; n < 6; n++) playChimeLater(n);
      cups.forEach((c) => c.classList.add('cheer'));
      for (let n = 0; n < 5; n++) {
        later(() => burstSparks(stage, 20 + Math.random() * 60, 25 + Math.random() * 55, 10, 90), n * 220);
      }
      later(onComplete, 1700);
    }
    function playChimeLater(n) { later(() => playChime(n), n * 110); }

    slot.appendChild(stage);
  }

  // ==================================================================
  // Scene 13: "Let's Check How Far You Got" (envelopes)
  // Same idea as core-03: the item picked on "Choose Your Favourite" decides
  // the card. A light sweeps across the four envelopes for a moment, then
  // settles on the one that matches the pick while the other three dim.
  // Only that envelope opens, and it shows the card for that pick.
  // ==================================================================
  function buildEnvelopeMechanic(slot, scene, onComplete) {
    const envelopes = (scene.mechanicData && scene.mechanicData.envelopes) || {};
    const keys = Object.keys(envelopes);
    // If someone jumps straight here with no pick, the first card is used.
    const winner = (chosenItem && envelopes[chosenItem]) ? chosenItem : keys[0];

    const stage = document.createElement('div');
    stage.className = 'aurion-sort-stage';
    const board = document.createElement('div');
    board.className = 'aurion-sort-board aurion-envelope-board';
    const popup = document.createElement('div');
    popup.className = 'aurion-reveal-popup';

    const tiles = [];
    let opened = false;
    let settled = false;
    let sweepIndex = -1;
    let sweepCount = 0;
    let sweepTimer = null;

    function sweep() {
      tiles.forEach((t) => t.classList.remove('flashing'));
      sweepIndex = (sweepIndex + 1) % tiles.length;
      tiles[sweepIndex].classList.add('flashing');
      sweepCount += 1;
      if (sweepCount >= 9) settle();
    }

    function settle() {
      clearInterval(sweepTimer);
      settled = true;
      tiles.forEach((t) => {
        t.classList.remove('flashing');
        if (t.dataset.key === winner) t.classList.add('chosen-pulse');
        else { t.classList.add('dim'); t.disabled = true; }
      });
    }

    keys.forEach((key) => {
      const tile = document.createElement('button');
      tile.className = 'aurion-sort-tile aurion-reveal-tile aurion-envelope-tile';
      tile.dataset.key = key;
      if (envelopes[key]) tile.style.backgroundImage = `url('${resolveAssetUrl(envelopes[key])}')`;

      tile.addEventListener('click', () => {
        if (opened || !settled || key !== winner) return;
        opened = true;
        tile.classList.remove('chosen-pulse');
        tile.classList.add('opened');
        board.classList.add('dimmed');
        const sr = stage.getBoundingClientRect();
        const tr = tile.getBoundingClientRect();
        if (sr.width) {
          burstSparks(stage,
            ((tr.left + tr.width / 2 - sr.left) / sr.width) * 100,
            ((tr.top + tr.height / 2 - sr.top) / sr.height) * 100,
            20, 90);
        }
        playChime(4);

        popup.innerHTML = '';
        popup.classList.add('open');
        const msg = CARD_MESSAGES[winner] || CARD_MESSAGES[Object.keys(CARD_MESSAGES)[0]];

        const title = document.createElement('h2');
        title.textContent = msg.title;

        const wordsLine = document.createElement('p');
        wordsLine.className = 'aurion-reveal-subtitle';
        wordsLine.textContent = msg.words.join(' · ');

        const body = document.createElement('p');
        body.className = 'aurion-reveal-body';
        body.textContent = msg.line;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'aurion-btn';
        closeBtn.textContent = 'Close';
        closeBtn.addEventListener('click', () => {
          popup.classList.remove('open');
          board.classList.remove('dimmed');
          playVoice(scene.soundEffect, onComplete);
        });

        popup.append(title, wordsLine, body, closeBtn);
      });

      tiles.push(tile);
      board.appendChild(tile);
    });

    stage.append(board, popup);
    slot.appendChild(stage);

    if (tiles.length) {
      sweep();
      sweepTimer = setInterval(sweep, 300);
      onSceneExit(() => clearInterval(sweepTimer));
    }
    onSceneExit(() => popup.remove());
  }

  function renderCredits() {
    content.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'aurion-page-card aurion-credits';

    const title = document.createElement('h1');
    title.textContent = 'Credits';

    const text = document.createElement('p');
    text.className = 'aurion-credits-text';
    text.textContent = config.credits || 'Credits coming soon.';

    const backBtn = document.createElement('button');
    backBtn.className = 'aurion-page-btn aurion-page-btn-primary';
    backBtn.textContent = 'Back';
    backBtn.addEventListener('click', () => renderScene(config.decisions.length - 1));

    wrap.append(title, text, backBtn);
    content.appendChild(wrap);
  }

  function renderGoodbye() {
    if (ambientAudio) {
      ambientAudio.pause();
      ambientAudio = null;
    }
    content.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'aurion-page-card';

    const message = document.createElement('p');
    message.className = 'aurion-page-text';
    message.textContent = 'Thanks for playing!';

    wrap.appendChild(message);
    content.appendChild(wrap);
  }
}
