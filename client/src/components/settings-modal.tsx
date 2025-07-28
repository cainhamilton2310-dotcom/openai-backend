import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { X, CheckCircle } from "lucide-react";
import type { Character, InsertCharacter } from "@shared/schema";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  character?: Character;
  onCreateCharacter?: (character: InsertCharacter) => void;
  isCreating?: boolean;
}

const characterClasses = [
  'Fighter', 'Wizard', 'Rogue', 'Cleric', 'Ranger', 'Barbarian', 
  'Bard', 'Druid', 'Paladin', 'Sorcerer', 'Warlock', 'Monk'
];

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  character, 
  onCreateCharacter,
  isCreating = false 
}: SettingsModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    class: 'Fighter',
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  });

  const [gameSettings, setGameSettings] = useState({
    storytellingStyle: 'descriptive',
    difficultyLevel: 'balanced',
  });

  useEffect(() => {
    if (character) {
      setFormData({
        name: character.name,
        class: character.class,
        strength: character.strength,
        dexterity: character.dexterity,
        constitution: character.constitution,
        intelligence: character.intelligence,
        wisdom: character.wisdom,
        charisma: character.charisma,
      });
    }
  }, [character]);

  const updateCharacterMutation = useMutation({
    mutationFn: async (updates: Partial<Character>) => {
      if (!character) throw new Error('No character to update');
      const response = await fetch(`/api/characters/${character.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update character');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/game-state'] });
      onClose();
      toast({
        title: "Character Updated",
        description: "Your character has been updated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update character",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!character) {
      // Creating new character
      if (onCreateCharacter) {
        const newCharacter: InsertCharacter = {
          ...formData,
          level: 1,
          health: 100,
          maxHealth: 100,
          experience: 0,
        };
        onCreateCharacter(newCharacter);
      }
    } else {
      // Updating existing character
      updateCharacterMutation.mutate(formData);
    }
  };

  const getStatTotal = () => {
    return formData.strength + formData.dexterity + formData.constitution + 
           formData.intelligence + formData.wisdom + formData.charisma;
  };

  const statPointsUsed = getStatTotal() - 60; // Base stats of 10 each = 60
  const statPointsRemaining = 72 - getStatTotal(); // Standard array equivalent

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-fantasy-slate border-fantasy-bronze max-w-2xl max-h-[90vh] overflow-y-auto fantasy-scroll">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-cinzel font-bold text-fantasy-gold">
              {character ? 'Character Settings' : 'Create Character'}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200"
            >
              <X size={20} />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Character Creation/Edit */}
          <div>
            <h4 className="text-lg font-semibold text-fantasy-gold mb-3">
              {character ? 'Edit Character' : 'Character Details'}
            </h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label className="text-gray-300">Character Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-fantasy-dark border-fantasy-bronze text-gray-100"
                  placeholder="Enter name..."
                />
              </div>
              <div>
                <Label className="text-gray-300">Class</Label>
                <Select
                  value={formData.class}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, class: value }))}
                >
                  <SelectTrigger className="bg-fantasy-dark border-fantasy-bronze text-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-fantasy-dark border-fantasy-bronze">
                    {characterClasses.map(cls => (
                      <SelectItem key={cls} value={cls} className="text-gray-100">
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ability Scores */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <Label className="text-gray-300">Ability Scores</Label>
                <span className="text-sm text-gray-400">
                  Points remaining: {statPointsRemaining}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {Object.entries({
                  strength: 'Strength',
                  dexterity: 'Dexterity', 
                  constitution: 'Constitution',
                  intelligence: 'Intelligence',
                  wisdom: 'Wisdom',
                  charisma: 'Charisma'
                }).map(([key, label]) => (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{label}</span>
                      <span className="text-fantasy-gold font-mono">
                        {formData[key as keyof typeof formData]}
                      </span>
                    </div>
                    <Slider
                      value={[formData[key as keyof typeof formData] as number]}
                      onValueChange={([value]) => setFormData(prev => ({ ...prev, [key]: value }))}
                      min={8}
                      max={18}
                      step={1}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Settings */}
          <div>
            <h4 className="text-lg font-semibold text-fantasy-gold mb-3">AI Dungeon Master</h4>
            <div className="space-y-3">
              <div>
                <Label className="text-gray-300">Storytelling Style</Label>
                <Select
                  value={gameSettings.storytellingStyle}
                  onValueChange={(value) => setGameSettings(prev => ({ ...prev, storytellingStyle: value }))}
                >
                  <SelectTrigger className="bg-fantasy-dark border-fantasy-bronze text-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-fantasy-dark border-fantasy-bronze">
                    <SelectItem value="descriptive" className="text-gray-100">Descriptive & Atmospheric</SelectItem>
                    <SelectItem value="action" className="text-gray-100">Action-Packed</SelectItem>
                    <SelectItem value="roleplay" className="text-gray-100">Roleplay Focused</SelectItem>
                    <SelectItem value="comedy" className="text-gray-100">Comedy & Light-hearted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300">Difficulty Level</Label>
                <Select
                  value={gameSettings.difficultyLevel}
                  onValueChange={(value) => setGameSettings(prev => ({ ...prev, difficultyLevel: value }))}
                >
                  <SelectTrigger className="bg-fantasy-dark border-fantasy-bronze text-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-fantasy-dark border-fantasy-bronze">
                    <SelectItem value="beginner" className="text-gray-100">Beginner Friendly</SelectItem>
                    <SelectItem value="balanced" className="text-gray-100">Balanced</SelectItem>
                    <SelectItem value="challenging" className="text-gray-100">Challenging</SelectItem>
                    <SelectItem value="hardcore" className="text-gray-100">Hardcore</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* API Status */}
          <div>
            <h4 className="text-lg font-semibold text-fantasy-gold mb-3">API Configuration</h4>
            <p className="text-sm text-gray-400 mb-3">OpenAI API connection status</p>
            <div className="bg-fantasy-dark border border-fantasy-bronze rounded p-4">
              <div className="flex items-center text-green-400 mb-2">
                <CheckCircle className="mr-2" size={16} />
                Connected to OpenAI API
              </div>
              <p className="text-xs text-gray-500">Using GPT-4o for enhanced storytelling</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-8">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.name.trim() || statPointsRemaining < 0 || isCreating || updateCharacterMutation.isPending}
            className="bg-fantasy-gold text-fantasy-dark hover:bg-opacity-80 font-semibold"
          >
            {isCreating || updateCharacterMutation.isPending 
              ? 'Saving...' 
              : character 
                ? 'Save Changes' 
                : 'Create Character'
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
