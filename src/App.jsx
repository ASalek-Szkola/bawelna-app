// \App.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import GameInfo from "./components/HUD/GameInfo";
import GameBoard from "./components/Board/GameBoard";
import TowerInfo from "./components/TowerPanel/TowerInfo";
import WaveManager from "./components/HUD/WaveManager";
import TowerShop from "./components/TowerPanel/TowerShop";
import "./styles/layout.css";
import Quiz from "./components/Quiz/Quiz";
import QuizFacts from "./components/Quiz/QuizFacts";
import SettingsMenu from "./components/Settings/SettingsMenu";
import mapsConfig from "./config/mapsConfig.json";
import towerConfig from "./config/towerConfig.json";

import useBoardScaling from "./hooks/useBoardScaling";
import useTowers from "./hooks/useTowers";
import useGameLoop from "./hooks/useGameLoop";
import useGameState from "./hooks/useGameState";
import { ECONOMY_BALANCE, calculateFarmIncome } from "./utils/economyUtils";

const App = () => {
  const [selectedMapId, setSelectedMapId] = useState(mapsConfig[0].id);
  const currentMapData = useMemo(
    () => mapsConfig.find((m) => m.id === selectedMapId) || mapsConfig[0],
    [selectedMapId],
  );

  const boardScale = useBoardScaling(currentMapData.board);

  const[difficulty, setDifficulty] = useState("Easy");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [altGraphics, setAltGraphics] = useState(false);
  const[disableQuiz, setDisableQuiz] = useState(false);
  const[autoStartNextWave, setAutoStartNextWave] = useState(false);

  const {
    health,
    setHealth,
    money,
    setMoney,
    applyMoneyDelta,
    moneyLedger,
    clearMoneyLedger,
    wave,
    setWave,
    setFactsHistory,
    quizOpen,
    quizQuestion,
    pendingWaveResult,
    handleQuizClose,
    syncLoopState,
    currentWaveData, 
    nextWaveData,
  } = useGameState(difficulty, disableQuiz, selectedMapId); 

  const handleEnemyEscape = useCallback((damage) => {
    const parsedDamage = Number(damage) || 0;
    setHealth((prev) => Math.max(0, prev - parsedDamage));
  }, [setHealth]);

  const handleEnemyKilled = useCallback((reward = 0) => {
    if (reward <= 0) return;
    applyMoneyDelta(reward, 'enemy_kill');
  }, [applyMoneyDelta]);

  const {
    towers,
    setTowers,
    selectedTower,
    setSelectedTowerId,
    shopSelectedType,
    handleSelectShopTower,
    handleBoardRightClick,
    handlePlaceTower,
    handleSellTower,
    handleUpgrade,
    handleTargetingChange,
  } = useTowers({ money, applyMoneyDelta, mapData: currentMapData });

  const { enemies, waveActive, startWave, setWaveActive, clearEnemies, castNuke } =
    useGameLoop({
      towers,
      setTowers,
      onEnemyEscape: handleEnemyEscape,
      onEnemyKilled: handleEnemyKilled,
      mapData: currentMapData,
      gameSpeed,
      isPaused,
    });

  const isGameOver = health <= 0;

  const [theme, setTheme] = React.useState(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setTheme(e.matches ? "dark" : "light");
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  },[]);

  useEffect(() => {
    syncLoopState(enemies, waveActive, setWaveActive, clearEnemies, towers);
  },[enemies, waveActive, syncLoopState, setWaveActive, clearEnemies, towers]);

  useEffect(() => {
    if (!autoStartNextWave) return;
    if (waveActive) return;
    if (isGameOver) return;
    if (quizOpen) return;
    if (pendingWaveResult) return;
    if (!currentWaveData || !currentWaveData.enemies) return;
    if (enemies && enemies.length > 0) return;

    try {
      startWave(currentWaveData);
    } catch {
      /* swallow */
    }
  },[autoStartNextWave, waveActive, enemies, quizOpen, pendingWaveResult, currentWaveData, startWave, isGameOver]);

  useEffect(() => {
    if (!isGameOver || !waveActive) return;
    clearEnemies();
    setWaveActive(false);
  }, [isGameOver, waveActive, clearEnemies, setWaveActive]);

  const handleResetGame = () => {
    setWave(1);
    setHealth(100);
    setMoney(500);
    clearMoneyLedger();
    setSpellCooldown(0);
    setIsPaused(false);
    setTowers([]);
    clearEnemies();
    setWaveActive(false);
  };

  const handleDifficultyChange = (newDifficulty) => {
    setDifficulty(newDifficulty);
    handleResetGame();
  };

  const handleMapChange = (newMapId) => {
    setSelectedMapId(newMapId);
    handleResetGame();
  };

  const[spellCooldown, setSpellCooldown] = useState(0);

  useEffect(() => {
    if (spellCooldown > 0 && !isPaused && waveActive) {
       const t = setTimeout(() => setSpellCooldown(s => s - 1), 1000);
       return () => clearTimeout(t);
    }
  }, [spellCooldown, isPaused, waveActive]);

  const handleCastNuke = () => {
      if (isGameOver) return;
        if (spellCooldown > 0 || money < ECONOMY_BALANCE.nukeCost) return;
        applyMoneyDelta(-ECONOMY_BALANCE.nukeCost, 'nuke_cast', { waveNumber: wave });
        setSpellCooldown(ECONOMY_BALANCE.nukeCooldownSeconds);
      castNuke();
  };

  const currentFarmIncome = useMemo(() => calculateFarmIncome(towers, towerConfig, ECONOMY_BALANCE).total, [towers]);

  return (
    <div className={`app ${theme === "dark" ? "dark-theme" : "light-theme"}`}>
      <aside className="left-panel panel">
        <div className="panel-section">
          <GameInfo
            health={health}
            wave={wave}
            money={money}
            onCastNuke={handleCastNuke}
            spellCooldown={spellCooldown}
            nukeCost={ECONOMY_BALANCE.nukeCost}
            moneyLedger={moneyLedger}
          />
        </div>
        <div className="panel-section">
          <WaveManager
            wave={wave}
            onStartWave={() => {
              if (isGameOver) return;
              startWave(currentWaveData);
            }} 
            waveActive={waveActive}
            enemies={enemies}
            currentWaveData={currentWaveData} 
            nextWaveData={nextWaveData}
            gameSpeed={gameSpeed}
            onGameSpeedChange={setGameSpeed}
            isPaused={isPaused}
            onPauseToggle={() => setIsPaused((p) => !p)}
            autoStartNextWave={autoStartNextWave}
            onAutoStartChange={setAutoStartNextWave}
            gameOver={isGameOver}
            farmIncome={currentFarmIncome}
          />
        </div>
        <div className="sidebar-footer">
          <button
            className="settings-btn"
            onClick={() => setIsSettingsOpen(true)}
            title="Ustawienia"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>
      </aside>

      <main className="center-panel">
        <div className="center-inner">
          <div className="center-board-area">
            <div
              className="game-board-wrapper"
              style={{
                width: currentMapData.board.width * boardScale,
                height: currentMapData.board.height * boardScale,
              }}
            >
              <div
                style={{
                  width: currentMapData.board.width,
                  height: currentMapData.board.height,
                  transform: `scale(${boardScale})`,
                  transformOrigin: "top left",
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
              >
                <GameBoard
                  mapData={currentMapData}
                  towers={towers}
                  onTowerClick={setSelectedTowerId}
                  onBoardClick={handlePlaceTower}
                  onBoardRightClick={handleBoardRightClick}
                  onTowerRightClick={handleSellTower}
                  shopSelectedType={shopSelectedType}
                  enemies={enemies}
                  selectedTower={selectedTower}
                  scale={boardScale}
                  altGraphics={altGraphics}
                />
              </div>
            </div>
          </div>

          <div className="bottom-ticker">
            {!disableQuiz && <QuizFacts onHistoryUpdate={(h) => setFactsHistory(h)} />}
          </div>
        </div>
      </main>

      <aside className="right-panel panel">
        {selectedTower ? (
          <TowerInfo
            type={selectedTower.type}
            level={selectedTower.level}
            cooldown={selectedTower.cooldown || 0}
            targetingMode={selectedTower.targetingMode || "first"}
            onTargetingChange={(mode) =>
              handleTargetingChange(selectedTower.id, mode)
            }
            onUpgrade={() => handleUpgrade(selectedTower.id)}
            onSell={() => handleSellTower(selectedTower.id)}
          />
        ) : (
          <TowerShop
            money={money}
            selectedType={shopSelectedType}
            onSelectType={handleSelectShopTower}
            altGraphics={altGraphics}
          />
        )}
      </aside>

      <Quiz
        open={quizOpen}
        questionData={quizQuestion}
        baseReward={pendingWaveResult?.baseWaveReward}
        onClose={handleQuizClose}
      />

      <SettingsMenu
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        difficulty={difficulty}
        onDifficultyChange={handleDifficultyChange}
        theme={theme}
        onThemeToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        waveActive={waveActive}
        maps={mapsConfig}
        selectedMapId={selectedMapId}
        onMapChange={handleMapChange}
        altGraphics={altGraphics}
        onAltGraphicsToggle={() => setAltGraphics((v) => !v)}
        disableQuiz={disableQuiz}
        onDisableQuizToggle={() => setDisableQuiz((v) => !v)}
      />
    </div>
  );
};

export default App;