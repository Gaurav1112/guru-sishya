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
  // Provide structured answer templates based on question patterns
  const q = question.toLowerCase();

  if (/difference between|vs\b/i.test(q)) {
    const parts = question.match(/(?:difference between|vs\.?)\s*(.+?)(?:\s+and\s+|\s+vs\.?\s+)(.+?)[\?\.]?$/i);
    if (parts) {
      return `## ${parts[1].trim()} vs ${parts[2].trim()}

| Aspect | ${parts[1].trim()} | ${parts[2].trim()} |
|--------|---------|---------|
| Purpose | Specific use case | Specific use case |
| Performance | Varies | Varies |
| Thread Safety | Check docs | Check docs |

**Key Insight:** Understanding when to use each is more important than memorizing differences. Consider the specific requirements of your use case.

**Interview Tip:** Always provide a real-world example from your project experience.`;
    }
  }

  if (/how does.*work|explain.*internal|working/i.test(q)) {
    return `## How It Works

**High-Level Flow:**
1. Initial setup and initialization
2. Core processing logic
3. Result handling and cleanup

**Internal Details:**
- Data structures used internally
- Algorithm complexity and trade-offs
- Edge cases to be aware of

**Production Considerations:**
- Performance implications
- Memory usage patterns
- Common pitfalls to avoid

**Interview Tip:** Draw a diagram to explain the flow. Interviewers value visual explanations.`;
  }

  if (/design|implement|how would you/i.test(q)) {
    return `## Design Approach

**Requirements:**
- Functional requirements
- Non-functional requirements (scalability, reliability)

**Architecture:**
- Component breakdown
- Data flow between components
- Technology choices and justification

**Key Decisions:**
- Trade-offs considered
- Scalability strategy
- Fault tolerance mechanisms

**Interview Tip:** Start with requirements, then high-level design, then dive into details. Show you think systematically.`;
  }

  if (/why|when|should/i.test(q)) {
    return `## Understanding the "Why"

**Core Reason:**
This exists to solve a specific problem in software development. Understanding the motivation helps you make better architectural decisions.

**When to Use:**
- Scenario 1: High-throughput systems
- Scenario 2: Data consistency requirements
- Scenario 3: Specific use case from your projects

**When NOT to Use:**
- Over-engineering simple solutions
- When simpler alternatives exist

**Interview Tip:** Share a real scenario where you made this decision (or would make it). Show practical judgment.`;
  }

  // Default structured answer
  return `## ${category}

**Answer:**
This is an important concept in ${category.toLowerCase()}. The key points to cover are:

1. **Definition** - Clear, concise explanation
2. **How it works** - Internal mechanism or flow
3. **Real-world usage** - When and where you'd use this
4. **Trade-offs** - Pros, cons, and alternatives
5. **Production impact** - What can go wrong

**Code Example:**
\`\`\`java
// Demonstrate with a practical code snippet
// that shows the concept in action
\`\`\`

**Interview Tip:** Connect your answer to real project experience. Mention specific scenarios where this knowledge helped you debug or design better systems.`;
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
