"use client";

import { useState } from "react";
import { CodePlayground, type PlaygroundLanguage } from "@/components/code-playground";
import { Code2, Lightbulb } from "lucide-react";

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
    label: "Fibonacci",
    language: "javascript",
    description: "Classic recursion vs. iteration",
    code: `// Fibonacci — recursive vs iterative
function fibRecursive(n) {
  if (n <= 1) return n;
  return fibRecursive(n - 1) + fibRecursive(n - 2);
}

function fibIterative(n) {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

console.log("Fibonacci (recursive, n=10):", fibRecursive(10));
console.log("Fibonacci (iterative, n=10):", fibIterative(10));

// First 10 Fibonacci numbers
const seq = Array.from({ length: 10 }, (_, i) => fibIterative(i));
console.log("Sequence:", seq.join(", "));
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
    label: "Promises & Async",
    language: "javascript",
    description: "Asynchronous JavaScript patterns",
    code: `// Promises and async/await patterns

// Simulate an async API call
function fetchUser(id) {
  return new Promise((resolve, reject) => {
    // Synchronous simulation (Playground runs sync)
    if (id > 0) {
      resolve({ id, name: \`User_\${id}\`, score: id * 42 });
    } else {
      reject(new Error("Invalid user id"));
    }
  });
}

// Promise chaining
fetchUser(3)
  .then(user => {
    console.log("Fetched:", JSON.stringify(user));
    return { ...user, rank: Math.ceil(user.score / 10) };
  })
  .then(enriched => {
    console.log("Enriched:", JSON.stringify(enriched));
  })
  .catch(err => {
    console.log("Error:", err.message);
  });

// Promise.all — parallel fetches
Promise.all([fetchUser(1), fetchUser(2), fetchUser(3)])
  .then(users => {
    console.log("\\nAll users:");
    users.forEach(u => console.log(\` • \${u.name} (score: \${u.score})\`));
  });
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

  const template = TEMPLATES[selectedTemplate];

  function handleTemplateSelect(idx: number) {
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
          Write and run JavaScript or TypeScript right in your browser. No setup needed.
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
              <div className="text-sm font-medium">{t.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t.description}</div>
              <div className={`text-[10px] mt-1 font-mono rounded px-1 py-0.5 inline-block ${
                t.language === "typescript"
                  ? "bg-blue-500/10 text-blue-400"
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
        />
      </div>

      {/* ── Tips ──────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tips</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Use <code className="text-saffron bg-muted px-1 rounded">console.log()</code> to print output</li>
          <li>• Execution is sandboxed — no network access or file system</li>
          <li>• Scripts time out after 5 seconds to prevent infinite loops</li>
          <li>• TypeScript type annotations are stripped before execution</li>
          <li>• Python execution is coming soon — stay tuned!</li>
        </ul>
      </div>
    </div>
  );
}
