// App.jsx
import React, { useEffect, useState } from 'react';
import GameInfo from './components/HUD/GameInfo';
import GameBoard from './components/Board/GameBoard';
import TowerInfo from './components/TowerPanel/TowerInfo';
import WaveManager from './components/HUD/WaveManager';
import TowerShop from './components/TowerPanel/TowerShop';
import './styles/layout.css';
import Quiz from './components/Quiz/Quiz';
import QuizFacts from './components/Quiz/QuizFacts';
import mapConfig from './config/mapConfig.json';

import useBoardScaling from './hooks/useBoardScaling';
import useTowers from './hooks/useTowers';
import useGameLoop from './hooks/useGameLoop';
import useGameState from './hooks/useGameState';

import { generateSingleWaveData } from './utils/waveGenerator'; // Importuj funkcję do generowania pojedynczych fal

const App = () => {
  const boardScale = useBoardScaling();

  const [difficulty, setDifficulty] = useState('Easy');

  // Headless game state/hooks
  const {
    health, setHealth, money, setMoney, wave, setWave,
    factsHistory, setFactsHistory,
    quizOpen, quizQuestion, pendingWaveResult, handleQuizClose,
    syncLoopState,
    currentWaveData // Pobieramy currentWaveData z useGameState
  } = useGameState(difficulty); // Przekazujemy difficulty do useGameState

  const {
    towers, setTowers, selectedTower, selectedTowerId, setSelectedTowerId,
    shopSelectedType,
    handleSelectShopTower, handleBoardRightClick,
    handlePlaceTower, handleSellTower, handleUpgrade, handleTargetingChange
  } = useTowers({ money, setMoney });

  const { enemies, waveActive, startWave, setWaveActive, clearEnemies } = useGameLoop({
    towers,
    setTowers,
    onEnemyEscape: (damage) => setHealth((prev) => Math.max(0, prev + Number(damage) || 0)),
  });

  const [theme, setTheme] = React.useState(() => {
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

  // Sync game loop state into game state (quiz trigger, rewards)
  useEffect(() => {
    syncLoopState(enemies, waveActive, setWaveActive, clearEnemies);
  }, [enemies, waveActive, syncLoopState, setWaveActive, clearEnemies]);

  return (
    <div className={`app ${theme === 'dark' ? 'dark-theme' : 'light-theme'}`}>
      <aside className="left-panel panel">
        <div className="panel-section">
          <GameInfo health={health} wave={wave} money={money} />
        </div>
        <div className="panel-section">
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="difficulty-select" style={{ marginRight: '8px' }}>Poziom trudności:</label>
            <select
              id="difficulty-select"
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value);
                setWave(1); // Resetuj falę przy zmianie trudności
                setHealth(100); // Resetuj zdrowie
                setMoney(500); // Resetuj pieniądze
                setTowers([]); // Usuń wieże
                clearEnemies(); // Usuń wrogów
                setWaveActive(false); // Zatrzymaj aktualną falę
              }}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid var(--border-ui)',
                backgroundColor: 'var(--button-bg)',
                color: 'var(--button-text)',
              }}
            >
              <option value="Easy">Łatwy</option>
              <option value="Normal">Normalny</option>
              <option value="Hard">Trudny</option>
            </select>
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