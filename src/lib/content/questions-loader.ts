// ────────────────────────────────────────────────────────────────────────────
// Important Questions Loader
// Parses the master MD file into structured Question objects.
// Falls back to java-qa-part*.json files if they exist.
// ────────────────────────────────────────────────────────────────────────────

export interface Question {
  id: number;
  question: string;
  answer: string;
  category: QuestionCategory;
  difficulty: "Easy" | "Medium" | "Hard";
  companies: string[];
  source: string; // e.g. "IMAGE 1", "IMAGE 13"
}

export type QuestionCategory =
  | "All Questions"
  | "Core Java"
  | "Concurrency & Threading"
  | "Spring Boot"
  | "Microservices"
  | "Database / JPA"
  | "System Design"
  | "Production & Debugging"
  | "Stream API"
  | "Company-Specific";

// ── Category detection ─────────────────────────────────────────────────────

const CATEGORY_PATTERNS: [RegExp, QuestionCategory][] = [
  [/stream|flatMap|map\(\)|findFirst|findAny|groupingBy|collector|Optional|lambda|functional interface|Predicate|Function|Consumer|Supplier|method reference|forEach|peek|intermediate|terminal|parallel stream|sequential stream/i, "Stream API"],
  [/thread|concurrent|synchroniz|volatile|deadlock|lock|ReentrantLock|ExecutorService|thread.?pool|Runnable|Callable|CAS|Compare.?And.?Swap|ThreadLocal|BlockingQueue|ForkJoinPool|CyclicBarrier|CountDownLatch|CompletableFuture|race condition|AtomicInteger|CopyOnWrite|wait\(\)|notify|sleep\(\)|JMM|Java Memory Model|fail-fast|fail-safe|ConcurrentHashMap/i, "Concurrency & Threading"],
  [/Spring Boot|@Component|@Service|@Repository|@Transactional|@Autowired|@Value|@Configuration|AutoConfiguration|Bean lifecycle|Spring Bean|Spring Security|Actuator|DevTools|@RestController|@Controller|@PostConstruct|@RequestBody|ComponentScan|SpringBootApplication|BeanFactory|ApplicationContext|ConfigurationProperties|Spring Cloud|dependency injection/i, "Spring Boot"],
  [/microservice|API Gateway|Service Discovery|Circuit Breaker|Saga|distributed trac|Kafka|RabbitMQ|Eureka|Feign|Config Server|CQRS|Event Sourcing|idempoten|rate limit|load balanc|fault toleran|sidecar|blue.?green|rolling deploy|graceful degradation|fallback|health check|service mesh/i, "Microservices"],
  [/JPA|Hibernate|N\+1|lazy.*load|eager.*load|fetch|save\(\)|persist\(\)|merge\(\)|@OneToMany|@ManyToOne|entity state|indexing|SQL|JOIN|ACID|database|pagination|sharding|read replica|optimistic lock|pessimistic lock|HikariCP|connection pool/i, "Database / JPA"],
  [/system design|design.*wallet|design.*payment|design.*chat|design.*URL|scale.*API|cach|distributed cache|Redis|Hazelcast|high.?traffic|UPI|notification system|scalable/i, "System Design"],
  [/production|debug|OutOfMemory|memory leak|GC pause|CPU.*usage|heap dump|profil|troubleshoot|monitor|performance.*drop|slow.*response|thread dump|JVM.*exit|tuning|latency|throughput/i, "Production & Debugging"],
  [/HashMap|String.*immut|equals|hashCode|OOP|abstract|interface|encapsulation|polymorphism|inheritance|JVM|JDK|JRE|Garbage Collection|G1|ZGC|CMS|classloader|Metaspace|PermGen|JIT|escape analysis|autoboxing|String.?pool|StringBuilder|StringBuffer|Reflection|Comparable|Comparator|data type|checked.*exception|unchecked.*exception|finally|try.*catch|Serializ|immutab|shallow.*copy|deep.*copy|stack.*heap|method.*overload|method.*overrid/i, "Core Java"],
];

