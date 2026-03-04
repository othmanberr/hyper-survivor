// ============ SMART CONTRACT MISSIONS ============
// Alive4ever-inspired secondary objectives during gameplay

const MISSION_INTERVAL = 120;   // Seconds between mission triggers
const MISSION_DURATION = 30;    // Seconds before mission expires
const MISSION_PROXIMITY = 60;   // Distance to NPC for rescue
const MISSION_ZONE_RADIUS = 100; // King of the Hill zone radius
const MISSION_HOLD_TIME = 10;   // Seconds to complete objective

const MISSION_TYPES = ['rescue', 'kingOfHill'];

let currentMission = null;
let missionTimer = MISSION_INTERVAL; // countdown to next mission
let missionAlertTimer = 0;

// ---- MISSION DATA ----
const MISSION_NAMES = {
    rescue: ['DEV RESCUE', 'WHALE RESCUE', 'NODE OPERATOR RESCUE', 'VALIDATOR RESCUE'],
    kingOfHill: ['LIQUIDITY POOL', 'PEG ZONE', 'STAKING NODE', 'CONSENSUS ZONE']
};

// ---- PUBLIC API ----
function updateMissions(dt) {
    // Mission spawn timer
    if (!currentMission) {
        missionTimer -= dt;
        if (missionTimer <= 0) {
            spawnMission();
            missionTimer = MISSION_INTERVAL;
        }
        return;
    }

    // Alert fade
    if (missionAlertTimer > 0) missionAlertTimer -= dt;

    // Mission expiry
    currentMission.timeLeft -= dt;
    if (currentMission.timeLeft <= 0) {
        failMission();
        return;
    }

    // Mission logic
    if (currentMission.type === 'rescue') {
        updateRescueMission(dt);
    } else if (currentMission.type === 'kingOfHill') {
        updateKingOfHillMission(dt);
    }
}

function renderMissions(ctx) {
    if (!currentMission) return;

    if (currentMission.type === 'rescue') {
        renderRescue(ctx);
    } else if (currentMission.type === 'kingOfHill') {
        renderKingOfHill(ctx);
    }
}

function renderMissionHUD(ctx) {
    if (!currentMission) return;

    ctx.save();

    // Direction indicator to mission objective
    const mx = currentMission.x - CAM.x, my = currentMission.y - CAM.y;
    const onScreen = mx > 20 && mx < W - 20 && my > 20 && my < H - 20;

    if (!onScreen) {
        // Draw edge arrow pointing to mission
        const cx = W / 2, cy = H / 2;
        const ang = Math.atan2(my - cy, mx - cx);
        const pad = 35;
        // Clamp to screen edge
        let ix = cx + Math.cos(ang) * (W / 2 - pad);
        let iy = cy + Math.sin(ang) * (H / 2 - pad);
        ix = Math.max(pad, Math.min(W - pad, ix));
        iy = Math.max(pad, Math.min(H - pad, iy));

        ctx.translate(ix, iy);
        ctx.rotate(ang);

        // Pulsing arrow
        const pulse = 0.6 + Math.sin(G.totalTime * 5) * 0.4;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = currentMission.type === 'rescue' ? '#2ed573' : '#ffa502';
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(-6, -8);
        ctx.lineTo(-6, 8);
        ctx.closePath();
        ctx.fill();

        // Distance text
        ctx.rotate(-ang);
        const dist = Math.round(Math.hypot(currentMission.x - P.x, currentMission.y - P.y));
        ctx.font = "bold 9px 'JetBrains Mono'";
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.7;
        ctx.fillText(`${dist}m`, 0, 18);
        ctx.translate(-ix, -iy);
    }

    // Mission info bar (top of screen)
    const barY = 115;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(W / 2 - 160, barY, 320, 32);
    ctx.strokeStyle = currentMission.type === 'rescue' ? '#2ed573' : '#ffa502';
    ctx.lineWidth = 1;
    ctx.strokeRect(W / 2 - 160, barY, 320, 32);

    // Mission name
    ctx.font = "bold 10px 'JetBrains Mono'";
    ctx.textAlign = 'left';
    ctx.fillStyle = currentMission.type === 'rescue' ? '#2ed573' : '#ffa502';
    ctx.fillText(`⚡ ${currentMission.name}`, W / 2 - 150, barY + 14);

    // Progress bar
    const prog = currentMission.progress / MISSION_HOLD_TIME;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(W / 2 + 30, barY + 8, 100, 8);
    ctx.fillStyle = currentMission.type === 'rescue' ? '#2ed573' : '#ffa502';
    ctx.fillRect(W / 2 + 30, barY + 8, 100 * prog, 8);

    // Time left
    ctx.textAlign = 'right';
    ctx.fillStyle = currentMission.timeLeft < 10 ? '#ff4757' : '#aaa';
    ctx.font = "9px 'JetBrains Mono'";
    ctx.fillText(`${Math.ceil(currentMission.timeLeft)}s`, W / 2 + 155, barY + 26);

    ctx.globalAlpha = 1;
    ctx.restore();
}

