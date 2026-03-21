// ────────────────────────────────────────────────────────────────────────────
// Quiz domain types
// ────────────────────────────────────────────────────────────────────────────

export type BloomLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const BLOOM_LABELS: Record<BloomLevel, string> = {
  1: "Remember",
  2: "Understand",
  3: "Apply",
  4: "Analyze",
  5: "Evaluate",
  6: "Create",
  7: "Transfer",
};

export type QuestionFormat =
  | "mcq"
  | "code_review"
  | "predict_output"
  | "scenario"
  | "fill_blank"
  | "true_false"
  | "ordering"
  | "open_ended";

export interface QuizSessionState {
  topicId: number;
  topicName: string;
  currentLevel: BloomLevel;
  questionIndex: number;
  questions: GeneratedQuestion[];
  answers: AnsweredQuestion[];
  inSessionStreak: number;
  consecutiveLowAtLevel: number;
  isCalibration: boolean;
  status:
    | "idle"
    | "loading"
    | "answering"
    | "grading"
    | "result"
    | "complete"
    | "breaking_point";
}

export interface GeneratedQuestion {
  question: string;
  format: QuestionFormat;
  difficulty: BloomLevel;
  options?: string[];
  bloomLabel: string;
  correctAnswer?: string;
}

export interface AnsweredQuestion extends GeneratedQuestion {
  userAnswer: string;
  score: number;
  feedback: string;
  missed: string[];
  perfectAnswer: string;
}

export interface QuizResult {
  totalScore: number;
  averageScore: number;
  highestLevel: BloomLevel;
  breakingPoint: BloomLevel | null;
  questionsAnswered: number;
  perfectCount: number;
  xpEarned: number;
  coinsEarned: number;
}
