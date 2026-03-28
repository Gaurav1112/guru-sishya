#!/usr/bin/env node
// ────────────────────────────────────────────────────────────────────────────
// generate-dsa-topics.js — Generates dsa-advanced.json with Trie,
// Bit Manipulation, and Union-Find topic content
// ────────────────────────────────────────────────────────────────────────────

const fs = require("fs");
const path = require("path");

// ── Trie (Prefix Tree) ─────────────────────────────────────────────────────

function buildTrieTopic() {
  const sessions = [
    {
      sessionNumber: 1,
      title: "Trie Basics & Structure",
      content: `### What is a Trie?

A **Trie** (pronounced "try") is a tree-like data structure used for efficient retrieval of keys in a dataset of strings. Also called a **prefix tree**, it stores characters along edges so that common prefixes share the same path.

**Why Tries matter in interviews:** Tries appear in autocomplete systems, spell checkers, IP routing (longest prefix match), and word games. They are a favorite in FAANG interviews (LeetCode #208, #211, #212).

### Trie Structure

Each node contains:
- An array/map of children (one per character)
- A boolean flag indicating end-of-word

\`\`\`mermaid
graph TD
    Root(( )) --> A[a]
    Root --> B[b]
    A --> P[p]
    P --> P2[p]
    P2 --> L[l]
    L --> E["e (end)"]
    A --> N[n]
    N --> T["t (end)"]
    B --> A2[a]
    A2 --> T2["t (end)"]
\`\`\`

This trie stores: "apple", "ant", "bat"

### Complexity Overview

| Operation | Time | Space |
|-----------|------|-------|
| Insert    | O(m) | O(m) |
| Search    | O(m) | O(1) |
| Prefix    | O(m) | O(1) |

Where **m** = length of the word/prefix.

Space for the whole trie: O(ALPHABET_SIZE * m * n) worst case, where n = number of words.

### Basic TrieNode Implementation

**Java:**
\`\`\`java
class TrieNode {
    TrieNode[] children = new TrieNode[26];
    boolean isEndOfWord = false;
}

class Trie {
    TrieNode root = new TrieNode();
}
\`\`\`

**Python:**
\`\`\`python
class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end_of_word = False

class Trie:
    def __init__(self):
        self.root = TrieNode()
\`\`\`

### Key Insight

The Java implementation uses a fixed-size array of 26 (for lowercase English letters), giving O(1) child lookup but using more memory. The Python version uses a dictionary, which is more memory-efficient for sparse tries but slightly slower per lookup.

### When to use a Trie vs HashMap
- **Trie wins**: prefix-based queries, autocomplete, lexicographic ordering
- **HashMap wins**: exact key lookup, no prefix queries needed`,
      objectives: [
        "Understand the trie data structure and its node representation",
        "Compare trie vs HashMap for string storage",
        "Analyze time and space complexity of trie operations",
      ],
      activities: [
        {
          description: "Draw a trie by hand for the words: car, card, care, cats, do, dog",
          durationMinutes: 15,
        },
        {
          description: "Implement TrieNode class in Java and Python",
          durationMinutes: 20,
        },
      ],
      reviewQuestions: [
        "What is the maximum depth of a trie storing n words of max length m?:::The maximum depth equals the length of the longest word stored, which is m.",
        "Why might you use a HashMap instead of an array for trie children?:::A HashMap is more memory-efficient when the alphabet is large or the trie is sparse (few children per node).",
      ],
      successCriteria: "Can draw a trie for a set of words and explain time/space complexity.",
      paretoJustification: "Tries are the foundation for all prefix-based problems; understanding the structure is essential before operations.",
      resources: [
        { title: "LeetCode #208 — Implement Trie", type: "practice", url: "https://leetcode.com/problems/implement-trie-prefix-tree/" },
      ],
    },
    {
      sessionNumber: 2,
      title: "Insert, Search & Delete Operations",
      content: `### Trie Operations — The Core Three

This session covers the three fundamental trie operations. These form the basis for LeetCode #208 (Implement Trie / Prefix Tree).

### Insert

Walk through the word character by character. Create nodes as needed. Mark the last node as end-of-word.

**Time:** O(m) where m = word length | **Space:** O(m) worst case (all new nodes)

**Java:**
\`\`\`java
public class Trie {
    private TrieNode root = new TrieNode();

    // Insert a word into the trie — O(m) time, O(m) space
    public void insert(String word) {
        TrieNode node = root;
        for (char c : word.toCharArray()) {
            int idx = c - 'a';
            if (node.children[idx] == null) {
                node.children[idx] = new TrieNode();
            }
            node = node.children[idx];
        }
        node.isEndOfWord = true;
    }

    // Search for exact word — O(m) time
    public boolean search(String word) {
        TrieNode node = findNode(word);
        return node != null && node.isEndOfWord;
    }

    // Check if any word starts with prefix — O(m) time
    public boolean startsWith(String prefix) {
        return findNode(prefix) != null;
    }

    private TrieNode findNode(String s) {
        TrieNode node = root;
        for (char c : s.toCharArray()) {
            int idx = c - 'a';
            if (node.children[idx] == null) return null;
            node = node.children[idx];
        }
        return node;
    }
}
\`\`\`

**Python:**
\`\`\`python
class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str) -> None:
        """Insert a word into the trie — O(m) time, O(m) space."""
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_end_of_word = True

    def search(self, word: str) -> bool:
        """Search for exact word — O(m) time."""
        node = self._find_node(word)
        return node is not None and node.is_end_of_word

    def starts_with(self, prefix: str) -> bool:
        """Check if any word starts with prefix — O(m) time."""
        return self._find_node(prefix) is not None

    def _find_node(self, s: str):
        node = self.root
        for char in s:
            if char not in node.children:
                return None
            node = node.children[char]
        return node
\`\`\`

### Delete Operation

Delete is trickier — we must remove nodes only if they are not shared with other words.

**Strategy:** Use recursion. After reaching the end node, unmark isEndOfWord. On the way back up, delete child nodes that have no children of their own and are not end-of-word.

**Java:**
\`\`\`java
public boolean delete(String word) {
    return deleteHelper(root, word, 0);
}

private boolean deleteHelper(TrieNode node, String word, int depth) {
    if (node == null) return false;
    if (depth == word.length()) {
        if (!node.isEndOfWord) return false;
        node.isEndOfWord = false;
        return isEmpty(node); // can delete this node if no children
    }
    int idx = word.charAt(depth) - 'a';
    boolean shouldDelete = deleteHelper(node.children[idx], word, depth + 1);
    if (shouldDelete) {
        node.children[idx] = null;
        return !node.isEndOfWord && isEmpty(node);
    }
    return false;
}

private boolean isEmpty(TrieNode node) {
    for (TrieNode child : node.children) {
        if (child != null) return false;
    }
    return true;
}
\`\`\`

**Python:**
\`\`\`python
def delete(self, word: str) -> bool:
    """Delete a word from the trie. Returns True if word was found and deleted."""
    def _delete(node, word, depth):
        if depth == len(word):
            if not node.is_end_of_word:
                return False
            node.is_end_of_word = False
            return len(node.children) == 0
        char = word[depth]
        if char not in node.children:
            return False
        should_delete = _delete(node.children[char], word, depth + 1)
        if should_delete:
            del node.children[char]
            return not node.is_end_of_word and len(node.children) == 0
        return False
    return _delete(self.root, word, 0)
\`\`\`

### Edge Cases to Remember
1. Deleting "app" should NOT delete the shared prefix with "apple"
2. Inserting duplicate words is safe (just re-marks end-of-word)
3. Searching for a prefix that exists but is not a complete word returns false for search, true for startsWith`,
      objectives: [
        "Implement insert, search, and startsWith operations",
        "Implement delete with proper cleanup of unused nodes",
        "Handle edge cases: duplicates, shared prefixes, empty strings",
      ],
      activities: [
        {
          description: "Solve LeetCode #208 (Implement Trie) in both Java and Python",
          durationMinutes: 30,
        },
        {
          description: "Add delete operation and test with shared-prefix cases",
          durationMinutes: 25,
        },
      ],
      reviewQuestions: [
        "Why is delete more complex than insert?:::Delete must check whether removing a node would break other words that share the same prefix path.",
        "What happens if you search for 'app' in a trie that only contains 'apple'?:::search('app') returns false because the node for 'p' (second p) is not marked as end-of-word, but startsWith('app') returns true.",
      ],
      successCriteria: "Can implement all three core trie operations and handle shared-prefix edge cases.",
      paretoJustification: "Insert/search/delete are the most tested trie operations in interviews; mastering them unlocks all advanced trie problems.",
      resources: [
        { title: "LeetCode #208 — Implement Trie", type: "practice", url: "https://leetcode.com/problems/implement-trie-prefix-tree/" },
      ],
    },
    {
      sessionNumber: 3,
      title: "Prefix Matching & Count Queries",
      content: `### Prefix-Based Queries

The killer feature of tries is prefix matching — finding all words that share a common prefix. This is the foundation of autocomplete, search suggestions, and T9 dictionary.

### Count Words With Prefix

To count words with a given prefix: navigate to the prefix node, then count all end-of-word nodes in the subtree.

**Java:**
\`\`\`java
public int countWordsWithPrefix(String prefix) {
    TrieNode node = root;
    for (char c : prefix.toCharArray()) {
        int idx = c - 'a';
        if (node.children[idx] == null) return 0;
        node = node.children[idx];
    }
    return countWords(node);
}

private int countWords(TrieNode node) {
    int count = node.isEndOfWord ? 1 : 0;
    for (TrieNode child : node.children) {
        if (child != null) count += countWords(child);
    }
    return count;
}
\`\`\`

**Python:**
\`\`\`python
def count_words_with_prefix(self, prefix: str) -> int:
    """Count all words starting with the given prefix — O(m + k) time."""
    node = self._find_node(prefix)
    if node is None:
        return 0
    return self._count_words(node)

def _count_words(self, node) -> int:
    count = 1 if node.is_end_of_word else 0
    for child in node.children.values():
        count += self._count_words(child)
    return count
\`\`\`

**Time:** O(m + k) where m = prefix length, k = number of nodes in the subtree.

### Collect All Words With Prefix

Return the actual list of matching words — useful for autocomplete.

**Java:**
\`\`\`java
public List<String> getWordsWithPrefix(String prefix) {
    List<String> result = new ArrayList<>();
    TrieNode node = root;
    for (char c : prefix.toCharArray()) {
        int idx = c - 'a';
        if (node.children[idx] == null) return result;
        node = node.children[idx];
    }
    collectWords(node, new StringBuilder(prefix), result);
    return result;
}

private void collectWords(TrieNode node, StringBuilder sb, List<String> result) {
    if (node.isEndOfWord) result.add(sb.toString());
    for (int i = 0; i < 26; i++) {
        if (node.children[i] != null) {
            sb.append((char) ('a' + i));
            collectWords(node.children[i], sb, result);
            sb.deleteCharAt(sb.length() - 1);
        }
    }
}
\`\`\`

**Python:**
\`\`\`python
def get_words_with_prefix(self, prefix: str) -> list:
    """Return all words starting with the given prefix."""
    result = []
    node = self._find_node(prefix)
    if node is None:
        return result
    self._collect_words(node, list(prefix), result)
    return result

def _collect_words(self, node, path, result):
    if node.is_end_of_word:
        result.append(''.join(path))
    for char, child in sorted(node.children.items()):
        path.append(char)
        self._collect_words(child, path, result)
        path.pop()
\`\`\`

### Optimized Trie with Prefix & Word Counts

A common interview optimization: store counts at each node to avoid subtree traversal.

\`\`\`mermaid
graph TD
    R["root<br/>prefixCount=3"] --> A["a<br/>prefixCount=2"]
    R --> B["b<br/>prefixCount=1"]
    A --> P["p<br/>prefixCount=2<br/>wordCount=1 (ap)"]
    P --> P2["p<br/>prefixCount=1"]
    P2 --> L["l<br/>prefixCount=1"]
    L --> E["e<br/>wordCount=1 (apple)"]
    B --> A2["a<br/>prefixCount=1"]
    A2 --> T["t<br/>wordCount=1 (bat)"]
\`\`\`

**Java (with counts):**
\`\`\`java
class TrieNode {
    TrieNode[] children = new TrieNode[26];
    int wordCount = 0;    // words ending here
    int prefixCount = 0;  // words passing through
}

public void insert(String word) {
    TrieNode node = root;
    for (char c : word.toCharArray()) {
        int idx = c - 'a';
        if (node.children[idx] == null)
            node.children[idx] = new TrieNode();
        node = node.children[idx];
        node.prefixCount++;
    }
    node.wordCount++;
}

public int countWordsEqualTo(String word) {
    TrieNode node = findNode(word);
    return node == null ? 0 : node.wordCount;
}

public int countWordsStartingWith(String prefix) {
    TrieNode node = findNode(prefix);
    return node == null ? 0 : node.prefixCount;
}
\`\`\`

**Python (with counts):**
\`\`\`python
class TrieNode:
    def __init__(self):
        self.children = {}
        self.word_count = 0
        self.prefix_count = 0

def insert(self, word: str) -> None:
    node = self.root
    for char in word:
        if char not in node.children:
            node.children[char] = TrieNode()
        node = node.children[char]
        node.prefix_count += 1
    node.word_count += 1

def count_words_equal_to(self, word: str) -> int:
    node = self._find_node(word)
    return 0 if node is None else node.word_count

def count_words_starting_with(self, prefix: str) -> int:
    node = self._find_node(prefix)
    return 0 if node is None else node.prefix_count
\`\`\`

This solves LeetCode #1804 (Implement Trie II) in O(m) per operation with O(1) count queries.`,
      objectives: [
        "Implement prefix counting and word collection from a trie",
        "Optimize with per-node prefix and word counts",
        "Understand the DFS approach to collecting words",
      ],
      activities: [
        {
          description: "Implement getWordsWithPrefix and verify with test cases",
          durationMinutes: 25,
        },
        {
          description: "Solve LeetCode #1804 (Implement Trie II) using the count-based approach",
          durationMinutes: 30,
        },
      ],
      reviewQuestions: [
        "What is the time complexity of collecting all words with a given prefix?:::O(m + k) where m is the prefix length and k is the total number of characters in all matching words (full subtree traversal).",
        "How does storing prefixCount at each node improve performance?:::It avoids the need for DFS subtree traversal — count queries become O(m) instead of O(m + k).",
      ],
      successCriteria: "Can implement both naive and optimized prefix counting approaches.",
      paretoJustification: "Prefix queries are the primary use case of tries and appear directly in autocomplete and search-related interview problems.",
      resources: [
        { title: "LeetCode #1804 — Implement Trie II", type: "practice", url: "https://leetcode.com/problems/implement-trie-ii-prefix-tree/" },
      ],
    },
    {
      sessionNumber: 4,
      title: "Autocomplete System",
      content: `### Building an Autocomplete System

Autocomplete is the most practical trie application and a common system design + coding interview question. This session covers LeetCode #642 (Design Search Autocomplete System).

### Problem Statement

Design a system that:
1. Takes a character input stream
2. Returns the top 3 most frequently searched sentences that match the current prefix
3. Records completed sentences (when user presses '#')

### Approach: Trie + Priority Queue

Store sentences with their frequencies. For each prefix, collect matching sentences and return the top-k by frequency (ties broken lexicographically).

\`\`\`mermaid
graph TD
    subgraph "Autocomplete Trie"
    R(root) --> I["i"]
    I --> S["s (2)"]
    I --> L["island (3)"]
    I --> R2["ironman (1)"]
    end
    subgraph "Query: 'i'"
    Q["Input: 'i'"] --> RES["Top 3:<br/>1. island (3)<br/>2. is (2)<br/>3. ironman (1)"]
    end
\`\`\`

**Java:**
\`\`\`java
class AutocompleteSystem {
    private TrieNode root = new TrieNode();
    private StringBuilder currentInput = new StringBuilder();
    private Map<String, Integer> frequency = new HashMap<>();

    static class TrieNode {
        Map<Character, TrieNode> children = new HashMap<>();
        List<String> sentences = new ArrayList<>(); // top sentences passing through
    }

    public AutocompleteSystem(String[] sentences, int[] times) {
        for (int i = 0; i < sentences.length; i++) {
            frequency.put(sentences[i], times[i]);
            insertIntoTrie(sentences[i]);
        }
    }

    private void insertIntoTrie(String sentence) {
        TrieNode node = root;
        for (char c : sentence.toCharArray()) {
            node.children.putIfAbsent(c, new TrieNode());
            node = node.children.get(c);
            // Maintain sorted top-3 at each node
            if (!node.sentences.contains(sentence)) {
                node.sentences.add(sentence);
            }
            node.sentences.sort((a, b) -> {
                int freqDiff = frequency.getOrDefault(b, 0) - frequency.getOrDefault(a, 0);
                return freqDiff != 0 ? freqDiff : a.compareTo(b);
            });
            if (node.sentences.size() > 3) {
                node.sentences.remove(node.sentences.size() - 1);
            }
        }
    }

    public List<String> input(char c) {
        if (c == '#') {
            String sentence = currentInput.toString();
            frequency.merge(sentence, 1, Integer::sum);
            insertIntoTrie(sentence);
            currentInput = new StringBuilder();
            return new ArrayList<>();
        }
        currentInput.append(c);
        TrieNode node = root;
        for (char ch : currentInput.toString().toCharArray()) {
            if (!node.children.containsKey(ch)) return new ArrayList<>();
            node = node.children.get(ch);
        }
        return node.sentences;
    }
}
\`\`\`

**Python:**
\`\`\`python
import heapq

class AutocompleteSystem:
    def __init__(self, sentences: list, times: list):
        self.root = {}
        self.frequency = {}
        self.current_input = []
        for sentence, count in zip(sentences, times):
            self.frequency[sentence] = count
            self._insert(sentence)

    def _insert(self, sentence: str):
        node = self.root
        for char in sentence:
            if char not in node:
                node[char] = {"_sentences": []}
            node = node[char]
            # Update top-3 at each node
            slist = node["_sentences"]
            if sentence not in slist:
                slist.append(sentence)
            slist.sort(key=lambda s: (-self.frequency.get(s, 0), s))
            if len(slist) > 3:
                slist.pop()

    def input(self, c: str) -> list:
        if c == '#':
            sentence = ''.join(self.current_input)
            self.frequency[sentence] = self.frequency.get(sentence, 0) + 1
            self._insert(sentence)
            self.current_input = []
            return []
        self.current_input.append(c)
        node = self.root
        for char in self.current_input:
            if char not in node:
                return []
            node = node[char]
        return node.get("_sentences", [])
\`\`\`

### Complexity Analysis

| Operation | Time | Space |
|-----------|------|-------|
| Constructor | O(n * m * m log m) | O(n * m) |
| input() | O(m) per character | O(1) |

Where n = number of sentences, m = max sentence length. The O(m) per input is achieved by pre-computing top-3 at each node during insertion.

### Interview Tips
- Clarify: case-sensitive? special characters? how many results?
- Mention the trade-off: pre-computing top-k at nodes trades space for faster queries
- For follow-up "what if millions of users?", discuss distributed tries, caching hot prefixes`,
      objectives: [
        "Design and implement an autocomplete system using tries",
        "Apply top-k pattern with priority queues",
        "Analyze amortized complexity of the autocomplete system",
      ],
      activities: [
        {
          description: "Solve LeetCode #642 (Design Search Autocomplete System)",
          durationMinutes: 45,
        },
        {
          description: "Extend with case-insensitive matching and discuss scalability",
          durationMinutes: 15,
        },
      ],
      reviewQuestions: [
        "Why store top-3 sentences at each node instead of computing them on each query?:::Pre-computing avoids O(n) DFS on every keystroke, reducing query time to O(m) where m is the current prefix length.",
        "How would you handle this at scale with millions of sentences?:::Use a distributed trie (sharded by first few characters), cache hot prefixes in memory, and use a write-behind pattern for frequency updates.",
      ],
      successCriteria: "Can implement autocomplete with top-k results and explain the design trade-offs.",
      paretoJustification: "Autocomplete is the most-asked trie application in both coding rounds and system design interviews.",
      resources: [
        { title: "LeetCode #642 — Design Search Autocomplete System", type: "practice", url: "https://leetcode.com/problems/design-search-autocomplete-system/" },
      ],
    },
    {
      sessionNumber: 5,
      title: "Word Search in Board (Trie + Backtracking)",
      content: `### Word Search II — LeetCode #212

This is a classic hard problem that combines trie with backtracking. Given an m x n board of characters and a list of words, find all words that can be formed by sequentially adjacent cells (horizontal/vertical).

### Why Trie + Backtracking?

Naive approach: For each word, run DFS on the board. Time: O(words * m * n * 4^L). With a trie, we search ALL words simultaneously — one DFS pass covers all words.

\`\`\`mermaid
graph TD
    subgraph "Board"
    direction LR
    B["o a t h<br/>p e t a<br/>i h k r<br/>i f l v"]
    end
    subgraph "Trie of words"
    R(root) --> O[o]
    O --> A[a]
    A --> T["t (oath)"]
    R --> P[p]
    P --> E[e]
    E --> A2["a (pea)"]
    E --> T2["t (pet)"]
    end
    B --> |"DFS guided<br/>by trie"| R
\`\`\`

**Java:**
\`\`\`java
class Solution {
    private int[][] dirs = {{0,1},{0,-1},{1,0},{-1,0}};

    public List<String> findWords(char[][] board, String[] words) {
        // Build trie from word list
        TrieNode root = new TrieNode();
        for (String word : words) {
            TrieNode node = root;
            for (char c : word.toCharArray()) {
                int idx = c - 'a';
                if (node.children[idx] == null)
                    node.children[idx] = new TrieNode();
                node = node.children[idx];
            }
            node.word = word; // store complete word at leaf
        }

        List<String> result = new ArrayList<>();
        int m = board.length, n = board[0].length;
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                dfs(board, i, j, root, result);
            }
        }
        return result;
    }

    private void dfs(char[][] board, int i, int j, TrieNode node, List<String> result) {
        if (i < 0 || i >= board.length || j < 0 || j >= board[0].length) return;
        char c = board[i][j];
        if (c == '#' || node.children[c - 'a'] == null) return;

        node = node.children[c - 'a'];
        if (node.word != null) {
            result.add(node.word);
            node.word = null; // avoid duplicates
        }

        board[i][j] = '#'; // mark visited
        for (int[] d : dirs) {
            dfs(board, i + d[0], j + d[1], node, result);
        }
        board[i][j] = c; // restore
    }
}

class TrieNode {
    TrieNode[] children = new TrieNode[26];
    String word = null;
}
\`\`\`

**Python:**
\`\`\`python
class Solution:
    def findWords(self, board: list[list[str]], words: list[str]) -> list[str]:
        # Build trie
        root = {}
        for word in words:
            node = root
            for char in word:
                node = node.setdefault(char, {})
            node['#'] = word  # mark end with the complete word

        result = []
        m, n = len(board), len(board[0])

        def dfs(i, j, node):
            if i < 0 or i >= m or j < 0 or j >= n:
                return
            char = board[i][j]
            if char not in node:
                return
            next_node = node[char]
            if '#' in next_node:
                result.append(next_node['#'])
                del next_node['#']  # avoid duplicates

            board[i][j] = '.'  # mark visited
            for di, dj in [(0,1),(0,-1),(1,0),(-1,0)]:
                dfs(i + di, j + dj, next_node)
            board[i][j] = char  # restore

            # Prune: remove empty trie branches
            if not next_node:
                del node[char]

        for i in range(m):
            for j in range(n):
                dfs(i, j, root)
        return result
\`\`\`

### Complexity

- **Time:** O(m * n * 4^L) where L = max word length. In practice much better due to trie pruning.
- **Space:** O(sum of word lengths) for the trie + O(L) recursion stack.

### Key Optimization: Trie Pruning

The Python solution includes pruning — once a word is found, we remove its leaf. If a branch becomes empty, we delete it. This prevents re-exploring dead branches and dramatically improves average-case performance.

### Interview Tips
- Start by explaining WHY trie is better than per-word DFS
- Mention the pruning optimization proactively — interviewers love it
- Watch for the "mark visited" pattern using board mutation (restore after DFS)`,
      objectives: [
        "Combine trie with DFS backtracking for multi-word search",
        "Implement trie pruning for optimization",
        "Analyze why trie-based approach is superior to brute force",
      ],
      activities: [
        {
          description: "Solve LeetCode #212 (Word Search II) — implement and test with multiple boards",
          durationMinutes: 45,
        },
        {
          description: "Benchmark with and without trie pruning to observe the speedup",
          durationMinutes: 15,
        },
      ],
      reviewQuestions: [
        "Why is trie + backtracking faster than running DFS for each word separately?:::The trie allows searching all words in one DFS pass — shared prefixes are traversed once instead of once per word.",
        "What does the pruning optimization do and why is it important?:::Pruning removes trie branches after finding words, preventing the DFS from exploring paths that can no longer match any remaining word. This turns worst-case exponential into practical near-linear.",
      ],
      successCriteria: "Can implement Word Search II with trie pruning and explain the complexity improvement.",
      paretoJustification: "Word Search II is one of the most frequently asked hard trie problems at FAANG companies.",
      resources: [
        { title: "LeetCode #212 — Word Search II", type: "practice", url: "https://leetcode.com/problems/word-search-ii/" },
      ],
    },
    {
      sessionNumber: 6,
      title: "Wildcard & Regex Matching with Tries",
      content: `### Design Add and Search Words Data Structure — LeetCode #211

This problem extends the basic trie with wildcard matching: the '.' character matches any single letter.

### Approach

For regular characters, follow the normal trie path. When encountering '.', try ALL children at the current node (backtracking/DFS).

**Java:**
\`\`\`java
class WordDictionary {
    private TrieNode root = new TrieNode();

    static class TrieNode {
        TrieNode[] children = new TrieNode[26];
        boolean isEnd = false;
    }

    public void addWord(String word) {
        TrieNode node = root;
        for (char c : word.toCharArray()) {
            int idx = c - 'a';
            if (node.children[idx] == null)
                node.children[idx] = new TrieNode();
            node = node.children[idx];
        }
        node.isEnd = true;
    }

    public boolean search(String word) {
        return searchHelper(root, word, 0);
    }

    private boolean searchHelper(TrieNode node, String word, int idx) {
        if (node == null) return false;
        if (idx == word.length()) return node.isEnd;

        char c = word.charAt(idx);
        if (c == '.') {
            // Try every child
            for (TrieNode child : node.children) {
                if (searchHelper(child, word, idx + 1)) return true;
            }
            return false;
        } else {
            return searchHelper(node.children[c - 'a'], word, idx + 1);
        }
    }
}
\`\`\`

**Python:**
\`\`\`python
class WordDictionary:
    def __init__(self):
        self.root = TrieNode()

    def addWord(self, word: str) -> None:
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_end_of_word = True

    def search(self, word: str) -> bool:
        """Search with '.' wildcard support."""
        def dfs(node, idx):
            if idx == len(word):
                return node.is_end_of_word
            char = word[idx]
            if char == '.':
                return any(dfs(child, idx + 1) for child in node.children.values())
            if char not in node.children:
                return False
            return dfs(node.children[char], idx + 1)
        return dfs(self.root, 0)
\`\`\`

### Complexity

| Operation | Time | Space |
|-----------|------|-------|
| addWord | O(m) | O(m) |
| search (no wildcard) | O(m) | O(1) |
| search (all dots) | O(26^m) worst case | O(m) stack |

In practice, wildcard searches are much faster because most branches terminate early.

### Extended: Matching with '*' (Zero or More)

For full regex-like matching (e.g., "a*b" matches "b", "ab", "aab"), combine trie traversal with DP or NFA simulation. This is closer to LeetCode #10 (Regular Expression Matching) territory.

**Pattern:** For '*' after a character:
1. Skip the char+star (zero matches)
2. If current node matches char, stay at same pattern position (one or more matches)

### Interview Tip
When the interviewer says "what if we add wildcards?", immediately think:
- Single wildcard '.' → try all children (DFS)
- Star '*' → recursion with two branches (skip or consume)
- This is where tries outshine hashmaps — hashmaps cannot do pattern matching`,
      objectives: [
        "Implement wildcard search with '.' using DFS on trie",
        "Analyze worst-case vs practical complexity for wildcards",
        "Understand the connection between tries and regex matching",
      ],
      activities: [
        {
          description: "Solve LeetCode #211 (Design Add and Search Words Data Structure)",
          durationMinutes: 30,
        },
        {
          description: "Test with edge cases: all dots, single character words, no matches",
          durationMinutes: 15,
        },
      ],
      reviewQuestions: [
        "What is the worst-case time for searching '....' (four dots) in a trie with 26-ary branching?:::O(26^4) = O(456,976) because each dot must try all 26 children at each level. In practice, most branches terminate early.",
        "Why can't a HashMap support wildcard search efficiently?:::A HashMap requires exact key matches. To support wildcards, you'd need to check every key, which is O(n * m) — worse than a trie's pruned DFS.",
      ],
      successCriteria: "Can implement wildcard matching and explain when tries beat hashmaps for pattern search.",
      paretoJustification: "Wildcard matching is the second most common trie interview problem after basic implementation.",
      resources: [
        { title: "LeetCode #211 — Add and Search Word", type: "practice", url: "https://leetcode.com/problems/design-add-and-search-words-data-structure/" },
      ],
    },
    {
      sessionNumber: 7,
      title: "Compressed Trie & Radix Tree",
      content: `### Space Optimization: Compressed Tries

A standard trie wastes space when chains of single-child nodes form long paths. A **compressed trie** (also called a **radix tree** or **Patricia trie**) merges these chains into single edges labeled with substrings.

\`\`\`mermaid
graph TD
    subgraph "Standard Trie"
    R1(root) --> r1[r]
    r1 --> o1[o]
    o1 --> m1[m]
    m1 --> a1["ane"]
    m1 --> u1["ulus"]
    end
    subgraph "Compressed Trie"
    R2(root) --> rom["rom"]
    rom --> ane["ane (romane)"]
    rom --> ulus["ulus (romulus)"]
    end
\`\`\`

### When to Use Compressed Tries
- Large dictionaries with long shared prefixes (URLs, file paths, IPs)
- Memory-constrained environments
- Longest prefix matching (IP routing tables)

### Implementation

**Java:**
\`\`\`java
class CompressedTrieNode {
    String label;           // edge label (substring)
    Map<Character, CompressedTrieNode> children = new HashMap<>();
    boolean isEndOfWord = false;

    CompressedTrieNode(String label) {
        this.label = label;
    }
}

class CompressedTrie {
    CompressedTrieNode root = new CompressedTrieNode("");

    public void insert(String word) {
        CompressedTrieNode node = root;
        int i = 0;
        while (i < word.length()) {
            char c = word.charAt(i);
            if (!node.children.containsKey(c)) {
                // No matching edge — create new leaf
                CompressedTrieNode leaf = new CompressedTrieNode(word.substring(i));
                leaf.isEndOfWord = true;
                node.children.put(c, leaf);
                return;
            }
            CompressedTrieNode child = node.children.get(c);
            String label = child.label;
            int j = 0;
            // Find common prefix between remaining word and edge label
            while (j < label.length() && i < word.length()
                   && label.charAt(j) == word.charAt(i)) {
                i++;
                j++;
            }
            if (j == label.length()) {
                // Consumed entire edge label — continue down
                node = child;
            } else {
                // Split edge at mismatch point
                CompressedTrieNode split = new CompressedTrieNode(label.substring(0, j));
                node.children.put(c, split);
                child.label = label.substring(j);
                split.children.put(child.label.charAt(0), child);
                if (i < word.length()) {
                    CompressedTrieNode leaf = new CompressedTrieNode(word.substring(i));
                    leaf.isEndOfWord = true;
                    split.children.put(word.charAt(i), leaf);
                } else {
                    split.isEndOfWord = true;
                }
                return;
            }
        }
        node.isEndOfWord = true;
    }

    public boolean search(String word) {
        CompressedTrieNode node = root;
        int i = 0;
        while (i < word.length()) {
            char c = word.charAt(i);
            if (!node.children.containsKey(c)) return false;
            CompressedTrieNode child = node.children.get(c);
            String label = child.label;
            if (!word.substring(i).startsWith(label)) {
                return false; // mismatch within edge
            }
            i += label.length();
            node = child;
        }
        return node.isEndOfWord;
    }
}
\`\`\`

**Python:**
\`\`\`python
class CompressedTrieNode:
    def __init__(self, label=""):
        self.label = label
        self.children = {}
        self.is_end_of_word = False

class CompressedTrie:
    def __init__(self):
        self.root = CompressedTrieNode()

    def insert(self, word: str) -> None:
        node = self.root
        i = 0
        while i < len(word):
            c = word[i]
            if c not in node.children:
                leaf = CompressedTrieNode(word[i:])
                leaf.is_end_of_word = True
                node.children[c] = leaf
                return
            child = node.children[c]
            label = child.label
            j = 0
            while j < len(label) and i < len(word) and label[j] == word[i]:
                i += 1
                j += 1
            if j == len(label):
                node = child
            else:
                # Split the edge
                split = CompressedTrieNode(label[:j])
                node.children[c] = split
                child.label = label[j:]
                split.children[child.label[0]] = child
                if i < len(word):
                    leaf = CompressedTrieNode(word[i:])
                    leaf.is_end_of_word = True
                    split.children[word[i]] = leaf
                else:
                    split.is_end_of_word = True
                return
        node.is_end_of_word = True

    def search(self, word: str) -> bool:
        node = self.root
        i = 0
        while i < len(word):
            c = word[i]
            if c not in node.children:
                return False
            child = node.children[c]
            if not word[i:].startswith(child.label):
                return False
            i += len(child.label)
            node = child
        return node.is_end_of_word
\`\`\`

### Complexity Comparison

| | Standard Trie | Compressed Trie |
|---|---|---|
| Space | O(ALPHABET * total chars) | O(total unique chars) |
| Insert | O(m) | O(m) |
| Search | O(m) | O(m) |
| Implementation | Simple | Complex (edge splitting) |

### Real-World Usage
- **Linux kernel**: radix trees for page cache indexing
- **Networking**: longest prefix match for IP routing (CIDR)
- **Databases**: indexes for string columns (e.g., Redis)`,
      objectives: [
        "Understand why compressed tries save space",
        "Implement insert and search with edge splitting",
        "Compare standard vs compressed trie trade-offs",
      ],
      activities: [
        {
          description: "Implement compressed trie insert with edge splitting and test with 10+ words",
          durationMinutes: 40,
        },
        {
          description: "Measure memory usage: standard trie vs compressed trie on a dictionary of 1000 words",
          durationMinutes: 20,
        },
      ],
      reviewQuestions: [
        "When does a compressed trie save the most space compared to a standard trie?:::When words share long prefixes but diverge late (e.g., URLs like '/api/v1/users' and '/api/v1/posts'). Single-child chains get collapsed into single edges.",
        "What makes the insert operation more complex in a compressed trie?:::Insert requires detecting mismatches within an edge label and splitting the edge into two parts — the common prefix and the diverging suffixes.",
      ],
      successCriteria: "Can implement a compressed trie and explain when to prefer it over a standard trie.",
      paretoJustification: "Compressed tries appear in system design discussions and demonstrate deep understanding beyond basic trie implementation.",
      resources: [
        { title: "Wikipedia — Radix Tree", type: "docs", url: "https://en.wikipedia.org/wiki/Radix_tree" },
      ],
    },
    {
      sessionNumber: 8,
      title: "Trie Interview Patterns & Practice",
      content: `### Common Trie Interview Patterns

This session consolidates the key patterns you need to recognize during interviews.

### Pattern 1: Longest Common Prefix — LeetCode #14

Find the longest common prefix among an array of strings.

**Java:**
\`\`\`java
public String longestCommonPrefix(String[] strs) {
    if (strs.length == 0) return "";
    TrieNode root = new TrieNode();
    // Insert all words
    for (String s : strs) {
        TrieNode node = root;
        for (char c : s.toCharArray()) {
            int idx = c - 'a';
            if (node.children[idx] == null)
                node.children[idx] = new TrieNode();
            node = node.children[idx];
            node.passCount++;
        }
        node.isEndOfWord = true;
    }
    // Walk down while only one child and not end-of-word
    StringBuilder sb = new StringBuilder();
    TrieNode node = root;
    while (true) {
        int childIdx = -1, count = 0;
        for (int i = 0; i < 26; i++) {
            if (node.children[i] != null) { childIdx = i; count++; }
        }
        if (count != 1 || node.isEndOfWord) break;
        sb.append((char) ('a' + childIdx));
        node = node.children[childIdx];
    }
    return sb.toString();
}
\`\`\`

**Python:**
\`\`\`python
def longestCommonPrefix(strs: list[str]) -> str:
    if not strs:
        return ""
    root = {}
    for word in strs:
        node = root
        for char in word:
            node = node.setdefault(char, {})
        node['$'] = True  # end marker

    prefix = []
    node = root
    while len(node) == 1 and '$' not in node:
        char = next(iter(node))
        prefix.append(char)
        node = node[char]
    return ''.join(prefix)
\`\`\`

### Pattern 2: Maximum XOR of Two Numbers — LeetCode #421

Use a **bitwise trie** (binary trie) to find the maximum XOR.

**Java:**
\`\`\`java
public int findMaximumXOR(int[] nums) {
    // Build binary trie (32 bits, MSB first)
    int[][] trie = new int[32 * nums.length + 1][2];
    int nodeCount = 1;

    for (int num : nums) {
        int node = 0;
        for (int i = 31; i >= 0; i--) {
            int bit = (num >> i) & 1;
            if (trie[node][bit] == 0) {
                trie[node][bit] = nodeCount++;
            }
            node = trie[node][bit];
        }
    }

    int maxXor = 0;
    for (int num : nums) {
        int node = 0, xor = 0;
        for (int i = 31; i >= 0; i--) {
            int bit = (num >> i) & 1;
            int desired = 1 - bit; // we want the opposite bit for max XOR
            if (trie[node][desired] != 0) {
                xor |= (1 << i);
                node = trie[node][desired];
            } else {
                node = trie[node][bit];
            }
        }
        maxXor = Math.max(maxXor, xor);
    }
    return maxXor;
}
\`\`\`

**Python:**
\`\`\`python
def findMaximumXOR(nums: list[int]) -> int:
    root = {}
    # Build binary trie
    for num in nums:
        node = root
        for i in range(31, -1, -1):
            bit = (num >> i) & 1
            if bit not in node:
                node[bit] = {}
            node = node[bit]

    max_xor = 0
    for num in nums:
        node = root
        xor_val = 0
        for i in range(31, -1, -1):
            bit = (num >> i) & 1
            desired = 1 - bit
            if desired in node:
                xor_val |= (1 << i)
                node = node[desired]
            else:
                node = node[bit]
        max_xor = max(max_xor, xor_val)
    return max_xor
\`\`\`

**Time:** O(32n) = O(n) | **Space:** O(32n) = O(n)

### Pattern 3: Map Sum Pairs — LeetCode #677

Insert key-value pairs. sum(prefix) returns the sum of all values whose keys start with that prefix.

### Pattern Recognition Cheat Sheet

| Signal | Pattern | Example Problem |
|--------|---------|-----------------|
| "prefix", "starts with" | Basic trie | LC #208 |
| "autocomplete", "top k" | Trie + priority queue | LC #642 |
| "wildcard", "." | Trie + DFS | LC #211 |
| "word search", "board" | Trie + backtracking | LC #212 |
| "longest prefix" | Trie walk until branch | LC #14 |
| "maximum XOR" | Binary (bitwise) trie | LC #421 |
| "palindrome pairs" | Reversed trie + check | LC #336 |
| "word abbreviation" | Trie with count | LC #527 |

### Interview Checklist
1. Can I use a trie? (Look for prefix/pattern keywords)
2. What alphabet? (26 lowercase, 128 ASCII, Unicode?)
3. Fixed array vs HashMap children? (Memory vs speed trade-off)
4. Do I need counts at nodes? (For frequency queries)
5. Is pruning applicable? (For search problems)`,
      objectives: [
        "Recognize trie patterns from problem descriptions",
        "Apply binary trie for XOR problems",
        "Build a mental framework for when to use each trie variant",
      ],
      activities: [
        {
          description: "Solve LeetCode #421 (Maximum XOR of Two Numbers in an Array) using binary trie",
          durationMinutes: 30,
        },
        {
          description: "Practice pattern recognition: given 10 problem descriptions, identify which ones use tries",
          durationMinutes: 20,
        },
      ],
      reviewQuestions: [
        "When would you use a binary trie instead of a character trie?:::When the problem involves bitwise operations like XOR. Each 'character' is a single bit (0 or 1), and you traverse from MSB to LSB.",
        "What is the key signal that a problem might require a trie instead of a HashMap?:::Prefix-based queries (startsWith, autocomplete, common prefix) or pattern matching with wildcards. HashMaps excel at exact lookups but cannot efficiently handle prefix operations.",
      ],
      successCriteria: "Can identify trie problems from problem statements and choose the right trie variant.",
      paretoJustification: "Pattern recognition is the meta-skill that determines interview performance — knowing which tool to reach for is half the battle.",
      resources: [
        { title: "LeetCode #421 — Maximum XOR", type: "practice", url: "https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/" },
        { title: "LeetCode #336 — Palindrome Pairs", type: "practice", url: "https://leetcode.com/problems/palindrome-pairs/" },
      ],
    },
  ];

  const quizBank = [
    { question: "What is the time complexity of searching for a word of length m in a trie?", format: "mcq", difficulty: 1, bloomLabel: "Remember", options: ["A) O(1)", "B) O(m)", "C) O(n)", "D) O(n * m)"], correctAnswer: "B", explanation: "**Correct: B) O(m).** Trie search traverses one node per character in the word. The search time depends only on the word length m, not on the total number of words n stored in the trie. This is the key advantage over hash tables for prefix operations." },
    { question: "In a standard trie with lowercase English letters, how many children can each node have?", format: "mcq", difficulty: 1, bloomLabel: "Remember", options: ["A) 2", "B) 10", "C) 26", "D) 52"], correctAnswer: "C", explanation: "**Correct: C) 26.** Each node has one potential child for each letter a-z. In a Java array-based implementation, each node allocates a TrieNode[26] array. In Python, a dictionary is typically used for memory efficiency." },
    { question: "What distinguishes a trie from a binary search tree for string storage?", format: "mcq", difficulty: 2, bloomLabel: "Understand", options: ["A) A trie has at most 2 children per node", "B) A trie stores one character per edge, sharing common prefixes", "C) A trie always uses less memory than a BST", "D) A trie cannot store duplicate strings"], correctAnswer: "B", explanation: "**Correct: B).** A trie stores characters along edges so that words with common prefixes share the same path from root. A BST stores entire strings at each node and compares whole strings. This prefix sharing is what makes tries efficient for prefix-based queries." },
    { question: "What is the space complexity of a trie storing n words, each of maximum length m, over an alphabet of size A?", format: "mcq", difficulty: 3, bloomLabel: "Analyze", options: ["A) O(n)", "B) O(n * m)", "C) O(A * n * m)", "D) O(A^m)"], correctAnswer: "C", explanation: "**Correct: C) O(A * n * m).** In the worst case (no shared prefixes), the trie has n * m nodes, each with A child pointers. With shared prefixes, actual usage is much lower. Python dict-based tries use less space because they only store existing children." },
    { question: "Given a trie containing 'apple' and 'app', what does search('app') return?", format: "mcq", difficulty: 2, bloomLabel: "Apply", options: ["A) true", "B) false", "C) Throws an error", "D) Returns 'apple'"], correctAnswer: "A", explanation: "**Correct: A) true.** When 'app' was inserted, the node at the end of 'p-p' was marked as isEndOfWord=true. Even though 'apple' extends further, the end-of-word marker at 'app' makes search('app') return true." },
    { question: "In the autocomplete system (LeetCode #642), why store top-3 sentences at each trie node?", format: "mcq", difficulty: 3, bloomLabel: "Analyze", options: ["A) To reduce memory usage", "B) To avoid DFS traversal on every keystroke, achieving O(m) query time", "C) To support wildcard matching", "D) To enable delete operations"], correctAnswer: "B", explanation: "**Correct: B).** Pre-computing top-3 at each node trades space for speed. Without this optimization, every keystroke would require a full DFS of the subtree to find and rank all matching sentences — potentially O(n) per query. With pre-computed lists, each input() call is O(m) where m is the current prefix length." },
    { question: "How does the '.' wildcard affect trie search complexity in LeetCode #211?", format: "mcq", difficulty: 3, bloomLabel: "Analyze", options: ["A) No change — still O(m)", "B) O(26^m) worst case when all characters are '.'", "C) O(n * m) where n is number of words", "D) O(m^2)"], correctAnswer: "B", explanation: "**Correct: B) O(26^m).** When a '.' is encountered, the search must try all 26 children at that node. If every character is '.', we explore all paths: 26 choices at each of m levels = 26^m. In practice, most branches terminate early, so average case is much better." },
    { question: "In Word Search II (LeetCode #212), what is the purpose of trie pruning?", format: "mcq", difficulty: 4, bloomLabel: "Evaluate", options: ["A) To reduce the trie's memory footprint", "B) To prevent finding duplicate words", "C) To remove dead branches and prevent re-exploring paths that cannot match remaining words", "D) To sort the results lexicographically"], correctAnswer: "C", explanation: "**Correct: C).** After finding a word, we remove its leaf from the trie. If a branch becomes empty (no remaining words can be found through it), we delete the branch. This prevents the DFS from wasting time on dead-end paths, significantly improving average-case performance on large boards." },
    { question: "What is the key advantage of a compressed trie (radix tree) over a standard trie?", format: "mcq", difficulty: 2, bloomLabel: "Understand", options: ["A) Faster search time", "B) Reduced space by merging single-child chains into edge labels", "C) Simpler implementation", "D) Better worst-case time complexity"], correctAnswer: "B", explanation: "**Correct: B).** A compressed trie merges chains of single-child nodes into single edges labeled with substrings. This significantly reduces memory for datasets with long shared prefixes (like URLs or file paths). Search time remains O(m), but the implementation is more complex due to edge splitting on insert." },
    { question: "In a binary trie used for Maximum XOR (LeetCode #421), what does each level represent?", format: "mcq", difficulty: 3, bloomLabel: "Apply", options: ["A) A digit of the number", "B) A single bit, from MSB to LSB", "C) A character of the binary string", "D) The XOR result"], correctAnswer: "B", explanation: "**Correct: B).** A binary trie has two children per node (0 and 1). Numbers are inserted bit-by-bit from the most significant bit (bit 31) to the least significant bit (bit 0). To maximize XOR, we greedily choose the opposite bit at each level." },
    { question: "You need to find all words in a dictionary that start with 'pre'. Which data structure is most efficient?", format: "mcq", difficulty: 2, bloomLabel: "Apply", options: ["A) HashMap", "B) Sorted array with binary search", "C) Trie", "D) Balanced BST"], correctAnswer: "C", explanation: "**Correct: C) Trie.** A trie navigates to the 'pre' node in O(3) steps, then collects all words in the subtree. A HashMap would require checking every key. A sorted array could use binary search to find the range, but collecting results is less natural. A trie is purpose-built for prefix queries." },
    { question: "What is the time complexity of inserting n words of average length m into a trie?", format: "mcq", difficulty: 2, bloomLabel: "Apply", options: ["A) O(n)", "B) O(n * m)", "C) O(n * m * log n)", "D) O(n^2)"], correctAnswer: "B", explanation: "**Correct: B) O(n * m).** Each word insertion takes O(m) time (one operation per character). Inserting n words: n * O(m) = O(n * m). This is the same as inserting n words into a hash set, but the trie additionally supports prefix queries." },
    { question: "How do you efficiently count the number of words starting with a given prefix in a trie?", format: "mcq", difficulty: 3, bloomLabel: "Apply", options: ["A) DFS from the prefix node and count end-of-word markers", "B) Store a prefixCount at each node, incremented during insertion", "C) Use binary search on a sorted word list", "D) Both A and B work, but B is O(m) vs A's O(m + k)"], correctAnswer: "D", explanation: "**Correct: D).** Method A (DFS) works but takes O(m + k) where k is the subtree size. Method B (prefixCount) answers in O(m) by reading the count at the prefix node. Both are valid, but B is the optimized approach — this distinction is what interviewers look for." },
    { question: "When implementing a trie in an interview, which approach is typically preferred for the children map?", format: "mcq", difficulty: 2, bloomLabel: "Evaluate", options: ["A) Always use TrieNode[26] array", "B) Always use HashMap<Character, TrieNode>", "C) Array for fixed small alphabets (a-z), HashMap for large/variable alphabets", "D) Use a linked list of children"], correctAnswer: "C", explanation: "**Correct: C).** Array-based children (TrieNode[26]) give O(1) lookup and are simpler for interviews when the alphabet is lowercase English. HashMap is preferred when the alphabet is large (Unicode), sparse, or variable. State this trade-off explicitly in interviews." },
    { question: "What problem does the trie solve in the context of IP routing?", format: "mcq", difficulty: 3, bloomLabel: "Understand", options: ["A) Shortest path routing", "B) Longest prefix matching for CIDR blocks", "C) DNS resolution", "D) Load balancing"], correctAnswer: "B", explanation: "**Correct: B) Longest prefix matching.** IP routing tables use compressed (radix) tries to match destination IP addresses to the longest matching CIDR prefix. For example, 192.168.1.0/24 is more specific than 192.168.0.0/16, and the longest match wins." },
    { question: "In a trie, deleting the word 'ant' when 'ante' also exists should:", format: "mcq", difficulty: 3, bloomLabel: "Apply", options: ["A) Remove all nodes for 'ant'", "B) Only unmark the end-of-word flag at the 't' node", "C) Remove the 't' node and all its children", "D) Throw an error because 'ante' depends on 'ant'"], correctAnswer: "B", explanation: "**Correct: B).** Since 'ante' shares the prefix 'ant', we cannot delete any nodes — they are still needed for 'ante'. We only set isEndOfWord=false at the 't' node. The recursive delete helper checks whether a node has children before removing it." },
    { question: "What is the key insight behind using a trie for Word Search II (LeetCode #212) instead of searching each word individually?", format: "mcq", difficulty: 4, bloomLabel: "Evaluate", options: ["A) The trie uses less memory than storing all words in a set", "B) One DFS pass searches all words simultaneously via shared prefixes", "C) The trie automatically handles duplicate words", "D) The trie sorts words lexicographically"], correctAnswer: "B", explanation: "**Correct: B).** Without a trie, you'd run a separate DFS for each word — O(words * m * n * 4^L). With a trie, a single DFS from each cell explores all words at once because shared prefixes are traversed only once. The trie effectively prunes impossible paths early." },
    { question: "Given ['flower', 'flow', 'flight'], what is the longest common prefix found using a trie?", format: "mcq", difficulty: 2, bloomLabel: "Apply", options: ["A) 'f'", "B) 'fl'", "C) 'flo'", "D) 'flow'"], correctAnswer: "B", explanation: "**Correct: B) 'fl'.** In the trie, root -> f -> l is the shared path. At 'l', there are two children: 'o' (for flow/flower) and 'i' (for flight). Since there are multiple children, the common prefix ends at 'fl'." },
    { question: "How does a trie help solve the 'Palindrome Pairs' problem (LeetCode #336)?", format: "mcq", difficulty: 5, bloomLabel: "Create", options: ["A) Store reversed words in a trie, then for each word check if any suffix's reverse exists", "B) Store words sorted by length and use binary search", "C) Use two tries — one for prefixes and one for suffixes", "D) Store words in a trie and check palindrome property during DFS"], correctAnswer: "A", explanation: "**Correct: A).** Insert the reverse of each word into a trie. For each word, traverse the trie character by character. At each node, check if the remaining suffix of the current word is a palindrome — if so, and the trie node is end-of-word, we found a palindrome pair. This reduces the brute-force O(n^2 * m) to O(n * m^2)." },
    { question: "What is the maximum number of nodes in a trie storing n words of length exactly m over alphabet size A?", format: "mcq", difficulty: 4, bloomLabel: "Analyze", options: ["A) n * m", "B) A^m", "C) min(n * m, A^m) + 1", "D) n * m * A"], correctAnswer: "C", explanation: "**Correct: C) min(n * m, A^m) + 1.** The trie has at most n * m nodes (if no prefixes are shared) but also cannot exceed A^m + 1 total possible nodes (the complete trie of depth m). The +1 accounts for the root. In practice, shared prefixes make the actual count much smaller." },
  ];

  const cheatSheet = `# Trie (Prefix Tree) Cheat Sheet

## 1. Core Structure
- **Node**: children map/array + isEndOfWord flag
- **Root**: empty node, all words start from root
- **Edge**: represents a single character
- Common prefixes share the same path

## 2. Operations & Complexity

| Operation | Time | Space |
|-----------|------|-------|
| Insert | O(m) | O(m) |
| Search | O(m) | O(1) |
| StartsWith | O(m) | O(1) |
| Delete | O(m) | O(1) |
| Prefix count (optimized) | O(m) | O(1) |

m = word/prefix length

## 3. Basic Trie — Java
\`\`\`java
class TrieNode {
    TrieNode[] children = new TrieNode[26];
    boolean isEndOfWord = false;
}

class Trie {
    TrieNode root = new TrieNode();

    void insert(String word) {
        TrieNode node = root;
        for (char c : word.toCharArray()) {
            int i = c - 'a';
            if (node.children[i] == null) node.children[i] = new TrieNode();
            node = node.children[i];
        }
        node.isEndOfWord = true;
    }

    boolean search(String word) {
        TrieNode n = find(word);
        return n != null && n.isEndOfWord;
    }

    boolean startsWith(String prefix) {
        return find(prefix) != null;
    }

    private TrieNode find(String s) {
        TrieNode node = root;
        for (char c : s.toCharArray()) {
            int i = c - 'a';
            if (node.children[i] == null) return null;
            node = node.children[i];
        }
        return node;
    }
}
\`\`\`

## 4. Basic Trie — Python
\`\`\`python
class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for c in word:
            if c not in node.children:
                node.children[c] = TrieNode()
            node = node.children[c]
        node.is_end = True

    def search(self, word):
        n = self._find(word)
        return n is not None and n.is_end

    def starts_with(self, prefix):
        return self._find(prefix) is not None

    def _find(self, s):
        node = self.root
        for c in s:
            if c not in node.children:
                return None
            node = node.children[c]
        return node
\`\`\`

## 5. Pattern Recognition

| Signal | Use |
|--------|-----|
| "prefix", "starts with" | Basic trie |
| "autocomplete", "top k" | Trie + heap |
| "wildcard ." | Trie + DFS |
| "word search board" | Trie + backtracking |
| "maximum XOR" | Binary trie |
| "longest common prefix" | Trie walk |

## 6. Key LeetCode Problems
- #208 Implement Trie (Medium)
- #211 Add and Search Word (Medium)
- #212 Word Search II (Hard)
- #642 Design Search Autocomplete (Hard)
- #421 Maximum XOR of Two Numbers (Medium)
- #14 Longest Common Prefix (Easy)
- #1804 Implement Trie II (Medium)

## 7. Gotchas
- Array[26] = fast but wasteful; HashMap = flexible but slower
- Delete must check shared prefixes before removing nodes
- Wildcard '.' = try all children (exponential worst case)
- Compressed trie = edge labels, not single chars
- Binary trie: traverse MSB to LSB for greedy XOR`;

  return {
    topic: "Trie (Prefix Tree)",
    category: "Data Structures & Algorithms",
    cheatSheet,
    resources: [
      { title: "Grokking the Coding Interview", author: "Design Gurus", category: "courses", justification: "Pattern-based approach covers trie problems", bestFor: "Beginner-Intermediate", estimatedTime: "4 hours", cost: "Paid", confidence: "HIGH" },
      { title: "NeetCode Trie Playlist", author: "NeetCode", category: "youtube", justification: "Visual explanations of all key trie problems", bestFor: "Visual learners", estimatedTime: "3 hours", cost: "Free", confidence: "HIGH" },
      { title: "Algorithm Design Manual", author: "Steven Skiena", category: "books", justification: "Covers tries in context of string algorithms", bestFor: "Deep understanding", estimatedTime: "2 hours", cost: "Paid", confidence: "HIGH" },
      { title: "LeetCode Trie Tag", author: "LeetCode", category: "interactive", justification: "All trie-tagged problems for practice", bestFor: "Practice", estimatedTime: "20+ hours", cost: "Freemium", confidence: "HIGH", url: "https://leetcode.com/tag/trie/" },
    ],
    ladder: {
      levels: [
        { level: 1, name: "Novice", dreyfusLabel: "Novice", description: "Can explain what a trie is and draw one by hand", observableSkills: ["Draw a trie for given words", "Explain trie vs HashMap"], milestoneProject: { title: "Implement Basic Trie", description: "Build insert, search, startsWith from scratch", estimatedHours: 2 }, commonPlateaus: ["Confusing trie nodes with tree nodes"], estimatedHours: 4, prerequisites: [] },
        { level: 2, name: "Advanced Beginner", dreyfusLabel: "Advanced Beginner", description: "Can implement core trie operations and handle edge cases", observableSkills: ["Implement insert/search/delete", "Handle shared prefix deletion"], milestoneProject: { title: "Solve 5 Easy/Medium Trie Problems", description: "LC #208, #211, #14, #1804, #720", estimatedHours: 5 }, commonPlateaus: ["Forgetting to mark end-of-word", "Not handling delete with shared prefixes"], estimatedHours: 8, prerequisites: ["Basic tree traversal"] },
        { level: 3, name: "Competent", dreyfusLabel: "Competent", description: "Can solve medium trie problems combining with DFS/BFS", observableSkills: ["Wildcard matching", "Prefix counting", "Autocomplete design"], milestoneProject: { title: "Build Autocomplete System", description: "Implement LeetCode #642 with top-k results", estimatedHours: 4 }, commonPlateaus: ["Struggling with DFS + trie combination"], estimatedHours: 12, prerequisites: ["DFS/BFS", "Priority queues"] },
        { level: 4, name: "Proficient", dreyfusLabel: "Proficient", description: "Can solve hard trie problems and optimize with pruning", observableSkills: ["Word Search II with pruning", "Binary trie for XOR", "Compressed trie"], milestoneProject: { title: "Solve Word Search II Optimally", description: "LC #212 with trie pruning under 100ms", estimatedHours: 3 }, commonPlateaus: ["Missing the pruning optimization", "Binary trie bit ordering"], estimatedHours: 15, prerequisites: ["Backtracking", "Bit manipulation basics"] },
        { level: 5, name: "Expert", dreyfusLabel: "Expert", description: "Can design trie-based systems and solve any trie interview problem", observableSkills: ["Design scalable autocomplete", "Palindrome pairs", "System design with tries"], milestoneProject: { title: "Design Search Engine Autocomplete", description: "Full system design: distributed trie, caching, ranking", estimatedHours: 5 }, commonPlateaus: ["Scaling tries for production systems"], estimatedHours: 20, prerequisites: ["System design basics", "Distributed systems"] },
      ],
    },
    plan: {
      overview: "Master tries from basics to interview-ready in 8 sessions. Covers the data structure, core operations, prefix queries, autocomplete, word search, wildcards, compressed tries, and interview patterns.",
      skippedTopics: "Suffix tries/trees, Aho-Corasick multi-pattern matching, ternary search tries",
      sessions,
    },
    quizBank,
    interviewTips: "Start by confirming the alphabet size. Mention trie vs HashMap trade-offs. For Hard problems, always mention trie pruning. In system design, discuss distributed tries and caching.",
    commonMistakes: "Forgetting isEndOfWord flag. Not handling delete with shared prefixes. Using array[26] when alphabet includes special chars. Not pruning in Word Search II.",
    patterns: "Prefix matching, wildcard DFS, backtracking on board, binary trie for XOR, top-k with pre-computed lists",
  };
}

