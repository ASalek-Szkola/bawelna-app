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
    <div style={{
      marginTop: 8,
      padding: 10,
      background: 'rgba(0,0,0,0.6)',
      color: '#fff',
      borderRadius: 8,
      maxWidth: 900,
      fontSize: 14
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Ciekawostka</div>
      <div style={{ minHeight: 36 }}>{lastFact ? lastFact.fact : 'Brak ciekawostek'}</div>
      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
        Pokazano: {history.length} · Ostatnio: {lastFact ? new Date(lastFact.shownAt).toLocaleTimeString() : '-'}
      </div>
    </div>
  );
};

export default QuizFacts;