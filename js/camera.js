// ============ CAMERA & WORLD ============
const WORLD_W = 2560, WORLD_H = 1440;

const CAM = {
  x: 0, y: 0,
  smoothing: 0.08,
  normalSmoothing: 0.066,
  bossSmoothing: 0.074,
  dashSmoothing: 0.084,
  impactSmoothing: 0.082,
  deadZoneX: 72,
  deadZoneY: 52,
  aimLookAhead: 38,
  moveLookAhead: 28,
  dashLookAhead: 8,
  bossWeight: 0.17,
  lookSmoothing: 0.064,
  dashLookSmoothing: 0.074,
  impactLookSmoothing: 0.072,
  lookX: 0,
  lookY: 0
};

function resolveCameraDeadZone(current, desired, deadZone) {
  const delta = desired - current;
  if (Math.abs(delta) <= deadZone) return current;
  return current + Math.sign(delta) * (Math.abs(delta) - deadZone);
}

function getCameraSmoothing() {
  let smoothing = CAM.normalSmoothing || CAM.smoothing || 0.08;
  if (typeof G !== 'undefined' && G.phase === 'boss' && G.boss) smoothing = Math.max(smoothing, CAM.bossSmoothing || smoothing);
  if (typeof P !== 'undefined' && P.dashing) smoothing = Math.max(smoothing, CAM.dashSmoothing || smoothing);
  if (typeof P !== 'undefined' && Math.hypot(P.kbX || 0, P.kbY || 0) > 45) smoothing = Math.max(smoothing, CAM.impactSmoothing || smoothing);
  return smoothing;
}

function getCameraFocusPoint() {
  let x = P.x;
  let y = P.y;
  if (typeof G !== 'undefined' && G.phase === 'boss' && G.boss) {
    const w = CAM.bossWeight || 0.17;
    x = P.x * (1 - w) + G.boss.x * w;
    y = P.y * (1 - w) + G.boss.y * w;
  }
  return { x, y };
}

function getCameraLookSmoothing() {
  let smoothing = CAM.lookSmoothing || 0.078;
  if (typeof P !== 'undefined' && P.dashing) smoothing = Math.max(smoothing, CAM.dashLookSmoothing || smoothing);
  if (typeof P !== 'undefined' && Math.hypot(P.kbX || 0, P.kbY || 0) > 45) smoothing = Math.max(smoothing, CAM.impactLookSmoothing || smoothing);
  return smoothing;
}

function getCameraLookAhead() {
  const speed = Math.hypot(P.vx || 0, P.vy || 0);
  const moveNorm = Math.min(1, speed / Math.max(1, P.spd || 200));
  const moveDirX = speed > 0.001 ? (P.vx || 0) / speed : 0;
  const moveDirY = speed > 0.001 ? (P.vy || 0) / speed : 0;
  const aimX = Math.cos(P.angle || 0);
  const aimY = Math.sin(P.angle || 0);
  const aimDist = (CAM.aimLookAhead || 34) + (P.dashing ? (CAM.dashLookAhead || 8) : 0);
  const moveDist = (CAM.moveLookAhead || 14) * moveNorm;
  const bossAimMult = (typeof G !== 'undefined' && G.phase === 'boss' && G.boss) ? 0.78 : 1;
  return {
    x: aimX * aimDist * bossAimMult + moveDirX * moveDist,
    y: aimY * aimDist * 0.5 * bossAimMult + moveDirY * moveDist * 0.65
  };
}

function updateCamera(dt) {
  const focus = getCameraFocusPoint();
  const desiredLook = getCameraLookAhead();
  const lookSmoothing = getCameraLookSmoothing();
  CAM.lookX += (desiredLook.x - CAM.lookX) * Math.min(1, lookSmoothing * 60 * dt);
  CAM.lookY += (desiredLook.y - CAM.lookY) * Math.min(1, lookSmoothing * 60 * dt);
  const desiredCenterX = focus.x + CAM.lookX;
  const desiredCenterY = focus.y + CAM.lookY;
  const currentCenterX = CAM.x + W / 2;
  const currentCenterY = CAM.y + H / 2;
  const deadZoneScale = P.dashing ? 1.06 : (typeof G !== 'undefined' && G.phase === 'boss' && G.boss ? 1.03 : 1);
  const deadZoneX = (CAM.deadZoneX || 36) * deadZoneScale;
  const deadZoneY = (CAM.deadZoneY || 24) * deadZoneScale;
  const targetCenterX = resolveCameraDeadZone(currentCenterX, desiredCenterX, deadZoneX);
  const targetCenterY = resolveCameraDeadZone(currentCenterY, desiredCenterY, deadZoneY);
  const smoothing = getCameraSmoothing();

  // Smooth lerp
  const nextCenterX = currentCenterX + (targetCenterX - currentCenterX) * Math.min(1, smoothing * 60 * dt);
  const nextCenterY = currentCenterY + (targetCenterY - currentCenterY) * Math.min(1, smoothing * 60 * dt);
  CAM.x = nextCenterX - W / 2;
  CAM.y = nextCenterY - H / 2;

  // Clamp to world bounds
  CAM.x = Math.max(0, Math.min(WORLD_W - W, CAM.x));
  CAM.y = Math.max(0, Math.min(WORLD_H - H, CAM.y));

  // Hitstop
  updateHitstop(dt);
}

// ============ HITSTOP ============
CAM.hitstopTimer = 0;

function hitstop(duration) {
  CAM.hitstopTimer = Math.max(CAM.hitstopTimer, duration || 0.025);
}

function isHitstopActive() {
  return CAM.hitstopTimer > 0;
}

function updateHitstop(dt) {
  if (CAM.hitstopTimer > 0) CAM.hitstopTimer -= dt;
}

window.hitstop = hitstop;
window.isHitstopActive = isHitstopActive;

function isOnScreen(x, y, margin) {
  margin = margin || 80;
  return x > CAM.x - margin && x < CAM.x + W + margin &&
    y > CAM.y - margin && y < CAM.y + H + margin;
}
