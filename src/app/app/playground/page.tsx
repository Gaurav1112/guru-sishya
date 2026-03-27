"use client";

import { useState } from "react";
import { CodePlayground, type PlaygroundLanguage } from "@/components/code-playground";
import { Code2, Lightbulb, Lock } from "lucide-react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

const FREE_LANGUAGES: PlaygroundLanguage[] = ["javascript", "python"];

// ── Algorithm templates ───────────────────────────────────────────────────────

const TEMPLATES: { label: string; language: PlaygroundLanguage; description: string; code: string }[] = [
  {
    label: "Hello World",
    language: "javascript",
    description: "The classic starter",
    code: `// Hello World
console.log("Hello, World!");
console.log("Welcome to the Code Playground!");
`,
  },
  {
    label: "Two Sum",
    language: "javascript",
    description: "Hash map O(n) — interview classic",
    code: `// Two Sum — O(n) with hash map
function twoSum(nums, target) {
  const seen = new Map(); // value → index
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) return [seen.get(complement), i];
    seen.set(nums[i], i);
  }
  return [];
}

console.log(twoSum([2, 7, 11, 15], 9));  // [0, 1]
console.log(twoSum([3, 2, 4], 6));       // [1, 2]
console.log(twoSum([3, 3], 6));          // [0, 1]
`,
  },
  {
    label: "Two Sum (Java)",
    language: "java",
    description: "Hash map in Java — runs on server",
    code: `import java.util.*;

public class Main {
    public static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[]{seen.get(complement), i};
            }
            seen.put(nums[i], i);
        }
        return new int[]{};
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(twoSum(new int[]{2, 7, 11, 15}, 9)));
        System.out.println(Arrays.toString(twoSum(new int[]{3, 2, 4}, 6)));
        System.out.println(Arrays.toString(twoSum(new int[]{3, 3}, 6)));
    }
}
`,
  },
  {
    label: "Binary Search",
    language: "javascript",
    description: "O(log n) search algorithm",
    code: `// Binary Search — O(log n)
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1; // not found
}

const sorted = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21];
console.log("Array:", sorted.join(", "));
console.log("Search for 11 → index:", binarySearch(sorted, 11));
console.log("Search for 7  → index:", binarySearch(sorted, 7));
console.log("Search for 6  → index:", binarySearch(sorted, 6), "(not found)");
`,
  },
  {
    label: "Binary Search (Java)",
    language: "java",
    description: "Binary search in Java — runs on server",
    code: `public class Main {
    public static int binarySearch(int[] arr, int target) {
        int left = 0, right = arr.length - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (arr[mid] == target) return mid;
            if (arr[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }

    public static void main(String[] args) {
        int[] sorted = {1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21};
        System.out.println("Search for 11 → index: " + binarySearch(sorted, 11));
        System.out.println("Search for 7  → index: " + binarySearch(sorted, 7));
        System.out.println("Search for 6  → index: " + binarySearch(sorted, 6));
    }
}
`,
  },
  {
    label: "BFS / Graph",
    language: "javascript",
    description: "Breadth-first search with adjacency list",
    code: `// BFS — shortest path in unweighted graph
function bfs(graph, start, target) {
  const queue = [[start, [start]]];
  const visited = new Set([start]);

  while (queue.length > 0) {
    const [node, path] = queue.shift();
    if (node === target) return path;

    for (const neighbor of (graph[node] || [])) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, [...path, neighbor]]);
      }
    }
  }
  return null; // no path
}

const graph = {
  A: ["B", "C"],
  B: ["A", "D", "E"],
  C: ["A", "F"],
  D: ["B"],
  E: ["B", "F"],
  F: ["C", "E"],
};

console.log("A → F:", bfs(graph, "A", "F")?.join(" → "));
console.log("A → D:", bfs(graph, "A", "D")?.join(" → "));
console.log("D → C:", bfs(graph, "D", "C")?.join(" → "));
`,
  },
  {
    label: "BFS (Java)",
    language: "java",
    description: "BFS in Java — runs on server",
    code: `import java.util.*;

public class Main {
    public static List<String> bfs(Map<String, List<String>> graph, String start, String target) {
        Queue<List<String>> queue = new LinkedList<>();
        Set<String> visited = new HashSet<>();
        List<String> initial = new ArrayList<>();
        initial.add(start);
        queue.add(initial);
        visited.add(start);

        while (!queue.isEmpty()) {
            List<String> path = queue.poll();
            String node = path.get(path.size() - 1);
            if (node.equals(target)) return path;

            for (String neighbor : graph.getOrDefault(node, Collections.emptyList())) {
                if (!visited.contains(neighbor)) {
                    visited.add(neighbor);
                    List<String> newPath = new ArrayList<>(path);
                    newPath.add(neighbor);
                    queue.add(newPath);
                }
            }
        }
        return null;
    }

    public static void main(String[] args) {
        Map<String, List<String>> graph = new HashMap<>();
        graph.put("A", Arrays.asList("B", "C"));
        graph.put("B", Arrays.asList("A", "D", "E"));
        graph.put("C", Arrays.asList("A", "F"));
        graph.put("D", Arrays.asList("B"));
        graph.put("E", Arrays.asList("B", "F"));
        graph.put("F", Arrays.asList("C", "E"));

        System.out.println("A to F: " + bfs(graph, "A", "F"));
        System.out.println("A to D: " + bfs(graph, "A", "D"));
    }
}
`,
  },
  {
    label: "Merge Sort",
    language: "javascript",
    description: "O(n log n) divide & conquer",
    code: `// Merge Sort — O(n log n)
function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}

function merge(left, right) {
  const result = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) result.push(left[i++]);
    else result.push(right[j++]);
  }
  return [...result, ...left.slice(i), ...right.slice(j)];
}

const arr = [38, 27, 43, 3, 9, 82, 10];
console.log("Input: ", arr.join(", "));
console.log("Sorted:", mergeSort(arr).join(", "));
`,
  },
  {
    label: "Merge Sort (Java)",
    language: "java",
    description: "Merge sort in Java — runs on server",
    code: `import java.util.Arrays;

public class Main {
    public static void mergeSort(int[] arr, int left, int right) {
        if (left >= right) return;
        int mid = left + (right - left) / 2;
        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);
        merge(arr, left, mid, right);
    }

    static void merge(int[] arr, int left, int mid, int right) {
        int[] tmp = Arrays.copyOfRange(arr, left, right + 1);
        int i = 0, j = mid - left + 1, k = left;
        while (i <= mid - left && j < tmp.length) {
            if (tmp[i] <= tmp[j]) arr[k++] = tmp[i++];
            else arr[k++] = tmp[j++];
        }
        while (i <= mid - left) arr[k++] = tmp[i++];
        while (j < tmp.length) arr[k++] = tmp[j++];
    }

    public static void main(String[] args) {
        int[] arr = {38, 27, 43, 3, 9, 82, 10};
        System.out.println("Input:  " + Arrays.toString(arr));
        mergeSort(arr, 0, arr.length - 1);
        System.out.println("Sorted: " + Arrays.toString(arr));
    }
}
`,
  },
  {
    label: "Dynamic Programming",
    language: "javascript",
    description: "Climbing stairs & coin change",
    code: `// DP: Climbing Stairs (LC 70) — O(n)
function climbStairs(n) {
  if (n <= 2) return n;
  let prev2 = 1, prev1 = 2;
  for (let i = 3; i <= n; i++) {
    const cur = prev1 + prev2;
    prev2 = prev1;
    prev1 = cur;
  }
  return prev1;
}

// DP: Coin Change (LC 322) — O(n * amount)
function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (coin <= i) dp[i] = Math.min(dp[i], dp[i - coin] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}

console.log("Climb stairs (n=5):", climbStairs(5));  // 8
console.log("Climb stairs (n=10):", climbStairs(10)); // 89
console.log("Coin change [1,5,11] → 15:", coinChange([1, 5, 11], 15)); // 3
console.log("Coin change [2] → 3:", coinChange([2], 3)); // -1
`,
  },
  {
    label: "DP (Java)",
    language: "java",
    description: "Climbing stairs & coin change in Java",
    code: `import java.util.Arrays;

public class Main {
    public static int climbStairs(int n) {
        if (n <= 2) return n;
        int prev2 = 1, prev1 = 2;
        for (int i = 3; i <= n; i++) {
            int cur = prev1 + prev2;
            prev2 = prev1;
            prev1 = cur;
        }
        return prev1;
    }

    public static int coinChange(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, amount + 1);
        dp[0] = 0;
        for (int i = 1; i <= amount; i++) {
            for (int coin : coins) {
                if (coin <= i) dp[i] = Math.min(dp[i], dp[i - coin] + 1);
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }

    public static void main(String[] args) {
        System.out.println("Climb stairs (n=5):  " + climbStairs(5));
        System.out.println("Climb stairs (n=10): " + climbStairs(10));
        System.out.println("Coin change [1,5,11]→15: " + coinChange(new int[]{1, 5, 11}, 15));
        System.out.println("Coin change [2]→3: " + coinChange(new int[]{2}, 3));
    }
}
`,
  },
  {
    label: "Linked List",
    language: "javascript",
    description: "Reversal & cycle detection",
    code: `// Linked List — reversal + Floyd's cycle detection

class ListNode {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

function fromArray(arr) {
  const dummy = new ListNode(0);
  let cur = dummy;
  for (const v of arr) { cur.next = new ListNode(v); cur = cur.next; }
  return dummy.next;
}

function toArray(head) {
  const result = [];
  while (head) { result.push(head.val); head = head.next; }
  return result;
}

// O(n) reversal
function reverseList(head) {
  let prev = null, cur = head;
  while (cur) { const nxt = cur.next; cur.next = prev; prev = cur; cur = nxt; }
  return prev;
}

// Floyd's cycle detection
function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}

const list = fromArray([1, 2, 3, 4, 5]);
console.log("Original:", toArray(list).join(" → "));
console.log("Reversed:", toArray(reverseList(list)).join(" → "));
console.log("Has cycle:", hasCycle(fromArray([1, 2, 3]))); // false
`,
  },
  {
    label: "Bubble Sort",
    language: "javascript",
    description: "Sorting visualised step-by-step",
    code: `// Bubble Sort with step tracing
function bubbleSort(arr) {
  const a = [...arr];
  const n = a.length;
  let swaps = 0;

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swaps++;
      }
    }
  }
  return { sorted: a, swaps };
}

const input = [64, 34, 25, 12, 22, 11, 90];
console.log("Input:  ", input.join(", "));

const { sorted, swaps } = bubbleSort(input);
console.log("Sorted: ", sorted.join(", "));
console.log("Swaps:  ", swaps);
console.log("Time complexity: O(n²)");
`,
  },
  {
    label: "Python: Two Sum",
    language: "python",
    description: "Hash map in Python — runs on server",
    code: `# Two Sum — O(n) hash map approach
def two_sum(nums, target):
    seen = {}  # value -> index
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

print(two_sum([2, 7, 11, 15], 9))  # [0, 1]
print(two_sum([3, 2, 4], 6))       # [1, 2]
print(two_sum([3, 3], 6))          # [0, 1]
`,
  },
  {
    label: "Python: Binary Search",
    language: "python",
    description: "Binary search in Python — runs on server",
    code: `# Binary Search — O(log n)
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

sorted_arr = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21]
print(f"Search 11 → index {binary_search(sorted_arr, 11)}")
print(f"Search 7  → index {binary_search(sorted_arr, 7)}")
print(f"Search 6  → index {binary_search(sorted_arr, 6)} (not found)")
`,
  },
  {
    label: "Closures & Currying",
    language: "javascript",
    description: "Functional programming patterns",
    code: `// Closures and Currying in JavaScript

// Closure: counter factory
function makeCounter(start = 0) {
  let count = start;
  return {
    increment: () => ++count,
    decrement: () => --count,
    value: () => count,
    reset: () => { count = start; },
  };
}

const counter = makeCounter(10);
console.log("Start:", counter.value());
counter.increment();
counter.increment();
counter.increment();
console.log("After 3 increments:", counter.value());

// Currying: transform f(a, b, c) → f(a)(b)(c)
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn(...args);
    return (...more) => curried(...args, ...more);
  };
}

const add = curry((a, b, c) => a + b + c);
console.log("\\nCurried add(1)(2)(3):", add(1)(2)(3));
console.log("Curried add(1, 2)(3):", add(1, 2)(3));
console.log("Curried add(1)(2, 3):", add(1)(2, 3));
`,
  },
  {
    label: "TypeScript Types",
    language: "typescript",
    description: "Generics and utility types",
    code: `// TypeScript — Generics & Utility Types

// Generic stack
class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  get size(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

const numStack = new Stack<number>();
numStack.push(1);
numStack.push(2);
numStack.push(3);
console.log("Stack size:", numStack.size);
console.log("Peek:", numStack.peek());
console.log("Pop:", numStack.pop());
console.log("Size after pop:", numStack.size);

// Utility types
interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "student" | "teacher";
}

type PartialUser = Partial<User>;
type ReadonlyUser = Readonly<User>;
type UserPreview = Pick<User, "id" | "name">;
type UserWithoutEmail = Omit<User, "email">;

const preview: UserPreview = { id: 1, name: "Ada Lovelace" };
console.log("\\nUser preview:", JSON.stringify(preview));
`,
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PlaygroundPage() {
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [key, setKey] = useState(0); // force re-mount on template change

  const { isPremium, premiumUntil } = useStore();
  const isActivePro = isPremium && premiumUntil && new Date(premiumUntil) > new Date();

  const template = TEMPLATES[selectedTemplate];

  function handleTemplateSelect(idx: number) {
    const lang = TEMPLATES[idx].language;
    if (!isActivePro && !FREE_LANGUAGES.includes(lang)) {
      toast("Upgrade to Pro for Java, C, C++, and TypeScript compilation.");
      return;
    }
    setSelectedTemplate(idx);
    setKey((k) => k + 1); // re-mount editor with fresh state
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Code2 className="size-5 text-saffron" />
          <h1 className="font-heading text-2xl font-bold">Code Playground</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-xl">
          Write and run JavaScript, TypeScript, Python, or Java. JS/TS run in-browser; Python runs via Wandbox API; Java shows local run instructions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4 items-start">
        {/* ── Template sidebar ──────────────────────────────────────────── */}
        <div className="space-y-1 lg:sticky lg:top-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-2 flex items-center gap-1.5">
            <Lightbulb className="size-3" />
            Templates
          </p>
          {TEMPLATES.map((t, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleTemplateSelect(i)}
              className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors group ${
                selectedTemplate === i
                  ? "bg-saffron/10 border border-saffron/30 text-foreground"
                  : "text-muted-foreground hover:bg-surface-hover hover:text-foreground border border-transparent"
              }`}
            >
              <div className="text-sm font-medium flex items-center gap-1.5">
                {t.label}
                {!isActivePro && !FREE_LANGUAGES.includes(t.language) && (
                  <Lock className="size-3 text-muted-foreground/60" />
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{t.description}</div>
              <div className={`text-[10px] mt-1 font-mono rounded px-1 py-0.5 inline-block ${
                t.language === "typescript"
                  ? "bg-sky-500/10 text-sky-400"
                  : t.language === "python"
                  ? "bg-blue-500/10 text-blue-400"
                  : t.language === "java"
                  ? "bg-orange-500/10 text-orange-400"
                  : "bg-yellow-500/10 text-yellow-400"
              }`}>
                {t.language}
              </div>
            </button>
          ))}
        </div>

        {/* ── Editor ────────────────────────────────────────────────────── */}
        <CodePlayground
          key={key}
          defaultCode={template.code}
          language={template.language}
          height={480}
          title={template.label}
          className="shadow-lg"
          onLanguageGate={(lang) => {
            if (!isActivePro && !FREE_LANGUAGES.includes(lang)) {
              toast("Upgrade to Pro for Java, C, C++, and TypeScript compilation.");
              return false;
            }
            return true;
          }}
        />
      </div>

      {/* ── Tips ──────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tips</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• <strong className="text-foreground">JS/TS</strong>: run instantly in-browser via <code className="text-saffron bg-muted px-1 rounded">console.log()</code> — no server needed</li>
          <li>• <strong className="text-foreground">Python</strong>: runs via Wandbox API (free, no key) — requires internet, may take 2–5 seconds</li>
          <li>• <strong className="text-foreground">Java</strong>: no free cloud compiler available — click Run for local run instructions (<code className="text-saffron bg-muted px-1 rounded">javac</code>)</li>
          <li>• For Java: wrap your code in a <code className="text-saffron bg-muted px-1 rounded">public class Main</code> with a <code className="text-saffron bg-muted px-1 rounded">main</code> method</li>
          <li>• Scripts time out after 5 seconds to prevent infinite loops</li>
          <li>• TypeScript type annotations are stripped before in-browser execution</li>
        </ul>
      </div>
    </div>
  );
}
