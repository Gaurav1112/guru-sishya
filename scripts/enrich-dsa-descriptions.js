#!/usr/bin/env node
/**
 * Add descriptive explanations to DSA sessions that are mostly code.
 * Prepends concept explanations, complexity analysis, and interview tips
 * BEFORE the existing code blocks.
 */
const fs = require('fs');
const path = require('path');
const CONTENT_DIR = path.join(__dirname, '..', 'public', 'content');

// Descriptive templates by topic keyword
const DESCRIPTIONS = {
  'array': `### What Are Arrays?\n\nAn array is a contiguous block of memory storing elements of the same type. Each element is accessed by its index in O(1) time. Arrays are the most fundamental data structure — almost every interview starts here.\n\n**Why arrays matter in interviews:**\n- They test your ability to manipulate indices and pointers\n- Many problems reduce to array manipulation\n- Understanding memory layout helps with optimization\n\n**Key patterns:**\n- Two pointers (opposite ends, same direction)\n- Sliding window (variable or fixed size)\n- Prefix sums for range queries\n- In-place modification to avoid extra space\n\n**Complexity cheat sheet:**\n| Operation | Time | Space |\n|-----------|------|-------|\n| Access by index | O(1) | O(1) |\n| Search (unsorted) | O(n) | O(1) |\n| Search (sorted) | O(log n) | O(1) |\n| Insert/Delete (end) | O(1) amortized | O(1) |\n| Insert/Delete (middle) | O(n) | O(1) |\n\n`,

  'linked list': `### Understanding Linked Lists\n\nA linked list is a sequence of nodes where each node contains data and a pointer to the next node. Unlike arrays, linked lists don't need contiguous memory — each node can be anywhere in the heap.\n\n**Why linked lists appear in interviews:**\n- They test pointer manipulation skills\n- Many problems require in-place modification\n- They're the foundation for more complex structures (trees, graphs)\n\n**Key techniques:**\n- **Dummy head node**: simplifies edge cases (empty list, single node)\n- **Two pointers (fast/slow)**: detect cycles, find middle, find nth from end\n- **Reversal**: iterative (3 pointers) or recursive\n- **Merge**: combine two sorted lists\n\n**Common mistakes:**\n- Forgetting to handle null/empty list\n- Losing reference to the head after modification\n- Not handling single-node lists\n- Infinite loops when cycle exists\n\n`,

  'stack': `### Understanding Stacks\n\nA stack is a LIFO (Last In, First Out) data structure. Think of a stack of plates — you can only add or remove from the top. Stacks are used for tracking state, backtracking, and expression evaluation.\n\n**Why stacks are interview favorites:**\n- They model function call stacks (recursion)\n- They solve parentheses matching, expression evaluation\n- Monotonic stacks solve "next greater/smaller" problems efficiently\n\n**Key patterns:**\n- **Matching pairs**: parentheses, brackets, HTML tags\n- **Monotonic stack**: maintain increasing/decreasing order to find next greater/smaller element in O(n)\n- **Expression evaluation**: convert infix to postfix, evaluate postfix\n- **Backtracking**: undo operations (browser history, undo/redo)\n\n**When to use a stack:**\n- "Find the nearest/next greater/smaller element" → Monotonic stack\n- "Check if balanced/valid" → Regular stack\n- "Evaluate expression" → Two stacks (operators + operands)\n\n`,

  'queue': `### Understanding Queues\n\nA queue is a FIFO (First In, First Out) data structure. Think of a line at a store — first person in line gets served first. Queues are essential for BFS, scheduling, and buffering.\n\n**Key variants:**\n- **Regular queue**: FIFO, used in BFS\n- **Deque (double-ended)**: add/remove from both ends, used in sliding window\n- **Priority queue (heap)**: elements dequeued by priority, used in Dijkstra's\n\n**BFS with queues:**\nBFS explores nodes level by level. It guarantees the shortest path in unweighted graphs. The pattern:\n1. Add start node to queue\n2. While queue is not empty: dequeue, process, enqueue neighbors\n3. Use a visited set to avoid revisiting\n\n`,

  'tree': `### Understanding Trees\n\nA tree is a hierarchical data structure with a root node and children. Binary trees (max 2 children) are the most common in interviews. BSTs maintain the property: left < root < right.\n\n**Why trees dominate interviews:**\n- They test recursive thinking\n- Many real systems use trees (file systems, databases, DOM)\n- Problems range from easy (traversal) to hard (balancing, serialization)\n\n**Key traversals:**\n- **Inorder** (left, root, right): gives sorted order for BST\n- **Preorder** (root, left, right): useful for serialization\n- **Postorder** (left, right, root): useful for deletion, bottom-up calculation\n- **Level-order** (BFS): uses a queue, processes level by level\n\n**Key patterns:**\n- **Recursive DFS**: most tree problems are solved recursively\n- **Height/depth calculation**: max(left, right) + 1\n- **LCA (Lowest Common Ancestor)**: fundamental for path problems\n- **BST validation**: check if inorder traversal is sorted\n\n`,

  'graph': `### Understanding Graphs\n\nA graph is a collection of nodes (vertices) connected by edges. Graphs model relationships: social networks, maps, dependencies, web links. They're the most versatile data structure.\n\n**Representations:**\n- **Adjacency list**: Map<node, List<neighbor>> — best for sparse graphs, O(V+E) space\n- **Adjacency matrix**: boolean[V][V] — best for dense graphs, O(V²) space\n\n**Key algorithms:**\n- **BFS**: shortest path (unweighted), level-order exploration — uses queue\n- **DFS**: cycle detection, topological sort, connected components — uses stack/recursion\n- **Dijkstra's**: shortest path (weighted, non-negative) — uses priority queue\n- **Topological sort**: ordering with dependencies — DFS or Kahn's (BFS with indegree)\n- **Union-Find**: connected components, cycle detection — uses disjoint set\n\n**Interview tips:**\n- Always clarify: directed vs undirected? weighted? cycles? connected?\n- Start with the simplest approach (BFS/DFS), then optimize\n- Watch for disconnected graphs — iterate over all nodes\n\n`,

  'hash': `### Understanding Hash Tables\n\nA hash table maps keys to values using a hash function. It provides average O(1) lookups, insertions, and deletions — making it the go-to data structure for optimization.\n\n**How it works:**\n1. Hash function converts key → integer index\n2. Store value at that index in an array (bucket)\n3. Handle collisions: chaining (linked list per bucket) or open addressing (probe for next empty)\n\n**Why hash tables are everywhere in interviews:**\n- They convert O(n) search to O(1) lookup\n- "Have we seen this before?" → HashSet\n- "How many times?" → HashMap with count\n- "Find complement" → Store what you need, check if exists\n\n**Key patterns:**\n- **Frequency counting**: count occurrences of each element\n- **Two Sum pattern**: store complement → index mapping\n- **Group by key**: anagrams (sorted string as key), isomorphic strings\n- **Sliding window + hash**: substring problems\n\n`,

  'heap': `### Understanding Heaps & Priority Queues\n\nA heap is a complete binary tree satisfying the heap property: parent ≤ children (min-heap) or parent ≥ children (max-heap). It's stored as an array for efficiency.\n\n**Why heaps matter:**\n- They solve "top K" problems efficiently\n- They power Dijkstra's shortest path algorithm\n- They enable efficient stream processing (running median)\n\n**Key operations:**\n| Operation | Time |\n|-----------|------|\n| Insert | O(log n) |\n| Extract min/max | O(log n) |\n| Peek | O(1) |\n| Build heap | O(n) |\n\n**Key patterns:**\n- **Top K elements**: maintain a heap of size K, poll when exceeds\n- **Kth largest**: min-heap of size K — root is the Kth largest\n- **Merge K sorted**: min-heap with (value, listIndex, elementIndex)\n- **Running median**: two heaps — max-heap for lower half, min-heap for upper\n\n**Java vs Python:**\n- Java: PriorityQueue (min-heap by default, pass Comparator for max)\n- Python: heapq (min-heap only — negate values for max-heap)\n\n`,

  'sort': `### Understanding Sorting Algorithms\n\nSorting is arranging elements in a specific order. It's a fundamental operation that many other algorithms depend on (binary search, merge intervals, etc.).\n\n**Key algorithms:**\n| Algorithm | Time (avg) | Time (worst) | Space | Stable? |\n|-----------|-----------|-------------|-------|--------|\n| Merge Sort | O(n log n) | O(n log n) | O(n) | Yes |\n| Quick Sort | O(n log n) | O(n²) | O(log n) | No |\n| Heap Sort | O(n log n) | O(n log n) | O(1) | No |\n| Counting Sort | O(n+k) | O(n+k) | O(k) | Yes |\n\n**Interview insights:**\n- Most languages use Timsort (hybrid merge+insertion) — O(n log n)\n- "Sort then solve" is a valid strategy for many problems\n- Custom comparators are essential for complex sorting\n- Stability matters when secondary sort order must be preserved\n\n`,

  'binary search': `### Understanding Binary Search\n\nBinary search halves the search space in each step, achieving O(log n) time. It works on sorted data and is one of the most powerful techniques in interviews.\n\n**The template:**\n1. Define search space: left = 0, right = n-1\n2. While left <= right: compute mid = left + (right - left) / 2\n3. If target found at mid: return\n4. If target < arr[mid]: search left half (right = mid - 1)\n5. If target > arr[mid]: search right half (left = mid + 1)\n\n**Variations:**\n- **Find leftmost occurrence**: when found, keep searching left (right = mid - 1)\n- **Find rightmost occurrence**: when found, keep searching right (left = mid + 1)\n- **Search in rotated array**: determine which half is sorted, then decide direction\n- **Search on answer**: binary search on the result space (e.g., "minimum capacity to ship")\n\n**Common mistakes:**\n- Integer overflow: use mid = left + (right - left) / 2 instead of (left + right) / 2\n- Off-by-one errors in left/right boundaries\n- Infinite loops when not narrowing the search space\n\n`,

  'dynamic programming': `### Understanding Dynamic Programming\n\nDP solves problems by breaking them into overlapping subproblems. If a problem has optimal substructure (optimal solution uses optimal solutions to subproblems) and overlapping subproblems (same subproblem solved multiple times), use DP.\n\n**Two approaches:**\n- **Top-down (memoization)**: recursive with cache — easier to write, natural for tree-shaped subproblems\n- **Bottom-up (tabulation)**: iterative with table — often faster, easier to optimize space\n\n**The 5-step framework:**\n1. **Define state**: what information do you need to solve the subproblem?\n2. **Define recurrence**: how does the current state relate to smaller states?\n3. **Base cases**: what are the smallest subproblems with known answers?\n4. **Compute order**: bottom-up — solve smaller problems first\n5. **Extract answer**: where in the table is the final answer?\n\n**Common patterns:**\n- **1D DP**: Fibonacci, climbing stairs, house robber\n- **2D DP**: grid paths, longest common subsequence, edit distance\n- **Knapsack**: subset sum, coin change, partition equal subset\n- **Interval DP**: matrix chain multiplication, burst balloons\n\n**Interview tip:** Start with brute force recursion, add memoization, then convert to bottom-up if needed.\n\n`,

  'recursion': `### Understanding Recursion & Backtracking\n\nRecursion is a function calling itself with a smaller input. Every recursive solution has: a base case (when to stop) and a recursive case (how to reduce the problem).\n\n**Backtracking** is recursion with pruning — try a choice, if it doesn't work, undo it and try the next.\n\n**The recursion template:**\n1. **Base case**: return when input is small enough to solve directly\n2. **Recursive case**: break into smaller subproblems, combine results\n3. **Trust the recursion**: assume the recursive call works correctly\n\n**Backtracking template:**\n1. **Choose**: make a decision (add element, take path)\n2. **Explore**: recurse with the remaining choices\n3. **Unchoose**: undo the decision (backtrack)\n\n**Common problems:**\n- **Permutations**: try each unused element at current position\n- **Combinations**: include or exclude each element\n- **N-Queens**: place queens row by row, check column/diagonal conflicts\n- **Sudoku**: try digits 1-9 in each empty cell, backtrack on conflict\n\n**Time complexity of backtracking:**\n- Permutations: O(n! × n)\n- Combinations: O(2^n × n)\n- N-Queens: O(n!)\n\n`,

  'two pointer': `### Understanding Two Pointers\n\nThe two-pointer technique uses two indices to traverse a data structure, reducing time complexity from O(n²) to O(n). It works best on sorted arrays or linked lists.\n\n**Variants:**\n- **Opposite ends**: left starts at 0, right at end — move inward (Two Sum, Container With Most Water)\n- **Same direction**: slow/fast pointers — detect cycles, find middle (Floyd's algorithm)\n- **Sliding window**: left/right expand and contract — substring/subarray problems\n\n**When to use two pointers:**\n- "Find a pair that sums to X" → Opposite ends on sorted array\n- "Remove duplicates in-place" → Slow (write) and fast (read) pointers\n- "Is palindrome?" → Compare from both ends\n- "Merge two sorted arrays" → One pointer per array\n\n`,

  'sliding window': `### Understanding Sliding Window\n\nThe sliding window technique maintains a window (subarray/substring) that expands and contracts as you iterate. It converts O(n²) brute force to O(n).\n\n**Two types:**\n- **Fixed size**: window size is given (e.g., max sum of k consecutive elements)\n- **Variable size**: window size varies based on condition (e.g., smallest subarray with sum ≥ target)\n\n**The template:**\n1. Initialize left = 0, maintain a running state (sum, count, map)\n2. Expand right pointer one step at a time\n3. While window is invalid: shrink from left, update state\n4. Update answer at each valid state\n\n**Key problems:**\n- Longest substring without repeating characters (variable window + HashSet)\n- Minimum window substring (variable window + frequency map)\n- Maximum average subarray of size K (fixed window)\n- Fruit into baskets (variable window with at most 2 distinct)\n\n`,

  'greedy': `### Understanding Greedy Algorithms\n\nA greedy algorithm makes the locally optimal choice at each step, hoping to reach a globally optimal solution. It works when the problem has the greedy choice property — local optimum leads to global optimum.\n\n**When greedy works:**\n- Interval scheduling (sort by end time, pick non-overlapping)\n- Huffman coding (always merge two smallest frequencies)\n- Fractional knapsack (sort by value/weight ratio)\n- Jump game (track farthest reachable position)\n\n**When greedy DOESN'T work:**\n- 0/1 Knapsack (need DP)\n- Shortest path with negative weights (need Bellman-Ford)\n- Most combinatorial optimization problems\n\n**How to verify greedy works:**\n1. Prove the greedy choice is part of some optimal solution\n2. Show that after the greedy choice, the remaining problem is a smaller instance\n3. Or: try counterexamples — if you can't find one, greedy likely works\n\n`,
};

