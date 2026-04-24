// \utils\waveGenerator.ts
import { WaveData, WaveEnemyGroup } from '../types/game';

interface DifficultySettings {
  baseWavePower: number;
  wavePowerGrowth: number;
  rewardBase: number;
  rewardPerWave: number;
  rewardMultiplier: number;
  enemyDistribution: {
    early: string[];
    mid: string[];
    late: string[];
  };
  tankBossThreshold: number;
  bossWaveFrequency: number;
}

const ENEMY_POWER_VALUES: Record<string, number> = {
  "basic": 10,
  "fast": 15,
  "swarm": 5,
  "tank": 50,
  "boss": 200
};

const DIFFICULTY_SETTINGS: Record<string, DifficultySettings> = {
  "Easy": {
    baseWavePower: 80,
    wavePowerGrowth: 1.25,
    rewardBase: 100,
    rewardPerWave: 50,
    rewardMultiplier: 1.0,
    enemyDistribution: {
      early: ["basic", "fast"],
      mid: ["basic", "fast", "swarm", "tank"],
      late: ["basic", "fast", "swarm", "tank", "boss"]
    },
    tankBossThreshold: 4,
    bossWaveFrequency: 6
  },
  "Normal": {
    baseWavePower: 120,
    wavePowerGrowth: 1.30,
    rewardBase: 100,
    rewardPerWave: 50,
    rewardMultiplier: 0.9,
    enemyDistribution: {
      early: ["basic", "fast", "swarm"],
      mid: ["basic", "fast", "swarm", "tank"],
      late:["basic", "fast", "swarm", "tank", "boss"]
    },
    tankBossThreshold: 3,
    bossWaveFrequency: 4
  },
  "Hard": {
    baseWavePower: 180,
    wavePowerGrowth: 1.35,
    rewardBase: 80,
    rewardPerWave: 60,
    rewardMultiplier: 0.8,
    enemyDistribution: {
      early: ["fast", "swarm", "tank"],
      mid:["fast", "swarm", "tank", "boss"],
      late: ["fast", "swarm", "tank", "boss"]
    },
    tankBossThreshold: 2,
    bossWaveFrequency: 3
  }
};

function hashSeed(input: string): number {
  let hash = 0;
  const normalized = String(input || '');
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  return hash >>> 0;
}

function createSeededRandom(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleArray<T>(array: T[], random: () => number): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function generateSingleWaveData(difficulty: string, waveNumber: number, seedScope: string = ''): WaveData {
  let actualDifficulty = difficulty;
  let settings = DIFFICULTY_SETTINGS[actualDifficulty];
  if (!settings) {
    console.warn(`Nieznany poziom trudności: ${difficulty}. Używanie domyślnego: Easy.`);
    actualDifficulty = "Easy";
    settings = DIFFICULTY_SETTINGS["Easy"];
  }

  const random = createSeededRandom(hashSeed(`${actualDifficulty}|${waveNumber}|${seedScope}`));

  let currentWavePower = settings.baseWavePower * Math.pow(settings.wavePowerGrowth, waveNumber - 1);
  let waveEnemies: WaveEnemyGroup[] = [];
  let currentPowerSpent = 0;

  let availableEnemyTypes: string[];
  if (waveNumber <= 3) {
    availableEnemyTypes = settings.enemyDistribution.early;
  } else if (waveNumber <= 6) {
    availableEnemyTypes = settings.enemyDistribution.mid;
  } else {
    availableEnemyTypes = settings.enemyDistribution.late;
  }

  const isBossWave = (waveNumber >= settings.tankBossThreshold && (waveNumber - settings.tankBossThreshold + 1) % settings.bossWaveFrequency === 0);
  if (isBossWave && availableEnemyTypes.includes("boss")) {
    const bossType = "boss";
    const bossCount = 1 + (actualDifficulty === "Hard" ? Math.floor((waveNumber - settings.tankBossThreshold) / settings.bossWaveFrequency) : 0);
    waveEnemies.push({ type: bossType, count: bossCount });
    currentPowerSpent += ENEMY_POWER_VALUES[bossType] * bossCount;
    currentWavePower *= 1.1;
  }

  while (currentWavePower - currentPowerSpent > (ENEMY_POWER_VALUES["swarm"] || 5) / 2) {
    const remainingPower = currentWavePower - currentPowerSpent;
    const possibleEnemyTypesForFilling = shuffleArray(availableEnemyTypes.filter(type => type !== "boss"), random);

    let addedEnemyInThisIteration = false;

    for (const enemyType of possibleEnemyTypesForFilling) {
      const enemyPower = ENEMY_POWER_VALUES[enemyType];
      if (enemyPower <= remainingPower) {
        let countToAdd = 1;
        if (enemyType === "swarm") {
          countToAdd = Math.max(1, Math.floor(random() * (remainingPower / enemyPower / 2) + 1));
          countToAdd = Math.min(countToAdd, 50);
          if (enemyPower * countToAdd > remainingPower) {
              countToAdd = Math.max(1, Math.floor(remainingPower / enemyPower));
          }
        } else {
            countToAdd = Math.max(1, Math.floor(random() * (remainingPower / enemyPower / 3) + 1));
            if (enemyPower * countToAdd > remainingPower) {
                 countToAdd = Math.max(1, Math.floor(remainingPower / enemyPower));
            }
        }

        if (countToAdd === 0) continue;

        let existingEnemyGroup = waveEnemies.find(e => e.type === enemyType);
        if (existingEnemyGroup) {
          existingEnemyGroup.count += countToAdd;
        } else {
          waveEnemies.push({ type: enemyType, count: countToAdd });
        }
        currentPowerSpent += enemyPower * countToAdd;
        addedEnemyInThisIteration = true;
        break;
      }
    }

    if (!addedEnemyInThisIteration) {
      break;
    }
  }

  if (waveEnemies.length === 0) {
    const weakest = [...availableEnemyTypes].sort((a,b) => ENEMY_POWER_VALUES[a] - ENEMY_POWER_VALUES[b])[0];
      if (weakest) {
          waveEnemies.push({type: weakest, count: 1});
      }
  }

  let reward = Math.round((settings.rewardBase + (waveNumber * settings.rewardPerWave)) * settings.rewardMultiplier);
  reward = Math.round(reward + (currentPowerSpent / 5));

  return {
    enemies: waveEnemies,
    reward: Math.max(50, reward)
  };
}
