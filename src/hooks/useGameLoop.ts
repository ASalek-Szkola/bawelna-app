// \hooks\useGameLoop.ts
import { useState, useEffect, useRef, useCallback, Dispatch, SetStateAction } from 'react';
import { createRuntimeId } from '../utils/idUtils';
import { getEnemyConfig } from '../utils/configUtils';
import { findTarget, applyDamage } from '../utils/combatUtils';
import { TICK_MS, SHOOTING_TIMER_MS, getSpawnSpacing } from '../config/gameConstants';
import towerConfigJson from '../config/towerConfig.json';
import { Enemy, Tower, MapData, WaveData, TowerTypeConfig } from '../types/game';

const towerConfig = towerConfigJson as Record<string, TowerTypeConfig>;

interface UseGameLoopProps {
  towers: Tower[];
  setTowers: Dispatch<SetStateAction<Tower[]>>;
  onEnemyEscape: (damage: number) => void;
  onEnemyKilled: (reward: number, killsByType: Record<string, number>) => void;
  mapData: MapData | null;
  gameSpeed: number;
  isPaused: boolean;
}

interface UseGameLoopReturn {
  enemies: Enemy[];
  setEnemies: Dispatch<SetStateAction<Enemy[]>>;
  waveActive: boolean;
  setWaveActive: Dispatch<SetStateAction<boolean>>;
  startWave: (waveData: WaveData) => void;
  clearEnemies: () => void;
  castNuke: () => void;
}

