
// ============ ENEMY MOVEMENT PHYSICS ============
// Per-type tuning: accel = acceleration, friction = drag, maxSpd = speed cap multiplier, separation = push force
const ENEMY_MOVE = [
  /* 0 Bat      */ { accel: 1000, friction: 5,   maxSpd: 80, separation: 18, steer: 1.45, anticipation: 0.18, sepRadius: 2.7 },
  /* 1 Mushroom */ { accel: 400,  friction: 3,   maxSpd: 45, separation: 34, steer: 1.00, anticipation: 0.08, sepRadius: 2.9 },
  /* 2 Crab     */ { accel: 1400, friction: 4,   maxSpd: 110, separation: 16, steer: 1.8, anticipation: 0.10, sepRadius: 2.2 },
  /* 3 Doll     */ { accel: 1200, friction: 6,   maxSpd: 65, separation: 22, steer: 1.55, anticipation: 0.16, sepRadius: 2.5 },
  /* 4 Nun      */ { accel: 500,  friction: 4,   maxSpd: 50, separation: 34, steer: 1.05, anticipation: 0.20, sepRadius: 3.0 },
  /* 5 Mage     */ { accel: 600,  friction: 5,   maxSpd: 55, separation: 32, steer: 1.10, anticipation: 0.22, sepRadius: 3.0 },
  /* 6 Dog      */ { accel: 1100, friction: 4,   maxSpd: 85, separation: 20, steer: 1.35, anticipation: 0.18, sepRadius: 2.4 },
  /* 7 Pumpkin  */ { accel: 500,  friction: 4,   maxSpd: 50, separation: 32, steer: 1.05, anticipation: 0.18, sepRadius: 2.9 },
];

const ENEMY_THREAT_META = [
  { color: '#ff6f99', accent: '#ffd0df', priority: 1.1, space: 0.04, mode: 'swarm', icon: 'swarm' },
  { color: '#9cff52', accent: '#e6ffb8', priority: 1.15, space: 0.18, mode: 'hazard', icon: 'hazard' },
  { color: '#ff9966', accent: '#ffe0c7', priority: 1.45, space: 0.2, mode: 'charge', icon: 'charge' },
  { color: '#d47cff', accent: '#f0d7ff', priority: 1.4, space: 0.08, mode: 'ambush', icon: 'cast' },
  { color: '#7dff9a', accent: '#e1ffe8', priority: 1.55, space: 0.22, mode: 'support', icon: 'support' },
  { color: '#67d8ff', accent: '#d8f6ff', priority: 1.7, space: 0.22, mode: 'cast', icon: 'cast' },
  { color: '#ff5f79', accent: '#ffd2da', priority: 1.6, space: 0.1, mode: 'charge', icon: 'charge' },
  { color: '#ffb347', accent: '#ffe8c4', priority: 1.65, space: 0.2, mode: 'cast', icon: 'cast' },
];

function enemyMoveCfg(e) {
  return ENEMY_MOVE[e.type] || ENEMY_MOVE[0];
}

function getEnemyThreatMeta(eOrType) {
  const type = typeof eOrType === 'number' ? eOrType : (eOrType && eOrType.type);
  return ENEMY_THREAT_META[type] || ENEMY_THREAT_META[0];
}

function clampEnemyValue(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

const ENEMY_ROLE_ANGLES = [0, -Math.PI * 0.58, Math.PI * 0.58, Math.PI];

function clampCombatPoint(x, y, pad) {
  const margin = pad || 28;
  return {
    x: clampEnemyValue(x, BUILDING_LEFT + margin, BUILDING_RIGHT - margin),
    y: clampEnemyValue(y, BUILDING_TOP + margin, BUILDING_BOTTOM - margin),
  };
}

function getEnemySpawnEntryVector(x, y) {
  const leftDist = Math.abs(x - BUILDING_LEFT);
  const rightDist = Math.abs(BUILDING_RIGHT - x);
  const topDist = Math.abs(y - BUILDING_TOP);
  const bottomDist = Math.abs(BUILDING_BOTTOM - y);
  const edge = Math.min(leftDist, rightDist, topDist, bottomDist);
  if (edge === leftDist) return { x: 1, y: 0 };
  if (edge === rightDist) return { x: -1, y: 0 };
  if (edge === topDist) return { x: 0, y: 1 };
  if (edge === bottomDist) return { x: 0, y: -1 };
  const dx = P.x - x;
  const dy = P.y - y;
  const ds = Math.hypot(dx, dy) || 1;
  return { x: dx / ds, y: dy / ds };
}

function ensureEnemyMotionState(e) {
  if (e._motionSeed === undefined) e._motionSeed = Math.random() * Math.PI * 2;
  if (!e._strafeDir) e._strafeDir = Math.random() < 0.5 ? -1 : 1;
  if (!Number.isFinite(e._strafeTimer)) e._strafeTimer = 0.8 + Math.random() * 1.0;
  if (!Number.isFinite(e._sepVX)) e._sepVX = 0;
  if (!Number.isFinite(e._sepVY)) e._sepVY = 0;
  if (!Number.isFinite(e._phaseTimer)) e._phaseTimer = 0;
  if (!Number.isInteger(e._roleIndex)) e._roleIndex = Math.floor(Math.random() * ENEMY_ROLE_ANGLES.length);
  if (!Number.isFinite(e._threatBoost)) e._threatBoost = 0;
  if (!e._threatMode) e._threatMode = getEnemyThreatMeta(e).mode;
  if (!e._threatColor) e._threatColor = getEnemyThreatMeta(e).color;
  if (!e._attitude) e._attitude = 'hunt';
  if (!Number.isFinite(e._attitudeTimer)) e._attitudeTimer = 0;
  if (!Number.isFinite(e._attitudePower)) e._attitudePower = 0;
  if (!Number.isFinite(e._alertTimer)) e._alertTimer = 0;
  if (!Number.isFinite(e._staggerTimer)) e._staggerTimer = 0;
  if (!Number.isFinite(e._spawnDirX)) e._spawnDirX = 0;
  if (!Number.isFinite(e._spawnDirY)) e._spawnDirY = 1;
  if (!Number.isFinite(e._hitDirX)) e._hitDirX = 0;
  if (!Number.isFinite(e._hitDirY)) e._hitDirY = -1;
  if (!Number.isFinite(e._deathDirX)) e._deathDirX = 0;
  if (!Number.isFinite(e._deathDirY)) e._deathDirY = -1;
}

function setEnemyThreatState(e, mode, boost, color) {
  const meta = getEnemyThreatMeta(e);
  e._threatMode = mode || meta.mode;
  e._threatBoost = boost !== undefined ? boost : meta.priority * 0.08;
  e._threatColor = color || meta.color;
}

function setEnemyAttitude(e, attitude, duration, power) {
  ensureEnemyMotionState(e);
  e._attitude = attitude || e._attitude || 'hunt';
  e._attitudeTimer = Math.max(0, duration || 0);
  if (power !== undefined) e._attitudePower = power;
}

function setEnemyTelegraph(e, kind, duration, data) {
  e._telegraph = {
    kind,
    duration: Math.max(0.05, duration || 0.2),
    timer: Math.max(0.05, duration || 0.2),
    data: Object.assign({}, data || {}),
  };
}

function patchEnemyTelegraph(e, data) {
  if (!e._telegraph || !data) return;
  Object.assign(e._telegraph.data, data);
}

function clearEnemyTelegraph(e) {
  e._telegraph = null;
}

function tickEnemyTelegraph(e, edt) {
  if (!e._telegraph) return;
  e._telegraph.timer -= edt;
  if (e._telegraph.timer <= 0) e._telegraph = null;
}

function getEnemyThreatScore(e) {
  const meta = getEnemyThreatMeta(e);
  let score = meta.priority || 1;
  if (e.isElite) score += 1.1;
  if (e._telegraph) score += 0.75 + (1 - e._telegraph.timer / Math.max(0.01, e._telegraph.duration || 0.2)) * 0.35;
  if (e._threatMode === 'charge') score += 1.1;
  else if (e._threatMode === 'cast') score += 0.8;
  else if (e._threatMode === 'support') score += 0.7;
  else if (e._threatMode === 'ambush') score += 0.65;
  return score + (e._threatBoost || 0);
}

function getPredictedPlayerTarget(e, leadSeconds) {
  ensureEnemyMotionState(e);
  const move = enemyMoveCfg(e);
  const lead = leadSeconds !== undefined ? leadSeconds : (move.anticipation || 0.15);
  const targetX = P.x + P.vx * lead;
  const targetY = P.y + P.vy * lead;
  const dx = targetX - e.x;
  const dy = targetY - e.y;
  const ds = Math.hypot(dx, dy) || 1;
  return {
    x: targetX, y: targetY,
    dx, dy, ds,
    nx: dx / ds, ny: dy / ds,
    tx: -dy / ds, ty: dx / ds
  };
}

function updateEnemyStrafe(e, edt, minDur, maxDur) {
  ensureEnemyMotionState(e);
  e._strafeTimer -= edt;
  if (e._strafeTimer <= 0) {
    e._strafeDir *= -1;
    e._strafeTimer = minDur + Math.random() * Math.max(0.01, maxDur - minDur);
  }
  return e._strafeDir;
}

function getEnemyRoleHeading() {
  const playerSpeed = Math.hypot(P.vx, P.vy);
  if (playerSpeed > 18) return Math.atan2(P.vy, P.vx);
  return G.totalTime * 0.18;
}

function getEnemyRoleAnchor(e, radius, leadSeconds, driftSpeed) {
  const target = getPredictedPlayerTarget(e, leadSeconds);
  const slotAngle = ENEMY_ROLE_ANGLES[e._roleIndex % ENEMY_ROLE_ANGLES.length];
  const drift = Math.sin(G.totalTime * (driftSpeed || 0.5) + e._motionSeed) * 0.28;
  const pressure = getEnemyLocalPressure(e, radius * 0.8);
  const angle = getEnemyRoleHeading() + slotAngle + drift;
  const slotRadius = radius * (1 + pressure * 0.15);
  const clamped = clampCombatPoint(
    target.x + Math.cos(angle) * slotRadius,
    target.y + Math.sin(angle) * slotRadius,
    40
  );
  return {
    x: clamped.x,
    y: clamped.y,
    angle,
    pressure,
    target,
  };
}

function getEnemyCrowdBlendTarget(e, slotRadius, leadSeconds, driftSpeed, blendStrength) {
  const anchor = getEnemyRoleAnchor(e, slotRadius, leadSeconds, driftSpeed);
  const direct = anchor.target;
  const blendDist = Math.max(slotRadius * 1.55, 110);
  const pressureBoost = 1 + anchor.pressure * 0.18;
  const blend = clampEnemyValue((blendDist - direct.ds) / Math.max(40, blendDist - slotRadius * 0.7), 0, 1) * (blendStrength || 0.7) * pressureBoost;
  return {
    x: direct.x + (anchor.x - direct.x) * blend,
    y: direct.y + (anchor.y - direct.y) * blend,
    blend,
    target: direct,
    anchor,
  };
}

function steerEnemyDirection(e, dirX, dirY, edt, speedScale, accelScale) {
  if (!dirX && !dirY) return;
  const move = enemyMoveCfg(e);
  const dirLen = Math.hypot(dirX, dirY) || 1;
  const maxSpeed = e.spd * move.maxSpd * (speedScale || 1);
  const desiredVX = (dirX / dirLen) * maxSpeed;
  const desiredVY = (dirY / dirLen) * maxSpeed;
  const dvx = desiredVX - e.vx;
  const dvy = desiredVY - e.vy;
  const dLen = Math.hypot(dvx, dvy);
  if (dLen < 0.001) return;
  // Smooth acceleration — cap the step and use smooth steer factor
  const rawStep = move.accel * (move.steer || 1) * edt * (accelScale || 1);
  const step = Math.min(dLen, rawStep);
  e.vx += (dvx / dLen) * step;
  e.vy += (dvy / dLen) * step;
}

function steerEnemyTowardPoint(e, tx, ty, edt, speedScale, accelScale, sideBias) {
  const dx = tx - e.x;
  const dy = ty - e.y;
  const ds = Math.hypot(dx, dy) || 1;
  const nx = dx / ds, ny = dy / ds;

  // Flow around player — when very close, add tangential component
  // so enemies slide around the player instead of clumping on top
  const pdx = P.x - e.x, pdy = P.y - e.y;
  const pds = Math.hypot(pdx, pdy) || 1;
  let flowX = 0, flowY = 0;
  const flowRadius = e.sz + P.sz + 40;
  if (pds < flowRadius && pds > 5) {
    const flowStr = (1 - pds / flowRadius) * 0.6;
    // Tangent direction (consistent per-enemy via strafeDir)
    const sd = e._strafeDir || 1;
    flowX = (-pdy / pds) * sd * flowStr;
    flowY = (pdx / pds) * sd * flowStr;
  }

  const dirX = nx + (-ny) * (sideBias || 0) + flowX;
  const dirY = ny + (nx) * (sideBias || 0) + flowY;
  steerEnemyDirection(e, dirX, dirY, edt, speedScale, accelScale);
  return { dx, dy, ds, nx, ny, tx: -ny, ty: nx };
}

function steerEnemyArrivePoint(e, tx, ty, edt, slowRadius, stopRadius, speedScale, accelScale, sideBias) {
  const dx = tx - e.x;
  const dy = ty - e.y;
  const ds = Math.hypot(dx, dy) || 1;
  const nx = dx / ds, ny = dy / ds;
  const tangentX = -ny, tangentY = nx;
  const stop = Math.max(6, stopRadius || 12);
  if (ds <= stop) {
    const brake = Math.min(1, edt * 7);
    e.vx += (0 - e.vx) * brake;
    e.vy += (0 - e.vy) * brake;
    return { dx, dy, ds, nx, ny, tx: tangentX, ty: tangentY, arrive: 0 };
  }
  const slow = Math.max(stop + 1, slowRadius || 90);
  const arrive = clampEnemyValue((ds - stop) / Math.max(8, slow - stop), 0.08, 1);
  const dirX = nx + tangentX * (sideBias || 0);
  const dirY = ny + tangentY * (sideBias || 0);
  steerEnemyDirection(e, dirX, dirY, edt, (speedScale || 1) * arrive, accelScale);
  return { dx, dy, ds, nx, ny, tx: tangentX, ty: tangentY, arrive };
}

function steerEnemyAtRange(e, tx, ty, edt, idealDist, band, strafeDir, speedScale, accelScale, strafeScale, arrivalStrength) {
  const dx = tx - e.x;
  const dy = ty - e.y;
  const ds = Math.hypot(dx, dy) || 1;
  const nx = dx / ds, ny = dy / ds;
  const tangentX = -ny, tangentY = nx;
  const radial = clampEnemyValue((ds - idealDist) / Math.max(20, band), -1, 1);
  const tangent = (strafeScale || 1) * strafeDir * (0.9 - Math.abs(radial) * 0.35);
  const dirX = nx * radial + tangentX * tangent;
  const dirY = ny * radial + tangentY * tangent;
  const settle = clampEnemyValue(Math.abs(ds - idealDist) / Math.max(18, band), 0, 1);
  const speedMult = 1 - (arrivalStrength || 0) * 0.72 * (1 - settle);
  steerEnemyDirection(e, dirX, dirY, edt, (speedScale || 1) * Math.max(0.22, speedMult), accelScale);
  return { dx, dy, ds, nx, ny, tx: tangentX, ty: tangentY, radial };
}

// Lightweight boid-like separation — enemies push apart instead of stacking
function applyEnemySeparation(e, dt) {
  const move = enemyMoveCfg(e);
  const meta = getEnemyThreatMeta(e);
  const localPressure = getEnemyLocalPressure(e, e.sz * (move.sepRadius || 3.2) * 1.2);
  const sepStr = move.separation * (1 + localPressure * 0.24);
  if (sepStr <= 0) return;
  ensureEnemyMotionState(e);
  const sepRadius = e.sz * (move.sepRadius || 3) * (1 + localPressure * 0.16 + (meta.space || 0) + (e.isElite ? 0.08 : 0));
  const nearby = hash.qry(e.x, e.y, sepRadius);
  let sx = 0, sy = 0, count = 0;
  for (let i = 0; i < nearby.length; i++) {
    const o = nearby[i];
    if (o === e || o.dying || o.spawning) continue;
    const ox = e.x - o.x, oy = e.y - o.y;
    const dSq = ox * ox + oy * oy;
    if (dSq < 1) {
      const ra = e._motionSeed + i * 1.7;
      sx += Math.cos(ra);
      sy += Math.sin(ra);
      count++;
    } else if (dSq < sepRadius * sepRadius) {
      const d = Math.sqrt(dSq);
      const force = 1 - d / sepRadius;
      sx += (ox / d) * force;
      sy += (oy / d) * force;
      count++;
    }
  }
  if (count > 0) {
    sx = (sx / count) * sepStr;
    sy = (sy / count) * sepStr;
  }
  // Heavy smoothing on separation to avoid jitter (dt*5 instead of dt*10)
  const blend = Math.min(1, dt * 5);
  e._sepVX += (sx - e._sepVX) * blend;
  e._sepVY += (sy - e._sepVY) * blend;
  const sepBlend = 0.5 + localPressure * 0.12;
  e.vx += e._sepVX * dt * sepBlend;
  e.vy += e._sepVY * dt * sepBlend;
}

function getEnemyLocalPressure(e, radius) {
  const nearby = hash.qry(e.x, e.y, radius);
  let pressure = 0;
  for (let i = 0; i < nearby.length; i++) {
    const o = nearby[i];
    if (o === e || o.dying) continue;
    const d = Math.hypot(e.x - o.x, e.y - o.y);
    if (d > 0 && d < radius) pressure += 1 - d / radius;
  }
  return clampEnemyValue(pressure / 3, 0, 1.4);
}

function getEnemyPressureAt(x, y, radius, ignore) {
  const nearby = hash.qry(x, y, radius);
  let pressure = 0;
  for (let i = 0; i < nearby.length; i++) {
    const o = nearby[i];
    if (o === ignore || o.dying) continue;
    const d = Math.hypot(x - o.x, y - o.y);
    if (d > 0 && d < radius) pressure += 1 - d / radius;
  }
  return pressure;
}

function findEnemyTeleportPoint(e, target, minRadius, maxRadius, preferBehind) {
  const baseAngle = preferBehind ? Math.atan2(target.dy, target.dx) + Math.PI : getEnemyRoleHeading();
  let best = null;
  let bestScore = -Infinity;
  const samples = 7;
  for (let i = 0; i < samples; i++) {
    const spread = ((i / (samples - 1)) - 0.5) * Math.PI * 1.15;
    const jitter = (Math.random() - 0.5) * 0.18;
    const angle = baseAngle + spread + jitter;
    const dist = minRadius + (maxRadius - minRadius) * (0.22 + (i / (samples - 1)) * 0.78);
    const p = clampCombatPoint(
      target.x + Math.cos(angle) * dist,
      target.y + Math.sin(angle) * dist,
      56
    );
    const playerDist = Math.hypot(p.x - P.x, p.y - P.y);
    const wallClear = Math.min(
      p.x - BUILDING_LEFT,
      BUILDING_RIGHT - p.x,
      p.y - BUILDING_TOP,
      BUILDING_BOTTOM - p.y
    );
    const crowd = getEnemyPressureAt(p.x, p.y, 110, e);
    const score = playerDist * 0.018 + wallClear * 0.02 - crowd * 18 - Math.abs(dist - (minRadius + maxRadius) * 0.5) * 0.02;
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return best || clampCombatPoint(target.x, target.y, 56);
}

function spawnEnemyProjectile(x, y, angle, speed, dmg, color, opts) {
  const p = projs.get();
  if (!p) return null;
  opts = opts || {};
  p.x = x;
  p.y = y;
  p.vx = Math.cos(angle) * speed;
  p.vy = Math.sin(angle) * speed;
  p.dmg = dmg;
  p.pierce = opts.pierce || 1;
  p.friendly = false;
  p.col = color;
  p.hits = new Set();
  p.hitCnt = 0;
  p.active = true;
  p._ang = angle;
  p._size = opts.size || 1;
  if (opts.extra) Object.assign(p, opts.extra);
  return p;
}

function spawnEnemyProjectileFan(x, y, baseAngle, count, spread, speed, dmg, color, opts) {
  const total = Math.max(1, count || 1);
  for (let i = 0; i < total; i++) {
    const t = total === 1 ? 0.5 : i / (total - 1);
    const angle = baseAngle + (t - 0.5) * (spread || 0);
    spawnEnemyProjectile(x, y, angle, speed, dmg, color, opts);
  }
}

function spawnEnemyHazard(type, x, y, life, data) {
  const h = hazards.get();
  if (!h) return null;
  h.type = type;
  h.x = x;
  h.y = y;
  h.life = life;
  h.tick = 0;
  h.data = data || {};
  h.active = true;
  return h;
}

function bitePlayerIfNear(e, radius, dmgMult, kbForce) {
  const d = Math.hypot(P.x - e.x, P.y - e.y);
  if (P.iframes > 0 || d > radius) return false;
  hitPlayer(Math.round(e.dmg * (dmgMult || 1)), e.x, e.y, kbForce || 260);
  return true;
}

function crabPincerSlam(e, reach, arc, dmgMult, kbForce) {
  const dx = P.x - e.x;
  const dy = P.y - e.y;
  const ds = Math.hypot(dx, dy);
  if (P.iframes > 0 || ds > reach) return false;
  const facing = Math.atan2(e._lungeY || dy || 0, e._lungeX || dx || 1);
  let diff = Math.atan2(dy, dx) - facing;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > (arc || 0.85) * 0.5) return false;
  hitPlayer(Math.round(e.dmg * (dmgMult || 1.15)), e.x, e.y, kbForce || 300);
  return true;
}

function applyEnemyBurn(e, dps, duration) {
  if (!e || e.dying || !dps || !duration) return;
  e._burnTime = Math.max(e._burnTime || 0, duration);
  e._burnDmg = Math.max(e._burnDmg || 0, dps);
  e._burnFxCd = 0;
}

function updateEnemyStatusEffects(e, dt) {
  if (!e || e.dying) return false;
  if (e._burnTime > 0 && e._burnDmg > 0) {
    e._burnTime = Math.max(0, e._burnTime - dt);
    e._burnFxCd = Math.max(0, (e._burnFxCd || 0) - dt);
    const burnDmg = e._burnDmg * dt;
    if (burnDmg > 0) {
      e.hp -= burnDmg;
      G.totalDmgDealt += burnDmg;
      e.flash = Math.max(e.flash || 0, 0.04);
    }
    if (e._burnFxCd <= 0 && typeof spawnParticles === 'function') {
      e._burnFxCd = 0.08 + Math.random() * 0.06;
      spawnParticles(e.x + (Math.random() - 0.5) * e.sz * 0.3, e.y - e.sz * (0.25 + Math.random() * 0.2), 2, {
        speed: 14, speedVar: 18,
        life: 0.28, size: 3.4, sizeEnd: 0,
        colors: ['#ffb347', '#ff7a18', '#ffd166'],
        gravity: -55, friction: 0.86, shape: 'circle'
      });
    }
    if (e._burnTime <= 0) {
      e._burnDmg = 0;
      e._burnFxCd = 0;
    }
    if (e.hp <= 0) {
      enemyDeath(e);
      return true;
    }
  }
  return false;
}

function applyBossBurn(boss, dps, duration) {
  if (!boss || !dps || !duration || boss.hp <= 0) return;
  boss.burnTime = Math.max(boss.burnTime || 0, duration);
  boss.burnDmg = Math.max(boss.burnDmg || 0, dps);
  boss.burnFxCd = 0;
}

function applyEnemyWallAvoidance(e, edt) {
  const margin = 72;
  let pushX = 0, pushY = 0;
  if (e.x < BUILDING_LEFT + margin) pushX += (BUILDING_LEFT + margin - e.x) / margin;
  else if (e.x > BUILDING_RIGHT - margin) pushX -= (e.x - (BUILDING_RIGHT - margin)) / margin;
  if (e.y < BUILDING_TOP + margin) pushY += (BUILDING_TOP + margin - e.y) / margin;
  else if (e.y > BUILDING_BOTTOM - margin) pushY -= (e.y - (BUILDING_BOTTOM - margin)) / margin;
  if (pushX || pushY) steerEnemyDirection(e, pushX, pushY, edt, 0.52, 0.9);
}

function bossScreenFlash(kind, alpha, life) {
  const maxLife = life || 0.07;
  G._screenFlash = { kind: kind || 'flash_white', alpha: alpha || 0.12, life: maxLife, maxLife };
}

function bossSchedule(owner, delay, fn) {
  setTimeout(() => {
    if (!owner || G.phase !== 'boss' || G.boss !== owner || owner.hp <= 0) return;
    fn();
  }, Math.max(0, delay) * 1000);
}

function bossDistanceToSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const lenSq = abx * abx + aby * aby;
  if (lenSq <= 0.001) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / lenSq));
  const sx = ax + abx * t;
  const sy = ay + aby * t;
  return Math.hypot(px - sx, py - sy);
}