function detectCategory(question: string, sectionTitle: string): QuestionCategory {
  // Check section title first
  const sectionLower = sectionTitle.toLowerCase();

  if (/jpmorgan|phonepe|deloitte|hashedin|hcl/i.test(sectionLower)) return "Company-Specific";
  if (/stream|functional/i.test(sectionLower)) return "Stream API";
  if (/concurrency|threading|multithreading/i.test(sectionLower)) return "Concurrency & Threading";
  if (/spring boot|spring/i.test(sectionLower) && !/microservice/i.test(sectionLower)) return "Spring Boot";
  if (/microservice/i.test(sectionLower)) return "Microservices";
  if (/jpa|hibernate|database/i.test(sectionLower)) return "Database / JPA";
  if (/system design/i.test(sectionLower)) return "System Design";
  if (/production|debug|scenario/i.test(sectionLower)) return "Production & Debugging";

  // Check question content
  for (const [pattern, category] of CATEGORY_PATTERNS) {
    if (pattern.test(question)) return category;
  }

  return "Core Java";
}

function detectCompanies(sectionTitle: string): string[] {
  const companies: string[] = [];
  if (/jpmorgan/i.test(sectionTitle)) companies.push("JPMorgan");
  if (/phonepe/i.test(sectionTitle)) companies.push("PhonePe");
  if (/deloitte|hashedin/i.test(sectionTitle)) companies.push("Deloitte");
  if (/hcl/i.test(sectionTitle)) companies.push("HCL");
  return companies;
}

function detectDifficulty(question: string, sectionTitle: string): "Easy" | "Medium" | "Hard" {
  const hard = /internal|deep dive|advanced|scenario|production|design.*system|architecture|concurren|distributed|troubleshoot|debug|tune|optimize|escape analysis|JMM|memory model|fault.?toleran/i;
  const easy = /what is|difference between|explain|define|what are|basic|fundamental|types of|purpose of|default port/i;

  if (/advanced|deep dive|internals|experienced|scenario/i.test(sectionTitle)) return "Hard";
  if (/basic|fundamental|3 years/i.test(sectionTitle)) return "Easy";

  if (hard.test(question) && !easy.test(question)) return "Hard";
  if (easy.test(question) && !hard.test(question)) return "Easy";

  return "Medium";
}

// ── MD Parser ──────────────────────────────────────────────────────────────

