import { useState, useRef, useCallback } from 'react';
import quizConfig from '../config/quizConfig.json';
import waveConfig from '../config/waveConfig.json';

export default function useGameState() {
  const [health, setHealth] = useState(100);
  const [wave, setWave] = useState(1);
  const [money, setMoney] = useState(500);

  const [factsHistory, setFactsHistory] = useState([]);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState(null);
  const quizOpeningRef = useRef(false);
  const [pendingWaveResult, setPendingWaveResult] = useState(null);

  // store references to loop controls so Quiz close can clear/stop the loop
  const loopControls = useRef({ setWaveActive: null, clearEnemies: null });

  const syncLoopState = useCallback((enemies = [], waveActive = false, setWaveActive = null, clearEnemies = null) => {
    // update stored control functions
    loopControls.current.setWaveActive = setWaveActive;
    loopControls.current.clearEnemies = clearEnemies;

    if (!waveActive) return;

    const allDeadOrEscaped = enemies.length === 0 || (enemies.length > 0 && enemies.every((e) => e.health <= 0 || e.escaped));

    if (waveActive && !quizOpen && !quizOpeningRef.current && allDeadOrEscaped) {
      const reward = waveConfig.waves[wave - 1]?.reward || 0;
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
        setWave((prev) => prev + 1);
        if (typeof clearEnemies === 'function') clearEnemies();
        if (typeof setWaveActive === 'function') setWaveActive(false);
      }
    }
  }, [factsHistory, quizOpen, wave]);

  const handleQuizClose = useCallback((isCorrect) => {
    const base = pendingWaveResult?.reward || 0;
    const bonus = isCorrect ? Math.floor(base * 0.25) : 0;
    setMoney((prev) => prev + base + bonus);
    setWave((prev) => prev + 1);
    setPendingWaveResult(null);
    quizOpeningRef.current = false;
    setQuizOpen(false);
    setQuizQuestion(null);

    // ensure loop cleaned up
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
    syncLoopState
  };
}
