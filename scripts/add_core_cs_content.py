#!/usr/bin/env python3
"""Add full lesson content to Core CS topics 6-10 in core-cs.json."""

import json

FILE_PATH = "/Users/racit/PersonalProject/guru-sishya/public/content/core-cs.json"

# ──────────────────────────────────────────────────────────────────────────────
# TOPIC 6: SQL
# ──────────────────────────────────────────────────────────────────────────────

SQL_CONTENT = """# SQL: Mastering Relational Databases

## Why SQL Still Dominates

SQL has been the lingua franca of data since 1974. Despite the NoSQL wave, 85 % of production systems still rely on a relational database for at least part of their data. Every backend engineer, data scientist, and architect must be able to write efficient queries, design schemas, and reason about transactions.

---

## 1. Joins — Combining Tables

Joins are the heart of relational algebra. Every join starts with two sets of rows and produces one result set.

### 1.1 INNER JOIN

Returns only rows where the condition matches in **both** tables.

```sql
-- Customers who have placed at least one order
SELECT c.name, o.total
FROM   customers c
INNER  JOIN orders o ON c.id = o.customer_id;
```

**Mental model**: Venn diagram — only the intersection.

### 1.2 LEFT OUTER JOIN

Returns all rows from the **left** table; fills NULLs for non-matching right rows.

```sql
-- All customers, with order totals where they exist
SELECT c.name, o.total
FROM   customers c
LEFT   JOIN orders o ON c.id = o.customer_id;
-- Customers with no orders: o.total = NULL
```

### 1.3 FULL OUTER JOIN

Returns all rows from both sides; NULLs fill missing matches on either side.

```sql
SELECT e.name, d.name AS dept
FROM   employees e
FULL   OUTER JOIN departments d ON e.dept_id = d.id;
```

### 1.4 CROSS JOIN

Cartesian product — every row in A paired with every row in B. Use deliberately (e.g., generating combinations).

```sql
-- Generate all (size, color) combinations for a product catalog
SELECT s.name AS size, c.name AS color
FROM   sizes s
CROSS  JOIN colors c;
```

**Warning**: A CROSS JOIN of 1 000 × 1 000 rows = 1 000 000 rows. Use with care.

### 1.5 SELF JOIN

A table joined to itself — useful for hierarchies.

```sql
-- Employee → Manager relationships
SELECT e.name AS employee, m.name AS manager
FROM   employees e
JOIN   employees m ON e.manager_id = m.id;
```

---

## 2. Subqueries

A subquery is a SELECT inside another SQL statement.

### Correlated vs Non-Correlated

```sql
-- Non-correlated: runs once
SELECT name FROM products
WHERE  price > (SELECT AVG(price) FROM products);

-- Correlated: runs once per outer row (can be slow!)
SELECT name FROM employees e
WHERE  salary > (
  SELECT AVG(salary) FROM employees
  WHERE  dept_id = e.dept_id   -- references outer query
);
```

### Scalar, Row, and Table subqueries

```sql
-- Scalar (returns one value)
SELECT name, price - (SELECT AVG(price) FROM products) AS diff
FROM   products;

-- IN / NOT IN (table subquery)
SELECT name FROM customers
WHERE  id NOT IN (SELECT customer_id FROM orders);
```

---

## 3. Common Table Expressions (CTEs)

CTEs make complex queries readable and are often better than subqueries.

```sql
WITH monthly_revenue AS (
  SELECT DATE_TRUNC('month', created_at) AS month,
         SUM(total)                       AS revenue
  FROM   orders
  GROUP  BY 1
),
ranked AS (
  SELECT month, revenue,
         RANK() OVER (ORDER BY revenue DESC) AS rnk
  FROM   monthly_revenue
)
SELECT month, revenue
FROM   ranked
WHERE  rnk <= 3;
```

**Recursive CTEs** — traverse hierarchies (org charts, file trees):

```sql
WITH RECURSIVE org AS (
  -- anchor: top of the tree
  SELECT id, name, manager_id, 0 AS depth
  FROM   employees
  WHERE  manager_id IS NULL

  UNION ALL

  -- recursive: join back to itself
  SELECT e.id, e.name, e.manager_id, o.depth + 1
  FROM   employees e
  JOIN   org o ON e.manager_id = o.id
)
SELECT * FROM org ORDER BY depth;
```

---

## 4. Window Functions

Window functions compute a value for each row using a "window" of related rows — **without collapsing them into a single row** like GROUP BY does.

```sql
SELECT
  name,
  dept,
  salary,
  AVG(salary)  OVER (PARTITION BY dept)                     AS dept_avg,
  RANK()       OVER (PARTITION BY dept ORDER BY salary DESC) AS dept_rank,
  LAG(salary)  OVER (ORDER BY hire_date)                    AS prev_hire_salary,
  SUM(salary)  OVER (ORDER BY hire_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
FROM employees;
```

**Key window functions**: `ROW_NUMBER`, `RANK`, `DENSE_RANK`, `NTILE`, `LAG`, `LEAD`, `FIRST_VALUE`, `LAST_VALUE`, `SUM/AVG/COUNT` with frame clauses.

---

## 5. Indexing

An index is a separate data structure (usually a B-Tree) that allows the database to find rows without a full table scan.

```sql
-- Create a composite index
CREATE INDEX idx_orders_customer_date
ON orders (customer_id, created_at DESC);

-- Partial index (only index rows that match a condition)
CREATE INDEX idx_active_users
ON users (email)
WHERE status = 'active';

-- Check if your query uses the index (PostgreSQL)
EXPLAIN ANALYZE
SELECT * FROM orders WHERE customer_id = 42 AND created_at > '2024-01-01';
```

**Index rules of thumb**:
- Index columns in WHERE, JOIN ON, and ORDER BY clauses.
- Composite index column order matters — leftmost prefix rule.
- Every index slows down writes; don't over-index.
- Covering index: all columns needed by the query are in the index — avoids heap fetch.

---

## 6. Query Optimization

```
Slow query diagnosis checklist:
1. EXPLAIN / EXPLAIN ANALYZE — find Seq Scan vs Index Scan, row estimates
2. Check missing indexes on join columns and filter columns
3. Avoid SELECT * — only fetch needed columns
4. Avoid functions on indexed columns in WHERE (prevents index use)
   BAD:  WHERE YEAR(created_at) = 2024
   GOOD: WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31'
4. Break large queries into CTEs for readability and sometimes performance
5. Use LIMIT for pagination; use keyset pagination for deep pages
6. Vacuum/Analyze tables regularly (PostgreSQL)
```

---

## 7. Transactions and ACID

A **transaction** is a unit of work that either fully succeeds or fully fails.

```sql
BEGIN;

UPDATE accounts SET balance = balance - 500 WHERE id = 1;
UPDATE accounts SET balance = balance + 500 WHERE id = 2;

-- If anything goes wrong:
ROLLBACK;

-- If everything is fine:
COMMIT;
```

**ACID properties**:

| Property | Meaning |
|---|---|
| **Atomicity** | All-or-nothing execution |
| **Consistency** | Database moves from one valid state to another |
| **Isolation** | Concurrent transactions don't see each other's partial work |
| **Durability** | Committed data survives crashes |

**Isolation levels** (from weakest to strongest): Read Uncommitted → Read Committed → Repeatable Read → Serializable. Higher isolation = fewer anomalies but more contention.

---

## Real-World Scenario: E-Commerce Analytics

```sql
-- "Top 10 customers by revenue last 90 days, with their most recent order"
WITH recent_orders AS (
  SELECT customer_id,
         SUM(total)       AS revenue,
         MAX(created_at)  AS last_order_at,
         COUNT(*)         AS order_count
  FROM   orders
  WHERE  created_at >= NOW() - INTERVAL '90 days'
  GROUP  BY customer_id
)
SELECT c.name, c.email,
       ro.revenue, ro.order_count, ro.last_order_at,
       RANK() OVER (ORDER BY ro.revenue DESC) AS rank
FROM   recent_orders ro
JOIN   customers c ON c.id = ro.customer_id
ORDER  BY ro.revenue DESC
LIMIT  10;
```

---

## Interview Q&A

**Q: What is the difference between WHERE and HAVING?**
A: WHERE filters rows before grouping; HAVING filters groups after GROUP BY. You cannot use aggregate functions (SUM, COUNT) in WHERE.

**Q: Explain INNER JOIN vs LEFT JOIN.**
A: INNER JOIN returns only matching rows from both tables. LEFT JOIN returns all rows from the left table, with NULLs where there is no match in the right table. Use LEFT JOIN when the right-side data is optional.

**Q: What is a covering index?**
A: An index that contains all columns referenced in a query, so the database engine can satisfy the query entirely from the index without accessing the main table (heap). This eliminates an extra I/O step.

**Q: When would you use a CTE vs a subquery?**
A: CTEs are preferred for readability when the same subquery is referenced multiple times, or when recursion is needed. Subqueries can be inline for simple one-off expressions. Most modern optimizers handle both similarly.

**Q: What are phantom reads?**
A: At Repeatable Read isolation level, a transaction can see new rows inserted by another committed transaction within the same query range — these are "phantom" rows. Serializable isolation prevents phantoms.
"""

