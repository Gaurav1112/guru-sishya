// ────────────────────────────────────────────────────────────────────────────
// Flashcard Generator — auto-creates flashcards from various sources
// ────────────────────────────────────────────────────────────────────────────
//
// Flashcards are generated from three sources:
//   1. Quiz questions the user got wrong (source: "quiz_wrong")
//   2. Key takeaways from completed sessions (source: "session_takeaway")
//   3. Concepts from cheat sheets (source: "cheatsheet")
//
// This module provides functions to generate flashcards from each source,
// with deduplication to avoid creating duplicate cards.
// ────────────────────────────────────────────────────────────────────────────

import { db } from "@/lib/db";
import type { QuizQuestion } from "@/lib/types";
import type { ReviewFlashcard } from "./types";

// ── Deduplication ───────────────────────────────────────────────────────────

/**
 * Check if a flashcard with similar content already exists for the topic.
 * Uses a simple substring match on the front text to avoid exact duplicates.
 */
async function isDuplicate(
  topicId: number,
  front: string
): Promise<boolean> {
  const normalizedFront = front.toLowerCase().trim().slice(0, 80);
  const existing = await db.flashcards
    .where("topicId")
    .equals(topicId)
    .toArray();

  return existing.some(
    (card) =>
      card.front.toLowerCase().trim().slice(0, 80) === normalizedFront
  );
}

// ── Default SM-2 values for new cards ───────────────────────────────────────

function newCardDefaults(): Pick<
  ReviewFlashcard,
  "easeFactor" | "interval" | "repetitions" | "nextReviewAt" | "createdAt"
> {
  return {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewAt: new Date(), // due immediately
    createdAt: new Date(),
  };
}

// ── Source 1: Quiz Wrong Answers ────────────────────────────────────────────
//
// When a user completes a quiz and gets a question wrong (score < 7),
// create a flashcard from the question and the correct answer.

export interface QuizWrongInput {
  topicId: number;
  quizAttemptId: number;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  feedback: string;
  score: number;
}

/**
 * Generate flashcards from quiz questions the user answered incorrectly.
 * Only creates cards for questions with score < 7.
 */
export async function generateFlashcardsFromQuizWrong(
  inputs: QuizWrongInput[]
): Promise<number> {
  let created = 0;

  for (const input of inputs) {
    if (input.score >= 7) continue; // only create for wrong/weak answers

    const front = input.question;
    const back = [
      input.correctAnswer,
      input.feedback ? `\n\n---\n**Why:** ${input.feedback}` : "",
    ].join("");

    if (await isDuplicate(input.topicId, front)) continue;

    try {
      await db.flashcards.add({
        topicId: input.topicId,
        concept: front.slice(0, 100),
        front,
        back,
        source: "quiz_wrong",
        sourceQuizAttemptId: input.quizAttemptId,
        ...newCardDefaults(),
      } as any);
      created++;
    } catch {
      // Ignore individual card errors
    }
  }

  return created;
}

/**
 * Convenience wrapper: extract wrong answers from a completed QuizAttempt
 * and generate flashcards.
 */
export async function generateFlashcardsFromQuizAttempt(
  topicId: number,
  quizAttemptId: number,
  questions: QuizQuestion[]
): Promise<number> {
  const inputs: QuizWrongInput[] = questions
    .filter((q) => q.score < 7)
    .map((q) => ({
      topicId,
      quizAttemptId,
      question: q.question,
      userAnswer: q.userAnswer,
      correctAnswer: q.feedback, // feedback contains the correct answer explanation
      feedback: q.feedback,
      score: q.score,
    }));

  return generateFlashcardsFromQuizWrong(inputs);
}

// ── Source 2: Session Key Takeaways ─────────────────────────────────────────
//
// When a user completes a learning session, extract key takeaways and
// create flashcards from them. The front of the card is a question derived
// from the takeaway, and the back is the takeaway itself.

export interface SessionTakeawayInput {
  topicId: number;
  sessionNumber: number;
  sessionTitle: string;
  takeaways: string[];
}

/**
 * Generate flashcards from session key takeaways.
 * Transforms each takeaway into a Q&A format.
 */
export async function generateFlashcardsFromSession(
  input: SessionTakeawayInput
): Promise<number> {
  let created = 0;

  for (const takeaway of input.takeaways) {
    if (!takeaway.trim()) continue;

    // Transform takeaway into a question
    const front = takeawayToQuestion(takeaway, input.sessionTitle);
    const back = takeaway;

    if (await isDuplicate(input.topicId, front)) continue;

    try {
      await db.flashcards.add({
        topicId: input.topicId,
        concept: takeaway.slice(0, 100),
        front,
        back,
        source: "session_takeaway",
        sourceSessionNumber: input.sessionNumber,
        ...newCardDefaults(),
      } as any);
      created++;
    } catch {
      // Ignore individual card errors
    }
  }

  return created;
}

/**
 * Convert a takeaway statement into a question.
 * Uses simple heuristics — no AI required.
 */
