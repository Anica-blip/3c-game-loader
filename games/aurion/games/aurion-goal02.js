// Repo path: games/aurion/games/aurion-goal02.js
//
// Goal 02 engine (Goal Setting Challenge 02). New file: goal 01's aurion.js,
// style.css, game.html and the shared loader.js are NOT touched.
//
// How it stays in step with goal 01 ("one main with extensions"):
// the five series pages (landing, consent, door, We're Done, finale) are not
// copied into goals.02.json. goals.02.json says { "inherit": ... } and this
// engine reads them live from config/goals.01.json, so those pages, their
// button image/colour/font, voice lines and video are always goal 01's own.
// Only the sticky-note image on the door is replaced (see goals.02.json).
//
// Loaded by loader.js through "gameType": "aurion-goal02" in goals.02.json.
// Styles for the new mechanics live in goal-02.css (injected below).

const SVG_NS = 'http://www.w3.org/2000/svg';
const STYLE_FILE = 'goal-02.css';
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
    if (document.querySelector(`link[data-g2="${marker}"]`)) return resolve();
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    l.setAttribute('data-g2', marker);
    l.onload = resolve;
    l.onerror = () => { console.warn('[goal-02] stylesheet failed to load:', href); resolve(); };
    document.head.appendChild(l);
  });
}

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

