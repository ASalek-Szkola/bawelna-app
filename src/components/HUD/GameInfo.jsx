// \components\HUD\GameInfo.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import '../../styles/GameInfo.css';

const IconHeart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M12 21s-7-4.35-9-6.36C1.09 12.95 2 9.5 5 7.5 7 6 9 7 12 9c3-2 5-3 7-1.5 3 2 3.91 5.45 2 7.14C19 16.65 12 21 12 21z" fill="currentColor" />
  </svg>
);

const IconCoin = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.2" fill="none" />
    <path d="M10.5 9.5h3M10.5 14.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const IconWave = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M2 12c3-6 6 6 10 0s5 6 10 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const StatLine = ({ label, value, icon: IconComponent }) => (
  <div className="stat-line">
    <div className="stat-label">{label}</div>
    <div className="stat-value"><IconComponent /> <div className="stat-number">{value}</div></div>
  </div>
);

StatLine.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.func.isRequired,
};

const GameInfo = ({ health, wave, money, onCastNuke, spellCooldown = 0, nukeCost = 650, moneyLedger = [] }) => {
  const[ledgerExpanded, setLedgerExpanded] = useState(false);

  // Zawsze odwracamy, by najnowsze były na górze
  const reversedLedger = [...moneyLedger].reverse();
  // Jeśli zwinięte = max 2, w przeciwnym razie max 10
  const visibleCount = ledgerExpanded ? Math.min(10, reversedLedger.length) : 2;
  const displayedLedger = reversedLedger.slice(0, visibleCount);

  return (
    <div className="game-info">
      <h3 className="game-info-title">Informacje o grze</h3>

      <div className="player-stats panel-sm">
        <StatLine label="Życie" value={health} icon={IconHeart} />
        <StatLine label="Fala" value={wave} icon={IconWave} />
        <StatLine label="Monety" value={money} icon={IconCoin} />
      </div>
      
      <div className="skills-section panel-sm" style={{ marginTop: '12px' }}>
         <h4 className="section-subtitle">Umiejętności</h4>
         <button 
            className="nuke-btn" 
            onClick={onCastNuke}
            disabled={spellCooldown > 0 || money < nukeCost}
         >
            Nuke ({nukeCost}) {spellCooldown > 0 ? `[${spellCooldown}s]` : ''}
         </button>
      </div>

      <div className="ledger-section panel-sm" style={{ marginTop: '12px' }}>
        <h4 className="ledger-title">
          Źródła monet
          {reversedLedger.length > 2 && (
            <button 
              className="ledger-expand-btn" 
              onClick={() => setLedgerExpanded(!ledgerExpanded)}
            >
              {ledgerExpanded ? 'Zwiń' : 'Rozwiń'}
            </button>
          )}
        </h4>
        {displayedLedger.length === 0 ? (
          <div className="ledger-empty">Brak transakcji</div>
        ) : (
          displayedLedger.map((entry) => (
            <div key={entry.id} className="ledger-row">
              <span className="ledger-label">{entry.label}</span>
              <span className={`ledger-amount ${entry.amount >= 0 ? 'ledger-amount--gain' : 'ledger-amount--cost'}`}>
                {entry.amount >= 0 ? '+' : ''}{entry.amount}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

GameInfo.propTypes = {
  health: PropTypes.number.isRequired,
  wave: PropTypes.number.isRequired,
  money: PropTypes.number.isRequired,
  onCastNuke: PropTypes.func,
  spellCooldown: PropTypes.number,
  nukeCost: PropTypes.number,
  moneyLedger: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    label: PropTypes.string,
    amount: PropTypes.number,
  })),
};

export default React.memo(GameInfo);