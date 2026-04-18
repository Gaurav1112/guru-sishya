#!/usr/bin/env node
// ────────────────────────────────────────────────────────────────────────────
// generate-segment-trees.js — Generates segment-trees.json
// One topic: Segment Trees (6 sessions, 15 quiz questions, cheatsheet, ladder, resources)
// ────────────────────────────────────────────────────────────────────────────

const fs = require("fs");
const path = require("path");

function buildSegmentTreesTopic() {
  const sessions = [
    // ── Session 1: Introduction ──────────────────────────────────────────
    {
      sessionNumber: 1,
      title: "Introduction to Segment Trees",
      content: `### What is a Segment Tree?

A **Segment Tree** is a binary tree data structure used for answering **range queries** and performing **point/range updates** efficiently. Each node stores aggregate information (sum, min, max, GCD, etc.) for a contiguous segment of the underlying array.

### Why Segment Trees?

Consider an array of n elements. If you need to:
- Query the sum of elements from index l to r
- Update a single element

A naive approach gives O(n) for one of these operations. A **prefix sum** gives O(1) query but O(n) update. A Segment Tree gives **O(log n) for both**.

| Approach | Build | Query | Point Update | Range Update |
|----------|-------|-------|--------------|--------------|
| Brute force | O(1) | O(n) | O(1) | O(n) |
| Prefix sum | O(n) | O(1) | O(n) | O(n) |
| Segment Tree | O(n) | O(log n) | O(log n) | O(log n)* |
| Fenwick Tree | O(n) | O(log n) | O(log n) | O(log n)* |

*With lazy propagation

### Tree Structure

A Segment Tree for array \`[2, 1, 5, 3]\`:

\`\`\`mermaid
graph TD
    N1["[0,3] sum=11"] --> N2["[0,1] sum=3"]
    N1 --> N3["[2,3] sum=8"]
    N2 --> N4["[0,0] val=2"]
    N2 --> N5["[1,1] val=1"]
    N3 --> N6["[2,2] val=5"]
    N3 --> N7["[3,3] val=3"]
\`\`\`

**Key properties:**
- Leaves hold original array elements
- Internal nodes hold the merged result of their children
- Height = ceil(log2(n)), so total nodes <= 4n
- Stored in a flat array of size 4n (1-indexed: children of node i are 2i and 2i+1)

### When to Use Segment Trees in Interviews

- Range sum / min / max queries with updates
- Count of elements in a range satisfying a condition
- Problems mentioning "subarray", "range", "interval" with updates
- When Fenwick Tree is not enough (e.g., range min/max)

**Java — Node Representation:**
\`\`\`java
public class SegmentTree {
    private int[] tree;
    private int n;

    public SegmentTree(int[] arr) {
        n = arr.length;
        tree = new int[4 * n]; // 4n is safe upper bound
        build(arr, 1, 0, n - 1);
    }
}
\`\`\`

**Python — Node Representation:**
\`\`\`python
class SegmentTree:
    def __init__(self, arr):
        self.n = len(arr)
        self.tree = [0] * (4 * self.n)
        self._build(arr, 1, 0, self.n - 1)
\`\`\`

### Segment Tree vs Fenwick Tree

| Feature | Segment Tree | Fenwick Tree |
|---------|-------------|-------------|
| Range sum query | Yes | Yes |
| Range min/max | Yes | No (not natively) |
| Range update | Yes (lazy) | Yes (range add) |
| Code complexity | Higher | Lower |
| Constant factor | ~2-4x slower | Faster |
| Space | 4n | n |

**Rule of thumb:** Use Fenwick for range sum problems, Segment Tree for everything else.`,
      objectives: [
        "Understand what a Segment Tree is and its tree structure",
        "Compare Segment Tree with brute force, prefix sum, and Fenwick Tree",
        "Identify interview problems that require a Segment Tree",
      ],
      activities: [
        { description: "Draw a Segment Tree by hand for array [3, 1, 4, 1, 5, 9, 2, 6]", durationMinutes: 15 },
        { description: "List 5 problems where Segment Tree outperforms prefix sum", durationMinutes: 10 },
      ],
      reviewQuestions: [
        "Why is the array size 4n and not 2n for a Segment Tree?:::Because the tree is not always a perfect binary tree. When n is not a power of 2, extra space is needed for internal nodes. 4n guarantees enough space for any n.",
        "When would you choose a Fenwick Tree over a Segment Tree?:::When you only need range sum queries and point updates. Fenwick Trees are simpler to implement, use less space (n vs 4n), and have a smaller constant factor.",
      ],
      successCriteria: "Can explain Segment Tree structure and compare it with alternatives.",
      paretoJustification: "Understanding the motivation and structure is essential before implementing build/query/update.",
      resources: [
        { title: "CP-Algorithms — Segment Tree", type: "docs", url: "https://cp-algorithms.com/data_structures/segment_tree.html" },
      ],
      codeExamples: {
        java: `public class SegmentTree {
    private int[] tree;
    private int n;

    public SegmentTree(int[] arr) {
        n = arr.length;
        tree = new int[4 * n];
        build(arr, 1, 0, n - 1);
    }

    // Placeholder — build/query/update in next sessions
    private void build(int[] arr, int node, int start, int end) {
        if (start == end) { tree[node] = arr[start]; return; }
        int mid = (start + end) / 2;
        build(arr, 2 * node, start, mid);
        build(arr, 2 * node + 1, mid + 1, end);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }

    public static void main(String[] args) {
        int[] arr = {2, 1, 5, 3};
        SegmentTree st = new SegmentTree(arr);
        System.out.println("Segment Tree built for " + java.util.Arrays.toString(arr));
    }
}`,
        python: `class SegmentTree:
    def __init__(self, arr):
        self.n = len(arr)
        self.tree = [0] * (4 * self.n)
        self._build(arr, 1, 0, self.n - 1)

    def _build(self, arr, node, start, end):
        if start == end:
            self.tree[node] = arr[start]
            return
        mid = (start + end) // 2
        self._build(arr, 2 * node, start, mid)
        self._build(arr, 2 * node + 1, mid + 1, end)
        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]

arr = [2, 1, 5, 3]
st = SegmentTree(arr)
print(f"Segment Tree built for {arr}")`
      },
    },
    // ── Session 2: Build + Query ─────────────────────────────────────────
    {
      sessionNumber: 2,
      title: "Build and Range Query",
      content: `### Building the Segment Tree

The build operation is a **post-order traversal**: recursively build left and right children, then merge them into the parent.

**Time:** O(n) — each element is visited once
**Space:** O(n) — the tree array

### Build Algorithm

1. If the current segment is a single element (leaf), store it directly
2. Otherwise, split into two halves, build each recursively
3. Merge: \`tree[node] = merge(tree[left], tree[right])\`

**Java — Build + Range Sum Query:**
\`\`\`java
public class SegmentTree {
    private int[] tree;
    private int n;

    public SegmentTree(int[] arr) {
        n = arr.length;
        tree = new int[4 * n];
        build(arr, 1, 0, n - 1);
    }

    private void build(int[] arr, int node, int start, int end) {
        if (start == end) {
            tree[node] = arr[start];
            return;
        }
        int mid = (start + end) / 2;
        build(arr, 2 * node, start, mid);
        build(arr, 2 * node + 1, mid + 1, end);
        tree[node] = tree[2 * node] + tree[2 * node + 1]; // merge
    }

    // Range sum query [l, r]
    public int query(int l, int r) {
        return query(1, 0, n - 1, l, r);
    }

    private int query(int node, int start, int end, int l, int r) {
        if (r < start || end < l) return 0;        // no overlap
        if (l <= start && end <= r) return tree[node]; // total overlap
        int mid = (start + end) / 2;                 // partial overlap
        return query(2 * node, start, mid, l, r)
             + query(2 * node + 1, mid + 1, end, l, r);
    }
}
\`\`\`

**Python — Build + Range Sum Query:**
\`\`\`python
class SegmentTree:
    def __init__(self, arr):
        self.n = len(arr)
        self.tree = [0] * (4 * self.n)
        self._build(arr, 1, 0, self.n - 1)

    def _build(self, arr, node, start, end):
        if start == end:
            self.tree[node] = arr[start]
            return
        mid = (start + end) // 2
        self._build(arr, 2 * node, start, mid)
        self._build(arr, 2 * node + 1, mid + 1, end)
        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]

    def query(self, l, r):
        return self._query(1, 0, self.n - 1, l, r)

    def _query(self, node, start, end, l, r):
        if r < start or end < l:
            return 0                        # no overlap
        if l <= start and end <= r:
            return self.tree[node]           # total overlap
        mid = (start + end) // 2             # partial overlap
        return (self._query(2 * node, start, mid, l, r) +
                self._query(2 * node + 1, mid + 1, end, l, r))
\`\`\`

### Range Minimum Query (RMQ)

Change the merge function from \`+\` to \`min\`:

\`\`\`java
// In build: tree[node] = Math.min(tree[2*node], tree[2*node+1]);
// In query: return Math.min(queryLeft, queryRight);
// Identity for "no overlap" case: return Integer.MAX_VALUE;
\`\`\`

### Query Visualization

For \`query(1, 3)\` on array \`[2, 1, 5, 3]\`:

\`\`\`mermaid
graph TD
    N1["[0,3] sum=11<br/>PARTIAL"] --> N2["[0,1] sum=3<br/>PARTIAL"]
    N1 --> N3["[2,3] sum=8<br/>TOTAL"]
    N2 --> N4["[0,0] val=2<br/>NO OVERLAP"]
    N2 --> N5["[1,1] val=1<br/>TOTAL"]
    style N3 fill:#1DD1A1
    style N5 fill:#1DD1A1
    style N4 fill:#E85D26
\`\`\`

Result: 1 + 8 = 9

### Three Cases in Query

Every recursive call falls into one of three cases:
1. **No overlap** — query range is completely outside node range. Return identity (0 for sum, INF for min)
2. **Total overlap** — node range is completely inside query range. Return node value
3. **Partial overlap** — recurse into both children and merge results

This three-case pattern is the **most important concept** to internalize.`,
      objectives: [
        "Implement the build operation using post-order traversal",
        "Implement range sum query with the three-case pattern",
        "Adapt the query for range minimum (RMQ)",
      ],
      activities: [
        { description: "Implement SegmentTree with build + query for range sum, test on [1,3,5,7,9,11]", durationMinutes: 25 },
        { description: "Modify the tree to support Range Min Query and verify with manual calculation", durationMinutes: 20 },
      ],
      reviewQuestions: [
        "What are the three cases in a Segment Tree query and when does each occur?:::1) No overlap: query range [l,r] is entirely outside node range [start,end] — return identity. 2) Total overlap: node range is entirely inside query range — return node value. 3) Partial overlap: recurse into both children and merge.",
        "Why is build O(n) and not O(n log n)?:::Each of the n leaves is visited exactly once, and each internal node does O(1) work (merge). Total nodes <= 2n, so total work is O(n).",
      ],
      successCriteria: "Can implement build + range query and explain the three-case pattern.",
      paretoJustification: "Build and query are the foundation. Every Segment Tree problem uses this pattern.",
      resources: [
        { title: "Visualgo — Segment Tree", type: "interactive", url: "https://visualgo.net/en/segmenttree" },
      ],
      codeExamples: {
        java: `public class SegmentTree {
    private int[] tree;
    private int n;

    public SegmentTree(int[] arr) {
        n = arr.length;
        tree = new int[4 * n];
        build(arr, 1, 0, n - 1);
    }

    private void build(int[] arr, int node, int start, int end) {
        if (start == end) { tree[node] = arr[start]; return; }
        int mid = (start + end) / 2;
        build(arr, 2 * node, start, mid);
        build(arr, 2 * node + 1, mid + 1, end);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }

    public int query(int l, int r) { return query(1, 0, n - 1, l, r); }

    private int query(int node, int start, int end, int l, int r) {
        if (r < start || end < l) return 0;
        if (l <= start && end <= r) return tree[node];
        int mid = (start + end) / 2;
        return query(2 * node, start, mid, l, r)
             + query(2 * node + 1, mid + 1, end, l, r);
    }

    public static void main(String[] args) {
        int[] arr = {1, 3, 5, 7, 9, 11};
        SegmentTree st = new SegmentTree(arr);
        System.out.println("Sum [1,3] = " + st.query(1, 3)); // 3+5+7=15
        System.out.println("Sum [0,5] = " + st.query(0, 5)); // 36
    }
}`,
        python: `class SegmentTree:
    def __init__(self, arr):
        self.n = len(arr)
        self.tree = [0] * (4 * self.n)
        self._build(arr, 1, 0, self.n - 1)

    def _build(self, arr, node, start, end):
        if start == end:
            self.tree[node] = arr[start]; return
        mid = (start + end) // 2
        self._build(arr, 2 * node, start, mid)
        self._build(arr, 2 * node + 1, mid + 1, end)
        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]

    def query(self, l, r):
        return self._query(1, 0, self.n - 1, l, r)

    def _query(self, node, start, end, l, r):
        if r < start or end < l: return 0
        if l <= start and end <= r: return self.tree[node]
        mid = (start + end) // 2
        return (self._query(2 * node, start, mid, l, r) +
                self._query(2 * node + 1, mid + 1, end, l, r))

arr = [1, 3, 5, 7, 9, 11]
st = SegmentTree(arr)
print(f"Sum [1,3] = {st.query(1, 3)}")  # 15
print(f"Sum [0,5] = {st.query(0, 5)}")  # 36`
      },
    },
    // ── Session 3: Point Update ──────────────────────────────────────────
    {
      sessionNumber: 3,
      title: "Point Update",
      content: `### Point Update — Modifying a Single Element

After building the tree, we often need to update a single element and propagate the change upward. This is the **point update** operation.

**Time:** O(log n) — we traverse from root to the target leaf, then update ancestors on the way back.

### Algorithm

1. Navigate to the leaf node for index \`idx\`
2. Update the leaf value
3. On the way back up, re-merge children: \`tree[node] = tree[2*node] + tree[2*node+1]\`

**Java — Point Update:**
\`\`\`java
public class SegmentTree {
    private int[] tree;
    private int n;

    public SegmentTree(int[] arr) {
        n = arr.length;
        tree = new int[4 * n];
        build(arr, 1, 0, n - 1);
    }

    private void build(int[] arr, int node, int start, int end) {
        if (start == end) { tree[node] = arr[start]; return; }
        int mid = (start + end) / 2;
        build(arr, 2 * node, start, mid);
        build(arr, 2 * node + 1, mid + 1, end);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }

    // Point update: set arr[idx] = val
    public void update(int idx, int val) {
        update(1, 0, n - 1, idx, val);
    }

    private void update(int node, int start, int end, int idx, int val) {
        if (start == end) {
            tree[node] = val; // leaf — set new value
            return;
        }
        int mid = (start + end) / 2;
        if (idx <= mid)
            update(2 * node, start, mid, idx, val);
        else
            update(2 * node + 1, mid + 1, end, idx, val);
        tree[node] = tree[2 * node] + tree[2 * node + 1]; // re-merge
    }

    public int query(int l, int r) {
        return query(1, 0, n - 1, l, r);
    }

    private int query(int node, int start, int end, int l, int r) {
        if (r < start || end < l) return 0;
        if (l <= start && end <= r) return tree[node];
        int mid = (start + end) / 2;
        return query(2 * node, start, mid, l, r)
             + query(2 * node + 1, mid + 1, end, l, r);
    }
}
\`\`\`

**Python — Point Update:**
\`\`\`python
class SegmentTree:
    def __init__(self, arr):
        self.n = len(arr)
        self.tree = [0] * (4 * self.n)
        self._build(arr, 1, 0, self.n - 1)

    def _build(self, arr, node, start, end):
        if start == end:
            self.tree[node] = arr[start]; return
        mid = (start + end) // 2
        self._build(arr, 2 * node, start, mid)
        self._build(arr, 2 * node + 1, mid + 1, end)
        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]

    def update(self, idx, val):
        self._update(1, 0, self.n - 1, idx, val)

    def _update(self, node, start, end, idx, val):
        if start == end:
            self.tree[node] = val
            return
        mid = (start + end) // 2
        if idx <= mid:
            self._update(2 * node, start, mid, idx, val)
        else:
            self._update(2 * node + 1, mid + 1, end, idx, val)
        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]

    def query(self, l, r):
        return self._query(1, 0, self.n - 1, l, r)

    def _query(self, node, start, end, l, r):
        if r < start or end < l: return 0
        if l <= start and end <= r: return self.tree[node]
        mid = (start + end) // 2
        return (self._query(2 * node, start, mid, l, r) +
                self._query(2 * node + 1, mid + 1, end, l, r))
\`\`\`

### LeetCode #307: Range Sum Query - Mutable

This is the classic Segment Tree problem. Given an array, implement:
- \`update(index, val)\` — set the element at index to val
- \`sumRange(left, right)\` — return the sum of elements between left and right inclusive

**Solution:** Directly use the Segment Tree we built above. The constructor calls build, update maps to point update, and sumRange maps to range query.

### Update Visualization

Update index 2 from 5 to 10 in \`[2, 1, 5, 3]\`:

\`\`\`mermaid
graph TD
    N1["[0,3] 11 -> 16"] --> N2["[0,1] 3"]
    N1 --> N3["[2,3] 8 -> 13"]
    N2 --> N4["[0,0] 2"]
    N2 --> N5["[1,1] 1"]
    N3 --> N6["[2,2] 5 -> 10"]
    N3 --> N7["[3,3] 3"]
    style N6 fill:#E85D26
    style N3 fill:#FDB813
    style N1 fill:#FDB813
\`\`\`

Only O(log n) nodes are updated (the path from leaf to root).

### Increment Update vs Set Update

Two flavors:
- **Set update:** \`arr[idx] = val\` — replace the leaf value
- **Increment update:** \`arr[idx] += delta\` — add delta to the leaf

For increment, change the leaf line to \`tree[node] += delta\` and the re-merge stays the same.`,
      objectives: [
        "Implement point update with value propagation to ancestors",
        "Solve LeetCode #307 (Range Sum Query - Mutable)",
        "Understand set update vs increment update variants",
      ],
      activities: [
        { description: "Implement full SegmentTree (build + query + update), test with LC #307 examples", durationMinutes: 30 },
        { description: "Trace through an update call and verify all ancestor nodes are correctly updated", durationMinutes: 15 },
      ],
      reviewQuestions: [
        "Why is point update O(log n)?:::We only visit nodes on the path from root to the target leaf. The tree height is O(log n), so we visit O(log n) nodes, doing O(1) work at each.",
        "What happens if you forget to re-merge after updating the leaf?:::The ancestor nodes will hold stale values. Subsequent queries that pass through those ancestors will return incorrect results.",
      ],
      successCriteria: "Can implement point update and solve LC #307.",
      paretoJustification: "Point update completes the basic Segment Tree. LC #307 is the most common Segment Tree interview problem.",
      resources: [
        { title: "LeetCode #307 — Range Sum Query Mutable", type: "practice", url: "https://leetcode.com/problems/range-sum-query-mutable/" },
      ],
      codeExamples: {
        java: `// LeetCode #307 — Range Sum Query Mutable
class NumArray {
    private int[] tree;
    private int n;

    public NumArray(int[] nums) {
        n = nums.length;
        tree = new int[4 * n];
        if (n > 0) build(nums, 1, 0, n - 1);
    }

    private void build(int[] arr, int node, int s, int e) {
        if (s == e) { tree[node] = arr[s]; return; }
        int mid = (s + e) / 2;
        build(arr, 2 * node, s, mid);
        build(arr, 2 * node + 1, mid + 1, e);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }

    public void update(int index, int val) {
        update(1, 0, n - 1, index, val);
    }

    private void update(int node, int s, int e, int idx, int val) {
        if (s == e) { tree[node] = val; return; }
        int mid = (s + e) / 2;
        if (idx <= mid) update(2 * node, s, mid, idx, val);
        else update(2 * node + 1, mid + 1, e, idx, val);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }

    public int sumRange(int left, int right) {
        return query(1, 0, n - 1, left, right);
    }

    private int query(int node, int s, int e, int l, int r) {
        if (r < s || e < l) return 0;
        if (l <= s && e <= r) return tree[node];
        int mid = (s + e) / 2;
        return query(2 * node, s, mid, l, r)
             + query(2 * node + 1, mid + 1, e, l, r);
    }

    public static void main(String[] args) {
        NumArray na = new NumArray(new int[]{1, 3, 5});
        System.out.println(na.sumRange(0, 2)); // 9
        na.update(1, 2);
        System.out.println(na.sumRange(0, 2)); // 8
    }
}`,
        python: `# LeetCode #307 — Range Sum Query Mutable
class NumArray:
    def __init__(self, nums):
        self.n = len(nums)
        self.tree = [0] * (4 * self.n)
        if self.n > 0:
            self._build(nums, 1, 0, self.n - 1)

    def _build(self, arr, node, s, e):
        if s == e: self.tree[node] = arr[s]; return
        mid = (s + e) // 2
        self._build(arr, 2 * node, s, mid)
        self._build(arr, 2 * node + 1, mid + 1, e)
        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]

    def update(self, index, val):
        self._update(1, 0, self.n - 1, index, val)

    def _update(self, node, s, e, idx, val):
        if s == e: self.tree[node] = val; return
        mid = (s + e) // 2
        if idx <= mid: self._update(2 * node, s, mid, idx, val)
        else: self._update(2 * node + 1, mid + 1, e, idx, val)
        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]

    def sumRange(self, left, right):
        return self._query(1, 0, self.n - 1, left, right)

    def _query(self, node, s, e, l, r):
        if r < s or e < l: return 0
        if l <= s and e <= r: return self.tree[node]
        mid = (s + e) // 2
        return (self._query(2 * node, s, mid, l, r) +
                self._query(2 * node + 1, mid + 1, e, l, r))

na = NumArray([1, 3, 5])
print(na.sumRange(0, 2))  # 9
na.update(1, 2)
print(na.sumRange(0, 2))  # 8`
      },
    },
    // ── Session 4: Lazy Propagation ──────────────────────────────────────
    {
      sessionNumber: 4,
      title: "Lazy Propagation — Range Updates",
      content: `### The Problem with Range Updates

Suppose you need to add a value to every element in range [l, r]. With point updates, this is O(n log n) — too slow for large ranges.

**Lazy Propagation** defers updates: instead of immediately updating all affected nodes, we store a "pending update" (lazy value) and push it down only when needed.

### How Lazy Propagation Works

1. **Range update:** Mark affected nodes with a lazy value instead of updating all descendants
2. **Push down:** Before querying or updating a node's children, push any pending lazy value to the children
3. **Merge:** After pushing down and recursing, re-merge the current node

\`\`\`mermaid
graph TD
    subgraph "Before: add 3 to [0,3]"
    A["[0,3] sum=11<br/>lazy=0"] --> B["[0,1] sum=3"]
    A --> C["[2,3] sum=8"]
    end
    subgraph "After: lazy stored at root"
    D["[0,3] sum=23<br/>lazy=3"] --> E["[0,1] sum=3<br/>NOT updated yet"]
    D --> F["[2,3] sum=8<br/>NOT updated yet"]
    end
\`\`\`

When we later query [0,1], the lazy value is pushed down:

\`\`\`mermaid
graph TD
    G["[0,3] sum=23<br/>lazy=0"] --> H["[0,1] sum=9<br/>lazy=3"]
    G --> I["[2,3] sum=14<br/>lazy=3"]
\`\`\`

### Implementation

**Java — Lazy Propagation:**
\`\`\`java
public class LazySegTree {
    private long[] tree, lazy;
    private int n;

    public LazySegTree(int[] arr) {
        n = arr.length;
        tree = new long[4 * n];
        lazy = new long[4 * n];
        build(arr, 1, 0, n - 1);
    }

    private void build(int[] arr, int node, int s, int e) {
        if (s == e) { tree[node] = arr[s]; return; }
        int mid = (s + e) / 2;
        build(arr, 2 * node, s, mid);
        build(arr, 2 * node + 1, mid + 1, e);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }

    private void pushDown(int node, int s, int e) {
        if (lazy[node] != 0) {
            int mid = (s + e) / 2;
            apply(2 * node, s, mid, lazy[node]);
            apply(2 * node + 1, mid + 1, e, lazy[node]);
            lazy[node] = 0;
        }
    }

    private void apply(int node, int s, int e, long val) {
        tree[node] += val * (e - s + 1); // add val to each element
        lazy[node] += val;
    }

    public void rangeUpdate(int l, int r, long val) {
        rangeUpdate(1, 0, n - 1, l, r, val);
    }

    private void rangeUpdate(int node, int s, int e, int l, int r, long val) {
        if (r < s || e < l) return;
        if (l <= s && e <= r) { apply(node, s, e, val); return; }
        pushDown(node, s, e);
        int mid = (s + e) / 2;
        rangeUpdate(2 * node, s, mid, l, r, val);
        rangeUpdate(2 * node + 1, mid + 1, e, l, r, val);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }

    public long query(int l, int r) {
        return query(1, 0, n - 1, l, r);
    }

    private long query(int node, int s, int e, int l, int r) {
        if (r < s || e < l) return 0;
        if (l <= s && e <= r) return tree[node];
        pushDown(node, s, e);
        int mid = (s + e) / 2;
        return query(2 * node, s, mid, l, r)
             + query(2 * node + 1, mid + 1, e, l, r);
    }
}
\`\`\`

**Python — Lazy Propagation:**
\`\`\`python
class LazySegTree:
    def __init__(self, arr):
        self.n = len(arr)
        self.tree = [0] * (4 * self.n)
        self.lazy = [0] * (4 * self.n)
        self._build(arr, 1, 0, self.n - 1)

    def _build(self, arr, node, s, e):
        if s == e:
            self.tree[node] = arr[s]; return
        mid = (s + e) // 2
        self._build(arr, 2 * node, s, mid)
        self._build(arr, 2 * node + 1, mid + 1, e)
        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]

    def _apply(self, node, s, e, val):
        self.tree[node] += val * (e - s + 1)
        self.lazy[node] += val

    def _push_down(self, node, s, e):
        if self.lazy[node] != 0:
            mid = (s + e) // 2
            self._apply(2 * node, s, mid, self.lazy[node])
            self._apply(2 * node + 1, mid + 1, e, self.lazy[node])
            self.lazy[node] = 0

    def range_update(self, l, r, val):
        self._range_update(1, 0, self.n - 1, l, r, val)

    def _range_update(self, node, s, e, l, r, val):
        if r < s or e < l: return
        if l <= s and e <= r:
            self._apply(node, s, e, val); return
        self._push_down(node, s, e)
        mid = (s + e) // 2
        self._range_update(2 * node, s, mid, l, r, val)
        self._range_update(2 * node + 1, mid + 1, e, l, r, val)
        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]

    def query(self, l, r):
        return self._query(1, 0, self.n - 1, l, r)

    def _query(self, node, s, e, l, r):
        if r < s or e < l: return 0
        if l <= s and e <= r: return self.tree[node]
        self._push_down(node, s, e)
        mid = (s + e) // 2
        return (self._query(2 * node, s, mid, l, r) +
                self._query(2 * node + 1, mid + 1, e, l, r))
\`\`\`

### Key Insight: When to Push Down

Push down lazy values **before accessing children** — both in query and update. This ensures children always have up-to-date values when we recurse into them.

### Common Lazy Operations

| Operation | apply() | Composability |
|-----------|---------|---------------|
| Range add | tree += val * len | lazy += val |
| Range set | tree = val * len | lazy = val (flag needed) |
| Range XOR | tree ^= (popcount logic) | lazy ^= val |

For **range set**, you need a separate flag to distinguish "no pending update" from "set to 0".`,
      objectives: [
        "Understand why lazy propagation is needed for range updates",
        "Implement push-down and range update with lazy values",
        "Handle both range add and range set operations",
      ],
      activities: [
        { description: "Implement LazySegTree with range add and verify with manual calculation on [1,2,3,4,5]", durationMinutes: 30 },
        { description: "Extend to support range set (assign) in addition to range add", durationMinutes: 20 },
      ],
      reviewQuestions: [
        "Why must we push down lazy values before accessing children?:::If we recurse into children without pushing down, the children will have stale values. Any query or update on them will produce incorrect results because the pending range update hasn't been applied.",
        "How does lazy propagation achieve O(log n) for range updates?:::Instead of updating all O(n) leaves, we only update O(log n) nodes at the boundary of the range. Interior nodes get a lazy tag that defers the work until it's actually needed.",
      ],
      successCriteria: "Can implement lazy propagation for range add updates.",
      paretoJustification: "Lazy propagation is the single most important Segment Tree technique. It appears in nearly all advanced problems.",
      resources: [
        { title: "Codeforces — Lazy Propagation Tutorial", type: "blogs", url: "https://codeforces.com/blog/entry/18051" },
      ],
      codeExamples: {
        java: `public class LazySegTree {
    private long[] tree, lazy;
    private int n;

    public LazySegTree(int[] arr) {
        n = arr.length;
        tree = new long[4 * n];
        lazy = new long[4 * n];
        build(arr, 1, 0, n - 1);
    }

    private void build(int[] a, int nd, int s, int e) {
        if (s == e) { tree[nd] = a[s]; return; }
        int m = (s + e) / 2;
        build(a, 2*nd, s, m); build(a, 2*nd+1, m+1, e);
        tree[nd] = tree[2*nd] + tree[2*nd+1];
    }

    private void push(int nd, int s, int e) {
        if (lazy[nd] != 0) {
            int m = (s+e)/2;
            tree[2*nd] += lazy[nd]*(m-s+1); lazy[2*nd] += lazy[nd];
            tree[2*nd+1] += lazy[nd]*(e-m); lazy[2*nd+1] += lazy[nd];
            lazy[nd] = 0;
        }
    }

    public void rangeAdd(int l, int r, long v) { upd(1,0,n-1,l,r,v); }

    private void upd(int nd, int s, int e, int l, int r, long v) {
        if (r<s||e<l) return;
        if (l<=s&&e<=r) { tree[nd]+=v*(e-s+1); lazy[nd]+=v; return; }
        push(nd,s,e); int m=(s+e)/2;
        upd(2*nd,s,m,l,r,v); upd(2*nd+1,m+1,e,l,r,v);
        tree[nd]=tree[2*nd]+tree[2*nd+1];
    }

    public long query(int l, int r) { return qry(1,0,n-1,l,r); }

    private long qry(int nd, int s, int e, int l, int r) {
        if (r<s||e<l) return 0;
        if (l<=s&&e<=r) return tree[nd];
        push(nd,s,e); int m=(s+e)/2;
        return qry(2*nd,s,m,l,r)+qry(2*nd+1,m+1,e,l,r);
    }

    public static void main(String[] args) {
        LazySegTree st = new LazySegTree(new int[]{1,2,3,4,5});
        st.rangeAdd(1, 3, 10); // add 10 to indices 1..3
        System.out.println(st.query(0, 4)); // 1+12+13+14+5=45
    }
}`,
        python: `class LazySegTree:
    def __init__(self, arr):
        self.n = len(arr)
        self.tree = [0]*(4*self.n)
        self.lazy = [0]*(4*self.n)
        self._build(arr, 1, 0, self.n-1)

    def _build(self, a, nd, s, e):
        if s == e: self.tree[nd] = a[s]; return
        m = (s+e)//2
        self._build(a, 2*nd, s, m)
        self._build(a, 2*nd+1, m+1, e)
        self.tree[nd] = self.tree[2*nd] + self.tree[2*nd+1]

    def _push(self, nd, s, e):
        if self.lazy[nd]:
            m = (s+e)//2
            for child, cs, ce in [(2*nd,s,m),(2*nd+1,m+1,e)]:
                self.tree[child] += self.lazy[nd]*(ce-cs+1)
                self.lazy[child] += self.lazy[nd]
            self.lazy[nd] = 0

    def range_add(self, l, r, v):
        self._upd(1, 0, self.n-1, l, r, v)

    def _upd(self, nd, s, e, l, r, v):
        if r < s or e < l: return
        if l <= s and e <= r:
            self.tree[nd] += v*(e-s+1); self.lazy[nd] += v; return
        self._push(nd, s, e); m = (s+e)//2
        self._upd(2*nd, s, m, l, r, v)
        self._upd(2*nd+1, m+1, e, l, r, v)
        self.tree[nd] = self.tree[2*nd] + self.tree[2*nd+1]

    def query(self, l, r):
        return self._qry(1, 0, self.n-1, l, r)

    def _qry(self, nd, s, e, l, r):
        if r < s or e < l: return 0
        if l <= s and e <= r: return self.tree[nd]
        self._push(nd, s, e); m = (s+e)//2
        return self._qry(2*nd, s, m, l, r) + self._qry(2*nd+1, m+1, e, l, r)

st = LazySegTree([1, 2, 3, 4, 5])
st.range_add(1, 3, 10)
print(st.query(0, 4))  # 45`
      },
    },
    // ── Session 5: Advanced Techniques ───────────────────────────────────
    {
      sessionNumber: 5,
      title: "Advanced — Merge Sort Tree and Persistent Segment Tree",
      content: `### Merge Sort Tree

A **Merge Sort Tree** stores the sorted subarray at each node instead of a single aggregate value. This enables queries like "count of elements in range [l,r] that are less than k".

**Space:** O(n log n) — each element appears in O(log n) nodes
**Query:** O(log^2 n) — binary search at each of O(log n) nodes

### Merge Sort Tree Structure

For array \`[3, 1, 4, 1, 5, 9]\`:

\`\`\`mermaid
graph TD
    A["[0,5]: 1,1,3,4,5,9"] --> B["[0,2]: 1,3,4"]
    A --> C["[3,5]: 1,5,9"]
    B --> D["[0,1]: 1,3"]
    B --> E["[2,2]: 4"]
    C --> F["[3,4]: 1,5"]
    C --> G["[5,5]: 9"]
\`\`\`

### Count Elements Less Than k in Range [l,r]

At each node overlapping [l,r], binary search for k in the sorted array. Sum the counts.

**Java:**
\`\`\`java
import java.util.*;

public class MergeSortTree {
    private List<Integer>[] tree;
    private int n;

    @SuppressWarnings("unchecked")
    public MergeSortTree(int[] arr) {
        n = arr.length;
        tree = new ArrayList[4 * n];
        build(arr, 1, 0, n - 1);
    }

    private void build(int[] arr, int node, int s, int e) {
        tree[node] = new ArrayList<>();
        if (s == e) {
            tree[node].add(arr[s]);
            return;
        }
        int mid = (s + e) / 2;
        build(arr, 2 * node, s, mid);
        build(arr, 2 * node + 1, mid + 1, e);
        // Merge two sorted lists
        merge(tree[2 * node], tree[2 * node + 1], tree[node]);
    }

    private void merge(List<Integer> a, List<Integer> b, List<Integer> out) {
        int i = 0, j = 0;
        while (i < a.size() && j < b.size()) {
            if (a.get(i) <= b.get(j)) out.add(a.get(i++));
            else out.add(b.get(j++));
        }
        while (i < a.size()) out.add(a.get(i++));
        while (j < b.size()) out.add(b.get(j++));
    }

    // Count elements < k in range [l, r]
    public int countLessThan(int l, int r, int k) {
        return countLess(1, 0, n - 1, l, r, k);
    }

    private int countLess(int node, int s, int e, int l, int r, int k) {
        if (r < s || e < l) return 0;
        if (l <= s && e <= r) {
            return lowerBound(tree[node], k);
        }
        int mid = (s + e) / 2;
        return countLess(2 * node, s, mid, l, r, k)
             + countLess(2 * node + 1, mid + 1, e, l, r, k);
    }

    private int lowerBound(List<Integer> list, int k) {
        int lo = 0, hi = list.size();
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (list.get(mid) < k) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
}
\`\`\`

**Python:**
\`\`\`python
from bisect import bisect_left

class MergeSortTree:
    def __init__(self, arr):
        self.n = len(arr)
        self.tree = [[] for _ in range(4 * self.n)]
        self._build(arr, 1, 0, self.n - 1)

    def _build(self, arr, node, s, e):
        if s == e:
            self.tree[node] = [arr[s]]
            return
        mid = (s + e) // 2
        self._build(arr, 2 * node, s, mid)
        self._build(arr, 2 * node + 1, mid + 1, e)
        # Merge sorted lists
        a, b = self.tree[2 * node], self.tree[2 * node + 1]
        merged, i, j = [], 0, 0
        while i < len(a) and j < len(b):
            if a[i] <= b[j]: merged.append(a[i]); i += 1
            else: merged.append(b[j]); j += 1
        merged.extend(a[i:]); merged.extend(b[j:])
        self.tree[node] = merged

    def count_less_than(self, l, r, k):
        return self._query(1, 0, self.n - 1, l, r, k)

    def _query(self, node, s, e, l, r, k):
        if r < s or e < l: return 0
        if l <= s and e <= r:
            return bisect_left(self.tree[node], k)
        mid = (s + e) // 2
        return (self._query(2 * node, s, mid, l, r, k) +
                self._query(2 * node + 1, mid + 1, e, l, r, k))
\`\`\`

### Persistent Segment Tree (Conceptual)

A **Persistent Segment Tree** keeps all historical versions. Each update creates a new root but reuses unchanged subtrees (structural sharing).

**Use cases:**
- Query the array state at any past version
- k-th smallest in range (with coordinate compression)
- Online queries where each query depends on a previous version

**Key idea:** Instead of modifying nodes in-place, create new nodes for the path from root to the updated leaf. Unchanged subtrees are shared.

\`\`\`mermaid
graph TD
    subgraph "Version 0"
    V0["root v0"] --> A["[0,1]"]
    V0 --> B["[2,3]"]
    end
    subgraph "Version 1 (update index 2)"
    V1["root v1"] --> A
    V1 --> B2["[2,3] new"]
    end
\`\`\`

**Space per update:** O(log n) — only the path nodes are duplicated.

### Interview Relevance

- Merge Sort Tree: "count inversions in a range", "k-th smallest in range"
- Persistent Segment Tree: rarely asked in interviews but appears in competitive programming
- Focus on understanding the concept; implementation details can be looked up`,
      objectives: [
        "Understand Merge Sort Tree structure and query pattern",
        "Implement count-less-than-k query using Merge Sort Tree",
        "Understand Persistent Segment Tree concept and structural sharing",
      ],
      activities: [
        { description: "Implement MergeSortTree and test countLessThan on [3,1,4,1,5,9]", durationMinutes: 30 },
        { description: "Draw the structural sharing diagram for 3 versions of a persistent tree", durationMinutes: 15 },
      ],
      reviewQuestions: [
        "Why is Merge Sort Tree query O(log^2 n) instead of O(log n)?:::At each of the O(log n) nodes we visit, we perform a binary search on the sorted list stored at that node, which takes O(log n). Total: O(log n) * O(log n) = O(log^2 n).",
        "How does a Persistent Segment Tree achieve O(log n) space per update?:::It only creates new nodes for the path from root to the updated leaf (O(log n) nodes). All other subtrees are shared with the previous version via pointers.",
      ],
      successCriteria: "Can implement Merge Sort Tree and explain Persistent Segment Tree concept.",
      paretoJustification: "These advanced variants appear in harder interviews and competitive programming. Understanding them signals deep knowledge.",
      resources: [
        { title: "CP-Algorithms — Merge Sort Tree", type: "docs", url: "https://cp-algorithms.com/data_structures/merge_sort_tree.html" },
      ],
      codeExamples: {
        java: `import java.util.*;

public class MergeSortTree {
    private List<Integer>[] tree;
    private int n;

    @SuppressWarnings("unchecked")
    public MergeSortTree(int[] arr) {
        n = arr.length;
        tree = new ArrayList[4 * n];
        build(arr, 1, 0, n - 1);
    }

    private void build(int[] arr, int nd, int s, int e) {
        tree[nd] = new ArrayList<>();
        if (s == e) { tree[nd].add(arr[s]); return; }
        int m = (s + e) / 2;
        build(arr, 2*nd, s, m); build(arr, 2*nd+1, m+1, e);
        int i = 0, j = 0;
        var a = tree[2*nd]; var b = tree[2*nd+1];
        while (i < a.size() && j < b.size())
            tree[nd].add(a.get(i) <= b.get(j) ? a.get(i++) : b.get(j++));
        while (i < a.size()) tree[nd].add(a.get(i++));
        while (j < b.size()) tree[nd].add(b.get(j++));
    }

    public int countLess(int l, int r, int k) { return qry(1,0,n-1,l,r,k); }

    private int qry(int nd, int s, int e, int l, int r, int k) {
        if (r<s||e<l) return 0;
        if (l<=s&&e<=r) return Collections.binarySearch(tree[nd],k) < 0
            ? -Collections.binarySearch(tree[nd],k)-1
            : Collections.binarySearch(tree[nd],k);
        int m=(s+e)/2;
        return qry(2*nd,s,m,l,r,k)+qry(2*nd+1,m+1,e,l,r,k);
    }

    public static void main(String[] args) {
        MergeSortTree mst = new MergeSortTree(new int[]{3,1,4,1,5,9});
        System.out.println("Elements < 4 in [0,5]: " + mst.countLess(0, 5, 4)); // 3
    }
}`,
        python: `from bisect import bisect_left

class MergeSortTree:
    def __init__(self, arr):
        self.n = len(arr)
        self.tree = [[] for _ in range(4 * self.n)]
        self._build(arr, 1, 0, self.n - 1)

    def _build(self, arr, nd, s, e):
        if s == e: self.tree[nd] = [arr[s]]; return
        m = (s + e) // 2
        self._build(arr, 2*nd, s, m)
        self._build(arr, 2*nd+1, m+1, e)
        a, b = self.tree[2*nd], self.tree[2*nd+1]
        merged, i, j = [], 0, 0
        while i < len(a) and j < len(b):
            if a[i] <= b[j]: merged.append(a[i]); i += 1
            else: merged.append(b[j]); j += 1
        merged.extend(a[i:]); merged.extend(b[j:])
        self.tree[nd] = merged

    def count_less(self, l, r, k):
        return self._qry(1, 0, self.n-1, l, r, k)

    def _qry(self, nd, s, e, l, r, k):
        if r < s or e < l: return 0
        if l <= s and e <= r: return bisect_left(self.tree[nd], k)
        m = (s + e) // 2
        return self._qry(2*nd, s, m, l, r, k) + self._qry(2*nd+1, m+1, e, l, r, k)

mst = MergeSortTree([3, 1, 4, 1, 5, 9])
print(f"Elements < 4 in [0,5]: {mst.count_less(0, 5, 4)}")  # 3`
      },
    },
    // ── Session 6: Interview Problems ────────────────────────────────────
    {
      sessionNumber: 6,
      title: "Interview Problems — LC #307, #308, #315",
      content: `### LeetCode #307: Range Sum Query - Mutable (Medium)

We solved this in Session 3. Key points for the interview:
- Build: O(n), Query: O(log n), Update: O(log n)
- Use 1-indexed array, children at 2i and 2i+1
- Three-case query pattern

### LeetCode #308: Range Sum Query 2D - Mutable (Hard)

Given a 2D matrix, implement:
- \`update(row, col, val)\` — set matrix[row][col] = val
- \`sumRegion(r1, c1, r2, c2)\` — sum of elements in the rectangle

**Approach:** Use a 2D Segment Tree (segment tree of segment trees) or a 2D BIT (simpler). Each row has its own segment tree over columns.

**Java — 2D using BIT (Binary Indexed Tree):**
\`\`\`java
class NumMatrix {
    private int[][] tree;
    private int[][] nums;
    private int m, n;

    public NumMatrix(int[][] matrix) {
        m = matrix.length; n = matrix[0].length;
        tree = new int[m + 1][n + 1];
        nums = new int[m][n];
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                update(i, j, matrix[i][j]);
    }

    public void update(int row, int col, int val) {
        int delta = val - nums[row][col];
        nums[row][col] = val;
        for (int i = row + 1; i <= m; i += i & (-i))
            for (int j = col + 1; j <= n; j += j & (-j))
                tree[i][j] += delta;
    }

    private int sum(int row, int col) {
        int s = 0;
        for (int i = row; i > 0; i -= i & (-i))
            for (int j = col; j > 0; j -= j & (-j))
                s += tree[i][j];
        return s;
    }

    public int sumRegion(int r1, int c1, int r2, int c2) {
        return sum(r2+1, c2+1) - sum(r1, c2+1) - sum(r2+1, c1) + sum(r1, c1);
    }
}
\`\`\`

**Python — 2D using BIT:**
\`\`\`python
class NumMatrix:
    def __init__(self, matrix):
        self.m, self.n = len(matrix), len(matrix[0])
        self.tree = [[0]*(self.n+1) for _ in range(self.m+1)]
        self.nums = [[0]*self.n for _ in range(self.m)]
        for i in range(self.m):
            for j in range(self.n):
                self.update(i, j, matrix[i][j])

    def update(self, row, col, val):
        delta = val - self.nums[row][col]
        self.nums[row][col] = val
        i = row + 1
        while i <= self.m:
            j = col + 1
            while j <= self.n:
                self.tree[i][j] += delta
                j += j & (-j)
            i += i & (-i)

    def _sum(self, row, col):
        s, i = 0, row
        while i > 0:
            j = col
            while j > 0:
                s += self.tree[i][j]
                j -= j & (-j)
            i -= i & (-i)
        return s

    def sumRegion(self, r1, c1, r2, c2):
        return (self._sum(r2+1, c2+1) - self._sum(r1, c2+1)
              - self._sum(r2+1, c1) + self._sum(r1, c1))
\`\`\`

### LeetCode #315: Count of Smaller Numbers After Self (Hard)

Given an array nums, return a list where answer[i] is the count of elements to the right of nums[i] that are strictly smaller.

**Approach:** Process from right to left. Use a Segment Tree (or BIT) over value range to count elements smaller than current.

**Java — Using BIT on Coordinate-Compressed Values:**
\`\`\`java
class Solution {
    public List<Integer> countSmaller(int[] nums) {
        // Coordinate compression
        int[] sorted = nums.clone();
        Arrays.sort(sorted);
        Map<Integer, Integer> rank = new HashMap<>();
        int r = 1;
        for (int v : sorted)
            if (!rank.containsKey(v)) rank.put(v, r++);

        int[] bit = new int[r + 1];
        Integer[] result = new Integer[nums.length];

        for (int i = nums.length - 1; i >= 0; i--) {
            int rk = rank.get(nums[i]);
            result[i] = query(bit, rk - 1); // count elements with rank < rk
            update(bit, rk, r);
        }
        return Arrays.asList(result);
    }

    private void update(int[] bit, int i, int n) {
        for (; i < n; i += i & (-i)) bit[i]++;
    }

    private int query(int[] bit, int i) {
        int s = 0;
        for (; i > 0; i -= i & (-i)) s += bit[i];
        return s;
    }
}
\`\`\`

**Python — Using BIT:**
\`\`\`python
class Solution:
    def countSmaller(self, nums):
        # Coordinate compression
        sorted_unique = sorted(set(nums))
        rank = {v: i+1 for i, v in enumerate(sorted_unique)}
        n = len(rank) + 1
        bit = [0] * (n + 1)

        def update(i):
            while i < n: bit[i] += 1; i += i & (-i)

        def query(i):
            s = 0
            while i > 0: s += bit[i]; i -= i & (-i)
            return s

        result = []
        for v in reversed(nums):
            result.append(query(rank[v] - 1))
            update(rank[v])
        return result[::-1]
\`\`\`

### Interview Strategy for Segment Tree Problems

1. **Recognize the pattern:** range query + updates = Segment Tree/BIT
2. **Choose the right tool:** sum only = BIT (simpler), min/max/complex = Segment Tree
3. **Start simple:** implement basic build + query + update first
4. **Add lazy only if needed:** range updates require lazy propagation
5. **Test with small arrays:** verify correctness before optimizing`,
      objectives: [
        "Solve LC #307 (Range Sum Query Mutable) using Segment Tree",
        "Understand 2D range query approach for LC #308",
        "Solve LC #315 (Count Smaller After Self) using BIT with coordinate compression",
      ],
      activities: [
        { description: "Solve LC #307 from scratch in under 15 minutes (timed practice)", durationMinutes: 15 },
        { description: "Solve LC #315 using BIT approach, then re-solve using Merge Sort approach", durationMinutes: 35 },
      ],
      reviewQuestions: [
        "Why use a BIT instead of a Segment Tree for LC #315?:::A BIT is simpler to implement and has a smaller constant factor. Since we only need prefix sum queries (count of elements with rank < current), a BIT is sufficient. A Segment Tree would also work but adds unnecessary complexity.",
        "How does coordinate compression help in LC #315?:::The values can range from -10^4 to 10^4, so a direct array would be large. Coordinate compression maps the values to ranks 1..k (where k is the number of unique values), reducing the BIT size to O(k).",
      ],
      successCriteria: "Can solve classic Segment Tree interview problems within time limits.",
      paretoJustification: "These three problems cover the most common Segment Tree/BIT patterns in interviews: 1D range query, 2D range query, and inversion counting.",
      resources: [
        { title: "LeetCode #315 — Count of Smaller Numbers After Self", type: "practice", url: "https://leetcode.com/problems/count-of-smaller-numbers-after-self/" },
        { title: "LeetCode #308 — Range Sum Query 2D Mutable", type: "practice", url: "https://leetcode.com/problems/range-sum-query-2d-mutable/" },
      ],
      codeExamples: {
        java: `import java.util.*;

// LC #315 — Count of Smaller Numbers After Self
class Solution {
    public List<Integer> countSmaller(int[] nums) {
        int[] sorted = nums.clone();
        Arrays.sort(sorted);
        Map<Integer, Integer> rank = new HashMap<>();
        int r = 1;
        for (int v : sorted)
            if (!rank.containsKey(v)) rank.put(v, r++);

        int[] bit = new int[r + 1];
        Integer[] result = new Integer[nums.length];

        for (int i = nums.length - 1; i >= 0; i--) {
            int rk = rank.get(nums[i]);
            result[i] = query(bit, rk - 1);
            update(bit, rk, r);
        }
        return Arrays.asList(result);
    }

    private void update(int[] bit, int i, int n) {
        for (; i < n; i += i & (-i)) bit[i]++;
    }

    private int query(int[] bit, int i) {
        int s = 0;
        for (; i > 0; i -= i & (-i)) s += bit[i];
        return s;
    }

    public static void main(String[] args) {
        Solution sol = new Solution();
        System.out.println(sol.countSmaller(new int[]{5, 2, 6, 1}));
        // [2, 1, 1, 0]
    }
}`,
        python: `# LC #315 — Count of Smaller Numbers After Self
class Solution:
    def countSmaller(self, nums):
        sorted_unique = sorted(set(nums))
        rank = {v: i+1 for i, v in enumerate(sorted_unique)}
        n = len(rank) + 1
        bit = [0] * (n + 1)

        def update(i):
            while i < n: bit[i] += 1; i += i & (-i)

        def query(i):
            s = 0
            while i > 0: s += bit[i]; i -= i & (-i)
            return s

        result = []
        for v in reversed(nums):
            result.append(query(rank[v] - 1))
            update(rank[v])
        return result[::-1]

sol = Solution()
print(sol.countSmaller([5, 2, 6, 1]))  # [2, 1, 1, 0]`
      },
    },
  ];

  // ── Quiz Bank (15 questions, difficulty 1-5, Bloom taxonomy) ───────────
  const quizBank = [
    {
      question: "What is the time complexity of building a Segment Tree from an array of n elements?",
      format: "MCQ",
      difficulty: 1,
      bloomLabel: "Remember",
      options: ["A) O(log n)", "B) O(n)", "C) O(n log n)", "D) O(n^2)"],
      correctAnswer: "B",
      explanation: "**Correct: B) O(n).** Each of the n leaves is visited once, and each internal node does O(1) merge work. Since there are at most 2n nodes total, the build is O(n).",
    },
    {
      question: "In a Segment Tree, what is the size of the backing array typically allocated for an array of n elements?",
      format: "MCQ",
      difficulty: 1,
      bloomLabel: "Remember",
      options: ["A) n", "B) 2n", "C) 4n", "D) n log n"],
      correctAnswer: "C",
      explanation: "**Correct: C) 4n.** When n is not a power of 2, the tree is not perfectly balanced. Allocating 4n guarantees sufficient space for all nodes regardless of n.",
    },
    {
      question: "Which of these problems CANNOT be efficiently solved with a basic Segment Tree (without modifications)?",
      format: "MCQ",
      difficulty: 2,
      bloomLabel: "Understand",
      options: [
        "A) Range sum query with point updates",
        "B) Range minimum query",
        "C) Finding the median of a range",
        "D) Range GCD query"
      ],
      correctAnswer: "C",
      explanation: "**Correct: C) Finding the median of a range.** A basic Segment Tree stores aggregate values (sum, min, max, GCD) that can be merged in O(1). Median requires knowing the sorted order of elements, which needs a Merge Sort Tree or persistent structure.",
    },
    {
      question: "During a range query on a Segment Tree, what happens when the node's range is entirely outside the query range?",
      format: "MCQ",
      difficulty: 2,
      bloomLabel: "Understand",
      options: [
        "A) Return the node's value",
        "B) Return the identity element (0 for sum, INF for min)",
        "C) Recurse into both children",
        "D) Return -1 to signal an error"
      ],
      correctAnswer: "B",
      explanation: "**Correct: B) Return the identity element.** When there is no overlap, we return the identity value that does not affect the merge operation: 0 for sum, Integer.MAX_VALUE for min, Integer.MIN_VALUE for max.",
    },
    {
      question: "What is the time complexity of a point update in a Segment Tree?",
      format: "MCQ",
      difficulty: 1,
      bloomLabel: "Remember",
      options: ["A) O(1)", "B) O(log n)", "C) O(n)", "D) O(sqrt(n))"],
      correctAnswer: "B",
      explanation: "**Correct: B) O(log n).** A point update traverses from root to the target leaf (height = O(log n)) and updates all ancestor nodes on the path back up.",
    },
    {
      question: "In lazy propagation, when must you push down lazy values to children?",
      format: "MCQ",
      difficulty: 3,
      bloomLabel: "Apply",
      options: [
        "A) Only during range updates",
        "B) Only during queries",
        "C) Before accessing any child node (during both queries and updates)",
        "D) After returning from recursive calls"
      ],
      correctAnswer: "C",
      explanation: "**Correct: C) Before accessing any child node.** Lazy values must be pushed down before we recurse into children, whether for a query or an update. This ensures children have correct values when we access them.",
    },
    {
      question: "What happens if you apply lazy propagation for range add and the lazy value at a node is 5 with the node covering indices [2, 7]?",
      format: "MCQ",
      difficulty: 3,
      bloomLabel: "Apply",
      options: [
        "A) tree[node] increases by 5",
        "B) tree[node] increases by 30",
        "C) tree[node] increases by 25",
        "D) tree[node] is set to 5"
      ],
      correctAnswer: "B",
      explanation: "**Correct: B) tree[node] increases by 30.** For range add, tree[node] += val * (end - start + 1). The range [2,7] has 6 elements, so tree[node] += 5 * 6 = 30.",
    },
    {
      question: "A Segment Tree is built on array [4, 2, 7, 1]. What value is stored at the root for a range sum tree?",
      format: "MCQ",
      difficulty: 2,
      bloomLabel: "Apply",
      options: ["A) 4", "B) 7", "C) 14", "D) 1"],
      correctAnswer: "C",
      explanation: "**Correct: C) 14.** The root stores the sum of the entire array: 4 + 2 + 7 + 1 = 14.",
    },
    {
      question: "For a range minimum Segment Tree, what identity value should be returned for the 'no overlap' case?",
      format: "MCQ",
      difficulty: 2,
      bloomLabel: "Understand",
      options: ["A) 0", "B) -1", "C) Integer.MAX_VALUE", "D) Integer.MIN_VALUE"],
      correctAnswer: "C",
      explanation: "**Correct: C) Integer.MAX_VALUE.** The identity for min is the largest possible value, so that min(identity, x) = x. Returning 0 or -1 would incorrectly affect the minimum calculation.",
    },
    {
      question: "What is the space complexity of a Merge Sort Tree built on an array of n elements?",
      format: "MCQ",
      difficulty: 4,
      bloomLabel: "Analyze",
      options: ["A) O(n)", "B) O(n log n)", "C) O(n^2)", "D) O(4n)"],
      correctAnswer: "B",
      explanation: "**Correct: B) O(n log n).** Each element appears in every level of the tree (O(log n) levels), and each level stores all n elements across its nodes. Total: n elements * log n levels = O(n log n).",
    },
    {
      question: "In LeetCode #315 (Count Smaller After Self), why do we process the array from right to left?",
      format: "MCQ",
      difficulty: 3,
      bloomLabel: "Analyze",
      options: [
        "A) To maintain sorted order in the BIT",
        "B) Because we need to count elements to the RIGHT that are smaller, so they must be inserted first",
        "C) To achieve O(n) instead of O(n log n)",
        "D) Because Segment Trees only work right to left"
      ],
      correctAnswer: "B",
      explanation: "**Correct: B) Because we need elements to the right already in the data structure.** By processing right to left, when we process nums[i], all elements nums[i+1..n-1] are already in the BIT. We query how many of them have a smaller rank.",
    },
    {
      question: "Which technique allows a Persistent Segment Tree to reuse unchanged subtrees across versions?",
      format: "MCQ",
      difficulty: 4,
      bloomLabel: "Analyze",
      options: [
        "A) Copy-on-write with deep cloning",
        "B) Structural sharing via pointer reuse",
        "C) Lazy propagation",
        "D) Array doubling"
      ],
      correctAnswer: "B",
      explanation: "**Correct: B) Structural sharing via pointer reuse.** When updating one element, only the path from root to leaf is recreated (O(log n) new nodes). All other subtrees are shared by pointing to the same nodes as the previous version.",
    },
    {
      question: "You need to support both range add updates and range minimum queries. Which approach works?",
      format: "MCQ",
      difficulty: 4,
      bloomLabel: "Evaluate",
      options: [
        "A) Fenwick Tree (BIT)",
        "B) Segment Tree with lazy propagation",
        "C) Prefix sum array with difference array",
        "D) Sparse Table"
      ],
      correctAnswer: "B",
      explanation: "**Correct: B) Segment Tree with lazy propagation.** Fenwick Trees don't natively support range min. Prefix sums and difference arrays don't handle min queries. Sparse Tables are static (no updates). Only a lazy Segment Tree handles both range updates and range min queries.",
    },
    {
      question: "What is the query time complexity of a Merge Sort Tree for counting elements less than k in range [l, r]?",
      format: "MCQ",
      difficulty: 5,
      bloomLabel: "Analyze",
      options: [
        "A) O(log n)",
        "B) O(log^2 n)",
        "C) O(n log n)",
        "D) O(sqrt(n) * log n)"
      ],
      correctAnswer: "B",
      explanation: "**Correct: B) O(log^2 n).** We visit O(log n) nodes of the Segment Tree, and at each node we perform a binary search on the sorted list (O(log n)). Total: O(log n) * O(log n) = O(log^2 n).",
    },
    {
      question: "Consider a Segment Tree for range sum on array [1, 2, 3, 4, 5, 6, 7, 8]. After update(2, 10), what does query(0, 3) return?",
      format: "MCQ",
      difficulty: 5,
      bloomLabel: "Evaluate",
      options: ["A) 10", "B) 17", "C) 20", "D) 15"],
      correctAnswer: "B",
      explanation: "**Correct: B) 17.** Original sum of [0,3] = 1+2+3+4 = 10. After update(2, 10), arr[2] changes from 3 to 10 (delta = +7). New sum = 10 + 7 = 17. That is, 1 + 2 + 10 + 4 = 17.",
    },
  ];

  // ── Cheat Sheet ────────────────────────────────────────────────────────
  const cheatSheet = `# Segment Trees Cheat Sheet

## 1. Core Structure
- **Array-backed binary tree:** node i has children 2i and 2i+1 (1-indexed)
- **Leaves:** original array elements
- **Internal nodes:** merged aggregate of children
- **Size:** allocate 4n for array of size n

## 2. Operations & Complexity

| Operation | Time | Space |
|-----------|------|-------|
| Build | O(n) | O(n) |
| Point query | O(log n) | O(1) |
| Range query | O(log n) | O(1) |
| Point update | O(log n) | O(1) |
| Range update (lazy) | O(log n) | O(n) |

## 3. Build + Query Template -- Java
\`\`\`java
class SegTree {
    int[] tree; int n;
    SegTree(int[] a) { n=a.length; tree=new int[4*n]; build(a,1,0,n-1); }
    void build(int[] a, int nd, int s, int e) {
        if (s==e) { tree[nd]=a[s]; return; }
        int m=(s+e)/2;
        build(a,2*nd,s,m); build(a,2*nd+1,m+1,e);
        tree[nd]=tree[2*nd]+tree[2*nd+1];
    }
    int query(int l, int r) { return qry(1,0,n-1,l,r); }
    int qry(int nd, int s, int e, int l, int r) {
        if (r<s||e<l) return 0;
        if (l<=s&&e<=r) return tree[nd];
        int m=(s+e)/2;
        return qry(2*nd,s,m,l,r)+qry(2*nd+1,m+1,e,l,r);
    }
    void update(int idx, int val) { upd(1,0,n-1,idx,val); }
    void upd(int nd, int s, int e, int i, int v) {
        if (s==e) { tree[nd]=v; return; }
        int m=(s+e)/2;
        if (i<=m) upd(2*nd,s,m,i,v); else upd(2*nd+1,m+1,e,i,v);
        tree[nd]=tree[2*nd]+tree[2*nd+1];
    }
}
\`\`\`

## 4. Build + Query Template -- Python
\`\`\`python
class SegTree:
    def __init__(self, a):
        self.n = len(a); self.t = [0]*(4*self.n)
        self._build(a, 1, 0, self.n-1)
    def _build(self, a, nd, s, e):
        if s == e: self.t[nd] = a[s]; return
        m = (s+e)//2
        self._build(a, 2*nd, s, m); self._build(a, 2*nd+1, m+1, e)
        self.t[nd] = self.t[2*nd] + self.t[2*nd+1]
    def query(self, l, r): return self._qry(1, 0, self.n-1, l, r)
    def _qry(self, nd, s, e, l, r):
        if r < s or e < l: return 0
        if l <= s and e <= r: return self.t[nd]
        m = (s+e)//2
        return self._qry(2*nd, s, m, l, r) + self._qry(2*nd+1, m+1, e, l, r)
    def update(self, i, v): self._upd(1, 0, self.n-1, i, v)
    def _upd(self, nd, s, e, i, v):
        if s == e: self.t[nd] = v; return
        m = (s+e)//2
        if i <= m: self._upd(2*nd, s, m, i, v)
        else: self._upd(2*nd+1, m+1, e, i, v)
        self.t[nd] = self.t[2*nd] + self.t[2*nd+1]
\`\`\`

## 5. Three Query Cases
1. **No overlap** (r < start or end < l): return identity
2. **Total overlap** (l <= start and end <= r): return node value
3. **Partial overlap**: recurse both children, merge

## 6. Lazy Propagation Pattern
- Store pending updates in \`lazy[]\` array
- **Push down** before accessing children
- **Apply:** tree[node] += val * (end - start + 1), lazy[node] += val

## 7. Identity Values by Operation
| Operation | Identity | Merge |
|-----------|----------|-------|
| Sum | 0 | a + b |
| Min | +INF | min(a, b) |
| Max | -INF | max(a, b) |
| GCD | 0 | gcd(a, b) |
| XOR | 0 | a ^ b |

## 8. Key LeetCode Problems
- #307 Range Sum Query Mutable (Medium) -- basic seg tree
- #308 Range Sum Query 2D Mutable (Hard) -- 2D BIT/seg tree
- #315 Count of Smaller Numbers After Self (Hard) -- BIT + coord compression
- #327 Count of Range Sum (Hard) -- merge sort / seg tree
- #493 Reverse Pairs (Hard) -- merge sort / BIT

## 9. Decision Tree
- Range query + no updates -> Prefix sum / Sparse Table
- Range sum + point updates -> BIT (simpler) or Seg Tree
- Range min/max + point updates -> Seg Tree
- Range updates needed -> Seg Tree + Lazy Propagation
- Count in range with condition -> Merge Sort Tree

## 10. Gotchas
- Array size must be 4n, not 2n
- Use 1-indexed (children: 2i, 2i+1; parent: i/2)
- Push down lazy BEFORE accessing children
- Identity value must not affect the merge operation
- Range set needs a flag to distinguish "no update" from "set to 0"`;

  // ── Ladder (5 Dreyfus levels) ──────────────────────────────────────────
  const ladder = {
    levels: [
      {
        level: 1,
        name: "Novice",
        dreyfusLabel: "Novice",
        description: "Can explain what a Segment Tree is and draw one by hand",
        observableSkills: [
          "Draw a Segment Tree for a given array",
          "Explain the three query cases",
        ],
        milestoneProject: {
          title: "Draw and Trace Segment Tree",
          description: "Build a Segment Tree for [3,1,4,1,5] by hand and trace query(1,3)",
          estimatedHours: 1,
        },
        commonPlateaus: ["Confusing segment tree with binary search tree"],
        estimatedHours: 3,
        prerequisites: ["Arrays", "Recursion"],
      },
      {
        level: 2,
        name: "Advanced Beginner",
        dreyfusLabel: "Advanced Beginner",
        description: "Can implement build, query, and point update",
        observableSkills: [
          "Implement range sum query",
          "Implement point update with correct ancestor propagation",
        ],
        milestoneProject: {
          title: "Solve LC #307",
          description: "Implement Range Sum Query Mutable from scratch",
          estimatedHours: 3,
        },
        commonPlateaus: [
          "Off-by-one errors in range boundaries",
          "Forgetting to re-merge ancestors after update",
        ],
        estimatedHours: 6,
        prerequisites: ["Binary trees", "Divide and conquer"],
      },
      {
        level: 3,
        name: "Competent",
        dreyfusLabel: "Competent",
        description: "Can implement lazy propagation for range updates",
        observableSkills: [
          "Implement lazy propagation for range add",
          "Debug push-down ordering issues",
        ],
        milestoneProject: {
          title: "Range Add + Range Query",
          description: "Build a lazy segment tree and solve range update problems",
          estimatedHours: 5,
        },
        commonPlateaus: [
          "Forgetting to push down before recursing",
          "Incorrect apply function for the operation type",
        ],
        estimatedHours: 10,
        prerequisites: ["Basic segment tree (build + query + update)"],
      },
      {
        level: 4,
        name: "Proficient",
        dreyfusLabel: "Proficient",
        description: "Can solve complex interview problems using segment trees and BITs",
        observableSkills: [
          "Choose between BIT and Segment Tree appropriately",
          "Apply coordinate compression",
          "Solve LC #315 and #308",
        ],
        milestoneProject: {
          title: "Solve 5 Hard Segment Tree Problems",
          description: "LC #315, #308, #327, #493, and one contest problem",
          estimatedHours: 10,
        },
        commonPlateaus: [
          "Not recognizing when BIT suffices vs needing full segment tree",
        ],
        estimatedHours: 20,
        prerequisites: ["Lazy propagation", "Binary Indexed Tree basics"],
      },
      {
        level: 5,
        name: "Expert",
        dreyfusLabel: "Expert",
        description: "Can implement persistent and merge sort trees, design custom segment tree variants",
        observableSkills: [
          "Implement Merge Sort Tree",
          "Explain persistent segment tree with structural sharing",
          "Design segment tree for custom merge operations",
        ],
        milestoneProject: {
          title: "Build a Persistent Segment Tree",
          description: "Implement persistent segment tree with version queries",
          estimatedHours: 8,
        },
        commonPlateaus: [
          "Memory management in persistent trees",
          "Correctly composing lazy operations for complex merge functions",
        ],
        estimatedHours: 30,
        prerequisites: ["Proficient segment tree skills", "Merge sort"],
      },
    ],
  };

  // ── Resources ──────────────────────────────────────────────────────────
  const resources = [
    {
      title: "CP-Algorithms — Segment Tree",
      author: "CP-Algorithms",
      category: "docs",
      justification: "The most comprehensive free reference for segment trees with code",
      bestFor: "Reference and deep understanding",
      estimatedTime: "3 hours",
      cost: "Free",
      confidence: "HIGH",
      url: "https://cp-algorithms.com/data_structures/segment_tree.html",
    },
    {
      title: "Segment Tree Beats",
      author: "Codeforces",
      category: "blogs",
      justification: "Advanced lazy propagation techniques for complex operations",
      bestFor: "Competitive programmers",
      estimatedTime: "2 hours",
      cost: "Free",
      confidence: "HIGH",
      url: "https://codeforces.com/blog/entry/57319",
    },
    {
      title: "Algorithms Live — Segment Trees",
      author: "Algorithms Live",
      category: "youtube",
      justification: "Visual explanation of segment tree concepts and implementations",
      bestFor: "Visual learners",
      estimatedTime: "1.5 hours",
      cost: "Free",
      confidence: "HIGH",
    },
    {
      title: "Competitive Programming 3",
      author: "Steven Halim",
      category: "books",
      justification: "Covers segment trees in the context of competitive programming with many examples",
      bestFor: "Practice-oriented learners",
      estimatedTime: "3 hours",
      cost: "Paid",
      confidence: "HIGH",
    },
    {
      title: "Visualgo — Segment Tree",
      author: "Visualgo",
      category: "interactive",
      justification: "Interactive visualization of segment tree operations",
      bestFor: "Beginners who need visual understanding",
      estimatedTime: "30 minutes",
      cost: "Free",
      confidence: "HIGH",
      url: "https://visualgo.net/en/segmenttree",
    },
  ];

  return {
    topic: "Segment Trees",
    category: "Data Structures",
    plan: {
      overview: "Master Segment Trees from basic structure through lazy propagation to advanced variants. Covers range queries, point and range updates, and classic interview problems (LC #307, #308, #315).",
      skippedTopics: "Segment Tree Beats, Li Chao Tree, Kinetic Segment Tree (too specialized for interviews)",
      sessions,
    },
    quizBank,
    cheatSheet,
    ladder,
    resources,
  };
}

// ── Main ─────────────────────────────────────────────────────────────────

function main() {
  const topics = [buildSegmentTreesTopic()];
  const outputPath = path.join(__dirname, "..", "public", "content", "segment-trees.json");

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
      if (!s.codeExamples || !s.codeExamples.java || !s.codeExamples.python) {
        console.error(`ERROR: Missing codeExamples in session ${s.sessionNumber} of "${topic.topic}"`);
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
