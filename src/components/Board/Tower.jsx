// \components\Board\Tower.jsx
import { memo } from 'react';
import PropTypes from 'prop-types';
import towerConfig from '../../config/towerConfig.json';
import GameImage from '../common/GameImage';
import { TOWER_SIZE } from '../../config/gameConstants';
import '../../styles/Tower.css';

const Tower = ({ x, y, type, level, onClick, isShooting, onRightClick, isPlacingNewTower, altGraphics }) => { 
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

Tower.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  type: PropTypes.string.isRequired,
  level: PropTypes.number,
  onClick: PropTypes.func,
  isShooting: PropTypes.bool,
  onRightClick: PropTypes.func,
  isPlacingNewTower: PropTypes.bool,
  altGraphics: PropTypes.bool,
};

Tower.defaultProps = {
  isShooting: false,
  isPlacingNewTower: false,
  level: 0,
  altGraphics: false,
};

function areEqual(prev, next) {
  return prev.x === next.x && 
         prev.y === next.y && 
         prev.type === next.type && 
         prev.level === next.level &&
         prev.isShooting === next.isShooting &&
         prev.isPlacingNewTower === next.isPlacingNewTower &&
         prev.altGraphics === next.altGraphics; 
}

export default memo(Tower, areEqual);