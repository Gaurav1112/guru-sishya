export interface TourStepDef {
  id: string;
  /** CSS selector for the element to highlight. "body" = centered modal (no highlight). */
  targetSelector: string;
  title: string;
  description: string;
  icon: string;
  position: "top" | "bottom" | "left" | "right" | "center";
  mobilePosition?: "top" | "bottom" | "center";
}

export const TOUR_STEPS: TourStepDef[] = [
  {
    id: "welcome",
    targetSelector: "body",
    title: "Welcome to Guru Sishya!",
    description:
      "Your one-stop interview prep platform. Master System Design, DSA, Java, Python, and more -- all without leaving this app.",
    icon: "🙏",
    position: "center",
  },
  {
    id: "topics",
    targetSelector: 'a[href="/app/topics"]',
    title: "Browse 138+ Topics",
    description:
      "Explore topics organized by category -- System Design, Data Structures, Algorithms, Programming Languages, and more.",
    icon: "📚",
    position: "right",
    mobilePosition: "bottom",
  },
  {
    id: "quiz",
    targetSelector: 'a[href="/app/questions"]',
    title: "Take a Quiz",
    description:
      "Test your knowledge with 1900+ curated quiz questions. Get instant feedback, detailed explanations, and track your accuracy.",
    icon: "📝",
    position: "right",
    mobilePosition: "bottom",
  },
  {
    id: "review",
    targetSelector: 'a[href="/app/review"]',
    title: "Review Flashcards",
    description:
      "Use spaced repetition to lock knowledge into long-term memory. Cards are auto-created from your wrong answers.",
    icon: "🔁",
    position: "right",
    mobilePosition: "bottom",
  },
  {
    id: "stats",
    targetSelector: "[data-tour='topbar-stats']",
    title: "Track Your Progress",
    description:
      "Earn XP, collect 33 badges, maintain streaks, and climb the leaderboard. Your stats are always visible here.",
    icon: "🏆",
    position: "bottom",
  },
  {
    id: "interview",
    targetSelector: 'a[href="/app/interview"]',
    title: "Enter Teach Mode",
    description:
      "Simulate real interviews with boss rounds, power-ups, and timed questions. Immediate revision for wrong answers helps you truly master concepts.",
    icon: "🎤",
    position: "right",
    mobilePosition: "bottom",
  },
  {
    id: "cta",
    targetSelector: "body",
    title: "You're Ready!",
    description:
      "Pick a topic and start learning. Consistency is the key -- even 15 minutes a day will make a huge difference.",
    icon: "🚀",
    position: "center",
  },
];
