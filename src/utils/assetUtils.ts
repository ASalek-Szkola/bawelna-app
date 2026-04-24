// \utils\assetUtils.ts

/// <reference types="vite/client" />

// Type for the glob import result
const ASSET_MODULES: Record<string, string> = import.meta.glob('../assets/**/*.{png,jpg,jpeg,svg,webp,gif,mp3}', {
  eager: true,
  import: 'default'
}) as Record<string, string>;
const SRC_ASSET_PREFIX = 'src/assets/';

function toGlobKey(assetPath: string): string | null {
  if (typeof assetPath !== 'string') return null;
  if (!assetPath.startsWith(SRC_ASSET_PREFIX)) return null;
  return `../assets/${assetPath.slice(SRC_ASSET_PREFIX.length)}`;
}

/**
 * Resolves a path like 'src/assets/tower.png' to the hashed Vite URL.
 */
export function resolveConfiguredAssetPath(assetPath: string): string {
  if (!assetPath) return '';

  const globKey = toGlobKey(assetPath);
  if (globKey && ASSET_MODULES[globKey]) {
    return ASSET_MODULES[globKey];
  }

  return assetPath;
}

/**
 * Resolves a path, optionally trying an '-alt' version first.
 */
export function resolveConfiguredAssetPathWithAlt(assetPath: string, useAlt: boolean = false): string {
  if (!useAlt || typeof assetPath !== 'string') {
    return resolveConfiguredAssetPath(assetPath);
  }

  const altAssetPath = assetPath.replace(/\.(png|jpg|jpeg|webp|gif)$/i, (ext) => `-alt${ext}`);
  if (altAssetPath !== assetPath) {
    const resolvedAlt = resolveConfiguredAssetPath(altAssetPath);
    if (resolvedAlt !== altAssetPath) {
      return resolvedAlt;
    }
  }

  return resolveConfiguredAssetPath(assetPath);
}
