// \components\Board\Enemy.jsx
import React from 'react';
import PropTypes from 'prop-types';
import enemyConfig from '../../config/enemyConfig.json';
import { resolveConfiguredAssetPath } from '../../utils/assetUtils';
import '../../styles/Enemy.css';

const Enemy = ({ type, position, health, spawned }) => {
  const enemyData = enemyConfig[type];
  if (!enemyData) return null;

  const { image } = enemyData;

  if (!spawned || !position || health <= 0) return null;

  const SIZE = 32;

  const maxHealth = enemyData.health;
  const healthPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  
  return (
    <div
      className="enemy"
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${SIZE}px`,
        height: `${SIZE}px`,
        transform: 'translate(-50%, -50%)',
        transition: 'left 0.1s linear, top 0.1s linear',
        pointerEvents: 'none'
      }}
    >
      {healthPercent > 0 && (
        <div className="enemy-bar-bg">
          <div className="enemy-bar-fill" style={{ width: `${healthPercent}%`, backgroundColor: healthPercent > 50 ? 'var(--enemy-health-high)' : healthPercent > 20 ? 'var(--enemy-health-mid)' : 'var(--enemy-health-low)' }} />
        </div>
      )}

      <img src={resolveConfiguredAssetPath(image)} alt={`${type} enemy`} style={{ width: '100%', height: '100%', display: 'block', opacity: health > 0 ? 1 : 0, transition: 'opacity 0.2s' }} />
    </div>
  );
};

Enemy.propTypes = {
  type: PropTypes.string.isRequired,
  position: PropTypes.shape({ x: PropTypes.number, y: PropTypes.number }),
  health: PropTypes.number,
  spawned: PropTypes.bool,
};

Enemy.defaultProps = {
  position: { x: 0, y: 0 },
  health: 0,
  spawned: false,
};

function areEqual(prev, next) {
  return prev.type === next.type &&
    prev.health === next.health &&
    (!prev.position && !next.position || (prev.position && next.position && prev.position.x === next.position.x && prev.position.y === next.position.y)) &&
    prev.spawned === next.spawned;
}

export default React.memo(Enemy, areEqual);