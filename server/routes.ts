import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateDMResponse, generateInitialScene } from "./services/openai";
import { 
  insertCharacterSchema, 
  insertGameSessionSchema, 
  insertMessageSchema,
  insertInventorySchema,
  insertDiceRollSchema,
  type GameState,
  type DiceType 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Character routes
  app.post("/api/characters", async (req, res) => {
    try {
      const validatedData = insertCharacterSchema.parse(req.body);
      const character = await storage.createCharacter(validatedData);
      res.json(character);
    } catch (error) {
      res.status(400).json({ message: "Invalid character data", error: error.message });
    }
  });

  app.get("/api/characters/:id", async (req, res) => {
    try {
      const character = await storage.getCharacter(req.params.id);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      res.json(character);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch character", error: error.message });
    }
  });

  app.patch("/api/characters/:id", async (req, res) => {
    try {
      const character = await storage.updateCharacter(req.params.id, req.body);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      res.json(character);
    } catch (error) {
      res.status(500).json({ message: "Failed to update character", error: error.message });
    }
  });

  // Game session routes
  app.post("/api/sessions", async (req, res) => {
    try {
      const validatedData = insertGameSessionSchema.parse(req.body);
      const session = await storage.createGameSession(validatedData);
      res.json(session);
    } catch (error) {
      res.status(400).json({ message: "Invalid session data", error: error.message });
    }
  });

  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const session = await storage.getGameSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session", error: error.message });
    }
  });

  app.get("/api/characters/:characterId/active-session", async (req, res) => {
    try {
      const session = await storage.getActiveSessionForCharacter(req.params.characterId);
      if (!session) {
        return res.status(404).json({ message: "No active session found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active session", error: error.message });
    }
  });

  // Message routes
  app.get("/api/sessions/:sessionId/messages", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const messages = await storage.getMessagesForSession(req.params.sessionId, limit);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages", error: error.message });
    }
  });

  app.post("/api/sessions/:sessionId/messages", async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        sessionId: req.params.sessionId,
      });
      const message = await storage.createMessage(validatedData);
      res.json(message);
    } catch (error) {
      res.status(400).json({ message: "Invalid message data", error: error.message });
    }
  });

  // Inventory routes
  app.get("/api/characters/:characterId/inventory", async (req, res) => {
    try {
      const inventory = await storage.getInventoryForCharacter(req.params.characterId);
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory", error: error.message });
    }
  });

  app.post("/api/characters/:characterId/inventory", async (req, res) => {
    try {
      const validatedData = insertInventorySchema.parse({
        ...req.body,
        characterId: req.params.characterId,
      });
      const item = await storage.createInventoryItem(validatedData);
      res.json(item);
    } catch (error) {
      res.status(400).json({ message: "Invalid inventory item data", error: error.message });
    }
  });

  // Dice roll routes
  app.post("/api/dice/roll", async (req, res) => {
    try {
      const schema = z.object({
        diceType: z.enum(['d4', 'd6', 'd8', 'd10', 'd12', 'd20']),
        modifier: z.number().default(0),
        sessionId: z.string(),
        characterId: z.string(),
        purpose: z.string().optional(),
      });
      
      const { diceType, modifier, sessionId, characterId, purpose } = schema.parse(req.body);
      
      // Roll the dice
      const sides = parseInt(diceType.substring(1));
      const result = Math.floor(Math.random() * sides) + 1;
      
      // Store the roll
      const diceRoll = await storage.createDiceRoll({
        sessionId,
        characterId,
        diceType,
        result,
        modifier,
        purpose,
      });
      
      res.json({
        ...diceRoll,
        total: result + modifier,
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid dice roll data", error: error.message });
    }
  });

  // AI DM routes
  app.post("/api/dm/respond", async (req, res) => {
    try {
      const schema = z.object({
        playerAction: z.string(),
        sessionId: z.string(),
        characterId: z.string(),
        diceRoll: z.object({
          type: z.string(),
          result: z.number(),
          modifier: z.number(),
        }).optional(),
      });
      
      const { playerAction, sessionId, characterId, diceRoll } = schema.parse(req.body);
      
      // Get character and session data
      const character = await storage.getCharacter(characterId);
      const session = await storage.getGameSession(sessionId);
      
      if (!character || !session) {
        return res.status(404).json({ message: "Character or session not found" });
      }
      
      // Get recent messages for context
      const recentMessages = await storage.getMessagesForSession(sessionId, 10);
      
      const context = {
        characterName: character.name,
        characterClass: character.class,
        characterLevel: character.level,
        characterStats: {
          strength: character.strength,
          dexterity: character.dexterity,
          constitution: character.constitution,
          intelligence: character.intelligence,
          wisdom: character.wisdom,
          charisma: character.charisma,
        },
        currentScene: session.currentScene || "",
        recentMessages: recentMessages.map(msg => ({
          sender: msg.sender,
          content: msg.content,
        })),
        sessionTitle: session.title,
      };
      
      const dmResponse = await generateDMResponse(playerAction, context, diceRoll);
      
      // Store the player message
      await storage.createMessage({
        sessionId,
        sender: 'player',
        content: playerAction,
        messageType: 'text',
      });
      
      // Store the DM response
      await storage.createMessage({
        sessionId,
        sender: 'dm',
        content: dmResponse.content,
        messageType: 'text',
        metadata: {
          requiresDiceRoll: dmResponse.requiresDiceRoll,
          diceType: dmResponse.diceType,
          skillCheck: dmResponse.skillCheck,
          combatAction: dmResponse.combatAction,
        },
      });
      
      // Update session scene if changed
      if (dmResponse.sceneUpdate && dmResponse.sceneUpdate !== session.currentScene) {
        await storage.updateGameSession(sessionId, {
          currentScene: dmResponse.sceneUpdate,
        });
      }
      
      res.json(dmResponse);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate DM response", error: error.message });
    }
  });

  app.post("/api/dm/start-adventure", async (req, res) => {
    try {
      const schema = z.object({
        characterId: z.string(),
        adventureType: z.string().default('fantasy'),
      });
      
      const { characterId, adventureType } = schema.parse(req.body);
      
      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      const initialScene = await generateInitialScene(
        character.name,
        character.class,
        adventureType
      );
      
      // Create new game session
      const session = await storage.createGameSession({
        characterId,
        title: initialScene.title,
        description: initialScene.description,
        currentScene: initialScene.scene,
        isActive: true,
      });
      
      // Create initial DM message
      await storage.createMessage({
        sessionId: session.id,
        sender: 'dm',
        content: initialScene.scene,
        messageType: 'text',
      });
      
      res.json({
        session,
        initialMessage: initialScene.scene,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to start adventure", error: error.message });
    }
  });

  // Game state route
  app.get("/api/game-state/:sessionId", async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      
      const session = await storage.getGameSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      const character = await storage.getCharacter(session.characterId);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      const messages = await storage.getMessagesForSession(sessionId);
      const inventory = await storage.getInventoryForCharacter(character.id);
      
      const gameState: GameState = {
        character,
        session,
        messages,
        inventory,
        isInCombat: false, // TODO: Implement combat state tracking
      };
      
      res.json(gameState);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch game state", error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
