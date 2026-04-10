import React from 'react';
import Tower from './Tower';
import Enemy from './Enemy';
import mapConfig from './config/mapConfig.json';
import towerConfig from './config/towerConfig.json';

const GameBoard = ({ 
  towers, 
  onTowerClick, 
  onBoardClick, 
  shopSelectedType, 
  previewPos, 
  previewValid, 
  onBoardMouseMove,
  enemies = [],               // <- nowy prop
  onEnemyEscape,              // <- handler przekazany z App
  selectedTower,              // <- optional: tower object currently selected in App
  onBoardRightClick,          // right-click on empty board (cancel placement / deselect)
  onTowerRightClick           // right-click on a placed tower (sell)
}) => {
  const { width, height } = mapConfig.board;
  const { path, pathWidth } = mapConfig;

  const handleBoardClick = (e) => {
    if (!onBoardClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    onBoardClick(x, y);
  };

  const handleMouseMove = (e) => {
    if (!onBoardMouseMove) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    onBoardMouseMove(x, y);
  };

  // zbuduj ścieżkę SVG z punktów
  const pathD = path.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

  return (
    <div
      className="game-board"
      onClick={handleBoardClick}
      onContextMenu={(e) => {
        // Right-click on board: if placing a tower cancel placement, otherwise deselect
        if (shopSelectedType) e.preventDefault();
        if (onBoardRightClick) onBoardRightClick();
      }}
      onMouseMove={handleMouseMove}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: 'var(--bg-panel)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* SVG jako tło ścieżki (ładniejsze rysowanie, obsługuje ukośne segmenty) */}
      <svg
        width={width}
        height={height}
        style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', zIndex: 0 }}
      >
        <path
          d={pathD}
          stroke="var(--path-color)"
          strokeWidth={pathWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.85"
        />
      </svg>

      {/* Renderowanie wież */}
      {towers.map((tower) => (
        <Tower
          key={tower.id}
          x={tower.x}
          y={tower.y}
          type={tower.type}
          isShooting={tower.isShooting}
          onClick={() => onTowerClick && onTowerClick(tower.id)}
          onRightClick={() => onTowerRightClick && onTowerRightClick(tower.id)}
        />
      ))}

      {/* Renderowanie przeciwników WEWNĄTRZ GameBoard - dzięki temu pozycje są względem planszy */}
      {enemies
        .filter(enemy => enemy.health > 0) // Only render alive enemies
        .map((enemy) => (
          <Enemy
            key={enemy.id}
            type={enemy.type}
            position={enemy.position}
            health={enemy.health}
            path={path}
            spawned={enemy.spawned}
          />
      ))}

      {/* Podgląd wybranej wieżyczki pod kursorem */}
      {shopSelectedType && previewPos && (
        (() => {
          const SIZE = 40;
          const towerData = towerConfig[shopSelectedType];
          const range = towerData?.levels?.[0]?.range ?? 100; // range is radius
          const diameter = range * 2; // Diameter = range * 2
          const ringColor = previewValid ? 'var(--preview-valid-fill)' : 'var(--preview-invalid-fill)';
          const ringBorder = previewValid ? 'var(--preview-valid-border)' : 'var(--preview-invalid-border)';

          return (
            <div style={{ position: 'absolute', left: `${previewPos.x}px`, top: `${previewPos.y}px`, pointerEvents: 'none', transform: 'translate(-50%, -50%)', zIndex: 18 }}>
              {/* Range circle */}
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: `${diameter}px`,
                  height: `${diameter}px`,
                  borderRadius: '50%',
                  background: ringColor,
                  border: `2px solid ${ringBorder}`,
                  boxSizing: 'border-box',
                  zIndex: 0,
                  pointerEvents: 'none'
                }}
              />

              {/* Tower preview icon on top */}
              <div
                style={{
                  width: `${SIZE}px`,
                  height: `${SIZE}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 20,
                }}
              >
                <img
                  src={towerData?.image}
                  alt="preview-tower"
                  style={{
                    width: SIZE,
                    height: SIZE,
                    display: 'block',
                    opacity: previewValid ? 0.98 : 0.85,
                    filter: previewValid ? 'drop-shadow(0 0 6px var(--preview-valid-border))' : 'drop-shadow(0 0 6px var(--preview-invalid-border))'
                  }}
                />
              </div>
            </div>
          );
        })()
      )}

      {/* Dim overlay when a tower is selected — highlight only the tower's range */}
      {selectedTower && selectedTower.x != null && selectedTower.y != null && (
        <>
          <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.45)', zIndex: 30, pointerEvents: 'none', transition: 'opacity 0.3s ease' }} />

          {(() => {
            const SIZE = 40; // must match Tower size
            const towerData = towerConfig[selectedTower.type];
            if (!towerData) return null;
            const lvl = Math.min(selectedTower.level, towerData.levels.length - 1);
            const range = towerData.levels[lvl].range ?? 100;
            const diameter = range * 2; // range is radius -> diameter = range*2
            const centerX = selectedTower.x + SIZE / 2;
            const centerY = selectedTower.y + SIZE / 2;

            return (
              <div key={`sel-${selectedTower.id}`} style={{ position: 'absolute', left: `${centerX}px`, top: `${centerY}px`, pointerEvents: 'none', transform: 'translate(-50%, -50%)', zIndex: 40 }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: `${diameter}px`,
                    height: `${diameter}px`,
                    borderRadius: '50%',
                    background: 'var(--range-fill)',
                    border: `2px solid var(--range-border)`,
                    boxSizing: 'border-box',
                    zIndex: 40,
                    pointerEvents: 'none'
                  }}
                />
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
};

export default GameBoard;