// ── Bit Manipulation ────────────────────────────────────────────────────────

function buildBitManipulationTopic() {
  const sessions = [
    {
      sessionNumber: 1,
      title: "Binary Representation & Number Systems",
      content: `### Binary Number System

Every integer in a computer is stored as a sequence of bits (binary digits: 0 and 1). Understanding binary is the foundation of all bit manipulation.

### Decimal to Binary Conversion

Repeatedly divide by 2, collect remainders in reverse:
- 13 in binary: 13/2=6r1, 6/2=3r0, 3/2=1r1, 1/2=0r1 → **1101**

### Two's Complement (Signed Integers)

Most languages use two's complement for negative numbers:
- Positive: normal binary (e.g., 5 = 0000...0101)
- Negative: invert all bits + add 1 (e.g., -5: invert 0101 → 1010, +1 → 1011)

In 32-bit integers:
- Range: -2^31 to 2^31 - 1 (i.e., -2,147,483,648 to 2,147,483,647)
- MSB (bit 31) is the sign bit: 0 = positive, 1 = negative

\`\`\`mermaid
graph LR
    subgraph "8-bit Two's Complement"
    A["5 = 00000101"]
    B["Invert → 11111010"]
    C["Add 1 → 11111011 = -5"]
    A --> B --> C
    end
\`\`\`

### Bit Positions

Bits are numbered from right (LSB = bit 0) to left (MSB = bit 31 for 32-bit int).

| Bit Position | Value |
|:---:|:---:|
| 0 | 2^0 = 1 |
| 1 | 2^1 = 2 |
| 2 | 2^2 = 4 |
| 3 | 2^3 = 8 |
| k | 2^k |

### Java Binary Utilities

**Java:**
\`\`\`java
public class BinaryBasics {
    public static void main(String[] args) {
        int n = 42;

        // Convert to binary string
        System.out.println(Integer.toBinaryString(n));  // "101010"

        // Parse binary string to int
        int parsed = Integer.parseInt("101010", 2);     // 42

        // Number of 1-bits
        System.out.println(Integer.bitCount(n));         // 3

        // Highest/lowest set bit position
        System.out.println(Integer.highestOneBit(n));    // 32
        System.out.println(Integer.lowestOneBit(n));     // 2

        // Leading/trailing zeros
        System.out.println(Integer.numberOfLeadingZeros(n));  // 26
        System.out.println(Integer.numberOfTrailingZeros(n)); // 1
    }
}
\`\`\`

**Python:**
\`\`\`python
n = 42

# Convert to binary string
print(bin(n))         # '0b101010'
print(f"{n:032b}")    # '00000000000000000000000000101010'

# Parse binary string
parsed = int("101010", 2)  # 42

# Count 1-bits
print(bin(n).count('1'))   # 3

# Bit length (position of highest set bit + 1)
print(n.bit_length())      # 6

# Python integers have arbitrary precision — no overflow!
big = 2 ** 100
print(big.bit_length())   # 101
\`\`\`

### Key Difference: Java vs Python
- **Java**: 32-bit int, 64-bit long. Overflow wraps around silently.
- **Python**: Arbitrary precision integers. No overflow. Negative numbers use a conceptual infinite-width two's complement.

### Why Bit Manipulation Matters in Interviews
1. O(1) operations that replace O(n) loops (check odd/even, swap, power of 2)
2. Space optimization (use bits instead of boolean arrays)
3. Elegant solutions to specific problem types (single number, subsets, masks)`,
      objectives: [
        "Convert between decimal and binary representations",
        "Understand two's complement for signed integers",
        "Use built-in binary utility methods in Java and Python",
      ],
      activities: [
        { description: "Convert 10 numbers (including negatives) between decimal and binary by hand", durationMinutes: 15 },
        { description: "Write a function that prints the 32-bit binary representation of any integer", durationMinutes: 15 },
      ],
      reviewQuestions: [
        "How is -1 represented in 32-bit two's complement?:::All 32 bits are 1 (11111111...1). Inverting 1 (00...01) gives 11...10, adding 1 gives 11...11.",
        "Why does Python not have integer overflow but Java does?:::Python integers have arbitrary precision — they grow as needed. Java int is fixed at 32 bits, so values wrap around on overflow.",
      ],
      successCriteria: "Can convert between decimal and binary, explain two's complement, and use language-specific binary utilities.",
      paretoJustification: "Binary representation is the prerequisite for all bit manipulation — you cannot manipulate bits you don't understand.",
      resources: [
        { title: "CS50 Binary", type: "youtube", url: "https://www.youtube.com/watch?v=1GSjbWt0c9M" },
      ],
    },
    {
      sessionNumber: 2,
      title: "Bitwise Operators",
      content: `### The Six Bitwise Operators

These operate on individual bits of integers:

| Operator | Symbol | Java | Python | Description |
|----------|--------|------|--------|-------------|
| AND | & | a & b | a & b | 1 only if both bits are 1 |
| OR | \\| | a \\| b | a \\| b | 1 if either bit is 1 |
| XOR | ^ | a ^ b | a ^ b | 1 if bits are different |
| NOT | ~ | ~a | ~a | Flips all bits |
| Left Shift | << | a << n | a << n | Shift left by n (multiply by 2^n) |
| Right Shift | >> | a >> n | a >> n | Shift right by n (divide by 2^n) |

### Truth Tables

\`\`\`
AND (&)    OR (|)     XOR (^)    NOT (~)
0 & 0 = 0  0 | 0 = 0  0 ^ 0 = 0  ~0 = 1
0 & 1 = 0  0 | 1 = 1  0 ^ 1 = 1  ~1 = 0
1 & 0 = 0  1 | 0 = 1  1 ^ 0 = 1
1 & 1 = 1  1 | 1 = 1  1 ^ 1 = 0
\`\`\`

### Shift Operators Visualized

\`\`\`mermaid
graph LR
    subgraph "Left Shift: 5 << 2"
    A["00000101 (5)"] --> B["00010100 (20)"]
    end
    subgraph "Right Shift: 20 >> 2"
    C["00010100 (20)"] --> D["00000101 (5)"]
    end
\`\`\`

- Left shift by n = multiply by 2^n
- Right shift by n = integer divide by 2^n
- Java has >>> (unsigned right shift) — fills with 0s regardless of sign

### Operator Precedence Gotcha

**Critical:** Bitwise operators have LOWER precedence than comparison operators in both Java and Python!

\`\`\`java
// WRONG: (n & 1 == 0) is parsed as (n & (1 == 0)) = (n & 0) = 0
// RIGHT: ((n & 1) == 0)
if ((n & 1) == 0) {
    System.out.println("even");
}
\`\`\`

### Essential Operations Reference

**Java:**
\`\`\`java
public class BitwiseOps {
    public static void main(String[] args) {
        // AND: mask / check specific bits
        System.out.println(12 & 10);   // 1100 & 1010 = 1000 = 8

        // OR: set specific bits
        System.out.println(12 | 10);   // 1100 | 1010 = 1110 = 14

        // XOR: toggle bits / find differences
        System.out.println(12 ^ 10);   // 1100 ^ 1010 = 0110 = 6

        // NOT: flip all bits (~n = -(n+1) in two's complement)
        System.out.println(~5);        // -6

        // Left shift: multiply by 2^n
        System.out.println(3 << 4);    // 3 * 16 = 48

        // Right shift: divide by 2^n (arithmetic, preserves sign)
        System.out.println(-16 >> 2);  // -4

        // Unsigned right shift (Java only)
        System.out.println(-1 >>> 1);  // 2147483647 (Integer.MAX_VALUE)
    }
}
\`\`\`

**Python:**
\`\`\`python
# AND: mask / check specific bits
print(12 & 10)   # 1100 & 1010 = 1000 = 8

# OR: set specific bits
print(12 | 10)   # 1100 | 1010 = 1110 = 14

# XOR: toggle bits / find differences
print(12 ^ 10)   # 1100 ^ 1010 = 0110 = 6

# NOT: flip all bits (~n = -(n+1))
print(~5)         # -6

# Left shift: multiply by 2^n
print(3 << 4)     # 48

# Right shift: divide by 2^n
print(-16 >> 2)   # -4 (arithmetic right shift)

# Python has no unsigned right shift operator
# To simulate: mask with 0xFFFFFFFF for 32-bit unsigned
print((-1 & 0xFFFFFFFF) >> 1)  # 2147483647
\`\`\`

### Key Properties of XOR
1. **Self-inverse:** a ^ a = 0
2. **Identity:** a ^ 0 = a
3. **Commutative:** a ^ b = b ^ a
4. **Associative:** (a ^ b) ^ c = a ^ (b ^ c)

These properties make XOR the star of bit manipulation interviews.`,
      objectives: [
        "Master all six bitwise operators and their truth tables",
        "Understand operator precedence pitfalls",
        "Know the key properties of XOR",
      ],
      activities: [
        { description: "Compute by hand: 25 & 15, 25 | 15, 25 ^ 15, ~25, 25 << 2, 25 >> 2", durationMinutes: 15 },
        { description: "Write unit tests verifying XOR properties: self-inverse, identity, commutativity, associativity", durationMinutes: 20 },
      ],
      reviewQuestions: [
        "What is the result of n ^ n for any integer n?:::Always 0. XOR of identical values cancels out (self-inverse property).",
        "Why must you use parentheses in (n & 1) == 0?:::Bitwise & has lower precedence than ==. Without parentheses, 1 == 0 evaluates first to false/0, then n & 0 = 0 always.",
      ],
      successCriteria: "Can compute bitwise operations by hand and explain XOR properties.",
      paretoJustification: "The six operators and XOR properties are used in every bit manipulation problem — they are the alphabet of this topic.",
      resources: [
        { title: "Bit Manipulation — HackerEarth Tutorial", type: "interactive", url: "https://www.hackerearth.com/practice/notes/bit-manipulation/" },
      ],
    },
    {
      sessionNumber: 3,
      title: "Common Bit Tricks",
      content: `### Essential Bit Manipulation Tricks

These are the building blocks for interview problems. Memorize them.

### 1. Check if Odd or Even
\`n & 1\` — returns 1 if odd, 0 if even. Faster than \`n % 2\`.

### 2. Check if Power of 2
\`n > 0 && (n & (n - 1)) == 0\`
Why? A power of 2 has exactly one set bit: 1000...0. Subtracting 1 gives 0111...1. AND gives 0.

### 3. Count Set Bits (Brian Kernighan's Algorithm)
Each \`n = n & (n - 1)\` clears the lowest set bit. Count iterations until n = 0.

### 4. Get/Set/Clear/Toggle a Bit
- **Get bit i:** \`(n >> i) & 1\`
- **Set bit i:** \`n | (1 << i)\`
- **Clear bit i:** \`n & ~(1 << i)\`
- **Toggle bit i:** \`n ^ (1 << i)\`

### 5. Isolate Lowest Set Bit
\`n & (-n)\` — extracts the rightmost 1-bit.

### 6. Clear Lowest Set Bit
\`n & (n - 1)\` — removes the rightmost 1-bit.

### 7. Swap Without Temp Variable
\`\`\`
a ^= b;
b ^= a;
a ^= b;
\`\`\`

\`\`\`mermaid
graph TD
    subgraph "n & (n-1): Clear Lowest Set Bit"
    A["n = 12 = 1100"] --> B["n-1 = 11 = 1011"]
    B --> C["n & (n-1) = 1000 = 8"]
    end
    subgraph "n & (-n): Isolate Lowest Set Bit"
    D["n = 12 = 1100"] --> E["-n = ...0100"]
    E --> F["n & (-n) = 0100 = 4"]
    end
\`\`\`

### Complete Reference Implementation

**Java:**
\`\`\`java
public class BitTricks {
    // Check odd/even — O(1)
    public static boolean isOdd(int n) {
        return (n & 1) == 1;
    }

    // Check power of 2 — O(1)
    public static boolean isPowerOfTwo(int n) {
        return n > 0 && (n & (n - 1)) == 0;
    }

    // Count set bits (Brian Kernighan) — O(k) where k = number of set bits
    public static int countSetBits(int n) {
        int count = 0;
        while (n != 0) {
            n &= (n - 1); // clear lowest set bit
            count++;
        }
        return count;
    }

    // Get bit at position i — O(1)
    public static int getBit(int n, int i) {
        return (n >> i) & 1;
    }

    // Set bit at position i — O(1)
    public static int setBit(int n, int i) {
        return n | (1 << i);
    }

    // Clear bit at position i — O(1)
    public static int clearBit(int n, int i) {
        return n & ~(1 << i);
    }

    // Toggle bit at position i — O(1)
    public static int toggleBit(int n, int i) {
        return n ^ (1 << i);
    }

    // Swap without temp — O(1)
    public static void swap(int[] arr, int i, int j) {
        if (i != j) { // important: XOR swap fails if same index!
            arr[i] ^= arr[j];
            arr[j] ^= arr[i];
            arr[i] ^= arr[j];
        }
    }

    // Isolate lowest set bit — O(1)
    public static int lowestSetBit(int n) {
        return n & (-n);
    }

    // Clear lowest set bit — O(1)
    public static int clearLowestSetBit(int n) {
        return n & (n - 1);
    }
}
\`\`\`

**Python:**
\`\`\`python
def is_odd(n: int) -> bool:
    """Check odd/even — O(1)."""
    return (n & 1) == 1

def is_power_of_two(n: int) -> bool:
    """Check power of 2 — O(1)."""
    return n > 0 and (n & (n - 1)) == 0

def count_set_bits(n: int) -> int:
    """Count set bits (Brian Kernighan) — O(k) where k = set bits."""
    count = 0
    while n:
        n &= (n - 1)
        count += 1
    return count

def get_bit(n: int, i: int) -> int:
    """Get bit at position i — O(1)."""
    return (n >> i) & 1

def set_bit(n: int, i: int) -> int:
    """Set bit at position i — O(1)."""
    return n | (1 << i)

def clear_bit(n: int, i: int) -> int:
    """Clear bit at position i — O(1)."""
    return n & ~(1 << i)

def toggle_bit(n: int, i: int) -> int:
    """Toggle bit at position i — O(1)."""
    return n ^ (1 << i)

def lowest_set_bit(n: int) -> int:
    """Isolate lowest set bit — O(1)."""
    return n & (-n)

def clear_lowest_set_bit(n: int) -> int:
    """Clear lowest set bit — O(1)."""
    return n & (n - 1)
\`\`\`

### Trick Summary Table

| Trick | Expression | Time |
|-------|-----------|------|
| Is odd? | n & 1 | O(1) |
| Is power of 2? | n > 0 && (n & (n-1)) == 0 | O(1) |
| Count set bits | while(n) { n &= n-1; count++; } | O(k) |
| Get bit i | (n >> i) & 1 | O(1) |
| Set bit i | n \\| (1 << i) | O(1) |
| Clear bit i | n & ~(1 << i) | O(1) |
| Toggle bit i | n ^ (1 << i) | O(1) |
| Lowest set bit | n & (-n) | O(1) |
| Clear lowest bit | n & (n-1) | O(1) |
| Swap a,b | a^=b; b^=a; a^=b | O(1) |`,
      objectives: [
        "Memorize the 10 essential bit manipulation tricks",
        "Implement each trick and understand WHY it works",
        "Apply tricks to solve basic interview problems",
      ],
      activities: [
        { description: "Implement all 10 tricks from memory in both Java and Python", durationMinutes: 25 },
        { description: "Solve LeetCode #191 (Number of 1 Bits) and #231 (Power of Two)", durationMinutes: 20 },
      ],
      reviewQuestions: [
        "Why does n & (n-1) clear the lowest set bit?:::Subtracting 1 flips the lowest set bit to 0 and all lower bits to 1. ANDing with n keeps all higher bits unchanged while clearing the lowest set bit and the bits below it.",
        "When does XOR swap fail?:::When both variables reference the same memory location (same array index). a ^= a gives 0, losing the value.",
      ],
      successCriteria: "Can write all 10 tricks from memory and explain the math behind each one.",
      paretoJustification: "These 10 tricks cover 80% of bit manipulation interview questions — they are the most reusable patterns.",
      resources: [
        { title: "LeetCode #191 — Number of 1 Bits", type: "practice", url: "https://leetcode.com/problems/number-of-1-bits/" },
        { title: "LeetCode #231 — Power of Two", type: "practice", url: "https://leetcode.com/problems/power-of-two/" },
      ],
    },
    {
      sessionNumber: 4,
      title: "Single Number Problems (XOR Patterns)",
      content: `### The XOR Family of Problems

XOR's self-cancellation property (a ^ a = 0) makes it perfect for "find the unique element" problems.

### Single Number I — LeetCode #136

**Problem:** Every element appears twice except one. Find the single one.

**Solution:** XOR all elements. Pairs cancel out, leaving the unique element.

**Java:**
\`\`\`java
// Time: O(n), Space: O(1) — LeetCode #136
public int singleNumber(int[] nums) {
    int result = 0;
    for (int num : nums) {
        result ^= num;
    }
    return result;
}
\`\`\`

**Python:**
\`\`\`python
# Time: O(n), Space: O(1) — LeetCode #136
def singleNumber(nums: list[int]) -> int:
    result = 0
    for num in nums:
        result ^= num
    return result

# Or using reduce:
from functools import reduce
def singleNumber(nums):
    return reduce(lambda a, b: a ^ b, nums)
\`\`\`

### Single Number II — LeetCode #137

**Problem:** Every element appears three times except one. Find the single one.

**Solution:** Count bits at each position modulo 3.

**Java:**
\`\`\`java
// Time: O(32n) = O(n), Space: O(1) — LeetCode #137
public int singleNumber(int[] nums) {
    int result = 0;
    for (int i = 0; i < 32; i++) {
        int bitSum = 0;
        for (int num : nums) {
            bitSum += (num >> i) & 1;
        }
        if (bitSum % 3 != 0) {
            result |= (1 << i);
        }
    }
    return result;
}
\`\`\`

**Python:**
\`\`\`python
# Time: O(32n) = O(n), Space: O(1) — LeetCode #137
def singleNumber(nums: list[int]) -> int:
    result = 0
    for i in range(32):
        bit_sum = sum((num >> i) & 1 for num in nums)
        if bit_sum % 3:
            result |= (1 << i)
    # Handle negative numbers in Python (arbitrary precision)
    if result >= 2**31:
        result -= 2**32
    return result
\`\`\`

### Single Number III — LeetCode #260

**Problem:** Exactly TWO elements appear once; all others appear twice. Find both.

**Key Insight:** XOR all elements → you get a ^ b (the XOR of the two unique numbers). Find any set bit in a ^ b — this bit differs between a and b. Use it to partition all numbers into two groups, then XOR each group separately.

\`\`\`mermaid
graph TD
    A["XOR all: result = a ^ b"] --> B["Find diff bit: bit = result & (-result)"]
    B --> C["Partition by diff bit"]
    C --> D["Group 1: bit set → XOR = a"]
    C --> E["Group 0: bit unset → XOR = b"]
\`\`\`

**Java:**
\`\`\`java
// Time: O(n), Space: O(1) — LeetCode #260
public int[] singleNumber(int[] nums) {
    // Step 1: XOR all → a ^ b
    int xor = 0;
    for (int num : nums) xor ^= num;

    // Step 2: Find a bit where a and b differ
    int diffBit = xor & (-xor); // lowest set bit

    // Step 3: Partition and XOR each group
    int a = 0, b = 0;
    for (int num : nums) {
        if ((num & diffBit) != 0) {
            a ^= num;
        } else {
            b ^= num;
        }
    }
    return new int[]{a, b};
}
\`\`\`

**Python:**
\`\`\`python
# Time: O(n), Space: O(1) — LeetCode #260
def singleNumber(nums: list[int]) -> list[int]:
    # Step 1: XOR all → a ^ b
    xor = 0
    for num in nums:
        xor ^= num

    # Step 2: Find a bit where a and b differ
    diff_bit = xor & (-xor)

    # Step 3: Partition and XOR each group
    a, b = 0, 0
    for num in nums:
        if num & diff_bit:
            a ^= num
        else:
            b ^= num
    return [a, b]
\`\`\`

### Pattern Summary

| Problem | Key Technique | Time | Space |
|---------|---------------|------|-------|
| All appear 2x except one | XOR all | O(n) | O(1) |
| All appear 3x except one | Bit count mod 3 | O(n) | O(1) |
| Two unique, rest appear 2x | XOR + partition by diff bit | O(n) | O(1) |

### Interview Tip
When you see "find the element that appears once / odd number of times", immediately think XOR. Mention the O(1) space advantage over HashMap.`,
      objectives: [
        "Solve all three Single Number variants using bit manipulation",
        "Understand the XOR partitioning technique for two unique elements",
        "Apply bit counting for mod-k problems",
      ],
      activities: [
        { description: "Solve LeetCode #136, #137, #260 in sequence, each in under 10 minutes", durationMinutes: 30 },
        { description: "Generalize: what if every element appears k times except one? Write a generic solution", durationMinutes: 20 },
      ],
      reviewQuestions: [
        "Why does XOR work for finding the single number when all others appear twice?:::XOR is self-inverse (a ^ a = 0) and has identity (a ^ 0 = a). Pairs cancel out, leaving only the unique element.",
        "In Single Number III, why do we partition by a differing bit?:::The bit where a ^ b is 1 means a and b differ at that position. Partitioning by this bit puts a and b in different groups while keeping all pairs together (same bit value = same group).",
      ],
      successCriteria: "Can solve all three Single Number problems from memory in O(n) time, O(1) space.",
      paretoJustification: "The Single Number family is the most frequently asked bit manipulation problem series — they test XOR fluency.",
      resources: [
        { title: "LeetCode #136 — Single Number", type: "practice", url: "https://leetcode.com/problems/single-number/" },
        { title: "LeetCode #260 — Single Number III", type: "practice", url: "https://leetcode.com/problems/single-number-iii/" },
      ],
    },
    {
      sessionNumber: 5,
      title: "Power of 2 & Counting Problems",
      content: `### Power of 2 — LeetCode #231

**Java:**
\`\`\`java
// O(1) time, O(1) space
public boolean isPowerOfTwo(int n) {
    return n > 0 && (n & (n - 1)) == 0;
}
\`\`\`

**Python:**
\`\`\`python
def isPowerOfTwo(n: int) -> bool:
    return n > 0 and (n & (n - 1)) == 0
\`\`\`

### Counting Bits — LeetCode #338

**Problem:** For each number 0 to n, count the number of 1-bits.

**Key Insight:** \`countBits[i] = countBits[i & (i-1)] + 1\` — clearing the lowest set bit reduces to an already-solved subproblem.

**Java:**
\`\`\`java
// O(n) time, O(n) space — LeetCode #338
public int[] countBits(int n) {
    int[] dp = new int[n + 1];
    for (int i = 1; i <= n; i++) {
        dp[i] = dp[i & (i - 1)] + 1;  // clear lowest set bit
    }
    return dp;
}
\`\`\`

**Python:**
\`\`\`python
# O(n) time, O(n) space — LeetCode #338
def countBits(n: int) -> list[int]:
    dp = [0] * (n + 1)
    for i in range(1, n + 1):
        dp[i] = dp[i & (i - 1)] + 1
    return dp
\`\`\`

### Hamming Distance — LeetCode #461

**Problem:** Count the number of positions where corresponding bits differ.

**Solution:** XOR gives 1 at differing positions. Count the set bits of XOR.

**Java:**
\`\`\`java
// O(1) time — LeetCode #461
public int hammingDistance(int x, int y) {
    return Integer.bitCount(x ^ y);
}

// Manual implementation
public int hammingDistance(int x, int y) {
    int xor = x ^ y;
    int count = 0;
    while (xor != 0) {
        xor &= (xor - 1); // Brian Kernighan
        count++;
    }
    return count;
}
\`\`\`

**Python:**
\`\`\`python
# O(1) time — LeetCode #461
def hammingDistance(x: int, y: int) -> int:
    return bin(x ^ y).count('1')

# Manual
def hammingDistance(x, y):
    xor = x ^ y
    count = 0
    while xor:
        xor &= (xor - 1)
        count += 1
    return count
\`\`\`

### Reverse Bits — LeetCode #190

**Java:**
\`\`\`java
// O(1) time (32 iterations) — LeetCode #190
public int reverseBits(int n) {
    int result = 0;
    for (int i = 0; i < 32; i++) {
        result = (result << 1) | (n & 1);
        n >>= 1;
    }
    return result;
}
\`\`\`

**Python:**
\`\`\`python
# O(1) time — LeetCode #190
def reverseBits(n: int) -> int:
    result = 0
    for _ in range(32):
        result = (result << 1) | (n & 1)
        n >>= 1
    return result
\`\`\`

### Missing Number — LeetCode #268

**Problem:** Array of n distinct numbers from [0, n]. Find the missing one.

**Solution:** XOR all array elements with all indices 0..n. Pairs cancel, missing number remains.

**Java:**
\`\`\`java
// O(n) time, O(1) space — LeetCode #268
public int missingNumber(int[] nums) {
    int xor = nums.length; // start with n
    for (int i = 0; i < nums.length; i++) {
        xor ^= i ^ nums[i];
    }
    return xor;
}
\`\`\`

**Python:**
\`\`\`python
# O(n) time, O(1) space — LeetCode #268
def missingNumber(nums: list[int]) -> int:
    xor = len(nums)
    for i, num in enumerate(nums):
        xor ^= i ^ num
    return xor
\`\`\`

\`\`\`mermaid
graph LR
    subgraph "Missing Number via XOR"
    A["nums = [3, 0, 1]"] --> B["XOR with indices"]
    B --> C["3^0^1 ^ 0^1^2^3"]
    C --> D["= (3^3)^(0^0)^(1^1)^2"]
    D --> E["= 0^0^0^2 = 2"]
    end
\`\`\``,
      objectives: [
        "Solve power-of-2 and counting problems with bit manipulation",
        "Apply DP with bit operations for counting bits",
        "Use XOR for finding missing elements",
      ],
      activities: [
        { description: "Solve LeetCode #231, #338, #461, #190, #268 — all in one session", durationMinutes: 40 },
        { description: "Prove why countBits[i] = countBits[i & (i-1)] + 1 using examples", durationMinutes: 10 },
      ],
      reviewQuestions: [
        "Why is n & (n-1) == 0 sufficient to check power of 2 (given n > 0)?:::A power of 2 in binary has exactly one 1-bit (e.g., 1000). Subtracting 1 flips that bit and all lower bits (0111). ANDing gives 0. No other positive number has this property.",
        "How does the DP relation dp[i] = dp[i & (i-1)] + 1 work for counting bits?:::i & (i-1) clears the lowest set bit of i, giving a smaller number whose bit count is already computed. Since we cleared exactly one bit, dp[i] is one more than dp[i & (i-1)].",
      ],
      successCriteria: "Can solve all five problems using bit manipulation and explain the DP approach for counting bits.",
      paretoJustification: "These problems are the most commonly asked easy/medium bit manipulation questions in FAANG interviews.",
      resources: [
        { title: "LeetCode #338 — Counting Bits", type: "practice", url: "https://leetcode.com/problems/counting-bits/" },
      ],
    },
    {
      sessionNumber: 6,
      title: "Bit Masking & Subsets",
      content: `### Bit Masking

A **bitmask** is an integer whose binary representation encodes a set. Bit i is 1 if element i is in the set.

Example: For set {a, b, c, d}, mask 1010 represents {b, d}.

### Enumerate All Subsets

For a set of n elements, there are 2^n subsets. Each integer from 0 to 2^n - 1 represents one subset.

\`\`\`mermaid
graph TD
    subgraph "All subsets of {a, b, c}"
    S0["000 = {}"]
    S1["001 = {a}"]
    S2["010 = {b}"]
    S3["011 = {a,b}"]
    S4["100 = {c}"]
    S5["101 = {a,c}"]
    S6["110 = {b,c}"]
    S7["111 = {a,b,c}"]
    end
\`\`\`

**Java:**
\`\`\`java
// Generate all subsets — LeetCode #78 — O(2^n * n) time
public List<List<Integer>> subsets(int[] nums) {
    int n = nums.length;
    List<List<Integer>> result = new ArrayList<>();
    for (int mask = 0; mask < (1 << n); mask++) {
        List<Integer> subset = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            if ((mask & (1 << i)) != 0) {
                subset.add(nums[i]);
            }
        }
        result.add(subset);
    }
    return result;
}
\`\`\`

**Python:**
\`\`\`python
# Generate all subsets — LeetCode #78 — O(2^n * n) time
def subsets(nums: list[int]) -> list[list[int]]:
    n = len(nums)
    result = []
    for mask in range(1 << n):
        subset = [nums[i] for i in range(n) if mask & (1 << i)]
        result.append(subset)
    return result
\`\`\`

### Bitmask Operations for Sets

| Set Operation | Bit Operation |
|:---|:---|
| Add element i | mask \\| (1 << i) |
| Remove element i | mask & ~(1 << i) |
| Check element i | (mask >> i) & 1 |
| Union A \\| B | a \\| b |
| Intersection A & B | a & b |
| Difference A \\ B | a & ~b |
| Set size | popcount(mask) |
| Is subset? | (a & b) == a |
| Iterate subsets of mask | for s = mask; s > 0; s = (s-1) & mask |

### Bitmask DP: Travelling Salesman (TSP)

Bitmask DP is used when state involves subsets of items. Classic: TSP where dp[mask][i] = min cost to visit the set of cities in mask, ending at city i.

**Java:**
\`\`\`java
// TSP with bitmask DP — O(2^n * n^2) time, O(2^n * n) space
public int tsp(int[][] dist) {
    int n = dist.length;
    int[][] dp = new int[1 << n][n];
    for (int[] row : dp) Arrays.fill(row, Integer.MAX_VALUE);
    dp[1][0] = 0; // start at city 0

    for (int mask = 1; mask < (1 << n); mask++) {
        for (int u = 0; u < n; u++) {
            if (dp[mask][u] == Integer.MAX_VALUE) continue;
            if ((mask & (1 << u)) == 0) continue;
            for (int v = 0; v < n; v++) {
                if ((mask & (1 << v)) != 0) continue; // already visited
                int newMask = mask | (1 << v);
                dp[newMask][v] = Math.min(dp[newMask][v], dp[mask][u] + dist[u][v]);
            }
        }
    }

    // Find min cost to visit all cities and return to start
    int allVisited = (1 << n) - 1;
    int minCost = Integer.MAX_VALUE;
    for (int u = 1; u < n; u++) {
        if (dp[allVisited][u] != Integer.MAX_VALUE) {
            minCost = Math.min(minCost, dp[allVisited][u] + dist[u][0]);
        }
    }
    return minCost;
}
\`\`\`

**Python:**
\`\`\`python
# TSP with bitmask DP — O(2^n * n^2) time
def tsp(dist: list[list[int]]) -> int:
    n = len(dist)
    INF = float('inf')
    dp = [[INF] * n for _ in range(1 << n)]
    dp[1][0] = 0  # start at city 0

    for mask in range(1, 1 << n):
        for u in range(n):
            if dp[mask][u] == INF or not (mask & (1 << u)):
                continue
            for v in range(n):
                if mask & (1 << v):
                    continue
                new_mask = mask | (1 << v)
                dp[new_mask][v] = min(dp[new_mask][v], dp[mask][u] + dist[u][v])

    all_visited = (1 << n) - 1
    return min(dp[all_visited][u] + dist[u][0]
               for u in range(1, n)
               if dp[all_visited][u] != INF)
\`\`\`

### When to Use Bitmask DP
- n <= 20 (since 2^20 = ~1M states)
- State involves "which items have been selected/visited"
- Need to consider all subsets`,
      objectives: [
        "Use bitmasks to represent and manipulate sets",
        "Generate all subsets using bit enumeration",
        "Apply bitmask DP for subset-based optimization problems",
      ],
      activities: [
        { description: "Solve LeetCode #78 (Subsets) using bitmask approach", durationMinutes: 15 },
        { description: "Implement TSP with bitmask DP for a 5-city example and verify the result", durationMinutes: 35 },
      ],
      reviewQuestions: [
        "Why is bitmask DP limited to n <= ~20?:::The state space is O(2^n), which grows exponentially. At n=20, we have ~1 million states — manageable. At n=25, it's ~33 million, which may be too slow. At n=30, it's ~1 billion, infeasible.",
        "How do you enumerate all subsets of a given bitmask?:::Start with s = mask, then repeatedly compute s = (s - 1) & mask until s reaches 0. This generates all subsets in decreasing order.",
      ],
      successCriteria: "Can use bitmasks for set operations and implement bitmask DP.",
      paretoJustification: "Bitmask DP appears in competitive programming and advanced FAANG interviews (TSP, assignment problems, subset enumeration).",
      resources: [
        { title: "LeetCode #78 — Subsets", type: "practice", url: "https://leetcode.com/problems/subsets/" },
      ],
    },
    {
      sessionNumber: 7,
      title: "XOR Patterns & Advanced Tricks",
      content: `### Advanced XOR Problems

### Find the Duplicate Number — LeetCode #287 (Alternative Approach)

While Floyd's cycle detection is the classic O(1) space solution, XOR can solve variants where exactly one number is duplicated once.

### XOR of Numbers in Range

**Problem:** Find XOR of all numbers from 1 to n.

**Key Pattern:** XOR from 1 to n follows a cycle of 4:
- n % 4 == 0 → n
- n % 4 == 1 → 1
- n % 4 == 2 → n + 1
- n % 4 == 3 → 0

**Java:**
\`\`\`java
// XOR from 1 to n — O(1) time
public int xorRange(int n) {
    switch (n % 4) {
        case 0: return n;
        case 1: return 1;
        case 2: return n + 1;
        case 3: return 0;
    }
    return 0;
}

// XOR from l to r — O(1) time
public int xorRange(int l, int r) {
    return xorRange(r) ^ xorRange(l - 1);
}
\`\`\`

**Python:**
\`\`\`python
# XOR from 1 to n — O(1) time
def xor_range(n: int) -> int:
    return [n, 1, n + 1, 0][n % 4]

# XOR from l to r — O(1)
def xor_range_lr(l: int, r: int) -> int:
    return xor_range(r) ^ xor_range(l - 1)
\`\`\`

### Complement of Base 10 Integer — LeetCode #1009

**Problem:** Given a positive integer n, return its complement (flip all bits in its binary representation, excluding leading zeros).

**Java:**
\`\`\`java
// O(1) time — LeetCode #1009
public int bitwiseComplement(int n) {
    if (n == 0) return 1;
    int mask = Integer.highestOneBit(n);
    mask = (mask << 1) - 1; // all 1s up to highest bit
    return n ^ mask;
}
\`\`\`

**Python:**
\`\`\`python
# O(1) time — LeetCode #1009
def bitwiseComplement(n: int) -> int:
    if n == 0:
        return 1
    mask = (1 << n.bit_length()) - 1  # all 1s up to highest bit
    return n ^ mask
\`\`\`

### Decode XORed Array — LeetCode #1720

**Problem:** Given encoded[i] = arr[i] XOR arr[i+1] and first element, decode the array.

**Solution:** arr[i+1] = encoded[i] XOR arr[i] (XOR both sides of the equation by arr[i]).

**Java:**
\`\`\`java
public int[] decode(int[] encoded, int first) {
    int[] arr = new int[encoded.length + 1];
    arr[0] = first;
    for (int i = 0; i < encoded.length; i++) {
        arr[i + 1] = encoded[i] ^ arr[i];
    }
    return arr;
}
\`\`\`

**Python:**
\`\`\`python
def decode(encoded: list[int], first: int) -> list[int]:
    arr = [first]
    for e in encoded:
        arr.append(e ^ arr[-1])
    return arr
\`\`\`

### Gray Code — LeetCode #89

**Problem:** Generate the n-bit Gray code sequence where consecutive numbers differ by exactly one bit.

**Formula:** gray(i) = i ^ (i >> 1)

**Java:**
\`\`\`java
// O(2^n) time — LeetCode #89
public List<Integer> grayCode(int n) {
    List<Integer> result = new ArrayList<>();
    for (int i = 0; i < (1 << n); i++) {
        result.add(i ^ (i >> 1));
    }
    return result;
}
\`\`\`

**Python:**
\`\`\`python
# O(2^n) time — LeetCode #89
def grayCode(n: int) -> list[int]:
    return [i ^ (i >> 1) for i in range(1 << n)]
\`\`\`

### Total Hamming Distance — LeetCode #477

**Problem:** Sum of Hamming distances between all pairs.

**Key Insight:** For each bit position, count numbers with that bit set (c) and unset (n-c). Contribution = c * (n-c).

**Java:**
\`\`\`java
// O(32n) = O(n) time — LeetCode #477
public int totalHammingDistance(int[] nums) {
    int total = 0, n = nums.length;
    for (int bit = 0; bit < 32; bit++) {
        int ones = 0;
        for (int num : nums) {
            ones += (num >> bit) & 1;
        }
        total += ones * (n - ones);
    }
    return total;
}
\`\`\`

**Python:**
\`\`\`python
# O(32n) = O(n) time — LeetCode #477
def totalHammingDistance(nums: list[int]) -> int:
    total = 0
    n = len(nums)
    for bit in range(32):
        ones = sum((num >> bit) & 1 for num in nums)
        total += ones * (n - ones)
    return total
\`\`\`

### XOR Pattern Summary

| Pattern | Example | Key Insight |
|---------|---------|-------------|
| Self-cancellation | Single Number | a ^ a = 0 |
| Range XOR | XOR 1..n | 4-cycle pattern |
| Bit complement | LC #1009 | XOR with all-1s mask |
| Decode/Encode | LC #1720 | XOR is its own inverse |
| Gray Code | LC #89 | i ^ (i >> 1) |
| Distance counting | LC #477 | Per-bit contribution |`,
      objectives: [
        "Apply advanced XOR patterns beyond Single Number",
        "Use the 4-cycle pattern for range XOR",
        "Solve Gray Code and Hamming Distance problems",
      ],
      activities: [
        { description: "Solve LeetCode #89, #477, #1009, #1720 using XOR patterns", durationMinutes: 35 },
        { description: "Prove the Gray Code formula i ^ (i >> 1) always gives consecutive codes differing by one bit", durationMinutes: 15 },
      ],
      reviewQuestions: [
        "Why does XOR from 1 to n follow a 4-cycle pattern?:::The XOR of consecutive pairs (2k, 2k+1) always equals 1 (they differ only in the last bit). So XOR cycles: n, 1, n+1, 0 based on how many complete pairs exist.",
        "In the Total Hamming Distance problem, why does counting ones per bit position work?:::For each bit position, every pair of (one, zero) contributes 1 to the distance. The number of such pairs is ones * zeros = ones * (n - ones). Summing across all 32 bit positions gives the total.",
      ],
      successCriteria: "Can solve advanced XOR problems and explain the mathematical reasoning behind each pattern.",
      paretoJustification: "These advanced XOR patterns are frequently tested in medium-difficulty FAANG interviews and competitive programming.",
      resources: [
        { title: "LeetCode #89 — Gray Code", type: "practice", url: "https://leetcode.com/problems/gray-code/" },
      ],
    },
    {
      sessionNumber: 8,
      title: "Bit Manipulation Interview Patterns",
      content: `### Interview Pattern Recognition

### Pattern 1: UTF-8 Validation — LeetCode #393

Validate if an array of integers represents valid UTF-8 encoding.

**Java:**
\`\`\`java
// O(n) time — LeetCode #393
public boolean validUtf8(int[] data) {
    int remaining = 0;
    for (int b : data) {
        if (remaining > 0) {
            // Must be continuation byte: 10xxxxxx
            if ((b & 0b11000000) != 0b10000000) return false;
            remaining--;
        } else {
            if ((b & 0b10000000) == 0) remaining = 0;           // 0xxxxxxx
            else if ((b & 0b11100000) == 0b11000000) remaining = 1; // 110xxxxx
            else if ((b & 0b11110000) == 0b11100000) remaining = 2; // 1110xxxx
            else if ((b & 0b11111000) == 0b11110000) remaining = 3; // 11110xxx
            else return false;
        }
    }
    return remaining == 0;
}
\`\`\`

**Python:**
\`\`\`python
# O(n) time — LeetCode #393
def validUtf8(data: list[int]) -> bool:
    remaining = 0
    for b in data:
        if remaining > 0:
            if (b & 0b11000000) != 0b10000000:
                return False
            remaining -= 1
        else:
            if (b & 0b10000000) == 0: remaining = 0
            elif (b & 0b11100000) == 0b11000000: remaining = 1
            elif (b & 0b11110000) == 0b11100000: remaining = 2
            elif (b & 0b11111000) == 0b11110000: remaining = 3
            else: return False
    return remaining == 0
\`\`\`

### Pattern 2: Bitwise AND of Numbers Range — LeetCode #201

**Problem:** Find AND of all numbers from left to right (inclusive).

**Key Insight:** AND erases bits that differ. Find the common prefix of left and right.

**Java:**
\`\`\`java
// O(log n) time — LeetCode #201
public int rangeBitwiseAnd(int left, int right) {
    int shift = 0;
    while (left != right) {
        left >>= 1;
        right >>= 1;
        shift++;
    }
    return left << shift;
}
\`\`\`

**Python:**
\`\`\`python
# O(log n) time — LeetCode #201
def rangeBitwiseAnd(left: int, right: int) -> int:
    shift = 0
    while left != right:
        left >>= 1
        right >>= 1
        shift += 1
    return left << shift
\`\`\`

### Pattern 3: Maximum Product of Word Lengths — LeetCode #318

**Problem:** Find the maximum product of lengths of two words that don't share letters.

**Key Insight:** Represent each word as a 26-bit mask. Two words share no letters if their masks AND to 0.

**Java:**
\`\`\`java
// O(n^2 + n*m) time — LeetCode #318
public int maxProduct(String[] words) {
    int n = words.length;
    int[] masks = new int[n];
    for (int i = 0; i < n; i++) {
        for (char c : words[i].toCharArray()) {
            masks[i] |= (1 << (c - 'a'));
        }
    }
    int max = 0;
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            if ((masks[i] & masks[j]) == 0) {
                max = Math.max(max, words[i].length() * words[j].length());
            }
        }
    }
    return max;
}
\`\`\`

**Python:**
\`\`\`python
# O(n^2 + n*m) time — LeetCode #318
def maxProduct(words: list[str]) -> int:
    masks = [0] * len(words)
    for i, word in enumerate(words):
        for c in word:
            masks[i] |= (1 << (ord(c) - ord('a')))

    max_prod = 0
    for i in range(len(words)):
        for j in range(i + 1, len(words)):
            if masks[i] & masks[j] == 0:
                max_prod = max(max_prod, len(words[i]) * len(words[j]))
    return max_prod
\`\`\`

### Pattern Recognition Cheat Sheet

| Signal | Pattern | Problem |
|--------|---------|---------|
| "appears once/twice" | XOR cancellation | LC #136, #137, #260 |
| "power of 2" | n & (n-1) == 0 | LC #231, #342 |
| "count bits" | Brian Kernighan or DP | LC #191, #338 |
| "subsets" | Bitmask enumeration | LC #78, #90 |
| "no common letters" | Letter bitmask | LC #318 |
| "range AND/XOR" | Common prefix / 4-cycle | LC #201 |
| "UTF-8/encoding" | Bit masking per byte | LC #393 |
| "swap/toggle" | XOR | Custom |
| "all subsets of mask" | s = (s-1) & mask | Bitmask DP |

### Interview Checklist
1. Can I use a bit trick? (Check for single-pass O(1) space solutions)
2. What integer size? (32-bit, 64-bit, arbitrary?)
3. Signed or unsigned? (Matters for right shift behavior)
4. Edge cases: 0, negative numbers, INT_MAX, INT_MIN
5. Operator precedence: always parenthesize bit operations in comparisons`,
      objectives: [
        "Recognize bit manipulation patterns from problem descriptions",
        "Apply bitmask representation for set operations",
        "Handle edge cases in bit manipulation problems",
      ],
      activities: [
        { description: "Solve LeetCode #201, #318, #393 — identify the pattern before coding", durationMinutes: 40 },
        { description: "Review all 8 sessions: create a personal cheat sheet of patterns and tricks", durationMinutes: 20 },
      ],
      reviewQuestions: [
        "How do you represent a set of lowercase letters as a bitmask?:::Use a 26-bit integer. For each letter c, set bit (c - 'a'). Union = OR, intersection = AND, 'no overlap' = AND equals 0.",
        "What is the key insight for finding the AND of a range [left, right]?:::The AND of a range erases all bits that differ between any two numbers. This is equivalent to finding the common prefix of left and right in binary, then shifting back. Bits to the right of the first difference are all 0.",
      ],
      successCriteria: "Can identify the correct bit manipulation pattern for any interview problem and implement it correctly.",
      paretoJustification: "Pattern recognition is the meta-skill — knowing which bit trick to apply is more important than memorizing all tricks.",
      resources: [
        { title: "LeetCode #201 — Bitwise AND of Range", type: "practice", url: "https://leetcode.com/problems/bitwise-and-of-numbers-range/" },
        { title: "LeetCode #318 — Max Product of Word Lengths", type: "practice", url: "https://leetcode.com/problems/maximum-product-of-word-lengths/" },
      ],
    },
  ];

  const quizBank = [
    { question: "What is the result of 12 & 10 in binary?", format: "mcq", difficulty: 1, bloomLabel: "Remember", options: ["A) 1110 (14)", "B) 1000 (8)", "C) 0110 (6)", "D) 0010 (2)"], correctAnswer: "B", explanation: "**Correct: B) 1000 = 8.** 12 = 1100, 10 = 1010. AND gives 1 only where both bits are 1: 1000 = 8." },
    { question: "What is the value of ~5 in a 32-bit signed integer?", format: "mcq", difficulty: 1, bloomLabel: "Remember", options: ["A) -5", "B) -6", "C) 4", "D) -4"], correctAnswer: "B", explanation: "**Correct: B) -6.** In two's complement, ~n = -(n+1). So ~5 = -6. Bit pattern: 5 = ...00101, ~5 = ...11010 which is -6 in two's complement." },
    { question: "What is the result of 7 ^ 7?", format: "mcq", difficulty: 1, bloomLabel: "Remember", options: ["A) 7", "B) 14", "C) 0", "D) -1"], correctAnswer: "C", explanation: "**Correct: C) 0.** XOR of any number with itself is 0 (self-inverse property). This is the foundation of the Single Number problem." },
    { question: "What does the expression n & (n - 1) do?", format: "mcq", difficulty: 2, bloomLabel: "Understand", options: ["A) Checks if n is odd", "B) Clears the lowest set bit of n", "C) Isolates the lowest set bit of n", "D) Flips all bits of n"], correctAnswer: "B", explanation: "**Correct: B).** n - 1 flips the lowest set bit and all bits below it. ANDing with n clears the lowest set bit while keeping all higher bits. For example: 12 (1100) & 11 (1011) = 1000 (8)." },
    { question: "How do you check if a number is a power of 2 using bit manipulation?", format: "mcq", difficulty: 2, bloomLabel: "Apply", options: ["A) n % 2 == 0", "B) n & 1 == 0", "C) n > 0 && (n & (n - 1)) == 0", "D) n > 0 && (n | (n - 1)) == 0"], correctAnswer: "C", explanation: "**Correct: C).** A power of 2 has exactly one set bit (e.g., 1000). n & (n-1) clears that bit, giving 0. The n > 0 check excludes 0, which also satisfies n & (n-1) == 0 but is not a power of 2." },
    { question: "In the Single Number problem (LC #136), why does XOR find the unique element?", format: "mcq", difficulty: 2, bloomLabel: "Understand", options: ["A) XOR sorts the elements", "B) XOR counts occurrences", "C) Pairs cancel out (a ^ a = 0), leaving the unique element", "D) XOR finds the median"], correctAnswer: "C", explanation: "**Correct: C).** XOR is commutative and associative, so order doesn't matter. Every number that appears twice gets XOR'd with itself, producing 0. The unique number XOR'd with 0 remains unchanged." },
    { question: "What is the time complexity of Brian Kernighan's bit counting algorithm for a number with k set bits?", format: "mcq", difficulty: 2, bloomLabel: "Analyze", options: ["A) O(1)", "B) O(k)", "C) O(log n)", "D) O(32)"], correctAnswer: "B", explanation: "**Correct: B) O(k).** Each iteration clears exactly one set bit (via n & (n-1)). The loop runs exactly k times, where k is the number of set bits. This is better than the naive O(32) loop when k is small." },
    { question: "What does n & (-n) compute?", format: "mcq", difficulty: 3, bloomLabel: "Apply", options: ["A) Clears the lowest set bit", "B) Isolates the lowest set bit", "C) Returns n's complement", "D) Computes absolute value"], correctAnswer: "B", explanation: "**Correct: B).** -n in two's complement is (~n + 1). ANDing with n isolates the lowest set bit. For example: 12 (1100) & -12 (...0100) = 0100 (4). This is used in Single Number III to find the differing bit." },
    { question: "How do you set bit at position i in an integer n?", format: "mcq", difficulty: 2, bloomLabel: "Apply", options: ["A) n & (1 << i)", "B) n | (1 << i)", "C) n ^ (1 << i)", "D) n >> i"], correctAnswer: "B", explanation: "**Correct: B) n | (1 << i).** (1 << i) creates a mask with only bit i set. OR with n sets bit i to 1 without changing other bits. AND would check the bit, XOR would toggle it." },
    { question: "In Single Number III (LC #260), why do we partition numbers using the lowest set bit of xor?", format: "mcq", difficulty: 4, bloomLabel: "Analyze", options: ["A) To sort the numbers", "B) To find the larger of the two unique numbers", "C) To separate the two unique numbers into different groups while keeping pairs together", "D) To count occurrences"], correctAnswer: "C", explanation: "**Correct: C).** The lowest set bit of a^b identifies a position where a and b differ. Using this bit to partition, a goes to one group and b to the other. Identical numbers always have the same bit value, so pairs stay together and cancel via XOR." },
    { question: "How many subsets does a set of 5 elements have?", format: "mcq", difficulty: 1, bloomLabel: "Remember", options: ["A) 5", "B) 10", "C) 25", "D) 32"], correctAnswer: "D", explanation: "**Correct: D) 32 = 2^5.** Each element is either included or not (2 choices), independently. Total: 2 * 2 * 2 * 2 * 2 = 32. This is why bitmask enumeration iterates from 0 to 2^n - 1." },
    { question: "What is the maximum n for which bitmask DP is typically feasible?", format: "mcq", difficulty: 3, bloomLabel: "Evaluate", options: ["A) n = 10", "B) n = 20", "C) n = 30", "D) n = 50"], correctAnswer: "B", explanation: "**Correct: B) n = 20.** At n=20, the state space is 2^20 = ~1M, which is manageable. At n=25 it's ~33M (borderline), and at n=30 it's ~1B, which exceeds typical memory and time limits." },
    { question: "What is the XOR of all numbers from 1 to 8?", format: "mcq", difficulty: 2, bloomLabel: "Apply", options: ["A) 0", "B) 8", "C) 9", "D) 1"], correctAnswer: "C", explanation: "**Correct: C) 9.** Using the 4-cycle pattern: 8 % 4 = 0, so XOR(1..8) = 8. Wait — let me recalculate. XOR(1..8): 8 % 4 = 0, formula gives n = 8. But let's verify: 1^2=3, 3^3=0, 0^4=4, 4^5=1, 1^6=7, 7^7=0, 0^8=8. So the answer is 8. **Correction: B) 8.** The 4-cycle: n%4==0 → result is n." },
    { question: "How do you represent the set {0, 2, 4} as a bitmask?", format: "mcq", difficulty: 2, bloomLabel: "Apply", options: ["A) 0b00111", "B) 0b10101", "C) 0b01010", "D) 0b10100"], correctAnswer: "B", explanation: "**Correct: B) 0b10101 = 21.** Bit 0 is set (element 0), bit 2 is set (element 2), bit 4 is set (element 4). Reading right to left: ...10101." },
    { question: "What does (mask & (1 << i)) != 0 check?", format: "mcq", difficulty: 1, bloomLabel: "Remember", options: ["A) If mask equals i", "B) If bit i is set in mask", "C) If mask is a power of 2", "D) If i bits are set in mask"], correctAnswer: "B", explanation: "**Correct: B).** (1 << i) creates a mask with only bit i set. ANDing with mask isolates bit i. If the result is non-zero, bit i is set in mask." },
    { question: "In the Range Bitwise AND problem (LC #201), why do we shift left and right until they are equal?", format: "mcq", difficulty: 3, bloomLabel: "Analyze", options: ["A) To find the GCD of left and right", "B) To find the common binary prefix — bits that differ get zeroed by AND", "C) To count the number of elements in the range", "D) To convert to unsigned integers"], correctAnswer: "B", explanation: "**Correct: B).** AND of a range zeroes out all bit positions where any number in the range has a 0. Shifting right removes differing low bits until left == right (common prefix). Shifting back restores the prefix with zeros in the differing positions." },
    { question: "What is the Gray Code of i = 5?", format: "mcq", difficulty: 3, bloomLabel: "Apply", options: ["A) 5 (101)", "B) 7 (111)", "C) 6 (110)", "D) 4 (100)"], correctAnswer: "B", explanation: "**Correct: B) 7 (111).** Gray code formula: g(i) = i ^ (i >> 1). g(5) = 5 ^ (5 >> 1) = 5 ^ 2 = 101 ^ 010 = 111 = 7. Consecutive Gray codes differ by exactly one bit." },
    { question: "How do you check if bitmask a is a subset of bitmask b?", format: "mcq", difficulty: 3, bloomLabel: "Apply", options: ["A) a | b == a", "B) a & b == a", "C) a ^ b == 0", "D) a & b == b"], correctAnswer: "B", explanation: "**Correct: B) (a & b) == a.** If a is a subset of b, every bit set in a is also set in b. ANDing preserves only bits set in both — if a is a subset, all of a's bits survive, so the result equals a." },
    { question: "What is the Hamming distance between 4 (100) and 7 (111)?", format: "mcq", difficulty: 2, bloomLabel: "Apply", options: ["A) 1", "B) 2", "C) 3", "D) 4"], correctAnswer: "B", explanation: "**Correct: B) 2.** XOR: 100 ^ 111 = 011, which has 2 set bits. Hamming distance counts positions where bits differ." },
    { question: "Why is left shift by n equivalent to multiplying by 2^n?", format: "mcq", difficulty: 2, bloomLabel: "Understand", options: ["A) It adds n zeros to the right, each doubling the value", "B) It removes n bits from the left", "C) It performs modular arithmetic", "D) It only works for even numbers"], correctAnswer: "A", explanation: "**Correct: A).** Each left shift by 1 appends a 0 on the right, doubling the binary value (just like appending 0 in decimal multiplies by 10). Shifting by n appends n zeros: multiply by 2^n. Overflow may occur if bits shift out of the integer width." },
  ];

  // Fix quiz 13 (XOR of 1 to 8)
  quizBank[12] = { question: "What is the XOR of all numbers from 1 to 8?", format: "mcq", difficulty: 2, bloomLabel: "Apply", options: ["A) 0", "B) 8", "C) 9", "D) 15"], correctAnswer: "B", explanation: "**Correct: B) 8.** Using the 4-cycle pattern: 8 % 4 = 0, so XOR(1..8) = n = 8. Verification: 1^2=3, 3^3=0, 0^4=4, 4^5=1, 1^6=7, 7^7=0, 0^8=8." };

  const cheatSheet = `# Bit Manipulation Cheat Sheet

## 1. Bitwise Operators
| Operator | Symbol | Example |
|----------|--------|---------|
| AND | & | 1100 & 1010 = 1000 |
| OR | \\| | 1100 \\| 1010 = 1110 |
| XOR | ^ | 1100 ^ 1010 = 0110 |
| NOT | ~ | ~0101 = 1010 |
| Left Shift | << | 0011 << 2 = 1100 |
| Right Shift | >> | 1100 >> 2 = 0011 |

## 2. Essential Tricks

### Java
\`\`\`java
// Check odd/even
boolean isOdd = (n & 1) == 1;

// Power of 2
boolean isPow2 = n > 0 && (n & (n - 1)) == 0;

// Count set bits (Brian Kernighan)
int count = 0;
while (n != 0) { n &= (n - 1); count++; }

// Get/Set/Clear/Toggle bit i
int get = (n >> i) & 1;
int set = n | (1 << i);
int clr = n & ~(1 << i);
int tog = n ^ (1 << i);

// Lowest set bit
int lsb = n & (-n);

// Clear lowest set bit
int cleared = n & (n - 1);

// XOR swap (if i != j)
a ^= b; b ^= a; a ^= b;
\`\`\`

### Python
\`\`\`python
is_odd = (n & 1) == 1
is_pow2 = n > 0 and (n & (n - 1)) == 0
lsb = n & (-n)
get_bit = (n >> i) & 1
set_bit = n | (1 << i)
clr_bit = n & ~(1 << i)
tog_bit = n ^ (1 << i)
\`\`\`

## 3. XOR Properties
- a ^ a = 0 (self-inverse)
- a ^ 0 = a (identity)
- Commutative and associative
- XOR(1..n): [n, 1, n+1, 0][n % 4]

## 4. Bitmask Set Operations
| Operation | Expression |
|-----------|-----------|
| Add i | mask \\| (1 << i) |
| Remove i | mask & ~(1 << i) |
| Has i? | (mask >> i) & 1 |
| Union | a \\| b |
| Intersection | a & b |
| Is subset? | (a & b) == a |
| Size | Integer.bitCount(mask) |

## 5. Key Problems
- #136 Single Number (XOR all)
- #137 Single Number II (bit count mod 3)
- #260 Single Number III (XOR + partition)
- #191 Number of 1 Bits (Kernighan)
- #231 Power of Two (n & (n-1))
- #338 Counting Bits (DP)
- #78 Subsets (bitmask enum)
- #201 Range AND (common prefix)
- #421 Max XOR (binary trie)

## 6. Gotchas
- Precedence: (n & 1) == 0 NOT n & 1 == 0
- Java: int is 32-bit, >> is arithmetic, >>> is unsigned
- Python: arbitrary precision, no overflow, no >>>
- XOR swap fails when a and b are the same reference
- ~n = -(n+1) in two's complement`;

  return {
    topic: "Bit Manipulation",
    category: "Data Structures & Algorithms",
    cheatSheet,
    resources: [
      { title: "Hacker's Delight", author: "Henry S. Warren", category: "books", justification: "The definitive reference for bit manipulation tricks", bestFor: "Deep mastery", estimatedTime: "10 hours", cost: "Paid", confidence: "HIGH" },
      { title: "NeetCode Bit Manipulation Playlist", author: "NeetCode", category: "youtube", justification: "Visual explanations of all key problems", bestFor: "Visual learners", estimatedTime: "2 hours", cost: "Free", confidence: "HIGH" },
      { title: "LeetCode Bit Manipulation Tag", author: "LeetCode", category: "interactive", justification: "Comprehensive practice set", bestFor: "Practice", estimatedTime: "15+ hours", cost: "Freemium", confidence: "HIGH", url: "https://leetcode.com/tag/bit-manipulation/" },
      { title: "Bit Manipulation — HackerEarth", author: "HackerEarth", category: "interactive", justification: "Interactive tutorial with practice problems", bestFor: "Beginner", estimatedTime: "3 hours", cost: "Free", confidence: "MEDIUM" },
    ],
    ladder: {
      levels: [
        { level: 1, name: "Novice", dreyfusLabel: "Novice", description: "Can convert between decimal and binary, knows the 6 operators", observableSkills: ["Decimal-binary conversion", "Basic AND/OR/XOR operations"], milestoneProject: { title: "Binary Calculator", description: "Build a tool that shows step-by-step binary operations", estimatedHours: 2 }, commonPlateaus: ["Confusing AND with OR", "Forgetting two's complement"], estimatedHours: 3, prerequisites: [] },
        { level: 2, name: "Advanced Beginner", dreyfusLabel: "Advanced Beginner", description: "Knows the 10 essential tricks and can apply them", observableSkills: ["Check power of 2", "Count set bits", "Get/set/clear bits"], milestoneProject: { title: "Solve 5 Easy Bit Problems", description: "LC #136, #191, #231, #268, #461", estimatedHours: 3 }, commonPlateaus: ["Operator precedence bugs", "Forgetting edge case n=0"], estimatedHours: 6, prerequisites: ["Binary number system"] },
        { level: 3, name: "Competent", dreyfusLabel: "Competent", description: "Can solve medium bit problems and use XOR patterns", observableSkills: ["Single Number variants", "Bitmask enumeration", "Range XOR"], milestoneProject: { title: "Solve All Single Number Variants", description: "LC #136, #137, #260 in O(1) space", estimatedHours: 3 }, commonPlateaus: ["Struggling with Single Number III partitioning"], estimatedHours: 10, prerequisites: ["XOR properties"] },
        { level: 4, name: "Proficient", dreyfusLabel: "Proficient", description: "Can apply bitmask DP and solve hard bit problems", observableSkills: ["Bitmask DP (TSP)", "Binary trie", "UTF-8 validation"], milestoneProject: { title: "Implement Bitmask DP Solution", description: "Solve TSP for 15 cities using bitmask DP", estimatedHours: 4 }, commonPlateaus: ["State transitions in bitmask DP"], estimatedHours: 15, prerequisites: ["Dynamic programming"] },
        { level: 5, name: "Expert", dreyfusLabel: "Expert", description: "Can design bit-level algorithms and optimize with bit parallelism", observableSkills: ["Bit-parallel algorithms", "Custom bit tricks", "System-level bit operations"], milestoneProject: { title: "Design a Bloom Filter", description: "Implement a memory-efficient Bloom filter using bit manipulation", estimatedHours: 5 }, commonPlateaus: ["Knowing when NOT to use bit manipulation"], estimatedHours: 20, prerequisites: ["System design basics"] },
      ],
    },
    plan: {
      overview: "Master bit manipulation from binary basics to interview-ready patterns in 8 sessions. Covers operators, tricks, XOR patterns, bitmask DP, and pattern recognition.",
      skippedTopics: "Bit-parallel algorithms, SIMD instructions, floating-point bit manipulation, architecture-specific tricks",
      sessions,
    },
    quizBank,
    interviewTips: "Always clarify integer size (32-bit vs 64-bit). Mention O(1) space advantage of bit tricks over HashMap. Watch for operator precedence. Handle edge cases: 0, negative numbers, INT_MIN.",
    commonMistakes: "Forgetting parentheses: n & 1 == 0 vs (n & 1) == 0. XOR swap with same reference. Not handling negative numbers in Python. Using >> instead of >>> in Java for unsigned shift.",
    patterns: "XOR cancellation, Brian Kernighan, n & (n-1), bitmask enumeration, bitmask DP, binary trie, per-bit counting",
  };
}

