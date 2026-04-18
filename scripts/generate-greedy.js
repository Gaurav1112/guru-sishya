#!/usr/bin/env node
// ────────────────────────────────────────────────────────────────────────────
// generate-greedy.js — Generates greedy-algorithms.json with 6 sessions,
// 15 quiz questions, cheat sheet, ladder, and resources
// ────────────────────────────────────────────────────────────────────────────

const fs = require("fs");
const path = require("path");

function buildGreedyAlgorithmsTopic() {
  const sessions = [
    {
      sessionNumber: 1,
      title: "Greedy Strategy — When Greedy Works",
      content: `### What is a Greedy Algorithm?

A **greedy algorithm** makes the locally optimal choice at each step, hoping that the sequence of local optima leads to a global optimum. Unlike dynamic programming, greedy algorithms never reconsider past decisions.

**Why greedy matters in interviews:** Greedy problems appear frequently in FAANG interviews (LeetCode #55, #45, #134, #435, #452). They test whether you can identify the optimal substructure and greedy choice property — two hallmarks of problems solvable by greedy approaches.

### When Does Greedy Work?

A greedy algorithm is correct when two properties hold:

1. **Greedy Choice Property:** A globally optimal solution can be built by making locally optimal choices. At each step, we can safely commit to the best available option without worrying about future consequences.

2. **Optimal Substructure:** An optimal solution to the problem contains optimal solutions to its subproblems. After making a greedy choice, the remaining problem is a smaller instance of the same type.

\`\`\`mermaid
graph TD
    A["Problem: Choose items to maximize value"] --> B{"Greedy Choice Property?"}
    B -->|Yes| C{"Optimal Substructure?"}
    B -->|No| D["Use DP or Backtracking"]
    C -->|Yes| E["Greedy works!"]
    C -->|No| D
\`\`\`

### The Exchange Argument

The **exchange argument** is the standard technique for proving a greedy algorithm is correct. The idea:

1. Assume there exists an optimal solution OPT that differs from the greedy solution G.
2. Find the first point where they differ.
3. Show that swapping OPT's choice for G's choice at that point does not make OPT worse.
4. Repeat until OPT equals G.

**Example — Coin Change (Canonical Systems):** For US coins {25, 10, 5, 1}, greedy always picks the largest coin that fits. The exchange argument shows: if OPT uses two dimes instead of a quarter, swapping for one quarter and one nickel gives the same value with fewer coins.

**Warning:** The exchange argument fails for non-canonical coin systems. For coins {1, 3, 4} and amount 6, greedy gives {4, 1, 1} (3 coins), but optimal is {3, 3} (2 coins).

### Greedy vs Dynamic Programming

| Criterion | Greedy | DP |
|-----------|--------|----|
| Decisions | Once, no backtrack | Considers all subproblems |
| Proof | Exchange argument | Principle of optimality |
| Efficiency | Usually O(n log n) | Usually O(n^2) or O(n*W) |
| When to use | Greedy choice property holds | Overlapping subproblems |

### Recognizing Greedy Problems

Common signals that a problem may be greedy:
- "Minimum number of..." or "Maximum number of..."
- Intervals, scheduling, or ordering
- The problem has a natural sorting order
- Making a local choice eliminates a large portion of the search space

**Java — Greedy Coin Change (Canonical Systems):**
\`\`\`java
public int minCoins(int[] coins, int amount) {
    // Sort coins in descending order
    Arrays.sort(coins);
    int count = 0;
    for (int i = coins.length - 1; i >= 0 && amount > 0; i--) {
        int use = amount / coins[i];
        count += use;
        amount -= use * coins[i];
    }
    return amount == 0 ? count : -1; // -1 if not possible
}
\`\`\`

**Python — Greedy Coin Change (Canonical Systems):**
\`\`\`python
def min_coins(coins: list[int], amount: int) -> int:
    """Greedy coin change — works for canonical coin systems only."""
    coins.sort(reverse=True)
    count = 0
    for coin in coins:
        use = amount // coin
        count += use
        amount -= use * coin
    return count if amount == 0 else -1
\`\`\`

### Key Takeaway

Not every optimization problem is greedy. Before coding, ask: "If I commit to this local choice, can I still reach the global optimum?" If yes for every step, greedy works. If not, consider DP.`,
      objectives: [
        "Define the greedy choice property and optimal substructure",
        "Apply the exchange argument to prove greedy correctness",
        "Distinguish greedy from dynamic programming approaches",
        "Identify problem characteristics that suggest a greedy solution",
      ],
      activities: [
        {
          description: "List 5 real-world scenarios where greedy works (e.g., making change with US coins) and 3 where it fails",
          durationMinutes: 15,
        },
        {
          description: "Write a proof sketch using the exchange argument for the activity selection problem",
          durationMinutes: 20,
        },
      ],
      reviewQuestions: [
        "What two properties must hold for a greedy algorithm to produce an optimal solution?:::The Greedy Choice Property (locally optimal choices lead to global optimum) and Optimal Substructure (optimal solution contains optimal sub-solutions).",
        "Why does greedy coin change fail for coins {1, 3, 4} with amount 6?:::Greedy picks 4+1+1=3 coins, but optimal is 3+3=2 coins. The greedy choice property doesn't hold for non-canonical coin systems.",
      ],
      successCriteria: "Can explain when greedy works vs DP with concrete examples and sketch an exchange argument proof.",
      paretoJustification: "Understanding when greedy works is the foundation — without this, you'll waste time trying greedy on DP problems.",
      resources: [
        { title: "CLRS Chapter 16 — Greedy Algorithms", type: "reading", url: "https://mitpress.mit.edu/books/introduction-algorithms" },
      ],
    },
    {
      sessionNumber: 2,
      title: "Activity Selection & Interval Scheduling",
      content: `### Activity Selection Problem

The **activity selection problem** is the classic greedy example: given n activities with start and finish times, select the maximum number of non-overlapping activities.

**Greedy strategy:** Always pick the activity that finishes earliest, then skip all conflicting activities. This is provably optimal via the exchange argument.

\`\`\`mermaid
gantt
    title Activity Selection (sorted by finish time)
    dateFormat X
    axisFormat %s
    section Selected
    A1 :done, 0, 2
    A3 :done, 3, 5
    A5 :done, 6, 8
    section Skipped
    A2 :crit, 1, 4
    A4 :crit, 4, 7
\`\`\`

### Why "Earliest Finish" Works

**Exchange argument:** Suppose OPT picks activity X first instead of the earliest-finishing activity E. Since E finishes no later than X, replacing X with E in OPT still leaves room for all subsequent activities in OPT. So the modified solution is at least as good.

### Implementation

**Java — Activity Selection:**
\`\`\`java
public int maxActivities(int[][] activities) {
    // Sort by finish time
    Arrays.sort(activities, (a, b) -> a[1] - b[1]);
    int count = 1;
    int lastFinish = activities[0][1];
    for (int i = 1; i < activities.length; i++) {
        if (activities[i][0] >= lastFinish) {
            count++;
            lastFinish = activities[i][1];
        }
    }
    return count;
}
\`\`\`

**Python — Activity Selection:**
\`\`\`python
def max_activities(activities: list[list[int]]) -> int:
    """Select maximum non-overlapping activities. O(n log n) time."""
    activities.sort(key=lambda x: x[1])  # Sort by finish time
    count = 1
    last_finish = activities[0][1]
    for start, finish in activities[1:]:
        if start >= last_finish:
            count += 1
            last_finish = finish
    return count
\`\`\`

### Meeting Rooms Problem

**Meeting Rooms I (LC #252):** Can a person attend all meetings? Sort by start time, check if any meeting starts before the previous one ends.

**Meeting Rooms II (LC #253):** Find the minimum number of rooms needed. This is solved with a min-heap (priority queue) tracking end times.

**Java — Meeting Rooms II:**
\`\`\`java
public int minMeetingRooms(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
    PriorityQueue<Integer> heap = new PriorityQueue<>();
    for (int[] interval : intervals) {
        if (!heap.isEmpty() && heap.peek() <= interval[0]) {
            heap.poll(); // Reuse room
        }
        heap.offer(interval[1]);
    }
    return heap.size();
}
\`\`\`

**Python — Meeting Rooms II:**
\`\`\`python
import heapq

def min_meeting_rooms(intervals: list[list[int]]) -> int:
    """Minimum meeting rooms needed. O(n log n) time."""
    intervals.sort(key=lambda x: x[0])
    heap = []  # min-heap of end times
    for start, end in intervals:
        if heap and heap[0] <= start:
            heapq.heappop(heap)  # Reuse room
        heapq.heappush(heap, end)
    return len(heap)
\`\`\`

### Alternative: Sweep Line for Meeting Rooms

A sweep-line approach separates starts (+1) and ends (-1), sorts all events, and tracks the running count. The maximum count is the answer.

**Python — Sweep Line:**
\`\`\`python
def min_rooms_sweep(intervals: list[list[int]]) -> int:
    events = []
    for start, end in intervals:
        events.append((start, 1))   # meeting starts
        events.append((end, -1))    # meeting ends
    events.sort()
    max_rooms = current = 0
    for _, delta in events:
        current += delta
        max_rooms = max(max_rooms, current)
    return max_rooms
\`\`\`

### Complexity Analysis

| Problem | Time | Space |
|---------|------|-------|
| Activity Selection | O(n log n) | O(1) |
| Meeting Rooms I | O(n log n) | O(1) |
| Meeting Rooms II (heap) | O(n log n) | O(n) |
| Meeting Rooms II (sweep) | O(n log n) | O(n) |

### Interview Tips

- **Always clarify:** Are intervals inclusive or exclusive at endpoints? Does [1,3] conflict with [3,5]?
- **Sort first:** Almost every interval problem starts with sorting.
- **Mention alternatives:** Showing both heap and sweep-line approaches demonstrates depth.`,
      objectives: [
        "Solve the activity selection problem using earliest-finish greedy",
        "Implement Meeting Rooms I and II with heap and sweep-line approaches",
        "Prove correctness of activity selection via exchange argument",
        "Analyze time/space complexity of interval scheduling algorithms",
      ],
      activities: [
        {
          description: "Implement activity selection and test with 8+ activities, verifying optimal count",
          durationMinutes: 20,
        },
        {
          description: "Solve Meeting Rooms II using both min-heap and sweep-line; compare outputs on 5 test cases",
          durationMinutes: 25,
        },
      ],
      reviewQuestions: [
        "Why do we sort by finish time (not start time) in activity selection?:::Sorting by finish time ensures the first selected activity leaves the maximum remaining time for subsequent activities. Sorting by start time might select a long activity that blocks many short ones.",
        "In Meeting Rooms II, why use a min-heap of end times?:::The min-heap efficiently tracks the earliest room that becomes free. If the earliest free room is available before the next meeting starts, we reuse it; otherwise, we need a new room.",
      ],
      successCriteria: "Can implement activity selection and meeting rooms in O(n log n) and explain the greedy correctness proof.",
      paretoJustification: "Activity selection is the canonical greedy problem; meeting rooms is a top-10 interview question at FAANG companies.",
      resources: [
        { title: "LeetCode #252 — Meeting Rooms", type: "practice", url: "https://leetcode.com/problems/meeting-rooms/" },
        { title: "LeetCode #253 — Meeting Rooms II", type: "practice", url: "https://leetcode.com/problems/meeting-rooms-ii/" },
      ],
    },
    {
      sessionNumber: 3,
      title: "Fractional Knapsack — Greedy vs DP",
      content: `### The Knapsack Problem Family

The knapsack problem has two variants that perfectly illustrate when greedy works and when it doesn't:

1. **Fractional Knapsack** (Greedy works) — Items can be broken into fractions
2. **0/1 Knapsack** (Greedy fails, use DP) — Items must be taken whole or not at all

### Fractional Knapsack

Given n items with weights and values, and a knapsack of capacity W, maximize total value. You can take fractions of items.

**Greedy strategy:** Sort items by value-to-weight ratio (value/weight) in descending order. Take as much of the best-ratio item as possible, then move to the next.

\`\`\`mermaid
graph LR
    A["Items sorted by value/weight"] --> B["Take item 1 fully"]
    B --> C{"Capacity left?"}
    C -->|Yes| D["Take item 2 fully"]
    D --> E{"Capacity left?"}
    E -->|Yes| F["Take fraction of item 3"]
    E -->|No| G["Done"]
    C -->|No| G
\`\`\`

### Why Greedy Works for Fractional Knapsack

**Exchange argument:** If OPT takes less of a higher-ratio item and more of a lower-ratio item, swapping equal weight between them increases total value (or keeps it the same). So the greedy solution that prioritizes higher ratios is optimal.

**Why Greedy Fails for 0/1 Knapsack:**

Consider items: [{weight:10, value:60}, {weight:20, value:100}, {weight:30, value:120}], W=50

| Approach | Selection | Value |
|----------|-----------|-------|
| Greedy (by ratio) | Item 1 (6.0) + Item 2 (5.0) | 160 |
| Optimal (DP) | Item 2 + Item 3 | 220 |

Greedy picks the best-ratio item first, but in 0/1 knapsack, this wastes capacity. The indivisibility constraint breaks the greedy choice property.

### Implementation

**Java — Fractional Knapsack:**
\`\`\`java
public double fractionalKnapsack(int capacity, int[][] items) {
    // items[i] = {weight, value}
    // Sort by value/weight ratio descending
    Integer[] indices = new Integer[items.length];
    for (int i = 0; i < items.length; i++) indices[i] = i;
    Arrays.sort(indices, (a, b) ->
        Double.compare((double) items[b][1] / items[b][0],
                        (double) items[a][1] / items[a][0]));

    double totalValue = 0;
    int remaining = capacity;
    for (int i : indices) {
        if (remaining == 0) break;
        int take = Math.min(items[i][0], remaining);
        totalValue += (double) take / items[i][0] * items[i][1];
        remaining -= take;
    }
    return totalValue;
}
\`\`\`

**Python — Fractional Knapsack:**
\`\`\`python
def fractional_knapsack(capacity: int, items: list[tuple[int, int]]) -> float:
    """Fractional knapsack. items = [(weight, value)]. O(n log n) time."""
    # Sort by value-to-weight ratio descending
    items.sort(key=lambda x: x[1] / x[0], reverse=True)
    total_value = 0.0
    remaining = capacity
    for weight, value in items:
        if remaining == 0:
            break
        take = min(weight, remaining)
        total_value += (take / weight) * value
        remaining -= take
    return total_value
\`\`\`

### Job Sequencing with Deadlines

Another classic greedy-with-sorting problem: given jobs with deadlines and profits, schedule jobs to maximize profit (each job takes 1 unit, at most one per time slot).

**Greedy:** Sort by profit descending. For each job, schedule it in the latest available slot before its deadline.

**Python — Job Sequencing:**
\`\`\`python
def job_sequencing(jobs: list[tuple[int, int]]) -> tuple[int, int]:
    """Jobs = [(deadline, profit)]. Returns (count, total_profit)."""
    jobs.sort(key=lambda x: x[1], reverse=True)
    max_deadline = max(d for d, _ in jobs)
    slots = [False] * (max_deadline + 1)
    count = total = 0
    for deadline, profit in jobs:
        for t in range(deadline, 0, -1):
            if not slots[t]:
                slots[t] = True
                count += 1
                total += profit
                break
    return count, total
\`\`\`

### Complexity

| Problem | Time | Space |
|---------|------|-------|
| Fractional Knapsack | O(n log n) | O(1) extra |
| Job Sequencing | O(n^2) naive, O(n log n) with Union-Find | O(n) |

### Key Interview Distinction

When an interviewer mentions "knapsack," immediately ask: "Can items be divided?" This one question determines whether the solution is greedy (O(n log n)) or DP (O(n*W)).`,
      objectives: [
        "Implement fractional knapsack using value-to-weight ratio sorting",
        "Explain why greedy fails for 0/1 knapsack with a concrete example",
        "Solve job sequencing with deadlines using greedy approach",
        "Compare fractional vs 0/1 knapsack time complexity",
      ],
      activities: [
        {
          description: "Implement fractional knapsack and test with 5 items; verify output matches manual calculation",
          durationMinutes: 20,
        },
        {
          description: "Create a counterexample where greedy fails for 0/1 knapsack; verify with brute force",
          durationMinutes: 15,
        },
      ],
      reviewQuestions: [
        "What sorting criterion does fractional knapsack use and why?:::Sort by value-to-weight ratio descending. Higher ratio means more value per unit of weight, so filling the knapsack with higher-ratio items first maximizes total value.",
        "Give a concrete example where greedy fails for 0/1 knapsack.:::Items: {w:10,v:60}, {w:20,v:100}, {w:30,v:120}, W=50. Greedy by ratio takes items 1+2 (value=160), but optimal is items 2+3 (value=220).",
      ],
      successCriteria: "Can implement fractional knapsack and clearly explain why it fails for 0/1 knapsack.",
      paretoJustification: "The fractional vs 0/1 knapsack distinction is asked directly in interviews to test greedy vs DP understanding.",
      resources: [
        { title: "GeeksforGeeks — Fractional Knapsack", type: "reading", url: "https://www.geeksforgeeks.org/fractional-knapsack-problem/" },
      ],
    },
    {
      sessionNumber: 4,
      title: "Huffman Coding — Optimal Prefix Codes",
      content: `### What is Huffman Coding?

**Huffman coding** is a greedy algorithm that produces optimal prefix-free binary codes for data compression. Characters with higher frequency get shorter codes, minimizing the total encoded length.

**Interview relevance:** Huffman coding tests your ability to use priority queues (min-heaps) and build trees greedily. It also appears in system design discussions about data compression.

### How Huffman Works

1. Create a leaf node for each character with its frequency
2. Insert all nodes into a min-heap (priority queue by frequency)
3. While the heap has more than one node:
   a. Extract the two minimum-frequency nodes
   b. Create a new internal node with these two as children, frequency = sum
   c. Insert the new node back into the heap
4. The remaining node is the root of the Huffman tree

\`\`\`mermaid
graph TD
    R["(15)"] --> L["(6)"]
    R --> RR["(9)"]
    L --> A["a (3)"]
    L --> B["b (3)"]
    RR --> C["c (4)"]
    RR --> D["d (5)"]
\`\`\`

For characters a:3, b:3, c:4, d:5 — codes would be: a=00, b=01, c=10, d=11.

### Why Huffman is Optimal

**Greedy choice:** At each step, combining the two least-frequent nodes is optimal because:
- Low-frequency characters should be deep in the tree (long codes)
- The exchange argument shows: if we combine two non-minimum nodes first, swapping them with the actual minimums reduces or equals the total cost

**Prefix-free property:** No code is a prefix of another code. This enables unambiguous decoding — you can decode left to right without lookahead.

### Implementation

**Java — Huffman Coding:**
\`\`\`java
class HuffmanNode implements Comparable<HuffmanNode> {
    char ch;
    int freq;
    HuffmanNode left, right;

    HuffmanNode(char ch, int freq) {
        this.ch = ch;
        this.freq = freq;
    }

    HuffmanNode(int freq, HuffmanNode left, HuffmanNode right) {
        this.ch = '\\0';
        this.freq = freq;
        this.left = left;
        this.right = right;
    }

    public int compareTo(HuffmanNode other) {
        return this.freq - other.freq;
    }
}

public Map<Character, String> buildHuffmanCodes(Map<Character, Integer> freqMap) {
    PriorityQueue<HuffmanNode> pq = new PriorityQueue<>();
    for (var entry : freqMap.entrySet()) {
        pq.offer(new HuffmanNode(entry.getKey(), entry.getValue()));
    }
    while (pq.size() > 1) {
        HuffmanNode left = pq.poll();
        HuffmanNode right = pq.poll();
        pq.offer(new HuffmanNode(left.freq + right.freq, left, right));
    }
    Map<Character, String> codes = new HashMap<>();
    buildCodes(pq.poll(), "", codes);
    return codes;
}

private void buildCodes(HuffmanNode node, String code, Map<Character, String> codes) {
    if (node == null) return;
    if (node.left == null && node.right == null) {
        codes.put(node.ch, code.isEmpty() ? "0" : code);
        return;
    }
    buildCodes(node.left, code + "0", codes);
    buildCodes(node.right, code + "1", codes);
}
\`\`\`

**Python — Huffman Coding:**
\`\`\`python
import heapq
from collections import Counter

class HuffmanNode:
    def __init__(self, ch, freq, left=None, right=None):
        self.ch = ch
        self.freq = freq
        self.left = left
        self.right = right

    def __lt__(self, other):
        return self.freq < other.freq

def build_huffman_codes(text: str) -> dict[str, str]:
    """Build Huffman codes from text. O(n log n) time."""
    freq = Counter(text)
    heap = [HuffmanNode(ch, f) for ch, f in freq.items()]
    heapq.heapify(heap)

    while len(heap) > 1:
        left = heapq.heappop(heap)
        right = heapq.heappop(heap)
        merged = HuffmanNode(None, left.freq + right.freq, left, right)
        heapq.heappush(heap, merged)

    codes = {}
    def build(node, code=""):
        if node.left is None and node.right is None:
            codes[node.ch] = code or "0"
            return
        build(node.left, code + "0")
        build(node.right, code + "1")

    build(heap[0])
    return codes
\`\`\`

### Complexity

| Operation | Time | Space |
|-----------|------|-------|
| Build Huffman Tree | O(n log n) | O(n) |
| Encode text | O(m) | O(m) |
| Decode text | O(m) | O(1) extra |

Where n = unique characters, m = text length.

### Real-World Applications

- **GZIP/DEFLATE:** Uses Huffman coding as part of the compression pipeline
- **JPEG:** Uses Huffman coding for entropy coding of quantized DCT coefficients
- **MP3:** Huffman coding for lossless part of the lossy compression
- **Network protocols:** HTTP/2 uses HPACK which includes Huffman coding for header compression`,
      objectives: [
        "Build a Huffman tree using a min-heap",
        "Generate optimal prefix-free codes from the Huffman tree",
        "Explain why Huffman coding produces optimal prefix codes",
        "Identify real-world applications of Huffman coding",
      ],
      activities: [
        {
          description: "Build a Huffman tree by hand for the string 'abracadabra' and compute the encoded bit length vs fixed-width encoding",
          durationMinutes: 20,
        },
        {
          description: "Implement Huffman encoding and decoding; verify decode(encode(text)) == text for 3 test strings",
          durationMinutes: 25,
        },
      ],
      reviewQuestions: [
        "Why must Huffman codes be prefix-free?:::Prefix-free codes allow unambiguous decoding without lookahead. If 'a'=0 and 'b'=01, the bit sequence '01' is ambiguous (is it 'ab' or 'b'?). Prefix-free ensures each code is uniquely decodable.",
        "What data structure is essential for efficient Huffman tree construction?:::A min-heap (priority queue). It allows O(log n) extraction of the two minimum-frequency nodes and O(log n) insertion of the merged node, giving O(n log n) total.",
      ],
      successCriteria: "Can build a Huffman tree, generate codes, and explain optimality.",
      paretoJustification: "Huffman coding is the most-asked greedy + priority queue problem and appears in compression system design questions.",
      resources: [
        { title: "Visualgo — Huffman Coding", type: "interactive", url: "https://visualgo.net/en/huffman" },
      ],
    },
    {
      sessionNumber: 5,
      title: "Interval Problems — Merge & Remove",
      content: `### Interval Problems Overview

Interval problems are among the most common greedy problems in interviews. The key insight: **sort first, then process linearly.** The choice of sort key (start vs end) depends on the problem.

### Merge Intervals (LeetCode #56)

Given a list of intervals, merge all overlapping intervals.

**Approach:** Sort by start time. Iterate and merge if the current interval overlaps with the previous one.

**Java — Merge Intervals:**
\`\`\`java
public int[][] merge(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
    List<int[]> merged = new ArrayList<>();
    merged.add(intervals[0]);
    for (int i = 1; i < intervals.length; i++) {
        int[] last = merged.get(merged.size() - 1);
        if (intervals[i][0] <= last[1]) {
            last[1] = Math.max(last[1], intervals[i][1]);
        } else {
            merged.add(intervals[i]);
        }
    }
    return merged.toArray(new int[0][]);
}
\`\`\`

**Python — Merge Intervals:**
\`\`\`python
def merge(intervals: list[list[int]]) -> list[list[int]]:
    """Merge overlapping intervals. O(n log n) time."""
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for start, end in intervals[1:]:
        if start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged
\`\`\`

### Non-Overlapping Intervals (LeetCode #435)

Given intervals, find the minimum number of intervals to remove so the rest are non-overlapping. This is equivalent to: find the maximum number of non-overlapping intervals (activity selection!).

**Greedy strategy:** Sort by end time. Count non-overlapping intervals greedily. Answer = total - count.

**Java — Non-Overlapping Intervals:**
\`\`\`java
public int eraseOverlapIntervals(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> a[1] - b[1]);
    int nonOverlap = 1;
    int lastEnd = intervals[0][1];
    for (int i = 1; i < intervals.length; i++) {
        if (intervals[i][0] >= lastEnd) {
            nonOverlap++;
            lastEnd = intervals[i][1];
        }
    }
    return intervals.length - nonOverlap;
}
\`\`\`

**Python — Non-Overlapping Intervals:**
\`\`\`python
def erase_overlap_intervals(intervals: list[list[int]]) -> int:
    """Minimum removals for non-overlapping. O(n log n) time."""
    intervals.sort(key=lambda x: x[1])  # Sort by end time
    non_overlap = 1
    last_end = intervals[0][1]
    for start, end in intervals[1:]:
        if start >= last_end:
            non_overlap += 1
            last_end = end
    return len(intervals) - non_overlap
\`\`\`

### Minimum Arrows to Burst Balloons (LeetCode #452)

Balloons are intervals on the x-axis. An arrow at x bursts all balloons where x_start <= x <= x_end. Find the minimum number of arrows.

This is equivalent to finding the minimum number of points that "hit" all intervals — essentially the interval scheduling problem in disguise.

**Greedy:** Sort by end point. Shoot an arrow at the end of the first balloon. Skip all balloons hit by this arrow. Repeat.

**Java — Minimum Arrows:**
\`\`\`java
public int findMinArrowShots(int[][] points) {
    Arrays.sort(points, (a, b) -> Integer.compare(a[1], b[1]));
    int arrows = 1;
    int arrowPos = points[0][1];
    for (int i = 1; i < points.length; i++) {
        if (points[i][0] > arrowPos) {
            arrows++;
            arrowPos = points[i][1];
        }
    }
    return arrows;
}
\`\`\`

**Python — Minimum Arrows:**
\`\`\`python
def find_min_arrow_shots(points: list[list[int]]) -> int:
    """Minimum arrows to burst all balloons. O(n log n) time."""
    points.sort(key=lambda x: x[1])
    arrows = 1
    arrow_pos = points[0][1]
    for start, end in points[1:]:
        if start > arrow_pos:
            arrows += 1
            arrow_pos = end
    return arrows
\`\`\`

### Insert Interval (LeetCode #57)

Given sorted non-overlapping intervals and a new interval, insert and merge. No sorting needed since input is already sorted.

**Python — Insert Interval:**
\`\`\`python
def insert(intervals: list[list[int]], new: list[int]) -> list[list[int]]:
    result = []
    for i, (s, e) in enumerate(intervals):
        if e < new[0]:
            result.append([s, e])
        elif s > new[1]:
            result.append(new)
            return result + intervals[i:]
        else:
            new = [min(s, new[0]), max(e, new[1])]
    result.append(new)
    return result
\`\`\`

### Interval Problem Decision Tree

\`\`\`mermaid
graph TD
    A["Interval Problem"] --> B{"What to find?"}
    B -->|Max non-overlapping| C["Sort by END time"]
    B -->|Merge overlapping| D["Sort by START time"]
    B -->|Min rooms/resources| E["Min-heap or Sweep line"]
    B -->|Min removals| F["Sort by END time, count kept"]
    B -->|Min points to cover all| G["Sort by END time"]
\`\`\`

### Key Pattern

Almost every interval problem follows: **Sort -> Linear scan -> Track endpoint.** The only question is: sort by start or end? Use end time when maximizing non-overlap or minimizing coverage points. Use start time when merging.`,
      objectives: [
        "Implement merge intervals, non-overlapping intervals, and minimum arrows",
        "Choose the correct sort key (start vs end) based on the problem type",
        "Recognize that non-overlapping intervals is activity selection in disguise",
        "Apply the interval problem decision tree to new problems",
      ],
      activities: [
        {
          description: "Solve LC #56 (Merge Intervals) and #435 (Non-Overlapping Intervals); note how the sort key differs",
          durationMinutes: 25,
        },
        {
          description: "Solve LC #452 (Minimum Arrows) and verify it's equivalent to activity selection with a different framing",
          durationMinutes: 20,
        },
      ],
      reviewQuestions: [
        "When do you sort by end time vs start time for interval problems?:::Sort by end time when maximizing non-overlapping intervals or minimizing coverage points (activity selection pattern). Sort by start time when merging overlapping intervals.",
        "Why is LC #435 (Non-Overlapping Intervals) equivalent to activity selection?:::Minimum removals = total - maximum non-overlapping. Finding maximum non-overlapping intervals is exactly the activity selection problem (sort by end, greedily pick non-conflicting).",
      ],
      successCriteria: "Can solve merge, non-overlapping, and arrows problems and explain the sort-key decision.",
      paretoJustification: "Interval problems appear in ~15% of FAANG greedy interviews; mastering the pattern covers 5+ LeetCode problems.",
      resources: [
        { title: "LeetCode #56 — Merge Intervals", type: "practice", url: "https://leetcode.com/problems/merge-intervals/" },
        { title: "LeetCode #435 — Non-Overlapping Intervals", type: "practice", url: "https://leetcode.com/problems/non-overlapping-intervals/" },
        { title: "LeetCode #452 — Minimum Arrows to Burst Balloons", type: "practice", url: "https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/" },
      ],
    },
    {
      sessionNumber: 6,
      title: "Interview Problems — Jump Game, Gas Station & More",
      content: `### LeetCode #55 — Jump Game

Given an array where each element represents the max jump length from that position, determine if you can reach the last index.

**Greedy insight:** Track the farthest reachable index. If at any point your current index exceeds the farthest reachable, you're stuck.

**Java — Jump Game:**
\`\`\`java
public boolean canJump(int[] nums) {
    int farthest = 0;
    for (int i = 0; i < nums.length; i++) {
        if (i > farthest) return false;
        farthest = Math.max(farthest, i + nums[i]);
    }
    return true;
}
\`\`\`

**Python — Jump Game:**
\`\`\`python
def can_jump(nums: list[int]) -> bool:
    """LC #55: Can we reach the last index? O(n) time, O(1) space."""
    farthest = 0
    for i, jump in enumerate(nums):
        if i > farthest:
            return False
        farthest = max(farthest, i + jump)
    return True
\`\`\`

### LeetCode #45 — Jump Game II

Find the **minimum number of jumps** to reach the last index (guaranteed reachable).

**Greedy insight:** Use BFS-like level expansion. Track the current jump's boundary and the farthest reachable in this "level." When you hit the boundary, you must jump.

**Java — Jump Game II:**
\`\`\`java
public int jump(int[] nums) {
    int jumps = 0, curEnd = 0, farthest = 0;
    for (int i = 0; i < nums.length - 1; i++) {
        farthest = Math.max(farthest, i + nums[i]);
        if (i == curEnd) {
            jumps++;
            curEnd = farthest;
        }
    }
    return jumps;
}
\`\`\`

**Python — Jump Game II:**
\`\`\`python
def jump(nums: list[int]) -> int:
    """LC #45: Minimum jumps to reach end. O(n) time, O(1) space."""
    jumps = cur_end = farthest = 0
    for i in range(len(nums) - 1):
        farthest = max(farthest, i + nums[i])
        if i == cur_end:
            jumps += 1
            cur_end = farthest
    return jumps
\`\`\`

### LeetCode #134 — Gas Station

There are n gas stations in a circle. gas[i] = fuel gained, cost[i] = fuel to next station. Find the starting station index for a complete circuit, or -1 if impossible.

**Greedy insight:** If total gas >= total cost, a solution exists. Track the running surplus. If it drops below 0, the answer must be after the current station (reset start to next station).

**Java — Gas Station:**
\`\`\`java
public int canCompleteCircuit(int[] gas, int[] cost) {
    int totalSurplus = 0, currentSurplus = 0, start = 0;
    for (int i = 0; i < gas.length; i++) {
        int diff = gas[i] - cost[i];
        totalSurplus += diff;
        currentSurplus += diff;
        if (currentSurplus < 0) {
            start = i + 1;
            currentSurplus = 0;
        }
    }
    return totalSurplus >= 0 ? start : -1;
}
\`\`\`

**Python — Gas Station:**
\`\`\`python
def can_complete_circuit(gas: list[int], cost: list[int]) -> int:
    """LC #134: Find starting gas station for full circuit. O(n) time."""
    total_surplus = current_surplus = 0
    start = 0
    for i in range(len(gas)):
        diff = gas[i] - cost[i]
        total_surplus += diff
        current_surplus += diff
        if current_surplus < 0:
            start = i + 1
            current_surplus = 0
    return start if total_surplus >= 0 else -1
\`\`\`

### Pattern Recognition

\`\`\`mermaid
graph TD
    A["Greedy Interview Problems"] --> B["Reachability"]
    A --> C["Circular Arrays"]
    A --> D["Intervals"]
    B --> E["Jump Game: track farthest"]
    B --> F["Jump Game II: BFS levels"]
    C --> G["Gas Station: reset on deficit"]
    D --> H["Non-overlapping: sort by end"]
    D --> I["Min arrows: sort by end"]
\`\`\`

### Additional Interview Problems

**Task Scheduler (LC #621):** Greedy with cooldown — always schedule the most frequent task first. Answer = max((maxFreq - 1) * (n + 1) + countOfMax, totalTasks).

**Assign Cookies (LC #455):** Sort both children's greed factors and cookie sizes. Match smallest satisfying cookie to smallest child.

**Best Time to Buy and Sell Stock II (LC #122):** Add every profitable day-to-day increase. Greedy: if tomorrow's price > today's, "buy today, sell tomorrow."

**Python — Stock Profit:**
\`\`\`python
def max_profit(prices: list[int]) -> int:
    """LC #122: Max profit with unlimited transactions. O(n) time."""
    return sum(max(prices[i+1] - prices[i], 0) for i in range(len(prices)-1))
\`\`\`

### Interview Strategy for Greedy Problems

1. **Identify the greedy signal:** sorting, intervals, "minimum/maximum"
2. **State the greedy choice:** what do you pick at each step?
3. **Prove or argue correctness:** exchange argument, even informally
4. **Code it:** usually O(n) or O(n log n)
5. **Check edge cases:** empty input, single element, all same values

### Complexity Summary

| Problem | Time | Space | Key Insight |
|---------|------|-------|-------------|
| Jump Game | O(n) | O(1) | Track farthest reachable |
| Jump Game II | O(n) | O(1) | BFS-like level expansion |
| Gas Station | O(n) | O(1) | Reset start on deficit |
| Non-Overlapping | O(n log n) | O(1) | Activity selection |
| Min Arrows | O(n log n) | O(1) | Sort by end, count groups |`,
      objectives: [
        "Solve Jump Game I and II with the farthest-reachable greedy pattern",
        "Implement the Gas Station circular-array greedy algorithm",
        "Recognize greedy patterns across different problem framings",
        "Apply a systematic approach to greedy interview problems",
      ],
      activities: [
        {
          description: "Solve LC #55 and #45 back-to-back; trace through [2,3,1,1,4] by hand before coding",
          durationMinutes: 25,
        },
        {
          description: "Solve LC #134 (Gas Station); verify with gas=[1,2,3,4,5] cost=[3,4,5,1,2] (answer: 3)",
          durationMinutes: 20,
        },
      ],
      reviewQuestions: [
        "In Jump Game II, why does the BFS-level approach give minimum jumps?:::Each 'level' represents all positions reachable with exactly k jumps. By expanding the farthest reach at each level and incrementing jumps only when we exhaust the current level, we find the minimum jumps (like BFS finds shortest path).",
        "In Gas Station, why does resetting the start index when surplus < 0 work?:::If running surplus goes negative at station i, then no station from the current start through i can be the answer (they all lead to a deficit at or before i). So the answer must be after i. If total surplus >= 0, a valid start exists.",
      ],
      successCriteria: "Can solve Jump Game, Jump Game II, and Gas Station in O(n) and articulate the greedy choice for each.",
      paretoJustification: "These are the most-asked greedy problems at FAANG; mastering them covers the core patterns interviewers test.",
      resources: [
        { title: "LeetCode #55 — Jump Game", type: "practice", url: "https://leetcode.com/problems/jump-game/" },
        { title: "LeetCode #45 — Jump Game II", type: "practice", url: "https://leetcode.com/problems/jump-game-ii/" },
        { title: "LeetCode #134 — Gas Station", type: "practice", url: "https://leetcode.com/problems/gas-station/" },
      ],
    },
  ];

  // ── Quiz Bank (15 questions) ──────────────────────────────────────────────

  const quizBank = [
    { question: "What two properties must hold for a greedy algorithm to produce an optimal solution?", format: "mcq", difficulty: 1, bloomLabel: "Remember", options: ["A) Divide and conquer, memoization", "B) Greedy choice property, optimal substructure", "C) Overlapping subproblems, optimal substructure", "D) Amortized analysis, greedy choice property"], correctAnswer: "B", explanation: "**Correct: B) Greedy choice property and optimal substructure.** The greedy choice property means a globally optimal solution can be built from locally optimal choices. Optimal substructure means the problem's optimal solution contains optimal solutions to subproblems. DP requires overlapping subproblems (option C), not greedy." },
    { question: "In the activity selection problem, which sorting criterion leads to an optimal greedy solution?", format: "mcq", difficulty: 1, bloomLabel: "Remember", options: ["A) Sort by start time ascending", "B) Sort by duration ascending", "C) Sort by finish time ascending", "D) Sort by profit descending"], correctAnswer: "C", explanation: "**Correct: C) Sort by finish time ascending.** Picking the activity that finishes earliest maximizes remaining time for subsequent activities. Sorting by start time or duration does not guarantee optimality. The exchange argument proves: replacing any first choice with the earliest-finishing activity never reduces the total count." },
    { question: "Why does the greedy approach fail for the 0/1 Knapsack problem?", format: "mcq", difficulty: 2, bloomLabel: "Understand", options: ["A) Items cannot be sorted by value", "B) The problem has no optimal substructure", "C) Taking the highest-ratio item may waste capacity that could fit a more valuable combination", "D) The problem requires backtracking"], correctAnswer: "C", explanation: "**Correct: C).** In 0/1 knapsack, items are indivisible. Greedily taking the highest value/weight ratio item may leave capacity that cannot be filled optimally. Example: items {w:10,v:60}, {w:20,v:100}, {w:30,v:120} with W=50. Greedy takes items 1+2 (v=160), but optimal is items 2+3 (v=220)." },
    { question: "What is the time complexity of building a Huffman tree for n unique characters?", format: "mcq", difficulty: 2, bloomLabel: "Apply", options: ["A) O(n)", "B) O(n log n)", "C) O(n^2)", "D) O(2^n)"], correctAnswer: "B", explanation: "**Correct: B) O(n log n).** We perform n-1 iterations, each extracting two minimum elements and inserting one merged node into the min-heap. Each heap operation is O(log n), giving O(n log n) total. Building the initial heap is O(n), dominated by the extraction phase." },
    { question: "In LeetCode #55 (Jump Game), what does the greedy algorithm track?", format: "mcq", difficulty: 2, bloomLabel: "Apply", options: ["A) The minimum number of jumps", "B) The farthest reachable index", "C) All possible paths to the end", "D) The shortest path length"], correctAnswer: "B", explanation: "**Correct: B) The farthest reachable index.** At each position i, we update farthest = max(farthest, i + nums[i]). If we ever reach a position i > farthest, we're stuck and return false. This runs in O(n) time with O(1) space." },
    { question: "For Merge Intervals (LC #56), which sort order is correct?", format: "mcq", difficulty: 2, bloomLabel: "Apply", options: ["A) Sort by end time ascending", "B) Sort by start time ascending", "C) Sort by interval length descending", "D) No sorting needed"], correctAnswer: "B", explanation: "**Correct: B) Sort by start time ascending.** For merging, we process intervals left-to-right. If the current interval's start <= previous end, they overlap and we extend. Sorting by end time is used for different problems (activity selection, non-overlapping). This distinction is critical in interviews." },
    { question: "In the Gas Station problem (LC #134), if total gas >= total cost, how many valid starting points exist?", format: "mcq", difficulty: 3, bloomLabel: "Analyze", options: ["A) Zero", "B) Exactly one", "C) At least one, possibly more", "D) All stations are valid"], correctAnswer: "B", explanation: "**Correct: B) Exactly one.** The problem guarantees a unique solution when one exists. This can be proven: if two different starts both work, the surplus patterns would create a contradiction. The greedy algorithm finds this unique start by resetting whenever the running surplus goes negative." },
    { question: "What is the exchange argument in the context of greedy algorithms?", format: "mcq", difficulty: 2, bloomLabel: "Understand", options: ["A) A technique to convert DP solutions to greedy", "B) A proof technique showing that swapping OPT's choice for greedy's choice doesn't worsen the solution", "C) A method to exchange items between knapsacks", "D) A way to swap nodes in a Huffman tree"], correctAnswer: "B", explanation: "**Correct: B).** The exchange argument proves greedy correctness by assuming an optimal solution OPT exists that differs from the greedy solution G. We show that replacing OPT's choice with G's choice at the first point of divergence yields a solution that is at least as good. Repeating this transforms OPT into G." },
    { question: "In Jump Game II (LC #45), why is the greedy approach equivalent to BFS?", format: "mcq", difficulty: 3, bloomLabel: "Analyze", options: ["A) Both use a queue data structure", "B) Each 'jump level' represents all positions reachable with exactly k jumps, like BFS levels", "C) Both have O(n^2) time complexity", "D) BFS always finds the greedy choice"], correctAnswer: "B", explanation: "**Correct: B).** In Jump Game II, curEnd marks the boundary of the current BFS level. All positions from the previous boundary+1 to curEnd are reachable with k jumps. We track the farthest reach within this level. When we hit curEnd, we 'jump' to the next level (increment jumps, set curEnd = farthest). This is BFS without an explicit queue." },
    { question: "For Non-Overlapping Intervals (LC #435), the answer equals:", format: "mcq", difficulty: 2, bloomLabel: "Apply", options: ["A) The number of overlapping pairs", "B) Total intervals minus maximum non-overlapping intervals", "C) The number of intervals that start before the previous ends", "D) Total intervals minus 1"], correctAnswer: "B", explanation: "**Correct: B).** Minimum removals = total - max non-overlapping. Finding max non-overlapping is the activity selection problem (sort by end time, greedily pick). This reframing is the key insight interviewers look for." },
    { question: "Which greedy strategy does Huffman coding use at each step?", format: "mcq", difficulty: 2, bloomLabel: "Understand", options: ["A) Combine the two highest-frequency nodes", "B) Combine the two lowest-frequency nodes", "C) Always add the new node as a left child", "D) Balance the tree at each step"], correctAnswer: "B", explanation: "**Correct: B) Combine the two lowest-frequency nodes.** Low-frequency characters get longer codes (deeper in tree), high-frequency characters get shorter codes. Combining the two smallest frequencies first ensures the most common characters stay near the root with shorter bit representations." },
    { question: "In Minimum Arrows to Burst Balloons (LC #452), why sort by end point?", format: "mcq", difficulty: 3, bloomLabel: "Analyze", options: ["A) End points determine balloon size", "B) Shooting at the earliest end point maximizes the number of balloons burst by one arrow", "C) Start points are always the same", "D) It reduces time complexity to O(n)"], correctAnswer: "B", explanation: "**Correct: B).** Sorting by end and placing the arrow at the first balloon's end point bursts all balloons that start at or before this point. This is the greedy choice: committing to the earliest possible shot covers the most overlapping balloons. It's the interval scheduling problem reframed as covering points." },
    { question: "What is the key difference between fractional and 0/1 knapsack complexity?", format: "mcq", difficulty: 3, bloomLabel: "Analyze", options: ["A) Both are O(n log n)", "B) Fractional is O(n log n) greedy; 0/1 is O(n*W) DP", "C) Fractional is O(n^2); 0/1 is O(n log n)", "D) Both require dynamic programming"], correctAnswer: "B", explanation: "**Correct: B).** Fractional knapsack: sort by ratio O(n log n), then one pass O(n). Total: O(n log n). 0/1 knapsack: DP with n items and W capacity gives O(n*W) pseudo-polynomial time. The divisibility of items in fractional knapsack enables the greedy approach." },
    { question: "In the Gas Station problem, when the running surplus drops below 0 at station i, the algorithm:", format: "mcq", difficulty: 3, bloomLabel: "Apply", options: ["A) Returns -1 immediately", "B) Resets start to i+1 and surplus to 0", "C) Backtracks to the previous start", "D) Skips station i and continues"], correctAnswer: "B", explanation: "**Correct: B).** If running surplus < 0 at station i, no station from the current start through i can be a valid starting point (they all lead to a deficit by station i). So we reset: start = i+1, currentSurplus = 0. The total surplus check at the end determines if any valid start exists." },
    { question: "Given intervals [[1,3],[2,6],[8,10],[15,18]], what does Merge Intervals return?", format: "mcq", difficulty: 2, bloomLabel: "Apply", options: ["A) [[1,6],[8,10],[15,18]]", "B) [[1,3],[2,6],[8,10],[15,18]]", "C) [[1,10],[15,18]]", "D) [[1,18]]"], correctAnswer: "A", explanation: "**Correct: A) [[1,6],[8,10],[15,18]].** After sorting by start (already sorted): [1,3] and [2,6] overlap (2 <= 3), merge to [1,6]. [8,10] does not overlap with [1,6] (8 > 6). [15,18] does not overlap with [8,10] (15 > 10). Result: 3 intervals." },
  ];

  // ── Cheat Sheet ───────────────────────────────────────────────────────────

  const cheatSheet = `# Greedy Algorithms Cheat Sheet

## 1. When Greedy Works
- **Greedy Choice Property:** local optimum leads to global optimum
- **Optimal Substructure:** optimal solution contains optimal sub-solutions
- **Proof:** Exchange argument (swap OPT's choice for greedy's, show no worse)

## 2. Interval Problems Pattern
| Problem | Sort By | Action |
|---------|---------|--------|
| Activity Selection | End time | Pick non-overlapping |
| Merge Intervals | Start time | Extend overlapping |
| Non-Overlapping (LC #435) | End time | Count kept = total - answer |
| Min Arrows (LC #452) | End time | Count groups |
| Meeting Rooms II | Start time | Min-heap of ends |

## 3. Key Algorithms

**Fractional Knapsack:** Sort by value/weight ratio desc, take greedily. O(n log n).

**Huffman Coding:**
\`\`\`
1. Build min-heap of (freq, node)
2. While heap.size > 1: merge two smallest
3. Traverse tree: left=0, right=1
\`\`\`

**Jump Game (LC #55):** Track farthest = max(farthest, i + nums[i]). Stuck if i > farthest.

**Jump Game II (LC #45):** BFS levels — increment jumps when i == curEnd.

**Gas Station (LC #134):** Reset start when surplus < 0. Valid if totalGas >= totalCost.

## 4. Java Code Templates

\`\`\`java
// Activity Selection
Arrays.sort(intervals, (a, b) -> a[1] - b[1]);
int count = 1, lastEnd = intervals[0][1];
for (int i = 1; i < intervals.length; i++)
    if (intervals[i][0] >= lastEnd) { count++; lastEnd = intervals[i][1]; }

// Merge Intervals
Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
// extend last if overlap, else add new

// Jump Game
int farthest = 0;
for (int i = 0; i < n; i++) {
    if (i > farthest) return false;
    farthest = Math.max(farthest, i + nums[i]);
}
\`\`\`

## 5. Python Code Templates

\`\`\`python
# Activity Selection
intervals.sort(key=lambda x: x[1])
count, last_end = 1, intervals[0][1]
for s, e in intervals[1:]:
    if s >= last_end: count += 1; last_end = e

# Merge Intervals
intervals.sort(key=lambda x: x[0])
# extend merged[-1] if overlap, else append

# Jump Game
farthest = 0
for i, jump in enumerate(nums):
    if i > farthest: return False
    farthest = max(farthest, i + jump)
\`\`\`

## 6. Greedy vs DP Decision
- Can items be divided? -> Greedy (Fractional Knapsack)
- Must items be whole? -> DP (0/1 Knapsack)
- Intervals + max/min? -> Greedy (sort + scan)
- Overlapping subproblems? -> DP
- One-pass sufficient? -> Likely Greedy

## 7. Common Mistakes
- Using greedy when problem needs DP (0/1 knapsack, coin change with arbitrary denominations)
- Sorting by wrong key (start vs end)
- Not handling edge cases (empty input, single element)
- Integer overflow in Java comparators (use Integer.compare, not a-b for large values)`;

  return {
    topic: "Greedy Algorithms",
    category: "Algorithms",
    cheatSheet,
    resources: [
      { title: "CLRS Chapter 16 — Greedy Algorithms", author: "Cormen et al.", category: "books", justification: "Definitive reference with proofs of correctness", bestFor: "Deep understanding", estimatedTime: "4 hours", cost: "Paid", confidence: "HIGH" },
      { title: "NeetCode Greedy Playlist", author: "NeetCode", category: "youtube", justification: "Visual explanations of top greedy problems", bestFor: "Visual learners", estimatedTime: "3 hours", cost: "Free", confidence: "HIGH", url: "https://youtube.com/neetcode" },
      { title: "LeetCode Greedy Tag", author: "LeetCode", category: "interactive", justification: "All greedy-tagged problems sorted by frequency", bestFor: "Practice", estimatedTime: "20+ hours", cost: "Freemium", confidence: "HIGH", url: "https://leetcode.com/tag/greedy/" },
      { title: "Algorithm Design by Kleinberg & Tardos", author: "Kleinberg & Tardos", category: "books", justification: "Best explanation of exchange arguments and greedy proofs", bestFor: "Proof techniques", estimatedTime: "3 hours", cost: "Paid", confidence: "HIGH" },
    ],
    ladder: {
      levels: [
        { level: 1, name: "Novice", dreyfusLabel: "Novice", description: "Can explain the greedy approach and when it works vs DP", observableSkills: ["Explain greedy choice property", "Identify greedy vs DP problems"], milestoneProject: { title: "Activity Selection Implementation", description: "Implement activity selection with proof sketch", estimatedHours: 2 }, commonPlateaus: ["Trying greedy on DP problems"], estimatedHours: 4, prerequisites: ["Basic sorting"] },
        { level: 2, name: "Advanced Beginner", dreyfusLabel: "Advanced Beginner", description: "Can solve standard greedy problems with correct sorting", observableSkills: ["Merge intervals", "Fractional knapsack", "Jump Game"], milestoneProject: { title: "Solve 5 Easy/Medium Greedy Problems", description: "LC #55, #56, #252, #435, #455", estimatedHours: 5 }, commonPlateaus: ["Sorting by wrong key (start vs end)"], estimatedHours: 8, prerequisites: ["Sorting", "Arrays"] },
        { level: 3, name: "Competent", dreyfusLabel: "Competent", description: "Can solve medium greedy problems and prove correctness", observableSkills: ["Gas Station", "Jump Game II", "Huffman Coding"], milestoneProject: { title: "Implement Huffman Coding End-to-End", description: "Build encoder/decoder with priority queue", estimatedHours: 4 }, commonPlateaus: ["Difficulty proving greedy correctness"], estimatedHours: 12, prerequisites: ["Priority queues", "Heaps"] },
        { level: 4, name: "Proficient", dreyfusLabel: "Proficient", description: "Can solve hard greedy problems and recognize greedy in disguise", observableSkills: ["Task Scheduler", "Minimum platforms", "Greedy + heap combinations"], milestoneProject: { title: "Solve 5 Hard Greedy Problems", description: "LC #45, #134, #621, #452, #630", estimatedHours: 6 }, commonPlateaus: ["Missing greedy in problems framed differently"], estimatedHours: 15, prerequisites: ["BFS/DFS", "Advanced heap usage"] },
        { level: 5, name: "Expert", dreyfusLabel: "Expert", description: "Can design greedy solutions for novel problems and prove optimality", observableSkills: ["Exchange argument proofs", "Greedy in system design", "Novel problem solving"], milestoneProject: { title: "Design Optimal Scheduling System", description: "System design: job scheduler with priorities, deadlines, and resource constraints", estimatedHours: 5 }, commonPlateaus: ["Formal proof writing"], estimatedHours: 20, prerequisites: ["System design basics", "Mathematical proofs"] },
      ],
    },
    plan: {
      overview: "Master greedy algorithms from foundations to interview-ready in 6 sessions. Covers the greedy paradigm, interval scheduling, knapsack variants, Huffman coding, and top LeetCode problems.",
      skippedTopics: "Matroid theory, Kruskal's/Prim's MST (covered in Graph Algorithms), scheduling with weighted jobs (DP hybrid)",
      sessions,
    },
    quizBank,
    interviewTips: "Always state the greedy choice explicitly. Mention the exchange argument even informally. For interval problems, clarify inclusive vs exclusive endpoints. Compare greedy vs DP when relevant.",
    commonMistakes: "Applying greedy to 0/1 knapsack or non-canonical coin change. Sorting by start when end is needed (or vice versa). Forgetting edge cases: empty array, single element. Using a[1]-b[1] comparator in Java (overflow risk with large values).",
    patterns: "Sort-then-scan, earliest-deadline-first, farthest-reachable, deficit-reset, ratio-based selection, sweep line",
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  const topics = [buildGreedyAlgorithmsTopic()];

  const outputPath = path.join(__dirname, "..", "public", "content", "greedy-algorithms.json");

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
      // Check content length
      const wordCount = s.content.split(/\s+/).length;
      if (wordCount < 400) {
        console.warn(`WARN: Session ${s.sessionNumber} "${s.title}" has only ${wordCount} words (target: 500-800)`);
      }
      if (wordCount > 1000) {
        console.warn(`WARN: Session ${s.sessionNumber} "${s.title}" has ${wordCount} words (target: 500-800)`);
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
