import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dices } from "lucide-react";
import type { DiceType } from "@shared/schema";

interface DiceRollerProps {
  sessionId: string;
  characterId: string;
}

const diceTypes: { type: DiceType; icon: string }[] = [
  { type: 'd4', icon: '△' },
  { type: 'd6', icon: '⚀' },
  { type: 'd8', icon: '◆' },
  { type: 'd10', icon: '◇' },
  { type: 'd12', icon: '◊' },
  { type: 'd20', icon: '◐' },
];

export default function DiceRoller({ sessionId, characterId }: DiceRollerProps) {
  const { toast } = useToast();
  const [lastRoll, setLastRoll] = useState<{ type: string; result: number; total: number } | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const rollDiceMutation = useMutation({
    mutationFn: async (data: { diceType: DiceType; modifier?: number; purpose?: string }) => {
      const response = await fetch('/api/dice/roll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          sessionId,
          characterId,
          modifier: data.modifier || 0,
        }),
      });
      if (!response.ok) throw new Error('Failed to roll dice');
      return response.json();
    },
    onSuccess: (data) => {
      setLastRoll({
        type: data.diceType,
        result: data.result,
        total: data.total,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sessions', sessionId, 'messages'] });
      
      // Create a system message for the dice roll
      fetch(`/api/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'system',
          content: `Rolled ${data.diceType}: ${data.result}${data.modifier !== 0 ? ` + ${data.modifier}` : ''} = ${data.total}`,
          messageType: 'dice_roll',
          metadata: { diceRoll: data },
        }),
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to roll dice",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsRolling(false);
    },
  });

  const handleDiceRoll = (diceType: DiceType) => {
    setIsRolling(true);
    rollDiceMutation.mutate({ diceType });
  };

  return (
    <Card className="bg-fantasy-dark border-fantasy-bronze">
      <CardHeader className="pb-3">
        <CardTitle className="font-cinzel font-semibold text-fantasy-gold flex items-center">
          <Dices className="mr-2" size={20} />
          Dice Roller
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {diceTypes.map(({ type, icon }) => (
            <Button
              key={type}
              onClick={() => handleDiceRoll(type)}
              disabled={isRolling}
              className="dice-face h-16 flex flex-col items-center justify-center hover:scale-105 transition-all duration-200"
              variant="ghost"
            >
              <span className="text-xl mb-1">{icon}</span>
              <span className="text-xs">{type}</span>
            </Button>
          ))}
        </div>

        {/* Roll Result Display */}
        {lastRoll && (
          <div className="bg-gray-800 rounded p-3 text-center animate-fade-in">
            <div className="text-2xl font-mono font-bold text-fantasy-gold">
              {lastRoll.total}
            </div>
            <div className="text-sm text-gray-400">
              {lastRoll.type} Roll
              {lastRoll.result !== lastRoll.total && (
                <span className="ml-1">({lastRoll.result})</span>
              )}
            </div>
          </div>
        )}

        {/* Quick d20 Button */}
        <Button
          onClick={() => handleDiceRoll('d20')}
          disabled={isRolling}
          className="w-full mt-3 bg-fantasy-slate border border-fantasy-bronze hover:bg-gray-700 text-gray-100"
          variant="outline"
        >
          <Dices className="mr-2" size={16} />
          Quick d20
        </Button>
      </CardContent>
    </Card>
  );
}