function takeawayToQuestion(takeaway: string, sessionTitle: string): string {
  // Remove leading bullets, dashes, numbers
  const cleaned = takeaway.replace(/^[\s\-\*\d\.\)]+/, "").trim();

  // If it's already short enough, just prepend "What is" or "Explain"
  if (cleaned.length < 120) {
    // Check if it contains a definition pattern ("X is Y" or "X are Y")
    const defMatch = cleaned.match(/^(.+?)\s+(is|are|refers to|means)\s+/i);
    if (defMatch) {
      return `What ${defMatch[2].toLowerCase()} ${defMatch[1].trim()}?`;
    }

    // Check if it starts with a verb (imperative)
    const verbStart = cleaned.match(
      /^(use|implement|apply|avoid|prefer|ensure|always|never|remember)/i
    );
    if (verbStart) {
      return `In the context of ${sessionTitle}: Why should you "${cleaned.toLowerCase()}"?`;
    }

    return `Explain this concept from ${sessionTitle}: "${cleaned}"`;
  }

  // For longer takeaways, create a summary question
  const firstSentence = cleaned.split(/[.!?]/)[0].trim();
  return `Explain: ${firstSentence}`;
}

// ── Source 3: Cheat Sheet Concepts ──────────────────────────────────────────
//
// Parse a cheat sheet markdown and extract key concepts to create flashcards.
// Targets: headings, bold terms, bullet points with definitions.

export interface CheatsheetInput {
  topicId: number;
  topicName: string;
  content: string; // markdown
}

/**
 * Generate flashcards from a cheat sheet's content.
 * Extracts key concepts from markdown headings, bold text, and
 * definition-like bullet points.
 */
export async function generateFlashcardsFromCheatsheet(
  input: CheatsheetInput
): Promise<number> {
  const concepts = extractConceptsFromMarkdown(input.content, input.topicName);
  let created = 0;

  for (const concept of concepts) {
    if (await isDuplicate(input.topicId, concept.front)) continue;

    try {
      await db.flashcards.add({
        topicId: input.topicId,
        concept: concept.concept.slice(0, 100),
        front: concept.front,
        back: concept.back,
        source: "cheatsheet",
        ...newCardDefaults(),
      } as any);
      created++;
    } catch {
      // Ignore individual card errors
    }
  }

  return created;
}

interface ExtractedConcept {
  concept: string;
  front: string;
  back: string;
}

/**
 * Extract Q&A pairs from markdown cheat sheet content.
 *
 * Strategy:
 * 1. Find ## and ### headings — each becomes a "What is X?" card
 * 2. Find bold terms (**term**) followed by a colon or dash — definition cards
 * 3. Find bullet points that look like "Term: definition" — definition cards
 * 4. Find code blocks with preceding context — "What does this code do?" cards
 */
function extractConceptsFromMarkdown(
  markdown: string,
  topicName: string
): ExtractedConcept[] {
  const concepts: ExtractedConcept[] = [];
  const lines = markdown.split("\n");
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 1. Headings (## or ###)
    const headingMatch = line.match(/^#{2,3}\s+(.+)/);
    if (headingMatch) {
      const heading = headingMatch[1].trim();
      // Collect the paragraph after the heading as the answer
      const bodyLines: string[] = [];
      for (let j = i + 1; j < lines.length && j < i + 8; j++) {
        const nextLine = lines[j].trim();
        if (nextLine.startsWith("#")) break;
        if (nextLine) bodyLines.push(nextLine);
      }
      if (bodyLines.length > 0 && !seen.has(heading.toLowerCase())) {
        seen.add(heading.toLowerCase());
        concepts.push({
          concept: heading,
          front: `What is ${heading} in the context of ${topicName}?`,
          back: bodyLines.join("\n").slice(0, 500),
        });
      }
      continue;
    }

    // 2. Bold terms with definitions: **Term** — definition OR **Term**: definition
    const boldDefMatch = line.match(
      /\*\*(.+?)\*\*\s*[\-\—:]\s*(.+)/
    );
    if (boldDefMatch) {
      const term = boldDefMatch[1].trim();
      const definition = boldDefMatch[2].trim();
      if (term.length > 2 && definition.length > 10 && !seen.has(term.toLowerCase())) {
        seen.add(term.toLowerCase());
        concepts.push({
          concept: term,
          front: `Define "${term}" in ${topicName}.`,
          back: definition.slice(0, 500),
        });
      }
      continue;
    }

    // 3. Bullet points with "Term: definition" pattern
    const bulletDefMatch = line.match(
      /^[\-\*]\s+\*?\*?(.+?)\*?\*?\s*:\s+(.+)/
    );
    if (bulletDefMatch) {
      const term = bulletDefMatch[1].replace(/\*/g, "").trim();
      const definition = bulletDefMatch[2].trim();
      if (term.length > 2 && definition.length > 10 && !seen.has(term.toLowerCase())) {
        seen.add(term.toLowerCase());
        concepts.push({
          concept: term,
          front: `What is "${term}"?`,
          back: definition.slice(0, 500),
        });
      }
    }
  }

  // Cap at 20 cards per cheat sheet to avoid overwhelming the user
  return concepts.slice(0, 20);
}
