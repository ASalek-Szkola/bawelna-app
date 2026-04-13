// App.jsx
import React, { useEffect, useState, useMemo } from "react";
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

import useBoardScaling from "./hooks/useBoardScaling";
import useTowers from "./hooks/useTowers";
import useGameLoop from "./hooks/useGameLoop";
import useGameState from "./hooks/useGameState";

import { generateSingleWaveData } from "./utils/waveGenerator"; // Importuj funkcję do generowania pojedynczych fal

const App = () => {
  const [selectedMapId, setSelectedMapId] = useState(mapsConfig[0].id);
  const currentMapData = useMemo(
    () => mapsConfig.find((m) => m.id === selectedMapId) || mapsConfig[0],
    [selectedMapId],
  );

  const boardScale = useBoardScaling(currentMapData.board);

  const [difficulty, setDifficulty] = useState("Easy");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Headless game state/hooks
  const {
    health,
    setHealth,
    money,
    setMoney,
    wave,
    setWave,
    factsHistory,
    setFactsHistory,
    quizOpen,
    quizQuestion,
    pendingWaveResult,
    handleQuizClose,
    syncLoopState,
    currentWaveData, // Pobieramy currentWaveData z useGameState
  } = useGameState(difficulty); // Przekazujemy difficulty do useGameState

  const {
    towers,
    setTowers,
    selectedTower,
    selectedTowerId,
    setSelectedTowerId,
    shopSelectedType,
    handleSelectShopTower,
    handleBoardRightClick,
    handlePlaceTower,
    handleSellTower,
    handleUpgrade,
    handleTargetingChange,
  } = useTowers({ money, setMoney, mapData: currentMapData });

  const { enemies, waveActive, startWave, setWaveActive, clearEnemies } =
    useGameLoop({
      towers,
      setTowers,
      onEnemyEscape: (damage) =>
        setHealth((prev) => Math.max(0, prev + Number(damage) || 0)),
      mapData: currentMapData,
    });

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
  }, []);

  // Sync game loop state into game state (quiz trigger, rewards)
  useEffect(() => {
    syncLoopState(enemies, waveActive, setWaveActive, clearEnemies);
  }, [enemies, waveActive, syncLoopState, setWaveActive, clearEnemies]);

  const handleResetGame = () => {
    setWave(1);
    setHealth(100);
    setMoney(500);
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

  return (
    <div className={`app ${theme === "dark" ? "dark-theme" : "light-theme"}`}>
      <aside className="left-panel panel">
        <div className="panel-section">
          <GameInfo health={health} wave={wave} money={money} />
        </div>
        <div className="panel-section">
          <WaveManager
            wave={wave}
            onStartWave={() => startWave(currentWaveData)} // Przekaż currentWaveData do startWave
            waveActive={waveActive}
            enemies={enemies}
            currentWaveData={currentWaveData} // Przekaż aktualne dane fali
            difficulty={difficulty} // Przekaż difficulty do WaveManager
          />
        </div>
        <div className="sidebar-footer">
          <button
            className="settings-btn"
            onClick={() => setIsSettingsOpen(true)}
            title="Ustawienia"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>
      </aside>

      <main className="center-panel">
        <div className="center-inner">
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
          />
        )}
      </aside>

      <Quiz
        open={quizOpen}
        questionData={quizQuestion}
        baseReward={pendingWaveResult?.reward}
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
      />
    </div>
  );
};

export default App;
