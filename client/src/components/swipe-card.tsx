import { useState, useRef } from "react";
import { Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useSwipe } from "@/hooks/use-swipe";
import type { BabyName, SwipeActionType } from "@shared/schema";

interface SwipeCardProps {
  names: BabyName[];
  sessionId: string;
  userId: string;
  onSwipe: (nameId: string, action: SwipeActionType) => void;
}

export default function SwipeCard({ names, sessionId, userId, onSwipe }: SwipeCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const swipeActionMutation = useMutation({
    mutationFn: async (data: { nameId: string; action: SwipeActionType }) => {
      const response = await apiRequest("POST", "/api/swipe-actions", {
        sessionId,
        userId,
        nameId: data.nameId,
        action: data.action,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions', sessionId, 'users', userId, 'swipes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sessions', sessionId, 'matches'] });
    },
  });

  const handleSwipe = (action: SwipeActionType) => {
    if (isAnimating || currentIndex >= names.length) return;
    
    const currentName = names[currentIndex];
    setIsAnimating(true);
    
    // Add animation class
    const card = cardRef.current;
    if (card) {
      card.classList.add(action === 'like' ? 'swipe-right' : 'swipe-left');
    }
    
    // Record swipe action
    swipeActionMutation.mutate({ nameId: currentName.id, action });
    onSwipe(currentName.id, action);
    
    // Remove card after animation
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setIsAnimating(false);
      if (card) {
        card.classList.remove('swipe-right', 'swipe-left');
      }
    }, 400);
  };

  const { 
    handleMouseDown, 
    handleMouseMove, 
    handleMouseUp, 
    handleTouchStart, 
    handleTouchMove, 
    handleTouchEnd 
  } = useSwipe({
    onSwipeLeft: () => handleSwipe('dislike'),
    onSwipeRight: () => handleSwipe('like'),
    threshold: 100,
  });

  if (currentIndex >= names.length) {
    return (
      <div className="relative h-96 flex items-center justify-center">
        <div className="text-center">
          <Heart className="text-gray-300 text-4xl mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">All done!</h3>
          <p className="text-gray-500">You've swiped through all available names.</p>
        </div>
      </div>
    );
  }

  const currentName = names[currentIndex];
  const nextName = names[currentIndex + 1];
  const thirdName = names[currentIndex + 2];

  return (
    <div className="relative">
      {/* Card Stack */}
      <div className="card-stack relative h-96 mb-8">
        {/* Third card (background) */}
        {thirdName && (
          <div className="absolute inset-0 bg-white rounded-2xl shadow-md border-2 border-gray-100 transform scale-90 translate-y-5" style={{ zIndex: 1 }}>
            <CardContent name={thirdName} />
          </div>
        )}
        
        {/* Second card (middle) */}
        {nextName && (
          <div className="absolute inset-0 bg-white rounded-2xl shadow-lg border-2 border-gray-100 transform scale-95 translate-y-2.5" style={{ zIndex: 2 }}>
            <CardContent name={nextName} />
          </div>
        )}
        
        {/* First card (top) */}
        <div 
          ref={cardRef}
          className="absolute inset-0 bg-white rounded-2xl shadow-xl border-2 border-gray-100 cursor-grab active:cursor-grabbing transition-transform duration-200 ease-out"
          style={{ zIndex: 3 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <CardContent name={currentName} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-8">
        <Button
          onClick={() => handleSwipe('dislike')}
          disabled={isAnimating}
          className="floating-action w-16 h-16 bg-white rounded-full flex items-center justify-center text-dislike-red hover:bg-red-50 border-2 border-red-100 shadow-lg"
        >
          <X className="h-6 w-6" />
        </Button>
        <Button
          onClick={() => handleSwipe('like')}
          disabled={isAnimating}
          className="floating-action w-16 h-16 bg-white rounded-full flex items-center justify-center text-like-green hover:bg-green-50 border-2 border-green-100 shadow-lg"
        >
          <Heart className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}

interface CardContentProps {
  name: BabyName;
}

function CardContent({ name }: CardContentProps) {
  const genderSymbol = name.gender === 'girl' ? '♀' : '♂';
  const genderColor = name.gender === 'girl' ? 'from-girl-pink to-pink-400' : 'from-boy-blue to-blue-400';

  return (
    <div className="h-full flex flex-col">
      {/* Card Header */}
      <div className="p-6 text-center flex-1 flex flex-col justify-center">
        <div className="mb-4">
          <div className={`w-16 h-16 bg-gradient-to-br ${genderColor} rounded-full mx-auto flex items-center justify-center mb-3`}>
            <span className="text-white text-2xl font-bold">{genderSymbol}</span>
          </div>
        </div>
        <h2 className="text-4xl font-bold text-gray-800 mb-2">{name.name}</h2>
        <p className="text-lg text-gray-600 mb-4">{name.origin} origin</p>
        <p className="text-sm text-gray-500 leading-relaxed">{name.meaning}</p>
      </div>
      
      {/* Card Footer */}
      <div className="p-4 bg-gray-50 rounded-b-2xl">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Rank #{name.rank} in 2023</span>
          <span>{name.category}</span>
        </div>
      </div>
    </div>
  );
}
