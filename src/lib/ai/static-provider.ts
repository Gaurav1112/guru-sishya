// ────────────────────────────────────────────────────────────────────────────
// Static Content Provider
//
// Serves pre-generated content from JSON files instead of calling AI APIs.
// Implements the AIProvider interface so it can be used as a drop-in
// replacement in the ResilientProvider failover chain.
// ────────────────────────────────────────────────────────────────────────────

import type { AIProvider, GenerateOptions, GradeResult } from "./types";
import { AIError } from "./types";
import {
  findTopicContent,
  type TopicContent,
  type QuizBankQuestion,
} from "@/lib/content/loader";
import { pickQuestion, gradeStaticQuestion } from "@/lib/quiz/static-quiz";

// ── Prompt content detection ──────────────────────────────────────────────

type ContentType =
  | "cheatsheet"
  | "plan"
  | "quiz_question"
  | "quiz_calibration"
  | "quiz_grading"
  | "resources"
  | "ladder"
  | "diagnostic"
  | "feynman"
  | "unknown";

function detectContentType(
  systemPrompt: string,
  userPrompt: string
): ContentType {
  const combined = (systemPrompt + " " + userPrompt).toLowerCase();

  if (combined.includes("cheat sheet") || combined.includes("cheatsheet")) {
    return "cheatsheet";
  }
  // Check resources BEFORE plan, because the resource prompt mentions
  // "Pareto chapters" which would falsely trigger the plan detection.
  if (
    combined.includes("resource curator") ||
    combined.includes("curate") ||
    (combined.includes("resource") && combined.includes("categories"))
  ) {
    return "resources";
  }
  // Check ladder BEFORE plan, because the ladder prompt uses
  // "curriculum designer" which would falsely trigger the plan detection.
  if (
    combined.includes("ladder") ||
    combined.includes("dreyfus") ||
    combined.includes("skill acquisition")
  ) {
    return "ladder";
  }
  if (
    combined.includes("learning plan") ||
    combined.includes("pareto") ||
    combined.includes("20-hour") ||
    combined.includes("curriculum designer")
  ) {
    return "plan";
  }
  if (
    combined.includes("calibration") &&
    (combined.includes("quiz") || combined.includes("question"))
  ) {
    return "quiz_calibration";
  }
  if (
    combined.includes("grade") ||
    combined.includes("grading") ||
    combined.includes("grader") ||
    combined.includes("score the student")
  ) {
    return "quiz_grading";
  }
  if (
    combined.includes("quiz") ||
    combined.includes("bloom") ||
    combined.includes("quiz generator")
  ) {
    return "quiz_question";
  }
  if (
    combined.includes("diagnostic") &&
    combined.includes("question")
  ) {
    return "diagnostic";
  }
  if (
    combined.includes("feynman") ||
    combined.includes("socratic")
  ) {
    return "feynman";
  }
  return "unknown";
}

/**
 * Extract the topic name from a prompt. Looks for patterns like:
 *   "topic: "Something""
 *   "for the topic "${topic}""
 *   "about "Something""
 */
function extractTopicFromPrompt(
  systemPrompt: string,
  userPrompt: string
): string {
  const combined = systemPrompt + " " + userPrompt;

  // Match patterns like: topic: "X", topic "${X}", about "${X}"
  const patterns = [
    /topic[:\s]+"([^"]+)"/i,
    /topic[:\s]+["']([^"']+)["']/i,
    /for\s+(?:the\s+)?topic[:\s]*"([^"]+)"/i,
    /about\s+"([^"]+)"/i,
    /for\s+"([^"]+)"/i,
  ];

  for (const pattern of patterns) {
    const match = combined.match(pattern);
    if (match?.[1]) return match[1];
  }

  return "";
}

// ── Track used questions per topic for deduplication ───────────────────────

const usedQuestions = new Map<string, string[]>();

function getUsedQuestions(topic: string): string[] {
  return usedQuestions.get(topic.toLowerCase()) ?? [];
}

function recordUsedQuestion(topic: string, question: string): void {
  const key = topic.toLowerCase();
  const existing = usedQuestions.get(key) ?? [];
  existing.push(question);
  usedQuestions.set(key, existing);
}

// ── StaticProvider ────────────────────────────────────────────────────────

