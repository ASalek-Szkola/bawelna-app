import React from 'react';
import waveConfig from './config/waveConfig.json';

const WaveManager = ({ wave, onStartWave, waveActive }) => {
  const waveData = waveConfig.waves[wave - 1];

  if (!waveData) {
    return <div className="wave-manager">Brak kolejnych fal</div>;
  }

  return (
    <div className="wave-manager">
      <h3>Fala {wave}</h3>
      <ul>
        {waveData.enemies.map((enemy, index) => (
          <li key={index}>
            {enemy.count} × {enemy.type}
          </li>
        ))}
      </ul>
      <p>Nagroda za ukończenie: {waveData.reward} monet</p>
      <button onClick={onStartWave} disabled={waveActive}>
        Rozpocznij falę
      </button>
    </div>
  );
};

export default WaveManager;
