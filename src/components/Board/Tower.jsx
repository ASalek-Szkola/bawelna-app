import React from 'react';
import PropTypes from 'prop-types';
import towerConfig from '../../config/towerConfig.json';
import '../../styles/Tower.css';

const Tower = ({ x, y, type, onClick, isShooting, onRightClick }) => {
  const towerData = towerConfig[type];
  if (!towerData) return null;

  const SIZE = 40;
  return (
    <div
      className={`tower ${isShooting ? 'tower-shooting' : ''}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        position: 'absolute',
        width: `${SIZE}px`,
        height: `${SIZE}px`,
        cursor: 'pointer',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick && onClick();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onRightClick && onRightClick();
      }}
      aria-label={`Wieżyczka ${type}`}
    >
      <img
        src={towerData.image}
        alt={`${type} tower`}
        style={{ width: `${SIZE}px`, height: `${SIZE}px`, display: 'block' }}
      />
    </div>
  );
};

Tower.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  type: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  isShooting: PropTypes.bool,
  onRightClick: PropTypes.func,
};

Tower.defaultProps = {
  isShooting: false,
};

function areEqual(prev, next) {
  return prev.x === next.x && prev.y === next.y && prev.type === next.type && prev.isShooting === next.isShooting;
}

export default React.memo(Tower, areEqual);