function bossTriggerFreeze(duration) {
  G.freezeTime = duration;
  const overlay = document.getElementById('freeze-overlay');
  if (!overlay) return;
  overlay.style.opacity = '1';
  setTimeout(() => {
    if (overlay) overlay.style.opacity = '0';
  }, duration * 1000);
}

function bossSpawnRadial(x, y, count, speed, dmg, color, opts) {
  const total = Math.max(1, count || 1);
  for (let i = 0; i < total; i++) {
    const a = (i / total) * Math.PI * 2;
    spawnEnemyProjectile(x, y, a, speed, dmg, color, opts);
  }
}

function bossSpawnAddWave(count, types, cx, cy, radius) {
  const roster = types && types.length ? types : [0, 1, 6];
  const total = Math.max(1, count || 1);
  for (let i = 0; i < total; i++) {
    const a = (i / total) * Math.PI * 2 + Math.random() * 0.6;
    const p = clampCombatPoint(cx + Math.cos(a) * (radius || 160), cy + Math.sin(a) * (radius || 160), 50);
    spawnEnemy(roster[Math.floor(Math.random() * roster.length)], p.x, p.y, { isSplit: true });
  }
}

function bossColorWithAlpha(color, alpha) {
  if (typeof particleColorWithAlpha === 'function') return particleColorWithAlpha(color, alpha);
  return color;
}

function bossFormatAttackLabel(id) {
  return String(id || 'pattern')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toUpperCase();
}

function getBossVisualProfile(bossKey) {
  const boss = (typeof BOSSES !== 'undefined' && BOSSES[bossKey]) || {};
  const visual = (typeof BOSS_VISUALS !== 'undefined' && BOSS_VISUALS[bossKey]) || {};
  return {
    accent: visual.accent || boss.col || '#ff7755',
    secondary: visual.secondary || '#ffffff',
    motif: visual.motif || 'ring',
    tag: visual.tag || boss.sub || 'BOSS',
    attacks: visual.attacks || {}
  };
}

function getBossAttackTell(bossKey, attackId) {
  const visual = getBossVisualProfile(bossKey);
  const data = visual.attacks && visual.attacks[attackId];
  if (data && typeof data === 'object') {
    return {
      label: data.label || bossFormatAttackLabel(attackId),
      kind: data.kind || 'pattern',
      duration: data.duration || 0.95,
      accent: data.accent || visual.accent
    };
  }
  return {
    label: bossFormatAttackLabel(attackId),
    kind: 'pattern',
    duration: 0.95,
    accent: visual.accent
  };
}

function getBossCueSound(kind) {
  if (kind === 'dash' || kind === 'wall' || kind === 'bombard') return 'bossCharge';
  if (kind === 'ring' || kind === 'burst' || kind === 'cascade') return 'bossRing';
  if (kind === 'portal' || kind === 'clone' || kind === 'summon') return 'bossGlitch';
  if (kind === 'shield') return 'bossShield';
  return 'bossCharge';
}

function triggerBossAttackCue(owner, attackId, opts) {
  if (!owner) return;
  const meta = getBossAttackTell(owner.key || G.bossKey, attackId);
  const visual = owner.visual || getBossVisualProfile(owner.key || G.bossKey);
  const kind = (opts && opts.kind) || meta.kind || 'pattern';
  if (typeof fxBossAttackCue === 'function') {
    fxBossAttackCue(owner.x, owner.y, visual.accent, visual.secondary, kind, !!owner.phase2);
  }
  if (opts && opts.targetX !== undefined && opts.targetY !== undefined && typeof spawnParticles === 'function') {
    spawnParticles(opts.targetX, opts.targetY, owner.phase2 ? 6 : 4, {
      speed: 18,
      speedVar: 8,
      life: 0.2,
      size: 1,
      sizeEnd: 1,
      colors: [visual.secondary, visual.accent, '#ffffff'],
      length: 24,
      lengthEnd: 8,
      thickness: 2.5,
      shape: 'line',
    });
    spawnParticles(opts.targetX, opts.targetY, 1, {
      speed: 0,
      life: 0.18,
      size: 10,
      sizeEnd: Math.max(18, opts.targetRadius || 34),
      color: bossColorWithAlpha(visual.accent, 0.2),
      shape: 'ring',
      thickness: 3,
    });
  }
  const sound = opts && Object.prototype.hasOwnProperty.call(opts, 'sound')
    ? opts.sound
    : getBossCueSound(kind);
  if (sound && typeof playSound === 'function') playSound(sound);
}

function triggerBossAttackImpact(owner, opts) {
  if (!owner) return;
  const visual = owner.visual || getBossVisualProfile(owner.key || G.bossKey);
  const kind = (opts && opts.kind) || ((owner.intent && owner.intent.kind) || 'pattern');
  if (typeof fxBossAttackImpact === 'function') {
    fxBossAttackImpact((opts && opts.x) || owner.x, (opts && opts.y) || owner.y, visual.accent, visual.secondary, kind, !!owner.phase2);
  } else if (typeof fxExplosion === 'function') {
    fxExplosion((opts && opts.x) || owner.x, (opts && opts.y) || owner.y, (opts && opts.radius) || 64);
  }
  if (typeof playSound === 'function') playSound((opts && opts.sound) || (kind === 'shield' ? 'bossShield' : 'bossSlam'));
}

// ============ PER-TYPE BEHAVIOR FUNCTIONS ============
// Each receives (e, dt, dx, dy, ds, edt) where dx/dy/ds = vector to player, edt = dt * speedMult
// Behaviors now steer toward desired velocities instead of pushing raw forces every frame.

