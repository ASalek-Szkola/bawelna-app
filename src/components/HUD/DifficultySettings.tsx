// \components\HUD\DifficultySettings.tsx
import { memo } from 'react';
import '../../styles/Settings.css';

interface DifficultySettingsProps {
  difficulty: 'Easy' | 'Normal' | 'Hard';
  onDifficultyChange: (diff: 'Easy' | 'Normal' | 'Hard') => void;
  disabled?: boolean;
}

const DifficultySettings = ({ 
  difficulty, 
  onDifficultyChange, 
  disabled = false 
}: DifficultySettingsProps) => {
  const diffs: ('Easy' | 'Normal' | 'Hard')[] = ['Easy', 'Normal', 'Hard'];

  return (
    <div className="settings-panel panel-sm">
      <h4 className="settings-title">Poziom trudności</h4>
      <div className="difficulty-options">
        {diffs.map((d) => (
          <button
            key={d}
            className={`diff-btn ${difficulty === d ? 'active' : ''}`}
            onClick={() => onDifficultyChange(d)}
            disabled={disabled}
            aria-pressed={difficulty === d}
          >
            {d === 'Easy' ? 'Łatwy' : d === 'Normal' ? 'Normalny' : 'Trudny'}
          </button>
        ))}
      </div>
      <p className="settings-hint">Zmienia siłę wrogów i nagrody.</p>
    </div>
  );
};

export default memo(DifficultySettings);
