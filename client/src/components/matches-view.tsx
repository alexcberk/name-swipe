import React, { useState } from "react";
import { Heart, HeartCrack, Users, User, ArrowUpDown, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { babyNamesDatabase } from "@/lib/baby-names";
import { apiRequest } from "@/lib/queryClient";

interface MatchesViewProps {
  sessionId: string;
  userId?: string;
}

export default function MatchesView({ sessionId, userId }: MatchesViewProps) {
  const [sortBy, setSortBy] = useState<'alphabetical' | 'popularity'>('alphabetical');
  const queryClient = useQueryClient();
  
  // Get shared matches (both users liked)
  const { data: sharedMatches = [], isLoading: sharedLoading } = useQuery<any[]>({
    queryKey: ['/api/sessions', sessionId, 'matches'],
    enabled: !!sessionId,
  });
  
  // Get individual user swipes (likes and dislikes)
  const { data: userSwipes = [], isLoading: userLoading } = useQuery<any[]>({
    queryKey: ['/api/sessions', sessionId, 'users', userId, 'swipes'],
    enabled: !!sessionId && !!userId,
  });
  
  // Mutation for updating swipe actions
  const swipeActionMutation = useMutation({
    mutationFn: async (data: { nameId: string; action: 'like' | 'dislike' }) => {
      const response = await apiRequest("POST", "/api/swipe-actions", {
        sessionId,
        userId,
        nameId: data.nameId,
        action: data.action,
      });
      return response.json();
    },
    onSuccess: () => {
      // Immediately invalidate queries for fast UI update
      queryClient.invalidateQueries({ queryKey: ['/api/sessions', sessionId, 'users', userId, 'swipes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sessions', sessionId, 'matches'] });
    },
  });
  
  // Enrich user likes with baby name data
  const userLikes = userSwipes
    .filter((swipe: any) => swipe.action === 'like')
    .map((swipe: any) => {
      const babyName = babyNamesDatabase.find(name => name.id === swipe.nameId);
      return {
        ...swipe,
        name: babyName
      };
    })
    .filter((swipe: any) => swipe.name); // Only include swipes where we found the name
  
  // Enrich user dislikes with baby name data
  const userDislikes = userSwipes
    .filter((swipe: any) => swipe.action === 'dislike')
    .map((swipe: any) => {
      const babyName = babyNamesDatabase.find(name => name.id === swipe.nameId);
      return {
        ...swipe,
        name: babyName
      };
    })
    .filter((swipe: any) => swipe.name);
  
  // Sort matches based on selected option
  const sortMatches = (matches: any[]) => {
    if (sortBy === 'alphabetical') {
      return [...matches].sort((a, b) => a.name.name.localeCompare(b.name.name));
    } else {
      // For shared matches, sort by number of users who liked it
      // For individual likes, sort by popularity rank (lower rank = more popular)
      return [...matches].sort((a, b) => {
        if (a.users && b.users) {
          // Both have users array (shared matches) - sort by number of likes
          return b.users.length - a.users.length;
        } else {
          // Individual likes - sort by rank (lower rank = more popular)
          return (a.name.rank || 999) - (b.name.rank || 999);
        }
      });
    }
  };
  const isLoading = sharedLoading || userLoading;

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Heart className="text-tinder-red text-4xl mx-auto mb-4 animate-pulse" />
        <p className="text-gray-600">Loading matches...</p>
      </div>
    );
  }

  const handleSwipeAction = (nameId: string, action: 'like' | 'dislike') => {
    swipeActionMutation.mutate({ nameId, action });
  };

  const renderMatches = (matches: any[], title: string, subtitle: string, icon: any, emptyMessage: string, currentTab: 'shared' | 'likes' | 'dislikes') => {
    if (matches.length === 0) {
      return (
        <div className="space-y-3">
          {/* Header */}
          <div className="bg-gradient-to-r from-tinder-red to-tinder-light rounded-lg p-4 text-white text-center">
            {icon}
            <h2 className="text-lg font-bold mb-1">{title}</h2>
            <p className="text-pink-100 text-sm">{subtitle}</p>
          </div>

          {/* Empty State */}
          <div className="text-center py-8">
            <HeartCrack className="text-3xl text-gray-300 mb-3 mx-auto" />
            <h3 className="text-base font-semibold text-gray-600 mb-2">No matches yet</h3>
            <p className="text-gray-500 text-sm">{emptyMessage}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {/* Header */}
        <div className="bg-gradient-to-r from-tinder-red to-tinder-light rounded-lg p-4 text-white text-center">
          {icon}
          <h2 className="text-lg font-bold mb-1">{title}</h2>
          <p className="text-pink-100 text-sm">{subtitle}</p>
        </div>

        {/* Sort Controls */}
        <div className="flex justify-center mb-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              size="sm"
              variant={sortBy === 'alphabetical' ? 'default' : 'ghost'}
              className={`px-3 py-1 text-xs ${
                sortBy === 'alphabetical' ? 'bg-white shadow-sm' : ''
              }`}
              onClick={() => setSortBy('alphabetical')}
            >
              A-Z
            </Button>
            <Button
              size="sm"
              variant={sortBy === 'popularity' ? 'default' : 'ghost'}
              className={`px-3 py-1 text-xs ${
                sortBy === 'popularity' ? 'bg-white shadow-sm' : ''
              }`}
              onClick={() => setSortBy('popularity')}
            >
              Popular
            </Button>
          </div>
        </div>

        {/* Matches Grid */}
        <div className="grid grid-cols-1 gap-3 pb-4">
          {sortMatches(matches).map((match: any) => {
            const name = match.name;
            if (!name) return null;

            const genderSymbol = name.gender === 'girl' ? '♀' : '♂';
            const genderColor = name.gender === 'girl' ? 'from-girl-pink to-pink-400' : 'from-boy-blue to-blue-400';

            return (
              <Card key={match.nameId || match.id} className="border border-gray-100 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${genderColor} rounded-full flex items-center justify-center`}>
                        <span className="text-white font-bold text-sm">{genderSymbol}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 text-sm">{name.name}</h3>
                        <p className="text-xs text-gray-500">{name.origin} origin</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {currentTab === 'likes' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-8 h-8 p-0 border-red-200 hover:bg-red-50"
                          onClick={() => handleSwipeAction(match.nameId, 'dislike')}
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      ) : currentTab === 'dislikes' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-8 h-8 p-0 border-green-200 hover:bg-green-50"
                          onClick={() => handleSwipeAction(match.nameId, 'like')}
                        >
                          <Heart className="h-4 w-4 text-green-500" />
                        </Button>
                      ) : match.users ? (
                        <div>
                          <div className="flex -space-x-1">
                            {match.users.map((_: any, index: number) => (
                              <div key={index} className="w-6 h-6 bg-like-green rounded-full border-2 border-white flex items-center justify-center">
                                <Heart className="text-white text-xs h-3 w-3" />
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">Both liked</p>
                        </div>
                      ) : (
                        <div className="w-6 h-6 bg-like-green rounded-full flex items-center justify-center">
                          <Heart className="text-white text-xs h-3 w-3" />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full px-4">
      <Tabs defaultValue="shared" className="w-full max-w-sm mx-auto h-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="shared" className="flex items-center gap-1 text-xs">
            <Users className="h-3 w-3" />
            Shared ({sharedMatches.length})
          </TabsTrigger>
          <TabsTrigger value="yours" className="flex items-center gap-1 text-xs">
            <Heart className="h-3 w-3" />
            Likes ({userLikes.length})
          </TabsTrigger>
          <TabsTrigger value="dislikes" className="flex items-center gap-1 text-xs">
            <X className="h-3 w-3" />
            Dislikes ({userDislikes.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="shared">
          <div 
            className="overflow-y-scroll overscroll-y-contain" 
            style={{
              height: 'calc(100vh - 180px)',
              maxHeight: 'calc(100vh - 180px)',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y'
            }}
          >
            {renderMatches(
              sharedMatches,
              "Shared Matches",
              "Names you both loved",
              <Users className="text-3xl mb-2 mx-auto" />,
              "Keep swiping to find names you both love!",
              "shared"
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="yours">
          <div 
            className="overflow-y-scroll overscroll-y-contain" 
            style={{
              height: 'calc(100vh - 180px)',
              maxHeight: 'calc(100vh - 180px)',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y'
            }}
          >
            {renderMatches(
              userLikes,
              "Your Favorites",
              "Names you've liked",
              <User className="text-3xl mb-2 mx-auto" />,
              "Start swiping to build your favorites list!",
              "likes"
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="dislikes">
          <div 
            className="overflow-y-scroll overscroll-y-contain" 
            style={{
              height: 'calc(100vh - 180px)',
              maxHeight: 'calc(100vh - 180px)',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y'
            }}
          >
            {renderMatches(
              userDislikes,
              "Your Dislikes",
              "Names you've disliked",
              <X className="text-3xl mb-2 mx-auto" />,
              "No dislikes yet - keep swiping to see names you've rejected!",
              "dislikes"
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
