// \hooks\useGameState.js
import { useState, useRef, useCallback, useEffect } from 'react';
import quizConfig from '../config/quizConfig.json';
import { generateSingleWaveData } from '../utils/waveGenerator'; // Importuj generator pojedynczej fali

export default function useGameState(difficulty) { // Teraz przyjmuje 'difficulty'
  const [health, setHealth] = useState(100);
  const [wave, setWave] = useState(1);
  const [money, setMoney] = useState(500);

  const [factsHistory, setFactsHistory] = useState([]);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState(null);
  const quizOpeningRef = useRef(false);
  const [pendingWaveResult, setPendingWaveResult] = useState(null);

  // Stan do przechowywania konfiguracji obecnej fali
  const [currentWaveData, setCurrentWaveData] = useState(() =>
    generateSingleWaveData(difficulty, 1) // Generuj dane dla pierwszej fali
  );

  // Użyj useEffect do generowania danych nowej fali, gdy wave lub difficulty się zmieni
  useEffect(() => {
    setCurrentWaveData(generateSingleWaveData(difficulty, wave));
  }, [difficulty, wave]); // Zależności: difficulty i wave

  const loopControls = useRef({ setWaveActive: null, clearEnemies: null });

  // currentWaveData jest teraz zarządzane wewnętrznie, więc syncLoopState już go nie potrzebuje jako argumentu
  const syncLoopState = useCallback((enemies = [], waveActive = false, setWaveActive = null, clearEnemies = null) => {
    loopControls.current.setWaveActive = setWaveActive;
    loopControls.current.clearEnemies = clearEnemies;

    if (!waveActive) return;

    const allDeadOrEscaped = enemies.length === 0 || (enemies.length > 0 && enemies.every((e) => e.health <= 0 || e.escaped));

    if (!currentWaveData) {
        console.warn("Brak danych dla bieżącej fali. Możliwy błąd w generowaniu fal.");
        if (typeof setWaveActive === 'function') setWaveActive(false);
        if (typeof clearEnemies === 'function') clearEnemies();
        return;
    }

    if (waveActive && !quizOpen && !quizOpeningRef.current && allDeadOrEscaped) {
      const reward = currentWaveData.reward || 0; // Użyj currentWaveData
      let chosenQuestion = null;
      const allQuestions = Array.isArray(quizConfig?.questions) ? quizConfig.questions : [];

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
        quizOpeningRef.current = true;
        setQuizQuestion(chosenQuestion);
        setPendingWaveResult({ reward, waveNumber: wave });
        if (typeof setWaveActive === 'function') setWaveActive(false);
        if (typeof clearEnemies === 'function') clearEnemies();
        setQuizOpen(true);
      } else {
        setMoney((prev) => prev + reward);
        setWave((prev) => prev + 1); // Zwiększenie numeru fali spowoduje regenerację currentWaveData
        if (typeof clearEnemies === 'function') clearEnemies();
        if (typeof setWaveActive === 'function') setWaveActive(false);
      }
    }
  }, [factsHistory, quizOpen, wave, currentWaveData]); // Dodano currentWaveData do zależności

  const handleQuizClose = useCallback((isCorrect) => {
    const base = pendingWaveResult?.reward || 0;
    const bonus = isCorrect ? Math.floor(base * 0.25) : 0;
    setMoney((prev) => prev + base + bonus);
    setWave((prev) => prev + 1); // Zwiększenie numeru fali spowoduje regenerację currentWaveData
    setPendingWaveResult(null);
    quizOpeningRef.current = false;
    setQuizOpen(false);
    setQuizQuestion(null);

    try {
      if (loopControls.current.clearEnemies) loopControls.current.clearEnemies();
      if (typeof loopControls.current.setWaveActive === 'function') loopControls.current.setWaveActive(false);
    } catch (err) { /* swallow */ }
  }, [pendingWaveResult]);

  return {
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
    currentWaveData // Zwracamy currentWaveData
  };
}