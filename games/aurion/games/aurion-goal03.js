// Repo path: games/aurion/games/aurion-goal03.js
//
// Goal 03 engine (Goal Setting Challenge 03). New file: goal 01's aurion.js,
// style.css, game.html and the shared loader.js are NOT touched.
//
// How it stays in step with goal 01 ("one main with extensions"):
// the five series pages (landing, consent, door, We're Done, finale) are not
// copied into goals.03.json. goals.03.json says { "inherit": ... } and this
// engine reads them live from config/goals.01.json, so those pages, their
// button image/colour/font, voice lines and video are always goal 01's own.
// Only the sticky-note image on the door is replaced (see goals.03.json).
//
// Loaded by loader.js through "gameType": "aurion-goal03" in goals.03.json.
// Styles for the new mechanics live in goal-03.css (injected below).

const SVG_NS = 'http://www.w3.org/2000/svg';
const STYLE_FILE = 'goal-03.css';
const NOTE_FONT_URL = 'https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap';

// Same rule as goal 01: a bare filename lives in this game's assets/ folder.
// Added: "../" and "./" pass through (used for ../../shared/diamond.png).
function resolveAssetUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url) || url.startsWith('assets/') || url.startsWith('/') ||
      url.startsWith('../') || url.startsWith('./') || url.startsWith('data:')) {
    return url;
  }
  return 'assets/' + url;
}

