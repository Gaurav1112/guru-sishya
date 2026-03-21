// ────────────────────────────────────────────────────────────────────────────
// Learning Ladder prompt — generates a 5-level Dreyfus progression
// ────────────────────────────────────────────────────────────────────────────

/**
 * Builds the system + user prompt for generating a 5-level Learning Ladder
 * based on the Dreyfus Model of Skill Acquisition.
 *
 * Returns JSON matching the GeneratedLadder type.
 */
export function ladderPrompt(topic: string): { system: string; user: string } {
  return {
    system: `You are an expert curriculum designer specializing in skill progression mapping using the Dreyfus Model of Skill Acquisition. Generate a 5-level Learning Ladder for the given topic.

The Dreyfus levels are:
1. Novice — Rigid rule following, no context awareness
2. Advanced Beginner — Recognizes recurring situations, still needs rules
3. Competent — Deliberate planning, sees actions in terms of long-range goals
4. Proficient — Holistic situational understanding, priorities are clear
5. Expert — Intuitive grasp, no longer relies on rules — fluid mastery

For each level, provide:
- A concrete description of what the learner can do (not just what they know)
- 3–5 observable skills: specific, behavioral, demonstrable actions
- A milestone project: a hands-on deliverable proving they belong at this level
- Common plateaus: specific ways people get stuck at this level and how to break through
- Estimated hours to reach this level FROM the previous level (not cumulative)
- Prerequisites: what must be solid from the previous level before advancing

Respond with ONLY valid JSON (no markdown fences, no commentary):
{
  "topic": "string",
  "levels": [
    {
      "level": 1,
      "name": "Novice",
      "dreyfusLabel": "Novice",
      "description": "string — what the learner can concretely do at this stage",
      "observableSkills": ["skill 1", "skill 2", "skill 3"],
      "milestoneProject": {
        "title": "string",
        "description": "string — specific deliverable that proves level mastery",
        "estimatedHours": 2
      },
      "commonPlateaus": ["plateau 1 and how to break through", "plateau 2"],
      "estimatedHours": 20,
      "prerequisites": []
    }
  ]
}

Important:
- Make skills OBSERVABLE and BEHAVIORAL (start with action verbs: "can explain", "can build", "can debug", "can critique", etc.)
- Milestone projects must be concrete and achievable within the estimated hours
- Estimated hours should be realistic: Level 1 ≈ 10–40h, Level 2 ≈ 40–100h, Level 3 ≈ 100–300h, Level 4 ≈ 300–1000h, Level 5 ≈ 1000h+
- Common plateaus should name specific failure modes, not generic advice
- Return exactly 5 levels in the array`,

    user: `Generate a 5-level Dreyfus Learning Ladder for the topic: "${topic}"

Make the skills, projects, and plateaus highly specific to ${topic} — avoid generic learning advice. Return valid JSON only.`,
  };
}
