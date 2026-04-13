// \hooks\useGameState.js
import { useState, useRef, useCallback, useEffect } from 'react';
import quizConfig from '../config/quizConfig.json';
import { generateSingleWaveData } from '../utils/waveGenerator';
import towerConfig from '../config/towerConfig.json';

export default function useGameState(difficulty, disableQuiz = false) { // Teraz przyjmuje 'difficulty' i 'disableQuiz'
  const [health, setHealth] = useState(100);
  const [wave, setWave] = useState(1);
  const [money, setMoney] = useState(500);

  const [factsHistory, setFactsHistory] = useState([]);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState(null);
  const [usedQuestionsIndices, setUsedQuestionsIndices] = useState([]);
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
  const syncLoopState = useCallback((enemies = [], waveActive = false, setWaveActive = null, clearEnemies = null, towers = []) => {
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

    // --- reward i farmIncome dostępne dla obu ścieżek ---
    let reward = currentWaveData.reward || 0;
    const farmIncome = towers.reduce((sum, t) => {
      const tData = towerConfig[t.type];
      if (t.type === 'farm-tower' && tData) {
        const level = Math.min(t.level || 0, tData.levels.length - 1);
        return sum + (tData.levels[level].incomePerWave || 0);
      }
      return sum;
    }, 0);
    reward += farmIncome;

    if (waveActive && !quizOpen && !quizOpeningRef.current && allDeadOrEscaped && !disableQuiz) {
      const allQuestions = Array.isArray(quizConfig?.questions) ? quizConfig.questions : [];

      // Filtrujemy pytania, których jeszcze nie było w tej turze (puli)
      let availableIndices = allQuestions
        .map((_, i) => i)
        .filter(i => !usedQuestionsIndices.includes(i));

      // Jeśli pula się wyczerpała, resetujemy i bierzemy wszystkie
      if (availableIndices.length === 0) {
        availableIndices = allQuestions.map((_, i) => i);
      }

      let chosenIdx = -1;

      // Próba dopasowania do faktu z historii, ale tylko z dostępnych (nieużytych) pytań
      if (factsHistory && factsHistory.length > 0) {
        const pickFact = factsHistory[Math.floor(Math.random() * factsHistory.length)].fact;
        const matchingIndices = availableIndices.filter(idx => {
          const q = allQuestions[idx];
          return q && q.fact && String(q.fact).trim() === String(pickFact).trim();
        });
        if (matchingIndices.length > 0) {
          chosenIdx = matchingIndices[Math.floor(Math.random() * matchingIndices.length)];
        }
      }

      // Jeśli nie dopasowano faktu, wybierz losowo z dostępnych
      if (chosenIdx === -1 && availableIndices.length > 0) {
        chosenIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      }

      if (chosenIdx !== -1) {
        const chosenQuestion = { ...allQuestions[chosenIdx], _originalIndex: chosenIdx };
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
    } else if (waveActive && !quizOpen && !quizOpeningRef.current && allDeadOrEscaped && disableQuiz) {
      // Jeśli disableQuiz, daj nagrodę bezpośrednio i przejdź do następnej fali
      setMoney((prev) => prev + reward);
      setWave((prev) => prev + 1);
      if (typeof clearEnemies === 'function') clearEnemies();
      if (typeof setWaveActive === 'function') setWaveActive(false);
    }
  }, [factsHistory, quizOpen, wave, currentWaveData, disableQuiz]); // Dodano currentWaveData i disableQuiz do zależności

  const handleQuizClose = useCallback((isCorrect) => {
    const base = pendingWaveResult?.reward || 0;
    const bonus = isCorrect ? Math.floor(base * 0.25) : 0;
    setMoney((prev) => prev + base + bonus);
    setWave((prev) => prev + 1);
    
    // Dodaj index pytania do użytych
    if (quizQuestion && quizQuestion._originalIndex !== undefined) {
      setUsedQuestionsIndices(prev => [...prev, quizQuestion._originalIndex]);
    }

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