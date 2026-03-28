// ────────────────────────────────────────────────────────────────────────────
// Review System — Public API
// ────────────────────────────────────────────────────────────────────────────

// Types
export type {
  ReviewFlashcard,
  ReviewSession,
  ReviewScheduleEntry,
  ReviewTestQuestion,
  ReviewTestResult,
  ReviewStreak,
  ReviewDashboardSummary,
  ReviewType,
  FlashcardQuality,
  FlashcardReviewAction,
} from "./types";

// SM-2 Algorithm (canonical implementation)
export {
  sm2,
  selfAssessmentToQuality as sm2SelfAssessmentToQuality,
  quizScoreToQuality,
  DEFAULT_EASE_FACTOR,
  SM2_DEFAULTS,
} from "./sm2";
export type { SM2Result, SM2Quality, SelfAssessmentLabel } from "./sm2";

// Scheduler
export {
  getCardsDueToday,
  getCardsForWeeklyReview,
  getCardsForMonthlyReview,
  getCardsForTopic,
  selectDailyQuizCards,
  selectWeeklyTestCards,
  selectMonthlyTestCards,
  getReviewDashboardSummary,
  getAvailableReviews,
} from "./scheduler";

// Flashcard Generator
export {
  generateFlashcardsFromQuizWrong,
  generateFlashcardsFromQuizAttempt,
  generateFlashcardsFromSession,
  generateFlashcardsFromCheatsheet,
} from "./flashcard-generator";

// Review Engine
export {
  processFlashcardReview,
  completeReviewSession,
  calculateReviewRewards,
  selfAssessmentToQuality,
} from "./review-engine";
export type { SelfAssessment, ReviewRewards } from "./review-engine";

// Question Selector (for weekly/monthly tests using quiz bank)
export {
  getWeeklyTestQuestions,
  getMonthlyTestQuestions,
  computeTopicBreakdown,
} from "./question-selector";
export type {
  TopicScoreBreakdown,
  TimedTestResult,
} from "./question-selector";
