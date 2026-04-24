// \components\common\GameImage.tsx
import { memo } from 'react';
import { resolveConfiguredAssetPathWithAlt } from '../../utils/assetUtils';

interface GameImageProps {
  src: string;
  alt: string;
  altGraphics?: boolean;
  size?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

const GameImage = ({ 
  src, 
  alt, 
  altGraphics = false, 
  size, 
  className, 
  style 
}: GameImageProps) => {
  const resolvedSrc = resolveConfiguredAssetPathWithAlt(src, altGraphics);

  const finalStyle: React.CSSProperties = {
    ...style,
    display: 'block',
    userSelect: 'none',
  };

  if (size) {
    const sizePx = typeof size === 'number' ? `${size}px` : size;
    finalStyle.width = sizePx;
    finalStyle.height = sizePx;
    finalStyle.objectFit = 'contain';
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      style={finalStyle}
      draggable={false}
      loading="lazy"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
};

export default memo(GameImage);
