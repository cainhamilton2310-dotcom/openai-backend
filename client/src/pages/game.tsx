import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CharacterSheet from "@/components/character-sheet";
import InventoryPanel from "@/components/inventory-panel";
import DiceRoller from "@/components/dice-roller";
import ChatArea from "@/components/chat-area";
import MessageInput from "@/components/message-input";
import SettingsModal from "@/components/settings-modal";
import TutorialModal from "@/components/tutorial-modal";
import { Button } from "@/components/ui/button";
import { Save, Settings, Crown } from "lucide-react";
import type { GameState, Character, InsertCharacter } from "@shared/schema";

export default function Game() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<string | null>(params.sessionId || null);
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [characterId, setCharacterId] = useState<string | null>(null);

  // Check for first-time visit
  useEffect(() => {
    const hasVisited = localStorage.getItem('ai-dm-visited');
    if (!hasVisited) {
      setShowTutorial(true);
      localStorage.setItem('ai-dm-visited', 'true');
    }
  }, []);

  // Fetch game state
  const { data: gameState, isLoading } = useQuery<GameState>({
    queryKey: ['/api/game-state', sessionId],
    enabled: !!sessionId,
  });

  // Create character mutation
  const createCharacterMutation = useMutation({
    mutationFn: async (character: InsertCharacter) => {
      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(character),
      });
      if (!response.ok) throw new Error('Failed to create character');
      return response.json();
    },
    onSuccess: (character: Character) => {
      setCharacterId(character.id);
      toast({
        title: "Character Created",
        description: `${character.name} is ready for adventure!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create character",
        variant: "destructive",
      });
    },
  });

  // Start adventure mutation
  const startAdventureMutation = useMutation({
    mutationFn: async (data: { characterId: string; adventureType?: string }) => {
      const response = await fetch('/api/dm/start-adventure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to start adventure');
      return response.json();
    },
    onSuccess: (data) => {
      setSessionId(data.session.id);
      setLocation(`/game/${data.session.id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/game-state'] });
      toast({
        title: "Adventure Started",
        description: data.session.title,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start adventure",
        variant: "destructive",
      });
    },
  });

  const handleCreateCharacter = (character: InsertCharacter) => {
    createCharacterMutation.mutate(character);
  };

  const handleStartAdventure = () => {
    if (!characterId) return;
    startAdventureMutation.mutate({ characterId });
  };

  const handleSaveGame = () => {
    // TODO: Implement save functionality
    toast({
      title: "Game Saved",
      description: "Your adventure has been saved successfully!",
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-fantasy-dark">
        <div className="text-center">
          <Crown className="w-12 h-12 text-fantasy-gold mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">Loading your adventure...</p>
        </div>
      </div>
    );
  }

  // If no session exists, show character creation
  if (!sessionId || !gameState) {
    return (
      <div className="h-screen flex items-center justify-center bg-fantasy-dark">
        <div className="max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <Crown className="w-16 h-16 text-fantasy-gold mx-auto mb-4" />
            <h1 className="text-3xl font-cinzel font-bold text-fantasy-gold mb-2">
              AI Dungeon Master
            </h1>
            <p className="text-gray-400">Epic Adventures Await</p>
          </div>

          {!characterId ? (
            <div className="bg-fantasy-slate border border-fantasy-bronze rounded-lg p-6">
              <h2 className="text-xl font-cinzel font-semibold text-fantasy-gold mb-4">
                Create Your Character
              </h2>
              <p className="text-gray-400 mb-4">
                Begin your adventure by creating a character.
              </p>
              <Button 
                onClick={() => setShowSettings(true)}
                className="w-full bg-fantasy-gold text-fantasy-dark hover:bg-opacity-80"
              >
                Create Character
              </Button>
            </div>
          ) : (
            <div className="bg-fantasy-slate border border-fantasy-bronze rounded-lg p-6">
              <h2 className="text-xl font-cinzel font-semibold text-fantasy-gold mb-4">
                Start Your Adventure
              </h2>
              <p className="text-gray-400 mb-4">
                Your character is ready! Begin a new adventure.
              </p>
              <Button 
                onClick={handleStartAdventure}
                disabled={startAdventureMutation.isPending}
                className="w-full bg-fantasy-gold text-fantasy-dark hover:bg-opacity-80"
              >
                {startAdventureMutation.isPending ? 'Starting...' : 'Start Adventure'}
              </Button>
            </div>
          )}
        </div>

        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onCreateCharacter={handleCreateCharacter}
          isCreating={createCharacterMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-fantasy-dark text-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-fantasy-slate border-r border-fantasy-bronze flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-fantasy-bronze">
          <h1 className="text-2xl font-cinzel font-bold text-fantasy-gold flex items-center">
            <Crown className="mr-3" />
            AI Dungeon Master
          </h1>
          <p className="text-gray-400 text-sm mt-1">Epic Adventures Await</p>
        </div>

        {/* Character Sheet and Panels */}
        <div className="flex-1 overflow-y-auto fantasy-scroll">
          <div className="p-4 space-y-4">
            <CharacterSheet character={gameState.character} />
            <InventoryPanel inventory={gameState.inventory} characterId={gameState.character.id} />
            <DiceRoller sessionId={sessionId} characterId={gameState.character.id} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Adventure Header */}
        <div className="bg-fantasy-slate border-b border-fantasy-bronze p-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-cinzel font-semibold text-fantasy-gold">
                {gameState.session.title}
              </h2>
              <p className="text-gray-400 text-sm">
                {gameState.session.description}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={handleSaveGame}
                variant="outline"
                className="bg-fantasy-bronze hover:bg-opacity-80 border-fantasy-bronze text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button
                onClick={() => setShowSettings(true)}
                className="bg-fantasy-gold text-fantasy-dark hover:bg-opacity-80"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <ChatArea 
          messages={gameState.messages} 
          character={gameState.character}
          isInCombat={gameState.isInCombat}
        />

        {/* Message Input */}
        <MessageInput 
          sessionId={sessionId} 
          characterId={gameState.character.id} 
        />
      </div>

      {/* Modals */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        character={gameState.character}
      />

      <TutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </div>
  );
}
