// \components\Board\Tower.jsx
import React from 'react';
import PropTypes from 'prop-types';
import towerConfig from '../../config/towerConfig.json';
import '../../styles/Tower.css';

const Tower = ({ x, y, type, level, onClick, isShooting, onRightClick, isPlacingNewTower }) => { 
  const towerData = towerConfig[type];
  if (!towerData) return null;

  const SIZE = 40;
  return (
    <div
      className={`tower tower-lvl-${level} ${isShooting ? 'tower-shooting' : ''}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        position: 'absolute',
        width: `${SIZE}px`,
        height: `${SIZE}px`,
        cursor: isPlacingNewTower ? 'default' : 'pointer', 
      }}
      onClick={(e) => {
        // Ważne: Zawsze zatrzymaj propagację, aby kliknięcie nie przebiło się do GameBoard
        e.stopPropagation(); 
        if (isPlacingNewTower) { 
          // Jeśli jesteśmy w trybie stawiania nowej wieży, 
          // całkowicie ignoruj to kliknięcie. Nie zaznaczaj starej wieży.
          return; 
        }
        // Jeśli nie jesteśmy w trybie stawiania, wtedy normalnie wywołaj onClick (zaznaczenie wieży).
        onClick && onClick();
      }}
      onContextMenu={(e) => {
        // Ważne: Zawsze zapobiegnij domyślnemu menu kontekstowemu przeglądarki
        e.preventDefault(); 
        // Ważne: Zawsze zatrzymaj propagację
        e.stopPropagation(); 
        if (isPlacingNewTower) { 
          // Jeśli jesteśmy w trybie stawiania nowej wieży, 
          // całkowicie ignoruj prawy klik.
          return;
        }
        // Jeśli nie jesteśmy w trybie stawiania, wtedy normalnie wywołaj onRightClick (sprzedaż/ulepszanie).
        onRightClick && onRightClick();
      }}
      aria-label={`WieĹĽyczka ${type}`}
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
  level: PropTypes.number,
  onClick: PropTypes.func,
  isShooting: PropTypes.bool,
  onRightClick: PropTypes.func,
  isPlacingNewTower: PropTypes.bool,
};

Tower.defaultProps = {
  isShooting: false,
  isPlacingNewTower: false,
  level: 0,
};

function areEqual(prev, next) {
  return prev.x === next.x && 
         prev.y === next.y && 
         prev.type === next.type && 
         prev.level === next.level &&
         prev.isShooting === next.isShooting &&
         prev.isPlacingNewTower === next.isPlacingNewTower; 
}

export default React.memo(Tower, areEqual);