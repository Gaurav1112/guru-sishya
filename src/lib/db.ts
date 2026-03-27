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
import type { GraduationTestResult, LevelProgress } from "./ladder/types";
import type { TimedTestResult } from "./review/question-selector";

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

// Ladder cache — stores the AI-generated ladder JSON for a topic
interface LadderCache {
  id?: number;
  topicId: number;
  data: string; // JSON-serialized GeneratedLadder
  createdAt: Date;
}

interface UserProfile {
  id?: number;
  level: number;
  totalXP: number;
  totalCoins: number;
}

// Question bookmark — stores bookmarked/known status for interview questions
export interface QuestionBookmark {
  id?: number;
  questionId: number; // matches Question.id from questions-loader
  bookmarked: boolean;
  status: "unseen" | "known" | "review"; // spaced repetition status
  lastSeenAt: Date;
}

// AI response cache — stores AI responses keyed by prompt hash
export interface AICacheEntry {
  id?: number;
  promptHash: string;
  response: string;
  ttlDays: number;
  createdAt: Date;
}

// Quiz session state — persists adaptive quiz progress for resume functionality
export interface QuizSessionState {
  id?: number;
  topicId: number;
  lastQuestionIndex: number;
  answers: string; // JSON-serialized AnsweredQuestion[]
  currentLevel: number;
  isCalibration: boolean;
  status: string;
  updatedAt: Date;
}

export interface UsageTracking {
  id?: number;
  feature: string;
  date: string; // YYYY-MM-DD
  count: number;
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
  ladderCache!: EntityTable<LadderCache, "id">;
  graduationTests!: EntityTable<GraduationTestResult, "id">;
  levelProgress!: EntityTable<LevelProgress, "id">;
  aiCache!: EntityTable<AICacheEntry, "id">;
  timedTestResults!: EntityTable<TimedTestResult, "id">;
  questionBookmarks!: EntityTable<QuestionBookmark, "id">;
  quizSessionState!: EntityTable<QuizSessionState, "id">;
  usageTracking!: EntityTable<UsageTracking, "id">;

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

    this.version(2).stores({
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
      // Phase 7 — Learning Ladder
      ladderCache: "++id, topicId, createdAt",
      graduationTests: "++id, topicId, level, passed, attemptedAt",
      levelProgress: "++id, topicId, unlockedLevel, updatedAt",
    });

    this.version(3).stores({
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
      ladderCache: "++id, topicId, createdAt",
      graduationTests: "++id, topicId, level, passed, attemptedAt",
      levelProgress: "++id, topicId, unlockedLevel, updatedAt",
      // Phase 8 — AI Response Cache
      aiCache: "++id, promptHash, createdAt",
    });

    this.version(4).stores({
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
      ladderCache: "++id, topicId, createdAt",
      graduationTests: "++id, topicId, level, passed, attemptedAt",
      levelProgress: "++id, topicId, unlockedLevel, updatedAt",
      aiCache: "++id, promptHash, createdAt",
      // Phase 9 — Weekly/Monthly Timed Tests
      timedTestResults: "++id, type, completedAt",
    });

    this.version(5).stores({
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
      ladderCache: "++id, topicId, createdAt",
      graduationTests: "++id, topicId, level, passed, attemptedAt",
      levelProgress: "++id, topicId, unlockedLevel, updatedAt",
      aiCache: "++id, promptHash, createdAt",
      timedTestResults: "++id, type, completedAt",
      // Phase 10 — Important Questions
      questionBookmarks: "++id, questionId, bookmarked, status, lastSeenAt",
    });

    this.version(6).stores({
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
      ladderCache: "++id, topicId, createdAt",
      graduationTests: "++id, topicId, level, passed, attemptedAt",
      levelProgress: "++id, topicId, unlockedLevel, updatedAt",
      aiCache: "++id, promptHash, createdAt",
      timedTestResults: "++id, type, completedAt",
      questionBookmarks: "++id, questionId, bookmarked, status, lastSeenAt",
      // Phase 11 — Quiz Session Resume
      quizSessionState: "++id, topicId, updatedAt",
    });

    this.version(7).stores({
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
      ladderCache: "++id, topicId, createdAt",
      graduationTests: "++id, topicId, level, passed, attemptedAt",
      levelProgress: "++id, topicId, unlockedLevel, updatedAt",
      aiCache: "++id, promptHash, createdAt",
      timedTestResults: "++id, type, completedAt",
      questionBookmarks: "++id, questionId, bookmarked, status, lastSeenAt",
      quizSessionState: "++id, topicId, updatedAt",
      // Batch 3 — Free tier usage tracking
      usageTracking: "++id, feature, date, [feature+date]",
    });
  }
}

export const db = new GuruSishyaDB();
