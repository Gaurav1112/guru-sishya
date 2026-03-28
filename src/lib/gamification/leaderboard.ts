// ────────────────────────────────────────────────────────────────────────────
// Leaderboard — AI Practice Partners + Real User
// AI users are transparently labeled; real user data comes from Zustand store.
// Optional Supabase sync for real multiplayer (when env vars are present).
// ────────────────────────────────────────────────────────────────────────────

export type LeagueArchetype =
  | "grinder"
  | "weekend_warrior"
  | "sprinter"
  | "casual"
  | "overachiever";

export interface LeaderboardEntry {
  name: string;
  weeklyXP: number;
  league: string;
  archetype: LeagueArchetype;
  avatarSeed: number;
  /** Whether this entry is the current (real) user */
  isMe: boolean;
  /** Whether this entry is an AI practice partner */
  isAI: boolean;
}

/** @deprecated Use LeaderboardEntry instead */
export type SimulatedUser = Omit<LeaderboardEntry, "isMe" | "isAI">;

// ── Leagues ──────────────────────────────────────────────────────────────────

export const LEAGUES = [
  "Bronze",
  "Silver",
  "Gold",
  "Sapphire",
  "Ruby",
  "Emerald",
  "Diamond",
] as const;

export type League = (typeof LEAGUES)[number];

const LEAGUE_XP_THRESHOLDS: Record<League, number> = {
  Bronze: 0,
  Silver: 500,
  Gold: 1500,
  Sapphire: 3500,
  Ruby: 7000,
  Emerald: 12000,
  Diamond: 20000,
};

export function getLeague(totalXP: number): League {
  let result: League = "Bronze";
  for (const league of LEAGUES) {
    if (totalXP >= LEAGUE_XP_THRESHOLDS[league]) {
      result = league;
    }
  }
  return result;
}

export function getLeagueColor(league: string): string {
  const map: Record<string, string> = {
    Bronze: "#cd7f32",
    Silver: "#c0c0c0",
    Gold: "#ffd700",
    Sapphire: "#0f52ba",
    Ruby: "#e0115f",
    Emerald: "#50c878",
    Diamond: "#b9f2ff",
  };
  return map[league] ?? "#cd7f32";
}

// ── Indian name pool (40 names) ───────────────────────────────────────────────

const INDIAN_NAMES = [
  "Aarav Sharma",
  "Priya Nair",
  "Rohan Verma",
  "Ananya Iyer",
  "Vikram Patel",
  "Kavya Reddy",
  "Arjun Mehta",
  "Divya Krishnan",
  "Siddharth Joshi",
  "Meera Pillai",
  "Aditya Rao",
  "Pooja Desai",
  "Karan Malhotra",
  "Shruti Bhat",
  "Nikhil Choudhary",
  "Lakshmi Venkat",
  "Rahul Gupta",
  "Sneha Agarwal",
  "Manish Tiwari",
  "Deepika Sinha",
  "Amaan Khan",
  "Nandini Bhatt",
  "Yash Kapoor",
  "Ritu Saxena",
  "Suresh Menon",
  "Preethi Subramaniam",
  "Gaurav Singh",
  "Aparna Nambiar",
  "Tarun Bajaj",
  "Harini Murugan",
  "Kunal Shah",
  "Sana Mirza",
  "Vivek Pandey",
  "Bhavna Thakur",
  "Ritesh Dubey",
  "Ishita Chatterjee",
  "Dhruv Rastogi",
  "Pallavi Shetty",
  "Sumit Yadav",
  "Chandana Bose",
];

// ── Seeded pseudo-random number generator (mulberry32) ───────────────────────

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weekSeed(): number {
  const now = new Date();
  // ISO week number — stable across the week
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  return now.getFullYear() * 100 + week;
}

// ── Reset logic ───────────────────────────────────────────────────────────────

/**
 * Returns true if the league week has rolled over since the last reset.
 * A new week starts on Sunday (ISO day 0).
 */
