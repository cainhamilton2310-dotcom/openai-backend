import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Star, Trophy, Zap, TrendingUp } from "lucide-react";
import type { Character, CharacterProgression, LevelUp } from "@shared/schema";
import { EXPERIENCE_THRESHOLDS, getExperienceToNextLevel } from "@shared/schema";

interface ProgressionPanelProps {
  character: Character;
}

export default function ProgressionPanel({ character }: ProgressionPanelProps) {
  // Fetch character progression history
  const { data: progressionHistory = [] } = useQuery<CharacterProgression[]>({
    queryKey: ['/api/characters', character.id, 'progression'],
    enabled: !!character.id,
  });

  // Fetch level up history
  const { data: levelUps = [] } = useQuery<LevelUp[]>({
    queryKey: ['/api/characters', character.id, 'level-ups'],
    enabled: !!character.id,
  });

  const currentLevel = character.level;
  const currentXP = character.experience;
  const xpForCurrentLevel = EXPERIENCE_THRESHOLDS[currentLevel - 1] || 0;
  const xpForNextLevel = EXPERIENCE_THRESHOLDS[currentLevel] || EXPERIENCE_THRESHOLDS[EXPERIENCE_THRESHOLDS.length - 1];
  const xpNeededForNext = getExperienceToNextLevel(currentXP);
  const xpProgressInLevel = currentXP - xpForCurrentLevel;
  const xpRequiredForLevel = xpForNextLevel - xpForCurrentLevel;
  const progressPercent = currentLevel >= 20 ? 100 : (xpProgressInLevel / xpRequiredForLevel) * 100;

  // Recent XP gains (last 5)
  const recentGains = progressionHistory.slice(0, 5);

  // Total XP gained in this session
  const sessionXP = progressionHistory.reduce((sum, prog) => sum + prog.experienceGained, 0);

  const experienceSourceColors = {
    combat: "bg-red-500",
    roleplay: "bg-blue-500", 
    quest_completion: "bg-green-500",
    discovery: "bg-yellow-500",
    puzzle: "bg-purple-500",
    social: "bg-pink-500",
  };

  return (
    <Card className="bg-fantasy-dark border-fantasy-bronze">
      <CardHeader className="pb-3">
        <CardTitle className="text-fantasy-gold flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Character Progression
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Level & XP Display */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-fantasy-gold" />
              <span className="font-medium text-white">Level {currentLevel}</span>
            </div>
            <Badge variant="outline" className="text-fantasy-gold border-fantasy-gold">
              {character.proficiencyBonus > 0 ? `+${character.proficiencyBonus}` : character.proficiencyBonus} Prof
            </Badge>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Experience</span>
              <span className="text-white">
                {currentLevel >= 20 ? (
                  `${currentXP.toLocaleString()} XP (Max Level)`
                ) : (
                  `${currentXP.toLocaleString()} / ${xpForNextLevel.toLocaleString()} XP`
                )}
              </span>
            </div>
            <Progress 
              value={progressPercent} 
              className="h-2"
              style={{ 
                '--progress-background': 'hsl(45, 93%, 47%)',
              } as React.CSSProperties}
            />
            {currentLevel < 20 && (
              <p className="text-xs text-gray-400 text-center">
                {xpNeededForNext.toLocaleString()} XP to next level
              </p>
            )}
          </div>
        </div>

        <Separator className="bg-gray-700" />

        {/* Recent Level Ups */}
        {levelUps.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-fantasy-gold flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Recent Level Ups
            </h4>
            <ScrollArea className="h-20">
              <div className="space-y-1">
                {levelUps.slice(0, 3).map((levelUp) => (
                  <div key={levelUp.id} className="bg-gray-800 rounded p-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium">
                        Level {levelUp.previousLevel} → {levelUp.newLevel}
                      </span>
                      <span className="text-green-400">
                        +{levelUp.hitPointsGained} HP
                      </span>
                    </div>
                    {levelUp.featuresGained && levelUp.featuresGained.length > 0 && (
                      <div className="mt-1 text-gray-300">
                        New: {levelUp.featuresGained.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <Separator className="bg-gray-700" />

        {/* Recent Experience Gains */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-fantasy-gold flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Recent Experience
          </h4>
          {recentGains.length === 0 ? (
            <p className="text-xs text-gray-400 italic">
              No experience gained yet. Start your adventure to earn XP!
            </p>
          ) : (
            <ScrollArea className="h-32">
              <div className="space-y-1">
                {recentGains.map((exp) => {
                  const sourceColor = experienceSourceColors[exp.experienceSource as keyof typeof experienceSourceColors] || "bg-gray-500";
                  
                  return (
                    <div key={exp.id} className="bg-gray-800 rounded p-2 text-xs">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${sourceColor}`} />
                            <span className="text-white font-medium">
                              +{exp.experienceGained} XP
                            </span>
                            <Badge variant="outline" className="text-xs capitalize">
                              {exp.experienceSource.replace('_', ' ')}
                            </Badge>
                          </div>
                          {exp.description && (
                            <p className="text-gray-300 text-xs leading-relaxed">
                              {exp.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {/* Session Summary */}
          {sessionXP > 0 && (
            <div className="bg-fantasy-slate rounded p-2 border border-fantasy-bronze">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-300">Session Total:</span>
                <span className="text-fantasy-gold font-medium">
                  +{sessionXP} XP
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}