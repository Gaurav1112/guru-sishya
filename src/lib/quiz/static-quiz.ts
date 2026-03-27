// ────────────────────────────────────────────────────────────────────────────
// Static Quiz — pick and grade questions from a pre-generated question bank
// ────────────────────────────────────────────────────────────────────────────

import type { QuizBankQuestion } from "@/lib/content/loader";
import { shuffleOptions, createSeededRng } from "./shuffle";

/**
 * Pick a question from the quiz bank at the requested difficulty,
 * avoiding previously used questions.
 *
 * Strategy:
 * 1. Try exact difficulty match first
 * 2. Fall back to +/-1 difficulty
 * 3. Fall back to any remaining question
 * 4. Return null if bank is exhausted
 */
export function pickQuestion(
  quizBank: QuizBankQuestion[],
  difficulty: number,
  previousQuestions: string[],
  sessionSeed?: number
): QuizBankQuestion | null {
  const prevSet = new Set(previousQuestions.map((q) => q.trim().toLowerCase()));
  const available = quizBank.filter(
    (q) => !prevSet.has(q.question.trim().toLowerCase())
  );
  if (available.length === 0) return null;

  const rng = sessionSeed != null
    ? createSeededRng(sessionSeed + previousQuestions.length)
    : undefined;
  const pick = (arr: QuizBankQuestion[]) =>
    arr[Math.floor((rng ?? Math.random)() * arr.length)];

  const exactMatch = available.filter((q) => q.difficulty === difficulty);
  let question: QuizBankQuestion;
  if (exactMatch.length > 0) {
    question = pick(exactMatch);
  } else {
    const nearMatch = available.filter((q) => Math.abs(q.difficulty - difficulty) <= 1);
    question = nearMatch.length > 0 ? pick(nearMatch) : pick(available);
  }

  if (question.options && question.options.length > 1 && question.correctAnswer) {
    const { shuffledOptions, newCorrectAnswer } = shuffleOptions(
      [...question.options],
      question.correctAnswer,
      rng ?? Math.random
    );
    return { ...question, options: shuffledOptions, correctAnswer: newCorrectAnswer };
  }
  return question;
}

/**
 * Grade an answer against a quiz bank question.
 *
 * For MCQ / true_false / fill_blank: compares against correctAnswer.
 * For open_ended and other formats: uses simple keyword matching heuristic.
 */
export function gradeStaticQuestion(
  question: QuizBankQuestion,
  userAnswer: string
): {
  score: number;
  feedback: string;
  missed: string[];
  perfectAnswer: string;
} {
  const normalUser = userAnswer.trim().toUpperCase();
  const correct = (question.correctAnswer ?? "").trim().toUpperCase();
  const format = question.format.toLowerCase();

  // ── MCQ ─────────────────────────────────────────────────────────────────
  if (format === "mcq") {
    const isCorrect = normalUser === correct;
    const optionText =
      question.options?.find((o) =>
        o.toUpperCase().startsWith(correct + ")")
      ) ?? question.correctAnswer ?? "";

    return {
      score: isCorrect ? 10 : 0,
      feedback: isCorrect
        ? `Correct! ${question.explanation}`
        : `Incorrect. The correct answer was ${question.correctAnswer}. ${question.explanation}`,
      missed: isCorrect ? [] : [`The correct answer was: ${optionText}`],
      perfectAnswer: optionText || question.correctAnswer || "",
    };
  }

  // ── True/False ──────────────────────────────────────────────────────────
  if (format === "true_false") {
    const isCorrect = normalUser === correct;
    return {
      score: isCorrect ? 10 : 0,
      feedback: isCorrect
        ? `Correct! The statement is ${question.correctAnswer}. ${question.explanation}`
        : `Incorrect. The statement is ${question.correctAnswer}. ${question.explanation}`,
      missed: isCorrect
        ? []
        : [`The correct answer was: ${question.correctAnswer}`],
      perfectAnswer: question.correctAnswer ?? "",
    };
  }

  // ── Fill blank ──────────────────────────────────────────────────────────
  if (format === "fill_blank") {
    const isExact = normalUser === correct;
    const isClose =
      normalUser.includes(correct) || correct.includes(normalUser);
    const score = isExact ? 10 : isClose ? 6 : 0;

    return {
      score,
      feedback:
        score === 10
          ? `Correct! ${question.explanation}`
          : score === 6
            ? `Close, but the expected answer was: ${question.correctAnswer}. ${question.explanation}`
            : `Incorrect. The expected answer was: ${question.correctAnswer}. ${question.explanation}`,
      missed:
        score < 10
          ? [`Expected: ${question.correctAnswer}`]
          : [],
      perfectAnswer: question.correctAnswer ?? "",
    };
  }

  // ── Open-ended / scenario / code_review / predict_output / ordering ───
  // Use a keyword matching heuristic based on the explanation
  return gradeOpenEnded(question, userAnswer);
}

