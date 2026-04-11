// App.jsx
import React, { useState, useEffect, useRef } from 'react';
import GameInfo from './GameInfo';
import GameBoard from './GameBoard';
import TowerInfo from './TowerInfo';
import WaveManager from './WaveManager';
import Enemy from './Enemy';
import TowerShop from './TowerShop';
import towerConfig from './config/towerConfig.json';
import enemyConfig from './config/enemyConfig.json';
import waveConfig from './config/waveConfig.json';
import mapConfig from './config/mapConfig.json';
import './App.css';
import Quiz from './Quiz';
import QuizFacts from './QuizFacts';
import quizConfig from './config/quizConfig.json';

const App = () => {
  const [health, setHealth] = useState(100);
  const[wave, setWave] = useState(1);
  const [money, setMoney] = useState(500);
  const [waveActive, setWaveActive] = useState(false);

  const[towers, setTowers] = useState([]);
  const [selectedTowerId, setSelectedTowerId] = useState(null);
  const [enemies, setEnemies] = useState([]);
  
  const enemiesRef = useRef(enemies);
  const towersRef = useRef(towers);

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setTheme(e.matches ? 'dark' : 'light');
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler);
      else mq.removeListener(handler);
    };
  },[]);

  // Board Scaling Logic for Responsiveness
  const [boardScale, setBoardScale] = useState(1);
  useEffect(() => {
    const updateScale = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      let availableWidth;
      
      if (w <= 1024) {
        // Mobile / Tablet: uses full width minus padding
        availableWidth = w - 32; 
      } else {
        // Desktop: subtract left/right sidebars and padding
        availableWidth = w - 280 - 320 - 64; 
      }
      
      let newScale = Math.min(1, availableWidth / mapConfig.board.width);
      
      // On desktop, ensure height doesn't overflow
      if (w > 1024) {
        let availableHeight = h - 140; // paddings and ticker space
        newScale = Math.min(newScale, availableHeight / mapConfig.board.height);
      }
      
      setBoardScale(newScale);
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  },[]);

  const [shopSelectedType, setShopSelectedType] = useState(null);
  const[previewPos, setPreviewPos] = useState(null);
  const [factsHistory, setFactsHistory] = useState([]);
  const [quizOpen, setQuizOpen] = useState(false);
  const[quizQuestion, setQuizQuestion] = useState(null);
  const quizOpeningRef = useRef(false);
  const [pendingWaveResult, setPendingWaveResult] = useState(null);

  const handleUpgrade = (towerId) => {
    const tower = towers.find((t) => t.id === towerId);
    if (!tower) return;
    const nextLevel = tower.level + 1;
    const upgradeData = towerConfig[tower.type].levels[nextLevel];
    if (!upgradeData || money < upgradeData.cost) return;

    setMoney((prevMoney) => prevMoney - upgradeData.cost);
    setTowers((prevTowers) =>
      prevTowers.map((t) => t.id === towerId ? { ...t, level: nextLevel } : t)
    );
  };

  const handleStartWave = () => {
    if (waveActive) return;
    const waveData = waveConfig.waves[wave - 1];
    if (!waveData) return;

    let totalCount = 0;
    waveData.enemies.forEach(({ count }) => (totalCount += count));

    const newEnemies =[];
    let orderIndex = 0;
    waveData.enemies.forEach(({ type, count }) => {
      for (let i = 0; i < count; i++) {
        newEnemies.push({
          id: `${type}-${Date.now()}-${orderIndex}`,
          type, health: enemyConfig[type].health, speed: enemyConfig[type].speed,
          pathIndex: null, position: null, escaped: false, spawned: false,
          order: orderIndex, totalInWave: totalCount,
        });
        orderIndex++;
      }
    });

    setEnemies(newEnemies);
    setWaveActive(true);
  };

  const handleEnemyEscape = (enemyId, damage = 0) => {
    setEnemies((prev) => prev.filter(e => e.id !== enemyId));
    const healthDamage = Number(damage) || 0;
    setHealth((prev) => Math.max(0, prev + healthDamage)); 
  };

  useEffect(() => { enemiesRef.current = enemies; }, [enemies]);
  useEffect(() => { towersRef.current = towers; }, [towers]);

  // Consolidated game loop
  useEffect(() => {
    if (!waveActive) return undefined;
    const tickMs = 33;

    const interval = setInterval(() => {
      const prevEnemies = enemiesRef.current ||[];
      const prevTowers = towersRef.current ||[];

      const path = mapConfig.path;
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
      const speedScale = tickMs / 100;

      let movedEnemies = prevEnemies.map((enemy, idx) => {
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

        const step = (enemy.speed || 0) * speedScale;

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
        return { ...enemy, position: newPosition, pathIndex: newPathIndex };
      }).filter(Boolean);

      let updatedEnemies = movedEnemies.slice();
      const updatedTowers = prevTowers.map((tower) => {
        const towerData = towerConfig[tower.type];
        if (!towerData) return tower;

        const level = Math.min(tower.level, towerData.levels.length - 1);
        const { damage, fireRate } = towerData.levels[level];

        let newCooldown = (tower.cooldown ?? 0) - tickMs;
        let newShootingTimer = (tower.shootingTimer ?? 0) - tickMs;
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
            updatedEnemies = updatedEnemies.map((e) => e.id === target.id ? { ...e, health: Math.max(0, e.health - damage) } : e);
            newCooldown = fireRate;
            newShootingTimer = 150;
            isShooting = true;
          }
        }
        return { ...tower, cooldown: Math.max(0, newCooldown), shootingTimer: Math.max(0, newShootingTimer), isShooting };
      });

      updatedEnemies = updatedEnemies.filter(e => e.health > 0);

      if (escapeDamageTotal !== 0) setHealth((prev) => Math.max(0, prev + escapeDamageTotal));
      setEnemies(updatedEnemies);
      setTowers(updatedTowers);
    }, tickMs);

    return () => clearInterval(interval);
  }, [waveActive]);

  const handleTargetingChange = (towerId, mode) => {
    setTowers((prevTowers) =>
      prevTowers.map((tower) => tower.id === towerId ? { ...tower, targetingMode: mode } : tower)
    );
  };

  useEffect(() => {
    // Only trigger once when wave ends and a quiz is not already open or being opened
    if (waveActive && !quizOpen && !quizOpeningRef.current && ((enemies.length === 0) || (enemies.length > 0 && enemies.every((e) => e.health <= 0 || e.escaped)))) {
      const reward = waveConfig.waves[wave - 1]?.reward || 0;
      let chosenQuestion = null;
      const allQuestions = Array.isArray(quizConfig?.questions) ? quizConfig.questions :[];

      if (factsHistory && factsHistory.length > 0) {
        const pickFact = factsHistory[Math.floor(Math.random() * factsHistory.length)].fact;
        const qCandidates = allQuestions.filter((q) => q && q.question && q.fact && String(q.fact).trim() === String(pickFact).trim());
        if (qCandidates.length) chosenQuestion = qCandidates[Math.floor(Math.random() * qCandidates.length)];
      }

      if (!chosenQuestion) {
        const qCandidates = allQuestions.filter((q) => q && q.question);
        if (qCandidates.length) chosenQuestion = qCandidates[Math.floor(Math.random() * qCandidates.length)];
      }

      if (chosenQuestion) {
        // mark that we're opening a quiz so this effect won't re-trigger repeatedly
        quizOpeningRef.current = true;
        setQuizQuestion(chosenQuestion);
        setPendingWaveResult({ reward, waveNumber: wave });
        // immediately mark wave as inactive while the quiz is open to stop game loop
        setWaveActive(false);
        setQuizOpen(true);
      } else {
        setMoney((prev) => prev + reward);
        setWave((prev) => prev + 1);
        setEnemies([]);
        setWaveActive(false);
      }
    }
  }, [enemies, waveActive, wave, factsHistory, quizOpen]);

  const handleQuizClose = (isCorrect) => {
    const base = pendingWaveResult?.reward || 0;
    const bonus = isCorrect ? Math.floor(base * 0.25) : 0;
    setMoney((prev) => prev + base + bonus);
    setWave((prev) => prev + 1);
    setEnemies([]);
    setWaveActive(false);
    setPendingWaveResult(null);
    // clear the opening guard so future waves can trigger quizzes
    quizOpeningRef.current = false;
    setQuizOpen(false);
    setQuizQuestion(null);
  };

  const isPointOnPath = (x, y) => {
    const path = mapConfig.path;
    const half = mapConfig.pathWidth / 2;
    const distToSegment = (px, py, x1, y1, x2, y2) => {
      const vx = x2 - x1, vy = y2 - y1, wx = px - x1, wy = py - y1;
      const c1 = vx * wx + vy * wy;
      if (c1 <= 0) return Math.hypot(px - x1, py - y1);
      const c2 = vx * vx + vy * vy;
      if (c2 <= c1) return Math.hypot(px - x2, py - y2);
      const b = c1 / c2;
      return Math.hypot(px - (x1 + b * vx), py - (y1 + b * vy));
    };

    for (let i = 0; i < path.length - 1; i++) {
      if (distToSegment(x, y, path[i].x, path[i].y, path[i + 1].x, path[i + 1].y) <= half) return true;
    }
    return false;
  };

  const handleSelectShopTower = (type) => {
    setShopSelectedType(type);
    setPreviewPos(null);
  };

  const handleBoardMouseMove = (x, y) => {
    if (!shopSelectedType) return;
    setPreviewPos({ x, y });
  };

  const handleBoardRightClick = () => {
    if (shopSelectedType) {
      setShopSelectedType(null);
      setPreviewPos(null);
      return;
    }
    if (selectedTowerId) setSelectedTowerId(null);
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (shopSelectedType && !e.target.closest('.game-board-wrapper') && !e.target.closest('.tower-shop')) {
        setShopSelectedType(null);
        setPreviewPos(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [shopSelectedType]);

  const handlePlaceTower = (x, y) => {
    if (!shopSelectedType) {
      setSelectedTowerId(null);
      return;
    }
    if (isPointOnPath(x, y)) {
      setShopSelectedType(null);
      setPreviewPos(null);
      return;
    }

    const half = 20; 
    const levelData = towerConfig[shopSelectedType].levels[0];
    if (!levelData) return;
    if (money < levelData.cost) {
      alert('Brak wystarczajÄ…cych Ĺ›rodkĂłw.');
      return;
    }

    const newTower = {
      id: Date.now(),
      x: Math.round(x - half),
      y: Math.round(y - half),
      type: shopSelectedType,
      level: 0,
      cooldown: 0
    };

    setMoney((prev) => prev - levelData.cost);
    setTowers((prev) => [...prev, newTower]);
    setShopSelectedType(null);
    setPreviewPos(null);
    setSelectedTowerId(null);
  };

  const handleSellTower = (towerId) => {
    const tower = towers.find((t) => t.id === towerId);
    if (!tower) return;
    const levels = towerConfig[tower.type].levels;
    const paidSum = levels.slice(0, tower.level + 1).reduce((s, lvl) => s + (lvl.cost || 0), 0);
    setTowers((prev) => prev.filter((t) => t.id !== towerId));
    setMoney((prev) => prev + Math.floor(paidSum / 2));
    setSelectedTowerId((prev) => (prev === towerId ? null : prev));
  };

  const selectedTower = towers.find((t) => t.id === selectedTowerId);

  return (
    <div className={`app ${theme === 'dark' ? 'dark-theme' : 'light-theme'}`}>
      <aside className="left-panel panel">
        <div className="panel-section">
          <GameInfo health={health} wave={wave} money={money} />
        </div>
        <div className="panel-section">
          <WaveManager wave={wave} onStartWave={handleStartWave} waveActive={waveActive} enemies={enemies} />
        </div>
        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}>
            {theme === 'dark' ? 'Jasny' : 'Ciemny'}
          </button>
        </div>
      </aside>

      <main className="center-panel">
        <div className="center-inner">
          <div 
            className="game-board-wrapper" 
            style={{ 
              width: mapConfig.board.width * boardScale, 
              height: mapConfig.board.height * boardScale 
            }}
          >
            <div style={{
              width: mapConfig.board.width,
              height: mapConfig.board.height,
              transform: `scale(${boardScale})`,
              transformOrigin: 'top left',
              position: 'absolute',
              top: 0, left: 0
            }}>
              <GameBoard
                towers={towers}
                onTowerClick={setSelectedTowerId}
                onBoardClick={handlePlaceTower}
                onBoardRightClick={handleBoardRightClick}
                onTowerRightClick={handleSellTower}
                shopSelectedType={shopSelectedType}
                previewPos={previewPos}
                previewValid={previewPos ? !isPointOnPath(previewPos.x, previewPos.y) : false}
                onBoardMouseMove={handleBoardMouseMove}
                enemies={enemies}
                onEnemyEscape={(id, penalty) => handleEnemyEscape(id, penalty)}
                selectedTower={selectedTower}
                scale={boardScale}
              />
            </div>
          </div>

          <div className="bottom-ticker">
            <QuizFacts onHistoryUpdate={(h) => setFactsHistory(h)} />
          </div>
        </div>
      </main>

      <aside className="right-panel panel">
        {selectedTower ? (
          <TowerInfo
            type={selectedTower.type} level={selectedTower.level}
            cooldown={selectedTower.cooldown || 0} targetingMode={selectedTower.targetingMode || 'first'}
            onTargetingChange={(mode) => handleTargetingChange(selectedTower.id, mode)}
            onUpgrade={() => handleUpgrade(selectedTower.id)} onSell={() => handleSellTower(selectedTower.id)}
          />
        ) : (
          <TowerShop money={money} selectedType={shopSelectedType} onSelectType={handleSelectShopTower} />
        )}
      </aside>

      <Quiz 
        open={quizOpen} 
        questionData={quizQuestion} 
        baseReward={pendingWaveResult?.reward} 
        onClose={handleQuizClose} 
      />
    </div>
  );
};

export default App;