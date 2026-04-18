#!/usr/bin/env node
// ────────────────────────────────────────────────────────────────────────────
// generate-fenwick.js — Generates fenwick-tree.json with Fenwick Tree
// (Binary Indexed Tree) topic content
// ────────────────────────────────────────────────────────────────────────────

const fs = require("fs");
const path = require("path");

function buildFenwickTreeTopic() {
  const sessions = [
    // ── Session 1: Introduction ───────────────────────────────────────────
    {
      sessionNumber: 1,
      title: "Introduction to Fenwick Tree (BIT)",
      content: `### What is a Fenwick Tree?

A **Fenwick Tree**, also called a **Binary Indexed Tree (BIT)**, is a data structure that efficiently supports **prefix sum queries** and **point updates** on an array. Invented by Peter Fenwick in 1994, it strikes a perfect balance between simplicity and performance.

**Why it matters in interviews:** Fenwick Trees appear in problems involving cumulative frequency tables, range sum queries, count of inversions, and order-statistics. They are simpler to implement than Segment Trees and use less memory, making them a favorite in competitive programming and FAANG interviews.

### The Problem BIT Solves

Given an array of n numbers, we want to:
1. **Update** a single element
2. **Query** the prefix sum from index 1 to i

A naive approach gives O(1) update / O(n) query, or O(n) update / O(1) query. A Fenwick Tree achieves **O(log n) for both** operations with only O(n) space.

### The Binary Representation Trick

The genius of BIT lies in exploiting the **lowest set bit** (LSB) of an index's binary representation. The LSB of a number x is extracted using:

\`\`\`
lowbit(x) = x & (-x)
\`\`\`

This works because -x in two's complement flips all bits and adds 1, so AND-ing isolates the rightmost 1-bit.

**Examples:**
| Decimal | Binary | x & (-x) | LSB value |
|---------|--------|----------|-----------|
| 6       | 110    | 010      | 2         |
| 12      | 1100   | 0100     | 4         |
| 8       | 1000   | 1000     | 8         |
| 7       | 0111   | 0001     | 1         |

### How BIT Stores Partial Sums

Each index i in the BIT array stores the sum of a specific range of the original array. The range length equals \`lowbit(i)\`:
- BIT[1] stores sum of arr[1..1] (lowbit(1) = 1)
- BIT[2] stores sum of arr[1..2] (lowbit(2) = 2)
- BIT[3] stores sum of arr[3..3] (lowbit(3) = 1)
- BIT[4] stores sum of arr[1..4] (lowbit(4) = 4)
- BIT[6] stores sum of arr[5..6] (lowbit(6) = 2)

\`\`\`mermaid
graph TD
    B8["BIT[8]: sum[1..8]"] --> B4["BIT[4]: sum[1..4]"]
    B8 --> B6["BIT[6]: sum[5..6]"]
    B8 --> B7["BIT[7]: sum[7..7]"]
    B4 --> B2["BIT[2]: sum[1..2]"]
    B4 --> B3["BIT[3]: sum[3..3]"]
    B2 --> B1["BIT[1]: sum[1..1]"]
    B6 --> B5["BIT[5]: sum[5..5]"]
\`\`\`

### Key Insight: Tree Navigation

- **Query (prefix sum):** Start at index i, add BIT[i], then strip the LSB: \`i -= i & (-i)\`. Repeat until i = 0.
- **Update (point add):** Start at index i, add delta to BIT[i], then add the LSB: \`i += i & (-i)\`. Repeat until i > n.

This traversal pattern ensures at most O(log n) nodes are visited because each step either removes or adds a bit.

### 1-Indexed Convention

BIT uses **1-based indexing**. Index 0 is unused because \`0 & (-0) = 0\`, which would cause an infinite loop. When adapting from a 0-indexed array, simply shift by +1.

**Java:**
\`\`\`java
class FenwickTree {
    int[] tree;
    int n;

    FenwickTree(int n) {
        this.n = n;
        this.tree = new int[n + 1]; // 1-indexed
    }

    // Returns x & (-x), the lowest set bit
    int lowbit(int x) {
        return x & (-x);
    }
}
\`\`\`

**Python:**
\`\`\`python
class FenwickTree:
    def __init__(self, n: int):
        self.n = n
        self.tree = [0] * (n + 1)  # 1-indexed

    def lowbit(self, x: int) -> int:
        return x & (-x)
\`\`\``,
      objectives: [
        "Explain what a Fenwick Tree (BIT) is and the problem it solves",
        "Understand the lowbit operation (x & -x) and its role in BIT",
        "Describe how BIT stores partial sums using binary representation",
        "Distinguish BIT from prefix sum arrays and segment trees",
      ],
      activities: [
        {
          description: "Compute lowbit(x) by hand for x = 1 through 16 and identify the pattern",
          durationMinutes: 10,
        },
        {
          description: "Draw the BIT responsibility ranges for an array of size 8, showing which original indices each BIT cell covers",
          durationMinutes: 15,
        },
        {
          description: "Trace a prefix sum query for index 7: list all BIT cells visited and the bits stripped at each step",
          durationMinutes: 10,
        },
      ],
      reviewQuestions: [
        "What does x & (-x) compute and why is it essential to BIT?:::It extracts the lowest set bit of x. BIT uses this to determine the range each node covers and to navigate the tree during queries and updates.",
        "Why does BIT use 1-based indexing?:::Because lowbit(0) = 0, which would cause infinite loops in both query and update traversals. Starting at index 1 ensures every index has a non-zero lowest set bit.",
        "How many nodes does a prefix sum query visit in a BIT of size n?:::At most O(log n) nodes, since each step strips one bit from the index and the index has at most log2(n) bits.",
      ],
      successCriteria: "Can explain BIT structure and manually trace query/update paths",
      paretoJustification: "Understanding the binary trick is the foundation for all BIT operations",
      resources: [],
    },

    // ── Session 2: Point Update + Prefix Query ────────────────────────────
    {
      sessionNumber: 2,
      title: "Point Update & Prefix Query Implementation",
      content: `### Core Operations

A Fenwick Tree supports two fundamental operations:
1. **Point Update** — add a value delta to position i
2. **Prefix Query** — compute the sum of elements from index 1 to i

Both run in **O(log n)** time, which is the key advantage over naive approaches.

### Prefix Sum Query

To compute prefixSum(i), we accumulate values while stripping the lowest set bit:

\`\`\`
sum = 0
while i > 0:
    sum += tree[i]
    i -= lowbit(i)    // strip lowest set bit
return sum
\`\`\`

**Example:** Query prefixSum(7) where 7 = 0111 in binary:
1. Add BIT[7] (covers arr[7]), i = 7 - 1 = 6
2. Add BIT[6] (covers arr[5..6]), i = 6 - 2 = 4
3. Add BIT[4] (covers arr[1..4]), i = 4 - 4 = 0
4. Stop. Total = BIT[7] + BIT[6] + BIT[4]

Only 3 steps for n=8 — that is O(log n).

### Point Update

To update position i by delta, we add delta while adding the lowest set bit:

\`\`\`
while i <= n:
    tree[i] += delta
    i += lowbit(i)    // add lowest set bit
\`\`\`

**Example:** Update index 3, where 3 = 011:
1. Update BIT[3], i = 3 + 1 = 4
2. Update BIT[4], i = 4 + 4 = 8
3. Update BIT[8], i = 8 + 8 = 16 > n
4. Stop. Updated BIT[3], BIT[4], BIT[8]

### Range Sum Query

To find the sum of elements in range [l, r]:

\`\`\`
rangeSum(l, r) = prefixSum(r) - prefixSum(l - 1)
\`\`\`

This uses two prefix queries, so it is still O(log n).

### Building from an Existing Array

**Method 1: Repeated updates** — O(n log n)
Insert elements one by one using the update operation.

**Method 2: Linear build** — O(n)
For each index i, propagate its value to its parent i + lowbit(i):

\`\`\`
for i from 1 to n:
    tree[i] += arr[i]
    j = i + lowbit(i)
    if j <= n:
        tree[j] += tree[i]
\`\`\`

### Complexity Analysis

| Operation      | Time     | Space |
|---------------|----------|-------|
| Build          | O(n)     | O(n)  |
| Point Update   | O(log n) | O(1)  |
| Prefix Query   | O(log n) | O(1)  |
| Range Query    | O(log n) | O(1)  |

Compared to a **Segment Tree**, BIT uses half the memory (n+1 vs 4n), has a smaller constant factor, and is much simpler to code — typically under 20 lines.

### Complete Implementation

**Java:**
\`\`\`java
class FenwickTree {
    int[] tree;
    int n;

    FenwickTree(int[] nums) {
        n = nums.length;
        tree = new int[n + 1];
        // O(n) build
        for (int i = 0; i < n; i++) {
            tree[i + 1] += nums[i];
            int j = (i + 1) + ((i + 1) & -(i + 1));
            if (j <= n) tree[j] += tree[i + 1];
        }
    }

    void update(int i, int delta) {
        i++; // convert 0-indexed to 1-indexed
        while (i <= n) {
            tree[i] += delta;
            i += i & (-i);
        }
    }

    int prefixSum(int i) {
        i++; // convert 0-indexed to 1-indexed
        int sum = 0;
        while (i > 0) {
            sum += tree[i];
            i -= i & (-i);
        }
        return sum;
    }

    int rangeSum(int l, int r) {
        return prefixSum(r) - (l > 0 ? prefixSum(l - 1) : 0);
    }
}
\`\`\`

**Python:**
\`\`\`python
class FenwickTree:
    def __init__(self, nums: list[int]):
        self.n = len(nums)
        self.tree = [0] * (self.n + 1)
        # O(n) build
        for i in range(self.n):
            self.tree[i + 1] += nums[i]
            j = (i + 1) + ((i + 1) & -(i + 1))
            if j <= self.n:
                self.tree[j] += self.tree[i + 1]

    def update(self, i: int, delta: int) -> None:
        i += 1  # 0-indexed to 1-indexed
        while i <= self.n:
            self.tree[i] += delta
            i += i & (-i)

    def prefix_sum(self, i: int) -> int:
        i += 1  # 0-indexed to 1-indexed
        s = 0
        while i > 0:
            s += self.tree[i]
            i -= i & (-i)
        return s

    def range_sum(self, l: int, r: int) -> int:
        return self.prefix_sum(r) - (self.prefix_sum(l - 1) if l > 0 else 0)
\`\`\`

### Practical Tip

In interviews, always clarify whether indices are 0-based or 1-based. A common bug is off-by-one errors when converting between the problem's indexing and BIT's 1-based indexing.`,
      objectives: [
        "Implement point update and prefix sum query in O(log n)",
        "Derive range sum queries from two prefix sum calls",
        "Build a BIT from an existing array in O(n) time",
        "Compare BIT vs Segment Tree trade-offs",
      ],
      activities: [
        {
          description: "Implement FenwickTree class from scratch without looking at reference code, then verify with test cases: [1,3,5,7,9] -> prefixSum(3)=16, update(2,+6) -> prefixSum(3)=22",
          durationMinutes: 20,
        },
        {
          description: "Solve LeetCode #303 (Range Sum Query - Immutable) using BIT instead of prefix sums, comparing the two approaches",
          durationMinutes: 15,
        },
        {
          description: "Benchmark BIT build: implement both O(n log n) repeated-update and O(n) linear build, compare performance on n=100000",
          durationMinutes: 15,
        },
      ],
      reviewQuestions: [
        "Why does the update operation add the LSB while the query operation subtracts it?:::Update propagates the change to all BIT nodes whose range includes position i (parents), reached by adding the LSB. Query accumulates partial sums by visiting non-overlapping ranges that cover [1..i], reached by stripping the LSB.",
        "How do you compute the sum of elements in range [l, r] using a BIT?:::rangeSum(l, r) = prefixSum(r) - prefixSum(l - 1). This leverages the property that a range sum equals the difference of two prefix sums.",
        "What is the advantage of the O(n) BIT build over O(n log n) repeated updates?:::The O(n) build propagates each value only to its immediate parent, visiting each index once. Repeated updates visit O(log n) ancestors per element, resulting in O(n log n) total work.",
      ],
      successCriteria: "Can implement a complete BIT from scratch and solve range sum problems",
      paretoJustification: "Point update + prefix query is the bread and butter of BIT — covers 80% of interview problems",
      resources: [],
    },

    // ── Session 3: Range Updates + Point Queries ──────────────────────────
    {
      sessionNumber: 3,
      title: "Range Updates & Point Queries with BIT",
      content: `### The Dual Problem

The standard BIT supports **point update + prefix query**. But what if we need:
- **Range update:** Add delta to all elements in [l, r]
- **Point query:** Get the current value at index i

This is the **dual** of the original problem and is solved using the **difference array technique** combined with BIT.

### Difference Array Recap

A difference array D stores the difference between consecutive elements:
- D[i] = A[i] - A[i-1] (with D[1] = A[1])

Key property: A[i] = D[1] + D[2] + ... + D[i] = prefixSum(D, i)

To add delta to range [l, r] in the original array:
- D[l] += delta
- D[r+1] -= delta

This is just **two point updates** on the difference array!

### BIT on Difference Array

By building a BIT over the difference array D, we get:
- **Range update [l, r] += delta:** Two point updates on BIT: update(l, +delta), update(r+1, -delta)
- **Point query at i:** One prefix sum query: prefixSum(i)

Both operations are O(log n).

\`\`\`mermaid
flowchart LR
    subgraph "Range Update [l, r] += delta"
        A["BIT.update(l, +delta)"] --> B["BIT.update(r+1, -delta)"]
    end
    subgraph "Point Query at i"
        C["BIT.prefixSum(i)"] --> D["Returns A[i]"]
    end
\`\`\`

### Implementation

**Java:**
\`\`\`java
class RangeUpdateBIT {
    int[] tree;
    int n;

    RangeUpdateBIT(int n) {
        this.n = n;
        this.tree = new int[n + 2]; // +2 for r+1 safety
    }

    void add(int i, int delta) {
        for (; i <= n; i += i & (-i))
            tree[i] += delta;
    }

    // Add delta to all elements in [l, r] (1-indexed)
    void rangeUpdate(int l, int r, int delta) {
        add(l, delta);
        add(r + 1, -delta);
    }

    // Get current value at index i (1-indexed)
    int pointQuery(int i) {
        int sum = 0;
        for (; i > 0; i -= i & (-i))
            sum += tree[i];
        return sum;
    }
}
\`\`\`

**Python:**
\`\`\`python
class RangeUpdateBIT:
    def __init__(self, n: int):
        self.n = n
        self.tree = [0] * (n + 2)  # +2 for r+1 safety

    def _add(self, i: int, delta: int) -> None:
        while i <= self.n:
            self.tree[i] += delta
            i += i & (-i)

    def range_update(self, l: int, r: int, delta: int) -> None:
        """Add delta to all elements in [l, r] (1-indexed)."""
        self._add(l, delta)
        self._add(r + 1, -delta)

    def point_query(self, i: int) -> int:
        """Get current value at index i (1-indexed)."""
        s = 0
        while i > 0:
            s += self.tree[i]
            i -= i & (-i)
        return s
\`\`\`

### Range Update + Range Query (Advanced)

What if we need both **range updates** AND **range queries**? We use **two BITs** (B1 and B2) with the identity:

\`\`\`
prefixSum(i) = B1[i] * i - B2[i]
\`\`\`

For a range update [l, r] += delta:
- B1: update(l, delta), update(r+1, -delta)
- B2: update(l, delta*(l-1)), update(r+1, -delta*r)

This is rarely asked in interviews but is good to know for competitive programming.

**Java:**
\`\`\`java
class RangeRangeBIT {
    long[] b1, b2;
    int n;

    RangeRangeBIT(int n) {
        this.n = n;
        b1 = new long[n + 2];
        b2 = new long[n + 2];
    }

    void add(long[] tree, int i, long delta) {
        for (; i <= n; i += i & (-i))
            tree[i] += delta;
    }

    void rangeUpdate(int l, int r, long delta) {
        add(b1, l, delta);
        add(b1, r + 1, -delta);
        add(b2, l, delta * (l - 1));
        add(b2, r + 1, -delta * r);
    }

    long prefixSum(int i) {
        long s1 = 0, s2 = 0;
        for (int j = i; j > 0; j -= j & (-j)) {
            s1 += b1[j];
            s2 += b2[j];
        }
        return s1 * i - s2;
    }

    long rangeSum(int l, int r) {
        return prefixSum(r) - prefixSum(l - 1);
    }
}
\`\`\`

**Python:**
\`\`\`python
class RangeRangeBIT:
    def __init__(self, n: int):
        self.n = n
        self.b1 = [0] * (n + 2)
        self.b2 = [0] * (n + 2)

    def _add(self, tree: list, i: int, delta: int) -> None:
        while i <= self.n:
            tree[i] += delta
            i += i & (-i)

    def range_update(self, l: int, r: int, delta: int) -> None:
        self._add(self.b1, l, delta)
        self._add(self.b1, r + 1, -delta)
        self._add(self.b2, l, delta * (l - 1))
        self._add(self.b2, r + 1, -delta * r)

    def prefix_sum(self, i: int) -> int:
        s1 = s2 = 0
        j = i
        while j > 0:
            s1 += self.b1[j]
            s2 += self.b2[j]
            j -= j & (-j)
        return s1 * i - s2

    def range_sum(self, l: int, r: int) -> int:
        return self.prefix_sum(r) - self.prefix_sum(l - 1)
\`\`\`

### When to Use Which BIT Variant

| Variant | Update | Query | BITs needed |
|---------|--------|-------|-------------|
| Standard | Point O(log n) | Prefix O(log n) | 1 |
| Difference | Range O(log n) | Point O(log n) | 1 |
| Dual BIT | Range O(log n) | Range O(log n) | 2 |`,
      objectives: [
        "Apply the difference array technique with BIT for range updates",
        "Implement range update + point query in O(log n)",
        "Understand the dual-BIT approach for range update + range query",
        "Choose the correct BIT variant based on problem requirements",
      ],
      activities: [
        {
          description: "Implement RangeUpdateBIT and verify: rangeUpdate(2,5,+3), rangeUpdate(4,7,+2), pointQuery(4) should return 5",
          durationMinutes: 15,
        },
        {
          description: "Convert a brute-force range update solution (O(n) per update) to use BIT and compare performance on 10000 operations",
          durationMinutes: 20,
        },
        {
          description: "Implement the dual-BIT (range update + range query) variant and test with a mix of updates and queries",
          durationMinutes: 20,
        },
      ],
      reviewQuestions: [
        "How does the difference array technique convert range updates into point updates?:::Adding delta to D[l] and subtracting delta from D[r+1] causes the prefix sum (which reconstructs A[i]) to increase by delta for all indices in [l, r] and remain unchanged outside that range.",
        "Why do we allocate tree of size n+2 instead of n+1 for range update BIT?:::Because rangeUpdate calls add(r+1, -delta), and when r equals n, we access index n+1. The extra slot prevents out-of-bounds access.",
        "In what scenario would you use two BITs instead of one?:::When you need both range updates and range queries. A single BIT handles either point-update/prefix-query or range-update/point-query, but not range-update/range-query.",
      ],
      successCriteria: "Can implement range update BIT and explain the difference array connection",
      paretoJustification: "Range update + point query is the second most common BIT pattern in interviews",
      resources: [],
    },

    // ── Session 4: Interview Problems ─────────────────────────────────────
    {
      sessionNumber: 4,
      title: "BIT Interview Problems & 2D Extension",
      content: `### Classic BIT Interview Problems

BIT appears in four major categories of interview problems:
1. **Range sum queries with updates** (direct application)
2. **Counting inversions / smaller elements** (coordinate compression + BIT)
3. **Merge sort count** (alternative approach comparison)
4. **2D range queries** (extension to matrices)

### Problem 1: Range Sum Query - Mutable (LC #307)

**Problem:** Given an array, support update(i, val) and sumRange(l, r).

This is the textbook BIT problem. The key insight is that update(i, val) needs to compute the delta (val - currentValue) before calling BIT update.

**Java:**
\`\`\`java
class NumArray {
    int[] tree, nums;
    int n;

    public NumArray(int[] nums) {
        this.nums = nums.clone();
        n = nums.length;
        tree = new int[n + 1];
        for (int i = 0; i < n; i++) {
            int j = i + 1;
            tree[j] += nums[i];
            int p = j + (j & -j);
            if (p <= n) tree[p] += tree[j];
        }
    }

    public void update(int i, int val) {
        int delta = val - nums[i];
        nums[i] = val;
        for (int j = i + 1; j <= n; j += j & (-j))
            tree[j] += delta;
    }

    public int sumRange(int l, int r) {
        return query(r + 1) - query(l);
    }

    private int query(int i) {
        int s = 0;
        for (; i > 0; i -= i & (-i)) s += tree[i];
        return s;
    }
}
\`\`\`

**Python:**
\`\`\`python
class NumArray:
    def __init__(self, nums: list[int]):
        self.nums = nums[:]
        self.n = len(nums)
        self.tree = [0] * (self.n + 1)
        for i in range(self.n):
            j = i + 1
            self.tree[j] += nums[i]
            p = j + (j & -j)
            if p <= self.n:
                self.tree[p] += self.tree[j]

    def update(self, i: int, val: int) -> None:
        delta = val - self.nums[i]
        self.nums[i] = val
        j = i + 1
        while j <= self.n:
            self.tree[j] += delta
            j += j & (-j)

    def sumRange(self, l: int, r: int) -> int:
        return self._query(r + 1) - self._query(l)

    def _query(self, i: int) -> int:
        s = 0
        while i > 0:
            s += self.tree[i]
            i -= i & (-i)
        return s
\`\`\`

### Problem 2: Count of Smaller Numbers After Self (LC #315)

**Problem:** For each element, count how many smaller elements appear to its right.

**Approach:** Process the array right to left. Use coordinate compression to map values to ranks [1, n]. For each element, query the BIT for prefixSum(rank - 1) to count how many smaller elements we have already seen. Then update the BIT at rank.

**Java:**
\`\`\`java
public List<Integer> countSmaller(int[] nums) {
    int n = nums.length;
    int[] sorted = nums.clone();
    Arrays.sort(sorted);
    Map<Integer, Integer> rank = new HashMap<>();
    int r = 1;
    for (int v : sorted)
        rank.putIfAbsent(v, r++);

    int[] tree = new int[r + 1];
    Integer[] result = new Integer[n];

    for (int i = n - 1; i >= 0; i--) {
        int rk = rank.get(nums[i]);
        // query prefix sum up to rk-1
        int count = 0;
        for (int j = rk - 1; j > 0; j -= j & (-j))
            count += tree[j];
        result[i] = count;
        // update at rk
        for (int j = rk; j < tree.length; j += j & (-j))
            tree[j]++;
    }
    return Arrays.asList(result);
}
\`\`\`

**Python:**
\`\`\`python
def countSmaller(nums: list[int]) -> list[int]:
    sorted_unique = sorted(set(nums))
    rank = {v: i + 1 for i, v in enumerate(sorted_unique)}
    max_rank = len(sorted_unique)
    tree = [0] * (max_rank + 2)

    def update(i):
        while i <= max_rank:
            tree[i] += 1
            i += i & (-i)

    def query(i):
        s = 0
        while i > 0:
            s += tree[i]
            i -= i & (-i)
        return s

    result = []
    for num in reversed(nums):
        rk = rank[num]
        result.append(query(rk - 1))
        update(rk)
    return result[::-1]
\`\`\`

### Problem 3: Reverse Pairs (LC #493)

**Problem:** Count pairs (i, j) where i < j and nums[i] > 2 * nums[j].

This can be solved with BIT using coordinate compression, similar to LC #315, but querying for values > 2 * nums[j] instead.

### 2D Fenwick Tree Introduction

A 2D BIT extends the concept to a matrix, supporting:
- **Point update:** Add delta at position (x, y)
- **Prefix sum:** Sum of submatrix from (1,1) to (x,y)

The implementation nests two BIT traversals:

**Java:**
\`\`\`java
class FenwickTree2D {
    int[][] tree;
    int rows, cols;

    FenwickTree2D(int rows, int cols) {
        this.rows = rows;
        this.cols = cols;
        tree = new int[rows + 1][cols + 1];
    }

    void update(int x, int y, int delta) {
        for (int i = x; i <= rows; i += i & (-i))
            for (int j = y; j <= cols; j += j & (-j))
                tree[i][j] += delta;
    }

    int query(int x, int y) {
        int sum = 0;
        for (int i = x; i > 0; i -= i & (-i))
            for (int j = y; j > 0; j -= j & (-j))
                sum += tree[i][j];
        return sum;
    }

    int rangeQuery(int x1, int y1, int x2, int y2) {
        return query(x2, y2) - query(x1 - 1, y2)
             - query(x2, y1 - 1) + query(x1 - 1, y1 - 1);
    }
}
\`\`\`

**Python:**
\`\`\`python
class FenwickTree2D:
    def __init__(self, rows: int, cols: int):
        self.rows, self.cols = rows, cols
        self.tree = [[0] * (cols + 1) for _ in range(rows + 1)]

    def update(self, x: int, y: int, delta: int) -> None:
        i = x
        while i <= self.rows:
            j = y
            while j <= self.cols:
                self.tree[i][j] += delta
                j += j & (-j)
            i += i & (-i)

    def query(self, x: int, y: int) -> int:
        s, i = 0, x
        while i > 0:
            j = y
            while j > 0:
                s += self.tree[i][j]
                j -= j & (-j)
            i -= i & (-i)
        return s

    def range_query(self, x1: int, y1: int, x2: int, y2: int) -> int:
        return (self.query(x2, y2) - self.query(x1 - 1, y2)
              - self.query(x2, y1 - 1) + self.query(x1 - 1, y1 - 1))
\`\`\`

### Interview Strategy

When you see a BIT problem in an interview:
1. Identify if it is a prefix sum / range query problem
2. Check if updates are needed (if not, a simple prefix sum array suffices)
3. Consider coordinate compression for value-based queries
4. Default to BIT over Segment Tree unless you need lazy propagation`,
      objectives: [
        "Solve LeetCode #307 (Range Sum Query - Mutable) using BIT",
        "Apply coordinate compression with BIT for counting inversions (LC #315)",
        "Understand the 2D Fenwick Tree structure and operations",
        "Develop a strategy for recognizing BIT problems in interviews",
      ],
      activities: [
        {
          description: "Solve LC #307 Range Sum Query - Mutable using the FenwickTree class, verify all test cases pass",
          durationMinutes: 20,
        },
        {
          description: "Solve LC #315 Count of Smaller Numbers After Self — implement coordinate compression + BIT approach",
          durationMinutes: 25,
        },
        {
          description: "Implement a 2D BIT and solve the problem: given a matrix, support point updates and submatrix sum queries",
          durationMinutes: 20,
        },
      ],
      reviewQuestions: [
        "In LC #307, why must you compute delta = val - nums[i] before updating the BIT?:::BIT's update operation adds a delta to an element. Since we are replacing nums[i] with val, the net change is (val - nums[i]). Directly storing val would corrupt the partial sums.",
        "What is coordinate compression and why is it needed for LC #315?:::Coordinate compression maps arbitrary values to consecutive ranks [1..k]. BIT requires indices to be bounded, so we cannot use raw values (which could be up to 10^9) as BIT indices. Compression reduces the BIT size to O(distinct values).",
        "What is the time complexity of a 2D BIT update and query?:::Both operations are O(log(rows) * log(cols)) because the outer loop runs O(log rows) times and the inner loop runs O(log cols) times per outer iteration.",
      ],
      successCriteria: "Can solve at least 2 BIT interview problems and explain the 2D extension",
      paretoJustification: "These problems represent 90% of BIT questions asked in FAANG interviews",
      resources: [],
    },
  ];

  // ── Quiz Bank (10 questions) ──────────────────────────────────────────

  const quizBank = [
    {
      question: "What does the expression x & (-x) compute?",
      format: "mcq",
      difficulty: 1,
      bloomLabel: "Remember",
      options: [
        "A) The highest set bit of x",
        "B) The lowest set bit of x",
        "C) The number of set bits in x",
        "D) The complement of x",
      ],
      correctAnswer: "B",
      explanation:
        "**Correct: B) The lowest set bit of x.** In two's complement, -x flips all bits and adds 1. When AND-ed with x, only the rightmost 1-bit survives. This operation (often called lowbit) is the foundation of Fenwick Tree navigation.",
    },
    {
      question: "Why does a Fenwick Tree use 1-based indexing?",
      format: "mcq",
      difficulty: 1,
      bloomLabel: "Understand",
      options: [
        "A) To match the original array indices",
        "B) Because 0 & (-0) = 0, causing an infinite loop",
        "C) To save memory by skipping index 0",
        "D) Because binary representation of 0 has no bits",
      ],
      correctAnswer: "B",
      explanation:
        "**Correct: B) Because 0 & (-0) = 0, causing an infinite loop.** Both the query and update operations rely on stripping or adding the lowest set bit. Since lowbit(0) = 0, the index would never change, causing an infinite loop. Using 1-based indexing avoids this edge case entirely.",
    },
    {
      question:
        "How many BIT nodes are visited during a prefix sum query for index 13 (binary: 1101)?",
      format: "mcq",
      difficulty: 2,
      bloomLabel: "Apply",
      options: ["A) 2", "B) 3", "C) 4", "D) 13"],
      correctAnswer: "B",
      explanation:
        "**Correct: B) 3.** The query visits: BIT[13] (1101), then strips LSB to get 12 (1100), visits BIT[12], strips LSB to get 8 (1000), visits BIT[8], strips LSB to get 0 and stops. That is 3 nodes, equal to the number of set bits in 13.",
    },
    {
      question:
        "What is the time complexity of building a Fenwick Tree from an array of n elements using the propagation method?",
      format: "mcq",
      difficulty: 2,
      bloomLabel: "Remember",
      options: [
        "A) O(n^2)",
        "B) O(n log n)",
        "C) O(n)",
        "D) O(log n)",
      ],
      correctAnswer: "C",
      explanation:
        "**Correct: C) O(n).** The propagation method iterates through each index once and propagates its value to its immediate parent (i + lowbit(i)). Since each index is visited exactly once, the total work is O(n). This is faster than the O(n log n) approach of calling update n times.",
    },
    {
      question:
        "To support range updates and point queries with a BIT, which technique is used?",
      format: "mcq",
      difficulty: 2,
      bloomLabel: "Understand",
      options: [
        "A) Lazy propagation",
        "B) Difference array stored in BIT",
        "C) Two separate BITs",
        "D) Segment tree augmentation",
      ],
      correctAnswer: "B",
      explanation:
        "**Correct: B) Difference array stored in BIT.** By building a BIT over the difference array D where D[i] = A[i] - A[i-1], a range update [l,r] += delta becomes two point updates (D[l] += delta, D[r+1] -= delta), and a point query A[i] becomes a prefix sum query on D. This elegantly inverts the standard BIT operations.",
    },
    {
      question:
        "In the BIT solution for LC #315 (Count Smaller After Self), why is coordinate compression necessary?",
      format: "mcq",
      difficulty: 3,
      bloomLabel: "Analyze",
      options: [
        "A) To reduce time complexity from O(n^2) to O(n log n)",
        "B) To handle negative numbers in the input",
        "C) To bound BIT size to O(distinct values) instead of O(max value)",
        "D) To sort the array without modifying it",
      ],
      correctAnswer: "C",
      explanation:
        "**Correct: C) To bound BIT size to O(distinct values) instead of O(max value).** Input values can range from -10^4 to 10^4 (or larger). Using raw values as BIT indices would require a BIT of size 2*10^4 even for small arrays. Coordinate compression maps values to consecutive ranks [1..k] where k is the number of distinct values, keeping the BIT compact.",
    },
    {
      question:
        "What is the space complexity of a 2D Fenwick Tree for an m x n matrix?",
      format: "mcq",
      difficulty: 2,
      bloomLabel: "Remember",
      options: [
        "A) O(m + n)",
        "B) O(m * n)",
        "C) O(m * n * log(m))",
        "D) O(4 * m * n)",
      ],
      correctAnswer: "B",
      explanation:
        "**Correct: B) O(m * n).** A 2D Fenwick Tree stores one value per cell, requiring an (m+1) x (n+1) array. Unlike a 2D Segment Tree which needs O(4m * 4n) space, the 2D BIT uses the same asymptotic space as the original matrix.",
    },
    {
      question:
        "When solving LC #307 (Range Sum Query - Mutable) with BIT, what value is passed to the BIT update function?",
      format: "mcq",
      difficulty: 2,
      bloomLabel: "Apply",
      options: [
        "A) The new value directly",
        "B) The delta: newValue - oldValue",
        "C) The old value negated",
        "D) The index of the element",
      ],
      correctAnswer: "B",
      explanation:
        "**Correct: B) The delta: newValue - oldValue.** BIT's update adds a delta to an element's contribution. Since update(i, val) replaces nums[i] with val, we must compute delta = val - nums[i] so that all partial sums are adjusted by the correct difference. Passing the value directly would add it on top of the existing value.",
    },
    {
      question:
        "How many BITs are needed to support both range updates and range queries?",
      format: "mcq",
      difficulty: 3,
      bloomLabel: "Understand",
      options: [
        "A) 1 BIT",
        "B) 2 BITs",
        "C) 3 BITs",
        "D) A segment tree is required instead",
      ],
      correctAnswer: "B",
      explanation:
        "**Correct: B) 2 BITs.** The dual-BIT technique uses two BITs (B1 and B2) with the formula prefixSum(i) = B1[i]*i - B2[i]. A range update [l,r] += delta performs two updates on each BIT. This is more complex but avoids the heavier segment tree with lazy propagation.",
    },
    {
      question:
        "Compared to a Segment Tree, which is NOT an advantage of a Fenwick Tree?",
      format: "mcq",
      difficulty: 3,
      bloomLabel: "Evaluate",
      options: [
        "A) Uses less memory (n+1 vs 4n)",
        "B) Simpler to implement (under 20 lines)",
        "C) Supports lazy propagation natively",
        "D) Has smaller constant factor in practice",
      ],
      correctAnswer: "C",
      explanation:
        "**Correct: C) Supports lazy propagation natively.** Fenwick Trees do NOT support lazy propagation. This is their main limitation — they cannot efficiently handle range updates with range queries using a single tree (the dual-BIT workaround exists but is limited). Segment Trees with lazy propagation are more versatile for complex range operations.",
    },
  ];

  // ── Cheat Sheet ───────────────────────────────────────────────────────

  const cheatSheet = `# Fenwick Tree (Binary Indexed Tree) Cheat Sheet

## Core Concept
BIT stores partial sums using the lowest set bit (LSB) to determine ranges.
\`lowbit(x) = x & (-x)\`

## Standard BIT (Point Update + Prefix Query)

### Java
\`\`\`java
int[] tree = new int[n + 1];

void update(int i, int delta) {
    for (; i <= n; i += i & (-i)) tree[i] += delta;
}

int query(int i) {
    int s = 0;
    for (; i > 0; i -= i & (-i)) s += tree[i];
    return s;
}

int rangeQuery(int l, int r) {
    return query(r) - query(l - 1);
}
\`\`\`

### Python
\`\`\`python
tree = [0] * (n + 1)

def update(i, delta):
    while i <= n:
        tree[i] += delta
        i += i & (-i)

def query(i):
    s = 0
    while i > 0:
        s += tree[i]
        i -= i & (-i)
    return s
\`\`\`

## Range Update + Point Query (Difference Array)
\`\`\`
rangeUpdate(l, r, delta):
    update(l, +delta)
    update(r+1, -delta)

pointQuery(i) = prefixSum(i)
\`\`\`

## O(n) Build
\`\`\`
for i in 1..n:
    tree[i] += arr[i]
    j = i + lowbit(i)
    if j <= n: tree[j] += tree[i]
\`\`\`

## 2D BIT
Nest two loops: outer on rows, inner on cols.
Update: O(log R * log C) | Query: O(log R * log C)

## Complexity Summary
| Operation | Time | Space |
|-----------|------|-------|
| Build | O(n) | O(n) |
| Point Update | O(log n) | - |
| Prefix Query | O(log n) | - |
| Range Query | O(log n) | - |
| Range Update (diff) | O(log n) | - |

## Key Interview Problems
- LC #307: Range Sum Query Mutable (direct BIT)
- LC #315: Count Smaller After Self (coord compression)
- LC #493: Reverse Pairs (modified counting)
- LC #308: Range Sum Query 2D Mutable (2D BIT)

## BIT vs Segment Tree
| Feature | BIT | Segment Tree |
|---------|-----|-------------|
| Space | n+1 | 4n |
| Code | ~15 lines | ~50 lines |
| Lazy Prop | No | Yes |
| Versatility | Sum/XOR | Any associative op |`;

  // ── Resources ─────────────────────────────────────────────────────────

  const resources = [
    {
      title: "Fenwick Tree - cp-algorithms",
      author: "cp-algorithms.com",
      category: "articles",
      justification:
        "Comprehensive reference with proofs, all BIT variants, and practice problems",
      bestFor: "Intermediate",
      estimatedTime: "2 hours",
      cost: "Free",
      confidence: "HIGH",
    },
    {
      title: "Binary Indexed Trees - TopCoder",
      author: "TopCoder",
      category: "articles",
      justification:
        "Classic tutorial that introduced BIT to competitive programmers",
      bestFor: "Beginner-Intermediate",
      estimatedTime: "1 hour",
      cost: "Free",
      confidence: "HIGH",
    },
    {
      title: "LeetCode #307 - Range Sum Query Mutable",
      author: "LeetCode",
      category: "practice",
      justification: "The canonical BIT problem, must-solve for interviews",
      bestFor: "Intermediate",
      estimatedTime: "30 minutes",
      cost: "Free",
      confidence: "HIGH",
    },
    {
      title: "LeetCode #315 - Count of Smaller Numbers After Self",
      author: "LeetCode",
      category: "practice",
      justification:
        "Tests BIT with coordinate compression, common FAANG question",
      bestFor: "Advanced",
      estimatedTime: "45 minutes",
      cost: "Free",
      confidence: "HIGH",
    },
    {
      title: "Algorithms Live! - Fenwick Trees",
      author: "Algorithms Live",
      category: "videos",
      justification:
        "Visual explanation of BIT operations with step-by-step animation",
      bestFor: "Beginner",
      estimatedTime: "30 minutes",
      cost: "Free",
      confidence: "MEDIUM",
    },
  ];

  // ── Ladder ────────────────────────────────────────────────────────────

  const ladder = {
    levels: [
      {
        level: 1,
        name: "Novice",
        dreyfusLabel: "Novice",
        description:
          "Can explain what a Fenwick Tree is and how lowbit works",
        observableSkills: [
          "Explain lowbit operation",
          "Draw BIT structure for small arrays",
        ],
        milestoneProject: {
          title: "Trace BIT Operations",
          description:
            "Manually trace update and query paths for a BIT of size 16",
          estimatedHours: 1,
        },
        commonPlateaus: ["Confusing BIT indices with array indices"],
        estimatedHours: 3,
        prerequisites: [],
      },
      {
        level: 2,
        name: "Advanced Beginner",
        dreyfusLabel: "Advanced Beginner",
        description:
          "Can implement standard BIT with point update and prefix query",
        observableSkills: [
          "Implement update and query",
          "Build BIT in O(n)",
          "Handle 0-indexed to 1-indexed conversion",
        ],
        milestoneProject: {
          title: "Solve LC #307",
          description:
            "Implement Range Sum Query - Mutable using BIT from scratch",
          estimatedHours: 2,
        },
        commonPlateaus: ["Off-by-one errors in index conversion"],
        estimatedHours: 4,
        prerequisites: ["Binary number representation"],
      },
      {
        level: 3,
        name: "Competent",
        dreyfusLabel: "Competent",
        description:
          "Can apply BIT to counting and inversion problems with coordinate compression",
        observableSkills: [
          "Coordinate compression",
          "Counting inversions with BIT",
          "Range update with difference array",
        ],
        milestoneProject: {
          title: "Solve LC #315",
          description:
            "Count of Smaller Numbers After Self using BIT + coordinate compression",
          estimatedHours: 3,
        },
        commonPlateaus: [
          "Choosing between BIT and merge sort for inversion counting",
        ],
        estimatedHours: 6,
        prerequisites: ["Sorting", "HashMap usage"],
      },
      {
        level: 4,
        name: "Proficient",
        dreyfusLabel: "Proficient",
        description:
          "Can implement 2D BIT and solve complex range query problems",
        observableSkills: [
          "2D BIT implementation",
          "Dual-BIT for range update + range query",
          "Problem decomposition into BIT operations",
        ],
        milestoneProject: {
          title: "2D Range Sum Query",
          description:
            "Implement 2D BIT for matrix point updates and submatrix sum queries",
          estimatedHours: 3,
        },
        commonPlateaus: ["Handling 2D inclusion-exclusion correctly"],
        estimatedHours: 10,
        prerequisites: ["Standard BIT", "2D prefix sums"],
      },
      {
        level: 5,
        name: "Expert",
        dreyfusLabel: "Expert",
        description:
          "Can apply BIT to advanced problems and choose optimally between BIT and Segment Tree",
        observableSkills: [
          "BIT with order statistics",
          "Offline query processing with BIT",
          "BIT vs Segment Tree trade-off analysis",
        ],
        milestoneProject: {
          title: "Advanced BIT Applications",
          description:
            "Solve LC #493 (Reverse Pairs) and implement BIT-based order statistics",
          estimatedHours: 5,
        },
        commonPlateaus: ["Knowing when BIT is insufficient and Segment Tree is needed"],
        estimatedHours: 15,
        prerequisites: ["Segment Tree basics", "Advanced sorting"],
      },
    ],
  };

  return {
    topic: "Fenwick Tree (Binary Indexed Tree)",
    category: "Data Structures",
    cheatSheet,
    resources,
    ladder,
    plan: {
      overview:
        "Master Fenwick Trees (Binary Indexed Trees) from fundamentals to interview mastery in 4 sessions. Covers the binary trick, point/prefix operations, range update variants, and classic interview problems including LC #307, #315, and 2D BIT.",
      skippedTopics:
        "Persistent BIT, BIT with order-statistics tree hybrid, wavelet trees, BIT over non-commutative operations",
      sessions,
    },
    quizBank,
    interviewTips:
      "Always use 1-based indexing and memorize the 15-line template. Mention O(log n) per operation and O(n) build. For counting problems, think coordinate compression + BIT. Default to BIT over Segment Tree unless you need lazy propagation or non-sum operations.",
    commonMistakes:
      "Off-by-one errors with 0/1 indexing. Forgetting to compute delta (newVal - oldVal) on set operations. Using 0 as a BIT index (infinite loop). Not allocating n+2 for range update BIT (r+1 overflow).",
    patterns:
      "Prefix sum queries with updates, counting inversions, coordinate compression, difference array for range updates, 2D range queries, order statistics",
  };
}

