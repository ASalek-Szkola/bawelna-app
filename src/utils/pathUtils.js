// pathUtils.js - utilities for path / geometry checks
export function distToSegment(px, py, x1, y1, x2, y2) {
  const vx = x2 - x1, vy = y2 - y1, wx = px - x1, wy = py - y1;
  const c1 = vx * wx + vy * wy;
  if (c1 <= 0) return Math.hypot(px - x1, py - y1);
  const c2 = vx * vx + vy * vy;
  if (c2 <= c1) return Math.hypot(px - x2, py - y2);
  const b = c1 / c2;
  return Math.hypot(px - (x1 + b * vx), py - (y1 + b * vy));
}

export function isPointOnPath(x, y, path = [], pathWidth = 0) {
  const half = pathWidth / 2;
  for (let i = 0; i < path.length - 1; i++) {
    if (distToSegment(x, y, path[i].x, path[i].y, path[i + 1].x, path[i + 1].y) <= half) return true;
  }
  return false;
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Sprawdza, czy nowa wieża (o środku nx, ny) nachodzi na istniejącą wieżę (tx, ty)
export function isOverlappingTower(nx, ny, tx, ty, size = 40) {
  // Obliczamy lewy górny róg nowej wieży (tak jak jest zapisywana w stanie)
  const newX = nx - size / 2;
  const newY = ny - size / 2;
  
  // Sprawdzenie kolizji prostokątnej (AABB)
  return !(
    newX + size <= tx || 
    newX >= tx + size || 
    newY + size <= ty || 
    newY >= ty + size
  );
}