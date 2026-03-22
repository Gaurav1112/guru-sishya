#!/usr/bin/env python3
"""Add content to JavaScript Fundamentals sessions (topic index 0)."""
import json

PATH = "/Users/racit/PersonalProject/guru-sishya/public/content/core-cs.json"

with open(PATH) as f:
    data = json.load(f)

idx = next(i for i, d in enumerate(data) if d["id"] == "javascript-fundamentals")
sessions = data[idx]["plan"]["sessions"]

CONTENT = {
1: """## How JavaScript Actually Executes

JavaScript is a single-threaded, interpreted language with a just-in-time (JIT) compiler. Understanding the execution model is the foundation for everything else — closures, async, the event loop — all make sense once you internalize how JS runs code.

### The Execution Context

Every time JavaScript runs code, it creates an **Execution Context**. There are two kinds:

1. **Global Execution Context (GEC)** — created when the script first loads. There is exactly one.
2. **Function Execution Context (FEC)** — created every time a function is called.

Each execution context has two phases:

**Creation Phase:**
- `this` binding is determined
- Lexical environment is created (scope chain is established)
- Variable declarations are hoisted (`var` → `undefined`, `let`/`const` → uninitialized TDZ)

**Execution Phase:**
- Code runs line by line
- Variables are assigned their values

```javascript
// What actually happens when this runs:
var x = 10;
function add(a, b) { return a + b; }
var result = add(x, 5);

// Creation phase:
//   x = undefined (hoisted)
//   add = function reference (hoisted)
//   result = undefined (hoisted)

// Execution phase:
//   x = 10
//   add(10, 5) → new FEC created
//     a = 10, b = 5
//     returns 15 → FEC destroyed
//   result = 15
```

### The Call Stack

The call stack is a LIFO (last-in, first-out) data structure that tracks which function is currently executing.

```javascript
function c() { console.log('c'); }
function b() { c(); console.log('b'); }
function a() { b(); console.log('a'); }
a();

// Call stack progression:
// [GEC]
// [GEC, a()]      ← a called
// [GEC, a(), b()] ← b called inside a
// [GEC, a(), b(), c()] ← c called inside b
// [GEC, a(), b()] ← c returns, popped
// [GEC, a()]      ← b returns, logs 'b'
// [GEC]           ← a returns, logs 'a'
// Output: c → b → a
```

**Stack overflow** happens when recursive calls never bottom out — the stack exceeds its memory limit.

```javascript
// Stack overflow:
function infinite() { return infinite(); }
infinite(); // RangeError: Maximum call stack size exceeded
```

### Memory: Stack vs Heap

- **Stack**: stores primitives (numbers, strings, booleans, null, undefined, symbols) and function call frames. Fast, fixed size.
- **Heap**: stores objects and functions. Garbage collected. Slower but flexible.

```javascript
// Stack: x holds the value 42 directly
let x = 42;
let y = x; // y gets a COPY of 42
y = 100;
console.log(x); // 42 — unchanged

// Heap: obj holds a REFERENCE to the object
let obj = { name: 'Alice' };
let obj2 = obj; // obj2 holds the SAME reference
obj2.name = 'Bob';
console.log(obj.name); // 'Bob' — same object!
```

### Scope Chain

When JS looks up a variable, it searches the current scope, then outer scopes, all the way to global. This chain is established **lexically** — based on where the code is written, not where it runs.

```javascript
const global = 'global';

function outer() {
  const outerVar = 'outer';

  function inner() {
    const innerVar = 'inner';
    // Can access: innerVar, outerVar, global
    console.log(global, outerVar, innerVar);
  }

  inner();
  // Cannot access: innerVar
}
```

### Real-World Use Case: Debugging Stack Traces

Understanding execution contexts helps you read stack traces:

```
TypeError: Cannot read properties of undefined (reading 'map')
    at ProductList (ProductList.jsx:12)
    at renderWithHooks (react-dom.development.js:14985)
    at mountIndeterminateComponent (react-dom.development.js:17811)
```

Read bottom-up: React called `mountIndeterminateComponent`, which called `renderWithHooks`, which called your `ProductList` component. Line 12 of `ProductList.jsx` tried to call `.map()` on `undefined` — probably props not yet loaded.

### Interview Q&A

**Q: What is the difference between the call stack and the heap?**
A: The call stack stores execution contexts and primitive values — it's fast, fixed-size, and LIFO. The heap stores objects and functions — it's larger, dynamically allocated, and managed by the garbage collector. When you do `let obj = {}`, the variable `obj` lives on the stack but holds a reference (pointer) to the actual object on the heap.

**Q: How many global execution contexts can exist?**
A: Exactly one per JavaScript runtime (per tab in a browser, per worker, per Node.js process). All code shares the same GEC.

**Q: What does "JavaScript is single-threaded" mean in practice?**
A: Only one piece of code runs at any given moment. There is no parallel execution on the main thread. This means a long-running synchronous operation (heavy computation, infinite loop) blocks everything — UI updates, event handlers, network responses — until it finishes.

### Common Mistakes

**Mistake: Mutating shared references accidentally**
```javascript
// Bug:
const defaults = { theme: 'light', lang: 'en' };
const userConfig = defaults; // same reference!
userConfig.theme = 'dark';
console.log(defaults.theme); // 'dark' — oops!

// Fix:
const userConfig = { ...defaults }; // shallow copy
// or for deep objects:
const userConfig = JSON.parse(JSON.stringify(defaults));
```

**Mistake: Assuming variable hoisting means the value is available**
```javascript
console.log(x); // undefined — NOT an error, but NOT 10
var x = 10;
// var is hoisted and initialized to undefined
// let/const are hoisted but NOT initialized (TDZ)
```
""",

2: """## Scope, Hoisting, and the Temporal Dead Zone

These three concepts trip up even experienced developers. Master them and you will never be surprised by a `ReferenceError` or mysterious `undefined` again.

### var vs let vs const

```javascript
// var: function-scoped, hoisted with undefined, re-declarable
function example() {
  console.log(x); // undefined (hoisted)
  var x = 10;
  var x = 20; // re-declaration: no error
  if (true) {
    var x = 30; // same x — var ignores block scope!
  }
  console.log(x); // 30
}

// let: block-scoped, hoisted but TDZ, no re-declaration
function example2() {
  // console.log(y); // ReferenceError: Cannot access 'y' before initialization
  let y = 10;
  // let y = 20; // SyntaxError: Identifier 'y' has already been declared
  if (true) {
    let y = 30; // different y — block scoped
    console.log(y); // 30
  }
  console.log(y); // 10
}

// const: same as let but must be initialized and cannot be reassigned
const PI = 3.14159;
// PI = 3; // TypeError: Assignment to constant variable
// const object values CAN be mutated:
const config = { debug: false };
config.debug = true; // OK — reassigning property, not the binding
```

### Hoisting in Detail

Hoisting is the process of moving declarations to the top of their scope during the creation phase.

**What gets hoisted:**
- `var` declarations → hoisted and initialized to `undefined`
- `function` declarations → hoisted with the full function body
- `let` and `const` declarations → hoisted but NOT initialized (TDZ)
- `class` declarations → hoisted but NOT initialized (TDZ)

```javascript
// Function declarations are fully hoisted:
greet('Alice'); // Works! 'Hello, Alice'
function greet(name) {
  return `Hello, ${name}`;
}

// Function expressions are NOT fully hoisted:
// sayHi('Bob'); // TypeError: sayHi is not a function
var sayHi = function(name) {
  return `Hi, ${name}`;
};
// var sayHi is hoisted as undefined, so calling it throws TypeError

// Arrow functions behave like function expressions:
// greetArrow('Carol'); // TypeError
const greetArrow = (name) => `Hey, ${name}`;
```

### The Temporal Dead Zone (TDZ)

The TDZ is the period between when a `let`/`const` variable is hoisted and when it is initialized. Accessing it in this zone throws a `ReferenceError`.

```javascript
{
  // TDZ for x starts here
  console.log(typeof x); // ReferenceError — even typeof fails in TDZ
  let x = 5;             // TDZ ends here — x initialized
  console.log(x);        // 5
}

// Why TDZ exists: to catch bugs where you use a variable before it's ready.
// With var, this silently returned undefined — a common source of bugs.
```

### Closure and Scope Interaction

The classic `var` in loop bug — one of the most common JavaScript interview questions:

```javascript
// BUG — var is function-scoped, all callbacks share the same i
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 3, 3, 3

// FIX 1 — let creates a new binding per iteration
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 0, 1, 2

// FIX 2 — IIFE creates a new scope per iteration (pre-ES6)
for (var i = 0; i < 3; i++) {
  ((j) => setTimeout(() => console.log(j), 100))(i);
}
// Output: 0, 1, 2

// FIX 3 — pass i as argument
for (var i = 0; i < 3; i++) {
  setTimeout(console.log.bind(null, i), 100);
}
```

### Real-World Use Case: Module Pattern with Scope

```javascript
// Using closures and scope to create private state
const BankAccount = (initialBalance) => {
  let balance = initialBalance; // private — not accessible outside

  return {
    deposit(amount) {
      if (amount <= 0) throw new Error('Amount must be positive');
      balance += amount;
      return balance;
    },
    withdraw(amount) {
      if (amount > balance) throw new Error('Insufficient funds');
      balance -= amount;
      return balance;
    },
    getBalance() { return balance; }
  };
};

const account = BankAccount(100);
account.deposit(50);   // 150
account.withdraw(30);  // 120
console.log(account.balance); // undefined — truly private!
```

### Interview Q&A

**Q: What is the difference between `var`, `let`, and `const`?**
A: `var` is function-scoped, hoisted with `undefined`, and can be re-declared. `let` and `const` are block-scoped, hoisted but in the TDZ until their declaration line, and cannot be re-declared in the same scope. `const` additionally prevents reassignment of the binding (but object properties can still be mutated).

**Q: Explain the classic `var` in a loop bug.**
A: `var` is function-scoped, so all iterations of the loop share one `i` variable. By the time the `setTimeout` callbacks run (after the loop completes), `i` is already at its final value. The fix is `let`, which creates a new `i` binding per iteration due to block scoping.

**Q: What is the Temporal Dead Zone?**
A: The TDZ is the period from when a `let`/`const` variable enters scope (is hoisted) to when its declaration is reached in code. Accessing the variable during this period throws a `ReferenceError`. This is intentional — it prevents using variables before they are initialized, which `var` allowed silently by returning `undefined`.

### Common Mistakes

```javascript
// Mistake: using const for objects and thinking they're immutable
const user = { name: 'Alice' };
user.name = 'Bob'; // WORKS — const prevents reassignment, not mutation
// user = { name: 'Carol' }; // TypeError

// Mistake: function declaration inside a block (non-strict mode)
if (true) {
  function foo() { return 1; } // hoisting behavior varies by engine!
}
// Avoid — use function expressions in blocks instead:
if (true) {
  const foo = () => 1; // predictable
}
```
""",

3: """## Closures

Closures are one of JavaScript's most powerful features and a near-universal interview topic. A closure is a function that retains access to its lexical scope even after the outer function has returned.

### How Closures Work

When a function is created, it captures a reference to its surrounding scope — not a copy of the values, but a live reference to the scope itself.

```javascript
function makeCounter() {
  let count = 0; // this variable lives in makeCounter's scope

  return {
    increment() { return ++count; },
    decrement() { return --count; },
    value()     { return count; }
  };
}

const counter = makeCounter();
// makeCounter() has returned — its execution context is gone
// But count still lives because the returned object's methods reference it

counter.increment(); // 1
counter.increment(); // 2
counter.decrement(); // 1
counter.value();     // 1
console.log(count);  // ReferenceError — count is private to the closure
```

### Closure Over a Loop Variable

```javascript
// Each closure captures the SAME i variable:
function badTimers() {
  const timers = [];
  for (var i = 0; i < 5; i++) {
    timers.push(() => i); // all capture the same i
  }
  return timers;
}
badTimers().map(f => f()); // [5, 5, 5, 5, 5]

// Each closure captures its OWN i binding:
function goodTimers() {
  const timers = [];
  for (let i = 0; i < 5; i++) {
    timers.push(() => i); // each iteration has its own i
  }
  return timers;
}
goodTimers().map(f => f()); // [0, 1, 2, 3, 4]
```

### Practical Use Cases

**1. Data Privacy / Encapsulation**

```javascript
function createUserService(apiKey) {
  // apiKey is private — not exposed to callers
  const headers = { 'Authorization': `Bearer ${apiKey}` };

  return {
    async getUser(id) {
      const res = await fetch(`/api/users/${id}`, { headers });
      return res.json();
    },
    async updateUser(id, data) {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT', headers, body: JSON.stringify(data)
      });
      return res.json();
    }
  };
}

const userService = createUserService(process.env.API_KEY);
// apiKey is inaccessible from outside — proper encapsulation
```

**2. Memoization**

```javascript
function memoize(fn) {
  const cache = new Map(); // closed over by the returned function

  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      console.log('cache hit');
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

const expensiveCalc = memoize((n) => {
  // Simulate expensive work
  let result = 0;
  for (let i = 0; i < n * 1e6; i++) result += i;
  return result;
});

expensiveCalc(10); // computes
expensiveCalc(10); // cache hit — instant
expensiveCalc(10); // cache hit — instant
```

**3. Partial Application and Currying**

```javascript
// Partial application: fix some arguments now, supply rest later
function multiply(a, b) { return a * b; }

function partial(fn, ...presetArgs) {
  return function(...laterArgs) {
    return fn(...presetArgs, ...laterArgs);
  };
}

const double = partial(multiply, 2);
const triple = partial(multiply, 3);

double(5);  // 10
triple(5);  // 15
[1, 2, 3, 4].map(double); // [2, 4, 6, 8]

// Currying: transform f(a, b, c) into f(a)(b)(c)
const curry = fn => {
  const arity = fn.length;
  return function curried(...args) {
    if (args.length >= arity) return fn(...args);
    return (...moreArgs) => curried(...args, ...moreArgs);
  };
};

const add = curry((a, b, c) => a + b + c);
add(1)(2)(3); // 6
add(1, 2)(3); // 6
add(1)(2, 3); // 6
```

**4. Event Handlers with State**

```javascript
function createClickTracker(elementId) {
  let clickCount = 0; // private state per tracker

  const element = document.getElementById(elementId);
  element.addEventListener('click', function handler() {
    clickCount++;
    element.textContent = `Clicked ${clickCount} times`;

    if (clickCount >= 10) {
      element.removeEventListener('click', handler); // handler references itself!
      element.textContent = 'Max clicks reached';
    }
  });
}

createClickTracker('btn-1'); // each button has its own clickCount
createClickTracker('btn-2'); // independent state
```

### Memory Considerations

Closures keep the entire outer scope alive as long as the closure itself is alive. This can cause memory leaks:

```javascript
// Memory leak: the handler closure keeps largeData alive forever
function setup() {
  const largeData = new Array(1e6).fill('x'); // 1M elements

  document.getElementById('btn').addEventListener('click', function() {
    console.log('clicked');
    // largeData is captured but never used — still kept in memory!
  });
}

// Fix: don't capture what you don't need
function setupFixed() {
  const largeData = new Array(1e6).fill('x');
  const summary = largeData.length; // extract only what's needed

  document.getElementById('btn').addEventListener('click', function() {
    console.log('data size:', summary);
    // largeData is no longer captured — can be GC'd
  });
}
```

### Interview Q&A

**Q: What is a closure?**
A: A closure is a function that retains access to its lexical scope (the variables in its surrounding scope) even after the outer function has returned. The function "closes over" those variables. This is possible because JavaScript's scope chain is based on where functions are written (lexical scoping), not where they are called.

**Q: What are practical uses of closures?**
A: (1) Data privacy — creating private variables that can only be accessed through returned methods. (2) Factory functions — creating multiple instances with isolated state. (3) Memoization — caching results using a captured Map or object. (4) Partial application and currying — fixing arguments ahead of time. (5) Event handlers with associated state.

**Q: Can closures cause memory leaks?**
A: Yes. A closure keeps the entire outer scope alive as long as the closure function itself is referenced. If a closure captures a large object but is never released (e.g., an event listener that's never removed), the large object cannot be garbage collected. Fix by either removing the listener when done, or extracting only the data you need from the large object.

### Common Mistakes

```javascript
// Mistake 1: Thinking closures copy values
let x = 10;
const getX = () => x;
x = 20;
getX(); // 20 — closures capture variables by REFERENCE, not by value

// Mistake 2: Not understanding async closures
async function fetchAll(ids) {
  const results = [];
  for (let i = 0; i < ids.length; i++) {
    // Each async callback closes over its own 'i' (let is block-scoped)
    results.push(await fetch(`/api/${ids[i]}`));
  }
  return results;
  // With var: all fetches would use the final value of i!
}
```
""",

4: """## this Binding, Prototypes, and OOP

`this` is JavaScript's most confusing feature. The key insight: `this` is determined by **how** a function is called, not where it is defined (with one exception: arrow functions).

### The Four Rules of `this`

**Rule 1: Default binding** — standalone function call; `this` = global object (or `undefined` in strict mode)

```javascript
function showThis() { console.log(this); }
showThis(); // window (browser) or global (Node) or undefined (strict)
```

**Rule 2: Implicit binding** — method call; `this` = the object before the dot

```javascript
const user = {
  name: 'Alice',
  greet() { console.log(`Hi, I'm ${this.name}`); }
};
user.greet(); // 'Hi, I'm Alice' — this = user
```

**Rule 3: Explicit binding** — `call`, `apply`, `bind`

```javascript
function greet(greeting, punctuation) {
  return `${greeting}, ${this.name}${punctuation}`;
}

const alice = { name: 'Alice' };
greet.call(alice, 'Hello', '!');    // 'Hello, Alice!' — immediate call
greet.apply(alice, ['Hello', '!']); // 'Hello, Alice!' — args as array
const greetAlice = greet.bind(alice); // returns new function, doesn't call
greetAlice('Hi', '.');              // 'Hi, Alice.'
```

**Rule 4: new binding** — constructor call; `this` = the newly created object

```javascript
function Person(name, age) {
  this.name = name;
  this.age = age;
  // implicitly returns this
}
const alice = new Person('Alice', 30);
alice.name; // 'Alice'
```

### Arrow Functions and `this`

Arrow functions do NOT have their own `this`. They inherit `this` from the enclosing lexical scope at the time of definition.

```javascript
const timer = {
  seconds: 0,
  start() {
    // Arrow function: this = timer (lexical)
    setInterval(() => {
      this.seconds++;
      console.log(this.seconds);
    }, 1000);
  },
  startBroken() {
    // Regular function: this = undefined (strict) or window
    setInterval(function() {
      this.seconds++; // TypeError or NaN!
    }, 1000);
  }
};
timer.start(); // works: 1, 2, 3...
```

### Prototypal Inheritance

Every JavaScript object has a hidden `[[Prototype]]` link. Property lookup traverses this chain until it hits `null`.

```javascript
// Object.create sets [[Prototype]] directly
const animal = {
  breathe() { return `${this.name} is breathing`; },
  toString() { return `[Animal: ${this.name}]`; }
};

const dog = Object.create(animal);
dog.name = 'Rex';
dog.bark = function() { return 'Woof!'; };

dog.bark();    // 'Woof!' — own property
dog.breathe(); // 'Rex is breathing' — found via prototype chain
Object.getPrototypeOf(dog) === animal; // true

// Property lookup:
// dog.breathe → not on dog → check animal → found!
// dog.nonexistent → not on dog → not on animal → not on Object.prototype → undefined
```

### Class Syntax (Syntactic Sugar)

ES6 `class` is syntactic sugar over prototypal inheritance. Under the hood, it uses the same prototype chain.

```javascript
class Animal {
  #name; // private field (ES2022)

  constructor(name) {
    this.#name = name;
  }

  speak() {
    return `${this.#name} makes a sound`;
  }

  get name() { return this.#name; }

  static create(name) { return new Animal(name); }
}

class Dog extends Animal {
  #breed;

  constructor(name, breed) {
    super(name); // must call super before using this
    this.#breed = breed;
  }

  speak() {
    return `${this.name} barks`; // override
  }

  fetch(item) {
    return `${this.name} fetches ${item}`;
  }
}

const rex = new Dog('Rex', 'Labrador');
rex.speak();          // 'Rex barks'
rex.fetch('ball');    // 'Rex fetches ball'
rex instanceof Dog;   // true
rex instanceof Animal;// true

// Under the hood:
Object.getPrototypeOf(rex) === Dog.prototype;         // true
Object.getPrototypeOf(Dog.prototype) === Animal.prototype; // true
```

### Real-World: Losing `this` in Callbacks

```javascript
class EventEmitter {
  constructor() {
    this.listeners = [];
    this.name = 'MyEmitter';
  }

  // Bug: this is lost when method is used as callback
  onEvent() {
    console.log(this.name); // undefined or error
  }
}

const emitter = new EventEmitter();
// setTimeout(emitter.onEvent, 100); // Bug: this = global

// Fix 1: bind in constructor
class EventEmitterFixed {
  constructor() {
    this.listeners = [];
    this.name = 'MyEmitter';
    this.onEvent = this.onEvent.bind(this); // bound once
  }
  onEvent() { console.log(this.name); } // 'MyEmitter'
}

// Fix 2: use arrow function as class field (modern)
class EventEmitterArrow {
  name = 'MyEmitter';
  onEvent = () => { console.log(this.name); }; // arrow: lexical this
}

const e = new EventEmitterArrow();
setTimeout(e.onEvent, 100); // 'MyEmitter' — works!
```

### Interview Q&A

**Q: What are the four rules for determining `this`?**
A: (1) Default binding — standalone call, `this` is global/undefined. (2) Implicit binding — method call `obj.fn()`, `this` is `obj`. (3) Explicit binding — `fn.call(ctx)`, `fn.apply(ctx)`, `fn.bind(ctx)`, `this` is `ctx`. (4) `new` binding — constructor call, `this` is the new object. Arrow functions are the exception — they use lexical `this` from their definition site.

**Q: What is the difference between prototypal and classical inheritance?**
A: Classical inheritance (Java, C++) defines classes as blueprints that are instantiated. JavaScript uses prototypal inheritance — objects inherit directly from other objects via the `[[Prototype]]` chain. ES6 `class` syntax is syntactic sugar; under the hood, `extends` sets up prototype chain links and `super` calls the parent's constructor.

**Q: What does `new` do step by step?**
A: (1) Creates a new empty object `{}`. (2) Sets the object's `[[Prototype]]` to `Constructor.prototype`. (3) Calls the constructor with `this` bound to the new object. (4) Returns the new object (unless the constructor explicitly returns a different object).

### Common Mistakes

```javascript
// Mistake: Destructuring loses this
class Api {
  baseUrl = 'https://api.example.com';
  async getUsers() {
    return fetch(this.baseUrl + '/users'); // this.baseUrl is undefined if lost!
  }
}
const api = new Api();
const { getUsers } = api; // this is lost!
// getUsers(); // Error

// Fix: bind or use arrow class fields
class ApiFixed {
  baseUrl = 'https://api.example.com';
  getUsers = async () => fetch(this.baseUrl + '/users'); // arrow field
}
```
""",

5: """## The Event Loop Deep Dive

The event loop is how JavaScript achieves non-blocking I/O despite being single-threaded. It is the most important concept for understanding async JavaScript.

### The Components

```
┌─────────────────────────────┐
│         Call Stack          │  ← runs synchronous code
│  (LIFO — active functions)  │
└─────────────┬───────────────┘
              │ when empty
              ▼
┌─────────────────────────────┐
│       Microtask Queue       │  ← Promise.then, queueMicrotask, MutationObserver
│   (drained COMPLETELY       │    Drains completely before any macrotask runs
│    before macrotask)        │
└─────────────┬───────────────┘
              │ when empty
              ▼
┌─────────────────────────────┐
│       Macrotask Queue       │  ← setTimeout, setInterval, I/O, UI events
│   (one task per loop tick)  │
└─────────────────────────────┘
```

### Execution Order Rules

1. Synchronous code runs first (call stack)
2. When call stack empties, drain ALL microtasks (including new microtasks added during draining)
3. Run ONE macrotask
4. Drain ALL microtasks again
5. Render (in browsers)
6. Repeat

```javascript
console.log('1 sync');

setTimeout(() => console.log('5 macrotask'), 0);

Promise.resolve()
  .then(() => {
    console.log('3 microtask 1');
    Promise.resolve().then(() => console.log('4 microtask 2 (nested)'));
  });

queueMicrotask(() => console.log('microtask 3 queued'));

console.log('2 sync');

// Output order: 1, 2, 3, microtask 3 queued, 4, 5
// Note: nested microtask (4) runs BEFORE macrotask (5)
```

### setTimeout(fn, 0) Does Not Mean Immediate

```javascript
// setTimeout 0 means "run after current sync + all microtasks"
console.log('start');
setTimeout(() => console.log('timeout'), 0);
Promise.resolve().then(() => console.log('promise'));
console.log('end');
// Output: start → end → promise → timeout
```

### Node.js Event Loop Phases

Node.js has a more detailed event loop with phases:

```
   ┌───────────────────────────┐
┌─►│           timers          │  ← setTimeout, setInterval callbacks
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │     pending callbacks     │  ← I/O errors from previous iteration
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       idle, prepare       │  ← internal use
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │           poll            │  ← retrieve new I/O events; execute I/O callbacks
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │           check           │  ← setImmediate callbacks
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
└──│      close callbacks      │  ← socket.on('close', ...)
   └───────────────────────────┘
```

```javascript
// Node.js specific: setImmediate vs setTimeout
setImmediate(() => console.log('setImmediate'));
setTimeout(() => console.log('setTimeout'), 0);
// Order can vary at top level! But inside I/O callback:
const fs = require('fs');
fs.readFile(__filename, () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
  // Inside I/O callback: immediate ALWAYS before timeout
  // Output: immediate → timeout
});

// process.nextTick runs before all other async callbacks
process.nextTick(() => console.log('nextTick'));
Promise.resolve().then(() => console.log('promise'));
setTimeout(() => console.log('timeout'), 0);
// Output: nextTick → promise → timeout
```

### Blocking the Event Loop

```javascript
// NEVER do this in production — blocks everything for ~2 seconds
function computeSync(n) {
  let result = 0;
  for (let i = 0; i < n; i++) result += i;
  return result;
}
computeSync(1e9); // blocks event loop — no HTTP responses, no timers, nothing

// Fix 1: Break into chunks with setImmediate
function computeChunked(n, callback) {
  let result = 0;
  let i = 0;
  const CHUNK = 1e6;

  function processChunk() {
    const end = Math.min(i + CHUNK, n);
    for (; i < end; i++) result += i;
    if (i < n) {
      setImmediate(processChunk); // yield after each chunk
    } else {
      callback(result);
    }
  }
  processChunk();
}

// Fix 2: Use a Worker Thread (Node.js)
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
if (isMainThread) {
  const worker = new Worker(__filename, { workerData: { n: 1e9 } });
  worker.on('message', result => console.log('Result:', result));
} else {
  let result = 0;
  for (let i = 0; i < workerData.n; i++) result += i;
  parentPort.postMessage(result);
}
```

### Interview Q&A

**Q: What is the difference between the microtask queue and the macrotask queue?**
A: The microtask queue (Promise.then, queueMicrotask, MutationObserver) is drained completely after each synchronous task before any macrotask runs. The macrotask queue (setTimeout, setInterval, I/O events) runs one task per event loop iteration. This means Promises always resolve before the next setTimeout callback, no matter how many .then() chains are involved.

**Q: Why does `setTimeout(fn, 0)` not run immediately?**
A: `setTimeout(fn, 0)` schedules the callback as a macrotask, which only runs after the current call stack empties AND all microtasks drain. Even with a delay of 0ms, it will always run after any queued Promises.

**Q: What happens if you have a Promise that resolves and schedules another Promise, repeatedly?**
A: Since microtasks are drained completely before any macrotask runs, a chain of resolving Promises will keep the microtask queue busy. If new microtasks are added during draining, they are also processed before any macrotask. In extreme cases (infinite Promise chain), this can starve macrotasks — similar to a synchronous infinite loop for the macrotask queue.

### Common Mistakes

```javascript
// Mistake: expecting setTimeout to be accurate
setTimeout(() => console.log('after 100ms'), 100);
// If event loop is busy with sync code for 200ms, this fires at ~200ms, not 100ms

// Mistake: mixing async and sync in confusing ways
async function confusing() {
  console.log('A');
  await Promise.resolve(); // yields to microtask queue
  console.log('C');
}
console.log('B before call');
confusing();
console.log('B after call');
// Output: B before call → A → B after call → C
// 'B after call' runs before 'C' because await yields execution
```
""",

6: """## Promises: Internals and Patterns

Promises replaced callbacks as the standard for async operations in JavaScript. Understanding their internals makes async/await — and all the edge cases — much clearer.

### Promise States

A Promise is always in one of three states:
- **Pending**: initial state, neither fulfilled nor rejected
- **Fulfilled**: operation completed successfully, has a value
- **Rejected**: operation failed, has a reason (error)

Once settled (fulfilled or rejected), a Promise never changes state.

```javascript
// Creating promises
const p1 = new Promise((resolve, reject) => {
  // executor runs synchronously
  console.log('executor running');
  setTimeout(() => resolve(42), 1000);
});

// Promise.resolve / Promise.reject for instant promises
const p2 = Promise.resolve('immediate value');
const p3 = Promise.reject(new Error('immediate failure'));

// Thenable chaining
p2
  .then(val => {
    console.log(val); // 'immediate value'
    return val.toUpperCase(); // transforms the value
  })
  .then(val => {
    console.log(val); // 'IMMEDIATE VALUE'
    return Promise.resolve(val + '!'); // returning a Promise unwraps it
  })
  .then(val => console.log(val)); // 'IMMEDIATE VALUE!'
```

### Promise Chaining vs Nesting

```javascript
// BAD: Promise hell (same problem as callback hell)
fetch('/api/user')
  .then(res => {
    res.json().then(user => {
      fetch(`/api/posts/${user.id}`).then(res => {
        res.json().then(posts => {
          console.log(posts); // deeply nested, error handling nightmare
        });
      });
    });
  });

// GOOD: flat chain
fetch('/api/user')
  .then(res => res.json())        // return Promise → next .then gets the value
  .then(user => fetch(`/api/posts/${user.id}`))
  .then(res => res.json())
  .then(posts => console.log(posts))
  .catch(err => console.error(err)); // catches ANY error in the chain
```

### Concurrency Patterns

```javascript
const ids = [1, 2, 3, 4, 5];

// Promise.all — runs in parallel, fails fast on any rejection
const [users, posts] = await Promise.all([
  fetch('/api/users').then(r => r.json()),
  fetch('/api/posts').then(r => r.json()),
]);
// If either fails, Promise.all rejects immediately

// Promise.allSettled — waits for all, never rejects
const results = await Promise.allSettled([
  fetch('/api/users').then(r => r.json()),
  fetch('/api/bad-endpoint').then(r => r.json()),
]);
results.forEach(result => {
  if (result.status === 'fulfilled') console.log('OK:', result.value);
  else console.log('Error:', result.reason);
});

// Promise.race — resolves/rejects with the first to settle
const timeout = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Timeout')), 5000)
);
const data = await Promise.race([
  fetch('/api/slow-endpoint').then(r => r.json()),
  timeout
]);

// Promise.any — first to fulfill (ignores rejections, fails if ALL reject)
const fastServer = await Promise.any([
  fetch('https://server1.example.com/api'),
  fetch('https://server2.example.com/api'),
  fetch('https://server3.example.com/api'),
]);
```

### Implementing Promise from Scratch (Interview Classic)

```javascript
class MyPromise {
  #state = 'pending';
  #value = undefined;
  #callbacks = [];

  constructor(executor) {
    try {
      executor(
        (value) => this.#resolve(value),
        (reason) => this.#reject(reason)
      );
    } catch (err) {
      this.#reject(err);
    }
  }

  #resolve(value) {
    if (this.#state !== 'pending') return;
    this.#state = 'fulfilled';
    this.#value = value;
    this.#callbacks.forEach(cb => cb.onFulfilled(value));
  }

  #reject(reason) {
    if (this.#state !== 'pending') return;
    this.#state = 'rejected';
    this.#value = reason;
    this.#callbacks.forEach(cb => cb.onRejected(reason));
  }

  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      const handle = () => {
        try {
          if (this.#state === 'fulfilled') {
            resolve(onFulfilled ? onFulfilled(this.#value) : this.#value);
          } else {
            reject(onRejected ? onRejected(this.#value) : this.#value);
          }
        } catch (err) { reject(err); }
      };

      if (this.#state === 'pending') {
        this.#callbacks.push({
          onFulfilled: () => queueMicrotask(handle),
          onRejected:  () => queueMicrotask(handle)
        });
      } else {
        queueMicrotask(handle);
      }
    });
  }

  catch(onRejected) { return this.then(null, onRejected); }
}
```

### Interview Q&A

**Q: What is the difference between Promise.all and Promise.allSettled?**
A: `Promise.all` runs all promises concurrently and returns an array of results. If ANY promise rejects, `Promise.all` immediately rejects with that reason — other results are lost. `Promise.allSettled` also runs all concurrently, but always waits for all to complete and returns an array of `{status: 'fulfilled', value}` or `{status: 'rejected', reason}` objects. Use `all` when you need all results and a single failure should abort; use `allSettled` when you want to handle partial failures.

**Q: What happens if you throw inside a `.then()` handler?**
A: The Promise returned by `.then()` is rejected with the thrown error. This error propagates down the chain to the nearest `.catch()` handler. This is why you can have a single `.catch()` at the end of a chain — it catches errors from any `.then()` in the chain.

**Q: Can a Promise be resolved with another Promise?**
A: Yes. When you resolve a Promise with another Promise (or any thenable), the outer Promise "adopts" the state of the inner one. So `resolve(Promise.resolve(42))` results in the outer Promise eventually fulfilling with `42`, not with `Promise.resolve(42)`. This is called Promise unwrapping/assimilation.

### Common Mistakes

```javascript
// Mistake 1: Forgetting to return inside .then()
fetch('/api/users')
  .then(res => {
    res.json(); // BUG: not returned! next .then gets undefined
  })
  .then(data => console.log(data)); // undefined

// Fix:
  .then(res => res.json()) // return the promise

// Mistake 2: Unhandled rejection
const p = Promise.reject(new Error('oops'));
// No .catch() → UnhandledPromiseRejection warning/crash in Node.js

// Mistake 3: Promise constructor anti-pattern
// BAD: unnecessary wrapping
function getUser(id) {
  return new Promise((resolve, reject) => {
    fetch(`/api/users/${id}`)
      .then(res => res.json())
      .then(resolve)
      .catch(reject);
  });
}
// GOOD: just return the existing promise
function getUser(id) {
  return fetch(`/api/users/${id}`).then(res => res.json());
}
```
""",

7: """## Async/Await and Error Handling

Async/await is syntactic sugar over Promises that makes async code look and behave more like synchronous code. But it has its own pitfalls.

### Async Functions Always Return Promises

```javascript
async function getValue() {
  return 42; // auto-wrapped: equivalent to return Promise.resolve(42)
}
async function getNothing() {} // returns Promise.resolve(undefined)
async function fail() {
  throw new Error('oops'); // equivalent to return Promise.reject(new Error('oops'))
}

getValue().then(v => console.log(v)); // 42
getNothing().then(v => console.log(v)); // undefined
fail().catch(e => console.log(e.message)); // 'oops'
```

### Await Pauses Only the Current Async Function

```javascript
async function fetchData() {
  console.log('before await');
  const data = await fetch('/api').then(r => r.json()); // pauses fetchData
  console.log('after await'); // resumes after fetch resolves
  return data;
}

console.log('before call');
fetchData(); // starts executing
console.log('after call'); // runs BEFORE 'after await'
// Output: before call → before await → after call → after await
```

### Sequential vs Parallel Execution

```javascript
// SEQUENTIAL — each awaits the previous (slow!)
async function sequential() {
  const user  = await fetchUser(1);  // waits
  const posts = await fetchPosts(1); // waits
  const comments = await fetchComments(1); // waits
  return { user, posts, comments };
  // Total time: t(user) + t(posts) + t(comments)
}

// PARALLEL — all start simultaneously (fast!)
async function parallel() {
  const [user, posts, comments] = await Promise.all([
    fetchUser(1),
    fetchPosts(1),
    fetchComments(1),
  ]);
  return { user, posts, comments };
  // Total time: max(t(user), t(posts), t(comments))
}

// PARALLEL with independent error handling
async function parallelWithFallbacks() {
  const results = await Promise.allSettled([
    fetchUser(1),
    fetchPosts(1),
    fetchComments(1),
  ]);
  const [userResult, postsResult, commentsResult] = results;
  const user = userResult.status === 'fulfilled' ? userResult.value : null;
  const posts = postsResult.status === 'fulfilled' ? postsResult.value : [];
  return { user, posts };
}
```

### Proper Error Handling Patterns

```javascript
// Pattern 1: try/catch (most common)
async function getUser(id) {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch user:', err);
    return null; // or re-throw, or return default
  }
}

// Pattern 2: to/from style (clean separation, popular in Go-influenced code)
async function to(promise) {
  try {
    const data = await promise;
    return [null, data];
  } catch (err) {
    return [err, null];
  }
}

async function processUser(id) {
  const [err, user] = await to(fetchUser(id));
  if (err) { console.error(err); return; }

  const [postsErr, posts] = await to(fetchPosts(user.id));
  if (postsErr) { /* handle gracefully */ }

  return { user, posts: posts ?? [] };
}

// Pattern 3: Error boundary with async IIFE
(async () => {
  try {
    await main();
  } catch (err) {
    console.error('Fatal:', err);
    process.exit(1);
  }
})();
```

### Async Iteration

```javascript
// for-await-of: iterate async iterables
async function processStream(readable) {
  for await (const chunk of readable) {
    process(chunk);
  }
}

// Async generator: produce values asynchronously
async function* paginate(url) {
  let cursor = null;
  do {
    const endpoint = cursor ? `${url}?cursor=${cursor}` : url;
    const res = await fetch(endpoint);
    const { items, nextCursor } = await res.json();
    yield* items; // yield each item
    cursor = nextCursor;
  } while (cursor);
}

// Consume:
for await (const item of paginate('/api/items')) {
  console.log(item);
}
```

### Interview Q&A

**Q: What is the difference between `await Promise.all([a, b])` and `await a; await b;`?**
A: `await Promise.all([a, b])` starts both `a` and `b` immediately and awaits them in parallel — total time is `max(a, b)`. `await a; await b;` runs sequentially — `b` doesn't start until `a` resolves — total time is `a + b`. Use `Promise.all` whenever the operations are independent.

**Q: What happens if you forget `await`?**
A: You get a Promise object instead of the resolved value. If you then call methods on it expecting the resolved value, you'll get `undefined` or an error. TypeScript with `strict` mode often catches this. Node.js will warn about unhandled rejections if the Promise rejects.

**Q: How do you handle errors in `Promise.all` when you want partial results?**
A: Use `Promise.allSettled` instead, which always waits for all promises and returns `{status, value/reason}` for each. Or wrap each individual promise in a try/catch before passing to `Promise.all`.

### Common Mistakes

```javascript
// Mistake 1: await in a forEach (doesn't wait for async callbacks)
async function processAll(ids) {
  ids.forEach(async (id) => { // forEach ignores returned promises!
    await doSomething(id);
  });
  // processAll returns BEFORE any doSomething completes!
}

// Fix: use for...of
async function processAll(ids) {
  for (const id of ids) {
    await doSomething(id); // truly sequential
  }
}
// Or parallel:
async function processAll(ids) {
  await Promise.all(ids.map(id => doSomething(id)));
}

// Mistake 2: try/catch not wrapping the await
async function bad() {
  try {
    const promise = fetch('/api'); // no await — try/catch misses the rejection
  } catch (e) { /* never called */ }
  const data = await promise; // rejection is unhandled!
}
```
""",

8: """## Functional Programming Patterns

JavaScript supports functional programming (FP) as a first-class paradigm. FP principles lead to more predictable, testable, and composable code.

### Pure Functions

A pure function has two properties: (1) given the same inputs, always returns the same output; (2) no side effects.

```javascript
// Pure: deterministic, no side effects
const add = (a, b) => a + b;
const double = x => x * 2;
const formatName = (first, last) => `${first} ${last}`;

// Impure: depends on external state
let tax = 0.1;
const priceWithTax = amount => amount * (1 + tax); // depends on mutable tax

// Impure: side effect
function saveUser(user) {
  db.save(user); // side effect: I/O
  return user;
}

// Pure functions are easier to test:
test('add', () => {
  expect(add(2, 3)).toBe(5); // no setup, no mocking
  expect(add(-1, 1)).toBe(0);
});
```

### Map, Filter, Reduce

```javascript
const products = [
  { name: 'Laptop', price: 999, category: 'electronics', inStock: true },
  { name: 'Book', price: 29, category: 'education', inStock: true },
  { name: 'Phone', price: 699, category: 'electronics', inStock: false },
  { name: 'Course', price: 199, category: 'education', inStock: true },
];

// map: transform each element, returns new array of same length
const names = products.map(p => p.name);
// ['Laptop', 'Book', 'Phone', 'Course']

const discounted = products.map(p => ({ ...p, price: p.price * 0.9 }));

// filter: keep elements matching predicate
const inStock = products.filter(p => p.inStock);
const electronics = products.filter(p => p.category === 'electronics');

// reduce: fold array into a single value
const totalValue = products.reduce((acc, p) => acc + p.price, 0); // 1926

// Group by category:
const byCategory = products.reduce((acc, p) => {
  const cat = p.category;
  acc[cat] = acc[cat] ? [...acc[cat], p] : [p];
  return acc;
}, {});
// { electronics: [...], education: [...] }

// Chaining:
const totalInStockElectronicsRevenue = products
  .filter(p => p.inStock && p.category === 'electronics')
  .map(p => p.price)
  .reduce((sum, price) => sum + price, 0); // 999
```

### Function Composition

```javascript
// compose: right-to-left
const compose = (...fns) => x => fns.reduceRight((v, f) => f(v), x);

// pipe: left-to-right (more readable)
const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);

const trim     = s => s.trim();
const lower    = s => s.toLowerCase();
const slugify  = s => s.replace(/\s+/g, '-');
const truncate = n => s => s.slice(0, n);

const toSlug = pipe(trim, lower, slugify, truncate(50));
toSlug('  Hello World  '); // 'hello-world'

// Real-world: data transformation pipeline
const processOrder = pipe(
  validateOrder,
  calculateTax,
  applyDiscounts,
  formatForDatabase
);

const dbOrder = processOrder(rawOrder);
```

### Immutability

```javascript
// Immutable state updates (like Redux reducers)
const initialState = {
  user: { name: 'Alice', age: 30 },
  posts: [{ id: 1, title: 'Hello' }],
  settings: { theme: 'light' }
};

// Shallow update (spread):
const newState = {
  ...initialState,
  user: { ...initialState.user, age: 31 } // only user.age changed
};

// Array updates (immutable):
// Add:
const withNewPost = { ...state, posts: [...state.posts, newPost] };
// Remove:
const withoutPost = { ...state, posts: state.posts.filter(p => p.id !== 1) };
// Update:
const withUpdatedPost = {
  ...state,
  posts: state.posts.map(p => p.id === 1 ? { ...p, title: 'Updated' } : p)
};

// Immer library for ergonomic immutable updates:
import produce from 'immer';
const nextState = produce(state, draft => {
  draft.user.age = 31; // looks mutable, but Immer makes it immutable!
  draft.posts.push(newPost);
});
```

### Interview Q&A

**Q: What is a pure function and why does it matter?**
A: A pure function always returns the same output for the same inputs and has no side effects (no I/O, no mutation of external state). Pure functions are predictable, easy to test (no mocking required), and safe to memoize (cache results). They are the foundation of functional programming and make concurrent code safer.

**Q: Implement `pipe` from scratch.**
A: `const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);` — takes any number of functions, returns a function that passes a value through each function left to right.

**Q: What is the difference between `.map()` and `.forEach()`?**
A: `.map()` is pure — it returns a new array of transformed values. `.forEach()` always returns `undefined` and is used for side effects only. Never use `.forEach()` when you need the transformed values.

### Common Mistakes

```javascript
// Mistake: mutating in map/filter/reduce
const result = items.map(item => {
  item.processed = true; // MUTATING the original! Bad.
  return item;
});
// Fix:
const result = items.map(item => ({ ...item, processed: true }));

// Mistake: using reduce where map+filter is clearer
// Overly clever:
const evenDoubles = nums.reduce((acc, n) => n % 2 === 0 ? [...acc, n*2] : acc, []);
// Clearer:
const evenDoubles = nums.filter(n => n % 2 === 0).map(n => n * 2);
```
""",

9: """## Modern ES6+ Features

A rapid-fire tour of the most important modern JavaScript features, with practical examples for each.

### Destructuring

```javascript
// Array destructuring
const [first, second, ...rest] = [1, 2, 3, 4, 5];
// first=1, second=2, rest=[3,4,5]

// Skip elements:
const [,, third] = [1, 2, 3]; // third=3

// Default values:
const [a = 10, b = 20] = [5]; // a=5, b=20

// Object destructuring
const { name, age, address: { city } = {} } = user;
// Rename:
const { name: userName, age: userAge } = user;
// Default values:
const { role = 'guest', permissions = [] } = user;

// Function parameter destructuring
function processUser({ id, name, email, role = 'user' }) {
  return `${name} (${role}): ${email}`;
}

// Real-world: React props
function Button({ onClick, children, disabled = false, variant = 'primary' }) {
  return <button onClick={onClick} disabled={disabled} className={`btn btn-${variant}`}>{children}</button>;
}
```

### Spread and Rest

```javascript
// Spread: expand iterables
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const merged = [...arr1, ...arr2]; // [1,2,3,4,5,6]
const copy = [...arr1]; // shallow copy

// Spread with objects
const base = { a: 1, b: 2 };
const extended = { ...base, c: 3, b: 99 }; // { a:1, b:99, c:3 } — last wins

// Rest: collect remaining arguments
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b, 0);
}
sum(1, 2, 3, 4, 5); // 15

// Rest in destructuring
const { id, ...otherProps } = user; // otherProps has everything except id
const [head, ...tail] = [1, 2, 3, 4]; // head=1, tail=[2,3,4]
```

### Optional Chaining and Nullish Coalescing

```javascript
// Optional chaining: safe property access
const city = user?.address?.city; // undefined if user or address is null/undefined
const firstTag = post?.tags?.[0]; // safe array access
const result = obj?.method?.(); // safe method call

// Before optional chaining:
const city = user && user.address && user.address.city;

// Nullish coalescing: default for null/undefined (not 0 or '')
const count = data.count ?? 0;    // 0 only if count is null/undefined
const name = data.name ?? 'Anonymous';

// vs OR: 0 and '' are falsy
const count2 = data.count || 0;   // 0 even if data.count is 0 itself!

// Combined:
const displayName = user?.profile?.displayName ?? user?.email ?? 'Anonymous';
```

### Template Literals and Tagged Templates

```javascript
// Template literals
const greeting = `Hello, ${name}! You have ${count} message${count !== 1 ? 's' : ''}.`;

// Multi-line strings
const html = `
  <div class="card">
    <h2>${title}</h2>
    <p>${description}</p>
  </div>
`.trim();

// Tagged templates (used by styled-components, graphql-tag, etc.)
function highlight(strings, ...values) {
  return strings.reduce((result, str, i) =>
    result + str + (values[i] !== undefined ? `<mark>${values[i]}</mark>` : ''), '');
}
const msg = highlight`Hello ${name}, you scored ${score} points!`;
// 'Hello <mark>Alice</mark>, you scored <mark>95</mark> points!'

// Real usage: SQL (prevents injection via parameterization)
const sql = gql`
  query GetUser($id: ID!) {
    user(id: $id) { name email }
  }
`;
```

### Symbols, Iterators, and Generators

```javascript
// Symbol: unique, non-string key
const id = Symbol('id');
const secret = Symbol('secret');
const obj = { [id]: 123, name: 'Alice' };
obj[id]; // 123
Object.keys(obj); // ['name'] — symbols are hidden from most enumeration

// Custom iterator
function range(start, end, step = 1) {
  return {
    [Symbol.iterator]() {
      let current = start;
      return {
        next() {
          if (current < end) {
            const value = current;
            current += step;
            return { value, done: false };
          }
          return { value: undefined, done: true };
        }
      };
    }
  };
}
[...range(0, 10, 2)]; // [0, 2, 4, 6, 8]
for (const n of range(1, 4)) console.log(n); // 1, 2, 3

// Generators
function* fibonacci() {
  let [a, b] = [0, 1];
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

const fib = fibonacci();
Array.from({ length: 10 }, () => fib.next().value);
// [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

### Interview Q&A

**Q: What is the difference between `??` and `||`?**
A: `??` (nullish coalescing) only uses the right-hand side if the left is `null` or `undefined`. `||` uses the right side for any falsy value (`0`, `''`, `false`, `NaN`, `null`, `undefined`). This matters when `0` or `''` are valid values you want to preserve.

**Q: What does the spread operator do with objects?**
A: It performs a shallow copy of an object's own enumerable properties. Later properties override earlier ones when the same key exists. It does NOT deep clone — nested objects are still shared references.

**Q: What are Symbols used for?**
A: Creating unique, non-string property keys that don't conflict with other code. Common use cases: (1) private-ish properties that don't show up in `Object.keys()`. (2) Well-known symbols like `Symbol.iterator` to customize object behavior. (3) Enum-like constants that are guaranteed unique.

### Common Mistakes

```javascript
// Mistake: spread doesn't deep clone
const original = { a: { b: 1 } };
const copy = { ...original };
copy.a.b = 99;
console.log(original.a.b); // 99 — shared reference!

// Fix for deep clone (modern):
const deep = structuredClone(original); // native, handles most types

// Mistake: optional chaining with assignment
user?.profile.name = 'Alice'; // SyntaxError — can't assign through ?.
```
""",

10: """## Interview Simulation: JavaScript Fundamentals

This session is a full mock interview covering JavaScript fundamentals. Study the Q&A patterns, not just the answers.

### Core Concept Questions

**Q: Explain the difference between `==` and `===`.**

A: `===` (strict equality) compares both value and type — no coercion. `==` (loose equality) coerces types before comparing. The coercion rules are complex and surprising:

```javascript
0 == false    // true  (false coerced to 0)
'' == false   // true  (both coerce to 0)
null == undefined // true (special rule)
null == false // false (null only equals null/undefined)
[] == false   // true  ([] → '' → 0, false → 0)
[] == ![]     // true  (![] is false → 0, [] → 0)

// Always use === unless you specifically need type coercion
// Acceptable use: null check
if (value == null) { /* catches both null and undefined */ }
```

**Q: What is event delegation and why is it useful?**

```javascript
// Without delegation: listener on every button (expensive)
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', handleClick);
});

// With delegation: one listener on parent
document.getElementById('btn-container').addEventListener('click', (e) => {
  const btn = e.target.closest('.btn');
  if (!btn) return;
  const action = btn.dataset.action;
  handleAction(action);
});
// Benefits: works for dynamically added elements, uses less memory
```

**Q: Implement `debounce`.**

```javascript
function debounce(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// Usage:
const debouncedSearch = debounce((query) => {
  fetchResults(query);
}, 300);
input.addEventListener('input', e => debouncedSearch(e.target.value));
// Only fires 300ms after typing stops
```

**Q: Implement `throttle`.**

```javascript
function throttle(fn, limit) {
  let lastRun = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastRun >= limit) {
      lastRun = now;
      return fn.apply(this, args);
    }
  };
}

// Usage: fire at most once per 100ms during scroll
window.addEventListener('scroll', throttle(updateScrollPosition, 100));
```

**Q: What will this output?**

```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(function() { console.log(i); }, i * 100);
}
// Answer: 3, 3, 3 (after 0ms, 100ms, 200ms)
// var is function-scoped; all callbacks share the same i
// By the time callbacks run, loop has finished and i = 3
```

**Q: Explain `call`, `apply`, and `bind`.**

```javascript
function introduce(greeting, punctuation) {
  return `${greeting}, I'm ${this.name}${punctuation}`;
}
const person = { name: 'Alice' };

introduce.call(person, 'Hello', '!');     // 'Hello, I'm Alice!'
introduce.apply(person, ['Hi', '.']);      // 'Hi, I'm Alice.'
const intro = introduce.bind(person, 'Hey'); // partial: greeting fixed
intro('?');                                // 'Hey, I'm Alice?'
```

**Q: What is the output?**

```javascript
async function a() {
  console.log('1');
  await Promise.resolve();
  console.log('3');
}
console.log('before');
a();
console.log('2');
// Output: before → 1 → 2 → 3
// Explanation: 'before' and 'before call a' are sync.
// a() starts, logs '1', hits await (schedules microtask), returns.
// '2' logs sync. Microtask runs: '3' logs.
```

### Coding Challenges

**Implement `deepEqual`:**

```javascript
function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return false;
  if (typeof a !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  return keysA.every(key => deepEqual(a[key], b[key]));
}

deepEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } }); // true
deepEqual([1, [2, 3]], [1, [2, 4]]);  // false
```

**Implement `flatten`:**

```javascript
// Recursive:
function flatten(arr, depth = Infinity) {
  return arr.reduce((flat, item) =>
    flat.concat(Array.isArray(item) && depth > 0
      ? flatten(item, depth - 1)
      : item),
    []);
}

// Native:
[1, [2, [3, [4]]]].flat(Infinity); // [1, 2, 3, 4]
```

**Implement `groupBy`:**

```javascript
function groupBy(arr, keyFn) {
  return arr.reduce((acc, item) => {
    const key = typeof keyFn === 'function' ? keyFn(item) : item[keyFn];
    acc[key] = acc[key] ? [...acc[key], item] : [item];
    return acc;
  }, {});
}

groupBy([1,2,3,4,5], n => n % 2 === 0 ? 'even' : 'odd');
// { odd: [1,3,5], even: [2,4] }
```

### Key Takeaways for Interviews

1. Always explain the "why" — not just what the code does, but why it behaves that way
2. Mention edge cases: `null`, empty arrays, `undefined`, type coercion
3. Know the complexity: `Array.flat` is O(n·d), `deepEqual` is O(n) for balanced trees
4. When asked about async: always mention the event loop and microtask vs macrotask distinction
5. For `this` questions: state which of the four rules applies
"""
}

for session in sessions:
    snum = session["sessionNumber"]
    if snum in CONTENT:
        session["content"] = CONTENT[snum]

with open(PATH, "w") as f:
    json.dump(data, f, separators=(",", ":"))

added = sum(1 for s in sessions if "content" in s and len(s["content"]) > 100)
print(f"JavaScript: updated {added}/10 sessions")
for s in sessions:
    print(f"  Session {s['sessionNumber']}: {len(s.get('content',''))} chars")