function findDescription(title) {
  const t = title.toLowerCase();
  for (const [keyword, desc] of Object.entries(DESCRIPTIONS)) {
    if (t.includes(keyword)) return desc;
  }
  return null;
}

// Process DSA files
const files = ['ds-algo.json', 'dsa-patterns.json'];
let totalFixed = 0;

for (const f of files) {
  const filePath = path.join(CONTENT_DIR, f);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const topics = Array.isArray(data) ? data : [data];
  let fileFixed = 0;

  topics.forEach(t => {
    if (!t.plan?.sessions) return;
    t.plan.sessions.forEach(s => {
      const c = s.content || '';
      const codeBlocks = (c.match(/```[\s\S]*?```/g) || []);
      const codeChars = codeBlocks.reduce((sum, b) => sum + b.length, 0);
      const textChars = c.length - codeChars;

      // Only enrich if code-heavy (>55% code or < 900 chars text)
      if (codeChars / Math.max(c.length, 1) > 0.55 || textChars < 900) {
        const desc = findDescription(s.title || '') || findDescription(t.topic || '');
        if (desc && !c.includes('### What Are') && !c.includes('### Understanding')) {
          // Prepend description before existing content
          s.content = desc + c;
          fileFixed++;
        }
      }
    });
  });

  if (fileFixed > 0) {
    fs.writeFileSync(filePath, JSON.stringify(Array.isArray(data) ? topics : topics[0]));
    console.log(f + ': enriched ' + fileFixed + ' sessions with descriptions');
    totalFixed += fileFixed;
  }
}

console.log('\nTotal: enriched ' + totalFixed + ' sessions');
