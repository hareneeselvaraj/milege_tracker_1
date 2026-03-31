import React, { useState, useRef, useCallback } from 'react';
import { Trash2, Edit3 } from 'lucide-react';

/**
 * SwipeableCard — swipe left to reveal delete, swipe right to reveal edit.
 * Uses pure JS touch events, no external libraries needed.
 */
const SwipeableCard = ({ children, onEdit, onDelete, className = '' }) => {
  const cardRef = useRef(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [revealed, setRevealed] = useState(null); // 'edit' | 'delete' | null

  const THRESHOLD = 70;
  const MAX_SWIPE = 80;

  const handleTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX;
    currentX.current = startX.current;
    setSwiping(true);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!swiping) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    
    // Clamp between -MAX_SWIPE and +MAX_SWIPE
    const clampedDiff = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diff));
    setOffset(clampedDiff);
  }, [swiping]);

  const handleTouchEnd = useCallback(() => {
    setSwiping(false);
    
    if (offset < -THRESHOLD) {
      // Swiped left → reveal delete
      setOffset(-MAX_SWIPE);
      setRevealed('delete');
      if (navigator.vibrate) navigator.vibrate(5);
    } else if (offset > THRESHOLD) {
      // Swiped right → reveal edit
      setOffset(MAX_SWIPE);
      setRevealed('edit');
      if (navigator.vibrate) navigator.vibrate(5);
    } else {
      // Spring back
      setOffset(0);
      setRevealed(null);
    }
  }, [offset]);

  const resetSwipe = () => {
    setOffset(0);
    setRevealed(null);
  };

  const handleAction = (action) => {
    if (navigator.vibrate) navigator.vibrate([5, 30, 5]);
    resetSwipe();
    if (action === 'edit') onEdit?.();
    if (action === 'delete') onDelete?.();
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-2xl)' }}>
      {/* Edit action (behind card on left) */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, bottom: 0,
        width: MAX_SWIPE,
        background: 'var(--accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-2xl) 0 0 var(--radius-2xl)',
        cursor: 'pointer',
        opacity: revealed === 'edit' ? 1 : 0.7,
        transition: 'opacity 0.2s',
      }} onClick={() => handleAction('edit')}>
        <Edit3 size={22} color="white" />
      </div>

      {/* Delete action (behind card on right) */}
      <div style={{
        position: 'absolute',
        top: 0, right: 0, bottom: 0,
        width: MAX_SWIPE,
        background: 'var(--danger)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '0 var(--radius-2xl) var(--radius-2xl) 0',
        cursor: 'pointer',
        opacity: revealed === 'delete' ? 1 : 0.7,
        transition: 'opacity 0.2s',
      }} onClick={() => handleAction('delete')}>
        <Trash2 size={22} color="white" />
      </div>

      {/* Main card content */}
      <div
        ref={cardRef}
        className={className}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => { if (revealed) resetSwipe(); }}
        style={{
          transform: `translateX(${offset}px)`,
          transition: swiping ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          zIndex: 1,
          userSelect: 'none',
          touchAction: 'pan-y',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeableCard;
