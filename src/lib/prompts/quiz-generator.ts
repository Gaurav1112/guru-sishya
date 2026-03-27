// ────────────────────────────────────────────────────────────────────────────
// Quiz question generation and grading prompts
// ────────────────────────────────────────────────────────────────────────────

import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import type { BloomLevel, QuestionFormat } from "../quiz/types";
import { BLOOM_LABELS } from "../quiz/types";

const FORMAT_INSTRUCTIONS: Record<QuestionFormat, string> = {
  mcq: 'Multiple choice with exactly 4 options labeled A, B, C, D. Include "options" array and "correctAnswer" field with the letter (e.g. "A").',
  code_review:
    "Show a code snippet with a bug. Ask the student to find and explain the bug.",
  predict_output:
    "Show a code snippet and ask what it outputs. Do NOT include correctAnswer in the JSON — it will be graded by AI.",
  scenario:
    "Describe a real-world scenario and ask how to solve it. Do NOT include correctAnswer in the JSON.",
  fill_blank:
    'A statement with a blank (___) to fill in. Include "correctAnswer" with the expected word or phrase.',
  true_false:
    'A statement that is either true or false. Include "correctAnswer" as exactly "True" or "False".',
  ordering:
    "List 4-6 steps that need to be put in the correct order. Present them shuffled. Do NOT include correctAnswer.",
  open_ended:
    "An open-ended question requiring a detailed explanation. Do NOT include correctAnswer.",
};

/**
 * Builds the system + user prompt for generating a single quiz question.
 */
export function quizQuestionPrompt(
  topic: string,
  level: BloomLevel,
  format: QuestionFormat,
  previousQuestions: string[]
): { system: string; user: string } {
  const bloomDesc = BLOOM_LABELS[level];

  const levelDescription: Record<BloomLevel, string> = {
    1: "Test recall of definitions, facts, and terminology.",
    2: "Test ability to explain concepts in own words and paraphrase.",
    3: "Test ability to apply concepts to new concrete scenarios.",
    4: "Test ability to compare, contrast, break down, and deconstruct concepts.",
    5: "Test ability to judge, critique, weigh trade-offs, and defend positions.",
    6: "Test ability to design, build, propose, or synthesise new solutions.",
    7: "Test ability to transfer concepts to a completely different domain (analogical transfer).",
  };

  const mcqExtras =
    format === "mcq"
      ? `, "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": "A"`
      : "";
  const answerExtras =
    format === "fill_blank" || format === "true_false"
      ? `, "correctAnswer": "..."`
      : "";

  return {
    system: buildSystemPrompt(`You are a strict quiz generator for the topic "${topic}". Generate exactly ONE question at Bloom's Taxonomy Level ${level} (${bloomDesc}).

Bloom's Level ${level} — ${bloomDesc}:
${levelDescription[level]}

Format: ${FORMAT_INSTRUCTIONS[format]}

Respond with ONLY valid JSON (no markdown fences, no commentary):
{
  "question": "the question text (use markdown code fences for any code)",
  "format": "${format}",
  "difficulty": ${level},
  "bloomLabel": "${bloomDesc}"${mcqExtras}${answerExtras}
}`, { topicName: topic }),
    user: `Generate a ${bloomDesc}-level ${format} question about "${topic}".${
      previousQuestions.length > 0
        ? `\n\nDo NOT repeat these previous questions:\n${previousQuestions
            .map((q, i) => `${i + 1}. ${q}`)
            .join("\n")}`
        : ""
    }`,
  };
}

/**
 * Builds the system + user prompt for grading a student's open-ended answer.
 * Uses a 0-10 scale to stay consistent with the quiz engine's thresholds.
 */
export function quizGradingPrompt(
  question: string,
  userAnswer: string,
  difficulty: BloomLevel
): { system: string; user: string } {
  return {
    system: buildSystemPrompt(`You are a strict but fair grader. Score the student's answer 0-10.

Scoring guidelines:
- 0-3: Major misunderstanding or mostly wrong
- 4-6: Partially correct but missing key concepts
- 7-8: Good understanding with minor gaps
- 9: Excellent, nearly complete
- 10: ONLY for genuinely exceptional answers that go beyond what was asked

IMPORTANT: 7/10 is a GOOD score. Do NOT inflate scores. Always identify what is missing even in correct answers.

Respond with ONLY valid JSON (no markdown fences):
{
  "score": <number 0-10>,
  "feedback": "specific feedback on what was right and wrong",
  "missed": ["list of concepts or points the student missed"],
  "perfectAnswer": "what a complete, perfect answer would include"
}`),
    user: `Question (Bloom's Level ${difficulty}): ${question}\n\nStudent's Answer: ${userAnswer}`,
  };
}
