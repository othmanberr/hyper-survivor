// ============ SCREEN SHAKE & SLOW-MO ============
let shakeEnabled = true;
const shake = {
  x: 0,
  y: 0,
  intensity: 0,
  duration: 0,
  time: 0,
};

function triggerShake(intensity, duration) {
  if (!shakeEnabled) return;
  // Don't override stronger shake
  if (intensity > shake.intensity || shake.time <= 0) {
    shake.intensity = intensity;
    shake.duration = duration;
    shake.time = duration;
  }
}

function updateShake(dt) {
  if (shake.time > 0) {
    shake.time -= dt;
    const t = shake.time / shake.duration;
    const mag = shake.intensity * t; // decay
    shake.x = (Math.random() - 0.5) * mag * 2;
    shake.y = (Math.random() - 0.5) * mag * 2;
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