// 0: Bat — ranged flier, orbits at distance and shoots projectiles
function behaviorBat(e, dt, dx, dy, ds, edt) {
  const idealDist = 160; // stay this far from player
  const fleeThresh = 90; // if closer than this, flee hard

  // State 1: windup → shoot
  if (e.behaviorState === 1) {
    setEnemyThreatState(e, 'cast', 0.72, '#ff6f99');
    setEnemyAttitude(e, 'windup', e._phaseTimer, 0.82);
    e._phaseTimer -= edt;
    e.vx += (0 - e.vx) * Math.min(1, edt * 7);
    e.vy += (0 - e.vy) * Math.min(1, edt * 7);
    if (e._telegraph) patchEnemyTelegraph(e, { x: e.x, y: e.y });
    if (e._phaseTimer <= 0) {
      spawnEnemyProjectileFan(e.x, e.y, e._castAngle || 0, 1, 0, 180, Math.max(4, Math.round(e.dmg * 0.7)), '#ff6600', { size: 1.1, extra: { vis: 'bat_fireball' } });
      clearEnemyTelegraph(e);
      e.behaviorState = 2;
      e._phaseTimer = 0.2;
      e.behaviorTimer = 1.8 + Math.random() * 1.2;
    }
    return;
  }
  // State 2: short recovery, drift away
  if (e.behaviorState === 2) {
    setEnemyThreatState(e, 'swarm', 0.22, '#ff6f99');
    setEnemyAttitude(e, 'recover', e._phaseTimer, 0.34);
    e._phaseTimer -= edt;
    steerEnemyDirection(e, -(dx / (ds || 1)), -(dy / (ds || 1)), edt, 0.7, 1.0);
    if (e._phaseTimer <= 0) e.behaviorState = 0;
    return;
  }
  // State 0: orbit — maintain distance from player
  const wave = Math.sin(G.totalTime * 6 + e._motionSeed) * 0.6;
  setEnemyThreatState(e, 'swarm', 0.18, '#ff6f99');
  setEnemyAttitude(e, 'hunt', 0.08, 0.2);

  if (ds < fleeThresh) {
    // Too close — flee away from player
    steerEnemyDirection(e, -(dx / (ds || 1)), -(dy / (ds || 1)), edt, 1.2, 1.4);
  } else if (ds < idealDist) {
    // In orbit range — strafe perpendicular to player
    const perpX = -(dy / (ds || 1)) * e._strafeDir;
    const perpY = (dx / (ds || 1)) * e._strafeDir;
    steerEnemyDirection(e, perpX + wave * 0.3, perpY + wave * 0.3, edt, 0.8, 1.0);
  } else {
    // Too far — approach but not all the way
    const approachX = (dx / (ds || 1)) * 0.6 - (dy / (ds || 1)) * e._strafeDir * 0.4;
    const approachY = (dy / (ds || 1)) * 0.6 + (dx / (ds || 1)) * e._strafeDir * 0.4;
    steerEnemyTowardPoint(e, P.x, P.y, edt, 0.7, 0.9, wave);
  }

  // Shoot when in range and timer expired
  if (e.behaviorTimer <= 0 && ds < 250 && ds > 60 && e.anim === 'walk') {
    e.behaviorState = 1;
    e._phaseTimer = 0.16;
    e._castAngle = Math.atan2(P.y - e.y, P.x - e.x);
    setAnim(e, 'attack');
    setEnemyTelegraph(e, 'fan', e._phaseTimer, {
      x: e.x, y: e.y, angle: e._castAngle, spread: 0.08, length: 94, color: '#ff6f99'
    });
  }
}

// 1: Mushroom — slow pursuit, spawns poison spore clouds on timer
function behaviorMushroom(e, dt, dx, dy, ds, edt) {
  if (e.behaviorState === 1) {
    setEnemyThreatState(e, 'hazard', 0.62, '#9cff52');
    setEnemyAttitude(e, 'cast', e._phaseTimer, 0.72);
    e._phaseTimer -= edt;
    e.vx += (0 - e.vx) * Math.min(1, edt * 5.5);
    e.vy += (0 - e.vy) * Math.min(1, edt * 5.5);
    patchEnemyTelegraph(e, { x: e.x, y: e.y, radius: 42 + Math.sin(G.totalTime * 12) * 3 });
    if (e._phaseTimer <= 0) {
      spawnEnemyHazard('sporeCloud', e.x, e.y, 4.5, { radius: 42, dmg: Math.max(4, e.dmg * 0.7), seed: e._motionSeed + G.totalTime });
      if (typeof spawnParticles === 'function') {
        spawnParticles(e.x, e.y, 10, {
          speed: 60, speedVar: 40, life: 0.8, color: '#88cc22', size: 5, sizeEnd: 0, shape: 'circle'
        });
      }
      clearEnemyTelegraph(e);
      e.behaviorState = 2;
      e._phaseTimer = 0.24;
      e.behaviorTimer = 4 + Math.random() * 2;
    }
    return;
  }
  if (e.behaviorState === 2) {
    setEnemyThreatState(e, 'hazard', 0.2, '#9cff52');
    setEnemyAttitude(e, 'recover', e._phaseTimer, 0.28);
    e._phaseTimer -= edt;
    steerEnemyDirection(e, -(dx / (ds || 1)) * 0.1, -(dy / (ds || 1)) * 0.1, edt, 0.42, 0.8);
    if (e._phaseTimer <= 0) e.behaviorState = 0;
    return;
  }
  const crowd = getEnemyCrowdBlendTarget(e, 70, 0.08, 0.45, 0.55);
  const weave = Math.sin(G.totalTime * 2.2 + e._motionSeed) * 0.18;
  setEnemyThreatState(e, 'hazard', 0.16, '#9cff52');
  setEnemyAttitude(e, 'hunt', 0.12, 0.18);
  steerEnemyTowardPoint(e, crowd.x, crowd.y, edt, 0.72, 0.8, weave);
  if (e.behaviorTimer <= 0) {
    e.behaviorState = 1;
    e._phaseTimer = 0.24;
    setAnim(e, 'attack');
    setEnemyTelegraph(e, 'ring', e._phaseTimer, { x: e.x, y: e.y, radius: 42, color: '#9cff52' });
  }
}

// 2: Crab — fast swarming pest, darts at player with slight weave
function behaviorCrab(e, dt, dx, dy, ds, edt) {
  // Always chasing — smooth weaving approach, not erratic jitter
  const weave = Math.sin(G.totalTime * 3 + e._motionSeed) * 0.2;
  setEnemyThreatState(e, 'swarm', 0.18, '#ff9966');
  setEnemyAttitude(e, 'hunt', 0.08, 0.2);
  // Dart straight toward player with gentle side-to-side weave
  const target = getPredictedPlayerTarget(e, 0.06);
  steerEnemyTowardPoint(e, target.x, target.y, edt, 1.3, 1.5, weave);
  // Contact damage only — no special attack, just body slam on touch
}

// 3: Doll — silent melee bruiser, walks straight at you, hits HARD on contact
function behaviorDoll(e, dt, dx, dy, ds, edt) {
  // State 1: melee windup (brief pause before heavy strike)
  if (e.behaviorState === 1) {
    setEnemyThreatState(e, 'ambush', 0.92, '#d47cff');
    setEnemyAttitude(e, 'windup', e._phaseTimer, 1.0);
    e._phaseTimer -= edt;
    e.vx += (0 - e.vx) * Math.min(1, edt * 10);
    e.vy += (0 - e.vy) * Math.min(1, edt * 10);
    if (e._phaseTimer <= 0) {
      // Heavy melee strike
      if (ds < e.sz + P.sz + 32) {
        if (typeof hitPlayer === 'function' && P.iframes <= 0) {
          hitPlayer(Math.round(e.dmg * 1.6), e.x, e.y, 380);
          if (typeof spawnParticles === 'function') {
            spawnParticles(P.x, P.y, 6, {
              speed: 100, speedVar: 50, life: 0.25, color: '#d47cff', size: 3, sizeEnd: 0, shape: 'circle'
            });
          }
        }
      }
      e.behaviorState = 2;
      e._phaseTimer = 0.5;
      setAnim(e, 'walk');
    }
    return;
  }
  // State 2: brief cooldown after strike
  if (e.behaviorState === 2) {
    setEnemyThreatState(e, 'ambush', 0.3, '#d47cff');
    setEnemyAttitude(e, 'recover', e._phaseTimer, 0.34);
    e._phaseTimer -= edt;
    // Keep advancing slowly during recovery
    steerEnemyTowardPoint(e, P.x, P.y, edt, 0.4, 0.5, 0);
    if (e._phaseTimer <= 0) {
      e.behaviorState = 0;
      e.behaviorTimer = 0.8 + Math.random() * 0.6;
    }
    return;
  }
  // State 0: walk straight toward player — no gimmicks
  setEnemyThreatState(e, 'ambush', 0.2, '#d47cff');
  setEnemyAttitude(e, 'hunt', 0.1, 0.24);
  const target = getPredictedPlayerTarget(e, 0.12);
  steerEnemyTowardPoint(e, target.x, target.y, edt, 1.0, 1.1, 0);
  // When close enough, wind up for a heavy strike
  if (ds < e.sz + P.sz + 38 && e.behaviorTimer <= 0) {
    e.behaviorState = 1;
    e._phaseTimer = 0.2;
    setAnim(e, 'attack');
  }
}

// 4: Nun — ranged dark caster, maintains distance, heals nearby enemies
function behaviorNun(e, dt, dx, dy, ds, edt) {
  const role = getEnemyRoleAnchor(e, 245, 0.2, 0.45);
  const strafe = updateEnemyStrafe(e, edt, 1.1, 1.8);
  if (e.behaviorState === 1) {
    setEnemyThreatState(e, 'support', 0.88, '#7dff9a');
    setEnemyAttitude(e, 'cast', e._phaseTimer, 0.82);
    e._phaseTimer -= edt;
    e.vx += (0 - e.vx) * Math.min(1, edt * 8);
    e.vy += (0 - e.vy) * Math.min(1, edt * 8);
    patchEnemyTelegraph(e, { x: e.x, y: e.y, angle: e._castAngle });
    if (e._phaseTimer <= 0) {
      // Nun only heals — no projectiles
      enemies.each(a => {
        if (a === e || a.dying) return;
        const ad = Math.hypot(a.x - e.x, a.y - e.y);
        if (ad < 120) {
          a.hp = Math.min(a.maxHp, a.hp + a.maxHp * 0.1);
          if (typeof spawnParticles === 'function') {
            spawnParticles(a.x, a.y, 4, { speed: 30, life: 0.4, color: '#55ff55', size: 3, sizeEnd: 0, shape: 'circle' });
          }
        }
      });
      clearEnemyTelegraph(e);
      e.behaviorState = 2;
      e._phaseTimer = 0.18;
      setAnim(e, 'walk');
    }
    return;
  }
  if (e.behaviorState === 2) {
    setEnemyThreatState(e, 'support', 0.32, '#7dff9a');
    setEnemyAttitude(e, 'recover', e._phaseTimer, 0.34);
    e._phaseTimer -= edt;
    steerEnemyArrivePoint(e, role.x, role.y, edt, 170, 34, 0.7, 0.82, strafe * 0.04);
    if (e._phaseTimer <= 0) e.behaviorState = 0;
    return;
  }
  const sideBias = strafe * 0.08 * Math.sin(G.totalTime * 2 + e._motionSeed);
  setEnemyThreatState(e, 'support', 0.24, '#7dff9a');
  setEnemyAttitude(e, 'support', 0.12, 0.26);
  steerEnemyArrivePoint(e, role.x, role.y, edt, 160, 30, 0.92, 0.9, sideBias);
  if (e.behaviorTimer <= 0) {
    e.behaviorTimer = 3.5 + Math.random() * 1.5;
    e.behaviorState = 1;
    e._phaseTimer = 0.16;
    e._castAngle = Math.atan2(role.target.y - e.y, role.target.x - e.x);
    setAnim(e, 'attack');
    setEnemyTelegraph(e, 'fan', e._phaseTimer, {
      x: e.x, y: e.y, angle: e._castAngle, spread: 0.16, length: 118, color: '#7dff9a'
    });
  }
}

// 5: Mage — powerful ranged fireball caster, teleports when cornered
function behaviorMage(e, dt, dx, dy, ds, edt) {
  const role = getEnemyRoleAnchor(e, 270, 0.22, 0.4);
  const strafe = updateEnemyStrafe(e, edt, 1.0, 1.5);
  if (e.behaviorState === 1) {
    setEnemyThreatState(e, 'ambush', 0.46, '#67d8ff');
    setEnemyAttitude(e, 'recover', e._phaseTimer, 0.38);
    e._phaseTimer -= edt;
    e.vx += (0 - e.vx) * Math.min(1, edt * 7);
    e.vy += (0 - e.vy) * Math.min(1, edt * 7);
    if (e._phaseTimer <= 0) {
      e.behaviorState = 0;
      setAnim(e, 'walk');
    }
    return;
  }
  if (e.behaviorState === 2) {
    setEnemyThreatState(e, 'cast', 0.96, '#67d8ff');
    setEnemyAttitude(e, 'cast', e._phaseTimer, 0.9);
    e._phaseTimer -= edt;
    e.vx += (0 - e.vx) * Math.min(1, edt * 8);
    e.vy += (0 - e.vy) * Math.min(1, edt * 8);
    patchEnemyTelegraph(e, { x: e.x, y: e.y, angle: e._castAngle });
    if (e._phaseTimer <= 0) {
      spawnEnemyProjectileFan(e.x, e.y, e._castAngle, 1, 0, 200, Math.round(e.dmg * 0.5), '#88ccff', { size: 1.3, extra: { vis: 'mage_iceball', _iceSlowDuration: 1.8 } });
      if (typeof spawnParticles === 'function') {
        spawnParticles(e.x, e.y, 6, {
          speed: 60, speedVar: 30, life: 0.5, colors: ['#88ccff', '#ffffff', '#aaddff'], size: 4, sizeEnd: 0, shape: 'circle'
        });
      }
      clearEnemyTelegraph(e);
      e.behaviorState = 3;
      e._phaseTimer = 0.16;
      setAnim(e, 'walk');
    }
    return;
  }
  if (e.behaviorState === 3) {
    setEnemyThreatState(e, 'cast', 0.34, '#67d8ff');
    setEnemyAttitude(e, 'recover', e._phaseTimer, 0.32);
    e._phaseTimer -= edt;
    steerEnemyArrivePoint(e, role.x, role.y, edt, 170, 32, 0.76, 0.88, strafe * 0.04);
    if (e._phaseTimer <= 0) e.behaviorState = 0;
    return;
  }
  const sideBias = strafe * 0.06;
  setEnemyThreatState(e, 'cast', 0.28, '#67d8ff');
  setEnemyAttitude(e, 'orbit', 0.12, 0.24);
  steerEnemyArrivePoint(e, role.x, role.y, edt, 180, 34, 0.95, 1.0, sideBias);
  if (role.target.ds < 95) {
    e.behaviorState = 1;
    e._phaseTimer = 0.45;
    const tp = findEnemyTeleportPoint(e, role.target, 210, 320, false);
    e.x = tp.x;
    e.y = tp.y;
    e.vx *= 0.2; e.vy *= 0.2;
    e.flash = 0.15;
    return;
  }
  if (e.behaviorTimer <= 0) {
    e.behaviorTimer = 2.5 + Math.random() * 1.5;
    e.behaviorState = 2;
    e._phaseTimer = 0.18;
    e._castAngle = Math.atan2(role.target.y - e.y, role.target.x - e.x);
    setAnim(e, 'attack');
    setEnemyTelegraph(e, 'fan', e._phaseTimer, {
      x: e.x, y: e.y, angle: e._castAngle, spread: 0.4, length: 132, color: '#67d8ff'
    });
  }
}

