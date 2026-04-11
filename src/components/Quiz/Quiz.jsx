import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../../styles/Quiz.css';

const shuffle = (arr) => arr.slice().sort(() => Math.random() - 0.5);

const Quiz = ({ open, questionData, baseReward, onClose }) => {
  const[selected, setSelected] = useState(null);
  const [input, setInput] = useState('');
  const[result, setResult] = useState(null);

  const question = questionData?.question ?? null;
  const correct_answer = questionData?.correct_answer ?? null;
  const options = questionData?.options ??[];
  const fact = questionData?.fact ?? null;

  const choices = useMemo(() => {
    if (!questionData) return [];
    const opts = Array.isArray(options) ? options :[];
    const allChoices = [...opts, questionData.correct_answer];
    const uniqueChoices = Array.from(new Set(allChoices));
    return shuffle(uniqueChoices);
  }, [questionData]);

  const hasChoices = choices.length > 0;
  const bonus = baseReward ? Math.floor(baseReward * 0.25) : 0;

  useEffect(() => {
    setSelected(null);
    setInput('');
    setResult(null);
  }, [questionData, open]);

  if (!open) return null;

  const finalize = (isCorrect) => {
    setResult(null);
    setSelected(null);
    setInput('');
    onClose && onClose(!!isCorrect);
  };

  const checkAnswer = () => {
    const isCorrect = hasChoices
      ? selected === correct_answer
      : String(input || '').trim().toLowerCase() === String(correct_answer || '').trim().toLowerCase();

    setResult(isCorrect ? 'success' : 'fail');
  };

  const isChecked = result !== null;
  const canCheck = hasChoices ? selected !== null : input.trim().length > 0;

  return (
    <div className="quiz-modal" style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--modal-overlay)', zIndex: 9999 }}>
      <div className="quiz-panel" style={{ background: 'var(--modal-bg)', color: 'var(--modal-text)', padding: 20, borderRadius: 12, width: 560, maxWidth: '92%', boxShadow: 'var(--box-shadow)', border: '1px solid var(--border-ui)', transformOrigin: 'center', animation: result === 'success' ? 'quiz-success 420ms ease' : result === 'fail' ? 'quiz-fail 420ms ease' : 'none' }}>
        <h3 style={{ marginTop: 0 }}>Koniec fali! Bonusowy Quiz</h3>

        {!questionData ? (
          <div style={{ marginBottom: 12, fontSize: 15 }}>Ładowanie pytania...</div>
        ) : (
          <>
            <div className="quiz-question">{question || 'Pytanie'}</div>

            {hasChoices ? (
              <div style={{ display: 'grid', gap: 8 }}>
                {choices.map((c, i) => {
                  let bg = selected === c ? 'var(--button-selected-bg)' : 'var(--button-bg)';
                  let color = selected === c ? 'var(--button-selected-text)' : 'var(--button-text)';
                  let border = '1px solid var(--border-ui)';

                  if (isChecked) {
                    if (c === correct_answer) {
                      bg = 'var(--success-green)';
                      color = '#fff';
                      border = '1px solid var(--success-green)';
                    } else if (c === selected) {
                      bg = 'var(--enemy-health-low)';
                      color = '#fff';
                      border = '1px solid var(--enemy-health-low)';
                    }
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => !isChecked && setSelected(c)}
                      style={{ padding: '10px 12px', textAlign: 'left', background: bg, color: color, border: border, borderRadius: 8, cursor: isChecked ? 'default' : 'pointer', transition: 'all 0.2s' }}
                      className="quiz-answer"
                      disabled={isChecked}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Wpisz odpowiedź..."
                  disabled={isChecked}
                  style={{ width: '100%', padding: 10, fontSize: 15, boxSizing: 'border-box' }}
                />
              </div>
            )}

            {isChecked && (
              <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: 'var(--bg-panel)', border: result === 'success' ? '2px solid var(--success-green)' : '2px solid var(--enemy-health-low)' }}>
                <div style={{ color: result === 'success' ? 'var(--success-green)' : 'var(--enemy-health-low)', fontSize: '1.1rem', marginBottom: 8 }}>
                  <strong>
                    {result === 'success' 
                      ? `Poprawna odpowiedź! Zyskujesz premię +${bonus} monet.` 
                      : `Zła odpowiedź! Poprawna to: ${correct_answer}`}
                  </strong>
                </div>
                {fact && <div style={{ fontSize: 14, color: 'var(--text)' }}><strong>Ciekawostka:</strong> {fact}</div>}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              {!isChecked ? (
                <button 
                  onClick={checkAnswer} 
                  disabled={hasChoices ? selected === null : input.trim().length === 0} 
                  style={{ background: 'var(--button-selected-bg)', color: 'var(--button-selected-text)', padding: '8px 24px', fontWeight: 'bold', opacity: canCheck ? 1 : 0.5, cursor: canCheck ? 'pointer' : 'not-allowed' }}
                >
                  Sprawdź
                </button>
              ) : (
                <button 
                  onClick={() => finalize(result === 'success')} 
                  style={{ background: 'var(--button-selected-bg)', color: 'var(--button-selected-text)', padding: '8px 24px', fontWeight: 'bold' }}
                >
                  Dalej
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

Quiz.propTypes = {
  open: PropTypes.bool,
  questionData: PropTypes.object,
  baseReward: PropTypes.number,
  onClose: PropTypes.func,
};

Quiz.defaultProps = {
  open: false,
};

export default Quiz;
