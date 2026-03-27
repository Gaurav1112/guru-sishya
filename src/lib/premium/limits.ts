export const FREE_LIMITS: Record<string, { daily: number; label: string }> = {
  quiz: { daily: 5, label: "quiz questions" },
  feynman: { daily: 1, label: "Feynman sessions" },
  mitra: { daily: 3, label: "Mitra messages" },
  cheatsheet_export: { daily: 0, label: "cheatsheet exports" },
  bookmark: { daily: 0, label: "bookmarks" },
  revision: { daily: 5, label: "revision cards" },
  question_reveal: { daily: 3, label: "answer reveals" },
};
