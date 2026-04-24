// \config\gameConstants.js — Central game constants (no more magic numbers)

/** Tower sprite size in pixels */
export const TOWER_SIZE = 40;

/** Enemy sprite size in pixels */
export const ENEMY_SIZE = 32;

/** Game loop tick interval in milliseconds */
export const TICK_MS = 33;

/** Duration of shooting animation in milliseconds */
export const SHOOTING_TIMER_MS = 150;

/**
 * Spawn spacing thresholds — controls how far apart enemies spawn.
 * Key = minimum totalInWave count, Value = spacing in pixels.
 * Evaluated from highest to lowest; first match wins.
 */
export const SPAWN_SPACING = [
  { minCount: 50, spacing: 8 },
  { minCount: 20, spacing: 16 },
  { minCount: 10, spacing: 24 },
  { minCount: 0, spacing: 35 },
];

/**
 * Get spawn spacing for the given wave size.
 */
export function getSpawnSpacing(totalInWave) {
  for (const { minCount, spacing } of SPAWN_SPACING) {
    if (totalInWave > minCount) return spacing;
  }
  return 35;
}

/**
 * Damage modifiers: maps [towerType][enemyType] → multiplier.
 * Default is 1.0 (no modifier).
 */
export const DAMAGE_MODIFIERS = {
  'rapid-picker': { tank: 0.5 },
  'sniper-picker': { tank: 1.5 },
};

/**
 * Get the damage multiplier for a tower type attacking an enemy type.
 */
export function getDamageMultiplier(towerType, enemyType) {
  return DAMAGE_MODIFIERS[towerType]?.[enemyType] ?? 1;
}

/** Default slow timer duration when a tower with slowFactor hits */
export const SLOW_TIMER_DEFAULT_MS = 1500;
