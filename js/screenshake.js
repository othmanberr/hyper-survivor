// ============ SCREEN SHAKE & SLOW-MO ============
let shakeEnabled = false;
const shake = {
  x: 0,
  y: 0,
  intensity: 0,
  duration: 0,
  time: 0,
  phase: 0,
  phaseY: 1.7,
};

function triggerShake(intensity, duration) {
  if (!shakeEnabled) return;
  const comfortScale = intensity <= 1 ? 0.18 : intensity <= 3 ? 0.28 : intensity <= 6 ? 0.4 : 0.56;
  intensity *= comfortScale;
  duration *= intensity < 1 ? 0.75 : 0.88;
  // Don't override stronger shake
  if (intensity > shake.intensity || shake.time <= 0) {
    shake.intensity = intensity;
    shake.duration = duration;
    shake.time = duration;
    shake.phase = Math.random() * Math.PI * 2;
    shake.phaseY = shake.phase + Math.PI * 0.5;
  }
}

function updateShake(dt) {
  if (shake.time > 0) {
    shake.time -= dt;
    const t = shake.duration > 0 ? shake.time / shake.duration : 0;
    const mag = shake.intensity * t * t; // softer decay
    shake.phase += dt * (16 + shake.intensity * 2.4);
    shake.phaseY += dt * (13 + shake.intensity * 1.9);
    shake.x = (Math.sin(shake.phase) * 0.7 + Math.sin(shake.phase * 1.55 + 0.6) * 0.22) * mag;
    shake.y = (Math.cos(shake.phaseY) * 0.42 + Math.cos(shake.phaseY * 1.41 + 0.9) * 0.16) * mag;
  } else {
    shake.x = 0;
    shake.y = 0;
  }
}

// Slow-motion
const slowmo = {
  scale: 1,    // current time scale (1 = normal)
  target: 1,
  duration: 0,
  time: 0,
};

function triggerSlowmo(scale, duration) {
  slowmo.scale = scale;
  slowmo.target = 1;
  slowmo.duration = duration;
  slowmo.time = duration;
}

function updateSlowmo(dt) {
  if (slowmo.time > 0) {
    slowmo.time -= dt;
    // Lerp back to 1
    const t = 1 - (slowmo.time / slowmo.duration);
    slowmo.scale = slowmo.scale + (slowmo.target - slowmo.scale) * t * 0.5;
  } else {
    slowmo.scale = 1;
  }
}

function getTimeScale() {
  return slowmo.scale;
}
