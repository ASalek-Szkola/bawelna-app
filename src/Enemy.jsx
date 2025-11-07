import React, { useEffect } from 'react';
import enemyConfig from './config/enemyConfig.json';

const Enemy = ({ type, position, health, path, onEscape, spawned }) => {
  const enemyData = enemyConfig[type];
  if (!enemyData) return null;

  const { image, damageOnEscape } = enemyData;

  // nie renderuj dopóki nie spawnął lub gdy enemy nie żyje
  if (!spawned || !position || health <= 0) return null;

  // Escape / removal is handled centrally in App.jsx movement logic.
  // Removing side-effects from this presentational component avoids
  // double-calling the escape handler and React reconciliation issues.

  const SIZE = 32; // obrazek enemy ma 32x32

  // Calculate health percentage
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
        transform: 'translate(-50%, -50%)', // centrowanie względem position
        transition: 'left 0.1s linear, top 0.1s linear',
        pointerEvents: 'none'
      }}
    >
      <div style={{ 
        position: 'absolute',
        bottom: '-8px',
        left: '0',
        width: '100%',
        height: '4px',
        backgroundColor: '#333',
        borderRadius: '2px'
      }}>
        <div style={{
          width: `${healthPercent}%`,
          height: '100%',
          backgroundColor: healthPercent > 50 ? '#2ecc71' : healthPercent > 20 ? '#e67e22' : '#e74c3c',
          borderRadius: '2px',
          transition: 'width 0.2s ease-out, background-color 0.2s'
        }} />
      </div>
      <img src={image} alt={`${type} enemy`} style={{ 
        width: '100%', 
        height: '100%', 
        display: 'block',
        opacity: health > 0 ? 1 : 0,
        transition: 'opacity 0.2s'
      }} />
    </div>
  );
};

export default Enemy;
