import { useRef, useState } from "react";

interface UseSwipeProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 100 }: UseSwipeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const elementRef = useRef<HTMLElement | null>(null);

  const updateTransform = (x: number, y: number) => {
    if (elementRef.current) {
      const rotation = x * 0.1;
      const opacity = 1 - Math.abs(x) / 300;
      elementRef.current.style.transform = `translateX(${x}px) translateY(${y}px) rotate(${rotation}deg)`;
      elementRef.current.style.opacity = opacity.toString();
    }
  };

  const resetTransform = () => {
    if (elementRef.current) {
      elementRef.current.style.transform = 'translateX(0) translateY(0) rotate(0deg)';
      elementRef.current.style.opacity = '1';
    }
  };

  const handleStart = (clientX: number, clientY: number, element: HTMLElement) => {
    setIsDragging(true);
    setStartX(clientX);
    setStartY(clientY);
    setCurrentX(0);
    setCurrentY(0);
    elementRef.current = element;
    
    if (element) {
      element.style.cursor = 'grabbing';
    }
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || !elementRef.current) return;
    
    const deltaX = clientX - startX;
    const deltaY = clientY - startY;
    
    setCurrentX(deltaX);
    setCurrentY(deltaY);
    updateTransform(deltaX, deltaY);
  };

  const handleEnd = () => {
    if (!isDragging || !elementRef.current) return;
    
    setIsDragging(false);
    elementRef.current.style.cursor = 'grab';
    
    if (Math.abs(currentX) > threshold) {
      if (currentX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    } else {
      resetTransform();
    }
    
    setCurrentX(0);
    setCurrentY(0);
    elementRef.current = null;
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY, e.currentTarget);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY, e.currentTarget);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLElement>) => {
    if (e.touches.length === 1 && isDragging) {
      e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLElement>) => {
    if (isDragging) {
      e.preventDefault();
      handleEnd();
    }
  };

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isDragging,
  };
}
