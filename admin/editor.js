// admin/editor.js (module)
import { formatSlug } from '../main.js';

const titleInput = document.getElementById('gameTitle');
const themeSelect = document.getElementById('themeSelect');
const messagesInput = document.getElementById('cardMessages');
const previewBtn = document.getElementById('previewBtn');
const generateBtn = document.getElementById('generateConfig');
const saveLocalBtn = document.getElementById('saveLocalBtn');
const previewFrame = document.getElementById('previewFrame');
const slugInput = document.getElementById('slugInput');
const gameNumberInput = document.getElementById('gameNumber');

// Simple game number generator (reads from localStorage so numbers persist locally)
function nextGameNumber() {
  const key = '3c_next_game_number';
  const n = parseInt(localStorage.getItem(key) || '0', 10) + 1;
  localStorage.setItem(key, String(n));
  return n;
}

function buildConfig() {
  const title = titleInput.value.trim() || 'Pick Your 3C Card';
  const theme = themeSelect.value || 'theme1';
  const messages = messagesInput.value.split('\n').map(s => s.trim()).filter(Boolean);
  const cards = messages.map((m, i) => ({
    id: i + 1,
    frontImage: `card${i+1}.png`,
    message: m
  }));

  const slug = formatSlug(title);
  const gameNumber = `game-${String(nextGameNumber()).padStart(3, '0')}`;

  // Update UI fields
  slugInput.value = slug;
  gameNumberInput.value = gameNumber;

  return {
    meta: {
      title, slug, gameNumber, theme
    },
    config: {
      gameType: 'card-flip',
      theme,
      title,
      cards,
      settings: { cardFlipSpeed: 500, displayMs: 2200, stayOpen: false, allowReplay: true }
    }
  };
}

function downloadBlob(filename, content) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

generateBtn.addEventListener('click', () => {
  const { meta, config } = buildConfig();
  downloadBlob(`${meta.gameNumber}.json`, JSON.stringify(config, null, 2));
});

saveLocalBtn.addEventListener('click', () => {
  const { meta, config } = buildConfig();
  // Offer download named for easy manual upload to /config in repo
  downloadBlob(`config-${meta.gameNumber}.json`, JSON.stringify(config, null, 2));
  alert('Config downloaded. Upload the file to your repo /config folder and name it appropriately (e.g., card-flip.json or game-001.json).');
});

previewBtn.addEventListener('click', () => {
  const { config } = buildConfig();
  // Create blob URL and pass it to index.html as configUrl param for live preview
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  // set iframe to index.html?configUrl=<blob>
  previewFrame.src = `../index.html?configUrl=${encodeURIComponent(url)}`;
});

// init some defaults
titleInput.value = 'Pick Your 3C Card';
messagesInput.value =
  'You are unstoppable today!\nFocus brings clarity.\nYour effort will pay off soon.\nBelieve in your instincts.\nToday is your turning point.\nCourage is your superpower.';
slugInput.value = formatSlug(titleInput.value);
