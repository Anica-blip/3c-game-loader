// Repo path: games/aurion/games/aurion.js

// This game's word bank for Scene 5 — 30 words, each tagged with its
// hidden category. The player never sees the category, only the word.
// Specific to goal-01; a future themed week with a different word set
// would need this made admin-editable rather than hardcoded here.
const WORD_BANK = [
  { word: 'Exercise', category: 'BODY' },
  { word: 'Travel', category: 'LIFE' },
  { word: 'Save More', category: 'WORK' },
  { word: 'Making Things', category: 'CREATE' },
  { word: 'Call Family', category: 'PEOPLE' },
  { word: 'Learn a skill', category: 'YOU' },
  { word: 'Declutter', category: 'HOME' },
  { word: 'Find love', category: 'PEOPLE' },
  { word: 'Eat healthier', category: 'BODY' },
  { word: 'Give back', category: 'GIVE' },
  { word: 'Start a business', category: 'WORK' },
  { word: 'Read more', category: 'YOU' },
  { word: 'More adventure', category: 'LIFE' },
  { word: 'Be kinder', category: 'PEOPLE' },
  { word: 'Improve home', category: 'HOME' },
  { word: 'Support a cause', category: 'GIVE' },
  { word: 'Sleep better', category: 'BODY' },
  { word: 'Change career', category: 'WORK' },
  { word: 'Write something', category: 'CREATE' },
  { word: 'Make friends', category: 'PEOPLE' },
  { word: 'Try something', category: 'YOU' },
  { word: 'Earn more', category: 'WORK' },
  { word: 'Take a break', category: 'BODY' },
  { word: 'Help others', category: 'GIVE' },
  { word: 'Build confidence', category: 'YOU' },
  { word: 'Start creating', category: 'CREATE' },
  { word: 'See a new place', category: 'LIFE' },
  { word: 'Organise life', category: 'HOME' },
  { word: 'Listen more', category: 'PEOPLE' },
  { word: 'Reduce stress', category: 'BODY' }
];

// The eight reveal messages — Chef's final wording, built directly into the
// engine since this text doesn't change per theme.
const CATEGORY_MESSAGES = {
  YOU: {
    title: '🧠 YOU',
    subtitle: 'Personal Growth',
    body: "Your choices point towards YOU learning, developing, understanding yourself or becoming more capable. This may reveal a desire to grow, a need to invest more attention in yourself, or a decision that something you've been putting off is ready for a closer look. Growth starts when curiosity turns into action."
  },
  PEOPLE: {
    title: '❤️ PEOPLE',
    subtitle: 'Family & Relationships',
    body: "Your choices point towards PEOPLE connection, family, friendship, communication or relationships. This may reveal a need for more connection, a desire to strengthen an important relationship, or a decision to give someone, including yourself, a little more time and attention. Sometimes the goal isn't about doing more; it's about being more present."
  },
  BODY: {
    title: '🏃 BODY',
    subtitle: 'Health & Wellbeing',
    body: "Your choices point towards YOU + BODY energy, movement, food, rest and feeling better in yourself. This may reveal a need to look after your energy, a desire to feel stronger or healthier, or a decision to make one small change that supports the way you want to live. Your body is part of the journey, not something to deal with later."
  },
  WORK: {
    title: '💼 WORK',
    subtitle: 'Career & Finances',
    body: "Your choices point towards WORK career, money, projects, achievement or creating greater independence. This may reveal a desire for progress, a need for greater security or direction, or a decision to start moving towards something you've been considering. A bigger change often begins with one practical move."
  },
  LIFE: {
    title: '🌍 LIFE',
    subtitle: 'Experiences & Adventure',
    body: "Your choices point towards LIFE travel, adventure, exploration, hobbies, fun and experiences. This may reveal a desire for something new, a need for more variety or excitement, or a decision to stop waiting for the “right time” to experience something you've been wanting to do. Life isn't only about what you accomplish; it's also about what you experience."
  },
  HOME: {
    title: '🏠 HOME',
    subtitle: 'Home & Environment',
    body: "Your choices point towards LIFE AROUND YOU your home, surroundings, routines and the spaces in which you spend your time. This may reveal a need for greater order, comfort or simplicity, a desire to create an environment that works better for you, or a decision to change something around you so everyday life feels easier. Sometimes changing the space around you changes how you move through it."
  },
  CREATE: {
    title: '🎨 CREATE',
    subtitle: 'Creativity & Projects',
    body: "Your choices point towards CREATION making, writing, building, designing, experimenting or bringing an idea into the world. This may reveal a desire to create something of your own, a need for an outlet, or a decision to stop keeping an idea in your head and give it somewhere to go. Ideas become real when you give them a place to begin."
  },
  GIVE: {
    title: '🌱 GIVE',
    subtitle: 'Community & Giving',
    body: "Your choices point towards CONTRIBUTION helping, teaching, supporting, volunteering or making a difference beyond yourself. This may reveal a desire to be useful, a need for greater connection to something meaningful, or a decision to share some of what you have with others. Sometimes progress feels different when it creates value beyond yourself."
  }
};

