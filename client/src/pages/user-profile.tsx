import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Users, Share2, Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import SwipeCard from "@/components/swipe-card";
import { queryClient } from "@/lib/queryClient";

interface User {
  id: string;
  createdAt: string;
  lastActiveAt: string;
  preferences?: any;
}

interface BabyName {
  id: string;
  name: string;
  gender: string;
  origin: string;
  meaning: string;
  rank?: number;
  category: string;
}

interface Match {
  nameId: string;
  matchType: 'personal' | 'session';
  sessionId?: string;
  name: BabyName;
}

export default function UserProfile() {
  const { userId } = useParams();
  const [, navigate] = useLocation();
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedGender, setSelectedGender] = useState<'all' | 'boy' | 'girl'>('all');

  // Check if this is the current user's profile
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId && !userId) {
      // Create new user
      fetch('/api/users', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
        .then(res => res.json())
        .then(user => {
          localStorage.setItem('userId', user.id);
          setCurrentUser(user.id);
          navigate(`/u/${user.id}`, { replace: true });
        })
        .catch(err => {
          console.error('Failed to create user:', err);
        });
    } else if (storedUserId) {
      setCurrentUser(storedUserId);
      if (!userId) {
        navigate(`/u/${storedUserId}`, { replace: true });
      }
    }
  }, [userId, navigate]);

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        if (response.status === 404) {
          // User not found, create new one if this is current user
          if (userId === currentUser) {
            const newUserRes = await fetch('/api/users', { method: 'POST' });
            const newUser = await newUserRes.json();
            localStorage.setItem('userId', newUser.id);
            navigate(`/u/${newUser.id}`, { replace: true });
            return newUser;
          }
          throw new Error('User not found');
        }
        throw new Error('Failed to fetch user');
      }
      return response.json();
    },
    enabled: !!userId,
  });

  // Fetch baby names
  const { data: babyNames = [] } = useQuery({
    queryKey: ['babyNames', selectedGender],
    queryFn: async () => {
      const response = await fetch(`/api/baby-names?gender=${selectedGender}`);
      if (!response.ok) throw new Error('Failed to fetch baby names');
      return response.json();
    },
  });

  // Fetch user's swipe history
  const { data: swipeHistory = [] } = useQuery({
    queryKey: ['userSwipes', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/swipes`);
      if (!response.ok) throw new Error('Failed to fetch swipe history');
      return response.json();
    },
    enabled: !!userId,
  });

  // Fetch user's matches
  const { data: matches = [] } = useQuery({
    queryKey: ['userMatches', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/matches`);
      if (!response.ok) throw new Error('Failed to fetch matches');
      return response.json();
    },
    enabled: !!userId,
  });

  // Record swipe mutation
  const swipeMutation = useMutation({
    mutationFn: async ({ nameId, action }: { nameId: string; action: 'like' | 'dislike' }) => {
      const response = await fetch('/api/swipe-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          nameId,
          action,
        }),
      });
      if (!response.ok) throw new Error('Failed to record swipe');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSwipes', userId] });
      queryClient.invalidateQueries({ queryKey: ['userMatches', userId] });
    },
  });

  // Create session for matching
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Failed to create session');
      return response.json();
    },
    onSuccess: (session) => {
      navigate(`/s/${session.id}?u=${userId}`);
    },
  });

  // Filter out already swiped names
  const swipedNameIds = new Set(swipeHistory.map((s: any) => s.nameId));
  const availableNames = babyNames.filter((name: BabyName) => !swipedNameIds.has(name.id));

  const likedNames = swipeHistory.filter((s: any) => s.action === 'like');
  const personalMatches = matches.filter((m: Match) => m.matchType === 'personal');
  const sessionMatches = matches.filter((m: Match) => m.matchType === 'session');

  const copyProfileLink = () => {
    const url = window.location.origin + `/u/${userId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast({
      title: "Link copied!",
      description: "Share this link to continue on another device",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const isOwnProfile = userId === currentUser;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">
            {isOwnProfile ? 'Your Baby Names' : 'Baby Name Profile'}
          </h1>
          {isOwnProfile && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyProfileLink}
              >
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                Copy Link
              </Button>
              <Button
                onClick={() => createSessionMutation.mutate()}
                disabled={createSessionMutation.isPending}
              >
                <Users className="w-4 h-4 mr-2" />
                Match with Partner
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Swipe Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Swipe Names</CardTitle>
                <CardDescription>
                  Swipe right to like, left to dislike
                </CardDescription>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant={selectedGender === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedGender('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={selectedGender === 'boy' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedGender('boy')}
                  >
                    Boys
                  </Button>
                  <Button
                    variant={selectedGender === 'girl' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedGender('girl')}
                  >
                    Girls
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {availableNames.length > 0 ? (
                  <SwipeCard
                    names={availableNames}
                    sessionId=""
                    userId={userId || ''}
                    onSwipe={(nameId, action) => swipeMutation.mutate({ nameId, action })}
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No more names to swipe in this category
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stats Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-pink-500" />
                  Your Favorites
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{likedNames.length}</div>
                <p className="text-sm text-gray-500">Names liked</p>
                {likedNames.length > 0 && (
                  <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                    {likedNames.slice(0, 5).map((swipe: any) => {
                      const name = babyNames.find((n: BabyName) => n.id === swipe.nameId);
                      return name ? (
                        <div key={swipe.id} className="text-sm">
                          {name.name}
                        </div>
                      ) : null;
                    })}
                    {likedNames.length > 5 && (
                      <div className="text-sm text-gray-400">
                        +{likedNames.length - 5} more
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {personalMatches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Personal Picks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {personalMatches.map((match: Match) => (
                      <div key={match.nameId} className="text-sm">
                        {match.name.name}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {sessionMatches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-500" />
                    Partner Matches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {sessionMatches.map((match: Match) => (
                      <div key={`${match.nameId}-${match.sessionId}`} className="text-sm">
                        {match.name.name}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}