// \utils\economyUtils.ts
import { MoneyLedgerEntry, Tower, TowerTypeConfig } from '../types/game';

export const ECONOMY_BALANCE = {
  nukeCost: 650,
  nukeCooldownSeconds: 60,
  startingMoney: 500,
  baseWaveReward: 100,
  enemyKillRewardMult: 1.0,
  farmIncomeBase: 15,
};

/**
 * Calculate efficiency of a farm based on how many have been built (diminishing returns).
 */
export function getFarmEfficiency(index: number): number {
  if (index < 2) return 1.0;
  if (index === 2) return 0.75;
  if (index === 3) return 0.50;
  return 0.25;
}

/**
 * Calculate income from farm-type towers.
 */
export function calculateFarmIncome(
  towers: Tower[],
  towerConfig: Record<string, TowerTypeConfig>,
  _economy: typeof ECONOMY_BALANCE = ECONOMY_BALANCE
): { total: number; count: number; breakdown: Record<string, { income: number; efficiency: number }> } {
  let total = 0;
  const breakdown: Record<string, { income: number; efficiency: number }> = {};
  
  const farmTowers = towers.filter(t => t.type === 'farm-tower');

  farmTowers.forEach((tower, index) => {
    const config = towerConfig[tower.type];
    if (config) {
      const levelData = config.levels[tower.level];
      if (levelData && levelData.incomePerWave) {
        const efficiency = getFarmEfficiency(index);
        const income = Math.floor(levelData.incomePerWave * efficiency);
        total += income;
        breakdown[tower.id] = { income, efficiency };
      }
    }
  });

  return { total, count: farmTowers.length, breakdown };
}

/**
 * Create a new money ledger entry.
 */
export function createMoneyLedgerEntry({ 
  amount, 
  source, 
  wave, 
  details = {} 
}: { 
  amount: number, 
  source: string, 
  wave: number, 
  details?: any 
}): MoneyLedgerEntry {
  const sourceLabels: Record<string, string> = {
    tower_purchase: 'Zakup wieży',
    tower_sell: 'Sprzedaż wieży',
    tower_upgrade: 'Ulepszenie',
    wave_reward: 'Nagroda za falę',
    quiz_bonus: 'Bonus z quizu',
    enemy_kill: 'Pokonanie wroga',
    farm_income: 'Przychód z farmy',
    nuke_cast: 'Użycie Nuke',
  };

  return {
    id: `ledger-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    source,
    label: sourceLabels[source] || source,
    amount,
    wave,
    createdAt: Date.now(),
    details,
  };
}

/**
 * Add an entry to the ledger and keep it within limits.
 */
export function pushMoneyLedgerEntry(ledger: MoneyLedgerEntry[], entry: MoneyLedgerEntry): MoneyLedgerEntry[] {
  const limit = 50;
  return [...ledger, entry].slice(-limit);
}