// 6: Dog — fast aggressive lunger, charges then bites
function behaviorDog(e, dt, dx, dy, ds, edt) {
  if (e.behaviorState === 0) {
    const crowd = getEnemyCrowdBlendTarget(e, 96, 0.18, 0.85, 0.78);
    const weave = Math.sin(G.totalTime * 5.5 + e._motionSeed) * 0.22;
    setEnemyThreatState(e, 'charge', 0.26, '#ff5f79');
    setEnemyAttitude(e, 'hunt', 0.12, 0.34);
    steerEnemyTowardPoint(e, crowd.x, crowd.y, edt, 0.9, 1.0, weave);
    if (crowd.target.ds < 210 && e.behaviorTimer <= 0) {
      const commit = getPredictedPlayerTarget(e, 0.16);
      e.behaviorState = 1;
      e._phaseTimer = 0.16;
      e._lungeX = commit.nx;
      e._lungeY = commit.ny;
      setAnim(e, 'attack');
      setEnemyTelegraph(e, 'dash', e._phaseTimer, {
        x: e.x, y: e.y, angle: Math.atan2(e._lungeY, e._lungeX), length: 138, color: '#ff5f79'
      });
    }
  } else if (e.behaviorState === 1) {
    setEnemyThreatState(e, 'charge', 0.96, '#ff5f79');
    setEnemyAttitude(e, 'windup', e._phaseTimer, 1.0);
    e._phaseTimer -= edt;
    steerEnemyDirection(e, -(e._lungeX || dx / (ds || 1)), -(e._lungeY || dy / (ds || 1)), edt, 0.26, 0.78);
    patchEnemyTelegraph(e, { x: e.x, y: e.y, angle: Math.atan2(e._lungeY || 0, e._lungeX || 1) });
    if (e._phaseTimer <= 0) {
      clearEnemyTelegraph(e);
      e.behaviorState = 2;
      e._maulDone = false;
      e._phaseTimer = 0.28;
    }
  } else if (e.behaviorState === 2) {
    setEnemyThreatState(e, 'charge', 1.08, '#ff5f79');
    setEnemyAttitude(e, 'commit', e._phaseTimer, 1.1);
    steerEnemyDirection(e, e._lungeX || (dx / (ds || 1)), e._lungeY || (dy / (ds || 1)), edt, 1.48, 1.95);
    if (!e._maulDone && bitePlayerIfNear(e, e.sz + P.sz + 22, 1.35, 320)) {
      e._maulDone = true;
      if (typeof spawnParticles === 'function') {
        spawnParticles(P.x, P.y, 10, {
          speed: 130, speedVar: 70, life: 0.3, color: '#ff3355', size: 3, sizeEnd: 0, shape: 'circle'
        });
      }
    }
    e._phaseTimer -= edt;
    if (e._phaseTimer <= 0) {
      e.behaviorState = 3;
      e._phaseTimer = 0.18;
      setAnim(e, 'walk');
    }
  } else {
    setEnemyThreatState(e, 'charge', 0.34, '#ff5f79');
    setEnemyAttitude(e, 'recover', e._phaseTimer, 0.42);
    e._phaseTimer -= edt;
    e.vx += (0 - e.vx) * Math.min(1, edt * 6);
    e.vy += (0 - e.vy) * Math.min(1, edt * 6);
    if (e._phaseTimer <= 0) {
      e.behaviorState = 0;
      e.behaviorTimer = 1.4 + Math.random() * 0.9;
    }
  }
}

// 7: Pumpkin — ranged fire caster, maintains distance, throws fireballs
function behaviorPumpkin(e, dt, dx, dy, ds, edt) {
  const role = getEnemyRoleAnchor(e, 215, 0.18, 0.55);
  const strafe = updateEnemyStrafe(e, edt, 0.5, 0.9);
  if (e.behaviorState === 1) {
    setEnemyThreatState(e, 'cast', 0.92, '#ffb347');
    setEnemyAttitude(e, 'cast', e._phaseTimer, 0.86);
    e._phaseTimer -= edt;
    e.vx += (0 - e.vx) * Math.min(1, edt * 7.5);
    e.vy += (0 - e.vy) * Math.min(1, edt * 7.5);
    patchEnemyTelegraph(e, { sourceX: e.x, sourceY: e.y });
    if (e._phaseTimer <= 0) {
      // Pumpkin no projectiles — only fire hazard
      setTimeout(() => {
        spawnEnemyHazard('fire', e._castTargetX, e._castTargetY, 1.6, { enemyCast: true });
        if (typeof spawnParticles === 'function') {
          spawnParticles(e._castTargetX, e._castTargetY, 8, {
            speed: 55, speedVar: 25, life: 0.45, color: '#ff8800', size: 4, sizeEnd: 0, shape: 'circle'
          });
        }
      }, 260);
      if (typeof spawnParticles === 'function') {
        spawnParticles(e.x, e.y, 6, {
          speed: 70, speedVar: 40, life: 0.5, color: '#ff8800', size: 4, sizeEnd: 0, shape: 'circle'
        });
      }
      clearEnemyTelegraph(e);
      e.behaviorState = 2;
      e._phaseTimer = 0.16;
      setAnim(e, 'walk');
    }
    return;
  }
  if (e.behaviorState === 2) {
    setEnemyThreatState(e, 'cast', 0.34, '#ffb347');
    setEnemyAttitude(e, 'recover', e._phaseTimer, 0.32);
    e._phaseTimer -= edt;
    steerEnemyArrivePoint(e, role.x, role.y, edt, 160, 32, 0.72, 0.84, strafe * 0.05);
    if (e._phaseTimer <= 0) e.behaviorState = 0;
    return;
  }
  setEnemyThreatState(e, 'cast', 0.26, '#ffb347');
  setEnemyAttitude(e, 'orbit', 0.12, 0.24);
  steerEnemyArrivePoint(e, role.x, role.y, edt, 150, 30, 0.95, 0.92, strafe * 0.08);
  if (e.behaviorTimer <= 0) {
    e.behaviorTimer = 2.5 + Math.random() * 1.5;
    e.behaviorState = 1;
    e._phaseTimer = 0.14;
    e._castTargetX = role.target.x;
    e._castTargetY = role.target.y;
    e._castAngle = Math.atan2(role.target.y - e.y, role.target.x - e.x);
    setAnim(e, 'attack');
    setEnemyTelegraph(e, 'target', 0.42, {
      sourceX: e.x, sourceY: e.y,
      targetX: e._castTargetX, targetY: e._castTargetY,
      radius: 30, color: '#ffb347'
    });
  }
}

// ============ PER-TYPE DEATH EFFECTS ============

// Mushroom: leaves a lingering spore cloud on death
function onDeathMushroom(e, ex, ey) {
  spawnEnemyHazard('sporeCloud', ex, ey, 4.2, { radius: 46, dmg: 8, seed: Math.random() * Math.PI * 2 });
  if (typeof spawnParticles === 'function') {
    spawnParticles(ex, ey, 15, { speed: 50, speedVar: 30, life: 1.0, color: '#88cc22', size: 5, sizeEnd: 2, shape: 'circle' });
  }
}

// Mage: explodes into 6 fireballs on death
function onDeathMage(e, ex, ey) {
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const p = projs.get();
    if (p) {
      p.x = ex; p.y = ey; p.vx = Math.cos(a) * 150; p.vy = Math.sin(a) * 150;
      p.dmg = 10; p.pierce = 1; p.friendly = false; p.col = '#3399cc';
      p.hits = new Set(); p.hitCnt = 0; p.active = true;
    }
  }
  if (typeof fxExplosion === 'function') fxExplosion(ex, ey, 50);
}

// Pumpkin: explodes into fire on death
function onDeathPumpkin(e, ex, ey) {
  // Scatter 4 fire hazards around death position
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.random() * 0.5;
    const d = 30 + Math.random() * 30;
    const h = hazards.get();
    if (h) { h.type = 'fire'; h.x = ex + Math.cos(a) * d; h.y = ey + Math.sin(a) * d; h.life = 3; h.active = true; }
  }
  if (typeof spawnParticles === 'function') {
    spawnParticles(ex, ey, 12, {
      speed: 80, speedVar: 50, life: 0.6, color: '#ff6600', size: 5, sizeEnd: 1, shape: 'circle'
    });
  }
}

// Register behaviors in ENEMY_DEFS
ENEMY_DEFS[0].behavior = behaviorBat;
ENEMY_DEFS[1].behavior = behaviorMushroom;
ENEMY_DEFS[2].behavior = behaviorCrab;
ENEMY_DEFS[3].behavior = behaviorDoll;
ENEMY_DEFS[4].behavior = behaviorNun;
ENEMY_DEFS[5].behavior = behaviorMage;
ENEMY_DEFS[6].behavior = behaviorDog;
ENEMY_DEFS[7].behavior = behaviorPumpkin;
ENEMY_DEFS[1].onDeath = onDeathMushroom;
ENEMY_DEFS[5].onDeath = onDeathMage;
ENEMY_DEFS[7].onDeath = onDeathPumpkin;

// ============ SPAWN & COMBAT ============
const ENEMY_SPAWN_TELEGRAPH = 0.28;
const ENEMY_BASE_HP_MULT = 1.12;
const ENEMY_BASE_DMG_MULT = 1.05;

function spawnEnemy(type, x, y, opts) {
  opts = opts || {};
  const stats = ENEMY_STATS[type];
  if (!stats) return;
  const diff = typeof getDifficulty === 'function' ? getDifficulty(G.wave) : { hpMult: 1, spdMult: 1 };
  const e = enemies.get();
  if (e) {
    spawnEnemy._roleCounter = (spawnEnemy._roleCounter || 0) + 1;
    const spawnVec = getEnemySpawnEntryVector(x, y);
    const baseHp = opts.hp !== undefined ? opts.hp : stats.hp;
    const baseDmg = opts.dmg !== undefined ? opts.dmg : stats.dmg;
    e.x = x; e.y = y;
    e.hp = baseHp * ENEMY_BASE_HP_MULT * diff.hpMult; e.maxHp = e.hp;
    e.dmg = baseDmg * ENEMY_BASE_DMG_MULT; e.spd = stats.spd * diff.spdMult; e.sz = opts.sz || stats.sz; e.type = type;
    e.gold = opts.gold || stats.gold; e.xp = opts.xp || stats.xp; e.kbX = 0; e.kbY = 0; e.flash = 0;
    e.vx = 0; e.vy = 0;
    e.behaviorTimer = Math.random() * 2; e.behaviorState = 0;
    e._motionSeed = Math.random() * Math.PI * 2;
    e._strafeDir = Math.random() < 0.5 ? -1 : 1;
    e._strafeTimer = 0.8 + Math.random() * 1.0;
    e._sepVX = 0; e._sepVY = 0;
    e._phaseTimer = 0;
    e._roleIndex = spawnEnemy._roleCounter % ENEMY_ROLE_ANGLES.length;
    e._lungeX = 0; e._lungeY = 0;
    e._maulDone = false;
    e._castAngle = 0;
    e._castTargetX = x;
    e._castTargetY = y;
    e._telegraph = null;
    e._threatMode = getEnemyThreatMeta(type).mode;
    e._threatBoost = 0;
    e._threatColor = getEnemyThreatMeta(type).color;
    e._attitude = 'spawn';
    e._attitudeTimer = 0;
    e._attitudePower = 0.8;
    e._alertTimer = 0;
    e._staggerTimer = 0;
    e._spawnDirX = spawnVec.x;
    e._spawnDirY = spawnVec.y;
    e._hitDirX = 0;
    e._hitDirY = -1;
    e._deathDirX = spawnVec.x;
    e._deathDirY = spawnVec.y;
    e._burnTime = 0;
    e._burnDmg = 0;
    e._burnFxCd = 0;
    e.drawX = x;
    e.drawY = y;
    e.renderDirAngle = Math.atan2(P.y - y, P.x - x);
    e.renderBob = 0;
    e.renderLean = 0;
    e.renderScaleX = 1;
    e.renderScaleY = 1;
    e.spawnReveal = 0;
    e.deathLift = 0;
    e.deathRot = 0;
    e.deathSpin = 0;
    e.deathFade = 0;
    e.spawning = !opts.instantSpawn && (opts.spawnTelegraph !== 0);
    e.spawnTimer = e.spawning ? (opts.spawnTelegraph || ENEMY_SPAWN_TELEGRAPH) : 0;
    e.isSplit = opts.isSplit || false;
    e.isElite = opts.isElite || false;
    e.anim = 'walk'; e.animF = 0; e.animT = 0; e.faceX = 1; e.dying = false;
  }
}

function chooseContinuousSpawnPoint(batchIndex) {
  const bLeft = typeof BUILDING_LEFT !== 'undefined' ? BUILDING_LEFT : WORLD_W * 0.22;
  const bRight = typeof BUILDING_RIGHT !== 'undefined' ? BUILDING_RIGHT : WORLD_W * 0.78;
  const bTop = typeof BUILDING_TOP !== 'undefined' ? BUILDING_TOP : WORLD_H * 0.12;
  const bBottom = typeof BUILDING_BOTTOM !== 'undefined' ? BUILDING_BOTTOM : WORLD_H * 0.88;
  const laneCount = 6;
  let best = null;
  let bestScore = -Infinity;
  spawnContinuous._laneSeed = (spawnContinuous._laneSeed || 0) + 1;
  for (let i = 0; i < 8; i++) {
    const lane = (spawnContinuous._laneSeed + batchIndex * 2 + i) % laneCount;
    const laneT = laneCount === 1 ? 0.5 : lane / (laneCount - 1);
    const jitter = (Math.random() - 0.5) * 0.12;
    const x = clampEnemyValue(bLeft + (laneT + jitter) * (bRight - bLeft), bLeft + 24, bRight - 24);
    const fromTop = ((spawnContinuous._laneSeed + batchIndex + i) % 2) === 0;
    const y = fromTop ? -34 - Math.random() * 90 : WORLD_H + 34 + Math.random() * 90;
    const anchorY = fromTop ? bTop + 26 : bBottom - 26;
    const pressure = getEnemyPressureAt(x, anchorY, 135, null);
    const distToPlayer = Math.hypot(x - P.x, anchorY - P.y);
    const flankBias = Math.abs(x - P.x) / Math.max(1, (bRight - bLeft) * 0.5);
    const score = distToPlayer * 0.02 + flankBias * 14 - pressure * 28 - Math.abs(x - (bLeft + bRight) * 0.5) * 0.004;
    if (score > bestScore) {
      bestScore = score;
      best = { x, y };
    }
  }
  return best || { x: (bLeft + bRight) * 0.5, y: -40 };
}

function processNextLevelUp() {
  if (G.pendingLevelUps <= 0) return;

  const choices = typeof generateLevelUpChoices === 'function'
    ? generateLevelUpChoices(P, WEAPONS, 3)
    : [];
  const externalChoice = typeof resolveExternalLevelUpChoice === 'function'
    ? resolveExternalLevelUpChoice(choices, P)
    : null;
  const selectedChoice = externalChoice
    || (typeof autoPickLevelUpChoice === 'function' ? autoPickLevelUpChoice(choices, P) : choices[0] || null);
  const selectedIndex = selectedChoice ? choices.findIndex((choice) => choice && choice.id === selectedChoice.id) : -1;

  G.lastLevelUpChoices = Array.isArray(choices) && typeof serializeLevelUpChoice === 'function'
    ? choices.map((choice, index) => serializeLevelUpChoice(choice, index))
    : [];

  if (selectedChoice) {
    if (typeof applyLevelUpChoice === 'function') {
      applyLevelUpChoice(selectedChoice, P, WEAPONS);
    }
    if (selectedChoice.type !== 'evolution' && typeof showAutoLevelUpBanner === 'function') {
      showAutoLevelUpBanner(selectedChoice);
    }
    G.levelUpCounter = (G.levelUpCounter || 0) + 1;
    G.lastLevelUpChoice = typeof serializeLevelUpChoice === 'function'
      ? serializeLevelUpChoice(selectedChoice, selectedIndex, G.levelUpCounter)
      : null;
  }

  G.pendingLevelUps--;
  hideLevelUpUI();
  if (G.pendingLevelUps > 0) {
    setTimeout(() => processNextLevelUp(), 90);
  } else {
    lastT = performance.now();
    requestAnimationFrame(loop);
  }
}

function addXP(val) {
  P.xp += val;
  while (P.xp >= P.xpNext) {
    P.xp -= P.xpNext; P.level++;
    G.pendingLevelUps = (G.pendingLevelUps || 0) + 1;
    P.xpNext = typeof getXpThreshold === 'function' ? getXpThreshold(P.level) : Math.floor(50 * 1.4 ** P.level);
    playSound('levelup');
    addDmgNum({ x: P.x, y: P.y - 40, n: 'LV' + P.level, life: 0.8, col: '#2ed573' });
  }
}

