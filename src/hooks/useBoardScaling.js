import { useState, useEffect } from 'react';

export default function useBoardScaling(board) {
  const [boardScale, setBoardScale] = useState(1);

  useEffect(() => {
    if (!board) return;

    const updateScale = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      let availableWidth;

      if (w <= 1024) {
        availableWidth = w - 32;
      } else {
        availableWidth = w - 280 - 320 - 64;
      }

      let newScale = Math.min(1, availableWidth / board.width);

      if (w > 1024) {
        let availableHeight = h - 140;
        newScale = Math.min(newScale, availableHeight / board.height);
      }

      setBoardScale(newScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [board]); // Re-run effect when board changes

  return boardScale;
}
