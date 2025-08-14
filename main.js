// main.js - Enhanced utility library for 3C Game Loader
// Shared utilities and helper functions for all game modules

/**
 * String and formatting utilities
 */
export const StringUtils = {
  /**
   * Convert a name to URL-friendly slug
   * @param {string} name - The name to convert
   * @returns {string} URL-friendly slug
   */
  formatSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  },

  /**
   * Capitalize first letter of each word
   * @param {string} str - String to capitalize
   * @returns {string} Title-cased string
   */
  toTitleCase(str) {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  },

  /**
   * Truncate string with ellipsis
   * @param {string} str - String to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated string
   */
  truncate(str, maxLength) {
    return str.length <= maxLength ? str : str.slice(0, maxLength - 3) + '...';
  },

  /**
   * Generate random ID string
   * @param {number} length - Length of ID (default: 8)
   * @returns {string} Random ID
   */
  generateId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
};

/**
 * Array and collection utilities
 */
export const ArrayUtils = {
  /**
   * Shuffle array using Fisher-Yates algorithm
   * @param {Array} array - Array to shuffle
   * @returns {Array} Shuffled array (new array, original unchanged)
   */
  shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  /**
   * Get random item from array
   * @param {Array} array - Array to pick from
   * @returns {*} Random item
   */
  randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
  },

  /**
   * Get multiple random items from array
   * @param {Array} array - Array to pick from
   * @param {number} count - Number of items to pick
   * @returns {Array} Array of random items
   */
  randomItems(array, count) {
    const shuffled = this.shuffle(array);
    return shuffled.slice(0, Math.min(count, array.length));
  },

  /**
   * Create array of pairs for memory games
   * @param {Array} items - Items to create pairs from
   * @returns {Array} Shuffled array with each item twice
   */
  createPairs(items) {
    const pairs = [...items, ...items];
    return this.shuffle(pairs);
  },

  /**
   * Chunk array into smaller arrays
   * @param {Array} array - Array to chunk
   * @param {number} size - Size of each chunk
   * @returns {Array} Array of chunks
   */
  chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
};

/**
 * DOM manipulation utilities
 */
export const DOMUtils = {
  /**
   * Create element with attributes and content
   * @param {string} tag - Element tag name
   * @param {Object} attributes - Object with attributes
   * @param {string|Array} content - Text content or array of child elements
   * @returns {HTMLElement} Created element
   */
  createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'dataset') {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue;
        });
      } else {
        element.setAttribute(key, value);
      }
    });
    
    // Set content
    if (typeof content === 'string') {
      element.textContent = content;
    } else if (Array.isArray(content)) {
      content.forEach(child => {
        if (typeof child === 'string') {
          element.appendChild(document.createTextNode(child));
        } else {
          element.appendChild(child);
        }
      });
    }
    
    return element;
  },

  /**
   * Add event listener with cleanup tracking
   * @param {HTMLElement} element - Element to add listener to
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   * @param {Object} options - Event options
   * @returns {Function} Cleanup function
   */
  addEventListenerWithCleanup(element, event, handler, options = {}) {
    element.addEventListener(event, handler, options);
    return () => element.removeEventListener(event, handler, options);
  },

  /**
   * Wait for element to appear in DOM
   * @param {string} selector - CSS selector
   * @param {number} timeout - Timeout in milliseconds (default: 5000)
   * @returns {Promise<HTMLElement>} Promise that resolves with element
   */
  waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }
};

/**
 * Animation and timing utilities
 */
export const AnimationUtils = {
  /**
   * Simple delay function
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Animate element with CSS classes
   * @param {HTMLElement} element - Element to animate
   * @param {string} animationClass - CSS class for animation
   * @param {number} duration - Animation duration (default: 300ms)
   * @returns {Promise} Promise that resolves when animation completes
   */
  async animateClass(element, animationClass, duration = 300) {
    element.classList.add(animationClass);
    await this.delay(duration);
    element.classList.remove(animationClass);
  },

  /**
   * Stagger animations for multiple elements
   * @param {Array} elements - Array of elements to animate
   * @param {string} animationClass - CSS class for animation
   * @param {number} staggerDelay - Delay between animations (default: 100ms)
   * @returns {Promise} Promise that resolves when all animations complete
   */
  async staggerAnimation(elements, animationClass, staggerDelay = 100) {
    const promises = elements.map((element, index) => 
      this.delay(index * staggerDelay).then(() => 
        this.animateClass(element, animationClass)
      )
    );
    await Promise.all(promises);
  }
};

/**
 * Game state management utilities
 */
