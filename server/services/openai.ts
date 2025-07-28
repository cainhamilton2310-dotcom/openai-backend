import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface DMResponse {
  content: string;
  requiresDiceRoll?: boolean;
  diceType?: string;
  skillCheck?: string;
  combatAction?: boolean;
  sceneUpdate?: string;
}

export interface GameContext {
  characterName: string;
  characterClass: string;
  characterLevel: number;
  characterStats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  currentScene: string;
  recentMessages: Array<{
    sender: string;
    content: string;
  }>;
  sessionTitle: string;
}

export async function generateDMResponse(
  playerAction: string,
  context: GameContext,
  diceRoll?: { type: string; result: number; modifier: number }
): Promise<DMResponse> {
  try {
    const systemPrompt = `You are an expert Dungeon Master running a Dungeons & Dragons adventure. You are creative, engaging, and maintain story consistency.

Character: ${context.characterName}, Level ${context.characterLevel} ${context.characterClass}
Stats: STR ${context.characterStats.strength}, DEX ${context.characterStats.dexterity}, CON ${context.characterStats.constitution}, INT ${context.characterStats.intelligence}, WIS ${context.characterStats.wisdom}, CHA ${context.characterStats.charisma}

Current Scene: ${context.currentScene}
Adventure: ${context.sessionTitle}

Guidelines:
- Respond to player actions with vivid, atmospheric descriptions
- Maintain story consistency and character personalities
- Request dice rolls when appropriate for skill checks, attacks, or saves
- Progress the narrative based on player choices
- Create engaging encounters and NPCs
- Keep responses between 1-3 paragraphs

Respond in JSON format with these fields:
- content: Your narrative response
- requiresDiceRoll: boolean (true if player needs to roll dice)
- diceType: string (d20, d6, etc. if dice roll required)
- skillCheck: string (what skill/ability is being checked)
- combatAction: boolean (true if this initiates combat)
- sceneUpdate: string (brief description of current scene for context)`;

    let userPrompt = `Player Action: ${playerAction}

Recent conversation:
${context.recentMessages.map(msg => `${msg.sender}: ${msg.content}`).join('\n')}`;

    if (diceRoll) {
      userPrompt += `\n\nDice Roll Result: ${diceRoll.type} rolled ${diceRoll.result}${diceRoll.modifier > 0 ? ` + ${diceRoll.modifier}` : diceRoll.modifier < 0 ? ` - ${Math.abs(diceRoll.modifier)}` : ''} = ${diceRoll.result + diceRoll.modifier}`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
      temperature: 0.8,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      content: result.content || "The dungeon master ponders your action...",
      requiresDiceRoll: result.requiresDiceRoll || false,
      diceType: result.diceType,
      skillCheck: result.skillCheck,
      combatAction: result.combatAction || false,
      sceneUpdate: result.sceneUpdate || context.currentScene,
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate DM response. The AI Dungeon Master seems to be taking a break. Please try again.");
  }
}

export async function generateInitialScene(
  characterName: string,
  characterClass: string,
  adventureType = "fantasy"
): Promise<{ title: string; description: string; scene: string }> {
  try {
    const systemPrompt = `You are a creative Dungeon Master creating the opening scene for a new D&D adventure.

Create an engaging opening scenario for a Level 1 ${characterClass} named ${characterName}.

Generate a ${adventureType} adventure that:
- Has an intriguing hook to draw the player in
- Presents clear initial choices
- Sets up potential for ongoing adventure
- Includes atmospheric details and sensory descriptions

Respond in JSON format with:
- title: Adventure title (3-6 words)
- description: One sentence adventure summary
- scene: 2-3 paragraph opening scene description that ends with asking what the player wants to do`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Create an opening adventure for ${characterName} the ${characterClass}` }
      ],
      response_format: { type: "json_object" },
      max_tokens: 600,
      temperature: 0.9,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      title: result.title || "The Mysterious Adventure",
      description: result.description || "A new adventure begins...",
      scene: result.scene || "You find yourself at the beginning of a grand adventure. What would you like to do?",
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate initial scene. Please try again.");
  }
}
