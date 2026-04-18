#!/usr/bin/env node
// ────────────────────────────────────────────────────────────────────────────
// generate-string-algos.js — Generates string-algorithms.json
// Covers: String Basics, KMP, Rabin-Karp, Z-Algorithm, Suffix Arrays,
//         Interview Problems (LC #28, #214, #459, #1392)
// ────────────────────────────────────────────────────────────────────────────

const fs = require("fs");
const path = require("path");

function buildStringAlgorithmsTopic() {
  const sessions = [
    {
      sessionNumber: 1,
      title: "String Basics — Hashing, Comparison & Palindromes",
      content: `### Why String Algorithms Matter

Strings are the most common data type in interviews. Nearly every FAANG interview includes at least one string problem. Mastering string fundamentals — hashing, comparison, and palindrome detection — is the foundation for every advanced technique in this topic.

### String Hashing

String hashing converts a string into a numeric value for O(1) comparison. The most common approach is **polynomial rolling hash**:

\`\`\`
hash(s) = s[0]*p^(n-1) + s[1]*p^(n-2) + ... + s[n-1]*p^0  (mod M)
\`\`\`

Where **p** is a prime base (commonly 31 or 37) and **M** is a large prime modulus (e.g., 10^9 + 7).

**Why hashing?** Comparing two strings character-by-character is O(n). With precomputed hashes, comparison becomes O(1) — essential for pattern matching and substring problems.

### Hash Collisions

Two different strings can produce the same hash. To handle collisions:
1. Use double hashing (two different bases/moduli)
2. Verify matches with direct character comparison
3. Choose a large prime modulus to minimize collision probability

\`\`\`mermaid
graph LR
    subgraph "Polynomial Hash"
    S["'abc'"] --> H["a*31^2 + b*31^1 + c*31^0"]
    H --> V["hash = 96354 mod M"]
    end
\`\`\`

### String Comparison Complexity

| Operation | Time |
|-----------|------|
| char-by-char comparison | O(n) |
| Hash comparison (precomputed) | O(1) |
| Building hash | O(n) |
| Substring hash (with prefix sums) | O(1) |

### Palindrome Detection

A palindrome reads the same forwards and backwards. The classic two-pointer approach runs in O(n) time:

**Java:**
\`\`\`java
public boolean isPalindrome(String s) {
    int left = 0, right = s.length() - 1;
    while (left < right) {
        if (s.charAt(left) != s.charAt(right)) return false;
        left++;
        right--;
    }
    return true;
}

// Expand around center — finds longest palindromic substring
public String longestPalindrome(String s) {
    int start = 0, maxLen = 1;
    for (int i = 0; i < s.length(); i++) {
        // Odd length palindromes
        int len1 = expand(s, i, i);
        // Even length palindromes
        int len2 = expand(s, i, i + 1);
        int len = Math.max(len1, len2);
        if (len > maxLen) {
            maxLen = len;
            start = i - (len - 1) / 2;
        }
    }
    return s.substring(start, start + maxLen);
}

private int expand(String s, int left, int right) {
    while (left >= 0 && right < s.length()
           && s.charAt(left) == s.charAt(right)) {
        left--;
        right++;
    }
    return right - left - 1;
}
\`\`\`

**Python:**
\`\`\`python
def is_palindrome(s: str) -> bool:
    left, right = 0, len(s) - 1
    while left < right:
        if s[left] != s[right]:
            return False
        left += 1
        right -= 1
    return True

def longest_palindrome(s: str) -> str:
    start, max_len = 0, 1

    def expand(left: int, right: int) -> int:
        while left >= 0 and right < len(s) and s[left] == s[right]:
            left -= 1
            right += 1
        return right - left - 1

    for i in range(len(s)):
        len1 = expand(i, i)       # odd length
        len2 = expand(i, i + 1)   # even length
        length = max(len1, len2)
        if length > max_len:
            max_len = length
            start = i - (length - 1) // 2

    return s[start:start + max_len]
\`\`\`

### Key Insight: Expand Around Center

The expand-around-center technique solves the Longest Palindromic Substring (LC #5) in O(n^2) time and O(1) space. For each index, expand outward checking character equality. Try both odd-length (center = single char) and even-length (center = between two chars) expansions.

### When to Use Each Technique
- **Two pointers**: palindrome check, reverse comparison
- **Hashing**: fast substring comparison, Rabin-Karp (next session)
- **Expand around center**: longest palindromic substring
- **DP**: palindrome partitioning, counting palindromic substrings`,
      objectives: [
        "Understand polynomial rolling hash and its use in string comparison",
        "Implement palindrome detection using two pointers",
        "Apply expand-around-center for longest palindromic substring",
      ],
      activities: [
        {
          description: "Implement a polynomial hash function and test with 5 strings to check for collisions",
          durationMinutes: 15,
        },
        {
          description: "Solve LC #5 (Longest Palindromic Substring) using expand around center",
          durationMinutes: 25,
        },
      ],
      reviewQuestions: [
        "Why is polynomial rolling hash preferred over summing character values?:::Summing character values ignores order — 'abc' and 'cba' would have the same hash. Polynomial hashing uses positional weights (p^i) so character order matters, dramatically reducing collisions.",
        "What is the time complexity of expand-around-center for longest palindromic substring?:::O(n^2) time, O(1) space. For each of n centers, expansion takes O(n) worst case. This is optimal for O(1) space; Manacher's algorithm achieves O(n) time.",
      ],
      successCriteria: "Can implement string hashing, palindrome check, and explain time complexity of each approach.",
      paretoJustification: "String basics are prerequisites for all advanced string algorithms — hashing feeds into Rabin-Karp, palindromes appear in 10+ LeetCode problems.",
      resources: [
        { title: "LeetCode #5 — Longest Palindromic Substring", type: "practice", url: "https://leetcode.com/problems/longest-palindromic-substring/" },
      ],
    },
    {
      sessionNumber: 2,
      title: "KMP Algorithm — Pattern Matching & Failure Function",
      content: `### The Pattern Matching Problem

Given a text T of length n and a pattern P of length m, find all occurrences of P in T. The brute force approach checks every position: O(n * m). KMP (Knuth-Morris-Pratt) achieves **O(n + m)** by never re-examining characters.

### Key Insight: The Failure Function (LPS Array)

KMP precomputes a **Longest Proper Prefix which is also Suffix (LPS)** array for the pattern. When a mismatch occurs at position j in the pattern, instead of restarting from the beginning, we jump to lps[j-1] — skipping characters we already know match.

\`\`\`mermaid
graph TD
    subgraph "LPS Array for 'ABABAC'"
    A["Pattern: A B A B A C"]
    B["LPS:    [0,0,1,2,3,0]"]
    C["At index 4: 'ABA' is both prefix and suffix"]
    A --> B --> C
    end
\`\`\`

### How the Failure Function Works

For pattern P, lps[i] = length of the longest proper prefix of P[0..i] that is also a suffix of P[0..i].

- lps[0] = 0 always (no proper prefix for single character)
- For each position, try to extend the previous match
- On failure, fall back using the LPS array itself

### Building the LPS Array

**Java:**
\`\`\`java
public int[] computeLPS(String pattern) {
    int m = pattern.length();
    int[] lps = new int[m];
    int len = 0; // length of previous longest prefix suffix
    int i = 1;

    while (i < m) {
        if (pattern.charAt(i) == pattern.charAt(len)) {
            len++;
            lps[i] = len;
            i++;
        } else {
            if (len != 0) {
                len = lps[len - 1]; // fall back
            } else {
                lps[i] = 0;
                i++;
            }
        }
    }
    return lps;
}
\`\`\`

**Python:**
\`\`\`python
def compute_lps(pattern: str) -> list[int]:
    m = len(pattern)
    lps = [0] * m
    length = 0  # length of previous longest prefix suffix
    i = 1

    while i < m:
        if pattern[i] == pattern[length]:
            length += 1
            lps[i] = length
            i += 1
        else:
            if length != 0:
                length = lps[length - 1]  # fall back
            else:
                lps[i] = 0
                i += 1
    return lps
\`\`\`

### KMP Search Algorithm

**Java:**
\`\`\`java
public List<Integer> kmpSearch(String text, String pattern) {
    int[] lps = computeLPS(pattern);
    List<Integer> matches = new ArrayList<>();
    int i = 0, j = 0; // i for text, j for pattern

    while (i < text.length()) {
        if (text.charAt(i) == pattern.charAt(j)) {
            i++;
            j++;
        }
        if (j == pattern.length()) {
            matches.add(i - j);
            j = lps[j - 1];
        } else if (i < text.length()
                   && text.charAt(i) != pattern.charAt(j)) {
            if (j != 0) {
                j = lps[j - 1];
            } else {
                i++;
            }
        }
    }
    return matches;
}
\`\`\`

**Python:**
\`\`\`python
def kmp_search(text: str, pattern: str) -> list[int]:
    lps = compute_lps(pattern)
    matches = []
    i, j = 0, 0  # i for text, j for pattern

    while i < len(text):
        if text[i] == pattern[j]:
            i += 1
            j += 1

        if j == len(pattern):
            matches.append(i - j)
            j = lps[j - 1]
        elif i < len(text) and text[i] != pattern[j]:
            if j != 0:
                j = lps[j - 1]
            else:
                i += 1

    return matches
\`\`\`

### Complexity Analysis

| Phase | Time | Space |
|-------|------|-------|
| Build LPS | O(m) | O(m) |
| Search | O(n) | O(1) |
| **Total** | **O(n + m)** | **O(m)** |

### Why KMP is O(n + m)

The key insight is that **i never decreases**. In each iteration, either i advances (match) or j falls back (mismatch). The number of fallbacks is bounded by the number of advances — so the total work is proportional to n. The LPS construction uses the same argument for O(m).

### Interview Application

KMP directly solves LC #28 (Find the Index of the First Occurrence in a String). Beyond that, the LPS array is used in LC #459 (Repeated Substring Pattern) and LC #214 (Shortest Palindrome).`,
      objectives: [
        "Build the LPS (failure function) array for any pattern",
        "Implement the KMP search algorithm with O(n + m) complexity",
        "Explain why KMP never backtracks in the text",
      ],
      activities: [
        {
          description: "Hand-trace the LPS computation for patterns: 'AABAACAABAA', 'ABCDABD', 'AAACAAAA'",
          durationMinutes: 20,
        },
        {
          description: "Implement KMP from scratch and solve LC #28 (Find the Index of the First Occurrence)",
          durationMinutes: 30,
        },
      ],
      reviewQuestions: [
        "What does lps[i] represent in the KMP algorithm?:::lps[i] is the length of the longest proper prefix of pattern[0..i] that is also a suffix. It tells us where to resume matching after a mismatch, avoiding re-examination of already matched characters.",
        "Why does KMP guarantee O(n) search time even though it has a nested-looking loop?:::The text pointer i only moves forward and the pattern pointer j can only fall back as many times as it has advanced. Total pointer movements are bounded by 2n, giving O(n) amortized.",
      ],
      successCriteria: "Can implement KMP from memory and trace through the LPS array construction.",
      paretoJustification: "KMP is the gold standard for linear-time pattern matching and appears directly in interview problems (LC #28, #459, #214).",
      resources: [
        { title: "LeetCode #28 — Find the Index of the First Occurrence", type: "practice", url: "https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/" },
      ],
    },
    {
      sessionNumber: 3,
      title: "Rabin-Karp — Rolling Hash & Multiple Pattern Search",
      content: `### Rabin-Karp Algorithm

Rabin-Karp uses **rolling hash** to achieve expected O(n + m) pattern matching. Unlike KMP which uses structural properties of the pattern, Rabin-Karp uses hashing to quickly filter non-matching positions.

### Rolling Hash Concept

Instead of recomputing the hash from scratch for each window position, we **roll** it:

\`\`\`
hash(s[i+1..i+m]) = (hash(s[i..i+m-1]) - s[i]*p^(m-1)) * p + s[i+m]
\`\`\`

Remove the leftmost character's contribution, shift left (multiply by p), and add the new rightmost character.

\`\`\`mermaid
graph LR
    subgraph "Rolling Hash Window"
    W1["[A B C] D E → hash1"]
    W2["A [B C D] E → hash2 = roll(hash1)"]
    W3["A B [C D E] → hash3 = roll(hash2)"]
    W1 --> W2 --> W3
    end
\`\`\`

### Implementation

**Java:**
\`\`\`java
public List<Integer> rabinKarp(String text, String pattern) {
    int n = text.length(), m = pattern.length();
    if (m > n) return new ArrayList<>();

    long BASE = 31, MOD = 1_000_000_007L;
    List<Integer> matches = new ArrayList<>();

    // Compute p^(m-1) mod MOD
    long power = 1;
    for (int i = 0; i < m - 1; i++)
        power = (power * BASE) % MOD;

    // Hash the pattern and first window
    long patHash = 0, winHash = 0;
    for (int i = 0; i < m; i++) {
        patHash = (patHash * BASE + pattern.charAt(i)) % MOD;
        winHash = (winHash * BASE + text.charAt(i)) % MOD;
    }

    for (int i = 0; i <= n - m; i++) {
        if (winHash == patHash) {
            // Verify to avoid hash collision
            if (text.substring(i, i + m).equals(pattern))
                matches.add(i);
        }
        // Roll the hash forward
        if (i < n - m) {
            winHash = ((winHash - text.charAt(i) * power % MOD + MOD)
                       * BASE + text.charAt(i + m)) % MOD;
        }
    }
    return matches;
}
\`\`\`

**Python:**
\`\`\`python
def rabin_karp(text: str, pattern: str) -> list[int]:
    n, m = len(text), len(pattern)
    if m > n:
        return []

    BASE, MOD = 31, 10**9 + 7
    matches = []

    # Compute p^(m-1) mod MOD
    power = pow(BASE, m - 1, MOD)

    # Hash the pattern and first window
    pat_hash = 0
    win_hash = 0
    for i in range(m):
        pat_hash = (pat_hash * BASE + ord(pattern[i])) % MOD
        win_hash = (win_hash * BASE + ord(text[i])) % MOD

    for i in range(n - m + 1):
        if win_hash == pat_hash:
            if text[i:i + m] == pattern:  # verify match
                matches.append(i)
        # Roll hash forward
        if i < n - m:
            win_hash = ((win_hash - ord(text[i]) * power) * BASE
                        + ord(text[i + m])) % MOD

    return matches
\`\`\`

### Complexity

| Case | Time | Space |
|------|------|-------|
| Average (few collisions) | O(n + m) | O(1) |
| Worst case (many collisions) | O(n * m) | O(1) |

### Multiple Pattern Search

Rabin-Karp shines when searching for **multiple patterns** of the same length. Compute the hash of each pattern, store in a HashSet, and check each window against the set — O(n + k*m) expected time for k patterns.

**Java:**
\`\`\`java
public Set<String> multiPatternSearch(String text, Set<String> patterns) {
    Set<String> found = new HashSet<>();
    if (patterns.isEmpty()) return found;

    int m = patterns.iterator().next().length(); // assume same length
    long BASE = 31, MOD = 1_000_000_007L;

    // Hash all patterns
    Set<Long> patHashes = new HashSet<>();
    for (String p : patterns) {
        long h = 0;
        for (char c : p.toCharArray())
            h = (h * BASE + c) % MOD;
        patHashes.add(h);
    }

    // Slide over text
    long power = 1;
    for (int i = 0; i < m - 1; i++) power = (power * BASE) % MOD;

    long winHash = 0;
    for (int i = 0; i < m; i++)
        winHash = (winHash * BASE + text.charAt(i)) % MOD;

    for (int i = 0; i <= text.length() - m; i++) {
        if (patHashes.contains(winHash)) {
            String sub = text.substring(i, i + m);
            if (patterns.contains(sub)) found.add(sub);
        }
        if (i < text.length() - m) {
            winHash = ((winHash - text.charAt(i) * power % MOD + MOD)
                       * BASE + text.charAt(i + m)) % MOD;
        }
    }
    return found;
}
\`\`\`

### KMP vs Rabin-Karp

| Feature | KMP | Rabin-Karp |
|---------|-----|------------|
| Worst case | O(n + m) guaranteed | O(n * m) due to collisions |
| Multiple patterns | Run separately for each | Single pass with hash set |
| Implementation | More complex (LPS) | Simpler concept |
| Use case | Single pattern, guaranteed linear | Multiple patterns, plagiarism detection |

### Interview Tip

Rabin-Karp is rarely asked directly, but understanding rolling hash is essential. It appears in problems involving substring matching, duplicate detection, and the concept powers Rabin-Karp fingerprinting in distributed systems.`,
      objectives: [
        "Implement rolling hash for efficient window sliding",
        "Build the Rabin-Karp single-pattern search algorithm",
        "Extend Rabin-Karp for multiple pattern search",
      ],
      activities: [
        {
          description: "Implement Rabin-Karp and compare output with KMP on 5 test cases",
          durationMinutes: 25,
        },
        {
          description: "Implement multi-pattern Rabin-Karp and test with a paragraph + 10 keywords",
          durationMinutes: 20,
        },
      ],
      reviewQuestions: [
        "How does the rolling hash avoid recomputing the full hash at each position?:::It removes the contribution of the leftmost character (subtract s[i]*p^(m-1)), shifts all remaining positions left (multiply by p), and adds the new rightmost character. This makes each update O(1) instead of O(m).",
        "When is Rabin-Karp preferred over KMP?:::When searching for multiple patterns simultaneously. KMP must run separately for each pattern (O(k*(n+m))), while Rabin-Karp checks all k patterns in a single pass using a hash set (O(n + k*m) expected).",
      ],
      successCriteria: "Can implement Rabin-Karp with rolling hash and explain when to prefer it over KMP.",
      paretoJustification: "Rolling hash is a fundamental technique used in Rabin-Karp, substring deduplication, and distributed systems fingerprinting.",
      resources: [
        { title: "LeetCode #187 — Repeated DNA Sequences", type: "practice", url: "https://leetcode.com/problems/repeated-dna-sequences/" },
      ],
    },
    {
      sessionNumber: 4,
      title: "Z-Algorithm — Z-Array Construction & Applications",
      content: `### What is the Z-Algorithm?

The Z-algorithm computes the **Z-array** for a string S: Z[i] = the length of the longest substring starting at S[i] that matches a prefix of S. It runs in **O(n)** time and is an elegant alternative to KMP for pattern matching.

### Z-Array Example

\`\`\`
S     = a a b x a a b
Z     = [7,1,0,0,3,1,0]
         ^         ^
         |         Z[4]=3: "aab" matches prefix "aab"
         Z[0]=7: by convention, full length
\`\`\`

\`\`\`mermaid
graph TD
    subgraph "Z-array for 'aabxaab'"
    S["a a b x a a b"]
    Z["Z = [7, 1, 0, 0, 3, 1, 0]"]
    E["Z[4]=3: s[4..6]='aab' matches s[0..2]='aab'"]
    S --> Z --> E
    end
\`\`\`

### Z-Algorithm Implementation

The algorithm maintains a window [L, R] representing the rightmost Z-box (interval matching a prefix).

**Java:**
\`\`\`java
public int[] zFunction(String s) {
    int n = s.length();
    int[] z = new int[n];
    z[0] = n;
    int l = 0, r = 0;

    for (int i = 1; i < n; i++) {
        if (i < r) {
            z[i] = Math.min(r - i, z[i - l]);
        }
        while (i + z[i] < n
               && s.charAt(z[i]) == s.charAt(i + z[i])) {
            z[i]++;
        }
        if (i + z[i] > r) {
            l = i;
            r = i + z[i];
        }
    }
    return z;
}
\`\`\`

**Python:**
\`\`\`python
def z_function(s: str) -> list[int]:
    n = len(s)
    z = [0] * n
    z[0] = n
    l, r = 0, 0

    for i in range(1, n):
        if i < r:
            z[i] = min(r - i, z[i - l])
        while i + z[i] < n and s[z[i]] == s[i + z[i]]:
            z[i] += 1
        if i + z[i] > r:
            l = i
            r = i + z[i]

    return z
\`\`\`

### Pattern Matching with Z-Algorithm

To find pattern P in text T, construct the string **P + "$" + T** (where "$" is a separator not in P or T), then compute its Z-array. Any position i where Z[i] == len(P) indicates a match.

**Java:**
\`\`\`java
public List<Integer> zSearch(String text, String pattern) {
    String concat = pattern + "$" + text;
    int[] z = zFunction(concat);
    int m = pattern.length();
    List<Integer> matches = new ArrayList<>();

    for (int i = m + 1; i < concat.length(); i++) {
        if (z[i] == m) {
            matches.add(i - m - 1); // position in original text
        }
    }
    return matches;
}
\`\`\`

**Python:**
\`\`\`python
def z_search(text: str, pattern: str) -> list[int]:
    concat = pattern + "$" + text
    z = z_function(concat)
    m = len(pattern)
    return [i - m - 1 for i in range(m + 1, len(concat)) if z[i] == m]
\`\`\`

### Complexity

| Operation | Time | Space |
|-----------|------|-------|
| Z-array construction | O(n) | O(n) |
| Pattern matching | O(n + m) | O(n + m) |

### Why O(n)? The Amortized Argument

The R pointer only moves right and is bounded by n. Each comparison either extends R (counted once) or uses a cached Z-value (O(1)). Total comparisons: O(n).

### Z-Algorithm vs KMP

| Feature | Z-Algorithm | KMP |
|---------|-------------|-----|
| Preprocessing | Z-array | LPS array |
| Conceptual simplicity | Simpler to understand | Harder to grasp |
| Pattern matching | Concatenate P$T | Separate preprocessing |
| Additional uses | String period, distinct substrings | Stream matching |

### Applications Beyond Pattern Matching

1. **String period**: smallest k such that s is made of repeating s[0..k-1]. Check if Z[k] == n - k for each k dividing n.
2. **Number of distinct substrings**: using Z-array on reversed suffixes.
3. **String compression**: finding the shortest repeating unit.`,
      objectives: [
        "Construct the Z-array in O(n) time using the Z-box technique",
        "Use the Z-algorithm for O(n + m) pattern matching",
        "Compare Z-algorithm with KMP and identify when each is preferred",
      ],
      activities: [
        {
          description: "Hand-trace the Z-array for 'aabxaabxaab' and verify with your implementation",
          durationMinutes: 15,
        },
        {
          description: "Implement Z-based pattern matching and test against KMP on the same inputs",
          durationMinutes: 25,
        },
      ],
      reviewQuestions: [
        "What does Z[i] represent in the Z-array?:::Z[i] is the length of the longest substring starting at position i that matches a prefix of the full string. Z[0] is conventionally set to n (the full string length).",
        "How do you use the Z-algorithm for pattern matching?:::Concatenate pattern + separator + text (e.g., P$T), compute the Z-array, and find all indices i where Z[i] equals the pattern length. Each such index corresponds to a match in the original text.",
      ],
      successCriteria: "Can implement the Z-algorithm and use it for pattern matching from memory.",
      paretoJustification: "The Z-algorithm is simpler to implement than KMP during interviews and solves the same pattern matching problems with identical complexity.",
      resources: [
        { title: "CP-Algorithms — Z-function", type: "docs", url: "https://cp-algorithms.com/string/z-function.html" },
      ],
    },
    {
      sessionNumber: 5,
      title: "Suffix Arrays — Construction & LCP Array",
      content: `### What is a Suffix Array?

A **suffix array** is a sorted array of all suffixes of a string, represented by their starting indices. It is a space-efficient alternative to suffix trees and powers many advanced string operations.

For string "banana":
\`\`\`
Suffixes sorted:      Suffix Array:
a        → index 5    SA = [5, 3, 1, 0, 4, 2]
ana      → index 3
anana    → index 1
banana   → index 0
na       → index 4
nana     → index 2
\`\`\`

\`\`\`mermaid
graph TD
    subgraph "Suffix Array for 'banana'"
    S["banana"]
    SA["SA = [5, 3, 1, 0, 4, 2]"]
    L["Sorted: a, ana, anana, banana, na, nana"]
    S --> SA --> L
    end
\`\`\`

### Naive Construction: O(n^2 log n)

Sort all suffixes using standard string comparison. Each comparison is O(n), and sorting is O(n log n), giving O(n^2 log n) total.

**Java:**
\`\`\`java
public int[] buildSuffixArray(String s) {
    int n = s.length();
    Integer[] sa = new Integer[n];
    for (int i = 0; i < n; i++) sa[i] = i;

    Arrays.sort(sa, (a, b) -> s.substring(a).compareTo(s.substring(b)));

    int[] result = new int[n];
    for (int i = 0; i < n; i++) result[i] = sa[i];
    return result;
}
\`\`\`

**Python:**
\`\`\`python
def build_suffix_array(s: str) -> list[int]:
    n = len(s)
    suffixes = sorted(range(n), key=lambda i: s[i:])
    return suffixes
\`\`\`

### O(n log^2 n) Construction with Rank Doubling

The key idea: sort suffixes by their first 1 character, then first 2, then first 4, ..., doubling each time. Use the rank from the previous round to compare in O(1) per pair.

**Java:**
\`\`\`java
public int[] buildSuffixArrayFast(String s) {
    int n = s.length();
    int[] sa = new int[n], rank = new int[n], tmp = new int[n];

    for (int i = 0; i < n; i++) { sa[i] = i; rank[i] = s.charAt(i); }

    for (int gap = 1; gap < n; gap *= 2) {
        final int g = gap;
        final int[] r = rank.clone();
        Integer[] idx = new Integer[n];
        for (int i = 0; i < n; i++) idx[i] = sa[i];
        Arrays.sort(idx, (a, b) -> {
            if (r[a] != r[b]) return r[a] - r[b];
            int ra = a + g < n ? r[a + g] : -1;
            int rb = b + g < n ? r[b + g] : -1;
            return ra - rb;
        });
        for (int i = 0; i < n; i++) sa[i] = idx[i];
        rank[sa[0]] = 0;
        for (int i = 1; i < n; i++) {
            rank[sa[i]] = rank[sa[i - 1]];
            int prev = sa[i - 1];
            int curr = sa[i];
            if (r[prev] != r[curr]
                || (prev + g < n ? r[prev + g] : -1)
                   != (curr + g < n ? r[curr + g] : -1)) {
                rank[sa[i]]++;
            }
        }
    }
    return sa;
}
\`\`\`

**Python:**
\`\`\`python
def build_suffix_array_fast(s: str) -> list[int]:
    n = len(s)
    sa = list(range(n))
    rank = [ord(c) for c in s]

    gap = 1
    while gap < n:
        def compare_key(i):
            return (rank[i], rank[i + gap] if i + gap < n else -1)
        sa.sort(key=compare_key)
        tmp = [0] * n
        tmp[sa[0]] = 0
        for i in range(1, n):
            tmp[sa[i]] = tmp[sa[i - 1]]
            if compare_key(sa[i]) != compare_key(sa[i - 1]):
                tmp[sa[i]] += 1
        rank = tmp
        gap *= 2

    return sa
\`\`\`

### LCP Array (Longest Common Prefix)

The LCP array stores the length of the longest common prefix between consecutive suffixes in the sorted order. It is built in O(n) using **Kasai's algorithm**.

**Java:**
\`\`\`java
public int[] buildLCP(String s, int[] sa) {
    int n = s.length();
    int[] rank = new int[n], lcp = new int[n];
    for (int i = 0; i < n; i++) rank[sa[i]] = i;

    int h = 0;
    for (int i = 0; i < n; i++) {
        if (rank[i] > 0) {
            int j = sa[rank[i] - 1];
            while (i + h < n && j + h < n
                   && s.charAt(i + h) == s.charAt(j + h)) h++;
            lcp[rank[i]] = h;
            if (h > 0) h--;
        }
    }
    return lcp;
}
\`\`\`

**Python:**
\`\`\`python
def build_lcp(s: str, sa: list[int]) -> list[int]:
    n = len(s)
    rank = [0] * n
    for i in range(n):
        rank[sa[i]] = i

    lcp = [0] * n
    h = 0
    for i in range(n):
        if rank[i] > 0:
            j = sa[rank[i] - 1]
            while i + h < n and j + h < n and s[i + h] == s[j + h]:
                h += 1
            lcp[rank[i]] = h
            if h > 0:
                h -= 1

    return lcp
\`\`\`

### Applications

| Problem | How Suffix Array Helps |
|---------|----------------------|
| Number of distinct substrings | n*(n+1)/2 - sum(LCP) |
| Longest repeated substring | max(LCP) |
| Pattern matching | Binary search on SA: O(m log n) |
| Longest common substring (2 strings) | SA of s1#s2, max LCP across boundary |`,
      objectives: [
        "Understand suffix arrays and their relationship to sorted suffixes",
        "Implement naive and O(n log^2 n) suffix array construction",
        "Build the LCP array using Kasai's algorithm",
      ],
      activities: [
        {
          description: "Build the suffix array and LCP array for 'mississippi' by hand, then verify with code",
          durationMinutes: 20,
        },
        {
          description: "Implement Kasai's algorithm and use it to count distinct substrings of a given string",
          durationMinutes: 25,
        },
      ],
      reviewQuestions: [
        "How does the LCP array help count the number of distinct substrings?:::Total substrings = n*(n+1)/2. Each LCP[i] value represents duplicated prefixes between adjacent sorted suffixes. Distinct substrings = n*(n+1)/2 - sum(LCP). The LCP values exactly count the overlap we need to subtract.",
        "What is the advantage of suffix arrays over suffix trees?:::Suffix arrays use O(n) space (just an integer array) compared to suffix trees which use O(n) pointers and nodes with high constant factors. Suffix arrays are also more cache-friendly. Most suffix tree operations can be replicated using suffix array + LCP array.",
      ],
      successCriteria: "Can build a suffix array and LCP array, and use them to solve substring counting problems.",
      paretoJustification: "Suffix arrays appear in advanced interviews and competitive programming. Understanding them demonstrates mastery of string algorithms.",
      resources: [
        { title: "CP-Algorithms — Suffix Array", type: "docs", url: "https://cp-algorithms.com/string/suffix-array.html" },
      ],
    },
    {
      sessionNumber: 6,
      title: "Interview Problems — LC #28, #214, #459, #1392",
      content: `### Problem 1: LC #28 — Find the Index of the First Occurrence

**Problem:** Return the index of the first occurrence of pattern in text, or -1.

This is the classic pattern matching problem. While built-in functions work, interviewers expect KMP or Z-algorithm.

**Java (KMP):**
\`\`\`java
public int strStr(String haystack, String needle) {
    int n = haystack.length(), m = needle.length();
    if (m == 0) return 0;

    int[] lps = new int[m];
    int len = 0, i = 1;
    while (i < m) {
        if (needle.charAt(i) == needle.charAt(len)) {
            lps[i++] = ++len;
        } else if (len > 0) {
            len = lps[len - 1];
        } else {
            lps[i++] = 0;
        }
    }

    i = 0; int j = 0;
    while (i < n) {
        if (haystack.charAt(i) == needle.charAt(j)) { i++; j++; }
        if (j == m) return i - j;
        if (i < n && haystack.charAt(i) != needle.charAt(j)) {
            j = j > 0 ? lps[j - 1] : 0;
            if (j == 0 && haystack.charAt(i) != needle.charAt(0)) i++;
        }
    }
    return -1;
}
\`\`\`

**Python (KMP):**
\`\`\`python
def strStr(haystack: str, needle: str) -> int:
    if not needle:
        return 0
    m = len(needle)
    lps = [0] * m
    length, i = 0, 1
    while i < m:
        if needle[i] == needle[length]:
            length += 1
            lps[i] = length
            i += 1
        elif length:
            length = lps[length - 1]
        else:
            lps[i] = 0
            i += 1

    i = j = 0
    while i < len(haystack):
        if haystack[i] == needle[j]:
            i += 1
            j += 1
        if j == m:
            return i - j
        if i < len(haystack) and haystack[i] != needle[j]:
            j = lps[j - 1] if j else 0
            if j == 0 and haystack[i] != needle[0]:
                i += 1
    return -1
\`\`\`

### Problem 2: LC #214 — Shortest Palindrome

**Problem:** Given string s, find the shortest palindrome by adding characters only in front.

**Key insight:** Find the longest palindromic prefix using KMP. Construct s + "#" + reverse(s), compute LPS. The last LPS value gives the longest palindromic prefix length.

**Java:**
\`\`\`java
public String shortestPalindrome(String s) {
    String rev = new StringBuilder(s).reverse().toString();
    String combined = s + "#" + rev;
    int[] lps = new int[combined.length()];
    int len = 0, i = 1;
    while (i < combined.length()) {
        if (combined.charAt(i) == combined.charAt(len)) {
            lps[i++] = ++len;
        } else if (len > 0) {
            len = lps[len - 1];
        } else {
            i++;
        }
    }
    int longest = lps[combined.length() - 1];
    return rev.substring(0, s.length() - longest) + s;
}
\`\`\`

**Python:**
\`\`\`python
def shortestPalindrome(s: str) -> str:
    rev = s[::-1]
    combined = s + "#" + rev
    lps = [0] * len(combined)
    length, i = 0, 1
    while i < len(combined):
        if combined[i] == combined[length]:
            length += 1
            lps[i] = length
            i += 1
        elif length:
            length = lps[length - 1]
        else:
            i += 1
    longest = lps[-1]
    return rev[:len(s) - longest] + s
\`\`\`

### Problem 3: LC #459 — Repeated Substring Pattern

**Problem:** Check if string s can be formed by repeating a substring.

**Key insight:** Use KMP's LPS array. If lps[n-1] > 0 and n % (n - lps[n-1]) == 0, then s has a repeating pattern of length (n - lps[n-1]).

**Java:**
\`\`\`java
public boolean repeatedSubstringPattern(String s) {
    int n = s.length();
    int[] lps = new int[n];
    int len = 0, i = 1;
    while (i < n) {
        if (s.charAt(i) == s.charAt(len)) {
            lps[i++] = ++len;
        } else if (len > 0) {
            len = lps[len - 1];
        } else {
            i++;
        }
    }
    int period = n - lps[n - 1];
    return lps[n - 1] > 0 && n % period == 0;
}
\`\`\`

**Python:**
\`\`\`python
def repeatedSubstringPattern(s: str) -> bool:
    n = len(s)
    lps = [0] * n
    length, i = 0, 1
    while i < n:
        if s[i] == s[length]:
            length += 1
            lps[i] = length
            i += 1
        elif length:
            length = lps[length - 1]
        else:
            i += 1
    period = n - lps[-1]
    return lps[-1] > 0 and n % period == 0
\`\`\`

### Problem 4: LC #1392 — Longest Happy Prefix

**Problem:** Find the longest prefix of s which is also a suffix (but not the whole string).

This is directly the LPS value at the last index.

**Java:**
\`\`\`java
public String longestPrefix(String s) {
    int n = s.length();
    int[] lps = new int[n];
    int len = 0, i = 1;
    while (i < n) {
        if (s.charAt(i) == s.charAt(len)) {
            lps[i++] = ++len;
        } else if (len > 0) {
            len = lps[len - 1];
        } else {
            i++;
        }
    }
    return s.substring(0, lps[n - 1]);
}
\`\`\`

**Python:**
\`\`\`python
def longestPrefix(s: str) -> str:
    n = len(s)
    lps = [0] * n
    length, i = 0, 1
    while i < n:
        if s[i] == s[length]:
            length += 1
            lps[i] = length
            i += 1
        elif length:
            length = lps[length - 1]
        else:
            i += 1
    return s[:lps[-1]]
\`\`\`

### Problem Difficulty Map

| Problem | Difficulty | Core Technique | Time |
|---------|-----------|----------------|------|
| LC #28 | Easy | KMP or Z-algorithm | O(n+m) |
| LC #214 | Hard | KMP on s#reverse(s) | O(n) |
| LC #459 | Easy | KMP LPS analysis | O(n) |
| LC #1392 | Hard | KMP LPS value | O(n) |`,
      objectives: [
        "Solve LC #28 using KMP or Z-algorithm",
        "Apply KMP's LPS array creatively for palindrome and periodicity problems",
        "Recognize how string algorithm techniques map to interview problems",
      ],
      activities: [
        {
          description: "Solve all four problems (LC #28, #214, #459, #1392) using KMP within a 60-minute mock interview",
          durationMinutes: 60,
        },
        {
          description: "Re-solve LC #28 using the Z-algorithm approach for comparison",
          durationMinutes: 15,
        },
      ],
      reviewQuestions: [
        "How does KMP help solve the Shortest Palindrome problem (LC #214)?:::Concatenate s + '#' + reverse(s) and compute the LPS array. The last LPS value gives the length of the longest palindromic prefix. Characters beyond this prefix in the reversed string need to be prepended.",
        "Why does n % (n - lps[n-1]) == 0 indicate a repeating pattern?:::lps[n-1] gives the length of the longest prefix that is also a suffix. The 'period' is n - lps[n-1]. If n is divisible by this period, the string is composed entirely of this repeating unit.",
      ],
      successCriteria: "Can solve all four interview problems using string algorithm techniques within time constraints.",
      paretoJustification: "These four problems cover the most common string algorithm interview patterns — mastering them covers 80% of string algorithm interview questions.",
      resources: [
        { title: "LeetCode #214 — Shortest Palindrome", type: "practice", url: "https://leetcode.com/problems/shortest-palindrome/" },
        { title: "LeetCode #459 — Repeated Substring Pattern", type: "practice", url: "https://leetcode.com/problems/repeated-substring-pattern/" },
        { title: "LeetCode #1392 — Longest Happy Prefix", type: "practice", url: "https://leetcode.com/problems/longest-happy-prefix/" },
      ],
    },
  ];

  const quizBank = [
    { question: "What is the time complexity of the KMP pattern matching algorithm?", format: "mcq", difficulty: 1, bloomLabel: "Remember", options: ["A) O(n * m)", "B) O(n + m)", "C) O(n log n)", "D) O(n^2)"], correctAnswer: "B", explanation: "**Correct: B) O(n + m).** KMP preprocesses the pattern in O(m) to build the LPS array, then scans the text in O(n). The text pointer never backtracks, giving guaranteed linear time regardless of input." },
    { question: "What does the LPS array in KMP represent?", format: "mcq", difficulty: 1, bloomLabel: "Remember", options: ["A) Longest palindromic substring at each position", "B) Longest proper prefix which is also a suffix for each prefix of the pattern", "C) The position to restart matching in the text", "D) The number of character comparisons needed"], correctAnswer: "B", explanation: "**Correct: B).** LPS[i] is the length of the longest proper prefix of pattern[0..i] that is also a suffix. 'Proper' means the prefix cannot be the entire string. This value tells KMP where to resume matching after a mismatch." },
    { question: "In Rabin-Karp, what is the purpose of the rolling hash?", format: "mcq", difficulty: 2, bloomLabel: "Understand", options: ["A) To sort the text characters", "B) To update the window hash in O(1) instead of recomputing in O(m)", "C) To avoid comparing the pattern with the text", "D) To compress the text"], correctAnswer: "B", explanation: "**Correct: B).** The rolling hash removes the leftmost character's contribution and adds the new rightmost character in O(1). Without this, each window would require O(m) hash computation, making the algorithm O(n * m)." },
    { question: "What is the worst-case time complexity of Rabin-Karp?", format: "mcq", difficulty: 2, bloomLabel: "Remember", options: ["A) O(n + m)", "B) O(n * m)", "C) O(n log n)", "D) O(n^2)"], correctAnswer: "B", explanation: "**Correct: B) O(n * m).** In the worst case, every window produces a hash collision requiring O(m) character-by-character verification. This happens when all characters are the same (e.g., text='aaaa', pattern='aa'). Average case with a good hash is O(n + m)." },
    { question: "What does Z[i] represent in the Z-array?", format: "mcq", difficulty: 1, bloomLabel: "Remember", options: ["A) The number of characters matching at position i", "B) The length of the longest substring starting at i that matches a prefix of the string", "C) The position of the i-th suffix in sorted order", "D) The longest common prefix between adjacent sorted suffixes"], correctAnswer: "B", explanation: "**Correct: B).** Z[i] gives the length of the longest substring starting at position i that is also a prefix of the entire string. For example, if s='aabxaab', Z[4]=3 because s[4..6]='aab' matches the prefix s[0..2]='aab'." },
    { question: "How is the Z-algorithm used for pattern matching?", format: "mcq", difficulty: 2, bloomLabel: "Apply", options: ["A) Compute Z-array of the text only", "B) Concatenate pattern + separator + text and find Z[i] == pattern length", "C) Sort suffixes and binary search", "D) Compute Z-array of pattern and text separately"], correctAnswer: "B", explanation: "**Correct: B).** Construct P$T (pattern + separator + text), compute its Z-array. Any index i where Z[i] equals len(P) means the substring starting at i matches the full pattern. The separator ensures no match spans across P and T." },
    { question: "What is a suffix array?", format: "mcq", difficulty: 1, bloomLabel: "Remember", options: ["A) An array of all suffixes stored as strings", "B) A sorted array of starting indices of all suffixes of a string", "C) An array of prefix sums", "D) A hash table mapping suffixes to positions"], correctAnswer: "B", explanation: "**Correct: B).** A suffix array stores the starting indices of all suffixes, sorted in lexicographic order. For 'banana', SA=[5,3,1,0,4,2] representing sorted suffixes: 'a','ana','anana','banana','na','nana'. It uses O(n) space." },
    { question: "What does the LCP array store?", format: "mcq", difficulty: 2, bloomLabel: "Remember", options: ["A) Longest common prefix between the string and its reverse", "B) Longest common prefix between consecutive suffixes in the suffix array", "C) Longest common prefix between all pairs of suffixes", "D) Length of the longest palindromic prefix"], correctAnswer: "B", explanation: "**Correct: B).** LCP[i] = length of the longest common prefix between the i-th and (i-1)-th suffixes in the sorted suffix array. This information enables efficient computation of distinct substrings, longest repeated substrings, and more." },
    { question: "How do you count the number of distinct substrings using suffix array and LCP?", format: "mcq", difficulty: 3, bloomLabel: "Apply", options: ["A) Sum all LCP values", "B) n * (n + 1) / 2 - sum(LCP)", "C) n * (n + 1) / 2 + sum(LCP)", "D) max(LCP) * n"], correctAnswer: "B", explanation: "**Correct: B) n*(n+1)/2 - sum(LCP).** Total possible substrings = n*(n+1)/2. Each LCP[i] value counts the number of substrings shared between adjacent sorted suffixes (duplicates). Subtracting the sum of LCP values gives the count of distinct substrings." },
    { question: "In LC #214 (Shortest Palindrome), why do we compute KMP on s + '#' + reverse(s)?", format: "mcq", difficulty: 4, bloomLabel: "Analyze", options: ["A) To find all palindromic substrings", "B) To find the longest palindromic prefix of s using the LPS array", "C) To reverse the string efficiently", "D) To detect repeated patterns"], correctAnswer: "B", explanation: "**Correct: B).** The LPS value at the last position of s#reverse(s) gives the length of the longest prefix of s that is also a suffix of reverse(s) — which means it is a palindromic prefix. Characters after this prefix in reverse(s) must be prepended to make the shortest palindrome." },
    { question: "How does KMP determine if a string has a repeating pattern (LC #459)?", format: "mcq", difficulty: 3, bloomLabel: "Analyze", options: ["A) Check if the string equals itself reversed", "B) If lps[n-1] > 0 and n % (n - lps[n-1]) == 0, the string repeats", "C) Check every possible substring length", "D) Use Rabin-Karp to find repeated hashes"], correctAnswer: "B", explanation: "**Correct: B).** The period of the string is n - lps[n-1]. If n is divisible by this period and lps[n-1] > 0, the entire string is composed of repeating copies of the first 'period' characters. This elegant property comes directly from the definition of the LPS array." },
    { question: "What is the expand-around-center technique used for?", format: "mcq", difficulty: 2, bloomLabel: "Apply", options: ["A) Finding the longest common substring", "B) Finding the longest palindromic substring in O(n^2) time", "C) Building the suffix array", "D) Computing the Z-array"], correctAnswer: "B", explanation: "**Correct: B).** For each possible center (n single chars + n-1 gaps = 2n-1 centers), expand outward while characters match. This finds the longest palindromic substring in O(n^2) time and O(1) space, solving LC #5." },
    { question: "When is Rabin-Karp preferred over KMP?", format: "mcq", difficulty: 3, bloomLabel: "Evaluate", options: ["A) When guaranteed worst-case linear time is needed", "B) When searching for multiple patterns of the same length simultaneously", "C) When the pattern contains wildcards", "D) When the text is very short"], correctAnswer: "B", explanation: "**Correct: B).** Rabin-Karp can check a window's hash against a set of pattern hashes in O(1), making it efficient for multi-pattern search. KMP would need to run separately for each pattern. For single pattern with worst-case guarantees, KMP is better." },
    { question: "What is the time complexity of building a suffix array using the rank-doubling method?", format: "mcq", difficulty: 3, bloomLabel: "Remember", options: ["A) O(n)", "B) O(n log n)", "C) O(n log^2 n)", "D) O(n^2 log n)"], correctAnswer: "C", explanation: "**Correct: C) O(n log^2 n).** The rank-doubling method runs O(log n) rounds (doubling the comparison length each time). Each round sorts the suffixes in O(n log n) using comparison sort. Total: O(n log n * log n) = O(n log^2 n). Can be improved to O(n log n) with radix sort." },
    { question: "What is the polynomial rolling hash formula for a string?", format: "mcq", difficulty: 2, bloomLabel: "Remember", options: ["A) sum of ASCII values", "B) product of character values", "C) s[0]*p^(n-1) + s[1]*p^(n-2) + ... + s[n-1]*p^0 mod M", "D) XOR of all character values"], correctAnswer: "C", explanation: "**Correct: C).** The polynomial hash assigns positional weights using a prime base p raised to decreasing powers. This ensures character order matters (unlike simple sums) and can be updated incrementally for rolling hash. The modulus M prevents overflow and keeps values bounded." },
  ];

  const cheatSheet = `# String Algorithms Cheat Sheet

## 1. String Hashing
- **Polynomial hash:** h(s) = s[0]*p^(n-1) + ... + s[n-1] mod M
- Base p = 31 or 37, Modulus M = 10^9 + 7
- Rolling update: O(1) per position
- Double hashing to reduce collisions

## 2. KMP (Knuth-Morris-Pratt)
### Java
\`\`\`java
int[] lps = new int[m];
int len = 0, i = 1;
while (i < m) {
    if (p.charAt(i) == p.charAt(len)) lps[i++] = ++len;
    else if (len > 0) len = lps[len - 1];
    else lps[i++] = 0;
}
// Search: compare text[i] with pattern[j], on mismatch j = lps[j-1]
\`\`\`

### Python
\`\`\`python
lps = [0] * m
length, i = 0, 1
while i < m:
    if p[i] == p[length]:
        length += 1; lps[i] = length; i += 1
    elif length: length = lps[length - 1]
    else: lps[i] = 0; i += 1
\`\`\`

## 3. Rabin-Karp
- Rolling hash: O(1) window update
- Multi-pattern: hash set of patterns, single pass
- Verify matches to avoid collisions

## 4. Z-Algorithm
- Z[i] = longest substring at i matching prefix
- Pattern match: P$T, find Z[i] == len(P)
- O(n) time, simpler than KMP to implement

## 5. Suffix Array + LCP
- SA: sorted indices of all suffixes
- LCP: longest common prefix between adjacent sorted suffixes
- Distinct substrings: n*(n+1)/2 - sum(LCP)
- Longest repeated substring: max(LCP)

## 6. Palindromes
- Two-pointer check: O(n)
- Expand around center: O(n^2), O(1) space
- Manacher's: O(n) — rarely asked in interviews

## 7. Complexity Table

| Algorithm | Preprocess | Search | Space |
|-----------|-----------|--------|-------|
| Brute force | - | O(n*m) | O(1) |
| KMP | O(m) | O(n) | O(m) |
| Rabin-Karp | O(m) | O(n) avg | O(1) |
| Z-algorithm | O(n+m) | O(n+m) | O(n+m) |
| Suffix Array | O(n log^2 n) | O(m log n) | O(n) |

## 8. Interview Pattern Map

| Problem Signal | Algorithm |
|---------------|-----------|
| "find pattern in text" | KMP / Z-algorithm |
| "multiple patterns" | Rabin-Karp |
| "shortest palindrome" | KMP on s#rev(s) |
| "repeated substring" | KMP LPS analysis |
| "longest happy prefix" | KMP LPS value |
| "distinct substrings" | Suffix Array + LCP |
| "palindromic substring" | Expand around center |

## 9. Gotchas
- KMP LPS: lps[0] = 0 always (no proper prefix for single char)
- Rabin-Karp: always verify hash matches (collision risk)
- Z-algorithm: Z[0] = n by convention
- Suffix array: naive sort is O(n^2 log n) not O(n log n)
- Rolling hash: handle negative modulo (add MOD before taking mod)`;

  return {
    topic: "String Algorithms",
    category: "Algorithms",
    cheatSheet,
    resources: [
      { title: "CP-Algorithms — String Processing", author: "CP-Algorithms", category: "docs", justification: "Comprehensive reference for all string algorithms with proofs and implementations", bestFor: "Intermediate-Advanced", estimatedTime: "6 hours", cost: "Free", confidence: "HIGH", url: "https://cp-algorithms.com/string/" },
      { title: "NeetCode String Playlist", author: "NeetCode", category: "youtube", justification: "Visual walkthroughs of key string interview problems", bestFor: "Visual learners", estimatedTime: "3 hours", cost: "Free", confidence: "HIGH", url: "https://neetcode.io/roadmap" },
      { title: "Introduction to Algorithms (CLRS)", author: "Cormen, Leiserson, Rivest, Stein", category: "books", justification: "Rigorous coverage of KMP, Rabin-Karp, and suffix structures with correctness proofs", bestFor: "Deep understanding", estimatedTime: "8 hours", cost: "Paid", confidence: "HIGH" },
      { title: "LeetCode String Tag", author: "LeetCode", category: "interactive", justification: "All string-tagged problems for focused practice", bestFor: "Practice", estimatedTime: "30+ hours", cost: "Freemium", confidence: "HIGH", url: "https://leetcode.com/tag/string/" },
    ],
    ladder: {
      levels: [
        { level: 1, name: "Novice", dreyfusLabel: "Novice", description: "Understands string basics: hashing, comparison, palindrome detection", observableSkills: ["Implement palindrome check", "Explain string hashing concept", "Use two pointers on strings"], milestoneProject: { title: "Palindrome Suite", description: "Implement isPalindrome + longestPalindrome using expand-around-center", estimatedHours: 2 }, commonPlateaus: ["Confusing substring vs subsequence"], estimatedHours: 4, prerequisites: [] },
        { level: 2, name: "Advanced Beginner", dreyfusLabel: "Advanced Beginner", description: "Can implement KMP and understand the LPS array", observableSkills: ["Build LPS array from scratch", "Implement KMP search", "Trace through KMP on example inputs"], milestoneProject: { title: "KMP Implementation", description: "Solve LC #28 and #459 using KMP", estimatedHours: 4 }, commonPlateaus: ["Struggling with the LPS fallback logic"], estimatedHours: 8, prerequisites: ["Array manipulation"] },
        { level: 3, name: "Competent", dreyfusLabel: "Competent", description: "Can implement Rabin-Karp and Z-algorithm and choose the right tool", observableSkills: ["Rolling hash implementation", "Z-array construction", "Compare KMP vs Rabin-Karp trade-offs"], milestoneProject: { title: "Multi-Algorithm Solver", description: "Solve LC #28 using KMP, Rabin-Karp, and Z-algorithm", estimatedHours: 4 }, commonPlateaus: ["Hash collision handling in Rabin-Karp"], estimatedHours: 12, prerequisites: ["Hashing concepts", "Modular arithmetic"] },
        { level: 4, name: "Proficient", dreyfusLabel: "Proficient", description: "Can apply string algorithms creatively to hard interview problems", observableSkills: ["Solve LC #214 using KMP", "Build suffix arrays", "Apply LPS for periodicity detection"], milestoneProject: { title: "Hard String Problems", description: "Solve LC #214 and #1392 within 45 minutes total", estimatedHours: 3 }, commonPlateaus: ["Seeing the connection between KMP and palindrome problems"], estimatedHours: 15, prerequisites: ["KMP mastery", "Suffix concepts"] },
        { level: 5, name: "Expert", dreyfusLabel: "Expert", description: "Can solve any string algorithm problem and design string-processing systems", observableSkills: ["Suffix array + LCP for substring counting", "Aho-Corasick multi-pattern matching", "String algorithm design for system problems"], milestoneProject: { title: "Substring Analysis Engine", description: "Build a tool that counts distinct substrings, finds longest repeated substring, and detects patterns using suffix array + LCP", estimatedHours: 5 }, commonPlateaus: ["Optimizing suffix array construction beyond O(n log^2 n)"], estimatedHours: 20, prerequisites: ["All previous levels", "Advanced data structures"] },
      ],
    },
    plan: {
      overview: "Master string algorithms from basics to interview-ready in 6 sessions. Covers hashing, palindromes, KMP, Rabin-Karp, Z-algorithm, suffix arrays, and key LeetCode problems.",
      skippedTopics: "Manacher's algorithm, Aho-Corasick, suffix trees, string automata",
      sessions,
    },
    quizBank,
    interviewTips: "Start with brute force O(n*m), then optimize with KMP or Z-algorithm. Mention rolling hash for multi-pattern scenarios. For palindrome problems, consider KMP on s#reverse(s).",
    commonMistakes: "Forgetting lps[0]=0 in KMP. Not verifying hash matches in Rabin-Karp. Negative modulo in rolling hash. Using O(n^2 log n) suffix array in interviews without mentioning faster alternatives.",
    patterns: "KMP for single pattern, Rabin-Karp for multi-pattern, Z-algorithm as KMP alternative, KMP+reverse for palindromes, suffix array+LCP for substring analysis",
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  const topics = [
    buildStringAlgorithmsTopic(),
  ];

  const outputPath = path.join(__dirname, "..", "public", "content", "string-algorithms.json");

  // Write minified JSON
  const json = JSON.stringify(topics);
  fs.writeFileSync(outputPath, json, "utf-8");

  // Validate
  const parsed = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
  console.log(`Generated ${outputPath}`);
  console.log(`Topics: ${parsed.length}`);
  for (const t of parsed) {
    console.log(`  - ${t.topic}: ${t.plan.sessions.length} sessions, ${t.quizBank.length} quiz questions`);
  }

  // Validate structure
  let errors = 0;
  for (const topic of parsed) {
    if (!topic.topic || !topic.category || !topic.cheatSheet) {
      console.error(`ERROR: Missing required field in topic "${topic.topic}"`);
      errors++;
    }
    if (!topic.plan || !topic.plan.sessions || topic.plan.sessions.length === 0) {
      console.error(`ERROR: No sessions in topic "${topic.topic}"`);
      errors++;
    }
    for (const s of topic.plan.sessions) {
      if (!s.sessionNumber || !s.title || !s.content || !s.objectives || !s.activities || !s.reviewQuestions) {
        console.error(`ERROR: Missing field in session ${s.sessionNumber} of "${topic.topic}"`);
        errors++;
      }
    }
    if (!topic.quizBank || topic.quizBank.length === 0) {
      console.error(`ERROR: No quiz questions in topic "${topic.topic}"`);
      errors++;
    }
    for (const q of topic.quizBank) {
      if (!q.question || !q.options || !q.correctAnswer || !q.explanation || !q.difficulty || !q.bloomLabel || !q.format) {
        console.error(`ERROR: Missing field in quiz question: "${q.question?.substring(0, 50)}"`);
        errors++;
      }
      if (!["A", "B", "C", "D"].includes(q.correctAnswer)) {
        console.error(`ERROR: Invalid correctAnswer "${q.correctAnswer}" in "${q.question?.substring(0, 50)}"`);
        errors++;
      }
    }
    if (!topic.ladder || !topic.ladder.levels || topic.ladder.levels.length !== 5) {
      console.error(`ERROR: Ladder should have 5 levels in "${topic.topic}"`);
      errors++;
    }
    if (!topic.resources || topic.resources.length === 0) {
      console.error(`ERROR: No resources in "${topic.topic}"`);
      errors++;
    }
  }

  if (errors > 0) {
    console.error(`\n${errors} validation error(s) found!`);
    process.exit(1);
  } else {
    console.log(`\nValidation passed! All ${parsed.length} topics are well-formed.`);
  }

  // Stats
  const totalSessions = parsed.reduce((sum, t) => sum + t.plan.sessions.length, 0);
  const totalQuiz = parsed.reduce((sum, t) => sum + t.quizBank.length, 0);
  const fileSize = fs.statSync(outputPath).size;
  console.log(`\nStats:`);
  console.log(`  Total sessions: ${totalSessions}`);
  console.log(`  Total quiz questions: ${totalQuiz}`);
  console.log(`  File size: ${(fileSize / 1024).toFixed(1)} KB`);
}

main();
