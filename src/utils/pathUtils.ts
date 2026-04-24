// \utils\pathUtils.ts
import { Position } from '../types/game';

/**
 * Checks if a point (x, y) is on the path given a path array and path width.
 */
export function isPointOnPath(x: number, y: number, path: Position[], pathWidth: number): boolean {
  if (!path || path.length < 2) return false;

  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];

    const minX = Math.min(p1.x, p2.x) - pathWidth / 2;
    const maxX = Math.max(p1.x, p2.x) + pathWidth / 2;
    const minY = Math.min(p1.y, p2.y) - pathWidth / 2;
    const maxY = Math.max(p1.y, p2.y) + pathWidth / 2;

    if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a tower at (x, y) overlaps with another tower at (tx, ty).
 */
export function isOverlappingTower(x: number, y: number, tx: number, ty: number, towerSize: number): boolean {
  const distance = Math.hypot(x - tx, y - ty);
  return distance < towerSize;
}
