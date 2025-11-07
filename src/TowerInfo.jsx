import React, { useEffect, useState } from 'react';
import towerConfig from './config/towerConfig.json';

const TowerInfo = ({ type, level, onUpgrade, onSell, cooldown, onTargetingChange, targetingMode }) => {
  const [cooldownTime, setCooldownTime] = useState(cooldown);

  useEffect(() => {
    setCooldownTime(cooldown);
    if (cooldown > 0) {
      const interval = setInterval(() => {
        setCooldownTime((prev) => Math.max(0, prev - 100));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [cooldown]);

  const towerData = towerConfig[type];
  if (!towerData) return <p>Nieznany typ wieży</p>;

  const currentLevel = Math.min(level, towerData.levels.length - 1);
  const { range, damage, fireRate, cost } = towerData.levels[currentLevel];
  const nextLevel = towerData.levels[currentLevel + 1];

  // oblicz wartosc sprzedazy: polowa sumy kosztow od poziomu 1 do currentLevel+1
  const paidSum = towerData.levels
    .slice(0, currentLevel + 1)
    .reduce((s, lvl) => s + (lvl.cost || 0), 0);
  const sellValue = Math.floor(paidSum / 2);

  const handleToggleTargeting = () => {
    const newMode = targetingMode === 'first' ? 'strongest' : 'first';
    onTargetingChange(newMode);
  };

  return (
    <div className="tower-info">
      <h3>{type.replace('-', ' ').toUpperCase()}</h3>
      <img src={towerData.image} alt={`${type} tower`} style={{ width: '100px' }} />
      <ul>
        <li>Poziom: {currentLevel + 1}</li>
        <li>Zasięg: {range / 2}</li>
        <li>Obrażenia: {damage}</li>
        <li>Szybkostrzelność: {fireRate} ms</li>
        <li>Koszt ulepszenia: {nextLevel ? nextLevel.cost : 'Maksymalny poziom'}</li>
        <li>Cooldown: {cooldownTime > 0 ? `${(cooldownTime / 1000).toFixed(1)}s` : 'Gotowa do strzału'}</li>
      </ul>
      <div style={{ display: 'flex', gap: 8 }}>
        {nextLevel && <button onClick={onUpgrade}>Ulepsz</button>}
        <button onClick={onSell}>Sprzedaj (${sellValue})</button>
      </div>
      <div style={{ marginTop: 10 }}>
        <button
          onClick={handleToggleTargeting}
          style={{
            padding: '8px 12px',
            backgroundColor: targetingMode === 'first' ? '#4CAF50' : '#FF5722',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'background-color 0.3s',
          }}
        >
          {targetingMode === 'first' ? 'Pierwszy w zasięgu' : 'Najsilniejszy w zasięgu'}
        </button>
      </div>
    </div>
  );
};

export default TowerInfo;
