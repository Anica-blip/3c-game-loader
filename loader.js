async function loadGame(configName) {
  try {
    // Load JSON config
    const config = await fetch(`config/${configName}.json`).then(res => res.json());

    // Apply theme assets dynamically
    applyTheme(config.theme);

    // Load corresponding game logic
    const module = await import(`./games/${config.gameType}.js`);
    const container = document.getElementById('game-container');

    // Start game
    module.startGame(config, container);

  } catch (err) {
    console.error("Error loading game:", err);
    document.getElementById('game-container').innerHTML = `<p>Failed to load game.</p>`;
  }
}

function applyTheme(themeName) {
  document.body.style.backgroundImage = `url('assets/themes/${themeName}/bg.png')`;
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundPosition = "center";
  document.documentElement.style.setProperty('--card-back', `url('assets/themes/${themeName}/card-back.png')`);
}

// Load example game
loadGame('card-flip');

