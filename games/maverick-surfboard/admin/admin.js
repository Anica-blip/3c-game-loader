// Repo path: games/maverick-surfboard/admin/admin.js

const REPO_OWNER = 'Anica-blip';
const REPO_NAME = '3c-game-loader';
const CONFIG_DIR = 'games/maverick-surfboard/config';
const PAT_STORAGE_KEY = 'maverickAdminPAT';
const DEFAULT_THEME = 'maverick-surfboard';

const MOTION_OPTIONS = [
  { value: 'glide-bob', label: 'Glide and bob' },
  { value: 'straight-glide', label: 'Straight glide' },
  { value: 'wave-jump', label: 'Wave jump' },
  { value: 'wipeout-spin', label: 'Wipeout spin' }
];

let state = null;
let currentSha = null;
let currentTheme = DEFAULT_THEME;
let activeSceneIndex = 0;

const connectPanel = document.getElementById('connect-panel');
const editorPanel = document.getElementById('editor-panel');
const patInput = document.getElementById('pat-input');
const connectBtn = document.getElementById('connect-btn');
const connectStatus = document.getElementById('connect-status');
const editorStatus = document.getElementById('editor-status');
const reloadBtn = document.getElementById('reload-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const saveBtn = document.getElementById('save-btn');
const saveAsBtn = document.getElementById('save-as-btn');
const exportBtn = document.getElementById('export-btn');
const saveStatus = document.getElementById('save-status');
const globalRoot = document.getElementById('global-root');
const sceneTabs = document.getElementById('scene-tabs');
const activeLeft = document.getElementById('active-scene-left');
const activeRight = document.getElementById('active-scene-right');
const resultsRoot = document.getElementById('results-root');
const themeSelect = document.getElementById('theme-select');
const newThemeBtn = document.getElementById('new-theme-btn');

function b64DecodeUnicode(str) {
  return decodeURIComponent(
    atob(str.replace(/\n/g, '')).split('').map(c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join('')
  );
}

function b64EncodeUnicode(str) {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      (match, p1) => String.fromCharCode('0x' + p1))
  );
}

function apiHeaders() {
  const pat = localStorage.getItem(PAT_STORAGE_KEY);
  return {
    'Authorization': `Bearer ${pat}`,
    'Accept': 'application/vnd.github+json'
  };
}

