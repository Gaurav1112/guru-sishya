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
  | "Company-Specific"
  | "Kafka"
  | "AWS"
  | "Kubernetes & Docker"
  | "Design Patterns";

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
  
  // Comprehensive keyword-to-answer mapping
  const answers: [RegExp, string][] = [
    [/hashmap.*internal|hashmap.*work/i, 
      "## HashMap Internal Working (Java 8+)\n\nHashMap uses an array of Node<K,V> buckets.\n\n**On put(key, value):**\n1. Compute hash: (h = key.hashCode()) ^ (h >>> 16)\n2. Find bucket: hash & (capacity - 1)\n3. If empty → insert. If collision → chain as linked list\n4. Java 8+: When bucket has 8+ entries AND capacity >= 64, list converts to red-black tree (O(log n) vs O(n))\n\n**Key thresholds:** TREEIFY_THRESHOLD=8, UNTREEIFY_THRESHOLD=6, MIN_TREEIFY_CAPACITY=64\n\n**Resize:** When size > capacity × loadFactor (default 0.75), table doubles and all entries rehash — O(n) operation.\n\n**Thread Safety:** NOT thread-safe. Use ConcurrentHashMap for concurrent access."],
    
    [/equals.*hashcode|hashcode.*equals|override equals/i,
      "## equals() and hashCode() Contract\n\n**The Rule:** If a.equals(b) is true, then a.hashCode() MUST equal b.hashCode()\n\n**What breaks:** If you override equals() but not hashCode(), HashMap/HashSet malfunction. Two equal objects get different hash codes → land in different buckets → HashSet.contains() returns false for an object that IS in the set.\n\n**Fix:** Always override both. Use Objects.hash(field1, field2) for convenience.\n\n**Production Impact:** Session caches fail silently, Sets contain duplicates, Maps return null for existing keys. This is one of the most common bugs in Java applications."],
    
    [/string.*immutable|immutable.*string/i,
      "## Why String is Immutable\n\n1. **String Pool:** 'hello' is shared across the app. Mutation would affect all references\n2. **Security:** Strings in file paths, DB URLs — mutation after validation = security hole\n3. **Thread Safety:** Immutable = inherently thread-safe, no sync needed\n4. **HashCode Caching:** String caches its hashCode (computed once, reused forever)\n5. **Class Loading:** Class names are strings. Immutability ensures loading integrity\n\nString a = 'hello'; String b = 'hello'; a == b is TRUE (same pool object)."],
    
    [/comparable.*comparator|comparator.*comparable/i,
      "## Comparable vs Comparator\n\n**Comparable** = natural ordering, implemented BY the class (compareTo method)\n**Comparator** = custom ordering, implemented OUTSIDE (compare method)\n\nComparable: java.lang, one natural order, modifies the class\nComparator: java.util, multiple orders, doesn't modify class, supports lambdas\n\nUse Comparable for the default sort order. Use Comparator for multiple sort strategies (by name, by salary, by date)."],
    
    [/map\(\).*flatmap|flatmap.*map/i,
      "## map() vs flatMap()\n\nmap(): 1 input → 1 output (transforms each element)\nflatMap(): 1 input → Stream of outputs → flattened into single stream\n\nUse map() when transformation is 1:1 (User → name). Use flatMap() when each element maps to a collection (Order → List<Item>) and you want a flat result.\n\nWith Optional: flatMap() avoids Optional<Optional<T>> nesting."],
    
    [/n\+1|n\+1 problem/i,
      "## The N+1 Problem\n\nFetching 1 parent triggers N additional queries for its children. 100 orders = 101 queries!\n\n**Fix 1 — JOIN FETCH:** @Query('SELECT o FROM Order o JOIN FETCH o.items')\n**Fix 2 — @EntityGraph:** @EntityGraph(attributePaths = {'items'})\n**Fix 3 — @BatchSize:** @BatchSize(size = 50) on the collection\n\n**Detection:** Enable spring.jpa.show-sql=true and count queries."],
    
    [/@transactional|propagation|requires_new/i,
      "## @Transactional\n\nREQUIRED (default): Joins existing transaction or creates new\nREQUIRES_NEW: Always creates new independent transaction\n\n**Self-invocation trap:** Calling @Transactional method from within the same class bypasses the proxy — NO transaction! Fix: inject self or use TransactionTemplate.\n\n**Rollback:** By default only rolls back on unchecked exceptions. Add rollbackFor=Exception.class for checked exceptions."],
    
    [/circuit.?breaker/i,
      "## Circuit Breaker Pattern\n\nPrevents cascade failures. States: Closed (normal) → Open (blocking after failures) → Half-Open (testing with limited requests).\n\nUse Resilience4j: @CircuitBreaker with fallbackMethod. Configure slidingWindowSize, failureRateThreshold, waitDurationInOpenState.\n\nWhy not just retry? Retrying a dead service causes retry storms. Circuit breaker fast-fails, giving downstream time to recover."],
    
    [/volatile/i,
      "## volatile Keyword\n\nGuarantees VISIBILITY but NOT atomicity. When Thread 2 writes a volatile variable, Thread 1 immediately sees the new value.\n\nBUT: volatile counter++ is NOT safe! It is read-modify-write (3 operations). Use AtomicInteger instead.\n\nUse volatile for: boolean flags, double-checked locking. Don't use for: counters, complex state."],
    
    [/concurrenthashmap/i,
      "## ConcurrentHashMap\n\nJava 8+: Per-node locking (CAS for first node, synchronized for collisions). Reads are lock-free. Null keys/values NOT allowed.\n\nAtomic operations: putIfAbsent(), computeIfAbsent(), merge(key, 1, Integer::sum).\n\nCommon mistake: if (!map.containsKey(key)) map.put(key, val) — RACE CONDITION! Use putIfAbsent() instead."],
    
    [/bean.*lifecycle|lifecycle.*bean/i,
      "## Spring Bean Lifecycle\n\n1. Constructor → 2. @Autowired injection → 3. BeanNameAware → 4. ApplicationContextAware → 5. @PostConstruct → 6. afterPropertiesSet() → 7. READY → 8. @PreDestroy → 9. destroy()\n\nMost important: @PostConstruct (init logic) and @PreDestroy (cleanup). Use @PostConstruct to warm caches, validate config."],
    
    [/groupingby|downstream.*collector/i,
      "## groupingBy() with Downstream Collectors\n\nGroup + count: groupingBy(Employee::getDept, counting())\nGroup + average: groupingBy(Employee::getDept, averagingDouble(Employee::getSalary))\nGroup + collect: groupingBy(Employee::getDept, mapping(Employee::getName, toList()))\nNested: groupingBy(dept, groupingBy(gender))"],
    
    [/idempoten/i,
      "## Idempotency\n\nCalling an operation multiple times has the same effect as once. Critical for payment systems.\n\nUse idempotency keys: client sends a unique key with each request. Server checks if already processed. If yes, returns cached response. No duplicate charges.\n\nHTTP: GET, PUT, DELETE are idempotent. POST is NOT."],
    
    [/optimistic.*pessimistic|pessimistic.*optimistic|lock.*strategy/i,
      "## Optimistic vs Pessimistic Locking\n\nOptimistic: Uses @Version column. No locks held. On commit, checks if version changed. If conflict → OptimisticLockException. Best for: read-heavy, low contention.\n\nPessimistic: SELECT ... FOR UPDATE. Locks the row. Other threads wait. Best for: write-heavy, high contention (banking, inventory)."],
    
    [/stream.*parallel|parallel.*stream/i,
      "## Parallel Streams\n\nUses ForkJoinPool.commonPool() (CPU cores - 1 threads). Good for CPU-bound operations on large datasets (>10K elements).\n\nNOT good for: I/O operations, small datasets, operations with side effects, when order matters.\n\nDanger: Shared mutable state in parallel streams causes race conditions. Always use thread-safe collectors."],
    
    [/garbage.*collect|gc.*work|g1.*gc|zgc/i,
      "## Garbage Collection\n\nJVM automatically reclaims memory from unreachable objects.\n\n**G1 GC (default since Java 9):** Divides heap into regions. Collects regions with most garbage first (Garbage-First). Targets pause time (default 200ms).\n\n**ZGC (Java 15+):** Sub-millisecond pauses regardless of heap size. Uses colored pointers and load barriers. Best for: low-latency applications.\n\nTuning: -Xmx (max heap), -XX:MaxGCPauseMillis (G1 target), -XX:+UseZGC."],
    
    [/memory.*leak|leak.*java/i,
      "## Memory Leaks in Java\n\nCommon causes:\n1. Static collections that grow forever\n2. Unclosed resources (streams, connections)\n3. Inner class holding reference to outer class\n4. ThreadLocal not removed after use\n5. Listeners/callbacks not deregistered\n\nDetection: jmap -histo:live, Eclipse MAT, VisualVM. Monitor heap usage over time — if it keeps growing after GC, you have a leak."],
    
    [/thread.*pool|executor.*service|threadpool/i,
      "## Thread Pools\n\nnewFixedThreadPool(n): Fixed size, unbounded queue (OOM risk!)\nnewCachedThreadPool(): Grows/shrinks, 60s keep-alive\nnewSingleThreadExecutor(): 1 thread, guaranteed ordering\n\nBest practice: Use ThreadPoolExecutor directly with bounded queue and rejection policy.\n\nCommon mistake: Using newFixedThreadPool with unbounded queue. Under load, the queue grows until OOM. Always set a bounded queue + CallerRunsPolicy."],
    
    [/deadlock/i,
      "## Deadlock\n\nTwo+ threads each waiting for a lock held by the other.\n\nFour conditions (ALL must hold): 1. Mutual exclusion 2. Hold-and-wait 3. No preemption 4. Circular wait\n\nPrevention: Enforce lock ordering (always acquire locks in the same order). Detection: jstack <pid> shows BLOCKED threads and lock owners.\n\nProduction tip: Use tryLock() with timeout instead of synchronized for critical sections."],
    
    [/singleton/i,
      "## Singleton Pattern\n\nThread-safe Singleton using double-checked locking:\nprivate static volatile Singleton instance;\npublic static Singleton getInstance() { if (instance == null) { synchronized(Singleton.class) { if (instance == null) instance = new Singleton(); } } return instance; }\n\nBetter: Use enum Singleton (inherently thread-safe, serialization-safe).\nBest: Use Spring @Component (singleton scope by default)."],
    
    [/spring.*security|authentication.*authorization/i,
      "## Spring Security\n\nFilter chain processes every request: SecurityContextPersistenceFilter → UsernamePasswordAuthenticationFilter → ExceptionTranslationFilter → FilterSecurityInterceptor\n\nJWT flow: 1. Login → validate credentials → generate JWT 2. Subsequent requests → extract JWT from header → validate → set SecurityContext\n\n@PreAuthorize('hasRole(ADMIN)') for method-level security. @EnableMethodSecurity to activate."],
    
    [/kafka|message.*queue|event.*driven/i,
      "## Kafka\n\nDistributed event streaming platform. Topics → Partitions → Consumer Groups.\n\nOrdering: Guaranteed within a partition (use partition key). Not across partitions.\n\nDelivery: at-least-once (default), exactly-once (with transactions), at-most-once (auto-commit).\n\nKey configs: acks=all (durability), enable.idempotence=true, max.in.flight=5.\n\nConsumer groups: Each partition consumed by exactly one consumer in a group. Scale by adding consumers (up to partition count)."],
  ];
  
  // Check specific answers first
  for (const [pattern, answer] of answers) {
    if (pattern.test(q)) return answer;
  }
  
  // Fallback: context-aware answer based on question structure
  if (/difference between|vs\b/i.test(q)) {
    const parts = question.match(/(?:difference between|vs\.?)\s*(.+?)(?:\s+and\s+|\s+vs\.?\s+)(.+?)[\?\.\,]?$/i);
    if (parts) {
      const a = parts[1].trim(), b = parts[2].trim();
      return "## " + a + " vs " + b + "\n\n**" + a + ":** Primary use case, performance characteristics, when to use\n**" + b + ":** Primary use case, performance characteristics, when to use\n\n**Key Difference:** The choice depends on your specific requirements. " + a + " excels in certain scenarios while " + b + " is better in others.\n\n**Interview Tip:** Don't just list differences. Explain WHEN you'd choose one over the other with a real project example.";
    }
  }
  
  if (/how does.*work|explain.*internal|mechanism/i.test(q)) {
    return "## How It Works\n\n**Internal Flow:**\n1. Initialization and setup\n2. Core processing with specific data structures\n3. Optimization and result handling\n\n**Key Details:** Understand the underlying data structure, thread-safety guarantees, and performance characteristics (time/space complexity).\n\n**Interview Tip:** Draw a diagram showing the internal flow. Explain with a real scenario from your project experience.";
  }
  
  if (/design|implement|how would you/i.test(q)) {
    return "## Design Approach\n\n**Step 1 — Requirements:** Functional + Non-functional (scale, latency, availability)\n**Step 2 — High-Level Design:** Components, data flow, technology choices\n**Step 3 — Deep Dive:** Database schema, concurrency, error handling\n**Step 4 — Trade-offs:** Consistency vs Availability, Latency vs Throughput\n\n**Interview Tip:** Start with requirements (5 min), high-level (10 min), deep dive (15 min). Always discuss trade-offs.";
  }
  
  // Generic but useful answer
  return "## " + category + "\n\n**Key Points:**\n1. **Definition:** Clear, concise explanation in your own words\n2. **How it works:** Internal mechanism and key data structures\n3. **When to use:** Specific scenarios from real projects\n4. **Trade-offs:** Pros, cons, and alternatives\n5. **Production impact:** What can go wrong and how to prevent it\n\n**Interview Tip:** Structure as Definition → Mechanism → Experience → Trade-offs. Show you've used this in production, not just read about it.";
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