// ---------------------------------------------------------------------------
// Sound effects. No audio files exist for these yet, so they are synthesised
// in the browser (Web Audio). Any of them can be swapped for a real file by
// putting a URL under "sfx" in goals.02.json, e.g. "sfx": { "cheer": "https://..." }
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
    glow(c) { tone(c, { f0: 880, dur: 0.9, gain: 0.08, attack: 0.3 }); tone(c, { f0: 1318, dur: 0.9, gain: 0.05, attack: 0.3, delay: 0.1 }); }
  };

  function play(name, arg) {
    if (urls[name]) {
      try { const a = new Audio(urls[name]); a.volume = master; a.play().catch(() => {}); } catch (e) { /* ignore */ }
      return;
    }
    const c = ac();
    if (!c || !R[name]) return;
    try { R[name](c, arg); } catch (e) { console.warn('[goal-02] sfx failed:', name, e); }
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
    console.error('[goal-02] could not start:', err);
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
      if (!d.g2) return d;
      const s = Object.assign({}, titleStyle, d);
      s.buttons = (d.buttons || []).map((b) => Object.assign({}, baseButton, b));
      return s;
    });
    decisions = list;

    // 3) shared look: background / ambient sound come from goal 01 unless goals.02.json sets its own
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
    const isG2 = !!(mech && mech.startsWith('g2-'));

    const wrap = document.createElement('div');
    wrap.className = 'aurion-scene-wrap';
    if ((!mech || mech === 'none') && !scene.video) wrap.classList.add('aurion-no-mechanic');
    if (mech === 'sorting' || mech === 'reveal-cards' || mech === 'word-picker') wrap.classList.add('aurion-has-side-panel');
    if (scene.g2) wrap.classList.add('g2-scene');
    if (mech === 'g2-notes') wrap.classList.add('g2-wide');
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
      subtitle.className = 'aurion-scene-subtitle' + (scene.g2 ? ' g2-subtitle' : '');
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

    if (isG2) {
      const entry = G2_MECHANICS[mech];
      if (entry) {
        mechanicGatesButton = entry.gates;
        const c = makeCtx(mechanicSlot, scene, revealButtons, tok);
        Promise.resolve().then(() => entry.fn(c)).catch((err) => {
          console.error('[goal-02] scene problem (' + (scene.adminLabel || mech) + '):', err);
          if (entry.gates) revealButtons();
        });
      } else {
        console.warn('[goal-02] unknown mechanic:', mech);
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

  // All coordinates in goals.02.json are Canva page coordinates (1920 x 1080),
  // so each scene matches the Canva page. The stage is the bounding box of the
  // scene's pictures; every picture is placed in % of that box.
  function makeStage(slot, lay) {
    const stage = el('div', 'g2-stage', slot);
    stage.style.aspectRatio = `${lay.w} / ${lay.h}`;
    // --g2-k = screen px per Canva px: one scale for every scene, so the main
    // pictures keep the same size from page to page, as they do in Canva.
    stage.style.width = `min(94vw, calc(var(--g2-k) * ${(lay.w * (lay.size || 1)).toFixed(1)}))`;
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
    const img = el('img', 'g2-item' + (cls ? ' ' + cls : ''), parent);
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
    const hit = el('div', 'g2-hit', stage);
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
  // Mechanics. Each receives ctx c (see makeCtx). All positions come from
  // goals.02.json in Canva page units (1920 x 1080).
  // -------------------------------------------------------------------------
  const px = (stage, lay) => stage.clientWidth / lay.w || 0.5; // screen px per Canva unit

  function glowOn(node, on) { node.classList.toggle('g2-glow', !!on); }
  function pulseOn(node, on) { node.classList.toggle('g2-pulse', !!on); }

  // 04 and 08: a picture (or just text) while Aurion speaks; the voice gates the button.
  async function mImage(c) {
    const md = c.md;
    if (!md.lay) return;
    const stage = makeStage(c.slot, md.lay);
    (md.items || []).forEach((it) => {
      const im = addImage(stage, md.lay, it, 'g2-pop-in');
      pulseOn(im, !!it.pulse);
    });
  }

  // 05 PICK YOUR FIRST GOAL
  async function mFootball(c) {
    const md = c.md, lay = md.lay;
    const stage = makeStage(c.slot, lay);
    const post = addImage(stage, lay, Object.assign({ z: 3 }, md.post));
    post.style.opacity = '0';
    const ball = addImage(stage, lay, Object.assign({ z: 2 }, md.ball));
    ball.style.opacity = '0';
    await c.ready();
    if (!c.alive()) return;
    const k = px(stage, lay);
    const b = md.ball, p = md.post;
    c.anim(post, [{ opacity: 0 }, { opacity: 1 }], { duration: 500, fill: 'forwards' });
    await c.sleep(450);

    // 1) the ball bounces in from the left and settles beside the post
    const H = (md.bounceHeight || 150), startDx = -(md.bounceFrom || 420);
    const bounces = 3;
    ball.style.opacity = '1';
    let lastSeg = -1;
    await c.tween(2000, (t) => {
      const e = 1 - Math.pow(1 - t, 1.6);
      const seg = Math.min(bounces - 1, Math.floor(t * bounces));
      const f = t * bounces - seg;
      const hh = H * Math.pow(0.45, seg) * 4 * f * (1 - f);
      if (seg !== lastSeg) { lastSeg = seg; sfx.play('bounce'); }
      ball.style.translate = `${startDx * (1 - e) * k}px ${-hh * k}px`;
      ball.style.rotate = (-360 * (1 - e)) + 'deg';
    });
    ball.style.translate = '0px 0px';
    ball.style.rotate = '0deg';

    // 2) it waits, highlighted, for the tap
    glowOn(ball, true); pulseOn(ball, true);
    const hit = addHit(stage, lay, b, 1.2);
    hit.style.zIndex = '5';
    hit.classList.add('g2-hit-on');
    await c.tap(hit);
    hit.remove();
    pulseOn(ball, false);

    // 3) the shot
    sfx.play('kick');
    const tx = (md.netTarget ? p.x + p.w * md.netTarget[0] : p.x + p.w * 0.5) - (b.x + b.w / 2);
    const ty = (md.netTarget ? p.y + p.h * md.netTarget[1] : p.y + p.h * 0.6) - (b.y + b.h / 2);
    ball.style.zIndex = '2';
    await c.tween(750, (t) => {
      const e = easeInOut(t);
      const arc = -140 * 4 * t * (1 - t);
      ball.style.translate = `${tx * e * k}px ${(ty * e + arc) * k}px`;
      ball.style.rotate = (900 * e) + 'deg';
      ball.style.scale = String(1 - 0.4 * e);
    });
    sfx.play('netHit'); sfx.play('cheer');
    c.anim(post, [
      { transform: 'translateX(0)' }, { transform: 'translateX(-6px) scale(1.01)' },
      { transform: 'translateX(5px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }
    ], { duration: 520 });
    // 4) the ball stays in the net, pulsing
    pulseOn(ball, true); glowOn(ball, true);
    await c.sleep(md.endHold || 2200);
    c.reveal();
  }

  // 06 AIM FOR YOUR GOAL
  async function mCalendar(c) {
    const md = c.md, lay = md.lay;
    const stage = makeStage(c.slot, lay);
    const cal = addImage(stage, lay, Object.assign({ z: 1 }, md.calendar));
    const bell = addImage(stage, lay, Object.assign({ z: 3 }, md.bell));
    bell.style.opacity = '0';
    bell.style.visibility = 'hidden';

    const svg = svgEl('svg', {
      viewBox: `${lay.x0} ${lay.y0} ${lay.w} ${lay.h}`, class: 'g2-overlay', preserveAspectRatio: 'none'
    }, stage);
    svg.style.zIndex = '2';
    const g = md.grid;
    const cell = (r, col) => ({ x: g.cols[col], y: g.rows[r] });
    const s0 = cell(0, 0);
    const e0 = cell(g.endRow != null ? g.endRow : g.rows.length - 1, g.endCol != null ? g.endCol : 1);

    // start symbol: a map-style pin
    const pin = svgEl('g', { class: 'g2-pin' }, svg);
    pin.style.opacity = '0';
    svgEl('ellipse', { cx: s0.x, cy: s0.y + 2, rx: 13, ry: 5, fill: 'rgba(0,0,0,.25)' }, pin);
    svgEl('path', { d: `M ${s0.x} ${s0.y} C ${s0.x - 30} ${s0.y - 26} ${s0.x - 26} ${s0.y - 62} ${s0.x} ${s0.y - 62} C ${s0.x + 26} ${s0.y - 62} ${s0.x + 30} ${s0.y - 26} ${s0.x} ${s0.y} Z`, fill: '#e53935', stroke: '#fff', 'stroke-width': 3 }, pin);
    svgEl('circle', { cx: s0.x, cy: s0.y - 40, r: 9, fill: '#fff' }, pin);
    const pinPulse = svgEl('circle', { cx: s0.x, cy: s0.y, r: 14, fill: 'none', stroke: '#e53935', 'stroke-width': 4, class: 'g2-ring' }, svg);
    pinPulse.style.opacity = '0';

    // end square: green, static, with a tick
    const half = (g.cell || 64) / 2;
    const endG = svgEl('g', { class: 'g2-check' }, svg);
    endG.style.opacity = '0';
    svgEl('rect', { x: e0.x - half, y: e0.y - half, width: half * 2, height: half * 2, rx: 10, fill: '#43c463', stroke: '#1f9d41', 'stroke-width': 4 }, endG);
    svgEl('path', { d: `M ${e0.x - half * 0.5} ${e0.y} L ${e0.x - half * 0.1} ${e0.y + half * 0.42} L ${e0.x + half * 0.55} ${e0.y - half * 0.45}`, fill: 'none', stroke: '#fff', 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, endG);

    // arrow that travels start -> finish and back
    const arrow = svgEl('g', { class: 'g2-arrow' }, svg);
    arrow.style.opacity = '0';
    svgEl('path', { d: 'M -26 -16 L 22 0 L -26 16 L -14 0 Z', fill: '#ffbd59', stroke: '#fff', 'stroke-width': 3, 'stroke-linejoin': 'round' }, arrow);

    await c.ready();
    if (!c.alive()) return;
    c.anim(cal, [{ opacity: 0, translate: '0 12px' }, { opacity: 1, translate: '0 0' }], { duration: 600, fill: 'both' });
    await c.sleep(900);

    pin.style.opacity = '1'; sfx.play('pinPop');
    c.anim(pin, [{ transform: 'translateY(-30px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 400 });
    pinPulse.style.opacity = '1';
    c.anim(pinPulse, [{ r: 14, opacity: 0.9 }, { r: 46, opacity: 0 }], { duration: 1100, iterations: 3 });
    await c.sleep(1300);

    endG.style.opacity = '1'; sfx.play('check');
    c.anim(endG, [{ opacity: 0 }, { opacity: 1 }], { duration: 400 });
    await c.sleep(800);

    // arrow: forth and back, three times
    const ang = Math.atan2(e0.y - s0.y, e0.x - s0.x) * 180 / Math.PI;
    const trail = svgEl('line', { x1: s0.x, y1: s0.y - 20, x2: e0.x, y2: e0.y - 20, stroke: 'rgba(255,189,89,.55)', 'stroke-width': 6, 'stroke-dasharray': '4 14', 'stroke-linecap': 'round' }, svg);
    arrow.style.opacity = '1';
    sfx.play('arrow');
    const trips = 3, per = 1100;
    await c.tween(trips * per * 2, (t) => {
      const u = t * trips * 2;
      const f = u % 2;
      const q = f < 1 ? f : 2 - f;
      const e = easeInOut(q);
      const x = s0.x + (e0.x - s0.x) * e, y = s0.y - 20 + (e0.y - s0.y) * e;
      const flip = f < 1 ? 0 : 180;
      arrow.setAttribute('transform', `translate(${x} ${y}) rotate(${ang + flip})`);
    });
    arrow.style.opacity = '0'; trail.remove();
    await c.sleep(300);

    // calendar vanishes, the bell takes its place
    await Promise.all([
      c.anim(cal, [{ opacity: 1 }, { opacity: 0 }], { duration: 600, fill: 'forwards' }),
      c.anim(svg, [{ opacity: 1 }, { opacity: 0 }], { duration: 600, fill: 'forwards' })
    ]);
    bell.style.visibility = 'visible';
    await c.anim(bell, [{ opacity: 0, scale: '0.6' }, { opacity: 1, scale: '1' }], { duration: 500, easing: 'cubic-bezier(.2,1.4,.4,1)', fill: 'forwards' });
    bell.style.opacity = '1';
    sfx.play('pop');
    glowOn(bell, true); pulseOn(bell, true);
    const hit = addHit(stage, lay, md.bell, 0.2);
    hit.style.zIndex = '5';
    await c.tap(hit);
    hit.remove();
    pulseOn(bell, false);

    // rings, highlights and shakes like it is overexcited
    sfx.play('bell');
    c.later(() => sfx.play('bell'), 380);
    c.later(() => sfx.play('bell'), 760);
    bell.style.transformOrigin = '50% 12%';
    await c.anim(bell, [
      { transform: 'rotate(0)' }, { transform: 'rotate(-16deg) scale(1.08)' }, { transform: 'rotate(14deg) scale(1.1)' },
      { transform: 'rotate(-12deg) scale(1.08)' }, { transform: 'rotate(10deg) scale(1.1)' }, { transform: 'rotate(-7deg) scale(1.06)' },
      { transform: 'rotate(5deg) scale(1.06)' }, { transform: 'rotate(0) scale(1)' }
    ], { duration: 1500 });
    await c.sleep(500);
    c.reveal();
  }

  // 07 WRITE DOWN STEPS OF ACTION
  async function mWrite(c) {
    const md = c.md, lay = md.lay;
    const stage = makeStage(c.slot, lay);
    addImage(stage, lay, Object.assign({ z: 1 }, md.board));
    const svg = svgEl('svg', {
      viewBox: `${lay.x0} ${lay.y0} ${lay.w} ${lay.h}`, class: 'g2-overlay', preserveAspectRatio: 'none'
    }, stage);
    svg.style.zIndex = '2';
    const pen = addImage(stage, lay, Object.assign({ z: 3 }, md.pen));
    pen.style.opacity = '0';
    pen.style.transformOrigin = '50% 50%';

    // handwriting: small wavy loops along each line, left to right
    const tipF = md.penTip || [0.1, 0.88];
    const tipRest = { x: md.pen.x + md.pen.w * tipF[0], y: md.pen.y + md.pen.h * tipF[1] };
    const lines = md.lines; // [{y, x1, x2}]
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const paths = lines.map((ln) => {
      let d = `M ${ln.x1} ${ln.y - 14}`;
      let x = ln.x1;
      while (x < ln.x2) {
        const step = 9 + rnd() * 9;
        const amp = 7 + rnd() * 11;
        x = Math.min(ln.x2, x + step);
        const yy = ln.y - 14 + (rnd() < 0.5 ? -amp : amp * 0.4);
        d += ` L ${x.toFixed(1)} ${yy.toFixed(1)}`;
        if (rnd() < 0.18) x += 10; // a gap, like a space between words
      }
      const p = svgEl('path', { d, fill: 'none', stroke: '#1f2a6b', 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg);
      const len = p.getTotalLength();
      p.style.strokeDasharray = String(len);
      p.style.strokeDashoffset = String(len);
      return { p, len, ln };
    });

    await c.ready();
    if (!c.alive()) return;
    const k = px(stage, lay);
    const movePen = (x, y) => { pen.style.translate = `${(x - tipRest.x) * k}px ${(y - tipRest.y) * k}px`; };
    const first = paths[0].p.getPointAtLength(0);
    movePen(first.x - 60, first.y - 90);
    await c.sleep(500);
    sfx.play('whoosh');
    await c.anim(pen, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, fill: 'forwards' });
    pen.style.opacity = '1';

    for (let i = 0; i < paths.length; i++) {
      const { p, len } = paths[i];
      const from = i === 0 ? { x: first.x - 60, y: first.y - 90 } : paths[i - 1].p.getPointAtLength(paths[i - 1].len);
      const st = p.getPointAtLength(0);
      // lift and glide to the start of the next line
      await c.tween(i === 0 ? 450 : 350, (t) => {
        const e = easeInOut(t);
        movePen(from.x + (st.x - from.x) * e, from.y + (st.y - from.y) * e - Math.sin(Math.PI * t) * 16);
      });
      const dur = Math.max(900, len * 4.2);
      sfx.play('scribble', dur / 1000);
      await c.tween(dur, (t) => {
        const pt = p.getPointAtLength(len * t);
        p.style.strokeDashoffset = String(len * (1 - t));
        movePen(pt.x, pt.y);
      });
    }
    // pen lifts away and rests
    const last = paths[paths.length - 1];
    const lp = last.p.getPointAtLength(last.len);
    await c.tween(600, (t) => {
      const e = easeInOut(t);
      movePen(lp.x + (tipRest.x - lp.x) * e + 40 * e, lp.y + (tipRest.y - lp.y) * e - 30 * e);
    });
    await c.sleep(400);
    c.reveal();
  }

  // 09 HANDLE HURDLES WITH COURAGE: a puzzle cube built in code
  const M4 = {
    id: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    mul(a, b) { // column-major, returns a*b
      const o = new Array(16).fill(0);
      for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
        let s = 0;
        for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
        o[c * 4 + r] = s;
      }
      return o;
    },
    rot(axis, deg) {
      const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
      if (axis === 'x') return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
      if (axis === 'y') return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
      return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    },
    css: (m) => 'matrix3d(' + m.map((v) => (Math.abs(v) < 1e-6 ? 0 : v)).join(',') + ')'
  };

  async function mCube(c) {
    const md = c.md, lay = md.lay;
    const stage = makeStage(c.slot, lay);
    stage.classList.add('g2-cube-stage');
    const holder = el('div', 'g2-cube-holder', stage);
    const cube = el('div', 'g2-cube', holder);
    const colours = md.colours || { px: '#e53935', nx: '#fb8c00', py: '#ffffff', ny: '#fdd835', pz: '#43a047', nz: '#1e88e5' };
    const S = 100; // cubie size in cube units (CSS scales the whole cube)
    const cubies = [];
    for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
      const d = el('div', 'g2-cubie', cube);
      const faces = [
        ['pz', z === 1, 'translateZ(50px)'],
        ['nz', z === -1, 'rotateY(180deg) translateZ(50px)'],
        ['px', x === 1, 'rotateY(90deg) translateZ(50px)'],
        ['nx', x === -1, 'rotateY(-90deg) translateZ(50px)'],
        ['py', y === -1, 'rotateX(90deg) translateZ(50px)'], // screen y grows downwards
        ['ny', y === 1, 'rotateX(-90deg) translateZ(50px)']
      ];
      faces.forEach(([key, outer, tf]) => {
        const f = el('div', 'g2-face', d);
        f.style.transform = tf;
        if (outer) f.style.setProperty('--c', colours[key]);
      });
      const cb = { el: d, m: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x * S, y * S, z * S, 1], pos: [x, y, z] };
      d.style.transform = M4.css(cb.m);
      cubies.push(cb);
    }
    cube.style.transform = 'rotateX(-24deg) rotateY(-32deg)';

    await c.ready();
    if (!c.alive()) return;
    holder.style.transform = `scale(${(stage.clientWidth * 0.72 / 300).toFixed(4)})`;
    c.anim(holder, [{ opacity: 0, scale: '0.6' }, { opacity: 1, scale: '1' }], { duration: 600, fill: 'both', easing: 'cubic-bezier(.2,1.3,.4,1)' });
    await c.sleep(700);

    // the whole cube drifts round while the layers turn
    let spin = -32;
    c.loop((now, dt) => {
      spin += dt * 22;
      cube.style.transform = `rotateX(-24deg) rotateY(${spin}deg)`;
    });

    const axes = ['x', 'y', 'z'];
    const moves = md.moves || 9;
    let prev = '';
    for (let i = 0; i < moves; i++) {
      let ax, layer, dir;
      do { ax = axes[Math.floor(Math.random() * 3)]; layer = Math.floor(Math.random() * 3) - 1; } while (ax + layer === prev);
      prev = ax + layer;
      dir = Math.random() < 0.5 ? 1 : -1;
      const idx = ax === 'x' ? 0 : ax === 'y' ? 1 : 2;
      const group = cubies.filter((cb) => cb.pos[idx] === layer);
      const base = group.map((cb) => cb.m);
      sfx.play('cubeClick');
      await c.tween(md.moveMs || 520, (t) => {
        const R = M4.rot(ax, dir * 90 * easeInOut(t));
        group.forEach((cb, j) => { cb.el.style.transform = M4.css(M4.mul(R, base[j])); });
      });
      const Rf = M4.rot(ax, dir * 90);
      group.forEach((cb, j) => {
        cb.m = M4.mul(Rf, base[j]).map((v) => Math.round(v * 1000) / 1000);
        cb.pos = [Math.round(cb.m[12] / S), Math.round(cb.m[13] / S), Math.round(cb.m[14] / S)];
        cb.el.style.transform = M4.css(cb.m);
      });
      await c.sleep(120);
    }
    // it settles: stop turning, one soft thud
    cubies.forEach((cb) => { cb.el.style.transform = M4.css(cb.m); });
    sfx.play('thud');
    c.anim(holder, [{ scale: '1' }, { scale: '1.06' }, { scale: '1' }], { duration: 350 });
    await c.sleep(700);

    // Aurion speaks, then the button
    if (c.scene.soundEffect) {
      playVoice(c.scene.soundEffect, c.reveal);
    } else {
      c.reveal();
    }
  }

  // 10 BUILD YOUR SUPPORT TEAM
  async function mBlocks(c) {
    const md = c.md, lay = md.lay;
    const stage = makeStage(c.slot, lay);
    const stack = el('div', 'g2-stack', stage);
    stack.style.transformOrigin = md.stackOrigin || '50% 90%';
    stack.style.zIndex = '2';
    const blocks = md.blocks.map((b, i) => {
      const im = addImage(stack, lay, Object.assign({ z: 2 + i }, b));
      im.style.opacity = '0';
      return im;
    });
    // figures: the one on the left arrives first, then the one on the right
    const figL = addImage(stage, lay, Object.assign({ z: 1 }, md.figLeft));
    const figR = addImage(stage, lay, Object.assign({ z: 9 }, md.figRight));
    figL.style.opacity = '0'; figR.style.opacity = '0';
    // keep the right figure's tilt on its own wrapper-free property

    await c.ready();
    if (!c.alive()) return;
    const k = px(stage, lay);
    const wobble = (amp, dur) => c.anim(stack, [
      { transform: 'rotate(0)' }, { transform: `rotate(${-amp}deg)` }, { transform: `rotate(${amp}deg)` },
      { transform: `rotate(${-amp * 0.7}deg)` }, { transform: `rotate(${amp * 0.5}deg)` }, { transform: 'rotate(0)' }
    ], { duration: dur });
    const dropIn = async (im, i) => {
      sfx.play('thud');
      await c.anim(im, [
        { opacity: 0, translate: `${(i % 2 ? 14 : -14) * k}px ${-90 * k}px` },
        { opacity: 1, translate: '0px 0px' }
      ], { duration: 520, easing: 'cubic-bezier(.3,.1,.5,1.3)', fill: 'forwards' });
      im.style.opacity = '1';
    };
    await c.sleep(300);
    // bottom block first, up to the top
    await dropIn(blocks[0], 0); await c.sleep(450);
    await dropIn(blocks[1], 1); await c.sleep(450);
    await dropIn(blocks[2], 2);
    // third block: the stack starts to wobble, the left figure appears
    sfx.play('creak');
    wobble(1.6, 1100);
    c.anim(figL, [{ opacity: 0, translate: `${-40 * k}px 0px` }, { opacity: 1, translate: '0px 0px' }], { duration: 700, fill: 'forwards' });
    figL.style.opacity = '1';
    await c.sleep(1300);
    await dropIn(blocks[3], 3);
    // fourth block: the same wobble, the right figure appears
    sfx.play('creak');
    wobble(2.2, 1200);
    c.anim(figR, [{ opacity: 0, translate: `${40 * k}px 0px` }, { opacity: 1, translate: '0px 0px' }], { duration: 700, fill: 'forwards' });
    figR.style.opacity = '1';
    await c.sleep(1500);

    // the blocks light up in turn, top first, down to the bottom
    for (let i = blocks.length - 1; i >= 0; i--) {
      sfx.play('blip', 440 * Math.pow(1.122, (blocks.length - 1 - i) * 2));
      blocks[i].classList.add('g2-glow');
      c.later(() => blocks[i].classList.remove('g2-glow'), 700);
      await c.sleep(420);
    }
    await c.sleep(500);
    c.reveal();
  }

  // 11 CELEBRATE ALL YOUR WINS
  async function mCup(c) {
    const md = c.md, lay = md.lay;
    const stage = makeStage(c.slot, lay);
    const cup = addImage(stage, lay, Object.assign({ z: 1 }, md.cup));
    const dia = addImage(stage, lay, Object.assign({ z: 3 }, md.diamond), 'g2-diamond');
    cup.style.opacity = '0'; dia.style.opacity = '0';
    await c.ready();
    if (!c.alive()) return;
    c.anim(cup, [{ opacity: 0, scale: '0.8' }, { opacity: 1, scale: '1' }], { duration: 600, fill: 'forwards' });
    await c.sleep(650);
    c.anim(dia, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, fill: 'forwards' });
    dia.style.opacity = '1';
    glowOn(dia, true); pulseOn(dia, true);
    const hit = addHit(stage, lay, md.diamond, 1.2);
    hit.style.zIndex = '6';
    await c.tap(hit);
    hit.remove();
    pulseOn(dia, false);
    dia.classList.add('g2-glow');

    sfx.play('pop'); sfx.play('confetti');
    // confetti out of the cup
    const k = px(stage, lay);
    const mouth = md.mouth || { x: md.cup.x + md.cup.w * 0.5, y: md.cup.y + md.cup.h * 0.08 };
    const layer = el('div', 'g2-confetti', stage);
    layer.style.zIndex = '8';
    const cols = ['#ffbd59', '#ff5d8f', '#5bd1ff', '#7cf08a', '#c07bff', '#ffffff'];
    const parts = [];
    for (let i = 0; i < 70; i++) {
      const d = el('i', '', layer);
      const w = 8 + Math.random() * 8;
      d.style.width = w + 'px';
      d.style.height = (Math.random() < 0.5 ? w : w * 0.45) + 'px';
      d.style.background = cols[i % cols.length];
      d.style.borderRadius = Math.random() < 0.3 ? '50%' : '2px';
      const a = (-90 + (Math.random() - 0.5) * 100) * Math.PI / 180;
      const v = 380 + Math.random() * 520;
      parts.push({ d, x: mouth.x - lay.x0, y: mouth.y - lay.y0, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * 360, vr: (Math.random() - 0.5) * 720, life: 0 });
    }
    // the cup throbs, shakes and lights up
    cup.classList.add('g2-glow');
    c.anim(cup, [
      { transform: 'scale(1) rotate(0)' }, { transform: 'scale(1.1) rotate(-4deg)' }, { transform: 'scale(0.96) rotate(4deg)' },
      { transform: 'scale(1.08) rotate(-3deg)' }, { transform: 'scale(0.98) rotate(3deg)' }, { transform: 'scale(1.05) rotate(-1deg)' }, { transform: 'scale(1) rotate(0)' }
    ], { duration: 1600, iterations: 2 });
    const T = 3200;
    await c.tween(T, (t) => {
      const dt = 1 / 60;
      parts.forEach((p) => {
        p.vy += 900 * dt; p.vx *= 0.995;
        p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
        p.d.style.transform = `translate(${p.x * k}px, ${p.y * k}px) rotate(${p.r}deg)`;
        p.d.style.opacity = t > 0.7 ? String(Math.max(0, 1 - (t - 0.7) / 0.3)) : '1';
      });
    });
    layer.remove();
    await c.sleep(200);
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
      const wrapN = el('div', 'g2-note', stage);
      placeBox(wrapN, n, lay);
      wrapN.style.zIndex = String(3 + i);
      wrapN.style.opacity = '0';
      const im = el('img', 'g2-note-img', wrapN);
      im.src = resolveAssetUrl(n.src); im.alt = ''; im.draggable = false;
      const t = el('div', 'g2-note-text', wrapN);
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
    const hit = addHit(stage, lay, Object.assign({}, md.pad, { x: mid.x, y: mid.y }), 0.2);
    hit.style.zIndex = '30';
    await c.tap(hit);
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

  const G2_MECHANICS = {
    'g2-image': { fn: mImage, gates: false },
    'g2-football': { fn: mFootball, gates: true },
    'g2-calendar': { fn: mCalendar, gates: true },
    'g2-write': { fn: mWrite, gates: true },
    'g2-cube': { fn: mCube, gates: true },
    'g2-blocks': { fn: mBlocks, gates: true },
    'g2-cup': { fn: mCup, gates: true },
    'g2-notes': { fn: mNotes, gates: true }
  };
}
