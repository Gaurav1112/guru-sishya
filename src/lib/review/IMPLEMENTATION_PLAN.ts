// ────────────────────────────────────────────────────────────────────────────
// SPACED REPETITION & REVISION SYSTEM — COMPLETE IMPLEMENTATION PLAN
// ────────────────────────────────────────────────────────────────────────────
//
// This file is the authoritative reference for the review system architecture.
// It documents every change needed, organized by area.
//
// ============================================================================
// TABLE OF CONTENTS
// ============================================================================
//
//  1. DATABASE SCHEMA CHANGES  (src/lib/db.ts)
//  2. TYPE ADDITIONS           (src/lib/types.ts)
//  3. FLASHCARD GENERATION     (already implemented: src/lib/review/flashcard-generator.ts)
//  4. SCHEDULING LOGIC         (already implemented: src/lib/review/scheduler.ts)
//  5. REVIEW ENGINE            (already implemented: src/lib/review/review-engine.ts)
//  6. INTEGRATION POINTS       (where existing code needs hooks)
//  7. NEW COMPONENTS           (file paths & responsibilities)
//  8. ZUSTAND STORE ADDITIONS  (review-slice.ts)
//  9. DASHBOARD INTEGRATION
// 10. ROUTING
//
// ============================================================================


// ============================================================================
// 1. DATABASE SCHEMA CHANGES
// ============================================================================
//
// Add version 4 to src/lib/db.ts with three new tables and an extended
// flashcards table.
//
// STEP: In db.ts, add this after version(3):
//
// ```typescript
// this.version(4).stores({
//   // ... keep ALL existing table definitions unchanged ...
//
//   // MODIFIED: flashcards gets new indexes for the review system
//   flashcards:
//     "++id, topicId, concept, nextReviewAt, easeFactor, interval, repetitions, source, lastReviewedAt, createdAt",
//
//   // NEW: Review sessions — tracks each completed review
//   reviewSessions:
//     "++id, type, scheduledFor, completedAt, createdAt",
//
//   // NEW: Review streaks — separate from learning streaks
//   reviewStreaks:
//     "++id, date, completed",
//
//   // NEW: Review test results — for weekly/monthly tests
//   reviewTestResults:
//     "++id, type, testDate, completedAt",
// });
// ```
//
// STEP: Add the new EntityTable declarations to the class:
//
// ```typescript
// reviewSessions!: EntityTable<ReviewSession, "id">;
// reviewStreaks!: EntityTable<ReviewStreak, "id">;
// reviewTestResults!: EntityTable<ReviewTestResult, "id">;
// ```
//
// STEP: Import the new types at the top of db.ts:
//
// ```typescript
// import type { ReviewSession, ReviewStreak, ReviewTestResult } from "./review/types";
// ```


// ============================================================================
// 2. TYPE ADDITIONS TO src/lib/types.ts
// ============================================================================
//
// The existing Flashcard interface needs these new optional fields:
//
// ```typescript
// export interface Flashcard {
//   id?: number;
//   topicId: number;
//   concept: string;
//   front: string;
//   back: string;
//   easeFactor: number;
//   interval: number;
//   repetitions: number;
//   nextReviewAt: Date;
//   // NEW FIELDS:
//   source?: "quiz_wrong" | "session_takeaway" | "cheatsheet";
//   sourceQuizAttemptId?: number;
//   sourceSessionNumber?: number;
//   lastReviewedAt?: Date;
//   createdAt?: Date;
// }
// ```