function resetMissions() {
    currentMission = null;
    missionTimer = MISSION_INTERVAL;
    missionAlertTimer = 0;
    const alert = document.getElementById('mission-alert');
    if (alert) alert.classList.add('h');
}

// ---- SPAWN ----
function spawnMission() {
    const type = MISSION_TYPES[Math.floor(Math.random() * MISSION_TYPES.length)];
    const names = MISSION_NAMES[type];
    const name = names[Math.floor(Math.random() * names.length)];

    // Spawn within 250-400px of player
    const ang = Math.random() * Math.PI * 2;
    const dist = 250 + Math.random() * 150;
    const mx = Math.max(50, Math.min(WORLD_W - 50, P.x + Math.cos(ang) * dist));
    const my = Math.max(50, Math.min(WORLD_H - 50, P.y + Math.sin(ang) * dist));

    currentMission = {
        type, name,
        x: mx, y: my,
        progress: 0,
        timeLeft: MISSION_DURATION,
        completed: false,
        pulseT: 0
    };

    // Show alert
    missionAlertTimer = 2.5;
    showMissionAlert(name, type);
    playSound('missionSpawn');
}

// ---- RESCUE MISSION ----
function updateRescueMission(dt) {
    const m = currentMission;
    m.pulseT += dt;

    const dist = Math.hypot(P.x - m.x, P.y - m.y);
    if (dist < MISSION_PROXIMITY) {
        m.progress += dt;
        if (m.progress >= MISSION_HOLD_TIME) {
            completeMission('rescue');
        }
    } else {
        // Slow decay if player leaves
        m.progress = Math.max(0, m.progress - dt * 0.5);
    }
}

