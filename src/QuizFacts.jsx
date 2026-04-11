import React, { useEffect, useState } from 'react';
import quizConfig from './config/quizConfig.json';

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

  const lastFact = history.length ? history[history.length - 1] : null;

  useEffect(() => {
    const tick = () => {
      if (!facts.length) return;
      const pick = facts[Math.floor(Math.random() * facts.length)];
      const next = [...history, { ...pick, shownAt: Date.now() }].slice(-maxHistory);
      setHistory(next);
      try {
        localStorage.setItem('quizFactsHistory', JSON.stringify(next));
      } catch {}
      if (onHistoryUpdate) onHistoryUpdate(next);
    };

    if (!history.length) tick();

    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div style={{ fontWeight: 700 }}>Ciekawostka</div>
        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text)' }}>{lastFact ? lastFact.fact : 'Brak ciekawostek'}</div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
        Pokazano: {history.length} · {lastFact ? new Date(lastFact.shownAt).toLocaleTimeString() : '-'}
      </div>
    </div>
  );
};

export default React.memo(QuizFacts);