// Any image/background field can be given as either a full Cloudflare URL
// or just a bare filename meant to live in this game's own assets/ folder.
// This is what actually tells them apart — if it isn't already a full
// address, treat it as a repo-relative path automatically.
function resolveAssetUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url) || url.startsWith('assets/') || url.startsWith('/')) {
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
// is actually moving through scenes. This was previously missing every
// mechanic-specific image (door open/reveal art, all 8 category tiles used
// by both the sorting and reveal-cards scenes, the spin wheel face, and
// every button graphic) — those were only ever fetched the first time their
// scene actually rendered, which is exactly the kind of lag Scenes 3, 6, 7
// and 8 (the heaviest ones) would have shown.
function preloadAssets(config) {
  const urls = new Set();
  const add = (url) => { if (url) urls.add(resolveAssetUrl(url)); };

  if (config.background && config.background.url && config.background.type !== 'video') {
    add(config.background.url);
  }
  (config.decisions || []).forEach(d => {
    if (d.background && d.background.url && d.background.type !== 'video') add(d.background.url);
    if (d.image && d.image.url) add(d.image.url);
    if (d.overlayImage && d.overlayImage.url) add(d.overlayImage.url);

    (d.buttons || []).forEach(btn => { if (btn.image) add(btn.image); });

    const mechanicData = d.mechanicData || {};
    if (d.mechanic === 'door') {
      add(mechanicData.openImage);
      add(mechanicData.revealImage);
    }
    if (d.mechanic === 'spin-wheel') {
      add(mechanicData.wheelImage);
    }
    if (d.mechanic === 'sorting' || d.mechanic === 'reveal-cards') {
      Object.values(mechanicData.categoryImages || {}).forEach(add);
    }
  });
  (config.characterImages || []).forEach(img => { if (img.url) add(img.url); });

  // Used on every scene but the last, not tied to any one decision
  add('goal.01-exitsymbol.png');

  const loadPromises = Array.from(urls).map(url => new Promise(resolve => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = resolve;
    img.src = url;
  }));

  const timeout = new Promise(resolve => setTimeout(resolve, 8000));
  return Promise.race([Promise.all(loadPromises), timeout]);
}

