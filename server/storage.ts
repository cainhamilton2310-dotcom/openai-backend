import { 
  type Character, 
  type InsertCharacter,
  type GameSession,
  type InsertGameSession,
  type Message,
  type InsertMessage,
  type InventoryItem,
  type InsertInventoryItem,
  type DiceRoll,
  type InsertDiceRoll
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Character methods
  getCharacter(id: string): Promise<Character | undefined>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  updateCharacter(id: string, updates: Partial<Character>): Promise<Character | undefined>;
  
  // Game session methods
  getGameSession(id: string): Promise<GameSession | undefined>;
  getActiveSessionForCharacter(characterId: string): Promise<GameSession | undefined>;
  createGameSession(session: InsertGameSession): Promise<GameSession>;
  updateGameSession(id: string, updates: Partial<GameSession>): Promise<GameSession | undefined>;
  
  // Message methods
  getMessagesForSession(sessionId: string, limit?: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Inventory methods
  getInventoryForCharacter(characterId: string): Promise<InventoryItem[]>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: string): Promise<boolean>;
  
  // Dice roll methods
  createDiceRoll(roll: InsertDiceRoll): Promise<DiceRoll>;
  getDiceRollsForSession(sessionId: string, limit?: number): Promise<DiceRoll[]>;
}

export class MemStorage implements IStorage {
  private characters: Map<string, Character>;
  private gameSessions: Map<string, GameSession>;
  private messages: Map<string, Message>;
  private inventory: Map<string, InventoryItem>;
  private diceRolls: Map<string, DiceRoll>;

  constructor() {
    this.characters = new Map();
    this.gameSessions = new Map();
    this.messages = new Map();
    this.inventory = new Map();
    this.diceRolls = new Map();
  }

  async getCharacter(id: string): Promise<Character | undefined> {
    return this.characters.get(id);
  }

  async createCharacter(insertCharacter: InsertCharacter): Promise<Character> {
    const id = randomUUID();
    const character: Character = {
      ...insertCharacter,
      id,
      createdAt: new Date(),
    };
    this.characters.set(id, character);
    return character;
  }

  async updateCharacter(id: string, updates: Partial<Character>): Promise<Character | undefined> {
    const character = this.characters.get(id);
    if (!character) return undefined;
    
    const updatedCharacter = { ...character, ...updates };
    this.characters.set(id, updatedCharacter);
    return updatedCharacter;
  }

  async getGameSession(id: string): Promise<GameSession | undefined> {
    return this.gameSessions.get(id);
  }

  async getActiveSessionForCharacter(characterId: string): Promise<GameSession | undefined> {
    return Array.from(this.gameSessions.values()).find(
      session => session.characterId === characterId && session.isActive
    );
  }

  async createGameSession(insertSession: InsertGameSession): Promise<GameSession> {
    const id = randomUUID();
    const session: GameSession = {
      ...insertSession,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.gameSessions.set(id, session);
    return session;
  }

  async updateGameSession(id: string, updates: Partial<GameSession>): Promise<GameSession | undefined> {
    const session = this.gameSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...updates, updatedAt: new Date() };
    this.gameSessions.set(id, updatedSession);
    return updatedSession;
  }

  async getMessagesForSession(sessionId: string, limit = 50): Promise<Message[]> {
    const sessionMessages = Array.from(this.messages.values())
      .filter(message => message.sessionId === sessionId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(-limit);
    return sessionMessages;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async getInventoryForCharacter(characterId: string): Promise<InventoryItem[]> {
    return Array.from(this.inventory.values()).filter(
      item => item.characterId === characterId
    );
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const id = randomUUID();
    const item: InventoryItem = {
      ...insertItem,
      id,
    };
    this.inventory.set(id, item);
    return item;
  }

  async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined> {
    const item = this.inventory.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...updates };
    this.inventory.set(id, updatedItem);
    return updatedItem;
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    return this.inventory.delete(id);
  }

  async createDiceRoll(insertRoll: InsertDiceRoll): Promise<DiceRoll> {
    const id = randomUUID();
    const roll: DiceRoll = {
      ...insertRoll,
      id,
      timestamp: new Date(),
    };
    this.diceRolls.set(id, roll);
    return roll;
  }

  async getDiceRollsForSession(sessionId: string, limit = 20): Promise<DiceRoll[]> {
    return Array.from(this.diceRolls.values())
      .filter(roll => roll.sessionId === sessionId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
