// ============ CHARACTER DEFINITIONS ============
// Playable characters for arcade mode selection

const CHARACTER_DEFS = [
    {
        id: 'jeff',
        name: 'JEFF',
        title: 'The Degen Trader',
        desc: 'Solide partout, mais esquive en carton: il tank avec son ego.',
        color: '#00cec9',
        glow: 'rgba(0, 206, 201, 0.4)',
        // Display points (each stat <= 99)
        stats: { hp: 62, spd: 60, armor: 40, crit: 46, cdMult: 1, dodge: 30, magnetRange: 100 },
        icon: '💎'
    },
    {
        id: 'hypurr',
        name: 'HYPURR',
        title: 'The Cyber Cat',
        desc: 'Fusee sous cafeine, mais armure en papier bulle.',
        color: '#7ecfc0',
        glow: 'rgba(126, 207, 192, 0.4)',
        // Display points (each stat <= 99)
        stats: { hp: 45, spd: 82, armor: 18, crit: 55, cdMult: 0.9, dodge: 61, magnetRange: 120 },
        icon: '🐱'
    },
    {
        id: 'pasheur',
        name: 'PASHEUR',
        title: 'The Shadow Hacker',
        desc: 'Crit monster, mais barre de vie sponsorisee par le mode hardcore.',
        color: '#39ff14',
        glow: 'rgba(57, 255, 20, 0.4)',
        // Display points (each stat <= 99)
        stats: { hp: 38, spd: 58, armor: 28, crit: 72, cdMult: 0.85, dodge: 74, magnetRange: 110 },
        icon: '🕵️'
    },
    {
        id: 'catbalette',
        name: 'CATBALETTE',
        title: 'The Cyber Feline',
        desc: 'Assassin precis, mais vitesse limitee: c est un sniper, pas un scooter.',
        color: '#00e5ff',
        glow: 'rgba(0, 229, 255, 0.4)',
        // Display points (each stat <= 99)
        stats: { hp: 42, spd: 54, armor: 24, crit: 79, cdMult: 0.8, dodge: 68, magnetRange: 115 },
        icon: '🐾'
    },
    {
        id: 'pip',
        name: 'PIP',
        title: 'The Crystal Knight',
        desc: 'Petit tank adorable, mais ses critiques ont oublie de venir au briefing.',
        color: '#66ffcc',
        glow: 'rgba(102, 255, 204, 0.4)',
        // Display points (each stat <= 99)
        stats: { hp: 78, spd: 40, armor: 70, crit: 26, cdMult: 0.95, dodge: 32, magnetRange: 130 },
        icon: '💎'
    },
    {
        id: 'mage',
        name: 'MAGE',
        title: 'The Arcane Wizard',
        desc: 'Maitre des sorts obscurs. Crit devastateur, lent mais implacable.',
        color: '#b84fff',
        glow: 'rgba(184, 79, 255, 0.4)',
        // Display points (each stat <= 99)
        stats: { hp: 45, spd: 20, armor: 8, crit: 90, cdMult: 0.75, dodge: 15, magnetRange: 150 },
        icon: '🔮'
    }
];

// ============ STAT DISPLAY CONFIG ============
const CHAR_STAT_BARS = [
    { key: 'hp', label: 'HP', max: 99, color: '#ff6b6b' },
    { key: 'spd', label: 'SPD', max: 99, color: '#00cec9' },
    { key: 'armor', label: 'ARM', max: 99, color: '#a29bfe' },
    { key: 'crit', label: 'CRIT', max: 99, color: '#fdcb6e' },
    { key: 'dodge', label: 'DODGE', max: 99, color: '#fd79a8' }
];

// ============ STATE ============
let _selectedCharId = 'jeff';
let _selectedMapIdx = 0;

function getSelectedCharacter() {
    return CHARACTER_DEFS.find(c => c.id === _selectedCharId) || CHARACTER_DEFS[0];
}

function applyCharacterStats(P) {
    const ch = getSelectedCharacter();
    // Convert display points (0..99) to gameplay runtime values.
    P.maxHp = Math.round(70 + ch.stats.hp * 1.2);
    P.hp = P.maxHp;
    P.spd = Math.round(160 + ch.stats.spd * 1.6);
    P.armor = Math.round(ch.stats.armor / 8);
    P.crit = Math.round(ch.stats.crit * 0.35);
    P.cdMult = ch.stats.cdMult;
    P.dodge = Math.round(ch.stats.dodge * 0.35);
    P.magnetRange = ch.stats.magnetRange;
}

// ============ CHARACTER SPRITE PATHS ============
const CHAR_SPRITE_PATHS = {
    jeff: 'assets/player/jeff_new/south.png',
    hypurr: 'assets/player/hypurr/south.png',
    pasheur: 'assets/player/pasheur/south.png',
    catbalette: 'assets/player/catbalette/south.png',
    pip: 'assets/player/pip/south.png',
    mage: 'assets/player/mage/south.png'
};

