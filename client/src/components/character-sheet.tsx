import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { User } from "lucide-react";
import type { Character } from "@shared/schema";

interface CharacterSheetProps {
  character: Character;
}

export default function CharacterSheet({ character }: CharacterSheetProps) {
  const healthPercent = (character.health / character.maxHealth) * 100;
  
  const getStatModifier = (stat: number) => {
    return Math.floor((stat - 10) / 2);
  };

  const formatModifier = (modifier: number) => {
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  };

  return (
    <Card className="bg-fantasy-dark border-fantasy-bronze">
      <CardContent className="p-4">
        <div className="flex items-center mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-fantasy-gold to-fantasy-bronze flex items-center justify-center mr-4">
            <User className="text-2xl text-white" />
          </div>
          <div>
            <h3 className="text-lg font-cinzel font-semibold text-fantasy-gold">
              {character.name}
            </h3>
            <p className="text-gray-400 text-sm">
              {character.class} - Level {character.level}
            </p>
          </div>
        </div>

        {/* Health Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Health</span>
            <span>{character.health}/{character.maxHealth}</span>
          </div>
          <Progress 
            value={healthPercent} 
            className="h-3"
            style={{ 
              '--progress-background': 'hsl(348, 83%, 47%)',
            } as React.CSSProperties}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800 rounded p-3 text-center">
            <div className="text-2xl font-mono font-bold text-fantasy-gold">
              {character.strength}
            </div>
            <div className="text-xs text-gray-400">STR</div>
            <div className="text-xs text-gray-500">
              {formatModifier(getStatModifier(character.strength))}
            </div>
          </div>
          <div className="bg-gray-800 rounded p-3 text-center">
            <div className="text-2xl font-mono font-bold text-fantasy-gold">
              {character.dexterity}
            </div>
            <div className="text-xs text-gray-400">DEX</div>
            <div className="text-xs text-gray-500">
              {formatModifier(getStatModifier(character.dexterity))}
            </div>
          </div>
          <div className="bg-gray-800 rounded p-3 text-center">
            <div className="text-2xl font-mono font-bold text-fantasy-gold">
              {character.constitution}
            </div>
            <div className="text-xs text-gray-400">CON</div>
            <div className="text-xs text-gray-500">
              {formatModifier(getStatModifier(character.constitution))}
            </div>
          </div>
          <div className="bg-gray-800 rounded p-3 text-center">
            <div className="text-2xl font-mono font-bold text-fantasy-gold">
              {character.intelligence}
            </div>
            <div className="text-xs text-gray-400">INT</div>
            <div className="text-xs text-gray-500">
              {formatModifier(getStatModifier(character.intelligence))}
            </div>
          </div>
          <div className="bg-gray-800 rounded p-3 text-center">
            <div className="text-2xl font-mono font-bold text-fantasy-gold">
              {character.wisdom}
            </div>
            <div className="text-xs text-gray-400">WIS</div>
            <div className="text-xs text-gray-500">
              {formatModifier(getStatModifier(character.wisdom))}
            </div>
          </div>
          <div className="bg-gray-800 rounded p-3 text-center">
            <div className="text-2xl font-mono font-bold text-fantasy-gold">
              {character.charisma}
            </div>
            <div className="text-xs text-gray-400">CHA</div>
            <div className="text-xs text-gray-500">
              {formatModifier(getStatModifier(character.charisma))}
            </div>
          </div>
        </div>

        {/* Experience Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Experience</span>
            <span>{character.experience} XP</span>
          </div>
          <Progress 
            value={(character.experience % 1000) / 10} 
            className="h-2"
            style={{ 
              '--progress-background': 'hsl(45, 100%, 51%)',
            } as React.CSSProperties}
          />
        </div>
      </CardContent>
    </Card>
  );
}
