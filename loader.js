// loader.js (enhanced version)

/**
 * Configuration and URL parameter handling
 */
class ConfigManager {
  static getUrlParams() {
    return new URLSearchParams(window.location.search);
  }

  static async fetchConfigFromUrlOrName() {
    const urlParams = this.getUrlParams();
    const configUrl = urlParams.get('configUrl');
    const configName = urlParams.get('configName') || 'card-flip';
    
    try {
      if (configUrl) {
        return await this.fetchFromUrl(configUrl);
      }
      return await this.fetchFromName(configName);
    } catch (error) {
      throw new ConfigError(`Failed to load configuration: ${error.message}`, error.type);
    }
  }

  static async fetchFromUrl(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  static async fetchFromName(configName) {
    const response = await fetch(`config/${configName}.json`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Config file '${configName}.json' not found`);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  static validateConfig(config) {
    const required = ['gameType'];
    const missing = required.filter(field => !config[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required config fields: ${missing.join(', ')}`);
    }
    
    return true;
  }
}

/**
 * Theme and asset management
 */
class ThemeManager {
  static applyTheme(themeName) {
    if (!themeName) {
      console.warn('No theme specified, using default styling');
      return;
    }

    this.setBackground(themeName);
    this.setCardBack(themeName);
    this.preloadThemeAssets(themeName);
  }

  static setBackground(themeName) {
    const bgUrl = `assets/themes/${themeName}/bg.png`;
    const body = document.body;
    
    body.style.backgroundImage = `url('${bgUrl}')`;
    body.style.backgroundSize = 'cover';
    body.style.backgroundPosition = 'center';
    body.style.backgroundRepeat = 'no-repeat';
  }

  static setCardBack(themeName) {
    const cardBackUrl = `url('assets/themes/${themeName}/card-back.png')`;
    document.documentElement.style.setProperty('--card-back', cardBackUrl);
  }

  static async preloadThemeAssets(themeName) {
    const assets = [
      `assets/themes/${themeName}/bg.png`,
      `assets/themes/${themeName}/card-back.png`
    ];

    // Preload images for better performance
    const preloadPromises = assets.map(src => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = img.onerror = () => resolve(); // Resolve either way
        img.src = src;
      });
    });

    try {
      await Promise.all(preloadPromises);
      console.log(`Theme '${themeName}' assets preloaded`);
    } catch (error) {
      console.warn('Some theme assets failed to preload:', error);
    }
  }
}

/**
 * Game module management
 */
class GameManager {
  static async loadGameModule(gameType) {
    const modulePath = `./games/${gameType}.js`;
    
    try {
      const module = await import(modulePath);
      
      if (typeof module.startGame !== 'function') {
        throw new Error(`Game module '${gameType}' missing startGame function`);
      }
      
      return module;
    } catch (error) {
      if (error.message.includes('Failed to resolve module')) {
        throw new Error(`Game module '${gameType}.js' not found`);
      }
      throw error;
    }
  }

  static initializeGame(module, config, container) {
    try {
      container.innerHTML = '';
      module.startGame(config, container);
      console.log(`Game '${config.gameType}' initialized successfully`);
    } catch (error) {
      throw new Error(`Failed to initialize game: ${error.message}`);
    }
  }
}

/**
 * UI and error display management
 */
class UIManager {
  static showError(message, details = null) {
    const container = document.getElementById('game-container');
    const detailsHtml = details ? `<details><summary>Technical Details</summary><pre>${details}</pre></details>` : '';
    
    container.innerHTML = `
      <div class="loader-message error">
        <h3>🎮 Oops! Something went wrong</h3>
        <p>${message}</p>
        ${detailsHtml}
        <button onclick="location.reload()" class="retry-button">Try Again</button>
      </div>
    `;
  }

  static showLoading(message = 'Loading game...') {
    const container = document.getElementById('game-container');
    container.innerHTML = `
      <div class="loader-message">
        <div class="spinner"></div>
        <p>${message}</p>
      </div>
    `;
  }
}

/**
 * Custom error types for better error handling
 */
class ConfigError extends Error {
  constructor(message, type = 'CONFIG_ERROR') {
    super(message);
    this.name = 'ConfigError';
    this.type = type;
  }
}

class GameError extends Error {
  constructor(message, type = 'GAME_ERROR') {
    super(message);
    this.name = 'GameError';
    this.type = type;
  }
}

/**
 * Main game loader orchestration
 */
class GameLoader {
  static async initialize() {
    try {
      UIManager.showLoading('Loading configuration...');
      
      // Step 1: Load and validate configuration
      const config = await ConfigManager.fetchConfigFromUrlOrName();
      ConfigManager.validateConfig(config);
      
      UIManager.showLoading('Applying theme...');
      
      // Step 2: Apply theme
      await ThemeManager.applyTheme(config.theme);
      
      UIManager.showLoading('Loading game module...');
      
      // Step 3: Load game module
      const gameModule = await GameManager.loadGameModule(config.gameType);
      
      UIManager.showLoading('Initializing game...');
      
      // Step 4: Initialize game
      const container = document.getElementById('game-container');
      GameManager.initializeGame(gameModule, config, container);
      
    } catch (error) {
      console.error('Game loader error:', error);
      
      // Provide user-friendly error messages based on error type
      let userMessage = 'Failed to load game. Please try again.';
      
      if (error instanceof ConfigError) {
        userMessage = 'Game configuration error. Please check the game settings.';
      } else if (error.message.includes('not found')) {
        userMessage = 'Game files are missing. Please check the installation.';
      } else if (error.message.includes('network')) {
        userMessage = 'Network error. Please check your connection and try again.';
      }
      
      UIManager.showError(userMessage, error.message);
    }
  }
}

// Initialize the game loader when the script loads
GameLoader.initialize();

