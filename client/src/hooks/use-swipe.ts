import { useRef, useCallback } from 'react';

interface UseSwipeProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  threshold?: number;
}

export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 100 }: UseSwipeProps) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const isDragging = useRef(false);
  const hasTriggered = useRef(false);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    startX.current = clientX;
    startY.current = clientY;
    isDragging.current = true;
    hasTriggered.current = false;
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging.current || startX.current === null || startY.current === null) return;

    const deltaX = clientX - startX.current;
    const deltaY = clientY - startY.current;

    // Prevent vertical scrolling during horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe detected - prevent scroll
      return false;
    }
  }, []);

  const handleEnd = useCallback((clientX: number, clientY: number) => {
    if (!isDragging.current || startX.current === null || startY.current === null || hasTriggered.current) return;

    const deltaX = clientX - startX.current;
    const deltaY = clientY - startY.current;

    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
      hasTriggered.current = true;
      if (deltaX > 0) {
        onSwipeRight();
      } else {
        onSwipeLeft();
      }
    }

    startX.current = null;
    startY.current = null;
    isDragging.current = false;
  }, [onSwipeLeft, onSwipeRight, threshold]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return; // Only handle if clicking on the card itself
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  }, [handleStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    return handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleEnd(e.clientX, e.clientY);
  }, [handleEnd]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.target !== e.currentTarget) return; // Only handle if touching the card itself
    e.preventDefault();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  }, [handleStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const shouldPreventDefault = handleMove(touch.clientX, touch.clientY);
    if (shouldPreventDefault === false) {
      e.preventDefault();
    }
  }, [handleMove]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    handleEnd(touch.clientX, touch.clientY);
  }, [handleEnd]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}