export function startGame(config, container) {
  let sceneIndex = 0;
  let ambientAudio = null;
  let selectedWords = []; // the 5 words chosen in Scene 5, carried forward to Scene 6
  let categoryCounts = {}; // filled in once Scene 6's sorting is complete, used by Scene 8

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
  exitBtn.style.backgroundImage = `url('${resolveAssetUrl('goal.01-exitsymbol.png')}')`;
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
  preloadAssets(config).then(() => {
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

    wrap.append(hourglass, greeting, msg);
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
    if (scene.mechanic === 'sorting' || scene.mechanic === 'reveal-cards' || scene.mechanic === 'word-picker') {
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
    // applies at every screen width, not just mobile — same as the
    // landing/consent version of this already did.
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

    // Title stays exactly where it always has — pinned at the top,
    // appended straight to the wrap, never part of the centered block
    // below. Only the subtitle + description move as their own centered
    // unit within the space between the title and the button (which
    // keeps anchoring to the bottom via .aurion-button-row's own
    // margin-top: auto, untouched by any of this).
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
    wrap.appendChild(textBlock);
    if (introOverlayImg) {
      textBlock.appendChild(introOverlayImg);
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

    // Reserved space for this scene's special mechanic (door, word picker,
    // sorting, wheel, reveal cards) — filled in by dedicated code per scene.
    const mechanicSlot = document.createElement('div');
    mechanicSlot.className = 'aurion-mechanic-slot';
    wrap.appendChild(mechanicSlot);

    let mechanicGatesButton = false;

    if (scene.mechanic === 'door' && scene.mechanicData) {
      mechanicGatesButton = true;
      buildDoorMechanic(mechanicSlot, scene, revealButtons);
    }

    if (scene.mechanic === 'word-picker') {
      mechanicGatesButton = true;
      buildWordPickerMechanic(mechanicSlot, revealButtons);
    }

    if (scene.mechanic === 'sorting') {
      mechanicGatesButton = true;
      buildSortingMechanic(mechanicSlot, scene, revealButtons);
    }

    if (scene.mechanic === 'spin-wheel') {
      mechanicGatesButton = true;
      buildSpinWheelMechanic(mechanicSlot, scene, revealButtons);
    }

    if (scene.mechanic === 'reveal-cards') {
      mechanicGatesButton = true;
      buildRevealMechanic(mechanicSlot, scene, revealButtons);
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
      // Text goes in its own inner span (not a raw text node) so
      // style.css can give the label a narrower max-width than the
      // button itself — that's what lets long labels wrap to a second
      // line without shrinking the whole pill graphic to match.
      const label = document.createElement('span');
      label.className = 'aurion-btn-label';
      label.textContent = btn.text || 'Continue';
      // Optional per-button fine-tune, set in the scene's JSON config
      // (e.g. goals.01.json) as "textNudge": -3 — a number of pixels,
      // positive pushes the label down, negative pulls it up. Only needed
      // when one specific button's text still doesn't land right after
      // the automatic wrapped-label nudge below; it's an inline style, so
      // it always wins over that automatic class regardless of which
      // shows up in the CSS first. Leave it off (most buttons) to use the
      // automatic behavior untouched.
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

    // Button timing: a mechanic that gates its own completion (like the
    // door) controls reveal itself. Otherwise, a scene with its own voice
    // line waits for that voice to finish; everything else shows its
    // button right away.
    if (mechanicGatesButton) {
      // buildDoorMechanic (or whichever mechanic) calls revealButtons itself
    } else if (scene.soundEffect) {
      // Was 1000ms — landing on the page and hearing Aurion start talking
      // immediately didn't leave any time to actually read the text first.
      // 2000ms gives a beat to read before the voice line starts.
      setTimeout(() => {
        const voice = new Audio(scene.soundEffect);
        voice.addEventListener('ended', revealButtons);
        voice.play().catch(revealButtons);
      }, 2000);
    } else {
      revealButtons();
    }
  }

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

  function buildWordPickerMechanic(slot, onComplete) {
    const MAX_PICKS = 5;
    const picked = [];

    // Counter is 5 stars (matching the summary popup's own stars) instead
    // of a "0 of 5" number, sitting in its own row above the grid rather
    // than beside it.
    const pickerWrap = document.createElement('div');
    pickerWrap.className = 'aurion-word-picker-wrap';

    const counter = document.createElement('div');
    counter.className = 'aurion-word-counter';
    const counterStars = [];
    for (let i = 0; i < MAX_PICKS; i++) {
      const star = document.createElement('span');
      star.className = 'aurion-word-counter-star';
      star.textContent = '★';
      counter.appendChild(star);
      counterStars.push(star);
    }

    const grid = document.createElement('div');
    grid.className = 'aurion-word-grid';

    const popup = document.createElement('div');
    popup.className = 'aurion-word-popup';

    WORD_BANK.forEach(entry => {
      const card = document.createElement('button');
      card.className = 'aurion-word-card';
      card.textContent = entry.word;
      card.addEventListener('click', () => {
        if (card.classList.contains('picked')) return;
        if (picked.length >= MAX_PICKS) return;

        card.classList.add('picked');
        picked.push(entry);
        counterStars[picked.length - 1].classList.add('filled');

        if (picked.length === MAX_PICKS) {
          selectedWords = picked.slice();
          showSummary();
        }
      });
      grid.appendChild(card);
    });

    function showSummary() {
      popup.innerHTML = '';
      popup.classList.add('open');

      const title = document.createElement('h2');
      title.textContent = 'Your List Of Five';

      const stars = document.createElement('div');
      stars.className = 'aurion-word-stars';
      for (let i = 0; i < MAX_PICKS; i++) {
        const star = document.createElement('span');
        star.textContent = '★';
        stars.appendChild(star);
      }

      const list = document.createElement('ul');
      list.className = 'aurion-word-summary-list';
      picked.forEach(entry => {
        const li = document.createElement('li');
        li.textContent = entry.word;
        list.appendChild(li);
      });

      const closeBtn = document.createElement('button');
      closeBtn.className = 'aurion-btn';
      closeBtn.textContent = 'Close';
      closeBtn.addEventListener('click', () => {
        popup.classList.remove('open');
        onComplete();
      });

      popup.append(title, stars, list, closeBtn);
    }

    pickerWrap.append(counter, grid);
    slot.append(pickerWrap, popup);
  }

  function buildSortingMechanic(slot, scene, onComplete) {
    const categoryImages = (scene.mechanicData && scene.mechanicData.categoryImages) || {};
    const categories = ['YOU', 'PEOPLE', 'BODY', 'WORK', 'LIFE', 'HOME', 'CREATE', 'GIVE'];

    // The board is the fixed point of this scene — built once, at full
    // size, and never touched again by anything below. The word queue is a
    // small floating card that overlays it (see .aurion-drag-card in
    // style.css: position: absolute, anchored to .aurion-sort-stage) so it
    // can never force the board to share width or shrink.
    const stage = document.createElement('div');
    stage.className = 'aurion-sort-stage';

    const board = document.createElement('div');
    board.className = 'aurion-sort-board';
    const tiles = {};
    categories.forEach(cat => {
      const tile = document.createElement('div');
      tile.className = 'aurion-sort-tile';
      tile.dataset.category = cat;
      if (categoryImages[cat]) {
        tile.style.backgroundImage = `url('${resolveAssetUrl(categoryImages[cat])}')`;
      }
      const countBadge = document.createElement('span');
      countBadge.className = 'aurion-sort-count';
      countBadge.textContent = '0';
      tile.appendChild(countBadge);
      board.appendChild(tile);
      tiles[cat] = { el: tile, count: 0, badge: countBadge };
    });

    // One word at a time instead of all 5 in a permanent tray: the card
    // closes the moment a word is placed correctly, then reopens with the
    // next word, until the queue is empty. A wrong drop just snaps the chip
    // back — the card stays open and doesn't advance.
    const queue = selectedWords.slice();
    let placedCount = 0;

    const dragCard = document.createElement('div');
    dragCard.className = 'aurion-drag-card';

    function showNextChip() {
      dragCard.innerHTML = '';
      if (queue.length === 0) return;
      dragCard.classList.add('open');

      const entry = queue[0];
      const label = document.createElement('div');
      label.className = 'aurion-drag-card-label';
      label.textContent = 'Drag This Word';

      const chip = document.createElement('div');
      chip.className = 'aurion-sort-chip';
      chip.textContent = entry.word;

      dragCard.append(label, chip);
      wireChipDrag(chip, entry);
    }

    function wireChipDrag(chip, entry) {
      let startX = 0, startY = 0, offsetX = 0, offsetY = 0, dragging = false;

      chip.addEventListener('pointerdown', (e) => {
        dragging = true;
        chip.setPointerCapture(e.pointerId);
        chip.classList.add('dragging');
        startX = e.clientX;
        startY = e.clientY;
      });

      chip.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        offsetX = e.clientX - startX;
        offsetY = e.clientY - startY;
        chip.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      });

      chip.addEventListener('pointerup', (e) => {
        if (!dragging) return;
        dragging = false;
        chip.classList.remove('dragging');

        let landedTile = null;
        for (const cat of categories) {
          const rect = tiles[cat].el.getBoundingClientRect();
          if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
            landedTile = cat;
            break;
          }
        }

        if (landedTile === entry.category) {
          tiles[landedTile].el.classList.add('lit');
          tiles[landedTile].count += 1;
          tiles[landedTile].badge.textContent = String(tiles[landedTile].count);
          categoryCounts[landedTile] = (categoryCounts[landedTile] || 0) + 1;
          placedCount += 1;

          dragCard.classList.remove('open');
          queue.shift();

          if (placedCount === selectedWords.length) {
            setTimeout(onComplete, 300);
          } else {
            setTimeout(showNextChip, 400);
          }
        } else {
          chip.style.transform = 'translate(0, 0)';
        }
      });
    }

    stage.append(board, dragCard);
    slot.appendChild(stage);
    showNextChip();
  }

  function buildSpinWheelMechanic(slot, scene, onComplete) {
    const stage = document.createElement('div');
    stage.className = 'aurion-wheel-stage';

    const pointer = document.createElement('div');
    pointer.className = 'aurion-wheel-pointer';

    const wheel = document.createElement('div');
    wheel.className = 'aurion-wheel';
    const wheelImage = scene.mechanicData && scene.mechanicData.wheelImage;
    if (wheelImage) {
      wheel.style.backgroundImage = `url('${resolveAssetUrl(wheelImage)}')`;
    } else {
      wheel.style.background = 'conic-gradient(rgba(59,42,94,0.9) 0deg 45deg, rgba(79,209,232,0.55) 45deg 90deg, rgba(240,180,41,0.55) 90deg 135deg, rgba(59,42,94,0.9) 135deg 180deg, rgba(79,209,232,0.55) 180deg 225deg, rgba(240,180,41,0.55) 225deg 270deg, rgba(59,42,94,0.9) 270deg 315deg, rgba(79,209,232,0.55) 315deg 360deg)';
    }

    let spun = false;
    stage.addEventListener('click', () => {
      if (spun) return;
      spun = true;
      const extraSpins = 5 + Math.floor(Math.random() * 3);
      const randomOffset = Math.floor(Math.random() * 360);
      wheel.style.transform = `rotate(${extraSpins * 360 + randomOffset}deg)`;
      setTimeout(onComplete, 4600);
    });

    stage.append(pointer, wheel);
    slot.appendChild(stage);

    // Landing narration for this scene — plays once, 1 second after the
    // player arrives (moved here from Scene 6 per Chef's call: it reads
    // better once the wheel is in front of them). Independent of the spin
    // itself: the wheel is already clickable while it plays, nothing blocks
    // on it, and the forward button's own timing is untouched — it still
    // only appears once the spin animation finishes, via onComplete above.
    if (scene.soundEffect) {
      setTimeout(() => {
        new Audio(scene.soundEffect).play().catch(() => {});
      }, 1000);
    }
  }

  function buildRevealMechanic(slot, scene, onComplete) {
    const categoryImages = (scene.mechanicData && scene.mechanicData.categoryImages) || {};
    const categories = ['YOU', 'PEOPLE', 'BODY', 'WORK', 'LIFE', 'HOME', 'CREATE', 'GIVE'];
    const chosenCategories = categories.filter(cat => categoryCounts[cat] > 0);
    let openedCount = 0;

    // Same .aurion-sort-stage + .aurion-sort-board as Scene 6, so the grid
    // is identical in both scenes. The message popup floats above it the
    // same way the drag card does in Scene 6 — an overlay, not a sibling
    // that competes with the board for width.
    const stage = document.createElement('div');
    stage.className = 'aurion-sort-stage';

    const board = document.createElement('div');
    board.className = 'aurion-sort-board';

    const popup = document.createElement('div');
    popup.className = 'aurion-reveal-popup';

    // Reverted to setting the image directly as this tile's own
    // background (same as Scene 6's sorting tiles) instead of a separate
    // inner .aurion-reveal-art element. The split-layer "back cover"
    // version depended on aurion.js and style.css always shipping in sync
    // — the moment they were even briefly out of step, the tile had
    // nowhere for the art to render and showed as a blank color block,
    // which is exactly what happened on the live page. One background
    // image, one file each side, nothing that can fall out of sync.
    categories.forEach(cat => {
      const tile = document.createElement('button');
      tile.className = 'aurion-sort-tile aurion-reveal-tile';
      if (categoryImages[cat]) {
        tile.style.backgroundImage = `url('${resolveAssetUrl(categoryImages[cat])}')`;
      }

      const isChosen = chosenCategories.includes(cat);
      if (!isChosen) {
        tile.classList.add('dim');
        tile.disabled = true;
      } else {
        tile.classList.add('flashing');
      }

      tile.addEventListener('click', () => {
        if (!isChosen || tile.classList.contains('opened')) return;

        popup.innerHTML = '';
        popup.classList.add('open');
        const msg = CATEGORY_MESSAGES[cat];

        const title = document.createElement('h2');
        title.textContent = msg.title;

        const subtitle = document.createElement('p');
        subtitle.className = 'aurion-reveal-subtitle';
        subtitle.textContent = msg.subtitle;

        const body = document.createElement('p');
        body.className = 'aurion-reveal-body';
        body.textContent = msg.body;

        // Whether THIS card is the last one, decided the moment it's opened
        // (not later) — that's what openedCount reaching the total actually
        // means. The trigger itself, though, waits for the close click
        // below: per Chef's spec, the voice line starts only once the
        // player has actually read and closed the last card's message, not
        // the instant they open it.
        let isLastCard = false;
        if (!tile.classList.contains('opened')) {
          tile.classList.remove('flashing');
          tile.classList.add('opened');
          openedCount += 1;
          isLastCard = openedCount === chosenCategories.length;
        }

        const closeBtn = document.createElement('button');
        closeBtn.className = 'aurion-btn';
        closeBtn.textContent = 'Close';
        closeBtn.addEventListener('click', () => {
          popup.classList.remove('open');
          if (isLastCard) {
            // Voice starts only now that the last card's message has been
            // read and closed; forward button waits for it to end. Falls
            // straight through to onComplete if this scene has no
            // soundEffect set, so a future themed game without narration
            // still works as before.
            if (scene.soundEffect) {
              const voice = new Audio(scene.soundEffect);
              voice.addEventListener('ended', onComplete);
              voice.play().catch(onComplete);
            } else {
              onComplete();
            }
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
