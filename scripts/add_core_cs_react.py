#!/usr/bin/env python3
"""Add content to React sessions (topic index 2)."""
import json

PATH = "/Users/racit/PersonalProject/guru-sishya/public/content/core-cs.json"

with open(PATH) as f:
    data = json.load(f)

idx = next(i for i, d in enumerate(data) if d["id"] == "react")
sessions = data[idx]["plan"]["sessions"]

CONTENT = {
1: """## React Mental Model: Components, JSX, and the Virtual DOM

React's fundamental insight: UI is a function of state. Given the same state, the UI should look the same every time. This functional model makes UI predictable and testable.

### UI = f(state)

```jsx
// React's core idea in one line:
// UI = f(state)
// React re-runs f whenever state changes and updates the DOM efficiently

function Counter({ initialCount = 0 }) {
  const [count, setCount] = useState(initialCount);
  // This function runs every time count changes
  // React figures out what DOM changes are needed
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>+</button>
      <button onClick={() => setCount(c => c - 1)}>-</button>
    </div>
  );
}
```

### JSX is Just JavaScript

JSX is syntactic sugar that compiles to `React.createElement()` calls:

```jsx
// What you write:
const element = (
  <button className="btn" onClick={handleClick}>
    Click me
  </button>
);

// What Babel compiles it to:
const element = React.createElement(
  'button',
  { className: 'btn', onClick: handleClick },
  'Click me'
);

// With React 17+ new JSX transform (no React import needed):
import { jsx as _jsx } from 'react/jsx-runtime';
const element = _jsx('button', {
  className: 'btn',
  onClick: handleClick,
  children: 'Click me'
});
```

### The Virtual DOM

React maintains a lightweight JavaScript representation of the DOM (the "virtual DOM"). When state changes:

1. React calls your component function to get the new virtual DOM tree
2. React **diffs** the new tree against the previous tree (reconciliation)
3. React computes the minimal set of real DOM operations needed
4. React **commits** those changes to the actual DOM

```
State change
     ↓
Component re-renders (new VDOM tree)
     ↓
Diff old VDOM vs new VDOM
     ↓
Apply minimal DOM mutations
     ↓
Browser paints
```

### Why the Virtual DOM?

Direct DOM manipulation is expensive. `document.querySelector` triggers layout calculations; `element.innerHTML` causes full re-parses. React batches all changes and applies them in one pass, minimizing browser reflows.

```jsx
// Without React: you manually manage DOM updates
document.getElementById('count').textContent = count; // manual, error-prone

// With React: just describe what you want
<p>Count: {count}</p>
// React figures out what changed and updates only that text node
```

### Reconciliation and Keys

React uses keys to efficiently reconcile lists:

```jsx
// BAD: using index as key (breaks reconciliation on reorder/insert)
{items.map((item, i) => <Item key={i} item={item} />)}

// GOOD: use stable unique IDs
{items.map(item => <Item key={item.id} item={item} />)}

// Why keys matter:
// When you insert at the start of a list with index keys:
// [A(0), B(1), C(2)] → [NEW(0), A(1), B(2), C(3)]
// React sees: item at index 0 changed (was A, now NEW) → re-renders A, B, C
// With stable IDs: React sees NEW was added, A/B/C are unchanged → only creates NEW
```

### Component Types

```jsx
// Function component (modern standard)
function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>;
}

// Class component (legacy — still used in some codebases)
class Greeting extends React.Component<{ name: string }> {
  render() {
    return <h1>Hello, {this.props.name}!</h1>;
  }
}

// The key difference: class components have render() and lifecycle methods,
// function components use hooks. Prefer function components for new code.
```

### Interview Q&A

**Q: What is the virtual DOM and why does React use it?**
A: The virtual DOM is a lightweight JavaScript object tree that mirrors the real DOM structure. When state changes, React creates a new VDOM tree, diffs it against the previous one (O(n) with React's heuristics), and applies only the minimal set of changes to the real DOM. This batching of DOM operations is more efficient than directly manipulating the DOM on each state change, which would cause excessive reflows and repaints.

**Q: What is reconciliation?**
A: Reconciliation is React's algorithm for determining what changed between VDOM renders and how to efficiently update the real DOM. React uses two heuristics: (1) elements of different types produce completely different trees (no attempt to reuse); (2) `key` props help identify which items in a list changed, were added, or were removed, enabling efficient list updates.

**Q: Why shouldn't you use array index as a React key?**
A: When items are reordered, filtered, or prepended, index-based keys cause React to incorrectly match elements. React will re-render and re-create components unnecessarily because the key changed, even though the data is the same — just in a different position. Use stable, unique identifiers (database IDs, UUIDs) as keys.

### Common Mistakes

```jsx
// Mistake: mutating state directly
const [items, setItems] = useState([1, 2, 3]);
items.push(4); // WRONG — doesn't trigger re-render!
setItems([...items, 4]); // CORRECT — new array reference

// Mistake: missing key prop in lists (React warning + perf issue)
{items.map(item => <div>{item.name}</div>)} // Warning: missing key
{items.map(item => <div key={item.id}>{item.name}</div>)} // Correct

// Mistake: treating JSX as HTML
<div class="container"> // Wrong — HTML attribute
<div className="container"> // Correct — JSX uses camelCase JS property names
```
""",

2: """## useState, useReducer, and State Patterns

State management is the heart of React. Understanding when to use `useState` vs `useReducer`, and how state updates work, prevents the majority of React bugs.

### useState Deep Dive

```jsx
// State update is asynchronous and batched
function Counter() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    // Stale closure bug:
    setCount(count + 1); // reads count from this render (e.g., 0)
    setCount(count + 1); // reads count from this render (still 0!)
    // Result: count goes to 1, not 2!

    // Fix: functional update — always gets the latest state
    setCount(c => c + 1);
    setCount(c => c + 1);
    // Result: count goes to 2 ✓
  };

  return <button onClick={handleClick}>Count: {count}</button>;
}

// State is replaced, not merged (unlike class component setState)
const [user, setUser] = useState({ name: 'Alice', age: 30 });
setUser({ name: 'Bob' }); // age is LOST! state = { name: 'Bob' }
setUser(u => ({ ...u, name: 'Bob' })); // correct: { name: 'Bob', age: 30 }
```

### When to Use Functional Updates

```jsx
// Use functional update whenever new state depends on previous state
const [items, setItems] = useState([]);

const addItem = (item) => setItems(prev => [...prev, item]);
const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));
const updateItem = (id, patch) => setItems(prev =>
  prev.map(i => i.id === id ? { ...i, ...patch } : i)
);
```

### useState vs useReducer

Use `useReducer` when:
- State has multiple sub-values that change together
- Next state depends on complex logic involving previous state
- State transitions have named actions (better debugging)
- Multiple components need to trigger the same state updates

```jsx
// useState: simple counters, toggles, form fields
const [isOpen, setIsOpen] = useState(false);
const toggle = () => setIsOpen(o => !o);

// useReducer: complex state with related fields
type CartState = {
  items: CartItem[];
  total: number;
  discount: number;
  couponCode: string | null;
};

type CartAction =
  | { type: 'ADD_ITEM'; item: CartItem }
  | { type: 'REMOVE_ITEM'; itemId: string }
  | { type: 'APPLY_COUPON'; code: string; discount: number }
  | { type: 'CLEAR' };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const items = [...state.items, action.item];
      return { ...state, items, total: calculateTotal(items, state.discount) };
    }
    case 'REMOVE_ITEM': {
      const items = state.items.filter(i => i.id !== action.itemId);
      return { ...state, items, total: calculateTotal(items, state.discount) };
    }
    case 'APPLY_COUPON':
      return { ...state, discount: action.discount, couponCode: action.code,
               total: calculateTotal(state.items, action.discount) };
    case 'CLEAR':
      return { items: [], total: 0, discount: 0, couponCode: null };
  }
}

function Cart() {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [], total: 0, discount: 0, couponCode: null
  });

  return (
    <div>
      <p>Total: ${state.total}</p>
      <button onClick={() => dispatch({ type: 'CLEAR' })}>Clear Cart</button>
    </div>
  );
}
```

### State Lifting and Colocation

```jsx
// State should live at the lowest common ancestor of components that need it
// This is called "lifting state up"

// Before lifting: state duplicated or out of sync
function Parent() {
  return (
    <>
      <ChildA /> {/* has its own selectedId state */}
      <ChildB /> {/* needs selectedId from ChildA — can't access it! */}
    </>
  );
}

// After lifting:
function Parent() {
  const [selectedId, setSelectedId] = useState(null);
  return (
    <>
      <ChildA selectedId={selectedId} onSelect={setSelectedId} />
      <ChildB selectedId={selectedId} />
    </>
  );
}

// Colocate state: keep state as close to where it's used as possible
// Don't lift if only one component needs it
```

### Interview Q&A

**Q: What is the stale closure problem in React?**
A: When a callback closes over a state value from a previous render, it captures a stale snapshot. Since `useState` is asynchronous, multiple `setState(count + 1)` calls in the same handler all read the same stale `count`. Fix: use functional updates `setState(prev => prev + 1)` which always receive the current state, not a closure value.

**Q: When should you use `useReducer` instead of `useState`?**
A: When state transitions are complex, when multiple state fields change together atomically, when the next state depends on the previous state in non-trivial ways, or when you want to centralize update logic and make state transitions testable. `useReducer` also makes it easier to pass `dispatch` as a stable reference (it never changes) vs passing setter functions.

**Q: What happens when you call `setState` multiple times in the same event handler?**
A: React 18 batches all state updates in event handlers and flushes them together (one re-render). Before React 18, batching only applied to React synthetic events. With functional updates, each call correctly uses the result of the previous update. With value updates (`setState(count + 1)`), all calls read the same stale value.

### Common Mistakes

```jsx
// Mistake: storing derived state (leads to inconsistency)
const [items, setItems] = useState([]);
const [count, setCount] = useState(0); // redundant — always items.length

// Fix: compute derived values during render
const [items, setItems] = useState([]);
const count = items.length; // always in sync

// Mistake: initializing state from props without understanding the implications
function Child({ initialValue }) {
  const [value, setValue] = useState(initialValue); // only uses prop ONCE
  // Later changes to initialValue prop are IGNORED!
}
// If you need to react to prop changes, use useEffect or controlled component pattern
```
""",

3: """## useEffect and the Synchronization Model

`useEffect` is for **synchronizing** your component with external systems (APIs, subscriptions, DOM, timers). The mental model: "After render, if these values changed, run this side effect."

### The Synchronization Mental Model

```jsx
// Wrong mental model: "run code after mount / on update"
// Right mental model: "synchronize component with external system"

function ChatRoom({ roomId }) {
  useEffect(() => {
    // Synchronize: connect to roomId's chat room
    const connection = createChatConnection(roomId);
    connection.connect();

    // Cleanup: disconnect when roomId changes or component unmounts
    return () => connection.disconnect();
  }, [roomId]); // re-run when roomId changes
}
// When roomId changes: disconnect old room, connect new room — automatically
```

### Dependency Array Rules

```jsx
// No dependency array: runs after EVERY render (use sparingly)
useEffect(() => { document.title = `Count: ${count}`; });

// Empty array []: runs once after mount, cleanup on unmount
useEffect(() => {
  const subscription = api.subscribe(handler);
  return () => api.unsubscribe(subscription);
}, []);

// With dependencies: runs when any dependency changes
useEffect(() => {
  fetchUser(userId).then(setUser);
}, [userId]); // re-fetches when userId changes

// THE RULE: include every reactive value used inside the effect
// If you lint with eslint-plugin-react-hooks, it enforces this
```

### Data Fetching Pattern

```jsx
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false; // prevent state updates after unmount/userId change

    setLoading(true);
    setError(null);

    fetchUser(userId)
      .then(data => {
        if (!cancelled) {
          setUser(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => { cancelled = true; }; // cleanup: ignore stale responses
  }, [userId]);

  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  if (!user) return null;
  return <Profile user={user} />;
}

// Modern alternative: use a data-fetching library (React Query, SWR)
// They handle loading, error, caching, deduplication, refetching automatically:
import { useQuery } from '@tanstack/react-query';
function UserProfile({ userId }) {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });
  // ...
}
```

### Common useEffect Patterns

```jsx
// Timer / interval
function Countdown({ seconds }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => {
      setRemaining(r => r - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [remaining]); // note: could also restructure with setTimeout

  return <p>{remaining}s remaining</p>;
}

// Event listeners
function WindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // no deps — window never changes

  return <p>{size.width} × {size.height}</p>;
}

// Synchronizing with third-party library
function Map({ center, zoom }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  // Initialize map once
  useEffect(() => {
    mapRef.current = new ThirdPartyMap(containerRef.current);
    return () => mapRef.current.destroy();
  }, []);

  // Sync center and zoom
  useEffect(() => {
    mapRef.current?.setCenter(center);
    mapRef.current?.setZoom(zoom);
  }, [center, zoom]);

  return <div ref={containerRef} style={{ height: 400 }} />;
}
```

### React 18 Strict Mode Double-Invocation

```jsx
// In development with Strict Mode, React mounts, unmounts, and re-mounts
// every component to detect side effects that don't clean up properly.
// Your effects MUST be idempotent and properly cleaned up.

useEffect(() => {
  // This runs twice in dev! Must clean up properly.
  const ws = new WebSocket('ws://...');
  ws.onmessage = handleMessage;
  return () => ws.close(); // cleanup: close on unmount/re-run
}, []);
```

### Interview Q&A

**Q: What is the dependency array in `useEffect` and what happens if you omit values from it?**
A: The dependency array tells React when to re-run the effect. If you omit a value that the effect uses, the effect will read a stale version of that value (from the render it was created in) and won't re-run when that value changes. The eslint-plugin-react-hooks linter enforces exhaustive dependencies.

**Q: How do you prevent race conditions when fetching data in useEffect?**
A: Use a cleanup boolean: `let cancelled = false`. In the async callback, check `if (!cancelled)` before updating state. The cleanup function sets `cancelled = true`. This ensures that if the component unmounts or the userId changes before the request completes, the stale response doesn't update state. Modern libraries (React Query, SWR) handle this automatically.

**Q: When should you NOT use useEffect?**
A: Don't use useEffect for: (1) transforming data for rendering — compute it during render instead. (2) Handling user events — use event handlers. (3) Fetching data on button click — use event handlers with async functions. useEffect is specifically for synchronizing with external systems that React doesn't control.

### Common Mistakes

```jsx
// Mistake: infinite loop — object in dependency array
function Component({ config }) {
  useEffect(() => {
    doSomething(config);
  }, [config]); // if config is a new object each render, this loops forever!
}
// Fix: depend on primitive values, or use useMemo to stabilize the reference

// Mistake: async directly in useEffect
useEffect(async () => { // Warning! useEffect callback must not be async
  const data = await fetchData();
  setData(data);
}, []);
// Fix:
useEffect(() => {
  const run = async () => {
    const data = await fetchData();
    setData(data);
  };
  run();
}, []);
```
""",

4: """## Performance: memo, useMemo, useCallback

React re-renders a component every time its state or props change. Sometimes this is excessive. These three tools help optimize renders — but they should be applied after profiling, not preemptively.

### When React Re-renders

```jsx
function Parent() {
  const [count, setCount] = useState(0);
  return (
    <>
      <Child name="Alice" /> {/* re-renders every time Parent re-renders! */}
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </>
  );
}

function Child({ name }) {
  console.log('Child rendered');
  return <p>Hello, {name}</p>;
}
// Even though name never changes, Child re-renders when count changes
```

### React.memo

Wraps a component to skip re-rendering if props haven't changed (shallow comparison):

```jsx
const Child = React.memo(function Child({ name, onClick }) {
  console.log('Child rendered');
  return <button onClick={onClick}>Hello, {name}</button>;
});

// Now Child only re-renders if name or onClick changes by reference
// BUT: if onClick is `() => doSomething()` defined in Parent, it's a new function every render!
// → Child still re-renders because onClick is a new reference each time

// Fix: stabilize onClick with useCallback
function Parent() {
  const [count, setCount] = useState(0);
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []); // stable reference — never re-created

  return (
    <>
      <Child name="Alice" onClick={handleClick} />
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </>
  );
}
```

### useCallback

Memoizes a function — returns the same function reference between renders (unless deps change):

```jsx
// Without useCallback: new function reference every render
function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  // NEW function reference every render — breaks memo on ResultList
  const handleSelect = (item) => {
    setResults(prev => [...prev, item]);
  };

  return <ResultList items={results} onSelect={handleSelect} />;
}

// With useCallback: stable reference
function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSelect = useCallback((item) => {
    setResults(prev => [...prev, item]); // functional update: no dep on results
  }, []); // [] because we use functional update — no external deps

  return <ResultList items={results} onSelect={handleSelect} />;
}
```

### useMemo

Memoizes a computed value — only recomputes when deps change:

```jsx
function ProductList({ products, category, sortBy }) {
  // Without useMemo: this runs on every render (even for unrelated state changes)
  const filtered = products
    .filter(p => p.category === category)
    .sort((a, b) => a[sortBy] - b[sortBy]);

  // With useMemo: only recomputes when products, category, or sortBy changes
  const filtered = useMemo(() =>
    products
      .filter(p => p.category === category)
      .sort((a, b) => a[sortBy] - b[sortBy]),
    [products, category, sortBy]
  );

  return <ul>{filtered.map(p => <ProductItem key={p.id} product={p} />)}</ul>;
}
```

### The Performance Optimization Rules

```
1. Measure first. Use React DevTools Profiler to find actual bottlenecks.
2. memo is only useful if:
   - The component re-renders frequently
   - With the same props (so memo would actually skip renders)
   - The component's render is expensive (non-trivial work)
3. useMemo is only useful if:
   - The computation is genuinely expensive (10,000+ item sorts)
   - The result is used as a dependency elsewhere (to stabilize references)
4. useCallback is only useful if:
   - The function is passed to a memo'd child
   - The function is a useEffect dependency

DON'T wrap everything in useMemo/useCallback — it:
- Adds overhead (React must compare deps on every render)
- Makes code harder to read
- Often provides no benefit for cheap operations
```

### Real-World Example: Virtualized List

For very large lists (10,000+ items), even rendering is too expensive:

```jsx
import { FixedSizeList } from 'react-window';

function VirtualList({ items }) {
  const Row = useCallback(({ index, style }) => (
    <div style={style}>
      <ProductItem product={items[index]} />
    </div>
  ), [items]);

  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
  // Only renders the ~8 visible rows, not all 10,000
}
```

### Interview Q&A

**Q: What is the difference between `useMemo` and `useCallback`?**
A: `useMemo` memoizes a **value** — it takes a factory function and returns the cached result. `useCallback` memoizes a **function** — it takes a function and returns the same function reference. `useCallback(fn, deps)` is equivalent to `useMemo(() => fn, deps)`.

**Q: When does `React.memo` actually help?**
A: When a component (1) re-renders often, (2) receives props that frequently stay the same, and (3) has non-trivial render work. If all three aren't true, `React.memo` adds overhead without benefit. Most importantly, `memo` only does shallow comparison — object/function props are new references every render unless stabilized with `useMemo`/`useCallback`.

**Q: What is the purpose of the dependency array in `useMemo` and `useCallback`?**
A: It tells React when to recompute the memoized value or recreate the function. React uses `Object.is` (reference equality) to compare deps. If no deps changed, the cached value/function is returned. If any dep changed, the computation runs again. Missing deps → stale values; extra deps → unnecessary recomputes.

### Common Mistakes

```jsx
// Mistake: useMemo on cheap computations
const doubled = useMemo(() => count * 2, [count]); // wasteful! just write count * 2

// Mistake: useCallback with deps that include the callback itself
const fn = useCallback(() => {
  otherCallback(); // if otherCallback isn't stable, fn recreates every render anyway!
}, [otherCallback]); // must also memoize otherCallback

// Mistake: inline object in memo'd component's props
const MemoChild = React.memo(Child);
<MemoChild style={{ color: 'red' }} /> // new object every render → memo is useless!
// Fix:
const style = useMemo(() => ({ color: 'red' }), []);
<MemoChild style={style} />
```
""",

5: """## Custom Hooks

Custom hooks extract stateful logic into reusable functions. They are the primary code reuse mechanism in modern React.

### The Rules of Hooks

Custom hooks follow the same rules as built-in hooks:
1. Only call hooks at the top level (not inside conditionals, loops, or nested functions)
2. Only call hooks from React function components or custom hooks
3. Custom hook names must start with `use`

### Building Custom Hooks

```jsx
// useFetch: encapsulates data fetching with loading/error states
function useFetch(url) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, loading: true, error: null });

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => { if (!cancelled) setState({ data, loading: false, error: null }); })
      .catch(error => { if (!cancelled) setState({ data: null, loading: false, error }); });

    return () => { cancelled = true; };
  }, [url]);

  return state;
}

// Usage:
function UserProfile({ userId }) {
  const { data: user, loading, error } = useFetch(`/api/users/${userId}`);
  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  return <Profile user={user} />;
}
```

### Real-World Custom Hooks

```jsx
// useLocalStorage: sync state with localStorage
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setStoredValue = useCallback((newValue) => {
    try {
      const valueToStore = typeof newValue === 'function' ? newValue(value) : newValue;
      setValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (err) {
      console.error('useLocalStorage error:', err);
    }
  }, [key, value]);

  return [value, setStoredValue];
}

// useDebounce: debounce a value
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// useDebounce in a search component:
function Search() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const { data: results } = useFetch(
    debouncedQuery ? `/api/search?q=${debouncedQuery}` : null
  );

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <Results items={results} />
    </>
  );
}

// useIntersectionObserver: detect when element enters viewport
function useIntersectionObserver(ref, options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      options
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, options.threshold, options.rootMargin]);

  return isIntersecting;
}

// Lazy image loading:
function LazyImage({ src, alt }) {
  const ref = useRef(null);
  const isVisible = useIntersectionObserver(ref, { threshold: 0.1 });

  return (
    <div ref={ref}>
      {isVisible ? <img src={src} alt={alt} /> : <Placeholder />}
    </div>
  );
}

// usePrevious: access previous render's value
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => { ref.current = value; });
  return ref.current; // previous value (before this render's useEffect)
}
```

### Testing Custom Hooks

```jsx
// Use @testing-library/react's renderHook
import { renderHook, act } from '@testing-library/react';

test('useDebounce delays value update', async () => {
  jest.useFakeTimers();
  const { result, rerender } = renderHook(
    ({ value }) => useDebounce(value, 300),
    { initialProps: { value: 'initial' } }
  );

  expect(result.current).toBe('initial');

  rerender({ value: 'updated' });
  expect(result.current).toBe('initial'); // not yet updated

  act(() => jest.advanceTimersByTime(300));
  expect(result.current).toBe('updated'); // now updated
});
```

### Interview Q&A

**Q: What is a custom hook and how does it differ from a utility function?**
A: A custom hook is a JavaScript function that uses React hooks internally. It can manage state, run effects, access context, and use refs — all things utility functions cannot do. The `use` prefix convention lets React's linter enforce the rules of hooks within them. A utility function is a pure function with no React-specific behavior.

**Q: How do you share state between components using custom hooks?**
A: Custom hooks don't share state by default — each component calling the hook gets its own isolated state. To share state across components, you need to lift state up to a common ancestor, use Context, or use a global state manager (Zustand, Redux). Custom hooks are for sharing stateful *logic*, not state itself.

**Q: What are the rules of hooks and why do they exist?**
A: (1) Call hooks only at the top level — not inside conditionals, loops, or nested functions. (2) Call hooks only from function components or custom hooks. These rules exist because React relies on the *order* of hook calls to correctly match state to the right hook across renders. If order changes (due to conditionals), React would assign state to the wrong hook.

### Common Mistakes

```jsx
// Mistake: conditional hook call
function Component({ isLoggedIn }) {
  if (isLoggedIn) {
    const user = useUser(); // Error! Violates rules of hooks
  }
  // Fix: call hooks unconditionally, use result conditionally
  const user = useUser();
  if (!isLoggedIn) return <Login />;
  return <Dashboard user={user} />;
}

// Mistake: not returning cleanup in hooks with subscriptions
function useWebSocket(url) {
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    const ws = new WebSocket(url);
    ws.onmessage = e => setMessages(m => [...m, e.data]);
    // Missing: return () => ws.close(); — memory leak!
  }, [url]);
  return messages;
}
```
""",

6: """## Context API and Global State

Context provides a way to pass data through the component tree without prop drilling. It's ideal for "ambient" data that many components need: theme, locale, authentication, feature flags.

### Context Basics

```jsx
// 1. Create context
const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} });

// 2. Provide it
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const toggleTheme = useCallback(() =>
    setTheme(t => t === 'light' ? 'dark' : 'light'), []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// 3. Consume it (anywhere in the tree)
function ThemedButton({ children }) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  return (
    <button
      className={`btn btn-${theme}`}
      onClick={toggleTheme}
    >
      {children}
    </button>
  );
}

// 4. Custom hook for safety and convenience
function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
```

### Context Performance: The Re-render Problem

```jsx
// Problem: all consumers re-render when context value changes
// Even if they only use one field from the context object

// Bad: single large context — all consumers re-render on any field change
const AppContext = createContext({
  user: null,
  theme: 'light',
  cart: [],
  notifications: [],
});

// Better: split contexts by update frequency
const UserContext = createContext(null);       // rarely changes
const ThemeContext = createContext('light');    // on theme toggle
const CartContext = createContext([]);          // on cart updates
const NotificationsContext = createContext([]); // frequent

// Each component only subscribes to what it needs
function Header() {
  const user = useContext(UserContext);          // only re-renders when user changes
  return <nav>Hello, {user?.name}</nav>;
}
```

### Context + useReducer Pattern (Poor Man's Redux)

```jsx
// State management pattern using only React built-ins
const StoreContext = createContext(null);
const DispatchContext = createContext(null);

function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(rootReducer, initialState);

  return (
    <StoreContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StoreContext.Provider>
  );
}

// Split: consumers of state and dispatch are separate
// dispatch never changes → components using only dispatch don't re-render on state changes
function useStore() { return useContext(StoreContext); }
function useDispatch() { return useContext(DispatchContext); }

// Component that reads state:
function CartBadge() {
  const { cart } = useStore(); // re-renders when state changes
  return <span>{cart.length}</span>;
}

// Component that only dispatches:
function AddToCartButton({ product }) {
  const dispatch = useDispatch(); // NEVER re-renders (dispatch is stable)
  return (
    <button onClick={() => dispatch({ type: 'ADD_TO_CART', product })}>
      Add to Cart
    </button>
  );
}
```

### When to Use Context vs External State Managers

```
Use Context when:
- Data is "ambient" (theme, locale, auth, feature flags)
- Changes are infrequent
- Component tree is moderate depth
- You want zero dependencies

Use Zustand/Jotai when:
- Many components read from the same store
- Fine-grained subscriptions needed (component updates only when its slice changes)
- Complex derived state
- Devtools / time-travel debugging important

Use Redux when:
- Very large teams / codebase
- Strong need for middleware (saga, thunk)
- Extensive DevTools are critical
- Already using it in the codebase
```

### Interview Q&A

**Q: What is prop drilling and how does Context solve it?**
A: Prop drilling is passing props through multiple component layers to reach a deeply nested component, even though intermediate components don't need the data. Context solves it by making data available to any component in the tree without threading it through each layer manually.

**Q: What is the performance concern with Context?**
A: Every consumer of a Context re-renders when the context value changes. If the value is a new object reference each render (even if fields are identical), all consumers re-render unnecessarily. Fix: memoize the context value with `useMemo`, split large contexts into smaller ones by update frequency.

**Q: When would you choose Zustand over React Context?**
A: When you need fine-grained subscriptions — with Context, all consumers re-render on any change. Zustand components only re-render when the specific slice they subscribe to changes. Also use Zustand for complex client state that doesn't belong in React's tree (no natural parent component), or when you need middleware patterns.

### Common Mistakes

```jsx
// Mistake: new object reference as context value on every render
function Provider({ children }) {
  const [user, setUser] = useState(null);
  return (
    // NEW object every render → all consumers re-render!
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}
// Fix: memoize
const value = useMemo(() => ({ user, setUser }), [user]);
<UserContext.Provider value={value}>{children}</UserContext.Provider>
```
""",

7: """## Component Patterns

Proven patterns for building flexible, reusable React components. These are what senior engineers look for in code reviews.

### Compound Components

Allow a parent component to communicate with child components implicitly via Context — users compose the API themselves:

```jsx
// Compound component: Tab system
const TabContext = createContext(null);

function Tabs({ defaultTab, children }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabContext.Provider>
  );
}

function TabList({ children }) {
  return <div role="tablist" className="tab-list">{children}</div>;
}

function Tab({ id, children }) {
  const { activeTab, setActiveTab } = useContext(TabContext);
  return (
    <button
      role="tab"
      aria-selected={activeTab === id}
      onClick={() => setActiveTab(id)}
      className={activeTab === id ? 'tab active' : 'tab'}
    >
      {children}
    </button>
  );
}

function TabPanel({ id, children }) {
  const { activeTab } = useContext(TabContext);
  if (activeTab !== id) return null;
  return <div role="tabpanel">{children}</div>;
}

// Attach sub-components
Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;

// Usage — clean, composable API:
<Tabs defaultTab="profile">
  <Tabs.List>
    <Tabs.Tab id="profile">Profile</Tabs.Tab>
    <Tabs.Tab id="settings">Settings</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel id="profile"><ProfileContent /></Tabs.Panel>
  <Tabs.Panel id="settings"><SettingsContent /></Tabs.Panel>
</Tabs>
```

### Render Props

Pass a function as a prop to share rendering logic:

```jsx
// Render prop: separates data/behavior from presentation
function DataFetcher({ url, render }) {
  const { data, loading, error } = useFetch(url);
  return render({ data, loading, error }); // caller controls rendering
}

// Usage:
<DataFetcher
  url="/api/users"
  render={({ data, loading }) =>
    loading ? <Spinner /> : <UserList users={data} />
  }
/>

// Modern equivalent: custom hook (usually preferred)
const { data, loading } = useFetch('/api/users');
```

### Controlled vs Uncontrolled Components

```jsx
// Controlled: React owns the state
function ControlledInput({ value, onChange }) {
  return <input value={value} onChange={e => onChange(e.target.value)} />;
}
// Parent fully controls the input's value at all times

// Uncontrolled: DOM owns the state, accessed via ref
function UncontrolledForm() {
  const nameRef = useRef();
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(nameRef.current.value);
  };
  return (
    <form onSubmit={handleSubmit}>
      <input ref={nameRef} defaultValue="" />
      <button type="submit">Submit</button>
    </form>
  );
}

// When to use uncontrolled:
// - File inputs (always uncontrolled)
// - Integration with non-React libraries
// - Large forms where performance is critical (no re-render on every keystroke)
```

### Higher-Order Components (HOCs)

```jsx
// HOC: a function that takes a component and returns an enhanced component
function withAuth(WrappedComponent) {
  return function AuthGuard(props) {
    const { user, loading } = useAuth();
    if (loading) return <Spinner />;
    if (!user) return <Redirect to="/login" />;
    return <WrappedComponent {...props} user={user} />;
  };
}

// Usage:
const ProtectedDashboard = withAuth(Dashboard);

// Modern alternative: custom hook (simpler, more flexible)
function Dashboard() {
  const { user } = useRequireAuth(); // throws if not logged in, redirects
  return <div>Welcome, {user.name}</div>;
}
```

### Interview Q&A

**Q: What is the compound component pattern and when would you use it?**
A: Compound components are a set of related components that work together, sharing implicit state via Context. The parent manages state; children consume it. This pattern is ideal for complex UI elements like modals, tabs, accordions, and menus — where the consumer wants to control the rendering structure (which parts are included, where they're placed) while the library manages the behavior.

**Q: What is the difference between controlled and uncontrolled components?**
A: In controlled components, React state is the single source of truth — every change flows through state and re-renders. In uncontrolled components, the DOM maintains its own state, and you use refs to read the value imperatively. Controlled components are more predictable and easier to validate; uncontrolled components are simpler for integrations with third-party libraries and can have better performance for large forms.

**Q: Why have HOCs largely been replaced by custom hooks?**
A: Hooks solve the same problems (code reuse, behavior injection) without the wrapper component nesting ("wrapper hell"), without naming conflicts from injected props, and with better TypeScript support. HOCs are still used in some cases (class components, some `connect`-style APIs), but custom hooks are the modern standard for function components.

### Common Mistakes

```jsx
// Mistake: HOC created inside render (new component type every render)
function Parent() {
  const Enhanced = withLogging(Child); // new component type each render!
  return <Enhanced />; // unmount + remount every render
}
// Fix: define HOC outside component
const Enhanced = withLogging(Child);
function Parent() { return <Enhanced />; }
```
""",

8: """## Error Handling, Suspense, and Code Splitting

Robust React applications handle errors gracefully and load code efficiently. These are production-critical features.

### Error Boundaries

```jsx
// Error boundaries must be class components (no hook equivalent yet)
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to error tracking service (Sentry, Datadog)
    errorTracker.captureException(error, {
      extra: { componentStack: info.componentStack }
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <DefaultErrorUI error={this.state.error} />;
    }
    return this.props.children;
  }
}

// Usage — wrap sections independently:
function App() {
  return (
    <ErrorBoundary fallback={<AppError />}>
      <Header />
      <ErrorBoundary fallback={<SidebarError />}>
        <Sidebar />
      </ErrorBoundary>
      <ErrorBoundary fallback={<ContentError />}>
        <MainContent />
      </ErrorBoundary>
    </ErrorBoundary>
  );
}
// If Sidebar throws, only Sidebar's error boundary triggers — Header and MainContent still work
```

### Suspense and Lazy Loading

```jsx
import { lazy, Suspense } from 'react';

// Code splitting: components loaded on demand
const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));
const AdminPanel = lazy(() => import('./AdminPanel'));

function App() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Suspense>
  );
}
// Each route's JS bundle is loaded only when first visited
// Initial bundle is much smaller → faster first load
```

### Suspense for Data Fetching

```jsx
// With React Query (Suspense mode):
function UserProfile({ userId }) {
  // Throws a promise if data isn't ready → Suspense catches it
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    suspense: true,
  });

  return <Profile user={user} />; // data is guaranteed here
}

// Wrap with Suspense:
function App() {
  return (
    <ErrorBoundary fallback={<Error />}>
      <Suspense fallback={<Skeleton />}>
        <UserProfile userId={1} />
      </Suspense>
    </ErrorBoundary>
  );
}
// Loading: shows Skeleton
// Error: ErrorBoundary catches, shows Error
// Success: shows UserProfile with data
```

### Interview Q&A

**Q: What is an error boundary and when does it NOT catch errors?**
A: An error boundary is a class component that catches JavaScript errors in its child tree and displays a fallback UI. It does NOT catch: (1) errors in event handlers (use try/catch there), (2) async errors (use `.catch()` or try/catch in async functions), (3) server-side rendering errors, (4) errors thrown in the boundary itself.

**Q: What is code splitting and how does React support it?**
A: Code splitting breaks your JavaScript bundle into smaller chunks that are loaded on demand. React supports it via `React.lazy(() => import('./Component'))` combined with `Suspense`. The component's code is only downloaded when it's first rendered. Combined with route-based splitting, this significantly reduces initial bundle size and Time To Interactive.

**Q: What does Suspense do?**
A: Suspense lets components "suspend" rendering while waiting for something (data, code, images). When a child suspends (by throwing a Promise), React renders the nearest Suspense boundary's fallback. When the Promise resolves, React retries rendering the suspended component. This enables declarative loading states without conditional loading checks in each component.

### Common Mistakes

```jsx
// Mistake: error boundary doesn't catch async errors
class Boundary extends React.Component {
  componentDidCatch(error) { /* called for render errors only */ }
}
function Child() {
  useEffect(() => {
    fetchData().catch(err => {
      throw err; // NOT caught by error boundary!
    });
  }, []);
}
// Fix: manage async errors in state
function Child() {
  const [error, setError] = useState(null);
  if (error) throw error; // re-throw in render → caught by boundary
  useEffect(() => {
    fetchData().catch(setError); // capture async error in state
  }, []);
}
```
""",

9: """## Next.js App Router and Server Components

Next.js App Router (introduced in Next.js 13) and React Server Components represent the current state of the art in React architecture.

### Server vs Client Components

```tsx
// app/page.tsx — Server Component by default
// Renders on the server. Can be async. No hooks. No browser APIs.
async function HomePage() {
  // Direct database call — no API needed!
  const posts = await db.query('SELECT * FROM posts ORDER BY created_at DESC LIMIT 10');

  return (
    <main>
      <h1>Latest Posts</h1>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </main>
  );
}

// 'use client' directive: opt into client-side rendering
'use client';
// app/components/LikeButton.tsx — Client Component
import { useState } from 'react';

function LikeButton({ postId, initialLikes }) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);

  const handleLike = async () => {
    setLiked(l => !l);
    setLikes(l => liked ? l - 1 : l + 1);
    await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
  };

  return (
    <button onClick={handleLike}>
      {liked ? '❤️' : '🤍'} {likes}
    </button>
  );
}
```

### App Router Conventions

```
app/
  layout.tsx           → persistent shell (nav, footer)
  page.tsx             → route segment page
  loading.tsx          → automatic Suspense fallback
  error.tsx            → error boundary for segment
  not-found.tsx        → 404 page
  api/
    users/
      route.ts         → API route handler
  dashboard/
    layout.tsx         → nested layout
    page.tsx           → /dashboard
    [id]/
      page.tsx         → /dashboard/:id
```

```tsx
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav><Navigation /></nav>
        <main>{children}</main>
        <footer><Footer /></footer>
      </body>
    </html>
  );
}

// app/dashboard/[id]/page.tsx
interface Props { params: { id: string }; searchParams: { tab?: string } }

export default async function DashboardPage({ params, searchParams }: Props) {
  const user = await fetchUser(params.id);
  if (!user) notFound(); // triggers not-found.tsx

  return <Dashboard user={user} activeTab={searchParams.tab ?? 'overview'} />;
}

// Metadata
export async function generateMetadata({ params }: Props) {
  const user = await fetchUser(params.id);
  return { title: `${user?.name}'s Dashboard` };
}
```

### Server Actions

```tsx
// Server-side mutations without API routes
'use server';
import { revalidatePath } from 'next/cache';

async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  await db.insert('posts', { title, content, userId: session.userId });
  revalidatePath('/posts'); // refresh posts page cache
}

// Usage in Client Component:
'use client';
function NewPostForm() {
  return (
    <form action={createPost}> {/* server action */}
      <input name="title" />
      <textarea name="content" />
      <button type="submit">Publish</button>
    </form>
  );
}
```

### Interview Q&A

**Q: What is the difference between a Server Component and a Client Component?**
A: Server Components render on the server only. They can be async, access databases directly, keep secrets server-side, and produce zero JavaScript in the client bundle. They cannot use hooks or browser APIs. Client Components (marked `'use client'`) render on the server for initial HTML and hydrate on the client. They can use hooks, event handlers, and browser APIs. Default is Server Component in the App Router.

**Q: What are Server Actions?**
A: Server Actions are async functions marked `'use server'` that run on the server and can be called from Client Components. They replace API routes for form submissions and mutations. They can directly access databases, perform auth checks, and call `revalidatePath`/`revalidateTag` to invalidate Next.js cache.

**Q: When would you choose Next.js over a plain React SPA?**
A: Next.js when: you need SEO (server-rendered HTML is indexable), faster initial page load (no JavaScript required to see content), file-based routing, server-side data fetching without CORS, image optimization, or edge deployment. Plain React SPA when: it's a private dashboard (SEO doesn't matter), you have an existing API layer, or you need maximum control over the build setup.

### Common Mistakes

```tsx
// Mistake: using 'use client' on a component that doesn't need it
// This adds it to the client bundle unnecessarily
'use client';
function StaticCard({ title, description }) { // no hooks, no events!
  return <div><h2>{title}</h2><p>{description}</p></div>;
}
// Fix: remove 'use client' — make it a Server Component

// Mistake: data fetching waterfall in Server Components
async function Page() {
  const user = await fetchUser(userId);      // waits
  const posts = await fetchPosts(userId);    // then waits
  return <Layout user={user} posts={posts} />;
}
// Fix: parallel fetch
async function Page() {
  const [user, posts] = await Promise.all([
    fetchUser(userId),
    fetchPosts(userId),
  ]);
  return <Layout user={user} posts={posts} />;
}
```
""",

10: """## Interview Simulation: React

### Core Hook Questions

**Q: Explain the difference between `useEffect` and `useLayoutEffect`.**

A: Both run after render, but at different points. `useEffect` runs asynchronously after the browser has painted. `useLayoutEffect` runs synchronously after the DOM mutations but before the browser paints. Use `useLayoutEffect` when you need to read DOM layout (element positions, sizes) or make DOM mutations that must happen before paint — for example, measuring a tooltip's position and repositioning it before the user sees it. In practice, `useEffect` is almost always correct; `useLayoutEffect` is for specific DOM measurement scenarios.

**Q: What causes an infinite loop in useEffect?**

```jsx
// Classic infinite loop: object in deps array
function Component({ options }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetchData(options).then(setData);
  }, [options]); // if options is { limit: 10 } defined in parent, new object every render!
  // → setData → re-render → new options object → effect runs → setData → ...
}
// Fixes:
// 1. Depend on primitive values: [options.limit, options.offset]
// 2. Memoize options in parent: const options = useMemo(() => ({limit: 10}), [])
// 3. Use JSON.stringify as dep (last resort): [JSON.stringify(options)]
```

**Q: What is the difference between `useRef` and `useState`?**

A: Both persist values across renders. `useState` triggers a re-render when updated; `useRef` does not. Use `useRef` for: (1) storing mutable values that don't affect rendering (timer IDs, previous values, instance variables); (2) accessing DOM elements. If updating the value should trigger a re-render, use `useState`.

### Coding Challenges

**Implement a modal with focus trap:**

```jsx
function Modal({ isOpen, onClose, children }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    // Focus first focusable element when opened
    const focusable = overlayRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    // Trap focus within modal
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') return onClose();
      if (e.key !== 'Tab') return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return createPortal(
    <div ref={overlayRef} role="dialog" aria-modal="true">
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>,
    document.body
  );
}
```

**Implement `useInterval`:**

```jsx
function useInterval(callback, delay) {
  const savedCallback = useRef(callback);

  // Keep ref current without restarting interval
  useEffect(() => { savedCallback.current = callback; }, [callback]);

  useEffect(() => {
    if (delay === null) return; // null delay = paused
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

// Usage:
function Ticker() {
  const [count, setCount] = useState(0);
  useInterval(() => setCount(c => c + 1), 1000);
  return <p>{count}</p>;
}
```

### Common Interview Patterns

**State initialization:**
```jsx
// Lazy initialization: expensive function only called once
const [state, setState] = useState(() => {
  return JSON.parse(localStorage.getItem('state')) ?? defaultState;
});
// Without arrow function: JSON.parse runs every render!
```

**Forwarding refs:**
```jsx
const Input = React.forwardRef(({ label, ...props }, ref) => (
  <label>
    {label}
    <input ref={ref} {...props} />
  </label>
));
// Parent can now access the underlying input element
const ref = useRef();
<Input ref={ref} label="Name" />
ref.current.focus();
```

### Key Takeaways for React Interviews

1. React's mental model: `UI = f(state)` — components are pure functions of state
2. Hooks rules: top-level only, function components only, name starts with `use`
3. State updates are asynchronous and batched — use functional updates when next state depends on previous
4. useEffect is for synchronization with external systems, not lifecycle management
5. Performance: measure first, then optimize with memo/useMemo/useCallback as needed
6. Keys must be stable and unique — never use array index for dynamic lists
7. Context re-renders all consumers — split by update frequency, memoize values
"""
}

for session in sessions:
    snum = session["sessionNumber"]
    if snum in CONTENT:
        session["content"] = CONTENT[snum]

with open(PATH, "w") as f:
    json.dump(data, f, separators=(",", ":"))

added = sum(1 for s in sessions if "content" in s and len(s["content"]) > 100)
print(f"React: updated {added}/10 sessions")
for s in sessions:
    print(f"  Session {s['sessionNumber']}: {len(s.get('content',''))} chars")