# ──────────────────────────────────────────────────────────────────────────────
# TOPIC 7: OOP & Design Patterns
# ──────────────────────────────────────────────────────────────────────────────

OOP_CONTENT = """# OOP & Design Patterns: Writing Maintainable Code

## Why OOP Principles Matter

Object-oriented programming is not about classes and objects — it's about organizing code so it can change. Real systems change constantly: new requirements arrive, edge cases emerge, teams grow. Good OOP design makes change cheap; bad design makes it painful.

---

## 1. The SOLID Principles

SOLID is an acronym coined by Robert C. Martin. Each principle targets a specific source of brittleness.

### S — Single Responsibility Principle

**A class should have only one reason to change.**

```python
# BAD: UserService does too many things
class UserService:
    def save_user(self, user): ...
    def send_welcome_email(self, user): ...
    def generate_invoice(self, user): ...

# GOOD: separate concerns
class UserRepository:
    def save(self, user): ...

class EmailService:
    def send_welcome(self, user): ...

class InvoiceService:
    def generate(self, user): ...
```

### O — Open/Closed Principle

**Open for extension, closed for modification.**

```python
# BAD: adding a new shape requires modifying existing code
def total_area(shapes):
    area = 0
    for s in shapes:
        if s.type == 'circle': area += 3.14 * s.radius ** 2
        elif s.type == 'rect': area += s.w * s.h
    return area

# GOOD: each shape knows its own area
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

class Circle(Shape):
    def __init__(self, r): self.r = r
    def area(self): return 3.14159 * self.r ** 2

class Rectangle(Shape):
    def __init__(self, w, h): self.w = w; self.h = h
    def area(self): return self.w * self.h

def total_area(shapes): return sum(s.area() for s in shapes)
```

### L — Liskov Substitution Principle

**Subtypes must be substitutable for their base types without breaking correctness.**

```python
# VIOLATION: Square is NOT a valid Rectangle substitute
class Rectangle:
    def set_width(self, w):  self.width = w
    def set_height(self, h): self.height = h
    def area(self): return self.width * self.height

class Square(Rectangle):          # LSP violation
    def set_width(self, w):
        self.width = self.height = w  # breaks Rectangle contract!
    def set_height(self, h):
        self.width = self.height = h

# Fix: use a common Shape base; don't force inheritance where the IS-A relationship is wrong
```

### I — Interface Segregation Principle

**Clients should not be forced to depend on methods they do not use.**

```python
# BAD: fat interface
class Worker:
    def work(self): ...
    def eat(self): ...     # robots don't eat

# GOOD: split interfaces
class Workable:
    def work(self): ...

class Eatable:
    def eat(self): ...

class HumanWorker(Workable, Eatable): ...
class RobotWorker(Workable): ...
```

### D — Dependency Inversion Principle

**Depend on abstractions, not concretions.**

```python
# BAD: high-level module hard-wires the low-level detail
class OrderService:
    def __init__(self):
        self.db = PostgreSQLDatabase()  # concrete dependency

# GOOD: inject the abstraction
class OrderService:
    def __init__(self, db: Database):   # interface / ABC
        self.db = db
```

---

## 2. Inheritance vs Composition

**Inheritance** models IS-A. **Composition** models HAS-A. The mantra is *"Favor composition over inheritance"* (GoF, 1994).

```python
# Inheritance: rigid, tight coupling
class FlyingFish(Fish, Bird): ...   # multiple inheritance pitfalls

# Composition: flexible, loosely coupled
class SwimmingBehavior:
    def swim(self): return "swimming"

class FlyingBehavior:
    def fly(self): return "flying"

class FlyingFish:
    def __init__(self):
        self._swim = SwimmingBehavior()
        self._fly  = FlyingBehavior()
    def swim(self): return self._swim.swim()
    def fly(self):  return self._fly.fly()
```

**When to use inheritance**: True IS-A relationships with stable hierarchies (e.g., `Button extends Widget`).
**When to use composition**: Behavior that varies independently, or when combining capabilities from multiple sources.

---

## 3. Polymorphism

Polymorphism means "many forms" — the same interface, different behaviors.

```python
class Notification(ABC):
    @abstractmethod
    def send(self, message: str): ...

class EmailNotification(Notification):
    def send(self, message): print(f"Email: {message}")

class SMSNotification(Notification):
    def send(self, message): print(f"SMS: {message}")

class PushNotification(Notification):
    def send(self, message): print(f"Push: {message}")

def notify_all(channels: list[Notification], msg: str):
    for ch in channels:
        ch.send(msg)   # polymorphic dispatch — caller doesn't care which type

notify_all([EmailNotification(), SMSNotification()], "Order shipped!")
```

---

## 4. Encapsulation and Abstraction

**Encapsulation**: Bundle data and behavior; hide internal state.
**Abstraction**: Expose only what the caller needs; hide the how.

```python
class BankAccount:
    def __init__(self, balance: float):
        self.__balance = balance     # private — encapsulated

    def deposit(self, amount: float):
        if amount <= 0: raise ValueError("Amount must be positive")
        self.__balance += amount

    def withdraw(self, amount: float):
        if amount > self.__balance: raise ValueError("Insufficient funds")
        self.__balance -= amount

    @property
    def balance(self) -> float:     # read-only access
        return self.__balance
```

---

## 5. Classic Design Patterns

### Creational

**Singleton** — exactly one instance.

```python
class Config:
    _instance = None
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
```

**Factory Method** — delegate object creation to subclasses.

```python
class AnimalFactory:
    @staticmethod
    def create(kind: str):
        if kind == "dog": return Dog()
        if kind == "cat": return Cat()
        raise ValueError(f"Unknown animal: {kind}")
```

### Structural

**Decorator** — add behavior without subclassing.

```python
def logging_decorator(func):
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__}")
        result = func(*args, **kwargs)
        print(f"Done {func.__name__}")
        return result
    return wrapper

@logging_decorator
def process_order(order_id): ...
```

**Adapter** — make incompatible interfaces work together.

```python
class LegacyPrinter:
    def print_old(self, text): print(f"[Legacy] {text}")

class PrinterAdapter:
    def __init__(self, legacy): self._legacy = legacy
    def print(self, text): self._legacy.print_old(text)
```

### Behavioral

**Observer** — publish/subscribe event system.

```python
class EventBus:
    def __init__(self): self._listeners = {}
    def subscribe(self, event, fn): self._listeners.setdefault(event, []).append(fn)
    def publish(self, event, data):
        for fn in self._listeners.get(event, []): fn(data)

bus = EventBus()
bus.subscribe("order.created", lambda d: print(f"Email: {d}"))
bus.subscribe("order.created", lambda d: print(f"Analytics: {d}"))
bus.publish("order.created", {"id": 42})
```

**Strategy** — swap algorithms at runtime.

```python
class Sorter:
    def __init__(self, strategy): self._strategy = strategy
    def sort(self, data): return self._strategy(data)

fast_sorter   = Sorter(sorted)                   # built-in Timsort
custom_sorter = Sorter(lambda d: sorted(d, key=lambda x: -x))
```

---

## Real-World Scenario: Payment Processing

A payment system must support PayPal, Stripe, and bank transfer — and new providers will be added.

```
Strategy pattern: each provider is a PaymentStrategy
Factory: PaymentFactory.create(provider_name) → PaymentStrategy
Decorator: LoggingPaymentStrategy wraps any strategy to add audit logging
Open/Closed: adding a new provider = new class, zero changes to existing code
```

---

## Interview Q&A

**Q: What is the difference between abstraction and encapsulation?**
A: Encapsulation is the mechanism — hiding internal state behind methods. Abstraction is the goal — showing only relevant details to the outside world. Encapsulation implements abstraction.

**Q: Why favor composition over inheritance?**
A: Inheritance creates tight coupling — a change in the parent affects all children. Composition lets you mix and replace behaviors independently, and avoids the fragile base class problem.

**Q: Explain the Open/Closed Principle with an example.**
A: Software entities should be open for extension but closed for modification. Example: a Shape hierarchy where adding a Triangle requires only a new class, not changes to `total_area()`.

**Q: What is the Liskov Substitution Principle?**
A: If S is a subtype of T, then objects of type T may be replaced with objects of type S without altering program correctness. Classic violation: Square extends Rectangle but breaks the width/height contract.

**Q: When would you use the Observer pattern?**
A: When multiple components need to react to state changes in another component, without tight coupling. Examples: UI event systems, domain event publishing, real-time dashboards.
"""

