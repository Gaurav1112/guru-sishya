// ────────────────────────────────────────────────────────────────────────────
// Free tier daily limits — tight enough that users hit a wall by day 3-5.
// Starter tier gets more generous limits; Pro bypasses ALL limits.
// Strategy: Let users taste the product, then convert via Starter or Pro.
// ────────────────────────────────────────────────────────────────────────────

export const FREE_LIMITS: Record<string, { daily: number; label: string }> = {
  // Core learning — just enough to hook, not enough to stay
  quiz: { daily: 3, label: "Pariksha questions" },             // 3/day (was 10)
  feynman: { daily: 0, label: "Guru Mode sessions" },          // Pro only (was 2)
  mitra: { daily: 2, label: "Mitra AI messages" },             // 2/day (was 5)

  // Content access — heavy paywall
  cheatsheet_export: { daily: 0, label: "Quick Saar exports" }, // Pro only (was 1)
  revision: { daily: 5, label: "revision cards" },              // 5/day (was 10)
  question_reveal: { daily: 2, label: "answer reveals" },       // 2/day (was 5)
  bookmark: { daily: 1, label: "bookmarks" },                   // 1/day (was 3)
};

// ────────────────────────────────────────────────────────────────────────────
// Starter tier daily limits — Rs.49/month, bridges the gap between Free and Pro
// Checked in use-feature-limit.ts when planType === "starter"
// ────────────────────────────────────────────────────────────────────────────

export const STARTER_LIMITS: Record<string, { daily: number; label: string }> = {
  quiz: { daily: Infinity, label: "Pariksha questions" },       // Unlimited (Easy+Medium only)
  feynman: { daily: 0, label: "Guru Mode sessions" },           // Pro only
  mitra: { daily: 10, label: "Mitra AI messages" },             // 10/day
  cheatsheet_export: { daily: 0, label: "Quick Saar exports" }, // View only, no export
  revision: { daily: Infinity, label: "revision cards" },       // Unlimited
  question_reveal: { daily: 10, label: "answer reveals" },      // 10/day
  bookmark: { daily: 10, label: "bookmarks" },                  // 10/day
};
