// Repo path: games/aurion/core/games/aurion-core-04.js

// ============================================================
// PER-GAME CODE INDEPENDENCE — read before adding or reusing a mechanic
// ============================================================
// Each individual game (core-01, core-02, core-03, core-04, ...) keeps its
// own "kitchen space". This file only contains what core-04's own JSON
// calls. Anything borrowed from a sibling game (the envelope sweep, the
// checkpoint drag, the loading screen, the button plumbing) was CLONED in
// here in this game's own words, never referenced from another file.
//
// core-04 mechanics (all built for this game):
//   butterfly, book-reveal, select-crystal, grab-wand, square-puzzle,
//   moon-watching, find-diamond, castle-trail, castle-door,
//   tree-of-knowledge, envelope-reveal
//
// STANDING IMAGE RULE (from the core-03 log): every scene image is
// 1800 x 1800 (1:1). Every scene frame in core-04 is therefore
// aspect-ratio 1/1 with the image filling it, so a percentage position
// on the frame IS a percentage position on the artwork. No pillarbox
// maths anywhere in this file.
//
// CALIBRATION: add ?calibrate=1 to the game URL. Every scene frame then
// shows a click readout (left/top %), and the two trail scenes also draw
// their checkpoints and target zone on the real art. Inert otherwise.
// ============================================================

// Card content for the envelope reveal. Keys match the crystal values in
// core-04.json (scene "Find Your Favourite") AND the envelope keys.
// Theme: CALLING. No religion is named on purpose, keep it that way.
const CRYSTAL_MESSAGES = {
  Devotion: {
    title: '🟠 Devotion',
    words: ['Faith', 'Reverence', 'Gratitude', 'Ritual', 'Belonging', 'Trust'],
    line: "A candle, a prayer, a quiet thank you, there's more than one way to say yes to something bigger."
  },
  Wonder: {
    title: '🟣 Wonder',
    words: ['Curiosity', 'Stillness', 'Awe', 'Reflection', 'Meaning', 'Insight'],
    line: "A whole sky of questions is up there, and not one of them is in a hurry."
  },
  Healing: {
    title: '🔵 Healing',
    words: ['Compassion', 'Presence', 'Listening', 'Comfort', 'Gentleness', 'Hope'],
    line: "Sometimes the kindest thing in the room is simply someone who stays."
  },
  Service: {
    title: '🟢 Service',
    words: ['Kindness', 'Generosity', 'Community', 'Humility', 'Dedication', 'Action'],
    line: "Every helping hand began as one small yes."
  }
};

// ---- Tunable positions (percent of the 1:1 scene frame) ----------------
// All measured by eye from the supplied art, then meant to be checked with
// ?calibrate=1. Change a number here, nothing else.
const BOOK_LAND = { left: 30, top: 46 };           // left page of the open book
const WAND_START = { left: 10, top: 78 };          // where the wand rests once moved left
const WAND_CHECKPOINTS = [
  { left: 20, top: 86 },
  { left: 40, top: 82 },
  { left: 57, top: 68 },
  { left: 61, top: 47 },
  { left: 66, top: 28 },
  { left: 80, top: 14 }
];
const WAND_TARGET = { leftMin: 86, leftMax: 100, topMin: 14, topMax: 42 };
const DIAMOND_SPOT = { left: 62.2, top: 55.2 };    // the 3C diamond on the carriage
const CASTLE_START = { left: 47, top: 96 };
const CASTLE_CHECKPOINTS = [
  { left: 46, top: 87 },
  { left: 41, top: 78 },
  { left: 47, top: 70 },
  { left: 53, top: 64 }
];
const CASTLE_TARGET = { leftMin: 42, leftMax: 55, topMin: 51, topMax: 62 };
const CASTLE_DOOR = { left: 48, top: 57 };
const TREE_LAND = { left: 47, top: 70 };           // where the flying boy lands
const CHECKPOINT_RADIUS = 8;

const CALIBRATE = typeof location !== 'undefined' && /[?&]calibrate=1/.test(location.search);

// A bare filename lives in this game's own assets/ folder; anything with a
// "/" (full URL, ../assets/...) is used exactly as given.
function resolveAssetUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url) || url.startsWith('/') || url.includes('/')) {
    return url;
  }
  return 'assets/' + url;
}

