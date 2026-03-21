import Dexie, { type EntityTable } from "dexie";
import type {
  Topic,
  LearningPlan,
  QuizAttempt,
  Flashcard,
  ChatSession,
  ChatMessage,
  CheatSheet,
  Resource,
  Badge,
  StreakEntry,
  DailyChallenge,
  CoinTransaction,
  InventoryItem,
  GuidedPathProgress,
} from "./types";

// ────────────────────────────────────────────────────────────────────────────
// Additional table-only types (not exported from types.ts)
// ────────────────────────────────────────────────────────────────────────────

interface SkillTreeNode {
  id?: number;
  topicId: number;
  concept: string;
  mastery: number;
}

interface LeaderboardUser {
  id?: number;
  name: string;
  archetype: string;
  weeklyXP: number;
  league: string;
}

interface LeaderboardHistory {
  id?: number;
  weekStart: string;
  userId: number;
  xp: number;
  rank: number;
  league: string;
}

interface TreasureChest {
  id?: number;
  earnedAt: Date;
  opened: boolean;
}

interface PlanSessionRow {
  id?: number;
  planId: number;
  sessionNumber: number;
  completed: boolean;
  completedAt?: Date;
}

interface UserProfile {
  id?: number;
  level: number;
  totalXP: number;
  totalCoins: number;
}

// ────────────────────────────────────────────────────────────────────────────
// Database class
// ────────────────────────────────────────────────────────────────────────────

class GuruSishyaDB extends Dexie {
  topics!: EntityTable<Topic, "id">;
  learningPlans!: EntityTable<LearningPlan, "id">;
  quizAttempts!: EntityTable<QuizAttempt, "id">;
  flashcards!: EntityTable<Flashcard, "id">;
  chatSessions!: EntityTable<ChatSession, "id">;
  chatMessages!: EntityTable<ChatMessage, "id">;
  cheatSheets!: EntityTable<CheatSheet, "id">;
  resources!: EntityTable<Resource, "id">;
  badges!: EntityTable<Badge, "id">;
  streakHistory!: EntityTable<StreakEntry, "id">;
  dailyChallenges!: EntityTable<DailyChallenge, "id">;
  coinTransactions!: EntityTable<CoinTransaction, "id">;
  inventory!: EntityTable<InventoryItem, "id">;
  guidedPathProgress!: EntityTable<GuidedPathProgress, "id">;
  skillTreeNodes!: EntityTable<SkillTreeNode, "id">;
  leaderboardUsers!: EntityTable<LeaderboardUser, "id">;
  leaderboardHistory!: EntityTable<LeaderboardHistory, "id">;
  treasureChests!: EntityTable<TreasureChest, "id">;
  planSessions!: EntityTable<PlanSessionRow, "id">;
  userProfile!: EntityTable<UserProfile, "id">;

  constructor() {
    super("GuruSishya");
    this.version(1).stores({
      topics: "++id, name, category, createdAt",
      learningPlans: "++id, topicId, status, createdAt",
      quizAttempts: "++id, topicId, score, difficulty, completedAt",
      flashcards:
        "++id, topicId, concept, nextReviewAt, easeFactor, interval, repetitions",
      chatSessions: "++id, topicId, technique, createdAt",
      chatMessages: "++id, sessionId, role, createdAt",
      cheatSheets: "++id, topicId, version, level, createdAt",
      resources: "++id, topicId, createdAt",
      badges: "++id, type, name, unlockedAt",
      streakHistory: "++id, date, maintained",
      dailyChallenges: "++id, date, topic, answered, score",
      coinTransactions: "++id, type, amount, reason, createdAt",
      inventory: "++id, itemType, itemId, acquiredAt, equipped",
      guidedPathProgress: "++id, topicId, currentStep, startedAt",
      skillTreeNodes: "++id, topicId, concept, mastery, [topicId+concept]",
      leaderboardUsers: "++id, name, archetype, weeklyXP, league",
      leaderboardHistory: "++id, weekStart, userId, xp, rank, league",
      treasureChests: "++id, earnedAt, opened",
      planSessions: "++id, planId, sessionNumber, completed, completedAt",
      userProfile: "++id, level, totalXP, totalCoins",
    });
  }
}

export const db = new GuruSishyaDB();
