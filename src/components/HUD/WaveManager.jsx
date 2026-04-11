import React from 'react';
import PropTypes from 'prop-types';
import waveConfig from '../../config/waveConfig.json';
import enemyConfig from '../../config/enemyConfig.json';
import '../../styles/WaveManager.css';

const WaveManager = ({ wave, onStartWave, waveActive, enemies = [] }) => {
  const waveData = waveConfig.waves[wave - 1];
  if (!waveData) return <div className="wave-manager panel">Brak kolejnych fal</div>;

  const computedTotal = waveData.enemies.reduce((s, e) => s + (e.count || 0), 0);
  const totalInWave = enemies && enemies.length ? (enemies[0]?.totalInWave || computedTotal) : computedTotal;

  const aliveCount = enemies.filter(e => e.health > 0 && !e.escaped).length;
  const percentComplete = totalInWave ? Math.round(((totalInWave - aliveCount) / totalInWave) * 100) : 0;

  const nextWave = waveConfig.waves[wave];

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
          {nextWave ? nextWave.enemies.flatMap(e => Array.from({ length: Math.min(e.count, 6) }).map((_, i) => (
            <div key={`${e.type}-${i}`} className="enemy-tile">
              <img src={enemyConfig[e.type]?.image} alt={e.type} className="enemy-img" onError={(ev) => { ev.target.style.display = 'none'; }} />
            </div>
          ))) : <div className="muted">Brak podglądu</div>}
        </div>
      </div>

      <div className="wave-reward">
        <div className="reward-label">Nagroda</div>
        <div className="reward-value"><strong>{waveData.reward} ₿</strong></div>
      </div>

      <div className="wave-actions">
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
};

WaveManager.defaultProps = {
  enemies: [],
  waveActive: false,
};

export default React.memo(WaveManager);
