import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Brain, Heart, Sword, Users, MapPin } from "lucide-react";
import type { CharacterMemory, SessionContext } from "@shared/schema";

interface MemoryPanelProps {
  characterId: string;
  sessionId: string;
}

const memoryTypeIcons = {
  achievement: Sword,
  relationship: Users,
  location: MapPin,
  emotion: Heart,
  knowledge: Brain,
  plot: Brain,
  event: Sword,
  world_state: MapPin,
};

const memoryTypeColors = {
  achievement: "bg-yellow-500",
  relationship: "bg-pink-500", 
  location: "bg-green-500",
  emotion: "bg-red-500",
  knowledge: "bg-blue-500",
  plot: "bg-purple-500",
  event: "bg-orange-500",
  world_state: "bg-teal-500",
};

export default function MemoryPanel({ characterId, sessionId }: MemoryPanelProps) {
  // Fetch character memories
  const { data: memories = [] } = useQuery<CharacterMemory[]>({
    queryKey: ['/api/characters', characterId, 'memories'],
    enabled: !!characterId,
  });

  // Fetch session context
  const { data: sessionContext = [] } = useQuery<SessionContext[]>({
    queryKey: ['/api/sessions', sessionId, 'context'],
    enabled: !!sessionId,
  });

  // Sort memories by relevance and emotional impact
  const sortedMemories = [...memories].sort((a, b) => {
    const scoreA = a.relevanceScore + (a.emotionalImpact || 0);
    const scoreB = b.relevanceScore + (b.emotionalImpact || 0);
    return scoreB - scoreA;
  });

  // Group session context by type
  const contextByType = sessionContext.reduce((acc, ctx) => {
    if (!acc[ctx.contextType]) acc[ctx.contextType] = [];
    acc[ctx.contextType].push(ctx);
    return acc;
  }, {} as Record<string, SessionContext[]>);

  return (
    <div className="space-y-4">
      {/* Character Memories */}
      <Card className="bg-fantasy-dark border-fantasy-bronze">
        <CardHeader className="pb-3">
          <CardTitle className="text-fantasy-gold flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Character Memories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            {sortedMemories.length === 0 ? (
              <p className="text-gray-400 text-sm italic">
                No memories formed yet. As you adventure, your character will remember important moments...
              </p>
            ) : (
              <div className="space-y-3">
                {sortedMemories.map((memory) => {
                  const IconComponent = memoryTypeIcons[memory.memoryType as keyof typeof memoryTypeIcons] || Brain;
                  const colorClass = memoryTypeColors[memory.memoryType as keyof typeof memoryTypeColors] || "bg-gray-500";
                  
                  return (
                    <div key={memory.id} className="bg-gray-800 rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full ${colorClass} flex items-center justify-center flex-shrink-0`}>
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm text-white truncate">
                              {memory.title}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {memory.memoryType}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-300 leading-relaxed">
                            {memory.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <span>Impact: {memory.emotionalImpact || 0}</span>
                            <span>•</span>
                            <span>Relevance: {memory.relevanceScore}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Session Context */}
      <Card className="bg-fantasy-dark border-fantasy-bronze">
        <CardHeader className="pb-3">
          <CardTitle className="text-fantasy-gold flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Current Session
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            {Object.keys(contextByType).length === 0 ? (
              <p className="text-gray-400 text-sm italic">
                Session context will appear here as you progress through your adventure...
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(contextByType).map(([type, contexts]) => (
                  <div key={type} className="space-y-2">
                    <h5 className="text-sm font-medium text-fantasy-gold capitalize">
                      {type.replace('_', ' ')}
                    </h5>
                    {contexts.map((ctx) => (
                      <div key={ctx.id} className="bg-gray-800 rounded p-2">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white">
                              {ctx.contextKey}
                            </p>
                            <p className="text-xs text-gray-300 mt-1">
                              {String(ctx.contextValue)}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {ctx.importance}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    <Separator className="bg-gray-700" />
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}