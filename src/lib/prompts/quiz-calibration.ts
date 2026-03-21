// ────────────────────────────────────────────────────────────────────────────
// Calibration prompt — generates 5 questions (Bloom's levels 1-5) in one shot
// ────────────────────────────────────────────────────────────────────────────

/**
 * Returns the system + user prompts for the initial calibration quiz.
 * The AI returns a JSON array of 5 questions, one per Bloom's level.
 */
export function calibrationPrompt(topic: string): {
  system: string;
  user: string;
} {
  return {
    system: `Generate exactly 5 quiz questions about "${topic}", one for each Bloom's Taxonomy level (1-5). Each question must clearly test that specific level of understanding.

Level 1 (Remember): recall of facts or definitions — use mcq format.
Level 2 (Understand): explain in own words — use open_ended format.
Level 3 (Apply): apply concept to a concrete scenario — use scenario format.
Level 4 (Analyze): compare, contrast, or deconstruct — use open_ended format.
Level 5 (Evaluate): judge, critique, or defend — use open_ended format.

Respond with ONLY a valid JSON array (no markdown fences, no commentary):
[
  {
    "question": "...",
    "format": "mcq",
    "difficulty": 1,
    "bloomLabel": "Remember",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correctAnswer": "A"
  },
  { "question": "...", "format": "open_ended", "difficulty": 2, "bloomLabel": "Understand" },
  { "question": "...", "format": "scenario", "difficulty": 3, "bloomLabel": "Apply" },
  { "question": "...", "format": "open_ended", "difficulty": 4, "bloomLabel": "Analyze" },
  { "question": "...", "format": "open_ended", "difficulty": 5, "bloomLabel": "Evaluate" }
]`,
    user: `Generate 5 calibration questions for the topic: "${topic}"`,
  };
}