function extractQuestions(raw: unknown, batchLabel: string): JsonQuestion[] {
  // Handle different batch file formats:
  // 1. Array of questions: [{question, answer, ...}, ...]
  // 2. Object with "questions" array: {metadata: ..., questions: [...]}
  // 3. Object with "answers" dict: {answers: {"65": {question, answer, ...}, ...}}
  if (Array.isArray(raw)) return raw as JsonQuestion[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.questions)) return obj.questions as JsonQuestion[];
    if (obj.answers && typeof obj.answers === "object") {
      return Object.values(obj.answers as Record<string, JsonQuestion>);
    }
  }
  return [];
}

async function loadFromJSON(): Promise<Question[] | null> {
  const parts: Question[] = [];
  let found = false;

  // Try loading java-qa-all.json first (combined file)
  try {
    const response = await fetch("/content/java-qa-all.json");
    if (response.ok) {
      const data = (await response.json()) as JsonQuestion[];
      if (Array.isArray(data) && data.length > 0) {
        found = true;
        for (const item of data) {
          parts.push({
            id: item.id ?? parts.length + 1,
            question: item.question,
            answer: item.answer,
            category: (item.category as QuestionCategory) ?? "Core Java",
            difficulty: (item.difficulty as "Easy" | "Medium" | "Hard") ?? "Medium",
            companies: item.companies ?? [],
            source: item.source ?? "java-qa",
          });
        }
      }
    }
  } catch {
    // ignore
  }

  // If java-qa-all.json didn't load, try individual batch files
  if (!found) {
    for (let batchNum = 1; batchNum <= 20; batchNum++) {
      const padded = String(batchNum).padStart(2, "0");
      try {
        const response = await fetch(`/content/java-qa-batch${padded}.json`);
        if (!response.ok) continue;
        found = true;
        const raw = await response.json();
        const items = extractQuestions(raw, `batch${padded}`);
        for (const item of items) {
          parts.push({
            id: item.id ?? parts.length + 1,
            question: item.question,
            answer: item.answer,
            category: (item.category as QuestionCategory) ?? "Core Java",
            difficulty: (item.difficulty as "Easy" | "Medium" | "Hard") ?? "Medium",
            companies: item.companies ?? [],
            source: item.source ?? `Batch ${batchNum}`,
          });
        }
      } catch {
        continue;
      }
    }
  }

  // Also try legacy java-qa-part*.json files
  if (!found) {
    for (let partNum = 1; partNum <= 20; partNum++) {
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
      } catch {
        break;
      }
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
  let allQuestions: Question[] = jsonQuestions ?? [];

  // If no Java Q&A JSON files, fall back to MD parsing
  if (allQuestions.length === 0) {
    try {
      const response = await fetch("/content/java_interview_questions_master.md");
      if (response.ok) {
        const md = await response.text();
        allQuestions = parseMasterMD(md);
      }
    } catch {
      // ignore
    }
  }

  // Load additional Q&A files (Kafka, AWS, K8s/Docker)
  const additionalFiles: { file: string; category: QuestionCategory }[] = [
    { file: "/content/kafka-qa.json", category: "Kafka" },
    { file: "/content/aws-qa.json", category: "AWS" },
    { file: "/content/k8s-docker-qa.json", category: "Kubernetes & Docker" },
    { file: "/content/design-patterns-qa.json", category: "Design Patterns" },
  ];

  const startId = allQuestions.length > 0
    ? Math.max(...allQuestions.map((q) => q.id)) + 1
    : 1;
  let nextId = startId;

  for (const { file, category } of additionalFiles) {
    try {
      const response = await fetch(file);
      if (!response.ok) continue;
      const data = (await response.json()) as {
        question: string;
        answer: string;
        category?: string;
        difficulty?: string;
        example?: string;
      }[];
      for (const item of data) {
        const answer = item.example
          ? `${item.answer}\n\n### Example\n\`\`\`\n${item.example}\n\`\`\``
          : item.answer;
        // Map sub-categories to the parent category from the file.
        // Sub-categories like "Kafka Basics", "EC2", "Docker", "Creational"
        // all get mapped to the parent: Kafka, AWS, Kubernetes & Docker, Design Patterns.
        const itemCategory: QuestionCategory = category;
        allQuestions.push({
          id: nextId++,
          question: item.question,
          answer,
          category: itemCategory,
          difficulty: mapDifficulty(item.difficulty),
          companies: [],
          source: category,
        });
      }
    } catch {
      // Non-critical — file may not exist yet
    }
  }

  _questionsCache = allQuestions;
  return allQuestions;
}

function mapDifficulty(d?: string): "Easy" | "Medium" | "Hard" {
  if (!d) return "Medium";
  const lower = d.toLowerCase();
  if (lower === "beginner" || lower === "easy") return "Easy";
  if (lower === "advanced" || lower === "hard") return "Hard";
  return "Medium";
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
    "Kafka",
    "AWS",
    "Kubernetes & Docker",
    "Design Patterns",
    "Company-Specific",
  ];
}

/**
 * Clear cache (for testing or forced reload).
 */
export function clearQuestionsCache(): void {
  _questionsCache = null;
}
