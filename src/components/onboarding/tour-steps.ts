export interface TourStepDef {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
  mobilePosition?: "top" | "bottom";
}

export const TOUR_STEPS: TourStepDef[] = [
  { id: "welcome", targetSelector: "body", title: "Welcome to Guru Sishya!", description: "Your one-stop platform for software engineering interview prep. Let me show you around!", position: "bottom" },
  { id: "topics", targetSelector: 'a[href="/app/topics"]', title: "Browse Topics", description: "Start here — pick any of 65+ topics covering DSA, System Design, Java, and more.", position: "right", mobilePosition: "bottom" },
  { id: "dashboard", targetSelector: 'a[href="/app/dashboard"]', title: "Your Dashboard", description: "Track your streak, XP, daily challenge, and learning progress all in one place.", position: "right", mobilePosition: "bottom" },
  { id: "review", targetSelector: 'a[href="/app/review"]', title: "Spaced Repetition", description: "Questions you struggle with automatically appear here for review. Science-backed learning!", position: "right", mobilePosition: "bottom" },
  { id: "quiz-demo", targetSelector: "body", title: "Try a Sample Question", description: "Here's what a quiz question looks like. Each topic has adaptive difficulty that adjusts to your level!", position: "bottom" },
  { id: "profile", targetSelector: 'a[href="/app/profile"]', title: "Your Profile & Badges", description: "Earn 30 badges, level up from Shishya to Maharishi, and share your achievements.", position: "right", mobilePosition: "bottom" },
  { id: "cta", targetSelector: "body", title: "Ready to Begin?", description: "Pick your first topic and start learning! Every session earns XP and builds your streak.", position: "bottom" },
];
