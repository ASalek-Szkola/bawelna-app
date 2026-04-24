// \components\TowerPanel\TowerShop.tsx
import { memo } from 'react';
import towerConfigJson from '../../config/towerConfig.json';
import { useGameContext } from '../../context/GameContext';
import GameImage from '../common/GameImage';
import { TowerTypeConfig } from '../../types/game';
import '../../styles/TowerShop.css';

const towerConfig = towerConfigJson as Record<string, TowerTypeConfig>;

interface TowerShopProps {
  selectedType: string | null;
  onSelectType: (type: string) => void;
  altGraphics?: boolean;
}

const TowerShop = ({ selectedType, onSelectType, altGraphics = false }: TowerShopProps) => {
  const { money } = useGameContext();

  return (
    <div className="tower-shop panel">
      <h3>Sklep wieżyczek</h3>
      <div className="tower-shop-grid">
        {Object.entries(towerConfig).map(([type, data]) => {
          const level1 = data.levels[0];
          if (!level1) return null;
          const affordable = money >= level1.cost;
          const isSelected = selectedType === type;
          return (
            <div
              key={type}
              role="button"
              tabIndex={0}
              aria-label={`Wybierz ${type} wieżyczkę. Koszt ${level1.cost} `}
              className={`tower-card ${isSelected ? 'selected' : ''} ${!affordable ? 'disabled' : ''}`}
              onClick={() => { if (affordable) onSelectType(type); }}
              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && affordable) onSelectType(type); }}
            >
              <div className="cost-badge">{level1.cost} ₿</div>
              <GameImage
                src={data.image}
                alt={type}
                altGraphics={altGraphics}
                className="tower-card-image"
              />
              <div className="tower-name">{type.replace('-', ' ').toUpperCase()}</div>
              <div className="tower-stats">{`Dmg ${level1.damage} · Zas ${level1.range}`}</div>

              <div className="tooltip">
                <div className="tooltip-title">{type.replace('-', ' ').toUpperCase()}</div>
                <div>Damage: {level1.damage}</div>
                <div>Speed: {level1.fireRate}ms</div>
                <div>Range: {level1.range}</div>
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

export default memo(TowerShop);
