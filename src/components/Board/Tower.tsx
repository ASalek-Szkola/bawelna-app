// \components\Board\Tower.tsx
import { memo } from 'react';
import towerConfigJson from '../../config/towerConfig.json';
import GameImage from '../common/GameImage';
import { TOWER_SIZE } from '../../config/gameConstants';
import { TowerTypeConfig } from '../../types/game';
import '../../styles/Tower.css';

const towerConfig = towerConfigJson as Record<string, TowerTypeConfig>;

interface TowerProps {
  x: number;
  y: number;
  type: string;
  level?: number;
  onClick?: () => void;
  isShooting?: boolean;
  onRightClick?: () => void;
  isPlacingNewTower?: boolean;
  altGraphics?: boolean;
}

const TowerComponent = ({ 
  x, 
  y, 
  type, 
  level = 0, 
  onClick, 
  isShooting = false, 
  onRightClick, 
  isPlacingNewTower = false, 
  altGraphics = false 
}: TowerProps) => { 
  const towerData = towerConfig[type];
  if (!towerData) return null;

  return (
    <div
      className={`tower tower-lvl-${level} ${isShooting ? 'tower-shooting' : ''}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        position: 'absolute',
        width: `${TOWER_SIZE}px`,
        height: `${TOWER_SIZE}px`,
        cursor: isPlacingNewTower ? 'default' : 'pointer', 
      }}
      onClick={(e) => {
        e.stopPropagation(); 
        if (isPlacingNewTower) return; 
        onClick && onClick();
      }}
      onContextMenu={(e) => {
        e.preventDefault(); 
        e.stopPropagation(); 
        if (isPlacingNewTower) return;
        onRightClick && onRightClick();
      }}
      aria-label={`Wieżyczka ${type}`}
    >
      <GameImage
        src={towerData.image}
        alt={`${type} tower`}
        altGraphics={altGraphics}
        size={`${TOWER_SIZE}px`}
      />
    </div>
  );
};

function areEqual(prev: TowerProps, next: TowerProps) {
  return prev.x === next.x && 
         prev.y === next.y && 
         prev.type === next.type && 
         prev.level === next.level &&
         prev.isShooting === next.isShooting &&
         prev.isPlacingNewTower === next.isPlacingNewTower &&
         prev.altGraphics === next.altGraphics; 
}

export default memo(TowerComponent, areEqual);