function applyStyledText(el, obj, prefix) {
  if (obj[prefix + 'Font']) el.style.fontFamily = `'${obj[prefix + 'Font']}', Luckiest Guy`;
  if (obj[prefix + 'Color']) el.style.color = obj[prefix + 'Color'];
  if (obj[prefix + 'Size']) el.style.fontSize = obj[prefix + 'Size'] + 'px';
  if (obj[prefix + 'Bold']) el.style.fontWeight = '700';
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
// every percentage inside it maps straight onto the 1800x1800 artwork.
function makeStage(extraClass) {
  const stage = document.createElement('div');
  stage.className = 'aurion-stage' + (extraClass ? ' ' + extraClass : '');
  if (CALIBRATE) {
    const readout = document.createElement('div');
    readout.className = 'aurion-calibrate-readout';
    readout.textContent = 'Click anywhere to read left/top %';
    stage.appendChild(readout);
    stage.addEventListener('click', (e) => {
      const rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const left = (((e.clientX - rect.left) / rect.width) * 100).toFixed(1);
      const top = (((e.clientY - rect.top) / rect.height) * 100).toFixed(1);
      readout.textContent = `left: ${left}%   top: ${top}%`;
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

// Calibration overlay for the two checkpoint scenes (wand, castle).
function drawCalibration(stage, checkpoints, target) {
  if (!CALIBRATE) return;
  checkpoints.forEach((cp, i) => {
    const marker = document.createElement('div');
    marker.className = 'aurion-calibrate-checkpoint';
    marker.style.left = cp.left + '%';
    marker.style.top = cp.top + '%';
    marker.style.width = (CHECKPOINT_RADIUS * 2) + '%';
    marker.style.height = (CHECKPOINT_RADIUS * 2) + '%';
    marker.textContent = String(i + 1);
    stage.appendChild(marker);
  });
  const t = document.createElement('div');
  t.className = 'aurion-calibrate-target';
  t.style.left = target.leftMin + '%';
  t.style.top = target.topMin + '%';
  t.style.width = (target.leftMax - target.leftMin) + '%';
  t.style.height = (target.topMax - target.topMin) + '%';
  t.textContent = 'TARGET';
  stage.appendChild(t);
}

// Drag a sprite through ordered checkpoints to a target zone.
// Core-03 lesson built in from the start: letting go early NEVER resets
// anything. The sprite stays where it was dropped, progress is kept, and
// the player can pick it up again as many times as they like. Checkpoints
// still have to be passed in order, so a straight-line jump does not count.
// Arrival happens the moment the sprite enters the target with every
// checkpoint cleared (no need to release first).
function attachCheckpointDrag(stage, el, cfg) {
  let enabled = cfg.enabled !== false;
  let done = false;
  let dragging = false;
  let next = 0;
  let lastSpark = 0;

  function setPosition(left, top) {
    el.style.left = left + '%';
    el.style.top = top + '%';
  }

  function inTarget(pos) {
    const t = cfg.target;
    return pos.left >= t.leftMin && pos.left <= t.leftMax && pos.top >= t.topMin && pos.top <= t.topMax;
  }

  function arrive() {
    if (done) return;
    done = true;
    dragging = false;
    el.classList.remove('dragging');
    cfg.onArrive();
  }

  function handle(pos) {
    setPosition(pos.left, pos.top);
    while (next < cfg.checkpoints.length) {
      const cp = cfg.checkpoints[next];
      const dx = pos.left - cp.left;
      const dy = pos.top - cp.top;
      if (Math.sqrt(dx * dx + dy * dy) <= CHECKPOINT_RADIUS) next += 1; else break;
    }
    const now = Date.now();
    if (now - lastSpark > 45) {
      lastSpark = now;
      spawnSpark(stage, pos.left + (Math.random() * 3 - 1.5), pos.top + (Math.random() * 3 - 1.5), 22, 7 + Math.random() * 7);
    }
    if (next >= cfg.checkpoints.length && inTarget(pos)) arrive();
  }

  el.addEventListener('pointerdown', (e) => {
    if (!enabled || done) return;
    e.preventDefault();
    dragging = true;
    el.classList.add('dragging');
    try { el.setPointerCapture(e.pointerId); } catch (_) {}
  });
  el.addEventListener('pointermove', (e) => {
    if (!dragging || done) return;
    e.preventDefault();
    const pos = pointerPercent(stage, e.clientX, e.clientY);
    if (pos) handle(pos);
  });
  el.addEventListener('pointerup', (e) => {
    if (!dragging || done) return;
    dragging = false;
    el.classList.remove('dragging');
    const pos = pointerPercent(stage, e.clientX, e.clientY);
    if (pos) handle(pos);
  });
  el.addEventListener('pointercancel', () => { dragging = false; el.classList.remove('dragging'); });

  return {
    setPosition,
    enable() { enabled = true; },
    isDone() { return done; }
  };
}

// A soft double knock, synthesised so no extra audio file is needed.
function playKnock() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [0, 0.24, 0.48].forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(170, ctx.currentTime + t);
      osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + t + 0.12);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.2);
    });
    setTimeout(() => { try { ctx.close(); } catch (_) {} }, 1200);
  } catch (_) {}
}

