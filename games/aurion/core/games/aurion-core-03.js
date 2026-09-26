// Repo path: games/aurion/core/games/aurion-core-03.js

// ============================================================
// PER-GAME CODE INDEPENDENCE — read before adding or reusing a mechanic
// ============================================================
// Each individual game (core-01, core-02, core-03, ...) keeps its own
// "kitchen space" — clean and tidy. This file must only contain the
// mechanics THIS game's own JSON actually calls, never a mechanic that
// belongs to a sibling game just because it happens to share a folder.
//
// If a game wants to borrow or share a piece another game already built
// (an asset, a mechanic), that piece gets CLONED into this game's own
// file, in this game's own words — never left as a shared reference back
// to the original game's file.
//
// This is a deliberate choice, not an efficiency shortcut: no file
// overload, no code debris hanging around from a mechanic this game
// doesn't even use, because that's the lazy way to get it done. Games do
// NOT touch each other. Duplicated code across games is the accepted
// cost of that — never games quietly sharing code they don't use, and
// never being unsure whose code is actually running.
//
// This file was cloned from core-02's aurion-core-02.js and trimmed/
// extended to only what core-03 actually uses: bottle-smash (Scene 1),
// item-select-boat (Scene 3, also this game's ONE scoring source),
// spin-wheel (Scene 4), wrong-map-land (Scene 5, fully automatic) and
// shell-find (Scene 9) — all five this game's own, no equivalent in
// core-01 or core-02 — plus companion-select, envelope-reveal (reverted
// to core-01's SCORED behavior, unlike core-02's non-scored flash sweep
// — Chef's explicit note for this game), and drag-to-mountain, reused
// unchanged from core-02 for Scene 6's own trail/mountain scene.
// core-02's piratehat, hide-behind-rocks, gear-select (pirate pairing),
// spot-diamond (single target), collect-to-sack and flash-tickets were
// removed entirely — not just left unused — because core-03's own
// scenes never call them. If core-03 later needs its own version of one
// of those, or another new mechanic, it gets built/cloned in here, not
// borrowed by reference from another game's file.
// ============================================================

// core-03's own envelope-reveal content — score-based again (see the
// header comment above buildEnvelopeMechanic). Content is Casey's own
// self-care theme: title + 5 value words + one soft line, no paragraph,
// no explaining the item choice back to the player. Keys match Scene 3's
// item values AND Scene 11's envelope keys in core-03.json's own
// mechanicData exactly (Protection/Calm/Carer/Planner), and the emoji
// colour-coding matches Chef's own note (🟠🟣🔵🟢).
const CORE_VALUE_MESSAGES = {
  Protection: {
    title: '🟠 PROTECTION',
    words: ['Safety', 'Security', 'Vigilance', 'Steadiness', 'Shelter'],
    line: "A little reminder that looking after yourself, and the people you love, can be its own quiet kind of strength."
  },
  Calm: {
    title: '🟣 CALM',
    words: ['Ease', 'Patience', 'Presence', 'Stillness', 'Balance'],
    line: "A little reminder that slowing down isn't falling behind. Sometimes it's exactly where you need to be."
  },
  Carer: {
    title: '🔵 CARER',
    words: ['Compassion', 'Warmth', 'Nurture', 'Kindness', 'Tenderness'],
    line: "A little reminder that taking care of others often starts with noticing what they need before they ask."
  },
  Planner: {
    title: '🟢 PLANNER',
    words: ['Foresight', 'Structure', 'Preparation', 'Direction', 'Intention'],
    line: "A little reminder that thinking ahead is its own form of care, for your future self most of all."
  }
};

// Any image/background field can be given as either a full Cloudflare URL
// or just a bare filename meant to live in this game's own assets/ folder.
// This is what actually tells them apart — if it isn't already a full
// address, treat it as a repo-relative path automatically.
function resolveAssetUrl(url) {
  if (!url) return url;
  // A bare filename is assumed to live in THIS game's own assets/ folder
  // (games/aurion/core/assets/ — shared between core-01 and core-02 as
  // reused art, per Chef's asset-hosting rule) and gets that prefix added
  // automatically. Anything that already contains a "/" — a full URL, an
  // absolute path, or a relative path like "../assets/goal-01.landing.png"
  // reaching back into the shared Aurion default assets one level up — is
  // already a real path relative to this game's own game.html and is used
  // exactly as given, no prefix added.
  if (/^https?:\/\//i.test(url) || url.startsWith('/') || url.includes('/')) {
    return url;
  }
  return 'assets/' + url;
}

// Chef's request: two of the four companion parrots and all four
// decorative pirates face the wrong way in their source art (left
// instead of right) for the scenes where they walk/hide — rather than
// replacing the image files in the repo, this flips them in place via
// CSS (transform: scaleX(-1), applied through the .aurion-flip-x class
// below in css/core-02.css). Checked against the RAW filename (before
// resolveAssetUrl adds any assets/ prefix or a caller passes a full
// URL) so it matches regardless of how the image was referenced in
// core-02.json. Only these six exact images flip — not every parrot
// or pirate, only the ones Chef listed.
// core-03 has no draggable/reused pirate sprite (the pirate images that
// exist here are static scene art, not interactive), so only the two
// parrots carry over from core-02's flip list.
const FLIP_IMAGE_FILENAMES = new Set([
  'core-01.parrot2.png',
  'core-01.parrot3.png'
]);
function needsFlip(url) {
  if (!url) return false;
  const filename = url.split('/').pop();
  return FLIP_IMAGE_FILENAMES.has(filename);
}

// Checks each .aurion-btn-label already in the live DOM and flags the
// ones actually rendering on 2 lines with .aurion-btn-label-wrapped, so
// style.css can nudge just those a little further down (a 2-line label
// needs a bit more than the base padding offset already gives every
// button). Uses a Range over the label's text rather than the label
// element's own getClientRects() — a block-level span always reports a
// single rect for itself no matter how many lines its text wraps to; the
// Range approach reports one rect per actual visual line, which is what
// actually needs checking here. Must run after the label is attached to
// the document (real layout, not a guess from character count), so this
// is called right after the button row is appended to the live scene.
function markWrappedButtonLabels(row) {
  row.querySelectorAll('.aurion-btn-label').forEach((label) => {
    const range = document.createRange();
    range.selectNodeContents(label);
    const lineCount = range.getClientRects().length;
    label.classList.toggle('aurion-btn-label-wrapped', lineCount > 1);
  });
}

