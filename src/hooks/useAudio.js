import { useCallback, useRef, useEffect } from 'react';

// Słownik pustych placeholderów (ścieżek do podmienienia na w przyszłości)
const audioFiles = {
  shootBasic: 'src/assets/audio/shoot_basic.mp3',
  shootSniper: 'src/assets/audio/shoot_sniper.mp3',
  shootRapid: 'src/assets/audio/shoot_rapid.mp3',
  shootHeavy: 'src/assets/audio/shoot_heavy.mp3',
  shootFrost: 'src/assets/audio/shoot_frost.mp3', // Nowa wieża
  farmIncome: 'src/assets/audio/farm_income.mp3', // Nowa wieża
  enemyHit: 'src/assets/audio/enemy_hit.mp3',
  enemyDeath: 'src/assets/audio/enemy_death.mp3',
  playerHurt: 'src/assets/audio/player_hurt.mp3',
  quizCorrect: 'src/assets/audio/quiz_correct.mp3',
  quizWrong: 'src/assets/audio/quiz_wrong.mp3',
  waveStart: 'src/assets/audio/wave_start.mp3',
  waveEnd: 'src/assets/audio/wave_end.mp3',
  placeTower: 'src/assets/audio/place_tower.mp3',
  upgradeTower: 'src/assets/audio/upgrade_tower.mp3',
  sellTower: 'src/assets/audio/sell_tower.mp3',
  spellCast: 'src/assets/audio/spell_cast.mp3'
};

export default function useAudio() {
  const audioRefs = useRef({});

  // Gdy dodasz pliki mp3, odkomentuj poniższy blok, aby przeglądarka zaczęła cachować audio
  /*
  useEffect(() => {
    Object.keys(audioFiles).forEach(key => {
      audioRefs.current[key] = new Audio(audioFiles[key]);
      audioRefs.current[key].volume = 0.5; // Domyślna głośność
    });
  }, []);
  */

  const playSound = useCallback((soundName) => {
    // Kiedy będziesz gotowy(a), odkomentuj poniższy blok:
    /*
    const sound = audioRefs.current[soundName];
    if (sound) {
      sound.currentTime = 0; // resetuj do początku na wypadek spamowania
      sound.play().catch(e => console.warn('Brak pliku audio dla:', soundName, e));
    }
    */
  }, []);

  return { playSound };
}