export class StaticProvider implements AIProvider {
  async generateText(
    userPrompt: string,
    systemPrompt: string,
    _options?: GenerateOptions
  ): Promise<string> {
    const contentType = detectContentType(systemPrompt, userPrompt);
    const topicName = extractTopicFromPrompt(systemPrompt, userPrompt);
    const content = topicName
      ? await findTopicContent(topicName)
      : null;

    switch (contentType) {
      case "cheatsheet":
        if (content?.cheatSheet) return content.cheatSheet;
        break;

      case "plan":
        if (content?.plan) {
          return JSON.stringify({
            topic: content.topic,
            ...content.plan,
          });
        }
        break;

      case "diagnostic":
        return JSON.stringify(this.getDiagnosticQuestions(topicName));

      case "resources":
        if (content?.resources) {
          return JSON.stringify(
            this.buildResourceCollection(content)
          );
        }
        break;

      case "ladder":
        if (content?.ladder) {
          return JSON.stringify({
            topic: content.topic,
            levels: content.ladder.levels,
          });
        }
        break;

      case "quiz_calibration":
        if (content?.quizBank) {
          return JSON.stringify(
            this.buildCalibrationQuestions(content.quizBank)
          );
        }
        break;

      case "quiz_question":
        if (content?.quizBank) {
          const difficulty = this.extractDifficulty(systemPrompt, userPrompt);
          const used = getUsedQuestions(content.topic);
          const q = pickQuestion(content.quizBank, difficulty, used);
          if (q) {
            recordUsedQuestion(content.topic, q.question);
            return JSON.stringify({
              question: q.question,
              format: q.format,
              difficulty: q.difficulty,
              bloomLabel: q.bloomLabel,
              options: q.options,
              correctAnswer: q.correctAnswer,
            });
          }
        }
        break;

      case "quiz_grading":
        return JSON.stringify(this.gradeFromPrompt(userPrompt, content));

      case "feynman":
        return this.handleFeynman(systemPrompt, userPrompt, content);

      default:
        break;
    }

    throw new AIError(
      `No pre-generated content available for "${topicName || "this topic"}". ` +
        `Try one of the built-in topics, or switch to an AI provider in Settings.`,
      "unknown"
    );
  }

  async generateStructured<T>(
    userPrompt: string,
    systemPrompt: string,
    parser: (text: string) => T,
    options?: GenerateOptions
  ): Promise<T> {
    const text = await this.generateText(userPrompt, systemPrompt, options);
    return parser(text);
  }

  async streamText(
    userPrompt: string,
    systemPrompt: string,
    onChunk: (text: string) => void,
    options?: GenerateOptions
  ): Promise<string> {
    const text = await this.generateText(userPrompt, systemPrompt, options);

    // Simulate streaming by sending the content in chunks
    const chunkSize = 80;
    for (let i = 0; i < text.length; i += chunkSize) {
      const chunk = text.slice(i, i + chunkSize);
      onChunk(chunk);
      // No artificial delay — just chunk delivery for the onChunk callback
    }

    return text;
  }

  async gradeAnswer(
    question: string,
    answer: string,
    _rubric: string
  ): Promise<GradeResult> {
    // Simple heuristic grading for open-ended answers
    const answerLen = answer.trim().split(/\s+/).length;

    if (answerLen < 3) {
      return {
        score: 20,
        feedback: "Your answer was too brief. Try to provide more detail.",
        missed: ["More detailed explanation needed"],
        perfectAnswer:
          "A comprehensive answer addressing the key concepts of the question.",
      };
    }

    if (answerLen >= 20) {
      return {
        score: 70,
        feedback:
          "Good effort! You provided a detailed response. Review the model answer for completeness.",
        missed: [],
        perfectAnswer:
          "A comprehensive answer addressing all key concepts with examples.",
      };
    }

    return {
      score: 50,
      feedback:
        "Reasonable answer. Consider adding more depth and examples.",
      missed: ["Consider adding more detail and specific examples"],
      perfectAnswer:
        "A thorough answer with specific examples and clear explanations.",
    };
  }

  // ── Private helpers ───────────────────────────────────────────────────

  /**
   * Build 3 generic diagnostic questions for plan generation.
   */
  private getDiagnosticQuestions(topic: string): string[] {
    return [
      `What is your current experience level with ${topic || "this topic"}? (beginner, intermediate, advanced)`,
      `What specific aspects of ${topic || "this topic"} do you want to focus on, and what are your learning goals?`,
      `How much time can you dedicate per week to studying ${topic || "this topic"}?`,
    ];
  }