function parseMasterMD(md: string): Question[] {
  const questions: Question[] = [];
  let globalId = 0;

  // Split into sections by "## IMAGE" headers
  const sections = md.split(/^## /m).filter(Boolean);

  for (const section of sections) {
    const lines = section.split("\n");
    const sectionTitle = lines[0]?.trim() ?? "";

    // Skip the top-level heading
    if (sectionTitle.startsWith("# ") || sectionTitle.startsWith("Java Backend Interview")) continue;

    const sourceMatch = sectionTitle.match(/IMAGE\s+(\d+)/i);
    const source = sourceMatch ? `IMAGE ${sourceMatch[1]}` : sectionTitle.slice(0, 40);
    const companies = detectCompanies(sectionTitle);

    let currentSubsection = sectionTitle;

    for (const line of lines.slice(1)) {
      const trimmed = line.trim();

      // Track subsection headers (### ...)
      if (trimmed.startsWith("### ")) {
        currentSubsection = trimmed.replace(/^###\s*/, "");
        continue;
      }

      // Match numbered questions or bullet-point questions
      const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
      const bulletMatch = trimmed.match(/^[-*]\s+(.+)/);

      let questionText = "";
      if (numberedMatch) {
        questionText = numberedMatch[2];
      } else if (bulletMatch) {
        questionText = bulletMatch[1];
      }

      if (!questionText) continue;

      // Skip sub-items (a. b. c.) or very short lines
      if (/^[a-d]\.\s/.test(questionText)) continue;
      if (questionText.length < 15) continue;
      // Skip lines that are clearly not questions
      if (/^emphasis|^strong focus|^feedback|^additional/i.test(questionText)) continue;

      globalId++;
      const category = detectCategory(questionText, currentSubsection);
      const difficulty = detectDifficulty(questionText, sectionTitle);

      questions.push({
        id: globalId,
        question: questionText,
        answer: generateAnswer(questionText, category),
        category,
        difficulty,
        companies,
        source,
      });
    }
  }

  return questions;
}

// ── Answer generation (concise, helpful placeholder answers) ─────────────

function generateAnswer(question: string, category: QuestionCategory): string {
  const q = question.toLowerCase();
  
  // ── Extensive keyword-based real answers ─────────────────────────────────
  
  // HashMap / Collections
  if (/hashmap.*internal|hashmap.*work/i.test(q)) return `## HashMap Internal Working (Java 8+)\n\nHashMap uses an array of Node<K,V> buckets. On put(key, value):\n1. Compute hash: \`(h = key.hashCode()) ^ (h >>> 16)\` (spread high bits)\n2. Find bucket index: \`hash & (capacity - 1)\`\n3. If empty → insert. If collision → chain as linked list\n4. **Java 8+ optimization:** When bucket has 8+ entries AND capacity >= 64, linked list converts to red-black tree (O(log n) vs O(n))\n\n\\`\\`\\`java\n// Treeification thresholds\nstatic final int TREEIFY_THRESHOLD = 8;\nstatic final int UNTREEIFY_THRESHOLD = 6;\nstatic final int MIN_TREEIFY_CAPACITY = 64;\n\n// Resize: when size > capacity * loadFactor (default 0.75)\n// All entries rehashed — O(n) operation\n\\`\\`\\`\n\n**Key facts:** Default capacity=16, loadFactor=0.75. NOT thread-safe — use ConcurrentHashMap for concurrent access.`;
  
  if (/equals.*hashcode|hashcode.*equals|override equals/i.test(q)) return `## equals() and hashCode() Contract\n\n**The rule:** If \`a.equals(b)\` → \`a.hashCode() == b.hashCode()\` (MUST be true)\n\n\\`\\`\\`java\nclass Employee {\n    String id;\n    @Override public boolean equals(Object o) {\n        return this.id.equals(((Employee)o).id);\n    }\n    // hashCode NOT overridden — BUG!\n}\n\nSet<Employee> set = new HashSet<>();\nset.add(new Employee("123"));\nset.contains(new Employee("123")); // FALSE!\n// Different default hashCode → different bucket → never found\n\\`\\`\\`\n\n**Fix:** \`@Override public int hashCode() { return Objects.hash(id); }\`\n\n**Production impact:** Session caches fail silently, Sets contain duplicates, Maps return null for existing keys.`;

  if (/string.*immutable|immutable.*string/i.test(q)) return `## Why String is Immutable\n\n1. **String Pool:** \`"hello"\` is shared across the app. Mutation would affect all references\n2. **Security:** Strings in file paths, DB URLs, class names — mutation after validation = security hole\n3. **Thread Safety:** Immutable = inherently thread-safe, no synchronization needed\n4. **HashCode Caching:** String caches hashCode (computed once). Makes HashMap lookups fast\n5. **Class Loading:** Class names are strings. Immutability ensures integrity\n\n\\`\\`\\`java\nString a = "hello";\nString b = "hello";\na == b; // true — same object from string pool\n\n// String.hashCode() is cached:\nprivate int hash; // default 0\npublic int hashCode() {\n    if (hash == 0 && value.length > 0) hash = compute();\n    return hash; // cached after first call\n}\n\\`\\`\\``;

  if (/comparable.*comparator|comparator.*comparable/i.test(q)) return `## Comparable vs Comparator\n\n| | Comparable | Comparator |\n|--|-----------|------------|\n| Package | java.lang | java.util |\n| Method | compareTo(T) | compare(T, T) |\n| Orderings | One (natural) | Many (external) |\n| Modifies class? | Yes | No |\n\n\\`\\`\\`java\n// Comparable — natural order\nclass Employee implements Comparable<Employee> {\n    public int compareTo(Employee o) {\n        return Integer.compare(this.salary, o.salary);\n    }\n}\n\n// Comparator — external, multiple orders\nComparator<Employee> byName = Comparator.comparing(Employee::getName);\nComparator<Employee> bySalaryDesc = Comparator.comparingInt(Employee::getSalary).reversed();\nemployees.sort(byName.thenComparingInt(Employee::getSalary));\n\\`\\`\\``;

  if (/map\(\).*flatmap|flatmap.*map\(\)/i.test(q)) return `## map() vs flatMap()\n\n**map():** 1 input → 1 output\n**flatMap():** 1 input → Stream of outputs → flattened\n\n\\`\\`\\`java\n// map: User → String\nList<String> names = users.stream()\n    .map(User::getName)\n    .collect(Collectors.toList());\n\n// flatMap: Order → Stream<Item> → flattened\nList<Item> allItems = orders.stream()\n    .flatMap(order -> order.getItems().stream())\n    .collect(Collectors.toList());\n\n// Optional: avoid Optional<Optional<T>>\nOptional<Address> addr = user\n    .flatMap(User::getAddress); // not map()\n\\`\\`\\`\n\n**Rule:** When map() gives you Stream<Stream<T>>, use flatMap() to get Stream<T>.`;

  if (/n\+1|n\+1 problem/i.test(q)) return `## The N+1 Problem\n\nFetching 1 parent triggers N queries for children.\n\n\\`\\`\\`java\n// 1 query for orders + N queries for items = N+1!\nList<Order> orders = orderRepo.findAll(); // 1 query\nfor (Order o : orders) o.getItems().size(); // N queries\n\\`\\`\\`\n\n**Fix 1 — JOIN FETCH:**\n\\`\\`\\`java\n@Query("SELECT o FROM Order o JOIN FETCH o.items")\nList<Order> findAllWithItems();\n\\`\\`\\`\n\n**Fix 2 — @EntityGraph:**\n\\`\\`\\`java\n@EntityGraph(attributePaths = {"items"})\nList<Order> findAll();\n\\`\\`\\`\n\n**Fix 3 — @BatchSize:**\n\\`\\`\\`java\n@OneToMany @BatchSize(size = 50)\nprivate List<OrderItem> items;\n\\`\\`\\`\n\n**Detection:** Enable \`spring.jpa.show-sql=true\` and count queries.`;

  if (/@transactional|propagation/i.test(q)) return `## @Transactional\n\n**REQUIRED (default):** Joins existing tx or creates new\n**REQUIRES_NEW:** Always creates new independent tx\n\n\\`\\`\\`java\n@Transactional // REQUIRED\npublic void processOrder(Order order) {\n    orderRepo.save(order);       // Part of main tx\n    auditService.log(order);     // REQUIRES_NEW — independent\n    // If audit fails, order STILL committed\n}\n\\`\\`\\`\n\n**Self-invocation trap:**\n\\`\\`\\`java\npublic void methodA() {\n    this.methodB(); // @Transactional IGNORED!\n    // Proxy bypassed — no transaction\n}\n@Transactional\npublic void methodB() { ... }\n// Fix: inject self, or use TransactionTemplate\n\\`\\`\\``;

  if (/circuit.?breaker/i.test(q)) return `## Circuit Breaker Pattern\n\nStates: **Closed** (normal) → **Open** (blocking) → **Half-Open** (testing)\n\n\\`\\`\\`java\n@CircuitBreaker(name = "payment", fallbackMethod = "fallback")\npublic Response charge(Request req) {\n    return paymentClient.charge(req);\n}\npublic Response fallback(Request req, Exception ex) {\n    return Response.pending("Queued for retry");\n}\n\\`\\`\\`\n\n\\`\\`\\`yaml\nresilience4j.circuitbreaker:\n  instances:\n    payment:\n      slidingWindowSize: 10\n      failureRateThreshold: 50\n      waitDurationInOpenState: 30s\n\\`\\`\\`\n\n**Why not just retry?** Retrying a dead service causes retry storms. Circuit breaker fast-fails.`;

  if (/volatile/i.test(q)) return `## volatile Keyword\n\n**Guarantees visibility, NOT atomicity.**\n\n\\`\\`\\`java\nvolatile boolean running = true;\n// Thread 1: while (running) { work(); }\n// Thread 2: running = false; // immediately visible\n\n// BUT: volatile counter++ is NOT safe!\nvolatile int counter = 0;\ncounter++; // Read-modify-write = 3 ops, not atomic\n// Use AtomicInteger instead\n\\`\\`\\`\n\n**Use volatile for:** boolean flags, publishing immutable objects\n**Don't use for:** increment/decrement, complex state`;

  if (/concurrenthashmap/i.test(q)) return `## ConcurrentHashMap\n\n| | ConcurrentHashMap | synchronizedMap |\n|--|------------------|-----------------|\n| Locking | Per-node (Java 8+) | Entire map |\n| Read locking | None (lock-free) | Locks on read |\n| Null keys | NOT allowed | Allowed |\n| Iterator | Weakly consistent | Fail-fast |\n\n\\`\\`\\`java\n// Atomic operations:\nmap.putIfAbsent(key, value);\nmap.computeIfAbsent(key, k -> compute(k));\nmap.merge(key, 1, Integer::sum); // thread-safe counter\n\n// WRONG — race condition:\nif (!map.containsKey(key)) map.put(key, val);\n// RIGHT:\nmap.putIfAbsent(key, val);\n\\`\\`\\``;

  if (/bean.*lifecycle|lifecycle.*bean/i.test(q)) return `## Spring Bean Lifecycle\n\n1. Instantiation (constructor)\n2. Populate properties (@Autowired)\n3. BeanNameAware.setBeanName()\n4. ApplicationContextAware.setApplicationContext()\n5. **@PostConstruct** ← your init logic\n6. InitializingBean.afterPropertiesSet()\n7. **Bean is READY**\n8. **@PreDestroy** ← your cleanup\n9. DisposableBean.destroy()\n\n\\`\\`\\`java\n@Component\npublic class MyService {\n    @Autowired Repository repo; // Step 2\n    \n    @PostConstruct\n    public void init() { cache.warmUp(); } // Step 5\n    \n    @PreDestroy\n    public void cleanup() { conn.close(); } // Step 8\n}\n\\`\\`\\``;

  if (/groupingby|collectors/i.test(q)) return `## groupingBy() with Downstream Collectors\n\n\\`\\`\\`java\n// Group employees by department\nMap<String, List<Employee>> byDept = employees.stream()\n    .collect(Collectors.groupingBy(Employee::getDept));\n\n// Count per department\nMap<String, Long> countByDept = employees.stream()\n    .collect(Collectors.groupingBy(Employee::getDept, Collectors.counting()));\n\n// Average salary per department\nMap<String, Double> avgSalary = employees.stream()\n    .collect(Collectors.groupingBy(\n        Employee::getDept,\n        Collectors.averagingDouble(Employee::getSalary)\n    ));\n\n// Nested grouping: dept → gender → list\nMap<String, Map<String, List<Employee>>> nested = employees.stream()\n    .collect(Collectors.groupingBy(\n        Employee::getDept,\n        Collectors.groupingBy(Employee::getGender)\n    ));\n\\`\\`\\``;

  if (/idempoten/i.test(q)) return `## Idempotency\n\nAn operation is idempotent if calling it multiple times has the same effect as calling it once.\n\n**Payment example:**\n\\`\\`\\`java\n// WITHOUT idempotency — double charge!\nPOST /api/payments {amount: 100} // Timeout\nPOST /api/payments {amount: 100} // Retry — charged twice!\n\n// WITH idempotency key:\nPOST /api/payments\nHeaders: Idempotency-Key: txn_abc123\n{amount: 100}\n\n// Server checks: "I already processed txn_abc123"\n// Returns same response, no duplicate charge\n\\`\\`\\`\n\n\\`\\`\\`java\n@PostMapping("/payments")\npublic Response pay(@RequestHeader("Idempotency-Key") String key,\n                    @RequestBody PaymentReq req) {\n    Optional<Payment> existing = paymentRepo.findByIdempotencyKey(key);\n    if (existing.isPresent()) return existing.get().toResponse();\n    // Process new payment...\n}\n\\`\\`\\``;

  if (/optimistic.*pessimistic|pessimistic.*optimistic|locking/i.test(q)) return `## Optimistic vs Pessimistic Locking\n\n| | Optimistic | Pessimistic |\n|--|-----------|-------------|\n| When | Low contention | High contention |\n| How | Version check at commit | Lock row on read |\n| Performance | Better (no locks) | Worse (holds locks) |\n| Failure | OptimisticLockException | Waiting/deadlock |\n\n\\`\\`\\`java\n// Optimistic (JPA @Version)\n@Entity\nclass Product {\n    @Version\n    private Long version; // Auto-incremented on update\n}\n// If two threads read version=1 and both try to update,\n// second one gets OptimisticLockException\n\n// Pessimistic\n@Lock(LockModeType.PESSIMISTIC_WRITE)\n@Query("SELECT p FROM Product p WHERE p.id = :id")\nProduct findByIdForUpdate(Long id);\n// Locks the row — other threads wait\n\\`\\`\\`\n\n**Use Optimistic for:** read-heavy, rare conflicts (e-commerce catalog)\n**Use Pessimistic for:** write-heavy, critical sections (inventory, banking)`;

  // ── Fallback patterns for remaining questions ─────────────────────────
  
  if (/difference between|vs\b/i.test(q)) {
    const parts = question.match(/(?:difference between|vs\.?)\s*(.+?)(?:\s+and\s+|\s+vs\.?\s+)(.+?)[\?\.\,]?$/i);
    if (parts) {
      const a = parts[1].trim(), b = parts[2].trim();
      return \`## \${a} vs \${b}\n\n| Aspect | \${a} | \${b} |\n|--------|---------|---------|\n| Purpose | Primary use case for \${a} | Primary use case for \${b} |\n| Performance | Depends on workload | Depends on workload |\n| When to use | When you need \${a}-specific features | When you need \${b}-specific features |\n\n**Key Insight:** The choice depends on your specific requirements — data volume, consistency needs, and performance constraints.\n\n**Interview Tip:** Don't just list differences. Explain WHEN you'd choose one over the other with a real project example. Say: "In my project, I chose \${a} because..." This shows practical experience.\`;
    }
  }

  if (/how does.*work|explain.*internal|working|mechanism/i.test(q)) {
    const topic = question.replace(/^\d+\.\s*/, '').replace(/\?.*$/, '').trim();
    return \`## \${topic}\n\n**How it works internally:**\n\n1. **Initialization:** The component sets up its internal data structures and configuration\n2. **Processing:** Incoming requests/data are processed through the core algorithm\n3. **Optimization:** Java 8+ includes performance optimizations (lazy evaluation, caching)\n\n**Key implementation details:**\n- Underlying data structure and why it was chosen\n- Thread-safety guarantees and synchronization mechanism\n- Memory management and garbage collection interaction\n\n**Performance characteristics:**\n- Time complexity for common operations\n- Space complexity and memory overhead\n- Bottlenecks under high load\n\n\\\`\\\`\\\`java\n// Typical usage pattern:\n// 1. Create/obtain instance\n// 2. Configure as needed\n// 3. Use in your application\n// 4. Handle edge cases\n\\\`\\\`\\\`\n\n**Interview Tip:** Draw a diagram showing the flow. Explain with a real scenario from your project.\`;
  }

  if (/design|implement|how would you/i.test(q)) {
    return \`## Design Approach\n\n**Step 1 — Requirements:**\n- Functional: What must the system do?\n- Non-functional: Scale, latency, availability targets\n\n**Step 2 — High-Level Design:**\n- API layer (REST/gRPC)\n- Service layer (business logic)\n- Data layer (SQL/NoSQL choice)\n- Caching strategy (Redis)\n- Async processing (Kafka/RabbitMQ)\n\n**Step 3 — Deep Dive:**\n- Database schema and indexing\n- Concurrency handling\n- Error handling and retry logic\n- Monitoring and alerting\n\n**Step 4 — Trade-offs:**\n- Consistency vs Availability\n- Latency vs Throughput\n- Simplicity vs Scalability\n\n**Interview Tip:** Start with requirements (5 min), then high-level design (10 min), then deep dive into 1-2 components (15 min). Always discuss trade-offs.\`;
  }

  if (/why|when|should/i.test(q)) {
    const topic = question.replace(/^\d+\.\s*/, '').replace(/[\?].*$/, '').replace(/^(why|when|should)\s+(you|we|i)\s*/i, '').trim();
    return \`## \${topic}\n\n**Why it matters:**\nThis addresses a real problem in production systems — without understanding this, you risk performance issues, bugs, or architectural mistakes.\n\n**When to use:**\n- High-throughput systems where performance matters\n- Applications with strict data consistency requirements\n- When you need to scale beyond a single instance\n\n**When NOT to use:**\n- Over-engineering simple CRUD applications\n- When simpler alternatives exist and meet requirements\n- Premature optimization without measured bottlenecks\n\n**Production experience:**\nIn real projects, this decision is driven by measured performance data, not assumptions. Profile first, optimize second.\n\n**Interview Tip:** Share a specific scenario: "In my project at [company], we faced [problem] and chose [solution] because [trade-off reasoning]."\`;
  }

  // Default — still much better than before
  const topic = question.replace(/^\d+\.\s*/, '').replace(/[\?]$/, '').trim();
  return \`## \${topic}\n\n**Core Concept:**\nThis is a key topic in \${category}. Understanding it deeply shows senior-level thinking.\n\n**What interviewers want to hear:**\n1. Clear definition in your own words (not textbook)\n2. Internal mechanism — how it works under the hood\n3. Real-world usage from YOUR experience\n4. Trade-offs — pros, cons, and alternatives\n5. What can go wrong in production\n\n**Code Example:**\n\\\`\\\`\\\`java\n// Demonstrate the concept with a practical example\n// that shows you've used this in real projects\n\\\`\\\`\\\`\n\n**Common Mistake:** Giving a textbook answer without real-world context. Interviewers want to know you've USED this, not just read about it.\n\n**Interview Tip:** Structure your answer as: Definition → How it works → When I used it → Trade-offs. This shows depth and experience.\`;
}



// ── JSON loader (for future java-qa-part*.json files) ──────────────────

interface JsonQuestion {
  id?: number;
  question: string;
  answer: string;
  category?: string;
  difficulty?: string;
  companies?: string[];
  source?: string;
}

async function loadFromJSON(): Promise<Question[] | null> {
  const parts: Question[] = [];
  let partNum = 1;
  let found = false;

  // Try loading java-qa-part1.json, part2.json, etc.
  while (partNum <= 20) {
    try {
      const response = await fetch(`/content/java-qa-part${partNum}.json`);
      if (!response.ok) break;
      found = true;
      const data = (await response.json()) as JsonQuestion[];
      for (const item of data) {
        parts.push({
          id: item.id ?? parts.length + 1,
          question: item.question,
          answer: item.answer,
          category: (item.category as QuestionCategory) ?? "Core Java",
          difficulty: (item.difficulty as "Easy" | "Medium" | "Hard") ?? "Medium",
          companies: item.companies ?? [],
          source: item.source ?? `Part ${partNum}`,
        });
      }
      partNum++;
    } catch {
      break;
    }
  }

  return found ? parts : null;
}

// ── Public API ─────────────────────────────────────────────────────────────

let _questionsCache: Question[] | null = null;

/**
 * Load all important questions.
 * Tries JSON files first, falls back to parsing the MD file.
 * Results are cached in memory.
 */
export async function loadImportantQuestions(): Promise<Question[]> {
  if (_questionsCache !== null) return _questionsCache;

  // Try JSON files first
  const jsonQuestions = await loadFromJSON();
  if (jsonQuestions && jsonQuestions.length > 0) {
    _questionsCache = jsonQuestions;
    return jsonQuestions;
  }

  // Fall back to MD parsing
  try {
    const response = await fetch("/content/java_interview_questions_master.md");
    if (!response.ok) {
      _questionsCache = [];
      return [];
    }
    const md = await response.text();
    const questions = parseMasterMD(md);
    _questionsCache = questions;
    return questions;
  } catch {
    _questionsCache = [];
    return [];
  }
}

/**
 * Get all unique categories from loaded questions.
 */
export function getCategories(): QuestionCategory[] {
  return [
    "All Questions",
    "Core Java",
    "Concurrency & Threading",
    "Spring Boot",
    "Microservices",
    "Database / JPA",
    "System Design",
    "Production & Debugging",
    "Stream API",
    "Company-Specific",
  ];
}

/**
 * Clear cache (for testing or forced reload).
 */
export function clearQuestionsCache(): void {
  _questionsCache = null;
}
