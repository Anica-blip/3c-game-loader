async function loadGame(configName) {
  try {
    // Load JSON config
    const config = await fetch(`config/${configName}.json`).then(res => res.json());

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

// Example: load card-flip game
loadGame('card-flip');
