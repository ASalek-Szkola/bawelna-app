// \components\HUD\WaveManager.jsx
import { memo } from 'react';
import PropTypes from 'prop-types';
import enemyConfig from '../../config/enemyConfig.json';
import { resolveConfiguredAssetPath } from '../../utils/assetUtils';
import '../../styles/WaveManager.css';

const WaveManager = ({ wave, onStartWave, waveActive, enemies =[], currentWaveData, nextWaveData, gameSpeed, onGameSpeedChange, isPaused, onPauseToggle, autoStartNextWave, onAutoStartChange, gameOver = false, farmIncome = 0 }) => {
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
            {nextWaveData && nextWaveData.enemies && nextWaveData.enemies.length > 0 ? nextWaveData.enemies.flatMap(e => Array.from({ length: Math.min(e.count, 6) }).map((_, i) => (
              <div key={`${e.type}-${i}`} className="enemy-tile">
                <img src={resolveConfiguredAssetPath(enemyConfig[e.type]?.image)} alt={e.type} className="enemy-img" onError={(ev) => { ev.target.style.display = 'none'; }} />
              </div>
            ))) : <div className="muted">Brak podglądu / Koniec fal</div>}
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

WaveManager.propTypes = {
  wave: PropTypes.number.isRequired,
  onStartWave: PropTypes.func.isRequired,
  waveActive: PropTypes.bool,
  enemies: PropTypes.array,
  currentWaveData: PropTypes.object,
  nextWaveData: PropTypes.object,
  gameSpeed: PropTypes.number,
  onGameSpeedChange: PropTypes.func,
  isPaused: PropTypes.bool,
  onPauseToggle: PropTypes.func,
  autoStartNextWave: PropTypes.bool,
  onAutoStartChange: PropTypes.func,
  gameOver: PropTypes.bool,
  farmIncome: PropTypes.number,
};

WaveManager.defaultProps = {
  enemies: [],
  waveActive: false,
  currentWaveData: { enemies:[], reward: 0 },
  nextWaveData: { enemies:[], reward: 0 },
  gameSpeed: 1,
  isPaused: false,
  autoStartNextWave: false,
  onAutoStartChange: () => {},
  gameOver: false,
  farmIncome: 0,
};

export default memo(WaveManager);