async function fetchJson(path) {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${path}${sep}_cb=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status} loading ${path}`);
  return res.json();
}

function el(tag, cls, parent) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (parent) parent.appendChild(e);
  return e;
}

function loadStyle(href, marker) {
  return new Promise((resolve) => {
    if (document.querySelector(`link[data-g3="${marker}"]`)) return resolve();
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    l.setAttribute('data-g3', marker);
    l.onload = resolve;
    l.onerror = () => { console.warn('[goal-03] stylesheet failed to load:', href); resolve(); };
    document.head.appendChild(l);
  });
}

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

// ---------------------------------------------------------------------------
// Sound effects. No audio files exist for these yet, so they are synthesised
// in the browser (Web Audio). Any of them can be swapped for a real file by
// putting a URL under "sfx" in goals.03.json, e.g. "sfx": { "cheer": "https://..." }
// ---------------------------------------------------------------------------
function createSfx(config) {
  const urls = config.sfx || {};
  const master = typeof config.sfxVolume === 'number' ? Math.max(0, Math.min(1, config.sfxVolume)) : 0.8;
  let ctx = null;
  let noiseBuf = null;

  function ac() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      try { ctx = new C(); } catch (e) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function noiseBuffer(c) {
    if (!noiseBuf) {
      const len = c.sampleRate * 2;
      noiseBuf = c.createBuffer(1, len, c.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    return noiseBuf;
  }

  function envelope(c, g, t, dur, gain, attack) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain * master), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  function tone(c, o) {
    const t = c.currentTime + (o.delay || 0);
    const dur = o.dur;
    const osc = c.createOscillator();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f0, t);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t + dur);
    const g = c.createGain();
    envelope(c, g, t, dur, o.gain == null ? 0.2 : o.gain, o.attack || 0.004);
    if (o.lp) {
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = o.lp;
      osc.connect(f);
      f.connect(g);
    } else {
      osc.connect(g);
    }
    g.connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function noise(c, o) {
    const t = c.currentTime + (o.delay || 0);
    const dur = o.dur;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c);
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = o.type || 'bandpass';
    f.frequency.setValueAtTime(o.f0 || 1000, t);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + dur);
    f.Q.value = o.q || 1;
    const g = c.createGain();
    envelope(c, g, t, dur, o.gain == null ? 0.2 : o.gain, o.attack || 0.004);
    src.connect(f);
    f.connect(g);
    g.connect(c.destination);
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
  }

  const R = {
    bounce(c) { tone(c, { f0: 190, f1: 70, dur: 0.16, gain: 0.5 }); noise(c, { type: 'lowpass', f0: 300, dur: 0.06, gain: 0.15 }); },
    kick(c) { noise(c, { type: 'lowpass', f0: 1200, f1: 150, dur: 0.12, gain: 0.5 }); tone(c, { f0: 160, f1: 50, dur: 0.18, gain: 0.5 }); },
    whoosh(c) { noise(c, { f0: 500, f1: 2400, q: 1.2, dur: 0.45, gain: 0.22, attack: 0.08 }); },
    netHit(c) { noise(c, { f0: 2800, f1: 1200, q: 0.8, dur: 0.5, gain: 0.22 }); tone(c, { f0: 110, f1: 60, dur: 0.25, gain: 0.35 }); },
    cheer(c) {
      noise(c, { f0: 900, q: 0.6, dur: 2.4, gain: 0.22, attack: 0.35 });
      noise(c, { f0: 2200, q: 0.5, dur: 2.2, gain: 0.1, attack: 0.4 });
      for (let i = 0; i < 44; i++) {
        const d = Math.random() * 2.0;
        noise(c, { type: 'highpass', f0: 1500, dur: 0.05, gain: 0.12 * (1 - d / 2.4), delay: d });
      }
      [0.1, 0.25, 0.42, 0.6].forEach((d, i) => tone(c, { type: 'sawtooth', f0: 380 + i * 55, f1: 470 + i * 60, dur: 0.9, gain: 0.04, delay: d, lp: 1200, attack: 0.12 }));
    },
    pinPop(c) { tone(c, { f0: 520, f1: 980, dur: 0.12, gain: 0.3 }); },
    check(c) { tone(c, { f0: 660, dur: 0.18, gain: 0.25 }); tone(c, { f0: 990, dur: 0.32, gain: 0.25, delay: 0.12 }); },
    arrow(c) { noise(c, { f0: 900, f1: 1800, q: 1, dur: 0.3, gain: 0.06, attack: 0.1 }); },
    bell(c) {
      [1, 2.76, 5.4, 8.93].forEach((r, i) => {
        const gain = [0.4, 0.2, 0.1, 0.05][i];
        for (let s = 0; s < 3; s++) tone(c, { f0: 1320 * r, dur: 1.1, gain, delay: s * 0.16 });
      });
    },
    scribble(c, dur) {
      const t = c.currentTime;
      const src = c.createBufferSource();
      src.buffer = noiseBuffer(c);
      src.loop = true;
      const f = c.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 3600; f.Q.value = 2;
      const g = c.createGain();
      for (let x = 0; x < dur; x += 0.06) g.gain.setValueAtTime((0.015 + Math.random() * 0.06) * master, t + x);
      g.gain.setValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(c.destination);
      src.start(t, Math.random()); src.stop(t + dur + 0.05);
    },
    cubeClick(c) {
      noise(c, { type: 'highpass', f0: 2000, dur: 0.03, gain: 0.3 });
      tone(c, { type: 'square', f0: 220, f1: 130, dur: 0.05, gain: 0.12 });
      tone(c, { f0: 90, dur: 0.08, gain: 0.25, delay: 0.02 });
    },
    thud(c) { tone(c, { f0: 150, f1: 48, dur: 0.22, gain: 0.6 }); noise(c, { type: 'lowpass', f0: 400, dur: 0.1, gain: 0.25 }); },
    creak(c) {
      tone(c, { type: 'sawtooth', f0: 90, f1: 130, dur: 0.35, gain: 0.08, lp: 500 });
      tone(c, { type: 'sawtooth', f0: 130, f1: 95, dur: 0.3, gain: 0.06, lp: 450, delay: 0.3 });
    },
    pop(c) { tone(c, { f0: 300, f1: 700, dur: 0.1, gain: 0.3 }); noise(c, { f0: 1800, dur: 0.06, gain: 0.15 }); },
    blip(c, f) { tone(c, { f0: f, dur: 0.3, gain: 0.22 }); tone(c, { f0: f * 2, dur: 0.2, gain: 0.08 }); },
    confetti(c) {
      tone(c, { f0: 250, f1: 60, dur: 0.15, gain: 0.5 });
      noise(c, { type: 'highpass', f0: 1000, dur: 0.35, gain: 0.3 });
      for (let i = 0; i < 8; i++) tone(c, { f0: 2000 + Math.random() * 2500, dur: 0.12, gain: 0.05, delay: 0.1 + i * 0.07 });
    },
    feather(c) { noise(c, { f0: 1400, f1: 2600, q: 1.5, dur: 0.45, gain: 0.05, attack: 0.15 }); },
    glow(c) { tone(c, { f0: 880, dur: 0.9, gain: 0.08, attack: 0.3 }); tone(c, { f0: 1318, dur: 0.9, gain: 0.05, attack: 0.3, delay: 0.1 }); },
    // goal 03
    step(c) { noise(c, { type: 'lowpass', f0: 700, f1: 200, dur: 0.1, gain: 0.22 }); tone(c, { f0: 110, f1: 70, dur: 0.1, gain: 0.18 }); },
    fog(c) { noise(c, { type: 'lowpass', f0: 500, f1: 180, q: 0.5, dur: 3.2, gain: 0.16, attack: 1.4 }); tone(c, { f0: 196, dur: 3.2, gain: 0.025, attack: 1.4, lp: 400 }); },
    stonePulse(c) { tone(c, { f0: 262, dur: 0.7, gain: 0.07, attack: 0.25 }); tone(c, { f0: 392, dur: 0.7, gain: 0.04, attack: 0.25, delay: 0.05 }); },
    stoneLit(c) { [523, 659, 784, 1047].forEach((f, i) => tone(c, { f0: f, dur: 0.9, gain: 0.12, delay: i * 0.07, attack: 0.01 })); noise(c, { type: 'highpass', f0: 3500, dur: 0.5, gain: 0.05, delay: 0.1 }); },
    heartbeat(c) { tone(c, { f0: 80, f1: 50, dur: 0.14, gain: 0.35 }); tone(c, { f0: 72, f1: 46, dur: 0.16, gain: 0.28, delay: 0.17 }); },
    star(c) { [1319, 1760, 2349].forEach((f, i) => tone(c, { f0: f, dur: 0.6, gain: 0.1, delay: i * 0.06, attack: 0.01 })); },
    glint(c) { tone(c, { f0: 2637, dur: 0.35, gain: 0.04, attack: 0.02 }); tone(c, { f0: 3520, dur: 0.3, gain: 0.025, attack: 0.02, delay: 0.05 }); },
    needle(c) { for (let i = 0; i < 5; i++) tone(c, { type: 'triangle', f0: 1800 - i * 120, dur: 0.05, gain: 0.05, delay: i * 0.11 }); },
    shake(c) { for (let i = 0; i < 4; i++) { tone(c, { type: 'triangle', f0: 1400 + (i % 2) * 220, dur: 0.05, gain: 0.07, delay: i * 0.06 }); } },
    boing(c) { tone(c, { f0: 200, f1: 520, dur: 0.22, gain: 0.3 }); tone(c, { f0: 520, f1: 300, dur: 0.18, gain: 0.15, delay: 0.2 }); },
    land(c) { tone(c, { f0: 130, f1: 60, dur: 0.14, gain: 0.35 }); noise(c, { type: 'lowpass', f0: 600, dur: 0.07, gain: 0.12 }); },
    rays(c) { noise(c, { f0: 2000, f1: 5000, q: 0.8, dur: 1.1, gain: 0.05, attack: 0.4 }); [784, 988, 1175, 1568].forEach((f, i) => tone(c, { f0: f, dur: 1.0, gain: 0.06, delay: i * 0.12, attack: 0.1 })); },
    gift(c) { [659, 784, 988, 1319].forEach((f, i) => tone(c, { f0: f, dur: 0.5, gain: 0.12, delay: i * 0.09, attack: 0.01 })); },
    giftPop(c) { tone(c, { f0: 400, f1: 900, dur: 0.12, gain: 0.25 }); noise(c, { type: 'highpass', f0: 3000, dur: 0.25, gain: 0.12, delay: 0.05 }); }
  };

  function play(name, arg) {
    if (urls[name]) {
      try { const a = new Audio(urls[name]); a.volume = master; a.play().catch(() => {}); } catch (e) { /* ignore */ }
      return;
    }
    const c = ac();
    if (!c || !R[name]) return;
    try { R[name](c, arg); } catch (e) { console.warn('[goal-03] sfx failed:', name, e); }
  }
  return { play };
}

// ---------------------------------------------------------------------------
// Series inheritance: pull goal 01's pages for the five "keep" scenes.
// ---------------------------------------------------------------------------
function findParentScene(rule, pd) {
  let idx = -1;
  if (rule.match) idx = pd.findIndex((s) => s.adminLabel === rule.match);
  if (idx < 0 && rule.mechanic) idx = pd.findIndex((s) => s.mechanic === rule.mechanic);
  if (idx < 0 && rule.find === 'done') {
    for (let i = pd.length - 2; i >= 0; i--) { if (pd[i].video) { idx = i; break; } }
    if (idx < 0 && pd.length >= 2) idx = pd.length - 2;
  }
  if (idx < 0 && rule.find === 'last') idx = pd.length - 1;
  if (idx < 0 && typeof rule.orIndex === 'number') idx = rule.orIndex;
  if (idx < 0 || !pd[idx]) throw new Error('Could not find the shared page in goals.01: ' + JSON.stringify(rule));
  return pd[idx];
}

function mergeInherited(base, ov) {
  const merged = Object.assign({}, base, ov);
  if (ov.mechanicData) merged.mechanicData = Object.assign({}, base.mechanicData || {}, ov.mechanicData);
  if (ov.buttons) {
    merged.buttons = ov.buttons.map((b, i) => {
      const own = (base.buttons || [])[i] || (base.buttons || [])[0] || {};
      const m = Object.assign({}, own, b);
      if (b.text && b.textNudge === undefined) delete m.textNudge; // nudge was tuned for the old label
      return m;
    });
  }
  return merged;
}

export function startGame(config, container) {
  let sceneIndex = 0;
  let sceneToken = 0;
  let ambientAudio = null;
  let decisions = [];
  const cleanups = [];
  const voices = [];
  const sfx = createSfx(config);

  container.classList.add('aurion-game');
  container.innerHTML = '';

  const bgLayer = document.createElement('div');
  bgLayer.className = 'aurion-bg-layer';
  container.appendChild(bgLayer);

  const content = document.createElement('div');
  content.className = 'aurion-content';
  container.appendChild(content);

  // Exit symbol: same file, same behaviour as goal 01 (every scene but the last).
  const exitBtn = document.createElement('button');
  exitBtn.className = 'aurion-exit-btn';
  exitBtn.style.backgroundImage = `url('${resolveAssetUrl('goal.01-exitsymbol.png')}')`;
  exitBtn.setAttribute('aria-label', 'Exit');
  exitBtn.addEventListener('click', () => {
    runCleanups();
    if (ambientAudio) { ambientAudio.pause(); ambientAudio = null; }
    renderGoodbye();
    window.close();
  });

  // Credit watermark: consent page only, same as goal 01.
  const watermark = document.createElement('div');
  watermark.className = 'aurion-watermark';
  watermark.textContent = 'Designed and Built with ❤️ by Claude (Anthropic) × Chef Anica · 3C Thread To Success™ Cooking Lab  🧪👨‍🍳';
  watermark.style.display = 'none';
  container.appendChild(watermark);

  renderLoading();
  boot().catch((err) => {
    console.error('[goal-03] could not start:', err);
    renderFatal(err && err.message ? err.message : String(err));
  });

  async function boot() {
    const styleReady = loadStyle(`${STYLE_FILE}?_cb=${Date.now()}`, 'css');
    const fontReady = Promise.race([
      loadStyle(NOTE_FONT_URL, 'font').then(() => (document.fonts ? document.fonts.load('20px "Patrick Hand"') : null)).catch(() => {}),
      new Promise((r) => setTimeout(r, 4000))
    ]);
    const parentName = config.inheritFrom || 'goals.01';
    const [parent] = await Promise.all([fetchJson(`config/${parentName}.json`), styleReady, fontReady]);
    const pd = parent.decisions || [];

    // 1) inherited pages
    let list = (config.decisions || []).map((d) => {
      if (!d.inherit) return d;
      const base = JSON.parse(JSON.stringify(findParentScene(d.inherit, pd)));
      return mergeInherited(base, d.override || {});
    });

    // 2) title style + button look come from goal 01 so the series never drifts
    const door = list.find((s) => s.mechanic === 'door') || {};
    const titleStyle = { titleColor: '#ffbd59' };
    ['titleFont', 'titleColor', 'titleSize', 'titleBold'].forEach((k) => { if (door[k]) titleStyle[k] = door[k]; });
    const lb = ((list[0] && list[0].buttons) || [])[0] || {};
    const baseButton = { image: lb.image || 'goal.01.button.png' };
    ['font', 'color', 'size'].forEach((k) => { if (lb[k]) baseButton[k] = lb[k]; });

    list = list.map((d) => {
      if (!d.g3) return d;
      const s = Object.assign({}, titleStyle, d);
      s.buttons = (d.buttons || []).map((b) => Object.assign({}, baseButton, b));
      return s;
    });
    decisions = list;

    // 3) shared look: background / ambient sound come from goal 01 unless goals.03.json sets its own
    (config.inheritGlobals || []).forEach((k) => { if (config[k] === undefined && parent[k] !== undefined) config[k] = parent[k]; });

    await preloadAssets();
    startAmbient();
    renderScene(0);
  }

  function collectImageUrls(node, out) {
    if (!node) return;
    if (typeof node === 'string') {
      if (/\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(node)) out.add(node);
    } else if (Array.isArray(node)) {
      node.forEach((n) => collectImageUrls(n, out));
    } else if (typeof node === 'object') {
      Object.values(node).forEach((n) => collectImageUrls(n, out));
    }
  }

  function preloadAssets() {
    const urls = new Set();
    collectImageUrls(decisions, urls);
    if (config.background && config.background.type !== 'video') collectImageUrls(config.background.url, urls);
    urls.add('goal.01-exitsymbol.png');
    const jobs = Array.from(urls).map((u) => new Promise((resolve) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = resolve;
      img.src = resolveAssetUrl(u);
    }));
    return Promise.race([Promise.all(jobs), new Promise((r) => setTimeout(r, 8000))]);
  }

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
        <circle cx="70" cy="40" r="2" fill="#ffe9b3" opacity="0.8"><animate attributeName="opacity" values="0.2;0.9;0.2" dur="2.4s" repeatCount="indefinite"/></circle>
        <circle cx="300" cy="60" r="2.5" fill="#ffe9b3" opacity="0.6"><animate attributeName="opacity" values="0.8;0.2;0.8" dur="3.1s" repeatCount="indefinite"/></circle>
        <circle cx="320" cy="180" r="1.8" fill="#ffe9b3" opacity="0.7"><animate attributeName="opacity" values="0.3;0.9;0.3" dur="2.7s" repeatCount="indefinite"/></circle>
        <g transform="translate(190,130)">
          <g>
            <animateTransform attributeName="transform" type="rotate" values="0;0;180;180;360" keyTimes="0;0.4;0.5;0.9;1" dur="6s" repeatCount="indefinite"/>
            <path d="M -55 -85 Q -55 -95 -45 -95 L 45 -95 Q 55 -95 55 -85 Q 55 -55 15 -8 Q 8 0 15 8 Q 55 55 55 85 Q 55 95 45 95 L -45 95 Q -55 95 -55 85 Q -55 55 -15 8 Q -8 0 -15 -8 Q -55 -55 -55 -85 Z" fill="url(#aurionGlassGrad)" stroke="#f0b429" stroke-width="3" stroke-linejoin="round"/>
            <path d="M -47 -82 Q -47 -88 -40 -88 L 40 -88 Q 47 -88 47 -82 Q 47 -56 12 -10 Q 12 -6 -12 -10 Q -47 -56 -47 -82 Z" fill="url(#aurionSandGrad)" opacity="0.9"/>
            <path d="M -8 40 Q -8 70 -30 82 Q -35 85 -35 88 L 35 88 Q 35 85 30 82 Q 8 70 8 40 Q 8 55 0 60 Q -8 55 -8 40 Z" fill="url(#aurionSandGrad)" opacity="0.9"/>
            <rect x="-1.5" y="-8" width="3" height="16" fill="#ffe9b3"><animate attributeName="height" values="16;4;16" dur="1.2s" repeatCount="indefinite"/></rect>
          </g>
        </g>
        <circle cx="190" cy="122" r="3" fill="#ffe9b3"><animate attributeName="cy" values="105;150;105" dur="1.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;1;0" dur="1.4s" repeatCount="indefinite"/></circle>
      </svg>`;

    const greeting = document.createElement('p');
    greeting.className = 'aurion-loading-greeting';
    greeting.textContent = 'Hey Champ!';

    const msg = document.createElement('p');
    msg.className = 'aurion-body-text';
    msg.textContent = "I'm getting everything ready for you. The first visit can take a little longer while your browser gets everything organised. Hang in there, it'll be worth the wait!";

    wrap.append(hourglass, greeting, msg);
    content.appendChild(wrap);
  }

  function renderFatal(message) {
    content.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'aurion-page-card';
    const p = document.createElement('p');
    p.className = 'aurion-page-text';
    p.textContent = 'This challenge could not start. Please refresh the page and try again.';
    const d = document.createElement('p');
    d.className = 'aurion-page-text';
    d.style.fontSize = '0.75rem';
    d.style.opacity = '0.6';
    d.textContent = message;
    wrap.append(p, d);
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
      video.autoplay = true; video.loop = true; video.muted = true; video.playsInline = true;
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

  function applyStyledText(node, obj, prefix) {
    if (obj[prefix + 'Font']) node.style.fontFamily = `'${obj[prefix + 'Font']}', Luckiest Guy`;
    if (obj[prefix + 'Color']) node.style.color = obj[prefix + 'Color'];
    if (obj[prefix + 'Size']) node.style.fontSize = obj[prefix + 'Size'] + 'px';
    if (obj[prefix + 'Bold']) node.style.fontWeight = '700';
  }

  // Same helper as goal 01: flags button labels that really wrapped to 2 lines.
  function markWrappedButtonLabels(row) {
    row.querySelectorAll('.aurion-btn-label').forEach((label) => {
      const range = document.createRange();
      range.selectNodeContents(label);
      label.classList.toggle('aurion-btn-label-wrapped', range.getClientRects().length > 1);
    });
  }

  // Everything a scene starts (timers, animations, voices) is undone when the
  // player leaves it, so "Another Round" or the exit symbol never leaves
  // anything running behind the next page.
  function runCleanups() {
    sceneToken++;
    cleanups.splice(0).forEach((fn) => { try { fn(); } catch (e) { /* ignore */ } });
    voices.splice(0).forEach((a) => { try { a.pause(); } catch (e) { /* ignore */ } });
  }

  function playVoice(url, onEnd, onProgress) {
    let done = false;
    const finish = () => { if (done) return; done = true; if (onEnd) onEnd(); };
    const a = new Audio(resolveAssetUrl(url));
    voices.push(a);
    a.addEventListener('ended', finish);
    a.addEventListener('error', finish);
    if (onProgress) a.addEventListener('timeupdate', () => { if (a.duration) onProgress(a.currentTime / a.duration); });
    a.play().catch(finish);
    return a;
  }

  // -------------------------------------------------------------------------
  // Scene rendering. Same structure as goal 01's renderScene so the shared
  // pages behave identically; new mechanics are dispatched from here.
  // -------------------------------------------------------------------------
  function renderScene(index) {
    sceneIndex = index;
    const scene = decisions[index];
    if (!scene) return;
    runCleanups();
    const tok = sceneToken;

    const isLastScene = index === decisions.length - 1;
    exitBtn.style.display = isLastScene ? 'none' : 'flex';
    if (!container.contains(exitBtn)) container.appendChild(exitBtn);
    watermark.style.display = scene.adminLabel === 'consent page' ? 'block' : 'none';

    setBackground(scene.background);
    content.innerHTML = '';

    const mech = scene.mechanic;
    const isG3 = !!(mech && mech.startsWith('g3-'));

    const wrap = document.createElement('div');
    wrap.className = 'aurion-scene-wrap';
    if ((!mech || mech === 'none') && !scene.video) wrap.classList.add('aurion-no-mechanic');
    if (mech === 'sorting' || mech === 'reveal-cards' || mech === 'word-picker') wrap.classList.add('aurion-has-side-panel');
    if (scene.g3) wrap.classList.add('g3-scene');
    if (scene.g3) wrap.classList.add('g3-wide');
    if (mech === 'g3-walk') wrap.classList.add('g3-bigdesc');
    if (scene.adminLabel === 'landing page' || scene.adminLabel === 'consent page') wrap.classList.add('aurion-intro-scene');
    if (scene.adminLabel === 'landing page' || scene.adminLabel === 'consent page' || scene.adminLabel === 'final page') wrap.classList.add('aurion-mobile-hero-image');

    let introOverlayImg = null;
    if (scene.overlayImage && scene.overlayImage.url) {
      const img = document.createElement('img');
      img.src = resolveAssetUrl(scene.overlayImage.url);
      img.alt = '';
      img.className = 'aurion-overlay-img aurion-overlay-' + (scene.overlayImage.position || 'center');
      if (scene.adminLabel === 'landing page' || scene.adminLabel === 'consent page' || scene.adminLabel === 'final page') {
        introOverlayImg = img;
      } else {
        wrap.appendChild(img);
      }
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
    if (introOverlayImg) textBlock.appendChild(introOverlayImg);

    if (scene.subtitleText) {
      const subtitle = document.createElement('p');
      subtitle.className = 'aurion-scene-subtitle' + (scene.g3 ? ' g3-subtitle' : '');
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

    const mechanicSlot = document.createElement('div');
    mechanicSlot.className = 'aurion-mechanic-slot';
    wrap.appendChild(mechanicSlot);

    let mechanicGatesButton = false;

    if (mech === 'door' && scene.mechanicData) {
      mechanicGatesButton = true;
      buildDoorMechanic(mechanicSlot, scene, revealButtons);
    }

    if (isG3) {
      const entry = G3_MECHANICS[mech];
      if (entry) {
        mechanicGatesButton = entry.gates;
        const c = makeCtx(mechanicSlot, scene, revealButtons, tok);
        Promise.resolve().then(() => entry.fn(c)).catch((err) => {
          console.error('[goal-03] scene problem (' + (scene.adminLabel || mech) + '):', err);
          if (entry.gates) revealButtons();
        });
      } else {
        console.warn('[goal-03] unknown mechanic:', mech);
      }
    }

    if (scene.video) {
      const video = document.createElement('video');
      video.className = 'aurion-scene-video';
      video.src = scene.video;
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
      if (typeof btn.textNudge === 'number') label.style.marginTop = btn.textNudge + 'px';
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
          b.addEventListener('click', () => { renderGoodbye(); window.close(); });
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
      if (tok !== sceneToken) return;
      buttonRow.style.visibility = 'visible';
    }

    // Button timing, same rule as goal 01: a mechanic that gates its own
    // completion reveals the button itself; otherwise a scene with a voice line
    // waits for the voice to finish (after a 2 second beat to read first).
    if (mechanicGatesButton) {
      // the mechanic calls revealButtons itself
    } else if (scene.soundEffect) {
      const id = setTimeout(() => {
        if (tok !== sceneToken) return;
        playVoice(scene.soundEffect, revealButtons);
      }, 2000);
      cleanups.push(() => clearTimeout(id));
    } else {
      revealButtons();
    }
  }

  // Door: copied from goal 01 so it behaves exactly the same.
  function buildDoorMechanic(slot, scene, onOpened) {
    const stage = document.createElement('div');
    stage.className = 'aurion-door-stage';

    const closedImg = document.createElement('img');
    closedImg.className = 'aurion-door-img aurion-door-closed';
    closedImg.src = resolveAssetUrl((scene.image && scene.image.url) || '');
    closedImg.alt = '';

    const openImg = document.createElement('img');
    openImg.className = 'aurion-door-img aurion-door-open';
    openImg.src = resolveAssetUrl(scene.mechanicData.openImage || '');
    openImg.alt = '';

    const revealImg = document.createElement('img');
    revealImg.className = 'aurion-door-reveal';
    revealImg.src = resolveAssetUrl(scene.mechanicData.revealImage || '');
    revealImg.alt = '';

    stage.append(closedImg, openImg, revealImg);
    stage.addEventListener('click', () => {
      if (stage.classList.contains('opened')) return;
      stage.classList.add('opened');
      onOpened();
    });
    slot.appendChild(stage);
  }

  function renderCredits() {
    runCleanups();
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
    backBtn.addEventListener('click', () => renderScene(decisions.length - 1));
    wrap.append(title, text, backBtn);
    content.appendChild(wrap);
  }

  function renderGoodbye() {
    runCleanups();
    if (ambientAudio) { ambientAudio.pause(); ambientAudio = null; }
    content.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'aurion-page-card';
    const message = document.createElement('p');
    message.className = 'aurion-page-text';
    message.textContent = 'Thanks for playing!';
    wrap.appendChild(message);
    content.appendChild(wrap);
  }

  // -------------------------------------------------------------------------
  // Helpers for the new mechanics
  // -------------------------------------------------------------------------
  function makeCtx(slot, scene, reveal, tok) {
    const alive = () => tok === sceneToken;
    const c = {
      slot, scene, reveal, alive,
      md: scene.mechanicData || {},
      sleep(ms) {
        return new Promise((res) => {
          const id = setTimeout(() => { if (alive()) res(); }, ms);
          cleanups.push(() => clearTimeout(id));
        });
      },
      later(fn, ms) {
        const id = setTimeout(() => { if (alive()) fn(); }, ms);
        cleanups.push(() => clearTimeout(id));
      },
      // the scene is attached to the page a moment after the mechanic starts
      ready() {
        return new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(() => { if (alive()) res(); })));
      },
      anim(node, frames, opts) {
        const a = node.animate(frames, opts);
        cleanups.push(() => a.cancel());
        return new Promise((res) => { a.onfinish = () => { if (alive()) res(); }; });
      },
      tween(ms, step) {
        return new Promise((res) => {
          const t0 = performance.now();
          let id = 0;
          const f = (now) => {
            if (!alive()) return;
            const t = Math.min(1, (now - t0) / ms);
            step(t);
            if (t < 1) { id = requestAnimationFrame(f); } else { res(); }
          };
          id = requestAnimationFrame(f);
          cleanups.push(() => cancelAnimationFrame(id));
        });
      },
      loop(fn) {
        let id = 0;
        let last = performance.now();
        const f = (now) => {
          if (!alive()) return;
          fn(now, (now - last) / 1000);
          last = now;
          id = requestAnimationFrame(f);
        };
        id = requestAnimationFrame(f);
        cleanups.push(() => cancelAnimationFrame(id));
      },
      tap(node) {
        return new Promise((res) => node.addEventListener('click', () => { if (alive()) res(); }, { once: true }));
      }
    };
    return c;
  }

  // All coordinates in goals.03.json are Canva page coordinates (1920 x 1080),
  // so each scene matches the Canva page. The stage is the bounding box of the
  // scene's pictures; every picture is placed in % of that box.
  function makeStage(slot, lay) {
    const stage = el('div', 'g3-stage', slot);
    stage.style.aspectRatio = `${lay.w} / ${lay.h}`;
    // --g3-k = screen px per Canva px: one scale for every scene, so the main
    // pictures keep the same size from page to page, as they do in Canva.
    stage.style.width = `min(94vw, calc(var(--g3-k) * ${(lay.w * (lay.size || 1)).toFixed(1)}))`;
    return stage;
  }

  function placeBox(node, b, lay) {
    node.style.left = ((b.x - lay.x0) / lay.w * 100) + '%';
    node.style.top = ((b.y - lay.y0) / lay.h * 100) + '%';
    node.style.width = (b.w / lay.w * 100) + '%';
    node.style.height = (b.h / lay.h * 100) + '%';
  }

  // The artwork files are 1080 x 1080 with transparent margins; Canva's boxes
  // are tight around the visible part. "crop" = [x0,y0,x1,y1] of the visible
  // part in the file's own pixels. The file is placed so that part lands
  // exactly on the Canva box. Without a crop the file fills the box.
  const cropCache = {};
  function measureCrop(url) {
    if (cropCache[url]) return cropCache[url];
    cropCache[url] = new Promise((resolve) => {
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = () => {
        try {
          const n = 270, cv = document.createElement('canvas');
          cv.width = n; cv.height = n;
          const cx = cv.getContext('2d');
          cx.drawImage(im, 0, 0, n, n);
          const d = cx.getImageData(0, 0, n, n).data;
          let x0 = n, y0 = n, x1 = -1, y1 = -1;
          for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
            if (d[(y * n + x) * 4 + 3] > 12) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
          }
          if (x1 < 0) return resolve(null);
          const k = (im.naturalWidth || 1080) / n, kh = (im.naturalHeight || 1080) / n;
          resolve([x0 * k, y0 * kh, (x1 + 1) * k, (y1 + 1) * kh, im.naturalWidth || 1080, im.naturalHeight || 1080]);
        } catch (e) { resolve(null); }
      };
      im.onerror = () => resolve(null);
      im.src = url;
    });
    return cropCache[url];
  }

  function applyImageBox(img, lay, it, crop) {
    let b = { x: it.x, y: it.y, w: it.w, h: it.h };
    let ox = 50, oy = 50;
    if (crop) {
      const nw = crop[4] || 1080, nh = crop[5] || 1080;
      const sx = it.w / (crop[2] - crop[0]), sy = it.h / (crop[3] - crop[1]);
      b = { x: it.x - crop[0] * sx, y: it.y - crop[1] * sy, w: nw * sx, h: nh * sy };
      ox = ((it.x + it.w / 2 - b.x) / b.w) * 100;
      oy = ((it.y + it.h / 2 - b.y) / b.h) * 100;
    }
    placeBox(img, b, lay);
    img.style.transformOrigin = ox + '% ' + oy + '%';
  }

  function addImage(parent, lay, it, cls) {
    const img = el('img', 'g3-item' + (cls ? ' ' + cls : ''), parent);
    const url = resolveAssetUrl(it.src);
    img.src = url;
    img.alt = '';
    img.draggable = false;
    applyImageBox(img, lay, it, it.crop || null);
    if (!it.crop && it.measure !== false) {
      // no stored crop: if the browser may read the file, measure it
      measureCrop(url).then((c) => { if (c && img.isConnected) applyImageBox(img, lay, it, c); });
    }
    if (it.rot) img.style.rotate = it.rot + 'deg';
    if (it.z != null) img.style.zIndex = String(it.z);
    return img;
  }

  // invisible, slightly oversized tap target over a picture
  function addHit(stage, lay, box, grow) {
    const g = grow == null ? 0.3 : grow;
    const hit = el('div', 'g3-hit', stage);
    placeBox(hit, { x: box.x - box.w * g / 2, y: box.y - box.h * g / 2, w: box.w * (1 + g), h: box.h * (1 + g) }, lay);
    return hit;
  }

  function svgEl(tag, attrs, parent) {
    const n = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach((k) => n.setAttribute(k, attrs[k]));
    if (parent) parent.appendChild(n);
    return n;
  }

  // -------------------------------------------------------------------------
  // Goal 03 mechanics. Each receives ctx c (see makeCtx). All positions come
  // from goals.03.json in Canva page units (1920 x 1080); the road's stones and
  // each figure's feet were measured from the 1080 x 1080 artwork.
  // -------------------------------------------------------------------------
  const px = (stage, lay) => stage.clientWidth / lay.w || 0.5; // screen px per Canva unit

  function glowOn(node, on) { node.classList.toggle('g3-glow', !!on); }
  function pulseOn(node, on) { node.classList.toggle('g3-pulse', !!on); }

  // screen px per Canva px, read from the shared scale
  function kPx(node) {
    const p = document.createElement('div');
    p.style.cssText = 'position:absolute;visibility:hidden;height:0;width:calc(var(--g3-k) * 1000)';
    node.appendChild(p);
    const k = p.getBoundingClientRect().width / 1000;
    p.remove();
    return k > 0 ? k : 0.8;
  }

  // A whole 1080 x 1080 file placed as a square centred on (cx, cy)
  function placeFull(parent, lay, it, cls) {
    const img = el('img', 'g3-item' + (cls ? ' ' + cls : ''), parent);
    img.src = resolveAssetUrl(it.src);
    img.alt = '';
    img.draggable = false;
    placeBox(img, { x: it.cx - it.size / 2, y: it.cy - it.size / 2, w: it.size, h: it.size }, lay);
    if (it.rot) img.style.rotate = it.rot + 'deg';
    if (it.flip) img.style.transform = 'scaleX(-1)';
    if (it.z != null) img.style.zIndex = String(it.z);
    return img;
  }

  // The road scenes share one kit: the road, its stones, a walking figure,
  // a cloud and sparkles, all in the same coordinates.
  function roadKit(c) {
    const md = c.md, lay = md.lay;
    const stage = makeStage(c.slot, lay);
    const road = placeFull(stage, lay, Object.assign({ z: 1 }, md.road));
    road.style.opacity = '0';
    const rs = md.road.size / 1080, ox = md.road.cx - md.road.size / 2, oy = md.road.cy - md.road.size / 2;
    const stones = md.stones.map((s) => ({ x: ox + s[0] * rs, y: oy + s[1] * rs, w: s[2] * rs, h: s[3] * rs }));
    const kk = () => stage.clientWidth / lay.w || 0.5;
    const ground = (i) => { const s = stones[Math.max(0, Math.min(stones.length - 1, i))]; return { x: s.x, y: s.y + s.h * 0.1, w: s.w }; };
    const along = (u) => {
      const i = Math.floor(u), f = u - i, a = ground(i), b = ground(i + 1);
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, w: a.w + (b.w - a.w) * f };
    };
    const G0 = ground(0);

    const kit = { stage, lay, road, stones, ground, along, kk, md };

    kit.sparkles = (pt, n, spread, big) => {
      for (let i = 0; i < n; i++) {
        const s = el('i', 'g3-spark', stage);
        s.style.left = ((pt.x - lay.x0) / lay.w * 100) + '%';
        s.style.top = ((pt.y - lay.y0) / lay.h * 100) + '%';
        const sz = (big ? 14 : 9) + Math.random() * 7;
        s.style.width = s.style.height = (sz * kk()) + 'px';
        const a = Math.random() * Math.PI * 2, d = (spread || 60) * (0.4 + Math.random() * 0.8) * kk();
        const an = s.animate([
          { opacity: 0, transform: 'translate(-50%,-50%) scale(.3)' },
          { opacity: 1, transform: `translate(calc(-50% + ${Math.cos(a) * d * 0.5}px), calc(-50% + ${Math.sin(a) * d * 0.5 - 8}px)) scale(1)`, offset: 0.35 },
          { opacity: 0, transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d - 30 * kk()}px)) scale(.2)` }
        ], { duration: 900 + Math.random() * 500, delay: Math.random() * 250, easing: 'ease-out', fill: 'both' });
        an.onfinish = () => s.remove();
      }
    };

    // a walking figure: every pose is a wrapper pinned at its feet on the first
    // stone; moving it = translate + scale around the feet
    kit.makeFigure = (poses) => {
      const f = { els: {}, cur: null };
      Object.keys(poses).forEach((n) => {
        const P = poses[n];
        const S = (P.ratio || md.ratio || 2.6) * stones[0].w;
        const fx = P.flip ? 1080 - P.foot[0] : P.foot[0];
        const w = el('div', 'g3-fig', stage);
        placeBox(w, { x: G0.x - fx / 1080 * S, y: G0.y - P.foot[1] / 1080 * S, w: S, h: S }, lay);
        w.style.transformOrigin = (fx / 10.8) + '% ' + (P.foot[1] / 10.8) + '%';
        w.style.opacity = '0';
        const im = el('img', 'g3-figimg' + (P.flip ? ' g3-flip' : ''), w);
        im.src = resolveAssetUrl(P.src);
        im.alt = ''; im.draggable = false;
        f.els[n] = w;
      });
      f.show = (n) => { Object.keys(f.els).forEach((k) => { f.els[k].style.opacity = k === n ? '1' : '0'; }); f.cur = n; };
      f.hideAll = () => { Object.keys(f.els).forEach((k) => { f.els[k].style.opacity = '0'; }); f.cur = null; };
      f.put = (n, p, lift) => {
        const k = kk(), w = f.els[n];
        w.style.translate = `${(p.x - G0.x) * k}px ${(p.y - G0.y - (lift || 0)) * k}px`;
        w.style.scale = String(p.w / stones[0].w);
      };
      f.fade = (ms) => stage.style.setProperty('--g3-fd', ms + 'ms');
      return f;
    };

    // walk along the stones from stone `from` to stone `to`
    kit.walk = (fig, poseAt, from, to, msPer, hopH) => {
      let lastI = -1;
      return c.tween(Math.abs(to - from) * msPer, (t) => {
        const u = from + (to - from) * t;
        const p = kit.along(u);
        const ph = u % 1;
        const lift = Math.sin(Math.PI * ph) * (hopH == null ? 16 : hopH) * (p.w / stones[0].w);
        const pose = poseAt(u);
        if (fig.cur !== pose) fig.show(pose);
        fig.put(pose, p, lift);
        const i = Math.floor(u + 0.0001);
        if (i !== lastI) { lastI = i; if (t > 0) sfx.play('step'); }
      });
    };

    // a soft cloud made of blurred puffs
    kit.makeFog = (center, size) => {
      const f = el('div', 'g3-fog', stage);
      placeBox(f, { x: center.x - size / 2, y: center.y - size * 0.42, w: size, h: size * 0.84 }, lay);
      const spots = [[10, 40, 46], [32, 18, 52], [56, 30, 50], [78, 42, 46], [22, 62, 54], [50, 66, 56], [74, 64, 48], [44, 44, 62]];
      spots.forEach((p, i) => {
        const pf = el('i', 'g3-puff', f);
        pf.style.left = p[0] + '%'; pf.style.top = p[1] + '%'; pf.style.width = p[2] + '%'; pf.style.paddingBottom = (p[2] * 0.62) + '%';
        pf.style.animationDelay = (-i * 1.3) + 's';
        pf.style.animationDuration = (9 + (i % 4) * 2.3) + 's';
      });
      f.style.opacity = '0';
      return f;
    };

    // the first stone: a glow laid over it, optionally pulsing
    kit.makeStoneGlow = () => {
      const s0 = stones[0];
      const g = el('div', 'g3-stoneglow', stage);
      placeBox(g, { x: s0.x - s0.w * 0.8, y: s0.y - s0.h * 1.5, w: s0.w * 1.6, h: s0.h * 3 }, lay);
      g.style.opacity = '0';
      return g;
    };

    kit.boot = async () => {
      await c.ready();
      if (!c.alive()) return;
      await c.anim(road, [{ opacity: 0 }, { opacity: 1 }], { duration: 600, fill: 'forwards' });
      road.style.opacity = '1';
    };
    return kit;
  }

  const sleepUntil = (c, test, step) => new Promise((res) => {
    const iv = setInterval(() => { if (!c.alive()) { clearInterval(iv); return; } if (test()) { clearInterval(iv); res(); } }, step || 100);
    cleanups.push(() => clearInterval(iv));
  });

  // A spoken "press it" for the pulsing item: first after a few quiet seconds, then now and
  // then, only while the player has not tapped yet. The sound effects stay as they are.
  // The clip comes from config.pressVoice; if it is not set (or fails to load) nothing plays.
  function nudge(c, isWaiting) {
    const url = config && config.pressVoice;
    if (!url) return;
    const go = (ms) => c.later(() => {
      if (!isWaiting()) return;
      const a = new Audio(resolveAssetUrl(url));
      voices.push(a);
      a.addEventListener('ended', () => go(5500));
      a.addEventListener('error', () => {});
      a.play().catch(() => {});
    }, ms);
    go(4200);
  }

  // 04 THE ROAD AHEAD: the voice, then the figure looks far, stands, and walks across
  async function mWalk(c) {
    const md = c.md;
    const k = kPx(c.slot);
    const F = md.size || 232.8;
    const avail = Math.min(md.maxW || 1100, (window.innerWidth * 0.94) / k);
    const DOWN = 46;
    const lay = { x0: 0, y0: 0, w: avail, h: F * 1.1 + DOWN };
    const stage = makeStage(c.slot, lay);
    const mk = (n) => {
      const im = placeFull(stage, lay, { src: md.poses[n], cx: F / 2, cy: F / 2 + F * 0.03 + DOWN, size: F, z: 2 });
      im.style.opacity = '0';
      return im;
    };
    const look = mk('lookingfar'), stand = mk('standing'), walk = mk('sidewalk');
    await c.ready();
    if (!c.alive()) return;
    const kk = px(stage, lay);

    // like goal 02's "Time To Make A Plan": the description starts lower on the page while
    // Aurion speaks, and moves up a little when the figure comes in
    const tb = c.slot.parentNode && c.slot.parentNode.querySelector('.aurion-scene-textblock');
    const drop = md.descDrop == null ? 120 : md.descDrop;
    if (tb) tb.style.translate = '0px ' + drop + 'px';
    await c.sleep(1500);
    if (c.scene.soundEffect) await new Promise((res) => playVoice(c.scene.soundEffect, res));
    if (!c.alive()) return;
    if (tb) {
      // only moves up as far as the figure needs, not up to where a subtitle would sit
      const endY = window.innerWidth < 600 ? 14 : (md.descEnd == null ? 56 : md.descEnd);
      c.anim(tb, [{ translate: '0px ' + drop + 'px' }, { translate: '0px ' + endY + 'px' }], { duration: 1000, easing: 'ease-in-out', fill: 'forwards' });
      tb.style.translate = '0px ' + endY + 'px';
    }

    sfx.play('pop');
    await c.anim(look, [{ opacity: 0, translate: `${-30 * kk}px 0px` }, { opacity: 1, translate: '0px 0px' }], { duration: 700, fill: 'forwards' });
    look.style.opacity = '1';
    await c.sleep(2400);
    await Promise.all([
      c.anim(look, [{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: 'forwards' }),
      c.anim(stand, [{ opacity: 0 }, { opacity: 1 }], { duration: 500, fill: 'forwards' })
    ]);
    stand.style.opacity = '1';
    await c.sleep(1500);
    await Promise.all([
      c.anim(stand, [{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' }),
      c.anim(walk, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, fill: 'forwards' })
    ]);
    walk.style.opacity = '1';

    // the crossing: a calm pace, a small bob on every step
    const dist = Math.max(0, avail - F * 0.85);
    const stepMs = md.stepMs || 620;
    const total = md.crossMs || 7600;
    let lastStep = -1;
    await c.tween(total, (t) => {
      const x = dist * t;
      const ph = (t * total) / stepMs;
      const bob = Math.abs(Math.sin(Math.PI * ph)) * 7;
      const si = Math.floor(ph);
      if (si !== lastStep) { lastStep = si; sfx.play('step'); }
      walk.style.translate = `${x * kk}px ${-bob * kk}px`;
      walk.style.rotate = (Math.sin(Math.PI * ph) * 1.4) + 'deg';
      walk.style.opacity = t > 0.9 ? String(Math.max(0, 1 - (t - 0.9) / 0.1)) : '1';
    });
    await c.sleep(300);
    c.reveal();
  }

  // 05 MARK YOUR START
  async function mMark(c) {
    const R = roadKit(c), md = c.md;
    const fig = R.makeFigure(md.poses);
    const glow = R.makeStoneGlow();
    const s0 = R.stones[0];
    await R.boot();
    if (!c.alive()) return;

    // first stone glows; the figure appears on it
    glow.style.opacity = '1'; glow.classList.add('g3-soft');
    fig.fade(450);
    fig.put('firststep', R.ground(0), 0);
    await c.sleep(500);
    sfx.play('pop');
    fig.show('firststep');
    await c.sleep(900);

    // the stone pulses softly until it is tapped
    let waiting = true;
    const ping = () => { if (!waiting || !c.alive()) return; sfx.play('stonePulse'); c.later(ping, 2200); };
    ping();
    nudge(c, () => waiting);
    const hit = addHit(R.stage, R.lay, { x: s0.x - s0.w / 2, y: s0.y - s0.h, w: s0.w, h: s0.h * 2.2 }, 0.4);
    hit.style.zIndex = '9';
    await c.tap(hit);
    waiting = false;
    hit.remove();

    // it lights up fully
    glow.classList.remove('g3-soft'); glow.classList.add('g3-lit');
    sfx.play('stoneLit');
    R.sparkles({ x: s0.x, y: s0.y }, 16, 90, true);
    await c.sleep(700);

    // the figure swaps to walking and goes almost to the middle, then dims away
    const upTo = md.walkTo || 8;
    const turn5 = md.turnAt || 5;
    fig.show('sidewalk');
    fig.put('sidewalk', R.ground(0), 0);
    await c.sleep(250);
    await R.walk(fig, (u) => (u < turn5 ? 'sidewalk' : 'walkaway'), 0, upTo, md.msPerStone || 640);
    await new Promise((res) => {
      fig.fade(2200);
      fig.hideAll();
      c.later(res, 2300);
    });
    c.reveal();
  }

  // 06 SPOT THE QUIET MIDDLE
  async function mQuiet(c) {
    const R = roadKit(c), md = c.md;
    const fig = R.makeFigure(md.poses);
    const fogAt = R.ground(md.fogStone || 10);
    const fog = R.makeFog(fogAt, md.fogSize || 360);
    const glow = R.makeStoneGlow();
    await R.boot();
    if (!c.alive()) return;

    glow.style.opacity = '1'; glow.classList.add('g3-lit');
    fig.fade(450);
    fig.put('firststep', R.ground(0), 0);
    await c.sleep(400);
    fig.show('firststep');
    await c.sleep(900);

    // up the road into the middle
    fig.fade(0);
    const mid = md.walkTo || 10, turn = md.turnAt || 5;
    fig.show('sidewalk');
    const pose = (u) => (u < turn ? 'sidewalk' : 'walkaway');
    let fogStarted = false;
    const walking = c.tween((mid * (md.msPerStone || 620)), (t) => {
      const u = mid * t;
      const p = R.along(u);
      const ph = u % 1;
      const lift = Math.sin(Math.PI * ph) * 14 * (p.w / R.stones[0].w);
      const ps = pose(u);
      if (fig.cur !== ps) fig.show(ps);
      fig.put(ps, p, lift);
      if (Math.floor(u + 0.0001) !== (walking._last || -1)) { walking._last = Math.floor(u + 0.0001); if (t > 0) sfx.play('step'); }
      // the cloud rolls in slowly as the figure nears the middle
      if (u > mid - 4.5 && !fogStarted) {
        fogStarted = true;
        sfx.play('fog');
        c.anim(fog, [{ opacity: 0, translate: `${60 * R.kk()}px 0px`, scale: '0.8' }, { opacity: 0.92, translate: '0px 0px', scale: '1' }], { duration: 4200, easing: 'ease-in-out', fill: 'forwards' });
        c.anim(R.road, [{ opacity: 1 }, { opacity: 0.55 }], { duration: 4200, fill: 'forwards' });
      }
      // the figure dims as it goes through
      const dimFrom = md.dimFrom || 0.72;
      if (t > dimFrom) {
        const o = Math.max(0, 1 - (t - dimFrom) / (1 - dimFrom));
        fig.els[ps].style.opacity = String(o);
      }
    });
    await walking;
    fig.hideAll();
    fog.style.opacity = '0.92';
    R.road.style.opacity = '0.55';
    await c.sleep(1400);

    // Aurion speaks once the cloud has settled
    if (c.scene.soundEffect) playVoice(c.scene.soundEffect, c.reveal);
    else c.reveal();
  }

  // 07 SHRINK THE MIDDLE
  async function mShrink(c) {
    const R = roadKit(c), md = c.md;
    // the cloud starts clearly above the figure, then drifts along with the paths to the far end, fading
    const fog = R.makeFog(md.fogFrom, md.fogSize || 250);
    fog.style.zIndex = '30';
    const think = placeFull(R.stage, R.lay, Object.assign({ z: 5 }, md.thinking));
    think.style.opacity = '0';
    const paths = md.paths.map((p, i) => {
      const im = placeFull(R.stage, R.lay, Object.assign({}, p, { z: i === 0 ? 20 : 2 + i }));
      im.style.opacity = '0';
      // path 1 sits in front, so its big stone is never covered by the small stones of the others
      // from the second path on, the big starting stone is faded out of the picture, so the
      // stones of the five images never clash; path 1 keeps the one big stone
      if (i > 0 && p.hide) {
        const h = p.hide;
        // the ellipse removes the stone; the second layer removes any stray rim just below it
        const m = `radial-gradient(ellipse ${h[2]}% ${h[3]}% at ${h[0]}% ${h[1]}%, transparent 0, transparent 90%, #000 100%), linear-gradient(to bottom, #000 ${h[4]}%, transparent ${h[4]}%)`;
        im.style.webkitMaskImage = m; im.style.maskImage = m;
        im.style.webkitMaskComposite = 'source-in'; im.style.maskComposite = 'intersect';
      }
      return im;
    });
    await c.ready();
    if (!c.alive()) return;
    // start as scene 06 ended: the road dimmed under the cloud
    R.road.style.opacity = '0.55';
    fog.style.opacity = '0.9';
    c.anim(think, [{ opacity: 0, translate: `${-20 * R.kk()}px 0px` }, { opacity: 1, translate: '0px 0px' }], { duration: 800, fill: 'forwards' });
    think.style.opacity = '1';
    await c.sleep(1400);

    // path 1, then 2 to 5, fanning out from the first stone with a soft heartbeat;
    // the cloud moves slowly along as each path starts and gets fainter and fainter
    const STEP = 1700;
    const kf = R.kk();
    sfx.play('fog');
    const drift = c.tween(STEP * paths.length + 600, (t) => {
      const e = t * t * (3 - 2 * t);
      fog.style.translate = `${(md.fogTo.x - md.fogFrom.x) * e * kf}px ${(md.fogTo.y - md.fogFrom.y) * e * kf}px`;
      fog.style.scale = String(1 + 0.25 * e);
      fog.style.opacity = String(0.92 - 0.76 * e);   // clearly there at the start, faint at the last path
    });
    for (let i = 0; i < paths.length; i++) {
      const im = paths[i];
      if (i === 0) c.anim(R.road, [{ opacity: 0.55 }, { opacity: 0 }], { duration: 900, fill: 'forwards' });
      c.anim(im, [{ opacity: 0, scale: '0.94' }, { opacity: 1, scale: '1' }], { duration: 900, easing: 'ease-out', fill: 'forwards' });
      im.style.opacity = '1';
      c.anim(im, [{ transform: 'scale(1)' }, { transform: 'scale(1.035)', offset: 0.25 }, { transform: 'scale(1)', offset: 0.45 }, { transform: 'scale(1.025)', offset: 0.65 }, { transform: 'scale(1)' }], { duration: 1500, delay: 500, iterations: 2 });
      sfx.play('heartbeat'); c.later(() => sfx.play('heartbeat'), 1500);
      sfx.play('gift');
      await c.sleep(STEP);
    }
    await drift;
    await c.sleep(1200);   // the last heartbeat settles; everything is calm
    c.reveal();
  }

  // 08 PUT A TREAT IN THE FOG
  async function mGift(c) {
    const R = roadKit(c), md = c.md;
    const fig = R.makeFigure(md.poses);
    // the box floats right where the figure will stop, just in front of it
    const to = md.walkTo || 5;
    const stop = R.along(to);
    const gs = md.gift.size || 100;
    const gx = stop.x + stop.w * 1.2, gy = stop.y - stop.w * 1.45;
    const fog = R.makeFog({ x: gx, y: gy }, md.fogSize || 380);
    const gift = placeFull(R.stage, R.lay, { src: md.gift.src, cx: gx, cy: gy, size: gs, z: 7 });
    gift.style.opacity = '0';
    await R.boot();
    if (!c.alive()) return;
    R.road.style.opacity = '0.7';
    fog.style.opacity = '0.88';
    fig.fade(400);

    // standing first, then the figure takes a first step onto the path
    // one figure: it appears standing on the first stone, fades, then the walking pose appears
    fig.put('standing', R.ground(0), 0);
    fig.put('sidewalk', R.ground(0), 0);
    fig.fade(600);
    fig.show('standing');
    await c.sleep(1700);
    fig.fade(350);
    fig.show('sidewalk');
    sfx.play('step');
    await c.sleep(700);

    // the gift box appears floating above the path
    sfx.play('gift');
    c.anim(gift, [{ opacity: 0, scale: '0.5' }, { opacity: 1, scale: '1' }], { duration: 700, easing: 'cubic-bezier(.2,1.4,.4,1)', fill: 'forwards' });
    gift.style.opacity = '1';
    R.sparkles({ x: gx, y: gy }, 12, 70, false);
    const bob = gift.animate([{ translate: '0px 0px' }, { translate: `0px ${-6 * R.kk()}px` }, { translate: '0px 0px' }], { duration: 2200, iterations: Infinity, easing: 'ease-in-out' });
    cleanups.push(() => bob.cancel());
    await c.sleep(900);

    // the figure walks towards it; the cloud around it thins and glows warm
    fog.classList.add('g3-warm');
    c.anim(fog, [{ opacity: 0.88 }, { opacity: 0.35 }], { duration: (to * (md.msPerStone || 640)) + 1200, fill: 'forwards' });
    await R.walk(fig, () => 'sidewalk', 0, to, md.msPerStone || 640);
    await c.sleep(300);

    // the box pulses once, then it is taken
    sfx.play('giftPop');
    glowOn(gift, true);
    await c.anim(gift, [{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 650 });
    await c.sleep(250);
    const hand = stop;
    const k = R.kk();
    const dx = (hand.x + hand.w * 0.5) - gx, dy = (hand.y - hand.w * 1.35) - gy;
    R.sparkles({ x: hand.x + hand.w * 0.5, y: hand.y - hand.w * 1.35 }, 16, 90, true);
    sfx.play('gift');
    await c.anim(gift, [{ translate: '0px 0px', scale: '1', opacity: 1 }, { translate: `${dx * k}px ${dy * k}px`, scale: '0.3', opacity: 0 }], { duration: 800, easing: 'ease-in', fill: 'forwards' });
    gift.style.opacity = '0';
    await c.sleep(1400);
    c.reveal();
  }

  // 09 COLOUR IN EVERY STEP
  async function mStamps(c) {
    const md = c.md, lay = md.lay;
    const stage = makeStage(c.slot, lay);
    const card = placeFull(stage, lay, Object.assign({ z: 1 }, md.card));
    const pointer = placeFull(stage, lay, Object.assign({ z: 3 }, md.pointer));
    card.style.opacity = '0'; pointer.style.opacity = '0';
    const cs = md.card.size / 1080, cox = md.card.cx - md.card.size / 2, coy = md.card.cy - md.card.size / 2;
    const cellAt = (i) => ({ x: cox + md.cells[i][0] * cs, y: coy + md.cells[i][1] * cs });
    const starSize = md.starSize || 70;
    const mkStar = (i) => {
      const p = cellAt(i);
      const d = el('div', 'g3-star', stage);
      placeBox(d, { x: p.x - starSize / 2, y: p.y - starSize / 2, w: starSize, h: starSize }, lay);
      d.innerHTML = '<svg viewBox="0 0 100 100"><defs><linearGradient id="g3sg' + i + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2a8"/><stop offset="1" stop-color="#ffb52e"/></linearGradient></defs><path d="M50 6 L62 37 L95 39 L69 59 L78 92 L50 73 L22 92 L31 59 L5 39 L38 37 Z" fill="url(#g3sg' + i + ')" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg>';
      d.style.opacity = '0';
      return { d, p };
    };
    const stars = [mkStar(0), mkStar(1)];
    await c.ready();
    if (!c.alive()) return;
    const k = px(stage, lay);

    c.anim(card, [{ opacity: 0, scale: '0.92' }, { opacity: 1, scale: '1' }], { duration: 700, fill: 'forwards' });
    card.style.opacity = '1';
    await c.sleep(800);
    sfx.play('whoosh');
    c.anim(pointer, [{ opacity: 0, translate: `${-40 * k}px 0px` }, { opacity: 1, translate: '0px 0px' }], { duration: 800, fill: 'forwards' });
    pointer.style.opacity = '1';
    await c.sleep(1200);

    // two stars, one after the other
    const sparkleAt = (p, n) => {
      for (let j = 0; j < n; j++) {
        const s = el('i', 'g3-spark', stage);
        s.style.left = ((p.x - lay.x0) / lay.w * 100) + '%';
        s.style.top = ((p.y - lay.y0) / lay.h * 100) + '%';
        const sz = (7 + Math.random() * 8) * k;
        s.style.width = s.style.height = sz + 'px';
        const a = Math.random() * Math.PI * 2, d = (28 + Math.random() * 30) * k;
        const an = s.animate([
          { opacity: 0, transform: 'translate(-50%,-50%) scale(.2)' },
          { opacity: 1, transform: `translate(calc(-50% + ${Math.cos(a) * d * 0.6}px), calc(-50% + ${Math.sin(a) * d * 0.6}px)) scale(1)`, offset: 0.4 },
          { opacity: 0, transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(.2)` }
        ], { duration: 900 + Math.random() * 400, easing: 'ease-out', fill: 'both' });
        an.onfinish = () => s.remove();
      }
    };
    for (let i = 0; i < stars.length; i++) {
      const st = stars[i];
      sfx.play('star');
      c.anim(st.d, [{ opacity: 0, transform: 'scale(0.2) rotate(-90deg)' }, { opacity: 1, transform: 'scale(1.25) rotate(8deg)', offset: 0.65 }, { opacity: 1, transform: 'scale(1) rotate(0)' }], { duration: 650, easing: 'ease-out', fill: 'forwards' });
      st.d.style.opacity = '1';
      sparkleAt(st.p, 10);
      await c.sleep(900);
    }

    // they sparkle, and stay, until the voice ends
    let on = true;
    const twinkle = () => {
      if (!on || !c.alive()) return;
      const st = stars[Math.floor(Math.random() * stars.length)];
      sparkleAt(st.p, 3);
      if (Math.random() < 0.5) sfx.play('glint');
      c.later(twinkle, 520 + Math.random() * 380);
    };
    twinkle();
    stars.forEach((st) => { st.d.classList.add('g3-twinkle'); });
    const done = () => { on = false; c.reveal(); };
    if (c.scene.soundEffect) playVoice(c.scene.soundEffect, done);
    else { await c.sleep(2500); done(); }
  }

  // 10 CHECK YOUR COMPASS
  async function mCompass(c) {
    const md = c.md, lay = md.lay;
    const stage = makeStage(c.slot, lay);
    const flag = placeFull(stage, lay, Object.assign({ z: 1 }, md.flag));
    const fig = placeFull(stage, lay, Object.assign({ z: 3 }, md.figure));
    const comp = placeFull(stage, lay, Object.assign({ z: 4 }, md.compass));
    flag.style.opacity = '0'; fig.style.opacity = '0'; comp.style.opacity = '0';
    await c.ready();
    if (!c.alive()) return;
    const k = px(stage, lay);

    c.anim(flag, [{ opacity: 0 }, { opacity: 1 }], { duration: 700, fill: 'forwards' });
    flag.style.opacity = '1';
    await c.sleep(500);
    c.anim(fig, [{ opacity: 0, translate: `${-24 * k}px 0px` }, { opacity: 1, translate: '0px 0px' }], { duration: 800, fill: 'forwards' });
    fig.style.opacity = '1';
    await c.sleep(700);
    sfx.play('pop');
    c.anim(comp, [{ opacity: 0, scale: '0.85' }, { opacity: 1, scale: '1' }], { duration: 700, fill: 'forwards' });
    comp.style.opacity = '1';
    await c.sleep(800);

    // the needle swings loosely and the compass pulses, asking for a tap
    let mode = 'loose';
    let shakeT = 0;
    let ang = 0;
    c.loop((now) => {
      const t = now / 1000;
      if (mode === 'loose') {
        ang = 9 * Math.sin(t * 1.15) + 5 * Math.sin(t * 2.4 + 1.3) + 2.5 * Math.sin(t * 4.1);
      } else if (mode === 'shake') {
        const e = (now - shakeT) / 1000;
        ang = 7 * Math.exp(-e * 2.6) * Math.sin(e * 24);
        if (e > 1.6) { mode = 'settled'; ang = 0; }
      } else { ang *= 0.9; }
      comp.style.rotate = ang + 'deg';
    });
    pulseOn(comp, true); glowOn(comp, true);
    let tick = true;
    const loosePing = () => { if (!tick || !c.alive()) return; sfx.play('needle'); c.later(loosePing, 2400); };
    loosePing();
    nudge(c, () => tick);
    const hit = addHit(stage, lay, md.compass.hit || { x: md.compass.cx - 130, y: md.compass.cy - 90, w: 260, h: 200 }, 0.25);
    hit.style.zIndex = '9';
    await c.tap(hit);
    hit.remove();
    tick = false;
    pulseOn(comp, false); glowOn(comp, false);

    // a small shake, and it settles again
    mode = 'shake'; shakeT = performance.now();
    sfx.play('shake');
    await c.sleep(1900);
    glowOn(comp, true);
    sfx.play('glow');
    await c.sleep(600);

    // Aurion speaks after the needle has settled
    if (c.scene.soundEffect) playVoice(c.scene.soundEffect, c.reveal);
    else c.reveal();
  }

  // 11 CELEBRATE THE HALFWAY MARK
  async function mCelebrate(c) {
    const md = c.md, lay = md.lay;
    const stage = makeStage(c.slot, lay);
    const rays = el('div', 'g3-rays', stage);
    const rc = md.rays || { x: md.stand.cx, y: md.stand.cy - 30, r: 330 };
    placeBox(rays, { x: rc.x - rc.r, y: rc.y - rc.r, w: rc.r * 2, h: rc.r * 2 }, lay);
    rays.style.opacity = '0';
    const stand = placeFull(stage, lay, Object.assign({ z: 3 }, md.stand));
    const jump = placeFull(stage, lay, Object.assign({ z: 3 }, md.jump));
    stand.style.opacity = '0'; jump.style.opacity = '0';
    const dia = addImage(stage, lay, Object.assign({ z: 6 }, md.diamond), 'g3-diamond');
    dia.style.opacity = '0';
    await c.ready();
    if (!c.alive()) return;
    const k = px(stage, lay);

    c.anim(dia, [{ opacity: 0, scale: '0.6' }, { opacity: 1, scale: '1' }], { duration: 600, fill: 'forwards' });
    dia.style.opacity = '1';
    glowOn(dia, true); pulseOn(dia, true);
    // shining bright: a soft halo, two crossing glints and little sparkles, all by code
    const dcx = md.diamond.x + md.diamond.w / 2, dcy = md.diamond.y + md.diamond.h / 2;
    const halo = el('div', 'g3-halo', stage);
    placeBox(halo, { x: dcx - md.diamond.w * 1.5, y: dcy - md.diamond.w * 1.5, w: md.diamond.w * 3, h: md.diamond.w * 3 }, lay);
    const glints = [0, 0.9].map((dl) => {
      const gl = el('div', 'g3-glint', stage);
      placeBox(gl, { x: dcx - md.diamond.w * 0.95, y: dcy - md.diamond.w * 0.95, w: md.diamond.w * 1.9, h: md.diamond.w * 1.9 }, lay);
      gl.style.animationDelay = dl + 's';
      return gl;
    });
    let shining = true;
    const dsparkle = () => {
      if (!shining || !c.alive()) return;
      for (let j = 0; j < 3; j++) {
        const sp = el('i', 'g3-spark', stage);
        sp.style.zIndex = '5';   // behind the diamond picture
        const ang = Math.random() * Math.PI * 2, rad = md.diamond.w * (0.2 + Math.random() * 0.45);
        sp.style.left = ((dcx + Math.cos(ang) * rad - lay.x0) / lay.w * 100) + '%';
        sp.style.top = ((dcy + Math.sin(ang) * rad - lay.y0) / lay.h * 100) + '%';
        const sz = (5 + Math.random() * 6) * k;
        sp.style.width = sp.style.height = sz + 'px';
        const an = sp.animate([{ opacity: 0, transform: 'translate(-50%,-50%) scale(.2)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: 0.4 }, { opacity: 0, transform: 'translate(-50%,-50%) scale(.2)' }], { duration: 800 + Math.random() * 400, fill: 'both' });
        an.onfinish = () => sp.remove();
      }
      c.later(dsparkle, 260);
    };
    dsparkle();
    await c.sleep(700);
    let waiting = true;
    const ping = () => { if (!waiting || !c.alive()) return; sfx.play('glint'); c.later(ping, 1800); };
    ping();
    nudge(c, () => waiting);
    const hit = addHit(stage, lay, md.diamond, 1.4);
    hit.style.zIndex = '9';
    await c.tap(hit);
    waiting = false;
    hit.remove();
    pulseOn(dia, false); glowOn(dia, false);
    sfx.play('pop');
    // the diamond vanishes, so the figure has the whole space (placed in the config) to jump in
    c.anim(dia, [{ opacity: 1, scale: '1' }, { opacity: 0, scale: '1.5' }], { duration: 250, fill: 'forwards' });
    dia.style.opacity = '0';
    shining = false;
    [halo].concat(glints).forEach((n) => { n.remove(); });

    // the figure appears, first standing
    c.anim(stand, [{ opacity: 0, scale: '0.9' }, { opacity: 1, scale: '1' }], { duration: 600, fill: 'forwards' });
    stand.style.opacity = '1';
    c.anim(rays, [{ opacity: 0 }, { opacity: 0.55 }], { duration: 900, fill: 'forwards' });
    rays.style.opacity = '0.55';
    sfx.play('rays');
    await c.sleep(1100);

    // the jumper joins in at its own spot; both hop in turn, rays and sparkles around
    const burst = (n) => {
      for (let j = 0; j < n; j++) {
        const s = el('i', 'g3-spark', stage);
        s.style.left = ((rc.x - lay.x0) / lay.w * 100) + '%';
        s.style.top = ((rc.y - lay.y0) / lay.h * 100) + '%';
        const sz = (9 + Math.random() * 9) * k;
        s.style.width = s.style.height = sz + 'px';
        const a = Math.random() * Math.PI * 2, d = (150 + Math.random() * 130) * k;
        const an = s.animate([
          { opacity: 0, transform: 'translate(-50%,-50%) scale(.2)' },
          { opacity: 1, transform: `translate(calc(-50% + ${Math.cos(a) * d * 0.6}px), calc(-50% + ${Math.sin(a) * d * 0.6}px)) scale(1)`, offset: 0.4 },
          { opacity: 0, transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(.2)` }
        ], { duration: 1000 + Math.random() * 500, easing: 'ease-out', fill: 'both' });
        an.onfinish = () => s.remove();
      }
    };
    await c.sleep(500);
    const jumps = md.jumps || 4;
    const H = md.jumpHeight || 90;
    const swap = (on, off, ms) => Promise.all([
      c.anim(off, [{ opacity: 1 }, { opacity: 0 }], { duration: ms, fill: 'forwards' }),
      c.anim(on, [{ opacity: 0 }, { opacity: 1 }], { duration: ms, fill: 'forwards' })
    ]).then(() => { off.style.opacity = '0'; on.style.opacity = '1'; });
    // one figure: standing fades out, the jump pose fades in and leaps, then back to standing
    for (let i = 0; i < jumps; i++) {
      await swap(jump, stand, 70);
      sfx.play('boing');
      rays.animate([{ opacity: 0.55, scale: '1' }, { opacity: 1, scale: '1.12' }, { opacity: 0.6, scale: '1' }], { duration: 1000 });
      burst(14);
      await c.tween(620, (t) => { jump.style.translate = `0px ${-H * k * Math.sin(Math.PI * t)}px`; });
      jump.style.translate = '0px 0px';
      sfx.play('land');
      await swap(stand, jump, 70);
      c.anim(stand, [{ transform: 'scale(1,1)' }, { transform: 'scale(1.05,.94)' }, { transform: 'scale(1,1)' }], { duration: 260 });
      await c.sleep(i === jumps - 1 ? 500 : 420);
    }
    await c.sleep(400);
    c.anim(rays, [{ opacity: 0.55 }, { opacity: 0.25 }], { duration: 1000, fill: 'forwards' });
    c.reveal();
  }

  // 12 SOMETHING TO REMEMBER
  async function mNotes(c) {
    let md = c.md, lay = md.lay;
    // narrow screens: the same eight notes in two columns, pad above them
    if (window.innerWidth < 600) {
      const NW = 250, NH = 200, G = 10, PW = md.pad.w, PH = md.pad.h;
      const L = { x0: 0, y0: 0, w: NW * 2 + G, h: PH + 20 + NH * 4 + G * 3, size: 1 };
      md = Object.assign({}, md, {
        lay: L,
        pad: Object.assign({}, md.pad, { x: (L.w - PW) / 2, y: 0 }),
        padStart: { x: (L.w - PW) / 2, y: PH + 20 + NH * 1.5 },
        notes: md.notes.map((n, i) => Object.assign({}, n, {
          x: (i % 2) * (NW + G), y: PH + 20 + Math.floor(i / 2) * (NH + G), w: NW, h: NH
        }))
      });
      lay = L;
    }
    const stage = makeStage(c.slot, lay);
    const pad = addImage(stage, lay, Object.assign({ z: 2 }, md.pad));
    pad.style.opacity = '0';
    const k0 = px(stage, lay);
    // the pad starts where the Canva page shows it only after the tap; on screen
    // it first sits in the middle of the notes area, then moves to the side
    const mid = md.padStart || { x: lay.x0 + lay.w / 2 - md.pad.w / 2, y: md.pad.y };
    const midY = mid.y - md.pad.y;
    const notes = md.notes.map((n, i) => {
      const wrapN = el('div', 'g3-note', stage);
      placeBox(wrapN, n, lay);
      wrapN.style.zIndex = String(3 + i);
      wrapN.style.opacity = '0';
      const im = el('img', 'g3-note-img', wrapN);
      im.src = resolveAssetUrl(n.src); im.alt = ''; im.draggable = false;
      const t = el('div', 'g3-note-text', wrapN);
      t.textContent = n.text;
      if (n.dy) t.style.top = (20 + n.dy) + '%';
      if (n.tx != null) { t.style.left = n.tx + '%'; t.style.top = n.ty + '%'; t.style.width = n.tw + '%'; t.style.height = n.th + '%'; }
      return wrapN;
    });

    await c.ready();
    if (!c.alive()) return;
    const k = px(stage, lay);
    const dx = (mid.x - md.pad.x) * k, dy = midY * k;
    pad.style.translate = `${dx}px ${dy}px`;
    await c.anim(pad, [{ opacity: 0, scale: '0.8' }, { opacity: 1, scale: '1' }], { duration: 600, fill: 'forwards' });
    pad.style.opacity = '1';
    glowOn(pad, true); pulseOn(pad, true);
    let padWait = true;
    nudge(c, () => padWait);
    const hit = addHit(stage, lay, Object.assign({}, md.pad, { x: mid.x, y: mid.y }), 0.2);
    hit.style.zIndex = '30';
    await c.tap(hit);
    padWait = false;
    hit.remove();
    pulseOn(pad, false); glowOn(pad, false);

    // pad moves to the side
    sfx.play('whoosh');
    await c.anim(pad, [{ translate: `${dx}px ${dy}px` }, { translate: '0px 0px' }], { duration: 800, easing: 'cubic-bezier(.3,.1,.2,1)', fill: 'forwards' });
    pad.style.translate = '0px 0px';

    // notes float in, one at a time, feather light: row 1 left to right, row 2 left to right
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      sfx.play('feather');
      const sway = (i % 2 ? 1 : -1);
      c.anim(n, [
        { opacity: 0, translate: `${sway * 30 * k}px ${-60 * k}px`, rotate: `${sway * 10}deg`, scale: '0.9' },
        { opacity: 1, translate: `${-sway * 8 * k}px ${10 * k}px`, rotate: `${-sway * 3}deg`, scale: '1', offset: 0.7 },
        { opacity: 1, translate: '0px 0px', rotate: '0deg', scale: '1' }
      ], { duration: 1300, easing: 'ease-out', fill: 'forwards' });
      n.style.opacity = '1';
      await c.sleep(950);
    }
    await c.sleep(700);

    // Aurion speaks; the pad glows softly at "a blank note left on the pad"
    if (c.scene.soundEffect) {
      const glowAt = (md.padGlowAt != null ? md.padGlowAt : 0.62);
      let glowed = false;
      playVoice(c.scene.soundEffect, c.reveal, (frac) => {
        if (!glowed && frac >= glowAt) {
          glowed = true;
          sfx.play('glow');
          glowOn(pad, true); pulseOn(pad, true);
        }
      });
    } else {
      c.reveal();
    }
  }

  const G3_MECHANICS = {
    'g3-walk': { fn: mWalk, gates: true },
    'g3-mark': { fn: mMark, gates: true },
    'g3-quiet': { fn: mQuiet, gates: true },
    'g3-shrink': { fn: mShrink, gates: true },
    'g3-gift': { fn: mGift, gates: true },
    'g3-stamps': { fn: mStamps, gates: true },
    'g3-compass': { fn: mCompass, gates: true },
    'g3-celebrate': { fn: mCelebrate, gates: true },
    'g3-notes': { fn: mNotes, gates: true }
  };
}