// ============================================================================
// 3. FLASHCARD GENERATION — INTEGRATION POINTS
// ============================================================================
//
// Three places in the existing codebase need to call the flashcard generator.
//
// ── 3a. Quiz Completion (quiz_wrong source) ─────────────────────────────────
//
// FILE: src/components/features/quiz/quiz-container.tsx
// FUNCTION: finalizeQuiz() — around line 570
//
// After the existing call to updateFlashcardsFromQuiz(), add:
//
// ```typescript
// import { generateFlashcardsFromQuizAttempt } from "@/lib/review/flashcard-generator";
//
// // Inside finalizeQuiz, after updateFlashcardsFromQuiz:
// const quizAttemptId = await db.quizAttempts.add({ ... }); // get the ID
// await generateFlashcardsFromQuizAttempt(
//   topicId,
//   quizAttemptId as number,
//   answers.map((a) => ({
//     question: a.question,
//     userAnswer: a.userAnswer,
//     score: a.score,
//     feedback: a.feedback,
//     difficulty: String(a.difficulty),
//     format: a.format,
//   }))
// );
// ```
//
// ── 3b. Session Completion (session_takeaway source) ────────────────────────
//
// FILE: src/app/app/topic/[id]/plan/session/[num]/page.tsx
// FUNCTION: handleMarkComplete() — around line 217
//
// After marking the session complete, extract key takeaways:
//
// ```typescript
// import { generateFlashcardsFromSession } from "@/lib/review/flashcard-generator";
//
// // Inside handleMarkComplete, after db.planSessions.update:
// if (nowCompleted && session?.keyTakeaways && session.keyTakeaways.length > 0) {
//   await generateFlashcardsFromSession({
//     topicId,
//     sessionNumber: sessionNum,
//     sessionTitle: session.title,
//     takeaways: session.keyTakeaways,
//   });
// }
// ```
//
// ── 3c. Cheat Sheet Generation (cheatsheet source) ──────────────────────────
//
// FILE: src/components/features/cheatsheet/cheatsheet-container.tsx
// FUNCTION: generate() — around line 66
//
// After saving the cheat sheet to Dexie, generate flashcards:
//
// ```typescript
// import { generateFlashcardsFromCheatsheet } from "@/lib/review/flashcard-generator";
//
// // Inside generate(), after db.cheatSheets.add:
// await generateFlashcardsFromCheatsheet({
//   topicId,
//   topicName,
//   content: fullText,
// });
// ```


// ============================================================================
// 4. SM-2 SCHEDULING LOGIC
// ============================================================================
//
// The SM-2 algorithm already exists at src/lib/spaced-repetition.ts.
// The review system uses it as-is through the review-engine.ts module.
//
// Schedule rules:
//
//   DAILY FLASHCARDS:
//     Query: flashcards WHERE nextReviewAt <= endOfToday
//     Sort by: retention probability (ascending — most urgent first)
//     Count: all due cards (no cap)
//
//   DAILY QUIZ:
//     Query: same as daily flashcards, but pick 5-10 cards
//     Prioritize: lowest retention probability
//     Format: present as quiz questions (front = question, user types answer,
//             then self-grades or auto-grades if original was MCQ)
//     Frequency: once per day
//
//   WEEKLY FLASHCARDS (every Sunday):
//     Query: ALL flashcards created or reviewed since Monday
//     Override SM-2: show regardless of nextReviewAt
//     Purpose: reinforce the full week's learning
//
//   WEEKLY TEST (every Sunday):
//     Query: 15-20 cards from the week, round-robin across topics
//     Format: quiz-style with grading
//     Prioritize: weakest retention first
//
//   MONTHLY TEST (1st of month):
//     Query: 30-50 cards from the month, round-robin across topics
//     Format: comprehensive mock test
//     Prioritize: weakest retention first


// ============================================================================
// 5. NEW UI COMPONENTS
// ============================================================================
//
// ── 5a. Review Hub Page ─────────────────────────────────────────────────────
// PATH: src/app/app/review/page.tsx
//
// The main entry point for all review activities. Shows:
//   - Cards due today count + "Start Review" CTA
//   - Daily quiz availability
//   - Weekly review (if Sunday)
//   - Monthly test (if 1st)
//   - Review streak flame
//   - Retention heatmap/calendar
//   - Decay breakdown (mastered/strong/fading/needs_review/forgotten)
//
// ── 5b. Flashcard Deck Component ────────────────────────────────────────────
// PATH: src/components/features/review/flashcard-deck.tsx
//
// Swipeable card stack with flip animation:
//   - Shows front of card
//   - User taps to flip and see back
//   - Four self-assessment buttons: Forgot / Hard / Good / Easy
//   - Maps to SM-2 quality: 0, 2, 3, 5
//   - Progress bar showing cards remaining
//   - Can swipe left (forgot) or right (good)
//
// ── 5c. Daily Quiz Component ────────────────────────────────────────────────
// PATH: src/components/features/review/daily-quiz.tsx
//
// Quick quiz from due flashcards:
//   - Shows card front as question
//   - Text input for answer
//   - Auto-grade by comparing to card back (fuzzy match)
//   - Or self-grade with quality buttons
//   - 5-10 questions, timed
//   - Results screen at end with XP/coins earned
//
// ── 5d. Review Test Component ───────────────────────────────────────────────
// PATH: src/components/features/review/review-test.tsx
//
// Used for both weekly and monthly tests:
//   - Shows questions one at a time
//   - Text/MCQ input based on original question format
//   - Timer visible
//   - Results breakdown by topic at end
//   - Highlights weakest areas
//
// ── 5e. Review Calendar Component ───────────────────────────────────────────
// PATH: src/components/features/review/review-calendar.tsx
//
// Shows a monthly calendar grid:
//   - Green dots for days with completed reviews
//   - Red dots for missed days
//   - Gold dot for today if review is pending
//   - Current review streak count
//
// ── 5f. Retention Overview Component ────────────────────────────────────────
// PATH: src/components/features/review/retention-overview.tsx
//
// Visual breakdown of memory retention:
//   - Horizontal bar chart: mastered / strong / fading / needs_review / forgotten
//   - Overall retention percentage
//   - Per-topic retention breakdown
//
// ── 5g. Dashboard Review Widget ─────────────────────────────────────────────
// PATH: src/components/features/review/dashboard-widget.tsx
//
// Small widget for the main dashboard:
//   - "X cards due" count
//   - Prominent "Review Now" button
//   - Review streak flame (small)
//   - Mini retention bar