// Fighter select portraits (larger, standing pose like Street Fighter)
const CHAR_SELECT_PATHS = {
    jeff: 'assets/player/select/jeff_select.png',
    hypurr: 'assets/player/select/hypurr_select.png',
    pasheur: 'assets/player/select/pasheur_select.png',
    catbalette: 'assets/player/select/catbalette_select.png',
    pip: 'assets/player/select/pip_select.png',
    mage: 'assets/player/select/mage_select.png'
};

// Preload character sprites (in-game)
const _charSprites = {};
Object.entries(CHAR_SPRITE_PATHS).forEach(([id, path]) => {
    const img = new Image();
    img.src = path;
    _charSprites[id] = img;
});

// Preload fighter select portraits
const _charSelectSprites = {};
Object.entries(CHAR_SELECT_PATHS).forEach(([id, path]) => {
    const img = new Image();
    img.src = path;
    _charSelectSprites[id] = img;
});

// ============ CHARACTER SELECT UI ============
// Note: All content in character select comes from hardcoded CHARACTER_DEFS
// defined above in this same file — no user-supplied data, safe to use innerHTML.

function _updateShowcase(ch) {
    const showcase = document.getElementById('char-showcase');
    const glowEl = document.getElementById('char-showcase-glow');
    const spriteEl = document.getElementById('char-showcase-sprite');
    const infoEl = document.getElementById('char-showcase-info');

    showcase.style.setProperty('--char-color', ch.color);
    showcase.style.setProperty('--char-glow', ch.glow);

    // Glow background
    glowEl.style.background = 'radial-gradient(circle, ' + ch.glow + ' 0%, transparent 70%)';

    // Use the same compact in-game sprite as the roster cards (no large portrait).
    spriteEl.textContent = '';
    const img = document.createElement('img');
    img.alt = ch.name;
    img.className = 'char-showcase-img';
    img.classList.add('is-mini');
    img.draggable = false;
    img.src = CHAR_SPRITE_PATHS[ch.id];
    spriteEl.appendChild(img);

    // Info panel — built from hardcoded CHARACTER_DEFS data only
    const nameDiv = document.createElement('div');
    nameDiv.className = 'showcase-name';
    nameDiv.style.color = ch.color;
    nameDiv.textContent = ch.name;

    const titleDiv = document.createElement('div');
    titleDiv.className = 'showcase-title';
    titleDiv.textContent = ch.title;

    const descDiv = document.createElement('div');
    descDiv.className = 'showcase-desc';
    descDiv.textContent = ch.desc;

    const statsDiv = document.createElement('div');
    statsDiv.className = 'showcase-stats';
    CHAR_STAT_BARS.forEach(sb => {
        const val = ch.stats[sb.key] || 0;
        const pct = Math.min(100, (val / sb.max) * 100);
        const row = document.createElement('div');
        row.className = 'char-stat-row';
        const lbl = document.createElement('span');
        lbl.className = 'char-stat-label';
        lbl.textContent = sb.label;
        const track = document.createElement('div');
        track.className = 'char-stat-track';
        const fill = document.createElement('div');
        fill.className = 'char-stat-fill';
        fill.style.width = pct + '%';
        fill.style.background = sb.color;
        track.appendChild(fill);
        const valSpan = document.createElement('span');
        valSpan.className = 'char-stat-val';
        valSpan.textContent = val;
        row.appendChild(lbl);
        row.appendChild(track);
        row.appendChild(valSpan);
        statsDiv.appendChild(row);
    });

    infoEl.textContent = '';
    infoEl.appendChild(nameDiv);
    infoEl.appendChild(titleDiv);
    infoEl.appendChild(descDiv);
    infoEl.appendChild(statsDiv);

    // Trigger entrance animation
    showcase.classList.remove('char-showcase-enter');
    void showcase.offsetWidth;
    showcase.classList.add('char-showcase-enter');
}

function _updateCharSelectSummary(ch) {
    const confirmBtn = document.getElementById('btn-char-confirm');
    if (confirmBtn) confirmBtn.textContent = 'LOCK';
}

function _updateMapSelectSummary(pal, idx) {
    const summary = document.getElementById('map-select-summary');
    const confirmBtn = document.getElementById('btn-map-confirm');
    if (summary) {
        summary.innerHTML = `
      <div class="select-summary-kicker">ARCADE ENTRY</div>
      <div class="select-summary-value" style="color:${pal.accent}">MAP ${idx + 1} · ${pal.name}</div>
      <div class="select-summary-copy">Fast launch, pressure-first loop, immediate score chase.</div>
    `;
    }
    if (confirmBtn) confirmBtn.textContent = `START ${pal.name.toUpperCase()} ⚡`;
}

