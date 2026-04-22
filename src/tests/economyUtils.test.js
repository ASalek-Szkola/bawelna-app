// \tests\economyUtils.test.js
import { describe, it, expect } from 'vitest';
import { getFarmEfficiency, calculateFarmIncome, createMoneyLedgerEntry } from '../utils/economyUtils';

describe('economyUtils', () => {
  it('oblicza wydajność farmy zgodnie z mechaniką diminishing returns', () => {
    // Pierwsza i druga farma (indeksy 0, 1) pracują na 100%
    expect(getFarmEfficiency(0)).toBe(1);
    expect(getFarmEfficiency(1)).toBe(1);
    
    // Trzecia farma traci 25% wydajności (0.75)
    expect(getFarmEfficiency(2)).toBe(0.75);
    
    // Czwarta farma miałaby 50%, chociaż w grze nakładany jest sztuczny limit ilościowy
    expect(getFarmEfficiency(3)).toBe(0.5);
  });

  it('poprawnie oblicza dochód całkowity farm', () => {
    const mockTowers =[
      { id: 't1', type: 'farm-tower', level: 0 },
      { id: 't2', type: 'farm-tower', level: 1 },
      { id: 't3', type: 'farm-tower', level: 2 }
    ];
    
    const mockTowerConfig = {
      'farm-tower': {
        levels:[
          { incomePerWave: 30 },
          { incomePerWave: 65 },
          { incomePerWave: 125 }
        ]
      }
    };

    const result = calculateFarmIncome(mockTowers, mockTowerConfig);
    // t1: 30 * 1.0 = 30
    // t2: 65 * 1.0 = 65
    // t3: 125 * 0.75 = 93.75 -> zaokrąglenie w dół -> 93
    // Razem = 188
    expect(result.total).toBe(188);
    expect(result.count).toBe(3);
    expect(result.breakdown[2].efficiency).toBe(0.75);
    expect(result.breakdown[2].income).toBe(93);
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