// \utils\configUtils.js — Safe config accessors with fallbacks

import enemyConfig from '../config/enemyConfig.json';
import towerConfig from '../config/towerConfig.json';

const DEFAULT_ENEMY = Object.freeze({
  image: '',
  health: 1,
  speed: 1,
  damageOnEscape: 0,
  killReward: 0,
});

const DEFAULT_TOWER_LEVEL = Object.freeze({
  cost: 0,
  range: 100,
  damage: 0,
  fireRate: 1000,
});

/**
 * Get enemy config by type. Returns defaults for unknown types and logs a warning.
 */
export function getEnemyConfig(type) {
  const config = enemyConfig[type];
  if (!config) {
    console.warn(`[configUtils] Unknown enemy type: "${type}". Using defaults.`);
    return { ...DEFAULT_ENEMY };
  }
  return config;
}

/**
 * Get tower config by type. Returns null for unknown types and logs a warning.
 */
export function getTowerConfig(type) {
  const config = towerConfig[type];
  if (!config) {
    console.warn(`[configUtils] Unknown tower type: "${type}".`);
    return null;
  }
  return config;
}

/**
 * Get tower level data safely. Returns defaults if level is out of bounds.
 */
export function getTowerLevelData(type, level = 0) {
  const config = getTowerConfig(type);
  if (!config) return { ...DEFAULT_TOWER_LEVEL };
  const clampedLevel = Math.min(level, config.levels.length - 1);
  return config.levels[clampedLevel] || { ...DEFAULT_TOWER_LEVEL };
}