# ──────────────────────────────────────────────────────────────────────────────
# TOPIC 8: Operating Systems
# ──────────────────────────────────────────────────────────────────────────────

OS_CONTENT = """# Operating Systems: How Computers Actually Run Code

## Why Every Engineer Needs OS Knowledge

Your application never talks directly to hardware. The operating system manages every resource — CPU time, memory, files, network I/O. Understanding the OS lets you diagnose performance bottlenecks, write correct concurrent code, and reason about system limits.

---

## 1. Processes vs Threads

### Processes

A process is an independent program in execution. The OS gives each process its own:
- Virtual address space
- File descriptor table
- Security context
- At least one thread

```
Process A          Process B
┌──────────┐       ┌──────────┐
│ Code     │       │ Code     │
│ Data     │       │ Data     │
│ Heap     │       │ Heap     │
│ Stack    │       │ Stack    │
└──────────┘       └──────────┘
 Isolated — crash in A does not affect B
```

### Threads

A thread is a unit of execution within a process. Threads in the same process share:
- Heap memory (and global variables)
- File descriptors
- Code segment

But each thread has its own:
- Stack
- Program counter
- Register set

```python
import threading

shared_counter = 0

def increment(n):
    global shared_counter
    for _ in range(n):
        shared_counter += 1   # NOT thread-safe without a lock!

t1 = threading.Thread(target=increment, args=(100_000,))
t2 = threading.Thread(target=increment, args=(100_000,))
t1.start(); t2.start()
t1.join(); t2.join()
# Result is often less than 200_000 due to race condition
```

**Fix with a Lock**:

```python
lock = threading.Lock()

def safe_increment(n):
    global shared_counter
    for _ in range(n):
        with lock:
            shared_counter += 1
```

### Key Differences

| Aspect | Process | Thread |
|---|---|---|
| Memory | Isolated | Shared (same process) |
| Communication | IPC (pipes, sockets, shared memory) | Direct (shared variables + sync) |
| Creation cost | High (fork, exec) | Low |
| Crash isolation | Yes | No — one thread can crash the process |
| Use case | Safety isolation (browsers, microservices) | Parallelism within one app |

---

## 2. Memory Management: Stack vs Heap

### The Stack

- Automatic allocation: grows/shrinks with function calls
- LIFO order: each function call pushes a frame; return pops it
- Fast: no allocator needed, just move the stack pointer
- Limited size (typically 1–8 MB per thread)
- Stores: local variables, return addresses, function arguments

```
Stack (grows downward)
┌─────────────┐  ← Stack pointer (top)
│  frame: bar │    local vars of bar()
├─────────────┤
│  frame: foo │    local vars of foo()
├─────────────┤
│  frame: main│    local vars of main()
└─────────────┘  ← Stack base
```

### The Heap

- Manual (C/C++) or GC-managed (Python, Java, Go) allocation
- Dynamic size — grows as needed (limited by available RAM)
- Slower: allocator must find free blocks, may fragment
- Stores: objects, arrays, data whose lifetime outlasts a function

```python
# Stack: x is on the stack (reference only; int lives in CPython's object pool)
def foo():
    x = 42        # reference on stack

# Heap: the list object lives on the heap
def bar():
    items = [1, 2, 3]  # list allocated on the heap
```

**Common bugs**:
- Stack overflow: too deep recursion → stack pointer crosses the limit
- Memory leak: heap objects never freed (in GC languages: reference cycles)
- Use-after-free (C/C++): accessing heap memory after it's been freed

---

## 3. CPU Scheduling Algorithms

The scheduler decides which process/thread runs on the CPU and for how long.

### FCFS — First Come, First Served

Simple queue. Long jobs can block short ones (convoy effect).

### SJF — Shortest Job First

Minimizes average waiting time, but requires knowing job length (hard in practice).

### Round Robin

Each process gets a fixed time slice (quantum, e.g., 10 ms). Preemptive. Standard in interactive OS.

```
Quantum = 4 ms
P1(8ms) → P2(4ms) → P3(2ms)

Timeline:
0   4   8   12  14
|P1 |P2 |P1 |P3 |  done
```

### Priority Scheduling

Each process has a priority. Starvation risk: low-priority processes never run.
Solution: **aging** — gradually raise the priority of waiting processes.

### Multilevel Feedback Queue (MLFQ)

Modern OS (Linux CFS, Windows) uses variants of MLFQ: multiple queues with different priorities and quanta; processes move between queues based on behavior.

---

## 4. Deadlocks

A deadlock occurs when a set of processes each hold a resource and wait for another resource held by another process in the set.

**The four Coffman conditions** (all must hold for deadlock):
1. **Mutual exclusion** — resources cannot be shared
2. **Hold and wait** — processes hold resources while waiting for more
3. **No preemption** — resources cannot be forcibly taken
4. **Circular wait** — P1 waits for P2, P2 waits for P1

```
Deadlock diagram:
P1 ──holds──► R1    P2 ──holds──► R2
P1 ──waits──► R2    P2 ──waits──► R1
```

**Prevention strategies**:
- **Lock ordering**: always acquire locks in the same global order
- **Timeout & retry**: if lock can't be acquired within T ms, release all and retry
- **Deadlock detection**: OS builds a resource-allocation graph and detects cycles
- **Banker's algorithm**: pre-check whether granting a resource leaves the system in a safe state

```python
# Lock ordering prevents deadlock
import threading

lock_a = threading.Lock()
lock_b = threading.Lock()

# Always acquire in order: lock_a, then lock_b
def transfer(amount):
    with lock_a:       # consistent order
        with lock_b:
            # safe to operate
            pass
```

---

## 5. Virtual Memory and Page Faults

### Virtual Memory

Every process has a private virtual address space (e.g., 0 to 2^48 on a 64-bit system). The **Memory Management Unit (MMU)** translates virtual addresses to physical RAM addresses using **page tables**.

```
Virtual Address Space          Physical RAM
┌─────────────────┐           ┌──────────┐
│ 0x0000 - page 0 │──mapped──►│ Frame 42 │
│ 0x1000 - page 1 │──────────►│ Frame 7  │
│ 0x2000 - page 2 │──────────►│ on disk  │ ← not in RAM!
└─────────────────┘           └──────────┘
```

Pages are typically 4 KB. The mapping (page table) is maintained per process.

### Page Faults

When a process accesses a virtual page not currently in RAM, the CPU triggers a **page fault**. The OS:
1. Finds the page on disk (swap space)
2. Picks a victim frame (LRU, Clock algorithm)
3. Writes victim to disk if dirty
4. Loads the needed page into the freed frame
5. Updates the page table
6. Resumes the faulting instruction

**Major page fault**: page must be read from disk (slow — milliseconds).
**Minor page fault**: page is in RAM but not mapped (e.g., shared library first access).

**Thrashing**: when the OS spends more time swapping pages than executing code — happens when working set > available RAM.

---

## 6. Inter-Process Communication (IPC)

| Method | Description | Use Case |
|---|---|---|
| Pipes | Unidirectional byte stream between related processes | Shell pipelines |
| Named pipes (FIFOs) | Like pipes, but between unrelated processes | Log collectors |
| Shared memory | Fastest — processes map the same physical page | High-throughput data sharing |
| Message queues | Kernel-managed queue of messages | Decoupled producer/consumer |
| Sockets | Network-capable, works across machines | Microservices, distributed systems |
| Signals | Asynchronous notification (SIGTERM, SIGSEGV) | Process control |

---

## Real-World Scenario: Web Server Under Load

A Node.js web server uses a single-threaded event loop (no threads for I/O) — callbacks are scheduled by the OS via epoll (Linux). When 10 000 concurrent connections arrive, epoll efficiently notifies Node which sockets are ready, allowing it to handle all connections without spawning 10 000 threads. This avoids the stack overhead of threads and context-switch cost.

---

## Interview Q&A

**Q: What is the difference between a process and a thread?**
A: A process is an isolated execution environment with its own address space. A thread is a unit of execution within a process — threads share the same heap but have independent stacks. Processes are crash-isolated; threads are not.

**Q: Explain a race condition and how to fix it.**
A: A race condition occurs when the correctness of a program depends on the relative ordering of concurrent operations. Fix: use a mutex/lock to make the critical section atomic, or use atomic operations.

**Q: What are the four conditions for deadlock?**
A: Mutual exclusion, hold and wait, no preemption, and circular wait. Breaking any one condition prevents deadlock.

**Q: What is virtual memory and why is it useful?**
A: Virtual memory gives each process the illusion of having a large, private address space. The OS maps virtual pages to physical frames transparently. Benefits: isolation, over-commitment of RAM (using disk as extension), simpler memory allocation.

**Q: What is the difference between a major and minor page fault?**
A: A minor page fault is resolved without disk I/O (page is already in RAM, just not mapped). A major page fault requires loading the page from disk, which is orders of magnitude slower.
"""

