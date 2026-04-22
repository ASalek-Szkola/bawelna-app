import React from 'react';
import PropTypes from 'prop-types';
import towerConfig from '../../config/towerConfig.json';
import { resolveConfiguredAssetPath, resolveConfiguredAssetPathWithAlt } from '../../utils/assetUtils';
import '../../styles/TowerShop.css';

const TowerShop = ({ money, selectedType, onSelectType, altGraphics = false }) => {
  return (
    <div className="tower-shop panel">
      <h3>Sklep wieżyczek</h3>
      <div className="tower-shop-grid">
        {Object.entries(towerConfig).map(([type, data]) => {
          const level1 = data.levels[0] || {};
          const affordable = money >= (level1.cost || 0);
          const isSelected = selectedType === type;
          return (
            <div
              key={type}
              role="button"
              tabIndex={0}
              aria-label={`Wybierz ${type} wieżyczkę. Koszt ${level1.cost ?? '-'} `}
              className={`tower-card ${isSelected ? 'selected' : ''} ${!affordable ? 'disabled' : ''}`}
              onClick={() => { if (affordable) onSelectType(type); }}
              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && affordable) onSelectType(type); }}
            >
              <div className="cost-badge">{level1.cost ?? '-'} ₿</div>
              <img
                src={resolveConfiguredAssetPathWithAlt(data.image, altGraphics)}
                alt={type}
                className="tower-card-image"
                onError={(e) => {
                  const fallback = resolveConfiguredAssetPath(data.image);
                  if (e.currentTarget.src !== fallback) {
                    e.currentTarget.src = fallback;
                    return;
                  }
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="tower-name">{type.replace('-', ' ').toUpperCase()}</div>
              <div className="tower-stats">{`Dmg ${level1.damage ?? '-'} · Zas ${level1.range ?? '-'}`}</div>

              <div className="tooltip">
                <div className="tooltip-title">{type.replace('-', ' ').toUpperCase()}</div>
                <div>Damage: {level1.damage ?? '-'}</div>
                <div>Speed: {level1.fireRate ?? '-'}</div>
                <div>Range: {level1.range ?? '-'}</div>
                <div className="tooltip-footer">Kliknij, aby wybrać</div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="shop-instructions">
        Wybierz wieżyczkę, a następnie kliknij planszę, aby ją postawić (nie można na ścieżce).
      </p>
    </div>
  );
};

TowerShop.propTypes = {
  money: PropTypes.number.isRequired,
  selectedType: PropTypes.string,
  onSelectType: PropTypes.func.isRequired,
  altGraphics: PropTypes.bool,
};

TowerShop.defaultProps = {
  selectedType: null,
};

export default React.memo(TowerShop);
