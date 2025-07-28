import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-fantasy-slate border-fantasy-bronze max-w-3xl max-h-[90vh] overflow-y-auto fantasy-scroll">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-cinzel font-bold text-fantasy-gold">
              Welcome to AI Dungeon Master!
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
          <Card className="parchment-bg">
            <CardContent className="p-6 text-fantasy-dark">
              <h4 className="text-xl font-cinzel font-bold mb-4">Getting Started Guide</h4>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-fantasy-bronze text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h5 className="font-semibold mb-1">Create Your Character</h5>
                    <p className="text-sm">
                      Customize your character's name, class, and stats using the character creation panel.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-fantasy-bronze text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h5 className="font-semibold mb-1">Read the Story</h5>
                    <p className="text-sm">
                      The AI Dungeon Master will set the scene and describe your surroundings in the chat area.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-fantasy-bronze text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h5 className="font-semibold mb-1">Describe Your Actions</h5>
                    <p className="text-sm">
                      Type what you want to do in the message box. Be creative and descriptive!
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-fantasy-bronze text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h5 className="font-semibold mb-1">Roll Dice</h5>
                    <p className="text-sm">
                      Use the dice roller for skill checks, attacks, and other game mechanics.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-fantasy-bronze text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                    5
                  </div>
                  <div>
                    <h5 className="font-semibold mb-1">Manage Inventory</h5>
                    <p className="text-sm">
                      Track your equipment and items in the inventory panel.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-fantasy-dark border-fantasy-bronze">
            <CardContent className="p-4">
              <h5 className="font-semibold text-fantasy-gold mb-2">Pro Tips:</h5>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Use quick action buttons for common actions</li>
                <li>• Your character's stats affect dice roll bonuses</li>
                <li>• The AI remembers your previous actions and story events</li>
                <li>• Save your adventure regularly to preserve progress</li>
                <li>• Be descriptive in your actions to get more engaging responses</li>
                <li>• Don't be afraid to be creative - the AI can handle unexpected actions!</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center mt-8">
          <Button
            onClick={onClose}
            className="bg-fantasy-gold text-fantasy-dark hover:bg-opacity-80 px-8 py-3 font-semibold"
          >
            Start My Adventure!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
