// \components\Board\Enemy.tsx
import { memo } from 'react';
import enemyConfigJson from '../../config/enemyConfig.json';
import { ENEMY_SIZE } from '../../config/gameConstants';
import { EnemyTypeConfig, Position } from '../../types/game';
import '../../styles/Enemy.css';

const enemyConfig = enemyConfigJson as Record<string, EnemyTypeConfig>;

interface EnemyProps {
  type: string;
  position: Position | null;
  health: number;
  spawned: boolean;
}

const EnemyComponent = ({ type, position, health, spawned }: EnemyProps) => {
  const enemyData = enemyConfig[type];
  if (!enemyData) return null;

  if (!spawned || !position || health <= 0) return null;

  const SIZE = ENEMY_SIZE;

  const maxHealth = enemyData.health;
  const healthPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));

  return (
    <div
      className={`enemy enemy-${type}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${SIZE}px`,
        height: `${SIZE}px`,
        position: 'absolute',
      }}
    >
      {healthPercent > 0 && (
        <div 
          className="enemy-bar-bg" 
          role="progressbar" 
          aria-valuenow={health} 
          aria-valuemin={0} 
          aria-valuemax={maxHealth} 
          aria-label={`Zdrowie ${type}: ${Math.round(healthPercent)}%`}
        >
          <div 
            className="enemy-bar-fill" 
            style={{ 
              width: `${healthPercent}%`, 
              backgroundColor: healthPercent > 50 ? 'var(--enemy-health-high)' : healthPercent > 20 ? 'var(--enemy-health-mid)' : 'var(--enemy-health-low)' 
            }} 
          />
        </div>
      )}
    </div>
  );
};

function areEqual(prev: EnemyProps, next: EnemyProps) {
  return prev.type === next.type && 
         prev.position?.x === next.position?.x && 
         prev.position?.y === next.position?.y && 
         prev.health === next.health && 
         prev.spawned === next.spawned;
}

export default memo(EnemyComponent, areEqual);