function enemyDeath(e) {
  if (e.dying) return; // already dying
  const ex = e.x, ey = e.y, etype = e.type, eSplit = e.isSplit;
  e.dying = true; G.kills++;
  // Simple death: skip animation, just quick fade
  e.deathFade = 0.18;
  e.spawnReveal = 0;
  e.deathLift = 0;
  e.deathRot = 0;
  e.deathSpin = 0;
  e._deathDirX = 0;
  e._deathDirY = 0;
  e._attitude = 'death';
  e._attitudeTimer = 0.18;
  e._attitudePower = 0;
  e.drawX = e.x;
  e.drawY = e.y;
  if (typeof addCombo === 'function') addCombo();
  if (typeof checkMilestones === 'function') checkMilestones();
  if (typeof updateMissions === 'function') updateMissions(0);
  const bonusGold = G.combo >= 50 ? 5 : G.combo >= 20 ? 3 : G.combo >= 10 ? 1 : 0;
  const goldMult = typeof getMarketGoldMult === 'function' ? getMarketGoldMult() : 1;
  const goldVal = Math.round((e.gold + bonusGold) * goldMult);
  G.gold += goldVal; G.totalGoldEarned += goldVal;
  addXP(e.xp);
  if (typeof chargeUltimate === 'function') chargeUltimate(1);
  if (typeof jeffKillReaction === 'function') jeffKillReaction();
  if (typeof fxEnemyDeath === 'function') {
    fxEnemyDeath(
      ex,
      ey,
      typeof ENEMY_COLORS !== 'undefined' ? ENEMY_COLORS[etype] : '#ff3333',
      { elite: !!e.isElite, combo: G.combo }
    );
  }
  if (typeof fxEnemyRewardBurst === 'function') {
    fxEnemyRewardBurst(ex, ey, {
      gold: goldVal,
      xp: e.xp,
      elite: !!e.isElite,
    });
  }
  playSound(e.isElite ? 'enemyDeathElite' : 'enemyDeath');
  if (typeof degenOnEnemyDeath === 'function') degenOnEnemyDeath(ex, ey);
  // Juice: micro hitstop on kills (stronger for elites/high combo)
  if (typeof hitstop === 'function') {
    const comboBonus = G.combo >= 30 ? 0.015 : G.combo >= 10 ? 0.008 : 0;
    hitstop(0.018 + comboBonus + (e.isElite ? 0.02 : 0));
  }
  // Subtle shake on elite kills + micro slowmo on big combos
  if (e.isElite && typeof triggerShake === 'function') triggerShake(3, 0.12);
  if (G.combo === 25 && typeof triggerSlowmo === 'function') triggerSlowmo(0.6, 0.15);
  if (G.combo === 50 && typeof triggerSlowmo === 'function') triggerSlowmo(0.4, 0.2);

  if (Math.random() < 0.05) {
    const hpk = pickups.get();
    if (hpk) {
      hpk.active = true; hpk.x = ex + (Math.random() - 0.5) * 20; hpk.y = ey + (Math.random() - 0.5) * 20;
      hpk.type = 'heart'; hpk.val = 15; hpk.mag = false;
      hpk._bobSeed = Math.random() * Math.PI * 2;
      hpk._spawnT = 0;
      hpk._trailCd = 0;
      hpk._spin = (Math.random() - 0.5) * 0.35;
    }
  }

  // Per-type death effects (registered in ENEMY_DEFS)
  const def = ENEMY_DEFS[etype];
  if (def && def.onDeath) def.onDeath(e, ex, ey, eSplit);
}

function spawnContinuous(dt) {
  G.spawnCd -= dt;
  if (G.spawnCd > 0) return;
  const maxEnemies = typeof MAX_ENEMIES !== 'undefined' ? MAX_ENEMIES : 150;
  if (enemies.count >= maxEnemies) return;

  const diff = typeof getDifficulty === 'function' ? getDifficulty(G.wave) : { spawnRate: 1, batchSize: 1, maxType: 0 };
  G.spawnCd = diff.spawnRate;

  const room = maxEnemies - enemies.count;
  const batch = Math.min(diff.batchSize, room);

  for (let i = 0; i < batch; i++) {
    const spawnPoint = chooseContinuousSpawnPoint(i);
    const x = spawnPoint.x;
    const y = spawnPoint.y;
    const type = Math.min(diff.maxType, Math.floor(Math.random() * (diff.maxType + 1)));

    const eliteChance = G.wave >= 10 ? 0.08 : G.wave >= 8 ? 0.06 : G.wave >= 6 ? 0.04 : G.wave >= 4 ? 0.02 : 0;
    const isElite = eliteChance > 0 && Math.random() < eliteChance;
    if (isElite) {
      const stats = ENEMY_STATS[type];
      spawnEnemy(type, x, y, { isElite: true, hp: stats.hp * 3, dmg: stats.dmg * 2, gold: stats.gold * 3, xp: stats.xp * 3, sz: stats.sz * 1.3 });
    } else {
      spawnEnemy(type, x, y);
    }
  }
}

let _shieldDrones = [];
function hasShieldAura(e) {
  // Shield aura system removed (old enemy roster)
  return false;
}

function updateEnemyBehavior(e, dt) {
  ensureEnemyMotionState(e);
  const dx = P.x - e.x, dy = P.y - e.y, ds = Math.hypot(dx, dy);
  const eSpdMult = typeof getMarketEnemySpdMult === 'function' ? getMarketEnemySpdMult() : 1;
  const edt = dt * eSpdMult;
  e.behaviorTimer -= edt;
  tickEnemyTelegraph(e, edt);
  setEnemyThreatState(e, getEnemyThreatMeta(e).mode, getEnemyThreatMeta(e).priority * 0.08, getEnemyThreatMeta(e).color);

  if (e._attitudeTimer > 0) e._attitudeTimer = Math.max(0, e._attitudeTimer - edt);
  else e._attitudePower += (0 - e._attitudePower) * Math.min(1, edt * 3.5);

  if (e._staggerTimer > 0) {
    e._staggerTimer = Math.max(0, e._staggerTimer - edt);
    clearEnemyTelegraph(e);
    setEnemyAttitude(e, 'stagger', e._staggerTimer, 0.92);
    e.vx += (0 - e.vx) * Math.min(1, edt * 9);
    e.vy += (0 - e.vy) * Math.min(1, edt * 9);
    applyEnemyWallAvoidance(e, edt);
    return;
  }

  if (e._alertTimer > 0) {
    e._alertTimer = Math.max(0, e._alertTimer - edt);
    const target = getPredictedPlayerTarget(e, 0.08);
    setEnemyAttitude(e, 'alert', e._alertTimer, 0.74);
    steerEnemyArrivePoint(e, target.x, target.y, edt, 110, 42, 0.45, 0.65, Math.sin(G.totalTime * 4 + e._motionSeed) * 0.04);
    applyEnemyWallAvoidance(e, edt);
    return;
  }

  const def = ENEMY_DEFS[e.type];
  if (def && def.behavior) {
    def.behavior(e, dt, dx, dy, ds, edt);
  } else {
    const target = getPredictedPlayerTarget(e);
    steerEnemyTowardPoint(e, target.x, target.y, edt, 1, 1, 0);
  }
  applyEnemyWallAvoidance(e, edt);
}

function applyEnemyKnockback(e, sourceX, sourceY, force) {
  if (!e || e.dying || sourceX === undefined || sourceY === undefined || !force) return;
  const dx = e.x - sourceX;
  const dy = e.y - sourceY;
  const ds = Math.hypot(dx, dy) || 1;
  const eliteMult = e.isElite ? 0.7 : 1;
  const sizeMult = Math.max(0.55, 1 - e.sz / 120);
  const kb = force * eliteMult * sizeMult;
  // Smoother knockback — cap impulse to prevent teleporting
  const impulse = Math.min(kb * 60, 400);
  e.vx += (dx / ds) * impulse;
  e.vy += (dy / ds) * impulse;
  e._hitDirX = dx / ds;
  e._hitDirY = dy / ds;
  e._staggerTimer = Math.max(e._staggerTimer || 0, Math.min(0.16, 0.05 + kb * 0.012));
  e.flash = Math.max(e.flash || 0, 0.14);
  setEnemyAttitude(e, 'stagger', e._staggerTimer, 0.9);
  e.kbX = 0;
  e.kbY = 0;
}

function applyPlayerKnockback(sourceX, sourceY, force) {
  if (sourceX === undefined || sourceY === undefined || !force) return;
  const dx = P.x - sourceX;
  const dy = P.y - sourceY;
  const ds = Math.hypot(dx, dy) || 1;
  P.kbX += (dx / ds) * force;
  P.kbY += (dy / ds) * force;
}


window.ENEMY_MOVE = ENEMY_MOVE;
window.applyEnemySeparation = applyEnemySeparation;
window.spawnEnemy = spawnEnemy;
window.processNextLevelUp = processNextLevelUp;
window.addXP = addXP;
window.enemyDeath = enemyDeath;
window.spawnContinuous = spawnContinuous;
window.hasShieldAura = hasShieldAura;
window.updateEnemyBehavior = updateEnemyBehavior;
window.applyEnemyKnockback = applyEnemyKnockback;
window.applyEnemyBurn = applyEnemyBurn;
window.applyBossBurn = applyBossBurn;
window.updateEnemyStatusEffects = updateEnemyStatusEffects;
window.applyPlayerKnockback = applyPlayerKnockback;
window.getEnemyThreatMeta = getEnemyThreatMeta;
window.getEnemyThreatScore = getEnemyThreatScore;


// Player Damage
function hitPlayer(dmg, sourceX, sourceY, kbForce) {
  if (P.iframes > 0 || G.phase !== 'wave' && G.phase !== 'boss') return;

  const dodgeChance = Math.max(0, Math.min(60, P.dodge || 0));
  if (dodgeChance > 0 && Math.random() * 100 < dodgeChance) {
    P.iframes = Math.max(P.iframes || 0, 0.35);
    P.flash = Math.max(P.flash || 0, 0.04);
    if (typeof addDmgNum === 'function') addDmgNum({ x: P.x, y: P.y - 34, n: 'DODGE', life: 0.45, col: '#7ce8ff' });
    if (typeof fxPlayerDodge === 'function') fxPlayerDodge(P.x, P.y);
    return;
  }

  const armorDmg = Math.max(1, dmg - P.armor);
  let hitDirX = 0;
  let hitDirY = -1;
  if (Number.isFinite(sourceX) && Number.isFinite(sourceY)) {
    const dx = P.x - sourceX;
    const dy = P.y - sourceY;
    const ds = Math.hypot(dx, dy) || 1;
    hitDirX = dx / ds;
    hitDirY = dy / ds;
  }
  P.hp -= armorDmg; P.iframes = 0.5; P.flash = 0.1;
  G.totalDmgTaken += armorDmg;
  G.combo = 0; G.comboDecay = 0;
  const hpRatio = P.maxHp > 0 ? Math.max(0, P.hp) / P.maxHp : 1;
  const danger = Math.max(0, Math.min(1, (0.45 - hpRatio) / 0.45));
  const impactSeverity = Math.max(0.32, Math.min(1.25, armorDmg / Math.max(10, P.maxHp * 0.16) + danger * 0.45));
  P._hitDirX = hitDirX;
  P._hitDirY = hitDirY;
  P._hitPulse = Math.max(P._hitPulse || 0, 0.24 + impactSeverity * 0.08);
  P._hitPulseMax = P._hitPulse;
  P._hitSeverity = Math.max(P._hitSeverity || 0, impactSeverity);
  if (typeof applyPlayerKnockback === 'function') applyPlayerKnockback(sourceX, sourceY, kbForce || Math.min(420, 150 + armorDmg * 9));
  if (typeof jeffHitReaction === 'function') jeffHitReaction(impactSeverity);
  if (typeof playSound === 'function') playSound('hit');
  if (typeof triggerShake === 'function') triggerShake(Math.min(7, 4.1 + armorDmg * 0.1 + danger * 1.4), 0.12 + impactSeverity * 0.08);
  if (typeof triggerDamageFlash === 'function') triggerDamageFlash(armorDmg, P.hp, P.maxHp);
  if (typeof fxPlayerHit === 'function') fxPlayerHit(P.x, P.y, { intensity: impactSeverity, danger, dirX: hitDirX, dirY: hitDirY });

  // Blood particles
  if (typeof spawnParticles === 'function') {
    spawnParticles(P.x, P.y, 15, {
      speed: 150, speedVar: 150,
      life: 0.4 + Math.random() * 0.4,
      color: '#ff0055', size: 3, sizeEnd: 0,
      shape: 'circle'
    });
  }

  if (P.hp <= 0 && typeof gameOver === 'function') { P.hp = 0; gameOver(); }
}

window.hitPlayer = hitPlayer;

// Boss
class Boss {
  constructor(data, wave) {
    this.data = data;
    this.key = G.bossKey;
    this.visual = getBossVisualProfile(this.key);
    this.tuning = typeof getBossFightTuning === 'function' ? getBossFightTuning(this.key) : null;
    this.x = CAM.x + W / 2;
    this.y = CAM.y - 150;
    this.targetY = CAM.y + 150;
    this.maxHp = Math.round(data.hp * (typeof getBossHpScale === 'function' ? getBossHpScale(this.key, wave) : (1 + wave * 0.15)));
    this.hp = this.maxHp;
    this.sz = data.sz || 45;
    this.col = data.col || '#ff5500';
    this.state = 'enter';
    this.timer = 0;
    this.attackCd = this.getAttackCooldown(null, true);
    this.attackIdx = 0;
    this.flash = 0;
    this.phase2 = false;
    this.clones = [];
    this.dash = null;
    this.shieldTimer = 0;
    this.shieldHp = 0;
    this.shieldMax = 0;
    this._phaseDrift = Math.random() * Math.PI * 2;
    this.faceAngle = Math.PI / 2; // default facing south (toward player)
    this.walkFrame = 0;
    this.walkTimer = 0;
    this.burnTime = 0;
    this.burnDmg = 0;
    this.burnFxCd = 0;
    this.intent = null;
  }

  getAttackCooldown(atk, isFirstAttack) {
    const tuning = this.tuning || {};
    if (isFirstAttack && Number.isFinite(tuning.firstAttackCd)) return tuning.firstAttackCd;
    const range = this.phase2 ? (tuning.phase2Cooldown || [1.05, 1.77]) : (tuning.attackCooldown || [1.55, 2.5]);
    const minCd = Math.max(0.2, Number.isFinite(range[0]) ? range[0] : 1.55);
    const maxCd = Math.max(minCd, Number.isFinite(range[1]) ? range[1] : minCd);
    let cd = minCd + Math.random() * (maxCd - minCd);
    if (atk && tuning.attackRecovery && Number.isFinite(tuning.attackRecovery[atk])) {
      cd += tuning.attackRecovery[atk];
    }
    return cd;
  }

