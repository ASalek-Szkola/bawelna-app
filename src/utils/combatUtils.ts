// \utils\combatUtils.ts — Combat mechanics extracted from useGameLoop
import { TOWER_SIZE, getDamageMultiplier, SLOW_TIMER_DEFAULT_MS } from '../config/gameConstants';
import { Enemy, Tower, TowerLevel } from '../types/game';

/**
 * Check if an enemy is within range of a tower.
 */
export function isInRange(enemy: Enemy, towerX: number, towerY: number, range: number): boolean {
  if (!enemy.position) return false;
  const centerX = towerX + TOWER_SIZE / 2;
  const centerY = towerY + TOWER_SIZE / 2;
  const dist = Math.hypot(enemy.position.x - centerX, enemy.position.y - centerY);
  return dist <= range;
}

/**
 * Find the best target for a tower given its targeting mode.
 */
export function findTarget(enemies: Enemy[], tower: Tower, range: number): Enemy | undefined {
  const inRangeFilter = (e: Enemy) => e.health > 0 && isInRange(e, tower.x, tower.y, range);

  if (tower.targetingMode === 'strongest') {
    return enemies
      .filter(inRangeFilter)
      .sort((a, b) => b.health - a.health)[0];
  }
  return enemies.find(inRangeFilter);
}

/**
 * Calculate final damage accounting for tower/enemy type modifiers.
 */
export function calculateDamage(baseDamage: number, towerType: string, enemyType: string): number {
  return baseDamage * getDamageMultiplier(towerType, enemyType);
}

/**
 * Apply damage to enemies — single target or splash.
 * Returns a new array of enemies with updated health/slow.
 */
export function applyDamage(enemies: Enemy[], target: Enemy, tower: Tower, levelData: TowerLevel): Enemy[] {
  const { damage, splashRadius, slowFactor } = levelData;

  const applyToEnemy = (e: Enemy): Enemy => {
    const dmg = calculateDamage(damage, tower.type, e.type);
    const newSlowFactor = slowFactor || e.slowFactor || 0;
    const newSlowTimer = slowFactor
      ? Math.max(e.slowTimer || 0, SLOW_TIMER_DEFAULT_MS)
      : (e.slowTimer || 0);
    return {
      ...e,
      health: Math.max(0, e.health - dmg),
      slowTimer: newSlowTimer,
      slowFactor: newSlowFactor,
    };
  };

  if (splashRadius && target && target.position) {
    const targetPos = target.position;
    return enemies.map((e) => {
      if (!e.position) return e;
      const dist = Math.hypot(
        e.position.x - targetPos.x,
        e.position.y - targetPos.y
      );
      return dist <= splashRadius ? applyToEnemy(e) : e;
    });
  }

  // Single target
  return enemies.map((e) => (e.id === target.id ? applyToEnemy(e) : e));
}
