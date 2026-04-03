// ────────────────────────────────────────────────────────────────────────────
// Free tier daily limits — generous enough to hook users, tight enough to convert
// Strategy: Give 20-30% of value free. Let users feel the product's worth.
// Pro users bypass ALL limits (checked in use-feature-limit.ts)
// ────────────────────────────────────────────────────────────────────────────

export const FREE_LIMITS: Record<string, { daily: number; label: string }> = {
  // Core learning — generous to build habit
  quiz: { daily: 10, label: "Pariksha questions" },        // 10/day free (was 5)
  feynman: { daily: 2, label: "Guru Mode sessions" },      // 2/day free (was 1)
  mitra: { daily: 5, label: "Mitra AI messages" },          // 5/day free (was 3)

  // Content access — preview model
  cheatsheet_export: { daily: 1, label: "Quick Saar exports" }, // 1/day free (was 0)
  revision: { daily: 10, label: "revision cards" },           // 10/day free (was 5)
  question_reveal: { daily: 5, label: "answer reveals" },     // 5/day free (was 3)
  bookmark: { daily: 3, label: "bookmarks" },                  // 3/day free (was 0)
};
