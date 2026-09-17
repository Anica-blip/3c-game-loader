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

// The four Core Values this challenge tracks a running score for, revealed
// as one envelope in the final scene (whichever value scored highest).
// Text is Chef's own, from the production notes — identical wording to
// core-01's, cloned here rather than shared by reference.
const CORE_VALUE_MESSAGES = {
  Courage: {
    title: '🟠 COURAGE',
    subtitle: 'One of your guiding values',
    body: "Your choices suggest that courage may be one of the values that guides you. You seem willing to move forward even when the path isn't completely clear. For you, courage may not mean having no fear. It may mean being willing to act despite it."
  },
  Independence: {
    title: '🟡 INDEPENDENCE',
    subtitle: 'One of your guiding values',
    body: "Your choices suggest that independence may be important to you. You seem to value making your own way and trusting your own judgement. Independence may mean having the freedom to choose your direction rather than simply following the path already laid out."
  },
  Connection: {
    title: '🔵 CONNECTION',
    subtitle: 'One of your guiding values',
    body: "Your choices suggest that connection may be one of the values that matters to you. Your choices show that the people around you can matter when deciding how you move forward. Connection may mean support, loyalty, belonging or knowing that the journey doesn't always have to be travelled alone."
  },
  Integrity: {
    title: '🟢 INTEGRITY',
    subtitle: 'One of your guiding values',
    body: "Your choices suggest that integrity may be an important value in the way you approach things. You seem to pay attention to what feels right for you, rather than simply choosing what looks easiest or most appealing. Integrity can mean making choices that stay true to what you believe, even when nobody else is watching."
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

  // Core Values challenge only: which envelope/message the player sees at
  // the end. This plumbing (coreValueScores/addCoreValueScore/
  // leadingCoreValue) is cloned in because the envelope-reveal scene needs
  // leadingCoreValue() to pick a winner — but unlike core-01, THIS file has
  // no mechanic wired up yet that ever calls addCoreValueScore (core-01's
  // scoring mechanic was the maze, which this game doesn't have). Until a
  // scoring mechanic is built for core-02 — part of the still-pending
  // mechanics discussion — every score stays at 0, which means
  // leadingCoreValue() will fall back to picking at random among the tied
  // four. This is expected right now, not a bug: flagging it here plainly
  // so it isn't a surprise the first time this scene gets tested.
  const coreValueScores = { Courage: 0, Independence: 0, Connection: 0, Integrity: 0 };
  function addCoreValueScore(value, points) {
    if (Object.prototype.hasOwnProperty.call(coreValueScores, value)) {
      coreValueScores[value] += points;
    }
  }
  function leadingCoreValue() {
    let topScore = -Infinity;
    Object.values(coreValueScores).forEach(score => {
      if (score > topScore) topScore = score;
    });
    const leaders = Object.keys(coreValueScores).filter(key => coreValueScores[key] === topScore);
    return leaders[Math.floor(Math.random() * leaders.length)];
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
      dragging = true;
      companion.classList.remove('returning');
      companion.setPointerCapture(e.pointerId);
    });
    companion.addEventListener('pointermove', (e) => {
      if (!dragging || placed) return;
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
  // core-01. scene.mechanicData.road is the road/mountain background. The
  // companion the player chose appears draggable on top of it; the
  // player drags it along until it's close enough to the mountain (the
  // right-hand end of the path), at which point it fades out and the
  // button appears. Built with Pointer Events (covers mouse, touch and
  // pen with one set of listeners) rather than a full maze-style
  // constrained path — this is a straight left-to-right drag, not a
  // walled maze, so it doesn't need that machinery.
  //
  // The "close enough to the mountain" threshold (85% of the stage's
  // width, ARRIVAL_PERCENT below) is a first-pass guess, same caveat as
  // every other placeholder position in this file — tune it once the
  // real road/mountain art is in place and Chef can see where the
  // mountain actually sits.
  function buildRoadDragMechanic(slot, scene, onComplete) {
    const mechanicData = scene.mechanicData || {};
    const ARRIVAL_PERCENT = 85;
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
    companion.setAttribute('aria-label', 'Drag your companion along the trail');
    if (chosenCompanionImage) {
      companion.style.backgroundImage = `url('${resolveAssetUrl(chosenCompanionImage)}')`;
    }
    companion.style.left = '6%';
    stage.appendChild(companion);

    function moveTo(clientX) {
      const rect = stage.getBoundingClientRect();
      if (!rect.width) return;
      const percent = Math.max(6, Math.min(96, ((clientX - rect.left) / rect.width) * 100));
      companion.style.left = percent + '%';
      if (percent >= ARRIVAL_PERCENT && !done) {
        done = true;
        companion.classList.add('arrived');
        // Small pause so the "arrived" fade is actually seen before the
        // button appears, rather than the two happening in the same frame.
        setTimeout(onComplete, 500);
      }
    }

    companion.addEventListener('pointerdown', (e) => {
      if (done) return;
      dragging = true;
      companion.setPointerCapture(e.pointerId);
    });
    companion.addEventListener('pointermove', (e) => {
      if (!dragging || done) return;
      moveTo(e.clientX);
    });
    companion.addEventListener('pointerup', () => { dragging = false; });
    companion.addEventListener('pointercancel', () => { dragging = false; });

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

  // Scene 9 ("Let's Check How Far You Got") — four envelopes on screen,
  // but only the one matching whichever Core Value scored highest is
  // actually openable (a soft glow, no color or label difference from
  // the other three — the reveal is supposed to come as a surprise, not
  // be guessable from the artwork). The other three sit there as decoys.
  // Opening it, reading the message and closing the card: the voice line
  // only starts once the card is closed, and the button waits for that
  // voice line to finish. Cloned from core-01's identical mechanic — same
  // behavior, this game's own copy. See the header note above
  // coreValueScores: nothing in THIS file scores yet, so winner is
  // currently a random pick among the tied four until a scoring mechanic
  // is built for core-02.
  function buildEnvelopeMechanic(slot, scene, onComplete) {
    const envelopes = (scene.mechanicData && scene.mechanicData.envelopes) || {};
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
        // The board sits directly behind the popup's glass card — when the
        // winning envelope isn't one of the two outer tiles, its own
        // artwork was showing straight through the popup's translucent
        // background and making the message hard to read. Dimming the
        // whole board while the card is open (and undimming on close)
        // clears that interference regardless of which tile opened it.
        board.classList.add('dimmed');

        popup.innerHTML = '';
        popup.classList.add('open');
        const msg = CORE_VALUE_MESSAGES[value];

        const title = document.createElement('h2');
        title.textContent = msg.title;
        const subtitle = document.createElement('p');
        subtitle.className = 'aurion-reveal-subtitle';
        subtitle.textContent = msg.subtitle;
        const body = document.createElement('p');
        body.className = 'aurion-reveal-body';
        body.textContent = msg.body;

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

        popup.append(title, subtitle, body, closeBtn);
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
