import { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import quizConfig from '../../config/quizConfig.json';
import '../../styles/QuizFacts.css';

const QuizFacts = ({ onHistoryUpdate, intervalMs = 8000, maxHistory = 50 }) => {
  const facts = Array.isArray(quizConfig.questions)
    ? quizConfig.questions.map((q, i) => ({ id: i, fact: q.fact || null })).filter((f) => f.fact).map((f, idx) => ({ ...f, uid: `fact-${f.id}-${idx}` }))
    : [];

  const [history, setHistory] = useState(() => {
    try {
      const raw = localStorage.getItem('quizFactsHistory');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Use ref to avoid stale closure in the interval
  const historyRef = useRef(history);
  useEffect(() => { historyRef.current = history; }, [history]);

  const lastFact = history.length ? history[history.length - 1] : null;

  useEffect(() => {
    const tick = () => {
      if (!facts.length) return;
      
      const currentHistory = historyRef.current;
      const currentLast = currentHistory.length ? currentHistory[currentHistory.length - 1] : null;
      
      let pick = facts[Math.floor(Math.random() * facts.length)];
      
      // Unikaj powtórzenia tego samego faktu pod rząd, jeśli mamy ich więcej niż 1
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
  }, [intervalMs, maxHistory]);

  return (
    <div className="quiz-facts" style={{ display: 'flex', alignItems: 'flex-start', gap: 16, width: '100%', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Ciekawostka:</div>
        <div style={{ color: 'var(--text)', wordBreak: 'break-word', lineHeight: 1.4 }}>{lastFact ? lastFact.fact : 'Brak ciekawostek'}</div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', paddingTop: 2 }}>
        Pokazano: {history.length} · {lastFact ? new Date(lastFact.shownAt).toLocaleTimeString() : '-'}
      </div>
    </div>
  );
};

QuizFacts.propTypes = {
  onHistoryUpdate: PropTypes.func,
  intervalMs: PropTypes.number,
  maxHistory: PropTypes.number,
};

export default QuizFacts;