export function startGame(config, container) {
  let sceneIndex = 0;
  let ambientAudio = null;
  const preloadedVideos = new Map();

  // The crystal pick is remembered but does NOT decide the card: the
  // envelope tapped does (envelope N = card N). No companion in this game.
  let chosenCrystal = null;

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
    if (scene.mechanic === 'select-crystal' || scene.mechanic === 'envelope-reveal') {
      wrap.classList.add('aurion-has-side-panel');
    }
    if (scene.adminLabel === 'landing page' || scene.adminLabel === 'consent page') {
      wrap.classList.add('aurion-intro-scene');
    }
    if (scene.adminLabel === 'landing page' || scene.adminLabel === 'consent page' || scene.adminLabel === 'final page') {
      wrap.classList.add('aurion-mobile-hero-image');
    }

    // Only the four bookend pages carry an overlay image in core-04.
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
      'butterfly': buildButterflyMechanic,
      'book-reveal': buildBookRevealMechanic,
      'select-crystal': buildCrystalMechanic,
      'grab-wand': buildWandMechanic,
      'square-puzzle': buildSquarePuzzleMechanic,
      'moon-watching': buildMoonMechanic,
      'find-diamond': buildDiamondMechanic,
      'castle-trail': buildCastleTrailMechanic,
      'castle-door': buildCastleDoorMechanic,
      'tree-of-knowledge': buildTreeMechanic,
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
  // Scene 1: "Where Will Your Journey Take You?" (butterfly)
  // The butterfly rests with slowly flexing wings. One tap and the wings
  // beat fast, it twirls, then flies off the top of the screen. Button
  // appears once it has gone.
  // The wing beat is the picture squeezed sideways and back (scaleX), which
  // reads as wings closing and opening on a top-down butterfly.
  // ==================================================================
  function buildButterflyMechanic(slot, scene, onComplete) {
    const md = scene.mechanicData || {};
    const stage = makeStage('aurion-bf-stage');

    const btn = document.createElement('button');
    btn.className = 'aurion-bf-btn';
    btn.setAttribute('aria-label', 'Tap the butterfly');
    const flap = document.createElement('span');
    flap.className = 'aurion-bf-flap';
    if (md.butterfly) flap.style.backgroundImage = `url('${resolveAssetUrl(md.butterfly)}')`;
    btn.appendChild(flap);

    let tapped = false;
    btn.addEventListener('click', () => {
      if (tapped) return;
      tapped = true;
      burstSparks(stage, 50, 50, 16, 80);
      btn.classList.add('flying');
      trailSparks(stage, btn, 3300);
      btn.addEventListener('animationend', (e) => {
        if (e.target !== btn) return;
        btn.style.visibility = 'hidden';
        later(onComplete, 250);
      });
    });

    stage.appendChild(btn);
    slot.appendChild(stage);
  }

  // ==================================================================
  // Scene 2: "This Trip You Are Going Alone" (book + butterfly)
  // The book fades in, the butterfly flutters in from the left, twirls and
  // lands on the left page (wings slowly opening and closing as it rests),
  // then Aurion speaks. Button appears when the mp3 ends.
  // ==================================================================
  function buildBookRevealMechanic(slot, scene, onComplete) {
    const md = scene.mechanicData || {};
    const stage = makeStage('aurion-book-stage');
    stage.style.setProperty('--land-left', BOOK_LAND.left + '%');
    stage.style.setProperty('--land-top', BOOK_LAND.top + '%');

    const book = makeFillImage(md.book);
    book.classList.add('aurion-book-in');
    stage.appendChild(book);

    const lander = document.createElement('div');
    lander.className = 'aurion-bf-lander';
    const flap = document.createElement('span');
    flap.className = 'aurion-bf-flap';
    if (md.butterfly) flap.style.backgroundImage = `url('${resolveAssetUrl(md.butterfly)}')`;
    lander.appendChild(flap);
    stage.appendChild(lander);
    slot.appendChild(stage);

    later(() => {
      lander.classList.add('flying');
      trailSparks(stage, lander, 4300);
    }, 800);

    lander.addEventListener('animationend', (e) => {
      if (e.target !== lander) return;
      lander.classList.remove('flying');
      lander.classList.add('landed');
      burstSparks(stage, BOOK_LAND.left, BOOK_LAND.top, 12, 46);
      later(() => playVoice(scene.soundEffect, onComplete), 600);
    });
  }

  // ==================================================================
  // Scene 3: "Find Your Favourite" (crystals)
  // Four crystals float and shimmer. Pick one: it glows and sparkles, the
  // others dim. The pick is remembered for the envelope scene. Not scored,
  // no right answer.
  // ==================================================================
  function buildCrystalMechanic(slot, scene, onComplete) {
    const crystals = (scene.mechanicData && scene.mechanicData.crystal) || {};
    let chosen = false;

    const stage = document.createElement('div');
    stage.className = 'aurion-crystal-stage';
    const board = document.createElement('div');
    board.className = 'aurion-crystal-board';

    Object.entries(crystals).forEach(([value, imageUrl]) => {
      const tile = document.createElement('button');
      tile.className = 'aurion-crystal-tile';
      tile.setAttribute('aria-label', 'Choose this crystal');
      if (imageUrl) tile.style.backgroundImage = `url('${resolveAssetUrl(imageUrl)}')`;
      tile.addEventListener('click', () => {
        if (chosen) return;
        chosen = true;
        chosenCrystal = value;
        tile.classList.add('opened');
        board.querySelectorAll('.aurion-crystal-tile').forEach(t => { if (t !== tile) t.classList.add('dim'); });
        const sr = stage.getBoundingClientRect();
        const tr = tile.getBoundingClientRect();
        if (sr.width) {
          burstSparks(stage,
            ((tr.left + tr.width / 2 - sr.left) / sr.width) * 100,
            ((tr.top + tr.height / 2 - sr.top) / sr.height) * 100,
            16, 80);
        }
        later(onComplete, 750);
      });
      board.appendChild(tile);
    });

    stage.appendChild(board);
    slot.appendChild(stage);
  }

  // ==================================================================
  // Scene 4: "What Do We Have Here?" (wand + trail)
  // Wand sits centred while Aurion speaks. Tap it: it drifts to the left
  // and the sparkling trail fades in. Drag the wand along the trail (stars
  // follow it). Reaching the end of the trail finishes the scene. Letting
  // go early never resets anything.
  // ==================================================================
  function buildWandMechanic(slot, scene, onComplete) {
    const md = scene.mechanicData || {};
    const stage = makeStage('aurion-wand-stage');

    const trail = makeFillImage(md.wandtrail);
    trail.classList.add('aurion-wand-trail');
    stage.appendChild(trail);

    const wand = document.createElement('button');
    wand.className = 'aurion-wand';
    wand.setAttribute('aria-label', 'Tap the magic wand');
    if (md.wand) wand.style.backgroundImage = `url('${resolveAssetUrl(md.wand)}')`;
    wand.style.left = '50%';
    wand.style.top = '50%';
    stage.appendChild(wand);

    drawCalibration(stage, WAND_CHECKPOINTS, WAND_TARGET);

    const drag = attachCheckpointDrag(stage, wand, {
      enabled: false,
      checkpoints: WAND_CHECKPOINTS,
      target: WAND_TARGET,
      onArrive() {
        wand.classList.add('arrived');
        trail.classList.add('glow');
        burstSparks(stage, 90, 26, 22, 110);
        later(onComplete, 800);
      }
    });

    let ready = false;
    wand.addEventListener('click', () => {
      if (ready) return;
      ready = true;
      wand.classList.add('ready', 'moving');
      drag.setPosition(WAND_START.left, WAND_START.top);
      trail.classList.add('show');
      burstSparks(stage, 50, 50, 14, 90);
      later(() => {
        wand.classList.remove('moving');
        drag.enable();
      }, 1000);
    });

    slot.appendChild(stage);
    later(() => playVoice(scene.soundEffect, null), 600);
  }

  // ==================================================================
  // Scene 5: "Figure Out This Puzzle" (square puzzle)
  // 6 columns x 8 rows. Six colours, six squares of each, scattered with
  // 12 empty cells. Drag a square to any empty cell (or tap a square, then
  // tap an empty cell). A column glows softly when it holds six of its
  // colour. No wrong feedback, ever. All six columns glowing finishes it.
  // Any arrangement can be reached because there are always free cells.
  // ==================================================================
  function buildSquarePuzzleMechanic(slot, scene, onComplete) {
    const COLS = 6, ROWS = 8, PER = 6;
    const COLOURS = [
      '#9b5de5', // purple
      '#3a86ff', // blue
      '#5fc760', // green
      '#ff9f1c', // orange
      '#ff6fb5', // pink
      '#ffd23f'  // yellow
    ];
    const CELLS = COLS * ROWS;
    const state = new Array(CELLS).fill(-1);
    let selected = null;
    let drag = null;
    let finished = false;
    let doneCols = new Set();

    function shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
    function colComplete(c) {
      let n = 0;
      for (let r = 0; r < ROWS; r++) if (state[r * COLS + c] === c) n++;
      return n === PER;
    }
    function completeColumns() {
      const s = new Set();
      for (let c = 0; c < COLS; c++) if (colComplete(c)) s.add(c);
      return s;
    }

    // Scatter: never start with any column already complete.
    do {
      state.fill(-1);
      const positions = shuffle(Array.from({ length: CELLS }, (_, i) => i)).slice(0, COLS * PER);
      const colours = [];
      for (let c = 0; c < COLS; c++) for (let k = 0; k < PER; k++) colours.push(c);
      shuffle(colours);
      positions.forEach((pos, i) => { state[pos] = colours[i]; });
    } while (completeColumns().size > 0);

    const wrap = document.createElement('div');
    wrap.className = 'aurion-pz';

    const head = document.createElement('div');
    head.className = 'aurion-pz-head';
    const swatches = COLOURS.map((hex) => {
      const s = document.createElement('div');
      s.className = 'aurion-pz-swatch';
      s.style.background = hex;
      head.appendChild(s);
      return s;
    });

    const board = document.createElement('div');
    board.className = 'aurion-pz-board';
    const cellEls = [];
    for (let i = 0; i < CELLS; i++) {
      const cell = document.createElement('div');
      cell.className = 'aurion-pz-cell';
      cell.dataset.i = String(i);
      board.appendChild(cell);
      cellEls.push(cell);
    }
    wrap.append(head, board);
    slot.appendChild(wrap);

    function render() {
      for (let i = 0; i < CELLS; i++) {
        const cell = cellEls[i];
        cell.innerHTML = '';
        cell.classList.toggle('selected', selected === i);
        if (state[i] >= 0) {
          const sq = document.createElement('div');
          sq.className = 'aurion-pz-sq';
          sq.style.background = COLOURS[state[i]];
          cell.appendChild(sq);
        }
      }
      const now = completeColumns();
      for (let c = 0; c < COLS; c++) {
        const isDone = now.has(c);
        swatches[c].classList.toggle('done', isDone);
        for (let r = 0; r < ROWS; r++) cellEls[r * COLS + c].classList.toggle('col-done', isDone);
        if (isDone && !doneCols.has(c)) {
          const sr = wrap.getBoundingClientRect();
          const hr = swatches[c].getBoundingClientRect();
          if (sr.width) {
            burstSparks(wrap,
              ((hr.left + hr.width / 2 - sr.left) / sr.width) * 100,
              ((hr.top + hr.height / 2 - sr.top) / sr.height) * 100,
              8, 40);
          }
        }
      }
      doneCols = now;
    }

    function moveSquare(from, to) {
      state[to] = state[from];
      state[from] = -1;
      selected = null;
      render();
      const landed = cellEls[to].querySelector('.aurion-pz-sq');
      if (landed) landed.classList.add('landed');
      if (completeColumns().size === COLS && !finished) {
        finished = true;
        burstSparks(wrap, 50, 50, 26, 160);
        later(onComplete, 1000);
      }
    }

    function cellIndexAt(x, y) {
      const el = document.elementFromPoint(x, y);
      const c = el && el.closest ? el.closest('.aurion-pz-cell') : null;
      return c && board.contains(c) ? Number(c.dataset.i) : -1;
    }
    function clearDropMarks() {
      board.querySelectorAll('.drop-target').forEach(c => c.classList.remove('drop-target'));
    }
    function endDrag() {
      if (drag && drag.ghost) drag.ghost.remove();
      clearDropMarks();
      drag = null;
    }
    onSceneExit(endDrag);

    board.addEventListener('pointerdown', (e) => {
      if (finished) return;
      const sqEl = e.target.closest('.aurion-pz-sq');
      if (!sqEl) {
        const cellEl = e.target.closest('.aurion-pz-cell');
        if (cellEl && selected !== null && state[Number(cellEl.dataset.i)] === -1) {
          e.preventDefault();
          moveSquare(selected, Number(cellEl.dataset.i));
        }
        return;
      }
      e.preventDefault();
      drag = {
        from: Number(sqEl.parentNode.dataset.i),
        x0: e.clientX, y0: e.clientY,
        moved: false, ghost: null, sq: sqEl, pid: e.pointerId
      };
      try { board.setPointerCapture(e.pointerId); } catch (_) {}
    });

    board.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.pid) return;
      const dist = Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0);
      if (!drag.moved && dist > 6) {
        drag.moved = true;
        selected = null;
        board.querySelectorAll('.selected').forEach(c => c.classList.remove('selected'));
        const r = drag.sq.getBoundingClientRect();
        const ghost = drag.sq.cloneNode(true);
        ghost.className = 'aurion-pz-sq aurion-pz-ghost';
        ghost.style.width = r.width + 'px';
        ghost.style.height = r.height + 'px';
        document.body.appendChild(ghost);
        drag.ghost = ghost;
        drag.sq.classList.add('lifted');
      }
      if (drag.moved && drag.ghost) {
        const w = parseFloat(drag.ghost.style.width) || 40;
        drag.ghost.style.left = (e.clientX - w / 2) + 'px';
        drag.ghost.style.top = (e.clientY - w / 2) + 'px';
        clearDropMarks();
        const idx = cellIndexAt(e.clientX, e.clientY);
        if (idx >= 0 && state[idx] === -1) cellEls[idx].classList.add('drop-target');
      }
    });

    board.addEventListener('pointerup', (e) => {
      if (!drag || e.pointerId !== drag.pid) return;
      const d = drag;
      const idx = d.moved ? cellIndexAt(e.clientX, e.clientY) : -1;
      endDrag();
      if (d.moved) {
        d.sq.classList.remove('lifted');
        if (idx >= 0 && state[idx] === -1) moveSquare(d.from, idx);
      } else {
        selected = (selected === d.from) ? null : d.from;
        render();
      }
    });
    board.addEventListener('pointercancel', () => {
      if (!drag) return;
      const sq = drag.sq;
      endDrag();
      if (sq) sq.classList.remove('lifted');
    });

    render();
  }

  // ==================================================================
  // Scene 6: "Just Enjoy The Scenery" (view + moon)
  // The moon rises on the left, glides slowly over the view in a soft arc
  // (12 seconds) while stars twinkle. Button appears when it arrives.
  // ==================================================================
  function buildMoonMechanic(slot, scene, onComplete) {
    const md = scene.mechanicData || {};
    const stage = makeStage('aurion-moon-stage');
    stage.appendChild(makeFillImage(md.view));

    for (let i = 0; i < 16; i++) {
      const star = document.createElement('span');
      star.className = 'aurion-twinkle';
      star.textContent = '✦';
      star.style.left = (4 + Math.random() * 92).toFixed(1) + '%';
      star.style.top = (3 + Math.random() * 50).toFixed(1) + '%';
      star.style.fontSize = (6 + Math.random() * 8).toFixed(0) + 'px';
      star.style.animationDuration = (2 + Math.random() * 3).toFixed(1) + 's';
      star.style.animationDelay = (Math.random() * 3).toFixed(1) + 's';
      stage.appendChild(star);
    }

    const moon = document.createElement('div');
    moon.className = 'aurion-moon';
    if (md.moon) moon.style.backgroundImage = `url('${resolveAssetUrl(md.moon)}')`;
    stage.appendChild(moon);
    slot.appendChild(stage);

    later(() => moon.classList.add('crossing'), 800);
    moon.addEventListener('animationend', (e) => {
      if (e.target !== moon) return;
      later(onComplete, 600);
    });
  }

  // ==================================================================
  // Scene 7: "Your Horse And Carriage" (find the 3C diamond)
  // Tap the small 3C diamond on the carriage. Sparkles burst, Aurion
  // speaks, button appears when the mp3 ends. If it is not found for a
  // while, the diamond gives a gentle glint as a nudge.
  // ==================================================================
  function buildDiamondMechanic(slot, scene, onComplete) {
    const md = scene.mechanicData || {};
    const stage = makeStage('aurion-diamond-stage');
    stage.appendChild(makeFillImage(md.horsecarriage));

    const hotspot = document.createElement('button');
    hotspot.className = 'aurion-diamond-hotspot';
    hotspot.setAttribute('aria-label', 'Tap the 3C diamond');
    hotspot.style.left = DIAMOND_SPOT.left + '%';
    hotspot.style.top = DIAMOND_SPOT.top + '%';
    stage.appendChild(hotspot);

    let found = false;
    later(() => { if (!found) hotspot.classList.add('hint'); }, 9000);

    hotspot.addEventListener('click', () => {
      if (found) return;
      found = true;
      hotspot.classList.remove('hint');
      hotspot.classList.add('found');
      burstSparks(stage, DIAMOND_SPOT.left, DIAMOND_SPOT.top, 22, 110);
      playVoice(scene.soundEffect, onComplete);
    });

    slot.appendChild(stage);
  }

  // ==================================================================
  // Scene 8: "Your First Stop" (castle road)
  // A glowing light waits at the foot of the road. Drag it up the winding
  // path to the castle door (stars follow it). Letting go early keeps your
  // progress. At the door the doorway glows and the button appears.
  // ==================================================================
  function buildCastleTrailMechanic(slot, scene, onComplete) {
    const md = scene.mechanicData || {};
    const stage = makeStage('aurion-castle-stage');
    stage.appendChild(makeFillImage(md.castle));

    const doorGlow = document.createElement('div');
    doorGlow.className = 'aurion-door-glow';
    doorGlow.style.left = CASTLE_DOOR.left + '%';
    doorGlow.style.top = CASTLE_DOOR.top + '%';
    stage.appendChild(doorGlow);

    const orb = document.createElement('button');
    orb.className = 'aurion-orb';
    orb.setAttribute('aria-label', 'Drag the light up the road to the castle door');
    orb.style.left = CASTLE_START.left + '%';
    orb.style.top = CASTLE_START.top + '%';
    stage.appendChild(orb);

    drawCalibration(stage, CASTLE_CHECKPOINTS, CASTLE_TARGET);

    attachCheckpointDrag(stage, orb, {
      checkpoints: CASTLE_CHECKPOINTS,
      target: CASTLE_TARGET,
      onArrive() {
        orb.classList.add('arrived');
        doorGlow.classList.add('on');
        burstSparks(stage, CASTLE_DOOR.left, CASTLE_DOOR.top, 20, 90);
        later(onComplete, 900);
      }
    });

    slot.appendChild(stage);
  }

  // ==================================================================
  // Scene 9: "Knock On The Door" (doorway + flying boy)
  // Tap the door: it knocks (a soft double knock), the doorway fades and
  // the flying boy pops out, floats big up and down, then whizzes off.
  // Button appears once he has gone. The sprite key is "peterpan" only
  // because the file is still named that; "flyingboy" is read first so the
  // rename later is a one-line change in the JSON.
  // ==================================================================
  function buildCastleDoorMechanic(slot, scene, onComplete) {
    const md = scene.mechanicData || {};
    const boyUrl = md.flyingboy || md.peterpan;
    const stage = makeStage('aurion-doorway-stage');

    const door = document.createElement('button');
    door.className = 'aurion-door-btn';
    door.setAttribute('aria-label', 'Knock on the door');
    if (md.doorway) door.style.backgroundImage = `url('${resolveAssetUrl(md.doorway)}')`;
    stage.appendChild(door);

    const boy = document.createElement('div');
    boy.className = 'aurion-boy';
    const boyInner = document.createElement('div');
    boyInner.className = 'aurion-boy-inner';
    if (boyUrl) boyInner.style.backgroundImage = `url('${resolveAssetUrl(boyUrl)}')`;
    boy.appendChild(boyInner);
    stage.appendChild(boy);

    let knocked = false;
    door.addEventListener('click', () => {
      if (knocked) return;
      knocked = true;
      door.classList.add('knocking');
      playKnock();
      later(() => {
        door.classList.remove('knocking');
        door.classList.add('vanish');
        burstSparks(stage, 50, 52, 18, 120);
        boy.classList.add('cameo');
        trailSparks(stage, boy, 5200);
      }, 800);
    });
    boy.addEventListener('animationend', (e) => {
      if (e.target !== boy) return;
      boy.style.visibility = 'hidden';
      later(onComplete, 250);
    });

    slot.appendChild(stage);
  }

  // ==================================================================
  // Scene 10: "Your Journey Continues" (tree + flying boy)
  // The flying boy swoops in from the left, across to the right, back to
  // the left and lands on a branch. Sparkles on the way, a little burst on
  // landing. Button appears once he has settled.
  // ==================================================================
  function buildTreeMechanic(slot, scene, onComplete) {
    const md = scene.mechanicData || {};
    const boyUrl = md.flyingboy || md.peterpan;
    const stage = makeStage('aurion-tree-stage');
    stage.style.setProperty('--land-left', TREE_LAND.left + '%');
    stage.style.setProperty('--land-top', TREE_LAND.top + '%');
    stage.appendChild(makeFillImage(md.treeofknowledge));

    const boy = document.createElement('div');
    boy.className = 'aurion-tree-boy';
    const inner = document.createElement('div');
    inner.className = 'aurion-boy-inner';
    if (boyUrl) inner.style.backgroundImage = `url('${resolveAssetUrl(boyUrl)}')`;
    boy.appendChild(inner);
    stage.appendChild(boy);
    slot.appendChild(stage);

    later(() => {
      boy.classList.add('flying');
      trailSparks(stage, boy, 6200);
    }, 900);

    boy.addEventListener('animationend', (e) => {
      if (e.target !== boy) return;
      boy.classList.remove('flying');
      boy.classList.add('landed');
      burstSparks(stage, TREE_LAND.left, TREE_LAND.top - 6, 14, 60);
      later(onComplete, 900);
    });
  }

  // ==================================================================
  // Scene 11: "What Else Can You Find Here?" (envelopes)
  // The four envelopes light up in a quick left-to-right sweep that loops
  // (a light moment of urgency: no countdown, no buzzer) until one is
  // tapped. The card shown is the one matching the envelope tapped (N = N), not the crystal pick.
  // Close the card, Aurion speaks, button appears at the end
  // of the mp3.
  // ==================================================================
  function buildEnvelopeMechanic(slot, scene, onComplete) {
    const envelopes = (scene.mechanicData && scene.mechanicData.envelopes) || {};
    // Envelope N always shows card N (crystal 1 = envelope 1, and so on).
    // The crystal picked earlier does NOT decide the card: the envelope does.
    const cardKeys = Object.keys(CRYSTAL_MESSAGES);

    const stage = document.createElement('div');
    stage.className = 'aurion-sort-stage';
    const board = document.createElement('div');
    board.className = 'aurion-sort-board aurion-envelope-board';
    const popup = document.createElement('div');
    popup.className = 'aurion-reveal-popup';

    const tiles = [];
    let opened = false;
    let sweepIndex = -1;
    let sweepTimer = null;

    function sweep() {
      tiles.forEach(t => t.classList.remove('flashing'));
      sweepIndex = (sweepIndex + 1) % tiles.length;
      tiles[sweepIndex].classList.add('flashing');
    }

    Object.entries(envelopes).forEach(([value, imageUrl], envIndex) => {
      const tile = document.createElement('button');
      tile.className = 'aurion-sort-tile aurion-reveal-tile aurion-envelope-tile';
      if (imageUrl) tile.style.backgroundImage = `url('${resolveAssetUrl(imageUrl)}')`;

      tile.addEventListener('click', () => {
        if (opened) return;
        opened = true;
        clearInterval(sweepTimer);
        tiles.forEach(t => {
          t.classList.remove('flashing');
          if (t !== tile) { t.classList.add('dim'); t.disabled = true; }
        });
        tile.classList.add('opened');
        board.classList.add('dimmed');

        popup.innerHTML = '';
        popup.classList.add('open');
        const msg = CRYSTAL_MESSAGES[cardKeys[envIndex % cardKeys.length]];

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
      sweepTimer = setInterval(sweep, 350);
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
