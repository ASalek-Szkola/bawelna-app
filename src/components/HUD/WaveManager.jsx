// \components\HUD\WaveManager.jsx
import React from 'react';
import PropTypes from 'prop-types';
import enemyConfig from '../../config/enemyConfig.json';
import '../../styles/WaveManager.css';
import { generateSingleWaveData } from '../../utils/waveGenerator'; // Importuj tutaj

const WaveManager = ({ wave, onStartWave, waveActive, enemies = [], currentWaveData, difficulty, gameSpeed, onGameSpeedChange, isPaused, onPauseToggle }) => {
  const waveData = currentWaveData; // Używamy propa currentWaveData

  // Generuj dane dla następnej fali na potrzeby podglądu
  const nextWaveData = generateSingleWaveData(difficulty, wave + 1);

  if (!waveData) return <div className="wave-manager panel">Brak danych fali</div>;

  const computedTotal = waveData.enemies.reduce((s, e) => s + (e.count || 0), 0);
  const totalInWave = enemies && enemies.length ? (enemies[0]?.totalInWave || computedTotal) : computedTotal;

  const aliveCount = enemies.filter(e => e.health > 0 && !e.escaped).length;
  const percentComplete = totalInWave ? Math.round(((totalInWave - aliveCount) / totalInWave) * 100) : 0;

  return (
    <div className="wave-manager panel wave-control">
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
              <img src={enemyConfig[e.type]?.image} alt={e.type} className="enemy-img" onError={(ev) => { ev.target.style.display = 'none'; }} />
            </div>
          ))) : <div className="muted">Brak podglądu / Koniec fal</div>}
        </div>
      </div>

      <div className="wave-reward">
        <div className="reward-label">Nagroda</div>
        <div className="reward-value"><strong>{waveData.reward}</strong></div>
      </div>

      <div className="wave-actions">
        {waveActive && (
          <div className="speed-controls">
            <button className={`speed-btn ${isPaused ? 'active' : ''}`} onClick={onPauseToggle} title="Pauza">⏸</button>
            <button className={`speed-btn ${gameSpeed === 1 && !isPaused ? 'active' : ''}`} onClick={() => { onGameSpeedChange(1); if(isPaused) onPauseToggle(); }} title="x1">▶</button>
            <button className={`speed-btn ${gameSpeed === 2 && !isPaused ? 'active' : ''}`} onClick={() => { onGameSpeedChange(2); if(isPaused) onPauseToggle(); }} title="x2">▶▶</button>
            <button className={`speed-btn ${gameSpeed === 3 && !isPaused ? 'active' : ''}`} onClick={() => { onGameSpeedChange(3); if(isPaused) onPauseToggle(); }} title="x3">▶▶▶</button>
          </div>
        )}
        <button className="primary-btn" onClick={onStartWave} disabled={waveActive} aria-label={waveActive ? 'Fala trwa' : 'Rozpocznij falę'}>
          {waveActive ? 'Fala trwa' : 'Rozpocznij falę'}
        </button>
      </div>
    </div>
  );
};

WaveManager.propTypes = {
  wave: PropTypes.number.isRequired,
  onStartWave: PropTypes.func.isRequired,
  waveActive: PropTypes.bool,
  enemies: PropTypes.array,
  currentWaveData: PropTypes.object,
  difficulty: PropTypes.string.isRequired, // Dodano prop
  gameSpeed: PropTypes.number,
  onGameSpeedChange: PropTypes.func,
  isPaused: PropTypes.bool,
  onPauseToggle: PropTypes.func,
};

WaveManager.defaultProps = {
  enemies: [],
  waveActive: false,
  currentWaveData: { enemies: [], reward: 0 },
  gameSpeed: 1,
  isPaused: false,
};

export default React.memo(WaveManager);