function showCharacterSelect() {
    const el = document.getElementById('char-select');
    el.classList.remove('h');

    // Build roster (compact character strip)
    const grid = document.getElementById('char-grid');
    grid.textContent = '';

    CHARACTER_DEFS.forEach(ch => {
        const card = document.createElement('div');
        card.className = 'char-roster-card' + (ch.id === _selectedCharId ? ' selected' : '');
        card.dataset.charId = ch.id;
        card.style.setProperty('--char-color', ch.color);
        card.style.setProperty('--char-glow', ch.glow);

        const spriteWrap = document.createElement('div');
        spriteWrap.className = 'roster-sprite-wrap';
        const sprImg = document.createElement('img');
        sprImg.src = CHAR_SPRITE_PATHS[ch.id];
        sprImg.alt = ch.name;
        sprImg.className = 'roster-sprite';
        sprImg.draggable = false;
        spriteWrap.appendChild(sprImg);

        const nameEl = document.createElement('div');
        nameEl.className = 'roster-name';
        nameEl.textContent = ch.name;

        card.appendChild(spriteWrap);
        card.appendChild(nameEl);

        card.addEventListener('click', () => {
            _selectedCharId = ch.id;
            grid.querySelectorAll('.char-roster-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            _updateShowcase(ch);
            _updateCharSelectSummary(ch);
        });

        grid.appendChild(card);
    });

    // Show initial showcase
    const initialChar = getSelectedCharacter();
    _updateShowcase(initialChar);
    _updateCharSelectSummary(initialChar);
}

function hideCharacterSelect() {
    document.getElementById('char-select').classList.add('h');
}

// ============ MAP SELECT UI ============
function showMapSelect() {
    const el = document.getElementById('map-select');
    el.classList.remove('h');

    const grid = document.getElementById('map-grid');
    grid.innerHTML = '';

    STAGE_PALETTES.forEach((pal, idx) => {
        const card = document.createElement('div');
        card.className = 'map-card' + (idx === _selectedMapIdx ? ' selected' : '');
        card.dataset.mapIdx = idx;
        card.style.setProperty('--map-accent', pal.accent);
        card.style.setProperty('--map-secondary', pal.secondary);
        card.style.setProperty('--map-glow', pal.glow);

        card.innerHTML = `
      <div class="map-preview" style="background:linear-gradient(135deg, ${pal.accent}22, ${pal.secondary}22);border-color:${pal.accent}44">
        <div class="map-preview-glow" style="background:radial-gradient(circle, ${pal.accent}33 0%, transparent 70%)"></div>
        <span class="map-preview-num">${idx + 1}</span>
      </div>
      <div class="map-name">${pal.name}</div>
    `;

        card.addEventListener('click', () => {
            _selectedMapIdx = idx;
            grid.querySelectorAll('.map-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            _updateMapSelectSummary(pal, idx);
        });

        grid.appendChild(card);
    });

    const initialMap = STAGE_PALETTES[_selectedMapIdx] || STAGE_PALETTES[0];
    _updateMapSelectSummary(initialMap, _selectedMapIdx);
}

function hideMapSelect() {
    document.getElementById('map-select').classList.add('h');
}

// ============ FLOW: Arcade → CharSelect → Start (Map 1 forced) ============
function startArcadeFlow() {
    // Hide main menu
    document.querySelectorAll('.mo').forEach(m => m.classList.add('h'));
    _selectedCharId = 'jeff';
    _selectedMapIdx = 0;
    showCharacterSelect();
}

function confirmCharacterSelect() {
    hideCharacterSelect();
    // V1 flow: map selection is disabled, always start on map 1.
    _selectedMapIdx = 0;
    G.arcadeMap = 0;
    G.selectedCharacter = _selectedCharId;
    startGame('arcade');
}

function confirmMapSelect() {
    hideMapSelect();
    // Set arcade map on G
    G.arcadeMap = _selectedMapIdx;
    G.selectedCharacter = _selectedCharId;
    startGame('arcade');
}

// ============ EXPORTS ============
window.CHARACTER_DEFS = CHARACTER_DEFS;
window.getSelectedCharacter = getSelectedCharacter;
window.applyCharacterStats = applyCharacterStats;
window.showCharacterSelect = showCharacterSelect;
window.hideCharacterSelect = hideCharacterSelect;
window.showMapSelect = showMapSelect;
window.hideMapSelect = hideMapSelect;
window.startArcadeFlow = startArcadeFlow;
window.confirmCharacterSelect = confirmCharacterSelect;
window.confirmMapSelect = confirmMapSelect;
window._selectedCharId = _selectedCharId;
window._selectedMapIdx = _selectedMapIdx;