export function shouldResetLeague(lastResetDate: string, today: string): boolean {
  if (!lastResetDate) return true;
  const last = new Date(lastResetDate);
  const now = new Date(today);
  // Different calendar week
  const lastWeek = Math.ceil(
    ((last.getTime() - new Date(last.getFullYear(), 0, 1).getTime()) / 86400000 +
      new Date(last.getFullYear(), 0, 1).getDay() +
      1) /
      7
  );
  const nowWeek = Math.ceil(
    ((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 +
      new Date(now.getFullYear(), 0, 1).getDay() +
      1) /
      7
  );
  return now.getFullYear() !== last.getFullYear() || nowWeek !== lastWeek;
}

// ── AI Practice Partner generation ───────────────────────────────────────────

/**
 * Generate 15-20 AI practice partners calibrated around the real user's weekly XP.
 * Uses a seeded RNG so the league is stable across reloads within the same week.
 */
export function generateAIPracticePartners(
  userWeeklyXP: number,
  userLevel: number
): LeaderboardEntry[] {
  const seed = weekSeed() + userLevel;
  const rand = mulberry32(seed);

  const count = 17; // total AI users
  const users: LeaderboardEntry[] = [];

  // Shuffle name pool deterministically
  const shuffledNames = [...INDIAN_NAMES].sort(() => rand() - 0.5);

  const archetypes: LeagueArchetype[] = [
    "grinder",
    "weekend_warrior",
    "sprinter",
    "casual",
    "overachiever",
  ];

  // XP distribution strategy:
  // - 1 far ahead (overachiever)    : +150% to +300%
  // - 2-3 slightly above            : +10% to +50%
  // - 1 closely matched             : -5% to +5%
  // - 2-3 slightly below            : -10% to -50%
  // - remainder fill the rest of the league

  const base = Math.max(userWeeklyXP, 50); // never let base be 0

  const xpOffsets: number[] = [
    // Far ahead
    base * (1.5 + rand() * 1.5),
    // Slightly above
    base * (1.1 + rand() * 0.4),
    base * (1.05 + rand() * 0.35),
    base * (1.15 + rand() * 0.25),
    // Closely matched
    base * (0.95 + rand() * 0.1),
    // Slightly below
    base * (0.5 + rand() * 0.4),
    base * (0.4 + rand() * 0.45),
    base * (0.3 + rand() * 0.5),
    // Fill — varied
    base * (0.6 + rand() * 0.6),
    base * (0.2 + rand() * 0.8),
    base * (0.7 + rand() * 0.5),
    base * (0.1 + rand() * 0.9),
    base * (0.8 + rand() * 0.4),
    base * (0.15 + rand() * 0.7),
    base * (0.9 + rand() * 0.3),
    base * (0.25 + rand() * 0.6),
    base * (1.2 + rand() * 0.2),
  ];

  for (let i = 0; i < count; i++) {
    const weeklyXP = Math.max(10, Math.round(xpOffsets[i]));
    const archetype = archetypes[Math.floor(rand() * archetypes.length)];
    users.push({
      name: shuffledNames[i % shuffledNames.length],
      weeklyXP,
      league: getLeague(weeklyXP * 10), // approximate total from weekly pace
      archetype,
      avatarSeed: Math.floor(rand() * 10000),
      isMe: false,
      isAI: true,
    });
  }

  return users;
}

/** @deprecated Use generateAIPracticePartners instead */
export const generateSimulatedLeague = generateAIPracticePartners;

// ── Build full leaderboard ───────────────────────────────────────────────────

export interface BuildLeaderboardOptions {
  userWeeklyXP: number;
  userLevel: number;
  userLeague: string;
  userName: string;
  showOnLeaderboard: boolean;
}

/**
 * Build the complete leaderboard: real user + AI practice partners, sorted by
 * weeklyXP descending. The user's rank is determined by their actual weekly XP.
 */
export function buildLeaderboard(opts: BuildLeaderboardOptions): {
  entries: LeaderboardEntry[];
  userRank: number;
} {
  const aiPartners = generateAIPracticePartners(opts.userWeeklyXP, opts.userLevel);

  const entries: LeaderboardEntry[] = [...aiPartners];

  if (opts.showOnLeaderboard) {
    entries.push({
      name: opts.userName,
      weeklyXP: opts.userWeeklyXP,
      league: opts.userLeague,
      archetype: "grinder",
      avatarSeed: 0,
      isMe: true,
      isAI: false,
    });
  }

  entries.sort((a, b) => b.weeklyXP - a.weeklyXP);

  const userRank = entries.findIndex((e) => e.isMe) + 1; // 0 if not on board

  return { entries, userRank };
}
