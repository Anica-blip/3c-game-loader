// loader.js (module)
async function fetchConfigFromUrlOrName() {
  // If query has configUrl, load from that direct URL (used by admin preview)
  const urlParams = new URLSearchParams(window.location.search);
  const configUrl = urlParams.get('configUrl');
  const configName = urlParams.get('configName') || 'card-flip';

  if (configUrl) {
    return fetch(configUrl).then(r => r.json());
  }

  // default: load from config/{configName}.json
  return fetch(`config/${configName}.json`).then(r => {
    if (!r.ok) throw new Error('Config file not found');
    return r.json();
  });
}

function applyTheme(themeName) {
  if (!themeName) return;
  const bg = `assets/themes/${themeName}/bg.png`;
  // set body background (fallback silently if missing)
  document.body.style.backgroundImage = `url('${bg}')`;
  document.body.style.backgroundSize = 'cover';
  document.body.style.backgroundPosition = 'center';
  // set css var for card back
  document.documentElement.style.setProperty('--card-back', `url('assets/themes/${themeName}/card-back.png')`);
}

function showError(message) {
  const container = document.getElementById('game-container');
  container.innerHTML = `<div class="loader-message"><p>${message}</p></div>`;
}

async function loadGame() {
  try {
    const config = await fetchConfigFromUrlOrName();

    // Apply theme assets
    applyTheme(config.theme);

    // load module dynamically from /games/<gameType>.js
    const modulePath = `./games/${config.gameType}.js`;
    const module = await import(modulePath);

    const container = document.getElementById('game-container');
    // clear container and start game
    container.innerHTML = '';
    module.startGame(config, container);
  } catch (err) {
    console.error('Loader error:', err);
    showError('Failed to load game. Check console for details.');
  }
}

// Start the loader
loadGame();

