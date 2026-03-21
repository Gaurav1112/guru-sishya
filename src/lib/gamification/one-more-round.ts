// ────────────────────────────────────────────────────────────────────────────
// One More Round — post-session engagement triggers
// ────────────────────────────────────────────────────────────────────────────

export interface OneMoreRoundTrigger {
  /** What fired this trigger */
  type:
    | "near_miss"
    | "close_to_badge"
    | "close_to_level"
    | "streak_active"
    | "daily_available"
    | "decay_alert"
    | "cliffhanger";
  /** Human-readable motivational message (never guilt-trips) */
  message: string;
  /** What the user gets if they accept */
  action: string;
  /** Multiplier on XP earned in the next round (1 = normal) */
  xpMultiplier: number;
}

export interface OneMoreRoundContext {
  /** Score (0-100) of the last quiz, if applicable */
  lastQuizScore?: number;
  /** XP remaining to reach the next level */
  xpToNextLevel: number;
  /** How many badges are close to being unlocked (within 1-2 actions) */
  badgesNearUnlock: number;
  /** Number of correct answers in a row during this session */
  inSessionStreak: number;
  /** Whether today's daily challenge has not been answered yet */
  dailyChallengeAvailable: boolean;
  /** Number of topics whose knowledge has decayed (past review date) */
  decayedTopicCount: number;
  /** How many "One More Round" prompts have been shown consecutively */
  consecutivePrompts: number;
}

/**
 * Checks context for engagement triggers in priority order.
 * Returns the highest-priority trigger, or null if none apply.
 * Never prompts more than twice in a row (consecutivePrompts >= 2).
 */
export function checkOneMoreRound(
  context: OneMoreRoundContext
): OneMoreRoundTrigger | null {
  const {
    lastQuizScore,
    xpToNextLevel,
    badgesNearUnlock,
    inSessionStreak,
    dailyChallengeAvailable,
    decayedTopicCount,
    consecutivePrompts,
  } = context;

  // Hard cap: never show more than 2 consecutive prompts
  if (consecutivePrompts >= 2) return null;

  // ── Priority 1: Near miss — scored 70-89, just missed a high score ─────────
  if (
    lastQuizScore !== undefined &&
    lastQuizScore >= 70 &&
    lastQuizScore < 90
  ) {
    return {
      type: "near_miss",
      message: `You scored ${lastQuizScore}% — you're so close to mastery! One more round could push you over 90%.`,
      action: "Retry the same topic at the same difficulty",
      xpMultiplier: 1.5,
    };
  }

  // ── Priority 2: Close to level-up (<50 XP away) ───────────────────────────
  if (xpToNextLevel <= 50 && xpToNextLevel > 0) {
    return {
      type: "close_to_level",
      message: `Just ${xpToNextLevel} XP away from your next level! One quick round will get you there.`,
      action: "Complete one quick quiz round for bonus XP",
      xpMultiplier: 1.2,
    };
  }

  // ── Priority 3: Badge almost in reach ────────────────────────────────────
  if (badgesNearUnlock > 0) {
    return {
      type: "close_to_badge",
      message: `A new badge is within reach! Keep going to unlock it.`,
      action: "Complete one more round to unlock a badge",
      xpMultiplier: 1.0,
    };
  }

  // ── Priority 4: Hot streak — 5+ correct in a row ─────────────────────────
  if (inSessionStreak >= 5) {
    return {
      type: "streak_active",
      message: `You're on a ${inSessionStreak}-answer hot streak! Keep the momentum going.`,
      action: "Continue your streak in a new round",
      xpMultiplier: 1.3,
    };
  }

  // ── Priority 5: Daily challenge available ─────────────────────────────────
  if (dailyChallengeAvailable) {
    return {
      type: "daily_available",
      message: `Today's Guru's Question is waiting for you — it only takes a minute!`,
      action: "Answer today's daily challenge",
      xpMultiplier: 1.0,
    };
  }

  // ── Priority 6: Decaying topics need review ──────────────────────────────
  if (decayedTopicCount >= 2) {
    return {
      type: "decay_alert",
      message: `${decayedTopicCount} topics are getting rusty. A quick review now saves double the effort later.`,
      action: "Review a decaying topic",
      xpMultiplier: 1.1,
    };
  }

  // ── Priority 7: Generic cliffhanger after a solid session ─────────────────
  if (lastQuizScore !== undefined && lastQuizScore >= 90) {
    return {
      type: "cliffhanger",
      message: `Excellent session! Curious how you'd do on a harder challenge?`,
      action: "Try the next difficulty level",
      xpMultiplier: 1.2,
    };
  }

  return null;
}
