#!/usr/bin/env python3
"""
add_answers.py
Converts plain review-question strings to "question:::answer" format
across all guru-sishya content JSON files.

Answers are generated from a curated lookup table keyed on the full
question text. Questions not in the table get a brief auto-generated
answer derived from the question itself (fallback).
"""

import json
import re
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Curated answer lookup  (question text → 1-2 sentence answer)
# ---------------------------------------------------------------------------

ANSWERS: dict[str, str] = {

    # ── ds-algo ──────────────────────────────────────────────────────────────

    # Two Pointers
    "Why is two pointers O(n) instead of O(n²)?": "Each pointer traverses the array at most once from opposite ends, so the total number of steps is bounded by n rather than all n² pairs.",
    "When do you move left vs right pointer?": "Move the left pointer right to increase the current sum or value, and move the right pointer left to decrease it — the direction depends on how your current window compares to the target.",
    "What invariant is maintained at each step?": "At every step the search space of valid answers still lies between the two pointers, so shrinking the window never discards a potential solution.",
    "Can two pointers work on unsorted arrays?": "It depends on the problem; two pointers on sorted arrays exploit order to eliminate candidates, but on unsorted arrays you typically need a hash set instead.",
    "How do you handle duplicates in two-pointer problems?": "After processing a valid pair, advance both pointers and skip over any repeated values to avoid counting duplicate answers.",

    # Sliding Window
    "What is the key insight behind sliding window?": "Instead of recomputing the result for every subarray from scratch, you maintain a running state and slide the window by adding one element and removing another in O(1).",
    "When do you expand vs shrink the window?": "Expand (move right pointer) to satisfy the constraint or grow the window; shrink (move left pointer) when the window violates the constraint or you want to find the minimum size.",
    "How is sliding window different from two pointers?": "Sliding window always moves both pointers in the same direction (left ≤ right), maintaining a contiguous subarray, whereas two pointers often move toward each other from opposite ends.",
    "What data structures pair well with sliding window?": "Hash maps (for character/element counts), deques (for range-maximum/minimum queries), and running sums are the most common companions to sliding window.",
    "How do you detect when to use sliding window?": "Look for questions asking for the longest/shortest subarray or substring satisfying some condition — the phrase 'contiguous subarray' is a strong signal.",

    # Binary Search
    "What is the time complexity of binary search?": "Binary search runs in O(log n) time because each comparison halves the remaining search space.",
    "Why must the array be sorted for binary search?": "Binary search relies on monotonicity — it discards half the search space based on a comparison, which is only valid when elements are ordered.",
    "How do you find the leftmost insertion point?": "Use the left-boundary variant: when nums[mid] equals the target, continue searching left (hi = mid) so the loop converges to the first valid position.",
    "What is the difference between lo < hi and lo <= hi?": "lo <= hi is used when you return inside the loop upon finding the target; lo < hi is used when you want the loop to exit with lo == hi pointing to the answer.",
    "How do you binary search on the answer space?": "Define a predicate that is monotonically true/false, then binary search over the range of possible answers to find the boundary where the predicate flips.",
    "What happens if mid calculation overflows?": "Using mid = lo + (hi - lo) / 2 avoids overflow; mid = (lo + hi) / 2 can overflow in languages with fixed-width integers when lo + hi exceeds the maximum value.",

    # Fast & Slow Pointers
    "Why does Floyd's cycle detection work?": "The fast pointer laps the slow pointer inside any cycle; once both are in the cycle, the distance between them decreases by 1 each step, so they must meet.",
    "How do you find the start of a cycle?": "After the two pointers meet inside the cycle, reset one pointer to the head and advance both one step at a time — they will meet again at the cycle's entry node.",
    "What is the time complexity of cycle detection?": "Cycle detection runs in O(n) time and O(1) space, since both pointers traverse the list at most twice before meeting.",
    "How do you find the middle of a linked list?": "Use a slow pointer advancing one step and a fast pointer advancing two steps; when fast reaches the end, slow is at the midpoint.",
    "Can fast/slow pointers detect cycles in graphs?": "The two-pointer technique is specific to linear structures like linked lists; cycle detection in graphs is done with DFS coloring or union-find instead.",

    # Linked List In-place Reversal
    "How do you reverse a linked list in-place?": "Iterate through the list, at each node save the next pointer, point current.next to the previous node, advance previous to current, and advance current to saved next.",
    "What is the time and space complexity of in-place reversal?": "In-place reversal is O(n) time and O(1) space, since it uses only a constant number of pointer variables.",
    "How do you reverse a sublist from position m to n?": "Traverse to position m-1, then reverse the n-m+1 nodes using the standard three-pointer technique, and reconnect the reversed segment to the surrounding list.",
    "What edge cases exist in linked list reversal?": "Watch for an empty list, a single-node list, reversing the entire list (m=1), and off-by-one errors when reconnecting head and tail of the reversed segment.",
    "How does in-place reversal differ from using a stack?": "In-place reversal uses O(1) extra space by rewiring pointers directly; a stack approach stores all node values in O(n) space and then rebuilds the list.",

    # Tree BFS
    "What data structure is used for BFS?": "BFS uses a queue (FIFO) so that nodes are processed in the order they were discovered, level by level.",
    "How does BFS differ from DFS on trees?": "BFS explores nodes level by level using a queue; DFS explores as deep as possible along each branch using a stack (or recursion).",
    "What is the space complexity of BFS?": "In the worst case (a complete binary tree) BFS holds O(n) nodes in the queue simultaneously, so space complexity is O(n).",
    "When is BFS preferred over DFS?": "BFS is preferred when you need the shortest path in an unweighted graph or the minimum depth of a tree, because it visits nodes in order of increasing distance.",
    "How do you track levels in BFS?": "At the start of each iteration, record the current queue size — that many nodes belong to the current level — then enqueue their children for the next level.",

    # Tree DFS
    "What is the difference between preorder, inorder, and postorder?": "Preorder visits root then left then right; inorder visits left then root then right (giving sorted order in a BST); postorder visits left then right then root.",
    "When would you use iterative vs recursive DFS?": "Recursive DFS is cleaner but risks stack overflow on very deep trees; iterative DFS with an explicit stack avoids that limit and is preferred in production code.",
    "How do you detect if a binary tree is balanced?": "Use a postorder DFS that returns the height of each subtree; if at any node the heights of the left and right subtrees differ by more than 1, return -1 to signal imbalance.",
    "What is the time complexity of DFS on a tree?": "DFS visits every node exactly once, so it runs in O(n) time and uses O(h) space on the call stack where h is the tree height.",
    "How does path sum use DFS?": "Pass a running sum down the recursion; at each leaf check if the accumulated value equals the target, and return true if any path matches.",

    # Heap / Priority Queue
    "When do you use a min-heap vs max-heap?": "Use a min-heap when you repeatedly need the smallest element (e.g., Dijkstra's, merge k sorted lists); use a max-heap when you need the largest (e.g., k largest elements).",
    "What is the time complexity of heap operations?": "Insertion and removal from a heap are O(log n); peeking at the top element is O(1); building a heap from n elements is O(n) using heapify.",
    "How do you find the kth largest element?": "Maintain a min-heap of size k; for each new element, push it and pop the minimum — after processing all elements the heap's minimum is the kth largest.",
    "How does a heap differ from a sorted array?": "A heap provides O(log n) insertions and O(log n) deletions of the extremum, while a sorted array offers O(1) access to extremes but O(n) insertion.",
    "What is the space complexity of heap sort?": "Heap sort sorts in-place using O(1) extra space (beyond the input array) while achieving O(n log n) time.",

    # Graph BFS/DFS
    "How do you avoid revisiting nodes in graph BFS?": "Maintain a visited set (or boolean array); mark a node visited when it is first enqueued, not when it is dequeued, to prevent adding duplicates to the queue.",
    "What is the difference between graph BFS and tree BFS?": "Graph BFS needs an explicit visited set because graphs can have cycles; tree BFS has no cycles so every node is reached exactly once without tracking.",
    "How do you find connected components with DFS?": "Iterate over all nodes; for each unvisited node start a DFS that marks all reachable nodes — each DFS call covers one connected component.",
    "When does BFS guarantee shortest path?": "BFS guarantees the shortest path in terms of number of edges only in unweighted graphs; in weighted graphs, Dijkstra's algorithm is needed.",
    "What is the time complexity of DFS on a graph?": "DFS runs in O(V + E) time where V is the number of vertices and E is the number of edges, since each vertex and each edge is examined at most once.",

    # Dynamic Programming
    "What are the two properties needed for DP?": "A problem is suitable for DP when it has optimal substructure (optimal solution built from optimal sub-solutions) and overlapping subproblems (same subproblems solved multiple times).",
    "What is the difference between memoization and tabulation?": "Memoization (top-down) adds caching to recursion and only solves needed subproblems; tabulation (bottom-up) fills a table iteratively, solving all subproblems in order.",
    "How do you identify DP state?": "The DP state captures all information needed to uniquely define a subproblem — typically indices, remaining capacity, or a bitmask of choices made so far.",
    "What is the time complexity of 1D DP?": "1D DP problems with n states and O(1) work per state run in O(n) time and O(n) space, which can often be reduced to O(1) if only the previous state is needed.",
    "How does knapsack DP work?": "Define dp[i][w] as the max value using the first i items with weight capacity w; for each item either skip it (dp[i-1][w]) or include it (value[i] + dp[i-1][w-weight[i]]) and take the max.",

    # Backtracking
    "What is the difference between backtracking and brute force?": "Backtracking prunes the search tree early by abandoning partial solutions that cannot lead to a valid answer, making it faster than exhaustive brute force.",
    "How do you avoid duplicate combinations in backtracking?": "Sort the candidates first and skip a candidate at the same recursion level if it equals the previous candidate, ensuring each unique combination is generated only once.",
    "What is the time complexity of backtracking?": "Backtracking is generally exponential in the worst case, but pruning often makes it much faster in practice — permutations of n elements take O(n!) time.",
    "How do you represent state in backtracking?": "Use a mutable path list that you append to before recursing and pop from after — this single list tracks the current partial solution without copying.",
    "When should you copy vs reference the current path?": "Append a snapshot (copy) of the path to results when you find a complete solution, but always pass the same mutable list by reference during recursion to avoid O(n) copies at every step.",

    # Greedy
    "What is the greedy choice property?": "A problem has the greedy choice property when a locally optimal choice at each step leads to a globally optimal solution without needing to reconsider earlier decisions.",
    "How do you prove a greedy algorithm is correct?": "Use an exchange argument: assume an optimal solution differs from the greedy solution, then show that swapping any differing choice with the greedy choice cannot decrease the objective.",
    "When does greedy fail?": "Greedy fails when local choices do not lead to global optimum — for example, the fractional knapsack is solvable greedily but 0/1 knapsack requires DP because items cannot be split.",
    "What is the difference between greedy and DP?": "Greedy makes one irrevocable choice per step without re-examining subproblems; DP considers all choices and combines sub-solutions, trading speed for generality.",
    "How does interval scheduling use greedy?": "Sort intervals by end time and always pick the interval that ends earliest and does not overlap the last selected one — this maximizes the number of non-overlapping intervals.",

    # Sorting & Searching
    "What is the average time complexity of quicksort?": "Quicksort averages O(n log n) because a good pivot splits the array roughly in half each time, but degrades to O(n²) with a consistently bad pivot (e.g., already sorted input).",
    "Why is merge sort preferred for linked lists?": "Merge sort splits and merges without random access, making it well-suited for linked lists; quicksort requires random access for efficient partitioning, which linked lists lack.",
    "What is the space complexity of merge sort?": "Merge sort requires O(n) extra space for the temporary merged arrays, unlike in-place sorts like heapsort or insertion sort.",
    "How does counting sort achieve O(n) time?": "Counting sort tallies element frequencies in an array indexed by value, then reconstructs the sorted output — it avoids comparisons entirely, but requires a bounded integer range.",
    "When would you use a linear-time sort?": "Use counting, radix, or bucket sort when elements are integers within a known range; comparison-based sorts cannot beat O(n log n) by the comparison-sort lower bound.",

    # ── core-cs ──────────────────────────────────────────────────────────────

    # Operating Systems
    "What is the difference between a process and a thread?": "A process is an independent program with its own memory space; a thread is a lightweight execution unit within a process that shares memory and resources with other threads.",
    "How does virtual memory work?": "Virtual memory maps each process's logical addresses to physical RAM pages via a page table; pages not currently in RAM are stored on disk and loaded on demand (page fault).",
    "What is a deadlock and what are the four conditions for it?": "A deadlock is a standstill where processes wait on each other forever; it requires mutual exclusion, hold-and-wait, no preemption, and circular wait — all four simultaneously.",
    "How does a context switch work?": "The OS saves the CPU registers and program counter of the running process into its PCB, then loads the saved state of the next scheduled process so it resumes seamlessly.",
    "What is the difference between mutex and semaphore?": "A mutex is a binary lock owned by the thread that acquired it and must be released by the same thread; a semaphore is a counter that can be signaled by any thread and allows N concurrent accesses.",
    "What is thrashing in operating systems?": "Thrashing occurs when a system spends more time swapping pages in and out of memory than executing processes, because the working sets of active processes exceed available RAM.",
    "How does the OS scheduler decide which process runs next?": "Common scheduling algorithms include round-robin (fixed time slices), priority scheduling, and shortest-job-first; modern OSes use multilevel feedback queues combining these approaches.",
    "What is copy-on-write in the context of fork?": "After fork, the parent and child share the same physical memory pages; a private copy is made only when either process writes to a page, deferring the copy cost until it is actually needed.",
    "How does inter-process communication differ from inter-thread communication?": "Processes communicate through OS-mediated mechanisms (pipes, sockets, shared memory, message queues) because they have separate address spaces; threads communicate directly through shared memory within the process.",
    "What is the purpose of the Translation Lookaside Buffer?": "The TLB is a small hardware cache that stores recent virtual-to-physical address translations so the CPU can resolve most memory accesses without consulting the full page table in RAM.",

    # Computer Networks
    "What happens when you type a URL in a browser?": "The browser resolves the hostname via DNS, opens a TCP connection (plus TLS handshake for HTTPS), sends an HTTP request, receives the response, and renders the page.",
    "What is the difference between TCP and UDP?": "TCP provides reliable, ordered, connection-oriented delivery with flow and congestion control; UDP is connectionless and unreliable but has lower latency, suitable for real-time applications.",
    "How does TCP's three-way handshake work?": "The client sends SYN, the server responds with SYN-ACK, and the client replies with ACK — after this exchange both sides have synchronized sequence numbers and the connection is established.",
    "What is the OSI model and why does it matter?": "The OSI model splits network communication into 7 layers (Physical, Data Link, Network, Transport, Session, Presentation, Application), providing a standard framework for protocol design and troubleshooting.",
    "How does DNS resolution work?": "The resolver queries a recursive resolver, which contacts root name servers, then TLD servers, then the authoritative name server for the domain to obtain the IP address, caching results at each step.",
    "What is HTTP/2's main advantage over HTTP/1.1?": "HTTP/2 uses binary framing and multiplexing — multiple requests and responses share a single TCP connection concurrently — eliminating the head-of-line blocking of HTTP/1.1.",
    "How does TLS ensure secure communication?": "TLS uses asymmetric cryptography to authenticate the server and exchange a symmetric session key, then encrypts all subsequent data with that session key for speed.",
    "What is the difference between a router and a switch?": "A switch forwards frames within a local network using MAC addresses (Layer 2); a router forwards packets between networks using IP addresses (Layer 3).",
    "How does NAT work?": "NAT allows multiple devices on a private network to share a single public IP by rewriting source IP/port on outgoing packets and reversing the translation on incoming replies.",
    "What is the purpose of the ARP protocol?": "ARP resolves an IP address to a MAC address on a local network by broadcasting a request; the device with that IP replies with its MAC address so frames can be addressed correctly.",

    # Databases
    "What are ACID properties?": "ACID stands for Atomicity (all-or-nothing transactions), Consistency (data always valid), Isolation (concurrent transactions do not interfere), and Durability (committed data survives crashes).",
    "What is the difference between a clustered and non-clustered index?": "A clustered index determines the physical storage order of rows, so there can be only one; a non-clustered index is a separate structure with pointers to the actual rows.",
    "How does a B-tree index work?": "A B-tree index keeps keys sorted in a balanced tree of fixed-size pages; each lookup traverses from root to leaf in O(log n) I/Os, and range scans follow leaf-page links.",
    "What is database normalization?": "Normalization organizes data into tables to reduce redundancy: 1NF eliminates repeating groups, 2NF removes partial dependencies, and 3NF removes transitive dependencies.",
    "What is the N+1 query problem?": "The N+1 problem occurs when fetching a list of N records and then issuing one extra query per record to load related data — solved by eager loading (JOIN or batch fetch).",
    "What is a transaction isolation level?": "Isolation levels (Read Uncommitted, Read Committed, Repeatable Read, Serializable) trade consistency for concurrency by controlling which anomalies (dirty reads, phantom reads) are permitted.",
    "How does an index improve query performance?": "An index lets the database locate rows matching a predicate without scanning the entire table, reducing I/O from O(n) to O(log n) for equality and range lookups.",
    "What is the difference between SQL and NoSQL databases?": "SQL databases enforce a fixed schema and support complex queries with ACID guarantees; NoSQL databases offer flexible schemas and horizontal scaling, often relaxing some ACID properties.",
    "What is sharding in databases?": "Sharding horizontally partitions data across multiple database nodes by a shard key, so each node stores and serves only a subset of the data, enabling horizontal scalability.",
    "How does a write-ahead log ensure durability?": "Before any data page is modified, the change is written to a sequential WAL on disk; after a crash the database replays the log to recover all committed transactions.",

    # Computer Architecture
    "What is the difference between RISC and CISC architectures?": "RISC (e.g., ARM) uses a small set of simple fixed-length instructions executed in one cycle; CISC (e.g., x86) has complex variable-length instructions that may take many cycles.",
    "How does CPU cache work?": "The CPU checks L1, then L2, then L3 cache before going to RAM; caches store recently accessed data in fast SRAM close to the CPU to reduce the latency of memory accesses.",
    "What is pipeline hazard?": "A pipeline hazard prevents the next instruction from executing in its expected cycle; types include data hazards (dependency on a prior result), control hazards (branches), and structural hazards (resource conflicts).",
    "What is cache coherence?": "Cache coherence ensures that all CPU cores see a consistent view of memory — when one core writes to a cached address, other cores' copies are invalidated or updated via protocols like MESI.",
    "What is branch prediction?": "Branch prediction is a CPU optimization that guesses the outcome of a conditional branch before it is resolved, allowing the pipeline to continue executing instructions rather than stalling.",
    "What is the memory hierarchy?": "The memory hierarchy from fastest/smallest to slowest/largest is: registers → L1 cache → L2 cache → L3 cache → RAM → SSD → HDD, with each level trading speed for capacity.",
    "How does out-of-order execution work?": "The CPU dynamically reorders independent instructions to keep execution units busy while waiting for data from slower memory, then commits results in original program order.",
    "What is a TLB miss?": "A TLB miss means the virtual-to-physical translation is not cached; the CPU must walk the page table in memory (a page table walk) to find the mapping, which adds several memory accesses of latency.",
    "What is the difference between SRAM and DRAM?": "SRAM stores each bit in a flip-flop (fast, no refresh needed, expensive); DRAM stores each bit in a capacitor (needs periodic refresh, slower, but much denser and cheaper).",
    "How does speculative execution work?": "The CPU executes instructions along a predicted path before knowing if the prediction is correct; if wrong, it rolls back the speculative results and re-executes the correct path.",

    # Compiler Design
    "What are the phases of a compiler?": "A compiler proceeds through lexical analysis (tokenizing), parsing (building an AST), semantic analysis (type checking), optimization, and code generation.",
    "What is the difference between a compiler and an interpreter?": "A compiler translates source code to machine code ahead of time; an interpreter executes source code directly, translating it instruction by instruction or statement by statement at runtime.",
    "How does garbage collection work?": "Common GC algorithms include mark-and-sweep (mark reachable objects, sweep unreachable ones), reference counting (reclaim when count hits zero), and generational GC (most objects die young).",
    "What is type inference?": "Type inference allows the compiler to automatically deduce the types of expressions without explicit annotations, using algorithms like Hindley-Milner unification.",
    "What is an abstract syntax tree?": "An AST is a tree representation of a program's syntactic structure where each node represents a language construct; it omits punctuation details and is used for semantic analysis and code generation.",
    "What is register allocation?": "Register allocation is the compiler phase that assigns program variables to CPU registers; since registers are limited, spilling (storing excess variables to memory) is used when needed.",
    "What is the difference between static and dynamic linking?": "Static linking copies library code into the executable at compile time; dynamic linking resolves library references at load time or runtime, sharing one copy of the library among processes.",
    "How does JIT compilation work?": "Just-in-time compilation compiles hot code paths to native machine code at runtime rather than ahead of time, combining the portability of interpretation with near-native execution speed.",
    "What is a symbol table in a compiler?": "A symbol table is a data structure the compiler maintains to map identifiers (variables, functions) to their types, scopes, and memory locations, used during semantic analysis and code generation.",
    "What is common subexpression elimination?": "CSE is a compiler optimization that detects repeated computations with the same operands and replaces subsequent occurrences with a reference to the already-computed result.",

    # ── dsa-patterns ─────────────────────────────────────────────────────────

    "What pattern is most efficient for finding pairs that sum to a target?": "The two-pointer pattern on a sorted array is most efficient, solving the problem in O(n) time and O(1) space by moving pointers from both ends toward the center.",
    "When should you use a hash map over sorting?": "Use a hash map when you need O(1) lookups and the input is unsorted or sorting would be too expensive; sort when you need ordered traversal or the two-pointer approach applies.",
    "What is the monotonic stack pattern used for?": "A monotonic stack efficiently finds the next greater/smaller element for each item in an array by maintaining a stack of elements in increasing or decreasing order.",
    "How does prefix sum enable O(1) range queries?": "By precomputing a prefix sum array where prefix[i] = sum of elements 0..i, any subarray sum from index l to r is obtained in O(1) as prefix[r] - prefix[l-1].",
    "What distinguishes divide and conquer from DP?": "Divide and conquer splits a problem into independent subproblems and combines their results; DP also splits but explicitly caches overlapping subproblems to avoid redundant computation.",
    "When is BFS the right graph traversal?": "BFS is right when you need shortest paths in an unweighted graph or when you need to process nodes level by level, because it visits nodes in order of increasing distance from the source.",
    "What is the union-find pattern good for?": "Union-find efficiently tracks connected components and answers 'are these two nodes in the same group?' queries in near-O(1) amortized time using path compression and union by rank.",
    "How do you recognize a problem that needs a heap?": "If the problem repeatedly asks for the minimum or maximum of a dynamic set, or merges k sorted sequences, a heap provides O(log n) updates and O(1) peek at the extremum.",
    "What is the difference between DFS and backtracking?": "DFS explores all reachable states of a graph; backtracking is DFS applied to a decision tree where you undo the last choice (backtrack) when a partial solution cannot be extended to a valid one.",
    "When does greedy work and when does it fail?": "Greedy works when the problem has the greedy choice property — a local optimum leads to a global optimum. It fails when earlier choices constrain future options, requiring DP instead.",

    # ── design-patterns ───────────────────────────────────────────────────────

    "What problem does the Singleton pattern solve?": "Singleton ensures a class has exactly one instance and provides a global access point to it, useful for shared resources like configuration managers or connection pools.",
    "When would you use the Factory pattern?": "Use Factory when the exact type of object to create depends on runtime conditions or configuration, decoupling the creation logic from the code that uses the object.",
    "How does the Observer pattern enable decoupling?": "Observer lets multiple subscriber objects listen for and react to events emitted by a subject without the subject knowing anything about its subscribers, decoupling producers from consumers.",
    "What is the difference between Strategy and Template Method?": "Strategy injects interchangeable algorithm implementations via composition; Template Method defines a fixed skeleton in a base class and lets subclasses override specific steps via inheritance.",
    "How does the Decorator pattern differ from inheritance?": "Decorator wraps an object at runtime to add behavior without altering the class; inheritance adds behavior statically at compile time and cannot be selectively applied to individual instances.",
    "What is the purpose of the Adapter pattern?": "Adapter converts the interface of a class into another interface that clients expect, allowing incompatible classes to work together without modifying either.",
    "When is the Builder pattern preferred over a constructor?": "Builder is preferred when an object requires many optional parameters or complex step-by-step construction, making constructor argument lists hard to read and use.",
    "What is the Composite pattern and when is it used?": "Composite treats individual objects and groups of objects uniformly through a common interface, ideal for tree structures like file systems or UI component hierarchies.",
    "How does the Command pattern enable undo/redo?": "Each Command object encapsulates an action and its inverse; an undo stack stores executed commands, and calling each command's undo method in reverse order restores previous states.",
    "What is the difference between Facade and Adapter?": "Facade simplifies a complex subsystem by providing a unified high-level interface; Adapter makes an existing interface compatible with another without changing the underlying system.",
    "What are the three categories of design patterns?": "The three GoF categories are Creational (object creation: Factory, Singleton, Builder), Structural (composition: Adapter, Decorator, Facade), and Behavioral (communication: Observer, Strategy, Command).",
    "How does dependency injection relate to design patterns?": "Dependency injection is a form of the Inversion of Control principle; it implements the Strategy and Factory patterns by supplying dependencies from outside a class rather than having the class create them.",
    "What is the Flyweight pattern used for?": "Flyweight reduces memory usage by sharing common intrinsic state among many fine-grained objects, storing only the unique extrinsic state per object — common in rendering systems for characters or particles.",
    "When should you use the Proxy pattern?": "Use Proxy to control access to another object — common uses include lazy initialization (virtual proxy), access control (protection proxy), and remote object representation (remote proxy).",
    "What is the Iterator pattern?": "Iterator provides a standard way to traverse a collection without exposing its underlying representation, decoupling traversal logic from the collection implementation.",

    # ── estimation ────────────────────────────────────────────────────────────

    "What is a Fermi estimation?": "A Fermi estimation is a back-of-the-envelope calculation that breaks an unknown quantity into smaller estimable pieces, arriving at a reasonable order-of-magnitude answer without precise data.",
    "How do you estimate storage requirements for a system?": "Estimate the number of entities, multiply by data size per entity (schema size), and factor in replication and retention period to get total storage needs.",
    "What is the rule of thumb for estimating QPS from DAU?": "Assume active users are spread over ~10 hours a day; divide DAU by 86,400 seconds for average QPS, then multiply by a peak factor (typically 2-10x) for peak QPS.",
    "How do you estimate bandwidth requirements?": "Multiply peak QPS by the average response payload size; for uploads, multiply by upload size — then add headings and protocol overhead (typically 10-20%).",
    "What is the difference between latency and throughput?": "Latency is the time to complete a single request end-to-end; throughput is the number of requests the system can process per unit of time.",
    "How do you estimate the number of servers needed?": "Divide peak QPS by the requests per second a single server can handle (based on CPU, memory, and I/O constraints), then add headroom for failures and traffic spikes.",
    "What is the 80/20 rule in capacity estimation?": "The 80/20 rule (Pareto principle) states that roughly 80% of traffic or storage is generated by 20% of users or content, guiding cache sizing and hot-spot planning.",
    "How do you estimate read vs write ratio?": "Analyze the application's use case: social media feeds are heavily read-skewed (100:1 or more); collaborative editors or logging systems may be write-heavy (1:1 or higher write ratio).",
    "What is the significance of the numbers every engineer should know?": "Knowing approximate costs of L1 cache access (~1ns), RAM access (~100ns), SSD read (~100µs), and network round trip (~1ms) lets you quickly assess whether a design will meet latency targets.",
    "How do you approach a back-of-the-envelope calculation in an interview?": "State your assumptions explicitly, work from daily active users down to per-request load, calculate storage and bandwidth step by step, and sanity-check your final numbers against known benchmarks.",
    "What is the purpose of capacity planning in system design?": "Capacity planning ensures the system has sufficient compute, storage, and network resources to meet current demand and projected growth without over-provisioning or running out of headroom.",
    "How do you estimate cache size?": "Identify the hot dataset (the 20% of data that serves 80% of requests), multiply its size by a safety factor (1.5-2x), and size the cache to hold that working set in memory.",
    "What latency numbers should every engineer know?": "L1 cache ~1ns, L2 cache ~10ns, RAM ~100ns, SSD read ~100µs, HDD seek ~10ms, network within datacenter ~500µs, cross-continent ~150ms — these guide latency budgeting.",
    "How do you estimate the number of rows in a database table?": "Estimate new rows per day from your QPS and write fraction, then multiply by retention period; add a buffer for historical data migration if applicable.",
    "What is the difference between horizontal and vertical scaling in capacity planning?": "Vertical scaling adds resources (CPU, RAM) to existing servers and is limited by hardware maximums; horizontal scaling adds more servers and scales linearly but requires distributed system design.",
    "How do you estimate network bandwidth for video streaming?": "Estimate concurrent viewers, multiply by bitrate per stream (e.g., 5 Mbps for HD), and convert to total bandwidth; account for CDN edge capacity to reduce origin load.",
    "What is Little's Law and how is it used?": "Little's Law states L = λW (average items in a system equals arrival rate times average time in system); it lets you derive throughput, latency, or concurrency from the other two.",
    "How do you estimate storage for user-generated content?": "Estimate uploads per day × average file size × retention years, then multiply by a replication factor (typically 3x for durability) to get total raw storage.",
    "What assumptions should you state in an estimation problem?": "State the number of users (DAU/MAU), usage patterns (requests per user per day), object sizes, read/write ratio, and growth rate so your interviewer can validate your inputs.",
    "How do you handle uncertainty in back-of-the-envelope calculations?": "Use round numbers and powers of 10, make conservative assumptions explicit, and present a range (best/worst case) — the goal is an order-of-magnitude answer, not precision.",
    "How do you estimate API call volume from user behavior?": "Define a typical user session (pages visited, actions taken), count API calls per action, multiply by sessions per day, and scale by DAU to get daily total, then divide by seconds for QPS.",
    "What is the significance of data replication in storage estimation?": "Replication (typically 3 copies) multiplies raw storage requirements but provides fault tolerance and read throughput; include the replication factor whenever estimating total disk capacity.",
    "How do you estimate peak traffic from average traffic?": "Multiply average QPS by a peak-to-average ratio; typical web applications see 3-5x average traffic during peak hours, while viral events can spike 10-100x.",
    "What is the role of CDN in bandwidth estimation?": "A CDN offloads static and cacheable content from origin servers to edge nodes geographically close to users, reducing origin bandwidth costs by 60-90% for media-heavy applications.",
    "How do you estimate memory requirements for a cache?": "Calculate the working set size (hot data), add per-object overhead for the cache metadata (~50-100 bytes), and account for hash table load factor (~70% fill) to get total RAM needed.",
    "How do you estimate the cost of a system design?": "Translate resource estimates (servers, storage TB, bandwidth GB/month) into cloud pricing units ($/vCPU-hour, $/TB-month, $/GB transferred) using provider price lists or round-number estimates.",
    "What is the difference between SLA, SLO, and SLI?": "SLI (indicator) is a measurable metric like p99 latency; SLO (objective) is the target value like 'p99 < 200ms'; SLA (agreement) is the contractual commitment with penalties for breaches.",
    "How do you estimate throughput of a single database server?": "A typical OLTP database handles 1,000-10,000 simple queries per second depending on query complexity, indexing, and hardware; use 5,000 QPS as a conservative baseline for estimation.",
    "What is the purpose of load testing in capacity planning?": "Load testing measures actual system throughput and latency under realistic workloads, validating or correcting capacity estimates and revealing bottlenecks before they hit production.",
    "How do you estimate index size in a relational database?": "A B-tree index node is typically 8KB; estimate the number of leaf nodes as (rows × key size) / 8KB, then double for the internal nodes and metadata overhead.",

    # ── interview-framework ───────────────────────────────────────────────────

    "What is the STAR method for behavioral interviews?": "STAR stands for Situation (context), Task (your responsibility), Action (what you specifically did), and Result (the measurable outcome) — it provides a concise structure for behavioral answers.",
    "How should you handle a question you don't know the answer to?": "Acknowledge honestly that you are unsure, then demonstrate your thinking process by reasoning through what you do know, asking clarifying questions, and proposing how you would find the answer.",
    "What is the system design interview format?": "You are given an open-ended system to design in 45-60 minutes; the expected flow is requirements clarification, high-level design, component deep-dives, and scalability/trade-off discussion.",
    "How do you approach clarifying requirements in a system design interview?": "Ask about scale (users, QPS), functional requirements (core features), non-functional requirements (latency, availability, consistency), and constraints (budget, existing infrastructure).",
    "What is the purpose of behavioral interviews?": "Behavioral interviews assess how you handled real past situations to predict future performance, evaluating soft skills like collaboration, conflict resolution, leadership, and adaptability.",
    "How do you demonstrate impact in a behavioral answer?": "Quantify outcomes where possible (reduced latency by 40%, increased revenue by $2M, cut deployment time from 2 hours to 10 minutes) and connect your actions directly to the business result.",
    "What are common system design trade-offs to discuss?": "Key trade-offs include consistency vs. availability (CAP theorem), latency vs. throughput, read vs. write optimization, normalization vs. denormalization, and SQL vs. NoSQL.",
    "How should you structure a technical deep-dive answer?": "Start with the high-level concept, explain why it exists (the problem it solves), describe how it works mechanically, and finish with trade-offs or when you would choose an alternative.",
    "What is the difference between leadership and ownership in interviews?": "Leadership involves guiding others toward a goal; ownership means taking full responsibility for an outcome — both are valued, but ownership applies even when you have no formal authority.",
    "How do you discuss a failure or mistake in an interview?": "Describe what went wrong factually, take clear ownership without blaming others, explain what you learned, and emphasize the concrete steps you took to prevent recurrence.",
    "What are the most important metrics to mention in a system design interview?": "Mention QPS (throughput), p99/p999 latency, availability (nines), storage capacity, and replication factor — these show you think quantitatively about scale.",
    "How do you handle disagreement with an interviewer?": "Respectfully acknowledge their point, provide your reasoning with evidence, and remain open to updating your position — interviewers often probe with counter-arguments to test your thinking.",
    "What is the role of trade-offs in a system design interview?": "Articulating trade-offs shows that you understand there is no perfect solution; it demonstrates engineering judgment, which is what interviewers evaluate beyond just technical knowledge.",
    "How do you show growth mindset in behavioral interviews?": "Share examples where you sought feedback, changed your approach based on new information, or voluntarily took on unfamiliar challenges — and emphasize what you learned from those experiences.",
    "What is the purpose of the problem-solving section in coding interviews?": "Coding interviews assess your ability to break down problems, communicate your reasoning, write correct and efficient code, and handle edge cases — the thought process matters as much as the solution.",
    "How do you communicate your solution while coding?": "Narrate your thinking: state your approach before coding, call out key decisions and why you made them, point out potential edge cases as you encounter them, and invite feedback.",
    "What is the importance of time and space complexity analysis?": "Complexity analysis proves your solution scales correctly and shows you understand algorithmic fundamentals; always state the complexity and be ready to optimize if the interviewer asks.",
    "How should you handle incomplete information in system design?": "Make explicit assumptions, state them clearly, design for those assumptions, and note where the design would change if assumptions differ — this shows structured thinking under ambiguity.",
    "What is the role of failure handling in system design answers?": "Discussing failures (retries, timeouts, circuit breakers, fallbacks) demonstrates production-readiness; a design without failure handling signals inexperience with real-world distributed systems.",
    "How do you wrap up a system design interview?": "Summarize the key design decisions and trade-offs you made, identify areas you would improve with more time or data, and ask if the interviewer wants to dive deeper into any component.",
    "How do you prepare for behavioral interviews?": "Build a bank of 8-10 stories from your career that cover common themes (leadership, conflict, failure, technical challenge, collaboration) and practice adapting each story to different questions.",
    "What is the difference between a senior and staff engineer interview?": "Senior engineer interviews focus on delivering well-scoped projects independently; staff engineer interviews assess cross-team influence, long-term technical strategy, and organizational impact.",
    "How do you show customer empathy in a system design interview?": "Frame design decisions around user experience (latency, availability, data consistency) and mention how degraded modes affect end users, showing you prioritize customer outcomes over technical elegance.",
    "What is the significance of the CAP theorem in system design?": "CAP states that a distributed system can guarantee at most two of Consistency, Availability, and Partition tolerance; understanding this helps justify database and replication choices.",
    "How do you approach coding interview problems you've never seen?": "Restate the problem, work through small examples by hand, identify the data structure or pattern that fits, code a brute-force solution first, then optimize — and verbalize every step.",
    "What is the role of data modeling in system design?": "Data modeling defines the schema, relationships, and access patterns for your data; it directly influences database choice, query performance, and the complexity of your application logic.",
    "How do you demonstrate collaboration in behavioral interviews?": "Describe specific situations where you solicited input from teammates, incorporated their feedback, gave credit to others, or navigated disagreement to reach a better shared outcome.",
    "What is the difference between optimizing for reads vs writes?": "Read-optimized systems denormalize data, use caches, and add read replicas to serve queries fast; write-optimized systems use append-only logs, batch processing, and asynchronous indexing.",
    "How do you prioritize features in a system design interview?": "Distinguish must-haves (core functionality) from nice-to-haves (advanced features), design the MVP first, and explicitly defer non-critical features to avoid running out of time.",
    "How do you handle ambiguity in a coding interview?": "Ask clarifying questions about input constraints, edge cases, and expected output format before writing code; making wrong assumptions and coding the wrong thing wastes more time than asking.",

    # ── system-design-fundamentals ────────────────────────────────────────────

    "What is a load balancer?": "A load balancer distributes incoming network traffic across multiple servers to ensure no single server is overwhelmed, improving availability and performance.",
    "What are the types of load balancers?": "The main types are Layer 4 (transport-layer, routes by IP/TCP) and Layer 7 (application-layer, routes by HTTP headers/URL); hardware LBs and software LBs (e.g., Nginx, HAProxy) are also distinguished.",
    "What is horizontal vs vertical scaling?": "Horizontal scaling (scale out) adds more machines; vertical scaling (scale up) adds more resources to existing machines — horizontal scaling is more cost-effective and fault-tolerant at large scale.",
    "What is the CAP theorem?": "The CAP theorem states that a distributed system can provide at most two of three guarantees: Consistency (all nodes see the same data), Availability (every request gets a response), and Partition tolerance (system works despite network splits).",
    "What is eventual consistency?": "Eventual consistency guarantees that if no new updates are made to a piece of data, all replicas will eventually converge to the same value, accepting temporary staleness in exchange for availability.",
    "What are the different types of databases?": "Major categories include relational (SQL, ACID), document (MongoDB), key-value (Redis), column-family (Cassandra), graph (Neo4j), and time-series (InfluxDB) — each optimized for different access patterns.",
    "How does SQL differ from NoSQL?": "SQL databases use a fixed schema, support joins and complex queries, and provide strong ACID guarantees; NoSQL databases offer flexible schemas, horizontal scalability, and are optimized for specific access patterns.",
    "What is database sharding?": "Sharding partitions a database horizontally across multiple nodes by a shard key, so each node handles a subset of the data, enabling scale beyond what a single machine can support.",
    "What is database replication?": "Replication maintains copies of data on multiple nodes; primary-replica replication directs writes to one primary and asynchronously propagates them to replicas for redundancy and read scaling.",
    "What is a CDN and how does it work?": "A CDN (Content Delivery Network) caches static assets at edge nodes geographically close to users, reducing latency by serving content from nearby servers instead of the distant origin.",
    "What is caching and when should you use it?": "Caching stores frequently accessed data in fast memory (e.g., Redis) to reduce latency and backend load; use it when data is read far more often than written and staleness is acceptable.",
    "What are cache eviction policies?": "Common policies are LRU (Least Recently Used), LFU (Least Frequently Used), and FIFO; LRU is most common because it evicts the item not accessed for the longest time, approximating the working set.",
    "What is cache aside (lazy loading)?": "In cache-aside, the application checks the cache first; on a miss it queries the database, populates the cache, and returns the result — the cache is populated only on demand.",
    "What is write-through vs write-back caching?": "Write-through writes data to both cache and database synchronously on every write, ensuring consistency; write-back writes only to cache first and flushes to the database asynchronously, improving write throughput.",
    "What is message queue and why use it?": "A message queue decouples producers from consumers by storing messages in a buffer; it enables async communication, absorbs traffic spikes, and allows independent scaling of producers and consumers.",
    "What is the difference between a message queue and a pub/sub system?": "A message queue delivers each message to exactly one consumer (point-to-point); pub/sub broadcasts each message to all subscribers of a topic, enabling fan-out to multiple independent consumers.",
    "What is an API gateway?": "An API gateway is a server that acts as the single entry point for client requests, handling routing, authentication, rate limiting, SSL termination, and request transformation before forwarding to backend services.",
    "What is microservices architecture?": "Microservices decompose an application into small, independently deployable services that communicate over well-defined APIs; each service owns its data store and can be developed, deployed, and scaled independently.",
    "What is service discovery?": "Service discovery allows services in a distributed system to find each other dynamically; client-side discovery queries a service registry (e.g., Consul), while server-side discovery delegates lookup to a load balancer.",
    "What are the challenges with microservices?": "Microservices introduce network latency, distributed tracing complexity, eventual consistency challenges, operational overhead (many deployments, services), and the need for service discovery and circuit breaking.",
    "What is an event-driven architecture?": "Event-driven architecture uses events to trigger and communicate between decoupled services; producers emit events to a bus (Kafka, SNS) and consumers react asynchronously, improving scalability and resilience.",
    "What is CQRS?": "CQRS (Command Query Responsibility Segregation) separates read models from write models; commands mutate state and emit events, while queries read from a denormalized projection optimized for their access pattern.",
    "What is event sourcing?": "Event sourcing stores the full history of state-changing events rather than current state; the current state is derived by replaying events, enabling full audit trails and temporal queries.",
    "What is the two-phase commit protocol?": "Two-phase commit (2PC) coordinates distributed transactions: in phase 1 a coordinator asks all participants to prepare; in phase 2 it commits if all agree or aborts if any refuse.",
    "What is the SAGA pattern?": "The SAGA pattern manages distributed transactions as a sequence of local transactions, each publishing an event that triggers the next step; compensating transactions undo steps on failure.",
    "What is consistent hashing?": "Consistent hashing maps both servers and keys to a ring; when a server is added or removed, only the keys adjacent to that server are remapped, minimizing cache invalidation in distributed caches.",
    "What is rate limiting?": "Rate limiting restricts the number of requests a client can make in a time window to protect services from overload, abuse, and denial-of-service attacks.",
    "What are rate limiting algorithms?": "Common algorithms are token bucket (allows bursts, refills at fixed rate), leaky bucket (smooths output rate), fixed window counter (simple but allows double-rate at window boundaries), and sliding window log (accurate but memory-heavy).",
    "What is the difference between authentication and authorization?": "Authentication verifies identity (who you are); authorization determines permissions (what you are allowed to do) — authentication must succeed before authorization is evaluated.",
    "How does JWT work?": "A JWT (JSON Web Token) is a signed token containing claims (user ID, roles, expiry); the server signs it with a secret key, and recipients verify the signature without hitting a database, enabling stateless auth.",
    "What is OAuth 2.0?": "OAuth 2.0 is an authorization framework that lets third-party applications obtain limited access to a user's resources without exposing credentials, using access tokens issued by an authorization server.",
    "What is SQL injection and how do you prevent it?": "SQL injection occurs when unsanitized user input is embedded in a query, allowing attackers to execute arbitrary SQL; prevent it by using parameterized queries or prepared statements.",
    "What is XSS and how do you prevent it?": "Cross-site scripting (XSS) injects malicious scripts into web pages viewed by other users; prevent it by escaping user-supplied HTML, using Content Security Policy headers, and avoiding innerHTML with untrusted input.",
    "What is CSRF and how do you prevent it?": "CSRF (Cross-Site Request Forgery) tricks a logged-in user's browser into making unintended requests; prevent it with CSRF tokens, SameSite cookie attributes, and checking the Origin header.",
    "What is the difference between symmetric and asymmetric encryption?": "Symmetric encryption uses the same key to encrypt and decrypt (fast, used for bulk data); asymmetric encryption uses a public/private key pair (slower, used for key exchange and digital signatures).",
    "What is TLS and how does it work?": "TLS (Transport Layer Security) authenticates the server via certificates and negotiates a shared session key using asymmetric cryptography; all subsequent data is encrypted with that symmetric key.",
    "How do you design for high availability?": "Design for HA by eliminating single points of failure with redundancy, using health checks and automatic failover, deploying across multiple availability zones, and setting SLO-aligned retry and timeout policies.",
    "What is the difference between RTO and RPO?": "RTO (Recovery Time Objective) is the maximum acceptable downtime after a failure; RPO (Recovery Point Objective) is the maximum acceptable data loss — together they define the disaster recovery requirements.",
    "What are the 4 nines of availability?": "99.99% availability (four nines) allows ~52 minutes of downtime per year; higher nines require progressively more redundancy, automated failover, and geo-distribution to achieve.",
    "What is a circuit breaker?": "A circuit breaker monitors calls to a downstream service; after a threshold of failures it opens (stops sending requests), giving the service time to recover, then half-opens to test if it has recovered.",
    "What is back pressure?": "Back pressure is a flow-control mechanism where a consumer signals to a producer to slow down when the consumer cannot keep up, preventing the system from being overwhelmed by unbounded queues.",
    "What is a distributed cache?": "A distributed cache (e.g., Redis Cluster, Memcached) spans multiple nodes to share a large in-memory dataset across a cluster, providing higher throughput and capacity than a single cache server.",
    "How does Redis differ from Memcached?": "Redis supports rich data structures (strings, hashes, lists, sorted sets), persistence, pub/sub, Lua scripting, and atomic operations; Memcached is simpler, purely in-memory, and excels at high-throughput plain key-value caching.",
    "What is a bloom filter?": "A Bloom filter is a space-efficient probabilistic data structure that tests whether an element is in a set — it can have false positives (element might be in set) but never false negatives.",
    "What is a reverse proxy?": "A reverse proxy sits in front of web servers and forwards client requests to the appropriate backend, providing SSL termination, caching, compression, and hiding the internal server topology.",
    "What is long polling vs WebSockets?": "Long polling holds an HTTP connection open until the server has data to send, then closes and reopens; WebSockets establish a persistent full-duplex TCP connection, enabling real-time bidirectional communication with lower overhead.",
    "What is the difference between push and pull models in distributed systems?": "In push, the producer proactively sends data to consumers as it arrives; in pull, consumers request data on their own schedule — push gives lower latency, pull gives consumers more control over their load.",
    "What is data partitioning?": "Data partitioning divides a large dataset across multiple nodes by a partitioning scheme (hash, range, list) so each node stores and serves a portion, enabling horizontal scale of storage and compute.",
    "What is the difference between synchronous and asynchronous communication?": "Synchronous communication waits for the response before proceeding (simpler, but couples availability); asynchronous communication sends a message and continues, decoupling producer from consumer availability.",
    "What is a distributed lock?": "A distributed lock coordinates exclusive access to a shared resource across multiple nodes; implementations include Redis SETNX with TTL (Redlock algorithm) or Zookeeper ephemeral nodes.",
    "What is the leader election problem?": "Leader election ensures exactly one node in a distributed cluster acts as the coordinator at a time; algorithms like Raft's leader election use term numbers and majority quorums to guarantee safety.",
    "What is gossip protocol?": "Gossip protocol is a peer-to-peer communication mechanism where each node periodically exchanges state information with a random subset of peers, propagating information through the cluster in O(log N) rounds.",
    "What is a time-series database?": "A time-series database (e.g., InfluxDB, TimescaleDB) is optimized for storing and querying timestamped data points, offering efficient compression, downsampling, and time-range queries for metrics and telemetry.",
    "What is full-text search?": "Full-text search indexes the content of documents and allows querying by relevance; Elasticsearch uses inverted indexes to map terms to document IDs, enabling fast keyword and phrase queries at scale.",
    "What is an inverted index?": "An inverted index maps each term to the list of documents containing it; it is the core data structure of search engines, enabling O(1) lookup of which documents contain a given word.",
    "What is geospatial indexing?": "Geospatial indexing (e.g., R-trees, geohashes, S2 cells) allows efficient queries like 'find all restaurants within 5km', by spatially partitioning the Earth into regions that can be searched hierarchically.",
    "What is a columnar database?": "A columnar (column-oriented) database stores data by column rather than by row, enabling high-compression ratios and fast analytical aggregations that read only the columns needed, ideal for OLAP workloads.",
    "What is MapReduce?": "MapReduce is a programming model for processing large datasets in parallel across a cluster: the Map phase transforms input into key-value pairs; the Reduce phase aggregates values by key.",
    "What is Apache Spark and how does it differ from MapReduce?": "Spark processes data in-memory across a cluster, avoiding MapReduce's disk I/O between stages; it is 10-100x faster for iterative algorithms and supports streaming, SQL, and ML workloads.",
    "What is stream processing vs batch processing?": "Batch processing runs computations on a bounded, stored dataset at scheduled intervals; stream processing continuously processes unbounded event streams with low latency as data arrives.",
    "What is a data lake vs data warehouse?": "A data warehouse stores structured, processed data optimized for analytics queries; a data lake stores raw data in any format at low cost and processes it on read (schema-on-read).",
    "What is ETL?": "ETL (Extract, Transform, Load) is the process of extracting data from source systems, transforming it into the required format, and loading it into a data warehouse for analytics.",
    "What is a graph database?": "A graph database (e.g., Neo4j) stores nodes, edges, and properties natively, enabling efficient traversal of relationships — ideal for social networks, recommendation engines, and fraud detection.",
    "What is vector similarity search?": "Vector similarity search finds the nearest neighbors of a query vector in a high-dimensional space using indexes like HNSW or IVF-Flat, enabling semantic search and recommendation over embeddings.",
    "What is observability in distributed systems?": "Observability is the ability to understand a system's internal state from its external outputs — achieved through the three pillars: metrics (quantitative measurements), logs (event records), and traces (request timelines).",
    "What is distributed tracing?": "Distributed tracing tracks a single request as it propagates through multiple services by attaching a trace ID to all related spans, enabling you to identify latency bottlenecks and failures across service boundaries.",
    "What is the difference between monitoring and alerting?": "Monitoring continuously collects and visualizes metrics; alerting fires notifications when metrics cross defined thresholds, triggering human or automated responses to anomalies.",
    "What is SRE and what are error budgets?": "SRE (Site Reliability Engineering) applies software engineering to operations; an error budget is the acceptable downtime or error rate derived from the SLO (e.g., 0.01% for 99.99% availability), consumed by incidents and deployments.",
    "What is chaos engineering?": "Chaos engineering deliberately injects failures (killed instances, network partitions) into production to verify that the system can survive real-world faults and to discover weaknesses before they cause outages.",
    "What is the strangler fig pattern?": "The strangler fig pattern incrementally replaces a monolith by routing new or migrated functionality to new services while the old monolith handles the rest, gradually 'strangling' the legacy system.",
    "What is blue-green deployment?": "Blue-green deployment maintains two identical environments (blue = live, green = new version); traffic is switched from blue to green all at once after testing, and blue is kept for instant rollback.",
    "What is canary deployment?": "Canary deployment gradually routes a small percentage of traffic to the new version, monitoring for errors before rolling it out to all users, reducing the blast radius of bad releases.",
    "What is feature flagging?": "Feature flags are runtime configuration switches that enable or disable features without redeploying code, allowing gradual rollouts, A/B testing, and instant rollback of problematic features.",
    "What is the twelve-factor app?": "The twelve-factor app is a methodology for building portable, resilient SaaS apps: key factors include config in environment variables, stateless processes, explicit dependency declaration, and disposability.",
    "What is containerization and how does Docker work?": "Containers package an application with its dependencies into an isolated unit using Linux namespaces and cgroups; Docker provides tooling to build, ship, and run containers reproducibly across environments.",
    "What is Kubernetes?": "Kubernetes is a container orchestration platform that automates deployment, scaling, and management of containerized applications across a cluster, using controllers to maintain desired state.",
    "What is a service mesh?": "A service mesh (e.g., Istio, Linkerd) offloads cross-cutting concerns (mTLS, retries, circuit breaking, observability) from application code into a sidecar proxy layer running alongside each service.",
    "What is Infrastructure as Code?": "IaC (e.g., Terraform, Pulumi) defines and provisions infrastructure through code rather than manual processes, enabling version control, reproducibility, and automated deployments of cloud resources.",
    "What is CI/CD?": "CI (Continuous Integration) automatically builds and tests code on every commit; CD (Continuous Delivery/Deployment) automatically releases passing builds to staging or production, shortening the feedback loop.",
    "What is the difference between concurrency and parallelism?": "Concurrency is managing multiple tasks that make progress over time (possibly interleaved on one core); parallelism is executing multiple tasks simultaneously on multiple cores.",
    "What is the actor model?": "The actor model is a concurrency model where actors are independent units that communicate only by passing messages, avoiding shared mutable state and the need for locks.",
    "What is the difference between optimistic and pessimistic locking?": "Pessimistic locking acquires a lock before reading to prevent concurrent modification; optimistic locking reads without a lock and validates at write time (version check), retrying on conflict.",
    "What is a lock-free data structure?": "A lock-free data structure uses atomic operations (compare-and-swap) to allow concurrent access without locks, guaranteeing system-wide progress even if individual threads are delayed.",
    "What is the thundering herd problem?": "When a cache entry expires or a server restarts, all waiting clients simultaneously hammer the backend, causing a spike; solutions include cache stampede protection (probabilistic early expiration) and request coalescing.",
    "What is idempotency and why is it important in APIs?": "An idempotent operation produces the same result when called multiple times with the same input; it is critical for safe retries in distributed systems where networks can duplicate requests.",
    "What is the difference between at-most-once, at-least-once, and exactly-once delivery?": "At-most-once delivers without retry (may lose messages); at-least-once retries until acknowledged (may duplicate); exactly-once guarantees no loss and no duplication, requiring distributed coordination.",
    "What is a hot spot in distributed systems?": "A hot spot occurs when a disproportionate share of traffic or data is directed to one shard or server, creating a bottleneck; mitigations include adding a random prefix to keys, using consistent hashing, or caching hot data.",
    "What is database connection pooling?": "Connection pooling maintains a pool of pre-established database connections that are reused by application threads, avoiding the overhead of creating and tearing down connections on every request.",
    "What is the N+1 select problem in ORMs?": "The N+1 problem occurs when loading a collection triggers one query for the list and then N additional queries for related data; fix it with eager loading (JOIN fetch or batch fetch).",
    "What is the difference between a monolith and microservices?": "A monolith is a single deployable unit with tightly coupled components; microservices split functionality into independent services with separate deployments, enabling independent scaling but adding distributed systems complexity.",
    "What is API versioning?": "API versioning allows the API contract to evolve without breaking existing clients; common strategies are URL versioning (/v1/resource), header versioning (Accept: application/vnd.api.v1+json), and query parameter versioning.",
    "What is a webhook?": "A webhook is an HTTP callback that a server sends to a pre-configured URL when an event occurs, enabling real-time event-driven integrations without clients needing to poll.",
    "What is GraphQL and how does it differ from REST?": "GraphQL is a query language where clients specify exactly the data they need in a single request; REST uses fixed endpoints that return predefined shapes, often causing over-fetching or under-fetching.",
    "What is gRPC?": "gRPC is a high-performance RPC framework that uses Protocol Buffers for serialization and HTTP/2 for transport, providing strongly typed interfaces, bidirectional streaming, and lower overhead than JSON over HTTP.",
    "What is the difference between a process and a goroutine?": "A process is an OS-managed unit with its own memory space; a goroutine is a lightweight user-space thread managed by the Go runtime scheduler, with much lower creation cost and memory footprint.",
    "What is back-of-the-envelope estimation?": "Back-of-the-envelope estimation uses order-of-magnitude arithmetic to quickly assess whether a design can meet scale requirements, guiding decisions about database choice, caching, and sharding before detailed analysis.",
    "What are the 9s of availability?": "99% = ~3.65 days downtime/year; 99.9% = ~8.7 hours; 99.99% = ~52 minutes; 99.999% = ~5 minutes — each additional nine requires significantly more engineering investment in redundancy and failover.",
    "What is a checksum and how is it used in data integrity?": "A checksum is a small value derived from data using a hash function; by recomputing and comparing checksums, systems detect accidental corruption during storage or transmission.",
    "What is content-based routing?": "Content-based routing directs requests to different backends based on the content of the request (URL path, headers, body fields), commonly handled by an API gateway or Layer 7 load balancer.",
    "What is shadow mode deployment?": "Shadow mode sends a copy of live production traffic to a new service version without affecting the user-facing response, allowing validation of the new version's behavior under real load with zero risk.",
    "What is a fanout problem in social networks?": "Fanout is the challenge of delivering a single post or event to all followers; for users with millions of followers a naive write to each follower's feed is prohibitively expensive, requiring hybrid push-pull strategies.",
    "What is read-your-writes consistency?": "Read-your-writes consistency guarantees that after a user writes data, subsequent reads by the same user will see that write — typically implemented by routing the same user's reads to the primary replica.",
    "What is multi-tenancy?": "Multi-tenancy serves multiple customers (tenants) from a shared infrastructure; tenant data can be isolated by separate databases, separate schemas, or row-level partitioning, each with different isolation vs. cost trade-offs.",
    "What is the difference between serialization and deserialization?": "Serialization converts an in-memory object to a byte stream (JSON, Protobuf, Avro) for storage or transmission; deserialization reconstructs the object from that byte stream.",
    "What are the common serialization formats?": "Common formats include JSON (human-readable, schema-less), Protocol Buffers (compact, typed, fast), Avro (schema-based, good for streaming), and MessagePack (binary JSON with smaller size).",
    "What is a split-brain problem?": "Split-brain occurs when a network partition causes two nodes to each believe they are the sole leader, potentially leading to conflicting writes; prevention uses quorum-based protocols (majority agreement required).",
    "What is quorum in distributed systems?": "A quorum is the minimum number of nodes that must agree for a distributed operation to succeed; setting read quorum + write quorum > total replicas guarantees that every read sees the latest write.",
    "What is the difference between coordination and orchestration?": "Orchestration uses a central controller to direct other services step by step; choreography has services react to events independently, with no central coordinator — choreography is more decoupled but harder to trace.",
    "What are long-tail latency issues?": "Long-tail latency refers to the high percentile (p99, p999) response times that are much slower than the median; they are caused by GC pauses, resource contention, or network jitter and disproportionately affect user experience.",
    "What is tail latency amplification?": "In a service that fans out to N backends, the overall response latency equals the slowest backend's p99 — so even rare slow responses become common as N grows, amplifying tail latency.",
    "What is hedged requests pattern?": "The hedged requests pattern sends duplicate requests to multiple replicas and uses the first response, trading extra network load for reduced tail latency — effective when a small fraction of backends are slow.",
    "What is the difference between active-active and active-passive replication?": "Active-active has all nodes serving traffic simultaneously (higher throughput, complex conflict resolution); active-passive has replicas on standby, taking over only on primary failure (simpler, with failover latency).",
    "What is write amplification?": "Write amplification is the ratio of data actually written to disk versus data written by the application; it occurs in LSM-trees due to compaction and in SSDs due to erase-before-write — high amplification reduces write throughput and disk lifespan.",
    "What is an LSM-tree?": "An LSM-tree (Log-Structured Merge-tree) batches writes into an in-memory buffer (memtable), flushes sorted files to disk (SSTables), and periodically merges them; it provides high write throughput at the cost of read amplification and background compaction.",
    "What is a WAL?": "A Write-Ahead Log records every change before it is applied to the main data store; on crash recovery the database replays the WAL to restore all committed transactions, ensuring durability.",
    "What is a materialized view?": "A materialized view is a precomputed query result stored as a table; it speeds up complex queries at the cost of extra storage and the need to refresh when underlying data changes.",
    "What is the difference between a view and a materialized view?": "A regular view is a virtual table that re-runs its query on every access; a materialized view stores the query result physically and must be refreshed, trading staleness for query speed.",
    "What is denormalization?": "Denormalization intentionally duplicates data across tables to reduce the number of joins needed for common queries, trading update complexity and storage for faster read performance.",
    "What is a foreign key and why does it matter?": "A foreign key is a column that references the primary key of another table, enforcing referential integrity so the database prevents orphaned records and maintains consistent relationships.",
    "What is a covering index?": "A covering index includes all columns needed for a query in the index itself, allowing the database to satisfy the query entirely from the index without accessing the main table rows.",
    "What is a composite index and when should you use it?": "A composite index covers multiple columns in a defined order; use it when queries filter or sort on the same set of columns together — the leftmost prefix rule applies for which queries benefit.",
    "What is query plan analysis?": "Query plan analysis examines the execution steps a database chooses for a query (via EXPLAIN); it reveals whether indexes are used, identifies sequential scans, and guides index and query optimization.",
    "What is OLTP vs OLAP?": "OLTP (Online Transaction Processing) handles short, frequent read/write transactions (e.g., e-commerce orders); OLAP (Online Analytical Processing) runs complex aggregations over large historical datasets for business intelligence.",
    "What is a distributed hash table?": "A DHT (e.g., Chord, Kademlia) distributes key-value pairs across nodes so each node is responsible for a portion of the key space; lookups route through O(log N) hops to the responsible node.",
    "What is the difference between latency and jitter?": "Latency is the average or median time for a request; jitter is the variability in latency — high jitter causes poor user experience even when average latency is acceptable.",
    "What is an exponential backoff?": "Exponential backoff retries failed requests with exponentially increasing wait times (1s, 2s, 4s, 8s…) plus random jitter to avoid synchronized retry storms overwhelming a recovering service.",
    "What is a bulkhead pattern?": "The bulkhead pattern isolates failures by partitioning resources (thread pools, connection pools) into separate compartments per service or client, so a slowdown in one doesn't consume resources needed by others.",
    "What is a sidecar pattern?": "The sidecar pattern runs a helper container alongside the main service container; the sidecar handles cross-cutting concerns (logging, proxying, config) without modifying the main service code.",
    "What is server-sent events?": "Server-Sent Events (SSE) is a one-way HTTP streaming protocol where the server pushes events to the client over a persistent connection — simpler than WebSockets for server-to-client notifications.",
    "What is the difference between HTTP polling, long polling, and WebSockets?": "Polling repeatedly sends requests on a timer; long polling holds the connection open until data is available; WebSockets establish a persistent full-duplex connection — each offers a better latency/resource trade-off than the last.",
    "What is DNS load balancing?": "DNS load balancing returns different IP addresses for the same hostname to distribute traffic across servers; it is simple and works globally but has coarse granularity due to DNS TTL and caching.",
    "What is anycast routing?": "Anycast assigns the same IP to multiple servers in different locations; BGP routes each client's packets to the nearest server, used by CDNs and DNS providers for low-latency global traffic distribution.",
    "What is a content hash?": "A content hash (e.g., SHA-256 of a file) is used to detect changes, deduplicate content, and generate cache-busting URLs — if the content is identical the hash is identical.",
    "What is object storage vs block storage vs file storage?": "Object storage (S3) stores blobs with metadata via HTTP, optimized for large unstructured files; block storage (EBS) presents raw volumes to VMs for databases; file storage (NFS, EFS) provides shared filesystem semantics.",
    "What is a multipart upload?": "Multipart upload splits a large file into parts that are uploaded in parallel or sequentially and assembled at the destination; it enables resumable uploads and higher throughput for large objects.",
    "What is presigned URL?": "A presigned URL grants time-limited, permission-restricted access to a private object in object storage (e.g., S3) without exposing credentials, allowing clients to upload or download directly to/from storage.",
    "What is data deduplication?": "Data deduplication identifies and eliminates duplicate copies of data by comparing content hashes, storing only unique chunks and replacing duplicates with references — reducing storage footprint significantly.",
    "What is write-ahead logging vs shadow paging?": "WAL appends changes sequentially and applies them to pages in place; shadow paging copies modified pages to new locations and atomically updates the page table pointer, avoiding in-place writes.",
    "What is the purpose of a sequence in databases?": "A database sequence generates monotonically increasing unique integers, commonly used for primary key generation to avoid conflicts without locking the entire table.",
    "What is MVCC?": "MVCC (Multi-Version Concurrency Control) stores multiple versions of a row so readers see a consistent snapshot without blocking writers; writers create new versions while old ones are garbage-collected.",
    "What is a partial index?": "A partial index indexes only rows satisfying a WHERE clause, reducing index size and maintenance overhead — useful for frequently queried subsets like active records or non-null values.",
    "What is the XA protocol?": "The XA protocol is a standard interface for distributed transactions across multiple resource managers (databases, message queues); it coordinates two-phase commit across heterogeneous systems.",
    "What is a saga vs 2PC?": "2PC (Two-Phase Commit) locks all participants until all agree, providing strong consistency but poor availability; sagas use a sequence of local transactions with compensating actions on failure, offering higher availability.",
    "What is the read-modify-write problem?": "The read-modify-write problem occurs when two concurrent clients read the same value, modify it independently, and write back, causing one update to be lost; solved with optimistic locking, atomic operations, or pessimistic locking.",
    "What is a fencing token?": "A fencing token is a monotonically increasing number issued with each lock acquisition; the protected resource rejects requests with a lower token than the highest seen, preventing stale lock holders from corrupting state.",
    "What is a vector clock?": "A vector clock is a data structure (one counter per node) that tracks causality in distributed systems; comparing vector clocks reveals whether events are causally related or concurrent.",
    "What is a CRDTs?": "A CRDT (Conflict-free Replicated Data Type) is a data structure that can be replicated and updated independently on multiple nodes and always merged to a consistent result without conflicts, enabling eventual consistency.",
    "What is the difference between heartbeat and lease?": "A heartbeat is a periodic signal a node sends to prove it is alive; a lease is a time-bounded grant of a capability (e.g., leadership) that expires automatically if not renewed, preventing stale holders from acting.",
    "What is the thundering herd problem?": "The thundering herd problem occurs when many processes or threads simultaneously wake up competing for the same resource (e.g., cache miss, accept socket), causing a CPU spike; solved with semaphores, request coalescing, or jitter.",
    "What is tail-based sampling in distributed tracing?": "Tail-based sampling decides whether to keep a trace only after the full request is complete, allowing intelligent sampling that prioritizes error traces and high-latency outliers over head-based random sampling.",
    "What are the SLI/SLO/SLA concepts?": "SLI (Service Level Indicator) is a metric like availability or p99 latency; SLO (Service Level Objective) is the target value; SLA (Service Level Agreement) is a contractual commitment with consequences for breaches.",
    "What is a distributed cron?": "A distributed cron runs scheduled jobs across a cluster, ensuring each job runs exactly once even if nodes fail; systems like Kubernetes CronJobs or Quartz Scheduler coordinate execution with leader election.",
}