  /**
   * Build a ResourceCollection structure from flat resource data.
   */
  private buildResourceCollection(content: TopicContent) {
    const categoryMap = new Map<
      string,
      { name: string; icon: string; items: typeof content.resources }
    >();

    const categoryConfig: Record<string, { icon: string; name: string }> = {
      books: { icon: "📚", name: "Books" },
      courses: { icon: "🎓", name: "Courses" },
      youtube: { icon: "📺", name: "YouTube" },
      interactive: { icon: "🎮", name: "Interactive" },
      docs: { icon: "📖", name: "Docs" },
      communities: { icon: "👥", name: "Communities" },
      blogs: { icon: "✍️", name: "Blogs" },
      podcasts: { icon: "🎙️", name: "Podcasts" },
    };

    for (const resource of content.resources) {
      const catKey = resource.category.toLowerCase();
      if (!categoryMap.has(catKey)) {
        const config = categoryConfig[catKey] ?? {
          icon: "📄",
          name: resource.category,
        };
        categoryMap.set(catKey, { name: config.name, icon: config.icon, items: [] });
      }
      categoryMap.get(catKey)!.items.push(resource);
    }

    // Ensure all 8 categories exist, even if empty
    const orderedCategories = [
      "books", "courses", "youtube", "interactive",
      "docs", "communities", "blogs", "podcasts",
    ];

    const categories = orderedCategories.map((key) => {
      const existing = categoryMap.get(key);
      const config = categoryConfig[key] ?? { icon: "📄", name: key };
      return existing ?? { name: config.name, icon: config.icon, items: [] };
    });

    return { topic: content.topic, categories };
  }

  /**
   * Build 5 calibration questions from the quiz bank (one per difficulty 1-5).
   */
  private buildCalibrationQuestions(quizBank: QuizBankQuestion[]) {
    const questions: QuizBankQuestion[] = [];

    for (let level = 1; level <= 5; level++) {
      const atLevel = quizBank.filter((q) => q.difficulty === level);
      if (atLevel.length > 0) {
        questions.push(atLevel[Math.floor(Math.random() * atLevel.length)]);
      } else {
        // Fallback: pick any question closest to this difficulty
        const closest = quizBank
          .slice()
          .sort(
            (a, b) =>
              Math.abs(a.difficulty - level) - Math.abs(b.difficulty - level)
          );
        if (closest.length > 0) {
          questions.push(closest[0]);
        }
      }
    }

    // Map to the format expected by the calibration parser
    return questions.map((q) => ({
      question: q.question,
      format: q.format,
      difficulty: q.difficulty,
      bloomLabel: q.bloomLabel,
      options: q.options,
      correctAnswer: q.correctAnswer,
    }));
  }

  /**
   * Extract difficulty level from the prompt text.
   */
  private extractDifficulty(
    systemPrompt: string,
    userPrompt: string
  ): number {
    const combined = systemPrompt + " " + userPrompt;
    const match = combined.match(/level\s+(\d)/i);
    if (match) return parseInt(match[1], 10);

    // Check for bloom label references
    const bloomLabels: Record<string, number> = {
      remember: 1,
      understand: 2,
      apply: 3,
      analyze: 4,
      evaluate: 5,
      create: 6,
      transfer: 7,
    };

    for (const [label, level] of Object.entries(bloomLabels)) {
      if (combined.toLowerCase().includes(label)) return level;
    }

    return 1; // Default to easiest
  }

  /**
   * Grade an answer based on the grading prompt content.
   */
  private gradeFromPrompt(
    userPrompt: string,
    content: TopicContent | null
  ): {
    score: number;
    feedback: string;
    missed: string[];
    perfectAnswer: string;
  } {
    // Extract question and answer from the user prompt
    const questionMatch = userPrompt.match(
      /question.*?:\s*([\s\S]*?)(?:\n\n|student)/i
    );
    const answerMatch = userPrompt.match(
      /student'?s?\s*answer:\s*([\s\S]*)/i
    );

    const question = questionMatch?.[1]?.trim() ?? "";
    const answer = answerMatch?.[1]?.trim() ?? "";

    // Try to find the matching quiz bank question for better grading
    if (content?.quizBank && question) {
      const bankQuestion = content.quizBank.find((q) =>
        question.includes(q.question.substring(0, 30))
      );
      if (bankQuestion) {
        return gradeStaticQuestion(bankQuestion, answer);
      }
    }

    // Fallback: simple length-based heuristic
    const words = answer.split(/\s+/).length;
    if (words < 5) {
      return {
        score: 2,
        feedback: "Your answer is too brief. Please provide more detail.",
        missed: ["A more detailed explanation is needed"],
        perfectAnswer: "A comprehensive answer with specific examples.",
      };
    }
    if (words >= 30) {
      return {
        score: 7,
        feedback:
          "Good detailed response. Some key points may still be missing.",
        missed: [],
        perfectAnswer: "A thorough answer covering all key concepts.",
      };
    }
    return {
      score: 5,
      feedback:
        "Reasonable effort. Consider expanding your answer with examples.",
      missed: ["More depth and specific examples would strengthen your answer"],
      perfectAnswer: "A detailed answer with examples and clear reasoning.",
    };
  }

