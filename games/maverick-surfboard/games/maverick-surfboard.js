// Repo path: games/maverick-surfboard/games/maverick-surfboard.js

const MOTION_DURATION = 3200;

const MOTION_PRESETS = {
  'glide-bob': (progress) => Math.sin(progress * Math.PI * 8) * 12,
  'straight-glide': () => 0,
  'wave-jump': (progress) => -Math.abs(Math.sin(progress * Math.PI * 5)) * 25
};

export function startGame(config, container) {
  let score = 0;
  let decisionIndex = 0;
  let ambientAudio = null;
  let rafId = null;

  container.classList.add('maverick-game');
  container.innerHTML = '';

  const exitBtn = document.createElement('button');
  exitBtn.className = 'maverick-exit-btn';
  exitBtn.textContent = '\u2715';
  exitBtn.setAttribute('aria-label', 'Exit challenge');
  exitBtn.addEventListener('click', () => {
    window.location.href = 'landing.html';
  });
  container.appendChild(exitBtn);

  const bgLayer = document.createElement('div');
  bgLayer.className = 'maverick-bg-layer';
  container.appendChild(bgLayer);
  setupBackground(bgLayer, config.background);

  const content = document.createElement('div');
  content.className = 'maverick-content';
  container.appendChild(content);

  renderIntro();

  function setupBackground(layer, background) {
    layer.innerHTML = '';
    layer.classList.remove('maverick-bg-image');
    layer.style.backgroundImage = '';

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
  }

  function getCharacterImage(id) {
    const list = config.characterImages || [];
    const found = list.find(img => img.id === id);
    return found ? found.url : (list[0] ? list[0].url : '');
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
      renderFinale();
      return;
    }

    const decision = config.decisions[decisionIndex];
    const motionFn = MOTION_PRESETS[decision.motion] || MOTION_PRESETS['glide-bob'];
    const verticalPercent = typeof decision.verticalPosition === 'number' ? decision.verticalPosition : 40;

    const sceneBackground = (decision.background && decision.background.url) ? decision.background : config.background;
    setupBackground(bgLayer, sceneBackground);

    content.innerHTML = '';
    const stage = document.createElement('div');
    stage.className = 'maverick-stage';

    const progressLabel = document.createElement('div');
    progressLabel.className = 'maverick-progress';
    progressLabel.textContent = `${decisionIndex + 1} of ${config.decisions.length}`;

    const duck = document.createElement('img');
    duck.src = getCharacterImage(decision.characterImageId);
    duck.alt = 'Character in motion';
    duck.className = 'maverick-duck-img maverick-duck-surf maverick-duck-moving';
    duck.style.top = `${verticalPercent}%`;

    stage.append(progressLabel, duck);
    content.appendChild(stage);

    let start = null;
    function animate(ts) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / MOTION_DURATION, 1);

      const trackWidth = stage.clientWidth - duck.clientWidth;
      const x = progress * trackWidth;
      const y = motionFn(progress);

      duck.style.transform = `translate(${x}px, ${y}px)`;

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

  function renderFinale() {
    if (ambientAudio) ambientAudio.pause();
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

    const creditsBtn = document.createElement('button');
    creditsBtn.className = 'maverick-btn-link';
    creditsBtn.textContent = 'Credits';
    creditsBtn.addEventListener('click', renderCredits);

    wrap.append(img, title, message, scoreLine, replayBtn, creditsBtn);
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
