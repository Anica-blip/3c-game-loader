// Repo path: games/aurion/core/games/aurion-core-02.js

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
// This file was cloned from core-01's aurion.js and trimmed to only what
// core-02 actually uses: piratehat (Scene 1), hide-behind-rocks (Scene 4)
// and drag-to-mountain (Scene 5), and spot-diamond (Scene 6) — all four
// this game's own, no equivalent in core-01 — plus companion-select,
// gear-select, envelope-reveal.
// core-01's compass, maze, and key-grab mechanics were removed entirely —
// not just left unused — because core-02's own scenes never call them.
// If core-02 later needs its own version of one of those, or another new
// mechanic, it gets built/cloned in here, not borrowed by reference from
// core-01's file.
// ============================================================

// core-02's own envelope-reveal content — NOT score-based (Chef's explicit
// note for this game: "the reveal cards are not 'score based' this time").
// Every envelope shows its own fixed value name + word list; which one the
// player sees depends only on which envelope they tap, nothing is tracked
// or compared. Order here matches the envelope order in core-02.json's own
// mechanicData.envelopes (1 Courage, 2 Independence, 3 Connection,
// 4 Integrity), which is already the envelopes' own colour-coding.
const CORE_VALUE_MESSAGES = {
  Courage: {
    title: '🟠 COURAGE',
    words: ['Bravery', 'Boldness', 'Confidence', 'Determination', 'Resilience', 'Conviction', 'Initiative', 'Fortitude', 'Perseverance', 'Fearlessness', 'Audacity', 'Self-belief', 'Daring', 'Assertiveness', 'Tenacity']
  },
  Independence: {
    title: '🟣 INDEPENDENCE',
    words: ['Autonomy', 'Freedom', 'Self-reliance', 'Self-direction', 'Individuality', 'Sovereignty', 'Agency', 'Resourcefulness', 'Self-sufficiency', 'Originality', 'Initiative', 'Self-determination', 'Nonconformity', 'Independence of thought', 'Personal responsibility']
  },
  Connection: {
    title: '🔵 CONNECTION',
    words: ['Belonging', 'Compassion', 'Empathy', 'Friendship', 'Community', 'Cooperation', 'Kindness', 'Loyalty', 'Trust', 'Understanding', 'Generosity', 'Acceptance', 'Support', 'Inclusion', 'Fellowship']
  },
  Integrity: {
    title: '🟢 INTEGRITY',
    words: ['Honesty', 'Authenticity', 'Fairness', 'Accountability', 'Reliability', 'Transparency', 'Sincerity', 'Responsibility', 'Trustworthiness', 'Consistency', 'Honour', 'Justice', 'Principle', 'Respect', 'Truthfulness']
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
const FLIP_IMAGE_FILENAMES = new Set([
  'core-01.parrot2.png',
  'core-01.parrot3.png',
  'core-01.pirate1.png',
  'core-01.pirate2.png',
  'core-01.pirate3.png',
  'core-01.pirate4.png'
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

  // The companion (Scene 2) and gear/pirate (Scene 3) picks need to keep
  // showing up in later scenes (Chef's own note: "the companion the player
  // chose will appear in every scene thereafter"). Captured here, at
  // startGame's own scope, the moment each pick is made, so Scene 4's hide
  // mechanic and Scene 5's road mechanic can read the SAME art the player
  // actually chose instead of a hardcoded default.
  let chosenCompanionImage = null;
  let chosenGearPirateImage = null;

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
    if (scene.mechanic === 'gear-select' || scene.mechanic === 'companion-select'
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

    if (scene.mechanic === 'piratehat') {
      mechanicGatesButton = true;
      buildPirateHatMechanic(mechanicSlot, scene, revealButtons);
    }

    if (scene.mechanic === 'spot-diamond') {
      mechanicGatesButton = true;
      buildSpotDiamondMechanic(mechanicSlot, scene, revealButtons);
    }

    if (scene.mechanic === 'hide-behind-rocks') {
      mechanicGatesButton = true;
      buildHideMechanic(mechanicSlot, scene, revealButtons);
    }

    if (scene.mechanic === 'drag-to-mountain') {
      mechanicGatesButton = true;
      buildRoadDragMechanic(mechanicSlot, scene, revealButtons);
    }

    if (scene.mechanic === 'collect-to-sack') {
      mechanicGatesButton = true;
      buildCollectToSackMechanic(mechanicSlot, scene, revealButtons);
    }

    if (scene.mechanic === 'flash-tickets') {
      mechanicGatesButton = true;
      buildFlashTicketsMechanic(mechanicSlot, scene, revealButtons);
    }

    if (scene.mechanic === 'gear-select') {
      mechanicGatesButton = true;
      buildGearMechanic(mechanicSlot, scene, revealButtons);
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

  // Scene 1 ("Where Will Your Journey Take You?") — core-02's own mechanic,
  // no equivalent in core-01. A single tappable image (the pirate's hat,
  // scene.mechanicData.image). The title/subtitle wording ("Tap The Hat")
  // is already handled by the normal titleText/subtitleText fields above
  // — this mechanic only owns the image itself. Tapping it swaps the hat
  // artwork for the reveal image (scene.mechanicData.revealImage — the
  // pirate's greeting), a single one-shot swap, no going back, then the
  // button appears. Only one tap is meaningful; further taps do nothing.
  function buildPirateHatMechanic(slot, scene, onComplete) {
    const mechanicData = scene.mechanicData || {};
    const hatImage = mechanicData.image;
    const revealImage = mechanicData.revealImage;
    let tapped = false;

    const stage = document.createElement('div');
    stage.className = 'aurion-sort-stage';

    const tile = document.createElement('button');
    tile.className = 'aurion-piratehat-tile';
    tile.setAttribute('aria-label', 'Tap the hat');
    if (hatImage) tile.style.backgroundImage = `url('${resolveAssetUrl(hatImage)}')`;

    tile.addEventListener('click', () => {
      if (tapped) return;
      tapped = true;
      if (revealImage) {
        tile.style.backgroundImage = `url('${resolveAssetUrl(revealImage)}')`;
      }
      tile.classList.add('opened');
      onComplete();
    });

    stage.appendChild(tile);
    slot.appendChild(stage);
  }

  // Scene 6 ("You Found A Nice Treasure") — core-02's own mechanic, no
  // equivalent in core-01. scene.mechanicData.gempile is the treasure
  // pile image, rendered as the scene's one big visual. The 3C diamond
  // (scene.mechanicData.diamond — the shared brand asset every Aurion
  // game carries, not a core-02-only image) sits small and absolutely
  // positioned on top of it, hidden in plain sight among the gems. One
  // click finds it, then the button appears.
  //
  // The diamond's exact top/left/size (in the CSS, .aurion-spot-hidden-
  // item) is a placeholder until Chef confirms where it should actually
  // sit once the real gempile artwork is in place — flagged, not final.
  function buildSpotDiamondMechanic(slot, scene, onComplete) {
    const mechanicData = scene.mechanicData || {};
    const gempileImage = mechanicData.gempile;
    const diamondImage = mechanicData.diamond;
    let found = false;

    const stage = document.createElement('div');
    stage.className = 'aurion-spot-stage';

    if (gempileImage) {
      const pile = document.createElement('img');
      pile.src = resolveAssetUrl(gempileImage);
      pile.alt = '';
      pile.className = 'aurion-spot-image';
      stage.appendChild(pile);
    }

    const diamond = document.createElement('button');
    diamond.className = 'aurion-spot-hidden-item aurion-spot-diamond';
    diamond.setAttribute('aria-label', 'Find the 3C diamond');
    if (diamondImage) diamond.style.backgroundImage = `url('${resolveAssetUrl(diamondImage)}')`;

    diamond.addEventListener('click', () => {
      if (found) return;
      found = true;
      diamond.classList.add('found');
      onComplete();
    });

    stage.appendChild(diamond);
    slot.appendChild(stage);
  }

  // Scene 4 ("Refreshing Spot") — core-02's own mechanic, no equivalent in
  // core-01. Three background pieces (waterwell, pinetrees, rocks —
  // scene.mechanicData) make up the scene's composition. The player
  // DRAGS the companion (not a tap — a tap would be deciding the move
  // for them, per Chef's explicit correction) behind the rocks; letting
  // go inside the rocks' drop zone vanishes it there, letting go
  // anywhere else snaps it back to try again. Once it's vanished, the
  // pirate matching whichever gear the player chose in Scene 3 walks
  // across the screen left to right, edge to edge — no margins — at an
  // unhurried pace (see @keyframes hide-pirate-walk's duration in the
  // CSS; slowed down per Chef's note that the first pass felt rushed).
  // Only once that walk finishes does the button appear.
  //
  // Built with Pointer Events, same family as Scene 5's road drag below
  // — this one drags in two dimensions (left AND top) since the rock
  // drop zone isn't a straight horizontal line the way the road is.
  //
  // ROCK_ZONE (the drop target the drag has to land in) is matched by
  // eye to .aurion-hide-rocks' own position in the CSS — a first pass,
  // not exact, same placeholder caveat as everything else positioned
  // against art Chef hasn't confirmed live yet.
  function buildHideMechanic(slot, scene, onComplete) {
    const mechanicData = scene.mechanicData || {};
    const ROCK_ZONE = { leftMin: 64, leftMax: 100, topMin: 26, topMax: 68 };
    const START_LEFT = 50;
    const START_TOP = 90;
    let placed = false;
    let dragging = false;

    const stage = document.createElement('div');
    stage.className = 'aurion-hide-stage';

    function addBgItem(url, className) {
      if (!url) return;
      const img = document.createElement('img');
      img.src = resolveAssetUrl(url);
      img.alt = '';
      img.className = 'aurion-hide-bg-item ' + className;
      stage.appendChild(img);
    }

    addBgItem(mechanicData.waterwell, 'aurion-hide-waterwell');
    addBgItem(mechanicData.pinetrees, 'aurion-hide-pinetrees');
    addBgItem(mechanicData.rocks, 'aurion-hide-rocks');

    const companion = document.createElement('button');
    companion.className = 'aurion-hide-companion-dot';
    if (needsFlip(chosenCompanionImage)) companion.classList.add('aurion-flip-x');
    companion.setAttribute('aria-label', 'Drag your companion behind the rocks');
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
      if (placed) return;
      // preventDefault here matters on real phones specifically: without
      // it, pressing and dragging an element with a background-image can
      // trigger the browser's own native "drag this image" ghost-drag or
      // a long-press callout instead of our own drag logic — touch-
      // action: none (in the CSS) stops page scrolling but does not by
      // itself stop that native image-drag behavior.
      e.preventDefault();
      dragging = true;
      companion.classList.remove('returning');
      companion.setPointerCapture(e.pointerId);
    });
    companion.addEventListener('pointermove', (e) => {
      if (!dragging || placed) return;
      e.preventDefault();
      positionFromPointer(e.clientX, e.clientY);
    });
    companion.addEventListener('pointerup', (e) => {
      if (!dragging || placed) return;
      dragging = false;
      const pos = positionFromPointer(e.clientX, e.clientY);
      const inZone = pos
        && pos.leftPercent >= ROCK_ZONE.leftMin && pos.leftPercent <= ROCK_ZONE.leftMax
        && pos.topPercent >= ROCK_ZONE.topMin && pos.topPercent <= ROCK_ZONE.topMax;
      if (inZone) {
        placed = true;
        companion.classList.add('vanished');
        startPirateWalk();
      } else {
        // Missed the rocks — snap back to the start so the player can
        // try again, rather than leaving it stranded wherever they let go.
        companion.classList.add('returning');
        setPosition(START_LEFT, START_TOP);
      }
    });
    companion.addEventListener('pointercancel', () => { dragging = false; });

    stage.appendChild(companion);

    function startPirateWalk() {
      const pirate = document.createElement('div');
      pirate.className = 'aurion-hide-pirate-walk';
      if (needsFlip(chosenGearPirateImage)) pirate.classList.add('aurion-flip-x');
      if (chosenGearPirateImage) {
        pirate.style.backgroundImage = `url('${resolveAssetUrl(chosenGearPirateImage)}')`;
      }
      // The walk is a plain CSS animation (see @keyframes hide-pirate-walk)
      // — animationend is what actually gates the button, not a timer
      // guessed to roughly match the animation's own duration.
      pirate.addEventListener('animationend', () => {
        pirate.remove();
        onComplete();
      });
      stage.appendChild(pirate);
    }

    slot.appendChild(stage);
  }

  // Scene 5 ("Follow The Map") — core-02's own mechanic, no equivalent in
  // core-01. scene.mechanicData.road is the road/mountain background —
  // Chef's actual art winds from the bottom-left up to the mountain at
  // the top-right, it is NOT a straight horizontal line, so the drag is
  // free in two dimensions (left AND top), same family as Scene 4's
  // rock drag above — not constrained to a fixed path, since a straight
  // left-to-right slide was never going to match a zigzag road (my
  // earlier version did exactly that, wrongly).
  //
  // MOUNTAIN_ZONE (where the drag has to land to count as "arrived") is
  // matched by eye to where the road visually disappears behind the
  // mountain at the top-right of the art — a first pass, not exact,
  // same placeholder caveat as every other position in this file.
  function buildRoadDragMechanic(slot, scene, onComplete) {
    const mechanicData = scene.mechanicData || {};
    // These are measured, not eyeballed — taken by scanning the actual
    // screenshot Chef sent (pixel-by-pixel: background-color subtraction
    // to find the illustration's own bounding box, a green-channel scan
    // for the mountain, a white-pixel scan for the road's own painted
    // centre line) rather than guessing proportions from looking at it.
    // The illustration's content box measured 448x391px inside that
    // screenshot — a 1.146:1 ratio, not the 1:1 square guessed before.
    // The road's centre line's topmost point — where it visually
    // disappears behind the mountain — measured at roughly (86%, 25%).
    // START position is deliberately NOT the measured (17%, 87%) resting
    // spot from that screenshot's own art — Chef asked for the parrot to
    // start centered at the bottom of the image, not off to its left
    // side, so this is a placement choice, not a measurement.
    const START_LEFT = 50;
    const START_TOP = 90;
    // MOUNTAIN_ZONE is now the actual measured target, with a generous
    // margin around it (screenshot compression and my own color
    // thresholds aren't pixel-perfect, so this isn't treated as exact).
    const MOUNTAIN_ZONE = { leftMin: 68, leftMax: 100, topMin: 8, topMax: 45 };
    // Kept as a second path to success alongside the measured zone, not
    // instead of it: a real drag that clearly moves it well up and to
    // the right still counts even if it lands just outside the measured
    // zone's margin. Right-delta is smaller than before (35, not 55)
    // now that START_LEFT sits at the centre (50) rather than the left
    // edge (17) — the old 55 would have needed leftPercent >= 105,
    // past the 98 clamp, making that fallback path unreachable.
    const ARRIVE_RIGHT_DELTA = 35;
    const ARRIVE_UP_DELTA = 55;
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
        && pos.leftPercent >= MOUNTAIN_ZONE.leftMin && pos.leftPercent <= MOUNTAIN_ZONE.leftMax
        && pos.topPercent >= MOUNTAIN_ZONE.topMin && pos.topPercent <= MOUNTAIN_ZONE.topMax;
      const draggedFarEnough = pos
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

  // Scene 7 ("It's Your Lucky Day") — items (3 diamonds + 1 coin pile) sit
  // on the left, the sack sits on the right, per Chef's own layout note.
  // Each item is its own drag target — the player drags it, individually,
  // across into the sack, same "don't decide for the player" rule as
  // Scene 4's rock-drag: nothing auto-travels on a tap. An item that's
  // dropped anywhere over the sack's own box counts as collected and
  // fades out; missed drops snap back to that item's own start spot.
  // Scene finishes (button appears) once every item has been collected.
  function buildCollectToSackMechanic(slot, scene, onComplete) {
    const mechanicData = scene.mechanicData || {};
    const items = mechanicData.items || [];

    const stage = document.createElement('div');
    stage.className = 'aurion-sack-stage';

    const sack = document.createElement('img');
    sack.className = 'aurion-sack-bag';
    sack.alt = '';
    if (mechanicData.sack) sack.src = resolveAssetUrl(mechanicData.sack);
    stage.appendChild(sack);

    // Third pass — this time measured against Chef's own screenshot of
    // the previous version, not eyeballed. The screenshot has no ruler,
    // but the previous DIAMOND_SPOTS/COIN_SPOT values ARE known (they're
    // what rendered it), so those four points were used as calibration:
    // pixel-scanned each item's own color in the screenshot (white/blue/
    // purple diamond, gold coin) to get its rendered center in image
    // pixels, then solved the stage's own pixel origin and width/height
    // by least-squares fit against the percent values that actually
    // produced those pixels. That recovered stage box (~524x344px,
    // matching the CSS's 520px max-width / 3:2 aspect closely) is what
    // the new spots below are computed against — not guessed proportions.
    // Chef's actual note was that the diamonds needed to (a) sit closer
    // to EACH OTHER — this cluster is much tighter than the last pass —
    // and (b) move toward the COIN pile, not toward the sack, which is
    // the direction the previous pass had wrongly gone. Coin's own spot
    // is unchanged from the last pass; only the diamonds moved.
    // This desktop-confirmed layout is untouched — Chef was explicit
    // that desktop stays as-is. Mobile gets its own, separate set below,
    // because the same percent positions read as far more cramped there:
    // every item's own size (38px diamond, 92px coin) is a fixed pixel
    // value, not a percentage, so on a narrower mobile stage that same
    // 38px/92px eats up a much bigger share of the visible width, and
    // the desktop gap that looked fine there reads as clutter here.
    const DIAMOND_SPOTS = [
      { left: 22, top: 22 },
      { left: 33, top: 25 },
      { left: 27, top: 37 }
    ];
    // Pulled back 10 points to the left from the previous mobile pass —
    // that version fixed the "cramped against the coins" complaint but
    // over-corrected, landing too close to the sack instead. This still
    // clears every pairwise hit-area gap the same way the last version
    // did (checked against the same mobile stage size), just shifted
    // back toward the coin pile.
    const MOBILE_DIAMOND_SPOTS = [
      { left: 30, top: 20 },
      { left: 42, top: 24 },
      { left: 35, top: 42 }
    ];
    const COIN_SPOT = { left: 14, top: 57 };
    const isMobileLayout = window.matchMedia('(max-width: 700px)').matches;
    const activeDiamondSpots = isMobileLayout ? MOBILE_DIAMOND_SPOTS : DIAMOND_SPOTS;

    let remaining = items.length;

    items.forEach((url, i) => {
      // Last item in the array is always the gold coin pile
      // (mechanicData.items is [diamond1, diamond2, diamond3, goldcoins]
      // — see core-02.json); everything before it is a diamond.
      const isCoin = i === items.length - 1;
      const spot = isCoin ? COIN_SPOT : activeDiamondSpots[i % activeDiamondSpots.length];
      const item = document.createElement('button');
      item.className = 'aurion-sack-item ' + (isCoin ? 'aurion-sack-item-coin' : 'aurion-sack-item-diamond');
      item.style.backgroundImage = `url('${resolveAssetUrl(url)}')`;
      item.setAttribute('aria-label', 'Drag this into the sack');
      let dragging = false;
      let collected = false;

      function setPosition(leftPercent, topPercent) {
        item.style.left = leftPercent + '%';
        item.style.top = topPercent + '%';
      }
      setPosition(spot.left, spot.top);

      function positionFromPointer(clientX, clientY) {
        const rect = stage.getBoundingClientRect();
        if (!rect.width || !rect.height) return null;
        const leftPercent = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
        const topPercent = Math.max(2, Math.min(98, ((clientY - rect.top) / rect.height) * 100));
        setPosition(leftPercent, topPercent);
        return { clientX, clientY };
      }

      item.addEventListener('pointerdown', (e) => {
        if (collected) return;
        e.preventDefault();
        dragging = true;
        item.classList.add('dragging');
        item.setPointerCapture(e.pointerId);
      });
      item.addEventListener('pointermove', (e) => {
        if (!dragging || collected) return;
        e.preventDefault();
        positionFromPointer(e.clientX, e.clientY);
      });
      item.addEventListener('pointerup', (e) => {
        if (!dragging || collected) return;
        dragging = false;
        item.classList.remove('dragging');
        positionFromPointer(e.clientX, e.clientY);
        // A 20px margin around the sack's own rendered box, not just the
        // exact pixels of the image — the sack graphic is small relative
        // to a real fingertip/cursor-precision drop, and this also keeps
        // the drop forgiving if the sack image's own box is still small
        // right as it finishes loading rather than needing an exact hit.
        const DROP_MARGIN = 20;
        const sackBox = sack.getBoundingClientRect();
        const droppedOverSack = e.clientX >= sackBox.left - DROP_MARGIN && e.clientX <= sackBox.right + DROP_MARGIN
          && e.clientY >= sackBox.top - DROP_MARGIN && e.clientY <= sackBox.bottom + DROP_MARGIN;
        if (droppedOverSack) {
          collected = true;
          item.classList.add('collected');
          remaining -= 1;
          if (remaining <= 0) {
            setTimeout(onComplete, 400);
          }
        } else {
          item.classList.add('returning');
          setPosition(spot.left, spot.top);
          setTimeout(() => item.classList.remove('returning'), 260);
        }
      });
      item.addEventListener('pointercancel', () => { dragging = false; });

      stage.appendChild(item);
    });

    slot.appendChild(stage);
  }

  // Scene 8 ("Your Journey Continues") — the boat dock is the backdrop,
  // the ticket(s) sit over it and flash to draw the eye, per Chef's
  // "appear flashing so the player clicks on them" note. This is a tap,
  // not a drag — clicking a ticket makes it vanish. Once every ticket on
  // this scene has been clicked (mechanicData.ticketCount of them, all
  // the same art, placed at their own spot), the button appears.
  function buildFlashTicketsMechanic(slot, scene, onComplete) {
    const mechanicData = scene.mechanicData || {};
    const ticketCount = mechanicData.ticketCount || 1;

    const stage = document.createElement('div');
    stage.className = 'aurion-tickets-stage';

    if (mechanicData.boatdock) {
      const dock = document.createElement('img');
      dock.src = resolveAssetUrl(mechanicData.boatdock);
      dock.alt = '';
      dock.className = 'aurion-tickets-dock';
      stage.appendChild(dock);
    }

    // Two spread-out spots over the dock art so two tickets don't sit on
    // top of each other; a third/fourth spot is here too in case
    // ticketCount is ever raised later, but only core-02's two are used.
    // mechanicData.ticket is one graphic showing both tickets together
    // (Chef's note: "the image of tickets shows 'two tickets' so you
    // only need to add one") — ticketCount is 1 in core-02.json, so
    // only TICKET_SPOTS[0] is actually used; the rest stay here only in
    // case ticketCount is ever raised again later. Centered on the
    // dock/boat area so it's the obvious thing to tap.
    const TICKET_SPOTS = [
      { left: 55, top: 46 },
      { left: 68, top: 34 },
      { left: 50, top: 55 },
      { left: 20, top: 30 }
    ];

    let remaining = ticketCount;
    for (let i = 0; i < ticketCount; i++) {
      const spot = TICKET_SPOTS[i % TICKET_SPOTS.length];
      const ticket = document.createElement('button');
      ticket.className = 'aurion-ticket-item';
      ticket.style.left = spot.left + '%';
      ticket.style.top = spot.top + '%';
      if (mechanicData.ticket) {
        ticket.style.backgroundImage = `url('${resolveAssetUrl(mechanicData.ticket)}')`;
      }
      ticket.setAttribute('aria-label', 'Click this ticket');
      ticket.addEventListener('click', () => {
        if (ticket.classList.contains('collected')) return;
        ticket.classList.add('collected');
        remaining -= 1;
        if (remaining <= 0) {
          setTimeout(onComplete, 400);
        }
      });
      stage.appendChild(ticket);
    }

    slot.appendChild(stage);
  }

  // Scene 3 ("Choose Your Gear") — top row is the real choice (thermos,
  // backpack, poles, binoculars), bottom row is the pirates, decorative
  // only, never clickable. Reuses the .aurion-sort-board/.aurion-sort-tile
  // grid classes — same 4-column grid naturally gives two rows of four.
  // Picking a gear item reveals the button immediately, a simple "one
  // click, done" pattern. Cloned from core-01's identical mechanic — same
  // behavior, this game's own copy.
  function buildGearMechanic(slot, scene, onComplete) {
    const gear = (scene.mechanicData && scene.mechanicData.gear) || {};
    const pirates = (scene.mechanicData && scene.mechanicData.pirates) || [];
    let chosen = false;

    const stage = document.createElement('div');
    stage.className = 'aurion-sort-stage';
    const board = document.createElement('div');
    board.className = 'aurion-sort-board aurion-gear-board';

    // Gear item i and pirate i are a matched pair (gear1/pirate1,
    // gear2/pirate2, etc — the config's own array order), wrapped together
    // in one .aurion-gear-pair container so gear sits directly above its
    // pirate as a single unit rather than two independent grid tiles that
    // only happened to land in the same column.
    const gearEntries = Object.entries(gear);
    gearEntries.forEach(([value, imageUrl], i) => {
      const pair = document.createElement('div');
      pair.className = 'aurion-gear-pair';

      const tile = document.createElement('button');
      tile.className = 'aurion-sort-tile aurion-gear-tile';
      if (imageUrl) tile.style.backgroundImage = `url('${resolveAssetUrl(imageUrl)}')`;
      tile.addEventListener('click', () => {
        if (chosen) return;
        chosen = true;
        tile.classList.add('opened');
        board.querySelectorAll('.aurion-gear-tile').forEach(t => { if (t !== tile) t.classList.add('dim'); });
        // Not scored — same as core-01, this pick is part of the story/
        // journey, same as the pirates beside it, not what decides the
        // envelope reveal. Captured here (not scored, just remembered) so
        // Scene 4's pirate-walk mechanic shows the SAME pirate the player
        // just picked, not a hardcoded one.
        chosenGearPirateImage = pirates[i];
        onComplete();
      });
      pair.appendChild(tile);

      const pirateUrl = pirates[i];
      if (pirateUrl) {
        const pirateTile = document.createElement('div');
        pirateTile.className = 'aurion-sort-tile aurion-pirate-tile dim';
        if (needsFlip(pirateUrl)) pirateTile.classList.add('aurion-flip-x');
        pirateTile.style.backgroundImage = `url('${resolveAssetUrl(pirateUrl)}')`;
        pair.appendChild(pirateTile);
      }

      board.appendChild(pair);
    });

    stage.appendChild(board);
    slot.appendChild(stage);
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
    const entries = Object.entries(envelopes);

    const stage = document.createElement('div');
    stage.className = 'aurion-sort-stage';
    const board = document.createElement('div');
    board.className = 'aurion-sort-board aurion-envelope-board';
    const popup = document.createElement('div');
    popup.className = 'aurion-reveal-popup';

    const tiles = [];
    let opened = false;
    let flashIndex = -1;
    let flashTimer = null;

    // Fairly fast, left-to-right, looping — "a tiny moment of urgency
    // without turning the thing into a stressful game" (Chef's own
    // phrasing). 350ms per envelope is quick enough to read as a
    // deliberate sweep, not so quick it's just a flicker.
    const FLASH_STEP_MS = 350;

    function stepFlash() {
      if (opened) return;
      if (flashIndex >= 0 && tiles[flashIndex]) tiles[flashIndex].classList.remove('flashing');
      flashIndex = (flashIndex + 1) % tiles.length;
      tiles[flashIndex].classList.add('flashing');
    }

    function stopFlashing() {
      if (flashTimer) {
        clearInterval(flashTimer);
        flashTimer = null;
      }
      tiles.forEach(t => t.classList.remove('flashing'));
    }

    entries.forEach(([value, imageUrl]) => {
      const tile = document.createElement('button');
      tile.className = 'aurion-sort-tile aurion-reveal-tile aurion-envelope-tile';
      if (imageUrl) tile.style.backgroundImage = `url('${resolveAssetUrl(imageUrl)}')`;

      tile.addEventListener('click', () => {
        if (opened) return;
        opened = true;
        stopFlashing();
        tile.classList.add('opened');
        tiles.forEach(t => { if (t !== tile) t.disabled = true; });
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

        const wordList = document.createElement('ul');
        wordList.className = 'aurion-reveal-word-list';
        (msg.words || []).forEach(word => {
          const li = document.createElement('li');
          li.textContent = word;
          wordList.appendChild(li);
        });

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

        popup.append(title, wordList, closeBtn);
      });

      tiles.push(tile);
      board.appendChild(tile);
    });

    if (tiles.length) {
      stepFlash();
      flashTimer = setInterval(stepFlash, FLASH_STEP_MS);
    }

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
