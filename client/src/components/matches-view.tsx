import { Heart, HeartCrack } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

interface MatchesViewProps {
  sessionId: string;
}

export default function MatchesView({ sessionId }: MatchesViewProps) {
  const { data: matches = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/sessions', sessionId, 'matches'],
    enabled: !!sessionId,
  });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Heart className="text-tinder-red text-4xl mx-auto mb-4 animate-pulse" />
        <p className="text-gray-600">Loading matches...</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-tinder-red to-tinder-light rounded-xl p-6 text-white text-center">
          <Heart className="text-3xl mb-2 mx-auto" />
          <h2 className="text-xl font-bold mb-1">Your Matches</h2>
          <p className="text-pink-100">Names you both loved</p>
        </div>

        {/* Empty State */}
        <div className="text-center py-12">
          <HeartCrack className="text-4xl text-gray-300 mb-4 mx-auto" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No matches yet</h3>
          <p className="text-gray-500">Keep swiping to find names you both love!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Matches Header */}
      <div className="bg-gradient-to-r from-tinder-red to-tinder-light rounded-xl p-6 text-white text-center">
        <Heart className="text-3xl mb-2 mx-auto" />
        <h2 className="text-xl font-bold mb-1">Your Matches</h2>
        <p className="text-pink-100">Names you both loved</p>
      </div>

      {/* Matches Grid */}
      <div className="grid grid-cols-1 gap-4">
        {matches.map((match: any) => {
          const name = match.name;
          if (!name) return null;

          const genderSymbol = name.gender === 'girl' ? '♀' : '♂';
          const genderColor = name.gender === 'girl' ? 'from-girl-pink to-pink-400' : 'from-boy-blue to-blue-400';

          return (
            <Card key={match.nameId} className="border border-gray-100 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${genderColor} rounded-full flex items-center justify-center`}>
                      <span className="text-white font-bold">{genderSymbol}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{name.name}</h3>
                      <p className="text-sm text-gray-500">{name.origin} origin</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex -space-x-1">
                      {match.users.map((_: any, index: number) => (
                        <div key={index} className="w-6 h-6 bg-like-green rounded-full border-2 border-white flex items-center justify-center">
                          <Heart className="text-white text-xs h-3 w-3" />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Both liked</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
