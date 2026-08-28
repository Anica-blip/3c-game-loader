// Repo path: games/aurion/admin/admin.js

const REPO_OWNER = 'Anica-blip';
const REPO_NAME = '3c-game-loader';
const CONFIG_DIR = 'games/aurion/config';
const PAT_STORAGE_KEY = 'gameAdminPAT';
const DEFAULT_THEME = 'aurion';

const MOTION_OPTIONS = [
  { value: '', label: 'Choose a motion' },
  { value: 'glide-bob', label: 'Glide and bob' },
  { value: 'straight-glide', label: 'Straight glide' },
  { value: 'wave-jump', label: 'Wave jump' },
  { value: 'wipeout-spin', label: 'Wipeout spin' },
  { value: 'zigzag', label: 'Zigzag' },
  { value: 'float-drift', label: 'Float and drift' },
  { value: 'bounce-hop', label: 'Bounce and hop' },
  { value: 'pulse-glow', label: 'Pulse and glow (stationary)' }
];

const HEADER_FONTS = [
  { value: 'Luckiest Guy', label: 'Luckiest Guy (Aurion default)' },
  { value: 'Bangers', label: 'Bangers' },
  { value: 'Fredoka', label: 'Fredoka' },
  { value: 'Montserrat', label: 'Montserrat (Maverick)' }
];

const BODY_FONTS = [
  { value: 'Poppins', label: 'Poppins (Aurion default)' },
  { value: 'Nunito', label: 'Nunito' },
  { value: 'Quicksand', label: 'Quicksand' },
  { value: 'Montserrat', label: 'Montserrat (Maverick)' }
];

const BUTTON_TEXT_COLORS = [
  { value: '#ffffff', label: 'White' },
  { value: '#000000', label: 'Black' }
];