// ── Union-Find (Disjoint Set) ───────────────────────────────────────────────

function buildUnionFindTopic() {
  const sessions = [
    {
      sessionNumber: 1,
      title: "Union-Find Basics & Motivation",
      content: `### What is Union-Find?

**Union-Find** (also called **Disjoint Set Union** or DSU) is a data structure that tracks elements partitioned into disjoint (non-overlapping) sets. It supports two operations:

1. **Find(x):** Which set does element x belong to? (Returns the set's representative/root)
2. **Union(x, y):** Merge the sets containing x and y

### Why Union-Find Matters in Interviews

Union-Find appears in:
- **Graph connectivity**: Are two nodes connected?
- **Cycle detection**: Does adding this edge create a cycle?
- **Kruskal's MST**: Build minimum spanning tree greedily
- **Number of connected components**: Count distinct groups
- **LeetCode**: #200 (Number of Islands), #547 (Number of Provinces), #684 (Redundant Connection)

\`\`\`mermaid
graph TD
    subgraph "Before Union(1, 3)"
    A["Set A: {0, 1, 2}"]
    B["Set B: {3, 4}"]
    end
    subgraph "After Union(1, 3)"
    C["Merged: {0, 1, 2, 3, 4}"]
    end
    A --> C
    B --> C
\`\`\`

### Basic Representation

Each element points to a parent. The root of a tree is the set representative (points to itself).

\`\`\`mermaid
graph TD
    subgraph "parent array: [0, 0, 1, 3, 3]"
    N0["0 (root)"] --> N1["1"]
    N1 --> N2["2"]
    N3["3 (root)"] --> N4["4"]
    end
\`\`\`

Elements 0, 1, 2 are in one set (root 0). Elements 3, 4 are in another set (root 3).

### Naive Implementation

**Java:**
\`\`\`java
class UnionFind {
    private int[] parent;
    private int count; // number of components

    public UnionFind(int n) {
        parent = new int[n];
        count = n;
        for (int i = 0; i < n; i++) {
            parent[i] = i; // each element is its own root
        }
    }

    // Find root of x — O(n) worst case
    public int find(int x) {
        while (parent[x] != x) {
            x = parent[x];
        }
        return x;
    }

    // Union sets containing x and y — O(n) worst case
    public void union(int x, int y) {
        int rootX = find(x);
        int rootY = find(y);
        if (rootX != rootY) {
            parent[rootX] = rootY;
            count--;
        }
    }

    // Are x and y in the same set?
    public boolean connected(int x, int y) {
        return find(x) == find(y);
    }

    public int getCount() {
        return count;
    }
}
\`\`\`

**Python:**
\`\`\`python
class UnionFind:
    def __init__(self, n: int):
        self.parent = list(range(n))
        self.count = n  # number of components

    def find(self, x: int) -> int:
        """Find root of x — O(n) worst case."""
        while self.parent[x] != x:
            x = self.parent[x]
        return x

    def union(self, x: int, y: int) -> None:
        """Union sets containing x and y — O(n) worst case."""
        root_x = self.find(x)
        root_y = self.find(y)
        if root_x != root_y:
            self.parent[root_x] = root_y
            self.count -= 1

    def connected(self, x: int, y: int) -> bool:
        """Are x and y in the same set?"""
        return self.find(x) == self.find(y)
\`\`\`

### Why "Naive" is Not Enough

Without optimizations, the tree can become a long chain (degenerate to a linked list). Find takes O(n) per call. With n union operations, total time is O(n^2).

**Next sessions:** We'll add two optimizations that bring this down to nearly O(1) per operation.`,
      objectives: [
        "Understand the Union-Find data structure and its two core operations",
        "Implement a basic Union-Find with parent array",
        "Identify problems that can be solved with Union-Find",
      ],
      activities: [
        { description: "Implement basic UnionFind and test with 10 union operations, verifying connected() after each", durationMinutes: 20 },
        { description: "Draw the parent tree after each union in: union(0,1), union(2,3), union(1,3), union(4,5), union(3,5)", durationMinutes: 15 },
      ],
      reviewQuestions: [
        "What does the find operation return?:::The root (representative) of the set containing the given element. Two elements are in the same set if and only if they have the same root.",
        "Why is the naive Union-Find O(n) per operation in the worst case?:::Without optimizations, repeated unions can create a degenerate tree (linked list). Finding the root of the deepest element requires traversing all n elements.",
      ],
      successCriteria: "Can implement basic Union-Find and explain why optimizations are needed.",
      paretoJustification: "Understanding the basic structure is essential before learning the optimizations that make Union-Find interview-worthy.",
      resources: [
        { title: "Princeton Algorithms — Union-Find", type: "courses", url: "https://algs4.cs.princeton.edu/15uf/" },
      ],
    },
    {
      sessionNumber: 2,
      title: "Quick Find & Quick Union",
      content: `### Two Classic Approaches

Before the modern optimized Union-Find, there were two approaches with different trade-offs.

### Quick Find (Eager Approach)

**Idea:** Store the component ID directly (not parent). All elements in the same set have the same ID.

- **Find:** O(1) — just read the ID
- **Union:** O(n) — must update all elements in one set

**Java:**
\`\`\`java
class QuickFind {
    private int[] id;

    public QuickFind(int n) {
        id = new int[n];
        for (int i = 0; i < n; i++) id[i] = i;
    }

    // O(1)
    public int find(int x) {
        return id[x];
    }

    // O(n) — must update all elements in x's component
    public void union(int x, int y) {
        int idX = id[x], idY = id[y];
        if (idX == idY) return;
        for (int i = 0; i < id.length; i++) {
            if (id[i] == idX) id[i] = idY;
        }
    }

    public boolean connected(int x, int y) {
        return id[x] == id[y];
    }
}
\`\`\`

**Python:**
\`\`\`python
class QuickFind:
    def __init__(self, n: int):
        self.id = list(range(n))

    def find(self, x: int) -> int:
        """O(1) — direct lookup."""
        return self.id[x]

    def union(self, x: int, y: int) -> None:
        """O(n) — update all elements in x's component."""
        id_x, id_y = self.id[x], self.id[y]
        if id_x == id_y:
            return
        for i in range(len(self.id)):
            if self.id[i] == id_x:
                self.id[i] = id_y

    def connected(self, x: int, y: int) -> bool:
        return self.id[x] == self.id[y]
\`\`\`

### Quick Union (Lazy Approach)

**Idea:** Use parent pointers (tree structure). Find follows parent chain to root. Union links one root to another.

- **Find:** O(n) worst case (tree height)
- **Union:** O(n) worst case (find + link)

This is the naive implementation from Session 1.

### Comparison

| | Quick Find | Quick Union |
|---|---|---|
| Find | **O(1)** | O(n) |
| Union | O(n) | O(n) |
| Memory | O(n) | O(n) |
| Best for | Many finds, few unions | General use (with optimization) |
| n unions | O(n^2) | O(n^2) |

\`\`\`mermaid
graph TD
    subgraph "Quick Find"
    QF["id[] = [1, 1, 1, 3, 3]"]
    QF1["find(0)=1, find(2)=1 → same set"]
    end
    subgraph "Quick Union"
    QU["parent[] = [1, 1, 1, 3, 3]"]
    QU1["find(0): 0→1 (root) ✓"]
    QU2["find(2): 2→1 (root) ✓"]
    end
\`\`\`

### Why Neither is Good Enough

Both have O(n) cost for n operations in the worst case, giving O(n^2) total. For 10^6 elements, this is 10^12 operations — far too slow.

**Solution:** We need two optimizations:
1. **Union by Rank/Size** — keep trees balanced
2. **Path Compression** — flatten trees during find

Together, they achieve nearly O(1) amortized per operation.`,
      objectives: [
        "Implement and compare Quick Find vs Quick Union approaches",
        "Analyze why both approaches are O(n^2) for n operations",
        "Understand the motivation for optimization",
      ],
      activities: [
        { description: "Implement QuickFind and test with 100 random unions, then 100 finds", durationMinutes: 20 },
        { description: "Construct a worst-case input for Quick Union that creates a linear chain", durationMinutes: 15 },
      ],
      reviewQuestions: [
        "What is the worst case for Quick Union's find operation and when does it occur?:::O(n) when the tree degenerates into a linked list. This happens with unions like (0,1), (1,2), (2,3), ... creating a chain of depth n.",
        "Why is Quick Find's union O(n)?:::It must scan and update the entire id[] array to change all elements that had the old component ID to the new one. Even if only two elements are being merged, it still iterates through all n elements.",
      ],
      successCriteria: "Can implement both approaches and explain their performance trade-offs.",
      paretoJustification: "Understanding the naive approaches reveals WHY the optimizations work and what problems they solve.",
      resources: [
        { title: "Sedgewick Union-Find Lecture", type: "youtube", url: "https://www.youtube.com/watch?v=8mYfZeHtdNc" },
      ],
    },
    {
      sessionNumber: 3,
      title: "Union by Rank / Size",
      content: `### Weighted Quick Union

The key insight: when merging two trees, always attach the **smaller** tree under the **larger** one. This keeps the tree height logarithmic.

Two variants:
- **Union by Size:** Track the size of each tree, attach smaller to larger
- **Union by Rank:** Track the upper bound on tree height (rank), attach lower-rank to higher-rank

\`\`\`mermaid
graph TD
    subgraph "Without balancing"
    A1["0"] --> A2["1"] --> A3["2"] --> A4["3"] --> A5["4"]
    end
    subgraph "With Union by Size"
    B0["0 (size=5)"]
    B0 --> B1["1"]
    B0 --> B3["3 (size=2)"]
    B1 --> B2["2"]
    B3 --> B4["4"]
    end
\`\`\`

### Implementation with Union by Rank

**Java:**
\`\`\`java
class UnionFind {
    private int[] parent;
    private int[] rank;
    private int count;

    public UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        count = n;
        for (int i = 0; i < n; i++) {
            parent[i] = i;
            rank[i] = 0;
        }
    }

    public int find(int x) {
        while (parent[x] != x) {
            x = parent[x];
        }
        return x;
    }

    // Union by rank — O(log n) amortized
    public void union(int x, int y) {
        int rootX = find(x);
        int rootY = find(y);
        if (rootX == rootY) return;

        // Attach smaller-rank tree under larger-rank tree
        if (rank[rootX] < rank[rootY]) {
            parent[rootX] = rootY;
        } else if (rank[rootX] > rank[rootY]) {
            parent[rootY] = rootX;
        } else {
            parent[rootY] = rootX;
            rank[rootX]++; // only increase rank when equal
        }
        count--;
    }

    public boolean connected(int x, int y) {
        return find(x) == find(y);
    }

    public int getCount() { return count; }
}
\`\`\`

**Python:**
\`\`\`python
class UnionFind:
    def __init__(self, n: int):
        self.parent = list(range(n))
        self.rank = [0] * n
        self.count = n

    def find(self, x: int) -> int:
        while self.parent[x] != x:
            x = self.parent[x]
        return x

    def union(self, x: int, y: int) -> bool:
        """Union by rank — O(log n). Returns True if merged (were different sets)."""
        root_x = self.find(x)
        root_y = self.find(y)
        if root_x == root_y:
            return False

        if self.rank[root_x] < self.rank[root_y]:
            self.parent[root_x] = root_y
        elif self.rank[root_x] > self.rank[root_y]:
            self.parent[root_y] = root_x
        else:
            self.parent[root_y] = root_x
            self.rank[root_x] += 1
        self.count -= 1
        return True

    def connected(self, x: int, y: int) -> bool:
        return self.find(x) == self.find(y)
\`\`\`

### Union by Size (Alternative)

Instead of rank, track actual tree sizes. Attach smaller tree under larger.

**Java:**
\`\`\`java
class UnionFindBySize {
    private int[] parent;
    private int[] size;
    private int count;

    public UnionFindBySize(int n) {
        parent = new int[n];
        size = new int[n];
        count = n;
        for (int i = 0; i < n; i++) {
            parent[i] = i;
            size[i] = 1;
        }
    }

    public int find(int x) {
        while (parent[x] != x) x = parent[x];
        return x;
    }

    public void union(int x, int y) {
        int rootX = find(x), rootY = find(y);
        if (rootX == rootY) return;
        // Attach smaller to larger
        if (size[rootX] < size[rootY]) {
            parent[rootX] = rootY;
            size[rootY] += size[rootX];
        } else {
            parent[rootY] = rootX;
            size[rootX] += size[rootY];
        }
        count--;
    }

    public int getSize(int x) { return size[find(x)]; }
}
\`\`\`

**Python:**
\`\`\`python
class UnionFindBySize:
    def __init__(self, n: int):
        self.parent = list(range(n))
        self.size = [1] * n
        self.count = n

    def find(self, x: int) -> int:
        while self.parent[x] != x:
            x = self.parent[x]
        return x

    def union(self, x: int, y: int) -> bool:
        root_x, root_y = self.find(x), self.find(y)
        if root_x == root_y:
            return False
        if self.size[root_x] < self.size[root_y]:
            self.parent[root_x] = root_y
            self.size[root_y] += self.size[root_x]
        else:
            self.parent[root_y] = root_x
            self.size[root_x] += self.size[root_y]
        self.count -= 1
        return True
\`\`\`

### Complexity with Union by Rank/Size

| Operation | Without | With Union by Rank/Size |
|-----------|---------|------------------------|
| Find | O(n) | O(log n) |
| Union | O(n) | O(log n) |
| n operations | O(n^2) | O(n log n) |

**Proof sketch:** With union by rank, the tree height is at most log_2(n) because a tree of height h has at least 2^h nodes. Each find traverses at most log_2(n) edges.`,
      objectives: [
        "Implement Union by Rank and Union by Size optimizations",
        "Understand why balancing reduces height to O(log n)",
        "Compare rank vs size approaches",
      ],
      activities: [
        { description: "Implement both union-by-rank and union-by-size, then benchmark with 100K operations", durationMinutes: 30 },
        { description: "Prove that union by rank keeps tree height <= log_2(n) using induction", durationMinutes: 15 },
      ],
      reviewQuestions: [
        "Why does rank only increase when two trees of equal rank are merged?:::When ranks differ, the smaller tree goes under the larger — the larger tree's rank (height bound) doesn't change. Only when ranks are equal does attaching one increase the combined height by 1.",
        "What is the difference between union by rank and union by size?:::Rank tracks an upper bound on tree height; size tracks actual number of nodes. Both achieve O(log n) find. Size is slightly simpler to reason about; rank works better with path compression (rank stays unchanged).",
      ],
      successCriteria: "Can implement both balancing strategies and prove O(log n) height bound.",
      paretoJustification: "Union by rank is essential for interview-ready Union-Find — it is the first of two optimizations that together achieve near-O(1).",
      resources: [
        { title: "CLRS Chapter 21 — Disjoint Sets", type: "books" },
      ],
    },
    {
      sessionNumber: 4,
      title: "Path Compression",
      content: `### The Second Key Optimization

**Path compression** makes every node on the find path point directly to the root. This flattens the tree, making future finds nearly O(1).

### Three Variants

1. **Full path compression (recursive):** Every node points directly to root
2. **Path splitting:** Every node points to its grandparent
3. **Path halving:** Every other node points to its grandparent

All three achieve the same amortized complexity. Path compression (variant 1) is most common in interviews.

\`\`\`mermaid
graph TD
    subgraph "Before find(4)"
    A0["0 (root)"] --> A1["1"] --> A2["2"] --> A3["3"] --> A4["4"]
    end
    subgraph "After find(4) with path compression"
    B0["0 (root)"]
    B0 --> B1["1"]
    B0 --> B2["2"]
    B0 --> B3["3"]
    B0 --> B4["4"]
    end
\`\`\`

### Implementation: Union by Rank + Path Compression

This is **THE** interview-standard Union-Find implementation.

**Java:**
\`\`\`java
class UnionFind {
    private int[] parent;
    private int[] rank;
    private int count;

    public UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        count = n;
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    // Find with path compression — amortized O(alpha(n))
    public int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]); // path compression
        }
        return parent[x];
    }

    // Union by rank — amortized O(alpha(n))
    public boolean union(int x, int y) {
        int rootX = find(x), rootY = find(y);
        if (rootX == rootY) return false;

        if (rank[rootX] < rank[rootY]) {
            parent[rootX] = rootY;
        } else if (rank[rootX] > rank[rootY]) {
            parent[rootY] = rootX;
        } else {
            parent[rootY] = rootX;
            rank[rootX]++;
        }
        count--;
        return true;
    }

    public boolean connected(int x, int y) {
        return find(x) == find(y);
    }

    public int getCount() { return count; }
}
\`\`\`

**Python:**
\`\`\`python
class UnionFind:
    def __init__(self, n: int):
        self.parent = list(range(n))
        self.rank = [0] * n
        self.count = n

    def find(self, x: int) -> int:
        """Find with path compression — amortized O(alpha(n))."""
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x: int, y: int) -> bool:
        """Union by rank — amortized O(alpha(n)). Returns True if merged."""
        root_x, root_y = self.find(x), self.find(y)
        if root_x == root_y:
            return False
        if self.rank[root_x] < self.rank[root_y]:
            self.parent[root_x] = root_y
        elif self.rank[root_x] > self.rank[root_y]:
            self.parent[root_y] = root_x
        else:
            self.parent[root_y] = root_x
            self.rank[root_x] += 1
        self.count -= 1
        return True

    def connected(self, x: int, y: int) -> bool:
        return self.find(x) == self.find(y)
\`\`\`

### Iterative Path Compression (Alternative)

If recursion depth is a concern (very deep trees before first find):

**Java:**
\`\`\`java
public int find(int x) {
    int root = x;
    while (parent[root] != root) root = parent[root]; // find root
    while (parent[x] != root) { // compress path
        int next = parent[x];
        parent[x] = root;
        x = next;
    }
    return root;
}
\`\`\`

**Python:**
\`\`\`python
def find(self, x: int) -> int:
    root = x
    while self.parent[root] != root:
        root = self.parent[root]
    while self.parent[x] != root:
        self.parent[x], x = root, self.parent[x]
    return root
\`\`\`

### Path Halving (Simplest One-Line Optimization)

Every node points to its grandparent during find:

\`\`\`java
public int find(int x) {
    while (parent[x] != x) {
        parent[x] = parent[parent[x]]; // path halving
        x = parent[x];
    }
    return x;
}
\`\`\`

### Complexity: The Inverse Ackermann Function

With both optimizations, m operations on n elements take **O(m * alpha(n))** time, where alpha is the inverse Ackermann function.

- alpha(n) <= 4 for any n up to 2^(2^(2^65536))
- For all practical purposes, alpha(n) = constant
- **Effectively O(1) amortized per operation**

| Optimization | Find | m operations |
|---|---|---|
| None | O(n) | O(m * n) |
| Union by rank only | O(log n) | O(m * log n) |
| Path compression only | O(log n) amortized | O(m * log n) |
| **Both** | **O(alpha(n))** | **O(m * alpha(n))** |`,
      objectives: [
        "Implement path compression (recursive and iterative)",
        "Understand the inverse Ackermann function and why it is effectively O(1)",
        "Combine path compression with union by rank for optimal Union-Find",
      ],
      activities: [
        { description: "Implement the interview-standard UnionFind (rank + path compression) and test with 1M operations", durationMinutes: 20 },
        { description: "Implement path halving variant and compare with full path compression", durationMinutes: 15 },
      ],
      reviewQuestions: [
        "Why does path compression work well with union by rank but not as cleanly with union by size?:::Path compression changes tree structure but not ranks. With union by size, compression makes sizes inaccurate (nodes get detached from subtrees). With rank, the rank remains a valid upper bound on height even after compression.",
        "What is the practical implication of O(alpha(n)) amortized complexity?:::For any practical input size (up to atoms in the universe), alpha(n) <= 4. This means Union-Find operations are effectively O(1) amortized — essentially as fast as array access.",
      ],
      successCriteria: "Can implement optimal Union-Find from memory and explain why it is nearly O(1).",
      paretoJustification: "This is the Union-Find implementation you will use in every interview — memorize it.",
      resources: [
        { title: "Wikipedia — Disjoint-set data structure", type: "docs", url: "https://en.wikipedia.org/wiki/Disjoint-set_data_structure" },
      ],
    },
    {
      sessionNumber: 5,
      title: "Applications: Connected Components, Cycle Detection, Kruskal's MST",
      content: `### Application 1: Number of Connected Components

**Problem:** Given n nodes and edges, find the number of connected components.
Alternatively: LeetCode #547 (Number of Provinces), #200 (Number of Islands).

**Java:**
\`\`\`java
// Number of Provinces — LeetCode #547 — O(n^2 * alpha(n))
public int findCircleNum(int[][] isConnected) {
    int n = isConnected.length;
    UnionFind uf = new UnionFind(n);
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            if (isConnected[i][j] == 1) {
                uf.union(i, j);
            }
        }
    }
    return uf.getCount();
}

// Number of Islands — LeetCode #200 — O(m * n * alpha(m*n))
public int numIslands(char[][] grid) {
    int m = grid.length, n = grid[0].length;
    UnionFind uf = new UnionFind(m * n);
    int water = 0;
    int[][] dirs = {{0,1},{1,0}};
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (grid[i][j] == '0') { water++; continue; }
            for (int[] d : dirs) {
                int ni = i + d[0], nj = j + d[1];
                if (ni < m && nj < n && grid[ni][nj] == '1') {
                    uf.union(i * n + j, ni * n + nj);
                }
            }
        }
    }
    return uf.getCount() - water;
}
\`\`\`

**Python:**
\`\`\`python
# Number of Provinces — LeetCode #547
def findCircleNum(isConnected: list[list[int]]) -> int:
    n = len(isConnected)
    uf = UnionFind(n)
    for i in range(n):
        for j in range(i + 1, n):
            if isConnected[i][j] == 1:
                uf.union(i, j)
    return uf.count

# Number of Islands — LeetCode #200
def numIslands(grid: list[list[str]]) -> int:
    m, n = len(grid), len(grid[0])
    uf = UnionFind(m * n)
    water = 0
    for i in range(m):
        for j in range(n):
            if grid[i][j] == '0':
                water += 1
                continue
            for di, dj in [(0, 1), (1, 0)]:
                ni, nj = i + di, j + dj
                if ni < m and nj < n and grid[ni][nj] == '1':
                    uf.union(i * n + j, ni * n + nj)
    return uf.count - water
\`\`\`

### Application 2: Cycle Detection in Undirected Graph

If union(u, v) is called and u, v are already connected → adding edge (u,v) creates a cycle.

**LeetCode #684 — Redundant Connection:**

**Java:**
\`\`\`java
// O(n * alpha(n)) — LeetCode #684
public int[] findRedundantConnection(int[][] edges) {
    int n = edges.length;
    UnionFind uf = new UnionFind(n + 1); // 1-indexed
    for (int[] edge : edges) {
        if (!uf.union(edge[0], edge[1])) {
            return edge; // already connected → this edge creates a cycle
        }
    }
    return new int[0];
}
\`\`\`

**Python:**
\`\`\`python
# O(n * alpha(n)) — LeetCode #684
def findRedundantConnection(edges: list[list[int]]) -> list[int]:
    n = len(edges)
    uf = UnionFind(n + 1)  # 1-indexed
    for u, v in edges:
        if not uf.union(u, v):
            return [u, v]
    return []
\`\`\`

### Application 3: Kruskal's Minimum Spanning Tree

**Algorithm:**
1. Sort edges by weight
2. For each edge (u, v, w): if u and v are not connected, add edge and union(u, v)
3. Stop after adding n-1 edges

\`\`\`mermaid
graph TD
    subgraph "Kruskal's MST Process"
    S1["Sort edges by weight"] --> S2["For each edge"]
    S2 --> S3{"u, v connected?"}
    S3 -->|No| S4["Add to MST, union(u,v)"]
    S3 -->|Yes| S5["Skip (would create cycle)"]
    S4 --> S6{"n-1 edges added?"}
    S6 -->|No| S2
    S6 -->|Yes| S7["MST complete"]
    end
\`\`\`

**Java:**
\`\`\`java
// Kruskal's MST — O(E log E + E * alpha(V))
public int kruskalMST(int n, int[][] edges) {
    // edges[i] = [u, v, weight]
    Arrays.sort(edges, (a, b) -> a[2] - b[2]);
    UnionFind uf = new UnionFind(n);
    int mstWeight = 0, edgesUsed = 0;

    for (int[] edge : edges) {
        if (uf.union(edge[0], edge[1])) {
            mstWeight += edge[2];
            edgesUsed++;
            if (edgesUsed == n - 1) break;
        }
    }
    return edgesUsed == n - 1 ? mstWeight : -1; // -1 if disconnected
}
\`\`\`

**Python:**
\`\`\`python
# Kruskal's MST — O(E log E + E * alpha(V))
def kruskal_mst(n: int, edges: list) -> int:
    """edges: list of (u, v, weight). Returns MST total weight or -1 if disconnected."""
    edges.sort(key=lambda e: e[2])
    uf = UnionFind(n)
    mst_weight = 0
    edges_used = 0

    for u, v, w in edges:
        if uf.union(u, v):
            mst_weight += w
            edges_used += 1
            if edges_used == n - 1:
                break

    return mst_weight if edges_used == n - 1 else -1
\`\`\`

### When to Use Union-Find vs BFS/DFS

| Scenario | Union-Find | BFS/DFS |
|----------|-----------|---------|
| Static connectivity | Either works | Slightly simpler |
| Dynamic edge additions | **Union-Find wins** | Must rebuild |
| Cycle detection | Union-Find (easy) | DFS (also easy) |
| Kruskal's MST | Essential | N/A |
| Count components dynamically | **Union-Find** | Must re-traverse |`,
      objectives: [
        "Apply Union-Find to solve connected components problems",
        "Implement cycle detection using Union-Find",
        "Implement Kruskal's MST algorithm with Union-Find",
      ],
      activities: [
        { description: "Solve LeetCode #547, #200, #684 using Union-Find", durationMinutes: 35 },
        { description: "Implement Kruskal's MST and verify on a graph with 7 nodes", durationMinutes: 20 },
      ],
      reviewQuestions: [
        "How does Union-Find detect a cycle when processing edge (u, v)?:::If find(u) == find(v) before the union, then u and v are already connected. Adding the edge (u, v) would create a cycle.",
        "Why is Union-Find preferred over DFS for dynamic connectivity?:::With DFS, adding a new edge may require re-traversing the entire graph to update connectivity. Union-Find handles new edges in O(alpha(n)) amortized — essentially O(1).",
      ],
      successCriteria: "Can implement connected components, cycle detection, and Kruskal's MST using Union-Find.",
      paretoJustification: "These three applications cover 90% of Union-Find interview questions — mastering them is essential.",
      resources: [
        { title: "LeetCode #684 — Redundant Connection", type: "practice", url: "https://leetcode.com/problems/redundant-connection/" },
        { title: "LeetCode #547 — Number of Provinces", type: "practice", url: "https://leetcode.com/problems/number-of-provinces/" },
      ],
    },
    {
      sessionNumber: 6,
      title: "Advanced Union-Find Problems & Interview Patterns",
      content: `### Pattern 1: Accounts Merge — LeetCode #721

**Problem:** Merge accounts that share at least one email.

**Approach:** Map each email to an owner index. When an email appears in multiple accounts, union those accounts. Finally, group emails by their root account.

**Java:**
\`\`\`java
// O(n * m * alpha(n) + n * m * log(m)) — LeetCode #721
public List<List<String>> accountsMerge(List<List<String>> accounts) {
    Map<String, Integer> emailToId = new HashMap<>();
    UnionFind uf = new UnionFind(accounts.size());

    // Map emails to account indices, union shared emails
    for (int i = 0; i < accounts.size(); i++) {
        for (int j = 1; j < accounts.get(i).size(); j++) {
            String email = accounts.get(i).get(j);
            if (emailToId.containsKey(email)) {
                uf.union(i, emailToId.get(email));
            } else {
                emailToId.put(email, i);
            }
        }
    }

    // Group emails by root account
    Map<Integer, TreeSet<String>> groups = new HashMap<>();
    for (Map.Entry<String, Integer> entry : emailToId.entrySet()) {
        int root = uf.find(entry.getValue());
        groups.computeIfAbsent(root, k -> new TreeSet<>()).add(entry.getKey());
    }

    // Build result
    List<List<String>> result = new ArrayList<>();
    for (Map.Entry<Integer, TreeSet<String>> entry : groups.entrySet()) {
        List<String> merged = new ArrayList<>();
        merged.add(accounts.get(entry.getKey()).get(0)); // name
        merged.addAll(entry.getValue()); // sorted emails
        result.add(merged);
    }
    return result;
}
\`\`\`

**Python:**
\`\`\`python
# O(n * m * alpha(n) + n * m * log(m)) — LeetCode #721
def accountsMerge(accounts: list[list[str]]) -> list[list[str]]:
    email_to_id = {}
    uf = UnionFind(len(accounts))

    for i, account in enumerate(accounts):
        for email in account[1:]:
            if email in email_to_id:
                uf.union(i, email_to_id[email])
            else:
                email_to_id[email] = i

    # Group emails by root
    from collections import defaultdict
    groups = defaultdict(set)
    for email, idx in email_to_id.items():
        groups[uf.find(idx)].add(email)

    return [[accounts[root][0]] + sorted(emails)
            for root, emails in groups.items()]
\`\`\`

### Pattern 2: Longest Consecutive Sequence — LeetCode #128

**Problem:** Find the longest consecutive sequence in an unsorted array.

While the optimal HashMap solution is O(n), Union-Find provides an elegant alternative that naturally extends to dynamic insertions.

**Java:**
\`\`\`java
public int longestConsecutive(int[] nums) {
    if (nums.length == 0) return 0;
    Map<Integer, Integer> valToIdx = new HashMap<>();
    UnionFind uf = new UnionFind(nums.length);
    int[] size = new int[nums.length];
    Arrays.fill(size, 1);

    for (int i = 0; i < nums.length; i++) {
        if (valToIdx.containsKey(nums[i])) continue; // skip duplicates
        valToIdx.put(nums[i], i);
        if (valToIdx.containsKey(nums[i] - 1)) {
            uf.union(i, valToIdx.get(nums[i] - 1));
        }
        if (valToIdx.containsKey(nums[i] + 1)) {
            uf.union(i, valToIdx.get(nums[i] + 1));
        }
    }

    // Find max component size
    Map<Integer, Integer> compSize = new HashMap<>();
    int max = 1;
    for (int i = 0; i < nums.length; i++) {
        int root = uf.find(i);
        compSize.merge(root, 1, Integer::sum);
        max = Math.max(max, compSize.get(root));
    }
    return max;
}
\`\`\`

**Python:**
\`\`\`python
def longestConsecutive(nums: list[int]) -> int:
    if not nums:
        return 0
    val_to_idx = {}
    uf = UnionFind(len(nums))

    for i, num in enumerate(nums):
        if num in val_to_idx:
            continue
        val_to_idx[num] = i
        if num - 1 in val_to_idx:
            uf.union(i, val_to_idx[num - 1])
        if num + 1 in val_to_idx:
            uf.union(i, val_to_idx[num + 1])

    from collections import Counter
    comp_size = Counter(uf.find(i) for i in range(len(nums)))
    return max(comp_size.values())
\`\`\`

### Pattern 3: Graph Valid Tree — LeetCode #261

A graph is a valid tree if: (1) it has exactly n-1 edges, and (2) it is connected.

**Java:**
\`\`\`java
public boolean validTree(int n, int[][] edges) {
    if (edges.length != n - 1) return false; // must have exactly n-1 edges
    UnionFind uf = new UnionFind(n);
    for (int[] e : edges) {
        if (!uf.union(e[0], e[1])) return false; // cycle detected
    }
    return true;
}
\`\`\`

**Python:**
\`\`\`python
def validTree(n: int, edges: list[list[int]]) -> bool:
    if len(edges) != n - 1:
        return False
    uf = UnionFind(n)
    for u, v in edges:
        if not uf.union(u, v):
            return False
    return True
\`\`\`

### Interview Pattern Recognition

| Signal | Pattern | Problem |
|--------|---------|---------|
| "connected", "components" | Basic Union-Find | LC #547, #200 |
| "redundant edge", "cycle" | Union returns false | LC #684, #685 |
| "merge accounts/groups" | Union shared keys | LC #721, #737 |
| "minimum spanning tree" | Kruskal's + UF | LC #1584 |
| "valid tree" | n-1 edges + no cycle | LC #261 |
| "consecutive sequence" | Union adjacent values | LC #128 |
| "earliest time connected" | Process edges in order | LC #1101 |

### The Union-Find Template (Memorize This)

\`\`\`java
class UnionFind {
    int[] parent, rank;
    int count;
    UnionFind(int n) {
        parent = new int[n]; rank = new int[n]; count = n;
        for (int i = 0; i < n; i++) parent[i] = i;
    }
    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);
        return parent[x];
    }
    boolean union(int x, int y) {
        int rx = find(x), ry = find(y);
        if (rx == ry) return false;
        if (rank[rx] < rank[ry]) parent[rx] = ry;
        else if (rank[rx] > rank[ry]) parent[ry] = rx;
        else { parent[ry] = rx; rank[rx]++; }
        count--;
        return true;
    }
}
\`\`\`

### Interview Checklist
1. Can I model this as "group/merge elements"? → Union-Find
2. Do I need the number of components? → Track count
3. Does union returning false mean something? (cycle, redundant edge)
4. Remember: Union-Find for undirected graphs; for directed, use other techniques`,
      objectives: [
        "Solve advanced Union-Find interview problems",
        "Recognize Union-Find patterns in problem descriptions",
        "Write the Union-Find template from memory",
      ],
      activities: [
        { description: "Solve LeetCode #721 (Accounts Merge) and #261 (Graph Valid Tree)", durationMinutes: 35 },
        { description: "Write the complete Union-Find template from memory in under 3 minutes", durationMinutes: 10 },
      ],
      reviewQuestions: [
        "How does Union-Find help with the Accounts Merge problem?:::Each account is a node. Emails shared between accounts trigger unions. After processing, all accounts sharing any email chain are in the same group. Group emails by root and sort.",
        "For the Graph Valid Tree problem, why do we check both edge count AND cycle detection?:::A tree with n nodes has exactly n-1 edges and no cycles. Checking only edge count misses multi-component graphs with n-1 edges. Checking only cycles misses disconnected graphs. Both conditions together are necessary and sufficient.",
      ],
      successCriteria: "Can write the Union-Find template from memory and solve medium/hard Union-Find problems.",
      paretoJustification: "These problems represent the patterns most frequently tested in FAANG interviews — mastering them makes you interview-ready for Union-Find.",
      resources: [
        { title: "LeetCode #721 — Accounts Merge", type: "practice", url: "https://leetcode.com/problems/accounts-merge/" },
        { title: "LeetCode #261 — Graph Valid Tree", type: "practice", url: "https://leetcode.com/problems/graph-valid-tree/" },
      ],
    },
  ];

  const quizBank = [
    { question: "What two operations does Union-Find support?", format: "mcq", difficulty: 1, bloomLabel: "Remember", options: ["A) Insert and Delete", "B) Find and Union", "C) Push and Pop", "D) Get and Set"], correctAnswer: "B", explanation: "**Correct: B) Find and Union.** Find returns the representative (root) of the set containing an element. Union merges two sets. These are the only two core operations of the Disjoint Set Union data structure." },
    { question: "In the naive Union-Find (no optimizations), what is the worst-case time for find?", format: "mcq", difficulty: 1, bloomLabel: "Remember", options: ["A) O(1)", "B) O(log n)", "C) O(n)", "D) O(n log n)"], correctAnswer: "C", explanation: "**Correct: C) O(n).** Without optimizations, the tree can degenerate into a linked list. Finding the root requires traversing all n elements in the worst case." },
    { question: "What does Union by Rank optimize?", format: "mcq", difficulty: 2, bloomLabel: "Understand", options: ["A) Memory usage", "B) Tree height by attaching smaller tree under larger", "C) Find speed by caching results", "D) The number of union calls needed"], correctAnswer: "B", explanation: "**Correct: B).** Union by Rank keeps the tree balanced by always attaching the tree with smaller rank (height bound) under the tree with larger rank. This guarantees O(log n) maximum tree height." },
    { question: "What does path compression do during a find operation?", format: "mcq", difficulty: 2, bloomLabel: "Understand", options: ["A) Deletes nodes from the path", "B) Makes every node on the path point directly to the root", "C) Reverses the path", "D) Doubles the tree height"], correctAnswer: "B", explanation: "**Correct: B).** Path compression flattens the tree by making every node encountered during find point directly to the root. This speeds up all future find operations on those nodes." },
    { question: "What is the amortized time complexity of Union-Find with both rank and path compression?", format: "mcq", difficulty: 2, bloomLabel: "Remember", options: ["A) O(1)", "B) O(log n)", "C) O(alpha(n)) — inverse Ackermann", "D) O(n)"], correctAnswer: "C", explanation: "**Correct: C) O(alpha(n)).** The inverse Ackermann function grows so slowly that alpha(n) <= 4 for any practical n. This is effectively O(1) amortized per operation." },
    { question: "How does Union-Find detect a cycle in an undirected graph?", format: "mcq", difficulty: 2, bloomLabel: "Apply", options: ["A) By counting edges", "B) By checking if both endpoints of an edge are already in the same set", "C) By performing DFS", "D) By checking if find returns -1"], correctAnswer: "B", explanation: "**Correct: B).** When processing edge (u, v), if find(u) == find(v), then u and v are already connected. Adding this edge would create a cycle. This is how Union-Find elegantly detects cycles — union returns false." },
    { question: "In Kruskal's MST algorithm, why must edges be sorted first?", format: "mcq", difficulty: 2, bloomLabel: "Understand", options: ["A) For cache efficiency", "B) To process lightest edges first, ensuring minimum total weight (greedy)", "C) Because Union-Find requires sorted input", "D) To avoid cycles"], correctAnswer: "B", explanation: "**Correct: B).** Kruskal's is a greedy algorithm — it processes edges in order of increasing weight. For each edge, if it connects two different components (union succeeds), it's part of the MST. Sorting ensures we always pick the cheapest edge that doesn't create a cycle." },
    { question: "For Number of Islands (LeetCode #200), how do you map 2D grid coordinates to Union-Find indices?", format: "mcq", difficulty: 3, bloomLabel: "Apply", options: ["A) Use the cell value", "B) i * cols + j", "C) i + j", "D) i * j"], correctAnswer: "B", explanation: "**Correct: B) i * cols + j.** This maps each (row, col) pair to a unique 1D index. For a grid with m rows and n columns, element (i, j) maps to index i * n + j. This is the standard 2D-to-1D flattening technique." },
    { question: "Why does Union by Rank work well with path compression but Union by Size doesn't?", format: "mcq", difficulty: 4, bloomLabel: "Analyze", options: ["A) Size arrays take more memory", "B) Path compression doesn't change rank but invalidates actual subtree sizes", "C) Size can overflow", "D) There is no difference — both work equally well"], correctAnswer: "B", explanation: "**Correct: B).** Path compression moves nodes from one subtree to another (directly to root), invalidating stored sizes. Rank is an upper bound on height that remains valid even after compression — the tree can only get shorter, never taller. Both work in practice, but the theoretical analysis is cleaner with rank." },
    { question: "In the Accounts Merge problem (LeetCode #721), what is the union key?", format: "mcq", difficulty: 3, bloomLabel: "Apply", options: ["A) Account names", "B) Account indices, unioned when they share an email", "C) Email addresses, unioned when they share an account", "D) Alphabetical order of emails"], correctAnswer: "B", explanation: "**Correct: B).** Each account is a node in Union-Find. When an email appears in two different accounts, we union those account indices. After processing all emails, accounts in the same component are merged. Emails are then grouped by their root account." },
    { question: "A graph with n nodes is a valid tree if and only if:", format: "mcq", difficulty: 2, bloomLabel: "Understand", options: ["A) It has n edges and is connected", "B) It has n-1 edges and no cycles", "C) Every node has degree <= 2", "D) It has n-1 edges only"], correctAnswer: "B", explanation: "**Correct: B).** A tree with n nodes has exactly n-1 edges and is acyclic (and connected). Using Union-Find: process all edges, if any union returns false (cycle) → not a tree. If edge count != n-1 → not a tree." },
    { question: "What is the time complexity of Kruskal's algorithm using Union-Find?", format: "mcq", difficulty: 2, bloomLabel: "Apply", options: ["A) O(V^2)", "B) O(E * V)", "C) O(E log E + E * alpha(V))", "D) O(V * E * log V)"], correctAnswer: "C", explanation: "**Correct: C).** O(E log E) for sorting edges + O(E * alpha(V)) for E union/find operations. Since alpha(V) is effectively constant, this simplifies to O(E log E). The sorting dominates." },
    { question: "How do you efficiently count the number of connected components using Union-Find?", format: "mcq", difficulty: 2, bloomLabel: "Apply", options: ["A) Count nodes where parent[i] == i", "B) Maintain a count variable, decrement on each successful union", "C) Run DFS after building the structure", "D) Both A and B work"], correctAnswer: "D", explanation: "**Correct: D).** Method A counts root nodes (parent[i] == i after path compression). Method B tracks count directly, starting at n and decrementing each time union merges two different components. B is more efficient (O(1) per query vs O(n) scan), but both are correct." },
    { question: "What happens if you call union(x, x)?", format: "mcq", difficulty: 1, bloomLabel: "Apply", options: ["A) Stack overflow", "B) Nothing — find(x) == find(x), so the check prevents self-union", "C) x is removed from its set", "D) A new singleton set is created"], correctAnswer: "B", explanation: "**Correct: B).** union(x, x) calls find(x) twice, gets the same root both times. The rootX == rootY check returns early (returns false), so nothing happens. This is a safe no-op." },
    { question: "When should you prefer Union-Find over BFS/DFS for connectivity?", format: "mcq", difficulty: 3, bloomLabel: "Evaluate", options: ["A) When the graph is static and you query connectivity once", "B) When edges are added dynamically and you query connectivity after each addition", "C) When you need shortest paths", "D) When the graph is directed"], correctAnswer: "B", explanation: "**Correct: B).** Union-Find excels at dynamic connectivity — each edge addition and connectivity query is O(alpha(n)). With BFS/DFS, each new edge would require rebuilding the traversal. For static graphs with one-time queries, BFS/DFS is simpler." },
  ];

  const cheatSheet = `# Union-Find (Disjoint Set) Cheat Sheet

## 1. Core Operations
- **Find(x):** Return root (set representative) of x
- **Union(x, y):** Merge sets containing x and y
- **Connected(x, y):** Check if find(x) == find(y)

## 2. Complexity

| Version | Find | Union |
|---------|------|-------|
| Naive | O(n) | O(n) |
| Union by Rank | O(log n) | O(log n) |
| + Path Compression | O(alpha(n)) | O(alpha(n)) |

alpha(n) <= 4 for all practical n (inverse Ackermann)

## 3. The Template — Java (Memorize This)
\`\`\`java
class UnionFind {
    int[] parent, rank;
    int count;

    UnionFind(int n) {
        parent = new int[n]; rank = new int[n]; count = n;
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);
        return parent[x];
    }

    boolean union(int x, int y) {
        int rx = find(x), ry = find(y);
        if (rx == ry) return false;
        if (rank[rx] < rank[ry]) parent[rx] = ry;
        else if (rank[rx] > rank[ry]) parent[ry] = rx;
        else { parent[ry] = rx; rank[rx]++; }
        count--;
        return true;
    }
}
\`\`\`

## 4. The Template — Python
\`\`\`python
class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n
        self.count = n

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x, y):
        rx, ry = self.find(x), self.find(y)
        if rx == ry: return False
        if self.rank[rx] < self.rank[ry]: self.parent[rx] = ry
        elif self.rank[rx] > self.rank[ry]: self.parent[ry] = rx
        else: self.parent[ry] = rx; self.rank[rx] += 1
        self.count -= 1
        return True
\`\`\`

## 5. Key Applications
| Problem | Signal |
|---------|--------|
| Connected components | "connected", "groups" |
| Cycle detection | union returns false |
| Kruskal's MST | Sort edges + UF |
| Accounts merge | Shared key = union |
| Valid tree | n-1 edges + no cycle |
| Redundant connection | First edge causing cycle |

## 6. Key LeetCode Problems
- #200 Number of Islands (Medium)
- #547 Number of Provinces (Medium)
- #684 Redundant Connection (Medium)
- #721 Accounts Merge (Medium)
- #261 Graph Valid Tree (Medium)
- #128 Longest Consecutive Sequence (Medium)
- #1584 Min Cost to Connect All Points (Medium)

## 7. 2D Grid Trick
\`\`\`
index = row * numCols + col
\`\`\`

## 8. Gotchas
- Union-Find works for UNDIRECTED graphs only
- Remember to handle 1-indexed nodes (size n+1)
- union returns false = already connected (cycle!)
- Path compression changes structure but not rank
- Count components via count field, not parent scan`;

  return {
    topic: "Union-Find (Disjoint Set)",
    category: "Data Structures & Algorithms",
    cheatSheet,
    resources: [
      { title: "Princeton Algorithms — Union-Find", author: "Sedgewick & Wayne", category: "courses", justification: "The definitive lecture series on Union-Find", bestFor: "Theory + Practice", estimatedTime: "3 hours", cost: "Free", confidence: "HIGH", url: "https://algs4.cs.princeton.edu/15uf/" },
      { title: "NeetCode Union-Find Playlist", author: "NeetCode", category: "youtube", justification: "Clear visual explanations of key problems", bestFor: "Visual learners", estimatedTime: "2 hours", cost: "Free", confidence: "HIGH" },
      { title: "CLRS Chapter 21", author: "Cormen et al.", category: "books", justification: "Rigorous analysis including amortized complexity proof", bestFor: "Deep understanding", estimatedTime: "3 hours", cost: "Paid", confidence: "HIGH" },
      { title: "LeetCode Union-Find Tag", author: "LeetCode", category: "interactive", justification: "All Union-Find tagged problems for practice", bestFor: "Practice", estimatedTime: "15+ hours", cost: "Freemium", confidence: "HIGH", url: "https://leetcode.com/tag/union-find/" },
    ],
    ladder: {
      levels: [
        { level: 1, name: "Novice", dreyfusLabel: "Novice", description: "Can explain what Union-Find is and implement the naive version", observableSkills: ["Draw parent trees", "Implement basic find/union"], milestoneProject: { title: "Implement Naive Union-Find", description: "Build basic UF and test with 20 operations", estimatedHours: 1 }, commonPlateaus: ["Confusing parent with component ID"], estimatedHours: 2, prerequisites: [] },
        { level: 2, name: "Advanced Beginner", dreyfusLabel: "Advanced Beginner", description: "Can implement optimized Union-Find with rank and path compression", observableSkills: ["Union by rank", "Path compression", "Component counting"], milestoneProject: { title: "Optimized Union-Find", description: "Implement UF with both optimizations and benchmark", estimatedHours: 2 }, commonPlateaus: ["Forgetting path compression in find"], estimatedHours: 4, prerequisites: ["Recursion basics"] },
        { level: 3, name: "Competent", dreyfusLabel: "Competent", description: "Can apply Union-Find to graph problems", observableSkills: ["Connected components", "Cycle detection", "2D grid mapping"], milestoneProject: { title: "Solve 5 UF Problems", description: "LC #200, #547, #684, #261, #128", estimatedHours: 4 }, commonPlateaus: ["Choosing between UF and DFS"], estimatedHours: 8, prerequisites: ["Graph basics"] },
        { level: 4, name: "Proficient", dreyfusLabel: "Proficient", description: "Can solve complex Union-Find problems and implement Kruskal's", observableSkills: ["Kruskal's MST", "Accounts merge", "Dynamic connectivity"], milestoneProject: { title: "Implement Kruskal's MST", description: "Full MST implementation with Union-Find on weighted graph", estimatedHours: 3 }, commonPlateaus: ["Edge cases in merge problems"], estimatedHours: 12, prerequisites: ["Sorting", "Graph theory"] },
        { level: 5, name: "Expert", dreyfusLabel: "Expert", description: "Can extend Union-Find for advanced scenarios (weighted UF, rollback)", observableSkills: ["Weighted Union-Find", "Offline queries with UF", "UF with rollback"], milestoneProject: { title: "Weighted Union-Find", description: "Implement UF with edge weights for potential/distance tracking", estimatedHours: 5 }, commonPlateaus: ["Amortized analysis proofs"], estimatedHours: 15, prerequisites: ["Advanced graph algorithms"] },
      ],
    },
    plan: {
      overview: "Master Union-Find from basic concepts to interview-ready proficiency in 6 sessions. Covers naive implementation, optimizations, and the most common interview applications.",
      skippedTopics: "Persistent Union-Find, offline dynamic connectivity, weighted Union-Find with potentials, link-cut trees",
      sessions,
    },
    quizBank,
    interviewTips: "Always use the optimized template (rank + path compression). Mention O(alpha(n)) amortized. For cycle detection, the key insight is union returning false. Remember: Union-Find for undirected graphs only.",
    commonMistakes: "Forgetting path compression in find. Not handling 1-indexed vs 0-indexed. Using Union-Find on directed graphs. Not initializing parent[i] = i.",
    patterns: "Connected components, cycle detection, Kruskal's MST, merge by shared key, dynamic connectivity, 2D grid flattening",
  };
}

// ── Main: Generate and Write ────────────────────────────────────────────────

function main() {
  const topics = [
    buildTrieTopic(),
    buildBitManipulationTopic(),
    buildUnionFindTopic(),
  ];

  const outputPath = path.join(__dirname, "..", "public", "content", "dsa-advanced.json");

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
