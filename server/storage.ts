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
  type CharacterProgression,
  type InsertCharacterProgression,
  type ClassFeature,
  type InsertClassFeature,
  type LevelUp,
  type InsertLevelUp,
  characters,
  gameSessions,
  messages,
  inventory,
  diceRolls,
  sessionContext,
  characterMemories,
  characterProgression,
  classFeatures,
  levelUps,
  getLevelFromExperience,
  getProficiencyBonus
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
  
  // Character progression methods
  createCharacterProgression(progression: InsertCharacterProgression): Promise<CharacterProgression>;
  getCharacterProgression(characterId: string): Promise<CharacterProgression[]>;
  awardExperience(characterId: string, amount: number, source: string, description?: string, sessionId?: string): Promise<{ leveledUp: boolean; newLevel?: number; progression: CharacterProgression }>;
  
  // Class feature methods
  createClassFeature(feature: InsertClassFeature): Promise<ClassFeature>;
  getClassFeatures(className: string, level?: number): Promise<ClassFeature[]>;
  
  // Level up methods
  createLevelUp(levelUp: InsertLevelUp): Promise<LevelUp>;
  getLevelUpsForCharacter(characterId: string): Promise<LevelUp[]>;
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

  // Character progression methods
  async createCharacterProgression(insertProgression: InsertCharacterProgression): Promise<CharacterProgression> {
    const [progression] = await db
      .insert(characterProgression)
      .values(insertProgression)
      .returning();
    return progression;
  }

  async getCharacterProgression(characterId: string): Promise<CharacterProgression[]> {
    return await db
      .select()
      .from(characterProgression)
      .where(eq(characterProgression.characterId, characterId))
      .orderBy(desc(characterProgression.timestamp));
  }

  async awardExperience(
    characterId: string, 
    amount: number, 
    source: string, 
    description?: string, 
    sessionId?: string
  ): Promise<{ leveledUp: boolean; newLevel?: number; progression: CharacterProgression }> {
    // Get current character
    const character = await this.getCharacter(characterId);
    if (!character) {
      throw new Error("Character not found");
    }

    // Record the progression
    const progression = await this.createCharacterProgression({
      characterId,
      experienceGained: amount,
      experienceSource: source,
      description,
      sessionId,
    });

    // Calculate new experience and level
    const newExperience = character.experience + amount;
    const currentLevel = getLevelFromExperience(character.experience);
    const newLevel = getLevelFromExperience(newExperience);
    const leveledUp = newLevel > currentLevel;

    // Update character with new experience and level
    const updates: Partial<Character> = {
      experience: newExperience,
      level: newLevel,
      proficiencyBonus: getProficiencyBonus(newLevel),
    };

    await this.updateCharacter(characterId, updates);

    // If leveled up, record the level up
    if (leveledUp) {
      const hitPointsGained = this.calculateHitPointsGained(character.class, character.constitution);
      
      await this.createLevelUp({
        characterId,
        previousLevel: currentLevel,
        newLevel,
        hitPointsGained,
        featuresGained: await this.getNewFeaturesForLevel(character.class, newLevel),
        sessionId,
      });

      // Update max health
      await this.updateCharacter(characterId, {
        maxHealth: character.maxHealth + hitPointsGained,
        health: character.health + hitPointsGained, // Also heal the character
      });
    }

    return { leveledUp, newLevel: leveledUp ? newLevel : undefined, progression };
  }

  // Class feature methods
  async createClassFeature(insertFeature: InsertClassFeature): Promise<ClassFeature> {
    const [feature] = await db
      .insert(classFeatures)
      .values(insertFeature)
      .returning();
    return feature;
  }

  async getClassFeatures(className: string, level?: number): Promise<ClassFeature[]> {
    let query = db
      .select()
      .from(classFeatures)
      .where(eq(classFeatures.className, className));

    if (level !== undefined) {
      query = query.where(and(eq(classFeatures.className, className), eq(classFeatures.level, level)));
    }

    return await query.orderBy(classFeatures.level);
  }

  // Level up methods
  async createLevelUp(insertLevelUp: InsertLevelUp): Promise<LevelUp> {
    const [levelUp] = await db
      .insert(levelUps)
      .values(insertLevelUp)
      .returning();
    return levelUp;
  }

  async getLevelUpsForCharacter(characterId: string): Promise<LevelUp[]> {
    return await db
      .select()
      .from(levelUps)
      .where(eq(levelUps.characterId, characterId))
      .orderBy(desc(levelUps.timestamp));
  }

  // Helper methods
  private calculateHitPointsGained(characterClass: string, constitution: number): number {
    const constitutionModifier = Math.floor((constitution - 10) / 2);
    
    // Hit die based on class
    const hitDieMap: Record<string, number> = {
      'Barbarian': 12,
      'Fighter': 10,
      'Paladin': 10,
      'Ranger': 10,
      'Bard': 8,
      'Cleric': 8,
      'Druid': 8,
      'Monk': 8,
      'Rogue': 8,
      'Warlock': 8,
      'Sorcerer': 6,
      'Wizard': 6,
    };

    const hitDie = hitDieMap[characterClass] || 8;
    // Use average roll + CON modifier (more predictable than random)
    return Math.floor(hitDie / 2) + 1 + constitutionModifier;
  }

  private async getNewFeaturesForLevel(characterClass: string, level: number): Promise<string[]> {
    const features = await this.getClassFeatures(characterClass, level);
    return features.map(f => f.featureName);
  }
}

export const storage = new DatabaseStorage();