const POSITION_OPTIONS = [
  { value: 'center', label: 'Center' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' }
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

function blankScene(id) {
  return {
    id: id,
    adminLabel: '',
    situation: '',
    image: { label: '', url: '' },
    motion: '',
    duration: 4,
    verticalPosition: 40,
    soundEffect: '',
    video: '',
    background: { type: 'image', url: '' },
    overlayImage: { url: '', position: 'center' },
    buttons: [{}],
    options: []
  };
}

// ---- GitHub API ----

async function listThemes() {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${CONFIG_DIR}`;
  const res = await fetch(url, { headers: apiHeaders(), cache: 'no-store' });
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
  const res = await fetch(url, { headers: apiHeaders(), cache: 'no-store' });
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

function colorField(labelText, value, onChange) {
  const input = document.createElement('input');
  input.type = 'color';
  input.className = 'admin-input';
  input.style.height = '38px';
  input.style.padding = '4px';
  input.value = value || '#f0b429';
  input.addEventListener('input', () => onChange(input.value));
  return fieldWrap(labelText, input);
}

function checkboxField(labelText, checked, onChange) {
  const wrap = document.createElement('label');
  wrap.className = 'admin-checkbox-row';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = !!checked;
  input.addEventListener('change', () => onChange(input.checked));
  const span = document.createElement('span');
  span.textContent = labelText;
  wrap.append(input, span);
  return wrap;
}

function sectionTitle(text) {
  const el = document.createElement('div');
  el.className = 'admin-section-title';
  el.textContent = text;
  return el;
}

function makeDrawer(titleText) {
  const drawer = document.createElement('div');
  drawer.className = 'admin-drawer';

  const header = document.createElement('div');
  header.className = 'admin-drawer-header';
  const title = document.createElement('span');
  title.textContent = titleText;
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'admin-drawer-close';
  closeBtn.textContent = '\u00d7';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.addEventListener('click', () => drawer.classList.remove('open'));
  header.append(title, closeBtn);
  drawer.appendChild(header);

  // Mounted on body directly — anything with backdrop-filter (like
  // .admin-card) creates a new positioning boundary that breaks
  // position:fixed for anything nested inside it.
  document.body.appendChild(drawer);
  return drawer;
}

function styledTextGroup(prefix, obj, fontOptions, defaults, sectionLabel, useTextarea) {
  const wrap = document.createElement('div');
  wrap.className = 'admin-styled-group';

  const label = document.createElement('span');
  label.className = 'admin-small-label';
  label.textContent = sectionLabel;
  wrap.appendChild(label);

  const row = document.createElement('div');
  row.className = 'admin-item-row';

  const contentEl = useTextarea ? document.createElement('textarea') : document.createElement('input');
  if (!useTextarea) contentEl.type = 'text';
  contentEl.className = useTextarea ? 'admin-textarea' : 'admin-input';
  contentEl.style.flex = '1';
  contentEl.value = obj[prefix + 'Text'] || '';
  contentEl.addEventListener('input', () => { obj[prefix + 'Text'] = contentEl.value; });

  const styleBtn = document.createElement('button');
  styleBtn.type = 'button';
  styleBtn.className = 'admin-btn admin-style-btn';
  styleBtn.textContent = 'Style';

  const drawer = makeDrawer(sectionLabel + ' style');
  drawer.appendChild(selectField('Font', obj[prefix + 'Font'] || defaults.font, fontOptions, v => { obj[prefix + 'Font'] = v; }));
  drawer.appendChild(colorField('Color', obj[prefix + 'Color'] || defaults.color, v => { obj[prefix + 'Color'] = v; }));
  drawer.appendChild(sliderField('Size (px)', obj[prefix + 'Size'] ?? defaults.size, defaults.minSize, defaults.maxSize, v => { obj[prefix + 'Size'] = v; }));
  drawer.appendChild(checkboxField('Bold', obj[prefix + 'Bold'] ?? defaults.bold, v => { obj[prefix + 'Bold'] = v; }));

  styleBtn.addEventListener('click', () => drawer.classList.add('open'));

  row.append(contentEl, styleBtn);
  wrap.append(row);
  return wrap;
}

function styledButtonGroup(obj, sectionLabel) {
  const wrap = document.createElement('div');
  wrap.className = 'admin-styled-group';

  const label = document.createElement('span');
  label.className = 'admin-small-label';
  label.textContent = sectionLabel;
  wrap.appendChild(label);

  wrap.appendChild(textField('Button image URL, optional (repo or Cloudflare)', obj.image, v => { obj.image = v; }));

  const row = document.createElement('div');
  row.className = 'admin-item-row';

  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.className = 'admin-input';
  textInput.style.flex = '1';
  textInput.placeholder = 'Button text';
  textInput.value = obj.text || '';
  textInput.addEventListener('input', () => { obj.text = textInput.value; });

  const styleBtn = document.createElement('button');
  styleBtn.type = 'button';
  styleBtn.className = 'admin-btn admin-style-btn';
  styleBtn.textContent = 'Style';

  const drawer = makeDrawer(sectionLabel + ' style');
  drawer.appendChild(selectField('Font', obj.font || 'Poppins', BODY_FONTS, v => { obj.font = v; }));
  drawer.appendChild(selectField('Text color', obj.color || '#ffffff', BUTTON_TEXT_COLORS, v => { obj.color = v; }));
  drawer.appendChild(sliderField('Size (px)', obj.size ?? 16, 12, 28, v => { obj.size = v; }));

  styleBtn.addEventListener('click', () => drawer.classList.add('open'));

  row.append(textInput, styleBtn);
  wrap.append(row);
  return wrap;
}

function drawerTextField(buttonLabel, drawerTitleText, value, onChange) {
  const wrap = document.createElement('div');

  const openBtn = document.createElement('button');
  openBtn.type = 'button';
  openBtn.className = 'admin-btn';
  openBtn.textContent = buttonLabel;

  const drawer = makeDrawer(drawerTitleText);
  const textarea = document.createElement('textarea');
  textarea.className = 'admin-textarea admin-textarea-large';
  textarea.value = value || '';
  textarea.addEventListener('input', () => onChange(textarea.value));
  drawer.appendChild(textarea);

  openBtn.addEventListener('click', () => drawer.classList.add('open'));

  wrap.append(openBtn);
  return wrap;
}

function overlayImageField(obj, labelText) {
  const wrap = document.createElement('div');
  const label = document.createElement('span');
  label.className = 'admin-small-label';
  label.textContent = labelText;
  wrap.appendChild(label);
  wrap.appendChild(textField('Image URL (repo or Cloudflare)', obj.url, v => { obj.url = v; }));
  wrap.appendChild(selectField('Position', obj.position || 'center', POSITION_OPTIONS, v => { obj.position = v; }));
  return wrap;
}

function renderButtonsList(decision) {
  const wrap = document.createElement('div');
  const label = document.createElement('span');
  label.className = 'admin-small-label';
  label.textContent = 'Buttons — always centered, whether there\u2019s one, two, or three';
  wrap.appendChild(label);

  if (!decision.buttons || !decision.buttons.length) decision.buttons = [{}];

  decision.buttons.forEach((btn, i) => {
    const card = document.createElement('div');
    card.className = 'admin-item-card';

    if (decision.buttons.length > 1) {
      const header = document.createElement('div');
      header.className = 'admin-row-header';
      const heading = document.createElement('span');
      heading.className = 'admin-small-label';
      heading.textContent = `Button ${i + 1}`;
      const removeBtn = document.createElement('button');
      removeBtn.className = 'admin-btn admin-btn-remove';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', () => {
        decision.buttons.splice(i, 1);
        renderForm();
      });
      header.append(heading, removeBtn);
      card.appendChild(header);
    }

    card.appendChild(styledButtonGroup(btn, `Button ${i + 1}`));
    wrap.appendChild(card);
  });

  if (decision.buttons.length < 3) {
    const addBtn = document.createElement('button');
    addBtn.className = 'admin-btn';
    addBtn.textContent = 'Add another button';
    addBtn.addEventListener('click', () => {
      decision.buttons.push({});
      renderForm();
    });
    wrap.appendChild(addBtn);
  }

  return wrap;
}

// ---- main render ----

function renderForm() {
  document.querySelectorAll('.admin-drawer').forEach(d => d.remove());
  renderGlobal();
  renderSceneTabs();
  renderActiveScene();
  renderResults();
}

// Top, full width: only what's genuinely global — everything page-specific
// now lives inside Scenes instead, including Send-off and Final.
function renderGlobal() {
  globalRoot.innerHTML = '';
  globalRoot.appendChild(sectionTitle('Main settings'));

  globalRoot.appendChild(textField('Title (this is the theme name)', state.title, v => { state.title = v; }));

  const fileRow = document.createElement('div');
  fileRow.className = 'admin-item-row';
  fileRow.appendChild(textField('File name for export, e.g. goals-01', state.fileName, v => { state.fileName = v; }));
  fileRow.appendChild(textField('Ambient sound Cloudflare URL (.mp3, blank for silence)', state.ambientSound, v => { state.ambientSound = v; }));
  globalRoot.appendChild(fileRow);

  globalRoot.appendChild(sliderField(
    'Ambient volume (0 to 5, 5 is full track volume)',
    state.ambientVolume ?? 3, 0, 5,
    v => { state.ambientVolume = v; }
  ));

  const bgSection = document.createElement('div');
  bgSection.className = 'admin-section';
  bgSection.appendChild(sectionTitle('Stage background (fallback default — used whenever a scene doesn\u2019t set its own)'));
  if (!state.background) state.background = { type: 'image', url: '' };
  bgSection.appendChild(selectField(
    'Type',
    state.background.type,
    [{ value: 'image', label: 'Image' }, { value: 'video', label: 'Video' }],
    v => { state.background.type = v; }
  ));
  bgSection.appendChild(textField('Repo or Cloudflare URL', state.background.url, v => { state.background.url = v; }));
  globalRoot.appendChild(bgSection);

  const creditsSection = document.createElement('div');
  creditsSection.className = 'admin-section';
  creditsSection.appendChild(sectionTitle('Credits'));
  creditsSection.appendChild(drawerTextField('Write credits', 'Credits', state.credits, v => { state.credits = v; }));
  globalRoot.appendChild(creditsSection);
}

// The tab bar itself — labeled by Chef's own mapping name when given
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
    label.textContent = decision.adminLabel || `Scene ${index + 1}`;
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
    state.decisions.push(blankScene(state.decisions.length + 1));
    activeSceneIndex = state.decisions.length - 1;
    renderForm();
  });
  sceneTabs.appendChild(addTab);
}

// Whichever scene is active: left panel (stage) and right panel (content)
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

  activeLeft.appendChild(textField(
    'Scene label, for your own mapping (e.g. Landing, Consent, Send-off, Final)',
    decision.adminLabel,
    v => { decision.adminLabel = v; }
  ));

  if (!decision.background) decision.background = { type: 'image', url: '' };
  const bgLabel = document.createElement('span');
  bgLabel.className = 'admin-small-label';
  bgLabel.textContent = 'Background image (leave URL blank to use the stage default — a full image here can act as a whole page background, e.g. the landing page)';
  activeLeft.appendChild(bgLabel);
  activeLeft.appendChild(selectField(
    'Type',
    decision.background.type,
    [{ value: 'image', label: 'Image' }, { value: 'video', label: 'Video' }],
    v => { decision.background.type = v; }
  ));
  activeLeft.appendChild(textField('Repo or Cloudflare URL', decision.background.url, v => { decision.background.url = v; }));

  if (!decision.image) decision.image = { label: '', url: '' };
  const imgLabel = document.createElement('span');
  imgLabel.className = 'admin-small-label';
  imgLabel.textContent = 'Duck / character image';
  activeLeft.appendChild(imgLabel);
  activeLeft.appendChild(textField('Name', decision.image.label, v => { decision.image.label = v; }));
  activeLeft.appendChild(textField('Repo or Cloudflare URL', decision.image.url, v => { decision.image.url = v; }));

  if (!decision.overlayImage) decision.overlayImage = { url: '', position: 'center' };
  activeLeft.appendChild(overlayImageField(decision.overlayImage,
    'Overlay image — flat, no container, portrait, medium size (this is where Chef adds the landing/consent/etc image if using the stage default background)'
  ));

  activeLeft.appendChild(selectField('Motion', decision.motion, MOTION_OPTIONS, v => { decision.motion = v; }));
  activeLeft.appendChild(sliderField('Speed, seconds to cross the screen (lower is faster)', decision.duration ?? 4, 2, 8, v => { decision.duration = v; }));
  activeLeft.appendChild(sliderField('Vertical start position (0 top, 100 bottom)', decision.verticalPosition ?? 40, 0, 100, v => { decision.verticalPosition = v; }));
  activeLeft.appendChild(textField('Voice line, Cloudflare URL (.mp3, optional)', decision.soundEffect, v => { decision.soundEffect = v; }));
  activeLeft.appendChild(textField('Video, Cloudflare URL (.mp4, only needed if this is the Send-off scene)', decision.video, v => { decision.video = v; }));

  // Right: setting the scene, content
  activeRight.appendChild(sectionTitle(`Scene ${activeSceneIndex + 1}, setting the scene`));

  activeRight.appendChild(styledTextGroup('title', decision, HEADER_FONTS,
    { font: 'Luckiest Guy', color: '#f0b429', size: 28, minSize: 16, maxSize: 48, bold: true },
    'Title (blank means no title)'
  ));

  activeRight.appendChild(styledTextGroup('desc', decision, BODY_FONTS,
    { font: 'Poppins', color: '#ffffff', size: 16, minSize: 12, maxSize: 24, bold: false },
    'Text container (blank means no description)', true
  ));

  activeRight.appendChild(renderButtonsList(decision));

  activeRight.appendChild(renderOptions(decision));
}

function renderOptions(decision) {
  const wrap = document.createElement('div');
  const label = document.createElement('span');
  label.className = 'admin-small-label';
  label.textContent = 'Answer choices (legacy, optional — only needed for branching/scored scenes)';
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
  section.appendChild(sectionTitle('Results (optional — leave empty for non-scored games)'));

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
  const baseName = state.fileName ? slugify(state.fileName) : (state.title ? slugify(state.title) : (currentTheme || 'theme'));
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
  saveStatus.textContent = `Downloaded ${filename}. Add it to games/aurion/config/ in the repo.`;
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