function renderRescue(ctx) {
    const m = currentMission;
    const pulse = 1 + Math.sin(m.pulseT * 4) * 0.15;

    // NPC glow ring
    ctx.save();
    ctx.globalAlpha = 0.2 + Math.sin(m.pulseT * 3) * 0.1;
    ctx.beginPath();
    ctx.arc(m.x, m.y, MISSION_PROXIMITY * pulse, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(46, 213, 115, 0.1)';
    ctx.fill();
    ctx.strokeStyle = '#2ed573';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.restore();

    // NPC sprite (simple pixel character)
    ctx.save();
    ctx.translate(m.x, m.y);
    const bob = Math.sin(m.pulseT * 2.5) * 3;
    ctx.translate(0, bob);

    // Body
    ctx.fillStyle = '#2ed573';
    ctx.fillRect(-5, -10, 10, 14);
    // Head
    ctx.fillStyle = '#f1f2f6';
    ctx.fillRect(-4, -16, 8, 7);
    // Eyes
    ctx.fillStyle = '#2ed573';
    ctx.fillRect(-2, -14, 2, 2);
    ctx.fillRect(2, -14, 2, 2);
    // Label
    ctx.font = "bold 8px 'JetBrains Mono'";
    ctx.textAlign = 'center';
    ctx.fillStyle = '#2ed573';
    ctx.globalAlpha = 0.9;
    ctx.fillText('DEV', 0, -20);

    ctx.restore();

    // Progress bar above NPC
    if (m.progress > 0) {
        const prog = m.progress / MISSION_HOLD_TIME;
        const barW = 40;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(m.x - barW / 2, m.y - 30, barW, 5);
        ctx.fillStyle = '#2ed573';
        ctx.fillRect(m.x - barW / 2, m.y - 30, barW * prog, 5);
    }
}

// ---- KING OF THE HILL ----
function updateKingOfHillMission(dt) {
    const m = currentMission;
    m.pulseT += dt;

    const dist = Math.hypot(P.x - m.x, P.y - m.y);
    if (dist < MISSION_ZONE_RADIUS) {
        m.progress += dt;
        if (m.progress >= MISSION_HOLD_TIME) {
            completeMission('kingOfHill');
        }
    } else {
        m.progress = Math.max(0, m.progress - dt * 0.5);
    }
}

function renderKingOfHill(ctx) {
    const m = currentMission;
    const pulse = 1 + Math.sin(m.pulseT * 3) * 0.05;

    ctx.save();

    // Zone circle
    const prog = m.progress / MISSION_HOLD_TIME;
    ctx.beginPath();
    ctx.arc(m.x, m.y, MISSION_ZONE_RADIUS * pulse, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 165, 2, ${0.05 + prog * 0.08})`;
    ctx.fill();

    // Border ring
    ctx.beginPath();
    ctx.arc(m.x, m.y, MISSION_ZONE_RADIUS * pulse, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffa502';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.4 + Math.sin(m.pulseT * 5) * 0.2;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Progress ring (arc that fills as you hold)
    if (prog > 0) {
        ctx.beginPath();
        ctx.arc(m.x, m.y, MISSION_ZONE_RADIUS + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog);
        ctx.strokeStyle = '#ffa502';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.8;
        ctx.stroke();
    }

    // Zone label
    ctx.globalAlpha = 0.7;
    ctx.font = "bold 10px 'JetBrains Mono'";
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffa502';
    ctx.fillText(m.name, m.x, m.y + MISSION_ZONE_RADIUS + 16);

    ctx.restore();

    // Progress bar
    if (m.progress > 0) {
        const barW = 60;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(m.x - barW / 2, m.y - MISSION_ZONE_RADIUS - 15, barW, 5);
        ctx.fillStyle = '#ffa502';
        ctx.fillRect(m.x - barW / 2, m.y - MISSION_ZONE_RADIUS - 15, barW * prog, 5);
    }
}

// ---- COMPLETION / FAILURE ----
function completeMission(type) {
    currentMission.completed = true;
    playSound('missionComplete');

    if (type === 'rescue') {
        // Full heal
        P.hp = P.maxHp;
        dmgNums.push({ x: P.x, y: P.y - 30, n: 'FULL HEAL', life: 0.8, col: '#2ed573' });
        G.gold += 20;
        G.totalGoldEarned += 20;
        fxExplosion(currentMission.x, currentMission.y, 40);
    } else if (type === 'kingOfHill') {
        // Temporary 2x damage buff for 15 seconds
        P.dmgMult *= 2;
        dmgNums.push({ x: P.x, y: P.y - 30, n: '2x DMG BUFF', life: 0.8, col: '#ffa502' });
        G.gold += 30;
        G.totalGoldEarned += 30;
        setTimeout(() => { P.dmgMult /= 2; }, 15000);
        fxExplosion(currentMission.x, currentMission.y, 60);
    }

    showMissionAlert('CONTRACT COMPLETE ✓', currentMission.type);
    triggerShake(8, 0.3);
    triggerSlowmo(0.2, 0.4);
    currentMission = null;
}

function failMission() {
    dmgNums.push({ x: P.x, y: P.y - 30, n: 'MISSION EXPIRED', life: 0.6, col: '#ff4757' });
    currentMission = null;
}

// ---- ALERT UI ----
function showMissionAlert(text, type) {
    const el = document.getElementById('mission-alert');
    el.classList.remove('h');
    el.style.borderColor = type === 'rescue' ? '#2ed573' : '#ffa502';
    el.style.color = type === 'rescue' ? '#2ed573' : '#ffa502';
    el.textContent = `⚡ ${text}`;
    setTimeout(() => el.classList.add('h'), 2500);
}
