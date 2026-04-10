import React, { useState } from 'react';

const shuffle = (arr) => arr.slice().sort(() => Math.random() - 0.5);

const Quiz = ({ open, questionData, onClose }) => {
  const [selected, setSelected] = useState(null);
  const [input, setInput] = useState('');
  const [animating, setAnimating] = useState(false);
  const [result, setResult] = useState(null);

  if (!open) return null;

  const question = questionData?.question ?? null;
  const correct_answer = questionData?.correct_answer ?? null;
  const options = questionData?.options ?? [];

  const hasChoices = options.length > 0;
  const choices = hasChoices ? shuffle([...options, correct_answer]) : null;

  const finalize = (isCorrect) => {
    setAnimating(false);
    setResult(null);
    setSelected(null);
    setInput('');
    onClose && onClose(!!isCorrect);
  };

  const checkAnswer = () => {
    if (animating) return;
    const isCorrect = hasChoices
      ? selected === correct_answer
      : String(input || '').trim().toLowerCase() === String(correct_answer || '').trim().toLowerCase();

    setResult(isCorrect ? 'success' : 'fail');
    setAnimating(true);
    // show animation then finalize
    setTimeout(() => finalize(isCorrect), 600);
  };

  return (
    <div className="quiz-modal" style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--modal-overlay)', zIndex: 9999 }}>
      <div style={{ background: 'var(--modal-bg)', color: 'var(--modal-text)', padding: 20, borderRadius: 12, width: 560, maxWidth: '92%', boxShadow: 'var(--box-shadow)', border: '1px solid var(--border-ui)', transformOrigin: 'center', animation: result === 'success' ? 'quiz-success 420ms ease' : result === 'fail' ? 'quiz-fail 420ms ease' : 'none' }}>
        <h3 style={{ marginTop: 0 }}>Quiz</h3>

        {!questionData ? (
          <div style={{ marginBottom: 12, fontSize: 15 }}>Ładowanie pytania...</div>
        ) : (
          <>
            <div className="quiz-question">{question || 'Pytanie'}</div>

            {hasChoices ? (
              <div style={{ display: 'grid', gap: 8 }}>
                {choices.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setSelected(c)}
                    style={{ padding: '10px 12px', textAlign: 'left', background: selected === c ? 'var(--button-selected-bg)' : 'var(--button-bg)', color: selected === c ? 'var(--button-selected-text)' : 'var(--button-text)', border: '1px solid var(--border-ui)', borderRadius: 8, cursor: 'pointer' }}
                    className="quiz-answer"
                  >
                    {c}
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Wpisz odpowiedź..."
                  style={{ width: '100%', padding: 10, fontSize: 15, boxSizing: 'border-box' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button onClick={() => { if (!animating) onClose && onClose(false); }} style={{ background: 'var(--button-bg)', padding: '8px 12px' }}>Pomiń</button>
              <button onClick={checkAnswer} disabled={animating || (hasChoices ? selected === null : input.trim().length === 0)} style={{ background: 'var(--button-selected-bg)', color: 'var(--button-selected-text)', padding: '8px 12px' }}>{animating ? '...' : 'Sprawdź'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Quiz;