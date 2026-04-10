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
  const [wave, setWave] = useState(1);
  const [money, setMoney] = useState(500);
  const [waveActive, setWaveActive] = useState(false);

  const [towers, setTowers] = useState([]);
  const [selectedTowerId, setSelectedTowerId] = useState(null);
  const [enemies, setEnemies] = useState([]);
  
  // refs to access latest state inside the game loop
  const enemiesRef = useRef(enemies);
  const towersRef = useRef(towers);

  // theme state: light | dark — default from system preference (synchronous when possible)
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
  }, []);

  // sklep
  const [shopSelectedType, setShopSelectedType] = useState(null);

  // podglad pozycji wybranej wieżyczki (kursor)
  const [previewPos, setPreviewPos] = useState(null);

  // historia pokazanych ciekawostek
  const [factsHistory, setFactsHistory] = useState([]);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState(null);
  const [pendingWaveResult, setPendingWaveResult] = useState(null); // { reward, wave }

  const handleUpgrade = (towerId) => {
    const tower = towers.find((t) => t.id === towerId);
    if (!tower) return;

    const nextLevel = tower.level + 1;
    const upgradeData = towerConfig[tower.type].levels[nextLevel];
    if (!upgradeData || money < upgradeData.cost) return;

    setMoney((prevMoney) => prevMoney - upgradeData.cost);
    setTowers((prevTowers) =>
      prevTowers.map((t) =>
        t.id === towerId ? { ...t, level: nextLevel } : t
      )
    );
  };

  const handleStartWave = () => {
    if (waveActive) return;

    const waveData = waveConfig.waves[wave - 1];
    if (!waveData) return;

    // policz ile przeciwników w fali
    let totalCount = 0;
    waveData.enemies.forEach(({ count }) => (totalCount += count));

    const newEnemies = [];
    let orderIndex = 0;
    waveData.enemies.forEach(({ type, count }) => {
      for (let i = 0; i < count; i++) {
        newEnemies.push({
          id: `${type}-${Date.now()}-${orderIndex}`,
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
  };

  const handleEnemyEscape = (enemyId, damage = 0) => {
    setEnemies((prev) => prev.filter(e => e.id !== enemyId));
    // upewniamy się że damage jest liczbą i nie jest undefined
    const healthDamage = Number(damage) || 0;
    setHealth((prev) => Math.max(0, prev + healthDamage)); // damage jest ujemne, więc dodajemy
  };

  // Keep refs in sync with latest state so the loop reads current values
  useEffect(() => { enemiesRef.current = enemies; }, [enemies]);
  useEffect(() => { towersRef.current = towers; }, [towers]);

  // Consolidated game loop: handles spawning, movement, escapes and shooting
  useEffect(() => {
    if (!waveActive) return undefined;
    const tickMs = 33; // ~30 FPS game tick (≈30fps)

    const interval = setInterval(() => {
      const prevEnemies = enemiesRef.current || [];
      const prevTowers = towersRef.current || [];

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

      // Speeds in config were previously treated as pixels per 100ms.
      const speedScale = tickMs / 100;

      // Movement & spawn pass
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
          const newPosition = { ...next };
          if (newPathIndex >= path.length - 1) {
            escapeDamageTotal += enemyConfig[enemy.type]?.damageOnEscape || 0;
            return null;
          }
          return { ...enemy, position: newPosition, pathIndex: newPathIndex };
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

      // Shooting pass: update towers and apply damage to movedEnemies
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
            const rangeVal = towerData.levels[level].range;
            return distance <= rangeVal;
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

      // Remove dead enemies after shooting
      updatedEnemies = updatedEnemies.filter(e => e.health > 0);

      // Commit state updates (do health update outside of enemy updater to avoid nested setState)
      if (escapeDamageTotal !== 0) {
        setHealth((prev) => Math.max(0, prev + escapeDamageTotal));
      }

      setEnemies(updatedEnemies);
      setTowers(updatedTowers);
    }, tickMs);

    return () => clearInterval(interval);
  }, [waveActive]);

  // Helper function to check if an enemy is in tower's range
  const isInRange = (tower, enemy) => {
    if (!enemy.position) return false;
    const towerData = towerConfig[tower.type];
    if (!towerData) return false;

    const level = Math.min(tower.level, towerData.levels.length - 1);
    const range = towerData.levels[level].range; // range is stored as radius in config

    // Calculate distance from tower center to enemy
    const towerCenterX = tower.x + 20; // half of tower size (40/2)
    const towerCenterY = tower.y + 20;
    const dx = enemy.position.x - towerCenterX;
    const dy = enemy.position.y - towerCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= range;
  };

  const handleTargetingChange = (towerId, mode) => {
    setTowers((prevTowers) =>
      prevTowers.map((tower) =>
        tower.id === towerId ? { ...tower, targetingMode: mode } : tower
      )
    );
  };

  // shooting is handled inside the consolidated game loop

  useEffect(() => {
    if (
      waveActive &&
      ((enemies.length === 0) || // fala kończy się gdy nie ma już enemies
       (enemies.length > 0 && enemies.every((e) => e.health <= 0 || e.escaped)))
    ) {
      const reward = waveConfig.waves[wave - 1]?.reward || 0;

      // wybór pytania na podstawie wcześniej pokazanych ciekawostek
      // znajdź fakt z historii (jeśli brak -> losowe pytanie z pliku)
      let chosenQuestion = null;
      const questions = waveConfig.questions || []; // fallback
      const qc = quizConfig || {};
      const allQuestions = Array.isArray(qc.questions) ? qc.questions : [];

      if (factsHistory && factsHistory.length > 0) {
        // wybierz losowo jedną z pokazanych ciekawostek
        const pickFact = factsHistory[Math.floor(Math.random() * factsHistory.length)].fact;
        // szukaj pytania powiązanego z tą ciekawostką
        const qCandidates = allQuestions.filter((q) => q && q.question && q.fact && String(q.fact).trim() === String(pickFact).trim());
        if (qCandidates.length) {
          chosenQuestion = qCandidates[Math.floor(Math.random() * qCandidates.length)];
        }
      }

      if (!chosenQuestion) {
        // fallback: pick any question object that has a questions
        const qCandidates = allQuestions.filter((q) => q && q.question);
        if (qCandidates.length) chosenQuestion = qCandidates[Math.floor(Math.random() * qCandidates.length)];
      }

      // jeśli mamy pytanie, pokaż modal quiz przed rozliczeniem fali
      if (chosenQuestion) {
        setQuizQuestion(chosenQuestion);
        setPendingWaveResult({ reward, waveNumber: wave });
        setQuizOpen(true);
      } else {
        // brak pytania -> natychmiast rozlicz falę
        setMoney((prev) => prev + reward);
        setWave((prev) => prev + 1);
        setEnemies([]);
        setWaveActive(false);
      }
    }
  }, [enemies, waveActive, wave, factsHistory]);

  // handler zamknięcia quizu (onClose receives boolean isCorrect)
  const handleQuizClose = (isCorrect) => {
    // przyznaj nagrodę (możemy dać bonus za poprawną odpowiedź)
    const base = pendingWaveResult?.reward || 0;
    const bonus = isCorrect ? Math.floor(base * 0.25) : 0; // 25% bonus za poprawną odpowiedź
    setMoney((prev) => prev + base + bonus);
    setWave((prev) => prev + 1);
    setEnemies([]);
    setWaveActive(false);
    setPendingWaveResult(null);
    setQuizOpen(false);
    setQuizQuestion(null);
  };

  // helper: czy punkt leży na ścieżce (odpowiednio do mapConfig.path i pathWidth)
  const isPointOnPath = (x, y) => {
    const path = mapConfig.path;
    const half = mapConfig.pathWidth / 2;
    // distance from point to segment
    const distToSegment = (px, py, x1, y1, x2, y2) => {
      const vx = x2 - x1;
      const vy = y2 - y1;
      const wx = px - x1;
      const wy = py - y1;
      const c1 = vx * wx + vy * wy;
      if (c1 <= 0) return Math.hypot(px - x1, py - y1);
      const c2 = vx * vx + vy * vy;
      if (c2 <= c1) return Math.hypot(px - x2, py - y2);
      const b = c1 / c2;
      const bx = x1 + b * vx;
      const by = y1 + b * vy;
      return Math.hypot(px - bx, py - by);
    };

    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];
      const d = distToSegment(x, y, p1.x, p1.y, p2.x, p2.y);
      if (d <= half) return true;
    }
    return false;
  };

  const handleSelectShopTower = (type) => {
    setShopSelectedType(type);
    setPreviewPos(null);
  };

  // obsługa poruszania kursorem na planszy (ustawia preview)
  const handleBoardMouseMove = (x, y) => {
    if (!shopSelectedType) return;
    setPreviewPos({ x, y });
  };

  // Handle right-click (contextmenu) on the board: deselect picker or selected tower
  const handleBoardRightClick = () => {
    if (shopSelectedType) {
      setShopSelectedType(null);
      setPreviewPos(null);
      return;
    }

    if (selectedTowerId) {
      setSelectedTowerId(null);
    }
  };

  // obsługa kliknięć poza planszą
  useEffect(() => {
    const handleOutsideClick = (e) => {
      // Sprawdź czy kliknięcie było poza planszą i sklep i czy mamy wybraną wieżyczkę
      if (shopSelectedType && 
          !e.target.closest('.game-board') && 
          !e.target.closest('.tower-shop')) {
        setShopSelectedType(null);
        setPreviewPos(null);
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [shopSelectedType]);

  const handlePlaceTower = (x, y) => {
    // Jeśli nie ma wybranej wieży w sklepie, to kliknięcie powinno zresetować zaznaczenie
    if (!shopSelectedType) {
      setSelectedTowerId(null);
      return;
    }

    // Jeśli próba postawienia na ścieżce, odznacz wybraną wieżyczkę
    if (isPointOnPath(x, y)) {
      setShopSelectedType(null);
      setPreviewPos(null);
      return;
    }

    const TOWER_SIZE = 40;
    const half = TOWER_SIZE / 2;

    // używamy środka (kursor) do sprawdzenia czy można postawić (nie na ścieżce)
    if (isPointOnPath(x, y)) {
      // eslint-disable-next-line no-alert
      alert('Nie możesz postawić wieży na ścieżce.');
      return;
    }

    const levelData = towerConfig[shopSelectedType].levels[0];
    if (!levelData) return;
    const cost = levelData.cost;
    if (money < cost) {
      // eslint-disable-next-line no-alert
      alert('Brak wystarczających środków.');
      return;
    }

    const newTower = {
      id: Date.now(),
      // zapisujemy współrzędne jako lewy-górny róg (tak, żeby rendering Tower używał top-left)
      x: Math.round(x - half),
      y: Math.round(y - half),
      type: shopSelectedType,
      level: 0, // poziom 1
      cooldown: 0 // Dodajemy cooldown (domyślnie 0)
    };

    setMoney((prev) => prev - cost);
    setTowers((prev) => [...prev, newTower]);
    setShopSelectedType(null);
    setPreviewPos(null);
    setSelectedTowerId(null); // Resetuj zaznaczenie wieży po postawieniu nowej
  };

  // sprzedaż wieżyczki: połowa sumy zapłaconych kosztów za wszystkie poziomy aż do obecnego
  const handleSellTower = (towerId) => {
    const tower = towers.find((t) => t.id === towerId);
    if (!tower) return;
    const levels = towerConfig[tower.type].levels;
    const paidSum = levels
      .slice(0, tower.level + 1)
      .reduce((s, lvl) => s + (lvl.cost || 0), 0);
    const sellValue = Math.floor(paidSum / 2);
    setTowers((prev) => prev.filter((t) => t.id !== towerId));
    setMoney((prev) => prev + sellValue);
    // Close upgrade/selection UI if the sold tower was selected
    setSelectedTowerId((prev) => (prev === towerId ? null : prev));
  };

  const selectedTower = towers.find((tower) => tower.id === selectedTowerId);

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
          <div className="game-board panel" style={{ width: mapConfig.board.width, height: mapConfig.board.height }}>
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
            />
          </div>

          <div className="bottom-ticker">
            <QuizFacts onHistoryUpdate={(h) => setFactsHistory(h)} />
          </div>
        </div>
      </main>

      <aside className="right-panel panel">
        {/* Contextual info: show TowerInfo when a tower is selected, otherwise show TowerShop */}
        {selectedTower ? (
          <TowerInfo
            type={selectedTower.type}
            level={selectedTower.level}
            cooldown={selectedTower.cooldown || 0}
            targetingMode={selectedTower.targetingMode || 'first'}
            onTargetingChange={(mode) => handleTargetingChange(selectedTower.id, mode)}
            onUpgrade={() => handleUpgrade(selectedTower.id)}
            onSell={() => handleSellTower(selectedTower.id)}
          />
        ) : (
          <TowerShop
            money={money}
            selectedType={shopSelectedType}
            onSelectType={handleSelectShopTower}
          />
        )}
      </aside>

      {/* Bottom HUD ticker moved into center column */}

      <Quiz open={quizOpen} questionData={quizQuestion} onClose={handleQuizClose} />
    </div>
  );
};

export default App;