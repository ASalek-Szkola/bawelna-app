// \tests\waveGenerator.test.js
import { describe, it, expect } from 'vitest';
import { generateSingleWaveData } from '../utils/waveGenerator';

describe('waveGenerator', () => {
  it('zawsze generuje w pełni deterministyczną falę dla tych samych parametrów', () => {
    const wave1 = generateSingleWaveData('Normal', 5, 'map_classic');
    const wave2 = generateSingleWaveData('Normal', 5, 'map_classic');
    
    expect(wave1).toEqual(wave2);
  });

  it('generuje inaczej wyważoną falę dla różnego scope nasion (różne mapy)', () => {
    const waveClassic = generateSingleWaveData('Normal', 5, 'map_classic');
    const waveChaos = generateSingleWaveData('Normal', 5, 'map_chaos');
    
    expect(waveClassic).not.toEqual(waveChaos);
  });

  it('gwarantuje obecność bossa podczas przewidzianej fali bossów', () => {
    // Normal: tankBossThreshold = 3, bossWaveFrequency = 4. 
    // Sprawdzamy falę nr 6, bo (6 - 3 + 1) % 4 == 0. Tak, fala 6 generuje bossa.
    const waveBoss = generateSingleWaveData('Normal', 6, 'map_classic');
    const hasBoss = waveBoss.enemies.some(e => e.type === 'boss');
    
    expect(hasBoss).toBe(true);
  });
});