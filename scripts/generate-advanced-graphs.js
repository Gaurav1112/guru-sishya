#!/usr/bin/env node
/**
 * Generate Advanced Graph Algorithms topic content.
 * Outputs: public/content/advanced-graphs.json
 * Target: <100KB
 */

const fs = require('fs');
const path = require('path');

const topic = {
  topic: "Advanced Graph Algorithms",
  category: "Algorithms",
  cheatSheet: `# Advanced Graph Algorithms Cheat Sheet

## 1. Dijkstra's Algorithm (Single-Source Shortest Path)
- **Use when:** Non-negative edge weights
- **Data structure:** Min-heap / priority queue
- **Time:** O((V + E) log V) with binary heap
- **Space:** O(V)

**Java:**
\`\`\`java
int[] dijkstra(int[][] graph, int src, int n) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
    pq.offer(new int[]{src, 0});
    while (!pq.isEmpty()) {
        int[] cur = pq.poll();
        int u = cur[0], d = cur[1];
        if (d > dist[u]) continue;
        for (int[] edge : graph[u]) {
            int v = edge[0], w = edge[1];
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.offer(new int[]{v, dist[v]});
            }
        }
    }
    return dist;
}
\`\`\`

**Python:**
\`\`\`python
import heapq
def dijkstra(graph, src, n):
    dist = [float('inf')] * n
    dist[src] = 0
    pq = [(0, src)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]: continue
        for v, w in graph[u]:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                heapq.heappush(pq, (dist[v], v))
    return dist
\`\`\`

## 2. Bellman-Ford (Handles Negative Weights)
- **Use when:** Negative edge weights present
- **Time:** O(V * E)
- **Detects:** Negative-weight cycles (V-th relaxation finds improvement)

**Java:**
\`\`\`java
int[] bellmanFord(int[][] edges, int src, int n) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;
    for (int i = 0; i < n - 1; i++)
        for (int[] e : edges)
            if (dist[e[0]] != Integer.MAX_VALUE && dist[e[0]] + e[2] < dist[e[1]])
                dist[e[1]] = dist[e[0]] + e[2];
    // Check negative cycle
    for (int[] e : edges)
        if (dist[e[0]] != Integer.MAX_VALUE && dist[e[0]] + e[2] < dist[e[1]])
            return null; // negative cycle
    return dist;
}
\`\`\`

**Python:**
\`\`\`python
def bellman_ford(edges, src, n):
    dist = [float('inf')] * n
    dist[src] = 0
    for _ in range(n - 1):
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
    for u, v, w in edges:
        if dist[u] + w < dist[v]:
            return None  # negative cycle
    return dist
\`\`\`

## 3. Floyd-Warshall (All-Pairs Shortest Path)
- **Time:** O(V^3) | **Space:** O(V^2)
- **Use when:** Dense graph, need all-pairs distances

**Java:**
\`\`\`java
int[][] floydWarshall(int[][] dist, int n) {
    for (int k = 0; k < n; k++)
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                if (dist[i][k] != INF && dist[k][j] != INF)
                    dist[i][j] = Math.min(dist[i][j], dist[i][k] + dist[k][j]);
    return dist;
}
\`\`\`

## 4. Minimum Spanning Tree

### Kruskal's (Union-Find)
- Sort edges by weight, add if no cycle: O(E log E)

### Prim's (Priority Queue)
- Grow tree from source using min-heap: O((V + E) log V)

## 5. Network Flow (Ford-Fulkerson)
- **Max-Flow = Min-Cut** (Max-Flow Min-Cut Theorem)
- **Edmonds-Karp:** BFS-based Ford-Fulkerson, O(V * E^2)

## 6. Quick Decision Guide

| Problem | Algorithm | Time |
|---------|-----------|------|
| Shortest path, non-negative | Dijkstra | O((V+E) log V) |
| Shortest path, negative weights | Bellman-Ford | O(VE) |
| All-pairs shortest path | Floyd-Warshall | O(V^3) |
| MST (sparse graph) | Kruskal | O(E log E) |
| MST (dense graph) | Prim | O((V+E) log V) |
| Max flow | Edmonds-Karp | O(VE^2) |

## 7. Common Interview Patterns
- **Dijkstra + state:** LC #787 (K stops), LC #1631 (min effort path)
- **Union-Find + sort:** LC #1584 (min cost connect points)
- **Bellman-Ford + K relaxations:** LC #787 (cheapest flights)
- **Floyd-Warshall + threshold:** LC #1334 (city threshold distance)`,

  resources: [
    {
      title: "LeetCode #743 - Network Delay Time",
      author: "LeetCode",
      category: "practice",
      justification: "Classic Dijkstra application, frequently asked in interviews",
      bestFor: "Practicing single-source shortest path",
      estimatedTime: "30 min",
      cost: "free",
      confidence: 0.95
    },
    {
      title: "LeetCode #787 - Cheapest Flights Within K Stops",
      author: "LeetCode",
      category: "practice",
      justification: "Bellman-Ford with K relaxations, tests depth of understanding",
      bestFor: "Mastering modified Bellman-Ford",
      estimatedTime: "40 min",
      cost: "free",
      confidence: 0.95
    },
    {
      title: "LeetCode #1584 - Min Cost to Connect All Points",
      author: "LeetCode",
      category: "practice",
      justification: "Direct MST application with Kruskal's or Prim's",
      bestFor: "MST implementation practice",
      estimatedTime: "35 min",
      cost: "free",
      confidence: 0.95
    },
    {
      title: "LeetCode #1334 - Find the City With the Smallest Number of Neighbors",
      author: "LeetCode",
      category: "practice",
      justification: "Floyd-Warshall or Dijkstra from each node",
      bestFor: "All-pairs shortest path practice",
      estimatedTime: "35 min",
      cost: "free",
      confidence: 0.9
    },
    {
      title: "CLRS Chapter 24-26 (Shortest Paths & Network Flow)",
      author: "Cormen, Leiserson, Rivest, Stein",
      category: "book",
      justification: "Gold standard reference for graph algorithms with proofs",
      bestFor: "Deep theoretical understanding",
      estimatedTime: "8 hours",
      cost: "paid",
      confidence: 0.95
    },
    {
      title: "William Fiset - Graph Theory Playlist",
      author: "William Fiset",
      category: "video",
      justification: "Best visual explanations of graph algorithms on YouTube",
      bestFor: "Visual learners who want animations",
      estimatedTime: "4 hours",
      cost: "free",
      confidence: 0.9
    }
  ],

  ladder: {
    levels: [
      {
        level: 1,
        name: "Novice",
        dreyfusLabel: "Novice",
        description: "Can explain what shortest path means and identify when to use graph algorithms",
        observableSkills: [
          "Explain difference between weighted and unweighted shortest path",
          "Identify when a problem requires Dijkstra vs BFS"
        ],
        milestoneProject: {
          title: "Implement Dijkstra's Algorithm",
          description: "Build Dijkstra from scratch using a priority queue on a sample graph",
          estimatedHours: 2
        },
        commonPlateaus: [
          "Confusing Dijkstra with BFS",
          "Forgetting to skip stale entries in priority queue"
        ]
      },
      {
        level: 2,
        name: "Beginner",
        dreyfusLabel: "Advanced Beginner",
        description: "Can implement Dijkstra and Bellman-Ford and choose correctly between them",
        observableSkills: [
          "Implement Bellman-Ford with negative cycle detection",
          "Solve LC #743 Network Delay Time"
        ],
        milestoneProject: {
          title: "Network Delay Time Solver",
          description: "Solve LC #743 using both Dijkstra and Bellman-Ford, compare performance",
          estimatedHours: 3
        },
        commonPlateaus: [
          "Not handling disconnected components",
          "Integer overflow when adding to MAX_VALUE"
        ]
      },
      {
        level: 3,
        name: "Intermediate",
        dreyfusLabel: "Competent",
        description: "Can implement MST algorithms and Floyd-Warshall, handle edge cases",
        observableSkills: [
          "Implement Kruskal's with Union-Find",
          "Implement Prim's with priority queue",
          "Apply Floyd-Warshall to all-pairs problems"
        ],
        milestoneProject: {
          title: "Min Cost Connect All Points",
          description: "Solve LC #1584 using both Kruskal's and Prim's, analyze tradeoffs",
          estimatedHours: 3
        },
        commonPlateaus: [
          "Forgetting path compression in Union-Find",
          "Off-by-one in Floyd-Warshall initialization"
        ]
      },
      {
        level: 4,
        name: "Advanced",
        dreyfusLabel: "Proficient",
        description: "Can solve modified shortest path problems and understand network flow basics",
        observableSkills: [
          "Solve Dijkstra with extra state dimensions",
          "Apply Bellman-Ford with K relaxation limit",
          "Explain max-flow min-cut theorem"
        ],
        milestoneProject: {
          title: "Cheapest Flights Within K Stops",
          description: "Solve LC #787 using modified Bellman-Ford and Dijkstra with state, compare approaches",
          estimatedHours: 4
        },
        commonPlateaus: [
          "Struggling with state-space expansion in Dijkstra",
          "Not understanding residual graph in flow"
        ]
      },
      {
        level: 5,
        name: "Expert",
        dreyfusLabel: "Expert",
        description: "Can identify and apply the right advanced graph algorithm in novel interview scenarios",
        observableSkills: [
          "Implement Ford-Fulkerson with BFS (Edmonds-Karp)",
          "Reduce unfamiliar problems to known graph algorithms",
          "Optimize solutions with algorithm-specific tricks"
        ],
        milestoneProject: {
          title: "Graph Algorithm Portfolio",
          description: "Solve 10 advanced graph problems combining Dijkstra, Bellman-Ford, Floyd-Warshall, MST, and flow",
          estimatedHours: 8
        },
        commonPlateaus: [
          "Over-engineering solutions when simpler algorithms suffice",
          "Missing that a problem can be reduced to MST or shortest path"
        ]
      }
    ]
  },

  plan: {
    overview: "Master the six essential advanced graph algorithms tested in software engineering interviews. Start with single-source shortest path (Dijkstra, Bellman-Ford), progress to all-pairs (Floyd-Warshall), learn minimum spanning trees (Prim's, Kruskal's), explore network flow, and finish with a curated set of interview problems that combine these techniques.",
    skippedTopics: [
      "A* search (heuristic-based, rarely asked in coding interviews)",
      "Johnson's algorithm (combines Bellman-Ford + Dijkstra, very rare in interviews)",
      "Maximum bipartite matching (specialized, tested only at research-level)"
    ],
    sessions: []
  },

  quizBank: [],

  interviewTips: [
    "Always clarify if edge weights can be negative before choosing Dijkstra vs Bellman-Ford",
    "For 'shortest path with constraints' problems, consider adding state dimensions to Dijkstra",
    "MST problems often disguise themselves as 'minimum cost to connect' problems",
    "If the graph is small (V <= 400), Floyd-Warshall is simpler than running Dijkstra V times",
    "Network flow rarely appears directly, but max-flow min-cut theorem is a useful concept to mention"
  ],

  commonMistakes: [
    "Using Dijkstra with negative weights (produces incorrect results)",
    "Forgetting to skip already-processed nodes in Dijkstra (stale PQ entries)",
    "Not initializing distance array properly (use Integer.MAX_VALUE / float('inf'))",
    "Adding to Integer.MAX_VALUE causing overflow in Bellman-Ford",
    "Using adjacency matrix for sparse graphs (wastes memory)",
    "Forgetting union-by-rank or path compression in Kruskal's Union-Find"
  ],

  patterns: [
    "Single-source shortest path with priority queue (Dijkstra)",
    "Relaxation-based shortest path (Bellman-Ford)",
    "Dynamic programming on intermediate vertices (Floyd-Warshall)",
    "Greedy edge selection with Union-Find (Kruskal's MST)",
    "Greedy vertex growth with min-heap (Prim's MST)",
    "Augmenting paths in residual graph (Ford-Fulkerson)"
  ]
};