function slugify(name) {
  return name.trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function blankScene() {
  return {
    situation: '',
    image: { label: '', url: '' },
    motion: 'glide-bob',
    verticalPosition: 40,
    soundEffect: '',
    background: { type: 'image', url: '' },
    options: [
      { text: '', scoreDelta: 1 },
      { text: '', scoreDelta: 1 }
    ]
  };
}

// ---- GitHub API ----

async function listThemes() {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${CONFIG_DIR}`;
  const res = await fetch(url, { headers: apiHeaders() });
  if (!res.ok) {
    throw new Error(`GitHub error ${res.status}: could not list themes`);
  }
  const data = await res.json();
  return data
    .filter(item => item.type === 'file' && item.name.endsWith('.json'))
    .map(item => item.name.replace(/\.json$/, ''));
}

async function fetchThemeConfig(themeName) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${CONFIG_DIR}/${themeName}.json`;
  const res = await fetch(url, { headers: apiHeaders() });
  if (!res.ok) {
    throw new Error(`GitHub error ${res.status}: could not read "${themeName}"`);
  }
  const data = await res.json();
  currentSha = data.sha;
  return JSON.parse(b64DecodeUnicode(data.content));
}

async function writeThemeConfig(themeName, isNewFile) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${CONFIG_DIR}/${themeName}.json`;
  const body = {
    message: isNewFile
      ? `Create new theme "${themeName}" via admin panel`
      : `Update theme "${themeName}" via admin panel`,
    content: b64EncodeUnicode(JSON.stringify(state, null, 2)),
    branch: 'main'
  };
  if (!isNewFile) {
    body.sha = currentSha;
  }
  const res = await fetch(url, {
    method: 'PUT',
    headers: { ...apiHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`GitHub error ${res.status}: ${errText}`);
  }
  const data = await res.json();
  currentSha = data.content.sha;
}

// ---- small field builders ----

function fieldWrap(labelText, inputEl) {
  const wrap = document.createElement('div');
  const label = document.createElement('label');
  label.className = 'admin-label';
  label.textContent = labelText;
  wrap.appendChild(label);
  wrap.appendChild(inputEl);
  return wrap;
}

function textField(labelText, value, onChange) {
  const input = document.createElement('input');
  input.className = 'admin-input';
  input.type = 'text';
  input.value = value || '';
  input.addEventListener('input', () => onChange(input.value));
  return fieldWrap(labelText, input);
}

function numberField(labelText, value, onChange) {
  const input = document.createElement('input');
  input.className = 'admin-input';
  input.type = 'number';
  input.value = value ?? 0;
  input.addEventListener('input', () => onChange(Number(input.value)));
  return fieldWrap(labelText, input);
}

function textareaField(labelText, value, onChange, large) {
  const textarea = document.createElement('textarea');
  textarea.className = large ? 'admin-textarea admin-textarea-large' : 'admin-textarea';
  textarea.value = value || '';
  textarea.addEventListener('input', () => onChange(textarea.value));
  return fieldWrap(labelText, textarea);
}

function selectField(labelText, value, options, onChange) {
  const select = document.createElement('select');
  select.className = 'admin-select';
  options.forEach(opt => {
    const optionEl = document.createElement('option');
    optionEl.value = opt.value;
    optionEl.textContent = opt.label;
    if (opt.value === value) optionEl.selected = true;
    select.appendChild(optionEl);
  });
  select.addEventListener('change', () => onChange(select.value));
  return fieldWrap(labelText, select);
}

function sliderField(labelText, value, min, max, onChange) {
  const wrap = document.createElement('div');
  const label = document.createElement('label');
  label.className = 'admin-label';
  label.textContent = labelText;
  wrap.appendChild(label);

  const row = document.createElement('div');
  row.className = 'admin-slider-row';

  const input = document.createElement('input');
  input.type = 'range';
  input.min = min;
  input.max = max;
  input.value = value ?? min;

  const valueLabel = document.createElement('span');
  valueLabel.className = 'admin-slider-value';
  valueLabel.textContent = input.value;

  input.addEventListener('input', () => {
    valueLabel.textContent = input.value;
    onChange(Number(input.value));
  });

  row.append(input, valueLabel);
  wrap.appendChild(row);
  return wrap;
}

function sectionTitle(text) {
  const el = document.createElement('div');
  el.className = 'admin-section-title';
  el.textContent = text;
  return el;
}

// ---- main render ----

function renderForm() {
  renderGlobal();
  renderSceneTabs();
  renderActiveScene();
  renderResults();
}

// Top, full width: only what's genuinely global, nothing scene-specific
function renderGlobal() {
  globalRoot.innerHTML = '';
  globalRoot.appendChild(sectionTitle('Main settings'));

  globalRoot.appendChild(textField('Title', state.title, v => { state.title = v; }));

  const soundSection = document.createElement('div');
  soundSection.className = 'admin-section';
  soundSection.appendChild(sectionTitle('Ambient sound'));
  soundSection.appendChild(textField(
    'Cloudflare URL (.mp3, leave blank for silence)',
    state.ambientSound,
    v => { state.ambientSound = v; }
  ));
  soundSection.appendChild(sliderField(
    'Volume (0 to 5, 5 is full track volume)',
    state.ambientVolume ?? 3, 0, 5,
    v => { state.ambientVolume = v; }
  ));
  globalRoot.appendChild(soundSection);

  globalRoot.appendChild(textField(
    'Intro image (repo path, do not use a Cloudflare URL here)',
    state.introImage,
    v => { state.introImage = v; }
  ));

  globalRoot.appendChild(textField(
    'Finale image (repo path, do not use a Cloudflare URL here)',
    state.finaleImage,
    v => { state.finaleImage = v; }
  ));

  const creditsSection = document.createElement('div');
  creditsSection.className = 'admin-section';
  creditsSection.appendChild(sectionTitle('Credits'));
  creditsSection.appendChild(textareaField(
    'Credits text (shown on its own screen after the result)',
    state.credits,
    v => { state.credits = v; },
    true
  ));
  globalRoot.appendChild(creditsSection);
}

// The tab bar itself
function renderSceneTabs() {
  sceneTabs.innerHTML = '';
  if (!state.decisions) state.decisions = [];

  if (activeSceneIndex >= state.decisions.length) {
    activeSceneIndex = state.decisions.length - 1;
  }

  state.decisions.forEach((decision, index) => {
    const tab = document.createElement('button');
    tab.className = 'admin-tab' + (index === activeSceneIndex ? ' admin-tab-active' : '');

    const label = document.createElement('span');
    label.textContent = `Scene ${index + 1}`;
    tab.appendChild(label);

    const closeBtn = document.createElement('span');
    closeBtn.className = 'admin-tab-close';
    closeBtn.textContent = 'x';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      state.decisions.splice(index, 1);
      if (activeSceneIndex >= state.decisions.length) {
        activeSceneIndex = state.decisions.length - 1;
      }
      renderForm();
    });
    tab.appendChild(closeBtn);

    tab.addEventListener('click', () => {
      activeSceneIndex = index;
      renderForm();
    });

    sceneTabs.appendChild(tab);
  });

  const addTab = document.createElement('button');
  addTab.className = 'admin-tab admin-tab-add';
  addTab.textContent = '+ Add scene';
  addTab.addEventListener('click', () => {
    state.decisions.push(blankScene());
    activeSceneIndex = state.decisions.length - 1;
    renderForm();
  });
  sceneTabs.appendChild(addTab);
}

// Whichever scene is active: left panel (stage) and right panel (content), both fully its own
function renderActiveScene() {
  activeLeft.innerHTML = '';
  activeRight.innerHTML = '';

  const decision = state.decisions[activeSceneIndex];

  if (!decision) {
    const msg = document.createElement('p');
    msg.className = 'admin-help';
    msg.textContent = 'No scenes yet. Click "+ Add scene" above to create the first one.';
    activeLeft.appendChild(msg);
    return;
  }

  // Left: setting the stage for this scene only
  activeLeft.appendChild(sectionTitle(`Scene ${activeSceneIndex + 1}, setting the stage`));

  if (!decision.background) decision.background = { type: 'image', url: '' };
  const bgLabel = document.createElement('span');
  bgLabel.className = 'admin-small-label';
  bgLabel.textContent = 'Background image';
  activeLeft.appendChild(bgLabel);
  activeLeft.appendChild(selectField(
    'Type',
    decision.background.type,
    [{ value: 'image', label: 'Image' }, { value: 'video', label: 'Video' }],
    v => { decision.background.type = v; }
  ));
  activeLeft.appendChild(textField('Cloudflare URL', decision.background.url, v => { decision.background.url = v; }));

  if (!decision.image) decision.image = { label: '', url: '' };
  const imgLabel = document.createElement('span');
  imgLabel.className = 'admin-small-label';
  imgLabel.textContent = 'Duck image';
  activeLeft.appendChild(imgLabel);
  activeLeft.appendChild(textField('Name', decision.image.label, v => { decision.image.label = v; }));
  activeLeft.appendChild(textField('Cloudflare URL', decision.image.url, v => { decision.image.url = v; }));

  activeLeft.appendChild(selectField('Motion', decision.motion, MOTION_OPTIONS, v => { decision.motion = v; }));
  activeLeft.appendChild(sliderField('Vertical start position (0 top, 100 bottom)', decision.verticalPosition ?? 40, 0, 100, v => { decision.verticalPosition = v; }));
  activeLeft.appendChild(textField('Voice line Cloudflare URL (.mp3, optional)', decision.soundEffect, v => { decision.soundEffect = v; }));

  // Right: setting the scene, situation and choices only
  activeRight.appendChild(sectionTitle(`Scene ${activeSceneIndex + 1}, setting the scene`));
  activeRight.appendChild(textareaField('Situation', decision.situation, v => { decision.situation = v; }));
  activeRight.appendChild(renderOptions(decision));
}

function renderOptions(decision) {
  const wrap = document.createElement('div');
  const label = document.createElement('span');
  label.className = 'admin-small-label';
  label.textContent = 'Answer choices';
  wrap.appendChild(label);

  if (!decision.options) decision.options = [];

  decision.options.forEach((option, index) => {
    const row = document.createElement('div');
    row.className = 'admin-item-row';

    const textInput = document.createElement('input');
    textInput.className = 'admin-input';
    textInput.type = 'text';
    textInput.placeholder = 'Choice text';
    textInput.value = option.text || '';
    textInput.addEventListener('input', () => { option.text = textInput.value; });

    const scoreInput = document.createElement('input');
    scoreInput.className = 'admin-input';
    scoreInput.type = 'number';
    scoreInput.style.maxWidth = '80px';
    scoreInput.value = option.scoreDelta ?? 1;
    scoreInput.addEventListener('input', () => { option.scoreDelta = Number(scoreInput.value); });

    const removeBtn = document.createElement('button');
    removeBtn.className = 'admin-btn admin-btn-remove';
    removeBtn.textContent = 'x';
    removeBtn.addEventListener('click', () => {
      decision.options.splice(index, 1);
      renderForm();
    });

    row.append(textInput, scoreInput, removeBtn);
    wrap.appendChild(row);
  });

  const addOptBtn = document.createElement('button');
  addOptBtn.className = 'admin-btn';
  addOptBtn.style.marginTop = '6px';
  addOptBtn.textContent = 'Add choice';
  addOptBtn.addEventListener('click', () => {
    decision.options.push({ text: '', scoreDelta: 1 });
    renderForm();
  });
  wrap.appendChild(addOptBtn);

  return wrap;
}

function renderResults() {
  resultsRoot.innerHTML = '';
  const section = document.createElement('div');
  section.className = 'admin-section';
  section.appendChild(sectionTitle('Results'));

  if (!state.results) state.results = [];

  state.results.forEach((result, index) => {
    const card = document.createElement('div');
    card.className = 'admin-item-card';

    const header = document.createElement('div');
    header.className = 'admin-row-header';
    const heading = document.createElement('span');
    heading.className = 'admin-small-label';
    heading.textContent = `Result band ${index + 1}`;
    const removeBtn = document.createElement('button');
    removeBtn.className = 'admin-btn admin-btn-remove';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => {
      state.results.splice(index, 1);
      renderForm();
    });
    header.append(heading, removeBtn);
    card.appendChild(header);

    card.appendChild(numberField('Min score', result.minScore, v => { result.minScore = v; }));
    card.appendChild(numberField('Max score', result.maxScore, v => { result.maxScore = v; }));
    card.appendChild(textField('Title', result.title, v => { result.title = v; }));
    card.appendChild(textareaField('Message', result.message, v => { result.message = v; }));

    section.appendChild(card);
  });

  const addBtn = document.createElement('button');
  addBtn.className = 'admin-btn';
  addBtn.textContent = 'Add result band';
  addBtn.addEventListener('click', () => {
    state.results.push({ minScore: 0, maxScore: 0, title: '', message: '' });
    renderForm();
  });
  section.appendChild(addBtn);

  resultsRoot.appendChild(section);
}

// ---- theme list / switching ----

async function refreshThemeList(selectName) {
  const themes = await listThemes();
  themeSelect.innerHTML = '';
  themes.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    themeSelect.appendChild(opt);
  });
  if (selectName && themes.includes(selectName)) {
    themeSelect.value = selectName;
  }
  return themes;
}

async function loadTheme(themeName) {
  editorStatus.textContent = `Loading "${themeName}"...`;
  try {
    state = await fetchThemeConfig(themeName);
    currentTheme = themeName;
    activeSceneIndex = 0;
    themeSelect.value = themeName;
    editorStatus.textContent = `Editing "${themeName}"`;
    renderForm();
  } catch (err) {
    editorStatus.textContent = err.message;
  }
}

themeSelect.addEventListener('change', () => {
  loadTheme(themeSelect.value);
});

newThemeBtn.addEventListener('click', () => {
  const raw = window.prompt('Name for the new theme (letters, numbers, dashes only):');
  if (!raw) return;
  const slug = slugify(raw);
  if (!slug) {
    saveStatus.textContent = 'That name did not produce a usable file name, try again.';
    return;
  }
  state = JSON.parse(JSON.stringify(state));
  currentSha = null;
  currentTheme = slug;
  activeSceneIndex = 0;
  themeSelect.value = '';
  editorStatus.textContent = `New theme "${slug}" (not saved yet)`;
  renderForm();
  saveStatus.textContent = 'This is a new theme. Use "Save as new theme" to write it to the repo.';
});

// ---- connect / save wiring ----

connectBtn.addEventListener('click', async () => {
  const pat = patInput.value.trim();
  if (!pat) {
    connectStatus.textContent = 'Paste your token first.';
    return;
  }
  localStorage.setItem(PAT_STORAGE_KEY, pat);
  connectStatus.textContent = 'Connecting...';
  try {
    const themes = await refreshThemeList();
    connectPanel.style.display = 'none';
    editorPanel.style.display = 'block';
    const startTheme = themes.includes(DEFAULT_THEME) ? DEFAULT_THEME : themes[0];
    if (startTheme) {
      await loadTheme(startTheme);
    }
  } catch (err) {
    connectStatus.textContent = `Could not connect: ${err.message}`;
    localStorage.removeItem(PAT_STORAGE_KEY);
  }
});

reloadBtn.addEventListener('click', async () => {
  await refreshThemeList(currentTheme);
  await loadTheme(currentTheme);
});

disconnectBtn.addEventListener('click', () => {
  localStorage.removeItem(PAT_STORAGE_KEY);
  editorPanel.style.display = 'none';
  connectPanel.style.display = 'block';
  patInput.value = '';
  connectStatus.textContent = '';
});

saveBtn.addEventListener('click', async () => {
  saveStatus.textContent = 'Saving...';
  try {
    await writeThemeConfig(currentTheme, false);
    saveStatus.textContent = `Saved "${currentTheme}". Refresh the game page (?configName=${currentTheme}) to see the changes.`;
  } catch (err) {
    saveStatus.textContent = `Save failed: ${err.message}`;
  }
});

saveAsBtn.addEventListener('click', async () => {
  const raw = window.prompt('Save as new theme, name:', currentTheme);
  if (!raw) return;
  const slug = slugify(raw);
  if (!slug) {
    saveStatus.textContent = 'That name did not produce a usable file name, try again.';
    return;
  }
  saveStatus.textContent = `Creating "${slug}"...`;
  try {
    await writeThemeConfig(slug, true);
    currentTheme = slug;
    currentSha = null;
    await refreshThemeList(slug);
    saveStatus.textContent = `Created "${slug}". This game's URL will use ?configName=${slug}`;
  } catch (err) {
    saveStatus.textContent = `Save failed: ${err.message}`;
  }
});

exportBtn.addEventListener('click', () => {
  const baseName = state.title ? slugify(state.title) : (currentTheme || 'theme');
  const filename = `${baseName}.json`;
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  saveStatus.textContent = `Downloaded ${filename}. Rename it however you like, then add it to games/maverick-surfboard/config/ in the repo.`;
});

// On load, if a token is already saved, skip straight to the theme list
(async function init() {
  const savedPat = localStorage.getItem(PAT_STORAGE_KEY);
  if (savedPat) {
    connectPanel.style.display = 'none';
    editorPanel.style.display = 'block';
    try {
      const themes = await refreshThemeList();
      const startTheme = themes.includes(DEFAULT_THEME) ? DEFAULT_THEME : themes[0];
      if (startTheme) await loadTheme(startTheme);
    } catch (err) {
      editorStatus.textContent = err.message;
    }
  }
})();
