import { useState } from "react";
import { Share2, Copy, MessageCircle, Smartphone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
}

export default function ShareModal({ open, onOpenChange, sessionId }: ShareModalProps) {
  const { toast } = useToast();
  const shareUrl = `${window.location.origin}/session/${sessionId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Copied!",
        description: "Session link copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(`Hey! Let's choose baby names together on BabySwipe: ${shareUrl}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleShareText = () => {
    const message = encodeURIComponent(`Hey! Let's choose baby names together on BabySwipe: ${shareUrl}`);
    window.open(`sms:?body=${message}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-sm mx-4">
        <DialogHeader>
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-tinder-red to-pink-400 rounded-full mx-auto flex items-center justify-center mb-4">
              <Share2 className="text-white text-2xl" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-800 mb-2">
              Share with Your Partner
            </DialogTitle>
            <p className="text-gray-600">Send this link to swipe on names together</p>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <Label className="text-sm font-medium text-gray-700 block mb-2">
              Your session link:
            </Label>
            <div className="flex items-center space-x-2">
              <Input 
                value={shareUrl}
                readOnly
                className="flex-1 bg-white border border-gray-300 text-sm"
              />
              <Button
                onClick={handleCopyLink}
                className="px-3 py-2 bg-tinder-red text-white hover:bg-tinder-light transition-colors text-sm font-medium"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={handleShareWhatsApp}
              className="flex-1 bg-green-500 text-white py-3 hover:bg-green-600 transition-colors font-medium"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
            <Button
              onClick={handleShareText}
              className="flex-1 bg-blue-500 text-white py-3 hover:bg-blue-600 transition-colors font-medium"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Text
            </Button>
          </div>
        </div>
        
        <Button 
          onClick={() => onOpenChange(false)}
          variant="ghost"
          className="w-full mt-4 py-3 text-gray-600 font-medium"
        >
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
}
