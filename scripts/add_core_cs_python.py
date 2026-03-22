#!/usr/bin/env python3
"""Add content to Python sessions (topic index 4)."""
import json

PATH = "/Users/racit/PersonalProject/guru-sishya/public/content/core-cs.json"

with open(PATH) as f:
    data = json.load(f)

idx = next(i for i, d in enumerate(data) if d["id"] == "python")
sessions = data[idx]["plan"]["sessions"]

CONTENT = {
1: """## Python Mental Model: Objects, Names, and Scope

Python's execution model differs fundamentally from many other languages. Understanding it prevents an entire class of subtle bugs.

### Everything is an Object

In Python, everything — integers, functions, classes, modules — is an object with an identity (`id()`), a type (`type()`), and a value.

```python
# Functions are objects
def greet(name):
    return f"Hello, {name}"

print(type(greet))   # <class 'function'>
print(id(greet))     # some memory address

# Functions can be assigned, passed, and stored
alias = greet
alias("Alice")       # "Hello, Alice"

funcs = [len, str.upper, sorted]
funcs[0]("hello")    # 5

# Classes are objects too
print(type(int))     # <class 'type'>
print(type(type))    # <class 'type'> — type is its own type!
```

### Names, Not Variables

Python has **names** that bind to objects, not variables that contain values. Assignment creates a binding, not a copy.

```python
x = [1, 2, 3]
y = x          # y is another name for the SAME list object
y.append(4)
print(x)       # [1, 2, 3, 4] — same object!

# vs augmented assignment on immutables (creates new object):
a = 42
b = a
a = a + 1      # a now points to a NEW int object (43)
print(b)       # 42 — b still points to 42

# vs augmented assignment on mutables (modifies IN PLACE):
lst = [1, 2]
lst += [3]     # lst.__iadd__([3]) — modifies in place
# Equivalent to: lst.extend([3]) — same object

# Copy vs reference:
import copy
original = [[1, 2], [3, 4]]
shallow = original.copy()     # or list(original), original[:]
deep = copy.deepcopy(original)

original[0].append(99)
print(shallow[0])   # [1, 2, 99] — shallow copy shares inner lists!
print(deep[0])      # [1, 2] — deep copy is fully independent
```

### LEGB Scope Rule

Python resolves names in this order: **L**ocal → **E**nclosing → **G**lobal → **B**uilt-in

```python
x = 'global'

def outer():
    x = 'enclosing'   # shadows global x

    def inner():
        x = 'local'   # shadows enclosing x
        print(x)      # 'local'

    inner()
    print(x)          # 'enclosing'

outer()
print(x)              # 'global'

# global keyword: modify global from inside function
count = 0
def increment():
    global count
    count += 1

# nonlocal keyword: modify enclosing scope from nested function
def make_counter():
    count = 0
    def increment():
        nonlocal count
        count += 1
        return count
    return increment

counter = make_counter()
counter()  # 1
counter()  # 2
```

### Python's Data Model: Mutable vs Immutable

```python
# Immutable: int, float, str, tuple, bytes, frozenset
# Cannot change value after creation — new object created on "modification"
s = "hello"
s.upper()   # returns "HELLO" — original unchanged!
print(s)    # "hello"

# Mutable: list, dict, set, bytearray, and most user-defined classes
lst = [1, 2, 3]
lst.append(4)    # modifies in place — same object
lst[0] = 99      # modifies in place

# Consequence: mutable default arguments are SHARED across calls
def bad_append(item, result=[]):     # DANGER: [] created ONCE at function definition
    result.append(item)
    return result

bad_append(1)  # [1]
bad_append(2)  # [1, 2] — same list! not []

# Fix: use None sentinel
def good_append(item, result=None):
    if result is None:
        result = []
    result.append(item)
    return result
```

### Interview Q&A

**Q: What is the difference between `is` and `==` in Python?**
A: `==` compares values (calls `__eq__`). `is` compares identity — whether two names refer to the exact same object in memory (`id(a) == id(b)`). For small integers (-5 to 256) and interned strings, Python caches objects, so `is` may return `True` even for literals. Always use `==` for value comparison; use `is` only for `None` checks (`if x is None`).

**Q: Why should you never use a mutable default argument?**
A: Default argument values are evaluated once when the function is defined, not each time it's called. A mutable default (like `[]` or `{}`) is created once and shared across all calls that don't provide that argument. Mutations in one call persist to the next. Fix: use `None` as default and create the mutable inside the function body.

**Q: What does Python's `id()` function return?**
A: The memory address of the object (CPython implementation). It's guaranteed to be unique among currently existing objects. After an object is deleted and garbage collected, a new object may get the same id. Use `id()` to verify if two names refer to the same object.

### Common Mistakes

```python
# Mistake: not understanding pass-by-object-reference
def add_item(d, key, value):
    d[key] = value   # modifies the passed dict!

my_dict = {}
add_item(my_dict, 'a', 1)
print(my_dict)  # {'a': 1} — original modified!

# Intentional mutation: fine. Unintentional: use .copy() before passing

# Mistake: closures in loops (same issue as JavaScript var)
functions = []
for i in range(3):
    functions.append(lambda: i)   # all capture same 'i' variable

[f() for f in functions]  # [2, 2, 2] — all see final value

# Fix: capture value in default arg
functions = []
for i in range(3):
    functions.append(lambda i=i: i)  # i=i binds current value
[f() for f in functions]  # [0, 1, 2]
```
""",

2: """## Core Data Structures and Comprehensions

Python's built-in data structures are powerful and expressive. Mastering them is a prerequisite for writing idiomatic Python.

### Lists: Slicing and Operations

```python
# List basics
lst = [10, 20, 30, 40, 50]

# Slicing: lst[start:stop:step]
lst[1:4]      # [20, 30, 40] — indices 1, 2, 3 (not 4)
lst[:3]       # [10, 20, 30]
lst[2:]       # [30, 40, 50]
lst[::2]      # [10, 30, 50] — every other
lst[::-1]     # [50, 40, 30, 20, 10] — reversed!
lst[-2:]      # [40, 50] — last two

# Slice assignment
lst[1:3] = [200, 300]  # replace elements at index 1 and 2

# list as stack (LIFO):
stack = []
stack.append('a')  # push O(1)
stack.pop()        # pop from end O(1)

# list as queue: DON'T use list.pop(0) — O(n)!
from collections import deque
queue = deque()
queue.append('a')     # enqueue O(1)
queue.popleft()       # dequeue O(1)
```

### Dictionaries: The Workhorse

```python
# Dict comprehension
squares = {x: x**2 for x in range(10)}

# .get() with default — avoids KeyError
user = {"name": "Alice"}
age = user.get("age", 0)   # 0 if key missing

# setdefault — insert if missing, return value
user.setdefault("hobbies", []).append("coding")
# user = {"name": "Alice", "hobbies": ["coding"]}

# Counter: frequency counting
from collections import Counter
text = "mississippi"
freq = Counter(text)  # Counter({'s': 4, 'i': 4, 'p': 2, 'm': 1})
freq.most_common(2)   # [('s', 4), ('i', 4)]

# defaultdict: automatic default values
from collections import defaultdict
graph = defaultdict(list)
graph['A'].append('B')   # no KeyError even on first access
graph['A'].append('C')

# OrderedDict (modern Python dicts preserve insertion order too, but OrderedDict has move_to_end)
from collections import OrderedDict
od = OrderedDict([('a', 1), ('b', 2), ('c', 3)])
od.move_to_end('a')   # move 'a' to end

# Merging dicts (Python 3.9+)
config = {'host': 'localhost', 'port': 5432}
override = {'port': 5433, 'dbname': 'prod'}
merged = config | override  # {'host': 'localhost', 'port': 5433, 'dbname': 'prod'}
```

### List/Dict/Set Comprehensions

```python
# List comprehension: [expression for item in iterable if condition]
squares = [x**2 for x in range(10)]
evens   = [x for x in range(20) if x % 2 == 0]
flattened = [x for row in matrix for x in row]   # nested: outer loop first

# Dict comprehension
word_lengths = {word: len(word) for word in ["hello", "world", "python"]}

# Set comprehension
unique_lengths = {len(word) for word in ["hello", "world", "hi"]}  # {2, 5}

# Generator expression: lazy — computes one value at a time
total = sum(x**2 for x in range(1_000_000))  # no intermediate list in memory!
first_even = next(x for x in range(100) if x % 2 == 0)  # stops at first match

# When to use each:
# list comprehension: need all values, will iterate multiple times
# generator expression: large/infinite sequences, need only one pass
# dict comprehension: building a dict from a sequence
```

### Sets

```python
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

a | b   # union:        {1, 2, 3, 4, 5, 6}
a & b   # intersection: {3, 4}
a - b   # difference:   {1, 2}
a ^ b   # symmetric diff: {1, 2, 5, 6}

# Set is O(1) lookup (hash-based):
users = {user.id for user in all_users}
if request_user_id in users:  # O(1)
    ...

# frozenset: immutable set, hashable (can be dict key or set member)
permissions = frozenset(['read', 'write'])
```

### Named Tuples and Dataclasses

```python
# namedtuple: lightweight, immutable records
from collections import namedtuple
Point = namedtuple('Point', ['x', 'y'])
p = Point(3, 4)
p.x     # 3
p._asdict()  # OrderedDict([('x', 3), ('y', 4)])

# dataclass: mutable, supports methods, type hints, defaults
from dataclasses import dataclass, field
from typing import List

@dataclass
class User:
    id: int
    name: str
    email: str
    roles: List[str] = field(default_factory=list)  # mutable default
    active: bool = True

    def __post_init__(self):
        self.email = self.email.lower()  # normalize on creation

@dataclass(frozen=True)  # immutable (like namedtuple but with type hints)
class Point:
    x: float
    y: float
    def distance_from_origin(self) -> float:
        return (self.x**2 + self.y**2) ** 0.5
```

### Interview Q&A

**Q: What is the time complexity of common list operations?**
A: Append: O(1) amortized. Insert at index: O(n). Delete at index: O(n). Index access: O(1). `in` operator (search): O(n). Sort: O(n log n). Use `deque` for O(1) prepend/popleft. Use `set` for O(1) membership testing.

**Q: What is the difference between a list and a tuple in Python?**
A: Lists are mutable; tuples are immutable. Tuples are slightly faster and use less memory. Tuples can be used as dict keys (hashable) if all elements are hashable; lists cannot. Idiomatic use: tuples for heterogeneous data with semantic meaning (record-like), lists for homogeneous sequences you'll modify.

**Q: How do you flatten a nested list?**
A: `[x for sublist in nested for x in sublist]` for one level. `itertools.chain.from_iterable(nested)` for one level (lazy). `sum(nested, [])` works but is O(n²). For arbitrary depth: recursion or `itertools.chain`.

### Common Mistakes

```python
# Mistake: using list when set is more appropriate
if user_id in [1, 2, 3, 4, 5]:  # O(n) — checks each element
    ...
if user_id in {1, 2, 3, 4, 5}:  # O(1) — hash lookup
    ...

# Mistake: modifying a list while iterating over it
lst = [1, 2, 3, 4, 5]
for item in lst:
    if item % 2 == 0:
        lst.remove(item)   # skips elements!
# Fix: iterate over a copy or build new list
lst = [x for x in lst if x % 2 != 0]
```
""",

3: """## Functions: First-Class Objects, Closures, and Decorators

Python's decorator syntax is syntactic sugar over higher-order functions. Understanding closures is prerequisite to understanding decorators.

### First-Class Functions

```python
# Functions can be passed, returned, and stored
def apply(func, value):
    return func(value)

apply(str.upper, "hello")     # "HELLO"
apply(len, "hello")           # 5

# Lambda: anonymous one-expression functions
transform = lambda x: x ** 2
sorted_data = sorted(items, key=lambda x: x['price'])

# Partial application
from functools import partial
def multiply(a, b): return a * b
double = partial(multiply, 2)  # a=2 fixed
double(5)   # 10
double(10)  # 20
```

### Closures

```python
def make_counter(start=0):
    count = [start]  # list to allow mutation via closure

    def increment(by=1):
        count[0] += by
        return count[0]

    def reset():
        count[0] = start

    return increment, reset

inc, rst = make_counter(10)
inc()   # 11
inc(5)  # 16
rst()
inc()   # 11

# Modern: use nonlocal
def make_counter(start=0):
    count = start
    def increment(by=1):
        nonlocal count
        count += by
        return count
    return increment
```

### Decorators: The Pattern

A decorator is a function that takes a function and returns a new function. The `@decorator` syntax is just `func = decorator(func)`.

```python
import functools
import time

# Basic decorator: add behavior before/after
def timer(func):
    @functools.wraps(func)  # preserves __name__, __doc__, etc.
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        duration = time.perf_counter() - start
        print(f"{func.__name__} took {duration:.4f}s")
        return result
    return wrapper

@timer
def slow_function():
    time.sleep(0.1)
    return "done"

# Equivalent to: slow_function = timer(slow_function)
slow_function()  # "slow_function took 0.1001s"
```

### Decorator with Arguments (Factory Pattern)

```python
def retry(max_attempts=3, delay=1.0, exceptions=(Exception,)):
    # Decorator factory: @retry(max_attempts=5)
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            last_exc = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exc = e
                    if attempt < max_attempts:
                        print(f"Attempt {attempt} failed: {e}. Retrying in {delay}s...")
                        time.sleep(delay)
            raise last_exc
        return wrapper
    return decorator

@retry(max_attempts=3, delay=0.5, exceptions=(ConnectionError, TimeoutError))
def fetch_data(url: str) -> dict:
    response = requests.get(url, timeout=5)
    response.raise_for_status()
    return response.json()
```

### Real-World Decorators

```python
# Memoization / caching
from functools import lru_cache, cache

@lru_cache(maxsize=128)  # LRU cache with max 128 entries
def fibonacci(n: int) -> int:
    if n <= 1: return n
    return fibonacci(n - 1) + fibonacci(n - 2)

@cache  # Python 3.9+: unbounded cache (equivalent to lru_cache(maxsize=None))
def expensive_lookup(key: str) -> str:
    return external_api.fetch(key)

# Authorization decorator
def require_auth(roles=None):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                raise PermissionError("Authentication required")
            if roles and request.user.role not in roles:
                raise PermissionError(f"Requires role: {roles}")
            return func(request, *args, **kwargs)
        return wrapper
    return decorator

@require_auth(roles=['admin', 'superuser'])
def delete_user(request, user_id: int):
    User.objects.get(id=user_id).delete()

# Validation decorator
def validate_types(**type_hints):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            sig = inspect.signature(func)
            bound = sig.bind(*args, **kwargs)
            for param_name, value in bound.arguments.items():
                if param_name in type_hints:
                    expected = type_hints[param_name]
                    if not isinstance(value, expected):
                        raise TypeError(
                            f"{param_name} must be {expected.__name__}, "
                            f"got {type(value).__name__}"
                        )
            return func(*args, **kwargs)
        return wrapper
    return decorator
```

### Stacking Decorators

```python
# Applied bottom-up: @timer then @retry then @require_auth
@require_auth
@retry(max_attempts=3)
@timer
def process_order(order_id: int) -> dict:
    ...

# Equivalent to:
# process_order = require_auth(retry(max_attempts=3)(timer(process_order)))
```

### Interview Q&A

**Q: What does `@functools.wraps` do and why is it important?**
A: `functools.wraps(func)` copies the wrapped function's `__name__`, `__doc__`, `__module__`, `__qualname__`, `__annotations__`, and `__dict__` to the wrapper. Without it, `slow_function.__name__` would be `'wrapper'` instead of `'slow_function'`, breaking debugging, docstrings, and introspection tools.

**Q: What is a decorator factory and how does it differ from a regular decorator?**
A: A regular decorator takes a function and returns a function: `@timer`. A decorator factory is called with arguments and returns a decorator: `@retry(max_attempts=3)`. The factory pattern adds an extra layer: the factory returns the actual decorator, which then wraps the function.

**Q: How is `@lru_cache` implemented?**
A: `lru_cache` wraps the function with a dict that maps argument tuples to cached results. Arguments must be hashable (so lists/dicts as arguments are not allowed). "LRU" means Least Recently Used — when the cache exceeds `maxsize`, the least recently accessed entry is evicted. This is implemented with an `OrderedDict` in CPython.

### Common Mistakes

```python
# Mistake: forgetting functools.wraps
def bad_decorator(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@bad_decorator
def my_func(): "I have a docstring"
my_func.__name__  # 'wrapper' — wrong!
my_func.__doc__   # None — docstring lost!

# Mistake: decorator modifies shared mutable state
call_count = 0   # global — shared across threads!
def count_calls(func):
    def wrapper(*args, **kwargs):
        global call_count
        call_count += 1
        return func(*args, **kwargs)
    return wrapper
# Better: store state in the wrapper's closure or use thread-local storage
```
""",

4: """## OOP: Classes, Inheritance, and the Data Model

Python's object model is built around "magic methods" (dunder methods). Understanding them lets you create classes that behave like built-in types.

### Class Fundamentals

```python
class BankAccount:
    interest_rate = 0.03  # class variable: shared across all instances

    def __init__(self, owner: str, balance: float = 0.0):
        self.owner = owner           # instance variable
        self._balance = balance      # convention: "private" (name mangling: __)
        self.__secret = "hidden"     # name-mangled to _BankAccount__secret

    @property
    def balance(self) -> float:
        # Getter: accessed like an attribute, not a method call.
        return self._balance

    @balance.setter
    def balance(self, value: float):
        if value < 0:
            raise ValueError("Balance cannot be negative")
        self._balance = value

    def deposit(self, amount: float) -> None:
        if amount <= 0:
            raise ValueError("Deposit amount must be positive")
        self._balance += amount

    def withdraw(self, amount: float) -> None:
        if amount > self._balance:
            raise ValueError("Insufficient funds")
        self._balance -= amount

    @classmethod
    def from_dict(cls, data: dict) -> 'BankAccount':
        # Alternative constructor — factory method.
        return cls(owner=data['owner'], balance=data.get('balance', 0))

    @staticmethod
    def validate_amount(amount: float) -> bool:
        # Utility — no access to self or cls needed.
        return isinstance(amount, (int, float)) and amount > 0

    def __repr__(self) -> str:
        return f"BankAccount(owner={self.owner!r}, balance={self._balance})"

    def __str__(self) -> str:
        return f"{self.owner}'s account: ${self._balance:.2f}"
```

### The Python Data Model (Dunder Methods)

```python
class Money:
    def __init__(self, amount: float, currency: str = 'USD'):
        self.amount = amount
        self.currency = currency

    # Arithmetic operators
    def __add__(self, other: 'Money') -> 'Money':
        if self.currency != other.currency:
            raise ValueError("Cannot add different currencies")
        return Money(self.amount + other.amount, self.currency)

    def __mul__(self, factor: float) -> 'Money':
        return Money(self.amount * factor, self.currency)

    def __rmul__(self, factor: float) -> 'Money':  # factor * money
        return self.__mul__(factor)

    # Comparison operators
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Money): return NotImplemented
        return self.amount == other.amount and self.currency == other.currency

    def __lt__(self, other: 'Money') -> bool:
        return self.amount < other.amount

    # Container protocol
    def __bool__(self) -> bool:
        return self.amount != 0

    # String representation
    def __repr__(self) -> str:
        return f"Money({self.amount!r}, {self.currency!r})"

    def __str__(self) -> str:
        return f"{self.currency} {self.amount:.2f}"

m1 = Money(10, 'USD')
m2 = Money(5, 'USD')
m1 + m2        # Money(15, 'USD')
2 * m1         # Money(20, 'USD')
m1 > m2        # True (uses __lt__ via functools.total_ordering)
bool(Money(0)) # False
```

### Inheritance and MRO

```python
class Animal:
    def __init__(self, name: str):
        self.name = name

    def speak(self) -> str:
        raise NotImplementedError  # or use ABC

    def __repr__(self) -> str:
        return f"{type(self).__name__}({self.name!r})"

class Dog(Animal):
    def speak(self) -> str:
        return f"{self.name} says: Woof!"

    def fetch(self, item: str) -> str:
        return f"{self.name} fetches {item}"

class Cat(Animal):
    def speak(self) -> str:
        return f"{self.name} says: Meow!"

# Multiple inheritance — MRO (Method Resolution Order) with C3 linearization
class Base:
    def method(self): return "Base"

class A(Base):
    def method(self): return f"A -> {super().method()}"

class B(Base):
    def method(self): return f"B -> {super().method()}"

class C(A, B):  # MRO: C → A → B → Base
    pass

C.mro()  # [C, A, B, Base, object]
C().method()  # "A -> B -> Base"
```

### Abstract Base Classes

```python
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

    @abstractmethod
    def perimeter(self) -> float: ...

    def describe(self) -> str:
        return f"{type(self).__name__}: area={self.area():.2f}, perimeter={self.perimeter():.2f}"

class Circle(Shape):
    def __init__(self, radius: float):
        self.radius = radius
    def area(self) -> float:
        return 3.14159 * self.radius ** 2
    def perimeter(self) -> float:
        return 2 * 3.14159 * self.radius

# Shape()  # TypeError: Can't instantiate abstract class Shape
# Circle must implement both abstractmethods or also be abstract
```

### Interview Q&A

**Q: What is the difference between `__str__` and `__repr__`?**
A: `__repr__` should return an unambiguous, ideally eval-able string representation (for developers). `__str__` should return a human-readable string (for end users). `str()` uses `__str__`, falling back to `__repr__`. `repr()` always uses `__repr__`. In the REPL and `print()` on collections, Python uses `__repr__`. Rule of thumb: `__repr__` looks like `ClassName(field=value)`.

**Q: What is the MRO and why does it matter?**
A: Method Resolution Order determines which class's method is called with `super()` in multiple inheritance. Python uses C3 linearization — it creates a consistent ordering that respects both the local class hierarchy and each class's own MRO. `ClassName.mro()` shows the order. It prevents the "diamond problem" by ensuring each class appears exactly once in the chain.

**Q: What are `@classmethod` and `@staticmethod` used for?**
A: `@classmethod` receives the class (`cls`) as the first argument instead of the instance. It's used for alternative constructors (factory methods like `from_dict`, `from_csv`) and class-level logic. `@staticmethod` receives no implicit first argument — it's a regular function namespaced in the class. Use it for utility functions that don't need class or instance access but logically belong with the class.

### Common Mistakes

```python
# Mistake: mutable class variable shared across all instances
class Config:
    settings = {}     # SHARED across all Config instances!

c1 = Config()
c2 = Config()
c1.settings['key'] = 'value'
print(c2.settings)  # {'key': 'value'} — same dict!

# Fix: initialize in __init__
class Config:
    def __init__(self):
        self.settings = {}  # each instance gets its own dict

# Mistake: not calling super().__init__() in multi-inheritance
class A:
    def __init__(self): self.a = 1
class B(A):
    def __init__(self):
        super().__init__()  # must call super to initialize A
        self.b = 2
```
""",

5: """## Generators, Iterators, and Functional Tools

Generators are one of Python's most powerful features — they enable lazy evaluation, memory-efficient pipelines, and elegant solutions to many algorithmic problems.

### Iterators and the Iterator Protocol

```python
# An object is iterable if it implements __iter__
# An iterator implements __iter__ and __next__

class CountUp:
    def __init__(self, start, stop):
        self.current = start
        self.stop = stop

    def __iter__(self):
        return self  # iterator returns itself

    def __next__(self):
        if self.current >= self.stop:
            raise StopIteration
        value = self.current
        self.current += 1
        return value

for n in CountUp(1, 4):   # 1, 2, 3
    print(n)

# Python's for loop desugars to:
iterator = iter(CountUp(1, 4))
while True:
    try:
        n = next(iterator)
        print(n)
    except StopIteration:
        break
```

### Generator Functions

```python
# A generator function uses 'yield' instead of 'return'
# It returns a generator object — computes values lazily on demand

def count_up(start, stop):
    current = start
    while current < stop:
        yield current     # suspend here, return value to caller
        current += 1      # resume here when next() is called

gen = count_up(1, 4)
next(gen)   # 1
next(gen)   # 2
next(gen)   # 3
next(gen)   # StopIteration

# Infinite generator — no memory issue!
def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

# Take first N from infinite generator:
from itertools import islice
list(islice(fibonacci(), 10))  # [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

### Generator Pipelines

```python
import csv
import gzip

# Pipeline: each step is lazy, data flows one row at a time
def read_gzipped_csv(filename):
    # Reads a gzipped CSV file line by line.
    with gzip.open(filename, 'rt') as f:
        reader = csv.DictReader(f)
        yield from reader   # yield from: delegates to sub-generator

def filter_active(rows):
    # Keep only active users.
    return (row for row in rows if row['active'] == 'true')

def transform_row(rows):
    # Normalize fields.
    for row in rows:
        yield {
            'id': int(row['id']),
            'name': row['name'].strip(),
            'email': row['email'].lower(),
        }

def save_to_db(rows, batch_size=1000):
    # Batch inserts.
    batch = []
    for row in rows:
        batch.append(row)
        if len(batch) >= batch_size:
            db.bulk_insert(batch)
            batch.clear()
    if batch:
        db.bulk_insert(batch)

# Compose the pipeline — processes 1M rows with minimal memory!
rows = read_gzipped_csv('users.csv.gz')
rows = filter_active(rows)
rows = transform_row(rows)
save_to_db(rows)
```

### itertools: The Power Tools

```python
import itertools

# chain: flatten multiple iterables
list(itertools.chain([1, 2], [3, 4], [5]))  # [1, 2, 3, 4, 5]
list(itertools.chain.from_iterable([[1,2],[3,4]]))  # [1, 2, 3, 4]

# groupby: group consecutive elements by key
from itertools import groupby
data = sorted([('A', 1), ('B', 2), ('A', 3), ('B', 4)], key=lambda x: x[0])
for key, group in groupby(data, key=lambda x: x[0]):
    print(key, list(group))
# A [('A', 1), ('A', 3)]
# B [('B', 2), ('B', 4)]

# islice: slice a lazy iterator
list(itertools.islice(fibonacci(), 5, 10))  # [5, 8, 13, 21, 34]

# product, permutations, combinations
list(itertools.product([1, 2], ['a', 'b']))  # [(1,'a'),(1,'b'),(2,'a'),(2,'b')]
list(itertools.combinations([1,2,3], 2))     # [(1,2),(1,3),(2,3)]
list(itertools.permutations([1,2,3], 2))     # 6 pairs

# accumulate: running totals
list(itertools.accumulate([1, 2, 3, 4, 5]))  # [1, 3, 6, 10, 15]
```

### functools Tools

```python
from functools import reduce, partial, reduce

# reduce: fold a sequence
reduce(lambda acc, x: acc + x, [1, 2, 3, 4, 5], 0)  # 15
reduce(lambda a, b: a * b, [1, 2, 3, 4, 5])          # 120

# map and filter (lazy in Python 3)
squares = list(map(lambda x: x**2, range(10)))
evens = list(filter(lambda x: x % 2 == 0, range(10)))

# Prefer comprehensions for readability:
squares = [x**2 for x in range(10)]
evens = [x for x in range(10) if x % 2 == 0]
```

### Interview Q&A

**Q: What is the difference between a generator and a list?**
A: A list stores all values in memory simultaneously. A generator computes values lazily — one at a time, on demand. Generators use O(1) memory regardless of sequence length. The trade-off: you can only iterate a generator once, and you can't index into it. Use generators for large/infinite sequences or one-pass processing pipelines.

**Q: What does `yield from` do?**
A: `yield from iterable` is shorthand for `for item in iterable: yield item`. It also handles two-way communication (`.send()`) and exception propagation properly. It's commonly used to delegate to a sub-generator in a generator pipeline.

**Q: When would you implement `__iter__` and `__next__` instead of using a generator?**
A: When you need to maintain complex state, support multiple simultaneous iterations of the same object, or implement `__reversed__`. For simple sequences, generator functions are cleaner. For objects that need to be iterable as a core part of their identity (like a custom collection class), implement the iterator protocol.

### Common Mistakes

```python
# Mistake: using a generator multiple times
gen = (x**2 for x in range(5))
list(gen)  # [0, 1, 4, 9, 16]
list(gen)  # [] — generator exhausted!

# Fix: create a new generator, or convert to list if you need to reuse:
squares = [x**2 for x in range(5)]   # list: reusable

# Mistake: sorting with groupby without sorting first
data = [('B', 1), ('A', 2), ('B', 3), ('A', 4)]
for k, g in groupby(data, key=lambda x: x[0]):
    print(k, list(g))
# B [('B', 1)]
# A [('A', 2)]
# B [('B', 3)]    ← WRONG: 4 groups instead of 2!
# A [('A', 4)]
# Fix: sort before groupby
data_sorted = sorted(data, key=lambda x: x[0])
```
""",

6: """## Error Handling, Testing with pytest, and Debugging

Robust Python code handles errors explicitly, is thoroughly tested, and is easy to debug.

### Exception Hierarchy and Best Practices

```python
# Exception hierarchy (partial):
# BaseException
# ├── SystemExit
# ├── KeyboardInterrupt
# ├── GeneratorExit
# └── Exception
#     ├── ValueError, TypeError, KeyError, IndexError, ...
#     └── Your custom exceptions

# Custom exception hierarchy
class AppError(Exception):
    # Base exception for application errors.
    def __init__(self, message: str, code: str = "INTERNAL_ERROR"):
        super().__init__(message)
        self.code = code

class NotFoundError(AppError):
    def __init__(self, resource: str, id: int):
        super().__init__(f"{resource} with id={id} not found", code="NOT_FOUND")
        self.resource = resource
        self.id = id

class ValidationError(AppError):
    def __init__(self, field: str, message: str):
        super().__init__(f"{field}: {message}", code="VALIDATION_ERROR")
        self.field = field

# Usage:
try:
    user = get_user(user_id)
except NotFoundError as e:
    return {"error": str(e), "code": e.code}, 404
except ValidationError as e:
    return {"error": str(e), "field": e.field}, 400
except AppError as e:
    logger.error(f"App error: {e}")
    return {"error": "Internal error"}, 500
```

### Context Managers

```python
# Context manager protocol: __enter__ and __exit__

# Built-in: file handling
with open('data.csv', 'r') as f:
    content = f.read()
# file is automatically closed even if an exception occurs

# Custom context manager using class
class DatabaseTransaction:
    def __init__(self, connection):
        self.conn = connection

    def __enter__(self):
        self.conn.begin()
        return self.conn  # 'as' value

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self.conn.rollback()
            return False   # re-raise the exception
        self.conn.commit()
        return False       # don't suppress exceptions

with DatabaseTransaction(db.connection) as conn:
    conn.execute("INSERT INTO users ...")
    conn.execute("UPDATE accounts ...")
# auto-commit on success, rollback on exception

# context manager using contextlib
from contextlib import contextmanager, suppress

@contextmanager
def timer(label: str):
    import time
    start = time.perf_counter()
    try:
        yield  # code inside 'with' block runs here
    finally:
        duration = time.perf_counter() - start
        print(f"{label}: {duration:.4f}s")

with timer("database query"):
    results = db.execute("SELECT * FROM large_table")

# suppress: ignore specific exceptions
with suppress(FileNotFoundError):
    os.remove('temp_file.txt')  # no error if file doesn't exist
```

### Testing with pytest

```python
# test_user_service.py
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services import UserService
from app.exceptions import NotFoundError, ValidationError

class TestUserService:
    @pytest.fixture
    def mock_repo(self):
        return MagicMock()

    @pytest.fixture
    def service(self, mock_repo):
        return UserService(repository=mock_repo)

    def test_create_user_success(self, service, mock_repo):
        mock_repo.find_by_email.return_value = None  # email not taken
        mock_repo.create.return_value = {"id": 1, "name": "Alice", "email": "a@b.com"}

        result = service.create_user(name="Alice", email="a@b.com", password="pass")

        mock_repo.create.assert_called_once()
        call_args = mock_repo.create.call_args[1]
        assert "password" not in call_args          # raw password not stored
        assert "password_hash" in call_args         # hashed password stored
        assert result["name"] == "Alice"

    def test_create_user_email_taken(self, service, mock_repo):
        mock_repo.find_by_email.return_value = {"id": 1, "email": "a@b.com"}

        with pytest.raises(ValidationError) as exc_info:
            service.create_user(name="Bob", email="a@b.com", password="pass")

        assert "email" in str(exc_info.value).lower()

    @pytest.mark.parametrize("name,email,password,expected_error", [
        ("", "a@b.com", "pass", "name"),
        ("Alice", "not-an-email", "pass", "email"),
        ("Alice", "a@b.com", "x", "password"),  # too short
    ])
    def test_create_user_validation(self, service, name, email, password, expected_error):
        with pytest.raises(ValidationError) as exc_info:
            service.create_user(name=name, email=email, password=password)
        assert expected_error in str(exc_info.value).lower()

    def test_get_user_not_found(self, service, mock_repo):
        mock_repo.find_by_id.return_value = None
        with pytest.raises(NotFoundError):
            service.get_user(999)
```

### Interview Q&A

**Q: What is the difference between `except Exception` and `except BaseException`?**
A: `Exception` catches all "normal" exceptions. `BaseException` also catches `SystemExit`, `KeyboardInterrupt`, and `GeneratorExit`. Almost always catch `Exception`, not `BaseException`. If you catch `KeyboardInterrupt`, the user can't stop your program with Ctrl+C. If you catch `SystemExit`, `sys.exit()` won't work.

**Q: How do context managers work internally?**
A: The `with` statement calls `__enter__()` at entry and `__exit__(exc_type, exc_val, exc_tb)` at exit. If an exception occurs, the exception info is passed to `__exit__`. If `__exit__` returns a truthy value, the exception is suppressed; otherwise it propagates. The `@contextmanager` decorator converts a generator function (with one `yield`) into a context manager automatically.

**Q: What is the purpose of pytest fixtures?**
A: Fixtures provide reusable setup/teardown for tests. They are injected by name into test functions. Fixtures can have scope (`function`, `class`, `module`, `session`) to control when they're created and destroyed. They support dependency injection — fixtures can depend on other fixtures.

### Common Mistakes

```python
# Mistake: bare except (catches EVERYTHING including KeyboardInterrupt)
try:
    do_something()
except:  # NEVER do this
    pass

# Fix: catch specific exceptions
try:
    do_something()
except (ValueError, KeyError) as e:
    handle_error(e)

# Mistake: swallowing exceptions silently
try:
    result = parse_config(data)
except Exception:
    result = {}  # silently fails — debugging nightmare!

# Fix: at least log the error
try:
    result = parse_config(data)
except Exception as e:
    logger.error(f"Config parse failed: {e}", exc_info=True)
    result = {}
```
""",

7: """## Concurrency: Threading, Multiprocessing, and asyncio

Python has three concurrency models: threads (I/O-bound, limited by GIL), processes (CPU-bound, true parallelism), and async (I/O-bound, cooperative).

### The Global Interpreter Lock (GIL)

```python
# The GIL is a mutex in CPython that prevents multiple threads from
# executing Python bytecode simultaneously.

# Implication: threads don't run in parallel for CPU-bound work
import threading
import time

counter = 0
def increment():
    global counter
    for _ in range(1_000_000):
        counter += 1  # NOT atomic even with GIL! Race conditions possible.

# Two threads: results are unpredictable without proper locking
t1 = threading.Thread(target=increment)
t2 = threading.Thread(target=increment)
t1.start(); t2.start()
t1.join(); t2.join()
print(counter)  # probably NOT 2_000_000

# Fix: use threading.Lock
lock = threading.Lock()
def increment_safe():
    global counter
    for _ in range(1_000_000):
        with lock:
            counter += 1  # atomic
```

### Threading: Good for I/O-Bound Tasks

```python
import threading
from concurrent.futures import ThreadPoolExecutor
import requests

urls = ['https://httpbin.org/delay/1'] * 10

# Sequential: ~10 seconds (each waits for the previous)
def sequential_fetch(urls):
    return [requests.get(url).json() for url in urls]

# Threaded: ~1 second (all requests run concurrently, GIL releases during I/O)
def threaded_fetch(urls):
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(requests.get, url) for url in urls]
        return [f.result().json() for f in futures]

# Thread-safe queue for producer-consumer pattern
import queue
task_queue = queue.Queue(maxsize=100)

def producer():
    for item in generate_work():
        task_queue.put(item)  # blocks if queue is full
    task_queue.put(None)  # sentinel to signal done

def consumer():
    while True:
        item = task_queue.get()  # blocks until item available
        if item is None: break
        process(item)
        task_queue.task_done()
```

### Multiprocessing: For CPU-Bound Tasks

```python
from multiprocessing import Pool, cpu_count
from concurrent.futures import ProcessPoolExecutor
import os

def is_prime(n: int) -> bool:
    if n < 2: return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0: return False
    return True

numbers = list(range(1, 100_000))

# Sequential: one core
primes = [n for n in numbers if is_prime(n)]

# Multiprocessing: all cores (bypasses GIL — separate processes)
with ProcessPoolExecutor(max_workers=cpu_count()) as executor:
    results = list(executor.map(is_prime, numbers))
primes = [n for n, is_p in zip(numbers, results) if is_p]
# ~4-8x faster on an 8-core machine

# Shared memory between processes (careful with synchronization!)
from multiprocessing import Value, Array
counter = Value('i', 0)  # shared integer
arr = Array('d', [0.0] * 10)  # shared double array
```

### asyncio: For I/O-Bound Async Code

```python
import asyncio
import aiohttp

async def fetch(session: aiohttp.ClientSession, url: str) -> dict:
    async with session.get(url) as response:
        return await response.json()

async def fetch_all(urls: list[str]) -> list[dict]:
    async with aiohttp.ClientSession() as session:
        tasks = [fetch(session, url) for url in urls]
        return await asyncio.gather(*tasks)  # concurrent! not sequential

# asyncio primitives
async def producer_consumer():
    queue = asyncio.Queue(maxsize=10)

    async def producer():
        for i in range(20):
            await queue.put(i)
            await asyncio.sleep(0.1)  # simulate async work

    async def consumer(name: str):
        while True:
            item = await queue.get()
            print(f"{name} got {item}")
            await asyncio.sleep(0.2)
            queue.task_done()

    await asyncio.gather(
        producer(),
        consumer("worker-1"),
        consumer("worker-2"),
    )

asyncio.run(producer_consumer())
```

### When to Use Which

```
CPU-bound (image processing, ML, crypto):
  → multiprocessing (true parallelism, bypasses GIL)
  → concurrent.futures.ProcessPoolExecutor

I/O-bound with blocking libraries (requests, psycopg2):
  → threading / ThreadPoolExecutor
  → works because GIL is released during I/O

I/O-bound with async libraries (aiohttp, asyncpg):
  → asyncio + async/await
  → best performance, but requires async all the way down

Mixed (CPU + I/O):
  → asyncio for I/O, run CPU work in ProcessPoolExecutor via loop.run_in_executor
```

### Interview Q&A

**Q: What is the GIL and does it prevent all parallelism in Python?**
A: The Global Interpreter Lock (GIL) is a mutex in CPython that ensures only one thread executes Python bytecode at a time. It prevents true CPU parallelism with threads. However: (1) I/O operations release the GIL — threads do run concurrently during network/disk I/O. (2) C extensions can release the GIL (NumPy does this). (3) `multiprocessing` spawns separate processes with separate GILs — true CPU parallelism. Python 3.13+ is working on removing the GIL (nogil).

**Q: When would you use asyncio over threading?**
A: asyncio is more efficient for very high concurrency I/O (thousands of concurrent connections) because it uses a single thread with cooperative multitasking — no thread creation overhead, no locking needed. Threading is better when you need to use blocking libraries that don't have async equivalents. asyncio requires async-aware code throughout the call chain ("colored functions" problem).

**Q: What is `asyncio.gather` vs `asyncio.wait`?**
A: `gather(*coros)` runs coroutines concurrently and returns results in the same order as inputs; if any raises an exception and `return_exceptions=False`, the whole gather fails immediately. `wait(tasks, return_when=...)` is lower-level — it returns sets of done/pending tasks and lets you process them as they complete. Use `gather` for simple "run all, get all results" patterns; `wait` for more control.

### Common Mistakes

```python
# Mistake: running synchronous blocking code in asyncio
async def bad():
    time.sleep(1)    # BLOCKS the entire event loop!
    requests.get(url) # also blocks!

# Fix: use async libraries
async def good():
    await asyncio.sleep(1)
    async with aiohttp.ClientSession() as session:
        await session.get(url)

# Mistake: not joining threads / closing executors
executor = ThreadPoolExecutor(max_workers=4)
executor.submit(task)
# Never shut down → threads keep running even after main program exits
# Fix:
with ThreadPoolExecutor(max_workers=4) as executor:
    futures = [executor.submit(task, item) for item in items]
# executor automatically shuts down and waits for completion
```
""",

8: """## Type Hints, Protocols, and Static Analysis

Python's type hint system (PEP 484+) enables static analysis tools (mypy, pyright) to catch bugs before runtime without requiring any runtime overhead.

### Type Hints Basics

```python
from typing import Optional, Union, List, Dict, Tuple, Set, Any
from collections.abc import Callable, Sequence, Iterator, Generator

# Function annotations
def greet(name: str, times: int = 1) -> str:
    return (f"Hello, {name}! " * times).strip()

# Variable annotations
count: int = 0
items: list[str] = []  # Python 3.9+: built-ins are generic!
mapping: dict[str, int] = {}
pair: tuple[int, str] = (1, "one")

# Optional: value or None
def find_user(email: str) -> Optional[str]:  # same as str | None
    return db.query(email)

# Union: one of several types (Python 3.10+: use | directly)
def process(value: int | str | None) -> str:
    if value is None: return ""
    return str(value)

# Callable: function types
Transform = Callable[[int], int]
Handler = Callable[[str, int], bool]

def apply(fn: Transform, value: int) -> int:
    return fn(value)
```

### Generic Types

```python
from typing import TypeVar, Generic

T = TypeVar('T')
K = TypeVar('K')
V = TypeVar('V')

class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        if not self._items:
            raise IndexError("pop from empty stack")
        return self._items.pop()

    def peek(self) -> T | None:
        return self._items[-1] if self._items else None

stack: Stack[int] = Stack()
stack.push(1)
stack.push("hello")  # mypy error: Argument 1 has incompatible type "str"; expected "int"
```

### Protocols: Structural Subtyping

```python
from typing import Protocol, runtime_checkable

@runtime_checkable
class Drawable(Protocol):
    def draw(self) -> None: ...
    def resize(self, factor: float) -> None: ...

class Circle:
    def draw(self) -> None: print("Drawing circle")
    def resize(self, factor: float) -> None: self.radius *= factor

class Square:
    def draw(self) -> None: print("Drawing square")
    def resize(self, factor: float) -> None: self.side *= factor

# Both satisfy Drawable without explicit inheritance:
def render_all(items: list[Drawable]) -> None:
    for item in items:
        item.draw()

render_all([Circle(), Square()])  # Works! Structural compatibility.
isinstance(Circle(), Drawable)    # True (runtime check with @runtime_checkable)

# Real-world: Protocol for repositories
class Repository(Protocol[T]):
    def find_by_id(self, id: int) -> T | None: ...
    def save(self, entity: T) -> T: ...
    def delete(self, id: int) -> None: ...

def process_user(repo: Repository[User], user_id: int) -> None:
    user = repo.find_by_id(user_id)
    if user: repo.save(user)
```

### TypedDict and Literal

```python
from typing import TypedDict, Literal, Final

class UserDict(TypedDict):
    id: int
    name: str
    email: str
    role: Literal['admin', 'user', 'guest']  # only these values
    active: bool

class PartialUserDict(TypedDict, total=False):  # all fields optional
    name: str
    email: str

MAX_RETRIES: Final[int] = 3  # cannot be reassigned

def update_user(user_id: int, updates: PartialUserDict) -> UserDict:
    ...

# Literal types for function behavior:
def open_file(filename: str, mode: Literal['r', 'w', 'a', 'rb', 'wb']) -> ...:
    ...
```

### mypy and pyright Configuration

```ini
# mypy.ini
[mypy]
python_version = 3.12
strict = True           # enables all strict checks
ignore_missing_imports = True   # for untyped libraries

# Per-module settings:
[mypy-untyped_library.*]
ignore_missing_imports = True
```

### Interview Q&A

**Q: What is the difference between `Optional[T]` and `T | None`?**
A: They are equivalent. `Optional[T]` is shorthand for `Union[T, None]`. In Python 3.10+, the `X | Y` syntax is preferred for its clarity. `Optional` is still common in older codebases.

**Q: What is a Protocol and how is it different from an ABC?**
A: Both define interfaces. ABCs use nominal typing — a class must explicitly `class MyClass(ABC):` to satisfy the interface. Protocols use structural typing — any class that implements the required methods satisfies the Protocol, without needing to inherit from it. Protocols are better for external code you don't control and for duck-typing patterns that Python is famous for.

**Q: What does `TypeVar` do?**
A: `TypeVar` creates a type variable — a placeholder that represents a consistent type within a function or class. `T = TypeVar('T')` allows you to say "the return type is the same type as the input" — like `def first(items: list[T]) -> T`. Without TypeVar, you'd need `Any`, losing type information.

### Common Mistakes

```python
# Mistake: using List[str] instead of list[str] (Python 3.9+)
from typing import List, Dict  # old style
def process(items: List[str]) -> Dict[str, int]:  # verbose
    ...
# Modern:
def process(items: list[str]) -> dict[str, int]:  # clean
    ...

# Mistake: ignoring None in Optional
def get_user(id: int) -> Optional[User]:
    return db.find(id)

user = get_user(42)
user.name  # mypy error: Item "None" has no attribute "name"
# Fix:
if user is not None:
    user.name  # safe
```
""",

9: """## Python Packaging, Virtual Environments, and Project Structure

Modern Python development requires understanding how to structure projects, manage dependencies, and package code for distribution.

### Virtual Environments

```bash
# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate    # macOS/Linux
# .venv\\Scripts\\activate    # Windows

# Now pip installs are isolated to this project
pip install requests pandas

# Freeze current environment
pip freeze > requirements.txt

# Recreate from requirements.txt
pip install -r requirements.txt

# Modern alternative: uv (extremely fast)
uv venv
uv pip install requests
uv pip sync requirements.txt
```

### pyproject.toml: The Modern Standard

```toml
# pyproject.toml — single source of truth for project metadata and tools

[build-system]
requires = ["setuptools>=68", "wheel"]
build-backend = "setuptools.backends.legacy:build"

[project]
name = "my-api"
version = "0.1.0"
description = "A production REST API"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.110",
    "uvicorn[standard]>=0.27",
    "sqlalchemy>=2.0",
    "pydantic>=2.0",
    "python-jose[cryptography]>=3.3",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-asyncio>=0.23",
    "httpx>=0.27",        # for testing FastAPI
    "mypy>=1.8",
    "ruff>=0.3",
    "coverage>=7.4",
]

[tool.mypy]
python_version = "3.12"
strict = true

[tool.ruff]
line-length = 100
target-version = "py312"

[tool.ruff.lint]
select = ["E", "F", "I", "N", "UP", "S", "B"]  # comprehensive linting

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

### Project Structure

```
my-api/
├── pyproject.toml
├── .env                     # local secrets (gitignored!)
├── .env.example             # template (committed)
├── src/
│   └── my_api/
│       ├── __init__.py
│       ├── main.py          # FastAPI app creation
│       ├── config.py        # settings from env vars
│       ├── models/
│       │   ├── __init__.py
│       │   ├── user.py      # SQLAlchemy models
│       │   └── post.py
│       ├── schemas/
│       │   ├── user.py      # Pydantic schemas (request/response)
│       │   └── post.py
│       ├── api/
│       │   ├── __init__.py
│       │   ├── users.py     # route handlers
│       │   └── posts.py
│       ├── services/
│       │   ├── user_service.py
│       │   └── auth_service.py
│       └── db.py            # database connection
├── tests/
│   ├── conftest.py          # shared fixtures
│   ├── unit/
│   │   └── test_user_service.py
│   └── integration/
│       └── test_users_api.py
└── alembic/                 # database migrations
    ├── alembic.ini
    └── versions/
```

### Settings Management with Pydantic

```python
# config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file='.env',
        env_file_encoding='utf-8',
        case_sensitive=False,
    )

    # Required settings (no default — must be in env)
    database_url: str
    jwt_secret: str

    # Optional with defaults
    debug: bool = False
    port: int = 8000
    allowed_origins: list[str] = ["http://localhost:3000"]
    max_connections: int = 20

@lru_cache
def get_settings() -> Settings:
    return Settings()  # reads .env file

# Usage:
settings = get_settings()
database_url = settings.database_url
```

### Interview Q&A

**Q: What is the difference between `requirements.txt` and `pyproject.toml`?**
A: `requirements.txt` is a flat list of pinned dependencies (often with exact versions via `pip freeze`). `pyproject.toml` is the modern standard that defines both project metadata and abstract dependencies (with version ranges). Tools like `pip-compile` or `uv lock` can generate a `requirements.lock` from `pyproject.toml` for reproducible installs.

**Q: Why use virtual environments?**
A: Virtual environments isolate project dependencies — each project has its own Python executable and packages. Without venvs, all projects share a system Python, leading to version conflicts (project A needs requests 2.28, project B needs 2.31). Venvs are directory-based and easily created/destroyed without affecting other projects or the system Python.

**Q: What is the difference between `src/` layout and flat layout in Python projects?**
A: Flat layout: `my_package/` is in the repo root. `src/` layout: `src/my_package/` is inside a `src/` directory. The `src/` layout prevents accidentally importing the local package during development (instead of the installed version), which catches import issues earlier. It's now the recommended layout for packages intended for distribution.

### Common Mistakes

```python
# Mistake: committing secrets or .env files
# .gitignore must include:
# .env
# *.env
# .venv/
# __pycache__/
# *.pyc
# .pytest_cache/
# dist/
# *.egg-info/

# Mistake: importing from wrong location
# With flat layout, if you run pytest from root:
# import my_package  → imports from ./my_package/ (local, uninstalled)
# With src layout:
# import my_package  → must be installed (pip install -e .)
# Catches issues where __init__.py imports are broken
```
""",

10: """## Capstone: Design and Build a Production-Ready REST API

### Design: FastAPI + SQLAlchemy + PostgreSQL + Redis

```python
# main.py — FastAPI application
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db, engine, Base
from app.routers import users, auth, posts
from app.config import get_settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown: close connections
    await engine.dispose()

def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Production API",
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/docs" if settings.debug else None,  # disable in prod
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
    app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
    app.include_router(posts.router, prefix="/api/v1/posts", tags=["posts"])
    return app

app = create_app()
```

### Repository Pattern with SQLAlchemy

```python
# models/user.py
from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="user", nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())

# repositories/user_repository.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.user import User

class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_by_id(self, user_id: int) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def find_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> User:
        user = User(**kwargs)
        self.db.add(user)
        await self.db.flush()  # get ID without committing
        await self.db.refresh(user)
        return user
```

### Interview Q&A

**Q: What is the difference between `async def` and `def` in FastAPI route handlers?**
A: FastAPI runs `async def` handlers directly in the asyncio event loop — no threads created. `def` (synchronous) handlers are run in a separate thread pool via `run_in_executor` to avoid blocking the event loop. Use `async def` with async libraries (asyncpg, aiohttp), and `def` with synchronous libraries (requests, psycopg2). Mixing sync blocking calls inside `async def` blocks the event loop.

**Q: How do you handle database transactions in FastAPI?**
A: Use SQLAlchemy's session as a context manager or dependency. The common pattern is a dependency that yields a session and commits on success / rolls back on exception. Each request gets its own session; the session is committed after the handler returns successfully, or rolled back if an exception is raised.

**Q: How do you test a FastAPI application?**
A: Use `httpx.AsyncClient` with the FastAPI `app` as transport for integration tests. Use `pytest-asyncio` for async test functions. Use `pytest` fixtures to set up test databases and seed data. For unit tests, inject mock dependencies using FastAPI's `app.dependency_overrides` dictionary to replace real services with mocks.

### Python Interview Cheat Sheet

```python
# List comprehension vs generator
[x**2 for x in range(10)]      # list — all in memory
(x**2 for x in range(10))      # generator — lazy

# Unpacking
a, *rest = [1, 2, 3, 4]        # a=1, rest=[2,3,4]
first, *_, last = [1,2,3,4,5]  # first=1, last=5

# Conditional expression (ternary)
value = "yes" if condition else "no"

# walrus operator (Python 3.8+)
if (n := len(data)) > 10:
    print(f"Too long: {n}")    # n already computed

# dict.get with callable default
config.get('key') or default_value

# zip and enumerate
for i, (key, val) in enumerate(pairs):
    print(f"{i}: {key}={val}")

for a, b in zip(list1, list2):  # zip stops at shortest
    ...

# sorted with key
users.sort(key=lambda u: (u.role, u.name))  # sort by role, then name
```
"""
}

for session in sessions:
    snum = session["sessionNumber"]
    if snum in CONTENT:
        session["content"] = CONTENT[snum]

with open(PATH, "w") as f:
    json.dump(data, f, separators=(",", ":"))

added = sum(1 for s in sessions if "content" in s and len(s["content"]) > 100)
print(f"Python: updated {added}/10 sessions")
for s in sessions:
    print(f"  Session {s['sessionNumber']}: {len(s.get('content',''))} chars")
