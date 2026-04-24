// \utils\configUtils.ts — Safe config accessors with fallbacks

import enemyConfigJson from '../config/enemyConfig.json';
import towerConfigJson from '../config/towerConfig.json';
import { EnemyTypeConfig, TowerTypeConfig, TowerLevel } from '../types/game';

// Type assertion for JSON imports (since TS doesn't know the exact structure of random JSON files)
const enemyConfig = enemyConfigJson as Record<string, EnemyTypeConfig>;
const towerConfig = towerConfigJson as Record<string, TowerTypeConfig>;

const DEFAULT_ENEMY: EnemyTypeConfig = Object.freeze({
  image: '',
  health: 1,
  speed: 1,
  damageOnEscape: 0,
  killReward: 0,
});

const DEFAULT_TOWER_LEVEL: TowerLevel = Object.freeze({
  cost: 0,
  range: 100,
  damage: 0,
  fireRate: 1000,
});

/**
 * Get enemy config by type. Returns defaults for unknown types and logs a warning.
 */
export function getEnemyConfig(type: string): EnemyTypeConfig {
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
export function getTowerConfig(type: string): TowerTypeConfig | null {
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
export function getTowerLevelData(type: string, level: number = 0): TowerLevel {
  const config = getTowerConfig(type);
  if (!config) return { ...DEFAULT_TOWER_LEVEL };
  const clampedLevel = Math.min(level, config.levels.length - 1);
  return config.levels[clampedLevel] || { ...DEFAULT_TOWER_LEVEL };
}
