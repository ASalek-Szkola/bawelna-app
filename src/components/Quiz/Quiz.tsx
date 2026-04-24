// \components\Quiz\Quiz.tsx
import { useMemo } from 'react';
import '../../styles/Quiz.css';

interface QuestionData {
  question: string;
  options: string[];
  correctIndex: number;
  fact?: string;
}

interface QuizProps {
  open: boolean;
  questionData: QuestionData | null;
  baseReward?: number;
  onClose: (isCorrect: boolean) => void;
}

const shuffle = (array: any[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const Quiz = ({ open, questionData, baseReward = 100, onClose }: QuizProps) => {
  if (!open || !questionData) return null;

  const { options, correctIndex } = questionData;
  const correct_answer = options[correctIndex] ?? null;
  const fact = questionData.fact ?? null;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const choices = useMemo(() => {
    if (!questionData) return [];
    const opts = Array.isArray(options) ? options : [];
    const uniqueChoices = Array.from(new Set(opts));
    return shuffle(uniqueChoices);
  }, [questionData.question]);

  const hasChoices = choices.length > 0;
  const bonus = baseReward ? Math.floor(baseReward * 0.25) : 0;

  return (
    <div className="quiz-overlay">
      <div className="quiz-container panel">
        <h2 className="quiz-title">Bitwa o Wiedzę!</h2>
        <div className="quiz-question">{questionData.question}</div>

        <div className="quiz-choices">
          {hasChoices ? (
            choices.map((choice, i) => (
              <button
                key={`${questionData.question}-${i}`}
                className="quiz-choice-btn"
                onClick={() => onClose(choice === correct_answer)}
              >
                {choice}
              </button>
            ))
          ) : (
            <div className="quiz-error">Błąd: brak odpowiedzi dla tego pytania.</div>
          )}
        </div>

        <div className="quiz-footer">
          <div className="quiz-reward-info">
            Poprawna odpowiedź: <strong>+{bonus} Monet</strong>
          </div>
          {fact && <div className="quiz-fact-hint">Podpowiedź: {fact}</div>}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