/**
 * Simple keyword-matching heuristic for open-ended questions.
 * Extracts key terms from the question's explanation and checks
 * how many the user's answer contains.
 */
function gradeOpenEnded(
  question: QuizBankQuestion,
  userAnswer: string
): {
  score: number;
  feedback: string;
  missed: string[];
  perfectAnswer: string;
} {
  const explanation = question.explanation || "";
  const correctAnswer = question.correctAnswer || explanation;

  // Extract meaningful keywords (4+ chars) from the explanation
  const keywords = extractKeywords(explanation);

  if (keywords.length === 0) {
    // No keywords to match — give a moderate score for any non-empty answer
    const hasSubstance = userAnswer.trim().split(/\s+/).length >= 5;
    return {
      score: hasSubstance ? 6 : 3,
      feedback: hasSubstance
        ? `Answer recorded. ${explanation}`
        : `Your answer was too brief. ${explanation}`,
      missed: [],
      perfectAnswer: correctAnswer,
    };
  }

  const answerLower = userAnswer.toLowerCase();
  const matched = keywords.filter((kw) => answerLower.includes(kw));
  const ratio = matched.length / keywords.length;

  let score: number;
  let feedback: string;

  if (ratio >= 0.7) {
    score = 9;
    feedback = `Excellent answer! You covered the key concepts well. ${explanation}`;
  } else if (ratio >= 0.5) {
    score = 7;
    feedback = `Good answer with some gaps. ${explanation}`;
  } else if (ratio >= 0.3) {
    score = 5;
    feedback = `Partial answer — you missed some key points. ${explanation}`;
  } else if (ratio > 0) {
    score = 3;
    feedback = `Your answer only touched on a few key points. ${explanation}`;
  } else {
    const hasSubstance = userAnswer.trim().split(/\s+/).length >= 5;
    score = hasSubstance ? 3 : 1;
    feedback = `Your answer didn't cover the expected concepts. ${explanation}`;
  }

  const missedKeywords = keywords.filter((kw) => !answerLower.includes(kw));
  const missed =
    missedKeywords.length > 0
      ? [`Key concepts to include: ${missedKeywords.slice(0, 5).join(", ")}`]
      : [];

  return {
    score,
    feedback,
    missed,
    perfectAnswer: correctAnswer,
  };
}

/**
 * Extract meaningful keywords from text.
 * Filters out common stop words and short words.
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "need", "dare", "ought",
    "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
    "as", "into", "through", "during", "before", "after", "above", "below",
    "between", "out", "off", "over", "under", "again", "further", "then",
    "once", "here", "there", "when", "where", "why", "how", "all", "both",
    "each", "few", "more", "most", "other", "some", "such", "no", "nor",
    "not", "only", "own", "same", "so", "than", "too", "very", "just",
    "because", "but", "and", "or", "if", "while", "about", "up", "that",
    "this", "these", "those", "what", "which", "who", "whom", "its", "it",
    "they", "them", "their", "we", "our", "you", "your", "he", "she",
    "him", "her", "his", "also", "like", "even", "well", "back", "much",
    "many", "still", "make", "made", "get", "got", "take", "taken",
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !stopWords.has(w));

  // Deduplicate
  return [...new Set(words)];
}
