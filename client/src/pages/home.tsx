import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Baby, Heart, Users, ArrowRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [sessionId, setSessionId] = useState("");
  const { toast } = useToast();

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/sessions");
      return response.json();
    },
    onSuccess: (session) => {
      window.location.href = `/session/${session.id}`;
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateSession = () => {
    createSessionMutation.mutate();
  };

  const handleJoinSession = () => {
    if (!sessionId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a session ID.",
        variant: "destructive",
      });
      return;
    }
    window.location.href = `/session/${sessionId.trim()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto max-w-md px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Baby className="text-tinder-red text-3xl" />
            <h1 className="text-3xl font-bold text-gray-800">BabySwipe</h1>
          </div>
          <p className="text-gray-600">Find your perfect baby name together</p>
        </div>

        {/* Features */}
        <div className="grid gap-4 mb-8">
          <Card className="border-2 border-pink-100">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Heart className="text-tinder-red h-6 w-6" />
                <div>
                  <h3 className="font-semibold text-gray-800">Swipe Together</h3>
                  <p className="text-sm text-gray-600">Both partners swipe on the same names</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-pink-100">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Users className="text-boy-blue h-6 w-6" />
                <div>
                  <h3 className="font-semibold text-gray-800">Real-time Sync</h3>
                  <p className="text-sm text-gray-600">See matches instantly when you both like a name</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="space-y-4">
          {/* Create Session */}
          <Card className="border-2 border-tinder-red/20">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Start a New Session</h3>
                <p className="text-gray-600 mb-4">Create a session and share it with your partner</p>
                <Button 
                  onClick={handleCreateSession}
                  disabled={createSessionMutation.isPending}
                  className="w-full bg-tinder-red hover:bg-tinder-light text-white"
                >
                  {createSessionMutation.isPending ? (
                    "Creating..."
                  ) : (
                    <>
                      Create Session
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Join Session */}
          <Card className="border-2 border-gray-200">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Join a Session</h3>
                  <p className="text-gray-600">Have a session ID from your partner?</p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="sessionId" className="text-sm font-medium text-gray-700">
                      Session ID
                    </Label>
                    <Input
                      id="sessionId"
                      type="text"
                      placeholder="Enter session ID"
                      value={sessionId}
                      onChange={(e) => setSessionId(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleJoinSession}
                    variant="outline"
                    className="w-full border-gray-300 hover:bg-gray-50"
                  >
                    Join Session
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <div className="mt-8 text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">How it works</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>1. Create or join a session</p>
            <p>2. Both partners swipe left or right on baby names</p>
            <p>3. See your matches when you both like the same name</p>
          </div>
        </div>
      </div>
    </div>
  );
}
