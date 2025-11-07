import React from 'react';
import towerConfig from './config/towerConfig.json';

const Tower = ({ x, y, type, onClick, isShooting }) => {
  const towerData = towerConfig[type];
  if (!towerData) return null;

  const SIZE = 40; // musi zgadzać się z .tower w App.css i preview
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
    >
      <img
        src={towerData.image}
        alt={`${type} tower`}
        style={{ width: `${SIZE}px`, height: `${SIZE}px`, display: 'block' }}
      />
    </div>
  );
};

export default Tower;
