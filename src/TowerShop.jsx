import React from 'react';
import towerConfig from './config/towerConfig.json';

const TowerShop = ({ money, selectedType, onSelectType }) => {
  return (
    <div className="tower-shop" style={{ padding: 16, width: 240 }}>
      <h3>Sklep wieżyczek</h3>
      <div style={{ display: 'grid', gap: 12 }}>
        {Object.entries(towerConfig).map(([type, data]) => {
          const level1 = data.levels[0];
          const affordable = money >= level1.cost;
          return (
            <div
              key={type}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: 8,
                border: selectedType === type ? '2px solid #646cff' : '1px solid #ccc',
                opacity: affordable ? 1 : 0.5,
                cursor: affordable ? 'pointer' : 'not-allowed',
                borderRadius: 6,
                background: selectedType === type ? '#eef' : '#fff'
              }}
              onClick={() => {
                if (!affordable) return;
                onSelectType(type);
              }}
            >
              <img src={data.image} alt={type} style={{ width: 48, height: 48 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{type.replace('-', ' ').toUpperCase()}</div>
                <div>Poziom 1: {level1.damage} dmg · zasięg {level1.range}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700 }}>{level1.cost} ₿</div>
                <div style={{ fontSize: 12 }}>Kup</div>
              </div>
            </div>
          );
        })}
      </div>
      <p style={{ marginTop: 10, fontSize: 13 }}>
        Wybierz wieżyczkę, a następnie kliknij planszę, aby ją postawić (nie można na ścieżce).
      </p>
    </div>
  );
};

export default TowerShop;