// ────────────────────────────────────────────────────────────────────────────
// Celebration types and tiers
// ────────────────────────────────────────────────────────────────────────────

export type CelebrationType =
  | "xp_gain"
  | "level_up"
  | "badge"
  | "streak_milestone"
  | "perfect_round"
  | "streak_broken";

export type CelebrationTier = "subtle" | "satisfying" | "celebration" | "milestone";

/**
 * Maps a celebration type to its visual intensity tier.
 */
export function getCelebrationTier(type: CelebrationType): CelebrationTier {
  switch (type) {
    case "xp_gain":
      return "subtle";
    case "streak_milestone":
    case "perfect_round":
      return "satisfying";
    case "badge":
      return "milestone";
    case "streak_broken":
      return "celebration";
    case "level_up":
      return "milestone";
  }
}

/**
 * Auto-dismiss duration in milliseconds for each tier.
 */
export function getDismissDuration(tier: CelebrationTier): number {
  switch (tier) {
    case "subtle":
      return 1500;
    case "satisfying":
      return 2000;
    case "celebration":
      return 2000;
    case "milestone":
      return 3000;
  }
}
