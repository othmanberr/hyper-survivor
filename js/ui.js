// ============ HUD & UI ============

function updateHUD() {
    // Lerp HP bar
    const hpTarget = P.hp / P.maxHp * 100;
    const hpSpeed = (typeof _hpDisplay !== 'undefined' && _hpDisplay > hpTarget) ? 0.18 : 0.08;
    window._hpDisplay = (window._hpDisplay || 100) + (hpTarget - (window._hpDisplay || 100)) * hpSpeed;
    if (Math.abs(window._hpDisplay - hpTarget) < 0.3) window._hpDisplay = hpTarget;
    DOM.hpb.style.width = `${window._hpDisplay}%`;
    DOM.hpt.textContent = `${Math.ceil(P.hp)}/${P.maxHp}`;
    DOM.lvl.textContent = `LV ${P.level}`;

    // Lerp XP bar
    const xpTarget = Math.min(100, P.xp / P.xpNext * 100);
    window._xpDisplay = (window._xpDisplay || 0) + (xpTarget - (window._xpDisplay || 0)) * 0.12;
    if (Math.abs(window._xpDisplay - xpTarget) < 0.3) window._xpDisplay = xpTarget;
    if (DOM.xpb) DOM.xpb.style.width = `${window._xpDisplay}%`;

    if (G.mode === 'arcade') {
        DOM.stageInfo.textContent = `WAVE ${G.wave}/100`;
    } else {
        // Requires WAVES_PER_STAGE from globals
        const wps = typeof WAVES_PER_STAGE !== 'undefined' ? WAVES_PER_STAGE : 10;
        const stageNum = Math.floor((G.wave - 1) / wps) + 1;
        const waveInStage = ((G.wave - 1) % wps) + 1;
        DOM.stageInfo.textContent = `STAGE ${stageNum} — ${waveInStage}/${wps}`;
    }

    if (G.phase === 'wave') {
        DOM.waveTimer.textContent = typeof formatTime === 'function' ? formatTime(G.waveTime) : G.waveTime;
        DOM.waveTimer.classList.remove('urgent', 'warning');
        if (G.waveTime <= 10) DOM.waveTimer.classList.add('urgent');
        else if (G.waveTime <= 20) DOM.waveTimer.classList.add('warning');
    } else {
        DOM.waveTimer.textContent = '';
        DOM.waveTimer.classList.remove('urgent', 'warning');
    }

    const newGold = G.gold;
    if (G._lastGold !== undefined && newGold !== G._lastGold) {
        const delta = newGold - G._lastGold;
        if (delta !== 0) _showGoldDelta(delta);
    }
    G._lastGold = newGold;
    DOM.gold.textContent = G.gold;
}

function _showGoldDelta(delta) {
    const el = document.getElementById('gold');
    if (!el) return;
    const popup = document.createElement('span');
    popup.className = 'gold-delta ' + (delta > 0 ? 'gold-plus' : 'gold-minus');
    popup.textContent = delta > 0 ? `+${delta}` : `${delta}`;
    el.parentElement.appendChild(popup);
    setTimeout(() => popup.remove(), 1200);
}

// ============ SHARED END SCREEN HELPERS ============
function buildWeaponRecap(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';
    for (const w of P.weapons) {
        const def = typeof WEAPONS !== 'undefined' ? WEAPONS[w.id] : null;
        if (!def) continue;
        el.innerHTML += `
      <div class="weapon-recap-item">
        <div class="weapon-recap-icon">${def.icon}</div>
        <div class="weapon-recap-name">${def.name}</div>
        <div class="weapon-recap-lvl">Lv${w.level}</div>
      </div>
    `;
    }
}

function buildDetailedStats(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const avgDPS = G.totalTime > 0 ? Math.round(G.totalDmgDealt / G.totalTime) : 0;
    const killsPerMin = G.totalTime > 0 ? Math.round(G.kills / (G.totalTime / 60)) : 0;
    const dmgRatio = G.totalDmgTaken > 0 ? (G.totalDmgDealt / G.totalDmgTaken).toFixed(1) : '∞';
    const efficiency = G.kills > 0 ? Math.round((G.totalDmgDealt / G.kills)) : 0;
    const fn = typeof formatNumber === 'function' ? formatNumber : (n) => n;

    el.innerHTML = `
    <div class="end-stat-card"><div class="end-stat-val">${fn(Math.round(G.totalDmgDealt))}</div><div class="end-stat-lbl">Damage Dealt</div></div>
    <div class="end-stat-card"><div class="end-stat-val">${fn(Math.round(G.totalDmgTaken))}</div><div class="end-stat-lbl">Damage Taken</div></div>
    <div class="end-stat-card"><div class="end-stat-val">${G.totalGoldEarned}</div><div class="end-stat-lbl">Gold Earned</div></div>
    <div class="end-stat-card"><div class="end-stat-val">${avgDPS}</div><div class="end-stat-lbl">Avg DPS</div></div>
    <div class="end-stat-card"><div class="end-stat-val">${killsPerMin}</div><div class="end-stat-lbl">Kills/Min</div></div>
    <div class="end-stat-card"><div class="end-stat-val">${G.bossesKilled}</div><div class="end-stat-lbl">Bosses Slain</div></div>
    <div class="end-stat-card"><div class="end-stat-val">${dmgRatio}x</div><div class="end-stat-lbl">DMG Ratio</div></div>
    <div class="end-stat-card"><div class="end-stat-val">${efficiency}</div><div class="end-stat-lbl">DMG/Kill</div></div>
    <div class="dps-graph-wrap" style="grid-column: 1 / -1; margin-top: 6px;">
      <div style="font-family:'JetBrains Mono';font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:1px;margin-bottom:4px;text-transform:uppercase">DPS Over Time</div>
      <canvas id="dps-graph" width="380" height="60" style="width:100%;height:60px;border-radius:6px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.06)"></canvas>
    </div>
  `;

    setTimeout(() => drawDPSGraph(), 50);
}

function drawDPSGraph() {
    const canvas = document.getElementById('dps-graph');
    if (!canvas || !G.dpsHistory || G.dpsHistory.length < 2) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const data = G.dpsHistory;
    const maxDPS = Math.max(...data, 1);
    const padding = { top: 8, bottom: 6, left: 2, right: 2 };
    const graphW = w - padding.left - padding.right;
    const graphH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 3; i++) {
        const y = padding.top + (graphH * i / 3);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(w - padding.right, y);
        ctx.stroke();
    }

    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
        const x = padding.left + (i / (data.length - 1)) * graphW;
        const y = padding.top + graphH - (data[i] / maxDPS) * graphH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = '#00cec9';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00cec9';
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.lineTo(padding.left + graphW, padding.top + graphH);
    ctx.lineTo(padding.left, padding.top + graphH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + graphH);
    grad.addColorStop(0, 'rgba(0, 206, 201, 0.3)');
    grad.addColorStop(1, 'rgba(0, 206, 201, 0)');
    ctx.fillStyle = grad;
    ctx.fill();

    const peakIdx = data.indexOf(maxDPS);
    const peakX = padding.left + (peakIdx / (data.length - 1)) * graphW;
    const peakY = padding.top;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(peakX, peakY + 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "600 8px 'JetBrains Mono'";
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = peakX > w / 2 ? 'right' : 'left';
    ctx.fillText(`Peak: ${Math.round(maxDPS)}`, peakX + (peakX > w / 2 ? -6 : 6), peakY + 5);
}

