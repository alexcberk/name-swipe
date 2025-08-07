import { Heart, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

interface BottomNavigationProps {
  activeTab: 'swipe' | 'matches';
  onTabChange: (tab: 'swipe' | 'matches') => void;
}

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  // Get matches count (you'll need to pass sessionId as prop)
  const { data: matches = [] } = useQuery<any[]>({
    queryKey: ['/api/sessions', 'matches'], // This should include actual sessionId
    enabled: false, // Disable for now, enable when sessionId is available
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="max-w-md mx-auto px-4">
        <div className="flex">
          <Button
            variant="ghost"
            className={`flex-1 py-4 text-center transition-colors relative ${
              activeTab === 'swipe' 
                ? 'text-tinder-red border-t-2 border-tinder-red' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
            onClick={() => onTabChange('swipe')}
          >
            <div className="flex flex-col items-center">
              <RotateCcw className="text-xl mb-1 h-5 w-5" />
              <span className="text-xs font-medium">Swipe</span>
            </div>
          </Button>
          
          <Button
            variant="ghost"
            className={`flex-1 py-4 text-center transition-colors relative ${
              activeTab === 'matches' 
                ? 'text-tinder-red border-t-2 border-tinder-red' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
            onClick={() => onTabChange('matches')}
          >
            <div className="flex flex-col items-center">
              <Heart className="text-xl mb-1 h-5 w-5" />
              <span className="text-xs font-medium">Matches</span>
              {matches.length > 0 && (
                <span className="absolute top-2 right-6 w-5 h-5 bg-tinder-red text-white text-xs rounded-full flex items-center justify-center">
                  {matches.length}
                </span>
              )}
            </div>
          </Button>
        </div>
      </div>
    </nav>
  );
}
