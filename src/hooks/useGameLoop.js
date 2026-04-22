// \hooks\useGameLoop.js
import { useState, useEffect, useRef, useCallback } from 'react';
import enemyConfig from '../config/enemyConfig.json';
import towerConfig from '../config/towerConfig.json';

function createRuntimeId(prefix, index = 0) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`;
}

export default function useGameLoop({ towers = [], setTowers = () => {}, onEnemyEscape = () => {}, onEnemyKilled = () => {}, mapData, gameSpeed = 1, isPaused = false } = {}) {
  const [enemies, setEnemies] = useState([]);
  const enemiesRef = useRef(enemies);
  const towersRef = useRef(towers);

  useEffect(() => { enemiesRef.current = enemies; }, [enemies]);
  useEffect(() => { towersRef.current = towers; }, [towers]);

  const [waveActive, setWaveActive] = useState(false);

  // startWave teraz przyjmuje bezpośrednio waveData dla tej konkretnej fali
  const startWave = useCallback((waveData) => { // Zmieniono argument
    if (!waveData || !waveData.enemies) {
      console.warn(`Brak danych dla fali. Nie można rozpocząć.`);
      setWaveActive(false);
      return;
    }

    let totalCount = 0;
    waveData.enemies.forEach(({ count }) => (totalCount += count));

    const newEnemies = [];
    let orderIndex = 0;
    waveData.enemies.forEach(({ type, count }) => {
      for (let i = 0; i < count; i++) {
        newEnemies.push({
          id: createRuntimeId(type, orderIndex),
          type,
          health: enemyConfig[type].health,
          speed: enemyConfig[type].speed,
          pathIndex: null,
          position: null,
          escaped: false,
          spawned: false,
          order: orderIndex,
          totalInWave: totalCount,
        });
        orderIndex++;
      }
    });

    setEnemies(newEnemies);
    setWaveActive(true);
  }, []); // startWave nie zależy od waveConfig, bo dostaje konkretne waveData

  // Game loop: movement, spawning, tower shooting
  useEffect(() => {
    if (!waveActive) return undefined;
    const tickMs = 33;

    const interval = setInterval(() => {
      if (isPaused) return;

      const prevEnemies = enemiesRef.current || [];
      const prevTowers = towersRef.current || [];

      if (!mapData || !mapData.path) return;
      const path = mapData.path;
      const spawnPoint = path[0];

      const totalInWave = prevEnemies[0]?.totalInWave || prevEnemies.length;
      let spacing = 35;
      if (totalInWave > 50) spacing = 8;
      else if (totalInWave > 20) spacing = 16;
      else if (totalInWave > 10) spacing = 24;

      const spawnedPositions = prevEnemies
        .filter((e) => e.spawned && e.position)
        .map((e) => Math.hypot(e.position.x - spawnPoint.x, e.position.y - spawnPoint.y));
      const minDist = spawnedPositions.length ? Math.min(...spawnedPositions) : Infinity;
      const firstNotSpawnedIndex = prevEnemies.findIndex((e) => !e.spawned);

      let spawnedThisTick = false;
      let escapeDamageTotal = 0;
      const speedScale = (tickMs / 100) * gameSpeed;

      let movedEnemies = prevEnemies.map((enemy, idx) => {
        let currentSlowTimer = (enemy.slowTimer || 0) > 0 ? (enemy.slowTimer || 0) - (tickMs * gameSpeed) : 0;
        let slowFactorMul = 1;
        if (currentSlowTimer > 0) {
           slowFactorMul = 1 - (enemy.slowFactor || 0.5);
        }

        if (!enemy.spawned) {
          if (!spawnedThisTick && idx === firstNotSpawnedIndex && (spawnedPositions.length === 0 || minDist >= spacing)) {
            spawnedThisTick = true;
            return { ...enemy, spawned: true, position: { ...spawnPoint }, pathIndex: 0 };
          }
          return enemy;
        }

        if (enemy.health <= 0 || enemy.escaped) return enemy;

        const currentIndex = enemy.pathIndex ?? 0;
        const nextIndex = Math.min(currentIndex + 1, path.length - 1);
        const current = enemy.position ?? path[currentIndex];
        const next = path[nextIndex];

        const dx = next.x - current.x;
        const dy = next.y - current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const step = (enemy.speed || 0) * speedScale * slowFactorMul;

        if (distance === 0) {
          const newPathIndex = nextIndex;
          if (newPathIndex >= path.length - 1) {
            escapeDamageTotal += enemyConfig[enemy.type]?.damageOnEscape || 0;
            return null;
          }
          return { ...enemy, position: { ...next }, pathIndex: newPathIndex };
        }

        const ratio = Math.min(1, step / distance);
        const newX = current.x + dx * ratio;
        const newY = current.y + dy * ratio;
        const reachedNext = ratio >= 1 || (Math.abs(newX - next.x) < 1 && Math.abs(newY - next.y) < 1);

        const newPathIndex = reachedNext ? nextIndex : currentIndex;
        const newPosition = reachedNext ? { ...next } : { x: newX, y: newY };

        if (newPathIndex >= path.length - 1) {
          escapeDamageTotal += enemyConfig[enemy.type]?.damageOnEscape || 0;
          return null;
        }

        if (enemy.health <= 0) return null;
        return { ...enemy, position: newPosition, pathIndex: newPathIndex, slowTimer: Math.max(0, currentSlowTimer) };
      }).filter(Boolean);

      let updatedEnemies = movedEnemies.slice();
      let towersChanged = false;

      const updatedTowers = prevTowers.map((tower) => {
        const towerData = towerConfig[tower.type];
        if (!towerData) return tower;

        const level = Math.min(tower.level, towerData.levels.length - 1);
        const { damage, fireRate, splashRadius } = towerData.levels[level];

        let newCooldown = (tower.cooldown ?? 0) - (tickMs * gameSpeed);
        let newShootingTimer = (tower.shootingTimer ?? 0) - (tickMs * gameSpeed);
        let isShooting = newShootingTimer > 0;

        if (newCooldown <= 0) {
          const towerCenterX = tower.x + 20;
          const towerCenterY = tower.y + 20;

          const inRange = (enemy) => {
            if (!enemy.position) return false;
            const dx = enemy.position.x - towerCenterX;
            const dy = enemy.position.y - towerCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= towerData.levels[level].range;
          };

          const target = tower.targetingMode === 'strongest'
            ? updatedEnemies.filter(e => e.health > 0 && inRange(e)).sort((a, b) => b.health - a.health)[0]
            : updatedEnemies.find(e => e.health > 0 && inRange(e));

          if (target) {
            if (splashRadius) {
              updatedEnemies = updatedEnemies.map((e) => {
                if (!e.position || !target.position) return e;
                const dx = e.position.x - target.position.x;
                const dy = e.position.y - target.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= splashRadius) {
                   let dmg = damage;
                   if (e.type === 'tank' && tower.type === 'rapid-picker') dmg *= 0.5;
                   if (e.type === 'tank' && tower.type === 'sniper-picker') dmg *= 1.5;
                   let newSlowFactor = towerData.levels[level].slowFactor || e.slowFactor || 0;
                   let newSlowTimer = towerData.levels[level].slowFactor ? Math.max(e.slowTimer || 0, 1500) : (e.slowTimer || 0);
                   return { ...e, health: Math.max(0, e.health - dmg), slowTimer: newSlowTimer, slowFactor: newSlowFactor };
                }
                return e;
              });
            } else {
              updatedEnemies = updatedEnemies.map((e) => {
                  if (e.id === target.id) {
                     let dmg = damage;
                     if (e.type === 'tank' && tower.type === 'rapid-picker') dmg *= 0.5;
                     if (e.type === 'tank' && tower.type === 'sniper-picker') dmg *= 1.5;
                     let newSlowFactor = towerData.levels[level].slowFactor || e.slowFactor || 0;
                     let newSlowTimer = towerData.levels[level].slowFactor ? Math.max(e.slowTimer || 0, 1500) : (e.slowTimer || 0);
                     return { ...e, health: Math.max(0, e.health - dmg), slowTimer: newSlowTimer, slowFactor: newSlowFactor };
                  }
                  return e;
              });
            }
            newCooldown = fireRate;
            newShootingTimer = 150;
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
        };
      });

      const defeatedEnemies = updatedEnemies.filter((e) => e.health <= 0);
      if (defeatedEnemies.length > 0) {
        let rewardTotal = 0;
        const killsByType = {};

        for (const enemy of defeatedEnemies) {
          const killReward = enemyConfig[enemy.type]?.killReward || 0;
          rewardTotal += killReward;
          killsByType[enemy.type] = (killsByType[enemy.type] || 0) + 1;
        }

        if (rewardTotal > 0) {
          try { onEnemyKilled(rewardTotal, killsByType); } catch { /* swallow callback errors */ }
        }
      }

      updatedEnemies = updatedEnemies.filter(e => e.health > 0);

      if (escapeDamageTotal !== 0) {
        try { onEnemyEscape(escapeDamageTotal); } catch { /* swallow callback errors */ }
      }

      setEnemies(updatedEnemies);
      if (towersChanged) {
        try { setTowers(updatedTowers); } catch { /* swallow */ }
      }
    }, tickMs);

    return () => clearInterval(interval);
  }, [waveActive, setTowers, onEnemyEscape, onEnemyKilled, mapData, gameSpeed, isPaused]);

  const clearEnemies = useCallback(() => setEnemies([]), []);

  const castNuke = useCallback(() => {
    setEnemies(prev => prev.map(e => ({ ...e, health: e.type === 'boss' ? Math.max(0, e.health - 50) : 0 })));
  }, []);

  return { enemies, setEnemies, waveActive, setWaveActive, startWave, clearEnemies, castNuke };
}