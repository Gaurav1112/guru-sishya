/**
 * Fuzzy search utilities using Levenshtein distance.
 * No external dependencies — pure TypeScript implementation.
 */

/**
 * Compute the Levenshtein edit distance between two strings.
 * Uses a single-row DP approach for O(min(m,n)) space.
 */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Ensure a is the shorter string for space efficiency
  if (a.length > b.length) [a, b] = [b, a];

  const aLen = a.length;
  const bLen = b.length;
  const row = Array.from({ length: aLen + 1 }, (_, i) => i);

  for (let j = 1; j <= bLen; j++) {
    let prev = row[0];
    row[0] = j;
    for (let i = 1; i <= aLen; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const temp = row[i];
      row[i] = Math.min(
        row[i] + 1,      // deletion
        row[i - 1] + 1,  // insertion
        prev + cost       // substitution
      );
      prev = temp;
    }
  }

  return row[aLen];
}

/**
 * Score how well a query matches a target string.
 * Lower score = better match. Returns Infinity for no reasonable match.
 *
 * Scoring strategy:
 * 1. Exact substring match → 0
 * 2. Word-start match (query matches beginning of any word) → 0.5
 * 3. Levenshtein distance on full string, normalized
 * 4. Levenshtein on individual words (catches typos like "dyanmic" → "dynamic")
 */
function matchScore(query: string, target: string): number {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();

  if (!q) return Infinity;

  // Exact substring match
  if (t.includes(q)) return 0;

  // Check if query matches the start of any word
  const words = t.split(/\s+/);
  for (const word of words) {
    if (word.startsWith(q)) return 0.5;
  }

  // Check Levenshtein distance against individual words
  // This catches typos like "dyanmic" matching "dynamic"
  let bestWordDist = Infinity;
  for (const word of words) {
    const dist = levenshtein(q, word);
    // Allow up to ~40% of the longer string's length as edit distance
    const maxAllowed = Math.ceil(Math.max(q.length, word.length) * 0.4);
    if (dist <= maxAllowed) {
      bestWordDist = Math.min(bestWordDist, dist);
    }
  }

  if (bestWordDist < Infinity) {
    return 1 + bestWordDist;
  }

  // Check Levenshtein on multi-word query vs target
  const queryWords = q.split(/\s+/);
  if (queryWords.length > 1) {
    let totalDist = 0;
    let matchedWords = 0;
    for (const qw of queryWords) {
      let minDist = Infinity;
      for (const tw of words) {
        minDist = Math.min(minDist, levenshtein(qw, tw));
      }
      const maxAllowed = Math.ceil(qw.length * 0.4);
      if (minDist <= maxAllowed) {
        totalDist += minDist;
        matchedWords++;
      }
    }
    if (matchedWords === queryWords.length) {
      return 1 + totalDist / matchedWords;
    }
    if (matchedWords > 0) {
      return 2 + totalDist / matchedWords + (queryWords.length - matchedWords);
    }
  }

  // Full string Levenshtein (less useful for long targets, but catches close matches)
  const fullDist = levenshtein(q, t);
  const maxAllowed = Math.ceil(Math.max(q.length, t.length) * 0.35);
  if (fullDist <= maxAllowed) {
    return 2 + fullDist;
  }

  return Infinity;
}

/**
 * Find items that fuzzy-match the query, ranked by relevance.
 *
 * @param query - The user's search input
 * @param items - The list of strings to search through
 * @param limit - Maximum number of results to return (default: 5)
 * @returns Matched items sorted by relevance (best first)
 */
export function fuzzyMatch(query: string, items: string[], limit = 5): string[] {
  if (!query.trim()) return [];

  const scored = items
    .map((item) => ({ item, score: matchScore(query, item) }))
    .filter(({ score }) => score < Infinity)
    .sort((a, b) => a.score - b.score);

  return scored.slice(0, limit).map(({ item }) => item);
}

/**
 * Suggest a "Did you mean: X?" correction when no exact matches exist.
 *
 * @param query - The user's search input
 * @param items - The list of candidate strings
 * @returns The best suggestion, or null if no reasonable match
 */
export function didYouMean(query: string, items: string[]): string | null {
  if (!query.trim()) return null;

  const q = query.toLowerCase().trim();

  // Don't suggest if there's already an exact substring match
  const hasExact = items.some(
    (item) =>
      item.toLowerCase().includes(q) ||
      q.includes(item.toLowerCase())
  );
  if (hasExact) return null;

  let bestItem: string | null = null;
  let bestScore = Infinity;

  for (const item of items) {
    const score = matchScore(query, item);
    if (score < bestScore && score > 0 && score < Infinity) {
      bestScore = score;
      bestItem = item;
    }
  }

  // Only suggest if the match is reasonably close
  return bestScore <= 3 ? bestItem : null;
}