# ──────────────────────────────────────────────────────────────────────────────
# TOPIC 9: Networking
# ──────────────────────────────────────────────────────────────────────────────

NETWORKING_CONTENT = """# Networking: From Packets to Application Protocols

## Why Networking Knowledge Is Non-Negotiable

Every web application involves dozens of network interactions: DNS lookups, TLS handshakes, HTTP/2 multiplexed streams, WebSocket upgrades. Engineers who understand the network can diagnose latency spikes, choose the right protocol, and design systems that scale across the globe.

---

## 1. The TCP/IP Stack

The internet is built on a layered model. Each layer adds a header and passes data to the layer below (encapsulation).

```
Application Layer    HTTP, DNS, gRPC, WebSocket
Transport Layer      TCP, UDP
Network Layer        IP, ICMP, routing
Link Layer           Ethernet, Wi-Fi, ARP
Physical Layer       Cables, radio waves, optical fiber
```

### TCP — Transmission Control Protocol

TCP provides: reliable delivery, ordered bytes, flow control, congestion control.

**Three-way handshake**:
```
Client              Server
  │──── SYN ────────►│   Client: "I want to connect, seq=x"
  │◄─── SYN-ACK ─────│   Server: "OK, seq=y, ack=x+1"
  │──── ACK ─────────►│   Client: "Acknowledged, ack=y+1"
  │                   │   Connection established
```

**Four-way teardown**:
```
Client                  Server
  │──── FIN ───────────►│
  │◄─── ACK ────────────│
  │◄─── FIN ────────────│
  │──── ACK ───────────►│
```

### UDP — User Datagram Protocol

No connection, no reliability, no ordering. Just send packets and hope.
Use cases: DNS, video streaming, online games, WebRTC — where latency beats reliability.

---

## 2. HTTP Versions

### HTTP/1.1

- Text-based protocol (human-readable headers)
- One request per TCP connection (or pipelining, poorly supported)
- Head-of-line blocking: requests in a pipeline block behind a slow response
- Keep-Alive reuses connections but still serial

```
GET /index.html HTTP/1.1
Host: example.com
Connection: keep-alive

HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: 1234

<html>...</html>
```

### HTTP/2

- Binary framing layer (not human-readable)
- **Multiplexing**: multiple streams over one TCP connection — no head-of-line blocking at the HTTP layer
- **Header compression**: HPACK reduces redundant headers
- **Server push**: server can proactively send resources the client will need
- Still suffers TCP head-of-line blocking (one lost packet stalls all streams)

### HTTP/3 (QUIC)

- Built on **QUIC** (UDP-based transport) instead of TCP
- **No TCP head-of-line blocking**: each stream is independent even at the transport layer
- Built-in TLS 1.3 — 0-RTT connection establishment possible
- Better performance on lossy networks (mobile, satellite)

```
Feature Comparison:
             HTTP/1.1   HTTP/2    HTTP/3
Transport    TCP        TCP       QUIC (UDP)
Multiplexing No         Yes       Yes
HoL Blocking HTTP+TCP   HTTP no   None
             TCP yes     TCP yes
Header Comp. No         HPACK     QPACK
Encryption   Optional   Optional  Mandatory
```

---

## 3. DNS — Domain Name System

DNS translates human-readable names (google.com) to IP addresses (142.250.80.46).

**Resolution process**:
```
Browser → Recursive Resolver (ISP/8.8.8.8)
        → Root Nameserver ("I know .com servers")
        → TLD Nameserver ("I know google.com's nameserver")
        → Authoritative Nameserver ("142.250.80.46")
        → Cache result for TTL seconds
```

**Key record types**:

| Record | Purpose | Example |
|---|---|---|
| A | IPv4 address | example.com → 93.184.216.34 |
| AAAA | IPv6 address | example.com → 2606:2800::1 |
| CNAME | Alias to another name | www → example.com |
| MX | Mail server | example.com → mail.example.com |
| TXT | Arbitrary text (SPF, DKIM) | "v=spf1 include:..." |
| NS | Authoritative nameservers | example.com → ns1.example.com |

**DNS propagation**: changing a record takes up to the TTL (e.g., 3600 s = 1 hour) to propagate globally.

---

## 4. TLS Handshake

TLS (Transport Layer Security) provides encryption, authentication, and integrity.

**TLS 1.3 handshake** (1-RTT):
```
Client                                  Server
  │──── ClientHello (supported ciphers, key_share) ───►│
  │◄─── ServerHello + Certificate + Finished ──────────│
  │──── Finished ──────────────────────────────────────►│
  │◄══════════ Encrypted Application Data ══════════════│
```

**Key concepts**:
- **Certificate**: X.509 document signed by a CA proving server identity
- **Key exchange**: ECDHE (Elliptic-curve Diffie-Hellman Ephemeral) — generates session keys without transmitting them
- **Cipher suite**: algorithm combination (e.g., TLS_AES_256_GCM_SHA384)
- **Forward secrecy**: ephemeral keys mean past sessions can't be decrypted even if the private key is later compromised

**Certificate chain**:
```
Root CA (trusted by OS/browser)
  └─ Intermediate CA
       └─ Server Certificate (example.com)
```

---

## 5. WebSocket

HTTP is request-response. WebSocket provides a full-duplex, persistent connection for real-time communication.

**Upgrade handshake** (over HTTP/1.1):
```
Client → Server:
  GET /chat HTTP/1.1
  Upgrade: websocket
  Connection: Upgrade
  Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==

Server → Client:
  HTTP/1.1 101 Switching Protocols
  Upgrade: websocket
  Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

After upgrade, both sides can send frames at any time — no polling needed.

**Use cases**: live chat, collaborative editing, stock tickers, multiplayer games, real-time dashboards.

**JavaScript WebSocket API**:
```javascript
const ws = new WebSocket('wss://api.example.com/chat');

ws.onopen    = () => ws.send(JSON.stringify({ type: 'join', room: '42' }));
ws.onmessage = (e) => console.log('Received:', JSON.parse(e.data));
ws.onerror   = (e) => console.error('WS error', e);
ws.onclose   = () => console.log('Connection closed');
```

---

## 6. REST vs gRPC

### REST (Representational State Transfer)

- Uses HTTP/1.1 or HTTP/2 with standard verbs (GET, POST, PUT, DELETE)
- Resources identified by URLs, data typically JSON
- Stateless — each request contains all needed information
- Human-readable, easy to debug with curl / browser
- Wide ecosystem: OpenAPI, Swagger, Postman

```
GET  /users/42          → fetch user
POST /users             → create user
PUT  /users/42          → replace user
DEL  /users/42          → delete user
```

### gRPC (Google Remote Procedure Call)

- Built on HTTP/2 + Protocol Buffers (binary serialization)
- Defines services and messages in `.proto` files; code generation for any language
- Streaming: unary, server streaming, client streaming, bidirectional
- ~10x smaller payload and ~5x faster than REST+JSON at scale
- Harder to debug (binary) — needs tools like grpcurl or Postman gRPC

```protobuf
// user.proto
service UserService {
  rpc GetUser (UserRequest) returns (UserResponse);
  rpc StreamUsers (Empty) returns (stream UserResponse);
}

message UserRequest { int32 id = 1; }
message UserResponse { int32 id = 1; string name = 2; string email = 3; }
```

**Comparison**:

| Aspect | REST | gRPC |
|---|---|---|
| Protocol | HTTP/1.1 or 2 | HTTP/2 |
| Format | JSON (text) | Protobuf (binary) |
| Browser support | Native | Needs grpc-web proxy |
| Code gen | Optional | Built-in |
| Streaming | SSE / WebSocket | Native |
| Best for | Public APIs, simple CRUD | Internal microservices, high throughput |

---

## Real-World Scenario: A Request's Journey

```
User types "https://shop.example.com/products" in browser

1. DNS: "shop.example.com" → resolver → authoritative NS → 203.0.113.10
2. TCP: 3-way handshake with 203.0.113.10:443
3. TLS: 1-RTT TLS 1.3 handshake, certificate verified, session keys derived
4. HTTP/2: HEADERS frame (GET /products) + DATA frames multiplexed on stream 1
5. Server: load balancer → app server → database query → JSON response
6. HTTP/2: HEADERS (200 OK) + DATA frames stream back
7. Browser: parse HTML/CSS/JS, additional requests (fonts, images) multiplexed
   on same TCP connection
```

---

## Interview Q&A

**Q: What happens when you type a URL in the browser?**
A: DNS resolution → TCP connection → TLS handshake → HTTP request → server processes → HTTP response → browser renders. Caching (DNS TTL, HTTP Cache-Control, CDN) can skip many steps.

**Q: What is the difference between TCP and UDP?**
A: TCP guarantees reliable, ordered delivery with connection establishment. UDP has no guarantees — packets may be lost, reordered, or duplicated — but is faster and lower overhead. TCP for HTTP, SSH; UDP for DNS, video streaming, games.

**Q: How does TLS provide forward secrecy?**
A: By using ephemeral key exchange (ECDHE). Each session generates a new key pair that is discarded after use. If the server's long-term private key is later compromised, past session keys cannot be derived.

**Q: What is the difference between HTTP/2 and HTTP/3?**
A: HTTP/2 multiplexes streams over TCP but still suffers from TCP head-of-line blocking. HTTP/3 runs over QUIC (UDP), which isolates streams so one lost packet only affects that stream, not all streams.

**Q: When would you choose gRPC over REST?**
A: For internal microservice communication where performance matters (binary protocol, multiplexing, streaming), or when you need bi-directional streaming. REST is better for public APIs where developer experience and browser compatibility are priorities.
"""