// ============================================================================
// 6. ZUSTAND STORE ADDITIONS
// ============================================================================
//
// Create a new review slice: src/lib/stores/review-slice.ts
//
// ```typescript
// export interface ReviewState {
//   reviewStreak: number;
//   longestReviewStreak: number;
//   lastReviewDate: string; // ISO date
//   dailyReviewCompleted: boolean;
//   dailyQuizCompleted: boolean;
// }
//
// export interface ReviewActions {
//   setReviewStreak: (current: number, longest: number) => void;
//   markDailyReviewDone: () => void;
//   markDailyQuizDone: () => void;
//   resetDailyFlags: () => void; // called at midnight
// }
//
// export type ReviewSlice = ReviewState & ReviewActions;
// ```
//
// Then add ReviewSlice to StoreState in src/lib/store.ts and include
// "reviewStreak", "longestReviewStreak", "lastReviewDate" in the
// persisted state.


// ============================================================================
// 7. DASHBOARD INTEGRATION
// ============================================================================
//
// FILE: src/app/app/dashboard/page.tsx
//
// Add a new section between "Daily Challenge" and "Your Progress":
//
// ```tsx
// {/* Review Due */}
// <ReviewDashboardWidget />
// ```
//
// The widget (src/components/features/review/dashboard-widget.tsx) shows:
//   - If cards are due: "12 cards due for review" + "Review Now" button
//   - If daily quiz available: "Daily Quiz ready" sub-CTA
//   - After completion: "All caught up!" with a checkmark
//   - Review streak count


// ============================================================================
// 8. ROUTING & NAVIGATION
// ============================================================================
//
// ── 8a. New route ───────────────────────────────────────────────────────────
// PATH: src/app/app/review/page.tsx
//
// ── 8b. Sidebar update ──────────────────────────────────────────────────────
// FILE: src/components/layout/sidebar.tsx
//
// Add to navItems array (after "Topics"):
//
// ```typescript
// { href: "/app/review", label: "Review", icon: "🧠" },
// ```
//
// ── 8c. Sub-routes (optional, could be modal/tab instead) ───────────────────
// /app/review                  — Review hub
// /app/review?mode=flashcards  — Daily flashcard review
// /app/review?mode=quiz        — Daily quiz
// /app/review?mode=weekly      — Weekly review/test
// /app/review?mode=monthly     — Monthly test


