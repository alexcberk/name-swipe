import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Baby, Share2 } from "lucide-react";
import SwipeCard from "@/components/swipe-card";
import BottomNavigation from "@/components/bottom-navigation";
import MatchesView from "@/components/matches-view";
import ShareModal from "@/components/share-modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { generateUUID } from "@/lib/uuid";
import type { BabyName, GenderFilter } from "@shared/schema";

export default function Session() {
  const { sessionId } = useParams();
  const queryClient = useQueryClient();
  const [userId] = useState(() => {
    // Use global user ID that persists across all sessions
    const globalUserId = localStorage.getItem('globalUserId');
    if (globalUserId) return globalUserId;

    // Create new global user ID if none exists
    const newGlobalUserId = generateUUID();
    localStorage.setItem('globalUserId', newGlobalUserId);
    return newGlobalUserId;
  });
  const [activeTab, setActiveTab] = useState<'swipe' | 'matches'>('swipe');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
  const [showShareModal, setShowShareModal] = useState(false);
  const [partnerConnected, setPartnerConnected] = useState(false);
  const { toast } = useToast();
  const [previousMatchCount, setPreviousMatchCount] = useState<number>(0);

  // Fetch session details
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['/api/sessions', sessionId],
    enabled: !!sessionId,
  });

  // Fetch baby names
  const { data: babyNames = [], isLoading: namesLoading } = useQuery<BabyName[]>({
    queryKey: [`/api/baby-names?gender=${genderFilter}`],
  });

  // Fetch user's swipes to filter out already swiped names
  const { data: userSwipes = [] } = useQuery<any[]>({
    queryKey: ['/api/users', userId, 'swipes'],
    enabled: !!sessionId,
  });
  
  // Fetch matches with polling for real-time updates
  const { data: matches = [] } = useQuery<any[]>({
    queryKey: [`/api/sessions/${sessionId}/matches`],
    enabled: !!sessionId,
    refetchInterval: 2000, // Poll every 2 seconds
    refetchIntervalInBackground: true,
  });
  
  // Check for new matches and show toast
  React.useEffect(() => {
    if (matches.length > previousMatchCount && previousMatchCount > 0) {
      toast({
        title: "New Match! ❤️",
        description: "You both liked this name!",
        duration: 1500,
      });
    }
    setPreviousMatchCount(matches.length);
  }, [matches.length, previousMatchCount, toast, setPreviousMatchCount]);
  
  // Check for partner connection status
  const { data: sessionUsers = [] } = useQuery<any[]>({
    queryKey: [`/api/sessions/${sessionId}/users`],
    enabled: !!sessionId,
    refetchInterval: 3000, // Poll every 3 seconds
  });
  
  React.useEffect(() => {
    const hasPartner = sessionUsers.length > 1;
    setPartnerConnected(hasPartner);
  }, [sessionUsers]);

  const availableNames = React.useMemo(() => {
    if (genderFilter === 'all') {
      // Create alternating pattern FIRST, then filter swiped names
      const boyNames = babyNames.filter(name => name.gender === 'boy');
      const girlNames = babyNames.filter(name => name.gender === 'girl');
      
      // Sort by rank to ensure consistent ordering
      boyNames.sort((a, b) => (a.rank || 999) - (b.rank || 999));
      girlNames.sort((a, b) => (a.rank || 999) - (b.rank || 999));
      
      const alternatingNames = [];
      
      // True alternating pattern: boy, girl, boy, girl...
      let boyIndex = 0;
      let girlIndex = 0;
      
      while (boyIndex < boyNames.length || girlIndex < girlNames.length) {
        // Add boy if available
        if (boyIndex < boyNames.length) {
          alternatingNames.push(boyNames[boyIndex]);
          boyIndex++;
        }
        // Add girl if available
        if (girlIndex < girlNames.length) {
          alternatingNames.push(girlNames[girlIndex]);
          girlIndex++;
        }
      }
      
      // Now filter out swiped names while maintaining order
      return alternatingNames.filter(name => 
        !userSwipes.some((swipe: any) => swipe.nameId === name.id)
      );
    }
    
    // For boy/girl specific filters, filter swiped names
    return babyNames.filter(name => 
      !userSwipes.some((swipe: any) => swipe.nameId === name.id)
    );
  }, [babyNames, genderFilter, userSwipes]);

  if (sessionLoading || namesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Baby className="text-tinder-red text-4xl mx-auto mb-4 animate-bounce" />
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Session not found</h2>
          <p className="text-gray-600">This session may have expired or doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-pink-50 to-purple-50 flex flex-col overflow-hidden max-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer">
            <Baby className="text-tinder-red text-xl" />
            <h1 className="text-xl font-bold text-gray-800">BabySwipe</h1>
          </Link>
          <div className="flex items-center space-x-3">
            {/* Gender Filter Toggle */}
            <div className="flex bg-gray-100 rounded-full p-1">
              <Button
                size="sm"
                variant={genderFilter === 'all' ? 'default' : 'ghost'}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                  genderFilter === 'all' ? 'bg-tinder-red text-white hover:bg-tinder-light' : 'text-gray-600'
                }`}
                onClick={() => setGenderFilter('all')}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={genderFilter === 'boy' ? 'default' : 'ghost'}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all flex items-center justify-center ${
                  genderFilter === 'boy' ? 'bg-boy-blue text-white hover:bg-blue-600' : 'text-gray-600'
                }`}
                onClick={() => setGenderFilter('boy')}
              >
                <span className="text-center">♂</span>
              </Button>
              <Button
                size="sm"
                variant={genderFilter === 'girl' ? 'default' : 'ghost'}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all flex items-center justify-center ${
                  genderFilter === 'girl' ? 'bg-girl-pink text-white hover:bg-pink-600' : 'text-gray-600'
                }`}
                onClick={() => setGenderFilter('girl')}
              >
                <span className="text-center">♀</span>
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShareModal(true)}
              className="p-2 text-gray-600 hover:text-tinder-red transition-colors"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 w-full px-0 py-2 pb-20 flex flex-col">
        {activeTab === 'swipe' && (
          <div className="flex-1 overflow-hidden">
            {/* Session Info */}
            <div className="max-w-sm mx-auto w-full px-4 mb-3">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Session ID</p>
                    <p className="font-semibold text-gray-800">#{(session as any)?.shareCode || sessionId?.slice(-6).toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Partner status</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      partnerConnected 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1 ${
                        partnerConnected ? 'bg-green-400' : 'bg-gray-400'
                      }`}></span>
                      {partnerConnected ? 'Connected' : 'Waiting'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Swipe Cards */}
            <SwipeCard
              names={availableNames}
              sessionId={sessionId!}
              userId={userId}
              onSwipe={(nameId, action) => {
                // Invalidate matches after swipe for real-time updates
                setTimeout(() => {
                  queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/matches`] });
                }, 500);
              }}
            />
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="flex-1 overflow-y-auto">
            <MatchesView sessionId={sessionId!} userId={userId} genderFilter={genderFilter} />
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} sessionId={sessionId} />

      {/* Share Modal */}
      <ShareModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        sessionId={sessionId!}
      />
    </div>
  );
}