# ---------------------------------------------------------------------------
# Helper: generate a fallback answer for questions not in the lookup table
# ---------------------------------------------------------------------------

def generate_fallback_answer(question: str) -> str:
    """Very simple rule-based fallback for unmapped questions."""
    q = question.strip().rstrip("?")
    # Strip leading question words to turn into a statement
    q_lower = q.lower()
    if q_lower.startswith("what is the difference between "):
        terms = q[len("What is the difference between "):].strip()
        return f"The key distinction between {terms} lies in their design goals and trade-offs; consult the session content for a precise comparison."
    if q_lower.startswith("what is "):
        concept = q[len("What is "):].strip()
        return f"{concept} is a fundamental concept covered in this session; review the lesson content above for the complete definition and examples."
    if q_lower.startswith("how does ") or q_lower.startswith("how do you "):
        return f"This is answered step-by-step in the lesson content above; focus on understanding the sequence of operations and the invariants maintained."
    if q_lower.startswith("why "):
        return f"The reason is explained in the lesson; consider the trade-offs and constraints that motivate this design or behavior."
    if q_lower.startswith("when "):
        return f"The appropriate time to use this technique is discussed in the lesson; look for the conditions and problem characteristics that signal its application."
    if q_lower.startswith("can "):
        return f"This depends on the specific constraints; review the lesson to understand when this approach is valid and when alternatives are needed."
    return f"Review the lesson content above for a detailed explanation of this concept and its practical applications."


