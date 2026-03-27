export const FREE_LIMITS: Record<string, { daily: number; label: string }> = {
  quiz: { daily: 10, label: "quiz questions" },
  feynman: { daily: 3, label: "Feynman sessions" },
  mitra: { daily: 5, label: "Mitra messages" },
  cheatsheet_export: { daily: 0, label: "cheatsheet exports" },
  bookmark: { daily: 0, label: "bookmarks" },
  revision: { daily: 10, label: "revision cards" },
};
