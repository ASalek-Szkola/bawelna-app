const ASSET_MODULES = import.meta.glob('../assets/**/*.{png,jpg,jpeg,svg,webp,gif,mp3}', {
  eager: true,
  import: 'default'
});

const SRC_ASSET_PREFIX = 'src/assets/';

function toGlobKey(assetPath) {
  if (typeof assetPath !== 'string') return null;
  if (!assetPath.startsWith(SRC_ASSET_PREFIX)) return null;
  return `../assets/${assetPath.slice(SRC_ASSET_PREFIX.length)}`;
}

export function resolveConfiguredAssetPath(assetPath) {
  if (!assetPath) return '';

  const globKey = toGlobKey(assetPath);
  if (globKey && ASSET_MODULES[globKey]) {
    return ASSET_MODULES[globKey];
  }

  return assetPath;
}

export function resolveConfiguredAssetPathWithAlt(assetPath, useAlt = false) {
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
