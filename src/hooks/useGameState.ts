// \hooks\useGameState.ts
import { useState, useRef, useCallback, useEffect, useMemo, Dispatch, SetStateAction } from 'react';
import quizConfigJson from '../config/quizConfig.json';
import { generateSingleWaveData } from '../utils/waveGenerator';
import towerConfigJson from '../config/towerConfig.json';
import {
  ECONOMY_BALANCE,
  calculateFarmIncome,
  createMoneyLedgerEntry,
  pushMoneyLedgerEntry,
} from '../utils/economyUtils';
import { 
  Enemy, 
  Tower, 
  WaveData, 
  MoneyLedgerEntry, 
  TowerTypeConfig 
} from '../types/game';

const towerConfig = towerConfigJson as Record<string, TowerTypeConfig>;
const quizConfig = quizConfigJson as { questions: any[] };

interface UseGameStateReturn {
  health: number;
  setHealth: Dispatch<SetStateAction<number>>;
  money: number;
  setMoney: Dispatch<SetStateAction<number>>;
  applyMoneyDelta: (amount: number, source?: string, details?: any) => void;
  moneyLedger: MoneyLedgerEntry[];
  clearMoneyLedger: () => void;
  wave: number;
  setWave: Dispatch<SetStateAction<number>>;
  factsHistory: any[];
  setFactsHistory: Dispatch<SetStateAction<any[]>>;
  quizOpen: boolean;
  quizQuestion: any;
  pendingWaveResult: any;
  handleQuizClose: (isCorrect: boolean) => void;
  syncLoopState: (enemies: Enemy[], waveActive: boolean, setWaveActive: any, clearEnemies: any, towers: Tower[]) => void;
  currentWaveData: WaveData;
  nextWaveData: WaveData;
}

