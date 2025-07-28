import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, Dices, Sword, Search, Sparkles, Eye, HelpCircle } from "lucide-react";
import type { QuickAction } from "@shared/schema";

interface MessageInputProps {
  sessionId: string;
  characterId: string;
}

const quickActions: { action: QuickAction; label: string; icon: any }[] = [
  { action: 'attack', label: 'Attack', icon: Sword },
  { action: 'investigate', label: 'Investigate', icon: Search },
  { action: 'cast-spell', label: 'Cast Spell', icon: Sparkles },
  { action: 'hide', label: 'Hide', icon: Eye },
  { action: 'help', label: 'Help', icon: HelpCircle },
];

export default function MessageInput({ sessionId, characterId }: MessageInputProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState('');

  const sendMessageMutation = useMutation({
    mutationFn: async (playerAction: string) => {
      const response = await fetch('/api/dm/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerAction,
          sessionId,
          characterId,
        }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/game-state', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['/api/sessions', sessionId, 'messages'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const rollQuickDiceMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/dice/roll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diceType: 'd20',
          modifier: 0,
          sessionId,
          characterId,
          purpose: 'quick_roll',
        }),
      });
      if (!response.ok) throw new Error('Failed to roll dice');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions', sessionId, 'messages'] });
      
      // Create a system message for the dice roll
      fetch(`/api/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'system',
          content: `Quick rolled d20: ${data.result} = ${data.total}`,
          messageType: 'dice_roll',
          metadata: { diceRoll: data },
        }),
      });
      
      toast({
        title: "Quick Roll",
        description: `Rolled d20: ${data.total}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to roll dice",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(message.trim());
  };

  const handleQuickAction = (action: QuickAction) => {
    const actionText = {
      attack: "I attack with my weapon!",
      investigate: "I carefully investigate the area for clues.",
      'cast-spell': "I cast a spell.",
      hide: "I attempt to hide from view.",
      help: "I look for ways to help my allies.",
    }[action];
    
    setMessage(actionText);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="border-t border-fantasy-bronze p-4">
      <form onSubmit={handleSubmit} className="flex space-x-3">
        <div className="flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your action..."
            className="w-full bg-fantasy-slate border-fantasy-bronze text-gray-100 placeholder-gray-400 resize-none focus:ring-fantasy-gold focus:border-fantasy-gold min-h-[60px] max-h-[120px]"
            disabled={sendMessageMutation.isPending}
          />
        </div>
        <div className="flex flex-col space-y-2">
          <Button
            type="submit"
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="bg-fantasy-gold text-fantasy-dark hover:bg-opacity-80 px-6 py-3 font-semibold"
          >
            <Send className="mr-2" size={16} />
            {sendMessageMutation.isPending ? 'Sending...' : 'Send'}
          </Button>
          <Button
            type="button"
            onClick={() => rollQuickDiceMutation.mutate()}
            disabled={rollQuickDiceMutation.isPending}
            variant="outline"
            className="bg-fantasy-slate border-fantasy-bronze hover:bg-gray-700 text-gray-100 px-6 py-2 text-sm"
          >
            <Dices className="mr-2" size={16} />
            Quick d20
          </Button>
        </div>
      </form>

      {/* Quick Actions Bar */}
      <div className="flex space-x-2 mt-3">
        {quickActions.map(({ action, label, icon: Icon }) => (
          <Button
            key={action}
            onClick={() => handleQuickAction(action)}
            variant="ghost"
            size="sm"
            className="bg-gray-700 hover:bg-gray-600 text-gray-100 text-sm"
          >
            <Icon className="mr-1" size={14} />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