function calculateRank() {
    let score = 0;
    score += Math.min(30, G.kills / 50);
    score += Math.min(20, G.maxCombo / 10);
    score += Math.min(20, G.bossesKilled * 2);
    const timePerWave = G.totalTime / Math.max(1, G.wave);
    score += Math.max(0, 30 - timePerWave / 5);

    if (score >= 75) return 'S';
    if (score >= 55) return 'A';
    if (score >= 40) return 'B';
    if (score >= 25) return 'C';
    return 'D';
}

function gameOver() {
    G.phase = 'gameover';
    if (typeof stopMusic === 'function') stopMusic();
    saveHighscore();
    if (typeof clearDamageFlash === 'function') clearDamageFlash();

    if (typeof shake !== 'undefined') {
        shake.intensity = 0; shake.time = 0; shake.x = 0; shake.y = 0;
    }

    if (G.mode === 'arcade') {
        document.getElementById('fo-stage').textContent = `${G.wave}/100`;
    } else {
        const wps = typeof WAVES_PER_STAGE !== 'undefined' ? WAVES_PER_STAGE : 10;
        const stageNum = Math.floor((G.wave - 1) / wps) + 1;
        document.getElementById('fo-stage').textContent = `S${stageNum} W${G.wave}`;
    }
    document.getElementById('fo-kills').textContent = G.kills;
    document.getElementById('fo-time').textContent = typeof formatTime === 'function' ? formatTime(G.totalTime) : G.totalTime;
    document.getElementById('fo-combo').textContent = `${G.maxCombo}x`;
    buildWeaponRecap('fo-weapons');
    buildDetailedStats('fo-details');
    document.querySelectorAll('.mo').forEach(m => m.classList.add('h'));
    const bi = document.getElementById('boss-intro'); if (bi) bi.classList.add('h');
    const pm = document.getElementById('pause-menu'); if (pm) pm.classList.add('h');
    const gm = document.getElementById('gm');
    gm.classList.remove('h');
    gm.classList.add('dramatic');
    const goTitle = document.getElementById('go-title');
    const isLiquidated = P.leverage > 5;
    goTitle.textContent = isLiquidated ? 'LIQUIDATED' : 'DEFEATED';
    goTitle.setAttribute('data-text', goTitle.textContent);
    goTitle.classList.toggle('liquidated', isLiquidated);
    _showHighscoreBanner(gm);
}

function victory() {
    G.phase = 'victory';
    if (typeof stopMusic === 'function') stopMusic();

    const finishVictory = () => {
        saveHighscore();
        if (typeof clearDamageFlash === 'function') clearDamageFlash();
        const rank = calculateRank();
        const rankEl = document.getElementById('v-rank');
        if (rankEl) {
            rankEl.textContent = rank;
            rankEl.className = `rank-badge rank-${rank.toLowerCase()}`;
        }
        const vSub = document.querySelector('#vm .ms');
        if (vSub) {
            vSub.textContent = G.mode === 'arcade' ? '100 Waves Survived — The Grind Is Over' : 'All Protocols Conquered — The Market Is Yours';
        }
        document.getElementById('v-kills').textContent = G.kills;
        document.getElementById('v-time').textContent = typeof formatTime === 'function' ? formatTime(G.totalTime) : G.totalTime;
        document.getElementById('v-combo').textContent = `${G.maxCombo}x`;
        buildWeaponRecap('v-weapons');
        buildDetailedStats('v-details');
        document.querySelectorAll('.mo').forEach(m => m.classList.add('h'));
        const bi = document.getElementById('boss-intro'); if (bi) bi.classList.add('h');
        const pm = document.getElementById('pause-menu'); if (pm) pm.classList.add('h');
        const vm = document.getElementById('vm');
        if (vm) {
            vm.classList.remove('h');
            vm.classList.add('spectacular');
            spawnConfetti(vm);
            _showHighscoreBanner(vm);
        }
    };

    if (G.mode === 'adventure' && typeof playNarrative === 'function') {
        // Requires NARRATIVE_TEXTS from globals/missions
        const txts = typeof NARRATIVE_TEXTS !== 'undefined' ? NARRATIVE_TEXTS.epilogue : [];
        playNarrative(txts, 'center', finishVictory);
    } else {
        finishVictory();
    }
}

function _showHighscoreBanner(container) {
    if (!G._isNewHighscore) return;
    G._isNewHighscore = false;
    const banner = document.createElement('div');
    banner.className = 'new-highscore-banner';
    const ico = typeof ICO !== 'undefined' ? ICO.trophy : '🏆';
    banner.innerHTML = ico + ' NEW HIGHSCORE!';
    container.appendChild(banner);
    setTimeout(() => banner.remove(), 5000);
}

function spawnConfetti(container) {
    const colors = ['#ffd700', '#ff6b6b', '#00cec9', '#6c5ce7', '#55efc4', '#fd79a8', '#00b894', '#e17055'];
    for (let i = 0; i < 60; i++) {
        const el = document.createElement('div');
        el.className = 'confetti-particle';
        el.style.left = Math.random() * 100 + '%';
        el.style.top = -10 + 'px';
        el.style.width = (4 + Math.random() * 8) + 'px';
        el.style.height = (4 + Math.random() * 8) + 'px';
        el.style.background = colors[Math.floor(Math.random() * colors.length)];
        el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        el.style.animationDuration = (2 + Math.random() * 3) + 's';
        el.style.animationDelay = Math.random() * 2 + 's';
        el.style.opacity = 0.7 + Math.random() * 0.3;
        container.appendChild(el);
        setTimeout(() => el.remove(), 6000);
    }
}

