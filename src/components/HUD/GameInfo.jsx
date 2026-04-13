import React from 'react';
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

const StatLine = ({ label, value, Icon }) => (
  <div className="stat-line">
    <div className="stat-label">{label}</div>
    <div className="stat-value"><Icon /> <div className="stat-number">{value}</div></div>
  </div>
);

StatLine.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  Icon: PropTypes.func.isRequired,
};

const GameInfo = ({ health, wave, money, onCastNuke, spellCooldown = 0 }) => {
  return (
    <div className="game-info">
      <h3 className="game-info-title">Informacje o grze</h3>

      <div className="player-stats panel-sm">
        <StatLine label="Życie" value={health} Icon={IconHeart} />
        <StatLine label="Fala" value={wave} Icon={IconWave} />
        <StatLine label="Monety" value={money} Icon={IconCoin} />
      </div>
      <div className="skills-section panel-sm" style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
         <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--text-muted)' }}>Umiejętności</h4>
         <button 
            className="primary-btn" 
            style={{ width: '100%', fontSize: '13px', backgroundColor: spellCooldown > 0 || money < 500 ? 'var(--bg-mid)' : 'var(--primary-color)' }}
            onClick={onCastNuke}
            disabled={spellCooldown > 0 || money < 500}
         >
            Nuke (500) {spellCooldown > 0 ? `[${spellCooldown}s]` : ''}
         </button>
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
};

export default React.memo(GameInfo);
