// ────────────────────────────────────────────────────────────────────────────
// Company-specific interview preparation paths
// Each path defines a curated sequence of topics for a target company.
// ────────────────────────────────────────────────────────────────────────────

export interface CompanyPath {
  company: string;
  slug: string;
  icon: string;
  color: string; // Combined Tailwind classes: "text-X border-X bg-X"
  duration: string;
  weeks: number;
  hoursPerWeek: number;
  focus: string;
  description: string;
  topics: string[];
  tips: string[];
}

// ── Helpers to parse the combined color string ───────────────────────────────

export function getAccentColor(path: CompanyPath): string {
  return path.color.split(" ").find((c) => c.startsWith("text-")) ?? "text-saffron";
}

export function getAccentBg(path: CompanyPath): string {
  return path.color.split(" ").find((c) => c.startsWith("bg-")) ?? "bg-saffron/10";
}

export function getAccentBorder(path: CompanyPath): string {
  return path.color.split(" ").find((c) => c.startsWith("border-")) ?? "border-saffron/30";
}

// ── Path Definitions ─────────────────────────────────────────────────────────

const PATHS: CompanyPath[] = [
  {
    company: "Google",
    slug: "google",
    icon: "G",
    color: "text-blue-400 border-blue-400/30 bg-blue-400/10",
    duration: "6 weeks",
    weeks: 6,
    hoursPerWeek: 15,
    focus: "DSA Deep Dive + System Design",
    description:
      "Google interviews are famously DSA-heavy. Expect 2-3 coding rounds with medium-to-hard graph, DP, and tree problems. The system design round tests scalability thinking at Google scale.",
    topics: [
      "Arrays & Strings",
      "Hash Tables",
      "Sorting & Searching",
      "Recursion & Backtracking",
      "Trees & BST",
      "Graphs",
      "Dynamic Programming",
      "Heaps & Priority Queues",
      "Stacks & Queues",
      "Linked Lists",
      "Load Balancing",
      "Caching",
      "Database Design",
      "System Design Interview Framework",
      "Back-of-Envelope Estimation",
      "Design: Search Engine (Google)",
      "Design: Chat System (WhatsApp/Slack)",
      "Design: URL Shortener (TinyURL)",
      "Design: Video Streaming (YouTube/Netflix)",
    ],
    tips: [
      "Practice coding on a whiteboard or Google Docs -- no autocomplete",
      "Focus on time/space complexity analysis for every solution",
      "Google loves graph problems -- BFS, DFS, topological sort",
      "System design: think about scale (billions of users)",
      "Behavioral: use the STAR method with Google's leadership principles",
    ],
  },
  {
    company: "Amazon",
    slug: "amazon",
    icon: "A",
    color: "text-orange-400 border-orange-400/30 bg-orange-400/10",
    duration: "6 weeks",
    weeks: 6,
    hoursPerWeek: 15,
    focus: "Leadership Principles + System Design",
    description:
      "Amazon's loop has 4-5 rounds mixing coding, system design, and behavioral (Leadership Principles). Every answer should demonstrate ownership, customer obsession, and bias for action.",
    topics: [
      "Arrays & Strings",
      "Linked Lists",
      "Trees & BST",
      "Graphs",
      "Dynamic Programming",
      "Stacks & Queues",
      "Hash Tables",
      "Sorting & Searching",
      "Recursion & Backtracking",
      "Heaps & Priority Queues",
      "Load Balancing",
      "Message Queues",
      "Database Design",
      "Caching",
      "Microservices Architecture",
      "System Design Interview Framework",
      "Back-of-Envelope Estimation",
      "Design: E-commerce Platform (Amazon)",
      "Design: Ride Sharing (Uber/Lyft)",
      "Design: File Storage (Google Drive/Dropbox)",
    ],
    tips: [
      "Prepare 10+ STAR stories mapped to Amazon's 16 Leadership Principles",
      "Every behavioral answer should reference a specific Leadership Principle",
      "System design: focus on availability, fault tolerance, and scalability",
      "Coding: practice BFS/DFS, hash maps, and array manipulation",
      "Amazon loves designing e-commerce and distributed systems",
    ],
  },
  {
    company: "Meta",
    slug: "meta",
    icon: "M",
    color: "text-blue-500 border-blue-500/30 bg-blue-500/10",
    duration: "6 weeks",
    weeks: 6,
    hoursPerWeek: 15,
    focus: "DSA Speed + Product Design",
    description:
      "Meta interviews are fast-paced -- you need to solve 2 medium/hard problems in 45 minutes per coding round. Strong emphasis on graph problems, string manipulation, and social-network system design.",
    topics: [
      "Arrays & Strings",
      "Hash Tables",
      "Trees & BST",
      "Graphs",
      "Dynamic Programming",
      "Linked Lists",
      "Sorting & Searching",
      "Recursion & Backtracking",
      "Stacks & Queues",
      "Heaps & Priority Queues",
      "Load Balancing",
      "Caching",
      "Database Design",
      "Message Queues",
      "System Design Interview Framework",
      "Back-of-Envelope Estimation",
      "Design: Social Media Feed (Twitter/Instagram)",
      "Design: Chat System (WhatsApp/Slack)",
      "Design: Video Streaming (YouTube/Netflix)",
      "Content Delivery Networks (CDN)",
    ],
    tips: [
      "Speed is critical -- practice solving problems in 20 minutes each",
      "Meta loves graph traversal and string manipulation problems",
      "System design: focus on social features (feed ranking, real-time chat)",
      "Write bug-free code -- they care about correctness on first attempt",
      "Behavioral: demonstrate impact and moving fast",
    ],
  },
  {
    company: "Microsoft",
    slug: "microsoft",
    icon: "MS",
    color: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
    duration: "4 weeks",
    weeks: 4,
    hoursPerWeek: 12,
    focus: "Core DSA + OOP Design",
    description:
      "Microsoft interviews test solid fundamentals. Expect 3-4 coding rounds at easy-to-medium difficulty with a focus on clean code, OOP design, and practical problem-solving.",
    topics: [
      "Arrays & Strings",
      "Linked Lists",
      "Trees & BST",
      "Graphs",
      "Dynamic Programming",
      "Stacks & Queues",
      "Hash Tables",
      "Sorting & Searching",
      "Recursion & Backtracking",
      "Design Patterns",
      "Load Balancing",
      "Database Design",
      "Microservices Architecture",
      "System Design Interview Framework",
      "Design: URL Shortener (TinyURL)",
      "Design: File Storage (Google Drive/Dropbox)",
    ],
    tips: [
      "Write clean, well-structured code -- Microsoft values code quality",
      "Expect object-oriented design questions (design a parking lot, etc.)",
      "Be ready to discuss trade-offs and alternative approaches",
      "System design is more conversational -- think out loud",
      "Behavioral: focus on collaboration and growth mindset",
    ],
  },
  {
    company: "Apple",
    slug: "apple",
    icon: "AP",
    color: "text-gray-300 border-gray-300/30 bg-gray-300/10",
    duration: "4 weeks",
    weeks: 4,
    hoursPerWeek: 12,
    focus: "Clean Code + System Design",
    description:
      "Apple interviews focus on elegant, well-tested solutions rather than brute-force speed. Expect deep technical discussions about your code choices, edge cases, and testing strategies.",
    topics: [
      "Arrays & Strings",
      "Trees & BST",
      "Graphs",
      "Dynamic Programming",
      "Sorting & Searching",
      "Hash Tables",
      "Linked Lists",
      "Stacks & Queues",
      "Recursion & Backtracking",
      "Caching",
      "Load Balancing",
      "System Design Interview Framework",
      "Design: Chat System (WhatsApp/Slack)",
    ],
    tips: [
      "Focus on code quality -- clean variable names, proper error handling",
      "Apple values deep domain expertise in your area (iOS, backend, etc.)",
      "Expect follow-up questions: how would you test this? What are edge cases?",
      "System design: think about user experience and privacy",
      "Know Apple products and how they might work under the hood",
    ],
  },
  {
    company: "Flipkart",
    slug: "flipkart",
    icon: "FK",
    color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
    duration: "4 weeks",
    weeks: 4,
    hoursPerWeek: 12,
    focus: "DSA + HLD + LLD",
    description:
      "Flipkart's Machine Coding + DSA + System Design loop is thorough. Expect a machine coding round where you build a small system in 60-90 minutes, plus standard DSA and system design rounds.",
    topics: [
      "Arrays & Strings",
      "Trees & BST",
      "Graphs",
      "Dynamic Programming",
      "Hash Tables",
      "Stacks & Queues",
      "Sorting & Searching",
      "Recursion & Backtracking",
      "Heaps & Priority Queues",
      "Design Patterns",
      "Load Balancing",
      "Caching",
      "Database Design",
      "Message Queues",
      "Microservices Architecture",
      "System Design Interview Framework",
      "Back-of-Envelope Estimation",
      "Design: E-commerce Platform (Amazon)",
    ],
    tips: [
      "Practice machine coding: build a parking lot, elevator system, etc.",
      "Flipkart loves e-commerce system design (cart, inventory, payments)",
      "Expect concurrency and multithreading questions (especially for SDE-2+)",
      "Be ready for low-level design with proper OOP and SOLID principles",
      "System design: focus on Indian scale (festival sales, payment failures)",
    ],
  },
];

// ── Public API ───────────────────────────────────────────────────────────────

export function getCompanyPath(slug: string): CompanyPath | undefined {
  return PATHS.find((p) => p.slug === slug);
}

export function getAllCompanyPaths(): CompanyPath[] {
  return PATHS;
}