export default function useGameState(
  difficulty: string, 
  disableQuiz: boolean = false, 
  seedScope: string = ''
): UseGameStateReturn { 
  const [health, setHealth] = useState(100);
  const [wave, setWave] = useState(1);
  const [money, setMoney] = useState(500);

  const [factsHistory, setFactsHistory] = useState<any[]>([]);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState<any>(null);
  const [usedQuestionsIndices, setUsedQuestionsIndices] = useState<number[]>([]);
  const quizOpeningRef = useRef(false);
  const [pendingWaveResult, setPendingWaveResult] = useState<any>(null);
  const [moneyLedger, setMoneyLedger] = useState<MoneyLedgerEntry[]>([]);

  const clearMoneyLedger = useCallback(() => {
    setMoneyLedger([]);
  }, []);

  const applyMoneyDelta = useCallback((amount: number, source: string = 'adjustment', details: any = {}) => {
    const normalizedAmount = Math.round(Number(amount) || 0);
    if (!normalizedAmount) return;

    setMoney((prev) => Math.max(0, prev + normalizedAmount));
    const entry = createMoneyLedgerEntry({ amount: normalizedAmount, source, wave, details });
    setMoneyLedger((prev) => pushMoneyLedgerEntry(prev, entry));
  }, [wave]);

  const [currentWaveData, setCurrentWaveData] = useState<WaveData>(() =>
    generateSingleWaveData(difficulty, 1, seedScope) 
  );

  useEffect(() => {
    setCurrentWaveData(generateSingleWaveData(difficulty, wave, seedScope));
  }, [difficulty, wave, seedScope]); 

  const nextWaveData = useMemo(
    () => generateSingleWaveData(difficulty, wave + 1, seedScope),
    [difficulty, wave, seedScope]
  );

  const loopControls = useRef<{ setWaveActive: any; clearEnemies: any }>({ 
    setWaveActive: null, 
    clearEnemies: null 
  });

  const syncLoopState = useCallback((
    enemies: Enemy[] = [], 
    waveActive: boolean = false, 
    setWaveActive: any = null, 
    clearEnemies: any = null, 
    towers: Tower[] = []
  ) => {
    loopControls.current.setWaveActive = setWaveActive;
    loopControls.current.clearEnemies = clearEnemies;

    if (!waveActive) return;

    const allDead = enemies.length === 0 || enemies.every((e) => e.health <= 0);

    if (!currentWaveData) {
      console.warn("Brak danych dla bieżącej fali.");
      if (typeof setWaveActive === 'function') setWaveActive(false);
      if (typeof clearEnemies === 'function') clearEnemies();
      return;
    }

    const baseWaveReward = currentWaveData.reward || 0;
    const farmIncomeData = calculateFarmIncome(towers, towerConfig, ECONOMY_BALANCE);
    const farmIncome = farmIncomeData.total;

    if (waveActive && !quizOpen && !quizOpeningRef.current && allDead && !disableQuiz) {
      const allQuestions = Array.isArray(quizConfig?.questions) ? quizConfig.questions : [];

      let availableIndices = allQuestions
        .map((_, i) => i)
        .filter(i => !usedQuestionsIndices.includes(i));

      if (availableIndices.length === 0) {
        availableIndices = allQuestions.map((_, i) => i);
      }

      let chosenIdx = -1;

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

      if (chosenIdx === -1 && availableIndices.length > 0) {
        chosenIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      }

      if (chosenIdx !== -1) {
        const chosenQuestion = { ...allQuestions[chosenIdx], _originalIndex: chosenIdx };
        quizOpeningRef.current = true;
        setQuizQuestion(chosenQuestion);
        setPendingWaveResult({ 
          baseWaveReward, 
          farmIncome, 
          waveNumber: wave, 
          farmCount: Object.keys(farmIncomeData.breakdown).length 
        });
        if (typeof setWaveActive === 'function') setWaveActive(false);
        if (typeof clearEnemies === 'function') clearEnemies();
        setQuizOpen(true);
      } else {
        applyMoneyDelta(baseWaveReward, 'wave_reward', { waveNumber: wave });
        applyMoneyDelta(farmIncome, 'farm_income', { waveNumber: wave, farmCount: Object.keys(farmIncomeData.breakdown).length });
        setWave((prev) => prev + 1); 
        if (typeof clearEnemies === 'function') clearEnemies();
        if (typeof setWaveActive === 'function') setWaveActive(false);
      }
    } else if (waveActive && !quizOpen && !quizOpeningRef.current && allDead && disableQuiz) {
      applyMoneyDelta(baseWaveReward, 'wave_reward', { waveNumber: wave });
      applyMoneyDelta(farmIncome, 'farm_income', { waveNumber: wave, farmCount: Object.keys(farmIncomeData.breakdown).length });
      setWave((prev) => prev + 1);
      if (typeof clearEnemies === 'function') clearEnemies();
      if (typeof setWaveActive === 'function') setWaveActive(false);
    }
  }, [factsHistory, quizOpen, wave, currentWaveData, disableQuiz, usedQuestionsIndices, applyMoneyDelta]); 

  const handleQuizClose = useCallback((isCorrect: boolean) => {
    const base = pendingWaveResult?.baseWaveReward || 0;
    const farmIncome = pendingWaveResult?.farmIncome || 0;
    const waveNumber = pendingWaveResult?.waveNumber || wave;
    const farmCount = pendingWaveResult?.farmCount || 0;
    const bonus = isCorrect ? Math.floor(base * 0.25) : 0;

    applyMoneyDelta(base, 'wave_reward', { waveNumber });
    applyMoneyDelta(farmIncome, 'farm_income', { waveNumber, farmCount });
    applyMoneyDelta(bonus, 'quiz_bonus', { waveNumber, isCorrect });
    setWave((prev) => prev + 1);
    
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
    } catch { /* swallow */ }
  }, [pendingWaveResult, quizQuestion, applyMoneyDelta, wave]);

  return {
    health,
    setHealth,
    money,
    setMoney,
    applyMoneyDelta,
    moneyLedger,
    clearMoneyLedger,
    wave,
    setWave,
    factsHistory,
    setFactsHistory,
    quizOpen,
    quizQuestion,
    pendingWaveResult,
    handleQuizClose,
    syncLoopState,
    currentWaveData, 
    nextWaveData
  };
}
