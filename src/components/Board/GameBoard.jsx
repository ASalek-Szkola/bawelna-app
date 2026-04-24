// \components\Board\GameBoard.jsx
import { useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import Tower from './Tower';
import Enemy from './Enemy';
import towerConfig from '../../config/towerConfig.json';
import { isPointOnPath, isOverlappingTower } from '../../utils/pathUtils';
import GameImage from '../common/GameImage';
import { TOWER_SIZE } from '../../config/gameConstants';
import '../../styles/GameBoard.css';

const GameBoard = ({ 
  towers, 
  onTowerClick, 
  onBoardClick, 
  shopSelectedType,
  enemies = [],               
  selectedTower,              
  onBoardRightClick,         
  onTowerRightClick,
  scale = 1,
  mapData,
  altGraphics = false,
}) => {
  if (!mapData) return null;
  const { width, height } = mapData.board;
  const { path, pathWidth } = mapData;

  // Use ref + CSS vars for preview position to avoid re-renders on mouse move
  const previewRef = useRef(null);
  const previewPosRef = useRef(null);
  const validityRef = useRef(false);

  const updatePreviewValidity = useCallback((x, y) => {
    if (!shopSelectedType) return false;
    const onPath = isPointOnPath(x, y, path, pathWidth);
    const overlapping = towers.some(t => isOverlappingTower(x, y, t.x, t.y, TOWER_SIZE));
    return !onPath && !overlapping;
  }, [shopSelectedType, towers, path, pathWidth]);

  const handleBoardClick = (e) => {
    if (!onBoardClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / scale);
    const y = Math.round((e.clientY - rect.top) / scale);
    onBoardClick(x, y);
  };

  const handleMouseMove = (e) => {
    if (!shopSelectedType) {
      if (previewRef.current) previewRef.current.style.display = 'none';
      previewPosRef.current = null;
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / scale);
    const y = Math.round((e.clientY - rect.top) / scale);
    previewPosRef.current = { x, y };

    const isValid = updatePreviewValidity(x, y);
    validityRef.current = isValid;

    if (previewRef.current) {
      previewRef.current.style.display = 'block';
      previewRef.current.style.left = `${x}px`;
      previewRef.current.style.top = `${y}px`;
      previewRef.current.style.opacity = isValid ? '1' : '0.6';

      const ring = previewRef.current.querySelector('.preview-range-ring');
      if (ring) {
        ring.style.background = isValid ? 'var(--preview-valid-fill)' : 'var(--preview-invalid-fill)';
        ring.style.borderColor = isValid ? 'var(--preview-valid-border)' : 'var(--preview-invalid-border)';
      }
      const icon = previewRef.current.querySelector('.preview-validity-icon');
      if (icon) {
        icon.textContent = isValid ? '✓' : '✗';
        icon.style.color = isValid ? 'var(--preview-valid-border, #4caf50)' : 'var(--preview-invalid-border, #f44336)';
      }
      const img = previewRef.current.querySelector('img');
      if (img) {
        img.style.filter = isValid ? 'none' : 'grayscale(100%) brightness(0.5)';
      }
    }
  };

  const handleMouseLeave = () => {
    if (previewRef.current) previewRef.current.style.display = 'none';
    previewPosRef.current = null;
  };

  const pathD = path.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

  // Pre-compute preview data (only when shopSelectedType changes)
  const previewData = useMemo(() => {
    if (!shopSelectedType) return null;
    const towerData = towerConfig[shopSelectedType];
    const range = towerData?.levels?.[0]?.range ?? 100;
    return { towerData, range, diameter: range * 2 };
  }, [shopSelectedType]);

  return (
    <div
      className="game-board-inner"
      onClick={handleBoardClick}
      onContextMenu={(e) => {
        if (shopSelectedType) e.preventDefault(); 
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
          level={tower.level || 0}
          isShooting={tower.isShooting}
          onClick={() => onTowerClick && onTowerClick(tower.id)}
          onRightClick={() => onTowerRightClick && onTowerRightClick(tower.id)}
          isPlacingNewTower={!!shopSelectedType}
          altGraphics={altGraphics}
        />
      ))}

      {enemies.filter(enemy => enemy.health > 0).map((enemy) => (
        <Enemy key={enemy.id} type={enemy.type} position={enemy.position} health={enemy.health} spawned={enemy.spawned} />
      ))}

      {/* Tower placement preview — positioned via direct DOM manipulation, not state */}
      {previewData && (
        <div 
          ref={previewRef}
          style={{ 
            position: 'absolute', 
            left: 0, 
            top: 0, 
            pointerEvents: 'none', 
            transform: 'translate(-50%, -50%)', 
            zIndex: 18,
            display: 'none',
          }}
        >
          <div 
            className="preview-range-ring"
            style={{ 
              position: 'absolute', left: '50%', top: '50%', 
              transform: 'translate(-50%, -50%)', 
              width: `${previewData.diameter}px`, height: `${previewData.diameter}px`, 
              borderRadius: '50%', 
              background: 'var(--preview-valid-fill)', 
              border: '2px solid var(--preview-valid-border)', 
              boxSizing: 'border-box', zIndex: 0, pointerEvents: 'none' 
            }} 
          />
          <div style={{ width: `${TOWER_SIZE}px`, height: `${TOWER_SIZE}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, position: 'relative' }}>
            <GameImage 
              src={previewData.towerData?.image}
              alt="preview"
              altGraphics={altGraphics}
              size={TOWER_SIZE}
              style={{ opacity: 0.98 }}
            />
            <span 
              className="preview-validity-icon"
              style={{ 
                position: 'absolute', top: -8, right: -8, 
                fontSize: 16, fontWeight: 'bold', 
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                zIndex: 21,
              }}
              aria-hidden="true"
            >
              ✓
            </span>
          </div>
        </div>
      )}

      {selectedTower && selectedTower.x != null && selectedTower.y != null && (
        <>
          <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.45)', zIndex: 30, pointerEvents: 'none', transition: 'opacity 0.3s ease' }} />
          {(() => {
            const towerData = towerConfig[selectedTower.type];
            if (!towerData) return null;
            const lvl = Math.min(selectedTower.level, towerData.levels.length - 1);
            const range = towerData.levels[lvl].range ?? 100;
            const diameter = range * 2;
            const centerX = selectedTower.x + TOWER_SIZE / 2;
            const centerY = selectedTower.y + TOWER_SIZE / 2;

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
  selectedTower: PropTypes.object,
  onBoardRightClick: PropTypes.func,
  onTowerRightClick: PropTypes.func,
  scale: PropTypes.number,
  mapData: PropTypes.object,
  altGraphics: PropTypes.bool,
};

export default GameBoard;