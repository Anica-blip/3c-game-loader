// Repo path: games/maverick-surfboard/games/maverick-surfboard.js

const MOTION_PRESETS = {
  'glide-bob': (progress) => ({ y: Math.sin(progress * Math.PI * 8) * 12, rotation: 0 }),
  'straight-glide': () => ({ y: 0, rotation: 0 }),
  'wave-jump': (progress) => ({ y: -Math.abs(Math.sin(progress * Math.PI * 5)) * 25, rotation: 0 }),
  'wipeout-spin': (progress) => ({ y: Math.sin(progress * Math.PI * 10) * 35, rotation: progress * 1080 })
};

function preloadImageList(urls) {
  const list = Array.from(new Set(urls.filter(Boolean)));
  return Promise.all(list.map(url => new Promise(resolve => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = resolve;
    img.src = url;
  })));
}

// Was two tiers — a "critical" set (landing + intro + decision 1 only)
// gated the hourglass, while decisions 2-5's backgrounds loaded
// fire-and-forget in the background with nothing waiting on them. That
// was built to keep the initial wait short, but it meant scenes 2-5 had
// no actual guarantee of being ready by the time the player reached them
// — on a real connection, four more full-size external photo backgrounds
// don't reliably finish downloading during just decision 1's few-second
// animation. When they didn't, the browser painted whatever bytes of that
// background image had arrived so far, which is the "loads top to
// bottom, dark screen" symptom that cost Maverick its launch day.
//
// Chef's call: better to make the player wait once, fully, behind the
// hourglass, than to have any scene start before its own background is
// actually ready. So this is back to one tier — every image the game can
// possibly show (landing, intro, all 5 decisions' backgrounds and
// character images, finale) is loaded before the intro screen ever
// appears. Nothing about a scene's assets is left to load "live" once
// gameplay has started.
function preloadAllAssets(config) {
  const urls = [];
  if (config.background && config.background.url && config.background.type !== 'video') {
    urls.push(config.background.url);
  }
  if (config.introImage) urls.push(config.introImage);
  if (config.finaleImage) urls.push(config.finaleImage);

  (config.decisions || []).forEach(d => {
    if (d.background && d.background.url && d.background.type !== 'video') urls.push(d.background.url);
    if (d.image && d.image.url) urls.push(d.image.url);
  });
  (config.characterImages || []).forEach(img => { if (img.url) urls.push(img.url); });

  // Safety net only, not the expected path. There are 13 unique images
  // here, 9 of them external ~1MB photo-quality graphics — call it
  // roughly 9-10MB total. On WiFi/4G that's a few seconds; the timeout
  // exists so a genuinely broken connection or a dead link doesn't strand
  // the player on the hourglass forever, not to cut a slow-but-working
  // load short and let a scene start half-loaded again. 45s gives real
  // room for a slow mobile connection to actually finish before this
  // becomes the thing that ends the wait instead of the images doing it.
  const timeout = new Promise(resolve => setTimeout(resolve, 45000));
  return Promise.race([preloadImageList(urls), timeout]);
}

