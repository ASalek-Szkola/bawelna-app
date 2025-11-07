import React from 'react';

const GameInfo = ({ health, wave, money }) => {
  return (
    <div className="game-info">
      <h2>Informacje o grze</h2>
      <p>❤ Życie: {health}</p>
      <p>Fala: {wave}</p>
      <p>Monety: {money}</p>
    </div>
  );
};

export default GameInfo;
