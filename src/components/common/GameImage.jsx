// \components\common\GameImage.jsx — Unified image component with fallback chain
import { resolveConfiguredAssetPath, resolveConfiguredAssetPathWithAlt } from '../../utils/assetUtils';

const GameImage = ({ src, alt = '', altGraphics = false, size, className = '', style = {}, ...rest }) => {
  const resolvedSrc = altGraphics
    ? resolveConfiguredAssetPathWithAlt(src, true)
    : resolveConfiguredAssetPath(src);

  const imgStyle = {
    display: 'block',
    ...(size ? { width: size, height: size } : {}),
    ...style,
  };

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      style={imgStyle}
      onError={(e) => {
        // Try non-alt fallback first
        const fallback = resolveConfiguredAssetPath(src);
        if (e.currentTarget.src !== fallback) {
          e.currentTarget.src = fallback;
          return;
        }
        // Hide if both fail
        e.currentTarget.style.display = 'none';
      }}
      {...rest}
    />
  );
};

export default GameImage;
