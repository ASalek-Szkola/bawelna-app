// \utils\idUtils.ts — Unified ID generation for game entities

/**
 * Create a runtime ID with an optional prefix and index fallback.
 * Prefers crypto.randomUUID() when available.
 */
export function createRuntimeId(prefix: string = 'id', index: number = 0): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Create a unique tower ID (shorthand without prefix).
 */
export function createTowerId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
