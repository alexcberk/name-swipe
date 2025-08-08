import { Heart, HeartCrack, Users, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { babyNamesDatabase } from "@/lib/baby-names";

interface MatchesViewProps {
  sessionId: string;
  userId?: string;
}

export default function MatchesView({ sessionId, userId }: MatchesViewProps) {
  // Get shared matches (both users liked)
  const { data: sharedMatches = [], isLoading: sharedLoading } = useQuery<any[]>({
    queryKey: ['/api/sessions', sessionId, 'matches'],
    enabled: !!sessionId,
  });
  
  // Get individual user matches (just this user's likes)
  const { data: userSwipes = [], isLoading: userLoading } = useQuery<any[]>({
    queryKey: ['/api/sessions', sessionId, 'users', userId, 'swipes'],
    enabled: !!sessionId && !!userId,
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
  const isLoading = sharedLoading || userLoading;

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Heart className="text-tinder-red text-4xl mx-auto mb-4 animate-pulse" />
        <p className="text-gray-600">Loading matches...</p>
      </div>
    );
  }

  const renderMatches = (matches: any[], title: string, subtitle: string, icon: any, emptyMessage: string) => {
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

        {/* Matches Grid */}
        <div className="grid grid-cols-1 gap-3">
          {matches.map((match: any) => {
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
                      {match.users ? (
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
    <div className="w-full px-4 space-y-2">
      <Tabs defaultValue="shared" className="w-full max-w-sm mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="shared" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Shared ({sharedMatches.length})
          </TabsTrigger>
          <TabsTrigger value="yours" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Your Likes ({userLikes.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="shared">
          {renderMatches(
            sharedMatches,
            "Shared Matches",
            "Names you both loved",
            <Users className="text-3xl mb-2 mx-auto" />,
            "Keep swiping to find names you both love!"
          )}
        </TabsContent>
        
        <TabsContent value="yours">
          {renderMatches(
            userLikes,
            "Your Favorites",
            "Names you've liked",
            <User className="text-3xl mb-2 mx-auto" />,
            "Start swiping to build your favorites list!"
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
