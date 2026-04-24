// \types\game.d.ts — Central game types

export type TargetingMode = 'first' | 'strongest';

export interface Position {
  x: number;
  y: number;
}

export interface MapBoardConfig {
  width: number;
  height: number;
}

export interface MapData {
  id: string;
  name: string;
  board: MapBoardConfig;
  path: Position[];
  pathWidth: number;
}

export interface EnemyTypeConfig {
  image: string;
  health: number;
  speed: number;
  damageOnEscape: number;
  killReward: number;
}

export interface TowerLevel {
  cost: number;
  range: number;
  damage: number;
  fireRate: number;
  splashRadius?: number;
  slowFactor?: number;
  incomePerWave?: number;
}

export interface TowerTypeConfig {
  image: string;
  levels: TowerLevel[];
}

export interface Tower {
  id: string;
  x: number;
  y: number;
  type: string;
  level: number;
  cooldown: number;
  targetingMode: TargetingMode;
  isShooting?: boolean;
  shootingTimer?: number;
}

export interface Enemy {
  id: string;
  type: string;
  health: number;
  speed: number;
  pathIndex: number | null;
  position: Position | null;
  spawned: boolean;
  order: number;
  totalInWave: number;
  slowTimer?: number;
  slowFactor?: number;
}

export interface WaveEnemyGroup {
  type: string;
  count: number;
}

export interface WaveData {
  enemies: WaveEnemyGroup[];
  reward: number;
}

export interface MoneyLedgerEntry {
  id: string;
  source: string;
  label: string;
  amount: number;
  wave: number;
  createdAt: number;
  details: any;
}

export interface GameState {
  money: number;
  health: number;
  wave: number;
  moneyLedger: MoneyLedgerEntry[];
  applyMoneyDelta: (amount: number, source?: string, details?: any) => void;
  gameSpeed: number;
  isPaused: boolean;
  isGameOver: boolean;
}
