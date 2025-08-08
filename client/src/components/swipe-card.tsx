import { useState, useRef } from "react";
import { Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion, PanInfo } from "framer-motion";
import type { BabyName, SwipeActionType } from "@shared/schema";

interface SwipeCardProps {
  names: BabyName[];
  sessionId: string;
  userId: string;
  onSwipe: (nameId: string, action: SwipeActionType) => void;
}

export default function SwipeCard({ names, sessionId, userId, onSwipe }: SwipeCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0 });
  const isSwipingRef = useRef(false);
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
    if (currentIndex >= names.length || isSwipingRef.current) return;
    
    isSwipingRef.current = true;
    const currentName = names[currentIndex];
    
    // Record swipe action
    swipeActionMutation.mutate({ nameId: currentName.id, action });
    onSwipe(currentName.id, action);
    
    // Move to next card and reset lock after state updates
    setCurrentIndex(prev => {
      const newIndex = prev + 1;
      setTimeout(() => {
        isSwipingRef.current = false;
      }, 100);
      return newIndex;
    });
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    // Prevent multiple swipes while already swiping
    if (isSwipingRef.current) return;
    
    const { offset, velocity } = info;
    const swipeThreshold = 100;
    const velocityThreshold = 300;
    
    // Check if user swiped far enough or fast enough
    if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > velocityThreshold) {
      if (offset.x > 0) {
        handleSwipe('like');
      } else {
        handleSwipe('dislike');
      }
    }
    // Card will automatically snap back to center if threshold not met
  };

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
    <div className="w-full px-4 flex flex-col items-center">
      {/* Card Stack */}
      <div className="card-stack relative w-full max-w-sm h-80 mb-4">
        {/* Third card (background) */}
        {thirdName && (
          <motion.div 
            className="absolute inset-0 bg-white rounded-2xl shadow-md border-2 border-gray-100"
            style={{ zIndex: 1 }}
            animate={{ scale: 0.9, y: 20 }}
          >
            <CardContent name={thirdName} />
          </motion.div>
        )}
        
        {/* Second card (middle) */}
        {nextName && (
          <motion.div 
            className="absolute inset-0 bg-white rounded-2xl shadow-lg border-2 border-gray-100"
            style={{ zIndex: 2 }}
            animate={{ scale: 0.95, y: 10 }}
          >
            <CardContent name={nextName} />
          </motion.div>
        )}
        
        {/* First card (top) */}
        <motion.div
          className="absolute inset-0 bg-white rounded-2xl shadow-xl border-2 border-gray-100 cursor-grab"
          style={{ zIndex: 3 }}
          drag={isSwipingRef.current ? false : "x"}
          dragConstraints={{ left: -300, right: 300 }}
          dragElastic={0.7}
          dragSnapToOrigin
          onDragEnd={handleDragEnd}
          whileDrag={{ 
            scale: 1.05,
            transition: { duration: 0.1 }
          }}
        >
          <CardContent name={currentName} />
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-6">
        <Button
          onClick={() => handleSwipe('dislike')}
          disabled={isSwipingRef.current}
          className="floating-action w-12 h-12 bg-white rounded-full flex items-center justify-center text-dislike-red hover:bg-red-50 border-2 border-red-100 shadow-lg"
        >
          <X className="h-5 w-5" />
        </Button>
        <Button
          onClick={() => handleSwipe('like')}
          disabled={isSwipingRef.current}
          className="floating-action w-12 h-12 bg-white rounded-full flex items-center justify-center text-like-green hover:bg-green-50 border-2 border-green-100 shadow-lg"
        >
          <Heart className="h-5 w-5" />
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
      <div className="p-4 text-center flex-1 flex flex-col justify-center">
        <div className="mb-3">
          <div className={`w-12 h-12 bg-gradient-to-br ${genderColor} rounded-full mx-auto flex items-center justify-center mb-2`}>
            <span className="text-white text-lg font-bold">{genderSymbol}</span>
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">{name.name}</h2>
        <p className="text-base text-gray-600 mb-3">{name.origin} origin</p>
        <p className="text-xs text-gray-500 leading-relaxed px-2">{name.meaning}</p>
      </div>
      
      {/* Card Footer */}
      <div className="p-3 bg-gray-50 rounded-b-2xl">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Rank #{name.rank}</span>
          <span>{name.category}</span>
        </div>
      </div>
    </div>
  );
}
