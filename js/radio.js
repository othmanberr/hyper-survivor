// ============ WEB RADIO SYSTEM ============
const RADIO_STATIONS = [
    { name: 'LOFI HIP HOP', genre: 'Chill Beats', url: 'https://chillsky.com/autodj', color: '#55efc4' },
    { name: 'RETROWAVE', genre: 'Synthwave', url: 'https://stream.nightride.fm/nightride.mp3', color: '#a29bfe' },
    { name: 'DARKSYNTH', genre: 'Cyberpunk', url: 'https://stream.nightride.fm/darksynth.mp3', color: '#ff4757' },
    { name: 'SPACE STN', genre: 'Ambient Space', url: 'https://ice1.somafm.com/spacestation-128-mp3', color: '#00cec9' },
    { name: 'DEF CON', genre: 'Hacker EDM', url: 'https://ice1.somafm.com/defcon-128-mp3', color: '#ffd700' },
    { name: 'DRONE ZONE', genre: 'Dark Ambient', url: 'https://ice1.somafm.com/dronezone-128-mp3', color: '#636e72' },
];

let radioAudio = null;
let radioActive = false;
let radioStation = 0;
let radioVolume = 0.5;
let radioLoading = false;
let radioError = false;

function initRadio() {
    if (radioAudio) return;
    radioAudio = new Audio();
    radioAudio.crossOrigin = 'anonymous';
    radioAudio.volume = radioVolume;
    radioAudio.addEventListener('playing', () => {
        radioLoading = false;
        radioError = false;
        updateRadioUI();
    });
    radioAudio.addEventListener('waiting', () => {
        radioLoading = true;
        updateRadioUI();
    });
    radioAudio.addEventListener('error', () => {
        radioLoading = false;
        radioError = true;
        updateRadioUI();
    });
}

function toggleRadio() {
    initRadio();
    if (radioActive) {
        stopRadio();
    } else {
        startRadio();
    }
}

function startRadio() {
    initRadio();
    // Stop procedural music
    stopMusic();
    radioActive = true;
    radioLoading = true;
    radioError = false;
    const station = RADIO_STATIONS[radioStation];
    radioAudio.src = station.url;
    radioAudio.load();
    radioAudio.play().catch(() => {
        radioError = true;
        radioLoading = false;
        updateRadioUI();
    });
    updateRadioUI();
    showRadioWidget();
}

function stopRadio() {
    radioActive = false;
    radioLoading = false;
    if (radioAudio) {
        radioAudio.pause();
        radioAudio.src = '';
    }
    updateRadioUI();
}

function nextStation() {
    radioStation = (radioStation + 1) % RADIO_STATIONS.length;
    if (radioActive) {
        radioLoading = true;
        radioError = false;
        const station = RADIO_STATIONS[radioStation];
        radioAudio.src = station.url;
        radioAudio.load();
        radioAudio.play().catch(() => {
            radioError = true;
            radioLoading = false;
        });
    }
    updateRadioUI();
}

function prevStation() {
    radioStation = (radioStation - 1 + RADIO_STATIONS.length) % RADIO_STATIONS.length;
    if (radioActive) {
        radioLoading = true;
        radioError = false;
        const station = RADIO_STATIONS[radioStation];
        radioAudio.src = station.url;
        radioAudio.load();
        radioAudio.play().catch(() => {
            radioError = true;
            radioLoading = false;
        });
    }
    updateRadioUI();
}

function setRadioVolume(v) {
    radioVolume = Math.max(0, Math.min(1, v));
    if (radioAudio) radioAudio.volume = radioVolume;
    updateRadioUI();
}

function showRadioWidget() {
    const el = document.getElementById('radio-widget');
    if (el) el.classList.remove('h');
}

function updateRadioUI() {
    const widget = document.getElementById('radio-widget');
    if (!widget) return;

    const station = RADIO_STATIONS[radioStation];
    const nameEl = document.getElementById('radio-name');
    const statusEl = document.getElementById('radio-status');
    const toggleBtn = document.getElementById('radio-toggle');
    const indicator = document.getElementById('radio-indicator');

    if (nameEl) nameEl.textContent = station.name;

    if (statusEl) {
        if (radioError) {
            statusEl.textContent = '⚠';
            statusEl.style.color = '#ff4757';
        } else if (radioLoading) {
            statusEl.textContent = '...';
            statusEl.style.color = '#ffd700';
        } else if (radioActive) {
            statusEl.textContent = 'LIVE';
            statusEl.style.color = '#55efc4';
        } else {
            statusEl.textContent = 'OFF';
            statusEl.style.color = 'rgba(255,255,255,0.3)';
        }
    }

    if (toggleBtn) toggleBtn.textContent = radioActive ? '⏸' : '▶';

    if (indicator) {
        indicator.style.background = radioActive && !radioError ? station.color : 'rgba(255,255,255,0.15)';
        indicator.style.boxShadow = radioActive && !radioError ? `0 0 6px ${station.color}` : 'none';
    }

    if (radioActive || !widget.classList.contains('h')) {
        widget.classList.remove('h');
    }
}