// ============ LEADERBOARD DATA PROVIDER ============
const LeaderboardData = (() => {
    const MAX_SCORES = 500;
    const localProvider = {
        getAllScores() {
            try { return Promise.resolve(JSON.parse(localStorage.getItem('hl_survivor_scores') || '[]')); }
            catch (e) { return Promise.resolve([]); }
        },
        saveScore(entry) {
            return this.getAllScores().then(scores => {
                scores.push(entry);
                scores.sort((a, b) => b.wave - a.wave || b.kills - a.kills);
                if (scores.length > MAX_SCORES) scores.length = MAX_SCORES;
                localStorage.setItem('hl_survivor_scores', JSON.stringify(scores));
            });
        },
        getLifetimeStats() {
            try {
                const raw = JSON.parse(localStorage.getItem('hl_survivor_stats') || '{}');
                return Promise.resolve({
                    totalKills: raw.totalKills || 0, totalGames: raw.totalGames || 0,
                    totalTime: raw.totalTime || 0, bestWave: raw.bestWave || 0, bestCombo: raw.bestCombo || 0,
                });
            } catch (e) { return Promise.resolve({ totalKills: 0, totalGames: 0, totalTime: 0, bestWave: 0, bestCombo: 0 }); }
        },
        saveLifetimeStats(stats) {
            localStorage.setItem('hl_survivor_stats', JSON.stringify(stats));
            return Promise.resolve();
        }
    };
    let provider = localProvider;
    return {
        setProvider(p) { provider = p; },
        getAllScores() { return provider.getAllScores(); },
        saveScore(e) { return provider.saveScore(e); },
        getLifetimeStats() { return provider.getLifetimeStats(); },
        saveLifetimeStats(s) { return provider.saveLifetimeStats(s); },
        getScoresForPeriod(period) {
            return this.getAllScores().then(scores => {
                const now = Date.now();
                let cutoff = 0;
                if (period === 'daily') cutoff = now - 86400000;
                if (period === 'weekly') cutoff = now - 604800000;
                const filtered = cutoff > 0 ? scores.filter(s => s.date >= cutoff) : scores;
                filtered.sort((a, b) => b.wave - a.wave || b.kills - a.kills);
                return filtered;
            });
        }
    };
})();

// ============ HIGHSCORE SYSTEM ============
function getHighscores() {
    try { return JSON.parse(localStorage.getItem('hl_survivor_scores') || '[]'); }
    catch (e) { return []; }
}

function saveHighscore() {
    const scores = getHighscores();
    const prevBest = scores.length > 0 ? scores[0].wave : 0;
    const entry = {
        wave: G.wave, kills: G.kills, time: Math.floor(G.totalTime),
        combo: G.maxCombo, gold: G.totalGoldEarned, mode: G.mode, date: Date.now()
    };
    LeaderboardData.saveScore(entry);
    if (G.wave > prevBest && prevBest > 0) {
        G._isNewHighscore = true;
    }
    LeaderboardData.getLifetimeStats().then(stats => {
        stats.totalKills += G.kills;
        stats.totalGames++;
        stats.totalTime += Math.floor(G.totalTime);
        stats.bestWave = Math.max(stats.bestWave, G.wave);
        stats.bestCombo = Math.max(stats.bestCombo, G.maxCombo);
        LeaderboardData.saveLifetimeStats(stats);
    });
}

function getLifetimeStats() {
    try {
        const raw = JSON.parse(localStorage.getItem('hl_survivor_stats') || '{}');
        return {
            totalKills: raw.totalKills || 0, totalGames: raw.totalGames || 0,
            totalTime: raw.totalTime || 0, bestWave: raw.bestWave || 0, bestCombo: raw.bestCombo || 0,
        };
    } catch (e) { return { totalKills: 0, totalGames: 0, totalTime: 0, bestWave: 0, bestCombo: 0 }; }
}

function updateMenuHighscores() {
    const container = document.getElementById('menu-highscores');
    if (!container) return;
    const scores = getHighscores();
    const stats = getLifetimeStats();
    if (scores.length === 0 && !stats.totalGames) {
        container.innerHTML = '';
        return;
    }
    let html = '<div class="hs-title">LEADERBOARD</div>';
    if (scores.length > 0) {
        html += '<div class="hs-list">';
        const ico = typeof ICO !== 'undefined' ? ICO : { medal1: '🥇', medal2: '🥈', medal3: '🥉' };
        scores.slice(0, 5).forEach((s, i) => {
            const medal = i === 0 ? ico.medal1 : i === 1 ? ico.medal2 : i === 2 ? ico.medal3 : `#${i + 1}`;
            const t = typeof formatTime === 'function' ? formatTime(s.time) : s.time;
            html += `<div class="hs-row"><span class="hs-medal">${medal}</span><span class="hs-wave">W${s.wave}</span><span class="hs-kills">${s.kills}K</span><span class="hs-time">${t}</span></div>`;
        });
        html += '</div>';
    }
    if (stats.totalGames) {
        html += `<div class="hs-stats">${stats.totalGames} runs · ${stats.totalKills || 0} total kills · Best W${stats.bestWave || 0}</div>`;
    }
    container.innerHTML = html;
}