// Every still image any scene could show gets warmed up here, while the
// hourglass loading screen is up, so nothing pops in late once the player
// is actually moving through scenes. Covers only the mechanics this game
// actually has (gear/pirate art, companion/parrot art, envelope art) and
// every button graphic — those would otherwise only be fetched the first
// time their scene actually rendered, which is exactly the kind of lag
// the heaviest scenes would show.
function preloadAssets(config, preloadedVideos) {
  const urls = new Set();
  const add = (url) => { if (url) urls.add(resolveAssetUrl(url)); };
  const videoUrls = new Set();

  if (config.background && config.background.url && config.background.type !== 'video') {
    add(config.background.url);
  }
  (config.decisions || []).forEach(d => {
    if (d.background && d.background.url && d.background.type !== 'video') add(d.background.url);
    if (d.image && d.image.url) add(d.image.url);
    if (d.overlayImage && d.overlayImage.url) add(d.overlayImage.url);
    if (d.video) videoUrls.add(d.video);

    (d.buttons || []).forEach(btn => { if (btn.image) add(btn.image); });

    const mechanicData = d.mechanicData || {};
    if (d.mechanic === 'piratehat') {
      add(mechanicData.image);
      add(mechanicData.revealImage);
    }
    if (d.mechanic === 'spot-diamond') {
      add(mechanicData.gempile);
      add(mechanicData.diamond);
    }
    if (d.mechanic === 'hide-behind-rocks') {
      add(mechanicData.waterwell);
      add(mechanicData.pinetrees);
      add(mechanicData.rocks);
    }
    if (d.mechanic === 'drag-to-mountain') {
      add(mechanicData.road);
    }
    if (d.mechanic === 'collect-to-sack') {
      (mechanicData.items || []).forEach(add);
      add(mechanicData.sack);
    }
    if (d.mechanic === 'flash-tickets') {
      add(mechanicData.boatdock);
      add(mechanicData.ticket);
    }
    if (d.mechanic === 'gear-select') {
      Object.values(mechanicData.gear || {}).forEach(add);
      (mechanicData.pirates || []).forEach(add);
    }
    if (d.mechanic === 'companion-select') {
      Object.values(mechanicData.parrots || {}).forEach(add);
    }
    if (d.mechanic === 'envelope-reveal') {
      Object.values(mechanicData.envelopes || {}).forEach(add);
    }
  });
  (config.characterImages || []).forEach(img => { if (img.url) add(img.url); });

  // Used on every scene but the last, not tied to any one decision. Shared
  // UI icon, reused from the goals series' default assets rather than
  // duplicated into this series' own assets folder — one level up from
  // this game's own assets/ (games/aurion/assets/ instead of
  // games/aurion/core/assets/).
  add('../assets/goal.01-exitsymbol.png');

  const loadPromises = Array.from(urls).map(url => new Promise(resolve => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = resolve;
    img.src = url;
  }));

  // A scene's own "video" field (a real watch-it video, distinct from a
  // looping background video) is built as a real off-screen <video> now
  // and handed back via preloadedVideos so renderScene() can reparent this
  // exact element later instead of creating a second one with a fresh src
  // — avoids depending on the CDN's cache headers cooperating, since it's
  // the literal same in-progress download either way.
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

  // Raised from 8s once a video is actually in the mix — a video file is
  // far heavier than a background PNG, and 8s was never going to be
  // enough for one to finish buffering, which would let the timeout win
  // the race and defeat the point of preloading it.
  const timeout = new Promise(resolve => setTimeout(resolve, videoUrls.size ? 45000 : 8000));
  return Promise.race([Promise.all([...loadPromises, ...videoPromises]), timeout]);
}

