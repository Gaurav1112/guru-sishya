// ────────────────────────────────────────────────────────────────────────────
// Core domain types for Guru Sishya
// ────────────────────────────────────────────────────────────────────────────

export interface Topic {
  id?: number;
  name: string;
  category: string;
  createdAt: Date;
}

export interface PlanSession {
  sessionNumber: number;
  title: string;
  paretoJustification: string;
  objectives: string[];
  activities: string[];
  resources: string[];
  reviewQuestions: string[];
  successCriteria: string;
  completed: boolean;
  completedAt?: Date;
}

export interface LearningPlan {
  id?: number;
  topicId: number;
  sessions: PlanSession[];
  skippedTopics: string[];
  status: "draft" | "active" | "completed";
  createdAt: Date;
}

export interface QuizQuestion {
  question: string;
  userAnswer: string;
  score: number;
  feedback: string;
  difficulty: string;
  format: string;
}

export interface QuizAttempt {
  id?: number;
  topicId: number;
  score: number;
  difficulty: string;
  questions: QuizQuestion[];
  completedAt: Date;
}

export interface Flashcard {
  id?: number;
  topicId: number;
  concept: string;
  front: string;
  back: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewAt: Date;
  lastReviewedAt?: Date;
  createdAt?: Date;
  source?: "quiz_wrong" | "session_takeaway" | "cheatsheet";
}

export interface MasteryScores {
  completeness: number;
  accuracy: number;
  depth: number;
  originality: number;
}

export interface ChatSession {
  id?: number;
  topicId: number;
  technique: string;
  concept: string;
  phase: string;
  round: number;
  masteryScores: MasteryScores;
  completed: boolean;
  createdAt: Date;
}

export interface ChatMessage {
  id?: number;
  sessionId: number;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
}

export interface CheatSheet {
  id?: number;
  topicId: number;
  content: string;
  version: number;
  level: string;
  createdAt: Date;
}

export interface ResourceItem {
  title: string;
  author: string;
  category: string;
  justification: string;
  bestFor: string;
  estimatedTime: string;
  cost: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  url?: string;
  paretoChapters?: string;
}

export interface Resource {
  id?: number;
  topicId: number;
  items: ResourceItem[];
  createdAt: Date;
}

export interface Badge {
  id?: number;
  type: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
}

export interface StreakEntry {
  id?: number;
  date: string;
  maintained: boolean;
}

export interface DailyChallenge {
  id?: number;
  date: string;
  topic: string;
  question: string;
  correctAnswer: string;
  explanation: string;
  answered: boolean;
  userAnswer?: string;
  score?: number;
}

export interface CoinTransaction {
  id?: number;
  type: "earn" | "spend";
  amount: number;
  reason: string;
  createdAt: Date;
}

export interface InventoryItem {
  id?: number;
  itemType: string;
  itemId: string;
  acquiredAt: Date;
  equipped: boolean;
  expiresAt?: Date;
}

export interface GuidedPathProgress {
  id?: number;
  topicId: number;
  currentStep: number;
  stepsCompleted: string[];
  startedAt: Date;
}
