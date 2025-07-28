import { useEffect, useRef } from "react";
import { Crown, User, Dices } from "lucide-react";
import { format } from "date-fns";
import type { Message, Character } from "@shared/schema";

interface ChatAreaProps {
  messages: Message[];
  character: Character;
  isInCombat: boolean;
}

export default function ChatArea({ messages, character, isInCombat }: ChatAreaProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (timestamp: Date) => {
    return format(new Date(timestamp), 'h:mm a');
  };

  const getMessageIcon = (sender: string, messageType: string) => {
    if (messageType === 'dice_roll') return Dices;
    if (sender === 'dm') return Crown;
    return User;
  };

  const getMessageBg = (sender: string, messageType: string) => {
    if (messageType === 'dice_roll') return 'bg-fantasy-slate border border-fantasy-bronze';
    if (sender === 'dm') return 'bg-gray-800';
    return 'bg-fantasy-bronze';
  };

  const getAvatarBg = (sender: string) => {
    if (sender === 'dm') return 'bg-gradient-to-br from-purple-600 to-purple-800';
    return 'bg-gradient-to-br from-fantasy-gold to-fantasy-bronze';
  };

  return (
    <div className="flex-1 overflow-y-auto fantasy-scroll p-4" id="chatContainer">
      {messages.map((message) => {
        const Icon = getMessageIcon(message.sender, message.messageType);
        const isSystem = message.messageType === 'dice_roll';
        
        if (isSystem) {
          return (
            <div key={message.id} className="mb-6 animate-fade-in">
              <div className="flex justify-center">
                <div className="bg-fantasy-slate border border-fantasy-bronze rounded-lg p-3 flex items-center">
                  <Dices className="text-fantasy-gold text-lg mr-3" />
                  <span className="text-gray-300">
                    <strong>{character.name}</strong> {message.content}
                  </span>
                </div>
              </div>
            </div>
          );
        }

        const isPlayer = message.sender === 'player';
        
        return (
          <div key={message.id} className="mb-6 animate-fade-in">
            <div className={`flex items-start ${isPlayer ? 'justify-end' : ''}`}>
              {!isPlayer && (
                <div className={`w-10 h-10 rounded-full ${getAvatarBg(message.sender)} flex items-center justify-center mr-3 flex-shrink-0`}>
                  <Icon className="text-fantasy-gold" size={20} />
                </div>
              )}
              
              <div className={`flex-1 ${isPlayer ? 'flex justify-end' : ''}`}>
                <div className={`${getMessageBg(message.sender, message.messageType)} rounded-lg p-4 max-w-4xl`}>
                  <div className={`flex items-center mb-2 ${isPlayer ? 'justify-end' : ''}`}>
                    {!isPlayer && (
                      <span className="font-semibold text-purple-400">Dungeon Master</span>
                    )}
                    {isPlayer && (
                      <span className="font-semibold text-fantasy-gold">{character.name}</span>
                    )}
                    <span className="text-gray-500 text-xs ml-2">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                  
                  {/* Show if DM is requesting a dice roll */}
                  {message.metadata?.requiresDiceRoll && (
                    <div className="mt-3 p-2 bg-fantasy-dark rounded border border-fantasy-gold">
                      <p className="text-sm text-fantasy-gold">
                        🎲 Roll {message.metadata.diceType} for {message.metadata.skillCheck}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {isPlayer && (
                <div className={`w-10 h-10 rounded-full ${getAvatarBg(message.sender)} flex items-center justify-center ml-3 flex-shrink-0`}>
                  <Icon className="text-white" size={20} />
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Combat Initiative Tracker */}
      {isInCombat && (
        <div className="mb-6 bg-fantasy-crimson bg-opacity-20 border border-fantasy-crimson rounded-lg p-4">
          <h4 className="font-cinzel font-semibold text-fantasy-crimson mb-3 flex items-center">
            <Icon className="mr-2" />
            Combat - Round 1
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center bg-fantasy-dark rounded p-2">
              <span className="text-fantasy-gold font-semibold">{character.name}</span>
              <span className="text-gray-400">Initiative: 18</span>
            </div>
          </div>
        </div>
      )}

      <div ref={chatEndRef} />
    </div>
  );
}