// ============ LEADERBOARD UI ============
const Leaderboard = (() => {
    let currentPeriod = 'all';

    function open() {
        document.querySelectorAll('.mo').forEach(m => m.classList.add('h'));
        document.getElementById('lb').classList.remove('h');
        const hud = document.getElementById('hud');
        if (hud) hud.classList.add('h');
        currentPeriod = 'all';
        document.querySelectorAll('.lb-tab').forEach(t => t.classList.toggle('active', t.dataset.period === 'all'));
        _renderLifetime();
        _renderScores('all');
    }

    function close() {
        document.getElementById('lb').classList.add('h');
        const mm = document.getElementById('mm');
        if (mm) mm.classList.remove('h');
        const hud = document.getElementById('hud');
        if (hud && typeof G !== 'undefined' && G.phase === 'wave') hud.classList.remove('h');
    }

    function switchTab(period) {
        currentPeriod = period;
        document.querySelectorAll('.lb-tab').forEach(t => t.classList.toggle('active', t.dataset.period === period));
        _renderScores(period);
    }

    function _renderLifetime() {
        LeaderboardData.getLifetimeStats().then(stats => {
            const el = document.getElementById('lb-lifetime');
            if (!el) return;
            if (!stats.totalGames) { el.innerHTML = ''; return; }
            const t = typeof formatTime === 'function' ? formatTime(stats.totalTime) : stats.totalTime;
            el.innerHTML = `
        <div class="lb-lifetime-item"><div class="lb-lifetime-val">${stats.totalGames}</div><div class="lb-lifetime-label">RUNS</div></div>
        <div class="lb-lifetime-item"><div class="lb-lifetime-val">${stats.totalKills.toLocaleString()}</div><div class="lb-lifetime-label">TOTAL KILLS</div></div>
        <div class="lb-lifetime-item"><div class="lb-lifetime-val">W${stats.bestWave}</div><div class="lb-lifetime-label">BEST WAVE</div></div>
        <div class="lb-lifetime-item"><div class="lb-lifetime-val">${t}</div><div class="lb-lifetime-label">TOTAL TIME</div></div>
      `;
        });
    }

    function _renderScores(period) {
        const listEl = document.getElementById('lb-list');
        const emptyEl = document.getElementById('lb-empty');
        if (!listEl || !emptyEl) return;

        LeaderboardData.getScoresForPeriod(period).then(scores => {
            if (scores.length === 0) {
                listEl.innerHTML = '';
                emptyEl.classList.remove('h');
                return;
            }
            emptyEl.classList.add('h');
            const ico = typeof ICO !== 'undefined' ? ICO : { medal1: '🥇', medal2: '🥈', medal3: '🥉' };
            listEl.innerHTML = scores.map((s, i) => {
                let cls = 'lb-row';
                if (i === 0) cls += ' lb-gold';
                else if (i === 1) cls += ' lb-silver';
                else if (i === 2) cls += ' lb-bronze';
                const rank = i === 0 ? ico.medal1 : i === 1 ? ico.medal2 : i === 2 ? ico.medal3 : `${i + 1}`;
                const d = new Date(s.date);
                const dateStr = `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
                const t = typeof formatTime === 'function' ? formatTime(s.time) : s.time;
                return `<div class="${cls}">
          <span class="lb-col-rank">${rank}</span>
          <span class="lb-col-wave">W${s.wave}</span>
          <span class="lb-col-kills">${s.kills}</span>
          <span class="lb-col-time">${t}</span>
          <span class="lb-col-date">${dateStr}</span>
        </div>`;
            }).join('');
        });
    }

    return { open, close, switchTab };
})();

// ============ SETTINGS ============
let dmgNumbersEnabled = true;

const SETTINGS_DEFAULTS = { masterVol: 50, sfxVol: 60, musicVol: 30, radioVol: 50, shakeEnabled: true, dmgNumbersEnabled: true };

function loadSettings() {
    let s = SETTINGS_DEFAULTS;
    try {
        const raw = localStorage.getItem('hl_survivor_settings');
        if (raw) s = Object.assign({}, SETTINGS_DEFAULTS, JSON.parse(raw));
    } catch (e) { }
    // Apply audio
    if (typeof masterGain !== 'undefined' && masterGain) masterGain.gain.value = s.masterVol / 100;
    if (typeof sfxGain !== 'undefined' && sfxGain) sfxGain.gain.value = s.sfxVol / 100;
    if (typeof musicGain !== 'undefined' && musicGain) musicGain.gain.value = s.musicVol / 100;
    if (typeof setRadioVolume === 'function') setRadioVolume(s.radioVol / 100);

    window.shakeEnabled = typeof window.shakeEnabled !== 'undefined' ? s.shakeEnabled : true;
    window.dmgNumbersEnabled = s.dmgNumbersEnabled;

    const mEl = document.getElementById('set-master'); if (mEl) mEl.value = s.masterVol;
    const mvEl = document.getElementById('set-master-val'); if (mvEl) mvEl.textContent = s.masterVol;
    const sEl = document.getElementById('set-sfx'); if (sEl) sEl.value = s.sfxVol;
    const svEl = document.getElementById('set-sfx-val'); if (svEl) svEl.textContent = s.sfxVol;
    const muEl = document.getElementById('set-music'); if (muEl) muEl.value = s.musicVol;
    const muvEl = document.getElementById('set-music-val'); if (muvEl) muvEl.textContent = s.musicVol;
    const radEl = document.getElementById('set-radio'); if (radEl) radEl.value = s.radioVol;
    const radvEl = document.getElementById('set-radio-val'); if (radvEl) radvEl.textContent = s.radioVol;

    const shakeBtn = document.getElementById('set-shake');
    if (shakeBtn) {
        shakeBtn.textContent = s.shakeEnabled ? 'ON' : 'OFF';
        shakeBtn.className = 'settings-toggle ' + (s.shakeEnabled ? 'on' : 'off');
    }

    const dmgBtn = document.getElementById('set-dmgnums');
    if (dmgBtn) {
        dmgBtn.textContent = s.dmgNumbersEnabled ? 'ON' : 'OFF';
        dmgBtn.className = 'settings-toggle ' + (s.dmgNumbersEnabled ? 'on' : 'off');
    }
}

function saveSettings() {
    const mEl = document.getElementById('set-master');
    const sEl = document.getElementById('set-sfx');
    const muEl = document.getElementById('set-music');
    const rEl = document.getElementById('set-radio');

    const s = {
        masterVol: mEl ? parseInt(mEl.value) : SETTINGS_DEFAULTS.masterVol,
        sfxVol: sEl ? parseInt(sEl.value) : SETTINGS_DEFAULTS.sfxVol,
        musicVol: muEl ? parseInt(muEl.value) : SETTINGS_DEFAULTS.musicVol,
        radioVol: rEl ? parseInt(rEl.value) : SETTINGS_DEFAULTS.radioVol,
        shakeEnabled: window.shakeEnabled !== undefined ? window.shakeEnabled : true,
        dmgNumbersEnabled: window.dmgNumbersEnabled !== undefined ? window.dmgNumbersEnabled : true
    };
    try { localStorage.setItem('hl_survivor_settings', JSON.stringify(s)); } catch (e) { }
}

let _settingsReturnTo = null;

function openSettings(returnTo) {
    _settingsReturnTo = returnTo || null;
    if (returnTo) {
        const el = document.getElementById(returnTo);
        if (el) el.classList.add('h');
    }
    const sm = document.getElementById('settings-menu');
    if (sm) sm.classList.remove('h');
}

function closeSettings() {
    const sm = document.getElementById('settings-menu');
    if (sm) sm.classList.add('h');
    if (_settingsReturnTo) {
        const el = document.getElementById(_settingsReturnTo);
        if (el) el.classList.remove('h');
    }
    _settingsReturnTo = null;
}

// Global exports 
window.updateHUD = updateHUD;
window._showGoldDelta = _showGoldDelta;
window.gameOver = gameOver;
window.victory = victory;
window.LeaderboardData = LeaderboardData;
window.Leaderboard = Leaderboard;
window.getHighscores = getHighscores;
window.saveHighscore = saveHighscore;
window.getLifetimeStats = getLifetimeStats;
window.updateMenuHighscores = updateMenuHighscores;
window.loadSettings = loadSettings;
window.saveSettings = saveSettings;
window.openSettings = openSettings;
window.closeSettings = closeSettings;

// ============ STAGE MAP — BLOOMBERG TERMINAL ============
let _stageMapAnim = null;
let _stageMapCallback = null;

function showStageMap(callback) {
  _stageMapCallback = callback || null;
  // Hide all other overlays first
  document.querySelectorAll('.mo').forEach(m => m.classList.add('h'));
  document.getElementById('stage-map').classList.remove('h');
  drawStageMap();
}

function hideStageMap() {
  document.getElementById('stage-map').classList.add('h');
  if (_stageMapAnim) { cancelAnimationFrame(_stageMapAnim); _stageMapAnim = null; }
  if (_stageMapCallback) { const cb = _stageMapCallback; _stageMapCallback = null; cb(); }
}

let _stageMapNodes = []; // store node positions for click detection
window._stageMapSelected = -1; // selected stage (-1 = none, uses G.stage)

function drawStageMap() {
  const canvas = document.getElementById('stage-map-canvas');
  if (!canvas) return;
  window._stageMapSelected = G.stage; // default selection = current stage

  // Add click handler (only once)
  if (!canvas._smClickBound) {
    canvas._smClickBound = true;
    canvas.style.cursor = 'default';
    canvas.addEventListener('mousemove', function (e) {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      let hover = false;
      for (const nd of _stageMapNodes) {
        const dx = mx - nd.x, dy = my - nd.y;
        if (dx * dx + dy * dy < 18 * 18 && nd.unlocked) { hover = true; break; }
      }
      canvas.style.cursor = hover ? 'pointer' : 'default';
    });
    canvas.addEventListener('click', function (e) {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      for (const nd of _stageMapNodes) {
        const dx = mx - nd.x, dy = my - nd.y;
        if (dx * dx + dy * dy < 18 * 18 && nd.unlocked) {
          window._stageMapSelected = nd.stage;
          return;
        }
      }
    });
  }
  const c = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cw = window.innerWidth, ch = window.innerHeight;
  const maxR = 9; // DEBUG: all stages unlocked
  let t = 0;
  const BG = '#0e1117', CARD = '#141921', RED = '#ef5350', GRN = '#2de2b0', BRD = '#1e2230';

  // Layout — toolbar left, time axis bottom
  const TOP_H = 34, HDR_H = 30;
  const TOOLBAR_W = 44, PRICE_AX_W = 70, TIME_AX_H = 28;
  const STAGE_LBL_W = 155;
  const BTN_H = 40;
  const CH_L = TOOLBAR_W + STAGE_LBL_W + 8, CH_R = cw - PRICE_AX_W, CH_T = TOP_H + HDR_H + 8, CH_B = ch - TIME_AX_H - BTN_H - 8;
  const CH_W = CH_R - CH_L, CH_H = CH_B - CH_T;

  // Ticker data — real market prices (March 2026)
  const TK = [
    { s: 'BTC-USDC', p: 63640, c: -5.88 }, { s: 'ETH-USDC', p: 1856, c: -8.73 }, { s: 'SOL-USDC', p: 80.04, c: -3.00 },
    { s: 'HYPE-USDC', p: 30.87, c: 16.98 }, { s: 'DOGE-USDC', p: 0.0963, c: -5.50 }, { s: 'PEPE-USDC', p: 0.000003508, c: -9.64 },
    { s: 'ARB-USDC', p: 0.094, c: -6.91 }, { s: 'PURR-USDC', p: 0.42, c: -1.20 }, { s: 'AVAX-USDC', p: 8.51, c: -4.89 },
    { s: 'LINK-USDC', p: 8.83, c: -3.34 }
  ];
  let tkX = 0;

  // ── FIBONACCI RETRACEMENT — each stage = a fib level ──
  const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0, 1.272, 1.618, 2.618];
  const FIB_LABELS = ['0%', '23.6%', '38.2%', '50%', '61.8%', '78.6%', '100%', '127.2%', '161.8%', '261.8%'];
  const FIB_LOW = 12000, FIB_HIGH = 85000;
  const FIB_RANGE = FIB_HIGH - FIB_LOW;

  // Map fib level to price
  function fib2price(f) { return FIB_LOW + f * FIB_RANGE; }

  // Price range for chart (add padding)
  const pMin = FIB_LOW - FIB_RANGE * 0.08;
  const pMax = fib2price(FIB_LEVELS[9]) + FIB_RANGE * 0.12;

  // Helpers
  function p2y(p) { return CH_B - ((p - pMin) / (pMax - pMin)) * CH_H; }
  function rr(x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath(); }

  // Stage node positions — evenly spaced X, fib-level Y
  const sN = [];
  for (let s = 0; s < 10; s++) {
    const price = fib2price(FIB_LEVELS[s]);
    const x = CH_L + 40 + (s / 9) * (CH_W - 80);
    sN.push({ x: x, y: p2y(price), price: price, fib: FIB_LEVELS[s], fibLabel: FIB_LABELS[s] });
  }

  // Flow dots
  const fDots = [];
  for (let i = 0; i < 12; i++) fDots.push({ p: Math.random(), sp: 0.0015 + Math.random() * 0.003 });

  // Floating particles (subtle background ambiance)
  const bgParts = [];
  for (let i = 0; i < 30; i++) bgParts.push({ x: Math.random() * cw, y: Math.random() * ch, s: Math.random() * 1.5 + 0.5, sp: Math.random() * 0.3 + 0.1, a: Math.random() });

  // Floating price tags (HL homepage style)
  const floatTags = [];
  const ftData = [
    { s: 'BTC', p: '$63,640', c: false }, { s: 'ETH', p: '$1,856', c: false }, { s: 'SOL', p: '$80.04', c: false },
    { s: 'HYPE', p: '$30.87', c: true }, { s: 'DOGE', p: '$0.0963', c: false }, { s: 'PEPE', p: '$0.0000035', c: false },
    { s: 'AVAX', p: '$8.51', c: false }, { s: 'LINK', p: '$8.83', c: false }, { s: 'ARB', p: '$0.094', c: false },
    { s: 'PURR', p: '$0.42', c: false }, { s: 'OP', p: '$0.72', c: false }, { s: 'AAVE', p: '$198', c: true },
    { s: 'WIF', p: '$0.38', c: true }, { s: 'TIA', p: '$2.84', c: true }, { s: 'SUI', p: '$2.21', c: false },
    { s: 'INJ', p: '$9.60', c: true }, { s: 'SEI', p: '$0.14', c: false }, { s: 'JUP', p: '$0.41', c: true }
  ];
  for (let i = 0; i < ftData.length; i++) {
    const d = ftData[i];
    floatTags.push({
      x: Math.random() * cw,
      y: CH_T + Math.random() * CH_H * 0.85,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.15,
      sym: d.s, price: d.p, green: d.c,
      phase: Math.random() * Math.PI * 2,
      sz: 0.7 + Math.random() * 0.4
    });
  }

  function frame() {
    t += 0.016;
    c.clearRect(0, 0, cw * dpr, ch * dpr);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);

    // ── BACKGROUND ──
    c.fillStyle = BG; c.fillRect(0, 0, cw, ch);

    // Subtle floating particles
    for (const p of bgParts) {
      p.y -= p.sp; if (p.y < -5) { p.y = ch + 5; p.x = Math.random() * cw; }
      c.globalAlpha = 0.06 + Math.sin(t * 2 + p.a * 6) * 0.03;
      c.fillStyle = GRN;
      c.beginPath(); c.arc(p.x, p.y, p.s, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;

    // Floating price tags (HL homepage style)
    for (const ft of floatTags) {
      ft.x += ft.vx; ft.y += ft.vy;
      // Bounce off edges
      if (ft.x < 30 || ft.x > cw - 100) ft.vx *= -1;
      if (ft.y < CH_T + 20 || ft.y > CH_B - 30) ft.vy *= -1;
      // Gentle floating motion
      const ofy = Math.sin(t * 0.8 + ft.phase) * 0.3;
      ft.y += ofy;
      const alpha = 0.06 + Math.sin(t * 0.5 + ft.phase) * 0.025;
      c.globalAlpha = alpha;
      // Pill background
      const lbl = ft.sym + '  ' + ft.price;
      c.font = (10 * ft.sz) + 'px "JetBrains Mono", monospace';
      const tw = c.measureText(lbl).width + 16;
      const th = 22 * ft.sz;
      rr(ft.x - 4, ft.y - th / 2, tw, th, th / 2);
      c.fillStyle = ft.green ? 'rgba(45,226,176,0.15)' : 'rgba(255,255,255,0.06)';
      c.fill();
      c.strokeStyle = ft.green ? 'rgba(45,226,176,0.2)' : 'rgba(255,255,255,0.08)';
      c.lineWidth = 1; rr(ft.x - 4, ft.y - th / 2, tw, th, th / 2); c.stroke();
      // Text
      c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillStyle = ft.green ? GRN : 'rgba(255,255,255,0.7)';
      c.fillText(lbl, ft.x + 4, ft.y);
    }
    c.globalAlpha = 1;

    // ── TOP BAR (scrolling ticker) ──
    c.fillStyle = '#0b0f18'; c.fillRect(0, 0, cw, TOP_H);
    c.strokeStyle = BRD; c.lineWidth = 1;
    c.beginPath(); c.moveTo(0, TOP_H); c.lineTo(cw, TOP_H); c.stroke();
    c.save(); c.beginPath(); c.rect(0, 0, cw, TOP_H); c.clip();
    tkX -= 0.4; if (tkX < -TK.length * 240) tkX = 0;
    c.font = '11px "JetBrains Mono", monospace'; c.textBaseline = 'middle';
    function fmtP(v) { if (v >= 1000) return '$' + v.toLocaleString(undefined, { maximumFractionDigits: 0 }); if (v >= 1) return '$' + v.toFixed(2); if (v >= 0.01) return '$' + v.toFixed(4); return '$' + v.toFixed(9); }
    const tkSp = 250;
    for (let i = 0; i < TK.length * 3; i++) {
      const tk = TK[i % TK.length], x = tkX + i * tkSp;
      if (x > cw + 50 || x < -tkSp) continue;
      c.textAlign = 'left';
      c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillText(tk.s, x + 12, TOP_H / 2);
      c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillText(fmtP(tk.p), x + 107, TOP_H / 2);
      c.fillStyle = tk.c >= 0 ? GRN : RED;
      c.fillText((tk.c >= 0 ? '+' : '') + tk.c.toFixed(2) + '%', x + 190, TOP_H / 2);
      // Separator bar
      c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(x, TOP_H * 0.25, 1, TOP_H * 0.5);
    }
    c.restore();

    // ── HEADER BAR (pair + key info only) ──
    const hy = TOP_H;
    c.fillStyle = CARD; c.fillRect(0, hy, cw, HDR_H);
    c.strokeStyle = BRD; c.beginPath(); c.moveTo(0, hy + HDR_H); c.lineTo(cw, hy + HDR_H); c.stroke();
    const selIdx = Math.min(window._stageMapSelected, 9);
    const markP = sN[selIdx].price;
    const curFib = sN[selIdx];
    c.font = 'bold 14px "JetBrains Mono", monospace'; c.fillStyle = '#fff'; c.textAlign = 'left'; c.textBaseline = 'middle';
    const hdrX = TOOLBAR_W + 12;
    c.fillText('HYPER SURVIVOR', hdrX, hy + HDR_H / 2);
    // Fib-based stats (reflects selected stage)
    c.font = '11px "JetBrains Mono", monospace';
    c.fillStyle = GRN; c.fillText('$' + Math.round(markP).toLocaleString(), hdrX + 190, hy + HDR_H / 2);
    c.fillStyle = 'rgba(255,255,255,0.4)'; c.font = '10px "JetBrains Mono", monospace';
    c.fillText('FIB ' + curFib.fibLabel, hdrX + 290, hy + HDR_H / 2);
    c.fillStyle = GRN; c.fillText('+' + (curFib.fib * 100).toFixed(1) + '%', hdrX + 380, hy + HDR_H / 2);
    c.fillStyle = 'rgba(255,255,255,0.3)'; c.font = '9px "JetBrains Mono", monospace';
    c.fillText('Stage ' + (window._stageMapSelected + 1) + ' / 10', hdrX + 470, hy + HDR_H / 2);

    // ── FIBONACCI RETRACEMENT (TradingView style — drawn by a trader) ──
    // Zone colors between fib levels (classic TV palette)
    const FIB_ZONE_COLORS = [
      'rgba(244,67,54,0.06)',    // 0 → 23.6%       red zone
      'rgba(255,152,0,0.05)',    // 23.6 → 38.2%    orange
      'rgba(255,235,59,0.05)',   // 38.2 → 50%      yellow
      'rgba(76,175,80,0.05)',    // 50 → 61.8%      green
      'rgba(45,226,176,0.06)',   // 61.8 → 78.6%    teal (golden pocket!)
      'rgba(33,150,243,0.05)',   // 78.6 → 100%     blue
      'rgba(156,39,176,0.04)',   // 100 → 127.2%    purple (extension)
      'rgba(233,30,99,0.04)',    // 127.2 → 161.8%  pink
      'rgba(255,193,7,0.04)',    // 161.8 → 261.8%  gold
    ];
    const FIB_LINE_COLORS = [
      '#ef5350',  // 0%
      '#ff9800',  // 23.6%
      '#fdd835',  // 38.2%
      '#66bb6a',  // 50%
      '#2de2b0',  // 61.8%
      '#42a5f5',  // 78.6%
      '#ab47bc',  // 100%
      '#ec407a',  // 127.2%
      '#ffa726',  // 161.8%
      '#ffd54f',  // 261.8%
    ];

    // Fib horizontal lines + labels
    for (let i = 0; i < 10; i++) {
      const fy = sN[i].y;
      const ul = i <= maxR, cur = i === window._stageMapSelected;
      const lineCol = FIB_LINE_COLORS[i];

      // Horizontal fib line (colored, vivid)
      c.strokeStyle = lineCol;
      c.globalAlpha = cur ? 1 : ul ? 0.75 : 0.25;
      c.lineWidth = cur ? 3 : 2;
      c.beginPath(); c.moveTo(CH_L, fy); c.lineTo(CH_R, fy); c.stroke();
      c.globalAlpha = 1;

      // LEFT label pill — Stage name (centered in label zone)
      const pal_f = typeof STAGE_PALETTES !== 'undefined' ? STAGE_PALETTES[i] : {name: 'STAGE '+(i+1)};
      const stageTxt = pal_f.name.toUpperCase();
      c.font = (cur ? 'bold ' : '') + '10px "JetBrains Mono", monospace';
      const lblH = 20;
      const lblX = TOOLBAR_W + 4;
      const lblW2 = STAGE_LBL_W - 4;
      rr(lblX, fy - lblH / 2, lblW2, lblH, 3);
      c.fillStyle = cur ? lineCol : 'rgba(30,34,48,0.9)'; c.fill();
      c.strokeStyle = cur ? lineCol : (ul ? lineCol + '55' : 'rgba(255,255,255,0.06)');
      c.lineWidth = 1; rr(lblX, fy - lblH / 2, lblW2, lblH, 3); c.stroke();
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = cur ? '#000' : (ul ? lineCol : 'rgba(255,255,255,0.2)');
      c.fillText(stageTxt, lblX + lblW2 / 2, fy);

    }

    // ── PRICE CURVE (the main rising line through stages) ──
    // Area fill under unlocked curve
    if (maxR >= 0) {
      c.beginPath(); c.moveTo(sN[0].x, sN[0].y);
      for (let i = 1; i <= maxR; i++) {
        const prev = sN[i - 1], cur = sN[i];
        const cpx = (prev.x + cur.x) / 2;
        c.quadraticCurveTo(cpx, prev.y, cur.x, cur.y);
      }
      c.lineTo(sN[maxR].x, CH_B); c.lineTo(sN[0].x, CH_B); c.closePath();
      const aGrad = c.createLinearGradient(0, CH_T, 0, CH_B);
      aGrad.addColorStop(0, 'rgba(45,226,176,0.1)'); aGrad.addColorStop(1, 'rgba(45,226,176,0)');
      c.fillStyle = aGrad; c.fill();

      // Glowing line
      c.beginPath(); c.moveTo(sN[0].x, sN[0].y);
      for (let i = 1; i <= maxR; i++) {
        const prev = sN[i - 1], cur = sN[i];
        const cpx = (prev.x + cur.x) / 2;
        c.quadraticCurveTo(cpx, prev.y, cur.x, cur.y);
      }
      c.strokeStyle = GRN; c.shadowColor = GRN; c.shadowBlur = 10; c.lineWidth = 2.5; c.stroke();
      c.shadowBlur = 0;
    }

    // Current price tag on right axis (reflects selected stage)
    const curY = sN[window._stageMapSelected].y;
    c.fillStyle = GRN; rr(CH_R + 2, curY - 11, PRICE_AX_W - 8, 22, 3); c.fill();
    c.fillStyle = '#000'; c.font = 'bold 10px "JetBrains Mono", monospace';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('$' + Math.round(markP).toLocaleString(), CH_R + PRICE_AX_W / 2 - 2, curY);

    // ── FLOW DOTS along unlocked curve ──
    if (maxR > 0) {
      for (const fd of fDots) {
        fd.p += fd.sp; if (fd.p > 1) fd.p = 0;
        const seg = fd.p * maxR, si = Math.floor(seg), sf = seg - si;
        if (si < maxR) {
          const a = sN[si], b = sN[si + 1];
          const dx = a.x + (b.x - a.x) * sf;
          const dy = a.y + (b.y - a.y) * sf;
          c.beginPath(); c.arc(dx, dy, 2, 0, Math.PI * 2);
          c.fillStyle = GRN; c.shadowColor = GRN; c.shadowBlur = 8;
          c.globalAlpha = 0.4 + Math.sin(t * 5 + fd.p * 10) * 0.4;
          c.fill(); c.shadowBlur = 0; c.globalAlpha = 1;
        }
      }
    }

    // ── STAGE NODES ON THE CURVE ──
    _stageMapNodes = [];
    for (let i = 0; i < 10; i++) {
      const nx = sN[i].x, ny = sN[i].y;
      const pal = typeof STAGE_PALETTES !== 'undefined' ? STAGE_PALETTES[i] : null;
      const ul = i <= maxR, sel = i === window._stageMapSelected;
      _stageMapNodes.push({ x: nx, y: ny, stage: i, unlocked: ul });

      if (!ul) {
        // Locked: red node with stage number
        c.beginPath(); c.arc(nx, ny, 14, 0, Math.PI * 2);
        c.fillStyle = '#1a1014'; c.fill();
        c.strokeStyle = RED; c.lineWidth = 2;
        c.globalAlpha = 0.5; c.stroke(); c.globalAlpha = 1;
        c.font = 'bold 11px "JetBrains Mono", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = RED; c.globalAlpha = 0.6;
        c.fillText('' + (i + 1), nx, ny);
        c.globalAlpha = 1;
      } else if (sel) {
        // Selected stage: pulsing glow node
        const pulse = Math.sin(t * 3) * 0.3 + 0.7;
        // Outer glow rings
        c.beginPath(); c.arc(nx, ny, 26 + Math.sin(t * 2) * 3, 0, Math.PI * 2);
        c.strokeStyle = GRN + '15'; c.lineWidth = 1; c.stroke();
        c.beginPath(); c.arc(nx, ny, 20 + Math.sin(t * 2.5) * 2, 0, Math.PI * 2);
        c.strokeStyle = GRN + '25'; c.lineWidth = 1; c.stroke();
        // Main node
        c.beginPath(); c.arc(nx, ny, 16, 0, Math.PI * 2);
        c.fillStyle = '#0e1117'; c.fill();
        c.strokeStyle = GRN; c.lineWidth = 2.5; c.shadowColor = GRN; c.shadowBlur = 15;
        c.stroke(); c.shadowBlur = 0;
        // Inner glow
        const ig = c.createRadialGradient(nx, ny, 0, nx, ny, 14);
        ig.addColorStop(0, 'rgba(45,226,176,' + (0.15 * pulse).toFixed(2) + ')');
        ig.addColorStop(1, 'rgba(45,226,176,0)');
        c.fillStyle = ig; c.beginPath(); c.arc(nx, ny, 14, 0, Math.PI * 2); c.fill();
        // Stage number inside node
        c.font = 'bold 12px "JetBrains Mono", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = GRN; c.fillText('' + (i + 1), nx, ny);
      } else {
        // Unlocked: green node + stage number
        c.beginPath(); c.arc(nx, ny, 12, 0, Math.PI * 2);
        c.fillStyle = '#0e1117'; c.fill();
        c.strokeStyle = GRN; c.lineWidth = 2;
        c.shadowColor = GRN; c.shadowBlur = 6; c.stroke(); c.shadowBlur = 0;
        c.font = 'bold 11px "JetBrains Mono", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = GRN; c.fillText('' + (i + 1), nx, ny);
      }
    }

    // ── LEFT TOOLBAR (TradingView style drawing tools) ──
    c.fillStyle = '#0b0f18'; c.fillRect(0, TOP_H, TOOLBAR_W, ch - TOP_H);
    c.strokeStyle = BRD; c.lineWidth = 1;
    c.beginPath(); c.moveTo(TOOLBAR_W, TOP_H); c.lineTo(TOOLBAR_W, ch); c.stroke();

    const tools = [
      // 0: Cursor (arrow)
      (x, y) => { c.beginPath(); c.moveTo(x - 4, y - 8); c.lineTo(x - 4, y + 4); c.lineTo(x - 1, y + 1); c.lineTo(x + 3, y + 7); c.lineTo(x + 5, y + 6); c.lineTo(x + 1, y); c.lineTo(x + 5, y); c.closePath(); c.fill(); },
      // 1: Crosshair
      (x, y) => { c.beginPath(); c.moveTo(x, y - 8); c.lineTo(x, y - 3); c.moveTo(x, y + 3); c.lineTo(x, y + 8); c.moveTo(x - 8, y); c.lineTo(x - 3, y); c.moveTo(x + 3, y); c.lineTo(x + 8, y); c.stroke(); c.beginPath(); c.arc(x, y, 3, 0, Math.PI * 2); c.stroke(); },
      // 2: Trend line (with endpoints)
      (x, y) => { c.beginPath(); c.moveTo(x - 8, y + 6); c.lineTo(x + 8, y - 6); c.stroke(); c.beginPath(); c.arc(x - 8, y + 6, 2, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(x + 8, y - 6, 2, 0, Math.PI * 2); c.fill(); },
      // 3: Fib retracement (highlighted — active tool)
      (x, y) => { c.beginPath(); c.moveTo(x - 8, y + 7); c.lineTo(x - 8, y - 7); c.lineTo(x + 8, y - 7); c.stroke(); for (let j = 0; j < 4; j++) { const ly = y - 7 + j * 4.7; c.beginPath(); c.moveTo(x - 7, ly); c.lineTo(x + 7, ly); c.stroke(); } },
      // 4: Horizontal ray
      (x, y) => { c.beginPath(); c.moveTo(x - 8, y); c.lineTo(x + 8, y); c.stroke(); c.beginPath(); c.arc(x - 8, y, 2, 0, Math.PI * 2); c.fill(); c.beginPath(); c.moveTo(x + 5, y - 3); c.lineTo(x + 8, y); c.lineTo(x + 5, y + 3); c.stroke(); },
      // 5: Channel (parallel lines)
      (x, y) => { c.beginPath(); c.moveTo(x - 8, y + 2); c.lineTo(x + 8, y - 4); c.moveTo(x - 8, y + 7); c.lineTo(x + 8, y + 1); c.stroke(); c.setLineDash([2, 2]); c.beginPath(); c.moveTo(x - 8, y + 4.5); c.lineTo(x + 8, y - 1.5); c.stroke(); c.setLineDash([]); },
      // 6: Pitchfork
      (x, y) => { c.beginPath(); c.moveTo(x - 8, y + 5); c.lineTo(x, y - 7); c.lineTo(x + 8, y + 5); c.stroke(); c.setLineDash([2, 2]); c.beginPath(); c.moveTo(x, y - 7); c.lineTo(x, y + 7); c.stroke(); c.setLineDash([]); },
      // 7: Rectangle
      (x, y) => { c.strokeRect(x - 7, y - 5, 14, 10); c.beginPath(); c.arc(x - 7, y - 5, 1.5, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(x + 7, y + 5, 1.5, 0, Math.PI * 2); c.fill(); },
      // 8: Brush / freehand
      (x, y) => { c.beginPath(); c.moveTo(x - 7, y + 4); c.quadraticCurveTo(x - 4, y - 6, x, y); c.quadraticCurveTo(x + 4, y + 6, x + 7, y - 2); c.stroke(); },
      // 9: Text "Abc"
      (x, y) => { c.font = '10px "JetBrains Mono", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Abc', x, y); },
      // 10: Ruler / measure
      (x, y) => { c.beginPath(); c.moveTo(x - 7, y + 6); c.lineTo(x + 7, y - 6); c.stroke(); c.beginPath(); c.arc(x - 7, y + 6, 1.5, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(x + 7, y - 6, 1.5, 0, Math.PI * 2); c.fill(); c.beginPath(); c.moveTo(x - 7, y + 6); c.lineTo(x - 7, y - 2); c.moveTo(x + 7, y - 6); c.lineTo(x + 7, y + 2); c.stroke(); },
      // 11: Magnet
      (x, y) => { c.beginPath(); c.arc(x, y - 3, 6, Math.PI, 0); c.stroke(); c.fillRect(x - 6, y - 3, 3, 7); c.fillRect(x + 3, y - 3, 3, 7); },
      // 12: Eye (show/hide)
      (x, y) => { c.beginPath(); c.moveTo(x - 8, y); c.quadraticCurveTo(x, y - 7, x + 8, y); c.quadraticCurveTo(x, y + 7, x - 8, y); c.closePath(); c.stroke(); c.beginPath(); c.arc(x, y, 2.5, 0, Math.PI * 2); c.fill(); },
      // 13: Trash can
      (x, y) => { c.beginPath(); c.moveTo(x - 6, y - 4); c.lineTo(x + 6, y - 4); c.stroke(); c.beginPath(); c.moveTo(x - 2, y - 4); c.lineTo(x - 1, y - 7); c.lineTo(x + 1, y - 7); c.lineTo(x + 2, y - 4); c.stroke(); c.beginPath(); c.moveTo(x - 5, y - 4); c.lineTo(x - 4, y + 7); c.lineTo(x + 4, y + 7); c.lineTo(x + 5, y - 4); c.stroke(); c.beginPath(); c.moveTo(x - 1, y - 2); c.lineTo(x - 1, y + 5); c.moveTo(x + 1, y - 2); c.lineTo(x + 1, y + 5); c.stroke(); }
    ];

    const fibToolIdx = 3;
    const tStartY = TOP_H + 20;
    const toolSpacing = 32;
    for (let i = 0; i < tools.length; i++) {
      const tx = TOOLBAR_W / 2, ty = tStartY + i * toolSpacing;
      if (ty > ch - 60) break;
      // Separator lines between tool groups
      if (i === 2 || i === 7 || i === 10 || i === 12) {
        c.strokeStyle = 'rgba(255,255,255,0.06)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(6, ty - toolSpacing / 2); c.lineTo(TOOLBAR_W - 6, ty - toolSpacing / 2); c.stroke();
      }
      // Highlight active tool (fib)
      if (i === fibToolIdx) {
        c.fillStyle = 'rgba(45,226,176,0.12)';
        rr(4, ty - 12, TOOLBAR_W - 8, 24, 4); c.fill();
        c.strokeStyle = GRN + '33'; c.lineWidth = 1;
        rr(4, ty - 12, TOOLBAR_W - 8, 24, 4); c.stroke();
      }
      c.strokeStyle = i === fibToolIdx ? GRN : 'rgba(255,255,255,0.35)';
      c.fillStyle = i === fibToolIdx ? GRN : 'rgba(255,255,255,0.35)';
      c.lineWidth = 1.3;
      tools[i](tx, ty);
    }

    // ── BOTTOM TIME AXIS ──
    const taY = CH_B + 4;
    c.fillStyle = '#0b0f18'; c.fillRect(TOOLBAR_W, taY, cw - TOOLBAR_W, TIME_AX_H);
    c.strokeStyle = BRD; c.lineWidth = 1;
    c.beginPath(); c.moveTo(TOOLBAR_W, taY); c.lineTo(cw, taY); c.stroke();

    c.font = '9px "JetBrains Mono", monospace'; c.textBaseline = 'middle'; c.textAlign = 'center';
    // Time labels at each stage x position
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 0; i < 10; i++) {
      const tx = sN[i].x;
      const m = months[(i + 2) % 12];
      const yr = i < 10 ? '25' : '26';
      const label = m + " '" + yr;
      // Tick mark
      c.strokeStyle = 'rgba(255,255,255,0.1)';
      c.beginPath(); c.moveTo(tx, taY); c.lineTo(tx, taY + 5); c.stroke();
      // Label
      c.fillStyle = i === G.stage ? GRN : 'rgba(255,255,255,0.3)';
      c.fillText(label, tx, taY + 16);
    }

    _stageMapAnim = requestAnimationFrame(frame);
  }
  frame();
}

// Ensure the functions are exported to window so they are available globally
window.showStageMap = showStageMap;
window.hideStageMap = hideStageMap;
window.drawStageMap = drawStageMap;

