// \context\GameContext.tsx — Context for slow-changing game state
import { createContext, useContext, ReactNode } from 'react';
import { GameState } from '../types/game';

const GameContext = createContext<GameState | null>(null);

/**
 * Provider for game-wide state that changes infrequently.
 */
export function GameProvider({ value, children }: { value: GameState; children: ReactNode }) {
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGameContext(): GameState {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGameContext must be used within a <GameProvider>');
  }
  return ctx;
}

export default GameContext;
