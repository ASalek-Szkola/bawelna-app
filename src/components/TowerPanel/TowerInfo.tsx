// \components\TowerPanel\TowerInfo.tsx
import { useEffect, useState, useRef } from 'react';
import towerConfigJson from '../../config/towerConfig.json';
import { resolveConfiguredAssetPath } from '../../utils/assetUtils';
import { TowerTypeConfig, TargetingMode } from '../../types/game';
import '../../styles/TowerInfo.css';

const towerConfig = towerConfigJson as Record<string, TowerTypeConfig>;

interface TowerInfoProps {
  type: string;
  level: number;
  onUpgrade: () => void;
  onSell: () => void;
  cooldown: number;
  onTargetingChange: (mode: TargetingMode) => void;
  targetingMode: TargetingMode;
}

const TowerInfo = ({ 
  type, 
  level, 
  onUpgrade, 
  onSell, 
  cooldown, 
  onTargetingChange, 
  targetingMode 
}: TowerInfoProps) => {
  const [cooldownTime, setCooldownTime] = useState(cooldown);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setCooldownTime(cooldown);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (cooldown > 0) {
      intervalRef.current = setInterval(() => {
        setCooldownTime((prev) => {
          const next = Math.max(0, prev - 100);
          if (next <= 0 && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return next;
        });
      }, 100);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [cooldown]);

  const towerData = towerConfig[type];
  if (!towerData) return <div className="tower-info panel">Błąd danych wieży: {type}</div>;

  const currentLevelData = towerData.levels[level];
  const nextLevelData = towerData.levels[level + 1];

  const maxLevel = towerData.levels.length - 1;
  const cooldownPercent = currentLevelData.fireRate ? (cooldownTime / currentLevelData.fireRate) * 100 : 0;

  return (
    <div className="tower-info panel">
      <h3>Informacje o wieży</h3>
      <div className="tower-info-header">
         <img src={resolveConfiguredAssetPath(towerData.image)} alt={type} className="tower-info-img" />
         <div>
            <div className="tower-info-type">{type.toUpperCase()}</div>
            <div className="tower-info-level">Poziom {level + 1} / {maxLevel + 1}</div>
         </div>
      </div>

      <div className="tower-stats-grid">
        <div className="stat-box">
          <div className="stat-label">OBRAŻENIA</div>
          <div className="stat-val">{currentLevelData.damage}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">ZASIĘG</div>
          <div className="stat-val">{currentLevelData.range}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">SZYBKOŚĆ</div>
          <div className="stat-val">{currentLevelData.fireRate}ms</div>
        </div>
      </div>

      <div className="cooldown-area">
        <div className="stat-label">COOLDOWN</div>
        <div className="cooldown-bar">
          <div className="cooldown-fill" style={{ width: `${cooldownPercent}%` }} />
        </div>
      </div>

      <div className="targeting-section">
        <div className="stat-label">PRIORYTET ATAKU</div>
        <div className="targeting-buttons">
          <button 
            className={`targeting-btn ${targetingMode === 'first' ? 'active' : ''}`}
            onClick={() => onTargetingChange('first')}
          >
            Pierwszy
          </button>
          <button 
            className={`targeting-btn ${targetingMode === 'strongest' ? 'active' : ''}`}
            onClick={() => onTargetingChange('strongest')}
          >
            Najsilniejszy
          </button>
        </div>
      </div>

      <div className="tower-actions">
        {nextLevelData ? (
          <button className="upgrade-btn" onClick={onUpgrade}>
            Ulepsz (+{nextLevelData.cost} ₿)
          </button>
        ) : (
          <button className="upgrade-btn disabled" disabled>MAKS. POZIOM</button>
        )}
        <button className="sell-btn" onClick={onSell}>Sprzedaj</button>
      </div>
    </div>
  );
};

export default TowerInfo;