  /**
   * Handle Feynman Technique prompts.
   * Since Feynman sessions are highly interactive and conversational,
   * the static provider provides reasonable template responses.
   */
  private handleFeynman(
    systemPrompt: string,
    userPrompt: string,
    _content: TopicContent | null
  ): string {
    const combined = (systemPrompt + " " + userPrompt).toLowerCase();

    // Phase 1: Prime — ask what they know
    if (combined.includes("prior knowledge") || combined.includes("what they already know")) {
      const conceptMatch = (systemPrompt + " " + userPrompt).match(
        /about\s+"([^"]+)"/i
      );
      const concept = conceptMatch?.[1] ?? "this concept";
      return `Great choice! I'd love to help you explore **${concept}**. Before we dive in, tell me — what do you already know about ${concept}? Even a rough idea or something you've heard about it is a great starting point.`;
    }

    // Phase 2: Teach
    if (combined.includes("teach") && combined.includes("analogy")) {
      return `Let me break this down simply.

**The Core Idea:** Think of this concept like a library system. Just as a library organizes books by categories to make them easy to find, this concept organizes information in a structured way.

\`\`\`mermaid
flowchart TD
    A[Input] --> B{Process}
    B --> C[Output]
    B --> D[Feedback]
    D --> A
\`\`\`

**In summary:** The key is understanding the relationship between inputs, processing, and outputs, with feedback loops that allow for continuous improvement.

Now try to explain this back to me in your own words — as if you're teaching a friend.`;
    }

    // Phase 3: Recall evaluation
    if (combined.includes("evaluate") && combined.includes("recall")) {
      return JSON.stringify({
        completeness: 60,
        accuracy: 7,
        depth: 5,
        originality: 0,
        gaps: [
          "Could explore the relationship between components more deeply",
          "Missing discussion of edge cases or limitations",
        ],
        feedback:
          "Good start! You've captured the main idea. Try to go deeper into why each component matters and how they interact. Can you think of a real-world example?",
      });
    }

    // Phase 4: Probe
    if (combined.includes("probe") || combined.includes("socratic")) {
      return "Interesting explanation! Here's something to think about: what happens when the expected input format changes? How would the system need to adapt?";
    }

    // Phase 5: Struggle
    if (combined.includes("struggle") || combined.includes("devil's advocate") || combined.includes("edge case")) {
      return "Here's a tricky scenario: imagine the system receives conflicting inputs simultaneously. The standard approach would fail here. How would you redesign it to handle this contradiction? Think about what assumptions we're making.";
    }

    // Phase 6: Re-teach
    if (combined.includes("re-teach") || combined.includes("different approach")) {
      return `Let me try a different angle. Think of this like **cooking a recipe**:

1. **Ingredients** = your inputs
2. **Recipe steps** = the process/algorithm
3. **The dish** = your output
4. **Tasting and adjusting** = the feedback loop

\`\`\`mermaid
flowchart LR
    A[Ingredients] --> B[Follow Recipe]
    B --> C[Taste Test]
    C -->|Needs adjustment| D[Modify Recipe]
    D --> B
    C -->|Perfect| E[Serve Dish]
\`\`\`

The key insight is that **iteration** — tasting and adjusting — is what separates a good outcome from a great one. The same principle applies here.

Can you now explain the feedback loop mechanism in your own words?`;
    }

    // Phase 7: Verify
    if (combined.includes("verify") || combined.includes("final") || combined.includes("mastery assessment")) {
      return JSON.stringify({
        completeness: 75,
        accuracy: 8,
        depth: 7,
        originality: 1,
        mastered: false,
        summary:
          "You show good understanding of the core concepts. To achieve full mastery, work on connecting the components more deeply and consider edge cases.",
        gaps: ["Edge case handling", "Performance implications"],
      });
    }

    // Anti-parroting check
    if (combined.includes("parroting") || combined.includes("echoing")) {
      return JSON.stringify({
        isParroting: false,
        reason: "The student used their own structure and examples.",
      });
    }

    // Generic fallback
    return "That's a great point! Can you elaborate a bit more? Try to connect it to a real-world example you're familiar with.";
  }
}