export default function useGameLoop({ 
  towers = [], 
  setTowers = () => {}, 
  onEnemyEscape = () => {}, 
  onEnemyKilled = () => {}, 
  mapData, 
  gameSpeed = 1, 
  isPaused = false 
}: UseGameLoopProps): UseGameLoopReturn {
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const enemiesRef = useRef<Enemy[]>(enemies);
  const towersRef = useRef<Tower[]>(towers);

  useEffect(() => { enemiesRef.current = enemies; }, [enemies]);
  useEffect(() => { towersRef.current = towers; }, [towers]);

  const [waveActive, setWaveActive] = useState(false);

  const startWave = useCallback((waveData: WaveData) => {
    if (!waveData || !waveData.enemies) {
      console.warn(`Brak danych dla fali. Nie można rozpocząć.`);
      setWaveActive(false);
      return;
    }

    let totalCount = 0;
    waveData.enemies.forEach(({ count }) => (totalCount += count));

    const newEnemies: Enemy[] = [];
    let orderIndex = 0;
    waveData.enemies.forEach(({ type, count }) => {
      const cfg = getEnemyConfig(type);
      for (let i = 0; i < count; i++) {
        newEnemies.push({
          id: createRuntimeId(type, orderIndex),
          type,
          health: cfg.health,
          speed: cfg.speed,
          pathIndex: null,
          position: null,
          spawned: false,
          order: orderIndex,
          totalInWave: totalCount,
        });
        orderIndex++;
      }
    });

    setEnemies(newEnemies);
    setWaveActive(true);
  }, []);

  useEffect(() => {
    if (!waveActive) return undefined;

    const interval = setInterval(() => {
      if (isPaused) return;

      const prevEnemies = enemiesRef.current || [];
      const prevTowers = towersRef.current || [];

      if (!mapData || !mapData.path) return;
      const path = mapData.path;
      const spawnPoint = path[0];

      const totalInWave = prevEnemies[0]?.totalInWave || prevEnemies.length;
      const spacing = getSpawnSpacing(totalInWave);

      const spawnedPositions = prevEnemies
        .filter((e) => e.spawned && e.position)
        .map((e) => Math.hypot(e.position!.x - spawnPoint.x, e.position!.y - spawnPoint.y));
      const minDist = spawnedPositions.length ? Math.min(...spawnedPositions) : Infinity;
      const firstNotSpawnedIndex = prevEnemies.findIndex((e) => !e.spawned);

      let spawnedThisTick = false;
      let escapeDamageTotal = 0;
      const speedScale = (TICK_MS / 100) * gameSpeed;

      let movedEnemies = prevEnemies.map((enemy, idx) => {
        let currentSlowTimer = (enemy.slowTimer || 0) > 0 ? (enemy.slowTimer || 0) - (TICK_MS * gameSpeed) : 0;
        let slowFactorMul = 1;
        if (currentSlowTimer > 0) {
          slowFactorMul = 1 - (enemy.slowFactor || 0.5);
        }

        if (!enemy.spawned) {
          if (!spawnedThisTick && idx === firstNotSpawnedIndex && (spawnedPositions.length === 0 || minDist >= spacing)) {
            spawnedThisTick = true;
            return { ...enemy, spawned: true, position: { ...spawnPoint }, pathIndex: 0 } as Enemy;
          }
          return enemy;
        }

        if (enemy.health <= 0) return enemy;

        const currentIndex = enemy.pathIndex ?? 0;
        const nextIndex = Math.min(currentIndex + 1, path.length - 1);
        const current = enemy.position ?? path[currentIndex];
        const next = path[nextIndex];

        const dx = next.x - current.x;
        const dy = next.y - current.y;
        const distance = Math.hypot(dx, dy);

        const step = (enemy.speed || 0) * speedScale * slowFactorMul;

        if (distance === 0) {
          const newPathIndex = nextIndex;
          if (newPathIndex >= path.length - 1) {
            escapeDamageTotal += getEnemyConfig(enemy.type).damageOnEscape || 0;
            return null;
          }
          return { ...enemy, position: { ...next }, pathIndex: newPathIndex } as Enemy;
        }

        const ratio = Math.min(1, step / distance);
        const newX = current.x + dx * ratio;
        const newY = current.y + dy * ratio;
        const reachedNext = ratio >= 1 || (Math.abs(newX - next.x) < 1 && Math.abs(newY - next.y) < 1);

        const newPathIndex = reachedNext ? nextIndex : currentIndex;
        const newPosition = reachedNext ? { ...next } : { x: newX, y: newY };

        if (newPathIndex >= path.length - 1) {
          escapeDamageTotal += getEnemyConfig(enemy.type).damageOnEscape || 0;
          return null;
        }

        return { ...enemy, position: newPosition, pathIndex: newPathIndex, slowTimer: Math.max(0, currentSlowTimer) } as Enemy;
      }).filter((e): e is Enemy => e !== null);

      // --- Tower targeting & damage ---
      let updatedEnemies = movedEnemies.slice();
      let towersChanged = false;

      const updatedTowers = prevTowers.map((tower) => {
        const towerData = towerConfig[tower.type];
        if (!towerData) return tower;

        const level = Math.min(tower.level, towerData.levels.length - 1);
        const levelData = towerData.levels[level];
        const { fireRate } = levelData;

        let newCooldown = (tower.cooldown ?? 0) - (TICK_MS * gameSpeed);
        let newShootingTimer = (tower.shootingTimer ?? 0) - (TICK_MS * gameSpeed);
        let isShooting = newShootingTimer > 0;

        if (newCooldown <= 0) {
          const target = findTarget(updatedEnemies, tower, levelData.range);

          if (target) {
            updatedEnemies = applyDamage(updatedEnemies, target, tower, levelData);
            newCooldown = fireRate;
            newShootingTimer = SHOOTING_TIMER_MS;
            isShooting = true;
          }
        }

        const normalizedCooldown = Math.max(0, newCooldown);
        const normalizedShootingTimer = Math.max(0, newShootingTimer);

        if (
          (tower.cooldown ?? 0) === normalizedCooldown &&
          (tower.shootingTimer ?? 0) === normalizedShootingTimer &&
          !!tower.isShooting === isShooting
        ) {
          return tower;
        }

        towersChanged = true;
        return {
          ...tower,
          cooldown: normalizedCooldown,
          shootingTimer: normalizedShootingTimer,
          isShooting
        } as Tower;
      });

      // --- Rewards for defeated enemies ---
      const defeatedEnemies = updatedEnemies.filter((e) => e.health <= 0);
      if (defeatedEnemies.length > 0) {
        let rewardTotal = 0;
        const killsByType: Record<string, number> = {};

        for (const enemy of defeatedEnemies) {
          const killReward = getEnemyConfig(enemy.type).killReward || 0;
          rewardTotal += killReward;
          killsByType[enemy.type] = (killsByType[enemy.type] || 0) + 1;
        }

        if (rewardTotal > 0) {
          try { onEnemyKilled(rewardTotal, killsByType); } catch { /* swallow */ }
        }
      }

      updatedEnemies = updatedEnemies.filter(e => e.health > 0);

      if (escapeDamageTotal !== 0) {
        try { onEnemyEscape(escapeDamageTotal); } catch { /* swallow */ }
      }

      setEnemies(updatedEnemies);
      if (towersChanged) {
        try { setTowers(updatedTowers); } catch { /* swallow */ }
      }
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [waveActive, setTowers, onEnemyEscape, onEnemyKilled, mapData, gameSpeed, isPaused]);

  const clearEnemies = useCallback(() => setEnemies([]), []);

  const castNuke = useCallback(() => {
    setEnemies(prev => prev.map(e => ({ ...e, health: e.type === 'boss' ? Math.max(0, e.health - 50) : 0 } as Enemy)));
  }, []);

  return { enemies, setEnemies, waveActive, setWaveActive, startWave, clearEnemies, castNuke };
}
