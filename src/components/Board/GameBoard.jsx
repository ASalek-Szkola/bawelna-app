import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import Tower from './Tower';
import Enemy from './Enemy';
import mapConfig from '../../config/mapConfig.json';
import towerConfig from '../../config/towerConfig.json';
import { isPointOnPath, isOverlappingTower } from '../../utils/pathUtils';
import '../../styles/GameBoard.css';

const GameBoard = ({ 
  towers, 
  onTowerClick, 
  onBoardClick, 
  shopSelectedType, // Ten prop jest kluczowy dla trybu stawiania
  enemies =[],               
  onEnemyEscape,              
  selectedTower,              
  onBoardRightClick,         
  onTowerRightClick,
  scale = 1                   
}) => {
  const { width, height } = mapConfig.board;
  const { path, pathWidth } = mapConfig;

  const [previewPos, setPreviewPos] = useState(null);

  // Dynamiczne sprawdzanie poprawności miejsca dla podglądu
  const isPlacementValid = useMemo(() => {
    if (!previewPos || !shopSelectedType) return false;
    
    const TOWER_SIZE = 40; // Rozmiar wieży, zgodny z Tower.jsx i useTowers.js
    
    const onPath = isPointOnPath(previewPos.x, previewPos.y, path, pathWidth);
    const overlapping = towers.some(t => isOverlappingTower(previewPos.x, previewPos.y, t.x, t.y, TOWER_SIZE));
    
    return !onPath && !overlapping;
  }, [previewPos, shopSelectedType, towers, path, pathWidth]);


  const handleBoardClick = (e) => {
    // Jeśli shopSelectedType jest aktywne, to klikamy w celu postawienia
    // jeśli nie jest aktywne, to klikamy w celu odznaczenia wybranej wieży
    if (!onBoardClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / scale);
    const y = Math.round((e.clientY - rect.top) / scale);
    onBoardClick(x, y);
  };

  const handleMouseMove = (e) => {
    if (!shopSelectedType) {
      if (previewPos) setPreviewPos(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / scale);
    const y = Math.round((e.clientY - rect.top) / scale);
    setPreviewPos({ x, y });
  };

  const handleMouseLeave = () => {
    setPreviewPos(null);
  };

  const pathD = path.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

  return (
    <div
      className="game-board-inner"
      onClick={handleBoardClick}
      onContextMenu={(e) => {
        if (shopSelectedType) e.preventDefault(); // Zapobiegnij menu kontekstowemu, gdy próbujemy stawiać
        if (onBoardRightClick) onBoardRightClick();
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', zIndex: 0 }}>
        <path d={pathD} stroke="var(--path-color)" strokeWidth={pathWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85" />
      </svg>

      {towers.map((tower) => (
        <Tower
          key={tower.id} 
          x={tower.x} 
          y={tower.y} 
          type={tower.type} 
          isShooting={tower.isShooting}
          onClick={() => onTowerClick && onTowerClick(tower.id)}
          onRightClick={() => onTowerRightClick && onTowerRightClick(tower.id)}
          isPlacingNewTower={!!shopSelectedType} // Przekazujemy informację do Tower
        />
      ))}

      {enemies.filter(enemy => enemy.health > 0).map((enemy) => (
        <Enemy key={enemy.id} type={enemy.type} position={enemy.position} health={enemy.health} path={path} spawned={enemy.spawned} />
      ))}

      {shopSelectedType && previewPos && (
        (() => {
          const SIZE = 40;
          const towerData = towerConfig[shopSelectedType];
          const range = towerData?.levels?.[0]?.range ?? 100;
          const diameter = range * 2; 
          const ringColor = isPlacementValid ? 'var(--preview-valid-fill)' : 'var(--preview-invalid-fill)';
          const ringBorder = isPlacementValid ? 'var(--preview-valid-border)' : 'var(--preview-invalid-border)';

          return (
            <div 
              style={{ 
                position: 'absolute', 
                left: `${previewPos.x}px`, 
                top: `${previewPos.y}px`, 
                // Ważne: pointerEvents: 'none' jest nadal potrzebne, aby kliknięcie przeszło do GameBoard
                pointerEvents: 'none', 
                transform: 'translate(-50%, -50%)', 
                zIndex: 18,
                opacity: isPlacementValid ? 1 : 0.6 
              }}
            >
              <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: `${diameter}px`, height: `${diameter}px`, borderRadius: '50%', background: ringColor, border: `2px solid ${ringBorder}`, boxSizing: 'border-box', zIndex: 0, pointerEvents: 'none' }} />
              <div style={{ width: `${SIZE}px`, height: `${SIZE}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
                <img 
                  src={towerData?.image} 
                  alt="preview" 
                  style={{ 
                    width: SIZE, 
                    height: SIZE, 
                    display: 'block', 
                    opacity: 0.98,
                    filter: isPlacementValid ? 'none' : 'grayscale(100%) brightness(0.5)' 
                  }} 
                />
              </div>
            </div>
          );
        })()
      )}

      {selectedTower && selectedTower.x != null && selectedTower.y != null && (
        <>
          {/* Ciemne tło dla wybranej wieży - upewnij się, że ma odpowiedni zIndex */}
          <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.45)', zIndex: 30, pointerEvents: 'none', transition: 'opacity 0.3s ease' }} />
          {(() => {
            const SIZE = 40;
            const towerData = towerConfig[selectedTower.type];
            if (!towerData) return null;
            const lvl = Math.min(selectedTower.level, towerData.levels.length - 1);
            const range = towerData.levels[lvl].range ?? 100;
            const diameter = range * 2;
            const centerX = selectedTower.x + SIZE / 2;
            const centerY = selectedTower.y + SIZE / 2;

            return (
              <div key={`sel-${selectedTower.id}`} style={{ position: 'absolute', left: `${centerX}px`, top: `${centerY}px`, pointerEvents: 'none', transform: 'translate(-50%, -50%)', zIndex: 40 }}>
                <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: `${diameter}px`, height: `${diameter}px`, borderRadius: '50%', background: 'var(--range-fill)', border: `2px solid var(--range-border)`, boxSizing: 'border-box', pointerEvents: 'none' }} />
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
};

GameBoard.propTypes = {
  towers: PropTypes.array.isRequired,
  onTowerClick: PropTypes.func,
  onBoardClick: PropTypes.func,
  shopSelectedType: PropTypes.string,
  enemies: PropTypes.array,
  onEnemyEscape: PropTypes.func,
  selectedTower: PropTypes.object,
  onBoardRightClick: PropTypes.func,
  onTowerRightClick: PropTypes.func,
  scale: PropTypes.number,
};

GameBoard.defaultProps = {
  enemies: [],
  scale: 1,
};

export default GameBoard;