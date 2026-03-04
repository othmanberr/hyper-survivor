// ============ CAMERA & WORLD ============
const WORLD_W = 2560, WORLD_H = 1440;

const CAM = {
  x: 0, y: 0,
  smoothing: 0.08
};

function updateCamera(dt) {
  const targetX = P.x - W / 2;
  const targetY = P.y - H / 2;

  // Smooth lerp
  CAM.x += (targetX - CAM.x) * Math.min(1, CAM.smoothing * 60 * dt);
  CAM.y += (targetY - CAM.y) * Math.min(1, CAM.smoothing * 60 * dt);

  // Clamp to world bounds
  CAM.x = Math.max(0, Math.min(WORLD_W - W, CAM.x));
  CAM.y = Math.max(0, Math.min(WORLD_H - H, CAM.y));
}

function isOnScreen(x, y, margin) {
  margin = margin || 80;
  return x > CAM.x - margin && x < CAM.x + W + margin &&
    y > CAM.y - margin && y < CAM.y + H + margin;
}
