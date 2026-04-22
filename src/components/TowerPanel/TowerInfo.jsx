import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import towerConfig from '../../config/towerConfig.json';
import { resolveConfiguredAssetPath } from '../../utils/assetUtils';
import '../../styles/TowerInfo.css';

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
  const current = towerData.levels[currentLevel] || {};
  const next = towerData.levels[currentLevel + 1] || null;

  const paidSum = towerData.levels
    .slice(0, currentLevel + 1)
    .reduce((s, lvl) => s + (lvl.cost || 0), 0);
  const sellValue = Math.floor(paidSum / 2);

  const handleToggleTargeting = () => {
    const newMode = targetingMode === 'first' ? 'strongest' : 'first';
    onTargetingChange(newMode);
  };

  const statRow = (label, curVal, nextVal, suffix = '') => {
    const improved = nextVal != null && nextVal > curVal;
    return (
      <div className="stat-row" key={label}>
        <div className="stat-label">{label}</div>
        <div className="stat-value">
          <span className="stat-current">{`${curVal ?? '-'}${suffix}`}</span>
          {nextVal != null ? (
            <span className={"stat-next" + (improved ? ' improved' : '')}>
              &nbsp;→&nbsp;{`${nextVal}${suffix}`}
            </span>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="tower-info panel">
      <h3 className="tower-title">{type.replace('-', ' ').toUpperCase()}</h3>
      <div className="tower-top">
        <img src={resolveConfiguredAssetPath(towerData.image)} alt={`${type} tower`} className="tower-image" />
        <div className="tower-stats">
          {statRow('Damage', current.damage, next?.damage)}
          {statRow('Range', current.range, next?.range)}
          {statRow('Fire rate (ms)', current.fireRate, next?.fireRate, ' ms')}
          {statRow('Upgrade cost', current.cost, next?.cost, ' ₿')}

          <div className="cooldown">Cooldown: {cooldownTime > 0 ? `${(cooldownTime / 1000).toFixed(1)}s` : 'Gotowa do strzału'}</div>
        </div>
      </div>

      <div className="tower-actions">
        {next && <button className="tower-btn" onClick={onUpgrade} aria-label={`Ulepsz wieżę za ${next.cost} ₿`}>Ulepsz ({next.cost} ₿)</button>}
        <button className="tower-btn" onClick={onSell} aria-label={`Sprzedaj wieżę za ${sellValue} ₿`}>Sprzedaj ({sellValue} ₿)</button>
        <button
          className={"tower-btn target-btn" + (targetingMode === 'first' ? ' selected' : '')}
          onClick={handleToggleTargeting}
          aria-pressed={targetingMode === 'first'}
          aria-label="Zmień tryb celowania"
        >
          {targetingMode === 'first' ? 'Pierwszy' : 'Najsilniejszy'}
        </button>
      </div>
    </div>
  );
};

TowerInfo.propTypes = {
  type: PropTypes.string.isRequired,
  level: PropTypes.number.isRequired,
  onUpgrade: PropTypes.func.isRequired,
  onSell: PropTypes.func.isRequired,
  cooldown: PropTypes.number,
  onTargetingChange: PropTypes.func.isRequired,
  targetingMode: PropTypes.string,
};

TowerInfo.defaultProps = {
  cooldown: 0,
  targetingMode: 'first',
};

export default React.memo(TowerInfo);
