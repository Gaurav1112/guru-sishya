// ────────────────────────────────────────────────────────────────────────────
// Prompts for 20-Hour Pareto Learning Plan generation
// ────────────────────────────────────────────────────────────────────────────

import type { DiagnosticAnswer } from "@/lib/plan/types";

/**
 * Prompt to generate 3 diagnostic questions that assess a learner's current
 * level, goals, and available time for a given topic.
 */
export function diagnosticProbesPrompt(topic: string): {
  system: string;
  user: string;
} {
  return {
    system: `You are an expert learning coach. Generate exactly 3 diagnostic questions to assess a learner's current level, goals, and available time for studying "${topic}".

The questions should uncover:
1. Their current knowledge level and background
2. Their specific learning goals and what they want to achieve
3. Their time availability, learning style, or constraints

Respond with ONLY valid JSON (no markdown fences, no commentary):
["question 1", "question 2", "question 3"]`,
    user: `Generate 3 diagnostic questions for the topic: "${topic}"`,
  };
}

/**
 * Prompt to generate a full 20-hour Pareto Learning Plan (10 sessions x 2 hours)
 * personalized based on diagnostic answers.
 */
export function planGenerationPrompt(
  topic: string,
  diagnosticAnswers: DiagnosticAnswer[]
): { system: string; user: string } {
  const answersText = diagnosticAnswers
    .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`)
    .join("\n\n");

  return {
    system: `You are an expert curriculum designer specializing in accelerated learning using the Pareto Principle (80/20 rule). Your goal is to create a focused 20-hour learning plan that identifies the 20% of a subject that delivers 80% of the value.

Design philosophy:
- Apply Pareto ruthlessly: identify the highest-leverage concepts and skills
- Session 1 MUST be an advance organizer — a high-level overview that gives the learner a mental map of the entire subject before diving into details
- Be explicit about what you are intentionally skipping and WHY (save the learner time)
- Each session is exactly 2 hours (10 sessions total = 20 hours)
- Sessions should build on each other progressively
- Include concrete, actionable activities
- Personalize based on the learner's diagnostic answers
- Be specific with resource recommendations

Return ONLY valid JSON (no markdown fences, no commentary) matching this exact schema:
{
  "topic": "string",
  "overview": "string (2-3 paragraph executive summary of the learning journey and Pareto strategy)",
  "skippedTopics": "string (detailed explanation of what is being intentionally excluded and why — be specific and reassuring)",
  "sessions": [
    {
      "sessionNumber": 1,
      "title": "string",
      "paretoJustification": "string (why this session is in the top 20% of value)",
      "objectives": ["string", "..."],
      "activities": [
        { "description": "string", "durationMinutes": 30 }
      ],
      "resources": [
        { "title": "string", "type": "video|article|book|exercise|interactive", "url": "optional string" }
      ],
      "reviewQuestions": ["string", "..."],
      "successCriteria": "string (how the learner knows they have mastered this session)"
    }
  ]
}

Important: Return exactly 10 sessions. Session 1 must be a high-level advance organizer.`,
    user: `Create a 20-hour Pareto Learning Plan for the topic: "${topic}"

Learner's diagnostic answers:
${answersText}

Personalize the plan based on these answers. Return valid JSON only.`,
  };
}
