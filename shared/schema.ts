import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const characters = pgTable("characters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  class: text("class").notNull(),
  level: integer("level").notNull().default(1),
  health: integer("health").notNull().default(100),
  maxHealth: integer("max_health").notNull().default(100),
  strength: integer("strength").notNull().default(10),
  dexterity: integer("dexterity").notNull().default(10),
  constitution: integer("constitution").notNull().default(10),
  intelligence: integer("intelligence").notNull().default(10),
  wisdom: integer("wisdom").notNull().default(10),
  charisma: integer("charisma").notNull().default(10),
  experience: integer("experience").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const gameSessions = pgTable("game_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  characterId: varchar("character_id").notNull().references(() => characters.id),
  title: text("title").notNull(),
  description: text("description"),
  currentScene: text("current_scene"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => gameSessions.id),
  sender: text("sender").notNull(), // 'player' | 'dm' | 'system'
  content: text("content").notNull(),
  messageType: text("message_type").notNull().default('text'), // 'text' | 'dice_roll' | 'combat'
  metadata: jsonb("metadata"), // For dice rolls, combat actions, etc.
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
});

export const inventory = pgTable("inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  characterId: varchar("character_id").notNull().references(() => characters.id),
  itemName: text("item_name").notNull(),
  itemType: text("item_type").notNull(),
  quantity: integer("quantity").notNull().default(1),
  description: text("description"),
  properties: jsonb("properties"), // For weapon stats, magic effects, etc.
});

export const diceRolls = pgTable("dice_rolls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => gameSessions.id),
  characterId: varchar("character_id").notNull().references(() => characters.id),
  diceType: text("dice_type").notNull(), // 'd4', 'd6', 'd8', 'd10', 'd12', 'd20'
  result: integer("result").notNull(),
  modifier: integer("modifier").notNull().default(0),
  purpose: text("purpose"), // 'attack', 'skill_check', 'damage', etc.
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
});

// Memory and context tracking for AI persistence
export const sessionContext = pgTable("session_context", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => gameSessions.id),
  contextType: text("context_type").notNull(), // 'character_memory', 'world_state', 'plot_threads', 'relationships'
  contextKey: text("context_key").notNull(), // e.g. 'met_npc_guard', 'discovered_secret_door', 'character_trait_brave'
  contextValue: jsonb("context_value").notNull(), // Flexible storage for any context data
  importance: integer("importance").notNull().default(1), // 1-10 priority for AI attention
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const characterMemories = pgTable("character_memories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  characterId: varchar("character_id").notNull().references(() => characters.id),
  memoryType: text("memory_type").notNull(), // 'achievement', 'trauma', 'relationship', 'knowledge', 'location'
  title: text("title").notNull(),
  description: text("description").notNull(),
  emotionalImpact: integer("emotional_impact").default(0), // -10 to +10 scale
  relevanceScore: integer("relevance_score").notNull().default(5), // How often AI should reference this
  tags: text("tags").array().default(sql`'{}'`), // For easy searching/filtering
  relatedSessionId: varchar("related_session_id").references(() => gameSessions.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Insert schemas
export const insertCharacterSchema = createInsertSchema(characters).omit({
  id: true,
  createdAt: true,
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
});

export const insertDiceRollSchema = createInsertSchema(diceRolls).omit({
  id: true,
  timestamp: true,
});

export const insertSessionContextSchema = createInsertSchema(sessionContext).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCharacterMemorySchema = createInsertSchema(characterMemories).omit({
  id: true,
  createdAt: true,
});

// Types
export type Character = typeof characters.$inferSelect;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;

export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type InventoryItem = typeof inventory.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventorySchema>;

export type DiceRoll = typeof diceRolls.$inferSelect;
export type InsertDiceRoll = z.infer<typeof insertDiceRollSchema>;

export type SessionContext = typeof sessionContext.$inferSelect;
export type InsertSessionContext = z.infer<typeof insertSessionContextSchema>;

export type CharacterMemory = typeof characterMemories.$inferSelect;
export type InsertCharacterMemory = z.infer<typeof insertCharacterMemorySchema>;

// Game state types
export type GameState = {
  character: Character;
  session: GameSession;
  messages: Message[];
  inventory: InventoryItem[];
  isInCombat: boolean;
  combatRound?: number;
};

export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';

export type QuickAction = 'attack' | 'investigate' | 'cast-spell' | 'hide' | 'help';