// ============================================================================
// 9. IMPLEMENTATION ORDER (PHASES)
// ============================================================================
//
// PHASE 1 — Foundation (this PR):
//   [x] Create src/lib/review/types.ts
//   [x] Create src/lib/review/scheduler.ts
//   [x] Create src/lib/review/flashcard-generator.ts
//   [x] Create src/lib/review/review-engine.ts
//   [x] Create src/lib/review/index.ts
//   [x] Create this implementation plan
//
// PHASE 2 — Database & Type Updates:
//   [ ] Update src/lib/types.ts — add new fields to Flashcard
//   [ ] Update src/lib/db.ts — add version(4) with new tables
//   [ ] Create src/lib/stores/review-slice.ts
//   [ ] Update src/lib/store.ts — add ReviewSlice
//
// PHASE 3 — Flashcard Generation Integration:
//   [ ] Update quiz-container.tsx — generate cards on quiz completion
//   [ ] Update session page.tsx — generate cards on session completion
//   [ ] Update cheatsheet-container.tsx — generate cards on cheatsheet view
//
// PHASE 4 — Core UI Components:
//   [ ] Create src/components/features/review/flashcard-deck.tsx
//   [ ] Create src/components/features/review/daily-quiz.tsx
//   [ ] Create src/components/features/review/review-test.tsx
//   [ ] Create src/components/features/review/review-calendar.tsx
//   [ ] Create src/components/features/review/retention-overview.tsx
//
// PHASE 5 — Review Hub Page:
//   [ ] Create src/app/app/review/page.tsx
//   [ ] Update sidebar.tsx — add Review nav item
//
// PHASE 6 — Dashboard Integration:
//   [ ] Create src/components/features/review/dashboard-widget.tsx
//   [ ] Update dashboard/page.tsx — add ReviewDashboardWidget
//
// PHASE 7 — Polish:
//   [ ] Add review-specific badges
//   [ ] Add celebration overlays for review milestones
//   [ ] Add notification/reminder system (optional, PWA push)


// ============================================================================
// 10. DATA FLOW DIAGRAMS
// ============================================================================
//
// ── User completes a quiz ───────────────────────────────────────────────────
//
//   quiz-container.tsx
//     └─ finalizeQuiz()
//         ├─ db.quizAttempts.add()           ← existing
//         ├─ updateFlashcardsFromQuiz()       ← existing (updates SM-2)
//         └─ generateFlashcardsFromQuizAttempt()  ← NEW
//              └─ For each wrong answer (score < 7):
//                   └─ db.flashcards.add({ source: "quiz_wrong", ... })
//
// ── User completes a session ────────────────────────────────────────────────
//
//   session/[num]/page.tsx
//     └─ handleMarkComplete()
//         ├─ db.planSessions.update()        ← existing
//         └─ generateFlashcardsFromSession()     ← NEW
//              └─ For each keyTakeaway:
//                   └─ takeawayToQuestion() → db.flashcards.add({ source: "session_takeaway" })
//
// ── User views a cheat sheet ────────────────────────────────────────────────
//
//   cheatsheet-container.tsx
//     └─ generate()
//         ├─ db.cheatSheets.add()            ← existing
//         └─ generateFlashcardsFromCheatsheet()  ← NEW
//              └─ extractConceptsFromMarkdown() → db.flashcards.add({ source: "cheatsheet" })
//
// ── User opens /app/review ──────────────────────────────────────────────────
//
//   review/page.tsx
//     └─ useEffect on mount:
//         ├─ getReviewDashboardSummary()
//         │    ├─ getCardsDueToday()        → count for "X cards due"
//         │    ├─ calculateRetention()      → retention breakdown
//         │    └─ check review streaks      → streak count
//         └─ getAvailableReviews()          → which review types are active
//
// ── User starts daily flashcard review ──────────────────────────────────────
//
//   review/page.tsx?mode=flashcards
//     └─ FlashcardDeck component
//         ├─ getCardsDueToday()             → load cards
//         ├─ User flips each card
//         ├─ User rates: Forgot / Hard / Good / Easy
//         ├─ processFlashcardReview()       → update SM-2 schedule
//         └─ completeReviewSession()        → save session, update streak
//              └─ calculateReviewRewards()  → XP + coins
//
// ── User starts daily quiz ──────────────────────────────────────────────────
//
//   review/page.tsx?mode=quiz
//     └─ DailyQuiz component
//         ├─ selectDailyQuizCards()         → 5-10 lowest-retention cards
//         ├─ User answers each question
//         ├─ Grade answer (compare to card.back)
//         ├─ processFlashcardReview()       → update SM-2 per answer
//         └─ completeReviewSession()        → save session
//
// ── Weekly test (Sunday) ────────────────────────────────────────────────────
//
//   review/page.tsx?mode=weekly
//     └─ ReviewTest component
//         ├─ selectWeeklyTestCards()        → 15-20 cards, round-robin topics
//         ├─ User answers questions
//         ├─ Grade each answer
//         └─ completeReviewSession()        → save, large XP reward
//
// ── Monthly test (1st of month) ─────────────────────────────────────────────
//
//   review/page.tsx?mode=monthly
//     └─ ReviewTest component
//         ├─ selectMonthlyTestCards()       → 30-50 cards
//         ├─ User answers questions
//         ├─ Grade each answer
//         └─ completeReviewSession()        → save, largest XP reward

export {};
