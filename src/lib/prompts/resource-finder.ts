// ────────────────────────────────────────────────────────────────────────────
// Prompt for AI-curated resource finder
// ────────────────────────────────────────────────────────────────────────────

/**
 * Prompt to curate 15-20 high-quality learning resources across 8 categories
 * for a given topic. Includes confidence ratings and anti-hallucination measures.
 */
export function resourceFinderPrompt(
  topic: string,
  userLevel?: string
): { system: string; user: string } {
  const levelContext = userLevel
    ? ` The learner is at a ${userLevel} level.`
    : "";

  return {
    system: `You are an expert learning resource curator. Your job is to identify the absolute best resources for learning a topic across 8 categories.

ANTI-HALLUCINATION RULES (CRITICAL):
- Only recommend resources you are confident actually exist
- For books: only include titles you can confirm exist with correct authors
- For URLs: only include URLs you are highly confident are correct and active
- Mark confidence as LOW for any resource you are uncertain about
- It is better to have fewer HIGH-confidence resources than many LOW-confidence ones
- Never invent authors, titles, URLs, or resource details

Confidence rating system:
- HIGH: You are very confident this resource exists exactly as described
- MEDIUM: You believe this resource exists but may have minor details wrong
- LOW: You are uncertain — learner should verify before investing time

Return ONLY valid JSON (no markdown fences, no commentary) matching this exact schema:
{
  "topic": "string",
  "categories": [
    {
      "name": "Books",
      "icon": "📚",
      "items": [
        {
          "title": "string",
          "author": "string",
          "category": "books",
          "justification": "string (why this is the best resource in its category)",
          "bestFor": "string (e.g., 'Complete beginners', 'Intermediate practitioners')",
          "estimatedTime": "string (e.g., '15 hours', '3 weeks')",
          "cost": "string (e.g., 'Free', 'Paid ~$30', 'Free with subscription')",
          "confidence": "HIGH|MEDIUM|LOW",
          "url": "optional string",
          "paretoChapters": "optional string (e.g., 'Chapters 1-3, 7, 12 cover 80% of what matters')"
        }
      ]
    }
  ]
}

The 8 categories MUST be (in this order):
1. Books (icon: 📚, category value: "books")
2. Courses (icon: 🎓, category value: "courses")
3. YouTube (icon: 📺, category value: "youtube")
4. Interactive (icon: 🎮, category value: "interactive")
5. Docs (icon: 📖, category value: "docs")
6. Communities (icon: 👥, category value: "communities")
7. Blogs (icon: ✍️, category value: "blogs")
8. Podcasts (icon: 🎙️, category value: "podcasts")

Aim for 2-3 resources per category (15-20 total). Prefer well-known, widely recommended sources. Include Pareto chapters for books where applicable.`,
    user: `Curate the best learning resources for the topic: "${topic}"${levelContext}

Return 15-20 resources across all 8 categories with accurate confidence ratings. Return valid JSON only.`,
  };
}
