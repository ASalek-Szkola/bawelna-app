// \utils\combatUtils.js — Combat mechanics extracted from useGameLoop

import { TOWER_SIZE, getDamageMultiplier, SLOW_TIMER_DEFAULT_MS } from '../config/gameConstants';

/**
 * Check if an enemy is within range of a tower.
 */
export function isInRange(enemy, towerX, towerY, range) {
  if (!enemy.position) return false;
  const centerX = towerX + TOWER_SIZE / 2;
  const centerY = towerY + TOWER_SIZE / 2;
  const dist = Math.hypot(enemy.position.x - centerX, enemy.position.y - centerY);
  return dist <= range;
}

/**
 * Find the best target for a tower given its targeting mode.
 * @param {Array} enemies - alive enemies with positions
 * @param {object} tower - tower object with x, y, targetingMode
 * @param {number} range - tower's current range
 * @returns {object|undefined} target enemy or undefined
 */
export function findTarget(enemies, tower, range) {
  const inRangeFilter = (e) => e.health > 0 && isInRange(e, tower.x, tower.y, range);

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
export function calculateDamage(baseDamage, towerType, enemyType) {
  return baseDamage * getDamageMultiplier(towerType, enemyType);
}

/**
 * Apply damage to enemies — single target or splash.
 * Returns a new array of enemies with updated health/slow.
 */
export function applyDamage(enemies, target, tower, levelData) {
  const { damage, splashRadius, slowFactor } = levelData;

  const applyToEnemy = (e) => {
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

  if (splashRadius && target.position) {
    return enemies.map((e) => {
      if (!e.position) return e;
      const dist = Math.hypot(
        e.position.x - target.position.x,
        e.position.y - target.position.y
      );
      return dist <= splashRadius ? applyToEnemy(e) : e;
    });
  }

  // Single target
  return enemies.map((e) => (e.id === target.id ? applyToEnemy(e) : e));
}
