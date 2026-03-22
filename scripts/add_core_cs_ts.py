#!/usr/bin/env python3
"""Add content to TypeScript sessions (topic index 1)."""
import json

PATH = "/Users/racit/PersonalProject/guru-sishya/public/content/core-cs.json"

with open(PATH) as f:
    data = json.load(f)

idx = next(i for i, d in enumerate(data) if d["id"] == "typescript")
sessions = data[idx]["plan"]["sessions"]

CONTENT = {
1: """## TypeScript Mental Model and Setup

TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. The key mental model: TypeScript exists only at compile time. At runtime, it's JavaScript — all type information is erased.

### Why TypeScript Exists

```typescript
// JavaScript: no safety net
function getUser(id) {
  return fetch(`/api/users/${id}`).then(r => r.json());
}
getUser(); // no error at write time, runtime crash: /api/users/undefined

// TypeScript: catches this at compile time
function getUser(id: number): Promise<User> {
  return fetch(`/api/users/${id}`).then(r => r.json());
}
getUser(); // Error: Expected 1 arguments, but got 0
```

### The Type System at a Glance

TypeScript's type system is **structural** (duck typing), not nominal (name-based). A type is compatible with another if it has all the required properties.

```typescript
interface Point { x: number; y: number; }

// Works: has x and y, even though it wasn't declared as Point
const p = { x: 1, y: 2, label: 'origin' };
function printPoint(point: Point) { console.log(point.x, point.y); }
printPoint(p); // OK — structural compatibility

// Contrast with nominal typing (Java/C#): would require explicit implements Point
```

### Basic Types

```typescript
// Primitives
let name: string = 'Alice';
let age: number = 30;
let active: boolean = true;
let nothing: null = null;
let notDefined: undefined = undefined;
let anyVal: any = 'can be anything'; // escape hatch — avoid!
let unknown: unknown = 'safer than any'; // must narrow before use

// Arrays
let scores: number[] = [95, 87, 92];
let tags: Array<string> = ['ts', 'react'];

// Tuples: fixed-length, typed positions
let point: [number, number] = [10, 20];
let entry: [string, number] = ['Alice', 30];
const [x, y] = point; // fully typed

// Object types
let user: { id: number; name: string; email?: string } = { id: 1, name: 'Alice' };
// email is optional (?: means can be string | undefined)
```

### tsconfig.json Essentials

```json
{
  "compilerOptions": {
    "target": "ES2022",          // output JS version
    "module": "ESNext",          // module system
    "moduleResolution": "bundler", // how imports resolve
    "strict": true,              // enables all strict checks (ALWAYS use this)
    "noUncheckedIndexedAccess": true, // arr[0] has type T | undefined
    "exactOptionalPropertyTypes": true, // { a?: string } ≠ { a: string | undefined }
    "noImplicitReturns": true,   // all code paths must return
    "noFallthroughCasesInSwitch": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "lib": ["ES2022", "DOM"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Type Inference

TypeScript infers types — you don't always need to annotate:

```typescript
// Inferred — no annotation needed
const name = 'Alice';        // string
const age = 30;              // number
const tags = ['ts', 'js'];  // string[]
const user = { id: 1, name: 'Alice' }; // { id: number; name: string }

// Inferred from function return:
function double(n: number) { return n * 2; } // inferred return: number

// When to annotate:
// 1. Function parameters (always)
// 2. When inference is wrong or too wide
// 3. Public API / exported functions
// 4. Complex objects where you want to enforce structure
interface User { id: number; name: string; role: 'admin' | 'user'; }
const createUser = (name: string): User => ({ id: Math.random(), name, role: 'user' });
```

### Interview Q&A

**Q: What is the difference between `any` and `unknown`?**
A: Both can hold any value. The difference is what you can do with them. `any` bypasses all type checking — you can call methods, access properties, pass it anywhere without error. `unknown` requires you to narrow the type (via type guards, instanceof, typeof) before using it. `unknown` is the type-safe alternative to `any` for truly unknown values.

**Q: Is TypeScript a runtime type system?**
A: No. TypeScript's type system is entirely compile-time. After compilation, all type annotations, interfaces, and generics are erased. At runtime, you have plain JavaScript. This means TypeScript cannot validate data from external sources (APIs, databases) at runtime — you need runtime validation libraries like Zod or io-ts for that.

**Q: What does `strict: true` enable?**
A: It enables a group of strict checks: `strictNullChecks` (null/undefined not assignable to other types), `strictFunctionTypes`, `strictPropertyInitialization`, `noImplicitAny`, `noImplicitThis`, `strictBindCallApply`, and `alwaysStrict`. The most impactful is `strictNullChecks` — without it, `null` and `undefined` can be assigned to any type, defeating much of TypeScript's safety.

### Common Mistakes

```typescript
// Mistake: using any liberally
function process(data: any) {
  data.nonExistent.method(); // no error! defeats TypeScript
}

// Fix: use unknown and narrow
function process(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    console.log((data as { value: string }).value);
  }
}

// Mistake: type assertion instead of proper typing
const el = document.getElementById('btn') as HTMLButtonElement; // risky if null
// Fix:
const el = document.getElementById('btn');
if (el instanceof HTMLButtonElement) {
  el.disabled = true; // safe
}
```
""",

2: """## Types, Interfaces, Union and Intersection Types

These are the core building blocks of TypeScript's type system. Mastering them is essential for writing expressive, maintainable typed code.

### type vs interface

Both define object shapes. The key differences:

```typescript
// interface: extendable, mergeable (declaration merging)
interface User {
  id: number;
  name: string;
}
interface User {          // Declaration merging! Adds to existing
  email: string;
}
// Now User has id, name, AND email

interface Admin extends User {
  permissions: string[];
}

// type: more flexible, can represent any type
type ID = number | string;
type Callback = (error: Error | null, result: unknown) => void;
type Nullable<T> = T | null;
type Point = { x: number; y: number };

// When to use which:
// - Prefer interface for object types that will be extended or implemented
// - Use type for unions, intersections, primitives, tuples, functions
// - In practice: either works for most object shapes; be consistent
```

### Union Types

A value that can be one of several types:

```typescript
type Status = 'idle' | 'loading' | 'success' | 'error';
type ID = number | string;
type MaybeUser = User | null;

function handleStatus(status: Status) {
  // TypeScript knows all possible values
  switch (status) {
    case 'idle':    return 'Waiting...';
    case 'loading': return 'Loading...';
    case 'success': return 'Done!';
    case 'error':   return 'Failed!';
    // No default needed — exhaustive
  }
}

// Real-world: discriminated union (covered deeply in session 7)
type ApiResult<T> =
  | { status: 'success'; data: T }
  | { status: 'error'; error: string; code: number };
```

### Intersection Types

Combine multiple types — the result must satisfy ALL of them:

```typescript
type Timestamped = { createdAt: Date; updatedAt: Date };
type SoftDeletable = { deletedAt: Date | null; isDeleted: boolean };

type BaseEntity = Timestamped & SoftDeletable & { id: number };

interface Product {
  name: string;
  price: number;
}

type ProductEntity = Product & BaseEntity;
// Has: id, name, price, createdAt, updatedAt, deletedAt, isDeleted

// Practical: extending props in React
type ButtonBaseProps = {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
};
type ButtonProps = ButtonBaseProps & React.HTMLAttributes<HTMLButtonElement>;
```

### Literal Types and Template Literal Types

```typescript
// String literals as types
type Direction = 'north' | 'south' | 'east' | 'west';
type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Template literal types (TS 4.1+)
type EventName = 'click' | 'focus' | 'blur';
type HandlerName = `on${Capitalize<EventName>}`; // 'onClick' | 'onFocus' | 'onBlur'

type Route = '/users' | '/posts' | '/comments';
type ApiRoute = `/api/v1${Route}`; // '/api/v1/users' | '/api/v1/posts' | ...

// Very useful for object keys:
type CSSProperty = 'margin' | 'padding' | 'border';
type CSSDirectional = `${CSSProperty}-${'top' | 'right' | 'bottom' | 'left'}`;
// 'margin-top' | 'margin-right' | ... | 'border-bottom' | 'border-left'
```

### keyof and typeof

```typescript
const config = {
  theme: 'dark',
  language: 'en',
  fontSize: 16,
} as const; // makes values readonly and literal

type ConfigKey = keyof typeof config; // 'theme' | 'language' | 'fontSize'
type ConfigValue = typeof config[ConfigKey]; // 'dark' | 'en' | 16

// Use keyof to constrain keys:
function getConfig<K extends keyof typeof config>(key: K): typeof config[K] {
  return config[key]; // return type is inferred correctly!
}
getConfig('theme');    // type: 'dark'
getConfig('fontSize'); // type: 16
getConfig('invalid');  // Error: not a key of config
```

### Interface Inheritance

```typescript
interface Shape {
  color: string;
  area(): number;
}

interface Circle extends Shape {
  radius: number;
  area(): number; // can narrow/override
}

interface ColoredCircle extends Circle {
  borderColor: string;
}

// Implementing in classes:
class CircleImpl implements Circle {
  constructor(public color: string, public radius: number) {}
  area() { return Math.PI * this.radius ** 2; }
}
```

### Interview Q&A

**Q: What is the difference between `type` and `interface` in TypeScript?**
A: Both define object shapes, but `interface` supports declaration merging (defining the same interface twice merges them) and is typically preferred for objects that will be extended or implemented by classes. `type` is more flexible — it can represent unions, intersections, primitives, tuples, and mapped types. For simple object shapes, either works; the important thing is consistency within a codebase.

**Q: What is a union type and when would you use it?**
A: A union type (`A | B`) means a value can be of type A or type B. Use it when a value legitimately can be multiple types: function parameters that accept strings or numbers, nullable values (`User | null`), discriminated unions for state modeling (`{status: 'loading'} | {status: 'success', data: T}`).

**Q: What is the difference between `|` (union) and `&` (intersection)?**
A: Union (`|`) means OR — the value must satisfy at least one type. Intersection (`&`) means AND — the value must satisfy all types. `string | number` accepts either; `{a: string} & {b: number}` requires both `a` and `b`.

### Common Mistakes

```typescript
// Mistake: intersection of primitive types creates never
type StringAndNumber = string & number; // never — impossible!

// Mistake: optional vs undefined
interface Config {
  timeout?: number;      // optional: can be omitted entirely
  retries: number | undefined; // required, but value can be undefined
}
const c1: Config = { retries: undefined }; // OK
const c2: Config = {};                      // Error: retries is required

// With exactOptionalPropertyTypes: true, these are even more distinct
```
""",

3: """## Generics

Generics are TypeScript's mechanism for writing reusable code that works with multiple types while maintaining full type safety. They are arguably the most important TypeScript feature.

### Basic Generics

```typescript
// Without generics: lose type information
function identity(arg: any): any { return arg; }
const result = identity(42); // type: any — useless

// With generics: type flows through
function identity<T>(arg: T): T { return arg; }
const n = identity(42);       // type: number
const s = identity('hello');  // type: string
const arr = identity([1,2,3]); // type: number[]
```

### Generic Constraints

```typescript
// Constrain T to types with certain properties
function getLength<T extends { length: number }>(arg: T): number {
  return arg.length;
}
getLength('hello');     // 5
getLength([1, 2, 3]);   // 3
getLength({ length: 10, name: 'test' }); // 10
getLength(42);          // Error: number doesn't have length

// Constrain to keys of an object
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
const user = { name: 'Alice', age: 30 };
getProperty(user, 'name'); // type: string
getProperty(user, 'age');  // type: number
getProperty(user, 'foo');  // Error: 'foo' is not a key of user
```

### Generic Interfaces and Classes

```typescript
// Generic interface
interface Repository<T, ID = number> {
  findById(id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: ID): Promise<void>;
}

// Implementing:
interface User { id: number; name: string; email: string; }

class UserRepository implements Repository<User> {
  async findById(id: number): Promise<User | null> {
    const row = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return row ?? null;
  }
  async findAll(): Promise<User[]> {
    return db.query('SELECT * FROM users');
  }
  async save(user: User): Promise<User> {
    return db.upsert('users', user);
  }
  async delete(id: number): Promise<void> {
    await db.query('DELETE FROM users WHERE id = $1', [id]);
  }
}

// Generic class: Stack
class Stack<T> {
  private items: T[] = [];

  push(item: T): void { this.items.push(item); }
  pop(): T | undefined { return this.items.pop(); }
  peek(): T | undefined { return this.items[this.items.length - 1]; }
  get size(): number { return this.items.length; }
  isEmpty(): boolean { return this.items.length === 0; }
}

const numberStack = new Stack<number>();
numberStack.push(1);
numberStack.push(2);
numberStack.pop(); // type: number | undefined
```

### Generic Functions in Practice

```typescript
// API response wrapper
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
  timestamp: string;
}

async function apiGet<T>(url: string): Promise<ApiResponse<T>> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Usage: T is inferred from the expected return type
interface User { id: number; name: string; }
const { data: user } = await apiGet<User>('/api/users/1');
user.name; // type: string — fully typed!

// Event emitter with generic events
type EventMap = {
  'user:login': { userId: string; timestamp: Date };
  'user:logout': { userId: string };
  'order:placed': { orderId: string; total: number };
};

class TypedEmitter<Events extends Record<string, unknown>> {
  private handlers: Partial<{ [K in keyof Events]: ((data: Events[K]) => void)[] }> = {};

  on<K extends keyof Events>(event: K, handler: (data: Events[K]) => void) {
    const handlers = this.handlers[event] ?? [];
    this.handlers[event] = [...handlers, handler] as any;
  }

  emit<K extends keyof Events>(event: K, data: Events[K]) {
    this.handlers[event]?.forEach(h => h(data));
  }
}

const emitter = new TypedEmitter<EventMap>();
emitter.on('user:login', ({ userId, timestamp }) => {
  // userId: string, timestamp: Date — fully typed!
  console.log(`${userId} logged in at ${timestamp}`);
});
emitter.emit('user:login', { userId: '123', timestamp: new Date() });
emitter.emit('user:login', { userId: 123 }); // Error: number not assignable to string
```

### Generic Utility Functions

```typescript
// Grouping
function groupBy<T, K extends string | number | symbol>(
  arr: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return arr.reduce((acc, item) => {
    const key = keyFn(item);
    acc[key] = [...(acc[key] ?? []), item];
    return acc;
  }, {} as Record<K, T[]>);
}

const users = [
  { name: 'Alice', role: 'admin' },
  { name: 'Bob', role: 'user' },
  { name: 'Carol', role: 'admin' },
];
const byRole = groupBy(users, u => u.role);
// { admin: [Alice, Carol], user: [Bob] } — fully typed

// Memoize with generics
function memoize<Args extends unknown[], R>(
  fn: (...args: Args) => R
): (...args: Args) => R {
  const cache = new Map<string, R>();
  return (...args: Args): R => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key)!;
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

const expensiveCalc = memoize((x: number, y: number): number => x ** y);
expensiveCalc(2, 10); // computed
expensiveCalc(2, 10); // cached — type: number
```

### Interview Q&A

**Q: What are generics and why are they useful?**
A: Generics let you write functions, classes, and interfaces that work with multiple types while preserving type information. Without generics, you'd have to use `any` (losing type safety) or write duplicate code for each type. With generics, you write the logic once and the type system tracks the specific type at each call site.

**Q: What is the difference between `T extends object` and `T extends {}`?**
A: `T extends object` constrains T to object types (not primitives). `T extends {}` means T must have all properties of `{}` — which in TypeScript means non-null, non-undefined. In practice, `T extends {}` accepts strings, numbers, and objects (but not null/undefined), while `T extends object` excludes primitives. For a truly unconstrained generic, omit the constraint entirely.

**Q: How do you infer the return type of a generic function?**
A: TypeScript infers generic type parameters from the arguments provided. If you call `identity(42)`, TypeScript infers `T = number` from the argument. You can also provide explicit type arguments: `identity<number>(42)`. The `ReturnType<typeof fn>` utility type can also extract a function's return type statically.

### Common Mistakes

```typescript
// Mistake: unnecessary any in generic constraints
function process<T>(items: T[]): any[] { // lost type info on return!
  return items.map(item => item);
}
// Fix:
function process<T>(items: T[]): T[] { return items.map(item => item); }

// Mistake: forgetting that generic defaults don't constrain
interface Box<T = unknown> {
  value: T;
}
const box: Box = { value: 42 }; // T = unknown, so value is unknown
box.value.toFixed(); // Error: must narrow unknown first

// Fix: use the generic or constrain properly
const box: Box<number> = { value: 42 };
box.value.toFixed(2); // OK
```
""",

4: """## Built-in Utility Types

TypeScript ships with a rich set of utility types that transform existing types. These eliminate the need to write many type transformations manually and are constantly used in production TypeScript code.

### Partial, Required, Readonly

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

// Partial<T>: makes all properties optional
type PartialUser = Partial<User>;
// { id?: number; name?: string; email?: string; role?: 'admin' | 'user' }

// Real-world: update functions accept partial objects
function updateUser(id: number, updates: Partial<User>): Promise<User> {
  return db.update('users', id, updates);
}
updateUser(1, { name: 'Alice Updated' }); // only name, rest unchanged

// Required<T>: makes all properties required (opposite of Partial)
type RequiredUser = Required<PartialUser>; // back to full User

// Readonly<T>: prevents mutation
type ReadonlyUser = Readonly<User>;
const user: ReadonlyUser = { id: 1, name: 'Alice', email: 'a@example.com', role: 'user' };
user.name = 'Bob'; // Error: Cannot assign to 'name' because it is a read-only property
```

### Pick, Omit, Record

```typescript
// Pick<T, K>: select only specified properties
type UserPreview = Pick<User, 'id' | 'name'>;
// { id: number; name: string }

// Useful for API response shapes:
type UserPublicProfile = Pick<User, 'id' | 'name'>;
type UserAdminView = Pick<User, 'id' | 'name' | 'email' | 'role'>;

// Omit<T, K>: exclude specified properties
type UserWithoutId = Omit<User, 'id'>;
// { name: string; email: string; role: 'admin' | 'user' }

type CreateUserInput = Omit<User, 'id'>; // id is auto-generated
type UpdateUserInput = Partial<Omit<User, 'id'>>; // optional, no id

// Record<K, V>: create type with keys K and values V
type RolePermissions = Record<'admin' | 'user' | 'guest', string[]>;
const permissions: RolePermissions = {
  admin: ['read', 'write', 'delete'],
  user: ['read', 'write'],
  guest: ['read'],
};

type UserMap = Record<number, User>;
const cache: UserMap = { 1: { id: 1, name: 'Alice', email: 'a@b.com', role: 'user' } };
```

### Extract, Exclude, NonNullable

```typescript
type Status = 'active' | 'inactive' | 'pending' | 'banned';

// Extract<T, U>: keep only types assignable to U
type ActiveStatuses = Extract<Status, 'active' | 'pending'>;
// 'active' | 'pending'

// Exclude<T, U>: remove types assignable to U
type ValidStatuses = Exclude<Status, 'banned'>;
// 'active' | 'inactive' | 'pending'

// NonNullable<T>: remove null and undefined
type MaybeUser = User | null | undefined;
type DefiniteUser = NonNullable<MaybeUser>; // User

// Real-world:
type EventTypes = 'click' | 'focus' | 'blur' | 'change' | 'submit';
type FormEvents = Extract<EventTypes, 'change' | 'submit' | 'focus' | 'blur'>;
// Only form-relevant events
```

### ReturnType, Parameters, ConstructorParameters

```typescript
// ReturnType<T>: extract the return type of a function type
async function fetchUser(id: number): Promise<User> {
  return db.findOne('users', id);
}
type FetchUserReturn = ReturnType<typeof fetchUser>; // Promise<User>
type ResolvedUser = Awaited<ReturnType<typeof fetchUser>>; // User

// Parameters<T>: extract parameter types as a tuple
function createOrder(userId: number, items: string[], discount: number): Order {
  // ...
}
type CreateOrderParams = Parameters<typeof createOrder>;
// [userId: number, items: string[], discount: number]

// Use in higher-order functions:
function withLogging<T extends (...args: unknown[]) => unknown>(fn: T) {
  return (...args: Parameters<T>): ReturnType<T> => {
    console.log('Calling with:', args);
    const result = fn(...args);
    console.log('Result:', result);
    return result as ReturnType<T>;
  };
}

// ConstructorParameters<T>: for class constructors
class HttpClient {
  constructor(baseUrl: string, timeout: number, headers: Record<string, string>) {}
}
type HttpClientArgs = ConstructorParameters<typeof HttpClient>;
// [baseUrl: string, timeout: number, headers: Record<string, string>]
```

### Awaited and Infer

```typescript
// Awaited<T>: recursively unwrap Promise types
type A = Awaited<Promise<string>>;                    // string
type B = Awaited<Promise<Promise<number>>>;            // number
type C = Awaited<ReturnType<typeof fetchUser>>;        // User

// infer: extract types within conditional types
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type UnwrapArray<T> = T extends (infer U)[] ? U : T;
type FirstArg<T> = T extends (first: infer F, ...rest: unknown[]) => unknown ? F : never;

type Foo = UnwrapPromise<Promise<string>>;  // string
type Bar = UnwrapArray<number[]>;           // number
type Baz = FirstArg<(x: number, y: string) => void>; // number
```

### Interview Q&A

**Q: What is the difference between `Pick` and `Omit`?**
A: `Pick<T, K>` creates a type containing only the specified keys from `T`. `Omit<T, K>` creates a type containing all keys from `T` except the specified ones. Use `Pick` when you want a small subset; use `Omit` when you want most properties but need to exclude a few.

**Q: When would you use `Partial<T>` vs defining optional properties directly?**
A: `Partial<T>` is most useful when you already have a complete type and need a variant where everything is optional — like update/patch payloads. Defining optional properties directly (`{name?: string}`) is better when you're designing the type from scratch and some properties are inherently optional.

**Q: What does `Awaited<T>` do?**
A: It recursively unwraps Promise types. `Awaited<Promise<string>>` is `string`, `Awaited<Promise<Promise<number>>>` is `number`. It's essential for extracting the resolved type of async functions: `Awaited<ReturnType<typeof asyncFn>>`.

### Common Mistakes

```typescript
// Mistake: Omit with union types (doesn't distribute like you'd expect)
type Shape = { kind: 'circle'; radius: number } | { kind: 'square'; side: number };
type OmitKind = Omit<Shape, 'kind'>;
// Result: { radius?: number; side?: number } — not what you want!

// Fix: use a distributive mapped type
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type OmitKindCorrect = DistributiveOmit<Shape, 'kind'>;
// { radius: number } | { side: number } — correct!

// Mistake: forgetting Awaited when using ReturnType on async functions
async function getUser() { return { id: 1, name: 'Alice' }; }
type Bad = ReturnType<typeof getUser>; // Promise<{id: number, name: string}>
type Good = Awaited<ReturnType<typeof getUser>>; // {id: number, name: string}
```
""",

5: """## Type Narrowing and Type Guards

Type narrowing is how TypeScript refines a broad type into a more specific one within a code block. It is the primary mechanism for working safely with union types and `unknown`.

### Built-in Narrowing

```typescript
function process(value: string | number | null) {
  // typeof narrowing
  if (typeof value === 'string') {
    value.toUpperCase(); // string methods available
    return value.trim();
  }
  if (typeof value === 'number') {
    return value.toFixed(2); // number methods available
  }
  // TypeScript knows value is null here
  return 'null value';
}

// instanceof narrowing
function formatError(err: Error | string) {
  if (err instanceof Error) {
    return `${err.name}: ${err.message}`; // Error properties
  }
  return err.toUpperCase(); // string methods
}

// Truthiness narrowing
function process(value: string | null | undefined) {
  if (value) {
    // value is string (not null/undefined/empty-string)
    return value.trim();
  }
  return '';
}

// Note: '' is falsy! Use explicit null check if empty string is valid:
if (value !== null && value !== undefined) { /* value is string */ }
// or:
if (value != null) { /* value is string (null == undefined) */ }
```

### Discriminated Unions (Exhaustive Narrowing)

```typescript
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; side: number }
  | { kind: 'rectangle'; width: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'square':
      return shape.side ** 2;
    case 'rectangle':
      return shape.width * shape.height;
    default:
      // Exhaustiveness check: if a new shape is added and not handled,
      // TypeScript will error here at compile time
      const _exhaustive: never = shape;
      throw new Error(`Unhandled shape: ${JSON.stringify(_exhaustive)}`);
  }
}
```

### Custom Type Guards

```typescript
// Type predicate: arg is T
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value && typeof (value as any).id === 'number' &&
    'name' in value && typeof (value as any).name === 'string' &&
    'email' in value && typeof (value as any).email === 'string'
  );
}

// Usage:
async function fetchAndProcess(url: string) {
  const data = await fetch(url).then(r => r.json()); // type: unknown (with noImplicitAny)
  if (isUser(data)) {
    // data is User here — all User properties available
    console.log(`Hello, ${data.name}!`);
  }
}

// Assertion functions (throw if not satisfied)
function assertIsString(val: unknown): asserts val is string {
  if (typeof val !== 'string') throw new Error(`Expected string, got ${typeof val}`);
}

function assertIsUser(val: unknown): asserts val is User {
  if (!isUser(val)) throw new Error('Not a valid User');
}

// Usage:
assertIsUser(apiResponse); // throws if invalid
apiResponse.name; // type narrowed to User after assertion
```

### The `in` Operator

```typescript
interface Cat { meow(): void; }
interface Dog { bark(): void; }

function makeSound(animal: Cat | Dog) {
  if ('meow' in animal) {
    animal.meow(); // Cat
  } else {
    animal.bark(); // Dog
  }
}

// Real-world: API responses with different shapes
type SuccessResponse = { status: 'success'; data: User[] };
type ErrorResponse   = { status: 'error'; message: string; code: number };
type Response = SuccessResponse | ErrorResponse;

function handleResponse(response: Response) {
  if (response.status === 'success') {
    // Discriminated union — TypeScript knows it's SuccessResponse
    processUsers(response.data);
  } else {
    // TypeScript knows it's ErrorResponse
    showError(response.message, response.code);
  }
}
```

### Runtime Validation with Zod

For API responses, you need runtime validation. Zod provides TypeScript-first schema validation:

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number().positive(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['admin', 'user']),
  createdAt: z.string().datetime(),
});

type User = z.infer<typeof UserSchema>; // derive type from schema!

async function fetchUser(id: number): Promise<User> {
  const raw = await fetch(`/api/users/${id}`).then(r => r.json());
  return UserSchema.parse(raw); // throws if invalid — runtime safety
  // or: UserSchema.safeParse(raw) — returns {success, data/error}
}
```

### Interview Q&A

**Q: What is a type guard?**
A: A type guard is a function or expression that narrows a type within a code block. Built-in guards: `typeof`, `instanceof`, `in` operator, truthiness checks. Custom type guards are functions with a return type of `paramName is Type` — when they return true, TypeScript narrows the parameter to that type in the if block.

**Q: What is the difference between type narrowing and type assertion?**
A: Type narrowing is TypeScript proving the type from your code's logic — it's safe and backed by control flow analysis. Type assertion (`as Type`) is you telling the compiler "trust me, I know this is X" — it bypasses type checking and can cause runtime errors if wrong. Always prefer narrowing; use assertion only when you have information TypeScript can't infer.

**Q: What is an exhaustiveness check?**
A: Assigning a narrowed value to `never` inside a `switch/if` default case. `never` means a value that should never exist. If you add a new variant to a discriminated union and forget to handle it in the switch, TypeScript errors because the unhandled variant isn't assignable to `never`. This is compile-time protection against missing cases.

### Common Mistakes

```typescript
// Mistake: type assertion instead of narrowing
function processApiData(data: unknown) {
  const user = data as User; // no safety! data could be anything
  user.name.toUpperCase(); // runtime error if data isn't actually a User
}

// Fix: validate at runtime
function processApiData(data: unknown) {
  const user = UserSchema.parse(data); // throws with clear error if invalid
  user.name.toUpperCase(); // safe
}

// Mistake: narrowing doesn't persist after async boundaries
async function process(value: string | null) {
  if (value !== null) {
    await someAsyncOp(); // TypeScript might not narrow after await in complex cases
    value.trim(); // might warn — re-check or capture before async op
  }
}
// Fix: capture the narrowed value
if (value !== null) {
  const safeValue = value; // captured as string
  await someAsyncOp();
  safeValue.trim(); // always string
}
```
""",

6: """## Strict Mode and Compiler Configuration

`strict: true` is the single most impactful tsconfig setting. This session explains what it enables and why each check matters in production code.

### What strict: true Enables

```json
{
  "compilerOptions": {
    "strict": true
    // Equivalent to enabling ALL of:
    // "strictNullChecks": true
    // "strictFunctionTypes": true
    // "strictBindCallApply": true
    // "strictPropertyInitialization": true
    // "noImplicitAny": true
    // "noImplicitThis": true
    // "alwaysStrict": true (adds "use strict" to output)
    // "useUnknownInCatchVariables": true (TS 4.4+)
  }
}
```

### strictNullChecks: The Most Important One

```typescript
// Without strictNullChecks: null/undefined assignable to everything (dangerous!)
let name: string = null; // OK without strictNullChecks — runtime crash!

// With strictNullChecks:
let name: string = null; // Error: Type 'null' is not assignable to type 'string'
let maybeName: string | null = null; // Explicit — OK

function getUser(id: number): User | null {
  return db.findById(id); // might return null
}

const user = getUser(1); // type: User | null
user.name; // Error: Object is possibly 'null' — must narrow first!

if (user !== null) {
  user.name; // OK — narrowed to User
}

// Or use optional chaining:
const name = user?.name; // string | undefined
```

### noImplicitAny

```typescript
// Without noImplicitAny: untyped parameters silently become any
function processData(data) { // data: any — no error
  data.anything(); // no error — defeats TypeScript
}

// With noImplicitAny:
function processData(data) { // Error: Parameter 'data' implicitly has an 'any' type
  // Must annotate:
}
function processData(data: unknown) { /* correct */ }
function processData(data: User[]) { /* more specific */ }
```

### strictFunctionTypes (Contravariance)

```typescript
// Function parameter types are contravariant — important for type safety
type Handler = (event: MouseEvent) => void;
type GenericHandler = (event: Event) => void;

// A handler that accepts any Event can be used where MouseEvent is expected
// (MouseEvent IS an Event — assignment is safe)
const generic: GenericHandler = (e) => console.log(e.type);
const typed: Handler = generic; // OK — MouseEvent extends Event

// But not vice versa — a handler that only accepts MouseEvent cannot be used
// where any Event might be passed
const mouseOnly: Handler = (e) => e.clientX; // uses MouseEvent-specific property
const wrong: GenericHandler = mouseOnly; // Error with strictFunctionTypes!
// Because: what if someone calls wrong(new Event('click'))? clientX would crash.
```

### strictPropertyInitialization

```typescript
// With strictPropertyInitialization, class properties must be initialized
class UserService {
  private db: Database; // Error: Property 'db' has no initializer

  // Fix 1: initialize in constructor
  private db: Database;
  constructor(db: Database) {
    this.db = db;
  }

  // Fix 2: initialize at declaration
  private db: Database = new Database();

  // Fix 3: use definite assignment assertion (!) — use sparingly
  private db!: Database; // telling TS: "I'll initialize this myself"
}
```

### Recommended Additional Strict Checks

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

```typescript
// noUncheckedIndexedAccess: arr[0] is T | undefined, not T
const arr: number[] = [1, 2, 3];
const first = arr[0]; // type: number | undefined (not just number)
first.toFixed(2); // Error: Object is possibly 'undefined'
if (first !== undefined) first.toFixed(2); // OK

// noImplicitReturns: all code paths must return
function getStatus(code: number): string {
  if (code === 200) return 'OK';
  if (code === 404) return 'Not Found';
  // Error: Not all code paths return a value
  // Fix: add return 'Unknown'; or throw
}

// exactOptionalPropertyTypes:
interface Config {
  timeout?: number;
}
const c: Config = { timeout: undefined }; // Error with exactOptionalPropertyTypes!
// undefined and "absent" are different: absent means key doesn't exist
```

### Interview Q&A

**Q: Why should `strict: true` always be enabled?**
A: `strict: true` enables the checks that make TypeScript actually useful as a safety net. Without `strictNullChecks`, null/undefined can sneak into any type, causing runtime errors TypeScript should have caught. Without `noImplicitAny`, untyped code silently becomes `any`. These are the bugs TypeScript was designed to prevent.

**Q: What is `noUncheckedIndexedAccess` and why is it useful?**
A: Without it, accessing an array by index (`arr[0]`) has type `T`, even though the array might be empty. `noUncheckedIndexedAccess` makes index access return `T | undefined`, forcing you to handle the possibility that the element doesn't exist. This catches a common class of runtime errors: assuming an array is non-empty.

**Q: What is the `!` non-null assertion operator and when is it appropriate?**
A: `value!` tells TypeScript "I know this is not null/undefined, trust me." It's appropriate when you have information TypeScript can't infer — for example, after calling a library function that initializes a property. It should be used sparingly because it bypasses null safety. Prefer proper narrowing (`if (value !== null)`) whenever possible.

### Common Mistakes

```typescript
// Mistake: using ! to suppress errors instead of fixing them
function processUser(user: User | null) {
  console.log(user!.name); // dangerous! crashes if user is null
}
// Fix:
function processUser(user: User | null) {
  if (!user) return;
  console.log(user.name);
}

// Mistake: disabling strict in tsconfig to avoid fixing errors
{
  "compilerOptions": {
    "strict": false // NEVER do this in production code
  }
}
// Fix: address the type errors properly
```
""",

7: """## Conditional Types, Mapped Types, Template Literals

These are advanced TypeScript features used to build utility types and highly expressive APIs. They appear heavily in library type definitions and framework code.

### Conditional Types

```typescript
// Basic: T extends U ? X : Y
type IsString<T> = T extends string ? 'yes' : 'no';
type A = IsString<string>;  // 'yes'
type B = IsString<number>;  // 'no'
type C = IsString<string | number>; // 'yes' | 'no' — distributes over union!

// Distributive conditional types: when T is a naked type parameter,
// the condition distributes over each member of a union
type ToArray<T> = T extends unknown ? T[] : never;
type StringOrNumberArray = ToArray<string | number>; // string[] | number[]

// Prevent distribution with brackets:
type ToArrayNonDistributive<T> = [T] extends [unknown] ? T[] : never;
type Combined = ToArrayNonDistributive<string | number>; // (string | number)[]

// infer: extract type within conditional
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type Unpacked<T> =
  T extends (infer U)[]  ? U :
  T extends Promise<infer U> ? U :
  T;

type A2 = Unpacked<string[]>;          // string
type B2 = Unpacked<Promise<number>>;   // number
type C2 = Unpacked<string>;            // string (passthrough)
```

### Mapped Types

```typescript
// Map over keys of T
type ReadOnly<T> = {
  readonly [K in keyof T]: T[K];
};

type Optional<T> = {
  [K in keyof T]?: T[K];
};

// Modify the value type:
type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

type Promised<T> = {
  [K in keyof T]: Promise<T[K]>;
};

// Filter keys: use conditional types + never to remove properties
type PickByValue<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};

interface Mixed {
  id: number;
  name: string;
  active: boolean;
  count: number;
}
type OnlyStrings = PickByValue<Mixed, string>; // { name: string }
type OnlyNumbers = PickByValue<Mixed, number>; // { id: number; count: number }

// Remapping keys with `as`:
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

interface User { name: string; age: number; }
type UserGetters = Getters<User>;
// { getName: () => string; getAge: () => number; }
```

### Template Literal Types

```typescript
// Combine string literal types
type Locale = 'en' | 'fr' | 'de';
type Resource = 'user' | 'post' | 'comment';
type I18nKey = `${Locale}.${Resource}`; // 'en.user' | 'en.post' | ... (9 combinations)

// Event system:
type EventNames = 'change' | 'blur' | 'focus' | 'submit';
type FormHandlers = {
  [K in EventNames as `on${Capitalize<K>}`]: (event: Event) => void;
};
// { onChange: ...; onBlur: ...; onFocus: ...; onSubmit: ... }

// CSS-in-TypeScript:
type CSSUnit = 'px' | 'rem' | 'em' | 'vw' | 'vh' | '%';
type CSSValue = `${number}${CSSUnit}`;
// Can't actually enforce the number part at type level, but great for string literals:
type Spacing = '4px' | '8px' | '16px' | '24px' | '32px';

// Deep key access (common in form libraries):
type DeepKeys<T, Prefix extends string = ''> =
  T extends object
    ? { [K in keyof T & string]:
        | `${Prefix}${K}`
        | DeepKeys<T[K], `${Prefix}${K}.`>
      }[keyof T & string]
    : never;

interface Form { user: { name: string; email: string }; age: number; }
type FormPaths = DeepKeys<Form>; // 'user' | 'user.name' | 'user.email' | 'age'
```

### Interview Q&A

**Q: What are conditional types and how do they distribute over unions?**
A: Conditional types (`T extends U ? X : Y`) check if T is assignable to U. When T is a bare generic type parameter, conditional types distribute: `string | number extends string ? X : Y` evaluates as `(string extends string ? X : Y) | (number extends string ? X : Y)` = `X | Y`. Wrapping T prevents distribution: `[T] extends [string]` doesn't distribute.

**Q: What is the `infer` keyword?**
A: `infer` is used inside conditional types to capture a portion of the matched type. `T extends Promise<infer U> ? U : never` — if T is a Promise, infer (capture) its resolved type as U and return it. This is how `ReturnType`, `Parameters`, and `Awaited` are implemented in TypeScript's standard library.

**Q: What is the difference between mapped types and index signatures?**
A: Index signatures (`{ [key: string]: T }`) allow any string key with value T. Mapped types (`{ [K in keyof T]: ... }`) iterate over specific known keys of T. Mapped types are more precise — they preserve the exact set of keys from the source type, including optional/readonly modifiers.

### Common Mistakes

```typescript
// Mistake: unexpected distribution in conditional types
type IsArray<T> = T extends unknown[] ? true : false;
type Result = IsArray<string | number[]>; // true | false — distributed!
// May not be what you want if T is meant to be tested as a whole

// Fix: use tuple wrapping to prevent distribution
type IsArrayExact<T> = [T] extends [unknown[]] ? true : false;
type Result2 = IsArrayExact<string | number[]>; // false (the union is not an array)

// Mistake: forgetting that mapped types don't automatically distribute
type NullableValues<T> = { [K in keyof T]: T[K] | null };
// This works, but nested objects aren't made nullable — only top-level
```
""",

8: """## Declaration Files and Module Augmentation

Declaration files (`.d.ts`) describe the types of JavaScript code. Understanding them is essential for working with untyped libraries, extending third-party types, and publishing typed packages.

### What are Declaration Files?

```typescript
// math.js — plain JavaScript, no types
export function add(a, b) { return a + b; }
export const PI = 3.14159;

// math.d.ts — type declarations for math.js
export declare function add(a: number, b: number): number;
export declare const PI: number;

// Now TypeScript knows the types when you import math.js
import { add, PI } from './math';
add(1, 2); // type: number
```

### Writing Declaration Files

```typescript
// For a library that exposes a class, functions, and constants:

// mylib.d.ts
declare module 'mylib' {
  export interface Config {
    timeout?: number;
    retries?: number;
    baseUrl: string;
  }

  export interface Client {
    get<T>(path: string): Promise<T>;
    post<T>(path: string, body: unknown): Promise<T>;
    setHeader(key: string, value: string): void;
  }

  export function createClient(config: Config): Client;
  export const VERSION: string;
  export class HttpError extends Error {
    status: number;
    constructor(message: string, status: number);
  }
}
```

### @types/ Packages

Most popular libraries ship type definitions via `@types/`:

```bash
npm install --save-dev @types/node @types/express @types/lodash
```

These are community-maintained and live in [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped).

Modern libraries often ship their own types (`package.json` → `"types": "./dist/index.d.ts"`).

```typescript
// Check if a library has types:
// 1. Look for .d.ts files in node_modules/library-name/
// 2. Check if @types/library-name exists on npm
// 3. Check package.json for "types" or "typings" field
```

### Module Augmentation

Extend existing type definitions without modifying the original package:

```typescript
// Extend Express Request type to include authenticated user
// types/express.d.ts
import 'express';

declare module 'express' {
  interface Request {
    user?: {
      id: string;
      email: string;
      roles: string[];
    };
    requestId: string;
  }
}

// Now in your middleware:
app.use((req: Request, res: Response, next: NextFunction) => {
  req.user = { id: '123', email: 'a@b.com', roles: ['user'] };
  req.requestId = crypto.randomUUID();
  next();
});

// And in route handlers:
app.get('/profile', (req: Request, res: Response) => {
  const userId = req.user?.id; // fully typed!
});
```

### Ambient Declarations

```typescript
// Declare things that exist in the environment but not in TypeScript's types

// Global variables injected by bundler/environment:
declare const __DEV__: boolean;
declare const __VERSION__: string;
declare const process: { env: Record<string, string | undefined> };

// SVG imports (Webpack/Vite handles these, TypeScript needs to know):
declare module '*.svg' {
  const content: string;
  export default content;
}

// CSS Modules:
declare module '*.module.css' {
  const styles: Record<string, string>;
  export default styles;
}

// Environment variables in Vite:
interface ImportMeta {
  env: {
    VITE_API_URL: string;
    VITE_APP_NAME: string;
    MODE: 'development' | 'production' | 'test';
    DEV: boolean;
    PROD: boolean;
  };
}
```

### Interview Q&A

**Q: What is a `.d.ts` file and why is it needed?**
A: A `.d.ts` file contains only TypeScript type declarations — no runtime code. It tells the TypeScript compiler what types a JavaScript module exports, enabling type safety when consuming untyped JavaScript libraries. TypeScript uses them to provide IntelliSense, catch type errors, and enable refactoring — all without any runtime overhead.

**Q: What is module augmentation and when would you use it?**
A: Module augmentation lets you extend the type definitions of an existing module without modifying its source or declaration file. Common uses: adding properties to Express's `Request` type (for auth middleware), adding methods to a third-party class, or extending a library's config interface with custom options.

**Q: How do you handle a library that has no TypeScript types?**
A: Three options, in order of preference: (1) Install `@types/library-name` from DefinitelyTyped. (2) Write a minimal `.d.ts` declaration file yourself that covers the parts you use. (3) Last resort — add `declare module 'library-name';` which gives it type `any`, or use `// @ts-ignore`. Option 3 should be temporary.

### Common Mistakes

```typescript
// Mistake: module augmentation not working — missing import/export
// WRONG: this is an ambient module, not an augmentation
declare module 'express' {
  interface Request { user?: User; } // won't augment if no import
}

// CORRECT: file must be a module (have at least one import/export)
import 'express'; // makes this file a module
declare module 'express' {
  interface Request { user?: User; }
}

// Mistake: triple-slash references when imports suffice
/// <reference types="node" /> // only needed in .d.ts files
// In .ts files, just import what you need:
import { readFile } from 'fs/promises';
```
""",

9: """## TypeScript with React and Node.js

TypeScript in real projects means integrating with frameworks. This session covers the patterns you'll actually use daily.

### TypeScript with React

```typescript
// Component props: interface or type
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  children?: React.ReactNode;
}

// Functional component
const Button: React.FC<ButtonProps> = ({ label, onClick, variant = 'primary', disabled = false }) => (
  <button className={`btn btn-${variant}`} onClick={onClick} disabled={disabled}>
    {label}
  </button>
);

// Or prefer this pattern (avoids React.FC's implicit children):
function Button({ label, onClick, variant = 'primary', disabled = false }: ButtonProps) {
  return <button className={`btn btn-${variant}`} onClick={onClick} disabled={disabled}>{label}</button>;
}
```

### Typed Hooks

```typescript
// useState with type inference
const [count, setCount] = useState(0); // inferred: number
const [user, setUser] = useState<User | null>(null); // explicit when null initial

// useRef
const inputRef = useRef<HTMLInputElement>(null);
const handleFocus = () => inputRef.current?.focus(); // current: HTMLInputElement | null

// useReducer with discriminated union actions
type State = { count: number; status: 'idle' | 'loading' | 'error' };
type Action =
  | { type: 'increment'; amount: number }
  | { type: 'reset' }
  | { type: 'setStatus'; status: State['status'] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment': return { ...state, count: state.count + action.amount };
    case 'reset':     return { count: 0, status: 'idle' };
    case 'setStatus': return { ...state, status: action.status };
  }
}

// useContext
interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

// Generic custom hook
function useAsync<T>(asyncFn: () => Promise<T>) {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({ data: null, loading: false, error: null });

  useEffect(() => {
    setState(s => ({ ...s, loading: true }));
    asyncFn()
      .then(data => setState({ data, loading: false, error: null }))
      .catch(error => setState({ data: null, loading: false, error }));
  }, []);

  return state;
}
```

### TypeScript with Express / Node.js

```typescript
import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { z } from 'zod';

// Typed request handler
const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['admin', 'user']).default('user'),
});

type CreateUserBody = z.infer<typeof createUserSchema>;

// Type-safe route handler
const createUser: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createUserSchema.parse(req.body); // runtime + type validation
    const user = await userService.create(body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

// Typed middleware
const requireAuth: RequestHandler = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = verifyToken(token); // needs module augmentation (session 8)
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Generic async handler wrapper (eliminates try/catch boilerplate)
const asyncHandler = (fn: RequestHandler): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.post('/users', asyncHandler(createUser));
```

### Interview Q&A

**Q: How do you type a React component's props?**
A: Define an interface or type for the props and pass it as the parameter type. Prefer explicit function syntax over `React.FC` — `React.FC` adds implicit `children` (confusing) and has other subtle issues. Use `React.ReactNode` for slots that accept any React renderable content, `React.ReactElement` when you specifically need a React element (not string/number).

**Q: How do you handle typing for `useContext`?**
A: Create a typed context with `React.createContext<Type | undefined>(undefined)`, then write a custom hook that calls `useContext` and throws if the result is undefined (ensuring the hook is used within the provider). This gives consumers a guaranteed non-null typed value.

**Q: How do you integrate TypeScript with runtime validation?**
A: Use libraries like Zod or Yup. Define schemas that serve as both runtime validators and TypeScript type sources. `z.infer<typeof schema>` derives the TypeScript type from the schema automatically — no duplication between runtime checks and type annotations.

### Common Mistakes

```typescript
// Mistake: typing event handlers with generic Event
const handleClick = (e: Event) => { // too broad
  e.currentTarget.value; // Error: Event doesn't have value
};
// Fix: use the specific event type
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.currentTarget.disabled; // OK
};
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value; // string — correct
};

// Mistake: any in type assertion for API responses
const data = await fetch('/api').then(r => r.json() as User); // unsafe!
// Fix: validate at runtime
const raw = await fetch('/api').then(r => r.json());
const data = UserSchema.parse(raw); // throws if invalid
```
""",

10: """## Interview Simulation and Advanced Patterns

### Interview Question Bank

**Q: What is the difference between `interface` and `type`?**
A: Both define types. `interface` supports declaration merging and is preferred for public APIs and object shapes that may be extended. `type` is more flexible — it can represent unions, intersections, primitives, and mapped types. For object shapes, either works; be consistent. Key practical differences: `interface` can be re-opened (declaration merging); `type` cannot. `type` can use `|`, `&`, conditional types directly.

**Q: What are discriminated unions and why are they useful?**

```typescript
// Discriminated union: union of types each with a unique literal field
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

function render<T>(state: AsyncState<T>) {
  switch (state.status) {
    case 'idle':    return <Empty />;
    case 'loading': return <Spinner />;
    case 'success': return <Display data={state.data} />; // data is typed as T here!
    case 'error':   return <ErrorMsg error={state.error} />;
  }
}
// Benefits: exhaustive checking, no undefined access, self-documenting
```

**Q: Implement a type-safe `pick` function:**

```typescript
function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return keys.reduce((acc, key) => {
    acc[key] = obj[key];
    return acc;
  }, {} as Pick<T, K>);
}

const user = { id: 1, name: 'Alice', email: 'a@b.com', role: 'admin' as const };
const preview = pick(user, ['id', 'name']); // type: { id: number; name: string }
preview.email; // Error: Property 'email' does not exist on type Pick<...>
```

**Q: How does TypeScript handle excess property checking?**

```typescript
interface Config { timeout: number; retries: number; }

// Direct object literal — excess property check triggers:
const cfg: Config = { timeout: 1000, retries: 3, debug: true }; // Error!

// Assigned through variable — no excess property check:
const temp = { timeout: 1000, retries: 3, debug: true };
const cfg2: Config = temp; // OK — structural compatibility only

// This is a deliberate design choice:
// Object literals are likely typos, variables may legitimately have extra props
```

### Advanced Pattern: Builder with Method Chaining

```typescript
class QueryBuilder<T extends object> {
  private conditions: string[] = [];
  private selectedFields: (keyof T)[] = [];
  private limitValue: number = 100;

  select<K extends keyof T>(...fields: K[]): QueryBuilder<Pick<T, K>> {
    this.selectedFields = fields as (keyof T)[];
    return this as unknown as QueryBuilder<Pick<T, K>>;
  }

  where(condition: string): this {
    this.conditions.push(condition);
    return this;
  }

  limit(n: number): this {
    this.limitValue = n;
    return this;
  }

  build(): string {
    const fields = this.selectedFields.length ? this.selectedFields.join(', ') : '*';
    const where = this.conditions.length ? `WHERE ${this.conditions.join(' AND ')}` : '';
    return `SELECT ${fields} FROM table ${where} LIMIT ${this.limitValue}`;
  }
}
```

### Advanced Pattern: Branded Types

```typescript
// Prevent mixing up structurally identical types
type UserId = number & { readonly brand: unique symbol };
type OrderId = number & { readonly brand: unique symbol };

function createUserId(id: number): UserId { return id as UserId; }
function createOrderId(id: number): OrderId { return id as OrderId; }

function getUser(id: UserId): Promise<User> { /* ... */ }
function getOrder(id: OrderId): Promise<Order> { /* ... */ }

const userId = createUserId(123);
const orderId = createOrderId(456);

getUser(userId);   // OK
getUser(orderId);  // Error: OrderId is not assignable to UserId
getUser(123);      // Error: plain number is not UserId
```

### Advanced Pattern: Result Type (No Exceptions)

```typescript
type Ok<T>  = { ok: true; value: T };
type Err<E> = { ok: false; error: E };
type Result<T, E = Error> = Ok<T> | Err<E>;

function ok<T>(value: T): Ok<T>    { return { ok: true, value }; }
function err<E>(error: E): Err<E>  { return { ok: false, error }; }

async function parseUser(raw: unknown): Promise<Result<User, string>> {
  const result = UserSchema.safeParse(raw);
  if (!result.success) return err(result.error.message);
  return ok(result.data);
}

const result = await parseUser(apiResponse);
if (result.ok) {
  result.value.name; // User
} else {
  console.error(result.error); // string error message
}
```

### Key Interview Takeaways

1. TypeScript's type system is structural — compatibility is based on shape, not name
2. `strict: true` is non-negotiable for production code
3. Prefer narrowing (typeof, instanceof, discriminated unions) over assertions (`as`)
4. Use `unknown` instead of `any` for truly unknown values
5. Generics preserve type information; `any` destroys it
6. Utility types (Partial, Pick, Omit, Record) eliminate boilerplate — know them cold
7. Zod (or similar) bridges TypeScript's compile-time types with runtime validation
"""
}

for session in sessions:
    snum = session["sessionNumber"]
    if snum in CONTENT:
        session["content"] = CONTENT[snum]

with open(PATH, "w") as f:
    json.dump(data, f, separators=(",", ":"))

added = sum(1 for s in sessions if "content" in s and len(s["content"]) > 100)
print(f"TypeScript: updated {added}/10 sessions")
for s in sessions:
    print(f"  Session {s['sessionNumber']}: {len(s.get('content',''))} chars")
