import React, { useState } from 'react';

const shuffle = (arr) => arr.slice().sort(() => Math.random() - 0.5);

const Quiz = ({ open, questionData, onClose }) => {
  const [selected, setSelected] = useState(null);
  const [input, setInput] = useState('');

  if (!open) return null;

  const question = questionData?.question ?? null;
  const correct_answer = questionData?.correct_answer ?? null;
  const options = questionData?.options ?? [];

  const hasChoices = options.length > 0;
  const choices = hasChoices ? shuffle([...options, correct_answer]) : null;

  const checkAnswer = () => {
    const isCorrect = hasChoices
      ? selected === correct_answer
      : String(input || '').trim().toLowerCase() === String(correct_answer || '').trim().toLowerCase();

    onClose && onClose(isCorrect);
    setSelected(null);
    setInput('');
  };

  return (
    <div style={{
      position: 'fixed',
      left: 0, top: 0, right: 0, bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.35)',
      zIndex: 9999
    }}>
      <div style={{ background: '#fff', color: '#111', padding: 18, borderRadius: 10, width: 520, maxWidth: '90%', boxShadow: '0 6px 24px rgba(0,0,0,0.25)' }}>
        <h3 style={{ marginTop: 0 }}>Quiz</h3>

        {!questionData ? (
          <>
            <div style={{ marginBottom: 12, fontSize: 15 }}>Ładowanie pytania...</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button onClick={() => onClose && onClose(false)} style={{ background: '#ddd' }}>Pomiń</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 12, fontSize: 15 }}>{question || 'Pytanie'}</div>

            {hasChoices ? (
              <div style={{ display: 'grid', gap: 8 }}>
                {choices.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setSelected(c)}
                    style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      background: selected === c ? '#4caf50' : '#f3f3f3',
                      color: selected === c ? '#fff' : '#111',
                      border: '1px solid #ddd',
                      borderRadius: 6,
                      cursor: 'pointer'
                    }}
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
                  style={{ width: '100%', padding: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button onClick={() => onClose(false)} style={{ background: '#ddd' }}>Pomiń</button>
              <button
                onClick={checkAnswer}
                disabled={hasChoices ? selected === null : input.trim().length === 0}
                style={{ background: '#2b8a3e', color: '#fff' }}
              >
                Sprawdź
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Quiz;