  update(dt) {
    if (this.flash > 0) this.flash -= dt;
    if (this.intent) {
      this.intent.timer -= dt;
      if (this.intent.timer <= 0) this.intent = null;
    }
    if (this.burnTime > 0 && this.burnDmg > 0) {
      this.burnTime = Math.max(0, this.burnTime - dt);
      this.burnFxCd = Math.max(0, (this.burnFxCd || 0) - dt);
      const burnDmg = this.burnDmg * dt;
      if (burnDmg > 0) {
        this.hp -= burnDmg;
        G.totalDmgDealt += burnDmg;
        this.flash = Math.max(this.flash || 0, 0.04);
      }
      if (this.burnFxCd <= 0 && typeof spawnParticles === 'function') {
        this.burnFxCd = 0.08 + Math.random() * 0.08;
        spawnParticles(this.x + (Math.random() - 0.5) * this.sz * 0.36, this.y - this.sz * (0.3 + Math.random() * 0.14), 3, {
          speed: 18, speedVar: 16,
          life: 0.3, size: 4, sizeEnd: 0,
          colors: ['#ffb347', '#ff7a18', '#ffd166'],
          gravity: -48, friction: 0.86, shape: 'circle'
        });
      }
      if (this.burnTime <= 0) {
        this.burnDmg = 0;
        this.burnFxCd = 0;
      }
    }
    const phase2Threshold = this.tuning && Number.isFinite(this.tuning.phase2Threshold) ? this.tuning.phase2Threshold : 0.5;
    if (!this.phase2 && this.hp <= this.maxHp * phase2Threshold) {
      this.phase2 = true;
      this.flash = 0.18;
      const phaseBreakCd = this.tuning && Number.isFinite(this.tuning.phaseBreakCd) ? this.tuning.phaseBreakCd : 0.9;
      this.attackCd = Math.min(this.attackCd, phaseBreakCd);
      this.setIntent('phase_break', {
        label: 'PHASE BREAK',
        kind: 'shift',
        duration: 1.15,
        accent: '#ffd166'
      });
      bossScreenFlash('flash_warm', 0.12, 0.1);
      if (typeof triggerShake === 'function') triggerShake(7, 0.12);
    }
    this.timer += dt;
    // Walk animation timer (8 fps)
    this.walkTimer += dt;
    if (this.walkTimer >= 1 / 8) {
      this.walkTimer -= 1 / 8;
      this.walkFrame++;
    }

    if (this.shieldTimer > 0) {
      this.shieldTimer -= dt;
      if (this.shieldTimer <= 0 && this.shieldHp > 0) this.releaseBalanceSheet(false);
    }

    if (this.clones.length) this.updateClones(dt);

    const anchorX = CAM.x + W / 2;
    const anchorY = CAM.y + 150;
    if (this.state === 'enter') {
      this.x += (anchorX - this.x) * Math.min(1, dt * 5);
      this.y += (anchorY - this.y) * Math.min(1, dt * 2.5);
      if (Math.abs(this.y - anchorY) < 4) {
        this.x = anchorX;
        this.y = anchorY;
        this.targetY = anchorY;
        this.state = 'combat';
        this.timer = 0;
      }
      return;
    }

    if (this.updateDash(dt)) return;

    // Hovering movement
    this.targetY = anchorY;
    const sway = this.phase2 ? 320 : 250;
    const hoverX = anchorX + Math.sin(this.timer * 0.45 + this._phaseDrift) * sway;
    const hoverY = this.targetY + Math.sin(this.timer * (this.phase2 ? 1.6 : 1.2)) * (this.phase2 ? 42 : 30);
    this.x += (hoverX - this.x) * Math.min(1, dt * 3.6);
    this.y += (hoverY - this.y) * Math.min(1, dt * 4.1);
    // Update face direction toward player
    const fdx = P.x - this.x, fdy = P.y - this.y;
    if (fdx * fdx + fdy * fdy > 100) this.faceAngle = Math.atan2(fdy, fdx);

    this.attackCd -= dt;
    if (this.attackCd <= 0) {
      const atk = this.data.attacks[this.attackIdx % this.data.attacks.length];
      this.attack(atk);
      this.attackIdx++;
      this.attackCd = this.getAttackCooldown(atk, false);
    }
  }

  updateClones(dt) {
    const next = [];
    for (const c of this.clones) {
      c.life -= dt;
      if (c.life <= 0) continue;
      c.phase += dt * (0.9 + c.speedJitter);
      c.x = c.anchorX + Math.cos(c.phase) * c.wobble;
      c.y = c.anchorY + Math.sin(c.phase * 1.35) * c.wobble * 0.75;
      c.shotCd -= dt;
      if (c.shotCd <= 0) {
        const a = Math.atan2(P.y - c.y, P.x - c.x);
        spawnEnemyProjectileFan(c.x, c.y, a, this.phase2 ? 3 : 2, 0.26, 260, 13, c.col, { size: 1.05 });
        c.shotCd = c.fireRate;
      }
      next.push(c);
    }
    this.clones = next;
  }

  updateDash(dt) {
    if (!this.dash) return false;
    const d = this.dash;
    d.timer += dt;
    if (d.phase === 'windup') {
      this.x += (d.startX - this.x) * Math.min(1, dt * 10);
      this.y += (d.startY - this.y) * Math.min(1, dt * 10);
      if (d.timer >= d.windup) {
        d.phase = 'charge';
        d.timer = 0;
        if (d.onStart) d.onStart();
        bossScreenFlash(d.flashKind, d.flashAlpha, 0.05);
      }
      return true;
    }
    if (d.phase === 'charge') {
      const prevX = this.x;
      const prevY = this.y;
      const dx = d.targetX - this.x;
      const dy = d.targetY - this.y;
      const ds = Math.hypot(dx, dy) || 1;
      const step = d.speed * dt;
      if (ds <= step) {
        this.x = d.targetX;
        this.y = d.targetY;
        if (!d.impactDone) {
          d.impactDone = true;
          if (typeof fxExplosion === 'function') fxExplosion(this.x, this.y, d.impactRadius || 70);
          triggerBossAttackImpact(this, {
            kind: 'dash',
            x: this.x,
            y: this.y,
            radius: d.impactRadius || 70,
            sound: 'bossSlam'
          });
          if (typeof triggerShake === 'function') triggerShake(d.shake || 8, 0.12);
          if (d.onImpact) d.onImpact();
        }
        d.phase = 'recover';
        d.timer = 0;
      } else {
        this.x += (dx / ds) * step;
        this.y += (dy / ds) * step;
      }
      if (!d.hitDone && bossDistanceToSegment(P.x, P.y, prevX, prevY, this.x, this.y) < d.hitRadius) {
        d.hitDone = true;
        hitPlayer(d.damage, this.x, this.y, d.kbForce || 340);
      }
      return true;
    }
    if (d.phase === 'recover') {
      if (d.timer >= d.recover) this.dash = null;
      return true;
    }
    return false;
  }

  getLeadTarget(lead) {
    const dtLead = lead || 0.18;
    return {
      x: P.x + P.vx * dtLead,
      y: P.y + P.vy * dtLead
    };
  }

  setIntent(attackId, cfg) {
    const meta = getBossAttackTell(this.key, attackId);
    const duration = (cfg && cfg.duration) || meta.duration || 0.95;
    this.intent = {
      id: attackId,
      label: (cfg && cfg.label) || meta.label,
      kind: (cfg && cfg.kind) || meta.kind || 'pattern',
      accent: (cfg && cfg.accent) || meta.accent || this.visual.accent,
      duration,
      timer: duration
    };
  }

  startDash(targetX, targetY, cfg) {
    const tp = clampCombatPoint(targetX, targetY, this.sz + 24);
    cfg = cfg || {};
    triggerBossAttackCue(this, (this.intent && this.intent.id) || 'dash', {
      kind: 'dash',
      sound: false,
      targetX: tp.x,
      targetY: tp.y,
      targetRadius: cfg.hitRadius || 42
    });
    this.dash = {
      phase: 'windup',
      timer: 0,
      startX: this.x,
      startY: this.y,
      targetX: tp.x,
      targetY: tp.y,
      windup: cfg.windup || 0.24,
      speed: cfg.speed || 880,
      damage: cfg.damage || 24,
      hitRadius: cfg.hitRadius || 42,
      recover: cfg.recover || 0.14,
      impactRadius: cfg.impactRadius || 70,
      flashKind: cfg.flashKind || 'flash_white',
      flashAlpha: cfg.flashAlpha || 0.12,
      kbForce: cfg.kbForce || 340,
      shake: cfg.shake || 8,
      accent: cfg.accent || (this.intent && this.intent.accent) || this.visual.accent,
      onStart: cfg.onStart,
      onImpact: cfg.onImpact,
      impactDone: false,
      hitDone: false
    };
  }

  releaseBalanceSheet(shattered) {
    if (this.shieldHp <= 0 && this.shieldTimer <= 0) return;
    const count = this.phase2 ? 18 : 14;
    const dmg = shattered ? 18 : 14;
    this.shieldHp = 0;
    this.shieldMax = 0;
    this.shieldTimer = 0;
    bossSpawnRadial(this.x, this.y, count, shattered ? 285 : 235, dmg, '#6effcf', { size: 1.1 });
    bossScreenFlash('flash_purple', shattered ? 0.12 : 0.08, 0.08);
    triggerBossAttackImpact(this, {
      kind: 'shield',
      radius: shattered ? 90 : 70,
      sound: 'bossShield'
    });
    if (typeof fxExplosion === 'function') fxExplosion(this.x, this.y, shattered ? 90 : 70);
  }