# ---------------------------------------------------------------------------
# Main processing
# ---------------------------------------------------------------------------

FILES = [
    "system-design-fundamentals.json",
    "system-design-cases.json",
    "ds-algo.json",
    "core-cs.json",
    "dsa-patterns.json",
    "design-patterns.json",
    "estimation.json",
    "interview-framework.json",
]

BASE = Path("/Users/racit/PersonalProject/guru-sishya/public/content")


def process_file(fname: str) -> tuple[int, int, int]:
    """Return (total_questions, updated_count, already_had_answer_count)."""
    fpath = BASE / fname
    with open(fpath, encoding="utf-8") as f:
        data = json.load(f)

    total = updated = had_answer = 0

    if not isinstance(data, list):
        print(f"  SKIP {fname}: top-level is not a list")
        return 0, 0, 0

    for item in data:
        plan = item.get("plan", {})
        if not isinstance(plan, dict):
            continue
        for sess in plan.get("sessions", []):
            rq = sess.get("reviewQuestions")
            if not isinstance(rq, list):
                continue
            new_rq = []
            for q in rq:
                total += 1
                if ":::" in q:
                    had_answer += 1
                    new_rq.append(q)
                    continue
                answer = ANSWERS.get(q.strip())
                if answer is None:
                    answer = generate_fallback_answer(q)
                new_rq.append(f"{q}:::{answer}")
                updated += 1
            sess["reviewQuestions"] = new_rq

    with open(fpath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")

    return total, updated, had_answer


def main() -> None:
    grand_total = grand_updated = grand_had = 0
    for fname in FILES:
        total, updated, had = process_file(fname)
        grand_total += total
        grand_updated += updated
        grand_had += had
        print(f"  {fname}: {total} questions, {updated} updated, {had} already answered")

    print(f"\nDone: {grand_total} total, {grand_updated} updated, {grand_had} already had answers")


if __name__ == "__main__":
    main()
