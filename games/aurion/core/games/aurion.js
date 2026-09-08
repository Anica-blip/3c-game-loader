// Repo path: games/aurion/core/games/aurion.js

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

// The four Core Values this challenge tracks a running score for, built up
// across the gear scene, the maze scene, and the companion scene, then
// revealed as one envelope in the final scene (whichever value scored
// highest). Text is Chef's own, from the production notes.
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

// Scene 6's maze — hand-generated (not from an image asset), a true
// "perfect maze" (exactly one route between any two cells, no loops) on a
// 9x9 grid, walls drawn in the same purple Chef's own reference maze used.
// Four entrances sit on four different edges, each already linked (in code
// only, never shown visually) to one Core Value, ordered by how long that
// entrance's actual route to the center is — Chef's instruction was to let
// difficulty do the sorting instead of a visible color/label giving it
// away.
// The maze geometry itself (walls, cell layout, which physical edge is
// hardest/easiest) is unchanged from the last pass: top (N) is still the
// easiest route in at 12 moves, east (E) 20, south (S) 42, west (W) the
// hardest at 72 — that part Chef confirmed testing correctly. What
// changed here is only WHICH Core Value is attached to which entrance,
// per Chef's own read of the values: Courage is quick and decisive
// rather than about grinding through difficulty, so it now sits on the
// easiest (N) route; Integrity is the careful, examine-every-detail
// temperament, so it now sits on the hardest (W) route. Connection
// (fairly quick, people-supported) takes the next-easiest (E, 20) and
// Independence (works it through alone, unhurried) takes the
// next-hardest (S, 42).
// Scoring locks in the moment the player's dot first crosses from an
// entrance cell into the maze — not which attempt eventually reaches the
// center, per Chef's "first entry, not other attempts" instruction (see
// buildMazeMechanic's scoreLocked flag, which now also survives the
// double-click "send the dot back and try another entrance" reset).
const MAZE_GRID_SIZE = 9;
const MAZE_CENTER = [4, 4];
const MAZE_ENTRANCES = {
  Courage: { cell: [0, 4], edgeDir: 'N' },
  Connection: { cell: [4, 8], edgeDir: 'E' },
  Independence: { cell: [8, 4], edgeDir: 'S' },
  Integrity: { cell: [4, 0], edgeDir: 'W' },
};

const MAZE_CELL_OPEN = {
  '0,0': ["S", "E"],
  '0,1': ["E", "W"],
  '0,2': ["S", "W"],
  '0,3': ["S", "E"],
  '0,4': ["E", "W"],
  '0,5': ["E", "W"],
  '0,6': ["E", "W"],
  '0,7': ["E", "W"],
  '0,8': ["S", "W"],
  '1,0': ["N", "S"],
  '1,1': ["S", "E"],
  '1,2': ["N", "W"],
  '1,3': ["N", "S"],
  '1,4': ["S", "E"],
  '1,5': ["S", "W"],
  '1,6': ["S", "E"],
  '1,7': ["S", "W"],
  '1,8': ["N", "S"],
  '2,0': ["N", "S"],
  '2,1': ["N", "E"],
  '2,2': ["S", "W"],
  '2,3': ["N", "E"],
  '2,4': ["N", "W"],
  '2,5': ["N", "S"],
  '2,6': ["N", "S"],
  '2,7': ["N", "S"],
  '2,8': ["N", "S"],
  '3,0': ["N", "S", "E"],
  '3,1': ["W"],
  '3,2': ["N", "S"],
  '3,3': ["S", "E"],
  '3,4': ["E", "W"],
  '3,5': ["N", "W"],
  '3,6': ["N", "S"],
  '3,7': ["N", "S"],
  '3,8': ["N", "S"],
  '4,0': ["N", "S"],
  '4,1': ["S", "E"],
  '4,2': ["N", "W"],
  '4,3': ["N", "E"],
  '4,4': ["W"],
  '4,5': ["S"],
  '4,6': ["N", "S"],
  '4,7': ["N", "S"],
  '4,8': ["N", "S"],
  '5,0': ["N", "S"],
  '5,1': ["N", "S"],
  '5,2': ["S", "E"],
  '5,3': ["E", "W"],
  '5,4': ["E", "W"],
  '5,5': ["N", "S", "W"],
  '5,6': ["N", "S"],
  '5,7': ["N", "S"],
  '5,8': ["N", "S"],
  '6,0': ["N", "S"],
  '6,1': ["N", "S"],
  '6,2': ["N", "S"],
  '6,3': ["S", "E"],
  '6,4': ["E", "W"],
  '6,5': ["N", "W"],
  '6,6': ["N", "S"],
  '6,7': ["N", "S"],
  '6,8': ["N", "S"],
  '7,0': ["N", "S"],
  '7,1': ["N", "S"],
  '7,2': ["N", "S"],
  '7,3': ["N", "S"],
  '7,4': ["S", "E"],
  '7,5': ["E", "W"],
  '7,6': ["N", "W"],
  '7,7': ["N", "S"],
  '7,8': ["N", "S"],
  '8,0': ["N"],
  '8,1': ["N", "E"],
  '8,2': ["N", "W"],
  '8,3': ["N", "E"],
  '8,4': ["N", "E", "W"],
  '8,5': ["E", "W"],
  '8,6': ["W"],
  '8,7': ["N", "E"],
  '8,8': ["N", "W"],
};