// ─── Sessions ──────────────────────────────────────────────────────────────────

topic.plan.sessions = [
  {
    sessionNumber: 1,
    title: "Dijkstra's Algorithm - Shortest Path with Priority Queue",
    paretoJustification: "Dijkstra is the most frequently tested shortest path algorithm in interviews. Understanding priority queue optimization is essential for efficient solutions.",
    objectives: [
      "Understand the greedy approach behind Dijkstra's algorithm",
      "Implement Dijkstra using a min-heap / priority queue",
      "Analyze time and space complexity with different data structures",
      "Recognize when Dijkstra fails (negative weights)"
    ],
    activities: [
      { description: "Trace Dijkstra's algorithm by hand on a 6-node weighted graph", durationMinutes: 15 },
      { description: "Implement Dijkstra in Java using PriorityQueue and in Python using heapq", durationMinutes: 25 },
      { description: "Solve LeetCode #743 Network Delay Time", durationMinutes: 20 }
    ],
    reviewQuestions: [
      "Why does Dijkstra's algorithm not work with negative edge weights?:::Because Dijkstra greedily finalizes the shortest distance to each node. A negative edge later could provide a shorter path to an already-finalized node, but Dijkstra never revisits finalized nodes.",
      "What is the time complexity of Dijkstra with a binary heap?:::O((V + E) log V). Each vertex is extracted from the heap once (V log V), and each edge may cause a decrease-key operation (E log V).",
      "How do you handle the 'stale entry' problem in a lazy Dijkstra implementation?:::When polling from the priority queue, check if the polled distance is greater than the current known distance. If so, skip it as a stale entry."
    ],
    successCriteria: "Can implement Dijkstra from scratch and solve LC #743 within 25 minutes",
    content: `### Why Dijkstra's Algorithm?

**Dijkstra's algorithm** finds the shortest path from a single source to all other vertices in a weighted graph with **non-negative** edge weights. It is the most frequently tested graph algorithm in coding interviews.

**Key insight:** Dijkstra uses a **greedy** approach. It always processes the unvisited vertex with the smallest known distance, guaranteeing that once a vertex is processed, its shortest distance is final.

### How It Works

1. Initialize distances: source = 0, all others = infinity
2. Add source to a min-heap (priority queue)
3. While the heap is not empty:
   - Extract the vertex u with minimum distance
   - For each neighbor v of u, if dist[u] + weight(u,v) < dist[v], update dist[v] and add v to the heap
4. Skip stale entries (when polled distance > current known distance)

\`\`\`mermaid
graph LR
    A((A<br/>0)) -->|4| B((B<br/>4))
    A -->|1| C((C<br/>1))
    C -->|2| B
    B -->|5| D((D<br/>9))
    C -->|8| D
    C -->|3| E((E<br/>4))
    E -->|1| D
    style A fill:#1DD1A1
    style C fill:#FDB813
    style E fill:#FDB813
\`\`\`

In this example, the shortest path from A to D is A -> C -> E -> D with cost 5, not the direct A -> B -> D path with cost 9.

### Implementation

**Java:**
\`\`\`java
public int[] dijkstra(List<int[]>[] graph, int src, int n) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;

    // Min-heap: {node, distance}
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
    pq.offer(new int[]{src, 0});

    while (!pq.isEmpty()) {
        int[] cur = pq.poll();
        int u = cur[0], d = cur[1];
        if (d > dist[u]) continue; // Skip stale entries

        for (int[] edge : graph[u]) {
            int v = edge[0], w = edge[1];
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.offer(new int[]{v, dist[v]});
            }
        }
    }
    return dist;
}
\`\`\`

**Python:**
\`\`\`python
import heapq

def dijkstra(graph, src, n):
    dist = [float('inf')] * n
    dist[src] = 0
    pq = [(0, src)]  # (distance, node)

    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:  # Skip stale entries
            continue
        for v, w in graph[u]:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                heapq.heappush(pq, (dist[v], v))

    return dist
\`\`\`

### Complexity Analysis

| Data Structure | Time | Space |
|----------------|------|-------|
| Binary Heap | O((V + E) log V) | O(V) |
| Fibonacci Heap | O(V log V + E) | O(V) |
| Array (no heap) | O(V^2) | O(V) |

For sparse graphs (E ~ V), use a binary heap. For dense graphs (E ~ V^2), the array approach can be competitive.

### Why Not Negative Weights?

Dijkstra assumes that once a vertex is popped from the heap, its distance is final. With negative edges, a later path through a negative edge could yield a shorter distance, violating this assumption. Use **Bellman-Ford** for graphs with negative weights.

### Interview Application: LC #743 Network Delay Time

Given a network of n nodes and weighted directed edges, find the time it takes for a signal from node k to reach all nodes. This is a direct Dijkstra application: run Dijkstra from k and return the maximum distance.

\`\`\`java
public int networkDelayTime(int[][] times, int n, int k) {
    List<int[]>[] graph = new ArrayList[n + 1];
    for (int i = 0; i <= n; i++) graph[i] = new ArrayList<>();
    for (int[] t : times) graph[t[0]].add(new int[]{t[1], t[2]});

    int[] dist = new int[n + 1];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[k] = 0;
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
    pq.offer(new int[]{k, 0});

    while (!pq.isEmpty()) {
        int[] cur = pq.poll();
        int u = cur[0], d = cur[1];
        if (d > dist[u]) continue;
        for (int[] e : graph[u]) {
            if (dist[u] + e[1] < dist[e[0]]) {
                dist[e[0]] = dist[u] + e[1];
                pq.offer(new int[]{e[0], dist[e[0]]});
            }
        }
    }

    int max = 0;
    for (int i = 1; i <= n; i++) {
        if (dist[i] == Integer.MAX_VALUE) return -1;
        max = Math.max(max, dist[i]);
    }
    return max;
}
\`\`\``,
    resources: [
      { title: "LeetCode #743 - Network Delay Time", type: "practice", url: "https://leetcode.com/problems/network-delay-time/" },
      { title: "LeetCode #1631 - Path With Minimum Effort", type: "practice", url: "https://leetcode.com/problems/path-with-minimum-effort/" }
    ]
  },

  {
    sessionNumber: 2,
    title: "Bellman-Ford Algorithm - Negative Weights & Cycle Detection",
    paretoJustification: "Bellman-Ford handles negative weights and detects negative cycles, making it essential for problems where Dijkstra fails. LC #787 is a top interview problem using modified Bellman-Ford.",
    objectives: [
      "Understand the relaxation-based approach of Bellman-Ford",
      "Implement Bellman-Ford with negative cycle detection",
      "Compare Bellman-Ford vs Dijkstra tradeoffs",
      "Apply modified Bellman-Ford with K relaxation limit"
    ],
    activities: [
      { description: "Trace Bellman-Ford by hand on a graph with a negative edge", durationMinutes: 15 },
      { description: "Implement Bellman-Ford in Java and Python with negative cycle detection", durationMinutes: 20 },
      { description: "Solve LeetCode #787 Cheapest Flights Within K Stops using modified Bellman-Ford", durationMinutes: 25 }
    ],
    reviewQuestions: [
      "Why does Bellman-Ford require exactly V-1 iterations?:::In a graph with V vertices, the longest shortest path (without negative cycles) can have at most V-1 edges. Each iteration relaxes paths with one more edge, so V-1 iterations guarantee all shortest paths are found.",
      "How does Bellman-Ford detect negative cycles?:::After V-1 iterations, perform one more relaxation pass. If any distance can still be reduced, a negative-weight cycle exists, because shortest paths without cycles need at most V-1 edges.",
      "What modification to Bellman-Ford solves LC #787 (K stops)?:::Limit the number of relaxation iterations to K+1 (K stops means K+1 edges). Use a copy of the distance array each iteration to prevent using paths from the current iteration."
    ],
    successCriteria: "Can implement Bellman-Ford with cycle detection and solve LC #787 within 30 minutes",
    content: `### When Dijkstra Fails

Dijkstra assumes non-negative weights. Consider a graph where A->B costs 1, A->C costs 5, and C->B costs -10. Dijkstra would finalize B's distance as 1 (via A->B), but the actual shortest path is A->C->B = -5. **Bellman-Ford** handles this correctly.

### How Bellman-Ford Works

The algorithm performs **V-1 relaxation passes** over all edges. In each pass, it tries to improve the shortest known distance to every vertex.

**Why V-1 passes?** The longest shortest path (without negative cycles) uses at most V-1 edges. Each pass extends paths by one edge, so V-1 passes find all shortest paths.

\`\`\`mermaid
graph LR
    S((S<br/>0)) -->|6| A((A))
    S -->|7| B((B))
    A -->|5| B
    A -->|8| C((C))
    A -->|-4| D((D))
    B -->|-2| A
    B -->|9| C
    B -->|-3| D
    C -->|7| S
    D -->|2| C
    style S fill:#1DD1A1
\`\`\`

### Implementation

**Java:**
\`\`\`java
public int[] bellmanFord(int[][] edges, int src, int n) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;

    // V-1 relaxation passes
    for (int i = 0; i < n - 1; i++) {
        for (int[] e : edges) {
            int u = e[0], v = e[1], w = e[2];
            if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
            }
        }
    }

    // Negative cycle detection: V-th pass
    for (int[] e : edges) {
        if (dist[e[0]] != Integer.MAX_VALUE && dist[e[0]] + e[2] < dist[e[1]]) {
            throw new RuntimeException("Negative cycle detected");
        }
    }
    return dist;
}
\`\`\`

**Python:**
\`\`\`python
def bellman_ford(edges, src, n):
    dist = [float('inf')] * n
    dist[src] = 0

    for _ in range(n - 1):
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w

    # Negative cycle check
    for u, v, w in edges:
        if dist[u] + w < dist[v]:
            raise ValueError("Negative cycle detected")

    return dist
\`\`\`

### Complexity Comparison

| Feature | Dijkstra | Bellman-Ford |
|---------|----------|-------------|
| Time | O((V+E) log V) | O(V * E) |
| Negative weights | No | Yes |
| Negative cycle detection | No | Yes |
| Best for | Sparse, non-negative | Negative weights, K-stop limits |

### Interview Application: LC #787 Cheapest Flights Within K Stops

**Problem:** Find the cheapest flight from src to dst with at most K stops.

**Key insight:** Limit Bellman-Ford to K+1 iterations. Use a copy of the distance array each iteration to prevent "shortcutting" through paths found in the same iteration.

**Java:**
\`\`\`java
public int findCheapestPrice(int n, int[][] flights, int src, int dst, int k) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;

    for (int i = 0; i <= k; i++) {
        int[] temp = dist.clone(); // Snapshot to prevent using current iteration's results
        for (int[] f : flights) {
            int u = f[0], v = f[1], w = f[2];
            if (dist[u] != Integer.MAX_VALUE && dist[u] + w < temp[v]) {
                temp[v] = dist[u] + w;
            }
        }
        dist = temp;
    }
    return dist[dst] == Integer.MAX_VALUE ? -1 : dist[dst];
}
\`\`\`

**Python:**
\`\`\`python
def find_cheapest_price(n, flights, src, dst, k):
    dist = [float('inf')] * n
    dist[src] = 0

    for _ in range(k + 1):
        temp = dist[:]
        for u, v, w in flights:
            if dist[u] + w < temp[v]:
                temp[v] = dist[u] + w
        dist = temp

    return dist[dst] if dist[dst] != float('inf') else -1
\`\`\`

### Common Mistakes

1. **Not cloning the distance array** in the K-stops variant, allowing paths with more than K stops
2. **Adding to Integer.MAX_VALUE** causing integer overflow; always guard with \`dist[u] != MAX_VALUE\`
3. **Confusing edges vs stops:** K stops means K+1 edges, so iterate K+1 times`,
    resources: [
      { title: "LeetCode #787 - Cheapest Flights Within K Stops", type: "practice", url: "https://leetcode.com/problems/cheapest-flights-within-k-stops/" },
      { title: "LeetCode #1514 - Path with Maximum Probability", type: "practice", url: "https://leetcode.com/problems/path-with-maximum-probability/" }
    ]
  },

  {
    sessionNumber: 3,
    title: "Floyd-Warshall - All-Pairs Shortest Path",
    paretoJustification: "Floyd-Warshall is the go-to algorithm when you need shortest paths between all pairs of vertices. Its elegant DP formulation makes it easy to code under pressure.",
    objectives: [
      "Understand the dynamic programming formulation of Floyd-Warshall",
      "Implement Floyd-Warshall with path reconstruction",
      "Identify problems that require all-pairs shortest path",
      "Analyze when Floyd-Warshall is preferable to running Dijkstra V times"
    ],
    activities: [
      { description: "Trace Floyd-Warshall on a 4-node graph, filling the distance matrix step by step", durationMinutes: 15 },
      { description: "Implement Floyd-Warshall in Java and Python", durationMinutes: 20 },
      { description: "Solve LeetCode #1334 Find the City With the Smallest Number of Neighbors", durationMinutes: 25 }
    ],
    reviewQuestions: [
      "What does the 'k' loop represent in Floyd-Warshall?:::The intermediate vertex. dist[i][j] after iteration k represents the shortest path from i to j using only vertices {0, 1, ..., k} as intermediate nodes. This is the DP transition.",
      "When is Floyd-Warshall better than running Dijkstra from every vertex?:::For dense graphs (E close to V^2). Floyd-Warshall is O(V^3) regardless of edge count. Running Dijkstra V times is O(V(V+E)log V), which is worse for dense graphs. Floyd-Warshall is also simpler to implement.",
      "How do you reconstruct the actual shortest path in Floyd-Warshall?:::Maintain a 'next' matrix where next[i][j] stores the first vertex on the shortest path from i to j. When dist[i][j] is updated through k, set next[i][j] = next[i][k]. To reconstruct: follow next[i][j] repeatedly until reaching j."
    ],
    successCriteria: "Can implement Floyd-Warshall and solve LC #1334 within 25 minutes",
    content: `### All-Pairs Shortest Path

While Dijkstra and Bellman-Ford find shortest paths from a single source, sometimes you need the shortest path between **every pair** of vertices. Floyd-Warshall solves this elegantly using dynamic programming.

### The DP Formulation

Define \`dp[k][i][j]\` = shortest path from i to j using only vertices {0, 1, ..., k} as intermediates.

**Base case:** dp[-1][i][j] = weight(i,j) if edge exists, else infinity

**Transition:** dp[k][i][j] = min(dp[k-1][i][j], dp[k-1][i][k] + dp[k-1][k][j])

Since we only need the previous k, we optimize to a 2D array updated in-place.

\`\`\`mermaid
graph LR
    A((1)) -->|3| B((2))
    A -->|8| C((3))
    A -->|"&minus;4"| D((4))
    B -->|1| C
    C -->|"&minus;5"| D
    D -->|2| A
    D -->|6| B
    style A fill:#1DD1A1
\`\`\`

### Implementation

**Java:**
\`\`\`java
public int[][] floydWarshall(int[][] graph, int n) {
    int INF = 100000; // Use a large value, not MAX_VALUE (avoid overflow)
    int[][] dist = new int[n][n];

    // Initialize
    for (int i = 0; i < n; i++) {
        Arrays.fill(dist[i], INF);
        dist[i][i] = 0;
    }
    for (int[] edge : graph) {
        dist[edge[0]][edge[1]] = edge[2];
    }

    // DP: try each vertex k as intermediate
    for (int k = 0; k < n; k++) {
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                if (dist[i][k] + dist[k][j] < dist[i][j]) {
                    dist[i][j] = dist[i][k] + dist[k][j];
                }
            }
        }
    }
    return dist;
}
\`\`\`

**Python:**
\`\`\`python
def floyd_warshall(n, edges):
    INF = float('inf')
    dist = [[INF] * n for _ in range(n)]
    for i in range(n):
        dist[i][i] = 0
    for u, v, w in edges:
        dist[u][v] = w

    for k in range(n):
        for i in range(n):
            for j in range(n):
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]

    return dist
\`\`\`

### Complexity

| Aspect | Value |
|--------|-------|
| Time | O(V^3) |
| Space | O(V^2) |
| Negative weights? | Yes |
| Negative cycle detection? | Yes (check if dist[i][i] < 0) |

### When to Use Floyd-Warshall

- **V is small** (typically V <= 400 for competitive programming, V <= 100 in interviews)
- You need **all-pairs** distances
- Graph may have **negative weights** (but no negative cycles)
- Simpler code matters (only 3 nested loops)

### Detecting Negative Cycles

After running Floyd-Warshall, check the diagonal: if \`dist[i][i] < 0\` for any i, there is a negative cycle passing through vertex i.

### Path Reconstruction

\`\`\`java
// Initialize next[i][j] = j for each direct edge
int[][] next = new int[n][n];
for (int[] e : graph) next[e[0]][e[1]] = e[1];

// Update during Floyd-Warshall
if (dist[i][k] + dist[k][j] < dist[i][j]) {
    dist[i][j] = dist[i][k] + dist[k][j];
    next[i][j] = next[i][k]; // Go through k first
}

// Reconstruct path from u to v
List<Integer> path(int u, int v, int[][] next) {
    List<Integer> p = new ArrayList<>();
    for (int at = u; at != v; at = next[at][v]) p.add(at);
    p.add(v);
    return p;
}
\`\`\`

### Interview Application: LC #1334

**Problem:** Find the city with the smallest number of neighbors at a threshold distance.

**Approach:** Run Floyd-Warshall, then for each city count how many other cities are within the threshold distance. Return the city with the smallest count (largest index for ties).

\`\`\`python
def find_the_city(n, edges, threshold):
    INF = float('inf')
    dist = [[INF] * n for _ in range(n)]
    for i in range(n):
        dist[i][i] = 0
    for u, v, w in edges:
        dist[u][v] = w
        dist[v][u] = w  # undirected

    for k in range(n):
        for i in range(n):
            for j in range(n):
                dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])

    result, min_count = -1, n + 1
    for i in range(n):
        count = sum(1 for j in range(n) if j != i and dist[i][j] <= threshold)
        if count <= min_count:
            min_count = count
            result = i
    return result
\`\`\``,
    resources: [
      { title: "LeetCode #1334 - Find the City With the Smallest Number of Neighbors", type: "practice", url: "https://leetcode.com/problems/find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance/" },
      { title: "LeetCode #1462 - Course Schedule IV", type: "practice", url: "https://leetcode.com/problems/course-schedule-iv/" }
    ]
  },

  {
    sessionNumber: 4,
    title: "Minimum Spanning Tree - Prim's & Kruskal's Algorithms",
    paretoJustification: "MST algorithms are essential for 'minimum cost to connect' interview problems. Understanding both Prim's and Kruskal's gives flexibility to choose the optimal approach based on graph density.",
    objectives: [
      "Understand the Minimum Spanning Tree property and cut property",
      "Implement Kruskal's algorithm with Union-Find (Disjoint Set)",
      "Implement Prim's algorithm with a priority queue",
      "Choose between Prim's and Kruskal's based on graph characteristics"
    ],
    activities: [
      { description: "Build an MST by hand using both Kruskal's and Prim's on a 7-node graph", durationMinutes: 15 },
      { description: "Implement Union-Find with path compression and union by rank", durationMinutes: 15 },
      { description: "Solve LeetCode #1584 Min Cost to Connect All Points using both algorithms", durationMinutes: 30 }
    ],
    reviewQuestions: [
      "What is the cut property and why does it guarantee MST correctness?:::For any cut of the graph, the minimum weight edge crossing the cut must be in every MST. This is because replacing it with a heavier crossing edge would increase total weight while maintaining connectivity.",
      "When is Kruskal's preferred over Prim's?:::Kruskal's is preferred for sparse graphs (E << V^2) because sorting E edges takes O(E log E). Prim's is better for dense graphs because it processes vertices, not edges.",
      "What are path compression and union by rank, and why are they important?:::Path compression flattens the tree during find operations (each node points directly to root). Union by rank attaches the smaller tree under the larger. Together they achieve nearly O(1) amortized time per operation."
    ],
    successCriteria: "Can implement both MST algorithms and solve LC #1584 within 30 minutes",
    content: `### What is a Minimum Spanning Tree?

A **Minimum Spanning Tree (MST)** of a connected, undirected, weighted graph is a subset of edges that connects all vertices with the minimum total edge weight, without forming any cycle.

**Properties:**
- An MST has exactly **V - 1** edges
- It is a **tree** (connected, acyclic)
- There may be **multiple valid MSTs** if edges have equal weights

\`\`\`mermaid
graph TD
    A((A)) -->|2| B((B))
    A -->|3| C((C))
    B -->|1| C
    B -->|4| D((D))
    C -->|5| D
    C -->|6| E((E))
    D -->|7| E
    style A fill:#1DD1A1
    style B fill:#FDB813
    style C fill:#FDB813
\`\`\`

MST edges: B-C(1), A-B(2), B-D(4), C-E(6) = total weight 13

### Kruskal's Algorithm (Edge-Based, Union-Find)

1. Sort all edges by weight
2. For each edge (in order), add it to MST if it does not form a cycle
3. Use **Union-Find** to efficiently detect cycles

**Java:**
\`\`\`java
class UnionFind {
    int[] parent, rank;
    UnionFind(int n) {
        parent = new int[n]; rank = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
    }
    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]); // Path compression
        return parent[x];
    }
    boolean union(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return false;
        if (rank[px] < rank[py]) { parent[px] = py; }
        else if (rank[px] > rank[py]) { parent[py] = px; }
        else { parent[py] = px; rank[px]++; }
        return true;
    }
}

public int kruskal(int[][] edges, int n) {
    Arrays.sort(edges, (a, b) -> a[2] - b[2]);
    UnionFind uf = new UnionFind(n);
    int cost = 0, edgeCount = 0;
    for (int[] e : edges) {
        if (uf.union(e[0], e[1])) {
            cost += e[2];
            if (++edgeCount == n - 1) break;
        }
    }
    return cost;
}
\`\`\`

**Python:**
\`\`\`python
class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x, y):
        px, py = self.find(x), self.find(y)
        if px == py: return False
        if self.rank[px] < self.rank[py]: px, py = py, px
        self.parent[py] = px
        if self.rank[px] == self.rank[py]: self.rank[px] += 1
        return True

def kruskal(edges, n):
    edges.sort(key=lambda e: e[2])
    uf = UnionFind(n)
    cost, count = 0, 0
    for u, v, w in edges:
        if uf.union(u, v):
            cost += w
            count += 1
            if count == n - 1: break
    return cost
\`\`\`

### Prim's Algorithm (Vertex-Based, Priority Queue)

1. Start from any vertex, add all its edges to a min-heap
2. Extract the minimum edge; if it leads to an unvisited vertex, add it to MST
3. Add all edges of the newly visited vertex to the heap

**Java:**
\`\`\`java
public int prim(List<int[]>[] graph, int n) {
    boolean[] visited = new boolean[n];
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
    pq.offer(new int[]{0, 0}); // {node, weight}
    int cost = 0, edges = 0;

    while (!pq.isEmpty() && edges < n) {
        int[] cur = pq.poll();
        if (visited[cur[0]]) continue;
        visited[cur[0]] = true;
        cost += cur[1];
        edges++;
        for (int[] neighbor : graph[cur[0]]) {
            if (!visited[neighbor[0]]) {
                pq.offer(new int[]{neighbor[0], neighbor[1]});
            }
        }
    }
    return cost;
}
\`\`\`

**Python:**
\`\`\`python
import heapq

def prim(graph, n):
    visited = [False] * n
    pq = [(0, 0)]  # (weight, node)
    cost, edges = 0, 0

    while pq and edges < n:
        w, u = heapq.heappop(pq)
        if visited[u]: continue
        visited[u] = True
        cost += w
        edges += 1
        for v, weight in graph[u]:
            if not visited[v]:
                heapq.heappush(pq, (weight, v))

    return cost
\`\`\`

### Kruskal's vs Prim's

| Feature | Kruskal's | Prim's |
|---------|-----------|--------|
| Approach | Edge-based | Vertex-based |
| Data structure | Union-Find | Priority Queue |
| Best for | Sparse graphs | Dense graphs |
| Time | O(E log E) | O((V + E) log V) |
| Edge list input | Natural fit | Needs adjacency list |

### Interview Application: LC #1584

**Problem:** Given n points, find the minimum cost to connect all points where cost = Manhattan distance.

This is a complete graph (every pair connected), so E = V^2/2. Both approaches work, but Prim's avoids sorting all O(V^2) edges upfront.`,
    resources: [
      { title: "LeetCode #1584 - Min Cost to Connect All Points", type: "practice", url: "https://leetcode.com/problems/min-cost-to-connect-all-points/" },
      { title: "LeetCode #1135 - Connecting Cities With Minimum Cost", type: "practice", url: "https://leetcode.com/problems/connecting-cities-with-minimum-cost/" }
    ]
  },

  {
    sessionNumber: 5,
    title: "Network Flow - Ford-Fulkerson & Max-Flow Min-Cut",
    paretoJustification: "Network flow is a fundamental concept in graph theory. While direct implementation is rare in interviews, understanding max-flow min-cut is valuable for system design and optimization problems.",
    objectives: [
      "Understand the max-flow problem and its real-world applications",
      "Learn the Ford-Fulkerson method and augmenting paths",
      "Understand the Max-Flow Min-Cut theorem and its implications",
      "Implement Edmonds-Karp (BFS-based Ford-Fulkerson)"
    ],
    activities: [
      { description: "Trace Ford-Fulkerson by hand on a small flow network, drawing residual graphs", durationMinutes: 20 },
      { description: "Implement Edmonds-Karp in Java and Python", durationMinutes: 25 },
      { description: "Identify 3 real-world problems reducible to max-flow", durationMinutes: 15 }
    ],
    reviewQuestions: [
      "What is a residual graph and why is it needed?:::A residual graph shows remaining capacity on each edge after some flow is sent. Forward edges have capacity minus flow; backward edges have the current flow (allowing 'undoing' flow). It is needed because greedy flow assignment without backtracking can get stuck at suboptimal solutions.",
      "State the Max-Flow Min-Cut theorem.:::The maximum flow from source to sink equals the minimum capacity of any cut separating source from sink. A cut is a partition of vertices into two sets S (containing source) and T (containing sink).",
      "Why does Edmonds-Karp use BFS instead of DFS?:::BFS finds the shortest augmenting path (fewest edges), guaranteeing O(VE) augmentations. DFS (plain Ford-Fulkerson) may find long paths, leading to O(E * max_flow) time which can be exponential with irrational capacities."
    ],
    successCriteria: "Can explain max-flow min-cut theorem and implement Edmonds-Karp from scratch",
    content: `### The Maximum Flow Problem

Given a directed graph with a **source** (s) and **sink** (t), where each edge has a capacity, find the maximum amount of flow that can be sent from s to t without exceeding any edge's capacity.

**Real-world applications:**
- Network bandwidth optimization
- Bipartite matching (job assignments)
- Image segmentation
- Baseball elimination problem

\`\`\`mermaid
graph LR
    S((S)) -->|10| A((A))
    S -->|10| B((B))
    A -->|4| B
    A -->|8| C((C))
    A -->|2| T((T))
    B -->|9| C
    C -->|10| T
    B -->|6| T
    style S fill:#1DD1A1
    style T fill:#E85D26
\`\`\`

### Ford-Fulkerson Method

The Ford-Fulkerson method repeatedly finds **augmenting paths** from source to sink in the **residual graph** and pushes flow along them.

**Steps:**
1. Initialize all flows to 0
2. While there exists an augmenting path from s to t in the residual graph:
   - Find the bottleneck (minimum residual capacity along the path)
   - Update flow along the path (increase forward, decrease backward)
3. Return total flow

### Residual Graph

For each edge (u, v) with capacity c and flow f:
- **Forward edge:** residual capacity = c - f (can send more flow)
- **Backward edge:** residual capacity = f (can "undo" sent flow)

The backward edges are crucial: they allow the algorithm to correct earlier flow decisions.

### Edmonds-Karp: BFS-Based Ford-Fulkerson

Using BFS to find augmenting paths guarantees polynomial time: O(V * E^2).

**Java:**
\`\`\`java
public int maxFlow(int[][] capacity, int s, int t, int n) {
    int[][] residual = new int[n][n];
    for (int i = 0; i < n; i++)
        System.arraycopy(capacity[i], 0, residual[i], 0, n);

    int totalFlow = 0;
    int[] parent = new int[n];

    while (bfs(residual, s, t, parent, n)) {
        // Find bottleneck
        int pathFlow = Integer.MAX_VALUE;
        for (int v = t; v != s; v = parent[v]) {
            int u = parent[v];
            pathFlow = Math.min(pathFlow, residual[u][v]);
        }
        // Update residual capacities
        for (int v = t; v != s; v = parent[v]) {
            int u = parent[v];
            residual[u][v] -= pathFlow;
            residual[v][u] += pathFlow;
        }
        totalFlow += pathFlow;
    }
    return totalFlow;
}

private boolean bfs(int[][] residual, int s, int t, int[] parent, int n) {
    boolean[] visited = new boolean[n];
    Queue<Integer> queue = new LinkedList<>();
    queue.offer(s);
    visited[s] = true;
    Arrays.fill(parent, -1);

    while (!queue.isEmpty()) {
        int u = queue.poll();
        for (int v = 0; v < n; v++) {
            if (!visited[v] && residual[u][v] > 0) {
                visited[v] = true;
                parent[v] = u;
                if (v == t) return true;
                queue.offer(v);
            }
        }
    }
    return false;
}
\`\`\`

**Python:**
\`\`\`python
from collections import deque

def max_flow(capacity, s, t, n):
    residual = [row[:] for row in capacity]
    total_flow = 0

    while True:
        # BFS to find augmenting path
        parent = [-1] * n
        visited = [False] * n
        visited[s] = True
        queue = deque([s])

        while queue:
            u = queue.popleft()
            for v in range(n):
                if not visited[v] and residual[u][v] > 0:
                    visited[v] = True
                    parent[v] = u
                    if v == t:
                        break
                    queue.append(v)

        if not visited[t]:
            break

        # Find bottleneck
        path_flow = float('inf')
        v = t
        while v != s:
            u = parent[v]
            path_flow = min(path_flow, residual[u][v])
            v = u

        # Update residual graph
        v = t
        while v != s:
            u = parent[v]
            residual[u][v] -= path_flow
            residual[v][u] += path_flow
            v = u

        total_flow += path_flow

    return total_flow
\`\`\`

### Max-Flow Min-Cut Theorem

**Theorem:** In any flow network, the maximum flow from source to sink equals the minimum cut capacity.

A **cut** partitions vertices into two sets S (containing source) and T (containing sink). The **cut capacity** is the sum of capacities of edges from S to T.

**Interview insight:** This theorem connects two seemingly different problems. If asked "what is the minimum number of edges to remove to disconnect s from t?" — that is a min-cut problem, solvable via max-flow.

### Complexity

| Algorithm | Time | Space |
|-----------|------|-------|
| Ford-Fulkerson (DFS) | O(E * max_flow) | O(V^2) |
| Edmonds-Karp (BFS) | O(V * E^2) | O(V^2) |
| Dinic's | O(V^2 * E) | O(V^2) |`,
    resources: [
      { title: "Visualgo - Network Flow", type: "interactive", url: "https://visualgo.net/en/maxflow" },
      { title: "CP-Algorithms - Max Flow", type: "reference", url: "https://cp-algorithms.com/graph/edmonds_karp.html" }
    ]
  },

  {
    sessionNumber: 6,
    title: "Interview Problems - LC #743, #787, #1584, #1334",
    paretoJustification: "Applying algorithms to real interview problems solidifies understanding. These four problems cover all major advanced graph algorithms and are frequently asked at top companies.",
    objectives: [
      "Solve LC #743 using Dijkstra (single-source shortest path)",
      "Solve LC #787 using modified Bellman-Ford (K-stop constraint)",
      "Solve LC #1584 using Kruskal's or Prim's (MST)",
      "Solve LC #1334 using Floyd-Warshall or multi-source Dijkstra"
    ],
    activities: [
      { description: "Solve all 4 problems on LeetCode, timing yourself (target: 30 min each)", durationMinutes: 45 },
      { description: "For each problem, write a second solution using an alternative algorithm", durationMinutes: 30 },
      { description: "Create a decision flowchart: 'Which graph algorithm should I use?'", durationMinutes: 15 }
    ],
    reviewQuestions: [
      "For LC #743, why is Dijkstra preferred over Bellman-Ford?:::The graph has non-negative weights, and Dijkstra's O((V+E)log V) is faster than Bellman-Ford's O(VE). Since we only need single-source shortest paths, Dijkstra is the natural and efficient choice.",
      "For LC #787, why can't we use standard Dijkstra?:::Standard Dijkstra does not track the number of stops. We need either modified Bellman-Ford (limit iterations to K+1) or Dijkstra with an extra state dimension (node, stops_remaining) to enforce the K-stop constraint.",
      "For LC #1584, what is the time complexity difference between Kruskal's and Prim's?:::With n points, there are O(n^2) edges. Kruskal's: O(n^2 log n) for sorting + O(n^2 * alpha(n)) for union-find. Prim's with heap: O(n^2 log n). Both are similar, but Prim's can avoid generating all edges upfront."
    ],
    successCriteria: "Can solve all 4 problems within 2 hours total, choosing the optimal algorithm for each",
    content: `### Problem-Solving Strategy

Before coding any graph problem, ask yourself:
1. **Single-source or all-pairs?** (Dijkstra/Bellman-Ford vs Floyd-Warshall)
2. **Negative weights?** (Bellman-Ford) or **Non-negative?** (Dijkstra)
3. **Connect all nodes at minimum cost?** (MST: Kruskal's/Prim's)
4. **Constraints on path?** (Modified algorithm with extra state)

\`\`\`mermaid
flowchart TD
    Start[Graph Problem] --> Q1{Shortest Path?}
    Q1 -->|Yes| Q2{All pairs needed?}
    Q1 -->|No| Q3{Connect all nodes?}
    Q2 -->|Yes| FW[Floyd-Warshall]
    Q2 -->|No| Q4{Negative weights?}
    Q4 -->|Yes| BF[Bellman-Ford]
    Q4 -->|No| DJ[Dijkstra]
    Q3 -->|Yes| MST[Kruskal / Prim]
    Q3 -->|No| Q5{Max flow?}
    Q5 -->|Yes| FF[Ford-Fulkerson]
    Q5 -->|No| Other[BFS/DFS/Topo]
    style Start fill:#E85D26
    style DJ fill:#1DD1A1
    style BF fill:#FDB813
    style FW fill:#FDB813
    style MST fill:#1DD1A1
\`\`\`

### Problem 1: LC #743 — Network Delay Time

**Category:** Single-source shortest path (Dijkstra)

Given n network nodes and weighted directed edges, find the time for a signal from node k to reach all nodes. Return -1 if impossible.

**Java:**
\`\`\`java
public int networkDelayTime(int[][] times, int n, int k) {
    List<int[]>[] graph = new ArrayList[n + 1];
    for (int i = 0; i <= n; i++) graph[i] = new ArrayList<>();
    for (int[] t : times) graph[t[0]].add(new int[]{t[1], t[2]});

    int[] dist = new int[n + 1];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[k] = 0;
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
    pq.offer(new int[]{k, 0});

    while (!pq.isEmpty()) {
        int[] cur = pq.poll();
        if (cur[1] > dist[cur[0]]) continue;
        for (int[] e : graph[cur[0]]) {
            int newDist = dist[cur[0]] + e[1];
            if (newDist < dist[e[0]]) {
                dist[e[0]] = newDist;
                pq.offer(new int[]{e[0], newDist});
            }
        }
    }
    int ans = 0;
    for (int i = 1; i <= n; i++) {
        if (dist[i] == Integer.MAX_VALUE) return -1;
        ans = Math.max(ans, dist[i]);
    }
    return ans;
}
\`\`\`

**Python:**
\`\`\`python
def network_delay_time(times, n, k):
    graph = defaultdict(list)
    for u, v, w in times:
        graph[u].append((v, w))

    dist = {i: float('inf') for i in range(1, n + 1)}
    dist[k] = 0
    pq = [(0, k)]

    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]: continue
        for v, w in graph[u]:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                heapq.heappush(pq, (dist[v], v))

    mx = max(dist.values())
    return mx if mx < float('inf') else -1
\`\`\`

### Problem 2: LC #787 — Cheapest Flights Within K Stops

**Category:** Modified Bellman-Ford (K iterations)

**Python:**
\`\`\`python
def find_cheapest_price(n, flights, src, dst, k):
    dist = [float('inf')] * n
    dist[src] = 0
    for _ in range(k + 1):
        temp = dist[:]
        for u, v, w in flights:
            if dist[u] + w < temp[v]:
                temp[v] = dist[u] + w
        dist = temp
    return dist[dst] if dist[dst] != float('inf') else -1
\`\`\`

### Problem 3: LC #1584 — Min Cost to Connect All Points

**Category:** MST (Kruskal's with Union-Find)

**Java:**
\`\`\`java
public int minCostConnectPoints(int[][] points) {
    int n = points.length;
    List<int[]> edges = new ArrayList<>();
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++) {
            int dist = Math.abs(points[i][0] - points[j][0])
                     + Math.abs(points[i][1] - points[j][1]);
            edges.add(new int[]{i, j, dist});
        }
    edges.sort((a, b) -> a[2] - b[2]);

    UnionFind uf = new UnionFind(n);
    int cost = 0, count = 0;
    for (int[] e : edges) {
        if (uf.union(e[0], e[1])) {
            cost += e[2];
            if (++count == n - 1) break;
        }
    }
    return cost;
}
\`\`\`

**Python:**
\`\`\`python
def min_cost_connect_points(points):
    n = len(points)
    edges = []
    for i in range(n):
        for j in range(i + 1, n):
            d = abs(points[i][0] - points[j][0]) + abs(points[i][1] - points[j][1])
            edges.append((d, i, j))
    edges.sort()

    uf = UnionFind(n)
    cost, count = 0, 0
    for d, u, v in edges:
        if uf.union(u, v):
            cost += d
            count += 1
            if count == n - 1: break
    return cost
\`\`\`

### Problem 4: LC #1334 — Find the City

**Category:** Floyd-Warshall (all-pairs)

**Java:**
\`\`\`java
public int findTheCity(int n, int[][] edges, int distanceThreshold) {
    int INF = 100000;
    int[][] dist = new int[n][n];
    for (int[] row : dist) Arrays.fill(row, INF);
    for (int i = 0; i < n; i++) dist[i][i] = 0;
    for (int[] e : edges) {
        dist[e[0]][e[1]] = e[2];
        dist[e[1]][e[0]] = e[2];
    }
    for (int k = 0; k < n; k++)
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                dist[i][j] = Math.min(dist[i][j], dist[i][k] + dist[k][j]);

    int result = -1, minCount = n + 1;
    for (int i = 0; i < n; i++) {
        int count = 0;
        for (int j = 0; j < n; j++)
            if (j != i && dist[i][j] <= distanceThreshold) count++;
        if (count <= minCount) { minCount = count; result = i; }
    }
    return result;
}
\`\`\`

### Algorithm Selection Summary

| Problem | Key Signal | Algorithm |
|---------|-----------|-----------|
| #743 | "delay time to all nodes" | Dijkstra |
| #787 | "cheapest with K stops" | Bellman-Ford (K iterations) |
| #1584 | "connect all points, min cost" | MST (Kruskal/Prim) |
| #1334 | "all pairs within threshold" | Floyd-Warshall |`,
    resources: [
      { title: "LeetCode #743 - Network Delay Time", type: "practice", url: "https://leetcode.com/problems/network-delay-time/" },
      { title: "LeetCode #787 - Cheapest Flights Within K Stops", type: "practice", url: "https://leetcode.com/problems/cheapest-flights-within-k-stops/" },
      { title: "LeetCode #1584 - Min Cost to Connect All Points", type: "practice", url: "https://leetcode.com/problems/min-cost-to-connect-all-points/" },
      { title: "LeetCode #1334 - Find the City", type: "practice", url: "https://leetcode.com/problems/find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance/" }
    ]
  }
];