  attack(atk) {
    this.setIntent(atk);
    triggerBossAttackCue(this, atk);
    // ---- MURAD: SHILLSTORM ----
    // Boss aims at the player, fires 3 aimed bursts in quick succession
    // Each burst = a tight spread of green bolts shot FROM the boss TOWARD the player
    // Clear telegraph: boss glows, then fires. Dodge sideways.
    if (atk === 'shillstorm') {
      const bursts = this.phase2 ? 4 : 3;
      const burstDelay = this.phase2 ? 0.33 : 0.42;
      bossScreenFlash('flash_purple', 0.07, 0.06);
      for (let i = 0; i < bursts; i++) {
        bossSchedule(this, i * burstDelay, () => {
          const target = this.getLeadTarget(0.12);
          const aimAngle = Math.atan2(target.y - this.y, target.x - this.x);
          const count = this.phase2 ? 5 : 3;
          const spread = this.phase2 ? 0.35 : 0.28;
          const speed = this.phase2 ? 280 : 248;
          const damage = this.phase2 ? 12 : 10;
          spawnEnemyProjectileFan(this.x, this.y, aimAngle, count, spread, speed, damage, '#89ff3b', { size: 1.1 });
          if (typeof spawnParticles === 'function') {
            spawnParticles(this.x, this.y, 4, {
              speed: 60, speedVar: 30, life: 0.25, size: 4, sizeEnd: 0,
              colors: ['#89ff3b', '#c4ff7a'], friction: 0.9, shape: 'circle'
            });
          }
        });
      }
      return;
    }
    // ---- MURAD: CULT CIRCLE ----
    // Boss dashes to player's position, lands with a shockwave ring of projectiles
    // Clear telegraph: boss winds up, charges, then explodes outward on impact. Dodge AWAY.
    if (atk === 'cultcircle') {
      const target = this.getLeadTarget(0.15);
      this.startDash(target.x, target.y, {
        windup: this.phase2 ? 0.32 : 0.4,
        speed: this.phase2 ? 820 : 660,
        damage: this.phase2 ? 20 : 14,
        hitRadius: this.phase2 ? 48 : 44,
        recover: this.phase2 ? 0.2 : 0.24,
        impactRadius: this.phase2 ? 80 : 74,
        flashKind: 'flash_purple',
        flashAlpha: 0.14,
        shake: this.phase2 ? 7 : 5,
        onImpact: () => {
          const count = this.phase2 ? 14 : 8;
          bossSpawnRadial(this.x, this.y, count, this.phase2 ? 200 : 150, this.phase2 ? 10 : 8, '#89ff3b', { size: 1.0 });
          if (typeof spawnParticles === 'function') {
            spawnParticles(this.x, this.y, 12, {
              speed: 100, speedVar: 50, life: 0.4, size: 5, sizeEnd: 0,
              colors: ['#89ff3b', '#d8ff8a', '#ffffff'], friction: 0.88, shape: 'circle'
            });
          }
        }
      });
      return;
    }
    // ---- APE: NFT RUG PULL ----
    // Delayed danger zones appear under the player's feet — must keep moving
    if (atk === 'barrelthrow') {
      bossScreenFlash('flash_warm', 0.06, 0.05);
      const count = this.phase2 ? 6 : 4;
      for (let i = 0; i < count; i++) {
        bossSchedule(this, i * 0.4, () => {
          // Spawn hazard at player's CURRENT position (forces constant movement)
          const pos = clampCombatPoint(P.x + (Math.random() - 0.5) * 40, P.y + (Math.random() - 0.5) * 40, 50);
          spawnEnemyHazard('depeg', pos.x, pos.y, 2.0, {
            radius: this.phase2 ? 90 : 70, dmg: this.phase2 ? 22 : 16, popped: false, color: '#8b6914'
          });
          if (typeof spawnParticles === 'function') {
            spawnParticles(pos.x, pos.y, 8, {
              speed: 60, speedVar: 30, life: 0.35, size: 4, sizeEnd: 0,
              colors: ['#8b6914', '#c49a2c'], friction: 0.9, shape: 'circle'
            });
          }
        });
      }
      return;
    }
    // ---- APE: FLOOR SWEEP ----
    // Horizontal wall sweeps across the arena — must dodge vertically
    if (atk === 'apeslam') {
      bossScreenFlash('flash_warm', 0.1, 0.06);
      if (typeof triggerShake === 'function') triggerShake(8, 0.3);
      const sweeps = this.phase2 ? 3 : 2;
      for (let i = 0; i < sweeps; i++) {
        bossSchedule(this, i * 0.7, () => {
          // Alternate horizontal and vertical sweeps
          const horiz = i % 2 === 0;
          if (horiz) {
            const fromTop = Math.random() > 0.5;
            spawnEnemyHazard('marketwall', P.x, fromTop ? BUILDING_TOP - 20 : BUILDING_BOTTOM + 20, 2.8, {
              vx: 0, vy: fromTop ? 220 : -220, w: 500, h: this.phase2 ? 36 : 28, color: '#8b6914'
            });
          } else {
            const fromLeft = Math.random() > 0.5;
            spawnEnemyHazard('marketwall', fromLeft ? BUILDING_LEFT - 20 : BUILDING_RIGHT + 20, P.y, 2.8, {
              vx: fromLeft ? 220 : -220, vy: 0, w: this.phase2 ? 36 : 28, h: 500, color: '#c49a2c'
            });
          }
        });
      }
      return;
    }
    // ---- CARLOS: BITCONNECT (HEY HEY HEY) ----
    // Expanding shockwave ring with a gap — player must find the gap to dodge through
    if (atk === 'bitconnect') {
      bossScreenFlash('flash_warm', 0.12, 0.08);
      const rings = this.phase2 ? 3 : 2;
      for (let r = 0; r < rings; r++) {
        bossSchedule(this, r * (this.phase2 ? 0.5 : 0.62), () => {
          const gapAngle = Math.atan2(P.y - this.y, P.x - this.x) + (Math.random() - 0.5) * 1.2;
          const count = this.phase2 ? 22 : 16;
          const gapSize = this.phase2 ? 1.95 : 2.55; // gap in radians — smaller = harder
          for (let i = 0; i < count; i++) {
            const a = (i / count) * Math.PI * 2;
            // Skip projectiles in the gap
            const diff = Math.abs(((a - gapAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
            if (diff < gapSize / 2) continue;
            spawnEnemyProjectile(this.x, this.y, a, 150 + r * 24, this.phase2 ? 18 : 12, '#ffd54f', { size: 1.2 });
          }
          if (typeof spawnParticles === 'function') {
            spawnParticles(this.x, this.y, 10, {
              speed: 80, speedVar: 40, life: 0.4, size: 6, sizeEnd: 0,
              colors: ['#ffd54f', '#ffeb99', '#fff'], friction: 0.9, shape: 'circle'
            });
          }
        });
      }
      return;
    }
    // ---- CARLOS: REFERRAL (PYRAMID SCHEME) ----
    // Summons minions in pyramid formation that march toward the player
    if (atk === 'referral') {
      bossScreenFlash('flash_warm', 0.08, 0.06);
      const rows = this.phase2 ? 4 : 2;
      const aimAngle = Math.atan2(P.y - this.y, P.x - this.x);
      const perpX = -Math.sin(aimAngle);
      const perpY = Math.cos(aimAngle);
      for (let row = 0; row < rows; row++) {
        const count = row + 1; // pyramid: 1, 2, 3, 4...
        for (let col = 0; col < count; col++) {
          const offset = (col - (count - 1) / 2) * 50;
          const dist = 60 + row * 55;
          const sx = this.x + Math.cos(aimAngle) * dist + perpX * offset;
          const sy = this.y + Math.sin(aimAngle) * dist + perpY * offset;
          const diff = typeof getDifficulty === 'function' ? getDifficulty(G.wave) : { maxType: 1 };
          const minionTypeCap = this.phase2 ? Math.min(diff.maxType, 1) : Math.min(diff.maxType, 0);
          if (typeof spawnEnemy === 'function') spawnEnemy(minionTypeCap, sx, sy);
        }
      }
      return;
    }
    // ---- LOGAN: FLASH KO (ZIGZAG BLITZ) ----
    // Boss charges in a zigzag pattern — unpredictable multi-dash
    if (atk === 'flashko') {
      bossScreenFlash('flash_white', 0.14, 0.08);
      const dashes = this.phase2 ? 5 : 3;
      for (let i = 0; i < dashes; i++) {
        bossSchedule(this, i * 0.35, () => {
          if (this.dash) return;
          // Zigzag: alternate between aiming at player and perpendicular offsets
          const baseAngle = Math.atan2(P.y - this.y, P.x - this.x);
          const zigzagOffset = (i % 2 === 0 ? 1 : -1) * (0.6 + Math.random() * 0.4);
          const targetAngle = baseAngle + zigzagOffset;
          const dist = 120 + Math.random() * 80;
          const tx = clampCombatPoint(this.x + Math.cos(targetAngle) * dist, this.y + Math.sin(targetAngle) * dist, 50);
          this.startDash(tx.x, tx.y, {
            windup: 0.08,
            speed: this.phase2 ? 1100 : 950,
            damage: this.phase2 ? 26 : 20,
            hitRadius: 44,
            recover: 0.08,
            flashKind: 'flash_white',
            flashAlpha: 0.08
          });
        });
      }
      return;
    }
    if (atk === 'scamzoo') {
      const center = this.getLeadTarget(0.12);
      const count = this.phase2 ? 5 : 4;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const pos = clampCombatPoint(center.x + Math.cos(a) * (110 + Math.random() * 70), center.y + Math.sin(a) * (110 + Math.random() * 70), 44);
        spawnEnemyHazard('egg', pos.x, pos.y, 1.7, { hatchAt: 1.0, color: '#ff7ad9', hatchAdds: this.phase2 && Math.random() < 0.6 });
      }
      return;
    }
    if (atk === 'deathspiral') {
      const bursts = this.phase2 ? 20 : 16;
      for (let i = 0; i < bursts; i++) bossSchedule(this, i * 0.08, () => {
        const angle = this.timer * 0.6 + i * 0.34;
        spawnEnemyProjectileFan(this.x, this.y, angle, this.phase2 ? 3 : 2, 0.16, 250, 14, '#67d7ff', { size: 1.05 });
      });
      return;
    }
    if (atk === 'depegfield') {
      const target = this.getLeadTarget(0.18);
      const count = this.phase2 ? 4 : 3;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + Math.random() * 0.8;
        const pos = clampCombatPoint(target.x + Math.cos(a) * (80 + i * 24), target.y + Math.sin(a) * (80 + i * 24), 70);
        spawnEnemyHazard('depeg', pos.x, pos.y, 2.35, { radius: this.phase2 ? 84 : 72, dmg: 12, popped: false, color: '#67d7ff' });
      }
      return;
    }
    if (atk === 'supercycle') {
      const waves = this.phase2 ? 4 : 3;
      for (let i = 0; i < waves; i++) bossSchedule(this, i * 0.2, () => {
        const target = this.getLeadTarget(0.2);
        const a = Math.atan2(target.y - this.y, target.x - this.x);
        spawnEnemyProjectileFan(this.x, this.y, a, this.phase2 ? 9 : 7, 0.8, 120, 16, '#d8a3ff', {
          size: 1.15,
          extra: { _accel: 165 + i * 24 }
        });
      });
      return;
    }
    if (atk === 'margincall') {
      const count = this.phase2 ? 5 : 4;
      for (let i = 0; i < count; i++) {
        const target = this.getLeadTarget(0.22 + i * 0.04);
        const pos = clampCombatPoint(target.x + (Math.random() - 0.5) * 80, target.y + (Math.random() - 0.5) * 80, 64);
        spawnEnemyHazard('margincall', pos.x, pos.y, 1.15, { radius: this.phase2 ? 82 : 70, dmg: this.phase2 ? 32 : 26, struck: false, color: '#d8a3ff' });
      }
      return;
    }
    if (atk === 'goldenmirage') {
      this.clones = [];
      const count = this.phase2 ? 4 : 3;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + Math.random() * 0.3;
        const anchor = clampCombatPoint(P.x + Math.cos(a) * (190 + i * 18), P.y + Math.sin(a) * (150 + i * 16), 58);
        this.clones.push({
          anchorX: anchor.x,
          anchorY: anchor.y,
          x: anchor.x,
          y: anchor.y,
          life: this.phase2 ? 5.8 : 4.4,
          phase: Math.random() * Math.PI * 2,
          speedJitter: Math.random() * 0.5,
          wobble: 14 + Math.random() * 7,
          shotCd: 0.4 + i * 0.12,
          fireRate: this.phase2 ? 0.62 : 0.82,
          col: '#ffd08a'
        });
      }
      return;
    }
    if (atk === 'phantomverdict') {
      const target = this.getLeadTarget(0.12);
      const tp = findEnemyTeleportPoint({ x: this.x, y: this.y }, { x: target.x, y: target.y, dx: target.x - this.x, dy: target.y - this.y }, 220, 300, true);
      this.x = tp.x;
      this.y = tp.y;
      const aim = Math.atan2(target.y - this.y, target.x - this.x);
      const dest = clampCombatPoint(target.x + Math.cos(aim) * 220, target.y + Math.sin(aim) * 220, 58);
      this.startDash(dest.x, dest.y, {
        windup: 0.2,
        speed: this.phase2 ? 1040 : 920,
        damage: this.phase2 ? 32 : 26,
        hitRadius: 52,
        recover: 0.12,
        flashKind: 'flash_warm',
        flashAlpha: 0.12,
        onImpact: () => spawnEnemyProjectileFan(this.x, this.y, aim, this.phase2 ? 5 : 4, 0.42, 260, 14, '#ffd08a', { size: 1.05 })
      });
      return;
    }
    if (atk === 'freezevault') {
      bossTriggerFreeze(this.phase2 ? 1.0 : 0.75);
      bossScreenFlash('flash_white', 0.12, 0.08);
      bossSpawnRadial(this.x, this.y, this.phase2 ? 14 : 10, 220, 16, '#9fe7ff', { size: 1.1 });
      return;
    }
    if (atk === 'custodychains') {
      const target = this.getLeadTarget(0.15);
      const count = this.phase2 ? 4 : 3;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const pos = clampCombatPoint(target.x + Math.cos(a) * 65, target.y + Math.sin(a) * 65, 70);
        spawnEnemyHazard('chainsnare', pos.x, pos.y, 1.35, { radius: this.phase2 ? 74 : 62, delay: 0.6, dmg: this.phase2 ? 28 : 22, snapped: false, color: '#9fe7ff' });
      }
      return;
    }
    if (atk === 'copyrightwalls') {
      const horizontal = Math.random() > 0.5;
      const count = this.phase2 ? 3 : 2;
      for (let i = 0; i < count; i++) {
        const offset = (i - (count - 1) * 0.5) * (horizontal ? 150 : 180);
        spawnEnemyHazard('wall', horizontal ? P.x + offset : P.x, horizontal ? P.y : P.y + offset, 4.6, {
          horizontal: i % 2 === 0 ? horizontal : !horizontal
        });
      }
      return;
    }
    if (atk === 'falsebeam') {
      const target = this.getLeadTarget(0.18);
      const angle = Math.atan2(target.y - this.y, target.x - this.x);
      spawnEnemyHazard('falsebeam', this.x, this.y, 1.25, {
        angle,
        warmup: 0.42,
        length: 820,
        width: this.phase2 ? 28 : 22,
        dmg: this.phase2 ? 42 : 32,
        color: '#ffcf9a'
      });
      return;
    }
    // ---- DO KWON: THE TERRA DESTROYER ----
    // ---- KWON: LUNA COLLAPSE (ARENA CRUMBLE) ----
    // Fire zones spawn around the edges and close in, shrinking the safe area
    if (atk === 'lunacollapse') {
      bossScreenFlash('flash_red', 0.1, 0.08);
      if (typeof triggerShake === 'function') triggerShake(6, 0.4);
      const rings = this.phase2 ? 3 : 2;
      for (let r = 0; r < rings; r++) {
        bossSchedule(this, r * 0.6, () => {
          // Spawn fire ring at increasing proximity to center
          const count = this.phase2 ? 14 : 10;
          const radius = 280 - r * 80;
          const cx = (this.x + P.x) / 2, cy = (this.y + P.y) / 2;
          for (let i = 0; i < count; i++) {
            const a = (i / count) * Math.PI * 2 + r * 0.5;
            const hx = cx + Math.cos(a) * radius;
            const hy = cy + Math.sin(a) * radius;
            const pos = clampCombatPoint(hx, hy, 40);
            spawnEnemyHazard('fire', pos.x, pos.y, this.phase2 ? 3.5 : 2.8, {
              radius: this.phase2 ? 44 : 36, dmg: this.phase2 ? 18 : 12, color: '#e74c3c'
            });
          }
        });
      }
      return;
    }
    if (atk === 'stablecoinfraud') {
      // Teleport near player then create expanding ring of hazard zones
      const target = this.getLeadTarget(0.15);
      const tp = findEnemyTeleportPoint({ x: this.x, y: this.y }, { x: target.x, y: target.y, dx: target.x - this.x, dy: target.y - this.y }, 100, 180, true);
      this.x = tp.x;
      this.y = tp.y;
      bossScreenFlash('flash_red', 0.1, 0.08);
      const cnt = this.phase2 ? 10 : 7;
      for (let i = 0; i < cnt; i++) {
        const a = (i / cnt) * Math.PI * 2;
        const dist = 70 + Math.random() * 40;
        const hx = this.x + Math.cos(a) * dist;
        const hy = this.y + Math.sin(a) * dist;
        spawnEnemyHazard('fire', hx, hy, this.phase2 ? 2.5 : 2.0, { radius: this.phase2 ? 48 : 38, dmg: this.phase2 ? 20 : 14, color: '#e74c3c' });
      }
      // Also shoot projectiles outward after teleport
      bossSchedule(this, 0.3, () => {
        bossSpawnRadial(this.x, this.y, this.phase2 ? 12 : 8, 200, this.phase2 ? 16 : 12, '#ff6b6b', { size: 1.1 });
      });
      return;
    }
    // ---- CAROLINE: THE SPREADSHEET QUEEN ----
    // ---- CAROLINE: ALAMEDA DRAIN (ROTATING LASER) ----
    // Spinning laser beam from the boss — player must orbit around to dodge
    if (atk === 'alamedadrain') {
      bossScreenFlash('flash_purple', 0.08, 0.06);
      const laserCount = this.phase2 ? 2 : 1;
      for (let i = 0; i < laserCount; i++) {
        const baseAngle = Math.atan2(P.y - this.y, P.x - this.x) + (i * Math.PI);
        spawnEnemyHazard('laser', this.x, this.y, this.phase2 ? 4.5 : 3.5, {
          baseAngle: baseAngle,
          speed: this.phase2 ? 0.8 : 0.6
        });
      }
      return;
    }
    // ---- CAROLINE: LIQUIDATION CASCADE ----
    // Brief freeze + grid of danger zones that explode in sequence (cascading liquidation)
    if (atk === 'liquidationcascade') {
      bossScreenFlash('flash_purple', 0.1, 0.06);
      if (typeof bossTriggerFreeze === 'function') bossTriggerFreeze(this.phase2 ? 0.6 : 0.4);
      // Cascade: sequential explosions in a line from boss to player
      const steps = this.phase2 ? 6 : 4;
      const dx = P.x - this.x, dy = P.y - this.y;
      const dist = Math.hypot(dx, dy);
      for (let i = 0; i < steps; i++) {
        bossSchedule(this, 0.5 + i * 0.25, () => {
          const t = (i + 1) / steps;
          const hx = this.x + dx * t + (Math.random() - 0.5) * 50;
          const hy = this.y + dy * t + (Math.random() - 0.5) * 50;
          const pos = clampCombatPoint(hx, hy, 50);
          spawnEnemyHazard('margincall', pos.x, pos.y, 0.8, {
            radius: this.phase2 ? 78 : 65, dmg: this.phase2 ? 28 : 22, struck: false, color: '#ff8fab'
          });
        });
      }
      return;
    }
    if (atk === 'backdoorportals') {
      const target = this.getLeadTarget(0.12);
      const count = this.phase2 ? 4 : 3;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + 0.35;
        const pos = clampCombatPoint(target.x + Math.cos(a) * 150, target.y + Math.sin(a) * 110, 56);
        spawnEnemyHazard('backdoorPortal', pos.x, pos.y, this.phase2 ? 5.2 : 4.2, {
          shotCd: 0.35 + i * 0.1,
          interval: this.phase2 ? 0.48 : 0.62,
          color: '#6effcf'
        });
      }
      return;
    }
    if (atk === 'balancesheet') {
      this.shieldTimer = this.phase2 ? 4.2 : 3.3;
      this.shieldMax = this.phase2 ? 340 : 240;
      this.shieldHp = this.shieldMax;
      bossScreenFlash('flash_purple', 0.08, 0.06);
      return;
    }
    if (atk === 'marketdomination') {
      bossScreenFlash('flash_warm', 0.14, 0.08);
      spawnEnemyHazard('marketwall', BUILDING_LEFT - 28, P.y - 110, 3.2, { vx: 210, vy: 0, w: 34, h: 250, color: '#ffd84d' });
      spawnEnemyHazard('marketwall', BUILDING_RIGHT + 28, P.y + 110, 3.2, { vx: -210, vy: 0, w: 34, h: 250, color: '#ffb800' });
      if (this.phase2) {
        spawnEnemyHazard('marketwall', P.x - 140, BUILDING_TOP - 26, 3.0, { vx: 0, vy: 180, w: 260, h: 28, color: '#ffe166' });
        spawnEnemyHazard('marketwall', P.x + 140, BUILDING_BOTTOM + 26, 3.0, { vx: 0, vy: -180, w: 260, h: 28, color: '#ffcc33' });
      }
      bossSpawnRadial(this.x, this.y, this.phase2 ? 14 : 10, 220, 16, '#ffd84d', { size: 1.1 });
      return;
    }
    if (atk === 'bisoncharge') {
      const charges = this.phase2 ? 4 : 3;
      for (let i = 0; i < charges; i++) bossSchedule(this, i * 0.62, () => {
        if (this.dash) return;
        const target = this.getLeadTarget(0.16 + i * 0.04);
        this.startDash(target.x, target.y, {
          windup: 0.14,
          speed: this.phase2 ? 1120 : 980,
          damage: this.phase2 ? 34 : 28,
          hitRadius: 54,
          recover: 0.14,
          impactRadius: 82,
          flashKind: 'flash_white',
          flashAlpha: 0.15,
          onImpact: () => bossSpawnRadial(this.x, this.y, this.phase2 ? 10 : 8, 240, 14, '#ffd84d', { size: 1.0 })
        });
      });
    }
  }

  hit(d) {
    if (this.shieldHp > 0) {
      const blocked = Math.min(this.shieldHp, d);
      this.shieldHp -= blocked;
      this.flash = 0.05;
      addDmgNum({ x: this.x, y: this.y - this.sz, n: Math.round(blocked), life: 0.35, col: '#6effcf' });
      if (this.shieldHp <= 0) this.releaseBalanceSheet(true);
      return false;
    }
    this.hp -= d;
    this.flash = 0.08;
    addDmgNum({ x: this.x, y: this.y - this.sz, n: Math.round(d), life: 0.4, col: '#ffd700' });
    if (typeof triggerShake === 'function') triggerShake(3, 0.06);
    return this.hp <= 0;
  }

  draw(ctx) {
    const drawSz = this.sz * 2.5;
    const half = drawSz / 2;
    const visual = this.visual || getBossVisualProfile(G.bossKey);
    const pulse = 0.72 + Math.sin(this.timer * 4.4 + this._phaseDrift) * 0.28;
    // Get walk frame or fallback to static directional sprite
    const fa = this.faceAngle || Math.PI / 2;
    const dirSprites = typeof BOSS_SPRITES !== 'undefined' ? BOSS_SPRITES[G.bossKey] : null;
    const isPixelArt = dirSprites && typeof dirSprites === 'object' && !dirSprites.tagName;
    const walkFrame = (typeof getBossWalkFrame === 'function') ? getBossWalkFrame(G.bossKey, fa, this.walkFrame) : null;
    const spr = walkFrame || (isPixelArt ? (typeof getBossSprite === 'function' ? getBossSprite(G.bossKey, fa) : dirSprites['south']) : dirSprites);
    const sprReady = spr && (spr.complete !== false);

    ctx.save();
    ctx.translate(this.x, this.y + this.sz * 0.5);
    const sigilR = this.sz + 18 + (this.phase2 ? 8 : 0);
    const floorGlow = ctx.createRadialGradient(0, 0, sigilR * 0.25, 0, 0, sigilR * 2.05);
    floorGlow.addColorStop(0, bossColorWithAlpha(visual.accent, 0.18 + pulse * 0.05));
    floorGlow.addColorStop(0.45, bossColorWithAlpha(visual.secondary, 0.07 + pulse * 0.04));
    floorGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = floorGlow;
    ctx.beginPath();
    ctx.ellipse(0, 0, sigilR * 1.55, sigilR * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = bossColorWithAlpha(visual.accent, 0.3 + pulse * 0.12 + (this.phase2 ? 0.08 : 0));
    ctx.lineWidth = this.phase2 ? 2.8 : 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, sigilR * 1.18, sigilR * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.save();
    ctx.scale(1, 0.64);
    ctx.rotate(this.timer * 0.16);
    switch (visual.motif) {
      case 'hex':
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const px = Math.cos(a) * sigilR * 0.9;
          const py = Math.sin(a) * sigilR * 0.9;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        break;
      case 'diamond':
        ctx.beginPath();
        ctx.moveTo(0, -sigilR);
        ctx.lineTo(sigilR * 0.8, 0);
        ctx.lineTo(0, sigilR);
        ctx.lineTo(-sigilR * 0.8, 0);
        ctx.closePath();
        ctx.stroke();
        break;
      case 'spike':
        ctx.beginPath();
        ctx.moveTo(0, -sigilR);
        ctx.lineTo(sigilR * 0.32, -sigilR * 0.18);
        ctx.lineTo(sigilR * 0.92, 0);
        ctx.lineTo(sigilR * 0.32, sigilR * 0.18);
        ctx.lineTo(0, sigilR);
        ctx.lineTo(-sigilR * 0.32, sigilR * 0.18);
        ctx.lineTo(-sigilR * 0.92, 0);
        ctx.lineTo(-sigilR * 0.32, -sigilR * 0.18);
        ctx.closePath();
        ctx.stroke();
        break;
      case 'spiral':
        ctx.beginPath();
        for (let i = 0; i <= 28; i++) {
          const t = i / 28;
          const a = t * Math.PI * 2.2;
          const r = sigilR * (0.16 + t * 0.72);
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        break;
      case 'slash':
        ctx.beginPath();
        ctx.moveTo(-sigilR, -sigilR * 0.78);
        ctx.lineTo(sigilR, sigilR * 0.78);
        ctx.moveTo(-sigilR * 0.62, sigilR * 0.82);
        ctx.lineTo(sigilR * 0.62, -sigilR * 0.82);
        ctx.stroke();
        break;
      case 'crown':
        ctx.beginPath();
        ctx.moveTo(-sigilR, sigilR * 0.42);
        ctx.lineTo(-sigilR * 0.54, -sigilR * 0.18);
        ctx.lineTo(0, -sigilR);
        ctx.lineTo(sigilR * 0.54, -sigilR * 0.18);
        ctx.lineTo(sigilR, sigilR * 0.42);
        ctx.stroke();
        break;
      case 'grid':
        ctx.strokeRect(-sigilR * 0.75, -sigilR * 0.75, sigilR * 1.5, sigilR * 1.5);
        ctx.beginPath();
        ctx.moveTo(-sigilR * 0.25, -sigilR * 0.75);
        ctx.lineTo(-sigilR * 0.25, sigilR * 0.75);
        ctx.moveTo(sigilR * 0.25, -sigilR * 0.75);
        ctx.lineTo(sigilR * 0.25, sigilR * 0.75);
        ctx.moveTo(-sigilR * 0.75, -sigilR * 0.25);
        ctx.lineTo(sigilR * 0.75, -sigilR * 0.25);
        ctx.moveTo(-sigilR * 0.75, sigilR * 0.25);
        ctx.lineTo(sigilR * 0.75, sigilR * 0.25);
        ctx.stroke();
        break;
      case 'square':
        ctx.strokeRect(-sigilR * 0.8, -sigilR * 0.8, sigilR * 1.6, sigilR * 1.6);
        ctx.beginPath();
        ctx.moveTo(-sigilR * 0.8, 0);
        ctx.lineTo(sigilR * 0.8, 0);
        ctx.moveTo(0, -sigilR * 0.8);
        ctx.lineTo(0, sigilR * 0.8);
        ctx.stroke();
        break;
      case 'chevron':
        ctx.beginPath();
        ctx.moveTo(-sigilR * 0.85, -sigilR * 0.25);
        ctx.lineTo(0, sigilR * 0.52);
        ctx.lineTo(sigilR * 0.85, -sigilR * 0.25);
        ctx.moveTo(-sigilR * 0.62, -sigilR * 0.55);
        ctx.lineTo(0, sigilR * 0.02);
        ctx.lineTo(sigilR * 0.62, -sigilR * 0.55);
        ctx.stroke();
        break;
      default:
        ctx.beginPath();
        ctx.arc(0, 0, sigilR * 0.8, 0, Math.PI * 2);
        ctx.stroke();
        break;
    }
    ctx.restore();
    for (let i = 0; i < 4; i++) {
      const a = this.timer * 0.9 + i * (Math.PI / 2);
      const ix = Math.cos(a) * sigilR * 1.05;
      const iy = Math.sin(a) * sigilR * 0.46;
      ctx.fillStyle = bossColorWithAlpha(i % 2 === 0 ? visual.secondary : visual.accent, 0.45 + pulse * 0.2);
      ctx.beginPath();
      ctx.arc(ix, iy, this.phase2 ? 3.2 : 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    for (const c of this.clones) {
      if (!isOnScreen(c.x, c.y, 100)) continue;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.globalAlpha = Math.max(0.18, Math.min(0.55, c.life / 4.5));
      ctx.shadowColor = visual.accent;
      ctx.shadowBlur = 10;
      if (sprReady) { ctx.imageSmoothingEnabled = false; ctx.drawImage(spr, -half, -half, drawSz, drawSz); ctx.imageSmoothingEnabled = true; }
      ctx.shadowBlur = 0;
      ctx.restore();
    }
    if (this.dash && this.dash.phase === 'windup') {
      const dashAlpha = 0.38 + pulse * 0.18;
      ctx.save();
      ctx.strokeStyle = bossColorWithAlpha(this.dash.accent || visual.accent, dashAlpha);
      ctx.lineWidth = 5.5;
      ctx.setLineDash([16, 10]);
      ctx.lineDashOffset = -this.timer * 42;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.dash.targetX, this.dash.targetY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.translate(this.dash.targetX, this.dash.targetY);
      ctx.fillStyle = bossColorWithAlpha(this.dash.accent || visual.accent, 0.16 + pulse * 0.06);
      ctx.beginPath();
      ctx.arc(0, 0, this.dash.hitRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = bossColorWithAlpha(visual.secondary, 0.7);
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(8, this.dash.hitRadius * 0.35), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.save(); ctx.translate(this.x, this.y);

    // Glow effect for pixel art bosses
    const glowCol = typeof BOSS_GLOW !== 'undefined' && BOSS_GLOW[G.bossKey];
    if (glowCol && isPixelArt) { ctx.shadowColor = glowCol; ctx.shadowBlur = 15; }

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const bossGlow = ctx.createRadialGradient(0, 0, this.sz * 0.2, 0, 0, half + 18);
    bossGlow.addColorStop(0, bossColorWithAlpha(visual.secondary, 0.18 + pulse * 0.08));
    bossGlow.addColorStop(0.45, bossColorWithAlpha(visual.accent, 0.12 + pulse * 0.08 + (this.phase2 ? 0.05 : 0)));
    bossGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = bossGlow;
    ctx.beginPath();
    ctx.arc(0, 0, half + 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (sprReady) { ctx.imageSmoothingEnabled = false; ctx.drawImage(spr, -half, -half, drawSz, drawSz); ctx.imageSmoothingEnabled = true; }
    ctx.shadowBlur = 0;

    if (this.shieldHp > 0) {
      const shieldAlpha = 0.2 + Math.sin(this.timer * 8) * 0.07;
      ctx.strokeStyle = `rgba(110,255,207,${shieldAlpha})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, this.sz + 12, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (this.phase2) {
      ctx.strokeStyle = `rgba(255,220,120,${0.18 + Math.sin(this.timer * 6) * 0.06})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.sz + 22, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (this.flash > 0 && sprReady) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.7;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(spr, -half, -half, drawSz, drawSz);
      ctx.imageSmoothingEnabled = true;
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();

    ctx.save();
    ctx.translate(this.x, this.y - half - 24);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = "800 10px 'Exo 2'";
    const tagLabel = String(visual.tag || this.data.sub || 'BOSS').toUpperCase();
    const tagWidth = Math.max(92, ctx.measureText(tagLabel).width + 20);
    ctx.fillStyle = bossColorWithAlpha('#04070c', 0.74);
    ctx.strokeStyle = bossColorWithAlpha(visual.accent, 0.36);
    ctx.lineWidth = 1.2;
    ctx.fillRect(-tagWidth / 2, -10, tagWidth, 16);
    ctx.strokeRect(-tagWidth / 2, -10, tagWidth, 16);
    ctx.fillStyle = visual.secondary;
    ctx.fillText(tagLabel, 0, -2);
    if (this.intent) {
      const intentProgress = this.intent.duration > 0 ? Math.max(0, Math.min(1, this.intent.timer / this.intent.duration)) : 0;
      ctx.font = "900 11px 'Exo 2'";
      const intentWidth = Math.max(124, ctx.measureText(this.intent.label).width + 24);
      ctx.fillStyle = bossColorWithAlpha('#02050a', 0.84);
      ctx.strokeStyle = bossColorWithAlpha(this.intent.accent || visual.accent, 0.5);
      ctx.fillRect(-intentWidth / 2, 12, intentWidth, 22);
      ctx.strokeRect(-intentWidth / 2, 12, intentWidth, 22);
      ctx.fillStyle = this.intent.accent || visual.accent;
      ctx.fillText(this.intent.label, 0, 22);
      ctx.fillStyle = bossColorWithAlpha(this.intent.accent || visual.accent, 0.9);
      ctx.fillRect(-intentWidth / 2 + 4, 30, (intentWidth - 8) * intentProgress, 2.5);
    }
    ctx.restore();
  }
}

function getBossForWave(wave) {
  const idx = Math.floor((wave / WAVES_PER_STAGE) - 1) % BOSS_ORDER.length;
  return BOSS_ORDER[idx];
}

function startBossIntro() {
  G.phase = 'bossIntro';
  enemies.clear(); projs.clear(); hazards.clear(); pickups.clear();

  G.bossKey = getBossForWave(G.wave);
  const bossData = BOSSES[G.bossKey];
  const bossVisual = getBossVisualProfile(G.bossKey);
  const bossTuning = typeof getBossFightTuning === 'function' ? getBossFightTuning(G.bossKey) : null;
  G.bossIntroTime = bossTuning && Number.isFinite(bossTuning.introTime) ? bossTuning.introTime : 3.0;

  const introEl = document.getElementById('boss-intro');
  introEl.classList.remove('h');
  const stageLabel = G.mode === 'adventure' ? `STAGE ${Math.floor(G.wave / WAVES_PER_STAGE)} BOSS` : `WAVE ${G.wave} BOSS`;
  const bossHpScaled = Math.round(bossData.hp * (typeof getBossHpScale === 'function' ? getBossHpScale(G.bossKey, G.wave) : (1 + G.wave * 0.15)));
  const threatLevel = bossHpScaled > 3000 ? 'EXTREME' : bossHpScaled > 1500 ? 'HIGH' : bossHpScaled > 800 ? 'MEDIUM' : 'LOW';
  const threatCol = threatLevel === 'EXTREME' ? '#ff0000' : threatLevel === 'HIGH' ? '#ff6b6b' : threatLevel === 'MEDIUM' ? '#ffa502' : '#55efc4';
  if (window.MediaDirector && typeof MediaDirector.showBossIdent === 'function') {
    MediaDirector.showBossIdent({
      bossKey: G.bossKey,
      name: bossData.name,
      sub: bossData.sub,
      tagline: bossVisual.tag,
      stageLabel,
      hp: bossHpScaled,
      threatLevel,
      threatColor: threatCol,
      accent: bossData.col,
      domain: bossVisual.tag
    });
  } else {
    introEl.innerHTML = `
      <div class="boss-intro-warning">WARNING</div>
      <div class="boss-intro-name">${bossData.name}</div>
      <div class="boss-intro-sub">${bossData.sub}</div>
      <div class="boss-intro-stage">${stageLabel}</div>
      <div class="boss-intro-threat" style="color:${threatCol}">THREAT: ${threatLevel} . HP ${bossHpScaled}</div>
      <div class="boss-intro-threat" style="color:${bossVisual.secondary}">${bossVisual.tag}</div>
    `;
    if (typeof playSound === 'function') playSound('bossDeath');
  }
}

function updateBossIntro(dt) {
  G.bossIntroTime -= dt;
  if (G.bossIntroTime <= 0) {
    document.getElementById('boss-intro').classList.add('h');
    startBoss();
  }
}

function startBoss() {
  G.phase = 'boss';
  const bossData = BOSSES[G.bossKey];
  G.boss = new Boss(bossData, G.wave);
  P.iframes = Math.max(P.iframes || 0, 0.4);
  document.querySelectorAll('.mo').forEach(m => m.classList.add('h'));
  document.getElementById('boss-intro').classList.add('h');
  document.getElementById('boss-bar').classList.remove('h');
  document.getElementById('boss-bar-name').textContent = bossData.name;
  document.getElementById('boss-bar-sub').textContent = bossData.sub;
  enemies.clear(); projs.clear(); hazards.clear();
  if (window.MediaDirector && typeof MediaDirector.enterBossCombat === 'function') MediaDirector.enterBossCombat(G.bossKey);
  lastT = performance.now();
}

window.Boss = Boss;
window.getBossForWave = getBossForWave;
window.startBossIntro = startBossIntro;
window.updateBossIntro = updateBossIntro;
window.startBoss = startBoss;