export function startGame(config, container) {
  let sceneIndex = 0;
  let ambientAudio = null;
  const preloadedVideos = new Map(); // scene.video url -> the real preloaded <video> element, reused (not recreated) when that scene renders

  // The companion (Scene 2) pick needs to keep showing up in later scenes
  // (Chef's own note: "the companion the player chose will appear in
  // every scene thereafter"). Captured here, at startGame's own scope,
  // the moment the pick is made, so Scene 3's boat drag and Scene 6's
  // trail drag can read the SAME art the player actually chose instead
  // of a hardcoded default.
  let chosenCompanionImage = null;
  // core-03's ONE scoring source — set once, in Scene 3's item pick (see
  // buildItemSelectBoatMechanic), read back by Scene 11's envelope-reveal
  // via leadingCoreValue() below. No maze/multi-source scoring system
  // needed here since there's only ever one thing that can set it.
  let chosenItemValue = null;
  function leadingCoreValue() {
    return chosenItemValue || Object.keys(CORE_VALUE_MESSAGES)[0];
  }

  container.classList.add('aurion-game');
  container.innerHTML = '';

  const bgLayer = document.createElement('div');
  bgLayer.className = 'aurion-bg-layer';
  container.appendChild(bgLayer);

  const content = document.createElement('div');
  content.className = 'aurion-content';
  container.appendChild(content);

  // Exit symbol — present on every scene except the last (Final), independent
  // of any button logic, purely a polite way to leave at any point. This
  // closes the game in place (same end-of-session pattern as the Finale's
  // "Over & Out" button below) — it does NOT jump to another scene inside
  // the game, since exit means leaving, not navigating.
  const exitBtn = document.createElement('button');
  exitBtn.className = 'aurion-exit-btn';
  exitBtn.style.backgroundImage = `url('${resolveAssetUrl('../assets/goal.01-exitsymbol.png')}')`;
  exitBtn.setAttribute('aria-label', 'Exit');
  exitBtn.addEventListener('click', () => {
    if (ambientAudio) { ambientAudio.pause(); ambientAudio = null; }
    renderGoodbye();
    window.close();
  });

  // Standard credit watermark — created once here (not per-scene) so it
  // never gets torn down/rebuilt on scene changes, just shown or hidden.
  // Chef's standing rule: this exact line, applied to whichever page(s)
  // she names each time — this first use is the consent page only, so it
  // stays hidden by default and renderScene() below is what reveals it
  // specifically when adminLabel === 'consent page'.
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

  function applyStyledText(el, obj, prefix) {
    if (obj[prefix + 'Font']) el.style.fontFamily = `'${obj[prefix + 'Font']}', Luckiest Guy`;
    if (obj[prefix + 'Color']) el.style.color = obj[prefix + 'Color'];
    if (obj[prefix + 'Size']) el.style.fontSize = obj[prefix + 'Size'] + 'px';
    if (obj[prefix + 'Bold']) el.style.fontWeight = '700';
  }

  function renderScene(index) {
    sceneIndex = index;
    const scene = config.decisions[index];
    if (!scene) return;

    const isLastScene = index === config.decisions.length - 1;
    exitBtn.style.display = isLastScene ? 'none' : 'flex';
    if (!container.contains(exitBtn)) container.appendChild(exitBtn);

    // Consent page only, per Chef's instruction — every other scene keeps
    // it hidden.
    watermark.style.display = scene.adminLabel === 'consent page' ? 'block' : 'none';

    setBackground(scene.background);
    content.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'aurion-scene-wrap';
    if ((!scene.mechanic || scene.mechanic === 'none') && !scene.video) {
      wrap.classList.add('aurion-no-mechanic');
    }
    if (scene.mechanic === 'item-select-boat' || scene.mechanic === 'companion-select'
        || scene.mechanic === 'envelope-reveal') {
      wrap.classList.add('aurion-has-side-panel');
    }
    // Landing and consent are the only two scenes whose overlay image should
    // render smaller — scoped to these two specifically (by adminLabel, set
    // in the config) so the shared .aurion-overlay-img class doesn't also
    // shrink the finale scene, which uses the same class.
    if (scene.adminLabel === 'landing page' || scene.adminLabel === 'consent page') {
      wrap.classList.add('aurion-intro-scene');
    }
    // Landing, consent and finale all get this hook so their overlay image
    // can be sized together on mobile — desktop is untouched (this class
    // has no effect outside the mobile media query in style.css).
    if (scene.adminLabel === 'landing page' || scene.adminLabel === 'consent page' || scene.adminLabel === 'final page') {
      wrap.classList.add('aurion-mobile-hero-image');
    }

    // Landing, consent and finale have no title/description of their own —
    // their overlay image is the only thing on the page above the button,
    // so it gets parked here and appended into the textblock below instead
    // of straight onto wrap. That reuses the same flex:1 + justify-content:
    // center block that already centers subtitle/desc on other no-mechanic
    // scenes, which centers the image between the top and the button
    // instead of it sitting pinned near the top. Every other overlay-image
    // scene keeps its current top-anchored placement, untouched. Note this
    // applies at every screen width, not just mobile.
    //
    // "layout": "image-left" (shared plumbing cloned in from core-01, not
    // currently used by any core-02 scene) puts the overlay image in its
    // own invisible container on the left and the title/description in
    // their own left-aligned invisible container on the right, the pair
    // centered together as one unit in the middle of the page — a
    // different arrangement of the exact same fields every other scene
    // already uses, not a new content type. Left in as generic, reusable
    // layout plumbing (not a "mechanic"), available if a future core-02
    // scene wants it.
    const isImageLeftLayout = scene.layout === 'image-left' && scene.overlayImage && scene.overlayImage.url;
    if (isImageLeftLayout) {
      wrap.classList.add('aurion-image-left-layout');
    }

    let introOverlayImg = null;
    if (!isImageLeftLayout && scene.overlayImage && scene.overlayImage.url) {
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

    // Title stays exactly where it always has — pinned at the top,
    // appended straight to the wrap, never part of the centered block
    // below, and never touched by the image-left layout below. Only the
    // subtitle + description (and, for image-left, the overlay image
    // beside them) move as their own centered unit within the space
    // between the title and the button (which keeps anchoring to the
    // bottom via .aurion-button-row's own margin-top: auto, untouched by
    // any of this).
    if (scene.titleText) {
      const title = document.createElement('h1');
      title.className = 'aurion-scene-title';
      title.textContent = scene.titleText;
      applyStyledText(title, scene, 'title');
      wrap.appendChild(title);
    }

    // Scoped to no-mechanic scenes in the CSS, so a scene with an actual
    // mechanic (which already lays its content out around the mechanic
    // slot) isn't affected by this at all.
    const textBlock = document.createElement('div');
    textBlock.className = 'aurion-scene-textblock';

    if (isImageLeftLayout) {
      // Two nested boxes, not one, so "centered in the middle of the
      // page" and "image sized to match the text" can both be true at
      // once: the outer .aurion-image-text-row is the one that grows to
      // fill the space between the title and the button and centers its
      // contents in the middle of it (same idea as the no-mechanic
      // centering rule already uses); the inner .aurion-image-text-pair
      // is only as tall as the text actually needs, with the image
      // stretched to match that exact height (CSS default cross-axis
      // stretch) instead of being sized off on its own.
      const row = document.createElement('div');
      row.className = 'aurion-image-text-row';

      const pair = document.createElement('div');
      pair.className = 'aurion-image-text-pair';

      const imgCol = document.createElement('div');
      imgCol.className = 'aurion-image-text-row-image';
      const rowImg = document.createElement('img');
      rowImg.src = resolveAssetUrl(scene.overlayImage.url);
      rowImg.alt = '';
      imgCol.appendChild(rowImg);

      const textCol = document.createElement('div');
      textCol.className = 'aurion-image-text-row-text';
      textCol.appendChild(textBlock);

      pair.append(imgCol, textCol);
      row.appendChild(pair);
      wrap.appendChild(row);
    } else {
      wrap.appendChild(textBlock);
      if (introOverlayImg) {
        textBlock.appendChild(introOverlayImg);
      }
    }

    // Optional — only present when a scene sets "subtitleText". Renders
    // as its own styled line above the description; font/color/size/bold
    // are editable per scene from the admin panel's Subtitle field, same
    // as title and description already are.
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

    // Reserved space for this scene's special mechanic — filled in by
    // dedicated code per scene. Only gear-select, companion-select and
    // envelope-reveal exist in this file (see the header note above).
    const mechanicSlot = document.createElement('div');
    mechanicSlot.className = 'aurion-mechanic-slot';
    wrap.appendChild(mechanicSlot);

    let mechanicGatesButton = false;

    if (scene.mechanic === 'bottle-smash') {
      mechanicGatesButton = true;
      buildBottleSmashMechanic(mechanicSlot, scene, revealButtons);
    }

    if (scene.mechanic === 'shell-find') {
      mechanicGatesButton = true;
      buildShellFindMechanic(mechanicSlot, scene, revealButtons);
    }

    if (scene.mechanic === 'drag-to-mountain') {
      mechanicGatesButton = true;
      buildRoadDragMechanic(mechanicSlot, scene, revealButtons);
    }

    if (scene.mechanic === 'item-select-boat') {
      mechanicGatesButton = true;
      buildItemSelectBoatMechanic(mechanicSlot, scene, revealButtons);
    }

    if (scene.mechanic === 'spin-wheel') {
      mechanicGatesButton = true;
      buildSpinWheelMechanic(mechanicSlot, scene, revealButtons);
    }

    if (scene.mechanic === 'wrong-map-land') {
      mechanicGatesButton = true;
      buildWrongMapLandMechanic(mechanicSlot, scene, revealButtons);
    }

    if (scene.mechanic === 'casey-swim') {
      mechanicGatesButton = true;
      buildCaseySwimMechanic(mechanicSlot, scene, revealButtons);
    }

    if (scene.mechanic === 'companion-select') {
      mechanicGatesButton = true;
      buildCompanionMechanic(mechanicSlot, scene, revealButtons);
    }

    if (scene.mechanic === 'envelope-reveal') {
      mechanicGatesButton = true;
      buildEnvelopeMechanic(mechanicSlot, scene, revealButtons);
    }

    if (scene.video) {
      // Reuse the exact element preloadAssets() already started downloading
      // (see preloadedVideos above) rather than creating a fresh one with
      // the same src — the whole point of preloading it. Falls back to a
      // brand-new element only if for some reason it wasn't preloaded
      // (e.g. this scene's video URL changed after preload already ran).
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
      // Text goes in its own inner span (not a raw text node) so
      // style.css can give the label a narrower max-width than the
      // button itself — that's what lets long labels wrap to a second
      // line without shrinking the whole pill graphic to match.
      const label = document.createElement('span');
      label.className = 'aurion-btn-label';
      label.textContent = btn.text || 'Continue';
      // Optional per-button fine-tune, set in the scene's JSON config as
      // "textNudge": -3 — a number of pixels, positive pushes the label
      // down, negative pulls it up. Only needed when one specific
      // button's text still doesn't land right after the automatic
      // wrapped-label nudge below; it's an inline style, so it always
      // wins over that automatic class regardless of which shows up in
      // the CSS first. Leave it off (most buttons) to use the automatic
      // behavior untouched.
      if (typeof btn.textNudge === 'number') {
        label.style.marginTop = btn.textNudge + 'px';
      }
      b.appendChild(label);
      if (btn.font) b.style.fontFamily = `'${btn.font}', Poppins`;
      if (btn.color) b.style.color = btn.color;
      if (btn.size) b.style.fontSize = btn.size + 'px';

      if (isLastScene) {
        // Finale's three buttons, in order: Another Round (restart),
        // The Team (credits), Over & Out (end) — matching Maverick's pattern
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
    }

    // Button timing: a mechanic that gates its own completion controls
    // reveal itself. Otherwise, a scene with its own voice line waits for
    // that voice to finish; everything else shows its button right away.
    if (mechanicGatesButton) {
      // the active mechanic (gear, companion, envelope) calls revealButtons itself
    } else if (scene.soundEffect) {
      // 2000ms gives a beat to read the text before the voice line starts.
      setTimeout(() => {
        const voice = new Audio(scene.soundEffect);
        voice.addEventListener('ended', revealButtons);
        voice.play().catch(revealButtons);
      }, 2000);
    } else {
      revealButtons();
    }
  }

  // Scene 1 ("Where Will Your Journey Take You?") — core-03's own
  // mechanic. A single tappable bottle (scene.mechanicData.bottle).
  // Tapping it "smashes" it — the bottle art fades/vanishes and the map
  // art (scene.mechanicData.map) fades in in its place, a one-shot swap,
  // same "tap once, no going back" pattern as core-02's piratehat. Only
  // the first tap is meaningful; further taps do nothing. Button appears
  // once the map has finished fading in.
  function buildBottleSmashMechanic(slot, scene, onComplete) {
    const mechanicData = scene.mechanicData || {};
    const bottleImage = mechanicData.bottle;
    const mapImage = mechanicData.map;
    let tapped = false;

    const stage = document.createElement('div');
    stage.className = 'aurion-sort-stage';

    const tile = document.createElement('button');
    tile.className = 'aurion-bottle-tile';
    tile.setAttribute('aria-label', 'Smash the bottle');
    if (bottleImage) tile.style.backgroundImage = `url('${resolveAssetUrl(bottleImage)}')`;

    tile.addEventListener('click', () => {
      if (tapped) return;
      tapped = true;
      tile.classList.add('smashed');
      if (mapImage) {
        // Fresh element, not a background-image swap on the same button —
        // the bottle and the map aren't the same shape/aspect ratio, so
        // swapping the one element's background would stretch whichever
        // art doesn't match the bottle's own box.
        const mapEl = document.createElement('img');
        mapEl.src = resolveAssetUrl(mapImage);
        mapEl.alt = '';
        mapEl.className = 'aurion-bottle-map-reveal';
        stage.appendChild(mapEl);
        // Matches the CSS fade-in's own duration (0.6s) plus a short beat
        // to actually see the map before the button appears.
        setTimeout(onComplete, 900);
      } else {
        onComplete();
      }
    });

    stage.appendChild(tile);
    slot.appendChild(stage);
  }

  // Scene 9 ("Time To Collect Some Sea Shells") — core-03's own version
  // of core-02's single spot-diamond mechanic, generalized to 6 hidden
  // targets instead of 1. mechanicData.shellSpots is an array of 6
  // {left, top} percent positions over the beach image — a first-pass
  // placeholder layout (not pixel-measured against Chef's actual art
  // yet, same caveat as every other placeholder position in this file),
  // easy to move once Chef points out where her 6 shell clusters
  // actually sit in the image. Each hotspot is its own invisible tap
  // target; once all 6 are found, the beach image swaps for the huts
  // image (mechanicData.huts) and the button appears.
  const DEFAULT_SHELL_SPOTS = [
    { left: 18, top: 62 },
    { left: 32, top: 78 },
    { left: 48, top: 55 },
    { left: 62, top: 70 },
    { left: 76, top: 48 },
    { left: 85, top: 66 }
  ];
  function buildShellFindMechanic(slot, scene, onComplete) {
    const mechanicData = scene.mechanicData || {};
    const beachImage = mechanicData.beach;
    const hutsImage = mechanicData.huts;
    const spots = (mechanicData.shellSpots && mechanicData.shellSpots.length === 6)
      ? mechanicData.shellSpots
      : DEFAULT_SHELL_SPOTS;
    let foundCount = 0;
    let done = false;

    const stage = document.createElement('div');
    stage.className = 'aurion-spot-stage aurion-shell-stage';

    const pile = document.createElement('img');
    if (beachImage) pile.src = resolveAssetUrl(beachImage);
    pile.alt = '';
    pile.className = 'aurion-spot-image';
    stage.appendChild(pile);

    spots.forEach((spot, i) => {
      const hotspot = document.createElement('button');
      hotspot.className = 'aurion-shell-hotspot';
      hotspot.style.left = spot.left + '%';
      hotspot.style.top = spot.top + '%';
      hotspot.setAttribute('aria-label', 'Find a shell set');
      hotspot.addEventListener('click', () => {
        if (done || hotspot.classList.contains('found')) return;
        hotspot.classList.add('found');
        foundCount += 1;
        if (foundCount >= 6) {
          done = true;
          if (hutsImage) {
            pile.src = resolveAssetUrl(hutsImage);
          }
          // Short beat so the last shell's own "found" feedback is seen
          // before the image swaps out from under it.
          setTimeout(onComplete, 500);
        }
      });
      stage.appendChild(hotspot);
    });

    slot.appendChild(stage);
  }

  // Scene 6 ("Follow The Map") and Scene 10 ("Your Journey Continues") —
  // both core-03 scenes reuse this one mechanic (cloned from core-02),
  // scene.mechanicData.road is whichever trail background that scene
  // uses. The drag is free in two dimensions (left AND top), not
  // constrained to a fixed path, since neither trail is a straight line.
  //
  // The two scenes need different target shapes though — Scene 6's
  // sailmap winds up toward a mountain at the top-RIGHT, Scene 10's
  // endjourney trail is Chef's explicit "bottom upwards, zig-zag, but
  // stay within the image centre" — so the target zone and start
  // position are read from mechanicData with defaults that match Scene
  // 6's original (unchanged) values. When a scene supplies its own
  // targetZone, the fallback "dragged far enough in one direction"
  // shortcut is skipped — that shortcut assumes movement toward one
  // corner, which doesn't hold for a centred straight-up path, so those
  // scenes rely on the measured zone alone (already given a generous
  // margin, same placeholder caveat as every other position in this
  // file — not pixel-measured against Chef's actual art yet for Scene
  // 10, easy to retune once she's seen it live).
  function buildRoadDragMechanic(slot, scene, onComplete) {
    const mechanicData = scene.mechanicData || {};
    const START_LEFT = typeof mechanicData.startLeft === 'number' ? mechanicData.startLeft : 50;
    const START_TOP = typeof mechanicData.startTop === 'number' ? mechanicData.startTop : 90;
    // Default matches Scene 6's original measured mountain target
    // (top-right). Scene 10 passes its own centred, top-of-image zone.
    const TARGET_ZONE = mechanicData.targetZone || { leftMin: 68, leftMax: 100, topMin: 8, topMax: 45 };
    // Only used when the scene did NOT supply its own targetZone — see
    // the header comment above for why.
    const ARRIVE_RIGHT_DELTA = 35;
    const ARRIVE_UP_DELTA = 55;
    const useFallbackDelta = !mechanicData.targetZone;
    let done = false;
    let dragging = false;

    const stage = document.createElement('div');
    stage.className = 'aurion-road-stage';

    if (mechanicData.road) {
      const road = document.createElement('img');
      road.src = resolveAssetUrl(mechanicData.road);
      road.alt = '';
      road.className = 'aurion-road-image';
      stage.appendChild(road);
    }

    const companion = document.createElement('button');
    companion.className = 'aurion-road-companion';
    if (needsFlip(chosenCompanionImage)) companion.classList.add('aurion-flip-x');
    companion.setAttribute('aria-label', 'Drag your companion along the trail to the mountain');
    if (chosenCompanionImage) {
      companion.style.backgroundImage = `url('${resolveAssetUrl(chosenCompanionImage)}')`;
    }

    function setPosition(leftPercent, topPercent) {
      companion.style.left = leftPercent + '%';
      companion.style.top = topPercent + '%';
    }
    setPosition(START_LEFT, START_TOP);

    function positionFromPointer(clientX, clientY) {
      const rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      const leftPercent = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
      const topPercent = Math.max(2, Math.min(98, ((clientY - rect.top) / rect.height) * 100));
      setPosition(leftPercent, topPercent);
      return { leftPercent, topPercent };
    }

    companion.addEventListener('pointerdown', (e) => {
      if (done) return;
      // Same reasoning as Scene 4's hide mechanic — without this, a real
      // phone can hijack the press-and-drag as a native image-drag or
      // long-press callout instead of running this drag logic.
      e.preventDefault();
      dragging = true;
      companion.classList.remove('returning');
      companion.setPointerCapture(e.pointerId);
    });
    companion.addEventListener('pointermove', (e) => {
      if (!dragging || done) return;
      e.preventDefault();
      positionFromPointer(e.clientX, e.clientY);
    });
    companion.addEventListener('pointerup', (e) => {
      if (!dragging || done) return;
      dragging = false;
      const pos = positionFromPointer(e.clientX, e.clientY);
      const inMeasuredZone = pos
        && pos.leftPercent >= TARGET_ZONE.leftMin && pos.leftPercent <= TARGET_ZONE.leftMax
        && pos.topPercent >= TARGET_ZONE.topMin && pos.topPercent <= TARGET_ZONE.topMax;
      const draggedFarEnough = useFallbackDelta && pos
        && (pos.leftPercent - START_LEFT) >= ARRIVE_RIGHT_DELTA
        && (START_TOP - pos.topPercent) >= ARRIVE_UP_DELTA;
      const arrived = inMeasuredZone || draggedFarEnough;
      if (arrived) {
        done = true;
        companion.classList.add('arrived');
        // Small pause so the "arrived" fade is actually seen before the
        // button appears, rather than the two happening in the same frame.
        setTimeout(onComplete, 500);
      } else {
        // Missed the mountain — snap back to the trail's start so the
        // player can try again, rather than leaving it stranded off the
        // path wherever they let go.
        companion.classList.add('returning');
        setPosition(START_LEFT, START_TOP);
      }
    });
    companion.addEventListener('pointercancel', () => { dragging = false; });

    stage.appendChild(companion);
    slot.appendChild(stage);
  }

  // Scene 3 ("Jump On Board") — core-03's own mechanic, and the ONLY
  // scoring source in this game (per Chef's confirmation): picking an
  // item sets chosenItemValue, which Scene 11's envelope-reveal reads
  // back via leadingCoreValue(). The parrot drag onto the boat that
  // follows is purely a completion step — it doesn't score anything,
  // it just has to land somewhere over the boat's own box to finish the
  // scene, same "drop zone" idea as core-02's sack/road drags.
  function buildItemSelectBoatMechanic(slot, scene, onComplete) {
    const mechanicData = scene.mechanicData || {};
    const items = mechanicData.items || {};
    const boatImage = mechanicData.boat;
    let itemChosen = false;
    let dragging = false;
    let boatDone = false;

    const stage = document.createElement('div');
    stage.className = 'aurion-sort-stage';
    const board = document.createElement('div');
    board.className = 'aurion-sort-board aurion-item-board';

    Object.entries(items).forEach(([value, imageUrl]) => {
      const tile = document.createElement('button');
      tile.className = 'aurion-sort-tile aurion-item-tile';
      if (imageUrl) tile.style.backgroundImage = `url('${resolveAssetUrl(imageUrl)}')`;
      tile.addEventListener('click', () => {
        if (itemChosen) return;
        itemChosen = true;
        tile.classList.add('opened');
        board.querySelectorAll('.aurion-item-tile').forEach(t => { if (t !== tile) t.classList.add('dim'); });
        // The one and only place this game's score gets written — see the
        // header comment above.
        chosenItemValue = value;
        showBoatStage();
      });
      board.appendChild(tile);
    });

    stage.appendChild(board);
    slot.appendChild(stage);

    function showBoatStage() {
      const boatStage = document.createElement('div');
      boatStage.className = 'aurion-boat-stage';

      if (boatImage) {
        const boatEl = document.createElement('img');
        boatEl.src = resolveAssetUrl(boatImage);
        boatEl.alt = '';
        boatEl.className = 'aurion-boat-image';
        boatStage.appendChild(boatEl);
      }

      const companion = document.createElement('button');
      companion.className = 'aurion-boat-companion';
      if (needsFlip(chosenCompanionImage)) companion.classList.add('aurion-flip-x');
      companion.setAttribute('aria-label', 'Drag your companion onto the boat');
      if (chosenCompanionImage) {
        companion.style.backgroundImage = `url('${resolveAssetUrl(chosenCompanionImage)}')`;
      }

      const START_LEFT = 12;
      const START_TOP = 85;
      function setPosition(leftPercent, topPercent) {
        companion.style.left = leftPercent + '%';
        companion.style.top = topPercent + '%';
      }
      setPosition(START_LEFT, START_TOP);

      function positionFromPointer(clientX, clientY) {
        const rect = boatStage.getBoundingClientRect();
        if (!rect.width || !rect.height) return null;
        const leftPercent = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
        const topPercent = Math.max(2, Math.min(98, ((clientY - rect.top) / rect.height) * 100));
        setPosition(leftPercent, topPercent);
        return { leftPercent, topPercent };
      }

      // Boat's own box (a generous margin around the visible boat art,
      // not pixel-measured against Chef's actual art yet — same
      // placeholder caveat as everywhere else in this file) is what a
      // drop is checked against, not just the exact pixels of the boat
      // image itself.
      const BOAT_ZONE = { leftMin: 35, leftMax: 95, topMin: 40, topMax: 95 };

      companion.addEventListener('pointerdown', (e) => {
        if (boatDone) return;
        e.preventDefault();
        dragging = true;
        companion.classList.remove('returning');
        companion.setPointerCapture(e.pointerId);
      });
      companion.addEventListener('pointermove', (e) => {
        if (!dragging || boatDone) return;
        e.preventDefault();
        positionFromPointer(e.clientX, e.clientY);
      });
      companion.addEventListener('pointerup', (e) => {
        if (!dragging || boatDone) return;
        dragging = false;
        const pos = positionFromPointer(e.clientX, e.clientY);
        const onBoat = pos
          && pos.leftPercent >= BOAT_ZONE.leftMin && pos.leftPercent <= BOAT_ZONE.leftMax
          && pos.topPercent >= BOAT_ZONE.topMin && pos.topPercent <= BOAT_ZONE.topMax;
        if (onBoat) {
          boatDone = true;
          companion.classList.add('arrived');
          setTimeout(onComplete, 500);
        } else {
          companion.classList.add('returning');
          setPosition(START_LEFT, START_TOP);
        }
      });
      companion.addEventListener('pointercancel', () => { dragging = false; });

      boatStage.appendChild(companion);
      slot.appendChild(boatStage);
    }
  }

  // Scene 4 ("You Been Spotted") — core-03's own mechanic. The
  // pirateviewing image sits on the page while Aurion's voice line
  // plays (scene.soundEffect); once it finishes, that image swaps for
  // the spinning-wheel image. A single tap on the diamond (built into
  // the wheel's own art, per Chef's screenshot — the tap target is the
  // wheel's centre) triggers one fast automatic multi-spin animation;
  // the button appears once that animation ends. No drag, no repeated
  // taps needed.
  function buildSpinWheelMechanic(slot, scene, onComplete) {
    const mechanicData = scene.mechanicData || {};
    const viewingImage = mechanicData.pirateviewing;
    const wheelImage = mechanicData.wheel;
    let spun = false;

    const stage = document.createElement('div');
    stage.className = 'aurion-sort-stage';

    const viewingEl = document.createElement('img');
    if (viewingImage) viewingEl.src = resolveAssetUrl(viewingImage);
    viewingEl.alt = '';
    viewingEl.className = 'aurion-spot-image';
    stage.appendChild(viewingEl);
    slot.appendChild(stage);

    function showWheel() {
      viewingEl.remove();
      const wheel = document.createElement('button');
      wheel.className = 'aurion-spin-wheel';
      wheel.setAttribute('aria-label', 'Press the diamond to spin the wheel');
      if (wheelImage) wheel.style.backgroundImage = `url('${resolveAssetUrl(wheelImage)}')`;
      wheel.addEventListener('click', () => {
        if (spun) return;
        spun = true;
        wheel.classList.add('spinning');
      });
      wheel.addEventListener('animationend', () => {
        if (spun) onComplete();
      });
      stage.appendChild(wheel);
    }

    if (scene.soundEffect) {
      const voice = new Audio(scene.soundEffect);
      voice.addEventListener('ended', showWheel);
      voice.play().catch(showWheel);
    } else {
      showWheel();
    }
  }

  // Scene 5 ("Your Companion Is Helping Out") — core-03's own mechanic,
  // fully automatic, no player interaction. Static pirate-ship and
  // pirate-island art sit on the page; once Aurion's voice line
  // finishes (so it can't spoil what's about to happen), the wrongmap
  // sprite flies in from the right, circles slowly, and settles on the
  // treasure box — a single CSS animation (see @keyframes
  // wrong-map-fly), not separate scripted steps. The button appears
  // once that animation ends.
  function buildWrongMapLandMechanic(slot, scene, onComplete) {
    const mechanicData = scene.mechanicData || {};
    const shipImage = mechanicData.pirateship;
    const islandImage = mechanicData.pirateisland;
    const mapImage = mechanicData.wrongmap;

    const stage = document.createElement('div');
    stage.className = 'aurion-wrongmap-stage';

    if (shipImage) {
      const ship = document.createElement('img');
      ship.src = resolveAssetUrl(shipImage);
      ship.alt = '';
      ship.className = 'aurion-wrongmap-ship';
      stage.appendChild(ship);
    }
    if (islandImage) {
      const island = document.createElement('img');
      island.src = resolveAssetUrl(islandImage);
      island.alt = '';
      island.className = 'aurion-wrongmap-island';
      stage.appendChild(island);
    }

    const flyer = document.createElement('div');
    flyer.className = 'aurion-wrongmap-flyer';
    if (mapImage) flyer.style.backgroundImage = `url('${resolveAssetUrl(mapImage)}')`;

    function startFlight() {
      stage.appendChild(flyer);
      flyer.addEventListener('animationend', onComplete);
      flyer.classList.add('flying');
    }

    if (scene.soundEffect) {
      const voice = new Audio(scene.soundEffect);
      voice.addEventListener('ended', startFlight);
      voice.play().catch(startFlight);
    } else {
      startFlight();
    }

    slot.appendChild(stage);
  }

  // Scene 8 ("You Found A Friendly Smile") — core-03's own mechanic,
  // fully automatic like Scene 5's wrong-map animation. The undersea
  // background shows immediately; after a short beat, Casey (the otter)
  // fades in and drifts/bobs gently for a few slow loops — "like otters
  // behave" per Chef's note — no player interaction at all. The button
  // is gated on a fixed watch time rather than an animationend, since
  // this is a LOOPING ambient animation with no natural single "end"
  // event — CASEY_WATCH_MS is a first-pass guess at "a few rounds" of
  // the loop, easy to lengthen/shorten once Chef sees it against her
  // actual animation timing.
  const CASEY_WATCH_MS = 7000;
  function buildCaseySwimMechanic(slot, scene, onComplete) {
    const mechanicData = scene.mechanicData || {};
    const underseaImage = mechanicData.undersea;
    const caseyImage = mechanicData.casey;

    const stage = document.createElement('div');
    stage.className = 'aurion-casey-stage';

    if (underseaImage) {
      const bg = document.createElement('img');
      bg.src = resolveAssetUrl(underseaImage);
      bg.alt = '';
      bg.className = 'aurion-casey-undersea';
      stage.appendChild(bg);
    }

    if (caseyImage) {
      const casey = document.createElement('div');
      casey.className = 'aurion-casey-otter';
      casey.style.backgroundImage = `url('${resolveAssetUrl(caseyImage)}')`;
      stage.appendChild(casey);
      // A short delay before Casey fades in ("appears after a few
      // seconds", per Chef's note) rather than being visible immediately
      // with the rest of the scene.
      setTimeout(() => casey.classList.add('visible'), 1200);
    }

    slot.appendChild(stage);
    setTimeout(onComplete, CASEY_WATCH_MS);
  }


  // Scene 2 ("Choose Your Companion") — single row of four parrots, same
  // grid/tile classes as the gear scene. One click picks; the button only
  // appears once this scene's voice line (if any) has played through and
  // finished, not the instant the pick is made. Cloned from core-01's
  // identical mechanic — same behavior, this game's own copy.
  function buildCompanionMechanic(slot, scene, onComplete) {
    const parrots = (scene.mechanicData && scene.mechanicData.parrots) || {};
    let chosen = false;

    const stage = document.createElement('div');
    stage.className = 'aurion-sort-stage';
    const board = document.createElement('div');
    board.className = 'aurion-sort-board aurion-companion-board';

    Object.entries(parrots).forEach(([value, imageUrl]) => {
      const tile = document.createElement('button');
      tile.className = 'aurion-sort-tile aurion-companion-tile';
      if (needsFlip(imageUrl)) tile.classList.add('aurion-flip-x');
      if (imageUrl) tile.style.backgroundImage = `url('${resolveAssetUrl(imageUrl)}')`;
      tile.addEventListener('click', () => {
        if (chosen) return;
        chosen = true;
        tile.classList.add('opened');
        board.querySelectorAll('.aurion-companion-tile').forEach(t => { if (t !== tile) t.classList.add('dim'); });
        // Not scored — same reasoning as the gear scene above. Captured
        // (not scored) so every later scene shows THIS companion, per
        // Chef's note that the chosen companion appears in every scene
        // from here on.
        chosenCompanionImage = imageUrl;

        if (scene.soundEffect) {
          const voice = new Audio(scene.soundEffect);
          voice.addEventListener('ended', onComplete);
          voice.play().catch(onComplete);
        } else {
          onComplete();
        }
      });
      board.appendChild(tile);
    });

    stage.appendChild(board);
    slot.appendChild(stage);
  }

  // Scene 9 ("What Else Can You Find Here?") — NOT score-based for
  // core-02 (Chef's explicit note). All four envelopes are openable, any
  // one of them; there's no hidden "winner" to guess or compute. Instead,
  // the four light up in sequence, left to right, fairly fast, on a
  // repeating loop — a small sense of urgency, not a puzzle — until the
  // player taps one. That tap stops the sequence, dims the whole board
  // (same reasoning as before: the tile artwork behind the popup's glass
  // card interferes with reading it), and shows that envelope's own
  // fixed value card — title plus its 15-word list, same fonts/colors as
  // the previous score-based popup used. Once the player closes the
  // card, the "Aurion" voice line plays (still just scene.soundEffect —
  // Chef's building a new version of this clip and will hand over its
  // own Cloudflare URL once it's ready, dropped into core-02.json same
  // as any other soundEffect) and the button waits for it to finish,
  // same pattern as before. The other three envelopes are disabled once
  // one is opened — this scene only ever shows one card per visit.
  function buildEnvelopeMechanic(slot, scene, onComplete) {
    const envelopes = (scene.mechanicData && scene.mechanicData.envelopes) || {};
    // core-03 is score-based again (Chef's explicit note: "SAME
    // MECHANICS FROM CORE 01" — unlike core-02's non-scored flash
    // sweep). The score is written once, at Scene 3's item pick (see
    // chosenItemValue / leadingCoreValue near the top of startGame).
    // Only the winning envelope highlights (a steady glow, not a
    // flashing sweep) and only it is clickable — the other three are
    // dimmed and disabled, same behavior as core-01's original.
    const winner = leadingCoreValue();

    const stage = document.createElement('div');
    stage.className = 'aurion-sort-stage';
    const board = document.createElement('div');
    board.className = 'aurion-sort-board aurion-envelope-board';
    const popup = document.createElement('div');
    popup.className = 'aurion-reveal-popup';

    Object.entries(envelopes).forEach(([value, imageUrl]) => {
      const tile = document.createElement('button');
      tile.className = 'aurion-sort-tile aurion-reveal-tile aurion-envelope-tile';
      if (imageUrl) tile.style.backgroundImage = `url('${resolveAssetUrl(imageUrl)}')`;

      const isWinner = value === winner;
      if (!isWinner) {
        tile.classList.add('dim');
        tile.disabled = true;
      } else {
        tile.classList.add('flashing');
      }

      tile.addEventListener('click', () => {
        if (!isWinner || tile.classList.contains('opened')) return;
        tile.classList.remove('flashing');
        tile.classList.add('opened');
        // The board sits directly behind the popup's glass card — the
        // tile artwork was showing straight through the popup's
        // translucent background and making the message hard to read.
        // Dimming the whole board while the card is open (and undimming
        // on close) clears that interference regardless of which tile
        // opened it.
        board.classList.add('dimmed');

        popup.innerHTML = '';
        popup.classList.add('open');
        const msg = CORE_VALUE_MESSAGES[value];

        const title = document.createElement('h2');
        title.textContent = msg.title;

        // Casey's own card shape for core-03: title, then the 5 value
        // words on one line (dot-separated, not a bulleted list — a
        // different, shorter format than core-02's 15-word list), then
        // one soft reminder line. Reuses the exact same subtitle/body
        // classes core-01's original popup used, just with this game's
        // own content.
        const wordsLine = document.createElement('p');
        wordsLine.className = 'aurion-reveal-subtitle';
        wordsLine.textContent = (msg.words || []).join(' · ');

        const body = document.createElement('p');
        body.className = 'aurion-reveal-body';
        body.textContent = msg.line || '';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'aurion-btn';
        closeBtn.textContent = 'Close';
        closeBtn.addEventListener('click', () => {
          popup.classList.remove('open');
          board.classList.remove('dimmed');
          if (scene.soundEffect) {
            const voice = new Audio(scene.soundEffect);
            voice.addEventListener('ended', onComplete);
            voice.play().catch(onComplete);
          } else {
            onComplete();
          }
        });

        popup.append(title, wordsLine, body, closeBtn);
      });

      board.appendChild(tile);
    });

    stage.append(board, popup);
    slot.appendChild(stage);
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
