// ────────────────────────────────────────────────────────────────────────────
// Plan generation types
// ────────────────────────────────────────────────────────────────────────────

export interface DiagnosticAnswer {
  question: string;
  answer: string;
}

export interface PlanGenerationInput {
  topic: string;
  diagnosticAnswers: DiagnosticAnswer[];
}

export interface GeneratedSession {
  sessionNumber: number;
  title: string;
  paretoJustification: string;
  objectives: string[];
  activities: { description: string; durationMinutes: number }[];
  resources: { title: string; type: string; url?: string }[];
  reviewQuestions: string[];
  successCriteria: string;
}

export interface GeneratedPlan {
  topic: string;
  overview: string;
  skippedTopics: string;
  sessions: GeneratedSession[];
}

export type PlanViewStatus = "loading" | "diagnostic" | "generating" | "ready" | "error";
