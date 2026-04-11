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

const GameInfo = ({ health, wave, money }) => {
  return (
    <div className="game-info">
      <h3 className="game-info-title">Informacje o grze</h3>

      <div className="player-stats panel-sm">
        <StatLine label="Życie" value={health} Icon={IconHeart} />
        <StatLine label="Fala" value={wave} Icon={IconWave} />
        <StatLine label="Monety" value={money} Icon={IconCoin} />
      </div>
    </div>
  );
};

GameInfo.propTypes = {
  health: PropTypes.number.isRequired,
  wave: PropTypes.number.isRequired,
  money: PropTypes.number.isRequired,
};

export default React.memo(GameInfo);