export function startGame(config, container) {
  let score = 0;
  let decisionIndex = 0;
  let ambientAudio = null;
  let rafId = null;

  container.classList.add('maverick-game');
  container.innerHTML = '';

  const bgLayer = document.createElement('div');
  bgLayer.className = 'maverick-bg-layer';
  container.appendChild(bgLayer);
  setupBackground(bgLayer, config.background);

  const content = document.createElement('div');
  content.className = 'maverick-content';
  container.appendChild(content);

  renderLoading();
  preloadAllAssets(config).then(() => {
    renderIntro();
  });

  function setupBackground(layer, background) {
    layer.classList.remove('maverick-bg-ready');
    layer.innerHTML = '';
    layer.classList.remove('maverick-bg-image');
    layer.style.backgroundImage = '';
    layer.style.backgroundColor = '';

    if (!background || !background.url) return;

    if (background.type === 'video') {
      const video = document.createElement('video');
      video.src = background.url;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.className = 'maverick-bg-video';
      layer.appendChild(video);
      video.play().catch(() => {});
    } else {
      layer.classList.add('maverick-bg-image');
      layer.style.backgroundImage = `url('${background.url}')`;
    }
    // Fades the layer in rather than a hard cut — a cushion against exactly
    // the "dark screen for a moment" complaint, on top of (not instead of)
    // the preloading above actually having the image ready by this point.
    requestAnimationFrame(() => layer.classList.add('maverick-bg-ready'));
  }

  function setSolidBackground(layer, hex) {
    layer.classList.remove('maverick-bg-ready');
    layer.innerHTML = '';
    layer.classList.remove('maverick-bg-image');
    layer.style.backgroundImage = '';
    layer.style.backgroundColor = hex;
    requestAnimationFrame(() => layer.classList.add('maverick-bg-ready'));
  }

  function getCharacterImageUrl(decision) {
    if (decision.image && decision.image.url) {
      return decision.image.url;
    }
    const list = config.characterImages || [];
    if (decision.characterImageId) {
      const found = list.find(img => img.id === decision.characterImageId);
      if (found) return found.url;
    }
    return list[0] ? list[0].url : '';
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

  function renderLoading() {
    content.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'maverick-screen maverick-loading';

    // Same layered SVG hourglass Aurion uses (real glass/sand geometry, not
    // a flat CSS shape), recolored to Maverick's own teal/gold palette
    // instead of Aurion's purple/gold, with ambient sparkles reading as sea
    // spray rather than starlight. Maverick's own loading line stays as-is.
    const hourglass = document.createElement('div');
    hourglass.className = 'maverick-hourglass-illustration';
    hourglass.innerHTML = `
      <svg width="100%" height="100%" viewBox="0 0 380 260" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="maverickGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1c5560"/>
            <stop offset="100%" stop-color="#14141a"/>
          </linearGradient>
          <linearGradient id="maverickSandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ffe9b3"/>
            <stop offset="100%" stop-color="#f0b429"/>
          </linearGradient>
        </defs>
        <circle cx="70" cy="40" r="2" fill="#9be8f0" opacity="0.8">
          <animate attributeName="opacity" values="0.2;0.9;0.2" dur="2.4s" repeatCount="indefinite"/>
        </circle>
        <circle cx="300" cy="60" r="2.5" fill="#9be8f0" opacity="0.6">
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="3.1s" repeatCount="indefinite"/>
        </circle>
        <circle cx="320" cy="180" r="1.8" fill="#9be8f0" opacity="0.7">
          <animate attributeName="opacity" values="0.3;0.9;0.3" dur="2.7s" repeatCount="indefinite"/>
        </circle>
        <g transform="translate(190,130)">
          <g>
            <animateTransform attributeName="transform" type="rotate" values="0;0;180;180;360" keyTimes="0;0.4;0.5;0.9;1" dur="6s" repeatCount="indefinite"/>
            <path d="M -55 -85 Q -55 -95 -45 -95 L 45 -95 Q 55 -95 55 -85 Q 55 -55 15 -8 Q 8 0 15 8 Q 55 55 55 85 Q 55 95 45 95 L -45 95 Q -55 95 -55 85 Q -55 55 -15 8 Q -8 0 -15 -8 Q -55 -55 -55 -85 Z" fill="url(#maverickGlassGrad)" stroke="#f0b429" stroke-width="3" stroke-linejoin="round"/>
            <path d="M -47 -82 Q -47 -88 -40 -88 L 40 -88 Q 47 -88 47 -82 Q 47 -56 12 -10 Q 12 -6 -12 -10 Q -47 -56 -47 -82 Z" fill="url(#maverickSandGrad)" opacity="0.9"/>
            <path d="M -8 40 Q -8 70 -30 82 Q -35 85 -35 88 L 35 88 Q 35 85 30 82 Q 8 70 8 40 Q 8 55 0 60 Q -8 55 -8 40 Z" fill="url(#maverickSandGrad)" opacity="0.9"/>
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

    const msg = document.createElement('p');
    msg.className = 'maverick-body-text';
    msg.textContent = "Buddy! This is a bit slow isn't it? Gees, the internet can't find the waves fast enough. Hang in there, I'm swimming to the shore to shout at them.";

    wrap.append(hourglass, msg);
    content.appendChild(wrap);
  }

  function renderIntro() {
    if (rafId) cancelAnimationFrame(rafId);
    setupBackground(bgLayer, config.background);
    content.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'maverick-screen maverick-intro';

    const img = document.createElement('img');
    img.src = config.introImage;
    img.alt = config.title || 'Challenge intro';
    img.className = 'maverick-duck-img';

    const title = document.createElement('h1');
    title.textContent = config.title || 'Challenge';

    const intro = document.createElement('p');
    intro.className = 'maverick-body-text';
    intro.textContent = 'Get ready for a new challenge. Every call you make shapes how the story unfolds.';

    const startBtn = document.createElement('button');
    startBtn.className = 'maverick-btn maverick-btn-primary';
    startBtn.textContent = "Let's go";
    startBtn.addEventListener('click', () => {
      startAmbient();
      decisionIndex = 0;
      score = 0;
      renderDecisionStage();
    });

    wrap.append(img, title, intro, startBtn);
    content.appendChild(wrap);
  }

  function renderDecisionStage() {
    if (decisionIndex >= config.decisions.length) {
      if (config.maverickVideo) {
        renderMaverickMessage();
      } else {
        renderFinale();
      }
      return;
    }

    const decision = config.decisions[decisionIndex];
    const motionFn = MOTION_PRESETS[decision.motion] || MOTION_PRESETS['glide-bob'];
    const verticalPercent = typeof decision.verticalPosition === 'number' ? decision.verticalPosition : 40;
    const durationMs = (typeof decision.duration === 'number' ? decision.duration : 4) * 1000;

    const sceneBackground = (decision.background && decision.background.url) ? decision.background : config.background;
    setupBackground(bgLayer, sceneBackground);

    content.innerHTML = '';
    const stage = document.createElement('div');
    stage.className = 'maverick-stage';

    const progressLabel = document.createElement('div');
    progressLabel.className = 'maverick-progress';
    progressLabel.textContent = `${decisionIndex + 1} of ${config.decisions.length}`;

    const duck = document.createElement('img');
    duck.src = getCharacterImageUrl(decision);
    duck.alt = 'Character in motion';
    duck.className = 'maverick-duck-img maverick-duck-surf maverick-duck-moving';
    duck.style.top = `${verticalPercent}%`;

    stage.append(progressLabel, duck);
    content.appendChild(stage);

    let start = null;
    function animate(ts) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / durationMs, 1);

      const trackWidth = stage.clientWidth - duck.clientWidth;
      const x = progress * trackWidth;
      const motionResult = motionFn(progress);
      const y = motionResult.y;
      const rotation = motionResult.rotation || 0;

      duck.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        showPromptButton(stage, decision);
      }
    }
    rafId = requestAnimationFrame(animate);
  }

  function showPromptButton(stage, decision) {
    if (decision.soundEffect) {
      const voice = new Audio(decision.soundEffect);
      voice.play().catch(() => {});
    }

    const btn = document.createElement('button');
    btn.className = 'maverick-glass-btn';
    btn.textContent = 'click';
    btn.setAttribute('aria-label', 'See what happens next');

    btn.addEventListener('click', () => {
      renderOptions(decision);
    });

    stage.appendChild(btn);
  }

  function renderOptions(decision) {
    content.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'maverick-screen maverick-decision';

    const situation = document.createElement('p');
    situation.className = 'maverick-body-text';
    situation.textContent = decision.situation;

    const optionsWrap = document.createElement('div');
    optionsWrap.className = 'maverick-options';

    decision.options.forEach(option => {
      const optBtn = document.createElement('button');
      optBtn.className = 'maverick-btn maverick-btn-option';
      optBtn.textContent = option.text;
      optBtn.addEventListener('click', () => {
        score += option.scoreDelta;
        decisionIndex += 1;
        renderDecisionStage();
      });
      optionsWrap.appendChild(optBtn);
    });

    wrap.append(situation, optionsWrap);
    content.appendChild(wrap);
  }

  function renderMaverickMessage() {
    if (rafId) cancelAnimationFrame(rafId);
    setSolidBackground(bgLayer, '#252a31');
    content.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'maverick-msg-wrap';

    const video = document.createElement('video');
    video.className = 'maverick-msg-video';
    video.src = config.maverickVideo;
    video.autoplay = true;
    video.setAttribute('playsinline', '');
    video.playsInline = true;
    video.disablePictureInPicture = true;
    video.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback');
    video.oncontextmenu = (e) => e.preventDefault();

    video.addEventListener('ended', () => {
      video.pause();
    });

    video.play().catch(() => {
      video.muted = true;
      video.play().catch(() => {});
    });

    const flipBtn = document.createElement('button');
    flipBtn.className = 'maverick-flip-btn';
    flipBtn.textContent = 'Flip Over';
    flipBtn.addEventListener('click', () => {
      video.pause();
      renderFinale();
    });

    wrap.append(video, flipBtn);
    content.appendChild(wrap);
  }

  function renderFinale() {
    setupBackground(bgLayer, config.background);

    const result = config.results.find(r => score >= r.minScore && score <= r.maxScore)
      || config.results[config.results.length - 1];

    content.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'maverick-screen maverick-finale';

    const img = document.createElement('img');
    img.src = config.finaleImage;
    img.alt = config.title || 'Challenge complete';
    img.className = 'maverick-duck-img';

    const title = document.createElement('h1');
    title.textContent = result.title;

    const message = document.createElement('p');
    message.className = 'maverick-body-text';
    message.textContent = result.message;

    const scoreLine = document.createElement('p');
    scoreLine.className = 'maverick-score-line';
    scoreLine.textContent = `Score: ${score}`;

    const replayBtn = document.createElement('button');
    replayBtn.className = 'maverick-btn maverick-btn-primary';
    replayBtn.textContent = 'Play again';
    replayBtn.addEventListener('click', () => {
      decisionIndex = 0;
      score = 0;
      renderIntro();
    });

    const bottomRow = document.createElement('div');
    bottomRow.className = 'maverick-bottom-row';

    const creditsBtn = document.createElement('button');
    creditsBtn.className = 'maverick-team-btn';
    creditsBtn.textContent = 'The Team';
    creditsBtn.addEventListener('click', renderCredits);

    const offBtn = document.createElement('button');
    offBtn.className = 'maverick-off-btn';
    offBtn.textContent = 'OFF';
    offBtn.setAttribute('aria-label', 'Exit challenge');
    offBtn.addEventListener('click', () => {
      renderGoodbye();
      window.close();
    });

    bottomRow.append(creditsBtn, offBtn);
    wrap.append(img, title, message, scoreLine, replayBtn, bottomRow);
    content.appendChild(wrap);
  }

  function renderGoodbye() {
    if (ambientAudio) {
      ambientAudio.pause();
      ambientAudio = null;
    }
    content.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'maverick-screen maverick-goodbye';

    const message = document.createElement('p');
    message.className = 'maverick-body-text';
    message.textContent = 'Thanks for playing!';

    wrap.appendChild(message);
    content.appendChild(wrap);
  }

  function renderCredits() {
    content.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'maverick-screen maverick-credits';

    const title = document.createElement('h1');
    title.textContent = 'Credits';

    const text = document.createElement('p');
    text.className = 'maverick-credits-text';
    text.textContent = config.credits || 'Credits coming soon.';

    const backBtn = document.createElement('button');
    backBtn.className = 'maverick-btn maverick-btn-primary';
    backBtn.textContent = 'Back';
    backBtn.addEventListener('click', renderFinale);

    wrap.append(title, text, backBtn);
    content.appendChild(wrap);
  }
}
