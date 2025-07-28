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
  type InsertDiceRoll,
  type SessionContext,
  type InsertSessionContext,
  type CharacterMemory,
  type InsertCharacterMemory,
  characters,
  gameSessions,
  messages,
  inventory,
  diceRolls,
  sessionContext,
  characterMemories
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
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
  
  // Memory and context methods
  createSessionContext(context: InsertSessionContext): Promise<SessionContext>;
  getSessionContext(sessionId: string, contextType?: string): Promise<SessionContext[]>;
  updateSessionContext(id: string, updates: Partial<SessionContext>): Promise<SessionContext | undefined>;
  
  createCharacterMemory(memory: InsertCharacterMemory): Promise<CharacterMemory>;
  getCharacterMemories(characterId: string, memoryType?: string): Promise<CharacterMemory[]>;
  updateCharacterMemory(id: string, updates: Partial<CharacterMemory>): Promise<CharacterMemory | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getCharacter(id: string): Promise<Character | undefined> {
    const [character] = await db.select().from(characters).where(eq(characters.id, id));
    return character || undefined;
  }

  async createCharacter(insertCharacter: InsertCharacter): Promise<Character> {
    const [character] = await db
      .insert(characters)
      .values(insertCharacter)
      .returning();
    return character;
  }

  async updateCharacter(id: string, updates: Partial<Character>): Promise<Character | undefined> {
    const [character] = await db
      .update(characters)
      .set(updates)
      .where(eq(characters.id, id))
      .returning();
    return character || undefined;
  }

  async getGameSession(id: string): Promise<GameSession | undefined> {
    const [session] = await db.select().from(gameSessions).where(eq(gameSessions.id, id));
    return session || undefined;
  }

  async getActiveSessionForCharacter(characterId: string): Promise<GameSession | undefined> {
    const [session] = await db
      .select()
      .from(gameSessions)
      .where(and(eq(gameSessions.characterId, characterId), eq(gameSessions.isActive, true)))
      .orderBy(desc(gameSessions.createdAt))
      .limit(1);
    return session || undefined;
  }

  async createGameSession(insertSession: InsertGameSession): Promise<GameSession> {
    // First, deactivate any existing active sessions for this character
    await db
      .update(gameSessions)
      .set({ isActive: false })
      .where(and(eq(gameSessions.characterId, insertSession.characterId), eq(gameSessions.isActive, true)));

    const [session] = await db
      .insert(gameSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async updateGameSession(id: string, updates: Partial<GameSession>): Promise<GameSession | undefined> {
    const [session] = await db
      .update(gameSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(gameSessions.id, id))
      .returning();
    return session || undefined;
  }

  async getMessagesForSession(sessionId: string, limit = 50): Promise<Message[]> {
    const sessionMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(messages.timestamp)
      .limit(limit);
    return sessionMessages;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getInventoryForCharacter(characterId: string): Promise<InventoryItem[]> {
    const items = await db
      .select()
      .from(inventory)
      .where(eq(inventory.characterId, characterId));
    return items;
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const [item] = await db
      .insert(inventory)
      .values(insertItem)
      .returning();
    return item;
  }

  async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined> {
    const [item] = await db
      .update(inventory)
      .set(updates)
      .where(eq(inventory.id, id))
      .returning();
    return item || undefined;
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    const result = await db.delete(inventory).where(eq(inventory.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async createDiceRoll(insertRoll: InsertDiceRoll): Promise<DiceRoll> {
    const [roll] = await db
      .insert(diceRolls)
      .values(insertRoll)
      .returning();
    return roll;
  }

  async getDiceRollsForSession(sessionId: string, limit = 20): Promise<DiceRoll[]> {
    const rolls = await db
      .select()
      .from(diceRolls)
      .where(eq(diceRolls.sessionId, sessionId))
      .orderBy(desc(diceRolls.timestamp))
      .limit(limit);
    return rolls;
  }

  // Memory and context methods
  async createSessionContext(insertContext: InsertSessionContext): Promise<SessionContext> {
    const [context] = await db
      .insert(sessionContext)
      .values(insertContext)
      .returning();
    return context;
  }

  async getSessionContext(sessionId: string, contextType?: string): Promise<SessionContext[]> {
    if (contextType) {
      const contexts = await db
        .select()
        .from(sessionContext)
        .where(and(eq(sessionContext.sessionId, sessionId), eq(sessionContext.contextType, contextType)))
        .orderBy(desc(sessionContext.importance), desc(sessionContext.updatedAt));
      return contexts;
    } else {
      const contexts = await db
        .select()
        .from(sessionContext)
        .where(eq(sessionContext.sessionId, sessionId))
        .orderBy(desc(sessionContext.importance), desc(sessionContext.updatedAt));
      return contexts;
    }
  }

  async updateSessionContext(id: string, updates: Partial<SessionContext>): Promise<SessionContext | undefined> {
    const [context] = await db
      .update(sessionContext)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(sessionContext.id, id))
      .returning();
    return context || undefined;
  }

  async createCharacterMemory(insertMemory: InsertCharacterMemory): Promise<CharacterMemory> {
    const [memory] = await db
      .insert(characterMemories)
      .values(insertMemory)
      .returning();
    return memory;
  }

  async getCharacterMemories(characterId: string, memoryType?: string): Promise<CharacterMemory[]> {
    if (memoryType) {
      const memories = await db
        .select()
        .from(characterMemories)
        .where(and(eq(characterMemories.characterId, characterId), eq(characterMemories.memoryType, memoryType)))
        .orderBy(desc(characterMemories.relevanceScore), desc(characterMemories.createdAt));
      return memories;
    } else {
      const memories = await db
        .select()
        .from(characterMemories)
        .where(eq(characterMemories.characterId, characterId))
        .orderBy(desc(characterMemories.relevanceScore), desc(characterMemories.createdAt));
      return memories;
    }
  }

  async updateCharacterMemory(id: string, updates: Partial<CharacterMemory>): Promise<CharacterMemory | undefined> {
    const [memory] = await db
      .update(characterMemories)
      .set(updates)
      .where(eq(characterMemories.id, id))
      .returning();
    return memory || undefined;
  }
}

export const storage = new DatabaseStorage();