// ─── Quiz Bank ─────────────────────────────────────────────────────────────────

topic.quizBank = [
  {
    question: "What is the time complexity of Dijkstra's algorithm using a binary heap?",
    format: "mcq",
    difficulty: "medium",
    bloomLabel: "Understand",
    options: ["O(V^2)", "O((V + E) log V)", "O(V * E)", "O(V^3)"],
    correctAnswer: "O((V + E) log V)",
    explanation: "**Correct: O((V + E) log V).** Each vertex is extracted from the heap at most once (V extractions, each O(log V)), and each edge may trigger a decrease-key or insertion (E operations, each O(log V)). This gives O((V + E) log V) total."
  },
  {
    question: "Why does Dijkstra's algorithm fail with negative edge weights?",
    format: "mcq",
    difficulty: "medium",
    bloomLabel: "Understand",
    options: [
      "It cannot handle weighted graphs",
      "It greedily finalizes distances and never revisits nodes",
      "The priority queue does not support negative values",
      "It only works on undirected graphs"
    ],
    correctAnswer: "It greedily finalizes distances and never revisits nodes",
    explanation: "**Correct: It greedily finalizes distances and never revisits nodes.** Dijkstra assumes once a node is popped from the priority queue, its shortest distance is final. A negative edge could later provide a shorter path to that node, but Dijkstra would miss it."
  },
  {
    question: "How many relaxation passes does Bellman-Ford perform?",
    format: "mcq",
    difficulty: "easy",
    bloomLabel: "Remember",
    options: ["V", "V - 1", "E", "E - 1"],
    correctAnswer: "V - 1",
    explanation: "**Correct: V - 1.** The shortest path in a graph with V vertices can have at most V - 1 edges. Each pass relaxes all edges once, extending shortest paths by one edge. So V - 1 passes guarantee all shortest paths are found."
  },
  {
    question: "How does Bellman-Ford detect a negative-weight cycle?",
    format: "mcq",
    difficulty: "medium",
    bloomLabel: "Understand",
    options: [
      "By checking if any distance is negative",
      "By performing a V-th relaxation pass and checking for improvements",
      "By comparing distances with Dijkstra's output",
      "By counting the number of edges in the shortest path"
    ],
    correctAnswer: "By performing a V-th relaxation pass and checking for improvements",
    explanation: "**Correct: By performing a V-th relaxation pass and checking for improvements.** After V - 1 passes, all shortest paths are found (if no negative cycle). If a V-th pass still improves any distance, a negative cycle must exist."
  },
  {
    question: "What does the 'k' loop represent in Floyd-Warshall?",
    format: "mcq",
    difficulty: "medium",
    bloomLabel: "Understand",
    options: [
      "The source vertex",
      "The number of edges in the path",
      "The intermediate vertex considered in the DP",
      "The destination vertex"
    ],
    correctAnswer: "The intermediate vertex considered in the DP",
    explanation: "**Correct: The intermediate vertex considered in the DP.** dist[i][j] after iteration k represents the shortest path from i to j using only vertices {0, 1, ..., k} as intermediate nodes. This is the core DP formulation."
  },
  {
    question: "What is the time complexity of Floyd-Warshall?",
    format: "mcq",
    difficulty: "easy",
    bloomLabel: "Remember",
    options: ["O(V^2)", "O(V^2 log V)", "O(V^3)", "O(V * E)"],
    correctAnswer: "O(V^3)",
    explanation: "**Correct: O(V^3).** Floyd-Warshall has three nested loops, each iterating over V vertices. This gives V * V * V = O(V^3) time regardless of the number of edges."
  },
  {
    question: "In Kruskal's algorithm, what data structure is used to detect cycles efficiently?",
    format: "mcq",
    difficulty: "easy",
    bloomLabel: "Remember",
    options: ["Stack", "Priority Queue", "Union-Find (Disjoint Set)", "Hash Map"],
    correctAnswer: "Union-Find (Disjoint Set)",
    explanation: "**Correct: Union-Find (Disjoint Set).** Kruskal's sorts edges by weight and adds them one by one. Union-Find checks if two vertices are already connected (same set). If so, adding the edge would create a cycle."
  },
  {
    question: "What optimizations make Union-Find nearly O(1) per operation?",
    format: "mcq",
    difficulty: "medium",
    bloomLabel: "Understand",
    options: [
      "Sorting and binary search",
      "Path compression and union by rank",
      "Memoization and tabulation",
      "Lazy propagation and segment trees"
    ],
    correctAnswer: "Path compression and union by rank",
    explanation: "**Correct: Path compression and union by rank.** Path compression flattens the tree during find (every node points directly to root). Union by rank attaches smaller trees under larger ones. Together, amortized cost is O(alpha(n)), which is effectively O(1)."
  },
  {
    question: "When is Prim's algorithm preferred over Kruskal's?",
    format: "mcq",
    difficulty: "medium",
    bloomLabel: "Analyze",
    options: [
      "When the graph is sparse",
      "When the graph is dense",
      "When edges have negative weights",
      "When the graph is directed"
    ],
    correctAnswer: "When the graph is dense",
    explanation: "**Correct: When the graph is dense.** Prim's processes vertices (O((V + E) log V) with heap), while Kruskal's sorts edges (O(E log E)). For dense graphs where E approaches V^2, Prim's avoids sorting all edges and can be more efficient."
  },
  {
    question: "What does the Max-Flow Min-Cut theorem state?",
    format: "mcq",
    difficulty: "medium",
    bloomLabel: "Remember",
    options: [
      "Maximum flow equals maximum cut capacity",
      "Maximum flow equals minimum cut capacity",
      "Minimum flow equals minimum cut capacity",
      "Maximum flow equals the number of edges"
    ],
    correctAnswer: "Maximum flow equals minimum cut capacity",
    explanation: "**Correct: Maximum flow equals minimum cut capacity.** The Max-Flow Min-Cut theorem states that in any flow network, the value of the maximum flow from source to sink equals the minimum capacity of any cut separating source from sink."
  },
  {
    question: "What is a residual graph in the context of network flow?",
    format: "mcq",
    difficulty: "medium",
    bloomLabel: "Understand",
    options: [
      "The original graph with unused edges removed",
      "A graph showing remaining capacity and reverse flow on each edge",
      "A subgraph containing only the shortest paths",
      "The graph after removing the minimum cut"
    ],
    correctAnswer: "A graph showing remaining capacity and reverse flow on each edge",
    explanation: "**Correct: A graph showing remaining capacity and reverse flow on each edge.** Forward edges show remaining capacity (capacity - flow), and backward edges show current flow (allowing 'undoing' of previous flow decisions). This enables finding augmenting paths."
  },
  {
    question: "For LC #787 (Cheapest Flights Within K Stops), why must you clone the distance array each iteration?",
    format: "mcq",
    difficulty: "hard",
    bloomLabel: "Analyze",
    options: [
      "To save memory",
      "To prevent using paths discovered in the current iteration (exceeding K stops)",
      "To handle negative weights",
      "To detect cycles"
    ],
    correctAnswer: "To prevent using paths discovered in the current iteration (exceeding K stops)",
    explanation: "**Correct: To prevent using paths discovered in the current iteration.** Without cloning, a vertex updated in the current iteration could be used to relax another vertex in the same iteration, effectively allowing more than K+1 edges. The clone ensures each iteration only extends paths by one edge."
  },
  {
    question: "How many edges does a Minimum Spanning Tree of a connected graph with V vertices have?",
    format: "mcq",
    difficulty: "easy",
    bloomLabel: "Remember",
    options: ["V", "V - 1", "E", "V + 1"],
    correctAnswer: "V - 1",
    explanation: "**Correct: V - 1.** An MST is a tree, and every tree with V vertices has exactly V - 1 edges. This is the minimum number of edges needed to keep all V vertices connected."
  },
  {
    question: "Which algorithm would you choose for finding shortest paths in a graph with V = 50 and negative edge weights, needing all-pairs distances?",
    format: "mcq",
    difficulty: "hard",
    bloomLabel: "Evaluate",
    options: [
      "Dijkstra from each vertex",
      "Bellman-Ford from each vertex",
      "Floyd-Warshall",
      "BFS from each vertex"
    ],
    correctAnswer: "Floyd-Warshall",
    explanation: "**Correct: Floyd-Warshall.** With V = 50 (small), negative weights (rules out Dijkstra), and all-pairs needed, Floyd-Warshall is ideal. It handles negative weights, runs in O(V^3) = O(125,000) which is fast, and is simpler to implement than running Bellman-Ford 50 times."
  },
  {
    question: "What is the time complexity of the Edmonds-Karp algorithm for maximum flow?",
    format: "mcq",
    difficulty: "hard",
    bloomLabel: "Remember",
    options: ["O(V * E)", "O(V * E^2)", "O(V^2 * E)", "O(E * max_flow)"],
    correctAnswer: "O(V * E^2)",
    explanation: "**Correct: O(V * E^2).** Edmonds-Karp uses BFS to find the shortest augmenting path. The number of augmentations is at most O(V * E), and each BFS takes O(E). Total: O(V * E * E) = O(V * E^2). This is polynomial unlike plain Ford-Fulkerson."
  }
];

// ─── Write Output ──────────────────────────────────────────────────────────────

const output = [topic];
const json = JSON.stringify(output);
const outPath = path.join(__dirname, '..', 'public', 'content', 'advanced-graphs.json');
fs.writeFileSync(outPath, json, 'utf-8');

const sizeKB = (Buffer.byteLength(json, 'utf-8') / 1024).toFixed(1);
console.log(`Written: ${outPath}`);
console.log(`Size: ${sizeKB} KB`);
console.log(`Sessions: ${topic.plan.sessions.length}`);
console.log(`Quiz questions: ${topic.quizBank.length}`);
console.log(`Ladder levels: ${topic.ladder.levels.length}`);
console.log(`Resources: ${topic.resources.length}`);

if (parseFloat(sizeKB) > 100) {
  console.error('WARNING: File exceeds 100KB target!');
  process.exit(1);
}

console.log('All checks passed.');
