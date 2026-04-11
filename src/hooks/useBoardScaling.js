import { useState, useEffect } from 'react';
import mapConfig from '../config/mapConfig.json';

export default function useBoardScaling() {
  const [boardScale, setBoardScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      let availableWidth;

      if (w <= 1024) {
        availableWidth = w - 32;
      } else {
        availableWidth = w - 280 - 320 - 64;
      }

      let newScale = Math.min(1, availableWidth / mapConfig.board.width);

      if (w > 1024) {
        let availableHeight = h - 140;
        newScale = Math.min(newScale, availableHeight / mapConfig.board.height);
      }

      setBoardScale(newScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return boardScale;
}
