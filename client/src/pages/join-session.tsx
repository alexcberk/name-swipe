import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function JoinSession() {
  const { shareCode } = useParams();
  const [, navigate] = useLocation();
  const [userId, setUserId] = useState<string | null>(null);

  // Get or create user
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      // Create new user
      fetch('/api/users', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
        .then(res => res.json())
        .then(user => {
          localStorage.setItem('userId', user.id);
          setUserId(user.id);
        })
        .catch(err => {
          console.error('Failed to create user:', err);
        });
    }
  }, []);

  // Fetch session by share code
  const { data: session, isLoading, error } = useQuery({
    queryKey: ['sessionByCode', shareCode],
    queryFn: async () => {
      const response = await fetch(`/api/sessions/by-code/${shareCode}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Session not found');
        }
        if (response.status === 410) {
          throw new Error('Session expired');
        }
        throw new Error('Failed to fetch session');
      }
      return response.json();
    },
    enabled: !!shareCode,
  });

  // Join session mutation
  const joinSessionMutation = useMutation({
    mutationFn: async () => {
      if (!session || !userId) throw new Error('Missing session or user');
      
      const response = await fetch(`/api/sessions/${session.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to join session');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Joined session!",
        description: "You can now start matching names with your partner",
      });
      navigate(`/s/${session.id}?u=${userId}`);
    },
    onError: (error) => {
      toast({
        title: "Failed to join",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="mt-4 text-gray-600">Looking up session...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Session Not Found</CardTitle>
            <CardDescription>
              {error.message === 'Session expired' 
                ? 'This session has expired. Please ask for a new invitation.'
                : 'This invitation code is invalid or has been removed.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full"
              onClick={() => navigate(userId ? `/u/${userId}` : '/')}
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join Baby Name Session</CardTitle>
          <CardDescription>
            You've been invited to collaborate on baby name selection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Session Code</p>
            <p className="text-2xl font-bold text-blue-600">{shareCode}</p>
          </div>
          
          <Button
            className="w-full"
            onClick={() => joinSessionMutation.mutate()}
            disabled={!userId || !session || joinSessionMutation.isPending}
          >
            {joinSessionMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              'Join Session'
            )}
          </Button>
          
          <p className="text-xs text-center text-gray-500">
            By joining, you'll be able to swipe through names together and see matches in real-time
          </p>
        </CardContent>
      </Card>
    </div>
  );
}