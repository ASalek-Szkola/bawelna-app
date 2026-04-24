// \tests\economyUtils.test.ts
import { describe, it, expect } from 'vitest';
import { getFarmEfficiency, calculateFarmIncome, createMoneyLedgerEntry } from '../utils/economyUtils';
import { Tower, TowerTypeConfig } from '../types/game';

describe('economyUtils', () => {
  it('oblicza wydajność farmy zgodnie z mechaniką diminishing returns', () => {
    expect(getFarmEfficiency(0)).toBe(1);
    expect(getFarmEfficiency(1)).toBe(1);
    expect(getFarmEfficiency(2)).toBe(0.75);
    expect(getFarmEfficiency(3)).toBe(0.5);
  });

  it('poprawnie oblicza dochód całkowity farm', () => {
    const mockTowers = [
      { id: 't1', type: 'farm-tower', level: 0 },
      { id: 't2', type: 'farm-tower', level: 1 },
      { id: 't3', type: 'farm-tower', level: 2 }
    ] as any as Tower[];
    
    const mockTowerConfig: Record<string, TowerTypeConfig> = {
      'farm-tower': {
        image: '',
        levels: [
          { cost: 100, damage: 0, range: 0, fireRate: 0, incomePerWave: 30 },
          { cost: 150, damage: 0, range: 0, fireRate: 0, incomePerWave: 65 },
          { cost: 200, damage: 0, range: 0, fireRate: 0, incomePerWave: 125 }
        ]
      }
    };

    const result = calculateFarmIncome(mockTowers, mockTowerConfig);
    // t1: 30 * 1.0 = 30
    // t2: 65 * 1.0 = 65
    // t3: 125 * 0.75 = 93.75 -> floor -> 93
    // Total = 30 + 65 + 93 = 188
    expect(result.total).toBe(188);
    expect(result.count).toBe(3);
    expect(result.breakdown['t3'].efficiency).toBe(0.75);
    expect(result.breakdown['t3'].income).toBe(93);
  });

  it('generuje spójny wpis dla Księgi Przychodów/Rozchodów (Ledger)', () => {
    const entry = createMoneyLedgerEntry({
      source: 'enemy_kill',
      amount: 15,
      wave: 5,
      details: { enemyType: 'boss' }
    });

    expect(entry.id).toBeDefined();
    expect(entry.source).toBe('enemy_kill');
    expect(entry.amount).toBe(15);
    expect(entry.wave).toBe(5);
    expect(entry.label).toBeDefined();
    expect(entry.createdAt).toBeDefined();
    expect(entry.details.enemyType).toBe('boss');
  });
});