# ──────────────────────────────────────────────────────────────────────────────
# TOPIC 10: Git & DevOps
# ──────────────────────────────────────────────────────────────────────────────

DEVOPS_CONTENT = """# Git & DevOps: Shipping Software Reliably

## Why DevOps Is a Core Engineering Skill

"It works on my machine" is not acceptable in production. DevOps is the set of practices that lets teams ship code frequently, safely, and automatically. Modern engineers are expected to own their code all the way to production.

---

## 1. Git Internals

Git is a content-addressed file system. Every object is stored by the SHA-1/SHA-256 hash of its content.

**Object types**:
- **blob**: file content
- **tree**: directory listing (blob + tree references)
- **commit**: snapshot pointer (tree + parent + message + author)
- **tag**: named pointer to a commit

```bash
# Every commit is a snapshot, not a diff
git log --oneline --graph --all    # visualize the commit DAG

# Inspect an object
git cat-file -p HEAD               # print the commit object
git cat-file -p HEAD^{tree}        # print the root tree
```

---

## 2. Branching Strategies

### Git Flow

Two permanent branches: `main` (production) and `develop` (integration). Feature branches off `develop`. Release branches prepare for production. Hotfix branches off `main`.

```
main     ────────────────────●─────────────────●──►
                            ↑hotfix             ↑release
develop  ──────────●────────●────────●─────────●──►
                  ↑feature1         ↑feature2
feature/login ────●
```

**Pros**: clear separation, good for versioned software (libraries, mobile apps).
**Cons**: long-lived branches cause merge conflicts; slow for frequent deployments.

### Trunk-Based Development (TBD)

Everyone commits to `main` (trunk) frequently (at least daily). Feature flags hide incomplete work. Short-lived branches (< 2 days) allowed for code review.

```
main  ──●──●──●──●──●──●──►    (multiple commits per day)
        ↑  ↑  ↑
        deploy automatically on every commit
```

**Pros**: CI/CD friendly, eliminates merge hell, forces small incremental changes.
**Cons**: requires strong feature flags and a mature test suite.

### GitHub Flow

Simplified: feature branches off `main`, open a PR, review, merge, deploy.
Good for teams without strict release cycles (SaaS web apps).

---

## 3. Key Git Operations

```bash
# Undo the last commit but keep changes staged
git reset --soft HEAD~1

# Rebase feature branch onto latest main (linear history)
git checkout feature/payment
git rebase main

# Cherry-pick a single commit from another branch
git cherry-pick a1b2c3d

# Interactive rebase to clean up commits before PR
git rebase -i HEAD~4

# Stash uncommitted work temporarily
git stash push -m "WIP: refactor auth"
git stash pop

# Bisect to find which commit introduced a bug
git bisect start
git bisect bad HEAD
git bisect good v1.2.0
# Git checks out commits; mark each as good/bad until found
```

---

## 4. CI/CD Pipelines

**CI (Continuous Integration)**: automatically build and test every commit.
**CD (Continuous Delivery)**: automatically produce a deployable artifact.
**CD (Continuous Deployment)**: automatically deploy to production on every passing build.

### Example: GitHub Actions Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with: { node-version: '20' }

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Unit tests
        run: npm test -- --coverage

      - name: Integration tests
        run: npm run test:integration

  build-and-push:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t myapp:${{ github.sha }} .

      - name: Push to registry
        run: |
          echo "${{ secrets.REGISTRY_PASSWORD }}" | docker login -u "${{ secrets.REGISTRY_USER }}" --password-stdin
          docker push myapp:${{ github.sha }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/myapp \
            myapp=myapp:${{ github.sha }}
```

**Best practices**:
- Fail fast — put linting and unit tests first (they're cheapest)
- Pin action versions for reproducibility
- Use secrets for credentials; never hardcode
- Require passing CI before merging PRs

---

## 5. Docker

Docker packages an application and its dependencies into an **image** that runs identically anywhere.

```dockerfile
# Dockerfile (multi-stage build for smaller image)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
USER node                     # don't run as root
CMD ["node", "src/server.js"]
```

**Key concepts**:
- **Image**: immutable snapshot (layers cache on build)
- **Container**: running instance of an image
- **Layer**: each Dockerfile instruction adds a layer; unchanged layers are cached
- **Volume**: persistent storage mounted into a container
- **Network**: containers communicate via Docker bridge networks

```bash
# Build and run
docker build -t myapp:latest .
docker run -d -p 3000:3000 --name myapp myapp:latest

# Compose for local development (multi-container)
docker compose up -d

# Inspect
docker logs myapp --follow
docker exec -it myapp sh
docker inspect myapp
```

---

## 6. Kubernetes Basics

Kubernetes (K8s) orchestrates containers at scale — scheduling, scaling, healing, and networking.

**Core objects**:

```yaml
# Deployment: declares desired state (3 replicas of myapp)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  selector:
    matchLabels: { app: myapp }
  template:
    metadata:
      labels: { app: myapp }
    spec:
      containers:
        - name: myapp
          image: myapp:abc123
          ports: [{ containerPort: 3000 }]
          resources:
            requests: { cpu: "100m", memory: "128Mi" }
            limits:   { cpu: "500m", memory: "512Mi" }
          readinessProbe:
            httpGet: { path: /health, port: 3000 }
---
# Service: stable network endpoint for the pods
apiVersion: v1
kind: Service
metadata:
  name: myapp-svc
spec:
  selector: { app: myapp }
  ports: [{ port: 80, targetPort: 3000 }]
  type: ClusterIP
```

**Key concepts**:

| Concept | Description |
|---|---|
| Pod | Smallest deployable unit; one or more containers |
| Deployment | Manages pod replicas + rolling updates |
| Service | Stable network endpoint for a set of pods |
| Ingress | HTTP routing from outside the cluster |
| ConfigMap | Externalize configuration (non-secret) |
| Secret | Externalize sensitive configuration |
| HPA | Horizontal Pod Autoscaler — scale based on CPU/custom metrics |
| Namespace | Virtual cluster for isolation |

```bash
kubectl get pods                         # list running pods
kubectl describe pod myapp-7d9f5-x4k2p  # detailed pod info
kubectl logs myapp-7d9f5-x4k2p          # container logs
kubectl exec -it myapp-7d9f5-x4k2p -- sh  # shell into pod
kubectl rollout status deployment/myapp  # watch rolling update
kubectl rollout undo deployment/myapp   # rollback
```

---

## 7. Testing Strategies

A well-tested system uses multiple testing layers — the **test pyramid**.

```
        ╱ E2E ╲         Few, slow, expensive
       ╱─────────╲      Full system in production-like env
      ╱ Integration╲    Some, medium speed
     ╱───────────────╲  Real DB, real HTTP, test doubles for external
    ╱   Unit Tests    ╲ Many, fast, isolated
   ╱───────────────────╲ Pure functions, mocks for dependencies
```

### Unit Tests

```javascript
// Jest unit test
describe('calculateDiscount', () => {
  it('applies 10% for premium users', () => {
    expect(calculateDiscount(100, 'premium')).toBe(90);
  });
  it('applies no discount for standard users', () => {
    expect(calculateDiscount(100, 'standard')).toBe(100);
  });
  it('throws on negative price', () => {
    expect(() => calculateDiscount(-1, 'premium')).toThrow('Price must be positive');
  });
});
```

### Integration Tests

```javascript
// Supertest integration test (real Express app, real DB)
describe('POST /orders', () => {
  it('creates an order and returns 201', async () => {
    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ productId: 1, quantity: 2 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ productId: 1, status: 'pending' });

    const order = await db.orders.findById(res.body.id);
    expect(order).toBeTruthy();
  });
});
```

### End-to-End Tests

```javascript
// Playwright E2E test
test('user can complete checkout', async ({ page }) => {
  await page.goto('https://staging.shop.example.com');
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'secret');
  await page.click('[data-testid="login-btn"]');
  await page.click('[data-testid="add-to-cart"]');
  await page.click('[data-testid="checkout-btn"]');
  await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible();
});
```

**Testing best practices**:
- Aim for >80% unit test coverage on business logic
- Test behavior, not implementation — avoid testing private methods
- Use factory functions or fixtures for test data setup
- Run integration tests against a real (but test-isolated) database
- E2E tests: smoke test the critical user journeys, not every edge case
- Fast tests in CI (unit + integration); E2E on staging before production

---

## Real-World Scenario: Zero-Downtime Deployment

```
1. Developer pushes to main
2. CI pipeline: lint → unit tests → integration tests → build Docker image
3. Docker image pushed to registry with git SHA tag
4. CD pipeline: kubectl set image deployment/myapp myapp=myapp:<sha>
5. K8s rolling update: bring up new pods, wait for readinessProbe, then terminate old pods
6. If readinessProbe fails: K8s stops the rollout, old pods stay running
7. Automatic rollback: kubectl rollout undo deployment/myapp
Result: Zero downtime, automatic safety net
```

---

## Interview Q&A

**Q: What is the difference between git merge and git rebase?**
A: Merge creates a merge commit, preserving the full history of both branches. Rebase replays commits on top of another branch, creating a linear history but rewriting commit SHAs. Use rebase for cleaning up local feature branches before a PR; use merge for integrating branches in shared history.

**Q: What is trunk-based development and why do teams use it?**
A: All developers commit to a single main branch (trunk) at least daily. Feature flags hide incomplete work. It eliminates long-lived branches and their merge conflicts, and is a prerequisite for true continuous deployment.

**Q: Explain the testing pyramid.**
A: Unit tests (many, fast, isolated) form the base. Integration tests (fewer, test components together) sit in the middle. E2E tests (few, slow, test the whole system) are at the top. More tests at lower layers keep the suite fast and the feedback loop tight.

**Q: What is a Docker multi-stage build and why use it?**
A: A multi-stage build uses multiple FROM instructions in one Dockerfile. Early stages (e.g., compilation, dependency install) produce artifacts that are copied into a minimal final image. This results in much smaller production images — a Go binary might shrink from 800 MB to 10 MB.

**Q: What is a Kubernetes readiness probe vs a liveness probe?**
A: A readiness probe tells K8s when a pod is ready to receive traffic — if it fails, the pod is removed from the Service's endpoints but keeps running. A liveness probe tells K8s when a pod is unhealthy and should be restarted. Use readiness for slow startup; use liveness to recover from deadlocks.
"""

# ──────────────────────────────────────────────────────────────────────────────
# Main: load, patch, save
# ──────────────────────────────────────────────────────────────────────────────

def main():
    with open(FILE_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Map topic id → content string
    content_map = {
        "sql":                 SQL_CONTENT,
        "oop-design-patterns": OOP_CONTENT,
        "operating-systems":   OS_CONTENT,
        "networking":          NETWORKING_CONTENT,
        "git-devops":          DEVOPS_CONTENT,
    }

    patched = 0
    for topic in data:
        tid = topic.get("id")
        if tid in content_map:
            topic["content"] = content_map[tid]
            word_count = len(content_map[tid].split())
            print(f"  Patched: {tid} ({word_count} words)")
            patched += 1

    if patched != len(content_map):
        print(f"WARNING: Expected to patch {len(content_map)} topics, but only patched {patched}")
        return 1

    with open(FILE_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\nDone. Patched {patched} topics and wrote {FILE_PATH}")
    return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())
