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
    // Używamy fali 12 zamiast 5, ponieważ większy budżet punktowy na wrogów
    // zapewnia duże zróżnicowanie w zaokrąglaniu przydziałów w generatorze.
    const waveClassic = generateSingleWaveData('Normal', 12, 'map_classic');
    const waveChaos = generateSingleWaveData('Normal', 12, 'map_chaos');
    
    expect(waveClassic).not.toEqual(waveChaos);
  });

  it('gwarantuje obecność bossa podczas przewidzianej fali bossów', () => {
    // Normal: tankBossThreshold = 3, bossWaveFrequency = 4. 
    // Fala 6 teoretycznie spełnia (6-3+1)%4=0, ALE bossowie na Normalu 
    // są odblokowani do puli dopiero w fazie "late" (fale > 6).
    // Kolejną przewidzianą falą bossową jest fala 10 ((10-3+1)%4=0). Tu boss wystąpi w 100%.
    const waveBoss = generateSingleWaveData('Normal', 10, 'map_classic');
    const hasBoss = waveBoss.enemies.some(e => e.type === 'boss');
    
    expect(hasBoss).toBe(true);
  });
});