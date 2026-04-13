import React, { useState } from 'react';
import './SettingsMenu.css';

const SettingsMenu = ({ isOpen, onClose, difficulty, onDifficultyChange, theme, onThemeToggle, waveActive }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingDifficulty, setPendingDifficulty] = useState(null);

  if (!isOpen) return null;

  const handleDifficultySelect = (val) => {
    if (waveActive) {
      setPendingDifficulty(val);
      setShowConfirm(true);
    } else {
      onDifficultyChange(val);
    }
  };

  const confirmChange = () => {
    onDifficultyChange(pendingDifficulty);
    setShowConfirm(false);
    setPendingDifficulty(null);
  };

  const cancelChange = () => {
    setShowConfirm(false);
    setPendingDifficulty(null);
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Ustawienia</h2>
          <button className="close-btn" onClick={onClose} aria-label="Zamknij" title="Zamknij">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <label htmlFor="difficulty-select">Poziom trudności</label>
            <div className="custom-select-container">
              <select
                id="difficulty-select"
                value={difficulty}
                onChange={(e) => handleDifficultySelect(e.target.value)}
              >
                <option value="Easy">Łatwy</option>
                <option value="Normal">Normalny</option>
                <option value="Hard">Trudny</option>
              </select>
              <div className="select-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <label>Motyw</label>
            <div className="theme-toggle-wrapper">
              <button
                className="theme-toggle"
                onClick={onThemeToggle}
                title={theme === "dark" ? "Przełącz na tryb jasny" : "Przełącz na tryb ciemny"}
              >
                {theme === "dark" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="confirm-overlay" onClick={cancelChange}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <h3>Zmienić poziom?</h3>
            <p>Fala jest w toku. Jeśli zmienisz poziom trudności, utracisz obecny postęp i gra zacznie się od nowa.</p>
            <div className="confirm-actions">
              <button className="confirm-btn primary" onClick={confirmChange}>Tak, zmień</button>
              <button className="confirm-btn secondary" onClick={cancelChange}>Anuluj</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsMenu;
