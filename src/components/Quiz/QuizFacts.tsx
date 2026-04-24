// \components\Quiz\QuizFacts.tsx
import { useEffect, useState, useRef } from 'react';
import quizConfigJson from '../../config/quizConfig.json';
import '../../styles/QuizFacts.css';

const quizConfig = quizConfigJson as { questions: any[] };

interface FactItem {
  id: number;
  fact: string;
  uid: string;
  shownAt?: number;
}

interface QuizFactsProps {
  onHistoryUpdate?: (history: FactItem[]) => void;
  intervalMs?: number;
  maxHistory?: number;
}

const QuizFacts = ({ 
  onHistoryUpdate, 
  intervalMs = 8000, 
  maxHistory = 50 
}: QuizFactsProps) => {
  const facts = useMemo(() => {
    return Array.isArray(quizConfig.questions)
      ? quizConfig.questions
          .map((q, i) => ({ id: i, fact: q.fact || null }))
          .filter((f): f is { id: number; fact: string } => !!f.fact)
          .map((f, idx) => ({ ...f, uid: `fact-${f.id}-${idx}` }))
      : [];
  }, []);

  const [history, setHistory] = useState<FactItem[]>(() => {
    try {
      const raw = localStorage.getItem('quizFactsHistory');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const historyRef = useRef(history);
  useEffect(() => { historyRef.current = history; }, [history]);

  const lastFact = history.length ? history[history.length - 1] : null;

  useEffect(() => {
    const tick = () => {
      if (!facts.length) return;
      
      const currentHistory = historyRef.current;
      const currentLast = currentHistory.length ? currentHistory[currentHistory.length - 1] : null;
      
      let pick = facts[Math.floor(Math.random() * facts.length)];
      
      if (facts.length > 1 && currentLast && pick.id === currentLast.id) {
        const otherFacts = facts.filter(f => f.id !== currentLast.id);
        pick = otherFacts[Math.floor(Math.random() * otherFacts.length)];
      }

      const next = [...currentHistory, { ...pick, shownAt: Date.now() }].slice(-maxHistory);
      setHistory(next);
      try {
        localStorage.setItem('quizFactsHistory', JSON.stringify(next));
      } catch {}
      if (onHistoryUpdate) onHistoryUpdate(next);
    };

    if (!historyRef.current.length) tick();

    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, maxHistory, facts]);

  return (
    <div className="quiz-facts" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', width: '100%', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Ciekawostka:</div>
        <div style={{ wordBreak: 'break-word', lineHeight: 1.4 }}>{lastFact ? lastFact.fact : 'Brak ciekawostek'}</div>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', paddingTop: '2px' }}>
        Pokazano: {history.length} · {lastFact && lastFact.shownAt ? new Date(lastFact.shownAt).toLocaleTimeString() : '-'}
      </div>
    </div>
  );
};

// Internal useMemo for facts
import { useMemo } from 'react';

export default QuizFacts;
