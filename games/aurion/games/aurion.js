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
  { word: 'Be kinder', category: 'GIVE' },
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

function preloadAssets(config) {
  const urls = [];
  if (config.background && config.background.url && config.background.type !== 'video') {
    urls.push(config.background.url);
  }
  (config.decisions || []).forEach(d => {
    if (d.background && d.background.url && d.background.type !== 'video') urls.push(d.background.url);
    if (d.image && d.image.url) urls.push(d.image.url);
    if (d.overlayImage && d.overlayImage.url) urls.push(d.overlayImage.url);
  });
  (config.characterImages || []).forEach(img => { if (img.url) urls.push(img.url); });

  const loadPromises = urls.map(url => new Promise(resolve => {
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

  container.classList.add('aurion-game');
  container.innerHTML = '';

  const bgLayer = document.createElement('div');
  bgLayer.className = 'aurion-bg-layer';
  container.appendChild(bgLayer);

  const content = document.createElement('div');
  content.className = 'aurion-content';
  container.appendChild(content);

  // Exit symbol — present on every scene except the last (Final), independent
  // of any button logic, purely a polite way to leave at any point.
  const exitBtn = document.createElement('button');
  exitBtn.className = 'aurion-exit-btn';
  exitBtn.textContent = '\u2715';
  exitBtn.setAttribute('aria-label', 'Exit');
  exitBtn.addEventListener('click', () => {
    if (ambientAudio) ambientAudio.pause();
    window.location.href = 'landing.html';
  });

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
    hourglass.className = 'loading-hourglass';
    const sandDot = document.createElement('div');
    sandDot.className = 'sand-dot';
    hourglass.appendChild(sandDot);

    const msg = document.createElement('p');
    msg.className = 'aurion-body-text';
    msg.textContent = "Hey Champ! I'm getting everything ready for you. The first visit can take a little longer while your browser gets everything organised. Hang in there, it'll be worth the wait!";

    wrap.append(hourglass, msg);
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
      bgLayer.style.backgroundImage = `url('${effective.url}')`;
      bgLayer.style.backgroundSize = 'cover';
      bgLayer.style.backgroundPosition = 'center';
      bgLayer.style.backgroundRepeat = 'no-repeat';
    }
  }

  function applyStyledText(el, obj, prefix) {
    if (obj[prefix + 'Font']) el.style.fontFamily = `'${obj[prefix + 'Font']}', sans-serif`;
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

    setBackground(scene.background);
    content.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'aurion-scene-wrap';

    if (scene.overlayImage && scene.overlayImage.url) {
      const img = document.createElement('img');
      img.src = scene.overlayImage.url;
      img.alt = '';
      img.className = 'aurion-overlay-img aurion-overlay-' + (scene.overlayImage.position || 'center');
      wrap.appendChild(img);
    }

    if (scene.titleText) {
      const title = document.createElement('h1');
      title.className = 'aurion-scene-title';
      title.textContent = scene.titleText;
      applyStyledText(title, scene, 'title');
      wrap.appendChild(title);
    }

    if (scene.descText) {
      const desc = document.createElement('p');
      desc.className = 'aurion-scene-desc';
      desc.textContent = scene.descText;
      applyStyledText(desc, scene, 'desc');
      wrap.appendChild(desc);
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
    (scene.buttons || []).forEach(btn => {
      const b = document.createElement('button');
      b.className = 'aurion-btn';
      if (btn.image) {
        b.style.backgroundImage = `url('${btn.image}')`;
        b.classList.add('aurion-btn-imaged');
      }
      b.textContent = btn.text || 'Continue';
      if (btn.font) b.style.fontFamily = `'${btn.font}', sans-serif`;
      if (btn.color) b.style.color = btn.color;
      if (btn.size) b.style.fontSize = btn.size + 'px';
      b.addEventListener('click', () => {
        if (ambientAudio && isLastScene) { /* leave ambient running on finale */ }
        if (!isLastScene) renderScene(sceneIndex + 1);
      });
      buttonRow.appendChild(b);
    });
    wrap.appendChild(buttonRow);

    content.appendChild(wrap);

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
      setTimeout(() => {
        const voice = new Audio(scene.soundEffect);
        voice.addEventListener('ended', revealButtons);
        voice.play().catch(revealButtons);
      }, 1000);
    } else {
      revealButtons();
    }
  }

  function buildDoorMechanic(slot, scene, onOpened) {
    const stage = document.createElement('div');
    stage.className = 'aurion-door-stage';

    const closedImg = document.createElement('img');
    closedImg.className = 'aurion-door-img aurion-door-closed';
    closedImg.src = (scene.image && scene.image.url) || '';
    closedImg.alt = '';

    const openImg = document.createElement('img');
    openImg.className = 'aurion-door-img aurion-door-open';
    openImg.src = scene.mechanicData.openImage || '';
    openImg.alt = '';

    const revealImg = document.createElement('img');
    revealImg.className = 'aurion-door-reveal';
    revealImg.src = scene.mechanicData.revealImage || '';
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

    const counter = document.createElement('div');
    counter.className = 'aurion-word-counter';
    counter.textContent = `0 of ${MAX_PICKS}`;

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
        counter.textContent = `${picked.length} of ${MAX_PICKS}`;

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
        star.textContent = '\u2605';
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

    slot.append(counter, grid, popup);
  }
}