// Any image/background field can be given as either a full Cloudflare URL
// or just a bare filename meant to live in this game's own assets/ folder.
// This is what actually tells them apart — if it isn't already a full
// address, treat it as a repo-relative path automatically.
function resolveAssetUrl(url) {
  if (!url) return url;
  // A bare filename ("core-01.consent.png") is assumed to live in THIS
  // game's own assets/ folder (games/aurion/core/assets/) and gets that
  // prefix added automatically. Anything that already contains a "/" — a
  // full URL, an absolute path, or a relative path like
  // "../assets/goal-01.landing.png" reaching back into the shared Aurion
  // default assets one level up — is already a real path relative to this
  // game's own game.html and is used exactly as given, no prefix added.
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
// is actually moving through scenes. This was previously missing every
// mechanic-specific image (door open/reveal art, all 8 category tiles used
// by both the sorting and reveal-cards scenes, the spin wheel face, and
// every button graphic) — those were only ever fetched the first time their
// scene actually rendered, which is exactly the kind of lag Scenes 3, 6, 7
// and 8 (the heaviest ones) would have shown.
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
    if (d.mechanic === 'compass') {
      add(mechanicData.image);
    }
    if (d.mechanic === 'maze') {
      add(mechanicData.goalImage);
    }
    if (d.mechanic === 'gear-select') {
      Object.values(mechanicData.gear || {}).forEach(add);
      (mechanicData.pirates || []).forEach(add);
    }
    if (d.mechanic === 'companion-select') {
      Object.values(mechanicData.parrots || {}).forEach(add);
    }
    if (d.mechanic === 'key-grab') {
      add(mechanicData.image);
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
  // looping background video) was never part of this preload at all —
  // it only ever started downloading the moment its own scene rendered,
  // same cold-start symptom Maverick's ending video had at launch. Fixed
  // the same way that was: build the REAL <video> element now, off-
  // screen, and hand it back via preloadedVideos so renderScene() can
  // reparent this exact element later instead of creating a second one
  // with a fresh src — avoids depending on the CDN's cache headers
  // cooperating, since it's the literal same in-progress download either
  // way. Cloned in from the goals engine even though core-01.json has no
  // video field yet — the capability travels with the clone, not just
  // whatever the current config happens to use.
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
  // the race and defeat the point of preloading it. 45s matches the
  // ceiling already proven out on Maverick's own full-preload pattern.
  const timeout = new Promise(resolve => setTimeout(resolve, videoUrls.size ? 45000 : 8000));
  return Promise.race([Promise.all([...loadPromises, ...videoPromises]), timeout]);
}

export function startGame(config, container) {
  let sceneIndex = 0;
  let ambientAudio = null;
  const preloadedVideos = new Map(); // scene.video url -> the real preloaded <video> element, reused (not recreated) when that scene renders
  let selectedWords = []; // the 5 words chosen in Scene 5, carried forward to Scene 6
  let categoryCounts = {}; // filled in once Scene 6's sorting is complete, used by Scene 8
  // Core Values challenge only: running score across the gear, maze and
  // companion scenes, read back by the envelope-reveal scene at the end to
  // decide which single envelope/message the player sees. addCoreValueScore
  // is the only way anything writes to this — one place to look if a
  // scene's scoring ever needs adjusting.
  const coreValueScores = { Courage: 0, Independence: 0, Connection: 0, Integrity: 0 };
  function addCoreValueScore(value, points) {
    if (Object.prototype.hasOwnProperty.call(coreValueScores, value)) {
      coreValueScores[value] += points;
    }
  }
  // With only 3 scoring moments (gear, maze entrance, companion) worth 2
  // points each across 4 values, an exact 3-way tie at 2 points apiece
  // happens any time all three picks land on three different values —
  // genuinely common, not an edge case. The original version here just
  // took the first strictly-greater score it saw while walking
  // coreValueScores' own keys in their declared order (Courage,
  // Independence, Connection, Integrity), which meant every tie silently
  // resolved to whichever tied value happened to be declared earliest —
  // Courage, almost always. That's what Chef was seeing as "I keep
  // scoring Courage/Integrity" regardless of what she actually picked:
  // a hidden bias from object key order, not a real reflection of her
  // choices. Fixed by collecting every value tied for the top score and,
  // when there's more than one, picking randomly among just those — ties
  // still happen, but which of the tied values wins is no longer fixed
  // to the same one every single time.
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
    if (scene.mechanic === 'sorting' || scene.mechanic === 'reveal-cards' || scene.mechanic === 'word-picker'
        || scene.mechanic === 'gear-select' || scene.mechanic === 'companion-select'
        || scene.mechanic === 'envelope-reveal' || scene.mechanic === 'maze') {
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
    // "layout": "image-left" (currently just Scene 4, The Map And Your
    // Compass) puts the overlay image in its own invisible container on
    // the left and the title/description in their own left-aligned
    // invisible container on the right, the pair centered together as one
    // unit in the middle of the page — a different arrangement of the
    // exact same fields every other scene already uses, not a new content
    // type.
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

    if (scene.mechanic === 'compass') {
      mechanicGatesButton = true;
      buildCompassMechanic(mechanicSlot, scene, revealButtons);
    }

    if (scene.mechanic === 'gear-select') {
      mechanicGatesButton = true;
      buildGearMechanic(mechanicSlot, scene, revealButtons);
    }

    if (scene.mechanic === 'maze') {
      mechanicGatesButton = true;
      buildMazeMechanic(mechanicSlot, scene, revealButtons);
    }

    if (scene.mechanic === 'companion-select') {
      mechanicGatesButton = true;
      buildCompanionMechanic(mechanicSlot, scene, revealButtons);
    }

    if (scene.mechanic === 'key-grab') {
      mechanicGatesButton = true;
      buildKeyMechanic(mechanicSlot, scene, revealButtons);
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

    // Lets a player change their mind after all 5 slots are filled, without
    // adding any on-card "x" that would clutter the word-card artwork —
    // double-click is the whole interaction, called out in this one hint
    // line instead.
    const hint = document.createElement('div');
    hint.className = 'aurion-word-hint';
    hint.textContent = 'Double-click a word to remove it from your list';

    const grid = document.createElement('div');
    grid.className = 'aurion-word-grid';

    const popup = document.createElement('div');
    popup.className = 'aurion-word-popup';

    function updateCounterStars() {
      counterStars.forEach((star, i) => {
        star.classList.toggle('filled', i < picked.length);
      });
    }

    WORD_BANK.forEach(entry => {
      const card = document.createElement('button');
      card.className = 'aurion-word-card';
      card.textContent = entry.word;
      card.addEventListener('click', () => {
        if (card.classList.contains('picked')) return;
        if (picked.length >= MAX_PICKS) return;

        card.classList.add('picked');
        picked.push(entry);
        updateCounterStars();

        if (picked.length === MAX_PICKS) {
          selectedWords = picked.slice();
          showSummary();
        }
      });
      card.addEventListener('dblclick', () => {
        if (!card.classList.contains('picked')) return;

        card.classList.remove('picked');
        const idx = picked.findIndex(e => e.word === entry.word);
        if (idx !== -1) picked.splice(idx, 1);
        updateCounterStars();
        // Selection is no longer complete — close the summary popup (if it
        // was open) so the player can pick a replacement; it reopens once
        // 5 are picked again.
        popup.classList.remove('open');
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

    pickerWrap.append(counter, hint, grid);
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

  // Scene 3 ("Where Will Your Journey Take You?") — press the compass and
  // its dial swings left-right-left, like it's finding its bearing, then
  // settles and the button appears. A plain click/tap, not a drag — the
  // earlier drag-only version silently never fired onComplete() for a
  // player who just clicked without moving the pointer, which is exactly
  // the "nothing happens" Chef hit. Not scored — this scene is
  // atmosphere, the choices that actually score start at the gear scene.
  function buildCompassMechanic(slot, scene, onComplete) {
    const stage = document.createElement('div');
    stage.className = 'aurion-compass-stage';

    const img = document.createElement('img');
    img.className = 'aurion-compass-dial';
    img.src = resolveAssetUrl((scene.mechanicData && scene.mechanicData.image) || '');
    img.alt = '';
    img.draggable = false;

    let done = false;
    img.addEventListener('click', () => {
      if (done) return;
      done = true;
      img.classList.add('swinging');
    });
    img.addEventListener('animationend', () => {
      if (!done) return;
      img.classList.remove('swinging');
      img.classList.add('settled');
      onComplete();
    }, { once: true });

    stage.appendChild(img);
    slot.appendChild(stage);
  }

  // Scene 5 ("Choose Your Gear") — top row is the real choice (thermos,
  // backpack, poles, binoculars), bottom row is the pirates, decorative
  // only per Chef's note ("just addition for effect"), never clickable.
  // Reuses the exact .aurion-sort-board/.aurion-sort-tile grid Scene 6/8
  // already use — same 4-column grid naturally gives two rows of four.
  // Picking a gear item scores its Core Value and reveals the button
  // immediately, same "one click, done" pattern as the door mechanic.
  function buildGearMechanic(slot, scene, onComplete) {
    const gear = (scene.mechanicData && scene.mechanicData.gear) || {};
    const pirates = (scene.mechanicData && scene.mechanicData.pirates) || [];
    let chosen = false;

    const stage = document.createElement('div');
    stage.className = 'aurion-sort-stage';
    const board = document.createElement('div');
    board.className = 'aurion-sort-board aurion-gear-board';

    Object.entries(gear).forEach(([value, imageUrl]) => {
      const tile = document.createElement('button');
      tile.className = 'aurion-sort-tile aurion-gear-tile';
      if (imageUrl) tile.style.backgroundImage = `url('${resolveAssetUrl(imageUrl)}')`;
      tile.addEventListener('click', () => {
        if (chosen) return;
        chosen = true;
        tile.classList.add('opened');
        board.querySelectorAll('.aurion-gear-tile').forEach(t => { if (t !== tile) t.classList.add('dim'); });
        addCoreValueScore(value, 2);
        onComplete();
      });
      board.appendChild(tile);
    });

    pirates.forEach(imageUrl => {
      const tile = document.createElement('div');
      tile.className = 'aurion-sort-tile aurion-pirate-tile dim';
      if (imageUrl) tile.style.backgroundImage = `url('${resolveAssetUrl(imageUrl)}')`;
      board.appendChild(tile);
    });

    stage.appendChild(board);
    slot.appendChild(stage);
  }

  // Scene 6 ("Follow The Map") — a hand-built maze (see MAZE_CELL_OPEN
  // etc. near the top of this file), drawn fresh every time rather than
  // from an image, so a real draggable dot can be collision-checked
  // against its walls. Four unlabeled entrance rings sit just outside the
  // four gaps in the border. The player picks the dot up from its tray
  // below the maze and drags it toward whichever entrance they choose —
  // first one they actually enter through locks in that entrance's Core
  // Value (2 points, same weight as gear and companion), regardless of
  // how many tries it then takes to actually reach the centre. Once
  // inside, the dot can only move into an adjacent cell if this maze's
  // own wall data says that edge is open — that's the real "collision".
  function buildMazeMechanic(slot, scene, onComplete) {
    const CELL = 40;
    const N = MAZE_GRID_SIZE;
    const SIZE = CELL * N;
    const PAD = 34;
    // Extra room below the maze itself for the draggable dot's starting
    // tray. The previous version placed the tray dot at SIZE + PAD*1.6,
    // which was OUTSIDE the SVG's own viewBox (that only extended to
    // SIZE + PAD) — the dot was being drawn, it just physically never
    // appeared on screen, which is exactly the "static, no dot to drag"
    // Chef ran into. Giving the bottom edge its own larger padding fixes
    // that and gives the tray dot clear separation from the S entrance
    // ring above it.
    const TRAY_PAD = 70;
    const viewHeight = SIZE + PAD + TRAY_PAD;
    const view = `-${PAD} -${PAD} ${SIZE + PAD * 2} ${viewHeight}`;

    function cellCenter(r, c) { return { x: c * CELL + CELL / 2, y: r * CELL + CELL / 2 }; }
    function entrancePos(entry) {
      const [r, c] = entry.cell;
      const center = cellCenter(r, c);
      const off = CELL * 0.62;
      if (entry.edgeDir === 'N') return { x: center.x, y: -off };
      if (entry.edgeDir === 'S') return { x: center.x, y: SIZE + off };
      if (entry.edgeDir === 'W') return { x: -off, y: center.y };
      return { x: SIZE + off, y: center.y };
    }

    // Wall segments: every non-open side of every cell, minus the one
    // boundary segment that is deliberately an entrance gap.
    const segments = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const open = MAZE_CELL_OPEN[`${r},${c}`] || [];
        const isBoundaryEntrance = (dir) => Object.values(MAZE_ENTRANCES)
          .some(en => en.cell[0] === r && en.cell[1] === c && en.edgeDir === dir);
        if (!open.includes('N') && !(r === 0 && isBoundaryEntrance('N'))) {
          segments.push([c * CELL, r * CELL, (c + 1) * CELL, r * CELL]);
        }
        if (!open.includes('W') && !(c === 0 && isBoundaryEntrance('W'))) {
          segments.push([c * CELL, r * CELL, c * CELL, (r + 1) * CELL]);
        }
        if (r === N - 1 && !open.includes('S') && !isBoundaryEntrance('S')) {
          segments.push([c * CELL, (r + 1) * CELL, (c + 1) * CELL, (r + 1) * CELL]);
        }
        if (c === N - 1 && !open.includes('E') && !isBoundaryEntrance('E')) {
          segments.push([(c + 1) * CELL, r * CELL, (c + 1) * CELL, (r + 1) * CELL]);
        }
      }
    }

    const stage = document.createElement('div');
    stage.className = 'aurion-maze-stage';

    const hint = document.createElement('p');
    hint.className = 'aurion-maze-hint';
    hint.textContent = 'Drag The Dot In The Maze To Reach The 3C Diamond';

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', view);
    svg.setAttribute('class', 'aurion-maze-svg');

    segments.forEach(([x1, y1, x2, y2]) => {
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', x1); line.setAttribute('y1', y1);
      line.setAttribute('x2', x2); line.setAttribute('y2', y2);
      line.setAttribute('class', 'aurion-maze-wall');
      svg.appendChild(line);
    });

    // The goal marker at the maze's centre. If this scene's mechanicData
    // sets a "goalImage" (the 3C diamond, per Chef's request — reach the
    // diamond, not an unexplained gold dot), it's drawn as that image
    // instead of the plain glowing circle; the circle stays as the
    // fallback so the maze still works correctly even before that asset
    // is wired into the config.
    const exitCenter = cellCenter(MAZE_CENTER[0], MAZE_CENTER[1]);
    const goalImageUrl = scene.mechanicData && scene.mechanicData.goalImage;
    let exitGlow;
    if (goalImageUrl) {
      const size = CELL * 0.9;
      exitGlow = document.createElementNS(svgNS, 'image');
      exitGlow.setAttributeNS('http://www.w3.org/1999/xlink', 'href', resolveAssetUrl(goalImageUrl));
      exitGlow.setAttribute('href', resolveAssetUrl(goalImageUrl));
      exitGlow.setAttribute('x', exitCenter.x - size / 2);
      exitGlow.setAttribute('y', exitCenter.y - size / 2);
      exitGlow.setAttribute('width', size);
      exitGlow.setAttribute('height', size);
      exitGlow.setAttribute('class', 'aurion-maze-exit aurion-maze-exit-image');
    } else {
      exitGlow = document.createElementNS(svgNS, 'circle');
      exitGlow.setAttribute('cx', exitCenter.x);
      exitGlow.setAttribute('cy', exitCenter.y);
      exitGlow.setAttribute('r', CELL * 0.3);
      exitGlow.setAttribute('class', 'aurion-maze-exit');
    }
    svg.appendChild(exitGlow);

    const entranceEls = [];
    Object.entries(MAZE_ENTRANCES).forEach(([value, entry]) => {
      const pos = entrancePos(entry);
      const ring = document.createElementNS(svgNS, 'circle');
      ring.setAttribute('cx', pos.x);
      ring.setAttribute('cy', pos.y);
      ring.setAttribute('r', CELL * 0.32);
      ring.setAttribute('class', 'aurion-maze-entrance-ring');
      svg.appendChild(ring);
      entranceEls.push({ value, entry, pos });
    });

    // A faint dashed tray marks where the dot starts, so it reads as "pick
    // this up" rather than a stray dot sitting in empty space.
    const dotStart = { x: SIZE / 2, y: SIZE + PAD + TRAY_PAD / 2 };
    const tray = document.createElementNS(svgNS, 'circle');
    tray.setAttribute('cx', dotStart.x);
    tray.setAttribute('cy', dotStart.y);
    tray.setAttribute('r', CELL * 0.42);
    tray.setAttribute('class', 'aurion-maze-tray');
    svg.appendChild(tray);

    const dot = document.createElementNS(svgNS, 'circle');
    dot.setAttribute('cx', dotStart.x);
    dot.setAttribute('cy', dotStart.y);
    dot.setAttribute('r', CELL * 0.22);
    dot.setAttribute('class', 'aurion-maze-dot');
    svg.appendChild(dot);

    let insideMaze = false;
    let currentCell = null;
    let dragging = false;
    let solved = false;
    // Set the moment the dot first crosses into ANY entrance and never
    // cleared again — the actual score locks in right there per Chef's
    // "first entry, not other attempts" rule. Everything below this that
    // lets the player send the dot back and pick a different entrance is
    // purely so they can look around/retry the puzzle itself; it never
    // touches the score once this flag is true.
    let scoreLocked = false;

    function svgPoint(clientX, clientY) {
      const rect = svg.getBoundingClientRect();
      const scaleX = (SIZE + PAD * 2) / rect.width;
      const scaleY = viewHeight / rect.height;
      return {
        x: (clientX - rect.left) * scaleX - PAD,
        y: (clientY - rect.top) * scaleY - PAD
      };
    }

    dot.addEventListener('pointerdown', (e) => {
      if (solved) return;
      dragging = true;
      dot.setPointerCapture(e.pointerId);
    });

    dot.addEventListener('pointermove', (e) => {
      if (!dragging || solved) return;
      const p = svgPoint(e.clientX, e.clientY);

      if (!insideMaze) {
        dot.setAttribute('cx', p.x);
        dot.setAttribute('cy', p.y);
        // Committing to an entrance: close enough to its ring AND the
        // maze's own boundary (moving inward, not just hovering nearby).
        for (const cand of entranceEls) {
          const dx = p.x - cand.pos.x, dy = p.y - cand.pos.y;
          if (Math.sqrt(dx * dx + dy * dy) < CELL * 0.5) {
            insideMaze = true;
            currentCell = cand.entry.cell.slice();
            if (!scoreLocked) {
              scoreLocked = true;
              addCoreValueScore(cand.value, 2);
            }
            const c = cellCenter(currentCell[0], currentCell[1]);
            dot.setAttribute('cx', c.x);
            dot.setAttribute('cy', c.y);
            break;
          }
        }
        return;
      }

      // Inside the maze: only ever snap to an orthogonally adjacent cell,
      // and only if this maze's own data says that side is open. Anything
      // else is ignored — the dot simply doesn't follow, which reads as
      // hitting a wall.
      const targetCol = Math.round((p.x - CELL / 2) / CELL);
      const targetRow = Math.round((p.y - CELL / 2) / CELL);
      const [cr, cc] = currentCell;
      const dr = targetRow - cr, dc = targetCol - cc;
      let dir = null;
      if (dr === -1 && dc === 0) dir = 'N';
      else if (dr === 1 && dc === 0) dir = 'S';
      else if (dr === 0 && dc === -1) dir = 'W';
      else if (dr === 0 && dc === 1) dir = 'E';
      if (!dir) return;

      const open = MAZE_CELL_OPEN[`${cr},${cc}`] || [];
      if (!open.includes(dir)) return;

      currentCell = [targetRow, targetCol];
      const c = cellCenter(targetRow, targetCol);
      dot.setAttribute('cx', c.x);
      dot.setAttribute('cy', c.y);

      if (targetRow === MAZE_CENTER[0] && targetCol === MAZE_CENTER[1]) {
        solved = true;
        dot.classList.add('solved');
        onComplete();
      }
    });

    dot.addEventListener('pointerup', () => { dragging = false; });

    // Double-click sends the dot back to its tray so the player can look
    // around and try a different entrance — purely exploratory, the score
    // already locked (or didn't) on the very first entrance crossing and
    // this never re-opens or changes it, per Chef's "no matter how many
    // times they try, the first decision is what counts" rule above.
    dot.addEventListener('dblclick', () => {
      if (solved) return;
      insideMaze = false;
      currentCell = null;
      dot.setAttribute('cx', dotStart.x);
      dot.setAttribute('cy', dotStart.y);
    });

    const resetHint = document.createElement('p');
    resetHint.className = 'aurion-maze-reset-hint';
    resetHint.textContent = 'Double-click the dot to send it back and try another way in.';

    stage.append(hint, svg, resetHint);
    slot.appendChild(stage);
  }

  // Scene 7 ("Choose Your Companion") — single row of four parrots, same
  // grid/tile classes as the gear scene. One click picks and scores;
  // per Chef's note the button only appears once the voice line for this
  // scene has played through and finished, not the instant the pick is
  // made.
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
        addCoreValueScore(value, 2);

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

  // Scene 8 ("Grab The Key") — click the key, it glows then vanishes
  // (scale + fade + float up), not scored. Button waits for this scene's
  // voice line to finish, same as the companion scene.
  function buildKeyMechanic(slot, scene, onComplete) {
    const stage = document.createElement('div');
    stage.className = 'aurion-key-stage';

    const img = document.createElement('img');
    img.className = 'aurion-key-img';
    img.src = resolveAssetUrl((scene.mechanicData && scene.mechanicData.image) || '');
    img.alt = '';

    let grabbed = false;
    img.addEventListener('click', () => {
      if (grabbed) return;
      grabbed = true;
      img.classList.add('grabbed', 'vanish');
      img.addEventListener('animationend', () => {
        if (scene.soundEffect) {
          const voice = new Audio(scene.soundEffect);
          voice.addEventListener('ended', onComplete);
          voice.play().catch(onComplete);
        } else {
          onComplete();
        }
      }, { once: true });
    });

    stage.appendChild(img);
    slot.appendChild(stage);
  }

  // Scene 9 ("Let's Check How Far You Got") — four envelopes on screen,
  // but only the one matching whichever Core Value scored highest across
  // the gear/maze/companion scenes is actually openable (a soft glow, no
  // color or label difference from the other three — the reveal is
  // supposed to come as a surprise, not be guessable from the artwork).
  // The other three sit there as decoys. Opening it, reading the message
  // and closing the card behaves exactly like the goals series' reveal-
  // cards scene: the voice line only starts once the card is closed, and
  // the button waits for that voice line to finish.
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
