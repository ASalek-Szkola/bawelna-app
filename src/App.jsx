// App.jsx
import React, { useEffect, useState } from "react";
import GameInfo from "./components/HUD/GameInfo";
import GameBoard from "./components/Board/GameBoard";
import TowerInfo from "./components/TowerPanel/TowerInfo";
import WaveManager from "./components/HUD/WaveManager";
import TowerShop from "./components/TowerPanel/TowerShop";
import "./styles/layout.css";
import Quiz from "./components/Quiz/Quiz";
import QuizFacts from "./components/Quiz/QuizFacts";
import mapConfig from "./config/mapConfig.json";

import useBoardScaling from "./hooks/useBoardScaling";
import useTowers from "./hooks/useTowers";
import useGameLoop from "./hooks/useGameLoop";
import useGameState from "./hooks/useGameState";

import { generateSingleWaveData } from "./utils/waveGenerator"; // Importuj funkcję do generowania pojedynczych fal

const App = () => {
  const boardScale = useBoardScaling();

  const [difficulty, setDifficulty] = useState("Easy");

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
  } = useTowers({ money, setMoney });

  const { enemies, waveActive, startWave, setWaveActive, clearEnemies } =
    useGameLoop({
      towers,
      setTowers,
      onEnemyEscape: (damage) =>
        setHealth((prev) => Math.max(0, prev + Number(damage) || 0)),
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

  return (
    <div className={`app ${theme === "dark" ? "dark-theme" : "light-theme"}`}>
      <aside className="left-panel panel">
        <div className="panel-section">
          <GameInfo health={health} wave={wave} money={money} />
        </div>
        <div className="panel-section">
          <div className="difficulty-select-wrapper">
            <label htmlFor="difficulty-select">Poziom trudności</label>
            <div className="custom-select-container">
              <select
                id="difficulty-select"
                value={difficulty}
                onChange={(e) => {
                  setDifficulty(e.target.value);
                  setWave(1);
                  setHealth(100);
                  setMoney(500);
                  setTowers([]);
                  clearEnemies();
                  setWaveActive(false);
                }}
              >
                <option value="Easy">Łatwy</option>
                <option value="Normal">Normalny</option>
                <option value="Hard">Trudny</option>
              </select>
              <div className="select-arrow" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>
          </div>
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
            className="theme-toggle"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            title={
              theme === "dark"
                ? "Przełącz na tryb jasny"
                : "Przełącz na tryb ciemny"
            }
          >
            {theme === "dark" ? (
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
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
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
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </aside>

      <main className="center-panel">
        <div className="center-inner">
          <div
            className="game-board-wrapper"
            style={{
              width: mapConfig.board.width * boardScale,
              height: mapConfig.board.height * boardScale,
            }}
          >
            <div
              style={{
                width: mapConfig.board.width,
                height: mapConfig.board.height,
                transform: `scale(${boardScale})`,
                transformOrigin: "top left",
                position: "absolute",
                top: 0,
                left: 0,
              }}
            >
              <GameBoard
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
    </div>
  );
};

export default App;
