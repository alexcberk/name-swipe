import { useState, useRef, useEffect } from "react";
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
  const [exitingCard, setExitingCard] = useState<{ name: BabyName; x: number; rotate: number } | null>(null);
  const isSwipingRef = useRef(false);
  const queryClient = useQueryClient();
  
  // Reset currentIndex when names array changes (e.g., gender filter changes)
  useEffect(() => {
    setCurrentIndex(0);
    setExitingCard(null);
  }, [names]);

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

  const handleSwipe = (action: SwipeActionType, velocity: number = 0) => {
    if (currentIndex >= names.length) return;
    
    const currentName = names[currentIndex];
    
    // Calculate exit distance based on velocity for more dynamic feel
    const baseDistance = 500;
    const velocityMultiplier = Math.min(Math.abs(velocity) / 500, 2);
    const exitDistance = baseDistance * (1 + velocityMultiplier);
    
    // Set the exiting card with animation values
    setExitingCard({
      name: currentName,
      x: action === 'like' ? exitDistance : -exitDistance,
      rotate: action === 'like' ? 45 : -45
    });
    
    // Record swipe action
    swipeActionMutation.mutate({ nameId: currentName.id, action });
    onSwipe(currentName.id, action);
    
    // Immediately move to next card and allow new interactions
    setCurrentIndex(prev => prev + 1);
    
    // Remove exiting card after animation completes
    setTimeout(() => {
      setExitingCard(null);
    }, 400);
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipeThreshold = 100; // Distance threshold
    const velocityThreshold = 500; // Velocity threshold for flinging
    
    // Check if user swiped far enough AND fast enough
    if (Math.abs(offset.x) > swipeThreshold && Math.abs(velocity.x) > velocityThreshold) {
      // Fast swipe - trigger action
      if (offset.x > 0) {
        handleSwipe('like', velocity.x);
      } else {
        handleSwipe('dislike', velocity.x);
      }
    } else if (Math.abs(offset.x) > swipeThreshold * 2) {
      // Very far drag even if slow - trigger action
      if (offset.x > 0) {
        handleSwipe('like', velocity.x);
      } else {
        handleSwipe('dislike', velocity.x);
      }
    }
    // Otherwise, card will snap back to center automatically via the animate prop
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
        {thirdName && !exitingCard && (
          <motion.div 
            className="absolute inset-0 bg-white rounded-2xl shadow-md border-2 border-gray-100"
            style={{ zIndex: 1 }}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 0.9, y: 20 }}
          >
            <CardContent name={thirdName} />
          </motion.div>
        )}
        
        {/* Second card (middle) */}
        {nextName && !exitingCard && (
          <motion.div 
            className="absolute inset-0 bg-white rounded-2xl shadow-lg border-2 border-gray-100"
            style={{ zIndex: 2 }}
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 0.95, y: 10 }}
          >
            <CardContent name={nextName} />
          </motion.div>
        )}
        
        {/* When exiting, show the new stack underneath */}
        {exitingCard && (
          <>
            {/* New third card */}
            {thirdName && (
              <motion.div 
                className="absolute inset-0 bg-white rounded-2xl shadow-md border-2 border-gray-100"
                style={{ zIndex: 1 }}
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 0.9, y: 20 }}
              >
                <CardContent name={thirdName} />
              </motion.div>
            )}
            
            {/* New second card */}
            {nextName && (
              <motion.div 
                className="absolute inset-0 bg-white rounded-2xl shadow-lg border-2 border-gray-100"
                style={{ zIndex: 2 }}
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 0.95, y: 10 }}
              >
                <CardContent name={nextName} />
              </motion.div>
            )}
            
            {/* New first card (what was the second card) */}
            {currentName && (
              <motion.div 
                className="absolute inset-0 bg-white rounded-2xl shadow-xl border-2 border-gray-100 cursor-grab"
                style={{ zIndex: 3 }}
                drag={false}
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <CardContent name={currentName} />
              </motion.div>
            )}
            
            {/* Exiting card on top */}
            <motion.div
              className="absolute inset-0 bg-white rounded-2xl shadow-xl border-2 border-gray-100"
              style={{ zIndex: 4, pointerEvents: 'none' }}
              initial={{ x: 0, rotate: 0, scale: 1.05 }}
              animate={{ 
                x: exitingCard.x, 
                rotate: exitingCard.rotate,
                opacity: 0,
                scale: 0.8
              }}
              transition={{ 
                duration: 0.4, 
                ease: [0.17, 0.67, 0.16, 1.0],
                opacity: { duration: 0.3 }
              }}
            >
              <CardContent name={exitingCard.name} />
            </motion.div>
          </>
        )}
        
        {/* Current top card when not exiting */}
        {!exitingCard && currentName && (
          <motion.div
            className="absolute inset-0 bg-white rounded-2xl shadow-xl border-2 border-gray-100 cursor-grab active:cursor-grabbing"
            style={{ 
              zIndex: 3,
              transformOrigin: "center bottom"
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={1}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            whileDrag={{ 
              scale: 1.02,
              cursor: "grabbing",
            }}
            animate={{ 
              x: 0, 
              rotate: 0,
              scale: 1
            }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              mass: 0.8
            }}
            transformTemplate={({ x, scale }) => {
              // Add rotation based on drag distance
              const dragRotation = typeof x === 'string' ? 0 : (x as number) / 8;
              return `translateX(${x}) rotate(${dragRotation}deg) scale(${scale})`;
            }}
          >
            <CardContent name={currentName} />
          </motion.div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-6">
        <Button
          onClick={() => handleSwipe('dislike', 0)}
          disabled={currentIndex >= names.length}
          className="floating-action w-12 h-12 bg-white rounded-full flex items-center justify-center text-dislike-red hover:bg-red-50 border-2 border-red-100 shadow-lg"
        >
          <X className="h-5 w-5" />
        </Button>
        <Button
          onClick={() => handleSwipe('like', 0)}
          disabled={currentIndex >= names.length}
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
