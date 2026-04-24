// \components\HUD\WaveManager.tsx
import { memo } from 'react';
import enemyConfigJson from '../../config/enemyConfig.json';
import { resolveConfiguredAssetPath } from '../../utils/assetUtils';
import { Enemy, WaveData, EnemyTypeConfig } from '../../types/game';
import '../../styles/WaveManager.css';

const enemyConfig = enemyConfigJson as Record<string, EnemyTypeConfig>;

interface WaveManagerProps {
  wave: number;
  onStartWave: () => void;
  waveActive: boolean;
  enemies?: Enemy[];
  currentWaveData: WaveData;
  nextWaveData: WaveData;
  gameSpeed: number;
  onGameSpeedChange: (speed: number) => void;
  isPaused: boolean;
  onPauseToggle: () => void;
  autoStartNextWave: boolean;
  onAutoStartChange: (auto: boolean) => void;
  gameOver?: boolean;
  farmIncome?: number;
}

const WaveManager = ({ 
  wave, 
  onStartWave, 
  waveActive, 
  enemies = [], 
  currentWaveData, 
  nextWaveData, 
  gameSpeed, 
  onGameSpeedChange, 
  isPaused, 
  onPauseToggle, 
  autoStartNextWave, 
  onAutoStartChange, 
  gameOver = false, 
  farmIncome = 0 
}: WaveManagerProps) => {
  const waveData = currentWaveData;

  if (!waveData) return <div className="wave-manager panel">Brak danych fali</div>;

  const computedTotal = waveData.enemies.reduce((s, e) => s + (e.count || 0), 0);
  const totalInWave = enemies && enemies.length ? (enemies[0]?.totalInWave || computedTotal) : computedTotal;

  const aliveCount = enemies.filter(e => e.health > 0).length;
  const percentComplete = totalInWave ? Math.round(((totalInWave - aliveCount) / totalInWave) * 100) : 0;
  const totalReward = waveData.reward + farmIncome;

  return (
    <>
      <div className="panel wave-section top-section">
        <h3 className="wave-title">Fala {wave}</h3>

        <div className="wave-progress">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${percentComplete}%` }} />
          </div>
          <div className="progress-label">{percentComplete}% ukończono</div>
        </div>

        <div className="wave-upcoming">
          <div className="upcoming-label">Nadchodzące:</div>
          <div className="upcoming-list">
            {nextWaveData && nextWaveData.enemies && nextWaveData.enemies.length > 0 ? nextWaveData.enemies.flatMap(e => {
              const items = Array.from({ length: Math.min(e.count, 6) });
              return items.map((_, i) => {
                const config = enemyConfig[e.type];
                return (
                  <div key={`${e.type}-${i}`} className="enemy-tile">
                    <img 
                      src={resolveConfiguredAssetPath(config?.image || '')} 
                      alt={e.type} 
                      className="enemy-img" 
                      onError={(ev) => { (ev.target as HTMLImageElement).style.display = 'none'; }} 
                    />
                  </div>
                );
              });
            }) : <div className="muted">Brak podglądu / Koniec fal</div>}
          </div>
        </div>

        <div className="wave-reward">
          <div className="reward-label">Nagroda (Baza + Farmy)</div>
          <div className="reward-value"><strong>{totalReward}</strong></div>
        </div>
      </div>

      <div className="panel wave-section bottom-section">
        <div className="wave-actions">
          <div className="settings-section auto-start-section">
            <label>Automatycznie rozpocznij następną falę</label>
            <div className="toggle-row">
              <button
                id="auto-start-toggle"
                role="switch"
                aria-checked={autoStartNextWave}
                className={`pill-toggle ${autoStartNextWave ? 'pill-toggle--on' : ''}`}
                onClick={() => onAutoStartChange(!autoStartNextWave)}
                title={autoStartNextWave ? 'Wyłącz automatyczne rozpoczęcie' : 'Włącz automatyczne rozpoczęcie'}
              >
                <span className="pill-toggle__thumb" />
              </button>
              <span className="toggle-label-hint">{autoStartNextWave ? 'Włączone' : 'Wyłączone'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="panel wave-section actions-section">
        <div className="wave-actions">
          <button className="primary-btn" onClick={onStartWave} disabled={waveActive || gameOver} aria-label={waveActive ? 'Fala trwa' : (gameOver ? 'Przegrana' : 'Rozpocznij falę')}>
            {waveActive ? 'Fala trwa' : (gameOver ? 'Przegrana' : 'Rozpocznij falę')}
          </button>

          {waveActive && (
            <div className="speed-controls speed-controls--below">
              <button className={`speed-btn ${isPaused ? 'active' : ''}`} onClick={onPauseToggle} title="Pauza">⏸</button>
              <button className={`speed-btn ${gameSpeed === 1 && !isPaused ? 'active' : ''}`} onClick={() => { onGameSpeedChange(1); if(isPaused) onPauseToggle(); }} title="x1">▶</button>
              <button className={`speed-btn ${gameSpeed === 2 && !isPaused ? 'active' : ''}`} onClick={() => { onGameSpeedChange(2); if(isPaused) onPauseToggle(); }} title="x2">▶▶</button>
              <button className={`speed-btn ${gameSpeed === 3 && !isPaused ? 'active' : ''}`} onClick={() => { onGameSpeedChange(3); if(isPaused) onPauseToggle(); }} title="x3">▶▶▶</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default memo(WaveManager);