// ── Main: Generate and Write ────────────────────────────────────────────────

function main() {
  const topics = [buildFenwickTreeTopic()];

  const outputPath = path.join(
    __dirname,
    "..",
    "public",
    "content",
    "fenwick-tree.json"
  );

  // Write minified JSON
  const json = JSON.stringify(topics);
  fs.writeFileSync(outputPath, json, "utf-8");

  // Validate
  const parsed = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
  console.log(`Generated ${outputPath}`);
  console.log(`Topics: ${parsed.length}`);
  for (const t of parsed) {
    console.log(
      `  - ${t.topic}: ${t.plan.sessions.length} sessions, ${t.quizBank.length} quiz questions`
    );
  }

  // Validate structure
  let errors = 0;
  for (const topic of parsed) {
    if (!topic.topic || !topic.category || !topic.cheatSheet) {
      console.error(
        `ERROR: Missing required field in topic "${topic.topic}"`
      );
      errors++;
    }
    if (
      !topic.plan ||
      !topic.plan.sessions ||
      topic.plan.sessions.length === 0
    ) {
      console.error(`ERROR: No sessions in topic "${topic.topic}"`);
      errors++;
    }
    for (const s of topic.plan.sessions) {
      if (
        !s.sessionNumber ||
        !s.title ||
        !s.content ||
        !s.objectives ||
        !s.activities ||
        !s.reviewQuestions
      ) {
        console.error(
          `ERROR: Missing field in session ${s.sessionNumber} of "${topic.topic}"`
        );
        errors++;
      }
    }
    if (!topic.quizBank || topic.quizBank.length === 0) {
      console.error(`ERROR: No quiz questions in topic "${topic.topic}"`);
      errors++;
    }
    for (const q of topic.quizBank) {
      if (
        !q.question ||
        !q.options ||
        !q.correctAnswer ||
        !q.explanation ||
        !q.difficulty ||
        !q.bloomLabel ||
        !q.format
      ) {
        console.error(
          `ERROR: Missing field in quiz question: "${q.question?.substring(0, 50)}"`
        );
        errors++;
      }
      if (!["A", "B", "C", "D"].includes(q.correctAnswer)) {
        console.error(
          `ERROR: Invalid correctAnswer "${q.correctAnswer}" in "${q.question?.substring(0, 50)}"`
        );
        errors++;
      }
    }
    if (!topic.ladder || !topic.ladder.levels || topic.ladder.levels.length !== 5) {
      console.error(
        `ERROR: Ladder should have 5 levels in "${topic.topic}"`
      );
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
    console.log(
      `\nValidation passed! All ${parsed.length} topics are well-formed.`
    );
  }

  // Stats
  const totalSessions = parsed.reduce(
    (sum, t) => sum + t.plan.sessions.length,
    0
  );
  const totalQuiz = parsed.reduce((sum, t) => sum + t.quizBank.length, 0);
  const fileSize = fs.statSync(outputPath).size;
  console.log(`\nStats:`);
  console.log(`  Total sessions: ${totalSessions}`);
  console.log(`  Total quiz questions: ${totalQuiz}`);
  console.log(`  File size: ${(fileSize / 1024).toFixed(1)} KB`);
}

main();