export const GameStateUtils = {
  /**
   * Simple state manager for games
   */
  createStateManager(initialState = {}) {
    let state = { ...initialState };
    const listeners = [];

    return {
      getState: () => ({ ...state }),
      
      setState: (newState) => {
        const prevState = { ...state };
        state = { ...state, ...newState };
        listeners.forEach(listener => listener(state, prevState));
      },
      
      subscribe: (listener) => {
        listeners.push(listener);
        return () => {
          const index = listeners.indexOf(listener);
          if (index > -1) listeners.splice(index, 1);
        };
      },
      
      reset: () => {
        state = { ...initialState };
        listeners.forEach(listener => listener(state, {}));
      }
    };
  },

  /**
   * Score calculation utilities
   */
  calculateScore: {
    /**
     * Calculate score based on time and attempts
     * @param {number} baseScore - Base score for completion
     * @param {number} timeElapsed - Time in seconds
     * @param {number} attempts - Number of attempts/moves
     * @param {Object} multipliers - Score multipliers
     * @returns {number} Calculated score
     */
    timeAndAttempts(baseScore, timeElapsed, attempts, multipliers = {}) {
      const { timeBonus = 1, attemptPenalty = 0.1, maxBonus = 2 } = multipliers;
      
      let score = baseScore;
      
      // Time bonus (faster = higher score)
      const timeBonusPoints = Math.max(0, baseScore * timeBonus * (1 - timeElapsed / 300)); // 5 min baseline
      score += Math.min(timeBonusPoints, baseScore * maxBonus);
      
      // Attempt penalty (fewer attempts = higher score)
      const attemptPenalty_ = attempts * baseScore * attemptPenalty;
      score = Math.max(baseScore * 0.1, score - attemptPenalty_); // Minimum 10% of base
      
      return Math.round(score);
    }
  }
};

/**
 * Audio utilities (with fallback for missing audio files)
 */
export const AudioUtils = {
  /**
   * Play audio with fallback handling
   * @param {string} audioPath - Path to audio file
   * @param {Object} options - Audio options
   * @returns {Promise} Promise that resolves when audio plays or fails gracefully
   */
  async playAudio(audioPath, options = {}) {
    const { volume = 1, loop = false, fallbackSilent = true } = options;
    
    try {
      const audio = new Audio(audioPath);
      audio.volume = volume;
      audio.loop = loop;
      
      await audio.play();
      return audio;
    } catch (error) {
      if (!fallbackSilent) {
        console.warn(`Audio playback failed: ${audioPath}`, error);
      }
      return null;
    }
  },

  /**
   * Create audio context for web audio (for games needing advanced audio)
   * @returns {AudioContext|null} Audio context or null if not supported
   */
  createAudioContext() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      return new AudioContext();
    } catch (error) {
      console.warn('Web Audio API not supported');
      return null;
    }
  }
};

/**
 * Storage utilities (memory-based for Claude.ai compatibility)
 */
export const StorageUtils = {
  // In-memory storage (session-only)
  _storage: new Map(),

  /**
   * Store data in memory
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   */
  setItem(key, value) {
    try {
      this._storage.set(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Storage failed:', error);
    }
  },

  /**
   * Retrieve data from memory
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key not found
   * @returns {*} Stored value or default
   */
  getItem(key, defaultValue = null) {
    try {
      const value = this._storage.get(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.warn('Storage retrieval failed:', error);
      return defaultValue;
    }
  },

  /**
   * Remove item from storage
   * @param {string} key - Storage key
   */
  removeItem(key) {
    this._storage.delete(key);
  },

  /**
   * Clear all storage
   */
  clear() {
    this._storage.clear();
  },

  /**
   * Get all keys
   * @returns {Array} Array of all keys
   */
  keys() {
    return Array.from(this._storage.keys());
  }
};

/**
 * Performance utilities
 */
export const PerformanceUtils = {
  /**
   * Debounce function calls
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle function calls
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} Throttled function
   */
  throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Measure function execution time
   * @param {Function} func - Function to measure
   * @param {...*} args - Function arguments
   * @returns {Object} Result and timing info
   */
  measure(func, ...args) {
    const start = performance.now();
    const result = func(...args);
    const end = performance.now();
    
    return {
      result,
      duration: end - start,
      timestamp: start
    };
  }
};

/**
 * Validation utilities
 */
export const ValidationUtils = {
  /**
   * Validate game configuration
   * @param {Object} config - Game configuration
   * @param {Array} requiredFields - Required field names
   * @returns {Object} Validation result
   */
  validateConfig(config, requiredFields = []) {
    const errors = [];
    const warnings = [];

    // Check required fields
    requiredFields.forEach(field => {
      if (!config.hasOwnProperty(field) || config[field] === null || config[field] === undefined) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Check common game fields
    if (config.cards && !Array.isArray(config.cards)) {
      errors.push('Cards must be an array');
    }

    if (config.timeLimit && (typeof config.timeLimit !== 'number' || config.timeLimit <= 0)) {
      warnings.push('Invalid time limit, using default');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
};

// Export everything as default for easy importing
export default {
  StringUtils,
  ArrayUtils,
  DOMUtils,
  AnimationUtils,
  GameStateUtils,
  AudioUtils,
  StorageUtils,
  PerformanceUtils,
  ValidationUtils
};
