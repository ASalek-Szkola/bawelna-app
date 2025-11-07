import React, { useState, useEffect } from 'react';
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
  
  // last shot time for each tower
  const [lastShotTime, setLastShotTime] = useState({});

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

  useEffect(() => {
    const interval = setInterval(() => {
      setEnemies((prevEnemies) => {
        if (!prevEnemies || prevEnemies.length === 0) return prevEnemies;

        const path = mapConfig.path;
        const spawnPoint = path[0];

        // spacing zależny od wielkości fali
        const totalInWave = prevEnemies[0].totalInWave || prevEnemies.length;
        let spacing = 35;
        if (totalInWave > 50) spacing = 8;
        else if (totalInWave > 20) spacing = 16;
        else if (totalInWave > 10) spacing = 24;

        // znajdź najmniejszą odległość od spawnPoint spośród już spawnniętych
        const spawnedPositions = prevEnemies
          .filter((e) => e.spawned && e.position)
          .map((e) => Math.hypot(e.position.x - spawnPoint.x, e.position.y - spawnPoint.y));

        const minDist = spawnedPositions.length ? Math.min(...spawnedPositions) : Infinity;

        // wskaźnik na pierwszego nie-spawnniętego
        const firstNotSpawnedIndex = prevEnemies.findIndex((e) => !e.spawned);

        let spawnedThisTick = false;

        const nextEnemies = prevEnemies.map((enemy, idx) => {
          // SPAWN logic: spawnnij tylko jednego przeciwnika w ticku, gdy warunek odległości spełniony
          if (!enemy.spawned) {
            if (!spawnedThisTick && idx === firstNotSpawnedIndex && (spawnedPositions.length === 0 || minDist >= spacing)) {
              spawnedThisTick = true;
              return {
                ...enemy,
                spawned: true,
                position: { ...spawnPoint },
                pathIndex: 0,
              };
            }
            return enemy;
          }

          // jeśli spawnnięty, ale martwy lub uciekł -> nic nie robimy
          if (enemy.health <= 0 || enemy.escaped) return enemy;

          // ruch wzdłuż ścieżki
          const currentIndex = enemy.pathIndex ?? 0;
          const nextIndex = Math.min(currentIndex + 1, path.length - 1);
          const current = enemy.position ?? path[currentIndex];
          const next = path[nextIndex];

          const dx = next.x - current.x;
          const dy = next.y - current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // speed - interpreted as pixels per tick (100ms)
          const step = enemy.speed;

          // If distance is zero, we're already at the next point.
          if (distance === 0) {
            const newPathIndex = nextIndex;
            const newPosition = { ...next };
            // jeśli dotarł do końca ścieżki
            if (newPathIndex >= path.length - 1 && !enemy.escaped) {
              handleEnemyEscape(enemy.id, enemyConfig[enemy.type]?.damageOnEscape);
              return enemy; // enemy will be removed by handleEnemyEscape
            }
            return { ...enemy, position: newPosition, pathIndex: newPathIndex };
          }

          // Prevent overshoot: clamp ratio to 1 so we snap to next when step >= distance
          const ratio = Math.min(1, step / distance);
          const newX = current.x + dx * ratio;
          const newY = current.y + dy * ratio;
          const reachedNext = ratio >= 1 || (Math.abs(newX - next.x) < 1 && Math.abs(newY - next.y) < 1);

          const newPathIndex = reachedNext ? nextIndex : currentIndex;
          const newPosition = reachedNext ? { ...next } : { x: newX, y: newY };

          // jeśli dotarł do końca ścieżki
          if (newPathIndex >= path.length - 1 && !enemy.escaped) {
            handleEnemyEscape(enemy.id, enemyConfig[enemy.type]?.damageOnEscape);
            return enemy; // ten enemy zostanie usunięty przez handleEnemyEscape
          }

          // Usuń przeciwników którzy zginęli (health <= 0)
          if (enemy.health <= 0) {
            return null; // null entries will be filtered out below
          }

          return { ...enemy, position: newPosition, pathIndex: newPathIndex };
        }).filter(Boolean); // Remove dead enemies (null entries)

        return nextEnemies;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Helper function to check if an enemy is in tower's range
  const isInRange = (tower, enemy) => {
    if (!enemy.position) return false;
    const towerData = towerConfig[tower.type];
    if (!towerData) return false;
    
    const level = Math.min(tower.level, towerData.levels.length - 1);
    const range = towerData.levels[level].range/2; // Używamy pełnego promienia (średnicy)
    
    // Calculate distance from tower center to enemy
    const towerCenterX = tower.x + 20; // half of tower size (40/2)
    const towerCenterY = tower.y + 20;
    const dx = enemy.position.x - towerCenterX;
    const dy = enemy.position.y - towerCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance <= range; // Porównujemy z pełnym promieniem
  };

  const handleTargetingChange = (towerId, mode) => {
    setTowers((prevTowers) =>
      prevTowers.map((tower) =>
        tower.id === towerId ? { ...tower, targetingMode: mode } : tower
      )
    );
  };

  // Effect for tower shooting
  useEffect(() => {
    if (!waveActive || enemies.length === 0) return;

    const shootingInterval = setInterval(() => {
      setTowers((prevTowers) =>
        prevTowers.map((tower) => {
          const towerData = towerConfig[tower.type];
          if (!towerData) return tower;

          const level = Math.min(tower.level, towerData.levels.length - 1);
          const { damage, fireRate } = towerData.levels[level];

          // Zmniejsz cooldown wieżyczki
          const newCooldown = Math.max(0, (tower.cooldown || 0) - 1);

          if (newCooldown === 0) {
            // Znajdź cel w zależności od trybu celowania
            const targetEnemy =
              tower.targetingMode === 'strongest'
                ? enemies
                    .filter((enemy) => !enemy.escaped && enemy.health > 0 && isInRange(tower, enemy))
                    .sort((a, b) => b.health - a.health)[0]
                : enemies.find(
                    (enemy) => !enemy.escaped && enemy.health > 0 && isInRange(tower, enemy)
                  );

            if (targetEnemy) {
              // Zadaj obrażenia przeciwnikowi
              setEnemies((prev) =>
                prev.map((enemy) =>
                  enemy.id === targetEnemy.id
                    ? { ...enemy, health: Math.max(0, enemy.health - damage) }
                    : enemy
                ).filter((enemy) => enemy.health > 0) // Usuń martwych przeciwników
              );

              // Zresetuj cooldown wieżyczki
              return { ...tower, cooldown: fireRate };
            }
          }

          return { ...tower, cooldown: newCooldown };
        })
      );
    }, 1); // Tick co 1 ms

    return () => clearInterval(shootingInterval);
  }, [towers, enemies, waveActive]);

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
    setSelectedTowerId(null);
  };

  const selectedTower = towers.find((tower) => tower.id === selectedTowerId);

  return (
    <div className="app">
      <div className="sidebar">
        <GameInfo health={health} wave={wave} money={money} />
        <WaveManager wave={wave} onStartWave={handleStartWave} waveActive={waveActive} />
        {selectedTower && (
          <TowerInfo
            type={selectedTower.type}
            level={selectedTower.level}
            cooldown={selectedTower.cooldown || 0}
            targetingMode={selectedTower.targetingMode || 'first'} // Default to 'first'
            onTargetingChange={(mode) => handleTargetingChange(selectedTower.id, mode)}
            onUpgrade={() => handleUpgrade(selectedTower.id)}
            onSell={() => handleSellTower(selectedTower.id)}
          />
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <GameBoard
          towers={towers}
          onTowerClick={setSelectedTowerId}
          onBoardClick={handlePlaceTower}
          shopSelectedType={shopSelectedType}
          previewPos={previewPos}
          previewValid={previewPos ? !isPointOnPath(previewPos.x, previewPos.y) : false}
          onBoardMouseMove={handleBoardMouseMove}
          enemies={enemies}
          onEnemyEscape={(id, penalty) => handleEnemyEscape(id, penalty)}
          selectedTower={selectedTower}
        />

        {/* Quiz facts pod planszą */}
        <div style={{ width: mapConfig.board.width, display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <QuizFacts onHistoryUpdate={(h) => setFactsHistory(h)} />
        </div>
      </div>

      <div style={{ width: 280, padding: 16 }}>
        <TowerShop
          money={money}
          selectedType={shopSelectedType}
          onSelectType={handleSelectShopTower}
        />
      </div>

      <Quiz open={quizOpen} questionData={quizQuestion} onClose={handleQuizClose} />
    </div>
  );
};

export default App;