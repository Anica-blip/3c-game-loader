// Repo path: games/maverick-surfboard/games/maverick-surfboard.js
// (Yes, "games" inside "maverick-surfboard" — this matches where the shared
// engine automatically looks for a game module named "maverick-surfboard".
// No changes to the shared loader.js were needed.)

export function startGame(config, container) {
  let score = 0;
  let decisionIndex = 0;

  container.classList.add('maverick-game');
  if (config.background) {
    container.style.backgroundImage = `url('${config.background}')`;
  }

  renderIntro();

  function renderIntro() {
    container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'maverick-screen maverick-intro';

    const img = document.createElement('img');
    img.src = config.duckImages.intro;
    img.alt = 'Maverick the surfer duck';
    img.className = 'maverick-duck-img';

    const title = document.createElement('h1');
    title.textContent = config.title || "Maverick's Surf Challenge";

    const intro = document.createElement('p');
    intro.className = 'maverick-body-text';
    intro.textContent = "Maverick's heading out to catch some waves. Help him make the calls out there.";

    const startBtn = document.createElement('button');
    startBtn.className = 'maverick-btn maverick-btn-primary';
    startBtn.textContent = "Let's Go!";
    startBtn.addEventListener('click', () => {
      decisionIndex = 0;
      score = 0;
      renderDecision();
    });

    wrap.append(img, title, intro, startBtn);
    container.appendChild(wrap);
  }

  function renderDecision() {
    if (decisionIndex >= config.decisions.length) {
      renderFinale();
      return;
    }

    const decision = config.decisions[decisionIndex];

    container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'maverick-screen maverick-decision';

    const progress = document.createElement('div');
    progress.className = 'maverick-progress';
    progress.textContent = `Situation ${decisionIndex + 1} of ${config.decisions.length}`;

    const img = document.createElement('img');
    img.src = config.duckImages.surf;
    img.alt = 'Maverick surfing';
    img.className = 'maverick-duck-img maverick-duck-surf';

    const situation = document.createElement('p');
    situation.className = 'maverick-body-text';
    situation.textContent = decision.situation;

    const optionsWrap = document.createElement('div');
    optionsWrap.className = 'maverick-options';

    decision.options.forEach(option => {
      const btn = document.createElement('button');
      btn.className = 'maverick-btn maverick-btn-option';
      btn.textContent = option.text;
      btn.addEventListener('click', () => {
        score += option.scoreDelta;
        decisionIndex += 1;
        renderDecision();
      });
      optionsWrap.appendChild(btn);
    });

    wrap.append(progress, img, situation, optionsWrap);
    container.appendChild(wrap);
  }

  function renderFinale() {
    const result = config.results.find(r => score >= r.minScore && score <= r.maxScore)
      || config.results[config.results.length - 1];

    container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'maverick-screen maverick-finale';

    const img = document.createElement('img');
    img.src = config.duckImages.finale;
    img.alt = 'Maverick the surfer duck';
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
    replayBtn.textContent = 'Play Again';
    replayBtn.addEventListener('click', () => {
      decisionIndex = 0;
      score = 0;
      renderIntro();
    });

    wrap.append(img, title, message, scoreLine, replayBtn);
    container.appendChild(wrap);
  }
}
