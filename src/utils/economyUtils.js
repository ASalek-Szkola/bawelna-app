export const ECONOMY_BALANCE = Object.freeze({
  nukeCost: 650,
  nukeCooldownSeconds: 75,
  maxFarmTowers: 3,
  farmFullEfficiencyCount: 2,
  farmEfficiencyStep: 0.25,
  farmMinEfficiency: 0.25,
  ledgerLimit: 40,
});

export const MONEY_SOURCE_LABELS = Object.freeze({
  wave_reward: 'Nagroda za fale',
  farm_income: 'Dochód farm',
  quiz_bonus: 'Bonus quizu',
  enemy_kill: 'Eliminacje wrogów',
  tower_purchase: 'Zakup wieży',
  tower_upgrade: 'Ulepszenie wieży',
  tower_sell: 'Sprzedaż wieży',
  nuke_cast: 'Rzut Nuke',
  adjustment: 'Korekta',
});

export function getFarmEfficiency(index, balance = ECONOMY_BALANCE) {
  if (index < balance.farmFullEfficiencyCount) {
    return 1;
  }

  const reduced = 1 - (index - (balance.farmFullEfficiencyCount - 1)) * balance.farmEfficiencyStep;
  return Math.max(balance.farmMinEfficiency, reduced);
}

export function calculateFarmIncome(towers = [], towerConfig, balance = ECONOMY_BALANCE) {
  const farmTowers = towers.filter((tower) => tower.type === 'farm-tower').slice(0, balance.maxFarmTowers);

  const breakdown = farmTowers.map((tower, index) => {
    const config = towerConfig?.[tower.type];
    if (!config) {
      return { towerId: tower.id, towerType: tower.type, level: tower.level || 0, baseIncome: 0, efficiency: 1, income: 0 };
    }

    const level = Math.min(tower.level || 0, config.levels.length - 1);
    const baseIncome = config.levels[level]?.incomePerWave || 0;
    const efficiency = getFarmEfficiency(index, balance);
    const income = Math.floor(baseIncome * efficiency);

    return {
      towerId: tower.id,
      towerType: tower.type,
      level,
      baseIncome,
      efficiency,
      income,
    };
  });

  const total = breakdown.reduce((sum, item) => sum + item.income, 0);
  return { total, breakdown, count: breakdown.length };
}

export function getMoneySourceLabel(source) {
  return MONEY_SOURCE_LABELS[source] || source || 'Nieznane źródło';
}

export function createMoneyLedgerEntry({ source, amount, wave = 1, details = {} }) {
  const normalizedAmount = Math.round(Number(amount) || 0);
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    source,
    label: getMoneySourceLabel(source),
    amount: normalizedAmount,
    wave,
    createdAt: Date.now(),
    details,
  };
}

export function pushMoneyLedgerEntry(previousEntries = [], entry, balance = ECONOMY_BALANCE) {
  return [...previousEntries, entry].slice(-balance.ledgerLimit);
}