// \context\GameContext.jsx — Context for slow-changing game state
import { createContext, useContext } from 'react';

const GameContext = createContext(null);

/**
 * Provider for game-wide state that changes infrequently:
 * money, health, wave, moneyLedger, applyMoneyDelta, gameSpeed, isPaused, isGameOver.
 *
 * NOTE: enemies and towers are NOT included here — they change ~30x/s
 * and would cause cascading re-renders through Context.
 */
export function GameProvider({ value, children }) {
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGameContext() {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGameContext must be used within a <GameProvider>');
  }
  return ctx;
}

export default GameContext;
